// priorites.mjs — L'ÉCHELLE DE PRIORITÉ DES TÂCHES, et les règles qui la gouvernent.
//
// Construit le 2026-09-23 (nuit autonome, chantier 1 du plan), après 32 calibrages avec
// l'utilisateur. PROPRIÉTAIRE DÉCLARÉ : check-tasks-details, promu ce jour-là « responsable de
// l'organisation des tâches » par décision explicite. Ce fichier est son implémentation, jamais un
// second décideur — il ne s'exécute pas seul et ne produit aucun rapport de son côté.
//
// POURQUOI UN MODULE SÉPARÉ plutôt que dans check-tasks-details.mjs : ce fichier-là fait déjà
// 1164 lignes, est cité par 16 autres et lu par le filet de sécurité — tool-brain le classe
// SENSIBLE, donc « seules les modifications à risque faible peuvent y être appliquées ». Y verser
// une échelle neuve entière aurait été un risque élevé sur un nœud central. Ici, le risque est nul.
//
// ————————————————————————————————————————————————————————————————————————
// CE QUE CETTE ÉCHELLE REMPLACE, et pourquoi ce n'est pas un ajout
// ————————————————————————————————————————————————————————————————————————
//
// Le suivi portait jusqu'ici un champ de GRAVITÉ (« critique » / « important » / « normal »,
// 343 lignes mesurées). Décision de l'utilisateur : la nouvelle échelle le REMPLACE, elle ne
// cohabite pas avec lui. La raison est nette une fois qu'on la voit : « critique » disait à quel
// point c'était grave, la nouvelle échelle dit QUAND il faut le faire. Garder les deux aurait
// obligé à trancher, à chaque lecture, laquelle des deux commande l'ordre de travail.

// CE FICHIER EST UN MODULE DE RÈGLES, PAS UN OUTIL DE L'AGENCE (2026-09-23).
// Même hébergement que criticite.mjs : l'échelle et son calcul appartiennent au process qui s'en sert.
// Sans ce marqueur, integration-outil réclamait pour lui un blueprint, une fiche et une place
// au catalogue — dix inscriptions pour un module qui n'a rien en propre à documenter.
export const PROCESS_HOTE = "etat-des-taches";

import { readFileSync } from "node:fs";

// ————————————————————————————————————————————————————————————————————————
// LES SIX PALIERS — libellés figés, définitions calibrées
// ————————————————————————————————————————————————————————————————————————
//
// LES LIBELLÉS SONT RIGIDES ET NE SE RENOMMENT PAS : décision explicite de l'utilisateur
// (« ces paliers doivent être conservés tels quels »). Les DÉFINITIONS, elles, ont été affinées
// avec lui à partir de ses propres formulations.
//
// LA FRONTIÈRE ENTRE DEUX PALIERS REPOSE SUR UNE SEULE QUESTION, et c'est ce qui rend l'échelle
// utilisable : **qu'est-ce que ça coûte d'attendre ?** Calibrage explicite, choisi contre deux
// alternatives (la gravité du sujet, qui aurait recréé l'ancien champ ; et un croisement des deux,
// qui se serait discuté à chaque tâche et aurait ralenti le moment où il faut aller vite).
//
// `rang` est l'ordre de sévérité, et lui seul sert aux comparaisons — jamais la position dans le
// tableau, qui se réordonnerait au premier remaniement sans que rien ne le signale.
export const PALIERS = [
  {
    cle: "CRITIQUE-RISQUES", rang: 6, icone: "🔴",
    coutDeLAttente: "attendre ABÎME quelque chose — une perte de données, un dégât qui s'aggrave, une valeur du projet qui s'érode",
    quoi: "ça craint, il faut le faire tout de suite",
    exemple: "un mécanisme qui écrit faux dans un registre : chaque passage aggrave ce qu'il faudra réparer",
  },
  {
    cle: "URGENT-RETARD", rang: 5, icone: "🟠",
    coutDeLAttente: "attendre COÛTE À CHAQUE TOUR de travail — le retard a des impacts significatifs répétés, pollue le travail ou le code",
    quoi: "en retard, et ce retard se paie encore à chaque fois qu'on passe à côté",
    exemple: "une alerte permanente que tout le monde a appris à ignorer : elle coûte de l'attention à chaque commit",
  },
  {
    cle: "PRIORITAIRE-OBLIGATOIRE", rang: 4, icone: "🟡",
    coutDeLAttente: "attendre RETARDE LE RESTE — d'autres travaux en dépendent, ou la décision qu'elle porte bloque une suite",
    quoi: "tâche importante à faire, qui tient d'autres choses derrière elle",
    exemple: "une réponse due à l'utilisateur : tant qu'elle manque, il ne peut pas trancher ce qui suit",
  },
  {
    cle: "RECOMMANDE-NECESSAIRE", rang: 3, icone: "🔵",
    coutDeLAttente: "attendre ne coûte RIEN D'IMMÉDIAT, mais la faire rapporte clairement plus qu'elle ne coûte",
    quoi: "à faire, sans que personne ne soit bloqué en attendant",
    exemple: "un garde-fou qui manque sur une zone calme : utile, jamais urgent",
  },
  {
    cle: "NORMAL-UTILE", rang: 2, icone: "⚪",
    coutDeLAttente: "attendre ne coûte rien, et le gain est réel mais modeste",
    quoi: "utile, à faire quand le moment s'y prête",
    exemple: "une amélioration de confort dans un rapport déjà lisible",
  },
  {
    cle: "MEMOIRE-NEXT", rang: 1, icone: "⚫",
    coutDeLAttente: "aucun coût, et aucune échéance — c'est une idée gardée pour un prochain grand chantier",
    quoi: "pour plus tard, pour un prochain grand chantier",
    exemple: "une refonte qu'on sait souhaitable et qui attend son moment",
  },
];

