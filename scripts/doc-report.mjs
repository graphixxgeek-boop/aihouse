// ICEBERG: membre
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

import { sansLesCommentaires } from "./abraham-les-references.mjs";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { lastTouchDays } from "./clean-dirty-old.mjs";
import { toolsNeverUsed, recordCliUsage, horizonDuJournal, formatHorizonLine } from "./tool-usage.mjs";
import { recommendFindBooster } from "./find-booster.mjs";
import { AGENT_CATEGORIES, TOOL_RELIABILITY, printReliabilityNotice, regimeDEcriture, balayerScriptsDesRegistres, rangDeLaCategorie, memeChose, listerLesFichiers, scriptPourSlug, lireFichierPartage, lireLesScriptsDuDepot, sh } from "./lib-shell.mjs";
import { parseToolsTable, slugifyAgentName, primaryToolName } from "./le-coordinateur.mjs";
import { planDactionDepuisEcarts, PLAN_ACTION_TITRE, imprimerPlanDaction } from "./report-template.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// LOCAL_JOURNALS (2026-09-21, question directe de l'utilisateur : « doc-report est-il aussi
// capable d'organiser les journaux locaux, ou faut-il un outil jumeau ? »). Réponse tranchée : le
// MÊME outil, jamais un jumeau — le domaine est identique (inventaire de ce que le réseau d'outils
// produit), seul le TYPE d'artefact diffère. Distinct de REGISTRIES : ces fichiers ne sont JAMAIS
// committés (état/cache local, gitignored, perdu à chaque nouveau conteneur d'exécution) — jamais
// suivis par git, donc jamais par lastTouchDays()/git log ; leur fraîcheur se lit via l'horodatage
// du système de fichiers lui-même (mtime).
// LES QUATRE DOSSIERS QUI NE SONT PAS DES REGISTRES (2026-09-26, tâches #955/#961)
//
// POURQUOI CETTE LISTE EXISTE PLUTÔT QUE QUATRE ENTRÉES DE PLUS CI-DESSUS. Sa consigne était de
// combler les trous ; la combler en déclarant ces quatre-là comme des registres d'outil aurait
// fabriqué un mensonge propre — aucun n'a d'outil producteur, aucun n'a d'index de passages, et le
// verrou « registre hors Ronde » se serait mis à réclamer un item de Ronde pour des archives que
// personne ne produit périodiquement.
//
// UN TROU COMBLÉ PAR UNE RAISON ÉCRITE RESTE UN TROU COMBLÉ : le jour où quelqu'un redemandera
// « pourquoi docs/plans n'a pas d'équipe ? », la réponse est ici, et elle ne dépend de la mémoire
// de personne (Article 27).
export const DOSSIERS_QUI_NE_SONT_PAS_DES_REGISTRES = [
  { path: "docs/plans/", pourquoi: "les plans de chantier — écrits à la main pour un chantier donné, jamais produits passage après passage par un outil. Un plan n'a pas de producteur périodique, donc pas d'équipe propriétaire." },
  { path: "docs/rapports-de-nuit/", pourquoi: "les rapports de nuit autonome — un par nuit travaillée, rédigés par l'agent et non par un outil. Ils se complètent pendant la nuit, ils ne se régénèrent pas." },
  { path: "docs/rapports-gros-prompt/", pourquoi: "les rapports de grosse saisine — même nature : un par saisine, rédigé, jamais produit mécaniquement. Le dossier docs/reponses/, lui, EST un registre : il porte les réponses livrées, produites par scripts/rapport-gros-prompt.mjs." },
  { path: "docs/rapports-verification-froid/", pourquoi: "les vérifications à froid (Article 25) — un dossier par vérification, déclenché par une demande ou une vague de travail, jamais à date fixe et jamais produit par un outil unique : il RASSEMBLE les passages de plusieurs outils et l'analyse qui les lit. Les outils qu'il convoque ont chacun leur propre registre ; celui-ci n'appartient donc à aucune équipe, et le dire vaut mieux que de lui en inventer une (2026-09-27, tâches #436/#773)." },
  { path: "docs/contexte-projet/", pourquoi: "les archives historiques transmises par l'utilisateur lui-même (référentiel d'origine v34, extrait de session, diagnostic initial). Rien ici n'est produit par l'Agence, et rien ne doit l'être : ce sont des pièces d'entrée, jamais des sorties." },
  // LES QUATRE QUE LA GÉNÉRATION D'INDEX A RÉVÉLÉS (2026-09-26, tâche #982). Ils n'ont pas changé
  // de nature : ils ont reçu une TABLE DES MATIÈRES, et le garde-fou reconnaît un registre à la
  // présence d'un `index.md`. C'est lui qui a raison de demander, et la réponse est écrite ici
  // plutôt que le signal étouffé — un dossier de documents avec un sommaire reste un dossier de
  // documents, il ne devient pas le registre d'un outil.
  { path: "docs/referentiel/", pourquoi: "LE référentiel du projet — 112 documents écrits à la main, jamais produits passage après passage. Son index est une table des matières, générée pour que la charte puisse enfin la citer : elle ordonne de vérifier « contre la table des matières réelle de ce dossier », et cette table n'existait pas." },
  { path: "docs/strategies/", pourquoi: "les raisonnements stratégiques sur ce projet, rédigés, jamais produits mécaniquement. Leur sommaire ne leur donne pas de producteur périodique." },
  { path: "docs/templates/", pourquoi: "les gabarits dont sortent les pièces de kit. Un moule n'est pas un registre : il ne s'accumule pas, il sert." },
];

