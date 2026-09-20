// Doc-Report (tâche #165, 2026-09-21) — index global des rapports du réseau d'outils, GARDIEN de
// la décision HTML/texte déjà actée (docs/suivi #230), jamais celui qui la prend (calibrage
// explicite : « le gardien de la décision, jamais celui qui décide »).
//
// Modèle HTML/texte, identique à celui de html-report.mjs lui-même : le fichier ARCHIVÉ dans
// docs/<slug>/ reste TOUJOURS texte/markdown (relu par les scripts, zéro risque de casser un
// parseur existant) — "décision HTML" signifie seulement qu'une COPIE DE REMISE doit être rendue
// via html-report.mjs au moment de la livraison à l'utilisateur, jamais que le registre lui-même
// doive être en .html. Deux registres font exception assumée et committent directement du HTML
// comme format d'archive ("archived_html" ci-dessous) : check-tasks-details et le catalogue
// LE-COORDINATEUR, déjà documentés comme tels dans leur propre référentiel.
//
// Vérification mécanique de la décision "delivery_html" : le script producteur du registre
// importe-t-il réellement html-report.mjs ? (grep du texte source, jamais deviné, jamais une
// simple présomption). Un registre marqué "delivery_html" dont le script ne l'importe jamais est un
// vrai écart — exactement ainsi que ce module a trouvé, dès sa toute première exécution
// (2026-09-21), que THE-DEEP-READER n'a jamais reçu son rendu HTML malgré la décision actée pour
// lui (jamais corrigé automatiquement ici, seulement signalé — Doc-Report ne répare rien).
//
// Regroupement par famille (même esprit que §7ter de docs/regles-de-travail.md, jamais un second
// vocabulaire de familles) : la table REGISTRIES ci-dessous est tenue à la main, comme
// AGENT_SCRIPT_FILES d'axa-check.mjs — un registre non listé ici est lui-même un gap réel (cf.
// findRegistriesMissingDecision()), jamais une raison de deviner sa famille.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { lastTouchDays } from "./clean-dirty-old.mjs";
import { toolsNeverUsed } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// LOCAL_JOURNALS (2026-09-21, question directe de l'utilisateur : « doc-report est-il aussi
// capable d'organiser les journaux locaux, ou faut-il un outil jumeau ? »). Réponse tranchée : le
// MÊME outil, jamais un jumeau — le domaine est identique (inventaire de ce que le réseau d'outils
// produit), seul le TYPE d'artefact diffère. Distinct de REGISTRIES : ces fichiers ne sont JAMAIS
// committés (état/cache local, gitignored, perdu à chaque nouveau conteneur d'exécution) — jamais
// suivis par git, donc jamais par lastTouchDays()/git log ; leur fraîcheur se lit via l'horodatage
// du système de fichiers lui-même (mtime).
export const LOCAL_JOURNALS = [
  { path: ".gemini-key-health.json", owner: "Smart Breaker", purpose: "historique de santé des clés/modèles Gemini" },
  { path: ".smart-conso-session.json", owner: "Smart Conso API", purpose: "état de session en cours (consultations récentes)" },
  { path: ".smart-conso-token-history.json", owner: "SMART-CONSO-TOKEN", purpose: "historique des actions coûteuses classifiées" },
  { path: ".tool-usage-history.json", owner: "tool-usage.mjs (tâche #166)", purpose: "compteur d'utilisation réelle des outils" },
  { path: ".le-coordinateur-last-run.json", owner: "LE-COORDINATEUR", purpose: "anti-doublon du dernier passage réseau" },
  { path: ".circle-tasks-last-run.json", owner: "CIRCLE-TASKS", purpose: "anti-doublon de la dernière Ronde" },
  { path: ".kpi-report-latest.html", owner: "kpi-report.mjs", purpose: "copie de remise HTML du dernier rapport KPI" },
  { path: ".el-professor-coverage-latest.html", owner: "el-professor.mjs", purpose: "copie de remise HTML de la couverture EL-PROFESSOR" },
  { path: ".circle-tasks-run-summary-latest.txt", owner: "CIRCLE-TASKS", purpose: "récap texte de la dernière Ronde exécutée" },
  { path: ".ines-official-latest-code.txt", owner: "INES-official", purpose: "corps de la dernière édition (périmètre code)" },
  { path: ".ines-official-latest-code_et_docs.txt", owner: "INES-official", purpose: "corps de la dernière édition (périmètre code + documentation)" },
  { path: ".badge-ceremony-history.json", owner: "LE-COORDINATEUR (cérémonie de certification)", purpose: "date de première certification de chaque Agent, pour n'annoncer le badge qu'une seule fois" },
];

