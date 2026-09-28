// ICEBERG: membre
import { readFileSync } from "node:fs";
import { sh, printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReportHeader, imprimerPlanDaction } from "./report-template.mjs";
import { buildPlanDaction, PLAN_ACTION_TITRE } from "./report-template.mjs";

// CHECK-LEVEL-TARGET (2026-09-19, cf. docs/check-level-target-blueprint.md et
// docs/referentiel/check-level-target.md). Calcule le niveau de vérification qu'une demande
// appelle réellement, et la combinaison d'outils à déployer — remplace la façon informelle,
// au cas par cas, de choisir les outils. Nommé par l'utilisateur lui-même.
//
// Heuristique honnête (comme detectDistress/detectNegotiationOffer dans lib/life.ts) : une
// reconnaissance de motifs sur le texte de la demande, jamais une vraie compréhension de
// l'intention. Ne tranche jamais seul en cas de vrai doute (marge de confiance étroite) — signale
// et laisse confirmer.

// ————————————————————————————————————————————————————————————————————————
// LE MODE RÉPARATION — la zone rouge (2026-09-28, tâche #695, volet D des « failles des IA »)
// ————————————————————————————————————————————————————————————————————————
//
// LE CHIFFRE : plus de 65 % des incidents graves surviennent en CORRECTION et en CONFIGURATION,
// pas en écriture de fonctionnalité. Notre outillage, lui, est tourné vers la construction.
//
// ET LE DÉFAUT ÉTAIT ICI, NOIR SUR BLANC : `corrige` et `fix` vivaient dans le registre LÉGER.
// Autrement dit, cet outil ABAISSAIT la vigilance attendue sur très exactement la zone que la
// mesure désigne comme la plus dangereuse. Ce n'est pas un oubli de vocabulaire, c'est une
// inversion : le mot qui devrait alerter était celui qui rassurait.
//
// LA CORRECTION EST UN PLANCHER, JAMAIS UN SAUT DE NIVEAU. Une demande de réparation ou de
// configuration ne peut plus descendre sous `standard` — le niveau où les Gardiens sacrés du code
// tournent de toute façon, donc un plancher qui ne coûte rien. Relever d'office à `approfondi`
// aurait été l'erreur symétrique : un outil qui crie à chaque correction cesse d'être lu (L4).
//
// L'EXEMPTION EST NOMMÉE, ET ELLE EST LA MOITIÉ DE LA RÈGLE : une coquille ou un renommage sont
// des réparations sans risque. Quand ce sont les SEULS signaux présents, le niveau léger reste
// mérité. Sans cette exemption, le plancher s'appliquerait à tout et deviendrait du décor.
const SIGNAUX_MODE_REPARATION = [
  /\bcorrige\b/i, /\bcorriger\b/i, /\bcorrectif\b/i, /\bfix\b/i, /\br[ée]pare\b/i, /\bd[ée]bug/i,
  /\br[ée]gression\b/i, /\bbug\b/i, /\bplantage\b/i, /\bcasse\b/i,
  /\bconfigure\b/i, /\bconfiguration\b/i, /\bparam[èe]tre\b/i, /\bvariable d'environnement\b/i,
  /\.env\b/i, /\bd[ée]ploie/i, /\bd[ée]ploiement\b/i,
];

// Les réparations sans risque : quand elles sont SEULES, le plancher ne s'applique pas.
// « faute de frappe » a été OUBLIÉE au premier jet, et c'est le filet qui l'a dit : une assertion
// existante exigeait que « corrige cette faute de frappe » reste légère, et elle avait raison. Une
// liste d'exemptions incomplète ne se répare pas en desserrant le test qui la trouve.
const REPARATIONS_SANS_RISQUE = [/\btypo\b/i, /\bcoquille\b/i, /faute de frappe/i, /\brenomme\b/i, /\brenommage\b/i];

export const PLANCHER_MODE_REPARATION = "standard";

