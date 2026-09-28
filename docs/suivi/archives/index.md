# Archives du suivi — index

*(Dossier créé le 2026-09-28, tâche #1024. Il contient les lignes de tâche FERMÉES DEPUIS
LONGTEMPS, déplacées hors des fichiers de travail — jamais supprimées, jamais résumées, jamais
réécrites : leur texte est celui d'origine, caractère pour caractère.)*

## Pourquoi ce dossier existe

Le fichier de suivi de la session en cours pesait 1,67 million de caractères, dont **94 % en
tâches déjà closes**. Le suivi était devenu le premier poste de coût du projet — non parce qu'il
était mal tenu, mais parce qu'il gardait tout sous les yeux pour toujours.

**La décision de l'utilisateur, en fenêtre dédiée le 2026-09-28** : « il faut DISTINGUER les tâches
fermées depuis longtemps : celles-ci rejoignent un dossier d'archive, après que leur nom ait été
raccourci. Les tâches fermées récentes restent visibles immédiatement. » Borne retenue : les tâches
créées **avant le 2026-09-25**, soit plus de trois jours.

## Ce que le fichier de travail garde

Une puce par tâche archivée, sous la section « Tâches archivées » : numéro + nom raccourci. On
retrouve donc n'importe quelle tâche par son numéro, dans le fichier d'archive qui porte le nom de
sa source.

## Qui lit ce dossier, et qui ne le lit pas — la distinction est délibérée

**Le lisent** les fonctions qui NUMÉROTENT et COMPTENT : `nextTaskNumber()`,
`categorizeAllSessions()`, `findTaskNumberIssues()`, `countTasksSince()`
(`scripts/check-suivi-fidelity.mjs`, via `DOSSIERS_DE_TACHES`). Sans elles, `nextTaskNumber()`
réattribuerait un numéro déjà pris dès que les plus hauts seraient archivés, et la file perdrait
605 lignes sans qu'aucune soit close — un progrès qui n'a pas eu lieu.

**Ne le lisent pas** les garde-fous de FRAÎCHEUR (cases de rituel, lignes mal formées, horodatages
futurs). Une tâche close depuis une semaine n'a pas à repasser un contrôle de fraîcheur à chaque
commit : un garde-fou qui crie toujours cesse d'être lu (leçon L4).

## Contenu

| Fichier | Source | Lignes | Ce qu'il porte |
|---|---|---|---|
| `session_0151JrVYzJ2bdCShaXhFAjLo-archive.md` | `session_0151JrVYzJ2bdCShaXhFAjLo.md` | 104 | les tâches closes de la première session |
| `session_0151JrVYzJ2bdCShaXhFAjLo-partie-1-archive.md` | `…-partie-1.md` | 84 | les tâches closes de la partie 1 |
| `session_0151JrVYzJ2bdCShaXhFAjLo-partie-2-archive.md` | `…-partie-2.md` | 417 | les tâches closes de la partie 2 |

**Comment il se remplit** : `node scripts/check-tasks-details.mjs archiver AAAA-MM-JJ`, qui ne fait
RIEN sans `--appliquer` et refuse d'écrire si l'un de ses trois contrôles échoue (chaque ligne
retrouvée telle quelle dans l'archive en la comparant à la SOURCE, compte conservées + déplacées
égal au compte de départ, aucun numéro disparu).
