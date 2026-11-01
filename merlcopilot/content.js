(() => {
  function extractSummary() {
    const paragraphs = Array.from(document.querySelectorAll('article p, main p, p'))
      .map(p => p.innerText.trim())
      .filter(t => t.length > 65);
    const title = document.title || '';
    const words = new Set(title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3));
    const scored = paragraphs.map((p, idx) => {
      let score = idx === 0 ? 3 : 1;
      words.forEach(w => {
        if (p.toLowerCase().includes(w)) score += 2;
      });
      if (/\d+%?|\$\d+|key|important|conclusion|summary|result/i.test(p)) score += 2;
      return { p, score, idx };
    });
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 5).sort((a, b) => a.idx - b.idx).map(x => x.p);
    return {
      title,
      url: location.href,
      wordCount: document.body.innerText.split(/\s+/).length,
      bullets: top
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'MERL_SUMMARIZE') {
      sendResponse(extractSummary());
    }
  });

  // Floating quick-trigger pill on bottom-right
  const fab = document.createElement('div');
  fab.className = 'merlcopilot-fab';
  fab.title = 'MerlCopilot: Click for Instant Page TL;DR';
  fab.innerHTML = '⚡ TL;DR';
  document.body.appendChild(fab);

  let drawer = null;
  fab.addEventListener('click', () => {
    if (drawer) {
      drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
      return;
    }
    const data = extractSummary();
    drawer = document.createElement('div');
    drawer.className = 'merlcopilot-drawer';
    const bulletsHtml = data.bullets.length
      ? data.bullets.map(b => `<li>${b.slice(0, 220)}${b.length > 220 ? '…' : ''}</li>`).join('')
      : '<li>No long-form article text detected on this view.</li>';
    drawer.innerHTML = `
      <div class="mc-hdr">
        <strong>⚡ MerlCopilot Summary</strong>
        <span class="mc-close" style="cursor:pointer;">✕</span>
      </div>
      <div class="mc-meta">${data.wordCount.toLocaleString()} words • ~${Math.max(1, Math.ceil(data.wordCount/220))} min read</div>
      <ul class="mc-list">${bulletsHtml}</ul>
    `;
    document.body.appendChild(drawer);
    drawer.querySelector('.mc-close').onclick = () => { drawer.style.display = 'none'; };
  });
})();
