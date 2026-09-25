# Le filet de sécurité coûte 44 secondes à chaque commit — où part ce temps ?

*(Constat DEEP-READER 7, « optimiser check-house.mjs, seule puce non traitée ». Tâche #818.
**Ce document propose, il n'applique rien** — et cette retenue est une règle, pas une prudence
personnelle : voir « pourquoi je ne l'ai pas fait » plus bas.)*

## Le chiffre, mesuré et pas estimé

Commande : `node scripts/smart-conso-token.mjs filet`

| | |
|---|---|
| Durée totale du filet | **43,7 s** |
| Groupes de test | 244 |
| Part des **10 plus lents** | **76,2 %** |
| Part du **premier à lui seul** | **26,8 %** |

**Ce que ça coûte vraiment** : le filet tourne au crochet *pre-commit*, **en bloquant**. Douze
commits dans une matinée, c'est **neuf minutes d'attente pure**. Et l'attente n'est pas le seul
coût : un contrôle long est un contrôle qu'on finit par vouloir contourner.

## Les dix plus lents

| Temps | Groupe |
|---|---|
| **11,7 s** | INES-official — collecte de fichiers réels par extension |
| 4,2 s | fraîcheur des fichiers de chantier |
| 3,4 s | god-of-all-process — association tâche → process |
| 3,2 s | classification des scripts par TYPE et par CLASSE |
| 2,7 s | le process XP |
| 2,6 s | AGENT-DU-TEMPS |
| 1,6 s | le compteur d'usage |
| 1,4 s | THE-KING |
| 1,3 s | cycle jour/nuit |
| 1,2 s | CLONE-HUNTER |

**Un seul groupe pèse plus du quart du total**, et les neuf suivants en pèsent la moitié. Optimiser
au jugé aurait touché les 234 autres pour rien — c'est exactement pourquoi la mesure devait venir
avant toute idée.

## Pourquoi je ne l'ai pas fait, et ce n'est pas de la timidité

tool-brain classe le filet **TUYAUTERIE, score 9** — le plus haut du dépôt :

> « lancé par le crochet pre-commit BLOQUANT — sa panne empêche tout commit — la casser casse le
> travail de tout le monde. Relecture humaine et contrôle de perte de références OBLIGATOIRES
> avant d'appliquer quoi que ce soit ici. »

La règle qui en découle : **seules les modifications à risque FAIBLE s'appliquent directement ;
au-delà, ça se propose.** Restructurer le filet n'est pas un risque faible.

## Les trois options, avec leur vrai coût

### 1. Ne rien faire

44 s par commit. C'est un choix défendable : le filet est ce qui rend ce projet tenable, et payer
44 s pour ne jamais casser le dépôt est une bonne affaire. **Rien ne prouve que ce temps soit mal
dépensé** — un groupe lent qui balaie vraiment le dépôt fait peut-être exactement ce qu'il faut.

### 2. Regarder les trois plus lents (19,3 s, soit 44 %)

Le plus probable : plusieurs groupes rebalaient le dépôt entier chacun de leur côté. Un balayage
partagé les ramènerait à quelques secondes **sans rien retirer à ce qui est vérifié**. C'est
l'option à **risque faible** : on ne change ni une assertion, ni une règle, seulement la façon de
lire les fichiers. Gain plausible : **15 à 20 secondes**, à confirmer en relançant la mesure.

### 3. Un mode rapide au pre-commit, le filet complet ailleurs

Les 234 groupes rapides tiennent en **10,6 s**. Tentant — et **c'est l'option que je déconseille
le plus fort**. Le crochet pre-commit deviendrait un contrôle PARTIEL qui rend exactement le même
vert qu'un contrôle complet. C'est le défaut que ce projet a passé la matinée entière à traquer, et
l'installer volontairement dans le garde-fou principal serait le pire endroit pour le faire.

## Ce que je te demande

**Option 2, ou on n'y touche pas ?** Si tu veux l'option 2, je regarde les trois plus lents un par
un (jamais une passe globale), je propose le changement, et je relance la mesure pour montrer le
gain réel — ou l'absence de gain.

## Plan d'action (Article 28)

- **RETENU** — la mesure elle-même, réutilisable et relançable → tâche **#818**, faite.
- **À TRANCHER** — laquelle des trois options → tâche **#819**, en attente.
- **ÉCARTÉ** — l'option 3, sauf demande explicite : un pre-commit partiel rendrait un vert
  indistinguable d'un vert complet, dans l'outil dont c'est précisément le métier de ne pas mentir.
