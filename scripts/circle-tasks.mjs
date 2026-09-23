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
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { categorizeAllSessions } from "./check-suivi-fidelity.mjs";
import { scanDocumentWeight, listDatedNarrativeMarkers, extractRuleUnits, findRedundantRulePairs } from "./smart-conso-token.mjs";
import { AGENT_CATEGORIES, walkDocsPaths, daysSince, sh, shouldSnapshotText, printReliabilityNotice } from "./lib-shell.mjs";
import { checkChantierFileFreshness, loadAllTaskRows, detectPendingIdeaCandidates, loadIdeaDecisions, findIdeasNeedingDecision, IDEES_REGISTRY_PATH } from "./check-tasks-details.mjs";
import { auditHtmlDecisions, REGISTRIES as DOC_REPORT_REGISTRIES } from "./doc-report.mjs";
import { renderHtmlReport } from "./html-report.mjs";
// Ré-exportée telle quelle (jamais une redéfinition) : circle-tasks.mjs reste le point d'import déjà
// utilisé ailleurs (check-house.mjs) pour cette fonction, même après son déplacement vers lib-shell.mjs
// le 2026-09-21 (cf. commentaire au-dessus de sa définition dans lib-shell.mjs).
export { daysSince };
import { extractPrincipleUnits, buildEvolutionDigest, findPossibleTensions, philosophyFreshnessDays } from "./the-king.mjs";
import { recordCliUsage, recordToolContribution } from "./tool-usage.mjs";
import { loadJsonArray } from "./lib-json.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// Alerte visuelle non négociable (2026-09-20, demande explicite de l'utilisateur : « chaque fois
// que the-judge doit être sollicité [...] il y a un message d'alerte avec une icône : faire
// attention, des caractères en rouge et le prix en token fixe (37K) »). `ALERT_ICON` pour toute
// surface textuelle (chat, description d'option d'une fenêtre à cocher — aucune couleur possible
// là) ; `red()` pour la sortie TERMINAL uniquement (ce script, les crochets git), où de vrais
// caractères ANSI rouges sont affichables. Jamais mélangé : une fenêtre à cocher ne rend jamais les
// codes ANSI, elle recevrait du texte brut illisible — seul le préfixe ⚠️🔴 y est utilisé.
export const ALERT_ICON = "⚠️🔴";
// REPORT_ICON (2026-09-21, tâche #340, question directe de l'utilisateur : « je voudrais un icone
// supplementaire "rapport" partout ou c'est necessaire, pour ceux qui produisent des rapport vs les
// autres ») — distingue un item qui produit réellement un artefact durable et indexé (nouvelle
// fiche, fichier archivé, nouvelle édition) d'un item qui n'est qu'un signal console, jamais deviné
// depuis le nom de l'item : lu directement sur `producesReport` de CIRCLE_ITEMS.
export const REPORT_ICON = "📄";
export const FINAL_JUDGE_TOKEN_COST = 37000;
export function red(text) { return `\x1b[31m${text}\x1b[0m`; }

