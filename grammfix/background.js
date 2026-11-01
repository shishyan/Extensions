chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GRAMMFIX_CHECK') {
    const text = msg.text || '';
    const url = 'https://api.languagetool.org/v2/check';
    const params = new URLSearchParams();
    params.append('text', text);
    params.append('language', msg.lang || 'en-US');
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    })
      .then(r => r.json())
      .then(data => sendResponse({ ok: true, matches: data.matches || [] }))
      .catch(err => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
});
