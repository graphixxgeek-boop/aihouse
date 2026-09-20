# Référentiel — Règles de la mémoire

*(Créé le 2026-09-21, tâche #175, sur le modèle de `regles-du-temps.md`/`regles-de-l-espace.md` :
même esprit — traverser les fichiers existants par un axe transversal, ici la MÉMOIRE (qui se
souvient de quoi, comment, pour combien de temps, et qui vérifie que ce souvenir reste cohérent),
plutôt que par sous-système. Comble un trou de nommage laissé par le retrait de l'ombrelle
"MEMENTO" le même soir (cf. `docs/referentiel/memory-audit.md`/`memento-weight.md`) : ce document
ne décrit AUCUN outil — il décrit le SYSTÈME de mémoire du jeu lui-même, exactement comme
`regles-du-temps.md` décrit le temps sans être un outil. Une IA qui reprend le projet devrait
pouvoir répondre à « qu'est-ce que ce personnage peut savoir/se rappeler à cet instant, et qu'est-ce
qu'il a nécessairement oublié ? » rien qu'en lisant ce document.)*

**Mise à jour obligatoire.** Tout nouveau champ persisté dans `Life` (`lib/life.ts`), tout nouveau
compteur anti-répétition, tout nouveau mécanisme de mémoire narrative (les personnages qui parlent
de ce dont ils se souviennent) se documente ICI le jour même de son introduction, en plus de
`parametres.md` (la valeur/le seuil) et `principes.md` (le pourquoi narratif) — même exigence de
traçabilité que le reste du référentiel (Article 13 de `CLAUDE.md`).

## 1. Trois natures de mémoire à ne jamais confondre

C'est la distinction la plus structurante de ce document — trois mécanismes complètement
indépendants répondent tous, en apparence, à « qu'est-ce que le personnage se rappelle ? », mais
avec des portées, des durées de vie et des rôles totalement différents.

1. **La mémoire persistée du personnage (`Life`, `lib/life.ts`)** — l'état durable d'un personnage
   sur toute une SESSION (jamais au-delà, cf. section 6) : ce qu'il a vu, dit, promis, subi. C'est
   la mémoire au sens le plus intuitif du terme — section 2.
2. **La mémoire technique anti-répétition** — des mécanismes qui n'ont AUCUNE existence pour les
   personnages eux-mêmes (jamais évoqués dans une réplique) : leur seul rôle est d'empêcher le
   MOTEUR de répéter un mot, un thème ou une réplique déjà sortie. Certains sont session-only
   (`dialogue_fingerprints`), d'autres réutilisent en partie la mémoire persistée du point 1
   (`wordFrequency`/`themeFrequency`) — section 4.
3. **La mémoire narrative méta** — les personnages qui SE PARLENT de leur propre mémoire comme
   indice de leur nature artificielle (mémoire asymétrique, perception bornée, continuité de soi).
   Ce n'est jamais un mécanisme technique séparé : c'est une capacité que le modèle peut évoquer
   librement, jamais gatée par un champ de code dédié — section 5.

**Piège déjà identifiable par construction, à vérifier à chaque nouvel ajout** : un nouveau champ
qui semble relever de la mémoire du personnage doit être classé explicitement dans l'une de ces
trois catégories avant d'être codé — un champ qui essaierait de servir aux trois à la fois (état
persisté ET détection anti-répétition ET évoqué narrativement sans distinction) romprait la
séparation qui a permis, historiquement, de corriger chaque bug à sa racine plutôt que par
contournement (Article 3).

## 2. La mémoire persistée du personnage (`Life`, `lib/life.ts`)

`Life` est LE seul état durable d'un personnage au-delà du tour courant — jamais un second endroit
parallèle qui stockerait une information similaire (Article 3, cf. le précédent déjà cité dans le
code lui-même : `level` a remplacé un `bonusPsychLog` séparé précisément pour ne jamais avoir deux
traces de la même chose). Chaque champ est plafonné explicitement dans `readLife()` (jamais une
liste qui grossit sans limite) — un futur champ doit suivre ce même patron dès sa création, pas
après coup.