export const PALIERS_PAR_CLE = new Map(PALIERS.map((p) => [p.cle, p]));
export const PALIER_PAR_DEFAUT = "NORMAL-UTILE";

// LE CLIQUET — les trois paliers hauts ne redescendent jamais.
//
// Calibrage explicite : « seulement sur les trois étiquettes hautes ». Les trois basses bougent
// librement, ce qui évite de figer une tâche « normale » qui s'avère finalement inutile.
//
// CE QUE LE CLIQUET PROTÈGE, et ce n'est pas de la rigidité pour la rigidité : une fois qu'on a
// reconnu qu'une tâche était grave, la tentation de la déclasser vient rarement d'un fait nouveau —
// elle vient de la fatigue de la voir traîner. Le cliquet enlève cette sortie-là.
export const PALIERS_VERROUILLES = PALIERS.filter((p) => p.rang >= 4).map((p) => p.cle);

export function rangDe(cle) {
  return PALIERS_PAR_CLE.get(cle)?.rang ?? 0;
}

export function transitionAutorisee(ancien, nouveau) {
  if (!ancien) return { autorise: true, raison: "première étiquette" };
  if (!PALIERS_PAR_CLE.has(nouveau)) return { autorise: false, raison: `palier inconnu : ${nouveau}` };
  const monte = rangDe(nouveau) >= rangDe(ancien);
  if (monte) return { autorise: true, raison: rangDe(nouveau) === rangDe(ancien) ? "inchangée" : "surclassement" };
  if (!PALIERS_VERROUILLES.includes(ancien)) return { autorise: true, raison: "déclassement autorisé : les trois paliers bas bougent librement" };
  return { autorise: false, raison: `${ancien} est verrouillé : une étiquette haute ne peut qu'empirer, jamais redescendre — c'est ce qui empêche une tâche qui traîne d'être déclassée par lassitude plutôt que par un fait nouveau` };
}

