# État de l'art — santé et rapidité d'une suite de tests (recherche du 2026-09-27)

**Pourquoi ce document existe, et pourquoi il vit ici plutôt que dans une réponse de chat.**
Demande explicite de l'utilisateur le 2026-09-27 : « fais aussi des recherches sur le web pour voir
s'il lui manque des choses, et pour affermir notre stratégie. Mets bien tous les résultats de
recherche de côté pour pouvoir s'en resservir. » Une recherche qui ne vit que dans une conversation
est perdue à la session suivante (Article 27) — celle-ci est archivée pour être relue, contestée et
réutilisée sur le prochain projet.

**Ce que ce document N'EST PAS** : une source de vérité sur notre code. C'est de la matière
extérieure, à confronter à notre dépôt réel avant d'en faire quoi que ce soit. Chaque ligne du
tableau final dit explicitement si c'est retenu, écarté (avec la raison) ou à trancher — Article 28.

**Limite de la collecte, déclarée plutôt que tue** : le conteneur d'exécution bloque l'accès direct
à la plupart des domaines (arxiv, IEEE, testsmells.org, qaskills.sh ont tous rendu
`EGRESS_BLOCKED`). Ce qui suit vient donc des RÉSUMÉS de recherche, pas de la lecture intégrale des
articles. Les titres et URL sont conservés pour qu'une lecture complète reste possible ailleurs.

---

## 1. Les « test smells » — le catalogue académique

Un *test smell* est un symptôme dans le code de test qui signale un problème de conception : le test
est illisible, fragile, lent ou peu fiable — **même quand il passe**. Ce n'est pas un bug, c'est un
signe qu'il coûtera cher à maintenir ou qu'il donne une fausse confiance.

| Smell | Ce que c'est | Détectable mécaniquement ? |
|---|---|---|
| **Assertion Roulette** | plusieurs assertions non documentées dans un même test : impossible de savoir laquelle a échoué | oui — assertions sans message |
| **Eager Test** | un test qui vérifie trop de comportements à la fois | oui — nombre de fonctions distinctes appelées |
| **Mystery Guest** | le test dépend d'une ressource externe (fichier, base) | oui — lectures de fichier / réseau dans le bloc |
| **General Fixture** | un décor commun bien plus gros que ce dont chaque test a besoin | partiellement |
| **Lazy Test** | plusieurs tests qui vérifient exactement la même méthode | oui — regroupement par cible |
| **Sensitive Equality** | l'assertion compare des représentations textuelles fragiles | oui — `toString()` dans une assertion |
| **Conditional Logic** | des `if`/boucles dans le test : certaines assertions peuvent ne jamais s'exécuter | oui — assertion sous condition |
| **Magic Number Test** | des valeurs numériques nues sans nom ni explication | oui |
| **Test Code Duplication** | des blocs copiés-collés | oui (nous avons CLONE-HUNTER) |

