const OFFLINE_LEXICON = {
  es: { hello: "hola", world: "mundo", welcome: "bienvenido", artificial: "artificial", intelligence: "inteligencia", research: "investigación", summary: "resumen", knowledge: "conocimiento", guide: "guía" },
  ta: { hello: "வணக்கம்", world: "உலகம்", welcome: "நல்வரவு", artificial: "செயற்கை", intelligence: "நுண்ணறிவு", research: "ஆராய்ச்சி", summary: "சுருக்கம்", knowledge: "அறிவு", guide: "வழிகாட்டி" },
  hi: { hello: "नमस्ते", world: "दुनिया", welcome: "स्वागत", artificial: "कृत्रिम", intelligence: "बुद्धिमत्ता", research: "अनुसंधान", summary: "सारांश", knowledge: "ज्ञान", guide: "मार्गदर्शिका" },
  fr: { hello: "bonjour", world: "monde", welcome: "bienvenue", artificial: "artificielle", intelligence: "intelligence", research: "recherche", summary: "résumé", knowledge: "connaissance", guide: "guide" },
  de: { hello: "hallo", world: "Welt", welcome: "willkommen", artificial: "künstliche", intelligence: "Intelligenz", research: "Forschung", summary: "Zusammenfassung", knowledge: "Wissen", guide: "Leitfaden" },
  ja: { hello: "こんにちは", world: "世界", welcome: "ようこそ", artificial: "人工", intelligence: "知能", research: "研究", summary: "要約", knowledge: "知識", guide: "ガイド" }
};

function fallbackTranslate(text, lang) {
  const dict = OFFLINE_LEXICON[lang] || OFFLINE_LEXICON.es;
  const out = String(text).replace(/\b([A-Za-z]+)\b/g, (w) => {
    const low = w.toLowerCase();
    return dict[low] ? dict[low] : w;
  });
  return `[${lang.toUpperCase()}] ${out}`;
}

async function runPopupTranslation() {
  const lang = document.getElementById("langSelect").value;
  const text = document.getElementById("srcText").value.trim();
  const outBox = document.getElementById("outBox");
  if (!text) return;

  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ deeptranslate_lang: lang });
  }

  outBox.textContent = fallbackTranslate(text, lang);
}

if (chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(["deeptranslate_lang"], (res) => {
    if (res && res.deeptranslate_lang) {
      document.getElementById("langSelect").value = res.deeptranslate_lang;
    }
    runPopupTranslation();
  });
} else {
  runPopupTranslation();
}

document.getElementById("langSelect").addEventListener("change", runPopupTranslation);
document.getElementById("transBtn").addEventListener("click", runPopupTranslation);

document.getElementById("bilingualBtn").addEventListener("click", () => {
  const lang = document.getElementById("langSelect").value;
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "DEEP_TOGGLE_BILINGUAL", lang }, (res) => {
          if (res && res.active) {
            document.getElementById("bilingualBtn").textContent = `✅ Bilingual (${res.count}P)`;
          } else {
            document.getElementById("bilingualBtn").textContent = "📖 Bilingual Page Mode";
          }
        });
      }
    });
  }
});

document.getElementById("copyBtn").addEventListener("click", () => {
  const txt = document.getElementById("outBox").textContent || "";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).catch(() => {});
  }
  document.getElementById("copyBtn").textContent = "✅ Copied!";
});
