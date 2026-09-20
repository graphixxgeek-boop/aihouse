# memory-audit — cohérence mécanique de la mémoire d'un personnage — blueprint exportable

*(Créé le 2026-09-21 sous le nom "MEMENTO" (nom acté en session antérieure), renommé le même soir en
"memory-audit" une fois son rôle mieux compris par l'utilisateur — l'ombrelle "MEMENTO", qui
regroupait ce patron avec un second artefact de nature différente (une simple mesure de poids de
contexte, cf. `docs/referentiel/memento-weight.md`), a été retirée de toute la documentation. Même
logique documentaire qu'ARGUS/HARMONIA/THE-KING : ce document décrit le PATRON générique ;
l'instanciation propre à *Maison IA vivante* vit dans `docs/referentiel/memory-audit.md`.)*

## Un outil structurellement différent des autres : il cible un PERSONNAGE, jamais l'équipe

Tout le reste du réseau d'outils de ce projet cible des SCRIPTS et des DOCUMENTS de travail —
jamais les personnages narratifs eux-mêmes. memory-audit est l'exception délibérée : son domaine
EST la mémoire persistée d'un personnage IA — mais il reste, lui, un vrai Membre de l'équipe
(Outillage de travail), au même titre que `check-argus.mjs` : c'est son SUJET qui est un
personnage, jamais sa NATURE de code. Un projet qui construit ce patron sur un personnage IA
différent doit d'abord vérifier que cette distinction (sujet vs nature de code) existe et reste
étanche — un mélange des deux serait une vraie erreur de catégorie (constatée une fois sur ce
projet, cf. instanciation).

## Le problème que ce patron résout

Un personnage IA dont l'état persiste sur plusieurs tours (souvenirs, compteurs, relations) peut
devenir incohérent dans le temps sans que personne ne le remarque : un ordre chronologique rompu,
un compteur remis à zéro sans raison, un indicateur qui régresse alors que la règle du jeu dit
qu'il ne devrait jamais le faire — un bug de sauvegarde invisible tant que personne ne compare deux
instantanés successifs.

## Comprendre avant de construire — l'investigation est une étape, pas une option

Avant toute conception, une investigation factuelle dédiée (Article 19) doit établir : (a) la forme
réelle des champs de mémoire qui accumulent du contenu dans le temps, lesquels sont déjà plafonnés
au stockage ; (b) les mécanismes de troncature/résumé déjà en place, avec leurs constantes exactes.
Construire sans cette investigation risque de dupliquer un plafonnage déjà résolu (perte de temps).

## Le principe : cohérence STRICTEMENT mécanique, jamais un second appel au modèle

La détection reste comparaison de structures de données entre deux instantanés successifs (ordre
chronologique d'une liste d'événements datés, remise à zéro suspecte d'un compteur significatif,
régression d'un indicateur à sens unique). Jamais un second appel au modèle de langage pour
"vérifier" la cohérence : ce serait un coût API superflu pour un problème structurel, détectable
sans aucune compréhension du contenu. Jamais une action automatique non plus : un signal à lire,
comme le reste du réseau d'outils.

## Ce que ce patron n'est pas

- Un second calcul de plafonnage de stockage, si le stockage est déjà rigoureusement plafonné
  ailleurs — vérifier avant de construire (Article 19), jamais dupliquer un travail déjà fait.
- Un juge de la qualité du contenu produit par le personnage : il ne lit jamais le SENS de ce qui
  est dit, seulement la STRUCTURE des données qui l'alimentent.

## Un patron voisin, mais distinct : mesurer le poids réel du contexte envoyé au modèle

Un personnage IA dont l'état grossit avec le temps pose une seconde question, de nature différente :
ce qui est RÉELLEMENT envoyé au modèle de langage à chaque tour peut grossir sans que personne ne le
mesure — souvent un territoire explicitement laissé de côté par les outils de gouvernance de tokens
existants (qui se concentrent sur les tokens de l'agent de développement, jamais sur le texte envoyé
au modèle du personnage). Ce second besoin est une mesure OBSERVATIONNELLE pure (ajoutée au point
exact où le payload réel est construit, jamais utilisée pour le modifier) plutôt qu'un audit de
cohérence — assez différent en nature pour ne pas mériter le même patron complet ni le même statut
de Membre de l'équipe ; sur ce projet, il reste un fragment léger documenté directement dans
l'instanciation de memory-audit (`docs/referentiel/memento-weight.md`) plutôt qu'un second blueprint
généralisé pour ce qui reste, en substance, une poignée de fonctions d'observation.
