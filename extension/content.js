// Runs only on the job sites listed in manifest.json (extract.js loads first).
// Flow: trusted click on a submit button -> a confirmation message appears ->
// ask the user before anything is logged.

const DEBUG = false; // set true to watch detection in the page console
const debug = (...args) => DEBUG && console.debug("[HustleBuddy]", ...args);

// Everything site-specific lives here. A label must match the WHOLE button text,
// so "Applied" or "Apply filters" never count. `success` is the message the site
// shows after a real submission.
const ADAPTERS = [
  {
    name: "LinkedIn",
    host: /(^|\.)linkedin\.com$/,
    submitLabel: /^submit application$/i,
    scope: '[role="dialog"]',
    success:
      /your application was sent|application submitted|applied successfully/i,
  },
  {
    name: "Unstop",
    host: /(^|\.)unstop\.com$/,
    submitLabel: /^submit( application)?$/i,
    scope: 'form, [role="dialog"]',
    success:
      /successfully (applied|registered|submitted)|application (submitted|received)|thank you for applying/i,
  },
  {
    name: "Internshala",
    host: /(^|\.)internshala\.com$/,
    submitLabel: /^submit( application)?$/i,
    scope: 'form, [role="dialog"]',
    success: /application (has been )?(submitted|sent)|successfully applied/i,
  },
  {
    name: "Naukri",
    host: /(^|\.)naukri\.com$/,
    submitLabel: /^apply$/i,
    scope: null,
    success: /successfully applied|application (sent|submitted)/i,
  },
];

let lastPrompt = null; // { key, at }, so one submission prompts once

const adapter = ADAPTERS.find((a) => a.host.test(location.hostname));
if (adapter) init(adapter);

function labelOf(el) {
  return (el.innerText || el.value || el.getAttribute("aria-label") || "")
    .replace(/\s+/g, " ")
    .trim();
}

function init(adapter) {
  let armed = null;

  // Counting matches (not just testing) means success text that was already on
  // the page before the click can't trigger a false positive.
  const countMatches = () => {
    const text = document.body?.innerText || "";
    return (text.match(new RegExp(adapter.success.source, "gi")) || []).length;
  };

  function disarm() {
    if (!armed) return;
    armed.observer.disconnect();
    clearTimeout(armed.timer);
    clearTimeout(armed.debounce);
    armed = null;
  }

  function check() {
    if (!armed) return;
    if (countMatches() <= armed.baseline) return;
    const { snapshot } = armed;
    debug("success text appeared", snapshot);
    disarm();
    promptToLog(adapter, snapshot);
  }

  function arm() {
    disarm();
    armed = {
      snapshot: extractJobDetails(), // capture now, the DOM may change after submit
      baseline: countMatches(),
      debounce: 0,
      timer: setTimeout(disarm, 15000),
      observer: new MutationObserver(() => {
        if (!armed) return;
        clearTimeout(armed.debounce);
        armed.debounce = setTimeout(check, 200);
      }),
    };
    armed.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    debug("armed", armed.snapshot);
  }

  document.addEventListener(
    "click",
    (event) => {
      if (!event.isTrusted || !(event.target instanceof Element)) return;
      const btn = event.target.closest(
        'button, [role="button"], input[type="submit"], a',
      );
      if (!btn) return;
      if (!adapter.submitLabel.test(labelOf(btn))) return;
      if (adapter.scope && !btn.closest(adapter.scope)) return;
      arm();
    },
    true,
  );
}

function promptToLog(adapter, snapshot) {
  const fresh = extractJobDetails();
  const details = {
    company: snapshot.company || fresh.company,
    role: snapshot.role || fresh.role,
    source: adapter.name,
  };
  const key = `${details.company}|${details.role}`.toLowerCase();
  if (
    lastPrompt &&
    lastPrompt.key === key &&
    Date.now() - lastPrompt.at < 10 * 60_000
  )
    return;
  lastPrompt = { key, at: Date.now() };
  showToast(details);
}

