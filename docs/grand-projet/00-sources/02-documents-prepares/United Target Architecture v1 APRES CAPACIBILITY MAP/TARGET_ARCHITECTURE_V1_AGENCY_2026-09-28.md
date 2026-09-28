# TARGET ARCHITECTURE V1 --- AGENCE

## Maison IA vivante --- Architecture cible complète --- 28 septembre 2026

> **CONSERVER L'INTELLIGENCE --- CHANGER LA GÉOMÉTRIE.**

## 0. Objet

Cette architecture transforme la rationalisation précédente en cible
opérationnelle. Elle ne constitue pas encore une refonte du code : elle
définit la forme que le système doit progressivement atteindre.

Séquence :

``` text
AUDIT → CARTOGRAPHIE → RATIONALISATION → CONTRATS
→ FRONTIÈRES → MODULARISATION → EXTRACTION
→ VALIDATION → EXPORT → PRODUCTISATION
```

Le système historique reste fonctionnel pendant la migration.

## 1. Architecture globale

``` text
AGENCY PLATFORM
├── 01 CORE
│   ├── Supervisor
│   ├── Context
│   ├── Policy
│   ├── Transaction
│   ├── Event / Process Runtime
│   └── Execution State
├── 02 PROJECT ENGINE
│   ├── Discovery
│   ├── Project Profile
│   ├── Workspace
│   ├── Repository
│   └── Project State
├── 03 TOOL SYSTEM
│   ├── Tool Contract
│   ├── Tool Registry
│   ├── Tool Broker
│   ├── Tool Runtime
│   ├── Usage
│   └── Learning
├── 04 WORK SYSTEM
│   ├── Task
│   ├── Plan
│   ├── Workflow
│   ├── Process
│   ├── Modes
│   └── Scheduling / Autonomy
├── 05 QUALITY SYSTEM
│   ├── Characterization
│   ├── Tests
│   ├── Regression
│   ├── Simulation
│   ├── Evaluation
│   └── Final Judgment
├── 06 OBSERVABILITY
│   ├── Usage
│   ├── Cost
│   ├── KPI
│   ├── Time Series
│   ├── Logs
│   └── Reports
├── 07 GOVERNANCE
│   ├── Rules
│   ├── Policies
│   ├── Standards
│   ├── Permissions
│   ├── Fidelity
│   └── Human Approval
├── 08 KNOWLEDGE
│   ├── Documentation
│   ├── Memory
│   ├── Data Circulation
│   ├── References
│   └── Project Knowledge
├── 09 EXPORT / ECOSYSTEM
│   ├── Manifest
│   ├── Dependency Closure
│   ├── Packaging
│   ├── Blind Test
│   └── Distribution
└── 10 ADAPTERS
    ├── Model Providers
    ├── Database
    ├── Filesystem
    ├── Shell
    ├── Browser
    └── External APIs
```

## 2. Règle des couches

``` text
UI / CLI / HTTP
      ↓
APPLICATION
      ↓
DOMAIN
      ↓
PORTS / CONTRACTS
      ↓
ADAPTERS
```

Pour l'Agence :

``` text
USER → SUPERVISOR → WORK → TOOLS → ADAPTERS
```

Quality, Observability et Governance contraignent ou observent
l'exécution via des contrats explicites. Elles ne doivent pas devenir un
second cœur caché.

## 3. CORE

### Supervisor

Reçoit l'intention, établit le contexte, choisit le mode, déclenche le
Work System, demande les validations et produit l'état final.

### Context Engine

``` text
ExecutionContext
├── project
├── user request
├── active task
├── constraints
├── permissions
├── discovered facts
├── previous results
├── budget
└── execution id
```

### Policy Engine

``` text
PolicyDecision
├── allowed
├── denied
├── requiresApproval
├── reason
└── evidence
```

### Transaction Engine

``` text
begin → validate → execute → verify → commit
```

En cas d'échec : rollback, quarantine ou report selon la politique.

### Execution State

``` text
Execution
├── id
├── status
├── startedAt
├── endedAt
├── actor
├── taskId
├── steps
├── result
└── evidence
```

## 4. PROJECT ENGINE

Mission : comprendre le projet sur lequel l'Agence travaille.

### Discovery

Structure, technologies, points d'entrée, dépendances, configuration,
documentation, conventions et risques.

### Project Profile

