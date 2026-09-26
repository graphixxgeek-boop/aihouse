# Registre — CIRCLE-TASKS (la Ronde)

**Ce qu'on note ici.** Pas les passages de Ronde eux-mêmes — chaque entrée dépose son propre
artefact daté dans son propre dossier, et le récapitulatif de fin de Ronde est déjà produit. Ce
registre porte ce que le DISPOSITIF a révélé sur lui-même : les trous trouvés dans ses propres
tables, qui ne se lisent nulle part ailleurs.

| Date | Ce qu'il a trouvé | Ce qui en a découlé |
|---|---|---|
| 2026-09-22 | **14 entrées sur 32 promettaient un rapport sans dossier de dépôt.** Trouvé en écrivant pour la première fois les artefacts d'une Ronde réelle : 10 des 26 entrées exécutées ont levé « aucun dossier connu ». Rien ne comparait les deux tables — le registre ne savait pas qu'il lui manquait quelqu'un. | `findItemsPromisingReportWithoutFolder()` et son inverse `findFoldersWithoutItem()`. L'erreur ne se révélait qu'en écrivant l'artefact, c'est-à-dire pendant une Ronde, au pire moment. |
| 2026-09-22 | **`findItemsMissingFromChangelog()` existait depuis sa création et n'avait AUCUN appelant.** Il a veillé dans le vide pendant que **huit entrées** rejoignaient la Ronde sans leur « pourquoi » — dont deux ajoutées par l'agent lui-même dans les deux jours suivants. | Les huit motifs reconstitués après coup depuis les commentaires et le suivi, chacun déclarant qu'il l'est. La valeur récupérée est réelle ; celle perdue entre-temps ne revient pas (leçon L2). |
| 2026-09-22 | **pure-gold-unity n'était PAS dans la Ronde**, et aucun garde-fou ne pouvait le dire : `findRegistriesMissingFromCircle()` part des registres présents sur le disque, et cet outil n'en avait aucun. **Le trou vivait dans le garde-fou lui-même.** L'utilisateur l'a trouvé en posant simplement la question. | `findReportingToolsMissingFromCircle()`, écrit le jour même — il part des outils, pas des dossiers. |
| 2026-09-26 | **Trois registres déclarés ne pouvaient STRUCTURELLEMENT pas être vus** : le garde-fou ne retenait que les chemins `docs/<slug>/index.md`, et `docs/referentiel/kpi-rapports/`, `docs/suivi/relectures-lourdes/`, `docs/ecotoken/ronde/` n'ont pas cette forme. Son vert ne disait pas « couverts », il disait « pas regardés » — et les deux se ressemblent trait pour trait. | Lecture de la liste DÉCLARÉE en plus du balayage du disque, rapprochement par le CHEMIN plutôt que par la ressemblance de nom. Aucun rapport n'était perdu ce jour-là, vérifié un par un : c'était une chance, pas une garantie. |
| 2026-09-26 | **Les trois verrous d'ouverture ont mordu pour la première fois**, sur un défaut créé le matin même en corrigeant autre chose : inscrire `sauvegarde-projet` au catalogue l'a rendu visible au compteur d'usage, qui a découvert qu'il n'enregistrait jamais son passage. Son zéro ne disait pas « personne ne sauvegarde » mais « personne ne compte ». | `recordCliUsage` ajouté à la source. Premier vrai mordu du dispositif construit le jour même. |
| 2026-09-26 | **Une exclusion juste sur UNE couche d'un outil finit par le dispenser de TOUTES.** SAFE-EXPORT était exclu de la Ronde au motif « tourne à CHAQUE commit » — exact pour sa couche légère, faux pour la mesure des kits d'export, que personne ne lançait jamais. Trouvé parce que l'utilisateur a demandé « qui scanne ? ». | Exclusion retirée, entrée `safe-export-kits` ajoutée, et l'étape « vérifier l'exclusion existante » inscrite dans le process d'intégration d'une entrée de Ronde. |

<!-- SOMMAIRE GÉNÉRÉ — ne rien écrire dans ce bloc, il se régénère -->
## Dépôts sans ligne de journal *(reconstitué)*

