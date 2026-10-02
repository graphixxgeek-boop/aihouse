# THE-KING — instanciation pour Maison IA vivante

*(2026-09-21. Principe générique : `docs/the-king-blueprint.md`. Code : `scripts/the-king.mjs`.
Registre des évolutions constatées de `docs/philosophie-et-politique.md` : `docs/the-king/`.)*

## Rôle exact

THE-KING veille à ce que les décisions à haut niveau de ce projet consultent réellement
`docs/philosophie-et-politique.md` avant d'être prises — jamais après coup. Il ne décide rien sur le
fond (aucune autorité sur le contenu de la charte ou du code) : il rappelle, mesure la fraîcheur du
document, et signale une tension possible entre deux principes. Surnom donné par l'utilisateur : un
rôle de « père » ou « grand-père » — celui qui rappelle les valeurs de fond sans jamais se substituer
à qui décide.

## Les 6 catégories de déclenchement (confirmées avec l'utilisateur, 2026-09-21)

Chacune répond à « est-ce que cette décision serait coûteuse ou difficile à défaire si elle
contredisait une valeur de fond ? » — un mot-clé est un SIGNAL, jamais une certitude :

1. **Nouvelle architecture technique** — refonte, restructuration, migration, changement de stack.
2. **Nouveau mécanisme de jeu à fort impact** — nouvelle jauge, règle du jeu, révélation, gameplay.
3. **Création d'un nouvel outil membre de l'équipe** — un nouvel agent-script rejoint le réseau.
4. **Changement d'ordre ou de priorité de la feuille de route** — un chantier repasse devant un autre.
5. **Décision généralisable à un futur projet** — un principe destiné à survivre à ce projet précis.
6. **Décision irréversible ou coûteuse** — suppression, renumérotation, changement définitif.

`classifyDecisionTriggers(requestText)` retourne les catégories détectées ; `reminderFor(requestText)`
formule le rappel lisible correspondant (`null` si aucune catégorie détectée).

## Parsing du document de philosophie

`extractPrincipleUnits(text)` découpe `docs/philosophie-et-politique.md` sur ses titres réels
(`### N.N Titre **[tag]**`) — même principe que `extractRuleUnits()` de CLAUDE.MD.SPY pour CLAUDE.md,
mais un parseur dédié (le format de titre diffère, un partage forcé aurait fragilisé les deux). Une
date n'est extraite (`extractPrincipleDate()`) que lorsqu'elle est explicitement portée par le tag
(ex. `[Synthèse, 2026-09-19]`) — jamais devinée depuis le contenu.

## Digest de l'évolution

`buildEvolutionDigest(principles)` liste, du plus ancien au plus récent, tous les principes datés —
la mémoire de l'évolution du document demandée par l'utilisateur.

**Retrofit historique daté (tâche #196, 2026-09-22).** La version d'origine ne datait que les
principes portant une date explicite dans leur tag : sur les 19 principes du document réel, **2
seulement** (1.9 et 1.10). Le digest ne racontait donc l'histoire que de 2 principes sur 19, et le
document passait pour figé alors qu'il ne l'est pas. Dater les 17 autres à la main aurait produit
exactement ce que l'Article 24 interdit — une liste recopiée qui se périme au prochain ajout. La
date manquante est donc **dérivée de l'historique git réel du fichier** (`principleDateFromGit()`,
`git log --diff-filter=AM -S<titre>`), en prenant le **PREMIER** commit qui a introduit le titre du
principe, jamais le dernier qui l'a touché : une reformulation n'est pas une naissance.

