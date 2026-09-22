// PROCESS.SIMULATION.GUARDIAN (2026-09-22, demande explicite de l'utilisateur : « je veux un agent
// script responsable du process simu (à l'image de process.circle) il s'appelle
// process.simulation.guardian »). Construit sur le modèle de circle-process-guardian.mjs, avec
// quatre différences voulues et calibrées le jour même.
//
// CE QU'IL EST, dans les mots de l'utilisateur : « il est là pour verifier que le process est
// respecté, verifier la discipline d'execution, c'est un referent pour toi ». Un référent, donc :
// on le consulte AVANT, pas seulement après. C'est la première différence avec le gardien de la
// Ronde, et la plus importante.
//
// POURQUOI « AVANT » EST LE C ŒUR. Une simulation coûte une heure de vrai quota Gemini. Le gardien de
// la Ronde constate après coup, ce qui va bien pour des tâches gratuites ; ici, un défaut de
// scénario constaté après coup a déjà brûlé l'heure. Les deux bugs de full_sim18 (aucun tour
// autonome en phase 2, observateur jamais identifié) étaient tous les deux visibles dans le scénario
// AVANT le lancement — personne ne les a regardés parce que rien ne le demandait.
//
// LA QUATRIÈME DIFFÉRENCE, et la plus structurelle : LE SCRIPT DE SIMULATION EST DÉSORMAIS CONSERVÉ.
// Jusqu'au 2026-09-22 il était réécrit de zéro à chaque fois puis jeté (scratchpad, jamais
// committé) — c'est la cause racine qui revient : la règle « la phase 2 doit contenir de vrais tours
// autonomes » a été apprise sur full_sim16, perdue avec son script, et re-commise sur full_sim18.
// Un gardien qui ne traiterait pas ça serait un constat de plus. Décision de l'utilisateur : un
// script unique, versionné, où le scénario devient un réglage plutôt qu'une réécriture.
//
// AUTORITÉ, tranchée le même jour : il BLOQUE par défaut un lancement qui échoue au contrôle
// préalable, mais un passage en force reste possible à condition d'être écrit — et la raison écrite
// part dans l'archive de la simulation. Protège le quota sans jamais enfermer sur un faux positif.
//
// ANTI-DOUBLON (§7ter) : ne recalcule JAMAIS ce que summarize-simulation-log.mjs sait déjà faire.
// Le contrôle d'après réutilise ses fonctions telles quelles.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { checkPhase2Autonomy, formatPhase2Autonomy, checkObserverIdentified, formatObserverIdentified, detectJournalShape } from "./summarize-simulation-log.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// ————————————————————————————————————————————————————————————————————————
// LES LEÇONS — chacune vient d'un vrai raté, chacune a déjà coûté une simulation
// ————————————————————————————————————————————————————————————————————————

// Contenu volontairement curaté à la main, et c'est écrit noir sur blanc comme l'Article 24 l'exige
// pour ce cas : une leçon tirée d'une simulation ratée ne se dérive d'aucun autre document, elle
// s'apprend. Ce qui EST mécanique, en revanche, c'est la vérification que chaque leçon porte sur un
// point réellement contrôlable — cf. `controle` ci-dessous, jamais une leçon sans prise.
export const LESSONS = [
  {
    id: "tours-autonomes",
    lecon: "La phase 2 doit intercaler de vrais tours autonomes entre les messages humains.",
    pourquoi: "Le dossier retourné ne peut se poser que sur un tour interact/autonomous, alors que le compteur qui l'autorise ne monte que sur un tour chat. Une phase 2 faite de chat seulement remplit la condition sans jamais offrir le tour où y répondre.",
    vecu: "full_sim16 puis full_sim18 — le second acte du jeu n'a jamais eu lieu, deux fois.",
    champ: "phase2AutonomousTurns",
  },
  {
    id: "identify",
    lecon: "L'observateur doit s'identifier (tour identify) avant son premier message.",
    pourquoi: "Sans pseudo, la fenêtre de saisie couvre toute la scène (aucune capture exploitable) et le jeu n'a aucun nom d'observateur en mémoire — le modèle comble alors le vide en inventant un nom.",
    vecu: "full_sim18 — Noé a appelé l'observateur « Caspeer », un nom que personne n'avait donné.",
    champ: "sendsIdentify",
  },
  {
    id: "port",
    lecon: "Viser le port réel du serveur de développement, jamais un port supposé.",
    pourquoi: "Le serveur n'écoute pas toujours sur le même port ; une simulation lancée sur le mauvais échoue d'emblée ou, pire, teste une instance périmée.",
    vecu: "full_sim16 et full_sim18 — port 3000 alors que le défaut du script était 5173.",
    champ: "baseUrl", interprete: (v) => Boolean(v),
  },
  {
    id: "verrous",
    lecon: "Toute réponse de refus du serveur doit faire avancer la boucle, jamais la figer.",
    pourquoi: "Un verrou légitime (les deux dorment, la roulette refroidit, aucun dossier à marquer) renvoie un refus ; une boucle qui réessaie à l'infini sur ce refus bloque la simulation entière.",
    vecu: "full_sim16 — le verrou « les deux dorment » a bloqué la boucle indéfiniment.",
    champ: "handlesLocks",
  },
  {
    id: "dossier-tardif",
    lecon: "Le dossier retourné se cherche dans tout l'historique, jamais dans une fenêtre de quelques tours.",
    pourquoi: "Il peut se générer bien après le moment où on l'attend ; une vérification faite une seule fois, dans une fenêtre étroite, conclut à tort qu'il n'existe pas.",
    vecu: "full_sim17 — le dossier existait au tour 180, le script avait cherché entre 90 et 95 et annoncé « non généré ».",
    champ: "dossierCheckedOnWholeHistory",
  },
];

