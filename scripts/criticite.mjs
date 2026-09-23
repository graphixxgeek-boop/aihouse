// criticite.mjs (2026-09-23) — LA CRITICITÉ D'UN CÔTÉ, L'URGENCE DE L'AUTRE.
//
// LE DÉFAUT QUE CE FICHIER RÉPARE, nommé par l'utilisateur : « la classification melange le crtiere
// de criticité avec le retard : pas bon ». Il avait raison, et ça se voit dans l'échelle elle-même :
// `URGENT-RETARD` (rang 5) est un niveau de RETARD assis au milieu d'une échelle de CRITICITÉ, donc
// au-dessus de `PRIORITAIRE-OBLIGATOIRE` (rang 4). Une tâche simplement en retard passait devant une
// tâche plus importante, et l'étiquette ne disait plus laquelle compte vraiment.
//
// CE QU'IL DEMANDE, ET C'EST EXACTEMENT CE QUI EST FAIT ICI : « un indicateur de criticité seul, qui
// combine tous les autres critères, y compris le "retard/delai". L'etiquette affiche seulement le
// resultat du calcul : la criticité, pendant qu'une petite vignette collé à côté, indique le niveau
// d'urgence. »
//
// SA PRÉCISION LA PLUS IMPORTANTE, ET ELLE EST FACILE À TRAHIR : « le critere d'urgence n'est pas
// diminué dans le calcul : il est simplement plus visible ». Les signaux liés au temps
// (`stagnation-confirmee`, `cout-repete`) gardent donc EXACTEMENT leur poids dans le score de
// criticité. Ce fichier ne retire rien au calcul : il retire un mot de retard de l'ÉTIQUETTE, et
// met le retard dans une vignette qu'on voit mieux qu'avant.
//
// LES QUATRE NIVEAUX SONT DÉRIVÉS DES RANGS EXISTANTS, jamais recopiés (Article 24) : un septième
// palier ajouté à PALIERS tombe dans le bon niveau sans qu'une ligne ne bouge ici.

// CE FICHIER EST UN MODULE DE RÈGLES, PAS UN OUTIL DE L'AGENCE (2026-09-23).
// L'échelle de criticité, l'urgence, le mot-clé et le format d'une tâche sont les données que le process d'état des tâches exécute — « les regles de priorité doivent etre hebergé dans l'equipe process ».
// Sans ce marqueur, integration-outil réclamait pour lui un blueprint, une fiche et une place
// au catalogue — dix inscriptions pour un module qui n'a rien en propre à documenter.
export const PROCESS_HOTE = "etat-des-taches";

import { PALIERS, PALIERS_PAR_CLE, calculerPalier, rangDe } from "./priorites.mjs";

// LES QUATRE NIVEAUX, calibrés par l'utilisateur en fenêtre le 2026-09-23 (« 4 niveaux nommés »,
// choisis contre une note sur 100 et contre une échelle à 3). Assez de nuance pour trancher, assez
// peu pour qu'on retienne ce que chacun veut dire.
export const NIVEAUX_CRITICITE = [
  { cle: "VITAL", rang: 4, icone: "🔴", quoi: "attendre abîme quelque chose", pourquoi: "une perte, un dégât qui s'aggrave, une valeur du projet qui s'érode — le seul niveau où le temps détruit au lieu de retarder" },
  { cle: "IMPORTANT", rang: 3, icone: "🟠", quoi: "attendre coûte, à chaque fois", pourquoi: "soit d'autres travaux en dépendent, soit le manque se paie à chaque passage — le coût est réel et répété, jamais ponctuel" },
  { cle: "UTILE", rang: 2, icone: "🔵", quoi: "la faire rapporte plus qu'elle ne coûte", pourquoi: "personne n'est bloqué en attendant, mais le gain est net et identifiable" },
  { cle: "CONFORT", rang: 1, icone: "⚪", quoi: "agréable, jamais nécessaire", pourquoi: "rien ne se dégrade si elle n'est jamais faite — elle ne mérite un tour que quand tout le reste est propre" },
];

export const CRITICITE_PAR_CLE = new Map(NIVEAUX_CRITICITE.map((n) => [n.cle, n]));

