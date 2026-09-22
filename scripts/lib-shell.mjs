// Petit assistant partagé pour lancer une commande shell sans jamais faire planter l'appelant sur
// un code de sortie non nul (2026-09-19, extrait après avoir trouvé la même fonction réécrite à
// l'identique dans trois scripts — always-new-code.mjs, check-level-target.mjs,
// hyper-scan-checkpoint.mjs — exactement le genre de duplication que la nouvelle règle de
// mutualisation de docs/regles-de-travail.md §7ter est censée empêcher désormais).

import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// PERSONNAGES — HORS DE L'ÉQUIPE, JAMAIS UNE CATÉGORIE DE L'ORGANIGRAMME (2026-09-21, tâche #245,
// corrigé le même soir après un second quasi-recouvrement). Root-cause réelle, en deux temps :
// (1) une confusion commise ce soir-là — proposer d'appliquer MEMENTO (pensé pour la mémoire
// narrative de Lia/Noé) comme condition du badge des membres de l'équipe (scripts comme
// ARGUS/HARMONIA) ; corrigée sur le moment en ajoutant "Personnages" comme une 5e catégorie DE
// L'ORGANIGRAMME lui-même (à côté de Direction/Équipe noyau/Membre de l'équipe/VIP). (2) Cette
// correction était elle-même la mauvaise forme de réparation : en gardant Lia/Noé DANS le même
// tableau que l'équipe (juste une case de plus), elle laissait la porte ouverte à ce que le même
// type de confusion revienne (constaté une seconde fois en construisant le menu PRESTATIONS de
// MEMENTO). Root-cause plus profonde encore, antérieure à #245 : la toute première note de
// conception de CASSANDRA-RH (docs/suivi 2026-09-20T09:40Z) prévoyait déjà qu'elle "noterait TOUS
// les membres de l'équipe [...] les mascottes Lia/Noé" — l'idée fondatrice mélangeait les deux
// avant même qu'une séparation existe. Décision finale (demande explicite de l'utilisateur,
// 2026-09-21) : Lia et Noé n'ont AUCUNE existence dans l'équipe — ce sont des personnages de la
// simulation, un domaine entièrement séparé (charte de contenu CLAUDE.md), jamais une case de
// l'organigramme de travail (docs/regles-de-travail.md). Cette constante n'est donc pas une
// catégorie interne à ranger à côté des autres : c'est une LISTE D'EXCLUSION, un pare-feu au bord
// du domaine équipe. Partagée ici (jamais dans le-coordinateur.mjs, pour que memory-audit puisse
// l'importer aussi sans créer de cycle) : aucun mécanisme pensé pour l'équipe (badge, PRESTATIONS,
// blueprint, couverture AXA-CHECK) ne doit jamais s'appliquer à Lia/Noé, et réciproquement aucun
// mécanisme de mémoire/cohérence narrative pensée pour eux (memory-audit) ne doit jamais s'appliquer
// à un script.
export const PERSONNAGES = new Set(["Lia", "Noé", "Noe"]);

// AGENT_CATEGORIES (2026-09-22, demande explicite de l'utilisateur : « le badge de chaque employé
// de l'agence codex mentionne la catégorie à laquelle il appartient »). Miroir en code de
// `docs/referentiel/organisation-agence.md` — clé = slug (`slugifyAgentName()`, le-coordinateur.mjs),
// valeur = le libellé de catégorie exact du document canonique. Partagée ici (même raison que
// PERSONNAGES ci-dessus, éviter un cycle d'import) pour que `checkAgentOnboarding()` (badge) ET tout
// futur outil (CASSANDRA-RH) lisent la MÊME source, jamais deux copies divergentes. Seuls les outils
// de statut "Agent" (badge-éligibles) sont listés ici — un Utilitaire nommé/Infrastructure n'a
// jamais de badge, donc jamais besoin d'y figurer. À tenir à jour à chaque changement d'organigramme
// (même discipline que la table maîtresse `docs/regles-de-travail.md` §7ter, Article 13).
export const AGENT_CATEGORIES = {
  // Les Agents Cadre (Direction/CODIR) — nom acté le 2026-09-22
  "cassandra-rh": "Agent Cadre",
  "le-coordinateur": "Agent Cadre",
  // Les Gardiens sacrés du code (Article 20 — tourne automatiquement à chaque commit)
  argus: "Gardien sacré du code",
  harmonia: "Gardien sacré du code",
  "axa-check": "Gardien sacré du code",
  "clean-dirty-old": "Gardien sacré du code",
  "clone-hunter": "Gardien sacré du code",
  // ALWAYS-NEW-CODE (2026-09-21) : sixième Gardien, couche LÉGÈRE seulement (recommendZone() +
  // addendaSignal()/churnSignal(), zéro raisonnement) — le vrai zoom profond, qui exige un
  // raisonnement payant, reste explicitement exclu du statut de Gardien (cf.
  // docs/referentiel/organisation-agence.md §3, critère double : c'est le LIVRABLE qui exige un
  // raisonnement payant qui ne peut jamais devenir un Gardien, jamais le nom de l'outil dans son
  // ensemble — sa couche légère satisfait le critère double exactement comme les 5 autres).
  "always-new-code": "Gardien sacré du code",
  // Suite Suivi-Conso
  "smart-conso-api": "Membre — Suite Suivi-Conso",
  "smart-conso-token": "Membre — Suite Suivi-Conso",
  "objectifs-vs-resultats": "Membre — Suite Suivi-Conso",
  "ecotoken": "Membre — Suite Suivi-Conso",
  // Suite Audit Simulation
  "el-professor": "Membre — Suite Audit Simulation",
  "the-screener": "Membre — Suite Audit Simulation",
  "memory-audit": "Membre — Suite Audit Simulation",
  // Suite Audit lourd
  "the-final-judge": "Membre — Suite Audit lourd",
  "the-deep-reader": "Membre — Suite Audit lourd",
  "hyper-scan-checkpoint": "Membre — Suite Audit lourd",
  // Suite Dette & Structure du code (ALWAYS-NEW-CODE en est retiré le 2026-09-21 — promu Gardien
  // sacré du code ci-dessus, jamais listé deux fois)
  "find-booster": "Membre — Suite Dette & Structure du code",
  // La Cour du Roi
  "ines-official": "Membre — La Cour du Roi",
  "the-king": "Membre — La Cour du Roi",
  "check-tasks-details": "Membre — La Cour du Roi",
  // Les Agents Spéciaux
  "check-level-target": "Agent Spécial",
  "smart-breaker": "Agent Spécial",
};

