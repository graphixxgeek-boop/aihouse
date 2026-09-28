# CHECK-LEVEL-TARGET — instanciation pour Maison IA vivante

*(Cf. `docs/check-level-target-blueprint.md` pour le principe générique. Créé le 2026-09-19, nommé
par l'utilisateur lui-même après avoir rejeté une première proposition ("TRIAGE").)*

## Les 4 niveaux, pour ce projet

| Niveau | Outils recommandés | Coût |
|---|---|---|
| **Léger** | `check-house.mjs` | gratuit |
| **Standard** (défaut si aucun signal détecté) | `check-house.mjs` + ARGUS + HARMONIA (partie mécanique) | gratuit |
| **Approfondi** | + `check-spirit.mjs`, `check-profile.mjs`, THE-FINAL-JUDGE (intensité basse à modérée, périmètre choisi selon le doute réel) | réel — consulter Smart Conso API avant de lancer |
| **Exceptionnel** | HYPER-SCAN-CHECKPOINT (bugs cachés) et/ou ALWAYS-NEW-CODE (restructuration), selon le registre détecté ; THE-FINAL-JUDGE (intensité approfondie à très lourde) pour un avis produit/architecture indépendant | réel — consulter Smart Conso API avant de lancer |

**Ne pas confondre ces 4 niveaux avec l'échelle interne de THE-FINAL-JUDGE.** *(Précisé le
2026-09-20, à la demande explicite de l'utilisateur de vérifier l'harmonie entre les taxonomies du
paysage.)* THE-FINAL-JUDGE a sa PROPRE échelle d'intensité à 6 paliers (très léger → très lourd, cf.
`docs/referentiel/the-final-judge.md`), qui partage deux mots ("léger", "approfondi") avec la table
ci-dessus sans en être un sous-ensemble ni un synonyme : les 4 niveaux ci-dessus décident QUELS OUTILS
déployer dans le paysage entier, tandis que les 6 paliers de THE-FINAL-JUDGE décident uniquement DE
QUELLE PROFONDEUR CE SEUL OUTIL lit le projet une fois qu'on a déjà décidé de le déclencher — une
granularité plus fine, propre à un outil coûteux qu'on veut pouvoir doser précisément, jamais un
raffinement de cette table à 4 niveaux. La correspondance ci-dessus (Approfondi → intensité basse à
modérée, Exceptionnel → intensité approfondie à très lourde) reste une tendance générale, jamais un
verrou : c'est toujours l'agent qui pilote le projet qui choisit le palier exact au moment de
déclencher THE-FINAL-JUDGE, quel que soit le niveau CHECK-LEVEL-TARGET en cours.

## Ce qui existe aujourd'hui

- **`scripts/check-level-target.mjs`** — `classifyCheckLevel(texte)` : reconnaissance de motifs
  (formulations réellement observées dans l'historique du projet — "vérifie", "en profondeur",
  "exhaustif", "toutes les combinaisons", "machine de guerre"...), pondérés par niveau. Validé
  directement contre les vrais prompts historiques qui ont motivé la création d'HYPER-SCAN-
  CHECKPOINT (Article 21) : le prompt du 2026-09-19 classe bien en "approfondi", un simple correctif
  classe bien en "léger".
- **Deux registres au sein du niveau "Exceptionnel" (2026-09-19, ajouté à la création d'ALWAYS-
  NEW-CODE)** : `EXCEPTIONNEL_BUG_SIGNALS` (hyper-scan, machine de guerre, audit complet...) et
  `EXCEPTIONNEL_STRUCTURE_SIGNALS` (reconstruire depuis zéro, grands axes, code empilé,
  restructurer...) sont vérifiés indépendamment pour recommander le bon outil, ou les deux si les
  deux registres sont détectés dans la même demande. **Vrai gap trouvé en dogfoodant l'outil sur sa
  propre demande de création** : la formulation "reconstruire ce système en partant de zéro,
  imaginer les grands axes idéaux..." retombait à tort en "standard" (gratuit) faute de mot-clé
  reconnu — fermé le même jour, avant toute mise en production de ce gap (cf.
  `scripts/check-house.mjs` pour le test de non-régression).
- **Absence de signal → "standard" par défaut**, jamais "léger" : sous-évaluer silencieusement le
  niveau serait plus risqué que le sur-évaluer légèrement (cohérent avec Article 20 : ARGUS/HARMONIA
  tournent de toute façon à chaque changement de code).
- **Confirmation demandée uniquement si la marge entre les deux niveaux les plus probables est
  étroite** (`CONFIRMATION_MARGIN = 0.25` dans le script) — décision explicite de l'utilisateur :
  jamais interrompre sur un cas clair.

## Rappel de test approfondi sur les nœuds sensibles (2026-09-19)

