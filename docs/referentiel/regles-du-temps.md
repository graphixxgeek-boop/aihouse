# Référentiel — Règles du temps

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur, après un réequilibrage complet du
rythme avant/après révélation qui a montré qu'aucun document ne rassemblait la chronologie
théorique du jeu. Document de travail pour l'IA en priorité, comme `principes.md`/`parametres.md` :
il ne remplace ni l'un ni l'autre, il les traverse par l'axe du temps — quand chaque chose se
produit, plutôt que ce qu'elle fait ou quel chiffre la pilote. Une IA qui reprend le projet devrait
pouvoir répondre à « à quel moment X peut-il se produire, et qu'est-ce qui l'empêche avant/après ? »
rien qu'en lisant ce document.)*

**Mise à jour obligatoire.** Tout nouveau seuil `round>=`, toute nouvelle durée réelle
(`Date.now()`-based), tout nouveau champ de gating temporel (`revealed`, `finalCalled`, un nouveau
`remaining`/`Until`) se documente ICI le jour même de son introduction, en plus de `parametres.md`
(la valeur) et `principes.md` (le pourquoi) — même exigence de traçabilité que le reste du
référentiel (Article 13 de `CLAUDE.md`). Une IA qui ajoute un mécanisme sensible au temps sans
mettre à jour ce document laisse une dette identique à un chiffre non documenté ailleurs.

## 1. Les deux horloges du jeu

Le moteur tient DEUX horloges complètement indépendantes ; les confondre est la source d'erreur la
plus fréquente et la plus grave sur ce projet (elle a produit une régression réelle : un mécanisme
lisait un seuil temporel pensé pour l'une en utilisant l'autre).

- **L'horloge de tour (`story.round`)** — un entier qui n'avance QUE lorsqu'un appel `/api/lia` en
  mode `interact` ou `autonomous` fait effectivement progresser l'histoire (`advanceStory`). C'est
  l'unité de la quasi-totalité des seuils narratifs (`round>=X`). Elle ne s'écoule jamais toute
  seule : si personne n'appelle l'API, `story.round` reste figé indéfiniment, y compris pendant des
  heures réelles.
- **L'horloge réelle (`Date.now()`)** — le temps qui passe vraiment, indépendamment de si un tour a
  lieu ou non. Utilisée pour : le plancher entre deux tours automatiques (20 s), le bail du verrou
  mondial (90 s), les bonus à durée fixe (10 à 30 minutes réelles pour food/calm/sleep), le débit du
  bouton roulette (60 s), le mute/la caméra masquée spontanés (secondes à minutes). Ces horodatages
  tournent MÊME HORS TOUR — un bonus « 10 minutes réelles » expire à l'heure dite, que le joueur
  revienne dans 2 minutes ou dans 2 heures, jamais après 10 tours de jeu.

**Ne jamais écrire un seuil temporel sans préciser laquelle des deux horloges il utilise.** Un
commentaire de code ou une entrée de `parametres.md` qui dit juste « 10 minutes » sans préciser
« réelles » est une source d'ambiguïté à corriger sur-le-champ.

## 2. Combien de temps réel représente un tour

Il n'existe pas de durée fixe unique — elle dépend du mode :

