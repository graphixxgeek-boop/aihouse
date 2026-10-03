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

// ————————————————————————————————————————————————————————————————————————
// TOTAL RECALL — ce que coûterait un rafraîchissement complet et forcé (tâche #1545)
// ————————————————————————————————————————————————————————————————————————
//
// LE CONTEXTE, DANS SES MOTS, et il est concret : « ce soir là tu as tout simplement perdu ta
// mémoire de session parce que j'ai fermé mon pc la veille au soir et que je l'ai rallumé le
// lendemain. Ça fait partie des irritants que l'agence doit corriger. »
//
// SA CONSIGNE DE CADRAGE : « lorsque je te presenterai le projet […] tu devras comparer avec le
// système existant pour voir comment "muscler" le système existant. ET me faire un rapport entre :
// ce qui existe aujourd'hui pour repondre à "ou on en est" et "operation total recall". »
//
// L'ÉLÉMENT CENTRAL QU'IL DEMANDE DE NOTER : TOTAL RECALL est « un rafraichissement complet de la
// memoire de l'IA de l'utilisateur, un rafraichissement forcé mecaniquement ». Et sa limite, dans
// ses mots aussi : « l'operation total recall est trop lourde pour repondre au perimetre unique de
// "ou on en est" : une couche plus legere est prevue ».
//
// CE QUE CET OUTIL AJOUTE, ET C'EST LA SEULE CHOSE QU'IL PEUT AJOURER AUJOURD'HUI : le CHIFFRE.
// La décision qu'il annonce — jusqu'où va le rafraîchissement — se prend sur un coût, et personne
// ne pouvait le donner. Il mesure donc, par système de mémoire, le volume réel et ce qu'il
// coûterait à relire, pour que « trop lourde » cesse d'être une impression.
//
// POURQUOI CHEZ INÈS : il a tranché (P86) qu'elle porte le PACK DÉCOUVERTE « et tiendra également
// le process TOTAL RECALL ». Elle aplatit déjà le dépôt et sait en mesurer le volume, donc c'est
// la même matière — un outil neuf aurait refait sa moitié de travail.

// LES CINQ SYSTÈMES DE MÉMOIRE, repris de `docs/livrables/les-cinq-systemes-de-memoire.md`
// (tâche #1546) plutôt que redéfinis ici. Liste MANUELLE et assumée (Article 24, second cas) : un
// dossier ne porte aucun signal disant « je suis une mémoire du projet », c'est une décision. Le
// garde-fou ci-dessous refuse qu'un chemin déclaré cesse d'exister en silence.
export const SYSTEMES_DE_MEMOIRE = [
  { cle: "suivi", quoi: "le suivi — ce qui a été fait, tâche par tâche, daté", dossiers: ["docs/suivi"] },
  { cle: "fils", quoi: "les fils — où en est chaque sujet, qui a la balle", dossiers: ["docs/fils"] },
  { cle: "strategies", quoi: "les stratégies — les analyses de fond, datées", dossiers: ["docs/strategies", "docs/grand-projet/02-strategie"] },
  { cle: "chantiers", quoi: "les notes de chantier — ce qui se passe sur un chantier précis", dossiers: ["docs/plans"] },
  { cle: "lois", quoi: "les textes qui font loi — la charte, la gouvernance, les règles de travail", dossiers: ["docs/referentiel"] },
];

export function findSystemesDeMemoireIntrouvables({ root = ".", systemes = SYSTEMES_DE_MEMOIRE, existsImpl = existsSync } = {}) {
  const ecarts = [];
  for (const s of systemes) {
    for (const d of s.dossiers) {
      if (!existsImpl(join(root, d))) ecarts.push(`le système de mémoire « ${s.cle} » déclare ${d}, qui n'existe pas : une mémoire déclarée et absente se lit comme une mémoire vide, ce qui n'est pas la même chose`);
    }
  }
  return ecarts;
}

// L'ESTIMATION EN TOKENS EST UNE ESTIMATION, ET ELLE LE DIT. Le diviseur 3,6 est celui que le
// projet emploie déjà partout ailleurs (mesurerUnites, Abraham) : en reprendre un second ici
// ferait diverger deux chiffres censés dire la même chose (leçon L29).
export const CARACTERES_PAR_TOKEN = 3.6;
export const SORTIE_TOTAL_RECALL = "docs/strategies/total-recall-strategie.md";
export const PARENT_TOTAL_RECALL = "docs/strategies/strategie-globale-du-projet-entier.md";

