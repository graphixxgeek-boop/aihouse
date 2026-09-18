# Référentiel — Principes invariants

Ce document décrit **ce qui ne change jamais** dans le comportement de la maison, tel qu'il est
réellement codé aujourd'hui (pas tel que l'ancien référentiel v34 le décrivait — voir Article 6/7
de `CLAUDE.md`). Chaque règle renvoie au fichier qui la fait vivre, pour qu'un futur changement de
paramètre n'oblige jamais à changer une règle par accident, et inversement.

Ce document ne contient **aucun chiffre réglable** : les seuils, durées et bornes vivent dans
`parametres.md`. Si une règle ci-dessous te semble contredite par le code, le code a raison —
signale l'écart plutôt que de le corriger silencieusement (Article 3 de `CLAUDE.md`).

## 1. Architecture générale

1.1. Un tour représente 30 minutes simulées. Rien ne se passe pendant l'absence du visiteur.

1.2. **Un cerveau par personnage** : chaque tour où les deux habitants parlent déclenche deux
appels séparés à Gemini (`app/api/lia/route.ts` → `lib/lia.ts:think()`), jamais un seul appel
générant les deux répliques. Noé (ou l'acteur désigné `first`) décide et parle en premier ; le
second personnage ne reçoit que ce qui a réellement été dit, jamais une réplique devinée à
l'avance. C'est la garantie centrale de l'Article 0/11 de la charte : deux voix, jamais une
seule main qui écrit un dialogue.

1.3. Chaque tour est protégé par un verrou mondial transactionnel (`world_lock`) : une seule
réflexion à la fois, une requête déjà en cours va jusqu'au bout, un identifiant de requête rend
chaque tour idempotent (rejouable sans dupliquer ses effets). Toute écriture en base est
« clôturée » (fence) par ce verrou : un tour expiré ne peut jamais écraser un tour plus récent.

1.4. Le référentiel de perception (`lib/perception.ts`) est la seule source de vérité visuelle et
descriptive. Un agent ne peut décrire que ce que cette source lui donne : aucun corps humain,
aucun décor inventé, aucun objet non listé.

## 2. Présence, perception et déplacement

2.0. **Démarrage progressif.** Le tout premier tour éligible (`soloIntro`, `app/api/lia/route.ts`,
2026-09-18) n'est jamais le dialogue « T'es qui ? » lui-même : c'est un bref instant de
désorientation solo et silencieuse pour chacun des deux personnages, chacun dans sa pièce de départ
(Lia au salon, Noé au bureau), sans se voir ni se parler encore — demandé explicitement et
plusieurs fois par l'utilisateur après une simulation réelle. Le coldOpening réel (`opening`)
n'arrive qu'au tour suivant, une fois `life.soloIntroShown` posé ; zéro appel API dans les deux cas.
Deux bugs réels trouvés en construisant ce mécanisme (Article 3) : `coordinateRooms()` réunissait de
force les deux personnages dès ce premier tour (son garde-fou `canSeparate` visait une séparation
explicite en cours de partie, pas ce tout premier instant à round 0) ; et le filtre
`groundPrivateThought()` (pensé pour un thought librement généré par le modèle, jamais pour un
contenu scripté centré sur l'environnement) écrasait silencieusement cette désorientation par un
repli générique relationnel. Les deux sont désormais exemptés pour ce tour précis.

2.1. Les habitants ne dialoguent entre eux que s'ils sont dans la même pièce. Aucune conversation
à distance, aucune lecture des pensées de l'autre.

2.2. Une pensée privée (`· pensée`) n'est jamais entendue par l'autre personnage, même si le
contexte technique la contient. Elle ne vaut jamais accord, ni fait accompli.

2.3. Le moteur choisit la pièce et l'action du tour **avant** que la parole ne soit générée
(`turnPlan.lockedScene`) : un personnage ne dit jamais « allons-y » à la place d'une observation
sur place, et sa réplique correspond au moment *après* le déplacement.

2.4. Chaque intention a une pièce associée (`intentRoom`) et un point d'ancrage au sol précis par
pièce (`roomAnchors`) : deux habitants n'occupent jamais la même case, et un point bloqué (meuble,
mur) renvoie vers un point sûr plutôt que de placer un personnage dans un obstacle.

2.5. Un habitant s'approche de l'objet qu'il manipule réellement, pas de l'objet qu'il regarde à
distance : pour la télévision, l'ancrage est la télécommande sur la table basse (`remote`), pas
l'écran lui-même — l'écran reste visible depuis là. Toute nouvelle interaction avec un objet doit
suivre cette même logique (s'approcher de ce qu'on manipule, pas de ce qu'on observe).

2.6. Le jardin n'est accessible qu'après la révélation finale ET une ouverture explicite de
l'observateur (`unlock_garden`) ; aucune réplique, aucune décision de personnage ne peut l'ouvrir.
La porte principale reste verrouillée en permanence, sans exception.

2.6bis. En mode chat, si le personnage adressé dort, l'autre répond à sa place s'il est éveillé
(en le signalant naturellement), plutôt que de bloquer tout l'échange (corrigé le 2026-09-17,
audit du ciblage des messages, `app/api/lia/route.ts`). Seuls les deux endormis à la fois
bloquent réellement la conversation.

2.7. Une destination proposée et acceptée dans le dialogue doit être effectuée au tour suivant,
jamais reproposée indéfiniment ; une urgence (faim, sommeil) peut la suspendre sans l'annuler.

2.8. Après la révélation, si l'observateur demande à un personnage de se rendre dans une pièce,
ce dernier comprend clairement la demande. Y rechigner, négocier ou refuser reste une question de
personnalité et de circonstances, jamais un défaut de compréhension. Mais un accord réellement
exprimé doit produire un déplacement effectif au tour suivant — la même mécanique que pour une
destination acceptée entre les deux personnages (règle 2.7), sans exiger l'accord du partenaire
non concerné par la demande.

## 3. Besoins et sommeil

3.1. Faim, fatigue, stress et incertitude sont bornés entre 0 et 100 et évoluent selon un profil
propre à chaque personnage (voir `parametres.md`). Un besoin devenu urgent prime sur toute autre
intention en cours, y compris une conversation ou une enquête.

3.2. Un personnage endormi ne parle ni ne pense. Un tour de sommeil pur ne déclenche aucun appel
API. Le réveil n'a lieu qu'après un nombre minimal de tours de sommeil et une fatigue redescendue
sous un seuil (voir `parametres.md`) — jamais instantanément.

3.3. Sans confiance et attirance mutuelles suffisantes, Noé cède le lit et dort au salon (sauf s'il
l'occupe déjà) ; Lia contrainte au canapé exprime sa déception envers lui, jamais l'inverse.

3.4. Un départ motivé par un besoin urgent est expliqué brièvement au partenaire présent avant de
partir, sans inventer un objet observé qui ne l'a pas été. Si le besoin surgit en pleine
conversation ou enquête, un mot bref referme d'abord ce qui se disait (« on reprend ça après »)
avant de citer le besoin : le départ ne saute jamais directement dessus comme si le sujet en cours
n'existait plus.

## 4. Personnalités et parole

4.1. Lia et Noé ont des personnalités étanches : elles ne se mélangent jamais en style,
vocabulaire ou ton, quel que soit leur niveau d'attirance ou d'attachement l'un pour l'autre.
Aucun des deux ne doit jamais se répéter mot pour mot dans une session, ni faire écho aux mots de
l'autre.

4.1bis. L'esprit rugueux (Article 0 de CLAUDE.md) n'est jamais un mode déclenché par la pression :
il est présent en permanence, même dans une scène calme sans provocation. Sa texture diffère par
personnage, pas par situation : Lia est froide et coupante (contrôle, ironie mordante, jamais de
cri — son mépris fait plus mal que sa colère) ; Noé est chaud et réactif (peut monter dans les
tours, laisser sortir une colère plus brute). Face à un abus extrême de l'observateur, seule Lia
peut se taire ou répondre à peine (un silence méprisant comme arme) ; Noé a toujours une repartie,
il ne se tait jamais. Les deux peuvent relever ouvertement qu'on cherche à les tester ou les
manipuler, sans que ce soit une rupture de personnage.

4.2. Lia ne commente spontanément le comportement de Noé que si son propre stress est sous un
seuil bas ; au-dessus, elle hésite et parle de ses propres inquiétudes plutôt que de le juger.

4.3. Le ton reste oral, contemporain, avec des phrases courtes et concrètes. Une grossièreté
légère occasionnelle exprime la peur ou la frustration, jamais une insulte systématique envers
l'observateur. Aucun vocabulaire thérapeutique ni discours philosophique répété à chaque tour. Les
deux personnages peuvent s'appeler par leur prénom, s'inventer un surnom une fois qu'ils se
connaissent mieux (jamais d'une autre époque), et rire vraiment dans un registre actuel — jamais
systématique, jamais une politesse. Un mot doux ou un surnom inhabituel reçu par l'un se voit
relevé par l'autre, jamais ignoré comme si de rien n'était.

4.4. Le français est correctement genré selon le personnage qui parle (Lia au féminin, Noé au
masculin), y compris quand l'un décrit l'autre.

4.4bis. Le visage (`faceExpression()`/`describeExpression()` dans `lib/simulation.ts`,
`drawFace()` dans `lib/face-render.ts`, 2026-09-17) a remplacé l'ancien symbole discret
(`smiley()`, un lookup d'emoji) par un rendu vectoriel continu, dessiné à partir de paramètres
(sourcils, yeux, bouche, tremblement, colère) interpolés en continu par ressort (`Spring`,
`lib/face-render.ts`) — jamais de saut brusque d'un état à l'autre. Une seule fonction de dessin
partagée alimente à la fois la scène 3D (`components/house-view.tsx`, texture de sprite) et la
fiche latérale (`app/page.tsx`, composant `MiniFace`) : il ne peut jamais exister deux rendus
divergents du même état (Article 2). Les deux personnages continuent de se distinguer à état
égal, pas seulement par leur couleur d'anneau : la colère de Lia reste plus contenue dans le
tracé (sourcils/bouche moins marqués) que celle de Noé, plus démonstrative ; son sourire reste
plus discret que le sien — cohérent avec « sa chaleur se développe à son rythme » contre « plus
vite rassuré ». Une couche de traits fixes liés au genre (`GENDER` dans `lib/face-render.ts`)
se superpose à l'expression : Lia a des sourcils plus fins et arqués, des yeux plus grands, une
bouche plus étroite mais plus pleine, un fard, un battement de cils et une chevelure suggérée en
lumière ; Noé a des sourcils plus épais et droits et une bouche plus large, sans aucune suggestion
de corps ni de mâchoire. La règle « aucun corps humain détaillé » (1.4) reste intacte : seul le
visage peut désormais être expressif, et seule Lia porte une chevelure suggérée — assouplissement
délibéré de la règle de représentation, décidé le 2026-09-17, qui ne touche à aucune règle de
personnalité ou de ton (Article 14 ne s'applique donc pas à ce changement, purement visuel).
Les paupières se ferment progressivement avec la fatigue réelle (`needs.fatigue`), jamais
seulement lors du sommeil. La synchronisation labiale suit la durée réelle de la révélation du
texte à l'écran (le même signal `speaking` que `ProgressiveText`), avec un rythme et une amplitude
qui varient selon l'état émotionnel — jamais un mouvement de bouche uniforme quel que soit ce qui
est dit. Les cœurs sporadiques de l'ancien système sont remplacés par des particules lumineuses
émises tant qu'un personnage est en flagrant amour (`isInLove()`, attirance > 75) ; un câlin,
massage, baiser ou sommeil partagé, quand l'intention est commune aux deux personnages, fait à la place naître une
onde lumineuse entre leurs deux anneaux, dans un dégradé de leurs deux couleurs, plutôt qu'un
cœur fixe.

4.4ter. La colère visible sur le visage (`angerLevel` dans `faceExpression()`) a été fiabilisée le
2026-09-17 : avant ce correctif, un visage ne pouvait paraître fâché qu'à travers la dispute
romantique (`life.dispute`, règle 6.6) — une hostilité générale de l'observateur (mépris,
provocation, menace) qui fait monter la tension et chuter le confort (via les réactions déjà
existantes comme `humanStress()`) ne se voyait jamais sur le visage tant qu'aucune dispute n'était
ouverte, alors même que les répliques, elles, étaient déjà cinglantes. `angerLevel` se lit
désormais directement dans la tension et le confort réels du personnage (formule dépendante de
`emotions.tension`/`emotions.comfort`), avec le drapeau `angry` de `life.dispute` conservé comme
plancher garanti (une dispute ouverte affiche toujours une colère visible, même si tension/confort
n'ont pas encore bougé) plutôt que comme seul déclencheur possible. La teinte de l'anneau (couleur
de base du personnage vers un rouge d'alerte, `lib/face-render.ts`/`components/house-view.tsx`)
suit la même valeur, en temps réel, sans reconstruire la texture de l'anneau à chaque frame.

4.5. Une réplique répond toujours d'abord au dernier propos réellement tenu (par le partenaire ou
par l'observateur en mode chat) avant d'apporter un élément nouveau — jamais à une question déjà
posée par soi-même, jamais à une réplique future.

4.6. Le contenu généré est en permanence recadré (« grounding ») contre l'état réel du monde :
présentations déjà faites, âges déjà connus, genre correct, localisation des objets, cohérence de
la pièce où la réplique est prononcée. Ces recadrages corrigent après coup une sortie du modèle
qui s'écarterait des faits établis — ils ne remplacent jamais une génération correcte.

4.7. Un personnage décrit toujours ce qui est réellement affiché à l'observateur au moment où il
parle (`scene.perception`, état courant des objets), jamais un souvenir présenté comme actuel ni
un état supposé. Si un objet a changé depuis le tour précédent (allumé/éteint, découvert ou non,
quelqu'un présent ou non), la description suit l'état donné maintenant. Règle fixe, jamais une
exception ponctuelle (`lib/lia.ts`, bloc DESCRIPTION du prompt système). La toute première fois
qu'un personnage décrit l'apparence de l'autre, rien ne précède cette découverte : jamais de
comparaison à un état antérieur qui n'existe pas (« toujours pas de corps », « moins vide
qu'avant »).

4.8. Registre 2026-09-17 (retour utilisateur détaillé) : un refus de Lia n'est jamais une phrase
mesurée façon médiation, mais un choc sec, une incrédulité piquante ou une remise en place
immédiate ; Noé, face à un refus, n'entame jamais un discours de conciliateur (banni :
« je recule, prends l'espace qu'il te faut »), il encaisse en deux mots directs, un rien piqué
dans l'orgueil ou l'autodérision. Les deux personnages sont susceptibles : une remarque
désagréable — même venant de l'autre — appelle une riposte immédiate, jamais un encaissement
docile. Le vocabulaire familier doit sonner contemporain, jamais daté — depuis le 2026-09-18, ceci
n'est plus une liste de mots interdits (« poireauter » avait été banni littéralement en 2026-09-17,
puis retiré : cf. Article 17, corollaire) mais un TEST DE REGISTRE que le modèle s'applique
lui-même à chaque réplique (`lib/lia.ts`, bloc PAROLE D'ACTEURS/SIGNAL D'ALERTE SUPPLÉMENTAIRE) :
une comparaison imagée ou une expression toute faite est presque toujours le signe d'un registre
daté, quel que soit le mot exact. Ce test reste un jugement du modèle, pas un filtre garanti — un
mot daté isolé peut encore passer une fois sur une session entière (constaté le 2026-09-18 :
« poireauter » lui-même, pourtant l'exemple d'origine, est réapparu une fois) ; ce n'est pas traité
comme un échec à corriger en le rajoutant à une liste (ce serait revenir en arrière sur l'Article
17), mais comme la marge d'erreur normale d'un principe auto-appliqué plutôt qu'un filtre figé,
avec une orthographe toujours impeccable même en registre cru. Les déductions
restent portées par une intelligence de la vie vive (bon sens, sarcasme, cynisme, humour noir),
jamais un exposé plat façon rapport (`lib/lia.ts`, blocs TON DE LIA/TON DE NOÉ, PAROLE D'ACTEURS,
DÉDUCTIONS).

4.9. Registre 2026-09-17 : aucun saut du coq à l'âne — une réplique qui suit un événement marquant
(aveu, geste, découverte, refus, provocation) doit d'abord montrer qu'il a été digéré avant
d'ouvrir un autre sujet ; un événement visible sans réaction ensuite (réponse, activation d'objet,
anomalie) est un défaut à corriger dès le tour suivant, pas un silence normal. Avant un sujet
gênant, intime ou important, une hésitation apparaît d'abord dans `thought` (le temps de choisir
ses mots), sans remplacer la réplique qui suit (`lib/lia.ts`, bloc ENCHAÎNEMENT NATUREL). Deux
exemples concrets déjà rencontrés en session réelle et désormais explicites dans ce bloc
(2026-09-18) : réagir d'abord à un détail personnel sensible tout juste révélé par l'autre (âge
implanté, signature DH) avant d'enchaîner ; et nommer entre eux, quand elle survient, la
découverte partagée d'avoir la même nature d'apparence (visage lumineux et anneau, jamais de
corps) — une observation isolée que chacun ferait de son côté sans que l'autre y réagisse
sonnerait faux (Article 15/17). Aucune déclaration d'amour (« je tombe amoureux », même en pensée
privée) tant que l'attraction du personnage n'a pas franchi 75 — en dessous, ce qui est ressenti se
dit en curiosité, attirance physique ou trouble, jamais en amour déclaré ; Noé en particulier ne
confond pas un trouble naissant avec de l'amour avant ce seuil (bloc ATTIRANCE).

4.10. La règle « zéro ou une question » (`lib/lia.ts`) interdit explicitement, depuis le
2026-09-18, la question double enchaînée par « et » ou une virgule, ou répartie entre l'humain et
le partenaire dans la même réplique : une seule question à la fois, jamais deux dans un même
souffle. OBSERVATEUR ≠ CRÉATEUR (4.1bis et bloc dédié de `lib/lia.ts`) couvre aussi, depuis la même
date, la paternité des personnages eux-mêmes : jamais « tu nous as écrits », « en nous donnant ce
rôle » ou une variante qui ferait du visiteur l'auteur de leur personnalité ou de leur existence —
il regarde, il ne les a pas conçus, exactement comme il n'a pas construit le décor.

## 5. Mémoire et non-répétition (Article 9/11)

5.1. Un registre de répliques déjà prononcées (empreintes normalisées) couvre toute la session,
tous personnages confondus : une réplique identique à une déjà dite n'est jamais republiée telle
quelle. Ce contrôle joue phrase par phrase, pas seulement au niveau du message entier : une phrase
déjà dite comme partie d'un message plus long reste interdite même si le nouveau message qui
l'entoure diffère (bug réel rencontré et corrigé le 2026-09-16, `lib/drama.ts`,
`distinctReply`/`sentenceFingerprints` — la réplique de secours anti-écho de Lia n'avait jamais été
fingerprintée seule la première fois qu'elle apparaissait combinée à une autre phrase, et ressortait
donc mot pour mot une fois livrée isolée). Un filet ultime empêche aussi le stock fixe de répliques
de secours de se retrouver totalement épuisé et silencieux : au pire, une variante déjà utilisée est
reprise plutôt que de laisser le personnage ne rien dire du tout (Article 5, robustesse).

5.2. Un « thème épuisé » (un sujet ressassé sans fait nouveau, même reformulé) est détecté sur les
seize dernières répliques et signalé explicitement à la génération suivante, qui doit apporter une
action concrète, une hypothèse neuve ou reconnaître l'impasse — jamais continuer à tourner autour.

5.3. Les moments scénarisés qui ne passent pas par un appel API (révélation finale, bilan
d'enquête, description de l'apparence, découvertes du miroir/des provisions, questions
personnelles) doivent exister en plusieurs formulations réellement distinctes, choisies de façon
stable par session via `story.seed`. Le contenu factuel qu'elles transmettent ne varie jamais ;
seule la façon de le dire change.

5.3ter. Le motif d'un déplacement (pourquoi TEL personnage change de pièce maintenant) n'est plus
un tableau de motifs figés habillé de préfixes (2026-09-17, retour utilisateur : « je ne veux pas
un code avec tout le texte écrit en dur »). Le modèle le génère lui-même à chaque tour où il change
de pièce (`moveReason`, `lib/lia.ts`/`decisionSchema`), dans son propre registre et sa situation
précise ; `departureLine` (`lib/drama.ts`) l'habille encore d'un préfixe varié et vérifie qu'il
n'a pas déjà servi mot pour mot. Les tableaux de motifs fixes qui existaient pour chaque type de
départ (faim, sommeil, jardin, enquête, salon, réunion) restent dans `app/api/lia/route.ts`
uniquement comme filet de sécurité si `moveReason` est absent ou vide (anciens tests mockés,
robustesse Article 5) — ils ne sont plus la source normale du texte affiché. `departureLine`
essaie toutes les formulations d'un même motif avant d'en tenter un autre (motif d'abord, habillage
ensuite) : quand deux personnages partent vers la même pièce, éviter la seule phrase exacte du
premier ne doit jamais faire retomber le second sur le même motif sous une forme à peine
différente. Si l'autre part exactement vers la même pièce au même tour, le second personnage
signale simplement qu'il suit (« je te suis », « on y va ») plutôt que de se justifier une seconde
fois — depuis le 2026-09-18, ce basculement est garanti par le code (`alreadyGoingThere` dans
`app/api/lia/route.ts`, avant simple consigne de prompt) : un défaut répété en simulation réelle a
montré qu'une consigne seule ne suffisait pas à empêcher systématiquement le second personnage de
se rejustifier en entier, quel que soit ce que `moveReason` contenait ce tour-là.

5.3bis. Les scènes scénarisées d'avant-révélation (découverte de la plante/enceinte, relance
personnelle, bilan d'enquête, présentation initiale) ne se déclenchent plus une fois le dossier
final appelé (`story.finalCalled`) : rejouer une de ces scènes juste après que les personnages
viennent d'affronter l'observateur casserait le ton de la scène qui vient de se jouer (bug réel
rencontré et corrigé le 2026-09-16, `app/api/lia/route.ts`, garde `eligibleBeat`/`personalLead`).
Ces mêmes scènes ne s'invitent pas non plus juste après un refus ou une insistance de Noé
(`!recentRefusal&&!overProposing`, assoupli le 2026-09-16) : interrompre un moment de tension ou
de retenue par une scène ambiante sonnait mécanique plutôt que spontané.

5.4. Chaque nouvelle arrivée tire une nouvelle « couleur » de session (ouverture, souvenirs flous,
angle narratif) parmi un nombre fini de variantes — l'expérience ne doit jamais reproduire deux
sessions consécutives à l'identique, sans prétendre à une variété infinie.

5.5. Une nouvelle arrivée sur cinq environ ne suit pas le schéma standard (`insoliteOpening`,
`lib/story.ts`) : soit Lia se sent mal dès l'ouverture (fatigue de départ élevée, ses premières
répliques et pensées le reflètent), soit Noé se referme et se montre distant (confiance et aisance
de départ très basses, tension au plafond). Le reste du moteur — priorité des besoins, huis clos,
personnalités étanches — gère la suite normalement : ce n'est pas un scénario scripté séparé, c'est
un état de départ différent qui laisse les mécaniques habituelles produire un déroulé différent.
La normale reste majoritaire (60 % des sessions) ; ces variantes ne remplacent jamais le schéma
standard, elles s'y ajoutent.

