// THE-KING (tâche #167, 2026-09-21) — veille au respect de docs/philosophie-et-politique.md dans
// les décisions à haut niveau. Né d'une demande explicite de l'utilisateur : « cree un agent
// 'the-king' qui est chargé de verifier que lorsque tu prends une decision à haut niveau [...]
// the-king te rappelle de consulter 'philosophie et politique'. c'est un vrai agent-script qui fait
// partie de l'équipe [...] il conserve aussi un historique de l'evolution du document [...] il joue
// un peu le role de 'pere' ou 'grand pere'. »
//
// THE-KING n'a AUCUNE autorité sur le fond : il rappelle, vérifie la fraîcheur, signale une tension
// possible entre deux principes, et tient le digest de l'évolution du document — jamais un
// auto-edit, jamais une réécriture, jamais un verdict qui prime sur le jugement humain/agent
// (exactement la même retenue que SMART-CONSO-TOKEN/Smart Conso API : informer, jamais trancher).
// Mécanique, zéro appel Gemini, zéro agent séparé — un "vrai agent-script", jamais un coût caché.

import { significantWords } from "./le-coordinateur.mjs";
import { lastTouchDays } from "./clean-dirty-old.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { sh, printReliabilityNotice, decouperEnUnites, pairesParJaccard } from "./lib-shell.mjs";
import { SEUIL_JACCARD_STRICT } from "./abraham-les-references.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { printReportHeader } from "./report-template.mjs";
import { buildPlanDaction, PLAN_ACTION_TITRE } from "./report-template.mjs";

const ROOT = process.cwd();

const PHILOSOPHY_PATH = "docs/philosophie-et-politique.md";

// 6 catégories de déclenchement confirmées avec l'utilisateur (2026-09-21) : chaque mot-clé est un
// SIGNAL, jamais une certitude — une décision peut toucher plusieurs catégories à la fois, ou aucune
// alors qu'elle mérite quand même consultation (le jugement humain/agent reste toujours final).
export const TRIGGER_CATEGORIES = [
  { key: "architecture", label: "nouvelle architecture technique", keywords: ["architecture", "refonte", "restructuration", "migration technique", "changement de stack"] },
  { key: "mecanique_jeu", label: "nouveau mécanisme de jeu à fort impact", keywords: ["mécanique de jeu", "nouvelle jauge", "règle du jeu", "révélation finale", "gameplay"] },
  { key: "nouvel_outil", label: "création d'un nouvel outil membre de l'équipe", keywords: ["nouvel outil", "nouvel agent", "concevoir et construire", "membre de l'équipe"] },
  { key: "priorite_feuille_de_route", label: "changement d'ordre ou de priorité de la feuille de route", keywords: ["priorité", "feuille de route", "ordre des tâches", "repasse en priorité", "avant cassandra"] },
  { key: "generalisable", label: "décision généralisable à un futur projet", keywords: ["futur projet", "réutilisable", "blueprint générique", "principe général"] },
  { key: "irreversible_couteux", label: "décision irréversible ou coûteuse", keywords: ["irréversible", "supprimer", "renumérot", "casserait", "coût élevé", "définitif"] },
];

export function classifyDecisionTriggers(requestText) {
  const text = String(requestText ?? "").toLowerCase();
  return TRIGGER_CATEGORIES.filter((c) => c.keywords.some((k) => text.includes(k)));
}

// Rappel humainement lisible — `null` quand aucune catégorie n'est détectée (jamais un rappel
// systématique qui perdrait toute sa valeur d'alerte à force d'apparaître partout).
export function reminderFor(requestText) {
  const triggers = classifyDecisionTriggers(requestText);
  if (!triggers.length) return null;
  return `👑 THE-KING : cette décision touche ${triggers.map((t) => t.label).join(", ")} — consulter ${PHILOSOPHY_PATH} avant de trancher, jamais après coup.`;
}

