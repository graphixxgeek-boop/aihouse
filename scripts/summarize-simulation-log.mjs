import { readFileSync } from "node:fs";

// Extrait un résumé compact des actions d'un journal complet de simulation (messages.json) —
// tirages de bonus, changements de pièce, révélation, jardin ouvert, progression de l'enquête.
// Créé le 2026-09-19, demande explicite de l'utilisateur, pendant que les journaux complets de
// full_sim2 à full_sim11 existaient encore dans le scratchpad (jamais archivés eux-mêmes, trop
// volumineux — 0,6 à 5 Mo chacun — cf. docs/simulations/index.md). Le résumé produit (quelques Ko)
// remplace le fichier brut dans l'archive durable : ce que ARGUS/HARMONIA/ALWAYS-NEW-CODE ont
// besoin de savoir a vraiment eu lieu, sans garder le poids brut des requêtes/réponses.
//
// Limite honnête : extrait ce qui est directement lisible dans le journal (round, bonus, pièce,
// révélation, jardin, preuves) — jamais une lecture qualitative du contenu des répliques, qui reste
// un travail de raisonnement (cf. HYPER-SCAN-CHECKPOINT, point 5 de sa checklist).

// Les journaux les plus anciens (avant l'introduction de story.round dans le moteur) ne portent
// le numéro de round que dans le label de la requête (ex. "phase1-round11-actor1") — jamais un
// bug de l'extraction, une vraie absence de champ à cette époque. Repli honnête : lire le label
// plutôt que d'afficher un "?" qui masquerait une information réellement disponible ailleurs.
export function parseRoundFromLabel(label) {
  const m = /round(\d+)/i.exec(label ?? "");
  return m ? Number(m[1]) : undefined;
}

function entryRound(entry) {
  return entry?.response?.story?.round ?? entry?.round ?? parseRoundFromLabel(entry?.label);
}

// DEUX FORMES DE JOURNAL, JAMAIS UNE SEULE (2026-09-22, trouvé en archivant full_sim18). Le script
// de simulation est réécrit à chaque simulation (scratchpad, jamais committé, cf. docs/simulations/
// index.md) et sa forme de journal a dérivé sans que personne ne le voie : les journaux anciens
// portent la réponse complète du serveur (`entry.response.story`, d'où bonusLog/humanUnlocked/
// gardenOpen se lisent directement), les récents ne gardent que l'essentiel à plat
// (`{at, payload, status, round, evidence, decisions}`). Sur cette seconde forme, l'extraction
// écrite pour la première ne trouvait plus AUCUN champ — et affichait sereinement « Round final : ? »
// et « 0 événement », c'est-à-dire une absence de mesure présentée comme une mesure. Exactement la
// famille d'erreur de THE-SCREENER annonçant « capture réussie » sur une image entièrement masquée.
// D'où : la forme est nommée explicitement, et ce qu'une forme ne peut PAS donner est dit, jamais
// tu par un zéro.
export function detectJournalShape(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return "vide";
  if (entries.some((e) => e?.response?.story)) return "imbriqué";
  if (entries.some((e) => e?.payload?.mode !== undefined)) return "plat";
  return "inconnu";
}

// Ce que chaque forme sait donner — jamais deviné au moment de lire le résultat, écrit ici une fois.
const SHAPE_BLIND_SPOTS = {
  plat: [
    "révélation (humanUnlocked absent du journal à plat — le round d'ouverture du canal humain est déduit du premier tour `chat`, jamais lu tel quel)",
    "ouverture du jardin (gardenOpen absent)",
    "nature du bonus tiré (le journal à plat enregistre le tirage, pas le lot obtenu)",
  ],
  imbriqué: [],
};

export function shapeBlindSpots(shape) {
  return SHAPE_BLIND_SPOTS[shape] ?? [];
}

// Le mode envoyé à l'API par tour — la seule façon, sur un journal à plat, de savoir ce que le
// script a réellement demandé au jeu (et donc ce que le jeu pouvait répondre).
export function modeOf(entry) {
  return entry?.payload?.mode ?? entry?.request?.mode ?? entry?.mode;
}

export function summarizeActions(entries) {
  if (detectJournalShape(entries) === "plat") return summarizeFlatActions(entries);
  const events = [];
  let prevBonusLogLen = 0;
  let prevHumanUnlocked = false;
  let prevGardenOpen = false;
  let prevEvidenceLen = 0;
  const prevRoom = {};

  for (const entry of entries) {
    const story = entry?.response?.story;
    if (!story) continue;
    const round = entryRound(entry);

    const bonusLog = story.life?.bonusLog ?? [];
    if (bonusLog.length > prevBonusLogLen) {
      for (const b of bonusLog.slice(prevBonusLogLen)) events.push({ round, type: "bonus", detail: b.bonus ?? b });
    }
    prevBonusLogLen = bonusLog.length;

    if (story.humanUnlocked && !prevHumanUnlocked) events.push({ round, type: "revelation" });
    prevHumanUnlocked = story.humanUnlocked;

    if (story.life?.gardenOpen && !prevGardenOpen) events.push({ round, type: "garden_open" });
    prevGardenOpen = story.life?.gardenOpen;

    const evidenceLen = story.evidence?.length ?? 0;
    if (evidenceLen > prevEvidenceLen) events.push({ round, type: "evidence", detail: evidenceLen });
    prevEvidenceLen = evidenceLen;

    for (const d of entry?.response?.decisions ?? []) {
      if (d.room && prevRoom[d.actor] !== undefined && prevRoom[d.actor] !== d.room) {
        events.push({ round, type: "move", detail: `acteur ${d.actor} : ${prevRoom[d.actor]} → ${d.room}` });
      }
      if (d.room) prevRoom[d.actor] = d.room;
    }
  }
  return events;
}

