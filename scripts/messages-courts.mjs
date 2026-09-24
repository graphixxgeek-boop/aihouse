// messages-courts.mjs (2026-09-23) — NE JAMAIS S'ARRÊTER SUR UN MESSAGE COURT.
//
// LA DEMANDE, en trois morceaux distincts (tâche #572) :
//   (a) « une solution pour que tu comprennes, quand je t'envoie un prompt intempestif, que tu dois
//       continuer la tache en cours et pas t'arreter, sauf demande explicite de ma part »
//   (b) « un rappel leger dès le 2e message court »
//   (c) « une alerte plus forte quand ca devient couteux »
//
// LE DÉFAUT RÉEL QU'ELLE FERME, et il s'est produit plusieurs fois : un message court arrive
// pendant un travail, l'agent le traite comme une interruption, s'arrête, répond, et reprend — ou
// ne reprend pas. Le coût n'est pas la réponse : c'est la RELANCE. Chaque arrêt fait recharger le
// contexte, refaire le point, et souvent redémarrer une tâche à moitié faite.
//
// LE PRINCIPE, ET IL EST DANS LE DÉFAUT PAR DÉFAUT, jamais dans une liste : **continuer** est la
// réponse normale. Un arrêt exige une demande EXPLICITE. La liste de formes ci-dessous ne sert
// qu'à AJOUTER un arrêt, jamais à en retirer un — donc un mot d'arrêt qu'elle ne connaît pas fait
// continuer, ce qui est exactement le comportement voulu. C'est la seule façon d'écrire cette règle
// sans tomber dans la liste de mots figée que le corollaire de l'Article 17 interdit : ici, la liste
// ne peut jamais causer le défaut qu'on répare, seulement le corriger dans le sens sûr.

// CE FICHIER EST UN MODULE DE RÈGLES, PAS UN OUTIL DE L'AGENCE (2026-09-23).
// La règle « ne jamais s'arrêter sur un message court » ne gouverne aucun outil : elle gouverne la conduite de l'agent pendant le mode semi-autonome, qui l'héberge.
// Sans ce marqueur, integration-outil réclamait pour lui un blueprint, une fiche et une place
// au catalogue — dix inscriptions pour un module qui n'a rien en propre à documenter.
export const PROCESS_HOTE = "semi-autonome";

// LES TROIS NATURES D'UN MESSAGE COURT, jamais deux — et la troisième est celle que j'ajoute de
// moi-même en réponse à sa question « tu vois autre chose à ajouter ? ».
//
// Traiter tout message court comme du bruit à ignorer serait aussi faux que de s'arrêter à chaque
// fois : un message court peut REDIRIGER le travail (« fais plutôt X »), et celui-là change
// vraiment ce qu'il faut faire. Le confondre avec un commentaire en passant ferait rater une
// consigne réelle — l'erreur symétrique de celle qu'on corrige, et personne ne l'avait nommée.
export const NATURES_MESSAGE = {
  arret: "une demande explicite d'arrêter — la seule qui interrompt le travail en cours",
  redirection: "il change ce qu'il faut faire : ce n'est pas une interruption à ignorer, c'est la nouvelle tâche",
  accompagnement: "un commentaire, une question, un encouragement — on en tient compte SANS lâcher ce qu'on fait",
};

// Les formes d'un arrêt explicite. Elles ne couvrent jamais tous les cas et n'ont pas à le faire :
// ce qu'elles ne reconnaissent pas fait CONTINUER, le côté sûr de l'erreur.
const FORMES_ARRET = [
  /\b(arr[êe]te|stoppe?|stop)\b/i,
  /\b(laisse tomber|abandonne|annule)\b/i,
  /\b(attends|pause|on (?:fait une )?pause)\b/i,
  /\bne (?:continue|fais) (?:pas|plus)\b/i,
];