// findDossiersNiRegistreNiDeclares() — LE GARDE-FOU DE CETTE DÉCLARATION (Article 24). Un dossier
// de docs/ qui porte des rapports sans être NI un registre déclaré NI un non-registre déclaré est
// exactement l'angle mort que la classification vient de révéler, et rien ne l'empêchait de se
// reformer au prochain outil.
export function findDossiersNiRegistreNiDeclares(dossiers = [], registres = REGISTRIES, exclus = DOSSIERS_QUI_NE_SONT_PAS_DES_REGISTRES) {
  const connus = new Set([
    ...registres.map((r) => String(r.path ?? "").replace(/\/+$/, "")),
    ...exclus.map((e) => String(e.path ?? "").replace(/\/+$/, "")),
  ]);
  return dossiers.map((d) => String(d).replace(/\/+$/, "")).filter((d) => !connus.has(d));
}

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
  { path: ".banniere-post-commit.txt", owner: "scripts/hooks/banniere.mjs (tâche #798)", purpose: "la bannière COMPLÈTE du dernier commit — le crochet n'affiche que ce qui exige une action (365 lignes ramenées à 9), tout le contexte atterrit ici et se relit à la demande. Écrasé à chaque commit : c'est un journal du DERNIER passage, jamais une archive qui grossirait" },
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
  { slug: "jesus-le-sauveur", label: "JESUS-LE-SAUVEUR", family: "(f) 📜 Les Prophètes - Dette & Structure du code", path: "docs/jesus-le-sauveur/", decision: "texte", scriptPath: "scripts/jesus-le-sauveur.mjs" },
  // check-spirit a produit son PREMIER passage archivé le 2026-09-28 (tâche #810) : jusque-là il
  // affichait ses réponses à l'écran sans rien déposer, donc il n'avait pas de registre — et n'en
  // avait pas besoin. Un transcript de vraies répliques du modèle, lui, ne se rejoue pas : il se
  // garde, parce que c'est la seule trace de ce que les personnages ont RÉELLEMENT dit un jour
  // donné, et que l'Article 0 se juge dessus. Famille Tarantino : c'est la qualité narrative.
  { slug: "check-spirit", label: "check-spirit", family: "(f) 🎬 La Suite Tarantino - Simulation & qualité narrative", path: "docs/check-spirit/", decision: "texte", scriptPath: "scripts/check-spirit.mjs" },
  { slug: "argus", label: "ARGUS", family: "(f) 🛡️ Les Gardiens Sacrés du Code", path: "docs/argus/", decision: "texte", scriptPath: "scripts/check-argus.mjs" },
  { slug: "harmonia", label: "HARMONIA", family: "(f) 🛡️ Les Gardiens Sacrés du Code", path: "docs/harmonia/", decision: "texte", scriptPath: "scripts/check-harmonia.mjs" },
  { slug: "axa-check", label: "AXA-CHECK", family: "(f) 🛡️ Les Gardiens Sacrés du Code", path: "docs/axa-check/", decision: "texte", scriptPath: "scripts/axa-check.mjs" },
  { slug: "clean-dirty-old", label: "CLEAN-DIRTY-OLD", family: "(f) 🛡️ Les Gardiens Sacrés du Code", path: "docs/clean-dirty-old/", decision: "texte", scriptPath: "scripts/clean-dirty-old.mjs" },
  { slug: "always-new-code", label: "ALWAYS-NEW-CODE", family: "(f) 🛡️ Les Gardiens Sacrés du Code", path: "docs/always-new-code/", decision: "texte", scriptPath: "scripts/always-new-code.mjs" },
  { slug: "hyper-scan-checkpoint", label: "HYPER-SCAN-CHECKPOINT", family: "(f) 👑 La Gouvernance Royale", path: "docs/hyper-scan-checkpoint/", decision: "texte", scriptPath: "scripts/hyper-scan-checkpoint.mjs" },
  { slug: "check-level-target", label: "CHECK-LEVEL-TARGET", family: "(f) 👑 La Gouvernance Royale", path: "docs/check-level-target/", decision: "texte", scriptPath: "scripts/check-level-target.mjs" },
  { slug: "the-king", label: "THE-KING", family: "(f) 👑 La Gouvernance Royale", path: "docs/the-king/", decision: "texte", scriptPath: "scripts/the-king.mjs" },
  { slug: "ines-official", label: "INES-official", family: "(f) 👼 Les Anges de la coordination", path: "docs/ines-official/", decision: "texte", scriptPath: "scripts/ines-official.mjs" },
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
  // LES NEUF REGISTRES QUI EXISTAIENT SUR LE DISQUE SANS ÊTRE DÉCLARÉS (2026-09-26, tâches
  // #955/#961, sur sa décision « les combler maintenant »).
  //
  // COMMENT ILS ONT ÉTÉ TROUVÉS, et c'est le premier service rendu par la classification : elle
  // range les rapports par ÉQUIPE PROPRIÉTAIRE en LISANT cette liste — et treize dossiers réels
  // sont sortis « équipe non déclarée ». Ils n'étaient pas cachés : ils étaient simplement
  // invisibles à toute question posée à partir d'ici, ce qui n'est pas la même chose et se
  // ressemble beaucoup. Neuf d'entre eux sont de VRAIS registres d'outil (un index.md, des
  // rapports de passage) ; les quatre autres ne le sont pas, et sont déclarés comme tels dans
  // DOSSIERS_QUI_NE_SONT_PAS_DES_REGISTRES plus bas plutôt qu'ajoutés de force ici.
  //
  // L'EFFET DE BORD, VOULU : le verrou « registre hors Ronde » (circle-tasks.mjs) lit cette liste.
  // Les déclarer, c'est les faire entrer dans le champ de vision de la Ronde.
  { slug: "data-archangel", label: "data-archangel", family: "(f) 👼 Les Anges de la coordination", path: "docs/data-archangel/", decision: "texte", scriptPath: "scripts/data-archangel.mjs" },
  { slug: "god-of-all-process", label: "god-of-all-process", family: "(f) 👼 Les Anges de la coordination", path: "docs/god-of-all-process/", decision: "texte", scriptPath: "scripts/god-of-all-process.mjs" },
  { slug: "angel-of-ia-process", label: "angel-of-ia-process", family: "(f) 👼 Les Anges de la coordination", path: "docs/angel-of-ia-process/", decision: "texte", scriptPath: "scripts/angel-of-ia-process.mjs" },
  { slug: "le-coordinateur", label: "LE-COORDINATEUR", family: "(f) 👼 Les Anges de la coordination", path: "docs/le-coordinateur/", decision: "texte", scriptPath: "scripts/le-coordinateur.mjs" },
  { slug: "doc-report", label: "Doc-Report", family: "(f) 👼 Les Anges de la coordination", path: "docs/doc-report/", decision: "texte", scriptPath: "scripts/doc-report.mjs" },
  // x-port-blindtest (2026-09-26) : sa famille est celle de l'organigramme, jamais celle que son
  // sujet suggère — la leçon coûtée par pure-gold-unity quelques jours plus tôt, où j'avais déduit
  // la famille du thème et où le garde-fou a refusé le commit. Décision « texte » : son rapport est
  // lu au moment d'une Ronde, par quelqu'un qui décide s'il faut réécrire un kit, jamais archivé
  // pour être relu en HTML plus tard.
  { slug: "x-port-blindtest", label: "X-Port BLINDTEST", family: "(f) 👼 Les Anges de la coordination", path: "docs/x-port-blindtest/", decision: "texte", scriptPath: "scripts/x-port-blindtest.mjs" },
  { slug: "reponses", label: "Réponses aux gros prompts", family: "(f) 👼 Les Anges de la coordination", path: "docs/reponses/", decision: "delivery_html", scriptPath: "scripts/rapport-gros-prompt.mjs" },
  // Sa famille est celle de l'organigramme (AGENT_CATEGORIES), jamais celle que son sujet
  // suggère : j'avais écrit « Les Prophètes » parce qu'il traque une dette de forme, et
  // findFamillesDivergentesParOutil() a refusé le commit — l'organigramme le range chez les
  // Anges. C'est exactement le service que ce garde-fou rend : une famille se LIT chez celui
  // qui la déclare, elle ne se déduit pas de ce que fait l'outil (Article 24).
  { slug: "pure-gold-unity", label: "pure-gold-unity", family: "(f) 👼 Les Anges de la coordination", path: "docs/pure-gold-unity/", decision: "texte", scriptPath: "scripts/pure-gold-unity.mjs" },
  { slug: "tableau-de-bord", label: "Tableau de bord interne (KPI)", family: "(f) 👑 La Gouvernance Royale", path: "docs/tableau-de-bord/", decision: "texte", scriptPath: "scripts/kpi-report.mjs" },
  { slug: "sauvegardes", label: "Sauvegardes du projet", family: "(f) 👑 La Gouvernance Royale", path: "docs/sauvegardes/", decision: "texte", scriptPath: "scripts/sauvegarde-projet.mjs" },
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
  { slug: "filet-en-parts", label: "FILET-EN-PARTS", family: "(f) 📜 Les Prophètes - Dette & Structure du code", path: "docs/filet-en-parts/", decision: "texte", scriptPath: "scripts/filet-en-parts.mjs" },
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
export function findOrphanReportFiles(registries = REGISTRIES.filter((r) => REPORT_PER_RUN_REGISTRIES.includes(r.slug)), { listDirImpl = (dir) => (existsSync(dir) ? readdirSync(dir) : []), readFileImpl = lireFichierPartage, existsImpl = existsSync } = {}) {
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

function readScriptSource(scriptPath, readFileImpl = lireFichierPartage) {
  try {
    return readFileImpl(join(ROOT, scriptPath), "utf8");
  } catch {
    return null;
  }
}

// Vrai seulement si le script producteur importe réellement html-report.mjs (grep du texte source,
// jamais une présomption sur le nom de l'outil). Un scriptPath introuvable rapporte `undefined`
// (jamais confondu avec `false` — "on ne sait pas" n'est pas "l'outil ne le fait pas").
// ————————————————————————————————————————————————————————————————————————
// LA PAGE HTML EST-ELLE ENCORE CELLE DE SA SOURCE ? (2026-09-29, tâche #1218)
// ————————————————————————————————————————————————————————————————————————
//
// LA RÈGLE EXISTAIT, RIEN NE LA VÉRIFIAIT. L'index du grand projet le dit noir sur blanc : les
// pages HTML sont « RÉGÉNÉRÉES depuis le Markdown par doc-HTML, jamais écrites à la main ». Une
// règle est bien posée, et personne ne regardait si une page correspondait encore à sa source. Or
// c'est le genre de dérive parfaitement silencieuse : la page s'ouvre, elle est belle, elle est
// complète — elle dit simplement autre chose que le document dont elle se réclame.
//
// CE QUI L'A MOTIVÉE, ET C'ÉTAIT UN CAS RÉEL : le dossier de décisions livré le matin annonçait
// trois chiffres qui avaient bougé dans la nuit (tâche #1217). Il a fallu le vérifier À LA MAIN,
// page par page, et ce geste-là ne se refera pas tout seul demain (Article 31).
//
// LE PIÈGE À ÉVITER, ET IL AURAIT RENDU CET OUTIL FAUX : comparer les dates de MODIFICATION des
// fichiers. Dans un dépôt fraîchement cloné, tous les fichiers portent la même date — celle du
// clone — donc la comparaison rendrait « tout est à jour » sur un dépôt où rien n'a été vérifié.
// C'est la date du dernier COMMIT qui fait foi, et elle se lit sur git.
//
// CE QU'IL NE FAIT PAS : il ne compare pas les CONTENUS. Une page régénérée après coup sans que sa
// source ait changé lui paraît à jour, et c'est correct ; une source modifiée puis remise à
// l'identique aussi. Il repère le cas courant — on a édité le document et oublié de régénérer la
// page — jamais tous les cas.
export const DOSSIER_PAGES_HTML = "docs/grand-projet/html";
export const EXTENSIONS_DE_SOURCE = [".md", ".txt"];

// LA SOURCE SE LIT DANS LA PAGE, ELLE NE SE DEVINE PAS DU NOM DE FICHIER (Article 24). Le
// générateur écrit lui-même « Dérivé de <source> par doc-HTML » en pied de page : c'est une
// déclaration, et la lire vaut infiniment mieux que de rapprocher deux noms qui se ressemblent.
// Le premier passage l'a prouvé : le rapport de nuit s'appelle `rapport-de-nuit-2026-09-29.html`
// et sa source `2026-09-29-rapport.txt` — les mêmes mots dans l'autre sens, donc introuvable par
// rapprochement de noms, et parfaitement lisible dans le pied de page.
export const MOTIF_SOURCE_DECLAREE = /Dérivé de ([^\s<]+?) par doc-HTML/;

export function sourceDeclareeDansLaPage(html = "") {
  return String(html).match(MOTIF_SOURCE_DECLAREE)?.[1] ?? null;
}

export function trouverLaSource(base, { root = ROOT, listerImpl = listerLesFichiers } = {}) {
  const candidats = listerImpl(["docs"], { root, garder: (nom) => EXTENSIONS_DE_SOURCE.some((e) => nom.endsWith(e)) })
    .filter((c) => !c.includes(`${DOSSIER_PAGES_HTML}/`))
    .filter((c) => {
      const nom = c.split("/").pop();
      return EXTENSIONS_DE_SOURCE.some((e) => nom === `${base}${e}`) || EXTENSIONS_DE_SOURCE.some((e) => nom.startsWith(`${base}-`) && nom.endsWith(e));
    });
  return candidats.sort()[0] ?? null;
}

export function findPagesHtmlPerimees({ root = ROOT, listDirImpl = readdirSync, shImpl = sh, listerImpl = listerLesFichiers, readFileImpl = lireFichierPartage } = {}) {
  let pages;
  try { pages = listDirImpl(join(root, DOSSIER_PAGES_HTML)).filter((f) => f.endsWith(".html")); } catch { return null; }
  const quand = (chemin) => {
    try { return String(shImpl(`git log -1 --format=%cI -- ${chemin}`, { cwd: root })).trim(); } catch { return ""; }
  };
  const perimees = [];
  const sansSource = [];
  // TROISIÈME ÉTAT, AJOUTÉ LE 2026-09-29 (tâche #1233) — ET C'EST MON PROPRE GARDE-FOU QUI
  // CONFONDAIT DEUX CHOSES. Une page tout juste générée n'a pas encore de date de commit, et elle
  // tombait dans `sansSource`, c'est-à-dire dans « page dont la source est introuvable » — un vrai
  // défaut. Or une page JAMAIS COMMITÉE ne peut pas être périmée : elle est plus neuve que tout.
  // Encore un signal ADJACENT (pas de date) lu comme le signal visé (pas de source), dans un outil
  // que j'ai écrit hier. Le mélange faisait échouer le filet à chaque page neuve, c'est-à-dire
  // exactement au moment où on en crée une — un garde-fou qui accuse le geste normal (leçon L4).
  const pasEncoreCommitees = [];
  for (const page of pages.sort()) {
    const base = page.replace(/\.html$/, "");
    // La déclaration du générateur fait foi ; le rapprochement de noms n'est que le repli.
    let declaree = null;
    try { declaree = sourceDeclareeDansLaPage(readFileImpl(join(root, DOSSIER_PAGES_HTML, page), "utf8")); } catch { declaree = null; }
    const source = declaree ?? trouverLaSource(base, { root, listerImpl });
    if (!source) { sansSource.push(page); continue; }
    const dPage = quand(`${DOSSIER_PAGES_HTML}/${page}`);
    const dSource = quand(source);
    // UNE DATE MANQUANTE N'EST PAS UNE DATE ANCIENNE (leçon L5) : sans les deux, on s'abstient.
    // Mais on distingue POURQUOI elle manque : une page neuve (la source, elle, est datée) est un
    // état transitoire bénin ; les deux dates manquantes, c'est git qui ne répond pas.
    // LE CRITÈRE JUSTE EST PLUS SIMPLE QUE MON PREMIER JET, et il est logiquement étanche :
    // « périmée » veut dire « plus ANCIENNE que sa source ». Une page qui n'a aucun commit vient
    // d'être écrite à l'instant : elle est, par construction, la chose la plus récente du dépôt.
    // Elle ne peut donc être périmée par rapport à RIEN — que sa source soit datée ou non.
    if (!dPage) { pasEncoreCommitees.push(page); continue; }
    // ET LE MÊME DÉFAUT UNE COUCHE PLUS LOIN (2026-09-30, tâche #1258) — trouvé deux heures après
    // avoir écrit le commentaire ci-dessus, par le geste le plus banal qui soit : modifier une
    // source, régénérer sa page, et vouloir committer les deux ensemble. La page RÉGÉNÉRÉE porte
    // encore la date de son ANCIEN commit, donc elle paraît plus vieille que sa source, donc le
    // filet la déclare périmée — et le crochet refuse le commit qui l'aurait justement remise à
    // jour. Le garde-fou bloquait la seule façon correcte de le satisfaire.
    //
    // C'EST LA TROISIÈME FORME DU MÊME SIGNAL ADJACENT, dans le même outil, dans la même nuit :
    // « pas de date de commit » lu comme « pas de source », puis « date de commit ancienne » lu
    // comme « contenu ancien ». La date d'un commit ne dit rien du contenu du fichier sur le
    // disque ; elle dit seulement quand il a été enregistré pour la dernière fois.
    //
    // LE CRITÈRE JUSTE, et il est du même genre que celui d'au-dessus : une page dont le disque
    // diffère de sa version enregistrée vient d'être réécrite. Elle est donc, par construction,
    // plus récente que n'importe quel commit — y compris celui de sa source.
    if (aDesModifsNonCommitees(`${DOSSIER_PAGES_HTML}/${page}`, { shImpl, root })) { pasEncoreCommitees.push(page); continue; }
    // L'inverse, lui, reste une abstention honnête : la page est datée, la source ne l'est pas, donc
    // la comparaison est impossible et on ne conclut pas (leçon L5).
    if (!dSource) { sansSource.push(`${page} (source sans date de commit)`); continue; }
    if (dSource > dPage) perimees.push({ page, source, dPage, dSource });
  }
  return { perimees, sansSource, pasEncoreCommitees, examinees: pages.length };
}

// UN FICHIER MODIFIÉ SUR LE DISQUE N'EST PAS UN FICHIER ANCIEN (2026-09-30, tâche #1258).
// Rendue injectable comme tout le reste de ce fichier, pour que le filet puisse la faire répondre
// oui ET non sans dépendre de l'état réel du dépôt au moment où il tourne (leçon L40).
// En cas de doute — git muet, erreur — on rend FALSE : on préfère un signalement de trop qu'une
// page périmée qui passerait inaperçue, et le sens de l'erreur est écrit plutôt que subi.
export function aDesModifsNonCommitees(chemin, { shImpl = sh, root = ROOT } = {}) {
  try { return String(shImpl(`git status --porcelain -- ${chemin}`, { cwd: root })).trim().length > 0; }
  catch { return false; }
}

export function formatPagesHtmlPerimeesLines(r) {
  if (!r) return ["PAGES HTML — 🚨 PAS MESURÉ : le dossier des pages n'a pas pu être listé. Ce n'est pas un zéro."];
  const l = [];
  if (r.sansSource.length) l.push(`  ⚠️ ${r.sansSource.length} page(s) dont la source n'a pas été retrouvée, donc NON vérifiées : ${r.sansSource.join(", ")} — le compte ci-dessous est un PLANCHER.`);
  const neuves = r.pasEncoreCommitees ?? [];
  if (neuves.length) l.push(`  📄 ${neuves.length} page(s) tout juste générée(s), pas encore commitée(s) : ${neuves.join(", ")} — plus neuves que leur source par construction, rien à signaler.`);
  if (!r.perimees.length) {
    l.push(`PAGES HTML : les ${r.examinees - r.sansSource.length - neuves.length} page(s) vérifiée(s) sont à jour avec leur source.`);
    return l;
  }
  l.push(`⚠️ ${r.perimees.length} page(s) HTML plus ancienne(s) que leur source, sur ${r.examinees} :`);
  for (const p of r.perimees) l.push(`  · ${p.page} — ${p.source} a été commis le ${p.dSource.slice(0, 16)}, la page le ${p.dPage.slice(0, 16)} : la page dit autre chose que le document dont elle se réclame`);
  l.push("  Elles se régénèrent, jamais ne se corrigent à la main : `node scripts/html-report.mjs document <source> <page>`.");
  return l;
}

export function checkHtmlWiring(scriptPath, readFileImpl = lireFichierPartage) {
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
export function auditHtmlDecisions(registries = REGISTRIES, readFileImpl = lireFichierPartage) {
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

// ————————————————————————————————————————————————————————————————————————
// LA DÉCISION SE DÉRIVE, ELLE NE SE RECOPIE PAS (2026-09-26, tâche #926)
// ————————————————————————————————————————————————————————————————————————
//
// LE CONSTAT QUI L'A MOTIVÉE : findRegistriesMissingDecision() comptait 24 dossiers sans décision
// HTML/texte enregistrée, et son plan proposait 24 fois « trancher la décision de docs/X et
// l'inscrire au registre ». Vingt-quatre lignes à recopier à la main dans REGISTRIES — c'est-à-dire
// très exactement la liste tenue à la main que l'Article 24 interdit, et qui se périmerait au
// prochain dossier créé. Le garde-fou censé attraper la dette en produisait une.
//
// CE QUI EST RÉELLEMENT DÉRIVABLE, et c'est la majorité : un dossier `docs/<slug>/` dont le script
// `scripts/<slug>.mjs` existe répond tout seul à la question — si ce script importe html-report.mjs
// il livre en HTML (`delivery_html`), sinon il livre en texte (`texte`). Ce n'est pas une
// supposition sur le nom : c'est le CODE du producteur, lu.
//
// CE QUI N'EST PAS DÉRIVABLE, ET QUI SE DÉCLARE PLUTÔT QUE SE DEVINER (leçon L5) : un dossier sans
// script du même nom peut être deux choses opposées, et aucune mécanique ne les sépare —
//   · un dossier de DOCUMENTS (docs/plans, docs/reponses, docs/templates, docs/rapports-de-nuit),
//     qui n'a aucune décision de format à prendre parce qu'aucun outil ne le remplit ;
//   · le registre d'un outil dont le SCRIPT PORTE UN AUTRE NOM — et ce n'est pas théorique :
//     `docs/smart-breaker/` est produit par `check-gemini-quota.mjs`, `docs/tableau-de-bord/` par
//     `kpi-report.mjs`. Un outil qui trancherait « pas un registre » sur ces deux-là se tromperait.
// L'outil rend donc un TROISIÈME état, « à déclarer », avec la raison — jamais un verdict inventé
// sur la moitié qu'il ne peut pas voir.
export const DECISION_DERIVEE = "dérivée du code du script producteur";
export const DECISION_A_DECLARER = "aucun script du même nom : indécidable mécaniquement";

// QUI NOMME CE DOSSIER ? — l'indice qui rend chaque cas indécidable DIFFÉRENT des autres.
//
// Sans lui, les dix dossiers non dérivables recevaient la MÊME phrase, recopiée dix fois. C'est le
// travers que ce projet refuse partout ailleurs (cf. le motif de CLONE-HUNTER, tâche #217) : une
// raison unique répétée renvoie au lecteur la décision qu'on avait de quoi éclairer.
//
// SA LIMITE EST IMPRIMÉE AVEC LUI, jamais tue : « nommer » n'est pas « écrire dedans ». Un script
// qui cite le chemin PEUT s'en servir comme il peut seulement le mentionner — c'est une borne
// HAUTE, exactement la même nuance que data-archangel imprime déjà sur sa propre mesure. La preuve
// d'écriture demanderait d'instrumenter l'exécution, pour un gain nul ici : ce qu'on cherche n'est
// pas un verdict, c'est de quoi trancher à la main en connaissance de cause.
//
// DEUX EXCLUSIONS, et elles ont chacune leur raison : la suite de tests (check-house.mjs) nomme à
// peu près tout le dépôt, donc la compter ferait dire « nommé » de n'importe quoi ; et doc-report
// lui-même se citerait dans sa propre mesure — le bug auto-référentiel que ce dépôt a déjà payé
// cinq fois.
export const SCRIPTS_HORS_INDICE = new Set(["scripts/check-house.mjs", "scripts/doc-report.mjs"]);

export function scriptsQuiNommentLeDossier(slug, { listDirImpl = readdirSync, readFileImpl = lireFichierPartage, root = ROOT, horsIndice = SCRIPTS_HORS_INDICE } = {}) {
  let fichiers = [];
  try { fichiers = listDirImpl(join(root, "scripts")).filter((f) => f.endsWith(".mjs")); } catch { return null; }
  const trouves = [];
  for (const f of fichiers) {
    const chemin = `scripts/${f}`;
    if (horsIndice.has(chemin)) continue;
    let src = "";
    try { src = readFileImpl(join(root, chemin), "utf8"); } catch { continue; }
    if (src.includes(`docs/${slug}`)) trouves.push(chemin);
  }
  return trouves;
}

export function derivedDecisionForSlug(slug, { existsImpl = existsSync, readFileImpl = lireFichierPartage, listDirImpl = readdirSync, root = ROOT } = {}) {
  const scriptPath = `scripts/${slug}.mjs`;
  const abs = join(root, scriptPath);
  if (!existsImpl(abs)) {
    const nomme = scriptsQuiNommentLeDossier(slug, { listDirImpl, readFileImpl, root });
    // `null` ⇒ le dossier scripts/ n'a pas pu être lu : on le DIT, jamais un « personne ne le nomme »
    // qui serait la même sortie qu'une vraie absence (leçon L5).
    const indice = nomme === null
      ? "et l'indice « qui le nomme ? » n'a PAS PU être mesuré (dossier scripts/ illisible) — ce n'est pas « personne »"
      : nomme.length
        ? `mais ${nomme.length} script(s) le nomment : ${nomme.join(", ")} — piste sérieuse d'un registre d'outil au nom différent (borne HAUTE : nommer n'est pas écrire dedans)`
        : "et AUCUN script ne le nomme — piste sérieuse d'un dossier de DOCUMENTS, qui n'a aucune décision de format à prendre";
    return {
      slug, scriptPath: null, decision: null, derivable: false, nommePar: nomme,
      pourquoi: `${DECISION_A_DECLARER}, ${indice}`,
    };
  }
  let source = "";
  try { source = readFileImpl(abs, "utf8"); } catch { /* illisible : traité comme indécidable, jamais comme "texte" par défaut */ }
  if (!source) {
    return { slug, scriptPath, decision: null, derivable: false, pourquoi: `${scriptPath} existe mais n'a pas pu être lu — un fichier illisible n'est jamais un fichier sans HTML` };
  }
  const html = /html-report\.mjs/.test(source);
  return {
    slug, scriptPath, derivable: true,
    decision: html ? "delivery_html" : "texte",
    pourquoi: html
      ? `${DECISION_DERIVEE} : ${scriptPath} importe html-report.mjs`
      : `${DECISION_DERIVEE} : ${scriptPath} n'importe pas html-report.mjs`,
  };
}

// Le remplaçant du « trancher 24 fois » : pour chaque dossier sans décision enregistrée, on DÉRIVE
// quand c'est possible et on NOMME ce qui reste. Le compte des deux moitiés est imprimé, parce
// qu'un outil qui ne dirait que la moitié dérivée laisserait croire le travail fini.
export function deriverLesDecisionsManquantes(realDocsDirs, { registries = REGISTRIES, nonRegistres = DOSSIERS_QUI_NE_SONT_PAS_DES_REGISTRES, existsImpl = existsSync, readFileImpl = lireFichierPartage, listDirImpl = readdirSync, root = ROOT } = {}) {
  // LES NON-REGISTRES SORTENT DE L'ÉCART, et c'est une correction de cause plutôt qu'un
  // ajustement de seuil (2026-09-26). Une décision HTML/texte est une décision de FORMAT DE
  // RAPPORT : un dossier de plans écrits à la main, ou les archives d'entrée transmises par
  // l'utilisateur, n'en ont aucune à prendre. Les compter dans « reste à déclarer » gonflait
  // l'écart d'items qu'on ne pourra jamais déclarer, ce qui fait baisser le taux de dérivation
  // sans qu'aucun progrès n'y change rien — un dénominateur qu'on ne peut pas faire descendre.
  const horsChamp = new Set((nonRegistres ?? []).map((e) => String(e.path ?? "").replace(/\/+$/, "")));
  const manquants = findRegistriesMissingDecision(realDocsDirs, registries).filter((d) => !horsChamp.has(String(d).replace(/\/+$/, "")));
  const derivees = [], aDeclarer = [];
  for (const dir of manquants) {
    const slug = dir.replace(/^docs\//, "").replace(/\/$/, "");
    const d = derivedDecisionForSlug(slug, { existsImpl, readFileImpl, listDirImpl, root });
    (d.derivable ? derivees : aDeclarer).push({ ...d, path: `${dir}/` });
  }
  return { total: manquants.length, derivees, aDeclarer };
}

export function formatDecisionsDeriveesLines(r) {
  const L = [];
  L.push(`${r.total} dossier(s) sans décision HTML/texte enregistrée — ${r.derivees.length} DÉRIVÉE(S) du code réel, ${r.aDeclarer.length} à déclarer à la main.`);
  if (r.derivees.length) {
    L.push("");
    L.push("  DÉRIVÉES (aucune main nécessaire — la décision se relit à chaque passage, elle ne se périme pas) :");
    for (const d of r.derivees) L.push(`    · ${d.path} → ${d.decision} (${d.pourquoi})`);
  }
  if (r.aDeclarer.length) {
    L.push("");
    L.push("  À DÉCLARER (l'outil REFUSE de trancher, et dit pourquoi — jamais un verdict inventé) :");
    for (const d of r.aDeclarer) L.push(`    · ${d.path} — ${d.pourquoi}`);
  }
  return L;
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
export function scriptRecordsItsUsage(scriptPath, readFileImpl = lireFichierPartage) {
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
export function buildDocReportIndex({ registries = REGISTRIES, usageHistory = { events: [] }, readFileImpl = lireFichierPartage } = {}) {
  const audited = auditHtmlDecisions(registries, readFileImpl);
  const neverUsed = new Set(toolsNeverUsed(usageHistory, registries.map((r) => r.slug)));
  // L'HORIZON DU JOURNAL, ATTACHÉ AU CHIFFRE (2026-09-30, tâche #1283). Le bloc ci-dessous
  // distingue déjà « jamais lancé » de « aucun point d'enregistrement » — deux états au lieu
  // d'un, et c'était le bon correctif. Il lui manquait le TROISIÈME : le journal lui-même est
  // dans .gitignore, donc il se reconstruit à chaque conteneur. Un outil peut avoir tourné
  // vingt fois la semaine dernière et n'apparaître nulle part. Mesuré le 2026-09-30 : 23 h de
  // mémoire pour un dépôt de deux semaines. horizonDuJournal() existait depuis la veille et
  // n'était câblé que chez tool-brain — un remède écrit et non câblé est une intention (L2).
  const horizon = horizonDuJournal(usageHistory);
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
  return { rows, byFamily, mismatches, horizon };
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
  const { rows, byFamily, mismatches, horizon } = buildDocReportIndex({ usageHistory });
  console.log("=== Doc-Report — index global des rapports (gardien HTML/texte, tâche #165) ===\n");
  // La phrase de lecture AVANT les chiffres qu'elle qualifie : mise après, elle arrive quand le
  // lecteur a déjà conclu. Le tiret d'échelle (heures du dépôt) est volontairement absent ici —
  // Doc-Report ne connaît pas l'âge du dépôt, et l'inventer pour faire joli serait pire que rien.
  console.log(`${formatHorizonLine(horizon)}\n`);
  for (const [family, familyRows] of byFamily) {
    console.log(`-- ${family} --`);
    for (const r of familyRows) {
      const decisionLabel = r.decision === "delivery_html" ? "remise HTML" : r.decision === "archived_html" ? "archive HTML" : "texte";
      const wiredLabel = r.wired === false ? " [ÉCART : non câblé]" : "";
      const neverLabel = r.sansPointDEnregistrement
        ? " [aucun point d'enregistrement dans son script — le compteur ne peut rien voir, ce n'est PAS un constat de désusage]"
        : r.neverSolicited ? " [aucun passage vu sur la fenêtre du compteur — voir l'horizon imprimé en tête de cet index, ce n'est PAS « jamais utilisé par le projet »]" : "";
      console.log(`  ${r.label} — ${decisionLabel}${wiredLabel} — dernier rapport : ${formatDays(r.ageDays)}${neverLabel}`);
    }
  }
  const realDocsDirs = readdirSync(join(ROOT, "docs"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => `docs/${e.name}`);
  // LA DÉRIVATION REMPLACE LA LISTE DE NOMS (2026-09-26, tâche #926). L'ancienne sortie énumérait
  // les dossiers et laissait 24 décisions à recopier à la main dans REGISTRIES ; celle-ci en
  // TRANCHE la majorité en relisant le code du script producteur, et NOMME le reste avec la raison
  // pour laquelle aucune mécanique ne peut le trancher.
  const decisions = deriverLesDecisionsManquantes(realDocsDirs);
  if (decisions.total) {
    console.log("");
    for (const ligne of formatDecisionsDeriveesLines(decisions)) console.log(ligne);
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
    // LA VARIABLE `missing` N'EXISTAIT PLUS (corrigé le 2026-09-26, tâche #919). Elle a été
    // remplacée par `decisions` en tâche #926 et cette ligne, restée derrière, faisait planter
    // main() sur un ReferenceError — donc **le plan d'action de doc-report n'a jamais été
    // imprimé une seule fois** depuis ce changement, le jour même. Trouvé en lançant l'outil pour
    // de vrai, jamais en relisant le diff : c'est exactement ce que l'Article 25 demande, et
    // exactement ce que je n'avais pas fait. Seules les décisions qu'AUCUNE mécanique ne peut
    // trancher deviennent une tâche — les 13 dérivées n'en demandent aucune.
    ...decisions.aDeclarer.map((d) => ({ fichier: d.path ?? d.slug, defaut: `décision HTML/texte indécidable mécaniquement — ${d.pourquoi}`,
      tache: `trancher la décision HTML/texte de ${d.path ?? d.slug} et l'inscrire au registre`, fausseUneMesure: false })),
    ...mismatches.map((m2) => ({ fichier: m2.label, defaut: "la décision enregistrée ne correspond pas au code réel",
      tache: `réaligner ${m2.label} : corriger le registre ou le code, selon lequel des deux a raison`, fausseUneMesure: true })),
    ...missingFromGitignore.map((j) => ({ fichier: j, defaut: "journal local absent de .gitignore — risque de fuite au prochain commit",
      tache: `ajouter ${j} à .gitignore AVANT le prochain commit`, fausseUneMesure: true })),
    ...undeclared.map((j) => ({ fichier: j, defaut: "entrée de .gitignore ressemblant à un journal local, jamais déclarée dans LOCAL_JOURNALS",
      tache: `déclarer ${j} dans LOCAL_JOURNALS, ou écrire pourquoi il n'en est pas un`, fausseUneMesure: false })),
  ];
  // ————————————————————————————————————————————————————————————————————
  // TROIS DÉTECTEURS QUI NE PARLAIENT NULLE PART (2026-09-26, tâche #919)
  // ————————————————————————————————————————————————————————————————————
  // Ils existaient, ils étaient testés, et AUCUN CODE HORS DE LA SUITE DE TESTS NE LES APPELAIT —
  // leçon L2 : un mécanisme qui ne sort pas du script est une intention. La distinction qui décide
  // de leur place est celle de la tâche : un garde-fou qui protège un invariant du CODE appartient
  // aux tests et nulle part ailleurs ; un garde-fou qui dit quelque chose sur LE PROJET doit parler
  // dans le rapport que lit un humain. Ces trois-là parlent du projet.
  //
  // CE QUE LE CÂBLAGE AJOUTE, ALORS QUE LE TEST EXISTE DÉJÀ : le test casse un commit le jour où
  // l'écart apparaît, mais le rapport, lui, ne disait RIEN de ces trois dimensions — ni écart, ni
  // vérification. Une dimension absente du rapport se lit comme une dimension qui n'existe pas, et
  // ce projet tient qu'une absence de mesure n'est jamais une mesure rassurante.
  //
  // UNE LIGNE CHACUN QUAND TOUT VA BIEN, jamais trois sections : sept sections bruyantes d'un coup
  // seraient une régression (leçon L6, une alarme permanente fait dépendre d'elle).
  let tableMaitresse = "";
  try { tableMaitresse = readFileSync(join(ROOT, "docs/regles-de-travail.md"), "utf8"); } catch { /* déclaré ci-dessous */ }
  console.log("\n=== TROIS VÉRIFICATIONS QUI NE SORTAIENT JAMAIS D'ICI (tâche #919) ===");
  const ecartsMuets = [];
  if (!tableMaitresse) {
    // L5/L11 : « pas lu » ne se dit jamais comme « rien trouvé ».
    console.log("❓ PAS MESURÉ — docs/regles-de-travail.md illisible : les deux vérifications qui en dépendent n'ont pas tourné, ce qui n'est pas la même chose qu'un résultat propre.");
  } else {
    const sansFiabilite = findToolsMissingReliability(tableMaitresse);
    console.log(sansFiabilite.length
      ? `🔴 ${sansFiabilite.length} outil(s) de la table maîtresse sans classification de fiabilité : ${sansFiabilite.join(", ")}`
      : "✅ Chaque outil de la table maîtresse porte une classification de fiabilité.");
    for (const o of sansFiabilite) ecartsMuets.push({ fichier: o, defaut: "outil de la table maîtresse sans classification de fiabilité", tache: `classer ${o} dans TOOL_RELIABILITY, ou écrire pourquoi il n'en a pas besoin`, fausseUneMesure: true });

    const introuvables = findUnnavigableSections(tableMaitresse);
    console.log(introuvables.length
      ? `🔴 ${introuvables.length} section(s) devenue(s) introuvable(s) faute de sommaire : ${introuvables.map((x) => x.titre ?? x).join(" · ")}`
      : "✅ Aucune section du document de travail n'est devenue introuvable faute de sommaire.");
    for (const x of introuvables) ecartsMuets.push({ fichier: String(x.titre ?? x), defaut: "section longue sans sommaire — on ne peut y trouver quoi que ce soit sans tout lire", tache: `ajouter un sommaire à la section « ${x.titre ?? x} »`, fausseUneMesure: false });
  }
  const sansAvertissement = findHeuristicToolsWithoutNotice();
  console.log(sansAvertissement.length
    ? `🔴 ${sansAvertissement.length} outil(s) déclaré(s) heuristique(s) dont le code ne prononce jamais son avertissement : ${sansAvertissement.map((x) => x.slug ?? x).join(", ")}`
    : "✅ Chaque outil déclaré heuristique prononce réellement son avertissement de marge.");
  for (const x of sansAvertissement) ecartsMuets.push({ fichier: String(x.slug ?? x), defaut: "déclaré heuristique et son code ne dit jamais son avertissement — une protection écrite qui ne sort jamais", tache: `faire prononcer son avertissement à ${x.slug ?? x}, ou corriger sa classification`, fausseUneMesure: true });

  // LA PAGE HTML EST-ELLE ENCORE CELLE DE SA SOURCE ? (2026-09-29, tâche #1218.) La règle « les
  // pages sont régénérées depuis le Markdown, jamais écrites à la main » était posée et rien ne la
  // vérifiait. Une page périmée s'ouvre, elle est belle, elle est complète — elle dit simplement
  // autre chose que le document dont elle se réclame.
  const pagesHtml = findPagesHtmlPerimees();
  for (const l of formatPagesHtmlPerimeesLines(pagesHtml)) console.log(l);
  for (const p of pagesHtml?.perimees ?? []) ecartsMuets.push({ fichier: `${DOSSIER_PAGES_HTML}/${p.page}`, defaut: `plus ancienne que sa source ${p.source} : la page dit autre chose que le document dont elle se réclame`, tache: `régénérer la page depuis sa source — node scripts/html-report.mjs document ${p.source} ${DOSSIER_PAGES_HTML}/${p.page}`, fausseUneMesure: false });

  const planDoc = planDactionDepuisEcarts([...ecartsDocReport, ...ecartsMuets], { toolSlug: "doc-report",
    libelle: (e) => `${e.fichier} — ${e.defaut}`,
    tache: (e) => e.tache });
  imprimerPlanDaction(planDoc);
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
    .map((row) => ({ tool: row.tool, slug: slugifyAgentName(primaryToolName(row.tool)) }))
    .filter(({ slug }) => !known.has(slug));
}

// (2) Un outil classé "heuristique" dont le script n'affiche en réalité jamais l'avertissement.
// C'est LE défaut que cette tâche corrige : la nuance existait dans la tête de l'outil, pas dans sa
// sortie. Une classification sans affichage ne vaut rien — elle ne fait que déplacer le mensonge.
// `scriptFor` associe un slug à son fichier ; un outil dont le script est introuvable est signalé
// comme tel plutôt que silencieusement passé (une absence n'est jamais une conformité).
// 2026-09-27, tâche #993 : cette table était une MAP de 42 entrées recopiées à la main — et
// `TOOL_RELIABILITY`, le registre qu'elle sert, en déclare SOIXANTE-HUIT. Vingt-six outils
// déclarés fiables n'avaient donc aucun script associé : le contrôle passait dessus sans rien dire,
// parce que sa portée était celle de la table, jamais celle du registre.
//
// Elle se DÉRIVE désormais du registre lui-même, chemin compris (`scriptPourSlug`, lib-shell : 57
// des 68 ont pour script `scripts/<slug>.mjs`, les 11 exceptions vivent à un seul endroit). Deux
// garanties mesurées avant de remplacer quoi que ce soit : les 42 anciennes entrées sont
// reproduites À L'IDENTIQUE, et l'élargissement de 42 à 68 ne révèle AUCUN constat nouveau — les
// vingt-six outils qui échappaient au contrôle le passent tous. C'est ce qui rend cet
// élargissement sûr, et c'est la seule raison pour laquelle il est fait ici plutôt que soumis.
//
// CE QUE ÇA CHANGE POUR L'AVENIR, et c'est le vrai gain (Article 24) : un outil qui rejoint
// l'équipe hérite de ce contrôle le jour où il déclare sa fiabilité, sans qu'aucune seconde
// inscription ne soit à faire — l'inscription oubliée étant précisément ce qui avait laissé
// vingt-six outils dehors.
export const RELIABILITY_SCRIPT_FILES = Object.fromEntries(
  Object.keys(TOOL_RELIABILITY).map((slug) => [slug, scriptPourSlug(slug)]),
);
export function findHeuristicToolsWithoutNotice(registry = TOOL_RELIABILITY, { scriptFor = RELIABILITY_SCRIPT_FILES, readFileImpl = lireFichierPartage, existsImpl = existsSync } = {}) {
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
  // Sa sous-commande `mesurer` écrit le chronométrage du filet groupe par groupe : une donnée
  // relue par l'enquête, jamais lue telle quelle par un humain. Son RAPPORT, lui, est la sortie
  // console de l'enquête — c'est bien un journal, pas un second rapport.
  "scripts/ezechiel-les-tests.mjs": { nature: "journal", pourquoi: "tient docs/ezechiel-les-tests/mesures.json, le chronométrage du filet groupe par groupe, relu par l'enquête pour croiser coût et protection" },
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
export function findUnclassifiedFileWriters({ registries = REGISTRIES, natures = FILE_WRITER_NATURES, listDirImpl = (dir) => (existsSync(dir) ? readdirSync(dir) : []), readFileImpl = lireFichierPartage } = {}) {
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
export function findLanceursPrematures({ root = ROOT, listDirImpl = readdirSync, readFileImpl = lireFichierPartage } = {}) {
  // Lecteur partagé — sa raison vit à UN seul endroit, chez lui (`lib-shell.mjs`).
  const lecture = lireLesScriptsDuDepot({ root, listDirImpl, readFileImpl });
  if (!lecture.mesurable) return [];
  const ecarts = [];
  for (const { nom: f, texte } of lecture.lus) {
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

function parcourirRapports({ dossier, listDirImpl = readdirSync, readFileImpl = lireFichierPartage }) {
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

export function findRapportsQuiPointent({ dossier, listDirImpl = readdirSync, readFileImpl = lireFichierPartage, seuil = SEUIL_RAPPORT_MAIGRE, seuilDensite = SEUIL_DENSITE_RAPPORT } = {}) {
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
export function findRapportsCourtsMaisDenses({ dossier, listDirImpl = readdirSync, readFileImpl = lireFichierPartage, seuil = SEUIL_RAPPORT_MAIGRE, seuilDensite = SEUIL_DENSITE_RAPPORT } = {}) {
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
// POURQUOI CETTE FONCTION RESTE SÉPARÉE DE `findLanceursPrematures()` (2026-09-29, tâche #1246).
// CLONE-HUNTER les signale comme jumelles, et il a raison sur la FORME : même signature, même
// premier geste. Mais l'outil offre deux issues — fondre, ou écrire pourquoi on ne fond pas — et
// c'est la seconde qui vaut ici. **Ces deux garde-fous vérifient des choses opposées** : l'un
// cherche du code déclaré APRÈS le lanceur (un défaut d'ORDRE dans le fichier), l'autre un script
// qui nomme un registre sans jamais y écrire (un défaut de PROMESSE). Les fondre donnerait une
// fonction à deux verdicts, qu'on ne pourrait plus appeler séparément ni faire échouer seule.
// Ce qui pouvait être partagé l'A ÉTÉ — la lecture des scripts vit maintenant dans `lib-shell`.
// Ce qui reste commun est leur signature, et deux fonctions qui prennent les mêmes entrées ne
// sont pas un doublon : c'est ce à quoi ressemble une famille d'outils cohérente.
export function findEcrivainsDeRegistreSansContribution({ root = ROOT, listDirImpl = readdirSync, readFileImpl = lireFichierPartage } = {}) {
  // Lecteur partagé — sa raison vit à UN seul endroit, chez lui (`lib-shell.mjs`).
  const lecture = lireLesScriptsDuDepot({ root, listDirImpl, readFileImpl });
  if (!lecture.mesurable) return [];
  const ecarts = [];
  for (const { nom: f, texte: brut } of lecture.lus) {
    // LES COMMENTAIRES SONT RETIRÉS AVANT DE CHERCHER (2026-09-29, tâche #1168). Ce bloc annonçait
    // depuis sa création que « citer un chemin dans un commentaire n'est pas écrire dedans » — et
    // rien ne le faisait. Un commentaire qui MONTRE la forme du code, par exemple pour l'expliquer,
    // déclenchait l'accusation. Les CHAÎNES restent : c'est dans une chaîne que vit le chemin
    // littéral que ce garde-fou doit trouver.
    const texte = sansLesCommentaires(brut);
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

// ══════════════════════════════════════════════════════════════════════════
// DEUX RAPPORTS QUI DISENT LA MÊME CHOSE (2026-09-26, sa question)
// ══════════════════════════════════════════════════════════════════════════
//
// SA QUESTION, telle quelle : « il y a des rapports qui disent exactement la même chose ? »
//
// PERSONNE NE POUVAIT RÉPONDRE. CLONE-HUNTER ne regarde que le CODE. pure-gold-unity regarde la
// FORME des rapports — le gabarit partagé — jamais leur contenu. Ce dépôt porte 727 documents
// produits par l'outillage, et rien ne vérifiait qu'aucun ne répète un autre.
//
// LE PIÈGE QUI REND LA MESURE NAÏVE INUTILISABLE, et il fallait le contourner avant d'écrire une
// ligne : depuis le gabarit unifié, TOUS les rapports partagent un en-tête identique — avertissement
// de fiabilité, version du modèle, état du code, santé de l'outil. Comparer les textes bruts
// dirait que tout se ressemble. On retire donc le passe-partout AVANT de comparer — et on le
// DÉRIVE du corpus plutôt que de le lister (Article 24) : une ligne présente dans les rapports de
// trois dossiers différents ou plus est du passe-partout, par construction. Une ligne ajoutée
// demain au gabarit est reconnue sans que ce fichier bouge.
//
// TROIS NATURES, JAMAIS UNE — et ce sont les trois vrais cas trouvés au premier passage qui les
// ont imposées. « Identique » ne veut pas dire « fautif », et les confondre aurait produit un
// détecteur qui accuse trois fois pour un seul vrai défaut :
//   · DOUBLON D'ARCHIVE — le même contenu sous deux noms, dans le même dossier d'archives. Vrai
//     défaut : l'un des deux est de trop, ou son nom ment. (full_sim15_transcript.txt et
//     full_sim_transcript.txt, le second sans numéro.)
//   · CONSTAT RÉPÉTÉ — le MÊME outil, deux passages, le même résultat. Parfaitement légitime : un
//     dépôt propre deux fois de suite doit produire deux fois le même rapport, et « rien trouvé »
//     est une entrée pleine. Ça ne devient une question que par le NOMBRE — un contrôle qui rend
//     dix fois le même verdict interroge son rythme, pas sa justesse.
//   · MÊME ÉCHEC ARCHIVÉ DEUX FOIS — deux exécutions différentes butent sur le même mur et
//     archivent le même constat d'échec. Informatif, jamais fautif. (Les dossiers de full_sim18 et
//     full_sim19 : « aucun dossier retourné », 44 octets, le même défaut trois fois de suite.)
export const SEUIL_PASSE_PARTOUT = 3;
export const MOTIF_LIGNE_VOLATILE = /^\s*(?:Produit le|État du code|Version de Claude|Écrit\s*:|Contexte de production|Outil\s*:|Santé de l'outil|Gravité de ce rapport|⚠️)/;

export function lignesPassePartout(rapports = [], seuil = SEUIL_PASSE_PARTOUT) {
  const parLigne = new Map();
  for (const r of rapports) {
    const dossier = String(r.chemin).split("/").slice(0, 2).join("/");
    for (const l of new Set(String(r.texte).split("\n").map((x) => x.trim()).filter((x) => x.length > 15))) {
      if (!parLigne.has(l)) parLigne.set(l, new Set());
      parLigne.get(l).add(dossier);
    }
  }
  return new Set([...parLigne].filter(([, d]) => d.size >= seuil).map(([l]) => l));
}

export function substanceDuRapport(texte = "", passePartout = new Set()) {
  return String(texte).split("\n").map((l) => l.trim())
    .filter((l) => l.length > 0 && !MOTIF_LIGNE_VOLATILE.test(l) && !passePartout.has(l))
    // Les dates et les nombres changent à chaque passage sans rien changer au CONSTAT : deux
    // rapports qui disent la même chose à deux jours d'écart doivent se reconnaître.
    .map((l) => l.replace(/\d{4}-\d{2}-\d{2}/g, "<date>").replace(/\b\d+\b/g, "<n>"))
    .join("\n");
}

export const NATURES_DE_JUMELAGE = {
  "doublon-archive": "le même contenu sous deux noms dans le même dossier d'archives — l'un des deux est de trop, ou son nom ment",
  "constat-repete": "le même outil a rendu deux fois le même constat — légitime en soi (un dépôt propre deux fois de suite le doit), mais le NOMBRE de répétitions interroge le rythme du contrôle",
  "meme-echec": "deux exécutions différentes ont buté sur le même mur et archivé le même échec — informatif, jamais fautif",
  "entre-outils": "deux OUTILS DIFFÉRENTS rendent le même constat — c'est le seul cas qui pose la question du chevauchement",
  "double-depot": "LE MÊME PASSAGE a déposé son rapport DEUX FOIS, sous deux noms — jamais une répétition légitime : un seul passage a eu lieu, et le second fichier fait croire à un second contrôle",
};

// QUAND LE NOM DE FICHIER NE DIT RIEN, C'EST LE DOSSIER QUI LE DIT. Un rapport déposé dans le
// registre d'un outil s'appelle souvent `circle-signal-<date>.txt` ou `snapshot-<date>.txt` : une
// fois la date et le préfixe générique retirés, il ne reste rien du tout. Comparer ce « rien » au
// nom d'un autre rapport concluait à deux outils différents — et « entre-outils » est justement le
// seul palier qui appelle une action. Le dossier porteur est l'information que le nom a perdue.
export const PREFIXES_GENERIQUES = /^(?:circle-signal|snapshot|rapport|scan|signal)[-_]?/;

export function nomDOutilDuRapport(chemin) {
  const parts = String(chemin).split("/");
  const brut = parts.pop()
    .replace(/[-_]?\d{4}-\d{2}-\d{2}[^.]*/g, "")
    .replace(/\.(txt|md)$/, "")
    .replace(PREFIXES_GENERIQUES, "")
    .replace(/[-_]+$/, "");
  // Le dossier immédiat, sauf quand c'est un sous-dossier de dépôt (`rapports`, `ronde-<date>`) :
  // celui-là ne nomme pas un outil, il nomme un passage.
  const dossiers = parts.filter((d) => d !== "docs" && !/^ronde-|^rapports$/.test(d));
  return brut.length > 2 ? brut : (dossiers.pop() ?? brut);
}

// LE PREMIER PASSAGE RÉEL A CLASSÉ QUATRE GROUPES EN « DEUX OUTILS DIFFÉRENTS », ET LES QUATRE
// ÉTAIENT LE MÊME OUTIL. La comparaison se faisait sur le nom de fichier brut, or un item de Ronde
// RENOMMÉ produit deux noms pour une seule chose : `check-profil-utilisateur` devenu
// `profil-utilisateur-guard`, `ines-official` devenu `ines-official-signal`, `clean-dirty-old`
// devenu `gardien-clean-dirty-old`. Accuser un chevauchement d'outils là où il n'y a qu'un
// renommage, c'est envoyer chercher un problème qui n'existe pas — et « entre-outils » est
// précisément le seul palier qui appelle une action.
//
// On compare donc par les RACINES DES MOTS (memeChose, lib-shell) : deux noms partageant deux mots
// significatifs désignent le même outil. `check-house` et `check-spirit` n'en partagent qu'un, et
// restent distincts.
// LA SIGNATURE D'UN PASSAGE SE LIT DANS LE RAPPORT, JAMAIS AU DOSSIER QUI LE PORTE (2026-09-26,
// tâche #976, corrigé le soir même de sa naissance). La première version concluait « le même
// passage deux fois » du seul fait que les deux fichiers étaient dans le même dossier
// `ronde-<date>` — et elle a accusé à tort les deux seuls cas qu'elle a trouvés. Vérification faite
// avant de rien supprimer : `clean-dirty-old.txt` est daté 19:07 sur le commit 79b7dd7,
// `gardien-clean-dirty-old.txt` 20:13 sur 52be7c7, et pour safe-export l'un est marqué
// « automatique_post_commit » quand l'autre est une « demande directe ». Ce sont DEUX vrais
// contrôles, une heure d'écart, dont un lancé à la main : les effacer aurait détruit la preuve que
// le contrôle avait bien tourné deux fois. Une journée de Ronde peut parfaitement contenir deux
// passages du même outil, et le dossier ne dit rien de plus que le jour.
export const MOTIF_SIGNATURE_DE_PASSAGE = /^\s*(?:Produit le|État du code|Contexte de production)\s*:\s*(.+)$/gm;

export function signatureDuPassage(texte = "") {
  const m = [...String(texte).matchAll(MOTIF_SIGNATURE_DE_PASSAGE)].map((x) => x[1].trim());
  // Pas d'en-tête daté = pas de signature. On rend null plutôt qu'une chaîne vide, qui se
  // confondrait avec celle d'un autre rapport sans en-tête et les déclarerait « même passage ».
  return m.length ? m.join(" | ") : null;
}

// LE NOM COURT QUI NE POUVAIT JAMAIS MATCHER (2026-09-27, tâches #436/#773 — trouvé parce qu'un
// rapport de plus a changé le corpus, jamais en relisant le code).
//
// LE DÉFAUT : `memeChose()` compare par racines de mots et exige DEUX mots en commun, mais
// `motsDuNom()` jette les mots de trois lettres ou moins. « the-king » se réduit donc à UN seul
// mot, « king » — et deux dépôts du MÊME outil, `the-king.txt` et `the-king-signal.txt`, étaient
// classés « deux OUTILS DIFFÉRENTS », c'est-à-dire dans le seul palier qui appelle une action.
//
// CE N'EST PAS UNE OCCURRENCE, C'EST UNE CLASSE (leçon L37) : tout outil dont le nom commence par
// un mot court — « the-… », « el-… », « la-… » — était structurellement hors de portée de la règle
// écrite juste au-dessus pour rattraper exactement ces renommages d'items de Ronde. Corriger le
// seul cas THE-KING aurait laissé les suivants arriver un par un.
//
// LA RÈGLE AJOUTÉE EST UN PRINCIPE, jamais une liste de suffixes à tenir à jour (Article 24) : si
// TOUS les mots du nom le plus court se retrouvent dans le plus long, c'est le même outil sous un
// nom rallongé. Ici on compte les mots courts, précisément parce que c'est leur perte qui créait
// le trou. Le cas à NE PAS attraper reste protégé : `check-house` et `check-spirit` partagent un
// mot mais aucun n'est inclus dans l'autre, donc ils restent deux outils différents.
export function memeOutilMalgreLeSuffixe(a, b) {
  if (memeChose(a, b)) return true;
  const mots = (n) => String(n).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ")
    .toLowerCase().split(/\s+/).filter((m) => m.length > 1);
  const ma = mots(a), mb = mots(b);
  if (!ma.length || !mb.length) return false;
  const [court, long] = ma.length <= mb.length ? [ma, mb] : [mb, ma];
  const setLong = new Set(long);
  return court.every((m) => setLong.has(m));
}

export function natureDuJumelage(chemins = [], { dossiersDArchive = ["docs/simulations"], signatures = [] } = {}) {
  const dossiers = [...new Set(chemins.map((c) => String(c).split("/").slice(0, 2).join("/")))];
  const noms = chemins.map(nomDOutilDuRapport);
  const memeOutil = noms.every((n) => memeOutilMalgreLeSuffixe(n, noms[0]));
  // LE MÊME PASSAGE, DEUX FICHIERS — trouvé au premier vrai passage, deux fois : la Ronde du
  // 2026-09-22 a déposé `clean-dirty-old.txt` ET `gardien-clean-dirty-old.txt`, puis
  // `safe-export.txt` ET `gardien-safe-export.txt`. Un seul contrôle a eu lieu ; le second fichier
  // fait croire à un second. Le ranger en « constat répété » l'aurait absous — la répétition n'est
  // légitime qu'entre DEUX passages, jamais à l'intérieur d'un seul.
  const passages = [...new Set(chemins.map((c) => String(c).split("/").filter((d) => /^ronde-/.test(d))[0] ?? null))];
  // Le dossier commun ne suffit plus : il faut que les rapports portent la MÊME signature de
  // passage (même heure, même commit, même contexte de production). Sans signature lisible, on ne
  // conclut pas — une absence de preuve n'est pas une preuve d'absence (leçons L5/L11).
  const sigs = [...new Set(signatures)];
  const memeSignature = sigs.length === 1 && sigs[0] != null;
  if (memeOutil && passages.length === 1 && passages[0] && memeSignature) {
    return { cle: "double-depot", pourquoi: NATURES_DE_JUMELAGE["double-depot"] };
  }
  if (dossiers.length === 1 && dossiersDArchive.includes(dossiers[0])) {
    // Dans un dossier d'archives, deux fichiers identiques sont soit le même document déposé deux
    // fois, soit deux exécutions qui ont échoué pareil. Le second cas se reconnaît à ce que le
    // contenu DIT être un échec — on ne le devine pas au nom du fichier.
    return { cle: "a-lire", pourquoi: NATURES_DE_JUMELAGE["doublon-archive"] };
  }
  if (!memeOutil) return { cle: "entre-outils", pourquoi: NATURES_DE_JUMELAGE["entre-outils"] };
  return { cle: "constat-repete", pourquoi: NATURES_DE_JUMELAGE["constat-repete"] };
}

// UN MARQUEUR D'ÉCHEC NE VAUT QUE SUR UNE SUBSTANCE COURTE, et le premier passage l'a prouvé : un
// transcript de deux cents lignes contient forcément « rien » ou « aucun » quelque part, et le test
// appliqué au texte entier a classé un VRAI doublon d'archive (le même transcript sous deux noms,
// dont un sans numéro) en « même échec archivé deux fois » — c'est-à-dire en cas légitime. Le seul
// vrai défaut du lot se faisait ainsi absoudre par une coïncidence de vocabulaire.
// Un vrai constat d'échec tient en quelques lignes : « (aucun dossier retourné dans cette
// session) » fait 44 octets.
export const MOTIF_CONSTAT_D_ECHEC = /aucun\b|rien\b|échec|impossible|non produit|pas pu/i;
export const LIGNES_MAX_CONSTAT_D_ECHEC = 3;

export function estUnConstatDEchec(substance = "", maxLignes = LIGNES_MAX_CONSTAT_D_ECHEC) {
  const lignes = String(substance).split("\n").filter(Boolean);
  return lignes.length <= maxLignes && MOTIF_CONSTAT_D_ECHEC.test(substance);
}

export function trouverRapportsJumeaux(rapports = [], { seuil = SEUIL_PASSE_PARTOUT, minSubstance = 1 } = {}) {
  if (!rapports.length) return { mesurable: false, pourquoi: "aucun rapport fourni : il n'y a rien à comparer, et rendre « zéro doublon » sur zéro rapport serait un satisfecit sur rien" };
  const passePartout = lignesPassePartout(rapports, seuil);
  const parSubstance = new Map();
  for (const r of rapports) {
    const sub = substanceDuRapport(r.texte, passePartout);
    // UN RAPPORT VIDÉ DE SA SUBSTANCE N'EST PAS LE JUMEAU D'UN AUTRE RAPPORT VIDE : deux rapports
    // qui ne contiennent QUE du passe-partout se ressembleraient forcément, et les apparier
    // produirait un groupe géant et faux. Ils sortent du calcul, et on dit combien.
    if (sub.split("\n").filter(Boolean).length < minSubstance) continue;
    if (!parSubstance.has(sub)) parSubstance.set(sub, []);
    parSubstance.get(sub).push({ chemin: r.chemin, signature: signatureDuPassage(r.texte) });
  }
  const groupes = [...parSubstance.entries()].filter(([, c]) => c.length > 1).map(([sub, entrees]) => {
    const chemins = entrees.map((e) => e.chemin);
    const nature = natureDuJumelage(chemins, { signatures: entrees.map((e) => e.signature) });
    const cle = nature.cle === "a-lire" && estUnConstatDEchec(sub) ? "meme-echec" : nature.cle === "a-lire" ? "doublon-archive" : nature.cle;
    return { chemins, combien: chemins.length, nature: cle, pourquoi: NATURES_DE_JUMELAGE[cle], extrait: sub.split("\n")[0]?.slice(0, 90) ?? "" };
  });
  return {
    mesurable: true, groupes,
    examines: rapports.length,
    sansSubstance: rapports.length - [...parSubstance.values()].reduce((a, c) => a + c.length, 0),
    passePartout: passePartout.size,
    fautifs: groupes.filter((g) => ["doublon-archive", "entre-outils", "double-depot"].includes(g.nature)),
    horsPortee: "elle apparie des rapports dont la SUBSTANCE est identique une fois le passe-partout retiré, les dates et les nombres neutralisés. Deux rapports qui disent la même chose avec des mots différents lui échappent — ça, c'est une lecture.",
  };
}

export function formatJumeauxLines(j) {
  if (!j?.mesurable) return [`=== RAPPORTS JUMEAUX : PAS MESURÉ — ${j?.pourquoi} ===`, "", "Ce n'est PAS « aucun doublon »."];
  const l = [`=== RAPPORTS QUI DISENT LA MÊME CHOSE — ${j.groupes.length} groupe(s) sur ${j.examines} rapports ===`, ""];
  l.push(`  ${j.passePartout} ligne(s) de passe-partout retirées avant comparaison — sans ça, le gabarit unifié ferait passer tous les rapports pour des jumeaux.`);
  if (j.sansSubstance) l.push(`  ${j.sansSubstance} rapport(s) écartés : une fois le passe-partout retiré il ne restait rien à comparer.`);
  l.push("");
  if (!j.groupes.length) l.push("  ✅ Aucun rapport n'en répète un autre.");
  for (const g of j.groupes) {
    const icone = ["doublon-archive", "double-depot"].includes(g.nature) ? "🔴" : g.nature === "entre-outils" ? "🟠" : "🟡";
    l.push(`  ${icone} ${g.nature} — ${g.pourquoi}`);
    for (const c of g.chemins) l.push(`      · ${c}`);
    if (g.extrait) l.push(`      « ${g.extrait} »`);
  }
  l.push("");
  l.push(`  HORS PORTÉE : ${j.horsPortee}`);
  return l;
}

// SES PROPRES RAPPORTS NE SONT PAS DU CORPUS (2026-09-26, tâche #976). Le détecteur dépose sa
// sortie dans docs/doc-report/, que ce même balayage relit — deux passages qui trouvent la même
// chose auraient donc produit deux fichiers identiques, que le passage suivant aurait appariés
// comme un « constat répété » portant sur lui-même. Ce dépôt n'est pas un rapport d'outil au sens
// où les autres le sont : c'est le RÉSULTAT de la comparaison, jamais une de ses entrées. Le
// projet a déjà payé cette famille d'erreur une fois (find-booster, tâche #182, bug
// auto-référentiel), et c'est pourquoi elle est fermée ici avant d'avoir coûté quoi que ce soit.
export const MOTIF_RAPPORT_JUMEAUX = /^rapports-jumeaux-/;

export function chargerLesRapports({ root = ROOT, listDirImpl = readdirSync, readFileImpl = lireFichierPartage, racine = "docs" } = {}) {
  // Le parcours vient de lib-shell (2026-09-27, tâche #993) : il était recopié ici, dans
  // le-classificateur.mjs et trois fois dans data-archangel.mjs. Le FILTRE reste ici, parce qu'il
  // est propre à cet outil ; la LECTURE aussi, parce que ce qu'on fait d'un fichier illisible
  // diffère d'un appelant à l'autre — ici il ne compte pas comme conforme, ailleurs il est ignoré.
  const garder = (nom) => /\.(txt|md)$/.test(nom) && nom !== "index.md" && !MOTIF_RAPPORT_JUMEAUX.test(nom);
  const rapports = [];
  for (const chemin of listerLesFichiers(racine, { root, listDirImpl, garder })) {
    try { rapports.push({ chemin, texte: readFileImpl(join(root, chemin), "utf8") }); } catch { /* illisible : il ne compte pas comme conforme */ }
  }
  return rapports;
}

// LE DÉPÔT DU RAPPORT, ET POURQUOI IL NE POUVAIT PAS ÊTRE FACULTATIF (2026-09-26, tâche #976).
// Cette sous-commande n'imprimait qu'à l'écran. L'Article 31 (faille 3) dit que le livrable est le
// FICHIER : une sortie qui ne vit que dans un terminal ne peut être ni relue, ni comparée au
// passage précédent, ni citée par quiconque — ce qui est exactement le reproche que cet outil-ci
// adresse aux autres. Elle n'appelait pas non plus recordCliUsage() : le garde-fou des outils muets
// lit la PRÉSENCE de cet appel dans le script, or main() l'appelle plus haut, si bien que le script
// passait pour instrumenté pendant que cette branche-là ne comptait rien.
export function deposerRapportJumeaux(lignes, { root = ROOT, now = new Date(), writeImpl = writeFileSync, mkdirImpl = mkdirSync } = {}) {
  const dossier = join(root, "docs/doc-report");
  mkdirImpl(dossier, { recursive: true });
  const chemin = join(dossier, `rapports-jumeaux-${now.toISOString().slice(0, 10)}.txt`);
  writeImpl(chemin, lignes.join("\n") + "\n", "utf8");
  return chemin;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// LES DOCUMENTS QU'UN OUTIL RÉÉCRIT EN ENTIER, SANS LE DIRE (2026-09-28, tâche #711)
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// LE VRAI RISQUE N'EST PAS « UN FICHIER SANS RÉGIME DÉCLARÉ », et c'est ce que la mesure a montré :
// le dépôt porte 471 documents `.md`, dont 381 sans aucun signal mécanique. Exiger une mention en
// tête de chacun demanderait 381 JUGEMENTS — une obligation qu'on ne peut pas honorer se contourne,
// et on aurait tamponné 471 en-têtes sans réfléchir, ce qui est pire que rien.
//
// LE RISQUE EST ÉTROIT ET IL SE NOMME : un document qu'un outil RÉÉCRIT EN ENTIER, qui ne porte NI
// le bloc généré NI de mention de régime. Là, quelqu'un peut y écrire une note de bonne foi et la
// perdre au passage suivant — **sans erreur, sans message, sans trace**. Partout ailleurs, ou bien
// le générateur n'écrit qu'entre ses marqueurs (et la prose autour est protégée), ou bien personne
// ne réécrit le fichier.
//
// LES CHEMINS SE LISENT DANS LE CODE DES OUTILS, jamais dans une liste tenue à la main : une
// constante `X_PATH = "docs/….md"` suivie d'une écriture est la signature d'un document régénéré, et
// un outil de plus demain sera vu sans qu'on y pense (Article 24).
export const MOTIF_CHEMIN_ECRIT = /(?:const|let)\s+([A-Z][A-Z0-9_]*(?:_PATH|_FILE))\s*=\s*["'`](docs\/[^"'`]+\.md)["'`]/g;

// AJOUTER À LA FIN N'EST PAS RÉÉCRIRE, et confondre les deux accusait quatre fichiers à tort au
// premier passage — dont `docs/idees-a-trancher.md`, le registre où vivent SES arbitrages. Une
// écriture de la forme `prior + ligne` conserve tout ce qui précède : rien ne peut s'y perdre, et
// la signaler serait le faux rouge le plus coûteux du lot, puisqu'il porterait sur le fichier le
// plus précieux. Les marqueurs de concaténation sont lus DANS l'appel d'écriture lui-même.
// L'AJOUT S'ÉCRIT DE DEUX FAÇONS DANS CE DÉPÔT, et n'en reconnaître qu'une accusait à tort. La
// concaténation (`prior + ligne`) était vue ; l'INTERPOLATION dans un gabarit
// (`${existant.replace(...)}\n${ligne}`) ne l'était pas — et c'est la forme qu'emploie
// `enregistrerOperation()`, si bien que `docs/referentiel/charte-operations.md` passait pour réécrit
// en entier alors qu'il est alimenté ligne à ligne. Les deux formes comptent.
export const MARQUEURS_D_AJOUT = /\b(prior|avant|dejaLa|déjàLà|existant|precedent|précédent|ancien|contenu)\b\s*(\+|\.replace)|\$\{\s*(prior|avant|dejaLa|existant|precedent|ancien|contenu)\b|\+\s*\b(row|ligne|entree|entrée)\b/;
export const FENETRE_APPEL = 400;

// Un vrai appel d'écriture : n'importe quel identifiant qui commence par `write` ou `ecrire`, suivi
// d'une parenthèse, et la constante dans la fenêtre de ses arguments. Le nom de la fonction varie
// d'un outil à l'autre (`writeFileSync`, `writeFileImpl`, `ecrire`) et n'en fixer qu'un aurait
// rendu la sonde aveugle aux deux autres — le défaut qu'elle vient justement de commettre.
export const MOTIF_APPEL_ECRITURE = /\b(?:write[A-Za-z]*|ecrire[A-Za-z]*|écrire[A-Za-z]*)\s*\(/g;

export function appelDEcritureSur(code = "", nomConstante = "") {
  const t = String(code);
  for (const m of t.matchAll(MOTIF_APPEL_ECRITURE)) {
    const args = t.slice(m.index, m.index + FENETRE_APPEL);
    if (new RegExp(`\\b${nomConstante}\\b`).test(args.split("\n")[0] ?? "")) return true;
  }
  return false;
}

export function ecritureEstUnAjout(code = "", nomConstante = "") {
  const t = String(code);
  // LE MÊME MOTIF D'APPEL QUE `appelDEcritureSur`, et pas un second écrit à côté : deux lectures de
  // « qu'est-ce qu'un appel d'écriture » finiraient par diverger, et c'est exactement ce qui est
  // arrivé ici — celle-ci ne connaissait que `writeFileSync`, donc elle ne voyait pas l'ajout fait
  // par `ecrire(…)` et accusait un fichier alimenté ligne à ligne (Article 24).
  for (const m of t.matchAll(new RegExp(MOTIF_APPEL_ECRITURE.source, "g"))) {
    const fenetre = t.slice(m.index, m.index + FENETRE_APPEL);
    if (!new RegExp(`\\b${nomConstante}\\b`).test(fenetre.split("\n")[0] ?? "")) continue;
    if (MARQUEURS_D_AJOUT.test(fenetre)) return true;
  }
  return false;
}

export function documentsReecritsEnEntier({ sources = new Map() } = {}) {
  const parChemin = new Map();
  for (const [script, code] of sources) {
    const t = String(code);
    if (!/writeFileSync|writeFile\(/.test(t)) continue;
    for (const m of t.matchAll(MOTIF_CHEMIN_ECRIT)) {
      const [, nom, chemin] = m;
      // LA CONSTANTE DOIT ÊTRE RÉELLEMENT ÉCRITE, et ma première version ne le vérifiait pas
      // vraiment : une de ses deux branches acceptait le nom suivi de n'importe quoi puis d'une
      // parenthèse, ce qu'on trouve dans du code de LECTURE ordinaire. Résultat :
      // `docs/referentiel/lecons.md` était accusé alors que rien ne l'écrit — sa constante ne sert
      // qu'à le lire. Un chemin seulement LU n'a jamais fait perdre une note à personne.
      //
      // La vérification porte donc sur un vrai APPEL d'écriture, quel que soit le nom de la
      // fonction (`writeFileSync`, `writeFileImpl`, `ecrire`…), avec la constante DANS ses
      // arguments — pas ailleurs dans le fichier.
      if (!appelDEcritureSur(t, nom)) continue;
      if (ecritureEstUnAjout(t, nom)) continue;
      if (!parChemin.has(chemin)) parChemin.set(chemin, []);
      if (!parChemin.get(chemin).includes(script)) parChemin.get(chemin).push(script);
    }
  }
  return parChemin;
}

export function findDocumentsSansRegime({ sources = new Map(), lireDocument = null } = {}) {
  if (!sources.size || typeof lireDocument !== "function") {
    return { mesurable: false, aRisque: [], proteges: [],
      pourquoi: "aucune source d'outil lue ou aucun lecteur de document fourni : rien n'a été confronté, ce qui n'est PAS « aucun document à risque »" };
  }
  const ecrits = documentsReecritsEnEntier({ sources });
  const aRisque = [], proteges = [];
  for (const [chemin, scripts] of ecrits) {
    const texte = lireDocument(chemin);
    if (texte === null || texte === undefined) continue;   // le document n'existe pas encore : rien à perdre
    const r = regimeDEcriture(texte, chemin);
    if (r.regime) { proteges.push({ chemin, scripts, regime: r.regime, source: r.source }); continue; }
    aRisque.push({ chemin, scripts,
      pourquoi: `réécrit en entier par ${scripts.join(", ")}, et ne porte ni bloc généré ni mention de régime : une note écrite à la main y disparaîtrait au passage suivant, sans erreur et sans trace` });
  }
  return {
    mesurable: true, aRisque, proteges, examines: ecrits.size,
    pourquoi: aRisque.length
      ? `${aRisque.length} document(s) réécrits en entier sans dire qu'ils le sont`
      : `les ${ecrits.size} document(s) réécrits en entier le disent tous`,
    horsPortee: "Elle ne voit qu'une constante `X_PATH` passée DIRECTEMENT à un appel d'écriture. Une indirection lui échappe, et le cas est connu plutôt que supposé : `le-classificateur` écrit `const cible = process.argv[3] ?? CLASSIFICATION_PATH` puis écrit `cible` — le document est bien réécrit en entier, et cette sonde ne le voit pas. Élargir à une analyse de flot de données coûterait plus que ce que ça rapporte ; nommer la limite et l'exemple connu coûte une phrase. Elle ne dit pas non plus si le régime déclaré est le BON, seulement qu'il est déclaré.",
  };
}

if (process.argv[2] === "jumeaux") {
  recordCliUsage("doc-report");
  const j = trouverRapportsJumeaux(chargerLesRapports());
  const lignes = formatJumeauxLines(j);
  for (const l of lignes) console.log(l);
  console.log(`\nRapport déposé : ${deposerRapportJumeaux(lignes).replace(ROOT, "")}`);
} else if (import.meta.url === `file://${process.argv[1]}`) main();
