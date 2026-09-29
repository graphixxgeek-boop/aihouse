# LES CINQ IMPOSSIBLES — notre philosophie, révélée plutôt qu'inventée

*(Écrit le 2026-09-29 au soir. **Aucune de ces réponses n'a été inventée** : chacune existait déjà
dans la charte, dans une leçon, ou dans un mécanisme qui REFUSE pour de vrai. Ce document les
rassemble, il ne les crée pas.)*

> **DÉCOULE DE :** `docs/grand-projet/01-absorption/syntheses/PHILOSOPHIE_ET_POLITIQUE.md`
> *le test des cinq impossibles vient de son document Copilot, et la synthèse l'a désigné comme le
> passage le plus rentable des six.*

---

## POURQUOI CE TEST PLUTÔT QU'UN AUTRE

Le document propose cinq questions : *que refusons-nous absolument · que n'autoriserons-nous jamais
· que n'automatiserons-nous jamais · que ne déléguerons-nous jamais · que ne sacrifierons-nous
jamais ?* Avec cette remarque : **« les réponses définissent souvent mieux la philosophie que les
valeurs elles-mêmes »**.

**Il a raison, et pour une raison qu'il ne donne pas** : une valeur affichée ne coûte rien. Un
refus, si — il se paie en fonctionnalités qu'on n'aura pas. **Ce qu'on refuse est donc vérifiable,
là où ce qu'on proclame ne l'est pas.**

**Et c'est la méthode du projet** — *« il y a beaucoup de choses à RÉVÉLER et non à INVENTER »*.
Chaque réponse ci-dessous porte donc **son porteur réel** : l'Article, la leçon, ou le mécanisme qui
la fait tenir. **Une réponse sans porteur n'est pas une conviction, c'est une intention** — et il y
en a, elles sont signalées comme telles.

---

## ① CE QUE NOUS NE SACRIFIERONS JAMAIS

| Ce qu'on ne sacrifie pas | Son porteur |
|---|---|
| **L'esprit de Lia et Noé** — rugueux, sarcastique, jamais consensuel | **Article 0**, loi suprême du Jeu · `check-spirit` est le seul outil qui touche la sortie RÉELLE |
| **La finalité de celui qui emploie l'Agence**, jamais la sienne propre | `docs/loi-de-l-agence.md`, et son interdiction testable : l'Agence n'aura jamais son propre Article 0 |
| **La traçabilité** — d'où vient un chiffre, qui a décidé quoi, pourquoi | Articles 27, 28 et 32, et leurs garde-fous qui refusent un commit |
| **L'expérience de celui qui s'en sert**, avant le confort de l'Agence | la loi de l'Agence, seconde phrase — *un outil juste mais pénible viole la loi* |

**Le prix déjà payé pour le premier** : deux cerveaux Gemini séparés au lieu d'un, alors qu'un seul
coûterait moitié moins. L'Article 8 le dit explicitement — *« maintenue malgré son coût »*.

---

## ② CE QUE NOUS N'AUTORISERONS JAMAIS

| Ce qui est interdit | Son porteur, et il REFUSE pour de vrai |
|---|---|
| **Un satisfecit rendu sur zéro donnée** | `jeNeSaisPas()` **lève une erreur** si on ne dit pas QUOI n'a pas pu être mesuré et POURQUOI — « une abstention sans objet ni cause ne se distingue pas d'un oubli » |
| **Un degré de confiance sans sa raison** | `avecConfiance()` **lève une erreur** — « probable sans raison n'est pas un degré de confiance, c'est une précaution de style » |
| **Une date fabriquée plutôt que lue** | **trois** fonctions distinctes lèvent une erreur en citant l'Article 32, et `findHorodatagesFuturs()` refuse le commit |
| **Un rapport sans titre** | `buildReportFrame()` lève une erreur |
| **Désactiver un test pour obtenir du vert** | déclaré non négociable dans les règles de reprise |

**Ce sont les seuls « jamais » du projet qui ne reposent pas sur ma mémoire** : ils sont écrits en
code, et le code refuse. **C'est la forme la plus forte qu'un principe puisse prendre ici.**

---

## ③ CE QUE NOUS N'AUTOMATISERONS JAMAIS

| Ce qui reste humain | Son porteur |
|---|---|
| **Juger qu'une leçon a été APPLIQUÉE** | `enregistrerXp()` **lève une erreur** sans `parUtilisateur: true` — « jamais l'agent sur son propre travail » |
| **Choisir un NOM** | `agent-des-noms` **lève la même erreur** — « un nom n'est valable que CHOISI PAR L'UTILISATEUR » |
| **Ranger un Article par famille** | liste manuelle **déclarée comme telle** : c'est un jugement, aucun signal mécanique ne le rend. Seule la COUVERTURE est mécanisée |
| **Décider qu'un outil ne sert plus** | aucun mécanisme ne le fait, et c'est écrit : le compteur d'usage mesure des passages, jamais de l'utilité |

