# Idées à trancher — fichier préliminaire, entre-deux ou abandon (registre)

*(2026-09-21, demande explicite de l'utilisateur : à chaque fois qu'une nouvelle idée est
développée — pas seulement les « gros chantiers » déjà couverts par la règle voisine — l'agent doit
poser une question à 3 choix : créer un fichier préliminaire dédié, abandonner l'idée, ou
« entre-deux » (notée ici, aucun fichier créé pour l'instant). Le mécanisme PRINCIPAL est un
réflexe en temps réel (cf. `docs/regles-de-travail.md`, section dédiée) : la question se pose au
moment même où l'idée est proposée en conversation. Le signal CIRCLE-TASKS
`idee-a-trancher-signal` est un FILET DE SÉCURITÉ mécanique, jamais le mécanisme principal — il
rattrape une idée pour laquelle le réflexe en temps réel aurait été oublié, en la reposant à
CHAQUE Ronde tant qu'aucune décision définitive n'est enregistrée ici.
Décision réservée exclusivement à l'utilisateur, jamais déduite ni tranchée par l'agent —
réversible dans les deux sens (une idée abandonnée peut être relancée plus tard, une idée
« entre-deux » peut être explicitement abandonnée).
Détection mécanique : `detectPendingIdeaCandidates()` (`check-tasks-details.mjs`) — toute tâche de
suivi dont le Sujet commence par « Nouvel outil » ou « Conception ». Ce fichier vit hors de
`docs/suivi/` (LE-PLANIFICATEUR) pour ne jamais entrer en tension avec sa règle de lecture seule
(`check-tasks-details.mjs` ne modifie jamais `docs/suivi/`).)*

## Balayage rétrospectif initial (2026-09-21)

Revue manuelle de l'historique complet de `docs/suivi/` (Article 19 — jamais un algorithme textuel
brut sur les candidats historiques, voir la note méthodologique en bas). Trois sous-idées
identifiées comme encore réellement ouvertes aujourd'hui, toutes déjà couvertes par le fichier
préliminaire existant de leur chantier parent — aucun vrai trou trouvé rétroactivement :

| Tâche(s) | Idée | Décision | Fichier |
|---|---|---|---|
| #297 | Catalogue LE-COORDINATEUR/CASSANDRA (§8bis de docs/cassandra-rh-conception.md) | fichier créé | docs/cassandra-rh-conception.md |
| #226 (§8ter) | 3 Stagiaires — Catalogue, Dossier KPI, Recrutement (docs/cassandra-rh-conception.md) | fichier créé | docs/cassandra-rh-conception.md |
| — | « Promotion de poste » — ambiguïté de terminologie non tranchée (docs/cassandra-rh-conception.md) | entre-deux | — (question de calibrage encore due à l'utilisateur) |

## Idées nouvelles (à partir du 2026-09-21)

*(chaque nouvelle idée détectée — en temps réel ou par le signal CIRCLE-TASKS — rejoint ce tableau
dès qu'elle est posée à l'utilisateur, avec sa décision réelle une fois obtenue.)*

| Tâche | Date | Idée | Décision | Fichier |
|---|---|---|---|---|

## Note méthodologique

Un balayage purement textuel automatique (mots-clés « pas encore construit »/« encore ouvert ») sur
tout l'historique produit trop de faux positifs/négatifs pour être fiable : une tâche peut décrire
une idée « pas encore construite » au moment où elle est écrite, puis être réalisée plus tard sans
que cette phrase d'origine soit jamais corrigée — cas réel trouvé : la tâche #287 (« conception à
sauvegarder pour construction future ») a depuis été réalisée par
`scripts/objectifs-vs-resultats.mjs`, sans que le texte de la tâche #287 elle-même ne le reflète
jamais. La détection automatique (`detectPendingIdeaCandidates()`) reste donc réservée aux idées
NOUVELLES à partir de maintenant, où la question se pose au moment même de la détection — jamais
reconstruite après coup sur un texte qui a pu devenir obsolète.

**Plancher réel : numéro de tâche, jamais une date (2026-09-21, trouvé en testant en direct avant
tout câblage dans la Ronde, Article 3/19).** Un premier essai avec un plancher de DATE
(« 2026-09-21 ») a été testé contre le vrai `docs/suivi/` avant tout câblage réel — et a remonté
plus de 40 tâches « Nouvel outil »/« Conception » du jour même, la quasi-totalité de la session en
cours, déjà construites et closes le jour même sans jamais passer par une vraie décision de fichier
préliminaire (des outils trop petits pour ça). Une date plancher ne peut pas distinguer « avant
l'existence de ce mécanisme » de « après », puisque le mécanisme naît lui-même un jour qui contient
déjà des dizaines de tâches. `detectPendingIdeaCandidates()` utilise donc un plancher au NUMÉRO de
tâche (`sinceTaskNumber`, défaut 332 — la dernière tâche couverte par le balayage rétrospectif
manuel ci-dessus), un numéro étant strictement croissant et sans ambiguïté de fuseau horaire (même
principe que `filterByZoom()`, `check-tasks-details.mjs`) : exclut précisément tout ce que le
balayage manuel a déjà tranché, sans exclure la moindre idée réellement nouvelle à partir de
maintenant.

## Les sept décisions qui attendaient sans que personne les voie (2026-09-25)

**CE QUI LES A FAIT APPARAÎTRE, et c'est la moitié la plus utile de cette entrée** : le détecteur
ne lisait que le SUJET d'une ligne de suivi, et seulement s'il commençait par « Nouvel outil » ou
« Conception » — le vocabulaire du 2026-09-21. Depuis, le suivi porte une colonne **Criticité** dont
l'une des valeurs est littéralement `A-TRANCHER`, posée à la main sur chaque ligne qui attend une
décision. Le signal le plus fiable qui soit, et le détecteur ne le regardait pas.

Résultat mesuré avant correction : **zéro candidat sur 803 lignes réelles**, dont sept portant
`A-TRANCHER` en toutes lettres. Un registre parfaitement vide, et parfaitement faux — le constat
DEEP-READER 8 confirmé en direct.

| Tâche | Sujet | Décision |
|---|---|---|
| #747 | Nommage — la nomenclature : un code de classe dans le nom d'un outil | à trancher |
| #760 | Charte — proposer un NOUVEL article (le trentième) pour la reprise des notes | à trancher |
| #767 | Charte — quelles autres règles à fort levier manquent ? | à trancher |
| #800 | Version de l'Agence — lequel des trois axes fait monter le majeur ? | à trancher |
| #801 | Badge — la FAMILLE a disparu de la cérémonie, 23 cérémonies identiques d'un coup | tranchée | **2026-09-25 : une cérémonie par CHANGEMENT RÉEL, jamais une par outil et par passage.** Tant que le motif ne bouge pas, rien n'est republié. Remesuré le jour même : 20 en attente, toutes sur le même motif. |
| #805 | File — 87 % de tâches légères et 49 thèmes : émiettement, ou rythme sain ? | à trancher |
| #1079 | Suivi — un commit de SUITE compte-t-il comme « sans mise à jour du suivi » ? (3 issues, et le commit accusé est le mien) | à trancher |
| #1092 | Conso — personne n'enregistre le trafic API réel : Smart Conso ne juge que des sondages, alors que l'Article 22 le rend obligatoire (3 formes) | à trancher |
| #814 | Données — les sources fraîches restantes : lecteur réel, ou absence assumée ? | à trancher |

Trois d'entre elles (#747, #760, #767) attendaient depuis plusieurs jours **sans être visibles nulle
part** : elles étaient dans le suivi, marquées correctement, et le seul outil chargé de les
rassembler ne pouvait pas les voir.

