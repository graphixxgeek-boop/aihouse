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
import { recordCliUsage, recordRegistryWrite } from "./tool-usage.mjs";

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
// Une position est-elle à l'intérieur d'une chaîne de caractères ? On scanne le préfixe en
// suivant les guillemets ouverts/fermés, en tenant compte de l'échappement. C'est la seule façon
// fiable de distinguer un import RÉEL d'un import CITÉ, et la distinction se pose forcément dans un
// fichier de tests, où citer du code est le travail ordinaire.
export function dansUneChaine(ligne = "", position = 0) {
  let quote = null;
  for (let i = 0; i < position && i < ligne.length; i++) {
    const c = ligne[i];
    if (c === "\\") { i++; continue; }
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === "'" || c === '"' || c === "`") quote = c;
  }
  return quote !== null;
}

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
  // UNE LIGNE « Passed » CITÉE DANS UNE CHAÎNE N'EST PAS UN GROUPE, et c'est le voyant de santé
  // lui-même qui l'a révélé à son premier passage réel : il annonçait « 4 succès attendus jamais
  // imprimés », donc des blocs sautés, alors que les quatre étaient des FIXTURES écrites dans les
  // contre-tests d'Ezechiel. Le voyant avait raison de crier sur l'écart ; c'est le dénombrement
  // qui était faux. Même correction que pour les imports cités (leçon L37 : corriger la CLASSE).
  const vraiGroupe = (l) => { const m = MOTIF_FIN_DE_GROUPE.exec(l); return m ? !dansUneChaine(l, m.index) : false; };
  for (let i = 0; i < lignes.length; i++) {
    if (!vraiGroupe(lignes[i])) continue;
    let fin = i;
    while (fin + 1 < lignes.length && vraiGroupe(lignes[fin + 1])) fin++;
    const corps = lignes.slice(debut, fin + 1);
    const titres = corps.filter((l) => vraiGroupe(l))
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
      // (3) TROISIÈME DÉFENSE, payée par le passage du 2026-09-27 : un import écrit DANS une chaîne
      //     de caractères est une fixture, pas un import. `const vraiImport = "await import('…')"`
      //     nourrit un contre-test d'Ezechiel lui-même — le dénoncer revenait à s'accuser soi-même
      //     d'un défaut qu'on venait d'inventer pour prouver qu'on savait le voir (leçon L4).
      if (dansUneChaine(ligne, m.index)) continue;
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
// LES TROIS PÉRIMÈTRES, DÉCLARÉS ET VÉRIFIÉS — jamais une promesse de ne pas se marcher dessus
// ---------------------------------------------------------------------------------------------
// DEMANDE EXPLICITE DE L'UTILISATEUR (2026-09-27) : « Les 3 outils ne se chevauchent pas et se
// combinent parfaitement : l'un peut faire appel à l'autre si besoin et si ça reste cohérent et
// pertinent : chacun son périmètre. »
//
// POURQUOI C'EST ÉCRIT EN CODE ET PAS EN PROSE : un commentaire promettant « on ne se chevauche
// pas » n'est jamais une protection, seulement une intention (Article 24). Ici la frontière est
// une DONNÉE, donc un test peut la vérifier, et un quatrième outil qui voudrait entrer sur un
// périmètre déjà tenu se ferait refuser au lieu de doubler quelqu'un en silence.
export const PERIMETRES = {
  "moise-tables-de-loi": { quoi: "LA CHARTE, et elle seule", fraicheur: "les FAITS qu'elle énonce (un chiffre annoncé correspond-il au dépôt réel ?)", jamais: "les tests, le code, les autres documents" },
  "abraham-les-references": { quoi: "N'IMPORTE quel document à règles numérotées", fraicheur: "les RÈGLES (porteur réel, citations vivantes, redondances)", jamais: "l'exécution d'un test, la durée d'une suite" },
  "ezechiel-les-tests": { quoi: "LE FILET DE SÉCURITÉ et toute la machinerie qui l'entoure", fraicheur: "la CORRESPONDANCE entre ce que les tests appellent et ce que le code offre encore", jamais: "le contenu d'un document de règles, le poids en tokens de la charte" },
};

export function chevauchementsDePerimetre(perimetres = PERIMETRES) {
  const quoi = Object.entries(perimetres).map(([outil, p]) => ({ outil, quoi: String(p.quoi).toLowerCase() }));
  const collisions = [];
  for (let i = 0; i < quoi.length; i++) {
    for (let j = i + 1; j < quoi.length; j++) {
      if (quoi[i].quoi === quoi[j].quoi) collisions.push({ outils: [quoi[i].outil, quoi[j].outil], quoi: quoi[i].quoi, pourquoi: "deux outils revendiquent exactement le même objet : l'un des deux travaille pour rien, et personne ne sait lequel croire quand ils divergent (leçon L29)" });
    }
  }
  const sansFraicheur = Object.entries(perimetres).filter(([, p]) => !p.fraicheur).map(([o]) => o);
  return { collisions, sansFraicheur };
}

// ---------------------------------------------------------------------------------------------
// LA FRAÎCHEUR DU DOCUMENT QU'EZECHIEL INSPECTE — sa part du contrat à trois
// ---------------------------------------------------------------------------------------------
// « Vérifier que les tests présents sont toujours à jour, en parfaite correspondance avec
// l'existant dans le code », dans ses mots. Un test qui appelle une fonction qui n'est plus
// exportée ne PROTÈGE plus rien : soit il échoue et bloque tout, soit — bien pire — il teste une
// valeur `undefined` sans s'en apercevoir.
//
// LA LIMITE EST DÉCLARÉE, PAS TUE : Ezechiel lit les exports par le texte. Une fonction exposée
// autrement (réexport, objet construit dynamiquement) peut lui échapper, et il le dit plutôt que de
// la déclarer disparue — accuser une fonction bien vivante coûterait plus cher que de la manquer.
export function fraicheurDuFilet(src = "", { root = ROOT, lire = null } = {}) {
  const lireF = lire ?? ((f) => { try { return readFileSync(join(root, f), "utf8"); } catch { return null; } });
  // Quel alias d'import pointe vers quel module ? `const ez = await import('../scripts/x.mjs')`.
  // UN ALIAS RÉUTILISÉ POUR DEUX MODULES N'ACCUSE PLUS PERSONNE, et le premier passage l'a payé :
  // `const g = await import(...)` apparaît dans plusieurs blocs du filet, sur des modules
  // DIFFÉRENTS. Une carte globale gardait le dernier, et Ezechiel dénonçait alors `validerSaisine`
  // comme disparue de god-of-all-process — alors qu'elle vit dans rapport-gros-prompt et se porte
  // très bien. Un alias ambigu est une non-mesure, jamais une accusation (leçons L4 et L5).
  const candidats = new Map();
  for (const m of String(src).matchAll(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+import\(\s*['"`](\.{1,2}\/[^'"`]+)['"`]/g)) {
    const chemin = m[2].replace(/^\.\.\//, "").replace(/^\.\//, "scripts/");
    if (!candidats.has(m[1])) candidats.set(m[1], new Set());
    candidats.get(m[1]).add(chemin);
  }
  const alias = new Map(); const aliasAmbigus = [];
  for (const [nom, chemins] of candidats) {
    if (chemins.size === 1) alias.set(nom, [...chemins][0]);
    else aliasAmbigus.push({ alias: nom, modules: [...chemins], pourquoi: "ce nom d'alias désigne plusieurs modules selon le bloc : impossible de dire lequel est appelé, donc rien n'est affirmé sur lui" });
  }
  if (!alias.size) return { mesurable: false, pourquoi: "aucun module importé sous un alias n'a été reconnu — sans eux on ne peut relier aucun appel à un fichier, ce qui n'est jamais la même chose qu'une correspondance parfaite" };
  const exportsDe = new Map();
  for (const [, chemin] of alias) {
    if (exportsDe.has(chemin)) continue;
    const code = lireF(chemin);
    if (code == null) { exportsDe.set(chemin, null); continue; }
    const noms = new Set();
    for (const m of String(code).matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) noms.add(m[1]);
    for (const m of String(code).matchAll(/export\s+(?:const|let|class)\s+([A-Za-z_$][\w$]*)/g)) noms.add(m[1]);
    // UN BLOC `export { … }` CONTIENT DES COMMENTAIRES DANS CE DÉPÔT, et les garder faisait rater
    // les noms qui les suivent : `bibliothequesLancables` et `md` étaient déclarés disparus alors
    // qu'ils sont bel et bien réexportés. Troisième faux positif de la même fonction au même
    // passage — on retire les commentaires AVANT de découper, jamais après (leçon L4).
    for (const m of String(code).matchAll(/export\s*\{([^}]*)\}/g)) {
      const sansCommentaires = m[1].replace(/\/\/[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");
      for (const n of sansCommentaires.split(",")) {
        const nom = n.split(/\s+as\s+/).pop().trim();
        if (/^[A-Za-z_$][\w$]*$/.test(nom)) noms.add(nom);
      }
    }
    exportsDe.set(chemin, noms);
  }
  const perimes = []; const vus = new Set(); let appelsExamines = 0; const modulesIllisibles = [];
  // LE VOCABULAIRE DU LANGAGE N'EST PAS UN EXPORT MANQUANT, et le premier passage l'a prouvé :
  // `cassandra.includes(...)` et `cassandra.charCodeAt(...)` étaient dénoncés comme des fonctions
  // disparues alors que ce sont des méthodes de JavaScript, appelées sur une variable qui porte le
  // même nom qu'un alias de module. Cette liste est un vocabulaire FERMÉ par nature — il n'a rien
  // à synchroniser avec le dépôt, donc rien ne peut y diverger (Article 24, exception déclarée).
  const METHODES_DU_LANGAGE = new Set([
    "includes", "indexOf", "lastIndexOf", "charCodeAt", "charAt", "slice", "split", "join", "replace",
    "replaceAll", "trim", "toLowerCase", "toUpperCase", "startsWith", "endsWith", "padStart", "padEnd",
    "map", "filter", "reduce", "forEach", "find", "findIndex", "some", "every", "sort", "concat",
    "push", "pop", "shift", "unshift", "flat", "flatMap", "get", "set", "has", "delete", "add", "keys",
    "values", "entries", "then", "catch", "finally", "toString", "match", "matchAll", "test", "exec",
    "repeat", "at", "toFixed", "call", "apply", "bind", "normalize",
  ]);
  // UN COMMENTAIRE N'APPELLE RIEN, et c'était le quatrième faux positif du même passage : la phrase
  // « jamais le vrai harmonia.md (qui varierait dans le temps) » se lisait comme un appel à une
  // fonction `md` de check-harmonia. On scanne le code NU, jamais le fichier brut — exactement la
  // même correction que pour les chemins de fixture plus haut, et c'est la troisième fois que le
  // même principe s'applique : ce qui est écrit POUR ÊTRE LU n'est pas ce qui est EXÉCUTÉ.
  const codeNu = String(src).replace(/\/\/[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");
  for (const m of codeNu.matchAll(/\b([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\s*\(/g)) {
    const chemin = alias.get(m[1]);
    if (!chemin) continue;
    const noms = exportsDe.get(chemin);
    if (noms === null) { if (!modulesIllisibles.includes(chemin)) modulesIllisibles.push(chemin); continue; }
    if (METHODES_DU_LANGAGE.has(m[2])) continue;
    appelsExamines++;
    const cle = `${chemin}::${m[2]}`;
    if (vus.has(cle)) continue;
    vus.add(cle);
    if (!noms.has(m[2])) perimes.push({ module: chemin, fonction: m[2], pourquoi: `le filet appelle « ${m[2]} » que ${chemin} n'exporte plus : le test ne vérifie plus rien, et il peut passer sur un \`undefined\` sans le dire` });
  }
  return { mesurable: true, appelsExamines, modulesSuivis: exportsDe.size, modulesIllisibles, aliasAmbigus, perimes };
}

// ---------------------------------------------------------------------------------------------
// LES ASSERTIONS QUI NE PEUVENT PAS ÉCHOUER PARCE QUE PERSONNE NE LES ATTEND
// ---------------------------------------------------------------------------------------------
// « Vérifier que la suite de tests fonctionne parfaitement », dans ses mots — et c'est le défaut le
// plus silencieux qui existe dans une suite : une assertion sur une promesse jamais attendue passe
// TOUJOURS, quoi qu'on casse. Elle ne ressemble pas à un test cassé, elle ressemble à un test vert.
// LE MOTIF A ÉTÉ CORRIGÉ À SON PREMIER CONTRE-TEST, et le cas raté était le plus courant de tous :
// il exigeait un NOM juste avant `.then(`, si bien que `assert.ok(f().then(…))` — une fonction
// appelée sur place, la forme qu'on écrit vraiment — lui échappait. Ce qu'on cherche est plus
// simple à dire : entre l'ouverture de l'assertion et le `.then(`, aucun `await` n'apparaît.
export const MOTIF_ASSERTION_NON_ATTENDUE = /assert\.[a-zA-Z]+\((?:(?!await)[^;])*\.(?:then|catch)\s*\(/;

export function assertionsNonAttendues(src = "") {
  const lignes = String(src).split("\n");
  const trouvees = [];
  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    if (!/\bassert\.[a-zA-Z]+\(/.test(l)) continue;
    // Une fonction async appelée SANS await à l'intérieur d'une assertion : la promesse est
    // comparée, jamais sa valeur. L'indice mécanique fiable est l'absence de `await` sur une
    // expression qui en appelle une, ou un `.then(` non attendu.
    if (!MOTIF_ASSERTION_NON_ATTENDUE.test(l)) continue;
    // TROISIÈME FOIS QUE LA MÊME CLASSE DE DÉFAUT SE PRÉSENTE DANS CET OUTIL, et c'est la leçon L37
    // prise sur le fait : un fichier de tests CITE du code, et le code cité n'est pas du code
    // exécuté. Après les imports et les lignes de succès, ce sont les assertions — celle-ci
    // s'accusait elle-même, puisque son propre contre-test contient le défaut qu'elle cherche.
    const dehors = [...l.matchAll(/\.(?:then|catch)\s*\(/g)].some((m) => !dansUneChaine(l, m.index));
    if (!dehors) continue;
    trouvees.push({ ligne: i + 1, extrait: l.trim().slice(0, 110), pourquoi: "une promesse est comparée au lieu de sa valeur : cette assertion passera quoi qu'on casse dans le code" });
  }
  return trouvees;
}

// ---------------------------------------------------------------------------------------------
// LE CROISEMENT COÛT / PROTECTION — le cœur de sa vocation, et son arbitrage choisi
// ---------------------------------------------------------------------------------------------
// TRANCHÉ PAR L'UTILISATEUR EN FENÊTRE DÉDIÉE : « un classement coût / protection ». Chaque groupe
// reçoit deux chiffres côte à côte, et le rapport s'ouvre sur ceux qui coûtent le plus en
// protégeant le moins — la liste courte sur laquelle on peut décider en dix minutes.
//
// LE PIÈGE QU'IL ÉVITE, et il est l'essentiel : un groupe LENT n'est pas un groupe à retirer. Un
// balayage qui lit tout le dépôt met du temps parce qu'il fait son travail. Ce qui se discute est
// le RAPPORT entre le temps payé et ce qui est vérifié — jamais le temps seul.
export function croiserCoutEtProtection(groupes = [], mesures = []) {
  if (!groupes.length || !mesures.length) {
    return { mesurable: false, pourquoi: "il faut À LA FOIS le découpage du filet et son chronométrage : l'un sans l'autre ne dit rien du rapport entre le temps payé et ce qui est protégé (leçons L5/L11)" };
  }
  // Les deux sources parlent des mêmes groupes, dans le même ordre — c'est délibéré, et c'est
  // pourquoi Ezechiel réutilise le découpage de SMART-CONSO-TOKEN au lieu d'en inventer un second.
  const n = Math.min(groupes.length, mesures.length);
  const lignes = [];
  for (let i = 0; i < n; i++) {
    const g = groupes[i]; const ms = mesures[i]?.ms ?? 0;
    const assertions = (g.texte.match(/\bassert\.[a-zA-Z]+\(/g) ?? []).length;
    lignes.push({
      ligne: g.ligne, titre: g.titre || "(sans titre)", ms, assertions,
      // Le rapport se lit « millisecondes par assertion » : c'est grossier, et c'est assumé —
      // il ouvre la question, il ne la tranche pas. Un groupe cher par assertion peut être
      // parfaitement légitime, et c'est justement ce que l'humain doit regarder.
      msParAssertion: assertions > 0 ? ms / assertions : Infinity,
    });
  }
  const aRegarder = [...lignes].filter((l) => l.ms > 0).sort((a, b) => b.msParAssertion - a.msParAssertion);
  const total = lignes.reduce((a, l) => a + l.ms, 0);
  return {
    mesurable: true, groupes: lignes.length, totalMs: total,
    aRegarder: aRegarder.slice(0, 12),
    sansAucuneAssertion: lignes.filter((l) => l.assertions === 0 && l.ms > 0),
    horsPortee: "Un groupe lent n'est pas un groupe à retirer : un balayage qui lit tout le dépôt met du temps parce qu'il fait son travail. Ce classement ouvre la question du rapport temps/protection, il ne tranche jamais — et Ezechiel n'écrit jamais dans le filet.",
  };
}

// ---------------------------------------------------------------------------------------------
// LE CHRONOMÈTRE PAR GROUPE — sans lui, le croisement coût/protection n'a rien à croiser
// ---------------------------------------------------------------------------------------------
// « Des secondes gagnées À PROTECTION ÉGALE », dans ses mots, est le seul gain qui compte. Encore
// faut-il savoir où vont les secondes. Le filet imprime une ligne « Passed » à la fin de chaque
// groupe : horodater ces lignes à l'exécution donne le temps de chacun, sans toucher une seule
// ligne du filet — et ne pas le toucher est la règle qui gouverne tout cet outil.
//
// POURQUOI LA MESURE EST ÉCRITE SUR DISQUE ET RELUE ENSUITE : le chronométrage coûte une exécution
// complète du filet (≈ 45 s). L'enquête, elle, doit rester instantanée pour qu'on la lance
// souvent. Les deux sont donc séparés, et l'enquête dit franchement « pas mesuré » quand aucune
// mesure n'existe, plutôt que de présenter un classement vide comme un filet sans problème.
export const FICHIER_DE_MESURE = "docs/ezechiel-les-tests/mesures.json";

// Les lignes horodatées viennent de l'exécution réelle ; les groupes, du texte. Les recoller est
// la seule étape délicate : un groupe qui imprime cinq « Passed » consomme cinq lignes, pas une.
export function recollerLeChrono(groupes = [], lignesHorodatees = []) {
  const passed = lignesHorodatees.filter((l) => /^Passed\s*:/.test(String(l.texte).trim()));
  const mesures = [];
  let i = 0, precedent = 0;
  for (const g of groupes) {
    const combien = Math.max(1, g.sujets || 1);
    const derniere = passed[i + combien - 1];
    if (!derniere) break;
    mesures.push({ ligne: g.ligne, titre: g.titre, ms: Math.max(0, derniere.ms - precedent) });
    precedent = derniere.ms;
    i += combien;
  }
  // Le recollage est un fait vérifiable, pas une supposition : s'il reste des lignes « Passed » que
  // le découpage n'explique pas, la mesure est DÉCLARÉE incomplète plutôt que servie telle quelle.
  return { mesures, lignesPassed: passed.length, consommees: i, complet: i === passed.length && mesures.length === groupes.length };
}

export function mesuresEnregistrees({ root = ROOT, lire = null } = {}) {
  const lireF = lire ?? ((f) => { try { return readFileSync(join(root, f), "utf8"); } catch { return null; } });
  const brut = lireF(FICHIER_DE_MESURE);
  if (brut == null) return { presentes: false, pourquoi: `aucune mesure enregistrée (${FICHIER_DE_MESURE}) — lancer \`node scripts/ezechiel-les-tests.mjs mesurer\`` };
  try {
    const j = JSON.parse(brut);
    return { presentes: true, quand: j.quand ?? null, source: j.source ?? null, sante: j.sante ?? null, totalMs: j.totalMs ?? null, mesures: Array.isArray(j.mesures) ? j.mesures : [] };
  } catch {
    return { presentes: false, pourquoi: `${FICHIER_DE_MESURE} illisible — un fichier de mesure abîmé se lirait comme une absence de problème` };
  }
}

// ---------------------------------------------------------------------------------------------
// LA SANTÉ DU FILET — le voyant vert sur le FONCTIONNEMENT de la suite, pas sur son contenu
// ---------------------------------------------------------------------------------------------
// DEMANDE EXPLICITE DE L'UTILISATEUR (2026-09-27) : « Ezechiel doit aussi savoir dire si le
// fonctionnement général de la suite de test est lui-même OK VERT et ne subit aucune erreur de
// fonctionnement, aucune anomalie. »
//
// POURQUOI C'EST UNE QUESTION À PART, et pas la même que « les tests passent-ils ? » : une suite
// peut rendre un code de sortie 0 en ayant SAUTÉ la moitié de ses blocs, en ayant exécuté le même
// deux fois, ou en crachant des avertissements que plus personne ne lit. Le code de sortie ne dit
// qu'une chose : aucune assertion n'a levé. Tout le reste passe sous le radar — et c'est
// exactement le genre de vert creux que ce projet traque partout ailleurs.
//
// LES CINQ ANOMALIES SURVEILLÉES, chacune avec ce qu'elle coûte si personne ne la voit :
//   1. la suite ne rend pas 0 — le cas évident, mais il doit être dit AVANT les quatre autres,
//      parce qu'une suite rouge rend tous les autres chiffres ininterprétables ;
//   2. des blocs déclarés dans le texte n'ont jamais imprimé leur succès — ils ont été sautés, et
//      un bloc sauté ressemble trait pour trait à un bloc qui passe ;
//   3. un même succès imprimé DEUX fois — un bloc exécuté en double coûte son temps deux fois et
//      fausse tout classement de coût ;
//   4. des avertissements du moteur (obsolescence, API expérimentale, écouteurs en fuite) — chacun
//      annonce une panne future, et ils s'accumulent justement parce qu'ils ne cassent rien ;
//   5. une sortie d'erreur non vide alors que la suite est verte — du bruit qui finira par cacher
//      un vrai message le jour où il arrivera.
export const MOTIFS_D_AVERTISSEMENT = [
  { cle: "obsolescence", motif: /DeprecationWarning/i, quoi: "une fonction du moteur est dépréciée : elle disparaîtra à une version près, et la suite tombera d'un coup sans que le code ait changé" },
  { cle: "experimental", motif: /ExperimentalWarning/i, quoi: "une API expérimentale est utilisée : son comportement peut changer sans préavis" },
  { cle: "fuite", motif: /MaxListenersExceeded|possible EventEmitter memory leak/i, quoi: "des écouteurs s'accumulent sans être retirés : c'est le symptôme classique d'une fuite qui ralentit la suite à mesure qu'elle grossit" },
  { cle: "promesse-non-gerée", motif: /UnhandledPromiseRejection|unhandled rejection/i, quoi: "une promesse a échoué sans que personne ne l'attrape : selon la version du moteur, ça passe en silence aujourd'hui et fait tomber la suite demain" },
];

export function santeDuFilet({ code = null, ms = null, lignes = [], groupes = [] } = {}) {
  if (code === null || !lignes.length) {
    return { mesurable: false, pourquoi: "il faut une EXÉCUTION réelle de la suite : sa santé de fonctionnement ne se lit pas dans le texte du fichier, seulement dans ce qui se passe quand on la lance (leçons L5/L11)" };
  }
  const anomalies = [];
  if (code !== 0) {
    anomalies.push({ cle: "rouge", gravite: "bloquante", quoi: `la suite s'est terminée avec le code ${code}`, pourquoi: "tant qu'elle est rouge, aucun autre chiffre de cette page n'est interprétable : les blocs suivants n'ont jamais tourné" });
  }
  const succes = lignes.map((l) => String(l.texte ?? l).trim()).filter((t) => /^Passed\s*:/.test(t));
  const attendus = groupes.reduce((a, g) => a + Math.max(1, g.sujets || 1), 0);
  if (code === 0 && attendus && succes.length < attendus) {
    anomalies.push({ cle: "blocs-sautes", gravite: "bloquante", quoi: `${attendus - succes.length} succès attendu(s) n'ont jamais été imprimés (${succes.length} sur ${attendus})`, pourquoi: "des blocs déclarés dans le fichier n'ont pas tourné : un bloc sauté ressemble exactement à un bloc qui passe, et il ne protège plus rien" });
  }
  const vus = new Map();
  for (const t of succes) vus.set(t, (vus.get(t) ?? 0) + 1);
  const doubles = [...vus.entries()].filter(([, n]) => n > 1).map(([t, n]) => ({ texte: t.slice(0, 80), combien: n }));
  if (doubles.length) {
    anomalies.push({ cle: "doublons", gravite: "sérieuse", quoi: `${doubles.length} succès imprimé(s) plus d'une fois`, pourquoi: "un bloc exécuté deux fois paie son temps deux fois et fausse tout classement de coût — et, plus vicieux, il peut signaler que le fichier est importé deux fois", detail: doubles.slice(0, 5) });
  }
  const texteComplet = lignes.map((l) => String(l.texte ?? l)).join("\n");
  for (const a of MOTIFS_D_AVERTISSEMENT) {
    const n = (texteComplet.match(new RegExp(a.motif.source, "gi")) ?? []).length;
    if (n) anomalies.push({ cle: a.cle, gravite: "à surveiller", quoi: `${n} avertissement(s) « ${a.cle} » pendant l'exécution`, pourquoi: a.quoi });
  }
  const bruit = lignes.filter((l) => l.flux === "erreur" && String(l.texte).trim()).length;
  if (code === 0 && bruit) {
    anomalies.push({ cle: "bruit", gravite: "à surveiller", quoi: `${bruit} ligne(s) écrites sur la sortie d'erreur alors que la suite est verte`, pourquoi: "du bruit toléré finit par cacher le vrai message le jour où il arrive — c'est ainsi qu'une alerte réelle passe inaperçue" });
  }
  const bloquantes = anomalies.filter((a) => a.gravite === "bloquante");
  return {
    mesurable: true, code, ms, succes: succes.length, attendus,
    anomalies,
    vert: anomalies.length === 0,
    // « VERT » et « SANS ANOMALIE BLOQUANTE » ne sont pas la même chose, et les confondre serait
    // exactement le vert creux que cette fonction existe pour empêcher. Les deux sont rendus.
    sansBlocage: bloquantes.length === 0,
    verdict: anomalies.length === 0
      ? "VERT — la suite tourne entièrement, rend 0, n'imprime aucun avertissement et ne saute aucun bloc."
      : (bloquantes.length ? `🚨 ANOMALIE BLOQUANTE — ${bloquantes.map((a) => a.quoi).join(" · ")}` : `🟡 ÇA TOURNE, MAIS — ${anomalies.length} anomalie(s) non bloquante(s) : un vert qui laisse passer du bruit finit par cacher une vraie alerte.`),
  };
}

export function formatSanteLines(s) {
  if (!s?.mesurable) return [`PAS MESURÉ — ${s.pourquoi}`];
  const L = [`${s.verdict}`, `  code de sortie ${s.code} · ${s.succes}/${s.attendus} succès imprimés${s.ms ? ` · ${(s.ms / 1000).toFixed(1)} s` : ""}`];
  for (const a of s.anomalies) L.push(`   ${a.gravite === "bloquante" ? "🚨" : a.gravite === "sérieuse" ? "🟠" : "🟡"} ${a.quoi} — ${a.pourquoi}`);
  return L;
}

// ---------------------------------------------------------------------------------------------
// LA PASSE DE ROBUSTESSE — casser le code exprès, et regarder si le filet mord
// ---------------------------------------------------------------------------------------------
// TRANCHÉ PAR L'UTILISATEUR EN FENÊTRE DÉDIÉE : « robustesse en passe séparée ». Elle ne tourne
// donc JAMAIS dans l'enquête ordinaire, et ce n'est pas une précaution de confort : elle modifie
// de vrais fichiers du dépôt le temps d'un lancement. Mélangée à une enquête qu'on lance sans y
// penser, elle finirait par tourner sur un dépôt qu'on croyait intact.
//
// CE QU'ELLE RÉPOND, ET PERSONNE D'AUTRE NE SAIT LE FAIRE ICI : « vérifier que la suite de tests
// est fiable et permet d'assurer la sécurité du code », dans ses mots. Un filet vert prouve que
// rien n'a échoué ; il ne prouve pas qu'il attraperait quelque chose. C'est la leçon BP2 prise au
// sérieux — un test qui n'a jamais échoué ne prouve rien — et c'est aussi la limite honnête
// déclarée en tête de ce fichier, enfin comblée par la seule voie possible : l'exécution.
//
// LE SEUL CHIFFRE QUI COMPTE ICI : combien de cassures volontaires le filet a-t-il ATTRAPÉES. Une
// cassure SURVIVANTE est une zone que le filet ne protège pas — et c'est ce chiffre-là qui autorise
// ou interdit d'alléger un groupe. Alléger sans lui, c'est deviner.

// Les opérateurs sont du VOCABULAIRE DE LANGAGE, pas un registre du dépôt : la liste des
// comparaisons de JavaScript ne bouge pas, donc l'Article 24 ne s'y applique pas (il l'exempte
// explicitement pour « une liste qui ne peut pas changer »). Les CIBLES, elles, se dérivent.
export const OPERATEURS_DE_MUTATION = [
  { cle: "egalite-stricte", de: "===", vers: "!==", quoi: "une égalité devient une différence" },
  { cle: "difference-stricte", de: "!==", vers: "===", quoi: "une différence devient une égalité" },
  { cle: "et-logique", de: " && ", vers: " || ", quoi: "un ET devient un OU : une condition qui exigeait deux choses n'en exige plus qu'une" },
  { cle: "superieur-ou-egal", de: " >= ", vers: " > ", quoi: "un seuil inclusif devient exclusif : le cas limite exact n'est plus couvert" },
  { cle: "inferieur-ou-egal", de: " <= ", vers: " < ", quoi: "un seuil inclusif devient exclusif, dans l'autre sens" },
];

// Les cibles se LISENT dans le filet : ce sont les modules qu'il importe pour de vrai. Une liste
// écrite à la main aurait vieilli au premier outil ajouté, et aurait surtout menti sur la
// couverture — on aurait mesuré la robustesse du filet sur les fichiers auxquels on a pensé.
export function ciblesDeMutation(src = "", { root = ROOT, existe = null } = {}) {
  const existeF = existe ?? ((f) => existsSync(join(root, f)));
  const vus = new Set();
  for (const m of String(src).matchAll(/await\s+import\(\s*['"`](\.{1,2}\/[^'"`]+)['"`]/g)) {
    const chemin = m[1].replace(/^\.\.\//, "").replace(/^\.\//, "scripts/");
    if (chemin.includes("/fixtures/") || chemin.includes("test-")) continue;
    if (existeF(chemin)) vus.add(chemin);
  }
  return [...vus].sort();
}

// Une mutation n'est retenue que si elle est RÉVERSIBLE SANS AMBIGUÏTÉ : on remplace UNE occurrence
// précise, repérée par son numéro de ligne et son texte exact. Un remplacement global serait
// impossible à défaire proprement si le lancement mourait au milieu.
export function mutationsPossibles(chemin, contenu = "", { operateurs = OPERATEURS_DE_MUTATION, maxParFichier = 3 } = {}) {
  const lignes = String(contenu).split("\n");
  const trouvees = [];
  for (let i = 0; i < lignes.length && trouvees.length < maxParFichier; i++) {
    const l = lignes[i];
    // On ne mute ni un commentaire (aucun effet, donc une survivante qui ne veut rien dire), ni
    // une ligne de garde-fou d'export : le premier passage aurait rendu des faux « non attrapé ».
    const nu = l.replace(/\/\/.*$/, "");
    if (!nu.trim() || nu.trim().startsWith("*")) continue;
    for (const op of operateurs) {
      const pos = nu.indexOf(op.de);
      if (pos < 0) continue;
      trouvees.push({
        chemin, ligne: i + 1, operateur: op.cle, quoi: op.quoi,
        avant: l,
        apres: l.slice(0, pos) + op.vers + l.slice(pos + op.de.length),
      });
      break;
    }
  }
  return trouvees;
}

// Le verdict. UNE SURVIVANTE N'EST PAS UNE FAUTE EN SOI, et le dire est essentiel : une mutation
// peut tomber sur une ligne que personne n'a jamais demandé au filet de protéger. Ce que le chiffre
// autorise, c'est de savoir OÙ on peut alléger sans rien perdre — et où on ne peut surtout pas.
export function verdictDeRobustesse(resultats = [], { filetVertAvant = true } = {}) {
  if (!filetVertAvant) {
    return { mesurable: false, pourquoi: "le filet était DÉJÀ rouge avant la première cassure : tout aurait été compté comme « attrapé » sans que le filet y soit pour quoi que ce soit (leçons L5/L11 — ne jamais confondre « rien trouvé » et « pas pu regarder »)" };
  }
  if (!resultats.length) return { mesurable: false, pourquoi: "aucune cassure n'a été tentée — un score sur zéro essai se lirait comme un filet parfait" };
  const attrapees = resultats.filter((r) => r.attrapee);
  const survivantes = resultats.filter((r) => !r.attrapee);
  return {
    mesurable: true,
    tentees: resultats.length,
    attrapees: attrapees.length,
    survivantes,
    tauxPct: (attrapees.length / resultats.length) * 100,
    horsPortee: "Une survivante dit que le filet ne surveille pas CETTE ligne-là ; elle ne dit pas qu'un test manque. La décision reste humaine — Ezechiel n'écrit jamais dans le filet.",
  };
}

export function formatRobustesseLines(v) {
  if (!v?.mesurable) return [`PAS MESURÉ — ${v?.pourquoi ?? "aucune donnée"}`];
  const L = [`${v.attrapees}/${v.tentees} cassures volontaires ATTRAPÉES par le filet (${v.tauxPct.toFixed(0)} %).`, ""];
  if (!v.survivantes.length) L.push("Aucune survivante sur cet échantillon : sur ces lignes-là, le filet mord pour de vrai.");
  else {
    L.push(`${v.survivantes.length} SURVIVANTE(S) — le filet est resté vert alors que le code était cassé :`);
    for (const s of v.survivantes) L.push(`   🚨 ${s.chemin}:${s.ligne} (${s.operateur}) — ${s.quoi}`);
  }
  L.push("", v.horsPortee);
  return L;
}

// ---------------------------------------------------------------------------------------------
// LE GAIN, ET CE QU'IL A COÛTÉ EN PROTECTION — les deux exigences ajoutées le 2026-09-27
// ---------------------------------------------------------------------------------------------
// TRANCHÉ PAR L'UTILISATEUR EN FENÊTRE DÉDIÉE, les deux d'un coup. Sans elles, la vocation ultime
// d'Ezechiel — faire baisser le temps d'exécution — n'avait aucun juge : l'outil savait mesurer
// l'ÉTAT du filet, jamais l'EFFET d'un changement. On aurait su que c'était plus rapide ; jamais
// combien, ni grâce à quoi, ni à quel prix.
//
// LA RÈGLE QUI GOUVERNE LES DEUX, et elle est non négociable : UN ALLÈGEMENT QUI FAIT PERDRE UNE
// PROTECTION EST REFUSÉ, quel que soit le temps qu'il fait gagner. Sa dixième exigence, mot pour
// mot : « vérifier que les changements proposés n'impactent pas la robustesse du code ». Des
// secondes gagnées contre une cassure qui passe désormais inaperçue n'est pas un gain, c'est une
// dette qu'on découvrira le jour où elle coûtera cher.
export const FICHIER_HISTORIQUE = "docs/ezechiel-les-tests/historique.json";
export const FICHIER_ROBUSTESSE = "docs/ezechiel-les-tests/robustesse.json";

export function lireHistorique({ root = ROOT, lire = null } = {}) {
  const lireF = lire ?? ((f) => { try { return readFileSync(join(root, f), "utf8"); } catch { return null; } });
  const brut = lireF(FICHIER_HISTORIQUE);
  if (brut == null) return [];
  try { const j = JSON.parse(brut); return Array.isArray(j) ? j : []; } catch { return []; }
}

// LE GAIN NE SE LIT QUE SUR DEUX RELEVÉS COMPARABLES. Deux exécutions dont l'une était rouge ne se
// comparent pas : la rouge s'est arrêtée en chemin, donc elle est forcément « plus rapide ».
export function comparerDeuxReleves(avant = null, apres = null) {
  if (!avant || !apres) {
    return { mesurable: false, pourquoi: "il faut DEUX relevés chronométrés pour parler de gain — avec un seul on connaît un état, jamais un effet (leçons L5/L11)" };
  }
  if (avant.code !== 0 || apres.code !== 0) {
    return { mesurable: false, pourquoi: "l'un des deux relevés vient d'une suite ROUGE : elle s'est arrêtée en chemin, donc elle paraît forcément plus rapide — comparer les deux produirait un gain qui n'existe pas" };
  }
  const gainMs = avant.totalMs - apres.totalMs;
  const gainPct = avant.totalMs > 0 ? (gainMs / avant.totalMs) * 100 : 0;
  // LA MARGE DE BRUIT EST DÉRIVÉE, PAS CHOISIE : deux exécutions de la même suite sur la même
  // machine varient déjà de quelques pour cent. Annoncer « 1,2 s gagnées » sur cette marge-là
  // serait exactement le pourcentage négatif qui se lit comme un résultat (Article 32, faille 3).
  const bruit = Math.abs(gainPct) < MARGE_DE_BRUIT_PCT;
  return {
    mesurable: true, avantMs: avant.totalMs, apresMs: apres.totalMs, gainMs, gainPct, bruit,
    verdict: bruit
      ? `AUCUN EFFET MESURABLE — l'écart (${(gainMs / 1000).toFixed(1)} s) tient dans la marge de bruit de ${MARGE_DE_BRUIT_PCT} % : deux exécutions de la même suite varient déjà d'autant.`
      : (gainMs > 0
        ? `GAIN RÉEL — ${(gainMs / 1000).toFixed(1)} s de moins (${gainPct.toFixed(1)} %), de ${(avant.totalMs / 1000).toFixed(1)} s à ${(apres.totalMs / 1000).toFixed(1)} s.`
        : `PERTE — le filet a RALENTI de ${(-gainMs / 1000).toFixed(1)} s (${(-gainPct).toFixed(1)} %). Un chantier d'allègement qui ralentit son objet est un chantier à arrêter, pas à poursuivre.`),
  };
}

export const MARGE_DE_BRUIT_PCT = 3;

export function lireRobustesse({ root = ROOT, lire = null } = {}) {
  const lireF = lire ?? ((f) => { try { return readFileSync(join(root, f), "utf8"); } catch { return null; } });
  const brut = lireF(FICHIER_ROBUSTESSE);
  if (brut == null) return [];
  try { const j = JSON.parse(brut); return Array.isArray(j) ? j : []; } catch { return []; }
}

// UNE PROTECTION PERDUE EST UN VETO, JAMAIS UNE REMARQUE. Chaque cassure est identifiée par
// fichier + ligne + opérateur : si la même cassure était ATTRAPÉE avant et SURVIT après, le filet
// a cessé de surveiller cette ligne, et l'allègement qui l'a causé est refusé.
export function comparerLaProtection(avant = null, apres = null) {
  if (!avant?.resultats?.length || !apres?.resultats?.length) {
    return { mesurable: false, pourquoi: "il faut DEUX passes de robustesse pour dire ce qu'un allègement a coûté en protection — sans la passe d'avant, « rien n'a été perdu » serait un verdict rendu sur zéro donnée (leçons L5/L11)" };
  }
  const cle = (r) => `${r.chemin}:${r.ligne}:${r.operateur}`;
  const etatAvant = new Map(avant.resultats.map((r) => [cle(r), r.attrapee]));
  const perdues = [], gagnees = [], nonComparables = [];
  for (const r of apres.resultats) {
    const k = cle(r);
    if (!etatAvant.has(k)) {
      // UNE CASSURE QUI N'EXISTAIT PAS AVANT NE PROUVE RIEN, et le dire est capital : la ligne a pu
      // bouger, ou le fichier changer. La compter comme perdue accuserait l'allègement d'un tort
      // qu'on n'a pas mesuré (leçon L4).
      nonComparables.push({ ...r, pourquoi: "cette cassure n'avait pas d'équivalent dans la passe d'avant : la ligne a bougé, donc rien ne peut lui être imputé" });
      continue;
    }
    if (etatAvant.get(k) && !r.attrapee) perdues.push({ ...r, pourquoi: "le filet ATTRAPAIT cette cassure avant l'allègement et ne l'attrape plus : cette ligne du code n'est plus surveillée" });
    if (!etatAvant.get(k) && r.attrapee) gagnees.push(r);
  }
  return {
    mesurable: true, comparees: apres.resultats.length - nonComparables.length,
    perdues, gagnees, nonComparables,
    accepte: perdues.length === 0,
    verdict: perdues.length === 0
      ? `PROTECTION INTACTE — aucune cassure attrapée avant ne survit après${gagnees.length ? `, et ${gagnees.length} de plus sont désormais attrapées` : ""}.`
      : `🚨 REFUS — ${perdues.length} protection(s) perdue(s). Des secondes gagnées contre une cassure qui passe désormais inaperçue n'est pas un gain, c'est une dette qu'on découvrira le jour où elle coûtera cher.`,
  };
}

export function formatGainLines(g, p) {
  const L = ["=== L'EFFET DU DERNIER CHANGEMENT SUR LE TEMPS ==="];
  L.push(g?.mesurable ? `  ${g.verdict}` : `  PAS MESURÉ — ${g?.pourquoi ?? "aucune donnée"}`);
  L.push("", "=== CE QU'IL A COÛTÉ EN PROTECTION ===");
  if (!p?.mesurable) L.push(`  PAS MESURÉ — ${p?.pourquoi ?? "aucune donnée"}`);
  else {
    L.push(`  ${p.verdict}`);
    for (const x of p.perdues) L.push(`   🚨 ${x.chemin}:${x.ligne} (${x.operateur}) — ${x.pourquoi}`);
    if (p.nonComparables.length) L.push(`  (${p.nonComparables.length} cassure(s) non comparable(s) : la ligne a bougé, rien ne leur est imputé)`);
  }
  return L;
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
  const chrono = mesuresEnregistrees({ root, lire: lireF });
  return {
    mesurable: true,
    filet: { lignes: String(src).split("\n").length, groupes: groupes.length, assertions: (src.match(/\bassert\.[a-zA-Z]+\(/g) ?? []).length },
    chaine: chaineDuFilet({ root, lire: lireF }),
    couches: comparerLesCouches(durees),
    morsure: groupesSansMorsure(groupes),
    sansRaison: groupesSansRaison(groupes),
    citations: citationsMortes(src, { root, existe }),
    encombrement: encombrement(groupes),
    // La part du contrat à trois (MOÏSE / Abraham / Ezechiel) : chacun garantit la fraîcheur du
    // document qu'il inspecte, et la frontière est une donnée vérifiable, jamais une promesse.
    perimetres: chevauchementsDePerimetre(),
    fraicheur: fraicheurDuFilet(src, { root, lire: lireF }),
    asyncs: assertionsNonAttendues(src),
    // Le croisement n'a lieu que si une mesure existe pour de vrai — sinon il dit « pas mesuré ».
    chrono,
    cout: chrono.presentes ? croiserCoutEtProtection(groupes, chrono.mesures) : { mesurable: false, pourquoi: chrono.pourquoi },
    // LA VOCATION ULTIME A ENFIN SON JUGE : l'effet du dernier changement sur le temps, et ce
    // qu'il a coûté en protection. Les deux se lisent sur l'HISTORIQUE, jamais sur un relevé seul.
    gain: (() => { const h = lireHistorique({ root, lire: lireF }); return h.length >= 2 ? comparerDeuxReleves(h[h.length - 2], h[h.length - 1]) : { mesurable: false, pourquoi: `un seul relevé chronométré (${h.length}) : avec un seul on connaît un état, jamais un effet` }; })(),
    protection: (() => { const r = lireRobustesse({ root, lire: lireF }); return r.length >= 2 ? comparerLaProtection(r[r.length - 2], r[r.length - 1]) : { mesurable: false, pourquoi: `${r.length} passe(s) de robustesse archivée(s) : il en faut deux pour dire ce qu'un allègement a coûté — lancer \`node scripts/ezechiel-les-tests.mjs robustesse\`` }; })(),
  };
}

export function formatEnqueteLines(e) {
  if (!e?.mesurable) return [`PAS MESURÉ — ${e?.pourquoi ?? "aucune donnée"}`];
  const L = [];
  const s = (ms) => `${(ms / 1000).toFixed(1)} s`;
  L.push(`Le filet : ${e.filet.lignes} lignes · ${e.filet.groupes} groupes · ${e.filet.assertions} assertions.`, "");

  // LE VOYANT D'ABORD. Une suite dont le fonctionnement est douteux rend tous les chiffres qui
  // suivent difficiles à interpréter : c'est la première chose à savoir, pas la dernière.
  L.push("=== LA SANTÉ DE LA SUITE (son FONCTIONNEMENT, pas son contenu) ===");
  if (!e.chrono.presentes || !e.chrono.sante) L.push(`  PAS MESURÉ — la santé ne se lit que dans une EXÉCUTION réelle : \`node scripts/ezechiel-les-tests.mjs sante\``);
  else {
    for (const l of formatSanteLines(e.chrono.sante)) L.push(`  ${l}`);
    L.push(`  (relevé du ${String(e.chrono.quand).slice(0, 16).replace("T", " ")})`);
  }
  L.push("");

  for (const l of formatGainLines(e.gain, e.protection)) L.push(l);
  L.push("");

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

  L.push("", "=== LA CORRESPONDANCE TEST ↔ CODE (la fraîcheur du filet) ===");
  if (!e.fraicheur.mesurable) L.push(`  PAS MESURÉ — ${e.fraicheur.pourquoi}`);
  else {
    L.push(`  ${e.fraicheur.appelsExamines} appel(s) du filet vers un module de l'Agence · ${e.fraicheur.perimes.length} vers une fonction qui n'existe plus.`);
    for (const f of e.fraicheur.perimes.slice(0, 10)) L.push(`   🚨 ligne ${f.ligne} — ${f.fonction}() n'est plus exportée par ${f.module}`);
    if (e.fraicheur.aliasAmbigus.length) L.push(`  (${e.fraicheur.aliasAmbigus.length} alias réutilisé(s) pour plusieurs modules : NON examinés plutôt qu'accusés à tort)`);
  }

  L.push("", "=== LES ASSERTIONS QUI PASSENT QUOI QU'IL ARRIVE ===");
  L.push(`  ${e.asyncs.length} assertion(s) portant sur une promesse jamais attendue.`);
  for (const a of e.asyncs.slice(0, 8)) L.push(`   🚨 ligne ${a.ligne} — ${a.extrait}`);

  L.push("", "=== LE CROISEMENT COÛT / PROTECTION ===");
  if (!e.cout.mesurable) L.push(`  PAS MESURÉ — ${e.cout.pourquoi}`);
  else {
    L.push(`  ${e.cout.groupes} groupes chronométrés, ${s(e.cout.totalMs)} au total. Les plus chers À PROTECTION ÉGALE :`);
    for (const l of e.cout.aRegarder.slice(0, 8)) {
      const r = Number.isFinite(l.msParAssertion) ? `${(l.msParAssertion).toFixed(0)} ms/assertion` : "AUCUNE assertion";
      L.push(`   ${s(l.ms).padStart(8)}  ${String(l.assertions).padStart(4)} assert.  ${r.padStart(18)}  ligne ${l.ligne} — ${l.titre.slice(0, 44)}`);
    }
    L.push(`  → ${e.cout.horsPortee}`);
  }

  L.push("", "=== LA FRONTIÈRE AVEC MOÏSE ET ABRAHAM ===");
  if (e.perimetres.collisions.length) for (const c of e.perimetres.collisions) L.push(`   🚨 ${c.outils.join(" et ")} revendiquent le même objet — ${c.pourquoi}`);
  else L.push("  Aucun chevauchement : MOÏSE tient la charte, Abraham tout document à règles numérotées, Ezechiel le filet et sa machinerie.");
  if (e.perimetres.sansFraicheur.length) L.push(`   ⚠️  ${e.perimetres.sansFraicheur.join(", ")} ne déclare(nt) pas ce dont il(s) garanti(ssen)t la fraîcheur`);

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
  // D'OÙ VIENT LE TEMPS : les trois cas s'excluent, donc ils s'enchaînent. Les constats qui suivent
  // sont INDÉPENDANTS de celui-ci — les avoir accrochés à sa branche les rendait muets tant que
  // l'enveloppe pesait moins de la moitié, exactement le genre de silence qu'Ezechiel traque.
  if (!e.couches.mesurable) {
    ecarts.push({ constat: "d'où vient le temps n'a pas été mesuré", etat: "retenu", niveau: "obligatoire", tache: "relancer avec les trois durées (filet nu, sous instrumentation, typage) — sans elles, toute optimisation serait faite à l'aveugle" });
  } else if (e.couches.partEnveloppePct >= 50) {
    ecarts.push({ constat: `l'enveloppe pèse ${e.couches.partEnveloppePct.toFixed(0)} % du temps bloquant, plus que les tests`, etat: "a-trancher", niveau: "obligatoire", tache: "porter la question à l'utilisateur AVANT de toucher un seul test : le gain est dans l'instrumentation et le typage, pas dans la suite" });
  }
  if (e.fraicheur.mesurable && e.fraicheur.perimes.length) {
    ecarts.push({ constat: `${e.fraicheur.perimes.length} test(s) appellent une fonction qui n'existe plus`, etat: "retenu", niveau: "obligatoire", tache: "corriger l'appel ou retirer le test — un test qui interroge une fonction disparue ne protège plus rien et peut passer sur `undefined` sans qu'on le voie" });
  }
  if (e.asyncs.length) {
    ecarts.push({ constat: `${e.asyncs.length} assertion(s) portent sur une promesse jamais attendue`, etat: "retenu", niveau: "obligatoire", tache: "ajouter l'attente manquante — ces assertions passent quoi qu'on casse dans le code, donc elles décorent un vert (BP2)" });
  }
  if (e.perimetres.collisions.length) {
    ecarts.push({ constat: `${e.perimetres.collisions.length} chevauchement(s) de périmètre entre MOÏSE, Abraham et Ezechiel`, etat: "retenu", niveau: "obligatoire", tache: "retirer l'objet en double : deux outils sur le même objet, c'est deux réponses possibles à la même question (leçon L29)" });
  }
  if (e.chrono.sante?.mesurable && !e.chrono.sante.vert) {
    const bloquant = !e.chrono.sante.sansBlocage;
    ecarts.push({ constat: `la suite elle-même n'est pas au vert : ${e.chrono.sante.anomalies.length} anomalie(s) de fonctionnement`, etat: "retenu", niveau: bloquant ? "obligatoire" : "recommandee", tache: bloquant ? "corriger avant toute autre chose : une suite qui ne tourne pas entièrement rend tous les autres chiffres de ce rapport ininterprétables" : "traiter le bruit et les avertissements — un vert qui laisse passer du bruit finit par cacher une vraie alerte le jour où elle arrive" });
  }
  if (e.protection.mesurable && !e.protection.accepte) {
    ecarts.push({ constat: `${e.protection.perdues.length} protection(s) perdue(s) depuis la passe de robustesse précédente`, etat: "retenu", niveau: "obligatoire", tache: "revenir sur le changement qui les a fait disparaître, ou redonner un test à ces lignes — des secondes gagnées contre une cassure qui passe désormais inaperçue n'est pas un gain (10e exigence, 2026-09-27)" });
  }
  if (!e.protection.mesurable) {
    ecarts.push({ constat: "ce qu'un allègement coûterait en protection n'a jamais été mesuré", etat: "retenu", niveau: "obligatoire", tache: "lancer `node scripts/ezechiel-les-tests.mjs robustesse` AVANT de toucher au filet, puis une seconde fois après : sans les deux passes, « la robustesse n'a pas bougé » serait un verdict rendu sur zéro donnée" });
  }
  if (!e.chrono.presentes) {
    ecarts.push({ constat: "aucun chronométrage groupe par groupe n'existe", etat: "retenu", niveau: "obligatoire", tache: "lancer `node scripts/ezechiel-les-tests.mjs mesurer` — sans lui, « des secondes gagnées à protection égale » ne peut pas se vérifier, donc tout allègement serait deviné" });
  } else if (e.cout.mesurable && e.cout.sansAucuneAssertion.length) {
    ecarts.push({ constat: `${e.cout.sansAucuneAssertion.length} groupe(s) coûtent du temps sans porter une seule assertion`, etat: "a-trancher", niveau: "recommandee", tache: "les regarder un par un : c'est le seul endroit où du temps se gagne SANS perdre de protection" });
  }
  return ecarts;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  recordCliUsage("ezechiel-les-tests");
  const sousCommande = (process.argv[2] || "").replace(/^--/, "");

  // ---- `mesurer` : le chronomètre par groupe (≈ 45 s, une exécution complète du filet) --------
  if (sousCommande === "mesurer" || sousCommande === "sante") {
    printReportHeader({ tool: "ezechiel-les-tests", title: "EZECHIEL — chronométrage du filet, groupe par groupe", scriptPath: "scripts/ezechiel-les-tests.mjs", origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
    const { spawn } = await import("node:child_process");
    const { writeFileSync, mkdirSync } = await import("node:fs");
    const { dirname } = await import("node:path");
    const depart = Date.now();
    const lignes = [];
    const enfant = spawn(process.execPath, [join(ROOT, FILET)], { cwd: ROOT });
    // LES DEUX FLUX SONT DISTINGUÉS, et ce n'est pas un détail de confort : du bruit sur la sortie
    // d'erreur d'une suite VERTE est une anomalie à part entière — c'est ainsi qu'un vrai message
    // finit par passer inaperçu le jour où il arrive.
    const restes = { normal: "", erreur: "" };
    const avaler = (flux) => (buf) => {
      restes[flux] += buf.toString();
      const parts = restes[flux].split("\n"); restes[flux] = parts.pop() ?? "";
      for (const texte of parts) lignes.push({ ms: Date.now() - depart, texte, flux });
    };
    enfant.stdout.on("data", avaler("normal")); enfant.stderr.on("data", avaler("erreur"));
    const code = await new Promise((r) => enfant.on("close", r));
    const groupes = decouperEnGroupes(readFileSync(join(ROOT, FILET), "utf8"));
    const recolle = recollerLeChrono(groupes, lignes);
    const totalMs = Date.now() - depart;
    console.log(`Filet terminé en ${(totalMs / 1000).toFixed(1)} s (code ${code}).`);
    console.log(`${recolle.lignesPassed} ligne(s) « Passed » à l'exécution · ${groupes.length} groupe(s) dans le texte · recollage ${recolle.complet ? "COMPLET" : "INCOMPLET"}.`);
    console.log("");
    console.log("=== LA SANTÉ DE LA SUITE — son FONCTIONNEMENT, pas son contenu ===");
    const sante = santeDuFilet({ code, ms: totalMs, lignes, groupes });
    for (const l of formatSanteLines(sante)) console.log(l);
    // LA SANTÉ S'ENREGISTRE TOUJOURS, LE CHRONOMÈTRE NON. Un filet rouge s'est arrêté avant la fin,
    // donc les groupes suivants valent zéro et se liraient comme gratuits (leçons L5/L11) — mais
    // c'est précisément le jour où il est rouge que son état de santé doit rester lisible.
    mkdirSync(dirname(join(ROOT, FICHIER_DE_MESURE)), { recursive: true });
    writeFileSync(join(ROOT, FICHIER_DE_MESURE), JSON.stringify({
      quand: new Date().toISOString(), source: "exécution réelle du filet, horodatage des lignes Passed",
      totalMs, complet: recolle.complet, sante, mesures: code === 0 ? recolle.mesures : [],
    }, null, 2));
    recordRegistryWrite(FICHIER_DE_MESURE, { par: "ezechiel-les-tests" });
    // L'HISTORIQUE EST CE QUI PERMET DE PARLER DE GAIN. Un relevé seul décrit un état ; c'est la
    // SUITE des relevés qui dit si un changement a servi à quelque chose. On garde les vingt
    // derniers : au-delà, un historique de chronométrage ne se relit plus, il s'accumule.
    const histo = lireHistorique();
    histo.push({ quand: new Date().toISOString(), totalMs, code, groupes: groupes.length, succes: recolle.lignesPassed, anomalies: sante.anomalies.length, vert: sante.vert });
    writeFileSync(join(ROOT, FICHIER_HISTORIQUE), JSON.stringify(histo.slice(-20), null, 2));
    recordRegistryWrite(FICHIER_HISTORIQUE, { par: "ezechiel-les-tests" });
    if (histo.length >= 2) {
      console.log("");
      const g = comparerDeuxReleves(histo[histo.length - 2], histo[histo.length - 1]);
      console.log("=== L'EFFET PAR RAPPORT AU RELEVÉ PRÉCÉDENT ===");
      console.log(g.mesurable ? `  ${g.verdict}` : `  PAS MESURÉ — ${g.pourquoi}`);
    }
    console.log("");
    console.log(code === 0
      ? `Mesure et santé enregistrées dans ${FICHIER_DE_MESURE} — l'enquête les relira sans relancer le filet.`
      : `🚨 Filet ROUGE : la SANTÉ est enregistrée (${FICHIER_DE_MESURE}), le chronométrage NON — une suite interrompue donnerait des groupes à zéro qui se liraient comme gratuits.`);
    process.exit(0);
  }

  // ---- `robustesse` : la passe qui casse le code exprès (passe SÉPARÉE, jamais dans l'enquête) -
  if (sousCommande === "robustesse") {
    printReportHeader({ tool: "ezechiel-les-tests", title: "EZECHIEL — passe de robustesse : le filet mord-il vraiment ?", scriptPath: "scripts/ezechiel-les-tests.mjs", origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
    printReliabilityNotice("ezechiel-les-tests");
    const { execSync, spawnSync } = await import("node:child_process");
    const { writeFileSync } = await import("node:fs");
    const combien = Number((process.argv.find((a) => a.startsWith("--combien=")) || "").split("=")[1]) || 4;
    // GARDE-FOU NON NÉGOCIABLE : cette passe écrit dans de vrais fichiers. Si le dépôt porte déjà
    // des modifications, une restauration ratée deviendrait indiscernable du travail en cours.
    const sale = execSync("git status --porcelain", { cwd: ROOT }).toString().trim();
    if (sale) {
      console.log("🚨 REFUS — le dépôt porte des modifications non commitées :");
      console.log(sale.split("\n").slice(0, 10).map((l) => `   ${l}`).join("\n"));
      console.log("\nCette passe modifie de vrais fichiers le temps d'un lancement et les restaure ensuite.");
      console.log("Sur un dépôt sale, une restauration ratée serait indiscernable du travail en cours.");
      process.exit(1);
    }
    const srcFilet = readFileSync(join(ROOT, FILET), "utf8");
    const cibles = ciblesDeMutation(srcFilet);
    console.log(`${cibles.length} module(s) importé(s) par le filet — les cibles se lisent, elles ne se recopient pas.`);
    const lancer = () => spawnSync(process.execPath, [join(ROOT, FILET)], { cwd: ROOT, stdio: "ignore", timeout: 600000 }).status === 0;
    const t0 = Date.now();
    console.log("Vérification préalable : le filet est-il vert AVANT toute cassure ?");
    const vertAvant = lancer();
    console.log(`  → ${vertAvant ? "VERT" : "ROUGE"} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    const resultats = [];
    if (vertAvant) {
      // On répartit les cassures sur des fichiers DIFFÉRENTS : quatre mutations dans le même
      // module ne mesureraient que ce module-là, et le score se lirait comme un score global.
      const candidates = [];
      for (const c of cibles) {
        const contenu = readFileSync(join(ROOT, c), "utf8");
        const m = mutationsPossibles(c, contenu, { maxParFichier: 1 })[0];
        if (m) candidates.push(m);
      }
      const pas = Math.max(1, Math.floor(candidates.length / combien));
      const choisies = candidates.filter((_, i) => i % pas === 0).slice(0, combien);
      for (const mut of choisies) {
        const chemin = join(ROOT, mut.chemin);
        const original = readFileSync(chemin, "utf8");
        const lignes = original.split("\n");
        lignes[mut.ligne - 1] = mut.apres;
        try {
          writeFileSync(chemin, lignes.join("\n"));
          const vert = lancer();
          resultats.push({ ...mut, attrapee: !vert });
          console.log(`  ${!vert ? "✅ attrapée" : "🚨 SURVIVANTE"}  ${mut.chemin}:${mut.ligne} (${mut.operateur})`);
        } finally {
          writeFileSync(chemin, original);
        }
      }
      // LA VÉRIFICATION DE RESTAURATION NE REGARDE QUE LES FICHIERS QU'ON A MUTÉS, et ce n'est pas
      // un relâchement : le premier vrai passage a duré neuf minutes, pendant lesquelles un autre
      // fichier du dépôt a été modifié à côté. La passe a crié « RESTAURATION INCOMPLÈTE » sur un
      // fichier qu'elle n'avait jamais touché — une alarme qui accuse à tort cesse d'être lue
      // (leçon L4). Ce qui la regarde est l'état des fichiers de SES cassures ; le reste est du
      // travail en cours, signalé à part et sans dramatiser.
      const salesMaintenant = new Set(execSync("git status --porcelain", { cwd: ROOT }).toString().trim().split("\n").filter(Boolean).map((l) => l.slice(3).trim()));
      const mutes = new Set(choisies.map((m) => m.chemin));
      const pasRestaures = [...mutes].filter((f) => salesMaintenant.has(f));
      const autres = [...salesMaintenant].filter((f) => !mutes.has(f));
      console.log(pasRestaures.length
        ? `\n🚨 RESTAURATION INCOMPLÈTE — ces fichiers ont été cassés par la passe et ne sont pas revenus à leur état d'origine :\n${pasRestaures.map((f) => `   ${f}`).join("\n")}`
        : "\nRestauration vérifiée : tous les fichiers cassés par la passe sont revenus exactement à leur état de départ.");
      if (autres.length) console.log(`   (${autres.length} autre(s) fichier(s) modifié(s) pendant la passe, qu'elle n'a jamais touchés : ${autres.slice(0, 4).join(", ")}${autres.length > 4 ? "…" : ""} — du travail en cours, pas un défaut de restauration)`);
    }
    console.log("");
    const v = verdictDeRobustesse(resultats, { filetVertAvant: vertAvant });
    for (const l of formatRobustesseLines(v)) console.log(l);
    // LA PASSE S'ARCHIVE, sinon elle ne peut jamais servir de point de comparaison — et c'est
    // précisément la comparaison AVANT/APRÈS qui répond à sa dixième exigence.
    if (v.mesurable) {
      const passes = lireRobustesse();
      passes.push({ quand: new Date().toISOString(), tauxPct: v.tauxPct, resultats: resultats.map((r) => ({ chemin: r.chemin, ligne: r.ligne, operateur: r.operateur, quoi: r.quoi, attrapee: r.attrapee })) });
      writeFileSync(join(ROOT, FICHIER_ROBUSTESSE), JSON.stringify(passes.slice(-10), null, 2));
      recordRegistryWrite(FICHIER_ROBUSTESSE, { par: "ezechiel-les-tests" });
      if (passes.length >= 2) {
        console.log("");
        console.log("=== CE QUE LES CHANGEMENTS DEPUIS LA PASSE PRÉCÉDENTE ONT COÛTÉ EN PROTECTION ===");
        const cmp = comparerLaProtection(passes[passes.length - 2], passes[passes.length - 1]);
        console.log(cmp.mesurable ? `  ${cmp.verdict}` : `  PAS MESURÉ — ${cmp.pourquoi}`);
        for (const x of cmp.perdues ?? []) console.log(`   🚨 ${x.chemin}:${x.ligne} (${x.operateur}) — ${x.pourquoi}`);
      }
    }
    imprimerPlanDaction(buildPlanDaction(v.mesurable && v.survivantes.length
      ? [{ constat: `${v.survivantes.length} cassure(s) volontaire(s) non attrapée(s) par le filet`, etat: "a-trancher", niveau: "recommandee", tache: "regarder chaque survivante : soit la ligne mérite un test, soit personne n'a jamais demandé au filet de la protéger — et alors c'est une zone où l'on peut alléger sans rien perdre" }]
      : [], { toolSlug: "ezechiel-les-tests" }));
    process.exit(0);
  }

  // ---- l'enquête ordinaire (instantanée, ne touche à rien) -------------------------------------
  printReportHeader({ tool: "ezechiel-les-tests", title: "EZECHIEL-LES-TESTS — le filet de sécurité, et tout ce qui l'entoure", scriptPath: "scripts/ezechiel-les-tests.mjs", origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
  printReliabilityNotice("ezechiel-les-tests");
  const durees = {
    nuMs: Number(process.env.EZ_NU_MS) || null,
    couvertureMs: Number(process.env.EZ_COUV_MS) || null,
    typageMs: Number(process.env.EZ_TSC_MS) || null,
  };
  const e = enqueter({ durees });
  for (const l of formatEnqueteLines(e)) console.log(l);
  const plan = planDeLEnquete(e);
  imprimerPlanDaction(buildPlanDaction(plan, { toolSlug: "ezechiel-les-tests" }));

  // LE DÉPÔT AU REGISTRE PARTAGÉ — c'est par lui qu'Abraham « veille » même quand personne ne
  // l'appelle (organisation tranchée par l'utilisateur le 2026-09-27). Ezechiel ne dépose que ce
  // qu'il a MESURÉ sur SON périmètre : il ne dit jamais un mot de la charte ni d'un autre document.
  try {
    const { deposerAlertes } = await import("./abraham-les-references.mjs");
    deposerAlertes("ezechiel-les-tests", plan.map((c) => ({
      cle: String(c.constat).slice(0, 80), objet: FILET,
      gravite: c.niveau === "obligatoire" ? "bloquante" : "à surveiller",
      constat: c.constat,
    })));
  } catch (err) {
    // UN DÉPÔT QUI ÉCHOUE NE FAIT PAS TOMBER L'ENQUÊTE, et il ne se tait pas non plus : un registre
    // silencieusement vide se lirait comme « aucune alerte » (leçons L5/L11).
    console.log(`\n⚠️  Alertes NON déposées au registre partagé : ${err?.message ?? err}. Abraham ne les verra pas.`);
  }
}
