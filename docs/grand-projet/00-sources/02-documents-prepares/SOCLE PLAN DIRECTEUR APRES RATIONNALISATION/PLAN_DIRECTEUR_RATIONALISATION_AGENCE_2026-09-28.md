# PLAN DIRECTEUR DE RATIONALISATION DE L'AGENCE
## Maison IA vivante — 28 septembre 2026

> **Objet :** transformer l'Agence actuelle, riche et organiquement construite, en une architecture lisible, hiérarchisée, modulaire, exportable et commercialisable, sans perdre les connaissances, invariants et garde-fous accumulés.

---

# 0. DÉCISION DIRECTRICE

La rationalisation est désormais un chantier officiel, distinct de la simple modularisation.

La séquence de transformation retenue est :

```text
AUDIT
  ↓
CARTOGRAPHIE
  ↓
RATIONALISATION
  ↓
ARCHITECTURE CIBLE
  ↓
CONTRATS / FRONTIÈRES
  ↓
MODULARISATION
  ↓
EXTRACTION
  ↓
INDUSTRIALISATION
  ↓
EXPORTABILITÉ
  ↓
PRODUCTISATION
```

Mais cette séquence est **itérative** : la rationalisation continue pendant la modularisation et après chaque extraction importante.

La règle centrale est :

> **Ne pas modulariser la forme historique du projet. Modulariser la forme rationnalisée que nous aurions construite si nous avions connu tout le système dès le départ.**

---

# 1. DIAGNOSTIC EXÉCUTIF

## 1.1 Ce que le projet est réellement aujourd'hui

L'Agence n'est pas un simple dossier de scripts.

L'audit a montré trois systèmes superposés :

```text
┌─────────────────────────────────────────────────────┐
│ PRODUIT / MAISON IA                                 │
│ app / lib / db / composants                         │
├─────────────────────────────────────────────────────┤
│ AGENCE / OUTILLAGE                                  │
│ scripts : 86 fichiers, ≈82 490 LOC                 │
├─────────────────────────────────────────────────────┤
│ CONNAISSANCE / GOUVERNANCE                          │
│ docs, règles, registres, blueprints, historiques    │
└─────────────────────────────────────────────────────┘
```

La difficulté n'est donc pas un manque de fonctions. C'est que **les frontières entre ces trois niveaux ne sont pas encore assez nettes**.

## 1.2 Diagnostic brutal

### Ce qui est vrai

- Le projet contient une pensée architecturale réelle.
- Les mécanismes de garde-fou sont nombreux et souvent intelligents.
- Les invariants, la traçabilité, les registres, la consommation et l'exportabilité ont été pris au sérieux.
- L'Agence a déjà une véritable culture de vérification.
- Les documents de conception montrent une volonté explicite de ne pas perdre le « pourquoi ».
- Plusieurs modules sont déjà propres et extractibles.

### Ce qui est également vrai

- La structure actuelle reste historiquement accumulative.
- `scripts/` mélange plusieurs architectures différentes.
- La notion d'« agent » est trop large : elle recouvre des rôles de nature très différente.
- Certains outils existent pour surveiller ou coordonner d'autres outils qui auraient eux-mêmes besoin d'être regroupés à un niveau supérieur.
- Les contrats entre sous-systèmes sont encore trop souvent implicites.
- La base de données et le runtime IA ne sont pas suffisamment derrière des ports génériques.
- L'architecture produit et l'architecture Agence sont encore partiellement entremêlées.
- La capacité de commercialisation est très inférieure à la richesse technique.

### Conclusion

> **Nous ne sommes pas devant un système à refaire. Nous sommes devant un système à réarchitecturer.**

---

# 2. ÉCHELLE DE RATIONALISATION

Cette échelle sera utilisée pour les décisions futures.

| Niveau | Signification | Décision |
|---|---|---|
| R0 | inconnu | cartographier |
| R1 | compris mais historique | ne pas toucher sans contrat |
| R2 | responsabilité claire | stabiliser |
| R3 | frontière claire | modulariser |
| R4 | module autonome | extraire |
| R5 | composant exportable | industrialiser |
| R6 | produit distribuable | commercialiser |

La rationalisation ne cherche donc pas à mettre tout le monde en R5.

Elle cherche d'abord à faire disparaître les zones où **personne ne sait précisément pourquoi une chose existe ou quelle couche doit la posséder**.

---

# 3. NOUVELLE CLASSIFICATION DE L'AGENCE

## 3.1 Problème de l'ancien classement

Le classement historique tend à utiliser le vocabulaire :

- agent ;
- gardien ;
- membre ;
- script ;
- outil.

Ce vocabulaire est utile historiquement, mais il ne constitue pas une architecture logicielle suffisante.

Deux fichiers peuvent tous deux être appelés « agent » alors que :

- l'un est un calculateur pur ;
- l'autre un orchestrateur ;
- l'autre un registre ;
- l'autre un contrôleur documentaire ;
- l'autre un véritable raisonneur ;
- l'autre une plomberie partagée.

