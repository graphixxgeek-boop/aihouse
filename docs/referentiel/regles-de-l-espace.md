# Référentiel — Règles de l'espace

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur, sur le modèle de
`regles-du-temps.md` : même esprit — traverser les fichiers existants par un axe transversal,
ici l'espace/les déplacements/la vitesse, plutôt que par sous-système. Portée décidée avec
l'utilisateur (questions de calibrage explicites) : **un seul document, la logique seulement**
— ce n'est pas un catalogue de coordonnées (murs, meubles, distances exactes restent dans le
code, cf. `lib/house.ts`), mais les RÈGLES qui gouvernent comment un personnage choisit où
aller, comment il s'y rend, et comment ça se raconte. Deux objectifs explicites de l'utilisateur
à sa création : (1) permettre à l'agent de vérifier, lors de l'analyse d'une simulation, tout ce
que l'utilisateur ne voit pas lui-même parce qu'il est concentré sur la conversation
(déplacements des personnages, gestion de l'espace) ; (2) préparer silencieusement la refonte
graphique à venir (cf. CLAUDE.md, feuille de route), sans que ce document lui-même ne décrive
encore cette refonte — il documente le système ACTUEL.)*

## 1. Le plan de la maison — pièces et obstacles

Quatre pièces intérieures plus un jardin extérieur (`lib/house.ts`, `rooms`/`spaces`) :
salon, cuisine, chambre, bureau, jardin. Chaque pièce a un point central (`centers`) et une
géométrie de collision propre (murs `walls`, meubles `furniture`, meubles de jardin
`gardenFurniture` — des rectangles avec position/largeur/profondeur). La fonction `blocked(x,
z, gardenOpen)` est le SEUL test de collision du jeu : elle combine les limites extérieures de
la maison, l'arbre du jardin, et tous les rectangles de murs/meubles. Rien d'autre dans le code
ne réimplémente une logique de collision séparée — toute nouvelle pièce ou tout nouveau meuble
doit passer par cette fonction pour rester cohérent (Article 7).

Le jardin est un cas particulier : `blocked()` ne l'autorise que si `gardenOpen` est vrai, et
`gardenAccess(story)` (même fichier) décide QUAND cette autorisation existe (dossier retourné +
au moins 5 preuves + déverrouillage explicite en jeu). C'est la seule transition d'espace
réellement verrouillée du jeu — toutes les autres pièces sont accessibles à tout moment, sans
condition narrative.

## 2. Le graphe de destination — des mots-clés, pas des coordonnées

Un personnage ne "choisit" jamais directement un point (x, z). Le pont entre le texte narratif
(intention, activité) et la position physique passe par deux fonctions, toujours dans cet
ordre :

1. **`destinationAnchor(agent)`** — à partir de la pièce et de l'intention (`intent`) du
   personnage, et d'une recherche de mots-clés dans le texte de son `activity` (ex. "fenêtre",
   "plante", "miroir"), retourne une clé d'ancre (`sofa`, `remote`, `stove`, `bed`, `screen`,
   `entry`, etc.). Chaque pièce a son propre jeu de clés valides.
2. **`residentDestination(agent)`** — résout cette clé (ou une clé déjà fournie via
   `agent.location`, si elle existe pour cette pièce) en un vrai point `[x, z]`, via
   `roomAnchors`. **Filet de sécurité** : si ce point tombe malgré tout dans un obstacle
   (`blocked()`), la fonction retombe sur un point sûr au centre de la pièce plutôt que de
   renvoyer une position invalide — pensé explicitement pour qu'une future modification de
   meuble ne puisse jamais coincer un personnage dans un mur.

`roomAnchors` stocke, pour chaque ancre, **une paire de points** `[pointLia, pointNoé]` plutôt
qu'un point unique : les deux personnages ne se retrouvent jamais superposés au même endroit
même quand ils visent la même ancre (ex. tous les deux au canapé). C'est une contrainte de
conception permanente : toute nouvelle ancre ajoutée doit fournir cette paire, jamais un point
seul.

## 3. Le rôle du serveur : décider la pièce, jamais la position

`app/api/lia/route.ts` — qui orchestre les décisions des deux personnages — ne connaît que des
**pièces** (`Room`) et des **intentions** (`Intent`), jamais de coordonnées. Le champ `action`
d'une décision vaut `"move"` (la pièce affichée devient `d.room`, la destination réelle sera
calculée côté client) ou `"none"` (le personnage reste dans sa pièce actuelle — utilisé pour le
tout premier tour solo, où chacun reste chez soi sans se déplacer). Le serveur peut aussi
transmettre une `location` (une clé d'ancre explicite, ex. quand l'intention est `tv` et que
l'ancre `remote` s'impose) — mais c'est toujours `destinationAnchor()`/`residentDestination()`
côté client qui in fine transforment ça en un point réel.