``` text
ProjectProfile
├── identity
├── stack
├── architecture
├── entrypoints
├── data stores
├── external providers
├── test surfaces
├── governance
└── risks
```

### Workspace

Gestion de l'environnement de travail.

### Repository

Interface de lecture/écriture abstraite.

### Project State

État propre au projet.

## 5. TOOL SYSTEM

Un outil est une capacité définie ; il n'est pas un agent.

### Tool Contract

``` text
Tool
├── id
├── name
├── version
├── capability
├── inputSchema
├── outputSchema
├── permissions
├── cost
├── sideEffects
├── dependencies
└── evidence
```

### Tool Registry

Catalogue canonique et déclaratif des outils.

### Tool Broker

Découvre, filtre, compare et sélectionne les outils avant invocation.

Les responsabilités de `tool-brain`, `find-brain`, `find-booster` et
`route-booster` convergent conceptuellement ici.

### Tool Runtime

``` text
ToolRequest
→ Permission check
→ Input validation
→ Execution
→ Output validation
→ Evidence
```

### Usage

Mesure appels, fréquence, coût, succès, échec, temps et outils jamais
sollicités.

### Learning

Apprend quels outils fonctionnent dans quels contextes, à quel coût et
avec quels résultats. Il informe le Broker sans devenir son autorité
absolue.

## 6. WORK SYSTEM

La cible rend explicites des concepts aujourd'hui dispersés.

### Task

``` text
Task
├── id
├── objective
├── inputs
├── constraints
├── priority
├── criticality
├── acceptanceCriteria
└── status
```

### Plan

``` text
Plan
├── goal
├── steps
├── dependencies
├── expectedEvidence
└── rollbackStrategy
```

### Workflow

Suite structurée de tâches.

### Process

Workflow soumis à des états, conditions et règles temporelles.

### Execution

Instance réelle d'un processus.

**TASK ≠ WORKFLOW ≠ PROCESS ≠ EXECUTION.**

### Modes

Les modes de travail deviennent un contrat central.

### Scheduling / Autonomy

L'autonomie appartient au Runtime, pas à chaque outil.

## 7. QUALITY SYSTEM

La qualité devient un système plutôt qu'une accumulation de scripts.

### Characterization

Capture du comportement historique avant transformation.

### Tests

Tests unitaires et contractuels.

### Regression

Comparaison avant/après.

### Simulation

Scénarios intégrés et longues exécutions.

### Evaluation

Analyse selon des critères explicites.

### Final Judgment

Jugement final distinct des règles mécaniques.

Règle :

``` text
RULE ≠ CHECK ≠ EVALUATION ≠ JUDGMENT
```

## 8. OBSERVABILITY

Question : **que s'est-il réellement passé ?**

``` text
Execution
↓
Events
↓
Metrics
↓
Aggregations
↓
Reports
```

Sous-systèmes :

-   Usage
-   Cost
-   KPI
-   Time Series
-   Logs
-   Reports

Le reporting ne devient pas une source de vérité métier.

## 9. GOVERNANCE

La gouvernance définit les règles mais ne réalise pas secrètement le
travail.

``` text
INTENT
↓
POLICY CHECK
↓
PERMISSION
↓
EXECUTION
↓
EVIDENCE
↓
VERIFICATION
↓
COMMIT
```

Sous-systèmes :

-   Rules
-   Policies
-   Standards
-   Permissions
-   Fidelity
-   Human Approval

Un guardian ne doit pas devenir un orchestrateur caché.

## 10. KNOWLEDGE

La connaissance est distincte de la gouvernance.

``` text
KNOWLEDGE = savoir
GOVERNANCE = décider ce qui doit être fait
```

Sous-systèmes :

-   Documentation
-   Memory
-   Data Circulation
-   References
-   Project Knowledge

`data-archangel` relève de la circulation des données ; `memento` et
`memento-weight` de la mémoire ; `abraham-les-references` des
références.

## 11. EXPORT / ECOSYSTEM

L'exportabilité est une propriété architecturale.

### Export Manifest

``` text
ExportManifest
├── component
├── version
├── capabilities
├── runtimeRequirements
├── dependencies
├── configuration
├── contracts
├── documentation
└── tests
```

### Dependency Closure

Le système doit pouvoir déterminer tout ce qui est nécessaire à
l'exécution ailleurs.

