chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    momenfocus_goal: "Ship zero-error production release",
    momenfocus_streak: 7
  });
});
