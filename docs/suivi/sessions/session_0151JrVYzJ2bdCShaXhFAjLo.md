# Session session_0151JrVYzJ2bdCShaXhFAjLo

*(Première session du système de suivi — cf. `docs/systeme-de-suivi.md` pour le format et la
portée rétroactive décidée avec l'utilisateur : démarre à partir de la création du système, sans
reconstruire les tâches déjà terminées avant son existence dans cette même session.)*

## Tâches

| Horodatage | Sujet | Sous-sujet | Sensibilité | Description | Statut |
|---|---|---|---|---|---|
| 2026-09-19T15:47Z | Méthode de travail / Suivi | Système de gestion des tâches (dossier + index + tags) | important | Extraction de "règles de suivi" hors de `regles-de-travail.md` vers un document dédié + structure de fichiers (`docs/systeme-de-suivi.md`, `docs/suivi/`) | terminée |
| (créée avant ce système, date exacte non enregistrée) | Refonte graphique | `docs/referentiel/regles-des-graphismes.md`, à faire juste avant le chantier de refonte graphique | normal | Créer un doc de référence anticipant la refonte graphique (graphismes, mise en page, textures, apparence) — explicitement gardé pour plus tard par l'utilisateur | ouverte |
| 2026-09-19T16:12Z | Temps/Jour-nuit | Fusion bouton manuel + horloge automatique | normal | Retrait du bouton jour/nuit manuel (`app/page.tsx`), `night` désormais dérivé de `world.story.dayNight.isNight` — plus aucune désynchronisation possible | terminée |
| 2026-09-19T16:20Z | Documentation/Référentiel | Recherche des "questions de compréhension" d'avant compaction | normal | Exploration du transcript JSONL brut pour retrouver le lot de 16 questions `[Test de compréhension]` du 2026-09-19 12h01-12h02 UTC, à la demande explicite de l'utilisateur ; chaque écart identifié à l'époque reconfirmé résolu ou en cours | terminée |
| 2026-09-19T16:29Z | Smart Breaker | Article 20 de CLAUDE.md : ARGUS toujours déployé | important | Nouvelle règle de charte demandée explicitement par l'utilisateur — le futur détecteur de trous logiques (ARGUS) doit toujours être sollicité, jamais laissé à la seule initiative de qui pourrait l'oublier ; câblé dans le protocole d'application | terminée |
| 2026-09-19T16:29Z | Documentation/Référentiel | Principe générique de structure documentaire (1.10) | normal | Réexamen de la question "blueprint séparé pour principes.md/parametres.md/regles-du-temps.md/regles-de-l-espace.md" — conclusion : un principe générique dans `philosophie-et-politique.md` suffit, pas quatre fichiers d'architecture séparés | terminée |
| 2026-09-19T16:44Z | Temps/Jour-nuit | Nuit blanche / dette de sommeil | important | Malus de fatigue fixe (+28, non cumulable) à l'aube si un personnage n'a jamais dormi pendant la nuit, avec reconnaissance explicite ; conception issue directement des "questions de compréhension" retrouvées ci-dessus ; test dédié, doc à jour, commit poussé | terminée |
| 2026-09-19T16:35Z | Smart Breaker | Blocage total du quota Gemini pendant full_sim11 | critique | Diagnostic confirmé (3 clés × 6 modèles, tous `QUOTA_ÉPUISÉ`) — simulation stoppée proprement (jamais réinitialisée), script de reprise écrit (`full_sim11_resume.mjs`), check-in programmé (`send_later`, 4h) pour reprendre dès que possible | en cours |
| 2026-09-19T16:20Z | Smart Breaker | Conception d'ARGUS (détecteur de trous logiques) | important | Nom choisi, principe hybride (mécanique gratuit + raisonnement IA à la demande) confirmé, toujours déployé, balayage complet de l'existant dès que prêt, registre en dossier+index, blueprint séparé confirmé | en cours |
| 2026-09-19T16:41Z | Smart Breaker | Conception d'HARMONIA (cousin d'ARGUS, cohérence des liens) | important | Nom choisi (déesse grecque de l'harmonie), outil séparé d'ARGUS avec son propre blueprint, approche hybride, cartographie par grand thème, carte vivante tenue à jour, toujours revérifiée contre le code réel (jamais la doc seule) | en cours |

## Notes

- Les tâches terminées avant la création de ce système (chantier 2 du tableau de bord, full_sim10,
  règles de suivi première version, etc.) ne sont pas reconstruites ici — portée rétroactive
  tranchée explicitement avec l'utilisateur (cf. `docs/systeme-de-suivi.md`). Elles restent
  consultables dans l'historique de conversation et dans les documents qu'elles ont produits
  (`docs/referentiel/tableau-de-bord.md`, `docs/referentiel/kpi-index.md`, etc.).
