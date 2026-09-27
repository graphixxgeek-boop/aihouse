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


## Genèse — les mots exacts de la demande (déplacés depuis le blueprint le 2026-09-23)

Ce bloc vivait en tête de `docs/smart-conso-api-blueprint.md`, où SAFE-EXPORT le signalait comme une
fuite : un blueprint générique qui nomme le quota Gemini et Smart Breaker n'est pas exportable vers
un autre projet. **Rien n'a été réécrit — la citation est déplacée, mot pour mot.** On ne corrige
pas les mots de quelqu'un dans son dos (même règle que le surnom R/O-Guardian, Article 20bis, et que
les citations du schéma de référence). C'est sa place légitime : le blueprint porte le patron, cette
fiche porte ce qui est propre à *Maison IA vivante*.

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur, juste après un vrai épisode
d'épuisement total du quota Gemini pendant cette même session : « pour l'aider [Smart Breaker] à
éviter cette situation, nous allons créer la petite sœur de Smart Breaker : Smart Conso API : son
rôle, gérer la consommation des API, réguler la consommation des API et l'optimiser, pour que les
API soient disponibles "tout le temps" [...] à l'image d'un conseiller en réduction de la
consommation d'électricité ». Même logique déjà appliquée à `docs/argus-blueprint.md` et
`docs/harmonia-blueprint.md` : ce document décrit le PATRON générique, réutilisable sur un autre
projet appelant une API tierce à quota limité ; l'instanciation propre à *Maison IA vivante* vit
dans `docs/referentiel/smart-conso-api.md`.)*

## Les deux seuils et `assess()` — le mécanisme, en toutes lettres

*(Section ajoutée le 2026-09-23, lot 1 du chantier CLAUDE.md, pour la même raison mécanique que sa
jumelle dans `argus.md` : MOÏSE-TABLES-DE-LOI a refusé de réduire l'Article 22 à un renvoi vers
cette fiche tant qu'elle ne portait ni le mot « seuil souple » ni le nom de la fonction consultée.
Les sections « Seuil dur » et « Avertissement souple » ci-dessus décrivaient chacune SON seuil ; ce
qui manquait était le geste qui les réunit et le nom sous lequel on le demande.)*

**`assess({ actionType, context, history, now, agentIdentity, investment })`
(`scripts/smart-conso-api.mjs`) est le point d'entrée unique**, et « consulter Smart Conso API »
ne veut jamais dire autre chose que l'appeler. Ce n'est pas un détail de vocabulaire : une consigne
qui dit « consulter » sans nommer la fonction se satisfait d'un coup d'œil au quota, ce qui n'est
pas la même chose et ne laisse aucune trace.

**Les deux verdicts, et leur différence d'autorité :**

- **Seuil SOUPLE** — un avertissement. Il reste négociable : l'agent peut passer outre en écrivant
  pourquoi. Il existe pour que la consommation ne dérive pas sans que personne ne s'en aperçoive,
  jamais pour empêcher un travail légitime.
- **Seuil DUR** — non négociable. Il exige une validation humaine explicite avant toute action
  coûteuse. Aucune urgence, aucun « je suis presque fini », aucune instruction antérieure de
  l'utilisateur ne vaut dispense : c'est précisément parce qu'on est pressé qu'on grille un quota.

**La frontière avec l'Article 8, qui est la chose à ne jamais confondre** : cet outil régule le
RYTHME des actions de l'agent pendant le développement. Il ne touche jamais à l'architecture du jeu
en production, et son expérience INFORME l'Article 8 sans jamais le trancher. Un verdict de Smart
Conso API ne peut donc pas servir d'argument pour fusionner les deux cerveaux, baisser la qualité
d'un appel, ou modifier quoi que ce soit que l'Article 0 protège.

---

## La frontière avec l'Article 8, déménagée ici le 2026-09-27 (chantier #208)

**POURQUOI ELLE A QUITTÉ LA CHARTE, et la raison compte autant que le texte** (Article 27) : ces
deux paragraphes ne créent aucune obligation nouvelle — ils expliquent pourquoi deux règles
voisines ne se mélangent jamais. Une explication se lit au moment où le doute survient ; la garder
sous les yeux à chaque message coûtait ~350 tokens pour une question qu'on ne se pose presque
jamais. **Rien n'est perdu : le texte est repris mot pour mot.** L'obligation, elle, reste dans la
charte, à l'Article 8 (que l'utilisateur a explicitement décidé de conserver après avoir vu
qu'aucun outil ne le porte) et à l'Article 22.

**Frontière avec Smart Conso API** — liés en esprit
(les deux visent à ne pas gaspiller les appels API), mais à deux niveaux différents, jamais
fusionnés en un seul mécanisme : cet Article 8 gouverne l'ARCHITECTURE du jeu en production (ce que
le code fait pour un vrai visiteur), tranché une fois pour toutes et protégé par l'Article 0, qui
prime toujours. Smart Conso API (cf. section dédiée plus bas) régule un terrain différent : le
rythme des actions de l'agent PENDANT le travail de développement (simulations lancées,
diagnostics) — jamais l'architecture de production elle-même. Smart Conso API ne peut donc jamais
suggérer de modifier un choix déjà tranché par cet article (comme la séparation des deux cerveaux)
au nom de l'économie : ce serait exactement la dérive que l'Article 0 interdit.

**Dans l'autre sens, en revanche, un bénéfice réel et légitime existe** : l'expérience accumulée par Smart
Conso API (combien coûte réellement une simulation, un diagnostic, à quel rythme le quota se tend)
peut ÉCLAIRER une décision future sous cet article — par exemple juger si une nouvelle
fonctionnalité doit appeler l'API en direct ou générer une réplique localement (Article 10), en
connaissance de cause plutôt qu'à l'aveugle. Sens unique, strictement : Smart Conso API informe,
elle ne tranche jamais — la décision reste toujours gouvernée par l'Article 0, quoi que ses données
suggèrent.

---

## Le texte complet de l'Article 22, déménagé ici le 2026-09-27 (chantier #208)

**Abraham classait cet Article « MODE D'EMPLOI D'OUTIL », c'est-à-dire réductible à un déclencheur et un renvoi vérifié — et l'utilisateur l'avait pressenti** (« A SUPPRIMER : les outils assurent »). La suppression TOTALE, elle, aurait fait disparaître l'obligation de consulter, que rien d'autre ne porte : la charte garde donc le déclencheur et les deux verdicts, cette fiche garde le reste. Une règle de conduite surveillée (`conso-api-consultee`, `angel-of-ia-process`) remplace ce que la prose faisait toute seule.

**Article 22 — Smart Conso API : consultation systématique avant toute action coûteuse.** Avant tout
appel réel à l'API Gemini déclenché par l'agent lui-même pendant une session de travail — jamais le
jeu réel, sous la seule autorité de l'Article 8 — l'agent consulte Smart Conso API
(`scripts/smart-conso-api.mjs::assess()`), jamais après coup. Un verdict "seuil souple" reste
négociable ; un verdict "seuil dur" est non négociable et exige une validation humaine explicite.
Frontière stricte avec l'Article 8 : Smart Conso API ne modifie jamais l'architecture de production
ni ne bascule un modèle/une clé de son propre chef — son expérience INFORME l'Article 8, jamais ne
le court-circuite. Détail complet : `docs/smart-conso-api-blueprint.md` et
`docs/referentiel/smart-conso-api.md`.


