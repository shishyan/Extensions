(() => {
  if (document.getElementById("styluscss-pill")) return;

  const PRESET_THEMES = {
    "Cozy Reading Mode": "body, main, article { background: #fdf6e3 !important; color: #3c3836 !important; line-height: 1.75 !important; font-family: Georgia, serif !important; }",
    "Neon Cyberpunk": "body { background: #090d16 !important; color: #00ffcc !important; } h1, h2, h3, a { color: #ff2a85 !important; text-shadow: 0 0 8px rgba(255,42,133,0.45) !important; }",
    "Hide Distractions / Sidebars": "aside, .sidebar, .ad-banner, [role='complementary'], iframe { display: none !important; }",
    "Ultra-Wide Fullscreen": "main, article, .container, .content { max-width: 98vw !important; width: 98vw !important; margin: 0 auto !important; }"
  };

  const presetNames = Object.keys(PRESET_THEMES);
  let presetIndex = 0;

  let styleEl = document.getElementById("styluscss-injected-style");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "styluscss-injected-style";
    document.head.appendChild(styleEl);
  }

  function applyCssRule(cssText, themeName = "Custom CSS") {
    styleEl.textContent = cssText || "";
    const host = window.location.hostname || "localhost";
    try {
      chrome.storage.local.get({ styluscss_rules: {} }, (data) => {
        const rules = data.styluscss_rules || {};
        rules[host] = { css: cssText, themeName, updatedAt: Date.now() };
        chrome.storage.local.set({ styluscss_rules: rules });
      });
    } catch (e) {}
    return { host, themeName, length: (cssText || "").length };
  }

  try {
    const host = window.location.hostname || "localhost";
    chrome.storage.local.get({ styluscss_rules: {} }, (data) => {
      if (data && data.styluscss_rules && data.styluscss_rules[host]) {
        styleEl.textContent = data.styluscss_rules[host].css || "";
      }
    });
  } catch (e) {}

  const pill = document.createElement("div");
  pill.id = "styluscss-pill";
  pill.innerHTML = `
    <span class="sc-brand">🎨 StylusCSS</span>
    <button type="button" id="styluscss-cycle-btn">Switch Theme</button>
  `;
  document.body.appendChild(pill);

  const cycleBtn = document.getElementById("styluscss-cycle-btn");
  cycleBtn.addEventListener("click", () => {
    const name = presetNames[presetIndex % presetNames.length];
    presetIndex++;
    applyCssRule(PRESET_THEMES[name], name);
    cycleBtn.textContent = `✓ ${name.split(" ")[0]}`;
    setTimeout(() => {
      cycleBtn.textContent = "Switch Theme";
    }, 1500);
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "STYLUSCSS_APPLY") {
      const css = msg.preset ? (PRESET_THEMES[msg.preset] || msg.css || "") : (msg.css || "");
      const res = applyCssRule(css, msg.preset || "Custom CSS");
      sendResponse({ ok: true, applied: res, css });
      return true;
    }
    if (msg && msg.type === "STYLUSCSS_GET") {
      sendResponse({
        ok: true,
        host: window.location.hostname || "localhost",
        css: styleEl.textContent || "",
        presets: presetNames
      });
      return true;
    }
  });
})();
