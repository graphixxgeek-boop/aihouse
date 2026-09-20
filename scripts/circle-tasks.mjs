// CIRCLE-TASKS — « Ronde périodique » (2026-09-20, nommé par l'utilisateur : « je voudrais creer un
// mini agent qui appelle l'executoin de ce process : l'agent s'appelle circle-tasks »).
//
// Né d'un constat concret et gênant : le système de mise à jour du profil utilisateur — pourtant
// documenté, pourtant zéro coût API — était en retard pour la DEUXIÈME fois de la session (une
// session compactée sans que la fiche ne soit relancée), retrouvé uniquement parce que
// l'utilisateur a posé la question. CIRCLE-TASKS regroupe les tâches de ce type : périodiques par
// nature, gratuites, mais qui dépendent uniquement de la mémoire de l'agent pour être relancées —
// jamais un mécanisme automatique complet.
//
// Volontairement mince, EXACTEMENT le même principe que LE-COORDINATEUR (aucun blueprint séparé,
// documenté directement dans docs/regles-de-travail.md §7ter) : ce script ne DÉCIDE ni n'EXÉCUTE
// rien lui-même — il affiche le menu et un signal de fraîcheur mécanique quand une vraie date de
// référence existe (jamais inventée sinon), et laisse le choix précis à l'agent qui pilote via une
// fenêtre à cocher (demande explicite de l'utilisateur : « tu ouvres une fenêtre question me
// demandant de cocher ce que je veux précisément exécuter » — jamais un tout-en-un silencieux).
//
// Principalement GRATUITE — SEULE EXCEPTION explicite (2026-09-20, revirement demandé par
// l'utilisateur après un premier jet qui excluait tout item coûteux) : THE-FINAL-JUDGE reste
// visible dans la même fenêtre à cocher, jamais retiré de la vue, mais jamais traité comme un item
// ordinaire — panneau d'alerte (⚠️🔴), coût en tokens fixe affiché en toutes lettres, jamais coché
// par défaut. Les autres items coûteux du paysage (check-spirit.mjs, HYPER-SCAN-CHECKPOINT complet)
// restent hors de cette fenêtre pour l'instant, cf. docs/referentiel/smart-conso-token.md pour la
// discussion de leur extension éventuelle au même traitement.
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { THEMES, parseCoverage, recommendZone } from "./always-new-code.mjs";
import { categorizeAllSessions } from "./check-suivi-fidelity.mjs";
import { scanDocumentWeight, listDatedNarrativeMarkers, extractRuleUnits, findRedundantRulePairs } from "./smart-conso-token.mjs";
import { renderHtmlReport } from "./html-report.mjs";
import { walkDocsPaths } from "./lib-shell.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// Alerte visuelle non négociable (2026-09-20, demande explicite de l'utilisateur : « chaque fois
// que the-judge doit être sollicité [...] il y a un message d'alerte avec une icône : faire
// attention, des caractères en rouge et le prix en token fixe (37K) »). `ALERT_ICON` pour toute
// surface textuelle (chat, description d'option d'une fenêtre à cocher — aucune couleur possible
// là) ; `red()` pour la sortie TERMINAL uniquement (ce script, les crochets git), où de vrais
// caractères ANSI rouges sont affichables. Jamais mélangé : une fenêtre à cocher ne rend jamais les
// codes ANSI, elle recevrait du texte brut illisible — seul le préfixe ⚠️🔴 y est utilisé.
export const ALERT_ICON = "⚠️🔴";
export const FINAL_JUDGE_TOKEN_COST = 37000;
export function red(text) { return `\x1b[31m${text}\x1b[0m`; }

