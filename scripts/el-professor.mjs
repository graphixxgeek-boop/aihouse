// ICEBERG: membre
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
import { printReliabilityNotice, lireLeDocumentGouvernant, ligneDocumentAbsent } from "./lib-shell.mjs";
import { buildPlanDaction, PLAN_ACTION_TITRE, imprimerPlanDaction } from "./report-template.mjs";

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

// UNE SIMULATION SANS TRANSCRIPT NE PEUT PAS ÊTRE NOTÉE, et le réclamer sans fin est une alarme
// qu'aucun travail ne peut éteindre (2026-09-29, tâche #1185 — leçons L6 et L41).
//
// LE CAS, ET C'EST LE SECOND DE SA CLASSE DANS LA MÊME NUIT. `full_sim` est signalée « archivée
// sans note » à chaque passage. Or l'index des simulations écrit, EN GRAS, juste à côté de sa
// ligne : « SON TRANSCRIPT EST PERDU, et il ne faut pas le chercher ». Noter une simulation, c'est
// lire son DIALOGUE et le confronter à l'Article 0 ; sans transcript il n'y a rien à lire. La
// demande était donc impossible à satisfaire, et son explication était écrite là où personne de
// mécanique ne la lisait. C'est exactement la leçon L41, écrite deux heures plus tôt pour un tout
// autre outil — ce qui montre que la classe est réelle et qu'elle se répète.
//
// LES DEUX CONDITIONS SONT EXIGÉES ENSEMBLE, et la seconde est ce qui distingue une décision d'un
// oubli : (1) aucun fichier de transcript sur le disque — un FAIT ; (2) la ligne de l'index DIT
// que la perte est connue — une DÉCISION. L'absence seule ferait taire une archive simplement pas
// encore faite, ce qui est le contraire du service rendu (leçon L5 : « on n'a pas trouvé » n'est
// jamais « il n'y a rien »).
//
// IL DÉGRADE, IL NE FAIT JAMAIS TAIRE : ces simulations sortent du décompte des notes manquantes
// et s'affichent dans une section à elles, avec leur raison. Une trouvaille qui disparaît est pire
// qu'une trouvaille de trop.
export const MOTIF_TRANSCRIPT_PERDU = /transcript\s+(?:est\s+)?perdu|transcript\s+jamais\s+archiv/i;
export const DOSSIER_SIMULATIONS = "docs/simulations";

export function ligneDeLaSimulation(markdown = "", id = "") {
  for (const ligne of String(markdown).split("\n")) {
    const m = ligne.match(/^\|\s*(full_sim\S*)/);
    if (m && m[1] === id) return ligne;
  }
  return null;
}

export function simulationsNonNotables(simIndexContent = "", { root = ROOT, listerImpl = null } = {}) {
  let fichiers = [];
  try { fichiers = (listerImpl ?? (() => readdirSync(join(root, DOSSIER_SIMULATIONS))))(); } catch { fichiers = []; }
  // AUCUN FICHIER LU N'EST JAMAIS « AUCUN TRANSCRIPT » (leçons L5/L11) : sans dossier lisible on ne
  // peut rien affirmer, donc on n'exempte personne et le décompte reste strict.
  if (!fichiers.length) return [];
  const out = [];
  for (const id of extractSimIds(simIndexContent)) {
    if (fichiers.some((f) => f.startsWith(`${id}_transcript.`))) continue;
    const ligne = ligneDeLaSimulation(simIndexContent, id);
    if (!ligne || !MOTIF_TRANSCRIPT_PERDU.test(ligne)) continue;
    out.push({ id, pourquoi: "aucun transcript sur le disque, et l'index déclare la perte : noter une simulation c'est lire son dialogue, et il n'y a rien à lire" });
  }
  return out;
}

export function findMissingNotes(simIndexContent, elProfessorIndexContent, options = {}) {
  const archived = extractSimIds(simIndexContent);
  const noted = new Set(extractSimIds(elProfessorIndexContent));
  const horsPortee = new Set(simulationsNonNotables(simIndexContent, options).map((s) => s.id));
  return archived.filter((id) => !noted.has(id) && !horsPortee.has(id));
}