// Les huit moments que toute simulation doit traverser pour valoir comme simulation intégrale
// (Article 18, étape 1 de docs/regles-de-travail.md — lus là-bas, jamais une seconde liste).
export const REQUIRED_BEATS = [
  "revelation", "dossier retourné", "négociation", "tirages de bonus distincts",
  "hostilité sévère", "humour noir", "désescalade", "bienveillance soutenue", "dispute",
  // M10 ajouté le 2026-09-22 à la demande de l'utilisateur, en relisant les neuf : un moment
  // d'intimité proposé par l'un des deux manquait, alors que c'est un des rares beats qui engage
  // vraiment la relation plutôt que le conflit ou l'enquête.
  "proposition intime de Noé ou Lia",
];

// ————————————————————————————————————————————————————————————————————————
// RENTABILISER LA SIMULATION — les agents qui peuvent la juger (2026-09-22)
// ————————————————————————————————————————————————————————————————————————
//
// Demande de l'utilisateur, et le constat derrière est juste : « je vois que tous les rapports qui
// pourraient être présents ne le sont pas [...] que la simu soit bien rentabilisée (comme la ronde
// est devenue) ».
//
// Une simulation coûte une heure de vrai quota. Elle produit un transcript, un journal d'actions,
// un dossier, des instantanés de mémoire, un poids de contexte par tour, un rendu à l'écran — et
// jusqu'ici DEUX agents seulement en tiraient quelque chose (EL-PROFESSOR et le KPI). Tout le
// reste de cette matière, payée au prix fort, était jeté.
//
// LA RÈGLE ANTI-RÉPÉTITION que l'utilisateur demande : exactement le mécanisme de la Ronde. Une
// table déclarée d'items, chacun avec son agent, ce qu'il produit et son coût — plus un garde-fou
// qui signale tout agent capable de juger une simulation et absent de cette table. On ne
// redécouvre donc plus à chaque fois « tiens, celui-là aussi aurait pu dire quelque chose ».
export const SIMULATION_ITEMS = [
  { id: "el-professor", agent: "EL-PROFESSOR", produit: "note de fidélité à la charte (Article 0) depuis le transcript", cout: "gratuit — relit un texte déjà produit", registre: "docs/el-professor/", existant: true },
  { id: "kpi", agent: "Tableau de bord interne (KPI)", produit: "les indicateurs chiffrés de ce run, comparables aux précédents", cout: "gratuit", registre: "docs/referentiel/kpi-rapports/", existant: true },
  { id: "resume-actions", agent: "summarize-simulation-log", produit: "le résumé compact des actions, extrait du journal brut avant de le jeter", cout: "gratuit", registre: "docs/simulations/", existant: true },
  // LES QUATRE QUI MANQUAIENT — chacun peut réellement juger une simulation, et aucun n'était
  // sollicité. C'est la réponse à « quels agents peuvent intervenir et produire un rapport ? ».
  { id: "the-screener", agent: "THE-SCREENER", produit: "la qualité visuelle réelle du rendu pendant la partie", cout: "gratuit — capture Playwright locale", registre: "docs/the-screener/", existant: false, pourquoiManquait: "jamais câblé dans une vraie simulation (tâche #186, ouverte depuis des jours) — et la leçon L2 existe précisément parce que ses captures restaient bloquées sur la modale" },
  { id: "memory-audit", agent: "memory-audit", produit: "la cohérence de la mémoire narrative persistée de Lia et Noé après la partie", cout: "gratuit — mécanique", registre: "docs/memory-audit/", existant: false, pourquoiManquait: "sa propre fiche dit qu'il n'est vérifiable QUE sur des instantanés réels de partie — donc exactement ici, et nulle part ailleurs" },
  { id: "memento-weight", agent: "memento weight", produit: "le poids réel du contexte envoyé à Gemini, tour par tour", cout: "gratuit — il enregistre pendant la partie, il suffit de le relire", registre: ".memento-history.json", existant: false, pourquoiManquait: "il écrit pendant chaque simulation et rien ne relisait jamais ce qu'il avait écrit" },
  { id: "cout-reel", agent: "Smart Conso API", produit: "ce que cette simulation a RÉELLEMENT coûté, à confronter à l'estimation d'avant lancement", cout: "gratuit — relit son propre journal", registre: ".smart-conso-session.json", existant: false, pourquoiManquait: "on consultait Smart Conso API AVANT pour décider, jamais APRÈS pour apprendre — donc l'estimation ne s'est jamais corrigée par l'expérience" },
];

