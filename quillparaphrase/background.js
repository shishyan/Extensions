/**
 * QuillParaphrase — Background Service Worker
 * Provides Datamuse public API synonym enrichment + 5-mode Paraphrasing Engine
 * Modes: fluency, formal, academic, concise, creative
 * Intensity: 25, 50, 75, 100
 */

const SYNONYM_LEXICON = {
  "important": ["crucial", "vital", "essential", "paramount", "pivotal"],
  "good": ["effective", "favorable", "advantageous", "exemplary", "stellar"],
  "bad": ["adverse", "detrimental", "suboptimal", "unfavorable", "deficient"],
  "use": ["utilize", "employ", "leverage", "apply", "harness"],
  "used": ["utilized", "employed", "leveraged", "applied", "harnessed"],
  "make": ["create", "generate", "formulate", "produce", "establish"],
  "makes": ["creates", "generates", "formulates", "produces", "establishes"],
  "made": ["created", "generated", "formulated", "produced", "established"],
  "help": ["assist", "facilitate", "support", "empower", "enable"],
  "helps": ["assists", "facilitates", "supports", "empowers", "enables"],
  "show": ["demonstrate", "illustrate", "reveal", "indicate", "exhibit"],
  "shows": ["demonstrates", "illustrates", "reveals", "indicates", "exhibits"],
  "need": ["require", "necessitate", "demand", "call for", "depend on"],
  "needs": ["requires", "necessitates", "demands", "calls for", "depends on"],
  "get": ["acquire", "obtain", "secure", "attain", "procure"],
  "fast": ["rapid", "swift", "accelerated", "expeditious", "high-velocity"],
  "big": ["substantial", "significant", "considerable", "expansive", "monumental"],
  "small": ["modest", "minimal", "compact", "marginal", "negligible"],
  "change": ["modify", "transform", "alter", "refine", "restructure"],
  "changes": ["modifications", "transformations", "shifts", "refinements", "revisions"],
  "think": ["consider", "evaluate", "deem", "postulate", "contemplate"],
  "build": ["construct", "architect", "develop", "engineer", "assemble"],
  "improve": ["enhance", "optimize", "elevate", "strengthen", "augment"],
  "improves": ["enhances", "optimizes", "elevates", "strengthens", "augments"],
  "problem": ["challenge", "obstacle", "bottleneck", "impediment", "anomaly"],
  "problems": ["challenges", "obstacles", "bottlenecks", "impediments", "complexities"],
  "idea": ["concept", "initiative", "proposition", "framework", "hypothesis"],
  "ideas": ["concepts", "initiatives", "propositions", "frameworks", "hypotheses"],
  "result": ["outcome", "consequence", "finding", "deliverable", "ramification"],
  "results": ["outcomes", "consequences", "findings", "deliverables", "metrics"],
  "start": ["initiate", "commence", "launch", "instigate", "pioneer"],
  "end": ["conclude", "finalize", "terminate", "complete", "culminate"],
  "easy": ["straightforward", "seamless", "effortless", "intuitive", "frictionless"],
  "hard": ["challenging", "demanding", "rigorous", "arduous", "intricate"],
  "many": ["numerous", "multiple", "diverse", "abundant", "myriad"],
  "very": ["exceptionally", "remarkably", "profoundly", "distinctly", "notably"],
  "really": ["genuinely", "markedly", "substantially", "decidedly", "truly"],
  "check": ["verify", "inspect", "audit", "validate", "examine"],
  "fix": ["resolve", "remediate", "rectify", "address", "correct"],
  "give": ["provide", "deliver", "furnish", "supply", "impart"],
  "keep": ["maintain", "preserve", "retain", "sustain", "uphold"]
};

