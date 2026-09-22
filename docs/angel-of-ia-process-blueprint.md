# Blueprint — un gardien de la CONDUITE, pas du déroulé

*Document générique, réutilisable sur un autre projet. L'instanciation propre à « Maison IA vivante »
vit dans `docs/referentiel/angel-of-ia-process.md`.*

## Le problème qu'il résout

Un projet piloté par IA finit toujours par se doter de règles de travail écrites : consulter tel
outil avant d'agir, poser ses questions avant de coder, documenter dans le même commit que le
travail. Ces règles sont écrites une fois, relues rarement, et personne ne vérifie jamais qu'elles
sont tenues — parce que les vérifier demande de croiser des sources que rien ne croise.

D'où la distinction fondatrice, celle qui justifie un outil séparé plutôt qu'une extension :

- un **gardien de process** surveille le DÉROULÉ d'une activité (une revue, une simulation, une
  livraison) : telle étape a-t-elle eu lieu, dans cet ordre ;
- ce gardien-ci surveille la **CONDUITE de ceux qui travaillent** : l'agent et l'humain ont-ils
  respecté les règles qu'ils se sont données, quelle que soit l'activité en cours.

Les mélanger rend les deux illisibles. Un même rapport peut les porter — mais jamais dans la même
section, parce que ce sont deux natures différentes de constat.

## L'apport propre : le croisement des horodatages

Tout le reste d'un tel outil est déclaratif. Sa seule mesure véritablement indépendante est celle-ci :
plusieurs règles imposent de consulter un outil **avant** d'agir, et consulter après coup ne vaut
rien. Or deux journaux horodatés existent déjà dans tout projet outillé — le compteur d'usage des
outils, et l'historique des commits. Les croiser dit si l'ordre a été respecté. Personne ne le fait
spontanément, et c'est précisément ce que cet outil apporte.

**Limite à déclarer plutôt qu'à cacher** : une consultation faite dans une session sans commit reste
invisible, et un commit groupant plusieurs heures de travail élargit la fenêtre au point de rendre
le verdict peu discriminant. Le résultat est un SIGNAL daté, jamais une preuve.

## La règle des trois états, appliquée à soi-même

C'est le cœur du blueprint, et ce que ce projet a appris **deux fois de suite** en construisant cet
outil précis.

Une origine d'événement ne dit pas toujours *pourquoi* un outil a été lancé. Un compteur d'usage
enregistre typiquement « lancé en ligne de commande » — un fait réel, mais qui ne distingue pas une
consultation d'un test de bon fonctionnement. Lire cette origine comme une consultation, c'est
présenter une **mesure adjacente** comme la mesure visée.

La règle qui en découle, et qui vaut pour n'importe quel outil de ce type :

> Seule une origine que l'acteur a **déclarée sciemment** peut fonder un manquement nommé. Toute
> autre trace hors d'ordre est montrée comme un **signal non concluant** : visible, jamais imputée
> à quelqu'un.

Trois états, donc, jamais deux : respecté / manqué / **non concluant**. Un outil qui désigne un
coupable sur une mesure qui ne prouve rien perd le droit d'être cru le jour où il en tient une vraie.

## Ce qu'il ne devine jamais

Environ la moitié des règles de travail se joue uniquement dans la conversation : ai-je posé mes
questions avant d'agir, traité les points un par un, respecté le format attendu. L'outil ne les
devine JAMAIS — il les DEMANDE, et **refuse d'être vert** tant qu'elles ne sont pas fournies. Un
verdict vert obtenu en laissant la moitié des règles sans réponse serait le pire des faux verts.

## Les deux côtés, notés pareil

L'outil note l'agent ET l'humain. Une règle qui engage les deux et n'est vérifiée que d'un côté est
vérifiée à moitié. Pas de complaisance pour l'agent, pas d'exemption pour l'humain.

## Garde-fous d'évolutivité

- Les origines d'événement que l'outil nomme sont définies ailleurs : un garde-fou mécanique vérifie
  qu'elles existent encore, et l'outil **refuse de conclure** si l'une a disparu — jamais un zéro
  silencieux, qui produirait un faux vert.
- Chaque règle surveillée cite sa source écrite. Une règle sans source se fait supprimer par le
  prochain agent qui la trouve énigmatique.
- Le rapport est livré **par le gardien central des process**, dans sa propre section : une seule
  voix, deux natures de constat clairement séparées.
