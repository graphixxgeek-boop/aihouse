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
concerne un chantier connu (mot-clé sur Sujet/Sous-sujet, **jamais le Détail** — cf. les deux faux
positifs de 2026-09-22 plus bas) à la dernière modification réelle
(git, `lastTouchDays()` de CLEAN-DIRTY-OLD, jamais un second calcul divergent) de son fichier
dédié. Signale un écart honnête — idée notée en suivi, jamais recopiée — jamais une certitude
d'oubli, avec une tolérance d'une journée pour un commit groupé le même tour. **Faux positif réel
trouvé et corrigé le soir même de sa construction, en le lançant en direct contre le vrai dépôt** :
l'horodatage narratif d'une ligne de suivi suit la date "aujourd'hui" donnée en tête de session, qui
peut courir devant l'horloge système réelle de plusieurs heures à une journée entière (décalage
constaté : système à `2026-09-21 04h35 UTC` pendant qu'une ligne fraîchement écrite portait
`2026-09-22T06:30Z`) — sans clamp, cet écart d'horloge produisait un âge de tâche négatif et donc un
"retard" fabriqué. Corrigé en clampant l'âge d'une tâche à 0 minimum, jamais en dessous.


**Deux autres faux positifs réels, trouvés le 2026-09-22 en faisant tomber le garde-fou live** (le
test qui vérifie « aucun écart » contre le vrai dépôt a cassé la construction, exactement son rôle) :

1. **Une MENTION n'est jamais une APPARTENANCE.** La tâche #304, dont le Détail dit « continuer à
   enchaîner les tâches ouvertes sans s'arrêter (**sauf pour la refonte graphique**) », était comptée
   comme une tâche DU chantier refonte graphique — le sens exactement inverse de ce qu'elle dit. Le
   Détail est un récit libre : un chantier peut y être cité en passant, en comparaison, ou justement
   pour être écarté. Le rattachement ne lit donc plus que **Sujet et Sous-sujet**, les deux champs de
   CLASSEMENT que l'agent choisit délibérément en notant la tâche. Vérifié qu'on ne perd aucune vraie
   détection : un chantier réellement traité est toujours classé, jamais seulement raconté.
2. **Un verdict qui contredisait sa propre phrase.** Le message affichait « (1.0j) plus récente que
   ... (1.0j) » — dans la tolérance — tout en déclenchant l'alerte, parce que la comparaison tournait
   sur des fractions non arrondies (`1.03 > 0.004 + 1`). Cette fraction n'est que du décalage
   d'horloge entre l'horodatage narratif du suivi et l'horloge système de git, exactement ce que
   `TOLERANCE_DAYS` existe pour absorber. La comparaison se fait désormais à la granularité du
   **jour entier**, la seule que la tolérance ET le message expriment tous les deux.

Même racine que plusieurs autres corrections du même jour ailleurs dans le projet : **une absence de
mesure, ou une mesure approchée, lue comme une mesure ferme** (Article 3 — la cause, jamais le
symptôme).

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

## Sous-commande `poids` — le poids, la vignette, le résumé de tête et l'origine

