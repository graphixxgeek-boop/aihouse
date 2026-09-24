# Blueprint générique — un agent des NOMS pour un projet piloté par IA

*(Blueprint réutilisable sur n'importe quel projet, indépendant de « Maison IA vivante ».
L'instanciation propre à ce projet-ci vit dans `docs/referentiel/agent-des-noms.md`.)*

## Le problème qu'il résout, et il n'est pas celui qu'on croit

Un projet piloté par IA accumule des noms vite : un outil par semaine, un process par chantier, un
rapport par passage. Vient forcément le jour où l'un d'eux doit changer de nom — parce qu'il a
grossi, parce qu'il fait autre chose, ou simplement parce que son nom était provisoire.

**Et là, la peur qu'on a n'est pas la bonne.** Ce qu'on redoute, c'est de casser le code. Mesuré sur
un vrai dépôt, ce risque est le plus petit de tous : sur les 2 095 occurrences d'un nom d'outil,
**neuf** étaient des imports — et un test cassé les attrape en dix secondes.

**Le vrai risque est ailleurs, et il est silencieux : 496 de ces occurrences vivaient dans les
archives du projet.** Un journal de septembre qui dit « CASSANDRA-RH a trouvé trois écarts » doit
continuer à le dire. Le réécrire au nouveau nom ne casse rien, ne fait échouer aucun test, et
**falsifie ce qui s'est passé** — un mensonge qui n'a même pas l'honnêteté de faire du bruit.

## La règle centrale, et tout le reste en découle

> **Un renommage déplace le CODE VIVANT et laisse l'HISTOIRE INTACTE.**

Ce qui relie les deux n'est pas une réécriture, c'est un **alias** : « ce qui s'appelle aujourd'hui X
s'appelait Y jusqu'au tant ». Un lecteur futur retrouve le fil sans qu'on ait eu à mentir sur le
passé.

## Les cinq natures d'une occurrence

| Nature | Se déplace ? | Risque | Ce que c'est |
|---|---|---|---|
| import de code | oui | élevé | casse immédiatement — et c'est la bonne nouvelle, un test le voit |
| commande écrite | oui | moyen | un `node scripts/X` dans un document : casse à l'usage, sans bruit |
| chemin de registre | oui | élevé | un dossier, une clé : casse la mémoire de l'outil |
| mention vivante | oui | faible | une prose qui décrit ce que l'outil fait AUJOURD'HUI |
| **trace historique** | **JAMAIS** | — | un journal, un rapport archivé, une mesure passée |

## Comment on reconnaît l'histoire : par l'EMPLACEMENT, jamais par le contenu

Un dossier d'archives contient des archives, quoi qu'elles racontent. Chercher une date dans le nom
du fichier paraît plus fin et ne l'est pas : le même dossier contient des noms datés et des noms
horodatés en millisecondes, et la sonde laisse passer les seconds en rendant exactement ce qu'elle
rend quand elle n'a rien trouvé.

**Le défaut doit pencher du côté sûr, et c'est un choix de conception à faire explicitement.**
Classer du vivant comme historique laisse une mention périmée : ennuyeux. L'inverse réécrit une
archive : c'est précisément ce que l'outil existe pour empêcher. Entre les deux erreurs, on prend la
première sans hésiter — donc **tout sous-dossier est de l'histoire par défaut, et le vivant est
l'exception déclarée**.

## Le piège qu'un remplacement de texte ne voit jamais

Un nom qui en CONTIENT un autre. Renommer `memento` emporte `memento-weight`, qui est un outil
différent, et le casse en silence. L'outil liste ces homonymes étendus avant le geste, parce
qu'aucune relecture humaine ne les repère de façon fiable dans deux mille lignes.

## Ce qu'il ne fait jamais, délibérément

**Il ne renomme rien.** Il inventorie, il trie, il produit un plan fichier par fichier, et il
vérifie après coup qu'aucun reste vivant ne subsiste. Un outil qui changerait deux mille occurrences
tout seul serait exactement l'action difficile à défaire qu'un projet sérieux refuse de prendre sans
validation humaine.

Il ne rend jamais non plus une liste vide comme une bonne nouvelle : si la recherche **n'a pas pu**
tourner, il le dit. Une recherche empêchée et une recherche sans résultat produisent le même zéro,
et seul le second veut dire quelque chose.

## La seconde moitié : la gouvernance du nommage

Plus légère, et utile pour une raison différente : **qui a le droit de nommer ?** Sur un projet
piloté par IA, la réponse par défaut est « l'agent », et c'est rarement ce qu'on veut.

Trois mécanismes suffisent :

1. **La marque provisoire datée.** Un nom posé pour ne pas bloquer le travail porte une marque, et
   cette marque est cherchée à chaque passage. Le mécanisme ne peut pas empêcher l'agent de choisir
   un nom — rien ne le permettrait — mais il rend **impossible de l'oublier**. Sans date lisible à
   côté de la marque, l'outil **refuse d'alerter** plutôt que d'inventer une ancienneté : un
   « 0 jour » fabriqué se lit comme un nom posé à l'instant.
2. **Le baptême refusé sans accord humain explicite.** La fonction d'enregistrement lève une erreur
   si le drapeau « choisi par l'utilisateur » est absent. Une mécanique ne peut pas prouver qu'un
   humain a tranché ; elle peut refuser de l'inventer.
3. **Le registre**, qui garde ce que le contrôle de version ne garde pas : git sait qu'un nom a
   changé, jamais QUI l'a choisi ni ce qui avait été proposé à côté. « Pourquoi ça s'appelle comme
   ça » est une vraie question, et elle revient.

## Les pièges rencontrés à la construction, pour ne pas les refaire

- **Chercher une date dans le nom du fichier** pour reconnaître une archive : laisse passer tout
  horodatage d'une autre forme, et le laisse passer du côté dangereux.
- **Laisser le dossier « vivant » gagner à toute profondeur** : un rapport archivé rangé sous un
  dossier de référence redevient vivant, donc réécrivable. Le vivant s'arrête au premier niveau.
- **Oublier de mesurer avant de concevoir.** Toute la conception ci-dessus découle d'un comptage
  fait sur le vrai dépôt. Décrite d'abord, elle aurait protégé le code — c'est-à-dire la partie qui
  se protège toute seule.
