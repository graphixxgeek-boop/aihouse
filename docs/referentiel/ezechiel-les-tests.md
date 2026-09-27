# EZECHIEL-LES-TESTS — instanciation sur ce projet

**Extension d'Abraham-les-references dédiée au FILET DE SÉCURITÉ.** Créé le 2026-09-27 (tâche
#1026), sur demande explicite de l'utilisateur : « sa vocation ultime : faire baisser le temps
d'exécution de la chaîne de test ». Blueprint générique : `docs/ezechiel-les-tests-blueprint.md`.

**Le périmètre est plus large que « les tests », et c'est sa décision** : « on doit construire
Ezechiel autour de TOUTE la mécanique qui constitue le filet mais AUSSI la mécanique qui ENTOURE ce
filet, c'est une vue plus large, qui permet de saisir tous les tenants et aboutissants du problème ».

## La commande

```
EZ_NU_MS=<ms> EZ_COUV_MS=<ms> EZ_TSC_MS=<ms> node scripts/ezechiel-les-tests.mjs
```

Sans les durées, l'axe « d'où vient le temps » affiche **PAS MESURÉ** plutôt qu'un verdict — c'est
délibéré : conclure sans les trois durées serait optimiser à l'aveugle. Les autres axes tournent.

## Ce qu'il réutilise plutôt que de le refaire

`mesurerLeFilet()` et `repartitionDuFilet()` de SMART-CONSO-TOKEN, qui chronomètrent déjà groupe par
groupe, et le MÊME découpage en groupes — pour que les deux outils parlent des mêmes groupes. Deux
découpages différents rendraient deux inventaires impossibles à croiser (leçon L29).

## L'état réel au premier passage (2026-09-27)

| | |
|---|---|
| Le filet | 17 165 lignes · 283 groupes · 5 616 assertions |
| Chaîne réelle | 8 commandes, dont **2 bloquantes** |
| Filet nu | **116 s** |
| Sous instrumentation | 107 s — **surcoût non mesurable**, les deux durées sont dans la même marge |
| Typage | 6 s |
| **Part des tests** | **95 %** du temps bloquant |
| Groupes sans assertion | 6 |
| Groupes sans raison écrite | 1 |
| Imports morts | 0 |
| Titres en double | 3 |

**LE RÉSULTAT CONTREDIT L'HYPOTHÈSE DE DÉPART, et c'est ce qui le rend utile.** L'agent avait posé
que le triplement du filet (43,7 s le 2026-09-25 → 116 s le 2026-09-27) venait de ce qui l'entoure.
La mesure dit le contraire : l'enveloppe pèse 5 %. **Le gain est bien dans la suite elle-même** —
mais on le sait maintenant, au lieu de le supposer.

## Ses trois défauts trouvés à son PREMIER vrai passage, et corrigés le jour même

Ils valent d'être écrits : chacun aurait produit une accusation fausse, et un garde-fou qui accuse à
tort cesse d'être lu (leçon L4).

1. **16 groupes « sans assertion » dont 10 faux** — cinq lignes de succès consécutives comptées comme
   cinq groupes.
2. **8 imports « morts » dont ZÉRO ne l'était** — des chemins de fixture pris pour des imports.
3. **« les tests 103 %, l'enveloppe −3 % »** — un pourcentage négatif rendu comme un résultat.

## Ce qu'il ne fait pas

Il n'écrit jamais dans `scripts/check-house.mjs`. tool-brain le classe TUYAUTERIE score 9, le plus
haut du dépôt : sa panne empêche tout commit.
