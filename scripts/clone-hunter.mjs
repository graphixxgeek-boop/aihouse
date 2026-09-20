// CLONE-HUNTER (2026-09-21, tâche #170bis — demande explicite de l'utilisateur : « est-ce qu'on a
// deja un outil qui traque les redondances, repetition, duplicatas, dans le code ? »). Vérifié
// avant construction (Article 19) : ARGUS (findDeadLifeFields/findTodoMarkers), HARMONIA
// (checkLinks, une liste FIXE de liens déjà connus), AXA-CHECK (couverture de test) et
// CLEAN-DIRTY-OLD (ancienneté relative) ne font AUCUN d'entre eux ce métier — confirmé en lisant
// leurs fonctions exportées une par une, pas seulement en cherchant le mot "duplication". Vrai
// trou dans le réseau d'outils, comblé ici.
//
// v1 volontairement SIMPLE (calibré explicitement avec l'utilisateur) : détecte des blocs de
// lignes IDENTIQUES (après normalisation d'espaces) répétés à plusieurs endroits — jamais une
// ressemblance sémantique (mêmes noms de variables différents, logique réarrangée), qui
// demanderait une vraie analyse syntaxique hors de portée d'un outil "sans nouvelle dépendance".
// Même famille d'heuristique texte que route-booster.mjs/find-booster.mjs — zéro parseur AST,
// zéro dépendance nouvelle.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

export const DEFAULT_ROOTS = ["lib", "scripts", "app", "components"];
export const DEFAULT_EXTENSIONS = [".ts", ".tsx", ".mjs"];
const EXCLUDE_DIRS = new Set(["node_modules", ".git", ".next", ".wrangler", ".sites-runtime", "dist", "coverage", "ui"]);

// "ui" (components/ui/*) exclu : vérifié live (git log -1 sur card.tsx → "Import du code source
// Codex", "use client"/Radix/cn() partout) — c'est le kit shadcn/ui vendu tel quel, dont la
// philosophie même est la duplication assumée (chaque primitive copiée-collée, jamais partagée).
// Premier essai live sans cette exclusion : 27 clusters trouvés, 20+ étaient du bruit shadcn pur,
// noyant les 7 vrais trouvés dans lib/scripts (ex. loadJson() dupliqué entre smart-conso-api.mjs
// et smart-conso-token.mjs) — exclu pour que le signal reste actionnable, jamais pour cacher un
// vrai problème (Article 3 : corriger la cause du bruit, pas juste baisser le volume affiché).
//
// walk() : même patron que check-argus.mjs::walk() (répertoire → liste de chemins de fichiers),
// jamais un second algorithme divergent — ici avec un filtre d'extension en plus.
export function walk(dir, extensions = DEFAULT_EXTENSIONS, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) walk(full, extensions, out);
    else if (extensions.some((ext) => entry.endsWith(ext))) out.push(full);
  }
  return out;
}

// Une ligne normalisée : espaces internes réduits à un seul, bords coupés. Jamais insensible à la
// casse (une vraie duplication de code respecte la casse) ni aux commentaires (un commentaire
// répété ligne pour ligne EST une vraie duplication, ex. un bloc de licence copié-collé).
export function normalizeLine(line) {
  return (line ?? "").trim().replace(/\s+/g, " ");
}

// Une ligne "substantielle" écarte le bruit trivial (accolades seules, imports courts, lignes
// vides) qui produirait des centaines de faux positifs sans intérêt — seuil de longueur choisi
// empiriquement (minLineLength par défaut), jamais une liste de motifs figée (cf. Article 17
// corollaire : un principe, pas une énumération).
export function isSubstantialLine(normalized, minLineLength = 20) {
  return Boolean(normalized) && normalized.length >= minLineLength;
}

// findDuplicateBlocks() : cœur de l'outil. fileLines est une Map<cheminRelatif, string[]> (lignes
// brutes déjà splittées). Indexe chaque ligne substantielle par son contenu normalisé, puis pour
// chaque paire d'occurrences de la même ligne, étend la comparaison ligne par ligne tant que ça
// matche — un « diff de blocs » plutôt qu'un fenêtrage à taille fixe, pour ne jamais couper un
// bloc dupliqué plus long que la fenêtre ni le fragmenter en plusieurs alertes qui se chevauchent.
export function findDuplicateBlocks(fileLines, { minLines = 5, minLineLength = 20, maxOccurrencesPerLine = 40 } = {}) {
  const index = new Map();
  for (const [file, lines] of fileLines) {
    lines.forEach((raw, i) => {
      const norm = normalizeLine(raw);
      if (!isSubstantialLine(norm, minLineLength)) return;
      if (!index.has(norm)) index.set(norm, []);
      index.get(norm).push({ file, index: i });
    });
  }
  const visited = new Set();
  const results = [];
  for (const occurrences of index.values()) {
    if (occurrences.length < 2 || occurrences.length > maxOccurrencesPerLine) continue;
    for (let a = 0; a < occurrences.length; a++) {
      for (let b = a + 1; b < occurrences.length; b++) {
        const posA = occurrences[a];
        const posB = occurrences[b];
        if (posA.file === posB.file && posA.index === posB.index) continue;
        const [first, second] = [posA, posB].sort((x, y) => (x.file === y.file ? x.index - y.index : x.file.localeCompare(y.file)));
        const key = `${first.file}:${first.index}|${second.file}:${second.index}`;
        if (visited.has(key)) continue;
        const linesA = fileLines.get(posA.file);
        const linesB = fileLines.get(posB.file);
        let length = 0;
        while (
          posA.index + length < linesA.length &&
          posB.index + length < linesB.length &&
          normalizeLine(linesA[posA.index + length]) === normalizeLine(linesB[posB.index + length]) &&
          normalizeLine(linesA[posA.index + length]).length > 0
        ) {
          length++;
        }
        if (posA.file === posB.file) {
          const [lo, hi] = posA.index < posB.index ? [posA, posB] : [posB, posA];
          if (lo.index + length > hi.index) length = Math.max(0, hi.index - lo.index);
        }
        if (length >= minLines) {
          for (let k = 0; k < length; k++) {
            const [f1, f2] = [posA, posB].sort((x, y) => (x.file === y.file ? x.index - y.index : x.file.localeCompare(y.file)));
            visited.add(`${f1.file}:${f1.index + k}|${f2.file}:${f2.index + k}`);
          }
          results.push({
            fileA: posA.file, startA: posA.index,
            fileB: posB.file, startB: posB.index,
            lines: length,
            preview: linesA.slice(posA.index, posA.index + Math.min(length, 3)).map((l) => l.trim()),
          });
        }
      }
    }
  }
  return results;
}