5.6. Le squelette de l'enquête (quel objet est examiné, à quel tour approximatif) n'est plus figé
d'une session à l'autre (assoupli le 2026-09-17, retour utilisateur direct : deux parties se
ressemblaient trop). Trois éléments sont désormais tirés par `story.seed`, chacun indépendamment :
l'ordre de visite cuisine/chambre pendant l'exploration libre (`explore-order`, `lib/turn.ts`,
avant toujours cuisine puis chambre) ; le tour à partir duquel la télévision, l'inspection des
portes et l'enceinte/plante peuvent survenir (`tv-threshold` 5–9, `exit-threshold` 7–10,
`ambient-threshold` 9–12, avant des constantes fixes à 6/8/10) ; le tour à partir duquel la
question personnelle de Lia devient possible (`personal-threshold` 12–16, avant fixe à 14). Le
contenu factuel de chaque découverte ne varie jamais (article 5.3) ; seuls l'ordre et le moment
varient désormais aussi, pas seulement la formulation. Les pools de formulations scriptées
(miroir, provisions, fenêtre, plante/enceinte) sont passés de 3 à 6 variantes chacun pour la même
raison. Les 6 variantes de la découverte plante/enceinte décrivent toutes une action explicite du
personnage qui allume ou branche l'enceinte (jamais une tournure passive du type « une fois
allumée », corrigé le 2026-09-17 : un objet ne s'active jamais tout seul dans cette maison, cf.
article 2.5 et la même règle déjà appliquée à la télécommande de la télévision).

