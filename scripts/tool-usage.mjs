// ICEBERG: membre
// COMPTEUR D'USAGE DES OUTILS (tâche #166, 2026-09-21) — capturé en conception le 2026-09-21T01:45Z
// (docs/suivi #230), calibré le même soir : cumul PERMANENT depuis le début du projet (jamais remis
// à zéro par session), nourrit la future CASSANDRA-RH pour juger si un outil a toujours sa place.
//
// Source de la donnée, honnêteté déjà actée pour SMART-CONSO-TOKEN et réutilisée ici à l'identique :
// un JOURNAL AUTO-DÉCLARÉ par l'agent lui-même, jamais vérifiable mécaniquement (aucune trace
// externe indépendante ne prouve qu'un outil a réellement été sollicité) — la discipline "solliciter
// réellement les outils, le dire explicitement" (docs/regles-de-travail.md) EST la seule protection.
//
// Deux enrichissements ajoutés par l'utilisateur en calibrant (2026-09-21) : (1) l'ORIGINE de chaque
// sollicitation (spontanée / demandée / automatique post-commit), pour distinguer un outil qui tourne
// UNIQUEMENT parce qu'il est automatique d'un outil réellement choisi ; (2) si l'appel a produit une
// vraie trouvaille (`foundSomething`), pour croiser "souvent utilisé" et "souvent UTILE" — même
// discipline anti-vanity-metric que ALWAYS-NEW-CODE/THE-DEEP-READER (rereadPerformance()).

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadJson } from "./lib-json.mjs";

// LE JOURNAL PEUT ÊTRE DÉTOURNÉ PAR L'ENVIRONNEMENT (2026-09-29, tâche #1181), et c'est la racine
// d'un défaut constaté deux fois cette nuit plutôt qu'un confort de test.
//
// LE FAIT : `filet-en-parts` lance quatre parts du filet EN PARALLÈLE. Chacune isole déjà son
// runtime (`SITES_RUNTIME_ROOT`) — mais les quatre écrivaient dans CE fichier-ci, en même temps.
// Deux conséquences, toutes deux vues pour de vrai : des écritures perdues (le dernier qui écrit
// gagne), et des tests qui LISENT ce journal en direct pendant que trois autres processus le
// réécrivent. Résultat : une part rouge puis verte sur exactement le même code.
//
// ET C'EST LA MÊME CAUSE QUE LA TÂCHE #1172, prise par sa racine plutôt que par son symptôme
// (Article 3) : là-bas, le filet écrivait de faux outils dans le journal de production ; ici il
// le met en pièces à quatre mains. Un journal de production n'a rien à faire dans un test, dans
// aucun des deux sens.
//
// L'ENV EST LU À CHAQUE APPEL, jamais figé au chargement du module : une part fixe la variable
// avant de lancer son processus, mais un test qui la change en cours de route doit être suivi.
const HISTORY_PATH_PAR_DEFAUT = fileURLToPath(new URL("../.tool-usage-history.json", import.meta.url));
export function cheminDuJournal(env = process.env) {
  return env?.TOOL_USAGE_HISTORY_PATH || HISTORY_PATH_PAR_DEFAUT;
}

// "cli_direct" (2026-09-21, correctif demandé explicitement après un audit honnête : le compteur
// affichait ZÉRO sollicitation réelle pour tout le paysage malgré plusieurs vrais lancements d'outils
// la même soirée — cause racine : aucun `main()` de CLI n'appelait jamais recordToolUsage(), l'agent
// devait s'en souvenir séparément à chaque fois et ne l'a jamais fait). Origine honnête, distincte des
// deux autres : le script SAIT qu'il a été lancé via sa propre ligne de commande, mais ne peut jamais
// savoir POURQUOI (spontané ou demandé — un jugement que seul l'agent qui pilote peut porter) —
// jamais fabriquer cette distinction à l'aveugle. Câblée directement dans le main()/point d'entrée de
// chaque outil réel (recordCliUsage() ci-dessous), best-effort, jamais bloquant.
// "verification" (2026-09-22, cause racine trouvée par le premier vrai passage d'angel-of-ia-process :
// il a accusé 6 outils d'avoir été consultés trop tard, alors que ces « consultations » étaient en
// réalité l'agent relançant ces outils pour vérifier qu'ils fonctionnaient encore après leur
// migration). Relancer un outil pour contrôler qu'il tourne n'est PAS le consulter : c'est un test,
// pas un jugement, et le confondre avec une consultation fabrique une conformité qui n'a pas eu
// lieu. Déclarée par la variable d'environnement TOOL_USAGE_ORIGIN au moment du lancement ; les
// outils qui mesurent la DISCIPLINE (angel) doivent l'exclure, ceux qui mesurent l'USAGE réel
// (tool-brain, Doc-Report) la comptent normalement — un test reste un vrai lancement.
// "fonction" (2026-09-23, définition posée par l'utilisateur : « utiliser un outil = utiliser une
// de ses fonctionnalités, on est ok ? » — oui). Cette définition a une conséquence que le compteur
// ne voyait pas : jusqu'ici, SEULE la ligne de commande était enregistrée (recordCliUsage() est
// câblé dans le main() de chaque outil). Appeler `prochaineAction()` ou `autoriseCloture()` en
// important le module — ce que je fais constamment — était un usage réel, invisible au compteur.
//
// L'erreur était donc symétrique de celle que l'utilisateur vient de corriger sur les
// contributions : là il fallait ne PAS compter un geste qui n'est pas un usage, ici il faut
// compter un usage que rien ne voyait. Dans les deux cas le total décrivait autre chose que ce
// qu'il prétendait.
//
// LA LIMITE HONNÊTE, déclarée plutôt que tue (même famille que tool-brain et SMART-CONSO-TOKEN) :
// aucun mécanisme ne peut intercepter un `import` avant qu'il n'ait lieu. Instrumenter chaque
// fonction exportée du paysage coûterait plus que ce que la mesure vaut, et une seule oubliée
// rendrait le total faux en se taisant. C'est donc une origine DÉCLARÉE par l'appelant — une
// obligation écrite, comme les deux autres impossibilités de ce projet.
export const USAGE_ORIGINS = ["spontane", "demande", "automatique_post_commit", "cli_direct", "verification", "fonction"];

