let stored = false;
let pending = false;

function ack() {
  window.postMessage(
    { source: "hustlebuddy-extension", type: "EXT_ACK" },
    window.location.origin,
  );
}

window.addEventListener("message", (event) => {
  if (event.source !== window || event.origin !== window.location.origin)
    return;
  const data = event.data;
  if (data?.source !== "hustlebuddy-web" || data?.type !== "EXT_AUTH") return;
  if (typeof data.accessToken !== "string" || !data.accessToken) return;

  if (stored) return ack();
  if (pending) return;

  pending = true;
  chrome.runtime.sendMessage(
    { type: "STORE_TOKEN", accessToken: data.accessToken },
    (res) => {
      pending = false;
      if (chrome.runtime.lastError || !res?.ok) return;
      stored = true;
      ack();
    },
  );
});
