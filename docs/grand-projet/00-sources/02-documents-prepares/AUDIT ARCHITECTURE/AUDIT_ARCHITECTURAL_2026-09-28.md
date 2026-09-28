# AUDIT ARCHITECTURAL EXHAUSTIF — projet du 28 septembre 2026

## Statut de l'audit

**Nature :** audit statique et architectural du ZIP fourni, avant toute modification du code.

**Archive analysée :** `projet-2026-09-28-13-35.zip`.

**Répertoire de travail :** extraction locale de l'archive, sans modification du projet source.

**Limite importante :** le ZIP ne contient pas `.git/` et ne contient pas `node_modules/`. L'audit peut donc établir la structure, les dépendances statiques, les contrats visibles, les scripts et les mécanismes de test présents dans les sources, mais ne peut pas vérifier ici l'état exact du dernier commit, ni exécuter `tsc`, ESLint ou les tests dépendant des paquets installés. Les 88 fichiers `.mjs` ont toutefois tous passé `node --check`.

---

# 0. Résumé exécutif

Le dépôt n'est **pas un simple monolithe de 10 000 lignes**. L'archive contient **1 327 fichiers**, dont **190 fichiers de code** pour environ **95 397 lignes de code**. La majorité du poids informationnel est cependant dans `docs/`, qui contient 1 098 fichiers.

Le système est mieux décrit comme un **écosystème logiciel émergent** composé de cinq ensembles fortement liés :

1. le produit/runtime de la Maison IA (`app/`, `lib/`, `db/`, `components/`) ;
2. un très gros système d'outillage/QA/processus (`scripts/`) ;
3. une base documentaire et historique massive (`docs/`, `CLAUDE.md`) ;
4. une infrastructure Cloudflare/Vinext/D1/Drizzle ;
5. des mécanismes de validation, simulation, métriques et exportabilité construits progressivement autour du produit.

La conclusion principale de l'audit est donc :

> **Il ne faut pas chercher d'abord à découper les gros fichiers. Il faut d'abord formaliser les frontières qui existent déjà conceptuellement mais qui ne sont pas encore des frontières techniques.**

Les risques structurants sont :

- couplage direct de la route HTTP au domaine, à la DB et au fournisseur Gemini ;
- persistence non centralisée ;
- dépendance de `lib/world.ts` vers `lib/lia.ts` ;
- réseau de scripts très fortement interconnecté, avec un cycle runtime réel ;
- tests concentrés dans un énorme harness custom ;
- nombreux accès filesystem/process/global state dans `scripts/` ;
- registres/listes manuels qui doivent être maintenus à la main ;
- documentation importante mais parfois déjà en retard sur le code réel ;
- absence de commande `test` standard dans `package.json` malgré une couverture custom importante ;
- surface admin protégée par un code statique documenté comme fragile ;
- dépendance très forte de Gemini dans le chemin d'exécution ;
- données métier stockées en JSON dans SQLite, avec contrats implicites ;
- dépendances temporelles et transactionnelles qui ne ressortent pas du graphe d'import.

À l'inverse, le projet possède des actifs architecturaux très précieux :

- contrats Zod pour les sorties IA ;
- verrou global avec epoch/token/expiration ;
- `world_requests` pour l'idempotence ;
- migrations D1/Drizzle ;
- rotation/cooldown des clés Gemini ;
- métriques et audit ;
- simulations réelles ;
- tests de non-régression extrêmement nombreux ;
- documentation du « pourquoi » ;
- premiers mécanismes d'exportabilité déjà présents dans SAFE-EXPORT.

---

# 1. Inventaire quantitatif

| Élément | Mesure |
|---|---:|
| Fichiers totaux | **1 327** |
| Fichiers `.ts` | 37 |
| Fichiers `.tsx` | 65 |
| Fichiers `.mjs` | 88 |
| Fichiers de code analysés | **190** |
| Lignes de code | **95 397** |
| Fichiers `docs/` | 1 098 |
| Fichiers Markdown | 481 |
| Fichiers TXT | 465 |
| Fichiers HTML | 119 |
| Migrations SQL | 7 |
| Fichiers PNG | 4 |
| Dépendances locales détectées | 596 arêtes |
| Dépendances locales uniques | 596 |
| Cycles d'import statiques bruts | 3 |
| Cycles runtime plausibles | **1 réel identifié** + 1 faux positif lié à un commentaire dynamique |