## 3.2 Nouvelle taxonomie

Chaque composant devra recevoir **deux identités** :

### Identité fonctionnelle

Ce qu'il fait.

### Identité architecturale

La couche à laquelle il appartient.

Les types cibles sont :

```text
CORE SERVICE
DOMAIN MODULE
TOOL
TOOL RUNTIME
ORCHESTRATOR
GUARDIAN / POLICY CHECK
REGISTRY / CONTRACT
INFRASTRUCTURE
OBSERVABILITY
QA / SIMULATION
DOCUMENTATION / KNOWLEDGE
EXPORT / PACKAGING
ADAPTER
UI / PRESENTATION
LEGACY / DEPRECATION
```

Cette distinction doit remplacer progressivement la classification uniquement historique.

---

# 4. ARCHITECTURE CIBLE DE L'AGENCE

```text
AGENCY RUNTIME
│
├── 01 CORE
│   ├── Supervisor
│   ├── Context Engine
│   ├── Policy Engine
│   ├── Transaction Engine
│   ├── Event / Process Runtime
│   └── Execution State
│
├── 02 PROJECT ENGINE
│   ├── Discovery
│   ├── Project Profile
│   ├── Workspace
│   ├── Repository
│   └── Project State
│
├── 03 TOOL SYSTEM
│   ├── Tool Contracts
│   ├── Tool Registry
│   ├── Tool Broker
│   ├── Tool Runtime
│   ├── Usage
│   └── Tool Learning
│
├── 04 WORK SYSTEM
│   ├── Tasks
│   ├── Plans
│   ├── Workflows
│   ├── Processes
│   ├── Modes
│   └── Scheduling / Autonomy
│
├── 05 QUALITY SYSTEM
│   ├── Characterization
│   ├── Tests
│   ├── Regression
│   ├── Simulation
│   ├── Evaluation
│   └── Final Judgment
│
├── 06 OBSERVABILITY
│   ├── Usage
│   ├── Cost
│   ├── KPI
│   ├── Time Series
│   ├── Logs
│   └── Reports
│
├── 07 GOVERNANCE
│   ├── Rules
│   ├── Policies
│   ├── Standards
│   ├── Permissions
│   ├── Fidelity
│   └── Human Approval
│
├── 08 KNOWLEDGE
│   ├── Documentation
│   ├── Memory
│   ├── Data Circulation
│   ├── References
│   └── Project Knowledge
│
├── 09 EXPORT / ECOSYSTEM
│   ├── Safe Export
│   ├── Blind Test
│   ├── Packaging
│   ├── Plugin Contracts
│   └── Distribution
│
└── 10 ADAPTERS
    ├── Gemini
    ├── OpenAI / other models
    ├── Cloudflare / D1
    ├── Filesystem
    ├── Shell
    ├── Browser
    └── External APIs
```

---

# 5. LES AXES MAJEURS — LES « GRANDES BRANCHES »

La cible n'est pas de créer 86 petits modules indépendants.

La cible est de faire émerger environ **8 à 10 grandes branches**, puis de placer les outils sous ces branches.

## Branche A — CORE

Responsable de l'exécution générale.

Ne doit connaître ni les détails de Gemini, ni les fichiers spécifiques de documentation, ni les rapports particuliers.

## Branche B — PROJECT

Comprendre et représenter le projet sur lequel l'Agence travaille.

## Branche C — TOOLS

Découvrir, sélectionner, invoquer, mesurer et apprendre les outils.

## Branche D — WORK

Transformer une demande en tâche, plan, processus et exécution.

## Branche E — QUALITY

Vérifier le travail produit.

## Branche F — OBSERVABILITY

Mesurer ce qui se passe.

## Branche G — GOVERNANCE

Définir ce qui est permis, obligatoire ou interdit.

## Branche H — KNOWLEDGE

Conserver et rendre exploitable l'information.

## Branche I — EXPORT

Transformer un composant en artefact autonome et réutilisable.

## Branche J — ADAPTERS

Relier l'Agence au monde extérieur.

---

# 6. CARTOGRAPHIE DES 86 SCRIPTS ACTUELS

La table suivante est une **classification directrice**, basée sur le rôle réel documenté et observé dans les sources et le code. Elle ne signifie pas que le fichier sera déplacé physiquement tel quel : plusieurs seront fusionnés, certains deviendront des bibliothèques, d'autres des sous-composants d'un système plus large.

## 6.1 CORE / ORCHESTRATION / WORK

