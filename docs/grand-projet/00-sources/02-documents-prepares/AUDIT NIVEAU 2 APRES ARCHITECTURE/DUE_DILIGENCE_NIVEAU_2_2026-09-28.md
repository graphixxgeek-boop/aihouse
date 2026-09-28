# Due diligence architecture — niveau 2
## Projet Maison IA vivante — audit du 28 septembre 2026

### Périmètre
Analyse réalisée sur l'archive auditée extraite dans `src/`, sans modification du code source original.

Objectif : transformer la cartographie initiale en preuves plus précises sur :
- dépendances AST/TypeScript ;
- distinction imports runtime / type-only ;
- contrats de données ;
- sécurité des surfaces HTTP ;
- exécution réelle disponible dans l'archive ;
- premiers modules réellement extractibles.

---

## 1. Résultat exécutif

Le deuxième niveau confirme que le projet possède déjà plusieurs frontières naturelles. Il ne faut toujours pas lancer une refonte globale.

Les premiers candidats d'extraction sont :

| Rang | Module | État | Pourquoi |
|---|---|---|---|
| 1 | `lib/daynight.ts` | **R3 — extractible maintenant** | 0 dépendance locale runtime, 2 consommateurs, fonctions déterministes, tests de caractérisation passants |
| 2 | `lib/gemini-keys.ts` | **R3 — extractible maintenant avec contrat de provider** | 0 dépendance locale, état interne explicite, 3 consommateurs, logique de résilience réutilisable |
| 3 | `lib/relationship.ts` | **R2/R3 — extractible après décorrélation des types** | aucun import runtime local ; dépend seulement de types de `house`, `world`, `simulation` |
| 4 | `lib/house.ts` | **R2 — très bon noyau de contrat, mais blast radius élevé** | 0 dépendance locale, mais 14 consommateurs ; les types `Person`/`Room` sont très partagés |
| 5 | `lib/simulation.ts` | **R2 — extraction ultérieure** | faible dépendance technique, mais responsabilité métier centrale et 10 consommateurs |

À l'inverse :

- `lib/world.ts` n'est **pas** un premier candidat : il porte la persistance et dépend de six modules runtime.
- `app/api/lia/route.ts` n'est **pas** un module à extraire tel quel : c'est actuellement un orchestrateur HTTP + verrouillage + DB + moteur de tour + IA + mutation d'état.
- Le réseau de scripts doit être traité comme une plateforme d'automatisation distincte, pas comme une bibliothèque à découper fichier par fichier.

### Découverte importante par rapport au niveau 1
Le premier audit avait signalé une grande boucle de dépendances. L'analyse AST réelle corrige ce point :

- 190 fichiers de code analysés par AST ;
- 163 relations locales AST résolues ;
- 147 relations runtime après exclusion des imports type-only ;
- **0 SCC runtime locale de taille > 1**.

Le couple `lib/world.ts` ↔ `lib/relationship.ts` n'est donc pas un cycle runtime : `relationship.ts` importe `Resident` uniquement comme type, tandis que `world.ts` importe réellement `relationship.ts`.

Cela est une bonne nouvelle : il existe du couplage architectural, mais pas la boucle d'exécution que la première cartographie regex laissait penser.

---

# 2. Analyse AST / TypeScript

## 2.1 Méthode

L'analyse a utilisé le compilateur TypeScript 5.8.3 disponible dans l'environnement, directement sur l'arbre source, sans installation dans celui-ci.

Elle distingue :
- import runtime ;
- import type-only ;
- export local ;
- import dynamique local ;
- résolution des alias `@/...` ;
- cycles sur le graphe runtime.

Le `tsc --noEmit` complet n'a pas pu être exécuté sur l'archive brute parce que `node_modules` est absent. Cette limitation est importante : les résultats AST sont précis sur la structure source, mais ne remplacent pas une compilation complète avec toutes les dépendances installées.

## 2.2 `lib/daynight.ts`

Caractéristiques AST :
- 102 lignes ;
- 0 import local ;
- 0 import externe ;
- 2 consommateurs runtime : `lib/world.ts` et `app/api/lia/route.ts` ;
- six fonctions principales ;
- aucun accès DB, réseau ou filesystem.

