/**
 * ApolloProspect — Content Script
 * B2B Decision-Maker Profile Parser, Seniority/Department Classifier & Corporate Email Permutator
 */

(() => {
  "use strict";

  if (!document.body) return;

  function parseProspectOnPage() {
    const h1 = (document.querySelector("h1")?.innerText || document.title || "Alex Rivera — CTO").trim();
    const bodyText = (document.body.innerText || document.body.textContent || "");

    const nameMatch = h1.match(/^([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    const name = nameMatch ? nameMatch[1] : "Alex Rivera";
    const parts = name.toLowerCase().split(/\s+/);
    const first = parts[0] || "alex";
    const last = parts[1] || "rivera";

    const roleMatch = bodyText.match(/\b(CEO|CTO|CFO|COO|Founder|Co-Founder|VP of [A-Za-z]+|Head of [A-Za-z]+|Director of [A-Za-z]+|Principal Engineer)\b/i);
    const title = roleMatch ? roleMatch[1] : "Chief Technology Officer (CTO)";

    const seniority = /CEO|CTO|CFO|COO|Founder/i.test(title)
      ? "C-Suite / Founder"
      : /VP|Head/i.test(title)
      ? "VP / Executive"
      : "Director / Lead";

    const department = /CTO|Engineer|Tech|AI/i.test(title)
      ? "Engineering & Product"
      : /Sales|Revenue|Growth/i.test(title)
      ? "Revenue & GTM"
      : "Executive Leadership";

    const domain =
      location.hostname && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)
        ? location.hostname.replace(/^www\./, "")
        : "enterprise-ai.io";

    const email = `${first}.${last}@${domain}`;

    return {
      name,
      title,
      seniority,
      department,
      email,
      company: domain
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "APOLLO_INSPECT_PAGE") {
      sendResponse({ ok: true, lead: parseProspectOnPage() });
      return false;
    }
  });

  let card = document.getElementById("apolloprospect-card");
  if (!card) {
    const lead = parseProspectOnPage();
    card = document.createElement("div");
    card.id = "apolloprospect-card";
    card.className = "apolloprospect-card";
    card.title = "ApolloProspect: Click to enrich & save B2B Decision-Maker to CRM";
    card.textContent = `🚀 ApolloProspect: ${lead.name} (${lead.seniority})`;
    card.addEventListener("click", () => {
      const fresh = parseProspectOnPage();
      chrome.runtime.sendMessage({ type: "APOLLO_SAVE_LEAD", lead: fresh }, () => {
        card.textContent = `✅ Saved ${fresh.email} to CRM!`;
      });
    });
    document.body.appendChild(card);
  }
})();
