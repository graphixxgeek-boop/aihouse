# CAPABILITY MAP — AGENCE
## Maison IA vivante — 28 septembre 2026

### Objet
Passer de la liste historique des scripts à une cartographie par capacités souveraines. Cette carte ne décide pas encore des déplacements physiques : elle définit **ce que l'Agence doit savoir faire** et où cette capacité doit vivre.

## 1. Principe directeur

Les 86 scripts actuels ne constituent pas 86 capacités métier indépendantes. Ils forment un ensemble d'outils, services, contrôleurs, registres, orchestrateurs, tests et adaptateurs accumulés au fil du projet.

La cible est donc :

```text
86 artefacts historiques
        ↓
~10 systèmes majeurs
        ↓
~30–40 capacités explicites
        ↓
contrats stables
        ↓
modules extractibles
```

## 2. Les dix capacités souveraines

| ID | Système | Question à laquelle il répond | Autorité cible |
|---|---|---|---|
| C01 | CORE | Qui exécute quoi, dans quel contexte et avec quelles garanties ? | Agency Runtime |
| C02 | PROJECT | Quel est le projet, son état et son environnement ? | Project Engine |
| C03 | TOOLS | Quel outil existe, lequel choisir et comment l'invoquer ? | Tool System |
| C04 | WORK | Comment transformer une intention en travail exécutable ? | Work System |
| C05 | QUALITY | Le résultat respecte-t-il les contrats et critères attendus ? | Quality System |
| C06 | OBSERVABILITY | Que s'est-il passé, à quel coût et avec quel résultat ? | Observability |
| C07 | GOVERNANCE | Quelles règles, permissions et obligations s'appliquent ? | Governance |
| C08 | KNOWLEDGE | Que sait l'Agence et comment cette connaissance circule-t-elle ? | Knowledge System |
| C09 | EXPORT | Peut-on isoler, vérifier, empaqueter et distribuer une capacité ? | Export System |
| C10 | ADAPTERS | Comment l'Agence communique-t-elle avec le monde extérieur ? | Adapter Layer |

## 3. Sous-capacités cibles

### C01 CORE
- Supervisor / exécution générale
- Context
- Policy invocation
- Transaction / idempotency
- Event / process runtime
- Execution state

### C02 PROJECT
- Discovery
- Project profile
- Workspace
- Repository
- Project state
- Backup / restore

### C03 TOOLS
- Tool contract
- Tool registry
- Tool discovery
- Tool selection / broker
- Tool runtime
- Tool permissions / side effects
- Tool usage
- Tool learning

### C04 WORK
- Task
- Priority
- Criticality
- Plan
- Workflow
- Process
- Mode
- Scheduling
- Autonomy
- Result

### C05 QUALITY
- Characterization
- Contract tests
- Regression
- Static checks
- Simulation
- Evaluation
- Final judgment
- Quality finding

### C06 OBSERVABILITY
- Usage
- Cost / token consumption
- KPI
- Time series
- Logs
- Reports
- Objectives vs results

### C07 GOVERNANCE
- Rules
- Standards
- Policy checks
- Fidelity
- Human approval
- Git / change controls
- Safety / permissions

### C08 KNOWLEDGE
- Documentation
- Memory
- Reference analysis
- Data circulation
- Project knowledge
- Snapshot / consolidation

### C09 EXPORT
- Safe export
- Dependency closure
- Manifest
- Packaging
- Blind test
- Distribution / integration

### C10 ADAPTERS
- Gemini / model providers
- D1 / database
- Filesystem
- Shell
- Browser / Playwright
- External APIs
- Runtime environment

## 4. Important architectural correction

`agent`, `tool`, `guardian`, `registry`, `report`, `service` et `orchestrator` ne doivent plus être synonymes.

Une capacité est souveraine lorsqu'elle possède :
1. une responsabilité identifiable ;
2. une autorité claire ;
3. un contrat ;
4. des entrées/sorties définies ;
5. une politique de dépendances ;
6. une possibilité de test isolé ;
7. une possibilité d'évolution indépendante.

## 5. Carte de circulation cible

```text
USER / CLIENT
     ↓
  SUPERVISOR
     ↓
  CONTEXT ───────────────→ KNOWLEDGE
     ↓                         ↑
    WORK ←──────────────→ TOOLS
     ↓                         ↓
  EXECUTION ───────────→ ADAPTERS
     ↓
  QUALITY
     ↓
OBSERVABILITY
     ↓
REPORT / RESULT
     ↓
EXPORT (si demandé)

GOVERNANCE traverse les opérations comme une autorité,
mais ne devient pas leur propriétaire fonctionnel.
```

## 6. Critère de réussite

Un nouvel agent doit pouvoir comprendre la carte ci-dessus sans connaître l'historique des 86 scripts. Si une nouvelle capacité ne trouve pas naturellement sa place dans C01–C10, elle doit d'abord être justifiée architecturalement.
