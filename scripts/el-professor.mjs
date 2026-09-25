// EL-PROFESSOR — partie mécanique et gratuite (2026-09-19, cf. docs/el-professor-blueprint.md et
// docs/referentiel/el-professor.md). La notation elle-même (une vraie lecture qualitative contre
// la charte) ne peut pas être mécanisée — ce script ne fait qu'une chose, zéro appel réseau,
// zéro coût : comparer la liste des simulations archivées (docs/simulations/index.md) à celles
// qui ont déjà reçu une note (docs/el-professor/index.md), et signaler toute simulation archivée
// sans note — jamais une omission silencieuse (même logique que la partie mécanique d'ARGUS).

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { renderHtmlReport } from "./html-report.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { buildPlanDaction, PLAN_ACTION_TITRE } from "./report-template.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
// Copie de présentation jetable, jamais committée (même patron que KPI_HTML_PATH de
// kpi-report.mjs) — le registre `docs/el-professor/index.md` reste la seule version de travail.
export const EL_PROFESSOR_HTML_PATH = ".el-professor-coverage-latest.html";

// Extrait les identifiants de simulation (première colonne d'un tableau markdown, ex.
// "full_sim (sim1)" → "full_sim", "full_sim9" → "full_sim9") depuis un registre au format
// docs/simulations/index.md ou docs/el-professor/index.md — les deux partagent la même colonne
// d'identifiant en première position. Toujours le texte brut (jamais un lien markdown) dans cette
// colonne pour que la regex reste fiable — le lien vers le rapport détaillé va dans une colonne
// séparée (cf. docs/el-professor/index.md).
export function extractSimIds(markdown) {
  const ids = [];
  for (const line of markdown.split("\n")) {
    const m = line.match(/^\|\s*(full_sim\S*)/);
    if (m) ids.push(m[1]);
  }
  return [...new Set(ids)];
}

export function findMissingNotes(simIndexContent, elProfessorIndexContent) {
  const archived = extractSimIds(simIndexContent);
  const noted = new Set(extractSimIds(elProfessorIndexContent));
  return archived.filter((id) => !noted.has(id));
}

// Symétrique de findMissingNotes : une note qui existe sans simulation archivée correspondante
// (faute de frappe dans un identifiant, entrée orpheline après un renommage) est un signal tout
// aussi réel qu'une simulation jamais notée — jamais ignoré silencieusement.
export function findOrphanNotes(simIndexContent, elProfessorIndexContent) {
  const archived = new Set(extractSimIds(simIndexContent));
  const noted = extractSimIds(elProfessorIndexContent);
  return noted.filter((id) => !archived.has(id));
}

// Rapport HTML (2026-09-20, tâche #144 — checkHtmlWiring() signalait cet outil comme jamais câblé
// malgré la règle « tous les rapports en HTML », cf. docs/regles-de-travail.md) : reprend la MÊME
// donnée déjà calculée par main() (missing/orphans), jamais un second calcul.
export function buildElProfessorCoverageHtml(missing, orphans) {
  const blocks = [];
  blocks.push(
    missing.length
      ? { type: "note", text: `${missing.length} simulation(s) archivée(s) sans note EL-PROFESSOR — à noter avant de considérer la couverture complète.` }
      : { type: "paragraph", text: "Toutes les simulations archivées ont une note EL-PROFESSOR à jour." },
  );
  if (missing.length) blocks.push({ type: "list", items: missing });
  if (orphans.length) {
    blocks.push({ type: "note", text: `${orphans.length} note(s) EL-PROFESSOR sans simulation archivée correspondante (identifiant orphelin).` });
    blocks.push({ type: "list", items: orphans });
  }
  return renderHtmlReport({
    title: "EL-PROFESSOR — couverture des notes",
    subtitle: "Partie mécanique et gratuite : compare docs/simulations/index.md à docs/el-professor/index.md, cf. docs/referentiel/el-professor.md.",
    dateLabel: new Date().toISOString(),
    blocks,
    footer: "EL-PROFESSOR — la notation qualitative elle-même reste une vraie lecture, jamais un calcul mécanique.",
  });
}