// LE GARDE-FOU D'ÉVOLUTIVITÉ (Article 24) : un agent capable de juger une simulation et absent de
// la table ci-dessus doit être signalé, jamais découvert par hasard six mois plus tard. Le critère
// est déclaré plutôt que deviné — la leçon des trois détecteurs ratés de god le même jour : l'enjeu
// et la capacité sont des jugements, pas des mesures tirées du texte d'un script.
export const AGENTS_JUGEANT_UNE_SIMULATION = SIMULATION_ITEMS.map((i) => i.id);

export function findSimulationItemsMissing(items = SIMULATION_ITEMS) {
  return items.filter((i) => !i.existant);
}

export function simulationItemsLines(items = SIMULATION_ITEMS) {
  const manquants = findSimulationItemsMissing(items);
  const l = [`Agents pouvant juger cette simulation : ${items.length} — ${items.length - manquants.length} réellement sollicité(s).`];
  for (const i of items) l.push(`  ${i.existant ? "✅" : "✗ "} ${i.agent} — ${i.produit}${i.existant ? "" : `\n        manquait parce que : ${i.pourquoiManquait}`}`);
  if (manquants.length) l.push("", `⚠️ ${manquants.length} agent(s) capable(s) de juger cette heure de quota et jamais sollicité(s) : autant de matière payée puis jetée.`);
  return l;
}

// ————————————————————————————————————————————————————————————————————————
// CONTRÔLE PRÉALABLE — avant de brûler une heure de quota
// ————————————————————————————————————————————————————————————————————————

// `plan` décrit ce qui est sur le point d'être lancé. L'agent le fournit ; le gardien ne le devine
// jamais. Un champ absent n'est PAS traité comme faux : il est signalé comme non renseigné, parce
// que confondre « je n'ai pas l'information » et « la réponse est non » est exactement l'erreur que
// ce paysage d'outils combat.
// DEUX FORMATS, NOMMÉS ET DISTINCTS (2026-09-22, calibrage explicite de l'utilisateur : « oui pour
// une simulation complète, non pour un test ciblé »). Avant ça, les neuf moments étaient exigés de
// tout lancement — donc un essai court sur UNE mécanique précise ressortait comme un ratage alors
// qu'il répondait simplement à une autre question.
//
// LE GARDE-FOU QUI EMPÊCHE LA DÉRIVE ÉVIDENTE — que tout devienne un « test ciblé » pour échapper
// aux exigences : un test ciblé doit DÉCLARER À L'AVANCE les moments qu'il vise, et il est jugé sur
// ceux-là, entièrement. Un test ciblé sans moments déclarés n'est pas un test ciblé, c'est une
// simulation complète qui s'ignore — et il est traité comme telle.
export const FORMATS_SIMULATION = {
  complete: { label: "simulation intégrale (Article 18)", exigeTousLesBeats: true },
  cible: { label: "test ciblé sur une mécanique précise", exigeTousLesBeats: false },
};