### Répartition du code

| Zone | Fichiers code | Lignes |
|---|---:|---:|
| `scripts` | 86 | 82,490 |
| `components` | 63 | 7,696 |
| `lib` | 24 | 2,623 |
| `app` | 6 | 2,305 |
| `vite.config.ts` | 1 | 69 |
| `examples` | 2 | 69 |
| `db` | 2 | 59 |
| `eslint.config.mjs` | 1 | 29 |
| `hooks` | 1 | 20 |
| `cloudflare-env.d.ts` | 1 | 13 |
| `drizzle.config.ts` | 1 | 8 |
| `next.config.ts` | 1 | 8 |
| `postcss.config.mjs` | 1 | 8 |


Le résultat est particulièrement révélateur : **`scripts/` représente à lui seul environ 82 490 lignes**, soit la grande majorité du code du dépôt. Le produit applicatif proprement dit (`app`, `lib`, `db`, `components`, `hooks`) est beaucoup plus petit.

Cela signifie que l'architecture à récupérer n'est pas seulement celle de l'application web : **l'architecture de l'Agence elle-même est principalement dans `scripts/`.**

---

# 2. Graphe complet des dépendances

Le graphe complet machine-readable est fourni séparément dans :

- `dependency-graph.json` — graphe local complet ;
- `dependency-graph.dot` — représentation Graphviz ;
- `report.json` — mesures brutes de l'audit.

Le graphe statique détecte les imports relatifs et alias `@/`. Il ne voit pas toutes les dépendances implicites : lectures de fichiers par chemin, `exec`, génération de modules, remplacement de texte, variables d'environnement, imports dynamiques construits, conventions de registre, etc.

C'est une distinction essentielle pour ce projet : **le graphe d'import est seulement le graphe A. Il faut lui ajouter le graphe des dépendances par artefacts et processus.**

---

# 3. Graphe des cycles

## 3.1 Cycle `lib/`

Le cycle statique brut :

`lib/relationship.ts → lib/world.ts → lib/relationship.ts`

Mais l'analyse du code montre que `relationship.ts` importe `Resident` depuis `world.ts` avec `import type`. Le cycle est donc essentiellement **un cycle de conception/type**, pas un cycle runtime classique.

Le problème architectural reste réel : le domaine `relationship` connaît le type `Resident` défini par le module `world`, tandis que `world` utilise la logique `relationship`.

Cela suggère que `Resident` appartient probablement à un contrat de domaine plus bas niveau que `world`.

## 3.2 Cycle `scripts/`

Un cycle runtime beaucoup plus important relie une longue chaîne de l'outillage :

- `lib/relationship.ts → lib/world.ts`
- `scripts/the-equalizer.mjs → scripts/objectifs-vs-resultats.mjs → scripts/cassandra-rh.mjs → scripts/find-brain.mjs → scripts/safe-export.mjs → scripts/pure-gold-unity.mjs → scripts/ecotoken.mjs → scripts/moise-tables-de-loi.mjs → scripts/check-tasks-details.mjs → scripts/god-of-all-process.mjs → scripts/abraham-les-references.mjs → scripts/the-king.mjs → scripts/circle-tasks.mjs → scripts/doc-report.mjs → scripts/data-archangel.mjs → scripts/agent-des-noms.mjs → scripts/le-classificateur.mjs → scripts/circle-process-guardian.mjs → scripts/hyper-scan-checkpoint.mjs → scripts/le-coordinateur.mjs → scripts/tool-brain.mjs → scripts/kpi-report.mjs`
- `scripts/check-spirit.mjs`

Ce cycle est beaucoup plus significatif que le cycle `relationship/world` : il montre que l'Agence possède actuellement **un réseau de processus mutuellement dépendants**, plutôt qu'une hiérarchie simple.

Conséquence : extraire un outil isolé de `scripts/` demandera souvent d'extraire ou de stabiliser aussi ses contrats avec plusieurs autres outils.

---

# 4. Les 20 plus gros hubs