Il s'agit du cas idéal d'un premier module exportable : son comportement est presque entièrement fonctionnel et ses entrées/sorties sont primitives.

### Contrat actuel implicite

Entrée principale : `round: number`.

Sorties :
- position de cycle ;
- index de jour ;
- jour/nuit ;
- minuit ;
- phase ;
- multiplicateur de fatigue.

La logique documente explicitement les invariants importants : 29 rounds de jour, 9 de nuit, cycle de 38, minuit au round 35, fatigue ×3 la nuit et ×1 le jour.

### Verdict
**Extraction directe possible**, à condition de conserver exactement le contrat comportemental et les tests.

---

# 3. `lib/gemini-keys.ts` — candidat stratégique

Caractéristiques AST :
- 161 lignes ;
- 0 dépendance locale ;
- 3 consommateurs runtime ;
- aucun accès DB ;
- aucun filesystem ;
- aucune dépendance Node obligatoire ;
- état interne limité à la rotation, cooldowns, épisodes et métriques.

Consommateurs :
- `lib/lia.ts` ;
- `app/api/lia/route.ts` ;
- `app/api/admin/route.ts`.

## 3.1 Contrat fonctionnel identifié

Le module expose notamment :
- `fingerprint()` ;
- `orderKeys()` ;
- `recordKeyStatus()` ;
- `getGeminiKeyMetrics()` ;
- `getGeminiKeyEpisodes()` ;
- fonctions de reset/inspection réservées aux tests.

Le comportement est déjà assez bien encapsulé : les appelants ne manipulent pas directement les maps de cooldown.

## 3.2 Ce qui empêche de le considérer comme produit générique immédiatement

Le module est nommé et pensé pour Gemini. Pour une future agence exportable, il faudrait séparer :

**niveau générique**
```text
KeyPool / ProviderCredentialPool
    orderCandidates()
    recordOutcome()
    getMetrics()
```

et :

**adaptateur Gemini**
```text
GeminiCredentialSource
Gemini HTTP status mapping
Gemini model identity
```

La logique de cooldown, rotation et fingerprint peut devenir générique ; les noms Gemini peuvent rester dans l'adaptateur.

### Verdict
**R3 pour extraction technique ; R4 après généralisation du contrat provider.**

C'est probablement le meilleur premier module stratégique après `daynight`, car il apporte immédiatement une capacité réutilisable à l'architecture Agency.

---

# 4. `lib/relationship.ts` — presque autonome

Caractéristiques :
- 88 lignes ;
- 0 import runtime local ;
- 3 imports locaux, tous type-only ;
- 5 consommateurs runtime ;
- aucune DB ;
- aucun réseau ;
- aucun filesystem.

Le fichier contient des règles métier cohérentes :
- attraction mutuelle ;
- activité partagée ;
- état amoureux ;
- choix de chambre ;
- évolution de l'attraction ;
- pression de propositions ;
- interprétation/flirt ;
- réaction à une ligne affective.

## Problème actuel

Les types viennent de trois domaines voisins :
- `house.ts` pour `Person` et `Room` ;
- `world.ts` pour `Resident` ;
- `simulation.ts` pour `Intent`.

Ce sont des dépendances de compilation, pas d'exécution.

## Extraction recommandée

Créer un petit contrat de domaine inférieur, par exemple :

```text
RelationshipActor
    id
    room
    intent
    emotions.attraction
    emotions.trust
```

Le module n'aurait alors plus besoin de connaître `Resident`, `World` ou `Simulation`.

### Verdict
**Très bon deuxième/ troisième module métier extractible.**

La modification préalable est minime : remplacer les types importés par des interfaces locales ou un contrat partagé inférieur.

---

# 5. `lib/house.ts` — cas particulier

Caractéristiques :
- 76 lignes ;
- 0 dépendance locale runtime ;
- 14 consommateurs ;
- types et fonctions spatiales fortement réutilisés.