// Les formes d'une redirection : elles désignent un AUTRE travail à faire maintenant. Même
// discipline — ce qui n'est pas reconnu tombe en accompagnement, donc on continue.
const FORMES_REDIRECTION = [
  /\b(fais|traite|prends|passe [àa]|commence par|occupe-toi de) (?:plut[ôo]t )?\b/i,
  /\bplut[ôo]t que\b/i,
  /\ben priorit[ée]\b/i,
  /\bavant (?:tout|[çc]a|le reste)\b/i,
];

// DEUX DÉFINITIONS DU MÊME MOT, trouvées le 2026-09-23 en branchant les volets (b) et (c) : ce
// module déclarait « court = 180 caractères » et « alerte au 5e », pendant que SMART-CONSO-TOKEN
// comptait déjà la même chose avec « court = 240 » et « alerte au 4e » — deux compteurs de messages
// courts, deux seuils, aucun des deux au courant de l'autre. C'est exactement BP1 (« la règle
// s'écrit à UN endroit et se dérive partout ailleurs »), et j'ai écrit le second le matin même.
//
// QUI GARDE QUOI, et la répartition n'est pas arbitraire : SMART-CONSO-TOKEN possède la MESURE
// (il tient le journal des tours, et ses chiffres sont calibrés sur une vraie série observée, pas
// sur mon intuition) ; ce module possède la RÈGLE (que faire d'un message court). On DÉRIVE donc la
// mesure de chez lui plutôt que d'en garder une copie qui divergerait au premier réglage.
import { SEUILS_RAFALE, loadTours, detecterRafale } from "./smart-conso-token.mjs";

export const SEUIL_MESSAGE_COURT = SEUILS_RAFALE.court;

export function natureDuMessage(texte, { seuilCourt = SEUIL_MESSAGE_COURT } = {}) {
  const t = String(texte ?? "");
  // UN MESSAGE LONG N'EST JAMAIS « EN PASSANT » : il porte un vrai contenu, donc il se traite
  // normalement. Cette règle vient avant toutes les autres, sans quoi un long message contenant le
  // mot « attends » au milieu d'une phrase passerait pour un ordre d'arrêt.
  if (t.length >= seuilCourt) return { nature: "accompagnement", court: false, pourquoi: "message long : un vrai contenu, à traiter normalement" };
  if (FORMES_ARRET.some((f) => f.test(t))) return { nature: "arret", court: true, pourquoi: "une demande d'arrêt explicite — la seule chose qui interrompt le travail en cours" };
  if (FORMES_REDIRECTION.some((f) => f.test(t))) return { nature: "redirection", court: true, pourquoi: "il désigne un autre travail à faire : ce n'est pas du bruit, c'est la nouvelle tâche" };
  return { nature: "accompagnement", court: true, pourquoi: "rien n'y demande d'arrêter ni ne redirige : on en tient compte sans lâcher ce qu'on fait" };
}

// LA RÉACTION, calculée depuis l'historique réel de la session plutôt que de mémoire. C'est la
// partie testable ; la partie que rien ne peut forcer (l'agent DOIT enregistrer chaque message)
// est déclarée plus bas, honnêtement, comme partout ailleurs dans ce paysage.
export const SEUIL_RAPPEL_LEGER = 2;   // « un rappel leger dès le 2e message court » — le seul chiffre que l'utilisateur ait donné lui-même
// « une alerte plus forte quand ca devient couteux » : il n'a jamais dit à partir de combien. J'avais
// écrit 5 au jugé ; SMART-CONSO-TOKEN avait déjà 4, calibré sur la série réelle qui a motivé le
// conseil (« une dizaine de messages de quelques mots à la suite »). Un chiffre mesuré bat un chiffre
// choisi, donc on prend le sien — et on le DÉRIVE, pour qu'un futur réglage n'ait qu'un endroit.
export const SEUIL_ALERTE_FORTE = SEUILS_RAFALE.consecutifs;

