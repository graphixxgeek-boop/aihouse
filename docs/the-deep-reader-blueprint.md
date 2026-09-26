# THE-DEEP-READER — plan générique : confronter le SUIVI à ce qui s'est vraiment passé

*(Blueprint réutilisable. Instanciation : `docs/referentiel/the-deep-reader.md`.)*

## Le trou qu'il comble, et aucun autre outil ne peut le combler

Tout un paysage d'outils vérifie que les documents s'accordent **entre eux** : le suivi est bien
formé, l'index correspond au dossier, la table cite des chemins qui existent. Aucun ne peut dire si
ce qui est écrit correspond à **ce qui s'est réellement passé**.

Un suivi peut être impeccable et faux. Une tâche close « Terminé » sur un travail à moitié fait est
invisible à toute vérification mécanique : la ligne est bien formée, la date est valide, le fichier
cité existe.

## Pourquoi il est structurellement coûteux

La seule source qui dit ce qui s'est passé est **l'historique de conversation** — long, non
structuré, et impossible à parcourir mécaniquement. Il faut donc un agent séparé qui lit et
compare. C'est cher, et ça ne peut pas être autrement : le rendre gratuit reviendrait à ne plus
comparer qu'aux documents, c'est-à-dire à refaire ce que les autres font déjà.

## Les deux conseillers obligatoires AVANT de le lancer

Un coût variable et élevé se consulte avant, jamais après :

1. **Le régulateur de consommation** de l'agent — combien ça va coûter, et est-ce le moment.
2. **Le régulateur d'API**, si l'outil en déclenche.

Un outil coûteux sans consultation préalable finit par être lancé « pour voir », et un « pour voir »
qui coûte cher ne se répète pas : l'outil tombe en désuétude après deux usages.

## Ce qu'il trouve, et que rien d'autre ne trouve

Les écarts entre l'intention exprimée et le travail consigné : une idée mentionnée puis effacée
d'un document sans qu'aucune tâche ne la reprenne · une demande reformulée en cours de route et
traitée dans sa première version · une tâche close dont le livrable ne correspond pas à la demande.

Chacun de ces écarts ressemble à un dossier en ordre.

## Sa limite honnête

Il lit ce que l'historique contient. Ce qui s'est décidé hors de cet historique lui est invisible —
et sa lecture reste une lecture, avec le taux d'erreur d'une lecture.
