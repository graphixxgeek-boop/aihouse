# La planche des schémas de process

*Générée par `node scripts/god-of-all-process.mjs schemas` — dérivée des données de god,
jamais recopiée à la main. Un process ajouté demain y apparaît sans que personne n'y pense.*

## 1. Le schéma maître — la FORME

```
SCAN >> RAPPORTS >> ANALYSE >> PLAN D'ACTION >> QUESTIONS >> TÂCHES DE TRAVAIL
```

- **SCAN** — produire une mesure réelle sur l'état des choses.
  - *Sans lui :* l'analyse porterait sur une impression
- **RAPPORTS** — écrire ET LIVRER ce que le scan a trouvé.
  - *Sans lui :* seul l'agent sait ce qui a été vu (Partie 13 : écrire n'est pas livrer)
- **ANALYSE** — trier ce qui compte de ce qui ne compte pas.
  - *Sans lui :* un tas de constats bruts, que personne ne hiérarchise
- **PLAN D'ACTION** — donner à CHAQUE constat un des trois états : retenu / écarté avec sa raison / à trancher.
  - *Sans lui :* un constat écarté disparaît sans trace — l'abandon déguisé de l'Article 28
- **QUESTIONS** *(bifurcation, pas une étape de la file)* — poser à l'utilisateur les constats « à trancher », et eux seuls.
  - *Sans lui :* l'agent décide à sa place, ou bloque tout en attendant
- **TÂCHES DE TRAVAIL** — inscrire dans docs/suivi/ les tâches réelles issues des constats retenus et des réponses.
  - *Sans lui :* le rapport a coûté son temps et n'a rien changé

**Ce qu'il est, et ce qu'il n'est pas.** Une ressemblance de famille, jamais une loi : là où un
process écrit diffère du schéma, c'est LE PROCESS qui fait foi — lui a été calibré étape par
étape. Un maillon absent n'est jamais une faute en soi, il se DÉCLARE avec sa raison.

## 2. Les trois « maîtres », qui ne sont pas la même chose