// rangDepuisLeJournal() — LE VOLET (b) DE LA DEMANDE, et il ne crée aucun compteur : le journal des
// tours existe déjà (`.conso-tours.json`, tenu par SMART-CONSO-TOKEN), avec sa fenêtre de temps qui
// évite de coller ensemble deux séries séparées par une nuit. On lui demande le rang, on ne le
// recompte pas. Sa limite est la sienne : si l'agent n'a pas enregistré les tours, il rend « pas
// mesuré » — jamais zéro, qui se lirait comme « aucun message court » (leçon L5).
export function rangDepuisLeJournal({ loadToursImpl = loadTours, detecterRafaleImpl = detecterRafale, maintenant = Date.now() } = {}) {
  const rafale = detecterRafaleImpl(loadToursImpl(), { maintenant });
  if (!rafale.mesurable) return { mesure: "pas mesuré", raison: rafale.raison };
  return { mesure: "mesuré", rang: rafale.consecutifs };
}

export function reactionAuMessage(texte, { messagesCourtsPrecedents = 0 } = {}) {
  const { nature, court, pourquoi } = natureDuMessage(texte);
  if (nature === "arret") return { continuer: false, nature, rappel: null, quoiFaire: "s'arrêter : c'est la demande explicite, le seul cas qui interrompt", pourquoi };
  if (nature === "redirection") return { continuer: true, nature, rappel: null, quoiFaire: "changer de tâche pour celle-ci, sans s'arrêter ni attendre confirmation", pourquoi };

  const rang = messagesCourtsPrecedents + 1;
  // TROIS PALIERS, et le premier est volontairement muet : rappeler un coût dès le premier message
  // court serait pénible et ferait passer l'agent pour comptable de la conversation.
  let rappel = null;
  if (rang >= SEUIL_ALERTE_FORTE) rappel = "fort";
  else if (rang >= SEUIL_RAPPEL_LEGER) rappel = "leger";
  return {
    continuer: true,
    nature,
    rappel,
    rang,
    quoiFaire: "en tenir compte en une ligne, puis CONTINUER le travail en cours — un message court n'est pas une demande d'arrêt",
    pourquoi,
  };
}

// ABSORBER UNE REDIRECTION SANS PERDRE CE QU'ELLE DÉPLACE  (2026-09-24, chantier 5.4)
//
// La demande : « l'outil de suivi absorbe les demandes intempestives et réorganise la file à chaque
// prompt ». La première moitié existait déjà — `natureDuMessage()` reconnaît une redirection et dit
// de basculer dessus sans s'arrêter. C'est la SECONDE qui manquait, et son absence a un nom dans ce
// dépôt : l'item de Ronde `suivi-open-tasks-signal` cherche les tâches « interrompues par un prompt
// intempestif et jamais reprises ». Autrement dit, le défaut était connu et seulement CONSTATÉ
// APRÈS COUP, parfois des jours plus tard.
//
// Ce que cette fonction change : au moment où la redirection arrive, elle rend la LIGNE DE SUIVI à
// écrire pour la tâche déplacée, avant de basculer. Une tâche écrite peut être oubliée puis
// retrouvée ; une tâche qui n'existe nulle part est perdue à l'instant où le contexte se recharge.
//
// CE QU'ELLE NE FAIT PAS, et le dire est la protection (Article 27) : elle n'écrit rien elle-même
// et rien ne peut forcer l'agent à l'appeler. Même limite honnête que le comptage des messages
// courts juste au-dessus, que tool-brain et que SMART-CONSO-TOKEN. Ce qui est mécanique, c'est la
// FORME de ce qu'il faut écrire et le refus de rendre quoi que ce soit quand la tâche déplacée
// n'est pas nommée — parce qu'une absorption qui ne sait pas ce qu'elle déplace n'absorbe rien.
export function absorberLaRedirection({ tacheEnCours = null, texte = "", horodatage = null } = {}) {
  const { nature } = natureDuMessage(texte);
  if (nature !== "redirection") {
    return { absorbe: false, nature,
      pourquoi: "seule une REDIRECTION déplace le travail en cours : un accompagnement se traite sans lâcher ce qu'on fait, et un arrêt n'a rien à reporter puisqu'on s'arrête" };
  }
  if (!tacheEnCours || !String(tacheEnCours.sujet ?? "").trim()) {
    return { absorbe: false, nature, mesurable: false,
      pourquoi: "la tâche déplacée n'est pas nommée : je ne peux pas écrire ce qui doit être repris, et rendre une ligne vide ferait croire que le report a eu lieu" };
  }
  const quand = horodatage ?? new Date().toISOString().slice(0, 16) + "Z";
  return {
    absorbe: true, nature, quand,
    ligneASuivre: {
      statut: "reportée — déplacée par une redirection, jamais abandonnée",
      sujet: String(tacheEnCours.sujet).trim(),
      ouEllenEtait: String(tacheEnCours.ouEllenEtait ?? "").trim() || "non précisé — à relire avant de reprendre",
      deplaceePar: String(texte).trim().slice(0, 160),
    },
    quoiFaire: "écrire cette ligne dans docs/suivi/ AVANT de basculer, puis relire la file (node scripts/check-tasks-details.mjs) : la redirection change l'ordre, elle ne supprime pas ce qu'elle dépasse",
    pourquoi: "une tâche écrite peut être oubliée puis retrouvée ; une tâche qui n'existe nulle part est perdue dès que le contexte se recharge",
  };
}

