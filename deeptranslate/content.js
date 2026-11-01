(function () {
  if (window.__deepTranslateLoaded) return;
  window.__deepTranslateLoaded = true;

  let targetLang = "es";

  const LANG_LABELS = {
    es: "Spanish (Español)",
    ta: "Tamil (தமிழ்)",
    hi: "Hindi (हिन्दी)",
    fr: "French (Français)",
    de: "German (Deutsch)",
    ja: "Japanese (日本語)"
  };

  const OFFLINE_LEXICON = {
    es: {
      hello: "hola",
      world: "mundo",
      welcome: "bienvenido",
      summary: "resumen",
      article: "artículo",
      research: "investigación",
      intelligence: "inteligencia",
      artificial: "artificial",
      system: "sistema",
      performance: "rendimiento",
      language: "idioma",
      translation: "traducción",
      knowledge: "conocimiento",
      guide: "guía",
      data: "datos",
      analysis: "análisis"
    },
    ta: {
      hello: "வணக்கம்",
      world: "உலகம்",
      welcome: "நல்வரவு",
      summary: "சுருக்கம்",
      article: "கட்டுரை",
      research: "ஆராய்ச்சி",
      intelligence: "நுண்ணறிவு",
      artificial: "செயற்கை",
      system: "அமைப்பு",
      performance: "செயல்திறன்",
      language: "மொழி",
      translation: "மொழிபெயர்ப்பு",
      knowledge: "அறிவு",
      guide: "வழிகாட்டி",
      data: "தரவு",
      analysis: "பகுப்பாய்வு"
    },
    hi: {
      hello: "नमस्ते",
      world: "दुनिया",
      welcome: "स्वागत",
      summary: "सारांश",
      article: "लेख",
      research: "अनुसंधान",
      intelligence: "बुद्धिमत्ता",
      artificial: "कृत्रिम",
      system: "प्रणाली",
      performance: "प्रदर्शन",
      language: "भाषा",
      translation: "अनुवाद",
      knowledge: "ज्ञान",
      guide: "मार्गदर्शिका",
      data: "डेटा",
      analysis: "विश्लेषण"
    },
    fr: {
      hello: "bonjour",
      world: "monde",
      welcome: "bienvenue",
      summary: "résumé",
      article: "article",
      research: "recherche",
      intelligence: "intelligence",
      artificial: "artificielle",
      system: "système",
      performance: "performance",
      language: "langue",
      translation: "traduction",
      knowledge: "connaissance",
      guide: "guide",
      data: "données",
      analysis: "analyse"
    },
    de: {
      hello: "hallo",
      world: "Welt",
      welcome: "willkommen",
      summary: "Zusammenfassung",
      article: "Artikel",
      research: "Forschung",
      intelligence: "Intelligenz",
      artificial: "künstliche",
      system: "System",
      performance: "Leistung",
      language: "Sprache",
      translation: "Übersetzung",
      knowledge: "Wissen",
      guide: "Leitfaden",
      data: "Daten",
      analysis: "Analyse"
    },
    ja: {
      hello: "こんにちは",
      world: "世界",
      welcome: "ようこそ",
      summary: "要約",
      article: "記事",
      research: "研究",
      intelligence: "知能",
      artificial: "人工",
      system: "システム",
      performance: "パフォーマンス",
      language: "言語",
      translation: "翻訳",
      knowledge: "知識",
      guide: "ガイド",
      data: "データ",
      analysis: "分析"
    }
  };

  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["deeptranslate_lang"], (res) => {
      if (res && res.deeptranslate_lang) targetLang = res.deeptranslate_lang;
    });
  }

  function offlineTranslate(text, lang) {
    const dict = OFFLINE_LEXICON[lang] || OFFLINE_LEXICON.es;
    const replaced = String(text).replace(/\b([A-Za-z]+)\b/g, (word) => {
      const lower = word.toLowerCase();
      return dict[lower] ? dict[lower] : word;
    });
    const tag = LANG_LABELS[lang] || lang.toUpperCase();
    return `[${tag}] ${replaced}`;
  }

  async function translateText(text, lang) {
    const clean = String(text || "").trim();
    if (!clean) return "";
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(clean)}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const joined = data[0].map((seg) => (seg && seg[0] ? seg[0] : "")).join("");
          if (joined.trim()) return joined.trim();
        }
      }
    } catch (_) {
      // Fallback to instant offline lexicon engine
    }
    return offlineTranslate(clean, lang);
  }

  function ensureTooltip() {
    let tip = document.getElementById("deeptranslate-tooltip");
    if (!tip) {
      tip = document.createElement("div");
      tip.id = "deeptranslate-tooltip";
      tip.innerHTML = `
        <div class="dt-head">
          <span id="dt-lang-label">🌐 DeepTranslate</span>
          <button id="dt-speak-btn" style="background:none;border:none;color:#38bdf8;cursor:pointer;font-size:11px;font-weight:700;">🔊 Listen</button>
        </div>
        <div class="dt-body" id="dt-body-text">Translating...</div>
      `;
      document.body.appendChild(tip);

      tip.querySelector("#dt-speak-btn").addEventListener("click", () => {
        const txt = tip.querySelector("#dt-body-text").textContent || "";
        if (window.speechSynthesis && txt) {
          const u = new SpeechSynthesisUtterance(txt);
          u.lang = targetLang;
          window.speechSynthesis.speak(u);
        }
      });
    }
    return tip;
  }

  document.addEventListener("mouseup", async (e) => {
    const tip = ensureTooltip();
    if (tip.contains(e.target)) return;
    const sel = window.getSelection();
    const txt = sel ? sel.toString().trim() : "";
    if (txt.length >= 3 && sel.rangeCount > 0) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      tip.style.left = `${Math.max(12, Math.min(window.innerWidth - 330, rect.left))}px`;
      tip.style.top = `${Math.max(12, rect.bottom + 8)}px`;
      tip.querySelector("#dt-lang-label").textContent = `🌐 DeepTranslate → ${LANG_LABELS[targetLang] || targetLang}`;
      tip.querySelector("#dt-body-text").textContent = "Translating selection...";
      tip.style.display = "block";
      const translated = await translateText(txt, targetLang);
      tip.querySelector("#dt-body-text").textContent = translated;
    } else {
      tip.style.display = "none";
    }
  });

  async function toggleBilingualPage(langOverride) {
    const lang = langOverride || targetLang;
    const existing = document.querySelectorAll(".deeptranslate-bilingual-block");
    if (existing.length > 0 && !langOverride) {
      existing.forEach((el) => el.remove());
      return { active: false, count: 0 };
    }
    existing.forEach((el) => el.remove());

    const paragraphs = Array.from(document.querySelectorAll("p, article li, h2")).filter(
      (p) => p.innerText && p.innerText.trim().length > 20
    ).slice(0, 12);

    let count = 0;
    for (const p of paragraphs) {
      const orig = p.innerText.trim();
      const trans = await translateText(orig, lang);
      const block = document.createElement("div");
      block.className = "deeptranslate-bilingual-block";
      block.textContent = `🌐 ${trans}`;
      p.insertAdjacentElement("afterend", block);
      count++;
    }
    return { active: true, count };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "DEEP_TRANSLATE_TEXT") {
      const lang = msg.lang || targetLang;
      translateText(msg.text || "", lang).then((translated) => {
        sendResponse({ ok: true, translated, lang });
      });
      return true;
    }
    if (msg && msg.type === "DEEP_TOGGLE_BILINGUAL") {
      if (msg.lang) targetLang = msg.lang;
      toggleBilingualPage(targetLang).then((res) => {
        sendResponse(res);
      });
      return true;
    }
  });

  ensureTooltip();
})();
