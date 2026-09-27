// ICEBERG: membre
// ============================================================================================
// EZECHIEL-LES-TESTS — l'enquête sur le FILET DE SÉCURITÉ, et sur tout ce qui l'entoure
// ============================================================================================
//
// POURQUOI IL EXISTE, ET LE CHIFFRE QUI L'A DÉCLENCHÉ (2026-09-27, tâche #1026).
// Le filet bloque chaque commit. Mesuré le 2026-09-25 (tâche #818) : 43,7 s. Re-mesuré le
// 2026-09-27 : **116 s pour check-house seul**. Il a presque TRIPLÉ en deux jours, et personne ne
// l'a vu venir — parce que rien ne surveillait sa durée entre deux mesures faites à la main.
//
// SON PÉRIMÈTRE EST PLUS LARGE QUE « LES TESTS », et c'est une décision explicite de l'utilisateur
// le jour de sa création : « on doit construire Ezechiel autour de TOUTE la mécanique qui constitue
// le filet mais AUSSI la mécanique qui ENTOURE ce filet, c'est une vue plus large, qui permet de
// saisir tous les tenants et aboutissants du problème ». La raison est mesurée, pas théorique : le
// crochet ne se contente pas de lancer check-house, il l'exécute SOUS INSTRUMENTATION DE COUVERTURE
// puis enchaîne `tsc --noEmit`. Chercher le temps perdu dans les seuls tests, c'est risquer de
// retirer des tests pour un problème qui n'est pas là — le pire résultat possible de ce chantier.
//
// CE QU'IL NE FAIT PAS, ET C'EST LE CŒUR DE SA CONCEPTION. **Il n'écrit JAMAIS dans le filet.**
// tool-brain classe `check-house.mjs` TUYAUTERIE score 9, le plus haut du dépôt : sa panne empêche
// tout commit. Ezechiel est un ENQUÊTEUR — il rend des signaux mesurables et un plan d'action ; le
// verdict « ce test part » reste humain. Un outil qui supprimerait un test tout seul serait le seul
// outil du paysage capable de détruire silencieusement ce que tous les autres protègent.
//
// LES DEUX LEÇONS QUE tool-brain A RESSORTIES À SA CONCEPTION, et elles le gouvernent :
//   · BP2 — un test qui n'a jamais échoué ne prouve rien : le faire échouer exprès d'abord.
//     Conséquence ici : « ce groupe ne contient aucune assertion » est un FAIT ; « ce test est
//     inutile » est un JUGEMENT qu'Ezechiel ne rend pas.
//   · L3 — un test ne doit jamais exiger qu'un défaut PERSISTE. Conséquence : un groupe qui
//     affirme un état imparfait du dépôt est signalé comme fragile, jamais comme bon.
//
// CE QU'IL RÉUTILISE PLUTÔT QUE DE LE REFAIRE (Article 3, anti-doublon) : `mesurerLeFilet()` et
// `repartitionDuFilet()` de SMART-CONSO-TOKEN, qui savent déjà chronométrer groupe par groupe. Les
// redéclarer aurait créé deux calculs de la même chose, donc deux réponses possibles à la même
// question (leçon L29).
//
// LIMITE HONNÊTE, DÉCLARÉE PLUTÔT QUE TUE (Article 27) : Ezechiel lit du TEXTE, il n'exécute pas le
// filet groupe par groupe. Il peut donc dire « ce groupe ne contient aucune assertion » avec
// certitude, mais jamais « cette assertion ne peut pas échouer » — ça demanderait de casser le code
// exprès et de relancer, ce que seule une passe à part peut faire.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { printReportHeader, imprimerPlanDaction, buildPlanDaction } from "./report-template.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

export const FILET = "scripts/check-house.mjs";
export const CROCHETS = ["scripts/hooks/pre-commit", "scripts/hooks/post-commit"];

