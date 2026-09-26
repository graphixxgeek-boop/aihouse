# LE-COORDINATEUR — fiche d'instanciation

## Ce qu'il sert ici

`scripts/le-coordinateur.mjs` (2026-09-19), nommé par l'utilisateur et calibré par lui via
l'Article 16 :

> « est-ce qu'il est possible de le créer à moindre coût, simplement comme un coordinateur de
> fonctions existantes ? juste là pour fiabiliser et fluidifier l'existant »

## Ce qu'il lance ici

Les vérifications gratuites du dépôt, en un passage — 13 lignes dans le tableau de sortie. Il porte
aussi le **catalogue PRESTATIONS**, que tool-brain interroge pour recommander un outil.

## Une décision d'organisation prise le 2026-09-26

Il **a rendu le rang d'Agent Cadre** ce jour-là, faute de pouvoir convoquer les autres : ce rang se
définit par un pouvoir précis (convoquer et rendre un verdict), et il ne l'a pas. Il est Membre
classique.

## Le défaut réel qu'il a coûté ici

Son intégration n'avait **aucun test** jusqu'à ce qu'un lancement manuel révèle une `ReferenceError`
dans une de ses lignes — jamais vue, parce que ce point d'intégration n'était couvert par rien.
Corrigé, puis couvert par un test de bout en bout.

## Le trou trouvé le 2026-09-26, et il vient de son catalogue

Quatre outils bien réels n'avaient **jamais eu d'entrée** dans PRESTATIONS — dont lui-même. Un outil
absent du catalogue est invisible à tool-brain, donc jamais recommandé. Trouvé par un chemin
inattendu : la classification des rapports, qui dérive le sujet d'un rapport de la `demande` du
catalogue, sortait six dossiers en « sujet non déterminé ».

## Sa limite ici

Il agrège, il ne conclut jamais. Et son catalogue est tenu à la main : un outil qui n'y entre pas
n'existe pas pour tool-brain, et rien ne l'annonce à sa naissance sauf le garde-fou d'intégration.
