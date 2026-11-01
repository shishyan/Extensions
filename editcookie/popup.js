document.addEventListener("DOMContentLoaded", () => {
  const out = document.getElementById("ec-output");
  let latestSnapshot = {
    host: "localhost",
    cookies: [{ name: "debug_session", value: "active_2026" }],
    localStorage: [{ key: "gkd_env", value: "development" }],
    sessionStorage: []
  };

  function render(data) {
    if (data) latestSnapshot = data;
    out.textContent = JSON.stringify(latestSnapshot, null, 2);
  }

  function toNetscapeFormat(snap) {
    const domain = snap.host || "localhost";
    const exp = Math.floor(Date.now() / 1000) + 86400 * 30;
    const lines = [
      "# Netscape HTTP Cookie File",
      "# https://curl.se/docs/http-cookies.html"
    ];
    (snap.cookies || []).forEach((c) => {
      lines.push(`${domain}\tTRUE\t/\tFALSE\t${exp}\t${c.name}\t${c.value}`);
    });
    return lines.join("\n");
  }

  function refreshFromTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "EDITCOOKIE_INSPECT" }, (res) => {
          if (!chrome.runtime.lastError && res && res.data) {
            render(res.data);
          } else {
            render(latestSnapshot);
          }
        });
      } else {
        render(latestSnapshot);
      }
    });
  }

  refreshFromTab();

  document.getElementById("ec-save-btn").addEventListener("click", () => {
    const target = document.getElementById("ec-target").value;
    const key = document.getElementById("ec-key").value.trim() || "key";
    const value = document.getElementById("ec-val").value.trim();

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "EDITCOOKIE_SET", target, key, value },
          (res) => {
            if (!chrome.runtime.lastError && res && res.data) {
              render(res.data);
            } else {
              if (target === "cookie") latestSnapshot.cookies.push({ name: key, value });
              else if (target === "sessionStorage") latestSnapshot.sessionStorage.push({ key, value });
              else latestSnapshot.localStorage.push({ key, value });
              render(latestSnapshot);
            }
          }
        );
      }
    });
  });

  document.getElementById("ec-del-btn").addEventListener("click", () => {
    const target = document.getElementById("ec-target").value;
    const key = document.getElementById("ec-key").value.trim();
    if (!key) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "EDITCOOKIE_DELETE_KEY", target, key }, (res) => {
          if (!chrome.runtime.lastError && res && res.data) {
            render(res.data);
          } else {
            latestSnapshot.cookies = (latestSnapshot.cookies || []).filter((c) => c.name !== key);
            latestSnapshot.localStorage = (latestSnapshot.localStorage || []).filter((x) => x.key !== key);
            render(latestSnapshot);
          }
        });
      }
    });
  });

  document.getElementById("ec-export-btn").addEventListener("click", () => {
    const json = JSON.stringify(latestSnapshot, null, 2);
    if (navigator.clipboard) navigator.clipboard.writeText(json).catch(() => {});
    out.textContent = "// Copied JSON Snapshot to Clipboard!\n" + json;
  });

  document.getElementById("ec-netscape-btn").addEventListener("click", () => {
    const txt = toNetscapeFormat(latestSnapshot);
    if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
    out.textContent = txt;
  });

  document.getElementById("ec-clear-btn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "EDITCOOKIE_CLEAR" }, (res) => {
          if (!chrome.runtime.lastError && res && res.data) {
            render(res.data);
          } else {
            render({ host: "localhost", cookies: [], localStorage: [], sessionStorage: [] });
          }
        });
      }
    });
  });
});