// ————————————————————————————————————————————————————————————————————————
// LA CONVERSION DE L'ANCIENNE ÉCHELLE
// ————————————————————————————————————————————————————————————————————————
//
// Les lignes déjà écrites portent l'ancien champ de gravité. Elles sont TOUTES TERMINÉES, ce qui
// rend la conversion sûre : traduire « critique » par PRIORITAIRE ne fabrique aucune urgence
// fantôme, puisque plus rien n'attend. Traduire par CRITIQUE-RISQUES, en revanche, aurait rempli
// l'historique de fausses alarmes rétroactives.
//
// LA TABLE A ÉTÉ COMPLÉTÉE PENDANT LA CONVERSION ELLE-MÊME, et la façon dont c'est arrivé vaut
// d'être notée : le script de conversion COMPTAIT les valeurs qu'il ne savait pas traduire au lieu
// de les laisser filer. Il a ainsi révélé `sensible` (29 lignes) et `mineur` (6), deux valeurs
// réellement employées que ma première table ignorait. Sans ce comptage, 35 lignes seraient restées
// dans l'ancien vocabulaire au milieu du nouveau — c'est-à-dire exactement la cohabitation de deux
// échelles que cette conversion existe pour supprimer.
export const CONVERSION_ANCIENNE_ECHELLE = {
  critique: "PRIORITAIRE-OBLIGATOIRE",
  important: "RECOMMANDE-NECESSAIRE",
  // Manifestement un synonyme d'« important » à l'usage : les lignes portent de la documentation et
  // de l'outillage, jamais un dégât en cours.
  sensible: "RECOMMANDE-NECESSAIRE",
  normal: "NORMAL-UTILE",
  // Infrastructure et méthode de travail — le palier du bas qui n'est pas réservé aux idées.
  mineur: "NORMAL-UTILE",
};

export function convertirAncienneGravite(valeur) {
  const v = String(valeur ?? "").trim().toLowerCase();
  return CONVERSION_ANCIENNE_ECHELLE[v] ?? null;
}

// ————————————————————————————————————————————————————————————————————————
// LE CALCUL AUTOMATIQUE — uniquement des signaux mesurables, et il les montre
// ————————————————————————————————————————————————————————————————————————
//
// Le calcul a le droit d'aller jusqu'à CRITIQUE inclus (calibrage explicite). C'est une autorité
// réelle, donc elle vient avec une contrainte qui l'est tout autant : **chaque étiquette affiche
// les signaux qui l'ont produite**. Sans ça elle n'est ni contestable ni crédible, et une machine
// qui peut crier au feu sans montrer le feu finit par crier pour rien.
//
// AUCUN SIGNAL N'EST UNE APPRÉCIATION. Chacun se lit dans un fichier, un compteur ou une date.
// Le calibrage écartait explicitement l'ajout de « mon jugement » : on ne saurait plus distinguer
// ce qui est mesuré de ce qui est estimé, ce que le projet interdit partout ailleurs.
export const SIGNAUX = [
  { cle: "degat-qui-saggrave", poids: 6, quoi: "un mécanisme écrit une donnée fausse, ou un dégât s'étend à chaque passage", ou: "signalé par un contrôleur avec ce motif" },
  { cle: "zone-maitresse", poids: 4, quoi: "la zone touchée est maîtresse ou critique (beaucoup de fichiers en dépendent)", ou: "criticité du fichier, déjà mesurée par ecotoken" },
  { cle: "cout-repete", poids: 4, quoi: "le retard se paie à chaque tour de travail (alerte permanente, bruit récurrent)", ou: "signalé par un contrôleur, ou compteur de répétitions" },
  { cle: "bloque-autre-chose", poids: 3, quoi: "une autre tâche ou une décision attend celle-ci", ou: "dépendance déclarée dans le suivi" },
  { cle: "dette-envers-utilisateur", poids: 3, quoi: "une réponse ou un livrable est dû à l'utilisateur", ou: "champ « pour qui » de la tâche" },
  { cle: "signale-par-un-controleur", poids: 2, quoi: "un outil du paysage l'a trouvé, ce n'est pas une intuition", ou: "plan d'action d'un rapport" },
  { cle: "sans-couverture-de-test", poids: 2, quoi: "la zone touchée n'est couverte par aucun test", ou: "AXA-CHECK" },
  { cle: "stagnation-confirmee", poids: 2, quoi: "la tâche est restée identique sur plusieurs rapports consécutifs", ou: "compteur de stagnation de check-tasks-details" },
  { cle: "priorite-absolue-demandee", poids: 5, quoi: "l'utilisateur a écrit « priorité absolue »", ou: "texte de la tâche" },
];

export const SIGNAUX_PAR_CLE = new Map(SIGNAUX.map((s) => [s.cle, s]));