// Extraction pour la forme à plat. Même vocabulaire d'événements que l'autre forme (bonus,
// revelation, evidence, move) pour que tout ce qui lit ce résumé — index des simulations, HARMONIA,
// ARGUS — n'ait jamais à savoir de quelle forme venait le journal.
export function summarizeFlatActions(entries) {
  const events = [];
  let prevEvidence = 0;
  let revelationVue = false;
  const prevRoom = {};
  for (const entry of entries) {
    if (entry?.status !== 200) continue;
    const round = entryRound(entry);
    const mode = modeOf(entry);
    if (mode === "spin_bonus") events.push({ round, type: "bonus", detail: "tirage (lot non enregistré dans ce journal)" });
    // Le canal humain ouvert est ce que le journal à plat sait dire de la révélation : le premier
    // tour `chat` ne peut exister qu'une fois `revealed` atteint côté serveur. Nommé pour ce qu'il
    // est — un tour d'ouverture observé — jamais présenté comme la lecture du drapeau lui-même.
    if (mode === "chat" && !revelationVue) { events.push({ round, type: "revelation", detail: "déduite du premier tour chat" }); revelationVue = true; }
    const evidence = entry?.evidence ?? 0;
    if (evidence > prevEvidence) events.push({ round, type: "evidence", detail: evidence });
    prevEvidence = Math.max(prevEvidence, evidence);
    for (const d of entry?.decisions ?? []) {
      if (d.room && prevRoom[d.actor] !== undefined && prevRoom[d.actor] !== d.room) {
        events.push({ round, type: "move", detail: `acteur ${d.actor} : ${prevRoom[d.actor]} → ${d.room}` });
      }
      if (d.room) prevRoom[d.actor] = d.room;
    }
  }
  return events;
}

// GARDE-FOU DE PHASE 2 (2026-09-22, Article 24 — un mécanisme, jamais une promesse écrite quelque
// part). Le dossier retourné, tout le second acte du jeu, ne peut se poser QUE sur un tour
// `interact`/`autonomous` : `dossierGateEligible` (app/api/lia/route.ts) l'exige explicitement,
// tandis que `dossierHumanTurns` ne s'incrémente, lui, que sur un tour `chat`. Une phase 2 faite
// uniquement de messages humains remplit donc le compteur sans jamais offrir le tour où le piège
// pourrait être posé — le jeu ne peut structurellement pas répondre, et l'archive montre un dossier
// vide qu'on relit ensuite comme une régression du jeu. C'est arrivé deux fois (full_sim16, puis
// full_sim18 après que #143 eut conclu à tort que le budget de tours était en cause). Le vrai
// joueur, lui, n'a jamais ce trou : app/page.tsx relance un tour autonome toutes les 21 secondes,
// en parallèle de ce qu'il tape. Ce contrôle dit donc, mécaniquement, si la simulation a reproduit
// cette condition ou si elle a testé une maison à laquelle on avait coupé la parole.
export function checkPhase2Autonomy(entries) {
  const shape = detectJournalShape(entries);
  const ok = entries.filter((e) => e?.status === 200);
  const premierChat = ok.findIndex((e) => modeOf(e) === "chat");
  if (premierChat === -1) return { applicable: false, raison: "aucun tour `chat` : la phase 2 n'a jamais commencé dans ce journal." };
  const apres = ok.slice(premierChat);
  const tours = apres.filter((e) => ["interact", "autonomous"].includes(modeOf(e))).length;
  return {
    applicable: true,
    shape,
    toursChat: apres.filter((e) => modeOf(e) === "chat").length,
    toursAutonomes: tours,
    suffisant: tours > 0,
  };
}

