// AGENT-DU-TEMPS (2026-09-24, chantier 3.1 du plan de nuit) — l'heure et la date fiables, au
// référentiel France, et l'endroit unique où vivent les estimations de durée et de consommation.
//
// DEMANDE DE L'UTILISATEUR, en une phrase : « un agent du TEMPS : heure et date fiables au
// référentiel France, connecté au temps réel via une API gratuite, teste l'agent à la Ronde,
// héberge les données d'estimation durée/conso ». Calibré la même nuit, en fenêtre dédiée :
// « Essaie l'API, et si ça échoue prends l'horloge système », « des seuils mécaniques, jamais mon
// jugement », « dérive-les de l'historique git ».
//
// POURQUOI IL EXISTE, ET CE N'EST PAS THÉORIQUE : la nuit même où il a été demandé, j'ai écrit une
// ligne de suivi datée de QUINZE MINUTES DANS LE FUTUR, parce que j'avais tapé l'heure au lieu de
// la lire. Le garde-fou d'horodatages futurs, écrit deux heures plus tôt, a refusé le commit. Un
// agent ne SAIT PAS l'heure : il la déduit du dernier horodatage qu'il a vu passer, et il se trompe.
//
// CE QU'IL NE PROMETTRA JAMAIS, ET C'EST LE CŒUR DE SA CONCEPTION : il ne rend jamais une heure
// sans dire D'OÙ elle vient. Une horloge de repli présentée comme une heure réseau serait exactement
// le faux vert que tout cet outillage traque — sauf qu'ici elle serait invisible, puisqu'une heure
// fausse ressemble trait pour trait à une heure juste. Trois sources, toujours nommée :
//   · « réseau »  — une API de temps a répondu, l'heure est indépendante de la machine ;
//   · « système » — l'horloge locale, honnête mais invérifiable depuis le conteneur ;
//   · « aucune »  — rien n'a pu être lu, et alors il refuse de répondre (leçon L5).
//
// CONSTAT MESURÉ LE JOUR DE SA CONSTRUCTION, écrit ici pour l'IA qui reprendra : dans
// l'environnement d'exécution actuel, les deux API de temps essayées (worldtimeapi.org, timeapi.io)
// sont refusées par la politique réseau de l'environnement — « connect_rejected ». La source sera
// donc « système » tant que ces domaines ne sont pas autorisés. Ce n'est pas une panne de cet
// agent : c'est une contrainte d'environnement, et il la DÉCLARE au lieu de la masquer.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReportHeader, planDactionDepuisEcarts, PLAN_ACTION_TITRE } from "./report-template.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
export const FUSEAU = "Europe/Paris";
export const REGISTRE_ESTIMATIONS = "docs/agent-du-temps/estimations.md";

// Les sources sont ESSAYÉES DANS L'ORDRE et chacune déclare ce qu'elle vaut. Une source ajoutée
// demain rejoint cette liste sans toucher à la logique (Article 24).
export const SOURCES_RESEAU = [
  { nom: "worldtimeapi", url: `https://worldtimeapi.org/api/timezone/${FUSEAU}`, extraire: (j) => j?.datetime },
  { nom: "timeapi.io", url: `https://timeapi.io/api/Time/current/zone?timeZone=${FUSEAU}`, extraire: (j) => j?.dateTime },
];

export async function heureReseau({ sources = SOURCES_RESEAU, fetchImpl = globalThis.fetch, timeoutMs = 4000 } = {}) {
  if (typeof fetchImpl !== "function") return { ok: false, essais: [{ nom: "aucun", pourquoi: "aucun client HTTP disponible dans ce runtime" }] };
  const essais = [];
  for (const s of sources) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const rep = await fetchImpl(s.url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!rep?.ok) { essais.push({ nom: s.nom, pourquoi: `HTTP ${rep?.status ?? "?"}` }); continue; }
      const iso = s.extraire(await rep.json());
      const d = iso ? new Date(iso) : null;
      if (!d || Number.isNaN(d.getTime())) { essais.push({ nom: s.nom, pourquoi: "réponse sans horodatage lisible" }); continue; }
      return { ok: true, source: s.nom, date: d, essais };
    } catch (e) {
      // Le MOTIF est conservé : « refusé par la politique réseau » et « le service est en panne »
      // appellent deux gestes opposés, et les fondre en « échec » les rendrait indiscernables.
      essais.push({ nom: s.nom, pourquoi: String(e?.message ?? e).slice(0, 120) });
    }
  }
  return { ok: false, essais };
}