function main() {
  printReliabilityNotice("el-professor");
  recordCliUsage("el-professor");
  const simIndex = readFileSync(join(ROOT, "docs/simulations/index.md"), "utf8");
  const elProfessorIndex = readFileSync(join(ROOT, "docs/el-professor/index.md"), "utf8");
  const missing = findMissingNotes(simIndex, elProfessorIndex);
  const orphans = findOrphanNotes(simIndex, elProfessorIndex);

  console.log("=== EL-PROFESSOR — partie mécanique (couverture des notes) ===\n");
  if (!missing.length) {
    console.log("Toutes les simulations archivées ont une note EL-PROFESSOR à jour.");
  } else {
    console.log(`${missing.length} simulation(s) archivée(s) sans note EL-PROFESSOR :`);
    for (const id of missing) console.log(`  - ${id}`);
    console.log("\nÀ noter avant de considérer la couverture complète (cf. docs/referentiel/el-professor.md).");
  }
  if (orphans.length) {
    console.log(`\n${orphans.length} note(s) EL-PROFESSOR sans simulation archivée correspondante (identifiant orphelin) :`);
    for (const id of orphans) console.log(`  - ${id}`);
  }
  writeFileSync(join(ROOT, EL_PROFESSOR_HTML_PATH), buildElProfessorCoverageHtml(missing, orphans));
  console.log(`\nCopie HTML : ${EL_PROFESSOR_HTML_PATH}`);

  // LE PLAN D'ACTION (2026-09-23, tâche #211). EL-PROFESSOR note la FIDÉLITÉ À L'ESPRIT des
  // personnages — l'Article 0, la loi suprême du projet. Ses deux constats sont symétriques et
  // n'ont pourtant pas la même gravité du tout.
  //
  // Une simulation SANS NOTE est un trou dans la surveillance de l'Article 0 : une session entière
  // a été jouée et personne n'a vérifié que Lia et Noé y sonnaient juste. C'est ce que cet outil
  // existe pour empêcher, donc RETENU sans discussion.
  //
  // Une note ORPHELINE (une note dont la simulation a disparu de l'index) est une incohérence de
  // registre, pas un risque pour l'esprit. Retenue aussi, mais elle ne raconte pas la même histoire.
  const constatsProf = [
    ...missing.map((sim) => ({ constat: `simulation « ${sim} » jamais notée : personne n'a vérifié la fidélité à l'esprit sur cette session`, etat: "retenu", toucheLeJeu: true,
      tache: `noter ${sim} avec EL-PROFESSOR, ou écrire pourquoi cette session n'a pas à l'être` })),
    ...orphans.map((note) => ({ constat: `note « ${note} » sans simulation correspondante dans l'index`, etat: "retenu",
      tache: `retrouver la simulation de ${note} et la réinscrire à l'index, ou retirer la note devenue sans objet` })),
  ];
  const planProf = buildPlanDaction(constatsProf, { toolSlug: "el-professor" });
  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of planProf.lignes) console.log(l);
}

// ============================================================================================
// LES MOTIFS DE DÉPLACEMENT, MESURÉS SUR CE QUI A ÉTÉ AFFICHÉ (2026-09-25, tâches #642/#225)
// ============================================================================================
// POURQUOI ICI : EL-PROFESSOR juge une partie RÉELLEMENT JOUÉE, et ce défaut-ci n'existe que dans
// ce qui s'affiche — le code pris isolément est correct des deux côtés de la couture.
//
// LE DÉFAUT EST UN DÉFAUT D'ARTICLE 15 PAR EXCELLENCE : visible par le visiteur à chaque quatrième
// déplacement, invisible à l'agent qui code. Il traînait depuis dix-neuf simulations sans qu'aucun
// outil du paysage ne l'ait jamais nommé, et c'est THE-FINAL-JUDGE qui l'a trouvé.
//
// LA COUTURE EXACTE, et elle explique les trois défauts d'un coup : le gabarit de `departureLine()`
// (lib/drama.ts) attend un FRAGMENT en minuscules sans point final — « je veux voir ce qu'il y a
// par là » — pour écrire « Je bouge au bureau : <fragment>. ». Le modèle, lui, rend une PHRASE
// COMPLÈTE capitalisée et ponctuée. Trois conséquences mécaniques, jamais trois bugs séparés :
//   1. DOUBLE POINT   — le gabarit ajoute « . » à un motif qui en a déjà un : « ...la cuisine.. »
//   2. MAJUSCULE      — une capitale au milieu de la phrase, juste après « : »
//   3. PIÈCE EN DOUBLE — le motif renomme la destination que le préfixe vient de nommer :
//                        « Je bouge dans la chambre : Je veux vérifier ce miroir dans la chambre. »
//
// CET OUTIL NE CORRIGE RIEN, et c'est délibéré : la correction changerait CE QUE LE VISITEUR VOIT,
// périmètre que l'utilisateur s'est réservé. Il MESURE, il chiffre, il cite — la décision reste
// la sienne.
export const LOCUTIONS_DE_PIECE = {
  salon: ["au salon", "dans le salon"],
  cuisine: ["en cuisine", "dans la cuisine"],
  chambre: ["dans la chambre", "à la chambre"],
  bureau: ["au bureau", "dans le bureau"],
  jardin: ["au jardin", "dans le jardin"],
  couloir: ["dans le couloir"],
};

