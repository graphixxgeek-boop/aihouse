# Scan SMART-CONSO-TOKEN — portée Global — 2026-09-22 (Ronde CIRCLE-TASKS, mode AUTO)

*(Item `smart-conso-token-scan` de la Ronde exécutée par Opus 5. Portée Global au sens de
`scanScope()` : tous les `.md`/`.txt` de `CLAUDE.md` + `docs/`, `alwaysLoadedSet = {CLAUDE.md}`.)*

## Chiffres bruts

- **197 documents analysés**, **712 107 tokens estimés au total**.
- **1 seul `action_requise`** : `CLAUDE.md`, 1 471 lignes, ~29 606 tokens — le seul document
  réellement rechargé à chaque message, donc le seul dont la taille se paie en continu.
  3 asides narratives datées repérées mécaniquement (~203 tokens) : les candidats sûrs restants sont
  devenus marginaux, la suite du tri est manuelle (Article 19).
- **26 `informative`** : au-delà du repère « progressive disclosure » (300 lignes) mais lus à la
  demande, donc taille normale pour de la documentation de référence.

## Trouvaille réelle de ce passage

`docs/suivi/sessions/session_0151JrVYzJ2bdCShaXhFAjLo.md` pèse **~109 295 tokens pour 469 lignes** —
c'est désormais **le document le plus lourd de tout le dépôt**, près du double de
`docs/regles-de-travail.md` (~55 399) et presque quatre fois `CLAUDE.md` (~29 606).

Ce n'est pas un document toujours chargé, donc le scan le classe honnêtement en `informative` — mais
le chiffre mérite d'être relevé pour deux raisons que le scan seul ne peut pas juger :

1. **Densité anormale** : 233 tokens par ligne en moyenne, contre ~21 pour `regles-de-travail.md`.
   Les lignes sont des lignes de tableau de suivi extrêmement longues, pas de la prose.
2. **Fréquence de relecture réelle** : c'est le fichier de suivi de la session EN COURS, donc
   relu plusieurs fois par session de travail — ce qu'aucun scan mécanique ne mesure, et exactement
   la seule question que `scanDocumentWeight()` dit lui-même ne pas pouvoir trancher
   (« est-il relu plus souvent que nécessaire dans une même session ? »).

Le système de suivi (`docs/systeme-de-suivi.md`) prévoit un fichier par session, sans plafond de
taille ni mécanisme de rotation. Aucune décision n'est prise ici : c'est un signal, à trancher avec
l'utilisateur.

## Top 10 des plus lourds (tous lus à la demande)

| Document | Lignes | Tokens estimés |
|---|---|---|
| docs/suivi/sessions/session_0151JrVYzJ2bdCShaXhFAjLo.md | 469 | ~109 295 |
| docs/regles-de-travail.md | 2 591 | ~55 399 |
| CLAUDE.md *(toujours chargé)* | 1 471 | ~29 606 |
| docs/referentiel/principes.md | 1 199 | ~24 413 |
| docs/contexte-projet/journal-dialogue-exemple.txt | 2 904 | ~16 403 |
| docs/simulations/full_sim11_transcript.txt | 2 556 | ~15 353 |
| docs/simulations/full_sim16_transcript.txt | 2 901 | ~14 971 |
| docs/simulations/full_sim17_transcript.txt | 2 676 | ~14 504 |
| docs/referentiel/parametres.md | 685 | ~13 663 |
| docs/simulations/full_sim7_transcript.txt | 2 516 | ~12 770 |

## Note de méthode (écart trouvé pendant l'exécution)

`scripts/smart-conso-token.mjs` n'expose **aucune sous-commande CLI** pour lancer un scan de portée :
`process.argv[2]` y est interprété comme un `actionType` passé à `assess()`. Le scan Global a donc dû
être lancé par un script d'appel écrit à la main. Ce n'est pas un bug, mais c'est une friction réelle
pour un item de Ronde dont l'`execute` dit littéralement « Relancer un scan de portée Global » — à
trancher avec l'utilisateur (ajouter une sous-commande, ou réécrire l'`execute`).
