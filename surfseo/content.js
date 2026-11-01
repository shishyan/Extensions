(() => {
  function auditPage() {
    const title = document.title || '';
    const descEl = document.querySelector('meta[name="description"]');
    const desc = descEl ? descEl.getAttribute('content') || '' : '';
    const canonEl = document.querySelector('link[rel="canonical"]');
    const canonical = canonEl ? canonEl.getAttribute('href') || '' : '';
    const h1s = Array.from(document.querySelectorAll('h1')).map(e => e.innerText.trim()).filter(Boolean);
    const h2s = Array.from(document.querySelectorAll('h2')).map(e => e.innerText.trim()).filter(Boolean);
    const h3s = Array.from(document.querySelectorAll('h3')).map(e => e.innerText.trim()).filter(Boolean);
    const links = Array.from(document.querySelectorAll('a[href]'));
    const internal = links.filter(a => a.hostname === location.hostname).length;
    const external = links.length - internal;
    const words = document.body.innerText.trim().split(/\s+/).filter(Boolean);
    const freq = {};
    const stop = new Set(['the','and','for','that','this','with','from','your','have','are','not','but','what','all','were','when','can','said','there','use','each','which','she','how','their','will','other','about','out','many','then','them','these','some','her','would','make','like','him','into','time','has','look','two','more']);
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean.length > 3 && !stop.has(clean)) {
        freq[clean] = (freq[clean] || 0) + 1;
      }
    });
    const topKeywords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);
    let score = 50;
    if (title.length >= 30 && title.length <= 65) score += 15;
    if (desc.length >= 70 && desc.length <= 165) score += 15;
    if (h1s.length === 1) score += 10;
    if (h2s.length >= 2) score += 10;
    return {
      score: Math.min(100, score),
      title, desc, canonical,
      h1Count: h1s.length, h2Count: h2s.length, h3Count: h3s.length,
      h1First: h1s[0] || 'Missing H1',
      internal, external,
      wordCount: words.length,
      topKeywords
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SURFSEO_AUDIT') {
      sendResponse(auditPage());
    }
  });
})();
