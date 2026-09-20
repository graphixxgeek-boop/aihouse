# SMART-CONSO-TOKEN — index des décisions et évolutions

*(Cf. `docs/referentiel/smart-conso-token.md` pour les règles complètes. Ce fichier résume, par
décision durable, ce qui a changé et pourquoi — pas chaque consultation individuelle, celles-là
vivent dans `.smart-conso-token-history.json`, local et non versionné.)*

| Date | Décision | Notes |
|---|---|---|
| 2026-09-20 | Création de l'outil + registre initial de schémas coûteux (recherche web réelle) + premier seuil dur proposé (`agent_subagent_spawn` : 3 appels confirmés / 2h) | Créé à la demande explicite de l'utilisateur, pendant de Smart Conso API pour les tokens de l'agent. Connaissance déclarée valable pour "claude" (recherche du 2026-09-20) — à revalider explicitement si le modèle/la plateforme change (`checkKnowledgeFreshness()`). Seuil dur **encore en attente de validation explicite**, laissé "proposé" à la demande de l'utilisateur. |
| 2026-09-20 | Premier scan réel (`scanDocumentWeight`) : `CLAUDE.md` fait 1407 lignes / ~28 792 tokens estimés | Très largement au-delà du repère "progressive disclosure" (300 lignes limite, 100 idéal). Constat factuel seulement, **aucune proposition de réduction faite ni appliquée** — un changement de ce fichier reste soumis à la même prudence extrême que tout ce qui touche la charte (Article 14). À reprendre lors d'une vraie session de tri dédiée, jamais en aparté d'un autre chantier. |
