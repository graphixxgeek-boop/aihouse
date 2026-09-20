// find-booster — Membre de l'équipe (2026-09-21, promu le même soir après un premier usage réel
// concluant sur 4 fichiers différents). Conçu d'abord pour app/api/lia/route.ts sous le nom
// "route-find-booster", renommé "find-booster" puis promu à un vrai statut d'équipe (badge, fiche
// générique, instanciation, registre) une fois confirmé comme "compagnon du quotidien" plutôt qu'un
// outil à usage unique — cf. `docs/find-booster-blueprint.md` (principe générique) et
// `docs/referentiel/find-booster.md` (instanciation propre à ce projet) pour le détail complet.
// route-booster.mjs, son voisin très lié (l'opération de découpage), reste lui un outil sans
// blueprint : il ne sert que rarement, quand un fichier doit vraiment être découpé.
//
// Indexe le contenu d'un fichier (fonctions nommées, blocs anonymes commentés, entrées de tableau
// titrées, ou titres Markdown selon le fichier) avec sa description réelle déjà présente dans ce
// projet — jamais une nouvelle convention d'annotation à inventer — pour une recherche par CONCEPT
// plutôt qu'un grep littéral sur un gros fichier. Tague en plus, à titre indicatif, chaque entrée
// avec les thèmes HARMONIA qu'elle semble toucher (mots-clés dans son nom/sa description) — un
// indice de rapprochement, jamais une classification certaine.

import { readFileSync } from "node:fs";
import { estimateTokens } from "./smart-conso-token.mjs";

const FUNCTION_RE = /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/;

// Les 8 thèmes HARMONIA (docs/referentiel/harmonia.md) et quelques mots-clés associés — tenus à la
// main, comme THEME_PRIMARY_FILE d'always-new-code.mjs : approximatif, à recalibrer avec l'usage.
const HARMONIA_THEME_KEYWORDS = {
  "Fatigue": ["fatigue", "sommeil", "sleep", "dort"],
  "Cycle jour/nuit": ["jour", "nuit", "minuit", "daynight"],
  "Enquête": ["enquête", "enquete", "indice", "preuve", "evidence"],
  "Bonus roulette": ["roulette", "bonus", "tirage"],
  "Appréciation de l'observateur": ["appréciation", "appreciation", "respect", "trustshift"],
  "Dossier retourné": ["dossier", "trap", "piège", "piege"],
  "Déplacements/espace": ["déplacement", "deplacement", "destination", "room", "pièce", "piece"],
  "Relation Lia/Noé": ["attraction", "attirance", "couple", "relation"],
};

// Extrait chaque fonction nommée top-level et le bloc de commentaire contigu qui la précède
// immédiatement — jamais une nouvelle convention d'annotation, juste ce qui existe déjà. Sert les
// fichiers découpés en fonctions (route.ts une fois découpé, la plupart de lib/).
export function extractFunctionIndex(source) {
  const lines = source.split("\n");
  const entries = [];
  for (let i = 0; i < lines.length; i++) {
    const match = FUNCTION_RE.exec(lines[i]);
    if (!match) continue;
    let j = i - 1;
    const commentLines = [];
    while (j >= 0 && /^\s*\/\//.test(lines[j])) {
      commentLines.unshift(lines[j].replace(/^\s*\/\/\s?/, ""));
      j--;
    }
    entries.push({ name: match[1], line: i + 1, description: commentLines.join(" ").trim() });
  }
  return entries;
}

