(() => {
  function findUsernameFields() {
    const selectors = [
      'input[type="email"]',
      'input[autocomplete="username"]',
      'input[name*="user" i]',
      'input[name*="email" i]',
      'input[name*="login" i]',
      'input[id*="user" i]',
      'input[id*="email" i]',
      'input[type="text"]'
    ];
    const seen = new Set();
    const out = [];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!seen.has(el) && el.offsetParent !== null) {
          seen.add(el);
          out.push(el);
        }
      });
    });
    return out;
  }

  function fillCredentials(username, password) {
    const pwFields = Array.from(document.querySelectorAll('input[type="password"]'));
    let filledCount = 0;

    if (username) {
      const userFields = findUsernameFields();
      if (userFields[0]) {
        userFields[0].value = username;
        userFields[0].classList.add('dashvault-filled-field');
        userFields[0].dispatchEvent(new Event('input', { bubbles: true }));
        userFields[0].dispatchEvent(new Event('change', { bubbles: true }));
        filledCount++;
      }
    }

    if (password) {
      pwFields.forEach(el => {
        el.value = password;
        el.classList.add('dashvault-filled-field');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        filledCount++;
      });
    }

    return {
      ok: true,
      filled: filledCount,
      pwFields: pwFields.length,
      domain: (location.hostname || 'local').replace(/^www\./, '')
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'DASHVAULT_FILL') {
      const res = fillCredentials(msg.username || '', msg.password || '');
      sendResponse(res);
    } else if (msg.type === 'DASHVAULT_DETECT_FORMS') {
      const pwCount = document.querySelectorAll('input[type="password"]').length;
      const userFields = findUsernameFields();
      sendResponse({
        domain: (location.hostname || 'local').replace(/^www\./, ''),
        pwCount,
        detectedUser: userFields[0] ? userFields[0].value : ''
      });
    }
  });
})();
