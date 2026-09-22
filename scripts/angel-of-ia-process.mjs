// ANGEL-OF-IA-PROCESS (2026-09-22, nom donné par l'utilisateur). Outil SÉPARÉ de
// god-of-all-process, et c'est délibéré : god surveille le déroulé d'ACTIVITÉS (une Ronde, une
// simulation), angel surveille la CONDUITE de ceux qui travaillent — le respect de
// `docs/regles-de-travail.md`. Deux métiers différents ; les mélanger rendrait god illisible.
//
// Dans les mots de l'utilisateur : « sa vocation est comme pour tous les outils process : verifier
// et garantir la discipline d'execution, que ce soit pour moi ou pour toi ». Les deux côtés sont
// donc notés de la même façon — pas de complaisance pour l'agent, pas d'exemption pour l'humain
// (même parti pris que CASSANDRA-RH pour l'ÉQUIPE d'outils — corrigé le 2026-09-22 : cette ligne
// affirmait que CASSANDRA « note déjà tout le monde y compris l'utilisateur », ce qui était FAUX et
// n'avait jamais été vérifié. Elle note l'équipe, jamais l'humain. C'est angel qui porte
// l'évaluation de l'utilisateur, par l'Article 26 — et il la porte pour de vrai depuis ce jour-là,
// cf. DOMAINES_UTILISATEUR plus bas, au lieu de s'en remettre à une voisine qui ne le faisait pas).
//
// SON APPORT PRINCIPAL, celui que rien d'autre ne fait : LE CROISEMENT DES HORODATAGES. Plusieurs
// règles de la charte imposent de consulter un outil AVANT d'agir — tool-brain avant de chercher
// dans un fichier, Smart Conso API avant une action coûteuse, check-tasks-details avant de lire
// l'état des tâches à la main. Consulter APRÈS COUP ne vaut rien : la règle dit avant. Le compteur
// d'usage horodate chaque consultation, git horodate chaque commit — les croiser est la seule façon
// de savoir si l'ordre a été respecté, et personne ne le faisait.
//
// CE QU'IL NE PEUT PAS VOIR, et le dit : environ la moitié des règles de travail se joue uniquement
// dans la conversation (ai-je posé mes questions avant d'agir, traité les points un par un, respecté
// le format de fenêtre). Il ne les devine JAMAIS : il les DEMANDE, et refuse de conclure tant
// qu'elles ne sont pas fournies (même discipline que circle-process-guardian).

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { printReportHeader } from "./report-template.mjs";
import { recordCliUsage, USAGE_ORIGINS } from "./tool-usage.mjs";
// SÉRIE-TEMPORELLE (2026-09-22) : angel est le PREMIER outil branché sur le mécanisme partagé
// d'historisation, et ce n'est pas un hasard — il avait déjà construit son propre historique la
// veille, donc le brancher prouve le chemin de migration plutôt qu'un cas neuf et facile. Son
// historique propre (HISTORIQUE_EVAL_FILE) reste en place : il porte les INDICES de notes par
// domaine, que la série ne sait pas représenter ; la série porte les CHIFFRES comparables dans la
// durée. Deux besoins réels, jamais une duplication — et c'est écrit ici pour qu'on ne fusionne pas
// les deux en croyant nettoyer.
import { buildPoint, recordPoint, loadSerie, detectTendance, SENS } from "./serie-temporelle.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// ————————————————————————————————————————————————————————————————————————
// LES RÈGLES SURVEILLÉES — et de quel côté elles engagent
// ————————————————————————————————————————————————————————————————————————

// `cote` dit qui la règle engage : l'agent, l'utilisateur, ou les deux. `observable` dit si une
// trace existe sur le disque. Une règle non observable n'est pas hors de portée : elle passe par
// `faits` que l'appelant fournit — et son absence est signalée, jamais comblée par une supposition.
export const REGLES_SURVEILLEES = [
  { id: "consultation-avant", cote: "agent", observable: true, regle: "Consulter l'outil obligatoire AVANT d'agir, jamais après coup (tool-brain, Smart Conso API, check-tasks-details).", source: "docs/regles-de-travail.md §7ter et §1001" },
  { id: "suivi-meme-commit", cote: "agent", observable: true, regle: "Documenter chaque tâche substantielle dans docs/suivi/ DANS LE MÊME commit que le travail décrit.", source: "docs/regles-de-travail.md §4" },
  { id: "push-au-fil-de-l-eau", cote: "agent", observable: true, regle: "Pousser au fil de l'eau : ce qui n'est pas poussé n'existe pas si la session s'interrompt.", source: "docs/regles-de-travail.md §4" },
  { id: "questions-avant", cote: "agent", observable: false, regle: "Poser au moins trois questions de vérification AVANT ou PENDANT l'exécution, jamais après coup — et plus si le sujet contient plus de décisions réelles.", source: "CLAUDE.md Article 16" },
  { id: "point-par-point", cote: "agent", observable: false, regle: "Traiter point par point une demande qui en contient plusieurs, sans jamais noyer les points dans une synthèse.", source: "CLAUDE.md Article 16, complément du 2026-09-17" },
  { id: "fenetre-dediee", cote: "agent", observable: false, regle: "Poser les questions dans une vraie fenêtre à choix, avec leur contexte rappelé, jamais en texte libre.", source: "CLAUDE.md Article 16" },
  { id: "double-lecture", cote: "les deux", observable: false, regle: "Après la livraison d'un transcript : l'utilisateur le lit pendant que l'agent travaille, en parallèle et non l'un après l'autre.", source: "CLAUDE.md Article 18" },
  { id: "commentaires-attendus", cote: "utilisateur", observable: false, regle: "Le signal « voici mes commentaires » ouvre un second passage sur le même transcript, que l'agent doit attendre et reconnaître.", source: "CLAUDE.md Article 18" },
  { id: "decisions-en-attente", cote: "utilisateur", observable: true, regle: "Trancher les questions laissées en attente : une décision jamais prise bloque le travail qui en dépend.", source: "docs/regles-de-travail.md §2" },
];

// ————————————————————————————————————————————————————————————————————————
// LE CROISEMENT DES HORODATAGES — l'apport propre d'angel
// ————————————————————————————————————————————————————————————————————————