// Les 9 items gratuits (2026-09-20, complétés en plusieurs passes le même jour : « il n'y a pas
// aussi les smart scans de api et token ? » — écart réel trouvé en refaisant le tour complet du
// paysage ; « la photo de la dream team », ajoutée comme seul item purement récréatif ; puis « la
// possibilité de demander une capture d'écran de la simulation » — THE-SCREENER, dernier oubli
// trouvé). Chacun a une raison d'être et un chemin d'exécution déjà documenté ailleurs —
// CIRCLE-TASKS ne réimplémente RIEN, il rappelle et agrège (règle anti-doublon, §7ter). Le champ
// `execute` décrit en une phrase la procédure réelle à suivre pour un item coché, jamais un code à
// lancer aveuglément.
//
// `tokensEstimes` (2026-09-20, demande explicite : « alimente ce catalogue avec une estimation du
// prix en token et/ou en API ») — un ORDRE DE GRANDEUR honnête du coût en tokens Claude (agent
// pilote) pour exécuter l'item, jamais un chiffre exact fabriqué (même discipline que
// SMART-CONSO-TOKEN, Article 22 : « jamais un chiffre exact présenté comme tel », sauf quand une
// vraie recherche documentée existe déjà — cf. le-final-judge ci-dessous). `cout` reste le texte
// qui décrit le coût en appels API réels (Gemini, ou agent séparé) ; `tokensEstimes` est le nouveau
// champ distinct pour le coût en tokens de CE agent — les deux budgets ne se confondent jamais
// (Article 22 régule les appels Gemini déclenchés par l'agent, SMART-CONSO-TOKEN régule les tokens
// de l'agent lui-même, cf. CLAUDE.md).
export const CIRCLE_ITEMS = [
  {
    id: "profil",
    theme: "Suivi & référentiels",
    label: "Mettre à jour le profil utilisateur",
    cout: "gratuit — lecture/écriture de texte, zéro appel API",
    tokensEstimes: "quelques milliers de tokens (lecture de l'index + de la dernière fiche, rédaction d'une nouvelle observation datée)",
    execute: "Suivre la procédure de docs/regles-de-travail.md §9 (Historisation du profil) : comparer les signaux de la session en cours à la dernière fiche, écrire une nouvelle observation datée, mettre à jour l'index.",
  },
  {
    id: "referentiel",
    theme: "Suivi & référentiels",
    label: "Relire tous les documents de référence",
    cout: "gratuit — lecture, aucun appel API",
    tokensEstimes: "élevé si réellement exhaustif — potentiellement plusieurs dizaines de milliers de tokens (CLAUDE.md seul pèse ~29 000 tokens estimés, cf. docs/smart-conso-token/) ; \"gratuit\" ne veut jamais dire \"gratuit en tokens\"",
    execute: "Relire CLAUDE.md (Article 13, vérification périodique) et toute la table des matières réelle de docs/referentiel/ + racine de docs/ — corriger tout écart trouvé immédiatement (Article 3), jamais seulement le signaler.",
  },
  {
    id: "kpi",
    theme: "KPI & scans",
    label: "Lancer le rapport KPI (familles gratuites)",
    cout: "gratuit — node scripts/kpi-report.mjs, zéro nouvel appel API",
    tokensEstimes: "faible à modéré — sortie du script (quelques milliers de tokens) + rédaction de l'entrée d'index",
    execute: "Lancer node scripts/kpi-report.mjs et lire au moins la famille Robustesse du code (100% mécanique) — les autres familles restent honnêtement N/A si aucun serveur de dev avec du vrai trafic n'est joignable.",
  },
  {
    id: "always-new-code-signal",
    theme: "Qualité du code",
    label: "Signaler la zone la plus négligée (ALWAYS-NEW-CODE)",
    cout: "gratuit — lecture de la mémoire de couverture déjà accumulée, jamais le vrai zoom (ça, c'est un raisonnement coûteux à part, cf. Article 23)",
    tokensEstimes: "faible — lecture d'un seul fichier d'index compact",
    execute: "Lire docs/always-new-code/index.md et reporter honnêtement la zone la plus négligée (ou jamais examinée) — proposer, jamais lancer, le vrai zoom profond correspondant, qui reste un raisonnement coûteux nécessitant sa propre consultation SMART-CONSO-TOKEN.",
  },
  // clean-dirty-old-signal (2026-09-20, idée proposée par l'agent, validée par l'utilisateur : « ajoute
  // les nouvelles idées au catalogue »). Même patron que le signal ALWAYS-NEW-CODE ci-dessus, mais
  // CLEAN-DIRTY-OLD n'a pas d'équivalent "mémoire de couverture par zone" à lire — son propre index
  // (docs/clean-dirty-old/index.md) journalise seulement les PASSAGES déjà effectués. Le signal ici
  // est donc honnêtement plus modeste : depuis quand ce carnet n'a-t-il pas été relu, jamais une
  // fausse "zone la plus négligée" inventée sans le vrai balayage (git log par fichier) que
  // CLEAN-DIRTY-OLD effectue réellement une fois lancé.
  {
    id: "clean-dirty-old-signal",
    theme: "Qualité du code",
    label: "Vérifier depuis quand CLEAN-DIRTY-OLD n'a pas été consulté",
    cout: "gratuit — lecture du registre de passages déjà accumulé, jamais le vrai balayage (ça, c'est le travail réel de CLEAN-DIRTY-OLD une fois lancé)",
    tokensEstimes: "faible — lecture d'un seul fichier d'index compact",
    execute: "Lire docs/clean-dirty-old/index.md et reporter honnêtement depuis quand aucun passage n'a été journalisé — proposer, jamais lancer seul, un vrai passage CLEAN-DIRTY-OLD si le carnet est resté silencieux trop longtemps.",
  },
  // html-wiring-check (2026-09-20, même origine). Vérifie mécaniquement (grep de import, jamais une
  // exécution) que les outils censés produire une copie HTML (Article 13, gabarit html-report.mjs)
  // le font bien réellement — trouvaille concrète cette nuit : seul kpi-report.mjs l'utilisait,
  // el-professor.mjs/the-final-judge.mjs/the-screener-capture.mjs pas encore câblés.
  {
    id: "html-wiring-check",
    theme: "Qualité du code",
    label: "Vérifier que tous les rapports produisent bien leur copie HTML",
    cout: "gratuit — lecture du code source de chaque script, aucun appel API",
    tokensEstimes: "faible — quelques fichiers courts à relire",
    execute: "Vérifier que el-professor.mjs, the-final-judge.mjs et the-screener-capture.mjs importent bien html-report.mjs (cf. checkHtmlWiring()) — câbler ceux qui manquent encore, jamais laisser un rapport sortir en texte brut alors que la règle demande du HTML.",
  },
  // claude-md-weight-signal (2026-09-20, demande explicite de l'utilisateur après la tâche #122 :
  // « prevois que l'allegement de claude.md peut devenir une tache recurrente [...] peut etre à
  // ajouter au menu des taches periodiques »). Contrairement aux autres signaux de ce thème, celui-ci
  // ne lit pas un index de passages passés : il relance le VRAI calcul (scanDocumentWeight,
  // listDatedNarrativeMarkers), déjà gratuit et déjà exporté par SMART-CONSO-TOKEN — jamais un second
  // calcul, jamais une estimation périmée. cf. docs/referentiel/smart-conso-token.md pour la
  // procédure formalisée complète (objectifs + méthode) à suivre si ce signal recommande une passe.
  {
    id: "claude-md-weight-signal",
    theme: "Qualité du code",
    label: "Vérifier le poids en tokens de CLAUDE.md (allègement périodique)",
    cout: "gratuit — relit CLAUDE.md et applique les fonctions déjà exportées par SMART-CONSO-TOKEN, aucun appel API",
    tokensEstimes: "faible — un seul fichier local relu par le script, pas par l'agent",
    execute: "Lire CLAUDE.md et appeler scanDocumentWeight()/listDatedNarrativeMarkers() (docs/referentiel/smart-conso-token.md) — si le niveau remonte à \"élevé\" ou que de nouvelles asides datées apparaissent, proposer une passe d'allègement selon la procédure formalisée, jamais l'exécuter seul.",
  },
  {
    id: "correctifs",
    theme: "Suivi & référentiels",
    label: "Relire les carnets de correctifs et points fragiles",
    cout: "gratuit — lecture, aucun appel API",
    tokensEstimes: "modéré — lecture de deux carnets (points-fragiles.md, correctifs-a-revalider.md)",
    execute: "Relire docs/simulations/correctifs-a-revalider.md et docs/referentiel/points-fragiles.md — retirer ce qui est confirmé stable (2 simulations propres consécutives), signaler ce qui traîne sans jamais avancer.",
  },
  // suivi-open-tasks-signal (2026-09-20, même origine que les deux items ci-dessus). Réutilise
  // categorizeAllSessions() de check-suivi-fidelity.mjs (jamais un second parseur de docs/suivi/) —
  // signale honnêtement la tâche "ouverte"/"en cours" la plus ancienne, jamais une liste complète
  // (ça, c'est le travail de la relecture des référentiels ci-dessus).
  // Double fonction formalisée le 2026-09-20 (demande explicite : « mes prompts intempestifs
  // perturbent la planification [...] mets à jour [...] les outils dédiés ») : ce signal ne
  // détecte pas seulement du travail oublié faute de temps, mais aussi une tâche interrompue par un
  // message mid-turn et jamais reprise ensuite — cf. docs/systeme-de-suivi.md, section dédiée.
  {
    id: "suivi-open-tasks-signal",
    theme: "Suivi & référentiels",
    label: "Signaler la tâche ouverte la plus ancienne (docs/suivi)",
    cout: "gratuit — lecture des fichiers de session déjà écrits, aucun appel API",
    tokensEstimes: "faible — parcours mécanique de fichiers déjà en mémoire de travail",
    execute: "Lire docs/suivi/sessions/*.md via categorizeAllSessions() et reporter la tâche ouverte/en cours la plus ancienne — jamais juger seul si elle doit être close, juste signaler qu'elle traîne (ou qu'elle a été interrompue par un prompt intempestif et jamais reprise).",
  },
  {
    id: "smart-conso-api-scan",
    theme: "KPI & scans",
    label: "Scanner les schémas de consommation API (Smart Conso API)",
    cout: "gratuit — node scripts/smart-conso-api.mjs scan, lecture de l'historique déjà accumulé, zéro nouvel appel API",
    tokensEstimes: "faible — sortie compacte d'un script",
    execute: "Lancer `node scripts/smart-conso-api.mjs scan` et lire les constats (taux d'épuisement récent élevé, relancement trop rapide après un épisode confirmé) — jamais un jugement sur le code du jeu, seulement le rythme des appels déjà faits.",
  },
  {
    id: "smart-conso-token-scan",
    theme: "KPI & scans",
    label: "Scanner le poids des documents de travail (SMART-CONSO-TOKEN)",
    cout: "gratuit — scan de portée Global, lecture de fichiers, zéro appel API",
    tokensEstimes: "faible à modéré — sortie du scan + lecture des fichiers qu'il pointe comme volumineux",
    execute: "Relancer un scan de portée Global (cf. docs/referentiel/smart-conso-token.md) — particulièrement utile après une session qui a fait grossir CLAUDE.md ou docs/, pour repérer une dérive avant qu'elle ne s'accumule trop.",
  },
  // « Photo de la dream team » (2026-09-20, demande explicite de l'utilisateur, pendant une pause
  // fun : « garde en mémoire et écrit que cette "photo" de la dream team fait partie des tâches
  // proposées lors des rondes périodiques »). Seul item de CIRCLE_ITEMS purement récréatif — jamais
  // un outil de travail technique, aucun impact sur la charte ni le code du jeu.
  {
    id: "dream-team-photo",
    theme: "Qualité & fun",
    label: "Régénérer la « photo » de la dream team (récap des outils nommés)",
    cout: "gratuit — lecture de la liste des outils déjà nommés dans CLAUDE.md/docs/regles-de-travail.md, mise en forme, zéro appel API",
    tokensEstimes: "modéré — rédaction d'un document HTML complet à partir d'une liste déjà connue",
    execute: "Régénérer le document récapitulatif (nom, rôle, commentaire sur le nom choisi) de tous les outils/agents nommés du projet et le livrer en fichier HTML à l'utilisateur (cf. scripts/html-report.mjs) — pour le plaisir, jamais un livrable technique.",
  },
  // THE-SCREENER (2026-09-20, demande explicite de l'utilisateur : « il y a aussi la possibilité de
  // demander une capture d'écran de la simulation (avec coût API) si je ne me trompe pas »).
  // Précision importante trouvée en relisant docs/referentiel/the-screener.md avant d'ajouter cet
  // item (Article 19) : le MÉCANISME lui-même (capture Playwright + lecture vision par l'agent)
  // coûte ZÉRO appel Gemini — la seule vraie condition est de disposer déjà d'une session/un serveur
  // avec un état réel à capturer, jamais de lancer une simulation complète juste pour la photo (ce
  // serait un vrai coût Gemini indirect, contraire à l'Article 8).
  {
    id: "the-screener",
    theme: "Qualité & fun",
    label: "Capturer et noter 2 captures d'écran (THE-SCREENER)",
    cout: "zéro appel à l'API Gemini pour le mécanisme lui-même (capture Playwright locale) — CONDITIONNEL : n'a de sens que si une session/un serveur avec un vrai état est déjà en cours ; ne jamais lancer une nouvelle simulation juste pour cet item",
    tokensEstimes: "modéré — lecture vision de 2 images par l'agent + rédaction de la notation",
    execute: "Lancer node scripts/the-screener-capture.mjs contre un serveur DÉJÀ actif (dev ou site en ligne) avec une vraie session en cours, lire les 2 captures et noter contre docs/referentiel/regles-des-graphismes.md — jamais déclencher une nouvelle simulation juste pour cet item.",
  },
  // THE-FINAL-JUDGE (2026-09-20, demande explicite de l'utilisateur : « integre le dans la liste à
  // cocher malgré tout [...] avec un panneau d'avertissement [...] caractères couleur rouge [...]
  // le coût en token »). Revient sur le choix initial (le garder hors de la fenêtre) — l'utilisateur
  // préfère l'avoir SOUS LES YEUX à chaque ronde, mais jamais confondu visuellement avec un item
  // gratuit : `costly: true` déclenche le traitement d'alerte (ANSI rouge en terminal, préfixe
  // ⚠️🔴 partout) — jamais une case cochée par défaut, jamais bundlée silencieusement avec le reste.
  {
    id: "the-final-judge",
    theme: "Audit lourd",
    label: "THE-FINAL-JUDGE — audit indépendant",
    cout: `${ALERT_ICON} COÛTEUX — ~${FINAL_JUDGE_TOKEN_COST.toLocaleString("fr-FR")} tokens fixes (agent séparé), quel que soit le palier choisi`,
    tokensEstimes: `~${FINAL_JUDGE_TOKEN_COST.toLocaleString("fr-FR")} tokens fixes — le seul chiffre de ce paysage issu d'une vraie recherche documentée plutôt que d'une estimation à l'ordre de grandeur`,
    execute: "Consulter Smart Conso API ET SMART-CONSO-TOKEN avant de lancer quoi que ce soit (Article 22) — jamais un réflexe de routine, seulement si un vrai besoin de regard indépendant justifie la dépense.",
    costly: true,
  },
  // THE-DEEP-READER (2026-09-20, cousin de THE-FINAL-JUDGE, jamais un mode de THE-FINAL-JUDGE —
  // règle d'entrée opposée : reçoit la conversation, jamais le code/produit, cf.
  // docs/referentiel/the-deep-reader.md). Même traitement d'alerte que THE-FINAL-JUDGE (demande
  // explicite de l'utilisateur : « il faut cabler suivi conso token sur la decision liée à cette
  // operation ») — coût honnêtement DIFFÉRENT (pas fixe : le plancher agent + le volume réel de
  // conversation à relire, jamais présenté comme équivalent au coût constant de THE-FINAL-JUDGE).
  {
    id: "the-deep-reader",
    theme: "Audit lourd",
    label: "THE-DEEP-READER — relecture lourde du suivi (conversation vs docs/suivi)",
    cout: `${ALERT_ICON} COÛTEUX — ~${FINAL_JUDGE_TOKEN_COST.toLocaleString("fr-FR")} tokens fixes (agent séparé) + volume réel de la conversation à relire (variable, jamais fixe)`,
    tokensEstimes: `~${FINAL_JUDGE_TOKEN_COST.toLocaleString("fr-FR")} tokens fixes au minimum, plus selon la taille de l'historique fourni — jamais un chiffre constant contrairement à THE-FINAL-JUDGE`,
    execute: "Consulter Smart Conso API ET SMART-CONSO-TOKEN avant de lancer quoi que ce soit (même actionType agent_subagent_spawn que THE-FINAL-JUDGE) — préférer d'abord la version légère gratuite (docs/systeme-de-suivi.md) sauf besoin réel d'un regard non biaisé.",
    costly: true,
  },
];

