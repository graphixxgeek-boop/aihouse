# Relecture lourde — passage « Ronde GOAT MAX » du 2026-09-23

*Archiviste : comparaison factuelle entre les interventions écrites de l'utilisateur depuis la
tâche #178 (2026-09-20T14:40Z) et le système de suivi (`docs/suivi/`), complété par les deux
registres qui peuvent légitimement porter une trace hors `docs/suivi/` :
`docs/referentiel/points-fragiles.md` et `docs/simulations/correctifs-a-revalider.md`.*

*Aucun jugement porté ici sur la qualité du code, du produit ou des choix de conception — seulement
sur la fidélité du suivi : ce que l'utilisateur a dit est-il tracé, et cette trace correspond-elle à
un travail réellement exécuté et vérifiable ?*

---

## 1. Nombre d'interventions relues

**200 interventions relues intégralement**, du n° 446 (2026-09-20T14:44Z) au n° 645
(2026-09-23T20:49Z), telles que les livre
`docs/suivi/relectures-lourdes/interventions-depuis-tache-178.txt`.

Décomposition réelle de ces 200 entrées, parce qu'elles ne se valent pas :

| Nature | Nombre | Ce que j'en ai fait |
|---|---|---|
| Messages réellement écrits par l'utilisateur | 160 | lus ligne par ligne, c'est le corps de la comparaison |
| dont porteurs d'au moins une idée, demande ou question | ~95 | chacun confronté au suivi, un par un |
| dont relances pures (« continue », « enchaîne », « yes ») | ~40 | pas de contenu propre à tracer |
| dont bruit technique (retours de crochet git, notifications de tâche, `/model`) | 25 | jamais des interventions au sens de ce passage |
| Résumés de compactage de contexte injectés comme messages | 40 | parcourus en second passage, pour récupérer les demandes que le transcript brut aurait perdues |

Face à ces 200 entrées, le suivi porte **462 lignes de tâche** numérotées #179 à #640 sur la même
période, réparties dans les trois fichiers de `docs/suivi/sessions/`.

---

## 2. Liste des écarts

Huit écarts, chacun vérifié contre le dépôt réel et non contre ma seule lecture du suivi. Ils sont
donnés dans l'ordre de valeur décroissante, mais aucun n'a été omis au motif qu'il semblait
secondaire — la plus petite remarque a sa ligne.

---

### ÉCART 1 — `important` — L'idée « agence exportable en V1, puis V2/V3 par outil » a été tracée, PUIS EFFACÉE

**Intervention #517** (2026-09-21T18:27Z), formulée par l'utilisateur en ouvrant explicitement par
« fichier à creer malgre tout **pour ne pas perdre les idees** » :

> « l'agence est evolutive : elle s'exporte en V1, mais contient dejà la possibilité pour chaque
> agent de l'agence, de le passer en v2 et V3 (max) selon l'evolution de la taille du projet […]
> tous les outils existants aujourd'hui devraient donc beneficier d'une nouvelle nomenclature :
> **blueprint à l'etat 0, 1, 2, 3** selon leur historique de devloppement »

**Ce qui a bien eu lieu.** La tâche #335 l'a consignée le soir même dans
`docs/agence-exportable-conception.md`, section 5 (« Progression Niveau 1 → 2 → 3 par outil »),
avec l'idée de l'utilisateur ET la réponse de l'agent — exactement la forme qu'il exigeait au
même message (« mon idee (ma valeur) + ta/tes reponses (ta valeur) »).

**Ce qui s'est passé ensuite.** Le commit `95d1c5e` (« Quatre choses s'appellent catalogue… »,
tâche #461) a **réécrit le fichier de bout en bout**. Les cinq sections d'origine (Vision, Terrain
favorable, Ce qui reste à faire, Statut, et la section 5) ont disparu au profit d'un plan neuf.
Vérification faite dans les deux sens : `git show 353a22c:docs/agence-exportable-conception.md`
contient la section 5 ; la version actuelle ne la contient plus, et **aucune autre trace de cette
idée n'existe nulle part dans le dépôt** (grep sur « V1 », « V2 et V3 », « état 0 », « nomenclature »
dans `docs/`, `scripts/`, `CLAUDE.md` : zéro résultat hors le fichier d'interventions lui-même).

