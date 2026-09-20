// Partagé entre the-final-judge.mjs et the-deep-reader.mjs (2026-09-21, tâche #152 — les deux
// fichiers avaient chacun leur propre copie de extractPersonaBlock(), strictement identique, et une
// version de detectGenericReport() qui répétait la même logique de "sections manquantes"/"trop
// court" avant d'ajouter son propre signal spécifique — corrigé une fois ici plutôt que dupliqué
// deux fois, règle anti-doublon §7ter). Jamais un troisième cousin qui réimplémenterait sa propre
// copie : tout futur "judge" du même genre (agent séparé, personnage fixe, anti-dérive générique)
// doit importer d'ici.

// Le personnage fixe vit dans un bloc de citation markdown ("> ...") sous le titre "Personnage" du
// document d'instanciation de l'outil appelant — extrait ligne par ligne, jamais recopié à la main
// ailleurs (garantit que le texte utilisé à chaque appel provient TOUJOURS du même texte de
// référence, exigence non négociable de l'utilisateur).
export function extractPersonaBlock(instantiationText) {
  const lines = instantiationText.split("\n");
  const quoted = lines.filter((l) => l.trim().startsWith(">"));
  return quoted.map((l) => l.replace(/^\s*>\s?/, "")).join("\n").trim();
}

// Signal mécanique partagé : sections attendues manquantes dans le rapport — jamais un jugement de
// contenu (impossible à mécaniser, Article 17 corollaire), seulement l'absence structurelle de ce
// que la sortie attendue exige explicitement (propre à chaque outil appelant, fourni en paramètre).
export function missingSectionsSignal(reportText, requiredSections) {
  const lower = (reportText || "").toLowerCase();
  const missing = requiredSections.filter((s) => !lower.includes(s));
  return missing.length ? `structure attendue incomplète (manque : ${missing.join(", ")})` : undefined;
}

// Signal mécanique partagé : rapport anormalement court pour un vrai passage — le seuil et le
// libellé du type de passage restent propres à chaque outil appelant (400/"un audit réel" pour
// THE-FINAL-JUDGE, 200/"une relecture réelle" pour THE-DEEP-READER), jamais un seuil unique imposé.
export function tooShortSignal(reportText, minLength, label) {
  return (reportText || "").trim().length < minLength ? `rapport anormalement court pour ${label} (moins de ${minLength} caractères)` : undefined;
}
