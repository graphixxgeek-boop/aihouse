# CHECK-TASKS-DETAILS — instanciation pour ce projet

Instanciation de `docs/check-tasks-details-blueprint.md` pour Maison IA vivante. Créé le
2026-09-20, à la demande explicite de l'utilisateur, pour répondre à ses demandes récurrentes
« fais-moi l'état des tâches en cours » avec un gabarit fixe plutôt qu'une réponse réinventée à
chaque fois. Statut **complet**, comme un membre à part entière du paysage d'outils (choix
explicite de l'utilisateur, Article 16 — contrairement à LE-COORDINATEUR/CIRCLE-TASKS/html-report.mjs
qui n'ont pas ce statut).

## Le gabarit de calibrage

Toute demande du type « état des tâches » se répond en calibrant deux axes, via une fenêtre de
question dédiée (Article 16) :
1. **Zoom** : `en_cours` (ce qui est ouvert ou en cours maintenant) / `elargi` (l'ouvert + les 20
   dernières tâches numérotées, terminées incluses — donne le contexte de ce qui vient de se
   terminer) / `projet_entier` (tout l'historique du suivi).
2. **Forme** : `liste` (groupée par statut : En cours / Ouvertes / Autre statut / Terminées, en
   tableau) / `arborescence` (groupée par thème > sous-thème, tel que déjà écrit dans la colonne
   Sujet de chaque ligne du suivi — jamais une nouvelle taxonomie).

## Ce qu'il lit, ce qu'il ne fait jamais

Lit `docs/suivi/sessions/*.md` via `categorizeAllSessions()` (déjà exporté par
`check-suivi-fidelity.mjs` — aucun second parseur de tableau markdown). Colonnes utilisées :
N°, Horodatage, Sujet, Sous-sujet, Sensibilité, Détail, Statut — toutes déjà présentes dans chaque
ligne, cf. `docs/systeme-de-suivi.md`. Le champ Détail (2026-09-20) sert notamment à
`recommendNextTasks()` ci-dessous pour repérer une priorité explicitement exprimée par
l'utilisateur.

**Lecture seule, non négociable** (choix explicite de l'utilisateur, Article 16 : « le suivi des
tâches [...] est sa mère »). `docs/suivi/` reste l'unique source de vérité, modifiée uniquement par
l'agent à la main. check-tasks-details ne fait jamais autorité sur son contenu.

## Consultation de LE-COORDINATEUR

Pour chaque tâche encore ouverte affichée, `suggestPrestationsForTask()` (`le-coordinateur.mjs`)
est appelée pour signaler une correspondance de mots-clés avec une prestation existante — jamais
une certitude, un simple rapprochement mécanique (seuil ≥2 mots-clés partagés). Cf.
`docs/regles-de-travail.md`, section « Consultation programmatique outil→LE-COORDINATEUR », pour le
principe général (réutilisable par tout futur outil, pas seulement celui-ci).

## Vérification croisée automatique (choix explicite de l'utilisateur, Article 16)

Chaque génération archive un instantané compact (`docs/check-tasks-details/historique.jsonl` — N°
et statut seulement, jamais la description complète, pour rester léger) et le compare au dernier
instantané archivé :
- **Régression** : une tâche redevient « ouverte »/« en cours » après avoir été « terminée » — ne
  devrait jamais arriver, signalé en priorité dans le rapport suivant.
- **Stagnation** : une tâche ouverte identique dans les 2 derniers instantanés consécutifs (donc
  présente dans au moins 3 générations de suite en comptant la courante) — signal d'oubli possible,
  jamais une certitude, à vérifier comme toute trouvaille ARGUS/ALWAYS-NEW-CODE.

## Fraîcheur des fichiers préliminaires de chantier (`checkChantierFileFreshness()`, tâche #185, 2026-09-22)

La « vérification, jamais seulement une intention déclarée » demandée explicitement dans
`docs/regles-de-travail.md` pour les fichiers préliminaires de « gros chantier » (CASSANDRA-RH,
refonte graphique — `CHANTIER_PRELIMINARY_FILES`) : compare la tâche de suivi la plus récente qui
concerne un chantier connu (mot-clé sur Sujet/Sous-sujet/Détail) à la dernière modification réelle
(git, `lastTouchDays()` de CLEAN-DIRTY-OLD, jamais un second calcul divergent) de son fichier
dédié. Signale un écart honnête — idée notée en suivi, jamais recopiée — jamais une certitude
d'oubli, avec une tolérance d'une journée pour un commit groupé le même tour. **Faux positif réel
trouvé et corrigé le soir même de sa construction, en le lançant en direct contre le vrai dépôt** :
l'horodatage narratif d'une ligne de suivi suit la date "aujourd'hui" donnée en tête de session, qui
peut courir devant l'horloge système réelle de plusieurs heures à une journée entière (décalage
constaté : système à `2026-09-21 04h35 UTC` pendant qu'une ligne fraîchement écrite portait
`2026-09-22T06:30Z`) — sans clamp, cet écart d'horloge produisait un âge de tâche négatif et donc un
"retard" fabriqué. Corrigé en clampant l'âge d'une tâche à 0 minimum, jamais en dessous.