| Fichier | Entrants | Sortants | Lignes |
|---|---:|---:|---:|
| `scripts/check-house.mjs` | 0 | 73 | 20,342 |
| `scripts/tool-usage.mjs` | 61 | 1 | 590 |
| `scripts/lib-shell.mjs` | 58 | 0 | 1,236 |
| `lib/utils.ts` | 57 | 0 | 7 |
| `scripts/report-template.mjs` | 49 | 1 | 709 |
| `scripts/le-coordinateur.mjs` | 10 | 13 | 2,419 |
| `scripts/check-tasks-details.mjs` | 10 | 10 | 4,489 |
| `scripts/kpi-report.mjs` | 5 | 15 | 1,198 |
| `scripts/html-report.mjs` | 16 | 2 | 314 |
| `scripts/safe-export.mjs` | 7 | 11 | 3,131 |
| `scripts/circle-tasks.mjs` | 6 | 12 | 2,562 |
| `scripts/cassandra-rh.mjs` | 4 | 14 | 4,705 |
| `scripts/hooks/check-last-commit.mjs` | 0 | 18 | 588 |
| `scripts/smart-conso-token.mjs` | 11 | 6 | 1,487 |
| `scripts/le-classificateur.mjs` | 7 | 10 | 2,787 |
| `scripts/clean-dirty-old.mjs` | 8 | 8 | 208 |
| `app/api/lia/route.ts` | 0 | 16 | 1,817 |
| `scripts/doc-report.mjs` | 9 | 6 | 1,644 |
| `scripts/tool-brain.mjs` | 6 | 9 | 746 |
| `lib/world.ts` | 8 | 6 | 48 |

### Lecture architecturale

Les hubs les plus préoccupants ne sont pas forcément les plus gros en lignes.

`tool-usage.mjs`, `lib-shell.mjs` et `report-template.mjs` ont énormément de consommateurs : ce sont des **infrastructures transverses**.

`check-house.mjs` est différent : il a énormément de sorties mais pratiquement aucun entrant. Il agit comme **un orchestrateur/test harness autonome qui connaît énormément du système**.

`app/api/lia/route.ts` est également critique : son nombre de dépendances sortantes est élevé pour une frontière HTTP, et ces dépendances touchent directement le cœur métier, la DB et le modèle.

---

# 5. Classement des fichiers par responsabilité réelle

La classification naturelle qui ressort du dépôt est :

### A — Runtime produit

- `app/`
- `lib/`
- `db/`
- `components/`
- `hooks/`
- `public/`

### B — Infrastructure d'exécution

- `vite.config.ts`
- `next.config.ts`
- `drizzle.config.ts`
- `scripts/sites-env.mjs`
- `scripts/run-framework.mjs`
- installation/Cloudflare/Wrangler

### C — QA / validation / simulation

- `check-house.mjs`
- `check-spirit.mjs`
- `run-simulation.mjs`
- ARGUS / HARMONIA / AXA-CHECK / etc.

### D — Agence / gestion de processus

- `le-coordinateur.mjs`
- `cassandra-rh.mjs`
- `circle-tasks.mjs`
- `god-of-all-process.mjs`
- `tool-brain.mjs`
- `tool-learning.mjs`
- `integration-outil.mjs`
- etc.

### E — Documentation / mémoire / historique

- `CLAUDE.md`
- `docs/`
- archives, sessions, rapports, référentiels

### F — Exportabilité / récupération

- `safe-export.mjs`
- `sauvegarde-projet.mjs`
- `filet-en-parts.mjs`
- documents SAFE-EXPORT et kits associés

**Conclusion :** il existe déjà des frontières conceptuelles très fortes. Le problème est que `scripts/` mélange plusieurs sous-systèmes différents et que le runtime mélange encore plusieurs responsabilités à l'intérieur de `lib/` et des routes.

---

# 6. Carte des dépendances DB

La DB est petite mais structurante.

## Tables

- `agent_state`
- `memories`
- `conversations`
- `world_lock`
- `world_requests`
- `dialogue_fingerprints`

## Accès directs détectés

Les principaux accès sont dans :

- `db/index.ts`
- `db/schema.ts`
- `lib/world.ts`
- `app/api/lia/route.ts`
- `app/api/world/route.ts`
- `app/api/admin/route.ts`
- `scripts/check-house.mjs`
- `scripts/check-spirit.mjs`

### Problème majeur

`app/api/lia/route.ts` exécute directement de nombreux `db.prepare(...)` et construit ses transactions SQL elle-même.

`lib/world.ts` exécute également directement du SQL.

Nous avons donc actuellement :

```text
HTTP route
   ↓
D1 SQL

World module
   ↓
D1 SQL
```

