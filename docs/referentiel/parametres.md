# Référentiel — Paramètres

Tous les chiffres qui pilotent l'équilibrage de la simulation, rassemblés ici pour qu'un
rééquilibrage ne demande de toucher qu'un nombre, jamais une règle (voir `principes.md`).
Chaque paramètre indique son fichier source — c'est là qu'il faut le changer, pas ici :
ce document décrit les valeurs actuelles, il ne les fixe pas.

## Besoins (`lib/simulation.ts`)

| Paramètre | Lia | Noé |
|---|---|---|
| Faim initiale | 20 | 30 |
| Fatigue initiale | 20 | 20 |
| Stress initial | 90 | 90 |
| Incertitude initiale | 90 | 90 |
| Vitesse de faim (`hungerRate`/tour) | 1 | 2 |
| Vitesse de fatigue (`fatigueRate`/tour) | 2 | 1 |
| Vitesse de stress (`stressRate`/tour) | 1 | 1 |
| Récupération d'un repas (`mealRecovery`) | 40 | 58 |
| Fatigue post-repas (`mealFatigue`) | 0 | 14 |
| Bonus d'activité commune (`sharedBonus`) | 2 | 2 |

Seuils d'urgence (`priority()`) : faim ≥ 68 → manger ; fatigue ≥ 68 → dormir ; stress ≥ 75 →
repos. Niveaux d'affichage (`needLevel()`) : urgent à 75 (stress) / 85 (incertitude) / 68 (autres) ;
pressant à 55 (stress) / 65 (incertitude) / 50 (autres).

Cadence résultante (à partir des valeurs initiales, sans repas/repos entre-temps) : Lia atteint la
fatigue urgente en 24 tours, la faim urgente en 48 ; Noé atteint la faim urgente en 19 tours, la
fatigue urgente en 48. Avant le 2026-09-16, la fatigue de Lia et Noé montait deux fois plus vite
(atteinte en 12 et 24 tours) — l'audit Opus initial jugeait cette cadence trop agressive, au point
de faire des besoins physiologiques la structure de la soirée plutôt que des interruptions
occasionnelles ; les vitesses de fatigue ont été divisées par deux en conséquence. La faim de Noé
reste la plus rapide des quatre courbes (19 tours) : à surveiller si elle continue de dominer le
rythme d'une session.

Effets d'une activité correctement placée (`advanceNeeds`) : manger −6 stress en plus de la
récupération ; dormir −38 fatigue en chambre / −18 au salon, −8 stress ; se reposer −(vitesse de
fatigue + 2) fatigue, −20 stress ; étudier −12 incertitude, −3 stress ; câlin/massage/bisou −15
stress ; regarder la tv −5 incertitude, −8 stress ; discuter −5 stress.

## Émotions (`lib/lia.ts`, `lib/simulation.ts`)

Émotions initiales — Lia : curiosité 72, tension 90, confiance 8, aisance 22, attirance 12.
Noé : curiosité 68, tension 90, confiance 20, aisance 48, attirance 18 (resserré le 2026-09-17,
était 32 — retour utilisateur direct : sa jauge décrochait de celle de Lia dès le départ, en plus
d'un `sharedBonus` alors deux fois plus élevé ; les deux jauges doivent progresser de façon
cohérente l'une par rapport à l'autre, pas seulement chacune à un rythme raisonnable prise isolément).

`evolveEmotions` borne la variation par tour : jamais plus de −12 ni plus de +12 (curiosité,
tension, aisance), plafonnée à +5 pour la confiance et l'attirance (des liens qui montent lentement
et peuvent chuter plus vite qu'ils ne montent).

## Attirance et attachement (`lib/relationship.ts`, `app/api/lia/route.ts`, `lib/drama.ts`)

- Bonus multiplicateur de gain d'attirance pour Lia (`attractionAfterTurn`) : ×2 si son stress
  < 5, ×1.5 si < 10, sinon ×1.
- Seuils de ton (décrits au modèle) : < 25 curiosité prudente ; 25–59 chaleur mesurée ; ≥ 60
  compliments personnels ; ≥ 80 tendresse assumée ; > 75 = « amoureux » dans la fiction.
- `mutualAttraction` : attirance ≥ 45 ET confiance ≥ 25 des deux côtés.
- Gain autonome ralenti : système de crédit fractionnaire, 28 % du gain brut converti en points
  entiers par tour (`credit += gain*.28`), le reste reporté au tour suivant.
- Attachement (indépendant de l'attirance) : +1 point tous les 4 tours partagés, plafonné à 100 si
  attirance > 75 et confiance ≥ 60, à 65 si attirance ≥ 60, sinon à 25.
- `personalBoost` (question « quel genre d'homme es-tu ? » suivie d'une réponse intéressée) :
  +3 points d'attirance, une seule fois (`dramaRules.personalBoost`).
- Bonus supplémentaire pour Noé qui rattrape Lia : jusqu'à +3 points (assoupli le 2026-09-16,
  était +6) si son attirance < 65 (était < 75) et celle de Lia ≥ 15 (était ≥ 5), sans refus ni
  insistance récents — l'ancien seuil laissait l'attirance de Noé grimper à un rythme jugé
  irréaliste dès la première demi-heure (point de l'audit Opus initial resté non corrigé jusque-là,
  signalé à nouveau par retour utilisateur direct).

## Gestes et consentement (`lib/turn.ts`, `app/api/lia/route.ts`, `lib/drama.ts`)

- Noé peut proposer un geste à partir de 80 % de sa propre attirance, après au moins 24 tours
  (2026-09-19, était 20 depuis le 2026-09-16, lui-même assoupli depuis 12 — le premier geste
  arrivait trop tôt dans la relation). Relevé une seconde fois pour laisser l'enquête démarrer
  réellement seule avant que la romance ne s'invite ; sans effet pratique si l'enquête traîne
  encore à ce stade, puisque le plafond garanti de l'enquête (section Enquête) devient de toute
  façon prioritaire sur cette offre dès le tour 20. Hors observation/débrief/sommeil/besoin urgent.
