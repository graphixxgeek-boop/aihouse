// ICEBERG: membre
// COÛT-DE-LA-REFONTE *(nom PROVISOIRE — les noms se choisissent par l'utilisateur, par séries, et
// celui-ci n'a pas été baptisé)*. Né le 2026-10-01 de sa proposition centrale du 30/09 au soir :
// « il faut partir sur un nouveau code totalement propre, et recommencer tout à zéro, en reprenant
// tout point par point : situer le cœur de l'agence, et agréger les modules autour. Franchement je
// serais partant pour faire ça. » Et de sa consigne de la nuit : « finis le chiffrage » (tâche #1344).
//
// POURQUOI UN OUTIL PLUTÔT QU'UNE ESTIMATION. Un chiffrage de refonte donné de tête est exactement
// le genre de nombre que ce projet a appris à se méfier : le « 38 fichiers sur 40 portent des
// chemins écrits en dur » a été répété toute une soirée comme ARGUMENT PRINCIPAL de la refonte, et
// il n'était pas reproductible (tâche #1354). Un chiffre qui pousse à l'action coûte infiniment
// plus cher qu'un chiffre qui rassure (XP #35). Celui-ci se rejoue.
//
// LA THÈSE QU'IL MESURE, ET ELLE N'EST PAS CELLE QU'ON ATTEND : le coût d'une refonte ne se compte
// pas en LIGNES. Du code mécanique se réécrit vite, et une grande partie se régénère toute seule.
// Ce qui ne se recopie pas, ce sont les RAISONS — ces blocs de commentaire qui disent pourquoi un
// garde-fou existe, quel bug il a déjà attrapé, quelle leçon l'a payé. Une refonte qui les perd
// réintroduit des bugs déjà résolus une fois (Article 19, pris à l'envers). Elle doit donc soit
// les relire tous, soit les regagner — et c'est CE volume-là qui décide du coût réel.
//
// CE QU'IL NE FAIT JAMAIS : recommander la refonte, ou la déconseiller. Il rend des volumes. La
// décision est à l'utilisateur, et elle est de celles que l'Article 16 réserve explicitement.
//
// ANTI-DOUBLON (§7ter) : la portabilité vient de SAFE-EXPORT, les registres de doc-report, les
// obligations par outil d'integration-outil — aucune n'est recalculée ici.

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { printReliabilityNotice, DEBUT_DOCUMENT_GENERE, FIN_DOCUMENT_GENERE } from "./lib-shell.mjs";
import { printReportHeader, planDactionDepuisEcarts, imprimerPlanDaction } from "./report-template.mjs";
import { recordCliUsage, recordRegistryWrite } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// LES QUATRE FAMILLES, et elles se DÉCLARENT parce qu'elles n'existent nulle part ailleurs sous
// cette forme : « tout reprendre à zéro » ne veut pas dire la même chose pour l'outillage (85
// scripts qu'on pourrait vouloir repenser) et pour le moteur du jeu (que sa consigne permanente
// interdit de toucher). Les confondre dans un volume global donnerait un chiffre vrai et inutile.
export const FAMILLES = Object.freeze([
  { cle: "outillage", libelle: "l'outillage de l'Agence", test: (p) => p.startsWith("scripts/") && !p.includes("install-"),
    refonte: "c'est CE périmètre que sa proposition vise" },
  { cle: "jeu", libelle: "le moteur du Jeu", test: (p) => p.startsWith("lib/") || p.startsWith("app/") || p.startsWith("components/"),
    refonte: "hors périmètre par sa consigne permanente : « rien qui change ce que Lia et Noé disent ou font »" },
  { cle: "normatif", libelle: "les documents qui font loi", test: (p) => p === "CLAUDE.md" || p === "docs/regles-de-travail.md" || p === "docs/philosophie-et-politique.md" || p.startsWith("docs/referentiel/"),
    refonte: "ne se réécrit pas : se relit, et chaque règle retirée est une décision humaine (Article 13)" },
  { cle: "registres", libelle: "les registres et rapports produits", test: (p) => p.startsWith("docs/") ,
    refonte: "se régénère ou s'archive — jamais à réécrire à la main" },
]);

export function familleDe(chemin) {
  for (const f of FAMILLES) if (f.test(chemin)) return f.cle;
  return "autre";
}

