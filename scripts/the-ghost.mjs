// ICEBERG: membre
// THE-GHOST — petit orchestrateur du mode nocturne autonome (2026-09-21, nommé par l'utilisateur :
// « créé un petit agent script "the-ghost" qui gere le mode autonome [...] quand je vais dormir ou
// quand je te laisse travailler seul »).
//
// Frontière stricte, clarifiée explicitement par l'utilisateur le même soir : check-tasks-details.mjs
// reste l'outil TRANSVERSE (utilisable à tout moment, pas seulement la nuit — évalue la pertinence
// et l'ordre des tâches via recommendNextTasks()). the-ghost ne réimplémente RIEN de ce jugement :
// il l'appelle. the-ghost ne gère QUE ce qui est propre au mode nocturne LUI-MÊME — le rituel
// d'entrée/de sortie, et le rythme de LA SESSION EN COURS (depuis quand elle dure, combien de
// tâches enchaînées, depuis quand aucune Ronde CIRCLE-TASKS n'a tourné). Aucun de ces trois signaux
// n'existait déjà ailleurs sous forme calculée, sauf la fraîcheur de la dernière Ronde — réutilisée
// telle quelle depuis circle-tasks.mjs::loadLastRun(), jamais un second calcul divergent (Article 3
// de CLAUDE.md).
//
// Volontairement mince, comme LE-COORDINATEUR/CIRCLE-TASKS : « on fait au plus rentable » (réponse
// explicite de l'utilisateur au calibrage du statut) — pas de blueprint, pas d'instanciation, pas
// de registre séparé. Documenté directement dans docs/regles-de-travail.md §7ter et §1bis, à côté
// du reste du paysage mince. Reste un pur conseiller, jamais un exécutant : il ne lance jamais lui-
// même une Ronde CIRCLE-TASKS ni aucune action coûteuse, il se contente de signaler le rythme.

import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { sh } from "./lib-shell.mjs";
import { loadLastRun } from "./circle-tasks.mjs";
import { printReportHeader } from "./report-template.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

const STATE_PATH = fileURLToPath(new URL("../.the-ghost-session.json", import.meta.url));

export function loadGhostState(readFile = (f) => readFileSync(f, "utf8")) {
  try {
    return JSON.parse(readFile(STATE_PATH));
  } catch {
    return null;
  }
}

// Seuil de rappel avant de suggérer une nouvelle Ronde — jamais une obligation mécanique (l'agent
// garde son jugement, cf. docs/regles-de-travail.md §1bis : « fréquence laissée au jugement de
// l'agent selon le volume réel de travail abattu ») : seulement un signal chiffré pour ne pas
// perdre le fil sur une longue nuit.
export const RONDE_REMINDER_HOURS = 3;

// Démarre une nouvelle fenêtre de mode nocturne — écrase toute session précédente : une nouvelle
// nuit repart de zéro, jamais un cumul indéfini d'une session jamais refermée proprement.
export function enterAutonomousMode(now = Date.now(), shImpl = sh) {
  const state = { startedAt: now, tasksChained: 0, chainedLabels: [] };
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 1));
  const zoomOutputs = {};
  for (const zoom of ["en_cours", "elargi", "projet_entier"]) {
    zoomOutputs[zoom] = shImpl(`node scripts/check-tasks-details.mjs ${zoom}`);
  }
  return { state, zoomOutputs };
}

// À appeler par l'agent chaque fois qu'une tâche substantielle est bouclée pendant cette fenêtre —
// jamais automatique (aucun mécanisme ne peut savoir tout seul qu'un vrai travail a eu lieu, même
// honnêteté que recordToolUsage()/recordCircleTasksRun()). Silencieux si aucune session n'est en
// cours (retourne null), plutôt que de fabriquer une session implicite.
export function recordTaskChained(label, now = Date.now(), readFile = (f) => readFileSync(f, "utf8")) {
  const state = loadGhostState(readFile);
  if (!state) return null;
  state.tasksChained = (state.tasksChained ?? 0) + 1;
  state.chainedLabels = [...(state.chainedLabels ?? []), { label, at: now }].slice(-50);
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 1));
  return state;
}

