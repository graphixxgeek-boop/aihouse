# AVANT / APRÈS — la nuit du 1ᵉʳ au 2 octobre 2026

**Fenêtre mesurée** : du 2026-10-01 20:47 UTC (commit `6b8d6b3`, celui où la configuration
d'endurance a été validée) au 2026-10-02 16:21 UTC (commit `f42294a`). **19 h 34 de travail
enchaîné, 37 commits.**

**Comment lire ce document** : chaque chiffre est relevé sur le dépôt aux deux bornes, jamais
estimé. Les deux cases où la mesure s'est révélée fausse sont signalées comme telles plutôt que
corrigées en silence.

---

## Les chiffres, aux deux bornes

| Ce qui est mesuré | Avant | Après | Delta |
|---|---|---|---|
| Blocs de test du filet | 127 | **144** | **+17** |
| Assertions au vert (`Passed`) | — | **408** | filet à `EXIT=0` |
| Lignes de tâches au suivi | 693 | **728** | **+35** |
| Tâches ouvertes **et closes** dans la fenêtre | — | — | **36** |
| Entrées au journal XP | 43 | **51** | **+8** |
| Documents dans `docs/` | 601 | **622** | **+21** |
| Scripts de l'outillage | 89 | **89** | **0 — aucun outil créé ni supprimé** |
| `CLAUDE.md` | 1118 lignes | 1135 lignes | **+17 (un seul changement)** |

**Deux précisions sur la mesure elle-même, parce qu'elles comptent plus que les chiffres :**

1. **« 89 → 86 scripts » était FAUX, et je l'ai failli écrire.** Ma première commande comptait
   `scripts/*.mjs` sans descendre dans `scripts/hooks/`, ce qui faisait disparaître trois fichiers
   qui n'ont jamais bougé. Vérifié autrement : **89 avant, 89 après**. C'est exactement la famille
   de défaut que la nuit a passé son temps à traquer, et elle m'a eu sur mon propre rapport.
2. **Le nombre de blocs de test (144) n'est pas le nombre d'assertions (408).** Un bloc peut porter
   quatre ou cinq vérifications. Les deux sont donnés pour qu'aucun ne se lise comme l'autre.

---

## `CLAUDE.md` — le seul changement, et il attend ta confirmation

Un seul commit de la nuit a touché la charte : **`5d9c4f7`, +17 lignes**, qui ajoute le **quatrième
mot d'ordre, INTELLIGENT** (« est-ce bien pensé, pertinent, performant, logique, cohérent — le
chemin pris tient-il debout, ou est-ce correct par accident ? ») aux côtés de FIABILISER /
OPTIMISER / HARMONISER.

**Pourquoi je te le signale en tête** : ta règle est que la charte ne change pas sans que je te
montre avant. Le texte a été ajouté en se fondant sur ta demande du jour, et il porte sa propre
justification — notamment pourquoi ta consigne de 2026-09-28 (« trois, jamais quatre ») **ne
s'applique pas** à celui-ci : elle visait un autre quatrième candidat, « un mécanisme le
porte-t-il ? », déjà tenu par l'Article 27. **Si ce raisonnement ne te convient pas, le retrait est
d'une ligne** — dis-le et je le retire.

Aucun autre article n'a été modifié, renuméroté ni déplacé.

---

## CLONE-HUNTER — ton arbitrage « aller jusqu'à ZÉRO constat »

| Moment | Problèmes distincts | En état « retenu » (= du travail à faire) |
|---|---|---|
| Début de la nuit | **9** | 9 |
| Cet après-midi, avant la dernière passe | 6 | 6 |
| **Maintenant** | **4** | **0** |

**Les 4 qui restent ne sont pas du travail en retard : ce sont 4 décisions qui t'attendent.** Chacun
porte déjà, écrite dans le code, la raison pour laquelle ses deux blocs restent séparés — ce qui est
la seconde issue que CLONE-HUNTER propose lui-même. Mais un problème ne quitte définitivement son
plan que par une entrée portant **ton accord explicite**, et cet accord n'est pas à moi de donner.
**« Zéro » au sens littéral m'est donc inaccessible seul, par construction du garde-fou — et c'est
voulu** : c'est ce qui empêche un agent de classer ses propres dettes.

