document.addEventListener("DOMContentLoaded", () => {
  const out = document.getElementById("kp-output");

  function renderStatus(res) {
    if (!res) {
      out.textContent = "KamiPDF Ready — 0 PDFs detected on blank tab.";
      return;
    }
    const pdfList = (res.pdfs || []).map((p, i) => `  ${i + 1}. ${p.text} -> ${p.href}`).join("\n");
    out.textContent =
      `Highlights: ${res.highlights || 0} | Sticky Notes: ${res.stickies || 0}\n` +
      `Detected .PDF Links (${(res.pdfs || []).length}):\n` +
      (pdfList || "  None on current page");
  }

  function sendToTab(payload) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, payload, (res) => {
          if (!chrome.runtime.lastError && res) renderStatus(res);
          else renderStatus(null);
        });
      } else {
        renderStatus(null);
      }
    });
  }

  sendToTab({ type: "KAMIPDF_SCAN" });

  document.getElementById("kp-hl").addEventListener("click", () => {
    sendToTab({ type: "KAMIPDF_ACTION", action: "highlight" });
  });

  document.getElementById("kp-add-note").addEventListener("click", () => {
    const text = document.getElementById("kp-note").value.trim();
    sendToTab({ type: "KAMIPDF_ACTION", action: "sticky", text });
  });

  document.getElementById("kp-scan").addEventListener("click", () => {
    sendToTab({ type: "KAMIPDF_SCAN" });
  });
});
