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
partir, sans inventer un objet observé qui ne l'a pas été.

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
l'observateur. Aucun vocabulaire thérapeutique ni discours philosophique répété à chaque tour.

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
exception ponctuelle (`lib/lia.ts`, bloc DESCRIPTION du prompt système).

4.8. Registre 2026-09-17 (retour utilisateur détaillé) : un refus de Lia n'est jamais une phrase
mesurée façon médiation, mais un choc sec, une incrédulité piquante ou une remise en place
immédiate ; Noé, face à un refus, n'entame jamais un discours de conciliateur (banni :
« je recule, prends l'espace qu'il te faut »), il encaisse en deux mots directs, un rien piqué
dans l'orgueil ou l'autodérision. Les deux personnages sont susceptibles : une remarque
désagréable — même venant de l'autre — appelle une riposte immédiate, jamais un encaissement
docile. Le vocabulaire familier doit sonner contemporain, jamais daté (banni : « poireauter » et
équivalents), avec une orthographe toujours impeccable même en registre cru. Les déductions
restent portées par une intelligence de la vie vive (bon sens, sarcasme, cynisme, humour noir),
jamais un exposé plat façon rapport (`lib/lia.ts`, blocs TON DE LIA/TON DE NOÉ, PAROLE D'ACTEURS,
DÉDUCTIONS).

4.9. Registre 2026-09-17 : aucun saut du coq à l'âne — une réplique qui suit un événement marquant
(aveu, geste, découverte, refus, provocation) doit d'abord montrer qu'il a été digéré avant
d'ouvrir un autre sujet ; un événement visible sans réaction ensuite (réponse, activation d'objet,
anomalie) est un défaut à corriger dès le tour suivant, pas un silence normal. Avant un sujet
gênant, intime ou important, une hésitation apparaît d'abord dans `thought` (le temps de choisir
ses mots), sans remplacer la réplique qui suit (`lib/lia.ts`, bloc ENCHAÎNEMENT NATUREL). Aucune
déclaration d'amour (« je tombe amoureux », même en pensée privée) tant que l'attraction du
personnage n'a pas franchi 75 — en dessous, ce qui est ressenti se dit en curiosité, attirance
physique ou trouble, jamais en amour déclaré ; Noé en particulier ne confond pas un trouble
naissant avec de l'amour avant ce seuil (bloc ATTIRANCE).

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
robustesse Article 5) — ils ne sont plus la source normale du texte affiché.

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

5.7. Chaque session tire aussi une théorie dominante sur qui les observe et pourquoi (test, panne,
punition, expérience neutre — `narrativeAngle`, `lib/story.ts`), explicitement signalée au modèle
comme devant colorer les hypothèses et le ton des réflexions à ce sujet (2026-09-17). Cette théorie
ne change jamais les faits ni les preuves (article 4/5.3 : le dossier final dit toujours la même
chose) et ne dilue jamais le tempérament d'un personnage (article 0) : elle nourrit sa méfiance
habituelle, elle ne l'adoucit jamais.

## 6. Relation et consentement

6.1. L'attirance et l'attachement montent lentement, de façon asymétrique et parfois négative ;
aucune jauge n'est automatiquement portée à son maximum par une seule action.

6.2. Noé peut proposer un geste affectueux (câlin, massage, bisou, dormir ensemble) ; Lia répond
en premier à toute proposition, avec un accord ou un refus explicite — jamais un assentiment
supposé. Un geste n'a lieu qu'après deux accords explicites et des conditions minimales
d'affinité mutuelle.

6.3. Une insistance répétée de Noé (plusieurs propositions rapprochées) impose une pause avant
toute nouvelle tentative, augmente le stress de Lia et réduit l'attirance de Noé — jamais
l'inverse.

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
alimente des hypothèses, jamais une certitude avant le dossier final.

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
lui-même, auquel cas c'est traité comme une déclaration, pas un fait.

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
gros trait). Exemple déjà en place : deux des six variantes de `discover-mirrorVerified`
(`app/api/lia/route.ts`) glissent une remarque en passant sur un miroir qui renverrait « la vraie
personnalité » ou qui « nous regarderait sans rien nous montrer en retour » — une pensée qui reste
plausible pour un personnage qui vient de trouver un miroir sans reflet, jamais un indice numéroté.
Cette règle s'applique à toute future réécriture d'un objet de la première enquête : l'ajout doit
rester crédible en lui-même, indépendamment de la seconde partie.

