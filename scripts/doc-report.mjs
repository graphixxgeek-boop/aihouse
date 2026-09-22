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
import { recommendFindBooster } from "./find-booster.mjs";
import { AGENT_CATEGORIES } from "./lib-shell.mjs";

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
  { path: ".cassandra-rh-known-members.json", owner: "CASSANDRA-RH (nouveaux visages, Phase 1)", purpose: "slugs déjà vus au moins une fois par CASSANDRA, pour n'accueillir un nouveau membre qu'une seule fois" },
  // Deux entrées trouvées le 2026-09-21 par le nouveau garde-fou findUndeclaredLocalJournals() (audit
  // d'évolutivité) : déclarées dans .gitignore depuis leur création respective, jamais ajoutées ici —
  // exactement le gap que ce garde-fou existe désormais pour prévenir à l'avenir.
  { path: ".memento-history.json", owner: "memory-audit (memento weight)", purpose: "historique du poids réel du contexte envoyé à Gemini par tour/personnage" },
  { path: ".the-ghost-session.json", owner: "THE-GHOST", purpose: "état minimal de la session nocturne autonome en cours (heure de début, compteur de tâches enchaînées)" },
  { path: ".badge-signals-snapshot.json", owner: "LE-COORDINATEUR (relevé des 6 signaux de Gardien)", purpose: "les 6 signaux mesurés au dernier commit (couverture AXA-CHECK par outil + les 5 drapeaux de Gardien), pour que tout afficheur de badge lise la même vérité sans relancer check-house.mjs" },
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