// LES MARQUEURS D'UNE RAISON ÉCRITE. Ce sont les formes que ce dépôt emploie RÉELLEMENT pour dire
// « voici pourquoi ceci existe » — relevées dans le code, jamais inventées. Un commentaire
// ordinaire (« boucle sur les fichiers ») n'en porte aucune et ne compte pas : ce qu'on mesure
// n'est pas la densité de commentaires, c'est la densité de DÉCISIONS DÉJÀ PRISES.
export const MARQUEURS_DE_RAISON = Object.freeze([
  /\bPOURQUOI\b/, /\bLA RAISON\b/, /\bpayée? le \d{4}-\d{2}-\d{2}/i, /\bleçon L\d+\b/i,
  /\bcorrigé le \d{4}-\d{2}-\d{2}/i, /\btrouvé(?:e)? (?:le|en) /i, /\bdécision (?:explicite|de l'utilisateur)\b/i,
  /\bArticle \d+\b/, /\bsa demande\b/i, /\bXP #\d+/, /\btâche #\d+/,
]);

// UNE LIGNE DE COMMENTAIRE, DANS LES DEUX FORMES QUE CE DÉPÔT EMPLOIE. Le JSDoc `*` est inclus
// parce que plusieurs outils l'utilisent pour leur bandeau de tête.
const EST_COMMENTAIRE = /^\s*(\/\/|\*|\/\*)/;

// blocsDeRaison() — on compte des BLOCS, jamais des lignes. Un bandeau de trente lignes qui
// explique une décision est UNE décision à reprendre, pas trente ; compter les lignes gonflerait
// le chiffre d'un facteur dix et le rendrait inutilisable pour décider.
export function blocsDeRaison(texte = "") {
  const lignes = texte.split("\n");
  let blocs = 0, dansUnBloc = false, blocPorteUneRaison = false, lignesDeRaison = 0;
  const cloturer = () => { if (dansUnBloc && blocPorteUneRaison) blocs += 1; dansUnBloc = false; blocPorteUneRaison = false; };
  for (const l of lignes) {
    if (EST_COMMENTAIRE.test(l)) {
      dansUnBloc = true;
      if (MARQUEURS_DE_RAISON.some((m) => m.test(l))) { blocPorteUneRaison = true; lignesDeRaison += 1; }
    } else if (l.trim() === "" && dansUnBloc) {
      // une ligne vide ne coupe pas un bloc : plusieurs bandeaux du dépôt en contiennent
      continue;
    } else cloturer();
  }
  cloturer();
  return { blocs, lignesDeRaison };
}

// concentration() — PARCE QU'UNE MOYENNE SEULE A MENTI AU PREMIER PASSAGE (2026-10-01). Le tout
// premier chiffre rendu était « 25,3 décisions déjà prises par fichier », qui dessinait un dépôt
// uniformément dense. La médiane est à 8, et `check-house.mjs` porte à lui seul près d'un tiers
// du total. Les deux chiffres sont vrais ; un seul des deux est utilisable pour décider.
export function concentration(parFichier = []) {
  if (!parFichier.length) return null;
  const tri = [...parFichier].sort((a, b) => b.blocs - a.blocs);
  const total = tri.reduce((s, x) => s + x.blocs, 0);
  if (!total) return null;
  const valeurs = tri.map((x) => x.blocs).sort((a, b) => a - b);
  const mediane = valeurs[Math.floor(valeurs.length / 2)];
  const tete = tri[0];
  const sansTete = total - tete.blocs;
  const fichiersSansTete = tri.length - 1;
  return {
    total, tete, mediane,
    moyenne: (total / tri.length).toFixed(1),
    partDeTete: Math.round((tete.blocs / total) * 100),
    sansTete, fichiersSansTete,
    moyenneSansTete: fichiersSansTete ? (sansTete / fichiersSansTete).toFixed(1) : "0",
  };
}

function lireLArbre(racine, root = ROOT) {
  const out = [];
  const pile = [racine];
  while (pile.length) {
    const courant = pile.pop();
    let entrees;
    try { entrees = readdirSync(join(root, courant), { withFileTypes: true }); } catch { continue; }
    for (const e of entrees) {
      const chemin = courant === "." ? e.name : `${courant}/${e.name}`;
      if (e.isDirectory()) { if (!/^(node_modules|\.git|\.next|dist|build)$/.test(e.name)) pile.push(chemin); continue; }
      out.push(chemin);
    }
  }
  return out;
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// LES PARTIES À RATIONALISER, DANS L'ORDRE — et ce qui ne l'est pas (2026-10-04, tâche #1571)
// ════════════════════════════════════════════════════════════════════════════════════════════════
//
// SA DEMANDE, ET C'EST UN INSTRUMENT DE PILOTAGE PLUTÔT QU'UNE LISTE : « il nous faut des reperes,
// pour voir au fur et à mesure les parties qui doivent etre rationnalisées […] la liste de TOUTES
// les parties à traiter dans le cadre de la rationnalisation, dans l'ordre ou nous allons le faire
// d'apres ton plan d'action ». Avec deux exigences explicites : l'ORDRE, et « la liste de ce qui
// n'est PAS rationalisable ».
//
// POURQUOI CETTE MESURE VIT ICI ET PAS DANS UN OUTIL DE PLUS (Article 31, issue « étendre ») :
// cet outil sait déjà compter le volume et les RAISONS écrites par famille, et c'est très
// exactement ce qu'il faut pour chiffrer une partie. Un outil séparé aurait porté une seconde
// copie de ce comptage, qui aurait fini par en diverger (leçon L29).
//
// LES PARTIES NE S'INVENTENT PAS : ce sont les MODULES déjà déclarés dans `MODULES_CIBLES`
// (le-coordinateur), lus à l'exécution. En écrire une liste ici aurait été la copie manuelle que
// l'Article 24 refuse — et elle se serait périmée au premier module ajouté.
//
// L'ORDRE NE S'INVENTE PAS NON PLUS, ET C'EST LE POINT DÉLICAT. Il se dérive d'un fait mesurable :
// un module dont les scripts sont IMPORTÉS par d'autres modules passe AVANT eux. Rationaliser un
// socle après ce qui s'appuie dessus oblige à refaire les dépendants ; l'inverse n'est jamais vrai.
// À dépendance égale, le plus LOURD d'abord (plus de volume = plus à gagner, et le gros morceau
// tard dans un chantier est celui qu'on repousse).
// CE QUE CET ORDRE N'EST PAS : une priorité d'importance. Il dit dans quel ordre le travail coûte
// le moins cher, jamais ce qui compte le plus — cet arbitrage-là lui revient (Article 16).

export const FICHIER_DES_PARTIES = "docs/cout-de-la-refonte/parties-a-rationaliser.md";
export const MOTIF_IMPORT_LOCAL = /\bfrom\s+["']\.\/([a-z0-9._-]+\.mjs)["']/gi;

export function scriptsDUnModule(module, { prestations = [], scriptsParSlug = {}, normaliser = (x) => x } = {}) {
  const noms = new Set();
  for (const nom of module?.prestations ?? []) {
    const p = prestations.find((x) => x.nom === nom);
    for (const o of p?.outils ?? []) noms.add(normaliser(o));
  }
  const scripts = new Set();
  for (const [slug, chemin] of Object.entries(scriptsParSlug)) {
    if (noms.has(normaliser(slug))) scripts.add(chemin);
  }
  return { outils: [...noms].sort(), scripts: [...scripts].sort() };
}

// LE GRAPHE ENTRE MODULES — lu dans les imports réels, jamais déclaré.
export function dependancesEntreModules(parModule = {}, { lire = null } = {}) {
  const proprietaire = new Map();
  for (const [cle, m] of Object.entries(parModule)) for (const s of m.scripts) proprietaire.set(s.replace(/^scripts\//, ""), cle);
  const arcs = new Map(Object.keys(parModule).map((c) => [c, new Set()]));
  for (const [cle, m] of Object.entries(parModule)) {
    for (const chemin of m.scripts) {
      let src = "";
      try { src = String(lire ? lire(chemin) : ""); } catch { continue; }
      for (const [, fichier] of src.matchAll(MOTIF_IMPORT_LOCAL)) {
        const autre = proprietaire.get(fichier);
        // Un module ne dépend jamais de lui-même : un import interne ne dit rien sur l'ordre.
        if (autre && autre !== cle) arcs.get(cle).add(autre);
      }
    }
  }
  return arcs;
}

// L'ORDRE : les fournisseurs d'abord. Un cycle NE SE CASSE PAS EN SILENCE — il se nomme, parce
// qu'un ordre inventé au milieu d'un cycle serait un ordre faux qui a l'air juste (leçon L4).
export function ordonnerLesParties(parModule = {}, arcs = new Map(), { poids = () => 0 } = {}) {
  const restants = new Map(Object.entries(parModule).map(([c]) => [c, new Set(arcs.get(c) ?? [])]));
  const dependants = (c) => [...arcs.values()].filter((d) => d.has(c)).length;
  const ordre = [];
  const cycles = [];
  while (restants.size) {
    const prets = [...restants.entries()].filter(([, deps]) => [...deps].every((d) => !restants.has(d))).map(([c]) => c);
    if (!prets.length) {
      // TOUT CE QUI RESTE EST PRIS DANS UN CYCLE, ET C'EST LE CAS RÉEL ICI : mesuré le
      // 2026-10-04, SEPT modules sur neuf s'importent mutuellement. L'ordre par dépendance
      // n'existe donc pas, et prétendre en rendre un serait rendre un ordre faux qui a l'air
      // juste. On le DIT, et on bascule sur un critère qui discrimine encore à l'intérieur du
      // cycle : le plus DEMANDÉ d'abord — celui dont le plus de modules dépendent coûte le plus
      // cher à refaire en dernier — puis le plus lourd à égalité.
      const bloques = [...restants.keys()].sort((a, b) => (dependants(b) - dependants(a)) || (poids(b) - poids(a)));
      cycles.push([...bloques]);
      for (const c of bloques) { ordre.push(c); restants.delete(c); }
      break;
    }
    for (const c of prets.sort((a, b) => poids(b) - poids(a))) { ordre.push(c); restants.delete(c); }
  }
  return { ordre, cycles };
}

export function partiesARationaliser({ root = ROOT, lire = null, modules = null, prestations = null, scriptsParSlug = null, normaliser = null, cout = null } = {}) {
  const lireF = lire ?? ((c) => readFileSync(join(root, c), "utf8"));
  if (!modules?.length || !prestations?.length || !scriptsParSlug || !Object.keys(scriptsParSlug).length) {
    return { mesurable: false, pourquoi: "il manque la carte des modules, le catalogue des prestations ou la table slug→script : une liste de parties produite sans eux serait une liste écrite à la main, c'est-à-dire exactement ce que l'Article 24 refuse" };
  }
  const norm = normaliser ?? ((x) => String(x).toLowerCase());
  const parModule = {};
  for (const m of modules) {
    const { outils, scripts } = scriptsDUnModule(m, { prestations, scriptsParSlug, normaliser: norm });
    let lignes = 0, raisons = 0, lus = 0;
    for (const chemin of scripts) {
      let src = null;
      try { src = String(lireF(chemin)); } catch { src = null; }
      if (src === null) continue;
      lus += 1;
      lignes += src.split("\n").length;
      raisons += blocsDeRaison(src).blocs;
    }
    parModule[m.cle] = { cle: m.cle, titre: m.titre, quoi: m.quoi, outils, scripts, scriptsLus: lus, lignes, raisons };
  }
  const arcs = dependancesEntreModules(parModule, { lire: (c) => lireF(c) });
  const poids = (c) => parModule[c]?.lignes ?? 0;
  const { ordre, cycles } = ordonnerLesParties(parModule, arcs, { poids });
  const lignesOrdonnees = ordre.map((c, i) => ({
    rang: i + 1, ...parModule[c],
    dependDe: [...(arcs.get(c) ?? [])].sort(),
    fournitA: Object.keys(parModule).filter((a) => (arcs.get(a) ?? new Set()).has(c)).sort(),
  }));
  return {
    mesurable: true, parties: lignesOrdonnees, cycles,
    total: lignesOrdonnees.length,
    totalLignes: lignesOrdonnees.reduce((a, x) => a + x.lignes, 0),
    totalRaisons: lignesOrdonnees.reduce((a, x) => a + x.raisons, 0),
    horsPortee: "l'ordre dit dans quel ordre le travail coûte le MOINS CHER — un fournisseur avant ses clients — jamais ce qui compte le plus. La priorité d'importance est un arbitrage qui lui revient (Article 16). Et le poids est un VOLUME, jamais une DIFFICULTÉ.",
    cout,
  };
}

// CE QUI N'EST PAS RATIONALISABLE — sa seconde exigence, et chaque entrée porte SA raison, déjà
// écrite ailleurs dans le dépôt plutôt que décidée ici. Un périmètre exclu sans raison écrite est
// un abandon déguisé (Article 28, état « écarté »).
export function ceQuiNEstPasRationalisable({ familles = FAMILLES, exemptes = null, cout = null } = {}) {
  const lignes = [];
  for (const f of familles) {
    if (f.cle === "outillage") continue;   // c'est précisément le périmètre visé
    lignes.push({
      quoi: f.libelle, pourquoi: f.refonte, source: "FAMILLES (cout-de-la-refonte)",
      fichiers: cout?.par?.[f.cle]?.fichiers ?? null, lignes: cout?.par?.[f.cle]?.lignes ?? null,
    });
  }
  // LES DISPENSES DU KIT D'EXPORT SONT UN TABLEAU D'ENTRÉES `{ motif, pourquoi }`, et le premier
  // jet les lisait comme un dictionnaire : la sortie rendait « 0 → [object Object] », treize fois.
  // Un lecteur qui se trompe de forme ne plante pas, il imprime du bruit crédible.
  for (const e of Array.isArray(exemptes) ? exemptes : []) {
    const quoi = e?.quoi ?? (e?.motif instanceof RegExp ? String(e.motif) : null);
    if (!e?.pourquoi) continue;
    lignes.push({ quoi: quoi ?? "(dispense sans libellé)", pourquoi: String(e.pourquoi), source: "EXEMPTES_DU_KIT (safe-export)", fichiers: null, lignes: null });
  }
  if (!lignes.length) {
    return { mesurable: false, pourquoi: "aucun périmètre exclu n'a pu être lu : rendre « tout est rationalisable » sur zéro lecture serait un satisfecit sur du vide (leçons L5/L11)" };
  }
  return { mesurable: true, lignes, total: lignes.length };
}

export function formatPartiesLines(r = {}, exclu = {}) {
  const L = [];
  L.push("--- LES PARTIES À RATIONALISER, DANS L'ORDRE — les fournisseurs avant leurs clients");
  if (!r.mesurable) { L.push(`  PAS MESURÉ — ${r.pourquoi}`); } else {
    L.push(`  ${r.total} partie(s) · ${r.totalLignes} ligne(s) d'outillage · ${r.totalRaisons} raison(s) écrite(s) à relire en chemin`);
    L.push("");
    L.push("  | # | Partie | Outils | Lignes | Raisons | Dépend de | Fournit à |");
    L.push("  |---|---|---|---|---|---|---|");
    for (const p of r.parties) {
      L.push(`  | ${p.rang} | **${p.titre}** | ${p.outils.length} | ${p.lignes} | ${p.raisons} | ${p.dependDe.join(", ") || "—"} | ${p.fournitA.join(", ") || "—"} |`);
    }
    if (r.cycles.length) {
      L.push("");
      for (const c of r.cycles) {
        L.push(`  ⚠️ CYCLE DE DÉPENDANCES — ${c.join(" ↔ ")}`);
        L.push(`     ${c.length} module(s) sur ${r.total} s'importent mutuellement : il n'existe AUCUN ordre par dépendance entre eux, et en rendre un serait rendre un ordre faux qui a l'air juste.`);
        L.push("     Ordre de repli, déclaré : le plus DEMANDÉ d'abord (celui dont le plus de modules dépendent coûte le plus cher à refaire en dernier), puis le plus lourd à égalité.");
        L.push("     C'EST AUSSI UN RÉSULTAT EN SOI : la modularisation qu'il vise n'est pas gratuite, puisque les modules d'aujourd'hui ne forment pas des paquets détachables.");
      }
    }
    L.push("");
    L.push(`  HORS PORTÉE : ${r.horsPortee}`);
  }
  L.push("");
  L.push("  À NE PAS CONFONDRE : la partie « LE JEU » ci-dessus désigne les OUTILS qui regardent le jeu (le ton, le rendu, les simulations), jamais le moteur du jeu lui-même — celui-ci figure dans la liste des exclusions, juste en dessous.");
  L.push("");
  L.push("--- CE QUI N'EST PAS RATIONALISABLE — sa seconde exigence, chaque exclusion avec sa raison ÉCRITE");
  if (!exclu?.mesurable) { L.push(`  PAS MESURÉ — ${exclu?.pourquoi}`); return L; }
  for (const x of exclu.lignes) {
    const taille = x.fichiers ? ` (${x.fichiers} fichier(s)${x.lignes ? `, ${x.lignes} ligne(s)` : ""})` : "";
    L.push(`  · ${x.quoi}${taille}`);
    L.push(`      → ${x.pourquoi}  [${x.source}]`);
  }
  return L;
}

export function mesurerLeCout({ root = ROOT, lire = readFileSync, arbre = null } = {}) {
  const fichiers = arbre ?? [
    ...lireLArbre("scripts", root), ...lireLArbre("lib", root), ...lireLArbre("app", root),
    ...lireLArbre("components", root), ...lireLArbre("docs", root), "CLAUDE.md",
  ];
  const par = {};
  for (const f of FAMILLES) par[f.cle] = { fichiers: 0, lignes: 0, blocsDeRaison: 0, parFichier: [] };
  par.autre = { fichiers: 0, lignes: 0, blocsDeRaison: 0, parFichier: [] };

  let lus = 0;
  for (const chemin of fichiers) {
    if (!/\.(mjs|js|ts|tsx|md)$/.test(chemin)) continue;
    let texte;
    try { texte = lire(join(root, chemin), "utf8"); } catch { continue; }
    lus += 1;
    const cle = familleDe(chemin);
    const b = par[cle] ?? par.autre;
    b.fichiers += 1;
    b.lignes += texte.split("\n").length;
    if (/\.(mjs|js|ts|tsx)$/.test(chemin)) {
      const n = blocsDeRaison(texte).blocs;
      b.blocsDeRaison += n;
      b.parFichier.push({ chemin, blocs: n });
    }
  }

  // LE REFUS DE CONCLURE SUR RIEN (leçons L5/L11) : un dénominateur nul rend PAS MESURÉ, jamais
  // « 0 ligne à reprendre », qui se lirait comme « rien à faire » au lieu de « je n'ai rien lu ».
  if (!lus) return { mesurable: false, pourquoi: "aucun fichier lisible : le chiffrage n'a pas de corpus, et un volume rendu sur zéro fichier se lirait comme un volume faible" };

  return { mesurable: true, fichiersLus: lus, par };
}

// ————————————————————————————————————————————————————————————————————————
// CE QUE LA REFONTE NE CHANGERAIT PAS — le contrepoids, et il est obligatoire
// ————————————————————————————————————————————————————————————————————————
// Un outil qui ne mesure que le coût d'une option la fait perdre d'office. Les dimensions déjà à
// 100 % sont des acquis que la refonte REMET EN JEU — elles appartiennent au chiffrage autant que
// le volume. Elles sont LUES chez SAFE-EXPORT, jamais recalculées ici (anti-doublon §7ter).
export async function acquisRemisEnJeu({ importer = () => import("./safe-export.mjs") } = {}) {
  try {
    const se = await importer();
    const r = se.rapportExportCentral(await se.mesuresDeLExport());
    if (!r?.mesurees) return { mesurable: false, pourquoi: "SAFE-EXPORT n'a mesuré aucune dimension : les acquis ne sont pas lisibles d'ici, et les inventer serait pire que de les taire" };
    // LE CHAMP S'APPELLE `valeur`, PAS `pct` — et la première version lisait `pct`, qui n'existe
    // pas : elle rendait « aucune dimension à 100 % » alors que SIX le sont. Un zéro par mauvais
    // champ ressemble trait pour trait à un zéro mesuré, et celui-ci faisait disparaître tout le
    // contrepoids du chiffrage — c'est-à-dire qu'il faisait pencher la décision tout seul.
    // Attrapé en comparant au rapport que SAFE-EXPORT imprime lui-même (Article 25).
    const acquis = (r.sait ?? []).filter((d) => typeof d.valeur === "number" && d.valeur >= 100);
    return { mesurable: true, total: r.total, mesurees: r.mesurees, global: r.global,
      acquis: acquis.map((d) => ({ quoi: d.quoi ?? d.question ?? d.cle, pct: d.valeur })) };
  } catch (e) {
    return { mesurable: false, pourquoi: `SAFE-EXPORT n'a pas pu être interrogé (${e.message}) — le chiffrage rendrait alors le coût SANS son contrepoids, ce qui ferait pencher la décision tout seul` };
  }
}

export function formatLines(m, acquis) {
  const L = [];
  L.push("=== CE QUE COÛTERAIT UNE REFONTE COMPLÈTE — en volumes, jamais en avis ===");
  L.push("");
  if (!m.mesurable) { L.push(`PAS MESURÉ — ${m.pourquoi}`); return L; }
  L.push(`${m.fichiersLus} fichier(s) lus. C'est le dénominateur de tout ce qui suit.`);
  L.push("");
  L.push("--- ① LE VOLUME, PAR FAMILLE — parce que « tout » ne veut pas dire la même chose partout");
  for (const f of FAMILLES) {
    const b = m.par[f.cle];
    if (!b.fichiers) continue;
    L.push(`  ${f.libelle} : ${b.fichiers} fichier(s), ${b.lignes} ligne(s)${b.blocsDeRaison ? `, ${b.blocsDeRaison} bloc(s) de raison` : ""}`);
    L.push(`      → ${f.refonte}`);
  }
  L.push("");
  const outillage = m.par.outillage;
  L.push("--- ② CE QUI NE SE RECOPIE PAS — les RAISONS, et c'est le vrai chiffre");
  L.push(`  ${outillage.blocsDeRaison} bloc(s) de commentaire de l'outillage portent une raison écrite :`);
  L.push("  un POURQUOI, une leçon payée, un bug déjà attrapé, une décision datée de l'utilisateur.");
  L.push("  Du code mécanique se réécrit vite. Une raison, elle, se relit ou se REGAGNE — et une");
  L.push("  refonte qui la perd réintroduit un bug déjà résolu une fois (Article 19, pris à l'envers).");
  // LA MOYENNE SEULE MENTIRAIT, ET ELLE MENTAIT AU PREMIER PASSAGE. 25,3 par fichier donnait
  // l'image d'un dépôt uniformément dense ; la MÉDIANE est à 8, et UN SEUL fichier porte un tiers
  // du total. Le coût n'est donc pas réparti — il est concentré, ce qui change complètement ce
  // qu'on peut en faire : on peut traiter la concentration, on ne traite pas une moyenne.
  const c = concentration(outillage.parFichier);
  if (c) {
    L.push(`  Répartition : ${c.moyenne} par fichier en MOYENNE, mais ${c.mediane} en MÉDIANE —`);
    L.push(`  et le fichier le plus chargé (${c.tete.chemin}) en porte ${c.tete.blocs} à lui seul, soit ${c.partDeTete} % du total.`);
    L.push(`  Hors lui : ${c.sansTete} bloc(s) sur ${c.fichiersSansTete} fichier(s), ${c.moyenneSansTete} par fichier.`);
    L.push("  LE COÛT N'EST DONC PAS RÉPARTI, IL EST CONCENTRÉ — et une concentration se traite, là où une moyenne ne se traite pas.");
  }
  L.push("");
  L.push("--- ③ CE QUE LA REFONTE REMETTRAIT EN JEU — le contrepoids");
  if (!acquis.mesurable) L.push(`  PAS MESURÉ — ${acquis.pourquoi}`);
  else if (!acquis.acquis.length) L.push(`  aucune des ${acquis.total} dimension(s) mesurées n'est à 100 % : la refonte ne remet aucun acquis complet en jeu`);
  else {
    L.push(`  Exportabilité globale AUJOURD'HUI : ${acquis.global} % sur ${acquis.mesurees} dimension(s) réellement mesurée(s).`);
    L.push(`  ${acquis.acquis.length} d'entre elles sont à 100 %. Une refonte les repart à zéro :`);
    for (const a of acquis.acquis) L.push(`    · ${a.quoi}`);
  }
  L.push("");
  L.push("HORS PORTÉE, et il faut le lire avant d'utiliser ces chiffres : il mesure un VOLUME, jamais une DIFFICULTÉ.");
  L.push("Mille lignes mécaniques coûtent moins que cent lignes subtiles, et aucun programme ne fait la différence.");
  L.push("Il ne recommande RIEN : la décision de refonte est à l'utilisateur, et elle est de celles que l'Article 16 lui réserve.");
  return L;
}

async function main() {
  printReportHeader({ tool: "cout-de-la-refonte", title: "CE QUE COÛTERAIT UNE REFONTE COMPLÈTE", scriptPath: "scripts/cout-de-la-refonte.mjs" });
  printReliabilityNotice("cout-de-la-refonte");
  recordCliUsage("cout-de-la-refonte");
  const m = mesurerLeCout();
  const a = await acquisRemisEnJeu();
  for (const l of formatLines(m, a)) console.log(l);

  // LES PARTIES À RATIONALISER (tâche #1571) — rendues à CHAQUE passage plutôt que derrière un
  // drapeau : une vue qu'il faut penser à demander est une vue qu'on oubliera le jour où elle
  // compte, et c'est précisément le « repère » qu'il a demandé pour suivre l'avancement.
  const lc = await import("./le-coordinateur.mjs");
  const axa = await import("./axa-check.mjs");
  const se = await import("./safe-export.mjs").catch(() => ({}));
  const parties = partiesARationaliser({
    modules: lc.MODULES_CIBLES, prestations: lc.PRESTATIONS,
    scriptsParSlug: axa.AGENT_SCRIPT_FILES, normaliser: lc.normaliserNomDOutil, cout: m,
  });
  const exclu = ceQuiNEstPasRationalisable({ exemptes: se.EXEMPTES_DU_KIT, cout: m });
  const lignesParties = formatPartiesLines(parties, exclu);
  console.log("");
  for (const l of lignesParties) console.log(l);

  // LE LIVRABLE EST LE FICHIER (Article 31, faille 3), nom STABLE : c'est un état courant qui se
  // réécrit, jamais un instantané qu'on empile.
  try { mkdirSync(join(ROOT, "docs/cout-de-la-refonte"), { recursive: true }); } catch { /* déjà là */ }
  const t = await import("./agent-du-temps.mjs").then((x) => x.maintenant()).catch(() => null);
  const corps = [
    DEBUT_DOCUMENT_GENERE,
    "# Les parties à rationaliser, dans l'ordre — et ce qui ne l'est pas",
    "",
    `> Produit par \`node scripts/cout-de-la-refonte.mjs\` le ${t?.suivi ?? ""}${t?.source ? ` (heure de source ${t.source})` : ""}, en lisant la carte des modules, le catalogue des prestations et les imports réels entre scripts.`,
    "> Ta demande : « la liste de TOUTES les parties à traiter dans le cadre de la rationnalisation, dans l'ordre ou nous allons le faire d'apres ton plan d'action […] Hors ce qui n'est pas rationnalisable ».",
    "",
    "**Rien ici n'est écrit à la main.** Les parties sont les modules déjà déclarés, l'ordre se dérive des imports réels, et chaque exclusion porte la raison déjà écrite ailleurs dans le dépôt.",
    "",
    "```",
    ...lignesParties,
    "```",
    "",
    FIN_DOCUMENT_GENERE,
  ];
  writeFileSync(join(ROOT, FICHIER_DES_PARTIES), corps.join("\n") + "\n", "utf8");
  recordRegistryWrite(FICHIER_DES_PARTIES, { par: "cout-de-la-refonte" });
  console.log(`\nParties déposées : ${FICHIER_DES_PARTIES} — réécrit à chaque passage.`);

  const ecarts = [];
  if (!parties.mesurable) ecarts.push({ message: `les parties à rationaliser n'ont pas pu être mesurées : ${parties.pourquoi}`, quoiFaire: "rétablir la lecture de la carte des modules avant de planifier quoi que ce soit", numeroTache: 1571 });
  else if (parties.cycles.length) ecarts.push({ aTrancher: true, message: `${parties.cycles[0].length} module(s) sur ${parties.total} s'importent mutuellement : il n'existe aucun ordre par dépendance entre eux`, quoiFaire: "trancher si la modularisation visée exige de casser ce cycle (gros chantier) ou si l'ordre de repli — le plus demandé d'abord — suffit comme feuille de route", numeroTache: 1571 });
  ecarts.push({ aTrancher: true, message: "le document des parties vit chez l'outil, alors que sa demande dit « à enregistrer DANS la stratégie de rationalisation » — laquelle n'existe pas encore", quoiFaire: "décider s'il faut créer une fiche de stratégie de rationalisation dans `docs/strategies/` et y renvoyer ce document, ou laisser l'outil seul propriétaire — créer une stratégie à sa place serait décider pour lui (Article 16)", numeroTache: 1571 });
  if (m.mesurable && m.par.outillage.blocsDeRaison > 0) {
    ecarts.push({
      message: `${m.par.outillage.blocsDeRaison} raison(s) écrite(s) dans l'outillage seraient à relire une par une avant toute refonte`,
      quoiFaire: "décider ce qu'on fait de chacune : la reprendre, la regagner, ou l'abandonner en écrivant pourquoi — jamais la perdre par omission",
      numeroTache: 1344,
    });
  }
  console.log("");
  // DEUX DES CONSTATS NE SONT PAS DES CORRECTIFS, CE SONT DES DÉCISIONS QUI LUI REVIENNENT
  // (Article 16/28) : les ranger en « retenu » laisserait croire qu'un agent peut les clore seul.
  imprimerPlanDaction(planDactionDepuisEcarts(ecarts, {
    toolSlug: "cout-de-la-refonte", numeroTache: (e) => e.numeroTache,
    etat: (e) => (e.aTrancher ? "a-trancher" : "retenu"),
    pourquoi: (e) => (e.aTrancher ? e.quoiFaire : null),
  }));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
