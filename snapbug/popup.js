let qaMeta = null;
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) return;
  chrome.tabs.sendMessage(tabs[0].id, { type: 'SNAPBUG_META' }, (res) => {
    const box = document.getElementById('meta');
    if (!res) {
      box.textContent = 'Reload page to attach QA telemetry hook.';
      return;
    }
    qaMeta = res;
    box.innerHTML = `
      <div><strong>Viewport:</strong> ${res.viewport} (@${res.dpr}x DPR)</div>
      <div><strong>URL:</strong> ${res.url.slice(0, 48)}</div>
      <div><strong>Console Errors:</strong> ${res.errors.length} captured</div>
    `;
  });
});

document.getElementById('snapBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'SNAPBUG_CAPTURE' }, (res) => {
    if (res && res.ok && res.dataUrl) {
      const img = document.getElementById('preview');
      img.src = res.dataUrl;
      img.style.display = 'block';
      const a = document.createElement('a');
      a.href = res.dataUrl;
      a.download = `snapbug-${Date.now()}.png`;
      a.click();
    }
  });
});

document.getElementById('inspectBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: 'SNAPBUG_INSPECT' }, (res) => {
      document.getElementById('inspectBtn').textContent = (res && res.inspectorOn)
        ? '🛑 Disable Live CSS Inspector'
        : '🔍 Toggle Live CSS & Box-Model Inspector';
    });
  });
});

document.getElementById('copyBugBtn').addEventListener('click', () => {
  if (!qaMeta) return;
  const md = `### 🐞 QA Bug Report (SnapBug)\n- **URL**: ${qaMeta.url}\n- **Viewport**: ${qaMeta.viewport} (@${qaMeta.dpr}x)\n- **User-Agent**: \`${qaMeta.ua}\`\n- **Console Errors**: ${qaMeta.errors.length ? qaMeta.errors.join('; ') : 'None'}\n`;
  navigator.clipboard.writeText(md);
  document.getElementById('copyBugBtn').textContent = 'Copied Markdown Bug Report! ✓';
});
