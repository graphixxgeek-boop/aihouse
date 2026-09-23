# L'Agence Codex — organisation et organigramme

> **⚠️ CE DOCUMENT N'EST PLUS LA SOURCE DE VÉRITÉ DE LA LISTE** *(2026-09-22, tâches #171/#172/#179)*.
> L'organigramme se **reconstruit désormais depuis les données réelles** à chaque exécution —
> `buildOrganigramme()` / `renderOrganigrammeReport()` (`scripts/cassandra-rh.mjs`), item de Ronde
> `organigramme-signal`, rapport texte archivé dans `docs/cassandra-rh/organigramme/`.
> Ce document garde ce qu'aucun calcul ne peut produire : **le POURQUOI** de chaque rang, les
> arbitrages tranchés, les frontières. Il ne doit plus jamais recopier la liste elle-même.
> Preuve que la tenue manuelle ne tenait pas : au moment de construire ce mécanisme, **trois membres
> certifiés** (CIRCLE-TASKS, tool-brain, find-deep-booster) n'appartenaient à aucune suite depuis leur
> certification, sans que personne — ni ce document, ni aucun outil — ne l'ait jamais remarqué.
> Ils forment depuis la **Suite Orientation** (calibrage explicite de l'utilisateur) : ceux qui disent
> QUOI faire ensuite et AVEC QUOI, jamais ce qu'il faut en penser.


*(2026-09-22, demande explicite de l'utilisateur : « consolidons toute cette partie, livre moi
l'organisation complète, bien définie [...] ce doc sera mis dans le référentiel à l'usage de
CASSANDRA qui devra le remettre à jour régulièrement : l'info est chez elle, logique [...] c'est
son domaine ». Ce document est le référentiel CANONIQUE de l'organisation de l'outillage de
travail — « l'Agence Codex » (nom choisi par l'utilisateur, en souvenir de Codex, l'IA qui a
initialement produit le code de ce projet avant la reprise par Claude Code), à distinguer du jeu
lui-même (la « maison »
où vivent Lia et Noé). Calibré en 4 questions le soir de sa création, consolidant des décisions déjà
prises séparément dans `docs/cassandra-rh-conception.md` §4 et `docs/regles-de-travail.md` §7ter —
jamais une réinvention, une mise en ordre. Renommages complémentaires actés le même soir, une
seconde salve de réponses de l'utilisateur : le nom de l'ensemble, et 3 des 6 suites de travail.)*

