
const SYNONYM_FLUENCY = [
  [/\bin order to\b/gi, "to"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\ba lot of\b/gi, "many"],
  [/\bvery important\b/gi, "crucial"],
  [/\bmake sure\b/gi, "ensure"],
  [/\bhelp\b/gi, "enable"],
  [/\bshow\b/gi, "demonstrate"],
  [/\bget\b/gi, "obtain"],
  [/\bneed\b/gi, "require"],
  [/\bfast\b/gi, "rapid"]
];

const SYNONYM_FORMAL = [
  [/\bhelp\b/gi, "facilitate"],
  [/\buse\b/gi, "utilize"],
  [/\bstart\b/gi, "commence"],
  [/\bend\b/gi, "conclude"],
  [/\bget\b/gi, "acquire"],
  [/\bneed\b/gi, "require"],
  [/\bshow\b/gi, "illustrate"],
  [/\bthink\b/gi, "consider"],
  [/\bfix\b/gi, "resolve"],
  [/\bgood\b/gi, "exemplary"],
  [/\bbig\b/gi, "substantial"],
  [/\bchange\b/gi, "modify"],
  [/\bcheck\b/gi, "verify"],
  [/\bkeep\b/gi, "retain"]
];

const SYNONYM_CONCISE = [
  [/\bin order to\b/gi, "to"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\bat this point in time\b/gi, "now"],
  [/\bfor the purpose of\b/gi, "to"],
  [/\bin the event that\b/gi, "if"],
  [/\bhas the ability to\b/gi, "can"],
  [/\ba large number of\b/gi, "many"],
  [/\bin close proximity to\b/gi, "near"],
  [/\bwith regard to\b/gi, "about"],
  [/\bcompletely\s+/gi, ""],
  [/\bbasically\s+/gi, ""],
  [/\bactually\s+/gi, ""],
  [/\bvery\s+/gi, ""]
];

const SYNONYM_EXPAND = [
  [/\bimportant\b/gi, "strategically vital and high-impact"],
  [/\bfast\b/gi, "remarkably swift and responsive"],
  [/\beasy\b/gi, "intuitive and straightforward to execute"],
  [/\bgood\b/gi, "consistently reliable and well-crafted"],
  [/\bhelp\b/gi, "actively support and empower"],
  [/\bimprove\b/gi, "measurably enhance and optimize"],
  [/\bcreate\b/gi, "design and systematically build"],
  [/\bproblem\b/gi, "operational bottleneck and challenge"]
];

function rewriteTextByMode(rawText, mode) {
  let text = String(rawText || "").trim();
  if (!text) return "";

  if (mode === "formal") {
    SYNONYM_FORMAL.forEach(([rx, rep]) => { text = text.replace(rx, rep); });
    text = text.replace(/\bcan't\b/gi, "cannot").replace(/\bdon't\b/gi, "do not").replace(/\bwon't\b/gi, "will not").replace(/\bit's\b/gi, "it is");
    return text;
  }
  if (mode === "concise" || mode === "shorten") {
    SYNONYM_CONCISE.forEach(([rx, rep]) => { text = text.replace(rx, rep); });
    return text.replace(/\s{2,}/g, " ").trim();
  }
  if (mode === "expand") {
    SYNONYM_EXPAND.forEach(([rx, rep]) => { text = text.replace(rx, rep); });
    if (!/in practice|ultimately/i.test(text)) {
      text += " Ultimately, this approach ensures measurable clarity, higher engagement, and long-term reliability.";
    }
    return text;
  }
  if (mode === "bullet" || mode === "creative") {
    const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    return sentences.map((s) => "• " + s.replace(/^[•\-*]\s*/, "")).join("\n");
  }
  // fluency (default)
  SYNONYM_FLUENCY.forEach(([rx, rep]) => { text = text.replace(rx, rep); });
  return text.replace(/\s{2,}/g, " ").trim();
}

(function () {
  if (window.__wordrewriteLoaded) return;
  window.__wordrewriteLoaded = true;

  let activeInput = null;
  document.addEventListener("focusin", (e) => {
    if (e.target && (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || e.target.isContentEditable)) {
      activeInput = e.target;
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && (msg.type === "REWRITE_GET_SELECTION" || msg.type === "QUILL_GET_SELECTION" || msg.type === "WORDREWRITE_GET")) {
      const sel = window.getSelection().toString().trim();
      const fallback = activeInput ? (activeInput.value || activeInput.innerText || "") : "";
      sendResponse({ text: sel || fallback });
      return true;
    }
    if (msg && msg.type === "REWRITE_REPLACE_SELECTION" && msg.text) {
      if (activeInput) {
        if (activeInput.tagName === "TEXTAREA" || activeInput.tagName === "INPUT") {
          activeInput.value = msg.text;
          activeInput.dispatchEvent(new Event("input", { bubbles: true }));
        } else if (activeInput.isContentEditable) {
          activeInput.innerText = msg.text;
          activeInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      sendResponse({ ok: true });
      return true;
    }
  });
})();
