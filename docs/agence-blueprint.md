# L'Agence Codex — le plan de l'Agence comme un tout

*(Créé le 2026-09-26, sur sa question : « est-ce que l'agence en elle-même est couverte par ce
principe de kit d'export ? ». La réponse mesurée était **non**, et pire : un contrôle affirmait le
contraire en vérifiant `docs/agence-exportable-conception.md`, qui dit lui-même n'être **pas** ça —
c'est le carnet d'idées du projet suivant. Un fichier présent n'est pas un fichier qui parle du bon
sujet.)*

**CE DOCUMENT EST LE PLAN DE LA MACHINE.** Les blueprints des outils sont des plans de pièces
détachées : quatre-vingts d'entre eux n'apprennent pas comment la machine tourne, par où l'on
commence, ni ce qui appelle quoi.

---

## 1. Ce que l'Agence est, en une phrase

**Un ensemble d'outils en ligne de commande qui vérifient un projet et se vérifient entre eux, et
dont aucun ne dépend d'un service extérieur pour rendre son verdict.** Elle ne produit pas le
produit : elle dit ce qui ne va pas dans la façon dont il est construit, et dans la façon dont elle
est construite elle-même.

## 2. Les cinq principes qui expliquent tout le reste

Un lecteur qui comprend ces cinq-là peut deviner la forme de n'importe quel outil de l'Agence.

**(1) Un outil ne dit jamais « tout va bien » sur des données absentes.** Chaque verdict porte
trois états et non deux : *trouvé*, *rien trouvé*, *pas pu regarder*. Les deux derniers se
ressemblent dans une sortie et appellent l'inverse l'un de l'autre. C'est la règle la plus violée et
la plus coûteuse : un vert rendu sur zéro donnée est indiscernable d'un vert mérité.

**(2) Un registre se LIT, il ne se recopie pas.** Toute liste qui reflète l'état d'un autre système
doit soit le lire à l'exécution, soit porter un garde-fou mécanique qui détecte l'écart. Un
commentaire promettant de « garder aligné avec X » n'est jamais une protection : c'est une
intention, et les intentions se périment en silence.

**(3) Le POURQUOI vit à côté du QUOI.** Un mécanisme qui semble redondant ou trop prudent se fait
supprimer par le prochain lecteur s'il ne porte pas la raison qui l'a fait naître. D'où des
commentaires longs, délibérément : ils racontent le défaut réel qui a coûté quelque chose.

**(4) Un garde-fou qui accuse à tort cesse d'être lu.** Chaque détecteur se vérifie dans les deux
sens : un cas qu'il DOIT attraper, et un cas proche qu'il doit laisser passer. Un détecteur qui
n'a jamais mordu ne prouve rien.

**(5) Le livrable est le FICHIER produit par l'outil**, jamais un texte écrit à la main à côté. Un
résultat qu'on ne peut pas rejouer n'est pas une mesure.

## 3. Les quatre couches, et comment elles s'appellent

```
  ① À CHAQUE COMMIT (gratuit, automatique — crochet post-commit)
     les Gardiens sacrés du code : scan de qualité, zéro coût, aucune décision
             │
             ▼
  ② À CHAQUE PASSAGE D'OUTIL
     le compteur d'usage : qui a réellement servi, cumul permanent
             │
             ▼
  ③ PÉRIODIQUEMENT (la « Ronde »)
     un orchestrateur lance les items déclarés, chacun dépose son rapport
     dans son propre registre, et un récapitulatif est rendu
             │
             ▼
  ④ SUR DEMANDE / EXCEPTIONNEL
     les audits lourds, les vérifications payantes, les scans profonds
```

**La règle de placement, et elle décide tout** : un contrôle rejoint la couche ① s'il est **gratuit
ET utile à chaque commit**. Sinon il rejoint ③. Un contrôle qui rendrait le même verdict vingt fois
de suite en couche ① cesserait d'être lu — c'est un critère de conception, pas de politesse.

## 4. Les organes centraux, et ce qui se casse sans eux

| Organe | Ce qu'il fait | Sans lui |
|---|---|---|
| **le point d'entrée du choix d'outil** | « pour cette tâche, quel outil sait déjà faire ça ? » | on relance toujours les trois mêmes outils, les autres deviennent des zéros d'usage |
| **l'orchestrateur périodique** | la liste des contrôles à repasser, et leur dépôt | tout dépend de la mémoire de l'agent — ce qui, d'une session à l'autre, veut dire rien |
| **le filet de sécurité** | la suite de tests, lancée avant chaque commit | les garde-fous se dégradent sans que personne ne le voie |
| **le registre des rapports** | qui écrit où, sous quelle forme, pour qui | un rapport produit n'est plus retrouvable, donc jamais relu |
| **le compteur d'usage** | qui sert vraiment | la question « peut-on supprimer cet outil ? » se répond de mémoire |
| **le suivi durable** | ce qui a été décidé, par qui, et pourquoi | chaque session recommence les mêmes débats |

## 5. Ce qui fait tenir l'ensemble : les boucles de vérification croisée

Ce qui distingue l'Agence d'une simple collection de scripts, c'est que **les outils se surveillent
les uns les autres** :

- un outil vérifie que chaque **registre déclaré** a bien un contrôle qui le lit ;
- un autre vérifie que chaque **outil déclaré** a bien un registre, une fiche, un plan ;
- un troisième vérifie que chaque **rapport** aboutit à une tâche, ou à un écart écrit ;
- un quatrième vérifie que les outils **enregistrent leur passage**, sans quoi leur zéro ment ;
- et un dernier vérifie que **les documents normatifs ne divergent pas** du code.

**C'est cette réciprocité qui doit être emportée en priorité.** Un outil isolé garde sa valeur ; le
réseau de vérification croisée est ce qui empêche l'ensemble de pourrir lentement, et il ne se
reconstruit pas tout seul.

## 6. Ce que l'Agence NE fait pas, et c'est délibéré

- **Elle ne corrige rien toute seule.** Elle signale, elle nomme, elle propose. La décision reste
  humaine — y compris quand la correction paraît évidente.
- **Elle ne juge pas le produit.** Le goût, la qualité narrative, les choix de design lui échappent
  entièrement : elle juge la façon dont le travail est mené.
- **Elle ne remplace pas la lecture.** Ses heuristiques trouvent les défauts grossiers ; les
  subtils se voient en lisant.

## 7. Ce qu'elle coûte

L'essentiel est **gratuit** : lectures de fichiers, comparaisons de registres, zéro appel à un
service payant. Trois catégories seulement coûtent, et elles sont déclarées à l'appel : les audits
délégués à un agent séparé, les vérifications qui interrogent un vrai modèle, et les scans profonds
qui exigent un raisonnement. **La séparation gratuit/payant est structurante** : c'est ce qui permet
à la couche ① de tourner à chaque commit sans qu'on y pense.

## 8. Pour l'installer ailleurs

→ `docs/agence-installation.md`, la procédure dans l'ordre.

## 9. Sa limite honnête

**Tout ce qui ne se joue que dans la conversation échappe à toute mécanique.** Qu'un agent ait
réellement lu avant d'agir, qu'il ait consulté le bon outil, qu'il ait posé ses questions : rien ne
peut l'intercepter. L'Agence le déclare plutôt que de le taire, et pose ces règles par écrit — **la
déclaration EST la protection**, faute de mieux. Un dépôt qui l'adopte doit savoir qu'il hérite de
cette limite avec le reste.
