# AGENT DES NOMS — instanciation sur « Maison IA vivante »

*(Le blueprint générique, réutilisable sur un autre projet, vit dans
`docs/agent-des-noms-blueprint.md`. Ce document-ci ne garde que ce qui est propre à ce projet.)*

**NOM PROVISOIRE depuis 2026-09-24** — « agent des noms » est le mot de l'utilisateur, employé en
demandant si l'outil était prêt. Il reste à confirmer comme nom définitif, et l'outil se signale
lui-même tant que ce n'est pas fait.

## Comment il est né, et la correction qui a renversé le cadrage

L'outil a d'abord été construit sur sa moitié gouvernance — sa règle, dans ses mots : « je dois
toujours choisir les noms d'outil ou de process ou de rapports, et l'outil veille à ce que cette
règle soit respectée. c'est un process aussi ».

Puis sa correction, le même soir : **« retrouves le cahier des charges complet, je pense qu'il
manque la moitié. cet agent a pour fonction principale de minimiser le risque technique lié au
changement de noms en masse. »** Il avait raison, et l'ordre compte : la gouvernance est la moitié
secondaire.

## Le risque, mesuré sur CE dépôt

| Nom | Occurrences | Dont `docs/suivi/` | Dont imports de code |
|---|---|---|---|
| `cassandra-rh` | 2 095 | 496 | **9** |
| `el-professor` | 604 | 124 | 4 |
| `memento` | 288 | — | 8 |

C'est ce tableau qui a produit la règle centrale, pas l'inverse : **un renommage déplace le code
vivant et laisse l'histoire intacte.**

## Ce qui est « vivant » ici, et ce qui est « histoire »

- **Vivant** : `docs/referentiel/*.md` au premier niveau, `CLAUDE.md`, `docs/regles-de-travail.md`,
  tout `scripts/`, `lib/`, `app/`, `components/`, et les documents à la racine de `docs/`.
