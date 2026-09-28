<!-- Converti depuis AUDIT ARCHITECTURE - notes.docx — copie de travail cherchable.
     L'ORIGINAL .docx reste à côté et fait foi : c'est le fichier tel qu'il l'a déposé.
     Ce fichier-ci est RÉGÉNÉRABLE : toute note écrite à la main y sera perdue. -->

L’audit demandé est maintenant réalisé sur l’intégralité du ZIP fourni, sans modifier le projet source.

Les résultats les plus importants

Le diagnostic est plus précis que précédemment :

1 327 fichiers dans l’archive.

190 fichiers de code analysés.

95 397 lignes de code.

scripts/ représente à lui seul environ 82 490 lignes : c’est donc pratiquement un deuxième système logiciel.

check-house.mjs : 20 342 lignes, 375 Passed:, 6 326 assertions détectées.

596 dépendances locales détectées dans le graphe statique.

Un cycle runtime réel existe dans le réseau des scripts.

Le cycle relationship ↔ world est essentiellement un cycle de types, mais révèle néanmoins une mauvaise direction architecturale.

app/api/lia/route.ts concentre énormément de responsabilités : HTTP + DB + verrou + domaine + Gemini + mutations + orchestration.

lib/world.ts dépend de lib/lia.ts uniquement pour emotionSchema : c’est une dépendance de couche particulièrement révélatrice.

La DB est petite, mais constitue un point de couplage central.

Les tests sont très riches mais concentrés dans un harness custom extrêmement intégré au code.

package.json n'a pas de commande test.

La documentation de check-house est déjà en retard : elle annonce 14 869 lignes/266 blocs alors que le fichier réel contient 20 342 lignes/375 blocs.

Le code admin utilise encore le code statique 1980, et le propre référentiel du projet le classe comme point fragile.

Les registres manuels constituent une dette d'exportabilité importante.

Les contrats de données JSON sont beaucoup plus importants que ne le laisse voir le schéma SQL.

La conclusion centrale

Je ne considère plus le projet comme un « monolithe à découper ».

Je le considère comme :

PROJET ACTUEL

│

┌──────────────────┼──────────────────┐

│                  │                  │

PRODUIT             AGENCE           CONNAISSANCE

│                  │                  │

app/lib/db        scripts/QA        docs/CLAUDE

│                  │                  │

└──────────────────┼──────────────────┘

│

contrats implicites

│

frontières incomplètes

La bonne opération est donc de rendre explicites les contrats déjà présents, puis de déplacer progressivement les implémentations derrière ces contrats.

Et plusieurs frontières naturelles apparaissent déjà :

HTTP

↓

Application / Turn Engine

↓

Domain

├── World

├── Story

├── Life

├── Relationship

├── Perception

└── Time

↓

Ports

├── Repository

├── ModelGateway

├── Clock

└── Events

↓

Adapters

├── D1

├── Gemini

└── Cloudflare

Parallèlement :

Agency

├── Tool Runtime

├── Task/Process Engine

├── QA/Simulation

├── Observability

└── Exportability

C'est cette structure que le code tend déjà à avoir, même si elle n'est pas encore matérialisée proprement.

Un point particulièrement important

check-house.mjs est désormais clairement identifié comme un sous-système de test/harness, pas comme un simple « fichier trop gros ».

Il :

transpile lui-même du TypeScript ;

remplace manuellement les imports ;

fabrique des modules de test ;

simule Cloudflare ;

fabrique une D1 SQLite ;

remplace globalThis.fetch ;

simule Gemini ;

exerce les routes HTTP ;

teste les migrations ;

teste l'outillage de l'Agence.

Donc le découper brutalement serait une mauvaise première opération.

Dossier d'audit complet

J'ai produit le rapport détaillé avec les 20 cartographies demandées :

Télécharger le rapport d’audit architectural complet — Markdown

J'ai également produit les données techniques :

Graphe complet des dépendances — JSON

Graphe complet — Graphviz DOT

Inventaire des composants principaux — CSV

Données brutes de l'audit — JSON

Dossier complet regroupé en ZIP

Important sur la fiabilité

J'ai volontairement distingué dans le rapport :

Ce qui est démontré par les fichiers
de
ce qui est une déduction architecturale
de
ce qui nécessite encore une exécution réelle.

Le ZIP ne contient pas .git/ ni node_modules/. Je n'ai donc pas prétendu avoir vérifié un commit Git ou exécuté tsc, ESLint et toute la suite réelle. En revanche, les 88 fichiers .mjs ont tous passé node --check sans erreur de syntaxe.

La prochaine étape logique n'est donc toujours pas de modifier le code : c'est de prendre cette cartographie et de faire le deuxième niveau de due diligence, avec analyse AST/TypeScript, contrats de données, sécurité, exécution réelle et surtout identification précise des premiers modules réellement extractibles.

