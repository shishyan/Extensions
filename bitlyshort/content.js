(() => {
  if (document.getElementById("bitlyshort-pill")) return;

  const TRACKING_PARAMS = [
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "msclkid", "mc_cid", "mc_eid", "_ga", "_gl", "igshid", "si", "ref"
  ];

  function sanitizeUrl(rawUrl) {
    try {
      const u = new URL(rawUrl || window.location.href);
      let removed = 0;
      TRACKING_PARAMS.forEach((p) => {
        if (u.searchParams.has(p)) {
          u.searchParams.delete(p);
          removed++;
        }
      });
      return { cleanUrl: u.toString(), removedCount: removed };
    } catch (e) {
      return { cleanUrl: rawUrl || window.location.href, removedCount: 0 };
    }
  }

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
          const bit = ((hash >>> ((r * size + c) % 28)) ^ (r * 31 + c * 17 + text.charCodeAt((r + c) % text.length))) & 1;
          dark = bit === 1;
        }
        if (dark) {
          rects.push(`<rect x="${c * 6}" y="${r * 6}" width="6" height="6" fill="#0f172a"/>`);
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size * 6} ${size * 6}" width="126" height="126" style="background:#ffffff;padding:6px;border-radius:8px;">${rects.join("")}</svg>`;
  }

  const pill = document.createElement("div");
  pill.id = "bitlyshort-pill";
  pill.innerHTML = `
    <button type="button" id="bitlyshort-copy-btn">🔗 Copy Clean URL + QR</button>
    <div id="bitlyshort-qr-popover" style="display:none;"></div>
  `;
  document.body.appendChild(pill);

  const btn = document.getElementById("bitlyshort-copy-btn");
  const pop = document.getElementById("bitlyshort-qr-popover");

  btn.addEventListener("click", () => {
    const res = sanitizeUrl(window.location.href);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(res.cleanUrl).catch(() => {});
    }
    pop.innerHTML = makeSvgQr(res.cleanUrl);
    pop.style.display = pop.style.display === "none" ? "block" : "none";
    btn.textContent = `✓ Clean URL (${res.removedCount} trackers stripped)`;
    setTimeout(() => {
      btn.textContent = "🔗 Copy Clean URL + QR";
    }, 1800);
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "BITLYSHORT_ANALYZE") {
      const res = sanitizeUrl(window.location.href);
      sendResponse({
        ok: true,
        rawUrl: window.location.href,
        cleanUrl: res.cleanUrl,
        removedCount: res.removedCount,
        svgQr: makeSvgQr(res.cleanUrl)
      });
      return true;
    }
  });
})();
