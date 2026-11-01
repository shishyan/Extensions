(function () {
  if (document.getElementById("editcookie-badge")) return;

  function parseCookies() {
    const raw = document.cookie || "";
    if (!raw.trim()) return [];
    return raw.split(";").map((pair) => {
      const idx = pair.indexOf("=");
      if (idx === -1) return { name: pair.trim(), value: "" };
      return {
        name: pair.slice(0, idx).trim(),
        value: pair.slice(idx + 1).trim()
      };
    });
  }

  function inspectStorage() {
    const cookies = parseCookies();
    const localItems = [];
    const sessionItems = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        localItems.push({ key: k, value: localStorage.getItem(k) });
      }
    } catch (e) {}
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        sessionItems.push({ key: k, value: sessionStorage.getItem(k) });
      }
    } catch (e) {}
    return {
      host: location.hostname || "localhost",
      cookies,
      localStorage: localItems,
      sessionStorage: sessionItems
    };
  }

  const badge = document.createElement("div");
  badge.id = "editcookie-badge";

  function renderBadge() {
    const info = inspectStorage();
    badge.innerHTML = `
      <span>🍪 EditCookie: ${info.cookies.length} Cookies · ${info.localStorage.length} Local · ${info.sessionStorage.length} Session</span>
      <button id="editcookie-seed-btn">+Dev Cookie</button>
    `;
    const btn = badge.querySelector("#editcookie-seed-btn");
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        document.cookie = "gkd_dev_debug=1; path=/";
        try {
          localStorage.setItem("gkd_env", "development");
        } catch (err) {}
        renderBadge();
      });
    }
  }

  document.documentElement.appendChild(badge);
  renderBadge();

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "EDITCOOKIE_INSPECT") {
      sendResponse({ ok: true, data: inspectStorage() });
    } else if (msg.type === "EDITCOOKIE_SET") {
      if (msg.target === "localStorage") {
        try {
          localStorage.setItem(msg.key, msg.value);
        } catch (e) {}
      } else if (msg.target === "sessionStorage") {
        try {
          sessionStorage.setItem(msg.key, msg.value);
        } catch (e) {}
      } else {
        document.cookie = `${encodeURIComponent(msg.key)}=${encodeURIComponent(msg.value)}; path=/`;
      }
      renderBadge();
      sendResponse({ ok: true, data: inspectStorage() });
    } else if (msg.type === "EDITCOOKIE_DELETE_KEY") {
      if (msg.target === "localStorage") {
        try { localStorage.removeItem(msg.key); } catch (e) {}
      } else if (msg.target === "sessionStorage") {
        try { sessionStorage.removeItem(msg.key); } catch (e) {}
      } else {
        document.cookie = `${encodeURIComponent(msg.key)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
      renderBadge();
      sendResponse({ ok: true, data: inspectStorage() });
    } else if (msg.type === "EDITCOOKIE_CLEAR") {
      parseCookies().forEach((c) => {
        document.cookie = `${c.name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      });
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}
      renderBadge();
      sendResponse({ ok: true, data: inspectStorage() });
    }
  });
})();
