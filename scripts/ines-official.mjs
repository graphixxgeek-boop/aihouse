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

export const FLATTEN_SCOPES = ["code", "code_et_docs"];

// Listes blanches explicites (jamais une liste noire, qui grandirait indéfiniment sans jamais
// couvrir le prochain cas — même principe que le Corollaire de l'Article 17 de CLAUDE.md).
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

// Enrichissement confirmé "oui maintenant" #1 : table des matières en tête de l'édition.
// Enrichissement confirmé "oui maintenant" #2 : datage/versionnage explicite dans l'en-tête, même
// esprit que renderNamedCatalog() de LE-COORDINATEUR.
export function buildConsolidatedEdition({ scope, files, annotations, version, date, readFileImpl = readFileSync }) {
  if (!FLATTEN_SCOPES.includes(scope)) throw new Error(`buildConsolidatedEdition: périmètre inconnu "${scope}"`);
  const toc = buildTableOfContents(files, annotations);
  const header = [
    `# INES-official — édition v${version} (${date})`,
    `Périmètre : ${scope === "code" ? "code seul" : "code + documentation"} — ${files.length} fichier(s)`,
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

export function recordEdition(scope, { indexText, now = new Date(), writeFileImpl = writeFileSync, readFileImplForBody = readFileSync } = {}) {
  const files = collectSourceFiles(scope);
  const annotations = Object.fromEntries(files.map((f) => [f, annotateFile(f)]));
  const version = nextEditionVersion(indexText);
  const date = now.toISOString().slice(0, 10);
  const body = buildConsolidatedEdition({ scope, files, annotations, version, date, readFileImpl: readFileImplForBody });
  writeFileImpl(LATEST_PATH_BY_SCOPE[scope], body);
  const row = buildIndexRow({ version, date, scope, fileCount: files.length, sizeBytes: Buffer.byteLength(body, "utf8") });
  return { version, date, scope, fileCount: files.length, sizeBytes: Buffer.byteLength(body, "utf8"), row, latestPath: LATEST_PATH_BY_SCOPE[scope] };
}

function main() {
  const scope = process.argv[2] === "code_et_docs" ? "code_et_docs" : "code";
  const indexPath = "docs/ines-official/index.md";
  const indexText = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : "";
  const result = recordEdition(scope, { indexText });
  console.log(`Édition v${result.version} (${result.date}, ${scope}) : ${result.fileCount} fichier(s), ${result.sizeBytes} octets.`);
  console.log(`Corps écrit dans ${result.latestPath} (local, jamais committé).`);
  console.log(`Ligne d'index à ajouter à ${indexPath} :`);
  console.log(result.row);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