export function beatsExigesPour(plan = {}, beats = REQUIRED_BEATS) {
  if (plan.format !== "cible") return { beats, format: "complete", raison: null };
  const vises = Array.isArray(plan.beatsVises) ? plan.beatsVises.filter((b) => beats.includes(b)) : [];
  if (!vises.length) {
    return { beats, format: "complete", raison: "format « ciblé » annoncé sans aucun moment visé déclaré — traité comme une simulation complète, puisque rien ne dit ce qu'il cible" };
  }
  const inconnus = (plan.beatsVises ?? []).filter((b) => !beats.includes(b));
  return { beats: vises, format: "cible", raison: inconnus.length ? `moment(s) visé(s) inconnu(s), ignoré(s) : ${inconnus.join(", ")}` : null };
}

export function preflight(plan = {}, { lessons = LESSONS, beats = REQUIRED_BEATS } = {}) {
  const echecs = [];
  // Les moments réellement exigés dépendent du format déclaré, jamais de la liste complète par défaut.
  const exigence = beatsExigesPour(plan, beats);
  beats = exigence.beats;
  const nonRenseignes = [];
  for (const l of lessons) {
    // CHAQUE LEÇON DÉCLARE SON CHAMP, ELLE NE LE TESTE PAS ELLE-MÊME (corrigé le 2026-09-22, au
    // premier test écrit sur cet outil). La première version confiait le test à la leçon, qui
    // renvoyait `plan.X === true` — donc TOUJOURS un booléen, y compris quand le champ n'existait
    // pas : « pas renseigné » devenait « non ». La même erreur que partout ailleurs dans ce
    // paysage, et commise ici dans le code même censé la combattre. Lire la valeur brute est la
    // seule façon de garder les trois états distincts : renseigné bon, renseigné mauvais, absent.
    const brut = plan[l.champ];
    if (brut === undefined || brut === null) { nonRenseignes.push(`${l.id} — ${l.lecon}`); continue; }
    const valeur = l.interprete ? l.interprete(brut) : brut === true;
    if (!valeur) echecs.push({ id: l.id, lecon: l.lecon, pourquoi: l.pourquoi, vecu: l.vecu });
  }

  const couverts = Array.isArray(plan.beats) ? plan.beats.map((b) => String(b).toLowerCase()) : undefined;
  const beatsManquants = couverts === undefined ? undefined : beats.filter((b) => !couverts.some((c) => c.includes(b.split(" ")[0].toLowerCase())));

  const consoConsultee = plan.smartConsoConsulted === true;

  return {
    echecs,
    nonRenseignes,
    beatsManquants,
    consoConsultee,
    // Le verdict ne vaut que sur ce qui a été renseigné — et il le dit.
    ok: echecs.length === 0 && consoConsultee && (beatsManquants?.length ?? 0) === 0 && nonRenseignes.length === 0,
  };
}

// Le blocage et son passage en force. La raison écrite n'est pas une formalité : elle part dans
// l'archive de la simulation, pour qu'on sache des mois plus tard pourquoi ce contrôle a été ignoré.
export function gate(verdict, { override } = {}) {
  if (verdict.ok) return { autorise: true, message: "Contrôle préalable passé — la simulation peut partir." };
  const raisons = [
    ...verdict.echecs.map((e) => `✗ ${e.lecon}\n    pourquoi : ${e.pourquoi}\n    déjà vécu : ${e.vecu}`),
    ...(verdict.consoConsultee ? [] : ["✗ Smart Conso API n'a pas été consultée avant cette action coûteuse (Article 22)."]),
    ...((verdict.beatsManquants?.length ?? 0) ? [`✗ Moments non couverts par le scénario : ${verdict.beatsManquants.join(", ")}`] : []),
    ...(verdict.nonRenseignes.length ? [`? Points non renseignés, donc ni validés ni invalidés : ${verdict.nonRenseignes.join(" | ")}`] : []),
  ];
  if (override && String(override).trim().length >= 20) {
    return { autorise: true, force: true, raisonForce: String(override).trim(), message: `⚠️ Contrôle préalable ÉCHOUÉ, passage en force assumé.\nRaison écrite (conservée dans l'archive) : ${String(override).trim()}\n\n${raisons.join("\n")}` };
  }
  return { autorise: false, message: `⛔ Lancement bloqué — ${raisons.length} point(s) :\n  ${raisons.join("\n  ")}\n\nPour passer outre : fournir une raison écrite d'au moins 20 caractères (elle sera archivée avec la simulation).` };
}