// LES ENVELOPPES : ce qui entoure le filet et coûte du temps sans être un test. Chacune porte ce
// qu'elle est et pourquoi elle pèse — un nom seul n'apprendrait rien à qui lit le rapport.
export const ENVELOPPES = [
  { motif: /NODE_V8_COVERAGE/, cle: "couverture", quoi: "instrumentation de couverture V8", pourquoi: "Node trace chaque fonction exécutée pour qu'AXA-CHECK puisse dire ce qui est couvert — un coût payé sur la totalité du filet, jamais sur un test en particulier" },
  { motif: /\btsc\b|--noEmit/, cle: "typage", quoi: "vérification de typage TypeScript", pourquoi: "compile tout le projet sans rien produire ; ne teste aucun comportement, mais bloque le commit au même titre" },
  { motif: /playwright|chromium/i, cle: "navigateur", quoi: "lancement d'un navigateur", pourquoi: "démarrer un navigateur coûte des secondes fixes avant le premier test" },
];

// ---------------------------------------------------------------------------------------------
// AXE 1 — LA CHAÎNE COMPLÈTE : que lance-t-on vraiment, et dans quel ordre ?
// ---------------------------------------------------------------------------------------------
// Elle se LIT dans les crochets, jamais recopiée ici (Article 24) : une ligne ajoutée au crochet
// demain apparaît toute seule. C'est exactement l'écart qui a rendu ce chantier nécessaire — la
// charte et les plans décrivaient « le filet », et personne ne décrivait ce qui l'enveloppe.
export function chaineDuFilet({ root = ROOT, lire = null, crochets = CROCHETS } = {}) {
  const lireF = lire ?? ((f) => { try { return readFileSync(join(root, f), "utf8"); } catch { return null; } });
  const etapes = [];
  const illisibles = [];
  for (const crochet of crochets) {
    const src = lireF(crochet);
    if (src == null) { illisibles.push(crochet); continue; }
    for (const brute of String(src).split("\n")) {
      const l = brute.trim();
      if (!l || l.startsWith("#")) continue;
      if (!/\b(node|npx|npm|pnpm)\b/.test(l)) continue;
      const enveloppes = ENVELOPPES.filter((e) => e.motif.test(l)).map((e) => e.cle);
      etapes.push({ crochet, ligne: l.slice(0, 160), bloquant: crochet.endsWith("pre-commit"), enveloppes });
    }
  }
  // Un crochet illisible n'est JAMAIS une chaîne courte : c'est une chaîne qu'on n'a pas pu lire
  // (leçons L5/L11). Le dire vaut mieux que de rendre un inventaire qui paraît complet.
  if (!etapes.length) return { mesurable: false, pourquoi: `aucune commande lue dans ${crochets.join(", ")} — sans les crochets, on ne sait pas ce qui tourne, ce qui n'est jamais la même chose qu'une chaîne vide`, illisibles };
  const avecEnveloppe = etapes.filter((e) => e.enveloppes.length);
  return {
    mesurable: true, etapes, illisibles,
    bloquantes: etapes.filter((e) => e.bloquant).length,
    enveloppes: [...new Set(avecEnveloppe.flatMap((e) => e.enveloppes))].map((cle) => ENVELOPPES.find((x) => x.cle === cle)),
  };
}

