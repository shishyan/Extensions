chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SURFSEO_SUGGEST') {
    const q = encodeURIComponent(msg.query || '');
    fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${q}`)
      .then(r => r.json())
      .then(d => sendResponse({ ok: true, items: d[1] || [] }))
      .catch(e => sendResponse({ ok: false, items: [] }));
    return true;
  }
});
