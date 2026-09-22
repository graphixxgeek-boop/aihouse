// GABARIT UNIFIÉ DES RAPPORTS (2026-09-22, tâche #199, demande explicite de l'utilisateur :
// « doc-report nouvelle fonction : s'assurer que tous les reports ont le meme format, gabarit : ce
// format est graphique (txt ou html, mise en page, couleurs, etc.) mais aussi au niveau du contenu :
// message d'en tete, titres, facon de presnter, organisation, structure... Il y a une place dans
// chaque report pour pouvoir importer une phrase generique, comme le probleme qu'on a eu a devoir
// inserer la phrase "resultats non garantis" »).
//
// L'ASYMÉTRIE RÉELLE QUI L'A MOTIVÉ, mesurée avant d'écrire une ligne (Article 19) : les rapports
// HTML partageaient DÉJÀ un contrat unique depuis html-report.mjs (`title` / `subtitle` /
// `dateLabel` / `blocks` / `footer`), et c'est pour ça qu'ils se ressemblent tous. Les rapports
// TEXTE, eux, n'avaient aucun contrat : chaque outil improvisait son en-tête, son titre, sa façon
// de dater, son ordre. D'où l'épisode de la phrase de fiabilité, qu'il a fallu insérer à la main
// dans 28 fichiers faute d'un endroit prévu pour ça.
//
// CE FICHIER EST LA DÉFINITION UNIQUE. Une seule description de ce qu'EST un rapport ; deux rendus
// (texte et HTML) qui la consomment, jamais deux définitions parallèles qui divergeraient au premier
// changement. html-report.mjs garde le rendu HTML (mise en page, couleurs, zoom) et passe désormais
// par le même cadre — jamais un second gabarit concurrent (règle anti-doublon, §7ter).
//
// L'EMPLACEMENT GÉNÉRIQUE (`slots`) est le cœur de la demande : une place réservée, en tête, que
// n'importe quelle phrase transverse future peut occuper sans repasser sur trente scripts. Son
// premier locataire est l'avertissement de fiabilité (TOOL_RELIABILITY, tâche #198) ; une mention
// légale, un rappel de contexte ou un statut de chantier s'y ajouteraient de la même façon.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { reliabilityNotice } from "./lib-shell.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
// Où l'agent dépose l'identité de sa session. Un fichier local, jamais committé (cf. .gitignore) :
// il décrit QUI a produit un rapport à un instant donné, pas un état du projet.
export const SESSION_FILE = ".agent-session.json";

// Ce que TOUT rapport porte, dans cet ordre — la partie « contenu » du gabarit, celle qui vaut
// autant pour un .txt que pour un .html. Exportée pour être vérifiable mécaniquement plutôt que
// simplement promise en commentaire (Article 24).
export const REPORT_CONTRACT = [
  { cle: "title", obligatoire: true, role: "de quoi parle ce rapport — jamais un rapport sans titre" },
  { cle: "subtitle", obligatoire: false, role: "la portée exacte et le renvoi au référentiel de l'outil" },
  { cle: "dateLabel", obligatoire: true, role: "quand il a été produit — un rapport sans date ne se compare à rien" },
  { cle: "slots", obligatoire: false, role: "l'emplacement générique d'en-tête : phrases transverses venues d'un registre partagé, jamais écrites à la main dans l'outil" },
  { cle: "blocks", obligatoire: true, role: "le corps : les constats réels de l'outil, et eux seuls" },
  { cle: "footer", obligatoire: false, role: "la limite de l'outil — ce qu'il ne prétend pas faire" },
];

