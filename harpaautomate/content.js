/**
 * HarpaAutomate — Content Script
 * Visual DOM Element Picker for Price/Text Change Monitoring +
 * 1-Click Structured Data Extractor (Tables, Lists, JSON-LD) +
 * Pre-Built Automation Macros (SEO Audit, Price/Currency Scanner, Links Extractor)
 */

(() => {
  "use strict";

  let pickerActive = false;
  let hoveredEl = null;

  function computeSelector(el) {
    if (!el || !el.tagName) return "body";
    if (el.id) return `#${el.id}`;
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).filter((c) => c && !c.startsWith("harpa-")) : [];
    if (cls.length > 0) return `${el.tagName.toLowerCase()}.${cls.slice(0, 2).join(".")}`;
    return el.tagName.toLowerCase();
  }

  function extractMacroData(macro) {
    if (macro === "seo") {
      const title = document.title || "";
      const metaDesc = document.querySelector("meta[name='description']")?.getAttribute("content") || "None";
      const canonical = document.querySelector("link[rel='canonical']")?.getAttribute("href") || location.href;
      const h1s = Array.from(document.querySelectorAll("h1")).map((h) => (h.innerText || "").trim()).filter(Boolean);
      const h2s = Array.from(document.querySelectorAll("h2")).map((h) => (h.innerText || "").trim()).filter(Boolean);
      return {
        macro: "seo",
        summary: `Title (${title.length}c) • ${h1s.length} H1s • ${h2s.length} H2s`,
        rows: [
          { field: "Page Title", value: title },
          { field: "Meta Description", value: metaDesc },
          { field: "Canonical URL", value: canonical },
          { field: "H1 Headings", value: h1s.join(" | ") || "None" },
          { field: "Top H2 Headings", value: h2s.slice(0, 6).join(" | ") || "None" }
        ]
      };
    }

    if (macro === "prices") {
      const bodyText = (document.body && (document.body.innerText || document.body.textContent)) || "";
      const priceRegex = /(?:USD|\$|€|£|₹)\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g;
      const matches = Array.from(new Set(bodyText.match(priceRegex) || []));
      return {
        macro: "prices",
        summary: `Detected ${matches.length} price/currency token(s) on page`,
        rows: matches.length
          ? matches.slice(0, 20).map((p, idx) => ({ index: idx + 1, price: p, url: location.href }))
          : [{ index: 1, price: "No currency tokens detected on this page", url: location.href }]
      };
    }

    if (macro === "tables") {
      const tables = Array.from(document.querySelectorAll("table"));
      const jsonLd = Array.from(document.querySelectorAll("script[type='application/ld+json']")).map((s) => s.textContent.trim());
      const rows = [];
      tables.slice(0, 5).forEach((tb, tIdx) => {
        Array.from(tb.querySelectorAll("tr")).slice(0, 10).forEach((tr) => {
          const cells = Array.from(tr.querySelectorAll("th, td")).map((c) => (c.innerText || "").trim());
          if (cells.length) rows.push({ source: `Table #${tIdx + 1}`, data: cells.join(" | ") });
        });
      });
      if (rows.length === 0) {
        Array.from(document.querySelectorAll("ul li, ol li")).slice(0, 12).forEach((li, idx) => {
          const t = (li.innerText || "").trim();
          if (t) rows.push({ source: `List Item #${idx + 1}`, data: t.slice(0, 140) });
        });
      }
      return {
        macro: "tables",
        summary: `${tables.length} Table(s) • ${jsonLd.length} JSON-LD block(s) • ${rows.length} structured rows`,
        rows: rows.length ? rows : [{ source: "Document", data: document.title || location.href }]
      };
    }

    // Default: links macro
    const links = Array.from(document.querySelectorAll("a[href]"))
      .map((a) => ({
        text: (a.innerText || a.textContent || "").trim().slice(0, 60) || "(Anchor)",
        href: a.href
      }))
      .filter((x) => /^https?:/i.test(x.href));

    return {
      macro: "links",
      summary: `Extracted ${links.length} HTTP/HTTPS link(s)`,
      rows: links.slice(0, 25)
    };
  }

  function enablePicker() {
    pickerActive = true;
    if (pill) pill.textContent = "🎯 Click any element to Watch…";
  }

  function disablePicker() {
    pickerActive = false;
    if (hoveredEl) {
      hoveredEl.classList.remove("harpa-hover-outline");
      hoveredEl = null;
    }
    if (pill) pill.textContent = "⚙️ Harpa Watch";
  }

  document.addEventListener("mousemove", (e) => {
    if (!pickerActive) return;
    if (pill && pill.contains(e.target)) return;
    if (hoveredEl && hoveredEl !== e.target) {
      hoveredEl.classList.remove("harpa-hover-outline");
    }
    hoveredEl = e.target;
    if (hoveredEl && hoveredEl.classList) {
      hoveredEl.classList.add("harpa-hover-outline");
    }
  });

  document.addEventListener(
    "click",
    (e) => {
      if (!pickerActive) return;
      if (pill && pill.contains(e.target)) return;
      e.preventDefault();
      e.stopPropagation();

      const el = e.target;
      const selector = computeSelector(el);
      const value = ((el.innerText || el.textContent || el.value || "").trim()).slice(0, 140) || selector;

      disablePicker();

      chrome.runtime.sendMessage(
        {
          type: "HARPA_ADD_MONITOR",
          url: location.href,
          title: document.title || location.hostname,
          selector,
          value
        },
        () => {
          if (pill) {
            pill.textContent = `✅ Watching ${selector}`;
            setTimeout(() => {
              pill.textContent = "⚙️ Harpa Watch";
            }, 1800);
          }
        }
      );
    },
    true
  );

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "HARPA_START_PICKER") {
      enablePicker();
      sendResponse({ ok: true });
      return false;
    }
    if (msg && msg.type === "HARPA_RUN_MACRO") {
      const result = extractMacroData(msg.macro || "seo");
      sendResponse({ ok: true, ...result });
      return false;
    }
  });

  if (!document.body) return;

  let pill = document.getElementById("harpaautomate-pill");
  if (!pill) {
    pill = document.createElement("div");
    pill.id = "harpaautomate-pill";
    pill.className = "harpa-floating-pill";
    pill.title = "HarpaAutomate: Click to select any page element or price to monitor";
    pill.textContent = "⚙️ Harpa Watch";
    pill.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (pickerActive) disablePicker();
      else enablePicker();
    });
    document.body.appendChild(pill);
  }
})();
