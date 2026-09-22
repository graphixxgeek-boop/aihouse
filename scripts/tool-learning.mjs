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
import { execSync } from "node:child_process";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { buildPoint, recordPoint, loadSerie, detectTendance, SENS } from "./serie-temporelle.mjs";

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

// ————————————————————————————————————————————————————————————————————————
// IL NE ME LOUPE PAS — le verdict porté sur L'AGENT, pas sur les outils
// ————————————————————————————————————————————————————————————————————————
//
// Demande explicite de l'utilisateur (2026-09-22) : « pour tool learning, je veux qu'il "ne te
// loupe pas" si tu echoue à ta mission de ne pas aider un outil à s'ameliorer ».
//
// Ce que cette section ajoute, et pourquoi elle ne faisait pas déjà double emploi avec la preuve
// `enrichi-par-l-agent` : celle-ci mesure mon apport SUR UN OUTIL, et elle est muette quand je n'ai
// rien fait — l'absence d'apport y ressort comme une caractéristique de l'outil (« immobile »),
// jamais comme un manquement de ma part. C'est exactement le défaut récurrent de ce projet : une
// mesure ADJACENTE présentée à la place de la mesure visée. Ici la mesure visée, c'est moi.
//
// Le cas retenu est le plus net possible, et volontairement le plus dur à contester : un diagnostic
// que CET OUTIL a posé lui-même (« archive seulement », « immobile »), à une date connue, sur un
// outil dont le script n'a REÇU AUCUN COMMIT depuis. Le problème était nommé, écrit, daté. Je ne
// peux pas plaider que je ne savais pas — c'est ce qui rend ce constat imputable, là où un simple
// « cet outil ne progresse pas » ne le serait pas.
//
// Ce qu'il NE me reproche jamais, et c'est ce qui rend le reste crédible :
//  · un verdict « pas assez de recul » (rien n'était demandé) ;
//  · un outil dont l'utilisateur a explicitement gelé la zone (`zonesGelees`) — sa décision, jamais
//    mon manquement. Mais elle est NOMMÉE à part plutôt que tue, exactement comme la consigne du
//    2026-09-22 l'exige pour toute zone mise de côté : « ne jamais écarter une zone sciemment
//    laissée de côté par moi, sauf avec mon accord explicite » ;
//  · un outil que je ne PEUX pas améliorer seul (proposition `validationRequise`) et dont la tâche
//    existe déjà, en attente de l'utilisateur : la balle n'est plus dans mon camp.
export const PALIERS_AGENT = [
  { seuil: 3, gravite: "manquement", quoi: "question obligatoire à l'utilisateur — trois passages sans rien faire d'un diagnostic écrit n'est plus un oubli, c'est un choix que je n'ai jamais assumé à voix haute" },
  { seuil: 2, gravite: "sérieux", quoi: "relance appuyée, nommément, dans le rapport de Ronde" },
  { seuil: 1, gravite: "à traiter", quoi: "rappel simple — un passage peut se rattraper" },
  { seuil: 0, gravite: "rien à me reprocher", quoi: "aucun diagnostic posé n'est resté lettre morte" },
];

// dernierVerdictParOutil() — seul le dernier compte : un outil jugé « immobile » en mars puis
// « apprend » en avril n'a rien à me reprocher, et le compter reviendrait à me condamner sur un
// verdict que j'ai précisément fait mentir.
export function dernierVerdictParOutil(historique = []) {
  const parOutil = new Map();
  for (const v of historique) {
    const precedent = parOutil.get(v.outil);
    if (!precedent || String(v.date ?? "") >= String(precedent.date ?? "")) parOutil.set(v.outil, v);
  }
  return parOutil;
}

