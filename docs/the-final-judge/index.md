# THE-FINAL-JUDGE — index des passages

*(Cf. `docs/referentiel/the-final-judge.md` pour les règles complètes. Une entrée par passage —
n'importe quelle combinaison des 6 paliers d'Intensité (très léger à très lourd) et des 4 paliers de
Périmètre (global à un sujet précis focus). Le devenir de chaque recommandation retenue vit dans le
registre qui lui correspond déjà (`docs/referentiel/points-fragiles.md`,
`docs/simulations/correctifs-a-revalider.md`, ou directement corrigée) — jamais ici, qui n'archive
que la trace du passage lui-même.)*

**Étiquette de nouveauté (2026-09-20, demande explicite de l'utilisateur : mesurer si le regard neuf
du juge apporte encore des choses vraiment nouvelles au fil des passages).** Chaque point retenu
porte l'une de trois étiquettes, posées par l'agent au moment de la réconciliation (jamais par le
juge lui-même, jamais automatisées) : **[nouveau]** — jamais identifié ailleurs dans le projet avant
ce passage ; **[déjà connu]** — repéré indépendamment avant ce passage, le juge le reconfirme sans
rien apporter de neuf sur ce point précis ; **[confirme + creuse]** — un symptôme déjà connu (souvent
via EL-PROFESSOR) que le juge enrichit d'une hypothèse causale ou d'une piste que personne n'avait
encore formulée.

| Date | Intensité | Périmètre | Verdict global | Points retenus après réconciliation | Rapport |
|---|---|---|---|---|---|
| 2026-09-20 | Très lourd (premier passage, dogfooding — antérieur à l'échelle à 6 paliers, équivalent à l'ancien mode "lourd") | Global | Moteur narratif réel et solide, mais projet PAS prêt à la mise en ligne : architecture mono-instance/mono-partie (une seule maison partagée par tous les visiteurs), reset accessible sans authentification | (1) **[nouveau]** architecture mono-instance/reset non protégé, jugé bloquant par le juge ; (2a) **[déjà connu]** PIN admin faible, jamais tranché ; (2b) **[nouveau]** absence de rate-limit production sur `/api/lia` ; (3) **[nouveau]** absence de CI ; (4) **[confirme + creuse]** Article 11 chroniquement faible (EL-PROFESSOR le notait déjà, le juge apporte l'hypothèse causale d'une limite structurelle du modèle "lite") ; (5) **[nouveau, mineur]** code mort `chatgpt-auth.ts` + nom de package jamais changé | [2026-09-20-lourd.md](2026-09-20-lourd.md) |
