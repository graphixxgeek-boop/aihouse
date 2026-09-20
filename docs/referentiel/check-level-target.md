# CHECK-LEVEL-TARGET — instanciation pour Maison IA vivante

*(Cf. `docs/check-level-target-blueprint.md` pour le principe générique. Créé le 2026-09-19, nommé
par l'utilisateur lui-même après avoir rejeté une première proposition ("TRIAGE").)*

## Les 4 niveaux, pour ce projet

| Niveau | Outils recommandés | Coût |
|---|---|---|
| **Léger** | `check-house.mjs` | gratuit |
| **Standard** (défaut si aucun signal détecté) | `check-house.mjs` + ARGUS + HARMONIA (partie mécanique) | gratuit |
| **Approfondi** | + `check-spirit.mjs`, `check-profile.mjs`, THE-FINAL-JUDGE (mode léger) | réel — consulter Smart Conso API avant de lancer |
| **Exceptionnel** | HYPER-SCAN-CHECKPOINT (bugs cachés) et/ou ALWAYS-NEW-CODE (restructuration), selon le registre détecté ; THE-FINAL-JUDGE (mode lourd) pour un avis produit/architecture indépendant | réel — consulter Smart Conso API avant de lancer |

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

## Registre

`docs/check-level-target/` — évolutions de la règle (signaux ajoutés/retirés, poids recalibrés),
jamais un journal par appel individuel (cf. blueprint, fréquence d'usage trop élevée pour ça).
