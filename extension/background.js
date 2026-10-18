importScripts("config.js");

function getJwtExpiryMs(token) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(part));
    return payload.exp ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "STORE_TOKEN") return;

  if (!sender.url?.startsWith(`${APP_ORIGIN}/extension-auth`)) {
    sendResponse({ ok: false });
    return;
  }
  if (typeof message.accessToken !== "string" || !message.accessToken) {
    sendResponse({ ok: false });
    return;
  }

  const tabId = sender.tab?.id;

  chrome.storage.local
    .set({
      accessToken: message.accessToken,
      expiresAt: getJwtExpiryMs(message.accessToken),
    })
    .then(() => {
      sendResponse({ ok: true });
      if (tabId !== undefined) {
        setTimeout(() => chrome.tabs.remove(tabId).catch(() => {}), 1200);
      }
    });

  return true;
});
