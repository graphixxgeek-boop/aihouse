# STRATÉGIE DE CHANTIER — Outillage et garde-fous

*(Créée le 2026-09-26 06:15Z, liée à la tâche **#904**.)*

> **DÉCOULE DE :** `docs/strategies/strategie-globale-du-projet-entier.md`
> *stratégie de CHANTIER : elle passe par la stratégie globale, qui porte la direction d'ensemble
> et se règle elle-même sur la cible du projet entier
> (`docs/grand-projet/02-strategie/la-cible-2026-09-29.md`). L'alignement sur la cible n'est donc pas
> perdu : il est HÉRITÉ, au lieu d'être déclaré en sautant le niveau qui le porte.*
> *Rattachement corrigé le 2026-10-02 (tâche **#1434**) : jusque-là ces dix fiches déclaraient la cible
> directement, pendant que la stratégie globale affirmait de son côté que « les dix stratégies de
> CHANTIER passent par elle ». Les deux ne pouvaient pas être vrais en même temps.*


> **CE DOCUMENT NE RÉSUME JAMAIS.** Il AGRÈGE et il ORDONNE. Chaque idée y entre
> intégralement, entre guillemets, avec sa source. Trouver sa place dans la stratégie est
> le travail ; la raccourcir serait la perdre. En cas de conflit majeur entre une idée
> nouvelle et la stratégie en place, on ne tranche pas : on pose une question de calibrage.

## 1. POURQUOI CE CHANTIER

*l'intention d'origine, dans SES mots — jamais reformulée en vocabulaire d'agent*



« Cette famille pèse 17 tâche(s) ouverte(s) sur les 98 de la file, dont 1 critique(s) ou urgente(s), réparties sur 7 thème(s) : Outillage (8) · Coordination (3) · Compteur d'usage (2) · Crochet post-commit (1) · Filet (1) · tool-brain (1) · Veille (1). CE QUI MANQUE ICI, ET C'EST LE PREMIER À REMPLIR : l'intention n'a jamais été dite par l'utilisateur pour cette famille — elle a été DÉRIVÉE de la file le 2026-09-26, jamais énoncée comme un chantier. Tant que cette section ne porte pas SES mots, la fiche dit ce que la file contient, jamais ce qu'il veut en faire. C'est exactement la différence entre un inventaire et une stratégie. »

— source : dérivé de docs/suivi/ par « check-tasks-details themes » le 2026-09-26 — mesure, pas déclaration

## 3. LES IDÉES RETENUES

*intégrales, citées, jamais résumées — chacune avec sa source*



« Outillage / badge »

— source : docs/suivi/ — tâche #390, ouverte le 2026-09-22


« Outillage / renommage + revue »

— source : docs/suivi/ — tâche #571, ouverte le 2026-09-23


« Outillage / audit d'usage »

— source : docs/suivi/ — tâche #575, ouverte le 2026-09-23


« Outillage / renommage »

— source : docs/suivi/ — tâche #580, ouverte le 2026-09-23


« Outillage / CIRCLE-TASKS »

— source : docs/suivi/ — tâche #612, ouverte le 2026-09-23


« Outillage / Tâches C à F des failles IA — les quatre restantes, pour cette nuit »

— source : docs/suivi/ — tâche #695, ouverte le 2026-09-24


« Outillage / découpe »

— source : docs/suivi/ — tâche #705, ouverte le 2026-09-24


« Outillage / LE-COORDINATEUR dit si une fonction existe DÉJÀ avant d'en créer une »

— source : docs/suivi/ — tâche #746, ouverte le 2026-09-24


« Coordination / Deux packs du catalogue formulés en mêmes mots — tool-brain remonte les deux pour une seule question »

— source : docs/suivi/ — tâche #677, ouverte le 2026-09-24


« Coordination / catalogue »

— source : docs/suivi/ — tâche #714, ouverte le 2026-09-24


« Coordination / combinaisons d'outils »

— source : docs/suivi/ — tâche #715, ouverte le 2026-09-24


« Compteur d'usage / le garde-fou qui empêchera le prochain outil muet »

— source : docs/suivi/ — tâche #778, ouverte le 2026-09-25


« Compteur d'usage / la cause racine prise par son bout d'ÉCRITURE — et le garde-fou est tombé deux fois dans ce qu'il traque »

— source : docs/suivi/ — tâche #823, ouverte le 2026-09-25


« Crochet post-commit / 362 lignes que personne ne lit : raccourcir, ou hiérarchiser ? »

— source : docs/suivi/ — tâche #798, ouverte le 2026-09-25


« Filet / trois options chiffrées : ne rien faire, regarder les 3 plus lents, ou un mode rapide »

— source : docs/suivi/ — tâche #819, ouverte le 2026-09-25


« tool-brain / deux libellés de tâche réels ne rendent toujours AUCUN outil »

— source : docs/suivi/ — tâche #777, ouverte le 2026-09-25


« Veille / l'Agence a-t-elle des équivalents commercialisés ? »

— source : docs/suivi/ — tâche #771, ouverte le 2026-09-25

## 4. LES RECHERCHES ET TROUVAILLES

*ce qu'on est allé chercher dehors, et ce qu'on en a tiré*


**TROUVAILLE — La même faute payée TROIS FOIS dans ce dépôt, et la troisième était la pire.**
*(2026-09-27, tâche #902 — devenue la leçon L37.)*

La forme du défaut : **un plan porte le nom de l'OUTIL, jamais celui de son fichier.**
`scripts/check-argus.mjs` a pour plan `docs/argus-blueprint.md` ; Smart Breaker garde même
`docs/outil-resilience-api.md`, son nom d'avant le surnom. Toute fonction qui DÉRIVE le nom du plan
du nom du script accuse donc des outils parfaitement documentés.

| | Où | Ce que ça coûtait |
|---|---|---|
| 1 | LE-CLASSIFICATEUR | « SANS FICHE » sur 22 outils d'un coup, tous à tort |
| 2 | `findOutilsSansBlueprint()` (SAFE-EXPORT) | les mêmes accusés, le matin du 2026-09-27 |
| 3 | `mesurerLExportabilite()` (SAFE-EXPORT) | 6 outils « sans plan » — **et le taux d'exportabilité affiché en tête de rapport était faux d'autant** |

**Les deux derniers vivent dans le même fichier, à cinquante lignes d'écart, et quelques heures
séparent leurs corrections.** Corriger le deuxième n'a pas fait regarder le troisième.

**CE QUE ÇA IMPOSE À CE CHANTIER, et c'est sa conséquence la plus opérationnelle :** quand un
garde-fou est corrigé, la question suivante n'est pas « où l'ai-je vu ? » mais **« quel
RAISONNEMENT était faux ? »** — puis chercher ce raisonnement partout, **y compris dans le fichier
qu'on vient de refermer**. Ici la question avait une réponse mécanique : « qu'est-ce qui, dans ce
dépôt, DEVINE un chemin au lieu de le LIRE ? » (Article 24).

**L'endroit qui survit le plus longtemps est le plus haut placé.** Les deux premières occurrences
touchaient des listes qu'on relit ; la troisième produisait le CHIFFRE affiché en tête de rapport,
et personne ne remonte d'une conclusion vers son calcul. **Un chiffre de synthèse est le dernier
endroit où l'on cherche un bug, et c'est celui où il fait le plus de dégâts.**

Mesure : 77 plans trouvés sur 83 dus → **83 sur 83**, 100 % aux quatre niveaux de vitalité.


**CONSÉQUENCE DÉRIVÉE — deux bonnes pratiques nées le même jour, toutes deux sur ce terrain :**

- **BP5** — un seuil se DÉRIVE du corpus réel ; s'il ne peut pas l'être, il se DÉCLARE provisoire.
  Une estimation qui se fait passer pour une mesure n'est jamais rediscutée, parce qu'elle a l'air
  d'avoir déjà été tranchée.
- **BP6** — avant de remplir un registre à la main, chercher si la preuve est DÉJÀ écrite dans le
  dépôt. Un registre semé cite sa preuve ligne par ligne et se vérifie ; un registre tapé affirme.

*(Texte intégral des trois entrées : `docs/referentiel/lecons.md`, L37 · BP5 · BP6.)*