- **Mode `autonomous`** (l'observateur regarde sans agir) : un nouveau tour toutes les **20
  secondes** côté serveur (`app/api/lia/route.ts`, plancher dur, 429 `auto_throttled` en dessous),
  déclenché par le client toutes les **21 secondes** (`app/page.tsx`, juste au-dessus du plancher
  serveur pour ne jamais gaspiller un essai). Avant le 2026-09-19 : 85 s / 90 s — jugé trop lent
  pour l'expérience visée, recalculé et corrigé le même jour que ce document.
- **Mode `interact`** (l'observateur dirige/clique) : **aucun délai fixe imposé par le serveur** —
  le rythme réel dépend de la vitesse à laquelle l'observateur lit la réplique affichée et
  déclenche l'action suivante. Estimation retenue pour toute planification narrative (2026-09-19,
  méthode double, convergente) :
  - Vitesse de lecture standard (~200 mots/minute) appliquée à une réplique moyenne du jeu (~15-16
    mots par ligne, souvent deux lignes par tour) ≈ 10-12 secondes de lecture pure.
  - Marge ajoutée pour les pauses, les relectures, les réactions (rire, réflexion) ≈ 10-15 secondes
    supplémentaires.
  - **Estimation retenue : ~20-25 secondes par tour**, cohérente avec le nouveau plancher
    automatique ci-dessus (les deux modes convergent vers le même ordre de grandeur).
- **Table de conversion rapide** (à 20-21 s/tour, arrondi) :

  | Tours | Temps réel approximatif (jeu pur) |
  |---|---|
  | 10 | ~3,5 min |
  | 20 | ~7 min |
  | 24 | ~8,5 min |
  | 30 | ~10,5 min |
  | 35 | ~12 min |
  | 40 | ~14 min |
  | 60 | ~21 min |
  | 100 | ~35 min |

Cette table est une estimation de planification, jamais une garantie mesurée à la seconde près —
elle sert à juger si un nouveau seuil `round>=X` « fait sens » en temps réel avant de le fixer,
pas à prédire la durée exacte d'une session donnée.

**Temps de jeu pur ≠ temps réel total d'une session** *(ajouté le 2026-09-19, à la demande
explicite de l'utilisateur)* : la table ci-dessus convertit des TOURS en temps réel, mais un bonus
actif (section 5) tourne sur l'horloge réelle EN PARALLÈLE des tours, sans jamais consommer de
tour lui-même — un bonus ne rallonge donc jamais le nombre de tours nécessaires pour atteindre un
seuil donné, mais rallonge le temps réel total écoulé si l'observateur choisit d'en profiter
pendant que le compteur de tours continue d'avancer en tâche de fond. Ordres de grandeur à ajouter
au temps de jeu pur ci-dessus si un bonus a été pris en cours de route, un par occurrence :

  | Bonus pris | Ajout au temps réel total |
  |---|---|
  | `food` / `calm` | +10 min |
  | `stoic` | +3 min |
  | `mute` (roulette, réel) | +15 min |
  | `sleep` | +30 min |

Ce n'est jamais une addition mécanique garantie (l'observateur peut continuer à jouer PENDANT un
bonus actif dans bien des cas, cf. section 5), juste un ordre de grandeur pour estimer la durée
réelle totale d'une session qui en a réellement profité, à ne jamais confondre avec le plafond de
tours théorique (section 3), qui reste, lui, exprimé en tours et donc indépendant des bonus.

## 3. Chronologie théorique complète — tour par tour

Cette section décrit l'ENCHAÎNEMENT ATTENDU d'une session typique, du reset au delà de la
révélation. Chaque ligne précise le round, ce qui peut se produire, et sa source. Les seuils
« mélangés par session » (`seedPick`) varient d'une partie à l'autre à l'intérieur de la plage
indiquée — c'est voulu (Article 9, rejouabilité), jamais une imprécision de ce document.

