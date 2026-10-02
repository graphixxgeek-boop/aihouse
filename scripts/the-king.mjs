// ICEBERG: membre
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
import { sh, printReliabilityNotice, decouperEnUnites, pairesParJaccard, lireLeDocumentGouvernant, ligneDocumentAbsent, MARQUEUR_NEGATION, MARQUEUR_ABSOLU } from "./lib-shell.mjs";
import { SEUIL_JACCARD_STRICT } from "./abraham-les-references.mjs";
import { readFileSync, writeFileSync, mkdirSync, readdirSync as fsReaddir, existsSync as fsExists } from "node:fs";
import { join } from "node:path";
import { printReportHeader, imprimerPlanDaction } from "./report-template.mjs";
import { buildPlanDaction, PLAN_ACTION_TITRE } from "./report-template.mjs";

const ROOT = process.cwd();

// LE TEXTE FONDATEUR SUR LEQUEL IL VEILLE — paramétrable depuis le 2026-09-27 (tâche #668).
//
// POURQUOI CE CAS EST LE PLUS NET DES QUATORZE : veiller sur un texte fondateur est précisément la
// VOCATION GÉNÉRIQUE de THE-KING. Un outil dont le métier est « garder la boussole d'un projet » et
// qui code en dur la boussole de CE projet-ci ne peut pas garder celle du suivant — il a raté la
// moitié de sa mission (charte, « chaque outil construit ici doit pouvoir partir »).
//
// LE REMÈDE N'EST JAMAIS DE RETIRER LA LECTURE, c'est de la rendre paramétrable avec une valeur par
// défaut, exactement comme le reste du paysage le fait déjà (`{ root = ROOT }`, `{ registres = … }`).
// Un outil qui reçoit sa cible en option part tel quel : il suffit de lui en donner une autre.
export const PHILOSOPHY_PATH = "docs/philosophie-et-politique.md";

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

// LE DOCUMENT A CHANGÉ DE FORME LE 2026-10-02 (tâche #1429), ET LE PARSEUR DOIT SUIVRE.
//
// L'édition révélée est un document de gouvernance : articles numérotés en continu, sous des
// titres et des chapitres, plus des tableaux de politique où chaque ligne porte son numéro. La
// forme précédente numérotait « partie.numéro » et portait un tag entre crochets.
//
// LES DEUX FORMES SONT RECONNUES, ET CE N'EST PAS DE LA COMPLAISANCE : les éditions remplacées
// sont conservées sans altération au registre d'archives, et THE-KING doit pouvoir les relire
// pour tenir l'histoire du document — c'est son rôle depuis le 2026-09-21. Un parseur qui ne lit
// que la forme du jour rendrait l'archive illisible le lendemain de son archivage.
const ARTICLE_HEADING_PATTERN = /^#{2,3} Article (\d+)\s*[—–-]\s*(.+?)\s*$/gm;
const ARTICLE_TABLE_PATTERN = /^\|\s*\*\*(\d+)\*\*\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm;

