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
l'utilisateur : « Ezechiel cherche d'abord »). Chiffres réels sur `scripts/check-house.mjs` :

- **156 blocs de niveau zéro** (`{` puis `}` seuls en colonne 0) ;
- **115 déplaçables** — 45,8 s ;
- **41 du socle** parce qu'ils touchent l'état commun — 0,9 s seulement, donc la prudence est
  quasiment gratuite ;
- **l'épine hors blocs** (préambule + ~70 tests écrits au niveau du fichier) — 18,6 s ;
- **socle total rejoué dans chaque part : 19,5 s**, ce qui fixe le plancher.
- **zéro collision d'écriture** sur un chemin lisible, 4 écritures dans un dossier temporaire unique
  par construction, 3 écritures dont le chemin reste illisible (déclarées NON MESURÉES).

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

- **Il ne remplace pas le crochet de commit** : le mode séquentiel (`node scripts/check-house.mjs`)
  reste la référence, arbitrage explicite de l'utilisateur (« oui, gardé et lançable »). C'est le
  seul moyen de trancher, quand une part échoue, entre une faute du code et une faute du parallélisme.
- **Il lit `docs/ezechiel-les-tests/mesures.json`** pour équilibrer les parts par leur poids réel.
  Sans ce fichier il répartit à l'aveugle et le DIT, plutôt que de laisser croire à un équilibrage.
- **Le motif de l'état commun s'importe d'Ezechiel**, jamais recopié (Article 24) : le jour où
  Ezechiel apprend un nom de plus, ce runner en hérite sans qu'on y touche.

## Limite déclarée

La séparation socle/déplaçable est lue dans le TEXTE. Un bloc qui toucherait l'état commun à travers
une fonction appelée ailleurs resterait invisible, et serait déplacé à tort. C'est pourquoi le mode
séquentiel reste la référence et pourquoi le message d'échec du runner rappelle, en toutes lettres,
de relancer à l'ancienne avant de conclure.