*(2026-09-24, chantier 5 du plan de nuit. La convention elle-même — ce qu'est une tâche lourde, ce
qu'est un résumé de tête, ce que vaut la marque `AUTO-ATTRIBUÉE` — vit dans
`docs/systeme-de-suivi.md`, jamais recopiée ici : c'est une règle du SUIVI, pas une particularité de
cet outil. Ce qui suit dit seulement comment l'outil la mesure.)*

**Format** : `node scripts/check-tasks-details.mjs poids`.

**Sous-commande à part, et c'est délibéré** : ce que cette sortie sert à faire — décider de découper
un chantier avant de le lancer — n'est pas ce que sert le rapport d'état. Mêler un outil de décision
à un outil de constat aurait noyé le premier.

**Ce qu'elle rend** :

| Bloc | Ce qu'il dit | Ce qu'il ne dit jamais |
|---|---|---|
| Poids | combien de tâches sont LOURDES, sur le registre entier et parmi les ouvertes | dans quel ordre les traiter — c'est le palier de priorité, et les deux ne se remplacent pas |
| Vignettes | trois à quatre lignes par tâche ouverte lourde, avec le découpage proposé | une découpe appliquée : les morceaux sont lus dans la ligne, jamais déduits |
| Résumé de tête | quelles lignes longues ne diraient plus rien d'elles-mêmes si elles étaient tronquées | si le résumé est BON — seulement s'il existe et s'il est court |
| Origines | la répartition utilisateur / outil / agent, et combien de lignes ne le disent pas | que zéro auto-attribuée veut dire zéro : tant que la marque n'est pas en usage, la part est déclarée NON MESURABLE |

**Les deux corrections du premier vrai passage**, gardées en contre-tests parce qu'elles disent
mieux que le code ce qu'il ne faut pas refaire :

1. La ligne de poids affichait « 40 lourdes sur 609 » trois lignes sous un en-tête parlant de 43
   tâches ouvertes, sans dire que les deux périmètres n'étaient pas le même — et 40 se lisait comme
   40 chantiers en attente, alors qu'il y en avait **zéro** d'ouvert.
2. La répartition des origines a rendu « agent 0 » sur le registre réel. Un bulletin de santé, tiré
   d'une marque inventée dix minutes plus tôt qu'aucune ligne ne pouvait porter.

**Chiffres du premier passage réel (2026-09-24)** : 609 lignes, 43 ouvertes · 40 lourdes, dont 0
ouverte · 343 lignes longues, dont **39 sans résumé de tête exploitable** · origines déclarées
159/609 (utilisateur 119, outil 40, agent 0 non mesurable), 450 lignes silencieuses.

## L'émiettement de la file — a-t-on coupé trop fin ? (2026-09-25, tâche #735)

`node scripts/check-tasks-details.mjs emiettement`

**Le pendant EXACT de `poids`, et c'est pour ça qu'il vit à côté plutôt que dedans.** `poids`
demande « cette tâche est-elle trop GROSSE pour être lancée d'un bloc ? » ; celui-ci demande
« avons-nous coupé trop FIN ? ». Les deux défauts sont opposés et se paient différemment : une
tâche trop grosse se traîne, cinquante trop fines noient la file et font perdre le fil.

**Trois signaux, pas un de plus :**

1. **Concentration par thème** — dix tâches ouvertes sur un même thème sont probablement une seule
   mal découpée.
2. **Part de légères** parmi les ouvertes — `poidsDeLaTache()` est RÉUTILISÉ, jamais un second
   barème (Article 24 : un seuil se dérive, il ne se recopie pas).
3. **Durée de vie** — lue sur la convention du suivi elle-même (« CLÔTURE DE #NNN » plus son propre
   horodatage), jamais via un champ neuf que personne ne remplirait. La **médiane**, jamais la
   moyenne : une seule tâche restée ouverte trois semaines la tirerait à elle seule.

**Premier passage réel (2026-09-25)** : 116 ouvertes sur 49 thèmes · le plus dense est *Process*
avec 11 (9,5 %) · **87,1 % de légères** · médiane de vie 8,8 h sur 9 clôtures lisibles (sur 618
fermées en tout — la convention est récente, et ce dénominateur voyage avec le chiffre) · le rythme
**ralentit** : 4,7 tâches/h sur les 50 dernières contre 22,9 sur les 50 précédentes.

### Ce qui ne se mesure PAS, et qui est déclaré plutôt que deviné

**« Trop de tâches » n'a AUCUN seuil absolu**, et aucun n'est proposé. Un chantier de fond en
produit légitimement dix sur un thème ; une journée de correctifs en produit trente légères sans
que rien ne cloche. L'outil montre une **tendance** contre le passé du projet lui-même — seul
étalon qui veut dire quelque chose ici — et dit si elle s'accélère. Jamais un verdict, jamais un
ordre de regrouper. De même, une tâche fermée en trente minutes n'est pas forcément une tâche de
trop : elle peut avoir été bien cadrée. Le chiffre ouvre une question, il ne la tranche pas.

Une tendance calculée sur moins de deux fenêtres complètes est **refusée** plutôt que produite :
une tendance inventée se lit exactement comme une vraie.

---

## La STRATÉGIE DE CHANTIER, et sa FICHE LÉGÈRE *(2026-09-26)*

L'outil des tâches porte aussi, depuis le 2026-09-26, le mécanisme du process PRÉ-CHANTIER
(`docs/pre-chantier-process-detail.md`). **Pourquoi ici et pas dans un 89e script** : une stratégie
est LIÉE À UNE TÂCHE — c'est l'étape B3 du process — et l'outil qui tient les tâches est le seul
qui puisse rendre ce lien mécanique au lieu de le laisser à la main.

### Les quatre commandes

| Commande | Ce qu'elle fait |
|---|---|
| `strategie creer <n°\|-> "<nom>"` | le squelette 7 sections, lié à la tâche — une stratégie sans tâche le crie |
| `strategie creer --legere <n°> "<nom>"` | la **fiche légère** : 2 sections seulement (`pourquoi`, `idees`) |
| `strategie ajouter <nom> <section> <idée>` | verse une idée **intégralement**, entre guillemets, avec sa source |
| `strategie promouvoir <nom>` | transforme une fiche légère en stratégie complète, **sans toucher un mot** |
| `strategie livrer <nom>` | le document, pour l'étape D |

### La fiche légère — pourquoi 2 sections, et pourquoi elles gardent leurs numéros

*(Sa décision en fenêtre : « choisissons ensemble au cas par cas : quels chantiers importants
méritent d'être convertis ? avec une solution légère pour les autres ».)*

**Le problème qu'elle règle est le revers exact de la stratégie complète** : sept sections devant un
sujet qui n'a que deux idées, c'est cinq sections vides qui disent « ce chantier n'a rien » alors
qu'il n'a simplement pas encore démarré. Un document à 70 % vide se lit comme un abandon, et
personne ne verse une idée de plus dans un document qui a l'air mort.

**Les deux sections ne sont pas des sections nouvelles, ce sont les MÊMES** — clés identiques,
titres identiques, numéros identiques (`SECTIONS_LEGERES` est un filtre sur `SECTIONS_STRATEGIE`,
jamais un second catalogue : Article 24). Conséquence voulue : `verserDansStrategie()` et le
garde-fou anti-résumé fonctionnent dessus sans une ligne de code de plus.

**La numérotation garde ses trous** — « 1. » puis « 3. », jamais renumérotés en 1 et 2. C'est la
règle que la charte s'applique à elle-même en tête de `CLAUDE.md`, et pour la même raison : un
numéro qui désigne deux choses selon le document où on le lit est une dette de reprise
(Article 27). Le trou dit aussi quelque chose d'utile — il montre ce qui manque encore.

**La promotion est ce qui rend le format léger acceptable.** Sans elle, choisir « léger » serait
choisir un cul-de-sac, et la vraie question deviendrait « ce chantier est-il assez important ? » —
exactement celle qu'il a refusé de trancher à l'avance. `promouvoirStrategie()` rétablit l'ordre
canonique des sept sections, conserve mot pour mot ce qui était écrit, et **conserve ET signale**
une section hors catalogue plutôt que de la supprimer : un convertisseur qui jette ce qu'il ne
reconnaît pas rend un document propre dont il manque une partie, et rien ne dit laquelle.

**Le format se LIT sur le document** (`formatDeStrategie()`), il ne se déclare pas en tête : une
mention « fiche légère » écrite à la création cesserait d'être vraie à la première promotion, et
rien ne le verrait.

### Premier usage réel (2026-09-26, tâche #904)

Cinq fiches légères créées pour les cinq familles de la file qui n'ont pas de stratégie complète —
**cinq, et non quatre comme le plan de nuit l'annonçait** : le plan comptait « 8 familles moins
4 stratégies », mais l'une des quatre stratégies (EXPORT & COMMERCIALISATION) n'est pas une famille
de la file, elle les traverse. L'écart est dit plutôt que corrigé en silence.

63 idées versées intégralement, chacune sourcée sur sa ligne de suivi : Process & Ronde (23),
Outillage & garde-fous (17), Charte & référentiel (13), Données & mesure (8), Le jeu et le site (2).
**Ce que la section POURQUOI de chacune dit honnêtement** : l'intention n'a jamais été énoncée par
l'utilisateur pour ces familles — elle est DÉRIVÉE de la file. Tant qu'elle ne porte pas ses mots,
la fiche dit ce que la file contient, jamais ce qu'il veut en faire. C'est la différence entre un
inventaire et une stratégie, et c'est le premier trou à combler.

---

## La GESTION DES TÂCHES — les trois courbes, le filtre, le refus de clôture *(2026-09-26, #905)*

Sa peur, dans ses mots : « il faut gérer ca, on peut pas laisser le travail en mode tapis roulant ou
enfoncement (plus de taches qui se génèrent que de taches accomplies) ».

### 1. Les trois courbes — `check-tasks-details courbes [jours]`

**Jamais un solde net**, et c'est sa décision explicite : « ouvertes moins fermées » vaut zéro aussi
bien quand rien ne se passe que quand trente tâches lourdes sont closes pendant que trente légères
naissent. Trois séries par jour, séparées :

1. **Fermées** par jour.
2. **Nées** par jour, séparées en *ce qu'il demande* / *ce que la machinerie engendre* / *indéterminé*.
3. **Poids moyen** et répartition ⬛ / ◧ / ▫ — sa nuance : « ca ne me dérange pas si dans la rotation,
   la proportion de grosses taches diminue au profit de petites taches rapides ».

**L'origine n'est pas remesurée ici** : `courbeDeLOrigine()` relaie `origineDeLaTache()`, qui existe
depuis le 2026-09-24, via la table `ORIGINE_VERS_COURBE`. Un second classificateur avait commencé à
s'écrire avant que le module ne refuse le doublon — leçon **L29**. La table range `outil` et `agent`
du même côté : du point de vue de l'utilisateur, une tâche née d'une trouvaille d'outil et une tâche
que l'agent s'est donnée sont le même phénomène — du travail que personne n'a commandé.

**LE VERDICT REFUSE DE CONCLURE quand la part indéterminée domine.** Au premier passage réel, 77 %
des lignes n'avaient pas d'origine lisible : un « pas de tapis roulant » appuyé là-dessus aurait été
un satisfecit rendu sur des données absentes. Le motif d'origine a été élargi aux formes réellement
écrites ici (« Sa demande du … », « Son gros prompt du … ») : 77 % → 68 %. L'épisode a coûté la
leçon **L28** — le drapeau `/i` perdu en chemin avait fait EMPIRER la mesure tout en ayant l'air
d'une amélioration.

### 2. Le filtre avant création — `check-tasks-details filtre "<le sujet envisagé>"`

Sa demande : « je veux ajouter une toute premiere action au debut : verifier que cette tache n'existe
pas deja, et si elle peut etoffer une tache existante plutot que creer une nouvelle tache ».

C'est **la seule action qui peut faire que la tâche n'existe pas** — tout le reste du rituel
s'applique à une tâche déjà née. Trois issues, jamais une décision automatique : `ne-pas-creer` ·
`etoffer` · `creer`. La ressemblance est un Jaccard sur les mots significatifs (un chiffre qu'on
peut recalculer à la main est un chiffre qu'on peut contester), deux seuils parce que sa demande
porte trois issues, et **seules les tâches OUVERTES sont comparées** : une tâche close ne peut pas
être étoffée, et la signaler ferait renoncer à un travail qu'il faut refaire. Un mot-clé déjà pris
est reporté **à part** du score : le registre l'impose unique, donc c'est une règle enfreinte, pas
un indice.

### 3. Le refus de clôture sans la case APRÈS

Sa décision : « la case à cocher devient une condition, pas une intention ». Les deux colonnes
existaient depuis #872 et `findRituelManquant()` les MESURAIT très bien — mais un taux de 60 %
s'affiche et ne bloque rien. `findCloturesSansRituel()` (`check-suivi-fidelity.mjs`) refuse
désormais une ligne close dont la case APRÈS est vide ou à NON, à partir du seuil #872 seulement
(accuser 870 lignes écrites avant que la colonne existe est la leçon L4). **Seule la colonne APRÈS**
est concernée : on ne peut pas refuser l'ouverture de quelque chose qui n'existe pas encore.

**Il a mordu à son premier passage**, sur une ligne close la nuit même — #898, case APRÈS à NON. La
ligne n'a pas été retouchée : une ligne CLOSE du suivi historique ne se réécrit pas sans lui.

### 4. L'harmonisation qu'il a demandé de vérifier, et les deux écarts trouvés

« verifie que tous les nouveaux sujet traités ensemble s'harmonisent bien avec l'existant, reperes
les redondances. [...] on a instauré des blocs de taches (par theme/rafale) est-ce que tout le
systeme a bien été mis à jour par rapport à ca ? » — **la réponse mesurée était NON, deux fois.**

1. **La vue par thème portait sa propre copie de `OPEN_KEYS`**, recopiée à la main. Les deux disaient
   la même chose ce jour-là ; le jour où un statut aurait rejoint `OPEN_KEYS`, la vue par thème
   aurait cessé de le voir **sans rien dire**, et une famille se serait vidée toute seule. `OPEN_KEYS`
   est désormais exporté, et `findListesDOuvertureEnDur()` relit le code pour refuser une seconde
   copie — le garde-fou que l'Article 24 exige derrière toute liste.
2. **Deux découpages de thème concurrents** : la vue lisait un « / » nu, les blocs lisent `splitSujet()`
   (« / » entouré d'espaces). Zéro ligne d'écart sur le registre du jour, mesuré avant de toucher —
   mais « Suivi/file » aurait été rangé sous deux têtes différentes selon la vue. Unifié sur
   `splitSujet()`.
