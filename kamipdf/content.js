(function () {
  if (document.getElementById("kamipdf-toolbar")) return;

  function scanPdfLinks() {
    return Array.from(document.querySelectorAll("a[href]"))
      .map((a) => ({ text: (a.innerText || a.textContent || "PDF Document").trim(), href: a.href }))
      .filter((item) => /\.pdf(\?|$|#)/i.test(item.href));
  }

  function highlightKeySentence() {
    const target = document.querySelector("article p, main p, p, h1");
    if (target) {
      target.classList.add("kamipdf-highlight-yellow");
    }
    return target ? (target.innerText || target.textContent || "").trim() : "Highlighted selection";
  }

  function injectStickyCallout(noteText) {
    const note = document.createElement("div");
    note.className = "kamipdf-sticky-note";
    note.textContent = "📝 KamiPDF Note: " + (noteText || "Key research finding verified for PDF export.");
    const anchor = document.querySelector("article, main, body") || document.body;
    anchor.insertBefore(note, anchor.firstChild);
    chrome.runtime.sendMessage({
      type: "KAMIPDF_SAVE_NOTE",
      entry: { url: location.href, note: note.textContent, color: "yellow" }
    });
  }

  const pdfs = scanPdfLinks();
  const bar = document.createElement("div");
  bar.id = "kamipdf-toolbar";
  bar.innerHTML = `
    <span>🖍️ KamiPDF (${pdfs.length} PDFs)</span>
    <button id="kamipdf-hl-btn">Highlight</button>
    <button id="kamipdf-note-btn">+Sticky Note</button>
    <button id="kamipdf-print-btn">Clean PDF</button>
  `;
  document.documentElement.appendChild(bar);

  bar.querySelector("#kamipdf-hl-btn").addEventListener("click", () => {
    highlightKeySentence();
  });

  bar.querySelector("#kamipdf-note-btn").addEventListener("click", () => {
    injectStickyCallout("Annotated via KamiPDF Toolbar");
  });

  bar.querySelector("#kamipdf-print-btn").addEventListener("click", () => {
    document.documentElement.setAttribute("data-kamipdf-print-ready", "true");
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "KAMIPDF_SCAN") {
      sendResponse({
        ok: true,
        pdfs: scanPdfLinks(),
        highlights: document.querySelectorAll(".kamipdf-highlight-yellow").length,
        stickies: document.querySelectorAll(".kamipdf-sticky-note").length
      });
    } else if (msg.type === "KAMIPDF_ACTION") {
      if (msg.action === "highlight") highlightKeySentence();
      if (msg.action === "sticky") injectStickyCallout(msg.text);
      sendResponse({
        ok: true,
        pdfs: scanPdfLinks(),
        highlights: document.querySelectorAll(".kamipdf-highlight-yellow").length,
        stickies: document.querySelectorAll(".kamipdf-sticky-note").length
      });
    }
  });
})();