// modeReparation() — la demande relève-t-elle de la zone rouge, et faut-il relever le plancher ?
// Elle rend aussi POURQUOI, parce qu'un niveau relevé sans raison lisible se lit comme un caprice
// de l'outil et finit par être contourné.
export function modeReparation(text) {
  const t = String(text ?? "");
  const signaux = SIGNAUX_MODE_REPARATION.filter((re) => re.test(t));
  if (!signaux.length) return { enZoneRouge: false };
  const sansRisque = REPARATIONS_SANS_RISQUE.some((re) => re.test(t));
  // « Corrige la typo » : le seul signal de risque est le mot « corrige », et la demande dit
  // elle-même de quoi il retourne. Le plancher ne s'applique pas — mais la zone rouge est quand
  // même SIGNALÉE, parce que la reconnaissance de motifs peut se tromper et que le lecteur doit
  // pouvoir en juger.
  if (sansRisque && signaux.length <= 1) {
    return { enZoneRouge: true, plancher: null, pourquoi: "réparation déclarée sans risque (coquille ou renommage) — le plancher ne s'applique pas, mais la zone reste nommée : ce jugement vient d'une reconnaissance de motifs, jamais d'une compréhension de la demande" };
  }
  return {
    enZoneRouge: true,
    plancher: PLANCHER_MODE_REPARATION,
    pourquoi: "MODE RÉPARATION : plus de 65 % des incidents graves surviennent en correction et en configuration, pas en écriture de fonctionnalité — et l'outillage de ce projet est tourné vers la construction. Le niveau ne descend donc pas sous « standard », où les Gardiens sacrés du code tournent de toute façon",
  };
}

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
  standard: { tools: ["check-house.mjs", "ARGUS (mécanique)", "HARMONIA (mécanique)", "AXA-CHECK", "CLEAN-DIRTY-OLD (mécanique)"], cost: "gratuit" },
  approfondi: { tools: ["check-house.mjs", "ARGUS", "HARMONIA", "check-spirit.mjs", "check-profile.mjs"], cost: "réel — consulter Smart Conso API avant de lancer" },
  exceptionnel: { tools: ["HYPER-SCAN-CHECKPOINT (version complète)", "ALWAYS-NEW-CODE (zoom profond)"], cost: "réel — consulter Smart Conso API avant de lancer" },
};

// Exporté (2026-09-19) pour qu'AXA-CHECK réutilise la même échelle de profondeur pour son nouveau
// système de "vérification par les outils", jamais une seconde liste de niveaux redéfinie à côté
// (règle anti-doublon, docs/regles-de-travail.md §7ter).
export const LEVEL_ORDER = ["leger", "standard", "approfondi", "exceptionnel"];

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

  const reparation = modeReparation(text);
  if (topScore === 0) {
    return appliquerPlancherDeReparation({
      level: "standard",
      confidence: "faible",
      needsConfirmation: false,
      reasoning: "Aucun signal explicite détecté dans la demande — niveau par défaut pour un travail de code ordinaire (cf. Article 20 : ARGUS/HARMONIA tournent de toute façon à chaque changement).",
      ...TOOLS_BY_LEVEL.standard,
    }, reparation);
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

  return appliquerPlancherDeReparation({
    level: top,
    confidence: needsConfirmation ? "doute réel" : "claire",
    needsConfirmation,
    reasoning: (needsConfirmation
      ? `Signaux comparables entre "${top}" et "${second}" (marge ${Math.round(margin * 100)}%) — les deux niveaux impliquent des outils/coûts différents, confirmation nécessaire avant d'agir.`
      : `Signaux les plus forts pour le niveau "${top}".`) + flavorNote,
    ...toolsInfo,
  }, reparation);
}

