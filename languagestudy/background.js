/**
 * LanguageStudy — Background Service Worker
 * Bilingual Word Lookup (Part-of-Speech, Translation via MyMemory + Built-in Multilingual Lexicon)
 * & Persistent Vocabulary Flashcard Deck in chrome.storage.local
 */

const BUILTIN_DICT = {
  "enterprise": { es: "empresa / corporación", fr: "entreprise", de: "Unternehmen", pos: "Noun" },
  "benchmark": { es: "punto de referencia", fr: "référence", de: "Maßstab", pos: "Noun" },
  "productivity": { es: "productividad", fr: "productivité", de: "Produktivität", pos: "Noun" },
  "decision": { es: "decisión", fr: "décision", de: "Entscheidung", pos: "Noun" },
  "important": { es: "importante", fr: "important", de: "wichtig", pos: "Adjective" },
  "automation": { es: "automatización", fr: "automatisation", de: "Automatisierung", pos: "Noun" },
  "improve": { es: "mejorar", fr: "améliorer", de: "verbessern", pos: "Verb" },
  "language": { es: "idioma / lenguaje", fr: "langue", de: "Sprache", pos: "Noun" },
  "study": { es: "estudiar / estudio", fr: "étudier", de: "studieren", pos: "Verb / Noun" }
};

function inferPOS(word) {
  const w = (word || "").toLowerCase();
  if (BUILTIN_DICT[w]) return BUILTIN_DICT[w].pos;
  if (/(tion|ment|ness|ity|ance|ence|ship|ism)$/.test(w)) return "Noun";
  if (/(ly)$/.test(w)) return "Adverb";
  if (/(ous|ful|able|ible|ive|al|ic)$/.test(w)) return "Adjective";
  if (/(ize|ise|ate|ify|ed|ing)$/.test(w)) return "Verb";
  return "Vocabulary Term";
}

const DEFAULT_CARDS = [
  {
    id: "card_seed_1",
    word: "productivity",
    translation: "productividad (ES) • productivité (FR)",
    pos: "Noun",
    context: "Engineering teams improve productivity by 42.5% across deployments."
  },
  {
    id: "card_seed_2",
    word: "benchmark",
    translation: "punto de referencia (ES) • Maßstab (DE)",
    pos: "Noun",
    context: "Enterprise AI & E-Commerce Benchmark Report 2026."
  }
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["languageStudyDeck"], (res) => {
    if (!Array.isArray(res.languageStudyDeck) || res.languageStudyDeck.length === 0) {
      chrome.storage.local.set({ languageStudyDeck: DEFAULT_CARDS });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "LANG_LOOKUP_WORD") {
    const rawWord = String(msg.word || "").trim().replace(/[^a-zA-ZÀ-ÿ'-]/g, "");
    const lower = rawWord.toLowerCase();
    const targetLang = msg.targetLang || "es";
    const pos = inferPOS(lower);

    if (BUILTIN_DICT[lower]) {
      const entry = BUILTIN_DICT[lower];
      sendResponse({
        ok: true,
        word: rawWord,
        pos,
        translation: `${entry[targetLang] || entry.es} (${targetLang.toUpperCase()})`
      });
      return false;
    }

    fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(rawWord)}&langpair=en|${encodeURIComponent(targetLang)}`)
      .then((r) => r.json())
      .then((data) => {
        const tr = data?.responseData?.translatedText || `${rawWord} [${targetLang.toUpperCase()}]`;
        sendResponse({ ok: true, word: rawWord, pos, translation: tr });
      })
      .catch(() => {
        sendResponse({ ok: true, word: rawWord, pos, translation: `${rawWord} (${targetLang.toUpperCase()})` });
      });
    return true;
  }

  if (msg && msg.type === "LANG_SAVE_CARD") {
    chrome.storage.local.get(["languageStudyDeck"], (res) => {
      const deck = Array.isArray(res.languageStudyDeck) && res.languageStudyDeck.length ? res.languageStudyDeck : [...DEFAULT_CARDS];
      const newCard = {
        id: "card_" + Date.now(),
        word: msg.word || "vocabulary",
        translation: msg.translation || "traducción",
        pos: msg.pos || inferPOS(msg.word || ""),
        context: (msg.context || "Saved from webpage bilingual study bar").slice(0, 140)
      };
      const filtered = deck.filter((c) => c.word.toLowerCase() !== newCard.word.toLowerCase());
      filtered.unshift(newCard);
      chrome.storage.local.set({ languageStudyDeck: filtered.slice(0, 100) }, () => {
        sendResponse({ ok: true, card: newCard, deck: filtered.slice(0, 100) });
      });
    });
    return true;
  }

  if (msg && msg.type === "LANG_GET_DECK") {
    chrome.storage.local.get(["languageStudyDeck"], (res) => {
      const deck = Array.isArray(res.languageStudyDeck) && res.languageStudyDeck.length ? res.languageStudyDeck : DEFAULT_CARDS;
      sendResponse({ ok: true, deck });
    });
    return true;
  }
});