// Découpe philosophie-et-politique.md en principes ("### N.N Titre **[tag]**"), sur le même
// principe que CLAUDE.MD.SPY::extractRuleUnits() mais jamais la même fonction : le format de titre
// diffère ("Article N" vs "N.N Titre"), un partage forcé aurait fragilisé les deux parseurs pour un
// gain de mutualisation illusoire (deux formats réels, jamais un troisième artificiel entre eux).
const SECTION_HEADING_PATTERN = /^### (\d+)\.(\d+) (.+?)\s*\*\*\[([^\]]+)\]\*\*\s*$/gm;
const TOP_HEADING_PATTERN = /^## /gm;

export function extractPrincipleUnits(text) {
  // Découpage partagé (lib-shell) ; ce qui reste ici est propre au texte fondateur : un principe
  // porte une partie, un numéro, un titre ET un tag — quatre champs là où la charte en a deux.
  return decouperEnUnites(text, SECTION_HEADING_PATTERN, {
    motifBorneSuperieure: TOP_HEADING_PATTERN,
    champs: (m) => ({ partie: Number(m[1]), numero: Number(m[2]), titre: m[3].trim(), tag: m[4].trim() }),
  });
}

// Une date n'apparaît dans le tag QUE lorsque le principe la porte explicitement (ex. "[Synthèse,
// 2026-09-19]") — `undefined` honnête pour un principe fondateur sans date déclarée, jamais une date
// devinée depuis le contenu du texte lui-même.
export function extractPrincipleDate(principle) {
  const m = String(principle?.tag ?? "").match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : undefined;
}

// DATE RÉELLE D'ARRIVÉE, DÉRIVÉE DE GIT (2026-09-22, tâche #196 : « retrofit historique daté »).
// Constat qui la motive : sur les 19 principes du document, 2 SEULEMENT portent une date explicite.
// Le digest d'évolution ne racontait donc l'histoire que de 2 principes sur 19, et le document
// passait pour figé alors qu'il ne l'est pas. Dater les 17 autres à la main aurait produit
// exactement ce que l'Article 24 interdit : une liste recopiée qui se périme au prochain ajout.
// On interroge donc l'historique réel du fichier — le PREMIER commit qui a introduit le titre du
// principe, jamais le dernier qui l'a touché (une reformulation n'est pas une naissance).
//
// `provenance` dit toujours d'où vient la date : "déclarée" (le principe la porte), "git" (dérivée),
// ou absente. Une date dérivée n'est jamais présentée comme une date déclarée.
export function principleDateFromGit(principle, { shImpl = sh, fichier = PHILOSOPHY_PATH } = {}) {
  const titre = String(principle?.titre ?? "").trim();
  if (!titre) return undefined;
  const out = shImpl(`git log --diff-filter=AM --format=%ad --date=short -S${JSON.stringify(titre)} -- ${fichier}`, { quiet: true });
  const lignes = String(out ?? "").trim().split("\n").filter(Boolean);
  return lignes.length ? lignes[lignes.length - 1] : undefined;
}

// Réunit les deux sources, la déclarée primant toujours sur la dérivée : ce que l'auteur a écrit
// vaut plus que ce que git déduit. `provenance` reste exposée pour que le lecteur sache laquelle
// il regarde — jamais un mélange silencieux des deux.
export function principleDate(principle, options = {}) {
  const declaree = extractPrincipleDate(principle);
  if (declaree) return { date: declaree, provenance: "déclarée" };
  const git = principleDateFromGit(principle, options);
  return git ? { date: git, provenance: "git" } : { date: undefined, provenance: undefined };
}

// Digest chronologique de l'évolution du document — seulement les principes portant une date
// explicite, triés du plus ancien au plus récent (jamais l'ordre d'apparition dans le fichier, qui
// suit la numérotation des Parties/sections, pas la chronologie réelle d'ajout).
// `avecGit` (2026-09-22, tâche #196) : par défaut le digest interroge l'historique réel pour les
// principes sans date déclarée — sans quoi il ne racontait l'histoire que de 2 principes sur 19.
// Désactivable (`avecGit: false`) pour les tests, qui ne doivent jamais dépendre de l'état du dépôt.
export function buildEvolutionDigest(principles, { avecGit = true, shImpl = sh } = {}) {
  return principles
    .map((p) => {
      const r = avecGit ? principleDate(p, { shImpl }) : { date: extractPrincipleDate(p), provenance: extractPrincipleDate(p) ? "déclarée" : undefined };
      return { ...p, date: r.date, provenance: r.provenance };
    })
    .filter((p) => p.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => `${p.date} — ${p.partie}.${p.numero} ${p.titre}`);
}