| Actuel | Nature réelle | Cible | Action |
|---|---|---|---|
| `le-coordinateur.mjs` | catalogue/orchestration | Tool System / Supervisor | REPOSITIONNER puis découpler |
| `le-regisseur.mjs` | orchestration mécanique simulation | Work / Simulation Runtime | CONSERVER puis isoler |
| `god-of-all-process.mjs` | orchestration de processus | Work / Process Runtime | RECADRER |
| `angel-of-ia-process.mjs` | gouvernance de conduite | Governance / Process Policy | REPOSITIONNER |
| `circle-tasks.mjs` | ronde périodique | Work / Scheduler | RECONSTRUIRE comme workflow |
| `circle-process-guardian.mjs` | contrôle de ronde | Quality / Governance | FUSIONNER avec framework de process |
| `tasks-process-guardian.mjs` | contrôle du cycle tâches | Quality / Governance | FUSIONNER avec framework de process |
| `process-simulation-guardian.mjs` | contrôle simulation | Quality / Simulation | FUSIONNER dans Quality |
| `the-ghost.mjs` | mode autonome | Work / Autonomy | CONSERVER mais derrière un runtime |
| `modes-de-travail.mjs` | registre des modes | Work / Contract | EXTRAIRE |
| `check-level-target.mjs` | détermination niveau de vérification | Quality / Policy | CONSERVER comme policy |
| `priorites.mjs` | registre de priorité | Work / Contract | EXTRAIRE |
| `criticite.mjs` | calcul de criticité | Work / Policy | EXTRAIRE |
| `objectifs-vs-resultats.mjs` | cible vs mesure | Observability | DÉPLACER |

### Verdict

Le problème n'est pas que ces outils soient inutiles. Le problème est qu'ils forment aujourd'hui plusieurs morceaux d'un **futur Work Engine** sans que celui-ci existe encore comme couche explicite.

---

# 7. TOOL SYSTEM

| Actuel | Nature réelle | Cible | Action |
|---|---|---|---|
| `tool-brain.mjs` | conseil/sélection d'outils | Tool Broker | RECONSTRUIRE comme service |
| `tool-usage.mjs` | métrique d'usage | Observability | EXTRAIRE |
| `tool-learning.mjs` | apprentissage outil | Tool System / Learning | EXTRAIRE |
| `find-brain.mjs` | découverte/diagnostic | Tool Discovery | REPOSITIONNER |
| `find-booster.mjs` | accélération recherche | Tool Discovery | FUSIONNER si contrat commun |
| `route-booster.mjs` | routage/accélération | Tool Broker | FUSIONNER |
| `integration-outil.mjs` | intégration outil | Tool Lifecycle | RECONSTRUIRE |
| `agent-des-noms.mjs` | registre/nommage | Tool Registry / Knowledge | REPOSITIONNER |
| `abraham-les-references.mjs` | découverte de références/documents | Knowledge / Discovery | REPOSITIONNER |

### Principe

`tool-brain`, `find-brain`, `find-booster`, `route-booster`, `le-coordinateur` ne doivent pas devenir cinq centres concurrents de décision.

La cible est :

```text
                 TOOL SYSTEM
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    Registry      Discovery      Usage
        │            │            │
        └──────┬─────┴──────┬─────┘
               ▼            ▼
           Tool Broker   Learning
```

---

# 8. QUALITY SYSTEM

| Actuel | Nature réelle | Cible | Action |
|---|---|---|---|
| `check-house.mjs` | énorme harness de caractérisation/intégration | Quality Runtime | PROTÉGER, PUIS DÉCOMPOSER PAR CAPACITÉS |
| `check-spirit.mjs` | vérification réelle avec IA | Quality / AI Evaluation | ISOLER |
| `check-profile.mjs` | banc d'essai/diagnostic de profil | Quality / Evaluation | ISOLER du runtime produit |
| `filet-en-parts.mjs` | découpage/contrôle de périmètre | Quality / Analysis | REPOSITIONNER après contrat clair |
| `judge-persona-shared.mjs` | logique partagée de persona/jugement | Quality / Evaluation | EXTRAIRE comme composant partagé |
| `ezechiel-les-tests.mjs` | tests/mesures | Quality | REPOSITIONNER |
| `axa-check.mjs` | robustesse/fonctions fragiles | Quality / Static Analysis | EXTRAIRE |
| `check-argus.mjs` | contrôle de champs inutilisés | Quality / Static Analysis | EXTRAIRE |
| `check-harmonia.mjs` | cohérence code-doc | Governance / Documentation QA | EXTRAIRE |
| `clean-dirty-old.mjs` | ancienneté/risque | Quality / Maintenance | FUSIONNER dans maintenance analysis |
| `clone-hunter.mjs` | duplication | Quality / Architecture Analysis | EXTRAIRE |
| `hyper-scan-checkpoint.mjs` | scan global | Quality / Architecture Analysis | REPOSITIONNER |
| `execution-profile.mjs` | profil d'exécution | Observability / Quality | DÉPLACER |
| `corpus-mesure.mjs` | qualité des entrées | Quality Infrastructure | EXTRAIRE |
| `criticite.mjs` | criticité | Work / Governance | EXTRAIRE |
| `el-professor.mjs` | notation de simulations | Quality / Evaluation | CONSERVER sous Evaluation |
| `the-equalizer.mjs` | mise à niveau par standards | Governance / Standards QA | REPOSITIONNER |
| `the-final-judge.mjs` | jugement final | Quality / Evaluation | CONSERVER comme interface |
| `the-deep-reader.mjs` | relecture qualitative | Quality / Evaluation | CONSERVER comme interface |

