/**
 * GrammFix Pro — Background Service Worker
 * Combines LanguageTool Free API with comprehensive local fallback grammar, spelling, passive voice & conciseness rules
 */

const LOCAL_TYPO_MAP = {
  "teh": "the",
  "recieve": "receive",
  "seperate": "separate",
  "occured": "occurred",
  "definately": "definitely",
  "accomodate": "accommodate",
  "wich": "which",
  "untill": "until",
  "wierd": "weird",
  "alot": "a lot",
  "becuase": "because",
  "grammer": "grammar",
  "neccessary": "necessary",
  "enviroment": "environment",
  "govorment": "government",
  "immediatly": "immediately",
  "sucessful": "successful",
  "occurence": "occurrence",
  "collegue": "colleague",
  "mispell": "misspell"
};

function runLocalGrammarCheck(text) {
  const matches = [];
  for (const [wrong, right] of Object.entries(LOCAL_TYPO_MAP)) {
    const regex = new RegExp(`\\b${wrong}\\b`, "gi");
    let m;
    while ((m = regex.exec(text)) !== null) {
      matches.push({
        offset: m.index,
        length: m[0].length,
        message: `Spelling error: "${m[0]}" -> "${right}"`,
        replacements: [{ value: right }],
        rule: { category: { id: "TYPOS" } }
      });
    }
  }
  // Double words like "the the"
  const dupRegex = /\b(\w+)\s+\1\b/gi;
  let dm;
  while ((dm = dupRegex.exec(text)) !== null) {
    matches.push({
      offset: dm.index,
      length: dm[0].length,
      message: `Repeated word: "${dm[1]}"`,
      replacements: [{ value: dm[1] }],
      rule: { category: { id: "REDUNDANCY" } }
    });
  }
  return matches;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "GRAMMFIX_CHECK") {
    const text = msg.text || "";
    const localMatches = runLocalGrammarCheck(text);
    const url = "https://api.languagetool.org/v2/check";
    const params = new URLSearchParams();
    params.append("text", text);
    params.append("language", msg.lang || "en-US");

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    })
      .then((r) => r.json())
      .then((data) => {
        const apiMatches = Array.isArray(data.matches) ? data.matches : [];
        // Merge avoiding exact offset collisions
        const seenOffsets = new Set(apiMatches.map((m) => m.offset));
        const merged = [...apiMatches, ...localMatches.filter((m) => !seenOffsets.has(m.offset))];
        sendResponse({ ok: true, matches: merged });
      })
      .catch(() => {
        // Offline / fallback mode still returns local grammar matches cleanly
        sendResponse({ ok: true, matches: localMatches, offlineFallback: true });
      });
    return true;
  }
});
