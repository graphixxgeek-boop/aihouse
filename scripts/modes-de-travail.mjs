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

if (import.meta.url === `file://${process.argv[1]}`) {
  const demande = process.argv[2];
  if (demande) { const e = passerEnMode(demande); console.log(`Mode de travail : ${e.slug} (depuis ${e.depuis}).`); }
  console.log(formatModes(MODES, modeCourant()));
}
