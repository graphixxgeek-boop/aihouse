# La classification des rapports et des datas

*(Créé le 2026-09-26, tâches #955 / #956 / #957. Porté par `scripts/data-archangel.mjs`,
commande `node scripts/data-archangel.mjs classification`.)*

**CE DOCUMENT EST LA RÉPONSE À SA QUATRIÈME QUESTION.** Il a demandé, mot pour mot :
« Est-ce qu'un document qui PRÉSENTE cette classification existe ? » La réponse était non. Le
voici. Il présente le rangement ; il ne le calcule pas — les chiffres se lisent sur le rapport
généré, jamais recopiés ici, sans quoi ce document se périmerait au premier rapport suivant
(Article 24).

## Pourquoi elle existe

Sa demande : « ÉCLAIRCIR la masse de rapports et des datas ». Le dépôt porte, au jour de
création, **290 rapports** répartis dans **40 dossiers**, plus des données qui ne sont PAS des
rapports et que personne ne comptait avec eux. Rien ne disait de quoi chacun parle, à qui il
appartient, ni s'il sert encore à quelqu'un.

## Ce qui existait déjà, et ce qui manquait

Il a demandé « est-ce que ça existe déjà ? » pour chacune de ses trois commandes. Mesuré :

| | Existait | Manquait |
|---|---|---|
| **Les outils** | oui — `docs/referentiel/classification-agence.md`, généré, 8 axes | il classe des OUTILS, jamais leurs rapports ni les données |
| **Les registres** | à moitié — les entrées de `REGISTRIES` portent une FAMILLE | aucun axe de SUJET, aucune FONCTION |
| **Les rapports sur le disque** | non | tout |
| **Les datas autres que les rapports** | non | tout |
| **Le document qui présente** | non | celui-ci |

L'axe « équipe propriétaire » est donc **LU** chez celui qui le déclare (`REGISTRIES`, doc-report),
jamais recopié — le jour où une équipe change de nom, la classification change avec elle.

## Les trois axes

**Axe 1 — LE SUJET TRAITÉ.** De quoi parle ce rapport. Son vocabulaire (`SUJETS_DE_RAPPORT`) est
dérivé du corpus réel des `demande` du catalogue PRESTATIONS, jamais inventé — et
`findSujetsSansTerrain()` refuse qu'un sujet survive à la disparition de ses mots du corpus : un
sujet qui ne peut plus rien attraper rend zéro, ce qui se lit exactement comme « aucun rapport sur
ce thème ».

**Axe 2 — L'ÉQUIPE PROPRIÉTAIRE.** À qui il appartient. Lu dans les familles déclarées.

**Axe 3 — LA FONCTION.** Ses trois questions, chacune avec une réponse MESURÉE plutôt
qu'attribuée :

| Sa question | Où la réponse se lit |
|---|---|
| a-t-il besoin d'être lu ? | la DÉCISION déclarée du registre — un rapport livré en HTML est écrit pour ses yeux |
| par qui ? | les lecteurs réels : les scripts qui nomment le dossier, plus l'index |
| qu'alimente-t-il ? | ces mêmes lecteurs — ce sont les analyses qu'il nourrit |

Quatre fonctions, et **la quatrième est celle qui coûte** : *écrit et jamais rouvert* — ni
livraison, ni lecteur, ni index. Produit à chaque passage pour personne.

**LES DEUX PREMIERS SONT CROISÉS**, sur sa décision explicite (« les deux axes, croisés ») : une
case porte le sujet ET l'équipe, jamais deux listes côte à côte.

## Les quatre natures de donnée

Sa troisième commande demandait s'il existe des datas AUTRES que les rapports, et si la
classification les intègre. Elle les intègre : `NATURES_DE_DATA` en distingue quatre —
**RAPPORTS**, **REGISTRES**, **JOURNAUX locaux**, **SÉRIES CHIFFRÉES**. Les deux dernières ne sont
pas des rapports et n'étaient comptées nulle part avec eux.

## Ce qu'elle refuse de faire, et c'est le plus important

**Elle refuse de ranger ce qu'elle ne sait pas ranger.** Un rapport dont le sujet ne ressort pas
sort en « sujet non déterminé », jamais dans une case par défaut : un rapport mis de force dans une
case ment, un rapport non rangé se voit. Même chose pour un dossier absent des registres — il n'a
pas d'équipe, il n'en reçoit pas une inventée.

**La preuve que ce refus sert à quelque chose** : le premier vrai passage a rendu **18 dossiers sur
40 sans sujet**. Ce chiffre ne disait rien du dépôt — seulement que PRESTATIONS écrit « ARGUS » là
où REGISTRIES écrit « scripts/check-argus.mjs ». Après normalisation des deux orthographes
(`slugDOutil()`), il est tombé à 7. Un axe qui aurait rangé de force n'aurait jamais laissé voir
cette erreur (leçon L11).

## Hors périmètre, déclaré plutôt que tu

Les **données du JEU** (base D1, état d'une partie) ne sont pas rangées ici. Le périmètre est
l'Agence — ce que l'outillage produit et relit. Le jour où les données du jeu devront l'être, ce
sera un autre axe, jamais une extension silencieuse de celui-ci.

## Les deux formes de livraison

Sur sa décision (« document généré + HTML de lecture ») : la commande écrit **les deux**, dans
`docs/data-archangel/classification-<date>.txt` et `.html`. Les deux sortent d'**un seul calcul** —
deux passages finiraient par ne plus dire la même chose, et c'est le lecteur qui paierait la
différence.

## Ce qui reste ouvert

- Les **noms des quatre fonctions** sont dérivés, pas choisis par lui : ils lui reviennent
  (règle permanente — c'est lui qui nomme).
- La tâche **#612** (doublons de rapports de Ronde) était gelée en attendant cette
  classification, sur sa décision : « on garde ça pour après la classification des rapports et
  data, ce sera plus clair ». Elle peut rouvrir.
