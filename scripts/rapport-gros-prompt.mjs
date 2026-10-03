#!/usr/bin/env node
// ICEBERG: membre
// RAPPORT DE GROS PROMPT — l'utilitaire qui rend compte d'une saisine, point par point
// =====================================================================================
// POURQUOI IL EXISTE (2026-09-24, demande explicite de l'utilisateur). Son process : il accumule
// ses idées, ses tâches et ses questions pendant qu'on travaille plutôt que de m'interrompre par
// petits messages — « c'était un de mes défauts à corriger » — et il me les envoie d'un bloc avant
// une période autonome. Le matin, il doit trouver un RAPPORT DE GROS PROMPT : son prompt repris
// point par point, réorganisé, où chaque point porte son sort.
//
// LE DÉFAUT PRÉCIS QU'IL A NOMMÉ, et c'est lui qui a motivé l'outil : la première version manuelle
// marquait certains points « FAIT » sans leur associer la moindre tâche. Sa réaction : « j'ai
// remarqué que des taches pouvaient etre associés, et ce n'est pas fait, et tu ne me l'as pas
// proposé ». Un point traité sans tâche est invérifiable — on ne peut ni le retrouver, ni savoir
// s'il a vraiment abouti. D'où la règle mécanique ci-dessous, qui REFUSE de produire le rapport
// plutôt que de le produire incomplet.
//
// CE QU'IL N'EST PAS : un générateur de contenu. Il ne devine rien, il ne résume rien, il ne juge
// rien. Il prend une saisine déjà rédigée et lui applique le gabarit standard des rapports du
// projet — jamais un second gabarit concurrent, jamais une mise en forme inventée sur place.
//
// GÉNÉRIQUE PAR CONSTRUCTION (les deux projets, cf. CLAUDE.md) : rien ici ne connaît Lia, Noé, ni
// aucun outil de ce dépôt. Une saisine est une liste de points ; n'importe quel projet piloté par
// IA peut réutiliser ce fichier tel quel.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildReportFrame, renderTextReport, buildPlanDaction, ETATS_CONSTAT } from "./report-template.mjs";
import { renderHtmlReport } from "./html-report.mjs";
import * as ctd from "./check-tasks-details.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

export const OUTIL = "rapport-gros-prompt";
export const SCRIPT_PATH = "scripts/rapport-gros-prompt.mjs";

// Les trois sorts d'un point, et ce sont EXACTEMENT les trois états de l'Article 28 — jamais un
// quatrième, jamais un « traité » fourre-tout. C'est ce vocabulaire partagé qui permet au plan
// d'action du rapport d'être lu par les mêmes outils que tous les autres plans du projet.
export const SORTS = ETATS_CONSTAT; // retenu · ecarte · a-trancher

export const LONGUEUR_MIN_RAISON = 40;

// LA RÈGLE QUI A MOTIVÉ L'OUTIL. Un point RETENU sans numéro de tâche est refusé : c'est
// littéralement le « FAIT-Q » que l'utilisateur n'a pas aimé. Un point ÉCARTÉ sans raison écrite
// est refusé aussi — un écart sans raison n'est pas une décision, c'est un abandon déguisé
// (Article 28). On refuse de PRODUIRE plutôt que de produire un rapport qui a l'air complet : un
// rapport incomplet mais bien mis en page est plus dangereux qu'une erreur visible.
export function validerPoints(points = []) {
  const fautes = [];
  const vus = new Set();
  points.forEach((p, i) => {
    const ou = p?.id ? `point ${p.id}` : `point n°${i + 1}`;
    if (!p?.id) fautes.push(`${ou} : pas d'identifiant — impossible d'y répondre point par point`);
    else if (vus.has(p.id)) fautes.push(`${ou} : identifiant en double`);
    else vus.add(p.id);
    if (!p?.citation) fautes.push(`${ou} : la demande de l'utilisateur n'est pas citée dans ses termes`);
    if (!SORTS.includes(p?.sort)) fautes.push(`${ou} : sort « ${p?.sort ?? "absent"} » inconnu — attendu ${SORTS.join(", ")}`);
    if (p?.sort === "retenu" && !(p.taches ?? []).length) {
      fautes.push(`${ou} : RETENU sans aucune tâche associée — c'est le « FAIT-Q » que l'utilisateur a refusé le 2026-09-24 : un point traité sans tâche est invérifiable`);
    }
    if (p?.sort === "ecarte" && String(p.raison ?? "").trim().length < LONGUEUR_MIN_RAISON) {
      fautes.push(`${ou} : ÉCARTÉ sans raison lisible — un écart sans raison écrite n'est pas une décision (Article 28)`);
    }
  });
  return { valide: fautes.length === 0, fautes };
}

