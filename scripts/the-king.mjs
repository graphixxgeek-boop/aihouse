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
  const source = String(text ?? "");
  const matches = [...source.matchAll(SECTION_HEADING_PATTERN)];
  const headingStarts = [...source.matchAll(TOP_HEADING_PATTERN)].map((m) => m.index ?? source.length);
  return matches.map((m, i) => {
    const start = m.index ?? 0;
    const nextSectionStart = i + 1 < matches.length ? (matches[i + 1].index ?? source.length) : source.length;
    const nextHeadingStart = headingStarts.find((h) => h > start) ?? source.length;
    const end = Math.min(nextSectionStart, nextHeadingStart);
    return { partie: Number(m[1]), numero: Number(m[2]), titre: m[3].trim(), tag: m[4].trim(), texte: source.slice(start, end).trim() };
  });
}

// Une date n'apparaît dans le tag QUE lorsque le principe la porte explicitement (ex. "[Synthèse,
// 2026-09-19]") — `undefined` honnête pour un principe fondateur sans date déclarée, jamais une date
// devinée depuis le contenu du texte lui-même.
export function extractPrincipleDate(principle) {
  const m = String(principle?.tag ?? "").match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : undefined;
}

// Digest chronologique de l'évolution du document — seulement les principes portant une date
// explicite, triés du plus ancien au plus récent (jamais l'ordre d'apparition dans le fichier, qui
// suit la numérotation des Parties/sections, pas la chronologie réelle d'ajout).
export function buildEvolutionDigest(principles) {
  return principles
    .map((p) => ({ ...p, date: extractPrincipleDate(p) }))
    .filter((p) => p.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => `${p.date} — ${p.partie}.${p.numero} ${p.titre}`);
}

const NEGATION_MARKER = /\bjamais\b/i;
const ABSOLUTE_MARKER = /\btoujours\b/i;

// Détection de tension possible entre deux principes — un SIGNAL heuristique, jamais une
// contradiction prouvée (aucun outil mécanique de ce projet ne peut lire le sens réel de deux
// phrases). Deux conditions cumulatives, toutes deux nécessaires pour limiter les faux positifs :
// (1) un vocabulaire significatif fortement partagé (même seuil de similarité de Jaccard que
// findRedundantRulePairs() de CLAUDE.MD.SPY, jamais un second seuil arbitraire) — les deux
// principes parlent bien du même terrain ; (2) une polarité normative divergente sur ce terrain
// partagé (l'un affirme "jamais", l'autre "toujours") — le candidat le plus honnête qu'une regex
// puisse produire pour une vraie lecture humaine, jamais un remplacement de cette lecture.
export function findPossibleTensions(principles, { threshold = 0.22 } = {}) {
  const wordSets = principles.map((p) => new Set(significantWords(p.texte).filter((w) => w.length > 4)));
  const tensions = [];
  for (let i = 0; i < principles.length; i++) {
    for (let j = i + 1; j < principles.length; j++) {
      const a = wordSets[i], b = wordSets[j];
      if (!a.size || !b.size) continue;
      const intersection = [...a].filter((w) => b.has(w)).length;
      const union = new Set([...a, ...b]).size;
      const jaccard = union ? intersection / union : 0;
      if (jaccard < threshold) continue;
      const aNeg = NEGATION_MARKER.test(principles[i].texte);
      const bNeg = NEGATION_MARKER.test(principles[j].texte);
      const aAbs = ABSOLUTE_MARKER.test(principles[i].texte);
      const bAbs = ABSOLUTE_MARKER.test(principles[j].texte);
      if ((aNeg && bAbs) || (aAbs && bNeg)) {
        tensions.push({ a: `${principles[i].partie}.${principles[i].numero}`, b: `${principles[j].partie}.${principles[j].numero}`, jaccard: Math.round(jaccard * 1000) / 1000 });
      }
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

function main() {
  const requestText = process.argv.slice(2).join(" ");
  if (requestText) {
    const reminder = reminderFor(requestText);
    console.log(reminder ?? "👑 THE-KING : aucune des 6 catégories de déclenchement détectée dans ce texte — consultation non signalée comme nécessaire (jamais une certitude, le jugement humain/agent reste final).");
  }
  console.log(`\n📅 Fraîcheur de ${PHILOSOPHY_PATH} : ${(() => { const d = philosophyFreshnessDays(); return d == null ? "jamais committé" : `dernière modification il y a ${Math.round(d)} j`; })()}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
