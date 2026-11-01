let leadData = null;
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) return;
  chrome.tabs.sendMessage(tabs[0].id, { type: 'HUNTLEAD_SCAN' }, (res) => {
    const eBox = document.getElementById('emails');
    const pBox = document.getElementById('patterns');
    if (!res) {
      eBox.textContent = 'Refresh page to scan emails & corporate patterns.';
      return;
    }
    leadData = res;
    if (res.emails.length > 0) {
      eBox.innerHTML = `<strong>Found ${res.emails.length} Email(s) on ${res.domain}:</strong><br>` +
        res.emails.map(e => `<span class="tag">${e}</span>`).join('');
    } else {
      eBox.innerHTML = `<strong>No direct emails in DOM on ${res.domain}.</strong> Use verified corporate patterns below:`;
    }
    pBox.innerHTML = `<strong>Corporate Permutations (@${res.domain}):</strong><br>` +
      res.patterns.map(p => `<span class="tag">${p}</span>`).join('');
  });
});

document.getElementById('exportBtn').addEventListener('click', () => {
  if (!leadData) return;
  const rows = [['Domain', 'Email_or_Pattern', 'Type']];
  leadData.emails.forEach(e => rows.push([leadData.domain, e, 'Extracted']));
  leadData.patterns.forEach(p => rows.push([leadData.domain, p, 'Pattern']));
  const csv = rows.map(r => r.join(',')).join('\n');
  navigator.clipboard.writeText(csv);
  document.getElementById('exportBtn').textContent = 'CSV Copied to Clipboard! ✓';
});
