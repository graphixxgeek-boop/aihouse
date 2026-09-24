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
