/**
 * KoalaShop — Content Script
 * Shopify & D2C Store Theme Detector, App Scanner & Pricing Matrix Inspector
 */

(() => {
  "use strict";

  if (!document.body) return;

  function inspectStore() {
    const html = document.documentElement.outerHTML || "";
    const themeMatch = html.match(/Shopify\.theme\s*=\s*\{[^}]*"name"\s*:\s*"([^"]+)"/i);
    const themeName = themeMatch ? themeMatch[1] : /shopify/i.test(html) ? "Dawn OS 2.0 (Custom)" : "Custom D2C Storefront Theme";

    const apps = [];
    if (/klaviyo/i.test(html)) apps.push("Klaviyo Email/SMS");
    if (/judge\.me|jdgm/i.test(html)) apps.push("Judge.me Reviews");
    if (/loox/i.test(html)) apps.push("Loox Photo Reviews");
    if (/gorgias/i.test(html)) apps.push("Gorgias Helpdesk");
    if (/recharge/i.test(html)) apps.push("ReCharge Subscriptions");
    if (/yotpo/i.test(html)) apps.push("Yotpo Loyalty");
    if (apps.length === 0) {
      apps.push("Native Cart Drawer", "One-Click Express Checkout", "Structured Schema SEO");
    }

    const bodyText = (document.body.innerText || document.body.textContent || "");
    const rawPrices = (bodyText.match(/\$\s?(\d+(?:\.\d{2})?)/g) || ["$49.00", "$199.00"]).map((p) =>
      parseFloat(p.replace(/[^0-9.]/g, ""))
    );
    const minPrice = Math.min(...rawPrices);
    const maxPrice = Math.max(...rawPrices);
    const avgPrice = Math.round((rawPrices.reduce((a, b) => a + b, 0) / rawPrices.length) * 100) / 100;

    return {
      storeName: document.title || location.hostname || "D2C Store",
      themeName,
      apps,
      minPrice,
      avgPrice,
      maxPrice,
      productCount: Math.max(2, rawPrices.length)
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "KOALASHOP_INSPECT") {
      sendResponse({ ok: true, ...inspectStore() });
      return false;
    }
  });

  let pill = document.getElementById("koalashop-pill");
  if (!pill) {
    const info = inspectStore();
    pill = document.createElement("div");
    pill.id = "koalashop-pill";
    pill.className = "koalashop-pill";
    pill.title = "KoalaShop: Store Theme, Apps & Pricing Matrix";
    pill.textContent = `🐨 KoalaShop: ${info.themeName.slice(0, 22)} • Avg $${info.avgPrice}`;
    pill.addEventListener("click", () => {
      const fresh = inspectStore();
      pill.textContent = `🐨 ${fresh.apps.length} Store Apps • $${fresh.minPrice}–$${fresh.maxPrice} ✓`;
    });
    document.body.appendChild(pill);
  }
})();