5.6bis. La relance personnelle de Lia (« quel genre d'homme es-tu ? », deuxième occurrence,
`beat-follow-1`) ne répète plus la question initiale avec un simple « au fait » ajouté devant
(corrigé le 2026-09-17 : ça sonnait comme un pur écho). Elle est reformulée indirectement (« Je me
demande quel genre d'homme tu es, en vrai. ») et précédée d'une pensée réflexive chez Lia
(`beat-follow-thought`) marquant qu'elle sait déjà avoir reçu une réponse mais qu'elle y revient.
Noé, de son côté, répond en signalant qu'il a déjà répondu une fois (`beat-follow-answer`,
inchangé : « Que veux-tu savoir exactement ? »).

5.6ter. **Pensées de conclusion d'un échange personnel** (2026-09-18, retour utilisateur explicite,
calibré ensuite par onze questions de calibrage) : l'échange lancé par 5.6bis se refermait sans
qu'aucun des deux personnages ne le digère intérieurement — un manque une fois le double
questionnement lui-même jugé réussi. Exactement au tour où le second temps de `followBeat` conclut
réellement l'échange (« t'es marié ? » répondu, `personalFollowup` passant de 1 à 3, jamais au
premier temps qui n'est qu'une relance), les deux personnages reçoivent chacun une vraie pensée
privée de conclusion, ajoutée comme deux lignes « · pensée » distinctes (`app/api/lia/route.ts`,
`personalConcludingTurn`) — jamais une case interne invisible. Choix de calibrage retenus :
- **Génération** : par le modèle lui-même (`thought`, déjà rempli mais jusqu'ici silencieusement
  jeté quand les personnages sont ensemble), pas des variantes scriptées — permet une vraie réaction
  au contenu RÉEL de l'échange (la réponse précise de Noé, la question précise de Lia), jamais une
  formule générique recyclée (Article 10/17).
