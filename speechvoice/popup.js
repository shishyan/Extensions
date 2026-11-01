const ttsText = document.getElementById("ttsText");
const voiceSelect = document.getElementById("voiceSelect");
const rateSelect = document.getElementById("rateSelect");
const metaBar = document.getElementById("metaBar");

function updateEstimate() {
  const words = ttsText.value.trim() ? ttsText.value.trim().split(/\s+/).length : 0;
  const rate = Number(rateSelect.value || 1.25);
  const wpm = Math.round(200 * rate);
  const secs = Math.max(1, Math.round((words / wpm) * 60));
  metaBar.innerHTML = `📊 <strong>${words}</strong> words • Speed: <strong>${rate}x (${wpm} WPM)</strong> • Est. Time: <strong>~${secs}s</strong>`;
}

function populateVoices() {
  if (!("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices() || [];
  if (voices.length) {
    voiceSelect.innerHTML = voices
      .slice(0, 15)
      .map((v, i) => `<option value="${i}">${v.name} (${v.lang})</option>`)
      .join("");
  }
}

populateVoices();
if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = populateVoices;
}

ttsText.addEventListener("input", updateEstimate);
rateSelect.addEventListener("change", updateEstimate);

document.getElementById("speakPopupBtn").addEventListener("click", () => {
  const txt = ttsText.value.trim();
  if (!txt) return;
  try {
    if ("speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined") {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt);
      u.rate = Number(rateSelect.value || 1.25);
      const voices = window.speechSynthesis.getVoices() || [];
      const vIdx = Number(voiceSelect.value);
      if (!Number.isNaN(vIdx) && voices[vIdx]) u.voice = voices[vIdx];
      window.speechSynthesis.speak(u);
    }
  } catch (_) {}
  metaBar.innerHTML = `<span style="color:#38bdf8">🔊 Speaking at ${rateSelect.value}x speed…</span>`;
});

document.getElementById("readPageBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "SPEECHVOICE_CONTROL", action: "play" }, () => {
      metaBar.innerHTML = `<span style="color:#34d399">📖 Activated in-page SpeechVoice player & paragraph highlighter!</span>`;
    });
  });
});

document.getElementById("stopBtn").addEventListener("click", () => {
  try {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  } catch (_) {}
  metaBar.textContent = "⏹ Playback stopped.";
});

updateEstimate();
