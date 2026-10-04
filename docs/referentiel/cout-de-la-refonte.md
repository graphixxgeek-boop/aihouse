# COÛT-DE-LA-REFONTE — instanciation sur ce projet

*(Nom **PROVISOIRE**. Les noms de ce projet se choisissent par l'utilisateur, **par séries à
l'intérieur d'une même famille** — jamais au cas par cas, et jamais par l'agent. Il figure donc
parmi les noms en attente de baptême chez l'AGENT DES NOMS.)*

**Ce qu'il est** : l'outil qui chiffre ce que coûterait de tout reprendre à zéro — en volumes,
jamais en avis. Blueprint générique : `docs/cout-de-la-refonte-blueprint.md`.
Script : `scripts/cout-de-la-refonte.mjs`. Registre : `docs/cout-de-la-refonte/`.

## Pourquoi il existe ici

Sa proposition du 2026-09-30 au soir, mot pour mot : *« il faut partir sur un nouveau code
totalement propre, et recommencer tout à zéro, en reprenant tout point par point : situer le cœur
de l'agence, et agréger les modules autour. Franchement je serais partant pour faire ça. »* Puis,
dans son plan de nuit : *« finis le chiffrage »* (tâche **#1344**).

**Et il existe sous forme d'OUTIL, pas d'estimation, pour une raison datée** : la veille, le
chiffre « 38 fichiers sur 40 portent des chemins écrits en dur » avait été répété toute une soirée
comme **l'argument principal** de la refonte — et il n'était pas reproductible (tâche #1354). Un
chiffre qui pousse à l'action coûte infiniment plus cher qu'un chiffre qui rassure (XP #35).
Celui-ci se rejoue, à la commande, contre le vrai dépôt.

## Les quatre familles, telles qu'elles sont déclarées ici

| Famille | Ce que la refonte lui ferait |
|---|---|
| l'outillage de l'Agence (`scripts/`) | **c'est CE périmètre que sa proposition vise** |
| le moteur du Jeu (`lib/`, `app/`, `components/`) | **hors périmètre** par sa consigne permanente : « rien qui change ce que Lia et Noé disent ou font » |
| les documents qui font loi (CLAUDE.md, règles de travail, philosophie, `docs/referentiel/`) | ne se réécrit pas : se relit, et chaque règle retirée est une décision humaine (Article 13) |
| les registres et rapports produits (`docs/`) | se régénère ou s'archive — jamais à réécrire à la main |

## Le premier passage réel, le 2026-10-01

**Le chiffre que personne n'avait** : **2 228 blocs de raison** dans l'outillage. Ce sont autant de
décisions déjà prises, chacune payée une fois.

**Et sa répartition compte plus que son total** : 25,3 par fichier en moyenne, mais **8 en
médiane**, et `check-house.mjs` en porte **718 à lui seul — 32 % du total**. Hors lui : 17,4 par
fichier. **Le coût n'est donc pas réparti, il est concentré** — et une concentration se traite,
là où une moyenne ne se traite pas. La première version ne rendait que la moyenne, et elle
dessinait un dépôt uniformément dense qui n'existe pas.

**Le contrepoids, lu chez SAFE-EXPORT** : exportabilité globale à 88 %, dont **3 dimensions
exactement à 100 %** qu'une refonte repartirait à zéro — dont « l'Agence a-t-elle été installée
POUR DE VRAI ailleurs », qui a coûté un banc témoin entier.

## Un défaut trouvé en le construisant, et gardé écrit

La première version lisait un champ `pct` qui **n'existe pas** dans le rapport de SAFE-EXPORT (il
s'appelle `valeur`) : elle rendait « aucune dimension à 100 % » alors que plusieurs le sont. **Un
zéro par mauvais champ ressemble trait pour trait à un zéro mesuré**, et celui-ci faisait
disparaître tout le contrepoids — c'est-à-dire qu'il faisait pencher la décision tout seul.
Attrapé en comparant au rapport que SAFE-EXPORT imprime lui-même (Article 25).

## Ce qu'il a changé chez son voisin

`mesuresDeLExport()` a été **extrait** de la commande `rapport` de SAFE-EXPORT, sans une ligne de
changement de comportement : l'assemblage des dix mesures vivait dans la commande, donc tout outil
qui voulait lire les acquis de l'export devait le recopier — c'est-à-dire créer la deuxième copie
qui finit toujours par diverger (Article 24). Un seul assemblage, un seul endroit où il vieillit.

## Hors portée, déclaré plutôt que tu

- Il mesure un **VOLUME**, jamais une **DIFFICULTÉ**.
- Il voit qu'un bloc porte une raison, jamais si elle est encore valable.
- Il ne convertit rien en jours : aucune mesure du dépôt ne dit qui ferait le travail.
- **Il ne recommande RIEN.** La décision de refonte est de celles que l'Article 16 réserve
  explicitement à l'utilisateur.

## LES PARTIES À RATIONALISER, DANS L'ORDRE (2026-10-04, tâche #1571)

Sa demande, et c'est **un instrument de pilotage plutôt qu'une liste** : « il nous faut des
reperes, pour voir au fur et à mesure les parties qui doivent etre rationnalisées […] la liste de
TOUTES les parties à traiter dans le cadre de la rationnalisation, dans l'ordre ou nous allons le
faire d'apres ton plan d'action ». Avec deux exigences explicites : **l'ordre**, et **la liste de
ce qui n'est PAS rationalisable**.

Rendu à **chaque** passage de `node scripts/cout-de-la-refonte.mjs`, déposé dans
`docs/cout-de-la-refonte/parties-a-rationaliser.md`.

### Pourquoi ici, et pas dans un outil de plus

Cet outil sait déjà compter le **volume** et les **raisons écrites** par famille — exactement ce
qu'il faut pour chiffrer une partie. Un outil séparé aurait porté une seconde copie de ce
comptage, qui aurait fini par en diverger (leçon L29).

### Rien n'est écrit à la main, et c'était la seule façon de ne pas se périmer

| Ce qui est rendu | D'où ça vient |
|---|---|
| les PARTIES | les 9 modules déjà déclarés dans `MODULES_CIBLES` (le-coordinateur), lus à l'exécution |
| leurs SCRIPTS | résolus par le catalogue des prestations + la table slug→script (`AGENT_SCRIPT_FILES`) |
| l'ORDRE | dérivé des **imports réels** entre ces scripts |
| les EXCLUSIONS | les familles hors périmètre + les 13 dispenses du kit d'export, chacune avec **sa raison déjà écrite ailleurs** |

### Le critère d'ordre est un fait, pas une préférence

Un module dont les scripts sont importés par d'autres passe **avant** eux : rationaliser un socle
après ce qui s'appuie dessus oblige à refaire les dépendants, et l'inverse n'est jamais vrai.

### Et c'est en voulant l'appliquer qu'on a trouvé le vrai résultat

**SEPT modules sur neuf s'importent mutuellement.** Il n'existe donc **aucun** ordre par
dépendance entre eux, et en rendre un serait rendre un ordre faux qui a l'air juste (leçon L4).
Le cycle est **nommé**, et l'ordre de repli est **déclaré** plutôt que subi : le plus **demandé**
d'abord (celui dont le plus de modules dépendent coûte le plus cher à refaire en dernier), le plus
lourd à égalité.

**C'est un constat en soi, et il porte sur sa proposition centrale** : la modularisation qu'il vise
n'est pas gratuite, puisque les modules d'aujourd'hui ne forment pas des paquets détachables.

### Ce que l'ordre n'est PAS

Il dit dans quel ordre le travail **coûte le moins cher**, jamais ce qui **compte le plus** — cette
priorité-là est un arbitrage qui lui revient (Article 16). Et le poids est un **volume**, jamais une
**difficulté**.

### Un défaut payé en chemin, gardé en contre-test

Les dispenses du kit d'export sont un **tableau** d'entrées `{ motif, pourquoi }`, et je les lisais
comme un dictionnaire : le rapport imprimait « 0 → [object Object] », treize fois. **Un lecteur qui
se trompe de forme ne plante pas, il imprime du bruit parfaitement crédible.**

### Ce qui reste à trancher, et qui ne l'est pas par l'agent

Sa demande dit « document à enregistrer **DANS la stratégie de rationalisation** » — laquelle
n'existe pas. Le document vit donc chez l'outil, et le plan d'action porte la question en
**À TRANCHER** : créer une fiche de stratégie de rationalisation dans `docs/strategies/` et y
renvoyer, ou laisser l'outil seul propriétaire. *(Le chemin exact n'est pas cité ici tant que le
document n'existe pas : une référence morte ressemble à un lien, ce qui est pire qu'une absence.)* Créer une stratégie à sa place serait décider pour lui.
