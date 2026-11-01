chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    selectorgadget_last_locator: {
      css: "h1",
      xpath: "//h1",
      playwright: "page.locator('h1')",
      matches: 1
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SELECTORGADGET_SAVE") {
    chrome.storage.local.set({ selectorgadget_last_locator: msg.locator }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
