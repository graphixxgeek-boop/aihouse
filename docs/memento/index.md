# Registre — memory-audit (`scripts/memento.mjs`)

**Note de nommage** : l'outil s'appelle **memory-audit** ; son fichier s'appelle `memento.mjs`, nom
d'origine conservé volontairement (tâche #172 — « surnom vs renommage de fichier → surnom, fichier
technique inchangé »). Son plan vit dans `docs/memory-audit-blueprint.md`, sa fiche dans
`docs/referentiel/memory-audit.md`.

**Ce qu'on note ici** : ce que l'audit de la mémoire narrative de Lia et Noé a révélé — jamais qu'un
passage a eu lieu.

| Date | Ce qu'il a trouvé | Ce qui en a découlé |
|---|---|---|
| 2026-09-21 | **Deux rôles vivaient dans un seul fichier**, et ils n'ont rien de commun sinon le mot « mémoire » : l'un vérifie la COHÉRENCE de ce que les personnages se rappellent, l'autre mesure le POIDS du contexte envoyé au modèle. Séparés à la demande explicite de l'utilisateur : « ces 2 scripts ne doivent plus etre reunis dans le meme script, pour plus de clarté ». | `scripts/memento-weight.mjs` extrait. Le nom de fichier `memento.mjs` reste : le renommer casserait des renvois pour un gain nul. |
| — | **Sa limite structurelle, déclarée plutôt que contournée** : il cible la mémoire narrative des personnages EN JEU, jamais un scan du dépôt. Il n'est donc vérifiable que sur des instantanés réels de partie — pendant ou après une simulation. C'est la raison de son exclusion de la Ronde : un item périodique n'aurait aucune donnée à regarder. | Exclusion écrite dans `CIRCLE_AUTO_COVERED_REGISTRIES`. |
| 2026-09-23 | **La photo de mémoire à chaque tour** a été tranchée par l'utilisateur CONTRE la recommandation de l'agent (qui proposait début/fin seulement). La mécanique vit ici et non dans le pilote de simulation, parce qu'un fichier non testable contamine tout ce qu'on y ajoute. | `creerSuiviMemoire()` / `ecrireConstatMemoire()` / `formatSuiviMemoire()`, appelés en trois lignes depuis le pilote. |
| 2026-09-26 | Kit d'export : son registre manquait. | Ce fichier. |