## Idées à trancher (`detectPendingIdeaCandidates()`/`loadIdeaDecisions()`/`findIdeasNeedingDecision()`, 2026-09-21)

Généralise `checkChantierFileFreshness()` ci-dessus au-delà des seuls « gros chantiers » nommés :
toute idée nouvelle (« Nouvel outil »/« Conception » en tête de Sujet) doit passer par une décision
explicite à 3 voies (fichier préliminaire créé / abandonnée / entre-deux), jamais seulement les
quatre chantiers du registre `CHANTIER_PRELIMINARY_FILES`. Le mécanisme PRINCIPAL reste un réflexe
en temps réel (documenté dans `docs/regles-de-travail.md`) ; ces fonctions alimentent le signal
CIRCLE-TASKS `idee-a-trancher-signal`, un filet de sécurité mécanique qui rattrape une idée oubliée
en la reposant à chaque Ronde tant qu'aucune décision définitive n'est enregistrée.

`detectPendingIdeaCandidates(allRows, sinceTaskNumber = 332)` filtre `docs/suivi/` par le même
libellé de Sujet que l'agent choisit déjà lui-même, AU-DESSUS d'un plancher au NUMÉRO de tâche —
jamais une date. **Bug réel trouvé en testant en direct avant tout câblage (Article 3/19)** : un
premier essai avec un plancher de date (« 2026-09-21 ») remontait plus de 40 tâches du jour même
comme fausses alertes, la quasi-totalité de la session en cours — une date ne peut pas séparer
« avant l'existence du mécanisme » de « après », puisque ce jour-là contient déjà des dizaines de
tâches. Le plancher au numéro (332, la dernière tâche couverte par le balayage rétrospectif manuel
de `docs/idees-a-trancher.md`) résout ça proprement, un numéro étant strictement croissant et sans
ambiguïté de fuseau horaire (même principe que `filterByZoom()` plus haut dans ce document).

`loadIdeaDecisions(registryText)` lit `docs/idees-a-trancher.md`, qui porte DEUX tableaux markdown à
des largeurs de colonnes différentes (le balayage rétrospectif à 4 colonnes, les idées nouvelles à
5). **Second bug réel trouvé en testant en direct** : une première version lisait la décision à un
index de cellule fixe, qui ne correspond qu'au tableau à 5 colonnes — corrigée pour détecter la
cellule décision PAR VALEUR (elle correspond à l'un des 4 mots connus) plutôt que par position, et
pour n'extraire un numéro de tâche que via `#(\d+)` strict (un `\d+` nu confondait un vrai numéro de
tâche avec un chiffre de référence de section, ex. « §8ter »).