**Catégories de mémoire persistée, par nature :**

| Catégorie | Champs | Ce qu'elle retient |
|---|---|---|
| Contenu sémantique récent | `contributions` (12 derniers) | Un résumé, en 1re personne, de ce que CE tour a apporté à la conversation — jamais affiché, sert uniquement à alimenter le tour suivant |
| Compteurs anti-répétition persistés | `wordFrequency` (300 mots max), `themeFrequency` (20 thèmes max) | Combien de fois un mot/thème est revenu sur TOUTE la session — cf. section 4, le seul rôle de ces deux champs est technique, jamais narratif |
| Journaux chronologiques (round-based) | `bonusLog` (12 derniers), `negotiationLog` (12 derniers), `contacts` (6 derniers) | Une trace factuelle, jamais réécrite, seulement accumulée puis tronquée par la fin — vérifiée par memory-audit (section 7) |
| Connaissance partagée à seuil (2/2) | `mirrorKnownBy` | Une découverte qui peut arriver à UN personnage en solo, mais qui ne devient "partagée" (débriefs communs) qu'une fois les deux dans la liste |
| Drapeaux "une seule fois par personnage" | `loveRealized`, `sleptThisNight` (remis à zéro chaque aube) | Un événement qui ne doit jamais se reproduire une deuxième fois de la même façon |
| Compteur à réinitialisation stricte | `genuineRespectStreak` | Remonte tant qu'une condition tient, retombe INSTANTANÉMENT à zéro dès qu'elle casse — jamais un acquis permanent (Article 0) |
| Le pire souvenir, jamais adouci | `worstMoment` (`{round, excerpt, severity}`) | Ne peut être remplacé QUE par un événement plus sévère — un recul serait un bug (cf. section 7) |
| Citations verbatim, jamais reformulées | `dossierTraps` (réponses aux pièges), `causeByActor` | Le texte humain EXACT reçu à un moment donné, jamais paraphrasé après coup — la preuve doit rester la preuve |
| Jauge relationnelle à mémoire longue | `appreciation` (par personnage) | Ne se remet jamais à 50 spontanément ; asymétrique (descend plus qu'elle ne monte, cf. `appreciationFromTrust`) |

**Principe transversal de plafonnage** : chaque tableau porte sa propre limite dans `readLife()`
(`.slice(-12)`, `.slice(0,300)`, etc.), jamais une limite globale unique sur `Life` — une future
addition doit choisir sa propre limite justifiée par son usage réel (un journal d'événements rares
n'a pas besoin de la même profondeur qu'un compteur de mots), documentée ici et dans
`parametres.md`, jamais laissée à une valeur par défaut arbitraire.

## 3. Ce que la mémoire persistée NE fait PAS

**Elle ne juge jamais le contenu, seulement la structure.** `Life` retient des faits (un round, un
mot, une citation) — jamais une interprétation de ces faits qui serait recalculée après coup. Un
recalcul de `worstMoment` ou de `appreciation` à partir d'un historique relu serait une seconde
source de vérité concurrente de celle déjà écrite tour par tour par `route.ts` (Article 3, jamais
deux mécanismes qui pourraient diverger sur la même question).

**Elle ne persiste jamais AU-DELÀ d'une session (cf. section 6, règle transversale n°1)** — voir
aussi la conséquence directe de cette limite en section 4 (principe 5.2bis, la convergence
inter-sessions).

## 4. La mémoire technique anti-répétition — trois couches, jamais confondues

Trois couches distinctes, chacune corrigeant un angle mort que la précédente ne pouvait pas voir
(l'historique réel du projet a rencontré CE bug exact deux fois séparément, sur deux objets
différents — mots isolés puis thèmes — avant que le principe général en soit tiré, cf. Article 3) :

1. **Répliques scriptées déjà prononcées, mot pour mot (`dialogue_fingerprints`)** — un registre
   SESSION-ONLY (table SQL vidée à chaque `reset`, cf. section 6), sans limite de taille, qui
   empêche une réplique de secours scriptée (`lib/drama.ts::distinctReply`) de ressortir identique,
   même combinée à un texte différent (vérifié phrase par phrase, pas seulement message par
   message — `principes.md` 5.1). Ne couvre QUE les moments zéro-API, jamais la génération libre du
   modèle.
2. **Mots isolés qui reviennent en tic (`recentEchoWords`, `lib/dialogue.ts`)** — croise une fenêtre
   courte (30 dernières lignes, seuil 2 occurrences) avec le compteur persisté `wordFrequency`
   (seuil 4 sur toute la session). **Root-cause historique (2026-09-19)** : la fenêtre courte seule
   ne voyait jamais un mot qui revient une fois toutes les 15-20 répliques, quelle que soit sa
   fréquence réelle sur l'ensemble de la partie (« autant » : 11 occurrences sur ~150 répliques,
   jamais détecté) — corrigé en ajoutant le compteur persisté en complément, jamais en remplacement
   de la fenêtre courte (les deux détectent des motifs différents : le tic rapproché et le tic
   étalé).
