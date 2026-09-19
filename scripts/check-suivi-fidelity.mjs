// Garde-fou du système de suivi (2026-09-19, cf. docs/systeme-de-suivi.md). Une tâche fermée doit
// toujours préciser "terminée — fidèle" ou "terminée — écart : ..." — jamais un "terminée" nu qui
// laisserait la question "réalisée exactement selon le prompt ?" sans réponse. Ce script relit
// chaque fichier de session et signale les clôtures qui ont sauté cette étape. Gratuit, zéro appel
// réseau, intégré à la veille hebdomadaire du réseau d'outils plutôt qu'un rappel séparé de plus.

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
  console.log("=== Garde-fou fidélité au prompt (docs/suivi/) ===\n");
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
