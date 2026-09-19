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
