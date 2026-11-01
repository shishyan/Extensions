chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    buddystudio_checklist: [true, true, true, true, true, false, false, false, false, false]
  });
});
