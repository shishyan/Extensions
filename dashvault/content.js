(() => {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'DASHVAULT_FILL') {
      const pwFields = Array.from(document.querySelectorAll('input[type="password"]'));
      pwFields.forEach(el => {
        el.value = msg.password;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      sendResponse({ filled: pwFields.length });
    }
  });
})();
