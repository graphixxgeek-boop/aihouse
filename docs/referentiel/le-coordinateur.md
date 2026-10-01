# LE-COORDINATEUR — fiche d'instanciation

*(Blueprint générique : `docs/le-coordinateur-blueprint.md` · script : `scripts/le-coordinateur.mjs` · registre : `docs/le-coordinateur/index.md`.)*

## Ce qu'il sert ici

`scripts/le-coordinateur.mjs` (2026-09-19), nommé par l'utilisateur et calibré par lui via
l'Article 16 :

> « est-ce qu'il est possible de le créer à moindre coût, simplement comme un coordinateur de
> fonctions existantes ? juste là pour fiabiliser et fluidifier l'existant »

## Ce qu'il lance ici

Les vérifications gratuites du dépôt, en un passage — 13 lignes dans le tableau de sortie. Il porte
aussi le **catalogue PRESTATIONS**, que tool-brain interroge pour recommander un outil.

## Une décision d'organisation prise le 2026-09-26

Il **a rendu le rang d'Agent Cadre** ce jour-là, faute de pouvoir convoquer les autres : ce rang se
définit par un pouvoir précis (convoquer et rendre un verdict), et il ne l'a pas. Il est Membre
classique.

## Le défaut réel qu'il a coûté ici

Son intégration n'avait **aucun test** jusqu'à ce qu'un lancement manuel révèle une `ReferenceError`
dans une de ses lignes — jamais vue, parce que ce point d'intégration n'était couvert par rien.
Corrigé, puis couvert par un test de bout en bout.

## Le trou trouvé le 2026-09-26, et il vient de son catalogue

Quatre outils bien réels n'avaient **jamais eu d'entrée** dans PRESTATIONS — dont lui-même. Un outil
absent du catalogue est invisible à tool-brain, donc jamais recommandé. Trouvé par un chemin
inattendu : la classification des rapports, qui dérive le sujet d'un rapport de la `demande` du
catalogue, sortait six dossiers en « sujet non déterminé ».

## Sa limite ici

Il agrège, il ne conclut jamais. Et son catalogue est tenu à la main : un outil qui n'y entre pas
n'existe pas pour tool-brain, et rien ne l'annonce à sa naissance sauf le garde-fou d'intégration.

## Le trou trouvé le 2026-09-27 : son garde-fou comparait deux listes écrites à la main

*(Tâche #714. Sa question d'origine : « est-ce que le catalogue du coordinateur se met à jour en
auto ? ».)*

**Ce qui existait.** `findToolsMissingFromMenu()` confronte la **table maîtresse**
(`docs/regles-de-travail.md` §7ter, un tableau Markdown tenu à la main) au catalogue `PRESTATIONS`
(une liste tenue à la main dans `scripts/le-coordinateur.mjs`). Deux listes manuelles vérifiées
l'une contre l'autre.

**Pourquoi ça ne suffit pas, et le chiffre le dit mieux qu'un argument.** Le jour de la correction,
ce garde-fou rendait **« aucun outil muet »** — et la table sur laquelle il se fonde ne connaissait
que **63 des 90 scripts réels**. Son vert ne disait pas « tout le monde a une offre », il disait
« je n'ai pas regardé les autres ». Deux listes manuelles peuvent s'accorder parfaitement tout en
ignorant la même chose (leçon L11 : un zéro mesure un silence, jamais une absence de problème).

**Ce qui a été ajouté.** `findOutilsMuets()` part du **dépôt réel** : le recensement du
classificateur, jamais une liste. Mesure du premier passage — **onze outils parfaitement lançables
n'avaient aucune offre** (`check-level-target`, `check-suivi-fidelity`, `circle-process-guardian`,
`criticite`, `le-regisseur`, `modes-de-travail`, `route-booster`, `run-simulation`,
`summarize-simulation-log`, `the-ghost`, `tool-usage`). Un outil absent du catalogue est invisible à
tool-brain, donc jamais recommandé, donc jamais lancé — et son zéro d'usage se lit ensuite comme un
verdict sur lui. Les onze entrées ont été écrites le jour même : **58 → 69 offres, 11 muets → 0**.

**Les deux fonctions restent, parce qu'elles ne posent pas la même question** : l'ancienne demande
« la table et le catalogue se contredisent-ils ? », la nouvelle « qui, dans le dépôt, n'a pas
d'offre ? ».