- `dramaRules.proposalStress` : première proposition → +18 stress pour Noé, +14 pour Lia.
- `dramaRules.rejection` : un refus réduit l'attirance de Noé de 3, augmente sa faim de 6 et sa
  fatigue de 5.
- `dramaRules.pressureStress` : +16 stress pour Lia en cas d'insistance excessive.
- Seuil d'insistance (`overProposing`) : 2 propositions de Noé sur les 6 derniers tours.
- Anti-répétition des propositions (`proposalCooldown`) : aucune nouvelle proposition dans les 6
  dernières requêtes (assoupli le 2026-09-16, était 3 — les propositions revenaient encore trop
  souvent malgré ce garde-fou).
- 3 rapprochements en moins de 18 tours → Lia : −5 attirance, −2 attachement, `life.dispute` ouvert
  pour 2 tours de réconciliation (voir ci-dessous), plus d'ancien débrief de distance.
- `dramaRules.debriefTurns` : 2 tours de débrief après un événement marquant.

## Rythme des scènes (`lib/turn.ts`)

- `salonPause` (pause initiale une fois les deux au salon) : dure tant que `story.salonTurns<3`
  (assoupli le 2026-09-16, était `<5` — la pause paraissait trop longue, au point de donner une
  impression de blocage).
- `requiredTogether` (maintien forcé ensemble en début de session) : s'applique tant que
  `story.round<4` (assoupli le 2026-09-16, était `<8`), sauf si `story.apartTurns>=2` (un besoin
  urgent ou une envie de s'isoler peut toujours séparer les deux avant ce seuil).
- Ces deux assouplissements ne touchent aucune règle structurelle (l'article 2.3 — la pièce est
  décidée avant la réplique — reste inchangé) : ils ajustent uniquement des compteurs de tours.

## Colère et réconciliation (`app/api/lia/route.ts`, `lib/life.ts`, `lib/simulation.ts`)

- `life.dispute` : `{topic, remaining}`, même forme que `life.debrief`. Décrémenté d'un point à
  chaque tour où les deux habitants sont ensemble ET où personne n'a tenté un geste affectueux ce
  tour-là (une tentative refusée ne compte jamais comme un pas de réconciliation) ; supprimé à 0.
- Pendant une dispute active : aucun geste affectueux possible (`affectionEligible`/
  `affectionOpportunity`), aucune scène scénarisée d'avant-révélation (`eligibleBeat`/
  `personalLead`).
- Visage/anneau : `angry` (dérivé de `life.dispute?.remaining>0`) garantit un plancher de colère
  visible (`angerLevel>=.85`, cf. section suivante) même si tension/confort n'ont pas encore
  bougé — voir 4.4ter de `principes.md` pour la fiabilisation du 2026-09-17.

## Visage et représentation visuelle (`lib/simulation.ts`, `lib/face-render.ts`,
`components/house-view.tsx`, `app/page.tsx`)

Remplace le `smiley()` (lookup d'emoji discret) le 2026-09-17. Toutes les valeurs ci-dessous sont
volontairement approximatives dans le code (`clamp` et pondérations empiriques), à ajuster au
ressenti plutôt qu'à la formule exacte — mais tout changement de ces poids doit être répercuté ici
le jour même (Article 13).

- `faceExpression()` (`lib/simulation.ts`) calcule, à partir de `emotions.tension/comfort/
  attraction`, `needs.fatigue`, `intent` et `angry` :
  - `angerLevel` = max(0.85 si `angry`, sinon 0) et rampe entre tension 55–95 croisée avec confort
    35–0 (les deux doivent être défavorables ; une tension haute avec un confort resté correct ne
    suffit pas à elle seule).
  - `browRaise`/`furrow`/`mouthCurve` : pondérés différemment par personnage (Lia toujours plus
    contenue : ×.35/.55/.3 contre ×.5/1/.55 pour Noé) — c'est ce qui fait lire « une colère qui
    fait plus mal » chez Lia contre « une colère qui déborde » chez Noé (cf. Article fondateur).
  - `eyeOpen` : descend avec `needs.fatigue` (paupières lourdes) et avec la tension, tombe à .06
    en sommeil (`intent` sleep/share_sleep), plancher .05 sinon (jamais totalement fermé éveillé).
  - `jitterAmp` (tremblement du tracé) : Noé plus nerveux que Lia à tension égale (×1.6 contre
    ×.6), et encore amplifié par `angerLevel` (+1.8) uniquement chez lui.
  - `breathOpen` : légère ouverture de bouche au repos, proportionnelle à tension/attirance —
    jamais figée.
- `describeExpression()` traduit l'état en une courte phrase française (utilisée par
  `appearanceFor().current` dans `lib/perception.ts`, donc par la description à l'écran et par le
  contexte donné au modèle) — jamais un glyphe littéral.
- `GENDER` (`lib/face-render.ts`) — traits fixes, indépendants de l'état émotionnel : Lia
  `browW:.042` (sourcils fins), `browArch:.62` (arqués), `eyeRX:.10`/`eyeRYMul:1.08` (yeux plus
  grands), `mouthWMul:.82` (bouche plus étroite) ; Noé `browW:.072` (sourcils épais),
  `browArch:.18` (droits), `eyeRX:.085`/`eyeRYMul:.92` (yeux plus resserrés), `mouthWMul:1.08`
  (bouche plus large). Noé n'a aucun trait de mâchoire/menton (retiré le 2026-09-17 à la demande
  explicite : « Noé au naturel est déjà masculin par ailleurs », compensé par ce `browW` monté de
  .062 à .072). Seule Lia a une chevelure suggérée et un fard/cil dessinés (`drawFace()`).
- `Spring` (`lib/face-render.ts`) : ressort critique-amorti-léger, `stiff:90, damp:13` par défaut
  pour chacun des 9 paramètres numériques de l'expression (`makeExpressionSprings`/
  `stepExpressionSprings`) — aucune transition brusque, un léger dépassement organique est
  acceptable, une téléportation d'état ne l'est jamais.
