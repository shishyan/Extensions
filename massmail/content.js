(() => {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'MASSMAIL_INSERT') {
      const active = document.activeElement;
      const bodyBox = document.querySelector('div[aria-label="Message Body"], div[role="textbox"][contenteditable="true"], textarea');
      const target = (active && (active.isContentEditable || active.tagName === 'TEXTAREA')) ? active : bodyBox;
      if (target) {
        if (target.isContentEditable) {
          target.innerHTML += '<br>' + msg.body.replace(/\n/g, '<br>');
        } else {
          target.value += '\n' + msg.body;
        }
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false });
      }
    }
  });
})();
