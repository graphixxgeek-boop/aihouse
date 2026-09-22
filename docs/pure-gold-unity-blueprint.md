# Vérifier que les rapports sont RÉELLEMENT conformes — blueprint exportable

*Document générique, réutilisable sur un autre projet. Décrit un PATRON, jamais une implémentation.*

## Le problème qu'il résout

Un paysage d'outils qui produisent des rapports finit toujours par se donner un gabarit commun : un
en-tête, une date, une structure. C'est une bonne décision, et elle ne change rien toute seule.

**Entre « devoir appliquer le gabarit » et « l'appliquer » il y a un écart que rien ne mesure.** Une
obligation inscrite dans un registre ressemble à une garantie ; elle n'en devient une que le jour où
quelque chose la vérifie. Première mesure réelle sur le projet d'origine : le gabarit existait depuis
le matin, la liste des outils tenus de l'appliquer aussi, et moins de la moitié le faisaient.

Ce patron est le tiers manquant : il ne définit pas le gabarit et n'oblige personne — il **constate**
qui l'applique vraiment.

## Les quatre questions qu'il pose à chaque rapport

Elles sont volontairement distinctes, parce qu'un rapport peut échouer à chacune indépendamment :

1. **Du CONTENU** — le rapport porte-t-il de la donnée, ou se contente-t-il de renvoyer ailleurs ?
   Un rapport qui dit « voir le fichier X » a coûté son exécution sans rien apporter.
2. **UNE DATE** — le rapport se date-t-il lui-même, lisiblement ? Un rapport non daté ne peut plus
   être comparé à celui d'avant, donc ne peut plus rien montrer d'une évolution.
3. **UNE CONCLUSION** — le rapport dit-il quoi faire de ce qu'il a trouvé ? Un constat sans suite
   ressemble à un problème traité, et c'est ce qui rend ce gaspillage-là invisible.
4. **TOUT ce que l'outil sait** — le rapport sort-il l'ensemble de ce que l'outil sait détecter, ou
   une partie seulement ? C'est la question la plus rentable des quatre, et la moins évidente : un
   détecteur construit, testé, documenté et appelé par personne a coûté trois fois et ne trouvera
   jamais rien.

## Les partis pris qui font sa valeur

**Il RELAIE, il ne recalcule jamais.** Chacune des quatre questions a déjà sa réponse quelque part
dans le paysage ; ce patron ne sait rien qu'un autre ne sache déjà. Sa valeur tient entièrement à
poser les quatre au même endroit, parce que quatre demi-réponses dispersées ne font pas une réponse.

**Une exemption se DÉCLARE, avec sa raison écrite.** Un orchestrateur, un compteur, un utilitaire de
rendu ne produisent aucun constat propre : leur réclamer une conclusion produirait une section vide
à chaque passage, c'est-à-dire du bruit qui apprend à ne plus lire les conclusions. Mais l'exemption
est toujours nommée et motivée — jamais devinée depuis un nom de fichier.

**Un élément non mesurable n'est jamais compté conforme.** Un script illisible, un fichier absent :
ce troisième état casse le verdict au lieu de passer silencieusement. Confondre « je n'ai rien
trouvé » et « je n'ai pas pu regarder » est l'erreur la plus coûteuse qu'un outil de mesure puisse
commettre, parce qu'elle produit un vert.

## Ses garde-fous, et ses limites honnêtes

**Il reconnaît la conformité à un appel dans le code, jamais en lisant le rapport produit.** Un outil
qui appellerait le gabarit sans s'en servir passerait pour conforme. C'est une limite réelle, et elle
est écrite en tête de chaque passage plutôt que découverte par celui qui s'y fiera.

**Sur les détecteurs sans effet, la règle sous-estime volontairement.** Est signalé seulement ce dont
le nom n'apparaît nulle part ailleurs qu'à sa propre déclaration. Un détecteur appelé par une
fonction elle-même morte passera donc pour vivant. C'est le bon sens de l'erreur : un garde-fou dont
la crédibilité est tout le capital doit rater des cas plutôt qu'en inventer.

**Troisième état, ajouté après avoir failli condamner un innocent** : un détecteur appelé par la
seule suite de tests PROTÈGE réellement, dès lors que cette suite tourne à chaque enregistrement de
code. Il est signalé — parce qu'un outil gagnerait à dire ce qu'il sait — mais jamais compté en
faute. Les confondre produirait exactement le chiffre trompeur que ce patron existe pour traquer.