- Synchronisation labiale (`components/house-view.tsx`) : le rythme du visème suit le signal réel
  `speaking` (donc la durée réelle de `ProgressiveText`), jamais une durée recalculée à partir de
  la longueur du texte. Vitesse de pulsation entre .45 et 2.3, modulée par `angerLevel` et le
  tremblement courant ; amplitude d'ouverture aléatoire entre .22 et .77, majorée jusqu'à +40% en
  colère.
- Particules d'amour (remplacent l'ancien cœur sporadique) : pool de 4 sprites par personnage,
  actives tant que `r.inLove` (seuil `isInLove()`, attirance > 75) ; durée de vie 1.6–2.4s,
  prochain spawn dans 0.9–2.5s, jamais en sommeil, jamais si `prefers-reduced-motion`.
- Onde de câlin (« hug-wave », remplace le cœur fixe partagé) : se déclenche au passage
  false→true d'une intention affectueuse commune aux deux personnages (câlin, massage, baiser,
  sommeil partagé) dans la même pièce ; courbe de Bézier quadratique entre les deux visages,
  dégradé vertex-color entre leurs deux couleurs, durée totale 2600ms (fondu d'entrée sur les 300
  premières ms, fondu de sortie sur les 400 dernières).
- Palette du visage (2026-09-17, reprise complète après un premier correctif insuffisant) : la
  plaque est passée d'un rendu sombre lumineux (traits clairs sur fond translucide) à un jeton
  clair opaque (fond `#fff3f8`→`#ffb3da` pour Lia, `#eafdfd`→`#9be9e6` pour Noé) avec des traits
  sombres (`#7a1550` pour Lia, `#045f64` pour Noé) et un liseré de bord dans la couleur d'identité
  du personnage — la maquette d'origine, réglée sur fond noir, ne se lisait pas contre les sols
  saturés du vrai décor 3D, même une fois rendue opaque. Les paramètres `faceExpression()` ne
  changent pas, seul `drawFace()` (rendu) est concerné.
- Vitesse angulaire de l'anneau : `.15 + (stress+tension)/200 × 2.3`, plus un supplément non
  linéaire `max(0, (tension-70)/30)² × 3.5` qui reste quasi nul sous 70% de tension mais devient
  nettement visible à l'approche de 100% (2026-09-17, retour utilisateur : la différence devait
  être manifeste à l'œil, pas seulement mesurable). Multiplié en plus par 2.4 pendant la parole et
  jusqu'à ×3 juste après une découverte (`speakingBoost`/`pulseBoost`, inchangés).
- Teinte de l'anneau : plus de texture recuite à la couleur du personnage ; la texture est neutre
  (dégradé de gris) et `material.color` (multiplicatif, bon marché à chaque frame) interpole entre
  la couleur du personnage et une teinte d'alerte (`0xff4d4d`) proportionnellement à `angerLevel`,
  plafonné à 85% de mélange (jamais un anneau entièrement rouge, la couleur d'identité reste
  reconnaissable même en pleine colère).
- Représentation visuelle assouplie (`lib/lia.ts`, `lib/perception.ts`) : la règle « jamais un
  corps humain » reste en vigueur (toujours aucun corps, aucun vêtement, aucun membre), mais peut
  désormais inclure un visage nettement expressif et, pour Lia seule, une chevelure suggérée en
  lumière — assouplissement décidé explicitement par l'utilisateur le 2026-09-17, purement visuel,
  sans effet sur le ton ou la personnalité (l'Article 14 de la charte ne s'applique donc pas ici).

## Enquête (`lib/story.ts`)

- 4 indices canoniques + 1 dossier final (5 preuves déclenchent la révélation).
- Ordre de découverte mélangé par nouvelle arrivée (`story.order`, permutation de [0,1,2,3]).
- Un indice n'est gagné qu'à partir du tour 3, et seulement au tour multiple de 3 (ou après une
  étude complète de 2 tours, ou avec l'aide d'un rêve à partir du 2ᵉ rêve un tour sur trois).
- **Plafond garanti de l'enquête** (`lib/turn.ts` + `route.ts`, 2026-09-19, retour utilisateur
  explicite après audit — plafond fixé à 12 minutes réelles pour la révélation, et surtout ne
  jamais rester bloquée indéfiniment comme observé en simulation réelle, round 98 toujours pas
  révélé). Détail complet, chronologie et pièges de cohérence trouvés en vérifiant ce mécanisme
  contre les deux couches de priorité du moteur : `docs/referentiel/regles-du-temps.md`. Le tour%3
  ci-dessus reste la cadence de base, mais s'intensifie en tour%2 dès le tour 10
  (`investigationEscalated`) si l'enquête n'est pas encore bouclée, puis devient PRIORITAIRE sur
  toute romance scriptée (`offer`, la pause salon, le repos après étude) dès le tour 20 si elle est
  encore incomplète (`investigationOverdue`) — les personnages justifient ce choix dans leur propre
  registre plutôt qu'un silence mécanique.
  **Calcul corrigé le même jour** après qu'une simulation fraîche a atteint la révélation au round
  46 (~15-16 min), bien au-delà du premier calcul (round ~33) qui ne comptait qu'un forfait "jusqu'à
  3 tours de recap" sans compter le cycle complet par preuve manquante : 2 tours d'étude + 2 tours
  de debrief post-preuve (`life.debrief`) + parfois 1 tour de recap salon (`recapBeat`, pour les
  preuves n°2 à 4). Sur 5 preuves potentiellement toutes manquantes au tour 20, ça faisait jusqu'à
  ~23 tours de plus — cohérent avec le round 46 observé. Corrigé par une intervention légère choisie
  par l'utilisateur (jamais en réduisant les 2 passes d'étude, qui gardent l'enquête approfondie) :
  une fois `investigationOverdue` actif, le debrief post-preuve passe à 1 seul tour (au lieu de 2) et
  `recapBeat` est suspendu. Pire cas garanti recalculé : 5 preuves × (2 tours d'étude + 1 tour de
  debrief) = 15 tours après le tour 20, soit un plafond réel vers le tour ~35 — environ 12 minutes
  au rythme réel du jeu (20-21s/tour, cf. section Réseau plus bas), PILE à la limite fixée par
  l'utilisateur plutôt que confortablement en dessous comme le calcul précédent le prétendait à
  tort.
