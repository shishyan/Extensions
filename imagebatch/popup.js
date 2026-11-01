document.addEventListener("DOMContentLoaded", () => {
  let allImages = [
    { url: "https://gurukuladesam.org/assets/hero-banner.png", width: 1200, height: 630, format: "PNG", alt: "Hero Banner" },
    { url: "https://gurukuladesam.org/assets/diagram.svg", width: 512, height: 512, format: "SVG", alt: "Architecture Diagram" }
  ];

  const countBadge = document.getElementById("countBadge");
  const formatFilter = document.getElementById("formatFilter");
  const minWidthInput = document.getElementById("minWidthInput");
  const minHeightInput = document.getElementById("minHeightInput");
  const urlsOutput = document.getElementById("urlsOutput");
  const statusMsg = document.getElementById("statusMsg");

  function getFiltered() {
    const fmt = formatFilter.value;
    const minW = Number(minWidthInput.value) || 0;
    const minH = Number(minHeightInput.value) || 0;
    return allImages.filter((img) => {
      if (fmt !== "ALL" && img.format !== fmt) return false;
      if (img.width < minW || img.height < minH) return false;
      return true;
    });
  }

  function render() {
    const list = getFiltered();
    countBadge.textContent = `${list.length} Found`;
    urlsOutput.value = list.map((i) => `[${i.format} ${i.width}x${i.height}] ${i.url}`).join("\n");
  }

  render();
  [formatFilter, minWidthInput, minHeightInput].forEach((el) => el.addEventListener("input", render));

  document.getElementById("copyUrlsBtn").addEventListener("click", () => {
    const list = getFiltered();
    const raw = list.map((i) => i.url).join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(raw).catch(() => {});
    }
    statusMsg.textContent = `✓ Copied ${list.length} image URLs!`;
  });

  document.getElementById("exportSheetBtn").addEventListener("click", () => {
    const list = getFiltered();
    const html = "<!-- HTML Contact Sheet -->\n" + list.map((i) => `<figure><img src="${i.url}" width="${i.width}" height="${i.height}" alt="${i.alt}"><figcaption>${i.format} (${i.width}x${i.height})</figcaption></figure>`).join("\n");
    urlsOutput.value = html;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(html).catch(() => {});
    }
    try {
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "imagebatch-contact-sheet.html";
      a.click();
      URL.revokeObjectURL(url);
    } catch (_) {}
    statusMsg.textContent = "✓ Generated & downloaded HTML Contact Sheet!";
  });

  document.getElementById("downloadAllBtn").addEventListener("click", () => {
    const list = getFiltered();
    list.slice(0, 10).forEach((img, idx) => {
      try {
        const a = document.createElement("a");
        a.href = img.url;
        a.download = `image-${idx + 1}.${(img.format || "png").toLowerCase()}`;
        a.click();
      } catch (_) {}
    });
    statusMsg.textContent = `✓ Triggered batch download for ${list.length} image assets!`;
  });

  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "IMAGEBATCH_SCAN" }, (res) => {
          if (res && res.ok && Array.isArray(res.images)) {
            allImages = res.images;
            render();
          }
        });
      }
    });
  }
});
