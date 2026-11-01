(function () {
  if (document.getElementById("bitpass-pill")) return;

  function generateStrongPassword(len = 20) {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+";
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    let out = "";
    for (let i = 0; i < len; i++) {
      out += chars[arr[i] % chars.length];
    }
    return out;
  }

  function autofillForms(pwd) {
    const passInputs = Array.from(document.querySelectorAll('input[type="password"]'));
    const userInputs = Array.from(
      document.querySelectorAll('input[type="email"], input[name*="user"], input[id*="user"]')
    );
    const generated = pwd || generateStrongPassword(20);
    userInputs.forEach((inp) => {
      if (!inp.value) inp.value = "engineer@gurukuladesam.org";
    });
    passInputs.forEach((inp) => {
      inp.value = generated;
      inp.setAttribute("data-bitpass-filled", "true");
    });
    return {
      filledPasswordFields: passInputs.length,
      filledUserFields: userInputs.length,
      generated
    };
  }

  const passCount = document.querySelectorAll('input[type="password"]').length;
  const pill = document.createElement("div");
  pill.id = "bitpass-pill";
  pill.innerHTML = `
    <span>🔐 BitPass Vault (${passCount} Login Fields)</span>
    <button id="bitpass-fill-btn">Generate & Autofill</button>
  `;
  document.documentElement.appendChild(pill);

  const btn = pill.querySelector("#bitpass-fill-btn");
  btn.addEventListener("click", () => {
    const res = autofillForms();
    btn.textContent = `Filled (${res.filledPasswordFields})!`;
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "BITPASS_AUTOFILL") {
      const res = autofillForms(msg.password);
      btn.textContent = `Filled (${res.filledPasswordFields})!`;
      sendResponse({ ok: true, result: res });
    }
  });
})();
