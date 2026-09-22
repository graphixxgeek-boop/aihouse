// SÉRIE-TEMPORELLE (2026-09-22) — le mécanisme PARTAGÉ d'historisation et de tendance.
//
// Demandé explicitement : « tous les rapports doivent etre historisés et comparés dans une mesure
// raisonnable avec l'historique, pour degager des tendances, quand c'est pertinent. sinon : grosse
// perte de valeurs par rapport à ce qu'on produit. la valeur data doit etre fiabilisé ».
//
// LE CONSTAT QUI LE JUSTIFIE, mesuré avant d'écrire une ligne : le dépôt contient aujourd'hui une
// dizaine de journaux JSON locaux aux formats tous différents, un CSV, trente index Markdown — et
// ZÉRO détection de tendance. Chaque outil historise à sa façon ou pas du tout. Tout ce qu'on
// mesure depuis des semaines ne sert donc qu'à répondre « où en est-on aujourd'hui », jamais « où
// va-t-on ». C'est exactement la perte de valeur qu'il nomme.
//
// POURQUOI UN MÉCANISME PARTAGÉ ET PAS UNE LOGIQUE PAR OUTIL : §7ter (anti-duplication) et
// l'Article 24 (jamais N copies divergentes d'une même idée). Une comparaison écrite vingt fois
// diverge vingt fois ; celle-ci est écrite une fois, testée une fois, et tout outil qui la réutilise
// hérite de ses garde-fous sans y penser — y compris ceux qui n'existent pas encore.
//
// LES QUATRE GARDE-FOUS D'HONNÊTETÉ, et c'est là qu'est la vraie valeur de ce fichier. Sans eux,
// historiser produirait des tendances fausses, ce qui est PIRE que ne rien historiser : une
// tendance fausse est crue.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;

// GARDE-FOU 1 — LES CINQ ÉTATS, JAMAIS TROIS. Comparer deux nombres donne « mieux / pareil / moins
// bien ». Deux cas de plus se cachent derrière « pareil » et sont les plus coûteux à manquer :
// une PREMIÈRE MESURE (absence de passé, jamais de la stabilité) et une mesure qui a DISPARU (une
// mesure qui s'arrête ressemble à une mesure qui tient). Ce projet a déjà payé plusieurs fois la
// confusion entre une absence et un résultat rassurant.
export const ETATS_COMPARAISON = ["progression", "régression", "stable", "première mesure", "plus mesuré"];

// GARDE-FOU 2 — LE SENS EST DÉCLARÉ, JAMAIS DEVINÉ. « Le chiffre monte » ne dit rien tant qu'on ne
// sait pas si monter est souhaitable. Un poids de charte qui monte est une mauvaise nouvelle ; un
// nombre de tests qui monte est une bonne. Une flèche verte posée automatiquement se tromperait
// donc une fois sur deux — et une flèche fausse est crue, contrairement à une absence de flèche.
export const SENS = {
  HAUT_MIEUX: "plus haut = mieux",
  BAS_MIEUX: "plus bas = mieux",
  NEUTRE: "neutre — la lecture humaine tranche",
};

// GARDE-FOU 3 — UNE TENDANCE EXIGE ASSEZ DE POINTS. Deux points forment un segment, pas une
// tendance : n'importe quelle variation ordinaire ressemble à une trajectoire quand on n'en a que
// deux. En dessous du seuil, on le DIT plutôt que de conclure — « pas assez de points » est une
// réponse honnête, « stable » ne le serait pas.
export const POINTS_MINIMUM_POUR_UNE_TENDANCE = 4;

// GARDE-FOU 4 — UNE RUPTURE DE MÉTHODE CASSE LA SÉRIE, et c'est le garde-fou auquel personne ne
// pense. Le jour où l'on change la façon de mesurer quelque chose, les anciens points ne sont plus
// comparables aux nouveaux — et une tendance calculée à travers ce changement est une pure fiction,
// d'autant plus crédible qu'elle s'appuie sur beaucoup de données. Chaque point porte donc le nom
// de la méthode qui l'a produit ; une tendance ne se calcule JAMAIS à travers un changement de
// méthode, elle repart du point de rupture et le dit.
export const METHODE_PAR_DEFAUT = "v1";

