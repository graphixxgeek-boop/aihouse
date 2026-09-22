# Process XP-IA-bonnes-pratiques-et-lecons — le dossier de process

*(Nom donné par l'utilisateur le 2026-09-23. Sixième process déclaré du projet, aux côtés de la
Ronde, de la simulation, de la nuit autonome, du méta-process et de l'intégration d'un outil.)*

**RÈGLE D'ÉCRITURE DE CE DOCUMENT, en tête parce qu'elle a déjà été oubliée ailleurs** : tout
mécanisme construit en lien avec ce process s'inscrit ICI, pas seulement dans `docs/suivi/`. Le
SUIVI date ce qui a été FAIT ; le PROCESS dit ce qui EST. Un mécanisme consigné seulement dans le
suivi est une trace historique, pas une règle en vigueur — et personne ne relit trois cents lignes
de suivi avant de toucher à un process.

---

## Partie 1 — Ce que ce process existe pour empêcher

Un projet piloté par IA paie deux fois la même erreur, et la seconde fois coûte plus cher que la
première : non seulement le dégât se reproduit, mais la confiance dans le dispositif qui devait
l'empêcher s'érode.

**Le problème précis, tel qu'il a été constaté le 2026-09-23** : les leçons de ce projet vivaient
dans des commentaires de code, **chacune locale à l'outil qui l'avait apprise**. Une leçon payée sur
un détecteur de duplication ne pouvait pas servir le jour où le même piège se présentait dans un
tout autre coin. Et surtout : **un agent ne garde rien d'une session à l'autre.** Un outil conserve
son registre ; moi non. Ce qui n'est pas écrit ET rendu atteignable n'existera plus demain.

**La formulation de l'utilisateur, qui pose l'objectif** : « 1/ tu découvres une leçon dans la
conversation 2/ tu l'enregistres 3/ tu l'analyses lors de circle 4/ elle ressort au moment opportun,
comme un réflexe mécanique : pendant cette chaîne, la valeur de la leçon est sécurisée. »

Et l'objectif principal, posé séparément et qui prime sur le reste : **« que tu mettes en pratique
ces leçons et bonnes pratiques, en plus de t'auto-analyser et t'auto-calibrer pour ce projet ».**
Enregistrer n'est que le moyen. **Un registre qui n'a jamais changé une décision a échoué**, même
parfaitement tenu.

---

## Partie 2 — La chaîne, et pourquoi aucun maillon ne peut manquer

```
SCAN  >>  RAPPORTS  >>  ANALYSE  >>  PLAN D'ACTION  >>  QUESTIONS  >>  TÂCHES DE TRAVAIL
```
*(le schéma unifié du projet, décliné ici — jamais un schéma parallèle inventé pour ce process)*

Décliné sur l'expérience, il donne cinq maillons :

| # | Maillon | Qui le porte | Ce qu'on perd sans lui |
|---|---|---|---|
| 1 | **Découvrir** — la question est posée aux moments déclencheurs | `scripts/angel-of-ia-process.mjs` (règle `xp-lecons`) | la découverte ne repose que sur ma mémoire, donc elle meurt avec la session |
| 2 | **Enregistrer** — la trouvaille est écrite où on la retrouvera | `enregistrerXp()` (TOOL-LEARNING) → `docs/tool-learning/xp-journal.json` | la trouvaille reste dans la conversation et disparaît avec elle |
| 3 | **Analyser à la Ronde** — la période est relue, j'en tire une conclusion sur MA façon de travailler | poste `tool-learning` de la Ronde | le registre grossit sans que personne ne regarde ce qu'il dit de moi |
| 4a | **Ressortir AVANT la tâche** | `tool-brain` (`leconsPourTache()`) | la leçon reste archivée : relue une fois par période, elle ne change rien au travail du lendemain |
| 4b | **Ressortir AU COMMIT** | crochet `post-commit` | ce qui a échappé au rappel d'avant la tâche n'est jamais rattrapé |

**Le garde-fou de la chaîne elle-même** : `auditChaineXp()` vérifie à chaque passage que chacun des
cinq maillons est **réellement branché dans le vrai dépôt**, jamais qu'il est déclaré quelque part.
Répondre « oui tout est connecté » en prose aurait été une intention, et une intention n'a jamais
empêché quoi que ce soit (leçon L7). Un maillon cassé produit un constat, et donc une tâche.

---

## Partie 3 — Les trois moments déclencheurs, et celui qui a été écarté