// Exportée (2026-09-21) pour que le-coordinateur.mjs::formatBadgeCeremonyAnnouncement() la
// réutilise verbatim plutôt que d'écrire une 4e copie identique — CLONE-HUNTER venait de trouver
// cette exacte duplication (déjà présente 3 fois : ici, smart-conso-api.mjs, smart-conso-token.mjs)
// le soir même ; jamais rouvrir un cas déjà signalé sous une forme légèrement différente (Article 3).
// Ré-export depuis le 2026-09-23 (tâche #216) : cette fonction ÉTAIT le canonique — le-coordinateur
// et cassandra-rh l'importent d'ici — mais deux outils s'en étaient fait des copies privées quand
// même. Le corps a déménagé dans lib-json.mjs ; le ré-export garde intacts les deux importeurs.
// Importée ET ré-exportée, jamais seulement ré-exportée : `export { x } from "…"` ne crée AUCUNE
// liaison locale, et ce fichier appelle loadJson() lui-même dans recordToolUsage(). La première
// version de ce commit ne faisait que ré-exporter — la suite de tests l'a attrapée immédiatement
// avec un « loadJson is not defined » à l'exécution réelle, ce qu'aucune relecture n'aurait vu.
export { loadJson };

// Enregistre une sollicitation RÉELLE d'un outil. `toolSlug` : identifiant stable de l'outil (même
// convention que slugifyAgentName() de le-coordinateur.mjs, ex. "argus", "the-final-judge") — jamais
// deviné ici, toujours fourni par l'appelant qui sait déjà quel outil il vient de solliciter.
// LE LECTEUR VIT CHEZ LE PROPRIÉTAIRE DU MAGASIN (2026-09-27, tâche #715). Il vivait dans
// tool-brain.mjs, qui n'écrit rien dans ce fichier et se trouvait seulement être son premier
// lecteur. Résultat : tout outil voulant lire l'historique devait importer tool-brain, lequel
// importe le catalogue — donc un cycle dès que le catalogue veut lire l'historique à son tour.
// Le déplacer ici n'ajoute aucune connaissance nouvelle : il rejoint le fichier qui écrit ces
// mêmes événements, et tool-brain continue de l'exposer pour ses appelants historiques.
//
// MÊME DISCIPLINE HONNÊTE QUE LE RESTE DU PAYSAGE : un historique absent ou corrompu retombe sur
// « aucun événement connu », jamais une erreur qui bloquerait un simple rappel. L'appelant qui a
// besoin de distinguer « vide » de « illisible » doit le demander explicitement, et les deux
// générateurs de combinaisons le font (ils refusent de conclure sous le seuil de mesurabilité).
export function loadToolUsageHistory(readFile = (u) => readFileSync(u, "utf8")) {
  try {
    return JSON.parse(readFile(cheminDuJournal()));
  } catch {
    return { events: [] };
  }
}

export function recordToolUsage(toolSlug, origin, now = Date.now(), foundSomething = undefined) {
  if (!toolSlug) throw new Error("recordToolUsage: toolSlug obligatoire — un usage ne peut jamais être anonyme.");
  if (!USAGE_ORIGINS.includes(origin)) throw new Error(`recordToolUsage: origin inconnue "${origin}" — attendu l'une de ${USAGE_ORIGINS.join(", ")}`);
  // UN HORODATAGE QUI N'EST PAS UN NOMBRE EST REFUSÉ (2026-09-28, tâche #765). Il ne l'était pas, et
  // ça a coûté 327 événements sur 4 931 — 6,6 % de l'historique — dont l'`at` était un OBJET. Aucune
  // erreur n'est jamais apparue : `recordCliUsage` avale ses exceptions par conception (le compteur
  // ne doit jamais bloquer la vraie sortie d'un outil), et une comparaison `at >= limite` sur un
  // objet rend simplement `false`. Résultat : onze outils passaient pour n'avoir JAMAIS tourné dans
  // toute fenêtre de temps, en silence, depuis des semaines. Refuser ici rend le défaut visible au
  // test, là où le try/catch de l'appelant le rendait invisible en production.
  if (typeof now !== "number" || !Number.isFinite(now)) {
    throw new Error(`recordToolUsage: horodatage invalide pour "${toolSlug}" (${typeof now}) — un « at » qui n'est pas un nombre rend l'événement invisible à toute fenêtre de temps, sans jamais lever d'erreur.`);
  }
  const history = loadJson(cheminDuJournal(), { events: [] });
  history.events = history.events ?? [];
  history.events.push({ toolSlug, origin, at: now, ...(typeof foundSomething === "boolean" ? { foundSomething } : {}) });
  writeFileSync(cheminDuJournal(), JSON.stringify(history, null, 1));
  return history;
}

