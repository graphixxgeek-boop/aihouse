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
- Seuil de `genuineRespectStreak` jugé possiblement trop strict par l'utilisateur (choix "Assouplir
  le seuil" lors du calibrage du 2026-09-19) — pas encore investigué ni modifié.
- Écart d'appréciation observé entre deux simulations complètes (21/18 dans full_sim7 contre 42/44
  dans full_sim5, après une séquence d'hostilité comparable) — cause exacte non confirmée entre
  deux hypothèses (dossier incomplet dans full_sim7 vs recalibrage antérieur des poids
  d'appréciation) ; investigation validée par l'utilisateur, pas encore menée.
- Le bouton/toggle manuel jour/nuit (éclairage 3D cosmétique) et le cycle jour/nuit automatique
  (fatigue, comportement) sont deux mécanismes volontairement séparés dans le code actuel ;
  l'utilisateur, en répondant au test de compréhension du 2026-09-19, a exprimé une préférence pour
  les fusionner en un seul système cohérent — décision de conception à trancher explicitement avant
  d'y toucher (cf. Article 14 : ne jamais exécuter silencieusement un changement qui contredit un
  choix déjà documenté sans repasser par une confirmation).
- Idée non implémentée : une nuit trop courte devrait laisser une vraie dette de sommeil (sieste
  dans la journée suivante, coucher plus tôt le lendemain soir) — évoquée par l'utilisateur le
  2026-09-19, pas encore conçue ni chiffrée.
- Faut-il généraliser à TOUS les documents de référentiel la séparation blueprint
  générique/instanciation projet, déjà appliquée à l'outil de résilience API et au tableau de bord
  (2026-09-19) ? Question posée explicitement par l'utilisateur, à préciser ensemble avant
  d'agir — pas une décision prise, juste notée pour ne pas la perdre.
