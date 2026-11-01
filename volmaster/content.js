(function () {
  if (document.getElementById("volmaster-pill")) return;

  let state = {
    gainPercent: 100,
    preset: "Flat",
    bass: 0,
    mid: 0,
    treble: 0
  };

  let audioCtx = null;
  const hookedElements = new WeakSet();
  const nodesList = [];

  function applyAudioGraph(gainPercent, bass, mid, treble, preset) {
    state = { gainPercent, bass, mid, treble, preset: preset || state.preset };
    const mediaEls = Array.from(document.querySelectorAll("video, audio"));
    mediaEls.forEach((el) => {
      try {
        if (!hookedElements.has(el) && (window.AudioContext || window.webkitAudioContext)) {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (!audioCtx) audioCtx = new Ctx();
          const src = audioCtx.createMediaElementSource(el);
          const gainNode = audioCtx.createGain();
          const bassNode = audioCtx.createBiquadFilter();
          bassNode.type = "lowshelf";
          bassNode.frequency.value = 100;
          const midNode = audioCtx.createBiquadFilter();
          midNode.type = "peaking";
          midNode.frequency.value = 1000;
          const trebleNode = audioCtx.createBiquadFilter();
          trebleNode.type = "highshelf";
          trebleNode.frequency.value = 8000;

          src.connect(bassNode);
          bassNode.connect(midNode);
          midNode.connect(trebleNode);
          trebleNode.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          hookedElements.add(el);
          nodesList.push({ gainNode, bassNode, midNode, trebleNode });
        }
      } catch (e) {}
    });

    nodesList.forEach((n) => {
      try {
        n.gainNode.gain.value = state.gainPercent / 100;
        n.bassNode.gain.value = state.bass;
        n.midNode.gain.value = state.mid;
        n.trebleNode.gain.value = state.treble;
      } catch (e) {}
    });

    renderPill();
  }

  const pill = document.createElement("div");
  pill.id = "volmaster-pill";

  function renderPill() {
    pill.innerHTML = `
      <span>🔊 VolMaster: <strong>${state.gainPercent}%</strong> · EQ ${state.preset}</span>
      <button data-vol="200" data-eq="Bass Boost">200%</button>
      <button data-vol="400" data-eq="Vocal Boost">400%</button>
      <button data-vol="600" data-eq="Max Boost">600%</button>
    `;
    pill.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const v = parseInt(btn.getAttribute("data-vol"), 10);
        const eq = btn.getAttribute("data-eq");
        const b = eq === "Bass Boost" ? 8 : 0;
        const m = eq === "Vocal Boost" ? 7 : 0;
        applyAudioGraph(v, b, m, 2, eq);
      });
    });
  }

  document.documentElement.appendChild(pill);
  renderPill();

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "VOLMASTER_SET") {
      applyAudioGraph(msg.gainPercent, msg.bass || 0, msg.mid || 0, msg.treble || 0, msg.preset || "Custom");
      sendResponse({ ok: true, state });
    } else if (msg.type === "VOLMASTER_GET") {
      sendResponse({ ok: true, state });
    }
  });
})();
