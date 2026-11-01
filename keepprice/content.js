(() => {
  function detectDeals() {
    const url = location.href;
    const title = document.title;
    const priceMatches = document.body.innerText.match(/(?:\$|₹|€|£)\s?\d{1,6}(?:,\d{3})*(?:\.\d{2})?/g) || [];
    const uniquePrices = Array.from(new Set(priceMatches)).slice(0, 8);
    const asinMatch = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    const asin = asinMatch ? asinMatch[1] : null;
    const domain = location.hostname.replace(/^www\./, '');
    const coupons = [
      'WELCOME10', 'SAVE20', 'FIRST15', 'FREESHIP', 'VIP25', 'FLASH10', 'EXTRA15', 'NEWUSER'
    ];
    return { domain, title, asin, prices: uniquePrices, coupons };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'KEEPPRICE_SCAN') {
      sendResponse(detectDeals());
    }
  });
})();