export function formaterFrance(date, { fuseau = FUSEAU } = {}) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const f = new Intl.DateTimeFormat("fr-FR", { timeZone: fuseau, dateStyle: "full", timeStyle: "short" });
  // L'horodatage de SUIVI reste en UTC, volontairement : c'est la forme que le registre exige et
  // que son garde-fou d'horodatages futurs compare. Donner l'heure de Paris à l'écran et écrire
  // l'UTC dans le fichier n'est pas une incohérence, c'est la séparation entre ce qu'un humain lit
  // et ce qu'une machine compare — les mélanger décalerait toutes les dates de une ou deux heures.
  const iso = date.toISOString();
  return { humain: f.format(date), suivi: `${iso.slice(0, 16)}Z`, iso };
}

export async function maintenant({ fetchImpl = globalThis.fetch, horlogeSysteme = () => new Date(), sources = SOURCES_RESEAU } = {}) {
  const reseau = await heureReseau({ sources, fetchImpl });
  if (reseau.ok) return { mesurable: true, source: "réseau", via: reseau.source, ...formaterFrance(reseau.date), essais: reseau.essais };
  let d = null;
  try { d = horlogeSysteme(); } catch { d = null; }
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
    return { mesurable: false, source: "aucune", pourquoi: "ni le réseau ni l'horloge système n'ont rendu une date lisible — aucune heure inventée", essais: reseau.essais };
  }
  return {
    mesurable: true, source: "système", via: null, ...formaterFrance(d), essais: reseau.essais,
    reserve: "heure de l'horloge locale : honnête, mais invérifiable depuis ce conteneur. Les API de temps ont été essayées et ont échoué — le détail est dans `essais`.",
  };
}

// ————————————————————————————————————————————————————————————————————————
// LES ESTIMATIONS — durée, tokens, appels API — et leur comparaison au réel
// ————————————————————————————————————————————————————————————————————————
//
// DEMANDE DE L'UTILISATEUR, formulée deux fois : d'abord pour la Ronde (« compare à la fin ton
// estimation avec le temps réel et consigne-le pour la prochaine fois, pour ajuster tes
// estimations »), puis étendue (« ajoute la même étape à la simu : estimation du temps + coût token
// + coût API au début, comparaison avec le résultat réel, historisation, ajustement des estimations
// pour la prochaine fois »).
//
// POURQUOI LE MÉCANISME VIT ICI ET NON DANS CIRCLE-TASKS : il y est né, mais il y était enfermé.
// La simulation en a besoin du mot à mot, et la recopier aurait donné deux historiques qui divergent
// — la définition même de ce que l'Article 24 interdit. `estimerRonde()` reste chez CIRCLE-TASKS
// parce qu'il connaît les items d'une Ronde ; ce qui est GÉNÉRIQUE (comparer, historiser, ajuster)
// vit ici et sert les deux.
//
// LE SEUIL EST MÉCANIQUE, JAMAIS UN JUGEMENT — calibrage explicite de l'utilisateur (« des seuils
// mécaniques, jamais mon jugement »). Une estimation est « juste » à ±30 % : en deçà elle sous-estime,
// au-delà elle sur-estime. Le chiffre vient de la première mesure réelle (38 min estimées contre 27
// réelles, soit 41 % d'écart, ressenti comme « nettement trop »), pas d'une convention.
// ══════════════════════════════════════════════════════════════════════════
// LE TEMPS DE L'UTILISATEUR (2026-09-26, tâche #913 — point 26 de son gros prompt : « la notion du
// temps — renforcer AGENT-DU-TEMPS »).
//
// LA QUATRIÈME OBLIGATION DE L'ARTICLE 32 N'AVAIT AUCUN MÉCANISME, et c'est le trou que ceci
// comble. L'Article dit : « le temps de L'UTILISATEUR compte autant que celui de la machine.
// Est-il présent ou endormi ? Combien de temps lui reste-t-il ? Une question bloquante posée à
// trois heures du matin ne bloque pas dix secondes, elle bloque la nuit entière. » Les trois
// premières obligations (lire l'heure, nommer la source, calculer la fraîcheur) sont portées par
// cet outil depuis le 2026-09-24. La quatrième ne l'était par rien — l'agent la « savait », ce que
// l'Article 27 interdit précisément de considérer comme une protection.
//
// CE QU'IL MESURE : le mode de travail déclaré dit si l'utilisateur est présent et si une fenêtre
// peut bloquer. C'est une DÉCLARATION, pas une observation, et c'est écrit comme tel — un mode qu'on
// a oublié de changer décrit l'intention d'hier.
//
// CE QU'IL DÉCLARE IMPOSSIBLE, et c'est le résultat le plus utile de ce travail (Article 27 : quand
// un mécanisme est impossible, l'écrire noir sur blanc EST la protection). **« Depuis combien de
// temps n'a-t-il pas parlé ? » ne se lit PAS dans ce dépôt.** Deux tentatives ont été faites et
// toutes deux rendaient « 0,1 h » en pleine nuit autonome, alors qu'il dormait depuis des heures :
//   1. la dernière ligne du suivi → c'est la dernière ligne écrite par l'AGENT ;
//   2. la dernière ligne d'origine « utilisateur » → une ligne née de SA demande est quand même
//      ÉCRITE par l'agent, souvent des heures plus tard. L'origine dit d'où vient la tâche, jamais
//      quand il a parlé.
// Le seul porteur possible est l'horodatage du dernier message reçu, qui vit dans la conversation
// et pas sur le disque. Un appelant qui l'a peut le passer en `derniereLigne` ; sans lui, la
// fonction REFUSE plutôt que de rendre un chiffre qui dirait toujours « il vient de parler ».
export const SEUIL_LONGUE_ABSENCE_H = 4;