// LA CORRESPONDANCE, DÉRIVÉE DE LA SUBSTANCE et surtout PAS DU RANG — et cette distinction est
// toute la correction demandée.
//
// PREMIÈRE VERSION, ÉCRITE PUIS JETÉE LE JOUR MÊME : quatre tranches égales sur les six rangs. Le
// calcul était propre et le résultat faux — `URGENT-RETARD` (rang 5 sur 6) remontait en VITAL,
// c'est-à-dire exactement le mélange que l'utilisateur demandait de supprimer, reproduit par
// l'arithmétique. Un rang porte déjà la confusion qu'on répare ; s'appuyer dessus la recopie.
//
// CE QUI FAIT FOI À LA PLACE : le champ `coutDeLAttente`, que chaque palier déclare déjà et qui
// décrit précisément ce qu'on cherche — ce que coûte le fait d'attendre. Trois familles, dans
// l'ordre où elles se testent :
//   · attendre ABÎME (perte, dégât qui s'aggrave, valeur qui s'érode)          → VITAL
//   · attendre COÛTE, à chaque tour ou en retardant le reste                    → IMPORTANT
//   · attendre ne coûte RIEN mais faire rapporte                                → UTILE
//   · le reste (aucun coût, aucune échéance)                                    → CONFORT
//
// `URGENT-RETARD` tombe donc en IMPORTANT, à sa vraie place : son coût est réel et répété, il
// n'abîme rien. Son retard, lui, n'est pas perdu — il part dans la vignette, où il se voit mieux.
const FAMILLES_DE_COUT = [
  { motif: /ab[îi]me|perte de donn|d[ée]g[âa]t|s'[ée]rode/i, niveau: "VITAL" },
  { motif: /co[ûu]te? [àa] chaque|retarde le reste|d[ée]pendent|bloque une suite|impacts? significatifs/i, niveau: "IMPORTANT" },
  { motif: /rien d'imm[ée]diat|rapporte (?:clairement )?plus|gain est r[ée]el/i, niveau: "UTILE" },
];

export function criticiteDuPalier(clePalier, { paliers = PALIERS, niveaux = NIVEAUX_CRITICITE, familles = FAMILLES_DE_COUT } = {}) {
  const palier = paliers.find((p) => p.cle === clePalier);
  // UN PALIER INCONNU NE SE RANGE PAS EN SILENCE. Première version : il retombait sur UTILE, un
  // milieu rassurant. Trouvé en testant sur les vraies tâches avec un décalage de colonne — TOUTES
  // rendaient « UTILE » et rien ne disait que le palier n'avait simplement pas été lu. Un classement
  // fabriqué sur une donnée absente est pire qu'une absence de classement : il se lit comme une
  // mesure. C'est exactement la discipline mesuré / pas mesuré appliquée partout ailleurs.
  if (!palier) return { cle: "NON CLASSÉE", rang: 0, icone: "⚫", quoi: "palier absent ou inconnu", pourquoi: `« ${clePalier ?? "(vide)"} » ne correspond à aucun palier déclaré : rien n'a été classé, et ce n'est pas un niveau moyen` };
  const famille = familles.find((f) => f.motif.test(palier.coutDeLAttente ?? ""));
  return niveaux.find((n) => n.cle === (famille?.niveau ?? "CONFORT")) ?? niveaux[niveaux.length - 1];
}

// GARDE-FOU D'ÉVOLUTIVITÉ (Article 24) : un septième palier dont le coût de l'attente ne
// correspondrait à aucune famille tomberait en CONFORT sans que personne ne le sache — un
// rétrogradage silencieux, le pire des défauts pour une échelle de priorité. Il est donc SIGNALÉ.
// C'est le troisième état habituel : classé / non classable / jamais classé, jamais deux.
export function findPaliersSansFamille({ paliers = PALIERS, familles = FAMILLES_DE_COUT } = {}) {
  return paliers
    .filter((p) => !familles.some((f) => f.motif.test(p.coutDeLAttente ?? "")))
    // MEMOIRE-NEXT est le plancher déclaré de l'échelle : « aucun coût, et aucune échéance ». Il
    // n'appartient à aucune famille de coût par définition, et c'est CONFORT au sens propre, jamais
    // un défaut de classement. La règle le reconnaît par ce qu'il DIT, jamais par son nom.
    .filter((p) => !/aucun co[ûu]t/i.test(p.coutDeLAttente ?? ""))
    .map((p) => ({ palier: p.cle, coutDeLAttente: p.coutDeLAttente, pourquoi: "aucune famille de coût ne reconnaît ce palier : il tomberait en CONFORT en silence, ce qui est un rétrogradage invisible plutôt qu'un classement" }));
}

// ————————————————————————————————————————————————————————————————————————
// L'URGENCE — une vignette à côté, jamais une part de l'étiquette
// ————————————————————————————————————————————————————————————————————————
//
// CALIBRÉ EN FENÊTRE : la vignette montre LE CRAN **ET** LE NOMBRE DE JOURS. L'utilisateur a écarté
// les deux formes plus simples, et sa raison tient : une couleur seule cache le fait qui la produit,
// un nombre seul demande de juger à chaque ligne. « 🔴 31 j » donne les deux d'un coup, donc aucun
// jugement caché derrière une couleur.
export const URGENCE_CRANS = [
  { cle: "fraiche", icone: "🟢", jusquA: 6, quoi: "récente — le retard ne veut encore rien dire" },
  { cle: "tiede", icone: "🟠", jusquA: 20, quoi: "elle traîne : à regarder avant qu'elle ne s'installe" },
  { cle: "installee", icone: "🔴", jusquA: Infinity, quoi: "installée — personne n'a agi depuis assez longtemps pour que ce soit une décision, même non dite" },
];

export function cranDUrgence(jours, { crans = URGENCE_CRANS } = {}) {
  if (jours === undefined || jours === null || !Number.isFinite(jours)) return null;
  // UN ÂGE NÉGATIF N'EST PAS UNE TÂCHE TRÈS FRAÎCHE, c'est un horodatage dans le futur — donc une
  // erreur de saisie. Trouvé en lançant sur le vrai suivi : « 🟢 -1 j » s'affichait comme le cran le
  // plus rassurant de l'échelle, sur des lignes que j'avais moi-même mal datées quelques minutes
  // plus tôt. Un défaut de donnée qui se présente comme un bon signal est pire qu'un défaut visible.
  if (jours < 0) return null;
  return crans.find((c) => jours <= c.jusquA) ?? crans[crans.length - 1];
}

// TROIS ÉTATS, JAMAIS DEUX : une tâche dont on ne connaît pas l'âge n'est pas une tâche fraîche.
// Rendre « 🟢 0 j » sur une date manquante inventerait une fraîcheur que rien ne mesure.
export function vignetteUrgence(jours) {
  const cran = cranDUrgence(jours);
  if (cran) return `${cran.icone} ${jours} j`;
  // Deux absences distinctes, jamais fondues en une : ne pas connaître l'âge n'est pas la même
  // chose qu'un âge impossible. La première demande une date, la seconde demande une correction.
  if (Number.isFinite(jours) && jours < 0) return `⚫ date future (${jours} j) — horodatage à corriger`;
  return "⚫ âge inconnu";
}

// ————————————————————————————————————————————————————————————————————————
// LE MOT-CLÉ — un seul mot, et le garde-fou que son choix impose
// ————————————————————————————————————————————————————————————————————————
//
// CALIBRÉ EN FENÊTRE : « un mot-clé unique », choisi contre ma recommandation de deux à quatre mots.
// Le risque dont l'utilisateur a été prévenu au moment de choisir — deux tâches différentes finissant
// sur le même mot, donc la confusion qui revient par une autre porte — n'est pas laissé à
// l'attention de qui que ce soit : findMotsClesEnCollision() le refuse mécaniquement.
export const MOTS_TROP_VAGUES = new Set(["outil", "tache", "taches", "projet", "code", "fichier", "systeme", "chose", "truc", "divers"]);

export function motCleValide(mot) {
  const m = String(mot ?? "").trim().toLowerCase();
  if (!m) return { ok: false, pourquoi: "un mot-clé vide ne rappelle rien : c'est toute la raison d'être du champ" };
  if (/\s/.test(m)) return { ok: false, pourquoi: `« ${mot} » contient un espace — le calibrage demande UN mot, pas une expression` };
  if (m.length < 4) return { ok: false, pourquoi: `« ${mot} » est trop court pour rappeler quoi que ce soit dans six semaines` };
  if (MOTS_TROP_VAGUES.has(m)) return { ok: false, pourquoi: `« ${mot} » s'applique à presque toutes les tâches du projet : il ne distingue rien` };
  return { ok: true };
}

// LA COLLISION, refusée seulement entre tâches OUVERTES — et cette limite est volontaire. Deux
// tâches closes qui partagent un mot ne gênent personne : on ne les cite plus. L'imposer sur tout
// l'historique rendrait le champ impraticable au bout de cent tâches, et c'est le genre de règle
// trop stricte qu'on finit par contourner.
export function findMotsClesEnCollision(taches = []) {
  const ouvertes = taches.filter((t) => !/termin|clos|résolu|resolu|écart|ecart/i.test(String(t.statut ?? "")));
  const par = new Map();
  for (const t of ouvertes) {
    const m = String(t.motCle ?? "").trim().toLowerCase();
    if (!m) continue;
    if (!par.has(m)) par.set(m, []);
    par.get(m).push(t.n ?? t.numero ?? "?");
  }
  return [...par.entries()].filter(([, ns]) => ns.length > 1)
    .map(([mot, numeros]) => ({ mot, numeros, pourquoi: `${numeros.length} tâches ouvertes portent « ${mot} » (${numeros.join(", ")}) — citer ce mot ne dira plus laquelle` }));
}

// ————————————————————————————————————————————————————————————————————————
// L'ÉTIQUETTE COMPLÈTE — ce que l'utilisateur lit réellement
// ————————————————————————————————————————————————————————————————————————

export function etiquetteDeLaTache(row = {}, { jours, signaux = [] } = {}) {
  const clePalier = PALIERS_PAR_CLE.has(String(row.sensibilite ?? "").trim())
    ? String(row.sensibilite).trim()
    : calculerPalier(signaux).palier;
  const criticite = criticiteDuPalier(clePalier);
  return {
    criticite: criticite.cle,
    icone: criticite.icone,
    vignette: vignetteUrgence(jours),
    motCle: row.motCle ?? null,
    // Le palier d'origine est CONSERVÉ, jamais jeté : c'est lui qui porte l'explication détaillée
    // (« attendre coûte à chaque tour »), et le supprimer perdrait le pourquoi au profit du quoi.
    palierSource: clePalier,
    texte: `${criticite.icone} ${criticite.cle}  ${vignetteUrgence(jours)}${row.motCle ? `  · ${row.motCle}` : ""}`,
  };
}

// LE FORMAT STANDARD D'UNE TÂCHE (demande de l'utilisateur, tâche #570 : « on devrait identifier un
// format standart, à renseigner dans les process »). Déclaré ici, en données, pour qu'un contrôleur
// puisse le vérifier au lieu qu'il vive dans une phrase de documentation que personne ne relit.
export const FORMAT_TACHE = [
  { champ: "numero", obligatoire: true, quoi: "le numéro, unique et jamais réutilisé" },
  { champ: "horodatage", obligatoire: true, quoi: "quand elle a été ouverte — c'est lui qui rend l'urgence calculable" },
  { champ: "motCle", obligatoire: true, quoi: "UN mot qui la rappelle six semaines plus tard, unique parmi les tâches ouvertes" },
  { champ: "sujet", obligatoire: true, quoi: "le domaine (« Process / Ronde »), pour regrouper" },
  { champ: "sousSujet", obligatoire: true, quoi: "ce dont il s'agit, en une phrase lisible sans contexte" },
  { champ: "criticite", obligatoire: true, quoi: "un des quatre niveaux — jamais un mot de retard, qui appartient à la vignette" },
  { champ: "detail", obligatoire: false, quoi: "le pourquoi : ce qui l'a déclenchée, ce qui a été décidé, ce qui reste" },
  { champ: "statut", obligatoire: true, quoi: "à faire / en cours / terminée / écartée avec sa raison (Article 28)" },
];

export function findChampsManquants(row = {}, { format = FORMAT_TACHE } = {}) {
  return format.filter((f) => f.obligatoire && (row[f.champ] === undefined || row[f.champ] === null || String(row[f.champ]).trim() === ""))
    .map((f) => ({ champ: f.champ, quoi: f.quoi }));
}

export function formatEchelleCriticite(niveaux = NIVEAUX_CRITICITE, crans = URGENCE_CRANS) {
  const l = ["=== Criticité (l'étiquette) ==="];
  for (const n of niveaux) l.push(`${n.icone} ${n.cle.padEnd(10)} — ${n.quoi}. ${n.pourquoi}`);
  l.push("", "=== Urgence (la vignette à côté) ===");
  for (const c of crans) l.push(`${c.icone} ${c.cle.padEnd(10)} — ${c.quoi}`);
  l.push("", "L'urgence n'est PAS retirée du calcul de criticité : les signaux liés au temps y gardent tout leur poids.");
  l.push("Ce qui change, c'est qu'elle n'occupe plus l'étiquette — elle est à côté, et plus visible qu'avant.");
  return l.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(formatEchelleCriticite());
