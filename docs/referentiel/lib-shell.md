# lib-shell — fiche d'instanciation

## Ce qu'il sert ici

`scripts/lib-shell.mjs`, extrait le 2026-09-19 après avoir trouvé la **même fonction réécrite à
l'identique dans trois scripts** — `always-new-code.mjs`, `check-level-target.mjs`,
`hyper-scan-checkpoint.mjs`.

## Ce qu'il porte AUSSI dans ce projet, et c'est à savoir

Ce fichier a grossi : il ne porte plus seulement `sh()`. Il héberge aussi des registres partagés de
l'Agence — `AGENT_CATEGORIES` (l'organigramme), `GARDIEN_DOMAINS`, `TOOL_RELIABILITY`, la portée des
outils. **C'est un écart avec le blueprint, qui dit qu'un lanceur de commande ne doit pas devenir un
fourre-tout** — et il est déclaré ici plutôt que tu.

Conséquence concrète pour un export : `lib-shell` ne part pas seul. Ce qui est générique (le
lanceur) et ce qui est propre au projet (les registres) vivent dans le même fichier, et il faudrait
les séparer avant de l'emporter.

## Une correction déjà faite, qui ne se rediscute pas

**« Personnages » n'est pas une catégorie de l'organigramme** (2026-09-21, tâche #245). La confusion
venait d'avoir proposé d'appliquer un outil pensé pour la mémoire narrative de Lia et Noé comme
condition du badge des membres de l'équipe. Les personnages sont hors de l'équipe, jamais une 5ᵉ
catégorie.

## Sa limite ici

Il est **vital** au sens de l'Agence (tout le monde l'importe) et c'est précisément ce qui rend son
mélange générique/spécifique coûteux : il est le premier fichier qu'un export doit emporter, et le
premier à devoir être nettoyé.