// CARTE D'IDENTITÉ DU RAPPORT (2026-09-22, demande explicite de l'utilisateur : « la version de
// claude utilisée au moment de la conception du rapport, avec aussi en plus les infos generiques du
// rapport : date, heure, etc. + infos pertinentes à conserver »). Elle occupe l'emplacement
// générique déjà prévu, jamais réécrite à la main dans chaque outil — c'était tout l'objet du
// gabarit.
//
// POURQUOI CES CHAMPS-LÀ, et pas seulement la date. Un rapport se relit des semaines plus tard, et
// la seule question qui compte alors est : « est-ce que ce constat est encore vrai ? ». Y répondre
// exige de savoir de quel état du projet il parlait (version du code, branche), si cet état était
// seulement retrouvable (du travail non enregistré traînait-il ?), dans quel cadre il a été produit
// (Ronde, nuit autonome, demande directe), et si l'outil qui l'a écrit avait lui-même bougé depuis.
// Les quatre ont été choisis par l'utilisateur ce jour-là ; la version du modèle s'y ajoute.

// LE MODÈLE NE SE DEVINE PAS. Un script ne peut pas savoir quel modèle fait tourner l'agent : il
// faut que l'agent le dépose. D'où la règle, tranchée avec l'utilisateur le 2026-09-22 : en son
// absence le rapport écrit « non renseignée », JAMAIS un nom deviné ni le dernier connu — une
// version périmée affirmée avec aplomb serait exactement l'erreur que tout ce paysage combat (une
// absence de mesure présentée comme une mesure). L'utilisateur a ajouté le corollaire : veiller à ce
// que ce cas n'arrive jamais est le travail du gardien de process, pas celui du rapport.
export function recordAgentSession({ model, sessionId, root = ROOT } = {}) {
  const payload = { model: model ?? null, sessionId: sessionId ?? null, recordedAt: new Date().toISOString() };
  writeFileSync(join(root, SESSION_FILE), JSON.stringify(payload, null, 1));
  return payload;
}

export function readAgentSession({ root = ROOT, readFileImpl = readFileSync } = {}) {
  try {
    const raw = JSON.parse(readFileImpl(join(root, SESSION_FILE), "utf8"));
    return { model: raw?.model ?? undefined, sessionId: raw?.sessionId ?? undefined, recordedAt: raw?.recordedAt ?? undefined };
  } catch {
    return {};
  }
}

