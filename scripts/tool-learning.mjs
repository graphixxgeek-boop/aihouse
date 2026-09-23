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

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReportHeader } from "./report-template.mjs";
import { buildPoint, recordPoint, loadSerie, detectTendance, SENS } from "./serie-temporelle.mjs";
import { loadJsonArray } from "./lib-json.mjs";
import { buildPlanDaction, PLAN_ACTION_TITRE, ETATS_CONSTAT } from "./report-template.mjs";

// LES NOMS D'ÉTAT SE PRENNENT À LA SOURCE, ILS NE SE RECOPIENT PAS (2026-09-23). Je les ai écrits
// à la main deux fois de suite avec un accent — « à trancher » au lieu de « a-trancher » — et les
// deux fois le rapport a planté au lieu de se produire. C'est BP1 du registre des leçons, commise
// dans le fichier qui publie ce registre : la valeur dérive de ETATS_CONSTAT, donc un renommage
// futur là-bas ne peut plus laisser une orthographe morte ici.
const [RETENU, , A_TRANCHER] = ETATS_CONSTAT;

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
  return loadJsonArray(VERDICTS_FILE, { root, readFileImpl });
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

// ————————————————————————————————————————————————————————————————————————
// LE REGISTRE DES LEÇONS — l'apprentissage de l'AGENT, pas celui des outils
// ————————————————————————————————————————————————————————————————————————
//
// POURQUOI CETTE PARTIE VIT ICI (2026-09-23, tâche #220). TOOL-LEARNING porte la moitié 2 de
// l'évolutivité : devenir meilleur. Il vérifiait jusqu'ici que les OUTILS apprennent, et rien ne
// vérifiait la même chose de mon côté — alors que c'est moi qui disparais à chaque fin de session.
//
// LA QUESTION QUI A CRÉÉ CE MÉCANISME, posée par l'utilisateur : « quand tu fais des trouvailles
// bonnes à retenir [...] il faut que tu l'écrives quelque part, c'est déjà le cas ? » Réponse
// honnête ce jour-là : non. Les leçons vivaient dans des commentaires de code, chacune locale à
// l'outil qui l'avait apprise. `docs/referentiel/lecons.md` a été écrit pour ça.
//
// ET C'EST PRÉCISÉMENT LÀ QUE LE PIÈGE SE REFERME. Un registre de leçons que rien ne relit est un
// cas de L2 (« un mécanisme qui ne sort pas du script est une intention ») et de L7 (« une
// intention écrite n'a jamais empêché quoi que ce soit) — c'est-à-dire de deux leçons qu'il
// contient lui-même. L'écrire sans le câbler aurait été la démonstration de son propre contenu.
//
// LE CÂBLAGE RETENU, et pourquoi celui-là. Chaque leçon déclare son PORTEUR : le mécanisme réel
// qui la fait tenir quand plus personne ne se souvient d'elle. Trois états, jamais deux :
//   · portée          — le porteur nommé existe vraiment dans le code ;
//   · sans mécanisme  — déclaré noir sur blanc AVEC sa raison (ce que L7 prescrit explicitement
//                       quand aucun mécanisme n'est possible : l'impossibilité se déclare) ;
//   · porteur fantôme — un porteur est nommé et n'existe pas. C'est le pire des trois, et c'est
//                       pour lui que cette fonction existe : une référence morte ressemble à une
//                       garantie, donc elle rassure à tort. Même raison d'être que
//                       `checkActionChain()` chez god-of-all-process, qui vérifie qu'une tâche
//                       annoncée par un plan d'action existe pour de vrai.
//
// CE QU'IL NE VÉRIFIE PAS, et c'est déclaré plutôt que tu : aucune mécanique ne peut juger si un
// porteur fait RÉELLEMENT respecter sa leçon — seulement s'il existe. Le cas grossier est attrapé
// (la promesse sans code derrière), le subtil ne l'est pas.
export const LECONS_PATH = "docs/referentiel/lecons.md";

// Un identifiant de porteur est cité entre accents graves : `maFonction()` ou `MA_CONSTANTE`.
// On dérive la liste du texte plutôt que de la tenir à côté (Article 24) : une leçon ajoutée
// demain entre dans le champ de vision sans qu'une ligne ne bouge ici.
const PORTEUR_IDENT_RE = /`([A-Za-z_][A-Za-z0-9_]*)(?:\(\))?`/g;

// DEUX NATURES DANS UN SEUL DOCUMENT (2026-09-23, tranché par l'utilisateur). Une LEÇON a été payée
// par une erreur réelle — c'est ce qui la rend crédible ; une BONNE PRATIQUE est un réflexe qui
// marche, sans casse derrière. Deux fichiers séparés garantiraient qu'on n'en relise qu'un, une
// seule liste ferait perdre ce qui distingue les deux. D'où : même document, sections distinctes,
// et une nature dérivée du préfixe de l'identifiant plutôt que déclarée une seconde fois à côté.
const NATURE_PAR_PREFIXE = [
  { motif: /^L\d+$/, nature: "leçon" },
  { motif: /^BP\d+$/, nature: "bonne pratique" },
];

export function natureDe(id) {
  return NATURE_PAR_PREFIXE.find((n) => n.motif.test(String(id)))?.nature ?? null;
}

// LE TERRAIN — ce qui permet à une entrée d'ARRIVER AU BON MOMENT plutôt que d'attendre qu'on
// pense à la relire. C'est le champ qui sert l'objectif principal fixé par l'utilisateur (« que tu
// mettes en pratique ces leçons », pas seulement que tu les enregistres) : sans lui, on servirait
// les huit à chaque fois, ce qui revient à n'en servir aucune.
//
// Les mots-clés sont DÉCLARÉS PAR L'ENTRÉE ELLE-MÊME, après le séparateur « · mots : », jamais
// devinés par ressemblance de texte (Article 24 : une entrée ajoutée demain déclare son terrain et
// entre dans le dispositif sans qu'une ligne ne bouge ici — et un rapprochement deviné à côté de la
// plaque ferait de ce rappel un bruit qu'on apprend à ignorer, ce que L4 interdit).
function motsDuTerrain(ligne) {
  const apres = String(ligne ?? "").split("· mots :")[1];
  if (!apres) return [];
  // Le segment « · fichiers : » peut suivre celui des mots : on ne garde que ce qui précède.
  return apres.split("· fichiers :")[0].split(",").map((m) => m.trim().toLowerCase()).filter(Boolean);
}

// LE TERRAIN PAR FICHIER (2026-09-23, amélioration ③ de la tâche #222). Les mots de la phrase ne
// suffisent pas : une même tâche se formule de dix façons, et si je dis « je reprends ce bout de
// code » sans employer le mot « test », la leçon sur les tests ne remonte pas alors qu'elle
// s'applique. Le FICHIER, lui, ne ment pas sur ce qu'on est en train de toucher.
//
// La syntaxe est volontairement pauvre — un fragment de chemin, avec `*` comme seul joker — parce
// qu'une vraie grammaire de motifs se paierait en faux rapprochements, et qu'un garde-fou qui
// accuse à tort cesse d'être lu (L4). Segment facultatif : une entrée qui ne déclare que des mots
// continue de fonctionner exactement comme avant.
function fichiersDuTerrain(ligne) {
  const apres = String(ligne ?? "").split("· fichiers :")[1];
  if (!apres) return [];
  return apres.split(",").map((m) => m.trim().toLowerCase()).filter(Boolean);
}

