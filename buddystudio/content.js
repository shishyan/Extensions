(function () {
  if (window.__buddyStudioLoaded) return;
  window.__buddyStudioLoaded = true;

  const POWER_WORDS = [
    "ultimate", "secret", "proven", "guide", "mastering", "fast", "free", "complete",
    "blueprint", "mistake", "warning", "insane", "easy", "step", "hack", "2026"
  ];

  const CANNED_REPLIES = {
    thanks: "🙏 Thank you so much for watching! Which section of the video was most helpful for your workflow?",
    pinned: "📌 Welcome! Grab the full resources, timestamps, and checklist in the description above — and subscribe for weekly deep dives!",
    collab: "🔥 Appreciate the insightful feedback! Would love to collaborate or cover this topic in our next benchmark video."
  };

  function scoreTitleCTR(title) {
    const t = String(title || "").trim();
    if (!t) return { score: 0, notes: ["Empty title"] };

    let score = 45;
    const notes = [];

    if (t.length >= 42 && t.length <= 68) {
      score += 18;
      notes.push("Optimal length (42–68 chars)");
    } else if (t.length > 25 && t.length < 80) {
      score += 10;
    }

    if (/\d+/.test(t)) {
      score += 14;
      notes.push("Includes numeric hook");
    }

    if (/[\[\(\{].+?[\]\)\}]/.test(t)) {
      score += 11;
      notes.push("Uses bracketed clarifier");
    }

    const lower = t.toLowerCase();
    const matchedPower = POWER_WORDS.filter((w) => lower.includes(w));
    if (matchedPower.length > 0) {
      score += Math.min(15, matchedPower.length * 7);
      notes.push(`Power words: ${matchedPower.slice(0, 2).join(", ")}`);
    }

    if (/[?!:]/.test(t)) {
      score += 6;
      notes.push("Curiosity punctuation");
    }

    return {
      score: Math.min(99, score),
      notes
    };
  }

  function injectToolkitBar() {
    const isTarget =
      location.pathname.includes("/watch") ||
      location.hostname.includes("studio.youtube.com") ||
      document.querySelector("#secondary") !== null ||
      document.querySelector("video") !== null;

    if (!isTarget) return;
    if (document.getElementById("buddystudio-bar")) return;

    const currentTitleEl =
      document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ||
      document.querySelector("h1") ||
      null;
    const initialTitleA = (currentTitleEl && currentTitleEl.textContent ? currentTitleEl.textContent.trim() : document.title) || "Mastering Distributed AI Systems in 2026";
    const initialTitleB = `${initialTitleA} [7 Proven Steps & Blueprint]`;

    const bar = document.createElement("div");
    bar.id = "buddystudio-bar";

    const target =
      document.querySelector("#secondary #secondary-inner") ||
      document.querySelector("#secondary") ||
      document.querySelector("main") ||
      document.body;

    target.prepend(bar);

    bar.innerHTML = `
      <div class="bs-header">
        <span class="bs-title">🚀 BuddyStudio Legend Toolkit — A/B CTR & Reply Studio</span>
        <span class="bs-badge">TubeBuddy Legend Free</span>
      </div>
      <div class="bs-ab-grid">
        <input class="bs-inp" id="bs-title-a" value="${initialTitleA.replace(/"/g, "&quot;")}" placeholder="Title Variant A..." />
        <input class="bs-inp" id="bs-title-b" value="${initialTitleB.replace(/"/g, "&quot;")}" placeholder="Title Variant B..." />
      </div>
      <div class="bs-result" id="bs-ab-output">Evaluating A/B Title CTR...</div>
      <div class="bs-replies">
        <button class="bs-btn" id="bs-run-ab">⚖️ Compare A/B CTR</button>
        <button class="bs-btn sec" data-reply="thanks">🙏 Thank You Reply</button>
        <button class="bs-btn sec" data-reply="pinned">📌 Pinned CTA</button>
        <button class="bs-btn sec" data-reply="collab">🔥 Collab Reply</button>
      </div>
    `;

    function updateComparison() {
      const valA = bar.querySelector("#bs-title-a").value;
      const valB = bar.querySelector("#bs-title-b").value;
      const resA = scoreTitleCTR(valA);
      const resB = scoreTitleCTR(valB);
      const winner = resB.score >= resA.score ? "Variant B" : "Variant A";
      const outEl = bar.querySelector("#bs-ab-output");
      outEl.innerHTML = `<strong>Winner: ${winner}</strong> — Variant A: <strong>${resA.score}/100</strong> vs Variant B: <strong>${resB.score}/100</strong> (${(resB.notes[0] || "Optimized hook")})`;
      return { scoreA: resA.score, scoreB: resB.score, winner };
    }

    updateComparison();

    bar.querySelector("#bs-run-ab").addEventListener("click", updateComparison);
    bar.querySelectorAll("[data-reply]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-reply");
        const text = CANNED_REPLIES[key] || CANNED_REPLIES.thanks;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        const activeInp = document.querySelector("textarea, input[type='text']");
        if (activeInp && activeInp.id !== "bs-title-a" && activeInp.id !== "bs-title-b") {
          activeInp.value = text;
        }
        btn.textContent = "✅ Reply Copied!";
      });
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "BUDDY_COMPARE_TITLES") {
      const a = scoreTitleCTR(msg.titleA || "");
      const b = scoreTitleCTR(msg.titleB || "");
      sendResponse({
        ok: true,
        scoreA: a.score,
        scoreB: b.score,
        winner: b.score >= a.score ? "B" : "A"
      });
      return true;
    }
  });

  injectToolkitBar();
})();
