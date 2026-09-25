#!/usr/bin/env node
// OÙ ON EN EST — le récapitulatif de ce qui a été FAIT, et de ce que le projet y a gagné.
//
// D'OÙ IL VIENT (2026-09-23, demande explicite de l'utilisateur) : « peux-tu me faire un compte
// rendu global de ce qui a été fait dernièrement ? me dire comment le projet a évolué, avec
// quelles améliorations ? […] est-ce que ce récap peut être fait à chaque Ronde ? »
//
// POURQUOI IL N'EST NI UN DOUBLON DE LA RONDE NI DE L'ÉTAT DES TÂCHES, et c'est la question que
// l'utilisateur a posée lui-même. Trois dispositifs lisent les mêmes tâches, et chacun répond à
// une question que les deux autres ne posent pas :
//
//   · la Ronde (`check-tasks-report`)  → « rien n'a-t-il DÉRIVÉ pendant que je travaillais ? »
//   · l'état des tâches                → « qu'est-ce qu'on FAIT maintenant ? »
//   · celui-ci                         → « qu'est-ce qui a été FAIT, et qu'est-ce que ça a changé ? »
//
// Les deux premiers regardent la FILE ; celui-ci regarde le CHEMIN PARCOURU. Fusionner les trois
// perdrait à chaque fois l'un des angles : une surveillance qui réclame une décision cesse d'être
// une surveillance, et un bilan de progression noyé dans une file de tâches ne se lit jamais.
//
// IL SE DÉRIVE, IL NE S'ÉCRIT PAS À LA MAIN (Article 24) : tout ce qu'il affiche est relu dans
// `docs/suivi/` au moment de l'exécution. Un compte rendu rédigé une fois serait faux la semaine
// suivante, et c'est exactement la dette que ce projet passe son temps à corriger ailleurs.
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { renderHtmlReport } from "./html-report.mjs";
import { printReliabilityNotice } from "./lib-shell.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
export const SESSIONS_DIR = "docs/suivi/sessions";

// Une ligne de tâche du registre durable. Les colonnes sont celles du gabarit à 8 colonnes
// (N° | Horodatage | Mot-clé | Sujet | Sous-sujet | Sensibilité | Description | Statut), lues par
// position et non devinées — un tableau qui changerait de forme doit faire échouer la lecture
// plutôt que produire des lignes à moitié fausses (leçon L12 : un analyseur qui devine saute en
// silence, il doit refuser à la place).
export function parseTaches(texte = "") {
  const taches = [];
  for (const ligne of String(texte).split("\n")) {
    if (!ligne.startsWith("|")) continue;
    const c = ligne.split("|").map((x) => x.trim());
    if (c.length < 9) continue;
    const [, numero, horodatage, motCle, sujet, sousSujet, sensibilite, description, statut] = c;
    if (!/^\d+$/.test(numero)) continue;
    taches.push({ numero: Number(numero), horodatage, motCle, sujet, sousSujet, sensibilite, description, statut });
  }
  return taches;
}

export function chargerTaches({ root = ROOT, listDirImpl = readdirSync, readFileImpl = readFileSync, exists = existsSync } = {}) {
  const dossier = join(root, SESSIONS_DIR);
  if (!exists(dossier)) return { taches: [], fichiers: [], dossierAbsent: true };
  const fichiers = listDirImpl(dossier).filter((f) => f.endsWith(".md")).sort();
  const taches = [];
  for (const f of fichiers) {
    try { taches.push(...parseTaches(readFileImpl(join(dossier, f), "utf8"))); } catch { /* un fichier illisible ne se compte pas comme lu */ }
  }
  return { taches, fichiers, dossierAbsent: false };
}

// TERMINÉE, et rien d'autre. Le registre écrit « terminé le … », « terminée », « fait » ; tout le
// reste (« à faire », « en cours », vide) n'est PAS un travail accompli. Le mot est lu au début du
// statut plutôt que cherché n'importe où dans la cellule : « reste à faire une fois terminé »
// contient les deux, et compter sur la présence d'un mot ferait entrer une tâche ouverte ici.
export const STATUT_FAIT = /^(termin|fait\b|clos)/i;
export function estTerminee(tache) { return STATUT_FAIT.test(String(tache?.statut ?? "").trim()); }

// LA PÉRIODE SE DÉRIVE DES DONNÉES, jamais d'une date en dur : « dernièrement » veut dire les N
// derniers jours effectivement présents dans le registre, pas les N derniers jours du calendrier.
// Sur un projet qui travaille par salves, compter en jours calendaires afficherait « 0 tâche »
// après trois jours sans session, ce qui serait faux : il ne s'est rien passé, pas rien été fait.
export function derniereJournee(taches = []) {
  const jours = [...new Set(taches.map((t) => String(t.horodatage).slice(0, 10)).filter((j) => /^\d{4}-\d{2}-\d{2}$/.test(j)))].sort();
  return jours.at(-1) ?? null;
}

