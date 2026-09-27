# Blueprint exportable — l'outil d'accueil d'un nouveau membre dans un paysage d'outils

*Patron générique, réutilisable sur n'importe quel projet où plusieurs registres doivent connaître
chaque outil. Ne suppose aucun outillage particulier : ni gestionnaire de tâches, ni crochets git,
ni fenêtres de questions — un fichier de code et des registres lisibles suffisent.*

## Le problème qu'il résout

Un paysage d'outils qui grossit finit par tenir plusieurs registres de ses membres : classification,
rôle, couverture de test, catalogue, calendrier, documentation. Chacun est protégé par un garde-fou
qui échoue si un membre y manque — et c'est une bonne chose.

Mais ces garde-fous **détectent** l'oubli, ils ne l'**évitent** pas. Faire entrer un outil devient
une série d'échecs successifs : on corrige, on relance, un autre tombe. L'agent (ou la personne)
reste le mécanisme d'intégration, et un mécanisme humain oublie.

Le chiffre qui a motivé ce patron sur son projet d'origine : **sept inscriptions manuelles** par
outil entrant, chacune révélée par un test rouge, jamais une seule anticipée.

## Le principe

**Inverser le moment, jamais remplacer le filet.** Les garde-fous restent tels quels. On ajoute un
outil qui répond, avant de commencer, à une question simple : *pour tel nouveau membre, quels
registres lui manquent encore ?*

Trois règles rendent la réponse fiable :

1. **Chaque registre se LIT, il ne s'énumère pas.** L'outil ouvre les fichiers réels et en extrait
   les membres déclarés. Une liste recopiée se périmerait au premier registre ajouté — ce serait
   reproduire, dans l'outil d'intégration lui-même, le défaut qu'il combat.
2. **Un lecteur par forme de registre, jamais une regex universelle.** Un registre indexé par clé,
   un registre listant des chemins et un registre nommant ses membres en toutes lettres n'ont pas la
   même forme. Une regex qui prétend couvrir les trois trouve surtout des faux positifs.
3. **Un garde-fou sur les lecteurs eux-mêmes.** Un lecteur dont la regex cesse de correspondre
   renvoie un ensemble vide, donc déclare tout le monde absent : un rapport spectaculaire et
   entièrement faux. Règle : un vrai registre contient plusieurs membres — en extraire zéro ou un
   signifie que le lecteur est cassé, jamais que le registre est vide.

## Ce qu'il donne en sortie

Pour chaque registre manquant : ce que ce registre gouverne (en langage clair, pas le nom de la
constante), le fichier à ouvrir, et **la ligne à écrire, prête à coller**. C'est là que se gagne la
facilité : une réponse qui dit seulement « il manque trois inscriptions » laisse tout le travail de
fouille à faire.

## Les deux pièges à déclarer

**L'exclusion volontaire.** Certains membres sont délibérément absents d'un registre (un outil qui
tourne déjà en continu n'a pas sa place dans un calendrier périodique). Si cette décision est écrite
quelque part, l'outil doit la lire et la compter comme renseignée — sinon il réclame une inscription
qui **déferait une décision documentée**. C'est le pire cas pour un outil censé aider : un conseil
faux mais net.

**Sa propre limite.** Aucun mécanisme ne peut obliger à le consulter. Ce que le code garantit, c'est
qu'une réponse demandée est exacte et complète. L'obligation de demander vit ailleurs — dans un
process écrit et surveillé. Le déclarer noir sur blanc vaut mieux que le laisser supposer.

## La généralisation à N types d'arrivant *(2026-09-27)*

**Le piège qu'un autre projet rencontrera exactement pareil** : on construit d'abord le parcours
d'arrivée de la chose la plus visible (ici, un outil), puis on découvre que dix autres sortes de
choses entrent sans parcours — des documents, des index, des indicateurs, des règles. La tentation
est d'écrire un outil par sorte.

**Ce qui rend la généralisation possible sans tout réécrire** : dans un parcours d'arrivée, la
mécanique et la liste sont deux choses séparées, et on ne s'en rend compte qu'en essayant de la
dupliquer. La mécanique tient en cinq gestes — lire la liste des endroits où l'arrivant doit être
déclaré, ouvrir chacun, y chercher l'arrivant, cocher, donner la ligne exacte à coller. Aucun de ces
cinq gestes ne dépend de ce qui arrive. Seule la liste en dépend.

**La forme à reprendre** : un registre `TYPES_D_ARRIVANT` qui associe chaque type à sa liste de
registres, et une fonction d'état qui prend la liste en paramètre plutôt que de la connaître. Le
registre se LIT partout — message d'usage, aiguillage, rapport — de sorte qu'un type de plus ne
demande de toucher à aucun des trois.

**Deux paramètres qu'on croit inutiles et qui deviennent indispensables au deuxième type** :

- le fichier à ouvrir peut DÉPENDRE de l'arrivant (l'index d'un document dépend de son dossier) ;
- ce qu'on cherche dans le fichier n'est pas toujours l'arrivant tel quel (un document se cite par
  son nom de fichier, pas par son chemin complet).

Les deux restent facultatifs, de sorte que les registres du premier type continuent de fonctionner
sans modification — c'est la condition pour étendre plutôt que réécrire.

**La règle de contenu, et c'est elle qui décide de la valeur du parcours** : n'y mettre QUE ce qui
se vérifie en lisant un fichier réel. Une obligation qu'on ne sait pas mesurer est une ligne de plus
dans un rapport, jamais une protection ; et annoncer un registre qui n'existe pas encore crée une
référence morte, qui rassure alors qu'elle ne mène nulle part.

**Le piège de conception mesuré sur ce projet, et il vaut d'être connu** : deux des registres du
type « indicateur » ont été écrits en supposant ce que contenaient deux documents. Lancés sur une
donnée vivante, ils ont rendu deux refus — les deux documents indexaient tout autre chose. Un
contrôle impossible à satisfaire se fait désactiver. **Ne jamais écrire une liste de registres sans
la lancer immédiatement sur un cas dont on SAIT qu'il est en règle.**

## Test de reprise

Une personne ou une IA qui arrive sur le projet, sans historique, peut-elle faire entrer un nouvel
outil correctement ? Si la réponse tient dans une commande, le patron a rempli son rôle.
