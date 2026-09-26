# lib-markdown-table — fiche d'instanciation

## Ce qu'il sert ici

`scripts/lib-markdown-table.mjs`, extrait le 2026-09-19 en construisant CLEAN-DIRTY-OLD — au moment
où la même logique de filtrage allait être réécrite une **troisième** fois, après ALWAYS-NEW-CODE et
HYPER-SCAN-CHECKPOINT.

## Ce qu'il lit dans ce projet

Les registres en table markdown : `docs/<outil>/index.md`, `docs/suivi/sessions/*.md`, les index KPI.

## Le défaut réel qu'il a coûté ici

Le 2026-09-24, le filtre d'en-tête d'un appelant écartait toute ligne contenant le mot
« Horodatage ». Une tâche dont la description citait `findHorodatagesFuturs()` devenait **invisible**
à la numérotation, et le compteur annonçait un numéro déjà pris. Corrigé en reconnaissant l'en-tête
à sa **première cellule** (`| N° |`), jamais à un mot présent quelque part dans la ligne.

## Sa limite ici

`numericColumn()` ignore une cellule non numérique plutôt que de la compter zéro — délibéré : un
zéro fabriqué se moyenne, une cellule ignorée se voit dans le compte.