Fonctions principales :
- accès jardin ;
- chemin entre pièces ;
- ancrage de destination ;
- destination du résident.

C'est techniquement très extractible, mais son nombre élevé de consommateurs en fait un mauvais « premier geste » si l'objectif est de minimiser le blast radius.

Il faut le considérer comme un **contrat fondamental de l'univers spatial**, pas comme un simple fichier utilitaire.

### Verdict
**R2 : isolable, mais à traiter après les modules à faible blast radius.**

---

# 6. `lib/simulation.ts`

Caractéristiques :
- 181 lignes ;
- une seule dépendance locale runtime apparente : aucune ; l'import de `house` est type-only ;
- 10 consommateurs ;
- logique de besoins, émotions, priorité et expression.

Cela montre une bonne nouvelle : le moteur de simulation est déjà relativement pur techniquement.

Mais son poids sémantique est supérieur à celui de `daynight` ou `relationship` : il influence beaucoup plus de comportements.

### Verdict
**R2**. Il doit être caractérisé puis extrait après les premières extractions pilotes.

---

# 7. `lib/world.ts` — frontière de persistance actuelle

Caractéristiques :
- 48 lignes ;
- 8 consommateurs ;
- 6 dépendances runtime locales ;
- accès direct à D1 ;
- initialise le monde ;
- lit les agents, souvenirs, conversations, verrou et scénario.

Dépendances runtime locales :
- relationship ;
- life ;
- daynight ;
- simulation ;
- lia ;
- house.

Le point critique est la dépendance :

```text
world -> lia
```

alors que `lia` représente aussi la génération/raisonnement IA.

C'est une vraie violation de direction architecturale potentielle : la persistance du monde ne devrait pas avoir besoin de connaître le moteur IA pour représenter ou lire son état.

### Verdict
Ne pas extraire maintenant. Créer d'abord un contrat de données/domain model inférieur à `world` et `lia`.

---

# 8. `app/api/lia/route.ts` — confirmation du rôle d'orchestrateur

1 817 lignes, 17 dépendances locales sortantes.

Le fichier concentre actuellement :

```text
HTTP
  ↓
validation Zod
  ↓
authentification/origine
  ↓
lecture DB
  ↓
lock/fencing
  ↓
idempotence
  ↓
lecture Story/Life/Resident
  ↓
plan de tour
  ↓
raisonnement IA
  ↓
validation décision
  ↓
calculs métier
  ↓
mutations DB
  ↓
conversations/mémoires
  ↓
réponse HTTP
```

C'est exactement pourquoi le fichier est dangereux à découper arbitrairement.

La bonne cible n'est pas :

```text
route.ts → 20 petits fichiers
```

mais :

```text
HTTP adapter
     ↓
Turn Application Service
     ↓
Domain services
     ↓
Ports
     ↓
D1 / Gemini adapters
```

---

# 9. Contrats de données

## 9.1 Contrat SQL explicite

Le schéma contient six tables :
- `agent_state` ;
- `memories` ;
- `conversations` ;
- `world_lock` ;
- `world_requests` ;
- `dialogue_fingerprints`.

Le SQL est relativement petit, mais les champs `emotions`, `needs` et `memories.content` transportent du JSON sérialisé.

Cela signifie que le véritable contrat est double :

```text
SQL schema
    +
JSON domain schema
```

Le second est beaucoup moins explicite dans la base.

## 9.2 Contrats déjà forts

Le projet possède déjà plusieurs garde-fous :
- validation Zod des décisions IA ;
- bornes émotionnelles ;
- enums d'intention ;
- verrouillage avec token/expiration ;
- idempotence via `world_requests.id` ;
- séparation observations/preuves ;
- distinction Story/Life/Resident ;
- rotation et cooldown des clés.

Il ne faut donc pas « inventer une architecture contractuelle » : il faut **extraire et nommer les contrats déjà présents**.

---

# 10. Sécurité — niveau 2

## 10.1 `app/api/admin/route.ts`

Le endpoint :
- vérifie l'Origin lorsqu'il est fourni ;
- accepte un code administratif littéral `1980` ;
- ne présente pas de rate limiting visible ;
- expose des métriques sensibles de fonctionnement ;
- utilise `Cache-Control: no-store`.