const BLOCK_START_RE = /^\{$/;

// Extrait les blocs top-level anonymes `{ ... }` (style scripts/check-house.mjs : chaque test vit
// dans son propre bloc, jamais une fonction nommée) — le nom synthétique vient du début du
// commentaire qui suit l'accolade ouvrante, jusqu'à la première parenthèse ou tiret cadratin
// (la convention déjà utilisée partout dans ce fichier pour nommer l'outil testé, jamais une
// nouvelle convention à inventer). `^\{$` (rien avant, rien après sur la ligne) ne matche déjà que
// des accolades RÉELLEMENT top-level : une accolade nichée porte toujours du code ou une indentation
// sur sa ligne dans le style de ce projet. Un bloc sans commentaire n'a honnêtement rien à indexer,
// jamais un nom fabriqué à partir de rien.
export function extractBlockIndex(source) {
  const lines = source.split("\n");
  const entries = [];
  for (let i = 0; i < lines.length; i++) {
    if (!BLOCK_START_RE.test(lines[i])) continue;
    const commentLines = [];
    let j = i + 1;
    while (j < lines.length && /^\s*\/\//.test(lines[j])) {
      commentLines.push(lines[j].replace(/^\s*\/\/\s?/, ""));
      j++;
    }
    if (!commentLines.length) continue;
    const description = commentLines.join(" ").trim();
    const label = (description.split(/\s*[(—]/)[0] || description).trim();
    entries.push({ name: label, line: i + 1, description });
  }
  return entries;
}

const HEADING_RE = /^(#{2,4})\s+(.+)$/;

// Extrait les titres Markdown (## / ### / ####) d'un document de référence (docs/regles-de-travail.md,
// docs/referentiel/*.md — 1896 lignes et 40 titres pour le premier, signalé lourd à son tour par
// l'utilisateur le 2026-09-21) — jamais du code, un troisième motif réel de ce projet après les
// fonctions nommées et les blocs anonymes commentés. Le nom est le texte du titre lui-même, la
// description est le premier paragraphe qui le suit (jusqu'à la ligne vide ou le prochain titre) —
// jamais un résumé fabriqué au-delà de ce qui est réellement écrit juste après.
export function extractHeadingIndex(source) {
  const lines = source.split("\n");
  const entries = [];
  for (let i = 0; i < lines.length; i++) {
    const match = HEADING_RE.exec(lines[i]);
    if (!match) continue;
    const descriptionLines = [];
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === "") j++;
    while (j < lines.length && lines[j].trim() !== "" && !HEADING_RE.test(lines[j])) {
      descriptionLines.push(lines[j].trim());
      j++;
    }
    entries.push({ name: match[2].trim(), line: i + 1, level: match[1].length, description: descriptionLines.join(" ").trim() });
  }
  return entries;
}

const TITLED_ENTRY_RE = /\{\s*title\s*:\s*'((?:[^'\\]|\\.)*)'\s*,\s*text\s*:\s*'((?:[^'\\]|\\.)*)'/;
const DESCRIPTION_PREVIEW_LENGTH = 200;

// Extrait les entrées d'un tableau d'objets titrés `{title:'...', text:'...'}` — le motif réel de
// `lib/reference.ts` (2026-09-21, question directe de l'utilisateur : « ainsi que pour le fichier
// references.ts »), un 4e motif après les fonctions, les blocs et les titres Markdown : un fichier
// peut être "lourd" (contenu dense) sans être long en nombre de lignes — exactement ce que ce fichier
// a révélé (132 lignes seulement, mais chaque `text` fait plusieurs centaines de mots sur une seule
// ligne). La description est tronquée à `DESCRIPTION_PREVIEW_LENGTH` caractères (avec "…") — jamais
// le texte complet, qui rendrait chaque résultat de recherche imbuvable pour une simple navigation.
export function extractTitledArrayIndex(source) {
  const lines = source.split("\n");
  const entries = [];
  for (let i = 0; i < lines.length; i++) {
    const match = TITLED_ENTRY_RE.exec(lines[i]);
    if (!match) continue;
    const [, title, text] = match;
    const preview = text.length > DESCRIPTION_PREVIEW_LENGTH ? `${text.slice(0, DESCRIPTION_PREVIEW_LENGTH)}…` : text;
    entries.push({ name: title.trim(), line: i + 1, description: preview });
  }
  return entries;
}

export function tagHarmoniaThemes(entry) {
  const haystack = `${entry.name} ${entry.description}`.toLowerCase();
  return Object.entries(HARMONIA_THEME_KEYWORDS)
    .filter(([, keywords]) => keywords.some((k) => haystack.includes(k)))
    .map(([theme]) => theme);
}

export function searchByConcept(index, keyword) {
  const needle = keyword.toLowerCase();
  return index.filter((e) => e.name.toLowerCase().includes(needle) || e.description.toLowerCase().includes(needle));
}

// Combine les quatre motifs réels de ce projet — fonctions nommées, blocs anonymes commentés et
// entrées de tableau titrées pour le code (les trois sont structurellement exclusifs par ligne,
// jamais de double comptage), titres Markdown pour un document de référence (choisi par extension,
// jamais mélangé : un .md n'a pas de fonctions/blocs/tableaux JS, un .mjs/.ts n'a pas de titres) —
// jamais un motif au détriment d'un autre, pour servir route.ts (fonctions), check-house.mjs
// (blocs), lib/reference.ts (tableau titré) et docs/regles-de-travail.md (titres) avec la même
// qualité de résultat.
export function buildIndex(filePath) {
  const source = readFileSync(filePath, "utf8");
  const entries = /\.mdx?$/i.test(filePath)
    ? extractHeadingIndex(source)
    : [...extractFunctionIndex(source), ...extractBlockIndex(source), ...extractTitledArrayIndex(source)].sort((a, b) => a.line - b.line);
  return entries.map((e) => ({ ...e, themes: tagHarmoniaThemes(e) }));
}

// recommendFindBooster() (2026-09-21, question directe de l'utilisateur : « est-ce que find-booster
// pourrait détecter quand un fichier est trop lourd [...] ou c'est toi qui fait cette analyse
// systématiquement ? ») — jamais le nombre de lignes seul : lib/reference.ts vient de prouver qu'un
// fichier peut être dense (poids réel élevé) sur très peu de lignes. Réutilise directement
// `estimateTokens()` de smart-conso-token.mjs (les deux vivent dans scripts/, aucune frontière
// lib/scripts à respecter ici, contrairement à memento weight) — jamais une seconde formule
// divergente. `tokenThreshold` par défaut réutilise le palier "élevé" déjà calibré par
// SMART-CONSO-TOKEN pour un document toujours chargé (cf. docs/referentiel/smart-conso-token.md).
export function recommendFindBooster(filePath, { tokenThreshold = 8000 } = {}) {
  const source = readFileSync(filePath, "utf8");
  const tokens = estimateTokens(source);
  const entryCount = buildIndex(filePath).length;
  const worthwhile = tokens >= tokenThreshold && entryCount >= 3;
  return { tokens, entryCount, worthwhile };
}

function main() {
  const [, , target, ...keywordParts] = process.argv;
  if (!target) {
    console.log("Usage : node scripts/find-booster.mjs <fichier> [mot-clé...]");
    return;
  }
  const index = buildIndex(target);
  const keyword = keywordParts.join(" ");
  const results = keyword ? searchByConcept(index, keyword) : index;
  console.log(`find-booster — ${results.length} fonction(s) ${keyword ? `pour "${keyword}"` : "indexée(s)"} dans ${target} :\n`);
  for (const r of results) {
    console.log(`L${r.line} ${r.name}()${r.themes.length ? ` [${r.themes.join(", ")}]` : ""}`);
    if (r.description) console.log(`   ${r.description}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
