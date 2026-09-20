# MEMENTO — cohérence et dette de mémoire des personnages — blueprint exportable

*(Créé le 2026-09-21, nom acté en session antérieure — conçu ce soir après une investigation
préalable dédiée, Article 19. Même logique documentaire qu'ARGUS/HARMONIA/THE-KING : ce document
décrit le PATRON générique ; l'instanciation propre à *Maison IA vivante* vit dans
`docs/referentiel/memento.md`.)*

## Un outil structurellement différent des autres : il cible les PERSONNAGES, jamais l'équipe

Tout le reste du réseau d'outils de ce projet cible des SCRIPTS et des DOCUMENTS de travail —
jamais les personnages narratifs eux-mêmes (Lia/Noé). MEMENTO est l'exception délibérée : son
domaine EST la mémoire persistée d'un personnage IA et ce qui en est réellement envoyé au modèle de
langage qui l'anime. Un projet qui construit ce patron sur un personnage IA différent doit d'abord
vérifier que cette distinction structurelle (personnage vs outil de travail) existe et reste
étanche — un mélange des deux serait une vraie erreur de catégorie (constatée une fois sur ce
projet en construisant MEMENTO, cf. instanciation).

## Le problème que ce patron résout

Un personnage IA dont l'état persiste sur plusieurs tours (souvenirs, compteurs, relations) accumule
deux dettes distinctes, jamais couvertes par les mêmes outils :
1. **Dette de cohérence** : les données persistées peuvent devenir incohérentes dans le temps (un
   ordre chronologique rompu, un compteur remis à zéro sans raison, un indicateur qui régresse alors
   que la règle du jeu dit qu'il ne devrait jamais le faire) — un bug de sauvegarde invisible tant
   que personne ne compare deux instantanés successifs.
2. **Dette de taille mémoire** : ce qui est réellement envoyé au modèle de langage à chaque tour peut
   grossir avec le temps sans que personne ne le mesure — un territoire souvent explicitement laissé
   de côté par les outils de gouvernance de tokens existants (qui se concentrent sur les tokens de
   l'agent de développement, jamais sur le texte envoyé au modèle du personnage).

## Comprendre avant de construire — l'investigation est une étape, pas une option

Avant toute conception, une investigation factuelle dédiée (Article 19) doit établir : (a) la forme
réelle des champs de mémoire qui accumulent du contenu dans le temps, lesquels sont déjà plafonnés
au stockage ; (b) ce qui est RÉELLEMENT envoyé au modèle par tour (souvent une reconstruction dérivée
à chaque appel, jamais l'état complet persisté) ; (c) les mécanismes de troncature/résumé déjà en
place, avec leurs constantes exactes ; (d) toute frontière déjà écrite qui exclut explicitement ce
territoire des outils de gouvernance existants. Construire sans cette investigation risque de
dupliquer un plafonnage déjà résolu (perte de temps) ou de heurter une frontière déjà actée pour de
bonnes raisons (Article 0/8).

## Rôle (a) : cohérence mécanique, jamais un second appel au modèle

La détection de cohérence reste STRICTEMENT mécanique — comparaison de structures de données entre
deux instantanés successifs (ordre chronologique d'une liste d'événements datés, remise à zéro
suspecte d'un compteur significatif, régression d'un indicateur à sens unique). Jamais un second
appel au modèle de langage pour "vérifier" la cohérence : ce serait un coût API superflu pour un
problème structurel, détectable sans aucune compréhension du contenu.

## Rôle (b) : observer, jamais modifier le prompt du personnage

La mesure du poids mémoire est une observation PURE, ajoutée à l'endroit où le payload réel est
construit, sans jamais en changer le contenu. Le patron déjà établi pour observer un point d'appel
réseau existant (mémoire process en tableau capé, exposée en lecture seule via une API déjà
protégée, persistée après coup par l'outil de rapport déjà existant) se réutilise tel quel — jamais
un second mécanisme de capture parallèle. Toute frontière déjà actée entre l'architecture de
production et l'outillage de gouvernance de tokens (cf. Article 8/0 d'un projet donné) doit rester
respectée : ce patron ne bascule, ne réduit ni ne réécrit jamais le contenu réel envoyé.

## Ce que ce patron n'est pas

- Un second calcul de plafonnage de stockage, si le stockage est déjà rigoureusement plafonné
  ailleurs — vérifier avant de construire (Article 19), jamais dupliquer un travail déjà fait.
- Un juge de la qualité du contenu produit par le personnage : il ne lit jamais le SENS de ce qui
  est dit, seulement la STRUCTURE des données qui l'alimentent.
- Un outil de gouvernance de tokens pour l'agent de développement lui-même — domaine explicitement
  distinct, jamais mélangé (deux dettes de nature différente, deux publics différents).
