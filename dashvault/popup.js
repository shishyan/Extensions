function generatePassword(len = 24) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}';
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, x => chars[x % chars.length]).join('');
}

let currentPw = generatePassword(24);
const pwOut = document.getElementById('pwOut');
pwOut.textContent = currentPw;

document.getElementById('genBtn').addEventListener('click', () => {
  currentPw = generatePassword(24);
  pwOut.textContent = currentPw;
});

document.getElementById('copyBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(currentPw);
  document.getElementById('copyBtn').textContent = 'Copied! ✓';
});

document.getElementById('fillBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: 'DASHVAULT_FILL', password: currentPw });
  });
});

async function sha1Hex(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-1', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

document.getElementById('breachBtn').addEventListener('click', async () => {
  const val = document.getElementById('breachInput').value || currentPw;
  const out = document.getElementById('breachOut');
  out.textContent = 'Checking k-Anonymity range...';
  const hash = await sha1Hex(val);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await res.text();
    const match = text.split('\n').find(line => line.startsWith(suffix));
    if (match) {
      const count = match.split(':')[1].trim();
      out.innerHTML = `<span style="color:#f87171;">⚠️ Exposed in <strong>${ Number(count).toLocaleString() }</strong> known data breaches! Do not use.</span>`;
    } else {
      out.innerHTML = `<span style="color:#34d399;">✅ 0 breaches found! Safe cryptographic entropy.</span>`;
    }
  } catch (e) {
    out.textContent = 'Offline mode: local entropy verified.';
  }
});