const NEGATION_MARKER = /\bjamais\b/i;
const ABSOLUTE_MARKER = /\btoujours\b/i;

// Détection de tension possible entre deux principes — un SIGNAL heuristique, jamais une
// contradiction prouvée (aucun outil mécanique de ce projet ne peut lire le sens réel de deux
// phrases). Deux conditions cumulatives, toutes deux nécessaires pour limiter les faux positifs :
// (1) un vocabulaire significatif fortement partagé — les deux principes parlent bien du même
// terrain. Le seuil est IMPORTÉ d'Abraham-les-references (`SEUIL_JACCARD_STRICT`), jamais recopié :
// il l'était jusqu'au 2026-09-23, avec un commentaire promettant qu'il resterait aligné sur
// « findRedundantRulePairs() de CLAUDE.MD.SPY » — une fonction qui avait entre-temps changé deux
// fois de nom ET de fichier, de sorte que la promesse désignait une adresse morte et que rien
// n'aurait dit qu'une des deux valeurs bouge (Article 24) ; (2) une polarité normative divergente sur ce terrain
// partagé (l'un affirme "jamais", l'autre "toujours") — le candidat le plus honnête qu'une regex
// puisse produire pour une vraie lecture humaine, jamais un remplacement de cette lecture.
export function findPossibleTensions(principles, { threshold = SEUIL_JACCARD_STRICT } = {}) {
  // Comparaison partagée (lib-shell), interprétation propre à cet outil : ici une paire au-dessus du
  // seuil n'est PAS une redondance, c'est le terrain commun sur lequel une divergence de polarité
  // (« jamais » d'un côté, « toujours » de l'autre) devient une vraie tension à lire.
  const wordSets = principles.map((p) => new Set(significantWords(p.texte).filter((w) => w.length > 4)));
  const tensions = [];
  for (const { i, j, jaccard } of pairesParJaccard(wordSets, { seuil: threshold })) {
    const aNeg = NEGATION_MARKER.test(principles[i].texte);
    const bNeg = NEGATION_MARKER.test(principles[j].texte);
    const aAbs = ABSOLUTE_MARKER.test(principles[i].texte);
    const bAbs = ABSOLUTE_MARKER.test(principles[j].texte);
    if ((aNeg && bAbs) || (aAbs && bNeg)) {
      tensions.push({ a: `${principles[i].partie}.${principles[i].numero}`, b: `${principles[j].partie}.${principles[j].numero}`, jaccard: Math.round(jaccard * 1000) / 1000 });
    }
  }
  return tensions.sort((x, y) => y.jaccard - x.jaccard);
}

// Fraîcheur : jamais un auto-edit ni une proposition de texte (calibrage explicite), seulement le
// nombre de jours depuis la dernière modification réelle — réutilise lastTouchDays() de
// CLEAN-DIRTY-OLD, jamais un second calcul divergent. `undefined` honnête si le fichier n'a jamais
// été commité (cas théorique, jamais rencontré en pratique sur ce projet).
export function philosophyFreshnessDays() {
  return lastTouchDays(PHILOSOPHY_PATH);
}

// shouldSnapshotPhilosophy() DÉPLACÉE dans lib-shell.mjs le 2026-09-22 sous le nom générique
// shouldSnapshotText() — un second appelant réel est apparu le même soir (la snapshot CLAUDE.md de
// claude-md-weight-signal, cf. circle-tasks.mjs), jamais un second calcul divergent (Article 3).

