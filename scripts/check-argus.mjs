// ARGUS — partie mécanique et gratuite (2026-09-19, cf. docs/argus-blueprint.md et
// docs/referentiel/argus.md). Deux vérifications structurelles, zéro appel réseau, zéro coût :
// (1) un champ déclaré dans le type Life (lib/life.ts) mais jamais lu ailleurs dans le projet —
//     exactement la nature du bug réel déjà trouvé cette session (le bouton jour/nuit manuel,
//     envoyé jusqu'au modèle sans jamais être lu) ;
// (2) une trace de travail explicitement laissée inachevée (TODO/FIXME) dans le code source.
// La partie "raisonnement" d'ARGUS (repérer une combinaison jamais envisagée, une conséquence
// logique oubliée, un lien discret) reste hors de portée d'un script déterministe par nature —
// elle se fait à la demande, avec une vraie réflexion, jamais simulée ici par une fausse promesse
// de couverture totale (cf. "Ce que ce patron n'est pas", docs/argus-blueprint.md).

import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { recordCliUsage } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

export function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", ".next", ".wrangler", ".sites-runtime", "dist"].includes(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mjs|js)$/.test(entry)) out.push(full);
  }
  return out;
}

// Extrait les noms de champs de PREMIER NIVEAU du type Life (lib/life.ts), en suivant la
// profondeur des accolades — un champ imbriqué dans un sous-type (ex. `food` dans `bonusUntil`)
// n'est jamais compté séparément, pour éviter les faux positifs sur des noms courts et génériques.
function extractLifeFields(source) {
  const start = source.indexOf("export type Life={");
  if (start === -1) throw new Error("export type Life={ introuvable dans lib/life.ts — ARGUS ne peut pas vérifier les champs sans ce point d'ancrage.");
  let depth = 0, i = start + "export type Life=".length, fieldStart = -1;
  const fields = [];
  for (; i < source.length; i++) {
    const c = source[i];
    if (c === "{") { depth++; if (depth === 1) fieldStart = i + 1; continue; }
    if (c === "}") { depth--; if (depth === 0) break; continue; }
    if (depth === 1 && (c === ";")) {
      const chunk = source.slice(fieldStart, i);
      const m = chunk.match(/^\s*(\w+)\??:/);
      if (m) fields.push(m[1]);
      fieldStart = i + 1;
    }
  }
  const lastChunk = source.slice(fieldStart, i);
  const m = lastChunk.match(/^\s*(\w+)\??:/);
  if (m) fields.push(m[1]);
  return [...new Set(fields)];
}

export function findDeadLifeFields(files, lifeSource) {
  const fields = extractLifeFields(lifeSource);
  const dead = [];
  for (const field of fields) {
    let uses = 0;
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const re = new RegExp(`\\.${field}\\b|life\\.${field}\\b|\\b${field}\\s*:`, "g");
      const matches = content.match(re);
      if (matches) uses += matches.length;
    }
    // Une déclaration dans le type (1) + sa ligne dans readLife (généralement 1 de plus, parfois 2
    // pour un champ par-personnage {1:...,2:...}) constituent le plancher attendu sans aucune
    // vraie lecture ailleurs — au-delà de 4 occurrences totales projet, le champ est considéré
    // utilisé quelque part de façon crédible. Seuil volontairement large pour rester "confirmé"
    // seulement sur les cas francs, jamais un faux positif sur un champ réellement exploité.
    if (uses <= 4) dead.push({ field, uses, confidence: uses <= 2 ? "confirmé" : "probable" });
  }
  return dead;
}

export function findTodoMarkers(files) {
  const found = [];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      // Ancré en début de ligne (après l'éventuel indentation) : un TODO/FIXME réel ouvre TOUJOURS
      // son propre commentaire, jamais mentionné plus loin dans une phrase déjà en cours — sans cet
      // ancrage, un commentaire qui PARLE de TODO/FIXME (comme celui-ci, ou celui qui documente
      // cette même règle) se ferait passer pour un vrai marqueur. Bug auto-référentiel réel trouvé
      // en construisant ARGUS le 2026-09-19, corrigé ainsi plutôt qu'en excluant des fichiers.
      if (/^\s*\/\/\s*(TODO|FIXME)\b/i.test(line)) found.push({ file: relative(ROOT, file), line: idx + 1, text: line.trim() });
    });
  }
  return found;
}

function main() {
  recordCliUsage("argus");
  const lifeSource = readFileSync(join(ROOT, "lib/life.ts"), "utf8");
  const files = walk(join(ROOT, "lib")).concat(walk(join(ROOT, "app"))).concat(walk(join(ROOT, "components")).filter(f => existsSync(join(ROOT, "components"))));
  const dead = findDeadLifeFields(files, lifeSource);
  const todos = findTodoMarkers(walk(ROOT).filter(f => !f.includes("/scratchpad/")));

  console.log("=== ARGUS — partie mécanique (zéro coût API) ===\n");
  console.log(`Champs de life.ts potentiellement jamais lus ailleurs (${dead.length}) :`);
  if (!dead.length) console.log("  Aucun — tous les champs déclarés dans le type Life sont référencés au moins 5 fois dans le projet.");
  for (const d of dead) console.log(`  [${d.confidence}] ${d.field} (${d.uses} occurrence(s) trouvée(s) au total, déclaration + lecture éventuelle incluses)`);
  console.log(`\nMarqueurs TODO/FIXME trouvés (${todos.length}) :`);
  if (!todos.length) console.log("  Aucun.");
  for (const t of todos) console.log(`  ${t.file}:${t.line} — ${t.text}`);

  const outDir = join(ROOT, "docs/argus");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const runId = "scan-" + new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const reportPath = join(outDir, runId + ".txt");
  writeFileSync(reportPath, [
    "ARGUS — balayage mécanique — " + new Date().toISOString(),
    "",
    "Champs de life.ts potentiellement jamais lus ailleurs :",
    ...(dead.length ? dead.map(d => `  [${d.confidence}] ${d.field} (${d.uses} occurrence(s))`) : ["  Aucun."]),
    "",
    "Marqueurs TODO/FIXME :",
    ...(todos.length ? todos.map(t => `  ${t.file}:${t.line} — ${t.text}`) : ["  Aucun."]),
  ].join("\n") + "\n");
  console.log(`\nRapport archivé : docs/argus/${runId}.txt (voir docs/argus/index.md pour l'historique)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
