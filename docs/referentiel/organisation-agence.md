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

## 4. Membre de l'équipe — 9 familles de travail

**Bascule actée le 2026-09-25 par l'utilisateur** (tâche #754), en réponse à une question posée en
fenêtre dédiée : « **on garde les 9 familles** ». Ce document décrivait 6 *Suites* pendant que
`doc-report.REGISTRIES[].family` rangeait les mêmes outils en 9 *familles* — deux rangements du même
paysage, avec **un seul nom commun aux deux**. Ce n'était pas un détail de vocabulaire : tant que les
deux coexistaient, tout axe de classification ajouté par-dessus héritait de l'ambiguïté, et personne
ne pouvait dire lequel faisait foi.

**Ce qui a changé concrètement** : `AGENT_CATEGORIES` (`scripts/lib-shell.mjs`) porte désormais, pour
chaque outil, un libellé de la forme **« Rang — Famille »**. Le *rang* dit l'autorité (Article 20bis :
Gardien sacré du code, Agent Cadre, Membre, Agent Spécial) ; la *famille* dit le voisinage de
travail, et c'est elle qui doit coïncider avec le registre. Chaque famille attribuée a été **DÉRIVÉE
du registre qui la portait déjà**, jamais choisie par analogie — à une seule exception, déclarée
ci-dessous.

**Les noms que l'utilisateur avait choisis ne sont pas effacés** : la correspondance ci-dessous les
garde atteignables, parce qu'ils sont cités dans le suivi et dans des commentaires de code, et qu'un
nom propre sans définition atteignable est une dette de reprise (Article 27).

| Nom que l'utilisateur avait donné (6 Suites) | Famille qui survit (registres) |
|---|---|
| Suite Suivi-Conso | éclatée : **Gouvernance interne** (Smart Conso API, SMART-CONSO-TOKEN, objectifs-vs-resultats, ecotoken) et **Suite Pilotage & Consommation** (AGENT-DU-TEMPS, Smart Breaker) |
| Suite Audit Simulation *(anciennement « Suite Simulation & Qualité narrative »)* | **Simulation & qualité narrative** — le nom d'origine, revenu de lui-même par le registre |
| Suite Audit lourd | scindée : **Audit indépendant** (THE-FINAL-JUDGE, THE-DEEP-READER) et **Exceptionnel (page blanche / audit lourd)** (HYPER-SCAN-CHECKPOINT, INES-official) |
| Suite Dette & Structure du code | **Suite Dette & Structure du code** *(le seul nom qui était déjà commun aux deux rangements)* et **Outillage de navigation** (find-booster, find-deep-booster) |
| La Cour du Roi | répartie : THE-KING en **Gouvernance interne**, INES-official en **Exceptionnel**, check-tasks-details et Doc-Report en **Coordination** |
| Les Agents Spéciaux | ce n'était pas une famille mais un RANG (`Agent Spécial`), et il est conservé comme tel : CHECK-LEVEL-TARGET en **Gouvernance interne**, Smart Breaker en **Suite Pilotage & Consommation** |

**La neuvième famille, « Équipe noyau (Article 20) »**, n'apparaissait pas dans les 6 Suites : ce sont
les Gardiens sacrés du code (§3), qui avaient un rang mais aucune famille. Ils en ont une désormais,
ce qui ne change rien à leur rang ni au critère double qui le gouverne.

**La seule attribution NON dérivée d'un registre, et elle attend sa confirmation** : Smart Breaker ne
possède aucun registre `doc-report` — son domaine est la PRODUCTION, pas un rapport de travail. Il a
été rangé en **Suite Pilotage & Consommation** aux côtés d'AGENT-DU-TEMPS parce que les deux pilotent
une ressource qui s'épuise. C'est une proposition de l'agent, pas une décision : **nommer reste la
prérogative de l'utilisateur**, et cette ligne est là pour qu'il puisse la corriger d'un mot.

### Trois décisions de l'utilisateur, le 2026-09-25 — sept familles au lieu de neuf, trois rangs au lieu de quatre

*(Ses mots : « fondre Pilotage dans Gouvernance », « "Équipe noyau" = les Gardiens sacrés, donc peut-être
une famille à supprimer », et sur le rang orphelin : « le fondre dans Membre ». Les paragraphes
ci-dessus restent tels quels — ils racontent l'état d'avant, et l'effacer ferait disparaître le
pourquoi. Ce bloc dit l'état d'aujourd'hui.)*

- **« Suite Pilotage & Consommation » n'existe plus** : ses deux membres (AGENT-DU-TEMPS, Smart
  Breaker) ont rejoint **Gouvernance interne**. Piloter une ressource qui s'épuise EST de la
  gouvernance interne — la famille séparée distinguait deux choses qui n'avaient pas à l'être.
- **« Équipe noyau (Article 20) » n'existe plus non plus**, et pour une raison plus nette : elle
  redisait le RANG. Une famille dit ce sur quoi on TRAVAILLE, un rang dit ce qu'on VAUT ; une
  famille dont le seul critère d'entrée est un rang ne classe rien. Les six qui la portaient ont
  rejoint **Suite Dette & Structure du code**, qui dit leur vrai terrain. Leur rang de Gardien
  sacré est intact, et l'Article 20 reste la loi qui le définit. La preuve que les deux axes sont
  bien indépendants : ALWAYS-NEW-CODE est Gardien sacré et vit en famille « Exceptionnel ».
