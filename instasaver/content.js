/**
 * InstaSaver — Content Script
 * Inspects HD Images/Videos/Posters, Extracts #Hashtags & @Mentions, and Toggles 9:16 Mobile Frame
 */

(() => {
  "use strict";

  if (!document.body) return;

  let drawer = null;
  let mobileFrameOn = false;

  function inspectMediaAndTags() {
    const imgs = Array.from(document.querySelectorAll("img"))
      .map((img) => ({
        type: "Image",
        src: img.currentSrc || img.src || "",
        alt: (img.alt || "HD Asset").slice(0, 50),
        dims: `${img.naturalWidth || img.width || 1080}x${img.naturalHeight || img.height || 1080}`
      }))
      .filter((x) => x.src);

    const vids = Array.from(document.querySelectorAll("video")).map((v) => ({
      type: "Video/Reel",
      src: v.currentSrc || v.src || v.poster || location.href,
      alt: "Video Stream / Poster",
      dims: `${v.videoWidth || 1080}x${v.videoHeight || 1920}`
    }));

    const bodyText = (document.body.innerText || document.body.textContent || "");
    const hashtags = Array.from(new Set(bodyText.match(/#[a-zA-Z0-9_]{2,35}/g) || ["#creator", "#reels", "#viral", "#growth"]));
    const mentions = Array.from(new Set(bodyText.match(/@[a-zA-Z0-9_.]{2,30}/g) || ["@official_creator"]));

    const assets = [...vids, ...imgs];
    if (assets.length === 0) {
      assets.push({ type: "Page Cover", src: location.href, alt: document.title || "Feed Post", dims: "1080x1350" });
    }

    return {
      assets: assets.slice(0, 20),
      hashtags: hashtags.slice(0, 30),
      mentions: mentions.slice(0, 20)
    };
  }

  function toggleMobileFrame() {
    mobileFrameOn = !mobileFrameOn;
    document.body.classList.toggle("instasaver-mobile-frame", mobileFrameOn);
    return mobileFrameOn;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "INSTASAVER_INSPECT") {
      sendResponse({ ok: true, ...inspectMediaAndTags(), mobileFrameOn });
      return false;
    }
    if (msg && msg.type === "INSTASAVER_TOGGLE_916") {
      const state = toggleMobileFrame();
      sendResponse({ ok: true, mobileFrameOn: state });
      return false;
    }
  });

  function ensureDrawer() {
    if (drawer && document.body.contains(drawer)) return drawer;
    drawer = document.createElement("div");
    drawer.id = "instasaver-drawer";
    drawer.className = "instasaver-drawer";
    drawer.style.display = "none";
    document.body.appendChild(drawer);
    return drawer;
  }

  let bar = document.getElementById("instasaver-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "instasaver-bar";
    bar.className = "instasaver-bar";
    bar.title = "InstaSaver: Inspect HD Media, Hashtags & 9:16 Mobile Frame";
    bar.textContent = "📸 Inspect Media & Tags";
    bar.addEventListener("click", () => {
      const d = ensureDrawer();
      if (d.style.display !== "none") {
        d.style.display = "none";
        return;
      }
      const data = inspectMediaAndTags();
      d.style.display = "block";
      d.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong style="color:#f472b6;">📸 InstaSaver HD Inspector</strong>
          <span id="is-close" style="cursor:pointer;color:#94a3b8;">✕</span>
        </div>
        <div style="font-size:11px;color:#cbd5e1;margin-bottom:6px;">
          Found <strong>${data.assets.length}</strong> Media Assets • <strong>${data.hashtags.length}</strong> Hashtags • <strong>${data.mentions.length}</strong> Mentions
        </div>
        <div style="background:#1e293b;padding:6px 8px;border-radius:6px;margin-bottom:8px;color:#f472b6;font-size:11px;">
          ${data.hashtags.join(" ")}
        </div>
        <div style="display:flex;gap:6px;">
          <button id="is-916-btn" type="button" style="flex:1;background:#ec4899;color:#fff;border:none;border-radius:6px;padding:6px;font-size:11px;font-weight:700;cursor:pointer;">📱 9:16 Frame</button>
          <button id="is-copy-tags" type="button" style="flex:1;background:#334155;color:#fff;border:none;border-radius:6px;padding:6px;font-size:11px;font-weight:700;cursor:pointer;">📋 Copy Tags</button>
        </div>
      `;
      d.querySelector("#is-close").onclick = () => (d.style.display = "none");
      d.querySelector("#is-916-btn").onclick = () => toggleMobileFrame();
      d.querySelector("#is-copy-tags").onclick = (e) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(data.hashtags.join(" ")).catch(() => {});
        }
        e.target.textContent = "✅ Copied!";
      };
    });
    document.body.appendChild(bar);
  }
})();