// Les outils dont la consultation DOIT précéder le travail, avec ce que « le travail » veut dire
// pour chacun. Dérivé des obligations écrites, jamais une liste de confort.
export const CONSULTATIONS_OBLIGATOIRES = [
  { slug: "tool-brain", avant: "toute recherche dans un fichier existant", fichiersConcernes: /^(scripts|lib|app)\// },
  { slug: "smart-conso-api", avant: "toute action coûteuse en appels Gemini", fichiersConcernes: null },
  { slug: "smart-conso-token", avant: "tout agent séparé ou lecture exhaustive du dépôt", fichiersConcernes: null },
];

export function loadUsageEvents({ root = ROOT, readFileImpl = readFileSync } = {}) {
  try {
    const j = JSON.parse(readFileImpl(join(root, ".tool-usage-history.json"), "utf8"));
    return Array.isArray(j?.events) ? j.events : [];
  } catch { return undefined; }
}

export function lastCommits({ root = ROOT, shImpl, n = 10 } = {}) {
  const run = shImpl ?? ((args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }));
  try {
    return run(["log", `-${n}`, "--format=%H|%at|%s"]).trim().split("\n").filter(Boolean).map((l) => {
      const [hash, at, ...rest] = l.split("|");
      return { hash, at: Number(at) * 1000, sujet: rest.join("|") };
    });
  } catch { return undefined; }
}

// Pour chaque commit récent, la consultation obligatoire a-t-elle eu lieu AVANT lui ?
//
// LIMITE HONNÊTE, déclarée plutôt que cachée : une consultation faite dans une session qui ne
// produit aucun commit reste invisible ici, et un commit groupant plusieurs heures de travail élargit
// la fenêtre au point de rendre le verdict peu discriminant. Le résultat est donc un SIGNAL daté, pas
// une preuve — d'où l'avertissement de fiabilité en tête du rapport.
export const ORIGINES_DE_JUGEMENT = ["spontane", "demande"];
export const ORIGINE_NON_CONCLUANTE = "cli_direct";

// GARDE-FOU (Article 24) : ces deux constantes NOMMENT des origines définies ailleurs. Le jour où
// tool-usage.mjs en renomme une, angel doit s'arrêter net plutôt que de compter zéro consultation
// de jugement en silence — un faux vert serait pire que l'erreur qu'il surveille.
export function findOriginesInconnues(origines = USAGE_ORIGINS) {
  return [...ORIGINES_DE_JUGEMENT, ORIGINE_NON_CONCLUANTE].filter((o) => !origines.includes(o));
}

export function checkConsultationOrder({ root = ROOT, evenements, commits, fenetreMinutes = 120, obligations = CONSULTATIONS_OBLIGATOIRES, origines = USAGE_ORIGINS } = {}) {
  const inconnues = findOriginesInconnues(origines);
  if (inconnues.length) return { mesurable: false, raison: `origine(s) disparue(s) du compteur d'usage : ${inconnues.join(", ")} — angel refuse de conclure sur une classification qu'il ne comprend plus` };
  const ev = evenements ?? loadUsageEvents({ root });
  const cm = commits ?? lastCommits({ root });
  if (!ev || !cm) return { mesurable: false, raison: !ev ? "compteur d'usage illisible" : "historique git illisible" };
  const fenetre = fenetreMinutes * 60 * 1000;
  const constats = [];
  const signaux = [];
  for (const c of cm) {
    for (const o of obligations) {
      // TROIS ÉTATS, JAMAIS DEUX (corrigé le 2026-09-22, après DEUX passages ratés du même outil).
      //
      // Premier passage : angel accusait six fois, et les six « consultations tardives » étaient en
      // réalité moi relançant ces outils pour vérifier qu'ils marchaient encore après leur migration.
      // Réponse d'alors : une origine `verification` à écarter. Correcte, mais insuffisante — elle
      // ne réparait que les événements enregistrés APRÈS sa création.
      //
      // Deuxième passage : les six accusations tenaient toujours, portées par des événements
      // `cli_direct`. Et la vraie cause était là, écrite noir sur blanc dans la définition même de
      // cette origine : « le script SAIT qu'il a été lancé via sa propre ligne de commande, mais ne
      // peut jamais savoir POURQUOI ». Un `cli_direct` ne prouve donc AUCUNE consultation — il
      // prouve un lancement. En le lisant comme une consultation, angel commettait exactement la
      // faute que tout ce paysage traque : une mesure ADJACENTE présentée comme la mesure visée.
      //
      // D'où la séparation définitive : seules les origines de JUGEMENT (spontane/demande, les deux
      // que l'agent déclare sciemment) peuvent fonder un manquement nommé. Un `cli_direct` hors
      // d'ordre devient un SIGNAL non concluant — montré, jamais imputé à quelqu'un.
      const meme = (e) => e?.toolSlug === o.slug;
      const jugement = (e) => meme(e) && ORIGINES_DE_JUGEMENT.includes(e?.origin);
      const nonConcluant = (e) => meme(e) && e?.origin === ORIGINE_NON_CONCLUANTE;
      const dansFenetre = (e, sens) => (sens === "avant" ? e.at <= c.at && c.at - e.at <= fenetre : e.at > c.at && e.at - c.at <= fenetre);

      // Seul le cas « consulté APRÈS mais jamais avant » dit quelque chose : il montre que l'outil a
      // servi, mais dans le mauvais ordre. Ne l'avoir jamais lancé du tout peut simplement vouloir
      // dire que ce commit ne le concernait pas — on n'en conclut donc rien.
      const base = { commit: c.hash.slice(0, 7), sujet: c.sujet.slice(0, 60), slug: o.slug, avant: o.avant };
      if (!ev.some((e) => jugement(e) && dansFenetre(e, "avant")) && ev.some((e) => jugement(e) && dansFenetre(e, "apres"))) {
        constats.push(base);
      } else if (!ev.some((e) => (jugement(e) || nonConcluant(e)) && dansFenetre(e, "avant")) && ev.some((e) => nonConcluant(e) && dansFenetre(e, "apres"))) {
        signaux.push({ ...base, pourquoi: `lancement ${ORIGINE_NON_CONCLUANTE} postérieur, qui ne dit pas s'il s'agissait d'une consultation` });
      }
    }
  }
  return { mesurable: true, commitsExamines: cm.length, constats, signaux };
}

