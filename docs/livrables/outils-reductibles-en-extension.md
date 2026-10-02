# Quels outils peuvent devenir une EXTENSION d'un autre

> **Ta question :** *« si aucune fusion d'outil n'est possible, est-ce que certains outils peuvent
> etre "reduits" ou "transformés" en EXTENSION d'un autre outil ? Bien sur sur ce sujet, toujours
> me demander avant d'agir, mais check stp »*
> **Ce document est le check.** Aucun regroupement n'a été fait, et aucun ne le sera sans ton
> accord. **Tâche :** #1479.

---

## LA RÉPONSE COURTE : OUI, ET C'EST DÉJÀ ARRIVÉ DEUX FOIS AUJOURD'HUI

Les deux mécanismes construits ce soir **ne sont pas des outils** :

- le détecteur de documents jamais envoyés est une **extension de data-archangel**, qui veillait
  déjà sur la circulation des données ;
- la question de confirmation à la Ronde est **une ligne de plus** dans un inventaire existant.

Chacun aurait pu devenir un script de plus. C'est d'ailleurs la règle écrite du projet : si un
outil couvre le besoin à moitié, **on l'étend**, on ne construit pas à côté.

---

## MAIS LA VRAIE QUESTION EST « QU'EST-CE QU'ON GAGNE ? », ET LA MESURE SURPREND

### Ce qu'on ne gagne PAS : du code

| Mesure | Chiffre |
|---|---|
| Outils dans le dépôt | **86** |
| Poids total | 98 838 lignes |
| Outils de moins de 300 lignes | 34 |
| Ce qu'ils pèsent ensemble | **5 % du code** |

**Absorber les 34 petits outils ne retirerait pas une ligne** — elles seraient déplacées, pas
supprimées. Et ça ne toucherait que 5 % du volume. **Si ton objectif était d'alléger le code, la
fusion d'outils est le mauvais levier**, et il valait mieux le savoir avant d'y passer une
semaine.

### Ce qu'on gagne vraiment : des FICHIERS À TENIR

Un outil ne coûte pas son script. Il coûte **son kit** :

| Pièce | Combien d'outils la portent |
|---|---|
| le script | 86 |
| son blueprint | 79 |
| sa fiche de référentiel | 79 |
| son dossier de registre | 62 |
| l'index de ce dossier | 62 |

**79 outils × 5 fichiers = 395 fichiers à tenir à jour**, pour l'outillage seul. Chaque
changement de comportement doit se refléter dans plusieurs d'entre eux le jour même.

**C'est ÇA, l'unité de gain.** Absorber un outil dans un autre libère **4 fichiers**, pas des
lignes. Et c'est cohérent avec ce que ta charte dit déjà : *« ce qui sature n'est pas le coût mais
le NOMBRE D'OBLIGATIONS »*.

---

## LES 25 CANDIDATS MESURÉS

**Trois critères, tous mécaniques** : moins de 300 lignes (absorbable à bas coût) · registre vide
ou inexistant (rien à migrer) · mais portant quand même un kit complet (donc coûtant des fichiers).

| Lignes | Outil | Registre |
|---|---|---|
| 18 | `execution-profile` | aucun |
| 24 | `sites-env` | aucun |
| 35 | `judge-persona-shared` | aucun |
| 50 | `lib-markdown-table` | aucun |
| 53 | `install-ci` | aucun |
| 61 | `lib-json` | aucun |
| 75 | `memento-weight` | vide |
| 82 | `the-deep-reader` | aucun |
| 95 | `find-brain` | aucun |
| 116 | `check-profil-utilisateur` | aucun |
| 119 | `simulation-visiteur` | aucun |
| 133 | `corpus-mesure` | aucun |
| 141 | `the-ghost` | vide |
| 144 | `api-providers` | aucun |
| 147 | `route-booster` | aucun |
| 155 | `gemini-key-health` | vide |
| 183 | `tasks-process-guardian` | vide |
| 194 | `modes-de-travail` | vide |
| 212 | `messages-courts` | aucun |
| 214 | `serie-temporelle` | vide |
| 253 | `cout-de-la-refonte` | vide |
| 255 | `check-profile` | aucun |
| 269 | `pnpm-install` | vide |
| 276 | `summarize-simulation-log` | aucun |
| 285 | `priorites` | aucun |

**Si tous étaient absorbés : 100 fichiers de kit en moins, 3 589 lignes déplacées.**