**Pourquoi c'est un écart et pas une simple réorganisation.** La tâche #461 ne mentionne aucune
suppression ; elle est libellée « le carnet du projet d'après » et se lit comme une création. Un
lecteur du suivi ne peut pas savoir qu'un contenu a été perdu à cette occasion.

**Tâche exploitable.** Récupérer la section 5 depuis `git show 353a22c` et la réintégrer dans
`docs/agence-exportable-conception.md` ; vérifier au passage si les sections 1 à 4 de la version
d'origine portaient d'autres contenus de l'utilisateur non repris.

---

### ÉCART 2 — `important` — Le champ « pour qui » sur chaque tâche : calibré, planifié, jamais construit

**Intervention #600** (2026-09-22T23:13Z, le gros prompt de nuit) :

> « mets toi des taches pour toi-même : me repondre quand je serais disponible. enregistre ces
> taches comme d'autres taches à faire, mais par toi. **verifie que le système des taches est prevu
> pour accueillir des taches que tu te mets à toi, ameliore, fiabilise ce sujet** […] + porcess mode
> autonome à completer avec cette rgele. »

**Ce qui a bien eu lieu.** La décision a été calibrée avec lui et écrite noir sur blanc dans
`docs/plans/nuit-2026-09-23-plan.md` (Partie 2, section « Mes propres tâches ») :
« **Un champ « pour qui »** sur chaque tâche : PROJET ou DETTE-ENVERS-L'UTILISATEUR. Même registre,
même étiquetage. » Elle figure aussi dans l'ordre d'exécution, chantier **1.1**. La tâche #536 la
reprend dans sa liste de décisions structurantes.

**Ce qui n'a pas eu lieu.** `FORMAT_TACHE` (`scripts/criticite.mjs`, lignes 188-207) déclare
**huit champs** : `numero`, `horodatage`, `motCle`, `sujet`, `sousSujet`, `criticite`, `detail`,
`statut`. Aucun champ « pour qui ». Grep sur `pourQui`, `pour_qui`, `destinataire` dans tout
`scripts/` : aucune occurrence en rapport. Les tâches #568/#569/#570/#579, qui ont livré les trois
autres volets du chantier 1.1 (criticité, mot-clé, format standard), ne le mentionnent nulle part,
et aucune tâche ouverte ne le porte.

**Tâche exploitable.** Soit ajouter le champ à `FORMAT_TACHE` et le faire vérifier par
`findChampsManquants()`, soit ouvrir une ligne de suivi qui déclare la décision abandonnée avec sa
raison (Article 28, état ÉCARTÉ).

---

### ÉCART 3 — `important` — L'outil « qui vérifie la logique et les trous PARTOUT » : aucune trace, et la question posée est restée sans réponse tracée

**Intervention #511** (2026-09-21T16:16Z), dernier paragraphe, introduit par lui comme une
« Remarque générale » :

> « j'ai besoin d'un outil qui verifie la logique, les trous mais **pour toute question de logique
> et de trous que ce soit dans le code, dans les idées, dans une conversation**… est-ce que harmonia
> et audit pourraient avoir une extension de ce genre ? […] je voudrais là par exemple faire un test
> de argus ou harmonia **sur cassandra directement : sur le prohjet cassandra, sur sa place, son
> role dans l'agence**. […] si des operations sont possibles des maintenant, utilise un outil pour
> voir la logique, les frictions ou les trous dans le role de cassandra. **Sinon, ne fais rien, mais
> reponds à la question.** »