// `present: false` (jamais confondu avec `ageDays: 0`) pour un journal qui n'a encore jamais été
// écrit — cas normal pour un outil jamais encore sollicité, pas une anomalie en soi.
export function auditLocalJournals(journals = LOCAL_JOURNALS, { existsImpl = existsSync, statImpl = statSync } = {}) {
  return journals.map((j) => {
    if (!existsImpl(j.path)) return { ...j, present: false, ageDays: undefined };
    const ageDays = (Date.now() - statImpl(j.path).mtimeMs) / 86_400_000;
    return { ...j, present: true, ageDays };
  });
}

// Un journal local jamais déclaré dans .gitignore fuirait dans le prochain commit — un vrai risque
// de sécurité/propreté (un historique local peut contenir des détails internes jamais destinés à
// être publiés). Vérifié mécaniquement contre le texte réel de .gitignore, jamais supposé.
export function findJournalsMissingFromGitignore(gitignoreText, journals = LOCAL_JOURNALS) {
  const lines = new Set(String(gitignoreText ?? "").split(/\r?\n/).map((l) => l.trim()));
  return journals.filter((j) => !lines.has(j.path)).map((j) => j.path);
}

// decision : "delivery_html" (registre texte, copie de remise en HTML via html-report.mjs) |
// "archived_html" (le registre committe directement du HTML, exception assumée) | "texte" (aucune
// remise HTML actée). scriptPath : le script producteur, pour vérifier la décision "delivery_html"
// (null quand aucun script unique ne produit ce registre, ex. les archives manuelles de simulation).
export const REGISTRIES = [
  { slug: "argus", label: "ARGUS", family: "Équipe noyau (Article 20)", path: "docs/argus/", decision: "texte", scriptPath: "scripts/check-argus.mjs" },
  { slug: "harmonia", label: "HARMONIA", family: "Équipe noyau (Article 20)", path: "docs/harmonia/", decision: "texte", scriptPath: "scripts/check-harmonia.mjs" },
  { slug: "axa-check", label: "AXA-CHECK", family: "Équipe noyau (Article 20)", path: "docs/axa-check/", decision: "texte", scriptPath: "scripts/axa-check.mjs" },
  { slug: "clean-dirty-old", label: "CLEAN-DIRTY-OLD", family: "Équipe noyau (Article 20)", path: "docs/clean-dirty-old/", decision: "texte", scriptPath: "scripts/clean-dirty-old.mjs" },
  { slug: "always-new-code", label: "ALWAYS-NEW-CODE", family: "Exceptionnel (page blanche / audit lourd)", path: "docs/always-new-code/", decision: "texte", scriptPath: "scripts/always-new-code.mjs" },
  { slug: "hyper-scan-checkpoint", label: "HYPER-SCAN-CHECKPOINT", family: "Exceptionnel (page blanche / audit lourd)", path: "docs/hyper-scan-checkpoint/", decision: "texte", scriptPath: "scripts/hyper-scan-checkpoint.mjs" },
  { slug: "check-level-target", label: "CHECK-LEVEL-TARGET", family: "Gouvernance interne", path: "docs/check-level-target/", decision: "texte", scriptPath: "scripts/check-level-target.mjs" },
  { slug: "the-king", label: "THE-KING", family: "Gouvernance interne", path: "docs/the-king/", decision: "texte", scriptPath: "scripts/the-king.mjs" },
  { slug: "ines-official", label: "INES-official", family: "Exceptionnel (page blanche / audit lourd)", path: "docs/ines-official/", decision: "texte", scriptPath: "scripts/ines-official.mjs" },
  { slug: "smart-conso-api", label: "Smart Conso API", family: "Gouvernance interne", path: "docs/smart-conso-api/", decision: "texte", scriptPath: "scripts/smart-conso-api.mjs" },
  { slug: "smart-conso-token", label: "SMART-CONSO-TOKEN", family: "Gouvernance interne", path: "docs/smart-conso-token/", decision: "texte", scriptPath: "scripts/smart-conso-token.mjs" },
  { slug: "kpi", label: "Tableau de bord / KPI", family: "Simulation & qualité narrative", path: "docs/referentiel/kpi-rapports/", decision: "delivery_html", scriptPath: "scripts/kpi-report.mjs" },
  { slug: "el-professor", label: "EL-PROFESSOR", family: "Simulation & qualité narrative", path: "docs/el-professor/", decision: "delivery_html", scriptPath: "scripts/el-professor.mjs" },
  { slug: "memory-audit", label: "memory-audit", family: "Simulation & qualité narrative", path: "docs/memory-audit/", decision: "texte", scriptPath: "scripts/memento.mjs" },
  { slug: "the-screener", label: "THE-SCREENER", family: "Simulation & qualité narrative", path: "docs/the-screener/", decision: "delivery_html", scriptPath: "scripts/the-screener-capture.mjs" },
  { slug: "simulations", label: "Simulations (Article 18)", family: "Simulation & qualité narrative", path: "docs/simulations/", decision: "delivery_html", scriptPath: "scripts/le-regisseur.mjs" },
  { slug: "the-final-judge", label: "THE-FINAL-JUDGE", family: "Audit indépendant", path: "docs/the-final-judge/", decision: "delivery_html", scriptPath: "scripts/the-final-judge.mjs" },
  { slug: "the-deep-reader", label: "THE-DEEP-READER", family: "Audit indépendant", path: "docs/suivi/relectures-lourdes/", decision: "delivery_html", scriptPath: "scripts/the-deep-reader.mjs" },
  { slug: "check-tasks-details", label: "check-tasks-details", family: "Coordination", path: "docs/check-tasks-details/", decision: "archived_html", scriptPath: "scripts/check-tasks-details.mjs" },
  { slug: "le-coordinateur-catalogue", label: "Catalogue LE-COORDINATEUR", family: "Coordination", path: "docs/le-coordinateur-catalogue/", decision: "delivery_html", scriptPath: "scripts/le-coordinateur.mjs" },
  { slug: "dream-team-photo", label: "Photo de la dream team", family: "Coordination", path: "docs/profil-utilisateur/", decision: "delivery_html", scriptPath: "scripts/le-coordinateur.mjs" },
  { slug: "find-booster", label: "find-booster", family: "Outillage de navigation", path: "docs/find-booster/", decision: "texte", scriptPath: "scripts/find-booster.mjs" },
  { slug: "clone-hunter", label: "CLONE-HUNTER", family: "Qualité du code", path: "docs/clone-hunter/", decision: "texte", scriptPath: "scripts/clone-hunter.mjs" },
];

