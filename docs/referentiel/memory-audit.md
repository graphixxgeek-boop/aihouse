# memory-audit — instanciation pour Maison IA vivante

*(2026-09-21. Créé sous le nom "MEMENTO" (tâche #169), renommé le même soir en "memory-audit" une
fois son rôle mieux compris par l'utilisateur — l'ombrelle "MEMENTO", qui le regroupait avec un
second artefact de nature différente (`lib/memento-weight.ts` + `scripts/memento-weight.mjs`, cf.
`docs/referentiel/memento-weight.md`), a été retirée. Principe générique :
`docs/memory-audit-blueprint.md`. Code : `scripts/memento.mjs` (nom de fichier technique inchangé,
même discipline que Smart Breaker). Registre : `docs/memory-audit/`. Ce document décrit l'OUTIL ;
`docs/referentiel/regles-de-la-memoire.md` (tâche #175, créé le même soir en comblant le trou de
nommage laissé par le retrait de l'ombrelle) décrit le SYSTÈME de mémoire du jeu que cet outil
vérifie — jamais confondus.)*

## Rôle exact

Un Membre de l'équipe (Outillage de travail), structurellement identique à `check-argus.mjs`,
catégorie "audit de simulation" aux côtés d'EL-PROFESSOR — la seule particularité de memory-audit
est que son SUJET est un personnage narratif (Lia/Noé, qui n'ont eux-mêmes AUCUNE existence dans
l'équipe — jamais une case de l'organigramme, cf. `PERSONNAGES`/`assertNotAPersonnage()` de
`scripts/lib-shell.mjs`, une liste d'exclusion au bord du domaine équipe, pas une catégorie interne
au même tableau que Direction/Équipe noyau/Membre/VIP).

memory-audit couvre une seule dette, jamais adressée ailleurs : la **cohérence mécanique de la
mémoire persistée** (`lib/life.ts`) — jamais un second appel Gemini, jamais un jugement sur ce qui
EST dit, seulement sur la structure des données persistées qui nourrissent chaque tour.

## Investigation préalable (Article 19, 2026-09-21)

Le stockage de `Life` (`lib/life.ts`) est déjà rigoureusement plafonné à l'écriture (`readLife()`,
`.slice(-12)`, `.slice(0,300)`, etc. sur chaque champ qui grossit) — aucune raison de reconstruire
ce plafonnage. Ce qui manque réellement, confirmé par l'investigation : aucune vérification
mécanique n'existe que ces données plafonnées restent cohérentes DANS LE TEMPS (ordre
chronologique, remise à zéro suspecte, régression de gravité).

## Les trois vérifications, `scripts/memento.mjs`

Trois vérifications confirmées par calibrage explicite (AskUserQuestion, les trois sélectionnées) :

- `checkChronologicalOrder(entries, getRound)` — un champ chronologique réel
  (`bonusLog`/`negotiationLog`/`contacts`, `CHRONOLOGICAL_FIELDS`, tenue à la main comme
  `AGENT_SCRIPT_FILES` d'AXA-CHECK) ne doit jamais revenir en arrière dans ses numéros de round.
- `detectSuspiciousCounterReset(previousCounters, currentCounters, {threshold})` — une remise à zéro
  suspecte de `wordFrequency`/`themeFrequency` entre deux instantanés successifs, sans événement qui
  la justifie. C'est exactement le type de bug déjà trouvé une fois (`loveRealized`, cf. Plan
  d'origine de CLAUDE.md) — memory-audit ne l'aurait pas réparé, mais l'aurait signalé mécaniquement.
- `detectWorstMomentRegression(previousWorstMoment, currentWorstMoment)` — `worstMoment` ne doit
  jamais redevenir moins grave (règle du jeu, `lib/life.ts:129`).

`checkMemoryCoherence(life, previousLife)` agrège les trois sur un instantané réel de `Life` — jamais
une action automatique, un signal à lire comme le reste du réseau (Smart Conso API, SMART-CONSO-TOKEN,
THE-KING). S'applique aux instantanés RÉELS d'une partie (donc pendant/après une simulation Article 18,
jamais un scan de repo périodique — cf. l'exclusion CIRCLE-TASKS ci-dessous).

## Ce qui a été délibérément exclu

- Un second plafonnage de stockage — déjà fait, vérifié par l'investigation, jamais dupliqué.
- Un jugement sur le SENS de ce qui est dit — hors de portée, memory-audit ne lit que la structure.
- Toute connexion à SMART-CONSO-TOKEN ou Smart Conso API dans le sens outil→memory-audit — frontière
  écrite des deux côtés (« jamais le texte envoyé à Gemini pour Lia et Noé »).

## CIRCLE-TASKS : exclusion documentée, jamais un item périodique

`docs/memory-audit/` est un registre réel mais memory-audit n'a pas d'item dans la Ronde périodique
(`CIRCLE_EXCLUDED_REGISTRIES["memory-audit"]`) : cette vérification n'a de sens que contre des
instantanés réels de partie — une Ronde qui tourne sur le dépôt au repos n'a rien à comparer.

## Doc-Report

Entrée `REGISTRIES` dédiée (`scripts/doc-report.mjs`), `scriptPath: "scripts/memento.mjs"`, famille
**Simulation & qualité narrative** (aux côtés d'EL-PROFESSOR, cohérent avec son statut de Membre de
l'équipe confirmé le 2026-09-21 — corrige une hésitation du même soir où le fichier avait
brièvement porté la famille "Hors équipe", avant la clarification finale de l'utilisateur).

## Statut d'intégration

Testé contre les vraies formes de `lib/life.ts` trouvées par l'investigation Article 19. Menu
PRESTATIONS : "Pack Memory-Audit". Registre : `docs/memory-audit/` (dossier + index), vide à la
création — se remplira au premier vrai constat de cohérence après une simulation.