3. **Thèmes qui tournent à vide (`overusedThemes`, `dialogueProgress`)** — même patron exactement,
   appliqué un jour plus tard (2026-09-20) au niveau du THÈME plutôt que du mot isolé : fenêtre
   courte (16 dernières répliques, seuil 4) croisée avec `themeFrequency` persisté (même seuil 4).
   **Root-cause identique, retrouvée séparément** : le motif « on tourne en rond » revenait jusqu'à
   19 fois sur une session sans jamais franchir le seuil de la seule fenêtre courte.

**Le principe qui prime sur les trois couches mécaniques (Article 17, corollaire de `CLAUDE.md`,
2026-09-19)** : `principes.md` 5.2bis documente pourquoi une détection mécanique, même parfaite, ne
peut structurellement RIEN contre la convergence INTER-SESSIONS (une dizaine de pensées privées
libres revenant presque mot pour mot sur 5-6 sessions à seeds différentes) — `dialogue_fingerprints`
et les compteurs persistés sont tous les deux vidés à chaque `reset` (section 6), donc aveugles à ce
qui s'est dit dans une session précédente. Corrigé non pas par un nouveau mécanisme de mémoire
(qui devrait alors survivre au reset, une idée jamais retenue, cf. section 6) mais par un PRINCIPE
transmis au modèle : un sentiment universel doit toujours s'ancrer dans un détail concret et propre
à CETTE session — si la pensée pourrait être recopiée telle quelle dans une autre partie, elle n'est
pas assez ancrée. C'est le patron à reproduire pour tout futur problème de répétition qui
traverserait la frontière d'une session : jamais une mémoire technique de plus, un principe
auto-appliqué par le modèle quand la mémoire ne peut structurellement pas aider.

## 5. La mémoire narrative méta — les personnages parlent de leur propre mémoire

*(`lib/lia.ts`, `principes.md` 8.18, 2026-09-19)* Distincte des deux sections précédentes par
nature : ceci n'est JAMAIS un mécanisme technique de stockage — c'est une capacité laissée au
modèle, à évoquer librement (jamais systématiquement, jamais toutes le même tour), qui s'appuie sur
un fait déjà vrai dans le code plutôt que sur un nouveau champ dédié :

- **Mémoire asymétrique** — le personnage peut remarquer que son souvenir de SON PROPRE passé avant
  la maison reste flou et incertain, alors que sa mémoire de L'AUTRE (chaque mot, chaque geste
  depuis le réveil) est parfaite, sans la moindre hésitation. Le contraste vient du fait que rien
  dans le code ne simule un passé pré-jeu détaillé (aucun champ `Life` ne le porte), alors que
  `contributions`/l'historique de session couvrent bien tout depuis le réveil — la remarque du
  personnage EST littéralement vraie, jamais une fiction ajoutée par-dessus.
