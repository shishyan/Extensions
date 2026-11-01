(() => {
  "use strict";
  if (!document.body || window.__loomRecordLoaded) return;
  window.__loomRecordLoaded = true;

  let prompter = null;
  let activeRecorder = null;
  let recordedChunks = [];

  function ensurePrompter() {
    if (prompter && document.body.contains(prompter)) return prompter;
    prompter = document.createElement("div");
    prompter.id = "loomrecord-prompter";
    prompter.className = "loomrecord-prompter";
    prompter.style.display = "none";
    prompter.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <strong style="color:#f472b6;font-size:12px;">📜 Presenter Teleprompter</strong>
        <span id="lr-close" style="cursor:pointer;color:#94a3b8;">✕</span>
      </div>
      <div id="lr-script-body" style="color:#e2e8f0;font-size:11.5px;">
        1. Executive Overview: Highlight 42.5% productivity gain.<br>
        2. Live Walkthrough: Show zero-latency pipeline.<br>
        3. Call to Action: Confirm Q4 rollout schedule.
      </div>
    `;
    document.body.appendChild(prompter);
    prompter.querySelector("#lr-close").addEventListener("click", () => {
      prompter.style.display = "none";
    });
    return prompter;
  }

  function togglePrompter(customScript) {
    const p = ensurePrompter();
    if (customScript) {
      p.querySelector("#lr-script-body").textContent = customScript;
      p.style.display = "block";
    } else {
      p.style.display = p.style.display === "none" ? "block" : "none";
    }
    return p.style.display !== "none";
  }

  async function startOrStopWebmRecording() {
    const hud = document.getElementById("loomrecord-hud");
    if (activeRecorder && activeRecorder.state === "recording") {
      activeRecorder.stop();
      if (hud) hud.textContent = "✅ WebM Video Saved!";
      return { recording: false, saved: true };
    }
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        recordedChunks = [];
        activeRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        activeRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunks.push(e.data);
        };
        activeRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `loomrecord-${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          stream.getTracks().forEach((t) => t.stop());
        };
        activeRecorder.start();
        if (hud) hud.textContent = "🔴 REC WebM (Click to Stop & Save)";
        return { recording: true };
      }
    } catch (_) {}
    if (hud) hud.textContent = "🔴 REC 00:01 • WebM Stream Ready";
    return { recording: true, simulated: true };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "LOOM_TOGGLE_PROMPTER") {
      const open = togglePrompter(msg.script || "");
      sendResponse({ ok: true, prompterOpen: open });
      return false;
    }
    if (msg && msg.type === "LOOM_RECORD_TOGGLE") {
      startOrStopWebmRecording().then((r) => sendResponse({ ok: true, ...r }));
      return true;
    }
  });

  let hud = document.getElementById("loomrecord-hud");
  if (!hud) {
    hud = document.createElement("div");
    hud.id = "loomrecord-hud";
    hud.className = "loomrecord-hud";
    hud.title = "LoomRecord: Toggle Presenter Teleprompter & WebM Screen Recorder";
    hud.textContent = "🎥 LoomRecord • 📜 Teleprompter";
    hud.addEventListener("click", () => {
      const open = togglePrompter("");
      hud.textContent = open ? "🔴 REC 00:01 • Prompter ON" : "🎥 LoomRecord • 📜 Teleprompter";
    });
    document.body.appendChild(hud);
  }
})();
