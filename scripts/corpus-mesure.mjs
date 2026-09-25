// CORPUS-MESURÉ — le mécanisme partagé qui empêche un Gardien sacré de dire « tout va bien »
// sur des données absentes (2026-09-25, tâche #858 — chantier #206, autorisé par l'utilisateur
// en fenêtre dédiée : « oui, les sept d'un coup »).
//
// ============================================================================================
// LE DÉFAUT, ET IL EST STRUCTUREL PLUTÔT QU'ACCIDENTEL
// ============================================================================================
//
// Un Gardien sacré reçoit une liste de fichiers et rend une liste de trouvailles. Une entrée
// vide donne une sortie vide, et RIEN dans la valeur rendue ne dit laquelle des deux situations
// on vient de vivre :
//   · « j'ai regardé 77 fichiers et tout va bien »   → un vrai vert, mérité ;
//   · « on ne m'a donné aucun fichier à regarder »   → aucune information, qui se LIT vert.
//
// Mesuré le 2026-09-23 en sondant les détecteurs pour de vrai plutôt qu'en le supposant
// (`docs/plans/audit-gardiens-donnees-absentes-2026-09-23.md`) : `findFuitesDeSpecificite`,
// `findOutilsSansBlueprint`, `findDuplicateBlocks` et `findNearDuplicateBlocks` rendent tous `[]`
// sur une entrée vide. Le même `[]` que sur un dépôt parfaitement propre.
//
// **Un rapport qui alerte à tort se fait corriger ; un rapport qui rassure à tort ne se fait
// jamais corriger, puisque personne ne va voir.** C'est ce déséquilibre qui rend ce défaut-là
// plus coûteux que son inverse, et c'est pour ça qu'il valait un chantier plutôt qu'une note.
//
// ============================================================================================
// POURQUOI UN MÉCANISME PARTAGÉ, ET PAS SEPT CORRECTIFS
// ============================================================================================
//
// Article 24 : « un registre se LIT, il ne s'énumère pas ; une fonctionnalité nouvelle s'applique
// à TOUS les outils existants le jour où elle est écrite ». Sept correctifs séparés auraient
// donné sept formulations différentes de la même idée, et le huitième Gardien serait né sans.
// Ici le mécanisme est écrit une fois : un Gardien de plus l'obtient en déclarant son corpus.
//
// POURQUOI AU NIVEAU DU CORPUS ET PAS DU DÉTECTEUR, et c'est la décision de conception centrale.
// Chaque Gardien porte plusieurs détecteurs (SAFE-EXPORT en a une douzaine). Les instrumenter un
// par un aurait multiplié le travail par dix pour répondre dix fois à la MÊME question, qui est
// posée une seule fois et en amont : **est-ce qu'on m'a donné quelque chose à regarder ?** Si le
// corpus est vide, aucun détecteur ne peut rien conclure, et le dire une fois au niveau du
// rapport est plus juste que de le répéter détecteur par détecteur.
//
// CE QUE ÇA NE CHANGE PAS, volontairement : aucune signature existante n'est touchée. Les
// détecteurs continuent de rendre leurs listes, tous leurs appelants et tous leurs tests
// continuent de fonctionner. C'est le patron déjà éprouvé par `churnSignalMesure()`
// (always-new-code.mjs, 2026-09-25) — une fonction COMPAGNE à côté, jamais une signature
// réécrite. Le plan du 2026-09-23 redoutait justement de « toucher à tous leurs appelants » ;
// cette forme-là supprime le risque au lieu de le gérer.

// TROIS ÉTATS, JAMAIS DEUX. Le troisième est tout l'intérêt : « pas mesuré » n'est ni un succès
// ni un échec, c'est une absence — et une absence qu'on nomme cesse d'être un faux vert.
export const ETATS_CORPUS = ["mesure", "vide", "illisible"];