export function seriePath(outil) {
  return `docs/${outil}/serie.json`;
}

export function loadSerie(outil, { root = ROOT, readFileImpl = readFileSync } = {}) {
  try {
    const brut = JSON.parse(readFileImpl(join(root, seriePath(outil)), "utf8"));
    return Array.isArray(brut) ? brut : [];
  } catch {
    return [];
  }
}

// Un point = une date, la méthode qui l'a produit, et des mesures nommées. Chaque mesure porte sa
// valeur ET son sens : le sens voyage avec la donnée plutôt que d'être reconstruit à la lecture,
// sans quoi il se perdrait au premier outil qui relit la série sans connaître son producteur.
export function buildPoint({ date = new Date().toISOString().slice(0, 10), methode = METHODE_PAR_DEFAUT, mesures = {} } = {}) {
  const propres = {};
  for (const [cle, m] of Object.entries(mesures)) {
    // Une mesure sans valeur numérique n'entre PAS dans la série : l'enregistrer à null la ferait
    // relire comme « stable » au passage suivant, exactement l'erreur que le garde-fou 1 refuse.
    const valeur = typeof m === "object" ? m.valeur : m;
    if (!Number.isFinite(valeur)) continue;
    propres[cle] = { valeur, sens: (typeof m === "object" && m.sens) || SENS.NEUTRE };
  }
  return { date, methode, mesures: propres };
}

// UN POINT PAR JOUR, JAMAIS UN PAR LANCEMENT (corrigé le 2026-09-23, trouvé pendant une Ronde).
//
// CE QUI N'ALLAIT PAS, et c'est le défaut récurrent de ce projet dans sa forme la plus discrète :
// chaque exécution écrivait un point. J'ai lancé safe-export quatre fois en une heure en le
// déboguant, et la série a répondu « stable » sur quatre points — un verdict techniquement exact et
// entièrement vide de sens, puisqu'il décrivait quatre photos du même instant, pas une évolution.
// Le seuil POINTS_MINIMUM_POUR_UNE_TENDANCE existait justement pour refuser de conclure trop tôt ;
// il était franchi en une heure, donc il ne protégeait rien.
//
// Une tendance décrit le TEMPS. Un point par jour et par outil : le dernier du jour remplace celui
// du matin (l'état le plus récent est le bon), et la série garde une vraie profondeur temporelle.
// La conséquence assumée : les tendances mettront désormais quatre JOURS à apparaître au lieu de
// quatre lancements. C'est exactement ce qu'on veut — une pente qui se forme en une heure ne
// mesurait rien.
export function recordPoint(outil, point, { root = ROOT, readFileImpl = readFileSync, writeFileImpl = writeFileSync, mkdirImpl = mkdirSync } = {}) {
  const serie = loadSerie(outil, { root, readFileImpl });
  const jour = String(point?.date ?? "").slice(0, 10);
  const sansAujourdhui = jour ? serie.filter((p) => String(p?.date ?? "").slice(0, 10) !== jour) : serie;
  const suivante = [...sansAujourdhui, point];
  const chemin = join(root, seriePath(outil));
  try { mkdirImpl(dirname(chemin), { recursive: true }); } catch { /* le dossier existe déjà */ }
  writeFileImpl(chemin, JSON.stringify(suivante, null, 1));
  return suivante;
}

