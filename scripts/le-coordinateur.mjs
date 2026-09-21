// LE-COORDINATEUR — petit orchestrateur des vérifications gratuites déjà existantes (2026-09-19,
// nommé ainsi par l'utilisateur, calibré via l'Article 16 : « est-ce qu'il est possible de le
// créer à moindre coût, simplement comme un coordinateur de fonctions existantes ? juste là pour
// fiabiliser et fluidifier l'existant [...] assure-toi que le coordinateur est spécialement bien
// câblé avec tous les autres outils, qu'il a un accès facile et privilégié pour communiquer avec
// les autres outils, puisque son but est de fluidifier le processus. »
//
// Volontairement mince : il ne réimplémente AUCUNE logique de vérification lui-même. Il importe
// et appelle directement les fonctions pures déjà exportées par chaque outil (accès "privilégié"
// demandé explicitement) plutôt que de reparser leur sortie texte à l'aveugle une seconde fois —
// exactement la règle de mutualisation de docs/regles-de-travail.md §7ter :
//   - lib-shell.mjs::sh                              → lancer les scripts qui n'exposent pas
//     (encore) toute leur logique en fonctions pures (ARGUS, HARMONIA, ALWAYS-NEW-CODE).
//   - hyper-scan-checkpoint.mjs::summarizeArgusOutput / summarizeHarmoniaOutput → mêmes résumés
//     que HYPER-SCAN-CHECKPOINT utilise déjà, jamais une seconde regex réinventée à côté.
//   - axa-check.mjs::collectCoverage / robustnessScore → réutilise LE MÊME lancement de
//     check-house.mjs pour la couverture par fonction, jamais un second (règle anti-doublon).
//   - always-new-code.mjs::THEMES / parseCoverage / recommendZone → la même mémoire de rotation,
//     jamais une deuxième zone recommandée qui pourrait diverger de celle d'ALWAYS-NEW-CODE.
//   - clean-dirty-old.mjs::lastTouchDays / relativeStaleness → même calcul de stagnation relative,
//     jamais un second calcul divergent, et sans reshell check-house.mjs pour ce seul signal.
//   - check-level-target.mjs::classifyCheckLevel → exposé en passthrough (classifyRequest
//     ci-dessous) pour qu'un appelant puisse classer une demande sans réimporter le module lui-même,
//     jamais appelé automatiquement dans le passage périodique (il a besoin d'un texte de demande).
//
// Ce qu'il ne fait JAMAIS (cf. calibrage explicite du 2026-09-19, "Aucun de ces outils n'est
// autonome", docs/regles-de-travail.md) : il ne déclenche jamais, de sa propre initiative,
// HYPER-SCAN-CHECKPOINT (version complète), Smart Conso API, ou une simulation — tout ce qui coûte
// un vrai appel API reste une décision explicite séparée de l'agent ou de l'utilisateur. Il ne
// décide rien sur le fond : il lance ce qui est déjà gratuit, agrège, et affiche un tableau très
// court — jamais un verdict qui remplacerait la lecture de la sortie complète de chaque outil.
//
// Contrairement aux autres outils de ce paysage, LE-COORDINATEUR n'a pas de blueprint/instanciation
// séparés ni de registre dédié : il n'a aucune connaissance propre au projet à documenter à part —
// sa seule valeur est de savoir appeler les autres. Documenté directement dans
// docs/regles-de-travail.md §7ter, à côté du reste du paysage.
//
// Déclenchement : automatique à chaque changement de code (même convention qu'ARGUS/HARMONIA —
// l'agent le relance en routine après un changement, pas un démon qui tourne en continu, Article 8).
// Doublon : si le commit HEAD n'a pas bougé depuis le dernier passage complet, le signale avant de
// relancer pour rien (jamais une fenêtre de temps, qui pourrait rater un vrai changement fait vite).

import { existsSync, mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { sh, assertNotAPersonnage, AGENT_CATEGORIES } from "./lib-shell.mjs";
import { collectCoverage, robustnessScore, LIB_MAP } from "./axa-check.mjs";
import { summarizeArgusOutput, summarizeHarmoniaOutput } from "./hyper-scan-checkpoint.mjs";
import { THEMES, parseCoverage, recommendZone } from "./always-new-code.mjs";
import { classifyCheckLevel } from "./check-level-target.mjs";
import { lastTouchDays, relativeStaleness } from "./clean-dirty-old.mjs";
import { findUnconfirmedBursts } from "./smart-conso-api.mjs";
import { summarizeHistory, findJudgeSpawnsWithoutConsultation } from "./smart-conso-token.mjs";
import { renderHtmlReport } from "./html-report.mjs";
import { loadJson } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const BADGE_CEREMONY_HISTORY_PATH = join(ROOT, ".badge-ceremony-history.json");
// Best-effort, local, jamais committé — même statut que .gemini-key-health.json (mémoire de
// process/session, jamais une garantie inter-redémarrage, cf. CLAUDE.md section Smart Breaker).
const STATE_FILE = join(ROOT, ".le-coordinateur-last-run.json");
const ALWAYS_NEW_CODE_INDEX = join(ROOT, "docs/always-new-code/index.md");

export function currentHead() {
  return sh("git rev-parse HEAD", { cwd: ROOT }).trim() || undefined;
}

export function loadState(readFile = (f) => readFileSync(f, "utf8")) {
  try { return JSON.parse(readFile(STATE_FILE)); } catch { return {}; }
}

function saveState(state) {
  try { writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); } catch { /* best-effort, jamais bloquant */ }
}

// Un doublon n'est signalé que si RIEN n'a changé dans le dépôt depuis le dernier passage complet
// (même commit HEAD) — jamais une fenêtre de temps fixe, qui pourrait à tort couvrir un vrai
// changement fait vite, ou à l'inverse rater un vrai doublon si on relance après un long moment
// d'inactivité sans avoir touché au code.
export function isDuplicateRun(state, head) {
  return Boolean(state?.lastHead) && Boolean(head) && state.lastHead === head;
}

export function formatTable(rows) {
  const lines = ["| Outil | Résultat | Dernier passage |", "|---|---|---|"];
  for (const r of rows) lines.push(`| ${r.name} | ${r.result} | ${r.when} |`);
  return lines.join("\n");
}

