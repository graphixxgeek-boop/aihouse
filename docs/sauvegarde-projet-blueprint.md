# sauvegarde-projet — plan générique : le coffre et la notice

*(Blueprint réutilisable. Instanciation : `docs/referentiel/sauvegarde-projet.md`.)*

## Le besoin, et il n'est pas redondant avec un dépôt distant

« Si demain il y a un gros bug, ou que je n'ai plus accès à l'agent ou au dépôt, je veux une copie
qui me permette de continuer comme si rien ne s'était passé. »

Un dépôt distant ne couvre pas ça : une copie **chez la personne** survit à un compte fermé, un
dépôt purgé ou une branche écrasée. C'est le seul outil de tout un paysage dont la raison n'est pas
la qualité du code, mais ce qu'on perdrait.

## Deux livrables, deux métiers OPPOSÉS — et les confondre est l'erreur de départ

| | Le coffre | La notice |
|---|---|---|
| contenu | exhaustif | choisi |
| lecture | **jamais lu** | lue |
| métier | RESTAURER | EXPLIQUER |
| calibrage | aucun tri | calibrée pour la mémoire de son lecteur |

Le coffre ne se trie pas : trier fait courir le risque d'écarter la mauvaise chose, pour un gain
nul quand le dépôt est léger.

La notice, elle, **doit** être triée — un dépôt entier aplati peut peser des millions de tokens,
soit une vingtaine de fois trop. **Une notice qui sature la mémoire de son lecteur ne sert à rien**,
et c'est exactement le piège : elle a l'air complète.

## L'historisation ne demande rien de plus, et c'est le point contre-intuitif

Le suivi des tâches, les archives et les registres **SONT des fichiers du dépôt**. Le coffre
d'aujourd'hui contient donc toute l'histoire jusqu'à aujourd'hui. Écraser ne perd rien : ce n'est
pas une photo qui remplace une photo, c'est un livre qui remplace le même livre avec des chapitres
en plus.

On garde quand même les trois derniers de chaque, parce qu'une sauvegarde unique et corrompue ne
laisse rien derrière elle.

## La seule étape qui décide si tout le dispositif sert

**La REMISE.** Une sauvegarde qui reste dans le dépôt qu'elle sauvegarde ne protège de rien. C'est
le seul outil dont l'exécution se termine par une livraison et non par un rapport, et cette
asymétrie doit être écrite — sinon on le croit fini quand il ne l'est pas.

## Générique par construction

Rien ne connaît le domaine du projet : tout se dérive du gestionnaire de version et du dossier réel.
