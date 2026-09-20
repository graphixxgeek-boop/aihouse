# CLONE-HUNTER — détection de code dupliqué — blueprint exportable

*(Créé le 2026-09-21, en réponse à une question directe de l'utilisateur : « est-ce qu'on a deja un
outil qui traque les redondances, repetition, duplicatas, dans le code ? » — vérifié avant
construction que non, en lisant les fonctions exportées d'ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD
une par une (Article 19), pas seulement en cherchant le mot "duplication". Même logique documentaire
qu'ARGUS/HARMONIA/THE-KING/find-booster : ce document décrit le PATRON générique ; l'instanciation
propre à *Maison IA vivante* vit dans `docs/referentiel/clone-hunter.md`.)*

## Le problème que ce patron résout

Un code qui grossit accumule naturellement des fonctions ou des blocs recopiés d'un endroit à
l'autre — souvent sans mauvaise intention, simplement parce que la logique existante n'a pas été
retrouvée au moment d'écrire la nouvelle. Sans détection mécanique, cette dette reste invisible
jusqu'à ce qu'un bug corrigé à un seul des deux endroits ressurgisse ailleurs, inchangé.

## Le principe : un diff de blocs, jamais un simple fenêtrage

Indexer chaque ligne "substantielle" (au-dessus d'un seuil de longueur, pour écarter le bruit
trivial — accolades seules, imports courts) par son contenu normalisé (espaces réduits). Pour
chaque paire d'occurrences de la même ligne, étendre la comparaison ligne par ligne tant qu'elle
matche encore — jamais une fenêtre à taille fixe, qui couperait un bloc plus long que la fenêtre ou
le fragmenterait en plusieurs alertes redondantes.

## Regrouper, jamais répéter la même trouvaille

Un bloc dupliqué à N endroits produit C(N,2) paires par construction de l'algorithme ci-dessus —
sans regroupement, l'utilisateur verrait autant d'alertes redondantes pour une seule vraie
duplication. Un union-find minimaliste regroupe ces paires en clusters, chacun listant toutes ses
occurrences réelles une seule fois.

## v1 volontairement littérale, jamais sémantique

Ce patron détecte des blocs de texte IDENTIQUES après normalisation — jamais une ressemblance de
LOGIQUE (mêmes opérations avec des noms de variables différents, lignes réarrangées), qui
demanderait une vraie analyse syntaxique (AST) hors de portée d'un outil "sans nouvelle
dépendance". Une v2 sémantique reste une extension possible, mais un chantier à part entière, pas
une variante mineure de la v1.

## Exclure le bruit structurel, jamais le cacher

Un code généré ou vendu tel quel (un kit de composants d'interface, par exemple) peut dupliquer du
texte PAR DESIGN — chaque unité y est volontairement autonome plutôt que factorisée. Ce patron
exclut ce type de dossier du scan par défaut, une fois identifié et vérifié (jamais une exclusion
générique appliquée sans preuve), pour que le signal restant reste actionnable — jamais pour
masquer une vraie duplication dans le code réellement écrit à la main par l'équipe.

## Un signal factuel, jamais une correction automatique

Ce patron ne factorise jamais de lui-même le code qu'il trouve dupliqué — il rapporte, classé par
impact réel (longueur × nombre d'occurrences), et laisse la décision de factoriser (ou non) à
l'agent qui pilote. Toute duplication n'est pas une dette : parfois une ressemblance de surface
cache une intention différente qui justifie deux implémentations distinctes.

## Ce que ce patron n'est pas

- Un linter de style — il ne juge jamais la qualité du code, seulement sa répétition littérale.
- Un outil de refactorisation automatique — il ne modifie jamais rien lui-même.
- Un détecteur de similarité sémantique — cf. section v1 ci-dessus.
