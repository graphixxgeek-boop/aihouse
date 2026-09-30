# HARMONIA — instanciation pour Maison IA vivante

*(Cf. `docs/harmonia-blueprint.md` pour le principe générique. Ce document décrit comment HARMONIA
est concrètement câblée sur CE projet — jamais le raisonnement générique. Créé le 2026-09-19,
confirmé faire partie des tests systématiques/obligatoires au même titre qu'ARGUS.)*

## Ce qui existe aujourd'hui

- **`scripts/check-harmonia.mjs`** — la partie mécanique, gratuite, zéro appel réseau : reconfirme
  qu'une poignée d'affirmations chiffrées documentées (`docs/referentiel/parametres.md`)
  correspondent toujours à la constante réelle du code source qu'elles décrivent. Liens vérifiés
  aujourd'hui : durée du jour/de la nuit et décalage de minuit (`lib/daynight.ts`), le malus de
  nuit blanche (+28), le seuil de respect sincère (78). Chaque lien ajouté élargit la couverture ;
  la liste vit dans le script lui-même (`LINKS`), à étendre à chaque nouveau chiffre documenté.
- **`docs/harmonia/`** — dossier des rapports/frictions archivés + `index.md`.

## La carte des dépendances, par grand thème

*(Vérifiée manuellement contre le code réel le 2026-09-19, jamais recopiée depuis un document sans
revérification — principe central du blueprint.)*

- **Fatigue** (`needs.fatigue`, `lib/simulation.ts::advanceNeeds`)
  - Reçoit l'influence de : cycle jour/nuit (`fatigueRateMultiplier`, ×3 la nuit), disputes/
    hostilité humaine sévère (+10, `dramaRules.emotionalShockFatigue`), bonus roulette `sleep`
    (forcé à 0), nuit blanche (+28 à l'aube), `force_move` qui réveille un dormeur (fatigue=10).
  - Influence à son tour : le déclenchement du sommeil (`isSleeping`), le registre de dialogue
    (Lia plus froide/coupante, Noé plus dispersé au-delà de certains seuils), la priorité de
    décision (`lib/turn.ts::residentPriority`).
- **Cycle jour/nuit** (`lib/daynight.ts`)
  - Dépend uniquement du ROUND (jamais du temps réel) — synchronisé explicitement sur le plafond
    garanti de l'enquête (minuit = round 35 = le même seuil qu'`investigationOverdue`).
  - Influence : la fatigue (ci-dessus), les réactions scriptées (minuit/tombée de nuit/aube), la
    nuit blanche.
- **Enquête** (`evidence`, `lib/evidence.ts`, `investigationOverdue`/`investigationCritical` dans
  `lib/turn.ts`)
  - Dépend des objets observés (miroir, régénération de stock, ambiance, fenêtre) qui alimentent
    `evidence.length`.
  - Influence : la priorité de sommeil (l'enquête l'emporte une fois critique), le rythme de la
    romance scriptée (réequilibrage avant/après révélation), la réaction de minuit (urgence vs
    sarcasme), le déclenchement du dossier retourné (seulement après révélation).
- **Bonus roulette** (`life.bonusLog`, 9 types, budget partagé `bonusCooldownUntilRound`/
  `bonusSpotlightUntilRound`)
  - Influence : les jauges de besoin (clamp à 0), les émotions (figées pour `stoic`, silence pour
    `mute`), la jalousie mesurable du personnage non ciblé, l'appréciation de l'observateur (une
    négociation liée à un tirage), le dossier retourné (`bonusLog` sert de preuve, le « test de
    pouvoir »).
  - Dépend de : la négociation (un personnage peut en proposer une), le budget partagé.
- **Appréciation de l'observateur** (`life.appreciation`, par personnage)
  - Dépend de : `trustShift` (asymétrique, les premiers messages pèsent plus), l'issue d'une
    négociation (honorée/lapsée/refusée), un refus explicite de roulette, l'hostilité humaine.
  - Influence : `genuineRespectStreak` (palier rare), le dossier retourné (preuve de comportement),
    le ton (colère réelle si l'appréciation chute assez).
- **Dossier retourné** (`life.dossierText`, `TRAP_ORDER`, post-révélation uniquement)
  - Dépend de : révélation atteinte, les 3 pièges répondus, au moins un tirage de roulette
    enregistré.
  - Influence : `softnessOwed` (moment de douceur si détresse détectée après remise du dossier) —
    sortie narrative en aval, n'alimente ensuite aucun autre système de jauge.
- **Déplacements/espace** (`destinationAnchor`/`residentDestination`, `exitInspection`)
  - Dépend de : l'intention narrative du tour, l'accès au jardin (`gardenOpen`, conditionné par
    l'enquête).
  - Influence : les observations disponibles dans la pièce visitée, les rencontres/contacts
    (même pièce que le partenaire).
- **Relation Lia/Noé** (`attraction`, `attachment`, `dispute`)
  - Influence : la divergence d'appréciation envers l'observateur (suspendue hors dispute active,
    libre pendant), la fatigue (choc émotionnel), le ton des répliques.
  - Dépend de : gestes affectifs partagés, refus, jalousie déclenchée par un bonus ciblé.

## Nœuds sensibles identifiés (beaucoup de dépendants, donc risqués à toucher sans vérification complète)

- **`needs.fatigue`** — au moins 5 sources d'influence distinctes recensées ci-dessus ; toute
  nouvelle règle qui touche la fatigue doit explicitement vérifier qu'elle ne rentre pas en
  collision avec les autres (cf. la régression réelle trouvée et corrigée le jour même : le test
  dusk/dawn préexistant supposait `sleptThisNight` toujours vrai par défaut).
- **`story.round`** — seule horloge du jeu, dont dépendent le cycle jour/nuit, le plafond de
  l'enquête et la synchronisation entre les deux ; jamais introduire une seconde horloge sans
  revalider cette synchronisation (cf. `docs/referentiel/regles-du-temps.md`).
- **`life.appreciation`** — alimente à la fois le ton immédiat et une preuve différée (dossier) ;
  un changement de calibrage a un effet double, pas seulement sur l'expérience immédiate.

## Premier balayage (2026-09-19)

5 liens chiffrés vérifiés, 0 friction confirmée après correction de deux erreurs dans les
expressions du script lui-même (un motif de code trop strict, un motif de documentation qui ne
suivait pas exactement la formulation réelle du texte) — corrigées en ajustant le script pour
refléter fidèlement le texte réel, jamais en modifiant la documentation pour qu'elle corresponde
au script. Détail : `docs/harmonia/index.md`.

## KPI

Pas encore raccordé au tableau de bord général, même raisonnement qu'ARGUS : prématuré sur une
seule exécution.

## Le système KPI passé au peigne fin (2026-09-25, tâche #827)

*(Demande de l'utilisateur du 2026-09-21, tracée en #262 : « tout le systeme de kpi est bien
interconnecté. **On passera ce systeme au peigne fin avec Harmonia pour voir si on en a oublié des
connexions.** » La condition qu'elle posait — attendre que CASSANDRA-RH existe — était remplie
depuis quatre jours, et la seule trace vivante de cette action à faire se trouvait dans
`docs/cassandra-rh-conception.md`, un document que le suivi lui-même déclare archivé. Constat
DEEP-READER 4.)*

**Pourquoi chez HARMONIA plutôt que dans un outil de plus** : la question posée est exactement la
sienne. ARGUS cherche le trou jamais envisagé ; HARMONIA vérifie la cohérence des liens DÉJÀ
existants. « Une connexion oubliée » est un lien déclaré qui ne transporte plus rien — le même
regard que `checkLinks()` porte sur code↔référentiel, appliqué à colonne↔source.

**Ce qu'il mesure** : pour chaque colonne de `kpi-historique.csv`, depuis combien de runs elle
n'est plus alimentée, croisé avec la NATURE de sa source (`NATURE_DES_COLONNES_KPI`,
`scripts/kpi-report.mjs`). **Trois états, jamais deux** :

- **LIEN PERDU** — colonne LOCALE (elle lit des fichiers du dépôt, aucun serveur requis) et pourtant
  vide sur toute la fenêtre récente. Rien n'explique ce vide.
- **EN ATTENTE D'UNE MESURE VIVANTE** — colonne dont la source exige un serveur de dev ou une
  simulation. Son vide est honnête : il dit « pas mesuré », jamais « lien cassé ».
- **ALIMENTÉE** — rien à dire, et elle est comptée pour que le constat porte son dénominateur.

**Pourquoi la nature est DÉCLARÉE et non déduite** : la déduire du code (« cette colonne
passe-t-elle par `fetchLiveMetrics()` ? ») marcherait aujourd'hui et se romprait au premier
renommage, en silence. `findColonnesSansNature()` vérifie en retour qu'aucune colonne n'y échappe,
et l'audit REFUSE de conclure si une seule manque — un audit muet sur une colonne se lit exactement
comme un audit qui l'a trouvée saine (Article 24).

**Premier passage réel, le jour même** : 23 colonnes, 24 runs, fenêtre de 6. **Aucune connexion
perdue.** Trois colonnes muettes (`smart_breaker_performance_pct`, `qualite_pct`, `coherence_pct`)
ont toutes une source vivante : elles attendent une simulation, pas une réparation. Sans la
distinction de nature, l'audit aurait rendu un rouge sur trois colonnes saines.

**Un test l'a corrigé avant même sa première livraison** : la version initiale importait
`kpi-report.mjs` en tête de fichier. Le filet a refusé, parce que le crochet post-commit importe
`check-harmonia.mjs` — kpi-report devenait de la **tuyauterie par ricochet**, et une erreur de
syntaxe dedans aurait cassé le crochet de tout le monde. L'import est devenu dynamique, à l'endroit
où le rapport tourne.

**Sa limite, déclarée** : il voit qu'une colonne ne se remplit plus, jamais POURQUOI. Un calcul
cassé et un choix assumé de ne plus la produire se lisent pareil dans un CSV.

## La « couche lourde » de l'Article 20 : un GESTE, jamais une commande (2026-09-28, tâche #917)

**La démonstration complète vit dans `docs/referentiel/argus.md`**, et elle n'est écrite qu'une fois
exprès : la recopier ici créerait deux textes à tenir d'accord sur un même fait, ce qui est la façon
dont deux documents finissent par diverger (Article 24). *À ne pas confondre avec la partie mécanique
d'HARMONIA décrite plus haut, qui tourne à chaque commit et ne coûte rien.*

**Ce qu'il faut en retenir ici** : la seconde partie « à vrai raisonnement » que l'Article 20 promet
à HARMONIA comme à ARGUS est un **geste de l'agent**, pas une commande — elle ne figurera donc jamais
au catalogue PRESTATIONS, parce qu'un catalogue liste des commandes. Aucun mécanisme ne la porte, et
le déclarer EST la protection (Article 27).

## `verifierTableDesProfils()` et `paires()` — la table des profils, vérifiée par DÉRIVATION (2026-09-30, tâche #1287)

**POURQUOI CE N'EST PAS UNE SIXIÈME ENTRÉE DE `LINKS`.** `LINKS` est une liste tenue **à la main** :
une regex de code, une regex de doc, écrites une par une. C'est exactement la forme que
l'Article 24 désigne — « un registre se LIT, il ne s'énumère pas » — et le même défaut avait déjà
été trouvé pour `THEMES` et `SENSITIVE_NODES`. Ajouter douze entrées à la main aurait alourdi la
liste sans corriger sa nature.

**CE QUI REND LA DÉRIVATION POSSIBLE, ET C'EST LE DOCUMENT LUI-MÊME QUI LE DONNE** : la table
« Besoins » de `parametres.md` **nomme son fichier source dans son titre**, et chaque ligne porte
**l'identifiant réel du code entre accents graves**. Tout est là pour comparer sans écrire un seul
motif — et une ligne ajoutée à la table demain est vérifiée le jour même.

**PREMIER PASSAGE RÉEL : 20 valeurs confrontées, 0 friction, 0 hors de portée.** Le décompte se
lit à côté de celui de `LINKS` : **5 liens écrits à la main, 20 vérifiés sans qu'on ait rien
écrit.**

**QUATRE LIGNES ONT ÉTÉ RENDUES VÉRIFIABLES PLUTÔT QUE DEVINÉES.** « Faim initiale », « Fatigue
initiale », « Stress initial » et « Incertitude initiale » ne nommaient aucun identifiant : les
rattacher aurait demandé de deviner la correspondance entre un libellé français et un champ
anglais, c'est-à-dire d'inventer. Leur libellé porte désormais `` `hunger` ``, `` `fatigue` ``,
`` `stress` ``, `` `uncertainty` `` — une précision ajoutée au document, jamais une déduction
faite par l'outil. La couverture passe de 12 à 20.

**CE QUI RESTE DÉCLARÉ PLUTÔT QUE TU** : `paires()` lit **une seule ligne** — les profils de
`lib/simulation.ts` sont écrits ainsi. Prétendre lire un objet imbriqué à la regex serait se
donner une garantie qu'on n'a pas. Une cible introuvable (section renommée, profil absent) rend
`mesurable: false` **avec sa raison**, jamais « aucune friction » (L5/L11).

## `verifierFonctionsCitees()` — les NOMS, après les chiffres (2026-09-30, tâche #1294)

**Le compagnon de la table des profils, sur l'autre moitié du terrain.** HARMONIA confronte des
**chiffres** depuis toujours ; un référentiel cite aussi des **noms**, et un nom disparu est une
**référence morte — ce qui est pire qu'une absence, parce que ça ressemble à un lien** (la même
doctrine que `checkActionChain()` applique aux tâches annoncées par un plan d'action).

**LA PORTÉE EST ÉTROITE EXPRÈS** : seuls les noms écrits `` `nom()` ``, avec les parenthèses. Un
mot entre accents graves peut être un chemin, une clé JSON, un mot anglais ; `nom()` ne peut être
qu'un appel. C'est ce qui permet de ne jamais deviner — et deux contre-tests verrouillent
l'exclusion dans les deux sens.

**LA RECHERCHE COUVRE TOUT LE DÉPÔT, ET C'EST UN CORRECTIF, PAS UN CONFORT.** Le premier essai ne
lisait que le code du jeu et accusait `findUnnavigableSections()`, cité dans `principes.md` — la
fonction existe, dans `scripts/doc-report.mjs`. **Un référentiel de jeu a parfaitement le droit de
nommer l'outil qui a signalé un défaut.** Vérifié à la main avant de publier le chiffre : ce
n'était pas le nom qui manquait, c'était mon périmètre de lecture (leçon L47).

**PREMIER PASSAGE RÉEL : 23 fonctions citées, 0 introuvable, sur 114 fichiers source lus.**

**UN CORPUS VIDE NE VAUT JAMAIS UN VERT** (L5/L11) : « aucune fonction manquante » et « je n'ai lu
aucun fichier » se ressemblent trait pour trait, donc le second rend `mesurable: false` avec sa
raison.