// ————————————————————————————————————————————————————————————————————————
// LE VERDICT
// ————————————————————————————————————————————————————————————————————————

// `faits` porte les réponses aux règles non observables. Une règle non fournie n'est jamais réputée
// respectée : elle est comptée à part, et le verdict global refuse d'être vert tant qu'il en reste.
export function auditWorkingRules({ root = ROOT, faits = {}, regles = REGLES_SURVEILLEES, ordre } = {}) {
  const o = ordre ?? checkConsultationOrder({ root });
  const resultats = regles.map((r) => {
    if (r.id === "consultation-avant") {
      if (!o.mesurable) return { ...r, etat: "non mesurable", detail: o.raison };
      return o.constats.length
        ? { ...r, etat: "manquement", detail: o.constats.map((c) => `${c.slug} consulté APRÈS le commit ${c.commit} (« ${c.sujet} ») alors qu'il doit l'être avant ${c.avant}`).join(" ; ") }
        : { ...r, etat: "respecté", detail: `${o.commitsExamines} commit(s) examiné(s), aucun cas de consultation après coup` };
    }
    const fourni = faits[r.id];
    if (fourni === undefined) return { ...r, etat: r.observable ? "non fourni" : "non fourni", detail: "à confirmer — angel ne devine jamais ce qu'il ne peut pas observer" };
    return { ...r, etat: fourni ? "respecté" : "manquement", detail: typeof fourni === "string" ? fourni : undefined };
  });
  const manquements = resultats.filter((r) => r.etat === "manquement");
  const nonFournis = resultats.filter((r) => r.etat === "non fourni");
  return {
    resultats,
    manquements,
    nonFournis,
    // Vert seulement si tout est réellement vérifié : un verdict vert obtenu en laissant la moitié
    // des règles « non fournies » serait un faux vert, exactement ce que ce paysage combat.
    ok: manquements.length === 0 && nonFournis.length === 0,
  };
}

// ————————————————————————————————————————————————————————————————————————
// L'ÉVALUATION DE L'UTILISATEUR — demandée par lui, et pour une raison qu'il faut garder écrite
// ————————————————————————————————————————————————————————————————————————
//
// Elle existe parce qu'il l'a demandée, dans ces termes (2026-09-22) :
//
//   « Toi aussi tu dois alimenter ce rapport et me mettre une evaluation sur ma participation à ce
//   projet : je n'ai pas besoin d'eloges ou faux semblants, je veux un oeil critique qui sert le
//   projet en priorité. Pourquoi cette notation sur moi-meme ? Justement pour que le projet reste
//   la priorité, la seule valeur à protéger, meme au detriment de quelques frictions ou
//   desaccords ou remarques à mon sujet. »
//
// Cette justification n'est pas décorative : c'est elle qui rend l'exercice tenable. Un agent qui
// note celui qui le dirige a une pente naturelle et forte vers la complaisance — la seule chose qui
// s'y oppose est un mandat explicite disant que le projet prime sur le confort de la relation. Sans
// cette phrase conservée ici, le prochain agent qui reprendra ce fichier adoucira, croyant bien
// faire.
//
// TROIS GARDE-FOUS STRUCTURELS, chacun choisi contre un mode d'échec précis :
//
// 1. MESURABLE ET JUGEMENT NE SE MÉLANGENT JAMAIS (choix explicite de l'utilisateur : « les deux,
//    mais dans deux sections séparées »). Un fait qui se compte et une opinion qui s'argumente
//    n'ont pas le même poids ; les présenter ensemble laisserait croire que l'opinion est aussi
//    solide que le chiffre. Et ça lui permet de contester mon jugement sans que ça entame les
//    faits.
// 2. UNE NOTE PAR DOMAINE, JAMAIS UNE NOTE GLOBALE (son choix aussi). Une moyenne unique noie le
//    domaine qui va mal dans ceux qui vont bien — exactement l'inverse du service rendu.
// 3. UN DÉSACCORD N'EFFACE JAMAIS LA REMARQUE, il se pose à côté (son choix). Une critique qu'on
//    peut faire disparaître en la contestant ne vaut rien, et il l'a dit lui-même. Les deux
//    lectures coexistent, la suite tranche.
//
// LES NOTES sont des paliers nommés, jamais un nombre nu. Un « 12/20 » ne dit pas ce qu'il faut
// changer ; « fragile » si. L'indice numérique existe à côté uniquement pour suivre une évolution
// dans le temps — jamais pour faire une moyenne, qui reconstruirait la note globale qu'on vient
// d'écarter.
export const PALIERS_NOTE = [
  { indice: 1, nom: "à corriger", sens: "un vrai coût pour le projet, visible maintenant" },
  { indice: 2, nom: "fragile", sens: "ça tient, mais un incident suffirait à le faire basculer" },
  { indice: 3, nom: "correct", sens: "fait le travail, sans plus" },
  { indice: 4, nom: "solide", sens: "fiable, et le projet en bénéficie réellement" },
  { indice: 5, nom: "exemplaire", sens: "c'est ce qui fait avancer le projet plus vite que prévu" },
];

// `nature` sépare les deux sections. `base` dit SUR QUOI la note se fonde — c'est la colonne que
// l'utilisateur a explicitement demandée (« qui me juge comment, de quelle maniere, sur quelles
// bases, avec quel resultat »), et sans elle une note n'est qu'une humeur chiffrée.
export const DOMAINES_UTILISATEUR = [
  { id: "vitesse-de-decision", nature: "mesurable", libelle: "Vitesse de décision", base: "âge de la plus ancienne question qui attend sa réponse, lu dans docs/suivi/" },
  { id: "decisions-en-suspens", nature: "mesurable", libelle: "Décisions laissées en suspens", base: "nombre de tâches réellement bloquées sur une décision qui n'appartient qu'à lui" },
  { id: "idees-jamais-tranchees", nature: "mesurable", libelle: "Idées jamais tranchées", base: "entrées de docs/idees-a-trancher.md restées sans décision définitive" },
  { id: "clarte-des-demandes", nature: "jugement", libelle: "Clarté des demandes", base: "combien de fois j'ai dû supposer une intention faute d'avoir compris, sur la période" },
  { id: "coherence-des-priorites", nature: "jugement", libelle: "Cohérence des priorités", base: "une consigne en a-t-elle contredit une autre, un chantier a-t-il été rouvert sans raison" },
  { id: "qualite-de-la-direction", nature: "jugement", libelle: "Qualité de la direction donnée", base: "les redirections ont-elles servi le projet ou dispersé le travail" },
  { id: "reaction-a-la-critique", nature: "jugement", libelle: "Réaction à la critique", base: "ce qui se passe quand je signale un écart : traité, discuté, ou ignoré" },
];

