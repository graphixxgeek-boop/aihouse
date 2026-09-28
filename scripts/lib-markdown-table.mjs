// ICEBERG: plomberie
// Petit assistant partagé pour lire une table markdown "au format registre" utilisée par plusieurs
// outils de ce projet (2026-09-19, extrait au moment de construire CLEAN-DIRTY-OLD, en trouvant la
// même logique de filtrage de lignes sur le point d'être réécrite une troisième fois après
// ALWAYS-NEW-CODE et HYPER-SCAN-CHECKPOINT — règle anti-doublon, docs/regles-de-travail.md §7ter).

// Renvoie les lignes de données d'une table markdown : jamais la ligne de séparation ("|---|...|"),
// jamais la ligne d'en-tête (repérée par un texte qui n'apparaît que dans l'en-tête, ex. le nom
// d'une colonne) — le filtrage se fait sur la ligne BRUTE, avant tout découpage en cellules.
export function dataRows(text, headerMarker) {
  // Un texte absent rend zéro ligne plutôt que de lever : deux appelants écrivaient déjà `(indexText
  // || "")` de leur côté, chacun sa précaution, et une précaution recopiée est une précaution
  // qu'un troisième appelant oubliera.
  return String(text ?? "")
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

// LE MÊME KPI DANS QUATRE OUTILS (2026-09-28, tâche #997, signalé par CLONE-HUNTER).
// HYPER-SCAN-CHECKPOINT, THE-DEEP-READER, ALWAYS-NEW-CODE et CLEAN-DIRTY-OLD calculent tous les
// quatre « combien de passages, combien de trouvailles, combien par passage » sur leur propre
// registre. Deux d'entre eux réimplémentaient même la lecture de table que ce module rend déjà —
// c'est le signe qu'un assistant partagé qu'on ne connaît pas ne sert à rien : le doublon revient
// par la porte de celui qui ne savait pas qu'il existait.
//
// L'ABSENCE HONNÊTE EST LE CŒUR DE CETTE FONCTION, jamais un détail : sans passage enregistré elle
// rend `undefined`, jamais un 0 % — un taux de zéro se lit comme « cet outil ne trouve rien »,
// alors qu'il dit « personne ne l'a encore lancé ». C'était déjà la règle des quatre copies ; elle
// devient impossible à oublier pour la cinquième.
//
// LES NOMS SONT NEUTRES (`total`, `parPassage`) parce que les quatre appelants nomment la même
// chose différemment — trouvailles, écarts, points de dette. Chacun rehabille ce qu'il rend ; aucun
// n'a à recalculer.
export function performanceDePassages(counts = []) {
  if (!counts.length) return undefined;
  const passages = counts.length;
  const total = counts.reduce((a, b) => a + b, 0);
  return { passages, total, parPassage: total / passages, hitRate: (counts.filter((n) => n > 0).length / passages) * 100 };
}