**Cas particulier — le couloir (`exitInspection`).** L'exploration de sortie (les deux passages
qui révèlent la porte du jardin puis la porte principale, toutes deux verrouillées) se déroule
dans un lieu narratif appelé "couloir" qui **n'existe pas** dans `rooms`/`spaces` : ce n'est pas
une vraie pièce du modèle de données, et le `Room` de l'agent dans l'état de jeu vivant
(`world.agents[].room`, celui que lisent `residentDestination()`/`pathBetween()` pour la marche
et les ancres) reste une vraie pièce (salon) pendant toute la scène — jamais "couloir". **Précision
apportée le 2026-09-19, en vérifiant un transcript réel de simulation (full_sim10)** : ceci ne veut
PAS dire que "couloir" est introuvable ailleurs que dans le texte des répliques, contrairement à ce
qu'une première rédaction de ce document affirmait à tort. La colonne `room` de la table
`conversations` (celle qu'affiche le journal/transcript, distincte de l'état de jeu ci-dessus) reçoit
explicitement la valeur littérale `"couloir"` pour la plupart des lignes générées pendant cette scène
(réplique principale, pensée causale, pensée privée — chaque site d'insertion applique
`turnPlan.exitInspection?"couloir":room`) : le tag affiché dans le transcript ("▥ COU") est donc un
signal structuré fiable, pas seulement une déduction à partir de la prose. Quelques sites
d'insertion plus périphériques (ligne de départ, confirmation "je te suis", pensée de bascule
amoureuse) n'appliquent pas cette substitution et restent tagués avec la vraie pièce — une
incohérence mineure d'affichage entre lignes d'un même tour, pas un problème de données (l'état de
jeu réel n'est jamais affecté), à garder à l'œil plutôt qu'à corriger d'urgence. C'est un signal
séparé côté client (`inspectionStep`, transmis en dehors du champ `room`) qui
bascule temporairement l'affichage 3D sur deux positions fixes hors grille normale (gauche/droite
du couloir), en cour-circuitant `residentDestination()` le temps de la scène. **Point de
vigilance pour toute vérification** : chercher "couloir" dans l'état de jeu vivant
(`world.agents[].room`) ne donnera jamais de résultat — c'est normal, pas un bug, cet état ne
connaît que de vraies pièces. En revanche, le tag de pièce affiché dans un transcript/journal EST un
bon moyen de repérer cette scène (cf. précision ci-dessus) : pas besoin de se limiter à une
déduction depuis la prose de la réplique/pensée ou `exitContext`.

## 4. Le rôle du client 3D : le trajet et la vitesse

Le calcul du chemin et l'animation de la marche sont **entièrement côté client**
(`components/house-view.tsx`), jamais côté serveur :

