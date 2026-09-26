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
import { toolsNeverUsed, recordCliUsage } from "./tool-usage.mjs";
import { recommendFindBooster } from "./find-booster.mjs";
import { AGENT_CATEGORIES, TOOL_RELIABILITY, printReliabilityNotice, balayerScriptsDesRegistres, rangDeLaCategorie } from "./lib-shell.mjs";
import { parseToolsTable, slugifyAgentName } from "./le-coordinateur.mjs";
import { planDactionDepuisEcarts, PLAN_ACTION_TITRE } from "./report-template.mjs";

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
  { path: ".agent-session.json", owner: "report-template.mjs (2026-09-22)", purpose: "identité de la session de l'agent (version de Claude) — déposée en début de session, reprise en tête de chaque rapport ; jamais committée, elle décrit qui produit un rapport à un instant donné, pas un état du projet" },
  { path: ".le-coordinateur-last-run.json", owner: "LE-COORDINATEUR", purpose: "anti-doublon du dernier passage réseau" },
  { path: ".circle-tasks-last-run.json", owner: "CIRCLE-TASKS", purpose: "anti-doublon de la dernière Ronde" },
  { path: ".kpi-report-latest.html", owner: "kpi-report.mjs", purpose: "copie de remise HTML du dernier rapport KPI" },
  { path: ".el-professor-coverage-latest.html", owner: "el-professor.mjs", purpose: "copie de remise HTML de la couverture EL-PROFESSOR" },
  { path: ".circle-tasks-run-summary-latest.txt", owner: "CIRCLE-TASKS", purpose: "récap texte de la dernière Ronde exécutée" },
  { path: ".ines-official-latest-code.txt", owner: "INES-official", purpose: "corps de la dernière édition (périmètre code)" },
  { path: ".ines-official-latest-code_et_docs.txt", owner: "INES-official", purpose: "corps de la dernière édition (périmètre code + documentation)" },
  { path: ".xp-remontees.json", owner: "TOOL-LEARNING (process XP-IA-bonnes-pratiques-et-lecons)", purpose: "occasions et remontées par entrée du registre des leçons — mesure locale du rythme de travail de l'agent, jamais un état du projet ; écrit par le crochet post-commit, donc structurellement incommittable par le commit qui le met à jour" },
  { path: ".conso-tours.json", owner: "SMART-CONSO-TOKEN (alerte « rédige ton prompt à part »)", purpose: "longueur de chaque tour de conversation, pour repérer une rafale de messages courts — une mesure du rythme d'échange, jamais un état du projet, et elle n'aurait aucun sens partagée entre deux machines" },
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
  { slug: "argus", label: "ARGUS", family: "(f) 🛡️ Les Gardiens Sacrés du Code", path: "docs/argus/", decision: "texte", scriptPath: "scripts/check-argus.mjs" },
  { slug: "harmonia", label: "HARMONIA", family: "(f) 🛡️ Les Gardiens Sacrés du Code", path: "docs/harmonia/", decision: "texte", scriptPath: "scripts/check-harmonia.mjs" },
  { slug: "axa-check", label: "AXA-CHECK", family: "(f) 🛡️ Les Gardiens Sacrés du Code", path: "docs/axa-check/", decision: "texte", scriptPath: "scripts/axa-check.mjs" },
  { slug: "clean-dirty-old", label: "CLEAN-DIRTY-OLD", family: "(f) 🛡️ Les Gardiens Sacrés du Code", path: "docs/clean-dirty-old/", decision: "texte", scriptPath: "scripts/clean-dirty-old.mjs" },
  { slug: "always-new-code", label: "ALWAYS-NEW-CODE", family: "(f) 🛡️ Les Gardiens Sacrés du Code", path: "docs/always-new-code/", decision: "texte", scriptPath: "scripts/always-new-code.mjs" },
  { slug: "hyper-scan-checkpoint", label: "HYPER-SCAN-CHECKPOINT", family: "(f) ✨ Exceptionnel (page blanche / audit lourd)", path: "docs/hyper-scan-checkpoint/", decision: "texte", scriptPath: "scripts/hyper-scan-checkpoint.mjs" },
  { slug: "check-level-target", label: "CHECK-LEVEL-TARGET", family: "(f) 👑 La Gouvernance Royale", path: "docs/check-level-target/", decision: "texte", scriptPath: "scripts/check-level-target.mjs" },
  { slug: "the-king", label: "THE-KING", family: "(f) 👑 La Gouvernance Royale", path: "docs/the-king/", decision: "texte", scriptPath: "scripts/the-king.mjs" },
  { slug: "ines-official", label: "INES-official", family: "(f) ✨ Exceptionnel (page blanche / audit lourd)", path: "docs/ines-official/", decision: "texte", scriptPath: "scripts/ines-official.mjs" },
  { slug: "smart-conso-api", label: "Smart Conso API", family: "(f) 👑 La Gouvernance Royale", path: "docs/smart-conso-api/", decision: "texte", scriptPath: "scripts/smart-conso-api.mjs" },
  { slug: "smart-conso-token", label: "SMART-CONSO-TOKEN", family: "(f) 👑 La Gouvernance Royale", path: "docs/smart-conso-token/", decision: "texte", scriptPath: "scripts/smart-conso-token.mjs" },
  { slug: "kpi", label: "Tableau de bord / KPI", family: "(f) 🎬 La Suite Tarantino - Simulation & qualité narrative", path: "docs/referentiel/kpi-rapports/", decision: "delivery_html", scriptPath: "scripts/kpi-report.mjs" },
  { slug: "el-professor", label: "EL-PROFESSOR", family: "(f) 🎬 La Suite Tarantino - Simulation & qualité narrative", path: "docs/el-professor/", decision: "delivery_html", scriptPath: "scripts/el-professor.mjs" },
  { slug: "memory-audit", label: "memory-audit", family: "(f) 🎬 La Suite Tarantino - Simulation & qualité narrative", path: "docs/memory-audit/", decision: "texte", scriptPath: "scripts/memento.mjs" },
  { slug: "the-screener", label: "THE-SCREENER", family: "(f) 🎬 La Suite Tarantino - Simulation & qualité narrative", path: "docs/the-screener/", decision: "delivery_html", scriptPath: "scripts/the-screener-capture.mjs" },
  { slug: "simulations", label: "Simulations (Article 18)", family: "(f) 🎬 La Suite Tarantino - Simulation & qualité narrative", path: "docs/simulations/", decision: "delivery_html", scriptPath: "scripts/le-regisseur.mjs" },
  { slug: "the-final-judge", label: "THE-FINAL-JUDGE", family: "(f) 🕵️ Les Agents Externes - Audit indépendant", path: "docs/the-final-judge/", decision: "delivery_html", scriptPath: "scripts/the-final-judge.mjs" },
  { slug: "the-deep-reader", label: "THE-DEEP-READER", family: "(f) 🕵️ Les Agents Externes - Audit indépendant", path: "docs/suivi/relectures-lourdes/", decision: "delivery_html", scriptPath: "scripts/the-deep-reader.mjs" },
  { slug: "check-tasks-details", label: "check-tasks-details", family: "(f) 👼 Les Anges de la coordination", path: "docs/check-tasks-details/", decision: "archived_html", scriptPath: "scripts/check-tasks-details.mjs" },
  // OÙ ON EN EST (2026-09-23) — troisième angle sur les mêmes tâches, à côté de la Ronde (rien
  // n'a-t-il dérivé ?) et de l'état des tâches (qu'est-ce qu'on fait maintenant ?) : celui-ci dit
  // ce qui a été FAIT et ce que le projet y a gagné. HTML archivé, comme ses deux voisins.
  { slug: "ou-on-en-est", label: "Où on en est", family: "(f) 👼 Les Anges de la coordination", path: "docs/ou-on-en-est/", decision: "archived_html", scriptPath: "scripts/ou-on-en-est.mjs" },
  { slug: "le-coordinateur-catalogue", label: "Catalogue LE-COORDINATEUR", family: "(f) 👼 Les Anges de la coordination", path: "docs/le-coordinateur-catalogue/", decision: "delivery_html", scriptPath: "scripts/le-coordinateur.mjs" },
  { slug: "dream-team-photo", label: "Photo de la dream team", family: "(f) 👼 Les Anges de la coordination", path: "docs/profil-utilisateur/", decision: "delivery_html", scriptPath: "scripts/le-coordinateur.mjs" },
  { slug: "find-booster", label: "find-booster", family: "(f) 🚀 Les Boosters de Navigation", path: "docs/find-booster/", decision: "texte", scriptPath: "scripts/find-booster.mjs" },
  // family corrigée le 2026-09-21 (tâche #290, écart réel trouvé en construisant
  // findGardiensMissingFromSource() ci-dessous) : "Qualité du code" datait d'avant la promotion de
  // CLONE-HUNTER en 5e Gardien sacré du code (AGENT_CATEGORIES, lib-shell.mjs) — jamais mise à jour
  // ici au moment de cette promotion, exactement le genre d'écart entre deux registres que
  // l'Article 2/13 interdit de laisser traîner une fois trouvé.
  { slug: "clone-hunter", label: "CLONE-HUNTER", family: "(f) 🛡️ Les Gardiens Sacrés du Code", path: "docs/clone-hunter/", decision: "texte", scriptPath: "scripts/clone-hunter.mjs" },
  // 2026-09-22 : septième Gardien. Son registre n'archive que les passages PROFONDS (exceptionnels,
  // Article 23) — la couche légère, elle, ne produit qu'un avertissement post-commit sans fichier.
  { slug: "safe-export", label: "SAFE-EXPORT", family: "(f) 🛡️ Les Gardiens Sacrés du Code", path: "docs/safe-export/", decision: "texte", scriptPath: "scripts/safe-export.mjs" },
  { slug: "tool-learning", label: "TOOL-LEARNING", family: "(f) 📜 Les Prophètes - Dette & Structure du code", path: "docs/tool-learning/", decision: "texte", scriptPath: "scripts/tool-learning.mjs" },
  // THE-EQUALIZER : texte, comme ses voisins de suite. Son verdict est relu par des outils (god,
  // la Ronde), jamais seulement par un humain devant un navigateur — un HTML le rendrait plus
  // joli et moins lisible par les autres.
  { slug: "the-equalizer", label: "THE-EQUALIZER", family: "(f) 📜 Les Prophètes - Dette & Structure du code", path: "docs/the-equalizer/", decision: "texte", scriptPath: "scripts/the-equalizer.mjs" },
  // Décision « texte » assumée : son rapport se lit en trois lignes dans le terminal au moment où
  // on a besoin de l'heure. Une page HTML pour dire l'heure serait une page qu'on n'ouvre jamais.
  // Décision « texte » assumée : un plan de renommage se lit ligne à ligne dans le terminal, juste
  // avant de toucher au dépôt, et se vérifie avec la commande jumelle juste après. Une page HTML
  // s'ouvrirait après coup, c'est-à-dire trop tard pour le geste qu'elle est censée encadrer.
  { slug: "agent-des-noms", label: "AGENT DES NOMS", family: "(f) 📜 Les Prophètes - Dette & Structure du code", path: "docs/agent-des-noms/", decision: "texte", scriptPath: "scripts/agent-des-noms.mjs" },
  { slug: "agent-du-temps", label: "AGENT-DU-TEMPS", family: "(f) 👑 La Gouvernance Royale", path: "docs/agent-du-temps/", decision: "texte", scriptPath: "scripts/agent-du-temps.mjs" },
  { slug: "abraham-les-references", label: "ABRAHAM-LES-REFERENCES", family: "(f) 📜 Les Prophètes - Dette & Structure du code", path: "docs/abraham-les-references/", decision: "texte", scriptPath: "scripts/abraham-les-references.mjs" },
  { slug: "moise-tables-de-loi", label: "MOÏSE-TABLES-DE-LOI", family: "(f) 📜 Les Prophètes - Dette & Structure du code", path: "docs/moise-tables-de-loi/", decision: "texte", scriptPath: "scripts/moise-tables-de-loi.mjs" },
  { slug: "integration-outil", label: "integration-outil", family: "(f) 📜 Les Prophètes - Dette & Structure du code", path: "docs/integration-outil/", decision: "texte", scriptPath: "scripts/integration-outil.mjs" },
  { slug: "objectifs-vs-resultats", label: "objectifs-vs-resultats", family: "(f) 👑 La Gouvernance Royale", path: "docs/objectifs-vs-resultats/", decision: "texte", scriptPath: "scripts/objectifs-vs-resultats.mjs" },
  // LE-CLASSIFICATEUR (2026-09-26, né de la scission de CASSANDRA). "archived_html" plutôt que
  // "delivery_html" : il ne produit pas un rapport de passage qu'on remettrait ensuite en HTML — il
  // produit une RÉFÉRENCE, dont la version HTML EST la version de remise, committée telle quelle.
  // C'est la demande explicite de l'utilisateur du 2026-09-26 : « ce doc doit m'être livré en HTML,
  // mais il peut être enregistré en txt dans les dossiers ».
  { slug: "le-classificateur", label: "LE-CLASSIFICATEUR", family: "(f) 👑 La Gouvernance Royale", path: "docs/le-classificateur/", decision: "archived_html", scriptPath: "scripts/le-classificateur.mjs" },
  { slug: "cassandra-rh", label: "CASSANDRA-RH", family: "(f) 👑 La Gouvernance Royale", path: "docs/cassandra-rh/", decision: "delivery_html", scriptPath: "scripts/cassandra-rh.mjs" },
  { slug: "ecotoken", label: "ecotoken", family: "(f) 👑 La Gouvernance Royale", path: "docs/ecotoken/", decision: "texte", scriptPath: "scripts/ecotoken.mjs" },
  // 9 nouveaux registres ajoutés le 2026-09-21 (règle générale : « tous les outils qui interviennent
  // lors de la Ronde DOIVENT produire un rapport txt au minimum ») — les items de CIRCLE_ITEMS sans
  // outil déjà enregistré ci-dessus reçoivent chacun leur propre dossier (cf.
  // circle-tasks.mjs::CIRCLE_REPORT_FOLDERS, recordCircleItemReport()). Tous "texte" : de simples
  // signaux, jamais une remise HTML.
  { slug: "html-wiring-check", label: "html-wiring-check (Ronde)", family: "(f) 👼 Les Anges de la coordination", path: "docs/html-wiring-check/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "ecotoken-ronde", label: "Scan ecotoken produit pendant une Ronde (item ecotoken-scan)", family: "(f) 👼 Les Anges de la coordination", path: "docs/ecotoken/ronde/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "suivi-open-tasks", label: "Tâche ouverte la plus ancienne (Ronde)", family: "(f) 👼 Les Anges de la coordination", path: "docs/suivi-open-tasks/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "chantier-preliminaire", label: "Fraîcheur fichiers préliminaires (Ronde)", family: "(f) 👼 Les Anges de la coordination", path: "docs/chantier-preliminaire/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "idee-a-trancher", label: "Idées en attente de décision (Ronde)", family: "(f) 👼 Les Anges de la coordination", path: "docs/idee-a-trancher/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "tool-brain", label: "tool-brain (Ronde)", family: "(f) 👼 Les Anges de la coordination", path: "docs/tool-brain/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "network-check", label: "network-check-run (Ronde)", family: "(f) 👼 Les Anges de la coordination", path: "docs/network-check/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "relecture-referentiel", label: "Relecture référentiel (Ronde)", family: "(f) 👼 Les Anges de la coordination", path: "docs/relecture-referentiel/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
  { slug: "relecture-correctifs", label: "Relecture correctifs (Ronde)", family: "(f) 👼 Les Anges de la coordination", path: "docs/relecture-correctifs/", decision: "texte", scriptPath: "scripts/circle-tasks.mjs" },
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
    // Le RANG, jamais le libellé brut (2026-09-25, #754) : depuis que chaque catégorie porte
    // « Rang — Famille », une égalité stricte sur le libellé ne matchait plus AUCUN Gardien — et
    // une liste de Gardiens devenue vide rend exactement ce que rend « aucun Gardien ne manque ».
    .filter(([, cat]) => rangDeLaCategorie(cat) === "Gardien sacré du code")
    .map(([slug]) => slug);
  return gardienSlugs.filter((slug) => {
    const scriptPath = registries.find((r) => r.slug === slug)?.scriptPath;
    return !scriptPath || !String(sourceText ?? "").includes(scriptPath);
  });
}

