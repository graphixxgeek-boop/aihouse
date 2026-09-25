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
| #801 | Badge — la FAMILLE a disparu de la cérémonie, 23 cérémonies identiques d'un coup · **remesuré le 2026-09-25 après la Ronde : 20 cérémonies en attente, toutes « partiel (KO CLONE-HUNTER) », donc le motif tient et ne s'épuise pas** | à trancher |
| #805 | File — 87 % de tâches légères et 49 thèmes : émiettement, ou rythme sain ? | à trancher |
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
| #841 | La Ronde : 30 commits sans passage — la lancer, et avec quels items ? | à trancher |

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
