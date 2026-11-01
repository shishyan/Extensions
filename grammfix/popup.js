const input = document.getElementById("input");
const stats = document.getElementById("stats");
const issuesList = document.getElementById("issues-list");

const CONCISE_MAP = {
  "in order to": "to",
  "due to the fact that": "because",
  "at this point in time": "now",
  "for the purpose of": "for",
  "in the event that": "if",
  "has the ability to": "can",
  "make a decision": "decide",
  "in the near future": "soon",
  "a large number of": "many",
  "really ": "",
  "very ": "",
  "basically ": "",
  "actually ": ""
};

const TYPO_MAP = {
  "teh": "the",
  "recieve": "receive",
  "seperate": "separate",
  "occured": "occurred",
  "definately": "definitely",
  "accomodate": "accommodate",
  "wich": "which",
  "untill": "until",
  "wierd": "weird",
  "becuase": "because"
};

function updateStats(extra = "") {
  const txt = input.value.trim();
  const words = txt ? txt.split(/\s+/).filter(Boolean).length : 0;
  const sentences = txt ? txt.split(/[.!?]+/).filter((s) => s.trim().length > 0).length : 0;
  const chars = txt.length;
  const readTime = Math.max(1, Math.ceil(words / 200));
  const passiveMatches = txt.match(/\b(am|are|is|was|were|be|been|being)\s+(\w+ed|written|taken|made|done|given|shown|known|seen)\b/gi) || [];

  stats.innerHTML = `<strong>${words}</strong> words • <strong>${sentences}</strong> sentences • <strong>${chars}</strong> chars • Passive: <strong>${passiveMatches.length}</strong> • ~${readTime}m read ${extra ? "<br>" + extra : ""}`;
}

input.addEventListener("input", () => updateStats());

document.getElementById("checkBtn").addEventListener("click", () => {
  const text = input.value.trim();
  if (!text) return;
  stats.textContent = "Checking grammar, spelling & style...";

  chrome.runtime.sendMessage({ type: "GRAMMFIX_CHECK", text }, (res) => {
    let updated = text;
    let fixCount = 0;

    if (!chrome.runtime.lastError && res && res.ok && Array.isArray(res.matches)) {
      const matches = [...res.matches].sort((a, b) => b.offset - a.offset);
      matches.forEach((m) => {
        if (m.replacements && m.replacements.length > 0) {
          updated = updated.slice(0, m.offset) + m.replacements[0].value + updated.slice(m.offset + m.length);
          fixCount++;
        }
      });
    }

    // Apply local dictionary fixes for any remaining typos
    for (const [wrong, right] of Object.entries(TYPO_MAP)) {
      const rx = new RegExp(`\\b${wrong}\\b`, "gi");
      if (rx.test(updated)) {
        updated = updated.replace(rx, right);
        fixCount++;
      }
    }

    input.value = updated;
    updateStats(`<span style="color:#34d399">✅ Applied ${fixCount} grammar & spelling fix(es)!</span>`);
  });
});

document.getElementById("conciseBtn").addEventListener("click", () => {
  let t = input.value;
  Object.keys(CONCISE_MAP).forEach((k) => {
    t = t.replace(new RegExp(k, "gi"), CONCISE_MAP[k]);
  });
  input.value = t.replace(/\s{2,}/g, " ").trim();
  updateStats('<span style="color:#38bdf8">✂️ Tightened filler & wordy phrasing!</span>');
});

document.getElementById("passiveBtn").addEventListener("click", () => {
  let t = input.value;
  t = t
    .replace(/that was written by ([\w\s]+)/gi, "that $1 wrote")
    .replace(/was written by ([\w\s]+)/gi, "$1 wrote")
    .replace(/was created by ([\w\s]+)/gi, "$1 created")
    .replace(/was built by ([\w\s]+)/gi, "$1 built")
    .replace(/is managed by ([\w\s]+)/gi, "$1 manages");
  input.value = t;
  updateStats('<span style="color:#fbbf24">⚡ Converted passive clauses to active voice!</span>');
});

document.getElementById("formalBtn").addEventListener("click", () => {
  let t = input.value;
  const map = {
    "can't": "cannot",
    "won't": "will not",
    "don't": "do not",
    "didn't": "did not",
    "I think": "I believe",
    "thanks": "thank you",
    "need to": "must",
    "get": "obtain",
    "help": "assist",
    "check": "verify"
  };
  Object.keys(map).forEach((k) => {
    t = t.replace(new RegExp("\\b" + k + "\\b", "gi"), map[k]);
  });
  input.value = t;
  updateStats('<span style="color:#a78bfa">👔 Converted to Executive Formal tone!</span>');
});

document.getElementById("friendlyBtn").addEventListener("click", () => {
  let t = input.value;
  const map = {
    "cannot": "can't",
    "will not": "won't",
    "do not": "don't",
    "must": "need to",
    "obtain": "get",
    "assist": "help",
    "verify": "check",
    "therefore": "so"
  };
  Object.keys(map).forEach((k) => {
    t = t.replace(new RegExp("\\b" + k + "\\b", "gi"), map[k]);
  });
  input.value = t;
  updateStats('<span style="color:#34d399">😊 Converted to Warm Friendly tone!</span>');
});

document.getElementById("copyBtn").addEventListener("click", () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(input.value).catch(() => {});
  }
  updateStats('<span style="color:#10b981">📋 Copied polished text to clipboard!</span>');
});

updateStats();
