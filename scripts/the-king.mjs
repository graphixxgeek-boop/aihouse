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
import { readFileSync, readdirSync as fsReaddir, existsSync as fsExists } from "node:fs";
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

export function extractPrincipleUnits(text) {
  // Découpage partagé (lib-shell) ; ce qui reste ici est propre au texte fondateur : un principe
  // porte une partie, un numéro, un titre ET un tag — quatre champs là où la charte en a deux.
  return decouperEnUnites(text, SECTION_HEADING_PATTERN, {
    motifBorneSuperieure: TOP_HEADING_PATTERN,
    champs: (m) => ({ partie: Number(m[1]), numero: Number(m[2]), titre: m[3].trim(), tag: m[4].trim() }),
  });
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
export function principleDate(principle, options = {}) {
  const declaree = extractPrincipleDate(principle);
  if (declaree) return { date: declaree, provenance: "déclarée" };
  const git = principleDateFromGit(principle, options);
  return git ? { date: git, provenance: "git" } : { date: undefined, provenance: undefined };
}

// Digest chronologique de l'évolution du document — seulement les principes portant une date
// explicite, triés du plus ancien au plus récent (jamais l'ordre d'apparition dans le fichier, qui
// suit la numérotation des Parties/sections, pas la chronologie réelle d'ajout).
// `avecGit` (2026-09-22, tâche #196) : par défaut le digest interroge l'historique réel pour les
// principes sans date déclarée — sans quoi il ne racontait l'histoire que de 2 principes sur 19.
// Désactivable (`avecGit: false`) pour les tests, qui ne doivent jamais dépendre de l'état du dépôt.
export function buildEvolutionDigest(principles, { avecGit = true, shImpl = sh } = {}) {
  return principles
    .map((p) => {
      const r = avecGit ? principleDate(p, { shImpl }) : { date: extractPrincipleDate(p), provenance: extractPrincipleDate(p) ? "déclarée" : undefined };
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
export const MOTIF_DECOULE_DE = /(?:^|\n)[ \t]*(?:[>*\-|#]|\/\/)*[ \t]*(?:\*\*)?D[ÉE]COULE DE\s*:?(?:\*\*)?\s*[:\s]\s*`?([^`\n<|]+?)`?\s*(?:\||$)/im;
export const RACINE_DE_LA_CASCADE = PHILOSOPHY_PATH;

export function parentDeclare(texte = "") {
  const m = MOTIF_DECOULE_DE.exec(String(texte));
  if (!m) return null;
  // LA CIBLE PEUT PORTER UNE PRÉCISION APRÈS LE CHEMIN (« …/la-cible.md §3 ») : on garde le chemin,
  // on jette le reste. Exiger un chemin nu ferait refuser la forme la plus utile — celle qui dit de
  // QUEL passage du parent l'objet découle.
  const brut = m[1].trim().replace(/\s*[§#].*$/, "").replace(/\s*\(.*$/, "").trim();
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

function main({ chemin = PHILOSOPHY_PATH } = {}) {
  printReportHeader({ tool: "the-king", title: "THE-KING — veille philosophie et politique", scriptPath: "scripts/the-king.mjs" });
  recordCliUsage("the-king");
  const requestText = process.argv.slice(2).join(" ");
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
  const digest = buildEvolutionDigest(principles);
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

if (import.meta.url === `file://${process.argv[1]}`) main();
