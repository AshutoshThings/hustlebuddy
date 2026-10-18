let lastRelayed = null;
let latest = null;
let inFlight = false;

function post(type) {
  window.postMessage(
    { source: "hustlebuddy-extension", type },
    window.location.origin,
  );
}

function flush() {
  if (inFlight || !latest || latest === lastRelayed) return;
  const token = latest;
  inFlight = true;
  try {
    chrome.runtime.sendMessage(
      { type: "STORE_TOKEN", accessToken: token },
      (res) => {
        inFlight = false;
        const ok = !chrome.runtime.lastError && res?.ok;
        if (ok) {
          lastRelayed = token;
          post("EXT_ACK");
        }
        if (latest !== token) flush(); // a newer token arrived meanwhile
      },
    );
  } catch {
    inFlight = false; // extension was reloaded; this page needs a refresh
  }
}

window.addEventListener("message", (event) => {
  if (event.source !== window || event.origin !== window.location.origin)
    return;
  const data = event.data;
  if (data?.source !== "hustlebuddy-web") return;

  if (
    data.type === "EXT_AUTH" &&
    typeof data.accessToken === "string" &&
    data.accessToken
  ) {
    if (data.accessToken === lastRelayed) return post("EXT_ACK");
    latest = data.accessToken;
    flush();
  } else if (data.type === "EXT_LOGOUT") {
    latest = null;
    lastRelayed = null;
    try {
      chrome.runtime.sendMessage(
        { type: "CLEAR_TOKEN" },
        () => void chrome.runtime.lastError,
      );
    } catch {}
  }
});

// Announce ourselves so the page can re-send its token if it loaded first.
post("EXT_READY");