// LE JURY — les outils qui détiennent déjà de la donnée SUR LUI, et qui ne la lui montraient pas.
//
// Ajouté le 2026-09-22 sur sa demande : « il devrait y avoir plus d'outils qui me jugent [...]
// pourvu que ce soit pertinent à me faire remonter. Moi aussi, je veux profiter de la data ! ».
//
// LE CONSTAT QUI JUSTIFIE CE REGISTRE : plusieurs outils mesurent depuis des semaines des choses
// qui parlent de LUI et de personne d'autre — ce que ses demandes ont coûté, ce que ses règles
// pèsent, si ses propres objectifs sont tenus — et toute cette donnée ne servait qu'à juger le
// CODE. Elle existait déjà ; elle ne lui était simplement jamais adressée.
//
// LE CRITÈRE D'ENTRÉE, et il est strict — « pourvu que ce soit pertinent à me faire remonter » :
// un juge n'entre ici que s'il lit une donnée RÉELLE déjà collectée (jamais une mesure inventée
// pour l'occasion) ET que cette donnée dise quelque chose qu'il ne peut pas voir autrement. Un
// chiffre qu'il a déjà sous les yeux ailleurs n'apporte rien et encombrerait le rapport.
//
// `juge` est le slug de l'outil source — vérifié mécaniquement contre les scripts réels par
// findJugesSansOutil(), jamais une liste de confort qui se périmerait au premier renommage
// (Article 24).
export const JURY = [
  {
    id: "cout-des-redirections", juge: "smart-conso-token", script: "scripts/smart-conso-token.mjs",
    quoi: "Combien de ses demandes ont produit un vrai retour, et combien ont consommé sans rien rendre.",
    base: "le journal des actions coûteuses, chacune déjà classée investissement réel / sans retour / à évaluer",
    pertinence: "c'est la seule mesure qui distingue une redirection qui a fait gagner du temps d'une qui en a coûté — et elle existait sans jamais lui être montrée",
    jugePertinence: "Ses arbitrages coûteux ont-ils produit quelque chose, ou a-t-il dépensé pour explorer puis abandonné ?",
  },
  {
    id: "rythme-impose", juge: "smart-conso-api", script: "scripts/smart-conso-api.mjs",
    quoi: "Le rythme de consommation d'API que ses demandes imposent réellement.",
    base: "le trafic Gemini réel enregistré, pas une estimation",
    pertinence: "il décide quand lancer une simulation ou un diagnostic sans jamais voir le cumul que ça fait sur une semaine",
    jugePertinence: "Lance-t-il ses actions coûteuses au bon moment, ou par salves quand il y pense ?",
  },
  {
    id: "poids-de-ses-regles", juge: "ecotoken", script: "scripts/ecotoken.mjs",
    quoi: "Ce que pèsent, en tokens rechargés à CHAQUE message, les règles qu'il a lui-même ajoutées.",
    base: "le poids mesuré de CLAUDE.md et des documents toujours chargés",
    pertinence: "le plus utile des huit, et le plus invisible : une règle ajoutée en trois lignes se paie à chaque message, pour toujours. Il n'a jamais vu ce prix, donc il ne peut pas l'arbitrer.",
    jugePertinence: "Ce qu'il fait payer à chaque message mérite-t-il d'y être, ou accumule-t-il des règles sans jamais en retirer ?",
  },
  {
    id: "objectifs-tenus", juge: "objectifs-vs-resultats", script: "scripts/objectifs-vs-resultats.mjs",
    quoi: "Les objectifs chiffrés qu'il a fixés lui-même, confrontés aux résultats réels.",
    base: "le registre d'objectifs tenu à la main, croisé avec les mesures réelles de la période",
    pertinence: "un objectif qu'on fixe puis qu'on ne regarde plus n'est pas un objectif ; c'est lui qui les pose, donc c'est à lui que l'écart revient",
    jugePertinence: "Les objectifs qu'il rate sont-ils les mêmes à chaque fois, et disent-ils quelque chose sur ce qu'il évite ?",
  },
  {
    id: "fidelite-a-sa-philosophie", juge: "the-king", script: "scripts/the-king.mjs",
    quoi: "Si ses propres décisions respectent les valeurs qu'il a lui-même écrites.",
    base: "docs/philosophie-et-politique.md, le texte fondateur qu'il a posé, confronté aux arbitrages réellement rendus",
    pertinence: "personne d'autre ne peut lui opposer son propre texte — et c'est exactement le service qu'il demande en acceptant d'être noté",
    jugePertinence: "Ses décisions récentes servent-elles les valeurs qu'il a écrites, ou les contournent-elles en douceur ?",
  },
  {
    id: "taches-qui-trainent", juge: "check-tasks-details", script: "scripts/check-tasks-details.mjs",
    // Élargi le 2026-09-22, sur sa remarque amusée et parfaitement fondée : « j'imagine que
    // check-list a un jugement interessant sur moi ! ». Il a raison, et plus qu'il ne le pensait :
    // cet outil ne voit pas seulement CE QUI ATTEND, il voit le RYTHME — combien il ouvre contre
    // combien il clôt, et surtout quelles tâches dérivent parce qu'elles n'appartiennent à aucun
    // chantier (celles-là, il a lui-même dit qu'elles « ont tendance à se perdre »). Élargir ce
    // juge plutôt qu'en ajouter un second : la donnée sort du même outil, deux entrées auraient
    // dupliqué la même lecture (§7ter).
    quoi: "Ce qui attend sa décision et depuis quand, le rythme entre ce qu'il ouvre et ce qu'il clôt, et les tâches transverses qui dérivent faute d'appartenir à un chantier.",
    base: "docs/suivi/ : les lignes bloquées sur un arbitrage qui n'appartient qu'à lui, l'âge de la plus ancienne, et celles qu'aucun chantier ne réclame",
    pertinence: "une décision jamais prise bloque en silence tout ce qui en dépend — et une tâche transverse sans chantier d'accueil est celle qu'il a lui-même identifiée comme la plus facile à perdre",
    // C'est l'exemple qu'il a donné lui-même pour expliquer ce qu'il attend d'un juge de pertinence.
    jugePertinence: "Sur quoi travaille-t-il réellement ? Quelle part de ses tâches touche le jeu que le visiteur verra, et quelle part l'outillage qui le construit ?",
  },
  {
    id: "rondes-jamais-lancees", juge: "circle-tasks", script: "scripts/circle-tasks.mjs",
    quoi: "Le nombre de commits écoulés sans qu'une Ronde soit lancée.",
    base: "le compteur réel de commits depuis le dernier passage enregistré",
    pertinence: "la Ronde est le seul moment où tout le paysage se prononce ; la sauter longtemps, c'est travailler sans retour — et le rappel a déjà été ignoré plus de deux cents fois",
    jugePertinence: "Construit-il plus vite qu'il ne vérifie ? Le retard de Ronde le dit plus honnêtement que n'importe quelle intention déclarée.",
  },
  {
    id: "couverture-de-ce-qu-il-demande", juge: "axa-check", script: "scripts/axa-check.mjs",
    quoi: "Si le code écrit à sa demande est réellement couvert par un test, ou seulement livré.",
    base: "la couverture réelle par fonction, jamais une estimation globale",
    pertinence: "il arbitre souvent pour la vitesse ; ceci lui montre ce que cet arbitrage laisse derrière lui, chiffre à l'appui",
    jugePertinence: "Ce qu'il fait écrire vite est-il ensuite couvert, ou la dette s'accumule-t-elle sur les zones qu'il rouvre le plus ?",
  },
];