### Règle pour `check-house`

**Ne pas le découper par taille de fichier.**

Le découpage doit être guidé par les capacités qu'il teste :

```text
check-house
   ↓
Characterization Engine
   ├── runtime boot
   ├── DB / migrations
   ├── API routes
   ├── domain behavior
   ├── AI mocks
   ├── filesystem
   ├── tool system
   └── regression suites
```

Le fichier actuel devient progressivement un **runner**, et non plus la maison entière.

---

# 9. GOVERNANCE SYSTEM

| Actuel | Nature réelle | Cible | Action |
|---|---|---|---|
| `always-new-code.mjs` | doctrine de reconstruction | Governance / Architecture | PROMOUVOIR au niveau architecture |
| `the-king.mjs` | contrôle décisions haut niveau | Governance / Policy | CONSERVER |
| `moise-tables-de-loi.mjs` | propriétaire de CLAUDE.md | Knowledge / Governance | REPOSITIONNER |
| `check-suivi-fidelity.mjs` | fidélité des tâches | Governance / Work | FUSIONNER dans Work Governance |
| `check-tasks-details.mjs` | état des tâches | Work / Task Management | RECONSTRUIRE |
| `cassandra-rh.mjs` | supervision équipe/usage | Governance / Workforce Analytics | REPOSITIONNER |
| `pure-gold-unity.mjs` | conformité aux standards de rendu | Governance / Standards | FUSIONNER |
| `check-profil-utilisateur.mjs` | cohérence profil documentaire | Knowledge Governance | REPOSITIONNER |
| `le-classificateur.mjs` | classification | Governance / Classification Service | RECONSTRUIRE comme service générique |
| `le-coordinateur.mjs` | coordination | Tool/Work Runtime | DÉCENTRALISER |

### Point critique

L'Agence possède trop de mécanismes de gouvernance pour que chacun devienne une « autorité ».

Il faut distinguer :

```text
RULE
POLICY
CHECK
REPORT
DECISION
```

Un check ne doit pas devenir une policy.
Une policy ne doit pas devenir un orchestrateur.
Un rapport ne doit pas devenir une source de vérité concurrente.

---

# 10. OBSERVABILITY / DATA

| Actuel | Nature réelle | Cible | Action |
|---|---|---|---|
| `tool-usage.mjs` | usage | Observability | EXTRAIRE |
| `kpi-report.mjs` | KPI | Observability | EXTRAIRE |
| `serie-temporelle.mjs` | tendances historiques | Observability | EXTRAIRE |
| `smart-conso-token.mjs` | coût tokens | Observability / Cost | EXTRAIRE |
| `smart-conso-api.mjs` | coût/API | Observability / Cost | EXTRAIRE |
| `ecotoken.mjs` | économie de tokens | Observability / Cost Policy | REPOSITIONNER |
| `memento.mjs` | mémoire/historique | Knowledge | REPOSITIONNER |
| `memento-weight.mjs` | pondération mémoire | Knowledge / Memory | EXTRAIRE |
| `data-archangel.mjs` | circulation des données | Knowledge / Data Governance | RECONSTRUIRE comme Data Lineage |
| `objectifs-vs-resultats.mjs` | écart cible/résultat | Observability | EXTRAIRE |
| `rapport-gros-prompt.mjs` | historique des grosses demandes | Observability / Knowledge | REPOSITIONNER |
| `ou-on-en-est.mjs` | état global | Observability / Dashboard | RECONSTRUIRE |

---

# 11. SIMULATION / VISUAL QA

| Actuel | Nature réelle | Cible | Action |
|---|---|---|---|
| `run-simulation.mjs` | exécution simulation | Quality / Simulation Runtime | EXTRAIRE |
| `simulation-visiteur.mjs` | scénario visiteur | Quality / Simulation Scenario | EXTRAIRE |
| `summarize-simulation-log.mjs` | résumé journal | Quality / Reporting | EXTRAIRE |
| `the-screener-capture.mjs` | capture Playwright | Quality / Visual QA | EXTRAIRE |
| `le-regisseur.mjs` | mécanique simulation | Simulation Runtime | CONSERVER puis isoler |
| `process-simulation-guardian.mjs` | conformité process simulation | Quality | FUSIONNER |
| `el-professor.mjs` | évaluation simulation | Quality / Evaluation | CONSERVER |

Cible : un **Simulation Engine** avec scénarios, runner, capture, journal, résumé et évaluation.

---

# 12. EXPORT / PRODUCTISATION

| Actuel | Nature réelle | Cible | Action |
|---|---|---|---|
| `safe-export.mjs` | exportabilité | Export / Packaging | PROMOUVOIR en composant stratégique |
| `x-port-blindtest.mjs` | test d'export | Export / QA | CONSERVER |
| `integration-outil.mjs` | intégration | Plugin Lifecycle | RECONSTRUIRE |
| `sauvegarde-projet.mjs` | sauvegarde/export du projet | Project / Backup | REPOSITIONNER |
| `ines-official.mjs` | snapshot consolidé | Knowledge / Export | REPOSITIONNER |
| `always-new-code.mjs` | architecture future | Architecture Governance | PROMOUVOIR |

