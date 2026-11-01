document.addEventListener("DOMContentLoaded", () => {
  const readerEl = document.getElementById("pr-reader");
  let speaking = false;

  function loadQueue() {
    chrome.storage.local.get(["pocketread_queue"], (res) => {
      const q = res.pocketread_queue || [];
      if (!q.length) {
        readerEl.textContent = "Queue is empty.";
        return;
      }
      readerEl.textContent = q
        .map(
          (item, idx) =>
            `[${idx + 1}] ${item.title} (~${item.readMinutes} min · ${item.words} words)\nTags: ${(item.tags || ["#read-later"]).join(" ")}\n${item.url}\n\n${item.fullText}`
        )
        .join("\n\n====================\n\n");
    });
  }

  loadQueue();

  document.getElementById("pr-save").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "POCKETREAD_SAVE_NOW" }, () => {
          setTimeout(loadQueue, 150);
        });
      }
    });
  });

  document.getElementById("pr-reader-btn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "POCKETREAD_READER_TOGGLE" }, () => {});
      }
    });
  });

  document.getElementById("pr-tts-btn").addEventListener("click", () => {
    speaking = !speaking;
    document.getElementById("pr-tts-btn").textContent = speaking ? "⏹ Stop TTS" : "🔊 Listen (TTS)";
    try {
      if (window.speechSynthesis) {
        if (speaking) {
          const u = new SpeechSynthesisUtterance(readerEl.textContent.slice(0, 500));
          window.speechSynthesis.speak(u);
        } else {
          window.speechSynthesis.cancel();
        }
      }
    } catch (_) {}
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "POCKETREAD_TTS_TOGGLE" }, () => {});
      }
    });
  });

  document.getElementById("pr-theme").addEventListener("click", () => {
    document.body.classList.toggle("sepia");
  });
});
