/**
 * TokTrend — Background Service Worker
 * Generates 3-second High-Retention Short-Form Hook Scripts & calculates Engagement Tiers
 */

function generateHooks(niche) {
  const topic = (niche || "AI & Creator Growth").trim();
  return [
    `1. [Pattern Interrupt 0–3s]: "Stop scrolling if you still do ${topic} the old way — here is the 10x shortcut."`,
    `2. [Data Shock Hook]: "99% of creators miss this 1 metric in ${topic} (and it costs them 80% of reach)."`,
    `3. [Visual Proof Hook]: "I tested 5 frameworks for ${topic} in 24 hours — here is the exact winner."`
  ];
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "TOKTREND_HOOKS") {
    sendResponse({ ok: true, hooks: generateHooks(msg.topic || "") });
    return false;
  }
});
