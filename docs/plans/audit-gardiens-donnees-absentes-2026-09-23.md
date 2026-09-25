# Les Gardiens peuvent-ils dire « tout va bien » sur des données absentes ? (tâche #206)

*(2026-09-23, travail pris en plus du plan de nuit — le plan était terminé, et le process autonome
prévoit qu'on pioche alors dans les tâches ouvertes non sensibles en le disant clairement. Celle-ci
est de la même famille que les quatre trouvailles de la nuit, donc elle capitalise dessus.)*

## La réponse courte

**Non au niveau qui compte, oui à un niveau plus bas — et la nuance est tout le sujet.**

Le crochet qui lance les Gardiens à chaque enregistrement **distingue déjà quatre états**, ce que je
ne savais pas avant de regarder :

```
✅ a tourné, rien trouvé      ⚠️n a trouvé n chose(s)
⚪ a tourné, mesure non chiffrable ici      💤 hors de son domaine
```

C'est exactement la discipline que cette tâche demandait, et elle est en place là où les Gardiens
sont réellement lancés. **Le mérite ne me revient pas et le dire est la moitié de l'audit** : mon
premier réflexe a été de compter les occurrences du mot « mesurable » dans les sept fichiers,
d'en trouver zéro sur six, et d'en conclure à un trou général. C'était faux. Un comptage de
vocabulaire n'est pas une mesure — la leçon L4 dans le rôle de l'accusé, pour une fois.

## Ce qui reste vrai, et qui est le vrai résultat

**Les détecteurs eux-mêmes ne peuvent pas distinguer, par construction.** Ils reçoivent une liste de
fichiers et rendent une liste de trouvailles. Une liste vide en entrée donne une liste vide en
sortie, et rien dans la valeur rendue ne dit si c'est « j'ai regardé, tout va bien » ou « on ne m'a
rien donné ».

Vérifié en les sondant pour de vrai, jamais supposé :

| Détecteur sondé sur une entrée vide | Ce qu'il rend |
|---|---|
| `findFuitesDeSpecificite`, `findOutilsSansBlueprint` (SAFE-EXPORT) | `[]` |
| `findDuplicateBlocks`, `findNearDuplicateBlocks` (CLONE-HUNTER) | `[]` |
| `addendaSignal`, `churnSignal` (ALWAYS-NEW-CODE) | `undefined` |
| `findThemesDivergingFromHarmonia` (ALWAYS-NEW-CODE) | un vrai verdict, non vide |

Les deux derniers sont les plus intéressants : `undefined` est **honnête** (ce n'est pas `0`), à
condition que l'appelant le traite comme tel.

## L'unique instance concrète trouvée, et sa portée exacte

`scripts/axa-check.mjs:360` écrit `Boolean(churnSignal(churn))`. Cette conversion transforme
« pas mesuré » (`undefined`) en « pas de signal » (`false`) — la confusion même que ce projet
traque.

**Mais sa portée est bornée, et le dire honnêtement compte plus que de gonfler la trouvaille** :
`churnFlag` ne sert qu'à AGGRAVER une note (`sensitiveNode || churnFlag` fait passer une fonction en
« à risque »). Un historique illisible produit donc une note **moins sévère**, jamais un « tout va
bien » sur une couverture qui serait mauvaise. C'est une sous-estimation de gravité, pas un faux
vert. Réel, à corriger, pas urgent.

## Ce que je n'ai PAS fait, et pourquoi

Je n'ai touché à aucun des sept Gardiens. Leur faire distinguer « rien reçu » de « rien trouvé »
demande de changer ce qu'ils RENDENT (une liste devient un objet avec un état), donc de toucher à
tous leurs appelants et à leurs tests. C'est un vrai chantier de conception, pas un geste de fin de
nuit — et sept Gardiens sacrés modifiés à trois heures du matin est exactement le genre de décision
que le périmètre sensible existe pour empêcher.

## Plan d'action

| Constat | État | Suite |
|---|---|---|
| Le crochet distingue déjà quatre états | **écarté** — rien à faire, c'est en place | — |
| Les détecteurs ne distinguent pas, par construction | **retenu — FAIT le 2026-09-25, tâche #858** | Tranché par l'utilisateur en fenêtre dédiée : « oui, les sept d'un coup », contre ma recommandation d'en faire un seul d'abord. **La crainte de ce plan — « changer ce qu'ils rendent touche tous leurs appelants » — a été SUPPRIMÉE plutôt que gérée** : le mécanisme est posé au niveau du CORPUS (`scripts/corpus-mesure.mjs`), en fonctions compagnes, donc aucune signature de détecteur n'a bougé et aucun appelant n'a été touché. Même patron que `churnSignalMesure()`. Les sept déclarent désormais ce qu'ils ont réellement regardé avant tout verdict, et un garde-fou du garde-fou (`findGardiensSansMesureDeCorpus`, câblé dans SAFE-EXPORT) refuse qu'un huitième naisse sans. |
| `Boolean(churnSignal(...))` à axa-check.mjs:360 | **retenu — FAIT le 2026-09-25, tâche #835** | `churnSignalMesure()` rend trois états (mesuré+signal / mesuré+rien / **pas mesuré**), la sévérité survit jusqu'au libellé, et l'absence de données git s'affiche au lieu de devenir `false`. Correction locale et bornée, comme ce plan l'avait cadrée : `churnSignal()` n'a pas changé de forme, donc aucun appelant historique n'est touché. |
| Mon propre réflexe : compter des mots au lieu de sonder | **retenu** | déjà consigné — c'est la façon dont cet audit a failli conclure faux |

---

## 2026-09-25 — le chantier est fait, et ce que le premier passage réel a appris

**Une décision de conception qui n'était pas dans ce plan, et qui change tout son coût** : le
mécanisme est posé au niveau du CORPUS, pas du détecteur. Chaque Gardien porte jusqu'à une douzaine
de détecteurs ; les instrumenter un par un aurait multiplié le travail par dix pour répondre dix
fois à la MÊME question, qui se pose une seule fois et en amont — **est-ce qu'on m'a donné quelque
chose à regarder ?** Si le corpus est vide, aucun détecteur ne peut rien conclure.

**Le troisième état s'est révélé plus riche que prévu.** Le plan en attendait deux (mesuré / pas
mesuré) ; le vrai paysage en demandait trois, parce qu'un corpus **AMPUTÉ** existe et qu'il est le
plus traître des trois : 1 fichier lu sur 77 rend un verdict qui a toutes les apparences d'un
verdict complet. Il est donc `mesurable: true` ET porteur de sa lacune.

**Et ce module a produit un FAUX ROUGE à son tout premier passage réel, dans l'outil écrit pour
empêcher les faux verts.** AXA-CHECK a annoncé « 22 fichiers analysés sur 56 attendus ». Vérifié
plutôt que cru : `LIB_MAP` fait 22 entrées et `AGENT_SCRIPT_FILES` 34, mais les seconds ont leur
PROPRE collecteur. J'avais additionné deux populations collectées séparément. **Un dénominateur
faux est aussi mauvais qu'un dénominateur absent, et il a l'air plus sérieux.** Corrigé, et gardé
en commentaire dans le code.
