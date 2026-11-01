/**
 * KasprLead — Content Script
 * Instant Profile Contact Enricher & 300-Character Connection Note Composer
 */

(() => {
  "use strict";

  if (!document.body) return;

  function enrichProfile() {
    const rawHeading = (document.querySelector("h1")?.innerText || document.title || "Alex Rivera — VP Engineering").trim();
    const name = rawHeading.split(/[—|-]/)[0].trim().slice(0, 35) || "Alex Rivera";
    const topic = (document.querySelector("h2, p")?.innerText || "cloud automation & AI infrastructure").trim().slice(0, 65);

    const note = `Hi ${name}, loved your insights on ${topic}! We're working on high-velocity engineering workflows in the same space — would love to connect and exchange notes.`.slice(
      0,
      295
    );

    return {
      name,
      topic,
      note,
      charCount: note.length
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "KASPR_ENRICH") {
      sendResponse({ ok: true, ...enrichProfile() });
      return false;
    }
  });

  let widget = document.getElementById("kasprlead-widget");
  if (!widget) {
    const info = enrichProfile();
    widget = document.createElement("div");
    widget.id = "kasprlead-widget";
    widget.className = "kasprlead-widget";
    widget.title = "KasprLead: 300-Char Personalized Connection Note & Profile Enricher";
    widget.textContent = `👻 KasprLead: ${info.name} (${info.charCount}/300c)`;
    widget.addEventListener("click", () => {
      const fresh = enrichProfile();
      widget.textContent = `👻 Note Ready (${fresh.charCount}/300 chars) ✓`;
    });
    document.body.appendChild(widget);
  }
})();