### Ajoutée le jour même, et par le garde-fou lui-même

| Tâche | Sujet | Décision |
|---|---|---|
| #819 | Filet de sécurité — ne rien faire, regarder les 3 plus lents, ou un mode rapide | à trancher |

**Comment elle est arrivée ici** : le test écrit une heure plus tôt pour ce registre a **bloqué le
commit** qui créait #819, parce que la ligne portait `A-TRANCHER` sans être inscrite ici. Le
mécanisme a donc attrapé son propre auteur, sur sa première occasion réelle — ce qui est la seule
preuve qui vaille qu'il n'était pas une intention (leçon L2).

**LA DONNÉE QUI MANQUAIT EST MESURÉE (2026-09-30, tâche #1274).** Ezechiel REFUSAIT de conclure
sans les trois durées réelles — c'était son unique alerte BLOQUANTE, et il avait raison : sans
elles, toute optimisation se ferait à l'aveugle. Les voici, mesurées cette nuit sur ce dépôt :

| | |
|---|---|
| le filet **nu** | **107,9 s** |
| le filet **sous instrumentation** *(couverture V8 native — aucun paquet à installer)* | **111,7 s** — surcoût **3,7 s** |
| le **typage** (`tsc --noEmit`) | **3,0 s** |

> **Sur le total de 114,7 s : les TESTS pèsent 94 %, l'enveloppe 6 %.**

**CE QUE ÇA TRANCHE, ET CE QUE ÇA NE TRANCHE PAS.** L'option « **mode rapide** » supposait, sans
le dire, que l'enveloppe coûtait cher. **Elle coûte 6 %** : un mode rapide qui retirerait
l'instrumentation et le typage ferait gagner **sept secondes sur cent quinze**, en échange de la
couverture et du typage. **La mesure ne choisit pas pour toi, mais elle retire une option de la
table** — et c'est exactement pourquoi Ezechiel refusait de conclure.

**Restent donc deux options réelles** : ne rien faire (108 s pour 380 vérifications, soit 0,3 s
chacune), ou regarder les trois groupes les plus lents.

*(Note sans rapport avec la décision, relevée au passage : `tsc --noEmit` sort en erreur sur une
ligne de `vite.config.ts`. Vérifié plutôt que supposé — elle date du **tout premier commit du
dépôt**, le 2026-09-16, et `tsc` n'est pas dans les contrôles du projet, qui construit via
`vinext`. Ce n'est donc ni une régression, ni un contrôle qu'on aurait laissé rouge.)*


### Ajoutée le 2026-09-25 par le garde-fou d'écriture des origines

| Tâche | Sujet | Décision |
|---|---|---|
| #823 | Compteur d'usage — l'origine « spontane » : la câbler, ou la retirer du vocabulaire ? | à trancher |

**Le fait qui la motive** : sur 2 197 événements enregistrés depuis le premier jour, cette origine
n'a **jamais** été écrite une seule fois, et tool-brain la LISAIT pour en tirer un reproche
permanent. Le signal positif construit le même jour la remplace déjà, en DÉRIVANT l'initiative de
ce qui est réellement enregistré. Les deux options, et elles ne se valent pas :

- **La câbler** — il faudrait qu'un appelant déclare « ceci est spontané », c'est-à-dire que je me
  note moi-même. Ce projet s'en méfie, et il a raison : une mesure auto-déclarée mesure la
  déclaration, jamais le fait.
- **La retirer** — le vocabulaire ne porterait plus que des origines réellement productibles, et
  plus aucun outil ne pourrait rendre un verdict sur une catégorie vide. Coût : `toolUsageStats()`
  cesse d'exposer une clé que personne ne remplissait.

### Ajoutée le 2026-09-25 — l'idée restée sans trace pendant quatre jours

| Tâche | Sujet | Décision |
|---|---|---|
| #830 | ARGUS/HARMONIA étendus au raisonnement sur des IDÉES et des CONVERSATIONS, pas seulement du code | à trancher |

**Sa demande, du 2026-09-21 (intervention #511)**, posée comme une « remarque générale » :

> « j'ai besoin d'un outil qui verifie la logique, les trous mais **pour toute question de logique et
> de trous que ce soit dans le code, dans les idées, dans une conversation**… est-ce que harmonia et
> audit pourraient avoir une extension de ce genre ? [...] **Sinon, ne fais rien, mais reponds à la
> question.** »

**La réponse qu'il attendait, et qu'il n'avait jamais eue** : oui, techniquement — mais pas dans la
couche qui tourne gratuitement à chaque commit. ARGUS et HARMONIA ont déjà **deux couches** : une
mécanique (motifs sur du code, zéro coût) et une à vrai raisonnement (coût réel, Article 8). Une
idée ou une conversation n'ont pas de motif à balayer : seule la seconde couche peut les lire. Donc
l'extension est possible, elle est **payante**, et elle se déclenche à la demande.

**Les trois formes possibles, et elles ne coûtent pas pareil** :

- **A — Une commande sur un texte fourni.** « Voici une idée / un échange : quels trous, quelles
  frictions ? » Le plus simple, le plus utile tout de suite, coût par passage.
- **B — Un passage sur un SUJET du dépôt** (« le rôle de CASSANDRA dans l'Agence », sa demande
  d'origine). L'outil rassemble lui-même ce que le dépôt dit du sujet, puis raisonne dessus. Plus
  cher, et c'est celui qui répond vraiment à sa question.
- **C — Une veille continue sur les conversations.** À écarter à mon sens : il n'existe aucun accès
  mécanique à l'historique de conversation, et un outil qui prétendrait le lire mentirait.

**Ce qui a déjà été fait sans rien dépenser, en attendant sa décision** : le passage sur CASSANDRA
a été lancé avec les outils gratuits (`fiche`, `cadrage`), et il a trouvé deux frictions réelles
dans son propre rôle — voir la tâche #830.

### Ajoutée le 2026-09-25 par le rappel post-commit lui-même

| Tâche | Sujet | Décision |
|---|---|---|
| #841 | La Ronde : 30 commits sans passage — la lancer, et avec quels items ? | tranchée | **2026-09-25 : lancée en paramètres recommandés** (31 items sur 37), sur sa demande « place une ronde en paramètres recommandés dans le déroulé de ton travail ». 15 min réelles, compteur remis à zéro. |

**Le rappel post-commit le dit dans ses mots** : « 30 commits sans Ronde. À ce stade ce n'est plus
un retard, c'est un constat : une trentaine de vérifications gratuites dorment depuis des semaines,
et personne ne sait ce qu'elles auraient trouvé entre-temps. »

**Pourquoi je ne la lance pas seule** : le dispositif de la Ronde impose lui-même que **la sélection
des items soit confirmée par une fenêtre à cocher avant exécution, jamais un tout-en-un silencieux**.
C'est une règle de son propre outil, pas une prudence de ma part.

**Ce que ça coûte** : zéro appel API — la Ronde est gratuite. Ce qu'elle coûte, c'est du temps et
des tokens, d'où le choix des items.

**Et c'est exactement le sujet de #205** : une activité gratuite, à retour différé, repoussée
trente commits durant pendant que les vérifications à retour immédiat tournaient à chaque commit.
Cette fois la mesure ne se trompe pas — le compteur de commits, lui, est indiscutable.

### Ajoutée le 2026-09-25 — le registre des leçons grossit, et personne ne dit s'il sert

| Tâche | Sujet | Décision |
|---|---|---|
| #842 | Les 20 leçons du registre : lesquelles ont RÉELLEMENT changé quelque chose ? | à trancher |

**Mesuré par TOOL-LEARNING, l'outil dont c'est précisément le métier** (`node scripts/tool-learning.mjs`) :

- **7 leçons ne sont JAMAIS remontées**, sur 140 à 255 occasions chacune (L7, L9, L17, L18, L20,
  L21, L23). Du poids mort dans un registre qui ne cesse de grossir.
- **11 leçons remontent souvent et n'ont jamais été jugées appliquées** (L1, L2, L4, L5, L8, L10,
  L11, L12, L13, L24, BP3). L'outil le dit sans détour : « ressortir ne suffit visiblement pas ».
- **Aucune entrée n'a encore été jugée** appliquée ou non.

**Pourquoi je ne tranche pas**, et ce n'est pas une dérobade : `enregistrerXp()` **refuse** un
jugement qui ne porte pas `parUtilisateur: true`. C'est écrit dans le process XP : *« c'est
l'utilisateur, à la Ronde, qui dit si une entrée a été réellement APPLIQUÉE »* — et c'est toi qui
l'as voulu ainsi (« c'est moi à la fin qui te dis si elle est propre »).

**Ce que ça te demande, concrètement** : pour chaque leçon, un mot — appliquée, ou pas. Les sept qui
ne remontent jamais appellent une seconde question : les reformuler, ou les retirer ?

**Ce qui est mesuré et ne se rediscute pas** : aider un outil coûte ~3 300 tokens (médiane). Le frein
n'est pas là — c'est le fichier de tests qui pèse 273 000 tokens, 44 % de tout `scripts/`.

### Ajoutée le 2026-09-25 — les 5 tâches qui attendent depuis le plus longtemps

| Tâche | Sujet | Décision |
|---|---|---|
| #845 | Les 5 plus anciennes tâches encore ouvertes : à faire, à écarter, ou à reformuler ? | à trancher |

**Mesuré après correction du compteur** (voir #844 : treize tâches étaient comptées ouvertes à
tort). Il reste **115 tâches réellement ouvertes**, et voici les cinq plus anciennes :

| N° | Ouverte depuis | Criticité | Sujet |
|---|---|---|---|
| #147 | 2026-09-20 | NORMAL-UTILE | objectifs de résultat / score cible par membre d'équipe |
| #179 | 2026-09-20 | NORMAL-UTILE | CASSANDRA-RH doit connaître parfaitement chaque membre |
| #279 | 2026-09-21 | NORMAL-UTILE | la passe manuelle d'allègement de CLAUDE.md, reportée explicitement |
| #390 | 2026-09-22 | RECOMMANDE-NECESSAIRE | ARGUS et CLONE-HUNTER mesurés à une autre échelle que les autres |
| #490 | 2026-09-22 | PRIORITAIRE-OBLIGATOIRE | 18 données fraîches que personne ne lit |

**Ce que je te demande** : pour chacune, un mot — on la fait, on l'écarte avec sa raison, ou on la
reformule. **#279 est un cas à part** : elle est marquée « reportée explicitement » par toi, donc
elle n'est pas en retard — seulement en attente de ton feu vert.

**Pourquoi je ne tranche pas** : écarter une tâche est une décision, et la leçon L22 dit de ne
jamais rouvrir ni fermer ce que tu as sciemment mis de côté.

### Ajoutée le 2026-09-25 — le process qui manque pour toucher un document de référence

| Tâche | Sujet | Décision |
|---|---|---|
| #846 | Modifier un document de référence : le nom du process, et le sort de son étape 9 | à trancher |

**Document** : `docs/plans/process-documents-de-reference-proposition.md`.

**La surprise de l'instruction** : **huit étapes sur dix sont déjà écrites ET déjà portées par un
mécanisme**. Ce qui manque n'est pas le contenu, c'est qu'elles ne soient nulle part rassemblées.

**Deux questions pour toi** :

1. **Le nom.** Trois pistes — `documents-de-reference`, `livraison-charte` (celui que l'outil emploie
   déjà en interne), `la-regle-qui-change` — ou le tien.
2. **L'étape 9**, la seule sans porteur : quand `CLAUDE.md` change, faut-il un contrôle qui DEMANDE
   si `principes.md`, `parametres.md` et `lib/reference.ts` devaient bouger aussi ? Il ne pourra
   jamais savoir s'ils le devaient — seulement poser la question, comme les six règles qu'angel
   demande au lieu de deviner.

## #850 — CLEAN-DIRTY-OLD muet depuis six jours : passage réel, ou silence correct ?

*(Remonté par la Ronde du 2026-09-25, item `clean-dirty-old-signal`.)*

**Le fait** : `docs/clean-dirty-old/index.md` ne porte qu'UNE seule ligne, celle du 2026-09-19, jour
de la création de l'outil — « aucune zone signalée ». Six jours sans une ligne de plus, sur un outil
qui tourne pourtant à chaque commit comme quatrième Gardien sacré.

**Pourquoi je ne tranche pas seule** : les deux causes sont indiscernables depuis le carnet.

- **Cause A — le silence est correct.** La règle du carnet, écrite dans son en-tête, est qu'un
  passage sans zone signalée ne mérite pas de ligne (même discipline qu'HARMONIA). Six jours sans
  rien à signaler produiraient exactement ce carnet-là.
- **Cause B — le passage complet n'a jamais été relancé.** La couche légère tourne au commit ; le
  vrai passage, lui, se lance à la main. Six jours de stagnation relative dormiraient alors sans
  que personne le sache.

**Les trois voies :**

1. **Lancer un vrai passage CLEAN-DIRTY-OLD maintenant** — c'est gratuit (0 appel API), et c'est la
   seule façon de savoir laquelle des deux causes est la bonne. *(Ma recommandation : une mesure
   coûte moins cher que la question.)*
2. **Ne rien faire et considérer le silence comme normal** — cohérent avec la règle du carnet, mais
   fondé sur une hypothèse, jamais sur une mesure.
3. **Faire écrire au carnet une ligne « passage sans trouvaille »** à chaque vrai passage, pour que
   le silence cesse d'être ambigu — change la règle du carnet, donc une décision de conception.

## #801 — remesuré le 2026-09-25, et le chiffre confirme que ce n'est pas un pic

*(Ajouté après la Ronde : le rappel post-commit en affiche **20** d'un coup, deux commits de suite.)*

**Ce que la remesure apporte** : en septembre 22 il y en avait 23 ; aujourd'hui 20. Le nombre ne
descend pas parce que rien n'est relayé — il descend parce que le paysage a bougé. **Le motif est
stable, donc structurel**, et toutes portent la même mention : « Couverture de code : partiel
(KO CLONE-HUNTER) ».

**Pourquoi je ne les relaie pas** : relayer vingt cérémonies identiques, c'est produire vingt lignes
qui disent la même chose — exactement le bruit dont ta question #801 demande s'il sert à quelque
chose. Et un relais est une écriture définitive dans l'historique des badges : la faire vingt fois
pour « nettoyer l'affichage » figerait la réponse à ta place.

**Ce que la mesure suggère, sans trancher** : si toutes oscillent sur le MÊME motif
(`KO CLONE-HUNTER`), alors ce n'est pas vingt cérémonies, c'est **une seule information répétée
vingt fois** — et la question devient « faut-il une cérémonie par outil, ou une par CHANGEMENT
réel ? ». Ça reste ta décision.

---

# DÉCISIONS PRISES LE 2026-09-25 — neuf d'un coup, en deux fenêtres

*(Il a demandé : « pose moi des questions pour débloquer le côté décisionnel ». La Ronde du jour
avait montré que le paysage est en excellent état mécanique et en mauvais état décisionnel — le
travail mécanique avance sans lui, le reste ne peut pas. Voici ce qu'il a tranché, et ce que
chaque réponse a débloqué.)*

## #206 — les sept Gardiens sacrés : **LES SEPT D'UN COUP**

Il a écarté ma recommandation (« un seul d'abord ») et pris le chantier complet. Changer ce que
les sept renvoient touche tous leurs appelants et tous leurs tests. **Autorisé, à faire.**

## #852 — les cinq outils au verdict contradictoire : **CAS PAR CAS**, et les cinq sont tranchés

| Outil | Sa décision | Appliqué |
|---|---|---|
| god-of-all-process | **dispensé** — il relaie ce que les autres ont trouvé | ✅ déclaré, avec sa raison |
| sauvegarde-projet | **dispensé** — il rend un état, il ne juge rien | ✅ déclaré, avec sa raison |
| tool-brain | **doit conclure** — sa raison écrite n'était plus vraie | ✅ câblé, et il trouve déjà 2 vrais écarts |
| le-regisseur | **doit conclure** — contre ma recommandation | ✅ câblé (voir pourquoi il avait raison ci-dessous) |
| check-spirit | **dispensé sur le TON, conclut sur le RESTE** | ✅ câblé, frontière écrite dans le code |

**Où son arbitrage voyait mieux que ma recommandation — le cas `le-regisseur`.** J'avais proposé de
le laisser dispensé : « il enchaîne des étapes mécaniques, les constats appartiennent aux outils
qu'il lance ». C'est vrai pour les JUGEMENTS, et faux pour les ÉCHECS D'ÉTAPE. Un fichier de
simulation qui n'a pas été archivé disparaît avec le scratchpad, définitivement — c'est le constat
le plus coûteux de tout le paysage, et il l'affichait sans jamais en faire une tâche.

**Résultat mesuré après application : 19 scanners sur 30 concluent (contre 14), et le garde-fou de
divergence est passé au vert — les deux sources s'accordent enfin sur les 30 outils instruits.**

## #850 — CLEAN-DIRTY-OLD : **LANCER UN VRAI PASSAGE**, et la mesure a tranché la question

Passage lancé dans la foulée : **aucune zone signalée**. C'était donc la cause A — le silence du
carnet était correct, et la règle « un passage sans trouvaille ne mérite pas de ligne » a bien
fonctionné. Une question réglée par une mesure gratuite plutôt que par une hypothèse.

## #801 — les cérémonies de badge : **UNE PAR CHANGEMENT RÉEL**

Tant que le motif ne bouge pas, on ne republie pas. À implémenter.

## #861 — le thème SQUID GAME : son idée est enfin écrite là où on la cherchera

*(Ajoutée le 2026-09-25 : le garde-fou de fraîcheur a montré qu'elle vivait dans `docs/suivi/`
(tâche #734) et nulle part dans `docs/referentiel/regles-des-graphismes.md`.)*

**Ses mots** : « je veux que le theme graphique soit SQUID GAME, qu'en penses-tu ? »

**Rien n'a été fait dessus, et c'est volontaire** : la refonte graphique est sa limite déclarée.
L'idée est désormais inscrite dans le document de son chantier, marquée NON TRANCHÉE, sans une
ligne de développement. Sa question se termine par « qu'en penses-tu ? » — elle attend un échange,
jamais une exécution.

### Ajoutée le 2026-09-26 par la mesure des couches des Gardiens sacrés (#916)

| Tâche | Sujet | Décision |
|---|---|---|
| #917 | Charte — la couche lourde promise à ARGUS et HARMONIA, que le catalogue PRESTATIONS ne porte pas | à trancher |

## #917 — la charte promet une couche lourde à ARGUS et HARMONIA que le registre ne porte pas

*(Ajoutée le 2026-09-26, tâche #916 : la mesure des couches des Gardiens sacrés a trouvé l'écart.)*

**L'écart, en une phrase** : l'Article 20 affirme mot pour mot que « ARGUS et HARMONIA ajoutent en
plus, sur demande, une seconde partie à vrai raisonnement (coût réel, Article 8) », et **aucun des
deux n'est déclaré coûtant dans le catalogue PRESTATIONS** — le registre que la mesure lit, et celui
que tool-brain affiche à chaque commit.

**Trois lectures, et elles appellent des gestes opposés** :

1. **la couche lourde existe et le catalogue est en dette** → il faut l'y inscrire, et tool-brain la
   proposera désormais quand elle est pertinente ;
2. **elle n'existe pas** → la charte promet quelque chose qui n'a jamais été construit, et il faut
   soit la construire soit retirer la promesse ;
3. **c'est un geste de l'AGENT** (relancer ARGUS en réfléchissant vraiment) et non une commande →
   alors elle n'est portée par aucun mécanisme, et l'Article 27 demande de le déclarer noir sur
   blanc plutôt que de le laisser deviner. *(C'est déjà le cas d'ALWAYS-NEW-CODE, dont le vrai zoom
   « page blanche » se déclenche par CHECK-LEVEL-TARGET et reste invisible à cette même sonde.)*

**Pourquoi l'agent ne tranche pas** : les trois ont un coût différent, et deux d'entre elles
touchent la charte — intouchable sans son accord.

**Rapport complet** : `docs/cassandra-rh/couches-des-gardiens-2026-09-26.md`.

### Ajoutée le 2026-09-26 par l'inventaire des rapports txt (#921)

| Tâche | Sujet | Décision |
|---|---|---|
| #922 | Données — la politique de rétention des trois plus gros dossiers d'archives | à trancher |

## #922 — garder N derniers, compacter, ou externaliser les archives ?

*(Ajoutée le 2026-09-26, tâche #921 : l'inventaire des rapports txt a mesuré où pèse vraiment le
poids.)*

**Le chiffre, et il resserre la question au lieu de l'élargir** : sur 3 738 Ko d'archives dans
`docs/`, **trois dossiers en pèsent 1 028 à eux seuls** — `docs/simulations`, `docs/ecotoken`,
`docs/check-tasks-details`. Les 37 autres pèsent 2,7 Mo et ne coûtent rien à garder. **Une politique
de rétention ne se discute donc que sur ces trois-là**, jamais sur les 282 fichiers en bloc.

**Les trois options, et elles n'ont pas le même coût** :

1. **garder les N derniers** de chaque dossier et effacer au-delà → le plus simple, mais on perd la
   capacité de comparer à loin, qui est justement ce que ces archives servent ;
2. **compacter les anciens en un résumé** → le geste existe déjà pour les simulations
   (`scripts/summarize-simulation-log.mjs`, écrit exactement pour ça) : on garde le fait, on perd le
   détail ;
3. **externaliser hors du dépôt git** → on garde tout et le dépôt arrête de grossir, mais la preuve
   n'est plus opposable depuis le dépôt seul, ce qui contredit l'Article 27 (une autre IA n'a que le
   dépôt).

**Pourquoi l'agent ne tranche pas** : ça touche à ce qu'on garde comme **preuve**, et décider seul
de ce qui s'efface n'est pas une décision d'agent.

**Ce qui rend la décision utile sans la rendre urgente** : le dépôt suivi par git est passé de 2,2 à
19 Mo en sept jours (#906) et ces archives en sont une part directe — mais l'hébergement reste à 0 €
(mesuré en #906), donc rien ne brûle.

**Rapport complet** : `docs/data-archangel/classification-des-data-2026-09-26.md`.


*(Note du 2026-09-27, tâche #1000 : `lib/reference.ts` a été RETIRÉ du produit ce jour-là. Les renvois ci-dessus RACONTENT le passé et restent tels quels — effacer le POURQUOI d'un correctif parce que le fichier a bougé est précisément ce que les Articles 19 et 27 interdisent. Son texte intégral (50 sections, 151 versions) est archivé verbatim dans `docs/contexte-projet/referentiel-affiche-en-jeu-archive.md`, qui reste une archive de contexte et jamais une source de vérité sur le comportement actuel.)*

| #1067 | Charte — les Articles 18 et 26 se recouvrent à 19 % sans que rien ne dise lequel prime | à trancher |

## #1067 — deux Articles sur le même terrain, et aucune frontière écrite

**Trouvé par Abraham-les-références** à la Ronde du 2026-09-28, sur `CLAUDE.md` :
`18 ↔ 26 — 19 % de vocabulaire commun`, sans frontière déclarée.

**Ce que chacun dit aujourd'hui.** L'Article 18 : un gros process se suit EN ENTIER, dans son ordre,
sans être raccourci de sa propre initiative. L'Article 26 : les process se respectent, et
god-of-all-process en est le référent de la discipline d'exécution.

**Pourquoi ce n'est pas mécaniquement un doublon.** Un recouvrement de vocabulaire seul n'a jamais
valu doublon dans ce projet — la charte contient légitimement des paires qui parlent du même
terrain. Ce qui ouvre une question, c'est le recouvrement **sans frontière écrite** : rien ne dit
lequel prime quand les deux s'appliquent à la même situation.

**Même nature que #623**, qui a relevé trois recouvrements dans `docs/regles-de-travail.md` et que
l'utilisateur a choisi de noter sans y toucher (« Note-les, on verra plus tard »).

**Les deux issues, et elles lui appartiennent :**
- écrire la frontière manquante dans l'un des deux (« à ne pas confondre avec l'Article X, qui
  traite de… ») ;
- ou constater que le recouvrement est un choix de conception assumé, et le DÉCLARER — ce qui est
  une décision pleine et entière, jamais un abandon (Article 28).

**Ce qui n'est PAS proposé** : fusionner les deux Articles. Les numéros d'Article ne se renumérotent
jamais (ils sont cités tels quels dans le code et la documentation), et l'Article 23 montre la forme
que prend une fusion ici — le numéro reste occupé et renvoie vers son hôte. Abraham ne tranche jamais
la pertinence d'une règle, et l'agent non plus sur la charte.

---

## Un commit de SUITE compte-t-il comme « sans mise à jour du suivi » ? (2026-09-28, tâche #1079)

**Le cas réel, et il est à moi.** `check-suivi-fidelity` signale le commit `0b2ae63` : « 1 commit a
changé du code ou de la charte sans jamais toucher `docs/suivi/` ». Ce commit ne contient qu'un
fichier : `docs/referentiel/angel-of-ia-process.md`, la fiche écrite dans la foulée de la tâche
**#1069**, dont la ligne de suivi existe bel et bien — écrite dans le commit précédent.

**Pourquoi je ne tranche pas moi-même, et c'est le cœur du point.** Le commit accusé est le mien.
Assouplir le garde-fou ferait disparaître mon propre reproche, et c'est très exactement le geste que
je me suis interdit cette nuit sur un autre outil (« je refuse de desserrer un garde-fou pour faire
passer mon propre changement »). Un garde-fou qu'on ajuste le jour où il mord son auteur ne protège
plus rien.

**Ce qui plaide POUR le garder tel quel :**
- la règle est écrite « dans le MÊME commit », sans exception, et sa sévérité est ce qui l'a fait
  tenir ;
- « je citerai le numéro de tâche » est une échappatoire facile : n'importe quel message peut porter
  un `#123` sans que la ligne décrive le travail du commit ;
- la fiche aurait pu, et dû, partir dans le même commit que le reste de #1069.

**Ce qui plaide POUR l'affiner :**
- le but déclaré de la règle est d'attraper « la dérive réelle trouvée le 2026-09-19 » — du travail
  qui atterrit sans aucune trace dans le suivi durable. Ici la trace existe ;
- un reproche qu'aucune action ne peut éteindre devient du décor (L6) : l'historique ne se réécrit
  pas, donc ce commit restera signalé tant qu'il sera dans la fenêtre glissante ;
- c'est, encore une fois, un **signal adjacent** lu comme le signal visé : « ce commit touche-t-il
  `docs/suivi/` ? » n'est pas « ce travail est-il tracé ? ».

**Les trois issues, et elles lui appartiennent :**
1. **Ne rien changer** — la sévérité est le service rendu, et un faux positif toutes les cinquante
   fenêtres est un prix acceptable.
2. **Affiner sur un critère VÉRIFIABLE** — un commit est tracé si son message cite un numéro de
   tâche qui **existe réellement** dans `docs/suivi/`, la vérification portant sur l'existence de la
   ligne, jamais sur la seule présence du `#`.
3. **Affiner plus étroitement encore** — la même règle, mais uniquement pour un commit qui ne touche
   QUE de la documentation (`docs/referentiel/`, un blueprint, un index), jamais du code.

**Mon avis, demandé ou non, et il vaut ce qu'il vaut puisque je suis partie prenante** : l'issue 3.
Elle répond au cas réel sans ouvrir l'échappatoire que l'issue 2 offrirait à un commit de code.

## #1175 — deux motifs de numéro de tâche dans le même fichier, qui ne s'accordent pas

*(2026-09-29. Première trouvaille du détecteur de motifs quasi-jumeaux, tâche #1174.)*

| Numéro | Sujet | Décision |
|---|---|---|
| #1175 | Outillage — deux motifs de numéro de tâche dans `god-of-all-process.mjs`, qui ne s'accordent ni en bas ni en haut de l'échelle | à trancher |

**LE FAIT, en deux lignes.** `scripts/god-of-all-process.mjs` porte deux motifs qui lisent tous deux
un numéro de tâche du même registre :

- `MOTIF_NUMERO = /#(\d{1,5})\b/g` — accepte 1 à 5 chiffres ;
- `MOTIF_NUMERO_COMMIT = /#(\d{2,4})\b/g` — accepte 2 à 4 chiffres.

**POURQUOI PERSONNE NE L'A VU** : le registre est à #1175, donc quatre chiffres. Les deux motifs
s'accordent sur toute la population réelle. C'est exactement la forme du défaut #1171 — la même
notion écrite deux fois, presque pareil — mais prise **avant** qu'elle ne coûte quoi que ce soit.

**MISE À JOUR DU 2026-09-30 (tâche #1270) — LA DIVERGENCE EST SUPPRIMÉE ; LA VALEUR RESTE À
TRANCHER.** Deux choses se sont passées. D'abord **j'ai aggravé le défaut sans le voir** : en
élargissant la chaîne des tâches (#1250), j'ai écrit un **troisième** motif, `{2,5}`. Trois
écritures d'une même notion là où ce registre en signalait déjà deux comme un défaut — vu
seulement en relisant cette liste à froid deux heures plus tard.

Ensuite j'ai unifié les trois sur **une seule constante nommée**,
`CHIFFRES_DUN_NUMERO_DE_TACHE`. **Ce n'était pas trancher à sa place** : cette fiche établit déjà
qu'une notion écrite deux fois est un défaut, et aucune réponse possible ne demanderait d'en
garder trois. **Ce qui reste sa décision, et qui ne coûte plus qu'un mot à changer à UN endroit :
la valeur de la borne.** Elle est à `2,5` aujourd'hui.

*Vérifié plutôt que supposé avant d'y toucher : aucune tâche du registre ne porte un numéro à un
seul chiffre (la plus petite est #390), donc exiger deux chiffres ne perd rien — et gagne quelque
chose, puisque `#1` ou `#3` sont des marqueurs d'énumération, jamais des tâches.*

**CE QUI CASSERA, ET OÙ** : à #10000, le second cesse de reconnaître les numéros cités dans les
messages de commit, sans rien dire. Or c'est lui qui alimente la chaîne rapport → tâche de
l'Article 28 (`checkActionChain`), celle qui vérifie qu'une tâche annoncée existe pour de vrai. Une
référence morte ressemble à un lien, ce qui est pire qu'une absence.

**Les trois issues, et elles lui appartiennent :**

1. **Ne rien changer** — les deux bornes sont des choix délibérés, et le cas ne se présentera pas
   avant plusieurs mois de travail.
2. **Élargir le second à `{2,5}`** — le plus petit geste possible. Contrepartie : il attraperait
   aussi un `#12345` qui ne serait pas un numéro de tâche.
3. **Une seule constante, lue par les deux** — `MOTIF_NUMERO_DE_TACHE` dans `criticite.mjs`, où vit
   déjà le format des lignes de tâche. C'est la vraie réponse au sens de #1171 : on corrige le motif
   là où il est DÉFINI, jamais chez celui qui s'en plaint.

**Mon avis, et je suis partie prenante puisque c'est mon outil qui a trouvé ça** : l'issue 3, mais
elle n'est pas anodine — elle change ce que **deux** lecteurs reconnaissent, dans le fichier même
qui surveille les process. C'est pour ça qu'elle attend une décision au lieu d'être appliquée.


## #1192 — faut-il SUIVRE dans le temps la couverture des outils, maintenant qu'elle se mesure ?

*(2026-09-29. Suite de #1189 et #1191.)*

| Numéro | Sujet | Décision |
|---|---|---|
| #1192 | Données — faire entrer la couverture des outils au tableau de bord, ou la laisser à la bannière | à trancher |

**LA CHAÎNE EST COMPLÈTE AUX DEUX TIERS.** La couverture des outils se **mesure** (#1189 : 39 outils
au lieu de zéro) et se **voit** à chaque commit (#1191 : la bannière affiche enfin un chiffre). Il
manque le troisième tiers : la **suivre dans le temps**, pour qu'une dégradation se voie au lieu
d'être découverte par hasard comme cette nuit.

**Ce que ça coûterait : presque rien.** `kpi-report.mjs` lance déjà le filet sous `NODE_V8_COVERAGE`
et lit la couverture des libs depuis ce relevé. Une ligne de plus, sur le dossier déjà ouvert.

**Pourquoi c'est quand même une décision.** Une colonne de plus s'ajoute à `KPI_HISTORY_COLUMNS`, à
`NATURE_DES_COLONNES_KPI` et à `docs/referentiel/kpi-historique.csv` — **un historique committé**.
Toutes les lignes passées porteraient une cellule vide. Or la déclaration de nature dit qu'une
colonne « locale » restée vide est *une vraie connexion perdue* : le tableau de bord signalerait
comme cassé un lien qui n'existait pas encore, sur tout l'historique.

**Les trois issues, et elles t'appartiennent :**

1. **Ne pas suivre** — la bannière suffit : un chiffre par commit se lit très bien.
2. **Suivre**, en acceptant des cellules vides avant aujourd'hui — à condition de vérifier d'abord
   que l'audit des colonnes ne regarde que les runs RÉCENTS.
3. **Suivre dans un registre à part**, hors du CSV historique : ça évite la question, et ça ajoute
   un endroit de plus à tenir.

**Mon avis, et je suis partie prenante puisque c'est ma mesure** : l'issue 2 *si et seulement si*
l'audit est borné aux runs récents ; sinon la 1 — un tableau de bord qui crie sur son propre passé
est exactement le garde-fou qu'on cesse de lire.

---

## Voisinage déclaré : `docs/mode-auto-process-guardian.md`

*(2026-09-29.)* Le process de nuit autonome est ce qui fait remonter la plupart des décisions
inscrites ici. Le lien va dans un seul sens et ne fait pas de ces deux textes des jumeaux : l'un
décrit des étapes, l'autre tient des choix en attente.

**Pourquoi le rapprochement a eu lieu, et c'est une limite de la mesure** : elle compare des mots.
Les deux ont grossi la même nuit sous la même plume. Ce n'est pas leur sujet qui se ressemble, c'est
mon écriture — et une note longue pour l'expliquer créait aussitôt la paire suivante. Le
raisonnement complet vit donc dans la ligne de suivi #1193, pas ici.

## Voisinage déclaré : `docs/referentiel/lecons.md`

*(2026-09-29.)* La frontière est nette et vaut d'être dite : le registre des leçons tient ce que le
projet a **déjà payé** — une erreur commise, sa cause, et ce qu'elle a coûté. Celui-ci tient ce qui
**n'est pas encore décidé**. L'un regarde en arrière sur des faits acquis, l'autre en avant sur des
choix ouverts. Ils se croisent souvent — presque chaque décision en attente cite la leçon qui
l'éclaire — mais une leçon ne se rediscute pas et une décision n'est pas une expérience.

## Voisinage déclaré : `docs/xp-ia-process-detail.md`

*(2026-09-29.)* Celui-là décrit le PROCESS par lequel une expérience se découvre, s'enregistre et
ressort au bon moment ; celui-ci est un REGISTRE de choix en attente. Le premier dit comment on
apprend, le second ce qu'on n'a pas encore tranché. Le rapprochement vient de ce qu'ils parlent
tous deux de décisions et de mécanismes, avec le même vocabulaire — exactement la limite que la
décision #1193 juste en dessous met sur la table, et c'est la **deuxième fois** que ce même
document déclenche la mesure en grossissant.

## Voisinage déclaré : `docs/referentiel/organisation-agence.md`

*(2026-09-29.)* Plusieurs décisions en attente ici portent sur l'organisation de l'outillage — qui
garde quoi, quel outil appartient à quel rang. Le référentiel décrit cette organisation ; ce
registre tient les choix qui la feraient bouger. Voisins par le sujet, jamais interchangeables.

## #1193 — le détecteur de documents jumeaux rapproche-t-il les sujets, ou mon écriture ?

*(2026-09-29.)*

| Numéro | Sujet | Décision |
|---|---|---|
| #1193 | Outillage — faut-il que le détecteur de jumeaux tienne compte du vocabulaire propre au projet | à trancher |

**Observé en direct** : déclarer un faux rapprochement a immédiatement créé le suivant. Zéro paire
avant mes ajouts du jour, une après le premier, une autre après l'explication du premier.

**Les trois issues :**

1. **Ne rien changer** — déclarer un voisinage coûte trois lignes, et la boucle s'arrête dès qu'on
   écrit court.
2. **Écarter du calcul le vocabulaire propre au projet** (noms d'outils, mots de la charte), qui est
   justement celui que tous mes documents partagent.
3. **Comparer par section** plutôt que par document entier : deux textes longs finissent toujours par
   se croiser quelque part ; deux sections qui disent la même chose sont un vrai doublon.

**Mon avis** : la 2, parce qu'elle attaque la cause mesurée plutôt que le symptôme — mais elle change
ce qu'un Gardien sacré détecte, donc elle se décide.

## #1197 — l'estimation de la Ronde s'applique-t-elle à une Ronde AUTONOME ?

*(2026-09-29. Rendue décidable par #1196, qui enregistre enfin le mode de chaque Ronde.)*

| Numéro | Sujet | Décision |
|---|---|---|
| #1197 | Process — exempter ou non la Ronde autonome de l'estimation préalable | à trancher |

**Le fait mesuré** : le registre d'estimations porte **deux lignes pour six Rondes** tenues.

**Ta demande, mot pour mot** : « donne moi une estimation de temps à chaque fois en début de ronde
selon le programme choisi », puis « compare à la fin ton estimation avec le temps reel et consigne
le pour la prochaine fois, pour ajuster tes estimations ».

**Ce qui rend la question légitime** : « donne-**MOI** ». L'estimation t'est destinée, pour que tu
saches combien de temps tu attends. Une Ronde autonome tourne pendant que tu dors.

**L'argument inverse, et il est réel** : la seconde moitié — comparer et consigner « pour ajuster
tes estimations » — sert les PROCHAINES estimations. La durée réelle d'une Ronde autonome est une
donnée aussi bonne qu'une autre pour ça.

**Trois issues :**

1. Exempter la Ronde autonome des **deux** gestes — simple, mais on perd des mesures gratuites.
2. Exempter seulement l'**estimation préalable**, garder la mesure du réel.
3. N'exempter de rien — l'estimation sert aussi d'auto-contrôle à l'agent.

**Ma recommandation : la 2** — elle respecte le sens de « donne-moi » sans jeter ce que la seconde
moitié de ta demande cherchait à obtenir.

## #1203 — 38 balayages de fichiers sur 42 abandonnent en silence : faut-il qu'ils le disent ?

| Numéro | Sujet | Décision |
|---|---|---|
| #1203 | Outillage — un fichier qu'un outil n'a pas pu lire doit-il apparaître dans son rapport | à trancher |

**Comment la question est arrivée** : CLONE-HUNTER signalait cinq lignes recopiées à trois endroits
de `safe-export.mjs`. En cherchant POURQUOI les trois blocs existent — la règle qui a déjà payé
trois fois cette nuit — ces cinq lignes se sont révélées être le préambule ordinaire de toute
fonction qui balaie une liste de fichiers : ouvrir chacun, et passer au suivant si la lecture
échoue.

**LE FAIT MESURÉ** — et il est REMESURABLE à tout moment par `node scripts/safe-export.mjs
sautes`, jamais cité de mémoire : sur les 93 fichiers d'outils, **42 endroits** balaient une liste
de fichiers en passant au suivant quand la lecture échoue, et **38 d'entre eux le font sans en
garder la moindre trace**, répartis sur **14 outils**. Quatre seulement comptent ce qu'ils n'ont pas pu lire.

**LE CHIFFRE A ÉTÉ CALIBRÉ, PAS CUEILLI, et ça vaut d'être dit** : une première version du motif
comptait 171 sites. Un échantillon lu à la main a montré que la majorité des nouveaux venus étaient
légitimes — un repli qui essaie le chemin suivant, un défaut documenté rendu à la place, un constat
déjà poussé disant que le fichier est illisible. Un garde-fou qui accuse à tort cesse d'être lu
(leçon L4), donc le motif a été resserré sur la forme qu'il vise vraiment. Sur les 38 restants,
sept tirés au hasard ont été relus un par un : les sept sont bien la forme visée.

**Pourquoi ça mérite une décision plutôt qu'une correction** : c'est le défaut que ce projet traque
partout ailleurs — « je n'ai pas pu regarder » qui se lit exactement comme « j'ai regardé, il n'y a
rien » (leçons L5 et L11). Mais ici, la lecture suit toujours un listage du disque fait une seconde
plus tôt : un échec suppose une permission changée, un lien cassé, ou une course entre les deux.
C'est rare au point qu'on peut légitimement décider de ne rien changer.

**Ce qui penche pour ne rien faire** : 38 corrections dans 14 outils, pour un cas qui ne s'est
peut-être jamais produit. Et un compteur qui affiche 0 à chaque passage finit par ne plus être lu
(leçon L6).

**Ce qui penche pour le faire** : le jour où ça arrivera, le rapport sera FAUX sans que rien ne le
dise, et il n'y aura aucun moyen de s'en apercevoir après coup.

**Trois issues :**

1. **Ne rien changer**, et l'écrire noir sur blanc ici pour que la question ne se rouvre pas.
2. **Un compteur partagé** : une seule fonction de lecture commune qui tient le compte des fichiers
   sautés, et chaque rapport affiche la ligne UNIQUEMENT quand ce compte dépasse zéro — jamais un
   0 permanent qui deviendrait du décor.
3. **Les Gardiens sacrés seulement** : les sept outils dont le verdict fait autorité comptent leurs
   sautes ; les autres restent comme ils sont.

**Ma recommandation : la 2.** Elle règle le fond sans créer l'alarme permanente que la 3 évite en
réduisant la portée, et elle est le seul cas où factoriser ces cinq lignes apporte autre chose
qu'un gain de place — ce qui répond du même coup au constat de CLONE-HUNTER. Elle reste un
chantier de 8 fichiers, donc elle attend ton feu vert.

**Ce qui est fait en attendant, et pourquoi c'est tout** : la grappe de `safe-export.mjs` n'est PAS
factorisée. Fondre trois préambules sur quatre-vingt-douze serait du rangement local sur un défaut
général — et ça ferait disparaître du relevé la seule trace visible d'une question qui vaut d'être
posée.

## #1209 — le registre d'un OUTIL a-t-il vraiment besoin qu'un AUTRE outil le lise ?

| Numéro | Sujet | Décision |
|---|---|---|
| #1209 | Outillage — le critère « donnée fraîche sans lecteur » convient-il aux registres d'outils | à trancher |

**Comment la question est arrivée** : data-archangel signale depuis la tâche #490 les données
FRAÎCHES qu'aucun outil autre que leur producteur ne relit. Elles étaient dix-huit, elles sont
**cinq** — et j'en ai fermé une hier soir pour de bonnes raisons (#1208 : le registre de
FILET-EN-PARTS annonçait un gain chiffré que rien ne confrontait ; EZECHIEL le confronte désormais
à son propre relevé chronométré).

**Les cinq qui restent ne se ressemblent pas à celle-là** : `docs/jesus-le-sauveur/`,
`docs/doc-report/`, `docs/le-classificateur/`, `docs/the-screener/`, `docs/reponses/`. Ce sont les
registres de sortie d'outils — ce que chacun a trouvé, passage après passage.

**Le vrai doute, et il porte sur le CRITÈRE plutôt que sur les cinq** : « personne ne lit » veut
dire ici « aucun AUTRE SCRIPT n'exploite le contenu ». Mais le lecteur naturel du registre d'un
outil, c'est **l'agent** — moi — quand je veux savoir ce que cet outil a trouvé les fois
précédentes. Un second script qui relirait ces lignes relirait la sortie d'un outil qu'il peut
appeler lui-même : il n'apprendrait rien qu'il ne sache déjà, et ce raisonnement est DÉJÀ écrit
dans le dépôt pour `.banniere-post-commit.txt`, déclarée « sans lecteur, et c'est assumé » pour
exactement ce motif.

**Ce qui empêche de conclure tout seul** : la différence entre les cinq et la sixième est réelle.
Le registre de FILET-EN-PARTS portait une AFFIRMATION CHIFFRÉE qu'une mesure pouvait démentir —
c'est ça qui méritait un lecteur, pas le fait d'être un registre. Les cinq portent des constats en
prose. Mais je ne peux pas décider à ta place que « ce que JESUS a trouvé la semaine dernière »
n'intéresse aucun autre outil : c'est un jugement sur la valeur de ces contenus, pas un fait.

**Trois issues :**

1. **Déclarer les cinq « sans lecteur, et c'est assumé »**, avec la raison écrite une fois pour
   toutes : le registre d'un outil se lit par l'agent, et un second script n'en tirerait rien.
2. **Affiner le critère plutôt que la liste** : ne compter comme trou que les données qui portent
   un CHIFFRE ou une AFFIRMATION VÉRIFIABLE — comme celui de FILET-EN-PARTS. Un registre en prose
   ne serait alors plus compté, et le compteur redeviendrait actionnable.
3. **Ne rien changer** : garder les cinq visibles, en acceptant qu'un compteur qui ne descend pas
   finit par ne plus être lu (leçon L6).

**Ma recommandation : la 2.** C'est la seule qui corrige la MESURE plutôt que la liste — le
défaut n'est pas que cinq registres manquent d'un lecteur, c'est que le critère met dans le même
sac une affirmation chiffrée que personne ne vérifie et un journal de prose que personne n'a de
raison de relire. La 1 ferait descendre le compteur sans rien apprendre ; la 3 laisse une alarme
qui ne peut pas s'éteindre.

**Ce qui est fait en attendant, et pourquoi c'est tout** : rien. Inventer cinq lecteurs pour faire
descendre un compteur serait exactement l'outil fabriqué pour cocher la case que l'Article 31
interdit nommément.

---

## #1222 — Le compteur d'usage a perdu treize jours, et le KPI lit ce trou comme un verdict

*(Trouvé le 2026-09-29 à 16h50 UTC, heure LUE. Mesuré, jamais supposé.)*

**LA MESURE, D'ABORD.** Le journal d'usage (`.tool-usage-history.json`) porte aujourd'hui
**857 événements, dont le plus ancien date du 2026-09-29 à 03h38** — treize heures. Le dépôt, lui,
a **treize jours** (premier commit le 2026-09-16). La fiche `docs/referentiel/tool-usage.md` cite
**4 931 événements** au 2026-09-28. Le journal est dans `.gitignore` : **il n'a pas voyagé avec le
clone, il a été reconstruit de zéro ce matin.**

**CE QUE LE KPI EN FAIT.** `node scripts/tool-brain.mjs rapport` annonce
**« 29 outils du catalogue jamais sollicités »** et en fait un écart retenu, dont le « quoi faire »
est : *« les lancer une fois pour de vrai, ou décider de les retirer »*. Sur un clone frais, ces
29 lignes deviendraient 29 tâches, et l'une d'elles proposerait de **retirer** des outils qui
tournent depuis des semaines.

**C'EST EXACTEMENT LA CLASSE D'ERREUR DE LA NUIT** — un signal ADJACENT lu comme le signal visé.
Le compteur mesure honnêtement « jamais vu passer **depuis que ce journal existe** » ; le rapport
l'imprime comme « jamais sollicité **par le projet** ». Les deux phrases ne disent pas la même
chose dès que le journal est plus jeune que le dépôt.

**CE QUI EST DÉJÀ BIEN FAIT, et qu'il ne faut pas défaire** : la limite est écrite noir sur blanc
dans `docs/referentiel/tool-usage.md` (« il décrit l'usage sur CETTE machine »), et le rapport
distingue déjà QUATRE états au lieu de deux (jamais sollicité · couvert par le crochet · muet au
compteur · sans ligne de commande). Le trou n'est pas dans la pensée, il est dans **l'endroit** :
la limite est écrite dans la fiche, pas à côté du chiffre.

**Trois issues :**

1. **Imprimer l'HORIZON du journal à côté de chaque chiffre d'usage** — « journal ouvert le
   2026-09-29 03h38, soit 13 h de couverture pour un dépôt de 13 jours ». Le chiffre reste, le
   lecteur sait ce qu'il vaut.
2. **Dériver le seuil plutôt que l'écrire** : comparer la date du plus ancien événement au premier
   commit du dépôt, et **ne plus lever l'écart** quand le journal est manifestement plus jeune —
   parce qu'alors « jamais sollicité » et « journal amnésique » sont indiscernables.
3. **Commiter le journal** pour qu'il survive au clone. Écartée d'avance à mon sens : il grossit
   à chaque commande et ferait du bruit dans chaque diff.

**Ma recommandation : la 1 ET la 2.** Elles ne se remplacent pas. La 1 protège le LECTEUR (il voit
ce que le chiffre couvre) ; la 2 protège le PLAN D'ACTION (il cesse de fabriquer des tâches que
personne ne doit faire). La 2 seule rendrait le chiffre muet sans expliquer pourquoi.

**Ce qui est fait en attendant : rien, et c'est délibéré.** Toucher à `tool-brain` touche aussi
CASSANDRA-RH (qui s'en sert pour juger si un outil a sa place) et le verrou d'ouverture de Ronde.
Ça se décide avec toi, pas à 16h50 pendant que tu rentres du travail.

---

### MISE À JOUR DU 2026-09-30 (tâche #1283) — l'issue 1 est FAITE, l'issue 2 reste entière

**CE QUI A CHANGÉ, ET POURQUOI CE N'ÉTAIT PAS UNE DÉCISION.** L'issue 1 — imprimer l'horizon à côté
de chaque chiffre — avait déjà été CODÉE le 2026-09-29 (`horizonDuJournal()`, `formatHorizonLine()`
dans `scripts/tool-usage.mjs`). Elle n'était **câblée que chez `tool-brain`**. CASSANDRA-RH, qui
propose de RETIRER des outils, et Doc-Report rendaient leur verdict sans la réserve. Finir un
câblage commencé n'ouvre aucune option et n'en ferme aucune : c'est l'Article 3 (corriger la cause)
et la leçon L2 (un remède non câblé est une intention), pas un arbitrage à ta place.

**Les quatre endroits câblés le 2026-09-30** — et le troisième est le plus étendu :

| Endroit | Ce qui s'affiche maintenant |
|---|---|
| `cassandra-rh.mjs` | la réserve est collée AU MOTIF de retrait, pas à l'en-tête du rapport — un en-tête ne suit pas le motif quand il est recopié dans les blocs et le HTML |
| `doc-report.mjs` | l'horizon en tête de l'index, et l'annotation par ligne renvoie à lui |
| `report-template.mjs` | la ligne de santé imprimée en tête de **chaque** rapport du dépôt |
| `le-coordinateur.mjs` | la phrase du catalogue qui promettait « le cumul permanent, **depuis le début du projet** » — elle était simplement fausse |

**ET LE GARDE-FOU QUI EMPÊCHE LE PROCHAIN LECTEUR D'OUBLIER** : `findVerdictsSansHorizon()`
(`scripts/safe-export.mjs`), lancé à chaque commit. Il rend aujourd'hui **0 écart sur 3 lecteurs**.

**LE CAS RÉEL QUI PROUVE QUE CE N'ÉTAIT PAS THÉORIQUE** : le 2026-09-28, `check-spirit` a affiché
« jamais sollicité d'après le compteur » **dans l'en-tête d'un rapport qu'il était en train de
produire**, avec ses deux transcripts déposés le jour même dans `docs/check-spirit/`.

**CE QUI RESTE À TRANCHER, ET RIEN N'A BOUGÉ DESSUS :**

- **L'issue 2** — ne plus LEVER l'écart quand le journal est plus jeune que le dépôt. Elle protège
  le PLAN D'ACTION, là où l'issue 1 protège le lecteur. Toujours recommandée, toujours ouverte.
- **L'issue 3** — versionner le journal. Toujours écartée à mon sens (bruit dans chaque diff), mais
  c'est une décision d'hygiène du dépôt, donc la tienne.