// Signal de fraîcheur MÉCANIQUE, jamais inventé (2026-09-20) : la date la plus récente mentionnée
// dans un texte, au format YYYY-MM-DD ou ISO complet. Volontairement générique plutôt qu'un parseur
// par colonne propre à chaque document (fragile, à réécrire à chaque nouveau format de tableau) —
// suffisant pour un simple "depuis combien de temps", jamais pour une lecture qualitative fine.
export function mostRecentDate(text) {
  const matches = [...(text || "").matchAll(/\b(20\d{2}-\d{2}-\d{2})(T\d{2}:\d{2}:\d{2}Z)?\b/g)];
  if (!matches.length) return undefined;
  const isoStrings = matches.map((m) => (m[0].length === 10 ? m[0] + "T00:00:00Z" : m[0]));
  return isoStrings.reduce((max, d) => (d > max ? d : max));
}

export function daysSince(dateStr, now = Date.now()) {
  if (!dateStr) return undefined;
  const days = Math.floor((now - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));
  return days >= 0 ? days : undefined;
}

// checkHtmlWiring() (2026-09-20) : vérifie mécaniquement, par une simple recherche de texte dans
// le CODE SOURCE déjà en mémoire (jamais une exécution, jamais un appel réseau), qu'un script cite
// bien html-report.mjs — le seul signal fiable qu'il produit réellement sa copie HTML plutôt que du
// texte brut. `sources` : { "nom-du-script.mjs": "contenu source" }.
export function checkHtmlWiring(sources) {
  return Object.entries(sources || {}).map(([script, content]) => ({ script, wired: /html-report\.mjs/.test(content || "") }));
}