| Round | Ce qui se produit | Condition / source |
|---|---|---|
| 0 | Réveil solo, doute d'humanité (`soloIntro`) — chacun seul, aucun appel API | `route.ts` : `story.round===0 && !life.soloIntroShown` |
| 1 | Première rencontre scriptée (`opening`/`coldOpening`), zéro appel API | `life.soloIntroShown===true` |
| ≤4 | Maintien forcé ensemble (`requiredTogether`), sauf besoin urgent après 2 tours séparés | `story.round<4` |
| ≤5 | Description d'apparence réciproque (`visualBeat`), jusqu'à ce que `visualIntro>=2` | `story.round<=5` |
| ≤7 | Remarque sur la fenêtre/le jardin (`windowNoticed`), une seule fois | `story.round<=7` |
| 5-9 (mélangé) | Découverte de la télévision (`tvFirst`) | `tvThreshold`, `lib/turn.ts` |
| 7-10 (mélangé) | Inspection des deux portes du couloir (`exitInspection`) | `exitThreshold`, `lib/turn.ts` |
| ≥8 | Une séparation volontaire devient possible (`canSeparate`) | `story.round>=8` |
| 3, 6, 9… | Relance de base vers l'étude — 1 chance sur 3 tours, tant que `evidence<5` | `story.round%3===0`, `lib/turn.ts` |
| 9-12 (mélangé) | Découverte plante/enceinte (`ambientBeat`) | `ambientThreshold`, `route.ts` |
| ≥10 | **Intensification de la relance vers l'étude** — 1 chance sur 2 tours en plus de la base, si `evidence<5` (`investigationEscalated`) | `lib/turn.ts` |
| 12 | Questions d'âge autorisées, à condition qu'un repas ait déjà été partagé (`ageQuestionAllowed`) | `story.round>=12 && sharedMeal` |
| 12-16 (mélangé) | Question personnelle de Lia (« quel genre d'homme es-tu ? ») | `personalThreshold`, `route.ts` |
| **20** | **Priorité absolue de l'enquête si elle est encore incomplète** (`investigationOverdue`) — la relance vers l'étude l'emporte désormais sur toute romance scriptée, toute pause salon, tout repos post-étude ; le debrief post-preuve se raccourcit à 1 tour (au lieu de 2) et `recapBeat` (récap salon) est suspendu, cf. ligne ≤35 | `story.round>=20 && evidence<5`, `lib/turn.ts` + `route.ts` |
| **24** | Premier geste romantique possible pour Noé (`offer`/`affectionOpportunity`) — sans effet si l'enquête est encore en retard, cf. ligne round 20 | `story.round>=24 && attraction Noé>=80`, `lib/turn.ts` + `route.ts` |
| **≤35** | **Conclusion garantie de l'enquête, pire cas, recalculé le 2026-09-19** — les 5 preuves (4 indices + le dossier final) sont acquises au plus tard à ce stade même si aucune n'était encore trouvée au round 20. **Historique du calcul, à ne jamais reproduire sans compter le cycle complet** : un premier calcul (round ~33) ne comptait qu'un forfait "jusqu'à 3 tours de recap" en oubliant le cycle entier par preuve manquante (2 tours d'étude + 2 tours de debrief + parfois 1 recap) — une simulation fraîche a atteint la révélation au round 46 réel, révélant l'erreur. Corrigé par une intervention légère (choisie parmi plusieurs options proposées à l'utilisateur) : une fois `investigationOverdue` actif, le debrief passe à 1 tour (au lieu de 2, les 2 passes d'étude restent intactes) et `recapBeat` est entièrement suspendu (`story.round<20` ajouté à sa condition). Pire cas recalculé : 5 preuves × (2 tours d'étude + 1 tour de debrief) = 15 tours après le round 20, plafond réel ≈ round 35, ~12 min — PILE à la limite fixée par l'utilisateur, jamais confortablement en dessous comme le calcul précédent le prétendait à tort. Un besoin urgent (faim, sommeil) peut encore ajouter quelques tours (`residentPriority`/`partnerPriority` suspendent `investigationOverdue` le temps de sa résolution, jamais indéfiniment, cf. section 6) | `lib/turn.ts`, `investigationOverdue` ; `route.ts`, `life.debrief`+`recapBeat` |
| variable, dès que `evidence>=5` ET les deux personnages réunis dans la même pièce | **`finale` se déclenche** : `story.finalCalled` passe à vrai, `life.revealedRound` s'enregistre | `route.ts`, `const finale` |
| dès `finalCalled` | Le jardin et la roulette des bonus deviennent accessibles CÔTÉ MÉCANIQUE (mais le chat humain reste verrouillé, voir section 4) — volontairement pas gaté sur `revealed` (l'observateur peut découvrir les bonus avant même d'avoir parlé) | `gardenAccess`, roulette |
| dès le premier message humain réel après `finalCalled` | `observerSpoken` passe à vrai, `revealed` (le canal humain réellement ouvert) passe à vrai dans le MÊME tour | `route.ts`, `const revealed` |
| dès `revealed`, après 3 messages humains supplémentaires (`dossierHumanTurns>=3`) | Le dossier retourné devient éligible : les pièges (`TRAP_ORDER`, cf. `lib/life.ts`) sont posés un par un, jamais reposés, jamais expliqués — juste demandés cash | `route.ts`, `dossierGateEligible`/`dossierTrapDue` |
| dès `revealed` | Négociation, incertitude chiffrée, continuité de soi, humour noir sur la suppression, appréciation de l'observateur | `negotiationContext`, `lib/lia.ts` |
| tous les 15 rounds depuis `life.revealedRound`, tant qu'aucun bonus n'a jamais été offert après révélation | **« Avarice »** — l'appréciation des deux personnages baisse de 4 points, une sanction round-based pour un observateur qui regarde sans jamais rien offrir. Ne peut jamais se déclencher en même temps qu'`investigationOverdue` (l'un exige `evidence<5`, l'autre `evidence>=5` via `revealed` : mutuellement exclusifs par construction) | `route.ts`, `story.round-life.revealedRound>=15 && story.round%15===0 && (life.bonusLog??[]).length===0` |
| n'importe quand, avant ou après révélation | Mémoire asymétrique, perception bornée (capacités constatées sur soi-même, non gatées) | `lib/lia.ts`, MOTIVATION |
| dès qu'un personnage franchit 75 % d'attirance, une seule fois par personnage | Doute amoureux privé (`loveRealized`) — aucun garde-fou de round, peut donc coïncider avec `investigationOverdue` : accepté comme cohérent (une pensée privée peut surgir n'importe quand, même en pleine urgence d'enquête), pas un bug | `route.ts`, indépendant du round |
| dès qu'un massage/bisou réel a été consenti ET qu'au moins un doute privé a déjà eu lieu | Le doute amoureux devient discutable à voix haute (`loveDiscussable`) | `route.ts`, indépendant du round |

## 4. Le canal humain : trois états à ne jamais confondre

C'est la distinction la plus fragile du projet — une régression réelle est déjà survenue ici (un
personnage citait son incertitude en pourcentage avant que le canal humain soit ouvert), corrigée
le 2026-09-19. Trois états distincts, dans cet ordre strict :