function main() {
  printReportHeader({ tool: "the-king", title: "THE-KING — veille philosophie et politique", scriptPath: "scripts/the-king.mjs" });
  recordCliUsage("the-king");
  const requestText = process.argv.slice(2).join(" ");
  if (requestText) {
    const reminder = reminderFor(requestText);
    console.log(reminder ?? "👑 THE-KING : aucune des 6 catégories de déclenchement détectée dans ce texte — consultation non signalée comme nécessaire (jamais une certitude, le jugement humain/agent reste final).");
  }
  console.log(`\n📅 Fraîcheur de ${PHILOSOPHY_PATH} : ${(() => { const d = philosophyFreshnessDays(); return d == null ? "jamais committé" : `dernière modification il y a ${Math.round(d)} j`; })()}`);

  // HISTORIQUE AFFICHÉ (2026-09-22, tâche #196). Trou réel trouvé en finissant le retrofit daté :
  // main() ne montrait QUE la fraîcheur — le digest et les tensions n'existaient que pour l'appelant
  // CIRCLE-TASKS, jamais pour quelqu'un qui lance l'outil à la main. Un outil dont le cœur du rôle
  // (« conserver un historique de l'évolution du document », demande d'origine) reste invisible
  // depuis sa propre ligne de commande n'est pas un outil terminé.
  const principles = extractPrincipleUnits(readFileSync(join(ROOT, PHILOSOPHY_PATH), "utf8"));
  const digest = buildEvolutionDigest(principles);
  const declarees = principles.filter((p) => extractPrincipleDate(p)).length;
  console.log(`\n📜 Évolution du document — ${digest.length}/${principles.length} principes datés (${declarees} date(s) déclarée(s), ${digest.length - declarees} dérivée(s) de l'historique git) :`);
  for (const ligne of digest) console.log(`   ${ligne}`);
  if (digest.length < principles.length) {
    console.log(`   ⚠️  ${principles.length - digest.length} principe(s) non daté(s) — ni date déclarée, ni trace dans l'historique git de ce fichier.`);
  }

  const tensions = findPossibleTensions(principles);
  console.log(`\n⚖️  Tensions POSSIBLES entre principes : ${tensions.length === 0 ? "aucune détectée" : `${tensions.length} à relire humainement`}`);
  for (const t of tensions) console.log(`   ${t.a} ↔ ${t.b} (vocabulaire partagé ${t.jaccard}) — un SIGNAL, jamais une contradiction prouvée.`);

  // LE PLAN D'ACTION (2026-09-23, tâche #211). THE-KING est un VEILLEUR de document, et ses deux
  // constats sont de nature opposée — les fondre serait mentir sur ce qu'il sait.
  //
  // Un principe NON DATÉ est un fait établi : ni date déclarée, ni trace git. Il devient donc une
  // tâche RETENUE, avec ce qu'il faut faire.
  //
  // Une TENSION, elle, reste « à trancher » quoi qu'il arrive : l'outil mesure un vocabulaire
  // partagé et une polarité opposée, ce qui est un SIGNAL, jamais une contradiction prouvée. La
  // classer « retenu » ferait d'une heuristique un verdict — et sur la philosophie du projet,
  // c'est précisément la décision qui ne m'appartient pas (Article 16).
  const nonDates = principles.length - digest.length;
  const constatsRoi = [
    ...(nonDates > 0 ? [{ constat: `${nonDates} principe(s) sans aucune date : ni déclarée, ni retrouvable dans l'historique git`, etat: "retenu",
      tache: "dater ces principes à la main, ou écrire qu'ils précèdent le suivi" }] : []),
    ...tensions.map((t) => ({ constat: `tension possible entre « ${t.a} » et « ${t.b} » (vocabulaire partagé ${t.jaccard})`, etat: "a-trancher",
      pourquoi: "vocabulaire partagé + polarité opposée est un signal mécanique, jamais une contradiction prouvée — trancher la philosophie du projet n'est pas une décision d'outil" })),
  ];
  const planRoi = buildPlanDaction(constatsRoi, { toolSlug: "the-king" });
  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of planRoi.lignes) console.log(l);

}

if (import.meta.url === `file://${process.argv[1]}`) main();
