
const CONCISE_MAP = [
  [/\bin order to\b/gi, "to", "Wordy phrase"],
  [/\bdue to the fact that\b/gi, "because", "Wordy phrase"],
  [/\bat this point in time\b/gi, "now", "Wordy phrase"],
  [/\bin the event that\b/gi, "if", "Wordy phrase"],
  [/\bfor the purpose of\b/gi, "to", "Wordy phrase"],
  [/\bhas the ability to\b/gi, "can", "Wordy phrase"],
  [/\bin close proximity to\b/gi, "near", "Wordy phrase"],
  [/\ba large number of\b/gi, "many", "Wordy phrase"],
  [/\bwith regard to\b/gi, "regarding", "Wordy phrase"],
  [/\bin spite of the fact that\b/gi, "although", "Wordy phrase"],
  [/\bprior to\b/gi, "before", "Formal/Wordy"],
  [/\bsubsequent to\b/gi, "after", "Formal/Wordy"],
  [/\butilize\b/gi, "use", "Overly complex"],
  [/\bfacilitate\b/gi, "help", "Overly complex"],
  [/\bendeavor\b/gi, "try", "Overly complex"],
  [/\bas a matter of fact\b/gi, "in fact", "Filler phrase"],
  [/\bat the present time\b/gi, "currently", "Wordy phrase"],
  [/\bby means of\b/gi, "by", "Wordy phrase"],
  [/\bfor the reason that\b/gi, "because", "Wordy phrase"],
  [/\bin accordance with\b/gi, "by", "Wordy phrase"],
  [/\bin addition to\b/gi, "besides", "Wordy phrase"],
  [/\bin the near future\b/gi, "soon", "Wordy phrase"],
  [/\bis able to\b/gi, "can", "Wordy phrase"],
  [/\bmake a decision\b/gi, "decide", "Weak verb phrase"],
  [/\btake into consideration\b/gi, "consider", "Weak verb phrase"],
  [/\bgive an indication\b/gi, "indicate", "Weak verb phrase"],
  [/\breach a conclusion\b/gi, "conclude", "Weak verb phrase"],
  [/\bconduct an investigation\b/gi, "investigate", "Weak verb phrase"]
];

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
  "alot": "a lot",
  "thier": "their",
  "beleive": "believe",
  "calender": "calendar",
  "collegue": "colleague",
  "concious": "conscious",
  "curiousity": "curiosity",
  "disappear": "disappear",
  "embarass": "embarrass",
  "enviroment": "environment",
  "existance": "existence",
  "foriegn": "foreign",
  "freind": "friend",
  "goverment": "government",
  "grammer": "grammar",
  "harass": "harass",
  "immediatly": "immediately",
  "independant": "independent",
  "knowlege": "knowledge",
  "liason": "liaison",
  "maintainance": "maintenance",
  "millenium": "millennium",
  "neccessary": "necessary",
  "noticable": "noticeable",
  "occassion": "occasion",
  "parliment": "parliament",
  "perseverence": "perseverance",
  "priviledge": "privilege",
  "publically": "publicly",
  "recomend": "recommend",
  "refered": "referred",
  "relevent": "relevant",
  "succesful": "successful",
  "supersede": "supersede",
  "tommorow": "tomorrow",
  "truely": "truly",
  "unforeseen": "unforeseen",
  "unfortunatly": "unfortunately"
};