// `walkImpl` EST INJECTABLE, et l'oubli a coûté un passage de filet : `walkDocsPaths` appelle son
// PROPRE `existsSync` et son propre `readdirSync`, donc injecter `listDirImpl` et `existsImpl` ne
// suffisait pas — le parcours lisait le vrai disque et rendait zéro fichier sur une fixture, ce
// qui faisait rendre « PAS MESURÉ » là où le test attendait une mesure. Une dépendance qu'on croit
// injectée et qui ne l'est pas est le genre de faux montage qu'un test attrape une fois et qu'une
// relecture ne voit jamais.
export function mesurerLaMemoire({ root = ".", systemes = SYSTEMES_DE_MEMOIRE, walkImpl = null, readFileImpl = readFileSync, existsImpl = existsSync } = {}) {
  const parcourir = walkImpl ?? ((base) => walkDocsPaths(base, root, new Set()));
  const ecarts = findSystemesDeMemoireIntrouvables({ root, systemes, existsImpl });
  const lignes = [];
  for (const s of systemes) {
    let fichiers = 0;
    let octets = 0;
    let dernier = null;
    let recent = null;
    for (const d of s.dossiers) {
      const base = join(root, d);
      if (!existsImpl(base)) continue;
      for (const rel of parcourir(base, root)) {
        if (!rel.endsWith(".md")) continue;
        let texte = "";
        try { texte = readFileImpl(join(root, rel), "utf8"); } catch { continue; }
        if (rel === SORTIE_TOTAL_RECALL) continue;  // il vit dans docs/strategies/ : sans ça il se compte lui-même, et son poids monte à chaque passage
        fichiers += 1;
        const poids = Buffer.byteLength(texte, "utf8");
        octets += poids;
        // LA FRAÎCHEUR SE LIT DANS LE TEXTE, jamais sur l'horodatage du fichier : un `git clone`
        // réécrit toutes les dates de modification, donc un dépôt fraîchement cloné paraîtrait
        // tout neuf. La date la plus récente ÉCRITE dans le document est la seule qui survive au
        // transport — et c'est précisément le cas d'usage de TOTAL RECALL.
        let dateDuDoc = null;
        for (const m of texte.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)) {
          if (!dateDuDoc || m[1] > dateDuDoc) dateDuDoc = m[1];
        }
        // LE PLUS RÉCENT EST GARDÉ AVEC SON POIDS RÉEL : la première version approximait la
        // couche légère par le poids MOYEN d'un document, et la moyenne du suivi est faussée
        // par onze fichiers dont un seul pèse presque tout. Une approximation déclarée vaut
        // mieux qu'une approximation tue ; une mesure vraie vaut mieux que les deux.
        if (dateDuDoc && (!dernier || dateDuDoc > dernier || (dateDuDoc === dernier && poids > (recent?.octets ?? 0)))) {
          if (!dernier || dateDuDoc > dernier) { dernier = dateDuDoc; recent = { chemin: rel, octets: poids }; }
          else recent = { chemin: rel, octets: poids };
        }
      }
    }
    lignes.push({ ...s, fichiers, octets, tokens: Math.round(octets / CARACTERES_PAR_TOKEN), dernier, recent });
  }
  const total = lignes.reduce((a, l) => ({ fichiers: a.fichiers + l.fichiers, octets: a.octets + l.octets, tokens: a.tokens + l.tokens }), { fichiers: 0, octets: 0, tokens: 0 });
  if (!total.fichiers) return { mesurable: false, pourquoi: "aucun document lu dans les cinq systèmes de mémoire : rendre « la mémoire est légère » sur zéro fichier serait l'inverse d'une mesure (leçon L5)", ecarts };
  return { mesurable: true, ecarts, lignes, total };
}