// Les items gratuits (nombre exact toujours vérifiable via CIRCLE_ITEMS.length dans
// check-house.mjs, jamais recopié en dur ici — corrigé le 2026-09-21 après avoir trouvé ce
// commentaire resté à "9" alors que le catalogue en comptait déjà 13, exactement l'écart que
// l'Article 13 interdit) — complétés en plusieurs passes depuis le 2026-09-20 : « il n'y a pas
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
    execute: "Suivre la procédure de docs/regles-de-travail.md §9 (Historisation du profil) : comparer les signaux de la session en cours à la dernière fiche, écrire une nouvelle observation datée, mettre à jour l'index. Écraser ensuite docs/profil-utilisateur/profil-actuel.txt avec cette même observation à jour (2026-09-21, demande explicite : « mon profil utilisateur à part, dans un fichier txt ») — un seul fichier toujours à jour, séparé de l'historique daté, jamais un second calcul divergent.",
    producesReport: true,
  },
  {
    id: "referentiel",
    theme: "Suivi & référentiels",
    label: "Relire tous les documents de référence",
    cout: "gratuit — lecture, aucun appel API",
    tokensEstimes: "élevé si réellement exhaustif — potentiellement plusieurs dizaines de milliers de tokens (CLAUDE.md seul pèse ~29 000 tokens estimés, cf. docs/smart-conso-token/) ; \"gratuit\" ne veut jamais dire \"gratuit en tokens\"",
    execute: "Relire CLAUDE.md (Article 13, vérification périodique) et toute la table des matières réelle de docs/referentiel/ + racine de docs/ — corriger tout écart trouvé immédiatement (Article 3), jamais seulement le signaler. Écrire ensuite un court résumé de ce qui a été relu et trouvé via recordCircleItemReport('referentiel', ...) — règle générale du 2026-09-21, même les relectures manuelles laissent une trace.",
    producesReport: true,
  },
  // the-king-signal (2026-09-21, tâche #167) : la promesse initiale de l'utilisateur pour THE-KING
  // ("il remet à jour [le digest] à chaque ronde, à integrer à la ronde auto") — jamais un vrai
  // balayage lourd ici, seulement la fraîcheur (lastTouchDays réutilisé) et le digest déjà mécanique
  // (extractPrincipleUnits/buildEvolutionDigest/findPossibleTensions, zéro appel API).
  {
    id: "the-king-signal",
    theme: "KPI & scans",
    label: "Digest THE-KING : fraîcheur et tensions possibles de la philosophie",
    cout: "gratuit — relit un seul fichier local, zéro appel API",
    tokensEstimes: "faible — sortie compacte (fraîcheur + digest daté + tensions éventuelles)",
    execute: "Lancer node scripts/the-king.mjs (ou appeler philosophyFreshnessDays()/buildEvolutionDigest()/findPossibleTensions() directement) et reporter honnêtement la fraîcheur de docs/philosophie-et-politique.md et toute tension possible trouvée — jamais corriger le document soi-même, seulement signaler. Écrire le résultat via recordCircleItemReport('the-king-signal', ...) (dossier docs/the-king/, jamais son index.md principal — cf. CIRCLE_REPORT_FOLDERS). Appeler ensuite recordSnapshotIfChanged('the-king-signal', contenu actuel de docs/philosophie-et-politique.md, ...) — une NOUVELLE snapshot datée s'ajoute à l'historique local du dossier seulement si le contenu a réellement changé depuis la dernière (jamais une cadence fixe en nombre de Rondes, jamais un fichier unique écrasé — corrigé le 2026-09-22, la version du 2026-09-21 écrasait à tort un seul fichier).",
    producesReport: true,
  },
  {
    id: "kpi",
    theme: "KPI & scans",
    label: "Lancer le rapport KPI (familles gratuites)",
    cout: "gratuit — node scripts/kpi-report.mjs, zéro nouvel appel API",
    tokensEstimes: "faible à modéré — sortie du script (quelques milliers de tokens) + rédaction de l'entrée d'index",
    execute: "Lancer node scripts/kpi-report.mjs et lire au moins la famille Robustesse du code (100% mécanique) — les autres familles restent honnêtement N/A si aucun serveur de dev avec du vrai trafic n'est joignable.",
    producesReport: true,
  },
  // always-new-code-signal RETIRÉ le 2026-09-21 : ALWAYS-NEW-CODE promu sixième Gardien sacré (couche
  // légère seulement — recommendZone()/addendaSignal()/churnSignal(), zéro raisonnement) — tourne
  // désormais déjà automatiquement à chaque commit (scripts/hooks/check-last-commit.mjs), exactement
  // le même précédent que CLONE-HUNTER (son propre item de Ronde retiré à sa promotion le 2026-09-22
  // pour la même raison) — jamais une routine manuelle en plus. Cf. CIRCLE_AUTO_COVERED_REGISTRIES
  // ci-dessous pour la raison documentée. Le vrai zoom profond, lui, reste hors Ronde (raisonnement
  // payant, Article 23) — inchangé.
  // clean-dirty-old-signal (2026-09-20, idée proposée par l'agent, validée par l'utilisateur : « ajoute
  // les nouvelles idées au catalogue »). Même patron que le signal ALWAYS-NEW-CODE ci-dessus, mais
  // CLEAN-DIRTY-OLD n'a pas d'équivalent "mémoire de couverture par zone" à lire — son propre index
  // (docs/clean-dirty-old/index.md) journalise seulement les PASSAGES déjà effectués. Le signal ici
  // est donc honnêtement plus modeste : depuis quand ce carnet n'a-t-il pas été relu, jamais une
  // fausse "zone la plus négligée" inventée sans le vrai balayage (git log par fichier) que
  // CLEAN-DIRTY-OLD effectue réellement une fois lancé.
  // pure-gold-unity (2026-09-22) — ABSENT de la Ronde jusqu'à ce que l'utilisateur pose la question
  // (« pour pure gold que tu viens de creer : il est bien dans circle ? »). Il ne l'était pas, et
  // AUCUN garde-fou ne pouvait le dire : findRegistriesMissingFromCircle() ne regarde que les outils
  // ayant déjà un registre sur le disque, or pure-gold n'en avait aucun. Un outil sans registre
  // était donc invisible à la vérification censée repérer les outils oubliés — le trou vivait dans
  // le garde-fou lui-même (cf. findReportingToolsMissingFromCircle(), écrit le même jour).
  //
  // Sa place ici est celle d'un DÉTECTEUR DE RÉGRESSION, jamais d'un rattrapage : son chantier est
  // clos (29/29), et un chiffre qui remonterait signalerait un nouvel outil écrivant son rapport à
  // la main. C'est précisément le genre de chose qu'on ne pense jamais à vérifier soi-même.
  {
    id: "pure-gold-unity-scan",
    theme: "Qualité du code",
    label: "Vérifier qu'aucun nouveau rapport n'échappe au gabarit partagé",
    cout: "gratuit — relit le code des outils tenus par le gabarit, aucun appel API",
    tokensEstimes: "faible — un chiffre et, le cas échéant, la liste des outils à migrer",
    execute: "Lancer node scripts/pure-gold-unity.mjs et reporter le ratio réel de conformité. Un chiffre inférieur à 100 % signale une RÉGRESSION (un outil récent écrit son rapport à la main), jamais un retard à rattraper — le chantier initial est clos depuis le 2026-09-22. Écrire le signal via recordCircleItemReport('pure-gold-unity-scan', ...).",
    producesReport: true,
  },
  {
    id: "clean-dirty-old-signal",
    theme: "Qualité du code",
    label: "Vérifier depuis quand CLEAN-DIRTY-OLD n'a pas été consulté",
    cout: "gratuit — lecture du registre de passages déjà accumulé, jamais le vrai balayage (ça, c'est le travail réel de CLEAN-DIRTY-OLD une fois lancé)",
    tokensEstimes: "faible — lecture d'un seul fichier d'index compact",
    execute: "Lire docs/clean-dirty-old/index.md et reporter honnêtement depuis quand aucun passage n'a été journalisé — proposer, jamais lancer seul, un vrai passage CLEAN-DIRTY-OLD si le carnet est resté silencieux trop longtemps. Écrire le signal via recordCircleItemReport('clean-dirty-old-signal', ...).",
    producesReport: true,
  },
  // html-wiring-check (2026-09-20, même origine ; RECÂBLÉ le 2026-09-21 sur doc-report.mjs après
  // avoir trouvé — en construisant la règle « chaque outil doit produire un rapport » — que ce
  // check dupliquait un mécanisme déjà écrit : doc-report.mjs a déjà checkHtmlWiring(scriptPath) +
  // auditHtmlDecisions(REGISTRIES), qui parcourt TOUS les registres marqués "delivery_html"/
  // "archived_html" via leur vrai champ `decision`, jamais 3 scripts codés en dur.
  {
    id: "html-wiring-check",
    theme: "Qualité du code",
    label: "Vérifier que tous les rapports produisent bien leur copie HTML",
    cout: "gratuit — lecture du code source de chaque script déjà enregistré, aucun appel API",
    tokensEstimes: "faible — sortie compacte de auditHtmlDecisions()",
    execute: "Appeler auditHtmlDecisions() (scripts/doc-report.mjs) — jamais un second calcul — et écrire le résultat via recordCircleItemReport('html-wiring-check', ...) : tout registre en mismatch (decision HTML mais script non câblé) doit être câblé dans la foulée, jamais laissé en texte brut.",
    producesReport: true,
  },
  // ecotoken-scan (2026-09-20, demande explicite de l'utilisateur après la tâche #122 :
  // « prevois que l'allegement de claude.md peut devenir une tache recurrente [...] peut etre à
  // ajouter au menu des taches periodiques »). Contrairement aux autres signaux de ce thème, celui-ci
  // ne lit pas un index de passages passés : il relance le VRAI calcul (scanDocumentWeight,
  // listDatedNarrativeMarkers), déjà gratuit et déjà exporté par SMART-CONSO-TOKEN — jamais un second
  // calcul, jamais une estimation périmée. cf. docs/referentiel/smart-conso-token.md pour la
  // procédure formalisée complète (objectifs + méthode) à suivre si ce signal recommande une passe.
  {
    id: "ecotoken-scan",
    theme: "Qualité du code",
    label: "Vérifier le poids en tokens de CLAUDE.md (allègement périodique)",
    cout: "gratuit — relit CLAUDE.md et applique les fonctions déjà exportées par SMART-CONSO-TOKEN, aucun appel API",
    tokensEstimes: "faible — un seul fichier local relu par le script, pas par l'agent",
    execute: "Lancer `node scripts/ecotoken.mjs` (ecotoken) — il relit lui-même scanDocumentWeight()/listDatedNarrativeMarkers() de SMART-CONSO-TOKEN, jamais un second calcul, et ajoute ce que ce signal ne savait pas faire : le rendement par article (citations réelles ÷ lignes), le plan de réduction chiffré avec son texte de remplacement prêt à relire, le budget anti-regrossissement, et ce que l'outil a retenu des passages précédents. Écrire son rapport via recordCircleItemReport('ecotoken-scan', ...), puis recordSnapshotIfChanged('ecotoken-scan', contenu actuel de CLAUDE.md, ...) — copie texte datée, une nouvelle snapshot seulement sur un vrai changement. Remplir ENSUITE à la main la colonne « Décision » de docs/ecotoken/index.md : c'est la seule chose que l'outil ne peut pas deviner, et c'est ce qui l'empêche de reproposer indéfiniment une piste déjà refusée. HARMONISATION (2026-09-22) : un seul item de Ronde sur CLAUDE.md, jamais deux — ecotoken a absorbé ce signal plutôt que de s'ajouter à côté.",
    producesReport: true,
  },
  {
    id: "correctifs",
    theme: "Suivi & référentiels",
    label: "Relire les carnets de correctifs et points fragiles",
    cout: "gratuit — lecture, aucun appel API",
    tokensEstimes: "modéré — lecture de deux carnets (points-fragiles.md, correctifs-a-revalider.md)",
    execute: "Relire docs/simulations/correctifs-a-revalider.md et docs/referentiel/points-fragiles.md — retirer ce qui est confirmé stable (2 simulations propres consécutives), signaler ce qui traîne sans jamais avancer. Écrire un court résumé via recordCircleItemReport('correctifs', ...) — règle générale du 2026-09-21, même les relectures manuelles laissent une trace.",
    producesReport: true,
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
    execute: "Lire docs/suivi/sessions/*.md via categorizeAllSessions() et reporter la tâche ouverte/en cours la plus ancienne — jamais juger seul si elle doit être close, juste signaler qu'elle traîne (ou qu'elle a été interrompue par un prompt intempestif et jamais reprise). Écrire le signal via recordCircleItemReport('suivi-open-tasks-signal', ...).",
    producesReport: true,
  },
  // chantier-preliminaire-signal (2026-09-21, demande explicite de l'utilisateur : « je veux un
  // petit outil qui verifie lors de la ronde que les idees formulées ont bien été renseignées dans
  // un fichier prelimnaire [...] certainement une extension d'un outil existant »). Extension
  // exacte, jamais un second calcul : réutilise checkChantierFileFreshness()/loadAllTaskRows()
  // (check-tasks-details.mjs, registre CHANTIER_PRELIMINARY_FILES), jusqu'ici câblées seulement
  // dans le rapport de check-tasks-details lui-même, jamais vues si on ne le lance pas explicitement.
  // Calibrage explicite : signal automatique à chaque Ronde (jamais un item à cocher à part) ; sur
  // un vrai écart trouvé, propose explicitement de mettre à jour le fichier concerné dans la foulée,
  // jamais un simple constat qui resterait en suspens jusqu'à la prochaine Ronde.
  {
    id: "chantier-preliminaire-signal",
    theme: "Suivi des chantiers",
    label: "Vérifier que les idées de gros chantier sont bien dans leur fichier préliminaire, et que leur valeur y est vraiment restituée",
    cout: "gratuit — relit docs/suivi/ et croise avec le registre CHANTIER_PRELIMINARY_FILES, aucun appel API",
    tokensEstimes: "faible — parcours mécanique de fichiers déjà en mémoire de travail",
    // ÉLARGI le 2026-09-22 aux deux vérifications ajoutées ce jour-là, plutôt qu'en faire deux items
    // de plus (§7ter, anti-duplication) : elles portent sur les mêmes fichiers, par le même registre,
    // et répondent à la même question posée sous trois angles — l'idée a-t-elle rejoint son fichier
    // (fraîcheur), ce fichier restitue-t-il les DEUX voix (la règle « ma valeur + ta valeur »), et le
    // registre connaît-il seulement tous les fichiers réels (sans quoi les deux premières sont
    // aveugles à ce qu'il ignore).
    execute: "Appeler checkChantierFileFreshness(loadAllTaskRows()), findChantierFilesMissingValueRestitution() et findConceptionFilesMissingFromRegistry() — sur un vrai écart (une tâche de suivi plus récente que son fichier préliminaire, un fichier qui ne porte qu'une seule des deux voix, ou un fichier de conception réel jamais déclaré au registre), proposer explicitement de le corriger tout de suite, jamais le laisser en suspens jusqu'à la prochaine Ronde. Écrire le signal via recordCircleItemReport('chantier-preliminaire-signal', ...).",
    producesReport: true,
  },
  // tool-learning (2026-09-22, demande explicite : « intégré à circle pour un suivi au top, comme
  // le reste »). Seconde moitié de l'évolutivité — SAFE-EXPORT porte la première (pouvoir partir),
  // celui-ci la seconde (devenir meilleur). Il juge une TRAJECTOIRE, donc il a sa place dans un
  // rythme périodique et pas à chaque commit : trois passages minimum avant de conclure.
  {
    id: "tool-learning",
    theme: "Qualité & fun",
    label: "Vérifier que les outils apprennent — et que je les aide vraiment à progresser",
    cout: "gratuit — relit les registres et les traces déjà produits, aucun appel API",
    tokensEstimes: "faible — lecture de journaux existants",
    execute: "Lancer node scripts/tool-learning.mjs, juger chaque outil concerné (jugerUnOutil), proposer l'amélioration la moins coûteuse là où une preuve manque (proposerAmelioration), et NE créer une tâche que si l'agent retient la proposition ET qu'elle exige une validation de l'utilisateur (tacheADeclencher). Vérifier aussi ses propres verdicts passés (verifierSesPropresVerdicts) — un outil jugé immobile qui a progressé sans mon intervention réfute le critère, pas l'outil. Écrire le signal via recordCircleItemReport('tool-learning', ...). PROCESS XP-IA-bonnes-pratiques-et-lecons (2026-09-23, docs/xp-ia-process-detail.md) — ce poste porte aussi les DEUX étapes de Ronde de ce process, et ce sont les seules que la mécanique ne peut pas produire à ma place : (1) ÉCRIRE LA CONCLUSION DE PÉRIODE sur MA façon de travailler (enregistrerXp avec nature 'conclusion'), à partir du journal XP et du registre des leçons — l'outil sait compter les captations, il ne sait pas dire quel travers revient chez moi ; (2) PRÉSENTER LES ENTRÉES À L'UTILISATEUR pour qu'il dise lesquelles ont été réellement APPLIQUÉES (enregistrerXp avec nature 'jugement', parUtilisateur: true) — jamais l'agent sur son propre travail, c'est une décision explicite du 2026-09-23. Et la Ronde est elle-même un des trois moments déclencheurs : répondre à « y avait-il quelque chose à retenir ? », « rien à retenir » compris.",
    producesReport: true,
  },
  // a-niveau (2026-09-23) — LE VERDICT D'ENSEMBLE, et il a sa place ici plutôt qu'au commit pour une
  // raison de fond : « tout est-il à niveau ? » n'est pas une question qu'on se pose après avoir
  // touché trois lignes, c'est une question de période. À chaque commit elle produirait le même
  // verdict des dizaines de fois d'affilée, et un signal qui ne change jamais cesse d'être lu.
  {
    id: "the-equalizer",
    theme: "Qualité & fun",
    label: "Tout est-il à niveau ? — un verdict par domaine, et ce que personne ne vérifie",
    cout: "gratuit — relit le référentiel des standards et relaie des verdicts déjà calculés",
    tokensEstimes: "faible — un document et un audit d'intégration déjà existant",
    execute: "Lancer node scripts/the-equalizer.mjs. Lire les quatre verdicts de domaine, puis regarder d'abord les deux catégories que RIEN d'autre ne remonte : les exigences déclarées que personne ne vérifie (elles sont attendues, elles doivent rester peu nombreuses et assumées) et les vérificateurs FANTÔMES (une exigence qui annonce une fonction inexistante — jamais toléré, c'est une promesse creuse, à corriger le jour même). Le retard outil par outil vient d'integrationAudit() et se traite comme d'habitude. Un niveau ORPHELIN signalé veut dire que le référentiel a gagné une section que le verdict ne compte nulle part : la rattacher dans DOMAINES ou la renommer, jamais la laisser.",
    producesReport: true,
  },
  // recap-evaluations (2026-09-22, demande explicite de l'utilisateur : « je veux lors de la ronde le
  // détail des KPI et/ou evaluations, notes qui sont produites par certains outils, dans un fichier
  // HTML normé bien mis en evidence [...] qui me juge comment, de quelle maniere, sur quelles bases,
  // avec quel resultat »). Inclut l'évaluation de SA PROPRE participation, qu'il a demandée lui-même
  // et pour une raison conservée dans angel-of-ia-process.mjs : que le projet reste la priorité même
  // au prix de frictions. Ce n'est donc jamais un item à adoucir.
  {
    id: "recap-evaluations",
    // « KPI & scans » plutôt qu'un thème neuf : ce récapitulatif assemble des KPI déjà produits, il
    // appartient donc à la famille de l'item `kpi`. Inventer une catégorie pour un seul item aurait
    // ajouté une fenêtre de plus à cocher pour zéro clarté gagnée — et le garde-fou de thèmes de
    // check-house l'a attrapé le jour même, la première tentative ayant justement créé un thème
    // inconnu de THEME_ORDER.
    theme: "KPI & scans",
    label: "Récapitulatif complet des évaluations — qui juge qui, sur quelles bases, avec quel résultat",
    cout: "gratuit — relit des mesures déjà collectées par huit outils, aucun appel API",
    tokensEstimes: "moyen — assemble des verdicts déjà produits, n'en recalcule aucun",
    execute: "Récolter les verdicts du JURY (angel-of-ia-process), calculer mesurerParticipation(), fournir les notes de jugement AVEC leur justification (jamais laissées non fournies sans le dire), puis buildEvaluationRecapBlocks() (cassandra-rh) rendu en HTML via renderHtmlReport(). Vérifier findJugesSansOutil() avant de se fier au rapport. Écrire le signal via recordCircleItemReport('recap-evaluations', ...).",
    producesReport: true,
  },
  // idee-a-trancher-signal (2026-09-21, demande explicite de l'utilisateur : « me demander
  // systematiquement, pour chaque idee developpée, [...] si je souhaite la creation d'un fichier
  // preliminaire [...] ou si l'idee doit etre abandonnée, ou entre-deux [...] L'alerte remontera
  // alors une deuxieme fois lors de la prochaine ronde, si entre temps aucun fichier n'a été créé »).
  // FILET DE SÉCURITÉ MÉCANIQUE, jamais le mécanisme principal (qui reste le réflexe en temps réel
  // documenté dans docs/regles-de-travail.md, déclenché au moment même où une idée est proposée) —
  // rattrape ce que ce réflexe aurait manqué, cf. docs/idees-a-trancher.md pour le registre complet
  // et sa note méthodologique (portée volontairement limitée aux idées NOUVELLES, jamais un
  // balayage textuel brut sur l'historique déjà clos). Voisin direct de chantier-preliminaire-signal
  // ci-dessus (même thème, même famille de garde-fou), mais une idée n'est pas forcément un "gros
  // chantier" nommé : portée plus large (tout Sujet "Nouvel outil"/"Conception"), décision à 3 voies
  // (fichier créé / abandonnée / entre-deux) au lieu d'un simple écart de fraîcheur binaire.
  {
    id: "idee-a-trancher-signal",
    theme: "Suivi des chantiers",
    label: "Vérifier qu'aucune idée nouvelle n'attend encore une décision (fichier / abandon / entre-deux)",
    cout: "gratuit — relit docs/suivi/ et docs/idees-a-trancher.md, aucun appel API",
    tokensEstimes: "faible — parcours mécanique de fichiers déjà en mémoire de travail",
    execute: "Appeler findIdeasNeedingDecision(detectPendingIdeaCandidates(loadAllTaskRows()), loadIdeaDecisions(lecture de docs/idees-a-trancher.md)) — pour chaque idée remontée, poser la question à 3 voies (créer un fichier préliminaire / abandonner / entre-deux) via une fenêtre dédiée, jamais déduire la décision soi-même ; consigner la réponse dans docs/idees-a-trancher.md le jour même. Écrire aussi le signal via recordCircleItemReport('idee-a-trancher-signal', ...) (jamais un doublon de docs/idees-a-trancher.md, qui reste le registre des DÉCISIONS — celui-ci n'est que la preuve d'exécution du contrôle).",
    producesReport: true,
  },
  {
    id: "smart-conso-api-scan",
    theme: "KPI & scans",
    label: "Scanner les schémas de consommation API (Smart Conso API)",
    cout: "gratuit — node scripts/smart-conso-api.mjs scan, lecture de l'historique déjà accumulé, zéro nouvel appel API",
    tokensEstimes: "faible — sortie compacte d'un script",
    execute: "Lancer `node scripts/smart-conso-api.mjs scan` et lire les constats (taux d'épuisement récent élevé, relancement trop rapide après un épisode confirmé) — jamais un jugement sur le code du jeu, seulement le rythme des appels déjà faits. Écrire le résultat via recordCircleItemReport('smart-conso-api-scan', ...) (dossier docs/smart-conso-api/, jamais son index.md principal).",
    producesReport: true,
  },
  {
    id: "smart-conso-token-scan",
    theme: "KPI & scans",
    label: "Scanner le poids des documents de travail (SMART-CONSO-TOKEN)",
    cout: "gratuit — scan de portée Global, lecture de fichiers, zéro appel API",
    tokensEstimes: "faible à modéré — sortie du scan + lecture des fichiers qu'il pointe comme volumineux",
    execute: "Relancer un scan de portée Global (cf. docs/referentiel/smart-conso-token.md) — particulièrement utile après une session qui a fait grossir CLAUDE.md ou docs/, pour repérer une dérive avant qu'elle ne s'accumule trop.",
    producesReport: true,
  },
  // tool-brain-report (2026-09-21, demande explicite de l'utilisateur : « tool brain délivre un
  // rapport txt à chaque ronde, pour te dire si tu as suffisamment utilisé les outils [...] et
  // eventuellement diagnostiquer des ameliorations à apporter sur le systeme global "tool-brain" »).
  // Réutilise formatToolBrainReport() (scripts/tool-brain.mjs) tel quel, jamais un second calcul —
  // thème "Passages réels (smoke run)" (jamais "KPI & scans", déjà plein à 4 items) : comme
  // profil-utilisateur-guard/network-check-run, ce n'est jamais une simple lecture d'index déjà
  // calculé, mais un vrai calcul relancé contre l'historique réel à chaque passage. Aucun signal de
  // fraîcheur mécanique ici (tool-brain n'a pas de registre propre, catégorie « Membre certifié
  // classique »), même fallback honnête que "correctifs"/"referentiel" ci-dessus.
  // check-tasks-details en RAPPORT DE RONDE (2026-09-22, tâche #357, demande explicite de
  // l'utilisateur : « je veux aussi un rapport txt, dans le cadre des rondes, de la part de
  // check-tasks-detail [...] un état des lieux precis des taches en cours, plus une vision globale
  // au niveau du projet. capable de dire ou on en est dans le projet, oeil critique, avec
  // differents zoom, differents regards. + de verifier les chiffres du suivi »).
  // Quatre parties calibrées explicitement, et les TROIS zooms dans le même rapport plutôt qu'un
  // zoom à choisir au lancement : un item de Ronde tourne sans personne pour arbitrer, donc lui
  // faire choisir un angle reviendrait à perdre les deux autres. Ses constats rejoignent la série
  // de questions à choix forcé de l'Étape 5, jamais un rapport qu'on peut ne pas ouvrir.
  {
    // OÙ ON EN EST (2026-09-23, demande explicite de l'utilisateur : « est-ce que ce récap peut
    // être fait à chaque Ronde ? »). TROISIÈME angle sur les mêmes tâches, et l'utilisateur a
    // lui-même posé la question de l'harmonisation : les deux autres regardent la FILE (rien n'a
    // dérivé ? / qu'est-ce qu'on fait maintenant ?), celui-ci regarde le CHEMIN PARCOURU (qu'est-ce
    // qui a été fait, et qu'est-ce que ça a changé ?). Aucun des deux ne répondait à ça.
    id: "ou-on-en-est",
    theme: "Suivi des chantiers",
    label: "Où on en est — ce qui a été fait, et ce que le projet y a gagné",
    cout: "gratuit — relecture seule de docs/suivi/, zéro appel API",
    tokensEstimes: "faible — un bilan chiffré par domaine, jamais la relecture de chaque tâche",
    execute: "Appeler buildOuOnEnEstHtml(bilan(...)) (scripts/ou-on-en-est.mjs) — jamais un second calcul des chiffres du suivi — et écrire le HTML via recordCircleItemReport('ou-on-en-est', ...).",
    producesReport: true,
  },
  {
    id: "check-tasks-report",
    // Thème « Suivi des chantiers » plutôt que « Suivi & référentiels » : le second était déjà à 4
    // items, soit exactement la limite réelle de 4 options par question de la fenêtre à cocher — un
    // 5e l'aurait rendu impossible à afficher (contrainte attrapée en direct par le test dédié, pas
    // devinée). Le classement n'est pas un pis-aller pour autant : la PARTIE 2 de ce rapport porte
    // précisément sur l'état des chantiers, le même sujet que les deux autres items de ce thème.
    theme: "Suivi des chantiers",
    label: "check-tasks-details — rapport de Ronde (chiffres vérifiés, état du projet, œil critique, 3 zooms)",
    cout: "gratuit — relecture seule de docs/suivi/, zéro appel API",
    tokensEstimes: "modéré — quatre parties dont l'état détaillé aux trois zooms, le plus long rapport de la Ronde",
    execute: "Appeler buildRondeTextReport() (scripts/check-tasks-details.mjs) — jamais un second calcul des chiffres du suivi — et écrire le texte via recordCircleItemReport('check-tasks-report', ...). Lire ensuite la PARTIE 3 (œil critique) : chacun de ses constats doit rejoindre la série de questions à choix forcé de l'Étape 5, jamais rester dans le fichier seul.",
    producesReport: true,
  },
  {
    id: "tool-brain-report",
    theme: "Passages réels (smoke run)",
    label: "Rapport tool-brain (usage réel des outils + auto-diagnostic)",
    cout: "gratuit — relit .tool-usage-history.json (compteur déjà existant), zéro appel API",
    tokensEstimes: "faible — sortie compacte du script",
    execute: "Lancer `node scripts/tool-brain.mjs rapport` et lire le rapport (outils du catalogue jamais sollicités, outils les moins utilisés, auto-diagnostic borné au périmètre de tool-brain lui-même) — jamais un jugement sur le reste du paysage, seulement l'usage réel des outils et tool-brain lui-même. Écrire le résultat via recordCircleItemReport('tool-brain-report', ...) (nouveau dossier docs/tool-brain/).",
    producesReport: true,
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
    producesReport: true,
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
    producesReport: true,
  },
  // ines-official-signal (2026-09-21, tâche #168) : déclenchement PÉRIODIQUE explicitement demandé
  // par l'utilisateur — jamais réservé à une demande explicite ponctuelle (correction d'une première
  // proposition de l'agent). Le signal lui-même ne relit que l'index léger (gratuit) ; l'édition
  // réelle, si proposée, reste une action distincte et confirmée (jamais lancée seule ici).
  {
    id: "ines-official-signal",
    theme: "Qualité & fun",
    label: "Proposer une nouvelle édition INES-official si l'ancienne date",
    cout: "gratuit — lecture de l'index existant, l'édition elle-même (si proposée ensuite) reste 0 appel API",
    tokensEstimes: "faible pour le signal seul ; élevé si l'édition complète est ensuite relue par l'agent (le corps reste local, jamais committé)",
    execute: "Lire docs/ines-official/index.md (dernière version/date) et proposer une nouvelle édition (node scripts/ines-official.mjs <code|code_et_docs>) si aucune récente n'existe — jamais lancée automatiquement sans confirmation. Écrire le signal via recordCircleItemReport('ines-official-signal', ...) (dossier docs/ines-official/, jamais son index.md principal).",
    producesReport: true,
  },
  // cassandra-rh-signal (2026-09-21, noyau CASSANDRA-RH fiabilisé) — signal léger décidé dès la
  // conception (« signal léger à chaque Ronde CIRCLE-TASKS + bilan complet sur demande »).
  // PROMU AU RAPPORT COMPLET le 2026-09-21 (même soir, demande explicite : « je veux un rapport
  // complet à chaque ronde ») — reversal assumé du calibrage initial, jamais un coût API réel
  // (calcul local, node scripts/cassandra-rh.mjs rapport n'appelle jamais Gemini).
  {
    id: "cassandra-rh-signal",
    theme: "Qualité & fun",
    label: "Bilan RH complet de l'équipe (effectif, badges, tendance KPI) — CASSANDRA-RH",
    cout: "gratuit — relit checkAgentOnboarding()/kpi-historique.csv/tool-usage.mjs, jamais un second calcul, zéro appel API malgré le mode complet",
    tokensEstimes: "modéré — rapport HTML complet (~9 000-12 500 octets mesurés), à chaque Ronde depuis le 2026-09-21",
    execute: "Lancer node scripts/cassandra-rh.mjs rapport (mode complet, plus le signal léger) à CHAQUE Ronde — livrer le HTML via html-report.mjs/SendUserFile et mettre à jour docs/cassandra-rh/index.md selon son format déjà établi, jamais recordCircleItemReport (réservé aux signaux texte simples).",
    producesReport: true,
  },
  // organigramme-signal (2026-09-22, tâches #171/#172/#179 — calibrage explicite : l'organigramme
  // « fait partie des rapports produits à chaque ronde et analysé par tes soins », et « quand il
  // sort depuis la ronde : dans un fichier en txt bien présenté ». Distinct du bilan RH ci-dessus,
  // jamais fusionné : celui-là juge l'équipe (badges, couverture, outils à reconsidérer), celui-ci
  // en montre seulement la STRUCTURE — qui est où, et qui n'est nulle part.
  {
    // conformite-process (2026-09-22) — LE rapport de process de la Ronde, et le seul. Architecture
    // fixée par l'utilisateur le jour même : « c'est god of process qui produit le rapport
    // uniquement [...] Les rapports de process secondaires ne produisent pas de rapport directement
    // livrés à la ronde : ce serait trop : god of process centralise. » Les gardiens secondaires
    // (celui de la Ronde, celui de la simulation) gardent leur verdict ; god le RELAIE, jamais ne le
    // recalcule. Thème « Suivi des chantiers » : il n'en portait que 3, et le respect d'un process
    // est bien un suivi d'avancement, pas une mesure de qualité du code.
    id: "god-of-all-process-conformite",
    theme: "Suivi des chantiers",
    label: "Conformité des process — god-of-all-process (rapport unique, coupable nommé)",
    cout: "gratuit — relit les traces réelles sur le disque et relaie les verdicts des gardiens secondaires, zéro appel API",
    tokensEstimes: "faible — un rapport texte court, une ligne par manquement réel",
    execute: "Appeler buildProcessComplianceReport() (scripts/god-of-all-process.mjs) en lui passant les verdicts des gardiens secondaires déjà obtenus, puis écrire le résultat via recordCircleItemReport('god-of-all-process-conformite', texte). Le rapport nomme le responsable de chaque étape sautée, et liste séparément les étapes qu'aucun mécanisme ne peut vérifier — celles-là ne sont reprochées à personne.",
    producesReport: true,
  },
  // integration-audit (2026-09-22) — NÉ D'UNE QUESTION DE L'UTILISATEUR : « lors de la ronde, on est
  // ok qu'il y a un check pour chaque nouveau outil : bien intégré à tout, bien certifié, etc. ? ».
  // Vérifié avant de répondre, et la réponse était NON.
  //
  // Ce qui existait ne couvrait pas la question : cassandra-rh-signal n'annonce QUE les badges qui
  // BOUGENT (un membre incomplet depuis trois jours ne produit rien — le silence d'un outil
  // d'annonce n'a jamais voulu dire « tout va bien ») ; organigramme-signal ne voit que les membres
  // déjà déclarés ; et les vrais garde-fous d'intégration tournent à chaque commit via check-house,
  // jamais ici, jamais regroupés en une vue lisible.
  //
  // Son premier passage réel a immédiatement trouvé que process.simulation.guardian, construit le
  // matin même et inscrit dans la table maîtresse, n'avait ni instanciation, ni registre, ni
  // blueprint, ni mention dans la charte. Certifié sur le papier, incomplet en réalité — exactement
  // le trou que cet item existe pour fermer.
  // data-archangel (2026-09-22) — troisième volet de son calibrage : « les 2 + pendant la ronde ».
  // La commande à la demande sert l'agent quand il y pense ; l'alerte sonne quand une donnée fraîche
  // est ignorée ; cet item-ci est le rattrapage périodique, celui qui ne dépend de personne.
  {
    id: "data-archangel-scan",
    theme: "KPI & scans",
    label: "La donnée produite par l'équipe est-elle exploitée, ou écrite pour rien ?",
    cout: "gratuit — relit le code des scripts et la date des fichiers déjà sur le disque, zéro appel API",
    tokensEstimes: "faible — un ratio, la liste des orphelines, quelques branchements suggérés",
    execute: "Lancer node scripts/data-archangel.mjs et lire le ratio de sources réellement relues. LIRE la nuance imprimée en bas du rapport avant de conclure : un registre destiné à l'œil humain n'a pas besoin d'un lecteur-outil, la question posée est « personne n'exploite la SÉRIE ? ». Les branchements suggérés sont des suggestions, jamais des manquements — en retenir un est une décision, jamais une évidence. Écrire le signal via recordCircleItemReport('data-archangel-scan', ...).",
    producesReport: true,
  },
  {
    id: "integration-audit",
    theme: "Qualité du code",
    label: "Chaque membre est-il RÉELLEMENT intégré partout (badge, docs, catalogue, Ronde) ?",
    cout: "gratuit — relit la table maîtresse, les documents et les registres déjà sur le disque, zéro appel API",
    tokensEstimes: "faible — une ligne par membre incomplet, rien du tout quand l'équipe est complète",
    execute: "Appeler integrationAudit() (scripts/le-coordinateur.mjs) avec le contexte de buildRealOnboardingContext() et les trois angles morts (findScriptsMissingFromAgentFiles, findToolsMissingFromMenu, findReportingToolsMissingFromCircle), puis integrationAuditLines(). Un membre incomplet est une VRAIE tâche à ouvrir, jamais une remarque à noter — un outil certifié sur le papier mais sans documentation est indéfendable devant un agent qui reprend le projet (Article 27). Écrire le signal via recordCircleItemReport('integration-audit', ...).",
    producesReport: true,
  },
  {
    id: "organigramme-signal",
    // Thème « Qualité du code » plutôt que « Qualité & fun » (corrigé le soir même par le test qui
    // garde la limite réelle de 4 options par fenêtre — « Qualité & fun » en avait déjà 4). Ce n'est
    // pas un placement par défaut faute de place : l'organigramme mesure la STRUCTURE de l'outillage,
    // exactement comme ses trois voisins de ce thème mesurent la dette, le câblage HTML et le poids
    // de la charte — un membre certifié sans suite assignée est une dette d'organisation, pas un
    // divertissement.
    theme: "Qualité du code",
    label: "Organigramme de l'Agence Codex, reconstruit depuis les données réelles — CASSANDRA-RH",
    cout: "gratuit — dérive la table maîtresse, AGENT_CATEGORIES, GARDIEN_DOMAINS et les émetteurs de rapport, zéro appel API",
    tokensEstimes: "faible — un rapport texte court (~2 000 caractères), jamais une relecture de fichiers entiers",
    execute: "Appeler buildOrganigramme() puis renderOrganigrammeReport() (scripts/cassandra-rh.mjs) et écrire le résultat via recordCircleItemReport('organigramme-signal', ...). LIRE le rapport avant de passer à la suite : un membre certifié sans suite assignée, ou un émetteur de rapport qui devrait être certifié, sont de vrais constats à traiter, jamais un fichier produit puis ignoré.",
    producesReport: true,
  },
  // profil-utilisateur-guard (2026-09-21, trouvaille : « il y a certainement de petits scripts peu
  // coûteux [...] qui peuvent être exécutés, simplement parce qu'ils sont très peu coûteux et que
  // ça garantit la fraîcheur du code » — scripts/check-profil-utilisateur.mjs existait déjà,
  // entièrement écrit et testé par des fixtures SYNTHÉTIQUES dans check-house.mjs, mais son vrai
  // main() n'avait JAMAIS été exécuté contre le projet réel avant ce jour (vérifié en le lançant :
  // « OK — 7 fiche(s) sur disque, toutes référencées dans l'index, aucun lien mort. »). Contrairement
  // à l'item "profil" ci-dessus (qui ÉCRIT une nouvelle observation), celui-ci VÉRIFIE l'intégrité du
  // système déjà écrit (fiches orphelines, liens morts entre l'index et le disque) — un vrai passage
  // réel, jamais un remplacement des fixtures synthétiques qui le couvrent déjà par ailleurs.
  {
    id: "profil-utilisateur-guard",
    theme: "Passages réels (smoke run)",
    label: "Lancer le vrai garde-fou du dossier profil-utilisateur (fiches orphelines, liens morts)",
    cout: "gratuit — node scripts/check-profil-utilisateur.mjs, lecture de fichiers déjà sur disque, zéro appel API",
    tokensEstimes: "faible — sortie compacte du script",
    execute: "Lancer `node scripts/check-profil-utilisateur.mjs` et lire le verdict (fiches sur disque non référencées dans l'index, liens de l'index vers un fichier disparu) — jamais un remplacement des fixtures synthétiques de check-house.mjs, un vrai passage contre l'état réel du dossier. Écrire le verdict via recordCircleItemReport('profil-utilisateur-guard', ...) (dossier docs/profil-utilisateur/, jamais son index.md principal).",
    producesReport: true,
  },
  // network-check-run (2026-09-21, même trouvaille). runNetworkCheck() (le-coordinateur.mjs) est
  // délibérément exclu du crochet post-commit (docs/regles-de-travail.md : « synthèse complète =
  // routine agent, jamais un crochet git [...] redondant à chaque commit ») — mais reste une vraie
  // synthèse utile de temps en temps, pas seulement couverte par ses fonctions mécaniques testées
  // isolément : elle a déjà attrapé un vrai bug caché cette session (`summarizeTokenHistory is not
  // defined`, docs/suivi tâches #140/#148) qu'aucun test unitaire n'avait détecté. Plus coûteux que
  // les autres items gratuits de cette liste (relance check-house.mjs avec instrumentation de
  // couverture V8) — jamais confondu avec le coût AGENT SÉPARÉ fixe de THE-FINAL-JUDGE/
  // THE-DEEP-READER : `costly` reste absent ici, aucun agent séparé n'est jamais invoqué, donc jamais
  // bundlé dans le thème "Audit lourd" qui leur est réservé.
  {
    id: "network-check-run",
    theme: "Passages réels (smoke run)",
    label: "Lancer une vraie synthèse LE-COORDINATEUR (runNetworkCheck)",
    cout: "gratuit — zéro appel API, mais plus lourd que les autres items de cette liste : relance check-house.mjs avec instrumentation de couverture V8",
    tokensEstimes: "modéré à élevé — sortie complète de la synthèse (tableau agrégeant check-house.mjs, AXA-CHECK, ARGUS, HARMONIA, ALWAYS-NEW-CODE, CLEAN-DIRTY-OLD)",
    execute: "Lancer `node scripts/le-coordinateur.mjs` (ou appeler runNetworkCheck() directement) et lire la synthèse complète (les branchements/vérifications croisées entre tous les outils du paysage) — plus cher que les autres items de cette Ronde, à réserver aux passages où une vraie vérification croisée est utile, pas à chaque Ronde mécaniquement. Quand il tourne, écrire la synthèse via recordCircleItemReport('network-check-run', ...) (nouveau dossier docs/network-check/) — demande explicite du 2026-09-21, jamais laissé en signal console seulement.",
    producesReport: true,
  },
  // coordinateur-catalogue (2026-09-21, demande explicite de l'utilisateur : « le catalogue du
  // coordinateur doit être accroché à circle, dès le départ, comme la mise à jour du profil psycho »).
  // Format de livraison conditionnel, précision explicite du même jour : « en format html si c'est
  // un nouveau catalogue jamais produit, en txt si c'est un catalogue qui n'a pas changé » —
  // buildCatalogDelivery() réutilise directement le booléen `written` de recordCatalog() (déjà le
  // signal anti-doublon exact), jamais une seconde détection de changement divergente.
  // Revue combinatoire SYSTÉMATIQUE avant chaque appel (demande explicite le même jour : « je veux
  // que ce soit le coordinateur qui réalise systématiquement cette passe et qui réfléchit aux
  // différentes combinaisons avant de délivrer le catalogue ») : jamais une heuristique mécanique
  // inventée dans le code (LE-COORDINATEUR ne raisonne jamais lui-même, §7ter) — une vraie relecture
  // par l'agent qui pilote, à chaque passage de cet item, pas seulement la première fois.
  {
    id: "coordinateur-catalogue",
    theme: "Passages réels (smoke run)",
    label: "Mettre à jour le catalogue d'offres nommé (LE-COORDINATEUR)",
    cout: "gratuit — node scripts/le-coordinateur.mjs catalogue, écrit une nouvelle version seulement si PRESTATIONS a réellement changé, zéro appel API",
    tokensEstimes: "faible si inchangé (texte simple) ; modéré si nouveau (rédaction d'un rapport HTML complet)",
    execute: "AVANT tout appel de code : relire PRESTATIONS et le paysage complet des outils (docs/regles-de-travail.md §7ter) pour identifier toute combinaison de 2-3 outils réellement utile pas encore proposée ensemble — l'ajouter comme nouvelle prestation nommée si elle apporte une vraie valeur, jamais mécaniquement générée. Appeler ENSUITE recordCatalog() puis buildCatalogDelivery() (scripts/le-coordinateur.mjs) — livrer le résultat en fichier HTML si written:true (nouvelle version réelle, review comprise), ou juste le texte simple si written:false (rien n'a changé depuis la dernière fois, review déjà faite sans rien trouver de neuf).",
    producesReport: true,
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
    producesReport: true,
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
    producesReport: true,
  },
  // HYPER-SCAN-CHECKPOINT — version légère (2026-09-22, intégration demandée explicitement : « vois
  // comment integrer hyper-scan dans circle sinon ca n'a pas trop de sens que circle.process
  // verifie hyper-scan »). Jamais `costly` (sa version légère est réellement gratuite en appel
  // réseau, Article 21) — mais jamais recommandée par défaut non plus : le vrai coût est en
  // RAISONNEMENT agent après coup (la checklist qualitative qui suit, jamais complétée par la seule
  // exécution de cet item). `periodicityTracked: true` réutilise le même mécanisme de seuil que les
  // deux items costly ci-dessus (costlyItemDueStatus()) sans jamais prétendre que ce coût est
  // financier — désormais le lien concret qui donne un sens à circle-process-guardian::
  // verifyHyperScanProcess() (avant ce soir, HYPER-SCAN-CHECKPOINT n'avait aucune existence dans
  // CIRCLE-TASKS, rendant cette vérification hors contexte).
  {
    id: "hyper-scan-checkpoint-light",
    theme: "Audit lourd",
    label: "HYPER-SCAN-CHECKPOINT — version légère (couche mécanique)",
    cout: "gratuit (zéro appel réseau) — mais la checklist qualitative qui suit reste un vrai passage à part, jamais automatisable",
    tokensEstimes: "faible pour la partie mécanique elle-même ; la checklist qualitative qui suit (Article 21) reste un vrai coût de raisonnement variable, jamais estimable à l'avance",
    execute: "Lancer node scripts/hyper-scan-checkpoint.mjs et écrire le résultat via recordCircleItemReport('hyper-scan-checkpoint-light', ...) — ce lancement couvre SEULEMENT la couche mécanique. Traiter la checklist qualitative et ajouter la ligne à docs/hyper-scan-checkpoint/index.md restent un choix DÉLIBÉRÉ et séparé, jamais impliqués par la seule sélection de cet item dans la Ronde (cf. docs/referentiel/hyper-scan-checkpoint.md).",
    periodicityTracked: true,
    producesReport: true,
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

// checkHtmlWiring() DUPLIQUÉE ICI JUSQU'AU 2026-09-21 — retirée (Article 3/19, trouvaille du
// soir en construisant l'item "chaque outil doit produire un rapport" : cette version ne
// vérifiait que 3 scripts codés en dur, jamais tenue à jour, alors que doc-report.mjs a déjà
// checkHtmlWiring(scriptPath)/auditHtmlDecisions(registries) — strictement supérieure (parcourt
// TOUS les registres marqués "delivery_html"/"archived_html" via leur vrai `decision`, jamais une
// liste figée). html-wiring-check importe désormais auditHtmlDecisions directement, jamais un
// second calcul divergent.

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
// ÉLARGI le 2026-09-22 : cette carte servait findRegistriesMissingFromCircle() seul ; elle sert
// désormais aussi findReportingToolsMissingFromCircle() ci-dessus. Les deux posent la MÊME question
// (« cet outil apparaît-il quelque part, ou a-t-on écrit pourquoi il n'apparaît pas ? ») en partant
// de deux bouts différents — une seule liste de raisons, jamais deux qui divergeraient.
export const CIRCLE_AUTO_COVERED_REGISTRIES = {
  // ecotoken (2026-09-22) : son registre existe, mais il n'a PAS d'item propre — c'est
  // `ecotoken-scan` qui le lance, harmonisation explicitement demandée par l'utilisateur
  // (« je crois qu'il y a deja un rapport sur claude.md dans circle. vois comment tu peux tout
  // harmoniser sur ce sujet »). Un second item aurait dit la même chose deux fois.
  // smart-breaker (2026-09-22, le jour de sa certification) : son registre n'archive que des
  // ÉPISODES RÉELS de blocage quota/clé — il se remplit quand un incident survient, jamais sur un
  // rythme. Lui donner un item de Ronde imposerait de sonder l'API périodiquement, ce qui coûte de
  // vrais appels (Article 22) pour, presque toujours, écrire « rien à signaler ». Exclusion
  // MOTIVÉE, jamais un oubli : le bon déclencheur de cet outil est un 429/503 répété, pas le
  // calendrier.
  "smart-breaker": "couvert PAR ÉVÉNEMENT, jamais par calendrier : ce registre n'archive que de vrais épisodes de blocage — le sonder périodiquement coûterait de vrais appels API pour écrire « rien à signaler » (Article 22)",
  argus: "couvert PAR DÉFAUT : tourne déjà automatiquement à chaque commit (Article 20) — jamais écarté de la Ronde, simplement déjà fait quand elle démarre",
  harmonia: "couvert PAR DÉFAUT : tourne déjà automatiquement à chaque commit (Article 20) — jamais écarté de la Ronde, simplement déjà fait quand elle démarre",
  "axa-check": "couvert PAR DÉFAUT : tourne déjà automatiquement à chaque commit (Article 20) — jamais écarté de la Ronde, simplement déjà fait quand elle démarre",
  "clean-dirty-old": "sa partie mécanique tourne déjà à chaque commit (Article 20) — seul son SIGNAL de fraîcheur rejoint la Ronde (clean-dirty-old-signal), jamais un second passage complet",
  "clone-hunter": "cinquième Gardien sacré depuis le 2026-09-22 (demande explicite de l'utilisateur), tourne désormais déjà à chaque commit (Article 20) — jamais une routine manuelle en plus, exactement comme les 4 autres Gardiens ci-dessus",
  "always-new-code": "sixième Gardien sacré depuis le 2026-09-21 (couche légère seulement — demande explicite de l'utilisateur), tourne désormais déjà à chaque commit (Article 20) — jamais une routine manuelle en plus, exactement comme les 5 autres Gardiens ci-dessus ; le vrai zoom profond, lui, reste un raisonnement payant hors Ronde (Article 23), inchangé",
  // angel-of-ia-process (2026-09-22) : exclusion qui APPLIQUE une décision de l'utilisateur, jamais
  // un oubli — « Les rapports de process secondaires ne produisent pas de rapport dirctement livrés
  // à la ronde : ce serait trop : god of process centralise ». Sa section est relayée par
  // god-of-all-process (buildProcessComplianceReport, paramètre sectionAngel) dans le rapport unique
  // de la Ronde. Lui donner son propre item dirait la même chose deux fois, et casserait la voix
  // unique que l'utilisateur a explicitement demandée.
  // etat-des-taches (2026-09-23, chantier 2 du plan de nuit) : registre produit À LA DEMANDE, quand
  // l'utilisateur réclame un état des lieux — jamais sur un rythme. Lui donner un item de Ronde
  // produirait un état des lieux que personne n'a demandé, donc que personne n'ouvrirait, et
  // surtout : la Ronde a DÉJÀ `check-tasks-report`, qui dit l'essentiel des mêmes chiffres. Un
  // second item dirait deux fois la même chose, ce que l'utilisateur a explicitement refusé ailleurs
  // (« ce serait trop »). L'harmonisation entre les deux fait l'objet d'un livrable séparé : il veut
  // voir l'existant AVANT de décider s'il faut fusionner, remplacer, ou garder les deux.
  "etat-des-taches": "registre produit À LA DEMANDE et jamais par calendrier : la Ronde porte déjà check-tasks-report sur les mêmes chiffres, et un second item dirait deux fois la même chose — l'harmonisation entre les deux est un livrable séparé, en attente de la décision de l'utilisateur",
  "angel-of-ia-process": "gardien de process SECONDAIRE : son verdict est relayé par god-of-all-process dans le rapport unique de la Ronde (décision de l'utilisateur, 2026-09-22 : god centralise) — jamais un second item qui doublerait cette voix",
  // LES QUATRE TROUVÉS PAR findReportingToolsMissingFromCircle() À SON PREMIER PASSAGE (2026-09-22).
  // Les quatre sont des exclusions parfaitement légitimes — et aucune n'était écrite nulle part.
  // C'est exactement ce que ce garde-fou devait produire : pas des fautes, des DÉCISIONS restées
  // implicites, qu'un prochain agent aurait pu défaire sans savoir qu'il défaisait quelque chose
  // (Article 27 : le pourquoi vit à côté du quoi).
  "le-coordinateur": "c'est le MOTEUR de la Ronde, jamais un de ses items — lui donner une ligne à cocher dans la liste qu'il orchestre lui-même serait circulaire",
  "circle-tasks": "c'est la Ronde ELLE-MÊME — un item « lancer la Ronde » dans la Ronde ne veut rien dire",
  // tasks-process-guardian (2026-09-22) : troisième gardien de process, même règle que ses deux
  // frères. Son registre a d'ailleurs fait échouer le crochet pre-commit le jour de sa création,
  // avant même que cette ligne n'existe — findRegistriesMissingFromCircle() a fait exactement son
  // travail, et c'est cette exclusion-ci qui est la vraie réponse, jamais un item de plus.
  // safe-export (2026-09-22) : septième Gardien sacré par sa COUCHE LÉGÈRE, donc câblé dans le
  // crochet post-commit et jamais dans la Ronde — même règle que les six autres Gardiens. Son
  // registre n'archive que les passages PROFONDS, qui eux restent exceptionnels (Article 23).
  // tool-learning (2026-09-22) : lui a bien un item de Ronde (« intégré à circle pour un suivi au
  // top, comme le reste » — sa demande), donc pas d'exclusion. Cette ligne existe uniquement pour
  // que la prochaine relecture ne se demande pas s'il a été oublié : il est DANS la Ronde.
  // integration-outil (2026-09-22) : jamais un item de Ronde, et ce n'est pas un oubli. Il répond à
  // une QUESTION posée au moment où un outil arrive — le relancer tous les quinze jours sans qu'un
  // outil arrive produirait invariablement « rien à signaler », c'est-à-dire du bruit qui apprend à
  // ne plus lire la Ronde. Son moment est celui de l'intégration, et il est porté par le process
  // « Intégration d'un nouvel outil » (god-of-all-process), jamais par un calendrier.
  "integration-outil": "Répond à un événement (un outil qui arrive), jamais à un calendrier : hors d'une intégration il n'aurait rien à dire, et une Ronde qui répète « rien à signaler » s'apprend à être sautée. Son obligation vit dans PROCESSES, pas dans CIRCLE_ITEMS",
  // eval-ia (2026-09-23) : registre créé avec EVAL-IA, le pendant d'EVAL-DEV. Couvert par l'item
  // `recap-evaluations`, qui produit désormais LES DEUX rapports d'évaluation (étape D de la
  // Partie 10 du process) — l'un juge celui qui décide, l'autre celui qui exécute, mais c'est un
  // seul moment de la Ronde. Le crochet pre-commit a refusé le commit qui créait ce dossier sans
  // cette ligne : le garde-fou a fonctionné exactement comme prévu.
  "cassandra-rh/evaluations": "Couvert par l'item CIRCLE_ITEMS `recap-evaluations`, qui produit les DEUX rapports d'évaluation (EVAL-DEV et EVAL-IA) au même moment de la Ronde — étape D de la Partie 10. Regroupés chez CASSANDRA le 2026-09-23 : elle les construit et les archive, angel-of-ia-process détient les données brutes de jugement sans plus les ranger",
  // tableau-de-bord (2026-09-22) : registre créé le jour où l'item `kpi` a enfin reçu un dossier
  // d'artefacts. Il EST couvert par une vraie entrée CIRCLE_ITEMS — simplement sous un autre nom
  // (l'item s'appelle `kpi`, le registre `tableau-de-bord`), et le rapprochement par nom ne pouvait
  // pas le deviner. Exclusion écrite plutôt que renommage : renommer l'un des deux casserait des
  // renvois existants pour un gain nul.
  "tableau-de-bord": "Couvert par l'item CIRCLE_ITEMS `kpi`, qui dépose ses artefacts dans ce dossier — seuls les NOMS diffèrent, jamais la couverture",
  "safe-export": "Gardien sacré du code (couche légère) : tourne automatiquement à CHAQUE commit via le crochet post-commit, jamais un item de Ronde — même régime que les six autres Gardiens. Son scan profond, lui, est exceptionnel et se déclenche sur proposition, jamais sur calendrier",
  "tasks-process-guardian": "gardien de process SECONDAIRE, même règle que process-simulation-guardian et angel-of-ia-process : god-of-all-process centralise et relaie son verdict (décision de l'utilisateur, 2026-09-22 — une seule voix à la Ronde, jamais une par gardien). Son déclencheur est l'état du suivi, pas le calendrier",
  "process-simulation-guardian": "gardien de process SECONDAIRE, même règle qu'angel-of-ia-process ci-dessus : god-of-all-process centralise et relaie son verdict (décision de l'utilisateur, 2026-09-22). Son vrai déclencheur est de toute façon une simulation, jamais le calendrier",
  "find-deep-booster": "outil de découpage à la demande sur UN fichier précis, jamais un balayage périodique de tout le dépôt — exactement la même raison que find-booster ci-dessus",
  "check-level-target": "outil de classification interne, jamais une routine à cocher soi-même",
  "memory-audit": "cible la mémoire narrative de Lia/Noé en jeu, jamais un scan de repo — vérifiable seulement sur des instantanés réels de partie (pendant/après une simulation) ; son voisin memento weight est déjà rapporté via kpi-report.mjs (reportMementoWeight), jamais une routine CIRCLE-TASKS séparée",
  "check-tasks-details": "état des lieux à la demande, pas une routine périodique mal automatisée",
  "find-booster": "outil de navigation à la demande sur un fichier précis, jamais un scan périodique de tout le dépôt",
  "el-professor": "déjà obligatoire à chaque simulation (Article 18, étape 4bis), une seconde routine ferait doublon",
  simulations: "l'archive elle-même, pas un outil à relancer périodiquement",
  "objectifs-vs-resultats": "registre hand-maintained consulté quand un objectif précis intéresse quelqu'un, pas une routine mécanique qui aurait toujours quelque chose de neuf à dire à chaque Ronde (contrairement à tool-brain-report, pensé pour construire une habitude) — même logique que check-tasks-details ci-dessus",
};
// findReportingToolsMissingFromCircle() (2026-09-22) — LE TROU DANS LE GARDE-FOU LUI-MÊME, trouvé
// par une question de l'utilisateur et non par un test : « pour pure gold que tu viens de creer :
// il est bien dans circle ? ». Il ne l'était pas. Et findRegistriesMissingFromCircle() ci-dessous,
// écrit précisément pour repérer les outils oubliés de la Ronde, ne pouvait PAS le voir : il part
// des registres présents sur le disque, donc un outil qui n'a pas encore de registre lui est
// invisible. Le garde-fou protégeait exactement l'espace où l'oubli ne se produit pas.
//
// Celui-ci prend le problème par l'autre bout, le seul qui ne dépende d'aucun fichier déjà créé :
// il part des MEMBRES CERTIFIÉS de l'équipe (AGENT_CATEGORIES, tenu à jour d'office à chaque
// arrivée) et vérifie que chacun apparaît quelque part — un item de Ronde, ou une exclusion
// motivée. Les deux fonctions sont complémentaires et aucune ne remplace l'autre : celle-ci voit
// l'outil neuf sans registre, celle-là voit le registre orphelin dont l'outil n'est plus certifié.
export function findReportingToolsMissingFromCircle(categories = AGENT_CATEGORIES, items = CIRCLE_ITEMS, couverts = CIRCLE_AUTO_COVERED_REGISTRIES) {
  return Object.keys(categories).filter((slug) => {
    if (slug in couverts) return false;
    // Même comparaison bidirectionnelle que ci-dessous : un id d'item peut être plus long que le
    // slug ("pure-gold-unity" ⊂ "pure-gold-unity-scan") ou l'inverse.
    return !items.some((i) => slug.includes(i.id) || i.id.includes(slug));
  });
}

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
  return registrySlugs.filter((slug) => !(slug in CIRCLE_AUTO_COVERED_REGISTRIES) && !items.some((i) => slug.includes(i.id) || i.id.includes(slug)));
}

