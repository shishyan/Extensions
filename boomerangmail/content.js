(function () {
  if (window.__boomerangMailLoaded) return;
  window.__boomerangMailLoaded = true;

  function scoreRespondable(text) {
    const raw = String(text || "").trim();
    const words = raw.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const questions = (raw.match(/\?/g) || []).length;
    const politeHits = (raw.match(/thank|appreciate|please|happy to|would you|let me know/gi) || []).length;

    let score = 64;
    if (wordCount >= 35 && wordCount <= 160) score += 16;
    else if (wordCount >= 12) score += 8;

    if (questions >= 1 && questions <= 3) score += 12;
    score += Math.min(10, politeHits * 4);

    const finalScore = Math.min(98, score);
    const politenessScore = Math.min(99, 74 + politeHits * 8);
    const gradeLevel = Math.max(4, Math.min(12, Math.round(wordCount / 18) + 4));

    return {
      likelihood: finalScore,
      politenessScore,
      wordCount,
      questions,
      gradeLevel: `Grade ${gradeLevel}`,
      optimalSendSlot: "Tomorrow 09:00 AM Recipient Local Time"
    };
  }

  function injectTemplateIntoCompose(customText) {
    const txt = customText || "Hi — following up on my note below! Would Tuesday at 10:00 AM work for a quick 15-minute alignment call?";
    const el = document.querySelector("div[aria-label*='Message Body' i], div[role='textbox'], textarea, [contenteditable='true']");
    if (el) {
      if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
        el.value = (el.value ? el.value + "\n\n" : "") + txt;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        el.innerText = (el.innerText ? el.innerText + "\n\n" : "") + txt;
      }
      return true;
    }
    return false;
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
        🪃 <strong>Boomerang Respondable AI</strong> — Politeness: ${res.politenessScore}/100 • Questions: ${res.questions} • ${res.gradeLevel}
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <button id="bm-inject-btn" style="background:#dc2626;color:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:10.5px;font-weight:700;cursor:pointer;">✍️ Send-Later / Follow-Up</button>
        <span class="bm-pill" id="bm-score">${res.likelihood}% Reply Likelihood</span>
      </div>
    `;

    const target = document.querySelector("main") || document.body;
    target.prepend(meter);

    meter.querySelector("#bm-inject-btn").addEventListener("click", () => {
      injectTemplateIntoCompose();
      meter.querySelector("#bm-inject-btn").textContent = "✅ Injected!";
    });

    document.addEventListener("input", (e) => {
      if (e.target && (e.target.tagName === "TEXTAREA" || e.target.isContentEditable)) {
        const val = e.target.value || e.target.innerText || "";
        const updated = scoreRespondable(val);
        meter.querySelector("#bm-txt").innerHTML = `🪃 <strong>Boomerang Respondable AI</strong> — Politeness: ${updated.politenessScore}/100 • Questions: ${updated.questions} • ${updated.gradeLevel}`;
        meter.querySelector("#bm-score").textContent = `${updated.likelihood}% Reply Likelihood`;
      }
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "BOOMERANG_SCORE_EMAIL") {
      sendResponse(scoreRespondable(msg.text || ""));
      return true;
    }
    if (msg && msg.type === "BOOMERANG_INJECT_TEMPLATE") {
      sendResponse({ ok: true, injected: injectTemplateIntoCompose(msg.text) });
      return true;
    }
  });

  injectMeter();
})();