// ══════════════════════════════════════════════════════════════════════════
// LA SAISINE INTÉGRALE (2026-09-24, tâche #723 — RECOMMANDE-CRITIQUE)
// ══════════════════════════════════════════════════════════════════════════
//
// LE TROU A ÉTÉ TROUVÉ EN ESSAYANT DE RÉPONDRE À UNE DE SES QUESTIONS, et c'est ce qui le rend
// incontestable. Il demandait de comparer son cahier des charges d'origine pour AGENT-DU-TEMPS à
// ce qui avait été construit. Impossible : le dépôt garde MES réponses (`docs/reponses/`) et MON
// découpage de sa demande en points, jamais SA formulation. Les quatre saisines archivées à ce
// jour portent 695, 602, 1 631 et 5 409 caractères de CITATIONS — des extraits que j'ai choisis,
// jamais son texte.
//
// POURQUOI C'EST GRAVE ET PAS SEULEMENT DOMMAGE. Un rapport qui archive les réponses sans la
// question rend toute vérification ultérieure impossible : on ne peut plus savoir si un point a
// été mal compris, ni si un point a été oublié, puisque la seule liste de points qui existe est
// celle que j'ai faite. C'est exactement le reproche qu'il formule — « j'espère que tu n'as pas
// perdu la valeur ». Le découpage est une INTERPRÉTATION ; l'archiver sans sa source, c'est
// archiver ma lecture à la place de sa demande.
//
// LA CORRECTION EST UN REFUS, jamais un avertissement : sans `texteIntegral`, le rapport n'est pas
// produit. Un avertissement se lit une fois puis se saute, et le texte perdu l'est pour de bon —
// il n'existe nulle part ailleurs, contrairement à une tâche manquante qu'on peut toujours créer
// après coup.
//
// ET IL EST RECOPIÉ VERBATIM, jamais reformaté : ni recoupé, ni ré-indenté, ni tronqué. Un texte
// « nettoyé » n'est plus une pièce à conviction. La seule chose qu'on en dit est sa longueur, pour
// qu'une troncature accidentelle se voie.
export const SAISINE_MIN_CARACTERES = 120;

// LES QUATRE SAISINES D'AVANT LA RÈGLE, et pourquoi elles ne sont pas fabriquées. Les quatre
// rapports déjà archivés (`docs/rapports-gros-prompt/`) n'ont pas de texte d'origine : il est perdu
// pour de bon, et inventer un texte plausible serait infiniment pire qu'un champ vide — ce serait
// une pièce à conviction falsifiée. Elles déclarent donc la PERTE, avec sa raison, plutôt que de
// la combler : c'est le geste que ce dépôt applique déjà partout (« déclarer l'absence » vaut mieux
// que la taire, et mieux que la remplir).
//
// L'ÉCHAPPATOIRE EST FERMÉE PAR LA DATE, jamais par la bonne foi : la déclaration n'est acceptée
// que pour une saisine ANTÉRIEURE au jour où la règle est née. Une saisine d'aujourd'hui ne peut
// pas se déclarer perdue — son texte est sous les yeux de celui qui rédige le rapport.
export const DATE_REGLE_SAISINE = "2026-09-27";