Le problème principal n'est pas la lecture de métriques en elle-même, mais le mécanisme d'autorisation : un secret statique codé dans la route n'est pas une politique d'accès robuste.

### Action recommandée
Remplacer à terme par une politique d'autorisation centralisée :

```text
request
 → auth/session
 → authorization policy
 → admin capability
 → endpoint
```

Ne pas corriger cela en créant simplement un autre secret codé ailleurs.

## 10.2 Auth ChatGPT

`app/chatgpt-auth.ts` contient un vrai helper :
- lecture des headers d'identité ;
- validation du chemin de retour ;
- redirection vers Sign in with ChatGPT.

Mais l'analyse des usages montre que `requireChatGPTUser()` et `getChatGPTUser()` ne sont appelés nulle part ailleurs dans le code applicatif analysé.

Cela signifie que **le mécanisme d'authentification existe mais n'est pas actuellement une barrière commune des routes API principales**.

Ce point doit être traité comme une question d'architecture de sécurité, pas comme une simple extraction de fichier.

## 10.3 `/api/lia`

La route dispose d'une vérification Origin lorsqu'un header Origin est présent.

Elle possède également une protection transactionnelle plus substantielle :

```text
world_lock token
+ expires_at
+ fencing SQL
+ requestId/idempotency
+ epoch
```

C'est un bon mécanisme de cohérence concurrente.

Il ne faut pas le casser lors de l'extraction.

---

# 11. Exécution réelle

## 11.1 Ce qui a réellement été exécuté

### Syntaxe
Les 88 fichiers `.mjs` avaient déjà passé `node --check` dans le niveau 1.

### Caractérisation directe
Tests exécutés dans un environnement isolé avec transpilation TypeScript directe :

- `lib/daynight.ts` : **14/14 tests PASS** ;
- `lib/relationship.ts` : **7/7 tests PASS**.

Ces tests ne remplacent pas la suite officielle : ils prouvent seulement que les fonctions pures ciblées peuvent être exécutées indépendamment et que leurs invariants centraux se comportent comme prévu.

## 11.2 Ce qui ne peut pas encore être exécuté

`npm run build` échoue avant le build applicatif parce que l'archive ne contient pas `node_modules` : `vinext` est introuvable.

`node scripts/check-house.mjs` échoue également avant son démarrage réel car le package `typescript` local attendu par le script n'est pas installé dans l'archive.

`node scripts/check-spirit.mjs` présente la même limitation.

Le `tsc --noEmit` complet échoue pour la même raison : les définitions `node` et `@cloudflare/workers-types` ne sont pas disponibles localement.

### Conclusion d'exécution

Nous avons donc trois niveaux de preuve distincts :

| Niveau | Résultat |
|---|---|
| Syntaxe Node | vérifiée |
| AST / structure TS | vérifiée |
| Modules purs ciblés | exécutés et caractérisés |
| Compilation complète | **non vérifiable dans l'archive brute** |
| Build applicatif | **bloqué par absence de dépendances** |
| Suite `check-house` complète | **bloquée par absence de dépendances** |
| Simulation Gemini réelle | non exécutée |

Aucune panne applicative de production ne doit être déduite de ces échecs : ils sont ici causés par l'état de l'archive d'audit.

---

# 12. Première stratégie d'extraction réellement recommandée

## Phase A — extraction pilote minimale

### A1 — `lib/daynight.ts`

Objectif : créer le premier module externe sans toucher à la logique métier.

Forme cible :

```text
packages/domain-daynight/
  src/daynight.ts
  src/index.ts
  tests/daynight.test.ts
```

Le projet principal consomme ensuite son contrat.

Critère de réussite :
- même résultat sur les rounds connus ;
- aucun changement de comportement du jeu ;
- zéro accès infrastructure ;
- remplacement réversible en une opération.

### A2 — `lib/gemini-keys.ts`

Deux étapes :

1. extraire tel quel comme module de résilience Gemini ;
2. une fois stabilisé, introduire un contrat provider-neutral.

