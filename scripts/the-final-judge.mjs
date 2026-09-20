// Partie mécanique minimale de THE-FINAL-JUDGE (2026-09-20, cf. docs/referentiel/the-final-judge.md
// pour les règles complètes). THE-FINAL-JUDGE lui-même est un vrai agent séparé (outil `Agent`),
// jamais invocable depuis un script headless comme check-spirit.mjs appelle Gemini directement — ce
// fichier ne couvre donc jamais le jugement lui-même (un raisonnement, jamais un calcul), seulement
// deux garde-fous mécaniques et gratuits qui protègent ce qui fait sa valeur :
//
// (1) extractPersonaBlock() — garantit que le personnage FIXE utilisé à chaque appel provient
//     TOUJOURS du même texte de référence (docs/referentiel/the-final-judge.md), jamais reformulé à
//     la main à chaque déclenchement — exigence non négociable de l'utilisateur.
// (2) detectGenericReport() — après un passage réel, repère les signes mécaniques d'une dérive vers
//     un ton générique/consensuel (même risque déjà rencontré pour Lia/Noé, Article 0) : jamais une
//     liste de formulations interdites (corollaire Article 17), mais un signal structurel — un
//     rapport de ce format qui ne cite AUCUN élément concret du dépôt n'a manifestement pas fait le
//     travail que son personnage exige (« Cite toujours des exemples précis »).
//
// Ses heuristiques ne détectent que les dérives les plus grossières, comme pour check-spirit.mjs :
// elles ne dispensent jamais de lire le rapport.

const REPO_PATH_PATTERN = /`((?:docs|lib|app|scripts|components)\/[A-Za-z0-9_.\-/]+\.[A-Za-z0-9]+)`/g;

// Le personnage fixe vit dans un bloc de citation markdown ("> ...") sous le titre "Personnage
// donné à l'agent séparé" de docs/referentiel/the-final-judge.md — extrait ligne par ligne, jamais
// recopié à la main ailleurs.
export function extractPersonaBlock(instantiationText) {
  const lines = instantiationText.split("\n");
  const quoted = lines.filter((l) => l.trim().startsWith(">"));
  return quoted.map((l) => l.replace(/^\s*>\s?/, "")).join("\n").trim();
}

// Signes structurels d'un rapport générique : jamais un jugement de contenu (impossible à
// mécaniser, cf. Article 17 corollaire), seulement l'absence de ce que le personnage exige
// explicitement de lui-même.
export function detectGenericReport(reportText) {
  const signals = [];
  const citations = [...reportText.matchAll(REPO_PATH_PATTERN)];
  if (citations.length === 0) signals.push("aucune référence concrète à un fichier réel du dépôt (le personnage exige de toujours citer des exemples précis)");
  const fourSections = ["verdict", "positif", "améliorer", "pistes"];
  const lower = reportText.toLowerCase();
  const missingSections = fourSections.filter((s) => !lower.includes(s));
  if (missingSections.length) signals.push("structure attendue en 4 parties incomplète (manque : " + missingSections.join(", ") + ")");
  if (reportText.trim().length < 400) signals.push("rapport anormalement court pour un audit réel (moins de 400 caractères)");
  return signals;
}
