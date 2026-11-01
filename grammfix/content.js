(() => {
  let badge = null;
  let activeEl = null;

  function analyzeLocalStyle(text) {
    const issues = [];
    const passiveRegex = /\b(am|are|is|was|were|be|been|being)\s+(\w+ed|written|taken|made|done|given|shown|known|seen)\b/gi;
    let m;
    while ((m = passiveRegex.exec(text)) !== null) {
      issues.push({
        message: 'Passive voice detected ("' + m[0] + '"). Consider active voice for stronger clarity.',
        replacement: m[0],
        type: 'style'
      });
    }
    const wordyMap = {
      'in order to': 'to',
      'due to the fact that': 'because',
      'at this point in time': 'now',
      'for the purpose of': 'for',
      'in the event that': 'if',
      'has the ability to': 'can',
      'make a decision': 'decide'
    };
    Object.keys(wordyMap).forEach(phrase => {
      const idx = text.toLowerCase().indexOf(phrase);
      if (idx !== -1) {
        issues.push({
          message: 'Wordy phrase "' + phrase + '". Replace with "' + wordyMap[phrase] + '".',
          orig: phrase,
          replacement: wordyMap[phrase],
          type: 'conciseness'
        });
      }
    });
    return issues;
  }

  function ensureBadge() {
    if (badge) return badge;
    badge = document.createElement('div');
    badge.className = 'grammfix-floating-badge';
    badge.innerHTML = '<span class="gf-dot"></span><span class="gf-count">GrammFix Ready</span>';
    badge.style.display = 'none';
    document.body.appendChild(badge);
    return badge;
  }

  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (!el) return;
    const isInput = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && ['text', 'search', 'email'].includes(el.type)) || el.isContentEditable;
    if (!isInput) return;
    activeEl = el;
    const b = ensureBadge();
    const rect = el.getBoundingClientRect();
    if (rect.width > 120 && rect.height > 28) {
      b.style.display = 'flex';
      b.style.top = (window.scrollY + rect.bottom - 28) + 'px';
      b.style.left = (window.scrollX + rect.right - 135) + 'px';
      updateCheck(el);
    }
  });

  let timer = null;
  document.addEventListener('input', (e) => {
    if (e.target === activeEl) {
      clearTimeout(timer);
      timer = setTimeout(() => updateCheck(activeEl), 650);
    }
  });

  function getText(el) {
    return el.isContentEditable ? el.innerText : (el.value || '');
  }

  function setText(el, val) {
    if (el.isContentEditable) el.innerText = val;
    else el.value = val;
  }

  function updateCheck(el) {
    const text = getText(el).trim();
    const b = ensureBadge();
    if (text.length < 5) {
      b.innerHTML = '<span class="gf-dot ok"></span><span class="gf-count">GrammFix: 0 issues</span>';
      return;
    }
    const localIssues = analyzeLocalStyle(text);
    chrome.runtime.sendMessage({ type: 'GRAMMFIX_CHECK', text }, (res) => {
      const apiMatches = (res && res.ok && res.matches) ? res.matches : [];
      const total = localIssues.length + apiMatches.length;
      const words = text.split(/\s+/).filter(Boolean).length;
      if (total === 0) {
        b.innerHTML = `<span class="gf-dot ok"></span><span class="gf-count">${words}w • Perfect</span>`;
      } else {
        b.innerHTML = `<span class="gf-dot warn"></span><span class="gf-count">${total} Fix${total > 1 ? 'es' : ''} (Click)</span>`;
        b.onclick = () => {
          let updated = text;
          // Apply API replacements from end to start
          const sorted = [...apiMatches].sort((a, b) => b.offset - a.offset);
          sorted.forEach(m => {
            if (m.replacements && m.replacements.length > 0) {
              const rep = m.replacements[0].value;
              updated = updated.slice(0, m.offset) + rep + updated.slice(m.offset + m.length);
            }
          });
          localIssues.forEach(iss => {
            if (iss.orig && iss.replacement) {
              updated = updated.replace(new RegExp(iss.orig, 'gi'), iss.replacement);
            }
          });
          setText(el, updated);
          b.innerHTML = `<span class="gf-dot ok"></span><span class="gf-count">All Fixed! ✨</span>`;
        };
      }
    });
  }
})();
