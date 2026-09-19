# Points fragiles ouverts

Registre vivant des points identifiés comme fragiles, incertains, ou en attente d'une décision de
conception — pas une liste de bugs actifs (ceux-là se corrigent directement, cf. Article 3 de
CLAUDE.md), mais des zones où une hypothèse n'a pas encore été vérifiée, où une décision reste à
trancher avec l'utilisateur, ou où une fonctionnalité reste sciemment limitée en attendant une
validation plus poussée.

Ce fichier est lu par `scripts/kpi-report.mjs` (famille "performance/robustesse" du tableau de
bord) : le nombre d'entrées sous chaque section ci-dessous est compté tel quel, donc la structure
(une puce `- ` par point, sous les titres `##`) doit rester stable. Une entrée se retire de ce
fichier dès qu'elle est résolue ou tranchée — jamais laissée ici "au cas où" une fois close.

## Points ouverts

- `GEMINI_FALLBACK_MODELS` n'a pas encore reçu la validation qualité intégrale (lecture humaine de
  tous les scénarios `check-spirit.mjs` et `check-profile.mjs` avec ce modèle comme `GEMINI_MODEL`
  effectif) — reste donc réservé au dev/simulation, jamais activé en production (cf. CLAUDE.md,
  section Smart Breaker).
- Le bouton/toggle manuel jour/nuit (éclairage 3D cosmétique) et le cycle jour/nuit automatique
  (fatigue, comportement) sont deux mécanismes volontairement séparés dans le code actuel ;
  l'utilisateur, en répondant au test de compréhension du 2026-09-19, a exprimé une préférence pour
  les fusionner en un seul système cohérent — décision de conception à trancher explicitement avant
  d'y toucher (cf. Article 14 : ne jamais exécuter silencieusement un changement qui contredit un
  choix déjà documenté sans repasser par une confirmation).
- Idée non implémentée : une nuit trop courte devrait laisser une vraie dette de sommeil (sieste
  dans la journée suivante, coucher plus tôt le lendemain soir) — évoquée par l'utilisateur le
  2026-09-19, pas encore conçue ni chiffrée. **Renforcé le même jour par une observation directe**
  (lecture de `lib/simulation.ts`) : la récupération de fatigue en dormant est si rapide (−38/tour
  en chambre) qu'un épisode de sommeil dépasse rarement le plancher minimum garanti de 2 tours,
  bien en-deçà des 9 tours d'une nuit complète — un personnage peut donc se réveiller en pleine nuit
  et rester éveillé (en se refatiguant à ×3) le reste de la nuit, sans qu'aucune règle ne relie
  explicitement durée du sommeil et durée de la nuit. Question posée par l'utilisateur, à trancher
  avec lui avant d'implémenter la dette de sommeil ci-dessus, dont c'est le même sujet.
- Question posée par l'utilisateur, pas encore vérifiée : est-il possible qu'un personnage fasse
  une vraie "nuit blanche" (rester éveillé toute la nuit), et si oui, les conséquences du lendemain
  sont-elles bien calculées (besoin de sieste, etc.) ? Même famille que le point ci-dessus sur la
  dette de sommeil — à investiguer et concevoir ensemble.
- Faut-il généraliser à TOUS les documents de référentiel la séparation blueprint
  générique/instanciation projet, déjà appliquée à l'outil de résilience API et au tableau de bord
  (2026-09-19) ? Question posée explicitement par l'utilisateur, à préciser ensemble avant
  d'agir — pas une décision prise, juste notée pour ne pas la perdre.
- `scripts/check-spirit.mjs` (16 scénarios) n'a pas été relancé depuis les derniers changements de
  `lib/lia.ts` (registre de fatigue jour/nuit, ajouté le 2026-09-19) — l'Article 13 de CLAUDE.md
  demande explicitement de le lancer en priorité après un changement de ce fichier, jamais fait
  depuis. Coûte de vrais appels API (Article 8), à lancer à la main, pas en continu.
- Avant la compaction de cette session, une inquiétude avait été notée sur le recul adaptatif de
  rotation des clés Gemini (`lib/gemini-keys.ts`) : risque de sur-pénaliser un 429 transitoire
  comme s'il s'agissait d'un vrai épuisement de quota journalier. Le recul exponentiel avec reset
  au premier succès (déjà implémenté) semble répondre à cette inquiétude, mais ce lien n'a jamais
  été explicitement reconfirmé avec l'utilisateur — à vérifier avec lui plutôt que supposer réglé.
- **Nouveau chantier convenu le 2026-09-19, à faire lors de la prochaine simulation complète**
  (demande explicite de l'utilisateur) : créer `docs/referentiel/regles-de-l-espace.md`, miroir de
  `regles-du-temps.md`, rassemblant pour la première fois dans un seul document les mécanismes
  d'espace déjà existants mais jamais documentés ensemble (`lib/house.ts` : coordonnées des pièces,
  murs/meubles, `blocked()`, calcul d'itinéraire `pathBetween`, points d'ancrage par pièce
  `roomAnchors`, sélection de destination `destinationAnchor`). Décisions déjà actées : un seul
  document, pas de séparation blueprint/instanciation (ce système est propre à cette maison, pas un
  moteur générique séparable, même raisonnement que pour "règles du temps") ; portée limitée à la
  LOGIQUE (où sont les pièces, comment une destination est choisie, comment l'itinéraire est
  calculé) — jamais le rendu visuel actuel (vitesse d'animation, caméra), qui attend la refonte
  graphique pour ne pas documenter quelque chose qui va bientôt changer. Objectif silencieux :
  anticiper la refonte graphique à venir. Une fois ce document construit, l'utiliser pour vérifier
  dans le prochain transcript ce que l'utilisateur ne peut pas voir lui-même en se concentrant sur
  la conversation (déplacements, gestion de l'espace) — vérification générale, aucun souci précis
  identifié pour l'instant. Voir aussi `docs/referentiel/tableau-de-bord.md` : un signal "espace"
  (répartition des pièces visitées, échecs/redirections de déplacement) est candidat pour le
  chantier 2 du tableau de bord ; un KPI "temps" séparé a été jugé redondant avec la famille
  "Rejouabilité/rythme" déjà prévue.
