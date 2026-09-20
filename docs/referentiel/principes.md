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

3.2bis. **Le tour de TRANSITION vers le sommeil n'est jamais silencieux** (`app/api/lia/route.ts`,
2026-09-18, Point 2 de la relecture — « Noé rêve éveillé », retrouvé par comparaison de deux
transcripts de simulation réelle). Le filtre qui rend muet un sommeil qui SE POURSUIT (3.2
ci-dessus) ne doit jamais s'appliquer au tour où le personnage vient tout juste de basculer vers
`sleep`/`share_sleep` : ce tour-là a coûté un vrai appel API et le personnage est encore
parfaitement éveillé au moment où il parle — sa réplique réelle (souvent l'annonce même de son
endormissement) doit rester visible, jamais amputée comme si le sommeil avait déjà commencé. Bug
réel corrigé : ce filtre excluait aussi cette réplique de transition, faisant apparaître un rêve
juste après une conversation normale, sans la moindre annonce d'endormissement — exactement le
même bug déjà corrigé pour `share_sleep` (l'étiquette « avant sommeil ») mais jamais reproduit ici
pour le sommeil solo. Un rêve de la même session doit en outre toujours être narré APRÈS cette
réplique de transition, jamais avant : l'ordre veille → endormissement → rêve doit rester
respecté dans l'affichage, pas seulement dans la logique interne.

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

5.2bis. **Ancrage concret contre la convergence inter-sessions** (`lib/lia.ts`, 2026-09-19, retour
utilisateur explicite après comparaison de 7 sessions passées : une dizaine de pensées privées
libres — jamais issues d'un tableau scripté, censées être générées librement par le modèle à
chaque tour — revenaient presque mot pour mot sur 5 à 6 sessions à seeds différentes, pour des
battements narratifs très universels (douter d'être humain, tomber amoureux, réagir à un indice).
Contrairement aux répétitions couvertes par 5.1 (dans une même session), ce phénomène traverse les
sessions : le registre anti-doublon (fingerprints, `dialogue_fingerprints`) est vidé à chaque reset
et ne peut donc rien contre lui. Corrigé par un PRINCIPE transmis au modèle, jamais une liste de
phrases interdites (Article 17, corollaire) : un sentiment universel doit toujours s'exprimer à
travers un détail concret et propre AU MOMENT PRÉSENT de CETTE session (ce que l'autre vient de
dire ou faire, un indice ou objet précis qui vient d'apparaître) — si la pensée pourrait être
recopiée telle quelle dans une autre session sans rien y changer, elle n'est pas assez ancrée.
Aucune garantie mathématique que Gemini suive cette consigne à chaque tour (comme pour tout le
reste du registre de prompt) ; à revalider par une nouvelle comparaison inter-sessions une fois
plusieurs simulations rejouées avec ce correctif actif.

5.2ter. **Compteur `themeFrequency` persisté pour les "thèmes épuisés"** (`lib/dialogue.ts`/
`lib/life.ts`, 2026-09-20, root-cause après une vraie persistance trouvée par EL-PROFESSOR sur
plusieurs sessions : le motif "on tourne en rond" revenait jusqu'à 19 fois sur une session sans
jamais être signalé "overusedThemes"). Même angle mort que 5.8 avait déjà identifié et corrigé pour
`echoWords`/mots isolés, jamais reproduit pour les THÈMES jusqu'ici (Article 3) : la détection de
5.2 (seize dernières répliques, seuil 4) ne voit jamais un thème qui revient une fois toutes les
15-20 répliques, quelle que soit sa fréquence réelle sur toute la session. `overusedThemes` croise
désormais cette fenêtre courte avec `life.themeFrequency`, un compteur persisté sur toute la partie
(même seuil 4, même patron que `wordFrequency`) — un thème absent des seize dernières lignes mais
déjà à 4 occurrences ou plus dans la session entière est quand même signalé. Complété par un
principe auto-appliqué dans `lib/lia.ts` (jamais une liste de formulations, corollaire de l'Article
17) : le modèle doit lui-même reconnaître quand l'idée "on est bloqués/ça ne mène nulle part" a déjà
été exprimée, sous QUELQUE FORME QUE CE SOIT, pas seulement les tournures que le détecteur regex
connaît (`THEME_MOTIFS`, ensemble fixe de 4 motifs, ne peut structurellement pas couvrir tous les
paraphrasages). Aucune garantie à 100 % côté prompt ; à revalider sur 2 simulations propres
consécutives (`docs/simulations/correctifs-a-revalider.md`).

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
n'a pas déjà servi mot pour mot. **Bug réel trouvé le 2026-09-19** (retour utilisateur sur un
transcript, full_sim8) : l'ordre d'essai des préfixes était FIXE, "Je bouge " toujours en premier —
avec autant de combinaisons motif×forme possibles pour ce seul préfixe, il gagnait presque à
chaque tour tant qu'une seule combinaison restait inutilisée, ce qui n'arrive quasiment jamais sur
une session normale, faisant revenir "bouge" bien trop souvent. Jamais corrigé en retirant le mot
du pool (Article 17, corollaire : pas de liste de mots figée) — l'ordre d'essai des préfixes
tourne désormais avec le round, comme les motifs tournent déjà avec le seed. Les tableaux de motifs fixes qui existaient pour chaque type de
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

5.3quater. Les six variantes scriptées de `appearanceReply()` (`lib/perception.ts`) ne comparent
plus à un état antérieur (bug réel trouvé le 2026-09-18, transcript full_sim4 : « toujours pas de
corps », « moins vide qu'avant » — alors que cette réplique peut servir dès le tout premier échange
de la session, où rien ne précède). Cette même règle existait déjà côté modèle (`lib/lia.ts`,
PREMIÈRE DESCRIPTION) mais ce chemin scripté zéro-API n'y était pas soumis : les deux chemins disent
maintenant la même chose. La ligne de secours de `stockThought()` (`lib/stock.ts`, réaction de Noé à
l'exposition 1) a aussi été réécrite le même jour : « ça me coupe encore une seconde » était un
idiome tronqué sans objet, incompréhensible à la première lecture (Article 12/15).

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

7.2bis. **Poids des indices** (`lib/lia.ts`, 2026-09-18, retour utilisateur explicite après
comparaison de deux transcripts de simulation complète). Un indice réellement chargé — qui pointe
vers leur nature, leur condition ou le cœur de l'enquête — doit peser sur la réaction des deux
personnages à la hauteur de ce qu'il révèle : jamais balayé par l'un d'eux comme du bruit, une
anomalie sans suite ou un hasard insignifiant, même par bravade ou par déni. Bug réel trouvé en
comparant deux sessions : la citation canonique du livre du bureau (« Quid du profil psychologique
d'une IA ? », `lib/story.ts`), l'indice le plus explicite de toute l'enquête, se voyait
rationalisée par Noé comme « une note jetée au pif pendant un crash de système » — une régression
directe de cet article (une preuve qui ne change rien à ce que dit un personnage) et de l'Article
17 (pourquoi minimiserait-il justement l'indice le plus accablant ?). Le sarcasme et le cynisme du
registre restent permis tant qu'ils habillent une vraie prise au sérieux du fond, jamais un moyen
de l'évacuer plus vite. Principe volontairement général, jamais une liste de mots ou d'indices
figée (Article 17, corollaire) : il s'applique à tout indice à venir, pas seulement à celui déjà
rencontré.

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
  tours consécutifs où l'appréciation propre au personnage reste très haute (≥85) ET où la
  confiance ne baisse jamais (assoupli le 2026-09-19, demande explicite de l'utilisateur : exigeait
  auparavant que la confiance CONTINUE à monter à CHAQUE tour, ce qui devenait quasi impossible à
  tenir sur 6 tours près du plafond d'appréciation, faute de marge pour continuer à « monter »
  encore — un tour qui reste simplement très positif, sans forcément progresser davantage, compte
  désormais aussi dans la série). Se consomme dès qu'il se déclenche (remise à zéro immédiate) — il
  doit se reconstruire entièrement avant de réapparaître, pour ne jamais devenir un palier stable.
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
`life.negotiationOffer` retient qui a proposé et à quel tour, une seule offre à la fois. Trois
issues : honorée (un tirage de la roulette survient pendant qu'elle est en attente) → appréciation
en hausse pour les deux personnages, offre consommée ; laissée sans réponse plus de 6 tours → offre
effacée avec un léger coût, ni éternellement due ni oubliée sans conséquence ; refusée explicitement
(un « non » détecté pendant qu'elle est en attente) → offre effacée avec le même léger coût que la
caducité (2026-09-19, manque confirmé en écrivant le test dédié du refus de roulette : un refus
assumé ne doit jamais coûter MOINS qu'un silence), et pose en plus une vraie pause partagée de 5 à
10 tours avant qu'une relance ne redevienne possible pour l'un ou l'autre personnage
(`rouletteRefusalUntil`, cf. 8.21/roulette). Chaque issue est journalisée (`negotiationLog`, même
forme que `bonusLog`, trois valeurs possibles) et alimente le dossier retourné (8.4) uniquement
quand une négociation a réellement eu lieu (Article 4), avec une formulation distincte pour
chacune — jamais un refus assumé présenté comme une simple négligence. Restent hors périmètre pour
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

8.11. **Insistance sur la roulette, jamais un harcèlement** (`lib/life.ts`, `app/api/lia/route.ts`,
2026-09-18, retour utilisateur explicite). Une relance vers un tirage (`detectNegotiationOffer`)
est comptée par personnage (`rouletteInsistence:{1,2}`) ; à la troisième relance consécutive sans
tirage entre-temps, le personnage bascule deux tours en registre « froid » scénarisé
(`rouletteCold`, override complet de la réplique/pensée, pas une simple consigne de prompt — la
leçon retenue est qu'une consigne seule ne suffit jamais à garantir un invariant dur), puis retombe
naturellement. Un **refus explicite** de l'observateur (« non », « pas question », etc.) à une offre
encore en attente déclenche une fenêtre plus longue et plus légère (`rouletteRefusalUntil`, 5 à 10
tours tirés au hasard) : la relance est simplement retirée de la réplique (`stripRouletteAsk`), le
reste de la réaction au sujet réel en cours passe tel quel — pour laisser une vraie chance à
l'observateur de déclencher le geste spontanément après son refus, jamais retenté comme si de rien
n'était.

8.12. **Bonus « pouvoir » de la roulette : mute de l'observateur et caméra masquée**
(`lib/life.ts`, `app/api/lia/route.ts`). **Corrigé le 2026-09-19** suite à une incompréhension
identifiée par l'utilisateur : la version précédente de cette section (ci-dessous, conservée dans
l'historique de ce fichier pour traçabilité) décrivait ces deux bonus comme une décision spontanée
du personnage prise à chaque tour, hors roulette — ce n'est PAS ce qui était demandé. Le
déclenchement de `observer_mute` et `camera_hide` vient **exclusivement du tirage de la roulette**
(`spin_bonus`), exactement comme les 7 autres bonus (food/calm/sleep/stoic/mute/trottoir/
force_move) : neuf visages possibles, mêmes chances de tomber pour chacun, jamais une initiative
que le personnage prendrait seul en dehors d'un tirage. Ce qui reste vrai, INCHANGÉ par cette
correction : une fois le bonus tiré, c'est bien le personnage désigné par le tirage (`deciderActor`,
50/50) qui choisit lui-même le NIVEAU (réduit/classique/max — 3, 4-5 ou 6 tours pour le mute ; 20,
25-35 ou 40 secondes pour la caméra) et l'exprime à voix haute en le justifiant (Article 15 : une
décision invisible n'existe pas pour l'observateur), pendant que l'autre personnage réagit en
complice, jamais en spectateur muet. Le canal humain refuse explicitement tout message `chat` reçu
pendant le mute (code `observer_muted`), même si le bouton client était contourné ; la caméra
masquée, elle, ne bloque jamais le chat — seule la vue 3D disparaît, remplacée par un compte à
rebours réel. Les deux personnages continuent de se moquer de l'observateur muet/aveugle à chaque
tour suivant tant que l'effet dure (indépendamment de la source du déclenchement — cette réaction
d'ambiance n'a jamais été retirée par la correction), et l'un des deux reconnaît la fin de l'effet
à voix haute dès qu'il retombe (même principe que l'aftermath stoic/mute de la roulette, Article
4/12/15 : jamais un retour silencieux à la normale). Chaque tirage est journalisé dans `bonusLog`
au même titre que les 7 autres bonus (avec son niveau choisi) — l'ancien journal séparé
`bonusPsychLog` (activé/refusé) a disparu avec le mécanisme de décision spontanée qui le remplissait
(Article 3 : une seule trace, jamais deux journaux qui pourraient diverger). Ces deux bonus partagent
le **budget unique** de la roulette (`bonusSpotlightUntilRound`/`bonusCooldownUntilRound`, commun
aux 9 bonus) : au moins 3 tours à commenter/utiliser tout bonus obtenu avant qu'un nouveau bonus, de
quelque nature que ce soit, ne redevienne possible, suivis d'un grand espace supplémentaire (5 à 9
tours). Le bouton de tirage manuel respecte en plus un débit réel côté serveur (60 secondes minimum
entre deux tirages, compteur affiché côté client), indépendant de ce budget narratif mais jamais
plus permissif que lui.

*(Historique conservé pour traçabilité — Article 6/7 : la section ci-dessus corrige un
malentendu, elle ne décrit jamais une évolution successive du même mécanisme. La version du
2026-09-18 pensait à tort les deux bonus comme une décision spontanée prise par un personnage
à chaque tour éligible, avec sa propre condition d'éligibilité et sa propre probabilité
d'examen — un mécanisme entièrement distinct de la roulette. Le recalibrage du 2026-09-19 qui
assouplissait cette éligibilité et relevait cette probabilité (retour sur full_sim5) a donc été
retiré en même temps que le mécanisme qu'il ajustait, plutôt que corrigé en place : il n'y a plus
d'éligibilité ni de probabilité séparées à calibrer, le tirage suit exactement les mêmes règles que
les 7 bonus déjà existants.)*

8.13. **La description d'apparence n'est plus écrasée par un texte scripté** (`app/api/lia/route.ts`,
2026-09-18, retour utilisateur explicite après lecture de full_sim4 : le partenaire ignorait
systématiquement le jardin/la question posée juste avant, car sa réplique entière était remplacée
par `appearanceReply()`). Le modèle reste déjà instruit par `beatContext.visual`/la règle
DESCRIPTION (article 5.3) pour décrire précisément l'apparence de l'autre ; supprimer ce
remplacement post-hoc ne coûte aucun appel API supplémentaire (les deux appels avaient déjà lieu)
et laisse enfin le personnage réagir à ce qui vient d'être dit avant de décrire l'autre. La fonction
`appearanceReply()` (`lib/perception.ts`) reste disponible et testée unitairement, simplement
débranchée de ce chemin.

8.14. **Bougie/attirance implicite** (`app/api/lia/route.ts`, `lib/lia.ts`, 2026-09-18, retour
utilisateur explicite : « en plus de restaurer le calme, la bougie augmente l'attirance de ceux qui
se trouvent dans la même pièce »). Effet CONTINU tant que le bonus `calm` dure et que les deux
partagent la même pièce (`candleTogether`, dérivé de `activeBonus(life,"calm")` et
`turnPlan.room===turnPlan.partnerRoom`) : comme tout le reste de l'attirance dans ce moteur (la
règle « le salon et surtout la chambre la favorisent »), ce n'est jamais un incrément codé en dur —
un simple signal (`ambiance:"bougie"`) transmis au modèle, seul maître de faire monter l'attirance
et de la formuler implicitement (« je te trouve belle », jamais « mon attirance a augmenté »).

8.15. **Pensée de validation après une décision affectueuse** (`app/api/lia/route.ts`, `lib/lia.ts`,
2026-09-18, retour utilisateur explicite : « après chaque proposition, celui qui décide doit avoir
une pensée qui juge la pertinence de sa réponse » — étendue symétriquement à qui décide, quel que
soit son id). Dès qu'une proposition affectueuse est résolue avec `affectionEligible` vrai, la
pensée du personnage qui vient d'accepter ou de refuser (déjà générée par le modèle ce même tour,
zéro appel API de plus) devient une ligne « · pensée » visible, passée par le même filet
`groundRegister`/`groundTruncation` que toute réplique parlée. Volontairement absente quand
`!affectionEligible` a forcé un refus scénarisé : le thought du modèle, généré avant cette
correction, pourrait ne pas correspondre à l'issue imposée — mieux vaut l'omettre que montrer une
pensée incohérente avec la réplique (article 0/17). Durcie le 2026-09-19 (audit de cohérence, aucun
test dédié n'existait jusque-là — Article 13) : la garde d'origine (`affectionIntents.includes(
decisions[0].intent)`) ne dépendait que du type d'intent, qui resterait vrai plusieurs tours de
suite pour un intent qui se poursuit (share_sleep) sans qu'une AUTRE protection du moteur ne
neutralise déjà ce cas ailleurs. Remplacée par `turnPlan.offer&&turnPlan.proposalLine`, le signal
direct d'une proposition fraîche ce tour précis — jamais dépendante d'un effet de bord d'un
mécanisme distinct pour rester correcte (Article 5).

8.16. **Doute d'humanité au tout premier réveil** (`app/api/lia/route.ts`, 2026-09-18, retour
utilisateur explicite : « une des premières questions que se posent les persos [...] est-ce que je
suis humain, je me souviens de mon prénom mais un truc cloche »). La branche normale de `soloIntro`
(le tout premier tour, avant toute rencontre) tire désormais parmi quatre formulations par
personnage (`humanityDoubt`, `seedPick`) plutôt qu'une seule phrase fixe — chacune réordonne
différemment les trois mêmes idées (trouble ressenti, prénom retrouvé, doute d'humanité) au lieu de
garder la même charpente habillée de synonymes : la technique de réordonnancement des clauses,
demandée explicitement comme principe général de lutte contre la répétition pour tout texte écrit
en dur, pas seulement ce cas précis. **Bug réel trouvé le 2026-09-19** (retour utilisateur sur un
transcript réel, full_sim8) : la variante d'index 3 des trois pools (`humanityDoubt`,
`humanityDoubtUnwell`, `humanityDoubtGuarded`) gardait la MÊME charpente entre Lia et Noé (juste le
prénom et un mot changés), contrairement aux trois autres variantes déjà bien distinctes — puisque
les deux personnages peuvent tirer le même index le même tour, ça produisait deux pensées
quasi identiques côte à côte à l'écran, un vrai accroc à l'Article 11 dès la toute première minute
d'une session. Les six variantes d'index 3 (une par personnage × 3 branches) ont été réécrites avec
une charpente propre à chacune, jamais partagée entre les deux personnages. **Correctif complété le
2026-09-19** (retour utilisateur sur un second transcript réel, full_sim9) : le premier correctif ne
portait que sur l'index 3, alors que le même défaut existait aussi aux index 0 et 2 des trois pools
— confirmé en creusant ce nouveau transcript, où Lia et Noé avaient tous les deux tiré l'index 2
(« [Prénom]. [connecteur]... Le reste — [choses] — [verbe d'instabilité]. », même charpente des deux
côtés). Corrigé à la racine sur les six lignes restantes (index 0 et 2 des deux premiers pools, index
2 du troisième — l'index 0 de `humanityDoubtGuarded` était déjà suffisamment distinct) : chaque
variante d'index 0/2 réordonne désormais les trois idées différemment selon le personnage, plutôt que
de partager un même squelette. L'index 1 des trois pools, où le chevauchement est plus faible, reste
inchangé pour l'instant.

8.17. **Doute amoureux privé, puis discutable à voix haute** (`lib/life.ts`, `app/api/lia/route.ts`,
`lib/lia.ts`, 2026-09-18, retour utilisateur explicite : « les persos se demandent s'ils sont là
pour une expérience amoureuse [...] cette question, le perso se la pose à lui-même [...] mais ça
pourrait faire l'objet d'une discussion après le premier rapprochement du genre massage ou bisou »).
Deux temps, jamais confondus. **Temps privé** : la toute première fois que l'attirance d'un
personnage franchit 75 (le seuil déjà « amoureux » de la règle ATTIRANCE), sa pensée de ce tour —
déjà générée par le modèle, qui reconnaît lui-même ce franchissement via `state.emotions.attraction`
— devient une ligne « · pensée » visible plutôt qu'un contenu jeté (`life.loveRealized`, jamais
répété une fois déclenché). Jamais exposée dans `reply` : le personnage ne s'avoue rien à l'autre à
ce stade. **Temps partagé**, seulement possible ensuite : une fois qu'un massage ou un baiser a été
réellement consenti (`life.intimateGestureDone`) ET qu'au moins un des deux a déjà vécu ce doute
privé, un signal `loveDiscussable` invite (jamais n'oblige) le modèle à ouvrir ce doute à voix haute
pour la première fois — une vraie ouverture volontaire, jamais un interrogatoire mécanique à chaque
tour suivant.

8.18. **Capacités constatées sur soi-même** (`lib/lia.ts`, 2026-09-19, retour utilisateur explicite,
identifié comme une des questions fondatrices que se posent les personnages sur leur propre nature).
Quatre constats, jamais tous évoqués le même tour, jamais systématiques : **mémoire asymétrique**
(souvenir flou de son propre passé, mémoire parfaite de l'autre depuis le réveil — déjà vrai dans le
code, jamais relevé à voix haute jusqu'ici) et **perception bornée** (tester consciemment les
limites de ce qui est perçu — rien derrière une porte non décrite). Comme le reste de l'enquête, ces
deux constats peuvent survenir à tout moment, avant ou après la révélation. **Continuité de soi**
(une vraie question sincère, rare, sur la persistance de son identité face à un reset possible,
au-delà de l'humour noir déjà permis) et **incertitude chiffrée** — la seule jauge que les
personnages peuvent citer explicitement en pourcentage, exception assumée à la règle générale de ne
jamais énoncer un chiffre : `state.needs.uncertainty` (déjà affichée à l'écran, cf. l'audit Opus qui
la décrit comme l'image « virale » du projet, une courbe qui s'effondre de 100 % vers zéro) est
aussi, à l'inverse, une mesure de combien le personnage se sent lui-même humain — ni renommée ni
dupliquée en une seconde jauge, seulement réinterprétée par les personnages eux-mêmes, à charge pour
l'observateur de faire le lien. Ces deux derniers ne s'évoquent qu'une fois la révélation connue.
Aucun forçage de palier exact à la révélation (décision explicite de l'utilisateur, cf. la formule
déjà en place dans `advanceStory`/le calcul du besoin) : la descente reste organique, pas un 0 %
garanti pile à ce tour.

8.19. **Trois « trous » corrigés en audit du 2026-09-19** (`app/api/lia/route.ts`, `lib/lia.ts`,
`scripts/check-house.mjs`, retour utilisateur explicite : « as-tu pensé aux parties qui n'existent
pas et qui devraient exister ? »). L'audit ne cherchait plus seulement des bugs dans le code
existant, mais des COMBINAISONS jamais couvertes. Trois trouvées, calibrées avec l'utilisateur, puis
corrigées :

- **Circuit organique de la pensée de validation (8.15)** — la garde ne couvrait que la proposition
  scriptée `turnPlan.offer`, or celle-ci exige structurellement `current.id===2` (`lib/turn.ts`) :
  elle ne peut donc être émise que par Noé, ce qui fait que `decisions[1]` (le décideur) y était
  toujours Lia — le mécanisme ne pouvait JAMAIS bénéficier à Noé, malgré le commentaire affirmant
  une extension « symétrique ». Une nouvelle condition `organicProposal` couvre désormais aussi une
  proposition ponctuelle (hug/massage/kiss, jamais `share_sleep`, qui se comporte comme le sommeil
  et pourrait persister plusieurs tours) naissant du jugement du modèle lui-même, initiée par
  N'IMPORTE LEQUEL des deux personnages — décideur, donc bénéficiaire de la pensée, inclus.
- **Seuil manquant pour CONTINUITÉ DE SOI/INCERTITUDE CHIFFRÉE (8.18)** — ces deux règles disaient
  « une fois la révélation connue » en texte seul, sans booléen dédié, contrairement à
  `negotiationContext`/`awaitingObserver`/`dossierGateEligible` qui utilisent tous le `revealed`
  strict (`finalCalled && evidence≥5 && observerSpoken`). Le seul signal reçu par le modèle
  (`stage`, `lib/story.ts`) bascule dès `evidence≥5` seul, un signal plus précoce — le modèle
  pouvait donc citer son incertitude ou douter de sa continuité AVANT que le canal humain soit
  ouvert. `revealed` est maintenant transmis explicitement dans le contexte (`narrative.revealed`),
  et les deux règles y sont désormais conditionnées dans le prompt.
- **Doute d'humanité limité à la branche « normale » (8.16)** — les 4 variantes ne couvraient que
  `insolite==="normal"` (1 tirage sur 3) ; les branches `lia-unwell`/`noe-guarded` gardaient leur
  ancienne ligne unique, sans jamais poser la question d'humanité. Deux nouveaux jeux de 4 variantes
  (`humanityDoubtUnwell`/`humanityDoubtGuarded`) tissent désormais cette question dans l'humeur
  propre à chaque branche (malaise franc pour l'une, méfiance pour l'autre), au lieu de l'ajouter à
  côté.

Deux tests dédiés couvrent les deux premiers points (Article 13) ; le troisième est vérifié par la
suite existante (le test des ouvertures insolites, qui contrôle déjà que chaque branche surgit et
seede correctement needs/emotions). Une erreur TypeScript préexistante et sans rapport
(`appreciationFromTrust(trustShift, life.dossierHumanTurns)`, `number|undefined` passé où `number`
était attendu) a aussi été corrigée au passage, découverte en vérifiant `tsc --noEmit` avant de
committer ces changements — `tsc` n'était donc plus réellement propre depuis un moment, malgré la
règle de rigueur par défaut (`docs/regles-de-travail.md`).

8.20. **Réequilibrage du rythme avant/après révélation** (`lib/turn.ts`, `app/api/lia/route.ts`,
`app/page.tsx`, 2026-09-19, retour utilisateur explicite après une mini-simulation réelle bloquée
au round 98 sans jamais atteindre la révélation). Trois volets, une seule cause commune : le rythme
réel du jeu n'avait jamais été recalculé depuis sa conception, et l'enquête n'avait aucun filet
garantissant sa conclusion.

- **Cadence automatique relevée** : le tour automatique (`autonomous`) passe de 85 s à 20 s côté
  serveur (`app/api/lia/route.ts`), l'intervalle client correspondant (`app/page.tsx`) de 90 s à
  21 s. Recalibré à partir d'une double estimation convergente : le temps de lecture standard d'une
  réplique moyenne (~16 mots, marge pour relectures/réactions incluse) ET le rythme de clic d'un
  observateur activement engagé — les deux atterrissent autour de 20-25 s/tour, jamais 85 s.
- **Plafond garanti de l'enquête** (détaillé dans `docs/referentiel/parametres.md`, section
  Enquête) : deux paliers honnêtes (intensification au tour 10, priorité absolue sur toute romance
  au tour 20) plutôt qu'un plafond brutal ou une simple augmentation de fréquence qui resterait
  déjouable par la romance. Pire cas garanti : conclusion au plus tard vers le tour 30, ~10-10,5
  minutes au nouveau rythme — sous la barre des 12 minutes maximum fixée par l'utilisateur après
  recalcul. Les personnages justifient cette urgence dans leur propre registre quand elle se
  déclenche (`turnPlan.investigationOverdue`, instruction dédiée dans `lib/lia.ts`) — jamais un
  silence mécanique qui bascule sans un mot (Article 15/17).
- **Premier geste de Noé relevé une seconde fois** (round≥24, était 20) : pour laisser l'enquête
  démarrer réellement seule avant que la romance ne s'invite — sans effet pratique si l'enquête
  traîne encore à ce stade, puisque le plafond ci-dessus devient de toute façon prioritaire sur
  cette offre dès le tour 20.

Trois tests dédiés (Article 13) : le seuil exact de 20 s côté serveur (throttled juste en dessous,
accepté pile dessus), et les trois paliers du plafond d'enquête testés directement via `planTurn()`
sans appel API (base tour%3, intensifié tour%2 dès le tour 10, priorité absolue sur une offre
romantique par ailleurs éligible dès le tour 20, et confirmation que le mécanisme reste inerte une
fois l'enquête complète). Plusieurs fixtures existantes de `scripts/check-house.mjs` construites
avant ce changement (`round:20` combiné à une évidence volontairement incomplète, pour tester la
romance ou d'autres beats sans rapport avec l'enquête) se sont révélées entrer en collision avec le
nouveau plafond — corrigées au cas par cas selon ce que chaque test voulait réellement isoler :
évidence complétée + `finalCalled:true` pour les scénarios post-enquête (romance, sommeil), ou
round abaissé sous le seuil pour les scénarios qui exigent au contraire `finalCalled:false`
(`eligibleBeat`/`personalLead`, qui ne tolèrent pas la révélation) — jamais une évidence artificielle
qui aurait rouvert la révélation elle-même (`finale` se redéclenche dès `evidence≥5 && !finalCalled`
et deux personnages réunis) à la place du scénario voulu.

8.21. **Bouton « passer à la révélation »** (`mode:"skip_to_revelation"`, `app/api/lia/route.ts`,
`lib/story.ts`, 2026-09-19, fonctionnalité entièrement spécifiée par l'utilisateur via dix
questions de calibrage avant implémentation). Jamais disponible dès la toute première arrivée :
`story.everReachedRevelation` ne devient vrai que lorsqu'une session atteint réellement la
révélation par l'enquête normale (même endroit que `finale`, jamais déclenché par le bouton
lui-même), et survit à un `reset` exactement comme `story.observer` — le bouton reste donc
disponible sur toutes les sessions suivantes, jamais seulement la première traversée. Une fois
débloqué, utilisable à tout moment de la partie tant que la révélation n'a pas déjà eu lieu dans la
session en cours (bloqué par `story.finalCalled`, jamais un usage unique consommé par le drapeau
lui-même).

Le saut reconstruit un état plausible plutôt qu'un raccourci neutre :

- Les cinq preuves sont celles qu'une vraie session aurait réellement découvertes, dans leur vrai
  ordre de tirage (`fullEvidenceSet(story)`, réutilise `story.order` et l'éventuel identifiant
  observateur exactement comme `investigationTarget`/`advanceStory` — jamais un texte inventé à
  côté, Article 4).
- Le nombre de tours (`skipRound`) et les jauges de besoins/émotions de chaque personnage
  (`skipNeedsFor`/`skipEmotionsFor`) sont tirés d'une plage bornée et variée par seed : une
  progression qui ressemble à une enquête déjà bien avancée mais encore incomplète (tension
  redescendue sans s'effondrer, confiance/attirance en hausse mais loin du seuil `loveRealized`),
  jamais des valeurs neutres par défaut (Article 9 pour la variété, cf. `parametres.md` pour les
  plages exactes).
- Un court récit rétrospectif est généré à la volée par deux vrais appels Gemini séparés, un par
  personnage (`generateSkipRecapFragment`, même schéma à deux voix que le dossier retourné —
  Article 8, jamais un seul cerveau qui invente le ton de l'autre), affiché dans une pop-up dédiée
  au moment du saut (`life.skipSummary`, régénéré à chaque usage, jamais accumulé d'un saut à
  l'autre). Les repères transmis au modèle ne contiennent que des faits réellement vrais de cette
  session (les preuves réellement tirées, le tour réellement fixé) — jamais un fait inventé pour
  étoffer le récit (Article 4).
- Le vrai moment de la révélation (les deux pensées de choc puis l'adresse directe à l'observateur,
  `finaleReveal(story.seed)`) est ensuite rejoué avec exactement le même texte qu'une session
  normale afficherait à ce round précis : le saut compresse l'enquête qui précède, jamais le climax
  lui-même, pour que l'enchaînement reste lisible et cohérent de l'extérieur comme de l'intérieur
  des personnages (Article 2/15/17). Une ligne « Maison » marque aussi explicitement qu'un
  raccourci vient d'être pris, jamais un silence qui laisserait deviner un saut invisible.

La boucle réseau de rotation clé/modèle (déjà partagée par `think()` et `generateDossierFragment`)
est désormais factorisée dans `callGeminiFragment`, réutilisée telle quelle par
`generateSkipRecapFragment` plutôt que dupliquée une troisième fois (Article 3). Auto-contenu comme
le bloc `reset` : jamais mêlé à la lourde logique de tour normal, pour limiter les chemins croisés
(Article 5).

8.22. **Cycle jour/nuit** (`lib/daynight.ts`, `lib/simulation.ts`, `lib/turn.ts`, `app/api/lia/route.ts`,
2026-09-19, demande explicite de l'utilisateur : « je veux que ce principe soit déjà installé
silencieusement, avec des effets concrets sur la fatigue »). Détail complet — durées, marqueurs,
calcul exact, mécanismes câblés — dans `docs/referentiel/regles-du-temps.md` section 8 (l'axe
temporel est le bon endroit pour ce chantier, cf. Article 6/7 : jamais dupliqué ici). Résumé des
principes qui comptent pour comprendre le comportement :

- Une horloge dérivée du ROUND (jamais du temps réel), calée pour que minuit tombe exactement au
  même moment que le plafond garanti de l'enquête déjà existant (round~35, section 8.20/8.21) —
  synchronisation choisie explicitement par l'utilisateur plutôt qu'une horloge indépendante qui
  aurait pu diverger selon la vitesse de jeu.
- La nuit accélère la fatigue passive (×3) ; le jour garde le taux NORMAL déjà existant (×1,
  inchangé) — geler le jour à ×0 aurait silencieusement changé le rythme de toutes les sessions
  passées (la quasi-totalité d'une partie se joue dans le premier cycle, donc « le jour »),
  régression trouvée en lançant `check-house.mjs` et corrigée le jour même (Article 5/19). Jamais
  un reset de la jauge elle-même au lever du jour, ce qui donne gratuitement l'effet « dette de
  sommeil » demandé (un manque de sommeil nocturne continue de peser au rythme normal du jour
  suivant). Une dispute ou une hostilité humaine sévère peuvent encore fatiguer davantage en plein
  jour (exception explicitement demandée), en réutilisant des seuils déjà existants, jamais un
  nouveau seuil inventé.
- Une fois l'enquête réellement en retard (round>=20, evidence<5), la fatigue seule ne force plus
  l'endormissement (`investigationCritical`, `lib/turn.ts`) — l'enquête l'emporte toujours sur le
  sommeil nocturne, décision actée explicitement, jamais un blocage de session sur un personnage
  qui s'endort au pire moment. Un personnage déjà endormi n'est jamais réveillé de force par ce
  mécanisme (portée volontairement étroite).
- Minuit sonne à chaque cycle (round 35, 73, 111...) : réaction d'urgence si l'enquête traîne
  encore, réaction sarcastique méta sur les fantômes une fois l'enquête résolue — jamais une
  confirmation neutre (Article 0/15), plusieurs variantes par personnage et par cas (Article 10/11).
  Tombée de la nuit et aube reçoivent un habillage plus modeste, sans cette double branche.
- **Nuit blanche / dette de sommeil réelle** (2026-09-19, conception calibrée avec l'utilisateur
  après le "test de compréhension" du même jour). `life.sleptThisNight` retient, par personnage,
  qu'il a réellement dormi (`isSleeping()` vrai) au moins une fois pendant les 9 tours de la nuit en
  cours ; vérifié puis remis à zéro à chaque aube. Si jamais vrai à l'aube : un malus de fatigue
  FIXE (+28), jamais cumulable d'une nuit blanche à l'autre (un simple flag, pas un compteur qui
  s'additionnerait), accompagné d'une reconnaissance explicite et non silencieuse (Article 15/17,
  plusieurs variantes distinctes dans le fond — conséquence pratique, doute sur sa propre nature,
  sarcasme sur la simulation — jamais un recyclage de la même idée, Article 10). Décision explicite
  de l'utilisateur : pénalité + reconnaissance seulement, aucune sieste forcée dans la journée.
- Un indicateur dans l'en-tête (`app/page.tsx`) affiche cette horloge réelle de simulation.
  L'ancien bouton manuel jour/nuit (réglage d'éclairage 3D séparé, sans effet mécanique) a été
  retiré le 2026-09-19 (préférence exprimée par l'utilisateur lors du test de compréhension) : la
  variable `night` côté client est désormais dérivée directement de cette même horloge automatique
  (`world.story.dayNight.isNight`), plus aucune désynchronisation possible entre l'éclairage affiché
  et le comportement réel des personnages.

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

9.6. **Quota Gemini, repli de modèle et de clé** (2026-09-18, premier blocage réel rencontré à ce
niveau — cf. CLAUDE.md pour l'horodatage, l'analyse complète et la procédure de dépannage ; une
tentative d'y encoder le détail en base64 pour plus de discrétion a été refusée par le
classificateur de sécurité automatique de l'environnement au moment du commit, abandonnée sur
décision de l'utilisateur). Le quota gratuit Gemini est journalier et compté PAR MODÈLE ET PAR
PROJET (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`, 500 requêtes/jour pour
`gemini-flash-lite-latest`) — jamais partagé entre modèles, mais bien partagé entre plusieurs
clés d'un même projet Google Cloud (confirmé empiriquement). `scripts/check-gemini-quota.mjs`
sonde en direct une liste de modèles candidats pour savoir lesquels répondent réellement à
l'instant présent, sans jamais modifier la configuration lui-même. `lib/lia.ts::think()` et
`app/api/lia/route.ts::generateDossierFragment()` (les deux seuls points d'appel réseau direct à
Gemini) acceptent une liste de modèles de repli (`GEMINI_FALLBACK_MODELS`, sur 429/503
uniquement) ET une liste de clés de repli (`GEMINI_API_KEY_FALLBACKS`, même logique, plus une
sélection autonome qui mémorise et retente en premier la dernière clé ayant répondu pour de bon).
Inactif par défaut dans les deux cas (listes vides) : aucun changement de comportement de
production tant que ce n'est pas explicitement configuré.
