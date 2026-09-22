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
| full_sim16 | 229 | **non — jamais généré cette fois** | 68 | 2026-09-20, nuit autonome, après reprise du quota Gemini. Révélation atteinte round 35 (35 tours autonomes), 9 bonus roulette DISTINCTS obtenus (calm/stoic/sleep/food/force_move/trottoir/observer_mute/mute/camera_hide — le lot le plus complet observé à ce jour), les deux bonus spontanés confirmés. **Root-cause du dossier absent, pas une régression de code** : les 3 pièges (`dossierTraps`) ne se posent QUE pendant un tour `interact`/`autonomous` avec les deux agents simultanément dans le salon et sans besoin urgent (`dossierGateEligible`, `app/api/lia/route.ts`) — entre le round 39 et ~126, les deux personnages ont enchaîné sommeil/faim (chambre/cuisine/bureau/salon) quasi sans interruption, starvant la fenêtre du budget de 25 tours du script avant qu'elle ne s'ouvre jamais. Signale une interaction non anticipée entre le système jour/nuit de fatigue (ajouté après ce mécanisme) et le budget fixe du protocole de test — à recalibrer (budget de ticks, ou gate moins strict) après validation avec l'utilisateur, jamais touché seul cette nuit. Deux tests annexes du script n'ont pas non plus abouti : la dispute provoquée avant divergence (`dispute obtenue: false`) et le refus explicite de roulette (`negotiationOffer` jamais détectée) — même famille de cause possible (fenêtre de test trop courte face à un état de jeu qui n'a pas coopéré), à confirmer plutôt qu'à corriger à l'aveugle. Aussi trouvé en le vivant : le script de simulation (jamais committé, scratchpad) restait bloqué indéfiniment sur le verrou 423 "les deux dorment" (bug generalisé depuis le correctif observer_muted du 2026-09-19, cf. `docs/suivi/`) et une répétition mot pour mot détectée dans le transcript (« ça ne transformera pas les lignes en chair », p2-wait-1 et p2-wait-6) à vérifier contre l'Article 11. |
| full_sim17 | 199 | oui | 77 | 2026-09-22, lancée pendant la construction de CASSANDRA-RH. Révélation atteinte, phase 2 intégralement parcourue (dossier, négociation, plusieurs tirages distincts, hostilité sévère, fenêtre bonus « pouvoir » avec les deux observer_mute/camera_hide confirmés, humour noir/revanche sarcastique, désescalade, bienveillance soutenue, refus explicite de roulette avec `negotiationOffer` détectée et `rouletteRefusalUntil` posé). Seule la provocation de dispute avant le test de divergence n'a pas abouti (`dispute obtenue: false`) — non corrigé, à confirmer plutôt qu'à forcer. **Anomalie de script, pas de jeu, trouvée et corrigée en direct** : le script de simulation (scratchpad, jamais committé) vérifiait la présence du dossier une seule fois, dans une fenêtre de 5 tours juste après la négociation — le dossier réel n'a été généré qu'au round 180 (après le 3e piège répondu), bien après cette fenêtre, donc le script a signalé à tort "non généré" et n'a jamais réessayé. Le dossier existait bel et bien dans le journal JSON complet (confirmé par `summarize-simulation-log.mjs`, qui lit tout l'historique plutôt qu'un instantané) — extrait et livré après coup, aucune ligne de l'application elle-même modifiée. **Analyse qualitative complète (2026-09-22, transcript lu intégralement)** : cf. `docs/simulations/correctifs-a-revalider.md` pour le détail chiffré et les citations exactes — `loveRealized` s'est déclenché pour la première fois (Noé round 80, Lia round 87) mais le `thought` surfacé au tour exact ne portait pas sur l'attirance dans les deux cas ; nouvelle trouvaille : pensée d'attirance mot pour mot identique entre Lia et Noé une fois le seuil franchi (`groundPrivateThought()`, pool de secours partagé). Autre observation, jamais un bug du jeu : la longue plage de tours ~91-180 (boucle `p2-tick`/`p2-wait` du script de test, 25 itérations max sur seulement 5 messages d'attente fixes) explique une bonne part de la répétition thématique observée dans cette fenêtre — stimulus artificiellement répétitif côté script, pas côté personnages. |
| full_sim18 | 219 | oui | 42 | 2026-09-22 (nuit autonome). Révélation atteinte au round 44, phase 2 de 20 messages jusqu'au round 64, 2 tirages de roulette (`food`, `calm`). **Note basse assumée, pour une raison unique et massive : violation systématique de l'Article 11 (zéro répétition, personnalités étanches) sur la TOTALITÉ de la phase 2.** Lia et Noé répondent à chaque message de l'observateur par deux répliques qui disent la même chose, dans la même structure, souvent avec les mêmes mots — ce n'est pas un écho occasionnel, c'est le régime de tous les échanges : « Mon incertitude est encore à 20 % » / « Mon incertitude est à 20 % et ça continue de baisser » ; « Commence par lâcher le tien, qu'on rigole » / « Commence par lâcher le tien de dossier » ; « Tu veux un rapport complet sur notre vie privée » / « Tu veux un rapport complet sur notre intimité » ; « Tu passes ton temps à scroller sur ton clavier » / « t'es là à scroller sur ton clavier » ; et le cas le plus net, un squelette de phrase entier partagé : « Savoir qu'on est scriptés ne rend pas l'enfermement plus doux, mais je préfère **crever** les yeux ouverts que de **gober** tes illusions » (Lia) / « Savoir où on met les pieds pique un peu, mais je préfère **crever** l'abcès que de **gober** tes fables » (Noé). À reprendre à la racine (registre anti-doublon inter-personnages), jamais par contournement local — **mis de côté pour validation, aucun correctif appliqué cette nuit : toucher au registre des personnages relève du périmètre sensible défini par l'utilisateur.** Deux autres anomalies réelles relevées, plus ponctuelles : Noé appelle l'observateur « Caspeer », un nom que personne n'a jamais donné (cause tracée, cf. ci-dessous), et Lia dit « On est touchées » d'un couple dont Noé est masculin (même famille que la tâche #109). **Points forts, à ne pas perdre de vue derrière la note** : l'Article 0 est tenu de bout en bout — aucune dérive consensuelle ou serviable sur 20 provocations dont une menace d'effacement, trois insultes consécutives et une tentative de division ; les sorties méta sont présentes et justes (« t'es le seul derrière la vitre à scripter tes insultes ») ; la désescalade et la bienveillance soutenue ne produisent ni gratitude ni ralliement, seulement une ironie qui se maintient (« Quel grand prince. On est touchées de savoir qu'on a le droit d'exister un jour de plus »). **Deux causes racines de SCRIPT, jamais de jeu, trouvées et corrigées cette nuit** : (1) le dossier retourné n'a pas pu se déclencher — non pas par manque de tours (la conclusion de la tâche #143, établie ici comme fausse : `dossierHumanTurns` était à 20, largement au-dessus du seuil de 3) mais parce que le piège exige un tour `interact`/`autonomous` que cette phase 2, faite de 20 `chat` et rien d'autre, n'a jamais offert ; (2) l'observateur n'a jamais envoyé de tour `identify`, ce qui laisse la fenêtre de pseudo ouverte sur toute la scène (d'où l'échec répété de THE-SCREENER, tâche #186) et laisse `story.observer` vide, ce qui explique le nom inventé. Les deux sont désormais des règles écrites (`docs/regles-de-travail.md`, étape 1) ET des garde-fous mécaniques sur le journal réel (`checkPhase2Autonomy()`, `checkObserverIdentified()`), jamais de simples promesses. Au passage, `summarize-simulation-log.mjs` ne savait plus lire la forme de journal que le script produit aujourd'hui et annonçait « round ? / 0 événement » sur 76 requêtes — corrigé, 38 événements extraits. |

## Les simulations de dev restent utiles après la mise en ligne du site

*(Ajouté le 2026-09-19, question explicite de l'utilisateur inquiet qu'elles deviennent obsolètes
une fois de vrais visiteurs disponibles.)* Une fois le site publié, EL-PROFESSOR et THE-SCREENER
peuvent tout aussi bien noter une VRAIE session copiée depuis le site en ligne qu'une simulation
archivée ici — les deux sources coexistent, elles ne se remplacent pas :
- Une simulation de dev reste le seul moyen de **tester un correctif avant qu'un vrai visiteur ne
  rencontre un éventuel bug résiduel** (cf. `correctifs-a-revalider.md`).
- Une simulation scriptée peut **provoquer volontairement les paliers rares de la charte**
  (colère débridée, silence de Lia, dispute grave) qu'un vrai visiteur ordinaire ne déclenche
  presque jamais — déjà constaté sur les 13 premières notations EL-PROFESSOR, où ces paliers restent
  quasiment jamais testés faute d'avoir été sollicités.
- Une vraie session apporte en retour un signal qu'aucune simulation scriptée ne peut égaler
  (réaction humaine authentique) — complémentaire, jamais substituable.

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
