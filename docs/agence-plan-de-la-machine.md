# Le plan de la machine — l'Agence Codex telle qu'elle est câblée ici

> **Ce document est GÉNÉRÉ** par `node scripts/safe-export.mjs plan-machine`, depuis la chaîne
> quotidienne réelle et le graphe d'imports. **Ne pas l'éditer à la main** : la prochaine
> génération écrase tout. Écrit à la main, il se périmerait au premier fichier ajouté — c'est
> exactement ce que la tâche #908 demandait d'éviter (Article 24).

*Produit le dimanche 27 septembre 2026 à 10:28 (source : système) · état du code : 43a8478.*

**Son complément générique, à lire d'abord** : `docs/agence-blueprint.md` dit ce que l'Agence EST,
`docs/agence-installation.md` dans quel ORDRE la poser — tous deux sans nommer un fichier, pour
pouvoir voyager. Ce document-ci est leur pendant instancié : les mêmes étapes, avec les vrais noms.

## Par où ça démarre

Ce que l'Agence lance elle-même, sans que personne le demande — tout le reste n'est atteint
que par eux :

- `scripts/check-house.mjs`
- `scripts/ecotoken.mjs`
- `scripts/god-of-all-process.mjs`
- `scripts/hooks/banniere.mjs`
- `scripts/hooks/check-last-commit.mjs`
- `scripts/hooks/install.mjs`
- `scripts/install-pnpm.sh`
- `scripts/moise-tables-de-loi.mjs`
- `scripts/run-framework.mjs`
- `scripts/sites-env.mjs`
- `scripts/tool-brain.mjs`

## L'ordre d'installation — 13 paliers, 47 fichiers

Le palier d'un fichier est la longueur de la plus longue chaîne de dépendances qui mène à lui.
**Poser les paliers dans l'ordre garantit qu'aucun fichier n'arrive avant ce dont il a besoin.**
C'est la seule définition d'un ordre d'installation qui ne soit pas une opinion.

### Palier 0 — 14 fichier(s)

*Ils n'importent rien de la chaîne : ils se posent en premier, dans n'importe quel ordre entre eux.*

- `scripts/ailleurs.mjs`
- `scripts/corpus-mesure.mjs`
- `scripts/execution-profile.mjs`
- `scripts/hooks/banniere.mjs`
- `scripts/hooks/check-last-commit.mjs`
- `scripts/hooks/install.mjs`
- `scripts/hooks/post-commit`
- `scripts/hooks/pre-commit`
- `scripts/install-pnpm.sh`
- `scripts/lib-json.mjs`
- `scripts/lib-markdown-table.mjs`
- `scripts/lib-shell.mjs`
- `scripts/priorites.mjs`
- `scripts/sites-env.mjs`

### Palier 1 — 4 fichier(s)


- `scripts/report-template.mjs` — après `scripts/lib-shell.mjs`
- `scripts/run-framework.mjs` — après `scripts/execution-profile.mjs`
- `scripts/serie-temporelle.mjs` — après `scripts/lib-json.mjs`
- `scripts/tool-usage.mjs` — après `scripts/lib-json.mjs`

### Palier 2 — 9 fichier(s)


- `scripts/always-new-code.mjs` — après `scripts/corpus-mesure.mjs`, `scripts/lib-markdown-table.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/tool-usage.mjs`
- `scripts/angel-of-ia-process.mjs` — après `scripts/lib-json.mjs`, `scripts/report-template.mjs`, `scripts/serie-temporelle.mjs`, `scripts/tool-usage.mjs`
- `scripts/check-level-target.mjs` — après `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/tool-usage.mjs`
- `scripts/criticite.mjs` — après `scripts/priorites.mjs`, `scripts/tool-usage.mjs`
- `scripts/html-report.mjs` — après `scripts/report-template.mjs`
- `scripts/route-booster.mjs` — après `scripts/lib-shell.mjs`, `scripts/tool-usage.mjs`
- `scripts/safe-export.mjs` — après `scripts/ailleurs.mjs`, `scripts/corpus-mesure.mjs`, `scripts/lib-json.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/serie-temporelle.mjs`, `scripts/tool-usage.mjs`
- `scripts/smart-conso-api.mjs` — après `scripts/lib-json.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/tool-usage.mjs`
- `scripts/tool-learning.mjs` — après `scripts/lib-json.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/serie-temporelle.mjs`, `scripts/tool-usage.mjs`

