let deck = [];
let idx = 0;
let flipped = false;

const fcWord = document.getElementById("fcWord");
const fcTranslation = document.getElementById("fcTranslation");
const fcContext = document.getElementById("fcContext");
const deckCount = document.getElementById("deckCount");

function renderCard() {
  deckCount.textContent = String(deck.length);
  if (!deck.length) {
    fcWord.textContent = "Empty Deck";
    fcTranslation.textContent = "Click any word on a webpage to add flashcards!";
    return;
  }
  const c = deck[idx % deck.length];
  fcWord.textContent = `${c.word} (${c.pos || "Vocab"})`;
  fcTranslation.textContent = flipped ? `🎯 ${c.translation}` : "👆 Click to reveal translation";
  fcContext.textContent = c.context || "";
}

function loadDeck() {
  chrome.runtime.sendMessage({ type: "LANG_GET_DECK" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      deck = res.deck || [];
      renderCard();
    }
  });
}

document.getElementById("flashcardBox").addEventListener("click", () => {
  flipped = !flipped;
  renderCard();
});

document.getElementById("flipCardBtn").addEventListener("click", () => {
  flipped = !flipped;
  renderCard();
});

document.getElementById("prevCardBtn").addEventListener("click", () => {
  if (!deck.length) return;
  idx = (idx - 1 + deck.length) % deck.length;
  flipped = false;
  renderCard();
});

document.getElementById("nextCardBtn").addEventListener("click", () => {
  if (!deck.length) return;
  idx = (idx + 1) % deck.length;
  flipped = false;
  renderCard();
});

document.getElementById("lookupSaveBtn").addEventListener("click", () => {
  const word = document.getElementById("wordInput").value.trim();
  const targetLang = document.getElementById("langSelect").value;
  if (!word) return;
  chrome.runtime.sendMessage({ type: "LANG_LOOKUP_WORD", word, targetLang }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      chrome.runtime.sendMessage(
        {
          type: "LANG_SAVE_CARD",
          word: res.word,
          translation: res.translation,
          pos: res.pos,
          context: `Saved via LanguageStudy Studio (${targetLang.toUpperCase()})`
        },
        (saved) => {
          if (saved && saved.ok) {
            deck = saved.deck || deck;
            idx = 0;
            flipped = true;
            renderCard();
          }
        }
      );
    }
  });
});

document.getElementById("exportAnkiBtn").addEventListener("click", () => {
  const csv = [
    "Front,Back,Part_of_Speech,Context",
    ...deck.map((c) => `"${c.word}","${c.translation}","${c.pos}","${(c.context || "").replace(/"/g, '""')}"`)
  ].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(csv).catch(() => {});
  }
  fcContext.textContent = "✅ Anki CSV copied to clipboard!";
});

loadDeck();