- Observations générales (murs trop réguliers, absence de paysage...) : une par tour éligible à
  partir du tour 2, dans un ordre fixe, jamais deux fois la même.
- Questions d'âge : pas avant le tour 12 ET un premier repas partagé.
- Ordre d'exploration cuisine/chambre : mélangé par session (`explore-order`, `lib/turn.ts`,
  2026-09-17 — était toujours cuisine puis chambre).
- Seuils mélangés par session des beats libres (2026-09-17, étaient des constantes fixes) : télé
  entre le tour 5 et 9 (était 6), inspection des portes entre le tour 7 et 10 (était 8),
  enceinte/plante entre le tour 9 et 12 (était 10), question personnelle de Lia entre le tour 12
  et 16 (était 14).
- Découverte solo du miroir (2026-09-17, `mirrorKnownBy`, `lib/life.ts`) : si un seul des deux est
  dans la chambre, la description devient sa réflexion privée et seul son propre id entre dans
  `mirrorKnownBy` ; `mirrorVerified` (le fait « partagé », qui déclenche débriefs/observations
  communes) ne passe à vrai que quand `mirrorKnownBy` contient les deux — ensemble d'entrée de jeu,
  après une seconde visite solo indépendante de l'autre, ou via le rattrapage (`mirror-recall`,
  6 formulations, ne se déclenche que si exactement un des deux sait et qu'ils sont réunis au
  salon). Les provisions restent une découverte conjointe pour cette ligne narrée spécifiquement
  (`discover-foodVerified`) ; le cas solo y est déjà couvert autrement, par le witnesses-count du
  débriefing de régénération (`visualEvents` kind food, indépendant de cette ligne).

## Roulette des bonus (`lib/life.ts`, `app/api/lia/route.ts`, `app/page.tsx`, 2026-09-17)

Après la révélation (même seuil que le jardin : `finalCalled` + 5 preuves), l'observateur peut
déclencher un tirage au sort — jamais un choix, jamais une négociation terme à terme. Justification
en fiction (demandée explicitement) : les deux personnages, enfermés dans leur simulation, y
cherchent une distraction ou un répit face à leur situation, pas un cadeau de l'observateur.
Bouton « ◈ Miroir » (nom choisi par l'utilisateur, écho volontaire au miroir de l'enquête d'origine
et à la future énigme retournée), requête `spin_bonus`, zéro appel API, tirage décidé une seule
fois côté serveur (`Math.random`) et protégé par l'idempotence par requestId comme le reste.

