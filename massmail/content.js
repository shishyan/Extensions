(() => {
  function findSubjectInput() {
    const selectors = [
      'input[name="subjectbox"]',
      'input[aria-label*="Subject" i]',
      'input[placeholder*="Subject" i]',
      'input[name*="subject" i]',
      '#subject'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function findRecipientInput() {
    const selectors = [
      'input[aria-label*="To" i]',
      'input[name="to"]',
      'input[placeholder*="Recipient" i]',
      'input[type="email"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function findBodyBox() {
    const active = document.activeElement;
    if (active && (active.isContentEditable || active.tagName === 'TEXTAREA')) {
      return active;
    }
    const selectors = [
      'div[aria-label="Message Body"]',
      'div[aria-label*="Message text" i]',
      'div[role="textbox"][contenteditable="true"]',
      'div[contenteditable="true"]',
      'textarea'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'MASSMAIL_INSERT') {
      const subjEl = findSubjectInput();
      const toEl = findRecipientInput();
      const bodyEl = findBodyBox();
      let inserted = false;

      if (subjEl && msg.subject) {
        subjEl.value = msg.subject;
        subjEl.dispatchEvent(new Event('input', { bubbles: true }));
        subjEl.dispatchEvent(new Event('change', { bubbles: true }));
        inserted = true;
      }

      if (toEl && msg.email) {
        toEl.value = msg.email;
        toEl.dispatchEvent(new Event('input', { bubbles: true }));
        toEl.dispatchEvent(new Event('change', { bubbles: true }));
        inserted = true;
      }

      if (bodyEl && msg.body) {
        if (bodyEl.isContentEditable) {
          bodyEl.innerHTML = msg.body.replace(/\n/g, '<br>');
        } else {
          bodyEl.value = msg.body;
        }
        bodyEl.classList.add('massmail-injected-highlight');
        bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
        bodyEl.dispatchEvent(new Event('change', { bubbles: true }));
        inserted = true;
      }

      sendResponse({
        ok: inserted,
        filledSubject: Boolean(subjEl && msg.subject),
        filledBody: Boolean(bodyEl && msg.body)
      });
    }
  });
})();
