# Index des rapports KPI

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur : « archive chaque rapport dans un
fichier local, de manière à pouvoir t'y référer si besoin. Un document résume l'historique des
rapports, ce qu'il y a à noter dans les évolutions. Il sert aussi d'index pour retrouver rapidement
telle version du rapport par rapport à telle version de la simulation. » Complète, sans le
remplacer, `docs/referentiel/kpi-historique.csv` (les chiffres bruts, une ligne par run) : ce
document-ci porte le JUGEMENT sur ces chiffres — ce qui a changé, ce qui mérite l'attention — que
le CSV ne peut pas exprimer lui-même. Mis à jour par l'agent après chaque rapport, jamais généré
automatiquement par le script : comparer deux runs et en tirer ce qui compte est un travail de
lecture, pas un calcul.)*

## Comment lire ce document

Chaque ligne correspond à une exécution de `scripts/kpi-report.mjs`, identifiée par le même `run`
que la colonne correspondante dans `kpi-historique.csv`. Le rapport complet (tout le détail
verbeux, jamais collé dans la conversation, cf. `docs/referentiel/tableau-de-bord.md`) est archivé
dans `docs/referentiel/kpi-rapports/<run>.txt` — ce tableau sert à retrouver rapidement lequel de
ces fichiers correspond à quelle simulation, sans avoir à tous les rouvrir.

## Historique

| Run | Date | Rapport archivé | À noter dans les évolutions |
|---|---|---|---|
| `chantier2-2026-09-19` | 2026-09-19 | `kpi-rapports/chantier2-2026-09-19.txt` | Premier rapport avec le format complet (2 KPI Smart Breaker en tête, KPI global par famille, couverture du tableau de bord). Pas de run antérieur pour comparer. Couverture 60% (3/5 familles) : Qualité et Cohérence logique à N/A car le serveur de dev (actif depuis full_sim10) n'a encore traité aucun tour avec le nouveau code de comptage — normal, à confirmer vert dès la prochaine simulation. Performance Smart Breaker 98%, améliorations 88% (seul écart : validation qualité de `GEMINI_FALLBACK_MODELS` pour la prod, jamais faite). Robustesse du code 100%. Rejouabilité (signal partiel) 89% (8/9 bonus vus parmi les 12 derniers tirages, full_sim10). |
| `manuel-2026-09-20T03:33` | 2026-09-20 | `kpi-rapports/manuel-2026-09-20T03-33.txt` | Lancé via CIRCLE-TASKS (Ronde périodique), pas après une simulation Article 18 — aucun serveur de dev avec du vrai trafic n'était joignable, d'où Performance Smart Breaker N/A (0 tour) contre 98% au run précédent, une régression APPARENTE seulement (aucun tour à mesurer, jamais un vrai signal de dégradation). Robustesse du code 100% (stable), améliorations Smart Breaker 88% (stable, même écart connu). Qualité/Cohérence logique désormais mesurées (100%/100%, contre N/A au run précédent) mais sur seulement 7 tours résiduels en mémoire process, pas une vraie session fraîche. Rejouabilité (partiel) chutée à 0% (0/9 bonus vus) — reflète l'absence totale de trafic récent, pas un vrai biais de tirage à investiguer maintenant. Couverture du tableau de bord 80% (4/5, contre 60% au run précédent) : amélioration réelle de la couverture des familles mesurées, mais un run sans trafic reste peu représentatif — à reprendre après la prochaine vraie simulation (tâche #124, bloquée par le quota Gemini). |

## Procédure (rappel, cf. `docs/referentiel/tableau-de-bord.md` et Article 18 de `CLAUDE.md`)

1. `node scripts/kpi-report.mjs <run>` — ajoute une ligne à `kpi-historique.csv`, affiche le
   rapport complet + la synthèse compacte dans le terminal.
2. Rediriger cette sortie complète vers `docs/referentiel/kpi-rapports/<run>.txt` (archive).
3. Ajouter une ligne à ce document, en comparant explicitement aux chiffres du run précédent dans
   `kpi-historique.csv` — jamais une lecture isolée sans mise en perspective (même principe que la
   comparaison systématique entre deux simulations, Article 18 étape 6).
4. Livrer à l'utilisateur, dans la conversation : la synthèse compacte uniquement, plus
   `kpi-historique.csv` en fichier joint. Le rapport archivé et cet index restent des outils de
   travail internes, consultés à la demande, jamais imposés en pièce jointe systématique.
