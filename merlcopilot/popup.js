let lastData = null;
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) return;
  chrome.tabs.sendMessage(tabs[0].id, { type: 'MERL_SUMMARIZE' }, (res) => {
    const out = document.getElementById('out');
    if (!res || !res.bullets) {
      out.textContent = 'Open any article, documentation page, or blog post to generate an instant executive summary.';
      return;
    }
    lastData = res;
    out.innerHTML = `<div style="color:#94a3b8;font-size:11px;margin-bottom:6px;"><strong>${res.wordCount.toLocaleString()}</strong> words analyzed</div><ul>` +
      res.bullets.map(b => `<li>${b.slice(0, 200)}</li>`).join('') + '</ul>';
  });
});

document.getElementById('copyBtn').addEventListener('click', () => {
  if (!lastData) return;
  const md = `# Summary: ${lastData.title}\nURL: ${lastData.url}\n\n` + lastData.bullets.map(b => `- ${b}`).join('\n');
  navigator.clipboard.writeText(md);
  document.getElementById('copyBtn').textContent = 'Copied to Clipboard! ✓';
});