### Package

``` text
PACKAGE
├── runtime
├── adapters
├── contracts
├── config
├── docs
├── tests
└── manifest
```

### Blind Test

Test du package dans un environnement où les hypothèses implicites du
projet source ne sont plus disponibles.

`safe-export` devient le mécanisme d'export ; `x-port-blindtest` la
preuve de portabilité.

## 12. ADAPTERS

Les adapters relient l'Agence au monde extérieur.

### ModelGateway

``` text
ModelGateway
├── generate
├── stream
├── estimateCost
├── health
└── metadata
```

Gemini devient une implémentation et non une dépendance du domaine.

### Repository

``` text
Repository
├── read
├── write
├── transaction
├── lock
└── idempotency
```

D1 devient une implémentation.

Autres adapters : filesystem, shell, browser, external APIs.

## 13. Architecture cible du produit Maison IA

``` text
HTTP
 ↓
Request Validation
 ↓
Turn Application Service
 ↓
Policy
 ↓
Transaction
 ↓
DOMAIN
 ├── World
 ├── Story
 ├── Life
 ├── Relationship
 └── Time
 ↓
PORTS
 ├── Repository
 ├── ModelGateway
 ├── Clock
 └── Events
 ↓
ADAPTERS
 ├── D1
 └── Gemini
```

`/api/lia` doit progressivement devenir une façade mince au lieu de
cumuler validation, verrouillage, DB, moteur de tour, IA, mutation et
réponse HTTP.

## 14. Domain produit

``` text
PRODUCT DOMAIN
├── World
├── Story
├── Life
├── Relationship
├── Perception
├── Time
└── Simulation
```

Le domaine reste séparé du système d'outillage de l'Agence.

## 15. Contrats fondamentaux

### ModelGateway

``` ts
interface ModelGateway {
  generate(request: ModelRequest): Promise<ModelResponse>;
  stream?(request: ModelRequest): AsyncIterable<ModelChunk>;
  estimateCost?(request: ModelRequest): CostEstimate;
  health?(): Promise<ModelHealth>;
}
```

### Repository

``` ts
interface Repository {
  readState(id: string): Promise<State>;
  writeState(state: State): Promise<void>;
  acquireLock(key: string): Promise<Lock>;
  releaseLock(lock: Lock): Promise<void>;
  transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>;
}
```

### Tool

``` ts
interface Tool<I, O> {
  descriptor: ToolDescriptor;
  execute(input: I, context: ExecutionContext): Promise<O>;
}
```

### Task

``` ts
interface Task {
  id: string;
  objective: string;
  constraints: Constraint[];
  priority: Priority;
  criticality: Criticality;
  acceptanceCriteria: AcceptanceCriterion[];
}
```

### Process

``` ts
interface Process {
  id: string;
  workflowId: string;
  state: ProcessState;
  currentStep: string;
}
```

### Finding

``` ts
interface Finding {
  id: string;
  source: string;
  severity: Severity;
  scope: string;
  evidence: Evidence[];
  recommendation?: string;
  timestamp: string;
}
```

### Report

``` ts
interface Report {
  id: string;
  subject: string;
  findings: Finding[];
  metrics: Metric[];
  evidence: Evidence[];
}
```

### ExportManifest

``` ts
interface ExportManifest {
  component: string;
  version: string;
  dependencies: Dependency[];
  contracts: ContractReference[];
  configuration: ConfigurationEntry[];
  tests: TestReference[];
}
```

## 16. Règles de dépendances

### Autorisé

``` text
CORE → CONTRACTS
APPLICATION → DOMAIN
DOMAIN → PORTS
ADAPTERS → PORTS
TOOLS → TOOL CONTRACTS
QUALITY → CONTRACTS / EVENTS / REPORTS
OBSERVABILITY → EVENTS / METRICS
EXPORT → MANIFEST / CONTRACTS
```

### Interdit ou fortement contrôlé

``` text
DOMAIN → GEMINI
DOMAIN → D1 implementation
DOMAIN → specific script
CORE → specific report renderer
TOOL → another tool implementation
POLICY → hidden orchestration
REPORT → business state mutation
OBSERVABILITY → execution mutation
KNOWLEDGE → permission decision
```

Toute exception doit être documentée.

## 17. Correspondance des 86 scripts avec la cible

### Tool System

