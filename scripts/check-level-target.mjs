import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

// CHECK-LEVEL-TARGET (2026-09-19, cf. docs/check-level-target-blueprint.md et
// docs/referentiel/check-level-target.md). Calcule le niveau de vérification qu'une demande
// appelle réellement, et la combinaison d'outils à déployer — remplace la façon informelle,
// au cas par cas, de choisir les outils. Nommé par l'utilisateur lui-même.
//
// Heuristique honnête (comme detectDistress/detectNegotiationOffer dans lib/life.ts) : une
// reconnaissance de motifs sur le texte de la demande, jamais une vraie compréhension de
// l'intention. Ne tranche jamais seul en cas de vrai doute (marge de confiance étroite) — signale
// et laisse confirmer.

const SIGNALS = {
  leger: [
    /\bcorrige\b/i, /\bfix\b/i, /\btypo\b/i, /\brenomme\b/i, /petit changement/i,
  ],
  standard: [
    /\bv[ée]rifie\b/i, /\bteste\b/i, /assure[- ]toi que (ça|cela) (marche|fonctionne)/i,
    /\bcoh[ée]rent\b/i, /\bregression\b/i,
  ],
  approfondi: [
    /v[ée]rification\s+(en\s+)?approfondie/i, /en profondeur/i, /\baudit\b/i,
    /\bexhaustif|exhaustive\b/i, /toutes les combinaisons/i, /tous les cas/i,
    /\bpouss[ée]e?\b/i, /v[ée]rifie (tout|bien tout)/i, /identifie les [ée]carts/i,
    /bugs? potentiels?/i, /bugs? latents?/i,
  ],
  exceptionnel: [], // rempli juste après : bugs + structure, pour permettre un "flavor" par signal
};

// Niveau "exceptionnel" : deux registres bien distincts, ajoutés le même jour mais jamais
// fusionnés (2026-09-19, ALWAYS-NEW-CODE) — la recherche de bugs cachés (HYPER-SCAN-CHECKPOINT)
// et la remise en cause de la structure (ALWAYS-NEW-CODE) sont deux besoins différents, même si
// tous deux sont rares/coûteux et restent au même niveau (décision explicite de l'utilisateur :
// pas de 5e niveau séparé). Chaque registre est vérifié indépendamment pour recommander le bon
// outil — voire les deux si les deux registres sont détectés dans la même demande.
const EXCEPTIONNEL_BUG_SIGNALS = [
  /hyper[- ]scan/i, /machine de guerre/i, /v[ée]rification exceptionnelle/i,
  /depuis le d[ée]but/i, /r[ée]cris tout l'historique/i, /double perspective/i,
  /audit complet du (code|projet)/i,
];
const EXCEPTIONNEL_STRUCTURE_SIGNALS = [
  /reconstruire.{0,40}(z[ée]ro|scratch)/i, /(re)?partir de z[ée]ro/i, /grands axes/i,
  /codé?e?s? (de fa[çc]on )?empil[ée]e?s?|empilement/i, /restructur/i,
  /r[ée]organiser (le |la |tout(e)? )?(le |la )?(code|projet|structure)/i,
  /always[- ]new[- ]code|toujours[- ]new[- ]code|code (comme neuf|"?comme neuf"?)/i,
];
SIGNALS.exceptionnel = [...EXCEPTIONNEL_BUG_SIGNALS, ...EXCEPTIONNEL_STRUCTURE_SIGNALS];

const WEIGHTS = { leger: 1, standard: 1, approfondi: 2, exceptionnel: 3 };

const TOOLS_BY_LEVEL = {
  leger: { tools: ["check-house.mjs"], cost: "gratuit" },
  standard: { tools: ["check-house.mjs", "ARGUS (mécanique)", "HARMONIA (mécanique)"], cost: "gratuit" },
  approfondi: { tools: ["check-house.mjs", "ARGUS", "HARMONIA", "check-spirit.mjs", "check-profile.mjs"], cost: "réel — consulter Smart Conso API avant de lancer" },
  exceptionnel: { tools: ["HYPER-SCAN-CHECKPOINT (version complète)", "ALWAYS-NEW-CODE (zoom profond)"], cost: "réel — consulter Smart Conso API avant de lancer" },
};

const LEVEL_ORDER = ["leger", "standard", "approfondi", "exceptionnel"];

