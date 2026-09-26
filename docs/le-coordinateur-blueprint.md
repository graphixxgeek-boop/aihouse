# Orchestrateur de vérifications gratuites — blueprint générique

## Le problème qu'il ferme

Un projet outillé finit avec une douzaine de vérifications gratuites, chacune derrière sa propre
commande. Les lancer toutes demande de **se souvenir de la liste** — donc on n'en lance que trois,
toujours les mêmes, et les neuf autres deviennent des outils qui existent sans servir.

## Le principe, et sa contrainte fondatrice

**Il n'ajoute aucune vérification : il appelle celles qui existent et rend un seul tableau.** C'est
ce qui le rend bon marché à construire et sans risque à maintenir — il n'a pas de logique propre à
faire vieillir.

## Ce qu'il ne doit jamais devenir

Un **second décideur**. S'il se met à interpréter les résultats qu'il agrège, il duplique le
jugement des outils appelés, et les deux finiront par diverger. Il rassemble, il ne conclut pas.

## Le piège à l'exécution

Un orchestrateur cache les pannes : si l'une des vérifications échoue, son absence dans le tableau
ressemble à une absence de problème. Chaque ligne doit donc porter trois états — **résultat, rien à
signaler, n'a pas pu tourner** — et jamais deux.

## Comment l'installer ailleurs

La liste des vérifications est propre au projet d'accueil. Ce qui s'emporte : **agréger sans
conclure, et distinguer le silence de la panne.**
