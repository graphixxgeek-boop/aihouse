// Petit assistant partagé pour lire une table markdown "au format registre" utilisée par plusieurs
// outils de ce projet (2026-09-19, extrait au moment de construire CLEAN-DIRTY-OLD, en trouvant la
// même logique de filtrage de lignes sur le point d'être réécrite une troisième fois après
// ALWAYS-NEW-CODE et HYPER-SCAN-CHECKPOINT — règle anti-doublon, docs/regles-de-travail.md §7ter).

// Renvoie les lignes de données d'une table markdown : jamais la ligne de séparation ("|---|...|"),
// jamais la ligne d'en-tête (repérée par un texte qui n'apparaît que dans l'en-tête, ex. le nom
// d'une colonne) — le filtrage se fait sur la ligne BRUTE, avant tout découpage en cellules.
export function dataRows(text, headerMarker) {
  return text
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-+\s*\|/.test(l) && !(headerMarker && l.includes(headerMarker)));
}

// Extrait les valeurs numériques d'UNE colonne (par index, cellules jamais filtrées des vides pour
// garder l'indexation identique à un split("|") brut) — une cellule non numérique est simplement
// ignorée, jamais convertie en 0.
export function numericColumn(rows, columnIndex) {
  return rows
    .map((row) => row.split("|").map((c) => c.trim()))
    .filter((cols) => cols.length > columnIndex && /^\d+$/.test(cols[columnIndex]))
    .map((cols) => Number(cols[columnIndex]));
}
