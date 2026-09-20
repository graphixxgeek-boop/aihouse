// Partie mécanique minimale de THE-DEEP-READER (2026-09-20, cf. docs/referentiel/the-deep-reader.md
// pour les règles complètes). Même statut que scripts/the-final-judge.mjs : THE-DEEP-READER lui-même
// est un vrai agent séparé (outil Agent), jamais invocable depuis un script headless — ce fichier ne
// couvre donc jamais le jugement lui-même (une comparaison factuelle, un raisonnement), seulement
// deux garde-fous mécaniques et gratuits, plus le KPI central de l'outil.
//
// (1) extractPersonaBlock() — garantit que le personnage FIXE utilisé à chaque appel provient
//     TOUJOURS du même texte de référence (docs/referentiel/the-deep-reader.md), jamais reformulé à
//     la main — même discipline que THE-FINAL-JUDGE, non négociable.
// (2) detectGenericReport() — après un passage réel, repère les signes mécaniques d'une dérive vers
//     un rapport vague qui ne remplit pas la sortie attendue (nombre d'interventions relues, écarts
//     nommés, confirmation de ce qui est déjà bien tracé) — jamais un jugement de contenu, seulement
//     l'absence structurelle de ce que son personnage exige de lui-même.
// (3) rereadPerformance() — KPI central, même vocation qu'HYPER-SCAN-CHECKPOINT : le succès ne se
//     mesure jamais à "a-t-il tourné sans erreur" mais au nombre de passages ayant réellement trouvé
//     un écart confirmé — jamais un nombre de passages lancés.

const REQUIRED_SECTIONS = ["interventions relues", "écart", "déjà bien tracé"];

// Le personnage fixe vit dans un bloc de citation markdown ("> ...") sous le titre "Personnage —
// texte FIXE" de docs/referentiel/the-deep-reader.md — extrait ligne par ligne, jamais recopié à la
// main ailleurs (même mécanique que extractPersonaBlock() de the-final-judge.mjs).
export function extractPersonaBlock(instantiationText) {
  const lines = instantiationText.split("\n");
  const quoted = lines.filter((l) => l.trim().startsWith(">"));
  return quoted.map((l) => l.replace(/^\s*>\s?/, "")).join("\n").trim();
}

// Signes structurels d'un rapport trop vague pour être exploitable : jamais un jugement sur la
// justesse des écarts trouvés (impossible à mécaniser), seulement l'absence de ce que la sortie
// attendue exige explicitement (cf. docs/referentiel/the-deep-reader.md, "Sortie attendue").
export function detectGenericReport(reportText) {
  const signals = [];
  const lower = reportText.toLowerCase();
  if (!/\d/.test(reportText)) signals.push("aucun nombre concret (le rapport doit toujours chiffrer le nombre d'interventions relues)");
  const missingSections = REQUIRED_SECTIONS.filter((s) => !lower.includes(s));
  if (missingSections.length) signals.push("structure attendue incomplète (manque : " + missingSections.join(", ") + ")");
  if (reportText.trim().length < 200) signals.push("rapport anormalement court pour une relecture réelle (moins de 200 caractères)");
  return signals;
}

// KPI central (2026-09-20, même vocation qu'HYPER-SCAN-CHECKPOINT/checkpointPerformance()) : lit le
// registre docs/suivi/relectures-lourdes/index.md (colonne "Écarts trouvés", 3e colonne de données)
// et rapporte le taux réel de passages ayant confirmé au moins un écart — jamais un nombre de
// passages lancés, qui ne dit rien sur l'utilité réelle de l'outil.
export function rereadPerformance(indexText) {
  const dataRows = (indexText || "")
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-+\s*\|/.test(l) && !l.includes("Dernière tâche couverte"));
  const counts = dataRows
    .map((row) => row.split("|").map((c) => c.trim()))
    .filter((cols) => cols.length >= 4 && /^\d+$/.test(cols[3]))
    .map((cols) => Number(cols[3]));
  if (!counts.length) return undefined;
  const passages = counts.length;
  const totalEcarts = counts.reduce((a, b) => a + b, 0);
  const passagesAvecEcart = counts.filter((n) => n > 0).length;
  return {
    passages,
    totalEcarts,
    ecartsParPassage: totalEcarts / passages,
    hitRate: (passagesAvecEcart / passages) * 100,
  };
}
