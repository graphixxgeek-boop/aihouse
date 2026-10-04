# Blueprint — CHIFFRER CE QUE COÛTERAIT UNE REFONTE

*(Blueprint générique : réutilisable sur n'importe quel projet. Le nom de l'outil est PROVISOIRE
sur le projet d'origine — les noms y sont choisis par l'utilisateur, par séries.)*

## Le problème qu'il résout

Un jour ou l'autre, quelqu'un propose de **tout reprendre à zéro**. L'intuition qui porte cette
proposition est presque toujours juste — le code s'est empilé, personne n'en a la carte complète,
et une version propre serait plus agréable à tenir. **Ce qui manque n'est jamais l'intuition :
c'est le chiffre.**

Et le chiffre donné de tête est systématiquement faux, dans un sens précis : **on compte les
lignes**. Or les lignes sont la partie la moins chère d'une refonte. Du code mécanique se réécrit
vite, et une grande part se régénère toute seule.

**Ce qui ne se recopie pas, ce sont les RAISONS** : les blocs de commentaire qui disent pourquoi
un garde-fou existe, quel bug il a déjà attrapé, quelle décision l'a fait naître. Une refonte qui
les perd **réintroduit des bugs déjà résolus une fois**. C'est ce volume-là qui décide du coût
réel, et presque personne ne le compte.

## Ce qu'il mesure, et dans quel ordre

**① LE VOLUME, PAR FAMILLE.** « Tout reprendre » ne veut pas dire la même chose selon le
périmètre : l'outillage qu'on veut repenser, le produit qu'on s'interdit de toucher, les documents
qui font loi et qui se relisent plutôt qu'ils ne se réécrivent, les registres qui se régénèrent.
Les fondre en un volume global donne un chiffre vrai et inutile. **Les familles se DÉCLARENT**,
avec pour chacune une phrase disant ce que la refonte lui ferait.

**② LES RAISONS — le vrai chiffre.** On compte les BLOCS de commentaire qui portent un marqueur de
décision (un POURQUOI, une leçon payée, une date de correction, une décision de l'utilisateur), et
jamais la densité de commentaires : « boucle sur les fichiers » n'est pas une décision à reprendre.
**On compte des blocs, jamais des lignes** — un bandeau de trente lignes qui explique une décision
est UNE décision, pas trente ; compter les lignes gonflerait le résultat d'un facteur dix.

**③ CE QUE LA REFONTE REMETTRAIT EN JEU.** Obligatoire, et c'est le point le plus facile à
oublier : un outil qui ne mesure que le coût d'une option la fait perdre d'office. Les dimensions
déjà au maximum sont des **acquis que la refonte repart à zéro**, et elles appartiennent au
chiffrage autant que le volume. Elles se LISENT chez l'outil qui les possède déjà, jamais
recalculées ici.

## Les quatre pièges, et leur fermeture

1. **La moyenne seule ment, et elle a menti au premier passage.** Sur le projet d'origine, le
   premier chiffre rendu était « 25,3 décisions par fichier » — l'image d'un dépôt uniformément
   dense. La **médiane était à 8**, et un seul fichier portait **32 %** du total. Les deux chiffres
   sont vrais ; un seul est utilisable. On rend donc **moyenne, médiane, tête de classement et part
   de la tête** — parce qu'une concentration se traite, là où une moyenne ne se traite pas.
2. **Un volume n'est pas une difficulté.** Mille lignes mécaniques coûtent moins que cent lignes
   subtiles, et aucun programme ne fait la différence. À déclarer HORS PORTÉE, en toutes lettres,
   dans le rapport lui-même.
3. **Il ne recommande rien.** Ni la refonte, ni le statu quo. Il rend des volumes ; la décision
   appartient à la personne qui porte le projet.
4. **Un corpus vide refuse de conclure.** Zéro fichier lu rend « PAS MESURÉ », jamais « 0 ligne à
   reprendre » — qui se lirait comme « rien à faire » au lieu de « je n'ai rien lu ».

## Ce qu'il ne fait pas

- Il ne lit pas le SENS d'une raison : il voit qu'un bloc en porte une, jamais si elle est encore
  valable. Une raison périmée compte comme une raison vivante.
- Il ne distingue pas le code qu'on garderait de celui qu'on jetterait — c'est précisément la
  décision qu'il sert, pas une qu'il prend.
- Il ne sait rien du temps que ça prendrait. Convertir un volume en jours demande de connaître qui
  fait le travail, et aucune mesure du dépôt ne le dit.

## Pour l'installer ailleurs

Trois choses à adapter, et rien d'autre :

1. **Les familles** (`FAMILLES`) — leurs tests de chemin et la phrase qui dit ce que la refonte
   leur ferait. C'est le seul endroit vraiment propre au projet.
2. **Les marqueurs de raison** (`MARQUEURS_DE_RAISON`) — ils doivent être relevés dans le vrai
   code du projet d'accueil, jamais recopiés : chaque dépôt a ses propres formules pour dire
   « voici pourquoi ». Un marqueur inventé rend zéro, et un zéro se lit comme une absence de dette.
3. **La source des acquis** (`acquisRemisEnJeu`) — l'outil local qui mesure déjà la santé du
   projet. S'il n'y en a pas, la fonction doit rendre PAS MESURÉ avec sa raison, jamais un
   contrepoids vide qui ferait pencher la décision.

## Ordonner des chantiers : le critère se mesure, et le cycle se dit

Dès qu'on demande « par quoi commencer ? » sur un parc de modules, la tentation est de rendre une
liste d'importance. L'importance est un avis ; **l'ordre de dépendance est un fait** : un module
dont les autres importent le code passe avant eux, parce que le refaire en dernier oblige à refaire
ses dépendants — et l'inverse n'est jamais vrai. Il se lit dans les imports réels, jamais déclaré.

**Le piège est ce qui arrive quand le graphe a un cycle, et c'est le cas courant sur un parc réel.**
Rendre quand même un ordre produit un ordre faux qui a l'air juste. La règle : le cycle se **nomme**
(combien de modules, lesquels), et l'ordre de repli se **déclare** au lieu d'être subi — par exemple
le plus demandé d'abord. Et il faut le dire franchement : **un cycle qui avale la majorité des
modules est un résultat en soi** — il mesure que les « modules » n'en sont pas encore, ce qui est
précisément l'information qu'on cherchait en voulant les ordonner.

**Toute exclusion de périmètre porte sa raison, et cette raison se LIT là où elle vit déjà** plutôt
que de se réécrire. Un périmètre exclu sans raison écrite n'est pas une décision, c'est un abandon
déguisé.