`findIdeasNeedingDecision(candidates, decisions)` ne resurfait jamais une idée déjà « fichier créé »
ou « abandonnée » (finales), mais continue de resurfacer une idée « entre-deux » à chaque appel — le
comportement explicitement demandé (« L'alerte remontera alors une deuxième fois [...] tant qu'aucun
fichier n'a été créé »).

**Troisième bug réel, trouvé au tout premier passage contre le vrai dépôt** (le crochet pre-commit a
bloqué le commit lui-même) : la tâche de suivi documentant CE mécanisme (#333, construite et close
dans le même tour, sur ordre explicite de l'utilisateur) s'est retrouvée signalée à tort comme
« idée en attente d'une décision ». `detectPendingIdeaCandidates()` exclut donc aussi toute ligne
dont `statusKey === "terminee"` — une tâche déjà terminée documente un travail déjà livré, la
question ne se pose plus quel que soit le libellé de son Sujet, exactement le même principe que le
balayage rétrospectif manuel (qui n'a jamais recensé de décision pour les dizaines de « Nouvel
outil » déjà closes de l'historique).

## Contexte d'onboarding et badge (`buildRealOnboardingContext()`)

Avant chaque génération, `main()` construit un contexte réel (CLAUDE.md, la table des outils de
`docs/regles-de-travail.md`, l'arborescence de `docs/`, le texte de `docs/suivi/sessions/`, les
déviations connues comme celle de THE-DEEP-READER) et le passe à `suggestToolsForOpenTasks()` —
zéro coût API, uniquement des lectures de fichiers déjà sur disque. Trouvaille réelle du
2026-09-20 : check-tasks-details.mjs était l'UNIQUE appelant réel de `suggestPrestationsForTask()`
en production et ne passait jamais ce contexte — le badge « 🎖️ Membre certifié »/« ⚠️ Pas encore
certifié » (`checkAgentOnboarding()`, `le-coordinateur.mjs`) n'était donc jamais réellement vérifié
nulle part malgré son propre chokepoint déjà construit. Corrigé le même jour : quand une prestation
suggérée pointe vers un Agent sans badge, la ligne du rapport porte désormais un avertissement
visible (`⚠️ ...`).

## Recommandation de l'ordre des prochaines tâches (`recommendNextTasks()`)

Ajouté le 2026-09-20, demande explicite de l'utilisateur : « check tasks recommande en fin de
rapport l'ordre des 4 prochaines tâches [...] d'après des critères pertinents et bien définis ».
Toujours calculé sur TOUTES les tâches ouvertes du projet, jamais seulement celles du zoom affiché
— un jugement de priorité project-wide. Cinq critères combinés en un score, chaque tâche portant
ses raisons en clair (`reasons`) plutôt qu'un chiffre opaque :
1. **Sensibilité déclarée** dans le suivi (`critique`/`important`/`normal`).
2. **Stagnation** — calculée en amont par `compareSnapshots()`/`consecutiveOpenStreak()`, un vrai
   décompte de rapports consécutifs, jamais un simple booléen.
3. **Ancienneté** de la tâche (`daysSince()`, réutilisé de `circle-tasks.mjs`).
4. **Priorité explicite** exprimée par l'utilisateur dans le texte du suivi (keyword-match, jamais
   une compréhension d'intention).
5. **Corroboration par les autres vigies** — ajoutée en cours de construction, le même jour,
   question explicite de l'utilisateur sur la vraie compréhension de l'outil (« comment bien
   cabler cet outil avec toi pour que tu en profites quand tu en as besoin ? ») : lecture SEULE des
   registres déjà existants (`docs/argus/index.md`, `docs/harmonia/index.md`,
   `docs/axa-check/index.md`, `docs/clean-dirty-old/index.md`, via `loadRegistryFindings()`/
   `parseRegistryTable()`) et rapprochement de mots-clés (`corroborateWithRegistries()`, même seuil
   et même tokenizer que `suggestPrestationsForTask()`, réutilisé tel quel).

**Affiné le même jour** (« l'echelle dvrait s'affiner [...] permettre une meilleure comparaisone
netre les taches ») : trois de ces cinq critères passent d'un forfait fixe à un calcul progressif —
stagnation (score selon le streak réel, plafonné à 6), corroboration (score selon le nombre de
vigies + la force du rapprochement), priorité explicite (deux paliers : « priorité absolue » pèse
plus qu'un simple « en priorité »/« priorité explicite »). La sensibilité déclarée et l'ancienneté
restent inchangées — décision explicite de l'utilisateur de ne PAS toucher aux 4 cases de
sensibilité elles-mêmes : des centaines de tâches déjà loguées dans `docs/suivi/` portent déjà l'un
des 3 mots réels (`autre` n'est qu'un panier de secours en code, jamais un 4e niveau voulu), et la
doctrine déjà actée du projet (« Fidélité au prompt — portée non rétroactive »,
`docs/systeme-de-suivi.md`) interdit de réécrire une classification passée de mémoire — un
affinage produirait un suivi à deux résolutions pour toujours, jamais un gain qui justifie ce coût
tant que les trois autres affinages suffisent à départager les tâches.

**Jamais une décision automatique.** Une tâche fermée ou sans aucun signal réel sur les 5 critères
est exclue plutôt que forcée dans la liste. Le protocole de lecture (`docs/regles-de-travail.md`,
section « Moi (l'agent) → check-tasks-details ») exige que le rapport soit toujours livré en
fichier séparé ET lu en entier avant toute réponse, et que l'utilisateur confirme explicitement
avoir lu le rapport avant que l'agent n'ouvre la fenêtre de questions qui propose cet ordre — la
décision finale sur l'ordre réel des prochaines tâches reste toujours celle de l'utilisateur.

## Rendu et registre

Rendu HTML via le gabarit générique déjà existant du projet (`scripts/html-report.mjs`), enrichi
d'un nouveau type de bloc `tree` (arborescence imbriquée, ajouté ce jour — aucun rapport existant
n'en avait besoin avant celui-ci, même règle que les blocs `code`/`image`/`dialogue` précédents :
enrichir le vocabulaire commun plutôt que forker une page à part). Fichiers écrits dans
`docs/check-tasks-details/` (un `.html` par génération, `historique.jsonl` pour les instantanés,
`index.md` pour le registre humain).

## Coût

Gratuit — aucun appel API, coût token limité à la taille de `docs/suivi/` relu (proportionnel au
nombre de tâches, jamais un chiffre fixe).

## KPI

Suivi dès la création (même discipline que THE-DEEP-READER/ALWAYS-NEW-CODE) : nombre de
régressions/stagnations réellement confirmées comme de vrais oublis (par opposition à un faux
positif du seuil de stagnation) — mesuré au fil des générations suivantes, encore à zéro passage au
moment de la création de ce document.


## Le rapport de Ronde en quatre parties (2026-09-22, tâche #357)

Demande explicite de l'utilisateur : « un rapport txt, dans le cadre des rondes [...] un rapport en
plusieurs parties qui traitent de sujets differents [...] capable de dire ou on en est dans le
projet, oeil critique, avec differents zoom, differents regards ».

**Quatre parties, calibrées par quatre questions avant tout code :**

1. **Les chiffres vérifiés du suivi** (`suiviFigures()`) — total, répartition par statut, fenêtre de
   numérotation réelle, numéros manquants et en double, rythme d'ouverture à 1/7/30 jours,
   répartition par thème. « Vérifiés » au sens strict : les incohérences internes sont signalées
   plutôt que lissées.
2. **Où en est le projet, vu de haut** (`projectStanding()`) — un chantier = une entrée de
   `CHANTIER_PRELIMINARY_FILES`, la liste déjà tenue pour le contrôle de fraîcheur (jamais une
   seconde liste en parallèle, Article 24). Pour chacun : avancement, tâches ouvertes, jours depuis
   le dernier mouvement, et le constat fort « annoncé, jamais commencé » quand aucune tâche ne s'y
   rattache.
3. **L'œil critique** (`criticalEye()`) — uniquement des constats CHIFFRÉS : tâche immobile depuis N
   rapports (gravité forte au-delà de 5), chantier jamais commencé, chantier figé, déséquilibre
   outillage/jeu au-delà de 70 %, incohérences de comptage. Un test dédié exige que chaque constat
   porte son chiffre — il a attrapé le seul qui n'en portait pas.
4. **L'état détaillé, aux trois zooms** — les trois zooms dans le MÊME rapport plutôt qu'un à choisir
   au lancement : un item de Ronde tourne sans personne pour arbitrer.

**Limite honnête, écrite dans le rapport lui-même** : ces quatre parties comptent ce que le SUIVI dit
du projet, jamais ce que le projet est réellement. Un travail fait sans être consigné leur est
invisible.

**Format** : `node scripts/check-tasks-details.mjs ronde` écrit un txt (la version archivée, relue
par les outils) ET un HTML (la version de présentation), tous deux tirés des mêmes données — jamais
deux calculs qui pourraient diverger.

**Intégration à la Ronde** : item `check-tasks-report`, thème « Suivi des chantiers » (et non
« Suivi & référentiels », déjà à la limite réelle de 4 options par question de la fenêtre à cocher).
Ses constats rejoignent la série de questions à choix forcé de l'Étape 5, jamais un rapport qu'on
peut ne pas ouvrir. Le changement lui-même est consigné dans `CIRCLE_ITEMS_CHANGELOG`
(`scripts/circle-process-guardian.mjs`), avec son garde-fou mécanique
`findItemsMissingFromChangelog()`.

**Première trouvaille réelle, dès le premier lancement** : 4 tâches CASSANDRA-RH ouvertes et
identiques depuis 20 rapports consécutifs, et 93 % des tâches tracées portant sur l'outillage de
travail contre 7 % sur le jeu lui-même.
