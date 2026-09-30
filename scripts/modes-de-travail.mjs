// ICEBERG: membre
// modes-de-travail.mjs (2026-09-23) — LES TROIS MODES DE TRAVAIL, déclarés une fois et lus partout.
//
// POURQUOI CE FICHIER EXISTE, ET CE QU'IL CORRIGE. Le projet vivait sur UN booléen,
// `nightAutonomousMode`, recopié dans 31 endroits. Il portait à lui seul deux questions qui n'ont
// rien à voir : « l'utilisateur est-il là pour répondre ? » et « une fenêtre de question a-t-elle
// le droit de bloquer ? ». Tant qu'il n'existait que deux situations (piloté, nuit), les confondre
// ne se voyait pas. Le mode semi-autonome, demandé le 2026-09-23 (« c'est comme le mode autonome,
// sauf que je suis present et je peux repondre aux questions »), sépare les deux pour de bon :
// l'utilisateur EST là, et pourtant rien ne doit bloquer.
//
// UN REGISTRE, JAMAIS UNE ÉNUMÉRATION DANS CHAQUE OUTIL (Article 24). Un quatrième mode s'ajoute
// ici et nulle part ailleurs ; ce qui gouverne un comportement est une CLÉ de ce registre, jamais
// un `if (mode === "...")` recopié. Le garde-fou qui va avec est plus bas : un outil qui teste un
// mode inconnu se signale.

// CE FICHIER EST UN MODULE DE RÈGLES, PAS UN OUTIL DE L'AGENCE (2026-09-23).
// Les trois modes de travail sont le sujet de ce process : le module en porte la donnée, le process en porte le déroulé.
// Sans ce marqueur, integration-outil réclamait pour lui un blueprint, une fiche et une place
// au catalogue — dix inscriptions pour un module qui n'a rien en propre à documenter.
export const PROCESS_HOTE = "semi-autonome";

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { recordCliUsage } from "./tool-usage.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const MODE_PATH = ".mode-de-travail.json";

// LES QUATRE CLÉS DE COMPORTEMENT, et chacune répond à une question différente. Les fusionner est
// exactement l'erreur que ce fichier répare : « présent » et « peut bloquer » sont indépendants.
export const CLEFS_DE_MODE = ["utilisateurPresent", "fenetrePeutBloquer", "questionsReportees", "surQuestionEnAttente"];

export const MODES = [
  {
    slug: "pilote",
    nom: "piloté",
    quand: "l'utilisateur suit la conversation et répond dans la foulée",
    utilisateurPresent: true,
    // Une fenêtre PEUT attendre sa réponse : c'est le mode où une question est le geste normal.
    fenetrePeutBloquer: true,
    questionsReportees: false,
    surQuestionEnAttente: "attendre la réponse — c'est le mode où l'échange est le travail",
  },
  {
    slug: "semi-autonome",
    nom: "semi-autonome",
    quand: "l'utilisateur est là mais pas devant l'écran : il répondra, plus tard",
    // LE MODE DEMANDÉ LE 2026-09-23, et son intérêt tient à cette combinaison précise : présent ET
    // non bloquant. Une question posée n'est pas perdue (il y répondra), et pourtant rien ne
    // s'arrête en attendant — sa consigne, dite deux fois : « tu ne dois pas t'arreter ».
    utilisateurPresent: true,
    fenetrePeutBloquer: false,
    questionsReportees: false,
    // CALIBRÉ PAR LUI EN FENÊTRE, contre les deux autres options proposées : ni arrêt, ni hypothèse
    // prise à sa place. Une tâche de réserve est du travail réel, sans risque et sans décision de
    // conception — donc rien à défaire s'il tranche autrement.
    surQuestionEnAttente: "prendre une tâche de réserve (documentation, couverture de tests, dette) — jamais s'arrêter, jamais décider à sa place",
  },
  {
    slug: "autonome",
    nom: "autonome (nuit)",
    quand: "l'utilisateur est absent et ne répondra pas avant son retour",
    utilisateurPresent: false,
    fenetrePeutBloquer: false,
    // La différence réelle avec le semi-autonome : une question posée à personne n'est pas une
    // vérification, c'est un blocage. Elle est donc REPORTÉE au prochain passage en sa présence.
    questionsReportees: true,
    surQuestionEnAttente: "reporter la question au retour de l'utilisateur et continuer le plan gelé",
  },
];

export function modeParSlug(slug, modes = MODES) {
  return modes.find((m) => m.slug === slug) ?? null;
}

