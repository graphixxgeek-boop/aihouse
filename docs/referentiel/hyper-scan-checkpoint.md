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

## Premier passage réel — pas encore effectué

La partie mécanique du script a été validée (exécutions de test lors de la construction, jamais
consignées dans l'index puisqu'elles ne couvraient pas la checklist qualitative). Le premier VRAI
passage — mécanique + checklist qualitative traitée par l'agent — reste à faire, à la demande de
l'utilisateur.
