# ARGUS — instanciation pour Maison IA vivante

*(Cf. `docs/argus-blueprint.md` pour le principe générique. Ce document décrit comment ARGUS est
concrètement câblé sur CE projet — jamais le raisonnement générique, qui reste dans le blueprint.
Créé le 2026-09-19, Article 20 de CLAUDE.md : ARGUS doit toujours être déployé.)*

## Ce qui existe aujourd'hui

- **`scripts/check-argus.mjs`** — la partie mécanique, gratuite, zéro appel réseau. Deux
  vérifications :
  1. **Champs de `lib/life.ts` (type `Life`) potentiellement jamais lus ailleurs** dans `lib/`,
     `app/` ou `components/` — la même nature de bug que le bouton jour/nuit manuel trouvé et
     corrigé le jour même de la création d'ARGUS. Compte les occurrences du nom du champ dans tout
     le projet ; `≤2` occurrences totales = confiance "confirmé", `3-4` = "probable" (au-delà, le
     champ est considéré réellement utilisé). Seuils choisis empiriquement sur le premier
     balayage réel (cf. `docs/argus/index.md`) — à resserrer si l'expérience montre trop de faux
     positifs ou de faux négatifs.
  2. **Marqueurs `TODO`/`FIXME`** laissés dans le code source (hors `scratchpad`).
  - La partie "raisonnement" (combinaison de mécanismes jamais envisagée, conséquence logique
    oubliée, lien discret) n'est PAS automatisée — elle se fait à la demande, avec une vraie
    réflexion, sur un sujet précis. Aucun script ne peut honnêtement la simuler (cf. "Ce que ce
    patron n'est pas", blueprint).
- **`docs/argus/`** — dossier des rapports archivés (un fichier par balayage) + `index.md` (table
  des trouvailles, mise à jour à chaque exécution et à chaque fermeture de trou).

## Toujours déployé (Article 20)

- La partie mécanique (`check-argus.mjs`) doit tourner à chaque changement de code significatif,
  au même titre que `check-house.mjs` — pas encore intégré au même script unique (les deux restent
  deux commandes séparées pour l'instant, une fusion peut être envisagée plus tard si ça
  simplifie sans rien masquer).
- La partie raisonnement se déclenche : (a) à l'initiative de l'agent avant de coder une idée
  nouvelle un peu ambitieuse, en se demandant explicitement "quelle combinaison, quel cas limite,
  quel lien discret cette idée pourrait-elle oublier ?" ; (b) à la demande explicite de
  l'utilisateur sur un sujet précis ; (c) lors d'un balayage complet périodique de l'existant,
  décidé ensemble (pas encore planifié à date fixe).

## Premier balayage complet (2026-09-19)

Lancé le jour même de la création de l'outil, comme convenu explicitement avec l'utilisateur
("Bien sûr, on lance un scan de l'existant une fois cet outil prêt"). Résultat détaillé :
`docs/argus/scan-2026-09-19-17-05.txt`, résumé dans `docs/argus/index.md`. Une trouvaille confirmée
(`trottoirGranted`, jamais lu), cinq à vérifier, une déjà écartée comme faux positif après
vérification manuelle.

## KPI

Pas encore raccordé au tableau de bord général (`scripts/kpi-report.mjs`) — à faire une fois
qu'ARGUS aura tourné plusieurs fois et qu'un signal stable (ex. "nombre de trous confirmés
actuellement ouverts", "proportion de trouvailles confirmées vs écartées comme faux positifs
après vérification") aura du sens à calculer. Prématuré de fixer une formule sur une seule
exécution (cf. le principe "une donnée absente reste une absence" du tableau de bord).

## Registre des trous ouverts

Voir `docs/argus/index.md` — pas dupliqué ici (Article 6/7 : une seule source de vérité pour ce
qui change à chaque exécution).