// diagnosticsIgnores() — le coeur du reproche. `touchesDepuis(outil, date)` est injecté plutôt que
// lu ici : la source réelle est git (le script a-t-il reçu un commit depuis le verdict), et un
// appel à git à l'intérieur d'une fonction pure la rendrait intestable — le patron déjà retenu
// partout ailleurs dans ce paysage.
//
// `passagesDepuis` compte les passages de TOOL-LEARNING postérieurs au verdict : c'est le nombre de
// fois où le constat m'est repassé sous les yeux sans effet. Un diagnostic posé hier et pas encore
// traité n'est pas un manquement ; le même, revu trois fois, en est un.
export function diagnosticsIgnores(historique = [], { touchesDepuis = () => true, zonesGelees = [], tachesEnAttente = [], passagesDepuis = () => 0 } = {}) {
  const ignores = [];
  const geles = [];
  const chezLUtilisateur = [];
  for (const [outil, v] of dernierVerdictParOutil(historique)) {
    if (v.verdict !== "immobile" && v.verdict !== "archive seulement") continue;
    if (zonesGelees.includes(outil)) {
      geles.push({ outil, depuis: v.date, verdict: v.verdict, note: "zone gelée par l'utilisateur — jamais mon manquement, jamais tu non plus" });
      continue;
    }
    if (tachesEnAttente.includes(outil)) {
      chezLUtilisateur.push({ outil, depuis: v.date, verdict: v.verdict, note: "tâche déjà ouverte, en attente d'une validation qui ne m'appartient pas" });
      continue;
    }
    if (touchesDepuis(outil, v.date)) continue;
    ignores.push({ outil, depuis: v.date, verdict: v.verdict, passages: passagesDepuis(v.date) });
  }
  return { ignores, geles, chezLUtilisateur };
}

// jugerLAgent() — le verdict, et il porte mon nom. Le palier se lit sur le PIRE cas, jamais sur une
// moyenne : un diagnostic ignoré trois fois ne se dilue pas dans neuf diagnostics traités. Une
// moyenne ici serait exactement le genre d'angle arrondi que l'utilisateur a refusé pour son propre
// rapport d'évaluation (« je veux des infos, pas des angles arrondis »).
export function jugerLAgent(historique = [], options = {}) {
  const { ignores, geles, chezLUtilisateur } = diagnosticsIgnores(historique, options);
  // Zéro verdict enregistré n'est PAS un blanc-seing, et la distinction n'est pas cosmétique : son
  // premier vrai passage affichait « RIEN À ME REPROCHER » sur un registre vide, c'est-à-dire une
  // absence de mesure rendue comme une mesure — le défaut exact que cet outil dénonce chez les
  // autres, commis par lui dans sa première minute d'existence. Un troisième état, jamais deux.
  if (!historique.length) {
    return {
      gravite: "pas encore mesurable",
      action: "aucun verdict n'a encore été enregistré : rien ne peut m'être reproché, et rien ne m'absout non plus",
      questionObligatoire: false,
      ignores, geles, chezLUtilisateur,
      resume: "registre de verdicts vide — absence de mesure, jamais un bon résultat",
    };
  }
  const pire = ignores.reduce((max, i) => Math.max(max, i.passages ?? 0), 0);
  const palier = PALIERS_AGENT.find((p) => pire >= p.seuil) ?? PALIERS_AGENT[PALIERS_AGENT.length - 1];
  const gravite = ignores.length ? palier.gravite : "rien à me reprocher";
  return {
    gravite,
    action: ignores.length ? palier.quoi : PALIERS_AGENT[PALIERS_AGENT.length - 1].quoi,
    questionObligatoire: gravite === "manquement",
    ignores,
    geles,
    chezLUtilisateur,
    resume: ignores.length
      ? `${ignores.length} diagnostic(s) posé(s) par cet outil, jamais suivi(s) d'effet — le plus ancien revu ${pire} fois sans que je touche à rien : ${ignores.map((i) => i.outil).join(", ")}`
      : "aucun diagnostic posé par cet outil n'est resté lettre morte",
  };
}

// touchesDepuisGit() — la source réelle, isolée des fonctions pures ci-dessus. Un échec de git
// renvoie `true` (« on ne sait pas » se lit comme « touché »), pour ne JAMAIS fabriquer un reproche
// à partir d'une absence de mesure : accuser sur une commande ratée serait précisément le défaut
// que cet outil existe pour nommer chez les autres.
export function touchesDepuisGit(outil, date, { execImpl } = {}) {
  try {
    const out = execImpl(`git log --since=${date} --oneline -- scripts/${outil}.mjs`);
    return String(out).trim().length > 0;
  } catch {
    return true;
  }
}

