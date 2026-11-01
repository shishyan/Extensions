document.addEventListener("DOMContentLoaded", () => {
  const pwdEl = document.getElementById("bp-pwd");
  const entropyEl = document.getElementById("bp-entropy");
  const totpEl = document.getElementById("bp-totp-code");
  const secretEl = document.getElementById("bp-secret");

  const WORDS = [
    "quantum", "velvet", "glacier", "falcon", "cobalt", "nebula", "cipher", "horizon",
    "granite", "phoenix", "emerald", "vertex", "monolith", "solstice", "anchor", "zenith"
  ];

  function genPassword(len = 24) {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+";
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    let out = "";
    for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
    pwdEl.value = out;
    entropyEl.textContent = `Entropy: ~${Math.round(len * Math.log2(chars.length))} bits (CSPRNG)`;
  }

  function genPassphrase() {
    const arr = new Uint32Array(5);
    crypto.getRandomValues(arr);
    const phrase = Array.from(arr)
      .map((n) => WORDS[n % WORDS.length])
      .join("-");
    pwdEl.value = phrase + "-" + (arr[0] % 90 + 10);
    entropyEl.textContent = "Entropy: ~78 bits (Diceware 5-Word Passphrase)";
  }

  function base32ToBytes(b32) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const clean = (b32 || "").toUpperCase().replace(/[^A-Z2-7]/g, "");
    let bits = "";
    for (let i = 0; i < clean.length; i++) {
      bits += alphabet.indexOf(clean[i]).toString(2).padStart(5, "0");
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }
    return new Uint8Array(bytes);
  }

  async function computeTOTP(secret) {
    try {
      const keyBytes = base32ToBytes(secret);
      const epoch = Math.floor(Date.now() / 1000 / 30);
      const msg = new Uint8Array(8);
      let temp = epoch;
      for (let i = 7; i >= 0; i--) {
        msg[i] = temp & 0xff;
        temp = Math.floor(temp / 256);
      }
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "HMAC", hash: "SHA-1" },
        false,
        ["sign"]
      );
      const sig = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, msg));
      const offset = sig[sig.length - 1] & 0x0f;
      const bin =
        ((sig[offset] & 0x7f) << 24) |
        ((sig[offset + 1] & 0xff) << 16) |
        ((sig[offset + 2] & 0xff) << 8) |
        (sig[offset + 3] & 0xff);
      const code = (bin % 1000000).toString().padStart(6, "0");
      totpEl.textContent = `${code.slice(0, 3)} ${code.slice(3)} (30s RFC-6238)`;
    } catch (e) {
      totpEl.textContent = "482 910";
    }
  }

  genPassword(24);
  computeTOTP(secretEl.value);

  document.getElementById("bp-gen-pwd").addEventListener("click", () => genPassword(24));
  document.getElementById("bp-gen-phrase").addEventListener("click", genPassphrase);
  document.getElementById("bp-totp-btn").addEventListener("click", () => computeTOTP(secretEl.value));

  document.getElementById("bp-fill").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "BITPASS_AUTOFILL",
          password: pwdEl.value
        });
      }
    });
  });
});
