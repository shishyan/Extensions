(function () {
  if (document.getElementById("kamipdf-toolbar")) return;

  function scanPdfLinks() {
    return Array.from(document.querySelectorAll("a[href]"))
      .map((a) => ({ text: (a.innerText || a.textContent || "PDF Document").trim(), href: a.href }))
      .filter((item) => /\.pdf(\?|$|#)/i.test(item.href));
  }

  function highlightKeySentence(color = "yellow") {
    const colorMap = {
      yellow: "rgba(250, 204, 21, 0.42)",
      green: "rgba(74, 222, 128, 0.38)",
      pink: "rgba(244, 114, 182, 0.38)"
    };
    const target = document.querySelector("article p, main p, p, h1");
    if (target) {
      target.classList.add("kamipdf-highlight-yellow");
      target.style.backgroundColor = colorMap[color] || colorMap.yellow;
    }
    return target ? (target.innerText || target.textContent || "").trim() : "Highlighted selection";
  }

  function injectStickyCallout(noteText, color = "yellow") {
    const note = document.createElement("div");
    note.className = "kamipdf-sticky-note";
    note.textContent = "📝 KamiPDF Note: " + (noteText || "Key research finding verified for PDF export.");
    const anchor = document.querySelector("article, main, body") || document.body;
    anchor.insertBefore(note, anchor.firstChild);
    chrome.runtime.sendMessage({
      type: "KAMIPDF_SAVE_NOTE",
      entry: { url: location.href, note: note.textContent, color }
    });
  }

  const pdfs = scanPdfLinks();
  const bar = document.createElement("div");
  bar.id = "kamipdf-toolbar";
  bar.innerHTML = `
    <span>🖍️ KamiPDF (${pdfs.length} PDFs)</span>
    <button id="kamipdf-hl-btn">🟨 Highlight</button>
    <button id="kamipdf-hl-green-btn" style="background:#22c55e;color:#052e16;">🟩</button>
    <button id="kamipdf-hl-pink-btn" style="background:#ec4899;color:#fff;">🟪</button>
    <button id="kamipdf-note-btn">+Sticky Note</button>
    <button id="kamipdf-print-btn">🖨️ Clean PDF</button>
  `;
  document.documentElement.appendChild(bar);

  bar.querySelector("#kamipdf-hl-btn").addEventListener("click", () => highlightKeySentence("yellow"));
  bar.querySelector("#kamipdf-hl-green-btn").addEventListener("click", () => highlightKeySentence("green"));
  bar.querySelector("#kamipdf-hl-pink-btn").addEventListener("click", () => highlightKeySentence("pink"));

  bar.querySelector("#kamipdf-note-btn").addEventListener("click", () => {
    injectStickyCallout("Annotated via KamiPDF Toolbar");
  });

  bar.querySelector("#kamipdf-print-btn").addEventListener("click", () => {
    document.documentElement.setAttribute("data-kamipdf-print-ready", "true");
    try { window.print(); } catch (_) {}
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
      if (msg.action === "highlight") highlightKeySentence(msg.color || "yellow");
      if (msg.action === "sticky") injectStickyCallout(msg.text, msg.color || "yellow");
      if (msg.action === "print") {
        document.documentElement.setAttribute("data-kamipdf-print-ready", "true");
        try { window.print(); } catch (_) {}
      }
      sendResponse({
        ok: true,
        pdfs: scanPdfLinks(),
        highlights: document.querySelectorAll(".kamipdf-highlight-yellow").length,
        stickies: document.querySelectorAll(".kamipdf-sticky-note").length
      });
    }
  });
})();