et non :

```text
HTTP
 ↓
Application
 ↓
Repository / Transaction port
 ↓
D1 adapter
```

C'est l'une des frontières les plus importantes à formaliser pour l'exportabilité.

### Deuxième problème : JSON métier

`agent_state.emotions`, `agent_state.needs` et surtout le `scenario` stocké dans `memories.content` contiennent des structures JSON riches.

Le contrat réel de ces structures n'est donc pas entièrement représenté dans le schéma SQL : une partie du contrat vit dans TypeScript, Zod, les prompts et les tests.

Il faut donc considérer le **Data Contract** comme une couche architecturale à part entière.

---

# 7. Carte réseau

### Runtime produit

- `app/api/lia/route.ts` → Gemini `generateContent`.
- `lib/lia.ts` → Gemini.
- `app/page.tsx` → API interne `/api/world`.

### Outillage

Plusieurs scripts effectuent des appels réseau directs :

- `api-providers.mjs` — Gemini/OpenAI ;
- `run-simulation.mjs` — serveur local ;
- `check-profile.mjs` ;
- `check-spirit.mjs` ;
- `check-gemini-quota.mjs` ;
- `kpi-report.mjs` ;
- `smart-conso-token.mjs` ;
- `the-screener-capture.mjs` ; etc.

### Observation importante

Le runtime principal est **effectivement centré sur Gemini**, même si l'outillage connaît plusieurs fournisseurs.

Le système possède donc une abstraction partielle de fournisseur, mais elle n'est pas encore devenue une frontière `ModelGateway` générale du runtime.

---

# 8. Carte filesystem / processus

L'analyse détecte des accès filesystem/process dans **118 fichiers de code** selon une détection textuelle large.

Cette mesure inclut volontairement `process.env`, donc elle surestime les accès disque/processus purs. Elle reste cependant révélatrice : la zone `scripts/` est massivement orientée filesystem/process.

Des modules utilisent notamment :

- `node:fs`
- `node:path`
- `node:child_process`
- `node:os`
- `node:url`
- `node:crypto`
- `spawn/exec`
- fichiers temporaires
- répertoires `.sites-runtime`
- logs
- registres
- documents
- scripts générés

### Conclusion

`script` n'est pas simplement une extension CLI du produit. C'est **une couche d'automatisation système**.

Elle doit donc être considérée comme une plateforme séparée dans la future architecture.

---

# 9. Variables d'environnement

Le dépôt référence **23 noms de variables d'environnement** différents.

| Variable | Fichiers | Principales zones |
|---|---:|---|
| `CODEX_SANDBOX` | 1 | `vite.config.ts` |
| `CLOUDFLARE_CF_FETCH_ENABLED` | 2 | `scripts/sites-env.mjs`, `vite.config.ts` |
| `WRANGLER_SEND_METRICS` | 2 | `scripts/sites-env.mjs`, `vite.config.ts` |
| `WRANGLER_WRITE_LOGS` | 2 | `scripts/sites-env.mjs`, `vite.config.ts` |
| `WRANGLER_LOG_PATH` | 2 | `scripts/sites-env.mjs`, `vite.config.ts` |
| `WRANGLER_REGISTRY_PATH` | 2 | `scripts/sites-env.mjs`, `vite.config.ts` |
| `MINIFLARE_REGISTRY_PATH` | 2 | `scripts/sites-env.mjs`, `vite.config.ts` |
| `TOOL_USAGE_ORIGIN` | 9 | `scripts/agent-des-noms.mjs`, `scripts/ezechiel-les-tests.mjs`, `scripts/integration-outil.mjs`, `scripts/memento.mjs`, `scripts/rapport-gros-prompt.mjs`, `scripts/safe-export.mjs` |
| `SOURCE` | 1 | `scripts/check-tasks-details.mjs` |
| `MOTCLE` | 1 | `scripts/check-tasks-details.mjs` |
| `SITES_RUNTIME_ROOT` | 1 | `scripts/sites-env.mjs` |
| `GEMINI_API_KEY` | 3 | `scripts/check-gemini-quota.mjs`, `scripts/check-profile.mjs`, `scripts/check-spirit.mjs` |
| `GEMINI_MODEL` | 3 | `scripts/check-gemini-quota.mjs`, `scripts/check-profile.mjs`, `scripts/check-spirit.mjs` |
| `GEMINI_FALLBACK_MODELS` | 2 | `scripts/check-profile.mjs`, `scripts/check-spirit.mjs` |
| `GEMINI_API_KEY_FALLBACKS` | 1 | `scripts/check-spirit.mjs` |
| `SHARP_IGNORE_GLOBAL_LIBVIPS` | 1 | `scripts/install-ci.mjs` |
| `SIM_BASE_URL` | 1 | `scripts/run-simulation.mjs` |
| `SIM_OUT_DIR` | 1 | `scripts/run-simulation.mjs` |
| `SIM_MAX_ROUNDS` | 1 | `scripts/run-simulation.mjs` |
| `EZ_NU_MS` | 1 | `scripts/ezechiel-les-tests.mjs` |
| `EZ_COUV_MS` | 1 | `scripts/ezechiel-les-tests.mjs` |
| `EZ_TSC_MS` | 1 | `scripts/ezechiel-les-tests.mjs` |
| `SITES_INSTALL_REPORT_PATH` | 1 | `scripts/pnpm-install.mjs` |
| `BANNIERE_PREMIER` | 1 | `scripts/hooks/banniere.mjs` |

