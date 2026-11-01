document.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById("vm-slider");
  const label = document.getElementById("vm-label");
  const status = document.getElementById("vm-status");

  function apply(gainPercent, preset) {
    slider.value = gainPercent;
    label.textContent = gainPercent + "%";
    const bass = preset === "Bass Boost" ? 9 : 0;
    const mid = preset === "Vocal Clarity" ? 8 : 0;
    const treble = preset === "Max 600%" ? 4 : 0;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "VOLMASTER_SET", gainPercent, preset, bass, mid, treble },
          () => {
            status.textContent = `Active: ${gainPercent}% Gain · Preset: ${preset} (B:${bass}dB M:${mid}dB T:${treble}dB)`;
          }
        );
      } else {
        status.textContent = `Active: ${gainPercent}% Gain · Preset: ${preset}`;
      }
    });
  }

  slider.addEventListener("input", () => {
    apply(parseInt(slider.value, 10), "Custom");
  });

  document.querySelectorAll("button[data-v]").forEach((btn) => {
    btn.addEventListener("click", () => {
      apply(parseInt(btn.getAttribute("data-v"), 10), btn.getAttribute("data-p"));
    });
  });
});
