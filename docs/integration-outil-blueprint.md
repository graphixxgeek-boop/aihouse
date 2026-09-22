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

## Test de reprise

Une personne ou une IA qui arrive sur le projet, sans historique, peut-elle faire entrer un nouvel
outil correctement ? Si la réponse tient dans une commande, le patron a rempli son rôle.
