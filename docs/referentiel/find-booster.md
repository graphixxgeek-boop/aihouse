# find-booster — instanciation pour Maison IA vivante

*(2026-09-21. Conçu sous le nom "route-find-booster" pour app/api/lia/route.ts, renommé
"find-booster" le même soir une fois confirmé générique, puis promu Membre de l'équipe après un
usage réel concluant sur 4 fichiers de nature différente en une seule soirée. Principe générique :
`docs/find-booster-blueprint.md`. Code : `scripts/find-booster.mjs`. Registre : `docs/find-booster/`.)*

## Rôle exact

Un Membre de l'équipe (Outillage de travail), utilisable sur (presque) tout fichier du dépôt —
statut confirmé après avoir servi, en une seule soirée, 4 fichiers de nature complètement
différente : `app/api/lia/route.ts` (code, fonctions nommées), `scripts/check-house.mjs` (code,
blocs de test anonymes), `docs/regles-de-travail.md` (documentation, titres Markdown), et
`lib/reference.ts` (données, tableau d'entrées titrées).

## Les quatre motifs d'extraction réels, `scripts/find-booster.mjs`

- `extractFunctionIndex()` — fonctions nommées top-level + le commentaire qui les précède déjà.
  Motif de `route.ts` une fois découpé, de la plupart de `lib/`.
- `extractBlockIndex()` — blocs anonymes top-level `{ ... }` + le commentaire qui suit l'accolade.
  Motif réel de `scripts/check-house.mjs` : 91 blocs réels comptés en direct, chacun un test isolé
  nommant l'outil qu'il vérifie, jamais une fonction nommée.
- `extractTitledArrayIndex()` — entrées `{title:'...', text:'...'}` d'un tableau. Motif réel de
  `lib/reference.ts` — a révélé un vrai principe le 2026-09-21 (question directe de l'utilisateur) :
  ce fichier ne fait que 132 lignes mais chaque `text` est un pavé de plusieurs centaines de mots
  sur une seule ligne, la preuve concrète qu'un fichier peut être dense sans être long. La
  description est tronquée à 200 caractères (`DESCRIPTION_PREVIEW_LENGTH`) avec un « … » explicite
  — jamais le texte complet, qui rendrait un résultat de recherche imbuvable.
- `extractHeadingIndex()` — titres Markdown `##`/`###`/`####` + le premier paragraphe qui suit.
  Motif réel de `docs/regles-de-travail.md` (1896 lignes, 40 titres réels comptés en direct) et de
  tout `docs/referentiel/*.md`.

`buildIndex(filePath)` route par extension (`.md`/`.mdx` → titres Markdown ; sinon → les trois
motifs de code combinés, structurellement exclusifs par ligne donc jamais de double comptage) et
tague chaque entrée via `tagHarmoniaThemes()` (mots-clés des 8 thèmes de `docs/referentiel/
harmonia.md` dans le nom/la description — un indice de rapprochement, jamais une classification
certaine). `searchByConcept(index, motClé)` répond à une recherche par concept contre nom+description
plutôt qu'un grep littéral.

## recommendFindBooster() — jamais le nombre de lignes seul

Répond directement à une question de l'utilisateur (« est-ce que find-booster pourrait détecter
quand un fichier est trop lourd [...] ou c'est toi qui fait cette analyse systématiquement ? ») :
réutilise `estimateTokens()` de `scripts/smart-conso-token.mjs` verbatim (les deux vivent dans
`scripts/`, aucune frontière lib/scripts à respecter ici) — jamais une seconde formule. Un fichier
est recommandé (`worthwhile: true`) au-delà d'un seuil de poids réel (8000 tokens par défaut, le
palier "élevé" déjà calibré par SMART-CONSO-TOKEN) ET d'au moins 3 entrées indexables — jamais un
déclenchement automatique de l'outil lui-même, une donnée à lire.

**Preuve vivante que le nombre de lignes seul aurait échoué** : `lib/reference.ts` (132 lignes,
poids réel ~55 500 tokens) est recommandé ; `lib/house.ts` (75 lignes, poids réel ~1 500 tokens) ne
l'est pas — deux fichiers courts, un seul verdict correct par ligne, deux verdicts corrects par
poids réel.

## Rappel automatique sharpened — signal nommé, plus un rappel générique (2026-09-21)

Question directe de l'utilisateur : « comment tu t'assures que tu vas utiliser cet outil [...]
comment tu sécurises ça sans pouvoir l'oublier ? ». Réponse honnête : aucune garantie mécanique
n'existe (même limite que SMART-CONSO-TOKEN — rien dans cette architecture ne peut intercepter un
Read/Grep avant qu'il n'ait lieu). Le rappel générique du menu PRESTATIONS ci-dessous s'est révélé
concrètement insuffisant : l'agent a dû admettre en session ne pas avoir utilisé find-booster
jusqu'à ce qu'on le lui demande explicitement. Renforcé (jamais remplacé) par un signal NOMMÉ :
`scripts/hooks/check-last-commit.mjs` appelle désormais `flagFindBoosterCandidates()` (Doc-Report)
à chaque commit et affiche les scripts RÉELS, MAINTENANT, assez lourds pour mériter une recherche
par concept — plus dur à ignorer qu'une ligne parmi vingt dans un menu générique. Reste imparfait
par nature : un rappel qui n'arrive qu'au moment du commit, jamais au moment réel de la lecture.

