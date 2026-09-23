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
`docs/argus/scan-2026-09-19-17-05.txt`, résumé dans `docs/argus/index.md`. Une trouvaille initiale
(`trottoirGranted`, jamais lu) finalement écartée à son tour comme faux positif — c'était en fait
un choix de conception déjà assumé par l'utilisateur (« on verra après »), pas un trou — cinq
candidats restent à vérifier, un déjà écarté comme faux positif après vérification manuelle
(`exitSearched`). **Leçon retenue** : toujours consulter `docs/referentiel/parametres.md` avant de
qualifier une trouvaille ARGUS de bug réel, pas seulement grep le code — un flag "jamais relu" peut
très bien être un effet déjà entièrement résolu au moment où il est posé (cf. `docs/argus/index.md`
pour le détail complet de ce cas).

## KPI

Pas encore raccordé au tableau de bord général (`scripts/kpi-report.mjs`) — à faire une fois
qu'ARGUS aura tourné plusieurs fois et qu'un signal stable (ex. "nombre de trous confirmés
actuellement ouverts", "proportion de trouvailles confirmées vs écartées comme faux positifs
après vérification") aura du sens à calculer. Prématuré de fixer une formule sur une seule
exécution (cf. le principe "une donnée absente reste une absence" du tableau de bord).

## Registre des trous ouverts

Voir `docs/argus/index.md` — pas dupliqué ici (Article 6/7 : une seule source de vérité pour ce
qui change à chaque exécution).


## La mémoire des écarts tranchés (2026-09-23, tâche #214)

ARGUS re-signalait six candidats `lib/life.ts` **enquêtés et clos le 2026-09-19** — verdicts écrits
en toutes lettres dans `docs/argus/index.md`, que l'outil ne lisait pas. Trois jours d'un bandeau
`ARGUS ⚠️6` à chaque commit.

**Le coût n'était pas d'être ignoré, il était pire :** c'est cette alarme permanente qui a fait
rouvrir une enquête complète (tâche #214) sur des questions déjà tranchées. Un Gardien sacré sans mémoire
de ses propres jugements fait re-payer chaque verdict.

**Le mécanisme est RELAYÉ depuis SAFE-EXPORT** (`loadMemoire()` + `filtrerDejaTranches()`), jamais
recopié : deux mémoires séparées auraient vite donné deux disciplines différentes sur la même
question. Le fichier suit la convention de registre du projet : `docs/argus/memoire.json`.

**Les trois garde-fous, hérités tels quels et non négociables** — sans eux, donner à un Gardien sacré le
droit de se taire serait pire que le bruit qu'on corrige :

1. seul un écart portant un **accord explicite daté de l'utilisateur** est filtré ;
2. un « écarté » posé **sans** cet accord est **nommé au rapport** comme une tentative de faire
   taire l'alerte, et continue de remonter ;
3. un écart déjà corrigé qui **revient** est signalé comme régression (Article 3).

**Les six entrées actuelles, et la distinction qui compte** : cinq sont des FAUX POSITIFS vérifiés
contre le code réel (chacun lu comme condition à l'endroit même où il est écrit — l'heuristique
compte des occurrences brutes et un champ lu une seule fois passe sous son seuil de 4). La sixième,
`trottoirGranted`, est le seul champ réellement jamais lu : son écart est **écarté EN ATTENTE**,
jamais clos, rattaché à la décision documentée de `docs/referentiel/parametres.md:306` et à la
tâche #92 (refonte graphique) qui devra le reprendre.

## Ce qu'est un TROU LOGIQUE, et pourquoi ce mot ne se laisse pas remplacer

*(Section ajoutée le 2026-09-23, lot 1 du chantier CLAUDE.md. Sa raison d'être est mécanique :
MOÏSE-TABLES-DE-LOI a refusé qu'on réduise l'Article 20 à un renvoi vers cette fiche, parce que la
fiche ne définissait nulle part le mot qui fait tout le métier d'ARGUS. Un renvoi vers un document
qui ne porte pas ce qu'on lui confie ressemble à un lien et n'en est pas un — c'est pire qu'une
absence.)*

**Le trou logique est ce qu'aucun autre garde-fou de la charte ne couvre.** C'est sa définition en
creux, et elle est volontaire : chaque autre article protège une chose nommée — l'esprit des
personnages, la cohérence des jauges, la non-répétition, la robustesse du code. ARGUS s'occupe de
ce qui tombe ENTRE ces protections.

Quatre formes, et elles ne se recouvrent pas :

1. **La combinaison jamais envisagée** — deux mécanismes corrects chacun de son côté, dont personne
   n'a examiné la rencontre. Exemple réel de ce projet : un personnage endormi recevant un bonus qui
   suppose qu'il parle.
2. **Le cas limite oublié** — la valeur extrême, la liste vide, le premier tour, le dernier.
3. **La conséquence logique manquée** — une règle A implique une règle B que personne n'a écrite.
4. **Le lien discret non vu** — deux endroits du code qui dépendent l'un de l'autre sans qu'aucun
   commentaire, aucun import, aucun test ne le dise.

**Ce qui le distingue d'un bug** : un bug est un comportement qui ne fait pas ce qui est écrit. Un
trou logique est un comportement dont personne n'a jamais écrit ce qu'il devrait faire. Le premier
se corrige, le second se DÉCIDE — et c'est pourquoi ARGUS signale plutôt qu'il ne corrige.

**Ce qui le distingue d'une incohérence HARMONIA** : HARMONIA compare deux choses qui existent
toutes les deux et devraient s'accorder (un chiffre dans un document, le même chiffre dans le code).
ARGUS cherche ce qui n'existe NULLE PART. L'un vérifie un lien, l'autre son absence.
