(function () {
  if (window.__huntLeadLoaded) return;
  window.__huntLeadLoaded = true;

  function inferEmailPattern(emails, domain) {
    const cleanDomain = (domain || "").replace(/^www\./i, "").toLowerCase();
    const domainEmails = emails.filter((e) => e.toLowerCase().endsWith("@" + cleanDomain));
    const pool = domainEmails.length ? domainEmails : emails;
    let firstDotLast = 0;
    let firstUnderscoreLast = 0;
    let firstOnly = 0;
    let initialLast = 0;

    pool.forEach((email) => {
      const local = email.split("@")[0].toLowerCase();
      if (/^[a-z]+\.[a-z]+$/.test(local)) firstDotLast++;
      else if (/^[a-z]+_[a-z]+$/.test(local)) firstUnderscoreLast++;
      else if (/^[a-z][a-z0-9]{2,9}$/.test(local)) firstOnly++;
      else if (/^[a-z][a-z]{3,12}$/.test(local)) initialLast++;
    });

    if (firstDotLast >= firstOnly && firstDotLast > 0) {
      return { pattern: `{first}.{last}@${cleanDomain}`, confidence: Math.min(96, 72 + firstDotLast * 8) };
    }
    if (firstUnderscoreLast > 0) {
      return { pattern: `{first}_{last}@${cleanDomain}`, confidence: Math.min(92, 68 + firstUnderscoreLast * 8) };
    }
    if (firstOnly > 0) {
      return { pattern: `{first}@${cleanDomain}`, confidence: Math.min(90, 65 + firstOnly * 6) };
    }
    return { pattern: `{first}.{last}@${cleanDomain || "company.com"}`, confidence: pool.length ? 64 : 50 };
  }

  function scanLeads() {
    const html = document.documentElement.innerHTML || "";
    const text = document.body ? document.body.innerText : "";

    const emailRx = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}/g;
    const mailtoLinks = Array.from(document.querySelectorAll("a[href^='mailto:']")).map((a) =>
      a.getAttribute("href").replace(/^mailto:/i, "").split("?")[0].trim()
    );
    const rawEmails = [...(text.match(emailRx) || []), ...(html.match(emailRx) || []), ...mailtoLinks];
    const emails = Array.from(
      new Set(
        rawEmails
          .map((e) => e.toLowerCase().trim())
          .filter((e) => !/\.(png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2)$/i.test(e) && !e.includes("example.com") && !e.includes("sentry.io"))
      )
    ).slice(0, 100);

    const telLinks = Array.from(document.querySelectorAll("a[href^='tel:']")).map((a) =>
      a.getAttribute("href").replace(/^tel:/i, "").trim()
    );
    const phoneRx = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
    const phones = Array.from(new Set([...telLinks, ...(text.match(phoneRx) || []).map((p) => p.trim())])).slice(0, 40);

    const socials = [];
    document.querySelectorAll("a[href]").forEach((a) => {
      const h = a.href || "";
      if (/linkedin\.com\/(in|company)\/|twitter\.com\/|x\.com\/|github\.com\/|facebook\.com\/|instagram\.com\/|youtube\.com\/@/i.test(h)) {
        socials.push(h.split("?")[0]);
      }
    });

    const uniqueSocials = Array.from(new Set(socials)).slice(0, 50);
    const inferred = inferEmailPattern(emails, location.hostname);

    return {
      domain: location.hostname,
      url: location.href,
      title: document.title || location.hostname,
      emails,
      phones,
      socials: uniqueSocials,
      pattern: inferred.pattern,
      confidence: inferred.confidence
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "HUNTLEAD_SCAN") {
      sendResponse(scanLeads());
      return true;
    }
  });
})();