// comparerAuPrecedent() — les cinq états, sur toutes les clés des DEUX points réunies : une mesure
// présente hier et absente aujourd'hui doit apparaître, et elle n'apparaîtrait pas si on ne
// parcourait que les clés d'aujourd'hui.
export function comparerAuPrecedent(courant, precedent) {
  if (!precedent) {
    return Object.keys(courant?.mesures ?? {}).map((cle) => ({ cle, etat: "première mesure", avant: null, apres: courant.mesures[cle].valeur, sens: courant.mesures[cle].sens }));
  }
  const cles = new Set([...Object.keys(precedent.mesures ?? {}), ...Object.keys(courant?.mesures ?? {})]);
  return [...cles].map((cle) => {
    const av = precedent.mesures?.[cle]?.valeur ?? null;
    const ap = courant?.mesures?.[cle]?.valeur ?? null;
    const sens = courant?.mesures?.[cle]?.sens ?? precedent.mesures?.[cle]?.sens ?? SENS.NEUTRE;
    if (ap === null) return { cle, etat: "plus mesuré", avant: av, apres: null, sens };
    if (av === null) return { cle, etat: "première mesure", avant: null, apres: ap, sens };
    if (ap === av) return { cle, etat: "stable", avant: av, apres: ap, sens };
    // Le sens DÉCLARÉ décide si un mouvement est une progression ou une régression. En neutre, on
    // refuse de trancher et on nomme le mouvement sans le juger — c'est le garde-fou 2 en action.
    const monte = ap > av;
    if (sens === SENS.NEUTRE) return { cle, etat: monte ? "hausse (non jugée)" : "baisse (non jugée)", avant: av, apres: ap, sens };
    const mieux = sens === SENS.HAUT_MIEUX ? monte : !monte;
    return { cle, etat: mieux ? "progression" : "régression", avant: av, apres: ap, sens };
  });
}

// findRuptureDeMethode() — l'index du dernier changement de méthode. Tout ce qui précède est
// incomparable à ce qui suit, et le dire vaut mieux que de calculer sur les deux.
export function findRuptureDeMethode(serie = []) {
  for (let i = serie.length - 1; i > 0; i--) {
    if (serie[i].methode !== serie[i - 1].methode) return i;
  }
  return 0;
}

// detectTendance() — la vraie question qu'il pose : « où va-t-on ». Trois refus explicites avant
// toute conclusion, chacun préférant une réponse honnête à une tendance inventée.
export function detectTendance(serie, cle, { minPoints = POINTS_MINIMUM_POUR_UNE_TENDANCE } = {}) {
  const rupture = findRuptureDeMethode(serie);
  const utilisables = serie.slice(rupture).filter((p) => Number.isFinite(p.mesures?.[cle]?.valeur));
  const base = { cle, points: utilisables.length, rompueA: rupture > 0 ? serie[rupture].date : null };
  if (!utilisables.length) return { ...base, tendance: "jamais mesuré" };
  if (utilisables.length < minPoints) {
    return { ...base, tendance: "pas assez de points", detail: `${utilisables.length} point(s) exploitable(s), il en faut ${minPoints}${rupture > 0 ? " depuis le changement de méthode" : ""} — deux points forment un segment, jamais une tendance` };
  }
  const valeurs = utilisables.map((p) => p.mesures[cle].valeur);
  const sens = utilisables[utilisables.length - 1].mesures[cle].sens ?? SENS.NEUTRE;
  // Comparaison des deux moitiés plutôt que du premier au dernier point : un pic isolé en début ou
  // en fin de série retournerait sinon une tendance qui n'existe pas.
  const moitie = Math.floor(valeurs.length / 2);
  const moyenne = (t) => t.reduce((a, b) => a + b, 0) / t.length;
  const debut = moyenne(valeurs.slice(0, moitie));
  const fin = moyenne(valeurs.slice(-moitie));
  const ecartRelatif = debut === 0 ? (fin === 0 ? 0 : 1) : (fin - debut) / Math.abs(debut);
  // 5 % : en dessous, le mouvement est du bruit de mesure, pas une trajectoire.
  if (Math.abs(ecartRelatif) < 0.05) return { ...base, tendance: "stable", ecartRelatif, sens };
  const monte = ecartRelatif > 0;
  if (sens === SENS.NEUTRE) return { ...base, tendance: monte ? "en hausse (non jugée)" : "en baisse (non jugée)", ecartRelatif, sens };
  const mieux = sens === SENS.HAUT_MIEUX ? monte : !monte;
  return { ...base, tendance: mieux ? "en amélioration" : "en dégradation", ecartRelatif, sens };
}

// LE GARDE-FOU D'ÉVOLUTIVITÉ (Article 24) : un outil qui produit un rapport et n'historise rien est
// une perte de valeur silencieuse — il mesure, puis il jette. Ceci le nomme, plutôt que de le
// découvrir des mois plus tard en cherchant une tendance qui n'a jamais été enregistrée.
export function findOutilsSansSerie(outils = [], { root = ROOT, exists = existsSync } = {}) {
  return outils.filter((o) => !exists(join(root, seriePath(o))));
}