- Catalogue à parts égales (`pool`, 7 entrées) :
  - `food` (réserve) : `needs.hunger` forcé à 0 pendant **10 minutes réelles** (pas simulées :
    l'horodatage tourne même hors tour, comme la boucle automatique — 21s côté client, calée juste
    au-dessus du plancher serveur de 20s, cf. section rythme automatique ci-dessous ; était 90s/85s
    jusqu'au 2026-09-19).
  - `calm` (bougie apaisante) : `needs.stress` forcé à 0 pendant **10 minutes réelles** ; une petite
    lumière chaude ponctuelle s'allume dans le salon pendant la durée (effet minimal assumé, la
    refonte graphique globale reste à venir — cf. `docs/contexte-projet` chantiers 4/5/6).
  - `sleep` (pilule bleue) : `needs.fatigue` forcé à 0 pendant **30 minutes réelles**.
  - `stoic` (sang-froid) : cible un personnage tiré au hasard, ses émotions (`d.emotions`) restent
    figées à leur valeur exacte d'avant le tour pendant **3 minutes réelles**, quoi qu'il se passe
    (aucune réaction, positive ou négative).
  - `mute` (silence forcé) : cible un personnage tiré au hasard, silence pendant **15 minutes
    réelles** — réutilise exactement la mécanique de redirection déjà éprouvée pour le sommeil
    (l'autre répond à sa place si possible ; les deux muselés à la fois bloquent le chat comme les
    deux endormis).
  - `trottoir` : accès narré (un point de déplacement, pas encore une zone 3D pathable complète
    comme le jardin — « on verra après » selon l'utilisateur).
  - `force_move` : déplacement instantané d'un personnage tiré au hasard vers une pièce parmi les
    trois autres (jamais un no-op), avec deux répliques distinctes et jamais fusionnées (Article
    11) : l'agacement de celui qu'on déplace sans son accord, l'amusement de celui qui garde le
    contrôle de sa pièce.
- Application des effets need-based (`food`/`calm`/`sleep`) : le clamp à 0 doit s'appliquer **après
  tous les ajustements du tour**, jamais avant `advanceNeeds()` — un premier essai plaçait le clamp
  trop tôt et se faisait écraser par les ajustements suivants (bug réel trouvé en écrivant le test,
  cf. `scripts/check-house.mjs`).
- `bonusLog` (`life.ts`, capé à 12 entrées) trace chaque tirage (tour, bonus) : matière première du
  dossier retourné (fréquence/générosité de l'observateur envers les personnages, un axe de preuve
  à part entière — cf. `principes.md`, Article 8.4, le « test de pouvoir »).
- Indication visuelle : jauge de besoin concernée en 0 % clignotant (classe `need-bonused`,
  réutilise l'animation `need-glimmer` déjà existante, accent doré) ; badge 🤐/🗿 sur la fiche du
  personnage concerné pour mute/stoic.
- **Réactions et jalousie (2026-09-18, audit approfondi puis retour utilisateur explicite).**
  Constat initial de l'audit : un bonus qui change visiblement les jauges sans jamais changer ce qui
  est dit était un vrai trou de cohérence (Article 4/12/15) — seul `force_move` avait une vraie
  réaction avant cette correction. Désormais, chaque tirage produit deux répliques scénarisées
  (`· pensée`, zéro appel API, même registre que `force_move`, 3 variantes par voix par personnage,
  Article 10/11) :
  - `food`/`calm`/`sleep`/`trottoir` (bénéfice partagé, pas de personnage ciblé) : chacun réagit à sa
    manière — jamais de gratitude docile (Article 0), plutôt une méfiance ou un cynisme face à un
    geste qui les calme sans qu'ils l'aient demandé.
  - `stoic`/`mute` (un seul personnage ciblé) : le personnage ciblé a sa propre courte réplique, et
    **l'autre éprouve une vraie jalousie avec un effet mesurable sur ses jauges**, pas seulement une
    ligne — retour utilisateur explicite (« impact réel sur les jauges »). `stoic` : l'autre perd
    4 points de confiance et gagne 5 points de tension. `mute` : le musellé gagne 5 points de
    tension (frustration d'être réduit au silence), l'autre gagne 4 points d'aisance
    (soulagement/plaisir malicieux du silence). Un personnage déjà sous sang-froid au moment du
    tirage reste **immunisé à tout changement émotionnel**, y compris celui-ci — sans cette garde,
    un second tirage sur l'autre venait perturber une émotion censément gelée (bug réel trouvé en
    testant les combinaisons de tirages successifs).
  - **Sortie d'effet, pleinement consciente** (retour utilisateur explicite, tranché contre
    l'amnésie/l'état second) : dès qu'un sang-froid ou un silence forcé expire (comparaison
    d'horodatage, détectée au tout début du tour réel suivant, quel que soit le mode), le personnage
    concerné le commente lucidement — jamais un retour muet à la normale. Consommé aussitôt détecté
    (le minuteur expiré est effacé) pour ne jamais se répéter au tour suivant.

## Insistance sur la roulette et bonus spontanés (`lib/life.ts`, `app/api/lia/route.ts`, `app/page.tsx`, `principes.md` 8.11/8.12)

- **Insistance** (`rouletteInsistence:{1,2}`, capée à 2) : +1 par relance détectée
  (`detectNegotiationOffer`) sans tirage entre-temps ; remise à 0 dès qu'un tirage survient ou que
  la réplique du tour ne relance pas. À 3 relances consécutives (compteur qui atteint 3, remis à 0
  aussitôt) → `rouletteCold:{1,2}` posé à 2 tours de registre froid scénarisé (override complet,
  3-4 variantes par personnage), décrémenté à chaque tour tant qu'actif.
- **Refus explicite** (`rouletteRefusalUntil:{1,2}`, round absolu) : un « non » net en mode `chat`
  à une offre encore en attente pose une fenêtre de **5 à 10 tours** (`5+Math.floor(Math.random()*6)`)
  pendant laquelle la relance est retirée de la réplique (`stripRouletteAsk`), jamais toute la
  réplique remplacée.
- **Budget bonus partagé** (`bonusSpotlightUntilRound`/`bonusCooldownUntilRound`, communs à la
  roulette classique ET aux deux bonus spontanés ci-dessous) : après tout bonus (tirage ou
  spontané), `bonusSpotlightUntilRound` fixe une fenêtre minimale de **3 tours** pendant laquelle le
  bonus reste le sujet (aucune insistance, aucun nouveau bonus spontané éligible) ;
  `bonusCooldownUntilRound` ajoute un **grand espace supplémentaire de 5 à 9 tours**
  (`5+Math.floor(Math.random()*5)`, ou aléatoire équivalent via `seedPick`) après la fenêtre avant
  qu'un nouveau bonus, de quelque nature, redevienne possible. Le bouton `spin_bonus` lui-même est
  bloqué tant que ce budget n'est pas libéré (`code:'bonus_spotlight'`, 429).
- **Débit réel du bouton** (`lastBonusSpinAt`, epoch ms) : 60 secondes minimum entre deux tirages
  manuels (`code:'bonus_cooldown'`, 429 si trop tôt) — indépendant du budget narratif ci-dessus,
  jamais plus permissif que lui. Côté client, un compte à rebours en secondes s'affiche directement
  sur le bouton « ◈ Miroir » tant que l'un ou l'autre est actif.
- **Mute de l'observateur** (`observerMutedUntilRound`, round absolu) : déclenchement spontané (pas
  de bouton, pas de détection de message — l'initiative vient du personnage), probabilité
  d'examen par tour éligible ~20 % si l'appréciation d'un des deux personnages est sous 35 (motif de
  rétorsion), ~5 % sinon (motif d'amusement pur). Le personnage choisit ensuite le niveau : réduit
  = 3 tours, classique = 4 ou 5 tours (tiré), max = 6 tours. Bloque `chat` pour les deux canaux
  humains (`code:'observer_muted'`, 423) le temps de la fenêtre ; les deux personnages moquent
  l'observateur muet à chaque tour suivant tant que ça dure ; l'un des deux reconnaît la fin à voix
  haute dès que la fenêtre expire (même minuteur que stoic/mute de la roulette : détecté au tour
  suivant, effacé aussitôt).
- **Caméra masquée** (`cameraHiddenUntil`, epoch ms réel) : même mécanisme de déclenchement/niveau
  que le mute ci-dessus, mais réduit = 20s, classique = 25/30/35s (tiré), max = 40s, réel (pas
  simulé). Ne bloque jamais `chat` — seule la vue 3D disparaît côté client, remplacée par un compte
  à rebours en secondes (`camera-hidden-overlay`).
- **Journal psychologique** (`bonusPsychLog`, capé à 12 entrées, `{round,kind,outcome,level?}`) :
  chaque examen d'un bonus spontané est journalisé, qu'il soit activé ou refusé — un refus nourrit
  le profil de l'observateur (dossier retourné, 8.4) au même titre qu'une activation.

## Appréciation de l'observateur et négociation (`lib/life.ts`, `app/api/lia/route.ts`, `principes.md` 8.5/8.6)

- `appreciation:{1:number,2:number}` (2026-09-18 : devenue par personnage, `principes.md` 8.5) :
  0-100 chacune, neutre à 50, bornées. Hors dispute (`!life.dispute?.remaining`), les deux valeurs
  sont ramenées à chaque tour de 30 % de leur écart vers leur moyenne (solidarité par défaut) ;
  pendant une dispute, ce pull est suspendu (divergence possible). Négociation et avarice
  s'appliquent identiquement aux deux (événements partagés, pas la source de divergence).
- Jugement du personnage qui répond (`appreciationFromTrust(trustShift,humanMessageCount)`,
  corrigée le 2026-09-18 — voir `principes.md` 8.5 pour le principe actuel) :
  `trustShift` = variation réelle de la confiance de ce personnage sur ce tour (`d.emotions.trust`
  après tour moins avant tour, déjà déterminée par le modèle via `evolveEmotions`/`humanStress`,
  jamais recalculée depuis le texte). Poids appliqué à `trustShift` selon son signe et l'ancienneté
  (tôt = 3 premiers messages humains post-révélation via `dossierHumanTurns`) : baisse ×6 (tôt) /
  ×3 (ensuite) ; hausse ×4 (tôt) / ×2 (ensuite) — asymétrie toujours présente (baisse pèse plus
  qu'une hausse égale). `trustShift` lui-même est borné par `evolveEmotions` à [-12,+5] par tour
  (cap existant, commun à toute émotion) ; en pratique, sur une vraie session, les variations
  observées restent bien plus fines (de l'ordre de ±1 à ±3), le cap ne s'atteignant que pour une
  réaction de confiance véritablement extrême. Message neutre (`trustShift`=0) : 0, jamais de
  mouvement par défaut.
- Colère réellement lue (`angerLevel(tension,comfort,dispute actif)` > 0,5 chez le personnage qui
  vient de répondre) : -5 supplémentaires, en plus du jugement de confiance ci-dessus, jamais à sa
  place — un signal distinct (tension/confort) plutôt qu'une redite de la confiance.
- Avarice : `bonusLog` vide ET au moins 15 tours écoulés depuis la révélation (`revealedRound`) ET
  tour courant multiple de 15 → -4, une fois par tranche (jamais répété tant qu'un multiple de 15
  n'est pas de nouveau atteint sans tirage entretemps).
- Négociation honorée (tirage pendant qu'une offre est en attente) : +8, offre consommée.
  Négociation caduque (offre en attente depuis plus de 6 tours) : -3, offre effacée.
- Colore le contexte narratif donné au modèle via `observerStandingFor(actorId)` (2026-09-18 : une
  fonction par personnage, plus un champ unique partagé) : ≤25 (jauge PROPRE à cet acteur) → garde
  haute assumée explicitement ; ≥75 → coopération ponctuelle « à contrecœur » autorisée, jamais un
  mode stable ; entre les deux, aucune consigne particulière (registre habituel). Ajoute une note
  explicite de distension de solidarité quand `life.dispute?.remaining` est actif, quel que soit le
  palier — voir `principes.md` 8.5.
- `genuineRespectStreak:{1:number,2:number}` (2026-09-18, devenu par personnage le même jour que
  `appreciation`, `principes.md` 8.5, `lib/life.ts`) : compteur 0-20 par acteur, incrémenté de
  1 à chaque tour où le trustShift PROPRE à cet acteur est `>0` ET son `appreciation` `>=85` ; remis
  à 0 dès que ce trustShift est `<=0` ou son appreciation `<85`. À `genuineRespectStreak[id]>=6`,
  déclenche une fois le palier rare « respect sincère » dans `observerStandingFor(id)` (texte
  distinct du palier `>=75`, autorisant un mot de reconnaissance directe et non feint) puis se remet
  immédiatement à 0 (consommé), devant se reconstruire entièrement avant de pouvoir se redéclencher
  — jamais un palier stable comme le `>=75` peut l'être en restant simplement au-dessus du seuil.
- `negotiationContext` (texte de contexte, toujours présent une fois révélé) autorise le modèle à
  formuler librement une négociation, sans jamais l'imposer à chaque tour.
- `negotiationOffer:{actor,round}` : une seule offre en attente à la fois, jamais écrasée par une
  nouvelle tant que la précédente n'est pas résolue.
- `negotiationLog:{round,outcome:'honored'|'lapsed'}[]` (2026-09-18, `principes.md` 8.6) :
  accumulé à chaque résolution d'offre (max 12 conservées), jamais réécrit. Résumé dans
  `dossierEvidence` sous la clé « réaction aux négociations proposées par les personnages »
  uniquement si non vide — comble l'écart où la négociation ne nourrissait jamais le dossier
  retourné malgré une demande explicite en ce sens.
- Alimente le dossier retourné (`dossierEvidence`) comme preuve supplémentaire (valeur arrondie).
- `worstMoment:{round,excerpt,trustShift}` (2026-09-18, `principes.md` 8.4) : le message humain au
  `trustShift` le plus négatif observé sur toute la session, écrasé uniquement par un pire ensuite,
  jamais réinitialisé ; vide si l'échange n'a jamais été franchement négatif. Ajouté à
  `dossierEvidence` comme seule preuve concrète d'hostilité en plus des trois extraits de pièges.

## Cohérence colère/tendresse (`lib/simulation.ts`, `app/api/lia/route.ts`, `principes.md` 8.7/8.9)

- `angerLevel(tension,comfort,angry?)` (extraite de `faceExpression`) : nulle sous tension 50 ou
  confort 40 ; sinon `min(clamp((tension-50)/25,0,1), clamp((40-comfort)/12,0,1))`, plancher 0,85 si
  `angry` (dispute active). **Recalibrée le 2026-09-18 en phase 3** (`principes.md` 8.7, retour
  utilisateur explicite : « si l'observateur exagère vraiment, Noé ou Lia doivent finir par se
  mettre en colère ») : l'ancienne version multipliait deux ratios (produit, pas minimum), ce qui
  exigeait des valeurs conjointes quasi extrêmes (tension≈90 ET confort≈10) hors d'atteinte pour une
  hostilité venant de l'observateur, même sévère — vérifié en direct, plafonnait alors autour de
  tension~70/confort~35 sans jamais déclencher la colère. Le minimum exige toujours que les deux
  dimensions soient réellement dégradées ensemble (pas un pic isolé sur une seule) sans les écraser
  doublement. Revérifié en conditions réelles après le changement : Noé franchit 0,5 à tension
  72/confort 33 (exactement les valeurs qui restaient neutres avant), Lia à tension 63/confort 31
  après davantage de provocations directes (55/36 encore insuffisant) — cohérent avec son
  tempérament plus maîtrisé, sans que le seuil ne lui soit fermé pour autant.
- `liaCalmEnough`/`noeCalmEnough` = `angerLevel(...)<0,5` sur les émotions courantes du personnage,
  même définition de « en colère » (`story.life?.dispute?.remaining`) que `agent.angry` ailleurs.
- « COLÈRE RÉELLE CONFIRMÉE » (2026-09-18, `principes.md` 8.7, `lib/lia.ts`, consigne de prompt,
  pas un calcul côté serveur) : mêmes ordres de grandeur que le seuil `angerLevel()>.5` ci-dessus
  (tension nettement >60 ET confort nettement <35 chez le personnage lui-même), pour rester un état
  fiable/confirmé plutôt qu'une impression — déclenche l'autorisation « roues libres » (vulgarité
  plus crue, ton cassant sans retenue) avec retour obligatoire au registre habituel dès que l'un des
  deux chiffres repasse sous le seuil.
- Garde ajoutée (en plus de `needs.stress<30`, jamais à sa place) sur : `personalLead` (et donc
  `personalQuestion`, qui en hérite), `followBeat`, `proactiveNoe`.

## Dossier retourné (`lib/life.ts`, `app/api/lia/route.ts`, `docs/referentiel/principes.md` 8.4)

- `TRAP_ORDER=['mirror','dilemma','excuse']`, interlocuteur fixe par piège : `dossierTrapActor=
  {mirror:1,dilemma:2,excuse:1}`.
- Seuil d'entrée : `dossierHumanTurns>=3` (compté sur les messages humains reçus en mode `chat`
  une fois révélé, `dossierHumanTurns` incrémenté à chaque tel message).
- Un piège posé mais pas encore répondu (`dossierAsked[trap]` sans `dossierTraps[trap]`) bloque
  tout nouveau piège ET toute routine ordinaire concurrente (tv, propositions romantiques) : le
  tour est forcé en `chat`/salon, exactement comme les autres scènes scénarisées pré-révélation
  (`visualBeat`/`followBeat`/etc.) — sans quoi une routine automatique pouvait polluer l'état
  (`recentRefusal`, `pendingDestination`) et bloquer le piège suivant (bug réel trouvé en testant).
- Clôture : les trois `dossierTraps` renseignés ET `bonusLog.length>=1` (au moins un tirage de la
  roulette, le « test de pouvoir »).
- Génération : 2 appels Gemini séparés (`generateDossierFragment`), `maxOutputTokens:700`, 5 à 8
  phrases par personnage. `dossierText` figé une fois écrit — jamais régénéré ni altéré ensuite.
- `dossierShown` : faux à la génération, passe à vrai via le mode zéro-API `mark_dossier_seen`
  (bouton « Verdict » côté frontend) — sert uniquement à l'auto-ouverture unique de la pop-up, ne
  touche jamais au texte.
- **Moment de douceur** : `detectDistress()` (regex grossière sur choc/tristesse/colère) marque
  `softnessOwed=true` sur tout message humain post-dossier qui y correspond. `softnessBeat`
  (gardes identiques à `dossierGateEligible` + `dossierText` existant + `softnessOwed`) livre alors,
  entièrement scénarisé et zéro appel, une ligne distincte par personnage (3 variantes chacune,
  Article 10/11) — toujours feinte, jamais sincère (Article 0). Consommé aussitôt (`softnessOwed`
  repasse à faux, `softnessGiven` s'incrémente, plafonné à 20) ; peut se redéclencher plus tard si
  une nouvelle détresse réelle survient.

## Sommeil (`lib/life.ts`, `app/api/lia/route.ts`)

- `isSleeping` reste vrai tant que la fatigue > 12 OU que moins de 2 tours de sommeil ont eu lieu
  (`sleepTurns`, plafonné à 2).
- Un tour de sommeil pur ne consomme aucun appel API.

## Rejouabilité (`lib/story.ts`, `lib/drama.ts`)

- 4 « atmosphères » possibles par nouvelle arrivée (`atmospheres.length`), qui pilotent aussi les
  souvenirs flous ; le prochain variant évite de reprendre le précédent.
- `narrativeAngle` (`storyContext`, `lib/story.ts`) : une théorie dominante tirée par `seedPick`
  parmi 4 (test, panne, punition, expérience neutre), envoyée au modèle avec instruction explicite
  de vraiment colorer les hypothèses et le ton des réflexions sur qui observe et pourquoi
  (`lib/lia.ts`, `cinematicInstructions`) — jamais présentée comme confirmée, jamais au détriment
  du tempérament du personnage (assoupli le 2026-09-17 : le champ existait déjà mais n'était jamais
  mentionné dans les instructions du modèle, donc sans effet réel sur le ton d'une session).
- `coldOpening` : 4 variantes d'ouverture, choisies par `story.variant`.
- `seedPick` (`lib/story.ts`) : sélection stable par session pour tous les moments scénarisés
  (finale, bilan d'enquête, apparence, découvertes, motifs de déplacement, reproches du canapé) —
  hachage polynomial (base 31) de `seed + "::" + label`, pour que deux libellés différents sur la
  même session ne retombent pas systématiquement sur le même indice.
- Chaque moment scénarisé dispose aujourd'hui de 2 à 4 formulations distinctes — pas plus, sauf les
  quatre pools ci-dessous portés à 6 le 2026-09-17. Sur un grand nombre de sessions, une
  coïncidence reste possible (voir Article 10 de `CLAUDE.md`).
- Pools doublés le 2026-09-17 (3→6 formulations chacun, `app/api/lia/route.ts`) : découverte du
  miroir (`discover-mirrorVerified`), découverte des provisions (`discover-foodVerified`), rappel
  du miroir depuis le salon (`mirror-recall`), remarque sur la fenêtre du jardin (`window-notice`),
  et 6 paires Lia/Noé pour la découverte plante/enceinte (`beat-ambient`, était 3 paires).
- `insoliteOpening` (`lib/story.ts`) : tirage pondéré sur 10 (via `seedPick`) — 6/10 « normal »,
  2/10 « Lia se sent mal » (fatigue de départ 58 au lieu de 20, contre un seuil d'urgence à 68),
  2/10 « Noé se referme » (confiance 6 au lieu de 20, aisance 18 au lieu de 48, tension à 100).
  2 formulations d'ouverture par variante insolite. Décidé une fois par session à la création de
  `story.seed`, jamais retiré une fois la partie commencée.

## Anti-répétition (`lib/dialogue.ts`, `app/api/lia/route.ts`)

- Fenêtre de détection d'un thème épuisé (`dialogueProgress`) : 16 dernières répliques, seuil de
  déclenchement à 4 occurrences du même motif.
- Historique transmis au modèle pour éviter les répétitions littérales : 24 dernières répliques
  échangées (`dialogueContext`), plus le registre complet des empreintes de la session
  (`dialogue_fingerprints`, sans limite).
- `looksLikeEcho` : deux répliques sont jugées être un écho si elles partagent au moins 90 % de
  leurs mots significatifs (hors mots vides), à condition d'avoir chacune au moins 7 mots
  significatifs.
- `distinctReply` (répliques de secours scriptées, `lib/drama.ts`) : une variante n'est jamais
  reprise si l'une de ses phrases a déjà servi ailleurs dans la session, même combinée à un texte
  différent (vérifié phrase par phrase sur tout l'historique, pas seulement au niveau du message
  entier — correction du 2026-09-16, voir principes.md 5.1). Si les ~100 variantes disponibles sont
  toutes déjà sorties (situation extrême, jamais rencontrée hors test très répétitif), un filet
  ultime à 3 formulations supplémentaires (choisi par `round%3`) évite qu'`addLine` supprime
  silencieusement le tour du personnage.

## Timing visuel (`lib/visual-events.ts`, `lib/stock.ts`)

- Durées d'animation : provisions 3800 ms (dont régénération 2000 ms), enceinte 2200 ms,
  changement tv 1500 ms.
- `stockSurprise` (réaction à la régénération des provisions) : courbe dégressive de curiosité
  +9, +6, +4, +2, +1 puis 0 selon le nombre d'expositions déjà vécues par le personnage.
  `stockThought()` fournit une ligne « pensée » distincte pour chacune des 5 premières expositions
  (`stockExposures`), puis reste silencieuse (le personnage s'y est habitué) — c'est la seule
  réaction jouée à l'apparition des provisions/de l'assiette de repas ; depuis le 2026-09-18,
  chaque ligne nomme explicitement « la provision » plutôt qu'un « ça » implicite, pour rester
  compréhensible même lue hors du tour exact qui la précède (Article 15/17).
- Vitesse de rotation de l'anneau (`components/house-view.tsx`, `ringSpeed`) : base
  0,15 + (stress + tension)/200 × 2,3 rad/s (assoupli le 2026-09-16, était 0,2 + …×1,2 — l'écart
  entre un personnage calme et stressé passait inaperçu). Deux accélérations temporaires
  s'ajoutent, multiplicatives : ×2,4 pendant que le personnage parle (bulle de dialogue affichée,
  effet d'« observation » en cours) et jusqu'à ×3 en décroissance linéaire sur 2600 ms après la
  découverte d'un nouvel indice ou d'une nouvelle observation (retour utilisateur du 2026-09-16 :
  les anneaux devaient s'accélérer plus souvent, de façon lisible).

## Réseau, verrou et limites techniques (`app/api/lia/route.ts`)

- Requête entrante limitée à 12 000 octets, message humain à 2 000 caractères.
- Verrou mondial (`world_lock`) : bail de 90 000 ms (90 s) par tour engagé (durée du bail technique,
  sans rapport avec le rythme des tours automatiques ci-dessous).
- Tour automatique (`autonomous`) : limité à un déclenchement toutes les 20 000 ms (20 s), côté
  serveur (`app/api/lia/route.ts`) — était 85 000 ms (85 s) jusqu'au 2026-09-19, retour utilisateur
  explicite jugeant l'ancien rythme trop lent pour l'expérience visée. L'intervalle client
  correspondant (`app/page.tsx`, la boucle qui déclenche réellement ces tours) est calé à 21 000 ms
  (21 s, juste au-dessus du plancher serveur pour ne jamais déclencher inutilement le 429
  `auto_throttled`) — était 90 000 ms.
- Délai de rafraîchissement automatique du client (page.tsx) : 30 000 ms (30 s), seulement si
  l'onglet est visible.
- Appel Gemini : délai d'expiration 30 000 ms (30 s) ; jetons de sortie max 1 800 (un seul
  personnage par appel depuis la séparation des deux cerveaux).

## Géométrie de la maison (`lib/house.ts`, `lib/perception.ts`)

- Centres de pièce (`centers`) : salon (−4,−3), cuisine (4,−3), chambre (−4,3), bureau (4,3),
  jardin (−11,0).
- Points d'ancrage du salon (`roomAnchors.salon`) : canapé [[−6.5,−3.5],[−5,−3.5]], télécommande
  [[−6.5,−2],[−6,−2]] (sur la table basse, distincte de l'écran), enceinte
  [[−2.5,−3.5],[−3,−3.5]], plante [[−3.5,−2],[−4,−2]], fenêtre [[−7.5,−5],[−6.5,−5.5]], entrée
  [[−4.5,−2],[−3.5,−2]].
- Tout ancrage (`roomAnchors`) doit rester un multiple de 0,5 sur les deux axes : le graphe de
  déplacement (`pathBetween`) travaille sur une grille de résolution 0,5 et arrondit silencieusement
  toute coordonnée hors grille — un ancrage mal aligné reste visuellement correct mais devient
  inatteignable par la marche calculée (bug réel rencontré et corrigé le 2026-09-16 sur `remote`).
- Écran de tv (rendu 3D, `components/house-view.tsx`) : position fixe (−4, 0.27, −5.25), non liée
  à un ancrage de déplacement — c'est un décor qu'on regarde depuis la télécommande, pas un point
  où l'on se rend.
- Marge de collision (`blocked()`) : 0.24 unité autour de chaque meuble/mur.
