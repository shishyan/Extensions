chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["kamipdf_notes"], (res) => {
    if (!res.kamipdf_notes) {
      chrome.storage.local.set({
        kamipdf_notes: [
          {
            url: "https://gurukuladesam.org/kamipdf",
            note: "Initial annotated callout ready for Clean PDF export.",
            color: "yellow"
          }
        ]
      });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "KAMIPDF_SAVE_NOTE") {
    chrome.storage.local.get(["kamipdf_notes"], (res) => {
      const notes = res.kamipdf_notes || [];
      notes.unshift(msg.entry);
      chrome.storage.local.set({ kamipdf_notes: notes.slice(0, 100) }, () => {
        sendResponse({ ok: true, count: notes.length });
      });
    });
    return true;
  }
});