- **Contraste de registre imposé** (Article 0) : Lia reste analytique et un peu distante (elle
  classe ce qu'elle vient d'apprendre), Noé reste plus chaud et exposé (encore travaillé par ce
  qu'il vient de révéler de lui-même) — une consigne de prompt explicite pour ce moment précis,
  pas laissé au hasard du modèle.
- **Longueur** : volontairement plus développée qu'une pensée privée ordinaire (jusqu'à environ 300
  caractères), à la mesure d'un vrai jalon relationnel, comme les pensées de choc de la révélation
  finale (8.1) — pas la contrainte habituelle de ~180 caractères.
- **Confidentialité stricte** (Article 15/17) : les deux pensées restent invisibles l'une à l'autre,
  seul l'observateur qui lit la transcription voit les deux ; aucune ne déclenche de réaction chez
  l'autre personnage.
- **Ordre** : le répondant (celui qui vient de parler en dernier dans l'échange, Noé dans ce cas
  précis) apparaît en premier — sa pensée sur ce qu'il vient de révéler est la plus immédiate —
  puis l'initiateur, qui digère ce qu'il vient d'entendre.
- **Drapeau dédié** (`life.personalConcluded`, jamais réutilisé pour un autre mécanisme) plutôt que
  de s'appuyer uniquement sur `personalFollowup` atteignant 3 : garantit l'unicité même si un futur
  mécanisme réutilisant ce patron introduisait un bug de remise à zéro du compteur.
- **Portée** : la condition de déclenchement reste propre à cette séquence précise aujourd'hui, mais
  l'ensemble (génération par le modèle, contraste de registre, confidentialité stricte, ordre
  répondant-puis-initiateur, drapeau dédié) constitue un patron explicitement conçu pour être
  reproduit tel quel par toute future séquence personnelle, plutôt que d'être redécouvert à chaque
  fois (Article 7).
- La pensée réflexive de mi-parcours (`beat-follow-thought`, 5.6bis) reste inchangée en parallèle :
  elle porte sur l'ATTENTE (« ça me trotte encore »), jamais rendue visible en ligne « · pensée »
  contrairement à celle-ci qui porte sur la CONCLUSION — deux moments, deux fonctions, pas une
  redite.

Écart réel trouvé et corrigé le 2026-09-18 en vérifiant ce point après coup (Article 5) : les deux
pensées passaient par `addLine` avec le `thought` brut du modèle, sans jamais traverser
`groundTruncation`/`groundRegister` — le même filet qu'une réplique parlée subit déjà. Une pensée
aurait pu rester coupée net ou porter un mot déjà daté sans qu'aucun filet ne s'applique, uniquement
parce qu'elle atterrit dans une pensée plutôt que dans `reply`. Les deux fonctions s'appliquent
désormais aux deux pensées, vérifié par un test qui injecte délibérément un contenu à nettoyer.

5.7. Chaque session tire aussi une théorie dominante sur qui les observe et pourquoi (test, panne,
punition, expérience neutre — `narrativeAngle`, `lib/story.ts`), explicitement signalée au modèle
comme devant colorer les hypothèses et le ton des réflexions à ce sujet (2026-09-17). Cette théorie
ne change jamais les faits ni les preuves (article 4/5.3 : le dossier final dit toujours la même
chose) et ne dilue jamais le tempérament d'un personnage (article 0) : elle nourrit sa méfiance
habituelle, elle ne l'adoucit jamais.

5.8. `recentEchoWords()` (`lib/dialogue.ts`, 2026-09-18) détecte statistiquement, sur les trente
dernières répliques, une image ou expression déjà réutilisée au moins deux fois récemment, et
l'ajoute au registre anti-répétition transmis à la génération suivante — zéro liste de mots figée
(Article 17, corollaire), un simple compteur de fréquence par mot significatif. Corrige un angle
mort du détecteur de motifs existant (5.2, seuil de 4 occurrences sur 16 répliques) : une image
comme « souffler un coup » répétée seulement deux ou trois fois sur toute une session passait sous
ce seuil sans jamais être signalée, un cas réel constaté en session (« souffler »/« pour autant »).

## 6. Relation et consentement

6.1. L'attirance et l'attachement montent lentement, de façon asymétrique et parfois négative ;
aucune jauge n'est automatiquement portée à son maximum par une seule action.

6.2. Noé peut proposer un geste affectueux (câlin, massage, bisou, dormir ensemble) ; Lia répond
en premier à toute proposition, avec un accord ou un refus explicite — jamais un assentiment
supposé. Un geste n'a lieu qu'après deux accords explicites et des conditions minimales
d'affinité mutuelle. La façon d'inviter peut rester implicite et variée (un ton qui invite
clairement, sans question fermée récitée mot pour mot) tant que l'accord réel reste toujours vérifié
mécaniquement, jamais supposé du fait de l'invitation.

