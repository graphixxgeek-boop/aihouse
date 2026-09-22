# Smart Breaker — historique complet (extrait de CLAUDE.md le 2026-09-20)

*(Ce document conserve, mot pour mot, le récit complet que CLAUDE.md portait jusqu'au 2026-09-20
sur l'outil de résilience API surnommé « Smart Breaker » — dates, citations de l'utilisateur,
détail des trois évolutions du 2026-09-18/19, tests précis. CLAUDE.md ne garde plus que les RÈGLES
opérationnelles à suivre (cf. section « Blocage de quota Gemini — Smart Breaker » de CLAUDE.md),
avec un renvoi ici pour le récit complet. Rien n'est perdu, seulement déplacé — Article 7/13 :
réduire le poids relu à chaque message sans jamais perdre une information réelle.)*

**Blocage de quota Gemini — diagnostic et repli, outil surnommé « Smart Breaker ».** *(Nom d'usage
donné le 2026-09-19 à la demande explicite de l'utilisateur, pour le plaisir — désigne l'ensemble
`scripts/check-gemini-quota.mjs` + `scripts/gemini-key-health.mjs` + `scripts/api-providers.mjs` +
`lib/gemini-keys.ts` décrits ci-dessous ; les fichiers gardent leurs noms techniques actuels,
inchangés pour ne courir aucun risque de casser leurs références croisées — cf.
`docs/outil-resilience-api.md` pour le blueprint complet sous ce nom.)* *(2026-09-18, ~18h07 UTC : premier blocage à ce
niveau critique rencontré sur ce projet — une simulation intégrale lancée en arrière-plan est
restée bloquée plus de 20 tentatives consécutives sur une étape du dossier retourné, HTTP 429
systématique. Section consolidée le même jour à partir de six ajouts dispersés au fil de la
session, pour éliminer la redondance — Article 6/7.)* Cause : volume cumulé de vrais appels Gemini
déjà élevé ce jour-là (vérifications en direct, plusieurs relances de serveur, plusieurs
simulations) sur une seule session de travail. Diagnostic confirmé en reproduisant la requête
exacte de l'application hors du serveur (mêmes headers, même corps) : le quota gratuit Gemini est
**journalier et PAR MODÈLE** (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`, 500
requêtes/jour pour `gemini-flash-lite-latest`, alias `gemini-3.5-flash-lite`), jamais global au
projet ni à la clé API seule — et le `retryDelay: "30s"` renvoyé par Google dans l'erreur 429 est
trompeur pour ce type d'épuisement : il ne redevient pas disponible après 30 secondes, ce qui
explique pourquoi la boucle de réessai déjà existante de l'application (plafonnée à 30s de
backoff) échouait indéfiniment sans jamais réussir.

Outils et mécanismes construits ce jour, tous les deux seuls points d'appel réseau direct à Gemini
concernés (`lib/lia.ts::think()` et `app/api/lia/route.ts::generateDossierFragment()`) :

- **`scripts/check-gemini-quota.mjs`** — sonde une liste de modèles candidats avec un appel
  minimal réel et rapporte lesquels répondent effectivement MAINTENANT, plutôt qu'à l'aveugle ;
  suggère une ligne `GEMINI_FALLBACK_MODELS=...` mais n'écrit jamais lui-même dans `.dev.vars`
  (aucun changement de configuration sans geste explicite). Coûte quelques appels négligeables à
  chaque exécution (Article 8) : à lancer à la demande pour diagnostiquer, pas en continu.
  **Diagnostic renforcé (2026-09-19, demande explicite : « veille à ce que le diagnostic qualité
  soit bien poussé au maximum »)** : en plus de la sonde légère ci-dessus, une sonde "lourde" (taille
  comparable à un vrai tour de jeu — `systemInstruction` + sortie JSON structurée, jamais le
  contenu réel) s'exécute sur le modèle principal, pour détecter l'écart déjà rencontré en
  simulation réelle où une sonde légère répond "OK" alors que la vraie charge de l'application
  échoue sur la même clé/modèle au même instant. Une réponse HTTP 200 sans contenu exploitable
  (filtre de sécurité, coupure prématurée) est signalée distinctement ("OK_VIDE"), jamais confondue
  avec un vrai succès. Le `retryDelay` de Google sur un 429 est affiché avec son rappel de piège
  (voir plus bas).
  **Principe fondateur de cet outil** *(formulé explicitement par l'utilisateur le 2026-09-18 :
  « je veux que l'outil ait une connaissance fine de la clef API de façon à pouvoir la dominer :
  c'est le principe fondateur de l'outil qui lui permet d'atteindre son objectif : contourner les
  obstacles et blocages posés par la clef API »)* — l'outil ne réagit jamais à l'aveugle à un
  blocage isolé : il accumule une connaissance fine de chaque clé configurée (`.gemini-key-health.json`,
  local, jamais committé, cf. `scripts/gemini-key-health.mjs`) — par modèle, dans le temps, épisode
  par épisode — pour choisir en connaissance de cause plutôt qu'à l'aveugle. Trois évolutions le
  même jour, chacune détaillée avec son gain estimé dans `docs/regles-de-travail.md` (section 7bis,
  nouvelle règle : toute évolution de cet outil se rapporte à l'utilisateur avec un pourcentage
  d'efficacité estimé) : (1) ordonnancement des clés par fiabilité récente plutôt qu'un ordre fixe ;
  (2) correction d'un biais où une sonde secondaire sur un modèle rarement utilisé (`gemini-pro-latest`)
  pouvait faire passer une clé saine pour épuisée (paramètre `asKeySignal`) ; (3) support
  multi-fournisseurs (`scripts/api-providers.mjs`) — une entrée `GEMINI_API_KEY_FALLBACKS` peut
  porter un préfixe `fournisseur:` pour sonder une clé d'un fournisseur non-Gemini (payant ou non),
  strictement pour le diagnostic outillage : aucun câblage n'existe pour qu'un tel fournisseur
  serve de vrai repli en production, ce qui resterait soumis à la même validation qualité intégrale
  que tout changement de modèle (Article 0). L'outil affiche aussi, à chaque exécution, un
  historique curaté des leçons déjà comprises ensemble (`describeKnownLessons()`) — distinct de
  l'expérience automatique, jamais généré par une sonde, mis à jour à la main quand un nouveau
  blocage réel est diagnostiqué.
- **Repli de modèle** — si `GEMINI_FALLBACK_MODELS` (liste séparée par des virgules) est configuré,
  la MÊME requête est rejouée contre le modèle suivant de la liste, uniquement sur 429 ou 503
  (le 503 a rejoint le 429 le même jour : preuve concrète en simulation réelle que Google répond
  parfois 503 plutôt que 429 pour un modèle pourtant confirmé épuisé par sonde directe au même
  instant — même cause, même traitement). Jamais sur 401/403/404/erreur réseau, qu'un autre modèle
  ne résoudrait pas.
- **Repli de clé** — `GEMINI_API_KEY_FALLBACKS` (liste de clés séparées par des virgules) : chaque
  clé essaie tous les modèles avant de passer à la clé suivante, sur 429/503 ; une clé invalide
  (401/403) passe directement à la clé suivante sans gaspiller de tentatives sur ses autres
  modèles. Le nom même du quota Google (`...PerProject...`) confirme qu'il est scopé PAR PROJET :
  deux clés du même projet Google Cloud partagent le même panier de quota (confirmé
  empiriquement — deux clés testées avec le même préfixe se sont épuisées identiquement) ; seule
  une clé d'un projet Google Cloud réellement distinct apporte un quota indépendant.
- **Rotation + disponibilité des clés** *(2026-09-18, remplacé le 2026-09-19 par une vraie rotation
  à l'ajout d'une 3e clé — demande explicite de l'utilisateur : « rotation des clefs pour ne pas
  saturer une clef de demande [...] systeme de rotation, de test de disponibilité »)* — un module
  partagé (`lib/gemini-keys.ts`, utilisé par `lib/lia.ts::think()` ET
  `route.ts::generateDossierFragment()`, jamais deux états séparés) fait tourner un round-robin
  parmi les clés actuellement saines à chaque appel, au lieu de l'ancienne mémoire "collante"
  (`lastGoodKeyIndex`) qui laissait UNE SEULE clé encaisser tout le trafic tant qu'elle répondait.
  Une clé qui vient d'échouer est mise en cooldown (429 → base 15 min, probablement un quota épuisé
  pour un moment ; 503 → base 60 s, souvent transitoire ; 401/403 → définitif pour la durée du
  process) et sautée par la rotation tant que ce délai n'est pas écoulé, jamais un appel de sonde
  séparé (zéro coût API additionnel, Article 8) — ce suivi est tiré directement du trafic réel.
  **Recul exponentiel (2026-09-19, précisé lors d'un audit documentaire)** : un échec répété sur la
  même clé double le délai à chaque fois plutôt que de rester fixe (plafond 4h pour 429, 20 min pour
  503), remis instantanément à la base au premier succès suivant — jamais besoin de réglage manuel
  pour distinguer un blocage bref d'un vrai épuisement journalier qui s'entête. Une clé en
  cooldown n'est jamais RETIRÉE de la rotation, seulement reléguée en dernier recours si toutes le
  sont. Mémoire "best-effort" au niveau du process/isolate, comme avant : jamais une garantie
  inter-redémarrage, jamais écrite en base. Portée volontairement limitée aux CLÉS (strictement
  interchangeables) : jamais aux MODÈLES, qui restent toujours tentés dans l'ordre configuré, le
  principal en premier (Article 0 — un modèle de repli n'est pas équivalent en qualité). Le second
  cerveau d'un même tour bénéficie immédiatement de la découverte du premier au sein du même tour
  (cooldown partagé) — plus efficace que prévu initialement, jamais un bug. Testé
  (`scripts/check-house.mjs`) : avec 3 clés simultanément saines, 4 appels indépendants utilisent
  bien les 3, jamais une seule qui absorbe tout le trafic.

**Trafic réel persisté dans l'historique partagé** *(2026-09-20, tâche #88 — écart réel trouvé et
comblé : `.gemini-key-health.json` n'était alimenté que par les sondages manuels de diagnostic,
jamais par le vrai trafic d'une simulation ou d'une vraie session)* — `recordKeyStatus()` journalise
désormais aussi, en mémoire process, le MODÈLE essayé pour chaque tentative réelle, sous une
empreinte de clé jamais la clé en clair (`fingerprint()`, identique à `keyLabel()` du diagnostic).
Toujours **aucune écriture disque** dans `lib/gemini-keys.ts`/`route.ts` eux-mêmes (Cloudflare
Workers n'a pas de système de fichiers persistant, contrainte technique déjà actée) : ce trafic est
exposé via l'API admin déjà protégée, puis persisté après coup par `kpi-report.mjs` (étape 4 de
l'Article 18, avant redémarrage du serveur) en réutilisant directement `recordOutcomeByLabel()` de
`scripts/gemini-key-health.mjs` — jamais un second mécanisme d'écriture de ce fichier.

**Inactif par défaut** dans tous les cas : listes absentes ou vides reproduisent exactement le
comportement antérieur, zéro appel supplémentaire, zéro changement de modèle ou de clé silencieux
sur le jeu réel — une bascule de modèle peut influer sur la qualité/le ton des réponses (Article 0),
donc elle reste une décision volontaire, jamais un défaut de production. Testé dans
`scripts/check-house.mjs` (derniers blocs du fichier, isolés pour ne jamais décaler le compteur
partagé de `crypto.randomUUID()` dont dépendent des tests antérieurs) : chaque repli reste
totalement inerte sans configuration, et récupère bien un tour bloqué une fois configuré, pour les
deux cerveaux indépendants (Article 8).

**Portée production, pas seulement développement.** Ces mécanismes sont câblés dans les deux seuls
points d'appel réseau réels de l'application, pas un chemin de simulation séparé — un vrai
visiteur, une simulation, ou `check-spirit.mjs`/`check-profile.mjs` en bénéficient de la même
façon. À la mise en ligne (déploiement `wrangler` sur Cloudflare Workers), `GEMINI_FALLBACK_MODELS`
et `GEMINI_API_KEY_FALLBACKS` sont des bindings d'environnement au même titre que `GEMINI_API_KEY`
déjà utilisé en production, configurables via `wrangler secret put` ou le dashboard Cloudflare,
sans changement de code. `scripts/check-gemini-quota.mjs` reste aussi pertinent après le
lancement : le quota Google est lié au projet/à la clé, pas à l'environnement dev/prod.

**Condition stricte avant toute activation de `GEMINI_FALLBACK_MODELS` en production** *(décidé
par l'utilisateur le 2026-09-18 : le risque réel n'est pas nul — un modèle de repli suit le même
prompt mais rien ne garantit qu'il respecte l'esprit des personnages avec la même fidélité que le
modèle principal, jamais testé sur ce prompt précis ; renforcé le même jour : « je ne veux pas
mettre l'Article 0 en péril, l'utilisateur ne doit rien détecter »)* — `GEMINI_API_KEY_FALLBACKS`
n'est pas concerné par cette condition, puisqu'il ne change jamais le modèle donc jamais la
qualité :
- **Consulter Smart Conso API avant de lancer cette validation** (`node scripts/smart-conso-api.mjs
  check-spirit --confirm`, cf. Article 22) — cette validation multiplie le coût réel par le nombre de
  modèles candidats, jamais une exception au principe général.
- Validation qualité **intégrale**, jamais un échantillonnage : lire TOUTES les réponses de
  `scripts/check-spirit.mjs` et TOUS les profils de `scripts/check-profile.mjs` pour CHAQUE modèle
  candidat, avec ce modèle comme `GEMINI_MODEL` effectif.
- **Refaite entièrement** à chaque changement de la liste de modèles de repli ET à chaque
  modification substantielle du prompt de `lib/lia.ts` — un modèle validé sur un prompt passé
  n'est pas validé sur un prompt qui a changé depuis.
- **Limite honnête, à ne jamais masquer** : aucun test automatique ne peut PROUVER l'absence de
  toute dérive détectable — ces deux scripts ne détectent que les dérives les plus grossières
  (Article 13). La vraie garantie reste la lecture humaine avant activation.
- **Portes de sortie déjà en place, à ne jamais retirer, qui protègent l'expérience quel que soit
  le modèle ou la clé qui répond** : `groundTruncation()`/`groundRegister()` (`lib/dialogue.ts`)
  s'appliquent à CHAQUE réplique et pensée en aval, indépendamment du producteur. La validation
  stricte du schéma JSON (`decisionSchema.parse`, `lib/lia.ts`) rejette tout tour mal formé. Une
  exception réseau ne tente JAMAIS le repli (`catch` immédiat) : une panne réseau touche
  l'hébergeur entier, pas un modèle en particulier.
- **Interrupteur d'urgence** : désactiver un repli en production ne demande aucun changement de
  code, juste retirer la valeur du secret Cloudflare concerné — réversible en un geste.
- **Ce qui n'est actuellement PAS un risque réel** : `GEMINI_FALLBACK_MODELS` et
  `GEMINI_API_KEY_FALLBACKS` ne sont configurés que dans `.dev.vars` (jamais commité, jamais en
  production) — aucun vrai visiteur n'a jamais reçu de réponse d'un modèle/clé de repli à ce jour.
  Tant que la validation ci-dessus n'a pas été faite pour `gemini-flash-latest`/
  `gemini-3-flash-preview` (les deux seuls candidats identifiés à ce jour), `GEMINI_FALLBACK_MODELS`
  reste réservé au dev/simulation.

**Discrétion demandée par l'utilisateur (2026-09-18) : « ça ne regarde que nous », « je veux que
seule une IA puisse comprendre cette partie ».** Limite honnête actée avec l'utilisateur : le code
fonctionnel (`lib/lia.ts`, `route.ts`, `scripts/check-gemini-quota.mjs`) doit rester en clair pour
fonctionner — n'importe qui le lisant verra immédiatement qu'il s'agit de Gemini avec un mécanisme
de repli, rien ne peut cacher ça sans casser le code. Une tentative d'encoder cette section
elle-même (base64) a été refusée par le classificateur de sécurité automatique de l'environnement
au moment du commit (motif : un gros bloc de texte volontairement illisible dans un fichier
d'instructions ressemble structurellement à des instructions cachées) — abandonnée sur décision de
l'utilisateur, jamais retentée sous une autre forme d'encodage sans nouvelle demande explicite. La
discrétion réellement appliquée : `lib/reference.ts` (référentiel affiché en jeu, panneau Admin —
la seule surface que l'application rend visiblement à un tiers) ne décrit ce chantier que par une
phrase générique, sans nom de modèle, chiffre de quota ni explication du mécanisme.

**Procédure à suivre dès qu'une simulation (étape 1 du protocole ci-dessus) reste bloquée en HTTP
429/503 répété :** (0) consulter Smart Conso API (`node scripts/smart-conso-api.mjs diagnostic
--confirm`, cf. Article 22) — `check-gemini-quota.mjs` sonde plusieurs modèles × plusieurs clés en
quelques secondes, c'est bien une action coûteuse au sens de cet Article, jamais une exception parce
que c'est un diagnostic plutôt qu'une simulation ; (1) `node scripts/check-gemini-quota.mjs` pour
identifier les modèles réellement disponibles à cet instant ; (2) reporter la ligne suggérée dans
`.dev.vars`
(`GEMINI_FALLBACK_MODELS=modèle1,modèle2`) ; (3) si un second projet Google est disponible, ajouter
sa clé à `GEMINI_API_KEY_FALLBACKS` — vérifier D'ABORD qu'il s'agit bien d'un projet distinct, pas
une seconde clé du même projet (sonder avec `check-gemini-quota.mjs` en forçant `GEMINI_API_KEY`
sur cette nouvelle clé) ; (4) redémarrer le serveur de développement pour que `.dev.vars` soit
effectivement chargé (confirmé empiriquement : une variable d'environnement shell seule n'est PAS
prise en compte par le runtime Cloudflare Workers en mode dev) — en vérifiant qu'aucun processus
`workerd` orphelin ne survit à un `pkill` précédent (nom de processus différent de `vinext dev`/
`node scripts/run-framework`, peut garder le port occupé) ; (5) relancer ou laisser reprendre la
simulation.


---

## Règles opérationnelles complètes, extraites de CLAUDE.md le 2026-09-22

*(Ces 118 lignes vivaient dans la charte, rechargées à CHAQUE message, alors qu elles ne servent
qu en cas de panne réelle de l API — quelques fois par mois au plus. Décision explicite de
l utilisateur. Rien n est supprimé ni résumé : texte intégral. La charte garde la PROCÉDURE
D URGENCE en 5 étapes, celle qu il faut avoir sous les yeux le jour où ça bloque, plus un renvoi
vers ce document pour tout le reste.)*

**Blocage de quota Gemini — diagnostic et repli, outil surnommé « Smart Breaker ».** Regroupe
`scripts/check-gemini-quota.mjs` + `scripts/gemini-key-health.mjs` + `scripts/api-providers.mjs` +
`lib/gemini-keys.ts` (noms techniques inchangés). Blueprint générique : `docs/outil-resilience-api.md`.
Récit complet du diagnostic d'origine (premier blocage, reproduction de la requête exacte,
historique des évolutions de l'outil) : `docs/referentiel/smart-breaker-historique.md` — cette
charte garde ici les règles opérationnelles, pas leur genèse (Article 6/13).

Fait établi : le quota gratuit Gemini est **journalier, PAR MODÈLE et PAR PROJET Google Cloud**
(`GenerateRequestsPerDayPerProjectPerModel-FreeTier`), jamais global au projet ni à la clé seule.
Le `retryDelay` renvoyé par Google dans un 429 (souvent "30s") est trompeur pour ce type
d'épuisement : il ne redevient pas disponible après ce délai, il se renouvelle le lendemain.

Câblé dans les deux seuls points d'appel réseau réels à Gemini (`lib/lia.ts::think()` et
`app/api/lia/route.ts::generateDossierFragment()`), en production comme en dev/simulation :

- **`scripts/check-gemini-quota.mjs`** — sonde plusieurs modèles candidats avec un appel minimal
  réel (jamais à l'aveugle) et suggère une ligne `GEMINI_FALLBACK_MODELS=...` sans jamais l'écrire
  lui-même dans `.dev.vars`. Sonde aussi "lourde" (taille comparable à un vrai tour de jeu) sur le
  modèle principal, pour détecter l'écart où une sonde légère répond "OK" alors que la vraie charge
  échoue au même instant sur la même clé/modèle (réponse HTTP 200 sans contenu exploitable signalée
  "OK_VIDE", jamais confondue avec un vrai succès). Principe fondateur de l'outil : accumuler une
  connaissance fine de chaque clé configurée (`.gemini-key-health.json`, local, jamais committé) —
  par modèle, dans le temps, épisode par épisode — pour choisir en connaissance de cause plutôt qu'à
  l'aveugle, jamais réagir à l'aveugle à un blocage isolé. Support multi-fournisseurs
  (`scripts/api-providers.mjs`) : strictement pour le diagnostic outillage, jamais câblé comme vrai
  repli de production (resterait soumis à la même validation qualité intégrale que tout changement
  de modèle, Article 0). Affiche à chaque exécution `describeKnownLessons()` — historique curaté à
  la main, distinct de l'expérience automatique, mis à jour seulement après un nouveau blocage réel
  diagnostiqué et compris.
- **Repli de modèle** — si `GEMINI_FALLBACK_MODELS` (liste séparée par virgules) est configuré, la
  même requête est rejouée contre le modèle suivant, uniquement sur 429 ou 503 (Google répond
  parfois 503 plutôt que 429 pour un modèle pourtant confirmé épuisé par sonde directe au même
  instant — même cause, même traitement). Jamais sur 401/403/404/erreur réseau, qu'un autre modèle
  ne résoudrait pas.
- **Repli de clé** — `GEMINI_API_KEY_FALLBACKS` : chaque clé essaie tous ses modèles avant de passer
  à la clé suivante, sur 429/503 ; une clé invalide (401/403) passe directement à la suivante sans
  gaspiller de tentatives sur ses autres modèles. Deux clés du même projet Google Cloud partagent le
  même panier de quota (confirmé empiriquement) — seule une clé d'un projet distinct apporte un
  quota indépendant.
- **Rotation + disponibilité des clés** — module partagé `lib/gemini-keys.ts` (utilisé par les deux
  cerveaux, jamais deux états séparés) : round-robin parmi les clés actuellement saines à chaque
  appel, plutôt qu'une mémoire "collante" qui laissait une seule clé encaisser tout le trafic tant
  qu'elle répondait. Une clé qui vient d'échouer est mise en cooldown (429 → base 15 min ; 503 →
  base 60 s ; 401/403 → définitif pour la durée du process) et sautée par la rotation tant que ce
  délai n'est pas écoulé, jamais via un appel de sonde séparé (zéro coût API additionnel).
  **Recul exponentiel** : un échec répété sur la même clé double le délai à chaque fois (plafond 4h
  pour 429, 20 min pour 503), remis instantanément à la base au premier succès suivant. Une clé en
  cooldown n'est jamais RETIRÉE de la rotation, seulement reléguée en dernier recours si toutes le
  sont. Mémoire best-effort au niveau du process/isolate : jamais une garantie inter-redémarrage,
  jamais écrite en base. Portée limitée aux CLÉS (strictement interchangeables) : jamais aux
  MODÈLES, qui restent toujours tentés dans l'ordre configuré, le principal en premier (Article 0 —
  un modèle de repli n'est pas équivalent en qualité). Le second cerveau d'un même tour bénéficie
  immédiatement de la découverte du premier au sein du même tour (cooldown partagé).

**Trafic réel persisté dans l'historique partagé.** Chaque tentative réelle journalise, en mémoire
process, le MODÈLE essayé sous une empreinte de clé jamais la clé en clair (`fingerprint()`,
identique à `keyLabel()` du diagnostic). Toujours **aucune écriture disque** dans
`lib/gemini-keys.ts`/`route.ts` eux-mêmes (Cloudflare Workers n'a pas de système de fichiers
persistant) : ce trafic est exposé via l'API admin déjà protégée, puis persisté après coup par
`kpi-report.mjs` (étape 4 de l'Article 18, avant redémarrage du serveur) en réutilisant directement
`recordOutcomeByLabel()` de `scripts/gemini-key-health.mjs` — jamais un second mécanisme d'écriture.

**Inactif par défaut** dans tous les cas : listes absentes ou vides reproduisent exactement le
comportement antérieur, zéro appel supplémentaire, zéro changement de modèle ou de clé silencieux
sur le jeu réel — une bascule de modèle peut influer sur la qualité/le ton des réponses (Article 0),
donc elle reste une décision volontaire, jamais un défaut de production.

**Portée production, pas seulement développement.** Ces mécanismes sont câblés dans les deux seuls
points d'appel réseau réels de l'application, pas un chemin de simulation séparé — un vrai
visiteur, une simulation, ou `check-spirit.mjs`/`check-profile.mjs` en bénéficient de la même
façon. À la mise en ligne (déploiement `wrangler` sur Cloudflare Workers), `GEMINI_FALLBACK_MODELS`
et `GEMINI_API_KEY_FALLBACKS` sont des bindings d'environnement au même titre que `GEMINI_API_KEY`
déjà utilisé en production, configurables via `wrangler secret put` sans changement de code.
`scripts/check-gemini-quota.mjs` reste aussi pertinent après le lancement : le quota Google est lié
au projet/à la clé, pas à l'environnement dev/prod.

**Condition stricte avant toute activation de `GEMINI_FALLBACK_MODELS` en production** (le risque
réel n'est pas nul — un modèle de repli suit le même prompt mais rien ne garantit qu'il respecte
l'esprit des personnages avec la même fidélité que le modèle principal, jamais testé sur ce prompt
précis ; l'utilisateur ne doit rien détecter) — `GEMINI_API_KEY_FALLBACKS` n'est pas concerné par
cette condition, puisqu'il ne change jamais le modèle donc jamais la qualité :
- **Consulter Smart Conso API avant de lancer cette validation** (`node scripts/smart-conso-api.mjs
  check-spirit --confirm`, cf. Article 22) — cette validation multiplie le coût réel par le nombre de
  modèles candidats, jamais une exception au principe général.
- Validation qualité **intégrale**, jamais un échantillonnage : lire TOUTES les réponses de
  `scripts/check-spirit.mjs` et TOUS les profils de `scripts/check-profile.mjs` pour CHAQUE modèle
  candidat, avec ce modèle comme `GEMINI_MODEL` effectif.
- **Refaite entièrement** à chaque changement de la liste de modèles de repli ET à chaque
  modification substantielle du prompt de `lib/lia.ts` — un modèle validé sur un prompt passé
  n'est pas validé sur un prompt qui a changé depuis.
- **Limite honnête, à ne jamais masquer** : aucun test automatique ne peut PROUVER l'absence de
  toute dérive détectable — ces deux scripts ne détectent que les dérives les plus grossières
  (Article 13). La vraie garantie reste la lecture humaine avant activation.
- **Portes de sortie déjà en place, à ne jamais retirer, qui protègent l'expérience quel que soit
  le modèle ou la clé qui répond** : `groundTruncation()`/`groundRegister()` (`lib/dialogue.ts`)
  s'appliquent à CHAQUE réplique et pensée en aval, indépendamment du producteur. La validation
  stricte du schéma JSON (`decisionSchema.parse`, `lib/lia.ts`) rejette tout tour mal formé. Une
  exception réseau ne tente JAMAIS le repli (`catch` immédiat) : une panne réseau touche
  l'hébergeur entier, pas un modèle en particulier.
- **Interrupteur d'urgence** : désactiver un repli en production ne demande aucun changement de
  code, juste retirer la valeur du secret Cloudflare concerné — réversible en un geste.
- **Ce qui n'est actuellement PAS un risque réel** : `GEMINI_FALLBACK_MODELS` et
  `GEMINI_API_KEY_FALLBACKS` ne sont configurés que dans `.dev.vars` (jamais commité, jamais en
  production) — aucun vrai visiteur n'a jamais reçu de réponse d'un modèle/clé de repli à ce jour.
  Tant que la validation ci-dessus n'a pas été faite pour `gemini-flash-latest`/
  `gemini-3-flash-preview` (les deux seuls candidats identifiés à ce jour), `GEMINI_FALLBACK_MODELS`
  reste réservé au dev/simulation.

**Discrétion.** Limite honnête actée avec l'utilisateur : le code fonctionnel (`lib/lia.ts`,
`route.ts`, `scripts/check-gemini-quota.mjs`) doit rester en clair pour fonctionner — n'importe qui
le lisant verra immédiatement qu'il s'agit de Gemini avec un mécanisme de repli, rien ne peut cacher
ça sans casser le code. Une tentative d'encoder cette section elle-même a été refusée par le
classificateur de sécurité automatique de l'environnement — abandonnée, jamais retentée sous une
autre forme d'encodage sans nouvelle demande explicite. La discrétion réellement appliquée :
`lib/reference.ts` (référentiel affiché en jeu, panneau Admin — la seule surface que l'application
rend visiblement à un tiers) ne décrit ce chantier que par une phrase générique, sans nom de modèle,
chiffre de quota ni explication du mécanisme.

