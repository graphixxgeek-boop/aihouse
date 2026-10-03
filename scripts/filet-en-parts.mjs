// ICEBERG: membre
// FILET-EN-PARTS (2026-09-27, tâche #1041) — lancer le filet de sécurité en plusieurs parts
// simultanées au lieu d'une seule suite qui se déroule du début à la fin.
//
// POURQUOI IL EXISTE, ET POURQUOI SEULEMENT MAINTENANT. Le chantier d'allègement du filet a
// descendu 105,7 s à 65,4 s en trois marches (décor partagé #1036, dates de git #1038, décor
// étendu #1040), toutes à protection strictement égale. La troisième a mesuré le plafond de cette
// technique-là : le disque ne coûtait presque rien, le temps restant est du CALCUL. Contre du
// calcul, il n'y a qu'un levier — faire calculer plusieurs processeurs à la fois.
//
// IL NE MODIFIE JAMAIS LE FILET, et c'est la décision de conception la plus importante ici.
// L'utilisateur l'a posée en une phrase le jour même : « travaille soigneusement, pas trop vite,
// souviens-toi qu'on touche à un fichier sensible ». Ce runner LIT `check-house.mjs` et écrit des
// COPIES dérivées ; le fichier d'origine n'est pas touché d'une ligne. Le mode d'avant reste donc
// disponible à tout instant (`node scripts/check-house.mjs`), ce qui est la seule façon de savoir,
// le jour où une part échoue, si la faute est au code ou au parallélisme (son arbitrage : « oui,
// gardé et lançable »).
//
// CE QUI PEUT ÊTRE SÉPARÉ, ET CE QUI REFUSE — mesuré par Ezechiel AVANT d'écrire ce fichier
// (`obstaclesAuParallele`, son arbitrage « Ezechiel cherche d'abord ») :
//   · 156 blocs de niveau zéro (`{` … `}` en colonne 0) sont autonomes : chacun importe ce dont il
//     a besoin et n'écrit nulle part où un autre écrit. Zéro collision sur un chemin lisible.
//   · TOUT LE RESTE est une ÉPINE PARTAGÉE : le préambule (transpilation des 22 modules du jeu,
//     base SQLite en mémoire, import de la route) et ~70 tests écrits au niveau du fichier qui
//     font AVANCER cet état commun. On ne les sépare pas : on les rejoue dans chaque part.
//
// LE PRIX DE CETTE PRUDENCE EST CONNU ET CHIFFRÉ, jamais caché : l'épine vaut 18,6 s des 65,4 s,
// et chaque part la repaye. C'est ce qui fixe le plancher — 4 parts donnent ~30 s, pas ~16 s.
// Le dire vaut mieux que d'annoncer une division par quatre qui n'arrivera pas.
//
// LES NUMÉROS DE LIGNE SONT PRÉSERVÉS À L'IDENTIQUE : un bloc retiré d'une part est remplacé par
// autant de lignes vides. Sans ça, la première erreur d'un test aurait renvoyé vers une ligne qui
// n'existe pas dans le vrai fichier — un runner qui fait mentir les messages d'erreur coûte plus
// cher que les secondes qu'il fait gagner.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { cpus } from "node:os";
import { TOUCHES_L_ETAT_COMMUN, filetResolu, dansUneChaine } from "./ezechiel-les-tests.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReportHeader, planDactionDepuisEcarts, imprimerPlanDaction } from "./report-template.mjs";

// MÊME DÉFAUT QUE CELUI D'EZECHIEL, CORRIGÉ POUR LA CLASSE ET PAS POUR L'OCCURRENCE (leçon L37) :
// un chemin de CE dépôt écrit en constante rendrait ce runner inutilisable ailleurs. La détection
// n'est pas réécrite ici, elle est IMPORTÉE d'Ezechiel (Article 24 : un registre se lit, il ne se
// recopie pas) — le jour où Ezechiel apprend une piste de plus, ce runner en hérite sans qu'on y
// touche. Ce qui reste ci-dessous est le dernier recours, jamais la vérité.
export const FILET = "scripts/check-house.mjs";
export const MESURES = "docs/ezechiel-les-tests/mesures.json";
export const PARTS_PAR_DEFAUT = 4;
const ROOT = new URL("..", import.meta.url).pathname;

// --- Le découpage : ce qui est déplaçable, et ce qui ne l'est pas ------------------------------
// Un bloc de niveau zéro s'ouvre par une accolade SEULE en colonne 0 et se ferme pareil. C'est une
// convention que ce fichier respecte sur ses 156 blocs, et elle est vérifiable mécaniquement — pas
// une supposition : tout ce qui n'entre pas dans cette forme reste dans l'épine, donc rejoué
// partout, donc jamais perdu. Se tromper ici coûte du temps, jamais un test.
// LE DÉFAUT DU PREMIER LANCEMENT RÉEL, ET C'EST LA LEÇON L39 VÉRIFIÉE SUR SON AUTEUR : « un
// détecteur qui compte une profondeur est faux jusqu'à preuve du contraire ». La première version
// prenait la PREMIÈRE accolade fermante comme fin du bloc. Or ce fichier contient un bloc imbriqué
// ouvert lui aussi en colonne 0 (ligne 958) : le bloc était donc coupé trop tôt, et la vraie
// fermeture restait orpheline — `SyntaxError: Unexpected token '}'` au premier essai. On compte la
// profondeur, et un bloc ne se ferme que quand elle revient à zéro.
export function blocsDeNiveauZero(src = "") {
  const lignes = String(src).split("\n");
  const blocs = [];
  let debut = null, profondeur = 0;
  for (let i = 0; i < lignes.length; i++) {
    if (lignes[i] === "{") { if (debut === null) { debut = i + 1; profondeur = 1; } else profondeur++; }
    else if (lignes[i] === "}" && debut !== null) { profondeur--; if (profondeur === 0) { blocs.push({ debut, fin: i + 1 }); debut = null; } }
  }
  // UNE OUVERTURE JAMAIS REFERMÉE N'EST PAS UN BLOC : la rendre quand même produirait une part
  // tronquée au milieu d'une expression, c'est-à-dire un échec qui ressemblerait à un vrai.
  return blocs;
}

// LE SOCLE : ce qu'aucune part ne peut se permettre de ne pas jouer -----------------------------
// LE PREMIER LANCEMENT RÉEL A RETOURNÉ MON HYPOTHÈSE, et c'est la trouvaille la plus utile de ce
// chantier. Je croyais que les blocs dépendaient de l'épine ; c'est AUSSI L'INVERSE. Un bloc qui
// réassigne `world` (ou fait avancer la base) laisse un état dont un test du niveau du fichier
// dépend plus bas. Le blanchir faisait échouer une assertion parfaitement saine — un faux rouge,
// qui est exactement le genre de panne qui discrédite un outil neuf.
// LA RÈGLE QUI EN DÉCOULE : un bloc qui touche l'état commun n'est pas déplaçable, il est DU SOCLE,
// et le socle se rejoue dans chaque part. Mesuré : ces 41 blocs ne coûtent que 0,9 s, donc la
// prudence est quasiment gratuite — et l'inverse aurait coûté un faux rouge par lancement.
// LE MOTIF NE SE RECOPIE PAS, il s'importe d'Ezechiel (Article 24) : le jour où il apprend un nom
// de plus, ce runner en hérite sans qu'on y touche.
// LE DÉTECTEUR DE SOCLE — DEUX ÉLARGISSEMENTS ESSAYÉS, DEUX ÉCHECS, ET LE MÊME MUR (2026-10-03).
//
// CE QU'IL VOIT : l'état du JEU — `post`, `sqlite`, `db`, `world`. CE QU'IL NE VOIT PAS : deux
// blocs qui se passent une variable ordinaire. C'est ce qui a fait tomber trois parts sur quatre,
// sur un `perceptionEpoch` déclaré dans un bloc et lu dans un autre.
//
// L'ARBITRAGE EST ASYMÉTRIQUE, et c'est ce qui rendait l'élargissement tentant : un FAUX POSITIF
// met un bloc au socle, donc le runner est un peu plus lent ; un FAUX NÉGATIF le fait TOMBER.
// Se tromper du bon côté valait la peine d'être essayé.
//
// ESSAI : un bloc est du socle s'il emploie un nom né ailleurs après le préambule. MESURÉ : 129
// blocs sur 167 passent au socle, le travail divisible tombe de 126 s à 7 s, et le plancher monte
// à 240 s — autrement dit le parallélisme ne rend plus rien. ET LA CAUSE EST DU BRUIT PUR : les
// noms qui envoient le plus de blocs au socle sont `path` (21 blocs), `texte` (18), `chemin` (17),
// `ligne`, `nom`, `cle` — des variables LOCALES ordinaires, déclarées dans chaque bloc sous une
// forme que le lecteur de déclarations ne voit pas : paramètre de fonction fléchée, déstructuration
// dans un `for…of`, argument de rappel.
//
// LE MUR EST LE MÊME QUE CELUI DU DÉTECTEUR DE COUPLAGES, UNE HEURE PLUS TÔT, ET LE DIRE ÉVITE UN
// TROISIÈME ESSAI : distinguer un nom de portée fichier d'une locale homonyme demande une ANALYSE
// DE PORTÉES. Tant qu'on n'en a pas, tout élargissement par motif est soit trop étroit (le runner
// tombe), soit trop large (le gain disparaît). Il n'y a pas de réglage entre les deux.
//
// LA VOIE SAINE EST AILLEURS, ET ELLE EST ÉCRITE ICI POUR QUE LE PROCHAIN NE RECOMMENCE PAS : on
// n'essaie plus de DEVINER le couplage, on l'APPREND des échecs réels. Une part qui tombe sur
// `ReferenceError: X is not defined` nomme exactement le coupable ; le bloc qui déclare X rejoint
// le socle, et le couplage est consigné. C'est fondé sur une exécution réelle plutôt que sur un
// motif, ça se corrige tout seul au premier nouveau cas, et ça ne coûte que les blocs réellement
// coupables. `COUPLAGES_CONSTATES` en est la graine.

