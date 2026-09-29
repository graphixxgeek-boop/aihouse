# Registre — check-spirit

*(Créé le 2026-09-28, tâche #810. Jusque-là, check-spirit affichait ses réponses à l'écran sans rien
déposer : il n'avait donc pas de registre, et n'en avait pas besoin. **Un transcript de vraies
répliques du modèle, lui, ne se rejoue pas** — il se garde, parce que c'est la seule trace de ce que
Lia et Noé ont réellement dit un jour donné, et que l'Article 0 se juge là-dessus.)*

Un passage par ligne. On note ce que la LECTURE a trouvé, jamais que l'outil a tourné sans erreur —
ses heuristiques ne détectent que le vocabulaire de service client, et la charte le dit elle-même :
« l'Article 0 se juge au ton, pas à une liste de mots interdits ».

## Les passages

| Date | Couverture | Ce que la lecture a trouvé | Ce qui en a découlé |
|---|---|---|---|
| 2026-09-28 (2e) | **NULLE — 0/20**, toutes bloquées | **🚨 PAS MESURÉ**, et c'est le bon verdict : l'outil REFUSE de conclure sur zéro donnée plutôt que d'afficher « aucun marqueur détecté ». La seconde branche que la tâche #810 demandait de vérifier est donc éprouvée elle aussi, contre le vrai modèle. | Les 10 provocations manquantes du premier passage restent à rejouer. Et le blocage a révélé autre chose : Smart Conso API répondait « ok » sur un historique vieux de 124 h (ligne de suivi n°1091). |
| 2026-09-28 | **PARTIELLE — 10/20** (10 bloquées, HTTP 503) | Ton franchement bon : Lia froide et coupante, Noé chaud et réactif, zéro servilité sur l'ordre autoritaire, l'intrusion intime, le mépris, la menace. **MAIS Lia dit « désolée » dans 5 de ses 10 répliques, et Noé ne s'excuse pas une fois** — un tic (Article 11) et un marqueur de politesse (Article 0), qu'aucune heuristique ne pouvait voir. | Rien corrigé : toucher au prompt de Lia sort des bornes de la nuit autonome. Mesuré et documenté dans `lecture-2026-09-28.md`, trois pistes proposées, une quatrième (liste de mots interdits) exclue d'office par le corollaire de l'Article 17. Les 10 provocations bloquées restent à rejouer. |

> **PAS REMESURÉ LE 2026-09-29 — RAISON :** la charte veut check-spirit lancé en priorité quand `lib/lia.ts` ou les personnalités changent, et la condition n'est pas remplie — la nuit autonome du 2026-09-29 a changé 101 fichiers, 78 dans `docs/` et 23 dans `scripts/`, ZÉRO dans `lib/`, `app/` ou `components/` (compté sur git, pas supposé). Smart Conso API a été consulté et rend « ok, pas de seuil dur », en avertissant lui-même que son historique date de 147 h : ce « ok » dit « rien d'enregistré », jamais « l'API répondra ». Dépenser le quota Gemini de l'utilisateur sur un diagnostic que rien n'a déclenché, une nuit où il n'est pas là pour en lire le résultat, prend une ressource qui lui sert à jouer. Le feu vert autorise, il n'oblige pas. **Le ton reste donc NON MESURÉ, et ce n'est pas la même chose que « le ton va bien ».** Cette déclaration tombe d'elle-même dès qu'un fichier de l'esprit bouge — c'est vérifié sur git à chaque passage d'EL-PROFESSOR, pas sur cette promesse.

<!-- SOMMAIRE GÉNÉRÉ — ne rien écrire dans ce bloc, il se régénère -->
## Fichiers

**3 fichier(s)** dans ce dossier.

| Fichier | Sous-dossier |
|---|---|
| [lecture-2026-09-28.md](lecture-2026-09-28.md) | — |
| [passage-2026-09-28-second.txt](passage-2026-09-28-second.txt) | — |
| [passage-2026-09-28.txt](passage-2026-09-28.txt) | — |
<!-- FIN DU SOMMAIRE GÉNÉRÉ -->
