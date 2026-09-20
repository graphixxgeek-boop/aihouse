# SMART CONSO API — instanciation pour Maison IA vivante

*(Cf. `docs/smart-conso-api-blueprint.md` pour le principe générique. Créé le 2026-09-19, le jour
même d'un vrai épisode d'épuisement total du quota Gemini pendant cette session — cf.
`docs/suivi/` pour le récit complet de cette session.)*

## Fiche d'identité (membre de l'équipe)

*(Ajoutée le 2026-09-20, à la demande explicite de l'utilisateur — même statut que Smart
Breaker/ARGUS/HARMONIA/LE-PLANIFICATEUR : un membre de l'équipe nommé, pas seulement un script
technique parmi d'autres.)*

- **Nom** : Smart Conso API.
- **Rôle en une phrase** : conseillère de rythme — surveille combien de vrais appels API l'agent
  s'apprête à faire et dit si le rythme est sain, tendu, ou déjà trop poussé.
- **Catégorie CASSANDRA-RH (future)** : `scripts` — au même titre que Smart Breaker/ARGUS/HARMONIA,
  notée sur la pertinence de son poste et la qualité de son occupation, jamais un statut à part.
- **Domaine strict** : le rythme des appels Gemini que l'AGENT déclenche pendant le travail (jamais
  le jeu réel, gouverné par l'Article 8 seul — frontière explicite, cf. CLAUDE.md Article 22).
- **Arrivée dans l'équipe** : 2026-09-19.
- **Ce qu'elle ne fait jamais** : décider à la place de l'agent ou de l'utilisateur, modifier
  l'architecture de production, court-circuiter l'Article 8.

## Ce qui existe aujourd'hui

- **`scripts/smart-conso-api.mjs`** — le canal de consultation. Usage :
  `node scripts/smart-conso-api.mjs <simulation|check-spirit|diagnostic> [--confirm]`. Sans
  `--confirm`, affiche seulement un avis (jamais d'écriture). Avec `--confirm`, enregistre l'action
  dans le carnet de session local (`.smart-conso-session.json`, jamais committé).
- **Source de données partagée** : `.gemini-key-health.json`, la MÊME que Smart Breaker — jamais
  un second journal (Article 3). Le taux d'épuisement récent (fenêtre de 2h) en est directement
  dérivé.
- **Carnet de session local** : `.smart-conso-session.json` — nature d'information différente de
  l'historique partagé (pas "qu'est-ce qui s'est passé côté API", mais "quelles actions l'agent a
  confirmées, et quand"), jamais committé (comme `.gemini-key-health.json`).
- **`docs/smart-conso-api/`** — dossier des décisions archivées (passages de seuils, évolutions du
  calcul) + `index.md`.

## Toujours consultée avant une action coûteuse (mécanisme central)

Formalisé le 2026-09-19 dans **l'Article 22 de `CLAUDE.md`** (cette exigence existait déjà ici dans
l'instanciation, mais n'était pas encore élevée au rang d'Article de la charte — écart corrigé le
jour même, cf. Article 13). Exigence explicite de l'utilisateur, pas une option : avant de lancer
une simulation complète, un
`check-spirit`, ou tout diagnostic lourd, l'agent exécute `smart-conso-api.mjs` pour l'action
concernée et LIT l'avis avant de décider — jamais une action lancée sans consultation préalable, et
jamais un avis lu puis ignoré silencieusement. Une fois la décision prise, l'action réellement
lancée est confirmée (`--confirm`) pour que le carnet de session reste exact — un avis demandé mais
suivi d'un renoncement ne compte jamais comme une action réelle.

## Seuil dur actuel (en attente de validation explicite)

**`simulation` : 2 lancements confirmés par fenêtre glissante de 6 heures.** Choisi le jour même,
directement inspiré de l'épisode réel qui a motivé la création de l'outil (plusieurs simulations
complètes lancées à la suite dans la même session ont précédé l'épuisement total du quota).
Limite honnête assumée : faute d'une notion fiable de "session" pour un agent qui peut reprendre le
même travail sur plusieurs heures, la fenêtre de 6h est une approximation, pas une vraie détection
de session — à ajuster si l'expérience montre qu'elle est trop ou trop peu généreuse. **Ce seuil
reste à valider explicitement avec l'utilisateur avant d'être considéré comme réellement "dur"**
(cf. blueprint, "validation humaine explicite" — aucun seuil ne devient dur sur la seule décision de
l'agent qui l'a codé).

## Avertissement souple actuel

Si le taux d'épuisement des tentatives réelles sur les 2 dernières heures (dans
`.gemini-key-health.json`) dépasse 50 %, un avertissement souple et négociable s'affiche —
n'empêche jamais l'action, signale seulement une prudence recommandée.

## Frontière avec l'Article 8 (cf. CLAUDE.md, section Article 8)

Smart Conso API ne régule jamais que le RYTHME des actions de travail de l'agent (simulations,
diagnostics) — jamais l'architecture de production du jeu, qui reste entièrement gouvernée par
l'Article 8 et protégée par l'Article 0. Dans l'autre sens, son expérience accumulée peut éclairer
une décision future sous l'Article 8 (ex. combien coûte réellement telle catégorie d'action), sans
jamais la trancher à sa place.

## Capacité de scan (2026-09-20)

`node scripts/smart-conso-api.mjs scan` — `scanConsumptionPatterns()` repère des schémas RÉELS dans
l'historique déjà accumulé (jamais le code du jeu lui-même, cf. la frontière avec l'Article 8
ci-dessous) : un taux d'épuisement élevé récent, ou un relancement confirmé dans les 10 minutes
suivant un épisode d'épuisement réel (le schéma exact qui a fait s'épuiser les modèles de repli en
quelques minutes le 2026-09-18/19). Chaque constat vient avec une piste concrète, jamais une
statistique brute sans suite. Domaine différent de SMART-CONSO-TOKEN (qui scanne des DOCUMENTS pour
leur taille) : ici, toujours le RYTHME des appels déjà faits, jamais la taille d'un texte ou le
contenu d'un prompt.

## Apprentissage et auto-évaluation — pas encore en place

Prématuré à ce stade (outil créé le jour même, zéro historique de conseils donnés) : la phase
d'observation (cf. blueprint) commence maintenant. Revenir ici une fois plusieurs consultations
réelles accumulées pour évaluer si les avis donnés ont effectivement aidé à éviter un blocage.

## KPI

Pas encore raccordé au tableau de bord général — même raisonnement qu'ARGUS/HARMONIA, prématuré
sur un outil qui vient de naître.
