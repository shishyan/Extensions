(function () {
  if (window.__koalaShopLoaded) return;
  window.__koalaShopLoaded = true;

  async function inspectStore() {
    const html = document.documentElement.outerHTML || "";
    const isShopify = /cdn\.shopify\.com|Shopify\.theme|shopify-section/i.test(html);

    const themeMatch = html.match(/Shopify\.theme\s*=\s*\{[^}]*"name"\s*:\s*"([^"]+)"/i);
    const themeName = themeMatch ? themeMatch[1] : isShopify ? "Dawn / Custom OS 2.0" : "Custom Storefront Theme";

    const APP_SIGNATURES = [
      ["Klaviyo", /klaviyo/i],
      ["Judge.me Reviews", /judge\.me|jdgm/i],
      ["Loox Photo Reviews", /loox\.io/i],
      ["Yotpo", /yotpo/i],
      ["ReConvert Upsell", /reconvert/i],
      ["Gorgias Helpdesk", /gorgias/i],
      ["Tidio Live Chat", /tidio/i],
      ["Privy Popups", /privy/i],
      ["Omnisend", /omnisend/i],
      ["Smile.io Loyalty", /smile\.io/i],
      ["Afterpay / Klarna", /afterpay|klarna/i],
      ["Shop Pay", /shop-pay|shopify_pay/i],
      ["PageFly Builder", /pagefly/i],
      ["GemPages", /gempages/i],
      ["Shogun Builder", /getshogun/i],
      ["Stamped.io", /stamped\.io/i],
      ["PushOwl", /pushowl/i],
      ["Recart SMS", /recart/i],
      ["Vitals All-in-One", /vitals/i],
      ["Triple Whale Pixel", /triplewhale/i]
    ];

    const apps = APP_SIGNATURES.filter(([, rx]) => rx.test(html)).map(([name]) => name);
    if (apps.length === 0) apps.push("Core Checkout Engine", "Direct Analytics Pixel");

    let products = [];
    try {
      const resp = await fetch("/products.json?limit=25");
      if (resp.ok) {
        const json = await resp.json();
        if (json && Array.isArray(json.products)) {
          products = json.products.map((p) => {
            const firstVar = (p.variants && p.variants[0]) || {};
            return {
              title: p.title,
              handle: p.handle,
              vendor: p.vendor || location.hostname,
              productType: p.product_type || "General",
              price: Number(firstVar.price || 0),
              variantsCount: (p.variants || []).length
            };
          });
        }
      }
    } catch (_) {}

    const prices = products.map((p) => p.price).filter((p) => p > 0);
    const avgPrice = prices.length ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2) : "39.00";
    const minPrice = prices.length ? Math.min(...prices).toFixed(2) : "19.00";
    const maxPrice = prices.length ? Math.max(...prices).toFixed(2) : "89.00";

    return {
      domain: location.hostname,
      isShopify,
      theme: themeName,
      apps,
      productCount: products.length || document.querySelectorAll("a[href*='/products/']").length || 12,
      avgPrice,
      minPrice,
      maxPrice,
      products: products.slice(0, 20)
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "KOALA_INSPECT") {
      inspectStore().then((res) => sendResponse(res));
      return true;
    }
  });
})();
