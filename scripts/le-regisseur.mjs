// LE-RÉGISSEUR — orchestre les parties MÉCANIQUES, sans aucun jugement, du protocole de simulation
// complète (Article 18 de CLAUDE.md), pour ne plus dépendre de la seule mémoire de l'agent à chaque
// simulation (2026-09-21, demande explicite de l'utilisateur pendant une passe d'allègement de
// CLAUDE.md : « je parle d'un script au statut membre de l'équipe » — jamais l'outil `Agent`, dont
// le coût fixe ~37 000 tokens par appel, documenté dans docs/referentiel/smart-conso-token.md, est
// sans commune mesure avec un script). Même doctrine que LE-COORDINATEUR (§7ter de
// docs/regles-de-travail.md) : jamais de raisonnement à sa charge, seulement l'exécution de ce qui
// n'a besoin d'aucune lecture humaine/agent pour être fait correctement.
//
// Frontière stricte, trouvée en vérifiant le contenu réel avant de coder (Article 19) : les DEUX
// index de jugement du protocole — `docs/simulations/index.md` (colonne "Notes", root-cause, liens
// vers d'autres tours) et `docs/referentiel/kpi-index.md` (« mis à jour par l'agent après chaque
// rapport, jamais généré automatiquement par le script : comparer deux runs et en tirer ce qui
// compte est un travail de lecture, pas un calcul ») — sont donc HORS du périmètre de cet outil,
// même si techniquement une ligne pourrait y être écrite mécaniquement. LE-RÉGISSEUR archive les
// fichiers et les rapports bruts ; c'est toujours l'agent qui rédige la ligne de jugement dans ces
// deux index, jamais ce script à sa place.

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { sh } from "./lib-shell.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
export const SIMULATIONS_DIR = join(ROOT, "docs/simulations");
export const KPI_RAPPORTS_DIR = join(ROOT, "docs/referentiel/kpi-rapports");

const defaultFs = { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync };

// Étape 3bis (archivage transcript + dossier) — copie pure, zéro jugement. `transcriptPath`/
// `dossierPath` sont les fichiers déjà produits par le script de simulation (le dossier est
// optionnel : certaines simulations n'atteignent jamais la phase 2, cf. `docs/simulations/index.md`
// full_sim6/full_sim16). Toujours vers le nommage plat déjà établi (`<sim>_transcript.txt`,
// `<sim>_dossier.txt`) — jamais un sous-dossier par simulation, qui casserait la convention réelle
// déjà utilisée par les 16 simulations archivées à ce jour.
export function archiveSimulationFiles({ simName, transcriptPath, dossierPath }, fsImpl = defaultFs) {
  if (!simName || !transcriptPath) throw new Error("archiveSimulationFiles: simName et transcriptPath sont obligatoires — rien à archiver sans un nom et un transcript réel.");
  if (!fsImpl.existsSync(SIMULATIONS_DIR)) fsImpl.mkdirSync(SIMULATIONS_DIR, { recursive: true });
  const written = [];
  const transcriptDest = join(SIMULATIONS_DIR, `${simName}_transcript.txt`);
  fsImpl.copyFileSync(transcriptPath, transcriptDest);
  written.push(transcriptDest);
  if (dossierPath) {
    const dossierDest = join(SIMULATIONS_DIR, `${simName}_dossier.txt`);
    fsImpl.copyFileSync(dossierPath, dossierDest);
    written.push(dossierDest);
  }
  return { written };
}

// Étape 3bis (résumé compact du journal JSON, avant de le laisser disparaître) — réutilise
// directement `summarize-simulation-log.mjs` déjà écrit et déjà testé, jamais une seconde logique
// de résumé réinventée ici (règle de mutualisation §7ter).
export function summarizeAndArchiveJournal(simName, journalPath, fsImpl = defaultFs, shImpl = sh) {
  const output = shImpl(`node scripts/summarize-simulation-log.mjs "${journalPath}"`, { cwd: ROOT });
  if (!fsImpl.existsSync(SIMULATIONS_DIR)) fsImpl.mkdirSync(SIMULATIONS_DIR, { recursive: true });
  const dest = join(SIMULATIONS_DIR, `${simName}_actions.txt`);
  fsImpl.writeFileSync(dest, output);
  return { path: dest, content: output };
}

// Étape 4 (rapport KPI) — extrait la section "SYNTHÈSE COMPACTE" que `kpi-report.mjs` imprime déjà
// lui-même (`section('SYNTHÈSE COMPACTE (...)'), cf. son propre code), plutôt que de reformuler ce
// tableau une seconde fois ici. `section()` (kpi-report.mjs) préfixe toujours un titre par
// `\n== ${titre} ==` — la même convention sert de borne de fin (le prochain `== `, ou la fin du
// texte s'il n'y en a pas).
export function extractSyntheseCompacte(kpiOutput) {
  const text = String(kpiOutput ?? "");
  const startMatch = text.match(/== SYNTHÈSE COMPACTE[^\n]*==\n/);
  if (!startMatch) return undefined;
  const start = startMatch.index + startMatch[0].length;
  const rest = text.slice(start);
  const nextSectionIdx = rest.indexOf("\n== ");
  return (nextSectionIdx === -1 ? rest : rest.slice(0, nextSectionIdx)).trim();
}

