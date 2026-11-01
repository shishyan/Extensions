(function () {
  if (document.getElementById("responsiveview-bar")) return;

  function getBreakpointName(w) {
    if (w < 640) return "xs (<640px)";
    if (w < 768) return "sm (≥640px)";
    if (w < 1024) return "md (≥768px)";
    if (w < 1280) return "lg (≥1024px)";
    return "xl (≥1280px)";
  }

  let activePreset = { name: "Responsive", width: window.innerWidth, height: window.innerHeight };

  const bar = document.createElement("div");
  bar.id = "responsiveview-bar";

  function applyPreset(name, width, height) {
    activePreset = { name, width, height };
    if (name === "Reset") {
      document.documentElement.classList.remove("responsiveview-device-frame");
      document.body.style.maxWidth = "";
      document.body.style.minHeight = "";
      activePreset = { name: "Native", width: window.innerWidth, height: window.innerHeight };
    } else {
      document.documentElement.classList.add("responsiveview-device-frame");
      document.body.style.maxWidth = width + "px";
      document.body.style.minHeight = height + "px";
    }
    renderBar();
  }

  function renderBar() {
    const w = activePreset.width || window.innerWidth;
    const bp = getBreakpointName(w);
    bar.innerHTML = `
      <span>📱 ResponsiveView: <strong>${activePreset.name}</strong> (${w}px · ${bp})</span>
      <button data-dev="iPhone 16 Pro" data-w="393" data-h="852">393px</button>
      <button data-dev="iPad Air" data-w="820" data-h="1180">820px</button>
      <button data-dev="Reset" data-w="0" data-h="0">Reset</button>
    `;
    bar.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dev = btn.getAttribute("data-dev");
        const dw = parseInt(btn.getAttribute("data-w"), 10);
        const dh = parseInt(btn.getAttribute("data-h"), 10);
        applyPreset(dev, dw, dh);
      });
    });
  }

  document.documentElement.appendChild(bar);
  renderBar();

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "RESPONSIVEVIEW_SET") {
      applyPreset(msg.name, msg.width, msg.height);
      sendResponse({ ok: true, activePreset, breakpoint: getBreakpointName(activePreset.width) });
    } else if (msg.type === "RESPONSIVEVIEW_STATUS") {
      sendResponse({
        ok: true,
        activePreset,
        breakpoint: getBreakpointName(activePreset.width || window.innerWidth)
      });
    }
  });
})();
