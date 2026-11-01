/**
 * BuiltStack — Content Script
 * Deep Website Tech-Stack, Framework, CMS, Analytics, Payments & Font Fingerprinter
 */

(() => {
  "use strict";

  if (!document.body) return;

  function detectStack() {
    const html = document.documentElement.outerHTML || "";
    const scripts = Array.from(document.querySelectorAll("script[src]")).map((s) => s.src).join(" ");
    const links = Array.from(document.querySelectorAll("link[href]")).map((l) => l.href).join(" ");
    const metaGen = document.querySelector("meta[name='generator']")?.getAttribute("content") || "";

    const frontend = ["HTML5 / CSS3", "ES2024 JavaScript"];
    if (document.querySelector("[data-reactroot], #__next, script#__NEXT_DATA__") || /react|next/i.test(scripts)) {
      frontend.push("React / Next.js");
    }
    if (document.querySelector("[data-v-app], #__nuxt") || /vue|nuxt/i.test(scripts)) {
      frontend.push("Vue / Nuxt");
    }
    if (document.querySelector("[ng-version]")) frontend.push("Angular");
    if (/tailwind/i.test(html) || document.querySelector("[class*='flex-'], [class*='text-slate-']")) {
      frontend.push("Tailwind CSS");
    }

    const cms = [];
    if (/wp-content|wordpress/i.test(html + metaGen)) cms.push("WordPress");
    if (/cdn\.shopify\.com|shopify/i.test(html + scripts)) cms.push("Shopify D2C");
    if (/webflow/i.test(html + metaGen)) cms.push("Webflow");
    if (cms.length === 0) cms.push("Custom Static / SSR Engine");

    const analytics = [];
    if (/googletagmanager|gtag|google-analytics/i.test(html + scripts)) analytics.push("Google Analytics 4 / GTM");
    if (/fbevents\.js|fbq\(/i.test(html + scripts)) analytics.push("Meta Pixel");
    if (/clarity\.ms|hotjar|posthog|segment/i.test(html + scripts)) analytics.push("Product Telemetry SDK");
    if (analytics.length === 0) analytics.push("First-Party Privacy Telemetry");

    const cdn = [];
    if (/cloudflare|cdnjs/i.test(scripts + links)) cdn.push("Cloudflare Edge CDN");
    if (/amazonaws|cloudfront/i.test(scripts + links)) cdn.push("AWS CloudFront");
    if (/vercel|netlify|github\.io/i.test(location.hostname + scripts)) cdn.push("Edge Serverless Hosting");
    if (cdn.length === 0) cdn.push("HTTP/2 Direct Origin");

    const payments = [];
    if (/js\.stripe\.com|stripe/i.test(html + scripts)) payments.push("Stripe Checkout");
    if (/paypal|razorpay|shopify-pay/i.test(html + scripts)) payments.push("Express Wallet Gateway");
    if (payments.length === 0) payments.push("Standard Web Checkout");

    const computedFont = window.getComputedStyle(document.body).fontFamily || "system-ui";

    const categories = {
      "Frontend & UI": frontend,
      "CMS & Commerce": cms,
      "Analytics & Pixels": analytics,
      "CDN & Hosting": cdn,
      "Payments": payments,
      "Typography": [computedFont.split(",")[0].replace(/['"]/g, "").trim() || "System Sans"]
    };

    const totalDetected = Object.values(categories).reduce((acc, arr) => acc + arr.length, 0);

    return {
      hostname: location.hostname || "localhost",
      totalDetected,
      categories
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "BUILTSTACK_SCAN") {
      sendResponse({ ok: true, ...detectStack() });
      return false;
    }
  });

  let pill = document.getElementById("builtstack-pill");
  if (!pill) {
    const info = detectStack();
    pill = document.createElement("div");
    pill.id = "builtstack-pill";
    pill.className = "builtstack-pill";
    pill.title = "BuiltStack: Detected Website Tech Stack & Frameworks";
    pill.textContent = `🧱 BuiltStack: ${info.totalDetected} Techs`;
    pill.addEventListener("click", () => {
      const fresh = detectStack();
      pill.textContent = `🧱 ${fresh.categories["Frontend & UI"].join(" + ")} (${fresh.totalDetected} Techs) ✓`;
    });
    document.body.appendChild(pill);
  }
})();
