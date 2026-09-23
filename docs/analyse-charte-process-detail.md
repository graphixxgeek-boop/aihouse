# Le process « analyse et plan d'action de la charte »

*(Dixième process déclaré (2026-09-23), aux côtés de la Ronde, de la simulation, de la nuit
autonome, du méta-process, de l'intégration d'un outil, de l'intégration à la Ronde, du process
XP-IA, de l'état des tâches et du mode semi-autonome. Contrôleur :
`scripts/moise-tables-de-loi.mjs`. Demandé explicitement : « on relance tout le process "analyse et
plan d'action claude.md" qui doit être un process bien établi ».)*

## Ce que ce process existe pour empêcher

Une analyse de la charte se recompose de tête à chaque fois, et donc différemment à chaque fois.
Le 2026-09-23, produire un diagnostic complet a coûté une douzaine de scripts jetables, soixante
recherches successives dans le dépôt, et **la reproduction d'un bug déjà corrigé** dans une fonction
dont j'ignorais l'existence : le dernier Article avalant les 510 lignes qui le suivent.

Trois choses se perdaient à chaque fois :
1. **L'ordre des gestes** — mesurer avant de vérifier l'instrument, par exemple, rend des chiffres
   faux qui ont l'air justes.
2. **Ce qu'on avait déjà tenté** — donc la possibilité de refaire une erreur au même endroit.
3. **La classification** — quelle règle peut maigrir et laquelle est intouchable : un savoir
   entièrement dans la tête de l'agent, donc perdu à la fin de la session (Article 27).

## Son déclencheur

**Un ÉVÉNEMENT, jamais un calendrier.** Deux seulement :
- l'utilisateur demande une analyse de fond de la charte ;
- un garde-fou de fraîcheur signale que l'instrument est périmé alors qu'une décision approche.

Le poids qui grossit n'est PAS un déclencheur : le filon mécanique est épuisé depuis le 2026-09-21
(31 passages ecotoken, une seule proposition jamais acceptée), et relancer le process pour gratter
quelques centaines de tokens coûterait plus qu'il ne rend.

## Les douze étapes, dans cet ordre, et l'ordre n'est pas décoratif

| # | Étape | Preuve vérifiable |
|---|---|---|
| 1 | **Relire la mémoire** — qu'a-t-on déjà tenté sur ces règles, et qu'est-ce qui n'a pas tenu ? | `docs/referentiel/charte-operations.md` |
| 2 | **Vérifier la fraîcheur de l'instrument** AVANT de mesurer avec lui | — |
| 3 | **Régénérer la cartographie** (poids, citations, porteur, nature) | `docs/referentiel/charte-cartographie.md` |
| 4 | **Régénérer la table de classification** (sensibilité, importance, redondances) | `docs/referentiel/claude-md-regles.md` |
| 5 | **Vérifier chaque document d'accueil** avant de proposer le moindre renvoi | — |
| 5bis | **Les signaux de PERTINENCE et de LOGIQUE** — portés à l'utilisateur comme des QUESTIONS | — |
| 6 | **L'analyse** — produite par l'agent, jamais par l'outil | — |
| 7 | **Le plan d'action** — chaque constat porte son état : retenu / écarté avec sa raison / à trancher (Article 28) | — |
| 8 | **Les questions de calibrage** en fenêtre dédiée, AVANT toute application (Article 16) | — |
| 9 | **Inscrire les tâches** issues des constats retenus dans `docs/suivi/` (Article 28) | `docs/suivi/sessions/` |
| 10 | **Livrer la vision stratégique** à l'utilisateur — jamais le dossier technique | — |
| 11 | **Enregistrer chaque geste appliqué**, règle par règle, dans la mémoire | `docs/referentiel/charte-operations.md` |

**Pourquoi 1 avant 3.** Régénérer d'abord donnerait des chiffres neufs sur un terrain dont on aurait
oublié l'histoire : on reproposerait un geste déjà annulé, avec la même assurance que la première
fois.

**Pourquoi 2 avant 3.** Un instrument périmé ne rend pas une erreur, il rend des chiffres. C'est
exactement ce qui s'est produit : la table de décision datait de trois jours et ignorait six
Articles.

**Pourquoi 5 avant 7.** Un plan qui propose un renvoi vers un document inexistant est un plan qu'on
ne peut pas exécuter. Le cas est réel, pas théorique.

**Pourquoi 5bis n'autorise pas à conclure, et c'est tout son intérêt.** L'utilisateur a posé la
consigne dans la phrase même qui demandait cette capacité : « sur ce type de choix, toujours me
consulter, process ». L'outil produit donc des signaux nommés, jamais un score et jamais un verdict —
son seul état possible est « à trancher », et il n'a aucun vocabulaire pour écrire « à retirer ». Un
outil capable de conclure verrait un jour sa conclusion appliquée sans que personne ne l'ait portée.

**Pourquoi 9 existe, et il a fallu se le faire refuser pour l'écrire.** La première version de ce
process passait du plan d'action directement à la livraison. Le garde-fou de la chaîne de
l'Article 28 a refusé le commit avec exactement la bonne phrase : « le rapport a coûté son temps et
n'a rien changé ». Un plan d'action qui ne devient pas des tâches meurt dans le document qui le
porte.

**Pourquoi 11 existe.** Sans lui, la boucle ne se ferme pas et le process suivant repart de zéro —
le défaut exact que ce document ferme.

## Ce que le contrôleur peut vérifier, et ce qu'il ne peut pas

Cinq étapes laissent une trace sur le disque ; six n'en laissent aucune. Ces six-là sont
**déclarées non mesurables**, jamais comptées au vert. `node scripts/moise-tables-de-loi.mjs process`
le dit explicitement, étape par étape.

C'est la même honnêteté que `angel-of-ia-process` pratique pour les règles de conduite : une règle
qui ne se joue que dans la conversation ne peut pas être constatée par un programme, et l'écrire
noir sur blanc EST la protection (Article 27).

## Les maillons du schéma unifié

`SCAN >> RAPPORTS >> ANALYSE >> PLAN D'ACTION >> QUESTIONS >> TÂCHES DE TRAVAIL`

Ce process les porte tous les six, ce qui est rare : la plupart des autres en déclarent plusieurs
sans objet. Les étapes 3-4 sont le SCAN, l'étape 6 l'ANALYSE, la 7 le PLAN D'ACTION, la 8 les
QUESTIONS, la 9 les TÂCHES DE TRAVAIL dans `docs/suivi/`, la 11 la trace de ce qui a été appliqué.

## Ce qu'il ne fait PAS

- **Il ne décide pas.** La charte est classée MAITRE : au-delà du risque faible, ça se propose,
  jamais ça ne s'applique.
- **Il ne juge pas si une règle MÉRITE de rester.** Il dit ce qu'elle pèse, qui la tient, et ce
  qu'on a déjà tenté dessus.
- **Il ne bloque rien.** Comme god-of-all-process : il signale.
