# Historisation et tendance — blueprint générique

## Le problème qu'il ferme

Un outil qui rend un chiffre sans historique rend **la moitié de l'information**. « 47 écarts » ne
dit rien : 47 en hausse depuis 30 est une alerte, 47 en baisse depuis 120 est une victoire. Le même
nombre, deux conclusions opposées — et rien dans le rapport ne permet de choisir.

**Le gaspillage est invisible** parce que chaque rapport, pris seul, a l'air complet.

## Le principe

**Un mécanisme partagé d'historisation**, jamais un historique réinventé par chaque outil. Chaque
passage dépose sa mesure dans une série ; le rapport suivant lit la série et affiche la tendance à
côté du chiffre.

## Les trois pièges, et ils se produisent tous

1. **Comparer deux points et appeler ça une tendance.** Deux mesures donnent une variation, pas une
   tendance. Le mécanisme doit refuser de conclure sous un nombre minimum de passages, et le dire.
2. **Comparer des mesures qui n'ont pas la même définition.** Si l'outil change sa façon de compter,
   la série devient incomparable — et le graphique, lui, continue de monter joliment. Un changement
   de définition doit rompre la série, jamais la prolonger.
3. **Confondre une série vide et une série plate.** « Aucune mesure enregistrée » n'est pas
   « aucune évolution ».

## Ce qu'il ne fait pas

Il ne dit jamais si une tendance est **bonne**. Un nombre qui monte peut être un progrès (plus de
couverture) ou une dégradation (plus de dettes) — seul l'outil qui le produit le sait.

## Comment l'installer ailleurs

Un format de série, une fonction de dépôt, une fonction de tendance. Ce qui s'emporte surtout :
**refuser de conclure sous trois points**, et rompre la série quand la définition change.
