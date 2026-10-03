# Les modules de l'Agence — description de chacun

**UN MODULE N'EST PAS UN DOSSIER.** Aucun de ceux décrits ici n'existe comme un répertoire ou un
fichier : chacun est réparti entre un stockage, des outils qui le lisent, un garde-fou qui le
refuse, et des registres voisins. **Le décrire, c'est d'abord établir son périmètre** — et c'est
la moitié du travail.

**POURQUOI CES DESCRIPTIONS EXISTENT**, dans ses mots : *« moi-même aujourd'hui je ne sais pas très
bien comment tout fonctionne par module »*. Elles servent à juger, pas à documenter.

**LA FORME EST FIXE, et elle vient de ce qu'il a lui-même énuméré** : les fonctionnalités, le
fonctionnement, un schéma, ce que le module PRODUIT, ses interactions, et ce qui ne va pas. La
quatrième partie est celle qu'on oublie toujours — un module se décrit volontiers par ce qu'il
fait, rarement par ce qu'il laisse derrière lui, or c'est ce qu'il laisse qui sert aux autres.

| Module | Décrit le | Ce que la description a fait apparaître |
|---|---|---|
| [`GABARIT-fiche-de-module.md`](GABARIT-fiche-de-module.md) · [page lisible](GABARIT-fiche-de-module.html) | 2026-10-03 | **le format n'existait qu'en un exemplaire** : la première fiche disait « elle est reprise telle quelle pour le module suivant », donc la septième serait repartie du vieux format. Le gabarit porte ses six ajouts du 2026-10-03 (périmètre en tête, refus détaillé, dépendances, classe détachable, vendable seul, tableau exhaustif des scripts) et `findFichesIncompletes()` les exige |
| [`module-gestion-des-taches.md`](module-gestion-des-taches.md) · [page lisible](module-gestion-des-taches.html) | 2026-10-02 | **aucun script n'écrit dans le suivi** : une seule porte d'entrée manuelle pour trente-quatre sorties — ce qui explique que tous ses défauts soient des défauts de saisie, jamais de traitement |

**ET UNE TROISIÈME PIÈCE, DEPUIS LE 2026-10-02 : LA CARTE CIBLE** (`docs/referentiel/carte-cible-des-modules.md`,
mesurée par `node scripts/cassandra-rh.mjs carte-cible`). La carte actuelle dit OÙ ON EST, la carte cible
dit OÙ ON VA, et l'écart entre les deux se mesure. Sa particularité, déclarée plutôt que cachée : elle est
tenue à la MAIN, parce qu'une cible est un choix — un générateur rendrait l'état actuel rebaptisé « cible »,
donc un écart nul par construction.

**À NE PAS CONFONDRE AVEC LA CARTE PAR MODULE** (`node scripts/cassandra-rh.mjs carte`), qui range
les 62 outils en 7 familles et mesure ce qui casse si l'une disparaît. La carte donne la VUE
D'ENSEMBLE, dérivée et donc jamais périmée ; ces documents-ci donnent le DÉTAIL d'un seul module,
écrit à la main parce qu'il demande un jugement. Les deux sont nécessaires et ne se remplacent pas.