// findPromisedFilesMissing() (2026-09-22, Ronde CIRCLE-TASKS en mode AUTO — Article 24).
// Trou réel qui a motivé cette fonction : `docs/profil-utilisateur/profil-actuel.txt` n'avait JAMAIS
// été créé, alors que DEUX documents promettaient noir sur blanc qu'il serait réécrit à chaque
// Ronde (l'`execute` de l'item `profil` ci-dessus, et `docs/regles-de-travail.md` §9) — une promesse
// écrite sans aucun mécanisme pour la vérifier, exactement ce que l'Article 24 interdit. La Ronde
// l'a découvert par hasard en tentant de l'écraser, pas par un contrôle.
// Volontairement une liste COURTE et explicite plutôt qu'un balayage de tous les chemins cités dans
// la documentation : un tel balayage produirait surtout des faux positifs (chemins d'exemple,
// fichiers locaux jamais committés, dossiers créés à la demande). Chaque entrée nomme la promesse
// qu'elle garde, jamais un chemin nu — et l'ajout d'une entrée reste une décision humaine
// documentée, la nature manuelle de cette liste étant ici écrite noir sur blanc comme l'Article 24
// l'exige pour un contenu curaté.
export const CIRCLE_PROMISED_FILES = [
  {
    path: "docs/profil-utilisateur/profil-actuel.txt",
    promesse: "l'item `profil` de la Ronde et docs/regles-de-travail.md §9 disent tous deux que ce fichier est écrasé à chaque passage (demande explicite du 2026-09-21 : « mon profil utilisateur à part, dans un fichier txt »)",
  },
];

