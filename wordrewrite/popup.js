const sentenceInput = document.getElementById("sentenceInput");
const toneLabel = document.getElementById("toneLabel");
const clarityScore = document.getElementById("clarityScore");
const cardsContainer = document.getElementById("cardsContainer");

function renderRewrites() {
  const text = sentenceInput.value.trim();
  if (!text) {
    cardsContainer.innerHTML = "";
    return;
  }

  chrome.runtime.sendMessage({ type: "WORDREWRITE_GENERATE", text }, (res) => {
    if (chrome.runtime.lastError || !res || !res.ok) return;
    toneLabel.textContent = res.tone?.label || "Balanced";
    clarityScore.textContent = `${res.tone?.clarity || 92}%`;

    cardsContainer.innerHTML = "";
    (res.variants || []).forEach((v) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card-top">
          <span>${v.tag}</span>
          <span class="copy-hint" style="color:#94a3b8;font-weight:600;">Click to Use & Copy</span>
        </div>
        <div class="card-txt">${v.text}</div>
      `;
      card.addEventListener("click", () => {
        sentenceInput.value = v.text;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(v.text).catch(() => {});
        }
        const hint = card.querySelector(".copy-hint");
        if (hint) {
          hint.textContent = "✅ Copied!";
          hint.style.color = "#34d399";
        }
      });
      cardsContainer.appendChild(card);
    });
  });
}

document.getElementById("rewriteBtn").addEventListener("click", renderRewrites);
sentenceInput.addEventListener("input", renderRewrites);

renderRewrites();
