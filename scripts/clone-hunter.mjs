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
//
// v2 (2026-09-21, tâche #177, demande explicite : « améliore CLONE-HUNTER, au-delà de la v1
// littérale »). Reste dans le même esprit "zéro nouvelle dépendance, zéro parseur AST" : au lieu
// d'un texte identique, on compare la SHAPE token par token (identifiants ↔ un même symbole neutre,
// tout le reste — mots-clés, opérateurs, ponctuation, nombres, chaînes — doit rester identique) et
// on exige qu'un SEUL renommage bijectif cohérent explique tout le bloc (findNearDuplicateBlocks/
// matchLineTokens) — jamais juste "même forme de ligne", qui serait beaucoup trop bruyant seul
// (des lignes aussi banales que `return x;` partagent leur forme partout). C'est cette cohérence de
// renommage sur toute la longueur du bloc qui fait la différence entre un vrai copié-collé renommé
// et une simple coïncidence de structure. v1 reste inchangée et continue de tourner en plus (les
// deux se complètent, jamais l'un ne remplace l'autre) ; v2 ignore volontairement tout bloc où le
// "renommage" trouvé est en réalité l'identité (a→a partout) — ce cas-là, c'est un doublon littéral,
// déjà signalé par v1, jamais compté deux fois.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { mesurerCorpus, ligneCorpus } from "./corpus-mesure.mjs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { printReportHeader, planDactionDepuisEcarts, PLAN_ACTION_TITRE } from "./report-template.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

export const DEFAULT_ROOTS = ["lib", "scripts", "app", "components"];
export const DEFAULT_EXTENSIONS = [".ts", ".tsx", ".mjs"];
const EXCLUDE_DIRS = new Set(["node_modules", ".git", ".next", ".wrangler", ".sites-runtime", "dist", "coverage", "ui"]);

// Mots-clés JS/TS + globaux courants jamais renommables (v2) — un fait structurel borné du
// langage, pas une liste de vocabulaire à faire grandir sans fin (l'Article 17 corollaire vise le
// registre de dialogue des personnages, un domaine totalement différent de la grammaire du langage
// dans lequel ce code est écrit).
const RESERVED_WORDS = new Set([
  "const","let","var","function","return","if","else","for","of","in","while","do","switch","case",
  "default","break","continue","try","catch","finally","throw","new","delete","typeof","instanceof",
  "void","yield","async","await","import","export","from","as","class","extends","super","this",
  "static","get","set","interface","type","enum","namespace","declare","readonly","public","private",
  "protected","abstract","implements","is","keyof","never","unknown","any","string","number","boolean",
  "object","symbol","bigint","undefined","null","true","false","console","require","module","exports",
  "process","Object","Array","Map","Set","Promise","JSON","Math","Date","Error","Boolean","Number",
  "String","Symbol","Infinity","NaN","globalThis","arguments",
]);

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

// findBlocksFromIndex() : cœur PARTAGÉ par v1 et v2 (extrait le 2026-09-21 en lançant CLONE-HUNTER
// v2 sur lui-même — il a trouvé cette même boucle de parcours de paires dupliquée entre
// findDuplicateBlocks() et findNearDuplicateBlocks(), un comble pour un détecteur de duplication,
// corrigé aussitôt, Article 3). Parcourt un index (ancre → occurrences), teste chaque paire
// candidate, délègue l'extension à la stratégie fournie (extend), tronque un recouvrement même
// fichier, et ne garde que ce qui franchit minLines ET le filtre optionnel accept().
function findBlocksFromIndex(index, fileLines, { minLines, maxOccurrencesPerAnchor, extend, accept }) {
  const visited = new Set();
  const results = [];
  for (const occurrences of index.values()) {
    if (occurrences.length < 2 || occurrences.length > maxOccurrencesPerAnchor) continue;
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
        const extended = extend(linesA, posA.index, linesB, posB.index);
        let effectiveLength = extended.length;
        if (posA.file === posB.file) {
          const [lo, hi] = posA.index < posB.index ? [posA, posB] : [posB, posA];
          if (lo.index + effectiveLength > hi.index) effectiveLength = Math.max(0, hi.index - lo.index);
        }
        // Note honnête (v2 uniquement) : un filtre accept() fondé sur un état accumulé sur toute la
        // longueur AVANT troncature (ex. hasRealRenaming(mapAtoB) côté v2) peut, dans le cas rare
        // d'un recouvrement même fichier, étiqueter "renommé" un reliquat en réalité littéral si le
        // renommage n'apparaissait que dans la portion coupée — jamais une fausse PAIRE, juste une
        // étiquette optimiste sur un cas marginal, non corrigé pour rester simple (Article 5).
        if (effectiveLength >= minLines && (!accept || accept(extended))) {
          for (let k = 0; k < effectiveLength; k++) {
            const [f1, f2] = [posA, posB].sort((x, y) => (x.file === y.file ? x.index - y.index : x.file.localeCompare(y.file)));
            visited.add(`${f1.file}:${f1.index + k}|${f2.file}:${f2.index + k}`);
          }
          results.push({
            fileA: posA.file, startA: posA.index,
            fileB: posB.file, startB: posB.index,
            lines: effectiveLength,
            preview: linesA.slice(posA.index, posA.index + Math.min(effectiveLength, 3)).map((l) => l.trim()),
          });
        }
      }
    }
  }
  return results;
}

