<!-- DOCUMENT GÉNÉRÉ — produit intégralement par un outil, aucune ligne n'est écrite à la main -->
# TOTAL RECALL — le cadrage, et ce que l'opération coûterait vraiment

> Produit par `node scripts/ines-official.mjs memoire` le 2026-10-03. Porté par **Inès**, sur ta décision (P86).

> **DÉCOULE DE :** `docs/strategies/strategie-globale-du-projet-entier.md`
> *la mémoire entre deux sessions est une condition de l'attelage entre les projets : sans elle,
> chaque reprise redémarre à zéro et la direction descendante ne descend plus.*

## ① Ce que TOTAL RECALL est, dans tes mots

> « un rafraîchissement **complet** de la mémoire de l'IA de l'utilisateur, un rafraîchissement
> **forcé mécaniquement** »

**Et sa limite, dans tes mots aussi, qui est l'élément central à ne pas perdre :**

> « l'opération total recall est **trop lourde** pour répondre au périmètre unique de “où on
> en est” : une **couche plus légère** est prévue »

**Ce qui l'a provoquée** : le soir du 30 septembre, la mémoire de session a été perdue parce que
tu as éteint ton PC. Ce n'est pas un incident, c'est un irritant structurel — une IA n'a pas de
mémoire entre deux sessions, et tout ce qui n'est pas ÉCRIT dans le dépôt disparaît.

## ② Ce que « complet » coûte, mesuré

Tu annonces une décision à prendre sur l'ampleur du rafraîchissement. Elle se prend sur un coût,
et personne ne pouvait le donner. Le voici.

| Le système de mémoire | Documents | Poids | Tokens estimés | Dernière date écrite |
|---|---|---|---|---|
| le suivi — ce qui a été fait, tâche par tâche, daté | 11 | 3406 Ko | ~968 743 | 2026-10-03 |
| les fils — où en est chaque sujet, qui a la balle | 15 | 144 Ko | ~40 962 | 2026-10-03 |
| les stratégies — les analyses de fond, datées | 42 | 450 Ko | ~128 124 | 2026-10-03 |
| les notes de chantier — ce qui se passe sur un chantier précis | 25 | 216 Ko | ~61 318 | 2026-10-03 |
| les textes qui font loi — la charte, la gouvernance, les règles de travail | 116 | 1693 Ko | ~481 575 | 2026-10-03 |
| **TOTAL — un rafraîchissement COMPLET** | **209** | **5909 Ko** | **~1 680 722** | |

**La fraîcheur est lue DANS le texte, jamais sur la date du fichier** : un `git clone` réécrit
toutes les dates de modification, donc un dépôt fraîchement transporté paraîtrait tout neuf — et
le transport est exactement le cas d'usage de TOTAL RECALL.

## ③ La couche légère, et l'écart entre les deux

Relire **le document le plus récent de chaque système** coûterait environ
**651 451 tokens**, soit **39 %** du rafraîchissement complet.

| Le système | Son document le plus récent | Coût |
|---|---|---|
| le suivi — ce qui a été fait, tâche par tâche, daté | `docs/suivi/sessions/session_0151JrVYzJ2bdCShaXhFAjLo-partie-2.md` | ~615 137 tokens |
| les fils — où en est chaque sujet, qui a la balle | `docs/fils/fil-04-systeme-de-travail.md` | ~3 717 tokens |
| les stratégies — les analyses de fond, datées | `docs/strategies/export-et-commercialisation-strategie.md` | ~8 705 tokens |
| les notes de chantier — ce qui se passe sur un chantier précis | `docs/plans/filet-de-securite-ou-part-le-temps.md` | ~2 213 tokens |
| les textes qui font loi — la charte, la gouvernance, les règles de travail | `docs/referentiel/safe-export.md` | ~21 679 tokens |


### UN SEUL FICHIER DÉCIDE DU RÉSULTAT, et c'est le constat le plus actionnable de ce rapport

`docs/suivi/sessions/session_0151JrVYzJ2bdCShaXhFAjLo-partie-2.md` pèse à lui seul **~615 137 tokens**,
soit **94 %** de la couche légère et
**37 %** de toute la mémoire du projet.

**Sans lui, la couche légère tomberait à ~36 314 tokens,
soit 2 % du complet** — c'est-à-dire l'ordre de grandeur
auquel on s'attend d'une couche « légère ».

**Ce que ça veut dire concrètement.** Le suivi range ses lignes par SESSION, et une session qui
dure devient un fichier qui n'a plus de fin. Toute lecture « légère » du suivi est donc
impossible par construction : son unité de découpage n'est pas une unité de lecture. Ce n'est
pas un problème de TOTAL RECALL — c'est un problème que TOTAL RECALL révèle, et qui se règle
avant lui.

**Ce que ce rapport établit** : ton intuition est juste. Les deux opérations ne sont pas la même
à deux réglages près — elles diffèrent d'un ordre de grandeur, donc elles méritent bien deux
mécanismes distincts, et non un seul avec un curseur.

## ④ Ce que cette mesure NE dit pas

Elle mesure un VOLUME à relire, jamais la QUALITÉ du souvenir qu'on en tire. Relire 100 % du
dépôt ne garantit pas de retrouver la bonne information au bon moment — c'est même le défaut
que l'Article 30 corrige par l'autre bout, en cherchant les notes AVANT d'ouvrir un chantier.
Elle ne dit rien non plus du canal : une mémoire parfaitement écrite et jamais relue ne sert à rien.

# PLAN D'ACTION

| État | Constat | Suite |
|---|---|---|
| ✅ MESURÉ | un rafraîchissement complet représente ~1 680 722 tokens sur 209 documents | #1545 |
| ✅ MESURÉ | la couche légère en représente ~39 % : les deux opérations diffèrent d'un ordre de grandeur, ta séparation est fondée | #1545 |
| ? À TRANCHER | jusqu'où va le rafraîchissement « forcé » : tout, ou les systèmes les plus frais ? Tu annonces cette décision toi-même | #1545 |
| ? À TRANCHER | comment nommer le groupe des cinq systèmes de mémoire — c'est ta question (P80), et les noms t'appartiennent | #1546 |
| ? À INSTRUIRE | la couche légère n'existe pas encore : ce rapport chiffre ce qu'elle coûterait, il ne la construit pas | #1545 |
| → RETENU | `docs/suivi/sessions/session_0151JrVYzJ2bdCShaXhFAjLo-partie-2.md` pèse 37 % de toute la mémoire du projet : le suivi se découpe par SESSION, et une session qui dure n'a plus de fin. À découper avant TOTAL RECALL, sinon aucune lecture « légère » du suivi n'est possible | #1545 |

<!-- /DOCUMENT GÉNÉRÉ -->
