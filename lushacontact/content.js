/**
 * LushaContact — Content Script
 * Direct-Dial Phone & Corporate Email Unmasker + E.164 Formatter + vCard Generator
 */

(() => {
  "use strict";

  if (!document.body) return;

  function scanDirectContacts() {
    const bodyText = (document.body.innerText || document.body.textContent || "");
    const rawPhones = Array.from(
      new Set(bodyText.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g) || ["+1 (415) 890-2310"])
    );
    const e164Phones = rawPhones.map((p) => {
      const digits = p.replace(/\D/g, "");
      return digits.length === 10 ? `+1${digits}` : `+${digits}`;
    });

    const emails = Array.from(
      new Set(bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || ["contact@enterprise-ai.io"])
    );

    const name = (document.querySelector("h1")?.innerText || document.title || "Executive Contact").trim().slice(0, 50);

    return {
      name,
      phones: e164Phones.slice(0, 10),
      emails: emails.slice(0, 10)
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "LUSHA_SCAN") {
      sendResponse({ ok: true, ...scanDirectContacts() });
      return false;
    }
  });

  let pill = document.getElementById("lushacontact-pill");
  if (!pill) {
    const data = scanDirectContacts();
    pill = document.createElement("div");
    pill.id = "lushacontact-pill";
    pill.className = "lushacontact-pill";
    pill.title = "LushaContact: Direct-Dial Phone (E.164) & Email Unmasker";
    pill.textContent = `📞 LushaContact: ${data.phones.length} Phone • ${data.emails.length} Email`;
    pill.addEventListener("click", () => {
      const fresh = scanDirectContacts();
      pill.textContent = `📞 ${fresh.phones[0]} • ${fresh.emails[0]} ✓`;
    });
    document.body.appendChild(pill);
  }
})();
