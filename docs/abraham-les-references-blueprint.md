# Blueprint générique — l'analyseur de N'IMPORTE QUEL document de règles numérotées

*(Réutilisable tel quel sur un autre projet. Instanciation sur celui-ci :
`docs/referentiel/abraham-les-references.md`. Écrit pour une IA qui ne connaît pas ce dépôt.)*

## Le problème qu'il résout, et il se répète dans tous les projets

Un projet piloté par IA n'a jamais UN document de règles, il en a plusieurs : la charte de contenu,
les règles de travail, la philosophie, le référentiel technique. Chacun grossit de la même façon,
souffre des mêmes maux, et appelle exactement les mêmes questions :

- **qui tient réellement cette règle ?** — un mécanisme nommé, ou la seule mémoire de qui la lit ;
- **quelle nature a-t-elle, donc quel geste appelle-t-elle ?** — une loi ne s'allège pas, un mode
  d'emploi d'outil se remplace par un renvoi, un inventaire se déplace ;
- **mérite-t-elle encore sa place ?** — beaucoup de texte pour zéro citation est une question, pas
  un verdict ;
- **deux règles disent-elles la même chose sans que rien ne dise laquelle prime ?**
- **qu'a-t-on déjà tenté dessus, et qu'est-ce qui n'a pas tenu ?**

**L'erreur de découpage que ce blueprint existe pour éviter** : on construit d'abord l'agent d'UN
document (celui qui fait le plus mal), et les trente fonctions génériques finissent enfermées
dedans. Le deuxième document arrive et n'a rien — ou pire, on lui recode les mêmes fonctions sous
d'autres noms. Sur ce projet, l'écart a été mesuré : **30 des 40 fonctions de l'agent spécifique ne
dépendaient d'aucune particularité de son document.**

## L'architecture, en une phrase

**Un outil MAÎTRE générique, des agents de périmètre qui l'APPELLENT.**

```
Abraham (générique — ne connaît AUCUN document)
 ├─ appelé par l'agent de la charte      → ajoute le vocabulaire et les règles propres à la charte
 ├─ appelé par l'agent de la philosophie → idem pour la philosophie
 └─ appelé en direct sur un document nu  → analyse complète, zéro configuration
```

**Le test d'appartenance, unique et tranchant** : *cette capacité dépend-elle d'une particularité
de CE document ?* Si oui, elle appartient à l'agent de périmètre. Sinon elle appartient au maître,
et l'agent de périmètre l'appelle en traduisant son vocabulaire.

Concrètement, chez l'agent de périmètre il ne reste que des **adaptateurs** : renommer « règle » en
« Article », passer ses exceptions, ajuster un libellé d'en-tête. Quelques lignes chacun.

## Les dix capacités du maître

1. **Le balayage du dépôt** (`fichiersDuDepot`) — fait UNE fois et passé en paramètre. C'est la
   partie coûteuse de tout le reste ; la refaire par règle est la différence entre une seconde et
   une minute.
2. **La détection de FORME** (`detecterForme`) — le cœur de la généricité. On essaie les formes de
   numérotation courantes, on garde celle qui découpe le mieux, et on DIT laquelle a été reconnue.
   Un document dont aucune forme ne ressort rend **« pas mesurable »** plutôt qu'un découpage
   inventé. C'est le contraire d'une liste de documents connus, qui se périmerait au premier
   document ajouté.
3. **La mesure par unité** (`mesurerUnites`) — poids en lignes et en tokens, citations réelles dans
   le dépôt, porteur déclaré.
4. **Le porteur en TROIS états** (`porteursDeclares`) — *porté* (nomme un mécanisme qui existe)
   / *sans porteur* (sa prose EST le mécanisme, et c'est légitime si c'est assumé) / **fantôme**
   (nomme un mécanisme introuvable). Le troisième état est le plus utile : une protection annoncée
   qui n'existe pas est pire qu'une absence, puisqu'elle rassure à tort.
5. **La nature et le geste** (`natureProposee`) — la mesure PROPOSE, un humain TRANCHE, et sa
   décision survit à la régénération.
6. **La pertinence** (`analyserPertinence`) — des signaux nommés, jamais un score, chacun formulé
   comme une **question**. Le code lui-même refuse de conclure : l'état ne prend qu'une seule
   valeur, « à trancher ».
7. **La logique** (`findRecouvrementsNonDeclares`, `findPairesRedondantes`) — deux règles au
   vocabulaire commun dont aucune ne cite l'autre : une frontière manquante, pas un doublon.
8. **La couverture déclarée** (`mesurerSections`) — quelle part du document les unités numérotées
   représentent réellement. Une analyse qui ne voit que les règles numérotées peut passer à côté de
   la moitié d'un document en ayant l'air complète.
9. **La vérification du document d'accueil** (`verifierDocumentDAccueil`) — avant tout renvoi,
   vérifier que la destination existe ET porte déjà le contenu. Une adresse promise qui ne répond
   pas est une dette, pas un allègement.
10. **La mémoire des opérations** (`lireOperations`, `commentOnAFaitLaDerniereFois`) — au grain de
    la règle touchée, avec les gestes déjà **annulés** mis en évidence : ce qui n'a pas tenu la
    première fois est l'information la plus chère du registre.

## Les deux règles de conception qui le rendent exportable

**Un seuil se DÉRIVE, il ne se recopie pas.** Le seuil de « rendement faible » (beaucoup de texte
pour peu de citations) se calcule depuis le document analysé lui-même — la médiane des rendements
divisée par trois — jamais écrit en dur. Un seuil recopié cesserait d'être vrai au premier
remaniement, et sur un autre document il n'aurait jamais été vrai.

**Il ne nomme aucun document, ne décide à la place de personne, et ne conclut jamais.** Chacun de
ses appelants lui passe SON motif de titre, SES exceptions et SES chemins. C'est la condition pour
qu'il parte vers un autre projet sans emporter la moindre trace de celui-ci.

## La ligne rouge, et pourquoi elle est dans le code plutôt que dans la doc

Un outil capable d'écrire « cette règle est inutile » finirait par voir ce jugement appliqué sans
que personne ne l'ait porté. La protection n'est donc pas une précaution de style : **le type de
sortie lui-même ne peut pas exprimer un verdict.** Aucune prose ne remplace ça.

## Ce qu'il ne refait pas

Le **découpage brut** d'un texte en unités et la comparaison de vocabulaire existaient déjà dans la
plupart des projets outillés (ici `decouperEnUnites()` et `pairesParJaccard()`). Ce qui manquait
n'était jamais la primitive, c'était la **couche d'analyse** au-dessus. Un blueprint qui
réimplémenterait la primitive créerait la duplication qu'il prétend supprimer — vérifiable par un
détecteur de clones : sur ce projet, le refactor de délégation a ramené le compte de blocs
dupliqués de 25 à 17.

## Comment on le porte sur un autre projet

1. Copier le script, retirer les imports propres au projet d'origine (compteur d'usage, en-tête de
   rapport) ou leur donner un équivalent local.
2. Ajouter au tableau des formes connues celles que le nouveau projet emploie, si elles n'y sont
   pas. C'est la seule extension prévue — et elle n'est pas obligatoire pour les quatre formes
   courantes déjà couvertes.
3. Pour chaque document à périmètre fort, écrire un agent de périmètre qui l'appelle et n'ajoute
   que ses adaptateurs. Pour tous les autres, l'appeler en ligne de commande suffit.