- **Histoire, jamais touchée** : `docs/suivi/`, `docs/simulations/`, `docs/circle-tasks/`, tout
  `docs/<nom-de-l-outil>/` (la règle d'organisation du projet veut que ce soit le registre horodaté
  d'un outil), et **y compris un sous-dossier de `docs/referentiel/`** comme `kpi-rapports/`.

## Les deux ratés du premier passage réel, gardés en contre-test

Ce sont les deux sens de la même erreur, et le second est le dangereux.

1. Chercher une **date** dans le nom du fichier classait `ronde-2026-09-21T23-26-29.txt` en histoire
   et `1789942702956-arborescence.html` — même dossier, même nature — en vivant.
2. Laisser `docs/referentiel/` gagner **à toute profondeur** classait un rapport archivé sous lui en
   vivant. Celui-là aurait réécrit une archive.

## Le piège propre à ce dépôt : les noms qui en contiennent un autre

Renommer `memento` emporterait `memento-weight`, `memento-history` et `memento-blueprint`, qui sont
autre chose. L'outil les liste avant le geste.

## Les cinq séries d'hommages, déclarées et jamais imposées

Un nom hors série reste légitime ; il déclare seulement qu'il est hors série.

- **grands codeurs** — ceux qui ont servi toute la profession. Sa raison, et elle est de lui : ils
  ont contribué à ce projet par ricochet, à travers l'IA qui l'écrit.
- **dystopique** — l'ambiance même du jeu.
- **prophètes** — ceux qui annoncent et qu'on n'écoute pas : le métier exact d'un outil de
  vigilance. CASSANDRA en faisait déjà partie sans l'avoir déclaré.
- **Matrix** — des êtres qui découvrent que leur monde est fabriqué : le sujet du jeu, mot pour mot.
- **Squid Game** — des gens observés par des spectateurs masqués qui s'amusent : la thèse du projet.

## L'état réel à sa création, et la séquence qu'il a lui-même posée

**78 noms en service, 0 validé par l'utilisateur.** Ce n'est pas un artefact de mesure, c'est le
vrai état des choses : la règle est née le 2026-09-24, les noms sont antérieurs.

Cette dette se purge **APRÈS la classification de l'iceberg** (tâche #737), jamais avant — séquence
posée par l'utilisateur, et sa raison tient debout seule : renommer un outil dont on ignore encore
le groupe produit un nom qui ne voudra plus rien dire ensuite.

## Les trois décisions du 2026-09-27, prises en fenêtre dédiée — À APPLIQUER LE MOMENT VENU

*(Tranchées par l'utilisateur, mais volontairement PAS ENCORE appliquées : ses mots, « pour les noms
et le renommage on attend d'avoir fini sur la classification et les sujets adjacents, mais pense à me
le reproposer à ce moment-là […] prends juste des notes enregistrées pour l'instant ». Elles vivent
donc ici plutôt que dans le code, et c'est exactement ce que l'Article 27 demande : une décision qui
n'existe que dans la tête de l'agent n'existera plus à la session suivante.)*

**1. LE PÉRIMÈTRE : les ~50 outils réellement NOMMÉS, jamais les 81 fichiers.** Le compteur actuel
prend tous les `scripts/*.mjs`, ce qui mélange trois populations qui n'ont rien à voir : les outils
qu'on a baptisés (ABRAHAM, CASSANDRA-RH, THE-KING, ecotoken…), **14 noms mécaniques** (`check-house`,
`run-simulation`, `install-ci`… — un préfixe, pas un baptême) et une douzaine de **bibliothèques**
(`lib-shell`, `lib-json`, `report-template`…). Or `OBJETS_A_NOMMER` dit depuis le 2026-09-24 que
seuls **outil, process et rapport** se nomment. Les deux mesures se contredisent, et c'est la leçon
L29 dans sa forme exacte : deux mesures de la même chose qui divergent. **Le « 81 sur 81 » affiché à
chaque Ronde est donc faux par excès** — à corriger quand le chantier s'ouvrira, jamais avant, mais
à ne pas oublier : un chiffre faux empoisonne toutes les décisions qui s'appuient dessus.

**2. UN TROISIÈME ÉTAT : « hérité, jamais choisi ».** Un nom en service que l'utilisateur n'a jamais
choisi n'est ni validé ni fautif. Le valider rétroactivement ferait perdre au registre sa seule
raison d'être — git sait déjà QUE ça s'appelle comme ça, jamais QUI l'a voulu. Le registre doit donc
distinguer ce qui a été VOULU de ce qui s'est installé tout seul.

**3. LE RENOMMAGE NE SE FAIT PAS NOM PAR NOM.** Précision de l'utilisateur, et elle invalide la
méthode que l'outil propose aujourd'hui : « je ne fais pas des noms au cas par cas, je crée des
séries de noms à l'intérieur d'une même famille ou autre, donc pour renommer il faudra une autre
méthode ». La commande `renommage <ancien> <nouveau>` reste juste pour le GESTE technique ; ce qui
manque est l'étage au-dessus — présenter une FAMILLE entière et lui proposer une série cohérente,
jamais une liste de noms isolés à trancher un par un. À concevoir avec lui le moment venu.

**QUAND LE REPROPOSER, et c'est une obligation, pas une intention** : quand la classification et ses
sujets adjacents seront clos, et au plus tard à l'ouverture de la fournée de renommage (#200/#745).
Il a annoncé « 2 ou 3 prompts environ à te donner avant l'étape renommage ».

## Comment on s'en sert

```
node scripts/agent-des-noms.mjs                              # la gouvernance : provisoires oubliés, noms jamais validés
node scripts/agent-des-noms.mjs renommage <ancien> <nouveau> # AVANT le geste : inventaire, tri, plan fichier par fichier
node scripts/agent-des-noms.mjs verifier <ancien>            # APRÈS : aucun reste vivant ne subsiste-t-il ?
```

Un renommage à moitié fait est pire qu'un renommage pas fait : les deux noms coexistent et personne
ne sait lequel fait foi. La commande d'après n'est donc pas optionnelle.

## La récursion, assumée

Ce fichier et le script portent eux-mêmes un nom provisoire, marqué comme tel. Au premier passage,
l'outil s'est signalé LUI-MÊME — faute de date à côté de sa marque, il a refusé d'alerter plutôt que
d'inventer une ancienneté. C'est le meilleur test possible de sa propre règle, et la bonne réaction :
un aveu d'ignorance vaut mieux qu'une mesure fabriquée.
