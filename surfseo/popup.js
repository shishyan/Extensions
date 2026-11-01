chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) return;
  chrome.tabs.sendMessage(tabs[0].id, { type: 'SURFSEO_AUDIT' }, (res) => {
    const box = document.getElementById('audit');
    if (!res) {
      box.textContent = 'Reload the tab to inspect on-page SEO metrics.';
      return;
    }
    document.getElementById('scoreBadge').textContent = `SEO: ${res.score}/100`;
    const kws = res.topKeywords.map(([w, c]) => `<span class="kw">${w} (${c})</span>`).join('');
    box.innerHTML = `
      <div><strong>Title (${res.title.length}c):</strong> ${res.title.slice(0, 70)}</div>
      <div><strong>Meta Desc (${res.desc.length}c):</strong> ${res.desc ? res.desc.slice(0, 85) + '…' : '<span style="color:#f87171">Missing</span>'}</div>
      <div><strong>Headings:</strong> H1: ${res.h1Count} | H2: ${res.h2Count} | H3: ${res.h3Count} • <strong>Words:</strong> ${res.wordCount}</div>
      <div><strong>Links:</strong> ${res.internal} internal / ${res.external} external</div>
      <div style="margin-top:4px;"><strong>Top NLP Terms:</strong><br>${kws}</div>
    `;
  });
});

document.getElementById('kwBtn').addEventListener('click', () => {
  const query = document.getElementById('kwInput').value.trim();
  if (!query) return;
  chrome.runtime.sendMessage({ type: 'SURFSEO_SUGGEST', query }, (res) => {
    const out = document.getElementById('kwOut');
    if (!res || !res.items || res.items.length === 0) {
      out.textContent = 'No suggestions returned.';
      return;
    }
    out.innerHTML = '<strong>High-Intent Autocomplete Keywords:</strong><br>' +
      res.items.map(i => `<span class="kw">${i}</span>`).join('');
  });
});