// findRegistriesMissingFromCircle() (2026-09-21, trou trouvé par l'utilisateur : « est-ce que la
// ronde a bien dans son catalogue tous les outils pertinents ? incluant tous les nouveaux
// outils/scripts ? »). Vérifié : LE-COORDINATEUR a déjà findToolsMissingFromMenu() pour PRESTATIONS,
// CIRCLE_ITEMS n'avait rien d'équivalent. Contrairement à PRESTATIONS (un seul critère mécanique,
// isMenuWorthy()), il n'existe aucun prédicat unique pour "doit rejoindre la Ronde" — chaque
// inclusion/exclusion actuelle est une vraie décision individuelle documentée en tête de ce fichier
// (ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD/CHECK-LEVEL-TARGET tournent déjà à chaque commit,
// EL-PROFESSOR est déjà obligatoire à chaque simulation via l'Article 18, etc.). Le garde-fou
// honnête ici n'est donc pas "recalculer la règle", mais repérer tout outil ayant un vrai registre
// périodique (`docs/<slug>/index.md`, réellement présent sur disque) qui n'apparaît NULLE PART —
// ni dans CIRCLE_ITEMS, ni dans la liste d'exclusions ci-dessous, chaque exclusion portant sa
// propre raison plutôt qu'un silence. `existingPaths` : même Set que buildRealOnboardingContext()
// (check-tasks-details.mjs), jamais un second parcours de disque réinventé (walkDocsPaths(),
// extraite dans lib-shell.mjs pour éviter un cycle d'import entre les deux fichiers).
export const CIRCLE_EXCLUDED_REGISTRIES = {
  argus: "tourne déjà à chaque commit (Article 20), jamais une routine manuelle en plus",
  harmonia: "tourne déjà à chaque commit (Article 20), jamais une routine manuelle en plus",
  "axa-check": "tourne déjà à chaque commit (Article 20), jamais une routine manuelle en plus",
  "clean-dirty-old": "sa partie mécanique tourne déjà à chaque commit (Article 20) — seul son SIGNAL de fraîcheur rejoint la Ronde (clean-dirty-old-signal), jamais un second passage complet",
  "check-level-target": "outil de classification interne, jamais une routine à cocher soi-même",
  "hyper-scan-checkpoint": "outil exceptionnel (Article 21), jamais coché par défaut ni régulier",
  "check-tasks-details": "état des lieux à la demande, pas une routine périodique mal automatisée",
  "el-professor": "déjà obligatoire à chaque simulation (Article 18, étape 4bis), une seconde routine ferait doublon",
  simulations: "l'archive elle-même, pas un outil à relancer périodiquement",
};
export function findRegistriesMissingFromCircle(existingPaths, items = CIRCLE_ITEMS) {
  const registrySlugs = [...new Set(
    [...(existingPaths || [])]
      .map((p) => p.match(/^docs\/([a-z0-9-]+)\/index\.md$/))
      .filter(Boolean)
      .map((m) => m[1]),
  )];
  // Comparaison bidirectionnelle par id (jamais un texte joint) : un registre plus court que son
  // item ("profil" ⊂ "profil-utilisateur") ou plus long ("always-new-code" ⊂
  // "always-new-code-signal") doit matcher dans les deux sens, jamais un seul.
  return registrySlugs.filter((slug) => !(slug in CIRCLE_EXCLUDED_REGISTRIES) && !items.some((i) => slug.includes(i.id) || i.id.includes(slug)));
}