// Symétrique de findMissingNotes : une note qui existe sans simulation archivée correspondante
// (faute de frappe dans un identifiant, entrée orpheline après un renommage) est un signal tout
// aussi réel qu'une simulation jamais notée — jamais ignoré silencieusement.
export function findOrphanNotes(simIndexContent, elProfessorIndexContent) {
  const archived = new Set(extractSimIds(simIndexContent));
  const noted = extractSimIds(elProfessorIndexContent);
  return noted.filter((id) => !archived.has(id));
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// DEPUIS QUAND L'ARTICLE 0 A-T-IL ÉTÉ RÉELLEMENT MESURÉ ? (2026-09-29, tâche #1187)
// ═══════════════════════════════════════════════════════════════════════════════════════════
//
// LE TROU, ET IL PORTE SUR LA LOI SUPRÊME DU PROJET. `check-spirit` est le SEUL outil qui touche la
// sortie RÉELLE du modèle : il envoie de vraies provocations et rend de vraies répliques, et c'est
// là-dessus que l'Article 0 se juge. Son registre note, passage par passage, ce que la lecture
// humaine a trouvé. **Personne ne le relisait.** data-archangel le signalait comme donnée fraîche
// sans lecteur ; le fait qu'il soit cité dans huit tables de registres ne fait lire son CONTENU à
// personne — être listé n'est pas être lu.
//
// CE QUE ÇA CACHAIT, et c'est le genre de silence qui coûte cher : le dernier passage enregistré
// (2026-09-28, second essai) a une couverture **NULLE — 0/20, toutes les provocations bloquées**,
// et conclut « PAS MESURÉ ». Autrement dit, la dernière chose que le projet sait de sa loi suprême
// est qu'il n'a rien pu en savoir. Ce fait n'était écrit nulle part ailleurs que dans un tableau
// que rien n'ouvrait.
//
// POURQUOI CHEZ EL-PROFESSOR plutôt que dans un script neuf (Article 31, obligation 2) : c'est déjà
// l'outil de la fidélité à la charte — il répond « cette simulation a-t-elle été notée ». La
// question d'ici est la même prise par l'autre bout : « le ton a-t-il été mesuré récemment, et la
// mesure a-t-elle abouti ». tool-brain l'a d'ailleurs désigné en premier sur cette demande.
//
// AUCUN SEUIL N'EST INVENTÉ (BP5) : l'âge est RAPPORTÉ, jamais jugé — combien de jours sont « trop »
// dépend d'un rythme de travail que rien ici ne connaît. Le seul signal rendu est un FAIT : le
// dernier passage a-t-il mesuré quelque chose, oui ou non.
export const REGISTRE_ESPRIT = "docs/check-spirit/index.md";

// Une couverture qui ne mesure rien se reconnaît à sa forme, jamais à une liste de libellés :
// « NULLE », ou un numérateur à zéro (`0/20`). Un verdict « PAS MESURÉ » dans la colonne voisine
// compte aussi — c'est le mot que l'outil imprime lui-même quand il refuse de conclure.
export const MOTIF_COUVERTURE_NULLE = /\bNULLE\b|(?:^|[^0-9])0\s*\/\s*\d+/;
export const MOTIF_REFUS_DE_CONCLURE = /PAS\s+MESUR[ÉE]/i;

export function passagesDeLEsprit(markdown = "") {
  const out = [];
  for (const ligne of String(markdown).split("\n")) {
    const m = ligne.match(/^\|\s*(\d{4}-\d{2}-\d{2})([^|]*)\|([^|]*)\|([^|]*)\|/);
    if (!m) continue;
    const couverture = m[3].trim();
    const trouve = m[4].trim();
    out.push({
      date: m[1],
      libelle: (m[1] + m[2]).trim(),
      couverture,
      // A MESURÉ ou N'A RIEN MESURÉ : les deux se lisent à l'opposé et les confondre est exactement
      // le défaut que check-spirit a lui-même corrigé le 2026-09-25 en cessant d'afficher « aucun
      // marqueur grossier détecté » sur zéro donnée — un satisfecit rendu sur rien, sur la loi
      // suprême du projet.
      aMesure: !(MOTIF_COUVERTURE_NULLE.test(couverture) || MOTIF_REFUS_DE_CONCLURE.test(trouve)),
      trouve,
    });
  }
  return out;
}

export function fraicheurDeLEsprit({ root = ROOT, lireImpl = null, maintenant = new Date() } = {}) {
  let texte = null;
  try { texte = (lireImpl ?? ((c) => readFileSync(join(root, c), "utf8")))(REGISTRE_ESPRIT); } catch { texte = null; }
  if (texte === null) {
    return { mesurable: false, pourquoi: `${REGISTRE_ESPRIT} illisible : on ne sait pas depuis quand le ton a été mesuré, ce qui n'est PAS la même chose que « il l'a été récemment » (leçons L5/L11)` };
  }
  const passages = passagesDeLEsprit(texte);
  if (!passages.length) {
    return { mesurable: false, passages: [], pourquoi: "aucun passage enregistré au registre de check-spirit : rien à dater, et ce zéro dit qu'on ne sait pas, jamais que tout va bien" };
  }
  const trie = [...passages].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const dernier = trie[0];
  const derniereMesure = trie.find((p) => p.aMesure) ?? null;
  const jours = (d) => Math.floor((maintenant.getTime() - Date.parse(`${d}T00:00:00Z`)) / 86400000);
  return {
    mesurable: true,
    passages: trie.length,
    dernierPassage: dernier,
    derniereMesure,
    joursDepuisLaDerniereMesure: derniereMesure ? jours(derniereMesure.date) : null,
    joursDepuisLeDernierPassage: jours(dernier.date),
    // LE SEUL SIGNAL RENDU EST UN FAIT, jamais un jugement sur l'âge (BP5) : le dernier passage
    // a-t-il mesuré quelque chose ? Si non, la dernière chose que le projet sait de sa loi suprême
    // est qu'il n'a rien pu en savoir — et ça, ça se dit.
    dernierPassageAVide: !dernier.aMesure,
    horsPortee: "il date des passages et lit leur COUVERTURE, jamais ce que le ton valait : la lecture des répliques reste humaine, et le registre dit lui-même que les heuristiques ne détectent que le vocabulaire de service client.",
  };
}

export function formatFraicheurDeLEspritLines(f) {
  if (!f?.mesurable) return ["", `🚨 FRAÎCHEUR DE L'ARTICLE 0 : PAS MESURÉ — ${f?.pourquoi ?? "aucune donnée"}`];
  const L = ["", "=== DEPUIS QUAND LE TON A-T-IL ÉTÉ RÉELLEMENT MESURÉ ? (Article 0) ==="];
  if (f.derniereMesure) {
    L.push(`  Dernière mesure RÉELLE : ${f.derniereMesure.libelle} — il y a ${f.joursDepuisLaDerniereMesure} jour(s). Couverture : ${f.derniereMesure.couverture}`);
  } else {
    L.push(`  🚨 AUCUN passage n'a jamais rien mesuré sur les ${f.passages} enregistré(s) : la loi suprême du projet n'a pas de mesure aboutie à son registre.`);
  }
  if (f.dernierPassageAVide) {
    L.push(`  🚨 LE DERNIER PASSAGE (${f.dernierPassage.libelle}, il y a ${f.joursDepuisLeDernierPassage} j) N'A RIEN MESURÉ — couverture « ${f.dernierPassage.couverture} ».`);
    L.push("     La dernière chose que le projet sait de sa loi suprême est donc qu'il n'a rien pu en savoir. Un passage bloqué n'est pas un passage propre.");
  } else {
    L.push(`  ✅ Le dernier passage (${f.dernierPassage.libelle}) a bien mesuré quelque chose.`);
  }
  L.push(`  ${f.passages} passage(s) au registre. L'ÂGE EST RAPPORTÉ, JAMAIS JUGÉ : combien de jours sont « trop » dépend d'un rythme que cet outil ne connaît pas (BP5).`);
  L.push(`  HORS PORTÉE : ${f.horsPortee}`);
  return L;
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
  // (2026-09-27, tâche #1034) — deux registres, deux absences possibles, un seul geste.
  const docs = [["docs/simulations/index.md", "l'index des simulations archivées"], ["docs/el-professor/index.md", "son propre registre de notes"]]
    .map(([chemin, role]) => ({ role, ...lireLeDocumentGouvernant(chemin, { root: ROOT }) }));
  const manquant = docs.find((d) => !d.trouve);
  if (manquant) {
    for (const l of ligneDocumentAbsent(manquant, { outil: "EL-PROFESSOR", aQuoiCaSert: `il y lit ${manquant.role}` })) console.log(l);
    return;
  }
  const [simIndex, elProfessorIndex] = docs.map((d) => d.texte);
  const missing = findMissingNotes(simIndex, elProfessorIndex);
  const orphans = findOrphanNotes(simIndex, elProfessorIndex);
  const nonNotables = simulationsNonNotables(simIndex);

  console.log("=== EL-PROFESSOR — partie mécanique (couverture des notes) ===\n");
  if (!missing.length) {
    console.log("Toutes les simulations archivées ont une note EL-PROFESSOR à jour.");
  } else {
    console.log(`${missing.length} simulation(s) archivée(s) sans note EL-PROFESSOR :`);
    for (const id of missing) console.log(`  - ${id}`);
    console.log("\nÀ noter avant de considérer la couverture complète (cf. docs/referentiel/el-professor.md).");
  }
  if (nonNotables.length) {
    console.log(`\n${nonNotables.length} simulation(s) HORS DE PORTÉE de la notation, écartée(s) du décompte ci-dessus avec leur raison :`);
    for (const s of nonNotables) console.log(`  - ${s.id} — ${s.pourquoi}`);
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
  // LA FRAÎCHEUR DE L'ARTICLE 0 (2026-09-29, tâche #1187), imprimée avant le plan pour que le
  // lecteur ait le fait sous les yeux quand il lit le constat qui en découle.
  const fraicheur = fraicheurDeLEsprit();
  for (const l of formatFraicheurDeLEspritLines(fraicheur)) console.log(l);
  // UN SEUL CONSTAT, ET C'EST UN FAIT, jamais un jugement sur l'âge (BP5) : le dernier passage du
  // seul outil qui touche la sortie RÉELLE du modèle n'a rien mesuré. Un passage bloqué n'est pas
  // un passage propre, et la confusion des deux est exactement ce que check-spirit a corrigé chez
  // lui le 2026-09-25 — la refaire ici, dans l'outil qui le relit, serait difficile à défendre.
  if (fraicheur.mesurable && fraicheur.dernierPassageAVide) {
    constatsProf.push({
      constat: `le dernier passage de check-spirit (${fraicheur.dernierPassage.libelle}) n'a RIEN mesuré — couverture « ${fraicheur.dernierPassage.couverture} » : la dernière chose que le projet sait de sa loi suprême est qu'il n'a rien pu en savoir`,
      etat: "retenu", toucheLeJeu: true,
      tache: "relancer check-spirit quand le quota le permet (Smart Conso API d'abord, Article 22), et inscrire le passage au registre — ou écrire pourquoi le ton n'a pas à être remesuré maintenant",
    });
  }
  if (!fraicheur.mesurable) {
    constatsProf.push({
      constat: `la fraîcheur de l'Article 0 n'a pas pu être lue : ${fraicheur.pourquoi}`,
      etat: "retenu",
      tache: "rendre lisible le registre de check-spirit, ou déclarer que cette mesure n'est plus tenue",
    });
  }
  const planProf = buildPlanDaction(constatsProf, { toolSlug: "el-professor" });
  imprimerPlanDaction(planProf);
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
