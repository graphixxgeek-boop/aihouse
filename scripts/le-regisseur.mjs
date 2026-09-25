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

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { sh, printReliabilityNotice } from "./lib-shell.mjs";
import { renderHtmlReport } from "./html-report.mjs";
import { recordCliUsage, recordToolContribution } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
export const SIMULATIONS_DIR = join(ROOT, "docs/simulations");
export const KPI_RAPPORTS_DIR = join(ROOT, "docs/referentiel/kpi-rapports");

const defaultFs = { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync };

// Étape 3bis (archivage transcript + dossier) — copie pure, zéro jugement. `transcriptPath`/
// `dossierPath` sont les fichiers déjà produits par le script de simulation (le dossier est
// optionnel : certaines simulations n'atteignent jamais la phase 2, cf. `docs/simulations/index.md`
// full_sim6/full_sim16). Toujours vers le nommage plat déjà établi (`<sim>_transcript.txt`,
// `<sim>_dossier.txt`) — jamais un sous-dossier par simulation, qui casserait la convention réelle
// déjà utilisée par les 16 simulations archivées à ce jour.
// Rendu HTML des transcripts (2026-09-22, demande explicite de l'utilisateur : « je souhaite que
// les transcripts soient livrés en html agréables à lire »). Ferme un trou déjà repéré par
// Doc-Report (« THE-DEEP-READER et les Simulations n'avaient jamais reçu leur câblage HTML pourtant
// acté », CLAUDE.md) : le type de bloc `dialogue` de html-report.mjs existe depuis le 2026-09-20,
// conçu explicitement "pour les simulations", mais n'avait jamais été câblé jusqu'ici. Réutilise ce
// type tel quel, jamais une seconde palette de rendu (règle anti-doublon, §7ter).
//
// Format du transcript texte (convention déjà utilisée par tous les scripts de simulation, jamais
// changée ici) : groupes de 4 lignes séparés par une ligne vide — acteur (avec un éventuel
// qualificatif "· pensée"/"· déplacement"/"· rêve"), icône de pièce, heure, contenu. Le qualificatif
// est extrait pour que `speaker` reste exactement "Lia"/"Noé" (nécessaire pour que la coloration par
// personnage de html-report.mjs s'applique), jamais perdu pour autant : reporté en préfixe du texte.
// DEUX FORMES RÉELLES, ET IL A FALLU UN TRANSCRIPT VIDE POUR S'EN APERCEVOIR (2026-09-23,
// tâche #590). Le commentaire ci-dessus décrivait « des groupes de 4 lignes : acteur, pièce, heure,
// contenu », et l'ancien code refusait tout groupe plus court. Or les scripts de simulation
// produisent depuis full_sim18 des groupes de TROIS lignes — acteur, pièce, contenu, sans heure.
// Résultat : chaque groupe était sauté, et le rendu HTML de full_sim18 comme de full_sim19 est un
// `<main></main>` parfaitement vide, feuille de style comprise.
//
// POURQUOI PERSONNE NE L'A VU PENDANT DEUX SIMULATIONS : le fichier EXISTE, et pèse presque 5 ko.
// Toute vérification qui teste sa présence le compte comme fait. Et le test de cette fonction
// fabriquait son propre transcript AU FORMAT QUE LA FONCTION ATTEND — un test qui invente son
// entrée ne peut pas voir un désaccord avec le vrai producteur (leçon L16).
//
// LA FORME SE DÉDUIT, elle ne se suppose plus : l'heure est reconnue à sa forme (`12:34`) et non à
// sa position. Un groupe sans heure garde sa pièce et son texte, un groupe avec heure les garde
// tous les deux. Les deux formats réels rendent donc, et un troisième qui arriverait sans heure
// rendrait aussi — au lieu de disparaître en silence.
const HEURE_SEULE = /^\d{1,2}:\d{2}$/;

export function parseTranscriptToDialogueBlocks(transcriptText) {
  const chunks = String(transcriptText ?? "").split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
  const blocks = [];
  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    if (lines.length < 3) continue;
    const [actorLine, roomLine, troisieme, ...suite] = lines;
    const avecHeure = HEURE_SEULE.test(troisieme.trim());
    const text = (avecHeure ? suite : [troisieme, ...suite]).join(" ").trim();
    if (!text) continue;
    const [speaker, qualifier] = actorLine.split("·").map((s) => s.trim());
    const prefix = qualifier ? `(${qualifier}) ` : "";
    const situation = avecHeure ? `${roomLine} · ${troisieme.trim()}` : roomLine;
    blocks.push({ type: "dialogue", speaker, text: `[${situation}] ${prefix}${text}` });
  }
  return blocks;
}

