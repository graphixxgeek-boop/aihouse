// TOOL-LEARNING (2026-09-22, nom donné par l'utilisateur) — l'apprentissage de l'outillage, et le
// mien à son égard.
//
// L'HARMONISATION AVEC SAFE-EXPORT, demandée explicitement, tombe d'elle-même dès qu'on relit la
// définition que l'utilisateur a donnée de l'évolutivité : « à la fois pouvoir etre exporté, en
// meme temps avec des capacités accrues grace à l'apprentissage ». Ce sont DEUX MOITIÉS d'un seul
// principe, et chacune a désormais son outil :
//
//   évolutivité, moitié 1 — POUVOIR PARTIR        → SAFE-EXPORT   (est-ce transposable ailleurs ?)
//   évolutivité, moitié 2 — DEVENIR MEILLEUR      → TOOL-LEARNING (est-ce que ça progresse ?)
//
// Ce n'est pas un découpage inventé pour justifier deux outils : c'est la phrase elle-même, coupée
// à sa jointure. Un outil parfaitement exportable et parfaitement figé satisfait la première moitié
// et rate la seconde — et l'inverse est vrai aussi.
//
// LE LIEN CONCRET entre les deux, au-delà de la symétrie : la mémoire de SAFE-EXPORT est elle-même
// un signal d'apprentissage que TOOL-LEARNING lit. Un outil dont les mêmes écarts reviennent
// passage après passage n'apprend pas, quoi qu'il archive par ailleurs.
//
// LA FRONTIÈRE AVEC CASSANDRA, tranchée par l'utilisateur : elle juge l'ÉTAT et les MOYENS (ce
// membre a-t-il mémoire, rapports, évolutivité ? a-t-il tout pour réussir ?), celui-ci juge la
// TRAJECTOIRE et l'USAGE (s'en sert-il ? est-il meilleur qu'avant ?). La distinction tient sur un
// fait simple et vérifiable : un outil peut avoir une mémoire et ne jamais la relire. CASSANDRA le
// verrait équipé, TOOL-LEARNING le voit immobile. Mémoire ≠ apprentissage.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// LES QUATRE PREUVES — toutes retenues. Elles sont volontairement de natures différentes : deux
// mesurent ce que l'outil fait SEUL, une mesure ce que je lui apporte, une mesure sa fiabilité. Un
// outil qui n'en satisfait qu'une seule n'apprend pas vraiment, il excelle sur un axe.
//
// `nature` porte la distinction que l'utilisateur a lui-même posée en disant « un peu comme
// eco-token, tu eduques les outils petit à petit, EN PLUS qu'ils s'eduquent eux-memes » : les deux
// existent, ils ne se remplacent pas, et les confondre donnerait un outil très corrigé pour un
// outil qui apprend. Un outil beaucoup corrigé n'apprend pas — il est enseigné.
export const PREUVES = [
  {
    id: "relit-sa-memoire", nature: "autonome", poids: "la plus dure à contester",
    quoi: "son code lit vraiment le registre qu'il écrit",
    pourquoi: "c'est la preuve la plus facile à vérifier mécaniquement — et aujourd'hui la plupart des outils écrivent sans jamais relire, donc archivent au lieu d'apprendre",
  },
  {
    id: "taux-de-trouvaille", nature: "autonome", poids: "vraie mesure de progrès",
    quoi: "il trouve proportionnellement plus de vrais problèmes qu'avant",
    pourquoi: "mesure un progrès réel, avec un piège déclaré : un outil qui ne trouve plus rien parce que le CODE s'est amélioré paraîtrait régresser — la baisse se lit donc toujours à côté de l'état du code, jamais seule",
  },
  {
    id: "faux-positifs-en-baisse", nature: "autonome", poids: "fiabilité",
    quoi: "il se trompe moins au fil du temps",
    pourquoi: "exactement ce qui s'est produit trois fois le 2026-09-22 — un détecteur corrigé après son premier vrai passage. Encore faut-il que les faux positifs soient ENREGISTRÉS, sinon rien ne se compare",
  },
  {
    id: "enrichi-par-l-agent", nature: "enseigné", poids: "mesure MON apport, pas le sien",
    quoi: "une trace montre que l'agent l'a corrigé ou enrichi, avec la raison",
    pourquoi: "c'est le rôle propre de cet outil — vérifier que j'aide vraiment les outils à progresser. Mais ça ne se confond jamais avec les trois autres : un outil beaucoup corrigé est enseigné, pas apprenant",
  },
];

export const VERDICTS = ["apprend", "archive seulement", "immobile", "pas assez de recul"];