// LA COUCHE LÉGÈRE, qu'il annonce lui-même à côté de TOTAL RECALL : ce qu'il faut VRAIMENT relire
// pour répondre à « où on en est », par opposition au rafraîchissement complet. Elle se DÉRIVE —
// le document le plus récent de chaque système, jamais tout le système — et c'est le seul choix
// défendable : relire la totalité du suivi pour savoir où on en est reviendrait à relire neuf mois
// de journal pour connaître la date du jour.
export function coucheLegere({ mesure = {} } = {}) {
  if (!mesure.mesurable) return { mesurable: false, pourquoi: mesure.pourquoi };
  // LE COÛT DU DOCUMENT RÉELLEMENT LE PLUS RÉCENT DE CHAQUE SYSTÈME, jamais une moyenne. La
  // première version moyennait, et la moyenne du suivi est faussée par onze fichiers dont un
  // pèse presque tout : elle annonçait un coût qu'aucune relecture réelle n'aurait payé.
  const lignes = mesure.lignes.map((l) => ({
    cle: l.cle, quoi: l.quoi,
    chemin: l.recent?.chemin ?? null,
    tokens: l.recent ? Math.round(l.recent.octets / CARACTERES_PAR_TOKEN) : 0,
  }));
  const sansRecent = lignes.filter((l) => !l.chemin).map((l) => l.cle);
  const tokens = lignes.reduce((a, l) => a + l.tokens, 0);
  // LE PLUS GROS DOCUMENT DE LA COUCHE LÉGÈRE EST RENDU À PART, parce que le premier passage a
  // montré qu'UN SEUL fichier décide du résultat : le fichier de session du suivi pèse à lui seul
  // plus que les quatre autres systèmes réunis. Noyé dans un total, ce fait disparaît ; sorti, il
  // devient le constat le plus actionnable du rapport.
  const trie = [...lignes].sort((a, b) => b.tokens - a.tokens);
  const plusGros = trie[0] ?? null;
  const sansLePlusGros = tokens - (plusGros?.tokens ?? 0);
  return {
    mesurable: true, lignes, tokens, sansRecent,
    part: mesure.total.tokens ? tokens / mesure.total.tokens : 0,
    plusGros, sansLePlusGros,
    partSansLePlusGros: mesure.total.tokens ? sansLePlusGros / mesure.total.tokens : 0,
  };
}