// LES COUPLAGES CONSTATÉS — appris d'un échec réel, jamais devinés (Article 24, second cas :
// liste manuelle assumée, et son garde-fou est l'échec lui-même, qui est bruyant).
export const COUPLAGES_CONSTATES = [
  {
    nom: "perceptionEpoch",
    constateLe: "2026-10-03",
    quoi: "déclaré en milieu de ligne dans un bloc, lu dans un autre. A fait tomber 3 parts sur 4 lors de l'essai d'épine isolée, sur un `ReferenceError` immédiat",
  },
];

export function findCouplagesMalDeclares({ couplages = COUPLAGES_CONSTATES } = {}) {
  return couplages
    .filter((c) => !c.nom || !/^\d{4}-\d{2}-\d{2}$/.test(String(c.constateLe ?? "")) || !c.quoi || c.quoi.length < 40)
    .map((c) => `le couplage « ${c.nom ?? "(sans nom)"} » n'est pas déclaré complètement : il faut le NOM, la DATE du constat et CE QU'ON A VU — un couplage sans son échec d'origine est une supposition, et on vient d'en refuser deux`);
}

// `ReferenceError: X is not defined` — la seule phrase qui nomme un couplage avec certitude.
export const MOTIF_REFERENCE_ERROR = /ReferenceError:\s*([A-Za-z_$][\w$]*)\s+is not defined/g;

export function couplagesAppris(sortieDUnePart = "") {
  return [...new Set([...String(sortieDUnePart).matchAll(MOTIF_REFERENCE_ERROR)].map((m) => m[1]))];
}

