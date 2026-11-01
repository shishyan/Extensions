(() => {
  function scanContacts() {
    const html = document.documentElement.innerHTML;
    const text = document.body.innerText;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const rawEmails = (text.match(emailRegex) || []).concat(html.match(emailRegex) || []);
    const cleanEmails = Array.from(new Set(
      rawEmails
        .map(e => e.toLowerCase())
        .filter(e => !/\.(png|jpg|jpeg|gif|svg|webp|js|css|woff|ttf)$/i.test(e) && !e.includes('example.com') && !e.includes('sentry.io'))
    ));
    const phones = Array.from(new Set((text.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g) || []).slice(0, 15)));
    const domain = location.hostname.replace(/^www\./, '');
    const patterns = [
      `first@${domain}`,
      `first.last@${domain}`,
      `flast@${domain}`,
      `contact@${domain}`,
      `founders@${domain}`
    ];
    return { domain, emails: cleanEmails.slice(0, 30), phones, patterns };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'HUNTLEAD_SCAN') {
      sendResponse(scanContacts());
    }
  });
})();