export function validerSaisine(saisine = {}) {
  const fautes = [];
  const texte = String(saisine.texteIntegral ?? "");
  const perdu = String(saisine.texteIntegralPerdu ?? "").trim();
  if (perdu) {
    const avant = String(saisine.dateDuPrompt ?? "") < DATE_REGLE_SAISINE;
    if (!avant) {
      fautes.push(`PERTE DÉCLARÉE SUR UNE SAISINE DU ${saisine.dateDuPrompt ?? "?"} — refusée. La règle du texte intégral existe depuis le ${DATE_REGLE_SAISINE} : une saisine de ce jour ou d'après ne peut pas avoir perdu son texte, il est sous les yeux de celui qui rédige le rapport.`);
    } else if (perdu.length < LONGUEUR_MIN_RAISON) {
      fautes.push("PERTE DÉCLARÉE SANS RAISON LISIBLE — une perte sans raison écrite n'est pas une déclaration, c'est une case cochée (Article 28).");
    }
    return { valide: fautes.length === 0, fautes, perteDeclaree: fautes.length === 0 };
  }
  if (!texte.trim()) {
    fautes.push("SAISINE INTÉGRALE ABSENTE — le rapport n'est PAS produit (tâche #723). Sans le texte d'origine, ce rapport n'archive que MON découpage de sa demande, jamais sa demande : aucune vérification ultérieure n'est plus possible, et son texte n'existe nulle part ailleurs.");
  } else if (texte.trim().length < SAISINE_MIN_CARACTERES) {
    // UN RÉSUMÉ GLISSÉ À LA PLACE DU TEXTE serait pire qu'une absence : il aurait l'air d'une
    // archive. Le plancher ne prouve rien à lui seul, il écarte seulement le cas grossier.
    fautes.push(`SAISINE INTÉGRALE SUSPECTE — ${texte.trim().length} caractères pour ${(saisine.points ?? []).length} point(s) distinct(s). C'est trop court pour être le texte d'origine : un résumé déposé à la place ressemblerait à une archive, ce qui est pire qu'un champ vide.`);
  }
  return { valide: fautes.length === 0, fautes };
}

// ══════════════════════════════════════════════════════════════════════════
// LE DÉCLENCHEMENT AUTOMATIQUE (2026-09-24, tâche #724)
// ══════════════════════════════════════════════════════════════════════════
//
// SA DEMANDE : « je voudrais generaliser l'utilisation du process gros prompt : quand un prompt
// comporte X taches à faire ou X caracteres, il y a automatiquement la proposition ». Deux seuils,
// et ce qui se déclenche est une PROPOSITION — jamais un rapport imposé, parce qu'un rapport de
// saisine sur une demande simple serait une cérémonie, et une cérémonie finit par se contourner.
//
// LE COMPTE SOUS-DÉCLARE, ET C'EST UN CHOIX. Repérer « une demande » dans du texte libre français
// n'a pas de solution exacte. Entre rater une demande et en inventer une, ce compteur rate : il ne
// retient que des marqueurs STRUCTURELS non ambigus (une puce, une numérotation, un point
// d'interrogation en fin de paragraphe). Un compteur qui sur-déclare proposerait le process sur
// des messages ordinaires, et la proposition cesserait d'être lue (leçon L4). Le résultat est donc
// un PLANCHER, et il le dit.
export const MOTIF_PUCE = /^\s*(?:[-*•–—]\s+|\(?\d{1,2}[.)]\s+|[a-zA-Z][.)]\s+)/;

// LE SEUIL DE DEMANDES EST DÉRIVÉ DU CORPUS RÉEL, jamais choisi au jugé (Article 24) : les quatre
// saisines archivées à ce jour portent 8, 4, 11 et 31 points distincts. La plus petite qui ait
// réellement mérité le process en portait QUATRE.
export const SEUIL_DEMANDES = 4;

