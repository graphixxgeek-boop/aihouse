// PURE-GOLD-UNITY (2026-09-22, demande de l'utilisateur : « je veux un outil qui scan les scripts
// non unifiés »). Le gabarit unifié des rapports existe depuis le matin même (report-template.mjs :
// un seul contrat, deux rendus, un emplacement générique d'en-tête) et la liste des outils TENUS de
// l'appliquer existe aussi (toolsBoundByReportTemplate, doc-report.mjs). Ce qui manquait est le
// tiers manquant, et c'est tout l'objet de cet outil : vérifier qu'ils l'appliquent RÉELLEMENT.
//
// LA DISTINCTION QUI JUSTIFIE SON EXISTENCE : « devoir » et « faire » ne sont pas la même chose, et
// tout ce paysage d'outils existe parce que cette confusion revient sans arrêt. Une obligation
// inscrite dans un registre ressemble à une garantie ; elle n'en est une que le jour où quelque
// chose la vérifie. Première mesure réelle, le jour de sa construction : 11 outils sur 29 passaient
// par un rendu partagé, 18 non — l'obligation existait depuis le matin et n'avait rien changé.
//
// CE QU'IL NE FAIT JAMAIS : migrer un outil tout seul. Convertir un rapport, c'est réécrire du texte
// que quelqu'un lit — ça se fait à la main, en relisant le avant/après. Il signale, il mesure, il
// classe par difficulté ; la conversion reste un geste humain (décision de l'utilisateur, 2026-09-22 :
// « signaler et tout migrer maintenant, en verifiant bien le travail et en fiabilisant »).
//
// ANTI-DOUBLON (§7ter) : la liste des outils tenus vient de doc-report.mjs, jamais recopiée ici.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { toolsBoundByReportTemplate, findRapportsQuiPointent, REGISTRIES } from "./doc-report.mjs";
import { findOutilsSansPlanDaction, SANS_CONSTAT_PROPRE } from "./report-template.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// Les trois façons dont un outil peut être en règle, de la meilleure à la plus faible. L'ordre
// compte : `buildReportFrame` est la seule qui garantit TOUT le gabarit (titre obligatoire, date,
// emplacement générique rempli depuis les registres partagés) ; `renderHtmlReport` y passe désormais
// aussi en interne, donc l'appeler suffit ; `renderTextReport` accepte encore un objet brut, qu'il
// convertit lui-même — correct, mais sans garantie que l'appelant ait pensé à passer son `tool`.
export const VOIES_CONFORMES = [
  { marqueur: /printReportHeader\s*\(/, voie: "en-tête partagé", note: 3 },
  { marqueur: /buildReportFrame\s*\(/, voie: "cadre complet", note: 3 },
  { marqueur: /renderHtmlReport\s*\(/, voie: "rendu HTML partagé", note: 3 },
  { marqueur: /renderTextReport\s*\(/, voie: "rendu texte partagé", note: 2 },
];

// Un outil qui écrit un rapport sans passer par aucune de ces voies l'écrit à la main. On mesure
// alors À QUEL POINT il est loin, pour que la migration commence par les cas les plus simples.
const INDICES_MANUELS = [
  { marqueur: /console\.log\(\s*[`'"]===/, indice: "écrit son propre titre en dur" },
  { marqueur: /new Date\(\)\.toISOString\(\)/, indice: "date sa sortie lui-même" },
  { marqueur: /printReliabilityNotice\s*\(/, indice: "imprime l'avertissement à part, hors du cadre" },
  { marqueur: /writeFileSync\s*\(/, indice: "écrit un fichier de rapport directement" },
];

export function auditToolUnity(scriptPath, { root = ROOT, readFileImpl = readFileSync } = {}) {
  let source;
  try {
    source = readFileImpl(join(root, scriptPath), "utf8");
  } catch {
    // Un fichier illisible n'est PAS un outil non conforme : c'est une mesure impossible, et la
    // confondre avec un manquement serait exactement l'erreur que ce paysage passe son temps à
    // corriger (une absence de mesure présentée comme une mesure).
    return { scriptPath, mesurable: false, raison: "fichier introuvable ou illisible" };
  }
  const voies = VOIES_CONFORMES.filter((v) => v.marqueur.test(source));
  const indices = INDICES_MANUELS.filter((i) => i.marqueur.test(source)).map((i) => i.indice);
  return {
    scriptPath,
    mesurable: true,
    conforme: voies.length > 0,
    voies: voies.map((v) => v.voie),
    note: voies.length ? Math.max(...voies.map((v) => v.note)) : 0,
    indicesManuels: indices,
    // Plus un outil a d'indices de rédaction manuelle, plus sa conversion demande d'attention.
    difficulte: voies.length ? "déjà conforme" : indices.length >= 3 ? "lourde" : indices.length === 2 ? "moyenne" : "légère",
  };
}

export function scanUnity({ root = ROOT, readFileImpl = readFileSync, tools } = {}) {
  const liste = tools ?? toolsBoundByReportTemplate();
  const resultats = liste.map((p) => auditToolUnity(p, { root, readFileImpl }));
  const mesurables = resultats.filter((r) => r.mesurable);
  const conformes = mesurables.filter((r) => r.conforme);
  return {
    total: liste.length,
    mesurables: mesurables.length,
    nonMesurables: resultats.filter((r) => !r.mesurable).map((r) => `${r.scriptPath} — ${r.raison}`),
    conformes: conformes.length,
    aMigrer: mesurables.filter((r) => !r.conforme),
    // Le pourcentage porte sur ce qui a pu être mesuré, jamais sur le total : un fichier illisible
    // ne compte ni comme conforme ni comme fautif.
    pourcentage: mesurables.length ? Math.round((conformes.length / mesurables.length) * 100) : undefined,
    resultats,
  };
}

// Par où commencer. Les conversions légères d'abord : elles se vérifient vite, et chacune réduit
// l'écart sans risquer d'abîmer un rapport que l'utilisateur lit vraiment.
export function migrationOrder(scan) {
  const rang = { légère: 0, moyenne: 1, lourde: 2 };
  return [...scan.aMigrer].sort((a, b) => (rang[a.difficulte] ?? 3) - (rang[b.difficulte] ?? 3) || a.scriptPath.localeCompare(b.scriptPath));
}

export function formatUnityReport(scan) {
  const lignes = [];
  lignes.push(`Outils tenus par le gabarit : ${scan.total}${scan.mesurables !== scan.total ? ` (${scan.mesurables} réellement mesurables)` : ""}`);
  lignes.push(`Conformes : ${scan.conformes}/${scan.mesurables}${scan.pourcentage !== undefined ? ` (${scan.pourcentage} %)` : ""}`);
  if (scan.nonMesurables.length) lignes.push(`⚠️ Non mesurables (${scan.nonMesurables.length}) : ${scan.nonMesurables.join(" ; ")}`);
  if (!scan.aMigrer.length) {
    lignes.push("✅ Tous les rapports mesurables passent par le gabarit partagé.");
    return lignes.join("\n");
  }
  lignes.push("", `À migrer (${scan.aMigrer.length}), des plus simples aux plus lourdes :`);
  for (const r of migrationOrder(scan)) {
    lignes.push(`  [${r.difficulte}] ${r.scriptPath}${r.indicesManuels.length ? ` — ${r.indicesManuels.join(", ")}` : " — aucun indice de rédaction manuelle trouvé (à vérifier à la main : produit-il vraiment un rapport ?)"}`);
  }
  lignes.push("", "La conversion reste un geste manuel : convertir un rapport, c'est réécrire du texte que quelqu'un lit.");
  return lignes.join("\n");
}


// ————————————————————————————————————————————————————————————————————————
// LES TROIS CRITÈRES D'UN RAPPORT COMPLET (2026-09-23, demande explicite de l'utilisateur :
// « vérifie encore que TOUS les rapports sont bien 1/ avec du contenu 2/ des dates [en toutes
// lettres] 3/ une analyse avec plan d'action, le cas échéant [...] chez quel outil est cette
// responsabilité ? »)
// ————————————————————————————————————————————————————————————————————————
//
// LA RÉPONSE HONNÊTE À SA QUESTION, telle qu'elle était avant ce commit : NULLE PART. Les trois
// critères existaient bel et bien, mais chacun chez un outil différent et sans que personne ne
// prononce le verdict d'ensemble :
//   · le CONTENU  → findRapportsQuiPointent() (doc-report) — construite, testée, et JAMAIS APPELÉE
//                   par aucun main() : elle ne vivait que dans check-house.mjs ;
//   · la DATE     → le gabarit partagé, seul critère que cet outil mesurait déjà ;
//   · le PLAN     → findOutilsSansPlanDaction() (report-template), constatée par god-of-all-process.
//
// Trois moitiés de réponse ne font pas une réponse. C'est le patron de la journée pour la sixième
// fois : un mécanisme qui existe, que rien ne fait sortir. La responsabilité atterrit ICI parce que
// c'est l'outil dont le nom dit exactement ça — les rapports sont-ils conformes — et qu'il n'en
// vérifiait qu'un tiers.
//
// ANTI-DOUBLON (§7ter) : les trois détecteurs sont RELAYÉS, jamais réécrits. Cet outil ne sait rien
// qu'un autre ne sache déjà ; sa valeur est de poser les trois questions au même endroit.
export const CRITERES_RAPPORT = [
  { clef: "contenu", question: "le rapport porte-t-il de la donnée, ou renvoie-t-il ailleurs ?" },
  { clef: "date", question: "le rapport se date-t-il lui-même, en toutes lettres ?" },
  { clef: "plan", question: "le rapport conclut-il par un plan d'action, le cas échéant ?" },
  { clef: "complet", question: "le rapport sort-il TOUT ce que l'outil sait déjà détecter ?" },
];


// ————————————————————————————————————————————————————————————————————————
// QUATRIÈME CRITÈRE : LE RAPPORT SORT-IL TOUT CE QUE L'OUTIL SAIT ? (2026-09-23, tâche #211)
// ————————————————————————————————————————————————————————————————————————
//
// D'OÙ IL VIENT. La tâche demandait de câbler un plan d'action sur les 20 outils qui n'en avaient
// pas. Impossible d'écrire un plan honnête sans savoir ce que chaque outil calcule — et c'est en
// regardant que le vrai trou est apparu : 27 détecteurs exportés ne sont appelés par le `main()`
// d'aucun outil. Vérification faite avant d'accuser : 12 sont légitimement RELAYÉS par un autre
// outil (l'idiome du projet, `findOrphanReportFiles` par exemple sert à trois appelants). Les 15
// autres ne sortent de nulle part : construits, exportés, testés, et appelés par la seule suite de
// tests.
//
// NEUF SUR QUINZE SONT DANS UN SEUL OUTIL, ecotoken — qui contient donc dix détecteurs et n'en
// exécute qu'un. Un rapport qui tourne sans rien dire de ce qu'il sait déjà voir.
//
// POURQUOI C'EST UN CRITÈRE DE RAPPORT et non une curiosité de code : les trois premiers demandent
// si le rapport a du contenu, une date, une conclusion. Celui-ci demande si ce contenu est TOUT ce
// que l'outil avait à dire. Un détecteur muet est la forme la plus coûteuse du défaut que ce projet
// traque partout — on a payé sa construction, ses tests, sa documentation, et il ne trouvera jamais
// rien pour personne.
//
// CE QU'IL NE DIT PAS : qu'un détecteur muet est inutile. Peut-être son appelant reste à écrire.
// Il dit que PERSONNE ne l'appelle aujourd'hui, ce qui est un fait, jamais un jugement de valeur.
export const DETECTEUR_RE = /^export function (find\w+|detect\w+)/gm;

export function detecteursDe(source = "") {
  return [...String(source).matchAll(DETECTEUR_RE)].map((m) => m[1]);
}

// EXEMPTION DÉCLARÉE, jamais devinée : un mécanisme volontairement partagé entre plusieurs outils
// n'a pas de `main()` à lui, donc l'absence d'appel local y est normale et non un oubli.
export const SANS_MAIN_PROPRE = {
  "lib-json": "mécanisme partagé, aucun main()",
  "lib-shell": "mécanisme partagé, aucun main()",
  "lib-markdown-table": "mécanisme partagé, aucun main()",
  "serie-temporelle": "mécanisme partagé d'historisation, aucun main()",
  "report-template": "gabarit partagé, aucun main()",
  "judge-persona-shared": "socle commun aux deux juges, aucun main()",
};

// LA RÈGLE, resserrée deux fois avant d'être juste — et les deux erreurs méritent d'être écrites,
// parce qu'elles sont exactement les deux façons de rater ce genre de mesure.
//
// PREMIÈRE VERSION : « appelé dans le corps qui suit `main()` ». La DÉCLARATION d'un détecteur
// placé après main() dans le fichier tombait dans ce corps et comptait comme un appel — les neuf
// détecteurs muets d'ecotoken devenaient invisibles. Un détecteur qui se compte lui-même comme son
// propre appelant ne mesure rien.
//
// SECONDE VERSION : elle accusait un helper appelé par une autre fonction du même fichier, hors
// main(). Faux positif symétrique du premier.
//
// LA RÈGLE RETENUE, volontairement simple et sans faux positif possible : un détecteur est MUET si
// la seule occurrence de son nom dans tout `scripts/` (hors suite de tests) est sa propre
// déclaration. Personne, nulle part, ne le nomme.
//
// SA LIMITE HONNÊTE, à dire plutôt qu'à taire : un détecteur appelé uniquement par une fonction
// elle-même morte passera pour vivant. Cette mesure sous-estime donc, et ne sur-accuse jamais —
// c'est le bon sens de l'erreur pour un garde-fou dont la crédibilité est tout le capital.
export function findDetecteursMuets({ root = ROOT, listDirImpl = readdirSync, readFileImpl = readFileSync, exemptes = SANS_MAIN_PROPRE } = {}) {
  const sources = {};
  const charger = (dossier, prefixe = "") => {
    try {
      for (const f of listDirImpl(join(root, dossier)).filter((x) => x.endsWith(".mjs"))) {
        if (f === "check-house.mjs") continue; // la suite de tests n'est pas un appelant
        try { sources[prefixe + f] = readFileImpl(join(root, dossier, f), "utf8"); } catch { /* illisible */ }
      }
    } catch { /* dossier absent */ }
  };
  charger("scripts");
  charger("scripts/hooks", "hooks/"); // les crochets git sont de vrais appelants : ils font tourner le paysage à chaque commit

  // TROISIÈME ÉTAT, et il a failli me faire accuser à tort (2026-09-23) : un détecteur appelé par
  // la SEULE suite de tests n'est pas muet. `findGardienAmbigu()` est dans ce cas — et c'est
  // précisément lui qui a refusé un de mes commits le jour même, parce que check-house.mjs tourne
  // dans le crochet pre-commit. Il PROTÈGE réellement ; simplement, il ne dit rien dans le rapport
  // de son outil. Confondre les deux aurait produit exactement le travers que ce garde-fou
  // dénonce : un chiffre qui a l'air d'un constat et n'en est pas un.
  let sourceTests = "";
  try { sourceTests = readFileImpl(join(root, "scripts/check-house.mjs"), "utf8"); } catch { /* absente */ }

  const muets = [];
  for (const [f, src] of Object.entries(sources)) {
    const slug = f.replace(/^hooks\//, "").replace(/\.mjs$/, "");
    if (slug in exemptes) continue;
    for (const d of detecteursDe(src)) {
      const appels = Object.values(sources).reduce((n, s2) => {
        const trouvees = s2.match(new RegExp(`\\b${d}\\b`, "g"));
        return n + (trouvees ? trouvees.length : 0);
      }, 0);
      if (appels > 1) continue; // nommé ailleurs qu'à sa déclaration : il atteint quelqu'un
      const porteParLesTests = new RegExp(`\\b${d}\\b`).test(sourceTests);
      muets.push({
        outil: slug, detecteur: d, porteParLesTests,
        etat: porteParLesTests ? "porté par les tests" : "muet",
        pourquoi: porteParLesTests
          ? "appelé par la seule suite de tests : il protège réellement (le crochet pre-commit la lance à chaque commit) mais ne dit jamais rien dans le rapport de son outil"
          : "appelé par personne, pas même par les tests : construit, exporté, et sans aucun effet",
      });
    }
  }
  return muets;
}

export function auditRapportsComplets({ registries = REGISTRIES, readFileImpl = readFileSync, listDirImpl, root = ROOT } = {}) {
  const outils = toolsBoundByReportTemplate();
  const sources = {};
  for (const chemin of outils) {
    const slug = String(chemin).replace(/^scripts\//, "").replace(/\.mjs$/, "");
    try { sources[slug] = readFileImpl(join(root, chemin), "utf8"); } catch { sources[slug] = null; }
  }
  // Un script illisible n'est JAMAIS compté conforme : l'absence de mesure ne vaut pas mesure.
  const illisibles = Object.entries(sources).filter(([, v]) => v === null).map(([k]) => k);
  const sansPlan = findOutilsSansPlanDaction(Object.fromEntries(Object.entries(sources).filter(([, v]) => v !== null)));

  const maigres = [];
  for (const r of registries ?? []) {
    if (!r?.path) continue;
    const dossier = join(root, r.path);
    if (!existsSync(dossier)) continue;
    try {
      for (const f of findRapportsQuiPointent({ dossier, ...(listDirImpl ? { listDirImpl } : {}) })) maigres.push({ ...f, outil: r.slug });
    } catch { /* un registre illisible est signalé par ses propres garde-fous, jamais deux fois */ }
  }

  const detecteurs = findDetecteursMuets({ root, readFileImpl });
  const muets = detecteurs.filter((d) => !d.porteParLesTests);
  const silencieux = detecteurs.filter((d) => d.porteParLesTests);

  return {
    outils: outils.length,
    exemptesDePlan: Object.keys(SANS_CONSTAT_PROPRE).length,
    sansPlan, maigres, illisibles, muets, silencieux,
    // Les « silencieux » ne cassent PAS le verdict : ils protègent réellement, via le crochet
    // pre-commit. Ils sont signalés parce qu'un outil gagnerait à dire ce qu'il sait, jamais parce
    // qu'ils seraient en faute.
    conforme: sansPlan.length === 0 && maigres.length === 0 && illisibles.length === 0 && muets.length === 0,
  };
}

export function formatRapportsComplets(audit) {
  const l = [];
  l.push("");
  l.push("--- Les trois critères d'un rapport complet (contenu / date / plan d'action) ---");
  l.push(`Critère 2 (date en toutes lettres) : porté par le gabarit partagé, mesuré juste au-dessus.`);
  l.push("");
  l.push(`Critère 1 — du contenu, jamais un simple renvoi : ${audit.maigres.length === 0 ? "✅ aucun rapport archivé ne se contente de pointer ailleurs." : `⚠️ ${audit.maigres.length} rapport(s) trop maigre(s) qui renvoient ailleurs :`}`);
  for (const m of audit.maigres.slice(0, 15)) l.push(`   · ${m.outil} — ${m.fichier ?? m.nom ?? "(fichier)"}`);
  l.push("");
  l.push(`Critère 3 — un plan d'action le cas échéant : ${audit.sansPlan.length === 0 ? "✅ tous les outils à constats concluent." : `⚠️ ${audit.sansPlan.length}/${audit.outils} outil(s) ne concluent jamais (${audit.exemptesDePlan} exemptés car sans constat propre) :`}`);
  for (const o of audit.sansPlan) l.push(`   · ${o}`);
  l.push("");
  l.push(`Critère 4 — le rapport sort-il TOUT ce que l'outil sait détecter : ${audit.muets.length === 0 ? "✅ aucun détecteur sans effet." : `⚠️ ${audit.muets.length} détecteur(s) construit(s), exporté(s), et appelé(s) par PERSONNE — pas même par les tests :`}`);
  for (const d of audit.muets) l.push(`   ⚠️ ${d.outil} :: ${d.detecteur}() — ${d.pourquoi}`);
  if (audit.silencieux.length) {
    l.push("");
    l.push(`   (${audit.silencieux.length} autre(s) détecteur(s) sont portés par la SEULE suite de tests : ils protègent pour de vrai — le crochet pre-commit la lance à chaque commit — mais ne disent jamais rien dans le rapport de leur outil. Signalés, jamais comptés en faute.)`);
    for (const d of audit.silencieux) l.push(`   · ${d.outil} :: ${d.detecteur}()`);
  }
  if (audit.illisibles.length) l.push(`\n⚠️ ${audit.illisibles.length} script(s) illisible(s), donc NON mesuré(s) — jamais comptés conformes : ${audit.illisibles.join(", ")}`);
  return l.join("\n");
}

function main() {
  printReliabilityNotice("pure-gold-unity");
  recordCliUsage("pure-gold-unity");
  console.log("=== pure-gold-unity — unification réelle des rapports ===\n");
  console.log(formatUnityReport(scanUnity()));
  console.log(formatRapportsComplets(auditRapportsComplets()));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
