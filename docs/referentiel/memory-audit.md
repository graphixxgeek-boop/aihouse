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

## Le suivi tour par tour (2026-09-23) — ce qui a rendu cet outil réellement utilisable

**Décision explicite de l'utilisateur, en fenêtre de calibrage, contre la recommandation de
l'agent** : « photo à chaque tour ». L'agent proposait la version minimale (comparer le début et la
fin d'une partie) ; l'utilisateur a tranché la version complète, qui dit à quel **tour précis** une
anomalie apparaît, et pas seulement qu'elle a eu lieu.

### Le trou que ça ferme, et il était structurel

`checkMemoryCoherence(life, avant)` a besoin de **deux** états — c'est le principe même d'une
vérification de cohérence dans le temps. Le pilote de simulation lisait bien l'état final et ne
gardait **aucune** photo de l'état précédent, à aucun tour.

Personne n'avait « oublié d'appeler l'outil » : **on ne pouvait pas l'appeler**, faute de la moitié
de ce dont il a besoin. Trois vérifications existaient, testées, et ne protégeaient rien depuis leur
écriture.

### Pourquoi la mécanique vit ici et pas dans le pilote de simulation

C'est la leçon ④ de la nuit du 2026-09-23, appliquée volontairement. Le pilote lançait une vraie
partie dès qu'on l'importait : il ne **pouvait** pas être testé, et c'est exactement pour ça qu'il
n'avait aucun test, donc exactement pour ça qu'un même défaut y a survécu trois simulations.
Mettre le suivi là-bas aurait reproduit le piège. Ici, il se teste avec deux objets en mémoire —
sans serveur, sans partie, sans quota.

### Les trois fonctions, et la discipline de chacune

| Fonction | Ce qu'elle garantit |
|---|---|
| `creerSuiviMemoire()` | une fabrique, jamais un état global : deux parties dans le même processus ne mélangent pas leurs photos |
| `formatSuiviMemoire()` | dit TOUJOURS combien de comparaisons ont réellement eu lieu |
| `ecrireConstatMemoire()` | un fichier de constat **daté**, jamais l'index, et jamais sans nom de simulation |

**Trois états, jamais deux** (`ETATS_SUIVI_MEMOIRE`). Un seul tour lisible autorise **zéro**
comparaison : le rapport dit alors « pas mesuré » plutôt que « 0 constat », qui se lirait comme un
feu vert. Un tour dont l'état n'a pas pu être lu est **compté** plutôt que sauté en silence —
sinon « 40 tours propres » pourrait vouloir dire « 3 tours propres et 37 jamais regardés ».

### La preuve du process, resserrée le même jour

L'étape « contrôler la mémoire narrative persistée » était validée par n'importe quel `.md` du
registre — et le registre n'avait **jamais** contenu autre chose que son index d'inauguration.
L'étape passait donc pour tracée depuis la création du registre. Le registre était honnête, le
contrôleur était honnête : c'est leur **combinaison** qui mentait, et aucune relecture de l'un ou de
l'autre ne pouvait le voir (leçon L13).

Le motif exige désormais un fichier `constat-<simulation>-<horodatage>.md`, celui qu'écrit
`ecrireConstatMemoire()` à la fin d'une vraie partie. Un index ne peut pas le contrefaire.

**La seconde étape atteinte du même défaut** — « rédiger le script de simulation selon la norme »,
dont le registre ne contenait lui aussi que son index — a été resserrée dans la même passe, et par
une **règle** (« tout fichier qui n'est pas l'index ») plutôt qu'une liste de noms : une fiche
future y entre sans qu'on touche au motif (Article 24). Sa fiche manquante a été écrite.