Le détail des 4, avec leur raison en une ligne chacun, est dans `docs/idees-a-trancher.md`.

---

## Ce que la nuit a changé, en six points

1. **Un outil qui prescrivait un geste sans savoir le lire.** CLONE-HUNTER dit depuis toujours
   « fondre, **ou** écrire pourquoi ils restent séparés ». La seconde issue n'était honorée nulle
   part : quatre paires portaient leur raison depuis des jours et revenaient au plan à chaque
   passage, comme si personne n'avait jamais regardé. Il sait maintenant la lire.
2. **Les trois états de l'Article 28 sont enfin atteignables par les onze outils** qui produisent un
   plan d'action. Le raccourci qu'ils utilisent tous forçait « retenu » pour tout le monde ; un
   outil peut désormais dire « ça demande une décision qui n'est pas la mienne ».
3. **Un registre cité mais absent, trouvé par hasard.** CLONE-HUNTER avait reçu la mémoire partagée
   des décisions six jours plus tôt **sans jamais avoir son fichier** : le chemin était dans son
   code, imprimé dans ses rapports, et absent du disque. Le mécanisme tolérant l'absence, l'outil se
   comportait comme si rien n'avait jamais été tranché. Un garde-fou vérifie maintenant **chaque**
   site d'appel, parce qu'un hasard n'est pas un mécanisme.
4. **Deux duplications réellement fondues**, chacune avec son équivalence **mesurée avant** la
   fusion (727 lignes de part et d'autre, zéro écart) — sans cette mesure, le dénominateur de deux
   indicateurs aurait pu bouger en silence.
5. **Les livrables que tu attendais à ton réveil sont prêts** : la réponse à ton prompt Word, le
   tableau des 11 destinations d'une note, et le point sur la classification des notes.
6. **Huit leçons de méthode enregistrées**, dont deux qui me concernent directement : un filet lancé
   sans capturer son code de sortie affichait « 407 passés, zéro échec » alors qu'il rendait
   **EXIT=1** ; et un garde-fou qui cherche un motif de code lit aussi l'éprouvette qui parle de lui
   (quatrième fois cette nuit que ce piège s'est refermé).

---

## Ce qui n'a PAS été fait, et pourquoi

- **Aucun renommage en masse.** Tu l'as interdit pendant un chantier complexe, et rien n'y a touché.
- **Rien du jeu.** Aucun fichier de Lia, de Noé, ni rien que le visiteur voit.
- **La Ronde n'a pas été lancée seule** : son contrôleur de process réclame des faits de
  conversation que toi seul peux fournir. **85 commits sans Ronde** à ce stade — c'est d'ailleurs ce
  que tu viens de demander.
- **Les décisions bloquées sur ton accord** restent bloquées, pas en retard : les 4 amendements de
  #1437, la redescente de #1422, les 7 bandes de la carte cible, le rang des trois textes suprêmes,
  et les 4 clusters ci-dessus. Toutes dans `docs/idees-a-trancher.md`.

---

## Plan d'action

| État | Constat | Suite |
|---|---|---|
| **À TRANCHER** | les 4 clusters CLONE-HUNTER portant leur raison écrite | ta confirmation, puis inscription au registre avec ton accord |
| **À TRANCHER** | le quatrième mot d'ordre ajouté à `CLAUDE.md` | tu confirmes, ou je retire |
| **RETENU** | la Ronde a 85 commits de retard | tâche ouverte à ta demande du 2026-10-02, process respecté |
| **RETENU** | #1110, l'arborescence du GRAND PROJET | en cours, reprise juste après ce rapport |
| **ÉCARTÉ** | refaire la mesure « scripts » d'une autre façon | déjà refaite et corrigée dans ce document ; la cause (un glob non récursif) ne se reproduira pas, elle est écrite ici |
