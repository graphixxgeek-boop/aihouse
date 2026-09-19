# AXA-CHECK — index des passages et trouvailles

*(Cf. `docs/referentiel/axa-check.md` pour les règles complètes. Ce fichier résume, par exécution,
la robustesse globale mesurée et les trouvailles de fragilité réellement vérifiées — un score seul
(`node scripts/axa-check.mjs`) reste reproductible à la demande, jamais besoin d'archiver un
rapport complet à chaque lancement (même choix qu'HARMONIA, contrairement à ARGUS).)*

| Date | Fonctions analysées | Robustesse globale | Trouvailles confirmées | Notes |
|---|---|---|---|---|
| 2026-09-19 | 146 (24 fichiers `lib/*.ts` + `app/api/lia/route.ts`) | 99% | `wait` (lib/playback.ts, ligne 2) jamais exécutée par la suite `check-house.mjs` | Premier passage réel d'AXA-CHECK, lancé le jour de sa création. `lib/reference.ts`, `lib/update-audit.ts` et `lib/visual-events.ts` correctement rapportés N/A (zéro fonction déclarée, vérifié par lecture directe — jamais un angle mort silencieux). Corroboration par simulations archivées vérifiée indépendamment sur les zones Bonus roulette (10/11), Enquête (11/11) et Déplacements/espace (11/11) — cf. Article 18 étape 3bis. |
