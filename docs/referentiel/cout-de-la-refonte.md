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
