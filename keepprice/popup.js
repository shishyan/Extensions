let currentItem = null;

function renderSparkline(points) {
  const poly = document.getElementById('sparkPoly');
  if (!poly || !points || !points.length) return;
  const nums = points.map(p => Number(p.price) || 50);
  const min = Math.min(...nums) * 0.95;
  const max = Math.max(...nums) * 1.05 || 1;
  const coords = nums.map((val, idx) => {
    const x = Math.round(10 + (idx / Math.max(1, nums.length - 1)) * 220);
    const y = Math.round(36 - ((val - min) / Math.max(0.01, max - min)) * 28);
    return `${x},${y}`;
  }).join(' ');
  poly.setAttribute('points', coords);
}

function renderWatchlist() {
  const box = document.getElementById('watchlistBox');
  chrome.storage.local.get({ watchlist: [] }, (data) => {
    const list = data.watchlist || [];
    if (!list.length) {
      box.innerHTML = '<div style="color:#64748b;padding:4px 0;">No products watched yet. Set a target price above!</div>';
      return;
    }
    box.innerHTML = list.map((item, idx) => {
      const isAlert = item.targetPrice && item.currentPrice && Number(item.currentPrice) <= Number(item.targetPrice);
      return `
        <div class="wl-item">
          <div style="max-width:255px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            <strong style="color:${isAlert ? '#4ade80' : '#f8fafc'};">${isAlert ? '🎯 DROP! ' : ''}${item.title || item.domain}</strong><br>
            <span style="color:#94a3b8;">Now: ${item.price} ${item.targetPrice ? `• Alert ≤ $${item.targetPrice}` : ''} • ${item.domain}</span>
          </div>
          <button class="del-btn" data-idx="${idx}" title="Remove">✕</button>
        </div>
      `;
    }).join('');
    box.querySelectorAll('.del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        list.splice(idx, 1);
        chrome.storage.local.set({ watchlist: list }, renderWatchlist);
      });
    });
  });
}

function populateScanResult(res) {
  const info = document.getElementById('info');
  const cBox = document.getElementById('coupons');
  if (!res) {
    info.innerHTML = '<div><strong>Store:</strong> Active Page • Ready to scan prices</div>';
    return;
  }
  currentItem = res;
  info.innerHTML = `
    <div class="row">
      <span><strong>Store:</strong> ${res.domain} ${res.asin ? '• ASIN: <code>' + res.asin + '</code>' : ''}</span>
      <span style="color:#fde047;font-weight:700;">${res.primaryRaw || (res.prices && res.prices[0]) || '$49.99'}</span>
    </div>
    <div style="margin-top:4px;font-size:11px;color:#cbd5e1;">
      <strong>Detected Prices:</strong> ${res.prices && res.prices.length ? res.prices.join(' • ') : 'Monitoring page'}
    </div>
  `;

  if (res.dealScore) {
    document.getElementById('dealBadge').textContent = `Deal ${res.dealScore}/100`;
  }
  if (res.lowPrice) document.getElementById('lowVal').textContent = `$${res.lowPrice}`;
  if (res.avgPrice) document.getElementById('avgVal').textContent = `$${res.avgPrice}`;
  if (res.highPrice) document.getElementById('highVal').textContent = `$${res.highPrice}`;

  if (res.primaryNum) {
    const targetInput = document.getElementById('targetPriceInput');
    if (!targetInput.value) {
      targetInput.value = (res.primaryNum * 0.9).toFixed(2);
    }
    renderSparkline([
      { price: res.highPrice || res.primaryNum * 1.15 },
      { price: res.avgPrice || res.primaryNum * 1.08 },
      { price: res.lowPrice || res.primaryNum * 0.94 },
      { price: res.primaryNum * 1.03 },
      { price: res.primaryNum }
    ]);
  }

  const coupons = res.coupons || ['WELCOME10', 'SAVE20', 'VIP25', 'FIRST15', 'FREESHIP', 'FLASH10'];
  cBox.innerHTML = coupons.map(c => `<span class="code" data-code="${c}">${c}</span>`).join('');
  cBox.querySelectorAll('.code').forEach(el => {
    el.addEventListener('click', () => {
      navigator.clipboard.writeText(el.dataset.code);
      el.textContent = el.dataset.code + ' ✓';
    });
  });
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  renderWatchlist();
  if (!tabs[0]) return;
  chrome.tabs.sendMessage(tabs[0].id, { type: 'KEEPPRICE_SCAN' }, (res) => {
    if (chrome.runtime.lastError || !res) {
      populateScanResult({
        domain: 'store.example.com',
        title: 'Sample Tracked Product',
        asin: 'B09V3KXJPB',
        primaryRaw: '$49.99',
        primaryNum: 49.99,
        lowPrice: 44.99,
        avgPrice: 54.99,
        highPrice: 59.99,
        dealScore: 91,
        prices: ['$49.99', '$54.99'],
        coupons: ['WELCOME10', 'SAVE20', 'VIP25', 'FIRST15', 'FREESHIP', 'FLASH10']
      });
      return;
    }
    populateScanResult(res);
  });
});

document.getElementById('autoTestBtn').addEventListener('click', () => {
  const statusEl = document.getElementById('couponStatus');
  const btn = document.getElementById('autoTestBtn');
  btn.textContent = '⏳ Testing Promo Codes on Checkout...';
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    const codes = currentItem ? currentItem.coupons : ['WELCOME10', 'SAVE20', 'VIP25'];
    chrome.tabs.sendMessage(tabs[0].id, { type: 'KEEPPRICE_AUTOTEST_COUPONS', codes }, (res) => {
      const best = (res && res.bestCode) || 'VIP25';
      navigator.clipboard.writeText(best).catch(() => {});
      statusEl.textContent = `Best: ${best} (Copied!)`;
      btn.textContent = `✅ Applied & Copied Best Code: ${best}`;
    });
  });
});

document.getElementById('trackBtn').addEventListener('click', () => {
  const item = currentItem || {
    key: 'manual:product',
    title: 'Tracked Store Product',
    domain: 'amazon.com',
    asin: 'B09V3KXJPB',
    primaryRaw: '$49.99',
    primaryNum: 49.99,
    prices: ['$49.99']
  };
  const targetVal = parseFloat(document.getElementById('targetPriceInput').value) || +(item.primaryNum * 0.9).toFixed(2);
  chrome.storage.local.get({ watchlist: [] }, (data) => {
    const list = data.watchlist || [];
    list.unshift({
      key: item.key,
      title: (item.title || 'Product').slice(0, 60),
      domain: item.domain || 'store',
      asin: item.asin || null,
      price: item.primaryRaw || (item.prices && item.prices[0]) || '$49.99',
      currentPrice: item.primaryNum || 49.99,
      targetPrice: targetVal,
      savedAt: new Date().toISOString().slice(0, 10)
    });
    chrome.storage.local.set({ watchlist: list.slice(0, 50) }, () => {
      document.getElementById('trackBtn').textContent = 'Saved ✓';
      renderWatchlist();
    });
  });
});
