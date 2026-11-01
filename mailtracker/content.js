(function () {
  if (window.__mailTrackerLoaded) return;
  window.__mailTrackerLoaded = true;

  const SPAM_TRIGGERS = ["free money", "act now", "100% free", "winner", "urgent!!", "click here"];

  function scoreSubjectLine(subject) {
    const s = String(subject || "").trim();
    if (!s) return { score: 50, openRateEst: "38%", spamTriggers: 0 };

    let score = 62;
    if (s.length >= 24 && s.length <= 56) score += 18;
    if (/\d+/.test(s)) score += 8;
    if (/quick|question|idea|update|roadmap|partnership|follow/i.test(s)) score += 10;

    let spamHits = 0;
    const low = s.toLowerCase();
    SPAM_TRIGGERS.forEach((w) => {
      if (low.includes(w)) {
        spamHits++;
        score -= 18;
      }
    });

    const finalScore = Math.max(15, Math.min(99, score));
    const openRateEst = `${Math.round(finalScore * 0.68)}%`;
    return { score: finalScore, openRateEst, spamTriggers: spamHits };
  }

  function buildTrackedUrl(rawUrl, campaign) {
    try {
      const u = new URL(rawUrl || "https://example.com");
      u.searchParams.set("utm_source", "mailtracker");
      u.searchParams.set("utm_medium", "email");
      u.searchParams.set("utm_campaign", campaign || "outreach_2026");
      return u.toString();
    } catch (_) {
      return `${rawUrl}?utm_source=mailtracker&utm_medium=email`;
    }
  }

  function injectBar() {
    if (document.getElementById("mailtracker-bar")) return;
    const subjInp =
      document.querySelector('input[name="subjectbox"]') ||
      document.querySelector('input[placeholder*="Subject" i]') ||
      document.querySelector('input[type="text"]');

    const initialSubj = (subjInp && subjInp.value) || document.title || "Quick question regarding Q4 AI roadmap";
    const sRes = scoreSubjectLine(initialSubj);

    const bar = document.createElement("div");
    bar.id = "mailtracker-bar";
    bar.innerHTML = `
      <div>
        <span>✓✓ <strong>MailTracker Pro</strong> (Zero Watermark)</span>
        &nbsp;•&nbsp;
        <span id="mt-score-txt">Subject Score: <strong>${sRes.score}/100</strong> (Est. Open Rate: ${sRes.openRateEst})</span>
      </div>
      <button class="mt-btn" id="mt-log-btn">📌 Log Follow-Up (48h)</button>
    `;

    const target = document.querySelector("main") || document.body;
    target.prepend(bar);

    bar.querySelector("#mt-log-btn").addEventListener("click", () => {
      const item = {
        subject: initialSubj,
        score: sRes.score,
        followUpDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 10)
      };
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["mailtracker_logs"], (res) => {
          const list = Array.isArray(res.mailtracker_logs) ? res.mailtracker_logs : [];
          list.unshift(item);
          chrome.storage.local.set({ mailtracker_logs: list });
        });
      }
      bar.querySelector("#mt-log-btn").textContent = "✅ Follow-Up Scheduled!";
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "MAILTRACKER_SCORE_SUBJECT") {
      sendResponse(scoreSubjectLine(msg.subject || ""));
      return true;
    }
    if (msg && msg.type === "MAILTRACKER_BUILD_UTM") {
      sendResponse({ ok: true, trackedUrl: buildTrackedUrl(msg.url, msg.campaign) });
      return true;
    }
  });

  injectBar();
})();