// APPELS_NON_GARDIENS_HYPER_SCAN (2026-09-22) — le pendant exact de findGardiensMissingFromSource()
// ci-dessus, né d'une question de l'utilisateur qui a mis le doigt sur un trou réel : « la connexion
// avec hyper check (sauf erreur : tous les gardiens sacrés mais seulement eux) ». La moitié « tous »
// était bien garantie mécaniquement depuis la tâche #290 ; la moitié « seulement eux » ne l'était
// par RIEN — et elle est fausse dans les faits, pour de bonnes raisons documentées ci-dessous.
//
// Le trou n'était donc pas « HYPER-SCAN appelle trop de choses » mais « personne ne sait dire quelles
// non-Gardiens il appelle, ni pourquoi ». Un appel ajouté là un soir de fatigue aurait ressemblé en
// tout point à un appel décidé : même ligne, même forme. Ce registre rend la différence visible —
// chaque non-Gardien appelé doit porter sa raison écrite, et tout NOUVEL appel non déclaré est
// signalé au commit suivant. Il ne dit jamais qu'un appel est mauvais : il dit qu'il n'a pas été
// décidé.
//
// Volontairement une liste tenue à la main (l'exception explicitement permise par l'Article 24 :
// « un contenu explicitement curaté à la main par décision humaine documentée reste légitime tant
// que cette nature volontairement manuelle est écrite noir sur blanc à côté ») — parce que ce qu'elle
// porte n'est pas un état observable ailleurs dans le dépôt, mais une RAISON, qu'aucun scan ne peut
// dériver. Le garde-fou mécanique exigé par ce même Article porte sur l'autre bout : findAppels...()
// détecte tout écart entre cette liste et la réalité du fichier.
export const APPELS_NON_GARDIENS_HYPER_SCAN = [
  {
    scriptPath: "scripts/check-house.mjs",
    raison: "Infrastructure, jamais un Gardien (cf. organisation-agence.md §5) : la suite de tests est le socle sur lequel tout verdict repose — un scan rendu sur un dépôt dont les tests sont rouges ne vaut rien, et HYPER-SCAN doit pouvoir le dire dans son propre rapport plutôt que laisser le lecteur le supposer.",
  },
  {
    scriptPath: "scripts/kpi-report.mjs",
    raison: "Membre, pas Gardien : fournit les chiffres de contexte (points fragiles ouverts, couverture) sans lesquels les constats des Gardiens n'ont pas d'échelle. Lu, jamais recalculé ici.",
  },
];

