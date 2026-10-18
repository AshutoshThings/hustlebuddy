const $ = (id) => document.getElementById(id);
const send = (message) => chrome.runtime.sendMessage(message).catch(() => null);

let detectedSource = "";

function setConnected(connected) {
  $("pill").classList.toggle("on", connected);
  $("pillText").textContent = connected ? "Connected" : "Not connected";
}

function showSignedOut(message) {
  setConnected(false);
  $("signedOutMsg").textContent =
    message || "Connect once and log applications from any job page.";
  $("signedOut").classList.remove("hidden");
  $("signedIn").classList.add("hidden");
}

function showSignedIn(state) {
  setConnected(true);
  $("signedIn").classList.remove("hidden");
  $("signedOut").classList.add("hidden");
  const pending = $("pendingNote");
  pending.textContent = `${state.pending} application${state.pending === 1 ? "" : "s"} waiting to sync.`;
  pending.classList.toggle("hidden", !state.pending);
}

function setMsg(text, kind = "") {
  $("statusMsg").textContent = text;
  $("statusMsg").className = kind;
}

async function detectJob() {
  let job = null;
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id) {
      const [injection] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractJobDetails,
      });
      job = injection?.result ?? null;
    }
  } catch {
    // chrome:// pages, the Web Store and some PDFs can't be scripted.
  }

  if (job && (job.company || job.role)) {
    if (job.company) $("company").value = job.company;
    if (job.role) $("role").value = job.role;
    detectedSource = job.source || "";
    $("noticeBox").textContent =
      `Detected from ${job.method}. Check before saving.`;
    $("noticeBox").classList.remove("hidden");
  } else {
    $("hint").classList.remove("hidden"); // manual logging fallback
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const state = await send({ type: "GET_AUTH_STATE" });
  if (!state?.connected) {
    showSignedOut();
    return;
  }
  showSignedIn(state);
  await detectJob();
});

$("connectBtn").addEventListener("click", () => {
  send({ type: "OPEN_CONNECT" });
  window.close();
});

$("openDashboard").addEventListener("click", () => {
  chrome.tabs.create({ url: `${APP_ORIGIN}/dashboard` });
});

$("disconnectBtn").addEventListener("click", async () => {
  await chrome.storage.local.remove(["accessToken", "expiresAt"]);
  showSignedOut();
});

$("jobForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const app = {
    company: $("company").value.trim(),
    role: $("role").value.trim(),
    status: $("status").value,
    source: detectedSource || undefined,
  };

  $("saveBtn").disabled = true;
  setMsg("Saving…");

  const res = await send({ type: "LOG_APPLICATION", app });

  if (res?.ok) {
    setMsg("Saved to HustleBuddy", "success");
    setTimeout(() => window.close(), 1200);
    return;
  }
  if (res?.reason === "auth") {
    showSignedOut(
      "Your session expired. This application is saved and will sync once you reconnect.",
    );
    return;
  }
  setMsg(res?.message || "Couldn't save. Try again.", "error");
  $("saveBtn").disabled = false;
});