// jugerUnOutil() — le verdict par outil. Les deux natures sont comptées SÉPARÉMENT, sans quoi un
// outil que j'aurais beaucoup corrigé passerait pour apprenant alors qu'il n'a rien fait seul.
export function jugerUnOutil(outil, { preuves = {}, passages = 0, minPassages = 3 } = {}) {
  const autonomes = PREUVES.filter((p) => p.nature === "autonome" && preuves[p.id] === true);
  const enseigne = preuves["enrichi-par-l-agent"] === true;
  if (passages < minPassages) {
    return { outil, verdict: "pas assez de recul", autonomes: autonomes.length, enseigne, detail: `${passages} passage(s) — il en faut ${minPassages} avant de juger une trajectoire` };
  }
  if (autonomes.length >= 2) return { outil, verdict: "apprend", autonomes: autonomes.length, enseigne, detail: `${autonomes.length} preuve(s) autonome(s) : ${autonomes.map((p) => p.id).join(", ")}` };
  // ARCHIVE SEULEMENT : il a une mémoire et il ne s'en sert pas. C'est le cas que CASSANDRA ne peut
  // pas voir — elle constaterait une mémoire présente et le déclarerait équipé.
  if (preuves["relit-sa-memoire"] === false && preuves["a-une-memoire"] === true) {
    return { outil, verdict: "archive seulement", autonomes: autonomes.length, enseigne, detail: "il écrit un registre qu'il ne relit jamais — équipé pour apprendre, et immobile" };
  }
  return { outil, verdict: "immobile", autonomes: autonomes.length, enseigne, detail: enseigne ? "il n'a progressé que par mes corrections, jamais de lui-même — enseigné, pas apprenant" : "aucune preuve d'apprentissage, ni autonome ni enseigné" };
}

// ————————————————————————————————————————————————————————————————————————
// SON PROPRE APPRENTISSAGE — « lui aussi apprend, par définition »
// ————————————————————————————————————————————————————————————————————————
//
// Son choix, et c'est le seul des trois proposés qui ne soit pas une posture : il ENREGISTRE ses
// verdicts et vérifie ensuite s'ils se confirment. Quand il a dit « cet outil n'apprend pas » et
// que l'outil progresse ensuite SANS aucune intervention de ma part, c'est son critère qui était
// mauvais — pas l'outil.
//
// Pourquoi c'est mieux que d'ajuster ses seuils tout seul : un outil qui déplace ses propres
// critères finit par se rendre toujours satisfait de lui-même, et plus personne ne sait ce qu'il
// mesure. Ici il ne bouge rien : il constate que son jugement passé était faux, et le dit.
export const VERDICTS_FILE = "docs/tool-learning/verdicts.json";

export function loadVerdicts({ root = ROOT, readFileImpl = readFileSync } = {}) {
  try {
    const b = JSON.parse(readFileImpl(join(root, VERDICTS_FILE), "utf8"));
    return Array.isArray(b) ? b : [];
  } catch {
    return [];
  }
}

export function enregistrerVerdict(verdict, { root = ROOT, readFileImpl = readFileSync, writeFileImpl = writeFileSync, date = new Date().toISOString().slice(0, 10) } = {}) {
  const tous = loadVerdicts({ root, readFileImpl });
  const suivants = [...tous, { ...verdict, date }];
  writeFileImpl(join(root, VERDICTS_FILE), JSON.stringify(suivants, null, 1));
  return suivants;
}

// verifierSesPropresVerdicts() — l'auto-correction. Un verdict « immobile » suivi d'un progrès
// autonome, sans correction de ma part entre les deux, est un verdict RÉFUTÉ : le critère a raté
// quelque chose.
//
// La condition « sans correction de ma part » est essentielle et facile à oublier : si j'ai corrigé
// l'outil entre les deux passages, son progrès ne réfute rien — il confirme au contraire que le
// verdict était juste, puisqu'il a fallu intervenir.
export function verifierSesPropresVerdicts(historique = []) {
  const parOutil = new Map();
  for (const v of historique) {
    if (!parOutil.has(v.outil)) parOutil.set(v.outil, []);
    parOutil.get(v.outil).push(v);
  }
  const refutes = [];
  for (const [outil, suite] of parOutil) {
    for (let i = 1; i < suite.length; i++) {
      const avant = suite[i - 1];
      const apres = suite[i];
      if ((avant.verdict === "immobile" || avant.verdict === "archive seulement") && apres.verdict === "apprend" && !apres.enseigne) {
        refutes.push({
          outil,
          quand: `${avant.date} → ${apres.date}`,
          pourquoi: `jugé « ${avant.verdict} » puis apprenant sans aucune intervention de ma part — c'est le critère qui a raté quelque chose, pas l'outil qui a changé`,
        });
      }
    }
  }
  return refutes;
}

