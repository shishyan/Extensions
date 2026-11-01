(function () {
  if (window.__socialStatsLoaded) return;
  window.__socialStatsLoaded = true;

  let currentRpm = 4.5;

  function parseMetricsFromDOM() {
    const bodyText = document.body ? document.body.innerText : "";
    const viewMatch = bodyText.match(/([\d,.]+)\s*([KMB])?\s*views/i);
    let views = 148500;
    if (viewMatch) {
      let base = parseFloat(viewMatch[1].replace(/,/g, "")) || 148500;
      const mult = (viewMatch[2] || "").toUpperCase();
      if (mult === "K") base *= 1000;
      if (mult === "M") base *= 1000000;
      if (mult === "B") base *= 1000000000;
      views = Math.max(1000, Math.round(base));
    }

    const dailyViews = Math.max(850, Math.round(views * 0.085));
    const monthlyViews = dailyViews * 30;
    const yearlyViews = dailyViews * 365;

    let grade = "B+";
    if (monthlyViews > 5000000) grade = "A++";
    else if (monthlyViews > 1000000) grade = "A+";
    else if (monthlyViews > 250000) grade = "A";
    else if (monthlyViews > 50000) grade = "A-";

    const channelEl =
      document.querySelector("#channel-name a") ||
      document.querySelector("ytd-channel-name") ||
      document.querySelector("h1");
    const channelName = (channelEl && channelEl.textContent ? channelEl.textContent.trim() : document.title) || "Creator Channel";

    return {
      channelName: channelName.slice(0, 48),
      grade,
      views,
      dailyViews,
      monthlyViews,
      yearlyViews,
      rpm: currentRpm,
      monthlyRev: Math.round((monthlyViews / 1000) * currentRpm),
      yearlyRev: Math.round((yearlyViews / 1000) * currentRpm),
      proj30dSubs: Math.round(monthlyViews * 0.0042),
      proj365dSubs: Math.round(yearlyViews * 0.0042)
    };
  }

  function renderAuditCard() {
    const isTarget =
      location.pathname.includes("/watch") ||
      location.pathname.includes("/@") ||
      document.querySelector("#secondary") !== null ||
      document.querySelector("video") !== null;

    if (!isTarget) return;

    let card = document.getElementById("socialstats-card");
    if (!card) {
      card = document.createElement("div");
      card.id = "socialstats-card";
      const container =
        document.querySelector("#secondary #secondary-inner") ||
        document.querySelector("#secondary") ||
        document.querySelector("main") ||
        document.body;
      container.prepend(card);
    }

    const stats = parseMetricsFromDOM();

    card.innerHTML = `
      <div class="ss-head">
        <span class="ss-title">📊 SocialStats Live Channel Audit</span>
        <span class="ss-grade" id="ss-grade-badge">Grade: ${stats.grade}</span>
      </div>
      <div class="ss-grid">
        <div class="ss-metric">
          <div class="lbl">Est. Monthly Views</div>
          <div class="val">${stats.monthlyViews.toLocaleString()}</div>
        </div>
        <div class="ss-metric">
          <div class="lbl">Est. Monthly Rev</div>
          <div class="val" id="ss-m-rev">$${stats.monthlyRev.toLocaleString()}</div>
        </div>
        <div class="ss-metric">
          <div class="lbl">Est. Yearly Rev</div>
          <div class="val" id="ss-y-rev">$${stats.yearlyRev.toLocaleString()}</div>
        </div>
      </div>
      <div class="ss-Controls">
        <span>RPM: <strong id="ss-rpm-lbl">$${currentRpm.toFixed(2)}</strong></span>
        <input type="range" id="ss-rpm-slider" min="1.5" max="12.0" step="0.5" value="${currentRpm}" style="width:135px;" />
        <span>30d Forecast: <strong>+${stats.proj30dSubs.toLocaleString()} subs</strong></span>
      </div>
    `;

    const slider = card.querySelector("#ss-rpm-slider");
    slider.addEventListener("input", (e) => {
      currentRpm = parseFloat(e.target.value) || 4.5;
      const updated = parseMetricsFromDOM();
      card.querySelector("#ss-rpm-lbl").textContent = `$${currentRpm.toFixed(2)}`;
      card.querySelector("#ss-m-rev").textContent = `$${updated.monthlyRev.toLocaleString()}`;
      card.querySelector("#ss-y-rev").textContent = `$${updated.yearlyRev.toLocaleString()}`;
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "SOCIALSTATS_GET_AUDIT") {
      if (msg.rpm) currentRpm = parseFloat(msg.rpm) || 4.5;
      sendResponse(parseMetricsFromDOM());
      return true;
    }
  });

  renderAuditCard();
})();
