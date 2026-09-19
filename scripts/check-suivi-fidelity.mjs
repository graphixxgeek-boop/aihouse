// Garde-fou du système de suivi (2026-09-19, cf. docs/systeme-de-suivi.md). Une tâche fermée doit
// toujours préciser "terminée — fidèle" ou "terminée — écart : ..." — jamais un "terminée" nu qui
// laisserait la question "réalisée exactement selon le prompt ?" sans réponse. Ce script relit
// chaque fichier de session et signale les clôtures qui ont sauté cette étape. Gratuit, zéro appel
// réseau, intégré à la veille hebdomadaire du réseau d'outils plutôt qu'un rappel séparé de plus.
//
// findOpenTasks() (ajouté le 2026-09-19, à la demande explicite de l'utilisateur — « top, avant de
// lancer la simulation, tu vois une tâche à terminer ? [...] utilise le système de suivi pour
// vérifier si des tâches sont encore ouvertes. cet outil doit t'aider à le déterminer facilement »)
// répond au réel problème constaté ce jour-là : relire un fichier de session à la main pour savoir
// ce qui reste ouvert est lent et peu fiable (une session a été trouvée avec deux tâches encore
// marquées "en cours" alors qu'elles étaient terminées depuis des heures) — cette fonction liste
// en un coup d'œil, pour toutes les sessions, chaque ligne dont le statut n'est pas "terminée".

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SESSIONS_DIR = join(ROOT, "docs/suivi/sessions");

// Une ligne du tableau "| Horodatage | Sujet | Sous-sujet | Sensibilité | Description | Statut |"
// est une clôture non vérifiée si son dernier champ (Statut) commence par "terminée" sans jamais
// contenir "fidèle" ni "écart". Une tâche encore "ouverte"/"en cours" n'est jamais concernée — le
// garde-fou ne porte que sur ce qui est déclaré fini.
export function findUnverifiedClosures(sessionText) {
  const rows = sessionText
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-+\s*\|/.test(l) && !l.includes("Horodatage"));
  const hits = [];
  for (const row of rows) {
    const cells = row.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
    const statut = cells[cells.length - 1] ?? "";
    if (/^termin[ée]e/i.test(statut) && !/fid[èe]le/i.test(statut) && !/[ée]cart/i.test(statut)) {
      hits.push({ row: row.trim(), statut });
    }
  }
  return hits;
}

// Une ligne est "ouverte" si son Statut ne commence PAS par "terminée" (couvre "ouverte", "en
// cours", ou toute autre valeur future) — jamais un motif positif qui devrait deviner tous les
// libellés possibles d'un statut non fermé.
export function findOpenTasks(sessionText) {
  const rows = sessionText
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-+\s*\|/.test(l) && !l.includes("Horodatage"));
  const hits = [];
  for (const row of rows) {
    const cells = row.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
    const statut = cells[cells.length - 1] ?? "";
    if (statut && !/^termin[ée]e/i.test(statut)) hits.push({ row: row.trim(), statut, cells });
  }
  return hits;
}

export function auditOpenTasks(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return [];
  const files = readDir(sessionsDir).filter((f) => f.endsWith(".md"));
  const results = [];
  for (const file of files) {
    const hits = findOpenTasks(readFile(join(sessionsDir, file)));
    if (hits.length) results.push({ file, hits });
  }
  return results;
}

export function auditAllSessions(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return [];
  const files = readDir(sessionsDir).filter((f) => f.endsWith(".md"));
  const results = [];
  for (const file of files) {
    const text = readFile(join(sessionsDir, file));
    const hits = findUnverifiedClosures(text);
    if (hits.length) results.push({ file, hits });
  }
  return results;
}

function main() {
  console.log("=== Tâches encore ouvertes (docs/suivi/) ===\n");
  const open = auditOpenTasks();
  if (!open.length) {
    console.log("Aucune tâche ouverte/en cours trouvée dans les fichiers de session.");
  } else {
    for (const { file, hits } of open) {
      console.log(`${file} : ${hits.length} tâche(s) non fermée(s)`);
      for (const h of hits) console.log(`   - [${h.statut}] ${h.row}`);
    }
  }

  console.log("\n=== Garde-fou fidélité au prompt (docs/suivi/) ===\n");
  const results = auditAllSessions();
  if (!results.length) {
    console.log("Aucune clôture non vérifiée trouvée — chaque tâche fermée précise bien fidèle/écart.");
    return;
  }
  for (const { file, hits } of results) {
    console.log(`${file} : ${hits.length} clôture(s) sans vérification de fidélité`);
    for (const h of hits) console.log(`   - ${h.row}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
