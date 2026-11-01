(() => {
  const logs = [];
  const origError = console.error;
  console.error = function(...args) {
    logs.push(args.map(a => String(a)).join(' '));
    origError.apply(console, args);
  };

  let inspectorOn = false;
  let tooltip = null;

  function onHover(e) {
    if (!inspectorOn) return;
    const el = e.target;
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:2147483647;background:#0f172a;color:#f8fafc;border:1px solid #f43f5e;padding:8px 12px;border-radius:8px;font-family:monospace;font-size:11px;pointer-events:none;box-shadow:0 6px 20px rgba(0,0,0,0.4);';
      document.body.appendChild(tooltip);
    }
    const cs = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    tooltip.innerHTML = `
      <strong style="color:#fb7185;">&lt;${el.tagName.toLowerCase()}&gt;</strong> ${Math.round(rect.width)}×${Math.round(rect.height)}px<br>
      Font: ${cs.fontFamily.split(',')[0]} (${cs.fontSize})<br>
      Color: ${cs.color} • BG: ${cs.backgroundColor}
    `;
  }

  document.addEventListener('mouseover', onHover);

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SNAPBUG_META') {
      sendResponse({
        url: location.href,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        dpr: window.devicePixelRatio,
        ua: navigator.userAgent,
        errors: logs.slice(-5)
      });
    } else if (msg.type === 'SNAPBUG_INSPECT') {
      inspectorOn = !inspectorOn;
      if (!inspectorOn && tooltip) {
        tooltip.remove();
        tooltip = null;
      }
      sendResponse({ inspectorOn });
    }
  });
})();