// findEngineCodeInRegistries() (2026-09-21, demande explicite de l'utilisateur après avoir repéré
// que "MEMENTO" mélangeait sous un même nom un vrai script d'outillage (scripts/memento.mjs) et un
// fragment du Moteur du jeu lui-même (lib/memento-weight.ts, câblé dans lib/lia.ts) : « MEMENTO
// n'est pas un membre de l'équipe je pense ? [...] il faut peut être créer 2 catégories »).
// Garde-fou mécanique : un Membre de l'équipe (une entrée REGISTRIES) ne doit JAMAIS pointer son
// `scriptPath` vers un fichier du Moteur du jeu (lib/, app/, components/) — seul scripts/*.mjs est
// un chemin valide, cf. docs/regles-de-travail.md « Moteur du jeu vs Outillage de travail ».
// PRESTATIONS et CIRCLE_ITEMS ne référencent leurs outils que par NOM (jamais un chemin de fichier),
// donc rien à vérifier mécaniquement de ce côté — seul REGISTRIES porte un vrai `scriptPath`.
const ENGINE_CODE_PREFIXES = ["lib/", "app/", "components/"];
export function findEngineCodeInRegistries(registries = REGISTRIES) {
  return registries.filter((r) => ENGINE_CODE_PREFIXES.some((prefix) => (r.scriptPath ?? "").startsWith(prefix)));
}