Cible :

```text
EXPORT SYSTEM
   ├── Contract manifest
   ├── Dependency closure
   ├── Documentation bundle
   ├── Configuration
   ├── Tests
   ├── Blind test
   └── Package
```

---

# 13. INFRASTRUCTURE / ADAPTERS

| Actuel | Nature réelle | Cible | Action |
|---|---|---|---|
| `lib-shell.mjs` | shell/process helper | Infrastructure | EXTRAIRE très tôt |
| `lib-json.mjs` | utilitaire JSON | Infrastructure | EXTRAIRE |
| `lib-markdown-table.mjs` | rendu/table | Infrastructure / Reporting | EXTRAIRE |
| `html-report.mjs` | rendu HTML | Reporting Adapter | EXTRAIRE |
| `report-template.mjs` | contrat de rapport | Reporting Contract | EXTRAIRE |
| `sites-env.mjs` | environnement runtime | Infrastructure | EXTRAIRE |
| `run-framework.mjs` | lancement framework | Project/Runtime Adapter | REPOSITIONNER |
| `api-providers.mjs` | registre fournisseurs API | Adapter Registry | RECONSTRUIRE |
| `gemini-key-health.mjs` | santé clés | Model Adapter / Observability | REPOSITIONNER |
| `check-gemini-quota.mjs` | diagnostic quota | Model Adapter / Observability | REPOSITIONNER |
| `pnpm-install.mjs` | installation | Infrastructure | ISOLER |
| `install-ci.mjs` | installation CI | Infrastructure | ISOLER |
| `hooks/install.mjs` | installation hooks | Dev Infrastructure | ISOLER |
| `hooks/banniere.mjs` | hook présentation | Developer UX | DÉPLACER |
| `hooks/check-last-commit.mjs` | contrôle commit | Governance / Git QA | DÉPLACER |
| `hooks/check-last-commit.mjs` | contrôle commit | Governance / Git QA | DÉPLACER |
| `agent-du-temps.mjs` | temps/référence horaire | Infrastructure / Clock | EXTRAIRE |

---

# 14. KNOWLEDGE / DOCUMENTATION

| Actuel | Nature réelle | Cible | Action |
|---|---|---|---|
| `doc-report.mjs` | reporting documentaire | Knowledge / Reporting | EXTRAIRE |
| `abraham-les-references.mjs` | extraction de références | Knowledge / Discovery | EXTRAIRE |
| `messages-courts.mjs` | production de messages | Presentation | REPOSITIONNER |
| `rapport-gros-prompt.mjs` | rapport de demande | Knowledge / Observability | REPOSITIONNER |
| `memento.mjs` | mémoire | Knowledge / Memory | RECONSTRUIRE |
| `memento-weight.mjs` | pondération mémoire | Knowledge / Memory | EXTRAIRE |
| `moise-tables-de-loi.mjs` | gouvernance CLAUDE.md | Knowledge Governance | CONSERVER mais limiter son périmètre |
| `agent-des-noms.mjs` | nommage/registre | Knowledge / Registry | REPOSITIONNER |

---

# 15. OUTILS DONT LE STATUT DOIT CHANGER

Certains noms historiques donnent une fausse impression de nature architecturale.

## À ne plus considérer comme « agents » au sens logiciel

- `priorites`
- `criticite`
- `modes-de-travail`
- `corpus-mesure`
- `lib-json`
- `lib-shell`
- `report-template`
- `html-report`
- `serie-temporelle`
- `tool-usage`
- `agent-du-temps`

Ce sont des **services, contrats ou infrastructures**.

## À considérer comme orchestrateurs

- `le-coordinateur`
- `le-regisseur`
- `god-of-all-process`
- `circle-tasks`
- `the-ghost`

## À considérer comme gardiens/policies

- `check-argus`
- `check-harmonia`
- `axa-check`
- `check-suivi-fidelity`
- `the-king`
- `the-equalizer`
- `check-level-target`
- les process guardians

## À considérer comme moteurs de connaissance/données

- `data-archangel`
- `memento`
- `memento-weight`
- `abraham-les-references`
- `doc-report`

## À considérer comme système d'export

- `safe-export`
- `x-port-blindtest`
- `integration-outil`

Cette clarification est l'une des opérations de rationalisation les plus importantes.

---

# 16. CE QUI DOIT FUSIONNER CONCEPTUELLEMENT

La rationalisation ne signifie pas nécessairement supprimer du code immédiatement.

Elle signifie d'abord supprimer les **frontières artificielles**.

## 16.1 Tool Discovery / Tool Selection

À rapprocher :

- `find-brain`
- `find-booster`
- `route-booster`
- `tool-brain`
- une partie de `le-coordinateur`

Cible : **Tool Broker**.

## 16.2 Process Governance

À rapprocher :