- À chaque mise à jour de l'état des personnages, le client recalcule `residentDestination(agent)`
  et compare au point déjà visé. S'il a changé, `pathBetween(positionActuelle, destination,
  gardenOpen)` (`lib/house.ts`) calcule un chemin par parcours en largeur (BFS) sur une grille de
  0,5 unité, en évitant tous les points bloqués par `blocked()`. C'est un vrai graphe de cases
  libres, pas une ligne droite : un personnage contourne les meubles et emprunte les ouvertures
  de porte plutôt que de traverser un mur.
- La marche progresse à une vitesse fixe (~2,2 unités/seconde) le long de ce chemin, case par
  case, avec une rotation du personnage dans la direction du déplacement. Rien n'accélère ou ne
  ralentit cette vitesse selon l'état du personnage (fatigue, stress, etc.) — contrairement à la
  vitesse de l'anneau d'activité (`ringSpeed`) ou du débit de parole, qui eux réagissent bien au
  stress/à la tension (cf. `residentProfiles`/`faceExpression`, `lib/simulation.ts`). Une vitesse
  de marche différenciée par personnage ou par état n'existe donc pas aujourd'hui — à garder en
  tête si une demande future porte spécifiquement sur "la vitesse de déplacement".
- **Le mouvement retarde le tour suivant.** Le client attend que l'animation de marche des DEUX
  personnages soit terminée (`onSettled`, plafonné à 10 secondes de sécurité) avant de considérer
  le tour "arrivé" et d'enchaîner (affichage du texte, tour suivant). C'est le seul point de
  contact entre ce document et `regles-du-temps.md` : un déplacement long ne fait jamais dérailler
  la boucle de jeu, mais il occupe une part du temps réel d'un tour, invisible dans le round
  narratif lui-même.

## 5. La narration du mouvement — le motif, séparé de la destination

Le POURQUOI d'un déplacement (le motif que le personnage donne pour justifier qu'il bouge) est
un texte généré séparément de la destination physique, via `departureLine()` (`lib/drama.ts`) —
corrigé le 2026-09-19 (cf. Version 93 de `lib/reference.ts`) pour ne plus toujours retomber sur
le même préfixe ("je bouge") quel que soit le tour, en faisant tourner l'ordre d'essai des
préfixes selon le round. Ce texte et la destination physique ne sont jamais garantis cohérents
par construction — c'est à la vérification humaine/agent d'y veiller (Article 17) : un motif qui
nomme un objet ou une pièce différente de la destination réelle serait un vrai défaut de
cohérence interne, au même titre qu'un enchaînement qui saute l'étape "se déplacer" avant
"observer".

## 6. Règles transversales

- **Le serveur ne calcule jamais une coordonnée.** Toute logique de position (murs, meubles,
  chemin, vitesse) vit exclusivement dans `lib/house.ts` (les règles) et
  `components/house-view.tsx` (leur exécution visuelle) — jamais dans `app/api/lia/route.ts`.
  Un futur besoin de connaître la position exacte d'un personnage côté serveur (ex. pour un
  nouveau mécanisme de jeu) devrait se poser la question : est-ce vraiment nécessaire, ou l'ancre
  narrative (`location`) suffit-elle déjà ?
- **Les ancres sont le seul vocabulaire commun entre le texte et l'espace.** Ajouter un nouveau
  meuble ou un nouveau point d'intérêt interactif passe toujours par une nouvelle entrée dans
  `roomAnchors` (avec sa paire de coordonnées) et, si besoin, une nouvelle règle de détection dans
  `destinationAnchor()` — jamais une coordonnée codée en dur ailleurs dans le moteur de dialogue.
- **Le filet de sécurité anti-blocage (`residentDestination`) est une garantie permanente**, pas
  une rustine ponctuelle : toute pièce ou tout meuble ajouté à l'avenir en bénéficie
  automatiquement, sans code supplémentaire à écrire à chaque fois.
- **Le jardin reste la seule zone réellement verrouillée.** Aucune autre pièce ne doit jamais
  devenir conditionnelle à une preuve ou un état de l'enquête sans une décision de conception
  explicite — ce serait une rupture avec le principe du huis clos initial (les quatre pièces
  intérieures sont libres dès le début).
- **Le couloir (`exitInspection`) reste une scène narrative hors modèle de pièces**, pas un
  précédent à généraliser : toute nouvelle scène spéciale de ce type doit rester une exception
  clairement isolée (comme elle l'est aujourd'hui), pas un second système parallèle de gestion de
  l'espace qui diluerait celui décrit ci-dessus.

## 7. Checklist de cohérence spatiale pour tout nouveau changement

Avant de considérer terminé un changement touchant à l'espace ou aux déplacements :

- Toute nouvelle pièce, tout nouveau meuble ou tout nouvel obstacle passe-t-il bien par
  `blocked()` (pas une vérification de collision séparée) ?
- Toute nouvelle ancre a-t-elle sa paire `[pointLia, pointNoé]`, et ces deux points sont-ils
  eux-mêmes hors de tout obstacle (le filet de sécurité rattrape un oubli, mais ne doit pas
  devenir la norme) ?
- Si une nouvelle combinaison pièce × intention peut se produire, `destinationAnchor()` lui
  donne-t-il une clé valide pour CETTE pièce (les clés ne sont pas les mêmes d'une pièce à
  l'autre) ?
- Un nouveau mot-clé de détection dans `destinationAnchor()` entre-t-il en conflit avec un
  mot-clé déjà utilisé pour une autre ancre de la même pièce ?
- Une nouvelle scène narrative hors modèle de pièces (sur le modèle du couloir) est-elle bien
  isolée et documentée comme telle, plutôt que de laisser croire qu'elle est une vraie pièce ?
- Le motif de déplacement (`departureLine` ou équivalent) reste-t-il cohérent avec la
  destination réelle et avec ce que le personnage a déjà observé (Article 17) ?

## 8. Ce qu'un transcript permet — et ne permet pas — de vérifier

Objectif explicite de ce document (cf. en-tête) : aider à vérifier, à la lecture d'un transcript
de simulation, ce que l'utilisateur ne voit pas lui-même en se concentrant sur la conversation.
**Observable directement dans un transcript/journal** : la pièce affichée pour chaque personnage
à chaque tour (cohérente avec son intention et ce qu'il vient de dire, y compris le tag "couloir"
pendant l'exploration de sortie, cf. section 3), le motif de déplacement donné, les entrées
`mémoire` de type "déplacement". **Non observable depuis le seul texte** : la
position (x, z) exacte, le chemin BFS réellement emprunté, la vitesse de marche, une éventuelle
collision visuelle ou un chevauchement de personnages — ces points demandent soit une relecture
du code (`lib/house.ts`, `components/house-view.tsx`), soit une observation directe de la scène
3D par l'utilisateur, jamais une déduction depuis le seul flux de messages.
