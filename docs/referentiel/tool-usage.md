# tool-usage — fiche d'instanciation

*(Blueprint générique : `docs/tool-usage-blueprint.md` · script : `scripts/tool-usage.mjs` · registre : `docs/tool-usage/index.md`.)*

## Ce qu'il sert ici

`scripts/tool-usage.mjs` (tâche #166, 2026-09-21) : le compteur d'usage réel des outils de l'Agence.
Cumul **permanent** depuis le début du projet, jamais remis à zéro par session. Il nourrit
CASSANDRA-RH pour juger si un outil a toujours sa place.

## L'honnêteté déjà actée, et réutilisée à l'identique de SMART-CONSO-TOKEN

C'est un **journal auto-déclaré par l'agent lui-même**, jamais vérifiable mécaniquement : aucune
trace externe indépendante ne prouve qu'un outil a été sollicité. La discipline « solliciter les
outils » repose donc sur une obligation écrite, pas sur une mesure.

## Le défaut réel que cette limite a produit ici

Le 2026-09-26, `sauvegarde-projet` venait d'entrer au catalogue : le compteur s'est mis à le
regarder et le **verrou d'ouverture de Ronde a refusé** — il a une ligne de commande et
n'enregistrait rien. Son zéro ne disait pas « personne ne sauvegarde », il disait « personne ne
compte ». Corrigé à la source le jour même.

## Qui ferme cette faille ici

`tool-brain muets` (tâche #778) repère les outils qui ont une commande et n'appellent jamais
`recordCliUsage`, et le **verrou d'ouverture de Ronde** empêche une Ronde de démarrer tant qu'il en
reste un — sa décision du 2026-09-26 : « bloquer la Ronde, pas le commit ».

## Sa limite ici

Le journal n'est pas commité (`.tool-usage-history.json`) : il décrit l'usage sur CETTE machine.
Un export emporte le compteur, jamais son historique.

## La faille 8 de l'Article 31, enfin mécanique (2026-09-28, tâche #765)

**L'ARTICLE LA NOMME LUI-MÊME « LA PLUS VICIEUSE »** : « je cite un outil sans l'avoir lancé. Une
phrase comme *"d'après CASSANDRA..."* est invérifiable si l'outil n'a pas tourné. → Tout rapport
nomme l'outil ET l'horodatage réel de son passage, et le compteur d'usage en garde la trace. Un
outil cité sans passage enregistré est un outil qui n'a pas tourné. »

**LE COMPTEUR GARDAIT BIEN LA TRACE — ET PERSONNE NE LA CONFRONTAIT.** La preuve existait, le
vérificateur n'existait pas : exactement la forme d'obligation qui ne repose que sur la mémoire d'un
agent, et qui disparaît donc à la session suivante (Article 27).

`findOutilsCitesSansPassage(texte, slugsConnus, { history, now, auteur })`, branchée dans
`node scripts/tool-brain.mjs rapport` — chez tool-brain parce que c'est lui qui est « plugué
directement » à l'agent et qui délivre déjà le KPI d'usage à chaque Ronde.

### Ce que le premier passage a trouvé, et personne ne l'aurait vu autrement

**327 événements sur 4 931 — 6,6 % de l'historique, onze outils — portaient un `at` qui n'était pas
un nombre.** Trente et un appels écrivaient `recordCliUsage("slug", { origin: … })` alors que le
second paramètre est l'horodatage : l'objet devenait l'`at`. **Aucune erreur n'est jamais
apparue** — `recordCliUsage` avale ses exceptions par conception, pour ne jamais bloquer la vraie
sortie d'un outil — et une comparaison `at >= limite` sur un objet rend simplement `false`.
Résultat : **onze outils passaient pour n'avoir jamais tourné dans aucune fenêtre de temps, en
silence, depuis des semaines.**

**Corrigé à la CLASSE, jamais à l'occurrence** (leçon L37) :

- **l'API honore les deux formes d'appel.** Quand onze outils écrivent la même chose, c'est l'API
  qui manque, pas eux : un nombre reste un horodatage, un objet apporte `{ now, origin }` ;
- **`recordToolUsage` REFUSE un horodatage non numérique.** Le refus rend le défaut visible au test,
  là où le try/catch de l'appelant le rendait invisible en production ;
- **les 327 événements sont normalisés en `at: null, horodatagePerdu: true`**, jamais supprimés :
  ils prouvent qu'un outil a tourné, seule l'HEURE est perdue. Les jeter effacerait onze outils de
  leurs totaux d'usage.

### Le détecteur a dû être resserré trois fois, et chaque fois pour la même raison

Ma première version cherchait le simple **NOM** et accusait **neuf rapports sur douze** — dont
l'archive verbatim d'un prompt de l'utilisateur : elle reprochait à un texte de contenir les mots de
quelqu'un d'autre. Un garde-fou qui accuse tout le monde n'accuse plus personne (leçon L4).

| Exclusion | Le cas réel qui l'a imposée |
|---|---|
| **Seule une ATTRIBUTION compte** (« d'après X », « X signale ») | les mots mêmes de l'Article ; une liste, un plan au futur ou une citation ne prétendent rien |
| **L'auteur d'un rapport n'est pas une citation** | `safe-export` accusé dans SON PROPRE rapport, qu'il venait de produire |
| **Un INVENTAIRE énumère, il ne cite pas** | le rapport des kits nomme les 25 outils du parc parce que c'est son sujet — seuil **dérivé** : au-delà du tiers du parc connu |
| **Un horodatage perdu n'est pas une absence de passage** | les 327 réparés : on sait qu'ils ont tourné, on ne sait plus quand — troisième état, jamais un vert |

**C'EST LA TROISIÈME FOIS DE LA MÊME NUIT** que ce dépôt paie « une **MENTION** n'est pas un
**USAGE** » (leçon #832) : après les phrases de SAFE-EXPORT et les sections catalogue d'Abraham. La
classe est identique à chaque fois — **un signal ADJACENT lu comme le signal visé**.

**LA LIMITE, DÉCLARÉE** : il vérifie qu'un outil a TOURNÉ, jamais que ce qu'on en dit est exact — un
rapport peut citer un vrai passage et en tirer une conclusion fausse. Et il ne voit que les outils
qu'il connaît : un nom absent du registre des slugs lui est invisible.
