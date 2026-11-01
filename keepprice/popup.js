let currentItem = null;
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) return;
  chrome.tabs.sendMessage(tabs[0].id, { type: 'KEEPPRICE_SCAN' }, (res) => {
    const info = document.getElementById('info');
    const cBox = document.getElementById('coupons');
    if (!res) {
      info.textContent = 'Open any store or product page to track prices.';
      return;
    }
    currentItem = res;
    info.innerHTML = `
      <div><strong>Store:</strong> ${res.domain} ${res.asin ? '• ASIN: <code>' + res.asin + '</code>' : ''}</div>
      <div style="margin-top:4px;"><strong>Detected Prices:</strong> ${res.prices.length ? res.prices.join(' • ') : 'No price tag detected'}</div>
    `;
    cBox.innerHTML = '<strong>Click any promo code to copy:</strong><br>' +
      res.coupons.map(c => `<span class="code" data-code="${c}">${c}</span>`).join('');
    cBox.querySelectorAll('.code').forEach(el => {
      el.addEventListener('click', () => {
        navigator.clipboard.writeText(el.dataset.code);
        el.textContent = el.dataset.code + ' ✓';
      });
    });
  });
});

document.getElementById('trackBtn').addEventListener('click', () => {
  if (!currentItem) return;
  chrome.storage.local.get({ watchlist: [] }, (data) => {
    const list = data.watchlist;
    list.unshift({
      title: currentItem.title.slice(0, 60),
      domain: currentItem.domain,
      price: currentItem.prices[0] || 'N/A',
      savedAt: new Date().toISOString().slice(0, 10)
    });
    chrome.storage.local.set({ watchlist: list.slice(0, 50) }, () => {
      document.getElementById('trackBtn').textContent = `Saved! (${list.length} items in local watchlist)`;
    });
  });
});
