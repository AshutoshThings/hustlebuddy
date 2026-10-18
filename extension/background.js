importScripts("config.js");

const QUEUE_KEY = "pendingApplications";
const STATUSES = ["applied", "interviewing", "offered", "rejected"];
const EXPIRY_SKEW_MS = 30_000;

// ---------------------------------------------------------------- tokens

function jwtExpiryMs(token) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(part));
    return payload.exp ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

async function saveToken(accessToken) {
  await chrome.storage.local.set({
    accessToken,
    expiresAt: jwtExpiryMs(accessToken),
  });
}

function clearToken() {
  return chrome.storage.local.remove(["accessToken", "expiresAt"]);
}

// One refresh at a time: concurrent refreshes would race on token rotation.
let refreshInFlight = null;
function silentRefresh() {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${APP_ORIGIN}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data) => {
        if (!data?.accessToken) return null;
        await saveToken(data.accessToken);
        flushQueue(data.accessToken).catch(() => {});
        return data.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function getValidToken() {
  const { accessToken, expiresAt } = await chrome.storage.local.get([
    "accessToken",
    "expiresAt",
  ]);
  if (accessToken && expiresAt && Date.now() < expiresAt - EXPIRY_SKEW_MS)
    return accessToken;
  return silentRefresh(); // null when it can't
}

function isFromApp(sender) {
  try {
    return new URL(sender.url).origin === APP_ORIGIN;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------- applications

function sanitizeApp(app) {
  const company = String(app?.company ?? "")
    .trim()
    .slice(0, 200);
  const role = String(app?.role ?? "")
    .trim()
    .slice(0, 200);
  if (!company || !role) return null;
  return {
    company,
    role,
    status: STATUSES.includes(app?.status) ? app.status : "applied",
    source: app?.source ? String(app.source).slice(0, 100) : undefined,
  };
}

function postApplication(token, app) {
  return fetch(`${APP_ORIGIN}/api/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(app),
  });
}

async function enqueue(app) {
  const { [QUEUE_KEY]: queue = [] } = await chrome.storage.local.get(QUEUE_KEY);
  queue.push(app);
  await chrome.storage.local.set({ [QUEUE_KEY]: queue.slice(-20) });
}

let flushing = null;
function flushQueue(token) {
  if (!flushing) {
    flushing = doFlush(token).finally(() => {
      flushing = null;
    });
  }
  return flushing;
}

async function doFlush(token) {
  const { [QUEUE_KEY]: queue = [] } = await chrome.storage.local.get(QUEUE_KEY);
  if (!queue.length) return;

  const remaining = [];
  for (const app of queue) {
    try {
      const res = await postApplication(token, app);
      // Keep it for a retry only if the failure could be temporary.
      if (!res.ok && (res.status === 401 || res.status >= 500))
        remaining.push(app);
    } catch {
      remaining.push(app);
    }
  }

  // Keep anything queued while we were busy.
  const { [QUEUE_KEY]: latest = [] } =
    await chrome.storage.local.get(QUEUE_KEY);
  await chrome.storage.local.set({
    [QUEUE_KEY]: [...remaining, ...latest.slice(queue.length)],
  });
}

async function logApplication(app) {
  const token = await getValidToken();
  if (!token) {
    await enqueue(app);
    return { ok: false, reason: "auth", queued: true };
  }

  try {
    const res = await postApplication(token, app);
    if (res.status === 401) {
      await clearToken();
      await enqueue(app);
      return { ok: false, reason: "auth", queued: true };
    }
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return {
        ok: false,
        reason: "server",
        message: body?.response || "Failed to save",
      };
    }
    return { ok: true };
  } catch {
    await enqueue(app);
    return {
      ok: false,
      reason: "network",
      queued: true,
      message: "Offline. Saved for later.",
    };
  }
}

async function getAuthState() {
  const token = await getValidToken();
  const { [QUEUE_KEY]: queue = [] } = await chrome.storage.local.get(QUEUE_KEY);
  return { connected: Boolean(token), pending: queue.length };
}

async function storeToken(token, sender) {
  await saveToken(token);
  flushQueue(token).catch(() => {});

  // Only the dedicated connect page closes itself. Background syncs from the
  // dashboard must never close the tab you're using.
  const tabId = sender.tab?.id;
  if (
    tabId !== undefined &&
    new URL(sender.url).pathname.startsWith("/extension-auth")
  ) {
    setTimeout(() => chrome.tabs.remove(tabId).catch(() => {}), 1200);
  }
  return { ok: true };
}

// --------------------------------------------------------------- messages

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const reply = (promise) => {
    promise
      .then(sendResponse)
      .catch((err) =>
        sendResponse({ ok: false, reason: "error", message: String(err) }),
      );
    return true; // keeps the channel open for the async response
  };

  switch (message?.type) {
    case "STORE_TOKEN":
      if (
        !isFromApp(sender) ||
        typeof message.accessToken !== "string" ||
        !message.accessToken
      ) {
        sendResponse({ ok: false });
        return;
      }
      return reply(storeToken(message.accessToken, sender));

    case "CLEAR_TOKEN":
      if (!isFromApp(sender)) {
        sendResponse({ ok: false });
        return;
      }
      return reply(clearToken().then(() => ({ ok: true })));

    case "GET_AUTH_STATE":
      return reply(getAuthState());

    case "LOG_APPLICATION": {
      const app = sanitizeApp(message.app);
      if (!app) {
        sendResponse({
          ok: false,
          reason: "invalid",
          message: "Company and role are required.",
        });
        return;
      }
      return reply(logApplication(app));
    }

    case "OPEN_CONNECT":
      chrome.tabs.create({ url: `${APP_ORIGIN}/extension-auth` });
      sendResponse({ ok: true });
      return;
  }
});
