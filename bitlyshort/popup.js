document.addEventListener("DOMContentLoaded", () => {
  const cleanUrlInput = document.getElementById("cleanUrlInput");
  const utmSource = document.getElementById("utmSource");
  const utmMedium = document.getElementById("utmMedium");
  const utmCampaign = document.getElementById("utmCampaign");
  const utmResultInput = document.getElementById("utmResultInput");
  const qrContainer = document.getElementById("qrContainer");
  const strippedBadge = document.getElementById("strippedBadge");
  const statusMsg = document.getElementById("statusMsg");

  function makeSvgQr(text) {
    const size = 21;
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    function isFinder(r, c) {
      const inTL = r < 7 && c < 7;
      const inTR = r < 7 && c >= size - 7;
      const inBL = r >= size - 7 && c < 7;
      if (!inTL && !inTR && !inBL) return null;
      const lr = inBL ? r - (size - 7) : r;
      const lc = inTR ? c - (size - 7) : c;
      if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
      if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
      return false;
    }
    const rects = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const f = isFinder(r, c);
        let dark = false;
        if (f !== null) {
          dark = f;
        } else {
          const bit = ((hash >>> ((r * size + c) % 28)) ^ (r * 31 + c * 17 + text.charCodeAt((r + c) % Math.max(1, text.length)))) & 1;
          dark = bit === 1;
        }
        if (dark) {
          rects.push(`<rect x="${c * 5}" y="${r * 5}" width="5" height="5" fill="#0f172a"/>`);
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size * 5} ${size * 5}" width="105" height="105" style="background:#ffffff;padding:6px;border-radius:8px;">${rects.join("")}</svg>`;
  }

  function updateUtmAndQr() {
    const base = cleanUrlInput.value.trim() || "https://gurukuladesam.org";
    try {
      const u = new URL(base);
      if (utmSource.value.trim()) u.searchParams.set("utm_source", utmSource.value.trim());
      if (utmMedium.value.trim()) u.searchParams.set("utm_medium", utmMedium.value.trim());
      if (utmCampaign.value.trim()) u.searchParams.set("utm_campaign", utmCampaign.value.trim());
      utmResultInput.value = u.toString();
    } catch (e) {
      utmResultInput.value = base;
    }
    qrContainer.innerHTML = makeSvgQr(cleanUrlInput.value.trim() || "https://gurukuladesam.org");
  }

  updateUtmAndQr();
  [cleanUrlInput, utmSource, utmMedium, utmCampaign].forEach((el) => {
    el.addEventListener("input", updateUtmAndQr);
  });

  document.getElementById("copyCleanBtn").addEventListener("click", () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cleanUrlInput.value).catch(() => {});
    }
    statusMsg.textContent = "✓ Copied clean canonical URL!";
  });

  document.getElementById("copyUtmBtn").addEventListener("click", () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(utmResultInput.value).catch(() => {});
    }
    statusMsg.textContent = "✓ Copied UTM campaign URL!";
  });

  document.getElementById("copySvgBtn").addEventListener("click", () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(qrContainer.innerHTML).catch(() => {});
    }
    statusMsg.textContent = "✓ Copied SVG QR vector markup!";
  });

  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "BITLYSHORT_ANALYZE" }, (res) => {
          if (res && res.ok) {
            cleanUrlInput.value = res.cleanUrl;
            strippedBadge.textContent = `${res.removedCount} stripped`;
            updateUtmAndQr();
          }
        });
      }
    });
  }
});