// GARDE-FOU DU PSEUDO OBSERVATEUR (2026-09-22, même passage que checkPhase2Autonomy). Un vrai
// visiteur ne peut PAS écrire sans avoir d'abord donné un pseudo : app/page.tsx envoie un tour
// `identify` et la fenêtre de pseudo reste ouverte tant que `story.observer` n'existe pas. Le script
// de simulation, lui, poste des `chat` sans jamais s'identifier — et ce seul manque explique deux
// symptômes qu'on cherchait séparément : (1) la fenêtre de pseudo couvre la scène pendant TOUTE la
// phase 2, ce qui rend toute capture THE-SCREENER inutilisable (tâche #186, la « troisième fenêtre
// qui résiste ») ; (2) `story.observer` restant vide, la réplique qui nomme l'observateur ne peut
// pas se déclencher — et dans full_sim18 le modèle a comblé le vide en inventant un nom
// (« Caspeer », jamais donné par personne), c'est-à-dire une réplique invérifiable à l'écran
// (Article 12). Une simulation sans `identify` ne joue donc pas la même partie qu'un visiteur.
export function checkObserverIdentified(entries) {
  const ok = entries.filter((e) => e?.status === 200);
  const identify = ok.some((e) => modeOf(e) === "identify");
  const chat = ok.some((e) => modeOf(e) === "chat");
  if (!chat) return { applicable: false, raison: "aucun tour `chat` : aucun observateur n'avait à s'identifier." };
  return { applicable: true, identifie: identify };
}

export function formatObserverIdentified(verdict) {
  if (!verdict.applicable) return `Observateur — ${verdict.raison}`;
  if (verdict.identifie) return "Observateur — identifié (`identify`) avant de parler, comme un vrai visiteur.";
  return [
    "⚠️  Observateur — a parlé SANS jamais s'identifier (aucun tour `identify`).",
    "    Deux conséquences réelles, jamais des détails : la fenêtre de pseudo reste ouverte et couvre",
    "    la scène (toute capture THE-SCREENER est inutilisable), et `story.observer` restant vide, la",
    "    réplique qui nomme l'observateur ne peut pas se déclencher — le modèle peut alors inventer un",
    "    nom que personne n'a donné. Un vrai visiteur s'identifie toujours avant d'écrire.",
  ].join("\n");
}

export function formatPhase2Autonomy(verdict) {
  if (!verdict.applicable) return `Phase 2 — ${verdict.raison}`;
  if (verdict.suffisant) {
    return `Phase 2 — ${verdict.toursChat} tour(s) humain(s) et ${verdict.toursAutonomes} tour(s) autonome(s) : le dossier retourné pouvait se déclencher.`;
  }
  return [
    `⚠️  Phase 2 — ${verdict.toursChat} tour(s) humain(s) et AUCUN tour autonome.`,
    `    Le dossier retourné ne pouvait PAS se déclencher dans cette simulation : le piège exige un`,
    `    tour interact/autonomous (dossierGateEligible), que ce journal ne contient jamais après`,
    `    l'ouverture du canal. Un dossier vide ici ne dit rien sur le jeu — c'est le script qui n'a`,
    `    pas laissé la maison jouer son tour. Le vrai visiteur, lui, en reçoit un toutes les 21 s.`,
  ].join("\n");
}

export function formatSummary(events, { lastRound, dossierFound, shape, phase2, observateur } = {}) {
  const lines = [];
  // La forme du journal est affichée en tête, jamais laissée implicite : une extraction qui ne
  // trouve rien doit dire d'où elle lisait, sinon son zéro se lit comme un constat sur la partie.
  if (shape) lines.push(`Forme du journal : ${shape}`);
  lines.push(`Round final observé : ${lastRound ?? "?"}`);
  lines.push(`Dossier retourné rempli : ${dossierFound ? "oui" : "non"}`);
  if (phase2) lines.push(formatPhase2Autonomy(phase2));
  if (observateur) lines.push(formatObserverIdentified(observateur));
  if (shape === "inconnu") {
    lines.push("⚠️  Forme de journal non reconnue : AUCUNE extraction n'a été tentée. Le zéro");
    lines.push("    ci-dessous ne dit rien de la partie — il dit que ce script ne sait pas la lire.");
  } else if (shape && events.length === 0) {
    lines.push("⚠️  Aucun événement extrait d'un journal pourtant reconnu : à vérifier à la main");
    lines.push("    avant d'archiver ce résumé, jamais à prendre pour une partie sans événement.");
  }
  const angles = shapeBlindSpots(shape);
  if (angles.length) {
    lines.push(`Ce que cette forme de journal ne peut PAS donner (${angles.length}) :`);
    for (const a of angles) lines.push(`  · ${a}`);
  }
  lines.push(`${events.length} événement(s) extrait(s) :`);
  for (const e of events) {
    lines.push(`  [round ${e.round}] ${e.type}${e.detail !== undefined ? ` — ${e.detail}` : ""}`);
  }
  return lines.join("\n");
}

function main() {
  const path = process.argv[2];
  if (!path) {
    console.log("Usage: node scripts/summarize-simulation-log.mjs <chemin vers messages.json>");
    process.exit(1);
  }
  const entries = JSON.parse(readFileSync(path, "utf8"));
  const shape = detectJournalShape(entries);
  const events = summarizeActions(entries);
  const rounds = entries.map(entryRound).filter((r) => Number.isFinite(r));
  const lastRound = rounds.length ? Math.max(...rounds) : undefined;
  const dossierFound = entries.some((e) => Boolean(e?.response?.story?.life?.dossierText));
  console.log(formatSummary(events, { lastRound, dossierFound, shape, phase2: checkPhase2Autonomy(entries), observateur: checkObserverIdentified(entries) }));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