// ————————————————————————————————————————————————————————————————————————
// CONTRÔLE D'APRÈS — sur le journal réel, jamais sur une impression
// ————————————————————————————————————————————————————————————————————————

// Réutilise intégralement summarize-simulation-log.mjs : jamais un second calcul qui divergerait.
export function postflight(entries, { root = ROOT, simName } = {}) {
  const phase2 = checkPhase2Autonomy(entries);
  const observateur = checkObserverIdentified(entries);
  const etapesApres = [
    { cle: "transcript", libelle: "transcript archivé", present: simName ? existsSync(join(root, `docs/simulations/${simName}_transcript.txt`)) : undefined },
    { cle: "actions", libelle: "résumé d'actions archivé", present: simName ? existsSync(join(root, `docs/simulations/${simName}_actions.txt`)) : undefined },
    { cle: "note", libelle: "note EL-PROFESSOR écrite", present: simName ? existsSync(join(root, `docs/el-professor/${simName}.md`)) : undefined },
    { cle: "index-simu", libelle: "ligne de jugement dans l'index des simulations", present: simName ? indexMentions(join(root, "docs/simulations/index.md"), simName) : undefined },
    { cle: "index-kpi", libelle: "ligne dans l'index KPI", present: simName ? indexMentions(join(root, "docs/referentiel/kpi-index.md"), simName) : undefined },
  ];
  return {
    shape: detectJournalShape(entries),
    phase2,
    observateur,
    etapesApres,
    manquantes: etapesApres.filter((e) => e.present === false).map((e) => e.libelle),
    nonVerifiables: etapesApres.filter((e) => e.present === undefined).map((e) => e.libelle),
    ok: phase2.suffisant !== false && observateur.identifie !== false && etapesApres.every((e) => e.present !== false),
  };
}

function indexMentions(chemin, simName) {
  try { return readFileSync(chemin, "utf8").includes(simName); } catch { return undefined; }
}

// ————————————————————————————————————————————————————————————————————————
// LE RÔLE DE RÉFÉRENT — ce que l'agent vient lui demander
// ————————————————————————————————————————————————————————————————————————

// « C'est un référent pour toi » (utilisateur, 2026-09-22) : appelé sans rien, il récite ce qu'il
// faut savoir avant de lancer, plutôt que d'attendre qu'on ait déjà tout fait pour juger.
export function brief({ lessons = LESSONS, beats = REQUIRED_BEATS } = {}) {
  return [
    "Avant de lancer une simulation, ces cinq leçons ont chacune déjà coûté une simulation entière :",
    ...lessons.map((l) => `  · ${l.lecon}\n      ${l.vecu}`),
    "",
    `Les ${beats.length} moments que le scénario doit couvrir : ${beats.join(", ")}.`,
    "",
    "Et avant tout : consulter Smart Conso API (Article 22), puis relire docs/simulations/correctifs-a-revalider.md",
    "pour savoir ce que cette simulation est censée confirmer.",
  ].join("\n");
}

function main() {
  printReliabilityNotice("process-simulation-guardian");
  recordCliUsage("process-simulation-guardian");
  const sub = process.argv[2];
  if (!sub || sub === "brief") {
    console.log("=== process.simulation.guardian — référent avant lancement ===\n");
    console.log(brief());
    return;
  }
  if (sub === "postflight") {
    const chemin = process.argv[3];
    const simName = process.argv[4];
    if (!chemin) { console.log("Usage : node scripts/process-simulation-guardian.mjs postflight <journal.json> [nomDeLaSimu]"); process.exitCode = 1; return; }
    const v = postflight(JSON.parse(readFileSync(chemin, "utf8")), { simName });
    console.log("=== process.simulation.guardian — contrôle d'après ===\n");
    console.log(formatPhase2Autonomy(v.phase2));
    console.log(formatObserverIdentified(v.observateur));
    console.log("");
    for (const e of v.etapesApres) console.log(`  ${e.present === true ? "✔" : e.present === false ? "✗" : "?"} ${e.libelle}`);
    if (v.nonVerifiables.length) console.log(`\n  (? = non vérifiable sans le nom de la simulation — le fournir en second argument)`);
    console.log(`\nVerdict : ${v.ok ? "process respecté sur tout ce qui est vérifiable" : "⚠️ des points restent ouverts"}`);
    return;
  }
  console.log("Usage : node scripts/process-simulation-guardian.mjs [brief | postflight <journal.json> [nomDeLaSimu]]");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
