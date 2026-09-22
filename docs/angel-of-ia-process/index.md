# Registre — angel-of-ia-process

Un passage par ligne. On note ce que l'outil a réellement trouvé, jamais qu'il a tourné sans erreur :
son seul critère de succès est le nombre de manquements réels remontés (et, tout aussi utile, le
nombre de fausses accusations qu'il évite).

| Date | Commits examinés | Manquements | Signaux non concluants | Règles non fournies | Ce qu'on en retient |
|---|---|---|---|---|---|
| 2026-09-22 (1er passage) | 10 | 6 | — (état inexistant) | 8 | **Six accusations, six fausses.** Les « consultations tardives » étaient des relances de vérification après migration. Correctif : origine `verification` écartée. |
| 2026-09-22 (2e passage) | 10 | 6 | — | 8 | Les six tenaient toujours, portées par des `cli_direct` antérieurs au correctif. Cause réelle trouvée dans la définition de cette origine : elle ne prouve aucune consultation. |
| 2026-09-22 (3e passage) | 10 | 0 | 6 | 8 | Après la séparation origine de jugement / origine non concluante : **zéro fausse accusation**, six signaux montrés sans imputer. Les 8 règles conversationnelles restent à fournir par l'appelant. |
