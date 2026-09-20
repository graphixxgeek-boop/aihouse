# CLONE-HUNTER — instanciation pour Maison IA vivante

*(2026-09-21. Construit en réponse directe à une question de l'utilisateur : « est-ce qu'on a deja
un outil qui traque les redondances, repetition, duplicatas, dans le code ? » — vérifié avant
construction que non (Article 19), en lisant les fonctions exportées d'ARGUS/HARMONIA/AXA-CHECK/
CLEAN-DIRTY-OLD une par une, aucune ne fait ce métier. Principe générique :
`docs/clone-hunter-blueprint.md`. Code : `scripts/clone-hunter.mjs`. Registre : `docs/clone-hunter/`.)*

## Rôle exact

Un Membre de l'équipe (Outillage de travail) qui scanne `lib/`, `scripts/`, `app/` et `components/`
(hors `components/ui/`, cf. plus bas) à la recherche de blocs de lignes IDENTIQUES (après
normalisation d'espaces) répétés à plusieurs endroits — v1 volontairement littérale, calibrée
explicitement avec l'utilisateur (jamais une ressemblance sémantique pour l'instant, cf. tâche #177
« Améliorer CLONE-HUNTER (v2) », ouverte mais non calibrée).

## Le cœur de l'algorithme, `scripts/clone-hunter.mjs`

- `normalizeLine()`/`isSubstantialLine()` : normalise les espaces, écarte les lignes triviales
  (accolades seules, imports courts) sous un seuil de longueur (20 caractères par défaut) — même
  discipline anti-bruit que route-booster/find-booster.
- `findDuplicateBlocks()` : indexe chaque ligne substantielle par son contenu normalisé, puis pour
  chaque paire d'occurrences de la même ligne, étend la comparaison ligne par ligne tant qu'elle
  matche — un diff de blocs, jamais un fenêtrage à taille fixe (qui aurait coupé un bloc plus long
  que la fenêtre ou l'aurait fragmenté en plusieurs alertes). Un jeu de positions déjà visitées
  évite de re-signaler une sous-partie d'un bloc déjà trouvé plus long. Un plafond
  (`maxOccurrencesPerLine`, 40 par défaut) écarte les lignes bien trop communes pour être
  significatives sans jamais crasher sur un fichier au vocabulaire très répétitif (les nombreux
  `assert.equal(...)` de check-house.mjs, par exemple).
- `clusterDuplicates()` : un union-find minimaliste regroupe les paires en clusters — un bloc
  dupliqué à 3 endroits ne produit qu'UN cluster de 3 occurrences, jamais 3 alertes redondantes (une
  par paire).
- `buildDuplicateReport()` : point d'entrée haut niveau, lit vraiment le disque (jamais dans les deux
  fonctions ci-dessus, qui restent des fonctions pures testables sans I/O).

## components/ui/ exclu — une exclusion vérifiée, jamais générique

Premier essai live contre le vrai dépôt (avant cette exclusion) : 27 clusters trouvés, dont plus de
20 dans `components/ui/*` — vérifié (`git log -1` sur `card.tsx` : « Import du code source Codex »,
motifs `"use client"`/Radix/`cn()` partout) qu'il s'agit du kit shadcn/ui vendu tel quel, dont la
philosophie même est la duplication assumée (chaque primitive copiée-collée, jamais factorisée en
bibliothèque partagée). Exclu du scan par défaut pour que le signal restant reste actionnable —
jamais pour cacher une vraie duplication dans le code réellement écrit à la main par l'équipe
(Article 3 : corriger la cause du bruit, pas juste baisser le volume affiché). Les 7 clusters
restants (dans `scripts/`) sont tous des trouvailles réelles, vérifiées une à une le 2026-09-21 — la
plus significative : `loadJson()` dupliqué verbatim entre `scripts/smart-conso-api.mjs` et
`scripts/smart-conso-token.mjs` (8 lignes).

## CIRCLE-TASKS — un vrai lancement à chaque passage, jamais un simple signal

Demande explicite de l'utilisateur (« tu integres clone hunter à la ronde periodique, en lancement
auto comme les autres de la suite verif ») : contrairement aux items `-signal` de CIRCLE-TASKS (qui
ne lisent QUE la fraîcheur d'un index de passages déjà faits), `clone-hunter-run` relance le VRAI
scan à chaque passage — même traitement que `profil-utilisateur-guard`/`network-check-run`, dans le
même thème "Passages réels (smoke run)". Raison : la détection de duplication n'a pas de mémoire
persistante à consulter pour estimer une fraîcheur honnête, seule une exécution réelle donne un
résultat qui vaille la peine d'être lu.

## Un signal factuel, jamais une correction automatique

`main()`/`formatClusterSummary()` impriment les clusters triés par impact (longueur × occurrences),
jamais une factorisation appliquée automatiquement — la décision de factoriser (ou non) reste à
l'agent qui pilote, au cas par cas : une ressemblance de surface peut cacher une intention
différente qui justifie deux implémentations distinctes.

## v2 (sémantique) — ouverte, pas encore calibrée

Tâche interne #177, créée le soir même à la demande de l'utilisateur (« ameliorer l'outil clone
hunter est inscrit à la to do ») : détecter une ressemblance de LOGIQUE (mêmes opérations, noms de
variables différents, lignes réarrangées) plutôt qu'une identité littérale — hors de portée de la
v1, demanderait une vraie réflexion de conception (tokenisation par identifiants génériques ? seuil
de similarité plutôt qu'égalité stricte ?). Jamais construite à l'aveugle : à calibrer avec
l'utilisateur avant toute implémentation, comme toute extension d'outil de ce réseau.

## Doc-Report

Entrée `REGISTRIES` dédiée (`scripts/doc-report.mjs`), famille "Qualité du code", décision "texte".

## Statut d'intégration

Testé en fixtures synthétiques (bloc partagé entre 2 fichiers, bloc trop court écarté, duplication
au sein d'un même fichier, cluster à 3 occurrences regroupé en une seule alerte) ET vérifié live
contre le vrai dépôt (exclusion de `components/ui/` confirmée, trouvaille réelle de `loadJson()`
retrouvée). Entrée PRESTATIONS "Pack Chasse aux clones". Item CIRCLE-TASKS `clone-hunter-run`.
Registre : `docs/clone-hunter/` (dossier + index), un premier constat déjà consigné.
