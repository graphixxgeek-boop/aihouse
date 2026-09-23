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

## Les deux mécanismes ajoutés le 2026-09-23 (dette documentaire payée à la Ronde GOAT MAX)

*(Inscrits ici parce que le contrôleur `angel-of-ia-process` a nommé leur absence : trois commits
avaient changé `scripts/moise-tables-de-loi.mjs` sans toucher ce document, qui décrivait donc un
process qui n'existait plus tel quel. La règle qu'ils enfreignaient vit dans
`docs/mode-auto-process-guardian.md` § « Toute modification INDIRECTE d'un process se solde par une
mise à jour DIRECTE de son document ».)*

**`protegerLaCharte(avant, apres)` — la charte se protège d'elle-même pendant qu'on la découpe.**
Lancée automatiquement à chaque commit qui touche `CLAUDE.md`, et seulement ceux-là : un contrôle
qui parle pour rien cesse d'être lu. Cinq contrôles, chacun né d'un risque réel de la campagne du
2026-09-23 :

| Contrôle | Verdict | Pourquoi ce niveau |
|---|---|---|
| un Article a DISPARU | BLOQUANT | une règle retirée par accident s'applique en silence pendant des semaines |
| un Article inséré AU MILIEU de la numérotation | BLOQUANT | casse les renvois de 181 fichiers (interdit dès le préambule de la charte) |
| un chemin cité devenu INATTEIGNABLE | BLOQUANT | distinction stricte entre « perdu » et « atteignable en un saut » : le second EST le but d'un renvoi, le traiter en régression interdirait toute compression légitime |
| un Article VIDÉ de plus de la moitié de ses obligations | QUESTION | vider est parfois le geste voulu — l'Article 19 a perdu trois cinquièmes de son texte le même jour, délibérément |
| un changement absent de la MÉMOIRE DES OPÉRATIONS | QUESTION | git garde le QUOI, `docs/referentiel/charte-operations.md` garde le POURQUOI |

**Sa limite, déclarée plutôt que découverte** : il protège la STRUCTURE, jamais le SENS. Aucun
programme ne peut juger qu'une règle retirée était vraiment devenue inutile — ça reste une décision
humaine, et c'est ce que dit son champ `horsPortee`.

**`rapportDeCampagne(depuis)` — l'étape « synthèse » rendue reproductible.**
Le process exigeait déjà de livrer une synthèse à l'utilisateur ; elle n'existait que dans la tête
de l'agent qui l'écrivait, donc elle mourait avec la session. Cette commande
(`node scripts/moise-tables-de-loi.mjs rapport [depuis]`) la produit à la demande.

**Elle ne STOCKE aucun chiffre** — elle relit git pour l'état AVANT, le disque pour l'APRÈS, et
croise les deux avec la mémoire des opérations. Un nombre recopié se serait périmé au commit
suivant (Article 24). Elle rend **les deux indicateurs séparément, jamais l'un sans l'autre** : les
TOKENS (ce que le document coûte) et les OBLIGATIONS (ce qu'il sature) — et dit dans la même phrase
pourquoi ils ne sont pas interchangeables, puisque couper du récit fait tomber les tokens sans
libérer la moindre attention.

**Ce que son premier vrai lancement a trouvé, et c'est pour ça qu'on lance un outil neuf contre le
vrai dépôt (Article 25)** : un bug dans elle-même — le dernier Article avalait toutes les sections
qui le suivaient et affichait 40 obligations au lieu de 7. Un chiffre faux ressemble exactement à
une mesure. Borne explicite posée, verrouillée par un test.