| | Quoi | Où | Ce qu'il gouverne |
|---|---|---|---|
| **Le schéma maître** | la FORME | `SCHEMA_DE_REFERENCE` | une ressemblance de famille |
| **Le process maître** | la TENUE du dispositif | process `meta` | que chaque process ait document, contrôleur, sondes |
| **La chaîne maîtresse** | l'OBLIGATION | Article 28 | `rapport → analyse → plan d'action → tâches` |

## 3. Les 10 process, et leur distance au schéma

### `ronde` — Ronde périodique (CIRCLE-TASKS)

- **Écrit dans** : `docs/circle-process-detail.txt` · **surveillé par** : `scripts/circle-process-guardian.mjs`
- **Déclencheur** : les tâches gratuites périodiques qu'on oublie facilement
- **9 étapes** : questionnaire → execution → rapport → voix-utilisateur → analyse → plan-action → taches → contributions → enregistrement
- **Schéma maître** : ✅ les six maillons sont présents.

### `analyse-charte` — Analyse et plan d'action de la charte (MOÏSE-TABLES-DE-LOI)

- **Écrit dans** : `docs/analyse-charte-process-detail.md` · **surveillé par** : `scripts/moise-tables-de-loi.mjs`
- **Déclencheur** : analyser la charte du projet en profondeur et en tirer un plan d'action
- **12 étapes** : memoire → fraicheur → cartographie → table-regles → accueil → pertinence → analyse → plan-action → questions → taches → synthese → enregistrement
- **Schéma maître** : ✅ les six maillons sont présents.

### `simulation` — Simulation intégrale (Article 18)

- **Écrit dans** : `docs/regles-de-travail.md` · **surveillé par** : `scripts/process-simulation-guardian.mjs`
- **Déclencheur** : lancer une simulation complète de bout en bout et l'analyser
- **15 étapes** : conso → script → lancement → livraison → archivage → note → rendu → memoire → poids → cout-reel → index → lecture-rapports → sondage → calibrage → chaine
- **Schéma maître** : ✅ les six maillons sont présents.

### `semi-autonome` — mode semi-autonome — travailler seul pendant que l'utilisateur est là

- **Écrit dans** : `docs/mode-semi-autonome-process-detail.md` · **surveillé par** : `scripts/god-of-all-process.mjs`
- **Déclencheur** : l'utilisateur est présent mais pas devant l'écran : il répondra, plus tard
- **5 étapes** : mode-declare → file-reelle → sans-arret → fenetre-dediee → question-non-bloquante
- **Schéma maître** : 4 maillon(s) absent(s), tous déclarés :
  - **scan** — *ce process ne mesure rien de son côté : il ORCHESTRE le travail sur d'autres process, comme son voisin nocturne*
  - **rapports** — *un mode ne produit aucun rapport propre — chaque tâche enchaînée produit le sien, et l'Article 29 exige déjà un compte rendu par tâche*
  - **analyse** — *rien à trier ici : les constats appartiennent au process réellement exécuté, jamais à la manière dont on l'exécute*
  - **plan-action** — *un mode ne fait aucun constat, donc n'a rien à retenir ni à écarter — le plan d'action vit dans le rapport de chaque tâche enchaînée (Article 28)*

### `nuit` — mode-auto-process-guardian — travail autonome (mode nocturne)

- **Écrit dans** : `docs/mode-auto-process-guardian.md` · **surveillé par** : `scripts/god-of-all-process.mjs`
- **Déclencheur** : travailler seul pendant l'absence de l'utilisateur
- **9 étapes** : identite → etat-taches → plan → ronde-lourde → simulation-nuit → sensible → suivi → verification-finale → rapport
- **Schéma maître** : 2 maillon(s) absent(s), tous déclarés :
  - **scan** — *la nuit ORCHESTRE d'autres process (Ronde, simulation) qui scannent eux-mêmes — elle n'a pas de mesure propre*
  - **questions** — *personne n'est là pour répondre : la borne posée par l'utilisateur (« aucune fenêtre ne doit être bloquante pour le mode autonome ») l'interdit, et les points sont reportés au prochain passage en sa présence*

### `meta` — Tenue du dispositif de process lui-même (process maître)

- **Écrit dans** : `docs/mode-auto-process-guardian.md` · **surveillé par** : `scripts/god-of-all-process.mjs`
- **Déclencheur** : ajouter, retirer ou modifier un process, un gardien de process, ou god-of-all-process
- **7 étapes** : registre → document → sondes → tensions → modification-indirecte → mecanismes-inscrits → identite
- **Schéma maître** : 4 maillon(s) absent(s), tous déclarés :
  - **analyse** — *ce process vérifie une structure (registre, documents, sondes), il ne produit aucun constat à trier*
  - **plan-action** — *son verdict est binaire — un process a son document et son contrôleur, ou il ne les a pas*
  - **questions** — *rien à trancher : ce qui manque se corrige, ça ne se calibre pas*
  - **taches** — *ses écarts sont corrigés dans la foulée par selfCheck(), jamais différés en tâche*

### `integration-outil` — Intégration d'un nouvel outil dans l'Agence

- **Écrit dans** : `docs/referentiel/integration-outil.md` · **surveillé par** : `scripts/integration-outil.mjs`
- **Déclencheur** : créer un nouvel outil, le faire entrer dans l'équipe, lui donner un rang ou un badge
- **6 étapes** : consultation → registres → documents → lancement-reel → tests → suivi
- **Schéma maître** : 5 maillon(s) absent(s), tous déclarés :
  - **scan** — *rien à mesurer : l'outil LIT les registres réels et dit lesquels manquent, ce n'est pas un scan de découverte*
  - **rapports** — *sa sortie EST la liste des manques — il n'y a pas de rapport séparé à livrer*
  - **analyse** — *aucun tri à faire : un registre est renseigné ou il ne l'est pas*
  - **plan-action** — *chaque manque appelle exactement un geste, jamais un arbitrage*
  - **questions** — *rien à trancher — les 10 registres sont obligatoires, sans exception*

### `integration-ronde` — Intégration d'un item à la Ronde périodique

- **Écrit dans** : `docs/integration-ronde-process-detail.md` · **surveillé par** : `scripts/circle-process-guardian.mjs`
- **Déclencheur** : ajouter, renommer ou retirer un item de la Ronde — jamais la même chose que faire entrer un outil dans l'Agence
- **5 étapes** : consultation → raccordements → pourquoi → tests → suivi
- **Schéma maître** : 5 maillon(s) absent(s), tous déclarés :
  - **scan** — *rien à mesurer : le contrôleur LIT les tables réelles de la Ronde et dit quels raccordements manquent*
  - **rapports** — *sa sortie EST le plan de raccordement — il n'y a pas de rapport séparé à livrer*
  - **analyse** — *aucun tri à faire : un raccordement est fait ou il ne l'est pas*
  - **plan-action** — *chaque manque appelle exactement un geste, jamais un arbitrage*
  - **questions** — *rien à trancher — les cinq raccordements sont obligatoires dès lors que l'item entre dans la Ronde*

### `xp-ia` — XP-IA-bonnes-pratiques-et-lecons

- **Écrit dans** : `docs/xp-ia-process-detail.md` · **surveillé par** : `scripts/angel-of-ia-process.mjs`
- **Déclencheur** : une leçon ou une bonne pratique apparaît dans le travail, et il faut qu'elle survive à la session puis qu'elle ressorte au moment où elle s'applique
- **8 étapes** : declencheur-questions → enregistrement → scan-du-registre → rapports → analyse-ronde → plan-action → taches → jugement-utilisateur
- **Schéma maître** : ✅ les six maillons sont présents.

### `etat-des-taches` — État des lieux des tâches (faites / en cours / à faire)

- **Écrit dans** : `docs/etat-des-taches-process-detail.md` · **surveillé par** : `scripts/check-tasks-details.mjs`
- **Déclencheur** : l'utilisateur demande un état des lieux des tâches, ou une expression équivalente
- **8 étapes** : branche → scan-recuperation → analyse → rapports → questions → plan-action → taches → enchainement
- **Schéma maître** : ✅ les six maillons sont présents.

## 4. Les emboîtements — quel schéma en contient un autre

Trois mécaniques, jamais confondues : **orchestre** (lance l'autre en entier) ·
**greffe** (s'insère à des moments à l'intérieur de l'autre) · **surveille** (vérifie sans exécuter).

```
meta               ── surveille ──> ronde, analyse-charte, simulation, semi-autonome, nuit, meta, integration-outil, integration-ronde, xp-ia, etat-des-taches
nuit               ── ORCHESTRE ──> ronde, simulation
semi-autonome      ── ORCHESTRE ──> ronde, analyse-charte, simulation, integration-outil, integration-ronde, etat-des-taches
ronde              ── contient ──> xp-ia
xp-ia              ── SE GREFFE SUR ──> ronde, analyse-charte, simulation, semi-autonome, nuit, integration-outil, integration-ronde, etat-des-taches
integration-outil  ── appelé depuis ──> semi-autonome, nuit
integration-ronde  ── appelé depuis ──> ronde, integration-outil
```

- **meta** surveille — le process maître vérifie que chaque process a son document, son contrôleur et ses sondes — y compris lui-même (selfCheck), parce qu'un surveillant que personne ne surveille dérive sans que rien ne le dise.
- **nuit** orchestre — la nuit n'a aucune mesure propre : elle fait tourner la Ronde en mode lourd et, si la périodicité le justifie, une simulation — puis traite leurs plans d'action.
- **semi-autonome** orchestre — un MODE n'est pas un travail : il décide de la façon d'enchaîner des process qui, eux, produisent quelque chose. D'où ses quatre maillons sans objet.
- **ronde** contient — l'analyse de période du process XP-IA se fait À la Ronde, et c'est là que l'utilisateur dit quelles leçons ont été réellement APPLIQUÉES.
- **xp-ia** greffe — ses trois moments déclencheurs (un garde-fou bloque, la fin d'un compte rendu, chaque Ronde) surviennent PENDANT n'importe quel autre process, jamais à sa place.
- **integration-outil** appele-depuis — jamais lancé pour lui-même : il se déclenche au milieu d'un travail, quand un outil neuf rejoint l'équipe.
- **integration-ronde** appele-depuis — même nature : il se déclenche quand un item entre dans la Ronde, typiquement parce qu'un outil vient d'être intégré.

## 5. Les deux extensions candidates — À TRANCHER, jamais appliquées d'office

*Statut : À TRANCHER — proposées le 2026-09-23, jamais appliquées sans l'arbitrage de l'utilisateur*

Le schéma maître va de SCAN à TÂCHES. Les huit maillons ci-dessous **existent déjà dans le
travail réel** et sont **déjà exigés par des Articles** — ils ne sont simplement pas dans le
schéma, donc rien ne vérifie qu'ils sont branchés.

**AMONT** — avant SCAN :

| Maillon | Ce que c'est | Déjà exigé par |
|---|---|---|
| **DÉCLENCHEUR** | ce qui fait partir ce process | le gabarit de process (EXIGENCES_GABARIT_PROCESS), mais pas le schéma |
| **CADRAGE** | demander quel process gouverne ce qu'on s'apprête à faire | Article 26 — « avant un gros travail, demander à god quel process s'applique » |
| **BUDGET** | consulter Smart Conso API / SMART-CONSO-TOKEN avant toute action coûteuse | Article 22 |
| **MÉMOIRE** | ressortir les leçons applicables et la mémoire des opérations AVANT d'agir | process XP-IA (maillon 4) ; le process analyse-charte porte déjà l'étape `memoire` |

**AVAL** — après TÂCHES :

| Maillon | Ce que c'est | Déjà exigé par |
|---|---|---|
| **EXÉCUTION** | la tâche est FAITE, pas seulement créée | RIEN — c'est le trou |
| **VÉRIFICATION** | y revenir à froid, avec les outils, pas de mémoire | Article 25 |
| **JUGEMENT PAR L'UTILISATEUR** | « c'est moi à la fin qui te dis si elle est propre » | process XP-IA (jugement-utilisateur, parUtilisateur: true) |
| **CAPITALISATION** | « y avait-il quelque chose à retenir ? » — « rien à retenir » étant une réponse pleine | process XP-IA, trois moments déclencheurs |

**Le constat qui les motive.** L'Article 28 a fermé « un rapport écrit ressemble à un problème
traité ». Personne n'a fermé la suite : **une tâche créée ressemble à un problème traité.**
La chaîne s'arrête au moment où elle inscrit la tâche, et ce qu'elle devient ensuite n'est
porté par aucun schéma.

**Le schéma étendu, si les deux bouts étaient retenus** *(14 maillons)* :

```
DÉCLENCHEUR >> CADRAGE >> BUDGET >> MÉMOIRE >> SCAN >> RAPPORTS >> ANALYSE >> PLAN D'ACTION >> QUESTIONS >> TÂCHES DE TRAVAIL >> EXÉCUTION >> VÉRIFICATION >> JUGEMENT PAR L'UTILISATEUR >> CAPITALISATION
```

## 6. Les activités à enjeu qui n'ont AUCUN process

- **Sonder le quota Gemini (Smart Breaker)** (`diagnostic-api`) — consomme de vrais appels pour un diagnostic ; lancé au mauvais moment, il aggrave le blocage qu'il mesure (Article 22)
- **Modifier CLAUDE.md ou un document de référence** (`livraison-charte`) — une règle affaiblie par erreur ne se voit pas — elle s'applique en silence pendant des semaines, et c'est le garde-fou non négociable de l'Article 13

## 7. Les tensions déclarées entre process

- **nuit ↔ simulation** — Le mode nocturne autorise à consommer de l'API sans validation ; le protocole de simulation exige une consultation préalable de Smart Conso API.
  - *Résolution :* Les deux tiennent ensemble : l'autorisation nocturne porte sur le fait de consommer, jamais sur le fait de sauter la consultation. Tranché par l'utilisateur le 2026-09-22 (« tu es quand meme autorisé à consommer des api, tout en respectant les conseils de smart conso api »).
- **nuit ↔ ronde** — La Ronde exige une vraie fenêtre à cocher posée à l'utilisateur ; le mode nocturne se déroule en son absence.
  - *Résolution :* Une Ronde lancée en nuit autonome est explicitement dispensée de cette fenêtre — exemption déjà codée dans le gardien de la Ronde, jamais une entorse improvisée.
- **nuit ↔ ronde** — La Ronde doit poser à l'utilisateur une fenêtre de réponses sur les points problématiques de son évaluation ; le mode nocturne se déroule en son absence.
  - *Résolution :* L'exemption nocturne est CONDITIONNELLE : les points problématiques sont reportés au prochain passage en sa présence (reporterPointsAuProchainPassage), jamais simplement sautés. Le gardien de la Ronde refuse une Ronde nocturne qui aurait des points à poser et n'aurait rien reporté.

## 8. Auto-contrôle de cette planche

✅ Tout process nommé dans un emboîtement existe réellement.

**Ce que cette planche ne dit PAS** : si un process est BON. Elle décrit des formes et des
liens ; juger qu'un process sert vraiment à quelque chose se lit, et se tranche avec l'utilisateur.