// Built with DOM APIs and textContent on purpose: scraped text is untrusted
// page content and must never go through innerHTML.
function showToast({ company, role, source }) {
  document.getElementById("hb-toast-host")?.remove();

  const host = document.createElement("div");
  host.id = "hb-toast-host";
  host.style.cssText =
    "all:initial;position:fixed;right:20px;bottom:20px;z-index:2147483647;";
  const root = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .card { width: 320px; padding: 16px; border-radius: 14px; background: #0a0a0a; color: #e5e5e5;
            border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 12px 40px rgba(0,0,0,0.5);
            font-size: 13px; line-height: 1.4; }
    .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .title { font-weight: 600; color: #fff; }
    .x { background: none; border: 0; color: #777; cursor: pointer; font-size: 18px; line-height: 1; padding: 0 2px; }
    .x:hover { color: #fff; }
    label { display: block; margin-bottom: 8px; color: #999; font-size: 11px; }
    input { display: block; width: 100%; margin-top: 3px; padding: 7px 9px; border-radius: 8px;
            border: 1px solid #2a2a2a; background: #111; color: #fff; font-size: 13px; }
    input:focus { outline: none; border-color: #bbb; }
    .row { display: flex; gap: 8px; margin-top: 12px; }
    .btn { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #2a2a2a; background: transparent;
           color: #ccc; font-size: 13px; cursor: pointer; }
    .btn.primary { background: #fff; color: #000; border-color: #fff; font-weight: 600; }
    .btn:disabled { opacity: 0.5; cursor: default; }
    .msg { margin-top: 10px; min-height: 16px; color: #999; font-size: 12px; }
    .msg.ok { color: #34d399; }
    .msg.err { color: #f87171; }
  `;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const field = (labelText, value) => {
    const label = el("label", "", labelText);
    const input = document.createElement("input");
    input.value = value || "";
    label.append(input);
    return { label, input };
  };

  const card = el("div", "card");
  const head = el("div", "head");
  const closeBtn = el("button", "x", "×");
  closeBtn.setAttribute("aria-label", "Dismiss");
  head.append(el("span", "title", "Log this application?"), closeBtn);

  const companyField = field("Company", company);
  const roleField = field("Role", role);

  const row = el("div", "row");
  const dismissBtn = el("button", "btn", "Dismiss");
  const logBtn = el("button", "btn primary", "Log it");
  row.append(dismissBtn, logBtn);

  const msg = el("div", "msg");
  const setMsg = (text, kind = "") => {
    msg.textContent = text;
    msg.className = `msg ${kind}`;
  };

  card.append(head, companyField.label, roleField.label, row, msg);
  root.append(style, card);
  document.documentElement.append(host);

  const remove = () => host.remove();
  const autoClose = setTimeout(remove, 20000);
  card.addEventListener("focusin", () => clearTimeout(autoClose));
  closeBtn.onclick = remove;
  dismissBtn.onclick = remove;

  logBtn.onclick = async () => {
    const app = {
      company: companyField.input.value.trim(),
      role: roleField.input.value.trim(),
      source,
      status: "applied",
    };
    if (!app.company || !app.role)
      return setMsg("Add a company and role first.", "err");

    clearTimeout(autoClose);
    logBtn.disabled = true;
    setMsg("Saving…");

    let res = null;
    try {
      res = await chrome.runtime.sendMessage({ type: "LOG_APPLICATION", app });
    } catch {}

    if (res?.ok) {
      setMsg("Logged to HustleBuddy.", "ok");
      setTimeout(remove, 1800);
    } else if (res?.reason === "auth") {
      setMsg("Saved. Connect HustleBuddy and it will sync.", "err");
      logBtn.textContent = "Connect";
      logBtn.disabled = false;
      logBtn.onclick = () =>
        chrome.runtime.sendMessage({ type: "OPEN_CONNECT" });
    } else {
      setMsg(res?.message || "Couldn't save. Try the extension popup.", "err");
      logBtn.disabled = false;
    }
  };
}