export function assertNotAPersonnage(name, callerLabel) {
  if (PERSONNAGES.has(name)) {
    throw new Error(`${callerLabel} ne s'applique jamais à un Personnage ("${name}") — Lia et Noé n'ont aucune existence dans l'équipe de travail, ce sont des personnages de la simulation (cf. docs/suivi tâche #245 et sa correction du 2026-09-21). Un outil pensé pour la mémoire/cohérence narrative des personnages (ex. memory-audit) ne doit jamais recouper un outil de badge/blueprint/couverture de code.`);
  }
}

export function sh(cmd, { cwd, verbose = false, env } = {}) {
  try {
    return execSync(cmd, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    return verbose ? (e.stdout || "") + "\n[erreur: " + e.message + "]" : e.stdout || "";
  }
}

// Extrait le 2026-09-21 de check-tasks-details.mjs (même règle de mutualisation §7ter que sh()
// ci-dessus) : circle-tasks.mjs en a aussi besoin (garde-fou de fraîcheur du catalogue de la
// Ronde) et importer directement depuis check-tasks-details.mjs créerait un cycle avec
// daysSince() ci-dessous — résolu en plaçant les deux ici, jamais dans l'un ou l'autre. `root`
// doit être fourni SANS séparateur final (rappel trouvé le 2026-09-20 : un simple
// `slice(root.length + 1)` grignotait la première lettre de "docs/", faussant silencieusement
// toute vérification de registre en aval).
export function walkDocsPaths(dir, root, out = new Set()) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    out.add(full.slice(root.length).replace(/^[\\/]/, "").replace(/\\/g, "/"));
    if (entry.isDirectory()) walkDocsPaths(full, root, out);
  }
  return out;
}

// Extrait le 2026-09-21 de circle-tasks.mjs (audit d'évolutivité — nouveau signal
// chantier-preliminaire-signal) : circle-tasks.mjs doit désormais importer checkChantierFileFreshness()/
// loadAllTaskRows() de check-tasks-details.mjs, ce qui aurait créé exactement le même cycle que
// walkDocsPaths() ci-dessus si daysSince() était resté dans circle-tasks.mjs (check-tasks-details.mjs
// l'importait déjà de là). Résolu de la même façon : un utilitaire pur, sans dépendance vers l'un ou
// l'autre, vit ici — jamais dans l'un des deux fichiers qui en dépendent tous les deux.
export function daysSince(dateStr, now = Date.now()) {
  if (!dateStr) return undefined;
  const days = Math.floor((now - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));
  return days >= 0 ? days : undefined;
}

// shouldSnapshotText() (2026-09-21, extraite ici le 2026-09-22 pour être réutilisée par un second
// appelant, jamais un second calcul divergent — Article 3). Née dans the-king.mjs sous le nom
// shouldSnapshotPhilosophy() (demande explicite : « the-king doit aussi editer une version txt à
// jour de "politique et philo" à chaque ronde [...] propose » — choix assumé : jamais une cadence
// fixe en nombre de Rondes, le déclenchement est le changement RÉEL du contenu). Généralisée le
// même soir pour couvrir aussi la snapshot CLAUDE.md (claude-md-weight-signal, circle-tasks.mjs) —
// même besoin exact, même fonction, jamais une resemblance codée deux fois.
export function shouldSnapshotText(lastSnapshotText, currentText) {
  return lastSnapshotText == null || lastSnapshotText !== currentText;
}

