(function () {
  if (window.__glaspNotesLoaded) return;
  window.__glaspNotesLoaded = true;

  let cachedSelectionText = "";
  let cachedRange = null;

  function ensureUI() {
    if (!document.getElementById("glaspnotes-palette")) {
      const palette = document.createElement("div");
      palette.id = "glaspnotes-palette";
      palette.innerHTML = `
        <span class="gn-swatch" data-color="yellow" title="Highlight Yellow"></span>
        <span class="gn-swatch" data-color="emerald" title="Highlight Emerald"></span>
        <span class="gn-swatch" data-color="sky" title="Highlight Sky"></span>
        <span class="gn-swatch" data-color="rose" title="Highlight Rose"></span>
        <button class="gn-note-btn" id="gn-add-note-btn">+ Add Note</button>
      `;
      document.body.appendChild(palette);

      palette.querySelectorAll(".gn-swatch").forEach((sw) => {
        sw.addEventListener("mousedown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const color = sw.getAttribute("data-color") || "yellow";
          applyHighlight(cachedSelectionText, color, "", cachedRange);
          palette.style.display = "none";
        });
      });

      const noteBtn = palette.querySelector("#gn-add-note-btn");
      noteBtn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openNoteModal(palette.style.left, palette.style.top);
        palette.style.display = "none";
      });
    }

    if (!document.getElementById("glaspnotes-note-modal")) {
      const modal = document.createElement("div");
      modal.id = "glaspnotes-note-modal";
      modal.innerHTML = `
        <div style="font-size:11px;font-weight:700;color:#6ee7b7;margin-bottom:5px;">📝 GlaspNotes Margin Note</div>
        <textarea id="gn-note-input" placeholder="Write your key insight or margin note..."></textarea>
        <div class="gn-modal-actions">
          <button id="gn-note-cancel" style="background:#334155;color:#f8fafc;">Cancel</button>
          <button id="gn-note-save">Save Highlight + Note</button>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector("#gn-note-cancel").addEventListener("click", () => {
        modal.style.display = "none";
      });

      modal.querySelector("#gn-note-save").addEventListener("click", () => {
        const noteText = modal.querySelector("#gn-note-input").value.trim();
        applyHighlight(cachedSelectionText, "emerald", noteText, cachedRange);
        modal.querySelector("#gn-note-input").value = "";
        modal.style.display = "none";
      });
    }
  }

  function openNoteModal(left, top) {
    ensureUI();
    const modal = document.getElementById("glaspnotes-note-modal");
    modal.style.left = left || "120px";
    modal.style.top = top || "120px";
    modal.style.display = "block";
    const inp = modal.querySelector("#gn-note-input");
    if (inp) inp.focus();
  }

  function highlightTextInDOM(quoteText, color, note) {
    if (!quoteText || quoteText.length < 3) return false;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
        const tag = node.parentElement.tagName;
        if (["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "MARK"].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (node.nodeValue && node.nodeValue.includes(quoteText)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    });

    const targetNode = walker.nextNode();
    if (!targetNode) return false;

    const idx = targetNode.nodeValue.indexOf(quoteText);
    if (idx === -1) return false;

    const range = document.createRange();
    range.setStart(targetNode, idx);
    range.setEnd(targetNode, idx + quoteText.length);

    const mark = document.createElement("mark");
    mark.className = "glaspnotes-mark";
    mark.setAttribute("data-color", color || "yellow");
    if (note) {
      mark.setAttribute("title", `Note: ${note}`);
      mark.setAttribute("data-note", note);
    }
    try {
      range.surroundContents(mark);
      return true;
    } catch (_) {
      return false;
    }
  }

  function applyHighlight(text, color, note, rangeObj) {
    const cleanText = (text || "").trim();
    if (!cleanText) return null;

    let wrapped = false;
    if (rangeObj) {
      try {
        const mark = document.createElement("mark");
        mark.className = "glaspnotes-mark";
        mark.setAttribute("data-color", color || "yellow");
        if (note) {
          mark.setAttribute("title", `Note: ${note}`);
          mark.setAttribute("data-note", note);
        }
        rangeObj.surroundContents(mark);
        wrapped = true;
      } catch (_) {
        wrapped = false;
      }
    }
    if (!wrapped) {
      highlightTextInDOM(cleanText, color || "yellow", note || "");
    }

    const item = {
      id: "gn_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      text: cleanText,
      color: color || "yellow",
      note: note || "",
      url: location.href,
      title: document.title || location.hostname,
      createdAt: new Date().toISOString()
    };

    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["glaspnotes_items"], (res) => {
        const list = Array.isArray(res.glaspnotes_items) ? res.glaspnotes_items : [];
        list.unshift(item);
        chrome.storage.local.set({ glaspnotes_items: list });
      });
    }
    return item;
  }

  function restoreHighlights() {
    if (!chrome.storage || !chrome.storage.local) return;
    chrome.storage.local.get(["glaspnotes_items"], (res) => {
      const list = Array.isArray(res.glaspnotes_items) ? res.glaspnotes_items : [];
      list
        .filter((it) => it.url === location.href)
        .forEach((it) => {
          highlightTextInDOM(it.text, it.color, it.note);
        });
    });
  }

  document.addEventListener("mouseup", (e) => {
    ensureUI();
    const palette = document.getElementById("glaspnotes-palette");
    if (palette && palette.contains(e.target)) return;

    const sel = window.getSelection();
    const txt = sel ? sel.toString().trim() : "";
    if (txt.length >= 3 && sel.rangeCount > 0) {
      cachedSelectionText = txt;
      cachedRange = sel.getRangeAt(0).cloneRange();
      const rect = cachedRange.getBoundingClientRect();
      palette.style.left = `${Math.max(12, Math.min(window.innerWidth - 220, rect.left + rect.width / 2 - 90))}px`;
      palette.style.top = `${Math.max(12, rect.top - 42)}px`;
      palette.style.display = "flex";
    } else if (palette) {
      palette.style.display = "none";
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "GLASP_HIGHLIGHT_TEXT") {
      ensureUI();
      const item = applyHighlight(msg.text, msg.color || "yellow", msg.note || "", null);
      sendResponse({ ok: true, item, markCount: document.querySelectorAll("mark.glaspnotes-mark").length });
      return true;
    }
    if (msg && msg.type === "GLASP_GET_PAGE_HIGHLIGHTS") {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["glaspnotes_items"], (res) => {
          const all = Array.isArray(res.glaspnotes_items) ? res.glaspnotes_items : [];
          sendResponse({
            url: location.href,
            title: document.title,
            items: all
          });
        });
        return true;
      }
      sendResponse({ url: location.href, title: document.title, items: [] });
      return true;
    }
  });

  ensureUI();
  restoreHighlights();
})();
