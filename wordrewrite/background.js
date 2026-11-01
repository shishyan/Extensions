/**
 * WordRewrite — Background Service Worker
 * Generates 5 distinct sentence rewrites (Casual, Formal, Shorten, Expand, Punchy Hook)
 * + real-time Tone & Clarity Detector
 */

function detectTone(text) {
  const s = (text || "").trim();
  if (!s) return { label: "Neutral", confidence: "90%", clarity: 100 };
  const words = s.split(/\s+/).length;
  const hasExclaim = /!/.test(s);
  const hasFormal = /\b(therefore|consequently|imperative|furthermore|regarding|pursuant|accordance|assist|obtain)\b/i.test(s);
  const hasCasual = /\b(hey|thanks|cool|awesome|can't|won't|let's|gonna|super|quick)\b/i.test(s);

  let label = "Balanced / Professional";
  if (hasFormal) label = "Executive / Formal";
  else if (hasCasual || hasExclaim) label = "Warm / Conversational";
  else if (words > 26) label = "Complex / Dense";
  else if (words <= 10) label = "Direct & Concise";

  const clarity = Math.max(62, Math.min(99, 100 - Math.max(0, words - 16) * 2));
  return { label, clarity };
}

function generateFiveRewrites(raw) {
  const clean = (raw || "").trim().replace(/\s+/g, " ");
  if (!clean) return [];

  const noEndPunct = clean.replace(/[.!?]+$/, "");

  // 1. Casual / Conversational
  let casual = clean
    .replace(/\bIn order to\b/gi, "To")
    .replace(/\bcannot\b/gi, "can't")
    .replace(/\bwill not\b/gi, "won't")
    .replace(/\bdo not\b/gi, "don't")
    .replace(/\bwe need to\b/gi, "let's")
    .replace(/\bassist\b/gi, "help")
    .replace(/\bobtain\b/gi, "grab")
    .replace(/\bverify\b/gi, "double-check")
    .replace(/\bat this point in time\b/gi, "right now");
  if (casual === clean) {
    casual = `Here's the thing: ${noEndPunct.charAt(0).toLowerCase() + noEndPunct.slice(1)}.`;
  }

  // 2. Formal / Executive
  let formal = clean
    .replace(/\bcan't\b/gi, "cannot")
    .replace(/\bwon't\b/gi, "will not")
    .replace(/\bdon't\b/gi, "do not")
    .replace(/\blet's\b/gi, "we recommend that we")
    .replace(/\bwe need to\b/gi, "it is priority that we")
    .replace(/\bhelp\b/gi, "facilitate")
    .replace(/\bget\b/gi, "acquire")
    .replace(/\bcheck\b/gi, "validate")
    .replace(/\bmake sure\b/gi, "ensure")
    .replace(/\buse\b/gi, "leverage");
  if (formal === clean) {
    formal = `From an operational standpoint, ${noEndPunct.charAt(0).toLowerCase() + noEndPunct.slice(1)}.`;
  }

  // 3. Shorten / Crisp
  let shorten = clean
    .replace(/\bin order to\b/gi, "to")
    .replace(/\bdue to the fact that\b/gi, "because")
    .replace(/\bat this point in time\b/gi, "now")
    .replace(/\bfor the purpose of\b/gi, "for")
    .replace(/\bin the near future\b/gi, "soon")
    .replace(/\ba large number of\b/gi, "many")
    .replace(/\bmake a decision\b/gi, "decide")
    .replace(/\b(really|very|basically|actually|just|simply|quite|extremely)\s+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (shorten === clean && shorten.split(/\s+/).length > 8) {
    const parts = shorten.split(/[,;—]+/);
    shorten = parts[0].trim() + ".";
  }

  // 4. Expand / Elaborate
  const expand = `${noEndPunct} — delivering measurable impact, clearer alignment, and faster execution across the board.`;

  // 5. Punchy Hook
  const punchy = `⚡ Bottom line: ${noEndPunct.replace(/^(In order to|We need to|I think that)\s+/i, "")}!`;

  return [
    { id: "casual", tag: "😊 Casual", text: casual },
    { id: "formal", tag: "👔 Formal", text: formal },
    { id: "shorten", tag: "✂️ Shorten", text: shorten },
    { id: "expand", tag: "🔍 Expand", text: expand },
    { id: "punchy", tag: "🔥 Punchy", text: punchy }
  ];
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "WORDREWRITE_GENERATE") {
    const text = msg.text || "";
    const variants = generateFiveRewrites(text);
    const tone = detectTone(text);
    sendResponse({ ok: true, variants, tone });
    return false;
  }
});
