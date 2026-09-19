# CLEAN-DIRTY-OLD — code ancien et peu retouché, jamais un jugement — blueprint exportable

*(Créé le 2026-09-19, calibré par plusieurs échanges avec l'utilisateur au fil de la même session
qui a vu naître ARGUS, HARMONIA, ALWAYS-NEW-CODE et AXA-CHECK — ce dernier est d'ailleurs né EN
COURS du calibrage de CET outil, d'une question directe : « comment sait-on si une zone du code est
couverte ou pas par un test ? ». Même logique que les autres outils de ce projet : ce document
décrit le PATRON générique ; l'instanciation propre à *Maison IA vivante* vit dans
`docs/referentiel/clean-dirty-old.md`.)*

## Le problème que ce patron résout

Un projet qui vit longtemps accumule inévitablement du code jamais retouché depuis longtemps —
distinct des trois autres formes de dette déjà outillées dans ce paysage :
- ARGUS trouve des **absences** — quelque chose qui devrait exister et n'existe pas.
- HARMONIA trouve des **frictions** — deux choses qui existent et se contredisent.
- ALWAYS-NEW-CODE trouve de la **dette d'organisation** — du code qui a grandi par ajouts successifs
  plutôt que par conception.
- CLEAN-DIRTY-OLD trouve de la **stagnation** — du code qui n'a tout simplement pas bougé depuis
  longtemps, RELATIVEMENT au reste du projet, et qui mérite qu'on se repose les trois questions
  ci-dessous, jamais qu'on y réponde à sa place.

## Le garde-fou le plus important — repérer, jamais juger

Un fichier stagnant n'est pas un bug. Il peut être stable et correct depuis toujours — c'est même le
signe d'un bon code dans bien des cas. Ce patron ne répond donc jamais lui-même aux trois vraies
questions qu'un code ancien mérite : **sert-il encore à quelque chose ?** (la réponse existe déjà,
c'est le terrain d'ARGUS) — **sa documentation est-elle encore à jour ?** (le terrain d'HARMONIA) —
**profiterait-il d'une restructuration à la lumière de ce qu'on a appris depuis ?** (le terrain
d'ALWAYS-NEW-CODE, un vrai zoom "page blanche"). CLEAN-DIRTY-OLD se contente de REPÉRER quelles
zones méritent qu'on se pose ces questions, et de nommer explicitement laquelle poser à qui — jamais
une réimplémentation du jugement de ces trois outils (règle de mutualisation générale à tout projet
qui accumule plusieurs outils de vigilance).

**Garde-fou hérité directement d'un cas réel** (cf. instanciation, leçon `trottoirGranted`) : avant
de qualifier une zone stagnante de "dette", toujours vérifier qu'elle n'est pas déjà une décision
assumée et documentée ailleurs — un code qui n'a pas bougé peut être un choix, pas un oubli. Cette
vérification reste un raisonnement (Article 19 générique), jamais mécanisable.

## Stagnation RELATIVE, jamais un seuil de date fixe inventé

Décision de conception centrale : "ancien" n'a de sens que relativement à l'activité du reste du
projet. Un projet jeune et très actif rendrait un seuil fixe ("6 mois sans y toucher") absurde (rien
n'aurait cet âge) ; un projet ancien et calme le rendrait trivial (tout le dépasserait). Le patron
compare donc la dernière date de modification de chaque fichier à la MÉDIANE de tout le reste — un
fichier nettement au-dessus de cette médiane, ET au-dessus d'un plancher absolu minimal (pour éviter
le bruit sur un projet trop jeune où le moindre écart semblerait énorme), est signalé. Moins de deux
fichiers comparables = aucun signal relatif possible, jamais un calcul inventé sur une donnée
insuffisante.

## Renforcement par un signal de couverture de test, s'il existe déjà dans le projet

Si le projet dispose déjà d'un outil de mesure de couverture réelle (cf. AXA-CHECK, son propre
patron), un fichier stagnant ET faiblement couvert cumule deux signaux de risque indépendants — le
patron réutilise cette mesure existante plutôt que d'en recalculer une nouvelle (mutualisation).

## Priorisation — proximité d'un nœud sensible avant l'ancienneté pure

Si le projet dispose déjà d'une carte des zones sensibles (cf. HARMONIA/CHECK-LEVEL-TARGET, leurs
propres patrons), les zones stagnantes qui touchent une de ces zones remontent en premier dans le
rapport, même si une autre zone est plus ancienne — décision de calibrage explicite : concentrer
l'attention là où une erreur coûterait le plus cher, plutôt que sur la pure ancienneté.

## Trois questions déléguées, jamais une seule réponse fabriquée

Pour chaque zone signalée, le patron produit une question précise pour chacun des trois autres
outils de raisonnement déjà existants dans le paysage (encore utile ? → l'outil d'absences ; encore
à jour ? → l'outil de frictions ; profiterait d'une refonte ? → l'outil de dette d'organisation) —
jamais une tentative d'y répondre lui-même, ce qui romprait sa promesse de "repérer, jamais juger".

## Déclenchement — décision propre à chaque instanciation

Contrairement à ALWAYS-NEW-CODE (réservé à une vérification exceptionnelle explicitement demandée),
ce patron peut aussi bien tourner automatiquement à chaque changement (comme un détecteur mécanique
de plus, sa partie de calcul étant entièrement gratuite et déterministe) que rester réservé à la
demande — le choix dépend du coût réel de calcul dans le projet concerné (ici : négligeable, quelques
appels git + une lecture de couverture déjà produite ailleurs) et de la préférence de la personne qui
pilote le projet.

## KPI — suivi dès la création, comme ALWAYS-NEW-CODE

Le nombre de trouvailles CONFIRMÉES (une zone signalée dont l'une des trois questions déléguées a
réellement débouché sur un vrai problème, pas une décision déjà assumée) par passage — suivi dès le
premier passage plutôt qu'après plusieurs semaines, pour vérifier tout de suite si l'outil est
réellement utile.

## Jamais une application automatique

Ce patron ne modifie jamais le code lui-même — il ne fait que le signaler et poser les questions.
Même un nettoyage qui semble trivial (un commentaire obsolète, une variable renommée ailleurs)
reste une proposition à valider, jamais une exécution automatique.

## Ce que ce patron n'est pas

- Un détecteur de bugs : un fichier stagnant n'est jamais, en soi, un signe d'erreur.
- Un concurrent d'ARGUS, HARMONIA ou d'un outil de dette d'organisation : il les nourrit en
  pointeurs, jamais en réponses toutes faites.
- Un outil qui invente un seuil de date universel : la stagnation reste toujours relative au
  projet qui l'héberge.