// ————————————————————————————————————————————————————————————————————————
// CE QUE ME COÛTE L'AIDE — plugué sur SMART-CONSO-TOKEN, jamais estimé au doigt mouillé
// ————————————————————————————————————————————————————————————————————————
//
// Question de l'utilisateur (2026-09-22) : « est-ce que le fait d'aider un agent à apprendre est
// couteux pour toi ? question à plugger avec ecotoken et smart conso ».
//
// La réponse a été MESURÉE, pas supposée, et elle renverse l'intuition :
//  · aider un outil coûte l'équivalent de son script — médiane réelle 3 300 tokens sur les 64
//    scripts du dépôt, quartile haut 5 900. C'est environ un DIXIÈME d'un agent séparé (~37 000).
//    Le geste que je pourrais croire lourd est en fait le moins cher du paysage ;
//  · le vrai coût est dans son TEST : check-house.mjs pèse ~273 000 tokens, 44 % de tout scripts/.
//    Lu en entier pour ajouter trois lignes d'assertion, il coûte sept agents séparés.
//
// La conséquence est une règle, pas une remarque : le frein à l'apprentissage n'est jamais l'outil,
// c'est toujours son test — donc jamais de lecture intégrale de check-house.mjs pour y ajouter une
// assertion, toujours tool-brain --file (qui délègue à find-booster) pour n'ouvrir que le bloc utile.
//
// Pourquoi ecotoken n'a RIEN à voir ici, et le dire vaut mieux que fabriquer un lien : ecotoken
// réduit le coût PERMANENT des documents rechargés à chaque message. Aider un outil est un coût
// PONCTUEL, payé une fois. Les brancher ensemble donnerait un chiffre qui mélange deux unités — une
// dépense mensuelle et un achat — et c'est précisément ce genre de rapprochement flatteur que ce
// projet appelle une mesure adjacente présentée à la place de la mesure visée.
export const COUT_DE_L_AIDE = {
  schema: "tool_learning_assist",
  medianeScript: 3300,
  quartileHautScript: 5900,
  coutDuTest: 273000,
  mesureLe: "2026-09-22",
  regle: "jamais de lecture intégrale de check-house.mjs pour ajouter un test — tool-brain --file d'abord",
};

// coutDeLAide() — ce qu'il en coûte d'aider CET outil-là, en vrai. Le poids du script est lu sur le
// disque à chaque appel (Article 24 : on lit, on ne recopie pas) ; un script introuvable renvoie
// `null` plutôt qu'une estimation moyenne, parce qu'une moyenne servie à la place d'une mesure
// absente est exactement ce que cet outil reproche aux autres.
export function coutDeLAide(outil, { root = ROOT, readFileImpl = readFileSync, estimer = (t) => Math.ceil(t.length / 4) } = {}) {
  let tokensScript = null;
  try {
    tokensScript = estimer(readFileImpl(join(root, `scripts/${outil}.mjs`), "utf8"));
  } catch {
    return { outil, mesurable: false, pourquoi: `scripts/${outil}.mjs introuvable — aucune estimation servie à la place d'une mesure absente` };
  }
  const cher = tokensScript > COUT_DE_L_AIDE.quartileHautScript;
  return {
    outil,
    mesurable: true,
    tokensScript,
    comparaison: `${(tokensScript / 37000 * 100).toFixed(1)} % d'un agent séparé`,
    verdict: cher ? "au-dessus du quartile haut — vaut une lecture ciblée plutôt qu'intégrale" : "bon marché — le lire en entier est raisonnable",
    rappelTest: COUT_DE_L_AIDE.regle,
  };
}

// Série temporelle partagée — obligatoire pour lui plus que pour tout autre : sa frontière déclarée
// avec CASSANDRA est « elle juge l'ÉTAT, lui la TRAJECTOIRE ». Un outil qui juge des pentes sans
// tenir la sienne se jugerait lui-même immobile, et il aurait raison.
export function enregistrerTendanceApprentissage(mesures = {}, options = {}) {
  const point = buildPoint({
    mesures: {
      "outils-apprenants": { valeur: mesures.apprenants, sens: SENS.HAUT_MIEUX },
      "archive-seulement": { valeur: mesures.archiveSeulement, sens: SENS.BAS_MIEUX },
      "diagnostics-ignores": { valeur: mesures.diagnosticsIgnores, sens: SENS.BAS_MIEUX },
      "verdicts-refutes": { valeur: mesures.refutes, sens: SENS.BAS_MIEUX },
    },
    ...options,
  });
  return recordPoint("tool-learning", point, options);
}

export function tendancesApprentissage(options = {}) {
  const serie = loadSerie("tool-learning", options);
  return ["outils-apprenants", "archive-seulement", "diagnostics-ignores", "verdicts-refutes"].map((c) => detectTendance(serie, c, options));
}