// recordCliUsage() — le point d'appel unique câblé dans le main()/point d'entrée de chaque outil
// réel (2026-09-21). Jamais l'appelant lui-même ne construit un try/catch : centralisé une seule
// fois ici pour qu'un échec d'écriture (disque plein, permissions) ne bloque JAMAIS la vraie sortie
// de l'outil, qui reste l'objectif premier — ce compteur reste un bonus d'observation, jamais une
// dépendance du fonctionnement réel (même discipline que lib/memento-weight.ts).
// UN LANCEMENT DE VÉRIFICATION N'EST PAS UNE CONSULTATION (2026-09-22, trouvé au premier lancement
// réel d'angel-of-ia-process). Il accusait une consultation « après coup » alors que l'événement
// venait de moi relançant l'outil pour vérifier qu'il marchait encore après sa migration — le
// compteur enregistrait les deux à l'identique, et l'accusation était donc fausse. Encore la même
// famille : un signal adjacent lu comme le signal visé. `TOOL_USAGE_ORIGIN=verification` marque
// désormais ces passages, et angel les écarte de son croisement d'horodatages.
// DEUX FORMES D'APPEL, ET LA SECONDE N'ÉTAIT PAS PRÉVUE (2026-09-28, tâche #765). Trente et un
// appels répartis sur onze outils écrivent `recordCliUsage("slug", { origin: … })` — une forme
// parfaitement naturelle, et que personne n'avait déclarée. Le second paramètre étant `now`,
// l'objet devenait l'horodatage, et l'événement sortait invisible de toute fenêtre de temps.
//
// LA CORRECTION HONORE LES DEUX FORMES plutôt que de réécrire trente et un appels : quand onze
// outils écrivent la même chose, c'est l'API qui manque, pas eux (leçon L37 — on corrige la classe).
// Un nombre reste un horodatage ; un objet apporte `{ now, origin }`.
// POURQUOI CHAQUE OUTIL DOIT L'APPELER, ÉCRIT ICI ET NULLE PART AILLEURS (2026-09-27, tâche #714 ;
// rapatrié le 2026-09-28 par #997). Sans cet appel, le compteur ne voit jamais l'outil tourner :
// son zéro se lit ensuite comme « il ne sert à rien » alors qu'il mesure le silence du compteur,
// jamais l'inactivité de l'outil (leçon L11). Six outils sont restés muets des mois parce qu'ils
// étaient absents du catalogue, donc invisibles au verrou qui vérifie précisément ça — une
// invisibilité qui en cachait une autre.
//
// CETTE RAISON VIVAIT EN SIX EXEMPLAIRES, un par outil corrigé, et CLONE-HUNTER l'a vu. Ce n'est
// pas qu'une redite : six copies veulent dire six endroits à corriger et AUCUN qui fasse autorité —
// le POURQUOI doit vivre à côté du QUOI (Article 27), et le QUOI est ici, pas chez l'appelant. Les
// six sites portent désormais une ligne qui renvoie à celle-ci.
export function recordCliUsage(toolSlug, nowOuOptions = undefined, env = process.env) {
  try {
    const options = (nowOuOptions && typeof nowOuOptions === "object") ? nowOuOptions : {};
    const now = typeof nowOuOptions === "number" ? nowOuOptions : (typeof options.now === "number" ? options.now : Date.now());
    // `origine` EST ACCEPTÉ COMME `origin`, ET CE N'EST PAS UNE COMPLAISANCE (2026-09-29, #1173).
    //
    // LE FAIT MESURÉ : onze appels réels, dans trois outils, écrivaient `{ origine: "demande" }`
    // — la clé en français, comme tout le reste de ce dépôt. Cette fonction ne lisait que
    // `origin`, donc `declaree` valait `undefined`, donc les onze retombaient sur `cli_direct`.
    // Résultat : l'origine « demande » n'a JAMAIS été écrite par les onze endroits qui croyaient
    // l'écrire, et la dimension « qui a déclenché cet outil » du compteur était fausse d'autant.
    //
    // POURQUOI ACCEPTER PLUTÔT QUE CORRIGER LES ONZE ET S'EN TENIR LÀ : ce dépôt écrit son code en
    // français. Exiger ici le seul mot anglais garantit que le douzième appel refera la faute, et
    // elle est INVISIBLE — rien ne casse, le compteur compte, il compte juste autre chose.
    const declaree = options.origin ?? options.origine ?? env?.TOOL_USAGE_ORIGIN;
    recordToolUsage(toolSlug, USAGE_ORIGINS.includes(declaree) ? declaree : "cli_direct", now);
  } catch { /* best-effort, jamais bloquant — cf. commentaire ci-dessus */ }
}

// LES 327 ÉVÉNEMENTS DÉJÀ ABÎMÉS ne se jettent pas : ils prouvent qu'un outil a tourné, et seule
// l'HEURE est perdue. Les supprimer effacerait onze outils de leurs totaux d'usage ; les laisser
// tels quels laisse un objet là où un nombre est attendu. Ils sont donc normalisés en
// `at: null, horodatagePerdu: true` — le fait survit, la perte est DÉCLARÉE, et une fenêtre de
// temps les écarte en le sachant plutôt que par accident.
export function reparerHorodatagesPerdus(history = { events: [] }) {
  let repares = 0;
  const events = (history.events ?? []).map((e) => {
    if (typeof e.at === "number" && Number.isFinite(e.at)) return e;
    repares += 1;
    return { ...e, at: null, horodatagePerdu: true };
  });
  return { history: { ...history, events }, repares };
}

// Statistiques cumulées, jamais remises à zéro (décision explicite de l'utilisateur : le total
// permanent montre la vraie utilité SUR LA DURÉE, jamais faussé par une session courte ou longue).
export function toolUsageStats(history, toolSlug) {
  const events = (history?.events ?? []).filter((e) => e.toolSlug === toolSlug);
  if (!events.length) return { total: 0, byOrigin: {}, foundSomethingCount: 0, foundSomethingRate: undefined };
  const byOrigin = {};
  for (const origin of USAGE_ORIGINS) byOrigin[origin] = events.filter((e) => e.origin === origin).length;
  const withVerdict = events.filter((e) => typeof e.foundSomething === "boolean");
  const foundSomethingCount = withVerdict.filter((e) => e.foundSomething).length;
  return {
    total: events.length,
    byOrigin,
    foundSomethingCount,
    foundSomethingRate: withVerdict.length ? Math.round((foundSomethingCount / withVerdict.length) * 1000) / 10 : undefined,
  };
}

// recordFunctionUsage() — un outil sollicité par l'une de ses fonctions, sans passer par sa ligne
// de commande. Nomme TOUJOURS la fonction : « argus a été utilisé » et « findFaitsManquants() a été
// appelée » ne portent pas la même information, et la seconde est la seule vérifiable.
export function recordFunctionUsage(toolSlug, fonction, { now = Date.now(), foundSomething = undefined } = {}) {
  if (!fonction) throw new Error("recordFunctionUsage: fonction obligatoire — « l'outil a servi » sans dire par quoi n'est pas une mesure vérifiable.");
  try {
    const history = loadJson(cheminDuJournal(), { events: [] });
    history.events = history.events ?? [];
    history.events.push({ toolSlug, origin: "fonction", fonction, at: now, ...(typeof foundSomething === "boolean" ? { foundSomething } : {}) });
    writeFileSync(cheminDuJournal(), JSON.stringify(history, null, 1));
    return history;
  } catch { return null; /* best-effort, jamais bloquant — même discipline que recordCliUsage() */ }
}

// ————————————————————————————————————————————————————————————————————————
// ALIMENTER UN OUTIL N'EST PAS LE SOLLICITER (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// Demande explicite de l'utilisateur : « si tu alimentes un fichier de data appartenant à un outil
// membre, ça ne compte pas comme une utilisation de l'outil, mais c'est un bon réflexe qui mérite
// d'être comptabilisé et inclus dans le calcul du KPI correspondant avec objectifs. »
//
// LES DEUX MOITIÉS DE LA RÈGLE, ET AUCUNE NE VA SANS L'AUTRE :
//   - « ça ne compte PAS comme une utilisation » : verser une ligne dans le registre d'un outil ne
//     prouve rien sur son utilité. Le compter comme un usage gonflerait le taux de sollicitation
//     avec des gestes qui n'ont produit aucun verdict — exactement la métrique de vanité que ce
//     fichier combat depuis son premier jour (cf. foundSomethingRate, qui refuse déjà de compter
//     un lancement comme une trouvaille).
//   - « mais ça mérite d'être comptabilisé » : c'est le geste qui empêche un outil de mourir de
//     faim. Un outil dont personne n'alimente jamais les données rend des verdicts sur du vide, et
//     rien aujourd'hui ne distingue « jamais alimenté » de « alimenté hier ». Ne pas le compter du
//     tout laisserait ce réflexe invisible, donc non tenu.
//
// D'OÙ UN COMPTEUR SÉPARÉ, jamais un champ de plus sur un événement d'usage : deux natures
// différentes dans une même série produiraient un total qui ne décrit ni l'une ni l'autre. Même
// discipline que partout ailleurs ici — un chiffre dit ce qu'il mesure, ou il ne se rend pas.
export const CONTRIBUTION_NATURES = ["registre", "journal", "donnee-de-reference", "correction"];