// Le garde-fou du registre (Article 24) : un juge dont le script n'existe plus produirait une
// section vide que personne ne remarquerait — le rapport paraîtrait complet en ayant perdu un
// témoin. Même patron que les garde-fous déjà en place ailleurs dans ce paysage.
export function findJugesSansOutil({ jury = JURY, root = ROOT, exists = existsSync } = {}) {
  return jury.filter((j) => !exists(join(root, j.script))).map((j) => ({ id: j.id, script: j.script }));
}

// collectJuryVerdicts() — n'INVENTE jamais un verdict. Chaque juge fournit le sien via `verdicts`
// (l'appelant les récolte en lançant les outils), et un juge qui n'a rien rendu ressort comme
// « pas de verdict » plutôt que comme un silence qui se lirait à tort comme « rien à signaler ».
// C'est la distinction qui a coûté le plus cher à ce projet : une absence de mesure n'est pas une
// mesure rassurante.
export function collectJuryVerdicts({ verdicts = {}, jury = JURY } = {}) {
  return jury.map((j) => {
    const v = verdicts[j.id];
    return {
      ...j,
      etat: v === undefined ? "pas de verdict" : "rendu",
      resultat: v?.resultat ?? null,
      chiffre: v?.chiffre ?? null,
      // LA PERTINENCE (2026-09-22, demande explicite) : un juge ne doit pas seulement rapporter un
      // chiffre, il doit dire ce que ce chiffre révèle des CHOIX de l'utilisateur. « Je veux plus
      // d'evaluation de pertinence sur mes choix, je veux que ce rapport soit un peu plus acerbe à
      // mon egard, sans me menager, je veux des infos, pas des angles arrondis. »
      pertinenceConstat: v?.pertinenceConstat ?? null,
      pertinenceCommentaire: v?.pertinenceCommentaire ?? null,
      // Un juge peut légitimement n'avoir rien à dire cette fois-ci : il le DIT, au lieu de se
      // taire. Les deux se distinguent, toujours.
      rienASignaler: v?.rienASignaler === true,
    };
  });
}

// LE GARDE-FOU DE L'ACERBITÉ (2026-09-22) — et il protège contre l'écueil INVERSE de celui qu'on
// vient de corriger.
//
// La demande était : « sans me menager, je veux des infos, pas des angles arrondis ». Le risque
// évident est d'arrondir. Le risque moins évident, et plus grave, est de confondre dureté et
// information : un commentaire cinglant qui ne repose sur aucun chiffre n'est pas plus honnête
// qu'un commentaire complaisant, il est seulement plus désagréable — et il détruit la confiance
// qu'on accordera au prochain, celui qui tiendra debout.
//
// La règle est donc : un constat de pertinence DOIT porter un chiffre, sinon il n'est pas publié.
// C'est ce qui rend l'acerbité utilisable plutôt que blessante. « 86,6 % de tes tâches ne touchent
// pas le jeu » se discute ; « tu te disperses » ne se discute pas, donc ne sert à rien.
const CHIFFRE_DANS_LE_CONSTAT = /\d/;
export function findConstatsSansChiffre(verdictsCollectes = []) {
  return verdictsCollectes
    .filter((v) => v.pertinenceConstat && !CHIFFRE_DANS_LE_CONSTAT.test(v.pertinenceConstat))
    .map((v) => ({ id: v.id, constat: v.pertinenceConstat }));
}

