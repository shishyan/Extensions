const voiceSelect = document.getElementById("voiceSelect");
const rateRange = document.getElementById("rateRange");
const pitchRange = document.getElementById("pitchRange");
const rateLbl = document.getElementById("rateLbl");
const pitchLbl = document.getElementById("pitchLbl");
const ttsInput = document.getElementById("ttsInput");

function populateVoices() {
  const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  if (!voices.length) {
    voiceSelect.innerHTML = '<option value="">System Default Natural Voice</option>';
    return;
  }
  voiceSelect.innerHTML = voices
    .map((v, i) => `<option value="${i}">${v.name} (${v.lang})</option>`)
    .join("");
}

populateVoices();
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = populateVoices;
}

rateRange.addEventListener("input", () => { rateLbl.textContent = rateRange.value + "x"; });
pitchRange.addEventListener("input", () => { pitchLbl.textContent = Number(pitchRange.value).toFixed(1); });

document.getElementById("playBtn").addEventListener("click", () => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(ttsInput.value || "Ready to read.");
  const voices = window.speechSynthesis.getVoices();
  const idx = Number(voiceSelect.value);
  if (voices[idx]) u.voice = voices[idx];
  u.rate = Number(rateRange.value) || 1.25;
  u.pitch = Number(pitchRange.value) || 1.0;
  window.speechSynthesis.speak(u);
});

document.getElementById("pageBtn").addEventListener("click", () => {
  const rate = Number(rateRange.value) || 1.25;
  const pitch = Number(pitchRange.value) || 1.0;
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "NATURALREAD_READ_PAGE", rate, pitch }, (res) => {
          if (!chrome.runtime.lastError && res && res.excerpt) {
            ttsInput.value = res.excerpt;
          }
        });
      }
    });
  }
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  if (!window.speechSynthesis) return;
  if (window.speechSynthesis.paused) window.speechSynthesis.resume();
  else window.speechSynthesis.pause();
});

document.getElementById("stopBtn").addEventListener("click", () => {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: "NATURALREAD_STOP" });
    });
  }
});