Il faut distinguer quatre familles :

1. secrets/fournisseurs (`GEMINI_API_KEY`, fallbacks) ;
2. runtime Cloudflare/Wrangler ;
3. configuration de simulation ;
4. instrumentation/processus d'outillage.

Aujourd'hui ces contrats sont dispersés dans les scripts. Pour une agence exportable, ils devraient devenir des **configuration contracts versionnés et validables**.

---

# 10. Carte des endpoints et surface d'attaque

| Endpoint | Méthode | Lignes | Accès sensibles |
|---|---|---:|---|
| `/api/admin` | POST | 33 | métriques, monde, données admin |
| `/api/lia` | POST | 1 817 | mutation du monde, Gemini, DB, actions |
| `/api/world` | GET | 13 | lecture du monde / conversations |

## `/api/lia`

C'est la surface critique : validation Zod, verrou, DB, logique de tour, appels Gemini, mutations d'état et réponse HTTP sont dans le même module.

## `/api/admin`

Le code utilise actuellement un code statique `'1980'`. Le référentiel du projet le classe lui-même parmi les points fragiles et note notamment l'absence de limite de tentatives.

Cela ne permet pas, à partir du ZIP seul, de conclure à une exploitation en production ; en revanche, c'est un **risque de conception confirmé et documenté**, à traiter avant commercialisation/exposition publique.

## Authentification

`app/chatgpt-auth.ts` fournit une abstraction SIWC propre pour l'identité, mais les routes `/api/*` examinées ici n'appellent pas `requireChatGPTUser()`.

Il faut donc distinguer :

- authentification de l'utilisateur de la plateforme ;
- autorisation d'une action métier ;
- accès admin ;
- contrôle de possession du monde.

Ce sont aujourd'hui des préoccupations séparées, mais pas encore réunies dans une politique d'autorisation explicite commune.

---

# 11. Carte des tests réellement présents

`package.json` ne contient pas de script `test`.

Pourtant :

- `check-house.mjs` contient **6 326 occurrences d'assertions** selon le comptage statique ;
- **375 marqueurs `Passed:`** ;
- environ **20 342 lignes** ;
- il transpile plusieurs modules TypeScript à la volée ;
- crée une DB SQLite en mémoire ;
- remplace l'environnement Cloudflare ;
- remplace les imports ;
- monkey-patche `globalThis.fetch` ;
- injecte des réponses Gemini synthétiques ;
- exerce des scénarios HTTP ;
- teste des migrations ;
- vérifie aussi l'outillage de l'Agence.

`check-spirit.mjs` est un autre outil de tests/provocation qui peut appeler réellement Gemini.

`run-simulation.mjs` est un pilote de simulation intégrale.

### Diagnostic

Le système de test existe bel et bien, mais il est **non standard, très intégré et partiellement auto-construit autour du code testé**.

Le point le plus important est cette séquence de `check-house.mjs` :

```text
lecture de route.ts
↓
remplacement de cloudflare:workers
↓
remplacement manuel de chaque import @/lib/...
↓
transpilation
↓
écriture de modules .sites-runtime/test-*.mjs
↓
chargement de la route transformée
```

Cela constitue une dépendance cachée majeure.