export function lignesDeTotalRecall({ mesure, legere, date = "" } = {}) {
  const L = [];
  L.push("<!-- DOCUMENT GÉNÉRÉ — produit intégralement par un outil, aucune ligne n'est écrite à la main -->");
  L.push("# TOTAL RECALL — le cadrage, et ce que l'opération coûterait vraiment");
  L.push("");
  L.push(`> Produit par \`node scripts/ines-official.mjs memoire\` le ${date}. Porté par **Inès**, sur ta décision (P86).`);
  L.push("");
  // LA DÉCLARATION DE CASCADE EST OBLIGATOIRE, et le filet l'a refusée sans elle : un document de
  // stratégie qui ne dit pas de quoi il découle est un ORPHELIN — il avance sans qu'on sache ce
  // qu'il sert, et se rediscute indéfiniment. Elle est ÉCRITE PAR LE GÉNÉRATEUR, jamais dans le
  // fichier, où elle sauterait à la régénération suivante (leçon payée le 2026-09-26).
  L.push(`> **DÉCOULE DE :** \`${PARENT_TOTAL_RECALL}\``);
  L.push("> *la mémoire entre deux sessions est une condition de l'attelage entre les projets : sans elle,");
  L.push("> chaque reprise redémarre à zéro et la direction descendante ne descend plus.*");
  L.push("");
  L.push("## ① Ce que TOTAL RECALL est, dans tes mots");
  L.push("");
  L.push("> « un rafraîchissement **complet** de la mémoire de l'IA de l'utilisateur, un rafraîchissement");
  L.push("> **forcé mécaniquement** »");
  L.push("");
  L.push("**Et sa limite, dans tes mots aussi, qui est l'élément central à ne pas perdre :**");
  L.push("");
  L.push("> « l'opération total recall est **trop lourde** pour répondre au périmètre unique de “où on");
  L.push("> en est” : une **couche plus légère** est prévue »");
  L.push("");
  L.push("**Ce qui l'a provoquée** : le soir du 30 septembre, la mémoire de session a été perdue parce que");
  L.push("tu as éteint ton PC. Ce n'est pas un incident, c'est un irritant structurel — une IA n'a pas de");
  L.push("mémoire entre deux sessions, et tout ce qui n'est pas ÉCRIT dans le dépôt disparaît.");
  L.push("");
  if (!mesure?.mesurable) { L.push(`**PAS MESURÉ** — ${mesure?.pourquoi}`); L.push("<!-- /DOCUMENT GÉNÉRÉ -->"); return L; }
  L.push("## ② Ce que « complet » coûte, mesuré");
  L.push("");
  L.push("Tu annonces une décision à prendre sur l'ampleur du rafraîchissement. Elle se prend sur un coût,");
  L.push("et personne ne pouvait le donner. Le voici.");
  L.push("");
  L.push("| Le système de mémoire | Documents | Poids | Tokens estimés | Dernière date écrite |");
  L.push("|---|---|---|---|---|");
  for (const l of mesure.lignes) L.push(`| ${l.quoi} | ${l.fichiers} | ${Math.round(l.octets / 1024)} Ko | ~${l.tokens.toLocaleString("fr-FR")} | ${l.dernier ?? "—"} |`);
  L.push(`| **TOTAL — un rafraîchissement COMPLET** | **${mesure.total.fichiers}** | **${Math.round(mesure.total.octets / 1024)} Ko** | **~${mesure.total.tokens.toLocaleString("fr-FR")}** | |`);
  L.push("");
  L.push("**La fraîcheur est lue DANS le texte, jamais sur la date du fichier** : un `git clone` réécrit");
  L.push("toutes les dates de modification, donc un dépôt fraîchement transporté paraîtrait tout neuf — et");
  L.push("le transport est exactement le cas d'usage de TOTAL RECALL.");
  L.push("");
  L.push("## ③ La couche légère, et l'écart entre les deux");
  L.push("");
  if (!legere?.mesurable) L.push(`**PAS MESURÉ** — ${legere?.pourquoi}`);
  else {
    L.push(`Relire **le document le plus récent de chaque système** coûterait environ`);
    L.push(`**${legere.tokens.toLocaleString("fr-FR")} tokens**, soit **${Math.round(legere.part * 100)} %** du rafraîchissement complet.`);
    L.push("");
    L.push("| Le système | Son document le plus récent | Coût |");
    L.push("|---|---|---|");
    for (const l of legere.lignes) L.push(`| ${l.quoi} | ${l.chemin ? `\`${l.chemin}\`` : "*aucun document daté*"} | ~${l.tokens.toLocaleString("fr-FR")} tokens |`);
    if (legere.sansRecent.length) { L.push(""); L.push(`**PAS MESURÉ pour ${legere.sansRecent.join(", ")}** : aucun document daté, donc aucun « plus récent » à désigner — un zéro ici n'est pas un coût nul.`); }
    L.push("");
    if (legere.plusGros?.chemin) {
      L.push("");
      L.push("### UN SEUL FICHIER DÉCIDE DU RÉSULTAT, et c'est le constat le plus actionnable de ce rapport");
      L.push("");
      L.push(`\`${legere.plusGros.chemin}\` pèse à lui seul **~${legere.plusGros.tokens.toLocaleString("fr-FR")} tokens**,`);
      L.push(`soit **${Math.round((legere.plusGros.tokens / legere.tokens) * 100)} %** de la couche légère et`);
      L.push(`**${Math.round((legere.plusGros.tokens / mesure.total.tokens) * 100)} %** de toute la mémoire du projet.`);
      L.push("");
      L.push(`**Sans lui, la couche légère tomberait à ~${legere.sansLePlusGros.toLocaleString("fr-FR")} tokens,`);
      L.push(`soit ${Math.round(legere.partSansLePlusGros * 100)} % du complet** — c'est-à-dire l'ordre de grandeur`);
      L.push("auquel on s'attend d'une couche « légère ».");
      L.push("");
      L.push("**Ce que ça veut dire concrètement.** Le suivi range ses lignes par SESSION, et une session qui");
      L.push("dure devient un fichier qui n'a plus de fin. Toute lecture « légère » du suivi est donc");
      L.push("impossible par construction : son unité de découpage n'est pas une unité de lecture. Ce n'est");
      L.push("pas un problème de TOTAL RECALL — c'est un problème que TOTAL RECALL révèle, et qui se règle");
      L.push("avant lui.");
      L.push("");
    }
    L.push("**Ce que ce rapport établit** : ton intuition est juste. Les deux opérations ne sont pas la même");
    L.push("à deux réglages près — elles diffèrent d'un ordre de grandeur, donc elles méritent bien deux");
    L.push("mécanismes distincts, et non un seul avec un curseur.");
  }
  L.push("");
  L.push("## ④ Ce que cette mesure NE dit pas");
  L.push("");
  L.push("Elle mesure un VOLUME à relire, jamais la QUALITÉ du souvenir qu'on en tire. Relire 100 % du");
  L.push("dépôt ne garantit pas de retrouver la bonne information au bon moment — c'est même le défaut");
  L.push("que l'Article 30 corrige par l'autre bout, en cherchant les notes AVANT d'ouvrir un chantier.");
  L.push("Elle ne dit rien non plus du canal : une mémoire parfaitement écrite et jamais relue ne sert à rien.");
  L.push("");
  L.push("# PLAN D'ACTION");
  L.push("");
  L.push("| État | Constat | Suite |");
  L.push("|---|---|---|");
  L.push(`| ✅ MESURÉ | un rafraîchissement complet représente ~${mesure.total.tokens.toLocaleString("fr-FR")} tokens sur ${mesure.total.fichiers} documents | #1545 |`);
  if (legere?.mesurable) L.push(`| ✅ MESURÉ | la couche légère en représente ~${Math.round(legere.part * 100)} % : les deux opérations diffèrent d'un ordre de grandeur, ta séparation est fondée | #1545 |`);
  L.push("| ? À TRANCHER | jusqu'où va le rafraîchissement « forcé » : tout, ou les systèmes les plus frais ? Tu annonces cette décision toi-même | #1545 |");
  L.push("| ? À TRANCHER | comment nommer le groupe des cinq systèmes de mémoire — c'est ta question (P80), et les noms t'appartiennent | #1546 |");
  L.push("| ? À INSTRUIRE | la couche légère n'existe pas encore : ce rapport chiffre ce qu'elle coûterait, il ne la construit pas | #1545 |");
  if (legere?.mesurable && legere.plusGros?.chemin) L.push(`| → RETENU | \`${legere.plusGros.chemin}\` pèse ${Math.round((legere.plusGros.tokens / mesure.total.tokens) * 100)} % de toute la mémoire du projet : le suivi se découpe par SESSION, et une session qui dure n'a plus de fin. À découper avant TOTAL RECALL, sinon aucune lecture « légère » du suivi n'est possible | #1545 |`);
  for (const e of mesure.ecarts) L.push(`| → RETENU | ${e} | #1545 |`);
  L.push("");
  L.push("<!-- /DOCUMENT GÉNÉRÉ -->");
  return L;
}

