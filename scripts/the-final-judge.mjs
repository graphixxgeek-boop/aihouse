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
//
// extractPersonaBlock() et la logique commune de detectGenericReport() (sections manquantes, rapport
// trop court) vivent désormais dans judge-persona-shared.mjs (2026-09-21, tâche #152) — étaient
// strictement dupliquées à l'identique avec the-deep-reader.mjs, corrigé une fois plutôt que deux
// fois divergentes (règle anti-doublon §7ter). Seul le signal propre à CE personnage (citation d'un
// vrai fichier du dépôt) reste local.

import { renderHtmlReport } from "./html-report.mjs";
import { extractPersonaBlock, missingSectionsSignal, tooShortSignal } from "./judge-persona-shared.mjs";

export { extractPersonaBlock };

const REPO_PATH_PATTERN = /`((?:docs|lib|app|scripts|components)\/[A-Za-z0-9_.\-/]+\.[A-Za-z0-9]+)`/g;

// Signes structurels d'un rapport générique : jamais un jugement de contenu (impossible à
// mécaniser, cf. Article 17 corollaire), seulement l'absence de ce que le personnage exige
// explicitement de lui-même.
export function detectGenericReport(reportText) {
  const signals = [];
  const citations = [...reportText.matchAll(REPO_PATH_PATTERN)];
  if (citations.length === 0) signals.push("aucune référence concrète à un fichier réel du dépôt (le personnage exige de toujours citer des exemples précis)");
  const missing = missingSectionsSignal(reportText, ["verdict", "positif", "améliorer", "pistes"]);
  if (missing) signals.push(missing);
  const short = tooShortSignal(reportText, 400, "un audit réel");
  if (short) signals.push(short);
  return signals;
}

// Rapport HTML (2026-09-20, tâche #144) : contrairement à el-professor.mjs/the-screener-capture.mjs,
// THE-FINAL-JUDGE n'a pas de main()/CLI — le vrai rapport est écrit en prose par l'agent séparé
// (outil `Agent`) puis réconcilié par l'agent orchestrateur. Ce fichier n'a donc aucun point
// d'appel automatique à câbler ; cette fonction est le point d'intégration réel, appelée à la main
// par l'agent orchestrateur au moment de LIVRER un rapport, jamais un second calcul du verdict —
// un bloc "code" (pas "paragraph") pour préserver la mise en page du texte libre (sauts de ligne,
// sections), jamais reformaté ni résumé.
export function buildFinalJudgeReportHtml(reportText, { title = "THE-FINAL-JUDGE — rapport", subtitle, dateLabel } = {}) {
  return renderHtmlReport({
    title,
    subtitle: subtitle ?? "Audit indépendant de code et de produit, agent séparé — cf. docs/referentiel/the-final-judge.md.",
    dateLabel: dateLabel ?? new Date().toISOString(),
    blocks: [{ type: "code", text: reportText }],
    footer: "THE-FINAL-JUDGE — conseiller uniquement, jamais un exécutant ni une décision automatique.",
  });
}