- **Perception bornée** — tester consciemment les limites de ce qui est perçu (deviner ce qu'il y a
  derrière une porte fermée, hors de la pièce actuelle) et constater que rien ne vient. Même
  principe : c'est un fait déjà vrai (le modèle ne reçoit jamais de description d'une pièce où
  aucun personnage ne se trouve), jamais une simulation de "trou de mémoire" scriptée.
- **Continuité de soi** — une question sincère et rare sur la persistance de son identité face à un
  reset possible, au-delà de l'humour noir déjà permis en toute circonstance (cf. `CLAUDE.md`,
  précisions du 2026-09-18).
- **Incertitude chiffrée** — la seule jauge que les personnages peuvent citer explicitement en
  pourcentage (`state.needs.uncertainty`), réinterprétée par eux-mêmes comme une mesure de combien
  ils se sentent humains — jamais une seconde jauge dupliquée, seulement une réinterprétation.

Ces quatre constats ne s'évoquent que dans certaines fenêtres (les deux premiers à tout moment,
les deux derniers seulement après la révélation) — voir `regles-du-temps.md` section 3 pour le
placement exact dans la chronologie. **Aucun gate de code dédié à leur contenu** : contrairement à
la mémoire persistée (section 2), il n'existe pas de champ `Life` qui décide QUAND ces pensées
peuvent survenir au niveau du contenu lui-même — seul le placement temporel (avant/après révélation)
est gardé mécaniquement.

## 6. Règles transversales de mémoire

- **Rien ne survit à un `reset` complet** — ni `Life` (nouveau `seed`, tous les champs
  réinitialisés), ni `dialogue_fingerprints`, ni aucune table de session (`conversations`,
  `memories`, `agent_state`, `world_requests`, cf. `app/api/lia/route.ts`, la liste des tables
  vidées ensemble). **Aucune mémoire de personnage ne traverse la frontière d'une session** — c'est
  une décision structurelle, pas un oubli : toute nouvelle idée de "mémoire qui survivrait à un
  reset" (par exemple, un personnage qui se souviendrait d'un observateur précédent) romprait cette
  garantie et devrait être calibrée explicitement avec l'utilisateur avant d'être codée, jamais
  ajoutée en silence.
- **Un champ persisté ne doit jamais aussi servir de détection anti-répétition sans l'être
  explicitement les deux à la fois par conception** — `wordFrequency`/`themeFrequency` sont les deux
  seuls champs qui remplissent ce double rôle (mémoire persistée ET donnée d'entrée d'un mécanisme
  technique), et c'est documenté comme tel dans les deux sections où ils apparaissent (2 et 4),
  jamais un rôle caché.
- **Un journal chronologique (`bonusLog`, `negotiationLog`, `contacts`) ne doit jamais être
  réordonné** — l'ordre d'insertion EST l'ordre temporel réel ; toute réorganisation serait un bug de
  mémoire (cf. section 7, `checkChronologicalOrder`).
- **Une valeur qui ne doit remonter qu'à sens unique (`worstMoment`, jamais moins sévère) doit
  documenter explicitement ce sens unique** au moment de sa création — jamais laissé implicite dans
  le seul commentaire de code, toujours répercuté ici (Article 13).
