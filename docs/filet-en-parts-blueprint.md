# filet-en-parts — blueprint exportable

*(Générique : réutilisable sur n'importe quel projet dont la suite de tests est devenue lente.
Rien ici ne dépend de « Maison IA vivante » — l'instanciation propre à ce projet vit dans
`docs/referentiel/filet-en-parts.md`.)*

## Le problème qu'il traite

Une suite de tests qui se déroule du début à la fin n'utilise qu'un seul processeur, quel que soit
le nombre disponible. Tant qu'elle dure quelques secondes, personne ne le remarque. Passé une
minute, elle est payée à chaque commit, par chaque personne, plusieurs fois par heure — et le
premier réflexe qu'elle provoque est le pire de tous : **ne plus la lancer**.

**Ce runner ne s'attaque au parallélisme qu'en DERNIER, et l'ordre compte.** Les trois marches qui
le précèdent (mutualiser les lectures de fichiers, mutualiser les appels à l'historique du gestionnaire
de versions, étendre ces deux partages à tous les outils) sont plus sûres, plus simples, et se
prennent à protection strictement égale. Le parallélisme, lui, change la façon dont les tests
s'exécutent : il peut révéler des pannes qui n'existaient pas. On ne l'ouvre qu'une fois le reste
épuisé, et seulement quand la mesure dit que le temps restant est du CALCUL et non de la lecture.

## Le principe, en une phrase

**Lire la suite de tests, en écrire N copies dérivées où chaque copie ne garde qu'une partie des
UNITÉS, les lancer en même temps, puis remettre la sortie dans l'ordre d'origine.**

*(« Unité » et non « bloc » : il y en a au moins deux espèces, et ne chercher que la première est
l'erreur la plus coûteuse de ce patron — voir la règle 6.)*

## Les sept règles de conception, et aucune n’est cosmétique

1. **NE JAMAIS MODIFIER LE FICHIER DE TESTS.** Le runner lit, il n'écrit que des copies. Le mode
   séquentiel reste donc disponible à tout instant — et c'est la seule façon de savoir, le jour où
   une part échoue, si la faute est au code testé ou au parallélisme. Un runner qui remplacerait la
   suite supprimerait du même coup le seul point de comparaison.
2. **PRÉSERVER LES NUMÉROS DE LIGNE.** Un bloc retiré d'une copie est remplacé par autant de lignes
   VIDES, jamais supprimé. Sans ça, la première erreur renvoie vers une ligne qui n'existe pas dans
   le vrai fichier, et le runner fait mentir tous les messages d'erreur — il coûte alors plus cher
   que les secondes qu'il fait gagner.
3. **SÉPARER LE SOCLE DES BLOCS DÉPLAÇABLES, ET SE TROMPER DU CÔTÉ PRUDENT.** Tout ce qui construit
   ou fait avancer un état commun (préparation, base de données, variables partagées) est du SOCLE :
   il est rejoué dans CHAQUE part. Seuls les blocs qui n'y touchent pas se répartissent. Le doute
   profite toujours au socle : le rejouer coûte des secondes, le retirer à tort coûte un faux rouge.
4. **LES PLUS LOURDS D'ABORD.** La répartition suit le remplissage de sacs classique (« longest
   processing time first ») à partir des durées RÉELLES mesurées au passage précédent. Placer un
   gros bloc en dernier oblige une part à l'attendre seule.
5. **REMETTRE LA SORTIE DANS L'ORDRE DU FICHIER.** Les lignes arrivent mélangées et l'ordre change à
   chaque lancement. On les range avant d'afficher : rien ne change pour le lecteur humain, ni pour
   les outils qui relisent cette sortie. Les doublons du socle sont comptés, jamais jetés en silence.

## La règle 6, la plus rentable de toutes : CHERCHER LA SECONDE ESPÈCE D'UNITÉ

**Elle a été ajoutée après coup, et le retard a coûté le double du gain.** Le premier jet ne
connaissait qu'une seule forme d'unité déplaçable — le bloc `{` … `}` écrit en colonne zéro — et
tout ce qui ne lui ressemblait pas tombait dans le socle **par défaut, jamais par mesure**. Sur le
dépôt témoin, ce « par défaut » pesait 49 % de la suite, et on l'a pris pour un plafond pendant
quatre jours.

**En le découpant plutôt qu'en le contemplant : 95 % de ce prétendu plafond vivait dans des corps
de `function testX() { … }`, chacune appelée exactement une fois.** Une fonction est pourtant
l'unité la plus sûre qui soit — son corps est étanche par construction du langage, rien de ce
qu'elle déclare ne fuit, là où un bloc de niveau zéro partage le fichier avec tout le monde.

