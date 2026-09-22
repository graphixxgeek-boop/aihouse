// memory-audit (surnom, 2026-09-21 — remplace le nom "MEMENTO", retiré de la documentation à la
// demande explicite de l'utilisateur une fois son rôle mieux compris : « memento audite la
// capacité des persos sur la memoire, ce n'est pas un outil de la gestion directe de la memoire
// dans le jeu [...] donc oui, il fait bien partie de l'equipe aux cotés de el professor »). Nom de
// fichier technique inchangé (`scripts/memento.mjs`) — même discipline que Smart Breaker, jamais
// de renommage de fichier pour un simple changement de surnom affiché.
//
// Rôle exact, confirmé le même soir : un Membre de l'équipe (Outillage de travail, structurellement
// identique à `check-argus.mjs`), catégorie "audit de simulation" aux côtés d'EL-PROFESSOR — jamais
// un second appel Gemini, jamais un jugement sur ce qui EST dit, seulement sur la structure des
// données persistées (`lib/life.ts`) qui nourrissent chaque tour.
//
// Ce fichier ne couvre plus QUE ce rôle. Le second volet de l'initiative d'origine (mesurer le
// poids réel du contexte envoyé à Gemini par tour) est un artefact de nature différente — vit dans
// `scripts/memento-weight.mjs` (partie outillage) + `lib/memento-weight.ts` (partie moteur du jeu,
// câblée dans lib/lia.ts) — jamais réuni ici, pour que ce fichier reste lisible comme un seul sujet
// (cf. docs/referentiel/memory-audit.md et docs/referentiel/memento-weight.md).
//
// Investigation préalable (Article 19, 2026-09-21, agent séparé) : le stockage de `Life`
// (lib/life.ts) est déjà rigoureusement plafonné — chaque tableau porte une limite explicite
// (`.slice(-12)`, `.slice(0,300)`, etc.) directement dans `readLife()`. Ce fichier n'a donc AUCUNE
// raison de refaire ce travail de plafonnage. Ce qui manque réellement, confirmé par
// l'investigation : aucune vérification mécanique n'existe que ces données plafonnées restent
// VRAIMENT cohérentes dans le temps (ordre chronologique, remise à zéro suspecte, régression de
// gravité).

// --- Cohérence mécanique de la mémoire ------------------------------------------------------------

// Vérifie qu'une liste d'entrées portant un numéro de round réel (bonusLog, negotiationLog,
// contacts...) reste dans l'ordre chronologique où elle s'est VRAIMENT produite — un mélange serait
// le signe d'un bug de sauvegarde (tableau réordonné par erreur), jamais un jugement sur le contenu
// lui-même. `getRound` accepte aussi bien un tableau d'objets `{round}` (bonusLog, negotiationLog)
// qu'un tableau de nombres bruts (contacts) — même fonction, jamais deux vérifications séparées
// pour une seule et même règle.
import { reliabilityNotice } from "./lib-shell.mjs";
import { renderTextReport } from "./report-template.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

export function checkChronologicalOrder(entries, getRound = (e) => (typeof e === "number" ? e : e?.round)) {
  const violations = [];
  for (let i = 1; i < entries.length; i++) {
    const previousRound = getRound(entries[i - 1]);
    const currentRound = getRound(entries[i]);
    if (typeof previousRound === "number" && typeof currentRound === "number" && currentRound < previousRound) {
      violations.push({ index: i, previousRound, currentRound });
    }
  }
  return violations;
}

// Détecte une remise à zéro suspecte d'un compteur persistant (wordFrequency/themeFrequency) entre
// deux instantanés successifs de Life — exactement le type de bug déjà trouvé une fois ce soir sur
// l'attirance (loveRealized, cf. Plan d'origine de CLAUDE.md) : une valeur significative qui
// disparaît ou chute sans qu'aucun événement explicite ne le justifie. `threshold` : la valeur
// minimale pour qu'une chute compte comme suspecte, jamais un bruit de fond sur un compteur qui
// vient tout juste de démarrer (une chute de 1 à 0 n'a aucune valeur de signal).
export function detectSuspiciousCounterReset(previousCounters = {}, currentCounters = {}, { threshold = 3 } = {}) {
  const resets = [];
  for (const [key, previousValue] of Object.entries(previousCounters ?? {})) {
    if (typeof previousValue !== "number" || previousValue < threshold) continue;
    const currentValue = currentCounters?.[key];
    if (typeof currentValue !== "number" || currentValue < previousValue) {
      resets.push({ key, previousValue, currentValue: currentValue ?? 0 });
    }
  }
  return resets;
}

