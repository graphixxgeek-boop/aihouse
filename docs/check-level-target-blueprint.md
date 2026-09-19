# CHECK-LEVEL-TARGET — calcul du niveau de vérification attendu — blueprint exportable

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur, juste après la construction de
HYPER-SCAN-CHECKPOINT : « je veux que tu crées un système de gestion et régulation de l'allocation
des ressources [...] ce système servira à déterminer, lors du besoin d'un check, quels outils
doivent être sollicités, pour que ni toi ni le modèle ne soyez tout à coup dans la confusion du
niveau de test attendu [...] cet outil remplace la solution existante » — la "solution existante"
précisée par l'utilisateur étant sa façon informelle, non écrite, de choisir les outils au cas par
cas. Nommé par l'utilisateur lui-même, en rejetant explicitement une première proposition
("TRIAGE"). Même logique déjà appliquée à ARGUS/HARMONIA/Smart Conso API/HYPER-SCAN-CHECKPOINT :
ce document décrit le PATRON générique ; l'instanciation propre à *Maison IA vivante* vit dans
`docs/referentiel/check-level-target.md`.)*

## Le problème que ce patron résout

Un projet qui accumule plusieurs outils de vérification (un filet de sécurité rapide et gratuit,
un détecteur de trous, un détecteur de frictions, des vérifications coûteuses en vrais appels API,
un audit exceptionnel) fait courir un risque nouveau : NE PAS savoir, à un instant donné, quel
sous-ensemble de ces outils une demande précise appelle réellement. Sans règle explicite, ce choix
retombe sur une appréciation au cas par cas — incohérente d'une fois à l'autre, et invisible pour
la personne qui pilote le projet (elle ne sait jamais si "vérifie ça" a déclenché le bon niveau
d'effort ou un niveau arbitraire). CHECK-LEVEL-TARGET remplace cette appréciation informelle par
une règle explicite, cohérente, et qui explique toujours son propre choix.

## Les niveaux, jamais un curseur continu

Un petit nombre de niveaux discrets et nommés, chacun associé à une combinaison précise d'outils
déjà existants dans le projet — jamais un pourcentage ou un curseur continu, qui donnerait une
fausse impression de précision sur une décision qui reste largement qualitative. Pour ce projet :
Léger → Standard → Approfondi → Exceptionnel (cf. instanciation pour le détail exact). Le nombre et
les noms des niveaux sont propres à chaque projet ; ce qui est générique, c'est le PRINCIPE d'une
échelle discrète, courte, alignée sur les outils réellement disponibles.

## Ce que ce patron n'est pas : une estimation d'effort général

À ne jamais confondre avec une estimation qualitative de l'effort d'une réponse en général (durée,
volume) si un tel indicateur existe déjà dans le projet — les deux répondent à des questions
différentes ("combien de temps/tokens cette réponse va-t-elle prendre" contre "quels outils de
vérification cette demande appelle-t-elle précisément"). Les fusionner ferait perdre la précision
de chacun ; les garder séparés, quitte à ce que les deux soient consultés côte à côte, préserve la
clarté de ce que chacun mesure réellement.

## Comment le niveau est calculé — une heuristique honnête, jamais une fausse compréhension

Le texte de la demande est confronté à des signaux caractéristiques de chaque niveau (formulations
récurrentes déjà observées dans l'historique réel du projet : "vérifie", "en profondeur",
"exhaustif", "audit complet", "toutes les combinaisons", etc.), pondérés, pour produire un score par
niveau. Le niveau au score le plus haut est retenu. **Limite honnête, à ne jamais masquer** : ceci
reste une reconnaissance de motifs sur le texte, pas une compréhension véritable de l'intention —
de la même nature que les autres détecteurs heuristiques déjà en place dans ce projet (une demande
de négociation, une détresse chez l'observateur). Elle ne remplace jamais un vrai jugement humain
ou celui de l'agent quand le doute persiste (cf. section suivante).

## Confirmation seulement en cas de vrai doute

Le score du niveau choisi est toujours accompagné d'une marge de confiance par rapport au second
niveau le plus probable. Si cette marge est large, l'outil choisit et EXPLIQUE toujours son choix
(jamais un choix silencieux) sans interrompre la personne qui pilote le projet. Si la marge est
étroite — un vrai doute entre deux niveaux dont les conséquences (coût, outils déployés) diffèrent
significativement — l'outil le signale explicitement et demande confirmation avant d'agir, plutôt
que de trancher arbitrairement un cas ambigu.

## Toujours expliquer, jamais une boîte noire

Chaque verdict de cet outil doit s'accompagner d'une explication lisible : quels signaux ont fait
pencher la balance, quels outils sont recommandés et pourquoi, quel est le coût attendu (gratuit ou
appels API réels). Une personne qui pilote le projet sans être développeuse doit pouvoir comprendre
le verdict sans avoir besoin de lire le code de l'outil lui-même.

## Registre : les évolutions de la règle, jamais un journal par appel

Contrairement à ARGUS/HARMONIA/Smart Conso API dont le registre archive des trouvailles ou des
décisions ponctuelles, CHECK-LEVEL-TARGET est consulté à haute fréquence (potentiellement à chaque
demande) — journaliser chaque appel exploserait rapidement le dépôt sans utilité réelle. Son
registre (dossier + index, même schéma que les autres) archive plutôt les ÉVOLUTIONS DE LA RÈGLE
elle-même (un nouveau signal ajouté, un poids recalibré, un niveau redéfini) — jamais chaque
consultation individuelle.

## Ce que ce patron n'est pas

- Un remplacement du jugement humain ou de l'agent sur les cas ambigus : il les signale, il ne les
  tranche jamais de force.
- Une estimation d'effort général de réponse, si le projet en a déjà une séparée.
- Un mécanisme qui déclenche lui-même les vérifications : il RECOMMANDE, l'agent ou la personne qui
  pilote le projet décide et exécute.
