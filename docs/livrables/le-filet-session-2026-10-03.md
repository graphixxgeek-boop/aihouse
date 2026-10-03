# Le filet — ce que la session a changé

*(Livrable du 2026-10-03. Il répond à sa consigne du soir : « on fait une pause et on s'attaque au
filet pour diminuer son impact. Une session qui va nous faire gagner du temps sur toutes les
autres. » Tous les chiffres viennent d'un lancement réel ; aucun n'est estimé.)*

## En une ligne

**Le filet passe de 263 s à 84 s** quand on le lance en quatre parts, et le plancher qui rendait
tout progrès impossible est tombé de 121 s à 6,4 s.

## Le tableau, étape par étape

| Étape | Durée en 4 parts | Plancher théorique | Ce qui a changé |
|---|---|---|---|
| départ (séquentiel) | 263 s | — | — |
| runner réparé | 167,0 s | 121,3 s | il ne démarrait plus depuis quatre jours |
| + unités d'appel | 82,2 s | **6,4 s** | l'épine n'était pas un plafond |
| + poids enfin justes | 84,4 s, parts à ±5 % | 6,4 s | 83 % des durées étaient attribuées au mauvais test |

*(Les 82,2 s et les 84,4 s ne se comparent pas directement : le filet a gagné quatre groupes de
tests entre les deux. Ce que la dernière étape a changé est l'ÉQUILIBRE — l'écart entre la part la
plus longue et la plus courte passe de 48 s à 10 s.)*

## Les six trouvailles, de la plus grosse à la plus petite

### 1. Le runner ne démarrait plus depuis quatre jours, et personne ne le savait

Le seul levier connu contre la durée du filet était mort. Vingt-huit imports ajoutés après son
écriture ne se résolvaient pas depuis la copie qu'il fabrique. **Un outil qu'on n'utilise pas ne
signale jamais qu'il est cassé.**

### 2. L'épine n'était pas un plafond, c'était un défaut de découpage

On croyait que 120 secondes du filet — la moitié — étaient du code impossible à répartir, rejoué
dans chacune des quatre parts. **En le découpant plutôt qu'en le contemplant : 115 de ces 120 s
vivent dans des fonctions appelées exactement une fois.** Le runner ne connaissait qu'une seule
forme de « morceau déplaçable » et rangeait tout le reste dans l'incompressible par défaut, jamais
par mesure.

Ce qui bouge est l'**appel** de la fonction, pas la fonction : sa définition reste dans toutes les
parts, donc rien ne peut se casser. **Le filet lui-même n'a pas été modifié d'une seule ligne.**

### 3. Quatre-vingt-trois pour cent des durées étaient attribuées au mauvais test

L'outil qui chronomètre le filet appariait la liste des tests lus dans le fichier avec la liste des
résultats vus à l'exécution, **dans l'ordre**. Or une suite qui définit ses tests puis les appelle
plus loin ne s'exécute pas dans l'ordre du fichier : **sur 421 groupes, 349 recevaient la durée d'un
autre.**

L'outil le disait depuis des semaines — il refusait de servir le détail en le déclarant
« incomplet ». Il avait raison de refuser ; personne n'était allé voir pourquoi. **Un outil qui
déclare honnêtement une limite finit par faire passer cette limite pour une fatalité.**

### 4. Un compte ne voit pas « un test perdu, un test ajouté »

Le garde-fou écrit le matin même comparait un NOMBRE de vérifications à un nombre de référence. Une
soustraction qui rend zéro se lit comme « rien n'a bougé ». Le runner compare désormais la **liste
des sujets**, et nomme celui qui manque au lieu de le compter.

### 5. Un brouillon qui survit à une part tombée empoisonne tous les passages suivants

Poussé à huit parts, le runner échouait de façon reproductible. Ça ressemblait trait pour trait à
une collision entre parts ; les fichiers étaient pourtant parfaitement séparés. **Le coupable était
le temps, pas le parallélisme** : un journal laissé par un passage interrompu, que le test suivant
sauvegarde puis restaure — donc reconduit au lieu de nettoyer.

### 6. Une ligne de registre écrite puis jamais lue se croit prise en compte

Le registre des passages se remplit à la main, et son lecteur n'acceptait que des nombres entiers.
Deux lignes écrites avec une décimale ont disparu en silence, et le rapport annonçait « 1 ligne
vérifiée sur 1 » sur un registre qui en portait trois.

## Deux résultats NÉGATIFS, gardés exprès

Ils comptent autant que les gains, parce qu'ils évitent de refaire le chemin.

- **Élargir le détecteur de « morceaux qu'on ne peut pas déplacer »** : essayé, mesuré, abandonné.
  Il envoyait 129 blocs sur 167 dans l'incompressible et faisait MONTER le plancher à 240 s. La
  cause est du bruit de noms identiques, et la trancher demanderait un vrai analyseur de code.
- **Lancer plus de parts que la machine n'a de cœurs** : 107,9 s à huit parts contre 96,2 s à
  quatre. La sur-réservation coûte.

## Ce que ça répond à sa contrainte des 30 secondes

Sa phrase du 2026-10-02 : « raisonnablement l'agence ne peut pas débarquer avec un filet de plus de
30 sec ». **Avec l'ancien plancher, cette cible était hors d'atteinte — pas difficile, hors
d'atteinte** : même soixante-quatre parts simultanées auraient atterri à 123 s. Aujourd'hui, la
même formule donne 30,5 s à dix parts et 26,5 s à douze.

**La cible est devenue une question de machine, ce qu'elle n'était pas ce matin.**

## La question qui reste, et elle est pour lui

**Le crochet de commit tourne toujours en séquentiel**, donc chaque commit coûte encore quatre
minutes et demie au lieu d'une minute et demie. Ce n'est pas un oubli : c'est un arbitrage qu'il a
pris lui-même (« le mode séquentiel reste la référence, gardé et lançable »), et le changer est sa
décision, pas la mienne.

**Ce que la mesure dit de la faisabilité, puisque c'est elle qui tranche** : le runner parallèle
tourne très bien sous instrumentation de couverture, et la couverture lue est de **98 % contre 99 %
en séquentiel** — j'avais prédit un effondrement, la mesure dit un point. Le passage est donc
techniquement ouvert.

**Les trois options :**

1. **On ne change rien.** Le crochet reste séquentiel, le parallèle reste un outil de diagnostic.
2. **Le crochet passe au parallèle**, et le séquentiel reste lançable à la main — c'est lui qui
   tranche, quand une part tombe, entre une faute du code et une faute du parallélisme.
3. **Le crochet lance le parallèle, et retombe automatiquement sur le séquentiel** si une part
   échoue. Plus lent dans le cas rare, plus sûr, et aucune décision à prendre sur le moment.

Ma recommandation est la **3**, parce qu'elle gagne trois minutes par commit sans jamais retirer le
filet de sécurité du filet de sécurité.
