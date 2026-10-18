const $ = (id) => document.getElementById(id);

const signedOutView = $("signedOut");
const signedInView = $("signedIn");
const signedOutMsg = $("signedOutMsg");
const noticeBox = $("noticeBox");
const statusMsg = $("statusMsg");

let detectedSource = "";

function extractJobDetails() {
  const hostname = window.location.hostname;
  const text = (sel) => document.querySelector(sel)?.innerText?.trim() || "";

  let company = "";
  let role = "";

  try {
    for (const script of document.querySelectorAll(
      'script[type="application/ld+json"]',
    )) {
      const parsed = JSON.parse(script.textContent || "null");
      const nodes = []
        .concat(parsed || [])
        .flatMap((n) => (n && n["@graph"]) || [n]);
      const job = nodes.find(
        (n) => n && [].concat(n["@type"] || []).includes("JobPosting"),
      );
      if (job) {
        role = job.title || "";
        const org = job.hiringOrganization;
        company = (typeof org === "string" ? org : org?.name) || "";
        break;
      }
    }
  } catch {}

  if (!role || !company) {
    if (hostname.includes("linkedin.com")) {
      role =
        role ||
        text(
          ".job-details-jobs-unified-top-card__job-title h1, .top-card-layout__title",
        );
      company =
        company ||
        text(
          ".job-details-jobs-unified-top-card__company-name a, .top-card-layout__company-info-link",
        );
    } else if (hostname.includes("unstop.com")) {
      role = role || text(".opportunity-title, h1.title, .job-title");
      company =
        company ||
        text(".organisation-name, .comp-name, .opportunity-banner-org-name");
    } else if (hostname.includes("naukri.com")) {
      role = role || text("h1.styles_jd-header-title__rZwM1, .jd-header-title");
      company =
        company ||
        text(".styles_jd-header-comp-name__MvqAI a, .jd-header-comp-name a");
    }
  }

  if (!role || !company) {
    const title =
      document.querySelector('meta[property="og:title"]')?.content ||
      document.title ||
      "";
    const [first] = title.split(/\s[|\-–—]\s/);
    const atMatch = first.match(/^(.*?)\s+at\s+(.+)$/i);
    if (atMatch) {
      role = role || atMatch[1].trim();
      company = company || atMatch[2].trim();
    } else {
      role = role || first.trim();
    }
    company =
      company ||
      document
        .querySelector('meta[property="og:site_name"]')
        ?.content?.trim() ||
      "";
  }

  const SOURCES = [
    ["linkedin.com", "LinkedIn"],
    ["unstop.com", "Unstop"],
    ["naukri.com", "Naukri"],
    ["internshala.com", "Internshala"],
  ];
  const source =
    (SOURCES.find(([d]) => hostname.includes(d)) || [])[1] ||
    hostname.replace(/^www\./, "");

  return { company, role, source };
}

async function getValidToken() {
  const { accessToken, expiresAt } = await chrome.storage.local.get([
    "accessToken",
    "expiresAt",
  ]);
  if (!accessToken || !expiresAt || Date.now() > expiresAt - 30_000)
    return null;
  return accessToken;
}

function showSignedOut(message) {
  signedOutMsg.textContent =
    message ||
    "Connect your HustleBuddy account to start tracking applications.";
  signedOutView.classList.remove("hidden");
  signedInView.classList.add("hidden");
}

function showSignedIn() {
  signedInView.classList.remove("hidden");
  signedOutView.classList.add("hidden");
}

function setMsg(message, kind = "") {
  statusMsg.textContent = message;
  statusMsg.className = kind;
}

async function detectJob() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) return;
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJobDetails,
    });
    const job = injection?.result;
    if (!job) return;
    if (job.company) $("company").value = job.company;
    if (job.role) $("role").value = job.role;
    detectedSource = job.source || "";
    if (job.company || job.role) noticeBox.classList.remove("hidden");
  } catch {}
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = await getValidToken();
  if (!token) {
    const { accessToken } = await chrome.storage.local.get("accessToken");
    showSignedOut(
      accessToken
        ? "Your session expired. Reconnect to keep tracking."
        : undefined,
    );
    return;
  }
  showSignedIn();
  await detectJob();
});

$("connectBtn").addEventListener("click", () => {
  chrome.tabs.create({ url: `${APP_ORIGIN}/extension-auth` });
  window.close();
});

$("disconnectBtn").addEventListener("click", async () => {
  await chrome.storage.local.remove(["accessToken", "expiresAt"]);
  showSignedOut();
});

$("jobForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = await getValidToken();
  if (!token) {
    showSignedOut("Your session expired. Reconnect to keep tracking.");
    return;
  }

  const saveBtn = $("saveBtn");
  saveBtn.disabled = true;
  setMsg("Saving…");

  try {
    const res = await fetch(`${APP_ORIGIN}/api/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        company: $("company").value.trim(),
        role: $("role").value.trim(),
        status: $("status").value,
        source: detectedSource || undefined,
      }),
    });

    if (res.status === 401) {
      await chrome.storage.local.remove(["accessToken", "expiresAt"]);
      showSignedOut("Your session expired. Reconnect to keep tracking.");
      return;
    }

    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.response || "Failed to save");

    setMsg("Saved to HustleBuddy", "success");
    setTimeout(() => window.close(), 1200);
  } catch (err) {
    setMsg(err.message, "error");
    saveBtn.disabled = false;
  }
});