// LES SEUILS, dérivés de la question unique « qu'est-ce que ça coûte d'attendre ? » — ils ne sont
// pas un barème inventé : chaque seuil correspond au moment où le coût change de nature.
export const SEUILS_PALIER = [
  { minimum: 10, palier: "CRITIQUE-RISQUES" },
  { minimum: 7, palier: "URGENT-RETARD" },
  { minimum: 4, palier: "PRIORITAIRE-OBLIGATOIRE" },
  { minimum: 2, palier: "RECOMMANDE-NECESSAIRE" },
  { minimum: 0, palier: PALIER_PAR_DEFAUT },
];

// UN RACCOURCI QUI PRIME SUR LE SCORE, et il est délibéré : un dégât qui s'aggrave EST la
// définition de CRITIQUE, quel que soit le reste. Passer par un total ferait dépendre le verdict
// d'autres signaux sans rapport, et pourrait rater le seul cas où il ne faut pas se tromper.
const SIGNAUX_CRITIQUES_DIRECTS = ["degat-qui-saggrave"];

export function calculerPalier(signauxObserves = []) {
  const connus = signauxObserves.filter((s) => SIGNAUX_PAR_CLE.has(s));
  const inconnus = signauxObserves.filter((s) => !SIGNAUX_PAR_CLE.has(s));
  // L5 appliquée au calcul lui-même : aucun signal observé n'est PAS un score de zéro, c'est une
  // absence de mesure. Rendre NORMAL dans ce cas ferait passer « je n'ai rien regardé » pour
  // « j'ai regardé et ce n'est pas urgent ».
  if (!connus.length) {
    return {
      palier: PALIER_PAR_DEFAUT, mesure: "pas mesuré", total: 0, signaux: [], inconnus,
      pourquoi: "aucun signal mesurable observé — le palier par défaut est posé faute de mesure, jamais parce que la tâche a été jugée peu urgente",
    };
  }
  const total = connus.reduce((n, s) => n + SIGNAUX_PAR_CLE.get(s).poids, 0);
  const direct = connus.find((s) => SIGNAUX_CRITIQUES_DIRECTS.includes(s));
  const palier = direct ? "CRITIQUE-RISQUES" : SEUILS_PALIER.find((s) => total >= s.minimum).palier;
  return {
    palier, mesure: "mesuré", total, inconnus,
    signaux: connus.map((s) => ({ cle: s, poids: SIGNAUX_PAR_CLE.get(s).poids, quoi: SIGNAUX_PAR_CLE.get(s).quoi })),
    pourquoi: direct
      ? `${direct} : un dégât qui s'aggrave est CRITIQUE par définition, quel que soit le reste`
      : `total ${total} — ${connus.map((s) => `${s} (${SIGNAUX_PAR_CLE.get(s).poids})`).join(" + ")}`,
  };
}

// ————————————————————————————————————————————————————————————————————————
// LA NATURE DU TRAVAIL — technique / créatif / mixte
// ————————————————————————————————————————————————————————————————————————
//
// TROIS VALEURS, JAMAIS DEUX (calibrage explicite) : forcer dans une case binaire des tâches qui
// sont honnêtement les deux aurait rendu le flag peu fiable, donc ignoré.
//
// CE QU'IL DÉCIDE, ET CE QU'IL NE DÉCIDE PAS — la distinction est le cœur du mécanisme :
// il choisit QUAND une tâche se fait (les techniques en priorité pendant la nuit autonome), et
// **jamais dans quel ordre**. L'ordre reste commandé par le palier seul. Sans cette séparation, une
// tâche CRITIQUE créative se retrouverait derrière une tâche technique mineure juste parce qu'il
// fait nuit — et le classement se mettrait à dépendre de l'heure.
export const NATURES = ["TECHNIQUE", "CREATIF", "MIXTE"];

const MOTS_TECHNIQUES = ["test", "refactor", "duplication", "couverture", "garde-fou", "registre", "index", "commit", "lint", "typage", "migration", "renommage", "câblage", "cablage", "script"];
const MOTS_CREATIFS = ["dialogue", "ton", "personnage", "lia", "noé", "noe", "récit", "recit", "narratif", "ambiance", "graphisme", "esthétique", "esthetique", "nom", "calibrage", "arbitrage", "décision", "decision", "conception"];