- `god-of-all-process`
- `angel-of-ia-process`
- `circle-process-guardian`
- `tasks-process-guardian`
- `process-simulation-guardian`

Cible : **Process Runtime + Process Policies**.

## 16.3 Quality Guardians

À rapprocher conceptuellement :

- ARGUS
- AXA-CHECK
- HARMONIA
- CLEAN-DIRTY-OLD
- CLONE-HUNTER
- EQUALIZER
- HYPER-SCAN

Ils peuvent rester des plugins indépendants, mais ils doivent partager :

```text
Finding
Severity
Evidence
Scope
Timestamp
Recommendation
```

## 16.4 Reporting

À centraliser :

- `report-template`
- `html-report`
- `doc-report`
- `kpi-report`
- `summarize-simulation-log`

Cible : **Reporting Contract + Renderers**.

---

# 17. CE QUI NE DOIT PAS ÊTRE FUSIONNÉ

La rationalisation doit également protéger certaines séparations.

## Ne pas fusionner

### Tool Usage ≠ KPI

L'usage est une donnée brute ; le KPI est une interprétation.

### Policy ≠ Check

Une règle ne doit pas devenir un script de vérification spécifique.

### Simulation ≠ Production

La simulation peut partager le runtime, mais doit rester isolée.

### Knowledge ≠ Governance

Une documentation n'est pas automatiquement une règle.

### Model Gateway ≠ Domain Logic

Gemini/Claude/OpenAI doivent être des fournisseurs derrière un contrat.

### Repository ≠ World Domain

Le stockage ne doit pas définir le domaine.

### Final Judge ≠ Automatic Rule Engine

Un jugement qualitatif ne doit pas être réduit à une mécanique.

---

# 18. ROUTES AUTORISÉES

Une architecture rationnalisée doit également définir des directions.

```text
                 SUPERVISOR
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       PROJECT      WORK       POLICY
          │          │          │
          └──────┬───┴────┬─────┘
                 ▼        ▼
               TOOLS    CONTEXT
                 │        │
                 └───┬────┘
                     ▼
                TRANSACTIONS
                     │
                     ▼
                  VERIFY
                     │
                     ▼
                OBSERVABILITY
```

Règle :

> Une branche inférieure ne doit pas devenir l'autorité de la branche supérieure simplement parce qu'un fichier historique l'importe.

---

# 19. FRONTIÈRES TECHNIQUES PRIORITAIRES

Avant les grosses extractions :

## P0 — Model Gateway

```text
ModelGateway
 ├── generate
 ├── stream
 ├── estimateCost
 ├── health
 └── provider metadata
```

Gemini devient un adapter.

## P0 — Repository / Transaction

```text
Repository
 ├── readState
 ├── writeState
 ├── acquireLock
 ├── releaseLock
 └── idempotency
```

## P0 — Tool Contract

```text
Tool
 ├── id
 ├── capability
 ├── input schema
 ├── output schema
 ├── permissions
 ├── cost
 └── side effects
```

## P1 — Task / Workflow Contract

```text
Task
Workflow
Process
Execution
Result
```

## P1 — Finding / Report Contract

```text
Finding
 ├── source
 ├── severity
 ├── evidence
 ├── scope
 ├── recommendation
 └── timestamp
```

---

# 20. LES PREMIÈRES EXTRACTIONS RESTENT VALIDES — MAIS DANS LE BON ORDRE

## Extraction 1 — `lib/daynight.ts`

**R4 potentiel immédiat.**

But : prouver le protocole d'extraction.

## Extraction 2 — `lib/gemini-keys.ts`

Créer simultanément un `ModelProviderKey` contractuel.

## Extraction 3 — `lib/relationship.ts`

Après neutralisation de la dépendance type `Resident`.

## Extraction 4 — `lib/house.ts`

Seulement après avoir documenté son contrat central.

## Extraction 5 — infrastructure reporting / utility

`lib-json`, `lib-markdown-table`, `report-template`, `html-report`.

Cela permet de créer une vraie couche d'infrastructure partagée.

---

# 21. CE QU'IL NE FAUT PAS EXTRAIRE EN PREMIER

## `check-house.mjs`

Trop central et trop couplé.

## `app/api/lia/route.ts`

Trop de responsabilités simultanées : validation, lock, DB, modèle, mutation, réponse HTTP.

## `world.ts`

Il est actuellement la frontière de fait de plusieurs données et doit d'abord recevoir un contrat de repository.

## Le réseau de tâches/processus

Il faut d'abord créer les contrats `Task / Workflow / Process / Execution`.

---

# 22. RATIONALISATION DE `check-house`

La cible n'est pas :

```text
20 342 lignes → 5 fichiers
```

La cible est :

```text
20 342 lignes historiques
          ↓
   Characterization Engine
          │
 ┌────────┼───────────┐
 ▼        ▼           ▼
Boot    Domain       API
Tests   Tests        Tests
 │        │           │
 └────────┼───────────┘
          ▼
     Test Runner
          ▼
      Reporting
```

Le fichier historique pourra ensuite devenir une façade/runner.

---