export function findPromisedFilesMissing(existsImpl = existsSync, promised = CIRCLE_PROMISED_FILES, root = ROOT) {
  return promised.filter((p) => !existsImpl(join(root.replace(/\/$/, ""), p.path)));
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
export function buildCircleReport({ profilIndexText, kpiIndexText, smartConsoApiIndexText, smartConsoTokenIndexText, cleanDirtyOldIndexText, htmlWiringReadFileImpl, suiviCategorized, claudeMdText, philosophyText, philosophyFreshnessDaysValue, inesOfficialIndexText, ideesATrancherText } = {}, now = Date.now()) {
  const profilLast = mostRecentDate(profilIndexText);
  const kpiLast = mostRecentDate(kpiIndexText);
  const smartConsoApiLast = mostRecentDate(smartConsoApiIndexText);
  const smartConsoTokenLast = mostRecentDate(smartConsoTokenIndexText);
  const cleanDirtyOldLast = mostRecentDate(cleanDirtyOldIndexText);
  const inesOfficialLast = mostRecentDate(inesOfficialIndexText);
  // RECÂBLÉ le 2026-09-21 sur auditHtmlDecisions() (doc-report.mjs) — jamais un second calcul de
  // câblage HTML (cf. le commentaire de l'item html-wiring-check ci-dessus). `htmlWiringReadFileImpl`
  // injectable (même patron que le reste de cette fonction, qui reste pure — aucun accès disque
  // direct ici) ; le vrai readFileSync n'est fourni que par main() ci-dessous.
  const wiring = htmlWiringReadFileImpl ? auditHtmlDecisions(DOC_REPORT_REGISTRIES, htmlWiringReadFileImpl) : undefined;
  const oldestOpen = suiviCategorized ? oldestOpenTaskDate(suiviCategorized) : undefined;

  return CIRCLE_ITEMS.map((item) => {
    if (item.id === "profil") return { ...item, staleness: profilLast ? `${daysSince(profilLast, now)} jour(s) depuis la dernière fiche` : "jamais fait" };
    if (item.id === "kpi") return { ...item, staleness: kpiLast ? `${daysSince(kpiLast, now)} jour(s) depuis le dernier rapport archivé` : "jamais fait" };
    if (item.id === "smart-conso-api-scan") return { ...item, staleness: smartConsoApiLast ? `${daysSince(smartConsoApiLast, now)} jour(s) depuis la dernière décision archivée` : "jamais fait" };
    if (item.id === "smart-conso-token-scan") return { ...item, staleness: smartConsoTokenLast ? `${daysSince(smartConsoTokenLast, now)} jour(s) depuis le dernier scan archivé` : "jamais fait" };
    if (item.id === "clean-dirty-old-signal") return { ...item, staleness: cleanDirtyOldLast ? `${daysSince(cleanDirtyOldLast, now)} jour(s) depuis le dernier passage journalisé` : "jamais fait" };
    if (item.id === "ines-official-signal") return { ...item, staleness: inesOfficialLast ? `${daysSince(inesOfficialLast, now)} jour(s) depuis la dernière édition` : "aucune édition jamais produite" };
    if (item.id === "html-wiring-check") {
      if (!wiring) return { ...item, staleness: "pas de signal de fraîcheur mécanique disponible" };
      const mismatched = wiring.filter((w) => w.mismatch).map((w) => w.label);
      return { ...item, staleness: mismatched.length ? `${mismatched.length} outil(s) pas encore câblé(s) : ${mismatched.join(", ")}` : "tous câblés" };
    }
    if (item.id === "suivi-open-tasks-signal") return { ...item, staleness: oldestOpen ? `tâche ouverte depuis ${daysSince(oldestOpen, now)} jour(s)` : "aucune tâche ouverte connue" };
    if (item.id === "chantier-preliminaire-signal") {
      const gaps = checkChantierFileFreshness(loadAllTaskRows());
      return { ...item, staleness: gaps.length ? `${gaps.length} écart(s) trouvé(s) — ${gaps.map((g) => `${g.chantier} (${g.message})`).join(" ; ")} — proposer de mettre à jour le fichier concerné maintenant` : "aucun écart détecté" };
    }
    if (item.id === "idee-a-trancher-signal") {
      const decisions = loadIdeaDecisions(ideesATrancherText || "");
      const pending = findIdeasNeedingDecision(detectPendingIdeaCandidates(loadAllTaskRows()), decisions);
      return { ...item, staleness: pending.length ? `${pending.length} idée(s) en attente d'une décision — ${pending.map((r) => `#${r.numero}`).join(", ")} — poser la question à 3 voies maintenant` : "aucune idée en attente" };
    }
    if (item.id === "ecotoken-scan") {
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
    if (item.id === "the-king-signal") {
      if (!philosophyText) return { ...item, staleness: "pas de signal disponible (philosophie-et-politique.md non fourni)" };
      const principles = extractPrincipleUnits(philosophyText);
      const digest = buildEvolutionDigest(principles);
      const tensions = findPossibleTensions(principles);
      const freshnessLabel = philosophyFreshnessDaysValue == null ? "fraîcheur inconnue" : `dernière modification il y a ${Math.round(philosophyFreshnessDaysValue)} j`;
      const digestLabel = digest.length ? `dernière évolution datée : ${digest[digest.length - 1]}` : "aucune évolution datée trouvée";
      const tensionLabel = tensions.length ? `${tensions.length} tension(s) possible(s) à relire` : "aucune tension possible détectée";
      return { ...item, staleness: `${freshnessLabel} — ${digestLabel} — ${tensionLabel}` };
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
// "Suivi des chantiers" (2026-09-21) — nouveau thème, jamais fusionné dans "Suivi & référentiels"
// (déjà à sa limite réelle de 4 items, la contrainte d'interface qui gouverne ce découpage) :
// chantier-preliminaire-signal en est le premier membre, d'autres signaux liés aux gros chantiers
// pourront le rejoindre plus tard sans avoir à re-scinder un thème déjà plein.
export const THEME_ORDER = ["Suivi & référentiels", "Suivi des chantiers", "KPI & scans", "Qualité du code", "Passages réels (smoke run)", "Qualité & fun", "Audit lourd"];
// LIMITE DE FENÊTRE, JAMAIS LIMITE DE THÈME (2026-09-22). Jusqu'ici un thème = une fenêtre, donc
// un thème plein interdisait d'y ranger un outil de plus — et le 5e arrivant (pure-gold-unity-scan,
// « Qualité du code ») posait un vrai dilemme : le mal ranger pour tenir, ou casser la contrainte.
// Les deux sont mauvais, et le second aurait cassé une contrainte d'INTERFACE réelle (4 options par
// question) pour un problème qui n'en est pas un : rien n'a jamais exigé qu'un thème tienne dans UNE
// fenêtre, seulement qu'une fenêtre ne dépasse pas 4 options. Un thème trop rempli se présente donc
// désormais en fenêtres successives « Thème (1/2) », « (2/2) », dans l'ordre, sans qu'aucun outil
// n'ait à déménager dans une catégorie qui n'est pas la sienne.
//
// Le cas qui a forcé cette correction est instructif : organigramme-signal vivait dans « Qualité du
// code » par une décision RÉFLÉCHIE et écrite (il mesure la structure de l'outillage, comme ses
// voisins mesurent la dette et le poids) — le déplacer pour faire de la place aurait défait un
// arbitrage documenté au profit d'une contrainte d'affichage (Article 19).
export const MAX_OPTIONS_PAR_FENETRE = 4;
export function groupCircleReportByTheme(report, maxParFenetre = MAX_OPTIONS_PAR_FENETRE) {
  const groups = [];
  for (const theme of THEME_ORDER) {
    const items = report.filter((r) => r.theme === theme);
    if (!items.length) continue;
    if (items.length <= maxParFenetre) { groups.push({ theme, baseTheme: theme, items }); continue; }
    const total = Math.ceil(items.length / maxParFenetre);
    for (let n = 0; n < total; n += 1) {
      groups.push({ theme: `${theme} (${n + 1}/${total})`, baseTheme: theme, items: items.slice(n * maxParFenetre, (n + 1) * maxParFenetre) });
    }
  }
  const untagged = report.filter((r) => !THEME_ORDER.includes(r.theme));
  if (untagged.length) groups.push({ theme: "Autre", baseTheme: "Autre", items: untagged });
  return groups;
}

// recommendCircleSelection() — tâche #155 (2026-09-21, « calibrer une sélection recommandée par
// défaut »). Jusqu'ici, le choix des items pour l'option "NON, lancer avec les paramètres
// recommandés" du garde-fou en 2 temps était un jugement de l'agent, refait à la main à chaque
// Ronde (#225, #231) — jamais une vraie règle codée, donc jamais garanti de rester cohérent d'une
// fois à l'autre. Encodage EXPLICITE de la pratique réelle déjà observée sur ces deux passages,
// jamais une règle inférée à l'aveugle depuis les champs texte libres (`tokensEstimes`/`cout`, trop
// ambigus à parser mécaniquement) — même style que CIRCLE_AUTO_COVERED_REGISTRIES : un nom, une raison
// écrite, jamais un silence. Exclus par défaut : la relecture exhaustive du référentiel (gratuite en
// appel API mais coûteuse en tokens de l'agent, cf. son propre `tokensEstimes`), l'item purement
// récréatif, l'item conditionnel à une session déjà en cours, et les deux items costly (déjà exclus
// par défaut de longue date, jamais une nouveauté ici). Tout le reste de CIRCLE_ITEMS est recommandé
// par défaut. Ajustable à tout moment si la pratique réelle diverge — jamais gravé dans le marbre.
export const NOT_RECOMMENDED_BY_DEFAULT = {
  referentiel: "lecture exhaustive de tous les documents de référence — gratuite en appels API mais coûteuse en tokens de l'agent (cf. son propre tokensEstimes), jamais recommandée par défaut",
  "dream-team-photo": "purement récréatif, jamais prioritaire par défaut",
  "the-screener": "conditionnel à une session/un serveur déjà en cours — jamais recommandé sans cette condition réelle, que ce mécanisme ne peut pas vérifier lui-même",
  "the-final-judge": "coûteux (agent séparé), jamais coché par défaut — déjà établi",
  "the-deep-reader": "coûteux (agent séparé), jamais coché par défaut — déjà établi",
  "hyper-scan-checkpoint-light": "jamais automatique (Article 21) — la couche mécanique est gratuite mais la checklist qualitative qui suit reste un vrai coût de raisonnement, jamais recommandée par défaut",
};
export function recommendCircleSelection(report) {
  return report.map((r) => ({
    ...r,
    recommande: !(r.id in NOT_RECOMMENDED_BY_DEFAULT),
    raisonExclusion: NOT_RECOMMENDED_BY_DEFAULT[r.id],
  }));
}

// primeAddableItems() — tâche du 2026-09-21 (protocole AUTO/PRIME/GOAT, demande explicite de
// l'utilisateur). PRIME ajoute des tâches GRATUITES en plus de la sélection recommandée, jamais les
// items costly (réservés à GOAT, décision explicite : « les taches ne sont pas accessibles dans
// PRIME, mais elles sont mentionnées comme les autres, avec un renvoi à GOAT »). Dérive de
// recommendCircleSelection() plutôt que de relire NOT_RECOMMENDED_BY_DEFAULT une seconde fois —
// jamais un second filtre divergent.
export function primeAddableItems(recommendedReport) {
  return recommendedReport.filter((r) => r.recommande === false && !r.costly);
}

// --- Périodicité des items costly (2026-09-21, demande explicite : « selon la periodicité, circle
// peut inclure un scan couteux et lourd dans les parametres recommandés [...] il y a une alerte
// explicite et un choix qui reste possible : parametres recommandés, mais sans les scans
// couteux/lourds [...] à voir si ces scans peuvent etre remplacés par d'autres outils ou versions
// plutot que purement supprimés ») ---------------------------------------------------------------

// Seuil VOLONTAIREMENT long (aucun des deux items costly n'est censé tourner souvent, Article 8/22
// — un audit à agent séparé coûte ~37 000 tokens à chaque lancement) — à ajuster avec l'usage réel,
// jamais gravé dans le marbre. `daysSince()` reste la seule source de calcul de jours, jamais un
// second calcul de date divergent.
export const COSTLY_DUE_THRESHOLD_DAYS = 30;

// costlyItemDueStatus() — un item JAMAIS lancé n'est jamais automatiquement "due" (il serait sinon
// "en retard" dès le premier jour d'une agence fraîchement installée, un faux signal jamais
// souhaité) — seul un VRAI dernier passage devenu trop vieux déclenche le signal.
export function costlyItemDueStatus(lastRunDate, now = Date.now(), thresholdDays = COSTLY_DUE_THRESHOLD_DAYS) {
  if (!lastRunDate) return { due: false, reason: "jamais lancé — absence honnête, jamais un signal de retard fabriqué" };
  const days = daysSince(lastRunDate, now);
  if (days >= thresholdDays) return { due: true, reason: `dernier passage il y a ${days} jour(s), au-delà du seuil de ${thresholdDays}` };
  return { due: false, reason: `dernier passage il y a ${days} jour(s), sous le seuil de ${thresholdDays}` };
}

// Substitut gratuit déjà documenté ailleurs pour chaque item costly (jamais un remplacement
// complet — juste la meilleure alternative gratuite déjà actée) : THE-DEEP-READER a déjà sa version
// légère écrite noir sur blanc dans organisation-agence.md (« préférer d'abord la version légère
// gratuite docs/systeme-de-suivi.md ») ; THE-FINAL-JUDGE n'a pas d'équivalent direct, la synthèse
// gratuite la plus proche reste runNetworkCheck() (LE-COORDINATEUR), déjà dans CIRCLE_ITEMS
// (`network-check-run`).
export const COSTLY_SUBSTITUTES = {
  "the-final-judge": "network-check-run (synthèse gratuite déjà dans cette Ronde, LE-COORDINATEUR) — jamais un remplacement complet, juste la meilleure alternative gratuite disponible",
  "the-deep-reader": "check-tasks-details / docs/systeme-de-suivi.md (version légère déjà documentée dans organisation-agence.md) — jamais un remplacement complet",
  "hyper-scan-checkpoint-light": "aucun substitut nécessaire — cet item EST déjà la version gratuite, rien de moins coûteux à proposer à la place",
};

// recommendCircleSelectionWithPeriodicity() — étend recommendCircleSelection() SANS le modifier
// (rétrocompatible, tests existants inchangés) : un item costly dont le dernier passage réel dépasse
// le seuil rejoint la sélection recommandée, mais toujours marqué `periodiciteDue`/`periodiciteRaison`
// (pour l'alerte explicite) et `substitutGratuit` (pour la question "sans les scans coûteux, avec
// quoi à la place ?"). `lastRunDates` : { [itemId]: dateISO | undefined } — fourni par l'appelant
// (déjà lu depuis les vrais registres docs/the-final-judge/index.md et
// docs/suivi/relectures-lourdes/index.md, jamais un second parseur ici).
export function recommendCircleSelectionWithPeriodicity(report, { lastRunDates = {}, now = Date.now(), thresholdDays = COSTLY_DUE_THRESHOLD_DAYS } = {}) {
  return recommendCircleSelection(report).map((r) => {
    // Gate étendu le 2026-09-22 (`|| r.periodicityTracked`) pour couvrir aussi HYPER-SCAN-CHECKPOINT
    // — GRATUIT mais dont le coût réel (raisonnement agent) mérite le même suivi de fraîcheur que
    // les items costly, sans jamais le classer à tort comme `costly` (réservé au coût $/agent-spawn
    // réel, jamais réutilisé pour un coût de raisonnement).
    if (!r.costly && !r.periodicityTracked) return r;
    const status = costlyItemDueStatus(lastRunDates[r.id], now, thresholdDays);
    if (!status.due) return r;
    return { ...r, recommande: true, raisonExclusion: undefined, periodiciteDue: true, periodiciteRaison: status.reason, substitutGratuit: COSTLY_SUBSTITUTES[r.id] };
  });
}

// `colorize` par défaut vrai (sortie terminal réelle, ce script et les crochets git) — mis à faux
// pour toute sortie destinée à être relue comme du texte brut (tests, archive future) où des codes
// ANSI seraient juste des caractères parasites, jamais un vrai signal visuel.
export function formatCircleMenu(report, { colorize = true } = {}) {
  const lines = ["| Item | Coût API | Tokens Claude (estimation) | Fraîcheur |", "|---|---|---|---|"];
  for (const r of report) {
    const withReportIcon = r.producesReport ? `${REPORT_ICON} ${r.label}` : r.label;
    const label = r.costly && colorize ? red(`${ALERT_ICON} ${withReportIcon}`) : withReportIcon;
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

// DU RAPPEL PASSIF À LA RELANCE PROPOSÉE (2026-09-22, calibrage explicite de l'utilisateur).
//
// LE FAIT QUI A MOTIVÉ CE CHANGEMENT, et il est accablant : le rappel passif existait déjà, il
// s'affichait à chaque commit, et je l'ai ignoré QUATORZE FOIS DE SUITE. Un rappel qu'on peut lire
// sans rien faire n'est pas un mécanisme, c'est une décoration — exactement la même limite que
// celle déjà écrite pour tool-brain et SMART-CONSO-TOKEN, constatée cette fois sur pièces.
//
// Ce que ça change concrètement : au-delà d'un second seuil, plus élevé que celui du simple rappel,
// la Ronde n'est plus « à envisager » — elle est PROPOSÉE explicitement à l'utilisateur, avec le
// retard chiffré et ce qu'il implique. Trois paliers, jamais deux, parce qu'un retard de 8 commits
// et un retard de 30 n'appellent pas la même réaction.
export const RELANCE_PALIERS = [
  { seuil: 8, palier: "rappel", quoi: "mention discrète en bas du compte rendu de commit" },
  { seuil: 15, palier: "proposition", quoi: "proposition explicite à l'utilisateur, avec le retard chiffré — jamais une simple mention qu'on peut survoler" },
  { seuil: 30, palier: "alerte", quoi: "le retard devient un constat en soi : à ce stade, des vérifications gratuites dorment depuis des semaines et personne ne sait ce qu'elles auraient trouvé" },
];

export function relanceCircleTasks(commitsSinceLastRun, { paliers = RELANCE_PALIERS } = {}) {
  // Un compte non mesurable n'est PAS un retard de zéro : c'est une absence de mesure, et la
  // confondre avec « tout va bien » serait la faute que ce paysage passe son temps à corriger.
  if (!Number.isFinite(commitsSinceLastRun)) return { mesurable: false, raison: "nombre de commits depuis la dernière Ronde non mesurable — ni un retard, ni une absence de retard" };
  const atteints = paliers.filter((p) => commitsSinceLastRun >= p.seuil);
  if (!atteints.length) return { mesurable: true, palier: null, commits: commitsSinceLastRun };
  const courant = atteints.at(-1);
  return { mesurable: true, palier: courant.palier, seuil: courant.seuil, commits: commitsSinceLastRun, quoi: courant.quoi };
}

export function relanceMessage(relance) {
  if (!relance.mesurable) return `🔄 Ronde : ${relance.raison}`;
  if (!relance.palier) return null;
  if (relance.palier === "rappel") return `🔄 ${relance.commits} commits sans Ronde périodique (CIRCLE-TASKS) — envisage de la relancer.`;
  if (relance.palier === "proposition") return `🔄 ${relance.commits} commits sans Ronde — au-delà de ${relance.seuil}, ce n'est plus un rappel : je te PROPOSE de la lancer maintenant (node scripts/circle-tasks.mjs). Le rappel discret n'a rien changé pendant ${relance.commits - RELANCE_PALIERS[0].seuil} commits.`;
  return `🚨 ${relance.commits} commits sans Ronde. À ce stade ce n'est plus un retard, c'est un constat : une trentaine de vérifications gratuites dorment depuis des semaines, et personne ne sait ce qu'elles auraient trouvé entre-temps.`;
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

// CIRCLE_REPORT_FOLDERS (2026-09-21, correction demandée par l'utilisateur après lecture de
// docs/circle-process-detail.txt : « tous les outils qui interviennent lors de la ronde DOIVENT
// produire un rapport txt au minimum [...] sinon ils doivent tous produire un rapport txt de leur
// activité pendant le circle »). Vérifié un par un (Article 19) : aucune exception réellement
// justifiable, même pour un signal trivial ("rien à signaler" reste une preuve d'exécution utile
// au futur circle-process-guardian). Deux régimes, jamais confondus :
//  - un item qui correspond à un outil DÉJÀ enregistré dans doc-report.mjs::REGISTRIES écrit dans
//    SON dossier déjà existant (jamais un second dossier concurrent pour le même outil) ;
//  - un item sans outil enregistré reçoit un nouveau dossier dédié (ajouté à REGISTRIES).
// « Un dossier propre à chaque outil » (choix explicite de l'utilisateur, jamais un unique dossier
// fourre-tout par Ronde) — jamais recopié en dur ailleurs : circle-process-guardian devra lire
// cette table dynamiquement, jamais un chemin réinventé (Article 24).
export const CIRCLE_REPORT_FOLDERS = {
  // 2026-09-22 — QUATORZE items sur 32 déclaraient `producesReport: true` sans qu'aucun dossier ne
  // les attende ici. Trouvé en écrivant, pour la première fois, les artefacts d'une Ronde réelle :
  // 10 des 26 items exécutés ont levé « aucun dossier connu ». Personne ne l'avait vu parce que
  // rien ne comparait les deux tables — le registre ne savait pas qu'il lui manquait quelqu'un,
  // exactement le défaut que l'Article 24 nomme. `findItemsPromisingReportWithoutFolder()`
  // ci-dessous ferme le trou pour de bon.
  //
  // Les quatre derniers restent volontairement absents et c'est écrit plus bas
  // (ITEMS_SANS_DOSSIER_ASSUME) : deux sont coûteux et tiennent déjà leur propre registre daté,
  // deux produisent un artefact qui n'est pas un rapport texte.
  profil: "docs/profil-utilisateur/",
  kpi: "docs/tableau-de-bord/",
  "pure-gold-unity-scan": "docs/pure-gold-unity/",
  "tool-learning": "docs/tool-learning/",
  "the-equalizer": "docs/the-equalizer/",
  "recap-evaluations": "docs/angel-of-ia-process/",
  "smart-conso-token-scan": "docs/smart-conso-token/",
  "cassandra-rh-signal": "docs/cassandra-rh/",
  "data-archangel-scan": "docs/data-archangel/",
  "integration-audit": "docs/integration-outil/",
  "coordinateur-catalogue": "docs/le-coordinateur/",
  "the-king-signal": "docs/the-king/",
  "god-of-all-process-conformite": "docs/god-of-all-process/",
  "organigramme-signal": "docs/cassandra-rh/organigramme/",
  "clean-dirty-old-signal": "docs/clean-dirty-old/",
  "smart-conso-api-scan": "docs/smart-conso-api/",
  "ines-official-signal": "docs/ines-official/",
  "profil-utilisateur-guard": "docs/profil-utilisateur/",
  "html-wiring-check": "docs/html-wiring-check/",
  "ecotoken-scan": "docs/ecotoken/ronde/",
  "suivi-open-tasks-signal": "docs/suivi-open-tasks/",
  "chantier-preliminaire-signal": "docs/chantier-preliminaire/",
  "idee-a-trancher-signal": "docs/idee-a-trancher/",
  "check-tasks-report": "docs/check-tasks-details/",
  "ou-on-en-est": "docs/ou-on-en-est/",
  "tool-brain-report": "docs/tool-brain/",
  "network-check-run": "docs/network-check/",
  "referentiel": "docs/relecture-referentiel/",
  "correctifs": "docs/relecture-correctifs/",
  "hyper-scan-checkpoint-light": "docs/hyper-scan-checkpoint/",
};

// ITEMS_SANS_DOSSIER_ASSUME — les seuls items qui promettent un rapport sans dossier ici, chacun
// avec sa raison. Sans cette table, le garde-fou ci-dessous serait obligé de choisir entre crier
// sur quatre cas légitimes ou se taire sur tous : l'exception écrite est ce qui permet à l'alerte
// de rester crédible.
export const ITEMS_SANS_DOSSIER_ASSUME = {
  "the-final-judge": "coûteux (agent séparé) : tient déjà son propre registre daté dans docs/the-final-judge/index.md, jamais un artefact de Ronde en plus",
  "the-deep-reader": "coûteux (agent séparé) : même régime, son registre vit dans docs/suivi/relectures-lourdes/",
  "dream-team-photo": "son artefact est une image, jamais un rapport texte — un fichier .txt daté n'aurait rien à contenir",
  "the-screener": "ses artefacts sont des captures d'écran, déposées par son propre mécanisme de capture",
};

// findItemsPromisingReportWithoutFolder() (2026-09-22) — le garde-fou qui manquait, sur le patron
// déjà prouvé neuf fois dans ce dépôt (findToolsMissingFromMenu, findGardiensMissingFromSource...).
// Deux tables tenues à la main disaient des choses différentes et rien ne les confrontait : un item
// pouvait promettre un rapport pendant des semaines sans qu'aucun dossier ne puisse le recevoir, et
// l'erreur ne se révélait qu'au moment d'écrire réellement l'artefact — c'est-à-dire pendant une
// Ronde, au pire moment.
export function findItemsPromisingReportWithoutFolder(items = CIRCLE_ITEMS, folders = CIRCLE_REPORT_FOLDERS, assumes = ITEMS_SANS_DOSSIER_ASSUME) {
  return items.filter((i) => i.producesReport && !folders[i.id] && !(i.id in assumes)).map((i) => i.id);
}

// findFoldersWithoutItem() — le sens inverse, celui qui pourrit en silence : un dossier déclaré pour
// un item qui n'existe plus. Il ne casse rien, donc rien ne le signale, et il fait croire que la
// table est à jour.
export function findFoldersWithoutItem(items = CIRCLE_ITEMS, folders = CIRCLE_REPORT_FOLDERS) {
  const ids = new Set(items.map((i) => i.id));
  return Object.keys(folders).filter((k) => !ids.has(k));
}


// recordCircleItemReport() — écrit un fichier .txt daté (la preuve d'exécution minimale exigée)
// dans le dossier de l'item, puis journalise cette écriture dans un index que la fonction possède
// entièrement : `index.md` si le dossier n'en a pas encore (les 9 nouveaux dossiers ci-dessus), ou
// un fichier frère `circle-signals-index.md` si le dossier a déjà un index.md à un format propre à
// l'outil (les 5 dossiers réutilisés) — JAMAIS une écriture générique dans un index déjà curaté à
// la main, qui casserait son format existant (Article 19). cassandra-rh-signal (rapport complet,
// HTML) et le récapitulatif de fin de Ronde suivent chacun leur propre mécanisme déjà établi,
// jamais celui-ci — cf. leur `execute` respectif.
export function recordCircleItemReport(itemId, contentText, { folders = CIRCLE_REPORT_FOLDERS, now = Date.now(), writeFileImpl = writeFileSync, readFileImpl = readFileSync, existsImpl = existsSync, mkdirImpl = mkdirSync } = {}) {
  const folder = folders[itemId];
  if (!folder) throw new Error(`recordCircleItemReport: aucun dossier connu pour l'item "${itemId}" (cf. CIRCLE_REPORT_FOLDERS)`);
  const fullFolder = join(ROOT, folder);
  mkdirImpl(fullFolder, { recursive: true });
  const dateLabel = new Date(now).toISOString();
  const fileSlug = dateLabel.replace(/[:.]/g, "-");
  const fileName = `circle-signal-${fileSlug}.txt`;
  writeFileImpl(join(fullFolder, fileName), contentText ?? "", "utf8");

  // LA CONTRIBUTION S'ENREGISTRE OÙ L'ÉCRITURE A LIEU (2026-09-23, demande de l'utilisateur :
  // « pense à l'alimenter aux moments opportuns, sers-toi des process et de l'existant pour
  // trouver des moments opportuns »). Le moment opportun est ICI, pas dans ma mémoire : chaque
  // signal de Ronde écrit dans le registre d'un outil EST une alimentation de cet outil.
  //
  // POURQUOI PAS UN RAPPEL À L'AGENT, et c'est l'Article 27 mot pour mot : une obligation qui ne
  // repose que sur la mémoire d'un agent n'existe plus à la session suivante. Le compteur a passé
  // sa première journée à zéro précisément parce que je comptais m'en souvenir.
  //
  // JAMAIS BLOQUANT : même discipline que recordCliUsage() — un compteur qui ferait échouer
  // l'écriture qu'il observe serait pire que pas de compteur.
  try { recordToolContribution(itemId, `${folder}${fileName}`, { nature: "registre", now, par: "ronde" }); } catch { /* best-effort */ }

  const primaryIndexPath = join(fullFolder, "index.md");
  const hasPrimaryIndex = existsImpl(primaryIndexPath);
  const indexPath = hasPrimaryIndex ? join(fullFolder, "circle-signals-index.md") : primaryIndexPath;
  const excerpt = String(contentText ?? "").split("\n").find((l) => l.trim().length) ?? "(rapport vide)";
  const header = hasPrimaryIndex
    ? "# Signaux CIRCLE-TASKS — index (jamais l'index principal de cet outil, cf. index.md)\n\n| Date | Fichier | Résumé |\n|---|---|---|\n"
    : "# Index — rapports produits pendant les Rondes CIRCLE-TASKS\n\n| Date | Fichier | Résumé |\n|---|---|---|\n";
  const existingIndexText = existsImpl(indexPath) ? readFileImpl(indexPath, "utf8") : header;
  const row = `| ${dateLabel} | ${fileName} | ${excerpt.slice(0, 160)} |\n`;
  writeFileImpl(indexPath, existingIndexText.endsWith("\n") ? existingIndexText + row : existingIndexText + "\n" + row, "utf8");

  return { filePath: join(folder, fileName), indexPath: join(folder, hasPrimaryIndex ? "circle-signals-index.md" : "index.md") };
}

// recordSnapshotIfChanged() (2026-09-22, demande explicite de l'utilisateur : « je veux aussi une
// copie de claude.md dans un fichier txt à chaque ronde avec un historique local » — et retrofit du
// même soir sur THE-KING, qui n'avait par erreur qu'un seul fichier écrasé alors que la demande
// d'origine voulait déjà « garder une trace DES instantanés »). Contrairement à
// recordCircleItemReport() (écrit systématiquement), celle-ci n'écrit une NOUVELLE snapshot datée
// que si le contenu a réellement changé depuis la dernière (shouldSnapshotText(), lib-shell.mjs) —
// jamais une cadence fixe en nombre de Rondes, jamais une snapshot identique dupliquée pour rien.
// `listDirImpl` injectable comme le reste de ce fichier ; le tri lexicographique des noms suffit
// car l'horodatage ISO trie déjà chronologiquement.
export function recordSnapshotIfChanged(itemId, currentText, { folders = CIRCLE_REPORT_FOLDERS, now = Date.now(), writeFileImpl = writeFileSync, readFileImpl = readFileSync, existsImpl = existsSync, mkdirImpl = mkdirSync, listDirImpl = (dir) => (existsSync(dir) ? readdirSync(dir) : []) } = {}) {
  const folder = folders[itemId];
  if (!folder) throw new Error(`recordSnapshotIfChanged: aucun dossier connu pour l'item "${itemId}" (cf. CIRCLE_REPORT_FOLDERS)`);
  const fullFolder = join(ROOT, folder);
  mkdirImpl(fullFolder, { recursive: true });
  const previousSnapshots = listDirImpl(fullFolder).filter((f) => f.startsWith("snapshot-") && f.endsWith(".txt")).sort();
  const lastFile = previousSnapshots[previousSnapshots.length - 1];
  const lastText = lastFile ? readFileImpl(join(fullFolder, lastFile), "utf8") : undefined;
  if (!shouldSnapshotText(lastText, currentText)) return { snapshotted: false, filePath: lastFile ? join(folder, lastFile) : undefined };
  const fileName = `snapshot-${new Date(now).toISOString().replace(/[:.]/g, "-")}.txt`;
  writeFileImpl(join(fullFolder, fileName), currentText ?? "", "utf8");
  return { snapshotted: true, filePath: join(folder, fileName) };
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
// TEXTE puis HTML — historique de ce choix (jamais reperdu, Article 13) : construite en HTML le
// 2026-09-20, repassée en texte le 2026-09-21 (« le rapport de circle devrait etre en txt et non
// html », docs/suivi #230 : seuls les transcripts de simulation méritent le HTML). RE-INVERSÉE le
// même soir (2026-09-21, plus tard) — demande explicite de l'utilisateur, avec double confirmation
// Article 14 obtenue avant d'exécuter ce changement : le récapitulatif doit porter une vraie
// analyse approfondie « mise en évidence [...] dans un bloc séparé », ce que le texte brut ne peut
// pas rendre visuellement — cf. buildCircleRunSummaryHtml() ci-dessous, la fonction canonique
// désormais utilisée par l'agent qui pilote. buildCircleRunSummaryText() reste disponible (repris
// par les tests existants et par quiconque veut une version texte brute), jamais dupliquée : les
// deux réutilisent buildCircleEntryRows() pour construire les lignes du tableau.
// `entries`: Array<{ id: string, label: string, outcome: string, link?: string }>.
export const CIRCLE_RUN_SUMMARY_PATH = ".circle-tasks-run-summary-latest.txt";
function buildCircleEntryRows(entries, items) {
  return (entries || []).map((e) => {
    const producesReport = items.find((i) => i.id === e.id)?.producesReport;
    const label = producesReport ? `${REPORT_ICON} ${e.label ?? e.id ?? "—"}` : (e.label ?? e.id ?? "—");
    return [label, e.outcome ?? "—", e.link ?? "—"];
  });
}
export function buildCircleRunSummaryText(entries, { dateLabel, items = CIRCLE_ITEMS, executedByModel } = {}) {
  const lines = [
    "=== CIRCLE-TASKS — récapitulatif de la Ronde ===",
    `Date : ${dateLabel ?? new Date().toISOString()}`,
    `Index léger : ce qui a tourné et un pointeur vers la sortie déjà produite par chaque item, jamais son contenu dupliqué ici. ${REPORT_ICON} = produit un vrai rapport archivé et indexé ; sans icône = signal console seulement, rien écrit sur disque.`,
    "",
  ];
  if (!entries || !entries.length) {
    lines.push("Aucun item n'a été coché pour cette Ronde.");
  } else {
    lines.push("| Item exécuté | Résultat | Lien |", "|---|---|---|");
    for (const [label, outcome, link] of buildCircleEntryRows(entries, items)) {
      lines.push(`| ${label} | ${outcome} | ${link} |`);
    }
  }
  if (executedByModel) lines.push("", `Modèle ayant exécuté cette Ronde : ${executedByModel}.`);
  lines.push("", "CIRCLE-TASKS — la sélection des items reste toujours confirmée par une fenêtre à cocher avant exécution, jamais un tout-en-un silencieux.");
  return lines.join("\n");
}

// buildCircleRunSummaryHtml() (2026-09-21) — la fonction CANONIQUE de fin de Ronde depuis la
// ré-inversion ci-dessus. `analysis` (string ou array de paragraphes) : jamais généré
// automatiquement, c'est l'analyse approfondie de l'agent qui pilote, construite à partir de la
// lecture individuelle de chaque rapport produit (demande explicite : « une analyse approfondie de
// la situation, à partir des resultats obtenus par circle et de tous les rapports qui doivent etre
// lus individuellement »). `followUpTasks` : les actions qui en découlent, à la fois listées ici ET
// écrites dans docs/suivi/ par l'agent (jamais l'un sans l'autre). `reportLinks` : les rapports
// individuels de la Ronde (txt sauf ceux déjà en HTML par décision Doc-Report), listés juste sous
// l'analyse — demande explicite du 2026-09-21.
export function buildCircleRunSummaryHtml(entries, { dateLabel, items = CIRCLE_ITEMS, analysis, followUpTasks = [], reportLinks = [], executedByModel } = {}) {
  const blocks = [
    { type: "paragraph", text: `Index léger : ce qui a tourné et un pointeur vers la sortie déjà produite par chaque item, jamais son contenu dupliqué ici. ${REPORT_ICON} = produit un vrai rapport archivé et indexé — depuis le 2026-09-21, tous les items de la Ronde le font.` },
  ];
  if (!entries || !entries.length) {
    blocks.push({ type: "note", text: "Aucun item n'a été coché pour cette Ronde." });
  } else {
    blocks.push({ type: "table", headers: ["Item exécuté", "Résultat", "Lien"], rows: buildCircleEntryRows(entries, items) });
  }
  if (executedByModel) blocks.push({ type: "note", text: `Modèle ayant exécuté cette Ronde : ${executedByModel}.` });
  if (analysis) {
    blocks.push({ type: "highlight", heading: "Analyse approfondie de la Ronde", paragraphs: Array.isArray(analysis) ? analysis : [analysis] });
  }
  if (followUpTasks.length) {
    blocks.push({ type: "heading", text: "Tâches inscrites au suivi suite à cette analyse" });
    blocks.push({ type: "list", items: followUpTasks });
  }
  if (reportLinks.length) {
    blocks.push({ type: "heading", text: "Rapports individuels disponibles" });
    blocks.push({ type: "list", items: reportLinks });
  }
  blocks.push({ type: "note", text: "CIRCLE-TASKS — la sélection des items reste toujours confirmée par une fenêtre à cocher avant exécution, jamais un tout-en-un silencieux." });
  return renderHtmlReport({ title: "CIRCLE-TASKS — récapitulatif de la Ronde", dateLabel: dateLabel ?? new Date().toISOString(), blocks });
}

function main() {
  printReliabilityNotice("circle-tasks");
  recordCliUsage("circle-tasks");
  const read = (p) => (existsSync(`${ROOT}${p}`) ? readFileSync(`${ROOT}${p}`, "utf8") : "");
  const profilIndexText = read("docs/profil-utilisateur/index.md");
  const kpiIndexText = read("docs/referentiel/kpi-index.md");
  const smartConsoApiIndexText = read("docs/smart-conso-api/index.md");
  const smartConsoTokenIndexText = read("docs/smart-conso-token/index.md");
  const cleanDirtyOldIndexText = read("docs/clean-dirty-old/index.md");
  const htmlWiringReadFileImpl = (scriptPath) => readFileSync(`${ROOT}${scriptPath}`, "utf8");
  const suiviCategorized = categorizeAllSessions();
  const claudeMdText = read("CLAUDE.md");
  const philosophyText = read("docs/philosophie-et-politique.md");
  const philosophyFreshnessDaysValue = philosophyFreshnessDays();
  const inesOfficialIndexText = read("docs/ines-official/index.md");
  const ideesATrancherText = read(IDEES_REGISTRY_PATH);
  const report = buildCircleReport({ profilIndexText, kpiIndexText, smartConsoApiIndexText, smartConsoTokenIndexText, cleanDirtyOldIndexText, htmlWiringReadFileImpl, suiviCategorized, claudeMdText, philosophyText, philosophyFreshnessDaysValue, inesOfficialIndexText, ideesATrancherText });
  console.log("=== CIRCLE-TASKS — Ronde périodique ===\n");
  console.log(formatCircleMenu(report));
  console.log("\nJamais exécuté seul : l'agent qui pilote ouvre une fenêtre à cocher (protocole AUTO/PRIME/GOAT, docs/regles-de-travail.md) pour choisir précisément quoi lancer.");
  console.log(red(`${ALERT_ICON} THE-FINAL-JUDGE reste visible ci-dessus mais n'est JAMAIS coché par défaut — vérifie Smart Conso API ET SMART-CONSO-TOKEN avant de le sélectionner.`));
  console.log("Rappel : les autres items coûteux du paysage (check-spirit.mjs, HYPER-SCAN-CHECKPOINT complet) restent hors de cette ronde pour l'instant, jamais des cases à cocher ici.");

  // Périodicité des items costly (2026-09-21) — lu depuis les vrais registres, jamais une date
  // inventée. Un item "due" ci-dessous doit rejoindre le mode AUTO (avec son alerte), jamais rester
  // silencieux.
  const lastRunDates = {
    "the-final-judge": mostRecentDate(read("docs/the-final-judge/index.md")),
    "the-deep-reader": mostRecentDate(read("docs/suivi/relectures-lourdes/index.md")),
    "hyper-scan-checkpoint-light": mostRecentDate(read("docs/hyper-scan-checkpoint/index.md")),
  };
  const withPeriodicity = recommendCircleSelectionWithPeriodicity(report, { lastRunDates });
  const due = withPeriodicity.filter((r) => r.periodiciteDue);
  if (due.length) {
    for (const d of due) {
      console.log(red(`${ALERT_ICON} ${d.label} est DÛ (${d.periodiciteRaison}) — rejoint exceptionnellement le mode AUTO. Alternative gratuite si tu préfères t'en passer : ${d.substitutGratuit}.`));
    }
  }
  const rootNoSlash = ROOT.replace(/\/$/, "");
  const missingRegistries = findRegistriesMissingFromCircle(walkDocsPaths(`${rootNoSlash}/docs`, rootNoSlash));
  if (missingRegistries.length) console.log(red(`${ALERT_ICON} Registre(s) sans item de Ronde ni couverture automatique documentée : ${missingRegistries.join(", ")} — à ajouter à CIRCLE_ITEMS ou à CIRCLE_AUTO_COVERED_REGISTRIES avec la raison de sa couverture.`));
  for (const missing of findPromisedFilesMissing()) {
    console.log(red(`${ALERT_ICON} Fichier promis par la documentation mais ABSENT du disque : ${missing.path} — ${missing.promesse}.`));
  }
}

// ————————————————————————————————————————————————————————————————————————
// LES QUESTIONS SANS RÉPONSE (2026-09-23) — ce qui tombe entre les mailles
// ————————————————————————————————————————————————————————————————————————
//
// Demande de l'utilisateur, faite juste après en avoir donné la démonstration : il a fermé une
// fenêtre de trois questions d'ouverture, et RIEN dans le paysage ne l'a noté. Ses mots : « je veux
// aussi que les réponses qui n'ont pas été répondues soient traquées ».
//
// POURQUOI C'EST UN VRAI TROU, et pas une coquetterie. Une question posée puis fermée ressemble,
// dans la conversation comme dans les registres, à une question jamais posée. Les deux disparaissent
// de la même façon. Or ce sont deux choses opposées : l'une signifie « je n'ai pas voulu répondre
// maintenant », l'autre « personne n'a demandé ». Confondre les deux fait perdre exactement les
// questions que l'utilisateur a jugées assez gênantes pour les éviter — donc les plus intéressantes.
//
// CE QUE LE MÉCANISME FAIT, et ce qu'il ne fait pas : il enregistre la question, sa série et sa
// date, et la repose au passage suivant avec son âge. Il ne juge jamais pourquoi elle est restée
// sans réponse — une fenêtre fermée par inadvertance et une fenêtre fermée par lassitude se
// ressemblent trop pour qu'une machine les distingue, et prétendre le contraire serait inventer
// une mesure.
// ————————————————————————————————————————————————————————————————————————
// L'INVENTAIRE DES QUESTIONS, RENDU VÉRIFIABLE (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// Constat de l'utilisateur à la clôture de la Ronde : « Pourquoi un tel écart dans le nombre de
// questions : 14 seulement, alors qu'on aurait dû en avoir plus de 30 ? J'ai ressenti cet écart et
// ça m'a gêné. Encore une fois : mieux vaut trop de questions que pas assez. »
//
// LA CAUSE, ET ELLE EST PIRE QU'UN OUBLI. La Partie 11 du process détaille depuis le 2026-09-23 un
// inventaire par étape totalisant 28 à 43 questions. Le contrôleur, lui, ne vérifiait qu'un TOTAL
// NU contre une fourchette de 5 à 10 — écrite la veille, avant que cet inventaire n'existe, et
// jamais réconciliée avec lui. Deux règles en contradiction, et c'est la restrictive qui était
// câblée : le contrôleur m'aurait signalé un écart si j'avais posé les 28 questions dues.
//
// Un total nu ne peut de toute façon rien garantir : 14 questions toutes prises dans deux étapes
// et 14 réparties sur six ne décrivent pas le même travail. Deux étapes entières ont été sautées
// ce jour-là (celles qui ÉVALUENT L'AGENT, et le calibrage des correctifs) sans que rien ne le
// voie, parce que rien ne comptait PAR ÉTAPE.
//
// D'OÙ CET INVENTAIRE, lu depuis le code plutôt que depuis la mémoire de l'agent. Il porte les
// mêmes chiffres que la Partie 11 — un écart entre les deux serait la dette que l'Article 24
// interdit, et findEtapesDivergentesDuDocument() ci-dessous le vérifie sur le vrai document.
export const INVENTAIRE_QUESTIONS = [
  { etape: "ouverture", min: 2, max: 3, quoi: "changement de modèle et mode AUTO/PRIME/GOAT (obligatoires), rythme (facultatif)", requisSi: null },
  { etape: "retour-modele", min: 1, max: 1, quoi: "revenir avant ou après les rapports", requisSi: (c) => c.changementModeleReponse === "oui" },
  { etape: "evaluation-agent", min: 5, max: 8, quoi: "les questions qui ÉVALUENT L'AGENT, posées avant EVAL-IA", requisSi: null },
  { etape: "constats-analyse", min: 8, max: 10, quoi: "les constats de l'analyse, proportionnel à ce qui a été trouvé", requisSi: null },
  { etape: "calibrage-correctifs", min: 5, max: 10, quoi: "le calibrage des correctifs à appliquer", requisSi: null },
  { etape: "mise-en-cause", min: 5, max: 8, quoi: "celles qui mettent l'utilisateur en cause", requisSi: null },
  { etape: "la-suite", min: 3, max: 3, quoi: "l'instant, l'axe, le projet — toujours les trois", requisSi: null },
  { etape: "rappel-modele", min: 1, max: 1, quoi: "dernier rappel de retour au modèle précédent", requisSi: (c) => c.changementModeleReponse === "oui" },
];

// Ce qui est DÛ dans le contexte réel de cette Ronde — les étapes conditionnelles tombent d'elles-
// mêmes, elles ne sont jamais comptées comme manquantes quand leur condition n'est pas remplie.
export function questionsDues(contexte = {}, { inventaire = INVENTAIRE_QUESTIONS, seriesPassees = [] } = {}) {
  return inventaire.filter((e) => (!e.requisSi || e.requisSi(contexte)) && !seriesPassees.includes(e.etape));
}

// LES ÉTAPES SOUS-SERVIES, nommées une par une. Rend une LISTE et jamais un total : « il manque 17
// questions » ne dit pas lesquelles, et c'est précisément ce flou qui a permis de sauter deux
// étapes entières sans que rien ne le remarque.
export function findEtapesDeQuestionsManquantes(poseesParEtape, contexte = {}, options = {}) {
  if (!poseesParEtape || typeof poseesParEtape !== "object") {
    // Un TOTAL NU est refusé, et c'est le cœur de la correction : il ne permet aucun contrôle réel.
    return [{ etape: "(toutes)", manque: "le détail par étape n'a pas été fourni — un total nu ne dit pas si les questions couvrent six étapes ou deux, et c'est exactement ce flou qui a laissé sauter deux étapes entières" }];
  }
  return questionsDues(contexte, options)
    .map((e) => ({ ...e, posees: poseesParEtape[e.etape] ?? 0 }))
    .filter((e) => e.posees < e.min)
    .map((e) => ({ etape: e.etape, posees: e.posees, attendu: `${e.min}-${e.max}`,
      manque: e.posees === 0 ? `étape ENTIÈREMENT sautée (${e.quoi})` : `${e.min - e.posees} question(s) de moins que le plancher (${e.quoi})` }));
}

// GARDE-FOU D'ÉVOLUTIVITÉ (Article 24) : l'inventaire ci-dessus reflète un tableau écrit dans
// docs/circle-process-detail.txt. Les deux doivent dire la même chose, et rien ne doit pouvoir
// diverger en silence — c'est exactement le patron des autres registres du projet.
export function findEtapesDivergentesDuDocument({ root = ROOT, readFileImpl = readFileSync, inventaire = INVENTAIRE_QUESTIONS } = {}) {
  let texte;
  try { texte = readFileImpl(join(root, "docs/circle-process-detail.txt"), "utf8"); } catch { return []; }
  const total = inventaire.filter((e) => !e.requisSi).reduce((a, e) => ({ min: a.min + e.min, max: a.max + e.max }), { min: 0, max: 0 });
  const annonce = texte.match(/TOTAL \(hors offres de passer[^)]*\)\s+(\d+) à (\d+)/);
  if (!annonce) return [{ pourquoi: "le document n'annonce plus de total de questions — l'inventaire du code ne peut plus être confronté à rien" }];
  const [, docMin, docMax] = annonce;
  // Le document compte AUSSI les deux étapes conditionnelles dans sa fourchette haute.
  const maxAvecConditionnelles = total.max + inventaire.filter((e) => e.requisSi).reduce((a, e) => a + e.max, 0);
  if (Number(docMin) !== total.min || Number(docMax) !== maxAvecConditionnelles) {
    return [{ pourquoi: `le document annonce ${docMin} à ${docMax} questions, l'inventaire du code en totalise ${total.min} à ${maxAvecConditionnelles} — l'un des deux a changé sans l'autre` }];
  }
  return [];
}

export const QUESTIONS_SANS_REPONSE_PATH = "docs/circle-tasks/questions-sans-reponse.json";

// Trois états, jamais deux — le même principe que partout ailleurs dans ce paysage.
export const ETATS_QUESTION = ["répondue", "sans réponse", "jamais posée"];

export function loadQuestionsSansReponse({ root = ROOT, readFileImpl = readFileSync } = {}) {
  return loadJsonArray(QUESTIONS_SANS_REPONSE_PATH, { root, readFileImpl });
}

export function enregistrerQuestionsSansReponse(questions = [], { serie, root = ROOT, readFileImpl = readFileSync, writeFileImpl = writeFileSync, mkdirImpl = mkdirSync, date = new Date().toISOString().slice(0, 10) } = {}) {
  const deja = loadQuestionsSansReponse({ root, readFileImpl });
  // Une question reposée et de nouveau sans réponse n'est pas une nouvelle question : on incrémente
  // son compteur plutôt que d'empiler des doublons qui rendraient le registre illisible.
  const suivantes = [...deja];
  for (const q of questions) {
    const existante = suivantes.find((x) => x.question === q && x.serie === serie);
    if (existante) { existante.fois = (existante.fois ?? 1) + 1; existante.derniereFois = date; }
    else suivantes.push({ question: q, serie, premiereFois: date, derniereFois: date, fois: 1 });
  }
  try { mkdirImpl(join(root, "docs/circle-tasks"), { recursive: true }); } catch { /* existe déjà */ }
  writeFileImpl(join(root, QUESTIONS_SANS_REPONSE_PATH), JSON.stringify(suivantes, null, 1), "utf8");
  return suivantes;
}

export function marquerRepondue(question, { serie, root = ROOT, readFileImpl = readFileSync, writeFileImpl = writeFileSync } = {}) {
  const restantes = loadQuestionsSansReponse({ root, readFileImpl }).filter((x) => !(x.question === question && (serie === undefined || x.serie === serie)));
  writeFileImpl(join(root, QUESTIONS_SANS_REPONSE_PATH), JSON.stringify(restantes, null, 1), "utf8");
  return restantes;
}

// L'HYPOTHÈSE PAR DÉFAUT EST L'ACCIDENT, JAMAIS LE REFUS (corrigé le 2026-09-23, dans l'heure).
//
// Ma première version escaladait vers « une question évitée trois fois est un refus ». L'utilisateur
// a corrigé, et il avait raison : « si je ne réponds pas aux questions de la ronde, c'est sûrement
// une erreur ou un bug de ma part (clavier...) ». Supposer le refus revenait à interpréter un
// incident matériel comme une intention — le genre exact de mesure adjacente que ce projet traque.
//
// LA RÈGLE QUI EN DÉCOULE : un silence ne veut RIEN dire. Seule une réponse explicite « je ne veux
// pas répondre » vaut refus. Tant qu'elle n'est pas donnée, la question revient.
export const HYPOTHESE_SILENCE = "accident (clavier, fermeture involontaire) — jamais un refus tant qu'il n'est pas formulé";

// PALIERS_QUESTION — l'escalade ne va PLUS vers le reproche mais vers l'OFFRE EXPLICITE de passer.
// Elle se joue DANS LA MÊME RONDE, immédiatement : reporter au prochain passage laisserait la Ronde
// se terminer sans ses réponses, ce qui est précisément ce qu'on veut éviter.
export const PALIERS_QUESTION = [
  { fois: 3, immediat: true, offrirDePasser: true, action: "reposée avec l'option explicite « je ne veux pas répondre à cette série » — après trois tentatives, l'offre de passer devient elle-même une question, jamais une supposition" },
  { fois: 2, immediat: true, offrirDePasser: true, action: "reposée immédiatement, accompagnée de la question « voulez-vous passer cette série ? » — l'accident reste l'hypothèse, mais on cesse d'insister sans demander" },
  { fois: 1, immediat: true, offrirDePasser: false, action: "reposée immédiatement, telle quelle : une fenêtre fermée est d'abord un accident, et un accident se rattrape sans cérémonie" },
];

// LE PLAFOND ANTI-BOUCLE (2026-09-23, demande explicite : « la fenêtre de question ne doit pas non
// plus réapparaître en boucle de façon intempestive »). Au-delà de trois tentatives DANS LA MÊME
// RONDE, on arrête de reposer — la série est mise en attente pour la Ronde suivante.
//
// POURQUOI CE N'EST PAS UN ABANDON : la série n'est ni répondue ni passée, elle reste au registre
// avec son compteur. Ce qui s'arrête, c'est l'insistance, pas le suivi. Une fenêtre qui revient une
// quatrième fois ne recueille plus une réponse, elle recueille un agacement — et un agacement rend
// les réponses suivantes moins bonnes, pas plus.
export const MAX_TENTATIVES_PAR_RONDE = 3;

export function questionsAReposer(registre = [], { paliers = PALIERS_QUESTION, max = MAX_TENTATIVES_PAR_RONDE } = {}) {
  return (registre ?? [])
    .filter((q) => (q.fois ?? 1) <= max)
    .map((q) => ({ ...q, ...(paliers.find((p) => (q.fois ?? 1) >= p.fois) ?? paliers[paliers.length - 1]) }));
}

// enAttenteProchaineRonde() — l'autre moitié du plafond, et elle est indispensable : sans elle, les
// questions au-delà du plafond disparaîtraient du rapport, ce qui est exactement le défaut que tout
// ce mécanisme existe pour corriger. Elles sont retirées de l'insistance, jamais de la vue.
export function enAttenteProchaineRonde(registre = [], { max = MAX_TENTATIVES_PAR_RONDE } = {}) {
  return (registre ?? []).filter((q) => (q.fois ?? 1) > max);
}

// SERIES_PASSEES_PATH — les séries que l'utilisateur a EXPLICITEMENT choisi de ne pas traiter. Un
// fichier séparé du registre des sans-réponse, et c'est délibéré : une série passée sur décision
// n'est pas une série perdue, et les mélanger ferait réapparaître le défaut qu'on vient de corriger.
export const SERIES_PASSEES_PATH = "docs/circle-tasks/series-passees.json";

export function loadSeriesPassees({ root = ROOT, readFileImpl = readFileSync } = {}) {
  return loadJsonArray(SERIES_PASSEES_PATH, { root, readFileImpl });
}

// passerLaSerie() — n'est appelée QUE sur une réponse explicite de l'utilisateur. Elle retire les
// questions de la série du registre des sans-réponse et acte la décision avec sa date : le
// « pourquoi » reste facultatif, parce qu'exiger une justification pour ne pas répondre
// transformerait l'offre de passer en épreuve, et personne ne la prendrait.
export function passerLaSerie(serie, { pourquoi = null, root = ROOT, readFileImpl = readFileSync, writeFileImpl = writeFileSync, mkdirImpl = mkdirSync, date = new Date().toISOString().slice(0, 10) } = {}) {
  const passees = loadSeriesPassees({ root, readFileImpl });
  passees.push({ serie, pourquoi, date });
  try { mkdirImpl(join(root, "docs/circle-tasks"), { recursive: true }); } catch { /* existe déjà */ }
  writeFileImpl(join(root, SERIES_PASSEES_PATH), JSON.stringify(passees, null, 1), "utf8");
  const restantes = loadQuestionsSansReponse({ root, readFileImpl }).filter((q) => q.serie !== serie);
  writeFileImpl(join(root, QUESTIONS_SANS_REPONSE_PATH), JSON.stringify(restantes, null, 1), "utf8");
  return { passees, restantes };
}

// CE QU'UNE SÉRIE PASSÉE NE FAIT PAS SAUTER (2026-09-23, précision de l'utilisateur au moment même
// où il choisissait l'autre option : « consolide bien l'ordre des choses si j'avais répondu 2 : tu
// dois reprendre le process exact en sautant les étapes citées uniquement »).
//
// LE RISQUE QU'IL DÉSAMORCE, et il est réel : « passer cette série » pourrait glisser vers « passer
// ce moment de la Ronde », puis vers « abréger la fin ». Une permission ponctuelle deviendrait une
// dispense générale, par le seul effet de l'ambiguïté.
//
// LA RÈGLE : passer une série saute EXACTEMENT ses questions, et rien d'autre. Toutes les étapes du
// process continuent dans le même ordre, y compris celles qui suivent immédiatement la série passée.
// Les valeurs manquantes sont prises aux défauts DÉCLARÉS ci-dessous, jamais improvisées au moment.
export const DEFAUTS_SERIE_PASSEE = {
  ouverture: { changementModeleReponse: "non", mode: "AUTO", rythme: "d'une traite", pourquoi: "les valeurs les moins engageantes : aucun changement de modèle, la sélection calibrée sans action coûteuse" },
  "evaluation-agent": { effet: "EVAL-IA est produit SANS la moitié jugement de l'utilisateur, et le dit explicitement dans le rapport — jamais un rapport qui ferait comme si la question n'avait pas été prévue" },
  "constats-analyse": { effet: "les constats restent RETENUS dans le plan d'action, aucun n'est écarté par défaut : écarter demande une raison, et le silence n'en est pas une" },
  "calibrage-correctifs": { effet: "les correctifs gardent le niveau calculé mécaniquement (obligatoire/recommandé), aucun n'est déclassé" },
  "mise-en-cause": { effet: "les points problématiques sont REPORTÉS au prochain passage (reporterPointsAuProchainPassage), jamais effacés" },
  "la-suite": { effet: "ma lecture des trois niveaux est livrée telle quelle, présentée comme non validée" },
};

export function effetDUneSeriePassee(serie, { defauts = DEFAUTS_SERIE_PASSEE } = {}) {
  const d = defauts[serie];
  return {
    serie,
    connu: Boolean(d),
    // Une série inconnue ne prend JAMAIS de défaut inventé : elle se signale. Improviser une valeur
    // pour une série qu'on n'a pas prévue est exactement la dérive que cette table existe pour
    // empêcher.
    effet: d ?? null,
    etapesSautees: d ? [serie] : [],
    reste: "toutes les autres étapes du process continuent dans le même ordre, sans exception",
    avertissement: d ? null : `série « ${serie} » inconnue de DEFAUTS_SERIE_PASSEE : aucun défaut n'est improvisé, l'agent doit demander`,
  };
}

// prochaineAction() — ce que l'agent doit faire MAINTENANT, en une réponse plutôt qu'en une lecture
// de registre. Rend toujours l'un des trois cas, jamais un silence.
export function prochaineAction({ registre = [], serie = null } = {}) {
  const concernees = questionsAReposer(registre).filter((q) => serie === null || q.serie === serie);
  const reportees = enAttenteProchaineRonde(registre).filter((q) => serie === null || q.serie === serie);
  if (!concernees.length) {
    return reportees.length
      ? { quoi: "arreter-de-reposer", pourquoi: `${reportees.length} question(s) au-delà du plafond de ${MAX_TENTATIVES_PAR_RONDE} tentatives : reportées à la prochaine Ronde, retirées de l'insistance et jamais de la vue`, questions: reportees.map((q) => q.question) }
      : { quoi: "rien", pourquoi: "aucune question en attente" };
  }
  const pire = concernees.reduce((m, q) => ((q.fois ?? 1) > (m.fois ?? 1) ? q : m), concernees[0]);
  return {
    quoi: pire.offrirDePasser ? "reposer-et-offrir-de-passer" : "reposer",
    questions: concernees.map((q) => q.question),
    fois: pire.fois ?? 1,
    action: pire.action,
    hypothese: HYPOTHESE_SILENCE,
  };
}

// ————————————————————————————————————————————————————————————————————————
// LA BARRIÈRE D'OUVERTURE (2026-09-23) — ce qui force VRAIMENT, et ce qui ne le peut pas
// ————————————————————————————————————————————————————————————————————————
//
// Question de l'utilisateur, et elle vise juste : « tu peux accrocher le process dans le git
// crochet [...] ou une autre solution qui te force mécaniquement à devoir respecter tout le
// process ? »
//
// POURQUOI LE CROCHET GIT NE PEUT PAS LE FAIRE, et c'est important de le dire plutôt que de
// construire quelque chose qui en aurait l'air : `post-commit` se déclenche APRÈS un commit. Au
// moment où il parle, la Ronde est finie depuis longtemps. Il détecte, il n'empêche jamais. Le
// crochet `pre-commit`, lui, bloque bien — mais il bloque un COMMIT, pas le lancement d'une Ronde,
// et faire échouer tous les commits du dépôt parce qu'une Ronde traîne serait absurde.
//
// CE QUI FORCE RÉELLEMENT : l'outil lui-même. Une Ronde ne peut plus être CLÔTURÉE (`record-run`)
// sans qu'un enregistrement d'ouverture existe, frais et complet. Comme `record-run` est ce qui
// remet à zéro le compteur « N commits sans Ronde », une Ronde non ouverte dans les règles ne
// compte tout simplement pas : le rappel continue de monter, de plus en plus fort, jusqu'à la
// question obligatoire. Le travail bâclé ne se solde pas.
//
// LA LIMITE, DÉCLARÉE : rien n'empêchera jamais un agent de lancer les 26 scripts à la main sans
// rien ouvrir — c'est exactement ce que j'ai fait le 2026-09-22. Ce que cette barrière change,
// c'est qu'un tel passage ne peut plus se CONCLURE, donc ne peut plus passer pour une Ronde faite.
// L'échec devient bruyant au lieu d'être invisible. C'est la même honnêteté que tool-brain et
// SMART-CONSO-TOKEN : on ne prétend pas intercepter la conversation, on rend l'omission coûteuse.
export const OUVERTURE_PATH = "docs/circle-tasks/ouverture.json";

// Les faits d'ouverture obligatoires, dans l'ordre réel du process (Q1 AVANT AUTO/PRIME/GOAT).
// `requisSi` porte les dépendances : le rappel de retour n'est dû que si un changement de modèle a
// été accepté — le réclamer toujours ferait échouer l'ouverture sur le cas le plus fréquent.
export const FAITS_D_OUVERTURE = [
  { cle: "changementModelePosee", libelle: "Q1 posée (changement de modèle IA)", requis: true },
  { cle: "changementModeleReponse", libelle: "réponse à Q1 (oui/non)", requis: true },
  { cle: "retourModeleQuand", libelle: "Q2 : retour avant ou après les rapports", requisSi: (o) => o.changementModeleReponse === "oui" },
  { cle: "mode", libelle: "mode choisi (AUTO / PRIME / GOAT)", requis: true },
  // LA FENÊTRE A-T-ELLE ÉTÉ RÉELLEMENT POSÉE ? (2026-09-23, tâche #609, après une infraction
  // réelle de l'agent.) L'utilisateur avait tranché « non, demande TOUJOURS », en retirant
  // explicitement la dispense du « ne t'arrête pas ». L'agent a malgré tout lancé la Ronde en AUTO,
  // se justifiant par « même question qu'avant-hier, décision déjà prise » — précisément la
  // dispense retirée. Et le contrôleur n'a rien dit : il acceptait le mode en ARGUMENT, donc il
  // enregistrait une DÉCLARATION sans jamais constater un FAIT.
  //
  // CE QU'AUCUN MÉCANISME NE PEUT FAIRE, et c'est déclaré plutôt que tu : aucun outil ne lit une
  // conversation, donc rien ne peut prouver qu'une fenêtre a été affichée. Ce champ ne rend donc
  // pas le mensonge impossible — il le rend EXPLICITE. Passer `--repondu-par=utilisateur` sans
  // avoir posé la question devient une affirmation fausse écrite noir sur blanc, là où l'omission
  // ne laissait aucune trace. Même patron exactement que `enregistrerXp()`, qui refuse un jugement
  // ne portant pas `parUtilisateur: true`, et pour la même raison (Article 27).
  { cle: "modeReponduPar", libelle: "qui a répondu à la fenêtre AUTO/PRIME/GOAT (--repondu-par=utilisateur, la seule valeur acceptée hors mode autonome)", requis: true },
];
// La seule réponse valable : l'utilisateur lui-même. « agent » est refusé par construction — c'est
// tout l'objet de la règle qu'il a posée.
export const REPONDANT_VALIDE = "utilisateur";

export function loadOuverture({ root = ROOT, readFileImpl = readFileSync } = {}) {
  try {
    return JSON.parse(readFileImpl(join(root, OUVERTURE_PATH), "utf8"));
  } catch {
    return null;
  }
}

// findFaitsManquants() — ce qui manque pour qu'une ouverture soit valable. Rendu comme une LISTE et
// jamais comme un booléen : « il manque le mode » et « il ne manque rien » sont deux informations,
// « false » n'en est aucune.
export function findFaitsManquants(ouverture, faits = FAITS_D_OUVERTURE) {
  if (!ouverture) return faits.filter((f) => f.requis).map((f) => f.libelle);
  const manquants = faits
    .filter((f) => (f.requis || (f.requisSi && f.requisSi(ouverture))) && (ouverture[f.cle] === undefined || ouverture[f.cle] === null || ouverture[f.cle] === ""))
    .map((f) => f.libelle);
  // Un champ RENSEIGNÉ avec la mauvaise valeur est pire qu'un champ vide : il a l'air complet.
  if (ouverture.modeReponduPar && ouverture.modeReponduPar !== REPONDANT_VALIDE) {
    manquants.push(`la fenêtre AUTO/PRIME/GOAT doit être répondue par l'utilisateur lui-même (reçu : « ${ouverture.modeReponduPar} ») — « il a déjà répondu une autre fois » n'est pas une réponse, c'est la dispense qu'il a retirée`);
  }
  return manquants;
}

// ouvertureEstFraiche() — une ouverture d'il y a trois jours ne couvre pas la Ronde d'aujourd'hui.
// Fenêtre large et assumée (24 h) : le but est d'empêcher qu'une vieille ouverture serve
// indéfiniment de laissez-passer, jamais de chronométrer une Ronde qui peut légitimement s'étaler.
export const OUVERTURE_VALIDE_HEURES = 24;
export function ouvertureEstFraiche(ouverture, maintenant = Date.now(), heures = OUVERTURE_VALIDE_HEURES) {
  if (!ouverture?.at) return false;
  const age = maintenant - new Date(ouverture.at).getTime();
  return age >= 0 && age <= heures * 3600 * 1000;
}

export function ouvrirRonde(faits, { root = ROOT, writeFileImpl = writeFileSync, mkdirImpl = mkdirSync, now = Date.now() } = {}) {
  const manquants = findFaitsManquants(faits);
  if (manquants.length) return { ok: false, manquants };
  const dossier = join(root, "docs/circle-tasks");
  mkdirImpl(dossier, { recursive: true });
  const enregistrement = { ...faits, at: new Date(now).toISOString() };
  writeFileImpl(join(root, OUVERTURE_PATH), JSON.stringify(enregistrement, null, 1), "utf8");
  return { ok: true, ouverture: enregistrement };
}

// autoriseCloture() — le point de blocage réel. En mode autonome, TOUT est autorisé sans ouverture :
// la borne posée par l'utilisateur ne souffre aucune exception (« aucune fenêtre y compris
// GOAT/AUTO ne doit être bloquante pour le mode autonome »), et une barrière qui empêcherait une
// Ronde de nuit de se clôturer serait précisément le blocage qu'elle interdit.
export function autoriseCloture({ ouverture, nightAutonomousMode = false, maintenant = Date.now() } = {}) {
  if (nightAutonomousMode) return { autorise: true, raison: "mode autonome : aucune ouverture requise, jamais de blocage sans personne pour répondre" };
  const manquants = findFaitsManquants(ouverture);
  if (manquants.length) return { autorise: false, raison: `ouverture absente ou incomplète — il manque : ${manquants.join(", ")}`, manquants };
  if (!ouvertureEstFraiche(ouverture, maintenant)) return { autorise: false, raison: `l'ouverture enregistrée date de plus de ${OUVERTURE_VALIDE_HEURES} h : elle ne peut pas servir de laissez-passer à la Ronde d'aujourd'hui`, manquants: [] };
  return { autorise: true, raison: "ouverture complète et fraîche" };
}

// `record-run` (2026-09-21, trouvaille de la première vraie Ronde AUTO, tâche #336) : recordCircleTasksRun()
// existait déjà mais n'avait AUCUN chemin d'appel simple — seul un `node -e` improvisé pouvait
// l'invoquer, un geste que l'agent qui pilote a justement oublié de faire à la fin de sa toute
// première Ronde réelle (le rappel post-commit affichait encore « 32 commits sans Ronde » juste
// après l'avoir exécutée). Exactement le risque qu'Article 24 vise : un mécanisme qui existe en
// code mais qu'aucune surface simple ne rend réflexe. `git rev-list --count HEAD`, même commande
// que le crochet post-commit (`check-last-commit.mjs`), jamais un second calcul divergent.
function recordRunCli() {
  // LA BARRIÈRE, appliquée ici et pas ailleurs : c'est `record-run` qui remet à zéro le compteur
  // « N commits sans Ronde ». Refuser ici, c'est refuser qu'une Ronde mal ouverte compte comme
  // faite — le rappel continue de monter et finit en question obligatoire. Le travail bâclé ne se
  // solde pas.
  const autonome = process.argv.includes("--autonome");
  const verdict = autoriseCloture({ ouverture: loadOuverture(), nightAutonomousMode: autonome });
  if (!verdict.autorise) {
    console.error(`❌ Clôture REFUSÉE — ${verdict.raison}.`);
    console.error("");
    console.error("Le process exige, AVANT de lancer la Ronde et dans cet ordre :");
    console.error("  Q1  « Voulez-vous changer de modèle/agent IA pour exécuter cette Ronde ? » (les 3 modes, reposée à chaque fois)");
    console.error("  Q2  si oui : revenir au modèle avant ou après l'édition des rapports ?");
    console.error("  puis la fenêtre AUTO / PRIME / GOAT.");
    console.error("");
    console.error("Une fois ces réponses obtenues de l'utilisateur :");
    console.error("  node scripts/circle-tasks.mjs ouvrir --q1=oui|non [--retour=avant|après] --mode=AUTO|PRIME|GOAT --repondu-par=utilisateur");
    console.error("");
    console.error("Mode autonome (personne à qui demander) : node scripts/circle-tasks.mjs record-run --autonome");
    process.exitCode = 1;
    return;
  }
  const count = Number(sh("git rev-list --count HEAD", { cwd: ROOT.replace(/\/$/, "") }).trim());
  if (!Number.isFinite(count)) {
    console.error("Impossible de lire le nombre de commits réel (git rev-list --count HEAD) — rien enregistré.");
    process.exitCode = 1;
    return;
  }
  const state = recordCircleTasksRun(count);
  console.log(`✅ Ronde CIRCLE-TASKS enregistrée comme faite au commit #${state.lastRunCommitCount} — le rappel post-commit repart de zéro à partir de maintenant.`);
}

function ouvrirCli() {
  const arg = (nom) => (process.argv.find((a) => a.startsWith(`--${nom}=`)) ?? "").split("=")[1];
  const q1 = arg("q1");
  const faits = {
    changementModelePosee: q1 === "oui" || q1 === "non",
    changementModeleReponse: q1,
    retourModeleQuand: arg("retour"),
    mode: (arg("mode") ?? "").toUpperCase(),
    modeReponduPar: arg("repondu-par"),
  };
  const res = ouvrirRonde(faits);
  if (!res.ok) {
    console.error(`❌ Ouverture refusée — il manque : ${res.manquants.join(", ")}.`);
    console.error("Usage : node scripts/circle-tasks.mjs ouvrir --q1=oui|non [--retour=avant|après] --mode=AUTO|PRIME|GOAT --repondu-par=utilisateur");
    console.error("  --repondu-par : qui a répondu à la fenêtre. Seul « utilisateur » est accepté — l'agent ne peut pas répondre à sa place, et une réponse donnée une autre fois ne vaut pas pour celle-ci.");
    process.exitCode = 1;
    return;
  }
  console.log(`✅ Ronde ouverte dans les règles (Q1 : ${faits.changementModeleReponse}${faits.retourModeleQuand ? `, retour ${faits.retourModeleQuand}` : ""}, mode ${faits.mode}).`);
  console.log(`   Enregistré dans ${OUVERTURE_PATH} — la clôture par record-run est désormais autorisée pendant ${OUVERTURE_VALIDE_HEURES} h.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv[2] === "record-run") recordRunCli();
  else if (process.argv[2] === "ouvrir") ouvrirCli();
  else main();
}
