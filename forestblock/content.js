(function () {
  if (window.__forestBlockLoaded) return;
  window.__forestBlockLoaded = true;

  let blockedDomains = ["tiktok.com", "instagram.com", "reddit.com"];
  let treesPlanted = 14;

  function injectShield() {
    if (document.getElementById("forestblock-shield")) return;
    const host = (location.hostname || "").toLowerCase();
    const isBlocked = blockedDomains.some((d) => host.includes(d));

    const shield = document.createElement("div");
    shield.id = "forestblock-shield";
    shield.innerHTML = `
      <div id="fb-status">
        🌲 <strong>ForestBlock Deep-Work Shield</strong> — ${isBlocked ? "⛔ Distraction Domain Blocked" : "Productive Session Active"} (${treesPlanted} Trees Planted)
      </div>
      <span class="fb-pill">🌱 +1 Focus Tree</span>
    `;
    const target = document.querySelector("main") || document.body;
    target.prepend(shield);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "FOREST_PLANT_TREE") {
      treesPlanted++;
      const st = document.getElementById("fb-status");
      if (st) st.innerHTML = `🌲 <strong>ForestBlock Deep-Work Shield</strong> — Productive Session Active (${treesPlanted} Trees Planted)`;
      sendResponse({ ok: true, treesPlanted, blockedDomains });
      return true;
    }
  });

  injectShield();
})();