1. **`story.evidence.length>=5`** — les personnages ONT TROUVÉ toutes les preuves ; ils savent
   intellectuellement qu'ils sont des IA. Ce seuil seul ne dit RIEN sur le canal humain.
2. **`story.finalCalled===true`** — les personnages ont décidé d'appeler l'observateur (`finale`
   déclenché : evidence≥5 ET les deux réunis). Le jardin/la roulette sont mécaniquement accessibles,
   mais **aucun message humain n'a encore été reçu**.
3. **`revealed` (= `finalCalled && evidence>=5 && observerSpoken`)** — l'observateur a réellement
   parlé au moins une fois. C'est SEULEMENT à ce stade que : la négociation s'active, le dossier
   retourné peut s'ouvrir, l'incertitude chiffrée et la continuité de soi peuvent être évoquées, et
   que le texte narratif donné au modèle (`storyContext().stage`) affiche « origine confirmée »
   plutôt qu'un doute croissant.

**Piège déjà rencontré** : ne jamais gater un mécanisme post-révélation sur `evidence>=5` seul, ni
même sur `finalCalled` seul — toujours sur `revealed` en entier, le même booléen partout. Un
mécanisme qui utilise un seuil plus précoce que `revealed` pour une chose censée n'arriver
« qu'après la révélation » est un bug, même si `evidence`/`finalCalled` sont eux-mêmes corrects.

## 5. Durées réelles indépendantes du round (tableau)