// ---------------------------------------------------------------------------------------------
// LE DÉCOUPAGE EN GROUPES — la brique commune des axes 3 à 6
// ---------------------------------------------------------------------------------------------
// Un groupe se termine sur sa ligne `console.log('Passed: …')`, seule frontière que le filet expose
// déjà — la même que celle qu'utilise le chronométrage de SMART-CONSO-TOKEN, délibérément, pour que
// les deux outils parlent des MÊMES groupes. Deux découpages différents rendraient deux inventaires
// qu'on ne pourrait pas croiser.
export const MOTIF_FIN_DE_GROUPE = /console\.log\(\s*['"`]Passed\s*:/;

// LE DÉFAUT TROUVÉ AU PREMIER VRAI PASSAGE (2026-09-27), et il accusait à tort : un bloc de test
// qui couvre cinq sujets imprime CINQ lignes « Passed » d'affilée. Les compter comme cinq groupes
// donnait quatre groupes au corps vide, donc quatre « aucune assertion » parfaitement faux — le
// patron exact de la leçon L4. Des lignes « Passed » CONSÉCUTIVES appartiennent au même groupe :
// elles en énumèrent les sujets, elles n'en ouvrent pas de nouveaux.
export function decouperEnGroupes(src = "") {
  const lignes = String(src).split("\n");
  const groupes = [];
  let debut = 0;
  for (let i = 0; i < lignes.length; i++) {
    if (!MOTIF_FIN_DE_GROUPE.test(lignes[i])) continue;
    let fin = i;
    while (fin + 1 < lignes.length && MOTIF_FIN_DE_GROUPE.test(lignes[fin + 1])) fin++;
    const corps = lignes.slice(debut, fin + 1);
    const titres = corps.filter((l) => MOTIF_FIN_DE_GROUPE.test(l))
      .map((l) => (l.match(/Passed\s*:\s*([^'"`]{0,120})/) ?? [, ""])[1].trim()).filter(Boolean);
    groupes.push({ ligne: i + 1, titre: titres.join(" · "), sujets: titres.length, corps, texte: corps.join("\n") });
    debut = fin + 1; i = fin;
  }
  return groupes;
}

// ---------------------------------------------------------------------------------------------
// AXE 2 — LES GROUPES QUI NE PEUVENT PAS MORDRE
// ---------------------------------------------------------------------------------------------
// « Vérifier que la suite de tests est fiable et permet d'assurer la sécurité du code », dans ses
// mots. Un groupe sans aucune assertion occupe du temps et rend du vert sans rien garantir ; une
// assertion tautologique fait pire, elle DÉCORE le vert.
export const MOTIF_TAUTOLOGIE = /assert\.(ok|equal|strictEqual)\(\s*(true|1|['"`][^'"`]*['"`])\s*[,)]/;

export function groupesSansMorsure(groupes = []) {
  const muets = [], tautologiques = [];
  for (const g of groupes) {
    const assertions = (g.texte.match(/\bassert\.[a-zA-Z]+\(/g) ?? []).length;
    if (assertions === 0) { muets.push({ ligne: g.ligne, titre: g.titre, pourquoi: "aucune assertion dans ce groupe : il imprime un « Passed » sans avoir rien vérifié" }); continue; }
    const taut = (g.texte.match(new RegExp(MOTIF_TAUTOLOGIE.source, "g")) ?? []).length;
    if (taut > 0) tautologiques.push({ ligne: g.ligne, titre: g.titre, combien: taut, pourquoi: `${taut} assertion(s) portant sur une valeur littérale : elles passeront quoi qu'il arrive au code` });
  }
  return { muets, tautologiques };
}

// ---------------------------------------------------------------------------------------------
// AXE 3 — LES GROUPES SANS RAISON ÉCRITE
// ---------------------------------------------------------------------------------------------
// « Vérifier que les tests sont là pour une bonne raison, ÉCRITE », dans ses mots — et c'est
// l'Article 27 pris par l'autre bout : un test dont personne ne sait plus ce qu'il protège se fait
// supprimer par le prochain agent, ou pire, se fait contourner.
//
// DANS CE DÉPÔT, LA RAISON PEUT VIVRE À DEUX ENDROITS : dans un commentaire au-dessus du groupe, ou
// dans le message `Passed:` lui-même, qui est ici une vraie phrase et pas une étiquette. Un groupe
// n'est signalé que si les DEUX manquent — signaler sur un seul des deux critères accuserait à tort
// la moitié du fichier (leçon L4).
export const RAISON_MINIMALE_CARACTERES = 80;

export function groupesSansRaison(groupes = [], { minimum = RAISON_MINIMALE_CARACTERES } = {}) {
  const sans = [];
  for (const g of groupes) {
    const commentaires = (g.texte.match(/^\s*(\/\/|\*|\/\*).*$/gm) ?? []).join(" ").replace(/[/*]/g, " ").trim();
    const longueurRaison = Math.max(commentaires.length, g.titre.length);
    if (longueurRaison < minimum) {
      sans.push({ ligne: g.ligne, titre: g.titre || "(sans titre)", caracteres: longueurRaison, pourquoi: `ni commentaire ni message « Passed » assez explicite (${longueurRaison} caractères) : rien ne dit ce que ce groupe protège` });
    }
  }
  return sans;
}

// ---------------------------------------------------------------------------------------------
// AXE 4 — LES TESTS QUI CITENT DU CODE DISPARU
// ---------------------------------------------------------------------------------------------
// « En parfaite correspondance avec l'existant dans le code », dans ses mots. Un test qui importe
// un fichier absent ne se contente pas d'être faux : il casse le filet entier, donc il bloque tout
// commit — c'est le défaut le plus cher du lot.
export function citationsMortes(src = "", { root = ROOT, existe = null } = {}) {
  const existeF = existe ?? ((f) => existsSync(join(root, f)));
  const vus = new Set();
  const mortes = [];
  // DEUX DÉFENSES CONTRE LE FAUX POSITIF, et les deux sont payées par le premier vrai passage :
  // il a rendu HUIT imports « morts » dont ZÉRO n'en était un.
  //   (1) UNE LIGNE QUI APPELLE `assert.` N'IMPORTE RIEN : elle contient une fixture. C'est ainsi
  //       que `scripts/a.mjs` et `scripts/x/y.mjs`, des chemins inventés pour un test, étaient
  //       dénoncés comme des fichiers disparus.
  //   (2) UN CHEMIN RELATIF SE RÉSOUT DEPUIS `scripts/`, jamais depuis la racine seule — se
  //       tromper de racine faisait manquer des fichiers parfaitement présents.
  for (const ligne of String(src).split("\n")) {
    if (/\bassert\.[a-zA-Z]+\(/.test(ligne)) continue;
    const motif = /(?:^\s*import\b[^'"`]*from|\bawait\s+import\()\s*['"`](\.{1,2}\/[^'"`]+)['"`]/g;
    let m;
    while ((m = motif.exec(ligne)) !== null) {
      const brut = m[1];
      if (vus.has(brut)) continue;
      vus.add(brut);
      const candidats = [brut.replace(/^\.\.\//, ""), brut.replace(/^\.\//, "scripts/"), `scripts/${brut.replace(/^\.{1,2}\//, "")}`];
      if (!candidats.some((c) => existeF(c))) {
        mortes.push({ chemin: brut, essayes: candidats, pourquoi: "aucune des résolutions possibles n'existe : l'import échouera et fera tomber le filet ENTIER, pas seulement ce test" });
      }
    }
  }
  return { examines: vus.size, mortes };
}

// ---------------------------------------------------------------------------------------------
// AXE 5 — L'ENCOMBREMENT
// ---------------------------------------------------------------------------------------------
// « Vérifier que la suite de tests n'est pas polluée ou encombrée », dans ses mots. Le POIDS EN
// LIGNES n'est pas le poids en TEMPS, et les confondre serait une erreur de mesure : un groupe de
// 300 lignes peut s'exécuter en 2 ms. Les deux se lisent donc côte à côte, jamais l'un pour l'autre.
export function encombrement(groupes = [], { top = 10 } = {}) {
  if (!groupes.length) return { mesurable: false, pourquoi: "aucun groupe découpé — le filet n'a pas été lu, ce qui n'est jamais la même chose qu'un filet vide" };
  const avecTaille = groupes.map((g) => ({ ligne: g.ligne, titre: g.titre, lignes: g.corps.length }));
  const tries = [...avecTaille].sort((a, b) => b.lignes - a.lignes);
  const total = avecTaille.reduce((a, g) => a + g.lignes, 0);
  // Deux groupes qui portent le MÊME titre testent probablement la même chose deux fois — ou, pire,
  // l'un des deux a été copié puis modifié à moitié.
  const parTitre = new Map();
  for (const g of avecTaille) {
    const cle = g.titre.slice(0, 60).toLowerCase();
    if (!cle) continue;
    if (!parTitre.has(cle)) parTitre.set(cle, []);
    parTitre.get(cle).push(g.ligne);
  }
  const titresEnDouble = [...parTitre.entries()].filter(([, l]) => l.length > 1).map(([titre, lignes]) => ({ titre, lignes }));
  return {
    mesurable: true, groupes: avecTaille.length, totalLignes: total,
    lesPlusGros: tries.slice(0, top),
    partDuTopPct: total > 0 ? (tries.slice(0, top).reduce((a, g) => a + g.lignes, 0) / total) * 100 : 0,
    titresEnDouble,
  };
}

// ---------------------------------------------------------------------------------------------
// AXE 6 — COMPARER LES COUCHES : le test, ou ce qui l'entoure ?
// ---------------------------------------------------------------------------------------------
// LA QUESTION QUI DÉCIDE DE TOUT LE CHANTIER, et elle ne se devine pas. Si l'essentiel du temps
// vient de l'instrumentation et du typage, alors retirer des tests ne gagnerait rien et coûterait
// de la protection. Ezechiel REFUSE donc de conclure sans les trois durées réelles.
export function comparerLesCouches({ nuMs = null, couvertureMs = null, typageMs = null } = {}) {
  const manquantes = [];
  if (!Number.isFinite(nuMs)) manquantes.push("le filet nu");
  if (!Number.isFinite(couvertureMs)) manquantes.push("le filet sous instrumentation");
  if (manquantes.length) {
    return { mesurable: false, pourquoi: `il manque la durée de : ${manquantes.join(" et ")} — sans les deux, on ne peut pas dire d'où vient le temps, seulement qu'on n'a pas regardé (leçons L5/L11)` };
  }
  // UN SURCOÛT NÉGATIF N'EST PAS UN GAIN, C'EST DU BRUIT DE MESURE — et le premier passage l'a
  // rendu : l'instrumentation a mesuré 9 s de MOINS que le filet nu, ce qui est impossible, donc
  // une preuve que les deux durées sont dans la même marge d'erreur. Le laisser passer produisait
  // « les tests 103 %, l'enveloppe -3 % », un pourcentage négatif lu comme un résultat alors qu'il
  // dit seulement qu'on n'a pas su distinguer (Article 32, faille 3 : un âge négatif ne doit jamais
  // se lire comme « tout frais »).
  const surcoutBrut = couvertureMs - nuMs;
  const surcoutNegligeable = surcoutBrut <= 0;
  const surcoutCouverture = Math.max(0, surcoutBrut);
  const totalBloquant = nuMs + surcoutCouverture + (Number.isFinite(typageMs) ? typageMs : 0);
  const partTests = totalBloquant > 0 ? Math.min(100, (nuMs / totalBloquant) * 100) : 0;
  const partEnveloppe = 100 - partTests;
  return {
    mesurable: true, nuMs, couvertureMs, typageMs, surcoutCouverture, surcoutNegligeable, totalBloquant,
    partTestsPct: partTests, partEnveloppePct: partEnveloppe,
    typageMesure: Number.isFinite(typageMs),
    verdict: partEnveloppe >= 50
      ? "L'ENVELOPPE pèse plus que les tests eux-mêmes : chercher le gain dans la suite de tests serait chercher au mauvais endroit."
      : "LES TESTS pèsent plus que leur enveloppe : le gain est bien à chercher dans la suite elle-même.",
  };
}

// ---------------------------------------------------------------------------------------------
// L'ENQUÊTE COMPLÈTE
// ---------------------------------------------------------------------------------------------
export function enqueter({ root = ROOT, lire = null, existe = null, durees = {} } = {}) {
  const lireF = lire ?? ((f) => { try { return readFileSync(join(root, f), "utf8"); } catch { return null; } });
  const src = lireF(FILET);
  if (src == null) {
    return { mesurable: false, pourquoi: `${FILET} illisible — aucune enquête possible, et un rapport vide se lirait comme un filet sain` };
  }
  const groupes = decouperEnGroupes(src);
  return {
    mesurable: true,
    filet: { lignes: String(src).split("\n").length, groupes: groupes.length, assertions: (src.match(/\bassert\.[a-zA-Z]+\(/g) ?? []).length },
    chaine: chaineDuFilet({ root, lire: lireF }),
    couches: comparerLesCouches(durees),
    morsure: groupesSansMorsure(groupes),
    sansRaison: groupesSansRaison(groupes),
    citations: citationsMortes(src, { root, existe }),
    encombrement: encombrement(groupes),
  };
}

export function formatEnqueteLines(e) {
  if (!e?.mesurable) return [`PAS MESURÉ — ${e?.pourquoi ?? "aucune donnée"}`];
  const L = [];
  const s = (ms) => `${(ms / 1000).toFixed(1)} s`;
  L.push(`Le filet : ${e.filet.lignes} lignes · ${e.filet.groupes} groupes · ${e.filet.assertions} assertions.`, "");

  L.push("=== LA CHAÎNE RÉELLE, lue dans les crochets ===");
  if (!e.chaine.mesurable) L.push(`  PAS MESURÉ — ${e.chaine.pourquoi}`);
  else {
    L.push(`  ${e.chaine.etapes.length} commande(s), dont ${e.chaine.bloquantes} qui BLOQUENT le commit.`);
    for (const et of e.chaine.etapes) {
      const marque = et.bloquant ? "🔒" : "  ";
      const env = et.enveloppes.length ? `  ← ${et.enveloppes.join(", ")}` : "";
      L.push(`  ${marque} ${et.ligne.slice(0, 96)}${env}`);
    }
    if (e.chaine.enveloppes.length) {
      L.push("", "  CE QUI ENTOURE LE FILET et coûte du temps sans être un test :");
      for (const env of e.chaine.enveloppes) L.push(`   · ${env.quoi} — ${env.pourquoi}`);
    }
  }

  L.push("", "=== D'OÙ VIENT LE TEMPS : les tests, ou leur enveloppe ? ===");
  if (!e.couches.mesurable) L.push(`  PAS MESURÉ — ${e.couches.pourquoi}`);
  else {
    const surc = e.couches.surcoutNegligeable ? "surcoût non mesurable — les deux durées sont dans la même marge d'erreur" : `surcoût ${s(e.couches.surcoutCouverture)}`;
    L.push(`  filet nu ${s(e.couches.nuMs)} · sous instrumentation ${s(e.couches.couvertureMs)} (${surc})` + (e.couches.typageMesure ? ` · typage ${s(e.couches.typageMs)}` : " · typage NON MESURÉ"));
    L.push(`  Sur le total bloquant de ${s(e.couches.totalBloquant)} : les tests ${e.couches.partTestsPct.toFixed(0)} %, l'enveloppe ${e.couches.partEnveloppePct.toFixed(0)} %.`);
    L.push(`  → ${e.couches.verdict}`);
  }

  L.push("", "=== CE QUI NE MORD PAS ===");
  L.push(`  ${e.morsure.muets.length} groupe(s) sans aucune assertion · ${e.morsure.tautologiques.length} groupe(s) portant une assertion sur une valeur littérale.`);
  for (const g of e.morsure.muets.slice(0, 8)) L.push(`   ⚠️  ligne ${g.ligne} — ${g.titre.slice(0, 70)}`);
  for (const g of e.morsure.tautologiques.slice(0, 8)) L.push(`   🟡 ligne ${g.ligne} (${g.combien}) — ${g.titre.slice(0, 66)}`);

  L.push("", "=== CE QUI N'A PAS DE RAISON ÉCRITE ===");
  L.push(`  ${e.sansRaison.length} groupe(s) sans commentaire ni message explicite.`);
  for (const g of e.sansRaison.slice(0, 8)) L.push(`   ⚠️  ligne ${g.ligne} — ${g.titre.slice(0, 70)}`);

  L.push("", "=== CE QUI CITE DU CODE DISPARU ===");
  L.push(`  ${e.citations.examines} import(s) examiné(s) · ${e.citations.mortes.length} vers un fichier absent.`);
  for (const c of e.citations.mortes.slice(0, 8)) L.push(`   🚨 ${c.chemin} — ${c.pourquoi}`);

  L.push("", "=== L'ENCOMBREMENT (en lignes, jamais en temps) ===");
  if (!e.encombrement.mesurable) L.push(`  PAS MESURÉ — ${e.encombrement.pourquoi}`);
  else {
    L.push(`  ${e.encombrement.totalLignes} lignes sur ${e.encombrement.groupes} groupes ; les ${e.encombrement.lesPlusGros.length} plus gros en pèsent ${e.encombrement.partDuTopPct.toFixed(1)} %.`);
    for (const g of e.encombrement.lesPlusGros.slice(0, 6)) L.push(`   ${String(g.lignes).padStart(5)} l.  ligne ${g.ligne} — ${g.titre.slice(0, 62)}`);
    if (e.encombrement.titresEnDouble.length) {
      L.push(`  ${e.encombrement.titresEnDouble.length} titre(s) en double — deux groupes qui disent tester la même chose :`);
      for (const t of e.encombrement.titresEnDouble.slice(0, 5)) L.push(`   🟡 lignes ${t.lignes.join(", ")} — ${t.titre.slice(0, 60)}`);
    }
  }

  L.push("", "HORS PORTÉE, et ce n'est pas une modestie de façade : Ezechiel lit du TEXTE. Il dit qu'un",
    "groupe ne contient aucune assertion — c'est un fait. Il ne dit JAMAIS qu'un test est inutile,",
    "ni qu'une assertion ne peut pas échouer : ça demande de casser le code exprès et de relancer",
    "(BP2). Et il n'écrit jamais dans le filet : sa panne empêcherait tout commit.");
  return L;
}

// Le plan d'action (Article 28) — chaque constat porte son état, jamais un constat orphelin.
export function planDeLEnquete(e) {
  if (!e?.mesurable) return [];
  const ecarts = [];
  if (e.citations.mortes.length) {
    ecarts.push({ constat: `${e.citations.mortes.length} import(s) du filet vers un fichier absent`, etat: "retenu", niveau: "obligatoire", tache: "corriger ou retirer ces imports — ils font tomber le filet ENTIER, donc bloquent tout commit" });
  }
  if (e.morsure.muets.length) {
    ecarts.push({ constat: `${e.morsure.muets.length} groupe(s) impriment « Passed » sans aucune assertion`, etat: "a-trancher", niveau: "recommandee", tache: "décider un par un : leur donner une vraie assertion, ou les retirer. Ezechiel ne tranche pas — un groupe peut être un point d'entrée légitime vers d'autres vérifications" });
  }
  if (e.morsure.tautologiques.length) {
    ecarts.push({ constat: `${e.morsure.tautologiques.length} groupe(s) portent une assertion sur une valeur littérale`, etat: "a-trancher", niveau: "recommandee", tache: "vérifier si elles décorent un vert ou si elles documentent une constante volontaire" });
  }
  if (e.sansRaison.length) {
    ecarts.push({ constat: `${e.sansRaison.length} groupe(s) sans raison écrite`, etat: "retenu", niveau: "recommandee", tache: "écrire ce que chacun protège — un test dont personne ne sait plus la raison se fait supprimer par le prochain agent (Article 27)" });
  }
  if (e.couches.mesurable && e.couches.partEnveloppePct >= 50) {
    ecarts.push({ constat: `l'enveloppe pèse ${e.couches.partEnveloppePct.toFixed(0)} % du temps bloquant, plus que les tests`, etat: "a-trancher", niveau: "obligatoire", tache: "porter la question à l'utilisateur AVANT de toucher un seul test : le gain est dans l'instrumentation et le typage, pas dans la suite" });
  } else if (!e.couches.mesurable) {
    ecarts.push({ constat: "d'où vient le temps n'a pas été mesuré", etat: "retenu", niveau: "obligatoire", tache: "relancer avec les trois durées (filet nu, sous instrumentation, typage) — sans elles, toute optimisation serait faite à l'aveugle" });
  }
  return ecarts;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  recordCliUsage("ezechiel-les-tests");
  printReportHeader({ tool: "ezechiel-les-tests", title: "EZECHIEL-LES-TESTS — le filet de sécurité, et tout ce qui l'entoure", scriptPath: "scripts/ezechiel-les-tests.mjs", origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
  printReliabilityNotice("ezechiel-les-tests");
  const durees = {
    nuMs: Number(process.env.EZ_NU_MS) || null,
    couvertureMs: Number(process.env.EZ_COUV_MS) || null,
    typageMs: Number(process.env.EZ_TSC_MS) || null,
  };
  const e = enqueter({ durees });
  for (const l of formatEnqueteLines(e)) console.log(l);
  imprimerPlanDaction(buildPlanDaction(planDeLEnquete(e), { toolSlug: "ezechiel-les-tests" }));
}