Une extraction de module qui modifie ses imports peut donc casser le harness même si le runtime reste correct.

---

# 12. Carte des scripts et de leurs relations

C'est probablement le deuxième plus gros système après `docs/`.

Quelques hubs :

- `tool-usage.mjs` — 61 consommateurs ;
- `lib-shell.mjs` — 58 ;
- `report-template.mjs` — 49 ;
- `le-coordinateur.mjs` — 10 entrants / 13 sortants ;
- `check-tasks-details.mjs` — 10 / 10 ;
- `safe-export.mjs` — 7 / 11 ;
- `cassandra-rh.mjs` — 4 / 14 ;
- `kpi-report.mjs` — 5 / 15.

### Diagnostic

Il existe une hiérarchie implicite :

```text
lib-shell / tool-usage / report-template
             ↓
        outils spécialisés
             ↓
       orchestrateurs
             ↓
      méta-orchestrateurs
```

mais cette hiérarchie n'est pas parfaitement acyclique.

Le cycle runtime identifié indique qu'une partie du réseau d'outils se connaît mutuellement.

C'est un problème d'exportabilité beaucoup plus important que la taille individuelle des scripts.

---

# 13. Carte des données partagées

Les données structurantes du runtime sont :

### État des résidents

- humeur ;
- activité ;
- objectif ;
- cycle ;
- pièce ;
- émotions ;
- besoins ;
- intention.

### État narratif

- round ;
- seed/session ;
- evidence ;
- observations ;
- dreams ;
- life ;
- révélation ;
- bonus ;
- dossier ;
- destination en attente ;
- phase jour/nuit.

### Données historiques

- memories ;
- conversations ;
- dialogue fingerprints ;
- world requests.

### Problème de propriété

Aujourd'hui plusieurs modules lisent et transforment ces structures sans qu'un propriétaire de domaine explicite soit toujours visible.

Le cas le plus parlant est `Story`/`Life`/`Resident` : leurs frontières existent conceptuellement, mais les transformations se produisent dans plusieurs couches.

---

# 14. Carte des invariants

Plusieurs invariants sont déjà codés et doivent être considérés comme des contrats :

1. les émotions restent dans `[0,100]` via `emotionSchema` ;
2. les intentions viennent d'un enum partagé ;
3. les pièces sont bornées par un enum ;
4. les sorties IA sont validées par `decisionSchema` ;
5. les mutations sensibles utilisent le `world_lock` et sa clôture par token/expiration ;
6. `world_requests.id` sert d'identifiant de requête et participe à l'idempotence ;
7. la nuit/jour est dérivée de l'horloge du scénario ;
8. certaines transitions de pièce sont contraintes par le moteur de tour ;
9. les rêves sont associés à leur personnage ;
10. les preuves et observations sont conceptuellement distinctes ;
11. les réponses IA ont des limites de longueur et de forme ;
12. les clés Gemini sont traitées avec rotation/cooldown plutôt qu'une simple variable persistante unique.

Ces invariants sont un actif : ils peuvent devenir des **contracts** indépendants.

---

# 15. Carte des dépendances temporelles

Le projet possède une dimension temporelle que le graphe d'import ne montre pas :

```text
requête
  ↓
acquisition du verrou
  ↓
lecture état
  ↓
décision
  ↓
appel IA éventuel
  ↓
validation
  ↓
mutation DB
  ↓
commit
  ↓
prochain tour
```

D'autres horloges existent :

- `world_lock.expires_at` ;
- `world_lock.last_auto` ;
- cooldown des clés ;
- `round` ;
- cycle jour/nuit ;
- fatigue ;
- délai d'autonomie ;
- événements visuels ;
- sessions de simulation.

C'est un véritable **graphe de dépendances temporelles**.

Toute extraction du moteur de tour doit préserver ce modèle, sinon un module peut être correct isolément et produire des courses ou des états impossibles dans le système.

---

# 16. Carte code ↔ documentation

La documentation est exceptionnellement riche, mais l'audit révèle déjà du drift.

Exemple concret :

- `docs/referentiel/check-house.md` annonce **14 869 lignes / 266 blocs `Passed:` au 26 septembre** ;
- le fichier actuel contient **20 342 lignes / 375 `Passed:`**.

Ce n'est pas nécessairement un bug fonctionnel : c'est un **écart documentaire mesurable**.

