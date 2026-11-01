/**
 * OtterNotes — Background Service Worker
 * Stores timestamped meeting transcript entries & automatically detects Action Items
 */

const ACTION_REGEX = /\b(will|todo|to-do|action item|deadline|by friday|by monday|follow up|deliver|assign|owner|need to|next step)\b/i;

const SEED_ENTRIES = [
  {
    id: "otter_1",
    time: "10:00",
    speaker: "Product Lead",
    text: "We will finalize the Q4 enterprise release checklist and follow up with QA by Friday.",
    isAction: true
  },
  {
    id: "otter_2",
    time: "10:02",
    speaker: "Engineering",
    text: "Benchmark latency dropped to 4ms across all production regions.",
    isAction: false
  }
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["otterNotesLog"], (res) => {
    if (!Array.isArray(res.otterNotesLog) || res.otterNotesLog.length === 0) {
      chrome.storage.local.set({ otterNotesLog: SEED_ENTRIES });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "OTTER_ADD_NOTE") {
    chrome.storage.local.get(["otterNotesLog"], (res) => {
      const log = Array.isArray(res.otterNotesLog) && res.otterNotesLog.length ? res.otterNotesLog : [...SEED_ENTRIES];
      const text = (msg.text || "").trim();
      if (!text) {
        sendResponse({ ok: false, log });
        return;
      }
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const entry = {
        id: "otter_" + Date.now(),
        time: hhmm,
        speaker: msg.speaker || "Meeting Caption",
        text,
        isAction: ACTION_REGEX.test(text)
      };
      log.unshift(entry);
      const trimmed = log.slice(0, 80);
      chrome.storage.local.set({ otterNotesLog: trimmed }, () => {
        sendResponse({ ok: true, entry, log: trimmed });
      });
    });
    return true;
  }

  if (msg && msg.type === "OTTER_GET_LOG") {
    chrome.storage.local.get(["otterNotesLog"], (res) => {
      const log = Array.isArray(res.otterNotesLog) && res.otterNotesLog.length ? res.otterNotesLog : SEED_ENTRIES;
      sendResponse({ ok: true, log });
    });
    return true;
  }

  if (msg && msg.type === "OTTER_CLEAR_LOG") {
    chrome.storage.local.set({ otterNotesLog: [] }, () => {
      sendResponse({ ok: true, log: [] });
    });
    return true;
  }
});
