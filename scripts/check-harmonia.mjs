// HARMONIA — partie mécanique et gratuite (2026-09-19, cf. docs/harmonia-blueprint.md et
// docs/referentiel/harmonia.md). Rôle : reconfirmer qu'une affirmation CHIFFRÉE documentée dans
// docs/referentiel/ correspond toujours à la constante réelle du code qu'elle décrit — jamais se
// fier à la documentation seule (principe central tranché explicitement avec l'utilisateur). Une
// friction ici signifie : soit le code a changé sans que la doc suive (dette réelle, Article 13),
// soit la doc s'est trompée dès le départ — dans les deux cas, un signal utile.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { printReportHeader, buildPlanDaction, PLAN_ACTION_TITRE } from "./report-template.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// Chaque entrée : une constante réelle extraite du code source (regex + groupe numérique), et une
// ou plusieurs affirmations attendues dans un document de référence (regex + groupe numérique).
// Si les deux ne matchent pas ou si les nombres diffèrent, c'est une friction.
export const LINKS = [
  {
    theme: "Cycle jour/nuit — durée du jour (DAY_ROUNDS)",
    code: { file: "lib/daynight.ts", pattern: /export const DAY_ROUNDS\s*=\s*(\d+)/ },
    docs: [{ file: "docs/referentiel/parametres.md", pattern: /Jour = rounds 0-(\d+)/, transform: (n) => n + 1 }],
  },
  {
    theme: "Cycle jour/nuit — durée de la nuit (NIGHT_ROUNDS)",
    code: { file: "lib/daynight.ts", pattern: /export const NIGHT_ROUNDS\s*=\s*(\d+)/ },
    docs: [{ file: "docs/referentiel/parametres.md", pattern: /Nuit = rounds 29-37 \((\d+) tours/ }],
  },
  {
    theme: "Cycle jour/nuit — décalage de minuit (MIDNIGHT_OFFSET)",
    code: { file: "lib/daynight.ts", pattern: /export const MIDNIGHT_OFFSET\s*=\s*(\d+)/ },
    docs: [{ file: "docs/referentiel/parametres.md", pattern: /\*\*minuit=(\d+)\*\*/ }],
  },
  {
    theme: "Nuit blanche — malus de fatigue fixe",
    code: { file: "app/api/lia/route.ts", pattern: /sleptThisNight\?\.\[agent\.id\]!==true\)needs\.fatigue=Math\.min\(100,needs\.fatigue\+(\d+)\)/ },
    docs: [{ file: "docs/referentiel/parametres.md", pattern: /`\+(\d+)` fatigue, FIXE et non cumulable/ }],
  },
  {
    theme: "Palier de respect sincère — seuil d'appréciation",
    code: { file: "app/api/lia/route.ts", pattern: /appreciationOf\(life,id\)<(\d+)\)life\.genuineRespectStreak/ },
    docs: [{ file: "docs/referentiel/parametres.md", pattern: /abaissé de 85 à\s+(\d+)/ }],
  },
];