**Deux dérivations, jamais deux listes** (Article 24) :
- **Qui doit une offre** = tout fichier dont le classificateur a dérivé une porte « ligne de
  commande », son type n'étant pas `crochet` (un crochet est lancé par git, jamais commandé — il lui
  arrive d'avoir cette porte parce qu'un document explique comment le lancer à la main pour le
  déboguer). Une bibliothèque partagée, un script d'installation ne sont jamais accusés, sans qu'un
  seul de leurs noms soit écrit quelque part.
- **Le rapprochement** passe par l'inventaire de CLAUDE.md (script → fiche → nom d'outil), jamais
  par le nom du fichier : le catalogue cite ARGUS, le script s'appelle `check-argus.mjs`, et une
  comparaison sur le nom de fichier accuserait un outil parfaitement catalogué. C'est l'erreur
  « SANS FICHE, 22 fois », déjà payée par le classificateur.

**Il refuse de conclure sans recensement** : « personne n'est muet » et « je n'ai regardé
personne » s'écrivent tous les deux zéro.

Sortie : à chaque passage de `node scripts/le-coordinateur.mjs`, sous le rapport d'offres
concurrentes — même rapport, deux questions voisines, aucune ne remplaçant l'autre.

## Les combinaisons d'outils, enfin — et elles se mesurent, elles ne s'imaginent pas

*(Tâche #715, 2026-09-27. Sa demande durait depuis le début de l'Agence : « je veux un calcul
complexe pour imaginer des combinaisons pertinentes [...] c'est une des vocations du catalogue que
je n'ai toujours pas réussi à mettre en place correctement depuis le début de l'agence : HELP ! »)*

**Pourquoi ça n'avait jamais marché.** Les tentatives précédentes partaient des OUTILS. 75 outils
font 2 775 paires et 67 525 trios ; un classement sur ce volume a l'air intelligent et n'est que du
bruit, sans aucun moyen de faire la différence. **Une combinaison utile ne se déduit pas d'un stock
disponible** — elle se lit dans ce qui se passe déjà, ou dans un besoin auquel personne ne répond.

**Deux générateurs mécaniques, un troisième délégué. Jamais un calcul sur toutes les paires.**

### ① Ce qui arrive déjà tout seul — `combinaisonsSpontanees()`

Le compteur d'usage horodate chaque lancement. Deux outils qui tombent sans cesse dans la même
fenêtre de travail forment une combinaison que l'agent fait déjà sans lui avoir donné de nom.

**Le piège a été mesuré avant d'être craint.** Compté en brut, le palmarès est trusté par
`agent-du-temps` : 70 fenêtres avec MOÏSE, 69 avec ecotoken, 38 avec tool-brain. Ce n'est pas une
combinaison, c'est un **rituel** — on lit l'heure avant d'écrire, donc il accompagne tout le monde.
Le compte brut mesure la fréquence, jamais l'affinité. On lit donc l'**écart à l'attendu** : combien
de fois la paire tombe ensemble, rapporté à ce que leurs fréquences respectives prédiraient si elles
ne s'appelaient jamais. L'omniprésent retombe à ×1 et disparaît de lui-même.

Premier passage réel, sur 530 fenêtres : `always-new-code + clone-hunter` ×21, `axa-check +
clone-hunter` ×18,4, `argus + le-coordinateur` ×18,2, `smart-conso-token + the-king` ×13,9.

Les lancements du crochet post-commit ne comptent pas : il lance un lot fixe à chaque commit, ce qui
est **une seule commande**, pas une combinaison choisie. Les compter ferait ressortir le contenu du
crochet comme une découverte.

### ② Ce qui s'emboîte — `emboitements()`

A écrit un registre que B sait lire : la chaîne existe déjà dans le dépôt, il suffit de la suivre.
Les registres se LISENT dans la liste déclarée de Doc-Report, les lecteurs se cherchent dans la
source réelle de chaque script.

**Deux bruits écartés, tous deux dérivés :**
- **Un outil qui lit son propre registre.** ARGUS s'appelle `check-argus.mjs`, donc comparer au seul
  slug le faisait sortir en « argus → check-argus ». Le registre déclare son `scriptPath` : on s'en
  sert. C'est l'erreur « SANS FICHE, 22 fois », déjà payée deux fois ici.
- **Les agrégateurs**, dont le métier est de tout relire et qui formeraient donc un faux duo avec
  chaque outil du dépôt. **Le seuil ne se choisit pas, il se lit** : sur 55 registres, la
  distribution donne doc-report 98 %, circle-tasks 56 %, check-house 38 %, hyper-scan-checkpoint
  31 %, puis une chute franche à 16 %. Le trou est net, le seuil (25 %) se pose dedans, et la
  distribution s'imprime **avec** le résultat pour qu'on vérifie que le trou tient encore.