*(Ces passages ont laissé un fichier et aucune ligne. La liste est RECONSTITUÉE depuis les fichiers eux-mêmes : elle dit qu'un dépôt a eu lieu, jamais ce que l'outil a mesuré ce jour-là — cette donnée-là est perdue, et l'inventer serait pire que de la déclarer perdue.)*

**68 dépôt(s)** sans trace.

| Fichier | Date lue dans le nom |
|---|---|
| [estimations.md](estimations.md) | — |
| [ouverture.json](ouverture.json) | — |
| [questions-sans-reponse.json](questions-sans-reponse.json) | — |
| [00-menu-circle-tasks.txt](ronde-2026-09-22/00-menu-circle-tasks.txt) | — |
| [ANALYSE.md](ronde-2026-09-22/ANALYSE.md) | — |
| [angel-of-ia-process.txt](ronde-2026-09-22/angel-of-ia-process.txt) | — |
| [cassandra-rh-organigramme.txt](ronde-2026-09-22/cassandra-rh-organigramme.txt) | — |
| [cassandra-rh-rapport.txt](ronde-2026-09-22/cassandra-rh-rapport.txt) | — |
| [check-profil-utilisateur.txt](ronde-2026-09-22/check-profil-utilisateur.txt) | — |
| [check-tasks-details.txt](ronde-2026-09-22/check-tasks-details.txt) | — |
| [circle-process-guardian.txt](ronde-2026-09-22/circle-process-guardian.txt) | — |
| [clean-dirty-old.txt](ronde-2026-09-22/clean-dirty-old.txt) | — |
| [data-archangel.txt](ronde-2026-09-22/data-archangel.txt) | — |
| [doc-report.txt](ronde-2026-09-22/doc-report.txt) | — |
| [ecotoken.txt](ronde-2026-09-22/ecotoken.txt) | — |
| [gardien-always-new-code.txt](ronde-2026-09-22/gardien-always-new-code.txt) | — |
| [gardien-argus.txt](ronde-2026-09-22/gardien-argus.txt) | — |
| [gardien-axa-check.txt](ronde-2026-09-22/gardien-axa-check.txt) | — |
| [gardien-clean-dirty-old.txt](ronde-2026-09-22/gardien-clean-dirty-old.txt) | — |
| [gardien-clone-hunter.txt](ronde-2026-09-22/gardien-clone-hunter.txt) | — |
| [gardien-harmonia.txt](ronde-2026-09-22/gardien-harmonia.txt) | — |
| [gardien-safe-export.txt](ronde-2026-09-22/gardien-safe-export.txt) | — |
| [god-of-all-process.txt](ronde-2026-09-22/god-of-all-process.txt) | — |
| [hyper-scan-light.txt](ronde-2026-09-22/hyper-scan-light.txt) | — |
| [ines-official.txt](ronde-2026-09-22/ines-official.txt) | — |
| [integration-outil.txt](ronde-2026-09-22/integration-outil.txt) | — |
| [kpi-report.txt](ronde-2026-09-22/kpi-report.txt) | — |
| [le-coordinateur-catalogue.txt](ronde-2026-09-22/le-coordinateur-catalogue.txt) | — |
| [memory-audit.txt](ronde-2026-09-22/memory-audit.txt) | — |
| [objectifs-vs-resultats.txt](ronde-2026-09-22/objectifs-vs-resultats.txt) | — |
| [safe-export.txt](ronde-2026-09-22/safe-export.txt) | — |
| [smart-conso-api.txt](ronde-2026-09-22/smart-conso-api.txt) | — |
| [smart-conso-token.txt](ronde-2026-09-22/smart-conso-token.txt) | — |
| [the-king.txt](ronde-2026-09-22/the-king.txt) | — |
| [tool-brain.txt](ronde-2026-09-22/tool-brain.txt) | — |
| [tool-learning.txt](ronde-2026-09-22/tool-learning.txt) | — |
| [ANALYSE.html](ronde-2026-09-23/ANALYSE.html) | — |
| [ANALYSE.md](ronde-2026-09-23/ANALYSE.md) | — |
| [RAPPORT.html](ronde-2026-09-23/RAPPORT.html) | — |
| [RAPPORT.txt](ronde-2026-09-23/RAPPORT.txt) | — |
| [TACHES-etat.txt](ronde-2026-09-23/rapports/TACHES-etat.txt) | — |
| [TACHES-fidelite.txt](ronde-2026-09-23/rapports/TACHES-fidelite.txt) | — |
| [TACHES-process.txt](ronde-2026-09-23/rapports/TACHES-process.txt) | — |
| [cassandra-rh-signal.txt](ronde-2026-09-23/rapports/cassandra-rh-signal.txt) | — |
| [coordinateur-catalogue.txt](ronde-2026-09-23/rapports/coordinateur-catalogue.txt) | — |
| [data-archangel-scan.txt](ronde-2026-09-23/rapports/data-archangel-scan.txt) | — |
| [doc-report.txt](ronde-2026-09-23/rapports/doc-report.txt) | — |
| [ecotoken-scan.txt](ronde-2026-09-23/rapports/ecotoken-scan.txt) | — |
| [god-of-all-process-conformite.txt](ronde-2026-09-23/rapports/god-of-all-process-conformite.txt) | — |
| [hyper-scan-checkpoint-light.txt](ronde-2026-09-23/rapports/hyper-scan-checkpoint-light.txt) | — |
| [ines-official-signal.txt](ronde-2026-09-23/rapports/ines-official-signal.txt) | — |
| [integration-audit.txt](ronde-2026-09-23/rapports/integration-audit.txt) | — |
| [kpi.txt](ronde-2026-09-23/rapports/kpi.txt) | — |
| [network-check-run.txt](ronde-2026-09-23/rapports/network-check-run.txt) | — |
| [organigramme-signal.txt](ronde-2026-09-23/rapports/organigramme-signal.txt) | — |
| [profil-utilisateur-guard.txt](ronde-2026-09-23/rapports/profil-utilisateur-guard.txt) | — |
| [pure-gold-unity-scan.txt](ronde-2026-09-23/rapports/pure-gold-unity-scan.txt) | — |
| [safe-export.txt](ronde-2026-09-23/rapports/safe-export.txt) | — |
| [smart-conso-api-scan.txt](ronde-2026-09-23/rapports/smart-conso-api-scan.txt) | — |
| [smart-conso-token-scan.txt](ronde-2026-09-23/rapports/smart-conso-token-scan.txt) | — |
| [the-equalizer.txt](ronde-2026-09-23/rapports/the-equalizer.txt) | — |
| [the-king-signal.txt](ronde-2026-09-23/rapports/the-king-signal.txt) | — |
| [tool-brain-report.txt](ronde-2026-09-23/rapports/tool-brain-report.txt) | — |
| [tool-learning.txt](ronde-2026-09-23/rapports/tool-learning.txt) | — |
| [rapport.txt](ronde-2026-09-24/rapport.txt) | — |
| [ronde-2026-09-25-autonome.md](ronde-2026-09-25-autonome.md) | 2026-09-25 |
| [ronde-2026-09-25-recommandee.html](ronde-2026-09-25-recommandee.html) | 2026-09-25 |
| [ronde-2026-09-25-recommandee.md](ronde-2026-09-25-recommandee.md) | 2026-09-25 |
<!-- FIN DU SOMMAIRE GÉNÉRÉ -->
