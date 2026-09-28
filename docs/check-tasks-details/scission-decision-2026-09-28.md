# Scinder l'outil des tâches — ce que la mesure dit, et ce qui reste à trancher

*(Tâche #705, produite le 2026-09-28. **Ce document PROPOSE, il n'applique rien** :
`scripts/check-tasks-details.mjs` est classé TUYAUTERIE score 9 par tool-brain — « seules les
modifications à RISQUE FAIBLE peuvent y être appliquées directement ; au-delà, ça se propose ».
Scinder 4 489 lignes lues par 6 scripts n'est pas un risque faible.)*

## Sa demande, dans ses mots

> « gestion des taches : je pense que ce serait bien de scinder l'outil en 2 ou 3, c'est ce que tu
> recommandes ? »

La tâche #705 avait déjà tranché la **coupure conceptuelle** : d'un côté l'**ÉTAT** (quelles tâches
sont ouvertes, lesquelles traînent, où en est le projet), de l'autre **CE QU'ON A LAISSÉ TOMBER**
(constats sans suite, tâches trop grosses, lignes illisibles).

## Ce que la mesure ajoute, et elle change la question

| Mesure | Valeur |
|---|---|
| Lignes | 4 489 |
| Fonctions exportées | 114 |
| Qui tombent du côté **ÉTAT** au nom | 28 |
| Qui tombent du côté **CE QUI CLOCHE** au nom | 15 |
| **Qui ne tombent d'aucun côté** | **71** |
| Scripts qui l'importent | 3 |
| Symboles réellement importés par d'autres | **8 sur 114** |

**Le fait décisif est la ligne en gras : 71 fonctions sur 114 n'appartiennent à aucune des deux
moitiés.** Ce sont le découpage des lignes, la lecture des tables, l'ordonnancement, le formatage,
les paliers — **un socle partagé dont les deux moitiés ont besoin**.

**Sa question posait « 2 ou 3 ». La mesure répond : trois, ou rien.** Une scission en deux
obligerait soit à recopier le socle (la dette que ce projet combat partout), soit à ce qu'une moitié
importe l'autre — ce qui ne scinde rien, ça déplace la frontière.

## Le second fait, et il rend la scission BEAUCOUP moins risquée qu'elle en a l'air

**Seuls 8 symboles sur 114 sont importés par un autre script** :

| Script | Symboles |
|---|---|
| `cassandra-rh` | `buildRealOnboardingContext` |
| `circle-tasks` | `checkChantierFileFreshness`, `loadAllTaskRows`, `detectPendingIdeaCandidates`, `loadIdeaDecisions`, `findIdeasNeedingDecision`, `IDEES_REGISTRY_PATH` |
| `god-of-all-process` | `dernierPlanDeDepart` |

**106 des 114 exports ne servent qu'à ce fichier et à son test.** La surface publique à préserver
est donc **minuscule** : l'essentiel du risque n'est pas dans les autres scripts, il est dans le
filet de sécurité, qui importe massivement ce fichier.

## Les trois issues, et aucune n'est évidente

1. **Ne rien scinder, et l'assumer par écrit.** Défendable : 4 489 lignes, c'est un cinquième de
   `check-house`. Le coût réel est la relecture, pas l'exécution.
2. **Scinder en TROIS** : `socle` (les 71 fonctions partagées) · `etat` · `ce-qui-cloche`. C'est la
   seule scission que la mesure soutient. Coût : trois kits d'export complets au lieu d'un, et le
   filet à ré-router.
3. **Scinder seulement le SOCLE**, en laissant l'état et les défauts ensemble. Moitié du bénéfice
   pour un quart du risque, et la coupe suivante reste possible ensuite.

## Ce que je recommande, et pourquoi c'est la 3

**L'issue 3.** La mesure dit que le socle existe et qu'il est gros (71 fonctions) ; elle ne dit
nulle part que l'état et les défauts se gênent l'un l'autre. Sortir le socle réduit le fichier de
plus de la moitié sans décider à l'avance d'une frontière que rien n'a encore prouvée nécessaire —
et laisse l'issue 2 ouverte le jour où elle se justifiera.

**Ce que la 3 ne règle pas, et il faut le dire** : le fichier resterait lu par le filet de sécurité
à chaque commit, donc toujours exposé aux conflits. Aucune des trois issues ne change ça.
