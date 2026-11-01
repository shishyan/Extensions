const STAGES = ["Lead", "Contacted", "Demo", "Proposal", "Won"];
let currentDeals = [
  { name: "Acme AI Cloud", stage: "Proposal", value: 18500, notes: "Security review in progress" },
  { name: "Vertex Data Labs", stage: "Demo", value: 12000, notes: "Scheduled technical walkthrough" }
];

function persist() {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ streakcrm_deals: currentDeals });
  }
}

function render() {
  const total = currentDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);
  document.getElementById("dealCount").textContent = `📌 Active Deals: ${currentDeals.length}`;
  document.getElementById("pipeVal").textContent = `💰 Pipeline: $${total.toLocaleString()}`;

  document.getElementById("dealList").innerHTML = currentDeals
    .map(
      (d, idx) => `
      <div class="row">
        <div class="row-top">
          <span><strong>${d.name}</strong></span>
          <div>
            <button class="stage-btn" data-idx="${idx}" title="Click to advance stage">${d.stage} ➔</button>
            <strong style="color:#4ade80;margin-left:6px;">$${Number(d.value).toLocaleString()}</strong>
          </div>
        </div>
        <div style="color:#94a3b8;font-size:10px;margin-top:2px;">📝 ${d.notes || "No notes yet"}</div>
      </div>
    `
    )
    .join("");

  document.querySelectorAll(".stage-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-idx"));
      const cur = currentDeals[i];
      if (!cur) return;
      const nextIdx = (STAGES.indexOf(cur.stage) + 1) % STAGES.length;
      cur.stage = STAGES[nextIdx];
      persist();
      render();
    });
  });
}

if (chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(["streakcrm_deals"], (res) => {
    if (Array.isArray(res.streakcrm_deals) && res.streakcrm_deals.length) {
      currentDeals = res.streakcrm_deals;
    }
    render();
  });
} else {
  render();
}

document.getElementById("addBtn").addEventListener("click", () => {
  const name = document.getElementById("nameInp").value.trim() || "New Enterprise Deal";
  const stage = document.getElementById("stageSel").value;
  const value = parseInt(document.getElementById("valInp").value, 10) || 15000;
  const notes = document.getElementById("noteInp").value.trim() || "Added from active tab";
  currentDeals.unshift({ name, stage, value, notes });
  persist();
  document.getElementById("nameInp").value = "";
  document.getElementById("noteInp").value = "";
  render();
});

document.getElementById("csvBtn").addEventListener("click", () => {
  const csv = [
    "AccountName,Stage,DealValueUSD,Notes",
    ...currentDeals.map((d) => `"${d.name}","${d.stage}",${Number(d.value) || 0},"${(d.notes || "").replace(/"/g, '""')}"`)
  ].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(csv).catch(() => {});
  }
  document.getElementById("csvBtn").textContent = "✅ CSV Copied!";
});
