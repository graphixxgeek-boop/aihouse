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

import { existsSync, mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { sh } from "./lib-shell.mjs";
import { collectCoverage, robustnessScore, LIB_MAP } from "./axa-check.mjs";
import { summarizeArgusOutput, summarizeHarmoniaOutput } from "./hyper-scan-checkpoint.mjs";
import { THEMES, parseCoverage, recommendZone } from "./always-new-code.mjs";
import { classifyCheckLevel } from "./check-level-target.mjs";
import { lastTouchDays, relativeStaleness } from "./clean-dirty-old.mjs";
import { findUnconfirmedBursts } from "./smart-conso-api.mjs";
import { summarizeHistory } from "./smart-conso-token.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
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
export const PRESTATIONS = [
  { demande: "Vérification rapide après un changement de code", outils: ["check-house.mjs", "ARGUS (mécanique)", "HARMONIA (mécanique)"], cout: "gratuit, déjà automatique — 0 token, 0 appel API" },
  { demande: "Fidélité de l'esprit des personnages (Article 0)", outils: ["EL-PROFESSOR"], cout: "gratuit (relit un texte déjà produit) — 0 appel API, coût token = taille du texte relu" },
  { demande: "Diagnostic direct du ton face à une provocation réelle", outils: ["check-spirit.mjs"], cout: "réel (API Gemini, 16 scénarios) — consulter Smart Conso API avant" },
  { demande: "Qualité visuelle du rendu", outils: ["THE-SCREENER"], cout: "réel (Playwright, léger) — pas d'agent séparé, coût token faible" },
  { demande: "Dette technique / code qui s'empile plutôt que d'être pensé", outils: ["ALWAYS-NEW-CODE", "CLEAN-DIRTY-OLD"], cout: "réel (raisonnement, pas d'appel API) — consulter SMART-CONSO-TOKEN avant (ALWAYS-NEW-CODE seulement, CLEAN-DIRTY-OLD délègue sans raisonner)" },
  { demande: "Robustesse et couverture de test réelle", outils: ["AXA-CHECK"], cout: "gratuit — 0 token, 0 appel API" },
  { demande: "Chasse aux bugs cachés avant une étape importante", outils: ["HYPER-SCAN-CHECKPOINT"], cout: "réel — version légère gratuite ; version complète = ~37k tokens fixes (agent séparé) + appels Gemini — consulter Smart Conso API ET SMART-CONSO-TOKEN avant" },
  { demande: "Audit global indépendant (code + produit + reprise potentielle)", outils: ["THE-FINAL-JUDGE"], cout: "réel — ~37k tokens fixes par appel (agent séparé, quasi le même quel que soit le palier d'intensité) — consulter Smart Conso API ET SMART-CONSO-TOKEN avant" },
  { demande: "Sécurité et préparation à la mise en production", outils: ["THE-FINAL-JUDGE (mandat sécurité inclus)"], cout: "réel — ~37k tokens fixes (agent séparé) — consulter Smart Conso API ET SMART-CONSO-TOKEN avant" },
  { demande: "Vérifier qu'aucune idée/tâche n'a été oubliée dans le suivi (relecture lourde, agent séparé)", outils: ["THE-DEEP-READER"], cout: "réel — ~37k tokens fixes minimum (agent séparé) + volume réel de conversation à relire, jamais un chiffre fixe comme THE-FINAL-JUDGE — consulter Smart Conso API ET SMART-CONSO-TOKEN avant, préférer d'abord la version légère gratuite (docs/systeme-de-suivi.md)" },
  { demande: "Diagnostiquer un blocage/quota Gemini épuisé (429/503 répétés)", outils: ["Smart Breaker (check-gemini-quota.mjs)"], cout: "gratuit à diagnostiquer — quelques appels Gemini minimaux, coût token négligeable" },
  { demande: "Réguler ma propre consommation de tokens avant une action coûteuse", outils: ["SMART-CONSO-TOKEN"], cout: "gratuit à consulter — 0 token, 0 appel API" },
  { demande: "Lancer la ronde périodique des tâches gratuites mal automatisées (profil, référentiels, KPI, ALWAYS-NEW-CODE, correctifs, scans Smart Conso API/SMART-CONSO-TOKEN, photo de la dream team, THE-SCREENER)", outils: ["CIRCLE-TASKS"], cout: "gratuit — sauf si THE-FINAL-JUDGE (visible dans la même fenêtre, ⚠️🔴) est explicitement coché : alors ~37k tokens fixes" },
  { demande: "État des lieux des tâches en cours (zoom + liste ou arborescence détaillée), rapport HTML", outils: ["check-tasks-details"], cout: "gratuit — lecture seule de docs/suivi/, 0 appel API, coût token = taille du suivi relu" },
  { demande: "Classer les Articles de CLAUDE.md par sensibilité/importance, repérer une redondance possible avant un allègement", outils: ["CLAUDE.MD.SPY (extension de SMART-CONSO-TOKEN)"], cout: "gratuit — relit CLAUDE.md et le reste du dépôt, 0 appel API" },
];

export function formatMenu(prestations = PRESTATIONS) {
  const lines = ["| Si tu veux... | Ça déclenche | Coût |", "|---|---|---|"];
  for (const p of prestations) lines.push(`| ${p.demande} | ${p.outils.join(" + ")} | ${p.cout} |`);
  return lines.join("\n");
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
export function parseToolsTable(markdown) {
  const lines = markdown.split("\n").filter((l) => l.trim().startsWith("|"));
  if (!lines.length) return [];
  const headerCells = lines[0].split("|").slice(1, -1).map((c) => c.trim());
  const coutIdx = headerCells.indexOf("Coût");
  const declenchementIdx = headerCells.indexOf("Déclenchement");
  const statutIdx = headerCells.indexOf("Statut");
  if (coutIdx === -1 || declenchementIdx === -1) return [];
  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length <= Math.max(coutIdx, declenchementIdx)) continue;
    const tool = cells[0];
    if (!tool || tool === "Outil" || /^-+$/.test(tool)) continue;
    const statut = statutIdx !== -1 ? cells[statutIdx] : null;
    rows.push({ tool: tool.replace(/`/g, ""), cout: cells[coutIdx], declenchement: cells[declenchementIdx], statut });
  }
  return rows;
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

function significantWords(text) {
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
    if (!row || row.statut !== "Agent") continue;
    const overrides = onboardingContext.agentOverrides?.[row.tool] ?? {};
    const result = checkAgentOnboarding(row.tool, { ...onboardingContext, ...overrides });
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

export function checkAgentOnboarding(agentName, {
  toolsTableMarkdown,
  prestations = PRESTATIONS,
  existingPaths = new Set(),
  cousinOf = null,
  registryPathPrefix = null,
  claudeMdText = null,
  suiviText = null,
} = {}) {
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

  if (!existingPaths.has(`docs/referentiel/${slug}.md`)) gaps.push(`instanciation manquante (docs/referentiel/${slug}.md)`);

  // Registre : chemin standard docs/<slug>/, SAUF déviation explicitement déclarée (trouvaille
  // réelle en calibrant contre THE-DEEP-READER, dont le registre vit dans
  // docs/suivi/relectures-lourdes/ — jamais un chemin deviné, toujours déclaré par l'appelant).
  const registryPrefix = registryPathPrefix ?? `docs/${slug}/`;
  if (![...existingPaths].some((p) => p.startsWith(registryPrefix))) gaps.push(`registre manquant (${registryPrefix})`);

  if (!cousinOf && !existingPaths.has(`docs/${slug}-blueprint.md`)) {
    gaps.push(`blueprint manquant (docs/${slug}-blueprint.md) — si c'est volontaire (cousin d'un autre Agent), le déclarer via l'option cousinOf plutôt que de laisser ce point sans réponse`);
  }

  // CLAUDE.md lui-même (2026-09-20, demande explicite de l'utilisateur : « fiabilise/enrichis ce
  // process [...] pour en tirer de vrais bénéfices ») — angle mort réel du premier jet : la table
  // maîtresse et PRESTATIONS étaient vérifiées, jamais CLAUDE.md, alors que c'est le document TOUJOURS
  // relu (Article 13) et que j'ai dû l'éditer à la main pour chaque nouvel Agent cette session.
  if (claudeMdText != null) {
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
  const badge = gaps.length === 0 ? "🎖️ Membre certifié" : "⚠️ Pas encore certifié";

  return { agentName, slug, gaps, rappels, badge, complet: gaps.length === 0 };
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

  saveState({ lastHead: head, lastWhen: now });
  return { duplicate, previousRun: state, rows };
}

function main() {
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