// ————————————————————————————————————————————————————————————————————————
// L'HISTORIQUE DES ÉVALUATIONS — ce qui a bougé depuis la dernière Ronde
// ————————————————————————————————————————————————————————————————————————
//
// Demandé le 2026-09-22 : « je veux que ce rapport soit comparé à chaque ronde, et me dire les
// evolutions. c'est dejà prevu ? ». Réponse honnête à cette question : NON, ça ne l'était pas. Le
// rapport se régénérait à vide à chaque passage, sans aucune mémoire — donc une note qui se
// dégradait trois Rondes de suite se lisait exactement comme une note stable, et un chiffre qui
// avait doublé ressemblait à un chiffre normal. Une évaluation sans historique ne mesure pas une
// trajectoire, elle photographie un instant.
//
// CINQ ÉTATS, JAMAIS TROIS, et c'est tout l'enjeu de cette construction. La tentation est de
// comparer deux nombres et de conclure « mieux / pareil / moins bien ». Mais deux cas de plus
// existent et se confondraient avec « pareil » :
//   - PREMIÈRE MESURE : rien à comparer. Ce n'est pas de la stabilité, c'est une absence de passé.
//   - PLUS MESURÉ : le domaine était évalué, il ne l'est plus. C'est le pire des cinq à laisser
//     passer pour « stable » — une note qui disparaît ressemble à une note qui tient.
// Ce projet a déjà payé cette confusion plusieurs fois (une absence de mesure prise pour une
// mesure rassurante) ; elle est nommée ici pour ne pas la repayer.
// enregistrerTendanceEval() — branche l'évaluation sur le mécanisme PARTAGÉ, en plus de son
// historique propre. Les mesures déclarent chacune leur sens, sans quoi une flèche automatique se
// tromperait une fois sur deux (garde-fou 2 de serie-temporelle).
export function enregistrerTendanceEval(mesures, options = {}) {
  const point = buildPoint({
    mesures: {
      "jours-d-attente": { valeur: mesures?.["vitesse-de-decision"]?.valeur, sens: SENS.BAS_MIEUX },
      "decisions-en-suspens": { valeur: mesures?.["decisions-en-suspens"]?.valeur, sens: SENS.BAS_MIEUX },
      "idees-non-tranchees": { valeur: mesures?.["idees-jamais-tranchees"]?.valeur, sens: SENS.BAS_MIEUX },
    },
    ...options,
  });
  return recordPoint("angel-of-ia-process", point, options);
}

// tendancesEval() — ce que la série dit aujourd'hui, si elle a assez de points pour dire quelque
// chose. Elle refusera longtemps, et c'est correct : un mécanisme qui conclut dès le deuxième
// passage ne mesure rien.
export function tendancesEval(options = {}) {
  const serie = loadSerie("angel-of-ia-process", options);
  return ["jours-d-attente", "decisions-en-suspens", "idees-non-tranchees"].map((c) => detectTendance(serie, c, options));
}

export const EVOLUTIONS = ["progression", "régression", "stable", "première mesure", "plus mesuré"];
export const HISTORIQUE_EVAL_FILE = "docs/angel-of-ia-process/historique-evaluations.json";

export function loadEvaluationHistory({ root = ROOT, readFileImpl = readFileSync } = {}) {
  try {
    const brut = JSON.parse(readFileImpl(join(root, HISTORIQUE_EVAL_FILE), "utf8"));
    return Array.isArray(brut) ? brut : [];
  } catch {
    return [];
  }
}

// Le format persisté est volontairement minimal : la date, et par domaine l'indice numérique de la
// note plus le chiffre brut quand il y en a un. On ne persiste NI les justifications NI les
// commentaires — ils vivent déjà dans le rapport archivé, et les dupliquer ici ferait grossir un
// fichier relu à chaque Ronde pour une information qu'on ne compare jamais mécaniquement.
export function snapshotEvaluation(evaluation, { date = new Date().toISOString().slice(0, 10), jury = [] } = {}) {
  const domaines = {};
  for (const d of [...(evaluation?.mesurable ?? []), ...(evaluation?.jugement ?? [])]) {
    if (d.etat === "non fourni") continue;
    domaines[d.id] = { indice: d.note?.indice ?? null, valeur: d.valeur ?? null };
  }
  const chiffres = {};
  for (const j of jury) {
    if (j.chiffre) chiffres[j.id] = j.chiffre;
  }
  return { date, domaines, chiffres };
}

export function compareEvaluations(courant, precedent) {
  if (!precedent) {
    return Object.keys(courant?.domaines ?? {}).map((id) => ({ id, evolution: "première mesure", avant: null, apres: courant.domaines[id].indice }));
  }
  const ids = new Set([...Object.keys(precedent.domaines ?? {}), ...Object.keys(courant?.domaines ?? {})]);
  return [...ids].map((id) => {
    const av = precedent.domaines?.[id]?.indice ?? null;
    const ap = courant?.domaines?.[id]?.indice ?? null;
    if (ap === null) return { id, evolution: "plus mesuré", avant: av, apres: null };
    if (av === null) return { id, evolution: "première mesure", avant: null, apres: ap };
    if (ap > av) return { id, evolution: "progression", avant: av, apres: ap };
    if (ap < av) return { id, evolution: "régression", avant: av, apres: ap };
    return { id, evolution: "stable", avant: av, apres: ap };
  });
}

// Les chiffres du jury bougent aussi, et ce sont souvent eux qui parlent le plus fort (un poids de
// charte qui grimpe, un retard de Ronde qui s'allonge). On ne les interprète PAS en bien/mal : un
// chiffre qui monte n'est pas toujours une dégradation, ça dépend du juge. On montre donc l'avant
// et l'après, et c'est la lecture humaine qui tranche — jamais une flèche verte posée à l'aveugle.
export function compareChiffresDuJury(courant, precedent) {
  if (!precedent) return [];
  const ids = new Set([...Object.keys(precedent.chiffres ?? {}), ...Object.keys(courant?.chiffres ?? {})]);
  return [...ids]
    .map((id) => ({ id, avant: precedent.chiffres?.[id] ?? null, apres: courant?.chiffres?.[id] ?? null }))
    .filter((x) => x.avant !== x.apres);
}