// Marge de confiance sous laquelle on considère qu'il y a un vrai doute entre les deux niveaux les
// plus probables — pas juste le meilleur score en absolu, mais l'ÉCART avec le second (blueprint,
// "confirmation seulement en cas de vrai doute").
const CONFIRMATION_MARGIN = 0.25;

export function classifyCheckLevel(text) {
  const scores = {};
  for (const level of LEVEL_ORDER) {
    const matches = SIGNALS[level].filter((re) => re.test(text));
    scores[level] = matches.length * WEIGHTS[level];
  }
  const ranked = LEVEL_ORDER.slice().sort((a, b) => scores[b] - scores[a]);
  const top = ranked[0], second = ranked[1];
  const topScore = scores[top], secondScore = scores[second];

  if (topScore === 0) {
    return {
      level: "standard",
      confidence: "faible",
      needsConfirmation: false,
      reasoning: "Aucun signal explicite détecté dans la demande — niveau par défaut pour un travail de code ordinaire (cf. Article 20 : ARGUS/HARMONIA tournent de toute façon à chaque changement).",
      ...TOOLS_BY_LEVEL.standard,
    };
  }

  const margin = (topScore - secondScore) / topScore;
  const needsConfirmation = margin < CONFIRMATION_MARGIN && LEVEL_ORDER.indexOf(top) !== LEVEL_ORDER.indexOf(second);

  let toolsInfo = TOOLS_BY_LEVEL[top];
  let flavorNote = "";
  if (top === "exceptionnel") {
    const bugMatch = EXCEPTIONNEL_BUG_SIGNALS.some((re) => re.test(text));
    const structureMatch = EXCEPTIONNEL_STRUCTURE_SIGNALS.some((re) => re.test(text));
    const tools = [];
    if (bugMatch) tools.push("HYPER-SCAN-CHECKPOINT (version complète)");
    if (structureMatch) tools.push("ALWAYS-NEW-CODE (zoom profond)");
    if (tools.length) {
      toolsInfo = { tools, cost: TOOLS_BY_LEVEL.exceptionnel.cost };
      flavorNote = bugMatch && structureMatch
        ? " Signaux des deux registres détectés (bugs cachés ET restructuration) — les deux outils sont recommandés."
        : bugMatch
        ? " Registre \"bugs cachés\" détecté."
        : " Registre \"restructuration\" détecté (cf. ALWAYS-NEW-CODE, Article 23).";
    }
  }

  return {
    level: top,
    confidence: needsConfirmation ? "doute réel" : "claire",
    needsConfirmation,
    reasoning: (needsConfirmation
      ? `Signaux comparables entre "${top}" et "${second}" (marge ${Math.round(margin * 100)}%) — les deux niveaux impliquent des outils/coûts différents, confirmation nécessaire avant d'agir.`
      : `Signaux les plus forts pour le niveau "${top}".`) + flavorNote,
    ...toolsInfo,
  };
}

// --- Vue d'ensemble du réseau (2026-09-19, demande explicite de l'utilisateur : « je voudrais que
// cet outil serve à centraliser le réseau des outils de vérification ») ---------------------
//
// Décision actée avec l'utilisateur : CHECK-LEVEL-TARGET reste un conseiller, jamais un chef
// d'orchestre (ce rôle appartient déjà à HYPER-SCAN-CHECKPOINT, qui appelle réellement ARGUS et
// HARMONIA). Mais un conseiller peut être mieux informé : au lieu de juger SEULEMENT le texte de
// la demande du jour, il regarde aussi ce que le reste du réseau sait déjà être en suspens
// (docs/referentiel/points-fragiles.md, le registre le plus structuré et déjà compté ailleurs par
// scripts/kpi-report.mjs — ARGUS/HARMONIA restent volontairement hors de ce calcul pour l'instant,
// leurs registres en prose ne permettent pas encore de distinguer de façon fiable un point encore
// ouvert d'un point déjà refermé, cf. limite honnête ci-dessous).
//
// Jamais un niveau relevé en silence : une pression de registre élevée déclenche seulement une
// DEMANDE DE CONFIRMATION (même principe que la marge de confiance étroite ci-dessus), jamais un
// niveau imposé sans que l'agent/l'utilisateur en soit informé.
const REGISTRY_PRESSURE_THRESHOLD = 5; // calibré arbitrairement à la création, à ajuster à l'usage