function main({ chemin = INDEX_PATH } = {}) {
  printReportHeader({ tool: "ines-official", title: "INES-official — édition consolidée du dépôt", scriptPath: "scripts/ines-official.mjs" });
  recordCliUsage("ines-official");
  if (process.argv[2] === "pack") return mainPack();
  if (process.argv[2] === "memoire") return mainMemoire();
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

function mainMemoire() {
  const date = process.argv[3] && /^\d{4}-\d{2}-\d{2}$/.test(process.argv[3]) ? process.argv[3] : new Date().toISOString().slice(0, 10);
  const mesure = mesurerLaMemoire({ root: "." });
  if (!mesure.mesurable) { console.log(`🚨 PAS MESURÉ — ${mesure.pourquoi}`); process.exitCode = 1; return; }
  for (const e of mesure.ecarts) console.log(`🚨 ${e}`);
  const legere = coucheLegere({ mesure });
  for (const l of mesure.lignes) console.log(`  ${String(l.fichiers).padStart(4)} doc · ~${String(l.tokens).padStart(8)} tokens · dernière date ${l.dernier ?? "—"} — ${l.cle}`);
  console.log(`  TOTAL : ${mesure.total.fichiers} documents, ~${mesure.total.tokens} tokens`);
  if (legere.mesurable) console.log(`  Couche légère (un document par système) : ~${legere.tokens} tokens, soit ${Math.round(legere.part * 100)} % du complet`);
  const sortie = `docs/strategies/total-recall-strategie.md`;
  writeFileSync(sortie, `${lignesDeTotalRecall({ mesure, legere, date }).join("\n")}\n`, "utf8");
  console.log(`\nÉcrit dans ${sortie}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
