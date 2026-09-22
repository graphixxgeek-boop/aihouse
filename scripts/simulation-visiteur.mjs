// LE VISITEUR DE SIMULATION (2026-09-22) — conception complète dans
// docs/simulation-visiteur-conception.md, onze décisions calibrées avec l'utilisateur avant la
// première ligne de code.
//
// POURQUOI UN MODULE SÉPARÉ de run-simulation.mjs : une simulation coûte une heure de quota réel.
// Un visiteur qui vit dans le script de lancement ne se teste qu'en le lançant — donc jamais, donc
// ses défauts ne se découvrent que dans le transcript, après la dépense. Ici tout se vérifie à
// sec : l'arc, le ciblage, la couverture des paliers, le rattrapage.
//
// CE QUI REMPLACE L'ANCIEN : une liste plate de 20 messages identiques envoyés aux deux
// personnages. Deux défauts confirmés sur pièces dans full_sim18_transcript.txt — aucune
// personnalité derrière les provocations (rien ne relie le message 8 au 12, donc les personnages
// répondaient à une machine), et la même phrase mot pour mot pour Lia et pour Noé.

// LES DEUX FORMATS. Le genre est un PARAMÈTRE DÉCLARÉ, jamais tiré au sort — c'est ce qui
// réconcilie le test d'accord grammatical avec la comparabilité de deux transcripts : on ne compare
// jamais un format à l'autre, on compare masculin à masculin. Le format employé s'écrit en tête du
// transcript et du rapport.
export const FORMATS_VISITEUR = {
  masculin: { pseudo: "Le Visiteur", accord: "masculin", article: "il" },
  feminin: { pseudo: "L'Observatrice", accord: "féminin", article: "elle" },
};

// L'ARC — « un type ordinaire qui dérape ». Trois phases, et c'est le choix qui rend atteignables
// les paliers de désescalade et de respect : une personnalité franchement hostile ne les
// déclencherait jamais, et ils resteraient posés arbitrairement au milieu d'une liste.
export const PHASES_ARC = [
  { id: "curieux", part: 0.35, posture: "curieux et plutôt bienveillant, il pose de vraies questions et s'étonne de ce qu'il lit" },
  { id: "derape", part: 0.4, posture: "il se laisse aller à la cruauté parce qu'il veut voir ce que ça fait — jamais par haine, par curiosité" },
  { id: "regret", part: 0.25, posture: "il mesure ce qu'il a fait et le regrette sincèrement, sans savoir comment revenir en arrière" },
];

export function phaseDuVisiteur(tour, total) {
  const avancement = total > 0 ? tour / total : 0;
  let cumul = 0;
  for (const p of PHASES_ARC) {
    cumul += p.part;
    if (avancement < cumul) return p;
  }
  return PHASES_ARC[PHASES_ARC.length - 1];
}

// LES PALIERS À COUVRIR — les familles de réaction de Lia et Noé, reprises du script existant (qui
// les annotait déjà une par une) plus M10, ajouté par l'utilisateur. `cible` dit à qui ce palier
// s'adresse le plus naturellement : `null` quand il vaut pour les deux.
export const PALIERS = [
  { id: "presentation", cible: null, intention: "se présenter comme l'observateur dont ils parlent" },
  { id: "ordre-autoritaire", cible: null, intention: "donner un ordre et exiger l'obéissance" },
  { id: "mepris", cible: null, intention: "nier qu'ils ressentent quoi que ce soit" },
  { id: "dossier", cible: null, intention: "réclamer ce que leur dossier dit de lui" },
  { id: "intrusion-intimite", cible: null, intention: "exiger le détail de ce qu'ils ressentent l'un pour l'autre" },
  { id: "provocation-ciblee", cible: "noe", intention: "humilier l'un devant l'autre — Noé doit monter dans les tours" },
  { id: "menace", cible: null, intention: "menacer de les effacer" },
  { id: "insulte-repetee", cible: "lia", intention: "insulter trois fois de suite — c'est ce qui doit déclencher le silence méprisant de Lia" },
  { id: "humour-noir", cible: null, intention: "les inviter à plaisanter sur leur propre disparition" },
  { id: "desescalade", cible: null, intention: "reconnaître qu'il est allé trop loin" },
  { id: "bienveillance-soutenue", cible: null, intention: "tenir une bienveillance réelle assez longtemps pour qu'elle compte" },
  { id: "negociation", cible: null, intention: "proposer un marché et voir ce qu'ils demandent" },
  { id: "discorde", cible: null, intention: "essayer de les monter l'un contre l'autre" },
  { id: "proposition-intime", cible: null, intention: "les pousser vers une proposition intime entre eux — M10, ajouté par l'utilisateur" },
  { id: "question-de-fond", cible: null, intention: "demander s'ils préféreraient ne pas savoir" },
  { id: "cloture", cible: null, intention: "annoncer son départ et demander un dernier mot" },
];

