# Le gardien des tâches et des idées — blueprint exportable

*Document générique, réutilisable sur un autre projet. Décrit un PATRON, jamais une implémentation.*

## Le problème qu'il résout

Un projet produit deux choses fragiles : des **tâches** et des **idées**. Elles se ressemblent en ce
qu'elles ont toutes deux coûté quelque chose à produire — une analyse, une discussion, un moment de
lucidité — et qu'elles ne pèsent rien tant qu'on ne les a pas inscrites quelque part.

**Une tâche ou une idée perdue est une perte SÈCHE.** Pas un retard, pas une inefficacité : une
valeur produite puis détruite. Rien ne la remplace, et surtout, rien ne signale sa disparition. Un
suivi qui perd une idée ressemble exactement à un suivi qui n'en a jamais eu.

C'est cette asymétrie qui justifie un gardien dédié : les autres défauts d'un projet se voient (un
test rouge, un code qui plante), celui-ci est **invisible par nature**.

## Les quatre situations qu'il surveille

Chacune correspond à une façon différente de perdre de la valeur, et aucune ne se déduit des autres :

1. **La tâche FAITE mais jamais close.** Le travail a eu lieu, le suivi l'ignore. Coût : on la
   refera, ou on croira le chantier en retard alors qu'il est terminé. Se repère en croisant les
   tâches ouvertes avec l'activité réelle du dépôt.
2. **La tâche qui VIEILLIT.** Ouverte depuis longtemps sans mouvement. Ce n'est pas une faute — une
   tâche peut légitimement attendre — mais une tâche qui vieillit sans que personne ne le remarque
   finit par ne plus être une décision, seulement un oubli.
3. **La tâche SANS SOURCE.** Elle existe, et rien ne dit d'où elle vient : quel rapport, quelle
   analyse, quelle demande l'a produite. Sans sa source, personne ne peut juger si elle mérite
   encore d'être faite — ni la fermer en connaissance de cause.
4. **L'IDÉE jamais enregistrée.** La plus fragile des quatre : une idée dite en passant et jamais
   consignée n'existe plus à la session suivante.

## Les partis pris qui font sa valeur

**Il SIGNALE MÊME CE QU'IL NE PEUT PAS PROUVER.** C'est son parti pris le plus important, et il est
contraire à l'instinct habituel d'un outil de mesure. Un indice faible sur une perte sèche vaut
mieux qu'un silence : le coût d'une fausse alerte est une minute de vérification, le coût d'un
silence est la valeur entière. Le rapport de force entre les deux erreurs n'est pas symétrique, donc
la prudence non plus.

**Il APPELLE les outils de suivi, il ne les réimplémente jamais.** Lire l'état des tâches est déjà
le métier d'autres outils ; celui-ci juge le PROCESS — ce que le suivi laisse échapper — et recalculer
ce que les autres savent produirait deux vérités qui divergeraient au premier changement.

**Il juge le process, jamais la personne.** « Cette tâche est faite et jamais close » est un constat
sur le dispositif de suivi. Le transformer en reproche ferait fuir précisément ce qu'on cherche à
capturer : les idées ne se disent plus quand les dire coûte quelque chose.

## Ses garde-fous, et ses limites honnêtes

**L'activité du dépôt est un INDICE, jamais une preuve.** Des enregistrements de code dans la zone
d'une tâche suggèrent qu'elle a avancé ; ils ne prouvent pas qu'elle est terminée. Le gardien propose
donc une clôture, il ne la prononce jamais lui-même.

**L'âge n'est pas un défaut.** Une tâche ancienne peut être une décision assumée d'attendre. Le seuil
de vieillissement produit un signal à regarder, jamais un verdict — et confondre les deux
transformerait un calendrier en accusation.

**Ce qu'il ne peut pas voir, il le dit.** Une idée échangée oralement et jamais écrite ne laisse
aucune trace : ce gardien ne peut pas la retrouver, seulement rappeler qu'elle devait l'être. Cette
impossibilité est déclarée plutôt que masquée — un gardien qui laisserait croire qu'il couvre ce
terrain serait plus dangereux que son absence.
