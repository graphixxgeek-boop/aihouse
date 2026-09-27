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
