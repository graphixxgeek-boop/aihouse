# Smart Breaker — registre des épisodes réels de blocage

*(Créé le 2026-09-22 en certifiant Smart Breaker. Une ligne par épisode RÉEL de blocage quota/clé
rencontré pendant le travail — jamais un lancement de routine sans incident, qui n'apprendrait rien.
Ce registre est committé ; le fichier local `.gemini-key-health.json`, qui contient l'état de santé
des clés, reste gitignoré et n'est jamais recopié ici.)*

| Date | Contexte | Ce qui était bloqué | Ce qui a été sondé | Ce qui a repris | Leçon |
|---|---|---|---|---|---|
| 2026-09-20 | `check-spirit.mjs` relancé de nuit | 18 scénarios sur 20 en 429/503 | les 3 clés configurées sur `gemini-flash-lite-latest` | rien — quota journalier réellement épuisé sur les 3 clés | un changement de jour calendaire ne suffit pas : le quota est par PROJET, et les 3 clés partagent le même projet (cf. `points-fragiles.md`, lecture partielle 2/20 à refaire) |
| 2026-09-22 | scan Smart Conso API de la Ronde nocturne | rien à cet instant | historique de session | — | 1 relancement confirmé moins de 10 min après un épuisement réel : le `retryDelay` renvoyé par Google est trompeur pour un quota JOURNALIER, ne jamais réessayer à l'aveugle sur cette foi |