function extendLiteralBlock(linesA, startA, linesB, startB) {
  let length = 0;
  while (
    startA + length < linesA.length &&
    startB + length < linesB.length &&
    normalizeLine(linesA[startA + length]) === normalizeLine(linesB[startB + length]) &&
    normalizeLine(linesA[startA + length]).length > 0
  ) {
    length++;
  }
  return { length };
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
  return findBlocksFromIndex(index, fileLines, { minLines, maxOccurrencesPerAnchor: maxOccurrencesPerLine, extend: extendLiteralBlock });
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

// --- v2 : quasi-duplication par renommage bijectif cohérent (tâche #177) ---
//
// tokenizeLine() : découpe une ligne déjà normalisée en tokens (identifiants, nombres, chaînes,
// et tout le reste caractère par caractère — opérateurs, ponctuation) — jamais un vrai lexer JS,
// juste assez pour distinguer "un nom qu'on pourrait renommer" du reste, qui doit rester identique
// des deux côtés pour qu'un bloc soit structurellement le même.
// LETTRES ACCENTUÉES INCLUSES (2026-09-22, bug réel consigné dans points-fragiles.md puis corrigé).
// Le motif ne reconnaissait que l'ASCII : « Noé » se scindait en DEUX jetons (« No » + « é ») là où
// « Lia » n'en faisait qu'un — cassant l'égalité de longueur que matchLineTokens() exige, donc
// rendant invisible au détecteur v2 (renommage bijectif) exactement le cas qu'il est censé couvrir :
// les deux pensées mot pour mot identiques de full_sim17 (« Noé m'intrigue… » / « Lia m'intrigue… »).
// Un détecteur de duplication aveugle aux prénoms des deux personnages du projet passait à côté de
// sa cible la plus utile. `\p{L}` (avec le drapeau u) couvre toutes les lettres, pas une liste
// d'accents recopiée à la main qui oublierait le prochain caractère.
const TOKEN_RE = /[\p{L}_$][\p{L}\p{N}_$]*|\d+\.\d+|\d+|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\s+|./gu;
export function tokenizeLine(line) {
  return (line.match(TOKEN_RE) || []).filter((t) => !/^\s+$/.test(t));
}

// Un identifiant est renommable sauf s'il est réservé (mot-clé/global du langage) ou s'il suit un
// "." (accès à une vraie propriété/méthode existante, ex. `.push`, `.length` — jamais une variable
// qu'on pourrait avoir renommée).
function isRenamableIdentifier(tokens, i) {
  const t = tokens[i];
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(t)) return false;
  if (RESERVED_WORDS.has(t)) return false;
  if (tokens[i - 1] === ".") return false;
  return true;
}

