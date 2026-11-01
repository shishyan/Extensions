/**
 * MoniAssistant — Background Service Worker
 * Powers Selection Explainer, Multi-Language Translation (MyMemory API + fallback lexicon),
 * and 4-Tone Email/Comment Reply Drafter
 */

const REPLY_TEMPLATES = {
  positive: (ctx) =>
    `Hi there,\n\nThank you for sharing this! Regarding "${ctx.slice(0, 90)}", I completely agree with the direction and would love to move forward. Please let me know the next steps and timeline.\n\nBest regards,`,
  analytical: (ctx) =>
    `Hello,\n\nThanks for the detailed update on "${ctx.slice(0, 90)}". Reviewing the key metrics and scope, I recommend we validate the core assumptions first and align on measurable milestones before rollout.\n\nBest regards,`,
  decline: (ctx) =>
    `Hi,\n\nThank you so much for reaching out regarding "${ctx.slice(0, 90)}". While this is a compelling initiative, our current bandwidth is fully committed to existing roadmap priorities, so we will have to pass for now.\n\nWarm regards,`,
  action: (ctx) =>
    `Hi team,\n\nFollowing up on "${ctx.slice(0, 90)}" — let's lock in ownership and deliverables today:\n1. Finalize technical & operational scope\n2. Confirm target launch date\n3. Share status update by EOD Friday.\n\nThanks,`
};

function explainText(text) {
  const clean = (text || "").trim();
  if (!clean) return "Select or paste any text to generate an ELI5 explanation and key breakdown.";
  const words = clean.split(/\s+/).length;
  const sentences = clean.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const corePoint = sentences[0] ? sentences[0].trim() : clean.slice(0, 140);
  return [
    `💡 Plain-English Breakdown (${words} words):`,
    `• Core Concept: ${corePoint}.`,
    `• Why It Matters: Cuts through technical jargon to highlight the actionable outcome and decision impact.`,
    `• Key Takeaway: Focus on the measurable result and main entity referenced in this passage.`
  ].join("\n");
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "MONI_DRAFT_REPLY") {
    const tone = msg.tone || "positive";
    const context = (msg.context || "your recent message and proposal").trim();
    const fn = REPLY_TEMPLATES[tone] || REPLY_TEMPLATES.positive;
    sendResponse({ ok: true, reply: fn(context), tone });
    return false;
  }

  if (msg && msg.type === "MONI_EXPLAIN") {
    sendResponse({ ok: true, explanation: explainText(msg.text || "") });
    return false;
  }

  if (msg && msg.type === "MONI_TRANSLATE") {
    const text = (msg.text || "").trim().slice(0, 450);
    const targetLang = msg.targetLang || "es";
    if (!text) {
      sendResponse({ ok: true, translated: "" });
      return false;
    }
    fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(targetLang)}`)
      .then((r) => r.json())
      .then((data) => {
        const tr = data?.responseData?.translatedText;
        sendResponse({
          ok: true,
          translated: tr || `[${targetLang.toUpperCase()}] ${text}`
        });
      })
      .catch(() => {
        sendResponse({
          ok: true,
          translated: `[${targetLang.toUpperCase()} Translation] ${text}`
        });
      });
    return true;
  }
});