export function tempsDeLUtilisateur({ mode = null, derniereLigne = null, maintenant = new Date() } = {}) {
  const ecoule = derniereLigne ? (maintenant.getTime() - new Date(derniereLigne).getTime()) / 3600000 : null;
  return {
    // LE MODE EST UNE DÉCLARATION, jamais une observation — et le dire change ce qu'on en fait.
    mode: mode ? { slug: mode.slug ?? null, utilisateurPresent: mode.utilisateurPresent ?? null, fenetrePeutBloquer: mode.fenetrePeutBloquer ?? null,
                   nature: "DÉCLARÉ par le mode de travail en cours, jamais observé : si le mode n'a pas été changé, il décrit l'intention d'hier" }
        : { indisponible: true, pourquoi: "aucun mode de travail lisible — on ne sait donc pas si une question bloquante coûterait dix secondes ou une nuit, et c'est exactement ce qu'il ne faut pas supposer" },
    depuisSaDerniereTrace: ecoule === null
      ? { mesurable: false, pourquoi: "NON LISIBLE DEPUIS LE DÉPÔT, et c'est une impossibilité DÉCLARÉE plutôt qu'un oubli : les lignes du suivi sont écrites par l'AGENT, y compris celles nées d'une demande de l'utilisateur. Deux tentatives ont rendu « 0,1 h » en pleine nuit autonome, alors qu'il dormait depuis des heures. Le seul porteur possible est l'horodatage du dernier message reçu, qui vit dans la conversation et pas sur le disque — un appelant qui l'a le passe en `derniereLigne`" }
      : { mesurable: true, heures: Math.round(ecoule * 10) / 10,
          longueAbsence: ecoule >= SEUIL_LONGUE_ABSENCE_H,
          // CE QUE CETTE MESURE NE PROUVE PAS, et il faut le dire : elle mesure un SILENCE ÉCRIT,
          // pas une absence. Il peut lire sans écrire, et il le fait souvent.
          horsPortee: "mesure un silence ÉCRIT, jamais une absence : il peut lire sans écrire une ligne. Un long silence dit qu'un compte rendu doit se réexpliquer (Article 29), jamais qu'il dort." },
  };
}

export function formatTempsUtilisateurLines(t) {
  const l = ["--- LE TEMPS DE L'UTILISATEUR (Article 32, quatrième obligation) ---"];
  l.push(t.mode.indisponible
    ? `  ❓ MODE DE TRAVAIL : ${t.mode.pourquoi}`
    : `  MODE « ${t.mode.slug} » — présent : ${t.mode.utilisateurPresent} · une fenêtre peut bloquer : ${t.mode.fenetrePeutBloquer}\n     ${t.mode.nature}`);
  l.push(t.depuisSaDerniereTrace.mesurable
    ? `  DEPUIS SA DERNIÈRE TRACE ÉCRITE : ${t.depuisSaDerniereTrace.heures} h${t.depuisSaDerniereTrace.longueAbsence ? ` — au-delà de ${SEUIL_LONGUE_ABSENCE_H} h : un compte rendu doit se réexpliquer, pas reprendre au milieu de sa phrase (Article 29)` : ""}\n     ${t.depuisSaDerniereTrace.horsPortee}`
    : `  ❓ DEPUIS SA DERNIÈRE TRACE : ${t.depuisSaDerniereTrace.pourquoi}`);
  return l;
}

