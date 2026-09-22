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

const HISTORY_PATH = fileURLToPath(new URL("../.tool-usage-history.json", import.meta.url));

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
export function recordToolUsage(toolSlug, origin, now = Date.now(), foundSomething = undefined) {
  if (!toolSlug) throw new Error("recordToolUsage: toolSlug obligatoire — un usage ne peut jamais être anonyme.");
  if (!USAGE_ORIGINS.includes(origin)) throw new Error(`recordToolUsage: origin inconnue "${origin}" — attendu l'une de ${USAGE_ORIGINS.join(", ")}`);
  const history = loadJson(HISTORY_PATH, { events: [] });
  history.events = history.events ?? [];
  history.events.push({ toolSlug, origin, at: now, ...(typeof foundSomething === "boolean" ? { foundSomething } : {}) });
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 1));
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
export function recordCliUsage(toolSlug, now = Date.now(), env = process.env) {
  try {
    const declaree = env?.TOOL_USAGE_ORIGIN;
    recordToolUsage(toolSlug, USAGE_ORIGINS.includes(declaree) ? declaree : "cli_direct", now);
  } catch { /* best-effort, jamais bloquant — cf. commentaire ci-dessus */ }
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
    const history = loadJson(HISTORY_PATH, { events: [] });
    history.events = history.events ?? [];
    history.events.push({ toolSlug, origin: "fonction", fonction, at: now, ...(typeof foundSomething === "boolean" ? { foundSomething } : {}) });
    writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 1));
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
  const history = loadJson(HISTORY_PATH, { events: [] });
  history.contributions = history.contributions ?? [];
  history.contributions.push({ toolSlug, fichier, nature, par, at: now });
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 1));
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
  const history = loadJson(HISTORY_PATH, { events: [] });
  console.log(`Enregistré : ${toolSlug} (${origin}).`);
  console.log(JSON.stringify(toolUsageStats(history, toolSlug), null, 1));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