// LE SEUIL DE CARACTÈRES EST PROVISOIRE, ET LA RAISON EST EXACTEMENT LA TÂCHE #723 : il ne PEUT
// PAS être dérivé aujourd'hui, puisque aucune saisine n'a jamais été archivée dans son texte
// d'origine. Ce qu'on a — 695 à 5 409 caractères de citations — est un plancher de mes extraits,
// pas la longueur de ses messages. Le chiffre ci-dessous est donc une estimation DÉCLARÉE comme
// telle, à recalibrer sur les trois premières vraies saisines que #723 fera archiver. L'écrire
// plutôt que de le taire est la seule protection possible (Article 27).
export const SEUIL_CARACTERES = 1500;
export const SEUIL_CARACTERES_PROVISOIRE = "estimation, jamais mesurée : aucune saisine n'existe dans son texte d'origine avant la tâche #723. À recalibrer sur les trois premières archivées.";

export function compterLesDemandes(texte = "") {
  const lignes = String(texte).split("\n");
  const puces = lignes.filter((l) => MOTIF_PUCE.test(l)).length;
  // Un paragraphe qui se termine par un point d'interrogation est une demande, sans ambiguïté.
  // On ne compte QUE ceux-là : un verbe à l'impératif se confond avec un présent, et ce compteur
  // préfère rater plutôt qu'inventer.
  const questions = String(texte).split(/\n\s*\n/).filter((b) => /\?\s*$/.test(b.trim())).length;
  // Les deux familles ne s'additionnent PAS : une liste à puces dont un item finit par « ? » serait
  // comptée deux fois, et le compteur sur-déclarerait précisément ce qu'il promet de sous-déclarer.
  const demandes = Math.max(puces, questions);
  return {
    demandes, puces, questions,
    caracteres: String(texte).length,
    plancher: true,
    horsPortee: "PLANCHER, jamais un compte exact : seuls les marqueurs structurels non ambigus sont retenus (puce, numérotation, paragraphe interrogatif). Une demande formulée en prose continue n'est pas comptée — ce compteur rate plutôt que d'inventer.",
  };
}

export function declencheLeProcess(texte = "", { seuilDemandes = SEUIL_DEMANDES, seuilCaracteres = SEUIL_CARACTERES } = {}) {
  const c = compterLesDemandes(texte);
  const parDemandes = c.demandes >= seuilDemandes;
  const parLongueur = c.caracteres >= seuilCaracteres;
  return {
    ...c,
    declenche: parDemandes || parLongueur,
    // LA RAISON VOYAGE AVEC LE VERDICT : « le process est proposé » sans dire pourquoi se lit comme
    // une règle arbitraire, et une règle arbitraire se contourne.
    pourquoi: parDemandes && parLongueur ? `${c.demandes} demandes repérées (seuil ${seuilDemandes}) ET ${c.caracteres} caractères (seuil ${seuilCaracteres})`
      : parDemandes ? `${c.demandes} demandes repérées, seuil ${seuilDemandes}`
      : parLongueur ? `${c.caracteres} caractères, seuil ${seuilCaracteres} (seuil PROVISOIRE — ${SEUIL_CARACTERES_PROVISOIRE})`
      : `${c.demandes} demande(s) et ${c.caracteres} caractères : sous les deux seuils. Et comme le compte est un plancher, un message dense en prose continue peut passer dessous — la proposition reste possible à la main.`,
  };
}

// Le nombre de points ne se déclare pas, il se compte : une saisine qui annoncerait « 12 points »
// et en porterait 11 produirait un rapport qui ment sur sa propre exhaustivité.
export function compterParSort(points = []) {
  const c = Object.fromEntries(SORTS.map((s) => [s, 0]));
  for (const p of points) if (SORTS.includes(p?.sort)) c[p.sort] += 1;
  return c;
}

export function tachesCitees(points = []) {
  return [...new Set(points.flatMap((p) => p?.taches ?? []))].sort((a, b) => a - b);
}

