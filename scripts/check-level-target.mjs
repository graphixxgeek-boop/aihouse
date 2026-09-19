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
  exceptionnel: [
    /hyper[- ]scan/i, /machine de guerre/i, /v[ée]rification exceptionnelle/i,
    /depuis le d[ée]but/i, /r[ée]cris tout l'historique/i, /double perspective/i,
    /audit complet du (code|projet)/i,
  ],
};

const WEIGHTS = { leger: 1, standard: 1, approfondi: 2, exceptionnel: 3 };

const TOOLS_BY_LEVEL = {
  leger: { tools: ["check-house.mjs"], cost: "gratuit" },
  standard: { tools: ["check-house.mjs", "ARGUS (mécanique)", "HARMONIA (mécanique)"], cost: "gratuit" },
  approfondi: { tools: ["check-house.mjs", "ARGUS", "HARMONIA", "check-spirit.mjs", "check-profile.mjs"], cost: "réel — consulter Smart Conso API avant de lancer" },
  exceptionnel: { tools: ["HYPER-SCAN-CHECKPOINT (version complète)"], cost: "réel — consulter Smart Conso API avant de lancer" },
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

  return {
    level: top,
    confidence: needsConfirmation ? "doute réel" : "claire",
    needsConfirmation,
    reasoning: needsConfirmation
      ? `Signaux comparables entre "${top}" et "${second}" (marge ${Math.round(margin * 100)}%) — les deux niveaux impliquent des outils/coûts différents, confirmation nécessaire avant d'agir.`
      : `Signaux les plus forts pour le niveau "${top}".`,
    ...TOOLS_BY_LEVEL[top],
  };
}

function main() {
  const text = process.argv.slice(2).join(" ");
  if (!text) {
    console.log("Usage: node scripts/check-level-target.mjs <texte de la demande>");
    process.exit(1);
  }
  const result = classifyCheckLevel(text);
  console.log("=== CHECK-LEVEL-TARGET ===\n");
  console.log(`Niveau retenu : ${result.level.toUpperCase()} (confiance : ${result.confidence})`);
  console.log(`Raison : ${result.reasoning}`);
  console.log(`Outils recommandés : ${result.tools.join(", ")}`);
  console.log(`Coût : ${result.cost}`);
  if (result.needsConfirmation) console.log("\n⚠️  Confirmation recommandée avant de lancer quoi que ce soit.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
