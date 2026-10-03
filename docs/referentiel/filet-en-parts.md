# filet-en-parts — instanciation pour ce projet

*(Le blueprint générique vit dans `docs/filet-en-parts-blueprint.md` ; ici, uniquement ce qui est
vrai de CE dépôt. Registre des passages : `docs/filet-en-parts/index.md`.)*

## Sa place dans le chantier du filet — quatrième et dernière marche

| Marche | Ce qui coûtait | Résultat |
|---|---|---|
| #1036 partage du décor | 21 911 lectures de fichiers répétées | 105,7 → 92,1 s |
| #1038 dates de git partagées | 356 ouvertures de processus dans un seul bloc | 92,1 → 75,2 s |
| #1040 décor étendu aux 43 lecteurs restants | lectures encore brutes dans huit outils | 75,2 → 65,4 s |
| **#1041 filet-en-parts** | **un seul processeur sur quatre** | **65,4 → ~15 s** |

**Elle n'est venue qu'en dernier, et la mesure l'a exigé.** La troisième marche avait établi que le
disque ne coûtait presque plus rien : en rappelant deux fois la même fonction de balayage, les
lectures tombaient de 2 859 à 2 mais le temps seulement de 1 832 à 1 619 ms. Le temps restant était
donc du CALCUL — et contre du calcul, il n'y a qu'un levier.

## Ce qui se sépare ici, et ce qui refuse — mesuré, jamais supposé

`obstaclesAuParallele()` d'Ezechiel a été écrit et lancé AVANT ce runner (arbitrage explicite de
l'utilisateur : « Ezechiel cherche d'abord »).

⚠️ **LES CHIFFRES DE CETTE SECTION SE RELISENT, ILS NE SE CROIENT PAS** (Article 24). Ils ont été
périmés une fois, et de loin : la version du 2026-09-27 annonçait une épine de 18,6 s ; elle en
pesait 120,4 quatre jours plus tard, sans qu'une ligne de ce document l'ait dit. La commande qui
les rend à jour est `node scripts/filet-en-parts.mjs --plancher`, et c'est elle qui fait foi.

**Chiffres réels sur `scripts/check-house.mjs`, relevés le 2026-10-03 :**

- **167 blocs de niveau zéro** (`{` puis `}` seuls en colonne 0) ;
- **127 déplaçables**, **40 du socle** parce qu'ils touchent l'état commun — 0,9 s seulement, donc
  la prudence est quasiment gratuite ;
- **138 unités d'APPEL déplaçables** — 114,9 s. C'est la seconde espèce d'unité, et elle pèse plus
  lourd que la première (voir la section suivante) ;
- **l'épine réellement à plat** — 5,5 s, contre 120,4 s avant qu'on sache la découper ;
- **zéro collision d'écriture** sur un chemin lisible, 4 écritures dans un dossier temporaire unique
  par construction, 3 écritures dont le chemin reste illisible (déclarées NON MESURÉES).

## Les deux espèces d'unité déplaçable, et la seconde est la plus sûre

**LE BLOC** `{` … `}` en colonne zéro était la seule unité connue pendant quatre jours. Tout ce qui
ne lui ressemblait pas tombait dans « l'épine » — le code rejoué dans chaque part — par défaut, et
non par mesure. L'épine passait ainsi pour un plafond incompressible à 120,4 s, soit 49 % du filet.

**L'APPEL** (#1578, 2026-10-03) a renversé ce diagnostic : 115,1 des 120,4 s de l'épine vivent dans
147 corps de `async function testX() { … }`, chacune appelée exactement une fois par un
`await testX();` seul sur sa ligne. **Une fonction est l'unité la plus sûre qui soit** — son corps
est étanche par construction du langage, rien de ce qu'elle déclare ne fuit, là où un bloc de niveau
zéro partage le fichier. Et ce n'est pas la fonction qui se déplace, c'est son APPEL : la
déclaration reste dans toutes les parts, puisque définir une fonction ne coûte rien et garantit
qu'aucune référence ne se casse.

**Les quatre conditions, et aucune ne se négocie** : déclarée au niveau zéro · son nom n'apparaît
que deux fois dans tout le fichier (sa déclaration et son appel) · l'appel est seul sur sa ligne, en
colonne zéro, sans affectation de résultat · son corps ne touche pas l'état commun et n'ÉCRIT dans
aucun nom de niveau fichier. La quatrième est celle qui protège réellement, et elle se trompe du bon
côté : une locale homonyme fait rester l'appel au socle, c'est-à-dire qu'il tourne partout comme
avant — on perd un peu de gain, jamais une vérification.

