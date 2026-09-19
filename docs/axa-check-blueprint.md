# AXA-CHECK — robustesse et fragilité réelles par fonction — blueprint exportable

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur, née d'une question directe posée en
plein calibrage de CLEAN-DIRTY-OLD : « pour l'outil qui repère les fragilités du code : il faut que
cet outil sait identifier les zones de code non couvertes par les tests et les zones sécurisées
(couvertes). quel est cet outil ? » — aucun outil ne répondait à ça avant ce jour. Spin-off en outil
à part entière (pas une brique interne de CLEAN-DIRTY-OLD) sur décision explicite de l'utilisateur,
pour que tout le réseau la consulte plutôt que chacun réinvente sa propre mesure de couverture. Même
logique que les autres outils de ce projet : ce document décrit le PATRON générique ; l'instanciation
propre à *Maison IA vivante* vit dans `docs/referentiel/axa-check.md`.)*

## Le problème que ce patron résout

Un projet peut avoir une suite de tests verte (`check-house.mjs` le garantit déjà) sans que cela
dise QUELLE PART du code réel cette suite exécute vraiment. Une fonction jamais appelée par aucun
test peut casser en silence à la prochaine modification, sans qu'aucun garde-fou mécanique ne le
voie — jusqu'à ce jour, seule une lecture humaine attentive du code pouvait repérer ce genre
d'angle mort. AXA-CHECK rend ce signal mesurable et automatique.

## Mécanique centrale — zéro nouvelle dépendance

La plupart des runtimes JavaScript modernes exposent une vraie mesure de couverture au niveau du
moteur d'exécution lui-même (dans Node.js : la variable d'environnement `NODE_V8_COVERAGE`, qui
écrit un relevé JSON par processus, gratuit, sans bibliothèque tierce). Deux conditions suffisent
pour que ce relevé soit exploitable sur du code source réel plutôt que sur du code transpilé
illisible :
1. **Une transpilation qui préserve les numéros de ligne** (la plupart des compilateurs TypeScript
   le font par défaut en mode simple, sans minification) — le relevé de couverture, qui parle en
   décalages d'octets dans le fichier EXÉCUTÉ, se réaligne alors fiablement avec le fichier SOURCE.
2. **Une suite de tests déjà existante qui exécute ce code transpilé** — la couverture est un
   sous-produit gratuit d'une exécution qui aurait eu lieu de toute façon, jamais un second run
   dédié coûteux.

Si ces deux conditions sont réunies (souvent déjà le cas dans un projet qui a un filet de sécurité
mécanique), la couverture par fonction est mesurable avec zéro nouvelle dépendance.

## Granularité — par fonction, jamais par ligne ni par fichier

Décision de conception centrale de ce patron : le signal utile pour un agent qui doit décider "où
regarder en premier" est la fonction, pas la ligne (trop fin, noyé de détail) ni le fichier (trop
grossier, un fichier de 300 lignes avec une seule fonction non testée semblerait "fragile" en bloc).
Une fonction non nommée par le compilateur (fonction anonyme/fléchée sans nom inféré) est
honnêtement exclue plutôt que rapportée sous un nom vide trompeur — limite connue, jamais masquée.

## Robustesse et fragilité — deux mesures, jamais un simple miroir

La robustesse (% de fonctions couvertes) est un pourcentage brut. La fragilité n'est PAS son simple
complément (100 − robustesse) : une fonction non couverte n'a pas la même gravité selon son
contexte. Ce patron enrichit le signal de fragilité avec deux sources indépendantes, ni l'une ni
l'autre suffisante seule :
- **Proximité avec une zone reconnue sensible** du projet (si un tel registre existe déjà — cf.
  HARMONIA/CHECK-LEVEL-TARGET dans ce projet) — une fonction non couverte dans une zone fragile du
  domaine mérite plus d'attention qu'une fonction non couverte dans un utilitaire périphérique.
- **Signal d'accumulation historique** (si un outil de ce genre existe déjà dans le projet — cf.
  ALWAYS-NEW-CODE) — du code qui n'a connu que des ajouts, jamais une refonte, et qui reste non
  couvert, cumule deux signaux de risque indépendants.

Chaque raison est nommée explicitement dans le résultat (jamais un score opaque) et le niveau de
confiance reste toujours nuancé (confirmé / probable / à surveiller, même vocabulaire que les
autres outils de raisonnement de ce paysage) — jamais une certitude absolue sur un jugement qui
reste, au fond, un signal statistique.

## Seconde preuve, plus grossière mais réelle — corroboration par des sessions réelles archivées

Si le projet archive déjà des traces de sessions réelles (logs de simulation, journaux d'usage),
ce patron peut corroborer, au niveau d'une ZONE fonctionnelle (jamais au niveau fonction — la trace
archivée ne descend généralement pas à ce niveau de détail), qu'un comportement s'est réellement
produit en conditions réelles au moins une fois. C'est une preuve plus faible que la couverture de
test (elle dit "ça s'est produit", jamais "un test vérifie que le résultat est correct"), à ne
jamais confondre avec elle dans le discours de l'outil.

## Limite honnête, structurelle, jamais à masquer

Une ligne EXÉCUTÉE par un test n'est pas une ligne PROUVÉE juste. AXA-CHECK mesure un signal de
robustesse (le code a-t-il seulement été exercé), jamais une garantie de correction (le résultat
est-il le bon). Une fonction à 100% de couverture peut encore contenir un bug que le test ne
vérifie pas — ce patron ne remplace jamais la qualité intrinsèque des assertions écrites, seulement
leur portée d'exécution.

## Consultation par les autres outils, jamais une réinvention parallèle

D'autres outils de vigilance qui ont besoin d'un signal "ce code est-il testé ?" (par exemple un
détecteur de code stagnant/obsolète) doivent consulter ce patron plutôt que ré-implémenter leur
propre mesure de couverture — règle de mutualisation générale à tout projet qui accumule plusieurs
outils de vigilance (cf. la règle anti-doublon documentée dans les règles de travail de ce projet).

## Jamais une application automatique, jamais une décision de fond

Comme tout autre patron de ce paysage : ce patron identifie et rapporte, il ne modifie jamais le
code lui-même, il ne décide jamais qu'un test doit être écrit — c'est toujours une décision de la
personne ou de l'agent qui pilote le projet.

## Ce que ce patron n'est pas

- Un outil de couverture de ligne générique façon `nyc`/`istanbul` : la granularité par fonction et
  l'enrichissement de fragilité (sensibilité + churn + corroboration) sont des choix délibérés,
  pas une limite technique de ce qui existe par ailleurs.
- Une garantie de correction : seulement un signal d'exécution.
- Un concurrent des autres outils de ce paysage : il les NOURRIT (un détecteur de dette
  d'organisation, par exemple, gagne à savoir si le code qu'il examine est aussi non testé).