const GRAMMAR_PATTERNS = [
  [/\b(could|would|should|must|might) of\b/gi, (m, v) => v + " have", "Modal 'of' instead of 'have'"],
  [/\bi\b/g, "I", "Uncapitalized pronoun 'I'"],
  [/\b(\w+)\s+\1\b/gi, "$1", "Repeated duplicate word"],
  [/\b(a)\s+([aeiouAEIOU][a-z]{2,})\b/g, (m, a, w) => /^(uni|use|user|uro|one|once)/i.test(w) ? m : (a === "A" ? "An " : "an ") + w, "Article 'a' before vowel sound"],
  [/\b(an)\s+([bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ][a-z]{2,})\b/g, (m, an, w) => /^(hour|honest|honor|heir)/i.test(w) ? m : (an === "An" ? "A " : "a ") + w, "Article 'an' before consonant sound"],
  [/\btheir\s+(is|are|was|were)\b/gi, (m, v) => (m[0] === "T" ? "There " : "there ") + v, "'Their' instead of 'there'"],
  [/\byour\s+(welcome|right|correct|invited)\b/gi, (m, w) => (m[0] === "Y" ? "You're " : "you're ") + w, "'Your' instead of 'you're'"],
  [/\bits\s+(a|an|very|so|too|going|been|not)\b/gi, (m, w) => (m[0] === "I" ? "It's " : "it's ") + w, "'Its' instead of 'it's'"]
];

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function detectTone(text) {
  const lower = (text || "").toLowerCase();
  const urgentHits = (lower.match(/\b(urgent|asap|immediately|deadline|critical|now|important|must|priority)\b/g) || []).length + (text.match(/!/g) || []).length;
  const formalHits = (lower.match(/\b(sincerely|regards|furthermore|therefore|consequently|pursuant|hereby|pleased|accordance|respectfully)\b/g) || []).length;
  const friendlyHits = (lower.match(/\b(thanks|thank you|happy|glad|awesome|great|excited|love|cheers|wonderful|appreciate)\b/g) || []).length;
  const confidentHits = (lower.match(/\b(will|definitely|certainly|proven|guarantee|ensure|deliver|confident|achieve|strong)\b/g) || []).length;
  if (urgentHits >= 2) return "⚡ Urgent & Direct";
  if (formalHits >= 2) return "🎩 Formal & Professional";
  if (friendlyHits >= 2) return "😊 Friendly & Warm";
  if (confidentHits >= 1) return "💪 Confident & Clear";
  return "⚖️ Neutral & Balanced";
}

function analyzeAndFixText(rawText) {
  let fixed = String(rawText || "");
  const issues = [];

  Object.entries(TYPO_MAP).forEach(([bad, good]) => {
    const rx = new RegExp("\\b" + bad + "\\b", "gi");
    if (rx.test(fixed)) {
      issues.push({ type: "Spelling", from: bad, to: good, reason: "Common misspelling" });
      fixed = fixed.replace(rx, (m) => m[0] === m[0].toUpperCase() ? good.charAt(0).toUpperCase() + good.slice(1) : good);
    }
  });

  GRAMMAR_PATTERNS.forEach(([rx, rep, reason]) => {
    const matches = fixed.match(rx);
    if (matches && matches.length) {
      issues.push({ type: "Grammar", from: matches[0], to: typeof rep === "function" ? matches[0].replace(rx, rep) : rep, reason });
      fixed = fixed.replace(rx, rep);
    }
  });

  CONCISE_MAP.forEach(([rx, rep, reason]) => {
    const matches = fixed.match(rx);
    if (matches && matches.length) {
      issues.push({ type: "Clarity", from: matches[0], to: rep, reason });
      fixed = fixed.replace(rx, rep);
    }
  });

  const passiveRx = /\b(was|were|is|are|been)\s+([a-z]+ed)\b/gi;
  const passiveMatches = fixed.match(passiveRx) || [];
  passiveMatches.slice(0, 4).forEach((m) => {
    issues.push({ type: "Passive Voice", from: m, to: "Use active verb", reason: "Passive construction weakens clarity" });
  });

  fixed = fixed.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.;!?])/g, "$1");

  const words = fixed.trim() ? fixed.trim().split(/\s+/) : [];
  const sentences = Math.max(1, fixed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length);
  const syllables = words.reduce((acc, w) => acc + countSyllables(w), 0);
  const wCount = words.length;

  const fleschRaw = wCount > 0 ? 206.835 - 1.015 * (wCount / sentences) - 84.6 * (syllables / Math.max(1, wCount)) : 100;
  const fleschScore = Math.max(0, Math.min(100, Math.round(fleschRaw)));
  const fkGrade = wCount > 0 ? Math.max(1, Math.min(18, Math.round(0.39 * (wCount / sentences) + 11.8 * (syllables / Math.max(1, wCount)) - 15.59))) : 6;
  const clarityScore = Math.max(35, Math.min(100, 100 - issues.length * 4));
  const tone = detectTone(fixed);

  return {
    original: rawText,
    fixed,
    issues,
    wordCount: wCount,
    sentenceCount: sentences,
    fleschScore,
    gradeLevel: "Grade " + fkGrade,
    clarityScore,
    tone
  };
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ grammfix_enabled: true, grammfix_FixesCount: 0 });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "GRAMMFIX_ANALYZE") {
    const res = analyzeAndFixText(msg.text || "");
    sendResponse(res);
    return true;
  }
});