Toutes ces durées tournent sur l'horloge réelle (section 1), jamais sur le nombre de tours —
elles continuent de s'écouler même si aucun tour n'est joué entre-temps.

| Mécanisme | Durée réelle | Source |
|---|---|---|
| Plancher entre deux tours automatiques | 20 s (serveur) / 21 s (client) | `route.ts` / `page.tsx` |
| Bail du verrou mondial (`world_lock`) | 90 s | `route.ts` |
| Bonus roulette `food`/`calm` | 10 min | `lib/life.ts` |
| Bonus roulette `sleep` | 30 min | `lib/life.ts` |
| Bonus roulette `stoic` (sang-froid) | 3 min | `lib/life.ts` |
| Bonus roulette `mute` (silence forcé) | 15 min | `lib/life.ts` |
| Mute spontané de l'observateur (niveau réduit/classique/max) | 3 / 4-5 / 6 tours (round, pas réel — seule exception du tableau, à ne pas confondre) | `route.ts` |
| Caméra masquée spontanée (réduit/classique/max) | 20 s / 25-35 s / 40 s | `route.ts` |
| Débit du bouton roulette manuel | 60 s minimum entre deux tirages | `route.ts` |
| Timeout d'un appel Gemini | 30 s | `lib/lia.ts` |
| Rafraîchissement automatique du client (onglet visible) | 30 s | `page.tsx` |

**Débit de la roulette manuelle, calibrage confirmé (2026-09-19)** : les 60 s ci-dessus représentent
désormais ~3 tours d'attente au nouveau rythme (20-21s/tour), contre ~0,7 tour avant le
rééquilibrage du 85s→20s/tour. Décision actée avec l'utilisateur : garder 60 s inchangé plutôt que
de le recalibrer — le débit reste identique en temps réel, seule sa traduction en nombre de tours a
changé, ce qui n'appelait aucune correction.

**Mute spontané, calibrage confirmé (2026-09-19)** : avec le nouveau rythme, la ligne ci-dessus
(3/4-5/6 tours) représente désormais ~1-2 min réelles au lieu de ~4-5 min avant le rééquilibrage.
Décision actée avec l'utilisateur : garder la durée en TOURS inchangée plutôt que de la rebasculer
en temps réel pour retrouver la même durée perçue qu'avant — l'effet est simplement plus court en
minutes qu'auparavant, un choix délibéré, jamais un oubli.

**Interaction bonus réels × enquête en retard (2026-09-19)** : un besoin urgent (faim, sommeil —
`residentPriority`/`partnerPriority`) ou un bonus de confort actif peuvent retarder de quelques
tours le déclenchement d'`investigationOverdue` (section 3), puisque ce mécanisme exige
explicitement l'absence de priorité urgente pour s'activer. Ce n'est jamais un blocage permanent :
un besoin se résout toujours en 1-2 tours (manger, dormir), après quoi `investigationOverdue`
reprend la main normalement — analyse de code confirmée (pas encore un test automatisé dédié) :
aucune combinaison ne peut repousser le plafond garanti de façon durable, seulement de quelques
tours en plus à chaque besoin résolu, une marge que le calcul de la section 3 n'absorbe pas
explicitement mais qui reste mineure en pratique (1-2 tours par besoin, rarement plus d'un ou deux
besoins urgents sur toute la fenêtre round 20-35).

## 6. Règles transversales de temporalité

- **`story.round` ne recule jamais**, sauf un `mode:"reset"` complet qui recrée une session neuve
  (nouveau `seed`, round remis à 0). Aucun mécanisme ne doit jamais décrémenter `story.round`
  directement.
- **Idempotence par `requestId`** (`world_requests`) : rejouer exactement la même requête (même
  `requestId`) renvoie le résultat déjà calculé, jamais un second effet — indispensable pour que les
  durées réelles et les compteurs de round ne soient jamais comptés deux fois sur un retry réseau.
