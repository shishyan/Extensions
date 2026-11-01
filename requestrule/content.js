(function () {
  if (window.__requestRuleLoaded) return;
  window.__requestRuleLoaded = true;

  const TRACKING_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "mc_cid"];

  function stripTrackingParamsOnPage() {
    let cleanedLinks = 0;
    document.querySelectorAll("a[href*='?']").forEach((a) => {
      try {
        const u = new URL(a.href, location.origin);
        let changed = false;
        TRACKING_PARAMS.forEach((p) => {
          if (u.searchParams.has(p)) {
            u.searchParams.delete(p);
            changed = true;
          }
        });
        if (changed) {
          a.href = u.toString();
          cleanedLinks++;
        }
      } catch (_) {}
    });
    return cleanedLinks;
  }

  function applyStoredRules() {
    if (!chrome.storage || !chrome.storage.local) return;
    chrome.storage.local.get({ requestrule_rules: [] }, (res) => {
      const rules = Array.isArray(res.requestrule_rules) ? res.requestrule_rules : [];
      rules.forEach((r) => {
        if (!r || !r.enabled || !r.match) return;
        if (r.action === "strip_params") {
          stripTrackingParamsOnPage();
        } else if (r.action === "redirect" && r.target && location.href.includes(r.match)) {
          // Safe non-destructive redirect indicator
          const b = document.getElementById("requestrule-badge");
          if (b) b.textContent = `⚡ Redirect Rule Matched: ${r.match} ➔ ${r.target}`;
        }
      });
    });
  }

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

    const strippedCount = stripTrackingParamsOnPage();

    return {
      totalRequests: entries.length || 1,
      avgLatencyMs: avgLatency,
      strippedLinks: strippedCount,
      resources
    };
  }

  function injectBadge() {
    if (document.getElementById("requestrule-badge")) return;
    const m = collectNetworkMetrics();
    const badge = document.createElement("div");
    badge.id = "requestrule-badge";
    badge.textContent = `⚡ RequestRule: ${m.totalRequests} Calls • Avg ${m.avgLatencyMs}ms • Cleaned ${m.strippedLinks} URLs`;
    document.body.appendChild(badge);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "REQUESTRULE_GET_NETWORK") {
      sendResponse(collectNetworkMetrics());
      return true;
    }
    if (msg && msg.type === "REQUESTRULE_STRIP_NOW") {
      sendResponse({ ok: true, stripped: stripTrackingParamsOnPage() });
      return true;
    }
  });

  injectBadge();
  applyStoredRules();
})();