// LE MODE COURANT, persisté — jamais deviné. Un agent qui reprend la session au milieu doit pouvoir
// savoir dans quel mode il travaille sans le demander : la mémoire d'un agent ne survit pas
// (Article 27), un fichier oui. Aucun mode enregistré rend « piloté », le seul défaut sûr : il est
// le seul des trois où une question ARRÊTE, donc le seul qui ne peut jamais faire trop.
export function modeCourant({ root = ROOT, readFileImpl = readFileSync, existsImpl = existsSync } = {}) {
  const chemin = join(root, MODE_PATH);
  try {
    if (!existsImpl(chemin)) return modeParSlug("pilote");
    const data = JSON.parse(readFileImpl(chemin, "utf8"));
    return modeParSlug(data?.slug) ?? modeParSlug("pilote");
  } catch { return modeParSlug("pilote"); }
}

// LA FRAÎCHEUR DU MODE — un état déclaré une fois n'est pas un état vrai (2026-09-30, tâche #1284)
//
// LE FAIT MESURÉ, ET IL DURAIT DEPUIS SEPT JOURS. `.mode-de-travail.json` portait « autonome »,
// déclaré le 2026-09-23 à 22h53 et jamais retouché depuis. Pendant sept jours — donc pendant
// toutes les séances de JOUR où l'utilisateur était là et répondait en direct — tout lecteur du
// mode recevait « utilisateur absent, une fenêtre ne peut pas bloquer, questions reportées ».
//
// CE QUE ÇA CONTREDIT EST LA RÈGLE QUE LE MODE EST CENSÉ SERVIR. L'Article 16 dit « mieux vaut
// trop de questions que pas assez » ; le mode existe pour savoir si une question peut être posée
// maintenant. Resté bloqué sur « autonome », il répondait NON à cette question pendant que
// l'utilisateur attendait devant son écran. Un mécanisme de protection retourné contre ce qu'il
// protège est pire qu'un mécanisme absent, parce qu'il inspire confiance.
//
// LA CAUSE N'EST PAS UN OUBLI, C'EST UNE ABSENCE DE PORTEUR. `modeCourant()` lit `slug` et ignore
// `depuis`, qui est pourtant écrit dans le fichier depuis le premier jour. L'avertissement existait
// même en toutes lettres — « si le mode n'a pas été changé, il décrit l'intention d'hier » — mais
// une phrase qui prévient d'un risque sans jamais mesurer s'il s'est réalisé n'est pas un
// garde-fou : c'est une clause de style (Article 27).
//
// POURQUOI SEULS DEUX MODES EXPIRENT, ET C'EST CE QUI REND LE SIGNAL LISIBLE (leçon L4) : « piloté »
// n'affirme rien qui se périme — c'est le repli de `modeCourant()` et l'état normal du travail.
// Les deux autres affirment quelque chose de DATÉ : que l'utilisateur est absent, ou qu'il n'est
// pas devant l'écran. Une nuit ne dure pas sept jours ; une absence, si.
//
// LE SEUIL EST DÉRIVÉ DE CE QU'IL AFFIRME, jamais choisi au hasard : 16 heures, soit la plus longue
// nuit plausible. Au-delà, l'affirmation n'est plus invérifiée, elle est invraisemblable.
export const HEURES_AVANT_QU_UN_MODE_DATE = 16;
export const MODES_QUI_EXPIRENT = ["autonome", "semi-autonome"];
export function fraicheurDuMode({ root = ROOT, readFileImpl = readFileSync, existsImpl = existsSync, maintenant = Date.now() } = {}) {
  const chemin = join(root, MODE_PATH);
  let data = null;
  try { if (existsImpl(chemin)) data = JSON.parse(readFileImpl(chemin, "utf8")); } catch { data = null; }
  if (!data) return { mesurable: false, pourquoi: "aucun mode déclaré sur disque — le repli « piloté » s'applique, et il n'a pas de date à vieillir" };
  const depuis = Date.parse(data?.depuis ?? "");
  if (!Number.isFinite(depuis)) {
    // UN MODE SANS DATE N'EST PAS UN MODE FRAIS (L5/L11) : les deux s'écriraient « 0 h ».
    return { mesurable: false, slug: data?.slug ?? null, pourquoi: "le mode est déclaré sans date lisible — son âge ne peut pas être calculé, ce qui n'est pas la même chose qu'un mode récent" };
  }
  const heures = Math.round((maintenant - depuis) / 36e5);
  const expire = MODES_QUI_EXPIRENT.includes(data?.slug);
  return {
    mesurable: true,
    slug: data?.slug ?? null,
    depuis,
    heures,
    expire,
    date: heures > HEURES_AVANT_QU_UN_MODE_DATE && expire,
  };
}