function readScriptSource(scriptPath, readFileImpl = readFileSync) {
  try {
    return readFileImpl(join(ROOT, scriptPath), "utf8");
  } catch {
    return null;
  }
}

// Vrai seulement si le script producteur importe réellement html-report.mjs (grep du texte source,
// jamais une présomption sur le nom de l'outil). Un scriptPath introuvable rapporte `undefined`
// (jamais confondu avec `false` — "on ne sait pas" n'est pas "l'outil ne le fait pas").
export function checkHtmlWiring(scriptPath, readFileImpl = readFileSync) {
  if (!scriptPath) return undefined;
  const source = readScriptSource(scriptPath, readFileImpl);
  if (source == null) return undefined;
  return /html-report/.test(source);
}

// Compare la décision actée à la réalité du code — le seul rôle de "gardien" de ce module. Ne
// tranche jamais lui-même une décision manquante ; une valeur `decision` absente est elle-même un
// gap (cf. findRegistriesMissingDecision()).
export function auditHtmlDecisions(registries = REGISTRIES, readFileImpl = readFileSync) {
  return registries.map((r) => {
    if (r.decision === "texte" || r.decision === "archived_html") {
      return { ...r, wired: undefined, mismatch: false };
    }
    const wired = checkHtmlWiring(r.scriptPath, readFileImpl);
    return { ...r, wired, mismatch: wired === false };
  });
}

// Dossiers sous docs/ qui ne sont structurellement PAS des registres de rapports d'un outil (le
// référentiel de travail lui-même, le système de suivi, l'archive historique) — jamais un registre
// à qui réclamer une décision HTML/texte, donc jamais un faux positif de findRegistriesMissingDecision().
const NON_REGISTRY_DOCS_DIRS = new Set(["docs/contexte-projet", "docs/referentiel", "docs/suivi"]);

// Un nouvel outil qui produit un registre mais n'apparaît pas dans REGISTRIES n'a reçu AUCUNE
// décision HTML/texte — c'est le 6e type de gap réclamé pour checkAgentOnboarding() (tâche #165).
// `knownRegistryPaths` : les chemins docs/<slug>/ déjà déclarés ci-dessus ; `realDocsDirs` : les
// dossiers réellement présents sous docs/ (top niveau), jamais une seconde source de vérité.
export function findRegistriesMissingDecision(realDocsDirs, registries = REGISTRIES) {
  const known = new Set(registries.map((r) => r.path.replace(/\/$/, "")));
  return [...realDocsDirs].filter((d) => !known.has(d) && !NON_REGISTRY_DOCS_DIRS.has(d));
}

// Âge du dernier rapport par registre, en jours (réutilise lastTouchDays() de clean-dirty-old.mjs,
// jamais réimplémenté ici — même discipline de mutualisation que le reste du réseau §7ter). Prend
// le fichier index.md du registre comme proxy de fraîcheur ; `undefined` (jamais 0 fabriqué) quand
// le fichier n'existe pas ou n'a jamais été commité.
export function registryAge(registry) {
  const indexPath = join(registry.path, "index.md");
  if (!existsSync(join(ROOT, indexPath))) return undefined;
  return lastTouchDays(indexPath);
}

