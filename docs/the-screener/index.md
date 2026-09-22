# THE-SCREENER — registre des passages

*(Une ligne par passage RÉEL. Longtemps vide malgré plusieurs simulations complètes : le mécanisme
de capture était testé en isolation mais n'avait jamais été déclenché PENDANT une partie — trou
process reconnu dans `docs/referentiel/points-fragiles.md`, fermé le 2026-09-22.)*

| Date | Contexte | Capture | Note graphique | Ce qu'on a appris |
|---|---|---|---|---|
| 2026-09-22 | full_sim18, phase 1 (round ~23), mode nocturne autonome | `test-capture-1790054640386.png` | **aucune — capture MASQUÉE, rien à noter** | Premier déclenchement réel depuis la construction de l'outil. La capture ne montre QUE la popup « Comment vous appeler ? », toute la scène floutée derrière. Cause : cette popup reste ouverte tant que la partie n'a pas d'observateur (`story.observer`), donc pendant TOUTE la phase 1 d'une simulation. **Le bon moment de capture est la phase 2**, une fois l'observateur entré. L'outil annonçait « Capture réussie » sur cette image — corrigé le jour même : il distingue désormais une capture masquée d'une vraie, et refuse qu'on pose une note dessus. |