``` text
find-brain
find-booster
route-booster
tool-brain
tool-learning
tool-usage
le-coordinateur
```

→ Tool Registry / Broker / Runtime / Usage / Learning.

### Work System

``` text
check-tasks-details
circle-tasks
god-of-all-process
angel-of-ia-process
the-ghost
modes-de-travail
priorites
criticite
```

→ Task / Workflow / Process / Execution / Mode / Scheduling / Autonomy.

### Quality

``` text
check-house
check-argus
check-harmonia
check-level-target
check-suivi-fidelity
clone-hunter
hyper-scan-checkpoint
ezechiel-les-tests
process-simulation-guardian
circle-process-guardian
tasks-process-guardian
```

→ Characterization / Checks / Regression / Simulation / Evaluation /
Policies.

### Governance

``` text
the-king
the-equalizer
always-new-code
check-profil-utilisateur
check-profile
```

→ Policies / Standards / Fidelity / Governance.

### Knowledge

``` text
data-archangel
memento
memento-weight
abraham-les-references
doc-report
```

→ Data Circulation / Memory / References / Knowledge.

### Observability / Reporting

``` text
kpi-report
serie-temporelle
objectifs-vs-resultats
report-template
html-report
summarize-simulation-log
```

→ Metrics / KPI / Time Series / Report Contract / Renderers.

### Export

``` text
safe-export
x-port-blindtest
integration-outil
sauvegarde-projet
```

→ Export / Packaging / Plugin Lifecycle / Project Backup.

### Infrastructure

``` text
lib-shell
lib-json
lib-markdown-table
sites-env
run-framework
api-providers
agent-du-temps
pnpm-install
install-ci
hooks/*
```

→ Infrastructure / Adapters / Developer tooling.

### Simulation / Evaluation spécialisée

``` text
le-regisseur
run-simulation
simulation-visiteur
el-professor
the-screener-capture
the-deep-reader
the-final-judge
```

→ Simulation / Evaluation / Specialized Quality.

## 18. Cas spécial --- check-house

Ne pas faire :

``` text
20 342 lignes → 5 fichiers
```

Faire :

``` text
CHECK-HOUSE HISTORIQUE
        ↓
CHARACTERIZATION ENGINE
        ├── Boot tests
        ├── Domain tests
        ├── API tests
        ├── AI mock tests
        ├── Filesystem tests
        ├── Tool tests
        └── Regression tests
        ↓
TEST RUNNER
        ↓
REPORTING
```

Le fichier historique peut rester temporairement la façade.

## 19. Cas spécial --- API/LIA

Migration :

``` text
ANCIENNE ROUTE
      ↓
Thin HTTP Adapter
      ↓
TurnApplicationService
      ↓
Policy + Transaction
      ↓
Domain
      ↓
Ports
      ↓
D1 / Model adapters
```

Pas de découpage arbitraire. Les responsabilités sont d'abord
contractualisées.

## 20. Cas spécial --- world

`world.ts` reste un noyau métier central jusqu'à stabilisation du
Repository Port.

Cible :

``` text
WORLD DOMAIN
      ↓
Repository Port
      ↓
D1 Adapter
```

Le domaine connaît ce qu'il veut lire/écrire, pas la technologie de
stockage.

## 21. Cas spécial --- Gemini

``` text
DOMAIN / APPLICATION
        ↓
ModelGateway
        ↓
Provider Adapter
        ↓
Gemini
```

La rotation des clés appartient à l'infrastructure/provider.

## 22. Événement transversal

Chaque exécution importante peut produire :

``` text
ExecutionEvent
├── executionId
├── timestamp
├── actor
├── component
├── action
├── inputRef
├── outputRef
├── duration
├── cost
├── status
└── evidence
```

Cette donnée peut alimenter Usage, Cost, KPI, Time Series, Reports et
Learning.

## 23. Séquence d'exécution cible

``` text
USER INTENT
   ↓
SUPERVISOR
   ↓
CONTEXT
   ↓
POLICY
   ↓
PLAN / TASK
   ↓
TOOL BROKER
   ↓
TOOL RUNTIME
   ↓
ADAPTERS
   ↓
RESULT
   ↓
QUALITY
   ↓
EVIDENCE
   ↓
OBSERVABILITY
   ↓
COMMIT / REPORT
```

Pour une opération sensible :

