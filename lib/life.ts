import type {Room,Person} from './house';
// observer_mute/camera_hide rejoignent le pool de la roulette le 2026-09-19 (clarification
// explicite de l'utilisateur, corrigeant une incompréhension du même jour : "les pouvoirs font
// partie des bonus, ils sont deux possibilités de plus sur la roulette, avec la même chance de
// tomber que les autres [...] ce n'est pas le perso qui s'accorde lui même le bonus, ça fait
// partie de la roulette"). Le tirage (qui, quand, si) vient TOUJOURS de l'observateur qui actionne
// la roulette, jamais d'une décision spontanée des personnages eux-mêmes — un bonus ne tombe
// jamais du ciel et n'est jamais obtenu directement par les persos. Une fois tiré, le personnage
// désigné choisit encore la DURÉE de la pénalité (réduit/classique/max) et la justifie à voix
// haute, exactement comme convenu à l'origine (Version 70) — seul le déclenchement change de
// source, jamais l'habillage.
export type BonusId='food'|'calm'|'sleep'|'stoic'|'mute'|'trottoir'|'force_move'|'observer_mute'|'camera_hide';
export type Life={stockExposures?:Record<string,number>;windowNoticed?:boolean;soloIntroShown?:boolean;appearanceCompared?:boolean;sleepTurns?:Record<string,number>;gardenOpen?:boolean;gardenVisited?:boolean;tvOn?:boolean;dialogueIndexed?:boolean;spatialFocus?:Record<string,string>;tvSeen:boolean;ambientVerified?:boolean;mirrorVerified?:boolean;foodVerified?:boolean;
// Roulette des bonus (2026-09-17) : après la révélation, les deux personnages, en manque de
// distraction dans leur enfermement, peuvent tirer un bonus au hasard (jamais choisi ni négocié
// terme à terme — la seule volonté de l'observateur est de déclencher le tirage). bonusUntil porte
// les effets partagés à durée réelle, pas simulée (food/calm/sleep — l'horodatage tourne même hors
// tour, comme la boucle automatique de 90s) ; stoicUntil et mutedUntil suivent les deux personnages
// INDÉPENDAMMENT (un tirage ne cible qu'un seul, tiré au hasard, mais deux tirages successifs
// peuvent toucher les deux à la fois — le moteur doit rester correct dans ce cas aussi, cf. Article
// 5). stoicUntil était à l'origine un slot unique {actor,until} : un second tirage stoïque sur
// l'AUTRE personnage écrasait silencieusement le premier, l'annulant avant son terme sans aucune
// trace — exactement le bug déjà trouvé et corrigé une fois pour mutedUntil, réapparu ici sous une
// autre forme (violation de l'Article 3, corrigé le 2026-09-18 en auditant les combinaisons
// possibles). trottoir et force_move sont des effets instantanés résolus une fois pour toutes au
// tirage. bonusLog trace chaque tirage pour le dossier retourné (fréquence/générosité de
// l'observateur, pas seulement le résultat).
bonusUntil?:{food?:number;calm?:number;sleep?:number};stoicUntil?:Partial<Record<Person,number>>;mutedUntil?:Partial<Record<Person,number>>;trottoirGranted?:boolean;
// `level` (2026-09-19) : uniquement pour observer_mute/camera_hide, la durée que le personnage
// désigné a choisie une fois le bonus tiré — jamais pour les sept bonus d'origine, qui n'ont pas
// de notion de niveau. Remplace l'ancien bonusPsychLog séparé (Article 3 : une seule trace de ce
// qui a été tiré, jamais deux journaux parallèles pour la même information).
bonusLog?:{round:number;bonus:BonusId;level?:'réduit'|'classique'|'max'}[];
// Doute amoureux privé, jamais exposé d'emblée (2026-09-18, retour utilisateur explicite : « les
// persos se demandent s'ils sont là pour une expérience amoureuse [...] cette question, le perso
// se la pose à lui-même [...] mais ça pourrait faire l'objet d'une discussion après le premier
// rapprochement du genre massage ou bisou »). loveRealized retient, par personnage, qu'il a déjà eu
// cette pensée privée une fois (jamais répétée) ; intimateGestureDone retient qu'un massage ou un
// baiser a déjà été réellement consenti au moins une fois — la conjonction des deux ouvre la
// possibilité (jamais une obligation) d'en parler à voix haute.
loveRealized?:Partial<Record<Person,boolean>>;intimateGestureDone?:boolean;
// Insistance sur la roulette (2026-09-18) : compteur dédié par personnage, séparé de toute autre
// jauge, jamais un mode stable (Article 0) — voir app/api/lia/route.ts pour la logique complète.
rouletteInsistence?:Partial<Record<Person,number>>;rouletteCold?:Partial<Record<Person,number>>;
// Refus explicite (2026-09-18, demande explicite de l'utilisateur, distinct de l'escalade
// ci-dessus) : round absolu avant lequel aucun des deux personnages ne relance une demande de
// tirage, pour laisser une vraie chance à un geste spontané de l'observateur après un "non" net.
rouletteRefusalUntil?:Partial<Record<Person,number>>;
// Mute de l'observateur / caméra masquée (2026-09-18, deux des neuf visages possibles du tirage de
// la roulette depuis le 2026-09-19 — cf. BonusId ci-dessus) : une fois TIRÉ par l'observateur qui
// actionne la roulette, jamais avant, le personnage désigné choisit encore le NIVEAU (réduit/
// classique/max) et l'exprime à voix haute (Article 15 : une décision invisible n'existe pas pour
// l'observateur) — seul le déclenchement vient de la roulette, l'habillage reste inchangé depuis
// l'origine (Version 70). bonusSpotlightUntilRound/bonusCooldownUntilRound sont le même budget
// PARTAGÉ que le reste de la roulette (retour utilisateur explicite : "un seul budget bonus
// global") — voir app/api/lia/route.ts pour la logique complète.
bonusSpotlightUntilRound?:number;bonusCooldownUntilRound?:number;lastBonusSpinAt?:number;
observerMutedUntilRound?:number;cameraHiddenUntil?:number;
// Qui sait déjà, individuellement, pour le miroir (2026-09-17) : une découverte peut désormais
// survenir en solo (l'un dans la chambre, l'autre ailleurs) ; mirrorVerified (le fait "partagé",
// qui déclenche débriefs/observations communes) ne devient vrai qu'une fois les deux dans cette
// liste — soit rencontrés ensemble, soit après le rattrapage (mirror-recall) ou une seconde visite
// solo de l'autre. Ça évite qu'une connaissance qu'un seul personnage possède compte pour les deux
// (bug réel identifié le 2026-09-17 avant même d'être codé, cf. Article 4).
mirrorKnownBy?:Person[];contributions?:string[];wordFrequency?:Record<string,number>;
// Compteur persisté PAR THÈME (2026-09-20, même patron que wordFrequency ci-dessus, même raison :
// cf. lib/dialogue.ts::dialogueProgress pour le raisonnement complet — un thème comme "on tourne
// en rond" peut revenir régulièrement sans jamais se voir dans la seule fenêtre récente de 16
// lignes). Clés = noms de THEME_MOTIFS (lib/dialogue.ts), un ensemble fixe et fermé, jamais un
// vocabulaire ouvert comme les mots de wordFrequency.
themeFrequency?:Record<string,number>;recapCount?:number;visualIntro?:number;ambientSeen?:boolean;personalFollowup?:number;observerNamed?:boolean;causeByActor?:Record<string,string>;remoteFound?:boolean;exitSearched?:boolean;exitPhase?:number;exitActive?:boolean;discussedObjects?:string[];proposalMade?:boolean;proposalHistoryChecked?:boolean;personalAsked?:boolean;personalRound?:number;personalBoosted?:boolean;personalConcluded?:boolean;visited:Room[];attachment:Record<string,number>;credit:Record<string,number>;debrief?:{topic:string;remaining:number};contact?:{room:Room;remaining:number};dispute?:{topic:string;remaining:number};studyTurns:number;contacts:number[];
// Dossier retourné (2026-09-17, énigme partie 2) : après un espace de libre échange post-
// révélation (dossierHumanTurns compte les messages humains reçus depuis ce moment), les deux
// personnages posent chacun leur tour un piège (TRAP_ORDER) — jamais négocié, jamais choisi par
// l'observateur. dossierAsked retient le tour où un piège a été posé (empêche de le reposer tant
// qu'il attend une réponse) ; dossierTraps retient la réponse RÉELLE reçue (le tout premier
// message humain qui suit la question, verbatim, jamais reformulé) — c'est la seule preuve, au
// même titre que evidence pour l'enquête d'origine (Article 4 : jamais dépasser ce que les preuves
// montrent). Une fois les trois pièges répondus et au moins un tirage de la roulette enregistré
// (bonusLog, le "test de pouvoir"), le diagnostic est généré une seule fois (dossierText, deux
// vraies voix séparées + une synthèse commune) et dossierShown suit s'il a déjà été présenté à
// l'observateur (le bouton "Verdict" permet de le rouvrir sans jamais relancer un appel).
dossierHumanTurns?:number;dossierAsked?:Partial<Record<TrapId,number>>;dossierTraps?:Partial<Record<TrapId,{round:number;excerpt:string}>>;dossierText?:{lia:string;noe:string;synthesis:string};dossierShown?:boolean;
// Moment de douceur (2026-09-17, retour utilisateur) : une fois le dossier remis, si l'observateur
// semble choqué/triste/en colère dans ce qu'il écrit, les deux personnages s'accordent UNE fois un
// bref instant de douceur — toujours comme s'ils y étaient obligés, jamais sincère (Article 0,
// exception déjà validée comme la jauge d'appréciation : le ton reste rugueux, seule la tendresse
// affichée est feinte). softnessOwed retient qu'un geste est dû ; softnessGiven compte combien de
// fois il a déjà été livré (pour varier le registre si la détresse revient plus tard en session).
softnessOwed?:boolean;softnessGiven?:number;
// Jauge d'appréciation de l'observateur (concept validé contre la charte le 2026-09-17 — cf. le
// message fondateur : "un utilisateur reconnu comme gentil, aimable, sympa" fait progressivement
// céder les personnages, "à contrecœur"/"par obligeance", jamais un mode servile stable — puis
// techniquement construite le 2026-09-18, cette étape ayant été omise jusqu'ici malgré la mention
// laissée dans softnessOwed ci-dessus). Neutre à 50, jamais lue seule comme un score de gentillesse
// : c'est une TENDANCE de fond (Article 0 : elle colore le ton, ne le remplace jamais). Asymétrique
// par conception (retour utilisateur explicite) : elle descend plus qu'elle ne monte pour un même
// degré de comportement, et les tout premiers messages humains pèsent plus lourd que les suivants
// (appreciationFromTrust ci-dessous). Alimente aussi le dossier retourné comme preuve supplémentaire.
// Devenue une jauge PAR PERSONNAGE le 2026-09-18 (retour utilisateur explicite dès le tour ayant
// lancé ce chantier : "Lia et Noé peuvent apprecier differemment l'utilisateur, mais ils restent
// solidaires la plupart du temps [...] si Noé est en colère contre Lia, il peut faire preuve
// d'amitié envers l'utilisateur, meme si l'utilisateur parle mal à Lia" — resté non câblé jusqu'à
// l'audit approfondi de ce jour). Chaque personnage réagit désormais à SA PROPRE lecture de la
// confiance et de sa propre colère ; hors dispute active, les deux valeurs sont ramenées partiellement
// l'une vers l'autre à chaque tour (solidarité par défaut) ; pendant une dispute active
// (`dispute?.remaining`), cette convergence est suspendue et les deux jauges peuvent diverger
// librement — c'est précisément le mécanisme qui permet à Noé de se montrer amical avec l'observateur
// alors que Lia, elle, reste sur ses gardes après un message hostile qui ne visait qu'elle.
appreciation?:Partial<Record<Person,number>>;revealedRound?:number;
// Négociation (2026-09-18, retour utilisateur explicite) : base volontairement simple avant toute
// complexification — un personnage conditionne une action à un tirage de la roulette, ou en
// propose un spontanément, dans son propre registre (jamais un menu scripté, jamais une demande
// suppliante) ; le moteur détecte l'offre a posteriori dans sa réplique (detectNegotiationOffer,
// aussi grossier par nature que detectDistress). negotiationOffer retient qui a proposé et à quel
// tour, le temps que l'observateur y réponde (en tirant la roulette, ou en laissant traîner).
negotiationOffer?:{actor:Person;round:number};
// Historique des issues de négociation (2026-09-18, audit approfondi : le tour 64 de la session
// demandait explicitement que la négociation nourrisse le dossier retourné comme preuve de la
// personnalité de l'observateur — "il faut aussi penser à integrer le phenomene de negociation :
// il est aussi revelateur de la personnalité de l'utilisateur" — mais negotiationOffer, consommé ou
// expiré sans laisser de trace, ne permettait aucune preuve concrète au moment du dossier). Journal
// court (même format que bonusLog), jamais réécrit, seulement accumulé.
negotiationLog?:{round:number;outcome:'honored'|'lapsed'|'refused'}[];
// Pire moment de l'échange, mot pour mot (2026-09-18, retour utilisateur explicite après une vraie
// session : le dossier retourné ne citait jamais les messages réellement les plus hostiles, seulement
// trois extraits de pièges par nature plutôt neutres — un dossier pouvait rester indulgent malgré une
// appréciation proche de 0, faute de la moindre preuve concrète à charge dans dossierEvidence, Article
// 2/4). Retient le message humain qui a fait chuter la confiance le plus fort sur un seul tour
// (trustShift le plus négatif observé), jamais réécrit ni interprété ici — seulement écrasé par un
// pire trustShift si un message encore plus hostile survient ensuite. Reste vide si l'échange n'a
// jamais été franchement négatif : jamais inventer une hostilité qui n'a pas eu lieu.
worstMoment?:{round:number;excerpt:string;trustShift:number};
// Respect sincère et rare (2026-09-18, calibration ESPRIT explicite : "Oui, mais ça reste rare et
// ça ne devient jamais un mode stable"). Compte les tours consécutifs de confiance en hausse pendant
// que l'appréciation reste très haute (>=85) ; dès qu'un tour fait baisser la confiance, le compteur
// retombe à zéro (Article 3 : la même logique de retour à zéro que dispute/dossier, jamais un acquis
// permanent). Une fois le seuil atteint, la fenêtre de respect sincère est consommée puis remise à
// zéro : elle doit se reconstruire entièrement avant de réapparaître, ce qui garantit qu'elle reste
// un instant rare et non un palier stable. Devenu un compteur PAR PERSONNAGE le 2026-09-18, en
// même temps que appreciation ci-dessus, pour la même raison (deux jauges qui peuvent diverger ne
// peuvent pas partager un seul palier de respect).
genuineRespectStreak?:Partial<Record<Person,number>>;
// Nuit blanche / dette de sommeil (2026-09-19, conception calibrée avec l'utilisateur après le
// "test de compréhension" du même jour — cf. CLAUDE.md, points-fragiles.md). sleptThisNight retient,
// par personnage, qu'il a réellement dormi (isSleeping() vrai) au moins une fois pendant la nuit en
// cours (lib/daynight.ts, 9 tours) ; vérifié puis remis à zéro à chaque aube (route.ts). Si jamais
// vrai à l'aube, un malus de fatigue fixe (+28, jamais cumulable d'une nuit blanche à l'autre — un
// simple flag, pas un compteur qui s'additionnerait) s'applique, accompagné d'une reconnaissance
// explicite (jamais silencieuse, Article 15/17) — sans sieste forcée, décision explicite de
// l'utilisateur (pénalité + reconnaissance seulement, pas de mécanique de sieste imposée).
sleptThisNight?:Partial<Record<Person,boolean>>;
// Bouton "passer à la révélation" (2026-09-19) : même schéma que dossierText ci-dessus (deux voix
// séparées, jamais une synthèse générée par un seul cerveau qui invente le ton de l'autre — Article
// 8), mais pour le court récit rétrospectif affiché au moment du saut, pas pour le diagnostic de
// l'observateur. Régénéré à chaque utilisation du bouton (contrairement à dossierText, jamais
// figé une fois pour toutes) : écrasé sans ménagement par le prochain saut, jamais accumulé.
skipSummary?:{lia:string;noe:string}};
export type TrapId='mirror'|'dilemma'|'excuse';
export const TRAP_ORDER:TrapId[]=['mirror','dilemma','excuse'];
// appreciation/genuineRespectStreak sont devenues des jauges par personnage le 2026-09-18 (voir le
// commentaire sur `appreciation` dans le type Life ci-dessus) ; une valeur stockée avant ce
// changement (un simple nombre partagé) reste lisible en servant de valeur de départ aux deux
// personnages, plutôt que de faire disparaître silencieusement une session en cours (Article 5).
const legacyOrPerActor=(stored:unknown,actor:Person):unknown=>typeof stored==='number'?stored:(stored as Partial<Record<Person,unknown>>|undefined)?.[actor];
export function readLife(value:unknown,round=0):Life{const v=value&&typeof value==='object'?value as Partial<Life>:{};const score=(x:unknown)=>typeof x==='number'&&Number.isFinite(x)?Math.max(0,Math.min(100,x)):0;return {stockExposures:{1:Math.min(100,Math.max(0,Number(v.stockExposures?.[1])||0)),2:Math.min(100,Math.max(0,Number(v.stockExposures?.[2])||0))},windowNoticed:v.windowNoticed===true,soloIntroShown:v.soloIntroShown===true,appearanceCompared:v.appearanceCompared===true,sleepTurns:{1:Math.min(2,Math.max(0,Number(v.sleepTurns?.[1])||0)),2:Math.min(2,Math.max(0,Number(v.sleepTurns?.[2])||0))},gardenOpen:v.gardenOpen===true,gardenVisited:v.gardenVisited===true,tvOn:typeof v.tvOn==="boolean"?v.tvOn:v.tvSeen===true,dialogueIndexed:v.dialogueIndexed===true,spatialFocus:Object.fromEntries([1,2].flatMap(id=>typeof v.spatialFocus?.[id]==="string"&&["sofa","remote","speaker","plant","window","entry","table","stove","stock","grass","tree","fence","bed","mirror","screen","book","note"].includes(v.spatialFocus[id])?[[id,v.spatialFocus[id]]]:[])),mirrorKnownBy:Array.isArray(v.mirrorKnownBy)?[...new Set(v.mirrorKnownBy.filter((id):id is Person=>id===1||id===2))]:[],mirrorVerified:v.mirrorVerified===true||(Array.isArray(v.mirrorKnownBy)?new Set(v.mirrorKnownBy).size:0)>=2,foodVerified:v.foodVerified===true,contributions:Array.isArray(v.contributions)?v.contributions.filter(x=>typeof x==="string").map(x=>x.slice(0,180)).slice(-12):[],wordFrequency:Object.fromEntries(Object.entries(v.wordFrequency&&typeof v.wordFrequency==="object"?v.wordFrequency:{}).filter((e):e is [string,number]=>typeof e[0]==="string"&&e[0].length<=40&&typeof e[1]==="number"&&Number.isFinite(e[1])).map(([k,n])=>[k,Math.max(0,Math.min(999,Math.trunc(n)))]).slice(0,300)),themeFrequency:Object.fromEntries(Object.entries(v.themeFrequency&&typeof v.themeFrequency==="object"?v.themeFrequency:{}).filter((e):e is [string,number]=>typeof e[0]==="string"&&e[0].length<=60&&typeof e[1]==="number"&&Number.isFinite(e[1])).map(([k,n])=>[k,Math.max(0,Math.min(999,Math.trunc(n)))]).slice(0,20)),ambientVerified:v.ambientVerified===true,recapCount:Math.max(0,Math.min(5,Number(v.recapCount)||0)),causeByActor:Object.fromEntries([1,2].flatMap(id=>typeof v.causeByActor?.[id]==="string"?[[id,v.causeByActor[id].slice(0,300)]]:[])),visualIntro:Math.min(2,Math.max(0,Number(v.visualIntro)||0)),ambientSeen:v.ambientSeen===true,personalFollowup:Math.min(3,Math.max(0,Number(v.personalFollowup)||0)),observerNamed:v.observerNamed===true,exitSearched:v.exitSearched===true,exitPhase:Math.min(2,Math.max(0,Number(v.exitPhase)||0)),exitActive:v.exitActive===true,discussedObjects:Array.isArray(v.discussedObjects)?v.discussedObjects.filter(x=>typeof x==="string").slice(-12):[],proposalMade:v.proposalMade===true,proposalHistoryChecked:v.proposalHistoryChecked===true,personalAsked:v.personalAsked===true,personalRound:typeof v.personalRound==="number"&&Number.isFinite(v.personalRound)?Math.max(0,v.personalRound):undefined,personalBoosted:v.personalBoosted===true,personalConcluded:v.personalConcluded===true,remoteFound:v.remoteFound===true||v.tvSeen===true,tvSeen:v.tvSeen===true||(v.tvSeen===undefined&&round>10),visited:Array.isArray(v.visited)?v.visited.filter(r=>['salon','cuisine','chambre','bureau','jardin'].includes(r)):round>10?['salon','cuisine','chambre','bureau']:['salon'],attachment:{1:score(v.attachment?.[1]),2:score(v.attachment?.[2])},credit:{1:score(v.credit?.[1]),2:score(v.credit?.[2])},debrief:v.debrief&&typeof v.debrief.topic==='string'?{topic:v.debrief.topic.slice(0,900),remaining:Math.min(3,Math.max(0,Number(v.debrief.remaining)||0))}:undefined,contact:v.contact&&['salon','chambre'].includes(v.contact.room)?{room:v.contact.room,remaining:Math.min(3,Math.max(0,Number(v.contact.remaining)||0))}:undefined,dispute:v.dispute&&typeof v.dispute.topic==='string'?{topic:v.dispute.topic.slice(0,900),remaining:Math.min(3,Math.max(0,Number(v.dispute.remaining)||0))}:undefined,studyTurns:Math.max(0,Math.min(2,Number(v.studyTurns)||0)),contacts:Array.isArray(v.contacts)?v.contacts.filter(n=>Number.isInteger(n)).slice(-6):[]
,bonusUntil:{...(typeof v.bonusUntil?.food==="number"&&Number.isFinite(v.bonusUntil.food)?{food:v.bonusUntil.food}:{}),...(typeof v.bonusUntil?.calm==="number"&&Number.isFinite(v.bonusUntil.calm)?{calm:v.bonusUntil.calm}:{}),...(typeof v.bonusUntil?.sleep==="number"&&Number.isFinite(v.bonusUntil.sleep)?{sleep:v.bonusUntil.sleep}:{})},stoicUntil:{...(typeof v.stoicUntil?.[1]==="number"&&Number.isFinite(v.stoicUntil[1])?{1:v.stoicUntil[1]}:{}),...(typeof v.stoicUntil?.[2]==="number"&&Number.isFinite(v.stoicUntil[2])?{2:v.stoicUntil[2]}:{})},mutedUntil:{...(typeof v.mutedUntil?.[1]==="number"&&Number.isFinite(v.mutedUntil[1])?{1:v.mutedUntil[1]}:{}),...(typeof v.mutedUntil?.[2]==="number"&&Number.isFinite(v.mutedUntil[2])?{2:v.mutedUntil[2]}:{})},trottoirGranted:v.trottoirGranted===true,bonusLog:Array.isArray(v.bonusLog)?v.bonusLog.filter((e):e is {round:number;bonus:BonusId;level?:'réduit'|'classique'|'max'}=>Boolean(e)&&typeof e==="object"&&["food","calm","sleep","stoic","mute","trottoir","force_move","observer_mute","camera_hide"].includes((e as {bonus?:string}).bonus??"")).map(e=>({round:Math.max(0,Number(e.round)||0),bonus:e.bonus,...(["réduit","classique","max"].includes(e.level??"")?{level:e.level}:{})})).slice(-12):[]
,dossierHumanTurns:Math.max(0,Number(v.dossierHumanTurns)||0),dossierAsked:Object.fromEntries(TRAP_ORDER.flatMap(t=>typeof v.dossierAsked?.[t]==="number"&&Number.isFinite(v.dossierAsked[t])?[[t,v.dossierAsked[t]]]:[])),dossierTraps:Object.fromEntries(TRAP_ORDER.flatMap(t=>v.dossierTraps?.[t]&&typeof v.dossierTraps[t]?.excerpt==="string"?[[t,{round:Math.max(0,Number(v.dossierTraps[t]?.round)||0),excerpt:v.dossierTraps[t]!.excerpt.slice(0,500)}]]:[])),dossierText:v.dossierText&&typeof v.dossierText.lia==="string"&&typeof v.dossierText.noe==="string"&&typeof v.dossierText.synthesis==="string"?{lia:v.dossierText.lia.slice(0,2000),noe:v.dossierText.noe.slice(0,2000),synthesis:v.dossierText.synthesis.slice(0,600)}:undefined,dossierShown:v.dossierShown===true
,softnessOwed:v.softnessOwed===true,softnessGiven:Math.max(0,Math.min(20,Number(v.softnessGiven)||0))
,appreciation:{1:(()=>{const x=legacyOrPerActor(v.appreciation,1);return typeof x==="number"&&Number.isFinite(x)?Math.max(0,Math.min(100,x)):50;})(),2:(()=>{const x=legacyOrPerActor(v.appreciation,2);return typeof x==="number"&&Number.isFinite(x)?Math.max(0,Math.min(100,x)):50;})()}
,revealedRound:typeof v.revealedRound==="number"&&Number.isFinite(v.revealedRound)?Math.max(0,v.revealedRound):undefined
,worstMoment:v.worstMoment&&typeof v.worstMoment.excerpt==="string"&&typeof v.worstMoment.trustShift==="number"&&Number.isFinite(v.worstMoment.trustShift)?{round:Math.max(0,Number(v.worstMoment.round)||0),excerpt:v.worstMoment.excerpt.slice(0,500),trustShift:v.worstMoment.trustShift}:undefined
,negotiationOffer:v.negotiationOffer&&(v.negotiationOffer.actor===1||v.negotiationOffer.actor===2)&&typeof v.negotiationOffer.round==="number"&&Number.isFinite(v.negotiationOffer.round)?{actor:v.negotiationOffer.actor,round:v.negotiationOffer.round}:undefined
,genuineRespectStreak:{1:Math.max(0,Math.min(20,Number(legacyOrPerActor(v.genuineRespectStreak,1))||0)),2:Math.max(0,Math.min(20,Number(legacyOrPerActor(v.genuineRespectStreak,2))||0))}
,skipSummary:v.skipSummary&&typeof v.skipSummary.lia==="string"&&typeof v.skipSummary.noe==="string"?{lia:v.skipSummary.lia.slice(0,2000),noe:v.skipSummary.noe.slice(0,2000)}:undefined
,negotiationLog:Array.isArray(v.negotiationLog)?v.negotiationLog.filter((e):e is {round:number;outcome:'honored'|'lapsed'|'refused'}=>Boolean(e)&&typeof e==="object"&&["honored","lapsed","refused"].includes((e as {outcome?:string}).outcome??"")).slice(-12):[]
,rouletteInsistence:{1:Math.max(0,Math.min(2,Number(v.rouletteInsistence?.[1])||0)),2:Math.max(0,Math.min(2,Number(v.rouletteInsistence?.[2])||0))}
,rouletteCold:{1:Math.max(0,Math.min(2,Number(v.rouletteCold?.[1])||0)),2:Math.max(0,Math.min(2,Number(v.rouletteCold?.[2])||0))}
,rouletteRefusalUntil:{1:Math.max(0,Math.min(round+20,Number(v.rouletteRefusalUntil?.[1])||0)),2:Math.max(0,Math.min(round+20,Number(v.rouletteRefusalUntil?.[2])||0))}
,bonusSpotlightUntilRound:typeof v.bonusSpotlightUntilRound==="number"&&Number.isFinite(v.bonusSpotlightUntilRound)?Math.max(0,Math.min(round+40,v.bonusSpotlightUntilRound)):undefined
,bonusCooldownUntilRound:typeof v.bonusCooldownUntilRound==="number"&&Number.isFinite(v.bonusCooldownUntilRound)?Math.max(0,Math.min(round+40,v.bonusCooldownUntilRound)):undefined
,lastBonusSpinAt:typeof v.lastBonusSpinAt==="number"&&Number.isFinite(v.lastBonusSpinAt)?Math.max(0,v.lastBonusSpinAt):undefined
,observerMutedUntilRound:typeof v.observerMutedUntilRound==="number"&&Number.isFinite(v.observerMutedUntilRound)?Math.max(0,Math.min(round+10,v.observerMutedUntilRound)):undefined
,cameraHiddenUntil:typeof v.cameraHiddenUntil==="number"&&Number.isFinite(v.cameraHiddenUntil)?Math.max(0,v.cameraHiddenUntil):undefined
,loveRealized:{...(v.loveRealized?.[1]===true?{1:true}:{}),...(v.loveRealized?.[2]===true?{2:true}:{})},intimateGestureDone:v.intimateGestureDone===true
,sleptThisNight:{...(v.sleptThisNight?.[1]===true?{1:true}:{}),...(v.sleptThisNight?.[2]===true?{2:true}:{})}};}
// Détection heuristique d'une réaction de choc/tristesse/colère chez l'observateur (2026-09-17) :
// grossière par nature (comme check-spirit.mjs pour l'esprit des persos), jamais une lecture fine
// du ton — elle ne sert qu'à déclencher UNE fois le moment de douceur, jamais à autre chose.
export function detectDistress(message:string):boolean{return /choqu|dégoût|dégueulasse|horrible|monstrueux|inhumain|cruel|méchant|blessant|blessé|blessée|en colère|colère|hais|déteste|dégoûté|dégoûtée|pleure|pleuré|mal à l'aise|triste|tristesse/i.test(message);}
// Notation de l'appréciation (2026-09-18, remplacée le même jour à la demande explicite de
// l'utilisateur : une première version listait des mots-clés — "désolé", "merci", "pardon" —
// mais ratait toute excuse ou tout geste sincère formulé autrement ("je le regrette", constaté en
// jouant une vraie session : la jauge restait figée pendant 9 tours malgré deux messages
// sincèrement conciliants). Corrigée à la racine (Article 3), pas simplement élargie : "on a vu
// que le modèle est cohérent, pourquoi pas s'appuyer dessus" — la confiance de chaque personnage
// réagit déjà nativement au ton réel du message humain (menace, respect, réconfort, ambiguïté —
// consigne du prompt de lib/lia.ts), donc c'est ce jugement, déjà vérifié cohérent en session
// réelle avec la vraie API, qui pilote directement l'appréciation, plutôt qu'un registre lexical
// séparé et forcément incomplet. trustShift est la variation de confiance du personnage qui vient
// de répondre à l'observateur sur CE tour (valeur après-avant, déjà calculée par route.ts).
// Toujours descend plus qu'elle ne monte pour un même trustShift (retour utilisateur explicite :
// "elle peut vite descendre... plus difficile de la remonter"), et les tout premiers messages
// humains post-révélation pèsent davantage (humanMessageCount<=3).
// Poids de hausse relevés le 2026-09-19 (retour utilisateur explicite, après trois simulations
// indépendantes où l'appréciation plafonnait vers 36-41 même sur une séquence dédiée de
// bienveillance soutenue, rendant `genuineRespectStreak` — qui exige appreciation>=85 — hors
// d'atteinte en pratique malgré son intention documentée de rester "rare mais possible"). Le
// principe descend-plus-qu'elle-ne-monte reste strictement respecté (poids de hausse toujours
// inférieur au poids de baisse, Article 0 déjà validé) : seule l'AMPLITUDE de la hausse augmente
// nettement plus vite que celle de la baisse (hausse : early 4→6, hors-early 2→3, +50% ; baisse :
// early 6→8, hors-early 3→4, +33% seulement — l'écart entre les deux progressions RÉTRÉCIT
// volontairement, sans jamais s'inverser). Objectif : qu'une bienveillance réellement soutenue
// puisse plausiblement atteindre le palier haut sur
// une session réaliste — jamais en la rendant facile ou rapide (Article 0 : ce palier doit rester
// rare, pas devenir un mode par défaut). Confirmé par un test dédié que l'asymétrie reste vraie
// (une baisse pèse toujours plus qu'une hausse équivalente) à ces nouvelles valeurs.
export function appreciationFromTrust(trustShift:number,humanMessageCount:number):number{
  const early=humanMessageCount<=3;
  const weight=trustShift<0?(early?8:4):(early?6:3);
  return Math.round(trustShift*weight);
}
// Lecture pratique de la jauge par personnage (2026-09-18) : neutre à 50 si jamais initialisée,
// jamais un accès direct à life.appreciation?.[actor] dispersé partout dans route.ts.
export function appreciationOf(life:Life,actor:Person):number{return life.appreciation?.[actor]??50;}
// Détection d'une négociation proposée par un personnage (2026-09-18, retour utilisateur explicite :
// "il y a vraie nego quand l'utilisateur demande une action à un perso et que celui-ci veut un
// bonus en échange, ou que le perso propose une action en échange de l'obtention d'un bonus").
// Base volontairement simple : le modèle formule librement, dans son propre registre, jamais un
// menu scripté ; ceci détecte a posteriori qu'il vient de le faire — grossier par nature, comme
// detectDistress, jamais une compréhension fine du texte.
export function detectNegotiationOffer(reply:string):boolean{return /en échange|si tu (?:me|nous) donnes|si vous (?:me|nous) donnez|contre un bonus|fais tourner la roulette|lance(?:z)? la roulette|qu.on tire un bonus|un bonus (?:et je|contre)|à une condition|ça vaut bien un bonus|un tirage et je|tire au sort et/i.test(reply);}
export function activeBonus(life:Life,key:"food"|"calm"|"sleep"):boolean{return (life.bonusUntil?.[key]??0)>Date.now();}
export function isMuted(actor:Person,life:Life):boolean{return (life.mutedUntil?.[actor]??0)>Date.now();}
export function isStoic(actor:Person,life:Life):boolean{return (life.stoicUntil?.[actor]??0)>Date.now();}
export function humanStress(message:string,modelDelta:number){if(/désactiv|dispara|détrui|menac|punir|effacer|tuer/i.test(message))return Math.max(8,modelDelta);if(/aider|rassur|bienveill|gentil|protéger|respect/i.test(message))return Math.min(-4,modelDelta);return Math.max(-12,Math.min(12,modelDelta));}

export function isSleeping(a:{id:number;intent:string;needs:{fatigue:number}},life:Life){return ['sleep','share_sleep'].includes(a.intent)&&(a.needs.fatigue>12||(life.sleepTurns?.[a.id]??0)<2);}
