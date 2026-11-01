(function () {
  if (window.__builtStackLoaded) return;
  window.__builtStackLoaded = true;

  function detectStack() {
    const html = document.documentElement.outerHTML || "";
    const scripts = Array.from(document.querySelectorAll("script[src]")).map((s) => s.src.toLowerCase()).join(" ");
    const links = Array.from(document.querySelectorAll("link[href]")).map((l) => l.href.toLowerCase()).join(" ");
    const metas = Array.from(document.querySelectorAll("meta")).map((m) => (m.name + "=" + m.content).toLowerCase()).join(" ");
    const cookies = (document.cookie || "").toLowerCase();

    const RULES = [
      // Frontend Frameworks
      { name: "React", cat: "Frontend", test: () => /react|__react|_reactrootcontainer/i.test(html) || !!document.querySelector("[data-reactroot], [data-reactid]") },
      { name: "Next.js", cat: "Framework", test: () => !!document.getElementById("__NEXT_DATA__") || html.includes("/_next/static/") },
      { name: "Vue.js", cat: "Frontend", test: () => /vue\.js|vue\.runtime|data-v-[a-f0-9]{6}/i.test(html) || !!document.querySelector("[data-v-app]") },
      { name: "Nuxt.js", cat: "Framework", test: () => !!document.getElementById("__NUXT__") || html.includes("/_nuxt/") },
      { name: "Angular", cat: "Frontend", test: () => !!document.querySelector("[ng-version], [ng-app]") || /angular/i.test(scripts) },
      { name: "Svelte", cat: "Frontend", test: () => /svelte-[a-z0-9]+/i.test(html) },
      { name: "Astro", cat: "Framework", test: () => /astro-island|astro-slot/i.test(html) },
      { name: "Remix", cat: "Framework", test: () => /__remixContext/i.test(html) },
      { name: "jQuery", cat: "JS Library", test: () => /jquery/i.test(scripts) },
      { name: "Alpine.js", cat: "JS Library", test: () => !!document.querySelector("[x-data]") || /alpinejs/i.test(scripts) },
      { name: "HTMX", cat: "JS Library", test: () => !!document.querySelector("[hx-get], [hx-post]") || /htmx\.org/i.test(scripts) },
      { name: "Three.js / WebGL", cat: "Graphics", test: () => /three\.min\.js|three\.module/i.test(scripts) || !!document.querySelector("canvas") },

      // CMS & E-Commerce
      { name: "WordPress", cat: "CMS", test: () => /wp-content|wp-includes|wordpress/i.test(html + metas) },
      { name: "Shopify", cat: "E-Commerce", test: () => /cdn\.shopify\.com|shopify\.theme/i.test(html) },
      { name: "WooCommerce", cat: "E-Commerce", test: () => /woocommerce/i.test(html) },
      { name: "Webflow", cat: "CMS", test: () => /webflow/i.test(html + metas) || !!document.querySelector("html[data-wf-site]") },
      { name: "Wix", cat: "CMS", test: () => /wix\.com|wixstatic\.com/i.test(html) },
      { name: "Squarespace", cat: "CMS", test: () => /squarespace\.com|static1\.squarespace/i.test(html) },
      { name: "Magento", cat: "E-Commerce", test: () => /mage\/cookies|magento/i.test(html) },
      { name: "Ghost CMS", cat: "CMS", test: () => /ghost/i.test(metas) },
      { name: "Drupal", cat: "CMS", test: () => /drupal/i.test(html + metas) },

      // CSS & UI Systems
      { name: "Tailwind CSS", cat: "CSS/UI", test: () => /class="[^"]*\b(flex|grid|items-center|justify-between|bg-slate-|text-sm|px-\d|py-\d)\b/i.test(html) },
      { name: "Bootstrap", cat: "CSS/UI", test: () => /bootstrap/i.test(links + scripts) || /class="[^"]*\b(container-fluid|col-md-|btn-primary)\b/i.test(html) },
      { name: "Material UI", cat: "CSS/UI", test: () => /MuiButton|MuiBox|css-[a-z0-9]+-Mui/i.test(html) },
      { name: "Chakra UI", cat: "CSS/UI", test: () => /chakra-/i.test(html) },
      { name: "Font Awesome", cat: "Icons", test: () => /font-awesome|fontawesome|fa-solid/i.test(html + links) },
      { name: "Google Fonts", cat: "Fonts", test: () => /fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(links + html) },

      // CDN & Hosting
      { name: "Cloudflare", cat: "CDN/Edge", test: () => /cloudflare|cdnjs\.cloudflare\.com|__cf_bm/i.test(scripts + cookies + html) },
      { name: "Vercel", cat: "Hosting", test: () => /vercel/i.test(html) || html.includes("/_next/") },
      { name: "Netlify", cat: "Hosting", test: () => /netlify/i.test(html) },
      { name: "AWS CloudFront", cat: "CDN/Edge", test: () => /cloudfront\.net/i.test(html + scripts) },
      { name: "Fastly CDN", cat: "CDN/Edge", test: () => /fastly/i.test(html + scripts) },

      // Analytics & Tag Managers
      { name: "Google Analytics 4 (GA4)", cat: "Analytics", test: () => /gtag\(|G-[A-Z0-9]{6,12}|googletagmanager\.com\/gtag/i.test(html) },
      { name: "Google Tag Manager", cat: "Tag Manager", test: () => /GTM-[A-Z0-9]{4,10}|googletagmanager\.com\/gtm\.js/i.test(html) },
      { name: "Meta / Facebook Pixel", cat: "Marketing", test: () => /connect\.facebook\.net|fbq\(|_fbp/i.test(html + cookies) },
      { name: "TikTok Pixel", cat: "Marketing", test: () => /analytics\.tiktok\.com|ttq\./i.test(html) },
      { name: "LinkedIn Insight Tag", cat: "Marketing", test: () => /snap\.licdn\.com|_linkedin_partner_id/i.test(html) },
      { name: "Hotjar", cat: "Heatmaps", test: () => /static\.hotjar\.com|_hjSession/i.test(html + cookies) },
      { name: "Microsoft Clarity", cat: "Heatmaps", test: () => /clarity\.ms/i.test(html + scripts) },
      { name: "PostHog", cat: "Analytics", test: () => /posthog/i.test(html + scripts) },
      { name: "Mixpanel", cat: "Analytics", test: () => /mixpanel/i.test(html + scripts) },
      { name: "Segment", cat: "CDP", test: () => /cdn\.segment\.com|analytics\.load/i.test(html) },

      // Payments & Support
      { name: "Stripe", cat: "Payments", test: () => /js\.stripe\.com|stripe/i.test(scripts + html) },
      { name: "PayPal", cat: "Payments", test: () => /paypal\.com\/sdk|paypalobjects/i.test(scripts + html) },
      { name: "Razorpay", cat: "Payments", test: () => /checkout\.razorpay\.com/i.test(scripts + html) },
      { name: "Intercom", cat: "Support/CRM", test: () => /widget\.intercom\.io|intercomSettings/i.test(html) },
      { name: "HubSpot", cat: "Support/CRM", test: () => /js\.hs-scripts\.com|hs-analytics|__hstc/i.test(html + cookies) },
      { name: "Zendesk", cat: "Support/CRM", test: () => /zdassets\.com|zendesk/i.test(html + scripts) },
      { name: "Crisp Chat", cat: "Support/CRM", test: () => /client\.crisp\.chat/i.test(html + scripts) },
      { name: "Sentry Error Tracking", cat: "Monitoring", test: () => /sentry\.io|browser\.sentry-cdn/i.test(html + scripts) },
      { name: "Datadog RUM", cat: "Monitoring", test: () => /datadoghq/i.test(html + scripts) }
    ];

    const detected = [];
    RULES.forEach((r) => {
      try {
        if (r.test()) detected.push({ name: r.name, cat: r.cat });
      } catch (_) {}
    });

    if (detected.length === 0) {
      detected.push({ name: "HTML5 / Modern DOM", cat: "Core" }, { name: "CSS3 Layout Engine", cat: "Styling" });
    }

    return {
      domain: location.hostname,
      url: location.href,
      scriptCount: document.querySelectorAll("script").length,
      stylesheetCount: document.querySelectorAll("link[rel='stylesheet']").length,
      detected
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "BUILTSTACK_SCAN") {
      sendResponse(detectStack());
      return true;
    }
  });
})();