// Assemble l'index global, croisé avec le compteur d'usage (tâche #166) pour signaler un outil dont
// les rapports ne sont jamais consultés (toolsNeverUsed()) — jamais un second calcul de "jamais
// utilisé", toujours la même fonction que CASSANDRA-RH réutilisera plus tard.
export function buildDocReportIndex({ registries = REGISTRIES, usageHistory = { events: [] }, readFileImpl = readFileSync } = {}) {
  const audited = auditHtmlDecisions(registries, readFileImpl);
  const neverUsed = new Set(toolsNeverUsed(usageHistory, registries.map((r) => r.slug)));
  const rows = audited.map((r) => ({
    ...r,
    ageDays: registryAge(r),
    neverSolicited: neverUsed.has(r.slug),
  }));
  const byFamily = new Map();
  for (const row of rows) {
    if (!byFamily.has(row.family)) byFamily.set(row.family, []);
    byFamily.get(row.family).push(row);
  }
  const mismatches = rows.filter((r) => r.mismatch);
  return { rows, byFamily, mismatches };
}

function formatDays(days) {
  if (days == null) return "jamais committé";
  if (days < 1) return "aujourd'hui";
  return `${Math.round(days)} j`;
}

function main() {
  const usageHistoryPath = join(ROOT, ".tool-usage-history.json");
  let usageHistory = { events: [] };
  try {
    usageHistory = JSON.parse(readFileSync(usageHistoryPath, "utf8"));
  } catch {
    // absence honnête : aucun événement d'usage encore enregistré, jamais fabriqué.
  }
  const { rows, byFamily, mismatches } = buildDocReportIndex({ usageHistory });
  console.log("=== Doc-Report — index global des rapports (gardien HTML/texte, tâche #165) ===\n");
  for (const [family, familyRows] of byFamily) {
    console.log(`-- ${family} --`);
    for (const r of familyRows) {
      const decisionLabel = r.decision === "delivery_html" ? "remise HTML" : r.decision === "archived_html" ? "archive HTML" : "texte";
      const wiredLabel = r.wired === false ? " [ÉCART : non câblé]" : "";
      const neverLabel = r.neverSolicited ? " [jamais sollicité selon tool-usage.mjs]" : "";
      console.log(`  ${r.label} — ${decisionLabel}${wiredLabel} — dernier rapport : ${formatDays(r.ageDays)}${neverLabel}`);
    }
  }
  const realDocsDirs = readdirSync(join(ROOT, "docs"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => `docs/${e.name}`);
  const missing = findRegistriesMissingDecision(realDocsDirs);
  if (missing.length) {
    console.log(`\n⚠️  Dossier(s) sous docs/ sans décision HTML/texte enregistrée : ${missing.join(", ")}`);
  }
  if (mismatches.length) {
    console.log(`\n⚠️  ${mismatches.length} écart(s) décision/code réel : ${mismatches.map((m) => m.label).join(", ")}`);
  }

  console.log("\n=== Journaux locaux (jamais committés, état/cache par outil) ===\n");
  for (const j of auditLocalJournals()) {
    const ageLabel = !j.present ? "jamais encore écrit" : j.ageDays < 1 ? "modifié aujourd'hui" : `modifié il y a ${Math.round(j.ageDays)} j`;
    console.log(`  ${j.path} (${j.owner}) — ${j.purpose} — ${ageLabel}`);
  }
  let gitignoreText = "";
  try {
    gitignoreText = readFileSync(join(ROOT, ".gitignore"), "utf8");
  } catch {
    // absence honnête : .gitignore introuvable, jamais fabriqué.
  }
  const missingFromGitignore = findJournalsMissingFromGitignore(gitignoreText);
  if (missingFromGitignore.length) {
    console.log(`\n⚠️  Journal(aux) local (locaux) absent(s) de .gitignore, risque de fuite au prochain commit : ${missingFromGitignore.join(", ")}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