**Et ce n'est pas la fonction qui se déplace, c'est son APPEL.** La déclaration reste dans toutes
les copies : définir une fonction ne coûte rien et garantit qu'aucune référence ne peut se casser.
Seule la ligne `testX();` disparaît des copies qui ne la portent pas. C'est plus sûr que de
déplacer un bloc, qui supprime pour de bon ce qu'il déclarait.

**Les quatre conditions, et aucune ne se négocie** (c'est une suite de tests : un faux positif
rend un vert sur du code que personne n'exécute) :

1. la fonction est déclarée au niveau zéro du fichier, hors de tout bloc ;
2. son nom n'apparaît que **deux fois** dans tout le fichier — sa déclaration et son appel. Trois
   occurrences, et on ne sait plus qui l'appelle : on refuse ;
3. l'appel est seul sur sa ligne, en colonne zéro, sans affectation de résultat ;
4. son corps ne touche pas l'état commun **et n'ÉCRIT dans aucun nom de niveau fichier**.

**La quatrième est celle qui protège, et elle se trompe du bon côté** : une locale homonyme fait
rester l'appel dans le socle, c'est-à-dire qu'il tourne partout comme avant. On perd un peu de
gain, jamais une vérification.

**LE PIÈGE DE LA QUATRIÈME CONDITION, ET IL A FAILLI COÛTER UN TIERS DU GAIN.** « Un nom de niveau
fichier » ne veut pas dire « un nom déclaré sur une ligne de niveau fichier ». Une fonction fléchée
écrite sur une seule ligne à plat — `globalThis.fetch = async (...a) => { const r = await f(a); }` —
déclare `r` DANS son corps, pas au niveau du fichier. Le premier jet les confondait et renvoyait
59 fonctions au socle pour des « r », « c », « p ». **La correction est la profondeur d'accolades**,
suivie sur tout le fichier, chaînes et commentaires écartés : seule une déclaration à la
profondeur zéro est de niveau fichier.

**Et c'est la bonne leçon à emporter, parce qu'elle dit où s'arrêter.** Le même dépôt a essayé le
même jour deux détecteurs plus ambitieux — « quel bloc emploie un nom né ailleurs ? » — et les deux
ont échoué, l'un trop étroit, l'autre rendant « a », « n » et « t ». La différence n'est pas une
question de réglage : **savoir d'où vient un nom EMPLOYÉ demande une analyse de portées ; savoir si
une DÉCLARATION est imbriquée se COMPTE.** Quand un détecteur a besoin du premier, il faut un vrai
analyseur de syntaxe ou rien.

## Ce qu'il faut mesurer AVANT de l'écrire, sous peine de promettre faux

Le socle est rejoué N fois, donc il fixe le plancher. La formule est simple et il faut la poser
avant de coder :

```
durée attendue ≈ socle + (somme des unités déplaçables ÷ nombre de parts)
```

Un socle qui pèse un tiers de la suite interdit structurellement la division par quatre. Annoncer
un gain « ×4 » sans avoir mesuré le socle est la promesse la plus facile à faire et la plus sûre à
ne pas tenir.

**ET CE PLANCHER DÉCIDE DE LA FORME DU PROBLÈME, PAS SEULEMENT DE SA TAILLE** — c'est pour ça qu'il
se recalcule après chaque élargissement du découpage, jamais une fois pour toutes. Sur le dépôt
témoin il valait 121 s : à ce niveau, passer de quatre à soixante-quatre parts faisait gagner 30
secondes en tout, donc aucun matériel ne pouvait sauver la suite. La règle 6 l'a ramené à 6 s, et
la même formule dit désormais que dix cœurs suffisent à passer sous la demi-minute. **Un objectif
de durée est à juger contre le PLANCHER, jamais contre la durée du jour** : tant que le plancher
est au-dessus de la cible, acheter des cœurs ne sert à rien, et c'est exactement ce qu'un chiffre
non recalculé laisse croire.

## La règle 7 : LES POIDS SUR LESQUELS ON ÉQUILIBRE SONT-ILS SEULEMENT LES BONS ?

**La règle 4 dit « les plus lourds d'abord ». Elle suppose qu'on sache lesquels sont lourds.** Sur
le dépôt témoin, cette supposition était fausse pour 83 % des groupes, et personne ne l'avait vu
parce que le résultat est parfaitement plausible : des parts équilibrées sur le papier, et une qui
finit quarante-huit secondes avant les autres.

**La cause est exactement celle de la règle 6, prise par l'autre bout.** Le relevé de durées
appariait la liste des groupes lus dans le TEXTE avec la liste des lignes de succès vues à
l'EXÉCUTION, par leur rang — premier avec premier. Ça ne tient que si les deux listes sont dans le
même ordre, et une suite écrite en « déclare puis appelle » ne l'est jamais : une fonction déclarée
au début et appelée à la fin décale tout ce qui la suit.

**L'appariement se fait donc par CONTENU** : chaque ligne imprimée retrouve son groupe par son
préfixe. Trois pièges s'y présentent dans cet ordre, et chacun coûte des dizaines d'appariements :
le texte lu dans le source porte les ÉCHAPPEMENTS du langage (`\'`, `\\`) que l'exécution
n'imprime pas ; un groupe qui imprime plusieurs lignes a plusieurs clefs, pas une ; et un message
construit par concaténation n'a AUCUN texte littéral dans le source, donc il est structurellement
inappariable — à compter comme tel, sans quoi le verdict ne peut jamais virer au vert.

**Et le signe qui aurait dû alerter plus tôt était déjà là** : l'outil déclarait son recollage
« incomplet » depuis des semaines. Il avait raison de refuser de servir le détail ; ce qui manquait
était d'aller voir POURQUOI. Un outil qui déclare honnêtement une limite finit par faire passer
cette limite pour une fatalité.

## Les obstacles à chercher AVANT de paralléliser, jamais après

Un outil compagnon doit répondre à ces questions sur le texte de la suite, avant le premier
lancement — deux tests qui se gênent ne se gênent qu'une fois sur trois, et un test qui échoue une
fois sur trois est le pire genre de panne, parce qu'on ne sait jamais s'il est réparé :

- **les collisions d'écriture** : deux blocs qui écrivent le même chemin ;
- **les attaches** : les blocs qui touchent l'état commun, donc inséparables ;
- **les chemins illisibles** : une écriture dont la destination n'est pas écrite en clair n'est ni
  sûre ni dangereuse — elle est NON MESURÉE, et doit sortir dans sa propre colonne.

Un chemin construit par une fonction du langage qui garantit l'unicité (un dossier temporaire tiré
au hasard) est sûr par construction, et le dire évite de faire relire à la main ce qui est déjà
tranché.

