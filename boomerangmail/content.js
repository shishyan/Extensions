(function () {
  if (window.__boomerangMailLoaded) return;
  window.__boomerangMailLoaded = true;

  function scoreRespondable(text) {
    const raw = String(text || "").trim();
    const words = raw.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const questions = (raw.match(/\?/g) || []).length;

    let score = 64;
    if (wordCount >= 35 && wordCount <= 160) score += 16;
    else if (wordCount >= 12) score += 8;

    if (questions >= 1 && questions <= 3) score += 12;
    if (/thank|appreciate|please|happy to|would you|let me know/i.test(raw)) score += 8;

    const finalScore = Math.min(98, score);
    const gradeLevel = Math.max(4, Math.min(12, Math.round(wordCount / 18) + 4));

    return {
      likelihood: finalScore,
      wordCount,
      questions,
      gradeLevel: `Grade ${gradeLevel}`,
      optimalSendSlot: "Tomorrow 09:00 AM Recipient Local Time"
    };
  }

  function injectMeter() {
    if (document.getElementById("boomerangmail-meter")) return;
    const ta = document.querySelector("textarea") || document.querySelector("[contenteditable='true']");
    const sample = (ta && (ta.value || ta.innerText)) || "Hi team, thank you for reviewing our proposal! Would Tuesday at 10am work for a 15-minute alignment call?";
    const res = scoreRespondable(sample);

    const meter = document.createElement("div");
    meter.id = "boomerangmail-meter";
    meter.innerHTML = `
      <div id="bm-txt">
        🪃 <strong>Boomerang Respondable AI</strong> — Words: ${res.wordCount} • Questions: ${res.questions} • Reading: ${res.gradeLevel}
      </div>
      <span class="bm-pill" id="bm-score">${res.likelihood}% Reply Likelihood</span>
    `;

    const target = document.querySelector("main") || document.body;
    target.prepend(meter);

    document.addEventListener("input", (e) => {
      if (e.target && (e.target.tagName === "TEXTAREA" || e.target.isContentEditable)) {
        const val = e.target.value || e.target.innerText || "";
        const updated = scoreRespondable(val);
        meter.querySelector("#bm-txt").innerHTML = `🪃 <strong>Boomerang Respondable AI</strong> — Words: ${updated.wordCount} • Questions: ${updated.questions} • Reading: ${updated.gradeLevel}`;
        meter.querySelector("#bm-score").textContent = `${updated.likelihood}% Reply Likelihood`;
      }
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "BOOMERANG_SCORE_EMAIL") {
      sendResponse(scoreRespondable(msg.text || ""));
      return true;
    }
  });

  injectMeter();
})();