export function cheminCorrespond(chemin, motif) {
  const c = String(chemin ?? "").toLowerCase();
  const m = String(motif ?? "").toLowerCase().trim();
  if (!c || !m) return false;
  if (!m.includes("*")) return c.includes(m);
  // Un `*` ne traverse jamais un séparateur de dossier : `scripts/*.mjs` ne doit pas attraper
  // `scripts/hooks/x.mjs`, sinon un motif large finirait par tout attraper sans qu'on s'en aperçoive.
  const re = new RegExp(m.split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[^/]*"));
  return re.test(c);
}

export function parseLecons(texte = "") {
  const lecons = [];
  const sections = String(texte).split(/^## /m).slice(1);
  for (const sec of sections) {
    const titre = sec.split("\n")[0].trim();
    const id = (titre.match(/^(L\d+|BP\d+)/) || [])[1];
    if (!id) continue;
    const ligne = (sec.match(/^\*\*Porté par\*\*\s*:\s*(.+)$/m) || [])[1] ?? null;
    const terrain = (sec.match(/^\*\*Terrain\*\*\s*:\s*(.+)$/m) || [])[1] ?? null;
    // Un identifiant absorbé par une fusion reste une entrée du document — il ne disparaît jamais,
    // il RENVOIE. C'est ce qui permet à une citation de L8 faite il y a un mois de mener quelque part.
    const fusionneeDans = (sec.match(/^\*\*Fusionnée dans\*\*\s*:\s*(\S+)/m) || [])[1] ?? null;
    const porteurs = [];
    if (ligne) for (const m of ligne.matchAll(PORTEUR_IDENT_RE)) porteurs.push(m[1]);
    // LA TRACE D'ORIGINE — la ligne en italique qui dit ce que cette entrée a coûté, sous ses deux
    // formes réelles dans ce registre (« Trouvée le… », « Payée le… »). C'est elle qui rend une
    // leçon crédible : sans la casse qui l'a produite, on lit un conseil, pas une leçon.
    // Sur PLUSIEURS lignes : la trace d'origine est un paragraphe en italique, et la moitié des
    // entrées la font tenir sur deux ou trois lignes. Un motif ancré sur une seule ligne en ratait
    // sept sur seize et les déclarait « sans date » — une absence fabriquée par le lecteur, pas par
    // le document (L11 : un motif qui ne PEUT pas matcher ressemble à un motif qui ne matche pas).
    // RECONNUE PAR SA FORME, JAMAIS PAR SON VERBE. Le premier jet cherchait « Trouvée » ou
    // « Payée » ; une entrée écrivait « Apprise » et se retrouvait déclarée sans date. Allonger la
    // liste des verbes aurait rejoué exactement ce que le corollaire de l'Article 17 interdit — un
    // tableau qui ne couvre jamais le prochain cas. La règle retenue est une PROPRIÉTÉ : la trace
    // d'origine est le premier paragraphe en italique de l'entrée QUI PORTE UNE DATE. N'importe
    // quel verbe passe, et un italique sans date (une incise de style) n'est jamais pris pour elle.
    const origine = [...sec.matchAll(/^\*[^*][^*]*\*/gm)].map((m) => m[0]).find((bloc) => /\d{4}-\d{2}-\d{2}/.test(bloc)) ?? null;
    const dateOrigine = (origine?.match(/(\d{4}-\d{2}-\d{2})/) || [])[1] ?? null;
    // LES ENRICHISSEMENTS — une leçon qui s'étoffe garde LES DEUX traces : l'originale intacte, et
    // l'ajout daté à côté. Le format est fixe et lu, jamais deviné (leçon L12).
    const enrichissements = [...sec.matchAll(/^\*\*Enrichie le\*\*\s*:\s*(\d{4}-\d{2}-\d{2})\s*[—-]\s*(.+)$/gm)]
      .map((m) => ({ date: m[1], quoi: m[2].trim() }));
    lecons.push({ id, titre, nature: natureDe(id), portePar: ligne, porteurs, terrain, mots: motsDuTerrain(terrain), fichiers: fichiersDuTerrain(terrain), fusionneeDans, origine, dateOrigine, enrichissements });
  }
  return lecons;
}

// ————————————————————————————————————————————————————————————————————————
// « EST-CE QUE TOUT LE CODE BÉNÉFICIE DE LA LEÇON ? » (2026-09-23, chantier 7)
// ————————————————————————————————————————————————————————————————————————
//
// QUESTION POSÉE TELLE QUELLE PAR L'UTILISATEUR. Elle est plus dure qu'elle n'en a l'air : une leçon
// est apprise à UN endroit — celui où l'erreur a fait mal — et corrigée à cet endroit-là. Rien ne dit
// que les dix autres fichiers du même terrain en ont bénéficié. C'est même le contraire par défaut.
//
// CE QUE LA COUCHE MÉCANIQUE PEUT DIRE, ET ELLE NE PRÉTEND À RIEN DE PLUS : quels fichiers du
// terrain d'une leçon ont été modifiés APRÈS qu'elle a été apprise. Ce sont les endroits où la
// question « celui-ci a-t-il été relu à la lumière de cette leçon ? » se pose vraiment. Elle ne dit
// PAS que le défaut y est présent — juger ça demande de lire le sens du code, ce qui est le passage
// PROFOND, sur demande et payant (même frontière qu'ALWAYS-NEW-CODE : couche légère gratuite et
// mécanique d'un côté, vrai raisonnement de l'autre, jamais confondus).
//
// POURQUOI « APRÈS », et pas « tous les fichiers du terrain » : lister tout le terrain rendrait des
// dizaines de fichiers à chaque leçon, dont la plupart n'ont pas bougé depuis des semaines — un
// détecteur qui accuse presque tout a tort presque toujours (L4). Un fichier touché après coup est
// un vrai candidat : quelqu'un y a travaillé en ayant, ou non, la leçon en tête.
export function zonesARemettreANiveau(lecons = [], { root = ROOT, execImpl = (cmd) => execSync(cmd, { cwd: String(root).replace(/\/$/, ""), encoding: "utf8" }), depuis = null } = {}) {
  const zones = [];
  for (const l of lecons) {
    if (l.fusionneeDans) continue;
    const date = depuis ?? l.dateOrigine;
    // Pas de date lisible ⇒ « pas mesuré », jamais « rien à revoir » : la confusion entre les deux
    // est le défaut que ce projet corrige le plus souvent.
    if (!date || !l.fichiers?.length) { zones.push({ id: l.id, titre: l.titre, mesurable: false, raison: !date ? "aucune date d'origine lisible dans l'entrée" : "aucun motif de fichier déclaré dans son terrain" }); continue; }
    const touches = new Set();
    for (const motif of l.fichiers) {
      let sortie = "";
      // `--since=2026-09-23` SEUL ne veut pas dire « depuis minuit ce jour-là » : git y ajoute
      // l'heure courante, si bien qu'un commit du matin passe pour antérieur à sa propre date. Le
      // relevé rendait 0 fichier sur 9 leçons — un zéro parfaitement plausible, donc invisible sans
      // vérification. L'heure est donc écrite explicitement.
      try { sortie = execImpl(`git log --since=${date}T00:00:00Z --name-only --pretty=format: -- '${motif}'`) ?? ""; }
      catch { /* un motif illisible ne vaut jamais un terrain vide */ }
      for (const f of String(sortie).split("\n").map((x) => x.trim()).filter(Boolean)) touches.add(f);
    }
    zones.push({ id: l.id, titre: l.titre, mesurable: true, depuis: date, fichiers: [...touches].sort(), porteurs: l.porteurs ?? [] });
  }
  return zones;
}

export function formatRemiseANiveau(zones = [], { max = 6 } = {}) {
  const mesurees = zones.filter((z) => z.mesurable);
  const avec = mesurees.filter((z) => z.fichiers.length).sort((a, b) => b.fichiers.length - a.fichiers.length);
  const l = [`Remise à niveau du code — ${avec.length}/${mesurees.length} leçon(s) ont des fichiers de leur terrain touchés depuis qu'elles ont été apprises.`];
  if (!mesurees.length) return `${l[0]}\nAucune leçon mesurable : ce n'est jamais « rien à revoir », c'est « on n'a pas pu regarder ».`;
  for (const z of avec.slice(0, max)) {
    l.push(`  · ${z.id} — ${z.fichiers.length} fichier(s) touché(s) depuis le ${z.depuis} : ${z.fichiers.slice(0, 4).join(", ")}${z.fichiers.length > 4 ? "…" : ""}`);
  }
  if (avec.length > max) l.push(`  … et ${avec.length - max} autre(s).`);
  l.push("Ce relevé pose une QUESTION (« ces fichiers ont-ils été relus à la lumière de la leçon ? »), il n'affirme aucun défaut — le juger demande le passage profond, sur demande.");
  const nonMesurees = zones.filter((z) => !z.mesurable);
  if (nonMesurees.length) l.push(`  ${nonMesurees.length} leçon(s) non mesurable(s) : ${nonMesurees.slice(0, 3).map((z) => `${z.id} (${z.raison})`).join(" ; ")}`);
  return l.join("\n");
}

// ————————————————————————————————————————————————————————————————————————
// LES ENTRÉES ÉQUIVALENTES — regrouper, proposer une fusion, ne JAMAIS perdre
// ————————————————————————————————————————————————————————————————————————
//
// DEMANDE DE L'UTILISATEUR (2026-09-23, tâche #222) : « la capacité de l'outil à regrouper les
// leçons si elles sont équivalentes, à les fusionner si besoin, sans perdre la valeur, TOUJOURS,
// mais pour rendre les choses plus efficaces ».
//
// LE PROBLÈME EST RÉEL ET IL ARRIVE VITE. Un registre grossit entrée par entrée, chacune écrite le
// jour où son erreur a fait mal — donc sans vue d'ensemble. Deux entrées finissent par dire la même
// chose sous deux angles, et le coût n'est pas l'encombrement : c'est que le rappel en sert DEUX là
// où une seule suffirait, ce qui consomme le plafond et évince une entrée vraiment différente.
//
// « SANS PERDRE LA VALEUR, TOUJOURS » est une contrainte dure, pas une précaution de style, et elle
// dicte toute la forme de ce mécanisme :
//   · l'outil PROPOSE, il ne fusionne jamais tout seul — même frontière que partout ailleurs ici ;
//   · la proposition est une UNION, jamais un choix entre deux textes : les deux provenances, les
//     deux terrains, les deux porteurs survivent dans l'entrée fusionnée ;
//   · l'identifiant absorbé ne disparaît PAS. Il reste dans le document comme renvoi
//     (« **Fusionnée dans** : L4 »), parce qu'un commentaire de code ou une ligne de suivi qui cite
//     L8 doit continuer de mener quelque part. Un identifiant supprimé serait une référence morte —
//     exactement le « porteur fantôme » que ce même outil traque par ailleurs.
export const SEUILS_EQUIVALENCE = {
  // Deux entrées ne sont candidates que si elles mordent sur LE MÊME terrain ET disent la même
  // chose. Le terrain seul ne suffit pas : L3 et BP3 parlent toutes deux des tests et n'ont rien à
  // voir (l'une interdit de dépendre d'un défaut, l'autre interdit d'assouplir une assertion).
  terrain: 0.5,
  contenu: 0.34,
};

// Mots trop courants pour dire quoi que ce soit d'une ressemblance. Liste fermée par nature (la
// grammaire du français ne bouge pas), donc hors du champ de l'Article 24 — écrit ici plutôt que tu.
const MOTS_VIDES = new Set("un une le la les des de du d l et ou a à au aux en dans par pour sur ce cette ces qui que quoi dont où est sont être avoir jamais toujours plus moins pas ne n s se sa son ses il elle on nous vous ils elles y c qu'".split(/\s+/));

function motsSignifiants(texte) {
  return new Set(String(texte ?? "").toLowerCase().replace(/[^a-zà-ÿ0-9\s]/g, " ").split(/\s+/)
    .filter((m) => m.length > 3 && !MOTS_VIDES.has(m)));
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let communs = 0;
  for (const x of a) if (b.has(x)) communs += 1;
  return communs / (a.size + b.size - communs);
}

export function similariteLecons(a, b, { seuils = SEUILS_EQUIVALENCE } = {}) {
  const terrain = jaccard(new Set([...(a.mots ?? []), ...(a.fichiers ?? [])]), new Set([...(b.mots ?? []), ...(b.fichiers ?? [])]));
  const motsA = motsSignifiants(a.titre);
  const motsB = motsSignifiants(b.titre);
  const contenu = jaccard(motsA, motsB);
  const communs = [...motsA].filter((m) => motsB.has(m));
  return {
    terrain: Number(terrain.toFixed(2)), contenu: Number(contenu.toFixed(2)), communs,
    equivalentes: terrain >= seuils.terrain && contenu >= seuils.contenu,
    // La RAISON voyage avec le verdict : une proposition de fusion sans ses preuves demande de
    // refaire le raisonnement à la main, donc ne sera pas suivie.
    pourquoi: `terrains proches à ${Math.round(terrain * 100)} %, formulations proches à ${Math.round(contenu * 100)} %${communs.length ? ` (mots partagés : ${communs.join(", ")})` : ""}`,
  };
}

// Le regroupement est TRANSITIF, sur le patron déjà éprouvé de fusionnerClusters() chez
// CLONE-HUNTER : si A ressemble à B et B à C, les trois forment un seul groupe. Les rendre par
// paires ferait apparaître trois problèmes là où il y en a un — c'est la leçon L8, appliquée ici.
export function groupesEquivalents(lecons = [], { seuils = SEUILS_EQUIVALENCE } = {}) {
  const vivantes = lecons.filter((l) => !l.fusionneeDans);
  const groupes = [];
  const place = new Map();
  for (let i = 0; i < vivantes.length; i += 1) {
    for (let j = i + 1; j < vivantes.length; j += 1) {
      const sim = similariteLecons(vivantes[i], vivantes[j], { seuils });
      if (!sim.equivalentes) continue;
      const gi = place.get(vivantes[i].id); const gj = place.get(vivantes[j].id);
      if (gi !== undefined && gj !== undefined) {
        if (gi === gj) { groupes[gi].raisons.push(sim.pourquoi); continue; }
        groupes[gi].ids.push(...groupes[gj].ids);
        groupes[gi].raisons.push(...groupes[gj].raisons, sim.pourquoi);
        for (const id of groupes[gj].ids) place.set(id, gi);
        groupes[gj].ids = [];
      } else if (gi !== undefined) { groupes[gi].ids.push(vivantes[j].id); groupes[gi].raisons.push(sim.pourquoi); place.set(vivantes[j].id, gi); }
      else if (gj !== undefined) { groupes[gj].ids.push(vivantes[i].id); groupes[gj].raisons.push(sim.pourquoi); place.set(vivantes[i].id, gj); }
      else {
        groupes.push({ ids: [vivantes[i].id, vivantes[j].id], raisons: [sim.pourquoi] });
        place.set(vivantes[i].id, groupes.length - 1); place.set(vivantes[j].id, groupes.length - 1);
      }
    }
  }
  return groupes.filter((g) => g.ids.length > 1).map((g) => ({ ids: [...new Set(g.ids)].sort(), raisons: [...new Set(g.raisons)] }));
}

// LA PROPOSITION DE FUSION. Elle ne rend jamais un texte à recopier tel quel : elle rend ce qui doit
// SURVIVRE, pour que la rédaction finale reste un geste humain conscient. Une fusion rédigée
// automatiquement serait relue en diagonale et perdrait justement ce qu'on promet de garder.
export function propositionDeFusion(groupe, lecons = []) {
  const membres = groupe.ids.map((id) => lecons.find((l) => l.id === id)).filter(Boolean);
  if (membres.length < 2) return null;
  // L'entrée qui accueille est la PLUS ANCIENNE (identifiant le plus petit) : elle est déjà citée
  // ailleurs, et faire porter la fusion par la plus récente multiplierait les renvois à suivre.
  const parNumero = [...membres].sort((a, b) => (parseInt(String(a.id).replace(/\D/g, ""), 10) || 0) - (parseInt(String(b.id).replace(/\D/g, ""), 10) || 0));
  const accueil = parNumero[0];
  const absorbees = parNumero.slice(1);
  return {
    accueil: accueil.id, absorbees: absorbees.map((l) => l.id), raisons: groupe.raisons,
    // Ce que l'entrée fusionnée DOIT contenir. Union stricte, jamais un arbitrage entre deux textes.
    conserver: {
      titres: membres.map((l) => l.titre),
      mots: [...new Set(membres.flatMap((l) => l.mots ?? []))],
      fichiers: [...new Set(membres.flatMap((l) => l.fichiers ?? []))],
      porteurs: [...new Set(membres.flatMap((l) => l.porteurs ?? []))],
      natures: [...new Set(membres.map((l) => l.nature))],
    },
    // LE RENVOI EST OBLIGATOIRE, et c'est la garantie « sans perdre la valeur » rendue vérifiable :
    // sans lui, une citation de l'identifiant absorbé ne mènerait plus nulle part.
    renvoiObligatoire: absorbees.map((l) => `## ${l.id} — ${String(l.titre).replace(/^\S+\s*—\s*/, "")}\n\n**Fusionnée dans** : ${accueil.id}`),
    // Un avertissement plutôt qu'un blocage : deux natures différentes dans un même groupe (une
    // leçon payée et une bonne pratique) fusionnent mal — ce qui distingue les deux se perdrait.
    avertissement: new Set(membres.map((l) => l.nature)).size > 1
      ? "natures différentes dans le groupe : fusionner une leçon payée par une erreur avec une bonne pratique effacerait précisément ce qui les distingue — à ne faire qu'en connaissance de cause"
      : null,
  };
}

// CE QUI S'APPLIQUE À CE QUE JE M'APPRÊTE À FAIRE. Appelé par tool-brain avant une tâche et par le
// crochet de commit après — les deux moments retenus par l'utilisateur, en connaissance du risque
// qu'il a lui-même vu (« le plus à risque de devenir un bruit permanent »).
//
// LE GARDE-FOU CONTRE CE RISQUE, et il est la moitié du mécanisme : `max` plafonne strictement, et
// une correspondance nulle rend une liste VIDE — jamais un repêchage « au cas où ». Un rappel qui
// sort à chaque fois est un meuble, et le projet a déjà payé ce prix une fois (un rappel de Ronde
// ignoré plus de deux cents fois, mot pour mot le même).
export function leconsPourTache(tache, { lecons = [], max = 3, fichiers = [] } = {}) {
  const texte = String(tache ?? "").toLowerCase();
  const chemins = (Array.isArray(fichiers) ? fichiers : [fichiers]).filter(Boolean);
  // Ni phrase ni fichier : on ne sert RIEN. Un repêchage « au cas où » rendrait le rappel permanent,
  // donc invisible — c'est la moitié du dispositif, pas une protection accessoire.
  if (!texte.trim() && !chemins.length) return [];
  const notees = lecons
    .map((l) => {
      // Les deux signaux comptent à égalité : un mot reconnu dans la phrase vaut un fichier reconnu
      // parmi ceux qu'on touche. Les additionner plutôt que choisir l'un des deux fait remonter en
      // premier l'entrée que les DEUX signaux désignent, qui est la plus sûrement pertinente.
      const parMots = texte.trim() ? l.mots.filter((m) => texte.includes(m)).length : 0;
      const parFichiers = chemins.length ? (l.fichiers ?? []).filter((motif) => chemins.some((c) => cheminCorrespond(c, motif))).length : 0;
      return { l, score: parMots + parFichiers, parMots, parFichiers };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || String(a.l.id).localeCompare(String(b.l.id)));
  return notees.slice(0, max).map((x) => ({ ...x.l, correspondances: x.score, parMots: x.parMots, parFichiers: x.parFichiers }));
}

export function auditLecons({ root = ROOT, readFileImpl = readFileSync, existsImpl = existsSync, sourcesImpl } = {}) {
  const chemin = join(root, LECONS_PATH);
  // L5 appliquée à cet audit lui-même : un registre absent n'est pas un registre conforme.
  if (!existsImpl(chemin)) return { mesure: "pas mesuré", raison: `${LECONS_PATH} est absent — aucune leçon à vérifier, et surtout aucune raison de rendre un vert`, lecons: [] };
  let texte = "";
  try { texte = readFileImpl(chemin, "utf8"); } catch { return { mesure: "pas mesuré", raison: `${LECONS_PATH} est illisible`, lecons: [] }; }
  const lecons = parseLecons(texte);
  if (!lecons.length) return { mesure: "pas mesuré", raison: `${LECONS_PATH} ne contient aucune leçon — un dénominateur vide ne rend jamais 100 %`, lecons: [] };

  const sources = sourcesImpl ? sourcesImpl() : scriptSources(root, readFileImpl);
  const juges = lecons.map((l) => {
    if (!l.portePar) return { ...l, etat: "sans porteur", detail: "aucune ligne « Porté par » — la leçon ne tient qu'à la mémoire de qui l'a écrite" };
    if (/^\*\*aucun mécanisme/i.test(l.portePar.trim())) return { ...l, etat: "sans mécanisme", detail: "impossibilité déclarée avec sa raison, jamais tue (ce que L7 prescrit)" };
    if (!l.porteurs.length) return { ...l, etat: "sans porteur", detail: "ligne présente mais aucun mécanisme nommé entre accents graves" };
    const vivants = l.porteurs.filter((n) => sources.some((src) => new RegExp(`\\b${n}\\b`).test(src)));
    const morts = l.porteurs.filter((n) => !vivants.includes(n));
    if (!vivants.length) return { ...l, etat: "porteur fantôme", morts, detail: `porteur(s) nommé(s) et introuvable(s) : ${morts.join(", ")} — une référence morte rassure à tort` };
    return { ...l, etat: "portée", vivants, morts, detail: morts.length ? `portée par ${vivants.join(", ")} ; introuvable(s) : ${morts.join(", ")}` : `portée par ${vivants.join(", ")}` };
  });

  const compte = (e) => juges.filter((l) => l.etat === e).length;
  // LE SECOND DÉFAUT, INDÉPENDANT DU PREMIER (2026-09-23) : une entrée peut être parfaitement portée
  // par un mécanisme ET n'arriver jamais au bon moment, faute de terrain déclaré. Les deux se
  // comptent donc à part — un registre 100 % porté mais 0 % applicable remplirait l'objectif de
  // l'archivage en ratant entièrement celui de la mise en pratique, qui est le principal.
  const sansTerrain = juges.filter((l) => !l.mots.length).map((l) => l.id);
  // LE DIAGNOSTIC, pas seulement le constat (2026-09-23) : une entrée qui DÉCLARE un terrain sans
  // qu'aucun mot n'en soit extrait a presque toujours la même cause — le champ Terrain a été écrit
  // sur DEUX lignes, et seule la première est lue. Le garde-fou attrapait bien le cas, mais laissait
  // chercher la cause ; un garde-fou qui dit « c'est cassé » sans dire « voilà pourquoi » fait
  // perdre le temps qu'il prétend faire gagner.
  const terrainCoupe = juges.filter((l) => !l.mots.length && l.terrain).map((l) => l.id);
  return {
    mesure: "mesuré",
    lecons: juges,
    total: juges.length,
    lecons_: juges.filter((l) => l.nature === "leçon").length,
    pratiques: juges.filter((l) => l.nature === "bonne pratique").length,
    portees: compte("portée"),
    sansMecanisme: compte("sans mécanisme"),
    sansPorteur: compte("sans porteur"),
    fantomes: compte("porteur fantôme"),
    sansTerrain, terrainCoupe,
    applicables: juges.length - sansTerrain.length,
  };
}

function scriptSources(root, readFileImpl) {
  const dir = join(root, "scripts");
  const out = [];
  let noms = [];
  try { noms = readdirSync(dir).filter((f) => f.endsWith(".mjs")); } catch { return out; }
  for (const n of noms) { try { out.push(readFileImpl(join(dir, n), "utf8")); } catch { /* un script illisible n'est pas un porteur absent */ } }
  return out;
}

// ————————————————————————————————————————————————————————————————————————
// LE JOURNAL DU PROCESS XP — ce qui a été capté, et ce que l'utilisateur en a dit
// ————————————————————————————————————————————————————————————————————————
//
// NOM DU PROCESS : XP-IA-bonnes-pratiques-et-lecons (donné par l'utilisateur le 2026-09-23).
//
// TROIS NATURES D'ÉCRITURE, JAMAIS MÉLANGÉES, parce qu'elles n'ont ni le même auteur ni la même
// autorité — et que les confondre ferait passer mon propre avis sur mon travail pour un verdict :
//   · "captation"  — un moment déclencheur est passé et j'ai répondu (une entrée, ou « rien à
//                    retenir », qui est une réponse pleine et entière et ne compte contre personne) ;
//   · "conclusion" — ce que je tire de la période sur MA façon de travailler. C'est la seule partie
//                    qu'aucune mécanique ne peut produire, donc la seule que j'écris à la main ;
//   · "jugement"   — l'utilisateur dit si une entrée a été réellement APPLIQUÉE. Lui seul, et à la
//                    Ronde : « c'est moi à la fin qui te dis si elle est propre ». Me déclarer
//                    conforme sur mon propre travail serait le défaut que ce dispositif combat.
export const XP_JOURNAL_PATH = "docs/tool-learning/xp-journal.json";
export const NATURES_XP = ["captation", "conclusion", "jugement"];

// Les moments où la question « y a-t-il quelque chose à retenir ? » se pose. Retenus explicitement
// par l'utilisateur le 2026-09-23 ; celui qu'il n'a PAS retenu est déclaré plus bas plutôt que tu.
export const DECLENCHEURS_XP = [
  { cle: "garde-fou-bloque", libelle: "un garde-fou refuse mon commit, ou un test échoue pour une raison que je n'avais pas vue",
    pourquoi: "de loin le moment le plus riche : la moitié des leçons actuelles y sont nées", mecanisable: true },
  { cle: "fin-de-compte-rendu", libelle: "à la fin de chaque compte rendu de travail rendu à l'utilisateur",
    pourquoi: "le rythme régulier ; le risque à surveiller est d'écrire pour remplir, d'où « rien à retenir » comme réponse valable", mecanisable: false },
  { cle: "ronde-et-evaluation", libelle: "à chaque Ronde et à chaque évaluation",
    pourquoi: "ces moments font déjà le bilan d'une période, donc on y voit ce qu'on ne voit pas tâche par tâche", mecanisable: true },
];

// CE QUI N'A PAS ÉTÉ RETENU, ÉCRIT PLUTÔT QUE TU (Article 27) : « quand je refais une erreur déjà
// faite » a été proposé et NON coché. C'était pourtant le signal le plus fort du lot — mais aussi le
// seul qu'aucune mécanique ne sait détecter, donc celui dont la protection aurait été la plus faible.
// Noté ici pour qu'une reprise sache que c'est une décision, jamais un oubli.
export const DECLENCHEUR_ECARTE = { cle: "erreur-repetee", raison: "proposé le 2026-09-23 et non retenu par l'utilisateur : non détectable mécaniquement, donc une obligation qui n'aurait reposé que sur ma mémoire" };

export function loadJournalXp({ root = ROOT, readFileImpl = readFileSync } = {}) {
  return loadJsonArray(XP_JOURNAL_PATH, { root, readFileImpl });
}

export function enregistrerXp(entree, { root = ROOT, readFileImpl = readFileSync, writeFileImpl = writeFileSync, date = new Date().toISOString() } = {}) {
  if (!NATURES_XP.includes(entree?.nature)) throw new Error(`nature XP inconnue : ${entree?.nature} — les trois natures ne se mélangent pas`);
  // Un jugement ne peut venir que de l'utilisateur, et le déclarer est la seule chose qui distingue
  // son verdict du mien. Une mécanique ne peut pas le prouver ; elle peut refuser de l'inventer.
  if (entree.nature === "jugement" && entree.parUtilisateur !== true) throw new Error("un jugement d'application n'est valable que s'il vient de l'utilisateur — jamais l'agent sur son propre travail");
  const journal = loadJournalXp({ root, readFileImpl });
  journal.push({ ...entree, date });
  writeFileImpl(join(root, XP_JOURNAL_PATH), JSON.stringify(journal, null, 2) + "\n", "utf8");
  return journal.length;
}

// L'ANALYSE DE LA PÉRIODE. Elle distingue les trois natures plutôt que de compter des lignes : un
// journal plein de captations sans une seule conclusion décrit quelqu'un qui archive, pas quelqu'un
// qui apprend — et c'est exactement la distinction que cet outil applique déjà aux autres.
export function analyseXp(journal = [], audit = {}, { rondesSansConclusion = null } = {}) {
  const par = (n) => journal.filter((e) => e.nature === n);
  const captations = par("captation");
  const conclusions = par("conclusion");
  const jugements = par("jugement");
  const derniereConclusion = conclusions.at(-1) ?? null;
  const rienARetenir = captations.filter((c) => c.rienARetenir === true).length;
  const constats = [];

  // Le cas qui compte le plus, et il est volontairement le premier : aucune conclusion écrite, c'est
  // le journal d'un archiviste. L'objectif posé était la mise en pratique, pas l'accumulation.
  if (!derniereConclusion) constats.push({ constat: "aucune conclusion écrite sur ma façon de travailler — le journal accumule des captations et n'en tire rien, ce qui est précisément « archive seulement » appliqué à moi", etat: "retenu", tache: "écrire la conclusion de période à la prochaine Ronde (nature « conclusion »)" });
  else if (Number.isFinite(rondesSansConclusion) && rondesSansConclusion >= 2) constats.push({ constat: `dernière conclusion il y a ${rondesSansConclusion} Ronde(s) — une conclusion par période perd son sens si elle saute des périodes`, etat: "retenu", tache: "écrire la conclusion de période à cette Ronde" });

  // Un journal sans un seul jugement de l'utilisateur ne dit rien sur l'APPLICATION : il dit
  // seulement que j'ai écrit. C'est la moitié qui manque, et elle ne m'appartient pas.
  if (captations.length >= 3 && !jugements.length) constats.push({ constat: "aucune entrée n'a encore été jugée appliquée ou non par l'utilisateur — le registre grossit sans qu'on sache s'il change quoi que ce soit", etat: A_TRANCHER, tache: "présenter les entrées à la Ronde pour que l'utilisateur dise lesquelles ont été réellement appliquées" });

  // « Rien à retenir » est une réponse valable ; mais uniquement des « rien à retenir » sur une
  // longue série est un signal en soi — soit rien n'arrive, soit je ne regarde plus.
  if (captations.length >= 5 && rienARetenir === captations.length) constats.push({ constat: `${captations.length} passages de suite sans une seule trouvaille — « rien à retenir » est une réponse valable, mais jamais ${captations.length} fois d'affilée`, etat: "retenu", tache: "relire les derniers déclencheurs et vérifier si je réponds vraiment à la question ou si je la coche" });

  return {
    captations: captations.length, rienARetenir, conclusions: conclusions.length, jugements: jugements.length,
    derniereConclusion, appliquees: jugements.filter((j) => j.verdict === "appliquée").length,
    nonAppliquees: jugements.filter((j) => j.verdict === "pas appliquée").length,
    entrees: audit.total ?? null, constats,
  };
}

export function formatXp(analyse, declencheurs = DECLENCHEURS_XP) {
  const l = [`Journal XP : ${analyse.captations} captation(s) dont ${analyse.rienARetenir} « rien à retenir », ${analyse.conclusions} conclusion(s) sur ma façon de travailler, ${analyse.jugements} jugement(s) de l'utilisateur.`];
  if (analyse.jugements) l.push(`Appliquées pour de vrai : ${analyse.appliquees} · pas appliquées : ${analyse.nonAppliquees} — verdict de l'utilisateur, jamais le mien.`);
  else l.push("Aucun jugement d'application encore rendu : c'est l'utilisateur qui tranche, à la Ronde.");
  if (analyse.derniereConclusion) l.push(`Dernière conclusion (${analyse.derniereConclusion.date?.slice(0, 10) ?? "?"}) : ${analyse.derniereConclusion.texte ?? "(vide)"}`);
  else l.push("Aucune conclusion écrite pour l'instant — le journal archive sans rien en tirer.");
  l.push("Moments où la question se pose : " + declencheurs.map((d) => d.cle).join(" · ") + ".");
  return l;
}

// ————————————————————————————————————————————————————————————————————————
// LA CHAÎNE XP — quatre maillons, et la vérification qu'aucun n'est cassé
// ————————————————————————————————————————————————————————————————————————
//
// LA QUESTION QUI A CRÉÉ CETTE FONCTION, posée par l'utilisateur le 2026-09-23 : « à toi de me dire
// si toutes les connexions sont bien là pour l'objectif prévu. » Y répondre en prose aurait été une
// intention (L7) : la réponse se lit donc dans le vrai dépôt, à chaque passage, jamais dans ma
// mémoire de ce que j'ai câblé.
//
// LES QUATRE MAILLONS, dans ses mots : « 1/ tu découvres une leçon dans la conversation 2/ tu
// l'enregistres 3/ tu l'analyses lors de circle 4/ elle ressort au moment opportun, comme un
// réflexe mécanique ». Un seul maillon cassé et la valeur produite est perdue — c'est exactement la
// chaîne de l'Article 28 (rapport → analyse → plan → tâches), appliquée à l'expérience plutôt qu'aux
// constats.
//
// CHAQUE MAILLON EST VÉRIFIÉ PAR UNE PREUVE DANS UN FICHIER RÉEL, jamais par une déclaration. Même
// patron que `etatConnexionProcessGardien()` et que `checkActionChain()` : ce qui est annoncé doit
// exister pour de vrai, une référence morte étant pire qu'une absence assumée.
export const MAILLONS_XP = [
  { cle: "decouverte", libelle: "1/ Découvrir — quelque chose me relance aux moments déclencheurs",
    fichier: "scripts/angel-of-ia-process.mjs", preuve: "xp-lecons",
    sansQuoi: "rien ne me demande jamais si j'ai appris quelque chose : la découverte ne repose que sur ma mémoire, donc elle disparaît à la fin de la session" },
  { cle: "enregistrement", libelle: "2/ Enregistrer — la trouvaille est écrite où on la retrouvera",
    fichier: "scripts/tool-learning.mjs", preuve: "enregistrerXp",
    sansQuoi: "la trouvaille reste dans la conversation et meurt avec elle" },
  { cle: "analyse", libelle: "3/ Analyser à la Ronde — la période est relue et j'en tire une conclusion",
    fichier: "scripts/circle-tasks.mjs", preuve: "tool-learning",
    sansQuoi: "le registre grossit sans que personne ne regarde jamais ce qu'il dit de ma façon de travailler" },
  { cle: "reflexe-avant", libelle: "4a/ Ressortir AVANT la tâche — tool-brain sert ce qui s'applique",
    fichier: "scripts/tool-brain.mjs", preuve: "leconsPourTache",
    sansQuoi: "la leçon reste archivée : elle est relue une fois par Ronde et ne change rien au travail du lendemain" },
  { cle: "reflexe-commit", libelle: "4b/ Ressortir AU COMMIT — ce qui est passé quand même est rattrapé",
    fichier: "scripts/hooks/check-last-commit.mjs", preuve: "leconsPourTache",
    sansQuoi: "ce qui a échappé au rappel d'avant la tâche n'est jamais rattrapé" },
];

export function auditChaineXp({ root = ROOT, readFileImpl = readFileSync, existsImpl = existsSync, maillons = MAILLONS_XP } = {}) {
  const etats = maillons.map((m) => {
    const chemin = join(root, m.fichier);
    // L5 : un fichier illisible n'est pas un maillon cassé, c'est une absence de mesure. Les deux se
    // ressemblent dans un rapport et ne veulent pas du tout dire la même chose.
    if (!existsImpl(chemin)) return { ...m, etat: "pas mesuré", detail: `${m.fichier} est introuvable` };
    let code = "";
    try { code = readFileImpl(chemin, "utf8"); } catch { return { ...m, etat: "pas mesuré", detail: `${m.fichier} est illisible` }; }
    const branche = new RegExp(`\\b${m.preuve}\\b`).test(code);
    return { ...m, etat: branche ? "branché" : "cassé", detail: branche ? `${m.preuve} est bien présent dans ${m.fichier}` : `${m.preuve} est absent de ${m.fichier} — ${m.sansQuoi}` };
  });
  const casses = etats.filter((e) => e.etat === "cassé");
  const nonMesures = etats.filter((e) => e.etat === "pas mesuré");
  return {
    maillons: etats, branches: etats.filter((e) => e.etat === "branché").length, total: etats.length,
    casses: casses.map((e) => e.cle), nonMesures: nonMesures.map((e) => e.cle),
    // Une chaîne n'est complète que si TOUS les maillons tiennent : un maillon non mesuré la rend
    // incomplète au même titre qu'un maillon cassé, jamais « probablement bonne ».
    complete: casses.length === 0 && nonMesures.length === 0,
  };
}

export function formatChaineXp(chaine) {
  const l = [`Chaîne XP : ${chaine.branches}/${chaine.total} maillon(s) branché(s)${chaine.complete ? " — la chaîne est complète." : " — la chaîne est INCOMPLÈTE, la valeur produite se perd quelque part."}`];
  for (const m of chaine.maillons) l.push(`  ${m.etat === "branché" ? "✅" : m.etat === "cassé" ? "🔴" : "⚪"} ${m.libelle} — ${m.detail}`);
  return l;
}

export function constatsChaineXp(chaine) {
  return chaine.maillons.filter((m) => m.etat !== "branché").map((m) => ({
    constat: `maillon « ${m.cle} » ${m.etat} — sans lui, ${m.sansQuoi}`,
    etat: m.etat === "cassé" ? RETENU : A_TRANCHER,
    tache: m.etat === "cassé" ? `brancher ${m.preuve} dans ${m.fichier}` : `rendre ${m.fichier} lisible, ou retirer ce maillon de la chaîne s'il n'a plus lieu d'être`,
  }));
}

// ————————————————————————————————————————————————————————————————————————
// LE COMPTEUR DE REMONTÉES — est-ce que ressortir sert réellement à quelque chose ?
// ————————————————————————————————————————————————————————————————————————
//
// DEUX AMÉLIORATIONS D'UN SEUL MÉCANISME (2026-09-23, tâche #222, pistes ① et ②) — elles sont
// séparées dans l'intention et indissociables dans la mesure, parce que les deux ont besoin de la
// même donnée : combien de fois une entrée est REMONTÉE, et sur combien d'occasions.
//
// ① « Ressortir sert-il à quelque chose ? » Jusqu'ici l'entrée s'affichait et personne ne savait si
//    ça changeait quoi que ce soit. Une entrée remontée vingt fois et JAMAIS jugée appliquée par
//    l'utilisateur est soit inutile, soit mal formulée — dans les deux cas c'est une information, et
//    c'est la seule qui mesure l'objectif principal (mettre en pratique, pas archiver).
// ② « Le registre n'a pas de sortie. » Rien n'en retirait jamais rien. Une entrée qui ne correspond
//    à rien pendant des dizaines d'occasions est du poids mort, et un registre qui ne fait que
//    grossir finit par ne plus être lu — donc par ne plus rien protéger.
//
// LE GARDE-FOU CONTRE L'ACCUSATION PRÉMATURÉE (L4, qui est elle-même dans le registre) : une entrée
// n'est jamais jugée avant d'avoir eu assez d'occasions de servir, et ces occasions se comptent
// DEPUIS SA PROPRE ARRIVÉE, jamais depuis le début du compteur — sinon une entrée écrite ce matin
// hériterait du passé de toutes les autres et serait condamnée avant d'avoir vécu.
// POURQUOI CE FICHIER EST UN JOURNAL LOCAL, À LA RACINE ET JAMAIS COMMITTÉ (corrigé le
// 2026-09-23, quelques minutes après sa création). Il vit d'abord dans docs/tool-learning/, et le
// défaut est apparu au premier commit qui l'a fait vivre : il est écrit par le crochet
// POST-commit, donc il ne peut PAS faire partie du commit qui le met à jour — il laisse le dépôt
// modifié après chaque commit, indéfiniment. Un état permanent « il y a des changements non
// committés » finit par être ignoré, et ce jour-là c'est un vrai changement non committé qu'on ne
// verra plus. C'est la leçon L6 (une alarme permanente fait dépenser du travail) reproduite par le
// mécanisme même que j'ai écrit pour la faire respecter.
//
// Sa vraie famille était déjà là, et il suffisait de regarder : les journaux d'état locaux du
// projet (santé des clés, compteur d'usage, anti-doublons de passage) sont tous à la racine, en
// `.fichier.json`, dans .gitignore, et DÉCLARÉS dans LOCAL_JOURNALS chez Doc-Report — qui vérifie
// mécaniquement qu'aucun d'eux ne traîne hors de .gitignore, un journal local oublié là étant un
// vrai risque de fuite au commit suivant. Ce compteur est exactement de cette nature : une mesure
// de MON rythme de travail local, jamais un état du projet que quelqu'un d'autre doit relire.
export const REMONTEES_PATH = ".xp-remontees.json";
export const SEUILS_REMONTEES = {
  // Assez d'occasions pour qu'un silence veuille dire quelque chose. Volontairement haut : accuser
  // une entrée utile de ne servir à rien la ferait retirer, et on repaierait son erreur d'origine.
  occasionsAvantDeJuger: 25,
  // Assez de remontées pour que l'absence de jugement d'application devienne une question.
  remonteesAvantDeDouter: 8,
};

export function loadRemontees({ root = ROOT, readFileImpl = readFileSync } = {}) {
  try {
    const brut = JSON.parse(readFileImpl(join(root, REMONTEES_PATH), "utf8"));
    return { occasions: Number(brut.occasions) || 0, entrees: brut.entrees && typeof brut.entrees === "object" ? brut.entrees : {} };
  } catch { return { occasions: 0, entrees: {} }; }
}

// Appelée par les points de remontée RÉELS (tool-brain et le crochet de commit), jamais par
// leconsPourTache() elle-même : cette fonction-là est consultée par les tests et par des appelants
// qui ne « voient » rien, et compter leurs appels fausserait la mesure avec du bruit d'outillage.
export function enregistrerRemontee(idsServis = [], { toutes = [], root = ROOT, readFileImpl = readFileSync, writeFileImpl = writeFileSync, date = new Date().toISOString().slice(0, 10) } = {}) {
  const c = loadRemontees({ root, readFileImpl });
  c.occasions += 1;
  for (const l of toutes) {
    const e = c.entrees[l.id] ?? (c.entrees[l.id] = { remontees: 0, premiereObservation: date, occasionsALObservation: c.occasions - 1, derniere: null });
    // Une entrée déjà connue garde sa date d'arrivée : c'est elle qui rend son silence interprétable.
    if (!e.premiereObservation) { e.premiereObservation = date; e.occasionsALObservation = c.occasions - 1; }
  }
  for (const id of idsServis) {
    const e = c.entrees[id] ?? (c.entrees[id] = { remontees: 0, premiereObservation: date, occasionsALObservation: c.occasions - 1, derniere: null });
    e.remontees += 1; e.derniere = date;
  }
  writeFileImpl(join(root, REMONTEES_PATH), JSON.stringify(c, null, 2) + "\n", "utf8");
  return c;
}

export function analyseRemontees(compteur = { occasions: 0, entrees: {} }, lecons = [], jugements = [], { seuils = SEUILS_REMONTEES } = {}) {
  const appliquees = new Set(jugements.filter((j) => j.verdict === "appliquée" && j.entree).map((j) => j.entree));
  const etats = lecons.map((l) => {
    // Une entrée absorbée par une fusion n'est plus jugée : elle ne sert plus, c'est le but.
    if (l.fusionneeDans) return { id: l.id, etat: "renvoi", detail: `fusionnée dans ${l.fusionneeDans} — conservée comme renvoi pour que les citations existantes mènent quelque part` };
    const e = compteur.entrees[l.id];
    if (!e) return { id: l.id, etat: "jamais observée", detail: "le compteur ne l'a pas encore vue passer — aucune conclusion possible" };
    const occasions = Math.max(0, compteur.occasions - (e.occasionsALObservation ?? 0));
    if (occasions < seuils.occasionsAvantDeJuger) return { id: l.id, etat: "trop tôt", remontees: e.remontees, occasions, detail: `${occasions} occasion(s) depuis son arrivée, il en faut ${seuils.occasionsAvantDeJuger} pour qu'un silence veuille dire quelque chose` };
    if (!e.remontees) return { id: l.id, etat: "jamais servie", remontees: 0, occasions, detail: `jamais remontée en ${occasions} occasions — soit son terrain est mal déclaré, soit elle n'a plus lieu d'être` };
    if (e.remontees >= seuils.remonteesAvantDeDouter && !appliquees.has(l.id)) return { id: l.id, etat: "sert sans effet connu", remontees: e.remontees, occasions, detail: `remontée ${e.remontees} fois et jamais jugée appliquée — soit elle ne sert à rien telle qu'elle est écrite, soit personne n'a encore tranché` };
    return { id: l.id, etat: "vivante", remontees: e.remontees, occasions, detail: `remontée ${e.remontees} fois${appliquees.has(l.id) ? ", et jugée appliquée au moins une fois" : ""}` };
  });
  return { occasions: compteur.occasions, etats, aRetirer: etats.filter((e) => e.etat === "jamais servie").map((e) => e.id), sansEffet: etats.filter((e) => e.etat === "sert sans effet connu").map((e) => e.id) };
}

export function formatRemontees(analyse, groupes = []) {
  const l = [`Remontées : ${analyse.occasions} occasion(s) mesurée(s) depuis la mise en place du compteur.`];
  const parEtat = {};
  for (const e of analyse.etats) (parEtat[e.etat] ??= []).push(e.id);
  for (const [etat, ids] of Object.entries(parEtat)) l.push(`  · ${etat} : ${ids.join(", ")}`);
  if (groupes.length) {
    l.push(`  · ${groupes.length} groupe(s) d'entrées équivalentes — une fusion rendrait le rappel plus efficace sans rien perdre :`);
    for (const g of groupes) l.push(`      ${g.ids.join(" + ")} (${g.raisons[0]})`);
  } else l.push("  · aucune entrée équivalente à une autre : le registre ne dit pas deux fois la même chose.");
  return l;
}

export function constatsRemontees(analyse, groupes = [], lecons = []) {
  return [
    ...analyse.aRetirer.map((id) => ({
      constat: `${id} n'est jamais remontée en ${analyse.etats.find((e) => e.id === id)?.occasions} occasions — poids mort dans un registre qui ne cesse de grossir`,
      etat: A_TRANCHER, tache: `reformuler le terrain de ${id} pour qu'elle atteigne enfin les situations où elle s'applique, ou la retirer du registre` })),
    ...analyse.sansEffet.map((id) => ({
      constat: `${id} remonte souvent et n'a jamais été jugée appliquée — ressortir ne suffit visiblement pas`,
      etat: A_TRANCHER, tache: `à la Ronde, juger si ${id} a été appliquée ; si non, la réécrire pour qu'elle dise un geste concret plutôt qu'un principe` })),
    ...groupes.map((g) => ({
      constat: `${g.ids.join(" et ")} disent la même chose (${g.raisons[0]}) — elles occupent deux places du plafond de remontée là où une suffirait`,
      etat: A_TRANCHER, tache: `fusionner ${g.ids.join(" + ")} en gardant l'union des terrains, des porteurs et des provenances, et laisser un renvoi sur chaque identifiant absorbé` })),
  ];
}

export function formatLecons(audit) {
  const l = [];
  if (audit.mesure !== "mesuré") { l.push(`· pas mesuré — ${audit.raison}`); return l; }
  l.push(`${audit.total} entrée(s) — ${audit.lecons_} leçon(s) payée(s) par une erreur, ${audit.pratiques} bonne(s) pratique(s).`);
  l.push(`Tenue : ${audit.portees} portée(s) par un mécanisme réel, ${audit.sansMecanisme} sans mécanisme possible (déclaré), ${audit.sansPorteur} sans porteur, ${audit.fantomes} porteur(s) fantôme(s).`);
  l.push(`Mise en pratique : ${audit.applicables}/${audit.total} peuvent remonter au bon moment${audit.sansTerrain.length ? ` — sans terrain déclaré : ${audit.sansTerrain.join(", ")}` : ""}.`);
  for (const x of audit.lecons) {
    const marque = x.etat === "portée" ? "✅" : x.etat === "sans mécanisme" ? "📄" : "⚠️";
    l.push(`  ${marque} ${x.id} (${x.etat}) — ${x.detail}`);
  }
  return l;
}

// Les constats que cet audit verse au plan d'action. Une leçon « sans mécanisme » n'en produit
// AUCUN : elle a déjà été tranchée, et la reprocher à chaque passage serait L6 commise dans
// l'outil qui la publie.
export function constatsLecons(audit) {
  if (audit.mesure !== "mesuré") return [{ constat: `registre des leçons : ${audit.raison}`, etat: "retenu", tache: `rétablir ${LECONS_PATH}, ou retirer l'obligation qui le cite` }];
  return [
    ...audit.lecons.filter((x) => x.etat === "porteur fantôme").map((x) => ({
      constat: `${x.id} annonce un porteur qui n'existe pas (${(x.morts ?? []).join(", ")}) — une référence morte ressemble à une garantie`,
      etat: "retenu", tache: `nommer le vrai mécanisme de ${x.id} dans ${LECONS_PATH}, ou déclarer l'impossibilité avec sa raison` })),
    ...audit.lecons.filter((x) => x.etat === "sans porteur").map((x) => ({
      constat: `${x.id} ne tient à aucun mécanisme et ne le déclare pas — elle disparaît avec la session qui l'a écrite`,
      etat: "retenu", tache: `donner un porteur à ${x.id}, ou écrire noir sur blanc qu'aucun n'est possible et pourquoi` })),
    ...(audit.sansTerrain ?? []).map((id) => ({
      constat: (audit.terrainCoupe ?? []).includes(id)
        ? `${id} déclare un terrain dont AUCUN mot n'est lu — cause la plus probable : le champ « Terrain » est écrit sur deux lignes, et seule la première est prise en compte`
        : `${id} ne déclare aucun terrain — elle ne remontera jamais au moment où elle s'applique, donc elle est archivée plutôt qu'appliquée`,
      etat: "retenu", tache: (audit.terrainCoupe ?? []).includes(id)
        ? `remettre le terrain de ${id} sur UNE SEULE ligne dans ${LECONS_PATH}`
        : `déclarer le terrain de ${id} dans ${LECONS_PATH} (les situations où elle mord, et les mots qui les signalent)` })),
  ];
}

function main() {
  // Cadre commun (pure-gold-unity, Ronde du 2026-09-22) : il datait sa sortie lui-même en plus
  // d'écrire son titre — deux informations que le cadre porte déjà, et qui divergeaient donc
  // silencieusement de celles de tous les autres rapports.
  printReportHeader({ tool: "tool-learning", title: "TOOL-LEARNING — l'apprentissage de l'outillage, et le mien à son égard", scriptPath: "scripts/tool-learning.mjs", origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
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

  // LE REGISTRE DES LEÇONS, affiché AVANT le plan d'action parce qu'il l'alimente (tâche #220).
  const auditL = auditLecons();
  console.log("\n=== PROCESS XP-IA-bonnes-pratiques-et-lecons — LE REGISTRE (docs/referentiel/lecons.md) ===");
  for (const l of formatLecons(auditL)) console.log(l);
  const journalXp = loadJournalXp();
  const xp = analyseXp(journalXp, auditL);
  console.log("");
  for (const l of formatXp(xp)) console.log(l);
  const chaine = auditChaineXp();
  console.log("");
  for (const l of formatChaineXp(chaine)) console.log(l);
  // L'EFFET RÉEL DU DISPOSITIF (tâche #222) : est-ce que ressortir sert, et que faut-il retirer.
  const remontees = analyseRemontees(loadRemontees(), auditL.mesure === "mesuré" ? auditL.lecons : [], journalXp.filter((e) => e.nature === "jugement"));
  const groupes = auditL.mesure === "mesuré" ? groupesEquivalents(auditL.lecons) : [];
  console.log("");
  for (const l of formatRemontees(remontees, groupes)) console.log(l);

  // LA REMISE À NIVEAU DU CODE (2026-09-23, chantier 7) — « est-ce que tout le code bénéficie de la
  // leçon que tu as apprise ? ». Couche MÉCANIQUE et continue : elle pose la question sur les
  // fichiers réellement touchés depuis chaque leçon. Le jugement, lui, reste le passage profond.
  if (auditL.mesure === "mesuré") {
    console.log("");
    console.log(formatRemiseANiveau(zonesARemettreANiveau(auditL.lecons)));
  }

  // LE PLAN D'ACTION (2026-09-23, tâche #211). TOOL-LEARNING porte la MOITIÉ 2 de l'évolutivité
  // (devenir meilleur), et ses deux constats visent deux responsables différents — les mélanger
  // reviendrait à me dédouaner sur le dos des outils.
  //
  // Un verdict RÉFUTÉ met en cause l'outil : il a jugé, et les faits l'ont démenti.
  // Un verdict IGNORÉ me met en cause, MOI : l'outil a dit quelque chose d'utile et je n'ai rien
  // fait. C'est le seul plan d'action du paysage dont les tâches me désignent nommément, et c'est
  // exactement ce que l'utilisateur demandait en construisant cet outil.
  const constatsApprentissage = [
    ...refutes.map((r) => ({ constat: `verdict réfuté par les faits : ${r.outil} — ${r.pourquoi ?? "jugement démenti depuis"}`, etat: "retenu",
      tache: `corriger le jugement de ${r.outil}, ou écrire pourquoi le verdict tenait quand même` })),
    ...surMoi.ignores.map((i) => ({ constat: `verdict ignoré PAR MOI : ${i.outil}, jugé « ${i.verdict} » le ${i.depuis}, revu ${i.passages} fois sans un seul commit depuis`, etat: "retenu",
      tache: `traiter ce que ${i.outil} dit depuis le ${i.depuis}, ou écarter son verdict explicitement — le revoir sans agir n'est ni l'un ni l'autre` })),
    ...constatsLecons(auditL),
    ...xp.constats,
    ...constatsChaineXp(chaine),
    ...constatsRemontees(remontees, groupes, auditL.lecons ?? []),
  ];
  const planAppr = buildPlanDaction(constatsApprentissage, { toolSlug: "tool-learning" });
  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of planAppr.lignes) console.log(l);
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