**La profondeur d'accolades est ce qui sauve ce détecteur là où deux autres ont échoué le même
jour**, et la différence vaut d'être nommée : ces deux-là devaient savoir d'où venait un nom
EMPLOYÉ, ce qui demande une analyse de portées ; celui-ci n'a qu'à savoir si une DÉCLARATION est
imbriquée, et ça se compte. Le premier jet l'ignorait, lisait les `const r` posés dans des fonctions
fléchées écrites sur une ligne à plat comme des variables de niveau fichier, et renvoyait 59
fonctions au socle — 40,7 s de gain perdu pour du bruit d'homonymes. Après correction : 0,2 s
refusés.

**Le retour en arrière tient en une option** : `--appels-partout` rend le comportement d'avant.

| Étape | Durée du filet en 4 parts | Plancher théorique |
|---|---|---|
| séquentiel | 263 s | — |
| runner réparé (blocs seuls) | 167,0 s | 121,3 s |
| + unités d'appel | 82,2 s | **6,4 s** |
| **+ poids enfin justes (#1582)** | **84,4 s, et les parts à ±5 %** | 6,4 s |

*(Les 82,2 s et les 84,4 s ne se comparent pas : le filet a gagné quatre groupes de tests entre
les deux. Ce que #1582 a changé est l'ÉQUILIBRE — l'écart entre la part la plus longue et la plus
courte passe de 48 s à 10 s, parce que le répartiteur équilibrait jusque-là sur des poids dont 83 %
appartenaient à un autre groupe.)*

**Le plancher change la forme du problème, pas seulement sa taille.** Tant qu'il valait 121 s,
passer à huit parts n'avait aucun intérêt — la projection donnait 137 s, c'est-à-dire pire qu'à
quatre. À 6,4 s, la même projection donne 36,6 s. Ce qui limite désormais le filet n'est plus sa
structure, c'est le nombre de cœurs de la machine (quatre ici).

### Ce que ça répond à sa contrainte des 30 secondes (tâche #1485)

Sa phrase du 2026-10-02 : « raisonnablement l'agence ne peut pas débarquer avec un filet de plus de
30 sec ». **Avec l'ancien plancher, cette cible était mathématiquement hors d'atteinte** — et pas
« difficile » : hors d'atteinte. La formule `plancher + divisible ÷ parts` donnait 152,9 s à quatre
parts, 137,1 s à huit, 129,2 s à seize et **123,3 s à soixante-quatre**. Aucun matériel ne pouvait
sauver le filet, parce que ce n'était pas une question de matériel.

| Parts | Avec l'ancien plancher (121,3 s) | Avec le plancher actuel (6,4 s) |
|---|---|---|
| 4 | 152,9 s | 66,8 s |
| 8 | 137,1 s | 36,6 s |
| **10** | — | **30,5 s** |
| 12 | — | 26,5 s |
| 16 | 129,2 s | 21,5 s |
| 64 | 123,3 s | — |

**MESURÉ, ET LA PROJECTION NE SE VÉRIFIE PAS TELLE QUELLE SUR UNE MACHINE SATURÉE** : poussé à
huit parts sur ces quatre cœurs, le filet met **107,9 s, c'est-à-dire PLUS que les 96,2 s à quatre
parts**. La projection suppose un cœur disponible par part ; au-delà, la sur-réservation ajoute de
la contention au lieu d'en retirer. Le runner plafonne donc par défaut au nombre de cœurs, et ce
passage est ce qui permet de le dire au lieu de le supposer. Les lignes à 10, 12 et 16 parts du
tableau décrivent une machine qui aurait ce nombre de cœurs — jamais celle-ci.

**Dix cœurs passent sous la demi-minute.** La cible est donc devenue une question d'achat de
machine, ce qu'elle n'était pas ce matin. Ce sont des projections, pas des mesures : le seul
chiffre mesuré sur cette machine à quatre cœurs est 82,2 s, et l'écart avec les 66,8 s théoriques
est le coût de démarrage des processus plus l'épine résiduelle rejouée quatre fois.

**Et la vérification qui compte n'est pas la durée** : la liste des tests exécutés est IDENTIQUE à
celle du séquentiel, sujet par sujet — 436 des deux côtés, les quatre lignes qui diffèrent étant des
tests qui impriment un chiffre vivant.

## Les trois défauts trouvés aux trois premiers lancements réels

**Aucun n'avait été prévu, et c'est l'intérêt de lancer pour de vrai** (Article 25).

1. **`SyntaxError: Unexpected token '}'`** — mon découpage prenait la première accolade fermante
   pour la fin du bloc, or le filet contient un bloc imbriqué ouvert lui aussi en colonne 0
   (ligne 958). C'est la **leçon L39 vérifiée sur son auteur** : un détecteur qui compte une
   profondeur est faux jusqu'à preuve du contraire. Corrigé en comptant la profondeur, et
   contre-testé sur une imbrication fabriquée exprès.
2. **Une assertion parfaitement saine échouait** (`result.agents.every(a => a.needs.stress === 90)`).
   Je croyais que les blocs dépendaient de l'épine ; **c'est aussi l'inverse** — un bloc qui
   réassigne `world` laisse un état dont un test du niveau du fichier dépend plus bas. D'où la règle
   du socle. `world` a rejoint le motif `TOUCHES_L_ETAT_COMMUN` d'Ezechiel à cette occasion.
3. **Les quatre parts échouaient sur le test du kit d'export de SAFE-EXPORT.** J'écrivais les copies
   dans `scripts/`, que SAFE-EXPORT balaie : il y voyait des fichiers sans blueprint ni fiche. **Le
   runner faisait échouer le test qu'il lançait.** Les copies vivent désormais dans
   `.sites-runtime/`, à la même profondeur sous la racine — les imports relatifs du filet
   (`../scripts/…`, `../.sites-runtime/…`) y restent donc valides, et rien ne l'inspecte.

## Le test fragile que la parallélisation a RÉVÉLÉ, et qu'elle n'a pas créé

Le test de temporisation des clés Gemini (« un second 429 consécutif doit à peu près doubler le
délai ») échoue sous charge : il mesure une durée réelle, et quatre processus sur quatre cœurs
faussent le chronomètre. **Il mentait déjà en silence sur une machine chargée** — la parallélisation
n'a fait que le rendre visible. Traité à part, jamais en désactivant le test (interdit sans
exception par les règles de ce projet).