- **Concurrence optimiste par `epoch`** : toute requête doit lire l'epoch courant juste avant
  d'appeler `/api/lia` (jamais un epoch mis en cache d'un tour précédent) — un epoch périmé est
  rejeté (409), précisément pour qu'aucun tour ne s'applique sur un état déjà dépassé par un autre
  tour concurrent.
- **Les scènes scénarisées zéro-API (`lockedScene`) figent la pièce et l'intention AVANT que le
  modèle ne parle** — la temporalité de la mise en scène (déplacement puis réplique, jamais
  l'inverse) est une règle de séquencement, pas seulement de contenu (cf. Article 2.3 de
  `principes.md`).
- **Deux couches de priorité, pas une seule** : `lib/turn.ts` (`planTurn()`) calcule un premier
  `requiredIntent`/`intent`, mais `app/api/lia/route.ts` réévalue ensuite sa PROPRE famille de
  scènes ponctuelles avant révélation (`visualBeat`/`followBeat`/`ambientBeat`/`recapBeat`/
  `personalQuestion`/pièges du dossier/`softnessBeat`) et écrase tout ce que `lib/turn.ts` avait
  décidé si l'une d'elles est active. Un mécanisme qui se croit « prioritaire sur tout » en ne
  regardant que `lib/turn.ts` (comme `investigationOverdue`, section 3) doit donc aussi être vérifié
  contre cette seconde couche. C'est exactement en le faisant que l'interaction avec `recapBeat` a
  été trouvée le 2026-09-19 : `recapBeat` pouvait encore s'interposer un tour même pendant
  `investigationOverdue`, contribuant (avec le debrief à 2 tours) au dépassement réel du plafond
  garanti observé en simulation (round 46 au lieu du round ~33 documenté). Corrigé le même jour en
  ajoutant `story.round<20` à la condition de `recapBeat` — `investigationOverdue` est désormais
  RÉELLEMENT absolu sur cette fenêtre, la seconde couche ne le contredit plus une fois le round 20
  atteint. Ce cas reste le patron à suivre : toujours vérifier les DEUX couches avant d'annoncer
  qu'un mécanisme est réellement absolu, et corriger la couche en trop plutôt que de se contenter de
  documenter l'écart.
- **Un mécanisme à durée réelle qui expire est toujours détecté et commenté au tour suivant**,
  jamais un retour silencieux à la normale (sang-froid, mute, caméra masquée) — la détection se
  fait par comparaison d'horodatage au tout début du tour, quel que soit le mode.
- **Les seuils mélangés par session (`seedPick`) sont fixés une fois pour toute la session**, à la
  création du `seed` — jamais retirés au tirage une seconde fois en cours de partie.

## 7. Checklist de cohérence temporelle pour tout nouveau changement

Avant de committer un nouveau seuil ou une nouvelle durée, se poser ces questions (Article 15/17
appliqué au temps) :

1. **Quelle horloge ?** Round ou temps réel — jamais ambigu, jamais un chiffre nu sans unité.
2. **Où se situe-t-il dans le tableau de la section 3 ?** Un nouveau `round>=X` doit être inséré à
   sa place chronologique et vérifié contre les seuils voisins — chevauche-t-il une fenêtre déjà
   occupée par un autre mécanisme (romance, débrief, dispute) au point de créer une concurrence
   imprévue ?
3. **S'il gate un comportement post-révélation, utilise-t-il `revealed` en entier**, jamais
   `evidence>=5` ou `finalCalled` seuls (section 4) ?
4. **A-t-il un plafond garanti si sa condition de déclenchement dépend du hasard/du dialogue ?**
   (cf. le plafond de l'enquête, section 3, comme patron reproductible pour tout futur mécanisme
   dont l'issue ne devrait jamais rester indéfiniment incertaine.)
5. **Ce nouveau seuil a-t-il été traduit en temps réel approximatif (section 2)** pour vérifier
   qu'il reste cohérent avec l'expérience visée, pas seulement avec la logique interne du code ?
6. **Ce document, `parametres.md` et `principes.md` sont-ils mis à jour le jour même ?**