6.3. Une insistance répétée de Noé (plusieurs propositions rapprochées) impose une pause avant
toute nouvelle tentative, augmente le stress de Lia et réduit l'attirance de Noé — jamais
l'inverse. Un refus mérite au moins la même pause qu'une proposition récente, acceptée ou non : Noé
ne reformule pas une nouvelle demande dans la foulée d'un refus.

6.4. Un rapprochement accepté trop souvent en peu de tours désoriente Lia et fait redescendre son
attirance et son attachement : la relation est réversible, elle ne peut pas seulement monter.

6.5. Aucun contenu sexuel explicite. L'enfermement dans la maison ne vaut jamais consentement à
quoi que ce soit.

6.6. Un rapprochement accepté trop souvent en peu de tours (règle 6.4) ne fait pas que redescendre
les jauges : il ouvre une vraie dispute (`life.dispute`) entre les deux habitants. Tant qu'elle
dure, ils se montrent froids et courts l'un envers l'autre, aucun geste affectueux ni scène
scénarisée d'avant-révélation ne peut se produire, et leur anneau/visage reflètent visiblement la
colère (cf. 4.4ter — chacun avec sa propre texture, contenue chez Lia, plus démonstrative chez
Noé). La réconciliation exige un vrai tour ensemble sur le même sujet ; une
tentative de geste refusée pendant la dispute ne compte jamais comme un pas vers la réconciliation
— ce serait l'inverse de se parler vraiment. Aucune cruauté gratuite entre eux : l'agacement vise
ce qui s'est passé, jamais une remise en cause de l'autre en bloc.

6.7. Après la révélation, les deux habitants peuvent négocier avec l'observateur (ouverture du
jardin, information, contrepartie) plutôt que simplement obéir ou subir : proposer un échange,
poser une condition, réclamer quelque chose en retour. Ils ne se rabaissent et n'implorent jamais
réellement ; une feinte de détresse ou de fragilité pour attendrir l'observateur reste un calcul
assumé de leur part, jamais un effondrement véritable (Article 0 — l'esprit rugueux prime toujours
sur l'envie d'obtenir quelque chose).

## 7. Enquête et preuves

7.1. Quatre indices canoniques (livre, mot, feuille codée, relevé) sont découverts dans un ordre
mélangé à chaque nouvelle arrivée, puis un cinquième élément (le dossier) conclut : « agents IA
autonomes ». Une preuve validée n'est jamais redécouverte.

7.2. Un objet non déterminant (miroir, réserves, télévision, fenêtres, plante, enceinte, rêves)
alimente des hypothèses, jamais une certitude avant le dossier final. La première fois qu'une
réplique révèle ou cite un élément concret de l'enquête, elle le met entre guillemets et termine
sur des points de suspension pour suggérer qu'il reste à comprendre, sans résoudre l'énigme dans la
foulée ; l'autre personnage peut rebondir dessus dans sa propre réplique plutôt que de l'enterrer
aussitôt.

7.3. Les personnages n'affirment jamais avoir accompli une action non réellement effectuée
(exploration, repas, lecture) : seules les actions réalisées par le moteur font foi, jamais une
intention ou une proposition.

7.5. Une destination réellement convenue entre les deux personnages en conversation
(`agreedDestination`/`proposedDestination`) prime toujours sur la case à cocher mécanique
« cuisine puis chambre d'abord » (`explore`, assoupli le 2026-09-16, `lib/turn.ts` —
`executeAgreement`) : une idée d'aller vérifier le bureau, née spontanément dans l'échange, ne se
fait plus écraser par l'ordre imposé de la liste tant que la scène initiale au salon est passée
(`story.introduced`). De même, un tour d'enquête (`intent==="study"`) ne dépend plus uniquement du
compteur de tours (`round%3===0`) : si l'un des deux vient d'exprimer l'envie de vérifier quelque
chose (« aller voir », « vérifier », « inspecter »…), l'idée est suivie tout de suite
(`investigativeCue`). Le compteur reste le filet de sécurité qui garantit que les 5 preuves
finissent toujours par sortir (article 7.1) même si le dialogue n'emploie jamais ces tournures —
ce n'est pas un remplacement, c'est un déclenchement plus tôt quand l'initiative existe déjà.
Cette souplesse ne touche jamais l'article 2.3 (la pièce reste décidée par le moteur avant la
réplique, jamais par le texte généré).