## Obligation écrite d'usage réel, jamais seulement construit (2026-09-21, demande explicite)

Même limite honnête que SMART-CONSO-TOKEN (« aucun compteur externe des tokens de l'agent
n'existe [...] la seule protection possible est une obligation écrite, non négociable ») : rien ne
peut mécaniquement forcer l'agent à consulter find-booster avant de lire un gros fichier. La règle
est donc écrite ici, non négociable : **avant toute lecture intégrale ou tout grep répété sur un
fichier potentiellement volumineux, consulter d'abord `recommendFindBooster()` puis, si
`worthwhile: true`, utiliser `buildIndex()`/`searchByConcept()` plutôt qu'une lecture à l'aveugle.**
Deux garde-fous réels, déjà en place, renforcent cette obligation sans jamais la remplacer :
- **Rappel automatique déjà existant** : `scripts/le-coordinateur.mjs`'s PRESTATIONS ("Pack
  Boussole") s'affiche déjà après chaque commit (`scripts/hooks/check-last-commit.mjs`) — find-booster
  y apparaît désormais au même titre que les autres outils, un rappel passif mais réel et automatique.
- **Mesure honnête dans le temps** : chaque usage réel doit être journalisé via
  `scripts/tool-usage.mjs::recordToolUsage('find-booster', ...)` — Doc-Report croise déjà cet
  historique avec `toolsNeverUsed()` pour signaler un outil que personne ne sollicite jamais ; un
  find-booster jamais utilisé malgré sa promotion serait donc visible, pas silencieux.

## Optimisations réelles — "part 1" (2026-09-21, demande explicite)

Demande explicite : « optimiser ce qu'il sait déjà faire », avant d'attaquer l'adaptation à des
textes plus complexes (part 2, cf. tâche #180 ci-dessous). Trois trouvailles réelles, faites en
utilisant find-booster sur lui-même (dogfooding) plutôt qu'en devinant :

- **Bug auto-référentiel corrigé** — `extractTitledArrayIndex()` matchait sa PROPRE ligne de
  documentation, qui cite l'exemple littéral `{title:'...', text:'...'}` : contrairement à
  `FUNCTION_RE`/`BLOCK_START_RE` (ancrées en début de ligne, donc jamais déclenchées par un
  commentaire qui commence toujours par `//`), `TITLED_ENTRY_RE` n'est pas ancrée. Reproduit en
  lançant `node scripts/find-booster.mjs scripts/find-booster.mjs`, qui produisait une fausse entrée
  `"..."` avant correction. Corrigé en ignorant toute ligne de commentaire, jamais en modifiant le
  motif lui-même.
- **I/O redondant éliminé dans `recommendFindBooster()`** — lisait le fichier deux fois
  (`readFileSync` pour `estimateTokens()`, puis `buildIndex(filePath)` qui relisait tout) ; une seule
  lecture désormais, réutilisée pour les deux calculs via un nouveau cœur interne
  `buildIndexFromSource(source, filePath)`.
- **Découpage en lignes redondant éliminé dans `buildIndex()`** — chacun des 3 extracteurs JS
  (`extractFunctionIndex`/`extractBlockIndex`/`extractTitledArrayIndex`) découpait la source en
  lignes séparément (3 `.split("\n")` + 3 boucles complètes sur un même fichier). Découpé UNE seule
  fois désormais, réutilisé par les trois — chaque extracteur accepte maintenant indifféremment une
  chaîne ou un tableau déjà découpé, jamais un changement de signature pour les appels existants
  (les tests de `check-house.mjs` continuent de passer une chaîne brute sans modification).

**Ampleur honnête du gain** : le gain de temps de calcul mesuré est modeste (millisecondes, jamais
perceptible pour l'utilisateur) — le vrai bénéfice est la qualité du résultat (plus de fausse entrée
à interpréter) et la propreté du code, pas une accélération spectaculaire. La part 2 (adapter
find-booster à des textes plus denses/moins structurés, comme le cœur de `route.ts`) reste une tâche
distincte et plus substantielle (#180), volontairement non attaquée le même soir.

## 2e passe d'optimisation — "encore un cran" (2026-09-21, demande explicite)

Demande explicite de refaire une passe, en cherchant cette fois un gain qui compte réellement pour
l'agent (« gain de temps pour l'agent »), pas seulement des micro-optimisations CPU. Trouvaille
réelle en relisant `main()` avec un œil neuf : **plusieurs mots-clés passés en ligne de commande
étaient joints en UNE SEULE phrase littérale** (`keywordParts.join(" ")`) plutôt que cherchés
indépendamment — `node scripts/find-booster.mjs fichier.mjs recordAction assess` cherchait la
sous-chaîne exacte "recordaction assess", jamais trouvée même si les deux termes existent
séparément dans le fichier (reproduit en direct contre le vrai `scripts/smart-conso-token.mjs` :
0 résultat avant correction, 5 résultats après). C'est exactement le coût réel identifié pendant
cette même session : investiguer plusieurs concepts liés sur un même fichier (comme réellement fait
ce soir) exigeait un appel CLI séparé par mot-clé, chacun payant le démarrage d'un nouveau process
Node.

**Corrigé** : `searchByConcepts(index, keywords)` (pluriel, nouvelle fonction) combine tous les
mots-clés en OR — une entrée matche si elle contient N'IMPORTE LEQUEL, jamais une phrase collée en
ET. `searchByConcept` (singulier) reste inchangé pour la compatibilité des appels/tests existants.
`main()` utilise désormais la version plurielle : une seule invocation CLI peut désormais chercher
plusieurs concepts d'un coup. Nettoyage associé (DRY, Article 3) : le calcul `${nom} ${description}`
en minuscules était refait séparément dans `tagHarmoniaThemes()` et `searchByConcept()` — factorisé
dans un `entryHaystack()` interne partagé, jamais une 3e copie divergente ajoutée par
`searchByConcepts()`.

**Autres pistes évaluées et écartées cette 2e passe, honnêtement documentées** : fusionner les 3
boucles JS de `buildIndexFromSource()` en une seule (au lieu de 3 boucles séparées sur la même
source déjà découpée une fois) reste possible mais jugé disproportionné — le gain resterait de
l'ordre de la milliseconde même sur le plus gros fichier réel du dépôt (~4800 lignes), pour un
risque de régression réel sur une logique déjà correcte et testée ; jamais fait au nom de
l'optimisation pour l'optimisation.

## Alimentation du catalogue LE-COORDINATEUR — évalué, la bonne réponse n'était pas d'y ajouter le signal live

Demande explicite : « alimentation catalogue coordinateur ». Vérifié avant de construire (Article
19) : le catalogue nommé (`recordCatalog()`/`buildCatalogDelivery()`, `docs/le-coordinateur-catalogue/`)
n'archive une nouvelle version QUE quand le contenu STATIQUE de PRESTATIONS change réellement
(anti-doublon délibéré) — y injecter le signal `flagFindBoosterCandidates()`, qui change à chaque
modification de code dans le dépôt, casserait cette discipline anti-doublon et ferait tourner le
catalogue en boucle sans vraie nouveauté à chaque commit. find-booster est déjà "nourri" dans le sens
qui compte pour ce mécanisme : une entrée durable dans PRESTATIONS ("Pack Boussole"). Le signal
VRAIMENT live (quels scripts en ont besoin MAINTENANT) vit à raison ailleurs : le rappel post-commit
sharpened (section suivante), jamais dans le catalogue historisé lui-même.

## Statut sans blueprint de son voisin, route-booster

`scripts/route-booster.mjs` (préparation d'un découpage : points de coupe candidats + indice de
risque lexical) reste lui un outil sans blueprint — décision explicite de l'utilisateur : il ne sert
que rarement (uniquement quand un fichier doit vraiment être découpé), contrairement à find-booster
qui sert quasiment à chaque session. Documenté dans `docs/regles-de-travail.md`.

## Connexion Doc-Report construite — `flagFindBoosterCandidates()` (2026-09-21)

Demande explicite (« améliore aussi la connexion avec Doc-Report [...] pour qu'il soit encore plus
performant »), suite directe de la synergie notée le même soir mais pas encore construite. Réalisée
dans `scripts/doc-report.mjs` : `flagFindBoosterCandidates(registries, recommendImpl)` appelle
`recommendFindBooster()` (jamais un second calcul de poids) pour chaque `scriptPath` réel de
`REGISTRIES` et ne retient que les entrées `worthwhile`, en dédupliquant les `scriptPath` partagés
par plusieurs registres (ex. `scripts/le-coordinateur.mjs`, référencé deux fois) pour ne jamais
signaler le même script en double. Affiché dans le rapport CLI de Doc-Report juste après la section
REGISTRIES. Vérifié en direct contre le vrai dépôt (2026-09-21) : `SMART-CONSO-TOKEN`, `Tableau de
bord / KPI` et `Catalogue LE-COORDINATEUR` franchissent le seuil — trois scripts que l'agent devrait
systématiquement chercher par concept plutôt que lire intégralement, exactement l'obligation déjà
écrite ci-dessus, désormais rendue visible sans dépendre de la seule mémoire de l'agent.

**Évalué et écarté le même soir : une connexion aux JOURNAUX locaux (`LOCAL_JOURNALS`)** — demande
explicite posée par l'utilisateur, vérifiée avant de construire quoi que ce soit (Article 19) : les
journaux sont des données brutes `{path, owner, purpose}`, jamais du contenu navigable par concept
(aucune fonction, aucun bloc commenté, aucun tableau titré, aucun titre Markdown) — confirmé en
lançant `find-booster` lui-même sur `scripts/doc-report.mjs` avec le mot-clé "LOCAL_JOURNALS" :
zéro résultat, la preuve concrète que ce registre-là ne correspond à aucun des quatre motifs réels.
Aucune connexion construite ici, à raison.

## Autres synergies identifiées, pas encore construites (2026-09-21)

- **ALWAYS-NEW-CODE** — son premier vrai passage (tâche #170, la nuit même) a demandé une lecture
  intégrale à l'aveugle de `lib/simulation.ts` avant de raisonner dessus ; `buildIndex()` aurait pu
  fournir cette carte instantanément.
- **SMART-CONSO-TOKEN** — dépendance directe déjà câblée (`estimateTokens()` importé, jamais
  dupliqué), pas une synergie à construire.

## CIRCLE-TASKS et Doc-Report

Entrée `REGISTRIES` dédiée (`scripts/doc-report.mjs`), famille "Outillage de navigation", décision
"texte". Pas d'item CIRCLE-TASKS dédié : find-booster est un outil à la demande (une commande
directe, jamais un scan périodique du dépôt entier) — même raisonnement que check-tasks-details.

## Statut d'intégration

Testé sur 4 fichiers réels différents (`app/api/lia/route.ts`, `scripts/check-house.mjs`,
`docs/regles-de-travail.md`, `lib/reference.ts`), avec des fixtures pour chacun des 4 motifs
d'extraction et pour `recommendFindBooster()`. Entrée PRESTATIONS "Pack Boussole". Registre :
`docs/find-booster/` (dossier + index), vide à la création.

**Usage réel journalisé le 2026-09-21** (question directe de l'utilisateur, « est-ce que tu utilises
désormais find booster ? », honnêtement répondue par la négative avant correction) : deux
sollicitations réelles enregistrées via `tool-usage.mjs` (origine spontanée puis demandée), toutes
deux avec trouvaille confirmée — la première ayant permis la découverte du bug auto-référentiel
documenté ci-dessus.
