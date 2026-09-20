# find-booster — navigation par concept dans un gros fichier — blueprint exportable

*(Créé le 2026-09-21 sous le nom "route-find-booster", conçu d'abord pour un seul fichier
(app/api/lia/route.ts). Renommé "find-booster" le même soir une fois confirmé générique (« il n'est
pas restreint au fichier route.ts »), puis promu à un vrai statut de Membre de l'équipe après un
usage réel concluant sur 4 fichiers de nature différente. Même logique documentaire qu'ARGUS/
HARMONIA/THE-KING : ce document décrit le PATRON générique ; l'instanciation propre à *Maison IA
vivante* vit dans `docs/referentiel/find-booster.md`.)*

## Le problème que ce patron résout

Un gros fichier (code ou documentation) devient difficile à parcourir dès qu'il dépasse ce qu'une
lecture ou un grep littéral peut couvrir confortablement — et le nombre de lignes seul est un
mauvais indicateur : un fichier peut être court en lignes mais dense en contenu (une poignée
d'entrées, chacune un pavé de texte). Trouver "où se trouve telle logique" devient alors plus lent
que nécessaire, chaque fois qu'on y revient.

## Le principe : indexer par CONCEPT, jamais par grep littéral

Ce patron n'invente jamais de nouvelle convention d'annotation à maintenir en plus du code — il
réutilise la description déjà présente naturellement dans le style d'écriture du projet (un
commentaire précédent une fonction, un commentaire suivant une accolade ouvrante, un titre de
section, un champ de titre déjà nommé). Il indexe cette description avec la position réelle, puis
répond à une recherche par mot-clé contre le nom ET la description — jamais un grep sur le texte
brut du fichier entier.

## Plusieurs motifs structurels réels, jamais un seul supposé universel

Un projet n'organise pas tout son contenu de la même façon : des fonctions nommées, des blocs
anonymes commentés (chaque unité vit dans son propre bloc, sans nom), des entrées de tableau déjà
titrées, des titres de document. Ce patron reconnaît CHAQUE motif réellement rencontré comme une
fonction d'extraction séparée, routée par un signal fiable (l'extension du fichier, ou la
coexistence sans ambiguïté des motifs dans un même type de fichier) — jamais un seul motif forcé
sur tous les fichiers, et jamais un motif mélangé silencieusement avec un autre. La liste des motifs
reconnus s'étend avec l'usage réel, jamais par anticipation spéculative.

## Jamais une classification certaine

Un tag thématique optionnel (rattacher une entrée à un grand thème du projet, par mot-clé dans son
nom/sa description) reste un indice de rapprochement, jamais une vérité — la même honnêteté que le
reste du réseau d'outils de raisonnement de ce projet (reconnaissance de motifs, jamais une preuve
formelle).

## Une recommandation d'usage, jamais un déclenchement automatique

Un second mécanisme, séparé de l'indexation elle-même, répond à la question « ce fichier
mérite-t-il qu'on l'indexe ? » — en pondérant le contenu réel (formule de poids déjà validée
ailleurs dans le projet pour un usage voisin, jamais une seconde formule divergente), jamais le
nombre de lignes seul, qui peut sous-estimer un fichier court mais dense. Cette recommandation reste
une donnée à lire, jamais un déclenchement automatique de l'outil lui-même.

## Ce que ce patron n'est pas

- Un outil de restructuration de code — il ne modifie jamais rien, il ne fait qu'indexer et
  chercher. Un patron voisin (préparer un découpage réel) est un outil distinct, avec son propre
  statut, plus rarement sollicité.
- Un parseur syntaxique complet — chaque motif d'extraction reste une heuristique texte,
  volontairement simple, jamais un vrai analyseur de langage.