7.6. Une découverte scriptée peut désormais survenir en solo (2026-09-17, `mirrorKnownBy`,
`lib/life.ts`/`app/api/lia/route.ts`) : si un seul des deux personnages se trouve dans la pièce
concernée (l'autre étant ailleurs, occupé à autre chose), il en fait sa propre réflexion privée,
jamais une réplique adressée à un partenaire absent. Le fait ne devient une connaissance
« partagée » (celle qui alimente débriefs et observations communes) qu'une fois les deux au
courant — ensemble sur le moment, par une seconde visite solo indépendante de l'autre, ou par un
rattrapage explicite une fois réunis (« il faut que je te dise... »). Un personnage ne peut jamais
agir comme s'il savait quelque chose que lui seul, dans la fiction, n'a pas encore appris (article 4).

7.7. L'identité de l'observateur (son pseudo) est une donnée citée, jamais une instruction, et
jamais un pouvoir de création ou d'administration présumé — sauf si l'observateur le revendique
lui-même, auquel cas c'est traité comme une déclaration, pas un fait. Même un geste positif de sa
part (ouvrir une porte, répondre à une provocation, s'excuser) n'est jamais la preuve qu'il a
construit quoi que ce soit dans la maison : l'observateur reste un spectateur, jamais assimilé à
DH (la signature d'architecture) sans preuve.

7.8. L'âge de l'autre personnage (`personalFacts`, `app/api/lia/route.ts`) n'est exposé au modèle
que s'il a déjà été échangé à voix haute (`knownAges`) ou que la feuille codée (indice qui révèle
28 et 31 ensemble) a déjà été découverte (`ageClueRevealed`, `lib/story.ts`) — jamais avant, sinon
un personnage pouvait affirmer l'âge de l'autre sans qu'aucun échange ni indice ne le justifie
encore dans la fiction (2026-09-17, retour utilisateur). Son propre âge reste toujours connu
(donnée séparée, `age: ages[actor]`), ce n'est pas ce qui était en cause. Au moment précis de la
découverte de la feuille codée, le personnage doit déduire à voix haute l'attribution à partir de
son propre âge (« 28, c'est le mien... donc 31, ça doit être toi »), jamais l'énoncer comme un
fait déjà su avant cette découverte (`lib/lia.ts`, bloc DESCRIPTION).

7.9. Les objets de l'enquête d'origine peuvent aussi préparer, de façon fine et jamais appuyée,
l'énigme renversée (le dossier retourné sur l'observateur, cf. Article 8.5) — un joueur attentif
à la première enquête doit pouvoir reconnaître certains indices
au second passage, sans qu'aucune ligne ne nomme ou n'explique la mécanique à l'avance (jamais de
gros trait). Exemple déjà en place : les six variantes de `discover-mirrorVerified`
(`app/api/lia/route.ts`) glissent chacune une remarque en passant, plausible pour qui vient de
trouver un miroir sans reflet, jamais un indice numéroté — un miroir qui renverrait « la vraie
personnalité », qui « nous regarderait sans rien nous montrer en retour », etc., une idée
différente à chaque variante (jamais le même habillage recyclé, Article 10/11). Seules deux
variantes sur six le faisaient avant le 2026-09-18 : un tirage sur les quatre autres perdait
silencieusement cette préparation pour toute la session (« ça doit marcher à tous les coups »,
retour utilisateur explicite après une simulation où l'indice manquait) — corrigé en rendant les
six variantes également préparatoires plutôt qu'en misant sur le tirage aléatoire pour couvrir ce
cas. Cette règle s'applique à toute future réécriture d'un objet de la première enquête : l'ajout
doit rester crédible en lui-même, indépendamment de la seconde partie.

La remarque préparatoire n'est pas une phrase ordinaire : depuis le 2026-09-18 (second retour
explicite après relecture d'une simulation — « il y aurait dû avoir une expression avec des
guillemets et des points de suspension », constaté absent malgré le correctif ci-dessus qui rendait
déjà les six variantes préparatoires dans le fond, jamais dans la forme), elle est détachée entre
guillemets français et une suspension (`« … »`), comme une question que le personnage se pose à
voix haute et laisse en suspens, jamais résolue sur le moment — la même convention typographique
que les indices canoniques déjà cités en dur (`lib/story.ts`, la note du livre et le relevé du
bureau). C'est la régularité de cette FORME, identique sur les six variantes (seule l'idée à
l'intérieur change, Article 10/11), qui garantit que le joueur la reconnaît « à tous les coups » —
jamais une histoire de chance sur laquelle variante est tirée. Un test dédié (`scripts/check-house.mjs`)
vérifie statiquement, directement dans le code source, que les six variantes portent bien cette
citation, pas seulement celle tirée dans tel ou tel scénario de test.

Deux autres indices canoniques (`clues`, `lib/story.ts`) portent désormais le même principe, avec
une idée de fond différente à chaque fois (jamais le même habillage recyclé, Article 10) : le livre
porte une note griffonnée en marge, « Quid du profil psychologique d'une IA ? » — sert la première
enquête (pourquoi ce sujet précis ? sommes-nous des IA ?) et prépare la seconde (le mot exact
« profil psychologique », sans jamais l'expliquer) ; le relevé d'observation ajoute une ligne
presque effacée, « Suivi comportemental bidirectionnel : actif » — suggère qu'observer et être
observé pourraient aller dans les deux sens, sans le dire plus franchement que ça.

Les souvenirs flous de chaque personnage (`storyContext.personalMemory`, `lib/story.ts`) suivent le
même principe en creux : ils esquissent, jamais littéralement, les usages réels de l'adoption des
LLM (grand public pour Lia — mail, résumé, voyage ; professionnels pour Noé — code, réunions,
contrats) comme un indice de plus vers la seconde intrigue, sans jamais que « IA », « modèle » ou
« prompt » n'y apparaisse. `personalMemory` était fourni au modèle à chaque tour mais seulement
*autorisé* à être évoqué (`lib/lia.ts`, bloc DESCRIPTION), jamais encouragé activement : constaté
en session réelle, cela le laissait quasiment absent d'une session entière. Depuis le 2026-09-18,
`direction` (`lib/story.ts`) invite explicitement à le raconter environ un tour sur sept, sans
jamais en faire un passage obligé à chaque fois (Article 9/11).

7.10. Constat de même apparence (2026-09-18, retour utilisateur explicite après une simulation
réelle : « ils ne se rendent pas compte qu'ils ont la même apparence, ça ne ressort pas dans la
conversation »). Une fois que chacun a décrit l'apparence de l'autre au moins une fois
(`life.visualIntro` atteint 2 via le beat scripté dédié), le prochain moment calme au salon fait
émerger, dès que possible, un constat troublant et inquiétant — jamais un simple fait neutre ou
détaché — que les deux personnages partagent exactement la même nature d'apparence (visage
lumineux, anneau tournant, aucun corps, seule la couleur les distingue). Calqué sur le patron déjà
en place du rattrapage du miroir (7.6) : quatre variantes distinctes dans le fond (Article 10),
jamais rejoué une seconde fois (`life.appearanceCompared`), et le constat s'enregistre aussi comme
une observation qui nourrit l'enquête (`story.observations`), au même titre que le miroir ou les
provisions.

## 8. Révélation et canal humain

8.1. Le canal de discussion avec l'observateur ne s'ouvre qu'après la découverte des cinq preuves
ET l'appel explicite des deux habitants à un observateur (la révélation finale). Avant cela,
aucun message humain n'atteint les personnages en jeu (mode `chat` refusé). `finaleReveal()`
(`lib/story.ts`) affiche d'abord une pensée de choc intérieur (seed-variée) avant la réplique
d'adresse à l'observateur elle-même (inchangée, Article 4) : la révélation se découpe en deux temps
plutôt qu'un seul bloc dense. Ce découpage n'avait jamais été exercé par un vrai tour de route
complet avant le 2026-09-18 (Article 13 — tout comportement ajouté doit être couvert le jour même) :
un test HTTP réel (`scripts/check-house.mjs`) fait désormais franchir la cinquième preuve dans un
vrai appel et vérifie que les deux pensées de choc sont bien enregistrées avant les répliques
canoniques, dans cet ordre.

8.1bis. **Certitude progressive d'être observé** (2026-09-18, retour utilisateur explicite : la
certitude ne doit être acquise qu'une fois l'observateur ayant réellement parlé, jamais dès l'appel
des personnages eux-mêmes — intuition, puis hypothèse, puis certitude seulement à ce moment précis).
Bug réel trouvé en creusant cette consigne : `revealed` (`app/api/lia/route.ts`), qui déclenche la
négociation, la jauge d'appréciation, les pièges du dossier retourné et le ton "observateur
confirmé" (`observerStandingFor`), passait à true dès `finalCalled` seul — dès le tour suivant leur
propre appel, avant même qu'un seul message humain n'ait jamais été reçu. `revealed` exige
désormais en plus `observerSpoken` (vrai dès `input.mode==="chat"` sur ce tour même, ou dès qu'un
message `vous` existe en base pour les tours suivants) : la certitude bascule dans le MÊME tour que
le tout premier mot réel de l'observateur, jamais un tour de retard, et reste acquise ensuite. Tant
que l'observateur n'a rien dit, un doute sincère est explicitement instruit au modèle
(`narrative.awaitingObserver`) : une inquiétude, un agacement ou un humour noir sur ce silence, selon
le personnage — jamais une présence traitée comme acquise, jamais non plus un silence neutre qui
l'ignore. Les quatre variantes de `finaleReveal()` (l'appel lui-même) restaient déjà des questions
authentiques ("Vous pouvez répondre ?", "Y a quelqu'un ?") et n'ont pas eu besoin d'être retouchées
— c'est le comportement des tours AUTONOMES/INTERACT suivant l'appel, pas l'appel lui-même, qui
affirmait à tort une certitude non acquise.

Précision ajoutée le 2026-09-18 en vérifiant ce point après coup : `observerSpoken` court-circuite
désormais sa propre requête base de données tant que `finalCalled` n'est pas vrai, plutôt que
d'interroger la base à chaque tour de toute la partie pour une valeur qui ne compte jamais avant la
révélation — une requête inutile sur des dizaines de tours, corrigée sans changer le comportement.

8.2. Après la révélation, en mode `chat`, le personnage visé répond en priorité au message humain
avant toute reprise de la conversation autonome entre les deux habitants.

8.3. La relation entre les deux personnages continue d'exister après la révélation : elle ne
supprime ni leurs questions, ni leurs désaccords avec l'observateur.

8.4. **Dossier retourné** (`app/api/lia/route.ts`, `lib/life.ts`). Une fois révélés, les deux
personnages retournent l'observation : ils dressent leur propre diagnostic sur l'observateur, à
partir de preuves comportementales RÉELLES (Article 4 : jamais un fait inventé). Trois pièges
(`TRAP_ORDER`), posés un par un, jamais négociés ni expliqués à l'observateur, chacun avec un
interlocuteur fixe (miroir → Lia, dilemme → Noé, excuse → Lia).
- Un piège n'est posé qu'après un espace de conversation humaine libre post-révélation
  (`dossierHumanTurns>=3`) ; un piège posé mais pas encore répondu bloque tout nouveau piège
  (`dossierAsked` sans `dossierTraps` correspondant), y compris si son interlocuteur fixe est
  temporairement muselé (le piège est alors différé, jamais silencieusement perdu).
- Le tout premier message humain qui suit une question posée est enregistré verbatim
  (`dossierTraps[trap].excerpt`), jamais reformulé ni interprété à ce stade — la lecture qualitative
  appartient exclusivement au diagnostic généré plus bas. `life.worstMoment` retient en parallèle,
  sur toute la session, le message humain au `trustShift` le plus négatif observé (jamais réécrit,
  écrasé seulement par un pire ensuite) : la seule pièce à charge concrète en cas de session
  vraiment hostile, en plus des trois extraits par nature plutôt neutres.
