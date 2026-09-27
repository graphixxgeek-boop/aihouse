# EZECHIEL-LES-TESTS — blueprint générique : enquêter sur une suite de tests, et sur ce qui l'entoure

*(Blueprint RÉUTILISABLE sur un autre projet. Rien ici ne dépend de « Maison IA vivante » : ce qui
est propre à ce dépôt vit dans `docs/referentiel/ezechiel-les-tests.md`.)*

## Le problème qu'il ferme

Une suite de tests grossit sans que personne ne la surveille, jusqu'au jour où elle bloque le
travail. On se dit alors « il y a trop de tests » et on commence à en retirer. **C'est presque
toujours le mauvais geste**, pour deux raisons que seule une mesure peut départager : le temps peut
venir de ce qui ENTOURE les tests (instrumentation de couverture, typage, démarrage d'un navigateur)
plutôt que des tests eux-mêmes ; et un test retiré à tort ne se signale jamais — il laisse
simplement passer, un jour, le défaut qu'il attrapait.

## Le principe fondateur : un ENQUÊTEUR, jamais un chirurgien

L'outil **ne modifie jamais** la suite de tests. Il rend des **signaux mesurables** ; le verdict
« ce test part » reste humain. C'est une contrainte de conception, pas une prudence : la suite est
généralement branchée sur un crochet bloquant, donc sa panne empêche tout commit. Un outil capable
de la modifier seul serait le seul du paysage capable de détruire silencieusement ce que tous les
autres protègent.

## Les six axes, et pourquoi chacun existe

1. **La chaîne réelle** — que lance-t-on vraiment, dans quel ordre, et qu'est-ce qui BLOQUE ? Elle
   se LIT dans les crochets, jamais recopiée : une ligne ajoutée demain apparaît toute seule.
2. **D'où vient le temps** — la suite nue, la suite sous instrumentation, le typage : trois durées,
   et le refus de conclure sans elles. C'est l'axe qui décide de tout le chantier.
3. **Ce qui ne mord pas** — un groupe sans aucune assertion, une assertion portant sur une valeur
   littérale. Des FAITS, jamais « ce test est inutile ».
4. **Ce qui n'a pas de raison écrite** — un test dont personne ne sait plus ce qu'il protège se
   fait supprimer par le prochain agent, ou pire, contourner.
5. **Ce qui cite du code disparu** — un import vers un fichier absent ne casse pas un test, il
   casse la suite ENTIÈRE, donc bloque tout commit. C'est le défaut le plus cher.
6. **L'encombrement** — en LIGNES, jamais en temps : un groupe de 300 lignes peut s'exécuter en
   2 ms, et confondre les deux serait une erreur de mesure.

## Les trois pièges, et ils ont TOUS été payés au premier passage réel

- **Des marqueurs de fin consécutifs ne sont pas plusieurs groupes.** Un bloc qui couvre cinq
  sujets peut imprimer cinq lignes de succès d'affilée ; les compter séparément crée quatre groupes
  au corps vide, donc quatre accusations fausses.
- **Une chaîne de FIXTURE n'est pas un import.** Un chemin inventé pour les besoins d'un test
  ressemble trait pour trait à un import mort. Règle qui les sépare : **une ligne qui appelle une
  assertion n'importe rien**.
- **Un surcoût négatif n'est pas un gain, c'est du bruit.** Si la version instrumentée mesure moins
  que la version nue, les deux durées sont dans la même marge d'erreur — le dire, plutôt que de
  rendre un pourcentage négatif qui se lira comme un résultat.

## Sa limite honnête, à déclarer et jamais à taire

Il lit du TEXTE ; il n'exécute pas la suite groupe par groupe. Il peut donc affirmer « ce groupe ne
contient aucune assertion », jamais « cette assertion ne peut pas échouer » — établir le second
demande de casser le code exprès et de relancer, ce qui est une passe à part.

## Les quatre axes ajoutés le 2026-09-27, et pourquoi chacun manquait

Les six axes ci-dessus décrivent l'ÉTAT du filet. Ces quatre-là répondent à des questions qu'aucun
d'eux ne posait, et chacune vient d'une exigence formulée par le commanditaire.

7. **La santé de FONCTIONNEMENT** — « le fonctionnement général de la suite est-il lui-même OK
   VERT ? ». C'est une question différente de « les tests passent-ils » : une suite peut rendre un
   code de sortie 0 en ayant SAUTÉ la moitié de ses blocs, en ayant exécuté le même deux fois, ou
   en crachant des avertissements que plus personne ne lit. Cinq anomalies sont donc surveillées, et
   « vert » n'est jamais confondu avec « rien de bloquant » : les deux sont rendus séparément.
8. **La correspondance test ↔ code** — un test qui appelle une fonction que son module n'exporte
   plus ne protège plus rien, et peut passer sur un `undefined` sans le dire. C'est la part de
   Fraîcheur qui revient à cet outil dans le contrat à trois (cf. axe 10).
9. **Le GAIN et son PRIX** — un outil qui mesure l'état ne mesure pas l'effet. Sans comparaison de
   deux relevés, on saurait que c'est plus rapide, jamais combien ni grâce à quoi. Et sans
   comparaison de deux passes de robustesse, on ne saurait jamais ce que la rapidité a coûté. La
   règle est un veto : **un allègement qui fait perdre une protection est refusé, quel que soit le
   temps qu'il fait gagner.**
10. **La frontière avec ses deux voisins, écrite en DONNÉE** — trois outils se partagent
    l'assainissement : l'un tient la charte, l'un tout document à règles numérotées, l'un le filet
    et sa machinerie. Un commentaire promettant « on ne se chevauche pas » n'aurait jamais rien
    empêché ; une donnée relue par un test refuse un quatrième outil qui revendiquerait un périmètre
    déjà tenu.

## La leçon du premier voyant, et elle vaut pour tout outil de contrôle

Le voyant de santé a trouvé un défaut à son tout premier passage réel — et c'était le SIEN. Il
annonçait « 4 succès attendus jamais imprimés », donc quatre blocs sautés : les quatre étaient des
fixtures citées dans une chaîne de caractères, à l'intérieur de ses propres contre-tests. **Le
voyant avait raison de crier sur l'écart ; c'est le dénombrement qui mentait.** Un outil qui compte
ce qu'un fichier de tests DIT doit toujours distinguer le code exécuté du code cité — et corriger
cette distinction une fois ne suffit pas : elle se corrige pour la CLASSE entière, jamais pour
l'occurrence qu'on vient de voir.

## Ce que l'état de l'art extérieur a ajouté, et ce qu'il n'a PAS changé

Une recherche extérieure a été menée pour confronter la conception à ce que la littérature sait
déjà. **Elle a ajouté quatre détecteurs et zéro principe** — et c'est le résultat le plus
intéressant : les fondations (un enquêteur jamais un chirurgien, la limite déclarée plutôt que tue,
« pas mesuré » plutôt qu'un vert sur zéro donnée) n'ont été contredites nulle part.

Les quatre apports, chacun répondant à une question qu'aucun des six axes d'origine ne posait :

1. **Une assertion peut-elle être avalée ?** Un `try` dont le `catch` ne relance pas rend le test
   incapable de rougir. C'est pire qu'un test absent : un test absent se voit.
2. **Quels blocs dépendent du disque réel ?** Le smell « Mystery Guest ». Chez un outillage qui
   DOIT tourner contre le vrai dépôt, ce n'est jamais une faute — mais ça explique à la fois les
   secondes et la fragilité, dans une seule liste.
3. **Un bloc dépend-il de ce qu'un autre a laissé ?** La dépendance à l'ordre est la troisième
   cause de flakiness de la littérature, et la plus silencieuse dans un fichier séquentiel.
4. **Un échantillon n'est pas un verdict.** La littérature chiffre la perte de pouvoir de détection
   selon le taux d'échantillonnage ; un score de mutation doit donc dire sur quoi il porte, sans
   quoi « 100 % attrapées » est le plus flatteur des mensonges.

**Et une mesure qui remplace un top-N** : les percentiles de durée disent si la suite est un long
plateau ou une poignée de monstres — deux chantiers complètement différents, qu'un classement des
dix plus gros ne distingue jamais.