# 23. RATIONALISATION DE `app/api/lia/route.ts`

La cible conceptuelle :

```text
HTTP ROUTE
   ↓
Request Validator
   ↓
Turn Application Service
   ↓
Policy
   ↓
Transaction
   ↓
Domain
   ├── World
   ├── Story
   ├── Life
   ├── Relationship
   └── Time
   ↓
Ports
   ├── Repository
   ├── ModelGateway
   ├── Clock
   └── Events
   ↓
Adapters
   ├── D1
   └── Gemini
```

La route ne doit plus être l'endroit où vit toute l'intelligence.

---

# 24. LE MODÈLE DE DÉCISION « GARDER / FUSIONNER / DÉPLACER / TRANSFORMER / SUPPRIMER »

Chaque composant futur doit passer par ce filtre.

| Décision | Quand l'utiliser |
|---|---|
| GARDER | responsabilité claire + contrat clair |
| FUSIONNER | deux composants expriment une même capacité |
| DÉPLACER | bonne responsabilité, mauvaise couche |
| TRANSFORMER | capacité pertinente mais mauvaise forme |
| DÉPRÉCIER | capacité remplacée mais utile pour migration |
| SUPPRIMER | aucune capacité actuelle justifiable |
| EXTRAIRE | frontière stable + dépendances maîtrisées |

La décision SUPPRIMER doit être autorisée explicitement.

---

# 25. SYSTÈME DE SCORE POUR LES DÉCISIONS

Chaque composant sera évalué sur 7 axes de 0 à 5 :

1. **Clarté de responsabilité**
2. **Indépendance**
3. **Réutilisabilité**
4. **Valeur métier**
5. **Risque de migration** (inverse)
6. **Dette historique** (inverse)
7. **Valeur exportable**

Score rationalisation :

```text
RS = responsabilité
   + indépendance
   + réutilisabilité
   + valeur
   + faible risque
   + faible dette
   + exportabilité
```

Sur 35.

Interprétation :

| Score | Décision indicative |
|---:|---|
| 29–35 | excellent candidat à l'extraction |
| 24–28 | stabiliser puis extraire |
| 18–23 | rationaliser avant extraction |
| 12–17 | refondre la frontière |
| 0–11 | historique / candidat à dépréciation |

Ce score ne remplace pas le jugement architectural ; il empêche seulement les décisions intuitives non traçables.

---

# 26. CURSEURS DE L'AGENCE APRÈS CETTE ANALYSE

| Dimension | Niveau actuel estimé | Cible |
|---|---:|---:|
| Richesse fonctionnelle | 90 | 90 |
| Intelligence accumulée | 88 | 90 |
| Documentation | 87 | 95 |
| Gouvernance | 82 | 92 |
| Auto-observation | 88 | 95 |
| Architecture globale | 52 | 90 |
| Séparation des responsabilités | 55 | 92 |
| Contracts | 48 | 90 |
| Modularité | 45 | 90 |
| Runtime Agence | 40–45 | 90 |
| Indépendance des modèles | 38 | 90 |
| Persistance / Repository | 40 | 90 |
| QA industrialisée | 60 | 92 |
| Exportabilité | 38 | 90 |
| Productisation | 30 | 85 |
| Commercialisation | 25–30 | 80 |

## Curseur synthétique

```text
                 AUJOURD'HUI             CIBLE

Richesse             ██████████████████░░  90
Architecture         ██████████░░░░░░░░░░  52
Modularité           █████████░░░░░░░░░░░  45
Runtime              █████████░░░░░░░░░░░  43
Exportabilité        ████████░░░░░░░░░░░░  38
Produit              ██████░░░░░░░░░░░░░░  30

                     ↓ RATIONALISATION ↓

Architecture         ██████████████████░░  90
Modularité           ██████████████████░░  90
Runtime              ██████████████████░░  90
Exportabilité        ██████████████████░░  90
Produit              █████████████████░░░  85
```

---

# 27. PLAN D'ACTION — 12 ÉTAPES

## Étape 1 — Geler les grandes fonctionnalités

Aucune nouvelle capacité majeure sans justification architecturale.

## Étape 2 — Construire la Capability Map

Liste officielle des capacités de l'Agence.

## Étape 3 — Construire la Responsibility Map

Pour chaque capacité : propriétaire, entrées, sorties, dépendances.

## Étape 4 — Reclasser les 86 scripts

La présente classification devient le premier brouillon du registre officiel.

## Étape 5 — Construire le Dependency Boundary Map

Définir les imports autorisés par branche.

## Étape 6 — Définir les contrats

Tool, Task, Workflow, Context, Repository, Transaction, Model, Finding, Report, Plugin.

## Étape 7 — Créer les premiers modules R4

`daynight`, `gemini-keys`, `relationship`, puis infrastructure simple.

## Étape 8 — Construire le Model Gateway

Sortir Gemini du cœur du domaine.

## Étape 9 — Construire Repository / Transaction

Sortir SQL et verrouillage des routes.

## Étape 10 — Transformer `check-house` en Test Runtime