**Frontière avec les autres documents, pour ne jamais dupliquer (Article 6)** : ce document répond
à « qui appartient à l'agence, et comment est-elle structurée ? ». Le détail complet outil par
outil (coût, déclenchement, ce qu'il détecte précisément) reste dans la table maîtresse de
`docs/regles-de-travail.md` §7ter, jamais recopié ici — ce document RÉFÉRENCE cette table, ne la
remplace pas. Les décisions de conception propres à CASSANDRA-RH (contrôle croisé, agrégation dans
le badge) restent dans `docs/cassandra-rh-conception.md`, qui référence désormais ce document pour
le roster lui-même plutôt que de le dupliquer.

## 1. Deux axes, toujours séparés

Toute confusion entre ces deux axes est une erreur de lecture de l'organigramme — ils répondent à
des questions différentes et se combinent librement (ex. LE-COORDINATEUR est « Membre certifié
(classique) » sur l'axe A et « Agent Cadre » (Direction) sur l'axe B en même temps).

### Axe A — Statut de documentation (« quel dossier ce poste a-t-il ? »)

**Reclarifié le 2026-09-21** (correction explicite de l'utilisateur : « les agents que tu cites
[LE-COORDINATEUR, CIRCLE-TASKS, route-booster] [...] ce sont bien des membres certifiés avec badge
[...] refaisons une passe [...] pour que tout soit parfaitement clair à 100% »). Le badge 🎖️
« Membre certifié » couvre désormais DEUX catégories, jamais une seule — le critère qui les sépare
n'est jamais le badge lui-même, mais l'existence ou non d'une connaissance PROPRE AU PROJET à
documenter à part :

- **Agent** — dit aussi Sage (sans connaissance propre au projet mais un vrai domaine de jugement) ou
  Gardien sacré (cf. §3 ci-dessous) : instanciation propre (`docs/referentiel/<slug>.md`) + registre
  dédié (`docs/<slug>/`). Le blueprint générique est la norme en plus, sans être strictement
  obligatoire (un Agent peut être déclaré `cousinOf` un autre — seul cas actuel, THE-DEEP-READER).
- **Membre certifié (classique)** *(nouveau statut, 2026-09-21)* — LE-COORDINATEUR, CIRCLE-TASKS,
  route-booster, tool-brain : badge 🎖️ réel, mais AUCUNE connaissance propre au projet à documenter
  à part — sa seule valeur est d'appeler/agréger/mettre en forme ce que les Agents disent déjà.
  Jamais de blueprint, jamais de registre, jamais d'instanciation séparée — `checkAgentOnboarding()`
  (`le-coordinateur.mjs`) porte le paramètre `ownKnowledge: false` pour ce statut, qui dispense
  exactement ces 3 exigences sans jamais dispenser la présence dans la table maîtresse elle-même.
- **Utilitaire nommé** *(portée réduite depuis le 2026-09-21)* : a un nom, mais n'a PAS (encore) le
  statut de membre certifié — find-brain, CHARTER-SPY, tool-usage.mjs, Doc-Report, le gabarit HTML.
  Aucun badge. Leur éventuelle promotion vers « Membre certifié (classique) » reste une question
  ouverte, jamais tranchée silencieusement (cf. `docs/regles-de-travail.md` §7ter).
- **Infrastructure** : pas de nom propre, la plomberie qui fait tourner les Agents et les Membres
  certifiés classiques.

### Axe B — Rôle dans l'organigramme (« à quel niveau ce poste travaille-t-il ? »)

- **Direction** — rebaptisée ici **« Les Agents Cadre »** (nom choisi par l'utilisateur, 2026-09-22)
- **Équipe noyau** — rebaptisée ici **« les Gardiens sacrés du code »** (nom choisi par
  l'utilisateur)
- **Membre de l'équipe** — regroupés en 6 suites de travail (§4)
- **VIP**
- **Hors de l'agence, définitivement** (§5)

## 2. Les Agents Cadre (Direction)

**CASSANDRA-RH + LE-COORDINATEUR** — aucun des deux ne vérifie le code lui-même : l'un route le
travail (LE-COORDINATEUR agrège et suggère), l'autre évalue les postes (CASSANDRA-RH, noyau
construit et certifié le 2026-09-21, cf. `docs/referentiel/cassandra-rh.md` — corrigé le
2026-09-21, cette phrase affirmait encore « à construire » alors que l'Agent existe déjà, exactement
le genre d'écart doc/code que l'Article 13 interdit). Les deux directeurs passent par les mêmes
scans mécaniques que tout le monde (couverture AXA-CHECK, trous ARGUS, frictions HARMONIA) — seule
l'évaluation RH de pertinence de poste leur échappe structurellement à eux-mêmes.

## 3. Les Gardiens sacrés du code (Équipe noyau)

**Critère d'appartenance exact — un critère double, jamais un seul des deux pris isolément** (une
première formulation à un seul volet a chaque fois exclu ou inclus le mauvais outil : « tourne à
chaque commit » seul aurait laissé dehors un futur scan de qualité pas encore câblé au hook ; «
délivre un scan de qualité » seul aurait à tort inclus n'importe quel LIVRABLE utile mais coûteux
comme le vrai zoom profond « page blanche » d'ALWAYS-NEW-CODE) : (a) **délivre un vrai scan de
qualité du code** ET (b) **peut tourner automatiquement, mécaniquement, gratuitement, à CHAQUE
commit**, jamais sur demande, jamais périodique (Article 20 de CLAUDE.md). **Correction du
2026-09-21** (le premier jet de ce critère nommait ALWAYS-NEW-CODE par son nom global comme exemple
d'exclusion — trop large : c'est le LIVRABLE qui exige un raisonnement payant qui ne peut jamais
devenir un Gardien sacré, jamais l'outil dans son ensemble quand une couche légère et déjà gratuite existe
séparément, cf. ALWAYS-NEW-CODE ci-dessous, dont seule cette couche légère porte le statut). Exactement
6 membres, jamais un groupe inventé au coup par coup :

- **ARGUS** — absences (ce qui devrait exister et n'existe pas)
- **HARMONIA** — frictions (deux choses qui existent et se contredisent)
- **AXA-CHECK** — robustesse/fragilité réelle par fonction (couverture de test V8)
- **CLEAN-DIRTY-OLD** — stagnation relative, délègue toujours son jugement aux trois autres
- **CLONE-HUNTER** (rejoint le 2026-09-22) — blocs de code dupliqués (littéral + renommage
  bijectif cohérent) ; rapide (<1s sur tout le dépôt), donc compatible avec le critère (b) malgré son
  arrivée tardive dans le réseau d'outils
- **ALWAYS-NEW-CODE** (couche légère seulement, rejoint le 2026-09-21) — `recommendZone()` (rotation
  de la zone la plus négligée) + `addendaSignal()`/`churnSignal()` (indices mécaniques d'empilement
  sur le fichier principal de la zone recommandée), zéro raisonnement, coût minime ; le VRAI zoom
  profond « page blanche » (Article 23) reste exclu, exige un raisonnement payant à chaque fois,
  jamais mécanisable — même limite que THE-FINAL-JUDGE ci-dessous, qui lui n'a AUCUNE couche gratuite
  du tout et reste donc entièrement hors des Gardiens sacrés, sans exception

**Gabarit de poste spécifique** (décision actée le 2026-09-22, au-delà du gabarit standard Agent) :
en plus de l'instanciation + registre standard, la fiche d'un Gardien sacré porte deux champs propres,
qu'aucun autre groupe ne porte :
1. **Position dans le crochet post-commit** (`scripts/hooks/check-last-commit.mjs`) — où et dans
   quel ordre il est appelé.
2. **Rôle dans le badge/couverture AXA-CHECK** — comment sa sortie alimente `checkAgentOnboarding()`
   et le badge 🎖️ des autres outils.

### Répertoire des fonctionnements spécifiques partagés par tous les Gardiens sacrés

*(2026-09-22, demande explicite de l'utilisateur : « identifie le fonctionnement spécifique des
gardiens (qui se valident les uns les autres par ex) et lorsqu'on intègre un nouveau gardien, veille
à ce qu'il rentre bien dans tous ces fonctionnements ». Checklist à cocher intégralement pour tout
futur 7e Gardien sacré — CASSANDRA-RH s'y réfère directement pour sa mission « Promotion de poste »,
cf. `docs/cassandra-rh-conception.md` §2.)*

1. **Câblage post-commit réel** — importé et appelé par sa FONCTION PURE (jamais son `main()` CLI,
   pour ne jamais écrire un nouveau fichier de registre à chaque commit) dans
   `scripts/hooks/check-last-commit.mjs`, dans un bloc `try/catch` isolé (une erreur d'un Gardien sacré ne
   doit jamais faire échouer le hook ni bloquer le commit — warn-only, Article 20).
2. **Retrait de CIRCLE-TASKS** — un Gardien sacré ne doit JAMAIS avoir d'entrée dans `CIRCLE_ITEMS`
   (`scripts/circle-tasks.mjs`) : il tourne déjà à chaque commit, une entrée périodique serait un
   doublon. Son registre rejoint `CIRCLE_EXCLUDED_REGISTRIES` avec la justification standard
   « Gardien sacré, tourne à chaque commit ».
3. **Test dans `check-house.mjs`** — au moins un bloc de test dédié dans le filet de sécurité
   mécanique, comme tout code du projet, avant de considérer son intégration terminée.
4. **Participation à la couverture du badge** (`checkAgentOnboarding()`,
   `scripts/le-coordinateur.mjs`) — son résultat doit pouvoir alimenter un paramètre `koParts` (ex.
   `cloneHunterFindingsCount`) et compter dans le calcul « OK 100% », qui exige TOUS les Gardiens sacrés au
   vert simultanément, jamais un sous-ensemble. **Précision du 2026-09-22** : « au vert » veut dire
   *consulté ET propre*. Un signal non fourni (le Gardien sacré dormait à ce commit, ou l'appelant ne le
   transmet pas) laisse le palier à « en cours », désormais avec un libellé qui nomme les Gardiens sacrés
   manquants (« en cours (4/6 Gardiens sacrés au vert — CLONE-HUNTER, ALWAYS-NEW-CODE non consulté(s) à ce
   relevé) ») — jamais confondu avec un zéro mesuré, jamais un 4e palier ajouté à l'échelle à 3
   niveaux calibrée par l'utilisateur (tâche #224).
   **Relevé partagé** (même date) : les 6 signaux mesurés à chaque commit sont déposés par le
   crochet post-commit dans `.badge-signals-snapshot.json` (journal local, gitignored, déclaré dans
   `LOCAL_JOURNALS`) et relus gratuitement par tout afficheur de badge via
   `badgeSignalsAsContext()`. Sans ce relevé, seul le crochet connaissait ces signaux : CASSANDRA-RH
   et check-tasks-details affichaient « jamais scanné » pour des outils mesurés trente secondes plus
   tôt — deux chemins d'affichage du même badge disaient deux choses différentes.
5. **Agrégation dans HYPER-SCAN-CHECKPOINT** (version légère, `scripts/hyper-scan-checkpoint.mjs`) —
   appelé via `sh()` aux côtés des autres Gardiens sacrés, pour qu'un passage HYPER-SCAN-CHECKPOINT reflète
   TOUJOURS l'état complet des 6, jamais un sous-ensemble par oubli (écart réel trouvé le 2026-09-22 à
   l'arrivée de CLONE-HUNTER, corrigé le même soir).
6. **Validation croisée informelle, pas mécanique** — les Gardiens sacrés ne s'exécutent jamais les uns les
   autres, mais leurs signaux se recoupent en pratique lors d'une revue (ex. une trouvaille HARMONIA
   peut confirmer un signal CLEAN-DIRTY-OLD sur la même zone) ; aucun mécanisme automatique ne force
   ce recoupement aujourd'hui, c'est une lecture humaine/agent au moment de l'analyse, jamais une
   fusion de leurs sorties.
7. **Aucun coût API/agent séparé** — un Gardien sacré reste, par définition, un calcul mécanique local
   (grep, parsing, comparaison de blocs) ; un LIVRABLE qui a besoin d'un vrai raisonnement (le vrai
   zoom profond d'ALWAYS-NEW-CODE, THE-FINAL-JUDGE dans son ensemble) ne peut jamais devenir un
   Gardien sacré, même s'il produit un excellent scan de qualité — c'est exactement ce qui l'exclut du
   critère (b) ci-dessus. Jamais le nom de l'outil entier par contrecoup : ALWAYS-NEW-CODE porte les
   deux à la fois (une couche légère déjà Gardien sacré, un vrai zoom qui ne le sera jamais) — THE-FINAL-JUDGE,
   lui, n'a aucune couche légère du tout, donc reste entièrement hors des Gardiens sacrés sans aucune
   exception.

Détail complet de chacun : `docs/referentiel/argus.md`, `harmonia.md`, `axa-check.md`,
`clean-dirty-old.md`, `clone-hunter.md`, `always-new-code.md` (inchangés par ce document, sauf
`clone-hunter.md`/`always-new-code.md` eux-mêmes mis à jour pour refléter leur nouveau statut).

## 4. Membre de l'équipe — 6 suites de travail

**Décision actée le 2026-09-22** : le gabarit STANDARD (blueprint + instanciation + registre, déjà
en vigueur) suffit pour ces 6 suites — jamais un gabarit sur mesure par groupe, qui ajouterait de la
complexité sans bénéfice réel (le contenu libre du blueprint/instanciation couvre déjà leurs
différences). Seuls les Gardiens sacrés (§3) ont un gabarit enrichi, pour la raison qui leur est
propre (câblage post-commit partagé).

Le détail complet de chaque outil (coût, déclenchement, ce qu'il détecte) reste dans la table
maîtresse `docs/regles-de-travail.md` §7ter — ce tableau-ci n'est qu'un regroupement fonctionnel.

### Suite Suivi-Conso
Régule et observe la consommation (API et tokens) et l'usage réel des outils.
- Smart Conso API — rythme de consommation API de l'agent (Article 22)
- SMART-CONSO-TOKEN — rythme de consommation de tokens de l'agent (obligation écrite)
- Compteur d'utilisation des outils (`tool-usage.mjs`) — journal des sollicitations réelles

### Suite Audit Simulation
*(Anciennement « Suite Simulation & Qualité narrative », renommée par l'utilisateur.)* Juge une
partie réellement jouée (dialogue, visuel, mémoire persistée) — jamais le code du moteur lui-même.
- EL-PROFESSOR — fidélité à la charte (esprit, naturel, voix, enquête, clarté)
- THE-SCREENER — qualité visuelle indicative (2 captures d'écran max)
- memory-audit — cohérence mécanique de la mémoire persistée de Lia/Noé (seul Membre dont le SUJET
  est un Personnage, sans que cela fasse rejoindre l'équipe aux Personnages eux-mêmes, cf. §5)

### Suite Audit lourd
*(Nom déjà utilisé dans CIRCLE-TASKS, conservé tel quel.)* Les seuls outils à agent séparé/coût réel
significatif, jamais automatiques, jamais cochés par défaut dans une Ronde.
- THE-FINAL-JUDGE — audit indépendant du code et du produit
- THE-DEEP-READER — cousin de THE-FINAL-JUDGE, relecture lourde du suivi
- HYPER-SCAN-CHECKPOINT — orchestrateur exceptionnel (Article 21), version complète coûteuse

### Suite Dette & Structure du code
Dette technique et navigation dans du code volumineux.
*(CLONE-HUNTER a quitté cette suite le 2026-09-22, puis ALWAYS-NEW-CODE le 2026-09-21, pour
rejoindre les Gardiens sacrés du code, §3 — deux promotions actées après vérification qu'ils
remplissent le critère double scan-de-qualité + tourne à chaque commit ; le vrai zoom profond
d'ALWAYS-NEW-CODE, lui, n'a pas de suite fonctionnelle propre — c'est un raisonnement à la demande,
jamais un Membre au sens de ce document.)*
- find-booster — index par concept dans un gros fichier déjà structuré
- find-deep-booster (`scripts/route-booster.mjs`, renommé depuis « route-booster ») — points de
  coupe candidats pour découper une fonction géante (Membre certifié classique depuis le
  2026-09-21, pas Agent — reste dans ce groupe fonctionnel malgré son statut de documentation
  différent)

### La Cour du Roi
*(Anciennement « Suite Référentiel & Vue d'ensemble », renommée par l'utilisateur — un nom qui
trouve sa logique dans le fait que THE-KING lui-même y siège.)* Donne une vue consolidée — du code,
de la philosophie, des rapports, des tâches.
- INES-official — édition consolidée et annotée du dépôt
- THE-KING — veille de `docs/philosophie-et-politique.md`
- Doc-Report — index global des registres et journaux locaux du réseau d'outils
- check-tasks-details — état des lieux des tâches à la demande

### Les Agents Spéciaux
*(Anciennement « À part », renommée par l'utilisateur — n'appartiennent à aucune des 5 suites
ci-dessus, chacun pour sa propre raison structurelle.)*
- **Smart Breaker** (`check-gemini-quota.mjs` + `gemini-key-health.mjs` + `api-providers.mjs` +
  `lib/gemini-keys.ts`) — structure hors norme déjà notée (pas de dossier `docs/` dédié, registre =
  fichier local jamais committé), portée PRODUCTION plutôt qu'outillage de développement.
- **CHECK-LEVEL-TARGET** — outil d'aiguillage interne (quel niveau de vérification une demande
  appelle), jamais une routine qu'on coche soi-même.

## 5. Jamais un employé de l'Agence — 3 catégories d'exclusion définitive

Aucun mécanisme pensé pour l'équipe (badge, blueprint, registre, couverture AXA-CHECK, entrée
PRESTATIONS) ne s'applique jamais à ce qui suit, quelle que soit sa proximité apparente avec un
poste de travail :

1. **Les Personnages (Lia, Noé)** — contenu narratif, gouvernés exclusivement par la charte de
   contenu (CLAUDE.md), jamais une catégorie de l'organigramme. Un outil DE l'équipe peut avoir pour
   SUJET un Personnage (memory-audit) sans que cela le fasse rejoindre l'équipe.
2. **Le Moteur du jeu** (`lib/*.ts`, `app/*`, `components/*` — hors `components/ui/`, cf. point 3
   ci-dessous) —
   le PRODUIT que l'agence construit et vérifie (par `tsc`/`check-house.mjs`/AXA-CHECK comme
   n'importe quel code), jamais un travailleur de plus. Un outil peut ajouter un point
   d'observation DANS le moteur (`lib/memento-weight.ts`, `lib/gemini-keys.ts`) sans que ce
   fragment devienne un Agent.
3. **Le code tiers vendu tel quel** (`components/ui/*`, le kit shadcn/Radix) — jamais écrit ni
   maintenu par l'agence, seulement importé. Déjà exclu en pratique du scan de CLONE-HUNTER
   (« duplication assumée par design ») — formalisé ici comme règle générale, pas seulement une
   exception locale à un outil.

## 6. Infrastructure — un 3e rang d'employés, sans dossier individuel

**Décision actée le 2026-09-22** : contrairement aux 3 catégories du §5 (jamais un employé, quelle
que soit la lecture), les scripts « Infrastructure » (`check-house.mjs`, `check-spirit.mjs`/
`check-profile.mjs`, `check-argus.mjs`, `check-harmonia.mjs`, `lib-shell.mjs`, et tout script sans
nom propre) **restent dans l'organigramme de l'agence**, au rang le plus bas — un vrai travail
utile et vérifié (couvert par AXA-CHECK comme tout code), mais jamais de fiche de poste individuelle
ni de badge. Un Agent peut être implémenté par plusieurs fichiers d'infrastructure (ex. Smart
Breaker = 4 fichiers) sans qu'aucun d'eux ait besoin de son propre statut.

## 7. VIP

L'utilisateur et l'agent (Claude) — explicitement hors du tableau, jamais évalués, jamais une ligne
du badge.

## 8. Entretien de ce document

**C'est le domaine de CASSANDRA-RH** (noyau construit et certifié le 2026-09-21, round de calibrage
#134) : elle tient ce document à jour à chaque nouvel outil créé, chaque outil retiré, chaque
déplacement entre suites — exactement comme elle tiendra la liste de l'équipe à jour (cf.
`docs/cassandra-rh-conception.md` §2). **Corrigé le 2026-09-21** : cette auto-maintenance
elle-même n'est PAS encore construite dans le noyau actuel (`scripts/cassandra-rh.mjs` note/lit
l'équipe, supervise le badge, ne réécrit jamais ce document) — la mise à jour reste donc manuelle,
à la charge de l'agent qui pilote, au même titre que la table maîtresse de
`docs/regles-de-travail.md` §7ter (Article 13 — un nouvel outil qui rejoint l'agence sans mise à
jour de ce document est une dette documentaire, pas un détail reportable).
