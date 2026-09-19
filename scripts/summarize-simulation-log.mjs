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
  return entry?.response?.story?.round ?? parseRoundFromLabel(entry?.label);
}

export function summarizeActions(entries) {
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

export function formatSummary(events, { lastRound, dossierFound } = {}) {
  const lines = [];
  lines.push(`Round final observé : ${lastRound ?? "?"}`);
  lines.push(`Dossier retourné rempli : ${dossierFound ? "oui" : "non"}`);
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
  const events = summarizeActions(entries);
  const rounds = entries.map(entryRound).filter((r) => Number.isFinite(r));
  const lastRound = rounds.length ? Math.max(...rounds) : undefined;
  const dossierFound = entries.some((e) => Boolean(e?.response?.story?.life?.dossierText));
  console.log(formatSummary(events, { lastRound, dossierFound }));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