// Vérifie que `worstMoment` (le pire moment vécu par un personnage, lib/life.ts) ne redevient
// jamais moins grave avec le temps — la règle du jeu dit qu'il ne doit être remplacé que par un
// moment PLUS sévère (cf. commentaire lib/life.ts:129). Un recul serait le signe que le code
// d'écriture a été contourné ou cassé, jamais un jugement sur la sévérité elle-même.
export function detectWorstMomentRegression(previousWorstMoment, currentWorstMoment) {
  if (!previousWorstMoment || !currentWorstMoment) return null;
  if (currentWorstMoment.severity < previousWorstMoment.severity) {
    return {
      previousSeverity: previousWorstMoment.severity,
      currentSeverity: currentWorstMoment.severity,
      previousRound: previousWorstMoment.round,
      currentRound: currentWorstMoment.round,
    };
  }
  return null;
}

// Champs réellement porteurs d'un round dans lib/life.ts (cf. investigation Article 19) — tenue à
// la main, comme AGENT_SCRIPT_FILES d'axa-check.mjs : un futur champ de ce type ajouté à Life devra
// être ajouté ici explicitement, jamais deviné par une heuristique de nommage fragile.
const CHRONOLOGICAL_FIELDS = ["bonusLog", "negotiationLog", "contacts"];

// Agrège les trois vérifications confirmées (2026-09-21) sur un instantané de Life — `previousLife`
// (l'instantané précédent, pour les deux vérifications qui ont besoin d'une comparaison dans le
// temps) est optionnel : sans lui, seul l'ordre chronologique (vérifiable sur un seul instantané)
// est rapporté. Jamais une action automatique : un signal à lire, la même retenue que le reste du
// réseau d'outils (Smart Conso API, SMART-CONSO-TOKEN, THE-KING).
export function checkMemoryCoherence(life, previousLife = null) {
  const findings = [];
  for (const field of CHRONOLOGICAL_FIELDS) {
    const entries = life?.[field];
    if (!Array.isArray(entries) || entries.length < 2) continue;
    const violations = checkChronologicalOrder(entries);
    if (violations.length) findings.push({ type: "ordre_chronologique", champ: field, violations });
  }
  if (previousLife) {
    for (const field of ["wordFrequency", "themeFrequency"]) {
      const resets = detectSuspiciousCounterReset(previousLife[field], life?.[field]);
      if (resets.length) findings.push({ type: "remise_a_zero_suspecte", champ: field, resets });
    }
    const regression = detectWorstMomentRegression(previousLife.worstMoment, life?.worstMoment);
    if (regression) findings.push({ type: "regression_gravite", champ: "worstMoment", ...regression });
  }
  return findings;
}

