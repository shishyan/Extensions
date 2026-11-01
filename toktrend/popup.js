const vIn = document.getElementById("vIn");
const lIn = document.getElementById("lIn");
const cIn = document.getElementById("cIn");
const sIn = document.getElementById("sIn");
const erVal = document.getElementById("erVal");
const erTier = document.getElementById("erTier");
const topicIn = document.getElementById("topicIn");
const hooksBox = document.getElementById("hooksBox");

function calcER() {
  const v = Math.max(1, Number(vIn.value || 1));
  const l = Number(lIn.value || 0);
  const c = Number(cIn.value || 0);
  const s = Number(sIn.value || 0);
  const er = (((l + c + s) / v) * 100).toFixed(2);
  erVal.textContent = `${er}%`;
  erTier.textContent = Number(er) >= 8 ? "🔥 S-Tier Viral" : Number(er) >= 4.5 ? "⚡ Above Benchmark" : "📊 Standard";
}

function loadHooks() {
  chrome.runtime.sendMessage({ type: "TOKTREND_HOOKS", topic: topicIn.value }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      hooksBox.textContent = (res.hooks || []).join("\n\n");
    }
  });
}

[vIn, lIn, cIn, sIn].forEach((el) => el.addEventListener("input", calcER));
document.getElementById("genHooksBtn").addEventListener("click", loadHooks);

calcER();
loadHooks();
