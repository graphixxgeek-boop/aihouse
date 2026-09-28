# RESPONSIBILITY MAP — AGENCE
## Maison IA vivante — 28 septembre 2026

## 1. Règle

Chaque composant doit recevoir deux identités :

- **identité fonctionnelle** : ce qu'il fait réellement ;
- **identité architecturale** : la couche qui possède cette responsabilité.

Un nom historique ne donne aucune autorité architecturale.

## 2. Responsabilités majeures

| Système | Responsable cible | Ne doit PAS posséder |
|---|---|---|
| Core | supervision/exécution | logique Gemini, rendu HTML, règles métier particulières |
| Project | représentation du projet | jugement qualité global |
| Tools | découverte/sélection/invocation | définition des politiques métier |
| Work | tâches/processus/exécution | implémentation des outils |
| Quality | vérification/évaluation | orchestration principale |
| Observability | mesure/rapport | décision métier |
| Governance | règles/permissions/fidelity | exécution technique des outils |
| Knowledge | mémoire/documentation/références | autorité de décision |
| Export | packaging/closure/blind test | logique métier du composant exporté |
| Adapters | accès externe | règles métier |

## 3. Requalification des grandes familles historiques

### Orchestrateurs
`le-coordinateur`, `le-regisseur`, `god-of-all-process`, `circle-tasks`, `the-ghost`.

Ils ne doivent pas chacun devenir un « super-agent ». Ils doivent alimenter un **Work/Execution Runtime** commun.

### Tool system
`find-brain`, `find-booster`, `route-booster`, `tool-brain`, `le-coordinateur` (parties concernées), `tool-learning`, `tool-usage`.

Cible : Tool Broker + Registry + Runtime + Learning + Usage.

### Process governance
`angel-of-ia-process`, `circle-process-guardian`, `tasks-process-guardian`, `process-simulation-guardian`, `god-of-all-process`.

Cible : Process Runtime + Process Policies + Quality checks.

### Quality guardians
`check-argus`, `check-harmonia`, `axa-check`, `clean-dirty-old`, `clone-hunter`, `the-equalizer`, `hyper-scan-checkpoint`, `check-suivi-fidelity`, `check-level-target`.

Cible : un contrat commun `Finding`, puis des checks spécialisés. Les checks ne deviennent pas propriétaires de la gouvernance générale.

### Reporting
`report-template`, `html-report`, `doc-report`, `kpi-report`, `summarize-simulation-log`, `rapport-gros-prompt`, `ou-on-en-est`.

Cible : Reporting Contract + Renderers + Observability services.

### Knowledge / data
`abraham-les-references`, `memento`, `memento-weight`, `data-archangel`, `moise-tables-de-loi`, `ines-official`.

Cible : Knowledge System, avec distinction stricte entre mémoire, référence, circulation de données et gouvernance documentaire.

### Export
`safe-export`, `x-port-blindtest`, `integration-outil`, `sauvegarde-projet`.

Cible : Export System.

## 4. Composants à ne pas fusionner conceptuellement

| À conserver distinct | Raison |
|---|---|
| Tool Usage / KPI | usage opérationnel ≠ indicateur agrégé |
| Policy / Check | une politique définit une règle ; un check l'évalue |
| Simulation / Production | environnement d'évaluation ≠ runtime réel |
| Knowledge / Governance | savoir ≠ autorité |
| Model Gateway / Domain | fournisseur de modèle ≠ logique métier |
| Repository / World Domain | persistance ≠ règles du monde |
| Final Judge / Rule Engine | jugement final ≠ détection mécanique |

## 5. `check-house` : changement de responsabilité

`check-house.mjs` est aujourd'hui à la fois bootloader de test, harness, simulateur, patcher de modules, injecteur de dépendances, exécuteur et collecteur de résultats.

Il doit devenir progressivement :

```text
Characterization Engine
 ├── Boot
 ├── Domain suites
 ├── API suites
 ├── AI mock / provider test
 ├── Filesystem suites
 └── Tool suites
          ↓
     Test Runner
          ↓
       Reports
```

Le fichier historique n'est pas supprimé en premier : il devient une façade tant que les nouvelles responsabilités ne sont pas prouvées.

## 6. `app/api/lia/route.ts`

Responsabilité cible de la route : HTTP uniquement.

```text
HTTP
 ↓
Validate Request
 ↓
Turn Application Service
 ↓
Policy
 ↓
Transaction
 ↓
Domain
 ↓
Ports
 ↓
Adapters
```

La logique métier ne doit plus avoir besoin de connaître HTTP pour fonctionner.