// MENU DES PRESTATIONS (2026-09-20, demande explicite de l'utilisateur : « le coordinateur est
// capable de proposer de nouvelles prestations, quand les outils évoluent ou quand un nouvel outil
// est créé [...] ce menu est très utile pour toi [...] il te rappelle les prestations que tu peux
// commander au réseau d'outils [...] il est aussi utile pour moi, via toi »). Traduit chaque outil
// coûteux ou occasionnel du paysage en une DEMANDE EN LANGAGE COURANT, jamais un nom d'outil interne
// — le but est que l'agent (et l'utilisateur à travers lui) sache ce qu'il peut commander sans avoir
// à se souvenir des noms internes. Volontairement une simple liste de données, jamais un mécanisme :
// EXACTEMENT le même principe de sobriété que le reste de LE-COORDINATEUR (aucune connaissance
// propre, juste agréger/rappeler ce qui existe déjà).
//
// ÉVOLUTIF PAR CONSTRUCTION : quand un nouvel outil est créé, ou qu'un outil existant change ce
// qu'il peut faire, une entrée s'ajoute ou se met à jour ICI — fait partie du cahier des charges de
// tout nouvel outil au même titre que son blueprint (cf. docs/regles-de-travail.md §7ter, « un outil
// n'est jamais fini tant que ses points d'intégration ne sont pas câblés »). Jamais une liste figée
// à réciter de mémoire : toujours relue avant de répondre à une demande qui pourrait y correspondre.
// Chaque coût donne, quand c'est pertinent, une estimation CHIFFRÉE en tokens (schémas connus de
// SMART-CONSO-TOKEN, jamais un vrai compteur) en plus du coût en appels API — demande explicite de
// l'utilisateur du 2026-09-20 : « assure-toi que le coordinateur donne toujours une estimation du
// coût de l'utilisation des outils, en token et en API [...] raison pour laquelle tu dois ouvrir le
// catalogue en auto, pour te rappeler des prix ». Un outil qui appelle un agent séparé (outil
// `Agent`) porte systématiquement le repère "~37k tokens fixes" (KNOWN_COSTLY_PATTERNS.agent_subagent_spawn),
// jamais un chiffre inventé au cas par cas.
// `nom` (2026-09-21, tâche #154 — « toutes les combinaisons outils, un nom pour chaque prestation »)
// : un identifiant court et mémorable par offre, pour pouvoir parler du "Pack X" plutôt que de
// redécrire la combinaison d'outils à chaque fois — jamais un renommage des outils eux-mêmes,
// seulement de la COMBINAISON packagée ici.
//
// Écart réel trouvé et corrigé le 2026-09-21 (question directe de l'utilisateur : « on est d'accord
// que le coordinateur a pris le soin de réfléchir aux différentes combinaisons possibles... ? ») :
// vérifié en relisant la liste — NON, seules 2 des 14 lignes d'origine combinaient réellement
// plusieurs outils (Pack Sentinelle, Pack Rénovation), le reste était un mapping un-besoin-un-outil
// construit incrémentalement. Un vrai trou trouvé au passage : la synthèse complète et gratuite du
// réseau (`runNetworkCheck()`, déjà exposée dans la Ronde via l'item `network-check-run`) n'avait
// AUCUNE ligne PRESTATIONS — jamais proposée comme "offre" alors qu'elle combine 6 outils gratuits.
// Corrigé : "Pack Panorama" ajouté. Systématisé pour l'avenir (demande explicite : « je veux que ce
// soit le coordinateur qui réalise systématiquement cette passe [...] avant de délivrer le
// catalogue ») dans l'`execute` de l'item CIRCLE-TASKS `coordinateur-catalogue` (circle-tasks.mjs) —
// une vraie relecture combinatoire par l'agent avant chaque appel à recordCatalog(), jamais une
// heuristique mécanique inventée ici : LE-COORDINATEUR ne raisonne jamais lui-même (§7ter), décider
// qu'une combinaison est réellement utile reste un jugement, pas un calcul.
//
// Structure enrichie le 2026-09-21, deuxième vérification directe de l'utilisateur : « on est ok
// qu'il y a à chaque fois un prix en token ET api ? [...] avec une courte description, quelle que
// soit la combinaison ? ». Vérifié : NON — plusieurs lignes n'avaient aucun coût token chiffré
// (Pack Provocation) ou aucune mention explicite du coût API (Pack Ronde), les deux coûts mélangés
// dans une seule phrase libre selon les lignes. Corrigé en adoptant la MÊME séparation déjà validée
// dans CIRCLE_ITEMS (`cout` = appels Gemini/API réels, `tokensEstimes` = coût en tokens Claude,
// jamais confondus, cf. commentaire en tête de circle-tasks.mjs) — jamais un second vocabulaire
// inventé ici. `description` ajoutée : ce que la prestation délivre concrètement, distincte de
// `demande` (dans quel cas s'en servir) — pour que chaque ligne se lise comme une vraie offre de
// catalogue, pas seulement un renvoi vers un nom d'outil.
// Deuxième passe combinatoire le même jour (déjà systématisée ci-dessus, appliquée une seconde fois
// tout de suite à la demande explicite : « je imagine qu'il va y avoir beaucoup de combinaisons
// possibles [...] TOUTES CELLES qui peuvent être utiles pour toi ou pour le projet ») : deux
// nouveaux packs trouvés — "Pack Éclaireur" (AXA-CHECK + CLEAN-DIRTY-OLD + nœuds sensibles HARMONIA,
// jamais combinés avant pour un contrôle ciblé PRÉ-modification d'un fichier précis, distinct du
// balayage global de Pack Panorama) et "Pack Décollage" (Smart Conso API + le carnet de correctifs,
// jamais combinés avant pour un vrai contrôle pré-simulation, cf. Article 18 étape 0).
// Ordre du catalogue (2026-09-21, demande explicite de l'utilisateur : « en premier, sont présentés
// les outils seuls, tous les outils seuls, avant les combinaisons plus complexes ») : les 13
// prestations à un seul outil d'abord, puis les 5 combinaisons multi-outils ensuite (elles-mêmes
// triées par nombre d'outils croissant) — jamais un ordre historique arbitraire (Pack Sentinelle, un
// combo à 3 outils, était auparavant en toute première ligne).
export const PRESTATIONS = [
  { nom: "Pack Empreinte", description: "Note la fidélité d'un texte déjà écrit (transcript, extrait) à l'esprit rugueux des personnages.", demande: "Fidélité de l'esprit des personnages (Article 0)", outils: ["EL-PROFESSOR"], cout: "0 appel API — relit un texte déjà produit", tokensEstimes: "variable — proportionnel à la taille du texte relu" },
  { nom: "Pack Provocation", description: "Envoie 16 provocations réelles au modèle Gemini et affiche les réponses de Lia/Noé pour lecture humaine.", demande: "Diagnostic direct du ton face à une provocation réelle", outils: ["check-spirit.mjs"], cout: "réel — 16 vrais appels Gemini, consulter Smart Conso API avant", tokensEstimes: "modéré — lecture des 16 réponses produites" },
  { nom: "Pack Vitrine", description: "Capture 2 écrans du rendu 3D réel (session déjà en cours) et les note contre la charte graphique.", demande: "Qualité visuelle du rendu", outils: ["THE-SCREENER"], cout: "0 appel API — capture Playwright locale", tokensEstimes: "faible — lecture vision de 2 images" },
  { nom: "Pack Blindage", description: "Mesure la couverture de test réelle par fonction (V8) sur les fichiers du dépôt.", demande: "Robustesse et couverture de test réelle", outils: ["AXA-CHECK"], cout: "0 appel API", tokensEstimes: "nul — 0 token, 0 appel API" },
  { nom: "Pack Chasse", description: "Orchestre ARGUS/HARMONIA/check-house.mjs/le tableau de bord en version légère gratuite ; version complète ajoute une double perspective par agent séparé.", demande: "Chasse aux bugs cachés avant une étape importante", outils: ["HYPER-SCAN-CHECKPOINT"], cout: "version légère : 0 appel API ; version complète : appels Gemini réels — consulter Smart Conso API avant", tokensEstimes: "version légère : faible ; version complète : ~37k tokens fixes (agent séparé) — consulter SMART-CONSO-TOKEN avant" },
  { nom: "Pack Verdict", description: "Un agent séparé, sans mémoire du projet, incarne un professionnel senior et rend un verdict opiniâtre sur le code et le produit.", demande: "Audit global indépendant (code + produit + reprise potentielle)", outils: ["THE-FINAL-JUDGE"], cout: "0 appel API — agent séparé, jamais de Gemini", tokensEstimes: "~37k tokens fixes par appel (quasi le même quel que soit le palier d'intensité) — consulter Smart Conso API ET SMART-CONSO-TOKEN avant" },
  { nom: "Pack Bouclier", description: "Même agent séparé que Pack Verdict, mandat explicitement étendu aux risques de sécurité/production.", demande: "Sécurité et préparation à la mise en production", outils: ["THE-FINAL-JUDGE (mandat sécurité inclus)"], cout: "0 appel API — agent séparé, jamais de Gemini", tokensEstimes: "~37k tokens fixes — consulter Smart Conso API ET SMART-CONSO-TOKEN avant" },
  { nom: "Pack Mémoire Longue", description: "Un agent séparé archiviste relit la conversation entière contre docs/suivi/ pour trouver ce qui n'a jamais été tracé.", demande: "Vérifier qu'aucune idée/tâche n'a été oubliée dans le suivi (relecture lourde, agent séparé)", outils: ["THE-DEEP-READER"], cout: "0 appel API — agent séparé, jamais de Gemini", tokensEstimes: "~37k tokens fixes minimum + volume réel de conversation à relire, jamais un chiffre fixe comme Pack Verdict — consulter Smart Conso API ET SMART-CONSO-TOKEN avant, préférer d'abord la version légère gratuite (docs/systeme-de-suivi.md)" },
  { nom: "Pack Dépannage", description: "Sonde plusieurs modèles/clés Gemini avec un appel minimal réel pour identifier ce qui est encore disponible.", demande: "Diagnostiquer un blocage/quota Gemini épuisé (429/503 répétés)", outils: ["Smart Breaker (check-gemini-quota.mjs)"], cout: "réel — quelques appels Gemini minimaux de diagnostic", tokensEstimes: "négligeable" },
  { nom: "Pack Sobriété", description: "Donne un avis fiabilisé avant une action coûteuse en tokens, combinant schémas connus et historique observé.", demande: "Réguler ma propre consommation de tokens avant une action coûteuse", outils: ["SMART-CONSO-TOKEN"], cout: "0 appel API", tokensEstimes: "nul — 0 token, 0 appel API" },
  { nom: "Pack Ronde", description: "Ouvre la fenêtre à cocher de la Ronde périodique (profil, référentiels, KPI, signaux ALWAYS-NEW-CODE/CLEAN-DIRTY-OLD, scans Smart Conso, catalogue, photo de la dream team, THE-SCREENER).", demande: "Lancer la ronde périodique des tâches gratuites mal automatisées", outils: ["CIRCLE-TASKS"], cout: "0 appel API — sauf si THE-FINAL-JUDGE (⚠️🔴) est explicitement coché", tokensEstimes: "faible à modéré selon la sélection — ~37k tokens fixes seulement si THE-FINAL-JUDGE est explicitement coché" },
  { nom: "Pack Boussole", description: "Génère l'état des lieux des tâches en cours (zoom + forme liste/arborescence) en rapport HTML, strictement en lecture seule sur docs/suivi/.", demande: "État des lieux des tâches en cours", outils: ["check-tasks-details"], cout: "0 appel API — lecture seule de docs/suivi/", tokensEstimes: "variable — proportionnel à la taille du suivi relu" },
  { nom: "Pack Espion", description: "Classe chaque Article/règle de CLAUDE.md ET de docs/regles-de-travail.md par sensibilité/importance et repère une redondance possible entre deux règles.", demande: "Préparer un allègement de CLAUDE.md ou de regles-de-travail.md en identifiant les vrais candidats", outils: ["CHARTER-SPY (anciennement CLAUDE.MD.SPY, extension de SMART-CONSO-TOKEN)"], cout: "0 appel API — relit le document ciblé et le reste du dépôt", tokensEstimes: "faible — un seul fichier local relu par le script, pas par l'agent" },
  { nom: "Pack Registre", description: "Index global des registres du réseau d'outils : décision HTML/texte vérifiée contre le vrai code, âge du dernier rapport, croisement avec le compteur d'usage pour repérer un outil dont les rapports ne sont jamais consultés.", demande: "Vérifier que chaque outil livre ses rapports comme prévu (décision HTML/texte, fraîcheur, usage réel)", outils: ["Doc-Report"], cout: "0 appel API — relit les registres et le code local", tokensEstimes: "faible — sortie compacte, un tableau par famille" },
  { nom: "Pack Régence", description: "Rappelle de consulter docs/philosophie-et-politique.md avant une décision à haut niveau (6 catégories), signale sa fraîcheur, son évolution datée et une tension possible entre deux principes.", demande: "Vérifier qu'une décision de fond respecte la philosophie et la politique du projet", outils: ["THE-KING"], cout: "0 appel API — relit un document local", tokensEstimes: "faible — sortie compacte, un rappel ciblé" },
  { nom: "Pack Secrétariat", description: "Aplatit le dépôt (code seul ou code + documentation) en une édition consolidée, annotée par fraîcheur/couverture, avec table des matières et versionnage — jamais une réécriture réelle.", demande: "Obtenir une version de référence unique et lisible du code (ou code + docs) du projet", outils: ["INES-official"], cout: "0 appel API — relit les fichiers locaux", tokensEstimes: "élevé si le corps complet est relu par l'agent — le corps reste local, jamais committé" },
  { nom: "Pack Rénovation", description: "Repère la zone de code la plus négligée (ALWAYS-NEW-CODE) et la stagnation relative (CLEAN-DIRTY-OLD).", demande: "Dette technique / code qui s'empile plutôt que d'être pensé", outils: ["ALWAYS-NEW-CODE", "CLEAN-DIRTY-OLD"], cout: "0 appel API — raisonnement, pas de Gemini", tokensEstimes: "élevé pour ALWAYS-NEW-CODE (vrai zoom, consulter SMART-CONSO-TOKEN avant) ; nul pour CLEAN-DIRTY-OLD (délègue sans raisonner)" },
  { nom: "Pack Décollage", description: "Avant de lancer une simulation Article 18 : vérifie le quota Gemini réellement disponible (Smart Conso API) et le carnet des correctifs encore en observation à revalider — jamais combinés avant.", demande: "Contrôle pré-simulation complet (quota + correctifs en attente de confirmation)", outils: ["Smart Conso API", "docs/simulations/correctifs-a-revalider.md"], cout: "0 appel API pour le contrôle lui-même — la simulation qui suit, elle, en fera beaucoup", tokensEstimes: "faible — lecture de deux sorties compactes" },
  { nom: "Pack Sentinelle", description: "Relance la suite de tests, ARGUS et HARMONIA sur le code réel du commit qui vient d'être fait.", demande: "Vérification rapide après un changement de code", outils: ["check-house.mjs", "ARGUS (mécanique)", "HARMONIA (mécanique)"], cout: "0 appel API, déjà automatique à chaque commit", tokensEstimes: "nul pour l'agent — tourne dans un processus séparé (post-commit), seul le résultat est lu" },
  { nom: "Pack Éclaireur", description: "Avant de toucher un fichier précis : sa couverture de test réelle (AXA-CHECK), sa stagnation relative (CLEAN-DIRTY-OLD) et sa proximité avec un nœud sensible HARMONIA, en un coup d'œil ciblé — jamais le balayage global de Pack Panorama.", demande: "Contrôle pré-modification d'un fichier précis avant un changement risqué", outils: ["AXA-CHECK", "CLEAN-DIRTY-OLD", "HARMONIA (nœuds sensibles)"], cout: "0 appel API", tokensEstimes: "faible — signal ciblé sur un seul fichier, jamais tout le dépôt" },
  { nom: "Pack Panorama", description: "Synthèse en un seul tableau des 4 outils noyau (ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD) + le rythme des deux Smart Conso, sur tout le dépôt.", demande: "Vue d'ensemble croisée et gratuite de tout le réseau d'outils avant une décision de priorisation", outils: ["check-house.mjs", "ARGUS", "HARMONIA", "AXA-CHECK", "CLEAN-DIRTY-OLD", "ALWAYS-NEW-CODE (préparation)", "Smart Conso API", "SMART-CONSO-TOKEN"], cout: "0 appel API", tokensEstimes: "modéré à élevé — sortie complète de la synthèse, plus lourd que les autres lignes (relance check-house.mjs avec instrumentation de couverture V8)" },
  { nom: "Pack Memory-Audit", description: "Vérifie la cohérence mécanique de la mémoire persistée de Lia/Noé (ordre chronologique, remise à zéro suspecte, régression de gravité) sur une partie réelle, et relit au passage le poids moyen réel envoyé à Gemini par tour et par personnage (memento weight).", demande: "Contrôle de la mémoire narrative des personnages après une simulation, ou suspicion d'un bug de sauvegarde de type loveRealized", outils: ["memory-audit"], cout: "0 appel API — mécanique, jamais un second appel Gemini", tokensEstimes: "faible — comparaison de structures de données, jamais une lecture de contenu narratif" },
  { nom: "Pack Découpage", description: "Détecte des points de coupe candidats et un indice de risque lexical dans une fonction géante d'un fichier donné, pour préparer un découpage manuel en sous-fonctions testées à chaque étape (find-deep-booster, anciennement affiché « route-booster » — scripts/route-booster.mjs inchangé).", demande: "Avant/pendant un chantier de découpage d'un fichier fourre-tout (ex. route.ts)", outils: ["find-deep-booster"], cout: "0 appel API — heuristique texte, jamais un vrai parseur", tokensEstimes: "faible à modéré — dépend de la taille du fichier ciblé" },
  { nom: "Pack Boussole", description: "Indexe par concept les fonctions nommées ou les blocs commentés d'un fichier déjà découpé (route.ts une fois découpé, ou check-house.mjs dès aujourd'hui), avec un rattachement indicatif aux thèmes HARMONIA.", demande: "Retrouver rapidement où se trouve une logique précise dans un gros fichier déjà structuré", outils: ["find-booster"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Cerveau de recherche", description: "Rend un jugement unifié — find-booster et/ou find-deep-booster (surnom de route-booster) pour un fichier donné, jamais un choix exclusif — en réutilisant leurs fonctions telles quelles, sans rien recalculer.", demande: "Savoir lequel des deux outils de recherche (ou les deux) utiliser avant de lire un fichier potentiellement volumineux ou complexe", outils: ["find-brain"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Cerveau central", description: "Généralise find-brain à tout le catalogue PRESTATIONS : à partir d'une description de tâche et/ou d'un fichier ciblé, indique quelle(s) prestation(s) et quel(s) outil(s) de recherche utiliser, sans rien recalculer soi-même. Délivre aussi le rapport de Ronde (outils jamais sollicités, auto-diagnostic borné à son propre périmètre).", demande: "Savoir quel outil ou quelle combinaison d'outils déjà existante utiliser pour une tâche donnée, sans avoir à y réfléchir soi-même", outils: ["tool-brain"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Chasse aux clones", description: "Scanne lib/scripts/app/components (hors components/ui, vendored) à la recherche de blocs de lignes identiques répétés à plusieurs endroits, regroupés par cluster et triés par impact réel.", demande: "Dette technique / code qui s'empile plutôt que d'être pensé — trouver un bloc de logique recopié plutôt que factorisé", outils: ["clone-hunter"], cout: "0 appel API — heuristique texte, zéro parseur AST", tokensEstimes: "faible à modéré — sortie compacte des clusters trouvés" },
  { nom: "Pack Objectifs", description: "Confronte chaque objectif chiffré du registre (par entité/période) au résultat réel déjà mesuré par tool-usage.mjs, avec un statut atteint/en dessous/dépassé/pas de données. Surnom : R/O-Guardian (2026-09-21).", demande: "Vérifier si un objectif fixé sur un outil ou une entité a été atteint sur sa période", outils: ["objectifs-vs-resultats"], cout: "0 appel API — relit un historique déjà écrit, jamais un second calcul", tokensEstimes: "faible — sortie compacte, une ligne par objectif" },
  { nom: "Pack Direction RH", description: "Constat chiffré de l'effectif de l'équipe par catégorie, supervision du badge (lit checkAgentOnboarding(), jamais ne le recalcule), tendance KPI lue depuis kpi-historique.csv, outils à retirer/refondre — jamais un jugement automatique, toujours l'utilisateur qui décide.", demande: "Bilan RH de l'équipe de l'Agence Codex, effectif, badges, tendance KPI, outils à reconsidérer", outils: ["CASSANDRA-RH"], cout: "0 appel API — relit ce que le reste du réseau d'outils sait déjà", tokensEstimes: "faible pour le signal léger, modéré pour le bilan HTML complet" },
];

export function formatMenu(prestations = PRESTATIONS) {
  const lines = ["| Si tu veux... | Ça déclenche | Coût |", "|---|---|---|"];
  for (const p of prestations) lines.push(`| ${p.demande} | ${p.outils.join(" + ")} | ${p.cout} |`);
  return lines.join("\n");
}

// Catalogue d'offres nommé, historisé — tâche #154 (2026-09-19, demande explicite : « sur demande,
// le coordinateur peut produire une version à jour du catalogue d'offres [...] il historise chaque
// version du catalogue dans un dossier local avec index »). Exception ÉTROITE et explicite au
// principe général de LE-COORDINATEUR (« jamais de registre dédié », §7ter) : ce catalogue EST un
// artefact versionné dans le temps, contrairement à la synthèse `runNetworkCheck()` elle-même, qui
// reste toujours éphémère/live. Une nouvelle version n'est écrite que si son contenu diffère
// réellement de la dernière déjà archivée (même discipline anti-doublon que `isDuplicateRun()`) —
// jamais une entrée par simple relance sans rien de neuf.
//
// Nom de fichier à la MINUTE, pas au jour (2026-09-21, vrai bug trouvé en conditions réelles : le
// décalage d'horloge du conteneur — déjà documenté ailleurs dans ce projet — a fait tomber deux
// vrais changements de contenu, à quelques minutes d'écart, sur la même date calendaire ; un nom de
// fichier `YYYY-MM-DD.md` a silencieusement écrasé la première version tout en laissant une ligne
// d'index périmée pointer vers un fichier qui ne correspondait plus à ce qu'elle décrivait). Même
// convention que les scans ARGUS (`scan-YYYY-MM-DD-HH-MM.txt`), déjà éprouvée dans ce projet pour
// exactement cette raison.
export const CATALOGUE_DIR = join(ROOT, "docs/le-coordinateur-catalogue");
export const CATALOGUE_INDEX_PATH = join(CATALOGUE_DIR, "index.md");
const CATALOGUE_INDEX_HEADER = "# Catalogue d'offres nommé — historique\n\n*(Cf. docs/regles-de-travail.md §7ter et la tâche #154. Chaque ligne est une version datée (à la minute, cf. commentaire ci-dessus) du catalogue de `PRESTATIONS`, écrite uniquement quand son contenu a réellement changé — jamais une entrée par simple relance sans rien de neuf. Exception étroite au principe général de LE-COORDINATEUR — \"jamais de registre dédié\" — qui reste vrai pour sa synthèse `runNetworkCheck()`, toujours éphémère.)*\n\n| Date | Nombre d'offres | Fichier |\n|---|---|---|\n";

export function renderNamedCatalog(prestations = PRESTATIONS) {
  const lines = [
    "| Nom | Description | Si tu veux... | Ça déclenche | Coût API | Coût tokens |",
    "|---|---|---|---|---|---|",
  ];
  for (const p of prestations) {
    lines.push(
      `| ${p.nom ?? "—"} | ${p.description ?? "—"} | ${p.demande} | ${p.outils.join(" + ")} | ${p.cout} | ${p.tokensEstimes ?? "—"} |`
    );
  }
  return lines.join("\n");
}

export function recordCatalog(prestations = PRESTATIONS, now = new Date(), fsImpl = { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync }) {
  const dateLabel = now.toISOString().slice(0, 10);
  const timestampLabel = now.toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const table = renderNamedCatalog(prestations);
  let latestFile;
  if (fsImpl.existsSync(CATALOGUE_DIR)) {
    const files = fsImpl.readdirSync(CATALOGUE_DIR).filter((f) => /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}\.md$/.test(f)).sort();
    latestFile = files[files.length - 1];
  }
  if (latestFile) {
    const previousContent = fsImpl.readFileSync(join(CATALOGUE_DIR, latestFile), "utf8");
    if (previousContent.includes(table)) {
      return { written: false, message: `Catalogue déjà à jour depuis ${latestFile.replace(".md", "")} — aucun changement réel de PRESTATIONS depuis.` };
    }
  }
  if (!fsImpl.existsSync(CATALOGUE_DIR)) fsImpl.mkdirSync(CATALOGUE_DIR, { recursive: true });
  const fileName = `${timestampLabel}.md`;
  fsImpl.writeFileSync(join(CATALOGUE_DIR, fileName), `# Catalogue d'offres nommé — ${dateLabel}\n\n${table}\n`);
  const indexExisting = fsImpl.existsSync(CATALOGUE_INDEX_PATH) ? fsImpl.readFileSync(CATALOGUE_INDEX_PATH, "utf8") : CATALOGUE_INDEX_HEADER;
  fsImpl.writeFileSync(CATALOGUE_INDEX_PATH, indexExisting + `| ${dateLabel} | ${prestations.length} | [${fileName}](${fileName}) |\n`);
  return { written: true, fileName, dateLabel };
}

// Livraison du catalogue à chaque Ronde CIRCLE-TASKS (2026-09-21, demande explicite de l'utilisateur :
// « à chaque ronde, en même temps que le rapport de ronde, le coordinateur révèle la version à jour
// du catalogue d'outils : en format html si c'est un nouveau catalogue jamais produit, en txt si
// c'est un catalogue qui n'a pas changé »). Réutilise DIRECTEMENT le booléen `written` de
// recordCatalog() — le signal exact de nouveauté réelle, déjà anti-doublon — jamais une seconde
// détection de changement divergente construite à côté.
export function buildCatalogDelivery(recordResult, prestations = PRESTATIONS) {
  if (recordResult.written) {
    return {
      format: "html",
      content: renderHtmlReport({
        title: "LE-COORDINATEUR — catalogue d'offres nommé",
        subtitle: `Nouvelle version réelle du catalogue (${recordResult.dateLabel}) — archivée dans docs/le-coordinateur-catalogue/${recordResult.fileName}.`,
        dateLabel: recordResult.dateLabel,
        blocks: [{ type: "table", headers: ["Nom", "Description", "Si tu veux...", "Ça déclenche", "Coût API", "Coût tokens"], rows: prestations.map((p) => [p.nom ?? "—", p.description ?? "—", p.demande, p.outils.join(" + "), p.cout, p.tokensEstimes ?? "—"]) }],
        footer: "Catalogue régénéré à chaque Ronde CIRCLE-TASKS — HTML seulement quand son contenu a réellement changé, texte simple sinon.",
      }),
    };
  }
  return { format: "text", content: `${recordResult.message}\n\n${renderNamedCatalog(prestations)}` };
}

// GARDE-FOU DE FRAÎCHEUR DU CATALOGUE (2026-09-20, demande explicite de l'utilisateur : « il doit y
// avoir un test dédié pour être sûr que le catalogue est bien mis à jour [...] quand un nouvel outil
// est créé, il comprend de façon autonome quelles nouvelles prestations peuvent être proposées »).
// Honnêteté de conception, même principe que ARGUS/HARMONIA/EL-PROFESSOR/AXA-CHECK : aucun script ne
// peut créativement INVENTER une nouvelle combinaison d'outils — ça reste un vrai jugement (Article
// 19). Ce que ce garde-fou PEUT garantir mécaniquement : qu'aucun outil coûteux ou occasionnel de la
// carte de référence (docs/regles-de-travail.md §7ter) ne reste durablement absent du menu — un
// signal sur l'ABSENCE, jamais une proposition fabriquée à sa place (corollaire Article 17).
//
// "Coûteux ou occasionnel" est lu directement dans la carte elle-même (colonnes Coût/Déclenchement),
// jamais une liste séparée d'exclusions à maintenir à la main : un outil gratuit et "toujours déployé"
// (ARGUS, HARMONIA, AXA-CHECK, CLEAN-DIRTY-OLD, check-house.mjs) ou un outil de régulation interne à
// l'agent (Smart Conso API, CHECK-LEVEL-TARGET, LE-COORDINATEUR lui-même) n'a naturellement aucune
// des deux marques ("réel"/"sur demande") et n'a donc pas besoin d'apparaître comme une "prestation"
// commandable.
// Colonnes lues par NOM sur la ligne d'en-tête, jamais par position fixe (2026-09-20, bug réel
// trouvé et corrigé le jour même : l'ajout d'une colonne "Statut" dans la carte des outils avait
// décalé "Coût"/"Déclenchement" d'un cran, et l'ancienne lecture positionnelle
// (`[tool, , cout, declenchement]`) aurait silencieusement lu les mauvaises colonnes sans jamais
// planter — exactement le genre de dépendance fragile qu'un futur ajout de colonne recasserait à
// nouveau si elle restait positionnelle).
// `description` (2026-09-21, demande explicite de l'utilisateur : « j'ai besoin d'une courte
// description [...] à chaque fois » dans le gabarit de certification) — extraite par NOM de la
// colonne "Ce qu'il détecte/régule" déjà présente dans la table maîtresse, jamais un second texte
// hand-maintained ailleurs qui pourrait diverger. `undefined` pour une table de test qui n'a pas
// cette colonne (jamais un texte fabriqué) — même discipline que statutIdx ci-dessous.
export function parseToolsTable(markdown) {
  const lines = markdown.split("\n").filter((l) => l.trim().startsWith("|"));
  if (!lines.length) return [];
  const headerCells = lines[0].split("|").slice(1, -1).map((c) => c.trim());
  const coutIdx = headerCells.indexOf("Coût");
  const declenchementIdx = headerCells.indexOf("Déclenchement");
  const statutIdx = headerCells.indexOf("Statut");
  const descriptionIdx = headerCells.indexOf("Ce qu'il détecte/régule");
  if (coutIdx === -1 || declenchementIdx === -1) return [];
  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length <= Math.max(coutIdx, declenchementIdx)) continue;
    const tool = cells[0];
    if (!tool || tool === "Outil" || /^-+$/.test(tool)) continue;
    const statut = statutIdx !== -1 ? cells[statutIdx] : null;
    const description = descriptionIdx !== -1 ? cells[descriptionIdx] : undefined;
    rows.push({ tool: tool.replace(/`/g, ""), cout: cells[coutIdx], declenchement: cells[declenchementIdx], statut, description });
  }
  return rows;
}

// toolCompanions() (2026-09-21, même demande : « savoir aussi avec quels outils cet outil est
// susceptible de se plugger ») — jamais une nouvelle donnée hand-maintained : dérive la réponse du
// catalogue PRESTATIONS déjà existant, en listant les autres outils qui apparaissent dans au moins
// une même prestation que `agentName`. Un outil absent de toute prestation combinée (aucune entrée
// PRESTATIONS ne le cite aux côtés d'un autre) rapporte honnêtement une liste vide, jamais une
// combinaison inventée.
export function toolCompanions(agentName, prestations = PRESTATIONS) {
  const nameLower = agentName.toLowerCase();
  const companions = new Set();
  for (const p of prestations) {
    const selfIdx = p.outils.findIndex((o) => o.toLowerCase().includes(nameLower));
    if (selfIdx === -1) continue;
    for (let i = 0; i < p.outils.length; i++) {
      if (i !== selfIdx) companions.add(p.outils[i]);
    }
  }
  return [...companions];
}

export function isMenuWorthy(row) {
  return /réel/i.test(row.cout) || /sur demande|à la main|à la demande/i.test(row.declenchement);
}

// suggestPrestationsForTask() (2026-09-20, demande explicite de l'utilisateur : « check-tasks-details
// travaille en étroite collaboration avec le coordinateur : pour chaque tâche à accomplir, il
// consulte le coordinateur qui lui dit quelles prestations permettent de remplir la tâche »).
// Jusqu'ici, PRESTATIONS n'était qu'un menu pour un LECTEUR humain/agent — cette fonction transforme
// LE-COORDINATEUR en un vrai service qu'un AUTRE SCRIPT peut appeler directement (accès "privilégié",
// même doctrine que le reste de ce fichier : importer une fonction pure plutôt que reparser une
// sortie texte). Un simple chevauchement de mots-clés entre le libellé d'une tâche et le champ
// `demande` de chaque prestation — JAMAIS une intelligence qui devine une intention : un
// rapprochement mécanique, à vérifier toujours par une vraie lecture, même honnêteté de conception
// que ARGUS/ALWAYS-NEW-CODE (un signal "correspondance possible", jamais une certitude). Documenté
// comme principe général (pas seulement pour check-tasks-details) dans docs/regles-de-travail.md
// §7ter — n'importe quel outil du paysage peut importer et appeler cette fonction.
const STOPWORDS_FR = new Set([
  "le", "la", "les", "de", "des", "du", "un", "une", "et", "ou", "à", "au", "aux", "pour", "sur",
  "dans", "en", "avec", "sans", "que", "qui", "ne", "pas", "est", "être", "ce", "cette", "son", "sa",
  "ses", "tout", "toute", "tous", "toutes", "plus", "déjà", "jamais", "cet", "cette",
]);

// Exportée (2026-09-20) pour que check-tasks-details.mjs réutilise EXACTEMENT le même tokenizer
// pour corroborer une tâche avec les registres ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD — jamais un
// second jeu de mots-vides réinventé (anti-duplication, docs/regles-de-travail.md §7ter).
export function significantWords(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS_FR.has(w));
}

// Seuil de 2 mots-clés partagés (pas 1) — un seul mot commun (souvent un mot très général du
// domaine, ex. "tâche", "outil") produirait trop de faux positifs pour rester un signal honnête.
// badgeCheck (2026-09-20, demande explicite de l'utilisateur : « si un membre de l'équipe est
// sollicité alors qu'il n'a pas de badge, une alerte doit nous être remontée »). Portée calibrée
// explicitement avec l'utilisateur : PAS un nouveau passage obligé pour tout appel (aucun n'existe
// aujourd'hui, ça resterait un chantier lourd hors de propos) — seulement le point de passage déjà
// construit, celui par lequel un autre outil demande "quel membre utiliser pour cette tâche".
// `onboardingContext` est optionnel et rétrocompatible : sans lui, `suggestPrestationsForTask()` se
// comporte exactement comme avant (aucun appelant existant ne casse). Seules les lignes de statut
// "Agent" peuvent porter un badge (cf. docs/regles-de-travail.md, section badge) — un outil
// Utilitaire nommé ou Infrastructure référencé dans `outils` ne déclenche jamais cette vérification.
function badgeWarningsForOutils(outils, onboardingContext) {
  if (!onboardingContext?.toolsTableMarkdown) return [];
  const rows = parseToolsTable(onboardingContext.toolsTableMarkdown);
  const warnings = [];
  for (const outil of outils) {
    const primaryName = outil.split(/[/(]/)[0].trim();
    const row = rows.find((r) => r.tool.toLowerCase().includes(primaryName.toLowerCase()) || primaryName.toLowerCase().includes(r.tool.toLowerCase()));
    if (!row || !CERTIFIABLE_STATUTS.includes(row.statut)) continue;
    const overrides = onboardingContext.agentOverrides?.[row.tool] ?? {};
    const result = checkAgentOnboarding(row.tool, { ...onboardingContext, ownKnowledge: row.statut !== CLASSIQUE_STATUT, ...overrides });
    if (!result.complet) warnings.push(`${row.tool} n'a pas son badge (${result.gaps.join(" ; ")})`);
  }
  return warnings;
}

export function suggestPrestationsForTask(taskLabel, prestations = PRESTATIONS, onboardingContext = null) {
  const taskWords = new Set(significantWords(taskLabel));
  if (!taskWords.size) return [];
  return prestations
    .map((p) => {
      const matched = [...new Set(significantWords(p.demande).filter((w) => taskWords.has(w)))];
      return { ...p, score: matched.length, matched, badgeWarnings: badgeWarningsForOutils(p.outils, onboardingContext) };
    })
    .filter((p) => p.score >= 2)
    .sort((a, b) => b.score - a.score);
}

export function findToolsMissingFromMenu(toolsTableMarkdown, prestations = PRESTATIONS) {
  const menuText = prestations.map((p) => p.outils.join(" ")).join(" ").toLowerCase();
  return parseToolsTable(toolsTableMarkdown)
    .filter(isMenuWorthy)
    .map((row) => row.tool.split(/[/(]/)[0].trim())
    .filter((primaryName) => !menuText.includes(primaryName.toLowerCase()));
}

// checkAgentOnboarding() — la « séance d'accueil du nouveau collaborateur » (2026-09-20, demande
// explicite de l'utilisateur : « le coordinateur a pour rôle également de s'assurer que tous les
// outils sont bien câblés entre eux [...] lors de l'arrivée d'un nouveau membre de l'équipe, il y a
// un check bien défini pour être sûr de le câbler avec tous les autres »). Formalise ce qui était
// fait à la main, de façon incomplète, à chaque nouvel Agent cette session (3 raccordements
// oubliés pour THE-DEEP-READER, retrouvés seulement après coup). Réutilise `parseToolsTable()`
// (lecture par nom de colonne, jamais par position — cf. le bug corrigé le même jour) et
// `PRESTATIONS`, jamais une seconde lecture de la table.
//
// Vérifie les points de câblage DÉCIDÉS pour un Agent (cf. définition du statut Agent ci-dessus,
// docs/regles-de-travail.md) : présence dans la table maîtresse, présence dans le menu PRESTATIONS,
// instanciation (`docs/referentiel/<slug>.md`), registre (`docs/<slug>/`), et blueprint
// (`docs/<slug>-blueprint.md`) — sauf si l'agent est explicitement déclaré `cousinOf` un autre
// (seul cas actuel : THE-DEEP-READER, cousin de THE-FINAL-JUDGE). Jamais une vérification des
// TESTS eux-mêmes (check-house.mjs le fait déjà à chaque commit, aucune raison de le refaire ici).
export function slugifyAgentName(name) {
  return String(name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// CLASSIQUE_STATUT (2026-09-21, reclarification explicite : « membre certifié couvre les deux
// catégories ») : la valeur exacte attendue dans la colonne Statut de la table maîtresse pour un
// « Membre certifié (classique) » — LE-COORDINATEUR, CIRCLE-TASKS, route-booster, tool-brain.
// CERTIFIABLE_STATUTS regroupe les deux statuts éligibles au badge (Agent = connaissance propre,
// classique = sans), jamais recopié en dur ailleurs.
export const CLASSIQUE_STATUT = "Membre certifié (classique)";
export const CERTIFIABLE_STATUTS = ["Agent", CLASSIQUE_STATUT];

export function checkAgentOnboarding(agentName, {
  toolsTableMarkdown,
  prestations = PRESTATIONS,
  existingPaths = new Set(),
  cousinOf = null,
  registryPathPrefix = null,
  claudeMdText = null,
  suiviText = null,
  axaCoveragePct = undefined,
  argusFindingsCount = undefined,
  harmoniaFindingsCount = undefined,
  cleanDirtyOldFlagged = false,
  cloneHunterFindingsCount = undefined,
  lastVerifiedAt = null,
  hasDocReportDecision = undefined,
  reciprocalWiring = null,
  // ownKnowledge (2026-09-21, reclarification explicite de l'utilisateur : « il y a des membres
  // certifiés qui ont une connaissance propre au projet et d'autres qui n'en ont pas [...] oui ce
  // sont tous des membres certifiés, mais créons 2 catégories » puis « membre certifié couvre les
  // deux catégories »). Par défaut `true` (comportement inchangé pour tout Agent/Sage/Gardien déjà
  // couvert par les tests existants) : la connaissance propre au projet exige une instanciation, un
  // registre et un blueprint. `false` désigne un « Membre certifié (classique) » — LE-COORDINATEUR,
  // CIRCLE-TASKS, route-booster, tool-brain — qui n'a AUCUNE connaissance propre à documenter à
  // part (il appelle/agrège ce que d'autres outils disent déjà) : ces 3 exigences ne le concernent
  // jamais, il reste néanmois un vrai membre certifié badgé 🎖️, jamais un simple Utilitaire nommé.
  ownKnowledge = true,
} = {}) {
  assertNotAPersonnage(agentName, "checkAgentOnboarding()");
  const gaps = [];
  const slug = slugifyAgentName(agentName);
  const nameLower = agentName.toLowerCase();

  const tableRow = parseToolsTable(toolsTableMarkdown).find((row) => row.tool.toLowerCase().includes(nameLower));
  if (!tableRow) gaps.push("absent de la table maîtresse (docs/regles-de-travail.md, carte des outils)");

  // PRESTATIONS n'est requis QUE pour un outil "menu-worthy" (cf. isMenuWorthy(), même exemption que
  // findToolsMissingFromMenu()) — sans cette exemption, un outil de régulation interne à l'agent
  // (Smart Conso API, CHECK-LEVEL-TARGET) ressortait à tort comme un vrai manque, un faux positif
  // réel trouvé le 2026-09-20 en calibrant le badge ci-dessous contre les Agents existants.
  const inMenu = prestations.some((p) => p.outils.some((o) => o.toLowerCase().includes(nameLower)));
  if (!inMenu && (!tableRow || isMenuWorthy(tableRow))) gaps.push("absent du menu PRESTATIONS (scripts/le-coordinateur.mjs)");

  // Instanciation/registre/blueprint : exigés seulement pour un membre à connaissance propre au
  // projet (Sage/Gardien) — un « Membre certifié (classique) » (ownKnowledge: false) n'a par
  // définition rien de propre à documenter à part, ces 3 gaps ne le concernent jamais.
  const registryPrefix = registryPathPrefix ?? `docs/${slug}/`;
  if (ownKnowledge) {
    if (!existingPaths.has(`docs/referentiel/${slug}.md`)) gaps.push(`instanciation manquante (docs/referentiel/${slug}.md)`);

    // Registre : chemin standard docs/<slug>/, SAUF déviation explicitement déclarée (trouvaille
    // réelle en calibrant contre THE-DEEP-READER, dont le registre vit dans
    // docs/suivi/relectures-lourdes/ — jamais un chemin deviné, toujours déclaré par l'appelant).
    if (![...existingPaths].some((p) => p.startsWith(registryPrefix))) gaps.push(`registre manquant (${registryPrefix})`);

    if (!cousinOf && !existingPaths.has(`docs/${slug}-blueprint.md`)) {
      gaps.push(`blueprint manquant (docs/${slug}-blueprint.md) — si c'est volontaire (cousin d'un autre Agent), le déclarer via l'option cousinOf plutôt que de laisser ce point sans réponse`);
    }
  }

  // 6e type de gap (tâche #165, Doc-Report, 2026-09-21) : un nouvel outil qui produit un registre
  // mais n'a reçu AUCUNE décision HTML/texte enregistrée dans scripts/doc-report.mjs::REGISTRIES.
  // `undefined` (jamais vérifié) est distinct de `false` (vérifié et manquant) — même discipline que
  // axaCoveragePct ci-dessus, un appelant qui ne fournit pas cette info ne doit jamais fabriquer un
  // gap qu'il n'a pas réellement constaté.
  if (hasDocReportDecision === false) {
    gaps.push("aucune décision HTML/texte enregistrée pour ce nouvel outil (Doc-Report, scripts/doc-report.mjs::REGISTRIES) — à trancher explicitement, jamais un défaut silencieux");
  }

  // CLAUDE.md lui-même (2026-09-20, demande explicite de l'utilisateur : « fiabilise/enrichis ce
  // process [...] pour en tirer de vrais bénéfices ») — angle mort réel du premier jet : la table
  // maîtresse et PRESTATIONS étaient vérifiées, jamais CLAUDE.md, alors que c'est le document TOUJOURS
  // relu (Article 13) et que j'ai dû l'éditer à la main pour chaque nouvel Agent cette session.
  // Même dispense pour les 2 sous-vérifications CLAUDE.md liées à la connaissance propre : un
  // Membre certifié (classique) n'a ni bullet docs/referentiel/<slug>.md ni section blueprint —
  // il vit entièrement dans docs/regles-de-travail.md §7ter (cf. LE-COORDINATEUR/CIRCLE-TASKS).
  if (claudeMdText != null && ownKnowledge) {
    if (!claudeMdText.includes(`docs/referentiel/${slug}.md`)) {
      gaps.push("absent de la section « Référentiel technique » de CLAUDE.md (bullet docs/referentiel/<slug>.md)");
    }
    if (!cousinOf && !new RegExp(`^## .*${slug.replace(/-/g, "[- ]")}.*blueprint exportable`, "im").test(claudeMdText)) {
      gaps.push(`absent de CLAUDE.md comme section "## ... — blueprint exportable" (attendu puisqu'il a un blueprint propre)`);
    }
  }

  // docs/suivi/ (réel si le texte est fourni, jamais un chemin deviné en son absence) — un Agent
  // construit sans une seule ligne de suivi violerait la règle "toute tâche substantielle DOIT être
  // documentée dans docs/suivi/" (docs/systeme-de-suivi.md), au même titre qu'un test manquant.
  if (suiviText != null && !suiviText.toLowerCase().includes(nameLower)) {
    gaps.push("aucune mention trouvée dans docs/suivi/ — sa construction ne serait pas tracée dans le système de suivi durable");
  }

  // Câblage réciproque (2026-09-22, demande explicite de l'utilisateur : « je veux [...] celle qui
  // dit que l'agent-script est bien câblé avec tous les autres, et tous les autres sont bien câblés à
  // lui »). Généralise et rend mécanique le type de trou trouvé deux fois le même soir à l'arrivée de
  // CLONE-HUNTER comme Gardien (câblé dans le post-commit hook, oublié dans HYPER-SCAN-CHECKPOINT) :
  // les 6 vérifications ci-dessus regardent seulement "cet Agent existe-t-il aux bons endroits ?",
  // jamais "les AUTRES systèmes le mentionnent-ils réellement là où ils le devraient ?". L'appelant
  // fournit un tableau hétérogène de {label, ok} — le contenu exact dépend du type d'Agent (pour un
  // Gardien sacré : présence dans check-last-commit.mjs, dans hyper-scan-checkpoint.mjs, exclusion de
  // CIRCLE_ITEMS ; pour un Membre ordinaire : présence dans le menu PRESTATIONS, référence dans
  // organisation-agence.md) — checkAgentOnboarding() reste agnostique du détail, il ne fait
  // qu'agréger honnêtement ce que l'appelant a déjà vérifié. `null` (jamais fourni) reste silencieux,
  // jamais un gap fabriqué — même discipline que axaCoveragePct/claudeMdText ci-dessus.
  if (reciprocalWiring) {
    for (const { label, ok } of reciprocalWiring) {
      if (!ok) gaps.push(`câblage réciproque manquant : ${label}`);
    }
  }

  // Rappels : jamais vérifiables mécaniquement avec une confiance suffisante pour compter comme un
  // vrai "gap" (un faux positif serait pire qu'un oubli réel), mais des points RÉELLEMENT oubliés au
  // moins une fois cette session (THE-DEEP-READER) — toujours rendus, jamais un blocage.
  const rappels = [
    "Canaux de consultation documentés (qui peut déclencher cet Agent : moi, l'utilisateur, un autre outil ?) — cf. le modèle « Trois canaux de consultation » de THE-DEEP-READER dans docs/regles-de-travail.md.",
    "CASSANDRA-RH a-t-elle consigné ce nouvel Agent dans la liste de l'équipe (une fois CASSANDRA-RH construite) ?",
  ];

  // Badge (2026-09-20, demande explicite de l'utilisateur : « la remise de son badge [...] c'est
  // cassandra qui supervise ces opérations, le coordinateur vérifie que tous les membres de
  // l'équipe ont bien leur badge »). Jamais un fait persisté à part : le badge N'EST QUE le résumé
  // lisible de `complet`, recalculé à chaque appel — décision explicite de l'utilisateur (« photo
  // instantanée », jamais un acquis qui pourrait rester vrai après coup alors que l'état réel a
  // changé). Un Agent SANS ce badge est un signal d'anomalie à investiguer (cf. `rappels`
  // ci-dessus), jamais un verrou qui empêcherait l'Agent de fonctionner (Article 0 : rien ne doit
  // jamais bloquer le jeu réel pour une question d'outillage de travail). LE-COORDINATEUR est
  // aujourd'hui celui qui délivre ce badge de fait (CASSANDRA-RH n'existe pas encore) ; une fois
  // construite, elle affichera/consultera ce même résultat, jamais un second calcul indépendant.
  //
  // Catégorie (2026-09-22, demande explicite de l'utilisateur : « le badge de chaque employé de
  // l'agence codex mentionne la catégorie à laquelle il appartient »). Lue depuis la même source que
  // CASSANDRA-RH utilisera plus tard (`AGENT_CATEGORIES`, lib-shell.mjs — miroir de
  // docs/referentiel/organisation-agence.md), jamais une seconde classification recalculée ici.
  // `undefined` pour un Agent absent de cette table (oubli de mise à jour, ou script pas encore un
  // Agent statutaire) — affiché tel quel comme un signal d'écart, jamais masqué par une valeur par
  // défaut inventée.
  const category = AGENT_CATEGORIES[slug];
  const categoryLabel = category ? ` (${category})` : " (catégorie non répertoriée — à ajouter dans AGENT_CATEGORIES)";
  // « (classique) » (2026-09-21, reclarification explicite ci-dessus) : même icône 🎖️ pour tous les
  // membres certifiés — seule la mention textuelle distingue un Membre certifié (classique, sans
  // connaissance propre) d'un Sage/Gardien (icône supplémentaire propre à ces deux sous-catégories,
  // gérée dans la documentation, jamais recalculée ici).
  const badge = gaps.length === 0
    ? `🎖️ Membre certifié${ownKnowledge ? "" : " (classique)"}${categoryLabel}`
    : `⚠️ Pas encore certifié${categoryLabel}`;

  // Échelle de couverture à 3 niveaux (tâche #224, 2026-09-20T23:50Z, texte source reproduit à
  // l'identique par l'utilisateur) : « en cours » (jamais scanné/très faible), « partiel »
  // (couverture réelle incomplète), « OK 100% ». Jamais une promesse de "zéro bug" — AXA-CHECK ne
  // peut mécaniquement prouver qu'une ligne EXÉCUTÉE est une ligne JUSTE. Format du "partiel" précisé
  // le 2026-09-21 (tâche #226, retrouvé sur relecture explicite de l'utilisateur, jamais deviné) :
  // chaque vérification KO nommée séparément, jointes par une virgule quand plusieurs — un
  // pourcentage entre parenthèses UNIQUEMENT pour AXA-CHECK (seul signal chiffré ; ARGUS/HARMONIA/
  // CLEAN-DIRTY-OLD restent binaires, jamais un KO nu accompagné d'un faux pourcentage). « OK 100% »
  // exige les 5 Gardiens sacrés du code (Article 20) au vert ensemble — AXA-CHECK 100%, zéro
  // trouvaille ARGUS, zéro trouvaille HARMONIA, zéro signal CLEAN-DIRTY-OLD, zéro trouvaille
  // CLONE-HUNTER — jamais un sous-ensemble de 4 sur 5 (déjà corrigé une première fois le 2026-09-21
  // quand le premier jet oubliait CLEAN-DIRTY-OLD, puis une seconde fois le même soir à l'arrivée de
  // CLONE-HUNTER comme 5e Gardien — même défaut structurel à chaque fois : un nouveau Gardien doit
  // systématiquement rejoindre CETTE liste, jamais seulement le post-commit hook). Distinct du badge
  // lui-même (jamais conditionné par la couverture).
  const koParts = [];
  if (argusFindingsCount) koParts.push("KO ARGUS");
  if (harmoniaFindingsCount) koParts.push("KO HARMONIA");
  if (cleanDirtyOldFlagged) koParts.push("KO CLEAN-DIRTY-OLD");
  if (cloneHunterFindingsCount) koParts.push("KO CLONE-HUNTER");
  if (axaCoveragePct != null && axaCoveragePct < 100) koParts.push(`KO AXA-CHECK ${Math.round(axaCoveragePct)}%`);

  const couvertureTier = axaCoveragePct == null ? "en cours" : koParts.length === 0 ? "OK 100%" : "partiel";
  const couvertureLabel = couvertureTier === "en cours"
    ? "en cours (jamais scanné ou très faible)"
    : couvertureTier === "OK 100%"
      ? "OK 100%"
      : `partiel (${koParts.join(", ")})`;
  const couverture = { tier: couvertureTier, label: couvertureLabel };
  // Date de dernière vérification (2026-09-21, demande explicite) : jamais une donnée fabriquée —
  // seulement affichée quand l'appelant la fournit réellement (moment du scan AXA-CHECK/ARGUS/
  // HARMONIA/CLEAN-DIRTY-OLD ayant produit ces chiffres), jamais devinée ni datée du jour courant.
  const verifiedSuffix = lastVerifiedAt ? ` (vérifié le ${lastVerifiedAt})` : "";

  // Message (2026-09-22, demande explicite de l'utilisateur : « je veux toutes les validations,
  // surtout celle qui dit que l'agent-script est bien câblé avec tous les autres [...] et ses
  // prestations figurent bien au catalogue du coordinateur »). Remplace l'ancienne liste FIXE
  // ("blueprint, instanciation, registre, mention CLAUDE.md, présence PRESTATIONS", toujours
  // affichée à l'identique quels que soient les paramètres réellement fournis) par une énumération
  // CONSTRUITE à partir de ce qui a été réellement vérifié — même discipline que le reste de la
  // fonction (`undefined`/`null` = jamais vérifié, jamais listé comme si ça l'avait été).
  const validations = ["table maîtresse (docs/regles-de-travail.md §7ter)"];
  if (inMenu) validations.push("entrée PRESTATIONS (catalogue LE-COORDINATEUR)");
  if (ownKnowledge) {
    validations.push(`instanciation (docs/referentiel/${slug}.md)`);
    validations.push(`registre (${registryPrefix})`);
    validations.push(cousinOf ? `blueprint (cousin de ${cousinOf})` : `blueprint (docs/${slug}-blueprint.md)`);
  }
  if (claudeMdText != null && ownKnowledge) validations.push("mention CLAUDE.md");
  if (suiviText != null) validations.push("trace docs/suivi/");
  if (hasDocReportDecision != null) validations.push("décision Doc-Report (HTML/texte)");
  if (reciprocalWiring) {
    for (const { label, ok } of reciprocalWiring) if (ok) validations.push(label);
  }
  const message = `🎖️ ${agentName} obtient son badge — toutes les validations réunies : ${validations.join(", ")}. Couverture de code : ${couvertureLabel}${verifiedSuffix}.`;

  // description/companions (2026-09-21, demande explicite de l'utilisateur pour fiabiliser le
  // gabarit du bloc de certification : « une courte description, savoir si tout est bien pluggé,
  // savoir aussi avec quels outils cet outil est susceptible de se plugger », même format assuré à
  // chaque fois) — jamais une 2e donnée hand-maintained : `description` vient de la colonne "Ce
  // qu'il détecte/régule" déjà présente dans la table maîtresse (tableRow, jamais fabriquée si la
  // ligne ou la colonne est absente), `companions` de toolCompanions() sur le catalogue PRESTATIONS
  // déjà fourni à cette fonction (jamais un second catalogue).
  const description = tableRow?.description || undefined;
  const companions = toolCompanions(agentName, prestations);

  return { agentName, slug, gaps, rappels, badge, complet: gaps.length === 0, couverture, message, description, companions };
}

// Cérémonie de certification (2026-09-21, demande explicite de l'utilisateur : « quand tu affiches
// "membre certifié" tu ne donnes pas l'état des infos du badge ni l'icône badge [...] le moment de
// l'intégration doit être bien repérable [...] imagine un système autour de ce moment pour que je
// sois bien informé »). Trois choix calibrés explicitement : un bloc visuellement à part (jamais
// mêlé au reste du compte rendu), déclenché SEULEMENT la première fois qu'un Agent devient certifié
// (jamais répété à chaque mention ultérieure du même badge), via une petite fonction dédiée plutôt
// qu'une habitude d'écriture non vérifiable. Qui délivre le badge reste déjà tranché ailleurs
// (§"Le badge" ci-dessus, docs/regles-de-travail.md) : LE-COORDINATEUR aujourd'hui, CASSANDRA-RH en
// consultation/affichage une fois construite — cette cérémonie ne change rien à cette règle, elle
// rend seulement le moment VISIBLE.
//
// `loadBadgeCeremonyHistory()` réutilise `loadJson()` de tool-usage.mjs (jamais une 4e copie — la
// duplication exacte que CLONE-HUNTER venait de trouver ce même soir entre smart-conso-api.mjs et
// smart-conso-token.mjs). Journal local, jamais committé (`.badge-ceremony-history.json`, déclaré
// dans .gitignore et dans Doc-Report LOCAL_JOURNALS), qui ne retient qu'UNE date par agent : la
// première fois où `complet` a été vu vrai — jamais mis à jour ensuite, exactement ce qui permet de
// détecter mécaniquement "première fois" plutôt que de compter sur ma seule mémoire de session.
export function loadBadgeCeremonyHistory(historyPath = BADGE_CEREMONY_HISTORY_PATH) {
  return loadJson(historyPath, { certifications: {} });
}

export function hasBeenCertifiedBefore(slug, history) {
  return Boolean(history?.certifications?.[slug]);
}

export function recordCertification(slug, now = Date.now(), historyPath = BADGE_CEREMONY_HISTORY_PATH) {
  const history = loadBadgeCeremonyHistory(historyPath);
  history.certifications = history.certifications ?? {};
  if (!history.certifications[slug]) history.certifications[slug] = new Date(now).toISOString();
  writeFileSync(historyPath, JSON.stringify(history, null, 1));
  return history;
}

// Le bloc lui-même : toujours visuellement séparé (bordures ASCII, jamais une phrase noyée dans un
// paragraphe), reprend tel quel le `message` déjà produit par checkAgentOnboarding() (jamais une
// seconde formulation qui pourrait diverger) plus le badge et la couverture en évidence.
// Gabarit fiabilisé (2026-09-21, demande explicite de l'utilisateur : « fiabilise le gabarit du
// bloc certification : même format assuré à chaque fois : j'ai besoin d'une courte description, de
// savoir si tout est bien pluggé, de savoir aussi avec quels outils cet outil est susceptible de se
// plugger ») — 3 lignes garanties dans CET ORDRE à chaque annonce, jamais un sous-ensemble variable
// selon ce qui a été calculé cette fois-là. Une absence réelle de donnée reste dite explicitement
// (« non renseignée », « aucune connue ») — jamais une ligne simplement omise, qui laisserait croire
// que la question n'a pas été posée.
export function formatBadgeCeremonyAnnouncement(result) {
  const border = "━".repeat(Math.max(20, result.agentName.length + 20));
  return [
    border,
    `🎖️ CERTIFICATION — ${result.agentName}`,
    border,
    `Description : ${result.description || "non renseignée (colonne « Ce qu'il détecte/régule » absente de la table maîtresse)"}`,
    `Câblage : ${result.message}`,
    `Statut : ${result.badge}`,
    `Combine typiquement avec : ${result.companions?.length ? result.companions.join(", ") : "aucune combinaison connue dans le catalogue PRESTATIONS"}`,
    `Couverture : ${result.couverture.label}`,
    border,
  ].join("\n");
}

// Point d'entrée unique à appeler après checkAgentOnboarding() : ne produit le bloc que si
// `complet` est vrai ET que ce n'est jamais arrivé avant pour ce slug — sinon `null` (rien à
// annoncer), jamais un bloc vide affiché quand même. Persiste la première certification au passage.
export function announceBadgeCeremony(result, { historyPath = BADGE_CEREMONY_HISTORY_PATH, now = Date.now() } = {}) {
  if (!result?.complet) return null;
  const history = loadBadgeCeremonyHistory(historyPath);
  if (hasBeenCertifiedBefore(result.slug, history)) return null;
  recordCertification(result.slug, now, historyPath);
  return formatBadgeCeremonyAnnouncement(result);
}

// checkAllAgentBadges() (2026-09-22, demande explicite de l'utilisateur : « tu crées un petit script
// pour gérer toute cette partie validation/intégration/badge/message [...] avec déclenchement auto
// quand le script reçoit son badge réellement dans le code »). Décision explicite prise avec
// l'utilisateur : jamais un nouveau fichier séparé — LE-COORDINATEUR porte déjà `checkAgentOnboarding()`
// et `announceBadgeCeremony()`, cette fonction ne fait que balayer TOUTE la table maîtresse plutôt que
// de dépendre d'un appel manuel outil par outil (ce que `badgeWarningsForOutils()` ci-dessus fait déjà,
// mais seulement pour les outils cités dans UNE prestation précise, jamais pour l'ensemble).
// `onboardingContext` suit exactement la même forme que `checkAgentOnboarding()` (mêmes clés,
// `agentOverrides` inclus) — le vrai rassemblement des données (CLAUDE.md, docs/suivi, couverture
// AXA-CHECK par script, câblage réciproque des Gardiens) reste la responsabilité de l'appelant
// (`scripts/hooks/check-last-commit.mjs`), jamais de cette fonction elle-même : elle reste pure et
// testable sans toucher au disque, exactement comme `checkAgentOnboarding()`.
// `primaryName` (2026-09-21, bug réel trouvé en fiabilisant CASSANDRA-RH le même soir) : passer
// `row.tool` BRUT à checkAgentOnboarding() slugifiait le texte ENTIER de la cellule Outil, y compris
// une précision entre parenthèses ("CASSANDRA-RH (scripts/cassandra-rh.mjs)", "CLONE-HUNTER
// (`scripts/clone-hunter.mjs`)") — produisant un slug jamais présent dans AGENT_CATEGORIES ni sur le
// disque, donc `complet:false` à tort pour TOUT Agent dont la cellule Outil porte une précision
// entre parenthèses, jamais annoncé même une fois réellement complet. Même découpage déjà établi
// ailleurs dans ce fichier (badgeWarningsForOutils(), findToolsMissingFromMenu()) — jamais une
// troisième règle divergente. `agentOverrides` est également indexé par ce nom propre, jamais la
// cellule brute (buildRealOnboardingContext() déclare ses overrides par nom propre, ex.
// "THE-DEEP-READER").
export function checkAllAgentBadges(onboardingContext, { historyPath = BADGE_CEREMONY_HISTORY_PATH, now = Date.now() } = {}) {
  if (!onboardingContext?.toolsTableMarkdown) return [];
  const rows = parseToolsTable(onboardingContext.toolsTableMarkdown).filter((r) => CERTIFIABLE_STATUTS.includes(r.statut));
  const announcements = [];
  for (const row of rows) {
    const primaryName = row.tool.split(/[/(]/)[0].trim();
    const overrides = onboardingContext.agentOverrides?.[primaryName] ?? {};
    let result;
    try {
      result = checkAgentOnboarding(primaryName, { ...onboardingContext, ownKnowledge: row.statut !== CLASSIQUE_STATUT, ...overrides });
    } catch {
      continue; // garde-fou Personnage ou nom malformé — jamais un balayage cassé pour un seul outil
    }
    const announcement = announceBadgeCeremony(result, { historyPath, now });
    if (announcement) announcements.push(announcement);
  }
  return announcements;
}

// Passthrough vers CHECK-LEVEL-TARGET (accès "privilégié" direct, jamais une réimplémentation) —
// à appeler explicitement par l'agent pour classer UNE demande précise ; jamais invoqué tout seul
// dans runNetworkCheck() ci-dessous, qui n'a pas de texte de demande à classer. Même signature que
// classifyCheckLevel() elle-même (un seul paramètre) — la pression de registre et les nœuds
// sensibles récents restent la responsabilité de check-level-target.mjs (combineWithRegistryPressure/
// recentlyChangedSensitiveNodes), jamais dupliqués ici.
export function classifyRequest(requestText) {
  return classifyCheckLevel(requestText);
}

export function runNetworkCheck({ shImpl = sh } = {}) {
  const head = currentHead();
  const state = loadState();
  const duplicate = isDuplicateRun(state, head);
  const now = new Date().toISOString();
  const rows = [];

  // Un seul lancement de check-house.mjs, dont la couverture V8 nourrit AXA-CHECK — jamais un
  // second run (règle anti-doublon, §7ter), exactement le même principe que kpi-report.mjs.
  const covDir = mkdtempSync(join(tmpdir(), "coordinateur-cov-"));
  const testOut = shImpl("node scripts/check-house.mjs 2>&1", { cwd: ROOT, env: { ...process.env, NODE_V8_COVERAGE: covDir } });
  const testsOk = !/AssertionError/.test(testOut);
  rows.push({ name: "check-house.mjs (suite de tests)", result: testsOk ? "ok" : "⚠️ à regarder", when: now });

  let coverageScore;
  try {
    const perFile = collectCoverage(covDir);
    coverageScore = robustnessScore(Object.values(perFile).flat());
  } finally {
    rmSync(covDir, { recursive: true, force: true });
  }
  rows.push({ name: "AXA-CHECK (couverture réelle par fonction)", result: coverageScore === undefined ? "N/A" : `${Math.round(coverageScore)}%`, when: now });

  const argusOut = shImpl("node scripts/check-argus.mjs", { cwd: ROOT });
  const argusSummary = summarizeArgusOutput(argusOut);
  rows.push({ name: "ARGUS (mécanique)", result: argusSummary.candidatsDetectes > 0 ? `à regarder (${argusSummary.candidatsDetectes} candidat(s))` : "ok", when: now });

  const harmoniaOut = shImpl("node scripts/check-harmonia.mjs", { cwd: ROOT });
  const harmoniaSummary = summarizeHarmoniaOutput(harmoniaOut);
  rows.push({ name: "HARMONIA (mécanique)", result: harmoniaSummary.frictions ? `à regarder (${harmoniaSummary.frictions} friction(s))` : "ok", when: now });

  const alwaysNewCodeIndexText = existsSync(ALWAYS_NEW_CODE_INDEX) ? readFileSync(ALWAYS_NEW_CODE_INDEX, "utf8") : "";
  const zone = recommendZone(THEMES, parseCoverage(alwaysNewCodeIndexText));
  rows.push({ name: "ALWAYS-NEW-CODE (préparation)", result: `zone recommandée : ${zone.zone}`, when: now });

  const lastTouchByFile = Object.fromEntries(Object.values(LIB_MAP).map((f) => [f, lastTouchDays(f)]));
  const staleness = relativeStaleness(lastTouchByFile);
  const staleCount = Object.values(staleness).filter((s) => s.stale).length;
  rows.push({ name: "CLEAN-DIRTY-OLD (repérage seul)", result: staleCount > 0 ? `à regarder (${staleCount} zone(s) stagnante(s))` : "ok", when: now });

  // Trouvaille réelle du 2026-09-19 : l'agent n'avait jamais consulté Smart Conso API avec
  // --confirm avant une action coûteuse. Ce garde-fou compare l'activité réelle déjà enregistrée
  // (.gemini-key-health.json) au carnet de session — sans dépendre de l'agent qui pense à le lancer.
  const healthPath = join(ROOT, ".gemini-key-health.json");
  const sessionPath = join(ROOT, ".smart-conso-session.json");
  const healthData = existsSync(healthPath) ? JSON.parse(readFileSync(healthPath, "utf8")) : { keys: {} };
  const sessionLog = existsSync(sessionPath) ? JSON.parse(readFileSync(sessionPath, "utf8")) : { actions: [] };
  const unconfirmedBursts = findUnconfirmedBursts(healthData, sessionLog);
  rows.push({ name: "Smart Conso API (salves jamais confirmées)", result: unconfirmedBursts.length > 0 ? `à regarder (${unconfirmedBursts.length} salve(s))` : "ok", when: now });

  // Rythme SMART-CONSO-TOKEN (2026-09-20, demande explicite de l'utilisateur : « le coordinateur
  // doit être rapproché de smart-conso-token pour veiller sur ce point »). Même principe que la
  // ligne Smart Conso API ci-dessus : un simple affichage du rythme récent, jamais un jugement — la
  // lecture reste toujours humaine/agent.
  const tokenHistoryPath = join(ROOT, ".smart-conso-token-history.json");
  const tokenHistory = existsSync(tokenHistoryPath) ? JSON.parse(readFileSync(tokenHistoryPath, "utf8")) : { actions: [] };
  const tokenSummary = summarizeHistory(tokenHistory, Date.now());
  rows.push({ name: "SMART-CONSO-TOKEN (rythme 7 derniers jours)", result: `${tokenSummary.totalRecent} action(s) — ${JSON.stringify(tokenSummary.byType)}`, when: now });

  // Autorité réelle sur THE-FINAL-JUDGE/THE-DEEP-READER (tâche #137, 2026-09-21 : « auditer et
  // fiabiliser l'exploitation de Smart Conso API/SMART-CONSO-TOKEN partout où la charte l'exige »).
  // findJudgeSpawnsWithoutConsultation() existait déjà, entièrement testé par fixtures, mais n'était
  // jamais appelé nulle part en production — exactement le même angle mort que les deux items
  // "Passages réels" ajoutés à CIRCLE-TASKS plus tôt ce soir. Compare chaque passage RÉELLEMENT
  // archivé (preuve externe et vérifiable) à l'historique local de consultation SMART-CONSO-TOKEN.
  const judgeIndexPath = join(ROOT, "docs/the-final-judge/index.md");
  const judgeIndex = existsSync(judgeIndexPath) ? readFileSync(judgeIndexPath, "utf8") : "";
  const judgeMissing = findJudgeSpawnsWithoutConsultation(judgeIndex, tokenHistory);
  rows.push({ name: "SMART-CONSO-TOKEN (spawns THE-FINAL-JUDGE sans consultation confirmée)", result: judgeMissing.length ? `à regarder (${judgeMissing.length} : ${judgeMissing.join(", ")})` : "ok", when: now });

  const deepReaderIndexPath = join(ROOT, "docs/suivi/relectures-lourdes/index.md");
  const deepReaderIndex = existsSync(deepReaderIndexPath) ? readFileSync(deepReaderIndexPath, "utf8") : "";
  const deepReaderMissing = findJudgeSpawnsWithoutConsultation(deepReaderIndex, tokenHistory);
  rows.push({ name: "SMART-CONSO-TOKEN (spawns THE-DEEP-READER sans consultation confirmée)", result: deepReaderMissing.length ? `à regarder (${deepReaderMissing.length} : ${deepReaderMissing.join(", ")})` : "ok", when: now });

  saveState({ lastHead: head, lastWhen: now });
  return { duplicate, previousRun: state, rows };
}

function main() {
  // Sous-commande "catalogue" (tâche #154) : sur demande seulement, jamais mêlée à la synthèse
  // gratuite ci-dessous — `node scripts/le-coordinateur.mjs catalogue`.
  if (process.argv[2] === "catalogue") {
    const result = recordCatalog();
    console.log("=== LE-COORDINATEUR — catalogue d'offres nommé ===\n");
    console.log(renderNamedCatalog());
    console.log("");
    console.log(result.written ? `✅ Nouvelle version archivée : docs/le-coordinateur-catalogue/${result.fileName}` : `ℹ️  ${result.message}`);
    return;
  }

  const { duplicate, previousRun, rows } = runNetworkCheck();
  if (duplicate) {
    console.log(`⏭️  Aucun commit nouveau depuis le dernier passage complet (${previousRun.lastWhen}) — relancé quand même, purement informatif.\n`);
  }
  console.log("=== LE-COORDINATEUR — synthèse gratuite du réseau d'outils ===\n");
  console.log(formatTable(rows));
  console.log("\nCeci reste un tableau de synthèse, jamais un verdict : relire la sortie complète de l'outil concerné avant d'agir sur une ligne \"à regarder\" (cf. docs/regles-de-travail.md, aucun de ces outils n'est autonome).");
  console.log("Jamais déclenché ici : HYPER-SCAN-CHECKPOINT (version complète), Smart Conso API, ou une simulation — toujours une décision explicite séparée, jamais une initiative du coordinateur.");
  console.log("\n=== Menu des prestations disponibles via le réseau d'outils ===\n");
  console.log(formatMenu());
  console.log("\nRappel ouvert à chaque passage automatique (demande explicite de l'utilisateur) : ce menu n'exécute rien tout seul — il rappelle ce qui PEUT être commandé, à l'agent comme à l'utilisateur à travers lui.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
