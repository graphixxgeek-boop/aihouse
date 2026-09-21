# CASSANDRA-RH — instanciation pour ce projet

Cf. `docs/cassandra-rh-blueprint.md` pour le principe générique. Ce document ne décrit que ce qui
est propre à ce projet. Historique complet des décisions de calibrage (16+ échanges, deux rounds de
questions) : `docs/cassandra-rh-conception.md` — conservé comme récit fondateur, remplacé comme
source de vérité opérationnelle par ce triptyque (`docs/cassandra-rh-blueprint.md` + ce fichier +
`docs/cassandra-rh/`).

## Statut

Agent (`scripts/cassandra-rh.mjs`, tâche #184, noyau fiabilisé le 2026-09-21) — Agent Cadre dans
l'organigramme (`AGENT_CATEGORIES`, `lib-shell.mjs`), au même rang que LE-COORDINATEUR mais avec sa
propre connaissance propre au projet (statut "Agent" plein, jamais "classique").

## Mécanisme

- **Effectif** — `teamRoster()` filtre la table maîtresse (`docs/regles-de-travail.md`) sur les
  lignes de statut "Agent" (les seules éligibles au badge), calcule le slug par le même découpage
  `primaryName` déjà établi ailleurs (avant slugification, jamais le texte entier d'une colonne
  Outil qui porte parfois une précision entre parenthèses), puis résout la catégorie via
  `AGENT_CATEGORIES`. `teamSizeSnapshot()` en tire un constat chiffré honnête par catégorie —
  jamais un jugement "trop"/"pas assez".
- **Badge** — `computeBadgeResults()` appelle `checkAgentOnboarding()` (`le-coordinateur.mjs`) une
  fois par membre du roster, avec le contexte réel produit par `buildRealOnboardingContext()`
  (`check-tasks-details.mjs`, déjà éprouvé en production — jamais une seconde construction de
  contexte). `badgeOversightSummary()` agrège en certifiés/non-certifiés — jamais un second calcul
  de couverture.
- **KPI** — `loadKpiTrend()` lit `docs/referentiel/kpi-historique.csv` (produit par
  `kpi-report.mjs`, jamais recalculé ici) et compare les deux dernières mesures réelles disponibles
  par famille — une cellule vide reste `undefined`, jamais une valeur fabriquée.
- **Outils à retirer ou refondre** — `toolsToReconsider()` combine `toolsNeverUsed()`
  (`tool-usage.mjs`) et `relativeStaleness()` (`clean-dirty-old.mjs`, appliqué aux scripts via
  `AGENT_SCRIPT_FILES` d'`axa-check.mjs`) — jamais un troisième calcul de pertinence inventé.
  Enrichi le 2026-09-21 (3 idées neuves approuvées par l'utilisateur, « OK GO ») de trois éclairages
  supplémentaires, chacun une relecture, jamais un second calcul : (1) un objectif chiffré « en
  dessous » (`objectifs-vs-resultats.mjs::buildObjectifsReport()`, `row.entite` porte déjà le slug)
  renforce un « jamais sollicité » déjà présent, jamais un déclencheur indépendant ; (2)
  `tokenInvestmentVerdict()` relit le dernier verdict déjà enregistré par
  `classifyConsumption()`/`recordAction()` (SMART-CONSO-TOKEN, `.smart-conso-token-history.json`)
  dont le `context` mentionne le slug — une correspondance textuelle honnête, aucune convention
  stricte de nommage n'existant avant ce soir pour relier une action SMART-CONSO-TOKEN à un outil
  précis ; (3) un registre `doc-report.mjs::buildDocReportIndex()` jamais committé (`ageDays`
  indéfini) signale que personne ne consulte jamais la SORTIE de l'outil, distinct de « l'outil
  lui-même jamais lancé ».
- **Recrutement** — squelette à 3 étapes (`cv_provisoire` → `entretien_preliminaire` →
  `proposition`), chaque avancée exigeant une décision explicite (`avancer`/`rejeter`), un dossier
  clos jamais rouvert silencieusement. Aucune vraie recherche web à ce stade — hors périmètre de
  cette première vague, jamais deviné.
- **Personnage fixe** — `CASSANDRA_PERSONA` (directrice RH exigeante mais juste), reproduit mot pour
  mot par l'agent qui narre un rapport, jamais reformulé.

## Bug réel trouvé et corrigé en fiabilisant ce brouillon (2026-09-21)

`teamRoster()` slugifiait le texte ENTIER de la colonne Outil, y compris une précision entre
parenthèses ("CLONE-HUNTER (`scripts/clone-hunter.mjs`)", "memory-audit (anciennement...)"),
produisant un slug jamais présent dans `AGENT_CATEGORIES` — 4 Agents réels (CLONE-HUNTER,
memory-audit, find-booster, objectifs-vs-resultats) affichés à tort comme « catégorie non
répertoriée ». Corrigé avec le même découpage `primaryName` déjà établi ailleurs dans ce paysage —
vérifié en direct : zéro Agent réel non catégorisé après correctif.

## Déclenchement

- **Léger** — `node scripts/cassandra-rh.mjs` (sans argument), signal en une ligne : effectif,
  nombre sans badge, tendance KPI. Destiné à rejoindre chaque Ronde CIRCLE-TASKS.
- **Lourd** — `node scripts/cassandra-rh.mjs rapport`, bilan complet en HTML (via `html-report.mjs`).

## Trous d'équipe — couverture de test fragile (2026-09-21)

Calibrage explicite : « CASSANDRA doit être capable de voir s'il n'y a pas de trous dans
l'organisation [...] elle a accès à tous les outils, tous les rapports qui peuvent lui servir ».
Lecture retenue après clarification : « trous dans l'ÉQUIPE » (jamais dans la structure
documentaire du projet — ce second sens resterait le rôle d'un futur outil séparé, jamais
dupliqué ici). `runAxaCheckCoverage()` relance réellement une instrumentation V8 (même mécanique
exacte qu'`axa-check.mjs::main()`, jamais une seconde façon de la produire) — **uniquement dans le
rapport complet** (`node scripts/cassandra-rh.mjs rapport`), jamais dans le signal léger, qui
resterait sinon coûteux à chaque Ronde. `computeCoverageGaps()` (pure, testable) signale tout
membre en dessous de 100% de couverture ou jamais scanné — un poste dont personne ne peut
garantir qu'il tient la route, un « trou » RH au sens propre.

## Nouveaux visages — Phase 1 (2026-09-21)

Calibrage explicite : « c'est typiquement le role de cassandra de verifier que chaque nouveau
membre est intégré selon le process, avec remise de badge à la fin et message ici dans la
conversation ». `detectNewArrivals()` compare le roster réel à `.cassandra-rh-known-members.json`
(local, jamais committé, même patron que `.badge-ceremony-history.json`) et `narrateNewArrivals()`
nomme chaque membre jamais encore vu — complet ou non, avec ses trous exacts s'il en a. Distinct du
badge mécanique de `checkAgentOnboarding()`/`announceBadgeCeremony()` (`le-coordinateur.mjs`) : ce
bloc répond à « je t'ai vu arriver », le badge répond à « tu es maintenant complet » — les deux
cohabitent sans se dupliquer. Uniquement dans le rapport complet (jamais le signal léger), et
toujours en tête du rapport — c'est le bloc que l'utilisateur veut voir défiler dans la
conversation.

## Reste hors de cette première vague (§8bis/§8ter de `docs/cassandra-rh-conception.md`)

Le Catalogue (rapport principal enrichi, combinaisons d'outils, score composite) et les 3
Stagiaires (Catalogue, Dossier KPI, Recrutement) restent une prochaine vague de construction —
jamais devinés ni anticipés dans ce noyau.

## Registre

`docs/cassandra-rh/index.md` — trouvailles réelles (un écart de badge confirmé, un outil signalé à
retirer et la décision prise) au fil des vrais passages, jamais un journal théorique.
