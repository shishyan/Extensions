
const OFFLINE_LEXICON = {
  es: { hello: "hola", world: "mundo", thank: "gracias", you: "tú", good: "bueno", morning: "mañana", night: "noche", friend: "amigo", price: "precio", free: "gratis", software: "software", fast: "rápido", open: "abierto", search: "buscar", page: "página", book: "libro", water: "agua", food: "comida", house: "casa", work: "trabajo", time: "tiempo", day: "día", love: "amor", happy: "feliz", new: "nuevo", today: "hoy" },
  fr: { hello: "bonjour", world: "monde", thank: "merci", you: "vous", good: "bon", morning: "matin", night: "nuit", friend: "ami", price: "prix", free: "gratuit", software: "logiciel", fast: "rapide", open: "ouvert", search: "chercher", page: "page", book: "livre", water: "eau", food: "nourriture", house: "maison", work: "travail", time: "temps", day: "jour", love: "amour", happy: "heureux", new: "nouveau", today: "aujourd'hui" },
  de: { hello: "hallo", world: "welt", thank: "danke", you: "du", good: "gut", morning: "morgen", night: "nacht", friend: "freund", price: "preis", free: "kostenlos", software: "software", fast: "schnell", open: "offen", search: "suchen", page: "seite", book: "buch", water: "wasser", food: "essen", house: "haus", work: "arbeit", time: "zeit", day: "tag", love: "liebe", happy: "glücklich", new: "neu", today: "heute" },
  ja: { hello: "こんにちは", world: "世界", thank: "ありがとう", you: "あなた", good: "良い", morning: "朝", night: "夜", friend: "友達", price: "価格", free: "無料", software: "ソフトウェア", fast: "速い", open: "開く", search: "検索", page: "ページ", book: "本", water: "水", food: "食べ物", house: "家", work: "仕事", time: "時間", day: "日", love: "愛", happy: "幸せ", new: "新しい", today: "今日" },
  "zh-CN": { hello: "你好", world: "世界", thank: "谢谢", you: "你", good: "好", morning: "早上", night: "夜晚", friend: "朋友", price: "价格", free: "免费", software: "软件", fast: "快", open: "打开", search: "搜索", page: "页面", book: "书", water: "水", food: "食物", house: "房子", work: "工作", time: "时间", day: "天", love: "爱", happy: "快乐", new: "新", today: "今天" },
  pt: { hello: "olá", world: "mundo", thank: "obrigado", you: "você", good: "bom", morning: "manhã", night: "noite", friend: "amigo", price: "preço", free: "grátis", software: "software", fast: "rápido", open: "aberto", search: "buscar", page: "página" },
  it: { hello: "ciao", world: "mondo", thank: "grazie", you: "tu", good: "buono", morning: "mattina", night: "notte", friend: "amico", price: "prezzo", free: "gratuito", software: "software", fast: "veloce", open: "aperto", search: "cercare", page: "pagina" },
  ru: { hello: "привет", world: "мир", thank: "спасибо", you: "вы", good: "хороший", morning: "утро", night: "ночь", friend: "друг", price: "цена", free: "бесплатно", fast: "быстро", search: "поиск", page: "страница" },
  ko: { hello: "안녕하세요", world: "세계", thank: "감사합니다", you: "당신", good: "좋은", morning: "아침", night: "밤", friend: "친구", price: "가격", free: "무료", fast: "빠른", search: "검색", page: "페이지" },
  ar: { hello: "مرحبا", world: "عالم", thank: "شكرا", you: "أنت", good: "جيد", morning: "صباح", night: "ليل", friend: "صديق", price: "سعر", free: "مجاني", fast: "سريع", search: "بحث", page: "صفحة" },
  hi: { hello: "नमस्ते", world: "दुनिया", thank: "धन्यवाद", you: "आप", good: "अच्छा", morning: "सुबह", night: "रात", friend: "दोस्त", price: "कीमत", free: "मुफ़्त", fast: "तेज़", search: "खोज", page: "पृष्ठ" }
};

function offlineTranslate(text, targetLang) {
  const dict = OFFLINE_LEXICON[targetLang] || OFFLINE_LEXICON.es;
  return String(text || "")
    .split(/(\b)/)
    .map((tok) => {
      const low = tok.toLowerCase();
      return dict[low] ? dict[low] : tok;
    })
    .join("");
}

(function () {
  if (window.__deepTranslateLoaded) return;
  window.__deepTranslateLoaded = true;

  let tooltip = null;
  function showTooltip(x, y, text) {
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "deeptranslate-tooltip";
      tooltip.style.cssText = "position:fixed;z-index:2147483647;background:#0f172a;color:#f8fafc;border:1px solid #38bdf8;border-radius:8px;padding:8px 11px;font-size:12px;max-width:320px;box-shadow:0 8px 24px rgba(0,0,0,0.45);font-family:system-ui,sans-serif;";
      document.body.appendChild(tooltip);
    }
    tooltip.style.left = Math.min(window.innerWidth - 330, Math.max(10, x)) + "px";
    tooltip.style.top = Math.min(window.innerHeight - 80, Math.max(10, y + 14)) + "px";
    tooltip.style.display = "block";
    tooltip.innerHTML = text;
  }

  document.addEventListener("mouseup", (e) => {
    const sel = window.getSelection().toString().trim();
    if (!sel || sel.length < 2 || sel.length > 350) {
      if (tooltip) tooltip.style.display = "none";
      return;
    }
    chrome.storage.local.get(["deeptranslate_target_lang"], (st) => {
      const lang = (st && st.deeptranslate_target_lang) || "es";
      chrome.runtime.sendMessage({ type: "DEEPTRANSLATE_TRANSLATE", text: sel, targetLang: lang }, (res) => {
        const out = (!chrome.runtime.lastError && res && res.translated) ? res.translated : offlineTranslate(sel, lang);
        showTooltip(e.clientX, e.clientY, `🌐 <strong>[${lang.toUpperCase()}]</strong> ${out}`);
      });
    });
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "DEEPTRANSLATE_PAGE") {
      const lang = msg.lang || "es";
      const paragraphs = Array.from(document.querySelectorAll("p, h1, h2, h3")).slice(0, 18);
      paragraphs.forEach((p) => {
        if (p.dataset.deepTranslated) return;
        p.dataset.deepTranslated = "1";
        const orig = (p.innerText || "").trim();
        if (orig.length < 12) return;
        chrome.runtime.sendMessage({ type: "DEEPTRANSLATE_TRANSLATE", text: orig.slice(0, 260), targetLang: lang }, (res) => {
          const out = (!chrome.runtime.lastError && res && res.translated) ? res.translated : offlineTranslate(orig, lang);
          const sub = document.createElement("div");
          sub.className = "deeptranslate-bilingual-line";
          sub.style.cssText = "margin-top:4px;padding:4px 8px;border-left:3px solid #38bdf8;background:rgba(15,23,42,0.06);color:#0284c7;font-size:0.92em;";
          sub.textContent = `🌐 [${lang.toUpperCase()}] ${out}`;
          p.appendChild(sub);
        });
      });
      sendResponse({ ok: true });
      return true;
    }
  });
})();