// oldestOpenTaskDate() (2026-09-20) : lit directement le résultat déjà calculé par
// categorizeAllSessions() (check-suivi-fidelity.mjs, jamais un second parseur de docs/suivi/) et
// retient la date la plus ancienne parmi les tâches "ouverte"/"en cours" — la colonne horodatage
// est la 2e cellule de chaque ligne (cells[1]), cf. le format réel de docs/suivi/sessions/*.md.
export function oldestOpenTaskDate(categorized) {
  const dates = [...(categorized?.ouverte ?? []), ...(categorized?.enCours ?? [])]
    .map((e) => e.cells?.[1])
    .filter(Boolean);
  if (!dates.length) return undefined;
  return dates.reduce((min, d) => (d < min ? d : min));
}

// Agrège un signal de fraîcheur honnête pour les items qui en ont un (profil, KPI, zone
// ALWAYS-NEW-CODE la plus négligée) — jamais pour "relecture référentiel" ou "correctifs", qui
// n'ont aucune date de référence mécanique fiable (Article 13 elle-même n'impose aucune cadence
// fixe, cf. CLAUDE.md — un signal inventé ici serait moins honnête que son absence).
export function buildCircleReport({ profilIndexText, kpiIndexText, alwaysNewCodeIndexText, smartConsoApiIndexText, smartConsoTokenIndexText, cleanDirtyOldIndexText, htmlWiringSources, suiviCategorized, claudeMdText } = {}, now = Date.now()) {
  const profilLast = mostRecentDate(profilIndexText);
  const kpiLast = mostRecentDate(kpiIndexText);
  const smartConsoApiLast = mostRecentDate(smartConsoApiIndexText);
  const smartConsoTokenLast = mostRecentDate(smartConsoTokenIndexText);
  const cleanDirtyOldLast = mostRecentDate(cleanDirtyOldIndexText);
  const wiring = htmlWiringSources ? checkHtmlWiring(htmlWiringSources) : undefined;
  const oldestOpen = suiviCategorized ? oldestOpenTaskDate(suiviCategorized) : undefined;
  const coverage = parseCoverage(alwaysNewCodeIndexText || "");
  const zoneRec = recommendZone(THEMES, coverage, undefined, new Date(now));

  return CIRCLE_ITEMS.map((item) => {
    if (item.id === "profil") return { ...item, staleness: profilLast ? `${daysSince(profilLast, now)} jour(s) depuis la dernière fiche` : "jamais fait" };
    if (item.id === "kpi") return { ...item, staleness: kpiLast ? `${daysSince(kpiLast, now)} jour(s) depuis le dernier rapport archivé` : "jamais fait" };
    if (item.id === "smart-conso-api-scan") return { ...item, staleness: smartConsoApiLast ? `${daysSince(smartConsoApiLast, now)} jour(s) depuis la dernière décision archivée` : "jamais fait" };
    if (item.id === "smart-conso-token-scan") return { ...item, staleness: smartConsoTokenLast ? `${daysSince(smartConsoTokenLast, now)} jour(s) depuis le dernier scan archivé` : "jamais fait" };
    if (item.id === "clean-dirty-old-signal") return { ...item, staleness: cleanDirtyOldLast ? `${daysSince(cleanDirtyOldLast, now)} jour(s) depuis le dernier passage journalisé` : "jamais fait" };
    if (item.id === "html-wiring-check") {
      if (!wiring) return { ...item, staleness: "pas de signal de fraîcheur mécanique disponible" };
      const missing = wiring.filter((w) => !w.wired).map((w) => w.script);
      return { ...item, staleness: missing.length ? `${missing.length} script(s) pas encore câblé(s) : ${missing.join(", ")}` : "tous câblés" };
    }
    if (item.id === "suivi-open-tasks-signal") return { ...item, staleness: oldestOpen ? `tâche ouverte depuis ${daysSince(oldestOpen, now)} jour(s)` : "aucune tâche ouverte connue" };
    if (item.id === "claude-md-weight-signal") {
      if (!claudeMdText) return { ...item, staleness: "pas de signal disponible (CLAUDE.md non fourni)" };
      const weight = scanDocumentWeight(claudeMdText, "CLAUDE.md", { alwaysLoaded: true });
      const markers = listDatedNarrativeMarkers(claudeMdText);
      // CLAUDE.MD.SPY (2026-09-20, reste-à-faire de la tâche #199) : signale le meilleur candidat de
      // redondance détecté, jamais un calcul dupliqué — réutilise directement extractRuleUnits()/
      // findRedundantRulePairs() de smart-conso-token.mjs (§7ter, anti-duplication).
      const redundant = findRedundantRulePairs(extractRuleUnits(claudeMdText));
      const redundancyNote = redundant.length ? ` — candidat de redondance : ${redundant[0].a} / ${redundant[0].b} (indice ${redundant[0].jaccard.toFixed(2)})` : "";
      return { ...item, staleness: `${weight.tokens} tokens estimés, niveau "${weight.niveau}"${markers.length ? ` — ${markers.length} aside(s) narrative(s) datée(s) encore réductible(s)` : ""}${redundancyNote}` };
    }
    if (item.id === "always-new-code-signal") {
      if (!zoneRec) return { ...item, staleness: "aucun thème connu" };
      const zoneDate = coverage[zoneRec.zone];
      return { ...item, staleness: zoneDate ? `zone la plus négligée : "${zoneRec.zone}" (${daysSince(zoneDate, now)} jour(s))` : `zone la plus négligée : "${zoneRec.zone}" (jamais examinée)` };
    }
    if (item.costly) return { ...item, staleness: "jamais une routine — décision au cas par cas, à chaque fois" };
    return { ...item, staleness: "pas de signal de fraîcheur mécanique disponible" };
  });
}