// ————————————————————————————————————————————————————————————————————————
// LA CARTOGRAPHIE DES CRITÈRES TRANSVERSES (2026-09-23, chantier 9)
// ————————————————————————————————————————————————————————————————————————
//
// DEMANDE DE L'UTILISATEUR, avec son calibrage exact : « montrer, ne rien supprimer ». Ce n'est
// donc PAS un détecteur de doublons — CLONE-HUNTER fait déjà ça sur le code littéral. C'est une
// carte : quels CRITÈRES le paysage vérifie-t-il, et depuis combien d'endroits ?
//
// POURQUOI MONTRER SUFFIT, ET POURQUOI SUPPRIMER SERAIT UNE ERREUR. Deux outils qui vérifient « ce
// qui est déclaré existe-t-il vraiment ? » ne font pas forcément doublon : l'un le vérifie sur les
// blueprints, l'autre sur les porteurs de leçons, et fusionner les deux donnerait un outil qui
// scanne tout et n'appartient à personne. Ce qui est utile, c'est de VOIR que ce critère est
// devenu un motif du projet — parce qu'un motif porté par dix endroits mérite une formulation
// commune, et parce qu'un critère porté par UN SEUL endroit est un point de fragilité.
//
// COMMENT ELLE EST CONSTRUITE, et c'est ce qui la rend évolutive (Article 24) : elle LIT les noms
// des fonctions exportées du dépôt et les découpe en mots. Les motifs ci-dessous ne sont pas une
// liste de critères recopiée à la main — ce sont les MOTS que ce dépôt emploie réellement pour
// nommer ce qu'il cherche, et un nouvel outil qui les emploie rejoint la carte sans qu'on y touche.
//
// SA LIMITE, DÉCLARÉE : elle regroupe par VOCABULAIRE, pas par sens. Deux fonctions qui cherchent
// la même chose sous deux noms différents restent séparées, et deux fonctions qui partagent un mot
// sans partager l'intention se retrouvent ensemble. C'est une carte à lire, jamais un verdict.
export const CRITERES_TRANSVERSES = [
  { cle: "declare-mais-absent", mots: ["missing", "manquant", "manquante", "manquants", "absent", "absents", "absente", "absentes", "sans"], question: "quelque chose est DÉCLARÉ quelque part et n'existe pas vraiment" },
  { cle: "existe-mais-non-declare", mots: ["undeclared", "nondeclare", "orphelin", "orphelines", "orphan"], question: "quelque chose EXISTE et n'est déclaré nulle part" },
  { cle: "deux-sources-divergent", mots: ["diverging", "divergent", "divergentes", "drift", "stale", "perimee"], question: "deux endroits décrivent la même chose et ne disent plus pareil" },
  { cle: "mecanisme-muet", mots: ["muets", "muet", "casses", "casse", "unread", "ignores"], question: "un mécanisme existe et n'atteint personne" },
  { cle: "promesse-creuse", mots: ["fantome", "fantomes", "phantom", "promised", "promis"], question: "une promesse est faite et rien ne la tient" },
  { cle: "duplication", mots: ["duplicate", "doublon", "doublons", "equivalents", "redundant", "redondant", "redondantes"], question: "la même chose est dite ou écrite deux fois" },
  { cle: "stagnation", mots: ["stagnation", "ancienne", "oldest", "neglig", "jamais"], question: "quelque chose n'a pas bougé depuis trop longtemps" },
];

export function fonctionsExporteesParOutil({ root = ROOT, listDirImpl = readdirSync, readFileImpl = readFileSync } = {}) {
  const parOutil = new Map();
  for (const fichier of listDirImpl(join(root, "scripts")).filter((f) => f.endsWith(".mjs"))) {
    const texte = readFileImpl(join(root, "scripts", fichier), "utf8");
    const noms = [...texte.matchAll(/^export\s+(?:async\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)/gm)].map((m) => m[1]);
    if (noms.length) parOutil.set(fichier.replace(/\.mjs$/, ""), noms);
  }
  return parOutil;
}

// Découpe un nom en mots, en minuscules et sans accents : `findGardiensSansRegistreDeclare` devient
// [find, gardiens, sans, registre, declare]. Écrit ainsi plutôt qu'avec une liste de préfixes à
// reconnaître — un nom qui n'entre dans aucun critère n'est simplement pas classé, jamais forcé.
export function motsDuNom(nom = "") {
  return String(nom).replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/).filter(Boolean);
}

