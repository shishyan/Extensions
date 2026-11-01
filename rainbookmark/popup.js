document.addEventListener("DOMContentLoaded", () => {
  const out = document.getElementById("rb-output");
  const search = document.getElementById("rb-search");
  const folderSel = document.getElementById("rb-folder");

  function render() {
    const q = search.value.trim().toLowerCase();
    const folder = folderSel.value;
    chrome.runtime.sendMessage({ type: "RAINBOOKMARK_LIST" }, (res) => {
      const items = (res && res.items) || [];
      const filtered = items.filter((b) => {
        const matchQ = !q || b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q) || (b.tags || []).some((t) => t.toLowerCase().includes(q));
        const matchF = folder === "All" || (b.folder || "Engineering") === folder;
        return matchQ && matchF;
      });
      out.textContent =
        `Total Bookmarks: ${filtered.length} (Folder: ${folder})\n\n` +
        filtered
          .map((b, i) => `${i + 1}. [${b.folder || "Engineering"}] ${b.title}\n   ${b.url}\n   Tags: ${(b.tags || []).map((t) => "#" + t).join(" ")}`)
          .join("\n\n");
    });
  }

  search.addEventListener("input", render);
  folderSel.addEventListener("change", render);

  document.getElementById("rb-add").addEventListener("click", () => {
    const folder = folderSel.value === "All" ? "Engineering" : folderSel.value;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "RAINBOOKMARK_SAVE_PAGE", folder }, () => {
          setTimeout(render, 120);
        });
      }
    });
  });

  document.getElementById("rb-dedupe").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "RAINBOOKMARK_LIST" }, (res) => {
      const items = (res && res.items) || [];
      const seen = new Set();
      const unique = [];
      items.forEach((b) => {
        const norm = (b.url || "").replace(/\/+$/, "").toLowerCase();
        if (!seen.has(norm)) {
          seen.add(norm);
          unique.push(b);
        }
      });
      const removed = items.length - unique.length;
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ rainBookmarks: unique }, () => {
          out.textContent = `🧹 Deduplication Complete: Removed ${removed} duplicate URL(s). ${unique.length} unique bookmarks remain.`;
          setTimeout(render, 800);
        });
      }
    });
  });

  document.getElementById("rb-check").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "RAINBOOKMARK_LIST" }, (res) => {
      const items = (res && res.items) || [];
      const valid = items.filter((b) => /^https?:\/\//i.test(b.url || ""));
      out.textContent = `✓ Link Health Audit Complete:\n• Checked: ${items.length} bookmark(s)\n• Valid HTTPS/HTTP URLs: ${valid.length}\n• Broken / Invalid Scheme: ${items.length - valid.length}`;
    });
  });

  document.getElementById("rb-html").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "RAINBOOKMARK_EXPORT_HTML" }, (res) => {
      const html = (res && res.html) || "";
      out.textContent = html;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(html).catch(() => {});
      }
    });
  });

  document.getElementById("rb-json").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "RAINBOOKMARK_LIST" }, (res) => {
      const json = JSON.stringify((res && res.items) || [], null, 2);
      out.textContent = json;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json).catch(() => {});
      }
    });
  });

  render();
});