// appliquerPlancherDeReparation() — le plancher RELÈVE, jamais ne rabaisse. Une demande déjà
// classée « approfondi » reste approfondie : un plancher qui plafonnerait aussi serait un
// nivellement, et perdrait exactement l'information qu'on cherche à gagner.
//
// Et il ne s'applique JAMAIS en silence : le niveau relevé porte sa raison chiffrée dans le
// `reasoning`. Un outil qui remonte un niveau sans dire pourquoi se fait contourner à la deuxième
// fois — c'est déjà la règle de la pression de registre juste en dessous, et elle vaut ici aussi.
export function appliquerPlancherDeReparation(resultat, reparation) {
  if (!reparation?.enZoneRouge) return resultat;
  const note = ` ⚙️ ${reparation.pourquoi}.`;
  if (!reparation.plancher) return { ...resultat, reasoning: resultat.reasoning + note, zoneRouge: true };
  const iActuel = LEVEL_ORDER.indexOf(resultat.level);
  const iPlancher = LEVEL_ORDER.indexOf(reparation.plancher);
  if (iActuel >= iPlancher) return { ...resultat, reasoning: resultat.reasoning + note, zoneRouge: true };
  return {
    ...resultat,
    level: reparation.plancher,
    confidence: resultat.confidence === "claire" ? "claire" : resultat.confidence,
    reasoning: `${resultat.reasoning} ⚙️ Niveau RELEVÉ de « ${resultat.level} » à « ${reparation.plancher} » — ${reparation.pourquoi}.`,
    zoneRouge: true,
    releveParLeModeReparation: true,
    ...TOOLS_BY_LEVEL[reparation.plancher],
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

// Garde-fou de fraîcheur (2026-09-21, même audit d'évolutivité que THEMES d'ALWAYS-NEW-CODE) : le
// commentaire ci-dessus promet une synchronisation avec harmonia.md sans qu'aucune vérification
// mécanique n'existe. `extractHarmoniaSensitiveNodes()` relit tel quel la section « Nœuds
// sensibles identifiés » de harmonia.md, `findSensitiveNodesDivergingFromHarmonia()` rapporte les
// deux sens de l'écart (jamais un seul silencieusement privilégié).
export function extractHarmoniaSensitiveNodes(harmoniaMdText) {
  const text = String(harmoniaMdText ?? "");
  const start = text.indexOf("## Nœuds sensibles identifiés");
  if (start === -1) return [];
  const rest = text.slice(start + 1);
  const nextHeading = rest.search(/\n## /);
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  const nodes = [];
  for (const m of section.matchAll(/^- \*\*`([^`]+)`\*\*/gm)) nodes.push(m[1].trim());
  return nodes;
}

export function findSensitiveNodesDivergingFromHarmonia(harmoniaMdText, nodes = SENSITIVE_NODES) {
  const harmoniaNodes = extractHarmoniaSensitiveNodes(harmoniaMdText);
  const nodeSet = new Set(nodes.map((n) => n.node));
  const harmoniaSet = new Set(harmoniaNodes);
  return {
    missingFromHere: harmoniaNodes.filter((n) => !nodeSet.has(n)),
    missingFromHarmonia: nodes.map((n) => n.node).filter((n) => !harmoniaSet.has(n)),
  };
}

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
  recordCliUsage("check-level-target");
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
  try {
    const harmoniaMdText = readFileSync(new URL("../docs/referentiel/harmonia.md", import.meta.url), "utf8");
    const divergence = findSensitiveNodesDivergingFromHarmonia(harmoniaMdText);

    // LE PLAN D'ACTION (2026-09-23, tâche #211). Cet outil calcule le niveau de vérification
    // ATTENDU avant un changement — un conseil, jamais un constat. Il n'a donc qu'un seul vrai
    // constat à porter, et c'est un garde-fou d'évolutivité (Article 24) : sa liste de nœuds
    // sensibles est DÉRIVÉE de la carte HARMONIA, et si les deux divergent, le niveau qu'il
    // recommande est calculé sur une carte périmée.
    //
    // `fausseUneMesure: true` sans hésitation : ce n'est pas l'outil qui se trompe, c'est tout ce
    // qu'il conseille ensuite qui devient faux.
    const planNiveau = buildPlanDaction([
      ...(divergence?.missingFromSensitive ?? []).map((n) => ({ constat: `nœud « ${n} » présent dans harmonia.md, absent de SENSITIVE_NODES`, etat: "retenu", fausseUneMesure: true,
        tache: `ajouter « ${n} » aux nœuds sensibles, sinon un changement qui le touche sera sous-évalué` })),
      ...(divergence?.missingFromHarmonia ?? []).map((n) => ({ constat: `nœud « ${n} » déclaré sensible, absent de harmonia.md`, etat: "retenu", fausseUneMesure: true,
        tache: `documenter « ${n} » dans harmonia.md, ou le retirer des nœuds sensibles` })),
    ], { toolSlug: "check-level-target" });
    imprimerPlanDaction(planNiveau);
    if (divergence.missingFromHere.length || divergence.missingFromHarmonia.length) {
      console.log("⚠️  SENSITIVE_NODES a divergé de harmonia.md (garde-fou de fraîcheur, 2026-09-21) :");
      if (divergence.missingFromHere.length) console.log(`   présent dans harmonia.md, absent d'ici : ${divergence.missingFromHere.join(", ")}`);
      if (divergence.missingFromHarmonia.length) console.log(`   présent ici, absent de harmonia.md : ${divergence.missingFromHarmonia.join(", ")}`);
      console.log("");
    }
  } catch {}
  printReportHeader({ tool: "check-level-target", title: "CHECK-LEVEL-TARGET", scriptPath: "scripts/check-level-target.mjs" });
  console.log(`Niveau retenu : ${result.level.toUpperCase()} (confiance : ${result.confidence})`);
  console.log(`Raison : ${result.reasoning}`);
  console.log(`Outils recommandés : ${result.tools.join(", ")}`);
  console.log(`Coût : ${result.cost}`);
  if (result.needsConfirmation) console.log("\n⚠️  Confirmation recommandée avant de lancer quoi que ce soit.");

  try {
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