// L'état réel du dépôt, LU au moment du rapport (Article 24 : jamais une valeur recopiée). Un dépôt
// illisible répond par des absences, jamais par des valeurs inventées.
export function repoState({ shImpl } = {}) {
  const run = shImpl ?? ((args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim());
  const safe = (args) => { try { return run(args) || undefined; } catch { return undefined; } };
  const dirtyRaw = safe(["status", "--porcelain"]);
  return {
    commit: safe(["rev-parse", "--short", "HEAD"]),
    branche: safe(["rev-parse", "--abbrev-ref", "HEAD"]),
    // `undefined` (dépôt illisible) et `false` (arbre propre) ne veulent pas dire la même chose et
    // ne sont jamais confondus : seul le second autorise à écrire que l'état était retrouvable.
    travauxNonEnregistres: dirtyRaw === undefined ? undefined : dirtyRaw.length > 0,
  };
}

// Depuis quand l'outil qui écrit ce rapport n'a pas changé — un constat rassurant produit par un
// outil figé depuis des semaines ne vaut pas celui d'un outil à jour.
export function toolLastChanged(scriptPath, { shImpl } = {}) {
  if (!scriptPath) return undefined;
  const run = shImpl ?? ((args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim());
  try { return run(["log", "-1", "--format=%ad", "--date=short", "--", scriptPath]) || undefined; } catch { return undefined; }
}

// D'où vient le rapport. Déposé par l'appelant (la Ronde, le mode nocturne) ou, à défaut, lu dans
// l'environnement — jamais supposé : sans indication, on écrit que ce n'est pas précisé.
export const REPORT_ORIGINS = { ronde: "Ronde périodique", nuit: "nuit autonome", demande: "demande directe" };
export function reportOrigin({ origin, env = process.env } = {}) {
  const clef = origin ?? env.REPORT_ORIGIN;
  return REPORT_ORIGINS[clef] ?? (clef ? String(clef) : undefined);
}

// Assemble la carte d'identité en lignes prêtes à afficher. Chaque absence est NOMMÉE, jamais
// silencieusement omise : une ligne manquante se lirait comme une information jugée sans intérêt,
// alors qu'elle signale un trou à combler.
export function identityLines({ tool, scriptPath, origin, session, repo, changedAt, gravite, health } = {}) {
  const s = session ?? readAgentSession();
  const r = repo ?? repoState();
  const lignes = [];
  lignes.push(`Version de Claude : ${s.model ?? "non renseignée (à déposer par l'agent — cf. god-of-all-process)"}`);
  const d = new Date();
  lignes.push(`Produit le : ${d.toISOString().slice(0, 10)} à ${d.toISOString().slice(11, 16)} UTC`);
  lignes.push(`État du code : ${r.commit ?? "inconnu"}${r.branche ? ` sur ${r.branche}` : ""}${r.travauxNonEnregistres === true ? " — ⚠️ des travaux n'étaient pas enregistrés, cet état n'est pas retrouvable tel quel" : r.travauxNonEnregistres === false ? " — arbre propre" : ""}`);
  const o = reportOrigin({ origin });
  lignes.push(`Contexte de production : ${o ?? "non précisé"}`);
  const c = changedAt ?? toolLastChanged(scriptPath);
  if (tool || scriptPath) lignes.push(`Outil : ${tool ?? scriptPath}${c ? ` — inchangé depuis le ${c}` : " — date de dernière modification inconnue"}`);
  // LES DEUX NOTES, toujours séparées (décision de l'utilisateur, 2026-09-22) : l'une dit comment va
  // l'outil, l'autre ce que vaut ce rapport-ci. Les fondre en un seul chiffre les rendrait illisibles.
  if (tool) lignes.push(healthLine(tool, { health }));
  lignes.push(gravityLine(gravite));
  return lignes;
}

// Les phrases transverses disponibles pour l'emplacement générique. Une seule aujourd'hui ; le point
// de la demande est qu'une seconde s'ajoute ICI et atteigne tous les rapports d'un coup.
export function genericSlots(tool, options = {}) {
  if (!tool) return [];
  // La carte d'identité vient APRÈS l'avertissement de fiabilité : ce qu'on doit lire avant de faire
  // confiance au rapport passe avant ce qui sert à le situer plus tard.
  return [reliabilityNotice(tool), identityLines({ tool, ...options }).join("\n")].filter(Boolean);
}

// Normalise ce qu'un outil fournit en un cadre complet, avec l'emplacement générique déjà rempli.
// C'est le seul point de passage : les deux rendus consomment SON résultat, jamais les arguments
// bruts de l'appelant — sans quoi l'un pourrait oublier une partie du gabarit que l'autre applique.
export function buildReportFrame({ tool, title, subtitle, dateLabel, blocks = [], footer, scriptPath, origin, session, repo, changedAt, gravite, health, planDaction = null } = {}) {
  if (!title) throw new Error("buildReportFrame() exige un titre — jamais un rapport sans titre (REPORT_CONTRACT)");
  return {
    tool,
    title,
    subtitle,
    dateLabel: dateLabel ?? new Date().toISOString(),
    slots: genericSlots(tool, { scriptPath, origin, session, repo, changedAt, gravite, health }),
    // Le plan d'action ferme TOUJOURS le rapport, après les constats et jamais avant : on ne décide
    // pas de ce qu'on fait d'une trouvaille avant de l'avoir exposée.
    blocks: planDaction ? [...blocks, { type: "heading", text: PLAN_ACTION_TITRE }, { type: "note", text: planDaction.lignes.join("\n") }] : blocks,
    planDaction,
    footer,
  };
}

// ————————————————————————————————————————————————————————————————————————
// LA CHAÎNE RAPPORT → PLAN D'ACTION → TÂCHES (2026-09-22, principe fondamental posé par
// l'utilisateur, et qualifié par lui de TRÈS IMPORTANT)
// ————————————————————————————————————————————————————————————————————————
//
// Dans ses mots : « un rapport produit des infos qui sont traitées lors d'une analyse : de cette
// analyse ressort un plan d'action correctif ou des ajustements/optimisation. De ce plan d'action
// ressort des taches à inscrire dans check-list ».
//
// LE TROU QUE ÇA FERME, et il est béant : aujourd'hui un outil trouve quelque chose, l'écrit, et
// c'est fini. Rien ne garantit que le constat devienne une action. Tout ce paysage d'outils existe
// pour produire des trouvailles, et personne ne vérifiait qu'une seule d'entre elles soit suivie
// d'effet — le plus gros gaspillage possible, et le plus discret, puisqu'un rapport produit
// ressemble à un problème traité.
//
// OÙ VIT LE PLAN (tranché par l'utilisateur) : DANS LE RAPPORT LUI-MÊME, jamais dans un document à
// part. Raison décisive : un plan qui voyage avec le rapport qui l'a motivé ne peut pas se perdre,
// et son absence se repère mécaniquement. Un troisième endroit à tenir à jour se serait périmé.
//
// LES TROIS ÉTATS D'UN CONSTAT, jamais deux — c'est ce qui empêche le plan de devenir une formalité
// qu'on remplit pour faire taire le gardien :
//   · RETENU   — ça devient une tâche, et cette tâche doit exister pour de vrai ;
//   · ÉCARTÉ   — on a regardé et on ne fait rien, avec la raison écrite ;
//   · À TRANCHER — ça demande une décision qui n'est pas la mienne.
// Un constat sans l'un de ces trois états est un constat dont personne ne répond.

export const ETATS_CONSTAT = ["retenu", "ecarte", "a-trancher"];
export const PLAN_ACTION_TITRE = "Plan d'action";

// LE NIVEAU D'UNE TÂCHE (2026-09-23, demande explicite : « chaque rapport suit la logique :
// CONSTAT >> TÂCHES RECOMMANDÉES OU OBLIGATOIRES »).
//
// Deux critères, et le PREMIER PRIME — calibré le même jour, « 3 en priorité et 1 » :
//   1. le correctif touche le JEU (Lia, Noé, l'expérience du visiteur) ;
//   2. le défaut fausse une mesure, viole une règle écrite, ou laisse un garde-fou inopérant.
// Tout le reste est RECOMMANDÉ. Critère mécanique : un outil l'applique seul, sans redemander.
//
// Pourquoi le jeu prime : l'Agence est un outil, le site est le produit. Un défaut qui abîme ce que
// le visiteur voit ne se met jamais en file derrière un défaut d'outillage, si élégant soit-il.
export const NIVEAUX_TACHE = ["obligatoire", "recommandee"];
export const RAISONS_OBLIGATOIRE = [
  { id: "touche-le-jeu", libelle: "touche le jeu (Lia, Noé, l'expérience du visiteur)", prime: true },
  { id: "fausse-une-mesure", libelle: "fausse une mesure, viole une règle écrite, ou laisse un garde-fou inopérant", prime: false },
];

// niveauDeLaTache() — le classement, dérivé et jamais deviné. Un constat qui ne déclare aucune des
// deux raisons est RECOMMANDÉ : l'obligation se justifie, elle ne se suppose pas.
export function niveauDeLaTache({ toucheLeJeu = false, fausseUneMesure = false } = {}) {
  if (toucheLeJeu) return { niveau: "obligatoire", raison: RAISONS_OBLIGATOIRE[0].libelle };
  if (fausseUneMesure) return { niveau: "obligatoire", raison: RAISONS_OBLIGATOIRE[1].libelle };
  return { niveau: "recommandee", raison: "ni l'un ni l'autre — l'obligation se justifie, elle ne se suppose pas" };
}

// Construit la section. `constats` : [{ constat, etat, pourquoi?, tache? }].
export function buildPlanDaction(constats = [], { toolSlug } = {}) {
  const inconnus = constats.filter((c) => !ETATS_CONSTAT.includes(c.etat));
  if (inconnus.length) throw new Error(`buildPlanDaction(): état inconnu "${inconnus[0].etat}" — attendu ${ETATS_CONSTAT.join(", ")}. Un constat sans état déclaré est un constat dont personne ne répond.`);
  const retenus = constats.filter((c) => c.etat === "retenu");
  const sansTache = retenus.filter((c) => !c.tache);
  const lignes = [];
  if (!constats.length) {
    // Un rapport qui n'a rien trouvé a bel et bien un plan d'action : « rien à faire ». L'écrire
    // noir sur blanc distingue « j'ai regardé, il n'y a rien » de « je n'ai pas conclu » — deux
    // choses qu'une section absente confondrait.
    lignes.push("Aucun constat retenu : ce passage n'a rien trouvé qui appelle une action.");
    return { lignes, retenus: [], sansTache: [], vide: true };
  }
  for (const c of constats) {
    if (c.etat === "retenu") {
      // Le NIVEAU accompagne toujours la tâche (2026-09-23) : une tâche sans niveau laisse à la
      // lecture le soin de deviner si elle presse, et une lecture qui devine se trompe.
      const n = c.tache ? niveauDeLaTache(c) : null;
      const etiquette = n ? ` [${n.niveau.toUpperCase()}]` : "";
      lignes.push(`  → RETENU · ${c.constat}${c.tache ? ` — tâche${etiquette} : ${c.tache}` : " — ⚠️ aucune tâche associée"}`);
    }
    else if (c.etat === "ecarte") lignes.push(`  ✗ ÉCARTÉ · ${c.constat} — ${c.pourquoi ?? "⚠️ écarté sans raison écrite, ce qui n'est pas une décision"}`);
    else lignes.push(`  ? À TRANCHER · ${c.constat}${c.pourquoi ? ` — ${c.pourquoi}` : ""}`);
  }
  if (sansTache.length) lignes.push("", `⚠️ ${sansTache.length} constat(s) retenu(s) sans tâche associée — un constat retenu qui ne devient pas une tâche est un constat oublié.`);
  return { lignes, retenus, sansTache, vide: false, toolSlug };
}

// planDactionDepuisEcarts() (2026-09-23) — le raccourci qui rend le câblage tenable.
//
// POURQUOI IL EXISTE. La chaîne de l'Article 28 demandait à chaque outil de construire son plan
// d'action à la main, et le résultat s'est vu : ZÉRO outil sur 65 en produisait un. Une obligation
// dont le coût d'entrée est « écris vingt lignes » n'est pas respectée, elle est contournée.
// Avec ceci, un outil qui a déjà une liste d'écarts n'a plus qu'UNE ligne à écrire.
//
// CE QU'IL NE FAIT PAS, et c'est délibéré : il ne DEVINE jamais l'état d'un constat. Tout écart
// trouvé par un scan mécanique est « retenu » — c'est le seul état honnête pour une machine, qui
// ne peut ni écarter avec raison ni renvoyer à une décision humaine. L'agent qui relit peut
// requalifier ensuite ; l'outil, lui, ne s'autorise jamais à classer sans suite ce qu'il a trouvé.
//
// `toucheLeJeu` et `fausseUneMesure` sont DÉCLARÉS par l'outil appelant, jamais déduits d'un nom de
// fichier : seul l'outil sait si ce qu'il mesure touche le produit ou la mesure elle-même.
export function planDactionDepuisEcarts(ecarts = [], { toolSlug, tache, toucheLeJeu = false, fausseUneMesure = false, libelle = (e) => String(e?.message ?? e?.pourquoi ?? e) } = {}) {
  const constats = (ecarts ?? []).map((e) => ({
    constat: libelle(e),
    etat: "retenu",
    tache: typeof tache === "function" ? tache(e) : (tache ?? "à qualifier par l'agent à la lecture du rapport"),
    toucheLeJeu,
    fausseUneMesure,
  }));
  return buildPlanDaction(constats, { toolSlug });
}

// findOutilsSansPlanDaction() (2026-09-23) — le trou réel, et il est béant : la chaîne de
// l'Article 28 existe en code depuis le 2026-09-22, et DEUX outils sur trente-deux s'en servent.
// Le principe était posé, le mécanisme construit, et trente rapports continuaient de finir sur un
// constat sans dire ce qu'il fallait en faire.
//
// Ce que cette fonction peut dire, et ce qu'elle ne peut pas : elle voit qu'un script n'appelle
// jamais buildPlanDaction(), pas si son plan d'action est bon. Le cas grossier, comme toujours —
// et ici le cas grossier est le cas général.
//
// EXEMPTION DÉCLARÉE, jamais devinée : un outil qui ne produit aucun CONSTAT n'a rien à conclure.
// Un orchestrateur qui relaie ce que d'autres ont dit, un utilitaire de rendu, un compteur — leur
// demander un plan d'action produirait une section vide à chaque passage, c'est-à-dire du bruit
// qui apprend à ne plus lire les sections de plan d'action.
export const SANS_CONSTAT_PROPRE = {
  "le-coordinateur": "orchestrateur : il relaie ce que les autres ont trouvé, il ne trouve rien lui-même",
  "circle-tasks": "orchestrateur de la Ronde : les constats appartiennent aux items qu'il lance",
  "html-report": "utilitaire de rendu, aucun constat",
  "report-template": "le gabarit lui-même",
  "tool-usage": "compteur d'usage : il enregistre, il ne juge pas",
  "tool-brain": "aiguilleur : il recommande un outil, il ne constate rien sur le code",
  "find-booster": "outil de navigation dans un fichier, aucun verdict",
  "route-booster": "idem, points de coupe proposés",
  "ines-official": "aplatit le dépôt en une édition, aucun jugement",
  "serie-temporelle": "mécanisme partagé d'historisation, aucun constat propre",
  "integration-outil": "répond à une question posée, ne scanne rien de lui-même",
};

export function findOutilsSansPlanDaction(scripts = {}, { exemptes = SANS_CONSTAT_PROPRE } = {}) {
  return Object.entries(scripts)
    .filter(([slug, source]) => !(slug in exemptes) && !String(source ?? "").includes("buildPlanDaction"))
    .map(([slug]) => slug);
}

// LE REPÉRAGE MÉCANIQUE, et c'est lui qui donne sa force au principe : un rapport sans section de
// plan d'action se voit, donc on ne peut pas l'oublier discrètement.
export function reportHasPlanDaction(texte) {
  return typeof texte === "string" && texte.includes(PLAN_ACTION_TITRE);
}

// ————————————————————————————————————————————————————————————————————————
// LES DEUX NOTES (2026-09-22, demande de l'utilisateur : « Les outils ont tous une "note" à chaque
// rapport », calibrée le même jour en DEUX notes séparées, jamais mélangées)
// ————————————————————————————————————————————————————————————————————————
//
// Pourquoi deux et pas une : elles répondent à deux questions sans rapport, et les additionner en un
// seul chiffre rendrait les deux illisibles.
//   · SANTÉ DE L'OUTIL — est-ce que cet outil va bien ? Est-il sollicité pour de vrai, a-t-il un
//     objectif, l'atteint-il ? C'est le domaine de CASSANDRA, gardienne des objectifs et des KPI.
//   · GRAVITÉ DU CONTENU — ce que ce rapport-ci annonce est-il grave ? Seul l'outil qui l'écrit le
//     sait, donc il la FOURNIT ; elle n'est jamais devinée depuis l'extérieur.
//
// ÉVOLUTIVITÉ (Article 24, précision du même jour) : la santé se calcule pour N'IMPORTE QUEL slug à
// partir des registres partagés, sans aucune liste d'outils ici. Un outil qui rejoint l'équipe a
// donc sa note le jour même, sans qu'on ait à penser à l'inscrire quelque part.

export const GRAVITES = {
  rien: { libelle: "rien à signaler", ordre: 0 },
  attention: { libelle: "à regarder", ordre: 1 },
  serieux: { libelle: "sérieux — demande une décision", ordre: 2 },
};

// La santé d'un outil, LUE dans ce que les autres savent déjà — jamais un second calcul. Chaque
// signal absent est déclaré absent, jamais remplacé par une valeur neutre qui gonflerait la note :
// un outil qu'on ne sait pas mesurer n'est pas un outil en bonne santé, c'est un outil non mesuré.
export function toolHealth(slug, { root = ROOT } = {}) {
  if (!slug) return { mesurable: false, raison: "aucun outil nommé" };
  const signaux = [];
  let sollicitations;
  try {
    const journal = JSON.parse(readFileSync(join(root, ".tool-usage-history.json"), "utf8"));
    const evenements = Array.isArray(journal?.events) ? journal.events : [];
    // Le champ réel du journal est `toolSlug` — vérifié en LISANT un vrai événement, pas supposé
    // depuis le nom de la fonction qui l'écrit. La première version cherchait `tool`/`slug` et
    // trouvait donc zéro pour tout le monde : chaque outil se serait affiché « jamais sollicité »
    // dans son propre en-tête, une fausse mesure diffusée sur 29 rapports d'un coup. Les deux
    // anciennes clés restent acceptées au cas où un journal plus ancien traînerait.
    sollicitations = evenements.filter((e) => e?.toolSlug === slug || e?.tool === slug || e?.slug === slug).length;
    signaux.push(sollicitations > 0
      ? { clef: "usage", ok: true, texte: `${sollicitations} sollicitation(s) réelle(s) enregistrée(s)` }
      : { clef: "usage", ok: false, texte: "jamais sollicité d'après le compteur — ou jamais instrumenté pour l'être" });
  } catch {
    signaux.push({ clef: "usage", ok: undefined, texte: "compteur d'usage illisible — non mesuré" });
  }
  try {
    const registre = readFileSync(join(root, "docs/objectifs-vs-resultats/registre.md"), "utf8");
    // TROIS ÉTATS, jamais deux (2026-09-22) : un objectif chiffré, une absence ASSUMÉE (la ligne
    // existe, sa colonne Objectif vaut « — » et sa Note dit pourquoi), ou rien du tout. Sans le
    // deuxième, la note pousserait à inventer un objectif creux pour un Gardien qui tourne à chaque
    // commit — un chiffre qui ne mesurerait que le nombre de commits. Inventer un objectif pour
    // verdir une note est exactement le travers que le badge évite déjà par ailleurs.
    const ligne = registre.split("\n").find((l) => l.startsWith("|") && l.split("|")[1]?.trim() === slug);
    const objectif = ligne ? ligne.split("|")[4]?.trim() : undefined;
    const absenceAssumee = Boolean(ligne) && (objectif === "—" || objectif === "-" || objectif === "");
    signaux.push(absenceAssumee
      ? { clef: "objectif", ok: true, texte: "aucun objectif chiffré, et c'est une décision écrite — pas un oubli" }
      : ligne
        ? { clef: "objectif", ok: true, texte: "un objectif chiffré lui est fixé" }
        : { clef: "objectif", ok: false, texte: "aucun objectif chiffré — rien à quoi comparer son résultat" });
  } catch {
    signaux.push({ clef: "objectif", ok: undefined, texte: "registre d'objectifs illisible — non mesuré" });
  }
  const mesures = signaux.filter((s) => s.ok !== undefined);
  const bons = mesures.filter((s) => s.ok).length;
  return {
    mesurable: mesures.length > 0,
    signaux,
    // Le score porte sur ce qui a pu être mesuré, et le dénominateur est affiché : « 1/2 » dit
    // quelque chose, « 50 % » sur un seul signal mesuré ne dirait rien.
    bons,
    mesures: mesures.length,
    nonMesures: signaux.filter((s) => s.ok === undefined).length,
  };
}

export function healthLine(slug, { root = ROOT, health } = {}) {
  const h = health ?? toolHealth(slug, { root });
  if (!h.mesurable) return `Santé de l'outil : non mesurable (${h.raison ?? "aucun signal lisible"})`;
  const detail = h.signaux.filter((s) => s.ok === false).map((s) => s.texte);
  return `Santé de l'outil : ${h.bons}/${h.mesures} signal(aux) au vert${h.nonMesures ? `, ${h.nonMesures} non mesuré(s)` : ""}${detail.length ? ` — ${detail.join(" ; ")}` : ""}`;
}

// La gravité vient de l'outil, jamais d'ailleurs. Non fournie, elle est dite non fournie : deviner
// « rien à signaler » sur un rapport qui annonce peut-être un incendie serait le pire des défauts.
export function gravityLine(gravite) {
  if (!gravite) return "Gravité de ce rapport : non renseignée par l'outil — à lire pour le savoir";
  const g = GRAVITES[gravite];
  return `Gravité de ce rapport : ${g ? g.libelle : String(gravite)}`;
}

// L'EN-TÊTE PARTAGÉ, IMPRIMABLE (2026-09-22, ajouté pour rendre la migration des 18 outils non
// unifiés réalisable sans réécrire leur corps). Beaucoup d'outils impriment leur rapport au fil de
// l'eau dans le terminal plutôt que de construire un objet complet : leur demander de tout
// restructurer d'un coup, c'est réécrire dix-huit sorties que quelqu'un lit vraiment, avec le risque
// d'en abîmer une. Or ce que le gabarit apporte vraiment tient dans l'EN-TÊTE — l'avertissement de
// fiabilité et la carte d'identité, tous deux venus des registres partagés. Cette fonction imprime
// exactement cet en-tête en passant par buildReportFrame(), donc sans aucun second gabarit
// concurrent ; le corps reste la voix de chaque outil.
//
// Elle remplace, chez l'appelant, le couple « printReliabilityNotice(slug) + console.log('=== TITRE
// ===') » qui était jusqu'ici recopié à la main dans chaque script — exactement le genre de
// duplication que le gabarit existe pour supprimer.
export function printReportHeader({ tool, title, subtitle, scriptPath, origin, gravite, log = console.log } = {}) {
  const frame = buildReportFrame({ tool, title, subtitle, scriptPath, origin, gravite, blocks: [] });
  for (const phrase of frame.slots) log(phrase + "\n");
  log(`=== ${frame.title} ===`);
  if (frame.subtitle) log(frame.subtitle);
  log("");
  return frame;
}

// Rendu TEXTE — le pendant exact de renderHtmlReport(), même cadre, même ordre, même emplacement
// générique. Volontairement sobre : un rapport texte se lit dans un terminal et se relit par un
// autre outil, jamais une décoration qui gênerait l'un ou l'autre.
export function renderTextReport(frame) {
  // Reconnu à `slots`, jamais au titre : un objet brut d'appelant a lui aussi un titre, si bien
  // qu'un test sur le titre prenait l'entrée brute pour un cadre déjà construit et sautait
  // silencieusement tout le gabarit (trouvé au premier essai réel de cette fonction). `slots` est la
  // seule chose que buildReportFrame() est seul à poser — c'est donc la seule preuve qu'il est passé.
  const f = Array.isArray(frame?.slots) ? frame : buildReportFrame(frame);
  const out = [];
  for (const phrase of f.slots) out.push(phrase, "");
  out.push(`=== ${f.title} ===`);
  if (f.subtitle) out.push(f.subtitle);
  out.push(`Date : ${f.dateLabel}`, "");
  for (const block of f.blocks) out.push(renderTextBlock(block), "");
  if (f.footer) out.push("---", f.footer);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

// Mêmes types de blocs que le rendu HTML (`renderBlock`, html-report.mjs) — jamais un second
// vocabulaire de blocs pour le texte, sinon un outil devrait écrire son corps deux fois.
export function renderTextBlock(block) {
  if (!block) return "";
  if (typeof block === "string") return block;
  switch (block.type) {
    case "note": return block.text ?? "";
    case "code": return block.text ?? "";
    case "list": return (block.items ?? []).map((i) => `  · ${i}`).join("\n");
    case "table": {
      const entetes = block.headers ?? [];
      const lignes = block.rows ?? [];
      const largeurs = entetes.map((h, i) => Math.max(String(h).length, ...lignes.map((r) => String(r[i] ?? "").length)));
      const ligne = (cells) => "  " + cells.map((c, i) => String(c ?? "").padEnd(largeurs[i])).join("  ");
      return [ligne(entetes), "  " + largeurs.map((w) => "-".repeat(w)).join("  "), ...lignes.map(ligne)].join("\n");
    }
    default: return block.text ?? "";
  }
}