// Une contribution nomme TOUJOURS le fichier réellement touché. Sans lui, la trace dirait qu'un
// geste a eu lieu sans permettre de vérifier lequel — une mesure invérifiable n'en est pas une.
export function recordToolContribution(toolSlug, fichier, { nature = "registre", now = Date.now(), par = "agent" } = {}) {
  if (!toolSlug) throw new Error("recordToolContribution: toolSlug obligatoire — une contribution ne peut jamais être anonyme.");
  if (!fichier) throw new Error("recordToolContribution: fichier obligatoire — une contribution qui ne nomme pas ce qu'elle a alimenté n'est pas vérifiable.");
  if (!CONTRIBUTION_NATURES.includes(nature)) throw new Error(`recordToolContribution: nature inconnue "${nature}" — attendu l'une de ${CONTRIBUTION_NATURES.join(", ")}`);
  const history = loadJson(cheminDuJournal(), { events: [] });
  history.contributions = history.contributions ?? [];
  history.contributions.push({ toolSlug, fichier, nature, par, at: now });
  writeFileSync(cheminDuJournal(), JSON.stringify(history, null, 1));
  return history;
}

// Le pendant de toolUsageStats(), et volontairement bâti sur la même forme pour que les deux se
// lisent côte à côte sans se confondre. `dernier` est ce qui manquait réellement : savoir QUAND un
// outil a été alimenté pour la dernière fois, puisque c'est la famine qui rend ses verdicts creux.
export function toolContributionStats(history, toolSlug) {
  const events = (history?.contributions ?? []).filter((e) => e.toolSlug === toolSlug);
  if (!events.length) return { total: 0, dernier: null, parNature: {}, fichiers: [] };
  const parNature = {};
  for (const nature of CONTRIBUTION_NATURES) parNature[nature] = events.filter((e) => e.nature === nature).length;
  return {
    total: events.length,
    dernier: Math.max(...events.map((e) => e.at)),
    parNature,
    fichiers: [...new Set(events.map((e) => e.fichier))],
  };
}

// LA FAMINE, nommée plutôt que déduite. Un outil sans contribution depuis longtemps n'est pas
// forcément en faute — certains lisent le dépôt et n'ont aucun registre à nourrir. La fonction rend
// donc les trois états habituels : alimenté, jamais alimenté, et « rien à alimenter » pour un outil
// dont l'appelant déclare qu'il ne tient aucun registre. Confondre les deux derniers accuserait à
// tort la moitié du paysage.
export const CONTRIBUTION_FAMINE_JOURS = 30;
export function toolsNeverFed(history, knownToolSlugs, { sansRegistre = [], famineJours = CONTRIBUTION_FAMINE_JOURS, now = Date.now() } = {}) {
  const seuil = now - famineJours * 24 * 60 * 60 * 1000;
  return knownToolSlugs.map((slug) => {
    if (sansRegistre.includes(slug)) return { slug, etat: "rien à alimenter", pourquoi: "cet outil ne tient aucun registre — l'absence de contribution n'est pas un manquement" };
    const { total, dernier } = toolContributionStats(history, slug);
    if (!total) return { slug, etat: "jamais alimenté", pourquoi: "aucune contribution enregistrée depuis la création du compteur" };
    if (dernier < seuil) return { slug, etat: "en famine", pourquoi: `dernière contribution il y a plus de ${famineJours} jours — ses verdicts portent sur des données qui vieillissent` };
    return { slug, etat: "alimenté", dernier };
  });
}

