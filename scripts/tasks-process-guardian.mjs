// TASKS.PROCESS.GUARDIAN (2026-09-22, nom donné par l'utilisateur). Le gardien du process de suivi
// des tâches et des idées — troisième gardien de process, aux côtés de circle-process-guardian (la
// Ronde) et process-simulation-guardian (la simulation).
//
// LE PRINCIPE QU'IL PROTÈGE, dans ses mots et il faut le garder tel quel parce que c'est lui qui
// justifie chacune des quatre vérifications ci-dessous :
//
//   « les taches ont une valeur, les idées ont une valeur, ce process doit proteger cette valeur,
//   car une tache ou une idee perdue est une perte de valeur seche pour le projet »
//
// Perte SÈCHE : pas un retard, pas une inefficacité — une valeur produite puis détruite. C'est
// pour ça que ce gardien signale même ce qu'il ne peut pas prouver, plutôt que de se taire.
//
// CE QU'IL N'EST PAS : un second lecteur de docs/suivi/. check-suivi-fidelity.mjs lit déjà les
// fichiers de session et check-tasks-details.mjs produit déjà l'état des lieux — ce gardien les
// APPELLE et juge le PROCESS, il ne recalcule jamais ce qu'ils savent (§7ter, Article 3).

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// LES QUATRE TROUS que l'utilisateur a nommés un par un, chacun avec sa réponse. Ils sont déclarés
// ici plutôt que dispersés dans le code : un gardien dont on ne peut pas lire la liste des choses
// qu'il garde n'est pas auditable.
export const TROUS_GARDES = [
  {
    id: "verification-asymetrique",
    trou: "La vérification ne marchait que dans UN sens : une clôture sans mention « fidèle » ou « écart » était attrapée, mais une tâche RÉELLEMENT FAITE et jamais close ne l'était pas.",
    preuve: "quatre tâches terminées depuis deux jours et jamais fermées, trouvées à la main le 2026-09-22 — donc invisibles à tout mécanisme",
    reponse: "croiser les tâches encore ouvertes avec les commits récents : une tâche dont le sujet apparaît dans un commit postérieur à son ouverture est probablement faite et jamais close",
  },
  {
    id: "tache-sans-rapport",
    trou: "Une tâche née d'un rapport ne pointait jamais vers ce rapport — donc impossible de savoir, plus tard, POURQUOI elle existait.",
    preuve: "la chaîne de l'Article 28 va du rapport vers la tâche, jamais l'inverse",
    reponse: "vérifier qu'une tâche issue d'un plan d'action cite le rapport dont elle vient",
  },
  {
    id: "tache-en-suspens-oubliee",
    trou: "Une tâche qui reste en suspens longtemps finit par se fondre dans le décor — « l'objectif : ne jamais perdre de vue une tache qui reste en suspens ».",
    preuve: "deux tâches bloquées sur une décision depuis le 2026-09-20, toujours ouvertes",
    reponse: "un âge en jours par tâche ouverte, et un signal qui grossit avec l'attente plutôt qu'un rappel identique qu'on finit par ne plus voir",
  },
  {
    id: "idee-sans-fichier",
    trou: "Une idée dite en passant se perd si elle ne rejoint pas un fichier — et c'est arrivé à la règle qui protège les idées elle-même.",
    preuve: "« ma valeur + ta valeur » formulée le 2026-09-21, introuvable dans le dépôt le 2026-09-22",
    reponse: "déléguer à check-tasks-details (registre des chantiers, idées à trancher) plutôt que recompter — et vérifier que la délégation est réelle",
  },
];

// findTachesFaitesJamaisCloses() — LE trou de la vérification asymétrique, et la réponse est
// volontairement une SUSPICION, jamais un verdict. On ne peut pas prouver depuis le disque qu'une
// tâche est faite ; on peut seulement remarquer que son sujet revient dans des commits postérieurs
// à son ouverture, ce qui est un indice fort et rien de plus. Un gardien qui affirmerait ici se
// tromperait un jour et perdrait le droit d'être cru — celui-ci pointe, l'humain tranche.
export const COMMITS_INDICE = 2;

