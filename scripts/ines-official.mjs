// ICEBERG: membre
// INES-official (tâche #168, 2026-09-21) — la « secrétaire » qui aplatit le dépôt en un seul
// fichier consolidé, annoté avec les signaux déjà calculés ailleurs dans le réseau d'outils.
// MVP calibré explicitement avec l'utilisateur : APLATIR + ANNOTER, jamais une réécriture réelle du
// code (trop risqué, trop coûteux) — un instantané de lecture, jamais un outil de refactoring.
//
// Déclenchement PÉRIODIQUE via la Ronde CIRCLE-TASKS, jamais seulement sur demande (calibrage
// explicite : l'utilisateur a corrigé la première proposition de l'agent qui la voulait seulement
// à la demande). Le périmètre (code seul / code + documentation) est un CHOIX fait à CHAQUE édition
// — un paramètre runtime, jamais une décision figée une fois pour toutes.
//
// Économie de dépôt (même raisonnement déjà appliqué au journal JSON brut des simulations, jamais
// archivé lui-même — cf. docs/simulations/index.md) : le CORPS de l'édition (potentiellement
// plusieurs Mo, tout le code du projet) n'est jamais committé à chaque édition — seul le fichier de
// la DERNIÈRE édition par périmètre est gardé localement (`.ines-official-latest-<scope>.txt`,
// gitignored). Ce qui EST committé et versionné (demande explicite : « comme le catalogue
// LE-COORDINATEUR ») est la métadonnée légère de chaque édition (date, version, périmètre, nombre
// de fichiers, taille) dans `docs/ines-official/index.md` — jamais le corps lui-même répété à
// chaque édition.

import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import { lastTouchDays } from "./clean-dirty-old.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReportHeader } from "./report-template.mjs";
import { lireFichierPartage, sansAccents, walkDocsPaths } from "./lib-shell.mjs";

export const FLATTEN_SCOPES = ["code", "code_et_docs"];

// Listes blanches explicites (jamais une liste noire, qui grandirait indéfiniment sans jamais
// couvrir le prochain cas — même principe que le Corollaire de l'Article 17 de CLAUDE.md).
// SON REGISTRE — paramétrable depuis le 2026-09-27 (tâche #668), même raison que les trois autres :
// un chemin de CE projet écrit en dur empêche l'outil de partir, et la lecture se rend optionnelle
// plutôt que retirée.
export const INDEX_PATH = "docs/ines-official/index.md";

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".mjs", ".js"]);
const DOCS_EXTENSIONS = new Set([".md"]);
const CODE_ROOTS = ["lib", "app", "scripts", "components"];
const DOCS_ROOTS = ["docs"];

