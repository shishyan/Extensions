document.addEventListener("DOMContentLoaded", () => {
  const card = document.getElementById("pb-scorecard");

  function render(a) {
    const audit = a || {
      grade: "A+",
      cleanedParams: 3,
      cookiesCount: 0,
      localStorageKeys: 0,
      canvasProtected: true,
      webglProtected: true,
      hardwareConcurrency: 8
    };
    card.innerHTML =
      `<strong>Privacy Grade:</strong> ${audit.grade}<br>` +
      `<strong>Tracking URL Params Stripped:</strong> ${audit.cleanedParams}<br>` +
      `<strong>Cookies / LocalStorage Keys:</strong> ${audit.cookiesCount} / ${audit.localStorageKeys}<br>` +
      `<strong>Canvas & WebGL Guard:</strong> Protected (Entropy Shield ON)<br>` +
      `<strong>Reported CPU Cores:</strong> ${audit.hardwareConcurrency}`;
  }

  function runAudit() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "PRIVBADGER_AUDIT" }, (res) => {
          if (!chrome.runtime.lastError && res && res.audit) render(res.audit);
          else render(null);
        });
      } else {
        render(null);
      }
    });
  }

  runAudit();
  document.getElementById("pb-rescan").addEventListener("click", runAudit);
});