export function blocEstDuSocle(src = "", bloc = {}, { couplages = COUPLAGES_CONSTATES } = {}) {
  const lignes = String(src).split("\n");
  const texte = lignes.slice(bloc.debut - 1, bloc.fin).join("\n");
  if (TOUCHES_L_ETAT_COMMUN.test(texte)) return true;
  // Un bloc qui DÉCLARE un nom constaté couplant doit rester partout : c'est lui la source.
  for (const c of couplages) {
    for (let n = bloc.debut; n <= bloc.fin; n += 1) {
      if (nomsDeclares(lignes[n - 1]).includes(c.nom)) return true;
    }
  }
  return false;
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// LA SECONDE ESPÈCE D'UNITÉ DÉPLAÇABLE : L'APPEL (2026-10-03, tâche #1578)
//
// CE QUE LA MESURE A RENVERSÉ, ET C'EST LE PLAFOND LUI-MÊME. On croyait l'épine incompressible :
// 120,4 s de code « écrit au niveau du fichier », rejoué dans les quatre parts, soit 49 % du
// filet. En la DÉCOUPANT plutôt qu'en la contemplant, 115,1 de ces 120,4 s se trouvent à
// l'intérieur de 147 corps de `async function testX() { … }`, chacune appelée EXACTEMENT UNE FOIS
// par un `await testX();` seul sur sa ligne. Cinq secondes seulement sont du vrai code à plat.
//
// AUTREMENT DIT L'ÉPINE N'ÉTAIT PAS UN PLAFOND, C'ÉTAIT UN DÉFAUT DE DÉCOUPAGE : le runner ne
// connaissait qu'une seule forme d'unité, le bloc `{` … `}` en colonne zéro, et tout ce qui ne
// ressemblait pas à ça tombait dans « épine » par défaut. Une fonction est pourtant l'unité la
// PLUS sûre qui soit — son corps est étanche par construction du langage, rien de ce qu'elle
// déclare ne fuit, là où un bloc de niveau zéro, lui, partage le fichier.
//
// CE QUI BOUGE, ET C'EST LA SEULE CHOSE QUI BOUGE : l'APPEL. La DÉCLARATION reste dans toutes les
// parts — définir une fonction ne coûte rien et garantit qu'aucune référence ne se casse. Seule la
// ligne `await testX();` est retirée des parts qui ne la portent pas.
//
// LES QUATRE CONDITIONS, ET AUCUNE NE SE NÉGOCIE (c'est le filet : un faux positif ici rend un
// vert sur du code que personne n'exécute, exactement la faute que ce runner ne doit jamais
// commettre) :
//   1. la fonction est déclarée au NIVEAU ZÉRO du fichier, hors de tout bloc ;
//   2. son nom n'apparaît que DEUX fois dans tout le fichier — sa déclaration et son appel. Trois
//      occurrences, et on ne sait plus qui l'appelle : on refuse ;
//   3. l'appel est seul sur sa ligne, en colonne zéro, sans affectation de résultat ;
//   4. son corps ne touche pas l'état commun, et n'AFFECTE aucun nom de niveau fichier.
//
// LA QUATRIÈME CONDITION EST CELLE QUI PROTÈGE RÉELLEMENT, et elle se trompe du bon côté : une
// locale homonyme fait rester l'appel au socle, c'est-à-dire qu'il tourne partout comme avant.
// On perd un peu de gain, jamais une vérification. C'est l'exact inverse du compromis refusé à
// l'essai précédent, où se tromper du bon côté tuait le gain : ici le socle ne retient que les
// fonctions qui ÉCRIVENT, et elles sont rares.

// Une fonction déclarée en colonne zéro, avec la ligne de sa première accolade et celle de sa
// fermeture, trouvées par PROFONDEUR (leçon L39 : un détecteur qui compte une profondeur est faux
// jusqu'à preuve du contraire — celui-ci est contre-testé sur une imbrication fabriquée exprès).
export const MOTIF_FONCTION_A_PLAT = /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/;

export function fonctionsDeNiveauZero(src = "") {
  const lignes = String(src).split("\n");
  const fns = [];
  for (let i = 0; i < lignes.length; i += 1) {
    const m = MOTIF_FONCTION_A_PLAT.exec(lignes[i]);
    if (!m) continue;
    let profondeur = 0, demarre = false, fin = null;
    for (let j = i; j < lignes.length; j += 1) {
      for (const ch of lignes[j]) {
        if (ch === "{") { profondeur += 1; demarre = true; } else if (ch === "}") profondeur -= 1;
      }
      if (demarre && profondeur <= 0) { fin = j + 1; break; }
    }
    if (!fin) continue;
    fns.push({ nom: m[1], debut: i + 1, fin });
    i = fin - 1;
  }
  return fns;
}

// L'APPEL SEUL SUR SA LIGNE, EN COLONNE ZÉRO. `await testX();` ou `testX();` — jamais
// `const r = testX();`, jamais un appel indenté (donc imbriqué dans autre chose).
export function lignesDAppelAPlat(src = "", nom = "") {
  const motif = new RegExp(`^(?:await\\s+)?${nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\(\\s*\\)\\s*;?\\s*$`);
  const trouvees = [];
  String(src).split("\n").forEach((l, i) => { if (motif.test(l)) trouvees.push(i + 1); });
  return trouvees;
}

// Combien de fois un nom apparaît dans tout le fichier, en tant que MOT. Deux, et deux seulement :
// la déclaration et l'appel. Au-delà, quelqu'un d'autre s'en sert et on ne déplace rien.
export function occurrencesDuNom(src = "", nom = "") {
  const motif = new RegExp(`\\b${nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
  return (String(src).match(motif) ?? []).length;
}

// LES NOMS DE NIVEAU FICHIER : déclarés sur une ligne qui n'est ni dans un bloc, ni dans un corps
// de fonction. Cette liste-là est PRÉCISE, là où toute tentative de deviner les portées à
// l'intérieur d'un bloc a échoué deux fois aujourd'hui — parce qu'ici on ne cherche pas à savoir
// d'où vient un nom employé, seulement où il est DÉCLARÉ, et une déclaration se lit.
// LE PIÈGE QUI A FAILLI COÛTER QUARANTE SECONDES DE GAIN, ET IL EST EXACTEMENT LE MÊME QUE CELUI
// DES DEUX DÉTECTEURS REFUSÉS PLUS HAUT — sauf qu'ici, pour une fois, il a une solution EXACTE.
//
// Le premier jet acceptait toute déclaration lue sur une ligne hors bloc et hors fonction. Il a
// renvoyé 59 fonctions au socle, 40,7 s de gain perdu, pour cause d'écriture dans « r », « c »,
// « p », « h », « n ». Or ces noms ne sont PAS de niveau fichier : ce sont des locales écrites à
// l'intérieur d'une fonction fléchée posée sur une ligne à plat — `globalThis.fetch = async
// (...args) => { const r = await simulatedFetch(...args); … }`. Le lecteur voyait un `const r`
// sur une ligne de niveau fichier et en concluait une variable de niveau fichier.
//
// LA DIFFÉRENCE AVEC LES DEUX ÉCHECS PRÉCÉDENTS EST CE QUI REND CELUI-CI SOLUBLE : là-bas il
// fallait savoir d'où venait un nom EMPLOYÉ, ce qui demande les portées ; ici il suffit de savoir
// si une DÉCLARATION est imbriquée, et ça se lit sur la profondeur d'accolades — une grandeur
// qu'on compte, pas qu'on devine. La profondeur est suivie sur tout le fichier, chaînes et
// commentaires écartés, et seule une déclaration à la profondeur ZÉRO est de niveau fichier.
export function profondeurDesLignes(src = "") {
  const lignes = String(src).split("\n");
  const profondeurs = [];
  let profondeur = 0, dansUnCommentaire = false;
  for (const ligne of lignes) {
    profondeurs.push(profondeur);
    let quote = null;
    for (let i = 0; i < ligne.length; i += 1) {
      const c = ligne[i];
      if (dansUnCommentaire) { if (c === "*" && ligne[i + 1] === "/") { dansUnCommentaire = false; i += 1; } continue; }
      if (quote) { if (c === "\\") i += 1; else if (c === quote) quote = null; continue; }
      if (c === "/" && ligne[i + 1] === "/") break;
      if (c === "/" && ligne[i + 1] === "*") { dansUnCommentaire = true; i += 1; continue; }
      if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
      if (c === "{") profondeur += 1; else if (c === "}") profondeur -= 1;
    }
  }
  return profondeurs;
}

// Les déclarations de la ligne qui se tiennent à la profondeur DONNÉE, les imbriquées écartées.
export function nomsDeclaresAuNiveau(ligne = "", profondeurInitiale = 0) {
  const out = [];
  let profondeur = profondeurInitiale, quote = null, dansUnCommentaire = false;
  const positionsAuNiveau = new Set();
  for (let i = 0; i < ligne.length; i += 1) {
    const c = ligne[i];
    if (dansUnCommentaire) { if (c === "*" && ligne[i + 1] === "/") { dansUnCommentaire = false; i += 1; } continue; }
    if (quote) { if (c === "\\") i += 1; else if (c === quote) quote = null; continue; }
    if (c === "/" && ligne[i + 1] === "/") break;
    if (c === "/" && ligne[i + 1] === "*") { dansUnCommentaire = true; i += 1; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") { profondeur += 1; continue; }
    if (c === "}") { profondeur -= 1; continue; }
    if (profondeur === 0) positionsAuNiveau.add(i);
  }
  for (const m of String(ligne).matchAll(MOTIF_DECLARATION_A_PLAT)) {
    // La position du mot-clé `const`/`let`/`var`, jamais celle du début de la correspondance, qui
    // peut inclure le `;` ou le `{` qui précède.
    const motCle = m[0].search(/(?:const|let|var)\s/);
    if (!positionsAuNiveau.has(m.index + Math.max(0, motCle))) continue;
    const brut = m[1] ?? m[2] ?? m[3] ?? "";
    for (const x of brut.split(",")) {
      const nom = x.split(":").pop().split("=")[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(nom) && !out.includes(nom)) out.push(nom);
    }
  }
  return out;
}

export function nomsDeNiveauFichier(src = "", { blocs = null, fonctions = null } = {}) {
  const lignes = String(src).split("\n");
  const bs = blocs ?? blocsDeNiveauZero(src);
  const fs_ = fonctions ?? fonctionsDeNiveauZero(src);
  const profondeurs = profondeurDesLignes(src);
  const noms = new Set();
  for (let n = 1; n <= lignes.length; n += 1) {
    if (bs.some((b) => n >= b.debut && n <= b.fin)) continue;
    if (fs_.some((f) => n >= f.debut && n <= f.fin)) continue;
    for (const nom of nomsDeclaresAuNiveau(lignes[n - 1], profondeurs[n - 1] ?? 0)) noms.add(nom);
  }
  return noms;
}

// ÉCRIRE, c'est affecter, incrémenter, ou appeler une méthode qui mute. Le motif évite `==`,
// `===` et `=>`, qui ne sont pas des affectations — trois faux positifs qu'un `=` nu aurait tous
// attrapés.
export function affecteCeNom(texte = "", nom = "") {
  const n = nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `\\b${n}\\s*(?:=[^=>]|\\+\\+|--|\\+=|-=|\\.\\w+\\s*=[^=>]|\\[[^\\]]*\\]\\s*=[^=>]|\\.(?:push|pop|shift|unshift|splice|set|add|delete|clear|sort|reverse|fill)\\s*\\()`,
  ).test(String(texte));
}

// L'appel d'une fonction reste au socle — c'est-à-dire rejoué dans chaque part, comme avant — dès
// qu'elle TOUCHE l'état commun ou qu'elle ÉCRIT dans un nom de niveau fichier. Se tromper ici ne
// coûte que de la lenteur ; ne pas se tromper assez coûterait une vérification.
export function appelEstDuSocle(src = "", fn = {}, { nomsFichier = null } = {}) {
  const lignes = String(src).split("\n");
  const corps = lignes.slice(fn.debut - 1, fn.fin).join("\n");
  if (TOUCHES_L_ETAT_COMMUN.test(corps)) return { socle: true, pourquoi: "touche l'état commun du jeu" };
  const noms = nomsFichier ?? nomsDeNiveauFichier(src);
  for (const nom of noms) {
    if (nom === fn.nom) continue;
    if (affecteCeNom(corps, nom)) return { socle: true, pourquoi: `écrit dans « ${nom} », un nom de niveau fichier` };
  }
  return { socle: false, pourquoi: null };
}

// LES UNITÉS D'APPEL DÉPLAÇABLES, avec leur poids réel lu dans les mesures d'Ezechiel. Chacune
// porte la ligne à retirer des autres parts et les raisons d'un refus, parce qu'un refus muet se
// lit comme une absence de candidat (leçons L5/L11).
export function unitesAppel(src = "", { mesures = [] } = {}) {
  const blocs = blocsDeNiveauZero(src);
  const fonctions = fonctionsDeNiveauZero(src).filter((f) => !blocs.some((b) => f.debut >= b.debut && f.debut <= b.fin));
  const nomsFichier = nomsDeNiveauFichier(src, { blocs, fonctions });
  const retenues = [], refusees = [];
  for (const f of fonctions) {
    const appels = lignesDAppelAPlat(src, f.nom).filter((l) => !blocs.some((b) => l >= b.debut && l <= b.fin));
    const ms = mesures.filter((m) => m.ligne >= f.debut && m.ligne <= f.fin).reduce((s, m) => s + (m.ms ?? 0), 0);
    if (appels.length !== 1) { refusees.push({ ...f, ms, pourquoi: `${appels.length} appel(s) à plat, il en faut exactement un` }); continue; }
    const occ = occurrencesDuNom(src, f.nom);
    if (occ !== 2) { refusees.push({ ...f, ms, pourquoi: `le nom apparaît ${occ} fois, pas 2 : quelqu'un d'autre s'en sert` }); continue; }
    const verdict = appelEstDuSocle(src, f, { nomsFichier });
    if (verdict.socle) { refusees.push({ ...f, ms, pourquoi: verdict.pourquoi }); continue; }
    retenues.push({ kind: "appel", nom: f.nom, debut: appels[0], fin: appels[0], corpsDebut: f.debut, corpsFin: f.fin, ms });
  }
  return { retenues, refusees };
}

export function separerSocleEtDeplacables(src = "", blocs = []) {
  const socle = [], deplacables = [];
  for (const b of blocs) (blocEstDuSocle(src, b) ? socle : deplacables).push(b);
  return { socle, deplacables };
}

export function poidsDesBlocs(blocs = [], mesures = []) {
  return blocs.map((b) => ({
    ...b,
    ms: mesures.filter((m) => m.ligne >= b.debut && m.ligne <= b.fin).reduce((s, m) => s + (m.ms ?? 0), 0),
  }));
}

// LES PLUS LOURDS D'ABORD, et ce n'est pas une préférence : c'est le résultat classique du
// remplissage de sacs (« longest processing time first »). Placer un bloc de 6 s en dernier oblige
// une part à l'attendre seule ; le placer en premier laisse aux petits le soin d'égaliser. La
// littérature du domaine le donne comme le gain le plus simple à prendre sur une suite parallèle.
// LE REPLI À L'AVEUGLE, TROUVÉ PAR LE PROJET TÉMOIN (2026-09-27). Sur un dépôt sans relevé de
// durées, TOUS les blocs pèsent zéro : le remplissage de sacs prend alors systématiquement la
// première part (elle est toujours « la moins chargée », à égalité), et le témoin l'a montré en
// clair — 120 blocs dans la part 1, ZÉRO dans les trois autres. La parallélisation ne parallélisait
// plus rien, en silence, et personne ne l'aurait vu ici où les mesures existent toujours.
// SANS POIDS, ON RÉPARTIT AU NOMBRE, et le rapport le dit déjà en toutes lettres.
export function repartir(blocs = [], combien = PARTS_PAR_DEFAUT) {
  const parts = Array.from({ length: Math.max(1, combien) }, () => ({ blocs: [], ms: 0 }));
  const aveugle = blocs.every((b) => !(b.ms > 0));
  if (aveugle) {
    [...blocs].sort((x, y) => x.debut - y.debut).forEach((b, i) => parts[i % parts.length].blocs.push(b));
    for (const p of parts) p.blocs.sort((x, y) => x.debut - y.debut);
    return parts;
  }
  for (const b of [...blocs].sort((x, y) => (y.ms ?? 0) - (x.ms ?? 0))) {
    const p = parts.reduce((a, c) => (c.ms < a.ms ? c : a));
    p.blocs.push(b); p.ms += b.ms ?? 0;
  }
  for (const p of parts) p.blocs.sort((x, y) => x.debut - y.debut);
  return parts;
}

// --- La génération d'une part : même fichier, blocs des autres remplacés par du vide -----------
// LA SUBSTITUTION DU DOSSIER DE TRAVAIL NE PORTE QUE SUR LE PRÉAMBULE, et c'est délibéré : le
// préambule écrit puis relit les 22 modules du jeu transpilés dans `.sites-runtime/`. Quatre
// processus qui écrivent les mêmes fichiers en même temps, c'est exactement la panne qu'on cherche
// à éviter — chacun a donc son propre sous-dossier. Plus bas dans le fichier, les blocs ont leurs
// propres dossiers temporaires ; comme un bloc donné ne tourne que dans UNE part, ils ne peuvent
// pas se rencontrer, et les toucher aurait cassé des assertions qui citent ces chemins.
// `epineDansCettePart` — L'EXPÉRIENCE QUI DÉCIDE DU PLAFOND (2026-10-03).
//
// CE QUE LE RUNNER FAISAIT, ET PERSONNE NE L'AVAIT REGARDÉ : il ne vide que l'INTÉRIEUR des blocs
// non retenus. Tout ce qui est hors bloc est donc gardé dans CHAQUE part — or 176 groupes de tests
// du jeu sont écrits à plat ENTRE les blocs, dispersés dans 27 000 lignes. Ils pèsent 120 s, la
// moitié du filet, et ils sont rejoués quatre fois : 480 s de processeur pour 120 s de travail.
//
// L'HYPOTHÈSE QUI SE TESTE : les 127 blocs déplaçables sont, par définition, ceux qui ne touchent
// PAS l'état commun. Ils n'ont donc pas besoin de ce que l'épine installe. Si c'est vrai, l'épine
// peut ne tourner que dans UNE part.
//
// COMMENT ON SAURA QUE C'EST FAUX, et c'est ce qui rend l'expérience acceptable : le mode d'échec
// est BRUYANT. Une variable définie entre deux blocs et utilisée par un bloc déplaçable rend un
// `ReferenceError` immédiat, jamais un vert silencieux. Et le garde-fou qui compte vraiment est le
// NOMBRE DE SUCCÈS DISTINCTS : s'il tombe sous celui du séquentiel, une vérification a disparu, et
// c'est exactement la faute que ce gain ne doit jamais coûter.
// `appelsRetires` — LES LIGNES D'APPEL QUI NE SONT PAS DE CETTE PART (2026-10-03, tâche #1578).
// Seule la LIGNE D'APPEL disparaît ; la DÉCLARATION de la fonction reste dans toutes les parts.
// C'est ce qui rend ce déplacement plus sûr que celui d'un bloc : définir une fonction ne coûte
// rien, ne touche à rien, et garantit qu'aucune référence ne se casse — là où vider un bloc
// supprime pour de bon ce qu'il déclarait.
export function genererLaPart(src = "", blocsGardes = [], { numero = 1, finDuPreambule = 0, epineDansCettePart = true, appelsRetires = [] } = {}) {
  const lignes = String(src).split("\n");
  const tousLesBlocs = blocsDeNiveauZero(src);
  const garde = new Set();
  for (const b of [...blocsGardes, ...separerSocleEtDeplacables(src, tousLesBlocs).socle]) for (let n = b.debut; n <= b.fin; n++) garde.add(n);
  const retires = new Set(appelsRetires);
  const sortie = lignes.map((l, i) => {
    const n = i + 1;
    const dansUnBloc = tousLesBlocs.some((b) => n >= b.debut && n <= b.fin);
    if (dansUnBloc) return garde.has(n) ? l : "";
    // LE PRÉAMBULE RESTE PARTOUT, TOUJOURS : il porte les imports, l'ouverture de la base et les
    // fonctions d'aide. Le vider casserait tout, bruyamment, et pour rien.
    if (n <= finDuPreambule) return l;
    if (retires.has(n)) return "";
    return epineDansCettePart ? l : "";
  });
  // LE DÉFAUT LE PLUS GRAVE DE CE RUNNER, ET IL ÉTAIT SILENCIEUX (2026-09-27, quatrième lancement
  // réel). La substitution ne portait d'abord que sur le préambule, parce que c'est lui qui écrit
  // les modules du jeu transpilés. Mais des BLOCS les réimportent plus bas — et eux pointaient
  // toujours vers le dossier commun. Résultat : une part testait la version transpilée d'un
  // lancement PRÉCÉDENT. Tant que le code du jeu ne bougeait pas, ça passait inaperçu ; à la
  // première modification de `lib/gemini-keys.ts`, la part a crié « fonction inconnue » sur une
  // fonction qui existait bel et bien. UN TEST QUI PASSE SUR UNE COPIE PÉRIMÉE EST PIRE QU'UN TEST
  // QUI ÉCHOUE : il rend un vert sur du code que personne n'exécute.
  // LA SUBSTITUTION VISE DONC `.sites-runtime/test-`, PARTOUT DANS LE FICHIER, et rien d'autre :
  // c'est exactement le préfixe des modules transpilés, et laisser les autres chemins tranquilles
  // évite de casser les assertions qui citent un dossier de couverture par son nom littéral.
  // LA SECONDE SUBSTITUTION, ET SON ABSENCE AVAIT TUÉ LE RUNNER EN SILENCE (2026-10-03).
  //
  // LE FILET IMPORTE SES VOISINS DE DEUX FAÇONS MÉLANGÉES : `../scripts/x.mjs`, qui survit au
  // déplacement de la copie dans `.sites-runtime/`, et `./x.mjs`, qui ne survit pas — depuis
  // `.sites-runtime/`, `./the-king.mjs` désigne `.sites-runtime/the-king.mjs`, qui n'existe pas.
  // Il y en a VINGT-HUIT en statique plus plusieurs en dynamique, toutes ajoutées APRÈS l'écriture
  // de ce runner.
  //
  // POURQUOI PERSONNE NE L'A VU : le runner n'a plus jamais tourné après le jour de sa naissance
  // (22 passages le jour un, zéro ensuite). **Un outil qu'on n'utilise pas ne signale jamais qu'il
  // est cassé** — c'est la leçon L2 prise par son autre bout, et elle a coûté quatre jours pendant
  // lesquels le seul levier connu contre le temps du filet était mort sans que personne le sache.
  //
  // LA RÉÉCRITURE EST VOLONTAIREMENT ÉTROITE : seuls les imports d'un FRÈRE DIRECT en `.mjs` sont
  // réécrits vers `../scripts/`. Un `./` suivi d'un sous-dossier, ou d'une autre extension, est
  // laissé tel quel — élargir le motif risquerait de toucher une chaîne de caractères citée dans
  // une assertion, et ce runner a déjà payé une fois pour avoir réécrit trop large.
  const sortieTexte = reecrireLesImportsFreres(
    sortie.join("\n").replaceAll(".sites-runtime/test-", `.sites-runtime/p${numero}/test-`),
  );
  const lignesFinales = sortieTexte.split("\n");
  for (let i = 0; i < Math.min(finDuPreambule, lignesFinales.length); i++) {
    lignesFinales[i] = lignesFinales[i].replaceAll("'.sites-runtime'", `'.sites-runtime/p${numero}'`);
  }
  return lignesFinales.join("\n");
}

// `from "./x.mjs"` ou `import("./x.mjs")` — un frère DIRECT, jamais un sous-dossier. Le groupe
// capturant garde le guillemet d'ouverture pour que la réécriture ne change rien d'autre.
export const MOTIF_IMPORT_FRERE = /(from\s*["']|import\(\s*["'])\.\/([a-z0-9][a-z0-9._-]*\.mjs)/gi;

// LE GARDE-FOU QUI EMPÊCHE CE DÉFAUT DE REVENIR (Article 24) : aucune copie générée ne doit
// contenir un import relatif qui ne se résout pas depuis `.sites-runtime/`. Sans lui, le prochain
// style d'import ajouté au filet re-casserait le runner, et on ne le saurait qu'en le relançant —
// c'est-à-dire potentiellement jamais.
export const MOTIF_RELATIF_RESTANT = /(?:from\s*["']|import\(\s*["'])(\.\/[^"']+)["']/g;

// LA RÉÉCRITURE NE TOUCHE QUE LES VRAIS IMPORTS, et la première version a prouvé pourquoi il
// fallait cette précaution — en une seule exécution. Elle réécrivait par expression régulière sur
// tout le texte, et elle a modifié un `from "./lib-shell.mjs"` CITÉ À L'INTÉRIEUR D'UNE CHAÎNE,
// dans une éprouvette qui vérifie justement comment on détecte les dépendances internes. Le test
// attendait deux dépendances, il n'en a plus vu qu'une : le runner cassait le test qu'il lançait,
// pour la seconde fois de sa vie et pour la même raison de fond.
//
// LA DISTINCTION QUI TRANCHE : le chemin d'un vrai import est TOUJOURS dans une chaîne — ça ne
// distingue rien. Ce qui distingue, c'est le MOT-CLÉ : dans un vrai import, `from` ou `import(`
// est du code ; dans une citation, il est lui-même à l'intérieur d'une chaîne. On teste donc la
// position du mot-clé, pas celle du chemin. Le détecteur existait déjà chez Ezechiel ; on le
// réutilise plutôt que d'en écrire un second qui divergerait (leçon L29).
export function reecrireLesImportsFreres(texte = "", { estDansUneChaine = dansUneChaine } = {}) {
  return String(texte).split("\n").map((ligne) => {
    if (!ligne.includes("./")) return ligne;
    let sortie = "";
    const motif = new RegExp(MOTIF_IMPORT_FRERE.source, "gi");
    let m;
    let dernier = 0;
    while ((m = motif.exec(ligne)) !== null) {
      if (estDansUneChaine(ligne, m.index)) continue;  // le mot-clé est cité : ce n'est pas un import
      sortie += ligne.slice(dernier, m.index) + `${m[1]}../scripts/${m[2]}`;
      dernier = m.index + m[0].length;
    }
    return dernier ? sortie + ligne.slice(dernier) : ligne;
  }).join("\n");
}

export function findImportsIrresolus(texteDeLaPart = "", { existe = null, root = "" } = {}) {
  const verifie = existe ?? (() => false);
  const restants = [...new Set([...String(texteDeLaPart).matchAll(MOTIF_RELATIF_RESTANT)].map((m) => m[1]))];
  return restants.filter((chemin) => !verifie(`${root}.sites-runtime/${chemin.replace(/^\.\//, "")}`));
}

// ————————————————————————————————————————————————————————————————————————
// LE GARDE-FOU QUI MANQUAIT AU-DESSUS DE TOUS LES AUTRES (2026-10-03)
// ————————————————————————————————————————————————————————————————————————
//
// CE QUE LE RUNNER FAISAIT : il imprimait « 436 succès distincts » et ne le comparait À RIEN. Une
// part qui aurait silencieusement perdu cinquante vérifications aurait affiché « 386 succès
// distincts · terminé en 169 s », et cette ligne se lit comme un succès.
//
// POURQUOI C'EST LE PLUS DANGEREUX DE TOUS LES DÉFAUTS DE CET OUTIL, et pas seulement un de plus :
// tous les autres se voient. Un import non résolu fait tomber la part, une variable manquante
// aussi, une collision d'écriture finit par mordre. CELUI-CI NE SE VOIT PAS — il rend un vert plus
// RAPIDE, c'est-à-dire exactement ce qu'on venait chercher, en ayant moins vérifié. C'est la seule
// façon dont ce runner pourrait coûter au projet au lieu de lui rendre service.
//
// LA RÉFÉRENCE EST LE DERNIER PASSAGE SÉQUENTIEL RÉEL, lu dans l'historique d'Ezechiel — jamais un
// nombre écrit en dur, qui se périmerait au prochain test ajouté (Article 24). Et quand il n'y a
// pas de référence, on le DIT : « je n'ai rien à quoi comparer » et « rien n'a été perdu » ne
// s'écrivent jamais pareil (leçons L5/L11).
export const HISTORIQUE_EZECHIEL = "docs/ezechiel-les-tests/historique.json";

export function referenceSequentielle({ lire = null, root = "" } = {}) {
  let brut;
  try { brut = lire ? lire(HISTORIQUE_EZECHIEL) : readFileSync(new URL(`../${HISTORIQUE_EZECHIEL}`, import.meta.url), "utf8"); }
  catch { return { mesurable: false, pourquoi: `aucun historique séquentiel (${HISTORIQUE_EZECHIEL}) : lancer \`node scripts/ezechiel-les-tests.mjs mesurer\` une fois pour avoir une référence` }; }
  void root;
  let releves;
  try { releves = JSON.parse(brut); } catch { return { mesurable: false, pourquoi: `${HISTORIQUE_EZECHIEL} est illisible : un historique abîmé se lirait comme une absence de régression` }; }
  // SEUL UN PASSAGE VERT FAIT RÉFÉRENCE : un passage rouge s'est arrêté en route, donc son compte
  // de succès décrit un filet partiel et servirait de barre trop basse — l'inverse d'un garde-fou.
  const verts = (Array.isArray(releves) ? releves : []).filter((r) => r && r.code === 0 && Number.isFinite(r.succes) && r.succes > 0);
  if (!verts.length) return { mesurable: false, pourquoi: "aucun passage séquentiel VERT dans l'historique : un passage rouge s'est arrêté en route, donc son compte décrirait un filet partiel et servirait de barre trop basse" };
  const dernier = verts[verts.length - 1];
  return { mesurable: true, succes: dernier.succes, quand: dernier.quand };
}

export function verdictDeCompletude({ distincts = 0, reference = {} } = {}) {
  if (!reference.mesurable) {
    return { mesurable: false, suffisant: null, pourquoi: reference.pourquoi, message: `⚠️  COMPLÉTUDE PAS MESURÉE — ${reference.pourquoi}. Les ${distincts} succès de ce lancement ne se comparent donc à rien : ils ne prouvent pas qu'aucune vérification n'a été perdue.` };
  }
  const manquants = reference.succes - distincts;
  if (manquants > 0) {
    return { mesurable: true, suffisant: false, manquants, message: `🚨 ${manquants} VÉRIFICATION(S) PERDUE(S) — ${distincts} succès distincts ici contre ${reference.succes} au dernier séquentiel vert (${String(reference.quand).slice(0, 10)}). Un filet plus RAPIDE qui vérifie MOINS n'est pas un gain : ne pas se fier à ce lancement, relancer en séquentiel.` };
  }
  return { mesurable: true, suffisant: true, manquants: 0, message: `✅ COMPLET — ${distincts} succès distincts, contre ${reference.succes} au dernier séquentiel vert (${String(reference.quand).slice(0, 10)}) : aucune vérification perdue.${distincts > reference.succes ? ` (${distincts - reference.succes} de plus : des tests ont été ajoutés depuis.)` : ""}` };
}

// ————————————————————————————————————————————————————————————————————————
// LE PLANCHER — ce que la parallélisation ne pourra JAMAIS faire descendre (2026-10-03)
// ————————————————————————————————————————————————————————————————————————
//
// POURQUOI CE CALCUL EXISTE : le gain du parallélisme a un plafond, et ce plafond n'est pas une
// question de machine — c'est l'ÉPINE, le code écrit au niveau du fichier (préambule plus les
// ~70 tests du jeu), qui se rejoue intégralement dans chaque part. Tant qu'on ne la connaît pas,
// « ajoutons des parts » est une réponse qu'on répète sans savoir qu'elle ne rend plus rien.
//
// LE CHIFFRE A ÉTÉ MULTIPLIÉ PAR 6,5 EN QUATRE JOURS, et personne ne l'a vu : 18,6 s le
// 2026-09-29, 120,4 s le 2026-10-03, soit la MOITIÉ du temps total. Le runner n'avait plus tourné
// depuis sa naissance, donc rien ne le mesurait — et il était cassé par-dessus le marché.
//
// LA MESURE EST CORROBORÉE PAR DEUX CHEMINS INDÉPENDANTS, et c'est ce qui la rend crédible : le
// découpage par plages de lignes rend 121 s, et le lancement RÉEL à quatre parts (147 à 169 s par
// part) en implique 124 par l'équation du plancher. Un seul des deux n'aurait rien prouvé, parce
// que le recollage chronomètre↔groupes se déclare lui-même INCOMPLET.
export function plancherDuParallelisme({ src = "", mesures = [], parts = [2, 3, 4, 6, 8] } = {}) {
  if (!src) return { mesurable: false, pourquoi: "aucun filet fourni : un plancher calculé sur rien se lirait comme un plancher nul" };
  if (!mesures.length) return { mesurable: false, pourquoi: "aucun chronométrage : le plancher est un partage de TEMPS, pas de lignes — sans durées il n'y a rien à partager (leçons L5/L11)" };
  const blocs = blocsDeNiveauZero(src);
  const { socle, deplacables } = separerSocleEtDeplacables(src, blocs);
  const poids = (bs) => bs.reduce((a, b) => a + mesures.filter((m) => m.ligne >= b.debut && m.ligne <= b.fin).reduce((x, m) => x + (m.ms ?? 0), 0), 0);
  const msSocle = poids(socle);
  // LE PLANCHER COMPTE DÉSORMAIS LES DEUX ESPÈCES D'UNITÉ (#1578), et ne pas l'avoir fait aurait
  // laissé cette fonction annoncer un plafond de 121 s une heure après qu'il soit tombé à 6 — le
  // genre de chiffre faux, daté et parfaitement crédible que ce projet refuse (leçon L29 : deux
  // porteurs des mêmes chiffres divergent toujours, donc celui-ci DÉRIVE du même découpage que le
  // runner au lieu de le refaire à sa façon).
  const uA = unitesAppel(src, { mesures });
  const msAppels = uA.retenues.reduce((a, u) => a + (u.ms ?? 0), 0);
  const msDeplacables = poids(deplacables) + msAppels;
  const total = mesures.reduce((a, m) => a + (m.ms ?? 0), 0);
  const msEpine = Math.max(0, total - msSocle - msDeplacables);
  const plancher = msSocle + msEpine;
  return {
    mesurable: true, total, msSocle, msDeplacables, msEpine, plancher,
    msAppels, appels: uA.retenues.length, appelsRefuses: uA.refusees.length,
    blocs: blocs.length, socle: socle.length, deplacables: deplacables.length,
    partDeLEpine: total ? msEpine / total : 0,
    projection: parts.map((n) => ({ parts: n, msTheorique: plancher + msDeplacables / n })),
    // LA LIMITE EST DÉCLARÉE PLUTÔT QUE TUE : l'attribution ligne→durée vient du recollage
    // d'Ezechiel, qui se déclare INCOMPLET quand une fonction imprime plusieurs « Passed ». Le
    // TOTAL reste juste ; le partage entre épine et blocs ne vaut que corroboré par un lancement
    // réel, et c'est pour ça que le rapport donne les deux.
    horsPortee: "l'attribution ligne→durée dépend d'un recollage qui peut être incomplet : ce partage se LIT à côté d'un lancement réel, jamais à sa place",
  };
}

// ————————————————————————————————————————————————————————————————————————
// LES COUPLAGES AVEC L'ÉPINE — la liste de courses de la refonte (2026-10-03)
// ————————————————————————————————————————————————————————————————————————
//
// D'OÙ VIENT CE DÉTECTEUR : on a tenté de ne faire tourner l'épine que dans UNE part. Trois parts
// sur quatre sont tombées, sur un `ReferenceError: perceptionEpoch is not defined`. L'échec était
// BRUYANT, comme on l'espérait — mais le relancer pour découvrir les couplages un par un coûterait
// quatre minutes par variable. On les lit statiquement.
//
// CE QUE ÇA REND, ET C'EST LA VRAIE VALEUR : la liste exacte des variables posées à plat entre les
// blocs et utilisées À L'INTÉRIEUR d'un bloc déplaçable. C'est très précisément ce qu'il faut
// découpler pour que le plancher de 121 s tombe — ni plus, ni moins. Sans cette liste, « sortir
// les tests du jeu » est une intention ; avec elle, c'est un chantier chiffré.
//
// CE QU'IL NE SAIT PAS FAIRE, ET LE DIRE ÉVITE DE LE CROIRE : il lit des déclarations `const`,
// `let` et `var` en colonne zéro, et cherche le nom ailleurs. Une variable créée par
// déstructuration complexe, ou une fonction déclarée puis réassignée, lui échappe. Il SOUS-déclare
// donc les couplages plutôt qu'il n'en invente — et un couplage manqué se verra au lancement, pas
// dans un faux vert.
// LE MOTIF NE PEUT PAS S'ANCRER EN DÉBUT DE LIGNE, et le premier passage l'a prouvé sur le cas
// qu'on connaissait déjà : `perceptionEpoch` — la variable qui avait fait tomber trois parts sur
// quatre — est déclarée EN MILIEU DE LIGNE, `…;const perceptionEpoch=result.epoch;…`. L'épine est
// écrite en lignes denses où dix instructions se suivent, donc un détecteur ancré au début ne voit
// qu'une déclaration sur dix. Il rendait 7 couplages en ratant celui par lequel on l'avait trouvé :
// une liste courte et rassurante, c'est-à-dire le pire des deux résultats possibles.
export const MOTIF_DECLARATION_A_PLAT = /(?:^|[;{(}]\s*)(?:const|let|var)\s+(?:\{([^}]+)\}|\[([^\]]+)\]|([A-Za-z_$][\w$]*))/g;

export function nomsDeclares(ligne = "") {
  const out = [];
  for (const m of String(ligne).matchAll(MOTIF_DECLARATION_A_PLAT)) {
    const brut = m[1] ?? m[2] ?? m[3] ?? "";
    for (const x of brut.split(",")) {
      const nom = x.split(":").pop().split("=")[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(nom) && !out.includes(nom)) out.push(nom);
    }
  }
  return out;
}

// ⚠️ CETTE FONCTION REFUSE DE CONCLURE, ET LE REFUS EST LE RÉSULTAT (2026-10-03).
//
// DEUX VERSIONS ONT ÉTÉ ESSAYÉES, ET AUCUNE N'EST CROYABLE. La première n'acceptait qu'une
// déclaration en colonne zéro : elle a rendu SEPT couplages en ratant `perceptionEpoch`, c'est-à-
// dire très exactement celui par lequel le problème avait été découvert — une liste courte et
// rassurante, le pire des deux résultats possibles. La seconde accepte une déclaration en milieu
// de ligne : elle rend QUARANTE-CINQ couplages dont `a`, `n`, `t`, `r`, `e` — des variables
// LOCALES de blocs qui portent le même nom qu'une variable d'épine, donc du bruit pur.
//
// LA CAUSE EST STRUCTURELLE, PAS UN RÉGLAGE À TROUVER : distinguer une variable de portée fichier
// d'une variable locale qui porte le même nom demande de connaître les PORTÉES, c'est-à-dire un
// analyseur de syntaxe. `decouperEnGroupes` déclare explicitement n'en être pas un, et bricoler
// une approximation de portée par expressions régulières reproduirait la leçon L39 (un détecteur
// qui compte une profondeur est faux jusqu'à preuve du contraire).
//
// ET LE PREMIER PASSAGE A CORRIGÉ LE DIAGNOSTIC LUI-MÊME, ce qui vaut mieux qu'une liste :
// `perceptionEpoch` n'est PAS dans l'épine, il est déclaré DANS UN BLOC (ligne 638). Le couplage
// qui a fait tomber trois parts est donc BLOC → BLOC, et non épine → bloc. Autrement dit le
// détecteur de socle (`TOUCHES_L_ETAT_COMMUN`) ne voit que les blocs qui touchent `post`, `db` ou
// `world` — jamais ceux qui se passent une variable ordinaire. C'est LÀ qu'est le trou, et c'est
// un autre chantier que celui qu'on croyait ouvrir.
export function couplagesAvecLEpine({ src = "", jeLeCroisVraiment = false } = {}) {
  if (!jeLeCroisVraiment) {
    return {
      mesurable: false,
      pourquoi: "ce détecteur ne distingue pas une variable de PORTÉE FICHIER d'une variable LOCALE qui porte le même nom — il a rendu 7 couplages en ratant le cas connu, puis 45 dont « a », « n » et « t ». Trancher demande un analyseur de portées, pas un motif. Et le passage a corrigé le diagnostic : le couplage qui fait tomber les parts est BLOC → BLOC, pas épine → bloc",
      couplages: [],
    };
  }
  if (!src) return { mesurable: false, pourquoi: "aucun filet fourni : une liste de couplages vide se lirait comme « rien ne couple »" };
  const lignes = String(src).split("\n");
  const blocs = blocsDeNiveauZero(src);
  if (!blocs.length) return { mesurable: false, pourquoi: "aucun bloc de niveau zéro détecté : le découpage a échoué, et sans lui la notion d'épine n'a pas de sens" };
  const { deplacables } = separerSocleEtDeplacables(src, blocs);
  const finDuPreambule = blocs[0].debut - 1;
  const dansUnBloc = new Set();
  for (const b of blocs) for (let n = b.debut; n <= b.fin; n++) dansUnBloc.add(n);
  // Les noms posés à plat APRÈS le préambule : ceux-là disparaîtraient si l'épine ne tournait que
  // dans une part. Ceux du préambule restent partout, donc ils ne couplent rien.
  const posesParLEpine = new Map();
  for (let n = finDuPreambule + 1; n <= lignes.length; n++) {
    if (dansUnBloc.has(n)) continue;
    for (const nom of nomsDeclares(lignes[n - 1])) if (!posesParLEpine.has(nom)) posesParLEpine.set(nom, n);
  }
  if (!posesParLEpine.size) return { mesurable: true, couplages: [], posesParLEpine: 0, blocsTouches: 0, deplacables: deplacables.length };
  const couplages = new Map();
  for (const b of deplacables) {
    const texte = lignes.slice(b.debut - 1, b.fin).join("\n");
    for (const [nom, ligne] of posesParLEpine) {
      if (!new RegExp(`\\b${nom.replace(/[$]/g, "\\$")}\\b`).test(texte)) continue;
      if (!couplages.has(nom)) couplages.set(nom, { nom, declareeLigne: ligne, blocs: [] });
      couplages.get(nom).blocs.push(b.debut);
    }
  }
  const liste = [...couplages.values()].sort((a, b) => b.blocs.length - a.blocs.length);
  return {
    mesurable: true, couplages: liste,
    posesParLEpine: posesParLEpine.size,
    blocsTouches: new Set(liste.flatMap((c) => c.blocs)).size,
    deplacables: deplacables.length,
    horsPortee: "il lit des déclarations const/let/var en colonne zéro : une déstructuration complexe lui échappe. Il SOUS-déclare les couplages, il n'en invente jamais",
  };
}

export function formatCouplagesLines(c = {}) {
  if (!c.mesurable) return [`PAS MESURÉ — ${c.pourquoi}`];
  const L = [];
  L.push(`${c.posesParLEpine} nom(s) posé(s) à plat par l'épine · ${c.couplages.length} réellement utilisé(s) dans un bloc déplaçable · ${c.blocsTouches}/${c.deplacables} bloc(s) couplé(s)`);
  if (!c.couplages.length) { L.push("  Aucun couplage : l'épine pourrait ne tourner que dans une part."); return L; }
  L.push("  Les plus couplants — c'est par eux qu'il faut commencer :");
  for (const x of c.couplages.slice(0, 12)) L.push(`    ${String(x.blocs.length).padStart(3)} bloc(s) · ${x.nom} (posé ligne ${x.declareeLigne})`);
  L.push(`  HORS PORTÉE : ${c.horsPortee}`);
  return L;
}

export function formatPlancherLines(p = {}) {
  if (!p.mesurable) return [`PAS MESURÉ — ${p.pourquoi}`];
  const s = (ms) => `${(ms / 1000).toFixed(1)} s`;
  const L = [];
  L.push(`${p.blocs} bloc(s) · ${p.socle} du socle · ${p.deplacables} déplaçable(s) · ${p.appels ?? 0} appel(s) déplaçable(s) · total chronométré ${s(p.total)}`);
  L.push(`  ÉPINE (ce qui reste rejoué dans CHAQUE part)  : ${s(p.msEpine)} — ${Math.round(p.partDeLEpine * 100)} % du total`);
  L.push(`  socle (blocs attachés à l'état commun)        : ${s(p.msSocle)}`);
  L.push(`  travail réellement divisible                  : ${s(p.msDeplacables)}`);
  L.push(`    dont unités d'APPEL (#1578)                 : ${s(p.msAppels ?? 0)} sur ${p.appels ?? 0} appel(s), ${p.appelsRefuses ?? 0} refusé(s) et laissé(s) au socle`);
  L.push(`  PLANCHER = ${s(p.plancher)} — aucun nombre de parts ne descend en dessous.`);
  for (const x of p.projection) L.push(`    à ${x.parts} parts → ${s(x.msTheorique)} en théorie`);
  L.push(`  HORS PORTÉE : ${p.horsPortee}`);
  return L;
}

// --- La remise en ordre : ce que l'utilisateur voit à la fin ------------------------------------
// SON ARBITRAGE, MOT POUR MOT : « ordre d'origine à la fin ». En parallèle, les lignes arrivent
// mélangées et l'ordre change à chaque lancement ; les remettre dans l'ordre du fichier fait que
// rien ne change pour lui NI pour les outils qui relisent cette sortie — Ezechiel en tête, dont
// tout le chronométrage repose sur ce recollage.
// LES DOUBLONS SONT ATTENDUS, PAS UNE ANOMALIE : l'épine tourne dans chaque part, donc ses ~70
// lignes « Passed » sortent N fois. On garde la première et on compte les autres, plutôt que de
// les jeter en silence — un doublon inattendu voudrait dire qu'un bloc tourne deux fois, et c'est
// précisément ce qu'on veut voir si ça arrive.
export function recollerLesSorties(sorties = [], src = "") {
  const ordre = new Map();
  const lignesDuFilet = String(src).split("\n");
  let rang = 0;
  for (let i = 0; i < lignesDuFilet.length; i++) {
    const m = /console\.log\(\s*['"`]Passed\s*:\s*(.{0,40})/.exec(lignesDuFilet[i]);
    if (m) ordre.set(m[1].trim(), rang++);
  }
  // DEUX CLÉS, ET LES CONFONDRE FAISAIT DISPARAÎTRE UN SUCCÈS. La première version dédoublonnait sur
  // les 40 premiers caractères — le même raccourci qui sert à RETROUVER la ligne dans le fichier
  // source, où le texte imprimé peut contenir des valeurs calculées. Mesuré : deux tests du filet
  // partagent ces 40 caractères (« once the investigation is overdue (round »), donc le total annonçait
  // 298 succès là où le séquentiel en imprime 299. Un compteur qui perd une unité en silence est
  // exactement ce qu'on refuse ailleurs dans ce projet.
  // ON DÉDOUBLONNE DONC SUR LA LIGNE ENTIÈRE — deux lignes rigoureusement identiques sont le même
  // succès rejoué par une autre part, c'est le seul vrai doublon — ET ON ORDONNE sur le préfixe, qui
  // n'a pas besoin d'être unique : deux lignes qui le partagent se rangent simplement côte à côte.
  const vues = new Map();
  let doublons = 0;
  for (const s of sorties) {
    for (const l of String(s).split("\n")) {
      if (!/^Passed\s*:/.test(l)) continue;
      if (vues.has(l)) { doublons++; continue; }
      const prefixe = l.replace(/^Passed\s*:\s*/, "").slice(0, 40).trim();
      vues.set(l, { ligne: l, rang: ordre.get(prefixe) ?? Number.MAX_SAFE_INTEGER });
    }
  }
  const rangees = [...vues.values()].sort((a, b) => a.rang - b.rang).map((v) => v.ligne);
  return { lignes: rangees, doublons, inconnues: [...vues.values()].filter((v) => v.rang === Number.MAX_SAFE_INTEGER).length };
}

export function lancerUnePart(chemin, { env = {}, cwd = ROOT } = {}) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const enfant = spawn(process.execPath, [chemin], { cwd, env: { ...process.env, ...env } });
    let out = "", err = "";
    enfant.stdout.on("data", (d) => { out += d; });
    enfant.stderr.on("data", (d) => { err += d; });
    enfant.on("close", (code) => resolve({ chemin, code, out, err, ms: Date.now() - t0 }));
  });
}

async function main() {
  printReportHeader({ tool: "filet-en-parts", title: "FILET-EN-PARTS — le filet lancé en plusieurs parts simultanées", scriptPath: "scripts/filet-en-parts.mjs" });
  recordCliUsage("filet-en-parts");
  const combien = Number((process.argv.find((a) => a.startsWith("--parts=")) ?? "").split("=")[1]) || Math.min(PARTS_PAR_DEFAUT, cpus().length);
  const cheminDuFilet = filetResolu();
  console.log(`\nFilet : ${cheminDuFilet}`);
  const src = readFileSync(new URL(`../${cheminDuFilet}`, import.meta.url), "utf8");
  const blocs = blocsDeNiveauZero(src);
  const finDuPreambule = blocs[0] ? blocs[0].debut - 1 : 0;

  // `--plancher` — LE CALCUL DU PLAFOND, SANS RIEN LANCER (#1578). Il existait depuis le
  // 2026-10-03 et n'était appelé QUE par la suite de tests : une capacité réelle branchée sur
  // rien, c'est-à-dire la leçon L2 pour la seconde fois sur ce même outil. La fiche de l'outil
  // promet cette commande comme la source à jour de ses chiffres ; elle existe donc pour de vrai.
  if (process.argv.includes("--plancher")) {
    let mes = [];
    try { mes = JSON.parse(readFileSync(new URL(`../${MESURES}`, import.meta.url), "utf8")).mesures ?? []; } catch { /* le plancher dira lui-même qu'il n'est pas mesurable */ }
    console.log("\n=== LE PLANCHER DU PARALLÉLISME ===");
    for (const l of formatPlancherLines(plancherDuParallelisme({ src, mesures: mes }))) console.log(l);
    console.log("\n=== LES COUPLAGES AVEC L'ÉPINE ===");
    for (const l of formatCouplagesLines(couplagesAvecLEpine({ src }))) console.log(l);
    return;
  }
  const epineIsolee = process.argv.includes("--epine-isolee");
  let mesures = [];
  try { mesures = JSON.parse(readFileSync(new URL(`../${MESURES}`, import.meta.url), "utf8")).mesures ?? []; } catch { /* pas de mesure : on répartit au nombre de blocs */ }
  const { socle, deplacables } = separerSocleEtDeplacables(src, blocs);

  // LA SECONDE ESPÈCE D'UNITÉ, ET ELLE PÈSE PLUS LOURD QUE LA PREMIÈRE (2026-10-03, tâche #1578).
  // `--appels-partout` revient au comportement d'avant : tous les appels dans toutes les parts.
  // L'option de retour existe parce que ce runner a déjà cassé trois fois le filet qu'il lançait,
  // et qu'une porte de sortie coûte une ligne.
  const appelsPartout = process.argv.includes("--appels-partout");
  const uA = appelsPartout ? { retenues: [], refusees: [] } : unitesAppel(src, { mesures });
  const parts = repartir([...poidsDesBlocs(deplacables, mesures), ...uA.retenues], combien);
  const toutesLesLignesDAppel = uA.retenues.map((u) => u.debut);

  console.log(`\n${blocs.length} bloc(s) au total · ${deplacables.length} déplaçable(s) · ${socle.length} du SOCLE (ils touchent l'état commun, rejoués dans chaque part avec le préambule, lignes 1 à ${finDuPreambule})`);
  if (appelsPartout) {
    console.log("↩️  `--appels-partout` : les appels de fonction restent dans toutes les parts, comme avant la tâche #1578. Le plancher remonte à l'épine entière.");
  } else {
    const poids = (a) => (a.reduce((t, x) => t + (x.ms ?? 0), 0) / 1000).toFixed(1);
    console.log(`${uA.retenues.length} APPEL(S) déplaçable(s) — ${poids(uA.retenues)} s qui étaient rejoués dans chaque part. Seule la ligne d'appel bouge ; la déclaration de la fonction reste partout.`);
    if (uA.refusees.length) {
      console.log(`   ${uA.refusees.length} refusé(s) (${poids(uA.refusees)} s), et le refus se dit plutôt que de se taire :`);
      for (const r of [...uA.refusees].sort((a, b) => b.ms - a.ms).slice(0, 5)) console.log(`     · ${r.nom} — ${r.pourquoi}`);
      if (uA.refusees.length > 5) console.log(`     · … et ${uA.refusees.length - 5} autre(s), tous dans le socle, donc rejoués comme avant.`);
    }
  }
  if (!mesures.length) console.log("⚠️  aucune mesure de durée trouvée : la répartition se fait à l'aveugle, au nombre de blocs et non à leur poids — lancer `node scripts/ezechiel-les-tests.mjs sante` d'abord donnerait un équilibrage réel.");
  for (const [i, p] of parts.entries()) {
    const appels = p.blocs.filter((b) => b.kind === "appel").length;
    console.log(`  part ${i + 1} : ${String(p.blocs.length - appels).padStart(3)} bloc(s) + ${String(appels).padStart(3)} appel(s), ${(p.ms / 1000).toFixed(1)} s attendues`);
  }

  // LES PARTS NE VIVENT PAS DANS `scripts/`, ET C'EST LE DEUXIÈME DÉFAUT TROUVÉ AU LANCEMENT RÉEL.
  // Les y écrire semblait le plus simple (les imports du filet sont relatifs à ce dossier), et ça a
  // fait ÉCHOUER une part : SAFE-EXPORT balaie `scripts/`, y a vu quatre fichiers sans blueprint ni
  // fiche, et a compté cinq pièces manquantes. Un runner qui fait échouer le test qu'il lance est
  // pire qu'un runner lent. Les imports du filet sont en réalité relatifs à N'IMPORTE quel dossier
  // d'un seul niveau sous la racine (`../scripts/…`, `../.sites-runtime/…`) : `.sites-runtime/`
  // convient donc exactement, et il est déjà ignoré par git et par les outils.
  const dossier = new URL("../.sites-runtime/", import.meta.url);
  mkdirSync(dossier, { recursive: true });
  const chemins = parts.map((p, i) => {
    const chemin = new URL(`../.sites-runtime/filet-part-${i + 1}.mjs`, import.meta.url);
    // L'ÉPINE NE TOURNE QUE DANS LA PREMIÈRE PART quand l'option est demandée. Elle reste PARTOUT
    // par défaut : ce runner a déjà cassé trois fois le filet qu'il lançait, et un gain de temps
    // qui se paierait d'une vérification perdue n'est pas un gain (Article 0 de l'outillage).
    const siennes = new Set(p.blocs.filter((b) => b.kind === "appel").map((b) => b.debut));
    writeFileSync(chemin, genererLaPart(src, p.blocs.filter((b) => b.kind !== "appel"), {
      numero: i + 1,
      finDuPreambule,
      epineDansCettePart: !epineIsolee || i === 0,
      appelsRetires: toutesLesLignesDAppel.filter((l) => !siennes.has(l)),
    }));
    return chemin.pathname;
  });

  const t0 = Date.now();
  // CHAQUE PART A SON PROPRE JOURNAL D'USAGE (2026-09-29, tâche #1181). Les parts isolaient déjà
  // leur runtime ; elles écrivaient toutes dans le MÊME `.tool-usage-history.json`, en parallèle.
  // Deux dégâts, vus l'un et l'autre cette nuit : des écritures perdues, et des tests qui lisent ce
  // journal en direct pendant que trois autres processus le réécrivent — une part rouge puis verte
  // sur exactement le même code. Le journal de production n'a rien à faire dans un test, et le
  // filet n'a rien à écrire dedans (même cause que la tâche #1172, prise par sa racine).
  const resultats = await Promise.all(chemins.map((c, i) => lancerUnePart(c, { env: {
    SITES_RUNTIME_ROOT: `${ROOT}.sites-runtime/p${i + 1}`,
    TOOL_USAGE_HISTORY_PATH: `${ROOT}.sites-runtime/p${i + 1}-tool-usage-history.json`,
  } })));
  const total = Date.now() - t0;

  for (const c of chemins) { try { rmSync(c); } catch { /* déjà parti */ } }
  for (let i = 0; i < parts.length; i++) { try { rmSync(new URL(`../.sites-runtime/p${i + 1}`, import.meta.url), { recursive: true, force: true }); } catch { /* rien à nettoyer */ } }

  const recolle = recollerLesSorties(resultats.map((r) => r.out), src);
  for (const l of recolle.lignes) console.log(l);

  console.log("\n=== LES PARTS ===");
  for (const [i, r] of resultats.entries()) console.log(`  part ${i + 1} : ${r.code === 0 ? "✅" : "🚨 CODE " + r.code} en ${(r.ms / 1000).toFixed(1)} s`);
  console.log(`\nFilet en ${combien} parts terminé en ${(total / 1000).toFixed(1)} s · ${recolle.lignes.length} succès distincts · ${recolle.doublons} doublon(s) de l'épine (attendus).`);
  // LE VERDICT DE COMPLÉTUDE VIENT APRÈS LA DURÉE, ET C'EST VOLONTAIRE : la durée est ce qu'on
  // vient chercher, la complétude est ce qui décide si on a le droit de s'en réjouir.
  const completude = verdictDeCompletude({ distincts: recolle.lignes.length, reference: referenceSequentielle() });
  console.log(completude.message);
  if (completude.suffisant === false) process.exitCode = 1;

  const rate = resultats.filter((r) => r.code !== 0);
  if (rate.length) {
    console.log(`\n🚨 ${rate.length} part(s) en échec. LE RÉFLEXE EST DE RELANCER À L'ANCIENNE avant de conclure :`);
    console.log("   node scripts/check-house.mjs");
    console.log("   Si le mode séquentiel est vert et le parallèle rouge, la faute est au parallélisme, jamais au code testé.");
    for (const r of rate) console.log((r.err || r.out).split("\n").slice(-12).join("\n"));
  }

  // LE PLAN D'ACTION MANQUAIT, ET LE MOT POUR DIRE « JE N'AI RIEN MESURÉ » AUSSI (2026-09-28, tâche
  // #902, signalé par pure-gold-unity). Cet outil était le dernier des quarante-sept à conclure sur
  // un chiffre sans jamais dire ce qu'il faut en FAIRE (Article 28) — et le seul à pouvoir
  // afficher un ✅ sans porter nulle part de quoi dire qu'il n'avait pas pu mesurer.
  //
  // CE SECOND POINT EST LE PLUS DANGEREUX SUR CET OUTIL PRÉCISÉMENT : il découpe le filet en parts,
  // et une part qui n'aurait rien lancé du tout sortirait en code 0 avec zéro succès — ce qui
  // ressemble trait pour trait à une part qui a tout passé. Un filet qui ment dans ce sens-là est
  // le pire objet du dépôt.
  const ecarts = [];
  if (rate.length) {
    ecarts.push({ pourquoi: `${rate.length} part(s) sur ${parts.length} sortent en échec`,
      quoiFaire: "relancer `node scripts/check-house.mjs` en séquentiel AVANT de conclure : si le séquentiel est vert, la faute est au parallélisme et jamais au code testé" });
  }
  if (!recolle.lignes.length) {
    ecarts.push({ pourquoi: "🚨 PAS MESURÉ — aucune ligne de succès recollée : les parts ont rendu la main sans qu'aucun test ne se déclare passé",
      quoiFaire: "ne PAS lire ce passage comme un filet vert : zéro succès ressemble trait pour trait à zéro échec. Relancer en séquentiel, qui reste la référence" });
  }
  imprimerPlanDaction(planDactionDepuisEcarts(ecarts, { toolSlug: "filet-en-parts",
    libelle: (e) => e.pourquoi, tache: (e) => e.quoiFaire }));

  process.exit(rate.length ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