export function extractPrincipleUnits(text) {
  // FORME HISTORIQUE — un principe porte une partie, un numéro, un titre ET un tag.
  const ancienne = decouperEnUnites(text, SECTION_HEADING_PATTERN, {
    motifBorneSuperieure: TOP_HEADING_PATTERN,
    champs: (m) => ({ partie: Number(m[1]), numero: Number(m[2]), titre: m[3].trim(), tag: m[4].trim() }),
  });
  if (ancienne.length) return ancienne;

  // FORME OFFICIELLE — articles numérotés en continu. La « partie » devient 0 : la numérotation
  // est unique sur tout le document, il n'y a plus de partie à distinguer, et inventer un numéro
  // de partie depuis le titre serait une donnée fabriquée.
  const parTitre = decouperEnUnites(text, ARTICLE_HEADING_PATTERN, {
    motifBorneSuperieure: /^# /gm,
    champs: (m) => ({ partie: 0, numero: Number(m[1]), titre: m[2].trim(), tag: "" }),
  });
  // LES TABLEAUX DE POLITIQUE COMPTENT AUTANT QUE LES ARTICLES EN PROSE, et les oublier aurait
  // amputé le document de ses vingt-six dispositions de politique — c'est-à-dire de son titre III
  // tout entier, pendant que la mesure aurait continué de rendre un chiffre d'apparence normale.
  const parTableau = [...String(text ?? "").matchAll(ARTICLE_TABLE_PATTERN)].map((m) => ({
    partie: 0, numero: Number(m[1]), titre: m[3].trim().slice(0, 80), tag: m[2].trim(),
    texte: `${m[3].trim()} (${m[2].trim()})`,
  }));
  const vus = new Set(parTitre.map((u) => u.numero));
  return [...parTitre, ...parTableau.filter((u) => !vus.has(u.numero))].sort((a, b) => a.numero - b.numero);
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
// LA DATE D'ÉDITION, TROISIÈME SOURCE (2026-10-02, tâche #1429) — et elle n'est pas un repli
// commode, c'est une source de plein droit.
//
// LE CAS QUI L'A IMPOSÉE : un document de gouvernance établi d'un bloc. Ses articles n'ont aucune
// date déclarée individuellement, et l'historique git ne les connaît pas encore puisqu'ils
// naissent dans le commit en cours. Les deux sources existantes rendaient donc « non daté » pour
// la totalité du document — c'est-à-dire que le dispositif conçu pour raconter l'histoire du
// texte devenait muet le jour où ce texte était écrit.
//
// POURQUOI CE N'EST PAS UNE DATE FABRIQUÉE, et la distinction est tout : un document officiel
// DÉCLARE sa date d'édition en tête, et tous ses articles datent de cette édition. Lire cette
// date est donc une lecture, jamais une déduction. La provenance est nommée « édition » et reste
// distincte de « déclarée » et de « git », pour qu'on sache toujours d'où vient ce qu'on lit.
export const MOTIF_DATE_D_EDITION = /\*\*[ÉE]dition\s+\d+\s*[—–-]\s*établie le\s+(\d{1,2})\s+([a-zéû]+)\s+(\d{4})/i;
const MOIS_FR = { janvier: "01", février: "02", fevrier: "02", mars: "03", avril: "04", mai: "05", juin: "06", juillet: "07", août: "08", aout: "08", septembre: "09", octobre: "10", novembre: "11", décembre: "12", decembre: "12" };

export function dateDEdition(texte) {
  const m = String(texte ?? "").match(MOTIF_DATE_D_EDITION);
  if (!m) return undefined;
  const mois = MOIS_FR[m[2].toLowerCase()];
  if (!mois) return undefined;
  return `${m[3]}-${mois}-${String(m[1]).padStart(2, "0")}`;
}

export function principleDate(principle, options = {}) {
  const declaree = extractPrincipleDate(principle);
  if (declaree) return { date: declaree, provenance: "déclarée" };
  const git = principleDateFromGit(principle, options);
  if (git) return { date: git, provenance: "git" };
  const edition = options.dateDEdition;
  if (edition) return { date: edition, provenance: "édition" };
  return { date: undefined, provenance: undefined };
}

// Digest chronologique de l'évolution du document — seulement les principes portant une date
// explicite, triés du plus ancien au plus récent (jamais l'ordre d'apparition dans le fichier, qui
// suit la numérotation des Parties/sections, pas la chronologie réelle d'ajout).
// `avecGit` (2026-09-22, tâche #196) : par défaut le digest interroge l'historique réel pour les
// principes sans date déclarée — sans quoi il ne racontait l'histoire que de 2 principes sur 19.
// Désactivable (`avecGit: false`) pour les tests, qui ne doivent jamais dépendre de l'état du dépôt.
export function buildEvolutionDigest(principles, { avecGit = true, shImpl = sh, dateDEdition: edition } = {}) {
  return principles
    .map((p) => {
      const r = avecGit ? principleDate(p, { shImpl, dateDEdition: edition }) : { date: extractPrincipleDate(p), provenance: extractPrincipleDate(p) ? "déclarée" : undefined };
      return { ...p, date: r.date, provenance: r.provenance };
    })
    .filter((p) => p.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => `${p.date} — ${p.partie}.${p.numero} ${p.titre}`);
}

// LES DEUX MARQUEURS DE POLARITÉ VIVENT DÉSORMAIS DANS LE SOL PARTAGÉ (2026-09-28, tâche #1057).
// Le croisement process ↔ règles de travail d'Abraham a besoin exactement de la même lecture — un
// « jamais » face à un « toujours » sur le même terrain — et la recopier chez lui aurait créé la
// dette que le commentaire de SEUIL_JACCARD_STRICT décrit dix lignes plus bas : deux valeurs qui
// peuvent diverger sans que rien ne le signale. La seule protection est que les deux lisent la
// MÊME constante (Article 24).
const NEGATION_MARKER = MARQUEUR_NEGATION;
const ABSOLUTE_MARKER = MARQUEUR_ABSOLU;

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

// LE DÉNOMINATEUR DU ZÉRO (2026-09-25, tâche #836 — instruction de la tâche #207 : « THE-KING :
// vérifier qu'il détecte réellement quelque chose »).
//
// LA QUESTION POSÉE ÉTAIT LA BONNE, et la réponse est rassurante pour une fois : lancé sur une
// paire fabriquée exprès (même vocabulaire, polarités opposées), le détecteur la trouve à 0,889.
// **Il n'est pas aveugle.** Sur le vrai document, zéro tension au seuil strict est donc un zéro
// MÉRITÉ, pas un silence — et l'avoir prouvé plutôt que supposé est tout l'objet de cette tâche.
//
// CE QUI MANQUAIT QUAND MÊME : ce zéro était rendu SANS SON DÉNOMINATEUR. « Aucune détectée » ne
// disait ni combien de paires avaient été comparées, ni à quelle distance se trouvait la plus
// proche. Un lecteur ne pouvait pas distinguer « 171 paires examinées, la plus proche à 0,12 du
// seuil » de « rien n'a pu être comparé » — la même phrase pour deux situations opposées, encore.
//
// SA LIMITE, INCHANGÉE ET REDITE : le vocabulaire partagé est un SIGNAL, jamais une contradiction
// prouvée. Deux principes peuvent se contredire avec des mots entièrement différents, et cette
// mesure-là ne les verra jamais.
export function mesureDesTensions(principles, { threshold = SEUIL_JACCARD_STRICT } = {}) {
  if (!Array.isArray(principles) || principles.length < 2) {
    return { mesurable: false, pourquoi: "moins de deux principes extraits : aucune paire à comparer, ce qui n'est pas la même chose que « aucune tension »" };
  }
  const wordSets = principles.map((p) => new Set(significantWords(p.texte).filter((w) => w.length > 4)));
  const pairesPossibles = (principles.length * (principles.length - 1)) / 2;
  // La paire la plus proche, MÊME sous le seuil : c'est elle qui rend le zéro lisible.
  let plusProche = null;
  for (const { i, j, jaccard } of pairesParJaccard(wordSets, { seuil: 0 })) {
    if (!plusProche || jaccard > plusProche.jaccard) {
      plusProche = { a: `${principles[i].partie}.${principles[i].numero}`, b: `${principles[j].partie}.${principles[j].numero}`, jaccard: Math.round(jaccard * 1000) / 1000 };
    }
  }
  return {
    mesurable: true,
    tensions: findPossibleTensions(principles, { threshold }),
    principes: principles.length, pairesPossibles, seuil: threshold, plusProche,
    horsPortee: "Le vocabulaire partagé est un SIGNAL, jamais une contradiction prouvée : deux principes peuvent se contredire avec des mots entièrement différents, et cette mesure ne les verra jamais.",
  };
}

export function formatMesureTensionsLines(m) {
  if (!m?.mesurable) return [`⚖️  Tensions : PAS MESURÉ — ${m?.pourquoi ?? "aucune donnée"}`];
  const L = [];
  if (m.tensions.length) {
    L.push(`⚖️  Tensions POSSIBLES : ${m.tensions.length} à relire humainement, sur ${m.pairesPossibles} paire(s) comparée(s) (seuil ${m.seuil}).`);
    for (const t of m.tensions) L.push(`   ${t.a} ↔ ${t.b} (vocabulaire partagé ${t.jaccard}) — un SIGNAL, jamais une contradiction prouvée.`);
  } else {
    L.push(`⚖️  Tensions POSSIBLES : aucune, sur ${m.pairesPossibles} paire(s) réellement comparée(s) entre ${m.principes} principes (seuil ${m.seuil}).`);
    if (m.plusProche) L.push(`   La paire la plus proche reste ${m.plusProche.a} ↔ ${m.plusProche.b} à ${m.plusProche.jaccard} — le zéro est donc mérité, pas un silence.`);
  }
  L.push(`   HORS PORTÉE : ${m.horsPortee}`);
  return L;
}

// Fraîcheur : jamais un auto-edit ni une proposition de texte (calibrage explicite), seulement le
// nombre de jours depuis la dernière modification réelle — réutilise lastTouchDays() de
// CLEAN-DIRTY-OLD, jamais un second calcul divergent. `undefined` honnête si le fichier n'a jamais
// été commité (cas théorique, jamais rencontré en pratique sur ce projet).
export function philosophyFreshnessDays({ chemin = PHILOSOPHY_PATH } = {}) {
  return lastTouchDays(chemin);
}

// shouldSnapshotPhilosophy() DÉPLACÉE dans lib-shell.mjs le 2026-09-22 sous le nom générique
// shouldSnapshotText() — un second appelant réel est apparu le même soir (la snapshot CLAUDE.md de
// claude-md-weight-signal, cf. circle-tasks.mjs), jamais un second calcul divergent (Article 3).

// ─────────────────────────────────────────────────────────────────────────────
// L'ALIGNEMENT EN CASCADE — chaque objet déclare le parent dont il découle
// (2026-09-29, tâche #1148)
//
// SA CONSIGNE, DONNÉE AVANT D'ALLER DORMIR : « reste dans le modèle en cascade de la stratégie
// globale qui dépend de philo et politique (alignés), et qui inclut des stratégies **alignées**, qui
// génèrent des stratégies de chantier **alignées**, des outils **alignés**, ****tout**** est aligné
// […] dès que tu commences à créer, il faut que cet axe ***habite*** ton travail. »
//
// POURQUOI ÇA VIT CHEZ THE-KING ET NULLE PART AILLEURS : il est déjà le veilleur du document qui est
// la RACINE de cette cascade, et l'utilisateur l'a lui-même désigné comme porteur de la stratégie
// globale — en tranchant, le 2026-09-28, qu'il VÉRIFIE et ALERTE sans jamais décider. Construire un
// outil à côté aurait créé une seconde autorité sur le même terrain (Article 31 : on étend).
//
// UN MOT NE FAIT PAS UN ALIGNEMENT. Tant que rien ne peut CONSTATER une incohérence, « aligné »
// reste une intention — et une intention n'a jamais empêché quoi que ce soit (leçon L2). Ce qui
// suit est le mécanisme minimal qui rend le mot vérifiable.
//
// CE QUI EST DÉLIBÉRÉMENT ABSENT, ET C'EST LA LEÇON L4 : la déclaration n'est PAS rendue obligatoire
// d'un coup. Des centaines de documents existent, écrits avant que cette règle existe ; les accuser
// tous au premier passage rendrait le signal illisible le jour même de sa naissance, et un garde-fou
// qui accuse à tort cesse d'être lu. L'outil rend donc une COUVERTURE qui progresse, et ne compte
// comme ÉCARTS que les deux cas qui sont fautifs quel que soit leur âge :
//   · un parent DÉCLARÉ QUI N'EXISTE PAS — une référence morte ressemble à un lien, ce qui est pire
//     qu'une absence (même doctrine que checkActionChain(), Article 28) ;
//   · un CYCLE — A découle de B qui découle de A. Sans cette détection, la remontée boucle, et une
//     cascade circulaire est précisément l'incohérence globale qu'il redoute.

// LA DÉCLARATION EST VISIBLE, jamais un commentaire HTML caché. Ces documents sont lus par un humain
// qui n'est pas développeur : une ligne qu'il voit est une ligne qu'il peut corriger. La forme en
// commentaire reste acceptée pour les fichiers de code, où une ligne visible n'existe pas.
// LA PRÉCISION QUI SUIT LE CHEMIN EST TOLÉRÉE (2026-10-02, tâche #1439) — « `…/lecons.md`, leçon
// L47 » est la forme la plus naturelle en français, et le motif la refusait. Un document
// parfaitement déclaré ressortait ORPHELIN, c'est-à-dire accusé de n'avoir rien déclaré du tout :
// le pire des deux faux verdicts possibles, puisqu'il désigne une négligence là où il y a eu du
// soin. La précision est acceptée APRÈS le backtick fermant, jamais à l'intérieur du chemin.
//
// ET ELLE EXIGE UNE VIRGULE SUIVIE D'UN ESPACE, jamais une ponctuation quelconque — le premier
// essai acceptait n'importe quel séparateur, et le point de « .md » en était un : la capture
// paresseuse s'arrêtait à « a/b » et les soixante-sept chaînes du dépôt sont devenues
// « PARENT_INTROUVABLE » d'un coup. Une correction qui casse tout vaut mieux qu'une correction
// qui casse un cas sur dix, parce qu'elle se voit ; celle-ci se voyait, et la contrainte
// « virgule PUIS espace » la referme sans rien rouvrir.
export const MOTIF_DECOULE_DE = /(?:^|\n)[ \t]*(?:[>*\-|#]|\/\/)*[ \t]*(?:\*\*)?D[ÉE]COULE DE\s*:?(?:\*\*)?\s*[:\s]\s*`?([^`\n<|]+?)`?\s*(?:[,;]\s[^\n|]*)?\s*(?:\||$)/im;
export const RACINE_DE_LA_CASCADE = PHILOSOPHY_PATH;

// LA CASCADE N'A PAS UNE RACINE, ELLE EN A PLUSIEURS (2026-10-02, tâche #1439) — et l'avoir cru
// faisait compter comme « interrompues » sept chaînes parfaitement saines.
//
// CE QUE LA MESURE EXIGEAIT AVANT : que tout objet remonte jusqu'au document de gouvernance. Sept
// chaînes s'arrêtaient ailleurs, et la correction évidente — leur donner un parent — aurait été
// une FALSIFICATION dans la plupart des cas :
//
//   · UNE SOURCE QU'IL DÉPOSE ne découle de rien. Elle PRÉCÈDE la cascade, elle en est l'entrée.
//     Lui déclarer un parent reviendrait à prétendre que sa demande découle de notre philosophie,
//     quand c'est l'inverse exact qui s'est produit.
//   · UNE SYNTHÈSE DE SOURCE est une lecture annotée de cette entrée : même nature, même rang.
//   · UN SECOND TEXTE QUI FAIT LOI est une racine, pas une branche. Le projet en compte six ;
//     exiger qu'ils découlent les uns des autres inventerait une hiérarchie que personne n'a
//     décidée — et sur ce sujet précis, inventer une hiérarchie entre deux lois serait grave.
//   · UN FIL DE DISCUSSION porte un sujet qu'il a ouvert ; il est un point d'entrée au même titre
//     qu'une source.
//
// CE QUI RESTE UNE VRAIE ANOMALIE, et c'est ce que la mesure doit continuer de dire : une chaîne
// qui s'arrête sur un document ORDINAIRE — ni racine, ni entrée — n'atteint effectivement aucune
// racine, et c'est un trou.
//
// LA LISTE EST MANUELLE ET ASSUMÉE (Article 24) : aucun signal mécanique ne distingue une entrée
// d'un document ordinaire, et la deviner serait pire que la déclarer. Son garde-fou est
// `findRacinesIntrouvables()` ci-dessous, qui refuse une racine déclarée qui n'existe pas.
export const RACINES_DE_LA_CASCADE = [
  { motif: /^docs\/philosophie-et-politique\.md$/, pourquoi: "le document de gouvernance : la racine principale" },
  { motif: /^CLAUDE\.md$/, pourquoi: "la charte : loi suprême du Jeu, racine et jamais branche" },
  { motif: /^docs\/loi-de-l-agence\.md$/, pourquoi: "la loi de l'Agence : second texte suprême, distinct de celui du Jeu et tranché comme tel" },
  { motif: /^docs\/manifeste-de-l-agence\.md$/, pourquoi: "troisième texte déclaré comme faisant loi" },
  { motif: /^docs\/regles-de-travail\.md$/, pourquoi: "la méthode de collaboration : elle se lit EN PLUS de la charte, jamais en dessous" },
  { motif: /^docs\/systeme-de-suivi\.md$/, pourquoi: "la structure du suivi : une obligation, pas une convention" },
  { motif: /^docs\/grand-projet\/00-sources\//, pourquoi: "ce qu'il dépose : une entrée de la cascade, jamais un produit — elle la précède" },
  { motif: /^docs\/grand-projet\/01-absorption\//, pourquoi: "lecture annotée d'une entrée : même rang que l'entrée qu'elle lit" },
  { motif: /^docs\/fils\//, pourquoi: "un fil porte un sujet qu'il a ouvert : point d'entrée au même titre qu'une source" },
  // LE REGISTRE DES LEÇONS EST UNE ENTRÉE, PAS UN PRODUIT, et la distinction n'est pas subtile :
  // une leçon s'apprend en se trompant. Elle ne se DÉDUIT d'aucune philosophie — c'est au
  // contraire elle qui en nourrit une, puisqu'elle fait partie du corpus que la révélation lit.
  // Lui déclarer un parent inverserait le sens réel de la dépendance.
  //
  // L'EXCEPTION PORTE SUR CE SEUL FICHIER, jamais sur `docs/referentiel/` entier : les fiches
  // d'outils qui vivent dans le même dossier, elles, découlent bel et bien de ce qui les
  // gouverne, et les dispenser toutes reviendrait à éteindre la mesure là où elle sert le plus.
  { motif: /^docs\/referentiel\/lecons\.md$/, pourquoi: "le registre de ce que le projet a appris en se trompant : une leçon nourrit la philosophie, elle n'en découle pas" },
];

export function estUneRacine(chemin, { racines = RACINES_DE_LA_CASCADE, racine = RACINE_DE_LA_CASCADE } = {}) {
  if (chemin === racine) return { racine: true, pourquoi: "la racine principale" };
  const t = racines.find((r) => r.motif.test(String(chemin ?? "")));
  return t ? { racine: true, pourquoi: t.pourquoi } : { racine: false };
}

// GARDE-FOU DE L'ARTICLE 24 — la liste ci-dessus nomme des chemins qu'elle ne lit pas. Un document
// qui fait loi et qui serait renommé ou retiré la rendrait fausse en silence, et la mesure
// recommencerait à compter des chaînes saines comme interrompues sans que rien ne le dise.
export function findRacinesIntrouvables({ root = ROOT, racines = RACINES_DE_LA_CASCADE, existeImpl = null } = {}) {
  const existe = existeImpl ?? ((c) => fsExists(join(root, c)));
  // Seuls les motifs qui désignent UN fichier précis sont vérifiables ; un motif de dossier
  // couvre un ensemble qui peut légitimement être vide.
  const precis = racines.filter((r) => /^\^[^(\[]*\$$/.test(r.motif.source));
  const manquants = precis
    .map((r) => ({ r, chemin: r.motif.source.replace(/^\^/, "").replace(/\$$/, "").replace(/\\\//g, "/").replace(/\\\./g, ".") }))
    .filter((x) => !existe(x.chemin));
  return { mesurable: true, verifies: precis.length, manquants: manquants.map((x) => x.chemin) };
}


export function parentDeclare(texte = "") {
  const m = MOTIF_DECOULE_DE.exec(String(texte));
  if (!m) return null;
  // LA CIBLE PEUT PORTER UNE PRÉCISION APRÈS LE CHEMIN (« …/la-cible.md §3 ») : on garde le chemin,
  // on jette le reste. Exiger un chemin nu ferait refuser la forme la plus utile — celle qui dit de
  // QUEL passage du parent l'objet découle.
  // LA PRÉCISION PEUT SUIVRE LE CHEMIN SOUS TROIS FORMES, et la troisième manquait (2026-10-02,
  // tâche #1439) : « …/la-cible.md §3 », « …/la-cible.md (son point 4) » étaient tolérées, mais
  // « …/lecons.md, leçon L47 » ne l'était pas — et c'est la forme la plus naturelle en français.
  // Un document parfaitement déclaré ressortait donc ORPHELIN, c'est-à-dire accusé de n'avoir
  // rien déclaré du tout. Le pire des deux faux verdicts possibles, puisqu'il désigne une
  // négligence là où il y a eu du soin.
  const brut = m[1].trim().replace(/\s*[§#].*$/, "").replace(/\s*\(.*$/, "").replace(/\s*,.*$/, "").trim();
  return brut || null;
}

// TROIS ÉTATS, ET LE TROISIÈME EST CELUI QUI COMPTE. « Aligné » et « orphelin » se devinent ; ce qui
// ne se devine pas, c'est une chaîne qui a l'air complète et ne mène nulle part.
// LE PARCOURS S'APPELLE `remontee` ET NON `chemin`, et ce n'est pas cosmétique : le résultat est
// fusionné dans un objet qui porte déjà `chemin` (le fichier). Nommer les deux pareil écrasait le
// chemin du document par le tableau du parcours, et le rapport annonçait alors un tableau à la
// place d'un nom de fichier — trouvé par le contre-test, jamais en relisant la ligne.
export function remonterLaCascade(chemin, parents, { racine = RACINE_DE_LA_CASCADE, existe = null } = {}) {
  const vus = [];
  let courant = chemin;
  while (courant) {
    if (vus.includes(courant)) return { etat: "CYCLE", remontee: [...vus, courant], pourquoi: `la remontée boucle sur ${courant} : une cascade circulaire ne mène à aucune racine, et elle boucle sans fin pour qui la lit` };
    vus.push(courant);
    if (courant === racine) return { etat: "ALIGNE", remontee: vus, pourquoi: `remonte jusqu'à ${racine} en ${vus.length - 1} saut(s)` };
    // UNE AUTRE RACINE DÉCLARÉE TERMINE AUSSI LA CHAÎNE, et ne la termine qu'à partir du second
    // maillon : un objet qui EST une racine n'a pas à remonter, mais un objet ORPHELIN qui se
    // trouverait dans un dossier d'entrées ne doit pas passer pour aligné sans rien déclarer.
    if (vus.length > 1) {
      const r = estUneRacine(courant, { racine });
      if (r.racine) return { etat: "ALIGNE", remontee: vus, pourquoi: `remonte jusqu'à ${courant} en ${vus.length - 1} saut(s) — ${r.pourquoi}` };
    }
    const suivant = parents.get(courant) ?? null;
    if (suivant === null) {
      return vus.length === 1
        ? { etat: "ORPHELIN", remontee: vus, pourquoi: "aucun parent déclaré : rien ne dit de quoi cet objet découle" }
        : { etat: "INTERROMPU", remontee: vus, pourquoi: `la chaîne s'arrête à ${courant}, qui ne déclare aucun parent — elle n'atteint donc jamais la racine` };
    }
    if (existe && !existe(suivant)) return { etat: "PARENT_INTROUVABLE", remontee: [...vus, suivant], pourquoi: `${courant} déclare découler de ${suivant}, qui n'existe pas — une référence morte ressemble à un lien, ce qui est pire qu'une absence` };
    courant = suivant;
  }
  return { etat: "ORPHELIN", remontee: vus, pourquoi: "aucun parent déclaré" };
}

export const POPULATIONS_ALIGNABLES = [
  { cle: "strategies", dossier: "docs/strategies", quoi: "les stratégies" },
  { cle: "plans", dossier: "docs/plans", quoi: "les plans de chantier" },
  { cle: "grand-projet", dossier: "docs/grand-projet/02-strategie", quoi: "la stratégie du grand changement" },
  { cle: "grand-projet-plan", dossier: "docs/grand-projet/03-plan-daction", quoi: "le plan d'action du grand changement" },
];

export function mesurerLAlignement({ populations = POPULATIONS_ALIGNABLES, root = ROOT, racine = RACINE_DE_LA_CASCADE, lireImpl = null, listerImpl = null } = {}) {
  const fsLire = lireImpl ?? ((c) => readFileSync(join(root, c), "utf8"));
  const lister = listerImpl ?? ((d) => (fsExists(join(root, d))
    ? fsReaddir(join(root, d)).filter((f) => f.endsWith(".md") && f !== "index.md").map((f) => `${d}/${f}`)
    : []));
  const objets = [];
  for (const pop of populations) {
    let fichiers = [];
    try { fichiers = lister(pop.dossier); } catch { continue; }
    for (const chemin of fichiers) {
      let texte = "";
      try { texte = fsLire(chemin); } catch { continue; }
      objets.push({ chemin, population: pop.cle, quoi: pop.quoi, parent: parentDeclare(texte) });
    }
  }
  if (!objets.length) {
    return { mesurable: false, pourquoi: "aucun objet lu dans les populations déclarées : ce zéro dit qu'on n'a rien pu lire, jamais que tout est aligné" };
  }
  const parents = new Map(objets.filter((o) => o.parent).map((o) => [o.chemin, o.parent]));
  const connus = new Set([...objets.map((o) => o.chemin), racine]);
  const existe = (c) => connus.has(c) || (() => { try { fsLire(c); return true; } catch { return false; } })();

  for (const o of objets) Object.assign(o, remonterLaCascade(o.chemin, parents, { racine, existe }));
  const parEtat = {};
  for (const o of objets) (parEtat[o.etat] ??= []).push(o);
  const alignes = (parEtat.ALIGNE ?? []).length;
  // LES ÉCARTS SONT LES DEUX SEULS CAS FAUTIFS QUEL QUE SOIT L'ÂGE DE L'OBJET (voir l'en-tête).
  const ecarts = [...(parEtat.PARENT_INTROUVABLE ?? []), ...(parEtat.CYCLE ?? [])];
  return {
    mesurable: true, objets, parEtat, ecarts, racine,
    total: objets.length, alignes,
    couverture: Math.round((alignes / objets.length) * 100),
    pourquoi: `${alignes}/${objets.length} objet(s) remontent jusqu'à ${racine} · ${ecarts.length} écart(s) fautif(s) quel que soit leur âge`,
  };
}

export function formatAlignementLines(a, { limite = 12 } = {}) {
  if (!a?.mesurable) return ["=== ALIGNEMENT EN CASCADE : PAS MESURÉ ===", `  ${a?.pourquoi}`, "", "  Ce n'est PAS « tout est aligné »."];
  const L = [`=== ALIGNEMENT EN CASCADE — ${a.couverture} % des objets remontent jusqu'à la racine ===`, "", `  ${a.pourquoi}`, ""];
  if (a.ecarts.length) {
    L.push(`  🚨 ${a.ecarts.length} ÉCART(S) — fautifs quel que soit l'âge de l'objet :`);
    for (const e of a.ecarts.slice(0, limite)) { L.push(`     ${e.chemin}`); L.push(`        ${e.pourquoi}`); }
    L.push("");
  } else {
    L.push("  ✅ Aucun parent déclaré introuvable, aucun cycle. Ce que ça dit exactement : aucune chaîne ne");
    L.push("     FAIT SEMBLANT de remonter quelque part. Ce que ça NE dit PAS : que tout le monde déclare.");
    L.push("");
  }
  for (const etat of ["ORPHELIN", "INTERROMPU", "ALIGNE"]) {
    const g = a.parEtat[etat] ?? [];
    if (!g.length) continue;
    const icone = { ORPHELIN: "⚪", INTERROMPU: "🟠", ALIGNE: "✅" }[etat];
    L.push(`  ${icone} ${etat} — ${g.length}`);
    for (const o of g.slice(0, etat === "ALIGNE" ? 3 : limite)) L.push(`     ${o.chemin}${etat === "ALIGNE" ? ` — ${o.pourquoi}` : ""}`);
    if (g.length > (etat === "ALIGNE" ? 3 : limite)) L.push(`     … et ${g.length - (etat === "ALIGNE" ? 3 : limite)} autre(s)`);
    L.push("");
  }
  L.push("  UN ORPHELIN N'EST PAS UNE FAUTE, et c'est délibéré : des centaines de documents ont été écrits");
  L.push("  avant que cette règle existe, et les accuser tous rendrait le signal illisible le jour de sa");
  L.push("  naissance (leçon L4). La couverture est un progrès à faire monter, jamais une dette à solder.");
  L.push(`  POUR DÉCLARER : une ligne visible « **DÉCOULE DE :** \`chemin/du/parent.md\` §x » dans le document.`);
  return L;
}


// ============================================================================
// LA RÉVÉLATION DE LA PHILOSOPHIE (tâche #1418, 2026-10-01)
//
// POURQUOI ÇA VIT DANS THE-KING ET PAS DANS UN OUTIL DE PLUS : son métier déclaré depuis le
// 2026-09-21 est de veiller sur le texte fondateur et d'en tenir l'histoire. Révéler ce que ce
// texte NE DIT PAS ENCORE est le même métier pris par l'autre bout — pas un métier nouveau
// (Article 31 : on étend avant de construire).
//
// LA DEMANDE QUI L'A FAIT NAÎTRE, dans ses mots : « essaie de reunir les 2 bouts : partir d'une
// feuille blanche et rediger la philo à partir des methodes decrites dans les docs git, et partir
// AUSSI de TOUT l'existant [...] pour REVELER la PHILOSOPHIE INAVOUEE de ce projet ». Et, juste
// avant, le refus qui l'a provoquée : « la philo est a REVELER de l'ensemble de notre travail, pas
// de reponses isolées qui sont des jets ».
//
// LES DEUX BOUTS, ET POURQUOI AUCUN NE SUFFIT SEUL :
//   · le bout FEUILLE BLANCHE est son cadre à lui (5 familles pour la philosophie, 9 pour la
//     politique, le test des 5 impossibles). Seul, il produit un questionnaire — donc des jets.
//   · le bout EXISTANT est le corpus réel. Seul, il produit une liste sans forme, impossible à
//     fusionner avec la philosophie d'un autre projet.
//   LA FUSION est couvertureDuCadre() : chaque case du cadre standard est remplie par ce que le
//   corpus PROUVE déjà, et une case vide devient une vraie question — jamais une case remplie au
//   jugé.
// ============================================================================

// LES TROIS NIVEAUX — ils ne sont pas inventés ici : ce sont EXACTEMENT ceux de ses trois objectifs
// ultimes, validés le 2026-09-30 à 23h31 (PROJET · AGENCE · JEU). Sa demande du 2026-10-01 est que
// la philosophie hérite enfin du découpage que l'étage du dessus porte déjà, sans quoi le document
// n'est ni exportable ni fusionnable avec la philosophie d'un autre projet.
//
// POURQUOI UN NIVEAU « INDÉTERMINÉ » EXISTE, ET POURQUOI IL NE SE REPLIE PAS SUR PROJET : une
// conviction qui ne porte aucun marqueur n'est pas « générale », elle est NON CLASSÉE. Les
// confondre transformerait une absence de mesure en mesure — exactement la faute que ce projet
// corrige partout ailleurs (leçons L5 et L11).
export const MARQUEURS_DE_NIVEAU = {
  jeu: ["lia", "noé", "noe", "visiteur", "observateur", "personnage", "personnages", "réplique", "répliques",
        "dialogue", "dialogues", "maison", "enquête", "jauge", "jauges", "pensée", "rêve", "joueur", "narratif",
        "gemini", "ton"],
  agence: ["outil", "outils", "script", "scripts", "rapport", "rapports", "registre", "registres", "blueprint",
           "export", "exportable", "gardien", "gardiens", "commit", "suivi", "kpi", "dépôt", "tâche", "tâches",
           "agence", "outillage", "test", "tests", "fonction", "code"],
};

export function classerParNiveau(texte, { marqueurs = MARQUEURS_DE_NIVEAU } = {}) {
  const bas = String(texte ?? "").toLowerCase();
  const mots = new Set(significantWords(String(texte ?? "")));
  const touche = (liste) => liste.filter((m) => mots.has(m) || bas.includes(m));
  const indicesJeu = touche(marqueurs.jeu);
  const indicesAgence = touche(marqueurs.agence);
  if (indicesJeu.length && indicesAgence.length) return { niveau: "projet", indicesJeu, indicesAgence };
  if (indicesJeu.length) return { niveau: "jeu", indicesJeu, indicesAgence };
  if (indicesAgence.length) return { niveau: "agence", indicesJeu, indicesAgence };
  return { niveau: "indetermine", indicesJeu, indicesAgence };
}

// LE CADRE STANDARD — 19 familles, et c'est une LISTE MANUELLE ASSUMÉE au sens de l'Article 24 :
// elle recopie la structure d'un document SOURCE qu'il a écrit et que nous ne modifions jamais.
// C'est pourquoi elle ne va JAMAIS sans son garde-fou, findFamillesDivergingFromSource() — sans
// lui, elle se périmerait en silence le jour où il réécrit son cadre, et personne ne le saurait.
export const CADRE_SOURCE = "docs/grand-projet/00-sources/02-documents-prepares/texte/PHILOSOPHIE_ET_POLITIQUE.md";

export const CADRE_FAMILLES = [
  { cle: "raison-d-etre",      bloc: "philosophie", titre: "Raison d'être",         ancre: "Raison d'être",         mots: ["exister", "existe", "raison", "problème", "résoudre", "valeur", "but", "objectif", "pourquoi"] },
  { cle: "valeurs",            bloc: "philosophie", titre: "Valeurs",               ancre: "Valeurs",               mots: ["valeur", "valeurs", "sacrifier", "encouragé", "refusé", "comportement", "esprit"] },
  { cle: "principes-decision", bloc: "philosophie", titre: "Principes de décision", ancre: "Principes de décision", mots: ["choisir", "arbitrer", "arbitrage", "prime", "priorité", "conflit", "rapidité", "qualité", "sécurité", "innovation", "simplicité", "trancher"] },
  { cle: "vision-acteurs",     bloc: "philosophie", titre: "Vision des acteurs",    ancre: "Vision des acteurs",    mots: ["utilisateur", "agent", "autonomie", "humain", "décision", "acteur"] },
  { cle: "gestion-risque",     bloc: "philosophie", titre: "Gestion du risque",     ancre: "Gestion du risque",     mots: ["risque", "erreur", "erreurs", "faute", "tolérance", "échec", "acceptable", "inacceptable"] },
  { cle: "gouvernance",        bloc: "politique",   titre: "Gouvernance",           ancre: "Gouvernance",           mots: ["décide", "valide", "validation", "possède", "autorité", "gouvernance"] },
  { cle: "classification",     bloc: "politique",   titre: "Classification",        ancre: "Classification",        mots: ["classer", "classification", "catégorie", "catégories", "rang", "famille", "type", "ranger"] },
  { cle: "nivellement",        bloc: "politique",   titre: "Nivellement",           ancre: "Nivèlement",            mots: ["niveau", "niveaux", "palier", "paliers", "maturité"] },
  { cle: "harmonisation",      bloc: "politique",   titre: "Harmonisation",         ancre: "Harmonisation",         mots: ["doublon", "doublons", "conflit", "source", "cohérence", "cohérent", "harmonisation", "divergence"] },
  { cle: "controle",           bloc: "politique",   titre: "Contrôle",              ancre: "Contrôle",              mots: ["contrôle", "contrôles", "vérifier", "vérification", "obligatoire", "fréquence", "seuil", "alerte"] },
  { cle: "audit",              bloc: "politique",   titre: "Audit",                 ancre: "Audit",                 mots: ["démontrer", "preuve", "preuves", "prouver", "trace", "traçable", "traçabilité", "conserver", "archive"] },
  { cle: "analyse",            bloc: "politique",   titre: "Analyse",               ancre: "Analyse",               mots: ["kpi", "indicateur", "indicateurs", "mesure", "mesurer", "mesuré", "chiffre", "chiffres"] },
  { cle: "reporting",          bloc: "politique",   titre: "Reporting",             ancre: "Reporting",             mots: ["rapport", "rapporte", "rendu", "livrer", "livrable", "signaler"] },
  { cle: "amelioration",       bloc: "politique",   titre: "Amélioration continue", ancre: "Amélioration continue", mots: ["amélioration", "améliorer", "progrès", "leçon", "leçons", "proposer", "apprendre", "apprend"] },
  { cle: "refus-absolu",       bloc: "impossibles", titre: "Ce que nous refusons absolument",   ancre: "refusons absolument",   mots: ["refuser", "refuse", "refus", "refusons", "refusé"] },
  { cle: "jamais-autorise",    bloc: "impossibles", titre: "Ce que nous n'autoriserons jamais", ancre: "autoriserons jamais",   mots: ["autoriser", "autorisé", "interdit", "interdire", "interdiction"] },
  { cle: "jamais-automatise",  bloc: "impossibles", titre: "Ce que nous n'automatiserons jamais", ancre: "automatiserons jamais", mots: ["automatiser", "automatique", "automatiquement", "manuel", "main"] },
  { cle: "jamais-delegue",     bloc: "impossibles", titre: "Ce que nous ne déléguerons jamais", ancre: "déléguerons jamais",    mots: ["déléguer", "délégation", "déléguée", "seul", "soi-même"] },
  { cle: "jamais-sacrifie",    bloc: "impossibles", titre: "Ce que nous ne sacrifierons jamais", ancre: "sacrifierons jamais",  mots: ["sacrifier", "sacrifie", "compromis", "prix"] },
];

// GARDE-FOU DE L'ARTICLE 24 — la liste ci-dessus reflète un document qu'elle ne lit pas. Si une
// famille disparaît de la source ou s'il la renomme, la liste devient une copie périmée en
// silence. Ce contrôle refuse ce silence. Il vérifie l'ANCRE et jamais le titre : un titre peut
// être reformulé ici pour la lisibilité, l'ancre est la chaîne telle qu'elle apparaît chez lui.
export function findFamillesDivergingFromSource({ root = ROOT, source = CADRE_SOURCE, familles = CADRE_FAMILLES, lireImpl = null } = {}) {
  const lire = lireImpl ?? ((c) => readFileSync(join(root, c), "utf8"));
  let texte = "";
  try { texte = lire(source); } catch {
    return { mesurable: false, ecarts: [], pourquoi: `source du cadre illisible (${source}) : ce zéro dit qu'on n'a rien pu lire, jamais que rien ne diverge` };
  }
  const bas = texte.toLowerCase();
  const ecarts = familles.filter((f) => !bas.includes(String(f.ancre).toLowerCase())).map((f) => ({ cle: f.cle, ancre: f.ancre }));
  return { mesurable: true, ecarts, total: familles.length };
}

// LE CORPUS SCANNÉ — des RACINES, jamais une liste de fichiers (Article 24 : un document normatif
// nouveau est pris en compte le jour où il est écrit, sans toucher à cette logique).
export const RACINES_DU_CORPUS = [
  { chemin: "CLAUDE.md", quoi: "la charte", zone: "charte" },
  { chemin: "docs/regles-de-travail.md", quoi: "les règles de travail", zone: "methode" },
  { chemin: "docs/xp-ia-process-detail.md", quoi: "le process d'expérience", zone: "methode" },
  { chemin: "docs/referentiel/lecons.md", quoi: "les leçons payées", zone: "lecons" },
  { dossier: "docs/referentiel", quoi: "le référentiel", zone: "referentiel" },
  // LES PROCESS — sa précision du 2026-10-01 : « les regles de travail, la charte, les process :
  // tout cet ensemble doit compris dans l'analyse ». Les documents de process vivent à la RACINE
  // de docs/, et la lecture n'est pas récursive : on prend donc ce niveau-là, et lui seul.
  { dossier: "docs", quoi: "les process et les architectures d'outils", zone: "process" },
  // LES DONNÉES DÉRIVÉES — sa seconde précision : « il y a beaucoup de données derivées : certaines
  // sont peut etre exploitables ». Celles-ci le sont, et pour une raison précise : elles portent les
  // décisions RÉELLEMENT prises, jamais les règles déclarées. Une philosophie se lit mieux dans ce
  // qu'on a tranché que dans ce qu'on a promis.
  //
  // POURQUOI CHACUNE EST UNE ZONE À PART ENTIÈRE, et c'est ce qui les rend inoffensives : le suivi
  // pèse à lui seul plus de lignes que tout le reste du corpus. Compté en FICHIERS il écraserait
  // tout ; compté en ZONE il ne vaut qu'un sur six. C'est exactement ce que la maille « zone »
  // existe pour empêcher.
  { dossier: "docs/suivi/sessions", quoi: "les décisions réellement prises", zone: "decisions" },
  { dossier: "docs/strategies", quoi: "les stratégies de domaine", zone: "strategie" },
  // LA STRATÉGIE DU GRAND CHANTIER (2026-10-02, tâche #1437) — ajoutée après un écart réel et
  // coûteux. Ce dossier portait depuis le 2026-09-29 un document répondant aux CINQ IMPOSSIBLES,
  // chacun avec son porteur mécanique ; la révélation du 2026-10-01 ne le lisait pas, et a donc
  // déclaré « vide » une case que le projet avait déjà remplie avec plus de rigueur que ce que
  // j'allais y écrire.
  //
  // CE QUE L'ÉCART ENSEIGNE, ET IL VAUT AU-DELÀ DE CE DOSSIER : un corpus de révélation se définit
  // par ce que les documents FONT, jamais par l'endroit où ils sont rangés. Un document de
  // stratégie rangé sous un chantier reste un document de stratégie.
  { dossier: "docs/grand-projet/02-strategie", quoi: "la stratégie du grand chantier", zone: "strategie" },
  { dossier: "docs/fils", quoi: "les fils de discussion — ce qui a été tranché, sujet par sujet", zone: "decisions" },
  { dossier: "scripts", quoi: "le POURQUOI écrit à côté du code", zone: "outils", ext: ".mjs", enTeteSeulement: true },
];

// LE DISCRIMINANT QUI A TOUT CHANGÉ — et il a fallu une troisième mesure pour le trouver.
//
// Les deux premières mécaniques échouaient pour la même raison de fond : elles comptaient des
// FICHIERS, et le référentiel tient un fichier par outil. Une tournure technique répétée dans
// quatre fiches d'outils ressortait donc au même rang qu'une conviction du projet.
//
// LA ZONE EST LA BONNE MAILLE. Une idée qui apparaît dans la charte, DANS une leçon payée ET dans
// le raisonnement écrit à côté d'un outil a traversé trois contextes d'écriture indépendants, à
// des semaines d'intervalle, sous trois plumes de circonstance différentes. Ce n'est plus une
// tournure : c'est une croyance. Quatre fiches d'outils, elles, ne font qu'une seule zone.
export function zoneDuFichier(chemin, { racines = RACINES_DU_CORPUS } = {}) {
  const c = String(chemin ?? "");
  const exact = racines.find((r) => r.chemin === c);
  if (exact) return exact.zone;
  const dossier = racines.filter((r) => r.dossier).sort((a, b) => b.dossier.length - a.dossier.length)
    .find((r) => c.startsWith(r.dossier + "/"));
  return dossier ? dossier.zone : "autre";
}

// LE COMMENTAIRE DE TÊTE D'UN OUTIL — ce projet y écrit le POURQUOI à côté du QUOI (Article 27),
// donc c'est là que vit la part la plus sincère de sa philosophie : celle qu'on écrit pour se
// justifier soi-même, jamais pour une vitrine. On ne lit QUE l'en-tête : le corps d'un script
// contient des chaînes de caractères qui imitent des convictions sans en être.
export function enTeteDUnOutil(texte) {
  const lignes = String(texte ?? "").split("\n");
  const out = [];
  for (const l of lignes) {
    if (l.startsWith("//")) { out.push(l.replace(/^\/\/\s?/, "")); continue; }
    if (!l.trim()) { if (out.length) out.push(""); continue; }
    break;
  }
  return out.join("\n");
}

// UNE CONVICTION, ET COMMENT ON LA RECONNAÎT MÉCANIQUEMENT.
//
// Ce projet écrit ses convictions sous une forme remarquablement stable : « X, jamais Y » et
// « toujours X ». Les deux marqueurs existaient déjà dans lib-shell (MARQUEUR_NEGATION,
// MARQUEUR_ABSOLU) où ils servaient à détecter une POLARITÉ ; ils servent ici à détecter une
// AFFIRMATION DE VALEUR. Rien de neuf n'a été inventé pour ça, et c'est voulu : un marqueur de
// plus aurait été un marqueur à tenir à jour en double.
//
// LES BORNES DE LONGUEUR SONT DÉRIVÉES, PAS CHOISIES (BP5) : en dessous de 40 caractères on
// ramasse des fragments de titre (« jamais recopiée »), au-dessus de 400 un paragraphe entier qui
// porte trois idées à la fois. Les deux valeurs sont réimprimées à chaque passage avec la
// distribution réelle, pour qu'un corpus qui change les fasse bouger au lieu de les laisser mentir.
export const BORNE_CONVICTION_MIN = 40;
export const BORNE_CONVICTION_MAX = 400;

// LES DÉCISIONS LES PLUS FERMES SONT LES PLUS BRIÈVEMENT ÉCRITES (2026-10-02, tâche #1438).
//
// LE DÉFAUT EST STRUCTUREL, ET SON SENS EST INVERSÉ. L'extraction en prose n'accepte qu'une phrase
// d'au moins quarante caractères portant un marqueur de polarité. Or les décisions les plus
// arrêtées de ce projet sont écrites en TITRES DE SECTION et en LIGNES DE TABLEAU : courtes, donc
// sous la borne basse ; affirmatives, donc souvent sans marqueur. **Plus c'est décidé, moins c'est
// vu** — exactement l'inverse de ce qu'on attend d'une révélation.
//
// CE QUI SÉPARE UN TABLEAU DE CONVICTIONS D'UN TABLEAU DE DONNÉES, et c'est MESURÉ plutôt que
// deviné : la première colonne. Un tableau de convictions l'emplit de PHRASES ; un tableau de
// données y met des valeurs courtes — un nom d'outil, un chiffre, une date. On prend donc la
// médiane de longueur de la première cellule SUR CHAQUE TABLEAU, et un tableau dont la médiane
// reste sous le plancher est laissé intact. Le contre-test en est la moitié qui prouve quelque
// chose : sans lui, une sonde qui avale tous les tableaux rendrait du bruit à la place d'un signal.
export const PLANCHER_PREMIERE_CELLULE = 25;
export const BORNE_TITRE_MIN = 18;

// UN TITRE DIT SA POLARITÉ AVEC D'AUTRES MOTS QUE LA PROSE, et c'est mesuré plutôt que supposé :
// sur les cinq impossibles, quatre titres portent « jamais » et le cinquième dit « REFUSONS
// ABSOLUMENT ». Les marqueurs partagés du dépôt ne connaissent que « jamais » et « toujours ».
// POURQUOI NE PAS LES ÉLARGIR LÀ-BAS : ils sont lus par plusieurs outils et servent à filtrer de
// la PROSE, où « absolument » et « obligatoire » sont des mots courants qui ne décident de rien.
// Sur un TITRE la densité est inverse — un titre est court, choisi, et n'emploie pas ces mots par
// hasard. Le jeu élargi reste donc LOCAL aux titres, et la raison est écrite plutôt que devinée
// par le prochain qui voudra « harmoniser » les deux (Article 19 pris par l'autre bout).
export const MARQUEUR_DE_TITRE = /\b(jamais|toujours|absolument|interdit|interdite|obligatoire|refusons|refuse|sacrifier|sacrifierons|déléguerons|automatiserons|autoriserons)\b/i;

export function tableauxDUnTexte(texte = "") {
  const lignes = String(texte).split("\n");
  const tableaux = []; let courant = [];
  for (const L of lignes) {
    const l = L.trim();
    if (l.startsWith("|") && l.endsWith("|") && l.length > 2) { courant.push(l); continue; }
    if (courant.length) { tableaux.push(courant); courant = []; }
  }
  if (courant.length) tableaux.push(courant);
  return tableaux;
}

export function estUnTableauDeConvictions(lignes = [], { plancher = PLANCHER_PREMIERE_CELLULE } = {}) {
  const corps = lignes.filter((l) => !/^\|[\s|:-]+\|$/.test(l)).slice(1); // on saute l'en-tête
  if (corps.length < 2) return { oui: false, pourquoi: "moins de deux lignes de corps : trop peu pour mesurer quoi que ce soit", medianePremiere: 0, lignes: corps.length };
  const premieres = corps.map((l) => l.split("|").slice(1, -1)[0]?.replace(/[*`]/g, "").trim() ?? "").map((c) => c.length).sort((a, b) => a - b);
  const mediane = premieres[Math.floor(premieres.length / 2)];
  return { oui: mediane >= plancher, pourquoi: mediane >= plancher
    ? `première colonne faite de phrases (médiane ${mediane} caractères)`
    : `première colonne faite de valeurs courtes (médiane ${mediane} caractères, plancher ${plancher}) — c'est un tableau de DONNÉES, laissé intact`,
    medianePremiere: mediane, lignes: corps.length };
}

export function extraireDesTableaux(texte = "", { chemin = "", max = BORNE_CONVICTION_MAX, plancher = PLANCHER_PREMIERE_CELLULE } = {}) {
  const out = [];
  for (const lignes of tableauxDUnTexte(texte)) {
    const verdict = estUnTableauDeConvictions(lignes, { plancher });
    if (!verdict.oui) continue;
    const corps = lignes.filter((l) => !/^\|[\s|:-]+\|$/.test(l)).slice(1);
    for (const l of corps) {
      const cells = l.split("|").slice(1, -1).map((c) => c.replace(/\*\*/g, "").replace(/\s+/g, " ").trim());
      const enonce = (cells[0] ?? "").replace(/^[*`\s]+|[*`\s]+$/g, "");
      if (enonce.length < plancher || enonce.length > max) continue;
      // LA LIGNE ENTIÈRE EST LA CONVICTION, pas sa seule première cellule : dans ce dépôt, la
      // colonne de droite porte le PORTEUR — l'Article, la leçon ou le mécanisme qui la fait
      // tenir — et c'est précisément ce que la révélation doit retrouver. Les séparer rendrait
      // une conviction sans sa preuve, ce que ce projet refuse partout ailleurs.
      const reste = cells.slice(1).filter(Boolean).join(" · ");
      const phrase = reste ? `${enonce} — ${reste}` : enonce;
      out.push({ phrase: phrase.slice(0, max), chemin, polarite: MARQUEUR_NEGATION.test(phrase) ? "jamais" : "toujours", source: "tableau" });
    }
  }
  return out;
}

export function extraireDesTitres(texte = "", { chemin = "", min = BORNE_TITRE_MIN, max = BORNE_CONVICTION_MAX } = {}) {
  const out = [];
  for (const m of String(texte).matchAll(/^#{2,4}\s+(.+?)\s*$/gm)) {
    const titre = m[1].replace(/[*`]/g, "").replace(/^[①②③④⑤⑥⑦⑧⑨⑩\d.\s·—-]+/, "").trim();
    if (titre.length < min || titre.length > max) continue;
    // UN TITRE NE COMPTE QUE S'IL ÉNONCE, jamais s'il nomme. « Ce que nous ne sacrifierons jamais »
    // est une décision ; « Inventaire des outils » est une étiquette. Le marqueur de polarité est
    // le seul signal fiable de la différence, et c'est pour ça qu'il reste exigé ICI alors qu'il
    // ne l'est pas sur une ligne de tableau — la ligne, elle, est déjà filtrée par son tableau.
    if (!MARQUEUR_DE_TITRE.test(titre)) continue;
    out.push({ phrase: titre, chemin, polarite: MARQUEUR_NEGATION.test(titre) ? "jamais" : "toujours", source: "titre" });
  }
  return out;
}

export function extraireConvictions(texte, { chemin = "", min = BORNE_CONVICTION_MIN, max = BORNE_CONVICTION_MAX } = {}) {
  const sansCode = String(texte ?? "").replace(/```[\s\S]*?```/g, " ");
  const phrases = sansCode.split(/(?<=[.!?:])\s+|\n{2,}|\n(?=[-*|#])/);
  const out = [];
  for (const brute of phrases) {
    const p = String(brute).replace(/\s+/g, " ").replace(/^[-*#>|\s]+/, "").trim();
    if (p.length < min || p.length > max) continue;
    if (p.endsWith("?")) continue;
    const neg = MARQUEUR_NEGATION.test(p);
    const abs = MARQUEUR_ABSOLU.test(p);
    if (!neg && !abs) continue;
    out.push({ phrase: p, chemin, polarite: neg ? "jamais" : "toujours", source: "prose" });
  }
  // LES TROIS SOURCES SE COMPLÈTENT ET NE SE RECOUVRENT PAS : la prose, les lignes de tableau, les
  // titres. Le dédoublonnage se fait sur la phrase exacte, parce qu'une même décision peut
  // légitimement figurer en titre ET dans la ligne qui la détaille — et la garder deux fois
  // gonflerait sa représentativité sans qu'elle traverse un contexte de plus.
  const vues = new Set(out.map((c) => c.phrase));
  for (const c of [...extraireDesTableaux(texte, { chemin, max }), ...extraireDesTitres(texte, { chemin, max })]) {
    if (vues.has(c.phrase)) continue;
    vues.add(c.phrase); out.push(c);
  }
  return out;
}

// DÉJÀ DANS LA BOUSSOLE ? — et pourquoi ce n'est VOLONTAIREMENT PAS du Jaccard, alors que tout le
// reste de cet outil en fait.
//
// Jaccard compare deux ensembles par intersection/union. Il a été choisi ailleurs dans ce projet
// pour ne pas favoriser les textes longs. Ici il ferait exactement l'inverse de ce qu'on veut :
// une phrase de 15 mots entièrement contenue dans un principe de 200 mots rend un Jaccard de
// 0,07 — donc « non couverte », alors qu'elle l'est intégralement. La question posée n'est pas
// « ces deux textes se ressemblent-ils ? » mais « cette idée est-elle DÉJÀ DEDANS ? », et la
// mesure juste est le TAUX DE CONTENANCE : quelle part des mots de la phrase se retrouve dans le
// principe. Écrit ici pour que personne ne « corrige » cette fonction en Jaccard par souci
// d'homogénéité (Article 19 pris par l'autre bout : la raison vit à côté du code).
export const SEUIL_CONTENANCE = 0.7;

export function tauxDeContenance(phrase, cible) {
  const mots = significantWords(String(phrase ?? ""));
  if (!mots.length) return 0;
  const dedans = new Set(significantWords(String(cible ?? "")));
  return mots.filter((m) => dedans.has(m)).length / mots.length;
}

export function dejaDansLaBoussole(phrase, unites, { seuil = SEUIL_CONTENANCE } = {}) {
  let meilleur = 0; let ou = null;
  for (const u of unites) {
    const t = tauxDeContenance(phrase, typeof u === "string" ? u : (u.texte ?? ""));
    if (t > meilleur) { meilleur = t; ou = (typeof u === "string" ? null : (u.titre ?? null)); }
  }
  return { couverte: meilleur >= seuil, taux: Number(meilleur.toFixed(2)), ou };
}


// ============================================================================
// CE QUI DISTINGUE UNE PHILOSOPHIE D'UNE RÈGLE — et c'est la mesure qui l'a imposé.
//
// PREMIÈRE MÉCANIQUE, ET SON ÉCHEC, GARDÉ ÉCRIT (Article 27). J'ai d'abord compté comme
// « inavouée » toute conviction du corpus non contenue dans la boussole. Résultat mesuré sur le
// vrai dépôt : 2 786 convictions, dont 2 762 « inavouées » — soit 99 %. Un détecteur qui accuse
// tout le monde n'accuse personne (leçon L4), et son seuil de contenance (0,70) était passé
// AU-DESSUS de toute la distribution qu'il observe (q90 = 0,44) : la faute exacte qu'un autre
// détecteur de ce dépôt avait commise le 2026-10-01. Garder ce chiffre ici évite qu'on refasse
// la même mécanique en croyant l'inventer.
//
// CE QUI RÉVÈLE VRAIMENT UNE PHILOSOPHIE : LA RÉCURRENCE À TRAVERS DES FICHIERS INDÉPENDANTS.
// Une règle énoncée une fois dans un fichier est une règle. Une conviction redite dans quinze
// fichiers différents, par des outils différents, avec des mots différents, est une CROYANCE du
// projet — et personne ne l'a jamais décidée, c'est ça qui la rend inavouée. L'étendue (le nombre
// de fichiers DISTINCTS qu'un groupe traverse) est donc la mesure, jamais le nombre d'occurrences
// (vingt occurrences dans un seul fichier ne sont qu'un fichier bavard).
// ============================================================================

export const SEUIL_GROUPE = 0.34; // similarité de Jaccard entre deux convictions d'un même groupe

// grouperConvictions() — regroupement glouton par similarité de Jaccard.
//
// JACCARD EST LE BON OUTIL ICI, là où il était le mauvais pour dejaDansLaBoussole() : on compare
// deux phrases de longueur comparable, pas une phrase à un paragraphe. Les deux fonctions voisines
// utilisent donc deux mesures différentes, et c'est délibéré — l'uniformiser casserait l'une des
// deux.
export function grouperConvictions(convictions, { seuil = SEUIL_GROUPE } = {}) {
  const prepa = convictions.map((c) => ({ ...c, mots: new Set(significantWords(c.phrase)) }))
    .filter((c) => c.mots.size >= 4)
    .sort((a, b) => b.mots.size - a.mots.size);
  const groupes = [];
  for (const c of prepa) {
    let place = null;
    for (const g of groupes) {
      const inter = [...c.mots].filter((m) => g.noyau.has(m)).length;
      const union = new Set([...c.mots, ...g.noyau]).size;
      if (union && inter / union >= seuil) { place = g; break; }
    }
    if (place) { place.membres.push(c); for (const m of c.mots) place.noyau.add(m); }
    else groupes.push({ noyau: new Set(c.mots), membres: [c], representant: c.phrase });
  }
  return groupes.map((g) => ({
    representant: g.representant,
    occurrences: g.membres.length,
    fichiers: [...new Set(g.membres.map((m) => m.chemin))],
    etendue: new Set(g.membres.map((m) => m.chemin)).size,
    exemples: g.membres.slice(0, 3).map((m) => ({ phrase: m.phrase, chemin: m.chemin })),
  })).sort((a, b) => b.etendue - a.etendue || b.occurrences - a.occurrences);
}

// L'ÉTENDUE MINIMALE SE DÉRIVE DE LA DISTRIBUTION, ELLE NE SE CHOISIT PAS (BP5).
// On prend le 90e centile des étendues observées : par construction il reste toujours DANS le
// nuage, donc il ne peut jamais passer au-dessus de tout ce qu'il observe — la faute corrigée
// plus haut devient structurellement impossible. Un plancher de 3 empêche seulement qu'un corpus
// minuscule rende « 1 fichier suffit ».
export function etendueMinimale(groupes, { centile = 0.9, plancher = 3 } = {}) {
  const e = groupes.map((g) => g.etendue).sort((a, b) => a - b);
  if (!e.length) return { mesurable: false, valeur: null, pourquoi: "aucun groupe : rien à dériver" };
  const v = e[Math.min(e.length - 1, Math.floor(e.length * centile))];
  return { mesurable: true, valeur: Math.max(plancher, v), brute: v, centile, observees: e.length, max: e[e.length - 1] };
}

export function familleDUneConviction(phrase, { familles = CADRE_FAMILLES } = {}) {
  const mots = new Set(significantWords(phrase));
  const bas = String(phrase).toLowerCase();
  return familles.filter((f) => f.mots.some((m) => mots.has(m) || bas.includes(m))).map((f) => f.cle);
}

// LE VOCABULAIRE DES CONVICTIONS — trois filtres, tous DÉRIVÉS du dépôt, aucun écrit à la main.
//
// DEUXIÈME MÉCANIQUE ÉCARTÉE, ET SA MESURE (Article 27 : on garde ce qui n'a pas marché).
// J'ai essayé de révéler les thèmes par collocations de mots. Sans filtre, les 25 premières paires
// étaient des mots outils du français (« deux + même », 27 fichiers). Avec un filtre de fréquence
// documentaire, elles sont devenues des NOMS D'OUTILS (« clean + dirty », « argus + harmonia ») —
// mécaniquement, puisque le référentiel tient un fichier par outil. Un nom propre n'est pas une
// conviction. D'où le troisième filtre, et surtout : d'où le fait que la couverture du cadre ne
// repose PAS sur ces paires, mais sur l'étendue en fichiers, qui s'est révélée bien plus robuste.
//
// LES NOMS D'OUTILS SE DÉRIVENT DE scripts/, JAMAIS D'UNE LISTE (Article 24) : un outil nouveau
// est écarté du vocabulaire le jour où son fichier existe, sans toucher à cette fonction.
export function motsOutils({ root = ROOT, listerImpl = null } = {}) {
  const lister = listerImpl ?? (() => (fsExists(join(root, "scripts")) ? fsReaddir(join(root, "scripts")) : []));
  const out = new Set();
  let fichiers = []; try { fichiers = lister(); } catch { return out; }
  for (const f of fichiers) {
    if (!String(f).endsWith(".mjs")) continue;
    for (const tok of String(f).replace(/\.mjs$/, "").split(/[-_.]/)) if (tok.length > 2) out.add(tok.toLowerCase());
  }
  return out;
}

export function vocabulaireDuCorpus(textes, { root = ROOT, plafondRatio = 0.4, plancher = 3, outils = null } = {}) {
  const noms = outils ?? motsOutils({ root });
  const N = textes.size ?? textes.length ?? 0;
  const df = new Map();
  for (const [, t] of textes) for (const w of new Set(significantWords(t))) df.set(w, (df.get(w) ?? 0) + 1);
  const plafond = Math.max(plancher + 1, Math.floor(N * plafondRatio));
  const retenu = new Set();
  for (const [w, n] of df) {
    if (w.length <= 3 || /^\d/.test(w) || noms.has(w)) continue;
    if (n >= plancher && n <= plafond) retenu.add(w);
  }
  return { mots: retenu, df, N, plafond, plancher, ecartesCommeOutils: [...df.keys()].filter((w) => noms.has(w)).length };
}

// couvertureDuCadre() — LA FUSION DES DEUX BOUTS, et le cœur de l'outil.
//
// Chaque case du cadre standard (le bout « feuille blanche », son cadre à lui) est remplie par ce
// que le corpus PROUVE (le bout « existant »). Une case vide n'est JAMAIS remplie au jugé : elle
// ressort comme une vraie question, et c'est le seul endroit où une question est légitime — tout
// le reste est déjà répondu par le travail, il suffisait de le lire.
//
// LA MESURE RETENUE EST L'ÉTENDUE EN FICHIERS, PAS LE NOMBRE D'OCCURRENCES. Vingt occurrences dans
// un seul fichier ne sont qu'un fichier bavard ; la même idée redite dans douze fichiers écrits à
// des semaines d'intervalle est une croyance du projet. C'est ce qui distingue une PHILOSOPHIE
// (ce qu'on croit partout) d'une RÈGLE (ce qu'on a écrit une fois).
//
// LA REPRÉSENTATIVITÉ D'UNE PHRASE se mesure de la même façon : combien de FICHIERS DISTINCTS
// contiennent une conviction qui partage au moins `recouvrement` mots avec elle. Une phrase très
// représentative est celle que le projet redit ailleurs sans le savoir — exactement l'inavoué.
export const RECOUVREMENT_MINIMAL = 3;

export function representativite(phrase, convictions, { recouvrement = RECOUVREMENT_MINIMAL, vocab = null } = {}) {
  const mots = new Set(significantWords(phrase).filter((w) => !vocab || vocab.has(w)));
  if (mots.size < recouvrement) return { fichiers: 0, zones: 0, listeZones: [], mots: mots.size };
  const vus = new Set(); const zones = new Set();
  for (const c of convictions) {
    let n = 0;
    for (const w of c.motsUtiles ?? []) if (mots.has(w) && ++n >= recouvrement) break;
    if (n >= recouvrement) { vus.add(c.chemin); zones.add(c.zone ?? "autre"); }
  }
  return { fichiers: vus.size, zones: zones.size, listeZones: [...zones], mots: mots.size };
}

// UN MOT DE CADRE QUI MATCHE PRESQUE TOUT NE CLASSE RIEN, et il faut le retirer en le DISANT
// (2026-10-02, tâche #1434). Premier passage de la révélation de la stratégie : la famille
// « renoncements » ramassait 1 740 convictions sur 1 880, soit 93 % du corpus. La cause tient en
// un mot — « jamais », présent dans 99 % des fichiers de ce dépôt, qui écrit ses règles en
// interdictions. Un mot aussi répandu ne sépare pas le corpus, il le recouvre.
// LE FILTRE EST DÉRIVÉ, JAMAIS UNE LISTE DE MOTS INTERDITS (Article 24, et le corollaire de
// l'Article 17 qui refuse justement les listes figées) : on mesure la part de convictions que
// CHAQUE mot attrape à lui seul, et on écarte ceux qui dépassent le plafond. Un mot qui devient
// envahissant demain sera écarté demain, sans qu'on touche à ce fichier.
// ET L'ÉCART SE DIT : les mots retirés sont rendus avec leur part, parce qu'un cadre amputé en
// silence rendrait des cases vides sans qu'on sache si le corpus est muet ou si le mot a sauté.
export const PART_D_UN_MOT_TROP_LARGE = 0.5;

export function cadreSansLesMotsTropLarges(familles = [], convictions = [], { plafond = PART_D_UN_MOT_TROP_LARGE } = {}) {
  if (!convictions.length) return { familles, ecartes: [], mesurable: false, pourquoi: "aucune conviction : rien à mesurer, le cadre passe tel quel" };
  const phrases = convictions.map((c) => String(c.phrase ?? c).toLowerCase());
  const ecartes = [];
  const gardees = familles.map((f) => {
    const mots = f.mots.filter((m) => {
      const part = phrases.filter((ph) => ph.includes(m)).length / phrases.length;
      if (part > plafond) { ecartes.push({ famille: f.cle, mot: m, part }); return false; }
      return true;
    });
    return { ...f, mots };
  });
  return { familles: gardees, ecartes, mesurable: true };
}

export function couvertureDuCadre({ convictions = [], unites = [], familles = CADRE_FAMILLES, vocab = null, seuilEtendue = 3, topN = 6 } = {}) {
  if (!convictions.length) {
    return { mesurable: false, cases: [], vides: [], pourquoi: "aucune conviction extraite : ce zéro dit qu'on n'a rien pu lire, jamais que le corpus est muet" };
  }
  const cases = familles.map((f) => {
    const miennes = convictions.filter((c) => c.familles.includes(f.cle));
    const fichiers = new Set(miennes.map((c) => c.chemin));
    const notees = miennes.map((c) => ({ ...c, rep: representativite(c.phrase, miennes, { vocab }) }))
      .filter((c) => c.rep.fichiers >= seuilEtendue)
      // LES ZONES D'ABORD, LES FICHIERS ENSUITE : traverser trois contextes d'écriture vaut plus
      // que revenir quatre fois dans le même (voir zoneDuFichier ci-dessus).
      .sort((a, b) => b.rep.zones - a.rep.zones || b.rep.fichiers - a.rep.fichiers || a.phrase.length - b.phrase.length);
    // DÉDOUBLONNAGE — on garde la première phrase de chaque idée, jamais six formulations d'une
    // seule. Jaccard est le bon outil ICI (deux phrases de longueur comparable), là où il serait
    // le mauvais dans dejaDansLaBoussole() ; les deux voisines utilisent donc deux mesures
    // différentes, et uniformiser casserait l'une des deux.
    const gardees = [];
    for (const c of notees) {
      const a = new Set(significantWords(c.phrase));
      const double = gardees.some((g) => {
        const b = new Set(significantWords(g.phrase));
        const inter = [...a].filter((w) => b.has(w)).length;
        return inter / new Set([...a, ...b]).size >= SEUIL_GROUPE;
      });
      if (!double) gardees.push(c);
      if (gardees.length >= topN) break;
    }
    const avecBoussole = gardees.map((c) => ({ ...c, boussole: dejaDansLaBoussole(c.phrase, unites) }));
    const parNiveau = { projet: 0, jeu: 0, agence: 0, indetermine: 0 };
    for (const c of notees) parNiveau[c.niveau] = (parNiveau[c.niveau] ?? 0) + 1;
    return {
      cle: f.cle, bloc: f.bloc, titre: f.titre,
      convictions: miennes.length, fichiers: fichiers.size, retenues: notees.length,
      parNiveau, top: avecBoussole,
      inavoues: avecBoussole.filter((c) => !c.boussole.couverte).length,
      vide: notees.length === 0,
    };
  });
  return { mesurable: true, cases, vides: cases.filter((c) => c.vide).map((c) => c.cle) };
}

// LES DÉFAUTS DE LA MATIÈRE BRUTE (2026-10-01, sa précision : « la revelation te donne la matiere
// BRUT de la philosophie, avec ses incoherences, ses defauts »).
//
// LA RÉVÉLATION N'EST PAS LA PHILOSOPHIE, C'EST LE MINERAI. Un corpus écrit sur des semaines par
// plusieurs mains de circonstance se contredit forcément quelque part, et une extraction qui rend
// une liste parfaitement lisse ment sur ce qu'elle a lu.
//
// AUCUN DÉTECTEUR NEUF N'A ÉTÉ ÉCRIT POUR ÇA, et c'est voulu : mesureDesTensions() existe depuis
// le 2026-09-21 et fait exactement ce travail — vocabulaire partagé ET polarité opposée. Elle
// l'appliquait aux principes de la boussole ; on la pointe ici sur les convictions révélées.
// Un second détecteur aurait été un second détecteur à tenir à jour (Article 24).
export function tensionsDuCorpus(convictionsRetenues, { max = 400 } = {}) {
  // DEUX FILTRES AVANT DE COMPARER, et chacun ferme un faux positif constaté en direct.
  //
  // ① LES DOUBLONS. Une conviction peut appartenir à plusieurs familles du cadre, donc figurer
  //    plusieurs fois dans la liste retenue. Comparée à elle-même elle rend un Jaccard de 1 et
  //    passe pour la tension la plus grave du corpus. Trois des seize premières l'étaient.
  // ② LES PHRASES QUI PORTENT LES DEUX MARQUEURS. Le choc de polarité n'a de sens qu'entre une
  //    phrase en « jamais » et une phrase en « toujours ». Une phrase qui dit « toujours X, jamais
  //    Y » entre en conflit avec tout le monde et avec personne. C'est la limite de l'heuristique
  //    partagée, et on la ferme ICI plutôt que dans mesureDesTensions() : sur la boussole, dont les
  //    unités sont des paragraphes entiers, la même coupe retirerait presque tous les principes.
  const vues = new Set();
  const propres = convictionsRetenues.filter((c) => {
    const k = c.phrase.trim();
    if (vues.has(k)) return false;
    vues.add(k);
    return !(MARQUEUR_NEGATION.test(k) && MARQUEUR_ABSOLU.test(k));
  });
  const unites = propres.slice(0, max).map((c, i) => ({ partie: 0, numero: i + 1, titre: c.phrase.slice(0, 70), texte: c.phrase }));
  if (unites.length < 2) return { mesurable: false, pourquoi: "moins de deux convictions retenues : aucune paire à comparer — PAS MESURÉ, jamais « aucune contradiction »" };
  const brut = mesureDesTensions(unites);
  if (!brut.mesurable) return brut;
  // mesureDesTensions() étiquette une paire « partie.numéro » — c'est ce qu'il faut pour la
  // boussole, dont les principes sont numérotés. Ici les unités sont des phrases : on remet donc
  // le texte en face de l'étiquette plutôt que de modifier la fonction partagée, qui sert ailleurs.
  const parEtiquette = new Map(unites.map((u) => [`${u.partie}.${u.numero}`, u.texte]));
  return { ...brut, tensions: brut.tensions.map((t) => ({ ...t, texteA: parEtiquette.get(t.a) ?? t.a, texteB: parEtiquette.get(t.b) ?? t.b })) };
}

// LE CADRE EST INJECTABLE DEPUIS LE 2026-10-02 (tâche #1434), et c'est ce qui permet à la MÊME
// machine de révéler autre chose qu'une philosophie. Elle ne savait faire qu'une seule révélation
// parce que son cadre était câblé, pas parce que sa mécanique était spécifique : extraire des
// convictions, les noter par représentativité, dériver un seuil de leur propre distribution et les
// confronter à un document de référence vaut pour n'importe quel corpus. Ce qui change d'une
// révélation à l'autre, ce sont TROIS choses — le corpus lu, le cadre qui dit quelles cases doivent
// être remplies, et le document auquel on compare — et toutes trois sont désormais des paramètres.
export function revelerLaPhilosophie({ root = ROOT, racines = RACINES_DU_CORPUS, chemin = PHILOSOPHY_PATH, familles = CADRE_FAMILLES, lireImpl = null, listerImpl = null, seuilEtendue = null } = {}) {
  const lire = lireImpl ?? ((c) => readFileSync(join(root, c), "utf8"));
  const lister = listerImpl ?? ((d, ext = ".md") => (fsExists(join(root, d))
    ? fsReaddir(join(root, d)).filter((f) => f.endsWith(ext)).map((f) => `${d}/${f}`) : []));
  const fichiers = [];
  for (const r of racines) {
    if (r.chemin) { fichiers.push({ chemin: r.chemin, source: r }); continue; }
    try { for (const f of lister(r.dossier, r.ext ?? ".md")) fichiers.push({ chemin: f, source: r }); }
    catch { /* dossier absent = corpus plus petit, jamais une erreur */ }
  }
  const textes = new Map(); const vus = new Set();
  for (const { chemin: f, source } of fichiers) {
    if (vus.has(f)) continue; vus.add(f);
    try { textes.set(f, source.enTeteSeulement ? enTeteDUnOutil(lire(f)) : lire(f)); }
    catch { /* illisible : compté plus bas */ }
  }
  if (!textes.size) return { mesurable: false, pourquoi: "aucun fichier du corpus n'a pu être lu : ce zéro dit qu'on n'a rien lu, jamais que le projet n'a pas de convictions" };

  const vocabulaire = vocabulaireDuCorpus(textes, { root });
  // DEUX PASSES, ET LA PREMIÈRE NE SERT QU'À MESURER LE CADRE. On ne peut pas savoir qu'un mot de
  // cadre recouvre le corpus avant d'avoir le corpus : la première passe extrait les phrases, la
  // seconde les classe avec un cadre déjà nettoyé de ses mots trop larges.
  const brutes = [];
  for (const [f, t] of textes) for (const c of extraireConvictions(t, { chemin: f })) brutes.push(c);
  const cadreNettoye = cadreSansLesMotsTropLarges(familles, brutes);
  familles = cadreNettoye.familles;
  const convictions = [];
  for (const [f, t] of textes) {
    for (const c of extraireConvictions(t, { chemin: f })) {
      convictions.push({
        ...c,
        zone: zoneDuFichier(f, { racines }),
        motsUtiles: [...new Set(significantWords(c.phrase))].filter((w) => vocabulaire.mots.has(w)),
        familles: familleDUneConviction(c.phrase, { familles }),
        niveau: classerParNiveau(c.phrase).niveau,
      });
    }
  }
  let unites = [];
  try { unites = extractPrincipleUnits(lire(chemin)); } catch { /* boussole absente : tout sera « inavoué », et le rapport le dit */ }

  // LE SEUIL SE DÉRIVE DE LA DISTRIBUTION RÉELLE, il ne se choisit pas (BP5). Le 75e centile des
  // représentativités observées reste par construction DANS le nuage : il ne peut donc jamais
  // passer au-dessus de tout ce qu'il observe, la faute corrigée deux fois plus haut.
  const reps = convictions.map((c) => representativite(c.phrase, convictions, { vocab: vocabulaire.mots }).fichiers).sort((a, b) => a - b);
  const derive = reps.length ? reps[Math.floor(reps.length * 0.75)] : 0;
  const seuil = { valeur: seuilEtendue ?? Math.max(3, derive), derive, centile: 0.75, observees: reps.length, max: reps[reps.length - 1] ?? 0 };

  const cadre = couvertureDuCadre({ convictions, unites, familles, vocab: vocabulaire.mots, seuilEtendue: seuil.valeur });
  const parNiveau = {};
  for (const c of convictions) parNiveau[c.niveau] = (parNiveau[c.niveau] ?? 0) + 1;
  const retenues = cadre.cases.flatMap((c) => c.top);
  const tensions = tensionsDuCorpus(retenues);
  return {
    mesurable: true, tensions,
    fichiersLus: textes.size, fichiersDeclares: fichiers.length,
    convictions: convictions.length, vocabulaire: { retenu: vocabulaire.mots.size, plafond: vocabulaire.plafond, ecartesCommeOutils: vocabulaire.ecartesCommeOutils },
    seuil, cadre, parNiveau, motsDeCadreEcartes: cadreNettoye.ecartes,
    inavoues: retenues.filter((c) => !c.boussole.couverte).length,
    boussole: { chemin, principes: unites.length },
  };
}

// ============================================================================
// LA THÈSE DU CŒUR — « le cœur de l'Agence est sa gouvernance » (tâche #1444)
// ============================================================================
// CE QUI REND CETTE MESURE LÉGITIME PLUTÔT QUE COMPLAISANTE, et c'est la seule chose qui compte
// ici : une thèse énoncée par le responsable de projet n'est pas une consigne à illustrer, c'est
// une affirmation à ÉPROUVER. La mesure doit donc pouvoir rendre « NON SOUTENUE ». Si elle ne le
// peut pas, elle ne mesure rien et confirme tout — exactement l'outil fabriqué pour cocher une
// case que l'Article 31 refuse par sa faille 2.
//
// LES TROIS INDICES SONT DES COMPORTEMENTS, JAMAIS DES NOMS. Compter les fonctions dont le nom
// commence par « find » mesurerait une CONVENTION DE NOMMAGE et rien d'autre : un fichier peut
// gouverner sans qu'un seul de ses noms le dise, et se nommer ainsi sans rien refuser. Les trois
// indices ci-dessous lisent donc ce que le code FAIT : il lève une erreur, il rend un verdict qui
// peut dire « je n'ai pas pu regarder », ou il tourne sans qu'on le lui demande.
export const INDICES_DE_GOUVERNANCE = [
  { cle: "refus", titre: "ce qui REFUSE", motif: /throw new Error/g,
    quoi: "une fonction qui lève une erreur arrête quelque chose : c'est la forme la plus forte qu'un principe puisse prendre ici, parce qu'elle ne dépend d'aucune mémoire" },
  { cle: "verdict", titre: "ce qui rend un VERDICT", motif: /\bmesurable:/g,
    quoi: "un retour qui porte « mesurable » distingue un résultat d'une absence de résultat — c'est un jugement rendu, jamais un simple affichage" },
  { cle: "abstention", titre: "ce qui sait DIRE QU'IL N'A PAS PU", motif: /PAS MESUR[ÉE]/g,
    quoi: "refuser de conclure sur zéro donnée est un acte de gouvernance à part entière, et c'est celui que ce projet a payé le plus cher pour apprendre" },
];
export const INDICES_DE_PRODUCTION = [
  { cle: "rendu", titre: "ce qui MET EN FORME", motif: /^export function (?:format|build|rendre)[A-Za-z]*/gm,
    quoi: "une fonction qui assemble des lignes ou du HTML produit un livrable : c'est la moitié visible du travail, et la thèse dit qu'elle n'est pas le cœur" },
  { cle: "affichage", titre: "ce qui IMPRIME", motif: /console\.log\(/g,
    quoi: "l'impression est le geste de production le plus élémentaire du paysage, et le plus fréquent" },
];

// ============================================================================
// LA RÉVÉLATION DE LA STRATÉGIE — même machine, autre corpus, autre cadre (tâche #1434)
// ============================================================================
// POURQUOI ÇA N'EST PAS UN SECOND OUTIL, et c'est le point qui compte : une philosophie et une
// stratégie se révèlent de la même façon — on lit un corpus, on en extrait des phrases qui
// engagent, on les note par le nombre de contextes qu'elles traversent, on dérive le seuil de leur
// propre distribution, et on confronte le tout à un document de référence pour voir ce qu'il ne
// dit pas. Construire une seconde mécanique aurait créé deux moteurs à maintenir pour une seule
// idée, et le second aurait divergé du premier en silence.
//
// CE QUI CHANGE VRAIMENT, ET IL N'Y A QUE TROIS CHOSES. Le CORPUS : une philosophie se lit dans les
// règles et les leçons, une stratégie se lit dans les plans, les chantiers et les décisions. Le
// CADRE : une philosophie doit dire ce en quoi on croit, une stratégie doit dire où l'on va, par
// quelles étapes, ce qu'on ne fera pas, ce qui bloque, et comment on saura qu'on y est. Le
// DOCUMENT DE RÉFÉRENCE : la boussole d'un côté, la stratégie globale de l'autre.
export const RACINES_DE_LA_STRATEGIE = [
  { dossier: "docs/strategies", zone: "chantiers", pourquoi: "les dix stratégies de CHANTIER : c'est là que la direction est écrite au plus près du travail réel" },
  { dossier: "docs/grand-projet/02-strategie", zone: "cible", pourquoi: "la cible du projet entier et les grands axes de départ — ce qu'on cherche à obtenir" },
  { dossier: "docs/plans", zone: "plans", pourquoi: "les plans de chantier : la direction telle qu'elle a été réellement découpée en étapes" },
  { dossier: "docs/suivi/sessions", zone: "decisions", pourquoi: "les décisions prises : une stratégie se lit mieux dans ce qu'on a fait que dans ce qu'on a annoncé" },
  { dossier: "docs/fils", zone: "questions", pourquoi: "les questions ouvertes par sujet : une direction se devine aussi à ce qui reste indécis" },
];

// LES SIX CASES D'UNE STRATÉGIE, et elles ne sont pas celles d'une philosophie. Une philosophie
// énonce des convictions, qui sont vraies ou fausses ; une stratégie énonce une DIRECTION et des
// JALONS, qui sont atteints ou non. Les cases ci-dessous sont les six questions auxquelles un
// document de stratégie doit répondre pour en être un — une case vide est un vrai trou, jamais un
// défaut de mesure, et le rapport le dit case par case.
export const CADRE_STRATEGIQUE = [
  { cle: "destination",  bloc: "direction", titre: "Où l'on va",            ancre: "Destination", mots: ["cible", "objectif", "but", "viser", "visé", "direction", "ambition", "finalité", "aboutir"] },
  { cle: "etapes",       bloc: "direction", titre: "Par quelles étapes",    ancre: "Étapes",      mots: ["étape", "étapes", "chantier", "chantiers", "phase", "phases", "ordre", "d'abord", "ensuite", "séquence"] },
  { cle: "renoncements", bloc: "direction", titre: "Ce qu'on ne fera pas",  ancre: "Renoncements", mots: ["renoncer", "écarté", "écartée", "jamais", "refuse", "refusé", "hors", "exclu", "pas la peine"] },
  { cle: "obstacles",    bloc: "conditions", titre: "Ce qui bloque",        ancre: "Obstacles",   mots: ["bloque", "blocage", "freine", "dette", "risque", "fragile", "empêche", "coûte", "manque"] },
  { cle: "preuves",      bloc: "conditions", titre: "Comment on saura",     ancre: "Preuves",     mots: ["mesure", "mesuré", "jalon", "indicateur", "preuve", "vérifier", "atteint", "chiffre", "seuil"] },
  { cle: "dependances",  bloc: "conditions", titre: "De quoi ça dépend",    ancre: "Dépendances", mots: ["dépend", "dépendance", "avant", "prérequis", "nécessite", "condition", "suppose", "attend"] },
];

export const STRATEGIE_GLOBALE_PATH = "docs/strategies/strategie-globale-du-projet-entier.md";

export function revelerLaStrategie({ root = ROOT, racines = RACINES_DE_LA_STRATEGIE, chemin = STRATEGIE_GLOBALE_PATH, familles = CADRE_STRATEGIQUE, ...reste } = {}) {
  return revelerLaPhilosophie({ root, racines, chemin, familles, ...reste });
}

// LE RAPPORT DE LA RÉVÉLATION STRATÉGIQUE EST DISTINCT DE CELUI DE LA PHILOSOPHIE, et pour une
// raison de fond plutôt que de présentation : sur ce corpus-ci, ce n'est pas la dérivation qui
// décide du seuil, c'est le PLANCHER de trois fichiers hérité de la révélation philosophique. Le
// 75e centile observé vaut 1 — autrement dit, la plupart des phrases de stratégie n'apparaissent
// que dans un seul fichier, ce qui est NORMAL pour une stratégie : une direction s'énonce une
// fois, là où une conviction revient partout. Exiger qu'elle revienne dans trois fichiers importe
// au corpus stratégique une attente qui n'est pas la sienne.
// LES DEUX LECTURES SONT DONC RENDUES, jamais une seule : ce que le plancher retient, et ce que la
// dérivation seule aurait retenu. Choisir pour le lecteur reviendrait à trancher par le choix du
// seuil une question qui porte sur le contenu.
export function formatRevelationStrategieLines(r) {
  if (!r?.mesurable) return ["=== LA RÉVÉLATION DE LA STRATÉGIE : PAS MESURÉ ===", `  ${r?.pourquoi}`];
  const L = ["=== LA STRATÉGIE, RÉVÉLÉE — ce que le corpus dit, et que la stratégie globale ne dit pas ===", "",
    `${r.fichiersLus} fichier(s) lus sur ${r.fichiersDeclares} déclarés · ${r.convictions} phrase(s) qui engagent extraites.`,
    `Confrontées à « ${r.boussole.chemin} » (${r.boussole.principes} unité(s) reconnue(s)).`, ""];
  if (!r.boussole.principes) {
    L.push("⚠️  PAS MESURÉ, et c'est la limite la plus lourde de ce passage : AUCUNE unité n'a été reconnue dans le");
    L.push("    document de référence. Il est structuré en sections numérotées ①②③④, pas en Articles, et l'extracteur");
    L.push("    ne sait lire que les formes à Articles (c'est la tâche #1438, ouverte). Tout ressort donc « INAVOUÉ »");
    L.push("    PAR CONSTRUCTION — ce chiffre ne dit rien sur la stratégie globale, il dit qu'on ne l'a pas lue.");
    L.push("");
  }
  if (r.motsDeCadreEcartes?.length) {
    L.push("MOTS DE CADRE ÉCARTÉS PARCE QU'ILS RECOUVRAIENT LE CORPUS AU LIEU DE LE SÉPARER :");
    for (const e of r.motsDeCadreEcartes) L.push(`  · « ${e.mot} » (famille ${e.famille}) — présent dans ${Math.round(e.part * 100)} % des phrases`);
    L.push("  Le filtre est DÉRIVÉ, jamais une liste de mots interdits : un mot envahissant demain sera écarté demain.");
    L.push("");
  }
  L.push(`SEUIL : ${r.seuil.valeur} fichier(s). Dérivé du ${Math.round(r.seuil.centile * 100)}e centile : ${r.seuil.derive}. Maximum observé : ${r.seuil.max}.`);
  if (r.seuil.valeur > r.seuil.derive) {
    L.push(`  ⚠️  CE N'EST DONC PAS LA DÉRIVATION QUI DÉCIDE ICI, c'est le PLANCHER de ${r.seuil.valeur}, hérité de la révélation`);
    L.push("     philosophique. Le centile observé vaut " + r.seuil.derive + " : la plupart des phrases de stratégie n'apparaissent que dans");
    L.push("     un seul fichier, ce qui est NORMAL — une direction s'énonce une fois, une conviction revient partout.");
    L.push("     Exiger la répétition importe au corpus stratégique une attente qui n'est pas la sienne.");
  }
  L.push("");
  for (const bloc of ["direction", "conditions"]) {
    L.push(`───────────── ${bloc.toUpperCase()} ─────────────`);
    for (const c of r.cadre.cases.filter((x) => x.bloc === bloc)) {
      L.push("");
      L.push(`▸ ${c.titre}  [${c.cle}]`);
      L.push(`  ${c.convictions} phrase(s) candidate(s) · ${c.retenues} au-dessus du seuil`);
      if (c.vide) { L.push("  🚨 AUCUNE au-dessus du seuil — à lire avec le plancher ci-dessus : sur ce corpus, c'est souvent lui qui coupe, pas le silence du corpus."); continue; }
      for (const x of c.top.slice(0, 4)) {
        L.push(`  · [${x.rep.zones} zone(s) · ${x.rep.fichiers} fichier(s)${x.boussole.couverte ? " · DÉJÀ dans la stratégie globale" : " · ABSENT de la stratégie globale"}] ${x.phrase}`);
        L.push(`      ↳ ${x.chemin}`);
      }
    }
    L.push("");
  }
  L.push("HORS PORTÉE : une phrase qui engage n'est pas forcément une STRATÉGIE — le corpus mélange la direction");
  L.push("voulue et les décisions déjà prises, et seule une lecture humaine les sépare. Ce rapport dit OÙ regarder,");
  L.push("jamais ce qu'il faut écrire.");
  return L;
}

export function mesurerLaThese({ root = ROOT, dossier = "scripts", lireDir = fsReaddir, lireF = readFileSync,
  crochet = "scripts/hooks/check-last-commit.mjs" } = {}) {
  let noms = [];
  try { noms = lireDir(join(root, dossier)).filter((f) => f.endsWith(".mjs")); } catch { noms = []; }
  if (!noms.length) {
    return { mesurable: false, pourquoi: `aucun fichier lisible dans « ${dossier} » — une thèse sur ce que l'Agence EST ne se tranche pas sur un parc vide, et rendre zéro se lirait comme « rien ne gouverne »` };
  }
  const textes = [];
  for (const n of noms) { try { textes.push({ nom: n, texte: lireF(join(root, dossier, n), "utf8") }); } catch { /* illisible : il ne compte ni d'un côté ni de l'autre */ } }
  const compter = (indices) => indices.map((i) => {
    let total = 0; let fichiers = 0;
    for (const t of textes) {
      const n = (t.texte.match(i.motif) ?? []).length;
      if (n) { total += n; fichiers++; }
    }
    return { ...i, total, fichiers };
  });
  const gouvernance = compter(INDICES_DE_GOUVERNANCE);
  const production = compter(INDICES_DE_PRODUCTION);
  // LA CONTRAINTE PERMANENTE SE LIT DANS LE VRAI CROCHET, jamais dans une liste recopiée
  // (Article 24) : un outil ajouté au crochet demain compte le jour même.
  let auCrochet = { mesurable: false, pourquoi: `le crochet « ${crochet} » est illisible` };
  try {
    const h = lireF(join(root, crochet), "utf8");
    const cites = [...new Set((h.match(/[a-z0-9-]+\.mjs/g) ?? []))].filter((f) => f !== "check-last-commit.mjs" && f !== "install.mjs" && f !== "banniere.mjs" && f !== "lib-shell.mjs");
    auCrochet = { mesurable: true, outils: cites.length, parc: noms.length, part: cites.length / noms.length, listes: cites.sort() };
  } catch { /* la raison est déjà écrite dans l'objet par défaut */ }
  const sommeG = gouvernance.reduce((n, i) => n + i.total, 0);
  const sommeP = production.reduce((n, i) => n + i.total, 0);
  // DEUX LECTURES, JAMAIS UNE, ET C'EST UN DÉFAUT DE LA PREMIÈRE QUI L'IMPOSE. `console.log` écrase
  // tout le reste par son volume, et il est AMBIGU : dans un outil de gouvernance, imprimer est la
  // façon dont un verdict est RENDU, pas un produit fabriqué. Le compter du côté production gonfle
  // donc le dénominateur avec la livraison de ce qu'on mesure de l'autre côté — exactement la
  // leçon L10 : une mesure qui partage son filtre avec ce qu'elle mesure ne mesure plus rien.
  // Choisir une seule des deux lectures serait trancher la thèse par le choix du critère ; les deux
  // sont donc rendues, et le rapport dit à quelle question chacune répond.
  const sommePStructurelle = production.filter((i) => i.cle !== "affichage").reduce((n, i) => n + i.total, 0);
  const rapportStructurel = sommePStructurelle ? sommeG / sommePStructurelle : null;
  const rapport = sommeP ? sommeG / sommeP : null;
  // LE VERDICT PEUT DIRE NON, ET C'EST LA SEULE CHOSE QUI REND CETTE MESURE HONNÊTE.
  const verdict = rapport === null ? "PAS MESURÉ"
    : rapport >= 1 ? "SOUTENUE"
    : rapport >= 0.5 ? "SOUTENUE EN PARTIE"
    : "NON SOUTENUE";
  const verdictStructurel = rapportStructurel === null ? "PAS MESURÉ"
    : rapportStructurel >= 1 ? "SOUTENUE" : rapportStructurel >= 0.5 ? "SOUTENUE EN PARTIE" : "NON SOUTENUE";
  return { mesurable: true, fichiers: textes.length, gouvernance, production, sommeG, sommeP, rapport, verdict,
    sommePStructurelle, rapportStructurel, verdictStructurel, auCrochet };
}

export function formatTheseLines(m) {
  if (!m?.mesurable) return ["=== LA THÈSE DU CŒUR : PAS MESURÉ ===", `  ${m?.pourquoi}`];
  const L = ["=== « LE CŒUR DE L'AGENCE EST SA GOUVERNANCE » — la thèse, éprouvée ===", "",
    `Lue sur ${m.fichiers} fichier(s) de l'outillage. Aucun chiffre ci-dessous ne vient d'un nom de fonction :`,
    `chacun lit ce que le code FAIT, parce qu'une convention de nommage ne dit rien de ce qu'un fichier gouverne.`, ""];
  L.push("CE QUI GOUVERNE");
  for (const i of m.gouvernance) { L.push(`  ${String(i.total).padStart(5)} × ${i.titre} — dans ${i.fichiers} fichier(s)`); L.push(`          ${i.quoi}`); }
  L.push("");
  L.push("CE QUI PRODUIT");
  for (const i of m.production) { L.push(`  ${String(i.total).padStart(5)} × ${i.titre} — dans ${i.fichiers} fichier(s)`); L.push(`          ${i.quoi}`); }
  L.push("");
  L.push("DEUX LECTURES, ET ELLES NE DISENT PAS LA MÊME CHOSE — les deux sont rendues plutôt qu'une seule choisie,");
  L.push("parce que choisir le critère reviendrait à trancher la thèse par le choix du critère.");
  L.push("");
  L.push(`  LECTURE LARGE — tout compris, l'impression incluse : ${m.sommeG} contre ${m.sommeP}, soit ${m.rapport === null ? "non calculable" : m.rapport.toFixed(2)} pour 1 → thèse ${m.verdict}.`);
  L.push("     Elle répond à : « de quoi le code est-il fait, geste par geste ? » Son défaut est connu et déclaré :");
  L.push("     dans un outil de gouvernance, imprimer est la façon dont un VERDICT est rendu, pas un produit fabriqué.");
  L.push("     La livraison de ce qu'on mesure d'un côté gonfle donc le dénominateur de l'autre (leçon L10).");
  L.push("");
  L.push(`  LECTURE STRUCTURELLE — l'impression écartée : ${m.sommeG} contre ${m.sommePStructurelle}, soit ${m.rapportStructurel === null ? "non calculable" : m.rapportStructurel.toFixed(2)} pour 1 → thèse ${m.verdictStructurel}.`);
  L.push("     Elle répond à : « à quoi les STRUCTURES du code sont-elles consacrées ? » C'est la question de la thèse,");
  L.push("     et c'est la lecture qui la soutient le plus franchement — raison de plus pour ne pas la donner seule.");
  L.push("");
  if (m.auCrochet.mesurable) {
    L.push(`LA CONTRAINTE PERMANENTE : ${m.auCrochet.outils} outil(s) tournent à CHAQUE commit sans qu'on le demande, sur un parc de ${m.auCrochet.parc} — ${Math.round(m.auCrochet.part * 100)} %.`);
    L.push(`  Lus dans le vrai crochet, jamais dans une liste recopiée : un outil ajouté demain compte le jour même.`);
    L.push(`  ${m.auCrochet.listes.join(", ")}`);
  } else L.push(`⚠️  PAS MESURÉ — ${m.auCrochet.pourquoi}`);
  L.push("");
  L.push("HORS PORTÉE, et c'est la limite qui compte le plus : ces chiffres disent COMBIEN de code est consacré");
  L.push("à gouverner, jamais si ce qu'il gouverne en vaut la peine. Un paysage pourrait être gouvernance à 90 %");
  L.push("et ne rien protéger d'utile. La mesure soutient la thèse ; elle ne la démontre pas, et une thèse sur ce");
  L.push("qu'une chose EST ne se démontre jamais par un comptage seul.");
  L.push("");
  L.push("ET LE VERDICT PEUT DIRE NON : en dessous d'un geste de gouvernance pour deux de production, cette mesure");
  L.push("rend « NON SOUTENUE ». Une mesure qui ne peut pas contredire celui qui la demande ne mesure rien.");
  return L;
}

// ============================================================================
// L'ALERTE DE TENSION — prévenir AVANT, pas constater après (tâche #1435)
// ============================================================================
// SA QUESTION, mot pour mot : « est-ce que, une fois que le doc philo et politique sera en
// vigueur, tu seras capable de me prévenir si j'ai une idée ou une consigne en tension avec ce
// document ? » La réponse honnête était « pas de façon vérifiable » : je pouvais le remarquer, ou
// ne pas le remarquer, et rien ne distinguait les deux cas. Une capacité qui dépend de ma
// vigilance du moment n'existe pas à la session suivante (Article 27).
//
// TROIS VERDICTS, ET LE TROISIÈME EST CELUI QU'ON OUBLIE TOUJOURS. Une idée peut être EN TENSION
// avec un article (vocabulaire partagé, polarité opposée), elle peut être DÉJÀ COUVERTE par un
// article (ce n'est alors pas une idée neuve, c'est une redite — et le dire épargne un chantier),
// ou elle peut être NEUVE, ce qui est le cas le plus fréquent et le plus banal.
//
// LA LIMITE EST LA MÊME QUE PARTOUT AILLEURS DANS CET OUTIL, et elle est lourde : le vocabulaire
// partagé est un SIGNAL, jamais une contradiction prouvée. Deux idées peuvent se contredire avec
// des mots entièrement différents, et cette mesure ne les verra jamais. Elle ne remplace donc PAS
// la vigilance de l'Article 14 ; elle attrape ce qu'une relecture distraite laisse passer, et elle
// le fait de la même façon à chaque fois, ce qu'une relecture ne garantit jamais.
// LE SEUIL NE PEUT PAS ÊTRE DU JACCARD, ET LA RAISON EST DÉJÀ ÉCRITE QUELQUES CENTAINES DE LIGNES
// PLUS HAUT, chez tauxDeContenance() : la question posée n'est pas « ces deux textes se
// ressemblent-ils ? » mais « cette idée touche-t-elle cet article ? ». Une idée de dix mots
// comparée à un article de soixante rend au mieux 0,15 de Jaccard même en recouvrement total — le
// premier passage rendait donc « NEUVE » sur une idée qui contredisait frontalement un article,
// parce que le seuil était hors de portée par construction. C'est la même faute que BP5 corrige
// ailleurs : un seuil doit rester dans le nuage de ce qu'il observe.
// LA MESURE JUSTE EST LA CONTENANCE, aux deux bouts de la même échelle : 0,20 pour dire qu'une
// idée TOUCHE un article, 0,70 pour dire qu'il la CONTIENT déjà. Sur quatre idées d'essai la
// séparation est franche — une idée hors sujet rend 0,00 partout, une redite exacte rend 1,00.
export const SEUIL_D_ALERTE = 0.2;

// UN ARTICLE QUI INTERDIT EST CONTREDIT PAR UNE PROPOSITION QUI PERMET, même quand la proposition
// ne porte aucun « jamais » ni « toujours ». C'est le cas que le premier passage manquait, et
// c'est précisément celui qui l'intéresse : « on peut désactiver un test pour aller plus vite »
// ne contient aucun marqueur de polarité, et contredit pourtant de plein fouet l'article qui
// exige un filet vert. Le jeu reste LOCAL à cette fonction et volontairement étroit : élargi, il
// ferait sonner l'alerte sur toute idée qui touche un article prohibitif, c'est-à-dire presque
// toutes (leçon L4 — un garde-fou qui accuse le geste normal cesse d'être lu).
// LA COMPARAISON SE FAIT SUR DES RACINES, PAS SUR DES MOTS ENTIERS, et c'est un cas réel qui
// l'a imposé : « il suffit de RECOPIER la liste des outils à la main » ne touchait PAS l'article
// qui dit « aucun élément ne se RECOPIE manuellement ». Une lettre d'écart, et la mesure ne voyait
// rien — alors que c'est la tension la plus nette qu'on puisse écrire contre cet article.
// LA TRONCATURE EST VOLONTAIREMENT GROSSIÈRE : six caractères, sur les mots d'au moins cinq. Elle
// ne prétend pas être une lemmatisation ; elle rapproche les conjugaisons et les pluriels, ce qui
// est exactement ce qui manquait. Elle reste LOCALE à cette fonction : l'appliquer à
// significantWords() changerait le comportement de tout l'outil, y compris de mesures déjà
// calibrées sur des mots entiers (Article 19 — on ne touche pas à ce qu'on n'a pas besoin de
// toucher). Le risque assumé est de rapprocher deux mots qui ne sont pas de la même famille ; il
// est borné par le fait que le résultat reste un SIGNAL à vérifier, jamais un verdict.
export const LONGUEUR_DE_RACINE = 6;
export const racinesDe = (texte) => new Set(significantWords(String(texte ?? ""))
  .filter((w) => w.length > 4).map((w) => w.slice(0, LONGUEUR_DE_RACINE)));

export function contenanceParRacines(phrase, cible) {
  const a = racinesDe(phrase);
  if (!a.size) return 0;
  const b = racinesDe(cible);
  let dedans = 0;
  for (const r of a) if (b.has(r)) dedans++;
  return dedans / a.size;
}

export const MARQUEUR_DE_PERMISSION = /\b(on peut|il suffit|suffirait|autoris[ée]|dispens[ée]|sans avoir|pas besoin|inutile de|on pourrait se passer)\b/i;

export function tensionAvecLaGouvernance(idee, { root = ROOT, chemin = DOCUMENT_OFFICIEL, lireImpl = null,
  seuil = SEUIL_D_ALERTE, seuilCouverture = SEUIL_CONTENANCE } = {}) {
  const texteIdee = String(idee ?? "").trim();
  if (texteIdee.length < 15) {
    return { mesurable: false, pourquoi: "l'idée fait moins de quinze caractères : trop courte pour partager un vocabulaire avec quoi que ce soit, et rendre « aucune tension » là-dessus serait un acquittement rendu sans regarder" };
  }
  const lire = lireImpl ?? ((c) => readFileSync(join(root, c), "utf8"));
  let unites = [];
  try { unites = extractPrincipleUnits(lire(chemin)); } catch {
    return { mesurable: false, pourquoi: `« ${chemin} » est illisible : sans les articles en vigueur, il n'y a pas d'absence de tension, il y a une absence de mesure` };
  }
  if (!unites.length) return { mesurable: false, pourquoi: `aucun article reconnu dans « ${chemin} » — comparer à rien rendrait « aucune tension » sur zéro donnée` };

  const motsIdee = new Set(significantWords(texteIdee).filter((w) => w.length > 4));
  if (!motsIdee.size) return { mesurable: false, pourquoi: "l'idée ne porte aucun mot significatif de plus de quatre lettres : rien à comparer" };
  const negIdee = MARQUEUR_NEGATION.test(texteIdee);
  const absIdee = MARQUEUR_ABSOLU.test(texteIdee);

  const touches = [];
  for (const u of unites) {
    const texteArticle = u.texte ?? `${u.titre}`;
    const motsArt = new Set(significantWords(texteArticle).filter((w) => w.length > 4));
    if (!motsArt.size) continue;
    const contenance = contenanceParRacines(texteIdee, texteArticle);
    if (contenance < seuil) continue;
    // LE CHOC DE POLARITÉ n'a de sens qu'entre une interdiction et une obligation. Une phrase qui
    // porte les DEUX marqueurs entre en conflit avec tout le monde et avec personne : on l'écarte
    // ici pour la même raison qu'ailleurs dans ce fichier.
    const negArt = MARQUEUR_NEGATION.test(texteArticle);
    const absArt = MARQUEUR_ABSOLU.test(texteArticle);
    const deuxMarqueurs = (negIdee && absIdee) || (negArt && absArt);
    const chocDePolarite = !deuxMarqueurs && ((negIdee && absArt) || (absIdee && negArt));
    // DEUXIÈME FORME DE CHOC : l'idée propose une DISPENSE sur un sujet gouverné. Elle ne se voit
    // pas dans les marqueurs de polarité, et c'est pourtant la forme la plus fréquente d'une
    // consigne en tension — une consigne se formule rarement en « jamais », presque toujours en
    // « on peut » ou « il suffit de ».
    // LA POLARITÉ DE L'ARTICLE NE DÉCIDE PAS, et le premier passage l'a montré : « on peut
    // désactiver un test pour aller plus vite » touche l'article qui exige un filet vert avant
    // qu'un travail soit tenu pour achevé — lequel est une OBLIGATION et ne porte donc aucun
    // « jamais ». Exiger une interdiction du côté de l'article laissait passer exactement le cas
    // à attraper. Ce qui fait la tension n'est pas la forme grammaticale de l'article, c'est
    // qu'une idée propose de se dispenser de quelque chose qui est gouverné.
    // CE QUI EMPÊCHE L'ALERTE DE SONNER PARTOUT (leçon L4) : DEUX conditions réunies — un marqueur
    // de permission explicite dans l'idée, ET une contenance au-dessus du seuil avec un article
    // précis. Une idée sans marqueur ne sonne jamais ; une idée qui ne touche aucun article non
    // plus, et c'est le cas de l'immense majorité des demandes ordinaires. Une redite exacte de
    // l'article est exclue aussi : elle le répète, elle ne s'en dispense pas.
    const chocDePermission = MARQUEUR_DE_PERMISSION.test(texteIdee) && !absIdee && contenance < seuilCouverture;
    const choc = chocDePolarite || chocDePermission;
    touches.push({ numero: u.numero, titre: u.titre, contenance: Math.round(contenance * 100) / 100,
      choc, forme: chocDePolarite ? "polarité opposée" : chocDePermission ? "l'idée propose une dispense sur un sujet gouverné par cet article" : null,
      couverture: Math.round(contenance * 100) / 100, dejaCouverte: contenance >= seuilCouverture });
  }
  touches.sort((a, b) => b.contenance - a.contenance);
  const tensions = touches.filter((t) => t.choc);
  const couvertes = touches.filter((t) => t.dejaCouverte);
  const verdict = tensions.length ? "EN TENSION" : couvertes.length ? "DÉJÀ COUVERTE" : "NEUVE";
  return { mesurable: true, idee: texteIdee, chemin, articles: unites.length, seuil,
    touches, tensions, couvertes, verdict };
}

export function formatTensionLines(r) {
  if (!r?.mesurable) return ["=== ALERTE DE TENSION : PAS MESURÉ ===", `  ${r?.pourquoi}`];
  const L = ["=== CETTE IDÉE EST-ELLE EN TENSION AVEC LE DOCUMENT DE GOUVERNANCE ? ===", "",
    `Idée examinée : « ${r.idee.slice(0, 160)}${r.idee.length > 160 ? "…" : ""} »`,
    `Confrontée aux ${r.articles} articles en vigueur de « ${r.chemin} », seuil de contenance ${r.seuil}.`, ""];
  L.push(`VERDICT : ${r.verdict}.`);
  L.push("");
  if (r.tensions.length) {
    L.push(`🚨 ${r.tensions.length} article(s) en OPPOSITION DE POLARITÉ sur un vocabulaire partagé :`);
    for (const t of r.tensions) L.push(`     article ${t.numero} — ${t.titre} (contenance ${t.contenance} · ${t.forme})`);
    L.push("     À VÉRIFIER À LA MAIN : c'est un SIGNAL, jamais un verdict — mais c'est exactement ce qu'une relecture distraite laisse passer.");
  }
  if (r.couvertes.length) {
    L.push(`📎 ${r.couvertes.length} article(s) la contiennent DÉJÀ (taux de contenance ≥ ${SEUIL_CONTENANCE}) :`);
    for (const t of r.couvertes) L.push(`     article ${t.numero} — ${t.titre} (contenance ${t.couverture})`);
    L.push("     Ce n'est donc pas une idée neuve mais une redite — et le dire épargne un chantier.");
  }
  if (!r.tensions.length && !r.couvertes.length) {
    L.push(`✅ Aucune opposition détectée. ${r.touches.length} article(s) partagent du vocabulaire avec elle, sans choc de polarité :`);
    for (const t of r.touches.slice(0, 5)) L.push(`     article ${t.numero} — ${t.titre} (contenance ${t.contenance})`);
    if (!r.touches.length) L.push("     (aucun : l'idée ne croise le vocabulaire d'aucun article — elle parle d'autre chose)");
  }
  L.push("");
  L.push("HORS PORTÉE, ET ELLE EST LOURDE : le vocabulaire partagé est un SIGNAL, jamais une contradiction prouvée.");
  L.push("Deux idées peuvent se contredire avec des mots entièrement différents, et cette mesure ne les verra JAMAIS.");
  L.push("Elle ne remplace donc pas la vigilance de l'Article 14 — elle attrape ce qu'une relecture distraite laisse");
  L.push("passer, et elle le fait de la même façon à chaque fois, ce qu'une relecture ne garantit jamais.");
  return L;
}

function main({ chemin = PHILOSOPHY_PATH } = {}) {
  printReportHeader({ tool: "the-king", title: "THE-KING — veille philosophie et politique", scriptPath: "scripts/the-king.mjs" });
  recordCliUsage("the-king");
  const requestText = process.argv.slice(2).join(" ");
  // SOUS-COMMANDE « reveler » (tâche #1418) — la révélation est une opération lourde et ciblée,
  // jamais quelque chose qu'on inflige à chaque passage de veille ordinaire.
  // SOUS-COMMANDE « these » (tâche #1444) — éprouver une thèse énoncée sur ce que l'Agence EST.
  // SOUS-COMMANDE « reveler-strategie » (tâche #1434) — même machine, autre corpus, autre cadre.
  if (process.argv[2] === "reveler-strategie") {
    const r = revelerLaStrategie();
    const lignes = formatRevelationStrategieLines(r);
    for (const l of lignes) console.log(l);
    const dossier = join(ROOT, "docs/the-king");
    try { mkdirSync(dossier, { recursive: true }); } catch { /* déjà là */ }
    const jour = new Date().toISOString().slice(0, 10);
    writeFileSync(join(dossier, `revelation-strategie-${jour}.txt`), lignes.join("\n") + "\n", "utf8");
    console.log(`\nRapport déposé : docs/the-king/revelation-strategie-${jour}.txt`);
    const constats = [];
    if (r.mesurable && !r.boussole.principes) constats.push({ constat: `aucune unité reconnue dans « ${r.boussole.chemin} » : l'extracteur ne lit que les formes à Articles, donc tout ressort « inavoué » PAR CONSTRUCTION`, etat: "retenu", tache: "tâche #1438 — rendre l'extracteur capable de lire les titres et les cellules de tableau" });
    if (r.mesurable && r.seuil.valeur > r.seuil.derive) constats.push({ constat: `le seuil retenu (${r.seuil.valeur}) est le PLANCHER hérité de la révélation philosophique, pas la dérivation (${r.seuil.derive}) : il importe au corpus stratégique une attente de répétition qui n'est pas la sienne`, etat: "a-trancher", tache: "dire si une stratégie doit être REPÉTÉE pour compter, ou si une direction énoncée une fois suffit" });
    for (const e of r.motsDeCadreEcartes ?? []) constats.push({ constat: `« ${e.mot} » recouvrait ${Math.round(e.part * 100)} % des phrases et a été écarté du cadre`, etat: "ecarte", pourquoi: "un mot aussi répandu ne sépare pas le corpus, il le recouvre — et le filtre est dérivé, donc il s'ajustera seul" });
    imprimerPlanDaction(buildPlanDaction(constats, { toolSlug: "the-king" }));
    return;
  }
  // SOUS-COMMANDE « tension » (tâche #1435) — sa question : « seras-tu capable de me prévenir si
  // j'ai une idée ou une consigne en tension avec ce document ? »
  if (process.argv[2] === "tension") {
    const idee = process.argv.slice(3).join(" ");
    const r = tensionAvecLaGouvernance(idee);
    for (const l of formatTensionLines(r)) console.log(l);
    const constats = [];
    for (const t of r.tensions ?? []) constats.push({ constat: `l'idée entre en opposition de polarité avec l'article ${t.numero} (${t.titre})`, etat: "a-trancher", tache: "vérifier à la main si c'est une vraie contradiction : le vocabulaire partagé est un signal, jamais une preuve" });
    for (const t of r.couvertes ?? []) constats.push({ constat: `l'idée est déjà contenue dans l'article ${t.numero} (${t.titre})`, etat: "ecarte", pourquoi: "ce n'est pas une idée neuve mais une redite — et le dire épargne un chantier" });
    if (!r.mesurable) constats.push({ constat: `pas de mesure possible : ${r.pourquoi}`, etat: "retenu", tache: "rétablir la lecture du document de gouvernance avant de conclure quoi que ce soit" });
    console.log("");
    imprimerPlanDaction(buildPlanDaction(constats, { toolSlug: "the-king" }));
    return;
  }
  if (process.argv[2] === "these") {
    const m = mesurerLaThese();
    const lignes = formatTheseLines(m);
    for (const l of lignes) console.log(l);
    // LE LIVRABLE EST LE FICHIER, jamais le texte que je réécrirais à côté (Article 31, faille 3).
    const dossier = join(ROOT, "docs/the-king");
    try { mkdirSync(dossier, { recursive: true }); } catch { /* déjà là */ }
    const jour = new Date().toISOString().slice(0, 10);
    const sortie = join(dossier, `these-du-coeur-${jour}.txt`);
    writeFileSync(sortie, lignes.join("\n") + "\n", "utf8");
    console.log(`\nRapport déposé : docs/the-king/these-du-coeur-${jour}.txt`);
    const constats = [];
    if (!m.mesurable) constats.push({ constat: `la thèse n'est PAS MESURÉE : ${m.pourquoi}`, etat: "retenu", tache: "rétablir la lecture du parc avant de conclure quoi que ce soit sur ce que l'Agence est" });
    else {
      if (m.verdict !== m.verdictStructurel) constats.push({ constat: `les deux lectures ne rendent pas le même verdict (large « ${m.verdict} » contre structurelle « ${m.verdictStructurel} ») — l'écart vient de l'impression, qui est ambiguë par nature`, etat: "a-trancher", tache: "dire laquelle des deux questions est celle de la thèse : « de quoi le code est fait » ou « à quoi ses structures sont consacrées »" });
      if (m.auCrochet.mesurable && m.auCrochet.part < 0.2) constats.push({ constat: `seuls ${Math.round(m.auCrochet.part * 100)} % du parc tournent à chaque commit : la gouvernance est surtout DISPONIBLE, rarement CONTRAIGNANTE`, etat: "retenu", tache: "examiner outil par outil ce qui pourrait rejoindre le crochet sans le ralentir" });
      if (m.verdictStructurel === "NON SOUTENUE") constats.push({ constat: "la mesure CONTREDIT la thèse énoncée, et c'est le résultat le plus utile qu'elle puisse rendre", etat: "a-trancher", tache: "porter la contradiction au responsable de projet plutôt que de la lisser" });
    }
    imprimerPlanDaction(buildPlanDaction(constats, { toolSlug: "the-king" }));
    return;
  }
  if (process.argv[2] === "reveler") {
    const r = revelerLaPhilosophie({ chemin });
    const lignes = formatRevelationLines(r);
    for (const l of lignes) console.log(l);
    const dossier = join(ROOT, "docs/the-king");
    try { mkdirSync(dossier, { recursive: true }); } catch { /* déjà là */ }
    const jour = new Date().toISOString().slice(0, 10);
    const sortie = join(dossier, `revelation-philosophie-${jour}.txt`);
    writeFileSync(sortie, lignes.join("\n") + "\n", "utf8");
    // L'ÉTAT MACHINE, à côté du rapport lisible — c'est lui qui rend la SECONDE révélation
    // comparable à celle-ci. Déposé à chaque passage, jamais sur demande : un état qu'on pense à
    // enregistrer est un état qu'on oubliera le jour qui compte.
    const etat = etatDeLaRevelation(r);
    writeFileSync(join(dossier, `revelation-philosophie-${jour}.json`), JSON.stringify(etat, null, 2) + "\n", "utf8");
    console.log(`\nRapport déposé : docs/the-king/revelation-philosophie-${jour}.txt`);
    console.log(`État comparable déposé : docs/the-king/revelation-philosophie-${jour}.json — couverture actuelle ${etat.couverture.couvertes}/${etat.couverture.retenues} (${Math.round((etat.couverture.part ?? 0) * 100)} %)`);
    // ET LA COMPARAISON SE FAIT TOUTE SEULE s'il existe un passage précédent : personne n'aura à
    // se souvenir de la lancer le jour où elle compte.
    const anciens = fsReaddir(dossier).filter((f) => /^revelation-philosophie-\d{4}-\d{2}-\d{2}\.json$/.test(f) && !f.includes(jour)).sort();
    if (anciens.length) {
      const precedent = JSON.parse(readFileSync(join(dossier, anciens[anciens.length - 1]), "utf8"));
      const comp = comparerRevelations(precedent, etat);
      console.log(`\n=== COMPARAISON avec ${anciens[anciens.length - 1]} ===`);
      if (!comp.mesurable) console.log(`🚨 PAS MESURÉ — ${comp.pourquoi}`);
      else {
        console.log(`  couverture : ${Math.round(comp.couverture.avant * 100)} % → ${Math.round(comp.couverture.apres * 100)} %  (${comp.couverture.delta >= 0 ? "+" : ""}${Math.round(comp.couverture.delta * 100)} pts)`);
        console.log(`  principes de la boussole : ${comp.principes.avant} → ${comp.principes.apres}`);
        if (comp.casesComblees.length) console.log(`  cases comblées : ${comp.casesComblees.join(", ")}`);
        if (comp.casesNouvelles.length) console.log(`  ⚠️  cases devenues vides : ${comp.casesNouvelles.join(", ")}`);
        console.log(`  VERDICT : ${comp.verdict}`);
      }
    } else {
      console.log(`\n(Premier passage enregistré : aucune comparaison possible — et c'est une absence, jamais un « rien n'a changé ».)`);
    }
    const constats = [
      ...(r.mesurable ? r.cadre.vides.map((v) => ({ constat: `case « ${v} » du cadre standard : aucune conviction du corpus ne la porte`, etat: "retenu",
        tache: "trancher avec l'utilisateur ce que le projet met dans cette case — le corpus ne peut pas y répondre à sa place" })) : []),
      ...(r.mesurable && r.inavoues ? [{ constat: `${r.inavoues} conviction(s) récurrentes du corpus n'existent dans aucun principe de la boussole`, etat: "retenu",
        tache: "les porter dans docs/philosophie-et-politique.md, rangées par niveau PROJET/JEU/AGENCE" }] : []),
    ];
    imprimerPlanDaction(buildPlanDaction(constats, { toolSlug: "the-king" }));
    return;
  }
  if (requestText) {
    const reminder = reminderFor(requestText);
    console.log(reminder ?? "👑 THE-KING : aucune des 6 catégories de déclenchement détectée dans ce texte — consultation non signalée comme nécessaire (jamais une certitude, le jugement humain/agent reste final).");
  }
  console.log(`\n📅 Fraîcheur de ${chemin} : ${(() => { const d = philosophyFreshnessDays({ chemin }); return d == null ? "jamais committé" : `dernière modification il y a ${Math.round(d)} j`; })()}`);

  // HISTORIQUE AFFICHÉ (2026-09-22, tâche #196). Trou réel trouvé en finissant le retrofit daté :
  // main() ne montrait QUE la fraîcheur — le digest et les tensions n'existaient que pour l'appelant
  // CIRCLE-TASKS, jamais pour quelqu'un qui lance l'outil à la main. Un outil dont le cœur du rôle
  // (« conserver un historique de l'évolution du document », demande d'origine) reste invisible
  // depuis sa propre ligne de commande n'est pas un outil terminé.
  // LE DOCUMENT QUI FAIT LOI PEUT NE PAS ÊTRE LÀ (2026-09-27, tâche #1034) — sur un dépôt sans
  // philosophie écrite, THE-KING mourait ici. Une absence déclarée vaut mieux qu'un ENOENT.
  const philoDoc = lireLeDocumentGouvernant(chemin, { root: ROOT });
  if (!philoDoc.trouve) {
    for (const l of ligneDocumentAbsent(philoDoc, { outil: "THE-KING", aQuoiCaSert: "il y lit les principes, leurs dates et leurs tensions" })) console.log(l);
    return;
  }
  const principles = extractPrincipleUnits(philoDoc.texte);
  const digest = buildEvolutionDigest(principles, { dateDEdition: dateDEdition(philoDoc.texte) });
  const declarees = principles.filter((p) => extractPrincipleDate(p)).length;
  console.log(`\n📜 Évolution du document — ${digest.length}/${principles.length} principes datés (${declarees} date(s) déclarée(s), ${digest.length - declarees} dérivée(s) de l'historique git) :`);
  for (const ligne of digest) console.log(`   ${ligne}`);
  if (digest.length < principles.length) {
    console.log(`   ⚠️  ${principles.length - digest.length} principe(s) non daté(s) — ni date déclarée, ni trace dans l'historique git de ce fichier.`);
  }

  const mesure = mesureDesTensions(principles);
  const tensions = mesure.mesurable ? mesure.tensions : [];
  console.log("");
  for (const l of formatMesureTensionsLines(mesure)) console.log(l);

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
  // L'ALIGNEMENT EN CASCADE (2026-09-29, tâche #1148) — affiché depuis sa propre ligne de commande,
  // jamais réservé à un appelant. Même raison que le digest en 2026-09-22 : un outil dont on a
  // étendu le rôle et dont l'extension reste invisible depuis son CLI n'est pas un outil terminé.
  const alignement = mesurerLAlignement({ root: ROOT, racine: chemin });
  console.log("");
  for (const l of formatAlignementLines(alignement)) console.log(l);

  const nonDates = principles.length - digest.length;
  const constatsRoi = [
    // UN ÉCART D'ALIGNEMENT EST RETENU, UN ORPHELIN NE L'EST PAS — et la distinction est le cœur du
    // dispositif. Un parent introuvable ou un cycle sont fautifs quel que soit l'âge de l'objet ;
    // un orphelin n'est qu'un document écrit avant la règle, et en faire une tâche ouvrirait
    // vingt-cinq dettes le jour même (leçon L4).
    ...(alignement.mesurable ? alignement.ecarts.map((e) => ({ constat: `${e.chemin} : ${e.pourquoi}`, etat: "retenu",
      tache: "corriger la déclaration « DÉCOULE DE » de ce document, ou créer le parent qu'elle nomme" })) : []),
    ...(nonDates > 0 ? [{ constat: `${nonDates} principe(s) sans aucune date : ni déclarée, ni retrouvable dans l'historique git`, etat: "retenu",
      tache: "dater ces principes à la main, ou écrire qu'ils précèdent le suivi" }] : []),
    ...tensions.map((t) => ({ constat: `tension possible entre « ${t.a} » et « ${t.b} » (vocabulaire partagé ${t.jaccard})`, etat: "a-trancher",
      pourquoi: "vocabulaire partagé + polarité opposée est un signal mécanique, jamais une contradiction prouvée — trancher la philosophie du projet n'est pas une décision d'outil" })),
  ];
  const planRoi = buildPlanDaction(constatsRoi, { toolSlug: "the-king" });
  imprimerPlanDaction(planRoi);

}

// ============================================================================
// LE RANG DES PRINCIPES — « trouve une solution intelligente stp » (2026-10-02, sa réponse à Q3)
//
// LE PIÈGE QU'IL FALLAIT ÉVITER, ET IL EST GROS : classer par ÉTENDUE. C'est tentant parce que
// c'est mesuré et reproductible — mais l'étendue dit combien de fois le projet REDIT une chose,
// jamais ce qu'elle VAUT. Un principe cité partout parce qu'il concerne une opération fréquente
// passerait devant un principe fondateur rarement invoqué parce que rarement menacé.
//
// LA SOLUTION RETENUE : LA PORTANCE, et elle se dérive au lieu de se choisir.
// Un principe est FONDATEUR quand d'AUTRES principes ont besoin de lui pour tenir — quand les
// retirer lui ferait perdre leur raison d'être. On mesure donc, pour chaque principe, combien
// d'AUTRES principes reposent sur son vocabulaire distinctif. Ce n'est plus « combien de fois
// est-ce dit », c'est « combien de choses s'écroulent sans ça ».
//
// DEUX AXES, JAMAIS UN, ET C'EST LE CŒUR DE LA RÉPONSE. L'étendue et la portance répondent à deux
// questions différentes, et les fondre en un seul score les perdrait toutes les deux :
//   · ÉTENDUE  — à quel point le projet y revient      (mesure de PRÉSENCE)
//   · PORTANCE — combien d'autres principes en dépendent (mesure de FONDATION)
// Un principe à forte portance et faible étendue est un fondement discret : exactement le genre
// de chose qu'un classement par fréquence enterrerait.
//
// LA LIMITE EST DÉCLARÉE PLUTÔT QUE TUE : la portance se mesure sur un vocabulaire partagé. Deux
// principes qui se fonderaient l'un sur l'autre avec des mots entièrement différents sont
// invisibles ici. C'est un CLASSEMENT PROPOSÉ, jamais une hiérarchie prouvée — et sur la
// philosophie d'un projet, trancher reste une décision humaine (Article 16).
// ============================================================================

export const MOTS_DISTINCTIFS_MAX = 6;

export function motsDistinctifs(texte, tousLesTextes, { combien = MOTS_DISTINCTIFS_MAX } = {}) {
  const miens = [...new Set(significantWords(String(texte ?? "")))].filter((w) => w.length > 4);
  if (!miens.length) return [];
  // DISTINCTIF = RARE DANS L'ENSEMBLE. Un mot présent dans tous les principes ne distingue rien ;
  // c'est exactement le filtre de fréquence documentaire déjà utilisé pour le vocabulaire du
  // corpus, appliqué ici à une population beaucoup plus petite.
  const df = new Map();
  for (const t of tousLesTextes) for (const w of new Set(significantWords(String(t)))) df.set(w, (df.get(w) ?? 0) + 1);
  return miens.sort((a, b) => (df.get(a) ?? 0) - (df.get(b) ?? 0)).slice(0, combien);
}

export function portanceDesPrincipes(principes, { recouvrement = 2 } = {}) {
  const textes = principes.map((p) => p.texte ?? p.enonce ?? "");
  if (principes.length < 2) {
    return { mesurable: false, pourquoi: "moins de deux principes : la portance mesure ce que les AUTRES doivent à un principe, elle n'a aucun sens sur un seul — PAS MESURÉ, jamais un rang par défaut" };
  }
  const rangs = principes.map((p, i) => {
    const cles = new Set(motsDistinctifs(textes[i], textes));
    let appuyes = 0;
    const qui = [];
    for (let j = 0; j < principes.length; j += 1) {
      if (j === i) continue;
      const mots = new Set(significantWords(textes[j]));
      const partages = [...cles].filter((w) => mots.has(w)).length;
      if (partages >= recouvrement) { appuyes += 1; qui.push(principes[j].cle ?? principes[j].titre ?? String(j)); }
    }
    return { ...p, motsDistinctifs: [...cles], portance: appuyes, appuyePar: qui };
  });
  const valeurs = rangs.map((r) => r.portance).sort((a, b) => a - b);
  return {
    mesurable: true,
    rangs: rangs.slice().sort((a, b) => b.portance - a.portance),
    // UN CLASSEMENT OÙ TOUT LE MONDE EST À ÉGALITÉ N'EST PAS UN CLASSEMENT, et il faut le dire
    // plutôt que de rendre un ordre alphabétique déguisé en hiérarchie.
    discriminant: valeurs[valeurs.length - 1] > valeurs[0],
    etendueDesValeurs: { min: valeurs[0], max: valeurs[valeurs.length - 1] },
  };
}

// ============================================================================
// THE-KING SUR UN CODE ÉTRANGER (2026-10-02, sa demande : « lors de l'installation de l'agence, si
// the king repere qu'il n'y a pas de objectifs ultimes, ni de philo politique, qui soient definis
// en tant que tel quelque part (il sait verifier ca ? il faut l'équiper) »).
//
// LA RÉPONSE HONNÊTE À SA QUESTION ÉTAIT NON : THE-KING savait lire UNE boussole dont on lui donne
// le chemin, et déclarer une absence quand ce chemin ne mène nulle part. Il ne savait pas
// CHERCHER — donc il ne pouvait pas répondre « ce projet n'a de philosophie nulle part », qui est
// une affirmation d'une tout autre nature.
//
// TROIS ÉTATS PAR CASE, JAMAIS DEUX, et c'est ce qui rend le diagnostic utilisable :
//   · TROUVÉ    — un document existe ET porte la substance attendue
//   · COQUILLE  — un document existe au bon endroit mais ne porte pas la substance
//   · ABSENT    — rien nulle part
// Confondre COQUILLE et TROUVÉ ferait passer un fichier vide pour une philosophie ; confondre
// COQUILLE et ABSENT ferait proposer de créer ce qui existe déjà. Les deux erreurs sont coûteuses
// au moment précis où l'Agence se branche sur un projet qu'elle ne connaît pas.
// ============================================================================

export const CASES_FONDATRICES = [
  { cle: "objectif-ultime", quoi: "l'objectif ultime du projet",
    motifsChemin: [/objectif/i, /but\b/i, /vision/i, /mission/i, /charte/i, /readme/i],
    marqueurs: [/objectif[s]?\s+ultime/i, /notre\s+(but|mission|vision)/i, /raison\s+d'[êe]tre/i, /\bvision\b.{0,40}\bprojet\b/i] },
  { cle: "philosophie", quoi: "la philosophie — ce en quoi le projet croit",
    motifsChemin: [/philosoph/i, /valeur/i, /principe/i, /charte/i, /manifest/i, /contributing/i, /readme/i],
    // DEUX REGISTRES D'ÉCRITURE, ET IL FAUT LES DEUX : un projet peut énoncer sa philosophie sur
    // le mode personnel (« nous croyons que ») ou sur le mode officiel et impersonnel (« le projet
    // ne tient pour acquis que »). Ne reconnaître que le premier faisait manquer un document de
    // gouvernance rédigé en style administratif — constaté le jour même où ce dépôt a adopté ce
    // style pour le sien.
    marqueurs: [/nous\s+croyons/i, /philosophie/i, /nos\s+valeurs/i, /principes?\s+fondamenta/i,
                /le projet (?:ne )?(?:tient|croit|refuse|pose)/i, /\bconvictions?\b/i, /synth[èe]se du (?:chapitre|titre)/i] },
  { cle: "politique", quoi: "la politique — comment le projet applique ce en quoi il croit",
    motifsChemin: [/politique|policy/i, /gouvernance|governance/i, /regles?|rules?/i, /contributing/i, /charte/i],
    marqueurs: [/politique/i, /gouvernance/i, /qui\s+(d[ée]cide|valide)/i, /r[èe]gles?\s+de/i,
                /la d[ée]cision appartient/i, /dispositions? g[ée]n[ée]rales?/i] },
];

export function diagnostiquerUnProjet({ root = ROOT, cases = CASES_FONDATRICES, listerImpl = null, lireImpl = null, maxFichiers = 5000 } = {}) {
  const lire = lireImpl ?? ((c) => readFileSync(join(root, c), "utf8"));
  let tronque = false;
  const lister = listerImpl ?? (() => {
    // ON NE DESCEND PAS DANS TOUT LE DÉPÔT : un texte fondateur vit à la racine ou dans un dossier
    // de documentation, jamais enfoui dans du code. Chercher partout rendrait du bruit et
    // coûterait un balayage complet sur un dépôt qu'on découvre.
    const out = [];
    const visiter = (rel, profondeur) => {
      // LA TRONCATURE EST SIGNALÉE, JAMAIS SILENCIEUSE — et ce garde-fou vient d'un vrai défaut.
      // Avec un plafond de 400 fichiers, ce balayage sautait des sous-arbres entiers et désignait
      // un document d'à-côté comme « le » document d'objectifs du projet, pendant que le vrai
      // dormait dans un dossier jamais visité. Le verdict était net et faux, ce qui est pire
      // qu'un verdict prudent. Le plafond existe toujours — il protège d'un dépôt gigantesque —
      // mais quand il mord, le diagnostic le DIT au lieu de conclure comme s'il avait tout vu.
      if (out.length >= maxFichiers) { tronque = true; return; }
      if (profondeur > 3) return; // 3 niveaux : un texte fondateur vit à la racine ou dans docs/<domaine>/<sujet>/, jamais plus bas
      let entrees = [];
      try { entrees = fsReaddir(join(root, rel || "."), { withFileTypes: true }); } catch { return; }
      for (const e of entrees) {
        if (e.name.startsWith(".") || e.name === "node_modules") continue;
        const chemin = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) visiter(chemin, profondeur + 1);
        else if (/\.(md|txt|rst)$/i.test(e.name)) out.push(chemin);
      }
    };
    visiter("", 0);
    return out;
  });

  let fichiers = [];
  try { fichiers = lister(); } catch { fichiers = []; }
  if (!fichiers.length) {
    return { mesurable: false, pourquoi: "aucun document lisible trouvé dans ce projet : ce zéro dit qu'on n'a rien pu lire, jamais que le projet n'a pas de philosophie" };
  }

  // UNE ARCHIVE N'EST JAMAIS LE TEXTE EN VIGUEUR, et ce contrôle vient d'un vrai défaut attrapé
  // par un test : le diagnostic désignait l'édition ARCHIVÉE de la boussole comme la philosophie
  // du projet, parce qu'elle en portait encore le vocabulaire informel. C'est précisément ce que
  // l'article 11 du document de gouvernance interdit — « le passé se garde entièrement, et ne
  // fait jamais autorité ». Un outil qui désigne une archive comme source de vérité applique
  // l'inverse de la règle qu'il est censé garder.
  //
  // LE MOTIF PORTE SUR LE NOM DU DOSSIER (Article 24) : tout dossier d'archives, présent ou à
  // venir, est écarté sans que personne ait à l'y inscrire.
  fichiers = fichiers.filter((f) => !/(^|\/)archives?\//.test(f));
  const resultats = cases.map((c) => {
    const candidats = fichiers.filter((f) => c.motifsChemin.some((m) => m.test(f)));
    // ON PREND LE MEILLEUR CANDIDAT, JAMAIS LE PREMIER QUI PASSE LA BARRE.
    //
    // Le premier passage s'arrêtait au premier document franchissant le seuil, dans l'ordre de
    // l'arborescence. Sur ce dépôt-ci il désignait un document d'ANALYSE pour les trois cases,
    // alors que la vraie boussole et le vrai document d'objectifs existent. Le verdict était
    // juste (« TROUVÉ ») et l'adresse fausse — or c'est l'adresse qui sert ensuite, puisque
    // générer ce qui manque suppose de savoir ce qui existe déjà et où.
    //
    // TROIS SIGNAUX, PONDÉRÉS PAR LEUR FORCE, et chacun dit autre chose :
    //   · le TITRE (×3) — une déclaration d'intention : ce document DIT qu'il est ça
    //   · le NOM DE FICHIER (×2) — une intention plus faible mais réelle
    //   · les MARQUEURS dans le corps (×1) — une présence, qui peut n'être qu'une mention
    // Un document qui ne gagne que par ses marqueurs est une coquille ; il faut une intention
    // déclarée quelque part pour être « TROUVÉ ».
    const noter = (chemin, texte) => {
      const lignes = String(texte).split("\n");
      const h1 = lignes.find((l) => /^#\s/.test(l)) ?? "";
      // LE CORPS SE MESURE SANS LE TITRE, et cette ligne-là ferme un faux positif réel : sans
      // elle, un fichier « # Philosophie » suivi de « à écrire plus tard » répété comptait son
      // propre titre comme une preuve de substance et ressortait TROUVÉ.
      const corpsTexte = lignes.filter((l) => l !== h1).join("\n");
      const titre = c.motifsChemin.some((m) => m.test(h1)) ? 3 : 0;
      const nom = c.motifsChemin.some((m) => m.test(chemin.split("/").pop())) ? 2 : 0;
      const corps = c.marqueurs.filter((m) => m.test(corpsTexte)).length;
      return { total: titre + nom + corps, titre, nom, corps };
    };
    const notes = [];
    for (const ch of candidats) {
      let t = ""; try { t = lire(ch); } catch { continue; }
      if (t.length <= 400) continue; // un texte fondateur de moins de 400 caractères n'en est pas un
      notes.push({ chemin: ch, taille: t.length, ...noter(ch, t) });
    }
    notes.sort((a, b) => b.total - a.total || b.titre - a.titre || b.taille - a.taille);
    const meilleur = notes[0] ?? null;
    // TROUVÉ EXIGE LES DEUX À LA FOIS : une INTENTION déclarée (le titre ou le nom du fichier dit
    // que ce document est ça) ET une SUBSTANCE dans le corps. L'un sans l'autre ne suffit jamais —
    // un README qui ne parle de rien avait l'intention sans la substance, un fichier vide sous un
    // beau titre avait le titre sans le reste. Les deux cas se sont présentés en vrai.
    const trouve = meilleur && meilleur.total >= 3 && (meilleur.titre > 0 || meilleur.nom > 0) && meilleur.corps >= 1 ? meilleur : null;
    // ET UNE COQUILLE N'EST PAS N'IMPORTE QUEL FICHIER DU VOISINAGE : c'est un document qui
    // ANNONCE le sujet (par son titre) ou l'EFFLEURE (par son corps) sans le porter. Un fichier
    // qui ne fait que ressembler par son nom n'est pas une coquille, c'est un autre fichier.
    const coquilles = trouve ? [] : notes.filter((n) => n.titre > 0 || n.corps > 0).slice(0, 3);
    return {
      cle: c.cle, quoi: c.quoi,
      etat: trouve ? "TROUVÉ" : (coquilles.length ? "COQUILLE" : "ABSENT"),
      ou: trouve?.chemin ?? coquilles[0]?.chemin ?? null,
      score: trouve?.total ?? coquilles[0]?.total ?? 0,
      candidatsExamines: candidats.length,
      coquilles,
    };
  });

  const trous = resultats.filter((r) => r.etat !== "TROUVÉ");
  return {
    mesurable: true, fichiersExamines: fichiers.length, tronque, cases: resultats, trous,
    // CE QUE LE DIAGNOSTIC AUTORISE ENSUITE, et il ne le fait jamais tout seul : une case ABSENTE
    // ou COQUILLE est une case que la révélation peut PROPOSER de remplir depuis le corpus réel du
    // projet d'accueil. Proposer, jamais écrire : installer une Agence ne donne à personne le
    // droit de décider de la philosophie du projet qui l'accueille.
    generable: trous.length > 0,
    verdict: tronque
      ? `BALAYAGE TRONQUÉ au plafond de ${maxFichiers} fichiers : des dossiers n'ont pas été visités, donc une case « ABSENT » peut n'être qu'un dossier non vu. À relancer avec un plafond plus haut avant d'en tirer quoi que ce soit.`
      : trous.length === 0
      ? "ce projet déclare déjà ses trois textes fondateurs — l'Agence s'y branche sans rien proposer"
      : `${trous.length} case(s) fondatrice(s) manquante(s) ou vides (${trous.map((t) => `${t.cle}:${t.etat}`).join(", ")}) — la révélation peut PROPOSER de les remplir depuis le corpus réel de ce projet, jamais les écrire d'autorité`,
  };
}

// LA CLAUSE QUI NE SE RETIRE PAS (2026-10-02, sa demande, et elle est structurante) : quand
// l'Agence génère l'objectif ultime d'un projet d'accueil, cet objectif porte toujours le rôle
// exécutif de l'Agence — « (objectif du projet) appuyé du soutien apporté par l'agence ».
//
// POURQUOI ELLE EST NON RETIRABLE, DANS SES MOTS : « cette partie agence ne pourra pas etre
// retirée pour garantir une coherence globale ». Un objectif ultime qui oublierait l'outillage qui
// le sert produirait exactement l'incohérence que ce projet-ci a mis des semaines à corriger chez
// lui : deux projets menés en parallèle dont un seul est déclaré.
export const CLAUSE_AGENCE = "appuyé du soutien apporté par l'agence";

export function objectifAvecClause(objectifUtilisateur, { clause = CLAUSE_AGENCE } = {}) {
  const base = String(objectifUtilisateur ?? "").trim().replace(/[.\s]+$/, "");
  if (!base) return { mesurable: false, pourquoi: "aucun objectif utilisateur fourni : la clause s'ajoute à un objectif, elle n'en tient jamais lieu" };
  if (base.toLowerCase().includes(clause.toLowerCase())) return { mesurable: true, objectif: base, clauseDejaPresente: true };
  return { mesurable: true, objectif: `${base}, ${clause}`, clauseDejaPresente: false };
}

// LA SECONDE RÉVÉLATION (2026-10-01, sa demande : « on devra aussi faire cet exercice de REVELER à
// nouveau, quand on aura fini, pour voir si la revelation fait bien remonter la philo et la
// politique. DOnc bonne idee d'avoir equipe The-King, assure toi qu'il sera pret »).
//
// CE QUE « PRÊT » VEUT DIRE ICI, ET CE N'EST PAS « SAVOIR RELANCER ». Relancer, il sait déjà
// faire. Ce qui manque, c'est de pouvoir répondre à SA question : la révélation fait-elle REMONTER
// ce que nous aurons écrit ? Cette question est une COMPARAISON entre deux passages, et une
// comparaison faite de mémoire ne vaut rien.
//
// D'OÙ L'ÉTAT MACHINE, DÉPOSÉ À CHAQUE PASSAGE À CÔTÉ DU RAPPORT LISIBLE. Le `.txt` est pour
// l'humain, le `.json` est pour le prochain passage. Sans lui, « comparer » exigerait de reparser
// de la prose — c'est-à-dire d'écrire un second parseur qui divergerait du premier (Article 24).
export function etatDeLaRevelation(r) {
  if (!r?.mesurable) return { mesurable: false, pourquoi: r?.pourquoi ?? "révélation non mesurable" };
  return {
    mesurable: true,
    fichiers: r.fichiersLus,
    convictions: r.convictions,
    principesBoussole: r.boussole.principes,
    seuil: r.seuil.valeur,
    casesVides: r.cadre.vides.slice().sort(),
    parNiveau: r.parNiveau,
    tensions: r.tensions?.mesurable ? r.tensions.tensions.length : null,
    // L'INDICATEUR QUI RÉPOND À SA QUESTION : la part des convictions retenues que la boussole
    // porte DÉJÀ. Aujourd'hui 1 sur 87. Si la boussole a bien absorbé ce que le corpus croit,
    // cette part doit MONTER au passage suivant — et si elle ne monte pas, l'écriture n'a pas
    // servi, quoi qu'en dise l'impression de l'avoir bien faite.
    couverture: (() => {
      const tops = [...new Map(r.cadre.cases.flatMap((c) => c.top).map((t) => [t.phrase, t])).values()];
      const couvertes = tops.filter((t) => t.boussole.couverte).length;
      return { retenues: tops.length, couvertes, part: tops.length ? Number((couvertes / tops.length).toFixed(3)) : null };
    })(),
  };
}

// comparerRevelations() — deux états, et un verdict qui sait dire « je ne peux pas conclure ».
export function comparerRevelations(avant, apres) {
  if (!avant?.mesurable || !apres?.mesurable) {
    return { mesurable: false, pourquoi: "il faut DEUX passages mesurables pour comparer — un seul ne dit rien sur une évolution, et un zéro de comparaison n'est jamais un « rien n'a changé »" };
  }
  const d = (a, b) => Number((b - a).toFixed(3));
  const casesComblees = avant.casesVides.filter((c) => !apres.casesVides.includes(c));
  const casesNouvelles = apres.casesVides.filter((c) => !avant.casesVides.includes(c));
  const partAvant = avant.couverture.part ?? 0;
  const partApres = apres.couverture.part ?? 0;
  return {
    mesurable: true,
    couverture: { avant: partAvant, apres: partApres, delta: d(partAvant, partApres) },
    convictions: { avant: avant.convictions, apres: apres.convictions, delta: apres.convictions - avant.convictions },
    principes: { avant: avant.principesBoussole, apres: apres.principesBoussole, delta: apres.principesBoussole - avant.principesBoussole },
    casesComblees, casesNouvelles,
    // LE VERDICT EST VOLONTAIREMENT SÉVÈRE : écrire des principes fait monter le compte de
    // principes sans rien prouver. La seule preuve que l'écriture a SERVI est que le corpus se
    // reconnaisse davantage dedans — donc que la couverture monte. Un compte de principes qui
    // grimpe à couverture stable veut dire qu'on a écrit à côté de ce que le projet croit.
    verdict: partApres > partAvant ? "LA PHILOSOPHIE REMONTE — le corpus se reconnaît davantage dans la boussole qu'au passage précédent"
      : partApres === partAvant ? "STABLE — la boussole ne capte pas plus du corpus qu'avant, même si elle a grossi"
      : "EN RECUL — le corpus s'est éloigné de la boussole : soit le corpus a bougé, soit la boussole a été écrite à côté",
  };
}

// ============================================================================
// L'INTANGIBILITÉ DU DOCUMENT DE GOUVERNANCE (2026-10-02, tâche #1429)
//
// LA RÈGLE POSÉE : « CE document remplace définitivement les autres et devient le document
// officiel du projet. Il ne peut etre modifié qu'avec mon accord. [...] Ce format doit être
// consigné, et jamais modifié. »
//
// CE QU'AUCUN CODE NE PEUT VÉRIFIER, ET LE DÉCLARER EST LA PROTECTION (art. 32 du document
// lui-même) : qu'un accord ait été donné. Aucune empreinte, aucun test, aucun crochet git ne
// distingue une modification autorisée d'une modification faite de sa propre initiative.
//
// CE QU'UN CODE PEUT VÉRIFIER, ET QUI EST FAIT ICI : que le document n'a pas changé SANS QUE
// PERSONNE NE S'EN APERÇOIVE, et que sa FORME est restée celle qui a été arrêtée. Une
// modification devient alors un acte visible, qui doit être assumé — c'est le maximum qu'une
// mécanique puisse apporter à une règle qui se joue entre deux personnes.
//
// LA FORME EST VÉRIFIÉE PAR SA STRUCTURE, JAMAIS PAR SON TEXTE : un document dont on contrôlerait
// le texte mot à mot serait un document qu'on ne pourrait plus corriger même avec accord. Ce qui
// est gardé est son ossature — les titres dans leur ordre, et la numérotation continue des
// articles. C'est exactement ce que l'article 70 déclare fixe.
// ============================================================================

export const DOCUMENT_OFFICIEL = "docs/philosophie-et-politique.md";
export const EMPREINTE_OFFICIELLE = "docs/the-king/empreinte-document-officiel.json";

// LES TITRES ATTENDUS SE LISENT DANS LE DOCUMENT AU MOMENT OÙ L'EMPREINTE EST POSÉE, jamais
// recopiés ici (Article 24) : une liste de titres écrite dans le code se périmerait à la première
// édition, et c'est précisément ce que la règle de forme interdit de laisser arriver en silence.
export function ossatureDuDocument(texte) {
  const lignes = String(texte ?? "").split("\n");
  const titres = lignes.filter((l) => /^#{1,2}\s/.test(l)).map((l) => l.replace(/^#+\s*/, "").trim());
  const articles = lignes
    .map((l) => l.match(/^#{2,3}\s+Article\s+(\d+)\b/) ?? l.match(/^\|\s*\*\*(\d+)\*\*\s*\|/))
    .filter(Boolean).map((m) => Number(m[1]));
  return { titres, articles, nbTitres: titres.length, nbArticles: articles.length };
}

export function verifierLOssature(texte) {
  const o = ossatureDuDocument(texte);
  if (!o.nbArticles) {
    return { mesurable: false, pourquoi: "aucun article trouvé : ce zéro dit que la lecture a échoué, jamais que le document est vide" };
  }
  // LA NUMÉROTATION DOIT ÊTRE CONTINUE ET SANS DOUBLON. Un article dupliqué ou un trou dans la
  // suite signale soit une insertion au milieu, soit une suppression — les deux sont exactement
  // ce que l'article 70 interdit de faire passer inaperçu.
  const tries = o.articles.slice().sort((a, b) => a - b);
  const doublons = tries.filter((n, i) => i > 0 && n === tries[i - 1]);
  const trous = [];
  for (let n = tries[0]; n < tries[tries.length - 1]; n += 1) if (!tries.includes(n)) trous.push(n);
  return {
    mesurable: true, ...o,
    premier: tries[0], dernier: tries[tries.length - 1],
    doublons: [...new Set(doublons)], trous,
    conforme: doublons.length === 0 && trous.length === 0,
  };
}

export function lireLEmpreinte({ root = ROOT, chemin = EMPREINTE_OFFICIELLE, lireImpl = null } = {}) {
  const lire = lireImpl ?? ((c) => readFileSync(join(root, c), "utf8"));
  try { return { trouvee: true, ...JSON.parse(lire(chemin)) }; }
  catch { return { trouvee: false, pourquoi: "aucune empreinte enregistrée : une première pose est nécessaire avant tout contrôle, et son absence n'est jamais une conformité" }; }
}

export function comparerALEmpreinte(texte, empreinte) {
  if (!empreinte?.trouvee) return { mesurable: false, pourquoi: empreinte?.pourquoi ?? "empreinte absente" };
  const o = verifierLOssature(texte);
  if (!o.mesurable) return { mesurable: false, pourquoi: o.pourquoi };
  const titresPerdus = (empreinte.titres ?? []).filter((t) => !o.titres.includes(t));
  const titresAjoutes = o.titres.filter((t) => !(empreinte.titres ?? []).includes(t));
  const inchange = titresPerdus.length === 0 && titresAjoutes.length === 0 && o.nbArticles === empreinte.nbArticles;
  return {
    mesurable: true, inchange, titresPerdus, titresAjoutes,
    articles: { avant: empreinte.nbArticles, maintenant: o.nbArticles },
    verdict: inchange
      ? "ossature inchangée depuis la pose de l'empreinte"
      : `OSSATURE MODIFIÉE — ${titresPerdus.length} titre(s) disparu(s), ${titresAjoutes.length} ajouté(s), ${empreinte.nbArticles} article(s) devenus ${o.nbArticles}. L'article 71 exige un accord exprès et préalable : cette modification doit être assumée, jamais constatée après coup.`,
  };
}

export function poserLEmpreinte({ root = ROOT, document = DOCUMENT_OFFICIEL, chemin = EMPREINTE_OFFICIELLE, lireImpl = null, ecrireImpl = null, date = new Date().toISOString().slice(0, 10) } = {}) {
  const lire = lireImpl ?? ((c) => readFileSync(join(root, c), "utf8"));
  const ecrire = ecrireImpl ?? ((c, t) => writeFileSync(join(root, c), t, "utf8"));
  let texte = ""; try { texte = lire(document); } catch { return { mesurable: false, pourquoi: `document officiel introuvable (${document})` }; }
  const o = verifierLOssature(texte);
  if (!o.mesurable) return { mesurable: false, pourquoi: o.pourquoi };
  const empreinte = { document, pose: date, titres: o.titres, nbTitres: o.nbTitres, nbArticles: o.nbArticles, premier: o.premier, dernier: o.dernier };
  ecrire(chemin, JSON.stringify(empreinte, null, 2) + "\n");
  return { mesurable: true, ...empreinte, conforme: o.conforme };
}

// LE RAPPORT DE RÉVÉLATION — un FICHIER, jamais seulement un affichage (Article 31 : le livrable
// est le fichier produit par l'outil ; mon texte le commente, il ne le remplace pas).
export function formatRevelationLines(r) {
  const L = [];
  if (!r.mesurable) { L.push(`🚨 PAS MESURÉ — ${r.pourquoi}`); return L; }
  L.push(`=== RÉVÉLATION DE LA PHILOSOPHIE — ce que le corpus croit déjà ===`);
  L.push("");
  L.push(`Corpus : ${r.fichiersLus}/${r.fichiersDeclares} fichier(s) lus · ${r.convictions} convictions extraites`);
  L.push(`Vocabulaire retenu : ${r.vocabulaire.retenu} mots (plafond de fréquence ${r.vocabulaire.plafond} fichiers ; ${r.vocabulaire.ecartesCommeOutils} mots écartés comme noms d'outils)`);
  L.push(`Seuil d'étendue DÉRIVÉ : ${r.seuil.valeur} fichier(s) (75e centile observé = ${r.seuil.derive}, maximum observé = ${r.seuil.max})`);
  L.push(`Boussole actuelle : ${r.boussole.principes} principes dans ${r.boussole.chemin}`);
  L.push(`Niveaux : ` + Object.entries(r.parNiveau).map(([k, v]) => `${k} ${v}`).join(" · "));
  L.push("");
  const vides = r.cadre.vides;
  if (r.tensions?.mesurable) {
    L.push(r.tensions.tensions.length
      ? `⚠️  MATIÈRE BRUTE — ${r.tensions.tensions.length} tension(s) possible(s) entre convictions révélées (${r.tensions.pairesPossibles} paires comparées) : le corpus n'est pas lisse, et une extraction qui le prétendrait mentirait`
      : `✅ MATIÈRE BRUTE — aucune tension détectée entre les convictions révélées (${r.tensions.pairesPossibles} paires comparées, la plus proche à ${r.tensions.plusProche?.jaccard ?? "?"})`);
    for (const t of (r.tensions.tensions ?? []).slice(0, 10)) {
      L.push(`     · vocabulaire partagé ${t.jaccard} :`);
      L.push(`         A — ${t.texteA}`);
      L.push(`         B — ${t.texteB}`);
    }
  } else {
    L.push(`🚨 MATIÈRE BRUTE — tensions PAS MESURÉES : ${r.tensions?.pourquoi ?? "raison non fournie"}`);
  }
  L.push("");
  L.push(vides.length
    ? `⚠️  ${vides.length} case(s) du cadre standard VIDES — le corpus ne les porte pas : ${vides.join(", ")}`
    : `✅ les ${r.cadre.cases.length} cases du cadre standard sont portées par le corpus`);
  L.push("");
  for (const bloc of ["philosophie", "politique", "impossibles"]) {
    L.push(`───────────── ${bloc.toUpperCase()} ─────────────`);
    for (const c of r.cadre.cases.filter((x) => x.bloc === bloc)) {
      L.push("");
      L.push(`▸ ${c.titre}  [${c.cle}]`);
      L.push(`  ${c.convictions} conviction(s) dans ${c.fichiers} fichier(s) · ${c.retenues} au-dessus du seuil · niveaux : projet ${c.parNiveau.projet} / jeu ${c.parNiveau.jeu} / agence ${c.parNiveau.agence} / indéterminé ${c.parNiveau.indetermine}`);
      if (c.vide) { L.push(`  🚨 AUCUNE conviction du corpus ne tient ce rôle — c'est un vrai trou, pas un défaut de mesure (${c.convictions} candidates, toutes sous le seuil d'étendue).`); continue; }
      for (const t of c.top) {
        L.push(`  · [${t.rep.zones} zones · ${t.rep.fichiers} fichiers · ${t.niveau}${t.boussole.couverte ? " · DÉJÀ dans la boussole" : " · INAVOUÉ"}] ${t.phrase}`);
        L.push(`      zones : ${t.rep.listeZones.join(", ")}`);
        L.push(`      ↳ ${t.chemin}`);
      }
    }
    L.push("");
  }
  return L;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
