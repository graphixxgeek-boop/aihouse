# Ronde ↔ État des tâches — comparaison côte à côte

*(Livrable du 2026-09-23, chantier 4 du plan de nuit. Demandé explicitement : « redonne-moi le
process en vigueur pour le rapport des tâches uniquement, dans circle : je veux voir s'il correspond
ou si on doit harmoniser. On ne touche pas au process établi dans circle pour l'instant. »*
**RIEN N'A ÉTÉ MODIFIÉ DANS LA RONDE.** Ce document décrit, il n'applique pas.)*

---

## PARTIE 1 — DE QUOI DÉCIDER VITE

**La question à trancher, en une phrase** : deux dispositifs lisent les mêmes tâches. Faut-il les
fusionner, en supprimer un, ou les garder tous les deux ?

**Ma recommandation : les garder tous les deux, parce qu'ils ne répondent pas à la même question.**

| | Ronde (`check-tasks-report`) | État des tâches (nouveau process) |
|---|---|---|
| **Déclenché par** | le calendrier — à chaque Ronde | **toi**, quand tu le demandes |
| **Répond à** | « rien n'a-t-il dérivé pendant que je travaillais ? » | « **qu'est-ce qu'on fait maintenant ?** » |
| **Tu interviens** | non, tu lis | **oui, tu flagues et tu réordonnes** |
| **Se solde par** | un signal archivé | **la file réellement réorganisée** |
| **Durée** | quelques secondes | un vrai moment d'attention |

**Ce qui les distingue vraiment** : la Ronde SURVEILLE, l'état des tâches DÉCIDE. Fusionner les deux
ferait perdre l'un des deux — soit la surveillance deviendrait une cérémonie qui te réclame une
décision à chaque passage, soit la décision se diluerait dans une routine que tu survolerais.

**Ce que je te propose de trancher** (trois options, la première est ma recommandation) :
1. **On garde les deux, tels quels.** Zéro travail. Le seul défaut : la Ronde ne dit jamais « tu
   devrais peut-être faire un état des lieux complet ».
2. **On garde les deux, et la Ronde apprend à te le proposer** quand elle détecte que la file a
   dérivé (beaucoup de tâches ouvertes, ou de la stagnation). Petit travail, vrai gain.
3. **On fusionne** : la Ronde déclenche l'état complet. Le plus simple à décrire, et le plus
   coûteux à vivre — une fenêtre de décision à chaque Ronde finit par être cochée sans lire.

---

## PARTIE 2 — LE DÉTAIL

### Le process de la Ronde sur les tâches, tel qu'il est aujourd'hui, mot pour mot

> **Poste** : `check-tasks-report` · thème « Suivi des chantiers »
> **Label** : « check-tasks-details — rapport de Ronde (chiffres vérifiés, état du projet, œil
> critique, 3 zooms) »
> **Coût** : gratuit — relecture seule de `docs/suivi/`, zéro appel API
> **Exécution** : « Appeler `buildRondeTextReport()` — jamais un second calcul des chiffres du
> suivi — et écrire le texte via `recordCircleItemReport('check-tasks-report', ...)`. Lire ensuite
> la **PARTIE 3 (œil critique)** : chacun de ses constats doit rejoindre la série de questions à
> choix forcé de l'Étape 5, jamais rester dans le fichier seul. »

**Ce qu'il fait réellement** : quatre parties, dont l'état détaillé à trois zooms, et un œil critique
dont les constats sont obligés de remonter en questions à l'Étape 5 de la Ronde.

### Le process « état des tâches », tel qu'il vient d'être écrit

Onze étapes (branche complète), documentées dans `docs/etat-des-taches-process-detail.md`. Son but
ultime est **réorganiser la file**, pas produire un rapport.

### Ce qui se RECOUVRE — et c'est peu

| Élément | Ronde | État complet | Verdict |
|---|---|---|---|
| Lire `docs/suivi/` sans le recalculer | oui | oui | **même source, aucun conflit** |
| Produire des chiffres | oui | oui | **les mêmes chiffres** — pas de contradiction possible |
| Les trois zooms | oui | repris tels quels | recouvrement réel, volontaire |
| Un œil critique sur ce qui ne va pas | oui | oui | recouvrement réel |

### Ce qui DIVERGE — et c'est l'essentiel

| Élément | Ronde | État complet |
|---|---|---|
| **Étiqueter les tâches** | non | **oui, c'est son cœur** |
| **Réordonner la file** | non | **oui, c'est son but** |
| Un document archivé comparable dans le temps | non (un signal) | **oui, avec index** |
| Une partie « de quoi décider vite » en tête | non | **oui, exigée** |
| Une mini-frise de l'ordre retenu | non | **oui** |
| Proposer d'enchaîner sur la tâche suivante | non | **oui** |

### Ce qui MANQUE dans l'un ou dans l'autre

- **La Ronde ne sait pas dire qu'un état des lieux complet serait utile.** C'est le seul vrai trou,
  et c'est l'objet de l'option 2 ci-dessus.
- **L'état complet ne tourne jamais tout seul.** C'est voulu — il demande ton attention, donc le
  déclencher sans toi produirait un document que personne n'ouvre.

### Le risque de double emploi, mesuré plutôt que supposé

Aucun aujourd'hui : les deux lisent la même source par la même fonction, donc **ils ne peuvent pas
se contredire**. Le risque n'est pas la divergence des chiffres, c'est la **lassitude** — deux
rapports sur les tâches, dont un que tu n'as pas demandé.

---

## PARTIE 3 — PLAN D'ACTION

| Constat | État | Suite |
|---|---|---|
| Les deux dispositifs ne répondent pas à la même question et ne se contredisent pas | **écarté** — rien à corriger, et la raison est écrite : fusionner ferait perdre l'un des deux | — |
| La Ronde ne sait pas proposer un état des lieux complet quand la file a dérivé | **à trancher** — c'est l'option 2, et elle ne se décide pas sans toi | en attente de ta réponse |
| Le process « état des tâches » n'a encore jamais été lancé avec toi | **retenu** | sa première exécution réelle avec flagage attend ton réveil |
