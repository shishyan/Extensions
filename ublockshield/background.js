chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["ublockshield_rules", "ublockshield_whitelist"], (res) => {
    if (!res.ublockshield_rules) {
      chrome.storage.local.set({
        ublockshield_rules: [".ad-banner", "ins.adsbygoogle", "#onetrust-consent-sdk", ".cookie-banner"],
        ublockshield_whitelist: []
      });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "UBLOCKSHIELD_ADD_RULE") {
    chrome.storage.local.get(["ublockshield_rules"], (res) => {
      const rules = res.ublockshield_rules || [];
      if (msg.selector && !rules.includes(msg.selector)) {
        rules.push(msg.selector);
      }
      chrome.storage.local.set({ ublockshield_rules: rules }, () => {
        sendResponse({ ok: true, rules });
      });
    });
    return true;
  }
});