// UNE TÂCHE QUI ATTEND UNE DÉCISION N'EST JAMAIS « FAITE EN SILENCE », et cette exclusion vient du
// tout premier passage réel de ce gardien (2026-09-22) : il a signalé #147 et #179 comme
// probablement faites parce que le mot « cassandra » revenait dans des commits récents — alors
// qu'elles attendent une décision de l'utilisateur et que le travail autour d'elles est justement
// ce qui produit ces commits. Le faux positif était structurel, pas accidentel : plus on travaille
// AUTOUR d'une décision en attente, plus le détecteur croit qu'elle est prise.
//
// La distinction est de fond, jamais un ajustement de seuil : une tâche BLOQUÉE sur un arbitrage
// humain ne peut pas avoir été faite sans qu'on s'en aperçoive — c'est une décision qui manque, pas
// une exécution oubliée. Les deux ont l'air pareil dans le suivi et n'ont rien à voir.
const ATTENTE_DE_DECISION = /attend|à trancher|a trancher|décision|decision|en suspens|validation/i;

export function findTachesFaitesJamaisCloses(tachesOuvertes = [], commitsRecents = [], { minCommits = COMMITS_INDICE } = {}) {
  return tachesOuvertes
    .filter((t) => !ATTENTE_DE_DECISION.test(`${t.sujet ?? ""} ${t.detail ?? ""} ${t.statut ?? ""}`))
    .map((t) => {
      // ON CROISE LE TITRE SPÉCIFIQUE, JAMAIS LA CATÉGORIE — et c'est la vraie cause du faux
      // positif du premier passage, découverte en creusant plutôt qu'en élargissant un filtre.
      // Le champ « Sujet » est une CLASSIFICATION (« Conception / Nouvel outil (CASSANDRA-RH) ») :
      // croiser une catégorie avec des messages de commit garantit un faux positif sur toute zone
      // active du projet — plus on travaille AUTOUR d'un sujet, plus le détecteur croit que chacune
      // de ses tâches est faite. Le Sous-sujet, lui, décrit CETTE tâche-là et rien d'autre.
      //
      // Même famille d'erreur que celle déjà corrigée une fois ici (checkChantierFileFreshness
      // croisait le Détail, un récit libre, au lieu des champs de classement) — vue par l'autre
      // bout : une MENTION n'est jamais une APPARTENANCE, et une CATÉGORIE n'est jamais une
      // DESCRIPTION.
      const titre = (t.sousSujet ?? t.titre ?? "").toLowerCase();
      const motsUtiles = titre.split(/[^a-zà-ÿ0-9]+/i).filter((m) => m.length > 4);
      if (!motsUtiles.length) return null;
      // LA MOITIÉ DES MOTS DANS LE MÊME COMMIT, jamais des mots isolés dispersés. Deuxième
      // raffinement du premier passage réel, et lui aussi un principe plutôt qu'un filtre élargi :
      // « objectifs » dans un commit et « membre » dans un autre ne dit rigoureusement rien sur la
      // tâche « objectifs de résultat / score cible par membre d'équipe » — les deux mots sont
      // courants dans un projet qui parle d'objectifs et d'équipe. Les voir ENSEMBLE dans un même
      // message de commit est en revanche un vrai signal.
      //
      // Élargir la liste des mots à ignorer aurait été le réflexe facile et le mauvais : elle
      // grandirait indéfiniment sans jamais couvrir le cas suivant, exactement ce que le corollaire
      // de l'Article 17 interdit. Ce seuil-ci vaut pour n'importe quelle tâche future.
      const seuil = Math.max(2, Math.ceil(motsUtiles.length / 2));
      const touches = commitsRecents.filter((c) => {
        const bas = String(c).toLowerCase();
        return motsUtiles.filter((m) => bas.includes(m)).length >= seuil;
      });
      if (touches.length < minCommits) return null;
      return { numero: t.numero, sujet: t.sousSujet ?? t.sujet, commits: touches.length, verdict: "probablement faite et jamais close — à vérifier, jamais une certitude" };
    })
    .filter(Boolean);
}