// ————————————————————————————————————————————————————————————————————————
// LA VOIX DE L'UTILISATEUR DANS SA PROPRE ÉVALUATION (2026-09-22)
// ————————————————————————————————————————————————————————————————————————
//
// Demandé en ces termes : « lors de la fin de circle il y a une fenetre de questions par rapport à
// mon evaluation : chaque question reprend un resumé de l'evaluation et m'interroge : est-ce que
// j'ai une justification ? est-ce que je considere comme un point à corriger ? [...] pour que ma
// voix ait un retour dans la mecanique d'evaluation, trou important je pense ».
//
// IL A RAISON SUR LE TROU, et il est plus grave qu'il n'y paraît. Jusqu'ici l'évaluation était à
// SENS UNIQUE : je jugeais, il lisait. Le registre de désaccords existait mais il fallait qu'il
// pense à l'alimenter tout seul — c'est-à-dire jamais. Une évaluation qu'on subit sans pouvoir
// répondre dans le mécanisme lui-même n'est pas un outil de travail, c'est un bulletin.
//
// QUATRE RÉPONSES, ET ELLES NE VEULENT PAS DIRE LA MÊME CHOSE POUR LA SUITE. C'est le cœur du
// calibrage : « je conteste » et « c'est un choix assumé » ressemblent tous les deux à un refus,
// alors qu'ils s'opposent — l'un dit que le CONSTAT est faux (donc c'est MA mesure qui doit être
// corrigée), l'autre dit que le constat est juste mais que le comportement est délibéré (donc
// c'est le constat qui devra cesser d'être remonté comme un défaut).
export const REPONSES_UTILISATEUR = [
  { id: "accepte-corrige", libelle: "Je l'accepte et je vais le corriger", consequence: "une vraie tâche est créée dans docs/suivi/ — un engagement qui ne devient pas une tâche est exactement le trou que l'Article 28 ferme", creeUneTache: true },
  { id: "accepte-sans-corriger", libelle: "Je l'accepte, mais je ne corrigerai pas — voici pourquoi", consequence: "le constat reste remonté aux Rondes suivantes, avec sa raison à côté ; ce n'est pas un classement sans suite, c'est un arbitrage assumé et daté", creeUneTache: false },
  { id: "conteste", libelle: "Je le conteste : le constat est faux", consequence: "c'est MA mesure qui est en cause, pas son comportement — le juge concerné est à revérifier avant la prochaine Ronde", creeUneTache: false, remetEnCauseLaMesure: true },
  { id: "choix-assume", libelle: "C'est un choix assumé, ce n'est pas un défaut", consequence: "le constat est juste mais cesse d'être compté comme un défaut ; il reste affiché en information, jamais en reproche", creeUneTache: false },
];

export const REPONSES_EVAL_FILE = "docs/angel-of-ia-process/reponses-evaluation.md";

// pointsAInterroger() — SEULEMENT les points problématiques (son choix explicite). Le risque assumé
// et écrit : un point qui va bien mais sur lequel il aurait une objection ne lui sera jamais soumis.
// Trois sources de problème, jamais une seule — une note basse, une trajectoire qui se dégrade, et
// un constat de pertinence dur sont trois choses différentes, et n'en interroger qu'une laisserait
// passer les deux autres.
export const SEUIL_NOTE_PROBLEMATIQUE = 2;
export function pointsAInterroger({ evaluation = null, jury = [], evolutions = [], seuil = SEUIL_NOTE_PROBLEMATIQUE } = {}) {
  const points = [];
  for (const d of [...(evaluation?.mesurable ?? []), ...(evaluation?.jugement ?? [])]) {
    if (d.note && d.note.indice <= seuil) {
      points.push({ id: d.id, origine: "note basse", resume: `${d.libelle} : ${d.note.nom} (${d.note.indice}/5). ${d.justification ?? d.base}` });
    }
  }
  for (const e of evolutions) {
    if (e.evolution === "régression") points.push({ id: `evo-${e.id}`, origine: "régression", resume: `${e.id} est passé de ${e.avant}/5 à ${e.apres}/5 depuis la dernière Ronde.` });
  }
  for (const j of jury) {
    if (j.pertinenceConstat && j.pertinenceCommentaire) {
      points.push({ id: `pert-${j.id}`, origine: "constat de pertinence", resume: `${j.pertinenceConstat} — ${j.pertinenceCommentaire}` });
    }
  }
  // Dédoublonné sur l'identifiant : un même domaine peut être à la fois mal noté ET en régression,
  // et lui poser deux fois la même question userait l'exercice pour rien.
  const vus = new Set();
  return points.filter((p) => (vus.has(p.id) ? false : vus.add(p.id)));
}

export function loadReponsesEvaluation({ root = ROOT, readFileImpl = readFileSync } = {}) {
  try {
    return readFileImpl(join(root, REPONSES_EVAL_FILE), "utf8").split("\n")
      .filter((l) => /^\|\s*\d{4}-\d{2}-\d{2}/.test(l))
      .map((l) => l.split("|").map((c) => c.trim()).filter(Boolean))
      .filter((c) => c.length >= 3)
      .map(([date, point, reponse, raison]) => ({ date, point, reponse, raison: raison ?? null }));
  } catch {
    return [];
  }
}

// findEngagementsSansTache() — LE garde-fou de ce dispositif, et sans lui tout le reste est
// décoratif. Un « je vais le corriger » qui ne devient jamais une tâche ressemble exactement à un
// problème traité : c'est le mécanisme même que l'Article 28 a été écrit pour empêcher, appliqué
// ici à ses propres engagements. Une référence morte est pire qu'une absence, parce qu'elle a
// l'air d'un lien.
export function findEngagementsSansTache(reponses = [], lignesDeSuivi = "") {
  return reponses
    .filter((r) => r.reponse === "accepte-corrige")
    .filter((r) => !lignesDeSuivi.includes(r.point))
    .map((r) => ({ point: r.point, date: r.date, pourquoi: "engagement pris à la Ronde et jamais devenu une tâche réelle dans docs/suivi/" }));
}

export const DESACCORDS_FILE = "docs/angel-of-ia-process/desaccords.md";

// Les objections de l'utilisateur, relues du disque. Le format est volontairement le plus simple
// qui puisse survivre à une reprise par une autre IA (Article 27) : une ligne de tableau par
// objection, la date, l'identifiant du domaine, le texte. Rien à parser de subtil.
export function loadDesaccords({ root = ROOT, readFileImpl = readFileSync } = {}) {
  try {
    const texte = readFileImpl(join(root, DESACCORDS_FILE), "utf8");
    return texte.split("\n")
      .filter((l) => /^\|\s*\d{4}-\d{2}-\d{2}/.test(l))
      .map((l) => l.split("|").map((c) => c.trim()).filter(Boolean))
      .filter((c) => c.length >= 3)
      .map(([date, domaine, texte]) => ({ date, domaine, texte }));
  } catch {
    return [];
  }
}