// mesurerCorpus() — la seule fonction que chaque Gardien doit appeler.
//
// `fichiers` est ce que le Gardien s'apprête RÉELLEMENT à analyser, jamais ce qu'il espérait
// trouver. `attendus` (facultatif) est le nombre qu'il aurait dû obtenir : le renseigner permet
// de distinguer un corpus vide d'un corpus AMPUTÉ, qui est le cas le plus vicieux — 3 fichiers
// lus sur 77 rend un verdict qui a toutes les apparences d'un verdict complet.
// `unite` parce qu'un corpus n'est pas toujours fait de fichiers : HARMONIA balaie une table de
// LIENS, THE-KING des principes. Imprimer « 5 fichier(s) » pour cinq liens serait un chiffre juste
// avec un mot faux, et un lecteur qui doute du mot doute du chiffre (Article 15).
export function mesurerCorpus(fichiers, { quoi = "le corpus", attendus = null, pourquoiVide = null, unite = "fichier" } = {}) {
  if (!Array.isArray(fichiers)) {
    return {
      mesurable: false, etat: "illisible", lus: 0, attendus, unite,
      pourquoi: `${quoi} n'a pas pu être lu (aucune liste fournie) — ce n'est pas « aucun écart », c'est aucune donnée${pourquoiVide ? ` : ${pourquoiVide}` : ""}`,
    };
  }
  if (!fichiers.length) {
    return {
      mesurable: false, etat: "vide", lus: 0, attendus, unite,
      pourquoi: `${quoi} est VIDE : zéro ${unite} à analyser, donc tout verdict rendu ci-dessous porterait sur rien${pourquoiVide ? ` — ${pourquoiVide}` : ""}`,
    };
  }
  // Corpus amputé : mesurable, mais le verdict ne couvre pas ce qu'il prétend couvrir. On rend
  // `mesurable: true` (il y a bien eu une mesure) ET on porte la lacune, parce que refuser de
  // conclure sur 76 fichiers lus sur 77 serait aussi faux que de taire le manquant.
  const ampute = Number.isFinite(attendus) && attendus > fichiers.length;
  return {
    mesurable: true, etat: "mesure", lus: fichiers.length, attendus, unite,
    ampute,
    pourquoi: ampute
      ? `${quoi} : ${fichiers.length} ${unite}(s) analysé(s) sur ${attendus} attendu(s) — le verdict ci-dessous ne couvre PAS les ${attendus - fichiers.length} manquant(s)`
      : null,
  };
}

// LA LIGNE À IMPRIMER EN TÊTE DU RAPPORT, avant tout verdict. Le dénominateur voyage avec le
// chiffre (règle de maison) : « aucun écart » ne veut rien dire sans « sur combien ».
export function ligneCorpus(m, { nomDuGardien = "" } = {}) {
  const prefixe = nomDuGardien ? `${nomDuGardien} — ` : "";
  if (!m?.mesurable) return `🚨 ${prefixe}PAS MESURÉ : ${m?.pourquoi ?? "raison inconnue"}. Aucun verdict n'est rendu ci-dessous, et ce silence n'est PAS un « rien à signaler ».`;
  if (m.ampute) return `⚠️ ${prefixe}corpus INCOMPLET — ${m.pourquoi}.`;
  return `${prefixe}${m.lus} ${m.unite ?? "fichier"}(s) réellement analysé(s) — c'est le dénominateur de tout ce qui suit.`;
}

// LE GARDE-FOU DU GARDE-FOU (Article 24 pris par l'autre bout) : un Gardien sacré qui n'appelle
// jamais `mesurerCorpus()` retombe silencieusement dans le défaut que ce module existe pour
// fermer, et personne ne le saurait. On le vérifie donc mécaniquement plutôt que de compter sur
// la mémoire de l'agent qui ajoutera le huitième (Article 27).
export const GARDIENS_SACRES = [
  "check-argus", "check-harmonia", "axa-check", "clean-dirty-old",
  "clone-hunter", "always-new-code", "safe-export",
];

export function findGardiensSansMesureDeCorpus(sources = {}, { gardiens = GARDIENS_SACRES } = {}) {
  const manquants = [];
  const absents = [];
  for (const g of gardiens) {
    const src = sources[g];
    if (typeof src !== "string") { absents.push(g); continue; }
    if (!/mesurerCorpus\s*\(/.test(src)) manquants.push(g);
  }
  return {
    // Une source non fournie n'est PAS un Gardien en faute : c'est un Gardien non vérifié. Les
    // compter ensemble reproduirait exactement la confusion que tout ce module combat.
    mesurable: absents.length < gardiens.length,
    manquants, absents, verifies: gardiens.length - absents.length, total: gardiens.length,
    pourquoi: absents.length === gardiens.length ? "aucune source de Gardien fournie : rien n'a pu être vérifié" : null,
  };
}

export function formatGardiensSansMesureLines(r) {
  if (!r?.mesurable) return [`GARDIENS / mesure de corpus : PAS MESURÉ — ${r?.pourquoi ?? "aucune donnée"}`];
  const L = [];
  if (!r.manquants.length) L.push(`✅ Les ${r.verifies} Gardien(s) sacré(s) vérifié(s) déclarent tous leur corpus avant de conclure.`);
  else {
    L.push(`🔴 ${r.manquants.length}/${r.verifies} Gardien(s) sacré(s) concluent sans déclarer leur corpus : ${r.manquants.join(", ")}.`);
    L.push("   Sur une entrée vide ils rendraient « aucun écart », qui se lit exactement comme un dépôt propre.");
  }
  if (r.absents.length) L.push(`   (${r.absents.length} non vérifié(s), source non fournie : ${r.absents.join(", ")} — non vérifié n'est pas conforme.)`);
  return L;
}
