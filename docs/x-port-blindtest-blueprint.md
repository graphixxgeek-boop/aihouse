# X-Port BLINDTEST — blueprint générique : éprouver à l'aveugle la QUALITÉ d'un kit d'export

*(Blueprint réutilisable sur un autre projet. Instanciation : `docs/referentiel/x-port-blindtest.md`.)*

## Le trou qu'il ferme, et c'est la mesure de complétude qui le déclare elle-même

Un dispositif qui vérifie que chaque outil possède ses pièces de documentation finit par annoncer
100 %. Ce chiffre est vrai et il ne dit rien : il **compte des pièces présentes, il ne lit jamais
leur contenu**. Rien, dans un tel dispositif, ne peut dire si une seule de ces documentations décrit
fidèlement le code qu'elle accompagne.

Et c'est le défaut le plus cher de tous, parce qu'il est invisible à l'arrivée : **une documentation
qui ment est pire qu'une documentation absente.** L'absence se voit et fait ouvrir le code ; le
mensonge se lit, se croit, et ne fait rien ouvrir du tout.

## Le déplacement obligatoire : on ne reconstitue pas le code

L'intuition naturelle est « qu'on reconstruise le code depuis le kit, et qu'on compare ». Elle bute
sur un fait : **le code EST une des pièces du kit.** Celui qui reçoit le kit a déjà le code.

Ce qui peut vraiment se mesurer est la question d'à côté, et c'est la bonne :
**la documentation dit-elle la vérité sur le code ?**

## Le dispositif, en trois temps, et l'ordre ne se réarrange pas

| Temps | Qui | Coût |
|---|---|---|
| 1. tirer le sujet et assembler le dossier aveugle | le script | gratuit |
| 2. annoncer ce que le code doit contenir | un agent séparé, **sans jamais voir le code** | coûteux |
| 3. comparer au vrai code et conclure | le script | gratuit |

**Le raisonnement appartient à l'agent, la MESURE appartient au script.** C'est ce qui distingue ce
dispositif d'un audit en prose : un verdict qu'on ne peut pas rejouer ne vaut rien sur ce sujet-là,
et un rapport écrit à la main peut toujours s'arranger en se racontant.

## L'isolement est tout le dispositif

L'agent reçoit **les documents écrits, et rien d'autre**. Deux pièces lui sont cachées, et la raison
de chacune s'écrit à côté, faute de quoi la prochaine relecture les rajoutera « pour être complet » :

- **le code** — c'est la réponse ;
- **la liste des dépendances** — elle est EXTRAITE du code, donc la donner souffle une partie de la
  structure qu'on demande de deviner.

Un agent qui a vu le code ne teste plus rien, et rien dans le résultat ne le signalerait.

## Deux chiffres, JAMAIS additionnés

| Le chiffre | Ce qu'il dit | Comment on le répare |
|---|---|---|
| **RAPPEL** | ce que le code fait et que la documentation tait | en complétant |
| **BRUIT** | ce que la documentation laisse croire et que le code ne fait pas | en corrigeant une affirmation fausse |

Les fondre en une note perdrait exactement ce qui décide de l'action — et une note unique est
toujours ce qu'on demande en premier.

## LOCAL ou SYSTÉMIQUE — le maillon qui évite de refaire N fois le même diagnostic

Un manque n'appelle pas le même travail selon son origine, et la question à poser est **unique et
porte sur le gabarit**, jamais sur le manque :

> le gabarit demande-t-il, à qui que ce soit, de lister ce que l'outil expose ?

- **Non** → aucun kit ne le fera jamais. Le manque est **SYSTÉMIQUE** : tous les kits l'ont, et le
  gabarit se corrige AVANT ce kit-ci.
- **Oui** → le gabarit le demande et ce kit-là n'a pas répondu. Le manque est **LOCAL**.

**Le faux pas à ne pas refaire** : une première version comparait les noms de fonctions manqués aux
titres de sections du gabarit. Les deux n'ont aucun vocabulaire commun par construction, donc elle
criait « systémique » sur à peu près tout. Un garde-fou qui accuse à tort cesse d'être lu.

## Ce que son verdict ne touche jamais

**Le badge de complétude.** Le badge dit « les pièces sont là » ; ce test dit « voilà ce qu'elles
valent ». Les lier rendrait le badge dépendant d'un jugement coûteux et **échantillonné** : un
fichier jamais tiré au sort garderait son badge par chance, et deux fichiers identiques en
porteraient deux différents selon qu'ils sont passés ou non.

## Le tirage : mi-ciblé, mi-aléatoire

Tant qu'il reste des membres jamais testés, on tire parmi eux, **pondéré par leur importance**. Une
fois tout le monde passé au moins une fois, on prend le plus ancien, sans hasard — le hasard ne
servirait plus qu'à repousser le plus négligé, c'est-à-dire le seul qui mérite le tour.

## Sa limite honnête

La correspondance se fait sur les **noms**. Une documentation excellente qui décrit tout sans jamais
rien nommer sera comptée comme incomplète : c'est une sévérité assumée, pas une mesure de la clarté
du texte. Et un manque classé systémique est une **suspicion à instruire**, jamais la preuve que
tous les kits sont troués.