export function periode(taches = [], joursVoulus = 2) {
  const jours = [...new Set(taches.map((t) => String(t.horodatage).slice(0, 10)).filter((j) => /^\d{4}-\d{2}-\d{2}$/.test(j)))].sort();
  const retenus = jours.slice(-joursVoulus);
  return { jours: retenus, depuis: retenus[0] ?? null };
}

// Le SUJET du registre est déjà l'axe de regroupement du projet (« Jeu / Article 11 »,
// « Agence / Article 25 »…). On le coupe sur son premier séparateur : le grand domaine suffit ici,
// le détail vit dans la tâche elle-même.
// LES GRANDS DOMAINES (2026-09-23, choix de l'utilisateur : « normaliser : une liste de grands
// domaines »). Le premier jet rangeait les tâches par le Sujet brut du registre : 71 domaines
// distincts, dont 40 n'en portaient qu'UNE. Les pourcentages qui en sortaient étaient exacts au mot
// et trompeurs au sens — « Outillage de travail » (30) coexistait avec « Outillage » (16), le même
// sujet coupé en deux, et le compte rendu suggérait une répartition que la donnée ne portait pas.
//
// C'EST UN VOCABULAIRE FERMÉ, pas une liste qui grandira (Article 24 l'exempte explicitement) :
// ces six domaines couvrent la totalité de ce que ce projet fait, et n'ont rien à synchroniser avec
// un autre système. Ce qui pourrait se périmer, en revanche, c'est leur CAPACITÉ À TOUT RANGER —
// d'où findDomainesNonRanges() juste en dessous, qui nomme tout Sujet réel qu'aucun motif
// n'attrape. Une liste sans ce garde-fou serait exactement la dette que l'Article 24 interdit.
//
// L'ORDRE COMPTE : le premier motif qui matche gagne, donc le plus spécifique passe en premier.
// « Nouvel outil (construction de circle-tasks) » doit tomber dans Outillage, pas dans Ronde.
export const GRANDS_DOMAINES = [
  ["Le jeu", /jeu|personnage|dialogue|moteur|enqu[êe]te|simulation|graphis|r[ée]v[ée]lation|maison|lia|no[ée]/i],
  ["Charte et référentiels", /charte|r[ée]f[ée]rentiel|article|principe|param[èe]tre|documentation|vocabulaire|\bdoc\b/i],
  ["Process et méthode", /process|m[ée]thode|conduite|ronde|[ée]valuation|organisation|agence|r[èe]gles? de travail|mode autonome|d[ée]cision/i],
  ["Outillage", /outil|outillage|script|agent|gardien|kpi|tableau de bord|correctif de code|\bcode\b|rapport|infrastructure/i],
  // DERNIER FILET, STRUCTUREL PLUTÔT QU'ÉNUMÉRÉ, et il est SENSIBLE À LA CASSE exprès : dans ce
  // projet, un nom d'outil s'écrit en capitales avec des tirets (SAFE-EXPORT, CIRCLE-TASKS,
  // EVAL-DEV, TOOL-LEARNING…). Les reconnaître à leur FORME évite d'allonger indéfiniment une
  // liste de noms propres — le travers que la charte interdit, et qu'un outil neuf ferait revenir
  // dès le premier jour. Séparé des motifs ci-dessus parce qu'eux doivent ignorer la casse et que
  // celui-ci en dépend entièrement : les fusionner rendrait « rapport » et « RAPPORT » identiques
  // et ferait matcher n'importe quel mot de quatre lettres.
  ["Outillage", /\b[A-Z][A-Z-]{3,}\b/],
  ["Suivi des tâches", /suivi|t[âa]che|chantier|\bplan\b/i],
  ["Conso et tokens", /conso|token|quota|\bapi\b/i],
];
export const DOMAINE_PAR_DEFAUT = "Non classé";

// Le garde-fou de la liste ci-dessus : tout Sujet réel qu'aucun motif n'attrape est NOMMÉ, plutôt
// que rangé en silence dans « Non classé » où personne ne le verrait jamais.
export function findDomainesNonRanges(taches = []) {
  const orphelins = new Map();
  for (const t of taches) {
    const brut = String(t?.sujet ?? "").trim();
    if (!brut) continue;
    if (GRANDS_DOMAINES.some(([, motif]) => motif.test(brut))) continue;
    orphelins.set(brut, (orphelins.get(brut) ?? 0) + 1);
  }
  return [...orphelins.entries()].map(([sujet, n]) => ({ sujet, taches: n })).sort((a, b) => b.taches - a.taches);
}