Mesure : 112 chaînes brutes → **70 réelles** une fois ces deux bruits retirés.

### ③ Les exigences que personne ne vérifie — délégué, jamais refait

C'est la question de THE-EQUALIZER (`confronterCadreExterne()`, tâche #1003). La réimplémenter ici
serait un second calcul sur la même donnée, qui finirait par diverger de celui qui décide vraiment
(leçon L29). Le rapport renvoie vers `node scripts/the-equalizer.mjs confronter`.

### Ce que ce rapport ne dit jamais

**Rien ici ne dit qu'une combinaison est UTILE.** Il dit qu'elle est RÉELLE — déjà pratiquée, ou
déjà branchée. Décider qu'elle mérite un nom reste un jugement, et LE-COORDINATEUR ne raisonne
jamais lui-même. Une paire que le catalogue réunit déjà dans une même offre est écartée : la
proposer ferait un rapport qui se félicite de ce qui existe.

**Un effet de bord corrigé en chemin** : `loadToolUsageHistory()` vivait dans `tool-brain.mjs`, qui
n'écrit rien dans ce fichier et se trouvait seulement en être le premier lecteur. Tout outil voulant
lire l'historique devait donc importer tool-brain, lequel importe le catalogue — un cycle dès que le
catalogue veut lire l'historique à son tour. Le lecteur a rejoint `tool-usage.mjs`, le fichier qui
ÉCRIT ces événements ; tool-brain le réexporte, aucun appelant n'est cassé.

Sortie : à chaque passage de `node scripts/le-coordinateur.mjs`.

## 21 Agents sur 54 accusés de n'avoir pas leur badge — tous complets (2026-09-28, tâche #1077)

**Ce que le rapport affichait**, sur SAFE-EXPORT, CASSANDRA-RH, CLONE-HUNTER, AGENT DES NOMS,
Abraham-les-references, tool-brain et quinze autres :

> ⚠️ SAFE-EXPORT n'a pas son badge (instanciation manquante ; registre manquant ; blueprint
> manquant ; absent de CLAUDE.md ; aucune mention trouvée dans `docs/suivi/`)

