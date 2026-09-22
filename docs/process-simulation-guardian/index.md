# Registre — process.simulation.guardian

Un passage par ligne. Le chiffre qui compte : **combien de ratages il a évités AVANT le lancement**,
et combien d'étapes d'archivage manquantes il a trouvées après.

| Date | Simulation | Verdict préflight | Trouvé après coup | Ce qu'on en retient |
|---|---|---|---|---|
| 2026-09-22 | (aucune — premier lancement à vide) | — | ligne KPI de full_sim18 manquante | Son tout premier passage réel a trouvé une étape d'archivage jamais faite sur une simulation déjà close. Le contrôle d'après sert donc aussi rétroactivement. |
