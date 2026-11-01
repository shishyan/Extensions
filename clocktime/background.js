chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    clocktime_state: {
      running: false,
      elapsedSeconds: 1500,
      hourlyRate: 120,
      projectName: "Client Core Architecture",
      startedAt: null,
      logs: [
        { project: "Client Core Architecture", durationSec: 1500, rate: 120, earned: "50.00", date: "2026-11-01" }
      ]
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "CLOCKTIME_GET_STATE") {
    chrome.storage.local.get({ clocktime_state: null }, (data) => {
      const st = data.clocktime_state || {
        running: false,
        elapsedSeconds: 1500,
        hourlyRate: 120,
        projectName: "Client Core Architecture",
        startedAt: null,
        logs: []
      };
      sendResponse({ ok: true, state: st });
    });
    return true;
  }
  if (msg && msg.type === "CLOCKTIME_UPDATE_STATE") {
    chrome.storage.local.set({ clocktime_state: msg.state }, () => {
      sendResponse({ ok: true, state: msg.state });
    });
    return true;
  }
});