---

## MAIS TOUS NE DOIVENT PAS L'ÊTRE, ET VOICI POURQUOI

**Trois groupes très différents se cachent dans cette liste**, et les traiter pareil serait une
faute.

### Groupe ① — Les BIBLIOTHÈQUES *(6 candidats)*

`lib-json` · `lib-markdown-table` · `corpus-mesure` · `judge-persona-shared` ·
`execution-profile` · `find-brain`

**Ce ne sont pas des outils : ce sont des morceaux partagés** que d'autres scripts importent. Elles
n'ont ni commande, ni registre, et c'est normal. **Leur donner un kit complet était probablement
l'erreur** — pas les fusionner.

**Mon avis** : la bonne correction n'est pas de les absorber, c'est de reconnaître qu'une
bibliothèque n'a pas à porter le même kit qu'un outil. Ça allège 24 fichiers sans toucher à une
ligne de code.

### Groupe ② — Les outils d'ENVIRONNEMENT *(4 candidats)*

`install-ci` · `pnpm-install` · `sites-env` · `api-providers`

Ils servent à faire tourner la machine, pas à juger le projet. **Ils ne partiront probablement
jamais avec l'Agence** — la charte prévoit déjà cette exemption pour le script d'installation.

**Mon avis** : à exempter du kit avec leur raison écrite, pas à fusionner.

### Groupe ③ — Les vrais candidats à l'extension *(15 restants)*

Ceux-là rendent un jugement, ont une commande, et pourraient vivre dans un outil voisin. Quelques
rapprochements qui se voient à l'œil nu :

| Candidat | Hôte naturel | Pourquoi |
|---|---|---|
| `memento-weight` | `memento` | c'est littéralement sa mesure de poids |
| `check-profile` + `check-profil-utilisateur` | entre eux | deux profils, deux scripts, un seul sujet |
| `gemini-key-health` | `check-gemini-quota` (Smart Breaker) | la santé d'une clé et son quota sont le même diagnostic |
| `the-deep-reader` | `the-final-judge` | la fiche dit elle-même qu'il en est le cousin |
| `serie-temporelle` | `kpi-report` | la série temporelle n'existe que pour les KPI |

**Ce sont des pistes à l'œil nu, pas des recommandations mesurées** — et je le dis parce que la
différence compte : je n'ai pas vérifié, pour chacun, que l'hôte lit vraiment les mêmes données.

---

## CE QUE JE RECOMMANDE, ET CE QUE JE NE RECOMMANDE PAS

**Ce que je recommande :** commencer par le groupe ① — **reconnaître qu'une bibliothèque n'est
pas un outil**. Ça libère 24 fichiers, ça ne touche aucun code, c'est réversible, et ça corrige
une erreur de classement plutôt que de déplacer du travail.

**Ce que je recommande ensuite :** le groupe ②, pour la même raison.

**Ce que je ne recommande pas maintenant :** le groupe ③. Fusionner deux outils qui rendent chacun
un jugement, c'est risquer de perdre un angle — et ce dépôt a déjà écrit, à propos de deux outils
voisins, que *« les fondre ferait disparaître la vue d'ensemble derrière le tableau de
conformité »*. Chaque cas demande d'être instruit séparément.

**Et un avertissement qui vaut pour les trois groupes** : un outil fondu dans un autre **perd son
blueprint propre, donc sa capacité à partir seul**. Ça compte, puisque l'exportabilité est la
moitié du second projet.

---

# PLAN D'ACTION

| État | Constat | Suite |
|---|---|---|
| ✅ MESURÉ | les 34 petits outils ne pèsent que 5 % du code : la fusion n'allège pas le code | #1479 |
| ✅ MESURÉ | l'unité de gain réelle est le FICHIER DE KIT — 395 tenus à jour pour l'outillage seul | #1479 |
| ✅ MESURÉ | 25 candidats, répartis en trois groupes qui ne se traitent pas pareil | #1479 |
| ? À TRANCHER | **groupe ① — 6 bibliothèques : les dispenser du kit d'outil ?** (24 fichiers libérés, zéro code touché) | #1496 |
| ? À TRANCHER | **groupe ② — 4 outils d'environnement : les exempter avec leur raison écrite ?** | #1496 |
| ⏳ À INSTRUIRE | groupe ③ — 15 vrais candidats : chacun demande de vérifier que l'hôte lit les mêmes données | #1497 |