### Palier 3 — 5 fichier(s)


- `scripts/abraham-les-references.mjs` — après `scripts/html-report.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/tool-usage.mjs`
- `scripts/axa-check.mjs` — après `scripts/always-new-code.mjs`, `scripts/check-level-target.mjs`, `scripts/corpus-mesure.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/tool-usage.mjs`
- `scripts/check-suivi-fidelity.mjs` — après `scripts/criticite.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/tool-usage.mjs`
- `scripts/god-of-all-process.mjs` — après `scripts/angel-of-ia-process.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/tool-usage.mjs`
- `scripts/le-classificateur.mjs` — après `scripts/html-report.mjs`, `scripts/lib-shell.mjs`, `scripts/safe-export.mjs`, `scripts/tool-usage.mjs`

### Palier 4 — 2 fichier(s)


- `scripts/clean-dirty-old.mjs` — après `scripts/axa-check.mjs`, `scripts/check-level-target.mjs`, `scripts/corpus-mesure.mjs`, `scripts/lib-markdown-table.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/serie-temporelle.mjs`, `scripts/tool-usage.mjs`
- `scripts/smart-conso-token.mjs` — après `scripts/check-suivi-fidelity.mjs`, `scripts/lib-json.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/serie-temporelle.mjs`, `scripts/tool-usage.mjs`

### Palier 5 — 2 fichier(s)


- `scripts/find-booster.mjs` — après `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/smart-conso-token.mjs`, `scripts/tool-usage.mjs`
- `scripts/moise-tables-de-loi.mjs` — après `scripts/abraham-les-references.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/smart-conso-token.mjs`, `scripts/tool-usage.mjs`

### Palier 6 — 2 fichier(s)


- `scripts/doc-report.mjs` — après `scripts/clean-dirty-old.mjs`, `scripts/find-booster.mjs`, `scripts/le-coordinateur.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/tool-usage.mjs`
- `scripts/ecotoken.mjs` — après `scripts/check-level-target.mjs`, `scripts/lib-shell.mjs`, `scripts/moise-tables-de-loi.mjs`, `scripts/report-template.mjs`, `scripts/smart-conso-token.mjs`, `scripts/tool-usage.mjs`

### Palier 7 — 2 fichier(s)


- `scripts/find-brain.mjs` — après `scripts/doc-report.mjs`, `scripts/find-booster.mjs`, `scripts/lib-shell.mjs`, `scripts/route-booster.mjs`, `scripts/tool-usage.mjs`
- `scripts/le-coordinateur.mjs` — après `scripts/always-new-code.mjs`, `scripts/axa-check.mjs`, `scripts/check-level-target.mjs`, `scripts/clean-dirty-old.mjs`, `scripts/doc-report.mjs`, `scripts/ecotoken.mjs`, `scripts/html-report.mjs`, `scripts/hyper-scan-checkpoint.mjs`, `scripts/le-classificateur.mjs`, `scripts/lib-shell.mjs`, `scripts/smart-conso-api.mjs`, `scripts/smart-conso-token.mjs`, `scripts/tool-usage.mjs`

### Palier 8 — 3 fichier(s)


