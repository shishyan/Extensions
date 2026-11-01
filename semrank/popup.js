let currentDiag = {
  ngrams1: [{ phrase: "artificial", count: 5, density: "4.2%" }],
  ngrams2: [{ phrase: "artificial intelligence", count: 4, density: "3.4%" }],
  ngrams3: [{ phrase: "artificial intelligence research", count: 3, density: "2.5%" }]
};
let activeN = "1";

function renderMatrix() {
  const box = document.getElementById("ngramBox");
  const list =
    activeN === "3"
      ? currentDiag.ngrams3
      : activeN === "2"
      ? currentDiag.ngrams2
      : currentDiag.ngrams1;

  if (!list || !list.length) {
    box.innerHTML = `<div style="color:#94a3b8;">No n-gram phrases extracted yet.</div>`;
    return;
  }

  box.innerHTML = list
    .map(
      (it) => `
      <div class="row">
        <span><strong>${it.phrase}</strong></span>
        <span style="color:#fca5a5;">${it.count}x (${it.density})</span>
      </div>
    `
    )
    .join("");
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "SEMRANK_GET_DIAGNOSIS" }, (res) => {
        if (!chrome.runtime.lastError && res) currentDiag = res;
        renderMatrix();
      });
    } else {
      renderMatrix();
    }
  });
} else {
  renderMatrix();
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeN = btn.getAttribute("data-n") || "1";
    renderMatrix();
  });
});
