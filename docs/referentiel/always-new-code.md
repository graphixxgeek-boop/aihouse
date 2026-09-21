# ALWAYS-NEW-CODE — instanciation pour Maison IA vivante

*(Cf. `docs/always-new-code-blueprint.md` pour le principe générique. Créé le 2026-09-19, nommé par
l'utilisateur lui-même — rend concret l'Article 7 de `CLAUDE.md` ("l'épreuve de la page blanche"),
formalisé en Article 23.)*

## Ce qui existe aujourd'hui

- **`scripts/always-new-code.mjs`** — la préparation, gratuite, zéro appel réseau : `THEMES`
  (les 8 zones), `recommendZone()` (rotation intelligente ou demande explicite), les indices
  mécaniques d'empilement (`countDatedAddenda`/`addendaSignal`, `parseNumstat`/`churnSignal`), et
  le suivi KPI (`alwaysNewCodePerformance`). La couche "zoom profond" elle-même (imaginer la
  structure idéale, comparer, classer les trouvailles) est un raisonnement que seul l'agent
  appelant peut faire — jamais réimplémentée dans ce script, même logique que la checklist
  qualitative d'HYPER-SCAN-CHECKPOINT.
- **`docs/always-new-code/`** — dossier des passages archivés + `index.md` (mémoire de couverture
  pour la rotation, et suivi KPI).

## Statut : Gardien sacré du code (couche légère seulement, 2026-09-21)

Demande explicite de l'utilisateur : « On devrait avoir une version legere de always new code qui
tourne à chaque commit : always new est un gardien à mon sens » puis confirmé « OK pour always code :
on l'integre tout de suite en gardien sacré [...] integration complete ». Promu sixième Gardien
sacré du code (Article 20, `docs/referentiel/organisation-agence.md` §3) — mais SEULE la couche
légère décrite ci-dessus (`recommendZone()`/`addendaSignal()`/`churnSignal()`, zéro raisonnement)
porte ce statut, jamais le vrai zoom profond, qui exige un raisonnement payant et reste hors des
Gardiens par construction (le critère double de l'Article 20 l'exclut structurellement, cf.
`organisation-agence.md` §3, correction du 2026-09-21 sur la portée exacte de cette exclusion).

Câblage réel, suivant exactement le même « Répertoire des fonctionnements spécifiques partagés par
tous les Gardiens » (`organisation-agence.md` §3) que les 5 autres :
1. **Post-commit** (`scripts/hooks/check-last-commit.mjs`) — calcule `recommendZone()` sur
   `docs/always-new-code/index.md`, puis `addendaSignal(countDatedAddenda(...))`/
   `churnSignal(parseNumstat(...))` sur le SEUL fichier principal (`THEME_PRIMARY_FILE`) de la zone
   recommandée — jamais un balayage de tout le dépôt à chaque commit, coût minime comme
   CLEAN-DIRTY-OLD. Signale un indice PROBABLE d'empilement, jamais une preuve.
2. **CIRCLE-TASKS** — l'ancien item `always-new-code-signal` (surface la zone la plus négligée) a
   été RETIRÉ le 2026-09-21, devenu redondant avec le signal post-commit automatique — même
   précédent que `clone-hunter-run` retiré à la promotion de CLONE-HUNTER. `CIRCLE_EXCLUDED_REGISTRIES`
   documente la raison.
3. **`check-house.mjs`** — bloc de test dédié (fixtures + garde-fous du critère « OK 100% »
   exigeant les 6 Gardiens ensemble).
4. **Badge** (`checkAgentOnboarding()`) — nouveau paramètre `alwaysNewCodeFlagged`, alimente
   `koParts` (« KO ALWAYS-NEW-CODE ») exactement comme les 5 autres.
5. **HYPER-SCAN-CHECKPOINT** — déjà câblé de longue date (`sh("node scripts/always-new-code.mjs")`),
   aucun changement nécessaire à cette promotion.
6. **Validation croisée informelle** — inchangé, aucun mécanisme automatique.
7. **Aucun coût API/agent séparé** — la couche légère seule est concernée ; le vrai zoom reste, lui,
   un raisonnement à consulter via SMART-CONSO-TOKEN avant tout lancement, inchangé par cette
   promotion.

## Les 8 zones — réutilisées d'HARMONIA, jamais un second découpage

Décision explicite de l'utilisateur (2026-09-19) : les zones d'ALWAYS-NEW-CODE sont exactement les
8 "grands thèmes" de la carte de dépendances d'HARMONIA (`docs/referentiel/harmonia.md`) — Fatigue,
Cycle jour/nuit, Enquête, Bonus roulette, Appréciation de l'observateur, Dossier retourné,
Déplacements/espace, Relation Lia/Noé. Toute évolution de cette liste doit rester synchronisée
entre les deux documents (Article 13). `THEME_PRIMARY_FILE` associe à chaque zone un fichier
principal pour l'indice git — approximatif et honnêtement incomplet (plusieurs fichiers touchent
souvent le même thème), à affiner avec l'usage réel comme les signaux de CHECK-LEVEL-TARGET.

## Toujours deux temps : survol puis zoom