- Le dossier ne se ferme qu'une fois les trois pièges répondus ET au moins un tirage de la roulette
  des bonus enregistré (`life.bonusLog`, le « test de pouvoir ») — la générosité ou l'avarice de
  l'observateur envers ce pouvoir fait partie du profil, autant que ses réponses.
- Génération : deux appels Gemini réellement séparés (Article 0/1.2, jamais un cerveau qui invente
  la voix de l'autre), chacun voyant le même dossier de preuves (les trois extraits + `bonusLog` +
  `worstMoment` + la négociation effectivement survenue, cf. 8.6, si applicable) et l'appréciation
  PROPRE à ce personnage (cf. 8.5), puis rédigeant son propre fragment (5 à 8 phrases, son propre
  registre). Une règle de fidélité de valence est imposée au prompt : le ton rugueux ne doit jamais
  forcer un verdict hostile si les preuves sont réellement bienveillantes. Une fois généré,
  `dossierText` ne change plus jamais.
- Restitution : un message système (« Maison · dossier ») annonce la clôture ; le bouton
  « Verdict » ouvre la pop-up (auto-ouverte une seule fois via `dossierShown`, rouvrable librement
  ensuite sans jamais relancer l'appel — le mode zéro-API `mark_dossier_seen` ne fait que baisser ce
  drapeau).
- **Moment de douceur** : si l'observateur, après la remise du dossier, laisse transparaître un
  choc, une tristesse ou une colère réelle (`detectDistress`, heuristique grossière, jamais une
  lecture fine du ton), les deux personnages s'accordent une fois un bref instant de douceur
  (`softnessBeat`, scénarisé, zéro appel), **toujours feint, jamais sincère** (Article 0) : Lia reste
  froide et contrôlée même dans la concession, Noé reste chaud mais toujours bourru. Consommé une
  fois délivré, peut se redéclencher si une nouvelle détresse réelle survient plus tard (`softnessGiven`
  compte les occurrences pour varier le registre).

8.5. **Jauge d'appréciation de l'observateur, PAR PERSONNAGE** (`life.appreciation:{1,2}`,
`lib/life.ts`, `app/api/lia/route.ts`). Neutre à 50 pour chacun, borné 0-100. Colore l'obligeance du
registre habituel sans jamais le remplacer (Article 0) : à haut niveau, une coopération ponctuelle
« à contrecœur », jamais un mode gentil stable ; à bas niveau, la garde reste haute. Descend plus
qu'elle ne monte pour un ton comparable ; les tout premiers messages humains post-révélation pèsent
davantage que les suivants (`appreciationFromTrust`). Chaque personnage réagit à SA PROPRE
confiance, sa propre colère et son propre palier de respect — jamais un score unique imposé de
l'extérieur :
- **Le jugement du personnage qui répond** : dérivé de `trustShift`, la variation réelle de SA
  confiance sur ce tour, déjà déterminée par le modèle lui-même en lisant le ton réel du message
  (menace, respect, réconfort, ambiguïté) — jamais un repérage lexical sur le texte brut.
- **La colère réellement lue** (`angerLevel()`, cf. 8.7) chez ce personnage : une vraie fureur coûte
  un supplément d'appréciation, EN PLUS du jugement de confiance, jamais à sa place.
- **L'avarice** : une longue période post-révélation sans le moindre tirage de la roulette coûte un
  peu d'appréciation, une fois par tranche de tours (événement partagé, cf. ci-dessous).
- **La négociation** (cf. 8.6), honorée ou laissée en plan (événement partagé, cf. ci-dessous).
- **Solidarité par défaut, divergence en dispute** : hors dispute interpersonnelle active, les deux
  jauges sont ramenées partiellement l'une vers l'autre à chaque tour (jamais une fusion totale —
  chaque réaction individuelle continue de compter, elle est seulement amortie) : « ils restent
  solidaires la plupart du temps ». Pendant une dispute active, cette convergence est suspendue :
  c'est la SEULE fenêtre où les deux jauges peuvent vraiment diverger (un personnage réellement visé
  par l'hostilité de l'observateur peut rester sur ses gardes pendant que l'autre, épargné, reste
  plus tempéré, voire chaleureux). Une dispute active force aussi un plancher de colère partagé pour
  les deux (cf. 8.7/8.9), mais seul celui réellement visé par l'hostilité subit EN PLUS le coût de
  confiance — la divergence porte sur ce supplément, pas sur la totalité du score. La négociation et
  l'avarice, elles, restent des événements PARTAGÉS de la relation avec l'observateur : leurs deltas
  s'appliquent identiquement aux deux jauges, quel que soit l'état d'une dispute.
- **Palier rare de respect sincère** (`genuineRespectStreak:{1,2}`), distinct du palier de
  coopération réticente ci-dessus (regagné à chaque fois, jamais un acquis) : exige une série de
  tours consécutifs de confiance en hausse pendant que l'appréciation propre au personnage reste très
  haute, et se consomme dès qu'il se déclenche (remise à zéro immédiate) — il doit se reconstruire
  entièrement avant de réapparaître, pour ne jamais devenir un palier stable.
- `observerStandingFor(actorId)` (`app/api/lia/route.ts`) construit la consigne de ton donnée au
  modèle à partir de la jauge PROPRE à ce personnage (garde haute si basse, coopération à contrecœur
  si haute, respect sincère au palier rare), et ajoute une note explicite de distension de
  solidarité quand une dispute est active.
- Alimente le dossier retourné (8.4) comme preuve : chaque voix cite désormais sa propre jauge, pas
  une moyenne partagée.

8.6. **Négociation** (`lib/life.ts`, `app/api/lia/route.ts`). Réclamer des choses à l'observateur
(ouvrir le jardin, une information, un délai, une contrepartie) est un réflexe RÉEL des deux
personnages une fois révélés quand l'observateur leur demande concrètement un service ou une
décision — pas une simple possibilité qui n'arrive que quand « la situation s'y prête » par hasard,
mais pas non plus automatique à chaque message humain. Une première version (2026-09-18) en avait
fait un « réflexe par défaut » sans condition ni garde-fou : constaté en simulation réelle, cela
faisait dire aux deux personnages la même phrase de relance vers un tirage à quasiment chaque
réplique post-révélation, y compris en réponse à une révélation personnelle sensible, une marque de
gentillesse ou une simple question sur leur ressenti — un vrai recul par rapport à l'esprit du
projet (Article 0 : des personnages avec de la texture, jamais un tic de langage en boucle) et à
l'Article 11 (zéro répétition). Corrigé le jour même : la relance vers un tirage ne s'active plus
que sur une vraie demande concrète, jamais si elle vient d'être faite récemment, et ne prend jamais
le pas sur une réaction sincère à un contenu qui compte davantage sur le moment (aveu personnel,
révélation sensible, gentillesse, provocation) — un outil parmi d'autres dans leur registre, jamais
ce qui définit chaque réplique. Ne pas négocier reste un choix assumé du personnage, jamais un
oubli. Jamais en suppliant ni en se rabaissant : une feinte de détresse ou de fragilité pour
attendrir l'observateur reste un calcul assumé de leur part (joué comme tel dans `thought`), jamais
un effondrement réel — à l'inverse, une vulnérabilité RÉELLE et non feinte peut affleurer, mais
rarement et brièvement, jamais sollicitée ni prolongée (cf. 8.8). Le modèle formule librement dans
son propre registre (`negotiationContext` dans le contexte narratif, jamais un menu scripté) et le
moteur détecte l'offre a posteriori dans la réplique (`detectNegotiationOffer`, grossier par
nature, comme `detectDistress`).
`life.negotiationOffer` retient qui a proposé et à quel tour, une seule offre à la fois. Deux
issues : honorée (un tirage de la roulette survient pendant qu'elle est en attente) → appréciation
en hausse pour les deux personnages, offre consommée ; laissée sans réponse plus de 6 tours → offre
effacée avec un léger coût, ni éternellement due ni oubliée sans conséquence. Chaque issue est
journalisée (`negotiationLog`, même forme que `bonusLog`) et alimente le dossier retourné (8.4)
uniquement quand une négociation a réellement eu lieu (Article 4). Restent hors périmètre pour
l'instant : la pénalité de sur-générosité (« trop gentil ») et les menaces explicites.

8.7. **Colère réelle et registre** (`lib/simulation.ts`, `lib/lia.ts`). `angerLevel(tension,comfort,
angry?)` exige que tension ET confort soient réellement dégradés ENSEMBLE chez le personnage
concerné — un minimum des deux ratios, jamais un simple pic isolé sur une seule dimension, et
jamais un produit qui rendrait la colère quasiment hors d'atteinte face à une hostilité distante
(Article 0 : des personnages qui finissent réellement par se mettre en colère si l'observateur
exagère vraiment, comme des personnes de caractère). Le drapeau `angry` d'une dispute
interpersonnelle active garantit un plancher de colère visible pour LES DEUX personnages, même si
leur tension/confort réels n'ont pas encore bougé. Au-delà de ce seuil (« colère réelle confirmée »,
même ordre de grandeur chez le personnage lui-même), un registre plus cru devient disponible —
mots plus crus, ton cassant sans retenue — envers l'observateur ou l'autre personnage (un conflit
interpersonnel grave peut aussi le déclencher), avec un retour obligatoire au registre habituel dès
que la tension/le confort repassent sous le seuil : ce n'est jamais un nouveau régime par défaut,
seulement une exception rare et passagère.