Autre observation : le `README.md` reste celui d'un `vinext-starter` générique, tandis que `CLAUDE.md` décrit la « Maison IA vivante » et son architecture spécifique.

Cela crée plusieurs niveaux de vérité documentaire :

```text
README starter
      │
CLAUDE projet
      │
docs référentiel
      │
code réel
      │
scripts d'audit
```

Il faudra à terme définir explicitement quelle couche fait autorité pour quoi.

---

# 17. Détection des duplications de logique

Le scan heuristique des corps de fonctions identifie peu de doublons textuellement identiques significatifs. Cela ne signifie pas qu'il n'existe pas de duplication.

La duplication la plus importante détectée est plutôt **structurelle** :

- accès DB répétés dans les routes ;
- logique de génération Gemini dans plusieurs chemins ;
- listes de modules/imports répétées dans les harness ;
- registres de scripts répétés dans plusieurs outils ;
- règles documentaires répliquées dans les outils de contrôle.

Autrement dit : **la duplication de connaissance est plus préoccupante que la duplication de lignes.**

---

# 18. Registres manuels

Le dépôt contient de nombreux registres/listes explicitement maintenus à la main, notamment :

- `AGENT_SCRIPT_FILES` ;
- `SENSITIVE_NODES` ;
- `LOCAL_JOURNALS` ;
- listes de scripts couverts ;
- listes de modules transpiles par `check-house` ;
- listes de chemins et artefacts SAFE-EXPORT ;
- plusieurs tableaux de catégories et de prestations.

Le projet documente lui-même ce risque et possède déjà des garde-fous.

Mais architecturalement, ces registres restent un signal important :

> **l'existence d'un registre manuel signifie qu'une partie du contrat du système n'est pas dérivée automatiquement de la structure réelle.**

Lorsqu'un module devient exportable, il faut éviter de l'obliger à modifier dix registres du projet parent.

---

# 19. Imports interdits / directions inverses

Le cas le plus significatif actuellement est :

```text
lib/world.ts
      ↓
lib/lia.ts
```

`world.ts` importe `emotionSchema` depuis `lia.ts`.

Conceptuellement, cela inverse une dépendance : le monde/persistence ne devrait pas avoir besoin du module de dialogue/IA pour connaître la forme de ses émotions.

Une architecture plus propre serait conceptuellement :

```text
             Domain Contracts
              /     |      \
             /      |       \
        World    Emotion    Relationship
          |          |           |
          └──────────┼───────────┘
                     |
               Application
                     |
             Model / Gemini
```

Ce point doit être traité comme **problème de frontière**, pas comme simple problème d'import.

---

# 20. Candidats à l'extraction

Les scores ci-dessous sont **préliminaires et analytiques**, calculés à partir de la structure observée, pas des estimations de planning définitives.

| Bloc | Effort | Risque | Valeur réutilisation | Exportabilité | Diagnostic |
|---|---:|---:|---:|---:|---|
| `lib/gemini-keys.ts` + contrat fournisseur | 3/5 | 3/5 | 5/5 | 5/5 | excellent candidat de frontière |
| `lib/daynight.ts` / timing | 2/5 | 2/5 | 3/5 | 4/5 | très isolable |
| `lib/relationship.ts` | 2/5 | 2/5 | 3/5 | 4/5 | petit domaine, dépendances limitées |
| contrat `ModelGateway` autour de `lib/lia.ts` | 4/5 | 4/5 | 5/5 | 5/5 | très stratégique mais sensible |
| repository/transaction world | 4/5 | 5/5 | 5/5 | 4/5 | indispensable mais à traiter prudemment |
| `tool-usage` / observabilité | 3/5 | 3/5 | 5/5 | 5/5 | infrastructure transversale |
| système tâches/processus de `scripts/` | 5/5 | 5/5 | 5/5 | 5/5 | futur cœur d'agence, mais fortement couplé |
| `safe-export.mjs` | 4/5 | 4/5 | 5/5 | 5/5 | méta-outil très stratégique |
| `check-house.mjs` | 5/5 | 5/5 | 4/5 | 2/5 | **ne pas extraire en premier** |
| `app/api/lia/route.ts` | 5/5 | 5/5 | 5/5 | 5/5 | énorme valeur mais doit être déconstruite par contrats |

Ce tableau ne constitue pas encore un ordre de migration. Il identifie seulement les zones où l'architecture naturelle semble suffisamment claire pour devenir un contrat futur.