// buildMemoryAuditReport() (2026-09-22, tâche #198) — memory-audit était le seul outil du registre
// à n'avoir AUCUNE forme de rapport : `checkMemoryCoherence()` rend un tableau d'objets, et c'est
// l'agent qui le racontait à sa façon, différemment à chaque fois. Or Doc-Report le déclare bien
// comme produisant un rapport « texte » (`REGISTRIES`) — un écart réel entre ce que le registre
// affirme et ce que le code sait faire, trouvé en câblant l'avertissement de fiabilité. Cette
// fonction donne donc à memory-audit la même forme de rapport que ses pairs, avec l'emplacement
// générique d'en-tête en premier : la phrase vient du registre partagé, jamais réécrite ici.
// memory-audit est une BIBLIOTHÈQUE, pas un script en ligne de commande : zéro console.log dans
// tout le fichier, son texte est construit ici puis imprimé par son appelant. C'est pour ça que
// pure-gold-unity le voyait « non conforme sans aucun indice de rédaction manuelle » — un cas que
// son propre message invitait à vérifier à la main plutôt qu'à trancher seul, et il avait raison de
// ne pas trancher : la bonne conversion n'est pas un en-tête imprimé (personne ne l'imprimerait),
// c'est le rendu partagé appliqué au texte produit (2026-09-22).
export function buildMemoryAuditReport(findings = []) {
  const lignes = [];
  if (!findings.length) {
    lignes.push("Aucune incohérence trouvée sur les champs audités — ce qui ne prouve pas qu'il n'y en a aucune (cf. l'avertissement ci-dessus), seulement qu'aucun des motifs surveillés ne s'est déclenché.");
  } else {
    lignes.push(`${findings.length} constat(s) à relire :`, "");
    for (const f of findings) lignes.push(`  · [${f.type}] champ "${f.champ}"${f.violations ? ` — ${f.violations.length} rupture(s) d'ordre` : ""}${f.resets ? ` — ${f.resets.length} remise(s) à zéro suspecte(s)` : ""}`);
  }
  return renderTextReport({
    tool: "memory-audit",
    scriptPath: "scripts/memento.mjs",
    title: "memory-audit — cohérence de la mémoire narrative persistée",
    blocks: [{ type: "note", text: lignes.join("\n") }],
  });
}

// LE POINT D'ENTRÉE, ABSENT JUSQU'AU 2026-09-23 — trouvé par la Ronde, et il ne s'agissait pas
// d'un détail de confort : `node scripts/memento.mjs` n'affichait RIEN DU TOUT. L'outil était
// construit, exporté, testé, inscrit dans la table maîtresse et dans l'inventaire de la charte —
// et personne ne pouvait le lancer. Un outil qu'aucune commande ne déclenche n'a jamais tourné
// contre le vrai dépôt, ce que l'Article 25 refuse explicitement d'appeler un outil vérifié.
//
// Même garde que le reste du paysage (`process.argv[1]` et `import.meta.url` sur la même ligne),
// jamais une variante de plus : c'est cette forme exacte que checkAgentOnboarding() recherche pour
// déclarer qu'un script a bien un point d'entrée.
// CE QUE CETTE COMMANDE PEUT ET NE PEUT PAS FAIRE, dit plutôt que masqué. memory-audit juge la
// cohérence d'une mémoire de personnage VIVANTE (un objet `Life` en cours de partie) : sans partie,
// il n'a rien à auditer. La tentation serait d'afficher « aucune incohérence détectée » — ce serait
// rendre une absence de mesure comme une mesure, le défaut que ce projet corrige partout ailleurs.
// Il annonce donc les trois états : ce qu'il vérifie, ce qu'il a trouvé, et pourquoi il ne trouve
// rien quand aucun état ne lui est fourni.
function main() {
  const findings = checkMemoryCoherence(null, null);
  console.log(buildMemoryAuditReport(findings));
  if (!findings.length) {
    console.log("\nPAS MESURÉ, et ce n'est pas un vert : memory-audit compare une mémoire de personnage à son état précédent.");
    console.log("Aucun état de jeu n'est fourni en ligne de commande, donc rien n'a été comparé — ce silence ne dit rien sur la santé de la mémoire.");
    console.log("Il se sollicite pendant une simulation (checkMemoryCoherence(life, lifePrecedente)), jamais à froid sur le dépôt.");
    // DIT EXPLICITEMENT, à la demande de l'utilisateur le 2026-09-23 (« le garder et le rendre
    // explicite »), parce que je venais moi-même de faire l'erreur : lancer cet outil pendant une
    // Ronde. La correction de la commande manquante était bonne — l'outil était inscrit partout et
    // aucune ligne ne pouvait le lancer — mais une commande qui marche invite à s'en servir. Sans
    // cette phrase, la prochaine IA referait exactement mon erreur, et c'est précisément ce que
    // l'Article 27 demande d'empêcher.
    console.log("\nPORTÉE : simulation (scripts/lib-shell.mjs, TOOL_PORTEE). Il n'a JAMAIS sa place dans une Ronde —");
    console.log("l'agent qui l'a lancé pendant celle du 2026-09-23 s'est trompé, et le contrôleur de la Ronde le signale désormais.");
  }
  recordCliUsage("memory-audit", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) main();
