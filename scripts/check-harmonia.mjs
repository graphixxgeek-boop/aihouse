// HARMONIA — partie mécanique et gratuite (2026-09-19, cf. docs/harmonia-blueprint.md et
// docs/referentiel/harmonia.md). Rôle : reconfirmer qu'une affirmation CHIFFRÉE documentée dans
// docs/referentiel/ correspond toujours à la constante réelle du code qu'elle décrit — jamais se
// fier à la documentation seule (principe central tranché explicitement avec l'utilisateur). Une
// friction ici signifie : soit le code a changé sans que la doc suive (dette réelle, Article 13),
// soit la doc s'est trompée dès le départ — dans les deux cas, un signal utile.

import { readFileSync } from "node:fs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { printReportHeader } from "./report-template.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// Chaque entrée : une constante réelle extraite du code source (regex + groupe numérique), et une
// ou plusieurs affirmations attendues dans un document de référence (regex + groupe numérique).
// Si les deux ne matchent pas ou si les nombres diffèrent, c'est une friction.
export const LINKS = [
  {
    theme: "Cycle jour/nuit — durée du jour (DAY_ROUNDS)",
    code: { file: "lib/daynight.ts", pattern: /export const DAY_ROUNDS\s*=\s*(\d+)/ },
    docs: [{ file: "docs/referentiel/parametres.md", pattern: /Jour = rounds 0-(\d+)/, transform: (n) => n + 1 }],
  },
  {
    theme: "Cycle jour/nuit — durée de la nuit (NIGHT_ROUNDS)",
    code: { file: "lib/daynight.ts", pattern: /export const NIGHT_ROUNDS\s*=\s*(\d+)/ },
    docs: [{ file: "docs/referentiel/parametres.md", pattern: /Nuit = rounds 29-37 \((\d+) tours/ }],
  },
  {
    theme: "Cycle jour/nuit — décalage de minuit (MIDNIGHT_OFFSET)",
    code: { file: "lib/daynight.ts", pattern: /export const MIDNIGHT_OFFSET\s*=\s*(\d+)/ },
    docs: [{ file: "docs/referentiel/parametres.md", pattern: /\*\*minuit=(\d+)\*\*/ }],
  },
  {
    theme: "Nuit blanche — malus de fatigue fixe",
    code: { file: "app/api/lia/route.ts", pattern: /sleptThisNight\?\.\[agent\.id\]!==true\)needs\.fatigue=Math\.min\(100,needs\.fatigue\+(\d+)\)/ },
    docs: [{ file: "docs/referentiel/parametres.md", pattern: /`\+(\d+)` fatigue, FIXE et non cumulable/ }],
  },
  {
    theme: "Palier de respect sincère — seuil d'appréciation",
    code: { file: "app/api/lia/route.ts", pattern: /appreciationOf\(life,id\)<(\d+)\)life\.genuineRespectStreak/ },
    docs: [{ file: "docs/referentiel/parametres.md", pattern: /abaissé de 85 à\s+(\d+)/ }],
  },
];

export function checkLinks(links, readFile = (f) => readFileSync(f, "utf8")) {
  const results = [];
  for (const link of links) {
    let codeValue;
    try {
      const codeSource = readFile(ROOT + link.code.file);
      const m = codeSource.match(link.code.pattern);
      codeValue = m ? Number(m[1]) : undefined;
    } catch {
      codeValue = undefined;
    }
    if (codeValue === undefined) {
      results.push({ theme: link.theme, status: "introuvable dans le code", confidence: "confirmé" });
      continue;
    }
    let anyDocMatched = false, anyMismatch = false, docDetails = [];
    for (const doc of link.docs) {
      let docSource;
      try {
        docSource = readFile(ROOT + doc.file);
      } catch {
        docDetails.push(`${doc.file} : fichier introuvable`);
        continue;
      }
      const dm = docSource.match(doc.pattern);
      if (!dm) {
        docDetails.push(`${doc.file} : affirmation attendue introuvable`);
        continue;
      }
      anyDocMatched = true;
      const rawValue = Number(dm[1]);
      const docValue = doc.transform ? doc.transform(rawValue) : rawValue;
      if (docValue !== codeValue) {
        anyMismatch = true;
        docDetails.push(`${doc.file} affirme ${docValue} (extrait: "${dm[0]}"), code dit ${codeValue}`);
      }
    }
    if (!anyDocMatched) results.push({ theme: link.theme, status: `code=${codeValue}, mais ${docDetails.join("; ")}`, confidence: "probable" });
    else if (anyMismatch) results.push({ theme: link.theme, status: docDetails.join("; "), confidence: "confirmé" });
    else results.push({ theme: link.theme, status: `cohérent (code=${codeValue})`, confidence: "ok" });
  }
  return results;
}

function main() {
  recordCliUsage("harmonia");
  const results = checkLinks(LINKS);
  printReportHeader({ tool: "harmonia", title: "HARMONIA — partie mécanique (cohérence chiffrée doc/code, zéro coût API)", scriptPath: "scripts/check-harmonia.mjs" });
  for (const r of results) {
    const icon = r.confidence === "ok" ? "✓" : r.confidence === "confirmé" ? "✗ FRICTION" : "? à vérifier";
    console.log(`[${icon}] ${r.theme} — ${r.status}`);
  }
  const frictions = results.filter((r) => r.confidence === "confirmé");
  console.log(`\n${frictions.length} friction(s) confirmée(s) sur ${results.length} lien(s) vérifié(s).`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
