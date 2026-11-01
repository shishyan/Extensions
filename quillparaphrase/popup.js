const inputEl = document.getElementById("input");
const outputEl = document.getElementById("output");
const origCountEl = document.getElementById("origCount");
const outCountEl = document.getElementById("outCount");
const intensitySlider = document.getElementById("intensitySlider");
const intensityVal = document.getElementById("intensityVal");
const diffBar = document.getElementById("diff-bar");
const modeButtons = Array.from(document.querySelectorAll(".mode-btn"));

let activeMode = "fluency";

function countWords(str) {
  const s = (str || "").trim();
  return s ? s.split(/\s+/).filter(Boolean).length : 0;
}

function runParaphrase() {
  const text = inputEl.value.trim();
  origCountEl.textContent = `${countWords(text)}w`;
  if (!text) {
    outputEl.value = "";
    outCountEl.textContent = "0w";
    return;
  }

  const intensity = Number(intensitySlider.value || 75);
  chrome.runtime.sendMessage(
    {
      type: "QUILL_PARAPHRASE",
      text,
      mode: activeMode,
      intensity
    },
    (res) => {
      if (!chrome.runtime.lastError && res && res.ok) {
        outputEl.value = res.output;
        const origW = countWords(text);
        const newW = countWords(res.output);
        outCountEl.textContent = `${newW}w`;
        const delta = newW - origW;
        const deltaStr = delta === 0 ? "Same length" : delta > 0 ? `+${delta} words` : `${delta} words`;
        diffBar.innerHTML = `✅ Mode: <strong style="color:#34d399;text-transform:capitalize">${activeMode}</strong> • Intensity: <strong>${intensity}%</strong> • Substitutions: <strong>${res.changedCount}</strong> • Length: <strong>${deltaStr}</strong>`;
      }
    }
  );
}

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeMode = btn.getAttribute("data-mode") || "fluency";
    runParaphrase();
  });
});

intensitySlider.addEventListener("input", () => {
  intensityVal.textContent = `${intensitySlider.value}%`;
  runParaphrase();
});

inputEl.addEventListener("input", () => {
  origCountEl.textContent = `${countWords(inputEl.value)}w`;
});

document.getElementById("paraphraseBtn").addEventListener("click", runParaphrase);

document.getElementById("synBtn").addEventListener("click", () => {
  const sel = inputEl.value.slice(inputEl.selectionStart, inputEl.selectionEnd).trim();
  const sampleWord = sel || (inputEl.value.match(/\b(important|good|problem|improve|idea|result|make|use|fast)\b/i) || ["important"])[0];
  chrome.runtime.sendMessage({ type: "QUILL_SYNONYMS", word: sampleWord }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      diffBar.innerHTML = `📖 Synonyms for <strong>"${res.word}"</strong>: <span style="color:#34d399">${(res.synonyms || []).join(", ") || "No matches"}</span>`;
    }
  });
});

document.getElementById("copyBtn").addEventListener("click", () => {
  const val = outputEl.value || inputEl.value;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(val).catch(() => {});
  }
  diffBar.innerHTML = `<span style="color:#34d399">📋 Paraphrased text copied to clipboard!</span>`;
});

// Run initial paraphrase immediately on popup open
runParaphrase();