// Regroupement par thème (2026-09-20, idée explicite de l'utilisateur : « proposer les coches/les
// prestations par thème » plutôt qu'un découpage arbitraire "les 4 premiers, puis les 4 suivants").
// Ordre fixe, jamais recalculé dynamiquement (un thème qui change de place d'une ronde à l'autre
// serait plus déroutant qu'utile) — THE-FINAL-JUDGE reste dans son propre thème "Audit lourd",
// systématiquement en dernier, cohérent avec la convention déjà actée (toujours en dernière
// position de la fenêtre). Chaque thème tient dans un seul bloc de question (≤4 options).
export const THEME_ORDER = ["Suivi & référentiels", "KPI & scans", "Qualité du code", "Qualité & fun", "Audit lourd"];
export function groupCircleReportByTheme(report) {
  const groups = THEME_ORDER.map((theme) => ({ theme, items: report.filter((r) => r.theme === theme) }));
  const untagged = report.filter((r) => !THEME_ORDER.includes(r.theme));
  if (untagged.length) groups.push({ theme: "Autre", items: untagged });
  return groups.filter((g) => g.items.length > 0);
}

// `colorize` par défaut vrai (sortie terminal réelle, ce script et les crochets git) — mis à faux
// pour toute sortie destinée à être relue comme du texte brut (tests, archive future) où des codes
// ANSI seraient juste des caractères parasites, jamais un vrai signal visuel.
export function formatCircleMenu(report, { colorize = true } = {}) {
  const lines = ["| Item | Coût API | Tokens Claude (estimation) | Fraîcheur |", "|---|---|---|---|"];
  for (const r of report) {
    const label = r.costly && colorize ? red(`${ALERT_ICON} ${r.label}`) : r.label;
    const cout = r.costly && colorize ? red(r.cout) : r.cout;
    const tokens = r.costly && colorize ? red(r.tokensEstimes) : r.tokensEstimes;
    lines.push(`| ${label} | ${cout} | ${tokens} | ${r.staleness} |`);
  }
  return lines.join("\n");
}