// LE TEXTE DES DEUX RAPPELS. Calibrés pour ne pas culpabiliser : le fractionnement n'est pas une
// faute, c'est une manière de travailler qui a un coût — et le coût est nommé plutôt que reproché.
// AJOUT DE MON CÔTÉ, en réponse à sa question « tu vois autre chose à ajouter ? » : l'alerte forte
// dit ce que le fractionnement a RÉELLEMENT coûté, jamais seulement « c'est coûteux ». Une alerte
// qui n'avance aucun chiffre se lit comme un reproche vague, et on apprend à la sauter.
export function texteDuRappel(reaction, { toursRecharges } = {}) {
  if (reaction?.rappel === "leger") {
    return `💬 ${reaction.rang}ᵉ message court — je continue ce que je fais, comme demandé. (Un prompt groupé coûterait moins qu'une série de courts : je le signale une fois, sans insister.)`;
  }
  if (reaction?.rappel === "fort") {
    const cout = Number.isFinite(toursRecharges) ? ` Ça fait ${toursRecharges} rechargements de contexte sur cette série.` : "";
    return `⚠️ ${reaction.rang}ᵉ message court d'affilée.${cout} Chaque message relance un tour complet : le coût n'est pas la réponse, c'est la reprise. Regrouper la suite en un seul message ferait une vraie différence — et je continue quand même, je ne m'arrête pas pour autant.`;
  }
  return "";
}

// LA LIMITE HONNÊTE, déclarée plutôt que tue (Article 27). Aucun mécanisme ne peut compter les
// messages d'une conversation depuis le disque : c'est l'agent qui doit les enregistrer, et rien ne
// peut l'y forcer. Ce qui EST mécanique : la décision elle-même, testée ci-dessous, donc jamais
// laissée au jugement du moment. Même patron que tool-brain et SMART-CONSO-TOKEN, et le dire vaut
// mieux que de laisser croire à une surveillance qui n'existe pas.
export const LIMITE_DECLAREE = "Le comptage des messages courts dépend de l'agent : aucun mécanisme ne lit une conversation. Ce qui est garanti mécaniquement, c'est la RÈGLE (continuer par défaut, s'arrêter seulement sur une demande explicite) et les seuils — jamais leur application.";

export function formatRegleMessagesCourts() {
  return [
    "=== Messages courts — ne jamais s'arrêter ===",
    "",
    ...Object.entries(NATURES_MESSAGE).map(([k, v]) => `${k.padEnd(16)} — ${v}`),
    "",
    `Rappel léger à partir du ${SEUIL_RAPPEL_LEGER}ᵉ message court · alerte forte à partir du ${SEUIL_ALERTE_FORTE}ᵉ.`,
    `Un message de ${SEUIL_MESSAGE_COURT} caractères ou plus n'est jamais « en passant » : il se traite normalement.`,
    "",
    LIMITE_DECLAREE,
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(formatRegleMessagesCourts());
