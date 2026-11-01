(function () {
  if (window.__streakCrmLoaded) return;
  window.__streakCrmLoaded = true;

  const INITIAL_DEALS = [
    { name: "Acme AI Cloud", stage: "Proposal", value: 18500, domain: "acme.ai" },
    { name: "Vertex Data Labs", stage: "Demo", value: 12000, domain: "vertexlabs.io" }
  ];

  let deals = INITIAL_DEALS.slice();

  function addDeal(customDeal) {
    const deal = customDeal || {
      name: (document.title || location.hostname || "Enterprise Prospect").slice(0, 36),
      stage: "Contacted",
      value: 15000,
      domain: location.hostname || "prospect.io"
    };
    deals.unshift(deal);
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ streakcrm_deals: deals });
    }
    return {
      ok: true,
      deal,
      totalDeals: deals.length,
      totalPipelineValue: deals.reduce((s, d) => s + (Number(d.value) || 0), 0)
    };
  }

  function injectDrawer() {
    if (document.getElementById("streakcrm-drawer")) return;
    const totalVal = deals.reduce((s, d) => s + (Number(d.value) || 0), 0);
    const drawer = document.createElement("div");
    drawer.id = "streakcrm-drawer";
    drawer.innerHTML = `
      <div id="sc-summary">
        💼 <strong>StreakCRM Pipeline</strong> — ${deals.length} Active Deals (<strong>$${totalVal.toLocaleString()}</strong> Total)
      </div>
      <button class="sc-btn" id="sc-add-btn">➕ Add Page to Pipeline ($15k)</button>
    `;

    const target = document.querySelector("main") || document.body;
    target.prepend(drawer);

    drawer.querySelector("#sc-add-btn").addEventListener("click", () => {
      const res = addDeal();
      drawer.querySelector("#sc-summary").innerHTML = `💼 <strong>StreakCRM Pipeline</strong> — ${res.totalDeals} Active Deals (<strong>$${res.totalPipelineValue.toLocaleString()}</strong> Total)`;
      drawer.querySelector("#sc-add-btn").textContent = "✅ Added to Pipeline!";
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "STREAK_ADD_DEAL") {
      sendResponse(addDeal(msg.deal));
      return true;
    }
    if (msg && msg.type === "STREAK_GET_PIPELINE") {
      sendResponse({
        deals,
        totalPipelineValue: deals.reduce((s, d) => s + (Number(d.value) || 0), 0)
      });
      return true;
    }
  });

  injectDrawer();
})();
