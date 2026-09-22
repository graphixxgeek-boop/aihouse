# Plan d'action global — mardi 22 septembre 2026

Produit après la question : *« et les plans d'action écrits dans ces rapports et dans le rapport de
hyperscan : tu les as lu ? des plans d'action avec des tâches en sortie ? »*

**La réponse honnête à cette question était NON.** Les rapports avaient été livrés sans être lus, et
aucune tâche n'en était sortie. Ce document est ce qui aurait dû exister à ce moment-là.

Il suit le schéma unifié : `SCAN >> RAPPORTS >> ANALYSE >> PLAN D'ACTION >> QUESTIONS >> TÂCHES DE TRAVAIL`.
On est ici au maillon **PLAN D'ACTION**. Les questions viennent après, les tâches après elles.

---

## 1. Ce que le scan a réellement trouvé

| Source | Trouvailles | État |
|---|---|---|
| ARGUS ⏫ | 6 champs de `lib/life.ts` potentiellement jamais lus | à confirmer à la main |
| CLONE-HUNTER ⏫ | 28 clusters (16 littéraux + 12 par renommage) | mesuré |
| SAFE-EXPORT ⏫ | 11 écarts d'exportabilité sur 29 blueprints | mesuré |
| AXA-CHECK ⏫ | 1 fonction non couverte (`lib/playback.ts::wait()`), 99 % global | mesuré |
| ALWAYS-NEW-CODE ⏫ | zone « Cycle jour/nuit » jamais examinée | rotation, pas une dette |
| HARMONIA ⏫ | 0 friction sur 5 liens | propre |
| CLEAN-DIRTY-OLD ⏫ | 0 zone en stagnation | propre |
| pure-gold-unity | 20 outils sur 32 ne concluent jamais | mesuré |
| Cérémonies | 2 non relayées (safe-export, tool-learning) | **texte irrécupérable** |

⏫ = Gardien sacré, donc plan prioritaire (dérivé de `GARDIEN_DOMAINS`).

## 2. L'analyse — ce que ces chiffres disent ensemble

**Un seul défaut explique la moitié de cette liste, et il a un nom : un mécanisme qui existe mais
qui ne sort jamais du script.** Six instances trouvées dans la même journée :

1. ARGUS calculait 6 champs morts et ne concluait rien.
2. `findRapportsQuiPointent()` : construite, testée, appelée par aucun `main()`.
3. `findOutilsSansPlanDaction()` accusait les deux seuls outils conformes.
4. Les verdicts des 7 Gardiens n'arrivaient jamais jusqu'à la livraison de la Ronde.
5. Le verdict d'angel n'était relayé par personne.
6. La cérémonie enregistre **qu'elle a eu lieu**, jamais **ce qu'elle disait**.

La n° 6 est la plus vicieuse et elle est encore ouverte : le crochet exige de l'afficher
*« TEL QUEL […] jamais résumé en une phrase »*, et l'historique ne garde que le slug et la date.
Une cérémonie non relayée le jour même ne peut donc plus jamais l'être. Ce n'est pas un oubli de ma
part que je peux rattraper — c'est le mécanisme qui rend le rattrapage impossible.

**Le second constat, plus inconfortable :** le paysage sait parfaitement mesurer, et très mal
conclure. 32 outils passent le gabarit à 100 %, et 20 d'entre eux ne disent jamais quoi faire de ce
qu'ils trouvent. La forme était unifiée avant que le fond ne le soit.

## 3. Le plan d'action — chaque constat reçoit un état, jamais deux

### RETENU (devient une tâche)

| # | Constat | Tâche | Niveau |
|---|---|---|---|
| R1 | La cérémonie ne garde pas son texte → non relayable a posteriori | Persister le texte produit, pas seulement le slug+date | OBLIGATOIRE (fausse une obligation de process) |
| R2 | 20/32 outils ne concluent jamais | Câbler le plan d'action sur les 20, par vagues | RECOMMANDÉE |
| R3 | 11 écarts d'exportabilité (4 fuites de jargon + 7 blueprints mal formés) | Rendre les 11 réellement exportables | OBLIGATOIRE (classé ainsi par vous) |
| R4 | `lib/playback.ts::wait()` non couverte | Écrire le test, ou déclarer la vérification | OBLIGATOIRE (fausse le score global) |
| R5 | Liste de tâches périmée (#199, #201 closes mais « pending ») | Fait à l'instant — 2 tâches reclassées | — |

### ÉCARTÉ, avec la raison écrite (un écart sans raison est un abandon déguisé)

| Constat | Pourquoi on ne fait rien |
|---|---|
| ALWAYS-NEW-CODE : zone « Cycle jour/nuit » | Une rotation de calendrier n'est pas une dette. Le vrai zoom coûte de vrais tokens et ne se lance jamais seul (Article 23). Reste proposé, jamais retenu. |
| CLEAN-DIRTY-OLD : 0 zone | Rien trouvé. « J'ai regardé, il n'y a rien » est un résultat, pas un silence. |
| HARMONIA : 0 friction | Idem. |
| Les 67 fichiers citant `*-process-guardian` | Rang déjà non ambigu (`process` est dans le nom). Renommage massif = risque réel pour un gain de clarté nul. Déjà déclaré tel quel dans l'Article 20bis. |

### À TRANCHER (ce sont mes questions, elles suivent ce document)

| Constat | Ce qui se décide |
|---|---|
| ARGUS : 6 champs `life.ts` | Les retirer touche le moteur du jeu. La leçon `trottoirGranted` dit qu'un champ « mort » peut être une décision assumée. |
| CLONE-HUNTER : 28 clusters, tous avec le même libellé générique | Est-ce 28 vrais problèmes, ou un outil qui compte du bruit ? |
| Ordre des chantiers | Ce que je fais en premier. |

## 4. Ce que je NE fais pas sans votre accord

- **Rien sur la refonte graphique** (tâche #92) — borne posée par vous, jamais franchie.
- **Aucun retrait dans `lib/life.ts`** — ça touche le jeu, donc ça passe par vous.
- **Aucune factorisation CLONE-HUNTER** avant d'avoir tranché si les 28 sont réels.
