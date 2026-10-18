function extractJobDetails() {
  const host = window.location.hostname;
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const firstLine = (el) => {
    const raw = el?.innerText || el?.textContent || "";
    return raw.split("\n").map(clean).find(Boolean) || "";
  };
  const pick = (selectors) => {
    for (const sel of selectors) {
      const value = firstLine(document.querySelector(sel));
      if (value) return value;
    }
    return "";
  };

  // A site's own name is never a real company or role, so drop it instead of
  // saving something confidently wrong.
  const BRANDS =
    /^(linkedin|unstop|internshala|naukri(\.com)?|indeed|glassdoor)$/i;
  const usable = (v) => (v && v.length <= 140 && !BRANDS.test(v) ? v : "");

  const structured = {
    name: "structured data",
    run() {
      for (const script of document.querySelectorAll(
        'script[type="application/ld+json"]',
      )) {
        let parsed;
        try {
          parsed = JSON.parse(script.textContent || "null");
        } catch {
          continue;
        }
        const nodes = []
          .concat(parsed || [])
          .flatMap((n) => (n && n["@graph"]) || [n]);
        const job = nodes.find(
          (n) => n && [].concat(n["@type"] || []).includes("JobPosting"),
        );
        if (job) {
          const org = job.hiringOrganization;
          return {
            role: job.title,
            company: typeof org === "string" ? org : org?.name,
          };
        }
      }
      return {};
    },
  };

  const bySelectors = {
    name: "page selectors",
    run() {
      if (host.includes("linkedin.com"))
        return {
          role: pick([
            ".job-details-jobs-unified-top-card__job-title h1",
            ".job-details-jobs-unified-top-card__job-title",
            ".jobs-unified-top-card__job-title",
            ".top-card-layout__title",
          ]),
          company: pick([
            ".job-details-jobs-unified-top-card__company-name a",
            ".job-details-jobs-unified-top-card__company-name",
            ".jobs-unified-top-card__company-name",
            ".topcard__org-name-link",
          ]),
        };
      if (host.includes("unstop.com"))
        return {
          role: pick([".opportunity-title", "h1.title", "h1"]),
          company: pick([
            ".organisation-name",
            ".comp-name",
            ".opportunity-banner-org-name",
          ]),
        };
      if (host.includes("internshala.com"))
        return {
          role: pick([
            ".heading_4_5.profile",
            ".individual_internship_header .profile",
            ".profile",
          ]),
          company: pick([
            ".company_name a",
            ".company-name a",
            ".company_name",
          ]),
        };
      if (host.includes("naukri.com"))
        return {
          role: pick([
            "h1.styles_jd-header-title__rZwM1",
            ".jd-header-title",
            "h1",
          ]),
          company: pick([
            ".styles_jd-header-comp-name__MvqAI a",
            ".jd-header-comp-name a",
          ]),
        };
      return {};
    },
  };

  const fromTitle = {
    name: "page title",
    run() {
      const og =
        document.querySelector('meta[property="og:title"]')?.content || "";
      for (const raw of [document.title, og]) {
        const t = clean(raw).replace(/^\(\d+\)\s*/, "");
        if (!t) continue;
        let m = t.match(/^(.+?) hiring (.+?) in .+$/i); // LinkedIn public pages
        if (m) return { company: m[1], role: m[2] };
        const parts = t.split(/\s\|\s/);
        if (parts.length >= 3 && /linkedin/i.test(parts[parts.length - 1]))
          return { role: parts[0], company: parts[1] }; // "Role | Company | LinkedIn"
        const first = t.split(/\s[|\-–—]\s/)[0];
        m = first.match(/^(.+?)\s+at\s+(.+)$/i); // "Role at Company"
        if (m) return { role: m[1], company: m[2] };
        return {
          role: first,
          company: document.querySelector('meta[property="og:site_name"]')
            ?.content,
        };
      }
      return {};
    },
  };

  // LinkedIn and Unstop swap job content without reloading the page, so JSON-LD
  // from the first load can describe a different job. Trust the live DOM first there.
  const spa = /linkedin|unstop/.test(host);
  const order = spa
    ? [bySelectors, structured, fromTitle]
    : [structured, bySelectors, fromTitle];

  let company = "";
  let role = "";
  let method = "";
  for (const strategy of order) {
    let found = {};
    try {
      found = strategy.run() || {};
    } catch {}
    const c = usable(clean(found.company));
    const r = usable(clean(found.role));
    if (!method && (c || r)) method = strategy.name;
    company = company || c;
    role = role || r;
    if (company && role) break;
  }

  const SOURCES = [
    ["linkedin.com", "LinkedIn"],
    ["unstop.com", "Unstop"],
    ["internshala.com", "Internshala"],
    ["naukri.com", "Naukri"],
  ];
  const source =
    (SOURCES.find(([d]) => host.includes(d)) || [])[1] ||
    host.replace(/^www\./, "");

  return { company, role, source, method };
}
