(() => {
  if (document.getElementById("imagebatch-pill")) return;

  function detectFormat(url) {
    const lower = (url || "").toLowerCase();
    if (lower.includes(".svg") || lower.startsWith("data:image/svg")) return "SVG";
    if (lower.includes(".webp")) return "WEBP";
    if (lower.includes(".jpg") || lower.includes(".jpeg")) return "JPG";
    return "PNG";
  }

  function scanAllImages() {
    const items = [];
    const seen = new Set();

    function pushItem(url, w, h, alt, fmt) {
      if (!url || seen.has(url)) return;
      seen.add(url);
      items.push({
        url,
        width: w || 256,
        height: h || 256,
        alt: alt || "Image Asset",
        format: fmt || detectFormat(url)
      });
    }

    document.querySelectorAll("img").forEach((img) => {
      const src = img.currentSrc || img.getAttribute("src") || "";
      pushItem(src, img.naturalWidth || img.width || 320, img.naturalHeight || img.height || 240, img.alt || "DOM Image", detectFormat(src));
    });

    document.querySelectorAll("picture source[srcset]").forEach((s) => {
      const raw = (s.getAttribute("srcset") || "").split(",")[0].trim().split(" ")[0];
      pushItem(raw, 640, 480, "Picture Source", detectFormat(raw));
    });

    document.querySelectorAll("svg").forEach((svg, idx) => {
      const xml = new XMLSerializer().serializeToString(svg);
      const dataUri = "data:image/svg+xml;utf8," + encodeURIComponent(xml);
      const rect = svg.getBoundingClientRect();
      pushItem(dataUri, Math.round(rect.width) || 128, Math.round(rect.height) || 128, `Inline SVG #${idx + 1}`, "SVG");
    });

    document.querySelectorAll("*").forEach((el) => {
      const bg = window.getComputedStyle(el).backgroundImage;
      if (bg && bg.startsWith("url(")) {
        const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
        if (match && match[1]) {
          pushItem(match[1], el.clientWidth || 400, el.clientHeight || 300, "CSS Background", detectFormat(match[1]));
        }
      }
    });

    return items;
  }

  const initial = scanAllImages();
  const pill = document.createElement("div");
  pill.id = "imagebatch-pill";
  pill.innerHTML = `
    <span id="imagebatch-label">🖼️ ImageBatch: ${initial.length} Images Found</span>
    <button type="button" id="imagebatch-copy-btn">Copy URLs</button>
  `;
  document.body.appendChild(pill);

  const copyBtn = document.getElementById("imagebatch-copy-btn");
  copyBtn.addEventListener("click", () => {
    const list = scanAllImages();
    const urls = list.map(i => i.url).join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(urls).catch(() => {});
    }
    copyBtn.textContent = `✓ Copied ${list.length}!`;
    setTimeout(() => {
      copyBtn.textContent = "Copy URLs";
    }, 1500);
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "IMAGEBATCH_SCAN") {
      const list = scanAllImages();
      const label = document.getElementById("imagebatch-label");
      if (label) label.textContent = `🖼️ ImageBatch: ${list.length} Images Found`;
      sendResponse({ ok: true, count: list.length, images: list });
      return true;
    }
  });
})();