export function runAndArchiveKpiReport(runLabel, fsImpl = defaultFs, shImpl = sh) {
  if (!runLabel) throw new Error("runAndArchiveKpiReport: runLabel obligatoire — cf. docs/referentiel/kpi-index.md pour la convention de nommage.");
  const output = shImpl(`node scripts/kpi-report.mjs ${runLabel}`, { cwd: ROOT });
  if (!fsImpl.existsSync(KPI_RAPPORTS_DIR)) fsImpl.mkdirSync(KPI_RAPPORTS_DIR, { recursive: true });
  const dest = join(KPI_RAPPORTS_DIR, `${runLabel}.txt`);
  fsImpl.writeFileSync(dest, output);
  return { path: dest, fullOutput: output, syntheseCompacte: extractSyntheseCompacte(output) };
}

// Pense-bêtes des étapes qui restent un vrai travail de jugement — jamais exécutées par ce script,
// seulement rappelées dans l'ordre exact du protocole (Article 18 de CLAUDE.md /
// docs/regles-de-travail.md pour le détail complet de chaque étape).
export function preSimulationChecklist() {
  return [
    "0. Consulter Smart Conso API (node scripts/smart-conso-api.mjs simulation --confirm) — un verdict \"seuil dur\" exige une validation explicite avant de continuer.",
    "1. Relancer un serveur de développement à jour, puis lancer le script de simulation intégrale contre lui.",
  ];
}

export function postSimulationChecklist() {
  return [
    "2. Donner régulièrement l'avancement réel à l'utilisateur pendant que la simulation tourne.",
    "3. Livrer le transcript intégral + le dossier retourné en fichier joint uniquement, jamais collé en clair.",
    "3bis. Archiver via archiveSimulationFiles()/summarizeAndArchiveJournal() (ce script) puis ajouter la ligne de jugement à docs/simulations/index.md — LE-RÉGISSEUR n'écrit jamais cette ligne lui-même.",
    "4. Archiver via runAndArchiveKpiReport() (ce script) puis livrer la SYNTHÈSE COMPACTE + docs/referentiel/kpi-historique.csv en pièce jointe ; ajouter la ligne de comparaison à docs/referentiel/kpi-index.md — même règle, jamais écrite automatiquement.",
    "4bis. Faire lire la simulation par EL-PROFESSOR (et THE-SCREENER si des captures existent) avant toute analyse.",
    "5. Analyse détaillée en partant du rapport EL-PROFESSOR, jamais une simple confirmation que « ça tourne ».",
    "6. Comparer avec la dernière simulation disponible (tendance EL-PROFESSOR, carnet correctifs-a-revalider.md).",
    "7. Poser au moins une dizaine de questions de calibrage avant toute correction.",
    "8. Organiser le correctif avec la même rigueur que le reste de la charte (tests, suite verte, documentation à jour).",
  ];
}

function main() {
  const cmd = process.argv[2];
  if (cmd === "checklist") {
    const which = process.argv[3];
    const list = which === "pre" ? preSimulationChecklist() : which === "post" ? postSimulationChecklist() : [...preSimulationChecklist(), ...postSimulationChecklist()];
    console.log(list.join("\n"));
    return;
  }
  if (cmd === "archive") {
    const [simName, journalPath, transcriptPath, dossierPath] = process.argv.slice(3);
    const files = archiveSimulationFiles({ simName, transcriptPath, dossierPath });
    const summary = journalPath ? summarizeAndArchiveJournal(simName, journalPath) : undefined;
    console.log("Archivé :", [...files.written, summary?.path].filter(Boolean).join(", "));
    console.log("\n⚠️ Reste à faire à la main (jamais automatisé) : ajouter la ligne de jugement à docs/simulations/index.md.");
    return;
  }
  if (cmd === "kpi") {
    const runLabel = process.argv[3];
    const result = runAndArchiveKpiReport(runLabel);
    console.log(result.syntheseCompacte ?? "(section SYNTHÈSE COMPACTE introuvable dans la sortie — vérifier kpi-report.mjs)");
    console.log(`\nRapport complet archivé : ${result.path}`);
    console.log("⚠️ Reste à faire à la main (jamais automatisé) : ajouter la ligne de comparaison à docs/referentiel/kpi-index.md.");
    return;
  }
  console.log("Usage : node scripts/le-regisseur.mjs checklist [pre|post] | archive <simName> <journalPath> <transcriptPath> [dossierPath] | kpi <runLabel>");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
