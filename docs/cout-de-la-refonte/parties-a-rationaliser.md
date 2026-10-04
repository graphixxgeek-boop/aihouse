<!-- DOCUMENT GÉNÉRÉ — produit intégralement par un outil, aucune ligne n'est écrite à la main -->
# Les parties à rationaliser, dans l'ordre — et ce qui ne l'est pas

> Produit par `node scripts/cout-de-la-refonte.mjs` le 2026-10-04T03:35Z (heure de source système), en lisant la carte des modules, le catalogue des prestations et les imports réels entre scripts.
> Ta demande : « la liste de TOUTES les parties à traiter dans le cadre de la rationnalisation, dans l'ordre ou nous allons le faire d'apres ton plan d'action […] Hors ce qui n'est pas rationnalisable ».

**Rien ici n'est écrit à la main.** Les parties sont les modules déjà déclarés, l'ordre se dérive des imports réels, et chaque exclusion porte la raison déjà écrite ailleurs dans le dépôt.

```
--- LES PARTIES À RATIONALISER, DANS L'ORDRE — les fournisseurs avant leurs clients
  9 partie(s) · 62305 ligne(s) d'outillage · 1358 raison(s) écrite(s) à relire en chemin

  | # | Partie | Outils | Lignes | Raisons | Dépend de | Fournit à |
  |---|---|---|---|---|---|---|
  | 1 | **EXPORT ET LIVRAISON** | 4 | 5329 | 136 | — | audit, outillage, qualite-du-code |
  | 2 | **LE JEU** | 11 | 2096 | 49 | — | — |
  | 3 | **PILOTAGE DU TRAVAIL** | 13 | 10797 | 242 | audit, outillage | audit, gouvernance, outillage, qualite-du-code, ressources |
  | 4 | **AUDIT INDÉPENDANT** | 11 | 3988 | 89 | export, pilotage | gouvernance, memoire, outillage, pilotage, qualite-du-code |
  | 5 | **ORGANISATION DE L'OUTILLAGE** | 8 | 12296 | 276 | audit, export, pilotage | pilotage, qualite-du-code |
  | 6 | **GOUVERNANCE** | 5 | 10294 | 205 | audit, pilotage | — |
  | 7 | **QUALITÉ DU CODE** | 13 | 9631 | 207 | audit, export, outillage, pilotage | — |
  | 8 | **CONNAISSANCE ET MÉMOIRE** | 8 | 4663 | 95 | audit | — |
  | 9 | **RESSOURCES ET COÛTS** | 5 | 3211 | 59 | pilotage | — |

  ⚠️ CYCLE DE DÉPENDANCES — pilotage ↔ audit ↔ outillage ↔ gouvernance ↔ qualite-du-code ↔ memoire ↔ ressources
     7 module(s) sur 9 s'importent mutuellement : il n'existe AUCUN ordre par dépendance entre eux, et en rendre un serait rendre un ordre faux qui a l'air juste.
     Ordre de repli, déclaré : le plus DEMANDÉ d'abord (celui dont le plus de modules dépendent coûte le plus cher à refaire en dernier), puis le plus lourd à égalité.
     C'EST AUSSI UN RÉSULTAT EN SOI : la modularisation qu'il vise n'est pas gratuite, puisque les modules d'aujourd'hui ne forment pas des paquets détachables.

  HORS PORTÉE : l'ordre dit dans quel ordre le travail coûte le MOINS CHER — un fournisseur avant ses clients — jamais ce qui compte le plus. La priorité d'importance est un arbitrage qui lui revient (Article 16). Et le poids est un VOLUME, jamais une DIFFICULTÉ.

  À NE PAS CONFONDRE : la partie « LE JEU » ci-dessus désigne les OUTILS qui regardent le jeu (le ton, le rendu, les simulations), jamais le moteur du jeu lui-même — celui-ci figure dans la liste des exclusions, juste en dessous.

--- CE QUI N'EST PAS RATIONALISABLE — sa seconde exigence, chaque exclusion avec sa raison ÉCRITE
  · le moteur du Jeu (93 fichier(s), 12624 ligne(s))
      → hors périmètre par sa consigne permanente : « rien qui change ce que Lia et Noé disent ou font »  [FAMILLES (cout-de-la-refonte)]
  · les documents qui font loi (119 fichier(s), 30075 ligne(s))
      → ne se réécrit pas : se relit, et chaque règle retirée est une décision humaine (Article 13)  [FAMILLES (cout-de-la-refonte)]
  · les registres et rapports produits (554 fichier(s), 83368 ligne(s))
      → se régénère ou s'archive — jamais à réécrire à la main  [FAMILLES (cout-de-la-refonte)]
  · /^scripts\/install-pnpm\.sh$/
      → il installe l'environnement de CE conteneur : il décrit la machine d'ici, jamais un outil à remonter ailleurs  [EXEMPTES_DU_KIT (safe-export)]
  · /^scripts\/install-ci/
      → il installe les dépendances de CE dépôt en intégration continue : il décrit la machine d'ici, jamais un outil à remonter ailleurs  [EXEMPTES_DU_KIT (safe-export)]
  · /^scripts\/pnpm-install/
      → il installe les dépendances de CE dépôt : il décrit la machine d'ici, jamais un outil à remonter ailleurs  [EXEMPTES_DU_KIT (safe-export)]
  · /^scripts\/hooks\//
      → les crochets git sont le CÂBLAGE de l'Agence à ce dépôt-ci, pas des outils : ils se réinstallent par `hooks/install.mjs`, qui a lui-même son kit  [EXEMPTES_DU_KIT (safe-export)]
  · /^scripts\/run-framework/
      → il lance le PRODUIT (le jeu), pas l'outillage — rang Hors Agence : ce qui part avec l'Agence n'a pas à emporter le camion de livraison  [EXEMPTES_DU_KIT (safe-export)]
  · /^scripts\/lib-json\.mjs$/
      → BIBLIOTHÈQUE, pas un outil : un morceau partagé que d'autres scripts importent, sans commande ni registre. Elle part avec l'Agence comme un organe part avec le corps — jamais comme un bagage à part (son YES du 2026-10-03, tâche #1496)  [EXEMPTES_DU_KIT (safe-export)]
  · /^scripts\/lib-markdown-table\.mjs$/
      → BIBLIOTHÈQUE, pas un outil : le lecteur de tables partagé par plusieurs scripts, extrait en 2026-09-19 précisément pour n'être écrit qu'une fois (son YES du 2026-10-03, tâche #1496)  [EXEMPTES_DU_KIT (safe-export)]
  · /^scripts\/corpus-mesure\.mjs$/
      → BIBLIOTHÈQUE, pas un outil : le mécanisme partagé qui empêche un Gardien sacré du code de dire « tout va bien » sur un corpus vide — il n'a de sens qu'appelé par eux (son YES du 2026-10-03, tâche #1496)  [EXEMPTES_DU_KIT (safe-export)]
  · /^scripts\/judge-persona-shared\.mjs$/
      → BIBLIOTHÈQUE, pas un outil : la moitié commune de THE-FINAL-JUDGE et THE-DEEP-READER, extraite en #152 pour ne pas diverger en deux copies (son YES du 2026-10-03, tâche #1496)  [EXEMPTES_DU_KIT (safe-export)]
  · /^scripts\/execution-profile\.mjs$/
      → BIBLIOTHÈQUE, pas un outil : un profil d'exécution lu par d'autres scripts, sans commande ni verdict propre (son YES du 2026-10-03, tâche #1496)  [EXEMPTES_DU_KIT (safe-export)]
  · /^scripts\/find-brain\.mjs$/
      → BIBLIOTHÈQUE, pas un outil : la couche interne de tool-brain, que la charte interdit explicitement d'appeler directement — un morceau partagé, jamais une porte d'entrée (son YES du 2026-10-03, tâche #1496)  [EXEMPTES_DU_KIT (safe-export)]
  · /^scripts\/sites-env\.mjs$/
      → OUTIL D'ENVIRONNEMENT : il décrit la machine d'ici (les sites et leurs variables), jamais un outil à remonter ailleurs — même critère que install-ci et pnpm-install, qui y étaient déjà (son YES du 2026-10-03, tâche #1496)  [EXEMPTES_DU_KIT (safe-export)]
  · /^scripts\/api-providers\.mjs$/
      → OUTIL D'ENVIRONNEMENT : le registre des fournisseurs d'API sondables DEPUIS CE CONTENEUR, strictement de portée diagnostic — il décrit l'environnement, pas une capacité de l'Agence (son YES du 2026-10-03, tâche #1496)  [EXEMPTES_DU_KIT (safe-export)]
```

<!-- /DOCUMENT GÉNÉRÉ -->
