# Échelle de priorité des tâches — blueprint générique

## Le problème qu'il ferme

Un registre de tâches sans échelle de priorité se lit dans l'ordre où il a été écrit, c'est-à-dire
dans le désordre. Mais une échelle **posée à la main** a un défaut pire que l'absence : elle mélange
des critères qui ne se comparent pas — l'importance, le retard, la difficulté — et rend un rang qui
ne veut plus rien dire. Une tâche simplement en retard passe alors devant une tâche vitale.

## Le principe qui tient tout

**Un rang se DÉRIVE de critères nommés, il ne se déclare pas.** Chaque critère répond à une question
distincte, et le rang est leur combinaison. Ce qui interdit qu'un critère se glisse dans l'échelle
d'un autre : mettre « en retard » comme niveau d'une échelle d'importance, c'est décréter qu'un
retard rend une tâche plus importante, ce que personne n'a jamais voulu dire.

## Pourquoi c'est un module séparé

Le décideur (l'outil qui organise les tâches) est souvent un gros fichier, cité par beaucoup
d'autres, classé sensible : y verser une échelle entière serait un changement à risque élevé sur un
nœud central. Ici, le fichier ne s'exécute pas seul, ne produit aucun rapport et n'a qu'un appelant.
**Le risque d'y toucher est nul, et c'est tout l'intérêt de l'avoir sorti.**

## Ce qu'il n'est pas

**Pas un second décideur.** Il implémente l'échelle ; le propriétaire déclaré reste l'outil qui
organise les tâches. Deux outils qui décideraient chacun d'un rang finiraient par ne plus dire la
même chose de la même tâche.

## Comment l'installer ailleurs

Les critères sont propres au projet d'accueil — c'est la seule partie à réécrire. Ce qui s'emporte
tel quel, c'est la règle : **un rang dérivé, des critères qui ne se mélangent pas, un seul
propriétaire.**