// Les trois domaines mesurables, calculés pour de vrai. `sources` est injectable pour rester
// testable sans dépendre de l'état du dépôt au moment du test — même patron que partout ailleurs.
export function mesurerParticipation({ tachesOuvertes, ideesNonTranchees, maintenant = Date.now() } = {}) {
  const mesures = {};
  if (Array.isArray(tachesOuvertes)) {
    const dates = tachesOuvertes
      .map((t) => Date.parse((t.row ?? t).match?.(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z/)?.[0] ?? ""))
      .filter(Number.isFinite);
    const ageMax = dates.length ? Math.floor((maintenant - Math.min(...dates)) / 86400000) : 0;
    mesures["vitesse-de-decision"] = { valeur: ageMax, unite: "jour(s) d'attente pour la plus ancienne" };
    mesures["decisions-en-suspens"] = { valeur: tachesOuvertes.length, unite: "tâche(s) bloquée(s) sur sa décision" };
  }
  if (Number.isFinite(ideesNonTranchees)) {
    mesures["idees-jamais-tranchees"] = { valeur: ideesNonTranchees, unite: "idée(s) sans décision définitive" };
  }
  return mesures;
}

// evaluateUserParticipation() — assemble les deux sections. Les notes de JUGEMENT ne sont jamais
// calculées : elles sont FOURNIES par l'agent, et leur absence se voit ("non fourni") au lieu de se
// combler par un palier moyen poli. C'est la même discipline que partout dans ce paysage : une
// absence de mesure ne se déguise jamais en mesure.
export function evaluateUserParticipation({ mesures = {}, jugements = {}, desaccords = [], domaines = DOMAINES_UTILISATEUR, paliers = PALIERS_NOTE } = {}) {
  const parNote = new Map(paliers.map((p) => [p.nom, p]));
  const lignes = domaines.map((d) => {
    const fourni = d.nature === "mesurable" ? mesures[d.id] : jugements[d.id];
    const objections = desaccords.filter((x) => x.domaine === d.id);
    if (!fourni) return { ...d, etat: "non fourni", note: null, objections };
    const note = d.nature === "mesurable" ? (fourni.note ?? null) : (fourni.note ?? null);
    return {
      ...d,
      etat: "évalué",
      note: note && parNote.has(note) ? { nom: note, ...parNote.get(note) } : null,
      // Une note hors barème est signalée plutôt que silencieusement acceptée : sans ça, une faute
      // de frappe produirait une évaluation sans palier, illisible et jamais détectée.
      noteInvalide: note && !parNote.has(note) ? note : null,
      valeur: fourni.valeur,
      unite: fourni.unite,
      justification: fourni.justification ?? null,
      objections,
    };
  });
  return {
    mesurable: lignes.filter((l) => l.nature === "mesurable"),
    jugement: lignes.filter((l) => l.nature === "jugement"),
    nonFournis: lignes.filter((l) => l.etat === "non fourni"),
    // Jamais de note globale : décision explicite de l'utilisateur, et la raison est écrite plus
    // haut. La tentation de « juste faire la moyenne » reviendra — ce commentaire est là pour elle.
    noteGlobale: null,
  };
}

// Livré PAR god-of-all-process, dans une section clairement à part (décision de l'utilisateur,
// 2026-09-22) : une seule voix à la Ronde, mais la conduite de l'agent ne se mélange jamais aux
// étapes de process sautées — deux natures différentes dans un même rapport.
export function angelSectionLines(audit, ordre) {
  const l = ["— Discipline d'exécution (angel-of-ia-process) —"];
  l.push(audit.ok ? "✅ Toutes les règles surveillées sont respectées et vérifiées." : `${audit.manquements.length} manquement(s), ${audit.nonFournis.length} règle(s) non vérifiable(s) sans réponse.`);
  for (const m of audit.manquements) l.push(`  ✗ [${m.cote}] ${m.regle}\n      ${m.detail ?? ""}\n      source : ${m.source}`);
  for (const n of audit.nonFournis) l.push(`  ? [${n.cote}] ${n.regle} — ${n.detail}`);
  // Les signaux non concluants ne sont JAMAIS mêlés aux manquements : ils sont montrés pour qu'on
  // puisse les regarder, sans désigner personne. Un outil qui désigne un coupable sur une mesure
  // qui ne prouve rien perd le droit d'être cru le jour où il en tient une vraie.
  if (ordre?.signaux?.length) {
    l.push(`  ~ ${ordre.signaux.length} signal(aux) non concluant(s) — montrés, jamais imputés :`);
    for (const g of ordre.signaux) l.push(`      ${g.slug} / commit ${g.commit} (« ${g.sujet} ») : ${g.pourquoi}`);
  }
  return l;
}

function main() {
  printReportHeader({
    tool: "angel-of-ia-process",
    title: "angel-of-ia-process — discipline d'exécution des règles de travail",
    subtitle: "Surveille la CONDUITE (agent et utilisateur), jamais le déroulé d'une activité — ça, c'est god-of-all-process.",
    scriptPath: "scripts/angel-of-ia-process.mjs",
  });
  // Un seul croisement, réutilisé par les deux sorties : le recalculer donnerait deux mesures
  // faites à deux instants différents dans le même rapport, exactement le genre d'incohérence
  // silencieuse que cet outil est censé débusquer ailleurs.
  const o = checkConsultationOrder();
  const audit = auditWorkingRules({ ordre: o });
  console.log(angelSectionLines(audit, o).join("\n"));
  if (o.mesurable) {
    console.log(`\nCroisement des horodatages : ${o.commitsExamines} commit(s) examiné(s), ${o.constats.length} consultation(s) de jugement faite(s) après coup, ${o.signaux.length} signal(aux) non concluant(s).`);
    console.log("Limite honnête : une consultation dans une session sans commit reste invisible, et un commit groupant plusieurs heures élargit la fenêtre — c'est un signal daté, jamais une preuve.");
    console.log(`Deux origines sont écartées du verdict : « verification » (relancer un outil pour voir s'il marche encore n'est pas le consulter) et « ${ORIGINE_NON_CONCLUANTE} » (le compteur sait qu'un outil a été lancé, jamais pourquoi — insuffisant pour nommer un manquement).`);
  } else {
    console.log(`\nCroisement des horodatages impossible : ${o.raison}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