// ————————————————————————————————————————————————————————————————————————
// « EN GÉNÉRAL » : DÉRIVER LE BÉNÉFICIAIRE DU CHEMIN ÉCRIT (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// Demande de l'utilisateur, après deux points de câblage : « la Ronde reste un moment opportun,
// trouve encore deux occasions autres ET EN GÉNÉRAL, comment respecter "en général" ».
//
// LE PIÈGE QU'IL POINTE, et il est réel : câbler un point d'appel à la fois ne finit jamais. Il
// resterait toujours un écrivain de registre qu'on n'a pas vu, et le compteur redeviendrait faux
// en silence — la définition exacte de ce que l'Article 24 interdit (« un registre se LIT, il ne
// s'énumère pas »).
//
// LA RÈGLE GÉNÉRALE, et elle tient en une phrase : le dépôt suit une convention SANS EXCEPTION —
// le registre d'un outil vit dans `docs/<nom-de-l-outil-en-minuscules>/`. Le bénéficiaire d'une
// écriture se DÉDUIT donc du chemin écrit, au lieu d'être nommé à chaque appel. N'importe quel
// outil qui écrit dans un registre appelle cette fonction avec le chemin, et le compteur sait qui
// vient d'être nourri — y compris un outil qui n'existe pas encore aujourd'hui.
//
// CE QU'ELLE NE FAIT PAS, dit plutôt que masqué : elle ne devine rien hors de cette convention.
// Un chemin qui ne commence pas par `docs/<quelque chose>/` rend null et n'enregistre rien — une
// attribution inventée serait pire qu'une absence, puisqu'elle créditerait le mauvais outil.
export function beneficiaireDuChemin(chemin) {
  const m = String(chemin ?? "").replace(/^\.\//, "").match(/^docs\/([a-z0-9][a-z0-9-]*)\//);
  return m ? m[1] : null;
}

export function recordRegistryWrite(chemin, { nature = "registre", now = Date.now(), par = "outil" } = {}) {
  const slug = beneficiaireDuChemin(chemin);
  if (!slug) return null; // hors convention : on ne crédite jamais au hasard
  try { return recordToolContribution(slug, chemin, { nature, now, par }); } catch { return null; }
}

// Un outil "jamais réellement sollicité" (utile à Doc-Report/#165 et à la future CASSANDRA-RH) :
// aucun événement d'usage n'existe pour lui alors qu'il fait bien partie de la liste des outils
// connus — jamais deviné, toujours comparé à une vraie liste fournie par l'appelant.
// L'HORIZON DU JOURNAL — ce que ses chiffres COUVRENT réellement (2026-09-29, tâche #1244).
//
// LE DÉFAUT MESURÉ, ET IL N'EST PAS THÉORIQUE. Le 2026-09-29, le journal portait 857 événements
// dont le plus ancien datait du MATIN MÊME, 03h38 — treize heures, pour un dépôt de treize JOURS.
// La raison est connue et déclarée : le fichier est dans `.gitignore`, donc il n'a pas voyagé avec
// le clone et s'est reconstruit de zéro. La fiche de l'outil le dit depuis toujours.
//
// CE QUI N'ALLAIT PAS N'EST DONC PAS LA LIMITE, C'EST L'ENDROIT OÙ ELLE EST ÉCRITE. Elle vivait
// dans la fiche ; le rapport, lui, annonçait « 29 outils jamais sollicités » sans un mot. Et cet
// écart devient un plan d'action dont le « quoi faire » propose de RETIRER des outils qui tournent
// depuis des semaines. Un signal ADJACENT — jamais vu passer DEPUIS QUE CE JOURNAL EXISTE — lu
// comme le signal visé : jamais sollicité PAR LE PROJET.
//
// Cette fonction ne corrige aucun chiffre : elle donne de quoi les LIRE. Ce qui reste une décision
// (faut-il taire l'écart quand le journal est trop jeune ?) est dans `docs/idees-a-trancher.md`.
export function horizonDuJournal(history, { maintenant = Date.now() } = {}) {
  const ev = Array.isArray(history) ? history : (history?.events ?? []);
  const dates = ev.map((e) => e?.at).filter((v) => typeof v === "number" && Number.isFinite(v));
  if (!dates.length) {
    return { mesurable: false, evenements: ev.length,
      pourquoi: ev.length
        ? `${ev.length} événement(s) mais AUCUN horodatage lisible — on sait qu'il s'est passé quelque chose, jamais quand`
        : "le journal est vide : « aucun outil sollicité » et « le journal vient d'être créé » s'écriraient tous les deux zéro (L5)" };
  }
  const plusAncien = Math.min(...dates);
  return {
    mesurable: true,
    evenements: ev.length,
    sansHorodatage: ev.length - dates.length,
    plusAncien,
    plusRecent: Math.max(...dates),
    heuresCouvertes: Math.round((maintenant - plusAncien) / 36e5),
  };
}

// La phrase à imprimer À CÔTÉ de tout chiffre d'usage. Elle compare la couverture du journal à
// l'âge du dépôt : sans cette comparaison, « 13 heures » n'a pas de sens — c'est énorme sur un
// projet d'un jour, et c'est presque rien sur le nôtre.
export function formatHorizonLine(h, { heuresDuDepot = null } = {}) {
  if (!h?.mesurable) return `⚠️ HORIZON NON MESURÉ — ${h?.pourquoi ?? "journal illisible"}. Tout chiffre d'usage ci-dessous est à lire avec cette réserve.`;
  const perdus = h.sansHorodatage ? `, dont ${h.sansHorodatage} sans horodatage` : "";
  const base = `📅 Le journal couvre ${h.heuresCouvertes} h (${h.evenements} événement(s)${perdus}), depuis le ${new Date(h.plusAncien).toISOString().slice(0, 16).replace("T", " ")} UTC.`;
  if (heuresDuDepot == null) return base;
  const part = Math.round((100 * h.heuresCouvertes) / Math.max(heuresDuDepot, 1));
  if (part >= 90) return `${base} Le dépôt en a ${heuresDuDepot} : la couverture est quasi complète.`;
  return `${base} **Le dépôt en a ${heuresDuDepot} — le journal n'en couvre que ${part} %.** « Jamais sollicité » veut donc dire « jamais vu passer sur cette fenêtre », jamais « jamais utilisé par le projet ».`;
}

export function toolsNeverUsed(history, knownToolSlugs) {
  const used = new Set((history?.events ?? []).map((e) => e.toolSlug));
  return knownToolSlugs.filter((slug) => !used.has(slug));
}

function main() {
  const [, , toolSlug, origin, foundSomethingArg] = process.argv;
  if (!toolSlug || !origin) {
    console.log(`Usage : node scripts/tool-usage.mjs <toolSlug> <${USAGE_ORIGINS.join("|")}> [confirme_utile|sans_trouvaille]`);
    process.exit(1);
  }
  const foundSomething = foundSomethingArg === "confirme_utile" ? true : foundSomethingArg === "sans_trouvaille" ? false : undefined;
  recordToolUsage(toolSlug, origin, Date.now(), foundSomething);
  const history = loadJson(cheminDuJournal(), { events: [] });
  console.log(`Enregistré : ${toolSlug} (${origin}).`);
  console.log(JSON.stringify(toolUsageStats(history, toolSlug), null, 1));
}

// ————————————————————————————————————————————————————————————————————————
// L'USAGE SPONTANÉ — LE SEUL SIGNAL POSITIF DU PAYSAGE (2026-09-25, constat DEEP-READER 6)
// ————————————————————————————————————————————————————————————————————————
//
// SA DEMANDE, MOT POUR MOT : « les utilisations spontanées des outils (de ta part ET hors process
// mecaniques) sont à flagger comme "signe trés positif" de cette mesure. »
//
// POURQUOI ELLE N'AVAIT JAMAIS ÉTÉ TENUE, et la cause est exactement du type que ce projet traque :
// `USAGE_ORIGINS` contient « spontane » depuis le premier jour, et sur 2 194 événements enregistrés
// il n'a JAMAIS été utilisé une seule fois — parce que `recordCliUsage()` écrit « cli_direct »,
// point. Une catégorie qui existe dans le vocabulaire et qu'aucun chemin de code ne peut produire :
// le même défaut qu'une sonde incapable de matcher, vu depuis l'écriture plutôt que la lecture.
//
// CE QUI SE DÉRIVE HONNÊTEMENT, plutôt qu'une auto-déclaration : ce projet se méfie d'un agent qui
// se note lui-même, et il a raison. Mais « spontané » EST dérivable de ce qui est déjà enregistré —
// un appel en ligne de commande d'un outil qui n'est NI un item de la Ronde (donc pas dicté par un
// process) NI lancé par un crochet git (donc pas automatique) ne peut venir que d'une initiative.
//
// LE PIÈGE ÉVITÉ DE JUSTESSE, gardé écrit parce qu'il est le miroir exact du faux vert : la
// première version ne retirait que les items de Ronde et annonçait 1 127 appels spontanés, avec
// ecotoken à 304 et moïse à 177 — deux outils que le crochet post-commit lance lui-même à chaque
// commit. Un chiffre flatteur et faux. **Un faux OR est aussi nuisible qu'un faux vert** : il
// félicite pour un mérite inexistant, et la mesure suivante ne vaudra plus rien.
export function usagesSpontanes(history, { itemsRonde = new Set(), sourceCrochets = "" } = {}) {
  const evenements = history?.events;
  if (!Array.isArray(evenements)) {
    return { mesurable: false, pourquoi: "aucun historique d'usage lisible — répondre « zéro usage spontané » sur une absence de journal accuserait à tort, et c'est précisément l'inverse du signal qu'on cherche" };
  }
  if (!String(sourceCrochets).trim()) {
    return { mesurable: false, pourquoi: "la source des crochets git n'a pas été fournie : sans elle, tout outil lancé automatiquement à chaque commit passerait pour une initiative — un faux MÉRITE, aussi trompeur qu'un faux vert" };
  }
  const parCrochet = (slug) => new RegExp(`scripts/${String(slug).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\.mjs|["'\`\\s])`).test(sourceCrochets);
  const cli = evenements.filter((e) => e?.origin === "cli_direct");
  const parOutil = new Map();
  for (const e of cli) {
    const slug = e.toolSlug ?? e.tool ?? null;
    if (!slug) continue;
    parOutil.set(slug, (parOutil.get(slug) ?? 0) + 1);
  }
  const spontanes = []; const dictes = []; const automatiques = [];
  for (const [slug, n] of parOutil) {
    if (itemsRonde.has(slug) || itemsRonde.has(`${slug}-signal`)) dictes.push({ slug, appels: n });
    else if (parCrochet(slug)) automatiques.push({ slug, appels: n });
    else spontanes.push({ slug, appels: n });
  }
  const tri = (a, b) => b.appels - a.appels;
  return {
    mesurable: true,
    spontanes: spontanes.sort(tri), dictes: dictes.sort(tri), automatiques: automatiques.sort(tri),
    appelsSpontanes: spontanes.reduce((a, s) => a + s.appels, 0),
    appelsCliTotal: cli.length,
    horsPortee:
      "Un appel spontané prouve une INITIATIVE, jamais qu'elle était la bonne : lancer dix fois le " +
      "mauvais outil compte pareil. Et l'origine « spontane » du vocabulaire reste inutilisée — ce " +
      "signal est DÉRIVÉ de « cli_direct », il ne la remplace pas.",
  };
}

export function formatUsagesSpontanesLines(u) {
  if (!u?.mesurable) return [`SIGNE POSITIF : PAS MESURÉ — ${u?.pourquoi ?? "aucune donnée"}`];
  const L = [
    `✨ SIGNE TRÈS POSITIF — ${u.appelsSpontanes} appel(s) de ma propre initiative, sur ${u.spontanes.length} outil(s) différent(s).`,
    `   (ni item de Ronde, ni lancé par un crochet : ${u.dictes.length} outil(s) dictés par un process et ${u.automatiques.length} automatiques sont retirés du compte)`,
  ];
  if (u.spontanes.length) L.push(`   Les plus sollicités : ${u.spontanes.slice(0, 8).map((s) => `${s.slug} (${s.appels})`).join(" · ")}`);
  else L.push("   Aucun pour l'instant — ce n'est pas un reproche mécanique, c'est le chiffre à faire monter.");
  L.push(`   HORS PORTÉE : ${u.horsPortee}`);
  return L;
}

// ————————————————————————————————————————————————————————————————————————
// LA CAUSE RACINE, plutôt que le seul symptôme (2026-09-25, Article 3)
// ————————————————————————————————————————————————————————————————————————
//
// Le signal positif ci-dessus DÉRIVE l'initiative de « cli_direct » — il contourne le trou, il ne
// le bouche pas. Le trou lui-même : `USAGE_ORIGINS` déclare six origines, et rien ne garantit
// qu'un chemin de code existe pour chacune. « spontane » en était l'exemple vivant : présente
// depuis le premier jour, jamais écrite une seule fois sur 2 194 événements, et pourtant LUE par
// tool-brain qui en tirait un reproche permanent.
//
// C'est le défaut fondateur de ce projet vu sous son angle d'ÉCRITURE : une sonde qui ne peut pas
// matcher rend ce que rend une sonde qui n'a rien trouvé ; ici, une catégorie que personne ne peut
// écrire rend ce que rend une catégorie réellement inutilisée. Les deux se lisent « zéro ».
//
// CE QUE CE GARDE-FOU FAIT, et ce qu'il ne fait pas : il cherche, dans les sources qu'on lui donne,
// une écriture réelle de chaque origine (un appel `recordToolUsage(..., "x")`, un helper dédié, ou
// un `TOOL_USAGE_ORIGIN=x`). Il ne dit JAMAIS qu'une origine est inutile — seulement qu'aucun
// chemin de code ne peut la produire, ce qui est un fait mécanique. Décider s'il faut la câbler ou
// la retirer reste un jugement humain (Article 24 : le garde-fou détecte l'écart, il ne tranche pas).
export const ORIGINES_ECRITES_PAR_UN_HELPER = {
  // Les origines qu'un chemin AUTOMATIQUE produit tout seul. Les autres ne peuvent naître que d'un
  // appel délibéré à recordToolUsage() — possible, mais que rien ne déclenche.
  cli_direct: /recordCliUsage\s*\(/,
  fonction: /recordFunctionUsage\s*\(/,
  verification: /TOOL_USAGE_ORIGIN/,
  // « demande » A UN CHEMIN, ET IL A TOUJOURS ÉTÉ CASSÉ (2026-09-29, tâche #1173). Onze appels
  // réels l'écrivent dans trois outils — mais tous passaient la clé `origine:` (en français) que
  // `recordCliUsage()` ne lisait pas, de sorte que les onze retombaient sur « cli_direct ». Le
  // chemin existe donc bel et bien ; c'est son écriture qui était perdue en route, réparée le
  // même jour. Sans cette entrée, le garde-fou ne pouvait l'attester que par le JOURNAL, c'est-à-
  // dire par une donnée vivante et non versionnée : il passait au rouge dès que le conteneur
  // repartait à neuf, en accusant un chemin parfaitement présent dans le code.
  demande: /origine?\s*:\s*["'`]demande["'`]/,
};

// LA PREMIÈRE VERSION DE CE GARDE-FOU ÉTAIT AVEUGLE, et la deuxième criait au loup. Les deux sont
// gardées écrites, parce qu'ensemble elles montrent les DEUX façons de se tromper sur la même
// question — et que ce projet a passé la journée à découvrir qu'elles se ressemblent.
//   1. La première cherchait l'origine entre guillemets suivie d'une virgule. Ça matche la
//      DÉCLARATION elle-même (`USAGE_ORIGINS = ["spontane",`) : elle a donc certifié « les 6 ont
//      un chemin d'écriture » sur l'origine dont on savait avec certitude qu'elle n'en avait aucun.
//      Un faux vert, dans l'outil écrit exprès contre les faux verts.
//   2. La deuxième ne cherchait que l'appel littéral dans les sources. Elle a accusé 5 origines sur
//      6 — alors que le journal réel en portait 4 avec des centaines d'événements. Un faux rouge.
//      Aussi menteur, et plus discret : personne ne conteste une mauvaise note.
//
// D'OÙ LA PREUVE PAR LE JOURNAL, jamais par la seule lecture du code : une origine réellement
// présente dans l'historique EST produisible, c'est un fait, pas une déduction. Le balayage des
// sources ne sert plus qu'aux origines que le journal ne porte pas — et là seulement, il distingue
// « aucun chemin automatique » de « un chemin existe, il n'a simplement jamais servi ».
//
// CE QU'IL NE FAIT PAS : il ne dit JAMAIS qu'une origine est inutile. Il dit qu'elle est
// INÉCRITE, ce qui est mécanique. La câbler ou la retirer reste un jugement humain (Article 24).
export function findOriginesJamaisEcrites(sources = [], { origines = USAGE_ORIGINS, helpers = ORIGINES_ECRITES_PAR_UN_HELPER, historique = null } = {}) {
  const texte = sources.filter(Boolean).join("\n");
  const evenements = historique?.events;
  if (!texte.trim() && !Array.isArray(evenements)) {
    return { mesurable: false, pourquoi: "ni source ni journal fournis — répondre « toutes les origines sont câblées » sur zéro donnée lue serait exactement le faux vert que ce garde-fou existe pour empêcher" };
  }
  // On retire commentaires et déclaration du vocabulaire : ce sont des MENTIONS, jamais des écritures.
  const utile = texte
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^[ \t]*\/\/.*$/gm, " ")
    .replace(/USAGE_ORIGINS\s*=\s*\[[^\]]*\]/g, " ");
  const vuesDansLeJournal = new Set((evenements ?? []).map((e) => e?.origin).filter(Boolean));
  const jamaisEcrites = []; const cheminSansUsage = []; const attestees = [];
  for (const o of origines) {
    if (vuesDansLeJournal.has(o)) { attestees.push(o); continue; }
    const parHelper = helpers[o] ? helpers[o].test(utile) : false;
    if (parHelper) cheminSansUsage.push(o);
    else jamaisEcrites.push(o);
  }
  return {
    mesurable: true,
    jamaisEcrites, cheminSansUsage, attestees,
    originesExaminees: origines.length,
    fichiersLus: sources.filter(Boolean).length,
    evenementsLus: Array.isArray(evenements) ? evenements.length : null,
    horsPortee:
      "Le journal prouve qu'une origine EST produisible ; son silence ne prouve jamais qu'aucun " +
      "chemin n'existe — recordToolUsage() est exportée, un appel délibéré peut toujours écrire " +
      "n'importe laquelle. Ce qui est signalé, c'est une origine qu'aucun chemin AUTOMATIQUE ne " +
      "produit et que rien n'a jamais écrite : lue par un outil, elle rendra toujours zéro.",
  };
}

export function formatOriginesJamaisEcritesLines(r) {
  if (!r?.mesurable) return [`ORIGINES D'USAGE : PAS MESURÉ — ${r?.pourquoi ?? "aucune donnée"}`];
  const L = [];
  if (!r.jamaisEcrites.length) {
    L.push(`Origines d'usage : les ${r.originesExaminees} déclarées sont toutes productibles (${r.attestees.length} attestée(s) par le journal${r.evenementsLus != null ? ` de ${r.evenementsLus} événements` : ""}, ${r.cheminSansUsage.length} par un chemin automatique jamais encore emprunté).`);
  } else {
    L.push(`🔴 ${r.jamaisEcrites.length} origine(s) d'usage sur ${r.originesExaminees} qu'aucun chemin automatique ne produit et que le journal n'a JAMAIS portée : ${r.jamaisEcrites.join(", ")}.`);
    L.push("   Une catégorie inécrite se lit « zéro » exactement comme une catégorie réellement inutilisée —");
    L.push("   et tout outil qui la lit rend un verdict sur du vide. À câbler ou à retirer, jamais à laisser en l'état.");
  }
  if (r.cheminSansUsage.length) L.push(`   (${r.cheminSansUsage.length} origine(s) ont un chemin mais aucun événement à ce jour : ${r.cheminSansUsage.join(", ")} — un chemin non emprunté n'est pas un chemin absent.)`);
  L.push(`   HORS PORTÉE : ${r.horsPortee}`);
  return L;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// LA FAILLE 8 DE L'ARTICLE 31, ENFIN MÉCANIQUE (2026-09-28, tâche #765)
// ═══════════════════════════════════════════════════════════════════════════════════════════
//
// L'ARTICLE LA NOMME LUI-MÊME COMME « LA PLUS VICIEUSE » : « je cite un outil sans l'avoir lancé.
// Une phrase comme "d'après CASSANDRA..." est invérifiable si l'outil n'a pas tourné. → Tout
// rapport nomme l'outil ET l'horodatage réel de son passage, et le compteur d'usage
// (recordCliUsage) en garde la trace. Un outil cité sans passage enregistré est un outil qui n'a
// pas tourné. »
//
// LE COMPTEUR GARDAIT BIEN LA TRACE — ET PERSONNE NE LA CONFRONTAIT. La preuve existait, le
// vérificateur n'existait pas : exactement la forme d'obligation qui ne repose que sur la mémoire
// d'un agent, et qui disparaît donc à la session suivante (Article 27). Écrire « le compteur en
// garde la trace » n'a jamais empêché personne de citer un outil qu'il n'avait pas lancé.
//
// CE QU'ELLE VÉRIFIE, ET RIEN DE PLUS : pour chaque outil NOMMÉ dans un texte, existe-t-il un
// passage enregistré dans la fenêtre qui précède ? Elle ne dit pas si le rapport est bon, ni si
// l'outil a trouvé quelque chose — seulement s'il a tourné.
//
// TROIS ÉTATS, JAMAIS DEUX, parce que « pas de passage » et « pas d'historique » se réparent à
// l'opposé : lancer l'outil, ou aller voir pourquoi le compteur est vide.

export const FENETRE_CITATION_HEURES = 24;

// CE QUE L'ARTICLE VISE EST UNE ATTRIBUTION, PAS UNE MENTION — et ses propres mots le disent :
// « une phrase comme "d'après CASSANDRA..." est invérifiable si l'outil n'a pas tourné ». Nommer un
// outil dans une liste, dans un plan au futur, ou dans la citation d'une demande de l'utilisateur
// n'affirme RIEN sur un passage. Ma première version cherchait le simple nom et accusait neuf
// rapports sur douze, dont l'archive verbatim d'un prompt de l'utilisateur : elle reprochait à un
// texte de contenir les mots de quelqu'un d'autre.
//
// C'EST LA TROISIÈME FOIS DE LA MÊME NUIT que ce dépôt paie « une MENTION n'est pas un USAGE »
// (leçon #832) — après les phrases de SAFE-EXPORT et les sections catalogue d'Abraham. La classe
// est la même à chaque fois : un signal ADJACENT lu comme le signal visé.
//
// Un nom d'outil s'écrit de plusieurs façons — EN CAPITALES (CASSANDRA-RH) ou en slug
// (cassandra-rh) — et les deux comptent : n'en reconnaître qu'une laisserait la faille ouverte pour
// l'autre (leçon L37).
export const MOTIFS_ATTRIBUTION = [
  (n) => new RegExp(`(?:d'apr[èe]s|selon|source\\s*:|mesur[ée]\\s+par|trouv[ée]\\s+par|relev[ée]\\s+par|signal[ée]\\s+par|d'?apres)\\s+[«"'\`]?${n}`, "i"),
  (n) => new RegExp(`${n}\\s*[»"'\`]?\\s+(?:dit|affirme|annonce|rend|compte|conclut|a\\s+trouv|signale|mesure|indique|rapporte)`, "i"),
];

export function outilsCitesDans(texte = "", slugsConnus = []) {
  const t = String(texte);
  return slugsConnus.filter((slug) => {
    const s = String(slug);
    if (s.length < 4) return false;   // un slug trop court produirait des coïncidences
    const formes = [s, s.replace(/-/g, "[- ]"), s.toUpperCase().replace(/-/g, "[- ]")];
    return formes.some((f) => MOTIFS_ATTRIBUTION.some((m) => m(f).test(t)));
  });
}

// TROIS EXCLUSIONS, TROUVÉES AU PREMIER VRAI PASSAGE (2026-09-28), et sans elles la vérification
// accusait neuf rapports sur douze — un garde-fou qui accuse tout le monde n'accuse plus personne
// (leçon L4). Chacune répond à un cas concret vu sur le disque, aucune n'est une précaution
// théorique.
//
// (1) L'AUTEUR D'UN RAPPORT N'EST PAS UNE CITATION. `safe-export` était accusé dans SON PROPRE
//     rapport : il l'a produit, donc il a tourné. C'était l'accusation la plus absurde des trois.
//
// (2) UN INVENTAIRE ÉNUMÈRE, IL NE CITE PAS. Le rapport des kits nomme les vingt-cinq outils du
//     parc parce que c'est son sujet ; le récapitulatif de Ronde fait pareil. Les traiter comme des
//     citations de source revient à exiger que le parc entier ait tourné pour qu'on puisse en
//     DRESSER LA LISTE. Le seuil est DÉRIVÉ, jamais choisi : au-delà du tiers des outils connus,
//     c'est un inventaire. Même raisonnement que les sections catalogue du croisement d'Abraham.
//
// (3) UN HORODATAGE PERDU N'EST PAS UNE ABSENCE DE PASSAGE. Les 327 événements réparés portent
//     `horodatagePerdu: true` : on sait que l'outil a tourné, on ne sait plus quand. Le compter
//     comme « n'a pas tourné » serait transformer une lacune de mesure en accusation — très
//     exactement ce que ce dépôt appelle un faux rouge (leçons L5/L11).
export const PART_POUR_ETRE_UN_INVENTAIRE = 1 / 3;

export function findOutilsCitesSansPassage(texte = "", slugsConnus = [], {
  history = null, now = Date.now(), fenetreHeures = FENETRE_CITATION_HEURES, readFile = undefined,
  auteur = null, partInventaire = PART_POUR_ETRE_UN_INVENTAIRE,
} = {}) {
  const h = history ?? (readFile ? loadToolUsageHistory(readFile) : loadToolUsageHistory());
  const events = h?.events ?? [];
  const tous = outilsCitesDans(texte, slugsConnus);
  if (slugsConnus.length && tous.length > slugsConnus.length * partInventaire) {
    return { mesurable: false, cites: tous, sansPassage: [], inventaire: true,
      pourquoi: `ce texte nomme ${tous.length} outils sur ${slugsConnus.length} : c'est un INVENTAIRE, pas une citation de sources. Exiger que le parc entier ait tourné pour qu'on puisse en dresser la liste serait absurde.` };
  }
  const cites = tous.filter((slug) => slug !== auteur);
  if (!events.length) {
    return { mesurable: false, cites, sansPassage: [],
      pourquoi: "aucun événement d'usage enregistré : on ne peut pas dire si les outils cités ont tourné, ce qui n'est PAS la même chose que « ils n'ont pas tourné »" };
  }
  const limite = now - fenetreHeures * 3600 * 1000;
  const sansPassage = [], horodatagePerdu = [];
  for (const slug of cites) {
    const siens = events.filter((e) => e.toolSlug === slug);
    if (siens.some((e) => typeof e.at === "number" && e.at >= limite && e.at <= now)) continue;
    if (siens.some((e) => e.horodatagePerdu)) { horodatagePerdu.push(slug); continue; }
    sansPassage.push(slug);
  }
  return {
    mesurable: true, cites, sansPassage, horodatagePerdu, fenetreHeures,
    pourquoi: sansPassage.length
      ? `${sansPassage.length} outil(s) nommés sans aucun passage enregistré dans les ${fenetreHeures} dernières heures : ${sansPassage.join(", ")} — un outil cité sans passage est un outil qui n'a pas tourné (Article 31, faille 8)`
      : `les ${cites.length} outil(s) nommés ont tous un passage enregistré dans la fenêtre${horodatagePerdu.length ? ` (${horodatagePerdu.length} avec un horodatage perdu : on sait qu'ils ont tourné, plus quand)` : ""}`,
    horsPortee: "Elle vérifie qu'un outil a TOURNÉ, jamais que ce qu'on en dit est exact : un rapport peut citer un vrai passage et en tirer une conclusion fausse. Et elle ne voit que les outils qu'elle connaît — un nom absent du registre des slugs lui est invisible.",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) main();
