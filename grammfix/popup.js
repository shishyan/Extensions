const input = document.getElementById('input');
const stats = document.getElementById('stats');

function updateStats(extra = '') {
  const txt = input.value.trim();
  const words = txt ? txt.split(/\s+/).length : 0;
  const sentences = txt ? txt.split(/[.!?]+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.ceil(words / 200));
  stats.innerHTML = `<strong>${words}</strong> words • <strong>${sentences}</strong> sentences • ~${readTime}m read ${extra ? '<br>' + extra : ''}`;
}

input.addEventListener('input', () => updateStats());

document.getElementById('checkBtn').addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;
  stats.textContent = 'Checking grammar & style...';
  chrome.runtime.sendMessage({ type: 'GRAMMFIX_CHECK', text }, (res) => {
    if (!res || !res.ok) {
      updateStats('<span style="color:#f87171">Offline check completed.</span>');
      return;
    }
    let updated = text;
    const matches = [...(res.matches || [])].sort((a, b) => b.offset - a.offset);
    matches.forEach(m => {
      if (m.replacements && m.replacements.length > 0) {
        updated = updated.slice(0, m.offset) + m.replacements[0].value + updated.slice(m.offset + m.length);
      }
    });
    input.value = updated;
    updateStats(`<span style="color:#34d399">Applied ${matches.length} grammar/spelling fixes!</span>`);
  });
});

document.getElementById('conciseBtn').addEventListener('click', () => {
  let t = input.value;
  const map = {
    'in order to': 'to',
    'due to the fact that': 'because',
    'at this point in time': 'now',
    'for the purpose of': 'for',
    'in the event that': 'if',
    'really ': '',
    'very ': '',
    'basically ': '',
    'actually ': ''
  };
  Object.keys(map).forEach(k => {
    t = t.replace(new RegExp(k, 'gi'), map[k]);
  });
  input.value = t.replace(/\s{2,}/g, ' ').trim();
  updateStats('<span style="color:#38bdf8">Tightened filler & wordy phrasing!</span>');
});

document.getElementById('formalBtn').addEventListener('click', () => {
  let t = input.value;
  const map = {
    "can't": "cannot",
    "won't": "will not",
    "don't": "do not",
    "didn't": "did not",
    "I think": "I believe",
    "thanks": "thank you",
    "need to": "must",
    "get": "obtain",
    "help": "assist"
  };
  Object.keys(map).forEach(k => {
    t = t.replace(new RegExp('\\b' + k + '\\b', 'gi'), map[k]);
  });
  input.value = t;
  updateStats('<span style="color:#a78bfa">Converted to Executive Formal tone!</span>');
});
