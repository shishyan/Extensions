const templates = {
  founder: "Hi {{FirstName}},\n\nLoved what you and the team at {{Company}} are building. I put together a quick 2-minute breakdown of how you can automate your workflow with zero recurring SaaS cost.\n\nOpen to a quick 10-min chat this week?\n\nBest,\nNagarajan",
  followup: "Hi {{FirstName}},\n\nJust floating this to the top of your inbox in case it got buried. Would love to share the free toolkit we built for {{Company}}.\n\nBest,\nNagarajan",
  collab: "Hi {{FirstName}},\n\nHuge fan of your work at {{Company}}! We're releasing a suite of 100% open, zero-paywall creator extensions and would love to feature your feedback.\n\nCheers,\nNagarajan"
};

const tplSelect = document.getElementById('tplSelect');
const bodyBox = document.getElementById('bodyBox');
const varsInput = document.getElementById('vars');

function renderTemplate() {
  let raw = templates[tplSelect.value] || '';
  const pairs = (varsInput.value || 'FirstName=there, Company=your team').split(',');
  pairs.forEach(p => {
    const [k, v] = p.split('=').map(s => (s || '').trim());
    if (k && v) {
      raw = raw.replace(new RegExp('\\{\\{' + k + '\\}\\}', 'gi'), v);
    }
  });
  bodyBox.value = raw;
}

tplSelect.addEventListener('change', renderTemplate);
varsInput.addEventListener('input', renderTemplate);
renderTemplate();

document.getElementById('insertBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: 'MASSMAIL_INSERT', body: bodyBox.value }, (res) => {
      if (!res || !res.ok) {
        navigator.clipboard.writeText(bodyBox.value);
        document.getElementById('insertBtn').textContent = 'Copied to Clipboard! ✓';
      } else {
        document.getElementById('insertBtn').textContent = 'Inserted into Compose! ✓';
      }
    });
  });
});

document.getElementById('mailtoBtn').addEventListener('click', () => {
  const subject = encodeURIComponent('Quick idea for your team');
  const body = encodeURIComponent(bodyBox.value);
  window.open(`mailto:?subject=${subject}&body=${body}`);
});
