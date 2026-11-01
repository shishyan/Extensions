document.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById("vm-slider");
  const label = document.getElementById("vm-label");
  const status = document.getElementById("vm-status");
  const eqBass = document.getElementById("eq-bass");
  const eqMid = document.getElementById("eq-mid");
  const eqTreble = document.getElementById("eq-treble");
  const lblBass = document.getElementById("lbl-bass");
  const lblMid = document.getElementById("lbl-mid");
  const lblTreble = document.getElementById("lbl-treble");
  let mono = false;

  function apply(gainPercent, preset) {
    slider.value = gainPercent;
    label.textContent = gainPercent + "%";
    if (preset === "Flat") { eqBass.value = 0; eqMid.value = 0; eqTreble.value = 0; }
    else if (preset === "Bass Boost") { eqBass.value = 9; eqMid.value = 0; eqTreble.value = 1; }
    else if (preset === "Vocal Clarity") { eqBass.value = -2; eqMid.value = 8; eqTreble.value = 3; }
    else if (preset === "Max 600%") { eqBass.value = 4; eqMid.value = 4; eqTreble.value = 4; }

    const bass = parseInt(eqBass.value, 10) || 0;
    const mid = parseInt(eqMid.value, 10) || 0;
    const treble = parseInt(eqTreble.value, 10) || 0;
    lblBass.textContent = (bass >= 0 ? "+" : "") + bass + "dB";
    lblMid.textContent = (mid >= 0 ? "+" : "") + mid + "dB";
    lblTreble.textContent = (treble >= 0 ? "+" : "") + treble + "dB";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "VOLMASTER_SET", gainPercent, preset, bass, mid, treble, mono },
          () => {
            status.textContent = `Active: ${gainPercent}% · ${preset} (B:${bass}dB M:${mid}dB T:${treble}dB · ${mono ? "Mono" : "Stereo"})`;
          }
        );
      } else {
        status.textContent = `Active: ${gainPercent}% · ${preset}`;
      }
    });
  }

  slider.addEventListener("input", () => apply(parseInt(slider.value, 10), "Custom"));
  [eqBass, eqMid, eqTreble].forEach((el) => el.addEventListener("input", () => apply(parseInt(slider.value, 10), "Custom EQ")));

  document.querySelectorAll("button[data-v]").forEach((btn) => {
    btn.addEventListener("click", () => {
      apply(parseInt(btn.getAttribute("data-v"), 10), btn.getAttribute("data-p"));
    });
  });

  document.getElementById("vm-mono").addEventListener("click", () => {
    mono = !mono;
    apply(parseInt(slider.value, 10), "Custom");
  });

  document.getElementById("vm-save-host").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const host = (tabs && tabs[0] && tabs[0].url) ? new URL(tabs[0].url).hostname : "default";
      const cfg = { gain: parseInt(slider.value, 10), bass: parseInt(eqBass.value, 10), mid: parseInt(eqMid.value, 10), treble: parseInt(eqTreble.value, 10), mono };
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get({ vmHosts: {} }, (res) => {
          const vmHosts = res.vmHosts || {};
          vmHosts[host] = cfg;
          chrome.storage.local.set({ vmHosts }, () => {
            status.textContent = `✓ Saved per-domain audio preset for ${host}!`;
          });
        });
      }
    });
  });
});