// Garde-fou dans l'AUTRE sens (2026-09-21, audit d'évolutivité) : `findJournalsMissingFromGitignore`
// ci-dessus vérifie qu'un journal DÉCLARÉ dans LOCAL_JOURNALS l'est aussi dans .gitignore, mais rien
// ne signalait l'inverse — un nouveau fichier local (`.mon-outil-history.json` par exemple) ajouté à
// .gitignore pour un futur outil, sans jamais être ajouté à LOCAL_JOURNALS, resterait invisible à
// l'inventaire de Doc-Report pour toujours. Repère, dans .gitignore, une entrée à la racine qui
// ressemble à un journal local (point de suspension, extension .json/.html/.txt) mais qu'aucune
// entrée de LOCAL_JOURNALS ne référence — jamais l'inverse d'un scan disque (qui manquerait tout
// journal pas encore écrit dans un checkout frais), une lecture de .gitignore reste vraie même
// avant la première écriture réelle du fichier.
export function findUndeclaredLocalJournals(gitignoreText, journals = LOCAL_JOURNALS) {
  const declared = new Set(journals.map((j) => j.path));
  const lines = String(gitignoreText ?? "").split(/\r?\n/).map((l) => l.trim());
  return lines.filter((l) => /^\.[\w-]+\.(json|html|txt)$/.test(l) && !declared.has(l));
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
  // family corrigée le 2026-09-21 (tâche #290, écart réel trouvé en construisant
  // findGardiensMissingFromSource() ci-dessous) : "Qualité du code" datait d'avant la promotion de
  // CLONE-HUNTER en 5e Gardien sacré du code (AGENT_CATEGORIES, lib-shell.mjs) — jamais mise à jour
  // ici au moment de cette promotion, exactement le genre d'écart entre deux registres que
  // l'Article 2/13 interdit de laisser traîner une fois trouvé.
  { slug: "clone-hunter", label: "CLONE-HUNTER", family: "Équipe noyau (Article 20)", path: "docs/clone-hunter/", decision: "texte", scriptPath: "scripts/clone-hunter.mjs" },
  { slug: "objectifs-vs-resultats", label: "objectifs-vs-resultats", family: "Gouvernance interne", path: "docs/objectifs-vs-resultats/", decision: "texte", scriptPath: "scripts/objectifs-vs-resultats.mjs" },
  { slug: "cassandra-rh", label: "CASSANDRA-RH", family: "Gouvernance interne", path: "docs/cassandra-rh/", decision: "delivery_html", scriptPath: "scripts/cassandra-rh.mjs" },
  { slug: "ecotoken", label: "ecotoken", family: "Gouvernance interne", path: "docs/ecotoken/", decision: "texte", scriptPath: "scripts/ecotoken.mjs" },
  // 9 nouveaux registres ajoutés le 2026-09-21 (règle générale : « tous les outils qui interviennent
  // lors de la Ronde DOIVENT produire un rapport txt au minimum ») — les items de CIRCLE_ITEMS sans
  // outil déjà enregistré ci-dessus reçoivent chacun leur propre dossier (cf.
  // circle-tasks.mjs::CIRCLE_REPORT_FOLDERS, recordCircleItemReport()). Tous "texte" : de simples
  // signaux, jamais une remise HTML.
  { slug: "html-wiring-check", label: "html-wiring-check (Ronde)", family: "Coordination", path: "docs/html-wiring-check/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "ecotoken-ronde", label: "Scan ecotoken produit pendant une Ronde (item ecotoken-scan)", family: "Coordination", path: "docs/ecotoken/ronde/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "suivi-open-tasks", label: "Tâche ouverte la plus ancienne (Ronde)", family: "Coordination", path: "docs/suivi-open-tasks/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "chantier-preliminaire", label: "Fraîcheur fichiers préliminaires (Ronde)", family: "Coordination", path: "docs/chantier-preliminaire/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "idee-a-trancher", label: "Idées en attente de décision (Ronde)", family: "Coordination", path: "docs/idee-a-trancher/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "tool-brain", label: "tool-brain (Ronde)", family: "Coordination", path: "docs/tool-brain/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "network-check", label: "network-check-run (Ronde)", family: "Coordination", path: "docs/network-check/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "relecture-referentiel", label: "Relecture référentiel (Ronde)", family: "Coordination", path: "docs/relecture-referentiel/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "relecture-correctifs", label: "Relecture correctifs (Ronde)", family: "Coordination", path: "docs/relecture-correctifs/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
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

// findOrphanReportFiles() (2026-09-21, tâche #340, question directe de l'utilisateur : « en plus des
// 18 outils, il y a des rapports qui doivent être produits mécaniquement à cette occasion [...] est-ce
// qu'on crée un petit outil juste pour s'assurer que le process circle est bien suivi mécaniquement,
// à chaque fois ? »). Ferme un vrai trou trouvé le soir même en vérifiant : ARGUS écrit un vrai
// fichier de scan à CHAQUE exécution (post-commit compris, jamais seulement pendant une Ronde), mais
// rien ne garantissait que `index.md` suive — 6 fichiers réels sont restés orphelins (jamais
// référencés) avant d'être indexés rétroactivement ce soir même. Générique, jamais spécifique à
// ARGUS (Article 24, évolutivité) : n'importe quel registre dont le dossier contient des fichiers
// datés (un nom incluant AAAA-MM-JJ, le patron déjà partagé par tous les scans/éditions de ce
// paysage) non mentionnés dans son propre `index.md` est flaggé par nom, jamais deviné. Signale
// seulement — jamais une correction automatique, même discipline que le reste de Doc-Report.
//
// PÉRIMÈTRE VOLONTAIREMENT CURATÉ, jamais TOUT `REGISTRIES` par défaut (limite honnête trouvée en
// testant en direct, Article 3/19) : deux registres cassent la convention "un fichier par passage =
// une ligne d'index" pour des raisons chacune légitimes, jamais une divergence à corriger — `kpi`
// a son index à un chemin FRÈRE (`docs/referentiel/kpi-index.md`), jamais `kpi-rapports/index.md` ;
// `hyper-scan-checkpoint` ne loggue délibérément QUE les passages complets avec checklist
// qualitative traitée (cf. son propre index.md : « pas seulement la partie mécanique »), jamais un
// simple passage mécanique comme celui qui a produit son tout premier fichier. `REPORT_PER_RUN_REGISTRIES`
// reste donc une liste explicitement curatée (même statut que `KNOWN_LESSONS` du Smart Breaker,
// Article 24) — à étendre seulement quand un futur registre confirme réellement écrire un fichier
// par passage ET indexer chacun d'eux, jamais par simple présomption.
export const REPORT_PER_RUN_REGISTRIES = ["argus"];
export function findOrphanReportFiles(registries = REGISTRIES.filter((r) => REPORT_PER_RUN_REGISTRIES.includes(r.slug)), { listDirImpl = (dir) => (existsSync(dir) ? readdirSync(dir) : []), readFileImpl = readFileSync, existsImpl = existsSync } = {}) {
  const findings = [];
  for (const r of registries) {
    const dir = join(ROOT, r.path);
    const files = listDirImpl(dir).filter((f) => f !== "index.md" && /\d{4}-\d{2}-\d{2}/.test(f) && (f.endsWith(".txt") || f.endsWith(".md")));
    if (!files.length) continue;
    const indexPath = join(dir, "index.md");
    const indexText = existsImpl(indexPath) ? readFileImpl(indexPath, "utf8") : "";
    const orphans = files.filter((f) => !indexText.includes(f));
    if (orphans.length) findings.push({ slug: r.slug, path: r.path, orphans });
  }
  return findings;
}

// findGardiensMissingFromSource() (2026-09-21, tâche #290 « registre canonique des outils ») —
// root cause réelle trouvée en investiguant : aucune liste unique ne dit "quels outils DOIVENT être
// appelés où" ; chaque script qui a besoin de "tous les outils" (HYPER-SCAN-CHECKPOINT, CIRCLE_ITEMS,
// PRESTATIONS...) maintient sa propre copie, jamais vérifiée contre les autres — exemple réel déjà
// survenu le même soir : CLONE-HUNTER promu 5e Gardien sacré du code (AGENT_CATEGORIES,
// lib-shell.mjs) mais un temps oublié dans le sh() de la version légère de HYPER-SCAN-CHECKPOINT
// (corrigé le soir même de sa promotion, mais rien n'empêchait mécaniquement l'oubli de durer).
// Plutôt qu'une NOUVELLE liste à maintenir (Article 10, anti-duplication) : réutilise deux registres
// déjà canoniques et déjà tenus à la main — AGENT_CATEGORIES (qui EST un Gardien) et REGISTRIES
// ci-dessus (son scriptPath réel) — et vérifie que le texte source du passage donné appelle bien
// chacun de ces scriptPath. Un futur 6e Gardien oublié dans HYPER-SCAN-CHECKPOINT ferait échouer ce
// test dès le prochain commit, jamais seulement remarqué par une relecture manuelle a posteriori.
// (2026-09-21) ALWAYS-NEW-CODE promu 6e Gardien (couche légère) — même mécanique, aucun changement
// nécessaire ici : le test continue de dériver la liste des Gardiens depuis AGENT_CATEGORIES, jamais
// une liste recopiée à la main, donc jamais périmé par un futur 7e Gardien non plus.
export function findGardiensMissingFromSource(sourceText, { categories = AGENT_CATEGORIES, registries = REGISTRIES } = {}) {
  const gardienSlugs = Object.entries(categories)
    .filter(([, cat]) => cat === "Gardien sacré du code")
    .map(([slug]) => slug);
  return gardienSlugs.filter((slug) => {
    const scriptPath = registries.find((r) => r.slug === slug)?.scriptPath;
    return !scriptPath || !String(sourceText ?? "").includes(scriptPath);
  });
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

// flagFindBoosterCandidates() (2026-09-21, demande explicite : « améliore aussi la connexion avec
// Doc-Report [...] pour qu'il soit encore plus performant »). Opérationnalise l'obligation déjà
// écrite de find-booster (« avant toute lecture intégrale d'un gros fichier, consulter d'abord
// recommendFindBooster() ») en un vrai signal par outil, plutôt que de compter sur la seule mémoire
// de l'agent pour s'en souvenir à chaque fois — exactement le type d'écart trouvé ce soir en se
// faisant demander en direct « est-ce que tu utilises désormais find booster ? ». Appelle
// `recommendFindBooster(scriptPath)` (jamais un second calcul de poids) pour CHAQUE `scriptPath`
// réel de REGISTRIES et ne retient que ceux jugés `worthwhile` — un script introuvable ou en dessous
// du seuil n'est jamais signalé, jamais une liste qui grossirait pour rien. `recommendImpl`
// injectable (même patron que `readFileImpl` ailleurs dans ce fichier) pour rester testable sans
// dépendre des vrais fichiers du dépôt.
export function flagFindBoosterCandidates(registries = REGISTRIES, recommendImpl = recommendFindBooster) {
  const seen = new Set();
  const candidates = [];
  for (const r of registries) {
    if (!r.scriptPath || seen.has(r.scriptPath)) continue;
    seen.add(r.scriptPath);
    let verdict;
    try {
      verdict = recommendImpl(join(ROOT, r.scriptPath));
    } catch {
      continue; // absence honnête : script introuvable, jamais un faux positif fabriqué.
    }
    if (verdict?.worthwhile) candidates.push({ label: r.label, scriptPath: r.scriptPath, tokens: verdict.tokens, entryCount: verdict.entryCount });
  }
  return candidates;
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

// checkHtmlReportTheme() — garde-fou mécanique pour deux règles permanentes actées le 2026-09-22,
// demande explicite de l'utilisateur : « tous les rapports html doivent être aux couleurs de la
// charte (règle) même si celle-ci évolue [...] et tous les rapports html doivent s'ouvrir avec zoom
// 150% (doc-report) ». Compare le CODE RÉEL de html-report.mjs (THEME_CSS, partagé par tous les
// rapports) à app/globals.css (la seule source de vérité pour --lia/--noe tant que la vraie charte
// graphique de la refonte n'existe pas) — jamais une supposition, jamais un second calcul des
// couleurs. Vérifie aussi la présence du zoom 150%, généralisé le même soir depuis le seul
// transcript vers TOUS les rapports directement dans THEME_CSS.
export function checkHtmlReportTheme(globalsCssText, htmlReportSource) {
  const extractVar = (text, name) => {
    const m = text.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{3,8})`));
    return m ? m[1].toLowerCase() : undefined;
  };
  const gameColors = { lia: extractVar(globalsCssText, "lia"), noe: extractVar(globalsCssText, "noe") };
  const reportColors = { lia: extractVar(htmlReportSource, "lia"), noe: extractVar(htmlReportSource, "noe") };
  const colorMismatches = ["lia", "noe"].filter((k) => gameColors[k] && reportColors[k] && gameColors[k] !== reportColors[k]);
  const hasZoom = /body\s*\{[^}]*zoom:\s*1\.5/.test(htmlReportSource);
  return { gameColors, reportColors, colorMismatches, hasZoom };
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
  const findBoosterCandidates = flagFindBoosterCandidates();
  if (findBoosterCandidates.length) {
    console.log(`\n🧭 Script(s) assez lourd(s) pour bénéficier de find-booster avant toute lecture intégrale : ${findBoosterCandidates.map((c) => `${c.label} (~${c.tokens} tokens)`).join(", ")}`);
  }
  try {
    const theme = checkHtmlReportTheme(readFileSync(join(ROOT, "app/globals.css"), "utf8"), readFileSync(join(ROOT, "scripts/html-report.mjs"), "utf8"));
    if (theme.colorMismatches.length || !theme.hasZoom) {
      console.log(
        `\n⚠️  Rapports HTML (scripts/html-report.mjs) : ` +
        (theme.colorMismatches.length ? `couleur(s) désynchronisée(s) de app/globals.css (${theme.colorMismatches.join(", ")})` : "") +
        (theme.colorMismatches.length && !theme.hasZoom ? " ; " : "") +
        (!theme.hasZoom ? `zoom 150% absent de THEME_CSS` : ""),
      );
    }
  } catch { /* best-effort, jamais bloquant */ }

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
  const undeclared = findUndeclaredLocalJournals(gitignoreText);
  if (undeclared.length) {
    console.log(`\n⚠️  Entrée(s) de .gitignore ressemblant à un journal local mais absente(s) de LOCAL_JOURNALS (garde-fou de fraîcheur, 2026-09-21) : ${undeclared.join(", ")}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();

// --- SECTIONS DEVENUES INTROUVABLES (2026-09-22) --------------------------------------------------
// Apprentissage venu d'un travail fait à la main sur docs/regles-de-travail.md, volontairement gardé
// HORS d'ecotoken : réduire le poids d'un document et le rendre utilisable sont deux métiers
// différents, et le second est celui de Doc-Report (l'auditeur de la documentation), jamais celui
// d'un outil d'économie de tokens.
//
// Le cas réel : §7ter pesait 64 % de tout le document (34 457 tk sur 53 955), avec 1 527 lignes,
// 48 blocs de règles répartis sous 24 sous-titres — et AUCUN sommaire. Le poids n'était pas le
// problème (c'est le manuel des procédures, ses procédures lui appartiennent) : le problème était
// qu'on ne pouvait rien y trouver sans tout lire. Une section devient introuvable bien avant de
// devenir trop lourde, et rien ne le signalait.
export const SEUIL_SECTION_INTROUVABLE = { lignes: 300, sousTitres: 5 };

export function findUnnavigableSections(markdown, seuils = SEUIL_SECTION_INTROUVABLE) {
  const lignes = String(markdown ?? "").split("\n");
  const debuts = [];
  lignes.forEach((l, i) => { if (/^#{2} /.test(l)) debuts.push(i); });
  const findings = [];
  for (let k = 0; k < debuts.length; k++) {
    const a = debuts[k], b = debuts[k + 1] ?? lignes.length;
    const zone = lignes.slice(a, b);
    // Deuxième forme de sous-titre, trouvée le 2026-09-22 sur docs/referentiel/principes.md : ce
    // document n'a AUCUN `###` — ses 94 sous-parties sont numérotées en début de ligne (« 8.1. »,
    // « 8.1bis. »). Ne compter que les dièses le déclarait donc parfaitement navigable alors que sa
    // section 8 fait 522 lignes d'un bloc. Même angle mort, même correction que le 5e motif de
    // find-booster (un commentaire dense n'est pas moins un titre parce qu'il n'a pas d'accolade) :
    // c'est la FONCTION de titre qui compte, jamais sa syntaxe.
    const sousTitres = zone.filter((x) => /^#{3,4} /.test(x) || /^\d+\.\d+[a-z]*\.\s/.test(x)).length;
    // Un sommaire existe déjà si la section contient une liste à puces dans ses 40 premières lignes
    // ET annonce qu'elle est un sommaire — jamais deviné sur la seule présence de puces.
    const aUnSommaire = /\*\*Sommaire/i.test(zone.slice(0, 40).join("\n"));
    if (zone.length < seuils.lignes || sousTitres < seuils.sousTitres || aUnSommaire) continue;
    findings.push({
      section: zone[0].replace(/^#+\s*/, ""), lignes: zone.length, sousTitres,
      ecart: `${zone.length} lignes réparties sous ${sousTitres} sous-titres, sans sommaire — il faut tout lire pour y trouver quoi que ce soit`,
      remede: "un sommaire en tête, généré depuis les vrais titres (jamais recopié), qui coûte quelques centaines de tokens et évite d'en lire des dizaines de milliers",
    });
  }
  return findings;
}