// ————————————————————————————————————————————————————————————————————————
// L'ÉTAT RÉEL DE CHAQUE POINT, LU DANS LE SUIVI (2026-10-03, sa demande du soir)
// ————————————————————————————————————————————————————————————————————————
//
// LE DÉFAUT QUE ÇA CORRIGE EST CELUI D'UN INSTANTANÉ : ce rapport a été écrit à 10h31, il annonce
// « RETENU → tâche #1533 », et à 19h la tâche est faite et poussée. Le document dit donc vrai sur
// la DÉCISION et faux sur l'ÉTAT, sans qu'une ligne ne distingue les deux. Il va s'en servir pour
// répondre point par point : lui laisser croire qu'il reste 83 chantiers ouverts quand huit sont
// livrés lui ferait perdre exactement le temps que ce rapport existe pour lui épargner.
//
// L'ÉTAT SE LIT, IL NE SE RECOPIE PAS (Article 24) : on va le chercher dans `docs/suivi/` à chaque
// régénération. Un rapport régénéré demain dira l'état de demain sans qu'on touche à ce fichier.
export function etatDesTachesCitees(points = [], { lireLesLignes = null, root = "." } = {}) {
  const numeros = [...new Set(points.flatMap((p) => (p?.taches ?? []).map((t) => String(t).replace(/^#/, ""))))];
  if (!numeros.length) return { mesurable: false, pourquoi: "aucun point ne cite de tâche : il n'y a rien dont on puisse lire l'état" };
  let lignes;
  try { lignes = lireLesLignes ? lireLesLignes() : lireLesLignesDuSuivi({ root }); }
  catch (e) { return { mesurable: false, pourquoi: `le suivi n'a pas pu être lu (${e.message}) — « je n'ai pas regardé » et « rien n'a bougé » ne s'écrivent jamais pareil (leçons L5/L11)` }; }
  const etats = new Map();
  for (const l of lignes) if (numeros.includes(l.numero)) etats.set(l.numero, l.statut);
  const absentes = numeros.filter((n) => !etats.has(n));
  return { mesurable: true, etats, absentes, lues: lignes.length };
}

// LE LECTEUR DU SUIVI, VOLONTAIREMENT MINUSCULE : on ne veut que deux cases par ligne, le numéro
// et le statut. Importer le lecteur canonique entier ferait dépendre la production d'un rapport
// de tout l'outillage de tâches, pour deux colonnes.
export function lireLesLignesDuSuivi({ root = ".", listDirImpl = null, readFileImpl = null } = {}) {
  const ls = listDirImpl ?? ((d) => readdirSync(d));
  const lire = readFileImpl ?? ((f) => readFileSync(f, "utf8"));
  const out = [];
  for (const dossier of ["docs/suivi/sessions", "docs/suivi/archives"]) {
    let noms = [];
    try { noms = ls(join(root, dossier)); } catch { continue; }
    for (const n of noms.filter((x) => String(x).endsWith(".md"))) {
      let texte = "";
      try { texte = lire(join(root, dossier, n)); } catch { continue; }
      for (const ligne of texte.split("\n")) {
        if (!ligne.startsWith("| ")) continue;
        const cases = ligne.split(/(?<!\\)\|/);
        if (cases.length < 4) continue;
        const numero = cases[1].trim();
        if (!/^\d{1,5}$/.test(numero)) continue;
        out.push({ numero, statut: cases[cases.length - 2].trim() });
      }
    }
  }
  return out;
}

export const MOTIF_STATUT_FAIT = /^(termin|clos|fait)/i;

export function etatLisible(statut = "") {
  if (!statut) return { fait: false, texte: "état introuvable dans le suivi" };
  if (MOTIF_STATUT_FAIT.test(statut)) return { fait: true, texte: statut.split(/[—:]/)[0].trim() || "terminée" };
  return { fait: false, texte: statut.split(/[—:]/)[0].trim() || statut };
}

const ICONE = { retenu: "🟢", ecarte: "⚪", "a-trancher": "🟠" };
const LIBELLE = { retenu: "RETENU", ecarte: "ÉCARTÉ", "a-trancher": "À TRANCHER" };

export function blocsDuRapport(saisine, { etat = null } = {}) {
  const points = saisine.points ?? [];
  const compte = compterParSort(points);
  const blocs = [];
  // L'ÉTAT EST LU AU MOMENT DU RENDU, jamais figé dans le JSON : le JSON porte la DÉCISION prise
  // sur chaque point, le suivi porte l'ÉTAT de ce qui en a découlé, et les deux n'ont pas la même
  // durée de vie. Les mélanger ferait vieillir la décision avec l'état.
  const e = etat ?? etatDesTachesCitees(points, {});
  if (e.mesurable) {
    const faites = [...e.etats.values()].filter((st) => etatLisible(st).fait).length;
    blocs.push({ type: "note", text:
      `OÙ EN SONT LES TÂCHES DE CE RAPPORT, à l'instant où tu le lis — lu dans docs/suivi/, jamais recopié :\n` +
      `${faites} tâche(s) sur ${e.etats.size} sont FAITES, ${e.etats.size - faites} restent ouvertes.\n` +
      `Chaque point ci-dessous porte l'état réel de ses tâches à côté de leur numéro.` +
      (e.absentes.length ? `\n🚨 ${e.absentes.length} tâche(s) citée(s) et INTROUVABLE(S) dans le suivi : ${e.absentes.join(", ")} — une référence morte ressemble à un lien, ce qui est pire qu'une absence.` : "") });
  } else {
    blocs.push({ type: "note", text: `OÙ EN SONT LES TÂCHES : PAS MESURÉ — ${e.pourquoi}` });
  }

  blocs.push({ type: "note", text:
    `Ton prompt du ${saisine.dateDuPrompt} contient ${points.length} point(s) distinct(s). Ils sont repris ci-dessous ` +
    `RÉORGANISÉS par sujet — jamais dans l'ordre où ils sont arrivés, qui est l'ordre où tu y as pensé, pas celui où ils se traitent.\n` +
    `${ICONE.retenu} ${compte.retenu} retenu(s) · ${ICONE.ecarte} ${compte.ecarte} écarté(s) · ${ICONE["a-trancher"]} ${compte["a-trancher"]} à trancher par toi.` });

  // Un point par sujet, groupé — c'est la « réorganisation » que l'utilisateur demande, et elle est
  // DÉRIVÉE du champ sujet de chaque point, jamais d'un classement écrit à part qui divergerait.
  const parSujet = new Map();
  for (const p of points) {
    const s = p.sujet ?? "Divers";
    if (!parSujet.has(s)) parSujet.set(s, []);
    parSujet.get(s).push(p);
  }
  // LA SAISINE TELLE QU'ELLE EST ARRIVÉE, avant tout découpage (tâche #723). Elle vient EN TÊTE et
  // pas en annexe : le découpage qui suit est une interprétation, et on lit une interprétation en
  // ayant sa source sous les yeux, jamais après l'avoir déjà admise.
  const brut = String(saisine.texteIntegral ?? "");
  const perdu = String(saisine.texteIntegralPerdu ?? "").trim();
  blocs.push({ type: "heading", text: "LA SAISINE, TELLE QU'ELLE EST ARRIVÉE" });
  blocs.push({ type: "note", text: perdu
    ? `⛔ TEXTE D'ORIGINE PERDU — ${perdu}\n\nCe rapport n'archive donc que MON découpage de sa demande, jamais sa demande. Aucune vérification ultérieure n'est possible sur ce qui aurait pu être mal compris ou oublié. C'est précisément le trou que la tâche #723 a refermé pour les saisines suivantes.`
    : `${brut.length} caractères, recopiés VERBATIM — ni recoupés, ni ré-indentés, ni tronqués. Le découpage en ${points.length} point(s) ci-dessous est MON interprétation ; ceci est la source.\n\n` + brut });

  for (const [sujet, liste] of parSujet) {
    blocs.push({ type: "heading", text: sujet });
    for (const p of liste) {
      const taches = (p.taches ?? []).map((t) => {
        const n = String(t).replace(/^#/, "");
        if (!e.mesurable) return `#${n}`;
        const st = e.etats.get(n);
        const l = etatLisible(st);
        return `#${n} ${l.fait ? "✅ faite" : `⏳ ${l.texte}`}`;
      }).join(", ");
      blocs.push({ type: "note", text:
        `${ICONE[p.sort]} [${p.id}] ${LIBELLE[p.sort]}${taches ? ` — ${taches}` : ""}\n` +
        `   TA DEMANDE : « ${p.citation} »\n` +
        `   ${p.sort === "ecarte" ? "POURQUOI ON NE FAIT RIEN" : "OÙ ÇA EN EST"} : ${p.reponse ?? p.raison ?? ""}` +
        (p.question ? `\n   ❓ CE QUE J'ATTENDS DE TOI : ${p.question}` : "") });
    }
  }
  return blocs;
}

// Les vignettes viennent de l'outil des tâches, jamais d'un second parseur du suivi — la règle
// anti-doublon de docs/regles-de-travail.md §7ter. Si le suivi devient illisible, la fonction rend
// null et le rapport le dira, plutôt que d'inventer une qualification.
function chargerVignettes() {
  try {
    const { loadAllTaskRows, indexDesTaches, ligneDeTache } = ctd;
    const idx = indexDesTaches(loadAllTaskRows());
    return (n) => { const r = idx.get(Number(n)); return r ? ligneDeTache(r, { largeur: 74, avecNumero: false }) : `⛔ #${n} — ANNONCÉE MAIS ABSENTE du suivi : une référence morte ressemble à un lien, c'est pire qu'une absence`; };
  } catch (e) {
    return () => null;
  }
}
let vignetteDe = () => null;

export function construireRapport(saisine) {
  vignetteDe = chargerVignettes();
  // LES DEUX REFUS SONT LEVÉS ENSEMBLE, jamais l'un puis l'autre : un rapport recommencé trois fois
  // parce qu'on ne lui dit qu'une faute à la fois finit par être produit à la main pour aller plus
  // vite, et le garde-fou aura servi à le contourner.
  const vs = validerSaisine(saisine);
  const v = validerPoints(saisine.points);
  const fautes = [...vs.fautes, ...v.fautes];
  if (fautes.length) throw new Error(`rapport-gros-prompt : saisine incomplète, rapport NON produit.\n  - ${fautes.join("\n  - ")}`);
  const points = saisine.points ?? [];
  // LE CHAMP S'APPELLE `constat`, PAS `libelle` — défaut réel du premier rapport produit, trouvé
  // par l'utilisateur en le lisant : « pourquoi dans la fin de rapport [...] toutes les taches sont
  // undefined ? ». buildPlanDaction() lit `constat` ; je lui passais `libelle`, et il rendait
  // « undefined » vingt-cinq fois de suite sans que rien ne s'en plaigne. Un plan d'action qui
  // s'affiche entièrement faux est plus dangereux qu'un plan absent : il a l'air d'un plan.
  //
  // ET LE CONSTAT PORTE LA VIGNETTE DE LA VRAIE TÂCHE, jamais un numéro nu — sa seconde demande
  // dans le même message : « je prefere que d'abord les taches soient qualifiées entierement, avant
  // de creer le rapport final ». La vignette est lue dans docs/suivi/, donc elle ne peut pas mentir
  // sur l'état réel d'une tâche, et une tâche annoncée qui n'existe pas se voit immédiatement.
  const constats = points.map((p) => {
    const nums = p.taches ?? [];
    const vignettes = nums.map((n) => vignetteDe(n)).filter(Boolean);
    return {
      etat: p.sort,
      constat: `[${p.id}] ${vignettes[0] ?? (p.sujet ?? "Divers")}${vignettes.length > 1 ? `\n       + ${vignettes.slice(1).join("\n       + ")}` : ""}`,
      tache: nums[0] ?? null,
      pourquoi: p.raison ?? p.question ?? null,
      question: p.question ?? null,
    };
  });
  return buildReportFrame({
    tool: OUTIL,
    scriptPath: SCRIPT_PATH,
    origin: saisine.origine ?? "demande",
    title: saisine.titre ?? "RAPPORT DE GROS PROMPT",
    subtitle: `Saisine du ${saisine.dateDuPrompt} · ${points.length} point(s) · ${tachesCitees(points).length} tâche(s) associée(s)`,
    dateLabel: saisine.dateDuRapport,
    blocks: blocsDuRapport(saisine),
    planDaction: buildPlanDaction(constats, { toolSlug: OUTIL }),
    footer: `HORS PORTÉE : ce rapport dit ce qui a été fait de chaque point ; il ne dit jamais si c'était la bonne chose à faire — ça se lit, et ça se tranche avec toi, point par point.`,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // #763 : sans cette ligne, le compteur affichait 0 alors que trois rapports existent sur disque —
  // un compteur empêché de compter rend exactement ce que rend un compteur qui n'a rien à compter,
  // et la conclusion naturelle d'un zéro est « relançons-le », donc du travail refait pour rien.
  recordCliUsage("rapport-gros-prompt", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
  const [, , entree, sortie] = process.argv;
  // LA COMMANDE « seuil » (2026-09-24, tâche #724) : elle répond à « ce message mérite-t-il le
  // process ? » sans rien produire. Elle existe séparément du rapport parce que la réponse est
  // utile AVANT de décider d'en faire un — et parce qu'un compteur qu'on ne peut pas interroger
  // seul ne sera jamais consulté (leçon L2 : un mécanisme qui ne sort jamais du script est une
  // intention).
  if (entree === "seuil") {
    const fichier = process.argv[3];
    if (!fichier) { console.error("usage : node scripts/rapport-gros-prompt.mjs seuil <message.txt>"); process.exit(2); }
    const d = declencheLeProcess(readFileSync(fichier, "utf8"));
    console.log("");
    console.log("=== LE PROCESS GROS PROMPT EST-IL PROPOSÉ ? (tâche #724) ===");
    console.log(`  ${d.declenche ? "🟠 OUI — proposition à poser" : "⚪ NON"} : ${d.pourquoi}`);
    console.log(`  Compté : ${d.demandes} demande(s) — ${d.puces} par puce ou numérotation, ${d.questions} paragraphe(s) interrogatif(s) · ${d.caracteres} caractères.`);
    console.log(`  Seuils : ${SEUIL_DEMANDES} demandes (DÉRIVÉ du corpus réel : 8, 4, 11 et 31 points sur les quatre saisines archivées) · ${SEUIL_CARACTERES} caractères (PROVISOIRE).`);
    console.log(`  HORS PORTÉE : ${d.horsPortee}`);
    console.log("  CE QUI SE DÉCLENCHE est une PROPOSITION, jamais un rapport imposé : un rapport de saisine sur une demande simple serait une cérémonie, et une cérémonie finit par se contourner.");
    console.log("");
    process.exit(0);
  }
  if (!entree) { console.error("usage : node scripts/rapport-gros-prompt.mjs <saisine.json> [sortie.txt]\n        node scripts/rapport-gros-prompt.mjs seuil <message.txt>"); process.exit(2); }
  // DEUX SORTIES POUR UNE SEULE DESCRIPTION (2026-09-26, sa demande : « livre le rapport de gros
  // prompt [...] en format HTML (la sauvegarde reste txt) »). C'est exactement la décision
  // `delivery_html` déjà en vigueur ailleurs : le TXT est l'archive committée, le HTML est la copie
  // de remise. Les deux rendus consomment la MÊME description (`construireRapport`), donc aucun des
  // deux ne peut dire ce que l'autre ignore — c'est toute la raison d'être du gabarit partagé.
  const description = construireRapport(JSON.parse(readFileSync(entree, "utf8")));
  const texte = renderTextReport(description);
  if (sortie) {
    writeFileSync(sortie, texte);
    console.log(`Archive TXT écrite : ${sortie}`);
    const html = sortie.replace(/\.txt$/, "") + ".html";
    writeFileSync(html, renderHtmlReport(description));
    console.log(`Copie de remise HTML : ${html}`);
  } else console.log(texte);
}
