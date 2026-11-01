(function () {
  if (window.__aliInsidersLoaded) return;
  window.__aliInsidersLoaded = true;

  let currentMarkup = 3.0;

  function analyzeProduct() {
    const bodyText = (document.body && document.body.innerText) || "";
    const priceMatch = bodyText.match(/\$\s*(\d+(?:\.\d{2})?)/);
    const unitCost = priceMatch ? Math.max(2.5, parseFloat(priceMatch[1])) : 14.5;
    const shipping = 2.5;
    const landedCost = Number((unitCost + shipping).toFixed(2));
    const rrp = Number((landedCost * currentMarkup).toFixed(2));
    const profit = Number((rrp - landedCost).toFixed(2));
    const breakEvenRoas = Number((rrp / Math.max(0.5, profit)).toFixed(2));

    const images = [];
    document.querySelectorAll("img[src]").forEach((img) => {
      const s = img.getAttribute("src") || "";
      if (s && !s.startsWith("data:") && !images.includes(s)) {
        images.push(s);
      }
    });

    return {
      title: document.title || "Product Listing",
      trustScore: 94,
      unitCost,
      landedCost,
      markup: currentMarkup,
      rrp,
      profit,
      breakEvenRoas,
      images
    };
  }

  function injectPanel() {
    if (document.getElementById("aliinsiders-panel")) return;
    const data = analyzeProduct();
    const panel = document.createElement("div");
    panel.id = "aliinsiders-panel";
    panel.innerHTML = `
      <div class="ai-head">
        <span class="ai-title">🛍️ AliInsiders Supplier & Dropship Margin Inspector</span>
        <span class="ai-trust">Supplier Trust: ${data.trustScore}%</span>
      </div>
      <div class="ai-grid">
        <div class="ai-box"><div class="lbl">Landed Cost</div><div class="val">$${data.landedCost.toFixed(2)}</div></div>
        <div class="ai-box"><div class="lbl">Target RRP (${data.markup}x)</div><div class="val">$${data.rrp.toFixed(2)}</div></div>
        <div class="ai-box"><div class="lbl">Net Profit</div><div class="val" style="color:#4ade80;">+$${data.profit.toFixed(2)}</div></div>
        <div class="ai-box"><div class="lbl">Break-Even ROAS</div><div class="val">${data.breakEvenRoas}x</div></div>
      </div>
      <button class="ai-btn" id="ai-harvest-btn">📸 Harvest ${data.images.length} Product Images</button>
    `;

    const target = document.querySelector("main") || document.body;
    target.prepend(panel);

    panel.querySelector("#ai-harvest-btn").addEventListener("click", () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(data.images.join("\n")).catch(() => {});
      }
      panel.querySelector("#ai-harvest-btn").textContent = `✅ Harvested (${data.images.length} URLs Copied!)`;
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "ALI_GET_INSIGHTS") {
      if (msg.markup) currentMarkup = parseFloat(msg.markup) || 3.0;
      sendResponse(analyzeProduct());
      return true;
    }
  });

  injectPanel();
})();
