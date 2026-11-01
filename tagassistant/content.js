(function () {
  if (window.__tagAssistantLoaded) return;
  window.__tagAssistantLoaded = true;

  function auditTags() {
    const html = document.documentElement.outerHTML || "";
    const cookies = (document.cookie || "").split(";").map((c) => c.trim()).filter(Boolean);

    const ga4Ids = Array.from(new Set(html.match(/G-[A-Z0-9]{6,12}/g) || []));
    const gtmIds = Array.from(new Set(html.match(/GTM-[A-Z0-9]{4,10}/g) || []));
    const uaIds = Array.from(new Set(html.match(/UA-\d{4,10}-\d{1,4}/g) || []));
    const awIds = Array.from(new Set(html.match(/AW-\d{6,12}/g) || []));

    const pixels = [];
    if (/connect\.facebook\.net|fbq\(/i.test(html)) pixels.push("Meta / Facebook Pixel");
    if (/analytics\.tiktok\.com|ttq\./i.test(html)) pixels.push("TikTok Pixel");
    if (/snap\.licdn\.com|_linkedin_partner_id/i.test(html)) pixels.push("LinkedIn Insight Tag");
    if (/ct\.pinterest\.com|pintrk\(/i.test(html)) pixels.push("Pinterest Tag");
    if (/static\.ads-twitter\.com|twq\(/i.test(html)) pixels.push("X / Twitter Pixel");
    if (/clarity\.ms/i.test(html)) pixels.push("Microsoft Clarity");
    if (/static\.hotjar\.com/i.test(html)) pixels.push("Hotjar Recording");

    const trackingCookies = cookies
      .map((c) => c.split("=")[0])
      .filter((name) => /^(_ga|_gid|_gat|_fbp|_fbc|_ttp|_gcl_|_hj|__hstc|__utma)/i.test(name));

    const dlCalls = (html.match(/dataLayer\.push/g) || []).length;

    return {
      domain: location.hostname,
      ga4Ids,
      gtmIds,
      uaIds,
      awIds,
      pixels,
      trackingCookies,
      dlCalls,
      status: (ga4Ids.length + gtmIds.length + pixels.length) > 0 ? "Healthy Firing" : "No Marketing Tags"
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "TAG_AUDIT") {
      sendResponse(auditTags());
      return true;
    }
  });
})();