// Rappel de fraîcheur pour le crochet post-commit (2026-09-20, demande explicite de l'utilisateur :
// « rappelle-moi à des moments naturels ») — mémoire best-effort locale, jamais committée, même
// statut que .le-coordinateur-last-run.json. Un seuil de commits, jamais une fenêtre de temps (les
// commits sont l'unité de mesure déjà utilisée ailleurs dans ce paysage pour "du travail a eu
// lieu"), déclenché seulement si le nombre de commits réels depuis le dernier passage confirmé
// dépasse le seuil — jamais à chaque commit, ce serait juste un second LE-COORDINATEUR redondant.
const LAST_RUN_PATH = fileURLToPath(new URL("../.circle-tasks-last-run.json", import.meta.url));
export const REMINDER_COMMIT_THRESHOLD = 10;

export function loadLastRun(readFile = (f) => readFileSync(f, "utf8")) {
  try { return JSON.parse(readFile(LAST_RUN_PATH)); } catch { return {}; }
}

// `commitsSinceLastRun` : fourni par l'appelant (déjà calculé ailleurs, ex. via `git rev-list
// --count`) — CIRCLE-TASKS ne relance jamais lui-même une commande git, jamais un second mécanisme
// de comptage à côté de celui déjà utilisé par LE-COORDINATEUR/le suivi.
export function shouldRemindCircleTasks(commitsSinceLastRun) {
  if (!Number.isFinite(commitsSinceLastRun)) return false;
  return commitsSinceLastRun >= REMINDER_COMMIT_THRESHOLD;
}