// matchLineTokens() : deux lignes ont la même forme SI tous les tokens non-renommables sont
// identiques ET si les identifiants renommables suivent un renommage bijectif cohérent avec ce qui
// a déjà été observé plus tôt dans le bloc (mapAtoB/mapBtoA, jamais réinitialisé ligne par ligne) —
// c'est cette cohérence maintenue sur tout le bloc qui écarte une coïncidence de structure.
// Immutable : ne modifie jamais mapAtoB/mapBtoA reçus, retourne de nouvelles Map en cas de succès
// (ou les mêmes références si rien de neuf n'a été appris), null en cas d'échec.
export function matchLineTokens(tokensA, tokensB, mapAtoB, mapBtoA) {
  if (tokensA.length !== tokensB.length) return null;
  let nextAtoB = mapAtoB;
  let nextBtoA = mapBtoA;
  let copied = false;
  for (let i = 0; i < tokensA.length; i++) {
    const a = tokensA[i];
    const b = tokensB[i];
    const renamableA = isRenamableIdentifier(tokensA, i);
    const renamableB = isRenamableIdentifier(tokensB, i);
    if (renamableA !== renamableB) return null;
    if (!renamableA) {
      if (a !== b) return null;
      continue;
    }
    const mappedB = nextAtoB.get(a);
    const mappedA = nextBtoA.get(b);
    if (mappedB !== undefined || mappedA !== undefined) {
      if (mappedB !== b || mappedA !== a) return null;
      continue;
    }
    if (!copied) { nextAtoB = new Map(nextAtoB); nextBtoA = new Map(nextBtoA); copied = true; }
    nextAtoB.set(a, b);
    nextBtoA.set(b, a);
  }
  return { mapAtoB: nextAtoB, mapBtoA: nextBtoA };
}

function hasRealRenaming(mapAtoB) {
  for (const [a, b] of mapAtoB) if (a !== b) return true;
  return false;
}

// shapeFingerprint()/isSubstantialShape() : même rôle que normalizeLine()/isSubstantialLine() côté
// v1, mais sur la FORME (un même symbole neutre "•" pour tout identifiant renommable) plutôt que le
// texte littéral — sert d'ancre d'indexation bon marché pour ne comparer que les lignes qui ont une
// vraie chance de faire partie du même bloc, avant l'extension coûteuse ligne par ligne.
export function shapeFingerprint(tokens) {
  return tokens.map((t, i) => (isRenamableIdentifier(tokens, i) ? "•" : t)).join(" ");
}

