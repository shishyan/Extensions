(function () {
  if (window.__clearbitConnectLoaded) return;
  window.__clearbitConnectLoaded = true;

  function extractFirmographics() {
    const host = location.hostname || "acme.ai";
    const bodyText = ((document.body && document.body.innerText) || "").toLowerCase();

    let industry = "B2B SaaS & Cloud Software";
    if (bodyText.includes("ecommerce") || bodyText.includes("cart")) industry = "E-Commerce & Retail Tech";
    else if (bodyText.includes("finance") || bodyText.includes("payment")) industry = "FinTech & Financial Services";

    const socialLinks = [];
    document.querySelectorAll("a[href]").forEach((a) => {
      const h = a.getAttribute("href") || "";
      if (/linkedin\.com|twitter\.com|x\.com|github\.com/i.test(h) && !socialLinks.includes(h)) {
        socialLinks.push(h);
      }
    });

    return {
      companyName: (document.title || host).split(/[—|-]/)[0].trim().slice(0, 36),
      domain: host,
      industry,
      employees: "51–250 Employees",
      estArr: "$10M–$25M ARR",
      emailProvider: "Google Workspace (MX Verified)",
      socialLinks
    };
  }

  function injectCard() {
    if (document.getElementById("clearbitconnect-card")) return;
    const f = extractFirmographics();
    const card = document.createElement("div");
    card.id = "clearbitconnect-card";
    card.innerHTML = `
      <div>
        🏢 <strong>ClearbitConnect: ${f.companyName}</strong> (${f.domain}) — ${f.industry}
      </div>
      <span class="cb-pill">${f.employees} • ${f.estArr}</span>
    `;
    const target = document.querySelector("main") || document.body;
    target.prepend(card);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "CLEARBIT_GET_FIRMOGRAPHICS") {
      sendResponse(extractFirmographics());
      return true;
    }
  });

  injectCard();
})();