// À appeler explicitement par l'agent une fois une vraie ronde effectuée (au moins un item traité),
// jamais automatiquement — CIRCLE-TASKS ne sait jamais tout seul si l'agent a réellement fait le
// travail derrière chaque case cochée (aucun mécanisme ne peut le vérifier, même honnêteté que le
// reste de ce paysage). `totalCommitCount` : le compte réel au moment du passage (`git rev-list
// --count HEAD`), fourni par l'appelant.
export function recordCircleTasksRun(totalCommitCount, now = Date.now()) {
  const state = { lastRunCommitCount: totalCommitCount, lastRunAt: now };
  writeFileSync(LAST_RUN_PATH, JSON.stringify(state, null, 1));
  return state;
}

// Rapport de fin de Ronde (2026-09-20, trou trouvé par l'utilisateur : « je n'ai pas eu de rapport
// à la fin de la ronde, c'est voulu ? » — non, ce n'était qu'un oubli : main() n'a jamais affiché
// que le menu AVANT exécution, jamais un récapitulatif APRÈS). Même principe que
// buildFinalJudgeReportHtml() (the-final-judge.mjs) : ce script n'a aucun main() qui sait, après
// coup, quels items ont réellement été cochés puis exécutés dans la conversation — c'est donc
// l'agent qui pilote qui appelle cette fonction lui-même, une fois la Ronde terminée, jamais un
// second mécanisme d'exécution automatique. Index LÉGER, jamais un doublon (calibrage explicite du
// 2026-09-20) : chaque item coché produit déjà sa propre sortie de référence (fiche profil, CSV
// KPI, entrée de registre...) — ce rapport se contente de lister quoi a tourné, un résultat en une
// phrase, et un lien vers cette sortie déjà produite, jamais son contenu recopié.
// `entries`: Array<{ id: string, label: string, outcome: string, link?: string }>.
export const CIRCLE_RUN_SUMMARY_HTML_PATH = ".circle-tasks-run-summary-latest.html";
export function buildCircleRunSummaryHtml(entries, { dateLabel } = {}) {
  const rows = (entries || []).map((e) => [e.label ?? e.id ?? "—", e.outcome ?? "—", e.link ?? "—"]);
  const blocks = rows.length
    ? [{ type: "table", headers: ["Item exécuté", "Résultat", "Lien"], rows }]
    : [{ type: "note", text: "Aucun item n'a été coché pour cette Ronde." }];
  return renderHtmlReport({
    title: "CIRCLE-TASKS — récapitulatif de la Ronde",
    subtitle: "Index léger : ce qui a tourné et un pointeur vers la sortie déjà produite par chaque item, jamais son contenu dupliqué ici.",
    dateLabel: dateLabel ?? new Date().toISOString(),
    blocks,
    footer: "CIRCLE-TASKS — la sélection des items reste toujours confirmée par une fenêtre à cocher avant exécution, jamais un tout-en-un silencieux.",
  });
}

function main() {
  const read = (p) => (existsSync(`${ROOT}${p}`) ? readFileSync(`${ROOT}${p}`, "utf8") : "");
  const profilIndexText = read("docs/profil-utilisateur/index.md");
  const kpiIndexText = read("docs/referentiel/kpi-index.md");
  const alwaysNewCodeIndexText = read("docs/always-new-code/index.md");
  const smartConsoApiIndexText = read("docs/smart-conso-api/index.md");
  const smartConsoTokenIndexText = read("docs/smart-conso-token/index.md");
  const cleanDirtyOldIndexText = read("docs/clean-dirty-old/index.md");
  const htmlWiringSources = {
    "el-professor.mjs": read("scripts/el-professor.mjs"),
    "the-final-judge.mjs": read("scripts/the-final-judge.mjs"),
    "the-screener-capture.mjs": read("scripts/the-screener-capture.mjs"),
  };
  const suiviCategorized = categorizeAllSessions();
  const claudeMdText = read("CLAUDE.md");
  const report = buildCircleReport({ profilIndexText, kpiIndexText, alwaysNewCodeIndexText, smartConsoApiIndexText, smartConsoTokenIndexText, cleanDirtyOldIndexText, htmlWiringSources, suiviCategorized, claudeMdText });
  console.log("=== CIRCLE-TASKS — Ronde périodique ===\n");
  console.log(formatCircleMenu(report));
  console.log("\nJamais exécuté seul : l'agent qui pilote ouvre une fenêtre à cocher pour choisir précisément quoi lancer.");
  console.log(red(`${ALERT_ICON} THE-FINAL-JUDGE reste visible ci-dessus mais n'est JAMAIS coché par défaut — vérifie Smart Conso API ET SMART-CONSO-TOKEN avant de le sélectionner.`));
  console.log("Rappel : les autres items coûteux du paysage (check-spirit.mjs, HYPER-SCAN-CHECKPOINT complet) restent hors de cette ronde pour l'instant, jamais des cases à cocher ici.");
  const rootNoSlash = ROOT.replace(/\/$/, "");
  const missingRegistries = findRegistriesMissingFromCircle(walkDocsPaths(`${rootNoSlash}/docs`, rootNoSlash));
  if (missingRegistries.length) console.log(red(`${ALERT_ICON} Registre(s) sans item ni exclusion documentée dans la Ronde : ${missingRegistries.join(", ")} — à ajouter à CIRCLE_ITEMS ou à CIRCLE_EXCLUDED_REGISTRIES avec sa raison.`));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
