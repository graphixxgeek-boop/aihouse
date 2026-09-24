# EVAL-IA — registre des évaluations de l'agent

Le pendant d'EVAL-DEV, décidé le 2026-09-23 : « toi aussi, tu es évalué comme moi et tu as un
rapport, comme moi, et des tâches à accomplir pour t'améliorer si tu les acceptes, comme moi. »

Process complet : `docs/circle-process-detail.txt` Partie 10.

## Qui juge l'agent

| Source | Ce qu'elle apporte | Neutralité |
|---|---|---|
| Les 8 juges du socle commun | les mêmes outils que pour EVAL-DEV, mais retournés — ils ne mesurent pas la même chose sur les deux | mécanique |
| Les juges propres à l'agent | **discipline d'exécution en tête** : étapes sautées, annonces prématurées, rustines contre corrections à la racine, outils construits jamais lancés | mécanique |
| L'agent lui-même | son propre jugement, déclaré comme tel et jamais confondu avec une mesure | **aucune — c'est le piège** |
| Le système de Claude | suite de tests, crochets git, harnais | **totale** — le seul juge que ni l'un ni l'autre ne contrôle |
| L'utilisateur | via les questions de l'étape C, recueillies AVANT l'écriture du rapport | son jugement propre |

## Le piège, et pourquoi l'ordre des étapes le neutralise

Si l'agent écrit son propre rapport, il corrige sa propre copie. Trois garde-fous :

1. la moitié **mesurable** ne vient pas de lui — il ne contrôle pas ce que git, les tests et les
   gardiens de process disent ;
2. la moitié **jugement** vient de l'utilisateur, recueillie **avant** qu'il écrive — les questions
   de l'étape C ne sont pas une politesse dans l'ordre, elles sont ce qui empêche la complaisance ;
3. le **système de Claude** tranche sans aucun des deux.

## La section « LA RELATION »

Présente dans les DEUX rapports. Elle ne contient que les frictions où EVAL-DEV et EVAL-IA pointent
le **même événement par les deux bouts** — une friction n'y entre que si les deux rapports portent
réellement un constat sur elle. Inventer une friction pour remplir la section serait la formalité
que l'Article 28 interdit aux plans d'action.

## Historique

*(Une édition qui ne s'inscrit pas ici n'existe pas pour la mesure de progression. Ce n'est pas une
formalité : le 2026-09-24, `findEditionsEvalNonInscrites()` a trouvé que l'édition du 23 était sur
le disque depuis la veille pendant que ce tableau annonçait encore « première édition à la
prochaine Ronde » — un registre qui se déclare vide alors qu'il ne l'est pas. La ligne ci-dessous a
été écrite ce jour-là, à partir du rapport réel, jamais de mémoire. Le constat est désormais
mécanique : `node scripts/cassandra-rh.mjs evaluations`.)*

| Date | Édition | Constat le plus dur | Tâches acceptées |
|---|---|---|---|
| 2026-09-23 | Ronde GOAT MAX — discipline d'exécution en critère principal | 🔴 **« Tu lis les raccourcis plutôt que les documents »** (verdict de l'utilisateur) : 5 étapes de fin de Ronde sautées sur 8, puis 3 de plus au premier rattrapage, pour avoir lu les étapes déclarées dans le CODE du contrôleur au lieu du document de process. Deuxième occurrence d'une annonce prématurée après celle du 2026-09-22. | #679 (forcer la lecture du DOCUMENT avant l'étape — leçon L23, restée sans porteur) · #672 (une Ronde ne peut plus se clore avec son process non déroulé — fait le 2026-09-24) |

**Ce que l'inscription rétroactive a révélé, et c'est le vrai constat** : ce rapport n'avait produit
AUCUNE tâche. Sa conclusion — « avant toute étape d'un process, LIRE SON DOCUMENT, jamais sa
déclaration dans le code du contrôleur » — était écrite noir sur blanc et n'existait nulle part
ailleurs. Une évaluation qui se termine sur une résolution ne change rien : c'est exactement la
chaîne que l'Article 28 impose (`rapport → analyse → plan → tâches`), rompue au dernier maillon par
le rapport qui juge l'agent. `findTachesEvalFantomes()` vérifie désormais que chaque tâche citée
ici existe pour de vrai dans `docs/suivi/` — une référence morte ressemble à un lien, ce qui est
pire qu'une absence.