**Retenus** (choix explicite de l'utilisateur) :

1. **Un garde-fou me bloque** — un contrôle refuse un commit, ou un test échoue pour une raison que
   je n'avais pas vue. **De loin le plus riche** : la moitié des leçons existantes y sont nées.
   Mécaniquement détectable, donc le rappel peut être automatique.
2. **La fin de chaque compte rendu de travail** — avant de conclure un travail rendu.
   Non détectable : c'est angel qui demande.
3. **Chaque Ronde et chaque évaluation** — ces moments font déjà le bilan d'une période entière,
   donc on y voit ce qu'on ne voit pas tâche par tâche.

**ÉCARTÉ, et c'est écrit plutôt que tu** : « quand je refais une erreur déjà faite » a été proposé
et **non retenu**. C'était le signal le plus fort du lot — mais aussi le seul qu'aucune mécanique ne
sait détecter, donc celui dont la protection aurait été la plus faible. Déclaré dans
`DECLENCHEUR_ECARTE` pour qu'une reprise sache que c'est une décision, jamais un oubli.

**« Rien à retenir » est une réponse pleine et entière**, et ce n'est pas une politesse : exiger une
trouvaille à chaque passage ferait écrire pour se taire, remplirait le registre de bruit et le
rendrait illisible — donc détruirait ce qu'on essaie de construire. Le journal la compte comme une
réponse. En revanche, cinq passages d'affilée sans une seule trouvaille déclenchent un constat :
soit rien n'arrive, soit je ne regarde plus, et les deux méritent d'être regardés.

---

## Partie 4 — Ce qui entre dans le registre, et ce qui n'y entre pas

`docs/referentiel/lecons.md`, **deux sections, jamais une seule liste** :

- **LEÇONS (L1, L2…)** — payées par une erreur réelle. C'est ce qui les rend crédibles.
- **BONNES PRATIQUES (BP1, BP2…)** — des réflexes qui marchent, sans casse derrière.

**Critère commun, volontairement exigeant** : l'entrée doit valoir **au-delà du cas qui l'a
révélée**. Une observation ponctuelle va dans le suivi ; une règle qui ordonne va dans la charte.

**Deux champs obligatoires par entrée**, et ils ne sont pas décoratifs :

- **Terrain** — les situations où elle mord, avec les mots qui les signalent (`· mots : …`). C'est
  ce champ, et lui seul, qui permet à l'entrée de ressortir au bon moment. Une entrée sans terrain
  est archivée, jamais appliquée — l'audit la signale.
- **Porté par** — le mécanisme réel qui la fait tenir, ou la déclaration écrite qu'aucun n'est
  possible, avec sa raison. Un **porteur fantôme** (nommé, introuvable) est le pire des cas : une
  référence morte ressemble à une garantie, donc elle rassure à tort.

---

## Partie 5 — Qui juge, et cette répartition ne bouge pas

| Ce qui est jugé | Qui juge | Pourquoi |
|---|---|---|
| L'entrée est-elle bien formée (terrain, porteur) ? | `auditLecons()` | entièrement mécanique |
| La chaîne est-elle branchée ? | `auditChaineXp()` | entièrement mécanique |
| Qu'est-ce que la période dit de ma façon de travailler ? | **moi**, à la main, à la Ronde | aucune mécanique ne peut la produire, et c'est la seule partie qui sert l'auto-calibrage |
| Une entrée a-t-elle été réellement **APPLIQUÉE** ? | **l'utilisateur**, à la Ronde | décision explicite : « c'est moi à la fin qui te dis si elle est propre ». Me déclarer conforme sur mon propre travail serait le défaut que ce dispositif combat |

`enregistrerXp()` **refuse** une entrée de nature `jugement` qui ne porte pas `parUtilisateur: true`.
Une mécanique ne peut pas prouver qu'un verdict vient de lui ; elle peut refuser de l'inventer.

---

## Partie 6 — Reprise par une autre IA

Tout ce process est atteignable depuis les documents seuls, sans une ligne de conversation :

- **Le registre** : `docs/referentiel/lecons.md`, déclaré dans `CLAUDE.md`.
- **Le code** : `scripts/tool-learning.mjs`, dont chaque fonction porte en commentaire le POURQUOI
  de sa forme, jamais seulement le QUOI.
- **Le journal** : `docs/tool-learning/xp-journal.json`, trois natures jamais mélangées.
- **Le contrôleur** : `scripts/angel-of-ia-process.mjs`, qui porte la règle `xp-lecons` et refuse
  d'être au vert tant qu'elle n'a pas reçu de réponse. C'est le contrôleur de la CONDUITE, jamais
  d'un déroulé : ce process décrit un comportement à tenir, pas les étapes d'une activité.
- **Ce document**, enregistré chez `god-of-all-process` comme les cinq autres process.
- **Les tests** : `scripts/check-house.mjs`, qui échouent si un maillon se débranche.

**Ce qu'une reprise doit savoir avant de simplifier quoi que ce soit** : la séparation des deux
sections, le refus de compter « rien à retenir » comme un échec, et le refus que l'agent juge sa
propre application sont **trois décisions tranchées avec l'utilisateur**, pas des accidents de
construction. Les défaire ramènerait exactement les défauts qu'elles écartent.