…où chacune des cinq pièces était cherchée sous le slug fabriqué
`safe-export` + `-scripts-safe-export-mjs` (écrit ici en deux morceaux exprès : collé, il forme un
chemin que le garde-fou des liens morts signalerait à juste titre comme une citation cassée — et il
l'a fait à la première rédaction de cette fiche).

**Les cinq manques étaient fabriqués.** SAFE-EXPORT a sa fiche, son registre, son blueprint, sa
ligne dans CLAUDE.md et ses lignes de suivi. Le slug cherché, lui, n'existera jamais.

**La cause tient en une colonne.** La cellule « Outil » de la table maîtresse
(`docs/regles-de-travail.md` §7ter) porte souvent son script entre parenthèses :
`SAFE-EXPORT (\`scripts/safe-export.mjs\`)`. `badgeWarningsForOutils()` passait cette cellule
**brute** à `checkAgentOnboarding()`, qui **slugifie** son argument : le nom de l'outil se retrouvait
collé au chemin de son propre script, et les cinq pièces du kit étaient cherchées là.
`agentOverrides` était lu avec la même clé brute, donc l'override déclaré par nom propre était
manqué lui aussi.

**Ce qui rend ce défaut plus grave que le chiffre : il avait déjà été corrigé.** Le 2026-09-21, sur
**deux appelants sur trois** — et le commentaire écrit ce jour-là certifie que le découpage est
« déjà établi ailleurs dans ce fichier (`badgeWarningsForOutils()`, `findToolsMissingFromMenu()`) ».
Il ne l'était pas dans `badgeWarningsForOutils()`. **Un correctif appliqué occurrence par
occurrence, puis certifié par un commentaire que rien ne vérifie, n'est pas un correctif** — c'est
la leçon **L37** (corriger la CLASSE, jamais l'occurrence) doublée de l'Article 27 (aucune
obligation ne repose sur la mémoire d'un agent, ni sur un écrit que rien ne contrôle).

**La correction ferme la classe.** `assertNomPropreDAgent()` (`lib-shell.mjs`) vit **dans la
fonction appelée**, là où aucun appelant présent ou futur ne peut l'oublier. Elle **refuse** au lieu
de découper à la place de l'appelant : découper masquerait qu'il lit la mauvaise colonne, et
l'`agentOverrides` continuerait d'être manqué en silence. Un refus nommé se répare une fois ; une
correction muette se reproduit au prochain appelant.

**Mesure** : 21 lignes certifiables sur 54 portent une précision entre parenthèses — 39 % de
l'équipe était accusée en permanence, et aucun travail ne pouvait éteindre l'accusation (L6,
précédée de L4). Le filet vérifie désormais, sur la VRAIE table, que `primaryToolName()` retire
bien cette précision pour chacune d'elles et que le résultat passe le garde-fou.

## La clé écrite quatre fois (2026-09-29, tâche #1206)

**Ce que CLONE-HUNTER montrait** : cinq lignes construisant le même index de paires d'outils,
recopiées dans `combinaisonsSpontanees` et `emboitements`.

**Ce que la question « pourquoi les deux ? » a rendu** : la construction n'était que la moitié
visible. La CLÉ de cet index était écrite **quatre fois** — deux pour la poser, deux pour
l'interroger — chaque fois avec le même trio normaliser / trier / joindre.

**Ce que cette dispersion risquait, et c'est un faux positif SILENCIEUX** : si un seul des quatre
endroits oubliait la normalisation ou le tri, l'interrogation ne trouverait rien, la paire passerait
pour inédite, et le rapport proposerait fièrement une association que le catalogue réunit déjà.
Rien ne planterait, rien ne serait rouge — le rapport se féliciterait simplement de ce qui existe.

**Une clé se construit à UN endroit, ou elle finit par ne plus se correspondre** :
`clePaireDOutils()` la porte, `pairesDejaNommees()` construit l'index, `dejaNommee()` l'interroge.
Comportement vérifié identique avant/après sur les deux fonctions, et un contre-test COMPTE les
écritures à la main : si une cinquième réapparaît, le filet le dit au lieu de laisser la divergence
s'installer.

## Deux outils qui lisent les mêmes sources — `memes-sources` *(2026-10-01, tâche #1382)*

**Ce qu'il répond, et pourquoi personne ne le pouvait avant.** `findOffresConcurrentes()` compare
les DEMANDES déclarées au catalogue ; sa limite est écrite depuis sa création — « jamais ce que les
outils font vraiment » — et son seuil est passé au-dessus de sa distribution le 2026-10-01 (#1377).
La question « quels outils fusionner ? » n'avait donc plus d'instrument.

**Le signal est structurel, pas textuel** : deux outils qui lisent les mêmes FICHIERS travaillent
sur la même matière. C'est une intersection d'ensembles, qui ne dépend d'aucun vocabulaire.

**Les deux seuils se LISENT dans leur distribution**, et les deux distributions sont imprimées avec
le résultat : rareté d'une source à **7** (rien n'est lu par exactement 8 outils), sources rares
communes à **10** (rien à 10 ni 11, puis 11, 13, 16, 32, 33).

**Le scanner trouve le scanner, et ce n'est pas une fusion.** Un scanner se DÉRIVE de la taille de
sa lecture (≥ 40 sources rares — le trou est franc entre 40 et 21), il ne se recopie pas. Deux
normalisations ont été essayées et écartées avec leur mesure : diviser par le plus petit ensemble
confond inclusion et recouvrement ; le Jaccard enterre la paire la plus intéressante.

**Mesure réelle au jour de sa création** : 5 paires au-dessus du seuil, **toutes impliquant un
scanner** — donc **0 candidat à la fusion**. La paire de tête, `circle-tasks ↔ doc-report`, a un
historique documenté de duplication réelle : le signal retrouve un cas connu sans qu'on le lui
souffle.

**Commande** : `node scripts/le-coordinateur.mjs memes-sources`.

**Les fonctions** : `sourcesParOutil()` relève ce que chaque script lit · `findOutilsQuiLisentLesMemesSources()` croise les ensembles, dérive les scanners et pose les deux seuils · `formatOutilsMemesSourcesLines()` rend le tout avec ses deux distributions, pour qu'un lecteur vérifie que les trous existent encore.

*(`motsGeneriquesDesNoms()` appartient au volet NOMMAGE de cet outil, pas à celui-ci : il relève les mots trop passe-partout dans un nom proposé.)*

*(Le garde-fou de #1377 est câblé dès le premier jour : il refuse de rendre un zéro quand son seuil
dépasse ce qu'il observe. Sa limite déclarée : lire les mêmes fichiers n'est pas faire la même
chose — ce sont des candidates à instruire, jamais un verdict de fusion.)*
