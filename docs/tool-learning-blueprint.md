# TOOL-LEARNING — l'apprentissage de l'outillage, et celui de l'agent à son égard — blueprint exportable

*(Blueprint générique réutilisable tel quel : il ne connaît rien du domaine, seulement des outils qui
gardent ou non une mémoire, et un agent qui les corrige ou non.)*

## Le problème qu'il résout

Un paysage d'outils peut être parfaitement équipé et parfaitement immobile. Chaque outil a sa
mémoire, ses rapports, ses garde-fous — et aucun ne devient meilleur. Personne ne le voit, parce que
les outils qui jugent l'équipe jugent un **état**, jamais une **trajectoire**.

Et une question n'est posée nulle part : **est-ce que l'agent aide réellement les outils à
progresser ?** C'est un angle mort entier, et le seul qui ne peut aller nulle part ailleurs.

## La distinction fondatrice : mémoire ≠ apprentissage

Un outil peut écrire un registre et ne jamais le relire. L'outil RH le verra équipé ; celui-ci le
voit immobile. C'est le verdict **« archive seulement »**, que le jugement d'état ne peut
structurellement pas rendre.

## Les quatre preuves, de natures séparées

| Preuve | Nature | Ce qu'elle établit |
|---|---|---|
| il relit sa propre mémoire | autonome | la plus dure à contester, la plus facile à vérifier |
| son taux de trouvaille s'améliore | autonome | un progrès réel — à lire à côté de l'état du code |
| ses faux positifs diminuent | autonome | sa fiabilité, à condition qu'ils soient enregistrés |
| l'agent l'a corrigé ou enrichi | **enseigné** | l'apport de l'agent, jamais celui de l'outil |

**Les natures ne s'additionnent jamais.** Un outil beaucoup corrigé est **enseigné, pas apprenant** —
les confondre flatterait l'outil et l'agent en même temps.

## Comment il apprend lui-même

Il **enregistre ses verdicts et vérifie s'ils se confirment**. Un outil jugé immobile qui progresse
ensuite *sans intervention de l'agent* réfute le critère, pas l'outil. Si l'agent est intervenu entre
les deux passages, le progrès **confirme** le verdict au contraire.

C'est la seule forme d'apprentissage qui ne soit pas une posture. L'alternative — ajuster ses propres
seuils — produirait un outil toujours satisfait de lui-même, dont plus personne ne saurait ce qu'il
mesure.

## Garde-fous et limites honnêtes

- **Il refuse de juger sous trois passages.** Une trajectoire ne se lit pas sur un point.
- **Un piège déclaré** : un outil qui trouve moins parce que le CODE s'est amélioré paraîtrait
  régresser. La baisse se lit toujours à côté de l'état du code, jamais seule.
- **Double filtre avant qu'une tâche existe** : l'agent retient la proposition, ET une validation
  humaine doit être nécessaire. Sans lui, l'outil inonde le suivi — et une liste inondée ne se lit
  plus, ce qui détruit la valeur que la chaîne rapport → tâche protège.
- **La proposition la moins coûteuse d'abord.** Proposer le chantier le plus lourd à un outil qui n'a
  aucune preuve est le meilleur moyen que rien ne soit jamais fait.

## Sa place dans un paysage

Il forme avec deux voisins un trio dont il est la **dérivée** : l'un juge l'état de l'équipe, l'autre
l'exportabilité du code, tous deux **à un instant**. Lui seul a un axe de temps, et prend leurs
sorties comme entrées. Conséquence à connaître avant de le construire : **il ne vaudra que ce que
valent leurs historiques.**
