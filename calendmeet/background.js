chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    calendmeet_config: {
      meetingTitle: "Product & Engineering Sync",
      durationMin: 30
    }
  });
});