// ————————————————————————————————————————————————————————————————————————
// CE QU'IL FAIT DU CONSTAT — proposer précisément, et créer une tâche si l'agent tranche
// ————————————————————————————————————————————————————————————————————————
//
// Son calibrage : « il propose une amélioration précise, je tranche » — et si l'agent tranche
// positivement ET qu'une validation de l'utilisateur est nécessaire, une tâche est créée.
//
// UN CONSTAT SANS PROPOSITION LAISSE LE TRAVAIL ENTIER À FAIRE, et c'est comme ça qu'un rapport
// finit non lu. Les propositions sont donc dérivées de la preuve qui manque, jamais génériques.
export const AMELIORATIONS = {
  "relit-sa-memoire": { quoi: "lui faire relire le registre qu'il écrit déjà", effort: "faible — le fichier existe, il suffit de le charger au démarrage", validationRequise: false },
  "taux-de-trouvaille": { quoi: "enregistrer, à chaque passage, combien de trouvailles se sont révélées vraies", effort: "moyen — demande de savoir ce qui a été confirmé, donc un retour humain", validationRequise: true },
  "faux-positifs-en-baisse": { quoi: "journaliser chaque faux positif constaté, avec sa cause", effort: "faible — trois l'ont été à la main le 2026-09-22 sans jamais être enregistrés", validationRequise: false },
  "enrichi-par-l-agent": { quoi: "rien à faire côté outil : c'est à moi de l'améliorer, et le manque m'est imputable", effort: "—", validationRequise: false },
};

export function proposerAmelioration(jugement, { preuves = {} } = {}) {
  if (jugement.verdict === "apprend" || jugement.verdict === "pas assez de recul") return null;
  const manquantes = PREUVES.filter((p) => p.nature === "autonome" && preuves[p.id] !== true);
  if (!manquantes.length) return null;
  // La preuve la moins coûteuse d'abord : proposer le chantier le plus lourd à un outil qui n'en a
  // aucune est le meilleur moyen que rien ne soit jamais fait.
  const choisie = manquantes.find((p) => AMELIORATIONS[p.id]?.effort?.startsWith("faible")) ?? manquantes[0];
  const a = AMELIORATIONS[choisie.id];
  return { outil: jugement.outil, preuveManquante: choisie.id, proposition: a.quoi, effort: a.effort, validationRequise: a.validationRequise };
}

// tacheADeclencher() — le dernier maillon, et il n'est PAS automatique : l'agent tranche d'abord.
// Une tâche n'est créée que si l'agent a retenu la proposition ET qu'elle demande une validation
// humaine. Sans ce double filtre, l'outil inonderait le suivi — et une liste inondée ne se lit plus,
// ce qui détruirait la valeur que la chaîne de l'Article 28 est censée protéger.
export function tacheADeclencher(proposition, { agentRetient = false } = {}) {
  if (!proposition || !agentRetient) return null;
  if (!proposition.validationRequise) return { cree: false, raison: "retenue et applicable directement — à faire, sans passer par une tâche en attente de validation" };
  return {
    cree: true,
    sujet: `Apprentissage / ${proposition.outil}`,
    quoi: proposition.proposition,
    pourquoi: `preuve d'apprentissage manquante : ${proposition.preuveManquante}`,
  };
}

function main() {
  printReliabilityNotice("tool-learning");
  console.log("=== TOOL-LEARNING — l'apprentissage de l'outillage, et le mien à son égard ===\n");
  console.log("Évolutivité, moitié 1 (pouvoir partir)   → SAFE-EXPORT");
  console.log("Évolutivité, moitié 2 (devenir meilleur) → TOOL-LEARNING\n");
  console.log("Frontière avec CASSANDRA : elle juge l'ÉTAT et les MOYENS, lui la TRAJECTOIRE et l'USAGE.");
  console.log("Un outil peut avoir une mémoire et ne jamais la relire — équipé pour elle, immobile pour lui.\n");
  for (const p of PREUVES) console.log(`· ${p.id} (${p.nature}) — ${p.quoi}`);
  const refutes = verifierSesPropresVerdicts(loadVerdicts());
  console.log(refutes.length ? `\n🔄 ${refutes.length} de mes propres verdicts réfutés par la suite :` : "\n· Aucun de mes verdicts passés n'a été réfuté (ou pas encore assez d'historique).");
  for (const r of refutes) console.log(`   ${r.outil} (${r.quand}) : ${r.pourquoi}`);
  recordCliUsage("tool-learning", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) main();