export function isSubstantialShape(tokens, minRealTokens = 6) {
  const meaningful = tokens.filter((t, i) => isRenamableIdentifier(tokens, i) || /^\d/.test(t) || /^["'`]/.test(t) || RESERVED_WORDS.has(t));
  return meaningful.length >= minRealTokens;
}

// extendNearDuplicateBlock() : même « diff de blocs » que findDuplicateBlocks() côté v1 (étend tant
// que ça matche, jamais un fenêtrage à taille fixe), mais le critère de correspondance par ligne est
// matchLineTokens() plutôt qu'une égalité de texte — le mapping appris se propage d'une ligne à
// l'autre, jamais réinitialisé.
export function extendNearDuplicateBlock(linesA, startA, linesB, startB) {
  let length = 0;
  let mapAtoB = new Map();
  let mapBtoA = new Map();
  while (startA + length < linesA.length && startB + length < linesB.length) {
    const rawA = normalizeLine(linesA[startA + length]);
    const rawB = normalizeLine(linesB[startB + length]);
    if (!rawA || !rawB) break;
    const result = matchLineTokens(tokenizeLine(rawA), tokenizeLine(rawB), mapAtoB, mapBtoA);
    if (!result) break;
    mapAtoB = result.mapAtoB;
    mapBtoA = result.mapBtoA;
    length++;
  }
  return { length, mapAtoB };
}

// findNearDuplicateBlocks() : même cœur partagé findBlocksFromIndex() que v1, ancré sur
// shapeFingerprint() au lieu du texte normalisé, complété par le filtre accept:hasRealRenaming() —
// un bloc dont le "renommage" trouvé est en fait l'identité est un doublon LITTÉRAL, déjà couvert
// par v1, jamais recompté ici (Article 3 : la même vraie duplication ne doit jamais produire deux
// signalements distincts). Note honnête sur la limite du filtre accept() ici : cf. le commentaire
// dans findBlocksFromIndex() (cas rare de recouvrement même fichier).
export function findNearDuplicateBlocks(fileLines, { minLines = 5, minRealTokens = 6, maxOccurrencesPerShape = 40 } = {}) {
  const index = new Map();
  for (const [file, lines] of fileLines) {
    lines.forEach((raw, i) => {
      const norm = normalizeLine(raw);
      if (!norm) return;
      const tokens = tokenizeLine(norm);
      if (!isSubstantialShape(tokens, minRealTokens)) return;
      const key = shapeFingerprint(tokens);
      if (!index.has(key)) index.set(key, []);
      index.get(key).push({ file, index: i });
    });
  }
  return findBlocksFromIndex(index, fileLines, {
    minLines,
    maxOccurrencesPerAnchor: maxOccurrencesPerShape,
    extend: extendNearDuplicateBlock,
    accept: (extended) => hasRealRenaming(extended.mapAtoB),
  });
}

// collectFileLines() : lecture disque partagée par v1 et v2 (jamais deux copies du même parcours de
// fichiers — un comble pour un détecteur de duplication).
function collectFileLines(roots) {
  const fileLines = new Map();
  for (const root of roots) {
    const dir = join(ROOT, root);
    for (const file of walk(dir, DEFAULT_EXTENSIONS)) {
      const rel = relative(ROOT, file);
      try { fileLines.set(rel, readFileSync(file, "utf8").split("\n")); } catch { /* fichier illisible, ignoré honnêtement */ }
    }
  }
  return fileLines;
}

// buildDuplicateReport() : point d'entrée haut niveau — lit vraiment le disque (jamais dans
// findDuplicateBlocks()/clusterDuplicates(), qui restent des fonctions pures testables sans I/O).
export function buildDuplicateReport(roots = DEFAULT_ROOTS, options = {}) {
  const fileLines = collectFileLines(roots);
  return clusterDuplicates(findDuplicateBlocks(fileLines, options));
}

// buildNearDuplicateReport() : même entrée haut niveau que buildDuplicateReport(), version v2 —
// réutilise clusterDuplicates() telle quelle (les paires ont exactement la même forme), jamais un
// second algorithme de regroupement.
export function buildNearDuplicateReport(roots = DEFAULT_ROOTS, options = {}) {
  const fileLines = collectFileLines(roots);
  return clusterDuplicates(findNearDuplicateBlocks(fileLines, options));
}


// ————————————————————————————————————————————————————————————————————————
// UNE ALERTE PAR PROBLÈME, PAS PAR CHEVAUCHEMENT DE LIGNES (2026-09-23, tâche #217, accord
// explicite de l'utilisateur : « Oui, regrouper ET motiver chaque alerte »)
// ————————————————————————————————————————————————————————————————————————
//
// LE DÉFAUT, mesuré par l'enquête #215 : 29 alertes pour 14 problèmes réels. La cause est
// mécanique et sans malice — `clusterDuplicates()` regroupe par ANCRE (`fichier:ligne`), donc la
// même duplication découverte à deux décalages différents donne deux nœuds qui ne se rejoignent
// jamais. Exemple vécu : les jumelles `flagFindBoosterCandidates` / `flagFindDeepBoosterCandidates`
// produisaient TROIS alertes, une par ligne d'ancrage (323, 324, 326), pour un seul problème.
//
// LE CAS QUI TRAVERSE v1 ET v2, et c'est le plus instructif : v2 annonce « jamais déjà comptés par
// v1 ». C'est vrai de son ANCRE (elle exige un vrai renommage, que v1 ne verrait pas) et faux de sa
// RÉGION — son bloc démarre une ligne plus haut et englobe celui de v1. La promesse portait sur le
// mauvais objet. Fusionner sur le chevauchement des RÉGIONS la rend enfin exacte.
//
// CE QU'ON NE FAIT PAS : masquer. Rien ne disparaît, tout est regroupé, et chaque problème garde la
// trace du ou des détecteurs qui l'ont vu. Un Gardien sacré qui perdrait une trouvaille en route
// serait pire que celui qui en compte deux fois.

// Deux clusters décrivent le même problème s'ils couvrent les MÊMES fichiers et que, dans chacun,
// leurs plages de lignes se chevauchent. Exiger le chevauchement dans TOUS les fichiers communs
// (jamais un seul suffisant) est volontairement strict : deux duplications distinctes entre la même
// paire de fichiers doivent rester deux problèmes.
export function clustersSeRecouvrent(a, b) {
  const plages = (c) => new Map(c.occurrences.map((o) => [o.file, [o.start, o.start + c.lines]]));
  const pa = plages(a), pb = plages(b);
  const fichiersA = [...pa.keys()].sort().join("|");
  const fichiersB = [...pb.keys()].sort().join("|");
  if (fichiersA !== fichiersB) return false;
  for (const [fichier, [debutA, finA]] of pa) {
    const [debutB, finB] = pb.get(fichier);
    if (debutA >= finB || debutB >= finA) return false;
  }
  return true;
}

export function fusionnerClusters(clusters = []) {
  const fusionnes = [];
  for (const c of clusters) {
    const existant = fusionnes.find((f) => clustersSeRecouvrent(f, c));
    if (!existant) { fusionnes.push({ ...c, detecteurs: [...new Set(c.detecteurs ?? [c.detecteur].filter(Boolean))], fusionnes: 1 }); continue; }
    // On garde la plus GRANDE emprise : c'est elle qui décrit le problème le plus complètement.
    if (c.lines > existant.lines) { existant.lines = c.lines; existant.preview = c.preview; existant.occurrences = c.occurrences; }
    for (const d of c.detecteurs ?? [c.detecteur].filter(Boolean)) if (!existant.detecteurs.includes(d)) existant.detecteurs.push(d);
    existant.fusionnes += 1;
  }
  return fusionnes.sort((x, y) => (y.lines * y.occurrences.length) - (x.lines * x.occurrences.length));
}

// LE MOTIF, DÉRIVÉ DES FAITS et jamais une phrase de plus recopiée (Article 24, et le corollaire de
// l'Article 17 : on cherche un principe que l'outil s'applique à lui-même, pas un exemple de plus).
//
// POURQUOI LA PHRASE UNIQUE NE SUFFISAIT PAS : « factoriser si le bloc dépasse le seuil où la
// factorisation rapporte plus qu'elle ne coûte » est vraie, et elle renvoie la décision au lecteur
// sans lui donner de quoi la prendre. Or l'outil SAIT déjà de quoi la prendre — il connaît la
// taille, le nombre de sites, et surtout s'ils sont dans un seul fichier ou répartis. Ce dernier
// point change tout : deux jumelles dans un fichier sont une gêne locale, le même bloc recopié dans
// sept outils est une dette qui se recopie une fois de plus à chaque nouveau membre de l'équipe.
export function motifDuCluster(cluster) {
  const fichiers = [...new Set(cluster.occurrences.map((o) => o.file))];
  const sites = cluster.occurrences.length;
  const gros = cluster.lines >= 8;

  if (fichiers.length === 1) {
    return {
      portee: "un seul fichier",
      motif: `${sites} blocs jumeaux dans ${fichiers[0]}${gros ? ", assez gros pour qu'une correction appliquée à l'un et pas à l'autre passe inaperçue" : " — gêne de lecture avant tout"}`,
      tache: `relire ${fichiers[0]} : fondre les ${sites} blocs, ou écrire pourquoi ils restent séparés`,
    };
  }
  const tousOutillage = fichiers.every((f) => f.startsWith("scripts/"));
  if (tousOutillage) {
    return {
      portee: "réparti dans l'outillage",
      motif: `le même bloc dans ${fichiers.length} outils différents — c'est la forme de dette qui se recopie une fois de plus à chaque outil qui rejoint l'équipe, et qu'un commentaire promettant « jamais une copie de plus » n'a jamais suffi à arrêter`,
      tache: `sortir ce bloc dans un module partagé et y brancher les ${sites} sites`,
    };
  }
  const toucheLeMoteur = fichiers.some((f) => f.startsWith("lib/") || f.startsWith("app/"));
  return {
    portee: toucheLeMoteur ? "traverse le moteur du jeu" : "réparti",
    motif: toucheLeMoteur
      ? `réparti entre ${fichiers.length} fichiers dont au moins un du moteur du jeu — une correction de comportement appliquée à une copie sur ${sites} produirait deux règles différentes dans la même partie`
      : `réparti entre ${fichiers.length} fichiers`,
    tache: toucheLeMoteur
      ? `vérifier d'abord que les ${sites} copies doivent bien se comporter pareil, puis les unifier`
      : `unifier les ${sites} sites`,
  };
}

export function formatClusterSummary(cluster) {
  const where = cluster.occurrences.map((o) => `${o.file}:${o.start + 1}`).join(", ");
  return `${cluster.lines} ligne(s) dupliquée(s) × ${cluster.occurrences.length} endroit(s) — ${where} — aperçu: "${cluster.preview[0] ?? ""}"`;
}

function main() {
  printReportHeader({ tool: "clone-hunter", title: "CLONE-HUNTER — blocs de code dupliqués", scriptPath: "scripts/clone-hunter.mjs" });
  recordCliUsage("clone-hunter");
  // LE CORPUS AVANT TOUT VERDICT (2026-09-25, chantier #206). Mesuré le 2026-09-23 :
  // `findDuplicateBlocks` et `findNearDuplicateBlocks` rendent tous deux `[]` sur une entrée vide,
  // soit exactement ce qu'ils rendent sur un dépôt sans le moindre doublon.
  // Le corpus est RECOMPTÉ depuis les mêmes racines que buildDuplicateReport(), jamais un second
  // parcours d'un autre périmètre : compter autre chose que ce qui est analysé produirait un
  // dénominateur faux, ce qui est pire qu'un dénominateur absent.
  const corpusClone = DEFAULT_ROOTS.flatMap((r) => walk(join(ROOT, r), DEFAULT_EXTENSIONS));
  console.log(ligneCorpus(mesurerCorpus(corpusClone, { quoi: "le corpus des fichiers source balayés" }), { nomDuGardien: "CLONE-HUNTER" }));
  const clusters = buildDuplicateReport();
  if (!clusters.length) {
    console.log("CLONE-HUNTER : aucun bloc dupliqué détecté au-dessus du seuil (≥5 lignes, ≥20 caractères par ligne).");
  } else {
    console.log(`CLONE-HUNTER : ${clusters.length} cluster(s) de code dupliqué (identique) trouvé(s) (triés par impact décroissant) :`);
    for (const cluster of clusters.slice(0, 30)) console.log(`  - ${formatClusterSummary(cluster)}`);
    if (clusters.length > 30) console.log(`  ... et ${clusters.length - 30} de plus.`);
  }
  const nearClusters = buildNearDuplicateReport();
  if (!nearClusters.length) {
    console.log("CLONE-HUNTER v2 : aucun bloc structurellement dupliqué (identifiants renommés) détecté au-dessus du seuil.");
  } else {
    console.log(`CLONE-HUNTER v2 (renommage) : ${nearClusters.length} cluster(s) de code structurellement dupliqué (identifiants renommés, jamais déjà comptés par v1) trouvé(s) :`);
    for (const cluster of nearClusters.slice(0, 30)) console.log(`  - ${formatClusterSummary(cluster)}`);
    if (nearClusters.length > 30) console.log(`  ... et ${nearClusters.length - 30} de plus.`);
  }

  // LE REGROUPEMENT (2026-09-23, tâche #217). Les deux listes ci-dessus restent affichées telles
  // quelles — elles portent une vraie information, littéral n'est pas renommage — mais le PLAN
  // D'ACTION, lui, travaille sur les problèmes et non sur les ancres. C'est la partie qu'on lit
  // pour agir : y répéter trois fois la même duplication la rend trois fois moins crédible.
  const problemes = fusionnerClusters([
    ...clusters.map((c) => ({ ...c, detecteur: "identique" })),
    ...nearClusters.map((c) => ({ ...c, detecteur: "renommage" })),
  ]);
  const brutes = clusters.length + nearClusters.length;
  console.log(`\n→ ${brutes} alerte(s) brute(s) = ${problemes.length} problème(s) distinct(s). L'écart n'est pas du bruit : la même duplication trouvée depuis deux ancres différentes (ou par les deux détecteurs) produisait deux alertes pour un seul problème.`);

  // CONSTAT >> TÂCHES (2026-09-23). Ni `toucheLeJeu` ni `fausseUneMesure` : une duplication ne rend
  // aucun chiffre faux et ne touche pas le produit — elle coûte en maintenance. Donc RECOMMANDÉE,
  // et c'est la bonne réponse : classer tout en obligatoire viderait le mot de son sens.
  //
  // LE MOTIF ET LA TÂCHE SONT DÉRIVÉS de chaque problème, jamais une phrase unique répétée : la
  // précédente était vraie et n'aidait personne, puisqu'elle renvoyait au lecteur la décision que
  // l'outil avait déjà de quoi éclairer.
  const plan = planDactionDepuisEcarts(problemes, { toolSlug: "clone-hunter",
    libelle: (c) => `[${c.detecteurs.join("+")}] ${formatClusterSummary(c)} — ${motifDuCluster(c).motif}`,
    tache: (c) => motifDuCluster(c).tache });
  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of plan.lignes) console.log(l);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