const PHRASE_TRANSFORMS = {
  fluency: [
    [/\bin order to\b/gi, "to"],
    [/\bdue to the fact that\b/gi, "because"],
    [/\bat this point in time\b/gi, "currently"],
    [/\bhas the ability to\b/gi, "can"],
    [/\bmake a decision\b/gi, "decide"],
    [/\ba large number of\b/gi, "many"],
    [/\bfor the purpose of\b/gi, "for"]
  ],
  formal: [
    [/\bin order to\b/gi, "With the objective of"],
    [/\bcan't\b/gi, "cannot"],
    [/\bwon't\b/gi, "will not"],
    [/\bdon't\b/gi, "do not"],
    [/\bdidn't\b/gi, "did not"],
    [/\bI think\b/gi, "Our assessment indicates that"],
    [/\bwe need to\b/gi, "it is imperative that we"],
    [/\blet's\b/gi, "let us"],
    [/\bfind out\b/gi, "ascertain"],
    [/\blook into\b/gi, "investigate"],
    [/\bput together\b/gi, "compile"],
    [/\bset up\b/gi, "establish"],
    [/\bget rid of\b/gi, "eliminate"],
    [/\btalk about\b/gi, "discuss"]
  ],
  academic: [
    [/\bshows that\b/gi, "demonstrates empirically that"],
    [/\bproves that\b/gi, "corroborates the hypothesis that"],
    [/\bI think\b/gi, "The evidence suggests that"],
    [/\bbecause of\b/gi, "attributable to"],
    [/\bso that\b/gi, "such that"],
    [/\balso\b/gi, "furthermore"],
    [/\bbut\b/gi, "however,"],
    [/\bfor example\b/gi, "for instance,"],
    [/\bin conclusion\b/gi, "in synthesis,"],
    [/\ba lot of\b/gi, "a substantial body of"]
  ],
  concise: [
    [/\bin order to\b/gi, "to"],
    [/\bdue to the fact that\b/gi, "because"],
    [/\bat this point in time\b/gi, "now"],
    [/\bin the near future\b/gi, "soon"],
    [/\bfor the purpose of\b/gi, "for"],
    [/\bin the event that\b/gi, "if"],
    [/\bwith regard to\b/gi, "regarding"],
    [/\btake into consideration\b/gi, "consider"],
    [/\bon a daily basis\b/gi, "daily"],
    [/\bmake a decision\b/gi, "decide"],
    [/\ba large number of\b/gi, "many"],
    [/\b(really|very|basically|actually|literally|simply|just)\s+/gi, ""]
  ],
  creative: [
    [/\bimportant\b/gi, "game-changing"],
    [/\bfast\b/gi, "lightning-fast"],
    [/\bgood\b/gi, "compelling"],
    [/\bstart\b/gi, "kickstart"],
    [/\bimprove\b/gi, "supercharge"],
    [/\bmake\b/gi, "craft"],
    [/\bidea\b/gi, "breakthrough vision"]
  ]
};

function paraphraseEngine(text, mode = "fluency", intensity = 50) {
  if (!text || !text.trim()) {
    return { output: "", changedCount: 0, mode, intensity };
  }

  let out = text.trim();
  let changedCount = 0;

  const rules = PHRASE_TRANSFORMS[mode] || PHRASE_TRANSFORMS.fluency;
  for (const [rx, rep] of rules) {
    if (rx.test(out)) {
      out = out.replace(rx, rep);
      changedCount++;
    }
  }

  // Synonym replacement based on intensity (25% -> 1 in 4 eligible words, 100% -> all eligible words)
  const threshold = Math.max(0.25, Math.min(1, Number(intensity || 50) / 100));
  const modeTier = mode === "academic" ? 3 : mode === "formal" ? 2 : mode === "creative" ? 4 : mode === "concise" ? 0 : 1;

  const tokens = out.split(/(\b[A-Za-z]+\b)/);
  let eligibleIdx = 0;

  const transformedTokens = tokens.map((tok) => {
    if (!/^[A-Za-z]+$/.test(tok)) return tok;
    const lower = tok.toLowerCase();
    const syns = SYNONYM_LEXICON[lower];
    if (!syns || syns.length === 0) return tok;

    eligibleIdx++;
    // Deterministic sampling driven by intensity
    const pickRatio = ((eligibleIdx * 37) % 100) / 100;
    if (pickRatio <= threshold) {
      const chosen = syns[Math.min(modeTier, syns.length - 1)];
      changedCount++;
      if (tok[0] === tok[0].toUpperCase()) {
        return chosen.charAt(0).toUpperCase() + chosen.slice(1);
      }
      return chosen;
    }
    return tok;
  });

  out = transformedTokens.join("").replace(/\s{2,}/g, " ").trim();

  // Mode-specific sentence framing if intensity >= 75
  if (Number(intensity) >= 75 && out.length > 20) {
    if (mode === "academic" && !/^(Notably|Specifically|Empirically)/i.test(out)) {
      out = "Notably, " + out.charAt(0).toLowerCase() + out.slice(1);
      changedCount++;
    } else if (mode === "creative" && !/✨|—/.test(out)) {
      out = out.replace(/\.$/, " — unlocking far greater clarity and momentum.");
      changedCount++;
    }
  }

  return {
    output: out,
    changedCount,
    mode,
    intensity: Number(intensity || 50)
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "QUILL_PARAPHRASE") {
    const res = paraphraseEngine(msg.text || "", msg.mode || "fluency", msg.intensity || 50);
    sendResponse({ ok: true, ...res });
    return false;
  }

  if (msg && msg.type === "QUILL_SYNONYMS" && msg.word) {
    const clean = String(msg.word).trim().toLowerCase();
    const localSyns = SYNONYM_LEXICON[clean] || [];
    fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(clean)}&max=8`)
      .then((r) => r.json())
      .then((data) => {
        const apiSyns = Array.isArray(data) ? data.map((d) => d.word) : [];
        const merged = Array.from(new Set([...localSyns, ...apiSyns])).slice(0, 8);
        sendResponse({ ok: true, word: clean, synonyms: merged });
      })
      .catch(() => {
        sendResponse({ ok: true, word: clean, synonyms: localSyns });
      });
    return true;
  }
});