export function domaineDe(tache) {
  const brut = String(tache?.sujet ?? "").trim();
  if (!brut) return DOMAINE_PAR_DEFAUT;
  const trouve = GRANDS_DOMAINES.find(([, motif]) => motif.test(brut));
  return trouve ? trouve[0] : DOMAINE_PAR_DEFAUT;
}

export function bilan(taches = [], { joursVoulus = 2 } = {}) {
  const p = periode(taches, joursVoulus);
  const dansLaPeriode = taches.filter((t) => p.jours.includes(String(t.horodatage).slice(0, 10)));
  const faites = dansLaPeriode.filter(estTerminee);
  const ouvertes = taches.filter((t) => !estTerminee(t));
  const parDomaine = {};
  for (const t of faites) (parDomaine[domaineDe(t)] ??= []).push(t);
  return {
    mesurable: taches.length > 0,
    total: taches.length,
    periode: p,
    faitesPeriode: faites,
    ouvertesTotal: ouvertes,
    parDomaine: Object.entries(parDomaine).sort((a, b) => b[1].length - a[1].length),
    nonRanges: findDomainesNonRanges(taches),
  };
}

// La première phrase d'une description tient lieu de résumé : c'est là que le registre met ce
// qu'il faut retenir, le reste étant la démonstration. On coupe au premier point suivi d'un blanc,
// jamais à un nombre de caractères — couper au milieu d'un mot rend un résumé illisible.
export function resumeCourt(description = "", max = 240) {
  const texte = String(description).replace(/\*\*/g, "").trim();
  const point = texte.search(/\.\s/);
  const phrase = point > 40 ? texte.slice(0, point + 1) : texte;
  return phrase.length > max ? `${phrase.slice(0, max).replace(/\s+\S*$/, "")}…` : phrase;
}

// UN RAPPORT LIVRÉ PÉRIMÉ EST PIRE QU'UN RAPPORT ABSENT (2026-09-23, erreur réelle commise
// l'heure même où cet outil a été construit). Le rapport a été généré, cinq tâches ont été
// ajoutées ensuite, et il a été LIVRÉ sans être régénéré : 249/485 annoncés là où la vérité était
// 252/490. Le défaut n'est pas l'inattention — c'est qu'AUCUN mécanisme ne reliait « je livre ce
// rapport » à « ce rapport est à jour ». Un chiffre faux dans un document de pilotage se propage
// dans toutes les décisions qu'il éclaire.
//
// L'EMPREINTE EST LE NOMBRE DE TÂCHES LUES, pas une date : deux rapports générés à la même minute
// sur deux registres différents doivent se distinguer, et une date ne le dirait pas.
// LE MARQUEUR N'UTILISE AUCUN GUILLEMET, et ce détail est payé : la première version écrivait
// `data-taches-lues="490"`, que le rendu HTML échappe en `&quot;490&quot;` — le lecteur ne
// retrouvait donc jamais sa propre empreinte et déclarait tout rapport « sans empreinte ».
// Trouvé en le branchant sur la VRAIE sortie ; un test sur une chaîne inventée serait passé
// (leçon L16, second volet). Deux-points : rien à échapper, rien à casser.
export const MARQUEUR_EMPREINTE = "data-taches-lues:";
export function empreinteDuRapport(html = "") {
  const m = String(html).match(new RegExp(`${MARQUEUR_EMPREINTE}(\\d+)`));
  return m ? Number(m[1]) : null;
}
export function rapportPerime(html, tachesActuelles) {
  const lues = empreinteDuRapport(html);
  if (lues === null) return { perime: true, mesurable: false, pourquoi: "le rapport ne porte aucune empreinte — impossible de savoir sur quoi il a été calculé, ce qui n'est jamais la même chose que savoir qu'il est à jour" };
  if (lues !== tachesActuelles) return { perime: true, mesurable: true, pourquoi: `calculé sur ${lues} tâche(s), le registre en porte ${tachesActuelles} — à régénérer avant toute livraison` };
  return { perime: false, mesurable: true, pourquoi: `à jour : ${lues} tâche(s), les mêmes que le registre` };
}

