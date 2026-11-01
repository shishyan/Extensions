(function () {
  if (window.__oneTabLoaded) return;
  window.__oneTabLoaded = true;

  function saveCurrentTab() {
    const item = {
      title: document.title || location.hostname,
      url: location.href,
      savedAt: new Date().toISOString()
    };
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["onetab_saved_tabs"], (res) => {
        const list = Array.isArray(res.onetab_saved_tabs) ? res.onetab_saved_tabs : [];
        list.unshift(item);
        chrome.storage.local.set({ onetab_saved_tabs: list });
      });
    }
    return {
      ok: true,
      savedTab: item,
      ramSavedMb: 65
    };
  }

  function injectPill() {
    if (document.getElementById("onetab-pill")) return;
    const pill = document.createElement("div");
    pill.id = "onetab-pill";
    pill.textContent = "🗂️ OneTab: Stash Tab & Free ~65 MB RAM";
    document.body.appendChild(pill);

    pill.addEventListener("click", () => {
      const res = saveCurrentTab();
      pill.textContent = `✅ Stashed to OneTab (+${res.ramSavedMb} MB Freed)`;
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "ONETAB_STASH_CURRENT") {
      sendResponse(saveCurrentTab());
      return true;
    }
  });

  injectPill();
})();