export function countOpenFragilePoints(pointsFragilesText) {
  const start = pointsFragilesText.indexOf("## Points ouverts");
  if (start === -1) return 0;
  const rest = pointsFragilesText.slice(start + "## Points ouverts".length);
  const nextHeading = rest.search(/\n##\s/);
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  return (section.match(/^- /gm) || []).length;
}

export function combineWithRegistryPressure(result, openCount) {
  if (!openCount || openCount < REGISTRY_PRESSURE_THRESHOLD || result.level === "exceptionnel") return result;
  return {
    ...result,
    needsConfirmation: true,
    reasoning: result.reasoning + ` Par ailleurs, ${openCount} points fragiles restent ouverts dans le registre (docs/referentiel/points-fragiles.md), indépendamment du texte de cette demande précise — veux-tu qu'ils soient pris en compte dans le niveau de vérification à déployer ?`,
  };
}

// --- Rappel de test approfondi sur les nœuds sensibles (2026-09-19, demande explicite de
// l'utilisateur : « un des outils nous rappelle quand des tests approfondis sont nécessaires, même
// si pas obligatoires ») ------------------------------------------------------------------------
//
// Reprend tel quel la carte des « nœuds sensibles » déjà identifiée par HARMONIA
// (docs/referentiel/harmonia.md — beaucoup de dépendants, risqués à toucher sans vérification
// complète), jamais une seconde carte inventée à part (Article 13). Tourne à chaque changement de
// code, comme ARGUS/HARMONIA (décision explicite de l'utilisateur) — jamais bloquant, jamais
// obligatoire en soi : un rappel, pas une porte fermée.
export const SENSITIVE_NODES = [
  { node: "needs.fatigue", files: ["lib/simulation.ts"] },
  { node: "story.round", files: ["lib/story.ts", "lib/turn.ts", "lib/daynight.ts"] },
  { node: "life.appreciation", files: ["app/api/lia/route.ts", "lib/life.ts"] },
];

export function recentlyChangedSensitiveNodes(changedFiles, nodes = SENSITIVE_NODES) {
  if (!changedFiles || !changedFiles.length) return [];
  const hits = [];
  for (const { node, files } of nodes) {
    const matched = files.filter((f) => changedFiles.includes(f));
    if (matched.length) hits.push({ node, files: matched });
  }
  return hits;
}

function main() {
  const text = process.argv.slice(2).join(" ");
  if (!text) {
    console.log("Usage: node scripts/check-level-target.mjs <texte de la demande>");
    process.exit(1);
  }
  let result = classifyCheckLevel(text);
  try {
    const pointsFragilesText = readFileSync(new URL("../docs/referentiel/points-fragiles.md", import.meta.url), "utf8");
    result = combineWithRegistryPressure(result, countOpenFragilePoints(pointsFragilesText));
  } catch {}
  console.log("=== CHECK-LEVEL-TARGET ===\n");
  console.log(`Niveau retenu : ${result.level.toUpperCase()} (confiance : ${result.confidence})`);
  console.log(`Raison : ${result.reasoning}`);
  console.log(`Outils recommandés : ${result.tools.join(", ")}`);
  console.log(`Coût : ${result.cost}`);
  if (result.needsConfirmation) console.log("\n⚠️  Confirmation recommandée avant de lancer quoi que ce soit.");

  try {
    const sh = (cmd) => { try { return execSync(cmd, { encoding: "utf8" }); } catch { return ""; } };
    const changed = new Set([
      ...sh("git diff --name-only HEAD").split("\n"),
      ...sh("git diff --name-only HEAD~1 HEAD 2>/dev/null").split("\n"),
    ].map((f) => f.trim()).filter(Boolean));
    const hits = recentlyChangedSensitiveNodes([...changed]);
    if (hits.length) {
      console.log("\n📎 Rappel (jamais bloquant) : des changements récents touchent un nœud sensible d'HARMONIA :");
      for (const h of hits) console.log(`   - ${h.node} via ${h.files.join(", ")} — un test approfondi de ce nœud est recommandé, même si le niveau ci-dessus suffit sur le texte seul.`);
    }
  } catch {}
}

if (import.meta.url === `file://${process.argv[1]}`) main();
