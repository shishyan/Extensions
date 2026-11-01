(function () {
  if (window.__requestRuleLoaded) return;
  window.__requestRuleLoaded = true;

  function collectNetworkMetrics() {
    const entries = (window.performance && window.performance.getEntriesByType)
      ? window.performance.getEntriesByType("resource")
      : [];

    const resources = entries.slice(0, 25).map((e) => ({
      name: String(e.name || "").split("/").pop() || e.name,
      type: e.initiatorType || "fetch",
      durationMs: Math.round(e.duration || 12)
    }));

    const avgLatency = resources.length
      ? Math.round(resources.reduce((s, r) => s + r.durationMs, 0) / resources.length)
      : 14;

    return {
      totalRequests: entries.length || 1,
      avgLatencyMs: avgLatency,
      resources
    };
  }

  function injectBadge() {
    if (document.getElementById("requestrule-badge")) return;
    const m = collectNetworkMetrics();
    const badge = document.createElement("div");
    badge.id = "requestrule-badge";
    badge.textContent = `⚡ RequestRule: ${m.totalRequests} Network Calls • Avg ${m.avgLatencyMs}ms`;
    document.body.appendChild(badge);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "REQUESTRULE_GET_NETWORK") {
      sendResponse(collectNetworkMetrics());
      return true;
    }
  });

  injectBadge();
})();
