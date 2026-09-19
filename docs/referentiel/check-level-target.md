# CHECK-LEVEL-TARGET — instanciation pour Maison IA vivante

*(Cf. `docs/check-level-target-blueprint.md` pour le principe générique. Créé le 2026-09-19, nommé
par l'utilisateur lui-même après avoir rejeté une première proposition ("TRIAGE").)*

## Les 4 niveaux, pour ce projet

| Niveau | Outils recommandés | Coût |
|---|---|---|
| **Léger** | `check-house.mjs` | gratuit |
| **Standard** (défaut si aucun signal détecté) | `check-house.mjs` + ARGUS + HARMONIA (partie mécanique) | gratuit |
| **Approfondi** | + `check-spirit.mjs`, `check-profile.mjs` | réel — consulter Smart Conso API avant de lancer |
| **Exceptionnel** | HYPER-SCAN-CHECKPOINT (version complète) | réel — consulter Smart Conso API avant de lancer |

## Ce qui existe aujourd'hui

- **`scripts/check-level-target.mjs`** — `classifyCheckLevel(texte)` : reconnaissance de motifs
  (formulations réellement observées dans l'historique du projet — "vérifie", "en profondeur",
  "exhaustif", "toutes les combinaisons", "machine de guerre"...), pondérés par niveau. Validé
  directement contre les vrais prompts historiques qui ont motivé la création d'HYPER-SCAN-
  CHECKPOINT (Article 21) : le prompt du 2026-09-19 classe bien en "approfondi", un simple correctif
  classe bien en "léger".
- **Absence de signal → "standard" par défaut**, jamais "léger" : sous-évaluer silencieusement le
  niveau serait plus risqué que le sur-évaluer légèrement (cohérent avec Article 20 : ARGUS/HARMONIA
  tournent de toute façon à chaque changement de code).
- **Confirmation demandée uniquement si la marge entre les deux niveaux les plus probables est
  étroite** (`CONFIRMATION_MARGIN = 0.25` dans le script) — décision explicite de l'utilisateur :
  jamais interrompre sur un cas clair.

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
