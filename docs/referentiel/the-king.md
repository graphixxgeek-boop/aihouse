# THE-KING — instanciation pour Maison IA vivante

*(2026-09-21. Principe générique : `docs/the-king-blueprint.md`. Code : `scripts/the-king.mjs`.
Registre des évolutions constatées de `docs/philosophie-et-politique.md` : `docs/the-king/`.)*

## Rôle exact

THE-KING veille à ce que les décisions à haut niveau de ce projet consultent réellement
`docs/philosophie-et-politique.md` avant d'être prises — jamais après coup. Il ne décide rien sur le
fond (aucune autorité sur le contenu de la charte ou du code) : il rappelle, mesure la fraîcheur du
document, et signale une tension possible entre deux principes. Surnom donné par l'utilisateur : un
rôle de « père » ou « grand-père » — celui qui rappelle les valeurs de fond sans jamais se substituer
à qui décide.

## Les 6 catégories de déclenchement (confirmées avec l'utilisateur, 2026-09-21)

Chacune répond à « est-ce que cette décision serait coûteuse ou difficile à défaire si elle
contredisait une valeur de fond ? » — un mot-clé est un SIGNAL, jamais une certitude :

1. **Nouvelle architecture technique** — refonte, restructuration, migration, changement de stack.
2. **Nouveau mécanisme de jeu à fort impact** — nouvelle jauge, règle du jeu, révélation, gameplay.
3. **Création d'un nouvel outil membre de l'équipe** — un nouvel agent-script rejoint le réseau.
4. **Changement d'ordre ou de priorité de la feuille de route** — un chantier repasse devant un autre.
5. **Décision généralisable à un futur projet** — un principe destiné à survivre à ce projet précis.
6. **Décision irréversible ou coûteuse** — suppression, renumérotation, changement définitif.

`classifyDecisionTriggers(requestText)` retourne les catégories détectées ; `reminderFor(requestText)`
formule le rappel lisible correspondant (`null` si aucune catégorie détectée).

## Parsing du document de philosophie

`extractPrincipleUnits(text)` découpe `docs/philosophie-et-politique.md` sur ses titres réels
(`### N.N Titre **[tag]**`) — même principe que `extractRuleUnits()` de CLAUDE.MD.SPY pour CLAUDE.md,
mais un parseur dédié (le format de titre diffère, un partage forcé aurait fragilisé les deux). Une
date n'est extraite (`extractPrincipleDate()`) que lorsqu'elle est explicitement portée par le tag
(ex. `[Synthèse, 2026-09-19]`) — jamais devinée depuis le contenu.

## Digest de l'évolution

`buildEvolutionDigest(principles)` liste, du plus ancien au plus récent, tous les principes portant
une date explicite — la mémoire de l'évolution du document demandée par l'utilisateur. Sur le
document actuel (19 principes), 2 portent une date explicite (1.9 et 1.10, ajoutés le 2026-09-19) ;
les principes fondateurs (`[Explicite]`) n'en portent pas, honnêtement absents du digest plutôt que
datés à tort du jour de leur première lecture.

## Détection de tension possible (enrichissement confirmé "oui maintenant")

`findPossibleTensions(principles)` : deux conditions cumulatives, toutes deux nécessaires pour
limiter les faux positifs — (1) un vocabulaire significatif fortement partagé (même seuil de
similarité de Jaccard, 0.22, que `findRedundantRulePairs()` de CLAUDE.MD.SPY, réutilisé sans
duplication de la logique de seuil) ; (2) une polarité normative divergente sur ce terrain partagé
(l'un porte « jamais », l'autre « toujours »). Testé contre le document réel : zéro tension détectée
à ce jour — un résultat honnête (aucune contradiction connue dans la charte actuelle), jamais un
signe que la fonction ne fonctionne pas.

## Fraîcheur (jamais un auto-edit)

`philosophyFreshnessDays()` réutilise `lastTouchDays()` de CLEAN-DIRTY-OLD sur
`docs/philosophie-et-politique.md` — un signal brut de jours depuis la dernière modification réelle,
jamais une proposition de texte. Câblé dans la Ronde périodique CIRCLE-TASKS (item
`the-king-signal`, thème « Suivi & référentiels ») dès la création de THE-KING (enrichissement
confirmé "oui maintenant" : digest périodique de l'évolution de la philosophie) — le garde-fou de
fraîcheur de CIRCLE-TASKS (`findRegistriesMissingFromCircle()`) exige qu'un nouveau registre
`docs/<slug>/` soit couvert par un item réel ou une exclusion documentée dès sa création, jamais
différé à un passage ultérieur.

## Statut d'intégration

Agent à part entière (blueprint + instanciation + registre), mécanique, zéro appel Gemini. Menu
PRESTATIONS : "Pack Régence" (consultation ponctuelle). Registre : `docs/the-king/` (dossier + index),
vide à la création — se remplira au premier vrai constat d'évolution ou de tension.