// findAppelsNonDeclaresDansHyperScan() — l'autre moitié de la question. Extrait tous les
// `sh("node scripts/X.mjs")` réellement présents dans le texte source, retire les Gardiens (dérivés
// d'AGENT_CATEGORIES, jamais recopiés) et les non-Gardiens déclarés ci-dessus : ce qui reste est un
// appel que personne n'a justifié. Les imports directs (verifyRondeProcess depuis
// circle-process-guardian.mjs) ne sont pas des sh() et ne sont pas concernés — un import expose une
// fonction précise, un sh() relance un outil entier, ce ne sont pas les mêmes enjeux de coût.
export function findAppelsNonDeclaresDansHyperScan(sourceText, { categories = AGENT_CATEGORIES, registries = REGISTRIES, declares = APPELS_NON_GARDIENS_HYPER_SCAN } = {}) {
  const appeles = [...String(sourceText ?? "").matchAll(/sh\(\s*"node (scripts\/[a-z0-9-]+\.mjs)/g)].map((m) => m[1]);
  const gardienPaths = Object.entries(categories)
    // Le RANG, jamais le libellé brut (2026-09-25, #754) : depuis que chaque catégorie porte
    // « Rang — Famille », une égalité stricte sur le libellé ne matchait plus AUCUN Gardien — et
    // une liste de Gardiens devenue vide rend exactement ce que rend « aucun Gardien ne manque ».
    .filter(([, cat]) => rangDeLaCategorie(cat) === "Gardien sacré du code")
    .map(([slug]) => registries.find((r) => r.slug === slug)?.scriptPath)
    .filter(Boolean);
  const declaresPaths = declares.map((d) => d.scriptPath);
  return [...new Set(appeles)].filter((p) => !gardienPaths.includes(p) && !declaresPaths.includes(p));
}

// findDeclarationsSansAppel() — le sens inverse, celui qui pourrit toujours en silence : une raison
// écrite pour un appel qui n'existe plus. Une justification orpheline est pire qu'une absence, elle
// fait croire que la question a été tranchée récemment (même famille que checkActionChain() de
// l'Article 28, qui vérifie qu'une tâche annoncée existe vraiment).
export function findDeclarationsSansAppel(sourceText, { declares = APPELS_NON_GARDIENS_HYPER_SCAN } = {}) {
  const texte = String(sourceText ?? "");
  return declares.filter((d) => !texte.includes(`sh("node ${d.scriptPath}`)).map((d) => d.scriptPath);
}

// findDeclarationsSansRaison() — une entrée du registre qui n'explique rien ne protège rien : elle
// transforme le garde-fou en formalité qu'on remplit pour le faire taire (exactement la dérive que
// l'Article 28 nomme pour les plans d'action). Seuil bas et assumé : 60 caractères, de quoi exclure
// « parce que » sans imposer une dissertation.
export function findDeclarationsSansRaison(declares = APPELS_NON_GARDIENS_HYPER_SCAN) {
  return declares.filter((d) => String(d.raison ?? "").trim().length < 60).map((d) => d.scriptPath);
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
  // Parcours partagé (lib-shell), extraction propre à cet outil : `tokens`/`entryCount` sont ce que
  // find-booster mesure, et ce ne sont PAS les mêmes grandeurs que chez son voisin find-brain.
  return balayerScriptsDesRegistres(registries, recommendImpl, (v) => ({ tokens: v.tokens, entryCount: v.entryCount }), { root: ROOT });
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

// Un script enregistre-t-il réellement son propre passage ? Lu dans le vrai fichier, jamais supposé
// depuis une liste tenue à la main (Article 24). Un chemin absent ou illisible répond honnêtement
// "non mesurable" plutôt que de trancher dans un sens ou dans l'autre.
export function scriptRecordsItsUsage(scriptPath, readFileImpl = readFileSync) {
  if (!scriptPath) return false;
  try {
    return /recordCliUsage\s*\(/.test(readFileImpl(join(ROOT, scriptPath), "utf8"));
  } catch {
    return false;
  }
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
    // « JAMAIS SOLLICITÉ » VEUT DIRE DEUX CHOSES TRÈS DIFFÉRENTES (2026-09-22, trouvé en lançant
    // Doc-Report pendant la Ronde finale de la nuit autonome). Un outil peut n'avoir jamais été
    // lancé — un vrai signal de désusage, qui mérite qu'on se demande s'il sert encore — ou bien
    // n'avoir AUCUN point d'enregistrement dans son script, auquel cas le compteur ne pourrait
    // rien voir même s'il tournait dix fois par jour. THE-FINAL-JUDGE et memory-audit sont dans ce
    // second cas : ce sont des bibliothèques sans CLI, appelées autrement. Les confondre, c'est
    // encore lire une absence de mesure comme une mesure — l'erreur récurrente de cette session.
    // Deux outils du premier cas (Doc-Report lui-même et ecotoken) ont reçu leur enregistrement
    // manquant le même soir ; ceux qui restent sans point d'enregistrement sont désormais nommés
    // comme tels plutôt qu'accusés de désusage.
    sansPointDEnregistrement: neverUsed.has(r.slug) && !scriptRecordsItsUsage(r.scriptPath, readFileImpl),
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
  printReliabilityNotice("doc-report");
  // Doc-Report se comptait lui-même comme « jamais sollicité » (2026-09-22, trouvé par la Ronde
  // finale de la nuit autonome, en le lançant) : son CLI n'enregistrait jamais son propre passage,
  // alors qu'il REPROCHE cette absence aux autres. Le signal n'était donc pas faux par erreur de
  // calcul, il mesurait une absence d'instrumentation en croyant mesurer un désusage — encore la
  // famille d'erreur de cette session.
  recordCliUsage("doc-report");
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
      const neverLabel = r.sansPointDEnregistrement
        ? " [aucun point d'enregistrement dans son script — le compteur ne peut rien voir, ce n'est PAS un constat de désusage]"
        : r.neverSolicited ? " [jamais sollicité selon tool-usage.mjs]" : "";
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

  // LE PLAN D'ACTION (2026-09-23, tâche #211). Doc-Report est un VEILLEUR : il ne corrige rien, il
  // constate. Ses quatre constats actifs ne sont pas de même nature, et les fondre sous une tâche
  // unique effacerait ce qui compte — un journal absent de .gitignore est un risque de FUITE au
  // prochain commit, une décision HTML/texte manquante est une lacune de registre.
  //
  // `fausseUneMesure` seulement pour les écarts décision/code : quand le registre dit une chose et
  // le code une autre, tout ce qui lit ce registre travaille sur du faux.
  const ecartsDocReport = [
    ...missing.map((d) => ({ fichier: d, defaut: "dossier sous docs/ sans décision HTML/texte enregistrée",
      tache: `trancher la décision HTML/texte de ${d} et l'inscrire au registre`, fausseUneMesure: false })),
    ...mismatches.map((m2) => ({ fichier: m2.label, defaut: "la décision enregistrée ne correspond pas au code réel",
      tache: `réaligner ${m2.label} : corriger le registre ou le code, selon lequel des deux a raison`, fausseUneMesure: true })),
    ...missingFromGitignore.map((j) => ({ fichier: j, defaut: "journal local absent de .gitignore — risque de fuite au prochain commit",
      tache: `ajouter ${j} à .gitignore AVANT le prochain commit`, fausseUneMesure: true })),
    ...undeclared.map((j) => ({ fichier: j, defaut: "entrée de .gitignore ressemblant à un journal local, jamais déclarée dans LOCAL_JOURNALS",
      tache: `déclarer ${j} dans LOCAL_JOURNALS, ou écrire pourquoi il n'en est pas un`, fausseUneMesure: false })),
  ];
  const planDoc = planDactionDepuisEcarts(ecartsDocReport, { toolSlug: "doc-report",
    libelle: (e) => `${e.fichier} — ${e.defaut}`,
    tache: (e) => e.tache });
  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of planDoc.lignes) console.log(l);
}


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

// --- LES DEUX GARDE-FOUS DE TOOL_RELIABILITY (2026-09-22, tâche #198). Le registre lui-même est
// volontairement tenu à la main (aucune mécanique ne peut deviner si un calcul est exact ou
// approché) — l'Article 24 l'autorise explicitement, à la condition stricte qu'un garde-fou
// mécanique détecte tout écart. En voici les deux, qui ferment les deux seules façons dont ce
// registre peut cesser d'être vrai sans que personne ne s'en aperçoive.

// (1) Un outil de la table maîtresse qui n'est classé nulle part. Sans ce garde-fou, tout nouvel
// outil naîtrait silencieusement SANS avertissement — exactement l'angle mort que 6 Agents réels
// avaient déjà connu avec AGENT_SCRIPT_FILES (cf. Article 24). Même découpage `primaryName` et même
// `slugifyAgentName()` que partout ailleurs, jamais une troisième façon de nommer un outil.
export function findToolsMissingReliability(toolsTableMarkdown, registry = TOOL_RELIABILITY) {
  const known = new Set(Object.keys(registry));
  return parseToolsTable(toolsTableMarkdown)
    .map((row) => ({ tool: row.tool, slug: slugifyAgentName(row.tool.split(/[/(]/)[0].trim()) }))
    .filter(({ slug }) => !known.has(slug));
}

// (2) Un outil classé "heuristique" dont le script n'affiche en réalité jamais l'avertissement.
// C'est LE défaut que cette tâche corrige : la nuance existait dans la tête de l'outil, pas dans sa
// sortie. Une classification sans affichage ne vaut rien — elle ne fait que déplacer le mensonge.
// `scriptFor` associe un slug à son fichier ; un outil dont le script est introuvable est signalé
// comme tel plutôt que silencieusement passé (une absence n'est jamais une conformité).
export const RELIABILITY_SCRIPT_FILES = {
  // 2026-09-22 — SEPTIÈME registre à inscrire à la main pour les deux mêmes outils, et le dernier
  // de la série. Chacun des sept a fait échouer un test l'un après l'autre : les garde-fous ont
  // tous fonctionné, et c'est justement ce qui rend le diagnostic de l'Article 24 imparable — ils
  // DÉTECTENT l'oubli, ils ne l'ÉVITENT pas. Sept registres pour un outil qui arrive, c'est la
  // mesure exacte de ce qu'il reste à automatiser.
  "safe-export": "scripts/safe-export.mjs", "tool-learning": "scripts/tool-learning.mjs",
  "the-equalizer": "scripts/the-equalizer.mjs",
  "agent-des-noms": "scripts/agent-des-noms.mjs",
  "agent-du-temps": "scripts/agent-du-temps.mjs",
  "moise-tables-de-loi": "scripts/moise-tables-de-loi.mjs",
  "abraham-les-references": "scripts/abraham-les-references.mjs",
  "integration-outil": "scripts/integration-outil.mjs",
  "check-spirit-mjs": "scripts/check-spirit.mjs", argus: "scripts/check-argus.mjs", harmonia: "scripts/check-harmonia.mjs",
  "smart-conso-api": "scripts/smart-conso-api.mjs", "check-level-target": "scripts/check-level-target.mjs",
  "hyper-scan-checkpoint": "scripts/hyper-scan-checkpoint.mjs", "always-new-code": "scripts/always-new-code.mjs",
  "axa-check": "scripts/axa-check.mjs", "clean-dirty-old": "scripts/clean-dirty-old.mjs",
  "el-professor": "scripts/el-professor.mjs", "the-screener": "scripts/the-screener-capture.mjs",
  "the-final-judge": "scripts/the-final-judge.mjs", "the-deep-reader": "scripts/the-deep-reader.mjs",
  "smart-breaker": "scripts/check-gemini-quota.mjs", "smart-conso-token": "scripts/smart-conso-token.mjs",
  "circle-tasks": "scripts/circle-tasks.mjs", "check-tasks-details": "scripts/check-tasks-details.mjs", "ou-on-en-est": "scripts/ou-on-en-est.mjs",
  "charter-spy": "scripts/smart-conso-token.mjs", "doc-report": "scripts/doc-report.mjs",
  "the-king": "scripts/the-king.mjs", "memory-audit": "scripts/memento.mjs",
  "find-deep-booster": "scripts/route-booster.mjs", "find-brain": "scripts/find-brain.mjs",
  "tool-brain": "scripts/tool-brain.mjs", "find-booster": "scripts/find-booster.mjs",
  "angel-of-ia-process": "scripts/angel-of-ia-process.mjs", "data-archangel": "scripts/data-archangel.mjs", "pure-gold-unity": "scripts/pure-gold-unity.mjs",   "god-of-all-process": "scripts/god-of-all-process.mjs", "process-simulation-guardian": "scripts/process-simulation-guardian.mjs",
  "clone-hunter": "scripts/clone-hunter.mjs", "cassandra-rh": "scripts/cassandra-rh.mjs",
  ecotoken: "scripts/ecotoken.mjs",
};
export function findHeuristicToolsWithoutNotice(registry = TOOL_RELIABILITY, { scriptFor = RELIABILITY_SCRIPT_FILES, readFileImpl = readFileSync, existsImpl = existsSync } = {}) {
  const manques = [];
  for (const [slug, entry] of Object.entries(registry)) {
    if (entry.nature !== "heuristique") continue;
    // REPLI DÉRIVÉ PLUTÔT QU'UNE 18e LIGNE À RECOPIER (2026-09-25, tâche #653 → #808) : quand un
    // slug ne figure pas dans la table de correspondance, on essaie `scripts/<slug>.mjs` avant de
    // conclure. Dans ce dépôt, la grande majorité des outils porte exactement ce nom-là ; la table
    // n'existe que pour les EXCEPTIONS (ARGUS → check-argus.mjs, Smart Breaker →
    // check-gemini-quota.mjs). Énumérer aussi les non-exceptions faisait de ce registre le septième
    // à tenir à la main, et c'est précisément ce que l'Article 24 refuse. On ne renonce à conclure
    // que si NI la table NI le nom dérivé ne désignent un fichier réel.
    const file = scriptFor[slug] ?? (existsImpl(`scripts/${slug}.mjs`) ? `scripts/${slug}.mjs` : null);
    if (!file) { manques.push({ slug, raison: "aucun script connu pour cet outil heuristique — impossible de vérifier qu'il avertit" }); continue; }
    const full = join(ROOT, file);
    if (!existsImpl(full)) { manques.push({ slug, file, raison: "script introuvable sur le disque" }); continue; }
    const source = readFileImpl(full, "utf8");
    // Vérifié AVEC LE SLUG, jamais seulement « la fonction apparaît quelque part » : deux outils
    // peuvent vivre dans le même fichier (CHARTER-SPY partage scripts/smart-conso-token.mjs avec son
    // hôte), et sans le slug l'un couvrirait l'autre sans que le second n'avertisse jamais — la même
    // erreur de fond que le reste de ce chantier corrige : une présence approximative lue comme une
    // conformité. Les deux formes comptent : printReliabilityNotice() pour un outil qui écrit en
    // console, reliabilityNotice() pour un outil dont le rapport est un document construit.
    // TROISIÈME FORME ACCEPTÉE depuis le 2026-09-22 (migration pure-gold-unity) : un outil qui passe
    // par l'en-tête partagé `printReportHeader({ tool: "<slug>" ... })` n'appelle plus
    // printReliabilityNotice lui-même — c'est le gabarit qui pose l'avertissement, depuis le même
    // registre. Le lecteur le voit donc toujours, et c'est la seule chose que ce garde-fou protège.
    // L'élargissement reste STRICT : le slug doit être le même, exactement comme pour les deux
    // autres formes — sans quoi un outil pourrait poser l'en-tête d'un voisin et passer pour couvert.
    // Les quatre portes d'entrée du gabarit comptent : l'en-tête imprimé pour un outil qui écrit en
    // console, et les trois constructeurs pour un outil dont le rapport est un document rendu
    // (memory-audit est dans ce cas — une bibliothèque sans console.log, dont l'appelant imprime).
    // CINQUIÈME FORME, ET ELLE A ÉTÉ TROUVÉE PAR L'ÉCHEC (2026-09-25, tâche #653 → #808) : le slug
    // peut être passé par une CONSTANTE plutôt qu'en toutes lettres — `tool: OUTIL`, avec
    // `const OUTIL = "rapport-gros-prompt"` dix lignes plus haut. Le lecteur voit exactement le même
    // avertissement ; le garde-fou, lui, ne voyait rien et accusait un outil parfaitement conforme.
    // C'est la quatrième fois sur ce seul chantier qu'une sonde incapable de matcher rend ce que
    // rend une sonde qui n'a rien trouvé. On résout donc les liaisons littérales du fichier avant de
    // chercher, plutôt que d'exiger de chaque outil qu'il écrive son nom deux fois.
    const alias = [slug];
    for (const m of source.matchAll(/(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*["'`]([^"'`]+)["'`]\s*;/g)) {
      if (m[2] === slug) alias.push(m[1]);
    }
    const ou = alias.map((a) => (a === slug ? `["'\`]${a}["'\`]` : a)).join("|");
    const attendu = new RegExp(`(print)?[rR]eliabilityNotice\\(\\s*(${ou})|(printReportHeader|renderTextReport|renderHtmlReport|buildReportFrame)\\(\\s*\\{[^}]*tool:\\s*(${ou})`);
    if (!attendu.test(source)) manques.push({ slug, file, raison: "classé heuristique mais n'affiche jamais son propre avertissement (aucun appel nommant ce slug, ni en toutes lettres ni par une constante du fichier)" });
  }
  return manques;
}

// --- QUI ÉMET UN RAPPORT, ET QUI N'EN ÉMET PAS (2026-09-22, tâche #199, demande explicite :
// « assure toi que doc-report est bien pluggé à tous les outils qui emettent un rapport, et que ces
// outils savent qu'ils doivent respecter le format »).
//
// LE CONSTAT MESURÉ QUI L'A MOTIVÉ : 25 scripts écrivent un fichier, 16 seulement figuraient dans
// REGISTRIES. Les 9 autres n'étaient ni déclarés ni écartés — un angle mort, pas une décision. Mais
// en les regardant un par un (Article 19), la plupart n'écrivent PAS un rapport : ils écrivent un
// journal local, un artefact de travail, ou la mise en page d'un rapport appartenant à un autre.
// La vraie correction n'est donc pas de tous les déclarer comme rapports — ce serait remplacer un
// angle mort par une fausse déclaration — mais d'exiger que chacun soit CLASSÉ, rapport ou non,
// avec une raison écrite.
//
// Trois natures, jamais confondues :
//  · "rapport"        — un document destiné à être LU (par l'utilisateur ou par un autre outil) :
//                       doit suivre le gabarit (report-template.mjs, REPORT_CONTRACT) ;
//  · "journal"        — une mémoire machine relue par du code, jamais par un humain (compteurs,
//                       historiques, snapshots) : aucun gabarit à respecter, ce serait du bruit ;
//  · "infrastructure" — n'écrit rien qui lui appartienne (un moteur de rendu, un installeur, un
//                       lanceur de simulation) : rien à formater non plus.
//
// Registre volontairement tenu à la main, comme TOOL_RELIABILITY et pour la même raison (aucune
// mécanique ne peut deviner si un fichier est destiné à un lecteur humain) — et pour la même raison
// accompagné d'un garde-fou mécanique, `findUnclassifiedFileWriters()` (Article 24).
export const FILE_WRITER_NATURES = {
  "scripts/check-house.mjs": { nature: "infrastructure", pourquoi: "filet de tests : son résultat est un code de sortie et une sortie console, les fichiers qu'il écrit sont des relevés de couverture temporaires" },
  "scripts/check-spirit.mjs": { nature: "rapport", pourquoi: "affiche de vraies réponses du modèle destinées à une lecture humaine — le diagnostic de ton" },
  "scripts/gemini-key-health.mjs": { nature: "journal", pourquoi: "tient .gemini-key-health.json, relu par le code de rotation des clés, jamais par un humain" },
  "scripts/html-report.mjs": { nature: "infrastructure", pourquoi: "c'est le moteur de rendu lui-même (doc-HTML) — il met en page le rapport des autres, il n'en a aucun" },
  "scripts/memento-weight.mjs": { nature: "journal", pourquoi: "tient l'historique du poids de contexte par tour, relu par les outils de suivi conso" },
  // Signalé par le garde-fou dès son premier lancement, le soir même de sa création : il ne fait
  // que DÉFINIR renderTextReport(), il ne produit aucun rapport à lui — même statut que html-report.
  // Doc-Report lui-même : il produit bien un rapport lisible (l'index global des rapports du
  // projet, buildDocReportIndex()). Signalé par son propre garde-fou au second lancement — il ne
  // figure dans REGISTRIES qu'en tant que PROPRIÉTAIRE d'autres registres, jamais comme émetteur.
  // Un gardien qui ne se surveille pas lui-même laisserait exactement le trou qu'il traque ailleurs.
  "scripts/doc-report.mjs": { nature: "rapport", pourquoi: "produit l'index global des rapports du projet, destiné à être lu" },
  // Signalé par ce garde-fou le jour même où data-archangel a gagné sa commande `dossier` (#742) —
  // exactement ce pour quoi il existe : un script qui se met à écrire un fichier sans que personne
  // n'ait dit ce que ce fichier EST.
  "scripts/data-archangel.mjs": { nature: "rapport", pourquoi: "sa commande `dossier <sujet>` écrit dans docs/data-archangel/ un dossier destiné à une lecture humaine : toutes les notes déjà prises sur un sujet, rassemblées verbatim, avec l'état réel de chaque ligne de suivi" },
  // Deux arrivants du 2026-09-24, signalés par ce garde-fou le soir même de leur création — et
  // c'est exactement son travail : un script qui écrit sans être classé est un angle mort, jamais
  // une décision.
  "scripts/rapport-gros-prompt.mjs": { nature: "rapport", pourquoi: "produit LE rapport de gros prompt, destiné à être lu point par point par l'utilisateur et répondu de la même façon" },
  "scripts/sauvegarde-projet.mjs": { nature: "rapport", pourquoi: "produit le coffre et la notice de sauvegarde, tous deux livrés à l'utilisateur — la notice est même faite pour être lue par une autre IA" },
  "scripts/report-template.mjs": { nature: "infrastructure", pourquoi: "c'est la définition du gabarit elle-même — il décrit la forme des rapports des autres, il n'en a aucun" },
  "scripts/pnpm-install.mjs": { nature: "infrastructure", pourquoi: "installation des dépendances et des crochets git — aucun constat à présenter" },
  "scripts/run-simulation.mjs": { nature: "infrastructure", pourquoi: "lance une simulation et écrit son journal brut ; le rapport lisible, lui, est produit ensuite par LE-RÉGISSEUR et EL-PROFESSOR" },
  "scripts/the-ghost.mjs": { nature: "rapport", pourquoi: "rend compte du rituel de nuit autonome — ce qui a tourné, ce qui reste — destiné à être lu au réveil" },
  "scripts/tool-usage.mjs": { nature: "journal", pourquoi: "compteur de sollicitations relu par Doc-Report et CASSANDRA-RH, jamais lu tel quel" },
};

// Tout script qui écrit un fichier doit être connu : soit déclaré comme produisant un rapport dans
// REGISTRIES, soit classé explicitement ci-dessus. Ni l'un ni l'autre = un émetteur dans l'ombre.
export function findUnclassifiedFileWriters({ registries = REGISTRIES, natures = FILE_WRITER_NATURES, listDirImpl = (dir) => (existsSync(dir) ? readdirSync(dir) : []), readFileImpl = readFileSync } = {}) {
  const declares = new Set(registries.map((r) => r.scriptPath).filter(Boolean));
  const inconnus = [];
  for (const nom of listDirImpl(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs")).sort()) {
    const chemin = `scripts/${nom}`;
    if (declares.has(chemin) || natures[chemin]) continue;
    let source;
    try { source = readFileImpl(join(ROOT, chemin), "utf8"); } catch { continue; }
    if (/writeFileSync\(|renderHtmlReport\(|renderTextReport\(/.test(source)) inconnus.push(chemin);
  }
  return inconnus;
}

// Les scripts qui DOIVENT suivre le gabarit — ce que pure-gold-unity vérifiera réellement, et ce
// que la fiche de chaque outil doit énoncer. Dérivé, jamais recopié : REGISTRIES + les "rapport"
// ci-dessus, sans jamais une troisième liste à tenir à jour en parallèle.
export function toolsBoundByReportTemplate({ registries = REGISTRIES, natures = FILE_WRITER_NATURES } = {}) {
  const chemins = new Set(registries.map((r) => r.scriptPath).filter(Boolean));
  for (const [chemin, { nature }] of Object.entries(natures)) if (nature === "rapport") chemins.add(chemin);
  return [...chemins].sort();
}

// ————————————————————————————————————————————————————————————————————————
// LE LANCEUR PRÉMATURÉ — un outil qui paraît fini et n'a jamais tourné (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// TROUVÉ DEUX FOIS LE MÊME JOUR, à une heure d'intervalle, et la deuxième fois suffit à en faire
// une règle plutôt qu'un accident (Article 3 : « une règle corrigée une fois ne doit plus jamais
// se reproduire ailleurs sous une autre forme »).
//   · safe-export.mjs : son lanceur était au milieu du fichier, donc main() partait avant que les
//     `const` écrits en dessous n'existent. scanVocabulaire() plantait au premier vrai lancement.
//   · cassandra-rh.mjs : même forme, et la sous-commande `organigramme` mourait sur ORG_RANKS,
//     déclaré deux cents lignes plus bas.
//
// POURQUOI C'EST GRAVE ALORS QUE ÇA SE VOIT TOUT DE SUITE : justement, ça ne se voit PAS tout de
// suite. Les deux fichiers passaient check-house (les tests importent les fonctions, ils
// n'exécutent jamais main()), passaient la relecture, étaient inscrits partout. Le plantage
// n'apparaît qu'au premier lancement réel en ligne de commande — et un outil qu'on ne lance jamais
// n'a jamais montré son défaut. C'est la définition exacte que l'Article 25 donne d'un outil non
// vérifié : « un outil qui n'a jamais tourné contre le vrai dépôt n'est pas un outil vérifié,
// c'est une intention ».
//
// LA RÈGLE MÉCANIQUE : la ligne qui déclenche main() doit être la DERNIÈRE instruction du module.
// Tout ce qui est déclaré après elle est inaccessible au moment où elle part.
export function findLanceursPrematures({ root = ROOT, listDirImpl = readdirSync, readFileImpl = readFileSync } = {}) {
  let fichiers = [];
  try { fichiers = listDirImpl(join(root, "scripts")).filter((f) => f.endsWith(".mjs")); } catch { return []; }
  const ecarts = [];
  for (const f of fichiers) {
    let texte;
    try { texte = readFileImpl(join(root, "scripts", f), "utf8"); } catch { continue; }
    const lignes = texte.split("\n");
    const iLanceur = lignes.findIndex((l) => l.includes("process.argv[1]") && l.includes("import.meta.url") && /\bmain\(\)/.test(l));
    if (iLanceur === -1) continue;
    // CE QUI EST RÉELLEMENT DANGEREUX, ET PAS UNE LIGNE DE PLUS. Première version : toute ligne de
    // code après le lanceur. Elle a signalé check-house.mjs (3 555 lignes après) et doc-report.mjs
    // (114) — deux fichiers qui fonctionnent parfaitement, parce qu'une `function` déclarée est
    // REMONTÉE par JavaScript et reste appelable depuis une ligne écrite au-dessus d'elle.
    //
    // Seuls `const`, `let` et `class` tombent en zone morte temporelle. C'est exactement ce qui a
    // cassé safe-export et cassandra-rh, et rien d'autre. Un garde-fou qui accuse deux fichiers
    // sains sur deux détections perd sa crédibilité au premier passage — et un garde-fou qu'on
    // apprend à ignorer ne garde plus rien.
    // Et seulement au PREMIER NIVEAU du module : une variable locale à une fonction est créée à
    // chaque appel, elle n'a jamais de zone morte vis-à-vis du lanceur. Deuxième resserrement en
    // deux minutes, et la même leçon les deux fois — un détecteur trop large ne trouve pas plus,
    // il rend juste ses vraies trouvailles indiscernables du bruit. L'indentation suffit à
    // trancher : une déclaration de module commence en colonne zéro.
    const apres = lignes.slice(iLanceur + 1)
      .map((l, i) => ({ n: iLanceur + 2 + i, brut: l }))
      .filter(({ brut }) => /^(export\s+)?(const|let|class)\s/.test(brut));
    if (apres.length) {
      ecarts.push({
        fichier: `scripts/${f}`,
        ligneDuLanceur: iLanceur + 1,
        premiereDeclarationInaccessible: apres[0]?.n,
        combien: apres.length,
        pourquoi: `${apres.length} déclaration(s) const/let/class écrites APRÈS le lanceur : au moment où main() part, elles sont en zone morte temporelle. L'outil paraît fini et plante au premier vrai lancement. (Une fonction declaree, elle, est remontee et ne pose aucun probleme.)`,
      });
    }
  }
  return ecarts;
}

// LE LANCEUR EN DERNIER, et ce fichier-ci est le troisième du même jour. Il ne PLANTAIT pas :
// main() ne touche à aucune des trois constantes écrites sous lui. C'est précisément ce qui rend
// le motif dangereux — il ne se manifeste que le jour où quelqu'un ajoute un appel, et le lien
// avec la mise en page du fichier est alors invisible. findLanceursPrematures() ci-dessus le
// signale désormais avant ce jour-là, plutôt qu'après.

// ————————————————————————————————————————————————————————————————————————
// UN RAPPORT QUI POINTE AU LIEU DE DIRE (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// Constat de l'utilisateur sur les rapports livrés de la Ronde du 2026-09-23 : « check-detail est
// vide de contenu data et analytique : est-ce que c'est le cas pour d'autres rapports ? À chaque
// fois je dois avoir un contenu intéressant non ? »
//
// LE DÉFAUT EXACT, et il n'est pas celui qu'on croit. check-tasks-details produisait un vrai
// rapport — en HTML — et n'imprimait sur sa sortie que le CHEMIN de ce fichier plus trois
// compteurs. Le fichier texte livré dans le dossier de la Ronde faisait quatre lignes utiles : il
// pointait vers une donnée au lieu d'en porter une. Or un rapport de Ronde se lit DANS son fichier
// texte, qu'on parcourt et qu'on cite ; un pointeur y est un cul-de-sac.
//
// TROIS CAUSES À NE JAMAIS CONFONDRE, mesurées sur les 26 rapports de cette Ronde :
//   1. le rapport POINTE au lieu de dire (check-tasks-details) — c'est le seul vrai défaut, corrigé ;
//   2. l'agent a lancé la MAUVAISE sous-commande (cassandra-rh sans `rapport` rend son signal léger
//      de deux lignes au lieu de son bilan de 152) — défaut de conduite, pas d'outil ;
//   3. le rapport est COURT PARCE QU'IL N'Y AVAIT RIEN (CLEAN-DIRTY-OLD : « aucune zone signalée »)
//      — et ça, c'est un vrai résultat, jamais un rapport vide. Le confondre avec les deux autres
//      pousserait les outils à meubler pour avoir l'air utiles, exactement la métrique de vanité
//      que ce paysage combat.
//
// CE QUE LE GARDE-FOU PEUT VRAIMENT VOIR : le cas 1 seul, et par un signe précis — un rapport
// court QUI NOMME un autre fichier. Court sans pointer, c'est le cas 3 ; long en pointant, c'est
// un rapport complet qui offre en plus une version HTML (cas légitime, très répandu ici).
export const SEUIL_RAPPORT_MAIGRE = 12;

// LA QUATRIÈME CAUSE, TROUVÉE EN ALLANT VOIR LE FICHIER ACCUSÉ (2026-09-25, tâche #866) : un
// rapport peut être COURT PARCE QUE DENSE. Les trois causes ci-dessus n'avaient pas prévu celle-là,
// et le seul fichier que ce garde-fou accusait dans tout le dépôt en était un exemple parfait :
// 11 lignes utiles, et **42 nombres distincts** — 84 constats, 779 lignes de suivi lues, trente
// numéros de tâches nommés un par un, plus un recoupement entre trois outils. Il mentionne un
// fichier .html par courtoisie, jamais à la place de sa donnée.
//
// COMPTER LES LIGNES EST LE MAUVAIS PROXY quand une seule ligne peut porter vingt-quatre numéros de
// tâches. Ce qui distingue vraiment un pointeur d'un rapport, c'est qu'un pointeur n'a **aucun
// chiffre à lui** au-delà des deux ou trois compteurs qui accompagnent le renvoi.
//
// LE SEUIL EST DÉRIVÉ DE DEUX MESURES RÉELLES, et le dire ainsi vaut mieux que de le présenter
// comme une loi — deux points ne font pas une distribution :
//   · le défaut d'origine documenté juste au-dessus : « quatre lignes utiles » + trois compteurs
//     ≈ 0,75 chiffre par ligne ;
//   · le rapport accusé à tort ce jour-là : 42 chiffres pour 11 lignes ≈ 3,8 par ligne.
// Le seuil est posé entre les deux. Un rapport plus dense que ça porte sa donnée.
export const SEUIL_DENSITE_RAPPORT = 2;

// Séparé de la recherche d'écarts pour pouvoir être testé seul, et pour que la règle se lise.
export function mesurerRapport(texte) {
  // Les lignes d'en-tête communes à tous les rapports (avertissement de fiabilité, identité de
  // session, état du code) ne sont pas du contenu : elles sont identiques partout.
  const utiles = String(texte).split("\n").filter((l) => {
    const t = l.trim();
    if (!t) return false;
    return !/^(⚠️\s+Attention|Version de Claude|Produit le|État du code|Contexte de production|Outil :|Santé de l'outil|Gravité|=+$|-{3,}$)/.test(t);
  }).length;
  const pointe = /Rapport généré|Rapport HTML|écrit dans|\.html\b/.test(texte);
  const chiffres = new Set(String(texte).match(/\b\d+\b/g) ?? []).size;
  return { utiles, pointe, chiffres, densite: utiles ? chiffres / utiles : 0 };
}

function parcourirRapports({ dossier, listDirImpl = readdirSync, readFileImpl = readFileSync }) {
  let fichiers = [];
  try { fichiers = listDirImpl(dossier).filter((f) => f.endsWith(".txt")); } catch { return null; }
  const vus = [];
  for (const f of fichiers) {
    let texte;
    try { texte = readFileImpl(join(dossier, f), "utf8"); } catch { continue; }
    vus.push({ fichier: f, ...mesurerRapport(texte) });
  }
  return vus;
}

export function findRapportsQuiPointent({ dossier, listDirImpl = readdirSync, readFileImpl = readFileSync, seuil = SEUIL_RAPPORT_MAIGRE, seuilDensite = SEUIL_DENSITE_RAPPORT } = {}) {
  const vus = parcourirRapports({ dossier, listDirImpl, readFileImpl });
  if (!vus) return [];
  return vus
    .filter((v) => v.utiles < seuil && v.pointe && v.densite < seuilDensite)
    .map((v) => ({
      fichier: v.fichier, lignesUtiles: v.utiles, chiffres: v.chiffres, densite: v.densite,
      pourquoi: `${v.utiles} ligne(s) de contenu, ${v.chiffres} chiffre(s) à lui, et une référence vers un autre fichier : ce rapport POINTE vers sa donnée au lieu de la porter. Un rapport de Ronde se lit dans son fichier texte — un pointeur y est un cul-de-sac.`,
    }));
}

// findRapportsCourtsMaisDenses() — la QUATRIÈME cause, rendue à part plutôt que mêlée aux écarts.
// Fonction compagne plutôt que changement de signature : `findRapportsQuiPointent` garde exactement
// le sens que ses appelants lui connaissent, et l'information nouvelle s'ajoute sans rien casser.
//
// Ce n'est pas un écart et ce n'est pas non plus rien : c'est le cas que le compte de lignes ne
// sait pas juger seul, et le nommer évite qu'on le redécouvre en le prenant pour un défaut.
export function findRapportsCourtsMaisDenses({ dossier, listDirImpl = readdirSync, readFileImpl = readFileSync, seuil = SEUIL_RAPPORT_MAIGRE, seuilDensite = SEUIL_DENSITE_RAPPORT } = {}) {
  const vus = parcourirRapports({ dossier, listDirImpl, readFileImpl });
  if (!vus) return [];
  return vus
    .filter((v) => v.utiles < seuil && v.pointe && v.densite >= seuilDensite)
    .map((v) => ({
      fichier: v.fichier, lignesUtiles: v.utiles, chiffres: v.chiffres, densite: v.densite,
      pourquoi: `court (${v.utiles} lignes) mais DENSE (${v.chiffres} chiffres à lui, ${v.densite.toFixed(1)} par ligne) : il porte sa donnée, le fichier qu'il mentionne est un complément et non un substitut. Jamais un écart.`,
    }));
}


// ————————————————————————————————————————————————————————————————————————
// « EN GÉNÉRAL » RENDU VÉRIFIABLE : qui écrit un registre sans le déclarer (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// L'utilisateur a demandé quatre moments opportuns pour alimenter le compteur de contributions,
// puis la vraie question : « et en général, comment respecter "en général" ? ». Quatre points de
// câblage ne sont pas une règle générale — c'est une liste, et une liste se périme au cinquième
// outil (Article 24).
//
// CE QUE CE GARDE-FOU FAIT : il lit les scripts, repère ceux qui ÉCRIVENT dans un registre
// (`docs/<outil>/…`) et vérifie qu'ils enregistrent cette écriture. Un nouvel outil qui écrira un
// registre sans le déclarer se signalera tout seul, sans que personne ait à penser à l'ajouter à
// quoi que ce soit — c'est la différence exacte entre une convention tenue à la main et une
// convention vérifiée.
//
// SA LIMITE, déclarée : il repère une écriture par la forme du code (un chemin `docs/x/` passé à
// une fonction d'écriture). Un script qui construirait son chemin autrement lui échappe. Il
// attrape donc le cas courant, jamais tous les cas — et le dire vaut mieux que le laisser croire.
export function findEcrivainsDeRegistreSansContribution({ root = ROOT, listDirImpl = readdirSync, readFileImpl = readFileSync } = {}) {
  let fichiers = [];
  try { fichiers = listDirImpl(join(root, "scripts")).filter((f) => f.endsWith(".mjs")); } catch { return []; }
  const ecarts = [];
  for (const f of fichiers) {
    let texte;
    try { texte = readFileImpl(join(root, "scripts", f), "utf8"); } catch { continue; }
    // Écrit-il vraiment dans un registre ? On cherche une écriture ET un chemin de registre, pas
    // l'un ou l'autre : citer `docs/argus/` dans un commentaire n'est pas écrire dedans.
    // RESSERRÉ IMMÉDIATEMENT (2026-09-23) : la première version testait « le fichier écrit quelque
    // part » ET « le fichier cite un chemin de registre » — deux faits vrais séparément dans
    // report-template.mjs, qui n'écrit en réalité que le fichier de session. Un garde-fou qui
    // accuse à tort perd sa crédibilité, et c'est la troisième fois de la journée que je paie
    // cette leçon. Il faut donc que l'ÉCRITURE ELLE-MÊME vise un registre.
    //
    // Deux formes reconnues, les seules réellement employées ici : un chemin littéral passé à
    // l'écriture, ou une constante définie plus haut comme un chemin de registre puis passée à
    // l'écriture. Ce qui sort de ces deux formes échappe au garde-fou — dit plutôt que masqué.
    const constantesRegistre = [...texte.matchAll(/(?:const|let)\s+([A-Z_][A-Z0-9_]*)\s*=\s*[^;\n]*["'`]docs\/[a-z0-9][a-z0-9-]*\//g)].map((m) => m[1]);
    const appelsEcriture = [...texte.matchAll(/\b(?:writeFileSync|appendFileSync)\s*\(([^;]{0,200})/g)].map((m) => m[1]);
    const ecritDansUnRegistre = appelsEcriture.some((args) =>
      /["'`]docs\/[a-z0-9][a-z0-9-]*\//.test(args) || constantesRegistre.some((c) => new RegExp(`\\b${c}\\b`).test(args))
    );
    if (!ecritDansUnRegistre) continue;
    const declare = /recordRegistryWrite|recordToolContribution/.test(texte);
    if (!declare) ecarts.push({ fichier: `scripts/${f}`, pourquoi: "écrit dans un registre sans enregistrer la contribution — le compteur ne verra jamais que cet outil a été alimenté (recordRegistryWrite déduit le bénéficiaire du chemin, il n'y a rien à nommer)." });
  }
  return ecarts;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
