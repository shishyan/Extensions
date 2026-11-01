/**
 * SiderChat — Background Service Worker
 * Registers Context Menu Analyzer ("Analyze with SiderChat Deep Reader")
 */

chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: "siderchat_analyze",
      title: "📖 Open SiderChat Split-Screen Deep Reader",
      contexts: ["page", "selection"]
    });
  } catch (_) {}
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "siderchat_analyze" && tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "SIDER_TOGGLE_SPLIT", selection: info.selectionText || "" }, () => {});
  }
});