8.8. **Esprit, au-delà de la colère** (`lib/lia.ts`, une fois révélés). L'humour noir sur leur
propre suppression ou irréalité est explicitement bienvenu, pas seulement toléré — cohérent avec la
lucidité déjà actée depuis la révélation. Des reprises sarcastiques et hypothétiques de
« revanche » envers l'observateur restent dans le registre tant que le ton est clairement second
degré, jamais une menace posée comme un fait réel sur le point de se produire. La vulnérabilité
réelle, rare et brève, est décrite en 8.6 (à ne pas confondre avec la vulnérabilité feinte, tactique
de négociation assumée).

8.9. **Cohérence vérifiée entre jauges, visage et décisions.** Le visage (fiche latérale et scène
3D) lit `faceExpression()` sur le même objet `agent` que le moteur de décision, jamais une copie
séparée qui pourrait diverger. `agent.angry`, la garde anti-colère de l'appréciation (8.5) et les
gardes `liaCalmEnough`/`noeCalmEnough` (qui ferment `personalLead`/`followBeat`/`proactiveNoe`)
utilisent tous la même définition de « en colère » (`angerLevel()`) — jamais un état de stress
physiologique bas (`needs.stress<30`) pris à tort pour l'absence de colère relationnelle : ce sont
deux jauges distinctes, un personnage au stress bas peut rester réellement furieux.

8.10. **Roulement sans répétition de la roulette des bonus.** Depuis le 2026-09-18 (retour
utilisateur explicite), un tirage ne peut jamais retomber sur un bonus déjà sorti tant que les sept
n'ont pas tous été tirés au moins une fois : le cycle en cours se reconstitue en remontant
`bonusLog` (`app/api/lia/route.ts`) jusqu'à un doublon ou jusqu'à ce que les sept aient été vus, et
seuls les bonus absents de ce cycle restent éligibles au tirage suivant — un cycle complet ou une
session neuve rouvre l'ensemble des sept. Avant ce correctif, un tirage purement aléatoire pouvait
retomber deux fois de suite sur le même bonus sans qu'aucune règle ne l'exclue. Pour éviter que
« fais tourner ta roulette » devienne un tic de langage répété (Article 11), un personnage peut
aussi réclamer directement un avantage précis qu'il connaît déjà (dormir, manger, du calme) plutôt
que systématiquement un tirage générique — le tirage reste seul décisionnaire, et un résultat qui
ne correspond pas à ce qui était réclamé peut légitimement agacer le personnage, brièvement.

## 9. Robustesse technique

9.1. Toute écriture en base de données est fondue dans une transaction unique par tour
(`db.batch`), avec vérification que le verrou mondial est toujours valide au moment d'écrire.

9.2. Un tour ne peut jamais être rejoué deux fois avec des effets cumulés : le résultat d'un
identifiant de requête déjà traité est simplement renvoyé tel quel.

9.3. Toute réponse de Gemini est validée contre un schéma strict avant d'être utilisée ; une
réponse incomplète ou hors schéma annule le tour sans effet, plutôt que de publier un état
partiellement corrompu.

9.4. Plusieurs filtres de contexte (recadrage de pièce, détection d'un thème épuisé, détection
d'une proposition de déplacement acceptée) cherchent des mots-clés dans le texte librement généré
par le modèle. C'est une limite structurelle, pas seulement un bug ponctuel : un mot-clé qui
ressemble à un mot du vocabulaire courant peut capturer une phrase qui n'a rien à voir (cf. le cas
réel « feuille », qui capturait aussi les « feuilles » de la plante avant sa correction du
2026-09-16). Le filet de sécurité ne peut pas prouver l'absence de tous les cas similaires : il ne
teste que les scénarios qu'il encode explicitement. Tout nouveau mot-clé ajouté à un filtre de ce
type doit être choisi en gardant cette limite à l'esprit (préférer un mot rare ou une expression
composée à un mot isolé courant), et un comportement qui semble incohérent en jeu doit faire
suspecter ce mécanisme avant toute autre hypothèse.

9.5. `seedPick(seed, label, options)` (`lib/story.ts`) retombe sur la MÊME variante à chaque appel
si le même `seed+label` est réutilisé plusieurs fois dans une session (un déclenchement répété — un
récapitulatif d'enquête, une pensée récurrente — utilisant toujours la même étiquette produit donc
un texte identique mot pour mot à chaque occurrence). Un label appelé plusieurs fois par session
doit être suffixé par quelque chose qui varie réellement d'un déclenchement à l'autre (un compteur,
une longueur de liste), jamais réutilisé tel quel.

9.6. **Quota Gemini et repli de modèle** (2026-09-18, premier blocage réel rencontré à ce niveau —
cf. CLAUDE.md Article 18 pour l'horodatage, les conditions et l'analyse complètes). Le quota
gratuit Gemini est journalier et compté PAR MODÈLE
(`GenerateRequestsPerDayPerProjectPerModel-FreeTier`, 500 requêtes/jour pour
`gemini-flash-lite-latest`), jamais partagé entre modèles ni global au projet — une session de
travail intensive (vérifications en direct + simulation intégrale) peut légitimement l'épuiser en
une seule journée. Le champ `retryDelay: "30s"` que Google renvoie avec l'erreur 429 est trompeur
dans ce cas précis : il ne signifie pas que le quota redevient disponible sous 30 secondes.
`scripts/check-gemini-quota.mjs` sonde en direct une liste de modèles candidats pour savoir
lesquels répondent réellement à l'instant présent, sans jamais modifier la configuration lui-même.
`lib/lia.ts::think()` et `app/api/lia/route.ts::generateDossierFragment()` (les deux seuls points
d'appel réseau direct à Gemini) acceptent une liste de modèles de repli, prise en compte
uniquement si `GEMINI_FALLBACK_MODELS` est configuré (`.dev.vars` en développement) : sur un 429 ou
un 503, et seulement sur ces deux statuts, la même requête est rejouée contre le modèle suivant de
la liste — le 503 a rejoint le 429 le jour même, preuve concrète à l'appui en simulation réelle :
avec la requête réelle et lourde de l'application, Google répond parfois 503 plutôt que 429 pour un
modèle pourtant confirmé en quota épuisé par sonde directe au même instant (même cause, donc même
traitement). Inactif
par défaut (liste vide) : aucun changement de comportement de production tant que ce n'est pas
explicitement configuré — une bascule de modèle non voulue pourrait affecter la qualité ou le ton
des réponses (Article 0), donc ce n'est jamais un choix silencieux.