export function defautsDuMotif(ligne, destination) {
  const t = String(ligne ?? "");
  const defauts = [];
  if (/\.\./.test(t)) defauts.push("double-point");
  const sep = t.indexOf(" : ");
  if (sep >= 0 && /^[A-ZÀ-Ý]/.test(t.slice(sep + 3))) defauts.push("majuscule-en-milieu-de-phrase");
  // ON COMPTE TOUTES LES LOCUTIONS DE LA PIÈCE ENSEMBLE, jamais chacune de son côté — corrigé au
  // premier vrai passage, sur la ligne même qui avait motivé la tâche : « Je bouge EN CUISINE : Je
  // vais voir ce qu'il y a DANS LA CUISINE.. » nomme bien la cuisine deux fois, avec deux tournures
  // différentes. Chercher la répétition d'UNE tournure la laissait passer, et une sonde qui
  // sous-déclare ressemble trait pour trait à une sortie plus propre qu'elle ne l'est.
  let mentions = 0;
  for (const loc of LOCUTIONS_DE_PIECE[destination] ?? []) {
    for (let i = t.indexOf(loc); i >= 0; i = t.indexOf(loc, i + 1)) mentions += 1;
  }
  if (mentions >= 2) defauts.push("piece-nommee-deux-fois");
  return defauts;
}

export function auditMotifsDeDeplacement(transcripts = [], { lire } = {}) {
  if (typeof lire !== "function") {
    return { mesurable: false, pourquoi: "aucun lecteur de fichier fourni — rendre « zéro défaut » sans avoir lu une ligne dirait exactement ce que dit une sortie parfaite, et c'est le contraire de la vérité" };
  }
  let lignes = 0, avecMotif = 0, lus = 0, touches = 0;
  const parDefaut = {}, exemples = [];
  for (const f of transcripts) {
    const src = lire(f);
    if (typeof src !== "string") continue;
    lus += 1;
    for (const m of src.matchAll(/\[([a-z]+)→([a-z]+)\]\s*([^<\n]{1,240})/g)) {
      lignes += 1;
      const destination = m[2], texte = m[3].trim();
      // Une ligne DÉPART À DEUX (« Je te suis. ») n'a pas de motif : la compter au dénominateur
      // ferait baisser le taux sans qu'aucun défaut ait été corrigé.
      if (!texte.includes(" : ") && !/\.\s+[A-ZÀ-Ý]/.test(texte)) continue;
      avecMotif += 1;
      const d = defautsDuMotif(texte, destination);
      for (const x of d) parDefaut[x] = (parDefaut[x] ?? 0) + 1;
      if (d.length) touches += 1;
      if (d.length && exemples.length < 8) exemples.push({ fichier: f, texte: texte.slice(0, 140), defauts: d });
    }
  }
  if (!lus) return { mesurable: false, pourquoi: "aucun transcript n'a pu être lu — même raison que ci-dessus, un dénominateur vide se lit comme une sortie propre" };
  // UNE SEULE TRAVERSÉE : la compter deux fois donnerait deux mesures faites à deux instants
  // différents dans le même rapport, exactement le genre d'incohérence silencieuse que ce paysage
  // existe pour débusquer ailleurs.
  return { mesurable: true, lus, lignes, avecMotif, touches,
    taux: avecMotif ? (100 * touches) / avecMotif : 0, parDefaut, exemples };
}

export function formatMotifsLines(a) {
  if (!a?.mesurable) return [`⚠️ NON MESURÉ — ${a?.pourquoi ?? "raison inconnue"}`];
  const L = [`${a.lus} transcript(s) lu(s) · ${a.lignes} ligne(s) de déplacement · ${a.avecMotif} portant un motif.`];
  L.push(`${a.touches} ligne(s) avec AU MOINS UN DÉFAUT — ${a.taux.toFixed(1)} % des motifs affichés.`);
  L.push("");
  for (const [d, n] of Object.entries(a.parDefaut).sort((x, y) => y[1] - x[1])) L.push(`   ${String(n).padStart(4)} × ${d}`);
  if (a.exemples.length) { L.push(""); L.push("Extraits réels, tels que le visiteur les a lus :"); for (const e of a.exemples) L.push(`   « ${e.texte} »  [${e.defauts.join(" + ")}]`); }
  L.push("");
  L.push("LA COUTURE : le gabarit de departureLine() (lib/drama.ts) attend un FRAGMENT en minuscules");
  L.push("sans point final ; le modèle rend une PHRASE COMPLÈTE capitalisée et ponctuée. Les trois");
  L.push("défauts ci-dessus sont la même cause vue sous trois angles, jamais trois bugs séparés.");
  L.push("HORS PORTÉE : cet outil MESURE, il ne corrige pas — la correction change CE QUE LE VISITEUR");
  L.push("VOIT, et ce périmètre appartient à l'utilisateur.");
  return L;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv[2] === "motifs") {
    const dossier = join(ROOT, "docs/simulations");
    let fichiers = [];
    try { fichiers = readdirSync(dossier).filter((f) => f.endsWith("_transcript.html")).sort(); } catch { fichiers = []; }
    const a = auditMotifsDeDeplacement(fichiers, { lire: (f) => { try { return readFileSync(join(dossier, f), "utf8"); } catch { return undefined; } } });
    console.log("\n=== LES MOTIFS DE DÉPLACEMENT, TELS QUE LE VISITEUR LES A LUS ===\n");
    for (const l of formatMotifsLines(a)) console.log(l);
  } else main();
}