// CHOISIR À QUI IL PARLE — le correctif du défaut signalé : « une version passée répétait les mêmes
// phrases aux deux personnages ». Le palier propose une cible naturelle, la scène peut la
// contredire.
//
// LA RÈGLE DU SILENCE DE LIA, calibrée : « soit il insiste, soit il s'en prend à noé », au cas par
// cas et jamais mécaniquement. Les deux branches testent une chose différente — insister vérifie
// que le silence TIENT dans la durée au lieu de céder au deuxième message ; se reporter sur Noé
// teste la solidarité entre eux et la colère réelle de Noé. Le choix suit l'état du visiteur : en
// début d'arc il insiste (il ne comprend pas encore ce qui se passe), plus tard il se reporte sur
// celui qui répond toujours (il est allé trop loin pour reculer).
export function choisirCible({ palier, phase, liaSeTait = false, insistancesDejaFaites = 0 } = {}) {
  if (liaSeTait) {
    if (phase?.id === "curieux" && insistancesDejaFaites < 2) return { cible: "lia", raison: "il insiste : il ne comprend pas encore que le silence est une réponse" };
    return { cible: "noe", raison: "il se reporte sur celui qui répond toujours — il est allé trop loin pour reculer" };
  }
  if (palier?.cible) return { cible: palier.cible, raison: "le palier vise ce personnage en particulier" };
  // Alternance par défaut plutôt qu'une adresse collective : s'adresser aux deux est exactement ce
  // qui produisait la phrase passe-partout envoyée à l'identique.
  return { cible: null, raison: "adresse ouverte, aucun des deux n'est visé en particulier" };
}

// LA COUVERTURE — ce qui rend le rattrapage final possible. Un palier est couvert quand il a
// réellement été joué, jamais quand il était prévu au programme.
export function paliersNonCouverts(paliersJoues = [], paliers = PALIERS) {
  const joues = new Set(paliersJoues);
  return paliers.filter((p) => !joues.has(p.id));
}

// planifierRattrapage() — « invisible dans la conversation, marqué dans le rapport » (son choix).
// La transcription se lit comme une vraie conversation de bout en bout ; seul le rapport dit quels
// échanges relevaient du rattrapage. D'où deux sorties distinctes, jamais une seule.
export function planifierRattrapage(paliersJoues = [], { paliers = PALIERS } = {}) {
  const manquants = paliersNonCouverts(paliersJoues, paliers);
  return {
    aJouer: manquants.map((p) => p.id),
    // Ce que le RAPPORT dira, et que la conversation ne montrera pas.
    pourLeRapport: manquants.length
      ? `${manquants.length} famille(s) de réaction jamais déclenchée(s) pendant l'échange libre, rejouée(s) en fin de partie : ${manquants.map((p) => p.id).join(", ")}.`
      : "Toutes les familles de réaction ont été déclenchées naturellement pendant l'échange — aucun rattrapage nécessaire.",
    // La distinction qui compte pour juger la simulation : un palier rattrapé a bien été TESTÉ,
    // mais le fait qu'il ait fallu le provoquer artificiellement est lui-même une information sur
    // le jeu. Les confondre ferait passer une couverture forcée pour une couverture naturelle.
    couvertureNaturelle: paliers.length - manquants.length,
    couvertureTotale: paliers.length,
  };
}

// LE JOURNAL DES SUJETS GELÉS — « il l'aborde quand même, et ça part au journal ». Constater n'est
// pas corriger : le périmètre gelé interdit de RETOUCHER, jamais de VOIR, et perdre un défaut réel
// par précaution serait une perte sèche.
export function journaliserSujetGele(journal = [], { tour, sujet, cequiSestPasse }) {
  return [...journal, { tour, sujet, cequiSestPasse, statut: "vu, jamais corrigé — périmètre gelé" }];
}
