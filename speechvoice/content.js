/**
 * SpeechVoice — Content Script
 * Injects Floating Bottom TTS Audio Player + Active-Paragraph Glowing Sky-Blue Highlighter
 * Supports Play/Pause, Prev/Next paragraph, and 1.0x–3.5x Speed Controller
 */

(() => {
  "use strict";

  if (!document.body) return;

  let blocks = [];
  let currentIdx = 0;
  let isPlaying = false;
  let currentRate = 1.25;

  function collectReadableBlocks() {
    const candidates = Array.from(document.querySelectorAll("article p, main p, p, h1, h2, li")).filter((el) => {
      const t = (el.innerText || el.textContent || "").trim();
      return t.length > 20;
    });
    return candidates.length ? candidates : [document.body];
  }

  function highlightBlock(index) {
    blocks.forEach((b) => b.classList && b.classList.remove("speechvoice-active-block"));
    const target = blocks[index];
    if (target && target.classList) {
      target.classList.add("speechvoice-active-block");
    }
  }

  function speakCurrentBlock() {
    blocks = collectReadableBlocks();
    if (!blocks.length) return;
    currentIdx = Math.max(0, Math.min(currentIdx, blocks.length - 1));
    highlightBlock(currentIdx);

    const text = (blocks[currentIdx].innerText || blocks[currentIdx].textContent || "").trim();
    const statusEl = document.getElementById("sv-status");
    if (statusEl) {
      statusEl.textContent = `Block ${currentIdx + 1}/${blocks.length} (${currentRate}x)`;
    }

    try {
      if ("speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined") {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text.slice(0, 320));
        utter.rate = currentRate;
        utter.onend = () => {
          if (isPlaying && currentIdx + 1 < blocks.length) {
            currentIdx++;
            speakCurrentBlock();
          }
        };
        window.speechSynthesis.speak(utter);
      }
    } catch (_) {}
  }

  function togglePlay() {
    const btn = document.getElementById("sv-play-btn");
    if (!isPlaying) {
      isPlaying = true;
      if (btn) btn.textContent = "⏸ Pause";
      speakCurrentBlock();
    } else {
      isPlaying = false;
      if (btn) btn.textContent = "▶ Listen";
      try {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "SPEECHVOICE_CONTROL") {
      if (msg.action === "play") {
        isPlaying = false;
        togglePlay();
      } else if (msg.action === "next") {
        blocks = collectReadableBlocks();
        currentIdx = (currentIdx + 1) % Math.max(1, blocks.length);
        isPlaying = true;
        speakCurrentBlock();
      } else if (msg.action === "prev") {
        blocks = collectReadableBlocks();
        currentIdx = Math.max(0, currentIdx - 1);
        isPlaying = true;
        speakCurrentBlock();
      }
      sendResponse({ ok: true, currentIdx, isPlaying, rate: currentRate });
      return false;
    }
  });

  let player = document.getElementById("speechvoice-player");
  if (!player) {
    player = document.createElement("div");
    player.id = "speechvoice-player";
    player.className = "speechvoice-player";
    player.innerHTML = `
      <span style="color:#38bdf8;font-weight:800;">🔊 SpeechVoice</span>
      <button id="sv-prev-btn" type="button" title="Previous Paragraph">⏮</button>
      <button id="sv-play-btn" type="button">▶ Listen</button>
      <button id="sv-next-btn" type="button" title="Next Paragraph">⏭</button>
      <select id="sv-speed-select" title="Playback Speed">
        <option value="1">1.0x</option>
        <option value="1.25" selected>1.25x</option>
        <option value="1.5">1.5x</option>
        <option value="2">2.0x</option>
        <option value="2.5">2.5x</option>
        <option value="3">3.0x</option>
        <option value="3.5">3.5x</option>
      </select>
      <span id="sv-status" style="color:#94a3b8;font-size:10.5px;">Ready</span>
    `;
    document.body.appendChild(player);

    player.querySelector("#sv-play-btn").addEventListener("click", togglePlay);
    player.querySelector("#sv-next-btn").addEventListener("click", () => {
      blocks = collectReadableBlocks();
      currentIdx = (currentIdx + 1) % Math.max(1, blocks.length);
      isPlaying = true;
      player.querySelector("#sv-play-btn").textContent = "⏸ Pause";
      speakCurrentBlock();
    });
    player.querySelector("#sv-prev-btn").addEventListener("click", () => {
      blocks = collectReadableBlocks();
      currentIdx = Math.max(0, currentIdx - 1);
      isPlaying = true;
      player.querySelector("#sv-play-btn").textContent = "⏸ Pause";
      speakCurrentBlock();
    });
    player.querySelector("#sv-speed-select").addEventListener("change", (e) => {
      currentRate = Number(e.target.value || 1.25);
      chrome.runtime.sendMessage({ type: "SPEECHVOICE_SET_RATE", rate: currentRate }, () => {});
      if (isPlaying) speakCurrentBlock();
    });
  }
})();
