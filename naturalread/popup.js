const rsvpStage = document.getElementById("rsvpStage");
const wpmSlider = document.getElementById("wpmSlider");
const wpmLabel = document.getElementById("wpmLabel");
const sourceText = document.getElementById("sourceText");
const startRsvpBtn = document.getElementById("startRsvpBtn");

let timer = null;
let words = [];
let ptr = 0;

function formatWordWithORP(word) {
  const w = word || "";
  if (w.length <= 1) return `<span class="rsvp-pivot">${w}</span>`;
  const pivotIdx = Math.floor((w.length - 1) * 0.35);
  return (
    w.slice(0, pivotIdx) +
    `<span class="rsvp-pivot">${w[pivotIdx]}</span>` +
    w.slice(pivotIdx + 1)
  );
}

function stopRsvp() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  startRsvpBtn.textContent = "▶ Start Speed Reader";
}

function startRsvp() {
  if (timer) {
    stopRsvp();
    return;
  }
  words = sourceText.value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return;
  ptr = 0;
  const wpm = Number(wpmSlider.value || 450);
  const intervalMs = Math.max(60, Math.round(60000 / wpm));
  startRsvpBtn.textContent = "⏸ Pause RSVP";

  rsvpStage.innerHTML = formatWordWithORP(words[ptr]);
  timer = setInterval(() => {
    ptr++;
    if (ptr >= words.length) {
      stopRsvp();
      rsvpStage.textContent = "✓ Finished!";
      return;
    }
    rsvpStage.innerHTML = formatWordWithORP(words[ptr]);
  }, intervalMs);
}

wpmSlider.addEventListener("input", () => {
  wpmLabel.textContent = `${wpmSlider.value} WPM`;
  chrome.runtime.sendMessage({ type: "NATURALREAD_SAVE_PREFS", wpm: Number(wpmSlider.value) }, () => {});
  if (timer) {
    stopRsvp();
    startRsvp();
  }
});

startRsvpBtn.addEventListener("click", startRsvp);

document.getElementById("toggleRulerBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "NATURALREAD_TOGGLE_RULER" }, (res) => {
      if (!chrome.runtime.lastError && res) {
        rsvpStage.textContent = res.rulerActive ? "📏 Ruler ON" : "📏 Ruler OFF";
      }
    });
  });
});

document.getElementById("pullPageBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "NATURALREAD_GET_TEXT" }, (res) => {
      if (!chrome.runtime.lastError && res && res.ok && res.text) {
        sourceText.value = res.text;
        rsvpStage.textContent = "Loaded Page!";
      }
    });
  });
});

// Show first word formatted on open
const initWords = sourceText.value.trim().split(/\s+/);
if (initWords.length) {
  rsvpStage.innerHTML = formatWordWithORP(initWords[0]);
}
