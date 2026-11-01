/**
 * OtterNotes — Content Script
 * Live Caption & Meeting Notes Recorder (Google Meet, Zoom Web, YouTube Live & Webpage Highlights)
 */

(() => {
  "use strict";

  if (!document.body) return;

  let recording = false;
  let observer = null;

  function capturePageSnapshotNote() {
    const captionEl =
      document.querySelector("[aria-live='polite'], [aria-live='assertive'], .a4cQT, .iOzk7, .ytp-caption-segment") ||
      document.querySelector("article p, main p, p, h1");
    const text = ((captionEl && (captionEl.innerText || captionEl.textContent)) || document.title || "We will review action items by Friday.").trim();

    chrome.runtime.sendMessage(
      {
        type: "OTTER_ADD_NOTE",
        speaker: location.hostname || "Live Session",
        text: text.slice(0, 220)
      },
      () => {}
    );
  }

  function toggleRecording() {
    recording = !recording;
    const widget = document.getElementById("otternotes-widget");
    if (recording) {
      if (widget) widget.textContent = "🔴 Otter Recording (Captured)";
      capturePageSnapshotNote();
      if (!observer) {
        observer = new MutationObserver(() => {
          if (!recording) return;
          const cap = document.querySelector("[aria-live], .a4cQT, .iOzk7, .ytp-caption-segment");
          if (cap && cap.textContent && cap.textContent.trim().length > 10) {
            chrome.runtime.sendMessage({
              type: "OTTER_ADD_NOTE",
              speaker: "Live Caption",
              text: cap.textContent.trim().slice(0, 200)
            });
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
    } else {
      if (widget) widget.textContent = "🎙️ Otter Record";
    }
    return recording;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "OTTER_TOGGLE_RECORD") {
      const state = toggleRecording();
      sendResponse({ ok: true, recording: state });
      return false;
    }
  });

  let widget = document.getElementById("otternotes-widget");
  if (!widget) {
    widget = document.createElement("div");
    widget.id = "otternotes-widget";
    widget.className = "otternotes-widget";
    widget.title = "OtterNotes: Click to capture live meeting captions & action items";
    widget.textContent = "🎙️ Otter Record";
    widget.addEventListener("click", toggleRecording);
    document.body.appendChild(widget);
  }
})();
