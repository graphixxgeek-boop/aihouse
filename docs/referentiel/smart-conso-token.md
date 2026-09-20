# SMART-CONSO-TOKEN — instanciation pour Maison IA vivante

*(Cf. `docs/smart-conso-token-blueprint.md` pour le principe générique. Créé le 2026-09-20, à la
demande explicite de l'utilisateur, juste après avoir câblé Smart Conso API et LE-COORDINATEUR dans
le paysage — trois exemples concrets à éviter donnés par l'utilisateur : que l'agent lance des
actions coûteuses de façon autonome sans besoin réel, que l'utilisateur ne se rende pas compte d'un
pic de consommation récent, et que les outils du réseau consomment plus que ce que le besoin exprimé
justifie.)*

## Ce qui existe aujourd'hui

- **`scripts/smart-conso-token.mjs`** — le canal de consultation. Usage :
  `node scripts/smart-conso-token.mjs <type-d'action> [--confirm] [--identity=claude-sonnet-5] [--context="..."]`.
  Sans `--confirm`, affiche seulement un avis. Avec `--confirm`, enregistre l'action dans
  `.smart-conso-token-history.json` (local, jamais committé, comme les carnets voisins).
- **`KNOWN_COSTLY_PATTERNS`** — registre des schémas reconnus comme coûteux pour Claude (recherche
  réelle du 2026-09-20, sources ci-dessous) : `agent_subagent_spawn` (le plus coûteux — un agent
  séparé démarre avec ~37 000 tokens de contexte à froid, dont ~3% seulement concerne la tâche
  réelle), `full_repo_scope` (lecture exhaustive du dépôt), `charter_size_tax` (le poids de
  `CLAUDE.md`, relu à chaque message), `large_archive_read` (transcript/journal volumineux).
- **`measureClaudeMdWeight()`** — estimation grossière (≈4 caractères/token, jamais un vrai
  compteur) de la taille de `CLAUDE.md`, classée selon le même benchmark que ci-dessous.
- **`checkKnowledgeFreshness()`** — compare l'identité déclarée de l'agent courant à
  `KNOWLEDGE_PROVENANCE.validatedFor` ("claude", recherche du 2026-09-20). Un désaccord (ex. un
  futur agent "codex") est signalé explicitement, jamais silencieusement ignoré — cf. blueprint.
- **`docs/smart-conso-token/`** — dossier des décisions archivées + `index.md`.

## Sources de la recherche du 2026-09-20 (à revalider si le modèle change, cf. blueprint)