Décision explicite de l'utilisateur : jamais un zoom direct sur une zone choisie à l'avance sans
survol préalable. Le survol léger (vue d'ensemble des grands axes) sert de boussole pour savoir où
creuser ; le zoom profond (le vrai travail "page blanche") ne porte que sur la zone ainsi
repérée — ou sur une zone explicitement demandée, ou sur la zone la plus négligée par la rotation.

## Déclenchement — via CHECK-LEVEL-TARGET, niveau Exceptionnel

Décision explicite de l'utilisateur : « l'outil check-level-target trouve ici sa vocation
profonde ». ALWAYS-NEW-CODE reste au niveau "Exceptionnel" de CHECK-LEVEL-TARGET, aux côtés
d'HYPER-SCAN-CHECKPOINT (jamais un 5ᵉ niveau séparé) — `scripts/check-level-target.mjs` reconnaît
désormais des signaux dédiés à la restructuration ("reconstruire depuis zéro", "grands axes",
"code empilé", "restructurer"...), distincts des signaux de vérification de bugs déjà en place, et
recommande le tool adapté selon lequel des deux registres est détecté (ou les deux). En cas de
doute réel (marge étroite, ou signaux mêlés), l'agent interroge l'utilisateur avant de lancer quoi
que ce soit — jamais un choix silencieux. **Depuis le 2026-09-20** : consulter
`scripts/smart-conso-token.mjs full_repo_scope` avant de lancer le zoom profond sur une zone (un
raisonnement coûteux consomme des tokens indépendamment de tout appel Gemini, cf.
`docs/referentiel/smart-conso-token.md`).

## Rejoint la boîte à outils d'HYPER-SCAN-CHECKPOINT

Décision explicite de l'utilisateur : quand une vérification exceptionnelle complète est demandée,
elle peut désormais inclure un passage ALWAYS-NEW-CODE sur les zones les plus concernées, en plus
d'ARGUS/HARMONIA/check-house.mjs déjà orchestrés.

## Jamais une application automatique — toujours portée + temps + confirmation

Décision explicite de l'utilisateur, plus stricte que le blueprint générique par défaut : à chaque
proposition de restructuration, l'agent précise TOUJOURS l'étendue exacte du travail et le temps
estimé, et interroge TOUJOURS l'utilisateur avant d'exécuter quoi que ce soit — jamais de seuil
"petit changement sans risque" appliqué sans confirmation, même pour un renommage.

## Jamais un résultat "exact à 100 %"

Précisé explicitement le jour de la conception (question directe de l'utilisateur, réponse
négociée) : même avec un budget de temps/raisonnement illimité, ALWAYS-NEW-CODE ne peut pas
promettre l'exactitude absolue — une proposition de restructuration reste un jugement architectural.
Les trouvailles sont donc toujours rendues avec un palier de confiance (confirmé / probable / à
surveiller, même vocabulaire qu'ARGUS), jamais une certitude absolue. Le découpage en zones sert
autant la fiabilité que le budget : une analyse superficielle de tout le projet vaudrait moins
qu'une analyse profonde d'une zone.

## Le garde-fou trottoirGranted — vérifier avant de qualifier d'"empilé"

Leçon retenue le jour même de la conception de cet outil (cf. `docs/argus/index.md`) : avant de
qualifier quoi que ce soit d'"empilé, à corriger", toujours vérifier d'abord que ce n'est pas déjà
une décision assumée et documentée ailleurs dans le projet (Article 19). Exemple réel déjà présent
dans ce projet : `CLAUDE.md` lui-même assume explicitement de ne jamais renuméroter ses Articles
malgré l'empilement visible de dates, pour ne pas casser les renvois qui les citent — ce n'est pas
de la dette, c'est un choix pesé.

## Format de restitution

Décision explicite de l'utilisateur : résumé court dans la conversation + détail complet
(comparaison imaginée/réelle) en fichier joint via `SendUserFile` — même format que les
simulations et le rapport KPI (Article 18).

## KPI — suivi dès la création

Décision explicite de l'utilisateur, contrairement aux autres outils de ce projet (dont le suivi a
été repoussé "trop tôt" à leur création) : `alwaysNewCodePerformance()` suit, dès le premier
passage, le nombre de trouvailles confirmées par passage — colonne "Trouvailles confirmées" de
`docs/always-new-code/index.md`.

## Limite honnête

Reconnaissance de motifs + jugement architectural, jamais une preuve formelle — de la même nature
que les autres outils de raisonnement de ce projet. Le mapping zone→fichier principal
(`THEME_PRIMARY_FILE`) est approximatif ; les seuils de la couche mécanique (`addendaSignal`,
`churnSignal`) sont calibrés sur ce projet à un instant donné, à recalibrer si l'expérience montre
qu'ils sont trop ou trop peu sensibles.

## Garde-fou de fraîcheur (2026-09-21, Article 24)

`THEMES` promettait par simple commentaire de rester synchronisé avec la carte HARMONIA
(`docs/referentiel/harmonia.md`), sans aucune vérification mécanique — un écart aurait pu s'installer
en silence. `extractHarmoniaThemes()`/`findThemesDivergingFromHarmonia()` relisent le texte réel de
harmonia.md et rapportent tout écart dans les deux sens (un thème d'HARMONIA absent d'ici, ou
l'inverse), câblé dans `main()`.