export function buildOuOnEnEstHtml(b, { dateLabel = new Date().toISOString().slice(0, 10) } = {}) {
  const blocks = [];
  if (!b.mesurable) {
    blocks.push({ type: "highlight", heading: "Rien n'a été mesuré", paragraphs: ["Aucune tâche lue dans le registre durable. Ce n'est pas « rien à signaler » : c'est « rien n'a pu être lu ». Les deux se ressemblent à l'écran, et c'est précisément ce qui rend ce cas dangereux."] });
    return renderHtmlReport({ tool: "Où on en est", title: "Où on en est", subtitle: "ce qui a été fait, et ce que le projet y a gagné", dateLabel, blocks });
  }
  blocks.push({ type: "highlight", heading: "En une phrase", paragraphs: [
    `${b.faitesPeriode.length} tâche(s) terminée(s) sur ${b.periode.jours.length} journée(s) de travail (depuis le ${b.periode.depuis}), sur ${b.total} tâches tracées depuis la création du registre. ${b.ouvertesTotal.length} restent ouvertes.`,
    "Ce document répond à « qu'est-ce qui a été fait, et qu'est-ce que ça a changé ? ». Il ne dit PAS quoi faire ensuite (c'est l'état des tâches) ni si quelque chose a dérivé (c'est la Ronde).",
  ] });
  blocks.push({ type: "heading", text: "Par domaine — où l'effort est réellement allé" });
  blocks.push({ type: "table", headers: ["Domaine", "Tâches terminées", "Part"], rows: b.parDomaine.map(([d, l]) => [d, String(l.length), `${Math.round((100 * l.length) / (b.faitesPeriode.length || 1))} %`]) });
  for (const [domaine, liste] of b.parDomaine) {
    blocks.push({ type: "heading", text: `${domaine} — ${liste.length} tâche(s)` });
    blocks.push({ type: "list", items: liste.sort((a, c) => a.numero - c.numero).map((t) => `#${t.numero} — ${t.sousSujet} · ${resumeCourt(t.description)}`) });
  }
  if (b.nonRanges?.length) {
    blocks.push({ type: "heading", text: "Ce que le rangement n'attrape pas" });
    blocks.push({ type: "paragraph", text: `${b.nonRanges.length} sujet(s) du registre ne tombent dans aucun grand domaine et sont comptés « Non classé ». Ce n'est pas un défaut du registre : c'est la limite de la table de rangement, nommée plutôt que masquée — sans cette liste, ces tâches disparaîtraient dans une case fourre-tout que personne ne regarde.` });
    blocks.push({ type: "list", items: b.nonRanges.slice(0, 12).map((o) => `${o.sujet} (${o.taches} tâche(s))`) });
  }
  blocks.push({ type: "heading", text: "Ce qui reste ouvert" });
  blocks.push({ type: "list", items: b.ouvertesTotal.sort((a, c) => a.numero - c.numero).map((t) => `#${t.numero} — ${t.sousSujet} (${t.sensibilite})`) });
  blocks.push({ type: "note", text: "Limite déclarée : ce bilan lit le registre durable, jamais le code. Une tâche mal décrite y sera mal résumée — il dit ce qui a été ÉCRIT comme fait, et c'est une mesure de la discipline de suivi autant que du travail." });
  // L'empreinte voyage AVEC le rapport, jamais dans un fichier à côté qui se perdrait.
  blocks.push({ type: "note", text: `Empreinte de ce rapport (${MARQUEUR_EMPREINTE}${b.total}) : calculé sur ${b.total} tâche(s) lues. Un rapport dont l'empreinte diffère du registre est périmé, et se régénère avant d'être livré.` });
  return renderHtmlReport({ tool: "Où on en est", title: "Où on en est", subtitle: "ce qui a été fait, et ce que le projet y a gagné", dateLabel, blocks });
}

function main() {
  // L'AVERTISSEMENT DE MARGE, DIT ET PAS SEULEMENT DÉCLARÉ (2026-09-25, tâche #653 → #808) :
  // sa nature heuristique était écrite dans TOOL_RELIABILITY et aucun chemin de ce script ne la
  // prononçait — une protection écrite qui ne sort jamais, le fil rouge de ce projet.
  printReliabilityNotice("ou-on-en-est");
  const { taches, fichiers, dossierAbsent } = chargerTaches();
  const b = bilan(taches, { joursVoulus: Number(process.argv[3]) || 2 });
  const sortie = process.argv[2] || join(ROOT, "docs/ou-on-en-est/ou-on-en-est.html");
  console.log("=== OÙ ON EN EST — ce qui a été fait, et ce que le projet y a gagné ===\n");
  if (dossierAbsent || !taches.length) {
    console.log("⚠️  Aucune tâche lue — rien n'a été mesuré, ce qui n'est jamais la même chose que rien trouvé.");
  } else {
    console.log(`${fichiers.length} fichier(s) de session lu(s), ${taches.length} tâche(s) au total — c'est le dénominateur.`);
    console.log(`${b.faitesPeriode.length} terminée(s) sur la période (${b.periode.jours.join(", ")}), ${b.ouvertesTotal.length} ouverte(s).`);
    for (const [d, l] of b.parDomaine) console.log(`   · ${d} : ${l.length}`);
  }
  writeFileSync(sortie, buildOuOnEnEstHtml(b), "utf8");
  console.log(`\nRapport HTML : ${sortie}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
