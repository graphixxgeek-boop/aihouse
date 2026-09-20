# INES-official — instanciation pour Maison IA vivante

*(2026-09-21. Principe générique : `docs/ines-official-blueprint.md`. Code : `scripts/ines-official.mjs`.
Registre des métadonnées d'édition : `docs/ines-official/`.)*

## Rôle exact

INES-official est la « secrétaire » qui produit, à la demande ou périodiquement, une édition
consolidée et annotée du dépôt — jamais une réécriture réelle du code (MVP calibré : aplatir +
annoter uniquement).

## Périmètres

`FLATTEN_SCOPES = ["code", "code_et_docs"]` — choisi à chaque édition, jamais figé :
- `code` : `lib/`, `app/`, `scripts/`, `components/` (extensions `.ts`, `.tsx`, `.mjs`, `.js`).
- `code_et_docs` : le périmètre `code` plus `docs/**/*.md`.

`collectSourceFiles(scope)` liste les fichiers réels (walker dédié, whitelist d'extensions et de
racines explicites — jamais une liste noire).

## Annotation

`annotateFile(relativeFilePath)` réutilise `lastTouchDays()` de CLEAN-DIRTY-OLD pour la stagnation
(gratuit, zéro appel API) et accepte en option une carte de couverture AXA-CHECK déjà calculée par
l'appelant (`coverageByFile`) — jamais recalculée ici, un balayage complet à chaque édition serait
disproportionné. **Limite honnête assumée** : ARGUS et HARMONIA restent hors de portée de cette
première version, leurs trouvailles étant des scans en texte libre non indexés par fichier de façon
fiable.

## Édition consolidée

`buildConsolidatedEdition()` assemble : en-tête (version, date, périmètre, nombre de fichiers), le
rapport de synthèse (ci-dessous), table des matières (`buildTableOfContents()` — enrichissement
confirmé "oui maintenant"), puis chaque fichier précédé de son chemin et de son annotation.

## Rapport de synthèse (2026-09-21, demande explicite en cours de construction)

`buildEditionSummary()`/`renderEditionSummary()` : des chiffres RÉELS et STRICTEMENT DESCRIPTIFS
(nombre de fichiers, répartition par extension, ancienneté moyenne/maximale réutilisant
`lastTouchDays()`, taille totale) — jamais un jugement de qualité, qui resterait le rôle
d'ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD. `kpiFromCassandra` est un CROCHET explicite pour la
future section KPI que CASSANDRA-RH doit fournir une fois construite (décision #251 du suivi :
CASSANDRA reprend tout le mandat KPI du site) — `null` tant que CASSANDRA-RH n'existe pas, jamais un
chiffre fabriqué en attendant ; une fois fourni, présenté explicitement comme REPRIS de CASSANDRA-RH,
jamais recalculé par INES-official elle-même (même discipline anti-duplication que
Doc-Report/tool-usage.mjs).

## Économie de dépôt

`recordEdition(scope)` écrit le CORPS complet (potentiellement plusieurs Mo) dans un fichier LOCAL
gitignored (`.ines-official-latest-<scope>.txt`, remplacé à chaque édition, jamais un historique) et
retourne une ligne de métadonnées légère (`buildIndexRow()` : version, date, périmètre, nombre de
fichiers, taille) destinée à `docs/ines-official/index.md` (committé, tient lieu d'historique léger
— enrichissement confirmé "oui maintenant" : datage/versionnage de chaque édition, même esprit que
le catalogue LE-COORDINATEUR). `nextEditionVersion()` lit le prochain numéro directement depuis
l'index existant, jamais un compteur séparé qui pourrait diverger.

## Déclenchement

Proposé PÉRIODIQUEMENT via la Ronde CIRCLE-TASKS (item `ines-official-signal`), jamais réservé à une
demande explicite — calibrage explicite de l'utilisateur, correction d'une première proposition de
l'agent qui la voulait réactive uniquement.

## Statut d'intégration

Agent à part entière (blueprint + instanciation + registre), placement « Membre de l'équipe
occasionnel » (comme HYPER-SCAN-CHECKPOINT/THE-FINAL-JUDGE/ALWAYS-NEW-CODE), jamais « Équipe noyau »
(réservée aux 4 outils toujours déployés de l'Article 20). Menu PRESTATIONS : "Pack Secrétariat".