// La phrase à imprimer à côté du mode, jamais à la place. Elle ne CHANGE aucun mode : décider que
// l'utilisateur est revenu n'est pas une déduction mécanique, et le faire à sa place rendrait
// exactement le type de verdict que ce fichier existe pour éviter.
export function formatFraicheurDuMode(f) {
  if (!f?.mesurable) return `   ⚠️ ÂGE DU MODE NON MESURÉ — ${f?.pourquoi ?? "fichier illisible"}`;
  if (!f.expire) return `   (déclaré il y a ${f.heures} h — « ${f.slug} » n'affirme rien de daté, il ne se périme pas)`;
  if (!f.date) return `   (déclaré il y a ${f.heures} h — encore plausible pour « ${f.slug} »)`;
  return `   🚨 MODE DATÉ — « ${f.slug} » est déclaré depuis ${f.heures} h, soit plus que la plus longue nuit plausible (${HEURES_AVANT_QU_UN_MODE_DATE} h). Il affirme que l'utilisateur est absent ; personne ne l'a revérifié depuis. Tant qu'il n'est pas redéclaré (node scripts/modes-de-travail.mjs <mode>), toute décision de NE PAS poser une question s'appuie sur une affirmation périmée.`;
}
export function passerEnMode(slug, { root = ROOT, writeFileImpl = writeFileSync, now = new Date() } = {}) {
  const mode = modeParSlug(slug);
  if (!mode) throw new Error(`Mode inconnu : « ${slug} ». Les modes déclarés sont ${MODES.map((m) => m.slug).join(", ")} — un mode s'ajoute dans MODES, jamais à l'appel.`);
  const enregistrement = { slug: mode.slug, depuis: now.toISOString() };
  writeFileImpl(join(root, MODE_PATH), JSON.stringify(enregistrement, null, 1), "utf8");
  return enregistrement;
}

// LA QUESTION QUE TOUT LE PAYSAGE POSE, en un seul endroit. Les 31 `nightAutonomousMode` du dépôt
// posaient tous, en réalité, celle-ci — et la posaient mal, puisqu'un booléen ne distingue pas
// « absent » de « présent mais occupé ».
export function fenetrePeutBloquer(mode = modeCourant()) {
  return Boolean(mode?.fenetrePeutBloquer);
}

// GARDE-FOU D'ÉVOLUTIVITÉ (Article 24) : un outil qui teste un mode par son nom écrit en dur se
// signale ici. Sans ça, un quatrième mode ajouté à MODES laisserait derrière lui des comparaisons
// qui ne correspondent plus à rien, et personne ne le saurait avant qu'un comportement ne dérape.
export function findModesInconnusCites(texte, modes = MODES) {
  const connus = new Set(modes.map((m) => m.slug));
  const cites = [...String(texte ?? "").matchAll(/mode\s*===?\s*["'`]([a-z-]+)["'`]/g)].map((m) => m[1]);
  return [...new Set(cites)].filter((s) => !connus.has(s));
}

export function formatModes(modes = MODES, courant = null) {
  const l = ["=== Modes de travail ==="];
  for (const m of modes) {
    l.push("", `${courant?.slug === m.slug ? "▶ " : "  "}${m.nom} (${m.slug}) — ${m.quand}`);
    l.push(`    utilisateur présent : ${m.utilisateurPresent ? "oui" : "non"} · une fenêtre peut bloquer : ${m.fenetrePeutBloquer ? "oui" : "non"} · questions reportées : ${m.questionsReportees ? "oui" : "non"}`);
    l.push(`    si une question reste en attente : ${m.surQuestionEnAttente}`);
  }
  return l.join("\n");
}

// LE PASSAGE S'ENREGISTRE : la raison complète vit à côté de `recordCliUsage()` (scripts/tool-usage.mjs).
if (import.meta.url === `file://${process.argv[1]}`) {
  recordCliUsage("modes-de-travail");
  const demande = process.argv[2];
  if (demande) { const e = passerEnMode(demande); console.log(`Mode de travail : ${e.slug} (depuis ${e.depuis}).`); }
  console.log(formatModes(MODES, modeCourant()));
  // L'ÂGE APRÈS LA LISTE, jamais à la place : le mode déclaré reste la réponse, sa fraîcheur
  // est ce qui dit si on peut s'y fier. Les taire ensemble, c'est ce qui a duré sept jours.
  console.log(formatFraicheurDuMode(fraicheurDuMode()));
}