``` text
REQUEST
 ↓
POLICY
 ↓
HUMAN APPROVAL si requis
 ↓
TRANSACTION
 ↓
EXECUTION
 ↓
VERIFICATION
 ↓
COMMIT
```

## 24. Structure indicative future

``` text
agency/
├── core/
├── project/
├── tools/
│   ├── contract/
│   ├── registry/
│   ├── broker/
│   ├── runtime/
│   ├── usage/
│   └── learning/
├── work/
│   ├── task/
│   ├── plan/
│   ├── workflow/
│   ├── process/
│   └── execution/
├── quality/
│   ├── characterization/
│   ├── tests/
│   ├── regression/
│   ├── simulation/
│   └── evaluation/
├── observability/
├── governance/
├── knowledge/
├── export/
└── adapters/
    ├── models/
    ├── database/
    ├── filesystem/
    ├── shell/
    ├── browser/
    └── api/
```

C'est une cible, pas une instruction de déplacement immédiat.

## 25. Ordre de construction

### Phase A --- Fondations

1.  Contrats
2.  Conventions
3.  Tests d'architecture
4.  Manifest de composants
5.  Règles de dépendances

### Phase B --- Premiers modules

1.  `lib/daynight.ts`
2.  `lib/gemini-keys.ts`
3.  `lib/relationship.ts`
4.  `lib/house.ts`
5.  utilities/reporting

### Phase C --- Ports majeurs

1.  ModelGateway
2.  Repository
3.  Tool
4.  Finding / Report

### Phase D --- Runtime

1.  Tool Runtime
2.  Work Runtime
3.  Policy Runtime
4.  Execution State

### Phase E --- Rationalisation lourde

1.  check-house
2.  API/LIA
3.  world
4.  réseau Task/Process

### Phase F --- Export

1.  manifests
2.  dependency closure
3.  clean-environment test
4.  blind test
5.  package

## 26. Ordre de risque

### Faible

`daynight`, `gemini-keys`, JSON, Markdown tables, time.

### Moyen

`relationship`, `house`, reporting, usage, knowledge.

### Élevé

Tool Broker, Task/Process Runtime, Repository, ModelGateway.

### Très élevé

check-house, world, API/LIA, autonomy.

Le risque détermine l'ordre de migration ; il ne justifie pas l'abandon.

## 27. Critères d'une extraction réussie

Un module n'est déclaré extrait que si :

1.  son contrat est explicite ;
2.  ses dépendances sont connues ;
3.  son comportement est couvert ;
4.  il peut fonctionner sans le monde historique inutile ;
5.  ses erreurs sont observables ;
6.  sa documentation permet sa compréhension ;
7.  ses besoins externes sont déclarables ;
8.  le rollback reste possible.

## 28. Maturité

``` text
R0 — inconnu
R1 — compris
R2 — frontière isolée
R3 — extractible
R4 — exportable
R5 — industrialisé
R6 — produit distribué
```

Un fichier séparé n'est pas automatiquement un module R3 ou R4.

## 29. Test ultime

L'architecture sera considérée comme réellement réussie lorsque :

1.  un nouvel arrivant comprend les grandes branches sans connaître
    l'histoire ;
2.  un nouvel agent découvre les contrats sans lire 95 000 lignes ;
3.  un outil peut être retiré sans archéologie ;
4.  un outil peut être remplacé sans modifier le cœur ;
5.  un modèle peut être remplacé sans réécrire le domaine ;
6.  une base peut être remplacée sans réécrire les règles métier ;
7.  les tests ciblent les contrats et comportements ;
8.  la gouvernance reste plus petite que ce qu'elle gouverne ;
9.  l'Agence peut expliquer sa propre architecture ;
10. un tiers peut installer le runtime sans connaître Maison IA.

## 30. Définition finale

La Target Architecture V1 n'est pas un simple rangement de fichiers.

C'est :

> **un runtime d'Agence dans lequel les responsabilités sont explicites,
> les outils sont des capacités remplaçables, le travail est modélisé,
> les politiques sont séparées de l'exécution, la qualité est
> systémique, les données d'exécution sont observables et les composants
> peuvent progressivement devenir exportables.**

La géométrie change ; les connaissances, invariants, preuves et
garde-fous sont conservés.

> **CONSERVER L'INTELLIGENCE --- CHANGER LA GÉOMÉTRIE.**
