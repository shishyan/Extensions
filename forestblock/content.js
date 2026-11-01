(function () {
  if (window.__forestBlockLoaded) return;
  window.__forestBlockLoaded = true;

  let blockedDomains = ["tiktok.com", "instagram.com", "reddit.com"];
  let treesPlanted = 14;

  function renderFullFocusShieldModal(host) {
    if (document.getElementById("forestblock-modal-overlay")) return;
    const modal = document.createElement("div");
    modal.id = "forestblock-modal-overlay";
    modal.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:rgba(6,78,59,0.96);color:#ecfdf5;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui,sans-serif;text-align:center;padding:24px;";
    modal.innerHTML = `
      <div style="font-size:48px;margin-bottom:10px;">🌲🌳🌲</div>
      <h1 style="margin:0 0 8px;font-size:24px;color:#4ade80;">ForestBlock Deep-Work Shield Active</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#a7f3d0;max-width:460px;">
        <strong>${host || "This distraction domain"}</strong> is blocked while your focus tree is growing (${treesPlanted} trees planted).
      </p>
      <button id="fb-dismiss-shield" style="background:#10b981;color:#022c22;border:none;border-radius:8px;padding:10px 18px;font-weight:800;cursor:pointer;">Return to Deep Work (Dismiss Preview)</button>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#fb-dismiss-shield").addEventListener("click", () => modal.remove());
  }

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
      <span class="fb-pill" id="fb-test-block-btn" style="cursor:pointer;">🌱 +1 Focus Tree</span>
    `;
    const target = document.querySelector("main") || document.body;
    target.prepend(shield);

    if (isBlocked) {
      renderFullFocusShieldModal(host);
    }
  }

  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get({ forestblock_domains: blockedDomains, forestblock_trees: 14 }, (res) => {
      if (Array.isArray(res.forestblock_domains)) blockedDomains = res.forestblock_domains;
      if (typeof res.forestblock_trees === "number") treesPlanted = res.forestblock_trees;
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "FOREST_PLANT_TREE") {
      treesPlanted++;
      if (Array.isArray(msg.domains) && msg.domains.length) {
        blockedDomains = msg.domains;
      }
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ forestblock_domains: blockedDomains, forestblock_trees: treesPlanted });
      }
      const st = document.getElementById("fb-status");
      if (st) st.innerHTML = `🌲 <strong>ForestBlock Deep-Work Shield</strong> — Productive Session Active (${treesPlanted} Trees Planted)`;
      if (msg.enforceOverlay) {
        renderFullFocusShieldModal(location.hostname || "distraction-site.com");
      }
      sendResponse({ ok: true, treesPlanted, blockedDomains });
      return true;
    }
  });

  injectShield();
})();