function main() {
  printReliabilityNotice("tool-learning");
  console.log("=== TOOL-LEARNING — l'apprentissage de l'outillage, et le mien à son égard ===\n");
  console.log("Évolutivité, moitié 1 (pouvoir partir)   → SAFE-EXPORT");
  console.log("Évolutivité, moitié 2 (devenir meilleur) → TOOL-LEARNING\n");
  console.log("Frontière avec CASSANDRA : elle juge l'ÉTAT et les MOYENS, lui la TRAJECTOIRE et l'USAGE.");
  console.log("Un outil peut avoir une mémoire et ne jamais la relire — équipé pour elle, immobile pour lui.\n");
  for (const p of PREUVES) console.log(`· ${p.id} (${p.nature}) — ${p.quoi}`);
  const historique = loadVerdicts();
  const refutes = verifierSesPropresVerdicts(historique);
  console.log(refutes.length ? `\n🔄 ${refutes.length} de mes propres verdicts réfutés par la suite :` : "\n· Aucun de mes verdicts passés n'a été réfuté (ou pas encore assez d'historique).");
  for (const r of refutes) console.log(`   ${r.outil} (${r.quand}) : ${r.pourquoi}`);

  // Le verdict porté sur l'agent. Affiché APRÈS l'auto-correction et jamais avant : un outil qui
  // accuse quelqu'un d'autre avant d'avoir vérifié ses propres erreurs n'est pas crédible.
  const passagesConnus = historique.length;
  const surMoi = jugerLAgent(historique, {
    touchesDepuis: (outil, date) => touchesDepuisGit(outil, date, { execImpl: (cmd) => execSync(cmd, { cwd: ROOT, encoding: "utf8" }) }),
    passagesDepuis: (date) => historique.filter((v) => String(v.date ?? "") > String(date)).length,
  });
  console.log(`\n=== CE QU'IL ME REPROCHE, À MOI (${passagesConnus} passage(s) d'historique) ===`);
  console.log(`Gravité : ${surMoi.gravite.toUpperCase()} — ${surMoi.resume}`);
  for (const i of surMoi.ignores) console.log(`   ⚠️  ${i.outil} : jugé « ${i.verdict} » le ${i.depuis}, aucun commit sur son script depuis, revu ${i.passages} fois.`);
  for (const g of surMoi.geles) console.log(`   ⏸️  ${g.outil} : ${g.note} (jugé « ${g.verdict} » le ${g.depuis}).`);
  for (const c of surMoi.chezLUtilisateur) console.log(`   ⏳ ${c.outil} : ${c.note}.`);
  if (surMoi.questionObligatoire) console.log(`\n🔴 ${surMoi.action}`);
  else if (surMoi.ignores.length) console.log(`\n→ ${surMoi.action}`);

  console.log(`\n=== CE QUE ME COÛTE L'AIDE (mesuré le ${COUT_DE_L_AIDE.mesureLe}, jamais estimé) ===`);
  console.log(`Aider un outil ≈ le poids de son script : médiane ${COUT_DE_L_AIDE.medianeScript} tokens, soit ~9 % d'un agent séparé.`);
  console.log(`Le frein n'est pas là : son TEST (check-house.mjs) pèse ${COUT_DE_L_AIDE.coutDuTest} tokens, 44 % de tout scripts/.`);
  console.log(`→ Règle : ${COUT_DE_L_AIDE.regle}.`);
  for (const i of surMoi.ignores) {
    const c = coutDeLAide(i.outil);
    if (c.mesurable) console.log(`   ${i.outil} : ${c.tokensScript} tokens (${c.comparaison}) — ${c.verdict}`);
    else console.log(`   ${i.outil} : ${c.pourquoi}`);
  }
  // La série n'est alimentée que si un verdict a réellement été enregistré : un point à zéro sur un
  // registre vide n'est pas une mesure de zéro, c'est une absence — et l'inscrire creuserait une
  // fausse courbe plate dont personne ne saurait plus dire si elle décrit un paysage sain ou un
  // outil qui n'a jamais tourné.
  if (historique.length) {
    const dernier = dernierVerdictParOutil(historique);
    enregistrerTendanceApprentissage({
      apprenants: [...dernier.values()].filter((v) => v.verdict === "apprend").length,
      archiveSeulement: [...dernier.values()].filter((v) => v.verdict === "archive seulement").length,
      diagnosticsIgnores: surMoi.ignores.length,
      refutes: refutes.length,
    });
    console.log("\n=== TENDANCES (mécanisme partagé) ===");
    for (const t of tendancesApprentissage()) console.log(`  ${t.cle} : ${t.tendance ?? t.etat ?? "pas encore de tendance"}`);
  } else {
    console.log("\n· Aucune série enregistrée : le registre de verdicts est vide, et un point à zéro sur un registre vide serait une fausse courbe plate, jamais une mesure.");
  }
  recordCliUsage("tool-learning", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) main();