**Le point commun des quatre, et c'est ça la conviction** : **on n'automatise jamais un jugement de
VALEUR sur notre propre travail.** On automatise la mesure ; on refuse d'automatiser le verdict.

---

## ④ CE QUE NOUS NE DÉLÉGUERONS JAMAIS

| Ce qui lui revient | Son porteur |
|---|---|
| **La décision finale, sur tout sujet** | le process du mode autonome : *« aucune autorité de décision supplémentaire n'est accordée »*, même la nuit |
| **Toute tension entre sa demande et la charte** | **Article 14**, et sa DOUBLE confirmation — jamais après une seule |
| **Rouvrir ou fermer ce qu'il a sciemment mis de côté** | règle tenue dans les décisions en attente : écarter une tâche est une décision, pas un constat |
| **Ce qui fait LOI** | cinq documents seulement font loi, et leur liste est manuelle avec une raison par entrée |

**Ce qu'on délègue en revanche volontiers** : la mesure, le repérage, le refus mécanique, le
rappel. **La frontière est nette — les outils CONSTATENT, ils ne tranchent pas.**

---

## ⑤ CE QUE NOUS REFUSONS ABSOLUMENT

| Le refus | D'où il vient, et ce qu'il a déjà coûté |
|---|---|
| **Faire puis défaire** | sa consigne du 2026-09-29 : *« pas la peine de perdre du temps à faire puis défaire »*. C'est ce qui a placé le rangement de `scripts/` à l'étape ④ plutôt que ce soir |
| **Un outil fabriqué pour cocher une case** | **Article 31, faille 2** : un script qui imprime ce que j'aurais écrit de tête n'est pas un outil. Critère : il doit pouvoir rendre un résultat que je ne connaissais pas d'avance |
| **Un garde-fou qui accuse à tort** | **leçon L4**, payée cinq fois ce soir : un détecteur qui accuse le geste normal cesse d'être lu, et il est alors pire qu'absent |
| **Une copie tenue à la main sans rien qui détecte l'écart** | **Article 24**, et quatre cas réels où la promesse de synchronisation avait déjà cessé d'être vraie |
| **Corriger une occurrence au lieu de la classe** | **leçon L37** — ce soir encore, une correction a révélé quatre autres occurrences du même défaut |

---

## CE QUE CE TEST RÉVÈLE, ET QUI N'ÉTAIT PAS VISIBLE AVANT

**1. Notre philosophie tient en une phrase, et elle porte sur la CONNAISSANCE, pas sur le code.**
Quatorze des vingt refus ci-dessus parlent de la même chose : **ne jamais laisser passer pour un
fait ce qui n'en est pas un.** Une date supposée, un chiffre non mesuré, une confiance sans raison,
un zéro qui veut dire « je n'ai pas regardé », un accord qui ressemble à une réponse. **C'est ça
notre conviction centrale**, et aucun de nos 34 Articles ne la formule ainsi.

**2. C'est exactement la règle que JESUS proposait d'ajouter à la charte** — *« LA MESURE AVANT
L'OPINION »*, tâche **#767**, en attente de son arbitrage depuis cinq jours. **Trois sources
indépendantes la réclament maintenant** : JESUS, le document Copilot, et ce test appliqué à nous.

**3. La différence de FORCE entre les cinq questions est mesurable.** Les impossibles ② et ③ sont
portés par du code qui lève une erreur — indestructibles. Les ① , ④ et ⑤ ne sont portés que par des
textes — ils survivent à une session parce qu'ils sont écrits, jamais parce qu'ils sont vrais.
**Cette asymétrie est une information sur nous, pas un défaut à corriger** : on ne mécanise pas un
jugement de valeur, c'est justement l'impossible ③.

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Ce qu'il devient |
|---|---|---|
| Nos réponses aux cinq impossibles existaient, dispersées, jamais rassemblées | **RETENU** | tâche **#1243** — ce document |
| Notre conviction centrale (« ne jamais laisser passer pour un fait ce qui n'en est pas un ») n'est formulée dans aucun Article | **À TRANCHER** | c'est la règle #767, en attente depuis cinq jours et désormais réclamée par trois sources |
| Trois des cinq impossibles ne reposent que sur des textes | **ÉCARTÉ, avec sa raison** | c'est l'impossible ③ lui-même : on ne mécanise pas un jugement de valeur. Le déclarer EST la protection (Article 27) |