- **Le rang « Agent Spécial » est fondu dans « Membre »** : porté par deux outils, déclaré dans
  aucun dictionnaire, jamais défini. CHECK-LEVEL-TARGET et Smart Breaker sont des Membres.

**Impact réel, mesuré avant d'agir plutôt que supposé** : deux fichiers portent ces libellés
(`scripts/lib-shell.mjs` pour le registre de l'équipe, `scripts/doc-report.mjs` pour celui des
registres), et deux garde-fous existaient déjà pour refuser un oubli entre les deux
(`comparerLesFamilles()`, `findFamillesDivergentesParOutil()`). C'est exactement ce à quoi ils
servent : après le changement, les deux sont au vert. Rien d'autre dans le dépôt ne dépendait de
ces noms.

### Ce qui garde les deux rangements alignés, désormais mécaniquement

Deux garde-fous distincts, et le second existe parce que le premier ne suffisait pas :

1. `comparerLesFamilles()` (`scripts/cassandra-rh.mjs`) confronte les deux **listes de noms**, et
   refuse de répondre quand un seul côté est lisible — une comparaison rendue sur un seul côté
   ressemble trait pour trait à un accord parfait.
2. `findFamillesDivergentesParOutil()` (#755) compare **outil par outil**. Un accord sur les neuf
   noms ne dit rien du rangement : un outil pouvait très bien être « Coordination » ici et
   « Gouvernance interne » dans son registre, et le premier garde-fou n'y aurait rien vu.

**La leçon payée le jour même de la bascule, et elle est gardée par un contre-test** : la sonde
d'origine cherchait le mot « Suite » dans le libellé d'une catégorie. Le jour où les Suites ont
disparu — c'est-à-dire le jour où le désaccord a été CORRIGÉ — elle a cessé de pouvoir matcher et a
affiché « ✅ les deux rangements se recouvrent » sur **un seul** nom commun. C'est le fil rouge de ce
projet, rencontré une fois de plus : *un contrôle empêché de regarder rend exactement ce que rend un
contrôle qui n'a rien trouvé, et ce vert-là est plus dangereux qu'aucun contrôle, parce qu'il occupe
la place.* La famille se **lit** maintenant après le tiret cadratin (`familleDeLaCategorie()`), elle
ne se devine plus.

### Le détail par famille n'est plus recopié ici

**Décision du 2026-09-25 (Article 24 : un registre se LIT, il ne se recopie pas)** : la liste des
membres de chaque famille était tenue à la main dans ce document, et c'est exactement ce qui l'avait
laissée dériver de six noms contre neuf sans que personne ne le voie. Elle se lit désormais à
l'exécution :

```
node scripts/cassandra-rh.mjs organigramme
```

Cette commande reconstruit l'organigramme complet depuis les données réelles — socle, Agents Cadre,
Gardiens sacrés, membres par famille, émetteurs non certifiés — et signale tout membre certifié
laissé sans famille. Un outil qui rejoint l'équipe demain y apparaît sans qu'une ligne soit à
recopier ici.

**Décision conservée du 2026-09-22** : le gabarit STANDARD (blueprint + instanciation + registre)
suffit pour toutes ces familles — jamais un gabarit sur mesure par groupe, qui ajouterait de la
complexité sans bénéfice réel. Seuls les Gardiens sacrés (§3) ont un gabarit enrichi, pour la raison
qui leur est propre (câblage post-commit partagé).

Le détail complet de chaque outil (coût, déclenchement, ce qu'il détecte) reste dans la table
maîtresse `docs/regles-de-travail.md` §7ter — ce document-ci n'est qu'un regroupement fonctionnel.

### Le rang « Agent Spécial » survit à la bascule

Il ne désignait pas un voisinage de travail mais une **situation structurelle** : CHECK-LEVEL-TARGET
est un outil d'aiguillage interne (quel niveau de vérification une demande appelle), jamais une
routine qu'on coche soi-même ; Smart Breaker a une structure hors norme (pas de dossier `docs/`
dédié, registre = fichier local jamais committé) et une portée PRODUCTION plutôt qu'outillage de
développement. Les deux gardent ce rang, et ont reçu une famille en plus — les deux axes ne se
remplacent pas.

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

## Décisions du 2026-09-26 (soir) — rangs, familles et un rang rendu

*(Tranchées par l'utilisateur en fenêtre dédiée, après mesure. Détail complet et preuves :
`docs/referentiel/le-classificateur.md`.)*

1. **Un seul Agent Cadre : CASSANDRA-RH.** LE-COORDINATEUR redescend à Membre classique — ce que la
   table maîtresse écrivait déjà. Raison mesurée : `convoquer()` n'existe que chez CASSANDRA, et le
   poste de Cadre est défini par ce pouvoir.
2. **La famille « Exceptionnel » est dissoute** : HYPER-SCAN-CHECKPOINT → La Gouvernance Royale,
   INES-official → Les Anges de la coordination. Son nom promettait « page blanche » alors que le
   porteur de la page blanche (ALWAYS-NEW-CODE, Article 23) vit ailleurs.
3. **Le rang « Membre » devient « Membre premium » 🥇**, et une famille « Hors Agence » 🚧 rejoint la
   liste, tout en bas de l'échelle des rangs, sans évolution possible et sans entrée possible.
4. **La Suite Tarantino reste dans l'Agence** et son principe reste exportable : « hors Agence »
   qualifie ce qui lance le produit, jamais ce qui le juge.
