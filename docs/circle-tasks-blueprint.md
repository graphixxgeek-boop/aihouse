# CIRCLE-TASKS — plan générique : la Ronde périodique des vérifications gratuites

*(Blueprint réutilisable. Instanciation de ce projet : `docs/referentiel/circle-tasks.md`.)*

## Le problème qu'il résout

Un projet outillé accumule des vérifications **gratuites** (aucun appel API, aucun agent séparé) que
personne ne lance, parce qu'aucune ne s'impose jamais d'elle-même : chacune prise isolément peut
attendre, et « peut attendre » répété trente fois devient « n'a jamais tourné ».

La Ronde est le rendez-vous qui les rend exigibles **ensemble**. Ce n'est pas un ordonnanceur : rien
ne se déclenche tout seul. C'est un **menu** qu'on ouvre, qui dit ce qui dort et depuis quand.

## Les cinq propriétés non négociables

### 1. Chaque entrée porte son COÛT, en deux colonnes distinctes

Le coût en appels d'API externe et le coût en tokens de l'agent sont **deux choses différentes** et
ne se confondent jamais. Une vérification gratuite en API peut être lourde à lire, et l'inverse.
Fondre les deux en un seul « coût » rend le menu inutilisable : on ne sait plus ce qu'on arbitre.

### 2. Une entrée dit ce qu'il faut FAIRE, jamais seulement ce qu'il faut regarder

Le champ d'exécution est une consigne complète : quelle commande, quoi lire dans sa sortie, où
écrire la trace. Une entrée qui dit « vérifier X » sans dire comment sera exécutée différemment à
chaque passage, et ses résultats ne se compareront pas.

### 3. La FRAÎCHEUR se dérive de traces réelles, jamais d'un compteur

« Depuis quand ce contrôle n'a-t-il pas tourné ? » se lit sur les fichiers qu'il a réellement
déposés. Un compteur interne dérive au premier passage manuel. Et quand aucune trace n'existe, on
dit **« jamais mesuré »** — jamais zéro jour, qui se lirait comme « tout frais ».

### 4. Chaque passage laisse un ARTEFACT daté

Une Ronde qui ne laisse rien derrière elle n'est pas vérifiable : on ne peut ni prouver qu'elle a eu
lieu, ni comparer deux passages. D'où deux tables, et le garde-fou qui les confronte :

| Table | Ce qu'elle porte |
|---|---|
| les entrées | l'id, le thème, le coût, la consigne |
| les dossiers de dépôt | où l'artefact de chaque entrée atterrit |

**Elles divergent en silence** si rien ne les compare : une entrée peut promettre un rapport pendant
des semaines sans qu'aucun dossier ne puisse le recevoir, et l'erreur ne se révèle qu'en écrivant
réellement l'artefact — c'est-à-dire pendant une Ronde, au pire moment. Le garde-fou se écrit dans
les **deux sens** : une entrée sans dossier, et un dossier dont l'entrée n'existe plus.

### 5. Le POURQUOI de chaque entrée est consigné, séparément

Le motif d'une entrée n'est déductible d'aucun diff. Sans un journal qui le porte, il est perdu le
jour même. Et ce journal a besoin de son propre garde-fou, sinon il reste vide pendant que les
entrées s'ajoutent.

## Les deux tables satellites qu'on oublie toujours

- **Les registres couverts autrement** — un outil peut légitimement n'avoir aucune entrée de Ronde
  (il tourne à chaque commit, il répond à un événement, c'est une bibliothèque appelée par d'autres).
  Cette exclusion **s'écrit avec sa raison**, sinon le garde-fou doit choisir entre crier sur des cas
  légitimes ou se taire sur tous.
  **Piège réel à connaître** : une exclusion juste pour UNE couche d'un outil finit par le dispenser
  de TOUTES. Avant d'ajouter une entrée, on relit l'exclusion qui existe peut-être déjà.
- **Les entrées dispensées d'artefact** — celles dont le produit n'est pas un rapport texte (une
  image, une capture). Même règle : la raison s'écrit.

## Les verrous d'ouverture

Certains défauts rendent une Ronde **mensongère** plutôt que simplement incomplète : une numérotation
du suivi cassée, un compteur d'usage muet, un registre hors du contrôle. On peut les vérifier **à
l'ouverture** et refuser d'ouvrir tant qu'ils tiennent.

Le calibrage compte plus que le mécanisme : **bloquer la Ronde, pas le commit**. Bloquer le commit
punirait un travail sans rapport avec le défaut, et pousserait à contourner. Et un verrou qui ne
peut pas mesurer ne bloque jamais — il le dit fort.

## Sa limite honnête

Il dit ce qui dort ; il ne dit pas ce que ça vaut. Le jugement sur le déroulé d'une Ronde revient à
un **contrôleur de process extérieur** — un outil ne peut pas être à la fois le sujet et le juge.