Demande explicite de l'utilisateur : « un des outils nous rappelle quand des tests approfondis sont
nécessaires, même si pas obligatoires ». `SENSITIVE_NODES` réutilise tel quel la carte des « nœuds
sensibles » déjà identifiée par HARMONIA (`docs/referentiel/harmonia.md`) — jamais une seconde carte
inventée à part. À chaque exécution, `recentlyChangedSensitiveNodes()` croise les fichiers changés
récemment (travail non commité + dernier commit) avec cette carte, et affiche un rappel — jamais
bloquant, jamais un niveau relevé de force — si un changement touche un nœud à fort impact. Tourne
automatiquement à chaque exécution de l'outil, comme ARGUS/HARMONIA (décision explicite de
l'utilisateur).

## Distinct de l'échelle ⏱️/🔢

Confirmé explicitement par l'utilisateur : CHECK-LEVEL-TARGET remplace la façon informelle de
choisir les OUTILS DE VÉRIFICATION, jamais l'échelle qualitative d'effort général
(`docs/regles-de-travail.md` §B.2bis, affichée en début de réponse) qui reste un indicateur séparé,
répondant à une question différente (durée/volume d'une réponse, pas quels outils déployer).

## Usage

`node scripts/check-level-target.mjs "<texte de la demande>"` — pensé pour être consulté par
l'agent avant de décider comment traiter une demande de vérification, pas pour un usage direct par
l'utilisateur (même si rien ne l'empêche).

## Limite honnête

Reconnaissance de motifs sur le texte, jamais une vraie compréhension de l'intention — de la même
nature que `detectDistress`/`detectNegotiationOffer` déjà en place dans le moteur du jeu. Les mots
choisis pour chaque niveau resteront à affiner avec l'usage réel ; toute évolution de cette liste
est une évolution de RÈGLE, à consigner dans `docs/check-level-target/index.md`, jamais un simple
ajustement silencieux.

## Garde-fou de fraîcheur (2026-09-21, Article 24)

`SENSITIVE_NODES` promettait par simple commentaire de rester synchronisé avec la carte HARMONIA,
sans aucune vérification mécanique — même classe de bug que `THEMES` d'ALWAYS-NEW-CODE.
`extractHarmoniaSensitiveNodes()`/`findSensitiveNodesDivergingFromHarmonia()` relisent le texte réel
de harmonia.md et rapportent tout écart dans les deux sens, câblé dans `main()`.

## Registre

`docs/check-level-target/` — évolutions de la règle (signaux ajoutés/retirés, poids recalibrés),
jamais un journal par appel individuel (cf. blueprint, fréquence d'usage trop élevée pour ça).

## Le mode réparation — la zone rouge (2026-09-28, tâche #695, volet D des « failles des IA »)

**Le chiffre.** Plus de **65 % des incidents graves** surviennent en **correction** et en
**configuration**, pas en écriture de fonctionnalité. L'outillage de ce projet, lui, est tourné vers
la construction.

**Et le défaut était écrit noir sur blanc dans cet outil** : `corrige` et `fix` vivaient dans le
registre **LÉGER**. Autrement dit, l'outil chargé de dire quel niveau de vérification déployer
**abaissait** la vigilance attendue sur très exactement la zone que la mesure désigne comme la plus
dangereuse. **Ce n'est pas un oubli de vocabulaire, c'est une inversion** : le mot qui devrait
alerter était celui qui rassurait.

**La correction est un PLANCHER, jamais un saut de niveau.** Une demande de réparation ou de
configuration ne descend plus sous `standard` — le niveau où les Gardiens sacrés du code tournent de
toute façon, donc **un plancher qui ne coûte rien**. Relever d'office à `approfondi` aurait été
l'erreur symétrique : un outil qui crie à chaque correction cesse d'être lu (L4).

**L'exemption est la moitié de la règle.** Une coquille (`typo`, `coquille`, `faute de frappe`) ou
un renommage sont des réparations sans risque : quand ce sont les **seuls** signaux, le niveau léger
reste mérité. Sans cette exemption, le plancher s'appliquerait à tout et deviendrait du décor. La
zone rouge est tout de même **nommée** dans ces cas-là, parce que ce verdict vient d'une
reconnaissance de motifs et jamais d'une compréhension de la demande.

**Le plancher relève et ne rabaisse jamais.** Une demande déjà classée `approfondi` le reste : un
plancher qui plafonnerait aussi serait un nivellement, et perdrait l'information qu'on cherche à
gagner.

**Et il ne s'applique jamais en silence** : le niveau relevé porte sa raison chiffrée dans le
`reasoning`. Un outil qui remonte un niveau sans dire pourquoi se fait contourner dès la deuxième
fois — c'est déjà la règle de la pression de registre, et elle vaut ici aussi.

**Une borne existante a été réécrite sur son intention, jamais desserrée.** Le filet exigeait que
« corrige ce bug d'affichage » reste `leger`, avec pour raison écrite « never over-trigger the
EXPENSIVE tiers ». `standard` n'est pas un palier coûteux : l'intention est intacte, c'est le
chiffre qui bougeait. **Et une seconde assertion a trouvé un vrai trou dans ce travail** —
« faute de frappe » manquait à la liste des réparations sans risque. Une liste incomplète ne se
répare pas en desserrant le test qui la trouve.