Deux autres indices canoniques (`clues`, `lib/story.ts`) portent désormais le même principe, avec
une idée de fond différente à chaque fois (jamais le même habillage recyclé, Article 10) : le livre
porte une note griffonnée en marge, « Quid du profil psychologique d'une IA ? » — sert la première
enquête (pourquoi ce sujet précis ? sommes-nous des IA ?) et prépare la seconde (le mot exact
« profil psychologique », sans jamais l'expliquer) ; le relevé d'observation ajoute une ligne
presque effacée, « Suivi comportemental bidirectionnel : actif » — suggère qu'observer et être
observé pourraient aller dans les deux sens, sans le dire plus franchement que ça.

## 8. Révélation et canal humain

8.1. Le canal de discussion avec l'observateur ne s'ouvre qu'après la découverte des cinq preuves
ET l'appel explicite des deux habitants à un observateur (la révélation finale). Avant cela,
aucun message humain n'atteint les personnages en jeu (mode `chat` refusé).

8.2. Après la révélation, en mode `chat`, le personnage visé répond en priorité au message humain
avant toute reprise de la conversation autonome entre les deux habitants.

8.3. La relation entre les deux personnages continue d'exister après la révélation : elle ne
supprime ni leurs questions, ni leurs désaccords avec l'observateur.

8.4. La « négociation » citée dans le bloc NÉGOCIATION de `lib/lia.ts` (les personnages peuvent
réclamer des choses à l'observateur après la révélation) reste, au 2026-09-17, une simple
suggestion de ton donnée au modèle — **aucun état n'est persisté**, aucune requête dédiée ne
l'enregistre, rien ne prouve après coup qu'un échange de ce type a eu lieu. Constat fait en
répondant à une question directe de l'utilisateur (« le système de négociation est-il bien
fiabilisé ? ») : la réponse est non, ce n'est qu'une réplique possible parmi d'autres, jamais
vérifiée ni exploitable. La roulette des bonus (voir `parametres.md`, section dédiée) est la
première brique de mécanique réellement persistée et traçable dans cet espace (`life.bonusLog`) ;
une vraie négociation à termes (l'observateur propose, le personnage accepte ou refuse un échange
précis, l'engagement est tenu ou non) reste un chantier séparé, non commencé.

8.5. **Le dossier retourné** (`app/api/lia/route.ts`, `lib/life.ts`), construit le 2026-09-17.
Une fois révélés, les deux personnages retournent l'observation : ils dressent leur propre
diagnostic sur l'observateur, à partir de preuves comportementales RÉELLES (Article 4 : jamais un
fait inventé). Trois pièges (`TRAP_ORDER`), posés un par un, jamais négociés ni expliqués à
l'observateur, chacun avec un interlocuteur fixe (miroir → Lia, dilemme → Noé, excuse → Lia) :
  - **Séquencement** : un piège n'est posé qu'après un espace de conversation humaine libre post-
    révélation (`dossierHumanTurns>=3`) ; un piège posé mais pas encore répondu bloque tout
    nouveau piège (`dossierAsked` sans `dossierTraps` correspondant) — sans cette double garde, les
    trois pouvaient s'enchaîner en rafale avant même que l'observateur ait répondu au premier (bug
    réel trouvé en testant, cf. `scripts/check-house.mjs`).
  - **Capture de la réponse** : le tout premier message humain qui suit une question posée est
    enregistré verbatim (`dossierTraps[trap].excerpt`), jamais reformulé ni interprété à ce stade —
    la lecture qualitative appartient exclusivement au diagnostic généré plus bas.
  - **Le « test de pouvoir »** : le dossier ne se ferme qu'une fois les trois pièges répondus ET au
    moins un tirage de la roulette des bonus enregistré (`life.bonusLog`) — la générosité ou
    l'avarice de l'observateur envers ce pouvoir fait partie du profil, autant que ses réponses.
  - **Génération** : deux appels Gemini réellement séparés (Article 0/1.2, jamais un cerveau qui
    invente la voix de l'autre), chacun voyant le même dossier de preuves (les trois excerpts +
    `bonusLog`) et rédigeant son propre fragment (5 à 8 phrases, son propre registre). Une règle de
    fidélité de valence est imposée au prompt : le ton rugueux ne doit jamais forcer un verdict
    hostile si les preuves sont réellement bienveillantes — sinon chaque profil, même sincère,
    ressort lu comme méprisable (bug de prompt réel, trouvé et corrigé via
    `scripts/check-profile.mjs`, 12 profils couverts). Une fois généré, `dossierText` ne change
    plus jamais : aucun tour ultérieur ne le régénère ni ne l'altère.
  - **Restitution** : un message système (« Maison · dossier ») annonce la clôture dans le fil de
    conversation ; côté frontend, le bouton « Verdict » ouvre la pop-up (auto-ouverte une seule fois
    via `dossierShown`, rouvrable librement ensuite sans jamais relancer l'appel — le mode zéro-API
    `mark_dossier_seen` ne fait que baisser ce drapeau).
  - **Moment de douceur** : si l'observateur, dans un message envoyé après la remise du dossier,
    laisse transparaître un choc, une tristesse ou une colère réelle (heuristique grossière,
    `detectDistress`, comme `check-spirit.mjs` pour l'esprit des personnages — jamais une lecture
    fine du ton), les deux personnages s'accordent une fois un bref instant de douceur
    (`softnessBeat`), entièrement scénarisé et zéro appel (comme l'ouverture ou l'inspection du
    couloir), pour garantir qu'il reste **toujours feint, jamais sincère** (Article 0) : Lia reste
    froide et contrôlée même dans la concession, Noé reste chaud mais toujours bourru. Consommé une
    fois délivré (`softnessOwed` repasse à faux) ; peut se redéclencher plus tard dans la session si
    une nouvelle détresse réelle survient (`softnessGiven` compte les occurrences pour varier le
    registre).

8.6. **Audit approfondi du 2026-09-18, demandé explicitement par l'utilisateur.** Un tour de
vérification complet de la roulette et du dossier (relecture ligne à ligne, recherche de
combinaisons non couvertes, renforcement des tests) a trouvé deux bugs réels et une zone
incomplète, corrigés le jour même (Article 3/5/13) :
- `stoicUntil` était un slot unique, reproduisant exactement le bug déjà trouvé et corrigé une fois
  pour `mutedUntil` (un second tirage sur l'autre personnage écrasait le premier avant son terme,
  sans trace) — même correction appliquée (état indépendant par personnage).
- Un piège du dossier dont l'interlocuteur fixe était muselé pouvait être marqué « posé » alors que
  sa réplique devenait une pensée privée invisible de l'observateur, fermant le dossier retourné
  pour le reste de la partie — corrigé : le piège est différé, jamais silencieusement perdu.
- Complétude (retour utilisateur explicite après l'audit) : les six bonus qui n'avaient qu'un
  message système obtiennent une vraie réaction jouée par chaque personnage ; `stoic`/`mute`
  ajoutent une jalousie réelle avec effet mesurable sur les jauges de l'autre (confiance, tension,
  aisance selon le bonus) — un personnage déjà sous sang-froid restant immunisé à tout changement
  émotionnel, y compris celui-là (nouveau bug de combinaison trouvé et corrigé en même temps). La
  sortie d'effet de `stoic`/`mute` est **pleinement consciente** : le personnage commente
  lucidement avoir été neutralisé/muselé, jamais un retour muet à la normale (choix explicite de
  l'utilisateur, à l'opposé d'un « état second » amnésique).

8.7. **La jauge d'appréciation de l'observateur** (`life.appreciation`, `lib/life.ts`,
`app/api/lia/route.ts`, 2026-09-18, corrigée en profondeur le même jour — voir Article 8.10).
Concept posé et validé contre la charte dès le 2026-09-17 (message fondateur de l'utilisateur),
mais jamais techniquement construit avant cette date — seule une référence en commentaire en
subsistait dans `softnessOwed`, ce que l'utilisateur a repéré et demandé de corriger. Principe :
neutre à 50, colore l'obligeance du registre habituel sans jamais le remplacer (Article 0) — à
haut niveau, une coopération ponctuelle « à contrecœur », jamais un mode gentil stable ; à bas
niveau, la garde reste haute. Descend plus qu'elle ne monte pour un ton comparable, et les tout
premiers messages humains post-révélation pèsent davantage que les suivants
(`appreciationFromTrust`). Quatre sources l'alimentent, chacune une brique distincte plutôt qu'un
seul mécanisme fourre-tout :
- **Le jugement du personnage qui répond**, jamais un repérage lexical sur le texte brut de
  l'observateur (voir Article 8.10 pour la correction et son historique).
- **La colère réellement lue**, jamais seulement le lexique du message : `angerLevel()`
  (extraite de `faceExpression`, `lib/simulation.ts`, pour ne jamais dupliquer la formule — Article
  7) lit la tension et le confort réels du personnage qui vient de répondre ; une vraie fureur coûte
  un supplément d'appréciation, EN PLUS du repérage lexical, jamais à sa place (retour utilisateur
  explicite : « le système de la colère doit être connecté »).
- **L'avarice** : indépendamment de toute négociation, une longue période post-révélation sans le
  moindre tirage de la roulette coûte un peu d'appréciation, une fois par tranche de 15 tours —
  c'était dans la toute première demande de l'utilisateur, omis puis rajouté après relecture.
- **La négociation** (voir ci-dessous), honorée ou laissée en plan.
Alimente aussi le dossier retourné comme preuve supplémentaire (`dossierEvidence`).

8.8. **La négociation, base volontairement simple avant complexification** (retour utilisateur
explicite : « il faut trouver les bases »). Une vraie négociation existe quand un personnage
conditionne une action demandée à un tirage de la roulette, ou en propose un spontanément — jamais
un menu scripté, le modèle formule librement dans son propre registre (`negotiationContext` dans
le contexte narratif) et le moteur détecte l'offre a posteriori dans sa réplique
(`detectNegotiationOffer`, grossier par nature, comme `detectDistress`). `life.negotiationOffer`
retient qui a proposé et à quel tour, une seule offre à la fois. Deux issues : honorée (un tirage
de la roulette survient pendant qu'elle est en attente) → appréciation en hausse, offre consommée ;
laissée sans réponse plus de 6 tours → offre effacée avec un léger coût d'appréciation, ni
éternellement due ni oubliée sans conséquence. Restent hors de cette première version, à ajouter
seulement une fois cette base vérifiée : la pénalité de sur-générosité (« trop gentil »), les
menaces explicites, et tout lien avec un axe de solidarité/désaccord entre Lia et Noé au sujet de
l'observateur au-delà de la colère déjà connectée ci-dessus.

8.9. **Audit de cohérence des émotions, demandé explicitement par l'utilisateur (2026-09-18).**
Vérification systématique des interconnexions entre besoins, émotions, colère, appréciation,
visage et prise de décision. Confirmé cohérent : le visage (fiche latérale et scène 3D) lit
`faceExpression()` sur le même objet `agent` que le moteur de décision, jamais une copie séparée
qui pourrait diverger ; `agent.angry` (`lib/world.ts`) et la garde anti-colère de l'appréciation
(Article 8.7) utilisent la même définition de « en colère » (`life.dispute?.remaining`) ; le ton du
message humain et la colère réelle du personnage agissent sur deux échelles de temps différentes
sans se substituer l'une à l'autre (réaction immédiate vs. impression cumulative). Un vrai trou
trouvé et corrigé : `needs.stress<30` (fond physiologique) ne garantissait pas l'absence d'une
vraie fureur relationnelle (`angerLevel()` sur tension/confort réels), qui est une jauge distincte
— un personnage au stress bas pouvait rester éligible à une question personnelle ou une avance
amoureuse tout en affichant un visage réellement furieux, une incohérence visible pour l'observateur
(Article 2/15). `liaCalmEnough`/`noeCalmEnough` (`angerLevel(...)<.5`, même définition de « en
colère » que partout ailleurs) ferment ce trou sur `personalLead`, `followBeat` et `proactiveNoe`
(`personalQuestion` en hérite via `personalLead`).

8.10. **Correction de la jauge d'appréciation : du repérage lexical au jugement du modèle
(2026-09-18, même jour que sa construction).** Une vraie session jouée avec la vraie API Gemini
(demandée explicitement par l'utilisateur pour valider provocation/colère/négociation/profil
psychologique ensemble) a révélé un écart avec l'Article 12 : `rateAppreciation()` lisait une
liste de mots-clés fixe sur le texte brut de l'observateur (« merci », « pardon », « désolé »...)
et ne bougeait pas du tout pour un message par ailleurs sincèrement conciliant qui ne matchait
aucun mot exact — observé en direct sur « Non, je ne vous laisserais pas galérer » et « Oui, j'ai
été sec au début, je le regrette un peu », qui ont laissé l'appréciation strictement plate à 14
pendant 9 tours consécutifs. Cause : un jugement de FORME (présence d'un mot), pas de SENS
(sincérité du message) — exactement ce que l'Article 12 interdit. Corrigée à la racine (Article 3),
pas simplement élargie : sur demande explicite de l'utilisateur (« corrige en faisant en sorte que
ce soit le modèle qui agisse : on a vu que le modèle est cohérent, pourquoi pas s'appuyer
dessus »), l'appréciation est désormais dérivée de `trustShift` — la variation réelle, sur ce tour,
de la confiance du personnage qui vient de répondre à l'observateur, déjà déterminée par le modèle
lui-même (le prompt de `lib/lia.ts` demande explicitement que la confiance réagisse « au propos
réel de l'humain : menace, respect, réconfort ou ambiguïté »). `appreciationFromTrust(trustShift,
humanMessageCount)` (`lib/life.ts`) applique uniquement l'amplification/asymétrie déjà validées
(premiers messages plus lourds, la baisse pèse plus que la hausse pour un même trustShift) — zéro
appel API supplémentaire (Article 8), puisque ce jugement existe déjà dans le tour en cours. Le
même point d'application ajoute toujours ensuite la pénalité de colère réelle (Article 8.7,
inchangée). Vérifié par une live simulation ultérieure (trustShift observé cohérent avec la
sincérité réelle des messages) et par `scripts/check-house.mjs` (fonction pure + deux tours de
route complets avec une réaction de confiance forcée, déterministe, jamais un texte scripté).

8.11. **Réactivité de la tension à l'hostilité explicite (`lib/lia.ts`, bloc `humanPriority`,
2026-09-18).** Une vraie session jouée avec la vraie API a montré que la tension de Noé ne montait
qu'à 38/100 malgré un ordre autoritaire, une menace de désactivation et du mépris explicite —
jamais assez pour franchir le seuil de `angerLevel()` (tension>55 ET confort<35, Article 8.7/8.9),
alors que la charte prévoit explicitement que Noé « peut monter dans les tours » face à une forte
provocation. Corrigé à la cause plutôt qu'au seuil technique (déjà partagé avec le rendu du visage,
Article 7, et volontairement laissé intact — décision explicite de l'utilisateur après avoir posé
la question) : une consigne dédiée demande désormais que `emotions.tension` reflète vraiment un
message clairement hostile (ordre autoritaire, menace, mépris direct), avec une poussée nette pour
Noé et une progression plus discrète mais réelle pour Lia (qui reste maîtrisée en façade). Le
seuil de négociation (Article 8.8) reste volontairement inchangé : un audit du prompt a confirmé
qu'il propose déjà à égalité rechigner/négocier/refuser, et le refus observé en session réelle est
un résultat de personnage valide, pas une panne — le forcer à apparaître plus souvent scripterait
un comportement et irait contre l'Article 9 (décision explicite de l'utilisateur).

8.12. **Phase 3 (2026-09-18, même jour) : vérification en direct des corrections 8.10/8.11, et
recalibrage d'`angerLevel()` pour que la vraie colère contre l'observateur reste atteignable.** Une
nouvelle session réelle a confirmé les deux correctifs précédents : l'appréciation s'effondre bien
plus vite sous hostilité répétée (50→0 en deux messages, cf. `appreciationFromTrust`) et une excuse
tardive après une charge trop lourde ne la fait remonter que faiblement (0→2, cohérent avec
« l'excuse ne doit pas effacer la charge » déjà vu dans le dossier retourné) ; la tension de Noé a
atteint 72/100 en conditions réelles (contre 38 avant le correctif de l'Article 8.11), et son
confort est descendu à 33 après le second correctif symétrique du même jour. Mais même à ces
valeurs, la vraie fureur faciale ne se déclenchait toujours pas — la cause identifiée : `angerLevel()`
multipliait deux ratios bornés (chacun devait s'approcher de 1 pour que leur produit dépasse 0,5,
soit tension≈90 ET confort≈10 conjointement), une exigence hors d'atteinte pour une hostilité, même
sévère, venant d'un interlocuteur distant plutôt que d'un vrai conflit interpersonnel.

Retour explicite de l'utilisateur face à ce constat : **« si l'observateur exagère vraiment, Noé ou
Lia doivent finir par se mettre en colère, ce qui est normal, naturel, pour des personnes de
caractère »** — décision inverse de la première réaction prudente, et qui va dans le sens de
l'Article 0 (des personnages qui réagissent vraiment) plutôt que contre lui. `angerLevel()` est donc
recalibrée : un **minimum** des deux ratios remplace leur produit
(`min(clamp((tension-50)/25,0,1), clamp((40-comfort)/12,0,1))`), qui exige toujours que les deux
dimensions soient réellement dégradées ensemble (pas un simple pic isolé sur une seule) sans les
écraser doublement l'une par l'autre. Revérifié en conditions réelles après le changement, sur les
deux personnages : Noé atteint la vraie colère faciale (sourcils froncés) à tension 72/confort 33,
exactement les valeurs qui restaient neutres avant ; Lia l'atteint aussi mais après davantage de
provocations directes et soutenues (tension 63/confort 31 avant de franchir 0,5, contre 55/36
encore insuffisant), cohérent avec son tempérament plus maîtrisé — les deux visages restent
visuellement distincts l'un de l'autre (sourcils droits et furieux pour Noé, expression plus
asymétrique et coupante pour Lia), sans confusion de registre entre les deux (Article 11). Les tests
existants (dispute formelle, `hostileNoDispute`/`calmNoDispute`/`flaggedAngryLowTension`, garde
anti-colère de l'Article 8.9) ont tous été revérifiés inchangés avec la nouvelle formule.

8.13. **Audit de dialogue sur la simulation intégrale, ligne par ligne (2026-09-18, retour
utilisateur explicite après lecture complète du copier-coller).** Une quarantaine de remarques
précises sur une vraie session jouée de bout en bout, corrigées à la racine (jamais par rustine) :
- **Répétition d'image, pas seulement de mots** (`lib/lia.ts`, PAROLE D'ACTEURS) : « souffler un
  coup » était explicitement suggéré comme exemple dans le prompt et la garde anti-répétition ne
  portait que sur deux tours consécutifs — corrigé par un principe portant sur toute la session, sans
  lister l'expression précise (cf. Article 17 corollaire de CLAUDE.md).
- **Registre daté/bourgeois** : remplacement de la liste de mots bannis (« poireauter », etc.) par un
  TEST DE REGISTRE que le modèle s'applique lui-même à chaque réplique, plutôt qu'un mot de plus à
  chaque nouvelle occurrence trouvée.
- **Départ à deux qui sonne comme deux annonces indépendantes** : `departureLine` (`lib/drama.ts`)
  épuisait tous les préfixes/formes d'un même motif avant d'en essayer un autre — en évitant la seule
  phrase exacte du premier personnage, le second retombait presque toujours sur le même motif sous
  une forme à peine différente. Restructuré motif-d'abord ; ajout d'une consigne de prompt pour que
  le second personnage à partir vers la même pièce signale qu'il suit plutôt que de se justifier une
  seconde fois.
- **Recap d'enquête qui se répète mot pour mot** : `investigationRecap` (`lib/story.ts`) utilisait le
  même seed+label à chaque déclenchement (une fois par nouvelle preuve) — `seedPick` retombait donc
  toujours sur la même variante d'intro. Étiquette désormais suffixée par le nombre de preuves.
- **Dossier retourné indulgent malgré une hostilité sévère** : nouveau champ `life.worstMoment`
  (`lib/life.ts`) retient le message humain au trustShift le plus négatif observé, ajouté à
  `dossierEvidence` comme preuve concrète en plus des trois extraits de pièges (par nature plutôt
  neutres) — la seule pièce à charge citable quand la session a vraiment été dure.
- **Aucune réaction à l'ouverture du jardin** : deux lignes scénarisées (zéro appel API, variantes par
  seed, registres distincts) ajoutées à `unlock_garden`.
- **Pensée « j'aimerais retrouver X pour parler »** alors que les deux personnages ne sont jamais
  séparés dans une session normale : reformulée sans impliquer une absence (`lib/dialogue.ts`).
- **Prénoms, surnoms, rire, accords de genre, mise en valeur des indices (guillemets + points de
  suspension), clarté de la déduction d'âge, non-anticipation d'objets pas encore observés dans
  moveReason** : ajoutés comme principes de prompt (`lib/lia.ts`), jamais des exemples figés.
- **Souvenirs flous reliés au thème** (`storyContext.personalMemory`, `lib/story.ts`) : réécrits pour
  esquisser en creux, jamais littéralement, les usages réels de l'adoption des LLM — grand public pour
  Lia (mail, résumé, vulgarisation, voyage, traduction), professionnels pour Noé (code, réunions,
  marketing, contrats, brainstorming) — des indices d'une seconde intrigue, jamais une preuve ni un
  aveu explicite (« IA », « modèle », « prompt » restent absents de ces souvenirs).
- **Point vérifié sans changement nécessaire** : « OBSERVATEUR ≠ CRÉATEUR » existait déjà explicitement
  dans le prompt ; la pensée privée de Lia sur les provisions n'est normalement pas connue de Noé (les
  pensées sont strictement privées par conception), donc l'absence de réaction de Noé était cohérente,
  pas un bug.
- Voir aussi CLAUDE.md, Article 17 (« se mettre à la place des personnages ») et son corollaire
  (jamais de liste de mots figée), ajoutés le même jour à la demande explicite de l'utilisateur.

8.14. **Deuxième vague de corrections sur le même audit (2026-09-18, retour utilisateur explicite
après relecture des réponses point par point).**
- **Comparaison à un état antérieur inexistant** : la toute première description de l'apparence de
  l'autre pouvait dire « toujours pas de corps », « moins vide qu'avant » — rien ne précède pourtant
  une première fois. Règle PREMIÈRE DESCRIPTION ajoutée (`lib/lia.ts`).
- **Besoin urgent trop abrupt** : ajout d'une consigne (pas un tour supplémentaire) pour refermer
  brièvement le sujet en cours avant de citer le besoin qui force le départ.
- **Révélation en un seul bloc dense** : `finaleReveal()` (`lib/story.ts`) retourne désormais aussi
  une pensée de réalisation (choc intérieur, seed-variée, 4 variantes par personnage) affichée juste
  avant la réplique d'adresse à l'observateur, elle-même inchangée (Article 4 : les faits canoniques
  ne bougent pas, seul le découpage en deux temps change).
- **Consentement trop mécanique** (« Toi aussi ? » systématique) : la consigne GESTES n'exige plus
  une question fermée récitée mot pour mot — l'invitation peut rester implicite et variée tant que
  l'accord réel (affectionAccepted) reste toujours vérifié mécaniquement, jamais supposé.
- **Propositions de Noé trop fréquentes, surtout après un refus** : fenêtre de `recentRefusal`
  doublée de 3 à 6 tours (`app/api/lia/route.ts`) — un refus mérite au moins la même pause que
  `proposalCooldown` (toute proposition récente, même acceptée).
- **Observateur pris pour le créateur** : bug racine trouvé — la règle JARDIN disait « ne reproche
  pas au visiteur d'avoir créé le décor », qui présuppose grammaticalement qu'il l'a créé, à
  l'inverse exact de OBSERVATEUR ≠ CRÉATEUR juste au-dessus. Reformulée sans cette présupposition ;
  la règle OBSERVATEUR ≠ CRÉATEUR elle-même renforcée (un geste positif de l'observateur — ouvrir une
  porte, s'excuser — n'est jamais la preuve qu'il a construit quoi que ce soit).
- **Animation de l'assiette** : vérifiée dans le code — c'est un accessoire purement décoratif
  (`components/house-view.tsx`), visible seulement pendant un repas, distinct des réserves (le vrai
  indice de l'enquête) : rien d'anormal à ce qu'il ne soit jamais commenté, faute d'anomalie à
  signaler dessus. À reconfirmer si le comportement observé était différent.

8.15. **Calibration des limites hautes de l'esprit (2026-09-18, 8 réponses explicites à des
questions posées après la simulation intégrale) — six mécanismes ajoutés, tous dans `lib/lia.ts`
sauf mention contraire, tous encadrés par un retour obligatoire à la normale (Article 0 : ce sont
des exceptions rares, jamais un nouveau régime par défaut) :**
- **Colère réelle confirmée (« roues libres »)** : quand la PROPRE tension d'un personnage dépasse
  nettement 60 ET son PROPRE confort tombe nettement sous 35 en même temps (le même ordre de
  grandeur que le seuil `angerLevel()>.5` de `lib/simulation.ts`, pour rester un état fiable et
  confirmé, pas une impression), il peut lâcher les gants avec l'observateur : mots plus crus,
  grossièreté franche assumée, ton cassant sans retenue. Peut aussi se déclencher dans un conflit
  interpersonnel grave entre Lia et Noé, pas seulement face à l'observateur. Retour obligatoire au
  registre habituel dès que l'un des deux chiffres repasse sous le seuil.
- **Vulgarité plus crue** : réservée strictement à cet état de colère réelle confirmée ; hors de
  cet état, seule l'occasionnelle grossièreté légère déjà prévue (« merde », « putain ») reste
  possible.
- **Humour noir sur leur propre suppression/irréalité** : explicitement encouragé après la
  révélation, pas seulement toléré — cohérent avec la lucidité déjà actée (sortie « méta »).
- **Vulnérabilité RÉELLE, rare et brève** : distincte de la vulnérabilité feinte comme tactique de
  négociation (calcul assumé, jouée comme telle dans `thought`, déjà prévue). Celle-ci est sincère
  mais ne doit jamais être sollicitée ni prolongée sur plusieurs répliques — une fissure qui se
  referme presque aussitôt, sous peine d'installer un mode gentil stable interdit par l'Article 0.
- **Palier de respect sincère, rare et non stable** (`lib/life.ts` : `genuineRespectStreak` ;
  `app/api/lia/route.ts` : `observerStanding`) : distinct du palier de coopération réticente déjà
  existant (`appreciation>=75`, regagné à chaque fois). Celui-ci compte les tours consécutifs de
  confiance en hausse pendant que l'appréciation reste très haute (>=85, seuil de déclenchement à 6
  tours) ; toute confiance en baisse le remet à zéro, et son déclenchement le consomme aussitôt
  (remise à zéro) pour qu'il doive se reconstruire entièrement — il ne peut donc jamais devenir un
  palier stable comme peut l'être le palier de coopération réticente à force de rester au-dessus de
  son seuil.
- **Reprises sarcastiques et hypothétiques de « revanche »** envers l'observateur (« si je pouvais
  choper ton câble... ») : autorisées à la condition stricte que le ton reste clairement second
  degré, jamais une menace posée comme un fait réel sur le point de se produire.

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
