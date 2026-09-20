// route-booster — outil pratique (sans blueprint, même statut que LE-COORDINATEUR/CIRCLE-TASKS),
// 2026-09-21, demande explicite de l'utilisateur pour préparer le découpage de la fonction géante
// d'app/api/lia/route.ts (POST, ~1665 lignes) en sous-fonctions nommées.
//
// Détecte mécaniquement des points de coupe candidats (bannières de commentaires déjà présentes
// dans le style de ce projet, branches `if (x === "...")` à faible profondeur, commentaire
// descriptif après une ligne vide) et un indice de risque lexical par candidat — jamais une
// réécriture automatique du fichier : la découpe réelle reste manuelle, une fonction à la fois,
// avec tests après chaque extraction (Article 5/19, cœur du jeu = zéro tolérance à la régression).
//
// Zéro nouvelle dépendance : heuristique par texte/regex, jamais un vrai parseur AST — approximatif
// et assumé comme tel (même discipline de reconnaissance de motifs que le reste du réseau d'outils,
// jamais une preuve formelle). Réutilisable indéfiniment : si ce fichier (ou un autre) regonfle un
// jour en monolithe peu lisible, le relancer le re-signale, comme CLEAN-DIRTY-OLD pour la stagnation.

import { readFileSync } from "node:fs";

const BANNER_RE = /^\s*\/\/\s*-{3,}/;
// Testé contre le vrai route.ts (2026-09-21) : la fonction POST est indentée par un bloc `try`
// englobant, donc toute contrainte stricte sur la profondeur d'indentation ratait chaque branche
// réelle — retiré, seule la forme `if (x.y === "...")` (avec ou sans espaces) compte désormais.
const MODE_BRANCH_RE = /^\s*if\s*\(\s*[\w.]+\s*===\s*["'`]/;

// Repère les frontières visibles déjà présentes dans le style de code de ce projet, jamais une
// analyse syntaxique réelle du fichier.
export function findCutPoints(lines) {
  const points = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (BANNER_RE.test(line)) {
      points.push({ line: i, kind: "banniere", label: line.trim() });
      continue;
    }
    if (MODE_BRANCH_RE.test(line)) {
      points.push({ line: i, kind: "branche_mode", label: line.trim() });
      continue;
    }
    if (line.trim() === "" && i + 1 < lines.length && /^\s*\/\/\s*\S/.test(lines[i + 1]) && !BANNER_RE.test(lines[i + 1])) {
      points.push({ line: i + 1, kind: "commentaire_apres_ligne_vide", label: lines[i + 1].trim() });
    }
  }
  return points;
}

const IDENTIFIER_RE = /[A-Za-z_$][A-Za-z0-9_$]*/g;
const DECLARATION_RE = /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
const JS_KEYWORDS = new Set(["const", "let", "var", "function", "return", "if", "else", "for", "while", "switch", "case", "break", "continue", "new", "typeof", "instanceof", "in", "of", "this", "true", "false", "null", "undefined", "await", "async", "try", "catch", "finally", "throw", "export", "import", "from", "as", "default", "class", "extends", "super", "void", "delete", "yield", "do"]);

function declaredNamesIn(linesSlice) {
  const names = new Set();
  for (const line of linesSlice) {
    let m;
    DECLARATION_RE.lastIndex = 0;
    while ((m = DECLARATION_RE.exec(line))) names.add(m[1]);
  }
  return names;
}

function identifiersIn(linesSlice) {
  const names = new Set();
  for (const line of linesSlice) {
    let m;
    IDENTIFIER_RE.lastIndex = 0;
    while ((m = IDENTIFIER_RE.exec(line))) {
      if (!JS_KEYWORDS.has(m[0])) names.add(m[0]);
    }
  }
  return names;
}

// Indice de risque lexical — jamais une résolution de portée réelle (heuristique assumée) : combien
// de noms utilisés dans le candidat sont déclarés AVANT lui dans la même fonction (dépendance
// entrante, à passer en paramètre à l'extraction) et combien de noms qu'il déclare sont réutilisés
// APRÈS lui (dépendance sortante, à faire remonter en valeur de retour). Plus la somme est élevée,
// plus l'extraction est délicate — un signal pour guider l'agent avant d'extraire à la main, jamais
// un verdict qui déciderait à sa place.
export function analyzeClosureRisk(lines, start, end) {
  const before = lines.slice(0, start);
  const candidate = lines.slice(start, end);
  const after = lines.slice(end);
  const declaredBefore = declaredNamesIn(before);
  const declaredInCandidate = declaredNamesIn(candidate);
  const usedInCandidate = identifiersIn(candidate);
  const usedAfter = identifiersIn(after);
  const incoming = [...usedInCandidate].filter((n) => declaredBefore.has(n));
  const outgoing = [...declaredInCandidate].filter((n) => usedAfter.has(n));
  return { incoming, outgoing, riskScore: incoming.length + outgoing.length };
}

export function proposeDecomposition(filePath, { functionStart = 0, functionEnd } = {}) {
  const source = readFileSync(filePath, "utf8");
  const allLines = source.split("\n");
  const end = functionEnd ?? allLines.length;
  const scoped = allLines.slice(functionStart, end);
  const points = findCutPoints(scoped);
  return points.map((p, idx) => {
    const start = p.line;
    const nextStart = points[idx + 1]?.line ?? scoped.length;
    const { incoming, outgoing, riskScore } = analyzeClosureRisk(scoped, start, nextStart);
    return { ...p, line: p.line + functionStart, endLine: nextStart + functionStart, incoming, outgoing, riskScore };
  });
}

function main() {
  const target = process.argv[2] ?? "app/api/lia/route.ts";
  const proposals = proposeDecomposition(target);
  console.log(`route-booster — ${proposals.length} point(s) de coupe candidat(s) dans ${target} :\n`);
  for (const p of proposals) {
    console.log(`L${p.line + 1}-${p.endLine} [${p.kind}] risque=${p.riskScore} — ${p.label}`);
    if (p.incoming.length) console.log(`   entrant (déjà déclaré avant, à passer en paramètre) : ${p.incoming.join(", ")}`);
    if (p.outgoing.length) console.log(`   sortant (réutilisé après, à faire remonter) : ${p.outgoing.join(", ")}`);
  }
  console.log("\nJamais une application automatique : ces candidats guident une extraction manuelle, avec tests après chaque étape.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
