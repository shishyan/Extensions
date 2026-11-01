/**
 * SpeechVoice — Background Service Worker
 * Stores preferred reading speed (1.0x–3.5x) and playback stats
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ speechVoiceRate: 1.25 });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "SPEECHVOICE_SET_RATE") {
    const rate = Number(msg.rate || 1.25);
    chrome.storage.local.set({ speechVoiceRate: rate }, () => {
      sendResponse({ ok: true, rate });
    });
    return true;
  }
});
