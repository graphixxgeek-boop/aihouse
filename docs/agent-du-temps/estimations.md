# Registre des estimations — AGENT-DU-TEMPS

*(Une mesure par ligne. L'estimation d'AVANT et le réel d'APRÈS, côte à côte : c'est la seule
façon d'ajuster les suivantes, et une estimation jamais comparée n'a jamais rien appris.)*

| Quand | Quoi | Durée estimée | Durée réelle | Tokens estimés | Tokens réels | Appels API | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-23 | Ronde GOAT MAX (33 items) | 38 min | 27 min | ~ | ~ | 0 | SUR-ESTIMÉE (+41 %) |
| 2026-09-24 22h55 → 00h20 | Soirée de calibrage : 36 questions en 9 fenêtres, rapport de commande-en-masse, sauvegarde, Ronde rapide | 80 min | 63 min | 0 | 0 | 0 | sur-estime (+27 %) — CORRIGE le 2026-09-24 a 23h58 : le premier « reel » (85 min) avait ete TAPE depuis mon ressenti au lieu d'etre calcule sur l'horloge. Meme defaut que l'horodatage tape, applique a la mesure elle-meme, et il faussait le facteur d'ajustement dans le mauvais sens. |

## 2026-09-30 — les trois couches du filet, mesurées pour Ezechiel (tâche #1274)

*(Heure LUE, source système. Mesuré, jamais estimé — c'est le but de l'entrée.)*

| Couche | Durée réelle |
|---|---|
| filet nu | **107,9 s** (380 Passed, exit 0) |
| filet sous instrumentation (couverture V8 native, `NODE_V8_COVERAGE`) | **111,7 s** (380 Passed) |
| typage (`tsc --noEmit`) | **3,0 s** |

**Le surcoût de l'instrumentation est de 3,7 s, soit 3,4 %.** Sur le total bloquant de 114,7 s,
les tests pèsent **94 %** et l'enveloppe **6 %**.

**Pourquoi cette entrée compte plus qu'un simple relevé** : c'était l'unique alerte BLOQUANTE
d'Ezechiel, ouverte parce qu'il refuse de conclure sur une impression. Et la mesure a retiré une
option de la table de la décision #819 — un « mode rapide » qui supprimerait l'enveloppe gagnerait
sept secondes sur cent quinze.

**Ce que la mesure ne dit pas** : elle porte sur UNE exécution de chaque, sur une machine dont la
charge n'est pas contrôlée. Un relevé antérieur d'Ezechiel donne 94,0 s pour le filet nu, le même
code. **L'écart de 14 s entre deux exécutions du même filet est lui-même l'information** : toute
optimisation qui gagnerait moins que ça serait indiscernable du bruit.
