
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

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ deeptranslate_target_lang: "es" });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "DEEPTRANSLATE_TRANSLATE") {
    const text = String(msg.text || "").trim();
    const tl = msg.targetLang || "es";
    if (!text) {
      sendResponse({ translated: "", provider: "empty" });
      return true;
    }
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translated = data[0].map((seg) => (seg && seg[0]) || "").join("");
          const detectedLang = data[2] || "auto";
          sendResponse({ translated, detectedLang, provider: "Neural GTX Engine" });
        } else {
          sendResponse({ translated: offlineTranslate(text, tl), detectedLang: "auto", provider: "Offline Lexicon" });
        }
      })
      .catch(() => {
        sendResponse({ translated: offlineTranslate(text, tl), detectedLang: "auto", provider: "Offline Lexicon" });
      });
    return true;
  }
});