// =============================================================================================
// RÉVEIL CONDITIONNEL DES GARDIENS (2026-09-22, tâche #362).
//
// LE CONSTAT QUI A MOTIVÉ CECI. Les six Gardiens tournaient intégralement à CHAQUE commit, sans
// jamais regarder ce que le commit contenait. Mesuré sur les 20 derniers commits : deux ne
// touchaient aucun fichier de code, et les dix-huit autres ne touchaient `lib/` QUE par
// `lib/reference.ts`. ARGUS a donc rescanné les champs de `lib/life.ts` vingt fois d'affilée sur un
// fichier qui n'avait pas bougé, remontant les six mêmes candidats — avec, ce soir-là, deux
// fichiers de scan archivés identiques octet pour octet hors horodatage.
//
// LA DISTINCTION QUI GOUVERNE TOUT (actée explicitement avec l'utilisateur le 2026-09-22) :
//   • Ce qui GARANTIT le code = check-house.mjs + tsc, dans le crochet pre-commit, BLOQUANTS.
//     Ceux-là tournent sur CHAQUE commit, sans condition, et cette fonction ne les concerne pas.
//   • Ce qui RENFORCE = les six Gardiens, dans le post-commit, qui n'ont jamais rien bloqué.
//     Eux seuls sont soumis au réveil conditionnel ci-dessous.
// Confondre les deux étages serait le vrai danger : conditionner les tests créerait un trou de
// surveillance, conditionner les Gardiens ne fait qu'éteindre du bruit.
export const NOT_REALLY_CODE = [
  // `lib/reference.ts` vit dans un dossier de code mais n'en est pas : c'est le référentiel
  // AFFICHÉ en jeu (panneau Admin), de la donnée narrative versionnée section par section. Il est
  // incrémenté à presque chaque commit, ce qui faisait passer tout commit pour un changement de
  // moteur — la cause racine du gaspillage mesuré. Aucun champ de life.ts ne peut mourir, aucun
  // bloc ne peut se dupliquer, aucune couverture de test ne peut bouger parce qu'il a changé.
  /^lib\/reference\.ts$/,
];

// Ce que chaque Gardien surveille RÉELLEMENT — lu dans leur code, jamais supposé (Article 19).
// ARGUS et CLONE-HUNTER balaient large (marqueurs TODO partout, duplication dans quatre racines) ;
// les autres sont plus ciblés. Un Gardien absent de cette table tourne toujours, par prudence :
// l'oubli d'une entrée ne doit jamais créer un angle mort silencieux.
export const GARDIEN_DOMAINS = {
  argus: [/^lib\//, /^app\//, /^components\//, /^scripts\//],
  harmonia: [/^lib\//, /^scripts\//, /^docs\//],
  "axa-check": [/^lib\//, /^scripts\//],
  "clean-dirty-old": [/^lib\//, /^scripts\//],
  "clone-hunter": [/^lib\//, /^scripts\//, /^app\//, /^components\//],
  "always-new-code": [/^lib\//, /^app\//, /^components\//],
};

export function realCodeFilesChanged(changedFiles, notReallyCode = NOT_REALLY_CODE) {
  return (changedFiles ?? []).filter((f) => !notReallyCode.some((re) => re.test(f)));
}

// Un Gardien se réveille si au moins un fichier RÉELLEMENT de code, dans son domaine, a changé.
// Répond toujours `true` pour un Gardien inconnu (prudence) et pour une liste de fichiers non
// fournie (on ne devine pas : ne pas savoir ce qui a changé n'autorise jamais à se taire).
export function gardienShouldRun(gardien, changedFiles, domains = GARDIEN_DOMAINS) {
  if (!changedFiles) return true;
  const domain = domains[gardien];
  if (!domain) return true;
  return realCodeFilesChanged(changedFiles).some((f) => domain.some((re) => re.test(f)));
}

// Les fichiers du dernier commit, tels que git les rapporte. Retourne `undefined` plutôt qu'une
// liste vide si git ne répond pas : une absence d'information doit faire tourner les Gardiens,
// jamais les endormir (même principe d'absence honnête que le reste du paysage).
export function lastCommitFiles(shImpl = sh, cwd = undefined) {
  try {
    const out = shImpl("git show --name-only --format= HEAD", cwd ? { cwd } : {});
    const files = String(out).split("\n").map((l) => l.trim()).filter(Boolean);
    return files.length ? files : undefined;
  } catch { return undefined; }
}
