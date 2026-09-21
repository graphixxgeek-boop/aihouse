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
//
// extractPersonaBlock() et la logique commune de detectGenericReport() (sections manquantes, rapport
// trop court) vivent désormais dans judge-persona-shared.mjs (2026-09-21, tâche #152) — étaient
// strictement dupliquées à l'identique avec the-final-judge.mjs, corrigé une fois plutôt que deux
// fois divergentes (règle anti-doublon §7ter). Seul le signal propre à CE personnage (chiffrer le
// nombre d'interventions relues) reste local.

import { extractPersonaBlock, missingSectionsSignal, tooShortSignal } from "./judge-persona-shared.mjs";
import { renderHtmlReport } from "./html-report.mjs";

export { extractPersonaBlock };

// buildDeepReaderReportHtml() (2026-09-21, trouvaille réelle de auditHtmlDecisions()/doc-report.mjs
// en construisant la règle « tous les outils de la Ronde produisent un rapport » : ce fichier était
// enregistré "delivery_html" dans REGISTRIES depuis sa création mais n'a JAMAIS importé
// html-report.mjs — un vrai écart resté invisible tant que le seul garde-fou existant
// (l'ancien checkHtmlWiring() de circle-tasks.mjs) ne vérifiait que 3 scripts codés en dur, jamais
// celui-ci. Mêmes commentaires et même forme que buildFinalJudgeReportHtml() (the-final-judge.mjs,
// son cousin) : THE-DEEP-READER n'a pas de main()/CLI, le vrai rapport est écrit en prose par
// l'agent séparé puis réconcilié par l'agent orchestrateur — cette fonction est le point
// d'intégration réel, appelée à la main au moment de LIVRER un rapport, jamais un second calcul.
export function buildDeepReaderReportHtml(reportText, { title = "THE-DEEP-READER — rapport", subtitle, dateLabel } = {}) {
  return renderHtmlReport({
    title,
    subtitle: subtitle ?? "Relecture lourde du suivi (conversation vs docs/suivi), agent séparé — cf. docs/referentiel/the-deep-reader.md.",
    dateLabel: dateLabel ?? new Date().toISOString(),
    blocks: [{ type: "code", text: reportText }],
    footer: "THE-DEEP-READER — conseiller uniquement, jamais un exécutant ni une décision automatique.",
  });
}

const REQUIRED_SECTIONS = ["interventions relues", "écart", "déjà bien tracé"];

// Signes structurels d'un rapport trop vague pour être exploitable : jamais un jugement sur la
// justesse des écarts trouvés (impossible à mécaniser), seulement l'absence de ce que la sortie
// attendue exige explicitement (cf. docs/referentiel/the-deep-reader.md, "Sortie attendue").
export function detectGenericReport(reportText) {
  const signals = [];
  if (!/\d/.test(reportText || "")) signals.push("aucun nombre concret (le rapport doit toujours chiffrer le nombre d'interventions relues)");
  const missing = missingSectionsSignal(reportText, REQUIRED_SECTIONS);
  if (missing) signals.push(missing);
  const short = tooShortSignal(reportText, 200, "une relecture réelle");
  if (short) signals.push(short);
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
