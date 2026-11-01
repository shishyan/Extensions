document.addEventListener("DOMContentLoaded", () => {
  const removedBadge = document.getElementById("removedBadge");
  const scaleLabel = document.getElementById("scaleLabel");
  const fontScaleInput = document.getElementById("fontScaleInput");
  const statusMsg = document.getElementById("statusMsg");

  function sendToPage(payload, cb) {
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, payload, (res) => {
            if (cb) cb(res);
          });
        }
      });
    }
  }

  document.getElementById("toggleZapBtn").addEventListener("click", () => {
    sendToPage({ type: "PRINTCLEAN_ACTION", action: "TOGGLE_ZAP" }, (res) => {
      if (res && res.ok) {
        removedBadge.textContent = `${res.totalRemoved || 0} Zapped`;
        statusMsg.textContent = res.zapMode ? "🗑️ Zap Mode active: click any page element!" : "Zap Mode paused.";
      }
    });
  });

  document.getElementById("stripClutterBtn").addEventListener("click", () => {
    sendToPage({ type: "PRINTCLEAN_ACTION", action: "STRIP_CLUTTER" }, (res) => {
      if (res && res.ok) {
        removedBadge.textContent = `${res.totalRemoved || 0} Zapped`;
        statusMsg.textContent = `✓ Stripped ${res.stripped || 0} clutter containers!`;
      }
    });
  });

  document.getElementById("undoZapBtn").addEventListener("click", () => {
    sendToPage({ type: "PRINTCLEAN_ACTION", action: "UNDO" }, (res) => {
      if (res && res.ok) {
        removedBadge.textContent = `${res.totalRemoved || 0} Zapped`;
        statusMsg.textContent = "↩ Restored last removed element.";
      }
    });
  });

  fontScaleInput.addEventListener("input", () => {
    scaleLabel.textContent = fontScaleInput.value + "%";
    sendToPage({ type: "PRINTCLEAN_ACTION", action: "SCALE_FONT", scale: Number(fontScaleInput.value) });
  });

  document.getElementById("printPdfBtn").addEventListener("click", () => {
    sendToPage({ type: "PRINTCLEAN_ACTION", action: "PRINT_NOW" }, () => {});
    statusMsg.textContent = "🖨️ Clean Print / PDF dialog triggered!";
  });
});
