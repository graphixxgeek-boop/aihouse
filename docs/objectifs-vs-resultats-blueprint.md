# objectifs-vs-resultats — blueprint exportable

*(Surnom donné à l'instanciation de ce projet, 2026-09-21 : « R/O-Guardian ». Le blueprint générique
ci-dessous reste sous son nom technique — un surnom est une décision par projet, pas une propriété du
principe réutilisable.)*

Petit outil générique : un registre hand-maintained d'objectifs chiffrés (une valeur cible, par
entité, sur une période) confronté à un résultat mesuré par des outils DÉJÀ EXISTANTS dans le
paysage — jamais un second calcul divergent, jamais un audit indépendant.

## Le problème qu'il résout

Un objectif qu'on ne confronte jamais à son résultat n'est pas un objectif, c'est une intention.
Dans un paysage d'outils qui mesurent beaucoup, le manque est rarement la mesure — elle existe
déjà, éparpillée dans des compteurs et des historiques que personne ne rapproche d'une cible. Il
manque le geste, tout bête, de mettre les deux côte à côte et de dire *atteint* ou *en dessous*.

Ce patron ne fait que ça, et son intérêt tient entièrement à ce qu'il REFUSE de faire. Il ne
mesure rien lui-même : il lit un résultat déjà produit ailleurs. S'il mesurait, il produirait un
second chiffre, qui divergerait un jour du premier, et l'écart entre les deux mesures ferait
oublier l'écart qu'on voulait suivre.

**Le cas qui le définit vraiment est celui où il n'y a pas de donnée.** Une cible sans aucun signal
mesuré ne devient jamais un 0 % : elle est déclarée « pas de données », ce qui est une information
différente et bien plus utile. Un faux zéro ressemble à un échec et déclenche des décisions ; une
absence déclarée déclenche la seule bonne réaction — aller construire la mesure qui manque.

## Rôle et frontières

1. **Fixer un objectif** — un petit registre (table hand-maintained, jamais générée) associant une
   entité (un utilisateur, un script, un outil) à une valeur numérique cible sur une période donnée.
2. **Ne jamais mesurer soi-même un résultat** — ce module lit ce que le reste du paysage sait déjà
   (compteur d'usage, taux de couverture, figure du tableau de bord...). S'il n'existe aucun signal
   déjà mesuré pour une entité, ce module ne fabrique jamais une mesure de substitution : c'est un
   gap de conception à combler ailleurs, jamais ici par supposition.
3. **Calculer l'écart et un statut** — objectif vs résultat réel, rien de plus : pas de jugement
   RH, pas de recommandation d'action. Un système de gouvernance d'équipe (type CASSANDRA-RH dans
   ce projet) peut ensuite CONSOMMER ce que ce module dit, jamais l'inverse — l'organigramme reste
   plat, aucun outil de ce paysage n'a de sous-agent.

## Frontière avec un tableau de bord / KPI existant

Un tableau de bord mesure un résultat (« combien, quel taux, quelle tendance »). Ce module fixe une
CIBLE et calcule l'écart avec ce résultat — les deux rôles sont complémentaires, jamais fusionnés :
fusionner reviendrait à mélanger « ce qui s'est passé » et « ce qu'on voulait qu'il se passe » dans
un seul mécanisme, perdant la possibilité de faire évoluer l'un sans l'autre.

## Statuts

Trois statuts numériques (`atteint` / `en dessous` / `dépassé`, une égalité stricte comptant comme
`atteint`, jamais une marge arbitraire pour départager `atteint` de `dépassé`) plus un statut
honnête `pas de données` quand la source mesurée n'a produit aucun événement sur la période — jamais
une valeur fabriquée (0% ou 0) qui laisserait croire à un échec réellement mesuré.

## Ce qu'il n'est jamais

- Jamais un sous-agent d'un outil de gouvernance d'équipe — un Membre standalone de plus, au même
  titre que n'importe quel autre outil du paysage.
- Jamais une seconde mesure : chaque `Source` déclarée dans le registre pointe vers un signal déjà
  calculé ailleurs ; ajouter une nouvelle `Source` veut dire brancher ce module sur un signal
  existant, jamais lui faire recalculer quoi que ce soit lui-même.
- Jamais un audit de qualité de code (ce rôle reste aux Gardiens sacrés) ni un juge indépendant (ce
  rôle reste à un outil séparé type THE-FINAL-JUDGE) : uniquement objectif ↔ résultat ↔ écart.