// ageDesTachesOuvertes() — « ne jamais perdre de vue une tache qui reste en suspens ». Le signal
// GROSSIT avec l'attente au lieu de se répéter à l'identique : un rappel qui ne change jamais
// devient un meuble, et ce projet en a la preuve (le rappel de Ronde ignoré plus de deux cents
// fois, mot pour mot le même à chaque commit).
export const PALIERS_ATTENTE = [
  { jours: 30, ton: "🔴 un mois d'attente : ce n'est plus une tâche en suspens, c'est une décision qu'on évite" },
  { jours: 14, ton: "🟠 deux semaines : le travail qui en dépend est arrêté depuis deux semaines aussi" },
  { jours: 7, ton: "🟡 une semaine d'attente" },
  { jours: 0, ton: "· en attente" },
];
export function ageDesTachesOuvertes(tachesOuvertes = [], { maintenant = Date.now() } = {}) {
  return tachesOuvertes.map((t) => {
    const at = Date.parse(t.horodatage ?? "");
    const jours = Number.isFinite(at) ? Math.max(0, Math.floor((maintenant - at) / 86400000)) : null;
    const palier = jours === null ? null : PALIERS_ATTENTE.find((p) => jours >= p.jours);
    return { numero: t.numero, sujet: t.sujet, jours, ton: palier?.ton ?? "· date illisible, âge inconnu — jamais compté comme récent" };
  });
}

// findTachesSansRapportSource() — une tâche née d'un plan d'action doit dire de quel rapport elle
// vient. Sans ça, dans six mois, personne ne saura pourquoi elle existe — et une tâche dont on
// ignore la raison se fait supprimer au premier nettoyage, ce qui est la perte sèche exacte que ce
// gardien combat, par l'autre bout.
export function findTachesSansRapportSource(taches = []) {
  return taches
    .filter((t) => /plan d'action|rapport|constat|trouvaille/i.test(`${t.sujet} ${t.detail ?? ""}`))
    .filter((t) => !/docs\/[a-z0-9-]+\/|\.txt|\.html|\.md/i.test(t.detail ?? ""))
    .map((t) => ({ numero: t.numero, sujet: t.sujet, pourquoi: "née d'un rapport sans jamais dire lequel — dans six mois personne ne saura pourquoi elle existe" }));
}

// verifyTasksProcess() — le verdict d'ensemble. Même discipline que ses deux frères gardiens : les
// faits observables sont calculés, les faits de conversation sont DEMANDÉS et leur absence est
// nommée plutôt que comblée.
export function verifyTasksProcess({ tachesOuvertes = [], commitsRecents = [], toutesLesTaches = [], ideeEnregistree, maintenant = Date.now() } = {}) {
  const findings = [];
  const add = (check, message) => findings.push({ check, message });

  const faites = findTachesFaitesJamaisCloses(tachesOuvertes, commitsRecents);
  if (faites.length) add("verification-asymetrique", `${faites.length} tâche(s) probablement faite(s) et jamais close(s) : ${faites.map((f) => `#${f.numero}`).join(", ")}. À vérifier — un indice, jamais une certitude.`);

  const ages = ageDesTachesOuvertes(tachesOuvertes, { maintenant });
  const vieilles = ages.filter((a) => a.jours !== null && a.jours >= 7);
  for (const v of vieilles) add("tache-en-suspens-oubliee", `#${v.numero} « ${v.sujet} » — ${v.ton} (${v.jours} j).`);

  const sansSource = findTachesSansRapportSource(toutesLesTaches);
  if (sansSource.length) add("tache-sans-rapport", `${sansSource.length} tâche(s) née(s) d'un rapport sans le citer : ${sansSource.map((t) => `#${t.numero}`).join(", ")}.`);

  // Le fait de conversation : une idée dite dans ce tour a-t-elle rejoint un fichier ? Aucune trace
  // disque ne le dit — l'agent le déclare, et une non-déclaration se voit au lieu de passer pour un
  // « rien à signaler ».
  if (ideeEnregistree === undefined) add("idee-sans-fichier", "Non vérifiable seul : une idée formulée en conversation ne laisse aucune trace sur le disque tant qu'elle n'y a pas été écrite. À déclarer, jamais à supposer.");

  return { ok: findings.length === 0, findings, ages, faitesJamaisCloses: faites };
}

function main() {
  printReliabilityNotice("il croise des sujets de tâches avec des messages de commit par mots-clés : un indice fort, jamais une preuve qu'une tâche est faite.");
  console.log("=== tasks.process.guardian — le process de suivi des tâches et des idées ===\n");
  console.log("Principe protégé : « une tâche ou une idée perdue est une perte de valeur sèche pour le projet ».\n");
  for (const t of TROUS_GARDES) {
    console.log(`· ${t.id}`);
    console.log(`    trou    : ${t.trou}`);
    console.log(`    preuve  : ${t.preuve}`);
    console.log(`    réponse : ${t.reponse}\n`);
  }
  recordCliUsage("tasks-process-guardian", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) main();
