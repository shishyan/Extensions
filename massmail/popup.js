const TEMPLATES = {
  founder: {
    subject: "Quick workflow idea for {{Company}} ({{Role}})",
    body: "Hi {{FirstName}},\n\nLoved what you and the team at {{Company}} are building. As {{Role}}, I figured you'd appreciate a quick 2-minute breakdown of how teams are automating this workflow with zero recurring SaaS cost.\n\nOpen to a quick 10-min chat this week?\n\nBest,\nNagarajan"
  },
  followup: {
    subject: "Re: Quick idea for {{Company}}, {{FirstName}}",
    body: "Hi {{FirstName}},\n\nJust floating this to the top of your inbox in case it got buried. Would love to share the free zero-paywall toolkit we built for {{Company}}.\n\nNo pressure at all — let me know if I should send the link over!\n\nBest,\nNagarajan"
  },
  collab: {
    subject: "{{Company}} × Creator Open Suite Collaboration",
    body: "Hi {{FirstName}},\n\nHuge fan of your work as {{Role}} at {{Company}}! We're releasing a suite of 100% free, zero-watermark creator extensions and would love to feature your feedback.\n\nCheers,\nNagarajan"
  },
  sales: {
    subject: "Cutting {{Company}}'s tool stack cost by 100%",
    body: "Hi {{FirstName}},\n\nWe noticed fast-growing teams like {{Company}} often spend $200+/seat on browser productivity tools. We built a local-first, privacy-safe replacement tailored for {{Role}}s.\n\nHappy to share full access if useful!\n\nBest,\nNagarajan"
  },
  recruiting: {
    subject: "{{FirstName}} — loving your work at {{Company}}",
    body: "Hi {{FirstName}},\n\nYour background as {{Role}} at {{Company}} stood out immediately. We're assembling a small, high-impact engineering & product group and would love to connect briefly.\n\nWarm regards,\nNagarajan"
  }
};

const tplSelect = document.getElementById('tplSelect');
const csvBox = document.getElementById('csvBox');
const subjectBox = document.getElementById('subjectBox');
const bodyBox = document.getElementById('bodyBox');
const recipientBadge = document.getElementById('recipientBadge');
const queueBox = document.getElementById('queueBox');

let recipients = [];
let currentIndex = 0;

function parseCSV(text) {
  const lines = (text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) {
    return [{ email: 'contact@example.com', FirstName: 'there', Company: 'your team', Role: 'Leader' }];
  }
  const parsed = [];
  lines.forEach((line, idx) => {
    const parts = line.split(',').map(s => s.trim());
    // Skip header row if first row says "email"
    if (idx === 0 && /^email$/i.test(parts[0]) && lines.length > 1) return;
    if (line.includes('=')) {
      // Support legacy key=value format too: FirstName=Arun, Company=Acme
      const obj = { email: 'lead@company.com', FirstName: 'there', Company: 'your team', Role: 'Team Lead' };
      parts.forEach(p => {
        const [k, v] = p.split('=').map(s => (s || '').trim());
        if (k && v) obj[k] = v;
      });
      parsed.push(obj);
    } else {
      parsed.push({
        email: parts[0] || 'lead@company.com',
        FirstName: parts[1] || 'there',
        Company: parts[2] || 'your team',
        Role: parts[3] || 'Leader'
      });
    }
  });
  return parsed.length ? parsed : [{ email: 'contact@example.com', FirstName: 'there', Company: 'your team', Role: 'Leader' }];
}

function interpolate(str, rec) {
  if (!str) return '';
  let out = str;
  const map = {
    FirstName: rec.FirstName || 'there',
    Company: rec.Company || 'your team',
    Role: rec.Role || 'Leader',
    Email: rec.email || ''
  };
  Object.keys(map).forEach(k => {
    out = out.replace(new RegExp('\\{\\{\\s*' + k + '\\s*\\}\\}', 'gi'), map[k]);
  });
  return out;
}

function renderPreview() {
  recipients = parseCSV(csvBox.value);
  if (currentIndex >= recipients.length) currentIndex = 0;
  if (currentIndex < 0) currentIndex = recipients.length - 1;

  const rec = recipients[currentIndex];
  const tpl = TEMPLATES[tplSelect.value] || TEMPLATES.founder;

  recipientBadge.textContent = `Recipient ${currentIndex + 1} of ${recipients.length}: ${rec.FirstName} (${rec.Company})`;
  subjectBox.value = interpolate(tpl.subject, rec);
  bodyBox.value = interpolate(tpl.body, rec);
}

tplSelect.addEventListener('change', renderPreview);
csvBox.addEventListener('input', renderPreview);

document.getElementById('prevBtn').addEventListener('click', () => {
  currentIndex--;
  renderPreview();
});

document.getElementById('nextBtn').addEventListener('click', () => {
  currentIndex++;
  renderPreview();
});

renderPreview();

document.getElementById('insertBtn').addEventListener('click', () => {
  const rec = recipients[currentIndex] || {};
  const payload = {
    type: 'MASSMAIL_INSERT',
    email: rec.email || '',
    subject: subjectBox.value,
    body: bodyBox.value
  };
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, payload, (res) => {
      const btn = document.getElementById('insertBtn');
      if (chrome.runtime.lastError || !res || !res.ok) {
        navigator.clipboard.writeText(`${subjectBox.value}\n\n${bodyBox.value}`).catch(() => {});
        btn.textContent = 'Copied Merged Email! ✓';
      } else {
        btn.textContent = 'Inserted into Compose! ✓';
      }
      setTimeout(() => {
        btn.textContent = '⚡ Insert into Gmail / Compose';
      }, 1400);
    });
  });
});

document.getElementById('mailtoBtn').addEventListener('click', () => {
  recipients = parseCSV(csvBox.value);
  const tpl = TEMPLATES[tplSelect.value] || TEMPLATES.founder;

  queueBox.style.display = 'block';
  queueBox.innerHTML = `<div style="color:#93c5fd;font-weight:700;margin-bottom:4px;">📤 Batch Sequence Ready (${recipients.length} Personalized Drafts):</div>` +
    recipients.map((rec, i) => {
      const subj = encodeURIComponent(interpolate(tpl.subject, rec));
      const body = encodeURIComponent(interpolate(tpl.body, rec));
      const href = `mailto:${encodeURIComponent(rec.email)}?subject=${subj}&body=${body}`;
      return `
        <div class="q-item">
          <span>${i + 1}. <strong>${rec.FirstName}</strong> (${rec.Company}) &lt;${rec.email}&gt;</span>
          <a href="${href}" target="_blank">Launch ↗</a>
        </div>
      `;
    }).join('');

  // Also launch the current selected recipient immediately
  const activeRec = recipients[currentIndex] || recipients[0];
  if (activeRec) {
    const subj = encodeURIComponent(subjectBox.value);
    const body = encodeURIComponent(bodyBox.value);
    window.open(`mailto:${encodeURIComponent(activeRec.email || '')}?subject=${subj}&body=${body}`);
  }
});