export const TOLERANCE_ESTIMATION = 0.3;

export function comparerAuReel(estime, reel, { tolerance = TOLERANCE_ESTIMATION } = {}) {
  if (!Number.isFinite(estime) || !Number.isFinite(reel) || estime <= 0 || reel <= 0) {
    return { mesurable: false, pourquoi: "il faut une estimation ET un réel, tous deux strictement positifs — une comparaison contre une valeur absente rendrait un écart qui a l'air d'une mesure" };
  }
  const ecart = (estime - reel) / reel;
  const verdict = Math.abs(ecart) <= tolerance ? "juste" : (ecart > 0 ? "SUR-ESTIMÉE" : "SOUS-ESTIMÉE");
  return {
    mesurable: true, estime, reel, ecart,
    ecartPct: Math.round(ecart * 100),
    verdict,
    // LE FACTEUR D'AJUSTEMENT EST PROPOSÉ, JAMAIS APPLIQUÉ : l'appliquer tout seul ferait dériver
    // les estimations sur un seul point de mesure, et un point n'est pas une tendance.
    facteurPropose: Number((reel / estime).toFixed(2)),
    horsPortee: "ce facteur se PROPOSE sur un seul passage ; il ne s'applique qu'une fois confirmé par plusieurs mesures, sans quoi une Ronde atypique recalibrerait tout le reste",
  };
}

export function ajusterDepuisHistorique(mesures = [], { minimum = 3 } = {}) {
  const valides = mesures.filter((m) => Number.isFinite(m?.estime) && Number.isFinite(m?.reel) && m.estime > 0 && m.reel > 0);
  if (valides.length < minimum) {
    return { mesurable: false, mesures: valides.length, pourquoi: `${valides.length} mesure(s) sur ${minimum} requises — en dessous, un passage atypique recalibrerait tout, et un facteur calculé sur deux points ressemble pourtant à une statistique` };
  }
  const facteurs = valides.map((m) => m.reel / m.estime).sort((a, b) => a - b);
  // La MÉDIANE, jamais la moyenne : une seule Ronde interrompue en plein milieu tirerait une
  // moyenne vers le bas et emporterait toutes les estimations suivantes avec elle.
  const mediane = facteurs.length % 2 ? facteurs[(facteurs.length - 1) / 2] : (facteurs[facteurs.length / 2 - 1] + facteurs[facteurs.length / 2]) / 2;
  return { mesurable: true, mesures: valides.length, facteur: Number(mediane.toFixed(2)),
    pourquoi: `médiane de ${valides.length} facteurs réels/estimés — la médiane et non la moyenne, pour qu'un passage interrompu n'emporte pas les suivants` };
}

export function enregistrerMesure(mesure, { root = ROOT, ecrire = writeFileSync, lire = readFileSync } = {}) {
  const champs = ["quand", "quoi", "estimeMinutes", "reelMinutes", "estimeTokens", "reelTokens", "appelsApi"];
  const manquants = champs.filter((c) => mesure?.[c] === undefined || mesure?.[c] === null);
  if (manquants.length) return { enregistre: false, pourquoi: `champ(s) manquant(s) : ${manquants.join(", ")} — une mesure incomplète historisée ressemble à une mesure complète` };
  const chemin = join(root, REGISTRE_ESTIMATIONS);
  let texte = "";
  try { texte = lire(chemin, "utf8"); } catch {
    try { mkdirSync(join(root, "docs/agent-du-temps"), { recursive: true }); } catch { /* déjà là */ }
    texte = "# Registre des estimations — AGENT-DU-TEMPS\n\n*(Une mesure par ligne. L'estimation d'AVANT et le réel d'APRÈS, côte à côte : c'est la seule\nfaçon d'ajuster les suivantes, et une estimation jamais comparée n'a jamais rien appris.)*\n\n| Quand | Quoi | Durée estimée | Durée réelle | Tokens estimés | Tokens réels | Appels API | Verdict |\n|---|---|---|---|---|---|---|---|\n";
  }
  const c = comparerAuReel(mesure.estimeMinutes, mesure.reelMinutes);
  const ligne = `| ${mesure.quand} | ${mesure.quoi} | ${mesure.estimeMinutes} min | ${mesure.reelMinutes} min | ${mesure.estimeTokens} | ${mesure.reelTokens} | ${mesure.appelsApi} | ${c.mesurable ? `${c.verdict} (${c.ecartPct > 0 ? "+" : ""}${c.ecartPct} %)` : "non comparable"} |`;
  ecrire(chemin, `${texte.replace(/\n+$/, "")}\n${ligne}\n`, "utf8");
  return { enregistre: true, ligne, comparaison: c };
}