// Signal de rythme — jamais un verdict, jamais une action déclenchée toute seule (même doctrine que
// Smart Conso API/SMART-CONSO-TOKEN : conseiller, jamais exécutant). `lastRun` injectable pour les
// tests ; réutilise loadLastRun() de circle-tasks.mjs par défaut (jamais un second calcul de
// fraîcheur de Ronde divergent, Article 3).
export function checkPacing(now = Date.now(), lastRun = loadLastRun(), readFile = (f) => readFileSync(f, "utf8")) {
  const state = loadGhostState(readFile);
  if (!state) return { active: false };
  const modeRunningHours = (now - state.startedAt) / 3600000;
  const hoursSinceLastRonde = lastRun?.lastRunAt != null ? (now - lastRun.lastRunAt) / 3600000 : undefined;
  const round1 = (n) => Math.round(n * 10) / 10;
  return {
    active: true,
    modeRunningHours: round1(modeRunningHours),
    tasksChained: state.tasksChained ?? 0,
    hoursSinceLastRonde: hoursSinceLastRonde != null ? round1(hoursSinceLastRonde) : undefined,
    // Sans aucune Ronde jamais journalisée, on se rabat sur la durée du mode lui-même — jamais
    // "undefined" traité comme "jamais besoin d'en faire une" (Article 5 : cas limite couvert).
    rondeSuggested: hoursSinceLastRonde != null ? hoursSinceLastRonde >= RONDE_REMINDER_HOURS : modeRunningHours >= RONDE_REMINDER_HOURS,
  };
}

// Rituel de sortie (docs/regles-de-travail.md §1bis, recalibré le 2026-09-21) : produit l'état des
// lieux final à afficher DIRECTEMENT dans la conversation (jamais seulement en fichier joint),
// zoom projet_entier, en réutilisant tel quel le pipeline complet de check-tasks-details.mjs
// (rapport HTML archivé + registre tenu à jour, jamais un second mécanisme de rendu). Referme la
// session : une nouvelle entrée en mode nocturne repart de zéro, jamais un reliquat de compteurs
// d'une nuit précédente.
export function exitAutonomousMode(now = Date.now(), shImpl = sh, readFile = (f) => readFileSync(f, "utf8")) {
  const state = loadGhostState(readFile);
  const pacing = state ? { modeRunningHours: Math.round(((now - state.startedAt) / 3600000) * 10) / 10, tasksChained: state.tasksChained ?? 0 } : undefined;
  const output = shImpl("node scripts/check-tasks-details.mjs projet_entier arborescence");
  if (existsSync(STATE_PATH)) unlinkSync(STATE_PATH);
  return { pacing, output };
}

function main() {
  const [, , cmd, ...rest] = process.argv;
  if (cmd === "start") {
    const { state, zoomOutputs } = enterAutonomousMode();
    printReportHeader({ tool: "the-ghost", title: "THE-GHOST — entrée en mode nocturne autonome", scriptPath: "scripts/the-ghost.mjs" });
    console.log(`Session démarrée à ${new Date(state.startedAt).toISOString()}.\n`);
    for (const zoom of ["en_cours", "elargi", "projet_entier"]) {
      console.log(`--- check-tasks-details : ${zoom} ---`);
      console.log(zoomOutputs[zoom]);
    }
  } else if (cmd === "pacing") {
    const pacing = checkPacing();
    console.log(`=== THE-GHOST — rythme de la session en cours ===\n`);
    if (!pacing.active) {
      console.log("Aucune session de mode nocturne active (lance `node scripts/the-ghost.mjs start` en entrant dans ce mode).");
      return;
    }
    console.log(`Mode actif depuis ${pacing.modeRunningHours}h — ${pacing.tasksChained} tâche(s) enchaînée(s).`);
    console.log(pacing.hoursSinceLastRonde != null ? `Dernière Ronde CIRCLE-TASKS il y a ${pacing.hoursSinceLastRonde}h.` : "Aucune Ronde CIRCLE-TASKS journalisée pour l'instant.");
    if (pacing.rondeSuggested) console.log("⏰ Signal : envisager une Ronde CIRCLE-TASKS bientôt (jamais une obligation, le jugement reste à l'agent).");
  } else if (cmd === "chained") {
    const label = rest.join(" ") || "tâche non nommée";
    const state = recordTaskChained(label);
    console.log(state ? `Tâche enregistrée (${state.tasksChained} au total cette nuit).` : "Aucune session active — rien enregistré.");
  } else if (cmd === "end") {
    const { pacing, output } = exitAutonomousMode();
    console.log(`=== THE-GHOST — état des lieux de fin de mode nocturne (à afficher intégralement dans la conversation) ===\n`);
    if (pacing) console.log(`Session terminée après ${pacing.modeRunningHours}h, ${pacing.tasksChained} tâche(s) enchaînée(s).\n`);
    console.log(output);
  } else {
    console.log('Usage : node scripts/the-ghost.mjs <start|pacing|chained "libellé"|end>');
  }
}


