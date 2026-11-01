(() => {
  if (document.getElementById("printclean-toolbar")) return;

  let zapMode = false;
  let fontScale = 100;
  const removedStack = [];

  function hideElement(el) {
    if (!el || el.id === "printclean-toolbar" || el.closest("#printclean-toolbar")) return false;
    removedStack.push({ el, prevDisplay: el.style.display });
    el.style.setProperty("display", "none", "important");
    updateCounter();
    return true;
  }

  function stripClutter() {
    const selectors = ["nav", "aside", "footer", "iframe", ".ad-banner", ".sidebar", "[role='banner']"];
    let count = 0;
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.style.display !== "none" && hideElement(el)) {
          count++;
        }
      });
    });
    updateCounter();
    return count;
  }

  function undoLast() {
    const item = removedStack.pop();
    if (item && item.el) {
      item.el.style.display = item.prevDisplay || "";
    }
    updateCounter();
    return removedStack.length;
  }

  const toolbar = document.createElement("div");
  toolbar.id = "printclean-toolbar";
  toolbar.innerHTML = `
    <span class="pc-brand">🖨️ PrintClean</span>
    <button type="button" id="printclean-zap-btn">🗑️ Click Any Element to Delete Before Print</button>
    <button type="button" id="printclean-strip-btn">✨ Strip Clutter</button>
    <button type="button" id="printclean-undo-btn">↩ Undo (<span id="printclean-count">0</span>)</button>
  `;
  document.body.appendChild(toolbar);

  const zapBtn = document.getElementById("printclean-zap-btn");
  const stripBtn = document.getElementById("printclean-strip-btn");
  const undoBtn = document.getElementById("printclean-undo-btn");
  const countSpan = document.getElementById("printclean-count");

  function updateCounter() {
    if (countSpan) countSpan.textContent = String(removedStack.length);
  }

  zapBtn.addEventListener("click", () => {
    zapMode = !zapMode;
    document.body.classList.toggle("printclean-zap-active", zapMode);
    zapBtn.textContent = zapMode
      ? "🗑️ Zap Mode ON (Click Element)"
      : "🗑️ Click Any Element to Delete Before Print";
  });

  stripBtn.addEventListener("click", () => {
    stripClutter();
  });

  undoBtn.addEventListener("click", () => {
    undoLast();
  });

  document.addEventListener("click", (e) => {
    if (!zapMode) return;
    if (e.target.closest("#printclean-toolbar")) return;
    e.preventDefault();
    e.stopPropagation();
    hideElement(e.target);
  }, true);

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "PRINTCLEAN_ACTION") {
      if (msg.action === "STRIP_CLUTTER") {
        const stripped = stripClutter();
        sendResponse({ ok: true, stripped, totalRemoved: removedStack.length });
        return true;
      }
      if (msg.action === "TOGGLE_ZAP") {
        zapBtn.click();
        sendResponse({ ok: true, zapMode, totalRemoved: removedStack.length });
        return true;
      }
      if (msg.action === "UNDO") {
        const rem = undoLast();
        sendResponse({ ok: true, totalRemoved: rem });
        return true;
      }
      if (msg.action === "SCALE_FONT") {
        fontScale = Number(msg.scale) || 100;
        document.documentElement.style.fontSize = fontScale + "%";
        sendResponse({ ok: true, fontScale });
        return true;
      }
    }
  });
})();