- `scripts/check-tasks-details.mjs` — après `scripts/check-suivi-fidelity.mjs`, `scripts/clean-dirty-old.mjs`, `scripts/criticite.mjs`, `scripts/html-report.mjs`, `scripts/le-coordinateur.mjs`, `scripts/lib-shell.mjs`, `scripts/priorites.mjs`, `scripts/report-template.mjs`, `scripts/tool-usage.mjs`
- `scripts/the-king.mjs` — après `scripts/abraham-les-references.mjs`, `scripts/clean-dirty-old.mjs`, `scripts/le-coordinateur.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/tool-usage.mjs`
- `scripts/tool-brain.mjs` — après `scripts/doc-report.mjs`, `scripts/ecotoken.mjs`, `scripts/find-brain.mjs`, `scripts/le-coordinateur.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/tool-learning.mjs`, `scripts/tool-usage.mjs`

### Palier 9 — 1 fichier(s)


- `scripts/circle-tasks.mjs` — après `scripts/abraham-les-references.mjs`, `scripts/check-suivi-fidelity.mjs`, `scripts/check-tasks-details.mjs`, `scripts/doc-report.mjs`, `scripts/html-report.mjs`, `scripts/lib-json.mjs`, `scripts/lib-shell.mjs`, `scripts/moise-tables-de-loi.mjs`, `scripts/smart-conso-token.mjs`, `scripts/the-king.mjs`, `scripts/tool-usage.mjs`

### Palier 10 — 1 fichier(s)


- `scripts/circle-process-guardian.mjs` — après `scripts/circle-tasks.mjs`, `scripts/doc-report.mjs`, `scripts/le-classificateur.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/tool-usage.mjs`

### Palier 11 — 1 fichier(s)


- `scripts/hyper-scan-checkpoint.mjs` — après `scripts/circle-process-guardian.mjs`, `scripts/lib-shell.mjs`, `scripts/report-template.mjs`, `scripts/tool-usage.mjs`

### Palier 12 — 1 fichier(s)


- `scripts/check-house.mjs` — après `scripts/abraham-les-references.mjs`, `scripts/always-new-code.mjs`, `scripts/angel-of-ia-process.mjs`, `scripts/axa-check.mjs`, `scripts/check-level-target.mjs`, `scripts/check-suivi-fidelity.mjs`, `scripts/check-tasks-details.mjs`, `scripts/circle-process-guardian.mjs`, `scripts/circle-tasks.mjs`, `scripts/clean-dirty-old.mjs`, `scripts/corpus-mesure.mjs`, `scripts/criticite.mjs`, `scripts/doc-report.mjs`, `scripts/ecotoken.mjs`, `scripts/find-booster.mjs`, `scripts/find-brain.mjs`, `scripts/god-of-all-process.mjs`, `scripts/html-report.mjs`, `scripts/hyper-scan-checkpoint.mjs`, `scripts/le-classificateur.mjs`, `scripts/le-coordinateur.mjs`, `scripts/lib-shell.mjs`, `scripts/moise-tables-de-loi.mjs`, `scripts/priorites.mjs`, `scripts/report-template.mjs`, `scripts/route-booster.mjs`, `scripts/safe-export.mjs`, `scripts/serie-temporelle.mjs`, `scripts/smart-conso-api.mjs`, `scripts/smart-conso-token.mjs`, `scripts/the-king.mjs`, `scripts/tool-brain.mjs`, `scripts/tool-learning.mjs`, `scripts/tool-usage.mjs`

## Ce que ce plan ne dit pas

**Il ne dit pas ce que chaque fichier FAIT** : ça, c'est son blueprint et sa fiche. Il dit dans
quel ordre les poser pour qu'aucun n'arrive orphelin.

**Il ne couvre que la chaîne QUOTIDIENNE** — ce que les points d'entrée atteignent réellement.
Un outil lancé seulement à la main n'y figure pas, et son absence n'est pas un verdict sur lui.

**Il y a 2 fichier(s) dans un cycle d'imports**, et leur palier est donc indéfini :

- `scripts/hyper-scan-checkpoint.mjs`
- `scripts/le-coordinateur.mjs`

Un cycle ne casse pas l'installation (les modules se résolvent), mais il rend l'ordre arbitraire
entre eux. **Il est nommé plutôt que masqué** : un plan qui cacherait un cycle donnerait un ordre
impossible à suivre sans qu'on comprenne pourquoi.