// ════════════════════════════════════════════════════════════════════════════════════════════════
// UN PROMPT DE RÉVEIL QUI PORTE UN ÉTAT EST UN PROMPT QUI MENTIRA (2026-10-04, tâche #1568)
//
// CONSTATÉ LE 2026-10-03 AU SOIR, et le cas est exemplaire : les deux prompts de réveil de la nuit
// déclaraient en toutes lettres « CE PROMPT NE PORTE VOLONTAIREMENT AUCUN ÉTAT »… et leur dernière
// ligne nommait une tâche précise comme seuil de la nuit, plus une heure de rendez-vous. Quarante
// réveils sont arrivés d'un coup, tous affirmant que l'utilisateur n'avait pas écrit — alors qu'il
// avait écrit trois fois dans la soirée.
//
// POURQUOI LA DÉCLARATION D'INTENTION NE SUFFIT PAS : un réveil se répète à l'identique, donc tout
// ce qu'il AFFIRME se répète avec lui. Écrire « ce prompt ne porte aucun état » est une promesse ;
// la tenir demande de relire ce qu'on vient d'écrire avec une autre paire d'yeux. C'est exactement
// la leçon L1 — une règle que rien ne fait respecter — appliquée au texte d'un réveil.
//
// CE QUE CETTE FONCTION PEUT ET NE PEUT PAS. Elle lit un TEXTE et nomme ce qui s'y périmera. Elle
// ne peut pas inspecter les réveils réellement armés : ils vivent chez le planificateur, hors du
// dépôt, et aucune mécanique d'ici ne les voit. Cette moitié-là reste un geste — relire son prompt
// avant de l'armer — et le déclarer vaut mieux que de laisser croire à une vérification complète
// (Article 27).
export const MOTIFS_D_ETAT_DANS_UN_REVEIL = [
  { cle: "numero-de-tache", motif: /#\d{2,}/, pourquoi: "un numéro de tâche : elle sera close, et le réveil continuera de la réclamer" },
  // L'HEURE SE RECONNAÎT COLLÉE À SON « h » — « 14h », « 14h00 », « 20h Paris ». La forme espacée
  // (« à 3 h du matin ») est écartée volontairement : elle apparaît dans la PROSE explicative d'un
  // prompt sans être un rendez-vous, et un détecteur qui la compterait crierait sur chaque
  // commentaire bien écrit (leçon L4).
  { cle: "heure-de-rendez-vous", motif: /\b\d{1,2}h(?:\d{2})?\b/, pourquoi: "une heure de rendez-vous : elle passera, et le réveil continuera de l'annoncer" },
  { cle: "presence-affirmee", motif: /\bil n'a (?:toujours )?(?:rien|pas) (?:écrit|ecrit)\b|\bs'il n'a pas écrit\b/i, pourquoi: "une affirmation sur la présence de l'utilisateur : elle sera fausse dès qu'il écrira, et le réveil ne le saura pas" },
  { cle: "travail-en-cours", motif: /\ben cours\s*:\s*#?\d/i, pourquoi: "l'état d'un travail en cours : il aura avancé, et le réveil décrira un passé" },
  { cle: "liste-de-taches", motif: /^\s*\d+\.\s+#\d+/m, pourquoi: "une liste de tâches numérotées : elle sera faite, et le réveil la redonnera à faire" },
];

export function reveilPorteUnEtat(texte = "") {
  const t = String(texte ?? "");
  const trouves = MOTIFS_D_ETAT_DANS_UN_REVEIL.filter((m) => m.motif.test(t));
  return {
    porte: trouves.length > 0,
    motifs: trouves.map((m) => ({ cle: m.cle, pourquoi: m.pourquoi })),
    // LA PROMESSE NON TENUE EST SIGNALÉE À PART, parce qu'elle est pire que l'état lui-même : un
    // prompt qui annonce ne porter aucun état et qui en porte un se fait croire sur parole.
    promesseNonTenue: /n(?:e porte|'a) (?:volontairement )?aucun état/i.test(t) && trouves.length > 0,
    horsPortee: "lit un TEXTE, jamais les réveils réellement armés : ils vivent chez le planificateur, hors du dépôt. Relire son prompt avant de l'armer reste un geste, pas une vérification.",
  };
}

export function formatReveilLines(v = {}) {
  if (!v.porte) return ["✅ RÉVEIL — ce prompt ne porte aucun état repérable : il pourra se répéter sans mentir."];
  const L = [`🚨 RÉVEIL — ${v.motifs.length} élément(s) qui se périmeront dans ce prompt :`];
  for (const m of v.motifs) L.push(`     · ${m.pourquoi}`);
  if (v.promesseNonTenue) L.push("     ⚠️ ET IL ANNONCE « ne porter aucun état » : un prompt qui le promet et ne le tient pas se fait croire sur parole.");
  L.push(`     HORS PORTÉE : ${v.horsPortee}`);
  return L;
}


// LE PASSAGE S'ENREGISTRE : la raison complète vit à côté de `recordCliUsage()` (scripts/tool-usage.mjs).
if (import.meta.url === `file://${process.argv[1]}`) { recordCliUsage("the-ghost"); main(); }