// Union-find minimaliste : regroupe les paires trouvées par findDuplicateBlocks() en clusters —
// un bloc dupliqué à 3 endroits produit 3 paires (A,B)(A,C)(B,C) de même longueur ; sans ce
// regroupement, l'utilisateur verrait 3 alertes redondantes pour UNE seule vraie duplication.
export function clusterDuplicates(pairs) {
  const parent = new Map();
  const find = (x) => { while (parent.get(x) && parent.get(x) !== x) x = parent.get(x); return x; };
  const union = (x, y) => {
    if (!parent.has(x)) parent.set(x, x);
    if (!parent.has(y)) parent.set(y, y);
    const rx = find(x), ry = find(y);
    if (rx !== ry) parent.set(rx, ry);
  };
  const nodeInfo = new Map();
  for (const pair of pairs) {
    const keyA = `${pair.fileA}:${pair.startA}`;
    const keyB = `${pair.fileB}:${pair.startB}`;
    union(keyA, keyB);
    if (!nodeInfo.has(keyA) || nodeInfo.get(keyA).lines < pair.lines) nodeInfo.set(keyA, { file: pair.fileA, start: pair.startA, lines: pair.lines, preview: pair.preview });
    if (!nodeInfo.has(keyB) || nodeInfo.get(keyB).lines < pair.lines) nodeInfo.set(keyB, { file: pair.fileB, start: pair.startB, lines: pair.lines, preview: pair.preview });
  }
  const clusters = new Map();
  for (const [key, info] of nodeInfo) {
    const root = find(key);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root).push(info);
  }
  return [...clusters.values()]
    .filter((occurrences) => occurrences.length >= 2)
    .map((occurrences) => ({
      lines: Math.max(...occurrences.map((o) => o.lines)),
      occurrences: occurrences.map((o) => ({ file: o.file, start: o.start })).sort((x, y) => x.file.localeCompare(y.file) || x.start - y.start),
      preview: occurrences[0].preview,
    }))
    .sort((x, y) => (y.lines * y.occurrences.length) - (x.lines * x.occurrences.length));
}

// buildDuplicateReport() : point d'entrée haut niveau — lit vraiment le disque (jamais dans
// findDuplicateBlocks()/clusterDuplicates(), qui restent des fonctions pures testables sans I/O).
export function buildDuplicateReport(roots = DEFAULT_ROOTS, options = {}) {
  const fileLines = new Map();
  for (const root of roots) {
    const dir = join(ROOT, root);
    for (const file of walk(dir, DEFAULT_EXTENSIONS)) {
      const rel = relative(ROOT, file);
      try { fileLines.set(rel, readFileSync(file, "utf8").split("\n")); } catch { /* fichier illisible, ignoré honnêtement */ }
    }
  }
  const pairs = findDuplicateBlocks(fileLines, options);
  return clusterDuplicates(pairs);
}

export function formatClusterSummary(cluster) {
  const where = cluster.occurrences.map((o) => `${o.file}:${o.start + 1}`).join(", ");
  return `${cluster.lines} ligne(s) dupliquée(s) × ${cluster.occurrences.length} endroit(s) — ${where} — aperçu: "${cluster.preview[0] ?? ""}"`;
}

function main() {
  const clusters = buildDuplicateReport();
  if (!clusters.length) {
    console.log("CLONE-HUNTER : aucun bloc dupliqué détecté au-dessus du seuil (≥5 lignes, ≥20 caractères par ligne).");
    return;
  }
  console.log(`CLONE-HUNTER : ${clusters.length} cluster(s) de code dupliqué trouvé(s) (triés par impact décroissant) :`);
  for (const cluster of clusters.slice(0, 30)) console.log(`  - ${formatClusterSummary(cluster)}`);
  if (clusters.length > 30) console.log(`  ... et ${clusters.length - 30} de plus.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
