# Smart Breaker — instanciation dans ce projet

*(Créée le 2026-09-22 en certifiant Smart Breaker comme membre à part entière. Ce document est
l'INSTANCIATION : ce que l'outil est, comment il est câblé ici, et ce qu'il ne fait pas. Son RÉCIT —
pourquoi chaque règle existe, quel blocage réel l'a provoquée, quelle leçon a été tirée — vit dans
`docs/referentiel/smart-breaker-historique.md`, à lire avant toute intervention sur le sujet. Son
blueprint générique, réutilisable sur un autre projet, est `docs/outil-resilience-api.md` — nommé
ainsi plutôt que `smart-breaker-blueprint.md` parce qu'il a été écrit AVANT que le surnom n'existe,
et renommer casserait les renvois croisés. Registre des passages réels : `docs/smart-breaker/`.)*

## Pourquoi il est devenu membre certifié le 2026-09-22

Il ne l'était pas, et pour une raison purement technique : son statut dans la table maîtresse était
`Agent (structure particulière : pas de dossier docs/ dédié, son « registre » est le fichier local
.gemini-key-health.json, jamais committé)` — une chaîne qui ne correspondait à aucun statut
certifiable, donc un exclu du décompte sans que personne n'en ait jamais décidé ainsi. Question
posée à l'utilisateur, réponse explicite : **« Anomalie — il doit être certifié »**. Le vrai manque
était réel (aucun registre committé), pas le statut : il a donc reçu un vrai dossier d'archives,
et son statut est redevenu un simple `Agent`.

**Ce que le dossier committé N'EST PAS** : une copie de `.gemini-key-health.json`. Ce fichier local
contient l'état de santé des clés d'API et n'a rien à faire sur GitHub — il reste gitignoré, comme
avant. `docs/smart-breaker/` archive les ÉPISODES : un blocage réel rencontré, ce qui a été sondé,
quel modèle ou quelle clé a repris, combien de temps ça a duré. De la connaissance réutilisable,
jamais un secret.

## Ce qu'il fait

Quatre fichiers, un seul rôle : ne jamais laisser un quota ou une clé bloquée arrêter le travail.
- `scripts/check-gemini-quota.mjs` — sonde en direct plusieurs modèles × plusieurs clés et dit
  lesquels répondent RÉELLEMENT à cet instant. Ne modifie jamais la configuration lui-même.
- `scripts/gemini-key-health.mjs` — tient l'historique local de santé par clé/modèle.
- `scripts/api-providers.mjs` — la liste des fournisseurs candidats.
- `lib/gemini-keys.ts` — la rotation réelle en production : repli de modèle et de clé sur 429/503
  uniquement, recul exponentiel, mémoire de la dernière clé ayant répondu. **Inactif par défaut**
  (listes vides) : aucun changement de comportement tant que ce n'est pas explicitement configuré.

## Ses limites, honnêtement

- **Une disponibilité sondée maintenant peut être fausse dans une minute** — c'est pour ça qu'il est
  classé `heuristique` dans `TOOL_RELIABILITY` et affiche l'avertissement partagé en tête de rapport.
- **Il ne décide jamais d'activer un modèle de repli en production** : cette condition stricte reste
  dans `smart-breaker-historique.md`, et la validation qualité intégrale
  (`check-spirit.mjs`/`check-profile.mjs` avec ce modèle) n'a jamais été faite — cf.
  `docs/referentiel/points-fragiles.md`.
- **Il coûte de vrais appels API** : consulter Smart Conso API avant de le lancer (Article 22), même
  pour un simple diagnostic.