`principleDate()` réunit les deux sources, la déclarée primant toujours sur la dérivée (ce que
l'auteur a écrit vaut plus que ce que git déduit), et expose toujours une `provenance`
(`"déclarée"` / `"git"` / absente) — une date dérivée n'est **jamais** présentée comme déclarée.
Quand ni l'une ni l'autre source ne sait, la date reste `undefined` : jamais une date inventée.
Résultat mesuré sur le document réel : **19/19 principes datés** (2 déclarées, 17 dérivées), là où
la couche déclarée seule en atteignait 2. `avecGit: false` isole la couche déclarée pour les tests,
qui ne doivent jamais dépendre de l'état du dépôt.

Le digest, le décompte déclarée/dérivée et les tensions s'affichent désormais dans la sortie de
`node scripts/the-king.mjs` lui-même — trou réel trouvé en finissant ce retrofit : `main()`
n'affichait QUE la fraîcheur, le digest n'existant que pour l'appelant CIRCLE-TASKS. Un outil dont
le cœur du rôle (« conserver un historique de l'évolution du document », demande d'origine) reste
invisible depuis sa propre ligne de commande n'est pas un outil terminé.

## Détection de tension possible (enrichissement confirmé "oui maintenant")

`findPossibleTensions(principles)` : deux conditions cumulatives, toutes deux nécessaires pour
limiter les faux positifs — (1) un vocabulaire significatif fortement partagé (même seuil de
similarité de Jaccard, 0.22, que `findRedundantRulePairs()` de CLAUDE.MD.SPY, réutilisé sans
duplication de la logique de seuil) ; (2) une polarité normative divergente sur ce terrain partagé
(l'un porte « jamais », l'autre « toujours »). Testé contre le document réel : zéro tension détectée
à ce jour — un résultat honnête (aucune contradiction connue dans la charte actuelle), jamais un
signe que la fonction ne fonctionne pas.

## Fraîcheur (jamais un auto-edit)

`philosophyFreshnessDays()` réutilise `lastTouchDays()` de CLEAN-DIRTY-OLD sur
`docs/philosophie-et-politique.md` — un signal brut de jours depuis la dernière modification réelle,
jamais une proposition de texte. Câblé dans la Ronde périodique CIRCLE-TASKS (item
`the-king-signal`, thème « Suivi & référentiels ») dès la création de THE-KING (enrichissement
confirmé "oui maintenant" : digest périodique de l'évolution de la philosophie) — le garde-fou de
fraîcheur de CIRCLE-TASKS (`findRegistriesMissingFromCircle()`) exige qu'un nouveau registre
`docs/<slug>/` soit couvert par un item réel ou une exclusion documentée dès sa création, jamais
différé à un passage ultérieur.

## Statut d'intégration

Agent à part entière (blueprint + instanciation + registre), mécanique, zéro appel Gemini. Menu
PRESTATIONS : "Pack Régence" (consultation ponctuelle). Registre : `docs/the-king/` (dossier + index),
vide à la création — se remplira au premier vrai constat d'évolution ou de tension.

## « Détecte-t-il réellement quelque chose ? » — la réponse, mesurée (2026-09-25, tâche #836)

*(Instruction de la tâche #207. Question légitime : le registre de THE-KING ne porte qu'une entrée,
« zéro tension possible détectée », et cinq passages plus tard le chiffre n'a pas bougé. Un zéro
constant est exactement ce que rend une sonde aveugle.)*

**La réponse est bonne, pour une fois, et elle est prouvée plutôt que supposée.** Lancé sur une
paire fabriquée exprès — même vocabulaire, polarités opposées (« doit toujours » / « ne doit
jamais ») — le détecteur la trouve à **0,889**. Il n'est pas aveugle. Son zéro sur le vrai document
est donc un zéro **mérité**.

**Ce qui manquait quand même** : ce zéro était rendu **sans son dénominateur**. « Aucune détectée »
ne disait ni combien de paires avaient été comparées, ni à quelle distance se trouvait la plus
proche. Un lecteur ne pouvait pas distinguer « 171 paires examinées, la plus proche à 0,189 » de
« rien n'a pu être comparé » — la même phrase pour deux situations opposées.

**Ce qu'il imprime désormais** : *« aucune, sur 171 paire(s) réellement comparée(s) entre 19
principes (seuil 0,22). La paire la plus proche reste 1.7 ↔ 2.4 à 0,189 — le zéro est donc mérité,
pas un silence. »*

**Le contre-test qui le protège** : la paire fabriquée est devenue une assertion permanente. Le jour
où une refonte casserait la détection, le filet le dira — au lieu que le zéro continue à rassurer.

**Sa limite, inchangée et redite à chaque passage** : le vocabulaire partagé est un SIGNAL, jamais
une contradiction prouvée. Deux principes peuvent se contredire avec des mots entièrement
différents, et cette mesure ne les verra jamais.

## L'ALIGNEMENT EN CASCADE : chaque objet déclare son parent (2026-09-29, tâche #1148)

**Sa consigne** : « des stratégies **alignées**, qui génèrent des stratégies de chantier
**alignées**, des outils **alignés**, ****tout**** est aligné […] dès que tu commences à créer, il
faut que cet axe ***habite*** ton travail. »

**Pourquoi chez THE-KING et nulle part ailleurs** : il veille déjà sur
`docs/philosophie-et-politique.md`, qui est la RACINE de cette cascade, et l'utilisateur l'a
lui-même désigné comme porteur de la stratégie globale — en tranchant, le 2026-09-28, qu'il
**VÉRIFIE et ALERTE sans jamais décider**. Un outil à côté aurait créé une seconde autorité sur le
même terrain.

**UN MOT NE FAIT PAS UN ALIGNEMENT.** Tant que rien ne peut CONSTATER une incohérence, « aligné »
reste une intention — et une intention n'a jamais empêché quoi que ce soit (leçon L2).

**La déclaration est VISIBLE**, jamais un commentaire caché : une ligne
`**DÉCOULE DE :** \`chemin/du/parent.md\` §x` dans le document. Ces documents sont lus par quelqu'un
qui n'est pas développeur ; une ligne qu'il voit est une ligne qu'il peut corriger. La forme en
commentaire (`// DÉCOULE DE : …`) reste acceptée pour les fichiers de code.

**CINQ ÉTATS, DEUX SEULEMENT SONT DES ÉCARTS.**

| État | Ce que ça veut dire | Est-ce une faute ? |
|---|---|---|
| **ALIGNÉ** | la remontée atteint la racine | — |
| **ORPHELIN** | aucun parent déclaré | **non** : écrit avant la règle |
| **INTERROMPU** | déclare un vrai parent, qui lui-même ne déclare rien | **non**, mais à compléter |
| **PARENT_INTROUVABLE** | déclare un parent qui n'existe pas | **OUI** — une référence morte ressemble à un lien, ce qui est pire qu'une absence |
| **CYCLE** | A découle de B qui découle de A | **OUI** — c'est littéralement l'incohérence globale qu'il nomme comme risque |

**Pourquoi un orphelin n'est pas une faute, et c'est délibéré** : des centaines de documents ont été
écrits avant que la règle existe. Les accuser tous au premier passage aurait rendu le signal
illisible le jour même de sa naissance (leçon L4, déjà payée sept fois sur ce dépôt). **La
couverture est un progrès à faire monter, jamais une dette à solder.**

**Premier passage réel** : 40 %, 17 objets sur 42, 0 écart — la cascade est amorcée sur la cible,
les 9 stratégies de chantier et les documents du grand projet, jamais sur zéro.

## LA THÈSE DU CŒUR — éprouver une affirmation plutôt que l'illustrer (2026-10-02, tâche #1444)

**Sous-commande** : `node scripts/the-king.mjs these`. Dépose
`docs/the-king/these-du-coeur-<date>.txt`.

**CE QU'ELLE ÉPROUVE** : sa phrase du Word, *« le cœur de l'agence est sa gouvernance »*. Une thèse
énoncée par le responsable de projet **n'est pas une consigne à illustrer** : c'est une affirmation
à mettre à l'épreuve. La mesure doit donc pouvoir rendre **NON SOUTENUE**, sans quoi elle confirme
tout et ne mesure rien (Article 31, faille 2).

**LES INDICES LISENT DES COMPORTEMENTS, JAMAIS DES NOMS.** Compter les fonctions dont le nom
commence par `find` aurait mesuré une convention de nommage : un fichier peut gouverner sans qu'un
seul de ses noms le dise, et se nommer ainsi sans rien refuser. Côté gouvernance : ce qui **refuse**
(`throw`), ce qui rend un **verdict** (`mesurable:`), ce qui sait **dire qu'il n'a pas pu**
(`PAS MESURÉ`). Côté production : ce qui **met en forme**, ce qui **imprime**. Et, à part, la
**contrainte permanente** — les outils du vrai crochet de commit, lus dans le crochet et jamais
dans une liste recopiée (Article 24).

**DEUX LECTURES, ET UN DÉFAUT RÉEL LES IMPOSE.** `console.log` écrase tout par son volume et il est
**ambigu** : dans un outil de gouvernance, imprimer est la façon dont un verdict est RENDU, pas un
produit fabriqué. Le compter en production gonfle donc le dénominateur avec la livraison de ce qu'on
mesure en face — c'est la leçon L10, une mesure qui partage son filtre avec ce qu'elle mesure.
**Choisir une seule des deux lectures reviendrait à trancher la thèse par le choix du critère**,
donc les deux sont rendues, chacune avec la question à laquelle elle répond.

**RELEVÉ DU 2026-10-02, sur 86 fichiers** : lecture large **0,72 pour 1** → SOUTENUE EN PARTIE ;
lecture structurelle **6,38 pour 1** → SOUTENUE. Les deux ne s'accordent pas, et ce désaccord part
en **À TRANCHER** plutôt qu'en conclusion. La contrainte permanente est de **20 outils sur 86**
(23 %) : la gouvernance de ce dépôt est surtout **disponible**, plus rarement **contraignante**.

**HORS PORTÉE, et c'est la limite qui compte** : ces chiffres disent COMBIEN de code est consacré à
gouverner, jamais si ce qu'il gouverne en vaut la peine. Un paysage pourrait être gouvernance à 90 %
et ne rien protéger d'utile.

## LA RÉVÉLATION DE LA STRATÉGIE — même machine, autre corpus (2026-10-02, tâche #1434)

**Sous-commande** : `node scripts/the-king.mjs reveler-strategie`. Dépose
`docs/the-king/revelation-strategie-<date>.txt`.

**POURQUOI CE N'EST PAS UN SECOND OUTIL.** Une philosophie et une stratégie se révèlent de la même
façon : on lit un corpus, on extrait les phrases qui engagent, on les note par le nombre de
contextes qu'elles traversent, on dérive le seuil de leur propre distribution, et on confronte le
tout à un document de référence. Construire une seconde mécanique aurait créé deux moteurs à
maintenir pour une seule idée, et le second aurait divergé du premier en silence. **Seules trois
choses changent, et toutes trois sont des paramètres** : le CORPUS, le CADRE, le DOCUMENT DE
RÉFÉRENCE.

**LE CADRE STRATÉGIQUE, six cases, et ce ne sont pas celles d'une philosophie** : où l'on va · par
quelles étapes · ce qu'on ne fera pas · ce qui bloque · comment on saura · de quoi ça dépend. Une
philosophie énonce des convictions, vraies ou fausses ; une stratégie énonce une direction et des
jalons, atteints ou non.

**UN DÉFAUT RÉEL TROUVÉ AU PREMIER PASSAGE, CORRIGÉ À LA RACINE** : la famille « renoncements »
ramassait **1 740 phrases sur 1 880**, soit 93 % du corpus, à cause du seul mot **« jamais »** —
présent dans 92 % des phrases de ce dépôt, qui écrit ses règles en interdictions. Un mot aussi
répandu ne sépare pas le corpus, il le recouvre. **Le filtre qui l'écarte est DÉRIVÉ, jamais une
liste de mots interdits** (corollaire de l'Article 17) : on mesure ce que chaque mot attrape à lui
seul, et l'écart est **rendu avec sa part** — un cadre amputé en silence produirait des cases vides
sans qu'on puisse distinguer un corpus muet d'un mot perdu.

**LES DEUX LIMITES LOURDES DU PASSAGE, DÉCLARÉES PLUTÔT QUE TUES :**

1. **Le document de référence n'est pas lisible par l'extracteur.** La stratégie globale est
   structurée en sections ①②③④, pas en Articles, et l'extracteur ne connaît que les formes à
   Articles. Tout ressort donc « inavoué » **par construction**, et ce chiffre ne dit rien sur la
   stratégie globale — il dit qu'on ne l'a pas lue. C'est la tâche **#1438**, ouverte.
2. **Ce n'est pas la dérivation qui décide du seuil, c'est le PLANCHER de trois fichiers** hérité
   de la révélation philosophique, alors que le centile observé vaut 1. **C'est normal** : une
   direction s'énonce une fois, une conviction revient partout. Exiger la répétition importe au
   corpus stratégique une attente qui n'est pas la sienne — **et c'est un arbitrage**, inscrit
   comme tel plutôt que tranché seul.

## L'ALERTE DE TENSION — prévenir avant, pas constater après (2026-10-02, tâche #1435)

**Sous-commande** : `node scripts/the-king.mjs tension "<l'idée ou la consigne>"`.

**SA QUESTION, mot pour mot** : *« est-ce que, une fois que le doc philo et politique sera en
vigueur, tu seras capable de me prévenir si j'ai une idée ou une consigne en tension avec ce
document ? »* **La réponse honnête était « pas de façon vérifiable »** : je pouvais le remarquer ou
ne pas le remarquer, et rien ne distinguait les deux cas. Une capacité qui dépend de la vigilance
du moment n'existe plus à la session suivante (Article 27).

**TROIS VERDICTS, ET LE TROISIÈME EST CELUI QU'ON OUBLIE** : **EN TENSION** · **DÉJÀ COUVERTE** —
ce n'est alors pas une idée neuve mais une redite, et le dire épargne un chantier — · **NEUVE**.

**DEUX CORRECTIONS IMPOSÉES PAR DES CAS RÉELS, pas par une revue théorique :**

1. **Le seuil ne pouvait pas être du Jaccard.** Une idée de dix mots comparée à un article de
   soixante rend au mieux 0,15 même en recouvrement total : le premier passage rendait « NEUVE »
   sur une idée qui contredisait frontalement un article. **Un seuil hors de portée par
   construction** — la faute même que BP5 corrige ailleurs. La mesure juste est la **contenance**,
   aux deux bouts de la même échelle : 0,20 pour toucher, 0,70 pour contenir.
2. **La comparaison portait sur des mots entiers.** *« Il suffit de RECOPIER la liste à la main »*
   ne touchait pas l'article qui dit *« aucun élément ne se RECOPIE manuellement »*. **Une lettre
   d'écart, et la tension la plus nette qu'on puisse écrire contre cet article passait
   inaperçue.** La comparaison se fait donc sur des **racines tronquées à six caractères**,
   localement et avec sa raison écrite — l'appliquer partout changerait des mesures déjà calibrées.

**LA POLARITÉ DE L'ARTICLE NE DÉCIDE PAS.** *« On peut désactiver un test »* contredit un article
qui est une OBLIGATION et ne porte donc aucun « jamais ». Ce qui fait la tension n'est pas la forme
grammaticale de l'article, c'est qu'une idée propose de **se dispenser** de quelque chose qui est
gouverné.

**CE QUI EMPÊCHE L'ALERTE DE SONNER PARTOUT** (leçon L4) : **deux conditions réunies**, un marqueur
de permission explicite dans l'idée ET une contenance au-dessus du seuil avec un article précis.
Vérifié dans les deux sens — *« on peut peindre le salon en bleu ciel »* porte le marqueur, touche
zéro article, et reste muet.

**HORS PORTÉE, ET ELLE EST LOURDE** : le vocabulaire partagé est un **signal**, jamais une
contradiction prouvée. Deux idées peuvent se contredire avec des mots entièrement différents, et
cette mesure ne les verra jamais. **Elle ne remplace pas la vigilance de l'Article 14** — elle
attrape ce qu'une relecture distraite laisse passer, et elle le fait de la même façon à chaque
fois, ce qu'une relecture ne garantit jamais.

## FONDER UN PROJET D'ACCUEIL — proposer, jamais imposer (2026-10-02, tâche #1428)

**Sous-commande** : `node scripts/the-king.mjs fonder "<l'objectif ultime, si on l'a>"`.

**SA DEMANDE** : *« il génère tout […] car aucun projet ne peut vivre sans objectif profond et
philo »*. Le diagnostic (#1427) savait déjà dire *« ce projet n'a pas de philosophie »* — c'est
utile, et **ça ne rend aucun service**. Ce qui en fait un service est de savoir en **proposer**
une, **extraite du corpus du projet lui-même**, jamais importée du nôtre.

**LE PREMIER COMPORTEMENT EST LE PLUS IMPORTANT** : sur un projet qui a DÉJÀ ses trois textes,
l'outil ne propose **rien**. Proposer les nôtres par-dessus serait l'écrit d'autorité qu'il existe
pour refuser — *l'Agence sert la finalité de celui qui l'emploie, jamais la sienne*.

**LE RAPPORT EST LE MODE D'EMPLOI qu'il demandait**, en trois temps : ① ce que le projet a déjà et
ce qui lui manque · ② ce qui se propose, **chaque phrase portant la source d'où elle sort et son
étendue** · ③ l'objectif ultime avec sa clause non retirable.

**POURQUOI CHAQUE PHRASE PORTE SA SOURCE** : c'est ce qui en fait une proposition **contestable sur
pièces** plutôt qu'une invention qu'on ne peut que croire.

**UNE CASE VIDE RESTE VIDE, ET DIT POURQUOI.** La remplir au jugé empêcherait de distinguer ce que
le corpus dit de ce que l'outil a supposé — **pire qu'une case vide**.

**L'OBJECTIF ULTIME EST LE SEUL DES TROIS QUE LE CORPUS NE PEUT JAMAIS RENDRE.** Fourni, il reçoit
la clause ; absent, il est déclaré PAS MESURÉ et **jamais deviné**.

**UN CORPUS ILLISIBLE N'EST PAS UNE PHILOSOPHIE ABSENTE** : le dire protège de la pire issue —
importer la nôtre faute de matière.

**CE QUI RESTE UN TROU ASSUMÉ**, et il l'a dit lui-même : l'étape « précisions apportées par le
responsable du projet d'accueil ». L'outil propose ; il ne conclut pas.

## LA DÉRIVATION — reprendre une réponse écrite (2026-10-02, tâche #1438, seconde moitié)

**Sous-commande** : `node scripts/the-king.mjs deriver`.

**CE QUE LA RÉVÉLATION FAIT, ET POURQUOI ÇA NE SUFFIT PAS.** Elle extrait des phrases qui
engagent et garde les plus répandues — la bonne méthode quand **personne n'a jamais répondu**.
Mais quand un document répond explicitement — `## CE QUE NOUS NE SACRIFIERONS JAMAIS`, suivi d'un
tableau de quatre réponses avec leurs porteurs — **la reconstruire statistiquement rend une
version plus faible d'une réponse qui existait déjà**, mieux écrite, et validée par un humain.

**LE SIGNAL EST LE TITRE**, et c'est le seul honnête : un document qui répond à une question du
cadre le dit dans son titre de section.

**RÉSULTAT** : les **cinq impossibles** sont retrouvés à leur source, réponses reprises telles
quelles, **colonne de porteurs comprise**.

**DEUX CORRECTIONS IMPOSÉES PAR LE PREMIER PASSAGE :**

1. **Un faux positif massif.** 14 cases sur 19 ressortaient « répondues », toutes par des sections
   qui ne répondaient à rien : la case « Raison d'être » matchait un titre de leçon parlant
   d'« oublier sa raison ». **Un titre d'un seul mot significatif se retrouve dans des centaines
   de titres.** D'où une correspondance **bidirectionnelle** et un minimum de **deux racines
   partagées** — et une case trop courte est **déclarée non dérivable** plutôt que faussement
   appariée. Baisser le seuil aurait augmenté le nombre de réponses et **diminué leur valeur**.
2. **Les racines d'un titre ne se calculent pas comme celles d'une phrase.** « Ce que nous ne
   sacrifierons jamais » rendait **une seule** racine : le filtre de mots-outils partagé écarte
   « jamais » — à juste titre dans une phrase de prose, où il est partout, **alors que dans un
   titre de case c'est le mot qui porte tout le sens**. Un titre est court et choisi ; aucun de
   ses mots n'y est par hasard. Le jeu élargi reste **local aux titres**.

**HORS PORTÉE** : un titre qui RESSEMBLE à la question d'une case ne garantit pas que la section y
réponde. Le nombre d'autres candidats est donné par case, pour que le choix du premier puisse être
relu.

## LE SEUIL SORTAIT DE SON NUAGE SUR UN PETIT CORPUS (2026-10-02, tâche #1481)

**Le défaut ne pouvait se voir qu'en EXÉCUTANT.** `the-king fonder` existe pour doter un projet
d'accueil de ses textes fondateurs, et il n'avait jamais tourné contre un projet d'accueil — il
tournait sur ce dépôt-ci, où il se comporte correctement en ne proposant rien. C'est le cas facile,
et c'est l'inverse de sa raison d'être.

**Lancé contre un vrai dépôt d'accueil** (un carnet de jardin partagé : un README et deux documents
de décisions, pleins de convictions claires), il rendait **0 case sur 19**.

### Trois causes empilées

1. **Le plancher sortait du nuage.** La dérivation au 75e centile est juste, mais un
   `Math.max(3, derive)` était appliqué par-dessus. Ici : dérivé 3, maximum observé 26 — le
   plancher ne mord jamais. Sur l'accueil : dérivé 0, maximum observé **0**, seuil appliqué **3**,
   donc au-dessus de tout ce que l'outil peut voir. **Zéro par construction** (BP5). Le commentaire
   du code promettait pourtant deux lignes plus haut que ça ne pouvait pas arriver : la promesse
   était tenue par le calcul, le plancher la défaisait.
2. **Un petit corpus ne peut pas « revenir plusieurs fois ».** Le mécanisme est calibré sur les
   7 191 convictions de ce dépôt ; l'accueil en rendait 3.
3. **Et l'outil ACCUSAIT le projet d'accueil** — dix-neuf fois : « aucune phrase du corpus de ce
   projet ne tient ce rôle, c'est un vrai trou ». Il reprochait à l'équipe d'accueil un défaut
   appartenant à l'instrument, et c'était la première chose qu'un nouveau venu aurait vue de cette
   Agence (leçons L5/L11).

### La correction

- `seuil.valeur = Math.min(Math.max(3, derive), maxObserve)` — le seuil ne peut plus dépasser ce
  qu'il observe, et `seuil.plancherRabaisse` dit quand le plancher a dû céder.
- Quand `seuil.max` vaut zéro, la révélation **refuse de conclure** : aucun seuil positif ne
  pourrait laisser passer quoi que ce soit, donc rendre des cases vides reviendrait à accuser
  l'hôte. Le message nomme ce qui manque réellement : **de la MATIÈRE, pas une philosophie**.

**Vérifié dans les deux sens (BP4)** : avec cinq documents au lieu de trois, le même outil remplit
une case avec une vraie conviction du corpus d'accueil ; et sur ce projet-ci rien ne change —
seuil 3, plancher jamais rabaissé — ce que le filet vérifie explicitement plutôt que de le
supposer.
