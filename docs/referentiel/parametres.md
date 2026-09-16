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
| Bonus d'activité commune (`sharedBonus`) | 2 | 4 |

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
Noé : curiosité 68, tension 90, confiance 20, aisance 48, attirance 32.

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
- Bonus supplémentaire pour Noé qui rattrape Lia : jusqu'à +6 points si son attirance < 75 et
  celle de Lia ≥ 5, sans refus ni insistance récents.

## Gestes et consentement (`lib/turn.ts`, `app/api/lia/route.ts`, `lib/drama.ts`)

- Noé peut proposer un geste à partir de 80 % de sa propre attirance, après au moins 12 tours,
  hors observation/débrief/sommeil/besoin urgent.
- `dramaRules.proposalStress` : première proposition → +18 stress pour Noé, +14 pour Lia.
- `dramaRules.rejection` : un refus réduit l'attirance de Noé de 3, augmente sa faim de 6 et sa
  fatigue de 5.
- `dramaRules.pressureStress` : +16 stress pour Lia en cas d'insistance excessive.
- Seuil d'insistance (`overProposing`) : 2 propositions de Noé sur les 6 derniers tours.
- 3 rapprochements en moins de 18 tours → Lia : −5 attirance, −2 attachement, demande de
  distance, +3 tours de débrief.
- `dramaRules.debriefTurns` : 2 tours de débrief après un événement marquant.

## Enquête (`lib/story.ts`)

- 4 indices canoniques + 1 dossier final (5 preuves déclenchent la révélation).
- Ordre de découverte mélangé par nouvelle arrivée (`story.order`, permutation de [0,1,2,3]).
- Un indice n'est gagné qu'à partir du tour 3, et seulement au tour multiple de 3 (ou après une
  étude complète de 2 tours, ou avec l'aide d'un rêve à partir du 2ᵉ rêve un tour sur trois).
- Observations générales (murs trop réguliers, absence de paysage...) : une par tour éligible à
  partir du tour 2, dans un ordre fixe, jamais deux fois la même.
- Questions d'âge : pas avant le tour 12 ET un premier repas partagé.

## Sommeil (`lib/life.ts`, `app/api/lia/route.ts`)

- `isSleeping` reste vrai tant que la fatigue > 12 OU que moins de 2 tours de sommeil ont eu lieu
  (`sleepTurns`, plafonné à 2).
- Un tour de sommeil pur ne consomme aucun appel API.

## Rejouabilité (`lib/story.ts`, `lib/drama.ts`)

- 4 « atmosphères » possibles par nouvelle arrivée (`atmospheres.length`), qui pilotent aussi les
  souvenirs flous et l'angle narratif ; le prochain variant évite de reprendre le précédent.
- `coldOpening` : 4 variantes d'ouverture, choisies par `story.variant`.
- `seedPick` (`lib/story.ts`) : sélection stable par session pour tous les moments scénarisés
  (finale, bilan d'enquête, apparence, découvertes, motifs de déplacement, reproches du canapé) —
  hachage polynomial (base 31) de `seed + "::" + label`, pour que deux libellés différents sur la
  même session ne retombent pas systématiquement sur le même indice.
- Chaque moment scénarisé dispose aujourd'hui de 2 à 4 formulations distinctes — pas plus. Sur un
  grand nombre de sessions, une coïncidence reste possible (voir Article 10 de `CLAUDE.md`).
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

## Timing visuel (`lib/visual-events.ts`, `lib/stock.ts`)

- Durées d'animation : provisions 3800 ms (dont régénération 2000 ms), enceinte 2200 ms,
  changement tv 1500 ms.
- `stockSurprise` (réaction à la régénération des provisions) : courbe dégressive de curiosité
  +9, +6, +4, +2, +1 puis 0 selon le nombre d'expositions déjà vécues par le personnage.

## Réseau, verrou et limites techniques (`app/api/lia/route.ts`)

- Requête entrante limitée à 12 000 octets, message humain à 2 000 caractères.
- Verrou mondial (`world_lock`) : bail de 90 000 ms (90 s) par tour engagé.
- Tour automatique (`autonomous`) : limité à un déclenchement toutes les 85 000 ms (85 s).
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
