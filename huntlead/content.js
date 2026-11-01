/**
 * HuntLead — Free B2B Email Finder, Domain Search & Lead Extractor
 * Replaces Hunter.io, Apollo.io & Lusha: DOM/HTML/mailto email extraction, phone extraction, social/role detection, corporate permutation engine & CSV export
 */

(() => {
  "use strict";

  const ROLE_PREFIXES = new Set([
    "contact", "info", "support", "sales", "hello", "admin", "careers", "jobs", "press", "media", "founders", "team", "billing", "office", "help", "marketing", "hr", "legal"
  ]);

  function scanContacts() {
    const html = document.documentElement ? document.documentElement.innerHTML : "";
    const text = document.body ? (document.body.innerText || document.body.textContent || "") : "";
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,12}/g;

    const mailtoLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]')).map((a) => {
      const raw = a.getAttribute("href") || "";
      return raw.replace(/^mailto:/i, "").split("?")[0].trim();
    });

    const rawEmails = [
      ...mailtoLinks,
      ...(text.match(emailRegex) || []),
      ...(html.match(emailRegex) || [])
    ];

    const cleanEmails = Array.from(
      new Set(
        rawEmails
          .map((e) => e.toLowerCase().trim())
          .filter(
            (e) =>
              e.includes("@") &&
              !/\.(png|jpg|jpeg|gif|svg|webp|js|css|woff|woff2|ttf|eot|mp4|mp3)$/i.test(e) &&
              !e.includes("example.com") &&
              !e.includes("sentry.io") &&
              !e.includes("wixpress.com")
          )
      )
    ).slice(0, 40);

    const categorizedEmails = cleanEmails.map((email) => {
      const localPart = email.split("@")[0].replace(/[^a-z]/g, "");
      const isRole = ROLE_PREFIXES.has(localPart);
      return {
        email,
        type: isRole ? "Role / Dept" : "Personal / Direct"
      };
    });

    const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g;
    const telLinks = Array.from(document.querySelectorAll('a[href^="tel:"]')).map((a) =>
      (a.getAttribute("href") || "").replace(/^tel:/i, "").trim()
    );
    const phones = Array.from(new Set([...telLinks, ...(text.match(phoneRegex) || [])]))
      .filter((p) => p.replace(/\D/g, "").length >= 10)
      .slice(0, 15);

    const socialLinks = [];
    const seenSocial = new Set();
    Array.from(document.querySelectorAll("a[href]")).forEach((a) => {
      const href = a.href || "";
      if (/(linkedin\.com\/(in|company)\/|twitter\.com\/|x\.com\/|github\.com\/)/i.test(href)) {
        const cleanHref = href.split("?")[0];
        if (!seenSocial.has(cleanHref)) {
          seenSocial.add(cleanHref);
          socialLinks.push(cleanHref);
        }
      }
    });

    const domain = (location.hostname || "company.com").replace(/^www\./, "") || "company.com";
    const patterns = [
      `first@${domain}`,
      `first.last@${domain}`,
      `flast@${domain}`,
      `first_last@${domain}`,
      `founders@${domain}`,
      `contact@${domain}`
    ];

    return {
      domain,
      emails: cleanEmails,
      categorizedEmails,
      phones,
      socialLinks: socialLinks.slice(0, 12),
      patterns
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "HUNTLEAD_SCAN") {
      sendResponse(scanContacts());
    }
  });
})();