Critère de réussite :
- même rotation ;
- même cooldown ;
- mêmes métriques ;
- mêmes fingerprints ;
- aucune clé secrète exposée ;
- même comportement en concurrence simulée.

### A3 — `lib/relationship.ts`

Avant extraction : supprimer les imports type-only vers `world`/`simulation` en introduisant un contrat `RelationshipActor`.

Critère de réussite :
- même sortie pour les scénarios caractérisés ;
- plus aucun import de `world` depuis le module relationnel ;
- aucun accès infrastructure.

---

# 13. Ordre recommandé des extractions

```text
                 FAIBLE RISQUE
                      │
                      ▼
              daynight.ts
                      │
                      ▼
             gemini-keys.ts
                      │
                      ▼
            relationship.ts
                      │
                      ▼
                house.ts
                      │
                      ▼
             simulation.ts
                      │
                      ▼
           domain contracts
                      │
                      ▼
            world repository
                      │
                      ▼
           Turn Application
                      │
                      ▼
             /api/lia route
                      │
                      ▼
        Agency / task-process layer
                 HAUT RISQUE
```

Cet ordre n'est pas fondé sur la taille des fichiers. Il est fondé sur :
- indépendance ;
- nombre de consommateurs ;
- criticité ;
- accès infrastructure ;
- stabilité du contrat ;
- valeur de réutilisation ;
- capacité à prouver l'extraction sans régression.

---

# 14. Ce qui doit devenir une frontière avant toute extraction majeure

## Domaine

```text
Resident
Story
Life
RelationshipActor
Room
Intent
Emotions
Needs
```

## Ports

```text
WorldRepository
ModelGateway
Clock
EventStore / ConversationStore
KeyPool
```

## Adapters

```text
D1WorldRepository
GeminiModelGateway
GeminiKeyPool
CloudflareRuntime
HTTP API
```

## Application

```text
TurnService
AdminService
WorldQueryService
```

L'objectif n'est pas de créer 30 interfaces. L'objectif est de rendre explicites les contrats qui sont déjà nécessaires au fonctionnement.

---

# 15. Décision finale de due diligence niveau 2

### Peut-on commencer à extraire ?

**Oui, mais uniquement avec les modules pilotes ci-dessus.**

### Peut-on découper `/api/lia/route.ts` maintenant ?

**Non.** Il faut d'abord isoler ses contrats de données, son port DB, son port ModelGateway et son service de tour.

### Peut-on extraire `world.ts` maintenant ?

**Non.** Il faut d'abord supprimer sa connaissance directe de `lia`.

### Peut-on extraire `daynight.ts` maintenant ?

**Oui.** C'est le meilleur premier test de la méthode.

### Peut-on extraire `gemini-keys.ts` maintenant ?

**Oui techniquement**, avec une première extraction Gemini-specific, puis généralisation vers un contrat provider-neutral.

### Peut-on extraire `relationship.ts` maintenant ?

**Presque immédiatement**, après remplacement de ses trois imports type-only par un contrat métier inférieur.

### Faut-il refactorer tout le projet avant ?

**Non.** Le niveau 2 renforce au contraire la stratégie : les frontières existent déjà à plusieurs endroits. Il faut les rendre exportables une par une, en conservant le comportement.

---

## Prochaine preuve à obtenir avant la première extraction productive

La prochaine étape de due diligence doit être exécutée dans une copie de travail équipée des dépendances du projet :

1. `pnpm install --frozen-lockfile` ou équivalent compatible avec le lockfile ;
2. `tsc --noEmit` ;
3. `eslint` ;
4. `npm/pnpm run build` ;
5. exécution complète de `check-house.mjs` ;
6. exécution des simulations existantes ;
7. tests de concurrence du verrou D1 ;
8. tests de rotation/cooldown Gemini ;
9. mesure des appels Gemini et des tokens ;
10. test d'une extraction réelle dans une branche/copie isolée.

Cette étape permettra de passer de **R3 « structurellement extractible »** à **R4 « extraction prouvée par build + tests + compatibilité »**.
