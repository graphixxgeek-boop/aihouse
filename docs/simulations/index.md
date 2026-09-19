# Simulations archivées — index

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur, en urgence : onze simulations
existaient encore dans le scratchpad éphémère de cette session, jamais durablement archivées —
risque réel de perte totale à la fin de la session. Consolidé avec l'ancien emplacement
`docs/contexte-projet/simulations/` (full_sim4, dupliqué par erreur puis retiré de là — un seul
endroit fait foi désormais). Distinct de `docs/contexte-projet/` : CE dossier-ci est une source de
vérification pour le réseau d'outils (ARGUS/HARMONIA/ALWAYS-NEW-CODE), pas un historique
consultable "en cas de doute" seulement.)*

## Contenu de chaque entrée

- `<sim>_transcript.txt` — la conversation complète, telle que livrée à l'utilisateur.
- `<sim>_dossier.txt` — le dossier retourné complet, si la phase 2 a été atteinte.
- `<sim>_actions.txt` — résumé compact des actions (`scripts/summarize-simulation-log.mjs`),
  extrait du journal JSON brut avant que celui-ci ne soit jeté (trop volumineux, jamais archivé
  lui-même — décision explicite de l'utilisateur).

## Registre

| Simulation | Round final | Dossier atteint | Événements extraits | Notes |
|---|---|---|---|---|
| full_sim (sim1) | 44 | oui | 41 | Le plus ancien journal conservé ; round absent de `story`, reconstruit depuis le label de requête (`phase1-roundN-actorX`). |
| full_sim2 | 56 | oui | 43 | Idem, round reconstruit depuis le label. |
| full_sim3 | 52 | oui | 43 | Idem, round reconstruit depuis le label. |
| full_sim4 | 136 | oui | 75 | Anciennement dupliqué dans `docs/contexte-projet/simulations/` — consolidé ici, ancien emplacement retiré. |
| full_sim5 | 122 | oui | 46 | — |
| full_sim6 | 34 | non | 21 | Révélation non atteinte dans cette session. |
| full_sim7 | 215 | oui | 82 | **Corrigé le 2026-09-19 (construction d'EL-PROFESSOR) : `full_sim7_dossier.txt` existe bel et bien et contient un vrai verdict** — cette ligne affirmait à tort "non" depuis sa création, écart entre ce registre et le fichier réel sur disque (Article 13). Round le plus élevé du lot ; à examiner si un futur passage HARMONIA/ALWAYS-NEW-CODE porte sur l'enquête. |
| full_sim8 | 144 | oui | 65 | — |
| full_sim9 | 153 | oui | 73 | — |
| full_sim10 | 164 | oui | 69 | Sujet du chantier 2 du tableau de bord (cf. `docs/referentiel/tableau-de-bord.md`). |
| full_sim11 | 174 | oui | 90 | Session bloquée par l'épuisement de quota Gemini le 2026-09-18, reprise ensuite. |
| full_sim14 | ~65 déplacements | oui (dossier annoncé, non capturé) | — | Déposé le 2026-09-19 par l'utilisateur depuis une sauvegarde texte personnelle (copier-coller, pas le journal JSON original) — seul le transcript a survécu, jamais de dossier ni d'`_actions.txt` pour cette entrée. Ordre chronologique exact du 2026-09-18 par rapport à full_sim15 non reconstituable (numérotation arbitraire à l'archivage). **Numérotée à partir de 14, pas 12** : les identifiants `full_sim12`/`full_sim13` désignent déjà, ailleurs dans le dépôt (`scripts/check-house.mjs`, `docs/suivi/sessions/`), deux tentatives réelles mais avortées de CETTE session (2026-09-19, épuisement de quota aux rounds 11 et 7, jamais archivées faute de contenu suffisant) — les réutiliser ici aurait créé une collision de numérotation entre deux simulations totalement différentes. |
| full_sim15 | ~39 déplacements | oui (dossier annoncé, non capturé) | — | Idem full_sim14 : déposé le 2026-09-19 depuis une sauvegarde texte personnelle, transcript seul, sans dossier ni journal JSON. |

## Limite honnête

Les `_actions.txt` sont une extraction MÉCANIQUE (rounds, tirages de bonus, déplacements,
révélation, jardin, croissance des preuves) — jamais une lecture qualitative du contenu des
répliques. Un passage HYPER-SCAN-CHECKPOINT ou une analyse manuelle reste nécessaire pour tout
jugement sur le naturel du dialogue, le respect de l'esprit des personnages, etc.

## À faire à chaque nouvelle simulation

Cf. `CLAUDE.md`, Article 18, étape 3bis — l'archivage n'est pas un rattrapage ponctuel, il se répète
à chaque simulation complète.

## Notation EL-PROFESSOR

Chaque entrée de ce registre est aussi notée par EL-PROFESSOR (note de fidélité à la charte /100 +
détail par thème) — cf. `docs/referentiel/el-professor.md` pour la méthode et
`docs/el-professor/index.md` pour la table de comparaison des notes entre versions. Un `?` dans
cette colonne, si elle apparaît un jour vide dans un audit futur, signale une note manquante à
produire, jamais une entrée à ignorer.