export function natureDeLaTache(texte = "") {
  const t = String(texte).toLowerCase();
  const technique = MOTS_TECHNIQUES.filter((m) => t.includes(m));
  const creatif = MOTS_CREATIFS.filter((m) => t.includes(m));
  // Aucun indice des deux côtés : on ne devine pas. Une nature inventée enverrait une tâche
  // créative dans la nuit, c'est-à-dire exactement le cas qu'on veut éviter.
  if (!technique.length && !creatif.length) return { nature: null, mesure: "pas mesuré", indices: [], pourquoi: "aucun indice dans le texte — la nature se déclare à la main plutôt que de se deviner" };
  if (technique.length && creatif.length) return { nature: "MIXTE", mesure: "mesuré", indices: [...technique, ...creatif], pourquoi: `indices des deux côtés (technique : ${technique.join(", ")} · créatif : ${creatif.join(", ")})` };
  if (technique.length) return { nature: "TECHNIQUE", mesure: "mesuré", indices: technique, pourquoi: `indices techniques : ${technique.join(", ")}` };
  return { nature: "CREATIF", mesure: "mesuré", indices: creatif, pourquoi: `indices créatifs : ${creatif.join(", ")}` };
}

// CE QUE LA NUIT AUTONOME A LE DROIT DE PRENDRE. Une tâche CRITIQUE mais CRÉATIVE n'est pas
// écartée : elle est INSTRUITE jusqu'au bord de la décision, et s'arrête là (calibrage explicite —
// « je prépare tout sauf la décision »). L'urgence est servie sans que l'agent décide à la place
// de l'utilisateur sur un sujet de goût.
export function traitableLaNuit(palier, nature) {
  if (nature === "TECHNIQUE") return { traitable: true, jusquou: "jusqu'au bout" };
  if (nature === "MIXTE") return { traitable: true, jusquou: "la moitié technique jusqu'au bout, la moitié créative instruite puis arrêtée avant la décision" };
  if (nature === "CREATIF") return { traitable: true, jusquou: "instruire le dossier (diagnostic, options, recommandation) et s'arrêter avant le choix" };
  return { traitable: false, jusquou: "nature non déterminée — à ne pas router automatiquement" };
}

// ————————————————————————————————————————————————————————————————————————
// LA BONNE NOUVELLE — 🎉 quand une tâche au moins PRIORITAIRE se résout
// ————————————————————————————————————————————————————————————————————————
//
// Demande explicite : « quand une tâche CRITIQUE / URGENT / PRIORITAIRE est résolue, c'est une
// bonne nouvelle ! il faut me le dire ». Une icône à côté de la tâche suffit — pas une phrase.
// Partout où la tâche est citée comme résolue (calibrage explicite) : suivi, rapports, comptes
// rendus. Une seule règle, aucun endroit où la bonne nouvelle se perd.
export const SEUIL_VICTOIRE = 4;

export function estUneVictoire(palier, statut = "") {
  const resolu = /termin|résolu|resolu|clos|fait/i.test(String(statut));
  return resolu && rangDe(palier) >= SEUIL_VICTOIRE;
}

export function marqueDeVictoire(palier, statut) {
  return estUneVictoire(palier, statut) ? "🎉" : "";
}

// ————————————————————————————————————————————————————————————————————————
// LE RENDU — une étiquette ne s'affiche jamais nue
// ————————————————————————————————————————————————————————————————————————
//
// L2 appliquée à ce module : un calcul qui n'atteint pas le lecteur est une intention. Le rendu
// vit donc ici, à côté du calcul, pour qu'aucun appelant n'ait à le réinventer — et pour qu'aucun
// n'affiche le palier sans les signaux qui le justifient.
export function formatPalier(resultat, { avecSignaux = true } = {}) {
  const p = PALIERS_PAR_CLE.get(resultat.palier);
  const tete = `${p?.icone ?? "·"} ${resultat.palier}`;
  if (!avecSignaux) return tete;
  if (resultat.mesure !== "mesuré") return `${tete} — ${resultat.pourquoi}`;
  return `${tete} — ${resultat.pourquoi}`;
}

export function expliquerEchelle() {
  return PALIERS.map((p) => `${p.icone} ${p.cle} — ${p.coutDeLAttente}. ${p.quoi}.`);
}
