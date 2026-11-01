document.addEventListener("DOMContentLoaded", () => {
  const hostBadge = document.getElementById("hostBadge");
  const cssEditor = document.getElementById("cssEditor");
  const statusMsg = document.getElementById("statusMsg");

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = btn.getAttribute("data-preset");
      if (chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "STYLUSCSS_APPLY", preset }, (res) => {
              if (res && res.ok) {
                cssEditor.value = res.css || "";
                statusMsg.textContent = `✓ Applied theme: ${preset}!`;
              }
            });
          }
        });
      }
    });
  });

  document.getElementById("applyCssBtn").addEventListener("click", () => {
    const css = cssEditor.value;
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "STYLUSCSS_APPLY", css }, (res) => {
            if (res && res.ok) {
              statusMsg.textContent = `✓ Saved & injected ${css.length} bytes of custom CSS!`;
            }
          });
        }
      });
    }
  });

  document.getElementById("exportStylesBtn").addEventListener("click", () => {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(null, (all) => {
        const styles = {};
        Object.keys(all || {}).forEach((k) => {
          if (k.startsWith("styluscss_")) styles[k.replace("styluscss_", "")] = all[k];
        });
        const json = JSON.stringify({ exportedAt: new Date().toISOString(), domainStyles: styles }, null, 2);
        cssEditor.value = json;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(json).catch(() => {});
        }
        statusMsg.textContent = `✓ Exported ${Object.keys(styles).length} saved domain stylesheet(s) to JSON!`;
      });
    }
  });

  document.getElementById("resetCssBtn").addEventListener("click", () => {
    cssEditor.value = "";
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "STYLUSCSS_APPLY", css: "" }, () => {
            statusMsg.textContent = "✓ Cleared custom domain CSS.";
          });
        }
      });
    }
  });

  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "STYLUSCSS_GET" }, (res) => {
          if (res && res.ok) {
            hostBadge.textContent = res.host || "localhost";
            if (res.css) cssEditor.value = res.css;
          }
        });
      }
    });
  }
});