export function lireMesures({ root = ROOT, lire = readFileSync } = {}) {
  let texte;
  try { texte = lire(join(root, REGISTRE_ESTIMATIONS), "utf8"); } catch {
    return { mesurable: false, pourquoi: `${REGISTRE_ESTIMATIONS} est illisible ou n'existe pas — aucune mesure, ce qui n'est jamais la même chose que zéro écart` };
  }
  const mesures = [];
  for (const l of texte.split("\n")) {
    if (!l.trim().startsWith("|")) continue;
    const c = l.split("|").slice(1, -1).map((x) => x.trim());
    if (c.length < 8 || c[0] === "Quand" || /^-+$/.test(c[0])) continue;
    const estime = parseFloat(c[2]); const reel = parseFloat(c[3]);
    if (Number.isFinite(estime) && Number.isFinite(reel)) mesures.push({ quand: c[0], quoi: c[1], estime, reel });
  }
  return { mesurable: true, mesures };
}

async function main() {
  printReportHeader({ tool: "agent-du-temps", title: "AGENT-DU-TEMPS — l'heure fiable, et la mémoire des estimations", scriptPath: "scripts/agent-du-temps.mjs" });
  printReliabilityNotice("agent-du-temps");
  recordCliUsage("agent-du-temps");
  const m = await maintenant();
  console.log("\n=== L'HEURE ===\n");
  if (!m.mesurable) { console.log(`PAS MESURÉ — ${m.pourquoi}`); }
  else {
    console.log(`  ${m.humain}   (${FUSEAU})`);
    console.log(`  horodatage de suivi (UTC, la forme que docs/suivi/ exige) : ${m.suivi}`);
    console.log(`  SOURCE : ${m.source}${m.via ? ` via ${m.via}` : ""}`);
    if (m.reserve) console.log(`  ⚠️  ${m.reserve}`);
    for (const e of m.essais ?? []) console.log(`     · ${e.nom} : ${e.pourquoi}`);
  }
  const h = lireMesures();
  console.log("\n=== LES ESTIMATIONS ===\n");
  if (!h.mesurable) console.log(`PAS MESURÉ — ${h.pourquoi}`);
  else {
    console.log(`  ${h.mesures.length} mesure(s) historisée(s)`);
    for (const x of h.mesures.slice(-5)) {
      const c = comparerAuReel(x.estime, x.reel);
      console.log(`  · ${x.quand} — ${x.quoi} : ${x.estime} min estimées, ${x.reel} réelles → ${c.verdict} (${c.ecartPct > 0 ? "+" : ""}${c.ecartPct} %)`);
    }
    const aj = ajusterDepuisHistorique(h.mesures);
    console.log(`\n  AJUSTEMENT : ${aj.mesurable ? `facteur ${aj.facteur} — ${aj.pourquoi}` : `pas encore — ${aj.pourquoi}`}`);
  }
  // LE TEMPS DE L'UTILISATEUR (2026-09-26, #913) — les sources sont chargées ICI plutôt qu'importées
  // en tête : un dépôt sans mode de travail ni suivi doit obtenir un « pas mesuré » avec sa raison,
  // jamais un plantage, et cet outil est le dernier qui devrait tomber (Article 32).
  let modeCourantLu = null;
  try { modeCourantLu = (await import("./modes-de-travail.mjs")).modeCourant(); } catch { /* déclaré par la fonction */ }
  console.log("");
  for (const l of formatTempsUtilisateurLines(tempsDeLUtilisateur({ mode: modeCourantLu }))) console.log(l);

  const ecarts = [];
  if (m.mesurable && m.source === "système") ecarts.push({ pourquoi: "l'heure vient de l'horloge locale : les API de temps sont refusées par la politique réseau de l'environnement, à autoriser si une heure indépendante de la machine est voulue" });
  if (!h.mesurable) ecarts.push({ pourquoi: "aucune mesure historisée : la première estimation comparée au réel n'a encore rien à ajuster" });
  const plan = planDactionDepuisEcarts(ecarts, { toolSlug: "agent-du-temps", tache: "autoriser un domaine de temps, ou acter que l'horloge système suffit — la décision est à l'utilisateur, jamais à l'agent" });
  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of plan.lignes) console.log(l);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
