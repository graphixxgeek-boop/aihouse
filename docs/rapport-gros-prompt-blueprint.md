# rapport-gros-prompt — plan générique : rendre compte d'une saisine, point par point

*(Blueprint réutilisable. Instanciation : `docs/referentiel/rapport-gros-prompt.md`.)*

## Le besoin, et il vient d'une bonne pratique côté humain

Une personne qui travaille avec un agent apprend vite à **accumuler** ses idées, ses tâches et ses
questions plutôt que d'interrompre par petits messages, et à les envoyer d'un bloc avant une période
de travail autonome. C'est un progrès — l'interruption coûte cher.

Mais ça déplace le risque : une saisine de trente points revient, au retour, sous la forme d'un
compte rendu global où **on ne peut plus retrouver son point n° 17**.

## Le principe : chaque point porte son SORT, et le rapport refuse d'être incomplet

Le rapport reprend la saisine **point par point**, réorganisée, et chaque point porte ce qu'il est
devenu. La règle qui fait tout tenir :

> **Un point marqué « fait » sans tâche associée est invérifiable** — on ne peut ni le retrouver,
> ni savoir s'il a vraiment abouti.

L'outil **REFUSE donc de produire le rapport** plutôt que de le produire incomplet. C'est le seul
réglage qui marche : un avertissement se contourne par fatigue, un refus non.

## Ce qu'il n'est PAS, et c'est la moitié de sa définition

**Pas un générateur de contenu.** Il ne devine rien, ne résume rien, ne juge rien. Il prend une
saisine déjà rédigée et lui applique le gabarit standard des rapports — jamais un second gabarit
concurrent, jamais une mise en forme inventée sur place.

Tout ce qu'il ajouterait de son cru serait exactement ce que le lecteur ne peut pas vérifier.

## Générique par construction

Une saisine est une liste de points. Rien ici ne connaît le domaine du projet : n'importe quel
projet piloté par IA réutilise ce fichier tel quel.

## Sa limite honnête

Il garantit que chaque point a un sort déclaré ; il ne garantit pas que ce sort soit le bon. Le
jugement sur ce qui méritait d'être fait reste entier.