Progressivement, sans perte de couverture comportementale.

## Étape 11 — Construire le Work / Tool Runtime

Faire émerger les vrais axes de l'Agence.

## Étape 12 — Passer à l'export et au produit

Un composant n'est réellement « produit » que lorsqu'il peut être installé, configuré, exécuté, vérifié et documenté hors de son projet d'origine.

---

# 28. PRODUIT COMMERCIAL — ORIENTATION

L'Agence ne devrait pas être positionnée comme un simple « coding agent ».

Le marché comporte déjà des offres très fortes d'agents de développement, de workflows multi-agents, d'environnements d'exécution et d'orchestration.

La différenciation potentielle de notre architecture est plutôt :

> **un runtime permettant de construire, gouverner, connecter, mesurer, sécuriser et exporter des agences IA spécialisées.**

Premier produit concret possible :

# AI Agency for Existing Codebases

Promesse :

```text
DONNEZ UN PROJET
      ↓
L'AGENCE LE DÉCOUVRE
      ↓
ELLE EXPLIQUE SON ARCHITECTURE
      ↓
ELLE IDENTIFIE LA DETTE
      ↓
ELLE PROPOSE UNE ARCHITECTURE CIBLE
      ↓
VOUS APPROUVEZ
      ↓
ELLE TRANSFORME PAR ÉTAPES
      ↓
ELLE TESTE
      ↓
ELLE VÉRIFIE
      ↓
ELLE DOCUMENTE
```

C'est à la fois :

- une application commerciale ;
- une démonstration du moteur ;
- un cas d'usage spectaculaire ;
- une preuve de la valeur de la rationalisation.

---

# 29. LE « MOMENT WOW » DU PRODUIT

L'expérience utilisateur doit être beaucoup plus simple que l'architecture interne.

Exemple :

> « J'ai analysé votre projet. Voici ce qu'il fait réellement. Voici les dépendances historiques. Voici les responsabilités réelles. Voici les trois zones qui empêchent aujourd'hui une évolution propre. Voici la forme que je recommande. Vous pouvez accepter chaque transformation séparément. »

Le produit doit donner l'impression :

> **« l'IA comprend avant d'agir. »**

C'est une proposition de valeur plus forte que la simple génération de code.

---

# 30. CRITÈRE ULTIME DE RÉUSSITE

La rationalisation sera considérée comme réussie lorsque :

1. un nouveau développeur peut comprendre les grandes branches sans connaître l'histoire du projet ;
2. un nouvel agent IA peut découvrir les contrats sans lire 95 000 lignes ;
3. un outil peut être retiré sans déclencher une enquête archéologique ;
4. un composant peut être exporté avec ses dépendances nécessaires ;
5. le modèle IA peut être changé sans réécrire le domaine ;
6. la DB peut être changée sans réécrire les règles métier ;
7. les tests peuvent viser des contrats plutôt que des détails historiques ;
8. les outils de gouvernance ne deviennent pas eux-mêmes une seconde jungle ;
9. le produit peut être expliqué en quelques minutes à un client ;
10. une équipe extérieure peut créer une nouvelle agence avec le runtime sans connaître Maison IA vivante.

---

# 31. CONCLUSION

La bonne stratégie n'est ni :

> « continuer comme avant »

ni :

> « tout réécrire proprement ».

La bonne stratégie est :

# **CONSERVER L'INTELLIGENCE — CHANGER LA GÉOMÉTRIE.**

Le projet a atteint un stade où sa croissance organique doit maintenant céder la place à une architecture consciente.

La rationalisation est donc **la charnière entre l'Agence historique et l'Agence produit**.

La modularisation vient ensuite pour matérialiser cette nouvelle géométrie.

L'extraction vient ensuite pour prouver que les frontières sont réelles.

L'industrialisation vient ensuite pour les rendre robustes.

Et la commercialisation vient seulement lorsque ces frontières permettent réellement de distribuer quelque chose d'indépendant de l'histoire du projet.

---

# ANNEXE — PRINCIPES DIRECTEURS À CONSERVER

1. **Boundary First, Extraction Later.**
2. **Comprendre avant de modifier.**
3. **Préserver le pourquoi, pas seulement le quoi.**
4. **Ne jamais confondre outil, service, policy, registre et agent.**
5. **Les grandes capacités sont les branches ; les outils sont les feuilles.**
6. **Aucun composant nouveau sans place architecturale explicite.**
7. **Aucune suppression sans récupération de la connaissance utile.**
8. **Aucune extraction sans contrat.**
9. **Aucune autonomie sans transaction et vérification.**
10. **Aucun produit exportable sans test en environnement propre.**
11. **Le modèle IA est un fournisseur, pas le cœur du produit.**
12. **MCP est un moyen d'intégration, pas l'architecture centrale.**
13. **La qualité doit être une propriété du runtime, pas une collection infinie de scripts.**
14. **La gouvernance doit être plus petite que ce qu'elle gouverne.**
15. **L'Agence doit pouvoir expliquer sa propre architecture.**
