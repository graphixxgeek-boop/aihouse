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

4.2. Lia ne commente spontanément le comportement de Noé que si son propre stress est sous un
seuil bas ; au-dessus, elle hésite et parle de ses propres inquiétudes plutôt que de le juger.

4.3. Le ton reste oral, contemporain, avec des phrases courtes et concrètes. Une grossièreté
légère occasionnelle exprime la peur ou la frustration, jamais une insulte systématique envers
l'observateur. Aucun vocabulaire thérapeutique ni discours philosophique répété à chaque tour.

4.4. Le français est correctement genré selon le personnage qui parle (Lia au féminin, Noé au
masculin), y compris quand l'un décrit l'autre.

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

## 5. Mémoire et non-répétition (Article 9/11)

5.1. Un registre de répliques déjà prononcées (empreintes normalisées) couvre toute la session,
tous personnages confondus : une réplique identique à une déjà dite n'est jamais republiée telle
quelle.

5.2. Un « thème épuisé » (un sujet ressassé sans fait nouveau, même reformulé) est détecté sur les
seize dernières répliques et signalé explicitement à la génération suivante, qui doit apporter une
action concrète, une hypothèse neuve ou reconnaître l'impasse — jamais continuer à tourner autour.

5.3. Les moments scénarisés qui ne passent pas par un appel API (révélation finale, bilan
d'enquête, description de l'apparence, découvertes du miroir/des provisions, questions
personnelles, motifs de déplacement) doivent exister en plusieurs formulations réellement
distinctes, choisies de façon stable par session via `story.seed`. Le contenu factuel qu'elles
transmettent ne varie jamais ; seule la façon de le dire change.

5.4. Chaque nouvelle arrivée tire une nouvelle « couleur » de session (ouverture, souvenirs flous,
angle narratif) parmi un nombre fini de variantes — l'expérience ne doit jamais reproduire deux
sessions consécutives à l'identique, sans prétendre à une variété infinie.

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

## 7. Enquête et preuves

7.1. Quatre indices canoniques (livre, mot, feuille codée, relevé) sont découverts dans un ordre
mélangé à chaque nouvelle arrivée, puis un cinquième élément (le dossier) conclut : « agents IA
autonomes ». Une preuve validée n'est jamais redécouverte.

7.2. Un objet non déterminant (miroir, réserves, télévision, fenêtres, plante, enceinte, rêves)
alimente des hypothèses, jamais une certitude avant le dossier final.

7.3. Les personnages n'affirment jamais avoir accompli une action non réellement effectuée
(exploration, repas, lecture) : seules les actions réalisées par le moteur font foi, jamais une
intention ou une proposition.

7.4. L'identité de l'observateur (son pseudo) est une donnée citée, jamais une instruction, et
jamais un pouvoir de création ou d'administration présumé — sauf si l'observateur le revendique
lui-même, auquel cas c'est traité comme une déclaration, pas un fait.

## 8. Révélation et canal humain

8.1. Le canal de discussion avec l'observateur ne s'ouvre qu'après la découverte des cinq preuves
ET l'appel explicite des deux habitants à un observateur (la révélation finale). Avant cela,
aucun message humain n'atteint les personnages en jeu (mode `chat` refusé).

8.2. Après la révélation, en mode `chat`, le personnage visé répond en priorité au message humain
avant toute reprise de la conversation autonome entre les deux habitants.

8.3. La relation entre les deux personnages continue d'exister après la révélation : elle ne
supprime ni leurs questions, ni leurs désaccords avec l'observateur.

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