export function cartographieCriteresTransverses({ parOutil = null, criteres = CRITERES_TRANSVERSES, ...options } = {}) {
  const source = parOutil ?? fonctionsExporteesParOutil(options);
  const carte = criteres.map((c) => ({ ...c, occurrences: [] }));
  const nonClassees = [];
  for (const [outil, noms] of source) {
    for (const nom of noms) {
      const mots = new Set(motsDuNom(nom));
      const touches = carte.filter((c) => c.mots.some((m) => mots.has(m)));
      if (!touches.length) { nonClassees.push({ outil, nom }); continue; }
      for (const c of touches) c.occurrences.push({ outil, nom });
    }
  }
  for (const c of carte) c.outils = [...new Set(c.occurrences.map((o) => o.outil))].sort();
  return { carte: carte.sort((a, b) => b.outils.length - a.outils.length), nonClassees };
}

export function formatCartographie({ carte = [], nonClassees = [] } = {}, { maxOutils = 8 } = {}) {
  const l = ["— CARTE DES CRITÈRES TRANSVERSES (montrer, ne rien supprimer) —", ""];
  for (const c of carte) {
    if (!c.occurrences.length) { l.push(`➖ ${c.cle} — « ${c.question} » : aucun endroit ne le vérifie sous ce vocabulaire.`); continue; }
    const seul = c.outils.length === 1;
    l.push(`${seul ? "⚠️" : "●"} ${c.cle} — « ${c.question} »`);
    l.push(`   ${c.occurrences.length} fonction(s) réparties sur ${c.outils.length} outil(s) : ${c.outils.slice(0, maxOutils).join(", ")}${c.outils.length > maxOutils ? "…" : ""}`);
    // UN SEUL PORTEUR EST UN SIGNAL, pas un compliment : ce critère disparaît du paysage le jour où
    // cet outil-là change. C'est l'information que la carte apporte et qu'aucun outil ne voit seul.
    if (seul) l.push("   un seul outil porte ce critère — il disparaît du paysage le jour où celui-là change.");
  }
  l.push("");
  l.push(`${nonClassees.length} fonction(s) exportée(s) n'entrent dans aucun critère : ce n'est jamais un défaut, la plupart ne cherchent rien (elles calculent, formatent ou enregistrent).`);
  l.push("Cette carte regroupe par VOCABULAIRE, jamais par sens : deux fonctions qui cherchent la même chose sous deux noms différents y restent séparées. À lire, jamais un verdict.");
  return l.join("\n");
}

export function checkLinks(links, readFile = (f) => readFileSync(f, "utf8")) {
  const results = [];
  for (const link of links) {
    let codeValue;
    try {
      const codeSource = readFile(ROOT + link.code.file);
      const m = codeSource.match(link.code.pattern);
      codeValue = m ? Number(m[1]) : undefined;
    } catch {
      codeValue = undefined;
    }
    if (codeValue === undefined) {
      results.push({ theme: link.theme, status: "introuvable dans le code", confidence: "confirmé" });
      continue;
    }
    let anyDocMatched = false, anyMismatch = false, docDetails = [];
    for (const doc of link.docs) {
      let docSource;
      try {
        docSource = readFile(ROOT + doc.file);
      } catch {
        docDetails.push(`${doc.file} : fichier introuvable`);
        continue;
      }
      const dm = docSource.match(doc.pattern);
      if (!dm) {
        docDetails.push(`${doc.file} : affirmation attendue introuvable`);
        continue;
      }
      anyDocMatched = true;
      const rawValue = Number(dm[1]);
      const docValue = doc.transform ? doc.transform(rawValue) : rawValue;
      if (docValue !== codeValue) {
        anyMismatch = true;
        docDetails.push(`${doc.file} affirme ${docValue} (extrait: "${dm[0]}"), code dit ${codeValue}`);
      }
    }
    if (!anyDocMatched) results.push({ theme: link.theme, status: `code=${codeValue}, mais ${docDetails.join("; ")}`, confidence: "probable" });
    else if (anyMismatch) results.push({ theme: link.theme, status: docDetails.join("; "), confidence: "confirmé" });
    else results.push({ theme: link.theme, status: `cohérent (code=${codeValue})`, confidence: "ok" });
  }
  return results;
}

