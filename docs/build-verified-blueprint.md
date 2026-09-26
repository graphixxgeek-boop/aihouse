# build-verified — plan générique : une compilation qui ne peut pas mentir

*(Blueprint réutilisable. Instanciation : `docs/referentiel/build-verified.md`.)*

## Ce qu'il est

Un lanceur de compilation enveloppé dans trois protections, parce qu'une compilation nue ment de
trois façons différentes.

## Les trois mensonges d'une compilation nue, et leur remède

### 1. Elle réussit dans un environnement qu'on n'aura plus

Une compilation dépend de variables et de chemins qui existent sur la machine du moment. Elle passe
ici et échoue ailleurs, sans que rien ne l'ait annoncé.

**Remède** : l'environnement se prépare TOUJOURS, et le script se **relance lui-même** à travers le
préparateur d'environnement s'il constate qu'il n'y est pas passé. Jamais un avertissement « pensez
à sourcer d'abord » — un avertissement se saute, une relance non.

### 2. Elle ne finit jamais

Une compilation qui pend tient la machine indéfiniment, et dans une chaîne automatisée elle bloque
tout ce qui suit sans jamais produire d'échec. **Une absence de réponse n'est pas un succès**, et
c'est pourtant ce à quoi elle ressemble.

**Remède** : une limite de temps, toujours. Et le script **refuse de démarrer** si l'outil qui la
fournit manque, plutôt que de tourner sans filet — un garde-fou absent doit se voir, pas se
deviner.

### 3. Elle s'arrête au premier avertissement, ou ne s'arrête jamais

Sans les bons réglages du shell, une erreur au milieu d'un enchaînement de commandes passe
inaperçue : la dernière commande réussit, donc le tout « réussit ».

**Remède** : arrêt à la première erreur, variables non définies traitées comme des erreurs, et
échec propagé à travers les tubes.

## Pourquoi ces trois-là et pas d'autres

Ce sont les trois qui produisent un **faux vert** — le seul résultat dont on ne se méfie jamais. Un
échec bruyant se traite ; un succès faux se propage.

## Sa limite honnête

Il garantit que la compilation a vraiment eu lieu, dans le bon environnement, et qu'elle s'est
terminée. Il ne dit rien de ce qu'elle a produit.