---

# 21. Les frontières naturelles déjà présentes

L'audit fait émerger le découpage suivant :

```text
                         SYSTEME
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
     PRODUCT              AGENCY             KNOWLEDGE
        │                   │                    │
   ┌────┼────┐       ┌──────┼──────┐       docs / rules
   │    │    │       │      │      │
 Domain DB   UI    Tools  QA/Sim  Export
   │    │    │       │      │      │
   └────┼────┘       └──────┼──────┘
        │                   │
        └──────── contracts ┘
```

À l'intérieur du produit :

```text
HTTP/API
   ↓
Application / Turn Engine
   ↓
Domain
   ├── World
   ├── Story
   ├── Life
   ├── Relationship
   ├── Perception
   └── Time
   ↓
Ports
   ├── Repository
   ├── ModelGateway
   ├── Clock
   └── Event/Observation
   ↓
Adapters
   ├── D1
   ├── Gemini
   └── Cloudflare
```

Cette architecture est une **déduction à partir des frontières déjà visibles dans le code**, pas une affirmation que cette architecture existe actuellement.

---

# 22. Ce que l'audit permet déjà d'affirmer

### Affirmé avec forte confiance

- le projet est d'environ 95k lignes de code ;
- `scripts/` est la principale masse de code ;
- `check-house` est un énorme harness ;
- il existe une forte validation custom ;
- la DB est petite mais centrale ;
- la route `lia` concentre énormément de responsabilités ;
- le runtime dépend directement de Gemini ;
- les scripts ont des dépendances croisées importantes ;
- il existe au moins un cycle runtime dans l'outillage ;
- les registres manuels sont nombreux ;
- la documentation contient déjà des écarts mesurables avec le code ;
- plusieurs contrats sont déjà codés dans Zod, SQL, locks et tests.

### À ne pas prétendre encore

Nous ne pouvons pas conclure à partir de cet audit seul :

- que le système échoue en production ;
- qu'il est impossible à maintenir ;
- qu'il contient une vulnérabilité exploitable particulière ;
- que telle extraction réussira sans tests complémentaires ;
- que les performances réelles sont insuffisantes ;
- que la couverture comportementale est réellement de X % sans exécution de la suite.

---

# 23. Ce qui manque encore pour une due diligence niveau production

Même cette cartographie exhaustive doit encore être complétée par six audits spécialisés :

1. **audit AST/TypeScript réel** — pour remplacer les regex par un graphe syntaxique exact ;
2. **audit d'exécution** — lancer build, typecheck, lint, harness et simulations dans un environnement installé ;
3. **audit des contrats de données** — documenter les schémas JSON et leurs propriétaires ;
4. **audit sécurité** — auth, autorisation, secrets, rate limits, admin, CORS/origin, logs ;
5. **audit performance/coût** — DB, appels Gemini, latence, tokens, contention du verrou ;
6. **audit d'extraction réel** — créer un premier module dans un repository vide et vérifier son autonomie.

Ces audits ne doivent pas être mélangés avec une refonte immédiate.

---

# 24. Conclusion professionnelle

Le projet est **récupérable** et possède même une base inhabituelle pour une récupération : une grande quantité de mémoire documentaire, des tests comportementaux nombreux, des mécanismes d'audit, des contrats Zod, des migrations, de l'observabilité et une première réflexion explicite sur l'exportabilité.

La difficulté principale n'est pas la taille.

La difficulté principale est que **le système a déjà construit plusieurs architectures en parallèle** :

- architecture du produit ;
- architecture narrative ;
- architecture de test ;
- architecture d'outillage ;
- architecture documentaire ;
- architecture de processus d'agence.

Elles fonctionnent ensemble, mais leurs frontières ne sont pas encore toutes explicites.

La stratégie correcte n'est donc pas :

> « découper les gros fichiers ».

Elle est :

> **identifier les contrats de propriété, de données, d'exécution, de temps et d'infrastructure qui existent déjà ; stabiliser ces contrats ; puis seulement déplacer progressivement les implémentations derrière eux.**

Le projet ne doit pas être reconstruit pour devenir modulaire.

Il doit être **rendu progressivement extractible sans cesser de fonctionner**.

C'est une différence essentielle : elle permet de transformer le problème de refactoring en un problème mesurable de maturation architecturale.