**Ce qui a bien eu lieu.** Les deux autres demandes du même message sont tracées : le gabarit du
bloc de certification (#326) et le développement de CASSANDRA-RH (#321/#322).

**Ce qui manque.** Aucune ligne de suivi, aucun fichier préliminaire, aucune entrée dans
`docs/idees-a-trancher.md` ni dans `points-fragiles.md` ne porte cette idée d'extension
ARGUS/HARMONIA au raisonnement sur des IDÉES et des CONVERSATIONS (distincte de l'idée de
concordance des descriptions du message #513, qui, elle, a bien reçu son fichier via #331). Aucun
passage ARGUS ou HARMONIA sur le projet CASSANDRA n'apparaît nulle part — le seul passage HARMONIA à
raisonnement de la période porte sur la relation Lia/Noé (#344). L'utilisateur avait explicitement
prévu le cas « ne fais rien » à condition de **répondre** : rien ne trace cette réponse.

**Tâche exploitable.** Ouvrir la ligne manquante, décider (fichier préliminaire / entre-deux /
abandon), et soit lancer le passage demandé sur le rôle de CASSANDRA, soit écrire pourquoi il n'est
pas possible.

---

### ÉCART 4 — `important` — L'audit HARMONIA dédié au système KPI : condition de déclenchement remplie, action jamais faite, trace réfugiée dans un document déclaré archivé

**Origine : intervention du 2026-09-21 tracée en #262**, dans les mots de l'utilisateur :

> « tout le systeme de kpi est bien interconnecté. **On passera ce systeme au peigne fin avec
> Harmonia pour voir si on en a oublié des connexions.** »

**Ce qui a bien eu lieu.** La tâche #262 l'enregistre honnêtement comme « action future distincte » à
planifier **une fois CASSANDRA-RH construite**, et elle est reprise dans
`docs/cassandra-rh-conception.md` ligne 203.

**Ce qui manque.** (a) CASSANDRA-RH a été construite le 2026-09-21 (#321) puis considérablement
étendue (#322, #325, #404, #424) — la condition est remplie depuis deux jours. (b) L'audit n'a jamais
eu lieu : aucune trace dans `docs/harmonia/`, aucune ligne de suivi. (c) Plus gênant pour la reprise :
la tâche #321 a explicitement marqué `docs/cassandra-rh-conception.md` comme **« archivé — récit
fondateur conservé, plus la source de vérité opérationnelle »**. L'unique trace vivante de cette
action à faire se trouve donc dans un document que le suivi lui-même déclare non opérationnel, et
aucune tâche ouverte ne la reprend.

**Tâche exploitable.** Ouvrir la tâche « passage HARMONIA sur le système KPI » avec pour périmètre
explicite la recherche de connexions oubliées entre familles d'outils KPI, maintenant que
CASSANDRA-RH est la gardienne des objectifs/KPI (#424).

---

### ÉCART 5 — `normal` — CHARTER-SPY devait veiller à la rédaction économe d'une règle AU MOMENT où elle est écrite : aucune trace

**Intervention #514** (2026-09-21T17:20Z), premier paragraphe :

> « dans l'outil charter-spy, il y a une fonction qui repere les redactions redondantes et qui aide
> à foruler une idee avec un minimum de mots. **charter spy veille à ce que lorsqu'une regle est
> redigée dans claude.md, elle est toujours redigée de maniere optimisée pour la conso de token
> (smart conso plugged)** »

**Ce qui existe.** La moitié constat : `findRedundantRulePairs()` (CHARTER-SPY), puis ecotoken
(#359 et suivantes) et MOÏSE-TABLES-DE-LOI (#613) mesurent le poids **après coup** et ont permis la
campagne d'allègement de la charte.

**Ce qui manque.** La veille **préventive** demandée — un contrôle au moment de la rédaction d'une
règle neuve. Grep sur « lorsqu'une règle est rédigée », « rédigée de manière optimisée », « au moment
où une règle est écrite » dans `docs/` et `CLAUDE.md` : zéro résultat. Ni
`docs/referentiel/ecotoken.md` ni `docs/referentiel/moise-tables-de-loi.md` ne décrivent ce rôle.
Aucune ligne de suivi ne porte cette phrase. Le garde-fou `protegerLaCharte()` (#631) protège la
STRUCTURE de la charte, jamais l'économie de rédaction d'une règle nouvelle.

**Tâche exploitable.** Trancher : soit une vérification ecotoken/MOÏSE déclenchée à l'ajout d'un
Article (avant commit), soit une ligne ÉCARTÉ avec sa raison.

---

### ÉCART 6 — `normal` — Le « signe très positif » demandé pour les usages spontanés d'outils n'existe pas comme tel

**Intervention #514**, second paragraphe :

> « les utilisations spontanées des outils (de ta part ET hors process mecaniques) sont à flagger
> comme **"signe trés positif"** de cette mesure. »

**Ce qui existe.** L'origine `spontane` est bien capturée depuis la tâche #247
(`USAGE_ORIGINS`, `scripts/tool-usage.mjs`), et `scripts/tool-brain.mjs` lit un `spontaneousCount`.

**Ce qui manque.** Ce compteur n'est lu **qu'en négatif** et **que pour tool-brain lui-même** : les
deux seuls messages produits sont « jamais sollicité » et « jamais spontanément — signe que le
réflexe n'est pas encore acquis » (`tool-brain.mjs`, lignes 239-241). Aucun rapport ne remonte un
usage spontané comme un signe positif, pour aucun outil, et aucune ligne de suivi ne trace cette
demande précise.

**Tâche exploitable.** Ajouter la lecture positive dans EVAL-IA ou dans le KPI d'usage de tool-brain
(un usage spontané compté et affiché comme tel), ou écarter avec raison.

---

### ÉCART 7 — `normal` — « Peut-on optimiser check-house ? » : la seule puce du message #553 sans aucune trace

**Intervention #553** (2026-09-22T12:22Z), quatrième puce d'une liste de dix :

> « question : **peut-on optimiser le fichier "check-house" ? (fichier tres sensible) ? est-ce qu'un
> outil existant peut nous aider à faire ca ?** »

**Ce qui a bien eu lieu.** Les neuf autres puces de ce message sont toutes tracées et exécutées :
recensement des fonctionnalités et Article 27 (#426), data-archangel (#428), pure-gold dans la Ronde
(#426), process d'intégration avec badge (#459), point d'organisation (#460), Ronde avant CASSANDRA
(#462), consultation angel/god dans la charte (Article 26, #421/#426), mécanique de fraîcheur des
rapports (#420/#525), reprise par une autre IA (Article 27, #426). Le traitement point par point a
donc bien eu lieu — à une exception près.

**Ce qui manque.** Aucune trace de cette question. Toutes les occurrences de « check-house » dans le
suivi de la période sont de la forme « `check-house.mjs` vert » (résultat de tests), jamais
`check-house` comme SUJET d'une optimisation. Le fichier dépasse aujourd'hui les 10 000 lignes, ce
qui rend la question de l'utilisateur d'autant moins théorique.

**Tâche exploitable.** Répondre à la question (par exemple via ALWAYS-NEW-CODE en zoom profond ou
CLONE-HUNTER sur ce seul fichier) et ouvrir la ligne correspondante, ou écarter avec raison.

---

### ÉCART 8 — `normal` — Le registre `docs/idees-a-trancher.md` est resté vide depuis sa création, alors que la règle qui l'a créé s'applique à chaque idée

**Intervention #515** (2026-09-21T17:41Z) :

> « lors de la ronde : sur ce sujet du suivi des idees et fichier preliminaire : **me demander
> systematiquement, pour chaque idee developpée, avec une question dans fenetre**, si je souhaite la
> creation d'un fichier preliminaire pour cette nouvelle idée, ou si l'idee doit etre abandonnée, ou
> "entre deux" […] cette question me sera posée à chaque ronde, du coup, jusqu'à ce qu'un fichier
> soit créé ou l'idée abandonnée. »

**Ce qui a bien eu lieu.** Le mécanisme est réellement construit (#333) :
`detectPendingIdeaCandidates()`, `loadIdeaDecisions()`, `findIdeasNeedingDecision()`, le signal de
Ronde `idee-a-trancher-signal`, le fichier `docs/idees-a-trancher.md` et une règle écrite dans
`docs/regles-de-travail.md`. C'est bien plus qu'une décision : c'est du code livré.

**Ce qui manque.** Le tableau « Idées nouvelles (à partir du 2026-09-21) » de
`docs/idees-a-trancher.md` est **vide — zéro ligne** — deux jours et plusieurs dizaines d'idées plus
tard (data-archangel, TOOL-LEARNING, THE-EQUALIZER, Abraham-les-references, MOÏSE-TABLES-DE-LOI,
integration-outil, mode semi-autonome…). Les trois rapports archivés dans `docs/idee-a-trancher/`
disent « 0 candidat », ce qui s'explique mécaniquement (le plancher au numéro de tâche exclut les
idées construites le jour même) — mais l'utilisateur avait demandé un **réflexe en temps réel**, pas
seulement le filet de sécurité de la Ronde. Le registre censé prouver que sa voix passe par une
fenêtre pour chaque idée n'a jamais rien enregistré.

**Tâche exploitable.** Vérifier si le réflexe en temps réel a été appliqué et non consigné (auquel
cas rattraper les entrées) ou jamais appliqué (auquel cas le garde-fou doit mordre autrement qu'au
numéro de tâche).

---

## 3. Ce qui est DÉJÀ bien tracé — et c'est l'essentiel

**Il serait faux de conclure de la liste ci-dessus que le suivi fuit.** Sur ~95 interventions
porteuses d'au moins une idée, j'en trouve **8 avec un défaut de trace, dont 2 seulement sont une
perte réelle de valeur** (écarts 1 et 3). Le reste du corpus est tracé avec un niveau de détail que
je n'ai encore jamais eu à vérifier sur ce projet : chaque ligne cite la demande de l'utilisateur
entre guillemets, nomme les fichiers touchés, le numéro de version de `lib/reference.ts`, le nombre
de tests, et — c'est plus rare — **ce qui n'a PAS été fait et pourquoi**.

Quelques confirmations précises, choisies parce qu'elles étaient les plus faciles à perdre :

- **Les gros chantiers nommés par l'utilisateur ont tous leur chaîne complète** : THE-KING (#460 →
  #252), THE-GHOST (#498 → #311), find-brain (#499 → #312), le-grand-architecte (#504 → #317/#318),
  ecotoken (#532 → #359 à #402), pure-gold-unity (#540 → #420), god-of-all-process et
  process.simulation.guardian (#549 → #417), angel-of-ia-process (#550 → #425), data-archangel
  (#553 → #428), TOOL-LEARNING (#571 → #453), SAFE-EXPORT (#450/#452), THE-EQUALIZER (#611 →
  #571/#580), MOÏSE-TABLES-DE-LOI et Abraham-les-references (#631/#632 → #613/#619).
- **Les nouveaux Articles de la charte demandés en conversation existent et portent la citation de
  la demande** : Article 24 (évolutivité, #513 → #330), Article 25 (vérifier son propre travail,
  #549 → #419), Article 26 (respecter les process, #553 → #421), Article 27 (reprise par une autre
  IA, #553 → #426), Article 28 (rapport → plan d'action → tâches, #556 → #429), Article 29 (contexte
  en tête de compte rendu, → #527/#528), Article 20bis (dette de vocabulaire « gardien », #600 →
  #486).
- **Les petites remarques de forme n'ont pas été avalées** : « dates en toutes lettres » (#584 →
  #506), le renommage « gabarit HTML » → doc-HTML (#504 → #317), la sous-catégorie « plomberie »
  devenue Équipe Infrastructure (#504 → #318), le surnom R/O-Guardian (#509 → #323), le nom
  « le-catalogue-du-coordinateur » (#543 → #404), le libellé « risque faible » qui se lisait à
  l'envers (#543 → #403), le retrait d'une simple ligne de chemin (#615 → #587).
- **Les noms d'équipes qu'il a choisis lui-même en #487 ont tous été appliqués** : vérifié dans
  `docs/referentiel/organisation-agence.md` — « L'Agence Codex » (titre du document), « Suite Audit
  Simulation », « La Cour du Roi », « Les Agents Spéciaux ».
- **Les décisions PRISES SANS ÊTRE EXÉCUTÉES sont déclarées comme telles, pas maquillées** : #256
  (compaction des journaux), #287 (objectifs-vs-resultats avant construction), #219, #224, #230,
  #262, #290 portent toutes la mention « rien construit » avec la raison. C'est la différence entre
  une trace honnête et une trace creuse, et le suivi tient cette ligne.
- **Le second registre a bien joué son rôle**, exactement comme ma consigne le prévoyait : l'idée de
  compaction progressive des journaux locaux (#465), pour laquelle je m'apprêtais à conclure à un
  écart, vit en réalité dans `docs/referentiel/points-fragiles.md` (lignes 131-142) — avec sa
  vérification en direct que ce n'est « PAS encore un problème réel » (9 journaux, le plus gros à
  33 Ko) et la condition de réouverture. J'aurais produit un faux écart en ignorant ce registre.
- **Les tâches restées ouvertes le sont explicitement**, pas par oubli : #436, #439, #445, #451,
  #490 à #493, #510, #514, #558, #567, #571 à #577, #601, #603, #604, #612, #623, #629, #636 portent
  toutes le statut « à faire » avec leur reste-à-faire écrit.
- **La toute dernière intervention est déjà tracée** : #645 (« quels schémas sont incomplets, quels
  sont les schémas maîtres… je n'ai pas trouvé mon bonheur ») a produit la tâche #640 le jour même,
  qui cite sa phrase mot pour mot.

---

## 4. Ma limite honnête

**Ce que je n'ai pas pu vérifier, et pourquoi.**

1. **Le fichier d'interventions ne contient que les messages ÉCRITS.** Les réponses de l'utilisateur
   aux fenêtres de questions à choix (AskUserQuestion) n'y figurent pas, sauf quand il les a
   recopiées lui-même dans un message (ce qu'il a fait en #487, #511, #514, #527, #537, #558, #559).
   Or le suivi cite en permanence des décisions prises « en fenêtre dédiée » — par exemple « Refaire
   parler le deuxième » et « Garde six mots » (#594), « normaliser, une liste de grands domaines »
   (#608), « toujours la fenêtre, sans exception » (#609), les 32 calibrages de la nuit (#536).
   **Je ne peux ni confirmer ni infirmer que ces citations sont fidèles** : je n'ai pas la source.
   Je les ai prises pour argent comptant. Si un arbitrage a été mal restitué, mon passage ne peut
   pas le voir — et c'est structurellement le plus gros angle mort de ce rapport.

2. **Les 40 résumés de compactage ne sont pas la conversation.** Ils résument ce que l'agent a
   retenu, pas ce que l'utilisateur a dit. Une demande formulée dans un tour perdu au compactage et
   mal résumée est invisible pour moi comme pour eux. Je les ai lus pour récupérer des demandes
   absentes du transcript brut, jamais comme source de vérité.

3. **Je n'ai pas relu le code du jeu ni le produit**, conformément à ma consigne. Quand le suivi dit
   « 206 tests verts » ou « corrigé à la racine », je vérifie que le fichier cité existe et que la
   fonction nommée s'y trouve — je ne vérifie pas que le correctif est bon. C'est le rôle de
   THE-FINAL-JUDGE, pas le mien.

4. **Une trace « exécutée et vérifiable » est mesurée par échantillon, pas exhaustivement.** Pour les
   écarts, j'ai vérifié dans le dépôt réel (grep sur `scripts/`, `docs/`, lecture de
   `FORMAT_TACHE`, `git show` sur la version antérieure du carnet exportable). Pour les ~450 lignes
   NON signalées, je me suis appuyé sur la présence de la demande et la cohérence interne de la
   ligne : je n'ai pas relancé chaque outil cité pour prouver qu'il tourne. Une ligne qui décrirait
   correctement un travail jamais fait me passerait sous le nez.

5. **Un faux positif de ma part, signalé plutôt que tu.** Mon premier comptage de colonnes a
   remonté 4 lignes de suivi « mal formées » (#362, #582, #585, #625). Vérification faite ligne par
   ligne : ce sont des barres verticales **échappées** (`\|`) à l'intérieur des descriptions, que le
   parseur du projet (ancré aux deux bouts depuis #582) lit correctement, et que mon découpage naïf
   comptait à tort. **Ce n'est pas un écart**, et je préfère l'écrire que de le laisser dans la
   liste pour faire nombre.

6. **Deux coquilles mineures relevées en passant**, trop petites pour être des écarts mais notées
   parce que ma consigne interdit de filtrer : la ligne #571 du suivi est libellée « THE-EQUALIZER
   devient THE-EQUALIZER » (il fallait lire « A-NIVEAU devient THE-EQUALIZER », comme le dit
   correctement #580) ; et 433 des 524 lignes numérotées n'ont pas de mot-clé — ce qui est **conforme**
   à la portée déclarée en #582 (colonne insérée partout, mot-clé renseigné pour les 32 tâches alors
   ouvertes seulement), et donc pas un écart, mais qui rendra la promesse du mot-clé de #611
   partiellement fausse dès qu'une vieille tâche sera citée par son numéro.
