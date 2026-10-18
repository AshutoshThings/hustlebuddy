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

  return {
    company: company || "Company",
    role: role || "Software Role",
    source,
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getJobData") {
    sendResponse(extractJobDetails());
  }
});

function showConfirmationBanner(jobData) {
  if (document.getElementById("hustlebuddy-banner")) return;

  const banner = document.createElement("div");
  banner.id = "hustlebuddy-banner";
  banner.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    background: #0f172a;
    color: #f8fafc;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    width: 320px;
  `;

  banner.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
      <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8;">HustleBuddy Tracker</span>
      <button id="hb-close" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 16px; line-height: 1;">&times;</button>
    </div>
    <div style="font-size: 13px; font-weight: 600; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${jobData.role}</div>
    <div style="font-size: 12px; color: #94a3b8; margin-bottom: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${jobData.company}</div>
    <div style="font-size: 12px; margin-bottom: 12px; color: #cbd5e1;">Log this application to your tracker?</div>
    <div style="display: flex; gap: 8px;">
      <button id="hb-yes" style="flex: 1; background: #ffffff; color: #000000; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">Yes, Log It</button>
      <button id="hb-no" style="flex: 1; background: rgba(255, 255, 255, 0.08); color: #f8fafc; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer;">Cancel</button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById("hb-yes").onclick = () => {
    try {
      chrome.runtime.sendMessage({
        action: "confirmSaveApplication",
        jobData,
      });
    } catch (e) {
      console.error("Extension context invalidated:", e);
    }
    banner.remove();
  };

  document.getElementById("hb-no").onclick = () => banner.remove();
  document.getElementById("hb-close").onclick = () => banner.remove();

  setTimeout(() => {
    if (document.getElementById("hustlebuddy-banner")) {
      banner.remove();
    }
  }, 12000);
}

let lastPromptTimestamp = 0;

function handleDetectionEvent() {
  const now = Date.now();
  if (now - lastPromptTimestamp < 10000) return;

  const jobData = extractJobDetails();
  if (jobData.company && jobData.role) {
    lastPromptTimestamp = now;
    showConfirmationBanner(jobData);
  }
}

document.addEventListener("submit", () => handleDetectionEvent(), true);

document.addEventListener(
  "click",
  (e) => {
    const target = e.target.closest(
      "button, input[type='submit'], [role='button']",
    );
    if (!target) return;

    const text = target.innerText?.toLowerCase() || "";
    const ariaLabel = target.getAttribute("aria-label")?.toLowerCase() || "";
    const id = target.id?.toLowerCase() || "";
    const className =
      typeof target.className === "string"
        ? target.className.toLowerCase()
        : "";

    const isSubmissionIntent =
      target.type === "submit" ||
      text.includes("submit") ||
      text.includes("apply") ||
      text.includes("send application") ||
      text.includes("complete") ||
      ariaLabel.includes("submit") ||
      ariaLabel.includes("apply") ||
      id.includes("submit") ||
      id.includes("apply") ||
      className.includes("submit-button") ||
      className.includes("apply-button");

    if (isSubmissionIntent) {
      handleDetectionEvent();
    }
  },
  true,
);