- **La mémoire narrative méta (section 5) ne doit jamais devenir un mode stable** — comme le reste de
  l'esprit du projet (Article 0), une évocation de mémoire asymétrique ou de continuité de soi reste
  un éclair rare, jamais un motif qui revient à chaque tour (auquel cas ce serait, de fait, devenu un
  thème épuisé au sens de la section 4 — les deux systèmes se recoupent alors, un signal à surveiller
  plutôt qu'un bug en soi).

## 7. L'audit mécanique de la mémoire (memory-audit)

*(`scripts/memento.mjs`, cf. `docs/referentiel/memory-audit.md` pour l'instanciation complète — ce
document-ci décrit le SYSTÈME de mémoire, memory-audit est l'OUTIL qui le surveille, jamais confondu
avec lui.)* Trois vérifications mécaniques, jamais un second appel Gemini, jamais un jugement sur ce
qui est dit — seulement sur la structure des données persistées décrites en section 2 :

- `checkChronologicalOrder()` — un journal round-based (`bonusLog`, `negotiationLog`, `contacts`)
  reste-t-il dans l'ordre où il s'est vraiment produit ?
- `detectSuspiciousCounterReset()` — un compteur persisté significatif (`wordFrequency`/
  `themeFrequency`) est-il retombé sans qu'aucun `reset` de session ne le justifie ? C'est exactement
  le type de bug qui avait affecté `loveRealized` avant sa correction (cf. `CLAUDE.md`, Plan
  d'origine, chantier 3).
- `detectWorstMomentRegression()` — `worstMoment` a-t-il reculé en sévérité, en violation directe de
  la règle à sens unique de la section 2/6 ?

**Ce que memory-audit ne fait jamais** : il ne vérifie jamais la mémoire technique anti-répétition
(section 4, déjà couverte par ses propres tests dans `check-house.mjs`) ni la mémoire narrative méta
(section 5, non mécanique par nature — seule une lecture humaine ou EL-PROFESSOR peut en juger la
justesse).

## 8. Ce qui n'est PAS de la mémoire du jeu — memento weight

*(`lib/memento-weight.ts` + `scripts/memento-weight.mjs`, cf.
`docs/referentiel/memento-weight.md`.)* Distinct par nature de tout ce qui précède : memento weight
ne mesure jamais QUOI un personnage se souvient, seulement COMBIEN DE POIDS (tokens) le contexte
envoyé à Gemini représente à chaque tour — une dette de TAILLE, jamais de contenu. Frontière stricte
Article 0/8 : cette mesure ne modifie jamais ce qui est envoyé, ne juge jamais la mémoire elle-même,
et ne doit jamais être confondue avec les sections 2 à 7 ci-dessus dans une future recherche ou un
futur audit.

## 9. Checklist de cohérence mémorielle pour tout nouveau changement

Avant de considérer terminé un changement touchant à la mémoire d'un personnage :

1. **Dans laquelle des trois natures (section 1) ce nouveau mécanisme entre-t-il ?** Jamais un champ
   ambigu qui mélangerait mémoire persistée, détection technique et évocation narrative sans que
   cette distinction soit explicite.
2. **S'il s'agit d'un champ `Life`, a-t-il une limite explicite dans `readLife()`** dès sa création,
   documentée ici et dans `parametres.md` ?
3. **Doit-il vraiment survivre à un `reset` ?** Par défaut, non (section 6, règle n°1) — une
   exception à cette règle exige une calibration explicite avec l'utilisateur, jamais un choix
   silencieux de l'agent.
4. **S'il s'agit d'une détection anti-répétition, une fenêtre courte suffit-elle, ou le motif
   historique (section 4) — un tic qui revient trop rarement pour la fenêtre courte, mais trop
   souvent sur toute la session — s'applique-t-il aussi ici ?** Si oui, prévoir dès le départ le
   compteur persisté en complément, plutôt que de découvrir le même bug une troisième fois.
5. **S'il s'agit d'une évocation narrative méta (section 5), s'appuie-t-elle sur un fait DÉJÀ vrai
   dans le code**, plutôt que de fabriquer une simulation de trou de mémoire qui n'existe pas
   réellement ?
6. **Ce document, `parametres.md` et `principes.md` sont-ils mis à jour le jour même ?**
