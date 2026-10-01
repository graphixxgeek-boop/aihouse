# CE QUI RESTE VRAIMENT À FAIRE — sa question, mesurée sur les 114 tâches ouvertes

*(2026-10-01, heure LUE, source système. Sa question : **« qu'est-ce qu'il manque en vrai ? »** —
posée après avoir répondu (a) à Q14.5 : la refonte vaut le coup.)*

> **DÉCOULE DE :** `docs/fils/fil-14-usage-et-refonte.md`
> *il instruit Q14.5 et Q14.6 ; il ne tranche rien à sa place.*

---

## SA QUESTION, ET ELLE EST MIEUX POSÉE QU'IL NE LE CROIT

> *« regarde ce qu'il reste à faire POTENTIELLEMENT en admettant que la phase GRANDE ÉVOLUTION
> [...] et dis-moi ce qu'il reste à faire en dehors de ça et en dehors du jeu ? pas grand-chose je
> pense [...] on n'est pas si loin d'avoir une agence complète, et même, en regardant les choses
> de haut, tu ne trouves pas ? »*

**Son intuition est juste à 63 %, et le chiffre exact a un intérêt.**

---

## LE PARTAGE DES 114 TÂCHES OUVERTES

*(Classement fait À LA MAIN après lecture des 114 titres un par un — **déclaré manuel, jamais
dérivé**, parce qu'aucun signal mécanique ne dit si une tâche appartient à la Grande Évolution.)*

| Famille | Tâches | Part |
|---|---|---|
| **GRANDE ÉVOLUTION** *(rationalisation, modularisation, stratégies, renommage, allègement de la charte)* | **57** | **50 %** |
| **LE RESTE** *(hygiène de l'outillage)* | **43** | **38 %** |
| **EXPORT & COMMERCIALISATION** | **11** | **10 %** |
| **LE JEU** | **3** | **3 %** |

**La moitié de la file est déjà dans la Grande Évolution.** Et le Jeu, qui est l'un des deux
produits, pèse **trois tâches ouvertes sur cent quatorze**.

### CE QUE SON INTUITION ATTRAPE, ET QU'IL FAUT CONFIRMER

**Une grande partie du « reste » disparaîtra par construction si on repart à zéro.** Ce n'est pas
une supposition : c'est écrit dans une tâche ouverte depuis le 28 septembre, **#1114** — *« rien
ne relie une tâche à un chantier — et le plan du grand changement va en rendre beaucoup
caduques »*. Les 43 tâches d'hygiène sont très majoritairement des **réparations de l'existant** :
un doublon à factoriser, un motif qui ne s'accorde pas avec lui-même, un fichier de 12 052 lignes
à découper. **Un code réécrit proprement ne les hérite pas.**

### CE QUE SON INTUITION NE VOIT PAS, ET C'EST LE CŒUR DE LA RÉPONSE

> **Personne n'a jamais défini ce que « terminée » veut dire.**

La tâche **#1132** est ouverte depuis le 28 septembre, classée **PRIORITAIRE-OBLIGATOIRE**, et
c'est **sa propre commande** : *« quand pourra-t-on statuer que l'agence est terminée ? Quel est
le signal ? OBJECTIF : fixer une borne. »*

**Elle n'a jamais été faite.** Donc quand il demande « on n'est pas si loin d'une agence
complète ? », **il me demande de juger une distance par rapport à un point qui n'existe pas.**
Toute réponse chiffrée que je donnerais à « combien reste-t-il ? » serait inventée.

**Ce n'est pas une esquive : c'est la trouvaille.** Et elle est plus utile que le compte des
tâches, parce qu'elle explique pourquoi la question revient : **tant que la borne n'est pas
posée, « est-ce fini ? » ne peut recevoir qu'une impression.**

---

## CE QUI MANQUE VRAIMENT — quatre choses, et aucune n'est une tâche d'hygiène

### ① LA BORNE elle-même — *« qu'est-ce qui dirait que c'est fini ? »*
Tâche #1132, sa commande, jamais exécutée. **C'est le préalable de tout le reste de ce document.**

### ② LE SEUL TROU D'ARCHITECTURE NOMMÉ — tâche #1120
L'audit l'appelle *« le Transaction Engine — le seul vrai trou de l'architecture »*. Il est
ouvert, il est nommé, et il n'est pas d'hygiène : c'est une pièce manquante.

### ③ LA PORTABILITÉ — mesurée, et c'est le désordre réel
**38 fichiers sur 40 portent des chemins écrits en dur**, et **aucun point de branchement
n'existe** pour accueillir ou retirer une source extérieure. L'Agence est à **94 %** indépendante
d'un fournisseur, et pourtant **elle ne sait pas déménager**. **C'est exactement ce qu'une
refonte corrigerait à la source** plutôt qu'en 38 réparations.

### ④ LA PREUVE EXTÉRIEURE — et c'est la plus gênante
**L'Agence n'a jamais été installée ailleurs. Pas une fois. Personne d'autre que nous deux ne
l'a jamais utilisée.** Ce n'est pas une tâche qu'on coche : c'est la seule chose qui puisse
transformer un *« ça marche chez nous »* en *« ça marche »*.

---

## SUR CASSANDRA — son intuition est bonne, la vérification reste à faire

Il écrit : *« je pense qu'elle est déjà finalisée en vrai, à peu de choses près »*. **Son rapport
complet a été lu — il met plus de deux minutes à tourner — et il lui donne raison.**

| Ce que CASSANDRA mesure | Résultat |
|---|---|
| membres certifiés | **55 / 55** |
| tâches ouvertes la concernant | **0 sur 114** |
| tendance « membres certifiés » | en amélioration |

**Elle est donc finie en tant qu'OUTIL.** Mais son rapport, lui, signale deux tendances **en
dégradation** — et ce n'est pas elle qui va mal, c'est ce qu'elle regarde :

- **les outils à reconsidérer** : `check-spirit` n'a pas été sollicité. *(Et l'outil déclare sa
  propre limite : son journal ne couvre que 45 heures, donc « jamais vu sur cette fenêtre » n'est
  pas « jamais utilisé ».)*
- **les trous de couverture de test** : `check-spirit` à **0 %**, `doc-report` **jamais scanné**.

**La distinction compte pour sa question** : CASSANDRA est terminée ; **ce qu'elle surveille ne
l'est pas**. Un outil fini qui annonce des dégradations fait exactement son travail — et son
verdict renforce la réponse ① plus haut : sans borne, « terminé » reste une impression.

**Un chiffre de son rapport mérite d'être relevé au passage** : la robustesse du code est à
**81,24 %, en baisse de 18,6 points**. Je ne l'instruis pas ici — ce n'est pas le sujet de ce
document — mais le signaler vaut mieux que de le laisser passer dans une sortie que personne ne
relit.

---

## Q14.6 — L'HYPOTHÈSE DU JEU, VÉRIFIÉE

**Sa question, reformulée simplement** : *« peut-on recopier le jeu tel quel dans une version
neuve, sans le retoucher ? »* Je ne la lui reposais pas pour arbitrer : je demandais seulement
s'il fallait la vérifier **avant** de chiffrer le reste, parce qu'elle change beaucoup le total.
Il a répondu « avance de manière fiable ». Voici la mesure.

| | |
|---|---|
| fichiers du Jeu *(`app/`, `lib/`, `components/`)* | **93** |
| lignes | **12 531** |
| fichiers du Jeu qui citent l'outillage (`scripts/`) | **6** |

**Son hypothèse tient, et largement.** 87 fichiers sur 93 ne mentionnent même pas l'outillage :
ils se recopient sans réflexion. **Six seulement portent un lien à vérifier** — et « citer » n'est
pas « dépendre », donc six est un plafond, pas un coût.

**Ce que ça veut dire pour la refonte** : le Jeu n'est pas le gros morceau. **12 531 lignes
copiables** d'un côté, et de l'autre un outillage de 85 scripts dont un seul fichier pèse
**12 052 lignes** à lui tout seul (#793). **Le travail de refonte est presque entièrement du côté
de l'Agence**, ce qui est cohérent avec sa proposition — c'est bien l'Agence qu'il veut
rationaliser.

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Ce qu'il devient |
|---|---|---|
| 50 % des tâches ouvertes sont déjà dans la Grande Évolution ; le Jeu en pèse 3 % | **RETENU** | ce document, tâche **#1351** |
| Personne n'a défini ce que « terminée » veut dire — sa propre commande, jamais exécutée | **RETENU** | tâche **#1132**, déjà ouverte et PRIORITAIRE-OBLIGATOIRE : elle devient le préalable |
| Son hypothèse sur le Jeu tient : 87 fichiers sur 93 sans aucun lien à l'outillage | **RETENU** | entre dans le chiffrage de la refonte, tâche **#1344** |
| CASSANDRA est bien finie — 55/55 certifiés, 0 tâche ouverte — mais ce qu'elle SURVEILLE se dégrade | **RETENU** | tâche **#1352** : `check-spirit` à 0 % de couverture et `doc-report` jamais scanné |
| La robustesse du code annoncée à 81,24 %, **en baisse de 18,6 points** | **À TRANCHER** | relevé au passage, hors sujet de ce document — à instruire, jamais à laisser passer |
| Le chiffrage complet de la refonte | **RETENU** | tâche **#1344**, en cours — ce document en est la première moitié |
