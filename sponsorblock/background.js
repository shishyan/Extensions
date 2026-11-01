chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    sponsorblock_autoskip: true,
    sponsorblock_dearrow: true,
    sponsorblock_saved_sec: 145
  });
});