// Zoom 150% (2026-09-22) : généralisé depuis le 2026-09-22 à TOUS les rapports HTML directement
// dans THEME_CSS (html-report.mjs) — plus un traitement spécial ici, jamais deux mécanismes qui
// pourraient un jour diverger.
// findTranscriptsSteriles() (2026-09-23, tâche #590) — LE PORTEUR DE LA LEÇON L16, et une vraie
// fonction plutôt qu'une assertion perdue dans la suite de tests : une leçon dont le porteur n'a pas
// de nom ne peut pas être vérifiée comme existante.
//
// Il parcourt les transcripts RÉELLEMENT archivés et nomme ceux dont le parseur ne tire aucun bloc.
// C'est le contrôle que les cinq assertions existantes ne pouvaient pas faire : elles fabriquaient
// leur propre transcript au format attendu, pendant que les scripts de simulation en produisaient un
// autre. Deux moitiés cohérentes avec elles-mêmes, en désaccord l'une avec l'autre, et personne pour
// regarder l'espace entre les deux.
//
// Il grandit tout seul à chaque nouvelle simulation : aucune liste à tenir (Article 24).
export function findTranscriptsSteriles({ dossier = SIMULATIONS_DIR, fsImpl = defaultFs } = {}) {
  let fichiers;
  try { fichiers = fsImpl.readdirSync(dossier).filter((f) => f.endsWith("_transcript.txt")); } catch { return { mesure: "pas mesuré", raison: `${dossier} illisible — aucune conclusion, et surtout pas « tout va bien »` }; }
  const steriles = fichiers.filter((f) => parseTranscriptToDialogueBlocks(fsImpl.readFileSync(join(dossier, f), "utf8")).length === 0);
  return { mesure: "mesuré", examines: fichiers.length, steriles };
}

export function renderTranscriptHtml(transcriptText, { title = "Transcript de simulation", dateLabel = new Date().toISOString() } = {}) {
  return renderHtmlReport({ title, dateLabel, blocks: parseTranscriptToDialogueBlocks(transcriptText) });
}

// Le dossier retourné a une structure différente (prose continue en 3 sections, jamais un
// dialogue tour par tour) — un heading + un paragraphe par section "=== NOM ===", jamais le même
// gabarit `dialogue` qui n'aurait aucun sens ici.
export function parseDossierToBlocks(dossierText) {
  const parts = String(dossierText ?? "").split(/\n(?===+ )/).map((p) => p.trim()).filter(Boolean);
  const blocks = [];
  for (const part of parts) {
    const m = part.match(/^===\s*(.+?)\s*===\s*([\s\S]*)$/);
    if (!m) continue;
    blocks.push({ type: "heading", text: m[1] });
    const body = m[2].trim();
    if (body) blocks.push({ type: "paragraph", text: body });
  }
  return blocks;
}

export function renderDossierHtml(dossierText, { title = "Dossier retourné", dateLabel = new Date().toISOString() } = {}) {
  return renderHtmlReport({ title, dateLabel, blocks: parseDossierToBlocks(dossierText) });
}

// LE SECOND MOMENT OPPORTUN (2026-09-23) — l'archivage d'une simulation. Le premier est la Ronde
// (recordCircleItemReport), celui-ci est la simulation : archiver un transcript, c'est alimenter
// le registre docs/simulations/, donc nourrir les outils qui le relisent (HARMONIA vérifie
// qu'une règle documentée s'est vraiment produite en jeu, EL-PROFESSOR note la fidélité).
//
// Même raison qu'ailleurs, et elle est de l'Article 27 : le compteur a passé sa première journée
// à zéro parce que je comptais m'en souvenir. Le geste s'enregistre donc là où il a lieu.
export function archiveSimulationFiles({ simName, transcriptPath, dossierPath }, fsImpl = defaultFs) {
  if (!simName || !transcriptPath) throw new Error("archiveSimulationFiles: simName et transcriptPath sont obligatoires — rien à archiver sans un nom et un transcript réel.");
  if (!fsImpl.existsSync(SIMULATIONS_DIR)) fsImpl.mkdirSync(SIMULATIONS_DIR, { recursive: true });
  const written = [];
  const transcriptDest = join(SIMULATIONS_DIR, `${simName}_transcript.txt`);
  fsImpl.copyFileSync(transcriptPath, transcriptDest);
  written.push(transcriptDest);
  const transcriptHtmlDest = join(SIMULATIONS_DIR, `${simName}_transcript.html`);
  fsImpl.writeFileSync(transcriptHtmlDest, renderTranscriptHtml(fsImpl.readFileSync(transcriptPath, "utf8"), { title: `${simName} — transcript` }));
  written.push(transcriptHtmlDest);
  if (dossierPath) {
    const dossierDest = join(SIMULATIONS_DIR, `${simName}_dossier.txt`);
    fsImpl.copyFileSync(dossierPath, dossierDest);
    written.push(dossierDest);
    const dossierHtmlDest = join(SIMULATIONS_DIR, `${simName}_dossier.html`);
    fsImpl.writeFileSync(dossierHtmlDest, renderDossierHtml(fsImpl.readFileSync(dossierPath, "utf8"), { title: `${simName} — dossier retourné` }));
    written.push(dossierHtmlDest);
  }
  try { recordToolContribution("simulations", `docs/simulations/${simName}`, { nature: "registre", par: "simulation" }); } catch { /* best-effort, jamais bloquant */ }
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
  // L'AVERTISSEMENT DE MARGE, DIT ET PAS SEULEMENT DÉCLARÉ (2026-09-25, tâche #653 → #808) :
  // sa nature heuristique était écrite dans TOOL_RELIABILITY et aucun chemin de ce script ne la
  // prononçait — une protection écrite qui ne sort jamais, le fil rouge de ce projet.
  printReliabilityNotice("le-regisseur");
  recordCliUsage("simulations");
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