- [12 Ways to Cut Token Consumption in Claude Code](https://www.firecrawl.dev/blog/claude-code-token-efficiency)
- [How to Manage Claude Code Token Usage: 10 Techniques](https://www.mindstudio.ai/blog/how-to-manage-claude-code-token-usage)
- [Why Claude Code Sub-Agents Cost 7x More Tokens](https://www.mindstudio.ai/blog/claude-code-subagents-cost-tokens)
- [Introducing advanced tool use on the Claude Developer Platform (Anthropic)](https://www.anthropic.com/engineering/advanced-tool-use)

## Trois destinataires régulés, calibré explicitement le 2026-09-20

1. **L'agent** — avant `agent_subagent_spawn`, `full_repo_scope`, ou tout passage de raisonnement
   coûteux (ALWAYS-NEW-CODE, CLEAN-DIRTY-OLD).
2. **L'utilisateur** — quand sa propre demande implique naturellement une action lourde, l'agent le
   signale avant de foncer plutôt que d'exécuter en silence.
3. **Les autres outils** — THE-FINAL-JUDGE et HYPER-SCAN-CHECKPOINT (version complète) consultent
   désormais SMART-CONSO-TOKEN en plus de Smart Conso API avant de se lancer (les deux appellent un
   agent séparé, le schéma le plus coûteux du registre) ; ALWAYS-NEW-CODE et CLEAN-DIRTY-OLD le
   consultent aussi malgré l'absence d'appel Gemini, puisqu'un raisonnement coûteux consomme des
   tokens indépendamment de toute API tierce.

## Obligation écrite dans la charte, jamais un garde-fou mécanique après coup

Calibré explicitement le 2026-09-20 (question posée, réponse de l'utilisateur : « règle stricte
écrite dans la charte ») : contrairement à Smart Conso API, aucun garde-fou ne peut vérifier après
coup si cette consultation a bien eu lieu (pas de trace externe indépendante, cf. blueprint). La
protection est donc une règle explicite et non négociable — cf. CLAUDE.md, section dédiée sous
l'Article 22 — jamais une promesse de détection automatique d'un oubli.

## Visibilité du rythme — calibré explicitement le 2026-09-20

Question posée : à quel moment le rythme récent doit-il être visible pour que l'utilisateur (et
l'agent) s'en rendent compte ? Réponse : **aux moments déjà existants**, jamais une nouvelle
habitude à ajouter. `summarizeHistory()` est donc affiché :
- dans le crochet `post-commit` (`scripts/hooks/check-last-commit.mjs`), juste à côté du menu des
  prestations LE-COORDINATEUR — les deux vus ensemble à chaque commit, jamais l'un sans l'autre ;
- dans `runNetworkCheck()` de LE-COORDINATEUR lui-même, pour le passage manuel complet.

Limite honnête assumée : un rythme qui s'emballe pendant une longue plage de travail SANS commit
entre-temps ne sera vu qu'au prochain commit, pas en temps réel — cf. blueprint, même limite que
l'absence de compteur externe.

## Seuil dur proposé (2026-09-20, PAS ENCORE validé — laissé "proposé" à la demande explicite de l'utilisateur)

**`agent_subagent_spawn` : 3 appels confirmés par fenêtre glissante de 2 heures.** Choisi par
analogie avec le schéma le plus coûteux du registre — à ajuster une fois l'expérience réelle
accumulée, exactement comme le seuil de Smart Conso API à sa création.

## Frontière avec Smart Conso API

Même famille, ressources différentes : Smart Conso API régule un quota externe sondable (Gemini),
SMART-CONSO-TOKEN régule une ressource interne non sondable (les tokens de l'agent lui-même). Les
deux se consultent en parallèle sur les mêmes actions coûteuses (THE-FINAL-JUDGE,
HYPER-SCAN-CHECKPOINT) — jamais fusionnés en un seul script, natures de données trop différentes
(Article 3).

## Affinement du scan (2026-09-20) — chaque résultat correspond à une action possible

Demandé explicitement après un premier scan jugé pas assez actionnable (il traitait `CLAUDE.md` et
les 5 autres documents volumineux comme équivalents). `scanDocumentWeight()`/`scanScope()` prennent
désormais un signal `alwaysLoaded` : seul `CLAUDE.md` l'est réellement dans ce projet (relu à chaque
message) — les résultats sont scindés en **ACTION REQUISE** (documents toujours chargés au-delà du
repère, avec une piste concrète) et **INFORMATIF SEULEMENT** (documents lus à la demande, taille
normale, aucune action). `countDatedNarrativeMarkers()` ajoute un point de départ mécanique sûr :
compte les asides narratives datées (`*(ajouté le 2026-09-XX, ...)*`), déjà explicitement
historiques donc de bonnes premières candidates pour une restructuration — jamais une preuve
complète, une vraie lecture reste seule capable de trier le reste (Article 19).

## Autorité réelle — trois relations, jamais confondues (2026-09-20)

Demandé explicitement par l'utilisateur : « comment son autorité est réglée avec toi/moi/les
outils ? ». Trois relations de nature différente, jamais un seul mécanisme :
- **Avec l'utilisateur** : contraignante au seuil dur — une vraie fenêtre de question s'ouvre
  obligatoirement avant de continuer, jamais un blocage silencieux.
- **Avec l'agent** : à deux niveaux, jamais un troisième inventé. Seuil "ok"/"souple" = purement
  consultatif, l'agent garde sa décision mais doit justifier explicitement s'il passe outre (jamais
  un silence). Seuil "dur" = contraignant, l'obligation d'ouvrir une fenêtre de question retire la
  discrétion de l'agent à ce palier précis — écrit noir sur blanc dans la charte (nouvelle section
  sous l'Article 22), jamais un garde-fou mécanique vérifiable après coup (aucune preuve externe
  n'existe pour un appel d'agent séparé EN GÉNÉRAL).
- **Avec les autres outils** : jamais une autorité directe (un script ou un agent ponctuel n'a pas
  de volonté propre à qui donner un ordre) — l'obligation vit dans la définition même de CHAQUE
  outil coûteux (THE-FINAL-JUDGE, HYPER-SCAN-CHECKPOINT, ALWAYS-NEW-CODE citent explicitement
  SMART-CONSO-TOKEN dans leur propre protocole, cf. leurs instanciations respectives) — jamais une
  règle externe qu'il faudrait se souvenir de recroiser. **Rendu vérifiable après coup pour la
  première fois le 2026-09-20** : `findJudgeSpawnsWithoutConsultation()` compare l'historique local
  au registre ARCHIVÉ de THE-FINAL-JUDGE (`docs/the-final-judge/index.md`) — un rapport archivé est
  en lui-même la preuve externe et indépendante qu'un agent séparé a réellement été appelé, exactement
  le type de preuve qui manquait pour un appel d'agent ad hoc. Premier audit réel : le passage du
  2026-09-20 (antérieur à la création de cet outil) n'a logiquement aucune consultation associée —
  constat honnête, pas une anomalie à corriger.

## Nuance sur l'automatisation elle-même (2026-09-20)

Demandé explicitement : « est-ce que d'un autre côté, l'utilisation des outils peut économiser des
tokens, car automatisés ? ». Réponse à double sens, jamais une généralité, formalisée dans
`AUTOMATION_TOKEN_NUANCE` : l'automatisation MÉCANIQUE (ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD,
LE-COORDINATEUR) tourne dans un processus séparé à coût NUL pour le contexte de l'agent — un vrai
gain net face à l'équivalent manuel (relire tout le code à la main coûterait, lui, de vrais tokens).
L'automatisation PAR AGENT SÉPARÉ (THE-FINAL-JUDGE, HYPER-SCAN-CHECKPOINT complet) n'économise
JAMAIS de tokens — elle ajoute un coût fixe (~37k) en plus de ce qui a déjà été dépensé, justifié
seulement par un besoin réel de regard indépendant, jamais par l'idée fausse que l'automatisation
serait gratuite en soi. Question que l'outil doit maîtriser pour décider de l'allocation des
ressources, pas une simple curiosité.

## Test de connexion (2026-09-20) — vérifie mécaniquement, jamais sur parole

Demandé explicitement : « smart conso token a un test de connexion dédié à tous les autres outils,
ainsi qu'à toi ». `checkToolConnections()` + `EXPECTED_CONNECTIONS` vérifient, contre les VRAIS
fichiers du dépôt (jamais un exemple synthétique seul), que chaque document censé citer
SMART-CONSO-TOKEN le fait réellement : `CLAUDE.md` (la connexion à l'agent lui-même) et les
instantiations de THE-FINAL-JUDGE/HYPER-SCAN-CHECKPOINT/ALWAYS-NEW-CODE (la connexion à chaque outil
coûteux). Testé dans `check-house.mjs` avec une vérification bloquante en direct — casse le
pre-commit hook le jour où l'un de ces quatre documents perdrait sa référence.

## Base de données exploitée de façon autonome (2026-09-20)

Demandé explicitement : « il enrichit une base de données qu'il exploite de façon autonome pour
nourrir la qualité de ses conseils ». `.smart-conso-token-history.json` grossit à chaque action et
chaque scan confirmés ; `trackWeightTrend()` compare AUTOMATIQUEMENT le total du scan le plus
récent au scan précédent et rapporte une amélioration/dégradation/stabilité réelle dans le rapport
archivé — jamais un ajustement silencieux de ses propres seuils (cf. blueprint), seulement un fait
observé qui nourrit la lecture humaine/agent du résultat.

## Apprentissage et auto-évaluation — pas encore en place

Prématuré à ce stade (outil créé le jour même, zéro historique réel). Revenir ici une fois plusieurs
consultations accumulées pour observer si le rythme enregistré éclaire effectivement une décision
future (jamais un ajustement automatique des seuils, cf. blueprint).

## KPI

Pas encore raccordé au tableau de bord général — même raisonnement que Smart Conso API à sa
naissance.
