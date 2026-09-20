# SMART-CONSO-TOKEN — instanciation pour Maison IA vivante

*(Cf. `docs/smart-conso-token-blueprint.md` pour le principe générique. Créé le 2026-09-20, à la
demande explicite de l'utilisateur, juste après avoir câblé Smart Conso API et LE-COORDINATEUR dans
le paysage — trois exemples concrets à éviter donnés par l'utilisateur : que l'agent lance des
actions coûteuses de façon autonome sans besoin réel, que l'utilisateur ne se rende pas compte d'un
pic de consommation récent, et que les outils du réseau consomment plus que ce que le besoin exprimé
justifie.)*

## Fiche d'identité (membre de l'équipe)

*(Ajoutée le 2026-09-20, à la demande explicite de l'utilisateur — même statut que Smart
Breaker/ARGUS/HARMONIA/LE-PLANIFICATEUR : un membre de l'équipe nommé, pas seulement un script
technique parmi d'autres.)*

- **Nom** : SMART-CONSO-TOKEN.
- **Rôle en une phrase** : conseillère en sobriété de contexte — repère les schémas connus coûteux
  en tokens Claude (agent séparé, lecture exhaustive, document toujours chargé) et propose des
  réductions concrètes, jamais une application automatique.
- **Catégorie CASSANDRA-RH (future)** : `scripts` — au même titre que Smart Breaker/ARGUS/HARMONIA,
  notée sur la pertinence de son poste et la qualité de son occupation, jamais un statut à part.
- **Domaine strict** : les TOKENS de l'agent lui-même (moi), jamais le texte envoyé à Gemini pour
  Lia/Noé (territoire exclusif de l'Article 8/0) ni les appels API réels (territoire de Smart
  Conso API, sa cousine directe).
- **Arrivée dans l'équipe** : 2026-09-20.
- **Ce qu'elle ne fait jamais** : s'auto-ajuster (validation humaine/agent systématique avant tout
  changement, cf. `classifyConsumption`), décourager un investissement sain de tokens, inventer un
  chiffre exact là où seule une estimation honnête est possible.

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
  constat honnête, pas une anomalie à corriger. **Écart réel trouvé et corrigé le 2026-09-21**
  (tâche #137, question directe de l'utilisateur sur les priorités de scan de l'équipe noyau, qui a
  aussi fait remonter ce point) : cette fonction, entièrement écrite et testée par fixtures, n'était
  jamais appelée nulle part en production — exactement le même angle mort que
  `check-profil-utilisateur.mjs`/`runNetworkCheck()` lui-même, corrigé le même soir. Câblée dans
  `runNetworkCheck()` (`le-coordinateur.mjs`), pour THE-FINAL-JUDGE (`docs/the-final-judge/index.md`)
  ET son cousin THE-DEEP-READER (`docs/suivi/relectures-lourdes/index.md`), jamais l'un sans l'autre —
  deux nouvelles lignes dans la synthèse gratuite, réellement exercées à chaque passage
  `runNetworkCheck()` (donc à chaque Ronde CIRCLE-TASKS qui coche l'item `network-check-run`).

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

## Apprentissage et auto-évaluation — version sécurisée (2026-09-20)

Demandé explicitement par l'utilisateur : « il enregistre la réponse effective de l'interlocuteur :
il agit conformément au conseil ou pas [...] il se rend compte s'il a fait des erreurs d'appréciation
[...] mécanisme d'apprentissage ». **Tension réelle signalée avant d'implémenter (Article 14)** :
la demande littérale (« se corrige de façon autonome ») romprait la règle déjà établie plusieurs
fois dans ce document et le blueprint (« jamais un ajustement automatique de ses propres seuils »).
Calibrée avec l'utilisateur en trois questions, résolue en **version sécurisée** :

- `recordAction()` conserve désormais **qui a reçu ce conseil** (`recipient` : `agent` par défaut,
  `outil`, ou `utilisateur`) et **le verdict rendu** par `assess()` pour cette action précise.
- `recordOutcome(actionType, at, outcome)` attache, une fois connu, le résultat RÉELLEMENT observé
  d'une action déjà confirmée (`sans_consequence` / `probleme_reel` / `confirme_utile`) — jamais
  deviné ni inféré automatiquement, seulement lu si quelqu'un l'a explicitement fourni.
- `diagnoseAdviceAccuracy(history, now)` repère mécaniquement deux familles de constats, jamais une
  correction : (1) un **seuil dur probablement non respecté** — une action confirmée du même type
  survenue trop vite (moins de 10 minutes par défaut) après un verdict `seuil_dur`, entièrement
  automatique, aucune saisie manuelle nécessaire ; (2) un **résultat enregistré qui contredit ou
  confirme un verdict passé** (un avertissement souple suivi d'un vrai problème confirme le
  classement "élevé" ; suivi d'aucune conséquence questionne, sans jamais trancher seul, ce
  classement ; un investissement reconnu qui s'avère non rentable pointe vers le contexte donné à
  `classifyConsumption()` à ce moment précis, jamais vers le critère lui-même).

**Portée volontairement limitée à l'agent et aux outils, jamais à l'utilisateur** (calibrage
explicite du 2026-09-20) : aucune trace mécanique fiable n'existe de ce que l'utilisateur décide de
son côté — les entrées `recipient:"utilisateur"` sont donc entièrement exclues du diagnostic, par
honnêteté plutôt que par une fausse précision.

**Ce qui NE change JAMAIS, même avec cette extension** : `diagnoseAdviceAccuracy()` ne modifie
aucun seuil, aucun classement, aucune logique de `assess()`/`classifyConsumption()` — chaque
constat reste une proposition à lire et à valider humainement/par l'agent, affichée aux moments
déjà existants (crochet post-commit, à côté du rythme et du bilan investissement), jamais une
nouvelle habitude à prendre ni un mécanisme d'ajustement autonome.

## Investissement vs consommation sans retour (2026-09-20)

Demandé explicitement par l'utilisateur : « il peut y avoir des "investissements" en token [...] il
ne faut pas qu'il décourage un investissement sain, qu'il vienne de moi, toi ou les outils [...] il
y a une mesure précise de la pertinence du besoin de conso de tokens ». `classifyConsumption()`
applique quatre critères vérifiables AU MOMENT de la dépense, jamais une prédiction littérale de
l'avenir :
- **`buildsReusableTool`** → `investissement` : construit un mécanisme qui tournera ensuite à coût
  nul pour le contexte de l'agent (automatisation mécanique, cf. `AUTOMATION_TOKEN_NUANCE`) — chaque
  réutilisation future rembourse le coût de construction.
- **`preventsFutureDebugging`** → `investissement` : une vérification/un audit avant un changement
  risqué, moins cher que de découvrir et corriger le même problème plus tard, potentiellement sur
  plusieurs sessions.
- **`isDuplicateOfRecent`** → toujours `sans_retour`, prioritaire sur les deux signaux positifs
  ci-dessus (principe anti-doublon déjà établi ailleurs dans ce projet).
- **`scopeMatchesNeed`** (faux) → `sans_retour` : le palier choisi dépasse la taille réelle du
  besoin exprimé — le SURPLUS de coût ne rapporte rien, même avec une intention par ailleurs saine.

La "mesure précise de la pertinence" demandée est ce verdict catégorique (`investissement` /
`sans_retour` / `a_evaluer`) accompagné de sa raison explicite — jamais un faux score numérique
inventé sans base réelle pour le mesurer, même honnêteté que le reste de l'outil.

`assess()` reflète cette classification sans jamais la laisser court-circuiter l'autorité déjà
posée : un investissement reconnu transforme un `avertissement_souple` en `investissement_reconnu`
(poursuite recommandée, jamais découragée à tort) ; mais un `seuil_dur` déjà atteint reste TOUJOURS
non négociable (Article 22) — la classification informe la question obligatoire à l'utilisateur
ouverte à ce seuil, elle ne la remplace ni ne la contourne jamais (même principe que Smart Conso
API : informe, ne tranche jamais).

`computeInvestmentRatio()` rapporte, sur l'historique réellement classifié (`recordAction(...,
classification)`), la part réelle d'investissement vs sans-retour sur une fenêtre glissante —
affiché au même endroit que le rythme (`summarizeHistory`), dans le crochet post-commit, pour que
l'utilisateur et l'agent voient les deux ensemble. Jamais une estimation rétroactive sur des actions
passées sans classification.

## KPI

Le bilan investissement (`computeInvestmentRatio`) rejoint le rythme comme premier indicateur
concret de l'utilité réelle de l'outil — pas encore raccordé au tableau de bord général, même
raisonnement que Smart Conso API à sa naissance.

## CLAUDE.MD.SPY — classification par Article, réutilisée à l'étape 2 ci-dessous

*(Extension de SMART-CONSO-TOKEN, jamais un membre de l'équipe à part — un script utilitaire de
plus dans `scripts/smart-conso-token.mjs`, cf. `docs/regles-de-travail.md` §7ter pour la
distinction Agent/Utilitaire nommé/Infrastructure. Conçu le 2026-09-20 à la demande explicite de
l'utilisateur : classer chaque règle de CLAUDE.md par sensibilité/importance, détecter les
redondances possibles, pour accélérer l'étape 2 de la procédure formalisée ci-dessous.)*

`extractRuleUnits(claudeMdText)` découpe CLAUDE.md en une unité par « Article N », bornée soit par
l'Article suivant, soit par le prochain titre de niveau 2 (`## `) — jamais par la seule présence
d'un autre Article, un vrai bug trouvé en calibrant contre le fichier réel (le dernier Article
avalait sinon les 510 lignes du « Plan d'origine » qui suit). `classifyRuleSensitivity()` donne à
l'Article 0 une étiquette FIXE « très sensible », jamais recalculée (décision explicite) ; les
autres Articles ne sont marqués « sensible » que sur un marqueur auto-déclaré explicite (« non
négociable », etc.), jamais deviné. `classifyRuleImportance()` compte les citations croisées
(« Article N ») dans le reste du dépôt via `countArticleCrossReferences()`, avec des seuils
calibrés empiriquement sur la vraie distribution de ce projet (3 à 81 citations), pas des seuils
ronds arbitraires. `findRedundantRulePairs()` signale deux Articles au vocabulaire significatif très
proche (indice de Jaccard ≥ 0.22, seuil strict — peu de faux positifs plutôt que beaucoup de bruit,
calibrage explicite) — un signal à vérifier, jamais une certitude de doublon.

**Fichier de référence unique.** `buildClaudeMdRuleTable()`/`renderClaudeMdRuleTable()` assemblent
et rendent le tout dans **`docs/referentiel/claude-md-regles.md`** — un seul fichier tenu à jour
(décision explicite : jamais un dossier + index séparé comme le reste du paysage, cette
classification n'a pas de valeur historique à conserver dans le temps, seulement un état courant).
Régénéré à la demande, typiquement juste avant l'étape 2 ci-dessous, via :

```
node -e "import('./scripts/smart-conso-token.mjs').then(async (m) => { /* cf. l'implémentation du
script pour le balayage complet de scripts/, lib/, docs/ */ })"
```

(le balayage complet de `otherFilesText`, nécessaire pour `countArticleCrossReferences()`, vit
directement dans la commande de génération plutôt que comme une fonction exportée séparée — un
utilitaire ponctuel, pas un mécanisme continu).

**Câblé dans CIRCLE-TASKS** (`claude-md-weight-signal`, cf. section dédiée plus bas) : le signal de
poids affiche désormais aussi, quand `findRedundantRulePairs()` en trouve un, le meilleur candidat
de redondance détecté — jamais un second calcul séparé, la même fonction pure réutilisée.

## Procédure formalisée : allègement périodique de CLAUDE.md (`charter_size_tax`)

*(Ajoutée le 2026-09-20, à la demande explicite de l'utilisateur, juste après le premier exercice
réel d'allègement de CLAUDE.md (tâches #122 et Part A) : « prevois que l'allegement de claude.md
peut devenir une tache recurrente [...] fais en sorte que cette tache soit formalisée pour la
prochaine fois avec les objectifs et la methode ».)*

**Objectif.** Réduire le poids en tokens de CLAUDE.md (fichier toujours chargé, payé à CHAQUE
message de session) SANS jamais perdre une règle opérationnelle — seule la justification narrative
("ajouté le X, demande explicite : citation Y") est déplacée vers un document lu à la demande,
jamais la règle elle-même. Déclenché quand `claude-md-weight-signal` (CIRCLE-TASKS, cf.
`scripts/circle-tasks.mjs`) rapporte un niveau "élevé" (≥5000 tokens estimés) ou un nombre
significatif de nouvelles asides datées détectées.

**Garde-fou non négociable, écrit dans CLAUDE.md lui-même (2026-09-20, à la demande explicite de
l'utilisateur : « jamais un allegement de claude.md ne doit entamer la qualité ou les
fonctionnalités du projet [...] mets un garde fou formulé par tes soins »)** : le poids en tokens
n'est JAMAIS un critère qui l'emporte sur le contenu. En cas de doute réel sur si un retrait
affaiblirait une règle, la réponse par défaut est de NE PAS couper, jamais de trancher par excès de
prudence inverse (tout garder par peur de mal faire serait tout aussi contraire à l'esprit de cette
procédure — la bonne réponse est un jugement explicite au cas par cas, jamais un réflexe dans un
sens ou dans l'autre). Ce garde-fou n'est pas qu'une déclaration d'intention : les étapes 5
(vérification) et 6 (documentation) ci-dessous en sont la mise en œuvre concrète — un allègement
qui casse `check-house.mjs`/`tsc`, ou dont le gain n'est pas honnêtement mesuré et documenté, n'est
jamais considéré terminé, quel que soit le nombre de tokens économisés.

**Méthode, en 6 étapes, reproduites du premier exercice réel :**

1. **Scanner** : `scanScope('zoome', { 'CLAUDE.md': texte }, new Set(['CLAUDE.md']))` — jamais un
   `Map`, l'implémentation attend un objet simple (cf. commentaire corrigé dans le code le
   2026-09-20). Note le nombre de tokens estimés (heuristique 4 caractères/token, JAMAIS présentée
   comme un compte exact) et la liste des asides datées via `listDatedNarrativeMarkers()`.
2. **Identifier les candidats, jamais à l'aveugle** : deux familles distinctes. (a) Les gros blocs
   narratifs identifiés par lecture humaine/agent (comme le bloc « Smart Breaker » — récit de
   diagnostic, historique d'évolutions) : toujours les plus gros gisements, mais nécessitent une
   vraie lecture pour juger ce qui est règle vs récit. (b) Les asides datées courtes, détectées
   mécaniquement par `listDatedNarrativeMarkers()` : plus nombreuses, plus sûres (regex déjà
   éprouvé), mais chacune doit être relue individuellement — **au moins une aside sur 26, dans le
   premier exercice réel, contenait un vrai principe opérationnel** (pas seulement de la couleur) :
   ne jamais retirer en bloc sans relire chaque cas.
3. **Trier, jamais tout couper pareil** : pour chaque candidat, décider si l'aside est (i) pure
   couleur narrative (date + citation, aucune règle nouvelle) → retirer entièrement ; (ii) contient
   un principe réutilisable → le reformuler et le garder dans CLAUDE.md, déplacer seulement la
   genèse narrative.
4. **Archiver, jamais perdre l'information** : tout contenu retiré rejoint un fichier compagnon dans
   `docs/referentiel/` (ex. `smart-breaker-historique.md` pour un gros bloc, un fichier dédié type
   `claude-md-asides-historique.md` pour un lot d'asides courtes) — jamais supprimé sans trace
   (Article 6/13). Un pointeur d'une ligne dans CLAUDE.md indique où retrouver le récit complet.
5. **Vérifier, jamais supposer** : `node scripts/check-house.mjs` (123/123 attendu) et
   `npx tsc --noEmit` (propre, hors l'erreur préexistante connue de `vite.config.ts`) après CHAQUE
   lot de retraits, jamais seulement à la fin. Re-scanner avec `scanScope`/`estimateTokens` pour
   mesurer le gain RÉEL, jamais une estimation a priori.
6. **Documenter et livrer** : nouvelle entrée `lib/reference.ts` (Version N), ligne `docs/suivi/`
   avec les chiffres avant/après honnêtes, mise à jour de l'assertion `Version N` dans
   `check-house.mjs`, commit + push. Rapporter à l'utilisateur le vrai delta mesuré (tokens estimés
   et lignes), jamais un chiffre annoncé avant d'avoir mesuré.

**Limite honnête sur la mesure elle-même** (trouvée en pratique le 2026-09-20) : l'estimation
`estimateTokens()` (4 caractères/token) est une heuristique généraliste, pas le tokenizer réel de
Claude — un écart entre cette estimation et un chiffre observé ailleurs (ex. l'indicateur de poids
de fichier de l'interface Claude Code elle-même) est normal et attendu, jamais un signe d'erreur de
calcul à corriger. Ne jamais présenter le nombre de `estimateTokens()` comme une mesure exacte.

**Limite mécanique connue** : `listDatedNarrativeMarkers()` ne détecte pas les asides contenant une
parenthèse imbriquée (ex. « (16 au 19 septembre) » à l'intérieur de l'aside) — deux cas identifiés à
l'œil lors du premier exercice, non traités, documentés dans
`docs/referentiel/claude-md-asides-historique.md`. Une future évolution du regex pourrait combler
ce point, jamais appliquée sans une nouvelle demande explicite.

**Sous-agent dédié ? Non — décision motivée.** Cette tâche ne justifie PAS un sous-agent séparé : le
coût fixe d'un agent séparé (~37 000 tokens, `agent_subagent_spawn`) s'ajouterait à un travail que
l'agent principal effectue déjà à coût nul (il a déjà tout le contexte du fichier et de son
historique, contrairement à THE-FINAL-JUDGE qui a explicitement BESOIN d'un regard neuf et
indépendant). Un sous-agent ici ajouterait un coût fixe sans aucun bénéfice de perspective
indépendante — l'exact anti-patron que SMART-CONSO-TOKEN existe pour repérer. La bonne unité de
travail reste l'agent principal suivant cette procédure, déclenché par le signal CIRCLE-TASKS
ci-dessus.

## Arbitrage entre chantiers concurrents — `compareChantiers()` (2026-09-21)

Tâche #135, demandée explicitement pendant la conception de CASSANDRA-RH : « SMART-CONSO-TOKEN doit
aussi pouvoir arbitrer entre plusieurs chantiers concurrents, pas seulement juger une action isolée ».
`compareChantiers(candidates)` prend une liste de candidats déjà munis de leur propre coût estimé
(calculé ailleurs — `estimateTokens()`, un chiffre déjà connu — jamais un second calcul ici) et de
leurs propres signaux déjà connus (staleness CLEAN-DIRTY-OLD, priorité explicite du suivi, etc.,
fournis tels quels par l'appelant) : elle AGRÈGE et PRÉSENTE côte à côte (total, table via
`formatChantierComparison()`), jamais ne choisit lequel traiter en premier — même discipline
"informe, jamais ne décide" que `classifyConsumption()`/`assess()`. Volontairement minimal : aucune
tentative de calculer une "valeur" par chantier (un chantier bon marché mais peu utile ne doit jamais
être présenté comme automatiquement préférable à un chantier coûteux mais important) — ce jugement
reste toujours humain/agent, jamais un score fabriqué qui prétendrait le remplacer.

## Rendre SMART-CONSO-TOKEN proactif — `ARCHIVE_FIRST_REMINDER` (2026-09-21)

Tâche #136. Généralisation actée d'une précision réelle trouvée pendant le chantier 3 (loveRealized) :
l'agent avait répondu à une question par calcul et lecture des simulations déjà archivées, sans
jamais relancer quoi que ce soit — l'utilisateur a demandé que ce réflexe devienne systématique
plutôt que redécouvert au cas par cas (« avant de recommander/lancer une simulation coûteuse, vérifier
d'abord si les données déjà archivées répondent à la question »). Jamais une détection automatique
(aucun moyen mécanique de savoir si une archive répond VRAIMENT à une question précise) : un rappel
textuel fixe, `ARCHIVE_FIRST_REMINDER`, appended par `assess()` à tout verdict `avertissement_souple`
ou `seuil_dur` (jamais à un verdict `ok`, qui ne pèse rien de coûteux). Portée volontairement limitée
à ce rappel simple — la reformulation plus ambitieuse du #136 ("suggérer une priorité" entre
plusieurs actions à venir) rejoint plutôt `compareChantiers()` ci-dessus une fois plusieurs candidats
réellement en concurrence, jamais un second mécanisme séparé pour la même idée.

## Audit de fiabilité — tâche #137 (2026-09-21)

« Auditer et fiabiliser l'exploitation de Smart Conso API/SMART-CONSO-TOKEN partout où la charte
l'exige. » Vérifié point par point plutôt que supposé : `checkToolConnections()`/`EXPECTED_CONNECTIONS`
(le test de connexion documentaire) est déjà réellement fiable — vérifié EN DIRECT et BLOQUANT
(pre-commit, `check-house.mjs`) contre les vrais fichiers du dépôt, aucun écart trouvé. Smart Conso
API a son équivalent (`findUnconfirmedBursts()`) déjà réellement câblé dans `runNetworkCheck()`.
Le seul vrai trou trouvé : `findJudgeSpawnsWithoutConsultation()` (SMART-CONSO-TOKEN, autorité réelle
sur THE-FINAL-JUDGE/THE-DEEP-READER) n'était jamais appelée en production — corrigé, cf. section
"Autorité réelle" plus haut. **Non traité, laissé explicitement en file** : `#138` (accompagnement en
temps réel d'une tâche longue) reste trop ouvert pour être implémenté sans calibrage — quel signal
déclencherait une relance en cours de tâche, sous quelle forme, à quelle fréquence, sont des choix
réels qui appartiennent à l'utilisateur, jamais devinés (Article 16).

**Rattaché à CIRCLE-TASKS.** `claude-md-weight-signal` (thème "Qualité du code") relit CLAUDE.md et
appelle en direct `scanDocumentWeight()`/`listDatedNarrativeMarkers()` — jamais un second calcul,
jamais une estimation périmée issue d'un index séparé. Voir `scripts/circle-tasks.mjs` pour
l'implémentation.