## Le piège que ce runner crée lui-même, et qui n'est évident qu'une fois vécu

**Les copies générées ne doivent pas atterrir dans un dossier que la suite inspecte.** Les écrire à
côté de la suite est le réflexe naturel (les imports relatifs continuent de fonctionner) et c'est
exactement ce qui casse : un test qui vérifie l'inventaire du dossier y voit des fichiers inconnus
et échoue. Le bon emplacement est un dossier de travail ignoré, à la même profondeur, pour que les
chemins relatifs restent valides sans que rien ne les inspecte.

## Les trois pannes propres au parallèle, et comment les reconnaître

| Symptôme | Cause probable | Ce qu'on fait |
|---|---|---|
| Une part échoue, le séquentiel est vert | le parallélisme, jamais le code | on cherche l'obstacle : collision, attache manquée, dossier partagé |
| Toutes les parts échouent au même endroit | un vrai défaut, révélé par ailleurs | on corrige le défaut, le parallélisme n'y est pour rien |
| Un test mesure une DURÉE et échoue | la charge machine fausse le chronomètre | ce test est fragile par nature : il doit mesurer un ordre de grandeur, jamais une durée absolue |

Le troisième cas est le plus instructif : la parallélisation ne le crée pas, **elle le révèle**. Un
test qui dépend de la vitesse de la machine mentait déjà, en silence, sur une machine chargée.

## Réglages

- **Nombre de parts** : par défaut le nombre de processeurs, plafonné. Saturer la machine donne le
  meilleur temps ; en laisser un libre garde la machine réactive pendant le test.
- **Le mode séquentiel reste la référence** : il est lancé tel quel, sans option, et c'est lui qui
  tranche en cas de doute.

## Sûreté structurelle

Le runner ne modifie jamais la suite, n'écrit que dans un dossier de travail ignoré, et le nettoie
en sortant. Son pire échec possible est de rendre un rouge là où le séquentiel est vert : c'est
désagréable, ce n'est jamais destructeur, et la marche à suivre est imprimée dans son propre message
d'échec plutôt que laissée à la mémoire de qui le lit.