## Branchements réels

- **IL EST LE CROCHET DE COMMIT DEPUIS LE 2026-10-03** (tâche #1586), et c'est un changement
  d'arbitrage, pas une dérive : l'utilisateur avait tranché en septembre que « le séquentiel reste
  la référence » ; il est revenu dessus en fenêtre dédiée, sur la mesure — 84 s contre 263 s, et une
  couverture lue MEILLEURE en parallèle (41 outils à 81 % contre 30 à 42 %).
  **Le séquentiel reste le juge, et le crochet l'appelle tout seul** : quand une part tombe, on ne
  sait pas encore si la faute est au code ou au parallélisme, donc le crochet relance
  `check-house.mjs` et ne bloque que si lui aussi échoue. Le cas rare coûte 84 s + 263 s, et ce
  prix ne se paie que sur un échec. Porte de sortie : `FILET_SEQUENTIEL=1 git commit`.
- **CE QUE CE CHANGEMENT A FAIT VIEILLIR, ET IL FAUT LE SAVOIR** : plus rien ne produit de passage
  séquentiel vert spontanément, or c'est lui qui fait la barre de comparaison. Elle se fige, le
  filet grossit, la barre devient trop basse. Le runner imprime donc l'ÂGE de sa référence au-delà
  de sept jours, pour le compte comme pour la liste des sujets — il nomme, il ne bloque pas.
  **Le geste qui la remet à jour est `node scripts/ezechiel-les-tests.mjs sante`**, et il n'a plus
  de déclencheur automatique.
- **Il lit `docs/ezechiel-les-tests/mesures.json`** pour équilibrer les parts par leur poids réel.
  Sans ce fichier il répartit à l'aveugle et le DIT, plutôt que de laisser croire à un équilibrage.
- **Le motif de l'état commun s'importe d'Ezechiel**, jamais recopié (Article 24) : le jour où
  Ezechiel apprend un nom de plus, ce runner en hérite sans qu'on y touche.

## Limite déclarée

La séparation socle/déplaçable est lue dans le TEXTE. Un bloc qui toucherait l'état commun à travers
une fonction appelée ailleurs resterait invisible, et serait déplacé à tort. C'est pourquoi le mode
séquentiel reste la référence et pourquoi le message d'échec du runner rappelle, en toutes lettres,
de relancer à l'ancienne avant de conclure.
