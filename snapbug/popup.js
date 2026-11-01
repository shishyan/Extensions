let qaMeta = {
  url: 'https://example.com',
  title: 'Active Tab',
  viewport: '1440×900',
  dpr: 2,
  ua: navigator.userAgent,
  errors: [],
  palette: ['#0F172A', '#F43F5E', '#38BDF8', '#22C55E', '#F8FAFC'],
  fonts: ['Inter', 'system-ui'],
  assets: []
};

function renderTelemetry(res) {
  if (res) qaMeta = { ...qaMeta, ...res };
  const box = document.getElementById('meta');
  box.innerHTML = `
    <div><strong>Viewport:</strong> ${qaMeta.viewport} (@${qaMeta.dpr}x DPR) • <strong>Errors:</strong> <span style="color:${qaMeta.errors.length ? '#f87171' : '#4ade80'};">${qaMeta.errors.length}</span></div>
    <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;"><strong>URL:</strong> ${qaMeta.url}</div>
  `;

  if (qaMeta.inspectorOn) {
    document.getElementById('inspectBtn').textContent = '🛑 Stop Inspector';
  }

  document.getElementById('fontBadge').textContent = (qaMeta.fonts && qaMeta.fonts.length)
    ? qaMeta.fonts.slice(0, 2).join(', ')
    : 'system-ui';

  const pBox = document.getElementById('paletteBox');
  const colors = qaMeta.palette && qaMeta.palette.length ? qaMeta.palette : ['#0F172A', '#F43F5E', '#38BDF8'];
  pBox.innerHTML = colors.map(hex => `
    <span class="swatch" data-hex="${hex}">
      <span class="swatch-dot" style="background:${hex};"></span>
      <span>${hex}</span>
    </span>
  `).join('');

  pBox.querySelectorAll('.swatch').forEach(el => {
    el.addEventListener('click', () => {
      navigator.clipboard.writeText(el.dataset.hex);
      el.querySelector('span:last-child').textContent = 'Copied!';
      setTimeout(() => { el.querySelector('span:last-child').textContent = el.dataset.hex; }, 900);
    });
  });

  const aBox = document.getElementById('assetsBox');
  const assets = qaMeta.assets || [];
  document.getElementById('assetCount').textContent = assets.length;
  if (!assets.length) {
    aBox.innerHTML = '<div style="color:#64748b;">No external images/SVGs detected on page.</div>';
  } else {
    aBox.innerHTML = assets.map(a => `
      <div class="asset-row">
        <span style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><strong>[${a.type}]</strong> ${a.url}</span>
        <span style="color:#94a3b8;">${a.dim}</span>
      </div>
    `).join('');
  }
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) {
    renderTelemetry();
    return;
  }
  chrome.tabs.sendMessage(tabs[0].id, { type: 'SNAPBUG_META' }, (res) => {
    if (chrome.runtime.lastError || !res) {
      renderTelemetry();
      return;
    }
    renderTelemetry(res);
  });
});

document.getElementById('snapBtn').addEventListener('click', () => {
  const btn = document.getElementById('snapBtn');
  btn.textContent = '📸 Capturing...';
  chrome.runtime.sendMessage({ type: 'SNAPBUG_CAPTURE' }, (res) => {
    if (res && res.ok && res.dataUrl) {
      const img = document.getElementById('preview');
      img.src = res.dataUrl;
      img.style.display = 'block';
      const a = document.createElement('a');
      a.href = res.dataUrl;
      a.download = `snapbug-${Date.now()}.png`;
      a.click();
      btn.textContent = '✅ PNG Downloaded!';
    } else {
      btn.textContent = '📸 Capture HD PNG';
    }
  });
});

document.getElementById('inspectBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: 'SNAPBUG_INSPECT' }, (res) => {
      document.getElementById('inspectBtn').textContent = (res && res.inspectorOn)
        ? '🛑 Stop Inspector'
        : '🔍 Live CSS Inspector';
    });
  });
});

document.getElementById('exportAssetsBtn').addEventListener('click', () => {
  const payload = JSON.stringify({
    url: qaMeta.url,
    palette: qaMeta.palette,
    fonts: qaMeta.fonts,
    assets: qaMeta.assets
  }, null, 2);
  navigator.clipboard.writeText(payload);
  document.getElementById('exportAssetsBtn').textContent = 'Copied! ✓';
});

document.getElementById('copyBugBtn').addEventListener('click', () => {
  const md = [
    `### 🐞 QA Bug & Design Report (SnapBug Pro)`,
    `- **URL**: ${qaMeta.url}`,
    `- **Title**: ${qaMeta.title || 'N/A'}`,
    `- **Viewport**: ${qaMeta.viewport} (@${qaMeta.dpr}x DPR)`,
    `- **Fonts Detected**: ${(qaMeta.fonts || []).join(', ') || 'Default'}`,
    `- **Color Palette**: ${(qaMeta.palette || []).join(', ')}`,
    `- **User-Agent**: \`${qaMeta.ua}\``,
    `- **Console Errors (${qaMeta.errors.length})**: ${qaMeta.errors.length ? qaMeta.errors.join(' | ') : '0 Errors (Clean)'}`
  ].join('\n');
  navigator.clipboard.writeText(md);
  document.getElementById('copyBugBtn').textContent = '✅ Copied Full Markdown QA Report!';
});
