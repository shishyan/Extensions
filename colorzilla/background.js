chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    colorzilla_history: ["#EC4899", "#6366F1", "#10B981", "#0EA5E9", "#F59E0B"]
  });
});
