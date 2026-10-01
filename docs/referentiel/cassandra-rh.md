# CASSANDRA-RH — instanciation pour ce projet

Cf. `docs/cassandra-rh-blueprint.md` pour le principe générique. Ce document ne décrit que ce qui
est propre à ce projet. Historique complet des décisions de calibrage (16+ échanges, deux rounds de
questions) : `docs/cassandra-rh-conception.md` — conservé comme récit fondateur, remplacé comme
source de vérité opérationnelle par ce triptyque (`docs/cassandra-rh-blueprint.md` + ce fichier +
`docs/cassandra-rh/`).

## Statut

Agent (`scripts/cassandra-rh.mjs`, tâche #184, noyau fiabilisé le 2026-09-21) — Agent Cadre dans
l'organigramme (`AGENT_CATEGORIES`, `lib-shell.mjs`), au même rang que LE-COORDINATEUR mais avec sa
propre connaissance propre au projet (statut "Agent" plein, jamais "classique").

## Mécanisme

- **Effectif** — `teamRoster()` filtre la table maîtresse (`docs/regles-de-travail.md`) sur les
  lignes de statut "Agent" (les seules éligibles au badge), calcule le slug par le même découpage
  `primaryName` déjà établi ailleurs (avant slugification, jamais le texte entier d'une colonne
  Outil qui porte parfois une précision entre parenthèses), puis résout la catégorie via
  `AGENT_CATEGORIES`. `teamSizeSnapshot()` en tire un constat chiffré honnête par catégorie —
  jamais un jugement "trop"/"pas assez".
- **Badge** — `computeBadgeResults()` appelle `checkAgentOnboarding()` (`le-coordinateur.mjs`) une
  fois par membre du roster, avec le contexte réel produit par `buildRealOnboardingContext()`
  (`check-tasks-details.mjs`, déjà éprouvé en production — jamais une seconde construction de
  contexte). `badgeOversightSummary()` agrège en certifiés/non-certifiés — jamais un second calcul
  de couverture.
- **KPI** — `loadKpiTrend()` lit `docs/referentiel/kpi-historique.csv` (produit par
  `kpi-report.mjs`, jamais recalculé ici) et compare les deux dernières mesures réelles disponibles
  par famille — une cellule vide reste `undefined`, jamais une valeur fabriquée.
- **Outils à retirer ou refondre** — `toolsToReconsider()` combine `toolsNeverUsed()`
  (`tool-usage.mjs`) et `relativeStaleness()` (`clean-dirty-old.mjs`, appliqué aux scripts via
  `AGENT_SCRIPT_FILES` d'`axa-check.mjs`) — jamais un troisième calcul de pertinence inventé.
  Enrichi le 2026-09-21 (3 idées neuves approuvées par l'utilisateur, « OK GO ») de trois éclairages
  supplémentaires, chacun une relecture, jamais un second calcul : (1) un objectif chiffré « en
  dessous » (`objectifs-vs-resultats.mjs::buildObjectifsReport()`, `row.entite` porte déjà le slug)
  renforce un « jamais sollicité » déjà présent, jamais un déclencheur indépendant ; (2)
  `tokenInvestmentVerdict()` relit le dernier verdict déjà enregistré par
  `classifyConsumption()`/`recordAction()` (SMART-CONSO-TOKEN, `.smart-conso-token-history.json`)
  dont le `context` mentionne le slug — une correspondance textuelle honnête, aucune convention
  stricte de nommage n'existant avant ce soir pour relier une action SMART-CONSO-TOKEN à un outil
  précis ; (3) un registre `doc-report.mjs::buildDocReportIndex()` jamais committé (`ageDays`
  indéfini) signale que personne ne consulte jamais la SORTIE de l'outil, distinct de « l'outil
  lui-même jamais lancé ».
  **Corrigé le 2026-09-27 (tâche #1007) — le compteur était AVEUGLE aux appels par import.**
  `recordCliUsage()` n'enregistre qu'un lancement en ligne de commande : un outil appelé par
  `import` depuis un autre script, ou lancé par un crochet git, ne laisse aucune trace. Son zéro
  mesurait donc son SILENCE, jamais son inactivité — et les deux s'écrivent 0 (leçon L11). Sur 10
  outils désignés « à retirer », la moitié travaillaient en permanence. `invisiblesAuCompteur()`
  rétablit la distinction : il DÉRIVE la liste des outils hors de portée (recensement du
  classificateur pour les appelants réels, dossier `scripts/hooks/` pour les crochets, le compteur
  lui-même qui ne peut structurellement pas se compter) plutôt que de recopier des noms
  (Article 24). Deux pièges traversés : la version trop étroite ratait `check-suivi-fidelity`
  (23 importeurs) ; la version trop large sortait 73 outils sur 90, parce que `check-house.mjs`
  importe 81 % du parc — **tester un outil n'est pas l'exécuter**, et la suite de tests se DÉTECTE
  (`findSuitesDeTest()`, à la part du parc qu'elle importe) plutôt qu'elle ne se nomme. Résultat
  réel : 10 faux candidats → 5 vrais. Le signal n'est jamais supprimé, il est **requalifié** —
  l'outil invisible reste listé avec « zéro d'usage NON INTERPRÉTABLE », parce que le taire ferait
  disparaître pour de bon une bibliothèque réellement morte. Le « signal renforcé » (objectif en
  dessous + jamais sollicité) est retiré dans ce cas : une somme dont un terme n'est pas
  interprétable ne l'est pas non plus, et la laisser passer réaffirmerait par la bande le verdict
  que la ligne précédente vient d'écarter. Si le recensement est illisible, `mesurable: false` — on
  ne suppose PAS que tout le monde est visible.
- **Recrutement** — squelette à 3 étapes (`cv_provisoire` → `entretien_preliminaire` →
  `proposition`), chaque avancée exigeant une décision explicite (`avancer`/`rejeter`), un dossier
  clos jamais rouvert silencieusement. Aucune vraie recherche web à ce stade — hors périmètre de
  cette première vague, jamais deviné.
- **Personnage fixe** — `CASSANDRA_PERSONA` (directrice RH exigeante mais juste), reproduit mot pour
  mot par l'agent qui narre un rapport, jamais reformulé.

## Bug réel trouvé et corrigé en fiabilisant ce brouillon (2026-09-21)

`teamRoster()` slugifiait le texte ENTIER de la colonne Outil, y compris une précision entre
parenthèses ("CLONE-HUNTER (`scripts/clone-hunter.mjs`)", "memory-audit (anciennement...)"),
produisant un slug jamais présent dans `AGENT_CATEGORIES` — 4 Agents réels (CLONE-HUNTER,
memory-audit, find-booster, objectifs-vs-resultats) affichés à tort comme « catégorie non
répertoriée ». Corrigé avec le même découpage `primaryName` déjà établi ailleurs dans ce paysage —
vérifié en direct : zéro Agent réel non catégorisé après correctif.

## Déclenchement

- **Léger** — `node scripts/cassandra-rh.mjs` (sans argument), signal en une ligne : effectif,
  nombre sans badge, tendance KPI. Destiné à rejoindre chaque Ronde CIRCLE-TASKS.
- **Lourd** — `node scripts/cassandra-rh.mjs rapport`, bilan complet en HTML (via `html-report.mjs`).

## Trous d'équipe — couverture de test fragile (2026-09-21)

Calibrage explicite : « CASSANDRA doit être capable de voir s'il n'y a pas de trous dans
l'organisation [...] elle a accès à tous les outils, tous les rapports qui peuvent lui servir ».
Lecture retenue après clarification : « trous dans l'ÉQUIPE » (jamais dans la structure
documentaire du projet — ce second sens resterait le rôle d'un futur outil séparé, jamais
dupliqué ici). `runAxaCheckCoverage()` relance réellement une instrumentation V8 (même mécanique
exacte qu'`axa-check.mjs::main()`, jamais une seconde façon de la produire) — **uniquement dans le
rapport complet** (`node scripts/cassandra-rh.mjs rapport`), jamais dans le signal léger, qui
resterait sinon coûteux à chaque Ronde. `computeCoverageGaps()` (pure, testable) signale tout
membre en dessous de 100% de couverture ou jamais scanné — un poste dont personne ne peut
garantir qu'il tient la route, un « trou » RH au sens propre.

## Nouveaux visages — Phase 1 (2026-09-21)

Calibrage explicite : « c'est typiquement le role de cassandra de verifier que chaque nouveau
membre est intégré selon le process, avec remise de badge à la fin et message ici dans la
conversation ». `detectNewArrivals()` compare le roster réel à `.cassandra-rh-known-members.json`
(local, jamais committé, même patron que `.badge-ceremony-history.json`) et `narrateNewArrivals()`
nomme chaque membre jamais encore vu — complet ou non, avec ses trous exacts s'il en a. Distinct du
badge mécanique de `checkAgentOnboarding()`/`announceBadgeCeremony()` (`le-coordinateur.mjs`) : ce
bloc répond à « je t'ai vu arriver », le badge répond à « tu es maintenant complet » — les deux
cohabitent sans se dupliquer. Uniquement dans le rapport complet (jamais le signal léger), et
toujours en tête du rapport — c'est le bloc que l'utilisateur veut voir défiler dans la
conversation.

## Reste hors de cette première vague (§8bis/§8ter de `docs/cassandra-rh-conception.md`)

Le Catalogue (rapport principal enrichi, combinaisons d'outils, score composite) et les 3
Stagiaires (Catalogue, Dossier KPI, Recrutement) restent une prochaine vague de construction —
jamais devinés ni anticipés dans ce noyau.

## Registre

`docs/cassandra-rh/index.md` — trouvailles réelles (un écart de badge confirmé, un outil signalé à
retirer et la décision prise) au fil des vrais passages, jamais un journal théorique.

**Jamais un jugement automatique** *(clause rapatriée depuis CLAUDE.md le 2026-09-22, même raison
que ci-dessus : elle n'était écrite que dans la charte.)* CASSANDRA-RH constate et rassemble —
effectif chiffré, supervision du badge, lecture du KPI, outils à retirer ou refondre, squelette de
recrutement en trois étapes. Elle ne PRONONCE jamais d'elle-même un verdict sur un membre de
l'équipe : chacun de ses signaux est un élément porté à la décision de l'utilisateur, jamais la
décision elle-même.

## Le récapitulatif des évaluations (2026-09-22) — elle le publie, elle ne le produit pas seule

Demandé mot pour mot : « je veux lors de la ronde le détail des KPI et/ou evaluations, notes qui
sont produites par certains outils, dans un fichier HTML normé bien mis en evidence [...] qui me
juge comment, de quelle maniere, sur quelles bases, avec quel resultat ».

**Pourquoi CASSANDRA** : elle est déjà la gardienne des objectifs et des KPI, donc elle lit déjà la
plupart de ces chiffres. Un outil de plus pour les rassembler aurait dupliqué son travail (§7ter).

**Ce qu'elle ne fait pas** : produire l'évaluation de l'utilisateur. Celle-là vient d'angel-of-ia-
process (Article 26) et CASSANDRA la RELAIE — exactement comme god relaie angel pour les process.
Personne ne centralise : angel produit sur la conduite, CASSANDRA assemble et publie.

**Fonction** : `buildEvaluationRecapBlocks()`, rendue en HTML par `renderHtmlReport()`. Cinq
sections séparées, comme demandé (« tout est clair et bien presenté, avec des separations ») : qui
te juge et sur quoi · les faits qui se comptent · mon jugement, annoncé comme une opinion et avec
son biais nommé · tes désaccords · et de l'autre côté, qui juge l'équipe d'outils.

**Item de Ronde** : `recap-evaluations`, thème « KPI & scans » — jamais un thème neuf pour un seul
item (la première tentative en avait créé un, attrapé le jour même par le garde-fou de thèmes).

## Sous-commande `uniformisation` — ce que la famille fait déjà, et qui s'en écarte

*(2026-09-24, chantier 2.2 du plan de nuit. `node scripts/cassandra-rh.mjs uniformisation`.)*

**La distinction avec le nivellement est le mécanisme lui-même, pas une nuance de vocabulaire :**

| | Nivellement (2.1, sous-commande `recensement`) | Uniformisation (2.2) |
|---|---|---|
| La norme vient de | `EXIGENCES_PAR_CLASSE`, écrite d'avance | la population elle-même, mesurée à l'instant |
| La question posée | « la règle est-elle tenue ? » | « pourquoi celui-ci fait-il autrement que ses semblables ? » |
| Ce qu'elle trouve | un manquement à une exigence déclarée | une habitude que personne n'a jamais écrite en règle |
| Son angle mort | rien de ce qui n'est pas déclaré | une famille uniformément mauvaise : aucun écart n'apparaît |

La seconde existe parce que la première est structurellement aveugle à l'habitude non écrite —
et c'est l'Article 24 appliqué au seuil lui-même : la norme est **dérivée**, jamais recopiée.

**Les trois garde-fous contre l'accusation à tort** (leçon L4 : un garde-fou qui accuse à tort
cesse d'être lu) :

1. **Famille de moins de trois membres : pas mesurée.** Une « majorité » de deux ne dit rien, et le
   taux qu'on en tirerait ressemblerait pourtant à une mesure.
2. **Pratique portée par moins de 60 % : pas une habitude.** Deux outils sur dix qui font quelque
   chose sont une minorité ; le signaler accuserait les huit autres.
3. **Pratique unanime : aucun écart.** Il n'y a rien à uniformiser.

**Et la sortie distingue deux zéros**, parce que les confondre était un faux vert de plus : une
famille dont toutes les habitudes sont unanimes est réellement uniforme ; une famille qui n'a
**aucune** habitude commune n'a rien dont s'écarter, ce qui est l'exact contraire d'un bulletin de
santé. Le premier jet écrivait « 0 habitude de famille, toutes unanimes » — une phrase qui se
contredit elle-même et se lit comme un vert.

**Premier passage réel (2026-09-24, 82 scripts, 7 familles)** : **un seul écart** — 11 outils sur 47
ne comptent pas leur usage, là où 77 % de leurs semblables le font. Les autres familles
(bibliothèques, crochets, infrastructure shell) ne partagent aucune habitude mesurable, ce qui est
dit comme tel et non comme une bonne nouvelle.

## La version de l'Agence entière (2026-09-25, tâche #730 → clôturée par #799)

`versionDeLAgence()` répond aux trois questions de l'utilisateur d'un coup : **oui** on peut
versionner l'Agence au global, **oui** c'est rétroactif, et **oui** les deux échelles sont
fiabilisées. Aujourd'hui : **v69.446**. Elle s'affiche en tête de `node scripts/cassandra-rh.mjs
versions`, là où il la cherchera.

**Ce qu'elle n'est pas, et c'est le cœur du choix** : ni la somme ni la moyenne des cinquante
versions par outil. La somme monterait à chaque faute de frappe corrigée dans n'importe quel
script. La moyenne **baisserait** le jour où un outil neuf (v0.1) rejoint l'équipe — un nouveau
membre ferait *reculer* la version de l'équipe. Les deux rendent un chiffre qui a l'air d'une
mesure sans en être une, et c'est le plus dangereux des deux défauts : un chiffre absent se voit,
un chiffre faux se lit.

**Ce qu'elle est, par analogie exacte avec la règle par outil** : pour UN outil le majeur compte
les commits qui ont touché sa surface exportée — ce qu'il sait faire. Pour l'AGENCE, la surface
c'est la **composition de l'équipe** : le majeur compte les commits où un outil a rejoint ou quitté
l'équipe. Rétroactif par construction, comme l'autre : tout est déjà dans git.

**Les trois axes candidats sont COMPTÉS, jamais seulement évoqués.** La tâche #730 en nommait trois
et le choix revient à l'utilisateur (Article 16) : équipe **69** · Gardiens sacrés du code **4** · charte **26**.
Il choisit donc entre trois chiffres réels plutôt qu'entre trois hypothèses ; tant qu'il n'a pas
tranché, « équipe » sert de défaut **déclaré** (`AXE_MAJEUR_PAR_DEFAUT`), jamais de décision prise
à sa place. Question ouverte : `docs/plans/version-agence-axe-majeur.md`, tâche **#800**.

**Le mineur ne peut pas devenir négatif**, et c'est structurel plutôt que rattrapé : le
dénominateur est commun aux trois axes (les commits qui touchent `scripts/` ou la charte) et les
commits majeurs en sont un sous-ensemble par intersection. Un compte négatif se lirait « tout
frais » au lieu de déclencher une alerte — exactement la faille 3 de l'Article 32.

### Les deux angles morts du majeur par outil, mis en échec EXPRÈS

La seconde moitié de sa demande — « peux tu fiabiliser toute cette partie stp » — ne se satisfait
pas d'un test qui confirme. Le majeur lit les lignes `+export`/`-export` du diff, donc :

- **il SURCOMPTE** quand une ligne d'export est seulement reformatée (un espace déplacé) : le diff
  bouge, la capacité non ;
- **il SOUS-COMPTE** quand une capacité s'ajoute sans toucher une ligne d'export — une entrée de
  plus dans un tableau déjà exporté. **Dans ce dépôt c'est le cas fréquent, pas un cas d'école.**

Aucun des deux ne se corrige sans lire le *sens* du code, ce que git ne sait pas faire. Les
déclarer là où le chiffre se lit (`VERSION_OUTIL_HORS_PORTEE`, imprimé par la sous-commande) vaut
mieux que de les taire : un chiffre dont on connaît la marge reste utile, un chiffre qu'on croit
exact ne l'est plus.

## La fiche agrégée d'un outil (2026-09-25, tâche #757 → clôturée par #806)

`node scripts/cassandra-rh.mjs fiche <nom-de-l-outil>`

Sa cible, reformulée avec lui : **« c'est quoi, ça sert à qui, ça pèse combien, et que coûterait de
s'en passer »** — et sa formule qui justifie le chantier entier : *« c'est chez qui ? c'est un sujet
export »*.

**LA RÈGLE DE CONCEPTION QUI COMMANDE TOUT : ne pas créer un quatorzième registre.** C'est le
réflexe naturel et ce serait l'erreur — sur les treize existants, quatre divergeaient déjà en
silence avant qu'un garde-fou ne les rattrape (audit d'évolutivité du 2026-09-21, Article 24). Un
quatorzième aurait divergé pareil, avec en plus l'autorité trompeuse d'une fiche « officielle ».

**Conséquence directe sur la forme du code, et c'est ce qui la rend défendable** : `ficheDeLOutil()`
ne lit rien elle-même. Elle reçoit les axes déjà calculés, chacun par la fonction qui le calcule
déjà et qui est déjà testée, et se contente de les assembler. **Elle ne peut donc pas diverger** :
il n'y a rien en elle qui puisse être d'un autre avis que la source. Treize champs, chacun nommant
l'axe qui l'a produit.

**Un champ manquant dit quel axe n'a pas répondu, jamais une case vide.** Une fiche à trous
silencieux se lit comme une fiche complète sur un outil pauvre — l'inverse exact de ce qu'elle veut
dire. Un nom qui ne désigne aucun script rend « pas de fiche » avec les noms proches, jamais une
fiche vide.

### Ce qu'elle a trouvé à son tout premier passage

La première fiche produite — celle de SAFE-EXPORT — affichait **« portée : non renseigné »**.
Mesuré dans la foulée : `TOOL_PORTEE` compte **13 entrées pour 50 outils réels**, soit **44 outils
(88 %) sans aucune portée déclarée**. Rien ne le signalait, parce que personne n'avait jamais
interrogé ce registre sur un outil qui n'y figurait pas — le patron exact de l'Article 24, une liste
tenue à la main sans garde-fou.

`findOutilsSansPortee()` le mesure désormais à chaque `cadrage`. Il **compte et nomme**, il ne casse
rien : 44 échecs bloqueraient le dépôt, et le chiffre descendra à mesure que le registre se
remplira. Tâche **#807**.

## L'avertissement de marge : déclaré, et réellement dit ? (2026-09-25, tâche #653 → clôturée par #808)

Le constat d'origine annonçait : *« 21 outils n'appellent jamais `printReliabilityNotice()` »*.
**C'était faux, et l'histoire de cette correction vaut d'être gardée** — la mesure s'est trompée
**quatre fois de suite**, toujours de la même façon : *une sonde qui ne PEUT PAS matcher rend
exactement ce que rend une sonde qui n'a rien trouvé.*

1. Chercher `printReliabilityNotice(` seul — en ignorant que `report-template.mjs` relaie déjà
   l'avertissement pour qui passe par lui.
2. Ajouter `renderTextReport` à la liste — en oubliant `printReportHeader()`, par lequel ecotoken
   imprime le sien. Trouvé **en lançant ecotoken**, pas en lisant son code (Article 25).
3. Dériver les relais depuis la source du gabarit — mais sans retirer les commentaires, ce qui
   classait `gravityLine` et `identityLines` comme relais parce qu'un commentaire citait le nom.
   **Un relais inventé est pire qu'un relais manqué** : il fait passer pour bavard un outil
   réellement muet.
4. Dériver la clé de registre depuis le NOM DE FICHIER — alors que le registre est indexé par SLUG
   d'outil. Cinq **doublons** ont été créés (`check-argus` à côté d'`argus`, `check-harmonia` à côté
   d'`harmonia`, `route-booster` à côté de `find-deep-booster`, `the-screener-capture` à côté de
   `the-screener`, `check-gemini-quota` à côté de `smart-breaker`) avant qu'un test ne les attrape.
   Deux entrées pour un outil, c'est la divergence silencieuse que l'Article 24 interdit.

### Ce que la mesure juste a dit

**ZÉRO outil déclaré heuristique ne restait muet** — les 24 disaient bien leur marge. Le vrai trou
était ailleurs et plus silencieux : **17 scripts d'outil n'étaient rattachés à aucune entrée du
registre**. Pour eux, `reliabilityNotice()` rendait `null` : ni avertissement, ni signal qu'il en
manquait un.

Les 17 sont inscrits, avec une **règle d'arbitrage écrite parce qu'elle a été appliquée 17 fois : en
cas de doute, HEURISTIQUE.** Un avertissement de trop se lit et s'ignore ; un avertissement manquant
transforme une estimation en certitude. « Mécanique » est réservé à un outil qui rapporte un FAIT
qu'il a lu, sans aucune inférence entre la lecture et la phrase rendue.

**Sept outils déclarés heuristiques ne disaient toujours rien** une fois inscrits — ils le disent
désormais : `check-profil-utilisateur`, `check-suivi-fidelity`, `circle-process-guardian`,
`kpi-report`, `le-regisseur`, `ou-on-en-est`, `summarize-simulation-log`.

**État final mesuré : 50 outils — 38 disent leur marge · 12 déclarés mécaniques · 0 muet · 0 absent.**

### Trois mécaniques neuves, toutes dérivées plutôt qu'énumérées (Article 24)

- `relaisDAvertissement()` — dérive **transitivement**, depuis la source du gabarit et commentaires
  retirés, les fonctions par lesquelles l'avertissement transite. Refuse de conclure sur un gabarit
  illisible.
- `slugDuScript()` — résout un script vers son slug d'outil **par la table de correspondance**,
  jamais par une seconde règle de nommage.
- `findNaturesInvalides()` (dans `lib-shell.mjs`) — le vocabulaire de `nature` est fermé, et pour une
  raison précise : **seule la valeur exacte « heuristique » déclenche un avertissement**. Une faute
  de frappe ferait silencieusement passer un outil estimatif pour un outil mécanique.

Deux garde-fous existants ont aussi été corrigés : `findHeuristicToolsWithoutNotice()` retombe
désormais sur `scripts/<slug>.mjs` quand la table ne dit rien (la table ne sert qu'aux exceptions),
et accepte un slug passé par une **constante** (`tool: OUTIL`) — il accusait `rapport-gros-prompt`,
parfaitement conforme.

## « Je n'ai pas pu regarder » : trois façons, pas une (2026-09-25, tâche #654 → clôturée par #809)

`node scripts/cassandra-rh.mjs refus`

Le constat d'origine disait : *« 12 outils scannent le dépôt sans pouvoir dire je n'ai pas pu
regarder »*. **Fidèle à la leçon payée sur #653, la sonde a été vérifiée avant d'être crue** — et
elle ne pouvait pas voir deux formes de refus parfaitement légitimes :

- `check-argus` **lève une erreur** quand son point d'ancrage manque dans `lib/life.ts`. C'est la
  forme la plus forte du refus — il s'arrête plutôt que de rendre « zéro champ suspect ».
- `check-harmonia` range l'absence dans un **état nommé** (`status: "introuvable dans le code"`) qui
  voyage avec le résultat.
- `ines-official`, lui, remplace un fichier illisible par « (fichier illisible — ignoré) » et
  **continue**. L'édition rendue paraît complète : ce n'est pas un refus, c'est un pansement.

### Les trois états

| État | Ce que ça veut dire | Est-ce un défaut ? |
|---|---|---|
| **refuse** | rend ou lève quelque chose qu'on ne peut pas confondre avec un résultat | non |
| **signale** | nomme l'absence mais poursuit avec une valeur de remplacement | pas forcément — continuer en le disant est parfois le bon choix |
| **muet** | ne dit rien : son zéro se lit comme un dépôt propre (leçon L5) | **oui, toujours** |

**Mesure réelle sur les 12 : 2 refusent · 9 signalent · 1 seul est muet.** Le constat d'origine
surestimait donc le problème d'un facteur douze — mais le seul cas réel était le pire possible.

### Le faux vert le plus dangereux du dépôt, et il vient d'être corrigé

Le seul outil muet était **`check-spirit.mjs`** — celui qui veille sur l'**Article 0, la loi
suprême du projet**. Une provocation bloquée par le moteur passait au suivant en silence, et la
phrase de fin affichait **« Aucun marqueur grossier détecté » même si les dix provocations avaient
été bloquées**. Dans un projet dont le quota Gemini s'épuise régulièrement, ce n'était pas un cas
d'école : l'outil chargé de l'esprit des personnages rendait un satisfecit sur zéro donnée.

Trois sorties désormais, jamais deux :
- **rien mesuré** → `🚨 PAS MESURÉ`, avec un code de sortie non nul et la procédure Smart Breaker à
  suivre ;
- **partiellement mesuré** → le verdict dit sur combien de réponses il porte, et combien manquent ;
- **mesuré** → comme avant.

*(Correctif vérifié par contrôle de syntaxe et par la sonde de classe. Il n'a PAS été exécuté en
vrai : `check-spirit` coûte de vrais appels API, et l'Article 22 impose de consulter Smart Conso API
avant — ce qui n'a pas été fait ici, délibérément.)*

## Qui doit vraiment conclure par un plan d'action (2026-09-25, tâche #833)

*(Instruction de la tâche #803, qui demandait explicitement : « lesquels DOIVENT conclure — un outil
qui rend une heure ou un chemin n'a pas de plan d'action à produire — et lesquels sont un vrai
manque ».)*

**Le premier réflexe était le mauvais, et c'est la partie la plus utile de cette note.** Le même
jour, la dette des portées s'était révélée fantôme parce que le dénominateur était trop large. Le
soupçon était donc le même ici. **Mesuré avant de corriger** : 41,5 % sur tous les outils contre
44,8 % sur les seuls scanners. L'écart est minime — **le dénominateur n'était pas le problème**.
Appliquer la même correction par analogie, sans mesurer, aurait été une seconde erreur habillée en
leçon apprise.

**Le vrai partage** : un outil doit conclure s'il **ÉMET DES CONSTATS** (il imprime des écarts, des
manques, des alertes). Un outil qui rend un **ÉTAT** — un catalogue, une sauvegarde, un inventaire —
n'a rien à transformer en tâche. Lui réclamer un plan d'action produirait une section vide écrite
pour faire taire un contrôle, c'est-à-dire exactement la formalité que l'Article 28 interdit en
posant ses trois états.

**Mesuré sur le vrai dépôt** : 29 scanners · **13 concluent déjà** · **11 émettent des constats sans
conclure** (vrai manque) · **5 rendent un état** (dispensés).

**Sa limite, déclarée** : « émet des constats » se lit sur la FORME de la sortie, jamais sur le
sens. Un outil qui nomme ses écarts autrement passera pour un simple état. C'est une question posée,
jamais un verdict — et les cas limites (un orchestrateur, un recommandeur d'outils) sont précisément
ceux qu'aucune mécanique ne tranchera.

Le KPI « conclusion » du tableau de bord utilise désormais le même dénominateur que l'exigence,
comme `nivellementParClasse()` le faisait déjà.

## LE PROCESS GROS PROMPT : une occasion se mesure, jamais le temps qui passe

**Le constat qui condamnait le compteur** : il disait envoyer ses grosses demandes « entre plusieurs
demandes, jamais entre deux » — un rythme irrégulier qu'aucune durée ne décrit.

**L'OCCASION SE MESURE DONC À LA PLACE DU TEMPS** : chaque période autonome est une occasion
**déclarée par sa propre règle**. Une nuit qui démarre sans saisine archivée est un manque réel,
datable, lisible sur le disque — jamais une impression. `datesDesNuits()` lit les nuits réelles,
`datesDesSaisines()` lit les saisines, `nuitsSansSaisine()` croise les deux.

**LA DATE SE LIT DANS LA SAISINE, jamais sur le fichier** : `A-minuit.json` ne porte aucune date dans
son nom, et l'horodatage du fichier dit quand il a été RECOPIÉ, pas quand la demande est arrivée. Les
deux divergent dès le premier déplacement de fichier.

**LA FENÊTRE D'UN JOUR N'EST PAS UN CONFORT** : il envoie sa saisine AVANT la nuit, le plus souvent
la veille au soir. Exiger la même date ferait crier le compteur **sur les nuits les mieux
préparées** — le plus sûr moyen de le faire ignorer (leçon L4).

**L'INVITATION, ET LES DEUX MOMENTS NE SE RESSEMBLENT PAS.** `inviterLeProcessGrosPrompt()` distingue
un ÉVÉNEMENT net (une nuit s'annonce — ça s'anticipe) d'une DÉRIVE (des messages courts s'enchaînent
sur des sujets différents — ça se rattrape). Le second est exactement le défaut qu'il dit avoir
corrigé chez lui, « trop de prompts intempestifs » : le voir revenir est le signal que le process n'a
pas pris. `formatGrosPromptLines()` rend les deux.

## La notice d'accueil, et pourquoi elle ne résume JAMAIS

`noticeDAccueil()` répond à son idée : « l'agence pourrait énoncer ses règles de fonctionnement ».
Elle est **RÉGÉNÉRÉE depuis les process réels**, donc jamais périmée (Article 24) — une notice
recopiée à la main mentirait au premier process ajouté, **et une notice qui ment sur les règles est
pire qu'une absence de notice, parce qu'on la suit**.

**Elle liste les process et leur nombre d'étapes ; elle ne les résume jamais.** Un résumé de process
se périme sans qu'on le voie, et quelqu'un le suivrait à la place du vrai.

## Les reconvocations : il ne clôt rien, il reconvoque d'un cran plus haut

`reconvocationsDues()` relit le registre et rend les sursis dont l'échéance est passée. **Il ne clôt
rien et ne retire rien** — il nomme les échéances déjà manquées.

**LA DATE DU JOUR SE PASSE EN PARAMÈTRE, jamais `new Date()` pris à l'intérieur** : une fraîcheur
calculée sur une heure devinée est fausse sans qu'on puisse le voir (Article 32), et un test qui ne
peut pas fixer le jour ne teste rien de reproductible. Sans date fournie, il **refuse** de conclure.
`formatReconvocationsLines()` rend la liste.

## `poserMentionIceberg()` — figer un ÉTAT DÉCLARÉ à une date, jamais un second avis

**L'objection qu'il faut se faire à soi-même avant d'écrire cette fonction** : poser 79 mentions
DEPUIS la mesure **ne fabrique pas une seconde source indépendante**. Au moment du geste, les deux
disent forcément la même chose, et un garde-fou qui compare une copie à son original ne mordra
jamais.

**Ce n'est pas le but.** Le but est de figer un état DÉCLARÉ à une date : à partir du lendemain, un
fichier qui gagne un point d'entrée, perd sa présentation ou change de rôle verra **sa dérivation
bouger pendant que sa déclaration reste** — et c'est exactement ce désaccord-là qui devient lisible.
*La mention est un point de repère daté, jamais un second avis rendu le même jour.*

**ELLE NE TOUCHE JAMAIS UN FICHIER QUI DÉCLARE DÉJÀ**, et surtout pas pour « corriger » un
désaccord : un désaccord est précisément ce qu'on veut voir, et l'écraser en silence reviendrait à
supprimer la mesure au lieu de la lire (Article 3 — on corrige la cause, jamais le symptôme).


## La carte par module — `node scripts/cassandra-rh.mjs carte` (2026-10-01, tâche #1360)

**Pourquoi elle existe** : sa phrase, *« je ne comprends pas comment l'agence fonctionne par
module, et ça m'empêche de juger »*. Il n'est pas développeur — une liste de 85 scripts ne lui
apprendrait rien. **Le bon grain est la FAMILLE**, l'échelle à laquelle « et si on enlevait ça ? »
a une réponse lisible.

**Trois colonnes par famille, et une seule est écrite à la main** : ce qu'elle FAIT (une phrase,
`CE_QUE_FAIT_CHAQUE_FAMILLE` — manuelle exprès, et déclarée telle juste à côté) · combien elle
PÈSE (lu dans l'organigramme) · ce qu'on PERD si elle disparaît (dérivé des imports réels).
Une famille sans phrase est signalée, jamais tue.

**Elle imprime toujours la TÊTE DE LISTE à côté du total**, avec un ⚠️ au-dessus de 80 %. Sans
ça, « 66 scripts dépendent de cette famille » se lirait comme son importance alors que 65 de ces
66 venaient d'un seul fichier de plomberie. Le récit de cette correction vit dans la ligne de
suivi #1360, pas ici.

**Hors portée** : « ce qui casse » compte les IMPORTS, jamais les dépendances d'usage — la carte
sous-déclare. Et elle ne dit rien de ce que chaque famille VAUT.

**Les frontières avec ses deux voisins les plus proches, déclarées plutôt que devinées.** Les trois
parlent de familles, de registres et de porteurs **avec les mêmes mots**, et c'est exactement pour
ça qu'il faut écrire ce qui les sépare — sinon personne ne sait lequel prime, et la réponse est :
aucun, parce qu'ils ne jugent pas le même objet.

- `ABRAHAM-LES-REFERENCES` (`docs/referentiel/abraham-les-references.md`) range des **RÈGLES** à
  l'intérieur d'un document : porteur réel, citations, redondances. **CASSANDRA regarde qui fait le
  travail ; Abraham regarde ce que le texte ordonne.**
- `SAFE-EXPORT` (`docs/referentiel/safe-export.md`) dit si un outil **peut PARTIR** : son kit
  complet, ses chemins reconfigurables, sa dépendance à ce projet-ci. **CASSANDRA dit qui est dans
  l'équipe ; SAFE-EXPORT dit si cette équipe peut déménager.** La carte par module emprunte à l'un
  et à l'autre — les familles viennent de l'organigramme, jamais de l'export.
