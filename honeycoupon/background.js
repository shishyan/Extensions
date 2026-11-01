chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ honeycoupon_best_code: "VIP25" });
});
