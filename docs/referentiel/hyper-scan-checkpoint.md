# HYPER-SCAN-CHECKPOINT — instanciation pour Maison IA vivante

*(Cf. `docs/hyper-scan-checkpoint-blueprint.md` pour le principe générique. Créé le 2026-09-19,
reconstruit à partir de cinq vrais prompts historiques de l'utilisateur — cf. section dédiée de
`CLAUDE.md` pour les citations complètes retrouvées dans l'historique de session.)*

## Ce qui existe aujourd'hui

- **`scripts/hyper-scan-checkpoint.mjs`** — orchestrateur, version légère (zéro appel réseau).
  Détermine ce qui a changé depuis le dernier passage (lu directement dans
  `docs/hyper-scan-checkpoint/index.md`, dernière ligne, jamais un fichier d'état séparé), lance
  `check-argus.mjs`, `check-harmonia.mjs`, `check-house.mjs`, résume l'état des registres
  disponibles (`points-fragiles.md`, `docs/suivi/`, index d'ARGUS/HARMONIA/Smart Conso API), relit
  `CLAUDE.md` en entier, calcule sa propre performance (cf. section dédiée ci-dessous), et produit
  une CHECKLIST explicite des étapes qui restent du ressort du raisonnement — jamais prétendre les
  automatiser.
- **`docs/hyper-scan-checkpoint/`** — dossier des rapports archivés + `index.md` (mémoire du
  dernier passage ET registre des trouvailles).

## KPI central : le taux de trouvailles réelles, jamais "a-t-il tourné"

*(2026-09-19, demande explicite de l'utilisateur : « ce qui m'intéresse dans ces prompts, c'est le
résultat qu'ils ont obtenu : la mise en évidence de bugs non identifiés [...] assure-toi de ses
performances, qui doivent être suivies dans les KPI aussi ».)* La vocation de cet outil n'est PAS de
tourner sans erreur (ARGUS/HARMONIA/`check-house.mjs` le garantissent déjà chacun séparément) mais
de faire remonter des bugs ou oublis qu'aucun autre outil n'avait vus — la référence est le cas
réel du 2026-09-18 (`negotiationLog` jamais câblé malgré une demande explicite au tour 64, jamais
détecté par aucun test avant ce passage). `checkpointPerformance()` calcule, à partir de la colonne
"Trouvailles" de l'index (nombre de trouvailles CONFIRMÉES, jamais des candidats non vérifiés) :
le nombre total de trouvailles, la moyenne par passage, et surtout le **taux de passages ayant
trouvé au moins une chose réelle** — la mesure la plus directe de "cet outil sert-il encore à
quelque chose, ou ne fait-il plus que confirmer ce qu'on sait déjà". Absence de donnée tant qu'aucun
passage complet n'est consigné — jamais un faux 0%. **Pas encore raccordé à `kpi-report.mjs`** :
prématuré avant plusieurs vrais passages ; à faire dès que l'historique le justifie.

## Version complète — ce qui n'est pas encore automatisé

La version complète (rejouer `check-spirit.mjs`/`check-profile.mjs`, mini-simulations plafonnées,
double perspective via un second agent indépendant) n'est PAS un mode du script `.mjs` lui-même :
elle nécessite une vraie consultation de Smart Conso API et l'orchestration d'un second agent —
deux choses que seul l'agent qui pilote la conversation peut réellement faire, jamais un script
isolé qui tournerait seul. Quand la version complète est demandée : (1) consulter
`scripts/smart-conso-api.mjs simulation` (ou l'action concernée) ET (depuis le 2026-09-20)
`scripts/smart-conso-token.mjs agent_subagent_spawn` avant de lancer quoi que ce soit de coûteux —
la double perspective appelle un second agent, exactement le schéma le plus coûteux du registre de
SMART-CONSO-TOKEN, jamais une exception ; (2) lancer la version légère d'abord, toujours ; (3) pour
la double perspective, un second agent (outil `Agent`) reçoit le même périmètre sans voir les
conclusions du premier, produit sa propre analyse, puis les deux sont confrontées dans le rapport
final.

## Garde-fous appliqués ici

- **Jamais automatique** : se déclenche sur demande explicite de l'utilisateur. L'agent peut le
  proposer après avoir remarqué une grosse vague de changements, jamais le lancer de sa propre
  initiative sans confirmation.
- **Boucle de mini-simulations plafonnée** (version complète uniquement) : 3 tentatives maximum,
  au-delà l'outil s'arrête et remonte le blocage plutôt que de continuer seul.
- **Relecture de la charte toujours complète**, même en version légère (décision explicite de
  l'utilisateur : jamais seulement les sections qu'on croit concernées).

## Intégration réelle à CIRCLE-TASKS (2026-09-22)

*(Demande explicite : « vois comment integrer hyper-scan dans circle sinon ca n'a pas trop de sens
que circle.process verifie hyper-scan ».)* HYPER-SCAN-CHECKPOINT a désormais un vrai item
`CIRCLE_ITEMS` : `hyper-scan-checkpoint-light` (`scripts/circle-tasks.mjs`), thème "Audit lourd",
JAMAIS `costly` (sa couche mécanique est réellement gratuite, Article 21) mais JAMAIS recommandé par
défaut non plus (`NOT_RECOMMENDED_BY_DEFAULT`) — addable en PRIME, sélectionnable en GOAT, exactement
comme "relecture exhaustive du référentiel". `periodicityTracked: true` réutilise le mécanisme de
seuil déjà en place pour THE-FINAL-JUDGE/THE-DEEP-READER (`costlyItemDueStatus()`, lu depuis
`docs/hyper-scan-checkpoint/index.md`) sans jamais le classer à tort comme un coût financier. Son
`execute` est honnête sur ce qu'une simple sélection en Ronde couvre : SEULEMENT la couche mécanique
(`node scripts/hyper-scan-checkpoint.mjs`) — traiter la checklist qualitative et ajouter la ligne à
`index.md` restent un choix délibéré et séparé, jamais impliqués par la seule case cochée.

## Discipline d'exécution vérifiable — circle-process-guardian (2026-09-22)

*(Demande explicite de l'utilisateur : « l'outil process.circle doit aussi l'avoir en tete, on parle
de discipline d'execution, il est la pour ca ».)* Grâce à l'intégration ci-dessus,
`scripts/circle-process-guardian.mjs::verifyHyperScanProcess({...})` a désormais un contexte
concret plutôt qu'une vérification hors sol. Elle applique une discipline de vérification honnête à
SES PROPRES garde-fous : relecture complète de CLAUDE.md (exigée même en version légère),
consultation de Smart Conso API et de SMART-CONSO-TOKEN avant une version complète, version légère
toujours lancée en premier, plafond non négociable de 3 tentatives de mini-simulation, double
perspective réellement séparée, et une ligne bien ajoutée à `docs/hyper-scan-checkpoint/index.md`
après la checklist qualitative. Même portée honnête que le reste de ce module : aucun de ces faits
n'est observable depuis le disque seul — l'agent qui pilote doit les fournir explicitement à chaque
appel, jamais devinés.

## HYPER-SCAN-CHECKPOINT modernisé pour rejoindre le paysage actuel (2026-09-22)

*(Demande explicite : « vois comment tu peux ameliorer hyper-scan [...] le mettre en phase avec le
paysage actuel des outils [...] plus efficace, plus performant ».)* `scripts/hyper-scan-checkpoint.mjs`
(version légère) agrège désormais aussi : `verifyRondeProcess({})` de circle-process-guardian, filtré
à ses 3 seuls signaux mécaniques (`mechanicalCircleFindings()`, jamais les signaux de conversation
toujours faussement rouges ici) ; et 9 registres supplémentaires jusque-là jamais suivis
(SMART-CONSO-TOKEN, THE-FINAL-JUDGE, THE-DEEP-READER, THE-KING, INES-official, memory-audit,
find-booster, objectifs-vs-resultats, CASSANDRA-RH — tous des Membres/Agents réels créés depuis la
conception de cet outil le 2026-09-19). Volontairement PAS de second appel à `runNetworkCheck()`
(LE-COORDINATEUR) : ce script a déjà ses propres appels directs à ARGUS/HARMONIA/AXA-CHECK/
CLEAN-DIRTY-OLD/CLONE-HUNTER/ALWAYS-NEW-CODE juste au-dessus — un second passage relancerait
`check-house.mjs` et ces deux premiers Gardiens une deuxième fois pour rien, l'exact contraire de
« plus performant ».

## SMART-CONSO-TOKEN pioche désormais dans ce registre (2026-09-22)

*(Demande explicite : « l'equipe smart conso pouvait aussi venir piocher de la donnée ».)* Symétrique
à la consultation déjà établie dans l'autre sens (HYPER-SCAN-CHECKPOINT consulte Smart Conso
API/SMART-CONSO-TOKEN avant une version complète, cf. section ci-dessus « Version complète ») :
`runNetworkCheck()` (`scripts/le-coordinateur.mjs`) lit désormais aussi `docs/hyper-scan-checkpoint/index.md`,
filtré à ses seules lignes "complète" (`filterIndexRowsByVersion()`, `scripts/smart-conso-token.mjs`
— une version légère n'appelle jamais Smart Conso, jamais un faux signal), puis réutilise
`findJudgeSpawnsWithoutConsultation()` telle quelle (déjà câblée pour THE-FINAL-JUDGE/THE-DEEP-READER)
pour signaler tout passage complet réellement archivé sans consultation SMART-CONSO-TOKEN confirmée
à proximité. Jamais un second calcul de date, seulement une réduction du texte en amont.

## Premier passage réel — pas encore effectué

La partie mécanique du script a été validée (exécutions de test lors de la construction, jamais
consignées dans l'index puisqu'elles ne couvraient pas la checklist qualitative). Le premier VRAI
passage — mécanique + checklist qualitative traitée par l'agent — reste à faire, à la demande de
l'utilisateur.