**Ce qui nous concerne directement** : `Assertion Roulette` est déjà couvert autrement chez nous
(nos messages d'assertion sont de vraies phrases, exigées par le filet lui-même). En revanche
`Conditional Logic` et `Mystery Guest` ne le sont pas, et les deux sont des trous réels.

## 2. Les tests qui NE PEUVENT PAS échouer — cinq formes

> « Un test inutile est un test qui ne peut pas falsifier son sujet : il passe que le code se
> comporte correctement ou non. »

Les cinq formes récurrentes, dans l'ordre de dangerosité :

1. **Assertion sur l'état interne** au lieu du comportement observable.
2. **Assertion sur un mock que le test a lui-même configuré** — il se répond à lui-même.
3. **Snapshot re-béni à chaque changement** : le test valide toujours ce qui vient d'arriver.
4. **Chemins d'assertion qui ne peuvent jamais rougir** : `expect` avalé par un `try/catch`,
   assertion dans un callback qui ne se déclenche jamais, `expect(true).toBe(true)`.
5. **Le test tautologique pur** : comparer la sortie de la fonction à... la même fonction.

> « Un test qui n'est jamais passé de rouge à vert sur N exécutions n'est pas un détecteur de
> régression, c'est une constante. »

Cette dernière phrase est la formulation la plus nette de ce que notre passe de robustesse mesure,
et elle suggère une mesure que nous n'avons pas : **l'historique rouge/vert par bloc**.

## 3. Le mutation testing — ce que la littérature dit de l'échantillonnage

Notre passe de robustesse est du mutation testing. Trois enseignements applicables :

- **L'échantillonnage aléatoire à 10 % perd 26 % du pouvoir de détection ; à 60 %, seulement 6 %.**
  Autrement dit : un petit échantillon renseigne mal, et il faut le dire plutôt que de présenter
  son score comme un verdict sur toute la suite.
- **La mutation sélective** (choisir les TYPES de mutants plutôt que de tirer au hasard) réduit
  l'arbitraire de l'échantillonnage aléatoire.
- **Le rythme recommandé est en deux temps** : mutation INCRÉMENTALE (sur le diff seulement) à
  chaque changement, et mutation COMPLÈTE périodiquement, la nuit. C'est exactement le découpage
  que notre passe séparée permet.
- **Les survivants nourrissent l'itération suivante** : un mutant survivant devient une consigne
  ciblée pour le test à écrire.

## 4. La rapidité — où va vraiment le temps

- **Trouver les 10 fichiers les plus lents** donne un gain démesuré quand un seul dépasse 30 s :
  mauvais mocks, vraies entrées/sorties, décor mal démonté. *(Chez nous : 12 blocs = 65,7 % de
  107 s. Le motif est exactement celui-là.)*
- **L'isolation coûte cher** : lancer chaque fichier de test dans un environnement isolé augmente
  fortement la durée ; la désactiver aide les projets qui nettoient bien leur état.
- **Ordonner les plus lents en premier** améliore la parallélisation.
- **Le cache d'adaptateurs par source** réduit beaucoup le surcoût quand les mêmes entrées sont
  lues plusieurs fois. *(Piste directe pour nous : nos blocs lisent-ils le dépôt plusieurs fois ?)*

## 5. Le Test Impact Analysis — le levier le plus lourd

Le principe : **on cartographie quel test couvre quel code, puis on ne relance que les tests dont
le code couvert a changé dans le commit.**

- L'analyse dynamique lance chaque test une fois avec instrumentation de couverture et enregistre
  les fichiers touchés ; la carte est stockée.
- La sélection est **déterministe** : le même changement produit toujours le même sous-ensemble.
- Le schéma courant est : carte complète sur la branche principale, sélection sur les branches.

**Pourquoi c'est directement pertinent ici** : notre crochet lance DÉJÀ le filet sous
instrumentation de couverture V8. La donnée nécessaire à cette carte est donc **déjà produite à
chaque commit** et jetée aussitôt.

## 6. La flakiness — causes et détection

- **Les trois premières causes** : attente asynchrone (`Async Wait`), concurrence, et
  **dépendance à l'ordre des tests**.
- Un test dépendant de l'ordre est affecté par un test antérieur, appelé le *pollueur*.
- Détection par **relance en ordre aléatoire** (iDFlakies), par **analyse de flux de données**
  (PraDet), par **couverture sans relance** (DeFlaker), ou en **stressant la machine** (Shaker).

**Ce que ça dit de nous** : notre filet est UN fichier séquentiel. La dépendance à l'ordre y est
donc possible et invisible — un bloc qui laisse un état derrière lui fait passer le suivant.

---

## Plan d'action (Article 28) — ce qu'on en fait

| # | Constat issu de la recherche | État | Suite |
|---|---|---|---|
| 1 | Assertions sous condition (`if`/`try`/callback) : elles peuvent ne jamais s'exécuter | **RETENU** | détecteur ajouté à Ezechiel le jour même |
| 2 | Mystery Guest : un bloc qui lit le disque est à la fois le plus lent et le plus fragile | **RETENU** | détecteur ajouté — il croise directement coût et fragilité |
| 3 | Dépendance à l'ordre : état partagé entre blocs | **RETENU** | détecteur d'état mutable partagé ajouté |
| 4 | Échantillonnage de mutation : un petit échantillon ne vaut pas verdict | **RETENU** | Ezechiel déclare désormais la couverture de son échantillon |
| 5 | Mutation incrémentale sur le diff | **RETENU** | `robustesse --diff` cible les lignes que le commit a touchées |
| 6 | Percentiles de durée plutôt que le seul top-N | **RETENU** | ajouté au croisement coût/protection |
| 7 | **Test Impact Analysis** — ne relancer que les tests concernés | **À TRANCHER** | c'est le plus gros levier (potentiellement 90 % du temps), mais il change la NATURE du filet : il ne protégerait plus tout à chaque commit. Décision de l'utilisateur, jamais de l'agent |
| 8 | Historique rouge/vert par bloc (« jamais rouge = une constante ») | **À TRANCHER** | demande d'accumuler des exécutions dans le temps ; la passe de robustesse répond déjà à la même question, plus vite |
| 9 | Désactiver l'isolation, paralléliser, ordonner les lents d'abord | **ÉCARTÉ** | sans objet : notre filet est UN seul fichier séquentiel, il n'y a ni isolation par fichier ni parallélisme à régler. Le dire évite qu'un futur agent y revienne |
| 10 | Snapshots re-bénis, mocks auto-configurés | **ÉCARTÉ** | ce dépôt n'utilise ni framework de snapshot ni bibliothèque de mocks ; le motif n'existe pas ici |

## Sources

- [Beyond Test Flakiness: A Manifesto for a Holistic Approach to Test Suite Health (IEEE)](https://ieeexplore.ieee.org/document/11052699/)
- [Beyond Test Flakiness — PDF](https://philmcminn.com/publications/mcminn2025.pdf)
- [Test Smells Catalog 2.0](https://test-smell-catalog.readthedocs.io/en/latest/Test%20semantic-logic/Testing%20many%20things/Assertion%20Roulette.html)
- [Software Unit Test Smells](https://testsmells.org/pages/testsmells.html)
- [Test Smells & Anti-Patterns Guide 2026](https://qaskills.sh/blog/test-smells-anti-patterns-guide-2026)
- [Do the Test Smells Assertion Roulette and Eager Test Impact… (arXiv)](https://arxiv.org/pdf/2303.04234)
- [Useless Unit Tests: 5 Patterns That Never Fail](https://getautonoma.com/blog/useless-unit-tests-tautological-anti-pattern)
- [Mutation Sampling Technique (arXiv)](https://arxiv.org/pdf/0710.4802)
- [Correlating automatic static analysis and mutation testing (JSERD)](https://jserd.springeropen.com/articles/10.1186/s40411-016-0031-8)
- [Mutation Testing — Stryker, Code Quality, and Killing Mutants](https://qaskills.sh/blog/mutation-testing-stryker-guide)
- [Test Impact Analysis (Datadog)](https://docs.datadoghq.com/tests/test_impact_analysis/)
- [Test Impact Analysis in CI (QASkills)](https://qaskills.sh/blog/test-impact-analysis-ci-guide-2026)
- [Test Flakiness' Causes, Detection, Impact and Responses: A Multivocal Review (arXiv)](https://arxiv.org/pdf/2212.00908)
- [Empirically evaluating flaky test detection techniques (EMSE)](https://link.springer.com/article/10.1007/s10664-023-10307-w)
- [Reduction of Test Re-runs by Prioritizing Potential Order Dependent Flaky Tests (arXiv)](https://arxiv.org/html/2510.26171)
- [Improving Performance — Vitest](https://vitest.dev/guide/improving-performance)
- [How to Speed Up Vitest: 12 Practical Fixes (BuildPulse)](https://buildpulse.io/blog/how-to-speed-up-vitest)
- [Why Are My Tests So Slow? 7 Quick Fixes](https://blog.testunity.com/slow-test-execution-7-quick-fixes/)
- [Measuring the Effectiveness of Test Suites: Beyond Code Coverage Metrics (Codecov)](https://about.codecov.io/blog/measuring-the-effectiveness-of-test-suites-beyond-code-coverage-metrics/)