function main() {
  recordCliUsage("harmonia");
  const results = checkLinks(LINKS);
  printReportHeader({ tool: "harmonia", title: "HARMONIA — partie mécanique (cohérence chiffrée doc/code, zéro coût API)", scriptPath: "scripts/check-harmonia.mjs" });
  for (const r of results) {
    const icon = r.confidence === "ok" ? "✓" : r.confidence === "confirmé" ? "✗ FRICTION" : "? à vérifier";
    console.log(`[${icon}] ${r.theme} — ${r.status}`);
  }
  const frictions = results.filter((r) => r.confidence === "confirmé");
  // POURQUOI CE ZÉRO-LÀ EST HONNÊTE, et la question méritait d'être tranchée par écrit plutôt que
  // supposée (2026-09-25, tâche #601, qui rangeait HARMONIA parmi les outils pouvant « dire vert
  // sans avoir rien mesuré ») : le dénominateur est imprimé à côté du chiffre depuis toujours —
  // « N friction(s) sur M lien(s) vérifié(s) » — donc un zéro s'accompagne toujours du nombre de
  // liens réellement examinés. Et ce dénominateur est STRUCTURELLEMENT non vide : `LINKS` est une
  // carte écrite dans ce fichier, pas un balayage du disque, donc `results.length` ne peut valoir
  // zéro que si la carte elle-même est vide — ce que le test ci-dessous interdit. Il n'y a donc pas
  // de branche « pas mesuré » à ajouter ici : il y avait une déclaration à écrire, et la voici.
  if (!results.length) console.log("🚨 PAS MESURÉ — la carte des liens est vide : aucun lien n'a été vérifié, ce qui n'est pas « aucune friction ».");
  console.log(`\n${frictions.length} friction(s) confirmée(s) sur ${results.length} lien(s) vérifié(s).`);

  // LE PLAN D'ACTION (2026-09-23, Article 28). HARMONIA est un Gardien sacré : il rapporte sur la
  // propreté du code, donc son plan est PRIORITAIRE par dérivation, jamais par décret — un écart
  // doc/code fausse le référentiel lui-même, c'est-à-dire l'instrument avec lequel tout le reste se
  // mesure. D'où `fausseUneMesure: true` sur les frictions confirmées.
  //
  // POURQUOI le constructeur complet ICI, et le raccourci `planDactionDepuisEcarts` ailleurs :
  // HARMONIA est le seul Gardien qui distingue nativement trois degrés de certitude. Le raccourci
  // classe tout en « retenu » — honnête pour un scan binaire, MENTEUR ici, puisqu'il promouvrait un
  // « ? à vérifier » en constat établi. Les trois états de l'Article 28 existent précisément pour
  // que cette nuance survive jusqu'à la lecture.
  const constats = results
    .filter((r) => r.confidence !== "ok")
    .map((r) => r.confidence === "confirmé"
      ? { constat: `${r.theme} — ${r.status}`, etat: "retenu", toucheLeJeu: true, fausseUneMesure: true,
          tache: `réaligner ${r.theme} : corriger le chiffre faux, dans le code ou dans le référentiel selon lequel des deux a raison` }
      : { constat: `${r.theme} — ${r.status}`, etat: "a-trancher",
          pourquoi: "le lien n'a pas pu être vérifié mécaniquement : il faut un œil humain pour dire si c'est une vraie friction ou une lecture trop stricte" });
  // LA CARTE DES CRITÈRES TRANSVERSES sort ici, avant le plan : elle ne produit aucun constat à
  // trancher (l'utilisateur a tranché « montrer, ne rien supprimer »), mais elle appartient au même
  // regard — celui qui compare des endroits différents entre eux plutôt que chacun à lui-même.
  console.log("");
  console.log(formatCartographie(cartographieCriteresTransverses()));

  const plan = buildPlanDaction(constats, { toolSlug: "harmonia" });
  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of plan.lignes) console.log(l);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
