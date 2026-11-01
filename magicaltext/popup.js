const DEFAULT_SNIPPETS = {
  "//intro": "Hi there! I came across {title} on {domain} and wanted to connect regarding our upcoming collaboration.",
  "//cal": "Feel free to grab a 15-minute slot on my calendar whenever works best for you (checked on {date}).",
  "//followup": "Just following up on my previous note sent on {date} — let me know if you have any questions!",
  "//sig": "Best regards,\nExecutive Operations Team ({domain})",
  "//date": "{date} {time}",
  "//clip": "Reference: {title} ({url}) — captured on {date}"
};

let currentSnippets = Object.assign({}, DEFAULT_SNIPPETS);

function renderSnippets() {
  const listEl = document.getElementById("snipList");
  const entries = Object.entries(currentSnippets);
  listEl.innerHTML = entries
    .map(
      ([trig, tpl]) => `
      <div class="snip-item">
        <span class="trig">${trig}</span>
        <span style="flex:1;color:#cbd5e1;line-height:1.35;">${String(tpl).slice(0, 95)}</span>
        <button class="del-btn" data-trig="${trig}">✕</button>
      </div>
    `
    )
    .join("");

  listEl.querySelectorAll(".del-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = btn.getAttribute("data-trig");
      delete currentSnippets[t];
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ magicaltext_snippets: currentSnippets });
      }
      renderSnippets();
    });
  });
}

if (chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(["magicaltext_snippets"], (res) => {
    if (res && res.magicaltext_snippets) {
      currentSnippets = Object.assign({}, DEFAULT_SNIPPETS, res.magicaltext_snippets);
    }
    renderSnippets();
  });
} else {
  renderSnippets();
}

document.getElementById("addBtn").addEventListener("click", () => {
  let trig = document.getElementById("trigInput").value.trim();
  const tpl = document.getElementById("tplInput").value.trim();
  if (!trig || !tpl) return;
  if (!trig.startsWith("//")) trig = "//" + trig;

  currentSnippets[trig] = tpl;
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ magicaltext_snippets: currentSnippets });
  }
  document.getElementById("trigInput").value = "";
  document.getElementById("tplInput").value = "";
  renderSnippets();
});
