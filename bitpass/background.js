chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["bitpass_vault"], (res) => {
    if (!res.bitpass_vault) {
      chrome.storage.local.set({
        bitpass_vault: [
          {
            domain: "localhost",
            username: "engineer@gurukuladesam.org",
            totpSecret: "JBSWY3DPEHPK3PXP"
          }
        ]
      });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "BITPASS_GET_VAULT") {
    chrome.storage.local.get(["bitpass_vault"], (res) => {
      sendResponse({ ok: true, vault: res.bitpass_vault || [] });
    });
    return true;
  }
});