export function collectSourceFiles(scope, { readDirImpl = readdirSync, existsImpl = existsSync } = {}) {
  if (!FLATTEN_SCOPES.includes(scope)) throw new Error(`collectSourceFiles: périmètre inconnu "${scope}" — attendu l'un de ${FLATTEN_SCOPES.join(", ")}`);
  const extensions = scope === "code" ? CODE_EXTENSIONS : new Set([...CODE_EXTENSIONS, ...DOCS_EXTENSIONS]);
  const roots = scope === "code" ? CODE_ROOTS : [...CODE_ROOTS, ...DOCS_ROOTS];
  const files = [];
  const walk = (dir) => {
    if (!existsImpl(dir)) return;
    for (const entry of readDirImpl(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (extensions.has(extname(entry.name))) files.push(full.replace(/\\/g, "/"));
    }
  };
  for (const root of roots) walk(root);
  return files.sort();
}

// Annotation par fichier — jamais un second calcul de stagnation : réutilise lastTouchDays() de
// CLEAN-DIRTY-OLD (gratuit, déjà éprouvé). `coverageByFile` (optionnel) : une carte déjà calculée
// par un appel AXA-CHECK antérieur, JAMAIS relancée ici — un balayage complet de couverture à
// chaque édition serait disproportionné pour une simple annotation de lecture.
//
// Limite honnête, à ne jamais masquer : ARGUS et HARMONIA restent hors de portée de cette première
// version. Leurs trouvailles sont des scans en texte libre (docs/argus/*.txt, docs/harmonia/*.txt),
// jamais indexées par fichier source de façon fiable — un rattachement mécanique forcé aurait
// fabriqué un lien qui n'existe pas réellement, l'exact contraire de la discipline anti-fabrication
// de ce projet (cf. Article 5 des principes ARGUS : "jamais un verdict acquis").
export function annotateFile(relativeFilePath, { coverageByFile = {} } = {}) {
  const staleDays = lastTouchDays(relativeFilePath);
  const parts = [staleDays == null ? "jamais committé" : `dernière modification il y a ${Math.round(staleDays)} j`];
  const coverage = coverageByFile[relativeFilePath];
  if (typeof coverage === "number") parts.push(`couverture AXA-CHECK ${Math.round(coverage)}%`);
  return parts.join(" — ");
}

export function buildTableOfContents(files, annotations) {
  return files.map((f, i) => `${i + 1}. ${f} — ${annotations[f] ?? "annotation indisponible"}`);
}

// Rapport de synthèse (2026-09-21, demande explicite de l'utilisateur : « elle fait ses
// commentaires selon les données qu'elle a récoltées et donne des chiffres intéressants,
// pertinents sur le code »). STRICTEMENT DESCRIPTIF, jamais un jugement de qualité — un chiffre
// réel (répartition, ancienneté, taille), jamais un verdict "bon"/"mauvais" qui empiéterait sur le
// rôle déjà tenu par ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD. `kpiFromCassandra` : un CROCHET
// explicite pour la future section KPI que CASSANDRA-RH doit fournir une fois construite (décision
// #251 du suivi : CASSANDRA reprend tout le mandat KPI) — INES-official ne calcule JAMAIS ce chiffre
// elle-même, elle le REPREND, même discipline anti-duplication que Doc-Report/tool-usage.mjs.
// `null` tant que CASSANDRA-RH n'existe pas, jamais un chiffre fabriqué en attendant.
export function buildEditionSummary(files, { staleDaysByFile = {}, sizeByFile = {}, kpiFromCassandra = null } = {}) {
  const byExtension = {};
  for (const f of files) {
    const ext = extname(f) || "(sans extension)";
    byExtension[ext] = (byExtension[ext] ?? 0) + 1;
  }
  const staleValues = files.map((f) => staleDaysByFile[f]).filter((d) => typeof d === "number");
  const neverCommittedCount = files.length - staleValues.length;
  let oldestFile = null;
  for (const f of files) {
    const d = staleDaysByFile[f];
    if (typeof d === "number" && (!oldestFile || d > oldestFile.days)) oldestFile = { path: f, days: d };
  }
  const averageStaleDays = staleValues.length ? staleValues.reduce((a, b) => a + b, 0) / staleValues.length : undefined;
  const totalSizeBytes = files.reduce((sum, f) => sum + (sizeByFile[f] ?? 0), 0);
  return { fileCount: files.length, byExtension, neverCommittedCount, oldestFile, averageStaleDays, totalSizeBytes, kpiFromCassandra };
}

export function renderEditionSummary(summary) {
  const sizeLabel = summary.totalSizeBytes >= 1_000_000 ? `${(summary.totalSizeBytes / 1_000_000).toFixed(1)} Mo` : `${Math.round(summary.totalSizeBytes / 1000)} Ko`;
  const lines = [
    `${summary.fileCount} fichier(s), ${sizeLabel} au total.`,
    `Répartition par extension : ${Object.entries(summary.byExtension).map(([ext, n]) => `${ext} (${n})`).join(", ")}.`,
    summary.averageStaleDays == null
      ? "Aucune date de dernière modification connue pour ces fichiers."
      : `Ancienneté moyenne depuis la dernière modification : ${Math.round(summary.averageStaleDays)} j${summary.oldestFile ? ` — le plus ancien : ${summary.oldestFile.path} (${Math.round(summary.oldestFile.days)} j)` : ""}.`,
    summary.neverCommittedCount > 0 ? `${summary.neverCommittedCount} fichier(s) jamais committé(s) (hors historique git).` : null,
    summary.kpiFromCassandra == null
      ? "KPI du site (fournis par CASSANDRA-RH) : pas encore disponibles — CASSANDRA-RH n'est pas encore construite."
      : `KPI du site (repris de CASSANDRA-RH) : ${summary.kpiFromCassandra}`,
  ].filter(Boolean);
  return lines;
}

// Enrichissement confirmé "oui maintenant" #1 : table des matières en tête de l'édition.
// Enrichissement confirmé "oui maintenant" #2 : datage/versionnage explicite dans l'en-tête, même
// esprit que renderNamedCatalog() de LE-COORDINATEUR.
export function buildConsolidatedEdition({ scope, files, annotations, version, date, summary = null, readFileImpl = lireFichierPartage }) {
  if (!FLATTEN_SCOPES.includes(scope)) throw new Error(`buildConsolidatedEdition: périmètre inconnu "${scope}"`);
  const toc = buildTableOfContents(files, annotations);
  const header = [
    `# INES-official — édition v${version} (${date})`,
    `Périmètre : ${scope === "code" ? "code seul" : "code + documentation"} — ${files.length} fichier(s)`,
    "",
    "## Résumé",
    ...(summary ? renderEditionSummary(summary) : ["Résumé indisponible pour cette édition."]),
    "",
    "## Table des matières",
    ...toc,
    "",
    "---",
  ];
  const body = files.flatMap((f) => {
    let content;
    try {
      content = readFileImpl(f, "utf8");
    } catch {
      content = "(fichier illisible au moment de l'édition — ignoré)";
    }
    return ["", `## ${f}`, `_${annotations[f] ?? "annotation indisponible"}_`, "", "```", content, "```"];
  });
  return [...header, ...body].join("\n");
}

// Prochain numéro de version — lu depuis les métadonnées déjà enregistrées (jamais recalculé à
// l'aveugle), un compteur global tous périmètres confondus (une édition "code_et_docs" et une
// édition "code" partagent la même numérotation croissante, jamais deux séquences séparées qui
// confondraient la lecture chronologique).
export function nextEditionVersion(indexText) {
  const matches = [...String(indexText ?? "").matchAll(/\bv(\d+)\b/g)].map((m) => Number(m[1]));
  return matches.length ? Math.max(...matches) + 1 : 1;
}

export function buildIndexRow({ version, date, scope, fileCount, sizeBytes }) {
  const scopeLabel = scope === "code" ? "code seul" : "code + documentation";
  const sizeLabel = sizeBytes >= 1_000_000 ? `${(sizeBytes / 1_000_000).toFixed(1)} Mo` : `${Math.round(sizeBytes / 1000)} Ko`;
  return `| v${version} | ${date} | ${scopeLabel} | ${fileCount} | ${sizeLabel} |`;
}

const LATEST_PATH_BY_SCOPE = {
  code: ".ines-official-latest-code.txt",
  code_et_docs: ".ines-official-latest-code_et_docs.txt",
};

export function recordEdition(scope, { indexText, now = new Date(), writeFileImpl = writeFileSync, readFileImplForBody = readFileSync, kpiFromCassandra = null } = {}) {
  const files = collectSourceFiles(scope);
  const annotations = Object.fromEntries(files.map((f) => [f, annotateFile(f)]));
  const staleDaysByFile = Object.fromEntries(files.map((f) => [f, lastTouchDays(f)]));
  const sizeByFile = Object.fromEntries(files.map((f) => {
    try {
      return [f, Buffer.byteLength(readFileImplForBody(f, "utf8"), "utf8")];
    } catch {
      return [f, 0];
    }
  }));
  const summary = buildEditionSummary(files, { staleDaysByFile, sizeByFile, kpiFromCassandra });
  const version = nextEditionVersion(indexText);
  const date = now.toISOString().slice(0, 10);
  const body = buildConsolidatedEdition({ scope, files, annotations, version, date, summary, readFileImpl: readFileImplForBody });
  writeFileImpl(LATEST_PATH_BY_SCOPE[scope], body);
  const row = buildIndexRow({ version, date, scope, fileCount: files.length, sizeBytes: Buffer.byteLength(body, "utf8") });
  return { version, date, scope, fileCount: files.length, sizeBytes: Buffer.byteLength(body, "utf8"), row, latestPath: LATEST_PATH_BY_SCOPE[scope], summary };
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
// LE PACK DÉCOUVERTE (tâche #1533) — la LISTE des documents de découverte de l'Agence.
//
// POURQUOI C'EST INÈS QUI LE PORTE, et la question avait été explicitement posée (Q1 de
// `docs/livrables/le-pack-decouverte-point.md`) : elle aplatit déjà le dépôt en une édition
// consolidée, donc elle connaît la matière même du pack. Tranché par l'utilisateur le 2026-10-03
// (décision P86 : « Inès porte le PACK DÉCOUVERTE, et tiendra aussi le process TOTAL RECALL »).
//
// POURQUOI LES SUJETS NE SONT PAS RECOPIÉS ICI (Article 24, « un registre se LIT, il ne se
// recopie pas ») : la liste des dix sujets est SA liste, écrite de sa main dans sa COMMANDE
// IMPORTANTE. La recopier en dur dans ce script aurait créé un second porteur des mêmes données,
// qui aurait divergé au premier mot qu'il change (leçon L29). Elle est donc LUE dans son document
// à chaque passage, entre deux bornes de texte, et `findSourceDesSujetsIllisible()` refuse le
// silence si cette lecture cesse de fonctionner — une liste vide ressemblerait sinon à « aucun
// sujet », ce qui est exactement la confusion que la leçon L5 interdit.
//
// CE QUE L'OUTIL NE FAIT PAS, et c'est délibéré : il n'écrit pas les documents du pack. Il dit
// quels documents EXISTENT pour chacun de ses sujets, et surtout — c'est sa question à lui —
// pour quels sujets il n'existe RIEN. « Qu'est-ce qui manque et qui existe : mets-le dedans.
// Qu'est-ce qui manque et qui n'existe pas ? »
export const SOURCE_DES_SUJETS = "docs/grand-projet/00-sources/01-sa-demande/COMMANDE IMPORTANTE.md";
export const BORNE_DEBUT_SUJETS = "je pense aux sujets qui touchent";
export const BORNE_FIN_SUJETS = "Quel est le thème de cette liste";

// Mots que tout document du dépôt porterait : les garder ferait correspondre chaque sujet à tout,
// donc un rapport qui ne dit plus rien. Liste MANUELLE et assumée comme telle (Article 24, second
// cas d'exemption) — elle ne reflète aucun autre système, donc rien ne peut diverger d'elle.
export const MOTS_TROP_GENERAUX = new Set([
  "agence", "projet", "global", "globale", "globaux", "point", "points", "ayant", "trait", "donc",
  "avec", "uniquement", "autre", "autres", "tous", "toutes", "dans", "pour", "cette", "leur",
  "elle", "comme", "plus", "sont", "nous", "vous", "etre", "faire", "chaque", "entre", "sans",
]);
export const LONGUEUR_MIN_MOT_DE_SUJET = 4;
// LA COMPARAISON SE FAIT SUR LE RADICAL, et le premier passage a montré pourquoi : « fonctions »
// cherché tel quel ne retrouvait aucun document, alors que le dépôt en porte plusieurs dont le nom
// commence par « fonctionnement ». Un sujet déclaré à zéro pour cette seule raison est un faux
// manque, et un faux manque est pire qu'une absence de mesure (leçon L4 : un garde-fou qui accuse à
// tort cesse d'être lu). Huit caractères : assez pour distinguer deux sujets, assez court pour
// absorber un pluriel et une terminaison.
export const LONGUEUR_DU_RADICAL = 8;
export function radicalDuMot(mot = "", { longueur = LONGUEUR_DU_RADICAL } = {}) {
  return String(mot).slice(0, longueur);
}

// Un mot du libellé devient un mot-clé s'il est assez long et pas trop général. L'accent est retiré
// des deux côtés de la comparaison, sans quoi « stratégie » ne retrouverait jamais « strategie »
// dans un nom de fichier — tous les chemins du dépôt sont écrits sans accent.
export function motsDUnSujet(libelle = "", { trop = MOTS_TROP_GENERAUX, longueurMin = LONGUEUR_MIN_MOT_DE_SUJET } = {}) {
  const nu = sansAccents(String(libelle).toLowerCase());
  const bruts = nu.split(/[^a-z0-9]+/).filter(Boolean);
  const gardes = [];
  for (const mot of bruts) {
    if (mot.length < longueurMin) continue;
    if (trop.has(mot)) continue;
    if (!gardes.includes(mot)) gardes.push(mot);
  }
  return gardes;
}

// Les sujets sont les puces listées entre les deux bornes. Une ligne qui n'est pas une puce est
// ignorée : sa commande mêle des puces et des phrases de contexte, et prendre les deux aurait fait
// passer une phrase entière pour un sujet.
export function sujetsDeDecouverte(texte = "", { debut = BORNE_DEBUT_SUJETS, fin = BORNE_FIN_SUJETS } = {}) {
  const t = String(texte);
  const iDebut = t.indexOf(debut);
  if (iDebut === -1) return [];
  const apres = t.slice(iDebut + debut.length);
  const iFin = apres.indexOf(fin);
  const zone = iFin === -1 ? apres : apres.slice(0, iFin);
  const sujets = [];
  for (const ligne of zone.split("\n")) {
    const m = ligne.match(/^\s*[-*•]\s+(.+?)\s*$/);
    if (!m) continue;
    const libelle = m[1].replace(/\s*[,.;]\s*$/, "").trim();
    if (!libelle) continue;
    const mots = motsDUnSujet(libelle);
    if (!mots.length) continue;
    sujets.push({ libelle, mots });
  }
  return sujets;
}

// GARDE-FOU DE LA LECTURE (Article 24) : la liste est lue dans son document, donc tout ce qui peut
// casser cette lecture — fichier déplacé, borne réécrite, puces transformées en paragraphe — doit
// parler au lieu de rendre zéro sujet en silence.
export function findSourceDesSujetsIllisible({ root = ".", source = SOURCE_DES_SUJETS, existsImpl = existsSync, readFileImpl = readFileSync } = {}) {
  const chemin = join(root, source);
  if (!existsImpl(chemin)) {
    return [`PACK DÉCOUVERTE : sa liste de sujets est lue dans ${source}, qui n'existe plus. Soit le fichier a été déplacé — corriger SOURCE_DES_SUJETS —, soit la liste a disparu du dépôt.`];
  }
  const texte = readFileImpl(chemin, "utf8");
  if (!texte.includes(BORNE_DEBUT_SUJETS)) {
    return [`PACK DÉCOUVERTE : la borne de début ("${BORNE_DEBUT_SUJETS}") a disparu de ${source}. La liste des sujets n'est plus lisible, et sans ce signal elle rendrait zéro sujet sans rien dire.`];
  }
  const sujets = sujetsDeDecouverte(texte);
  if (!sujets.length) {
    return [`PACK DÉCOUVERTE : les bornes sont présentes dans ${source} mais aucune puce n'est reconnue entre elles. La liste des sujets est vide, ce qui n'est pas la même chose que « aucun sujet » (leçon L5).`];
  }
  return [];
}

// Un document répond à un sujet si son CHEMIN ou son TITRE porte un des mots du sujet. Volontairement
// pas le corps : à chercher dans le corps de 660 documents, « organisation » ressort partout et le
// classement ne distingue plus rien.
export const RACINES_DU_PACK = ["docs"];
// Le rapport du pack vit dans `docs/livrables/`, donc dans la zone qu'il balaie : sans cette
// exclusion il se comptait lui-même, et le nombre de documents montait d'un à chaque passage.
export const PREFIXE_DU_RAPPORT_PACK = "docs/livrables/pack-decouverte-liste-";
export function titreDUnDocument(texte = "") {
  const m = String(texte).match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "";
}

export function documentsParSujet({ root = ".", sujets = [], racines = RACINES_DU_PACK, listDirImpl = readdirSync, readFileImpl = readFileSync, existsImpl = existsSync } = {}) {
  const fichiers = [];
  for (const racine of racines) {
    const base = join(root, racine);
    if (!existsImpl(base)) continue;
    for (const rel of walkDocsPaths(base, root, new Set())) {
      if (!rel.endsWith(".md")) continue;
      if (rel.startsWith(PREFIXE_DU_RAPPORT_PACK)) continue;
      fichiers.push(rel);
    }
  }
  fichiers.sort();
  const parSujet = sujets.map((s) => ({ ...s, documents: [] }));
  for (const rel of fichiers) {
    let titre = "";
    try { titre = titreDUnDocument(readFileImpl(join(root, rel), "utf8")); } catch { titre = ""; }
    const foin = sansAccents(`${rel} ${titre}`.toLowerCase());
    for (const entree of parSujet) {
      const touches = entree.mots.filter((mot) => foin.includes(radicalDuMot(mot)));
      if (touches.length) entree.documents.push({ chemin: rel, titre, mots: touches });
    }
  }
  return { fichiers: fichiers.length, parSujet };
}

export function findSujetsSansDocument({ parSujet = [] } = {}) {
  return parSujet.filter((s) => !s.documents.length).map((s) => s.libelle);
}

export function lignesDuPackDecouverte({ sujets = [], fichiers = 0, date = "" } = {}) {
  const lignes = [];
  lignes.push("<!-- DOCUMENT GÉNÉRÉ — produit intégralement par un outil, aucune ligne n'est écrite à la main -->");
  lignes.push("# PACK DÉCOUVERTE — la liste des documents de découverte de l'Agence");
  lignes.push("");
  lignes.push(`> Produit par \`node scripts/ines-official.mjs pack\` le ${date}. **Aucune ligne n'est écrite à la main :**`);
  lignes.push(`> les sujets sont lus dans ta COMMANDE IMPORTANTE, les documents dans le dépôt réel (${fichiers} documents balayés).`);
  lignes.push("");
  const vides = findSujetsSansDocument({ parSujet: sujets });
  lignes.push("## Ce que la liste couvre, sujet par sujet");
  lignes.push("");
  lignes.push("| Ton sujet | Documents trouvés |");
  lignes.push("|---|---|");
  for (const s of sujets) lignes.push(`| ${s.libelle} | ${s.documents.length || "**aucun**"} |`);
  lignes.push("");
  if (vides.length) {
    lignes.push("## Ce qui manque et qui n'existe pas");
    lignes.push("");
    lignes.push("Ta question exacte. Ces sujets de ta liste n'ont AUCUN document dans le dépôt :");
    lignes.push("");
    for (const v of vides) lignes.push(`- **${v}**`);
    lignes.push("");
  } else {
    lignes.push("## Ce qui manque et qui n'existe pas");
    lignes.push("");
    lignes.push("Aucun de tes sujets n'est à zéro document.");
    lignes.push("");
  }
  lignes.push("## Le détail, sujet par sujet");
  lignes.push("");
  for (const s of sujets) {
    lignes.push(`### ${s.libelle}`);
    lignes.push("");
    if (!s.documents.length) { lignes.push("*Aucun document.*"); lignes.push(""); continue; }
    for (const d of s.documents) lignes.push(`- \`${d.chemin}\`${d.titre ? ` — ${d.titre}` : ""}`);
    lignes.push("");
  }
  lignes.push("<!-- /DOCUMENT GÉNÉRÉ -->");
  return lignes;
}

export function rapportDuPackDecouverte({ root = ".", date = "", readFileImpl = readFileSync, listDirImpl = readdirSync, existsImpl = existsSync } = {}) {
  const ecarts = findSourceDesSujetsIllisible({ root, existsImpl, readFileImpl });
  if (ecarts.length) return { ecarts, lignes: [], sujets: [], fichiers: 0 };
  const texte = readFileImpl(join(root, SOURCE_DES_SUJETS), "utf8");
  const bruts = sujetsDeDecouverte(texte);
  const { fichiers, parSujet } = documentsParSujet({ root, sujets: bruts, listDirImpl, readFileImpl, existsImpl });
  return { ecarts: [], sujets: parSujet, fichiers, lignes: lignesDuPackDecouverte({ sujets: parSujet, fichiers, date }) };
}

function main({ chemin = INDEX_PATH } = {}) {
  printReportHeader({ tool: "ines-official", title: "INES-official — édition consolidée du dépôt", scriptPath: "scripts/ines-official.mjs" });
  recordCliUsage("ines-official");
  if (process.argv[2] === "pack") return mainPack();
  const scope = process.argv[2] === "code_et_docs" ? "code_et_docs" : "code";
  const indexPath = chemin;
  const indexText = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : "";
  const result = recordEdition(scope, { indexText });
  console.log(`Édition v${result.version} (${result.date}, ${scope}) : ${result.fileCount} fichier(s), ${result.sizeBytes} octets.`);
  console.log(`Corps écrit dans ${result.latestPath} (local, jamais committé).`);
  // LE RÉSUMÉ, ENFIN IMPRIMÉ (2026-09-23). `buildEdition()` calculait déjà `summary` — nombre de
  // fichiers par extension, fichiers jamais committés, le plus ancien, ancienneté moyenne, KPI
  // repris de CASSANDRA — et rien ne l'affichait. Le rapport livré ne portait donc que deux
  // chiffres et un chemin, ce que l'utilisateur a relevé sur la Ronde du 2026-09-23 : « à chaque
  // fois je dois avoir un contenu intéressant non ? ».
  //
  // C'est le CINQUIÈME cas du même motif trouvé en une journée : une donnée calculée qui ne sort
  // jamais du script. Le corps de l'édition reste local (3,9 Mo, décision assumée), mais ce qui la
  // DÉCRIT n'a aucune raison de rester invisible.
  const s = result.summary ?? {};
  if (s.fileCount !== undefined) {
    console.log(`\nContenu de l'édition :`);
    for (const [ext, n] of Object.entries(s.byExtension ?? {}).sort((a, b) => b[1] - a[1])) console.log(`  ${ext.padEnd(8)} ${n} fichier(s)`);
    if (s.neverCommittedCount !== undefined) console.log(`  jamais committé(s) : ${s.neverCommittedCount}`);
    if (s.oldestFile) console.log(`  le plus ancien : ${s.oldestFile.path} (${Math.round(s.oldestFile.days)} j)`);  // objet {path, days} : l'imprimer brut rendait « [object Object] », le même défaut d'affichage que safe-export portait ce matin
    if (s.averageStaleDays !== undefined) console.log(`  ancienneté moyenne : ${Math.round(s.averageStaleDays)} jour(s)`);
    if (s.kpiFromCassandra) console.log(`  KPI repris de CASSANDRA-RH : ${JSON.stringify(s.kpiFromCassandra)}`);
  }
  console.log(`\nLigne d'index à ajouter à ${indexPath} :`);
  console.log(result.row);
}

function mainPack() {
  const date = process.argv[3] && /^\d{4}-\d{2}-\d{2}$/.test(process.argv[3]) ? process.argv[3] : new Date().toISOString().slice(0, 10);
  const r = rapportDuPackDecouverte({ root: ".", date });
  if (r.ecarts.length) {
    for (const e of r.ecarts) console.log(`🚨 ${e}`);
    process.exitCode = 1;
    return;
  }
  const sortie = `docs/livrables/pack-decouverte-liste-${date}.md`;
  writeFileSync(sortie, `${r.lignes.join("\n")}\n`, "utf8");
  console.log(`${r.sujets.length} sujet(s) lu(s) dans ${SOURCE_DES_SUJETS}, ${r.fichiers} document(s) balayé(s).`);
  for (const s of r.sujets) console.log(`  ${String(s.documents.length).padStart(3)} — ${s.libelle}`);
  const vides = findSujetsSansDocument({ parSujet: r.sujets });
  console.log(vides.length ? `\n🚨 ${vides.length} sujet(s) SANS aucun document : ${vides.join(" · ")}` : "\nAucun sujet à zéro document.");
  console.log(`\nÉcrit dans ${sortie}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
