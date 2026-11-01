# TubeIQ — Free YouTube SEO, Outlier Finder & Studio Toolkit (Chrome & Edge Manifest V3)

**TubeIQ** is a 100% free, zero-paywall, zero-telemetry Manifest V3 browser extension for **Google Chrome** and **Microsoft Edge** that combines the best features of **vidIQ**, **TubeBuddy**, and **1of10**:

1. **Outlier Multiplier & VPH Thumbnail Badges (1of10 + vidIQ style)**:
   - Automatically calculates the median views across any YouTube Home feed, Search results page, Channel page, or Shorts shelf and overlays a live badge (`🔥 4.8x Outlier • 142 VPH`) on every thumbnail.
2. **Watch-Page 100-Point SEO Scorecard & Tag Extractor (TubeBuddy + vidIQ style)**:
   - Injects a sleek sidebar card on every `/watch` page showing the video's **SEO Score (`0–100`)**, **Exact Views**, **Hidden Video Tags** (with one-click copy), and a 5-point packaging checklist.
3. **Popup Live Keyword Explorer**:
   - Queries live YouTube Autocomplete (`en` + `ta` + `shorts` + `how to`) in real time and scores **Search Demand (`0–100`)**, **Competition (`0–100`)**, and **Opportunity (`0–100`)** with one-click tag copying.

---

## 1. Load Unpacked Immediately in Chrome or Edge (Developer Mode)
1. Open `chrome://extensions` (or `edge://extensions` in Microsoft Edge).
2. Enable **Developer mode** (top-right toggle in Chrome, left sidebar in Edge).
3. Click **Load unpacked** and select:
   `/home/shishyan/GitHub/GuruKulaDesam/extensions/tubeiq`

---

## 2. Publish to Chrome Web Store & Microsoft Edge Add-ons Store

The store-ready ZIP archive is pre-built at:
`/home/shishyan/GitHub/GuruKulaDesam/extensions/tubeiq-store-package.zip`

### A. Chrome Web Store Submission (`chrome.google.com/webstore/devconsole`)
1. Sign in to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) (requires a one-time $5 Google developer registration fee if not already registered).
2. Click **New Item** → Upload `extensions/tubeiq-store-package.zip`.
3. **Store Listing Fields**:
   - **Title**: `TubeIQ — Free YouTube SEO, Outlier Finder & Studio Toolkit`
   - **Summary**: `100% Free vidIQ, TubeBuddy & 1of10 alternative: Outlier Multiplier & VPH badges, Live Keyword Explorer, Tag Extractor & 100-pt SEO Scorecard.`
   - **Category**: `Productivity` / `Tools`
   - **Language**: `English`
4. **Privacy Tab Justification (Fast-Track Approval)**:
   - **Single Purpose**: `Provides YouTube creators and viewers with on-page SEO scores, video tag extraction, outlier view multipliers, and live YouTube autocomplete keyword research.`
   - **Permission `storage`**: `Stores user keyword preferences locally in the browser.`
   - **Host Permission `https://suggestqueries.google.com/*` & `https://www.youtube.com/*`**: `Required to fetch live YouTube autocomplete suggestions and display SEO scorecards on YouTube pages.`
   - **Data Usage Certification**: Check *"No, I do not collect or transmit any user data"* (100% client-side execution).
5. Click **Submit for Review**.

### B. Microsoft Edge Add-ons Submission (`partner.microsoft.com/dashboard/microsoftedge`) — **100% Free Registration**
1. Sign in to [Microsoft Partner Center for Edge Add-ons](https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview) (Developer registration is **$0 / completely free** for individual accounts).
2. Click **Create new extension** → Upload the exact same `extensions/tubeiq-store-package.zip`.
3. Fill in the availability & properties (`Productivity`), paste the short description above, and click **Publish**.
