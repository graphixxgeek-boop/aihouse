# Journal du banc témoin — les passages, un par un

*(Créé le 2026-09-28, tâche #1054. **C'est un DÉPLACEMENT, jamais une suppression.** Le texte
ci-dessous vient verbatim de `docs/strategies/export-et-commercialisation-strategie.md`, où un
JOURNAL s'était installé à côté des DÉCISIONS — exactement le défaut que le registre des tâches
avait déjà payé (#1024). Son arbitrage, mot pour mot : « Oui, même principe que les tâches ». Et sa
consigne, mot pour mot aussi : « il ne faut surtout pas perdre le contenu des stratégies de
chantier » — d'où ce fichier plutôt qu'une coupe.*

*La STRATÉGIE garde ce que ces passages ont DÉCIDÉ (les cinq contraintes d'export) et ce qui reste à
trancher. Ce journal garde ce qu'ils ont VÉCU : les critères du témoin, le déroulé de chaque essai,
les chiffres, les défauts trouvés — y compris celui qui était dans le banc lui-même.*

*Il vit dans `docs/safe-export/`, le registre de SAFE-EXPORT, qui existait déjà : le banc témoin est
son instrument, donc son journal est chez lui. Un troisième endroit se serait périmé comme tous les
autres (Article 13).)*

---

### Les critères d'un bon projet témoin, et le premier essai RÉEL (2026-09-27)

**Sa question** : « on prend un vrai dépôt extérieur ? pour que ça sorte des redondances
éventuelles dues à moi, pour que ça sorte de ma bulle ». **L'intuition est juste, et c'est le
critère le plus important des cinq.**

| Critère | Pourquoi il compte |
|---|---|
| **ÉTRANGER** | un témoin qu'on a écrit soi-même porte nos propres habitudes : les outils s'y sentiraient chez eux et on ne verrait rien |
| **REPRODUCTIBLE** | le même témoin doit rendre le même verdict — un dépôt extérieur se fige sur un commit précis, jamais suivi en continu |
| **PETIT ET RAPIDE** | il doit se rejouer à chaque Ronde ; un témoin qui prend dix minutes ne sera plus lancé |
| **RÉALISTE** | un vrai projet avec son vrai désordre, pas une maquette assainie qui ne surprendra personne |
| **PAUVRE EN OUTILLAGE** | ni charte, ni référentiel, ni filet : c'est le moment « AVANT » de la grille des quatre moments, et le plus révélateur |

**PREMIER ESSAI FAIT LE JOUR MÊME**, sur un vrai dépôt public cloné dans le conteneur (le réseau le
permet, vérifié). Les 82 scripts copiés dedans, huit outils lancés :

| Verdict | Outils | Ce que ça dit |
|---|---|---|
| ✅ **tourne** | Ezechiel (7 × « pas mesuré »), data-archangel, SAFE-EXPORT, Abraham, tool-brain | ils survivent à un dépôt inconnu et DÉCLARENT ce qu'ils ne peuvent pas mesurer — c'est le **bon** résultat, pas un échec |
| 💥 **plante** | ecotoken, le-classificateur, MOÏSE | ils cherchent un fichier de charte qui n'existe pas et s'arrêtent net |

**Trois enseignements en trois minutes de test :**

1. **La distinction « honnête » / « non portable » n'est pas théorique** : Ezechiel dit sept fois
   « pas mesuré » et rend la main proprement. C'est exactement le comportement voulu.
2. **On ne peut pas emporter UN outil, on emporte l'Agence ou rien** : le premier essai avec dix
   scripts a planté sur des imports manquants. La toile de dépendances est dense — ce n'est pas un
   défaut, mais c'est une contrainte d'export à écrire.
3. **Trois outils sur huit plantent sur l'absence de charte.** C'est le cas le plus fréquent et le
   plus facile à corriger : rendre « pas de charte trouvée » au lieu de s'arrêter.

**Décision proposée** : le témoin principal est un **dépôt public extérieur figé sur un commit**,
parce qu'il est le seul à casser la bulle. Le programme HTML de l'utilisateur ferait un **second
témoin** précieux mais pour une autre question — l'Agence arrivant sur un vrai produit sans aucun
outillage, écrit par lui, donc utile immédiatement mais porteur de ses habitudes.

### Le déroulé exact du premier essai, et l'identité du témoin (ajouté le 2026-09-27)

**LE TÉMOIN EST NOMMÉ, et il fallait le faire** : le critère « reproductible » exige un dépôt figé
sur un commit, et le premier compte rendu décrivait « un dépôt public » sans dire lequel — un témoin
anonyme n'est pas reproductible, c'est une anecdote.

| | |
|---|---|
| **Dépôt** | `github.com/sindresorhus/slugify` |
| **Commit** | `3b17b2e` |
| **Taille** | 13 fichiers suivis |
| **Pourquoi lui** | étranger (écrit par quelqu'un d'autre, avec d'autres habitudes), minuscule donc rejouable en secondes, réel (une vraie bibliothèque utilisée par des milliers de projets), et **sans aucun outillage de l'Agence** — ni charte, ni référentiel, ni suivi, ni filet nommé comme le nôtre |

**Le déroulé, dans l'ordre :**

1. **Vérifier que le réseau du conteneur autorise un clone.** Il l'autorise. Point non trivial : sans
   ça, tout le dispositif du témoin tombait.
2. **Premier essai avec DIX scripts copiés** — choisis à la main, ceux qu'on croyait autonomes.
   **Il a planté immédiatement sur des imports manquants.** C'est la trouvaille la plus structurante
   de l'essai, et elle a été trouvée en trois minutes.
3. **Deuxième essai avec les 82 scripts.** Là, ça démarre.
4. **Huit outils lancés** dans le dépôt étranger, et les verdicts du tableau ci-dessus.

**CE QUE L'ESSAI A COÛTÉ : environ trois minutes.** C'est le rapport coût/trouvailles qui justifie
d'en faire un rituel plutôt qu'une expérience unique.

### Les quatre contraintes d'export que cet essai a écrites

Chacune est une conséquence directe de ce qui s'est passé, jamais une précaution théorique.

1. **L'Agence s'emporte ENTIÈRE, jamais à la carte.** La toile de dépendances entre les 82 scripts
   est dense : `lib-shell.mjs`, `tool-usage.mjs`, `report-template.mjs` sont importés par presque
   tout le monde. Ce n'est pas un défaut de conception — c'est ce qui fait qu'un nouvel outil hérite
   du travail des autres (Article 24) — mais **ça doit être écrit noir sur blanc dans le manuel
   d'installation** : « copier dix scripts ne marche pas, et l'erreur ne dira pas pourquoi ».
2. **Un outil qui ne trouve pas la charte doit le DIRE, jamais s'arrêter.** Trois outils sur huit
   plantent sur exactement ce point. C'est le cas le plus fréquent ET le plus facile à corriger, ce
   qui en fait la première correction de portabilité à faire.
3. **« Pas mesuré » est un SUCCÈS d'export, pas un échec.** Ezechiel a rendu sept fois « pas
   mesuré » et a rendu la main proprement. Un taux de portabilité qui compterait ces sept-là comme
   des échecs pousserait à fabriquer des réponses là où il n'y a pas de données — l'exact contraire
   de la discipline anti-faux-vert de ce projet. **D'où les trois verdicts et non deux** : portable,
   HONNÊTE, non portable.
4. **Le témoin se rejoue, il ne se visite pas une fois.** Trois minutes pour huit outils : le geste
   est assez court pour entrer dans la Ronde. Un témoin lancé une seule fois mesure l'état d'un
   jour ; lancé à chaque Ronde, il mesure une TRAJECTOIRE — et c'est la trajectoire qui dit si
   l'Agence devient réellement portable ou si elle en parle seulement.

### Le SECOND passage du témoin (2026-09-27, le soir même) : 5/8 → 8/8

La première correction de portabilité identifiée par l'essai a été faite dans la foulée, puis le
témoin **rejoué** — parce qu'une correction non rejouée est une intention.

| | Avant | Après |
|---|---|---|
| Outils qui tournent sur le dépôt étranger | **5/8** | **8/8** |
| Outils qui meurent sur l'absence de charte | 3 | 0 |

**Les trois réparés ne rendent pas une réponse fabriquée** — c'est le point qui compte. Ils rendent
une absence DÉCLARÉE : « pas de charte ici, voici à quoi elle me sert, je rends la main proprement ».
Une seule fonction partagée pour les trois, jamais trois correctifs locaux.

**ET LE SECOND PASSAGE A TROUVÉ UN DÉFAUT DANS LE TRAVAIL DE LA MÊME JOURNÉE** — c'est la meilleure
preuve de l'utilité du témoin : la détection automatique du filet, écrite quelques heures plus tôt,
pointait vers NOTRE filet à l'intérieur du dépôt étranger. Parce que **l'Agence emporte ses propres
crochets avec elle**, et que le crochet nomme notre fichier.

### Le PREMIER CHIFFRE DE PORTABILITÉ VENU D'UN LANCEMENT RÉEL (2026-09-27)

Les huit outils du premier essai étaient un sondage. **Le banc d'essai lance maintenant TOUS les
outils lançables** dans le dépôt étranger et classe ce qui se passe :

```
58 / 73 outils tiennent debout  —  79 %
  ✅ 38 portables         il tourne et rend un résultat sur un dépôt qu'il ne connaît pas
  ⚪ 15 honnêtes          il tourne et DÉCLARE ce qu'il ne peut pas mesurer
  🔤  5 attendent un argument  il refuse correctement de tourner à vide — le banc l'avait mal appelé
  💥 15 non portables     il s'arrête sur une hypothèse qui n'est vraie que chez nous
  ( 8 hors sujet, nommés : ils servent le PRODUIT et n'ont jamais eu à partir)
```

**LA COMPARAISON AVEC LE CHIFFRE LU EST LE VRAI ENSEIGNEMENT.** La lecture du code disait
**49 % de portabilité** (42 scripts sur 82 portent un chemin de ce dépôt) ; le lancement réel dit
**73 %**. Les deux sont justes, et **ils ne mesurent pas la même chose** : un chemin cité n'est pas
forcément un défaut — beaucoup d'outils citent `docs/referentiel/` et savent très bien vivre sans.
Inversement, un outil sans aucun chemin suspect peut mourir sur une hypothèse invisible. **C'est
exactement pourquoi l'arbitrage « le témoin d'abord » était le bon : la lecture surestime le
problème, et seule la mesure dit où il est vraiment.**

**Deux décisions de calcul, et chacune protège contre un chiffre flatteur dans un sens différent :**

- **« Honnête » compte du BON côté.** Un taux qui punirait l'honnêteté pousserait les outils à
  fabriquer des réponses là où il n'y a pas de données.
- **Les outils qui servent le produit sortent du calcul, mais ils sont NOMMÉS.** Un dénominateur
  qu'on réduit sans dire qui on retire est un dénominateur qu'on choisit.

**Le geste** : `node scripts/safe-export.mjs temoin --ou=<chemin d'un dépôt étranger>`. Il REFUSE de
tourner sans cible plutôt que de viser ce dépôt-ci par défaut — mesurer que l'Agence marche chez
elle serait un satisfecit sur une question que personne n'a posée.

### Le banc a trouvé deux défauts, et l'un d'eux était DANS le banc

**Premier — le faux positif du mesureur.** Le banc lance chaque outil sans argument, et cinq d'entre
eux sortaient en erreur pour la meilleure des raisons : ils **réclament un argument et refusent
proprement**. Les compter comme non portables était une erreur du MESUREUR, jamais un défaut du
mesuré. **Le taux passe de 73 à 79 % sans qu'une ligne n'ait été corrigée ailleurs : la mesure était
fausse, pas le parc.** D'où un quatrième verdict, qui n'absorbe QUE le mode d'emploi — un vrai
plantage sur fichier absent reste non portable.

**Second — et c'est le plus beau cas de la journée pour justifier un témoin étranger.** Le runner
parallèle, sur un dépôt **sans relevé de durées**, mettait **120 blocs dans la part 1 et ZÉRO dans
les trois autres** : tous les blocs pesant zéro, le remplissage prenait toujours la première part.
**La parallélisation ne parallélisait plus rien, en silence.** Personne ne pouvait le voir ici, où
les mesures existent toujours. Sans poids, la répartition se fait désormais au nombre.

**L'enseignement pour l'export** : un outil se teste sur un dépôt qui **manque de quelque chose**.
Chez nous, tout est là depuis toujours — c'est précisément ce qui rend nos angles morts invisibles.

### La cinquième contrainte d'export, née de là

**CE QUI NE DOIT PAS VOYAGER est aussi important que ce qui voyage.** Le kit d'export doit lister
explicitement les fichiers qui restent :

| Ne part pas | Pourquoi |
|---|---|
| `scripts/hooks/` | les crochets de CE dépôt ; emportés, ils font croire à l'Agence qu'elle est chez elle et faussent toute détection |
| le fichier de tests du produit | SAFE-EXPORT le tranche déjà : il se réécrit, seule son ARCHITECTURE part (`docs/architecture-du-filet.md`) |
| le script d'installation de l'environnement | propre à la machine d'origine |

Sans cette liste, une installation naïve (« je copie `scripts/` ») emporte tout, et les outils
détectent l'ancien projet au lieu du nouveau — **une panne silencieuse, jamais une erreur**.

### Le TROISIÈME passage du témoin (2026-09-28) : 79 % → 89 %, et le banc mentait

**Ce qui a été fait.** Les quinze outils encore non portables ont été instruits un par un en les
lançant pour de vrai dans le dépôt témoin et en lisant le fichier et la ligne exacts où chacun
mourait. Trois familles nettes en sont sorties, et elles se soignent différemment :

| Famille | Outils | Le geste |
|---|---|---|
| **Il LIT un document de loi** sans vérifier qu'il existe | le-coordinateur, the-king, the-equalizer, hyper-scan-checkpoint, kpi-report, el-professor | `lireLeDocumentGouvernant()` — l'absence se DÉCLARE |
| **Il LISTE un dossier** supposé présent | check-suivi-fidelity | `listerLeDossierGouvernant()` — même geste, forme dossier |
| **Il ÉCRIT** dans un dossier jamais créé | ou-on-en-est | `assurerLeDossierDeSortie()` — ici on CRÉE, on ne renonce pas |

**La troisième se traite à l'inverse des deux autres, et c'est la subtilité du jour.** Quand un outil
LIT, l'absence est un résultat légitime à déclarer. Quand il ÉCRIT, non : le rapport, on sait le
produire — renoncer serait une panne déguisée en honnêteté.

**LE DÉFAUT ÉTAIT DANS LE BANC, ET IL EST DE LOIN LE PLUS INSTRUCTIF DE LA SÉRIE.** Après ces sept
réparations, le banc a rendu **exactement le même rapport qu'avant** : code 0, quinze non-portables,
les mêmes lignes mot pour mot. La cause : **le banc n'installait rien**. Il lançait
`scripts/<outil>.mjs` en se plaçant dans le dépôt d'accueil, en supposant qu'une copie de l'Agence
s'y trouvait déjà — elle y était, posée à la main vingt minutes plus tôt, **vieille de quatre
fichiers**. Il mesurait le passé avec l'aplomb du présent.

**Ce que ça dit pour l'export, et c'est une contrainte de plus** : *un outil qui vérifie une
installation doit l'INSTALLER lui-même, à chaque passage, et dire ce qu'il a posé.* Un banc qui
travaille sur ce qu'il trouve sur place ne mesure pas un produit, il mesure un état de disque.
Le banc réinstalle désormais `scripts/` en entier avant chaque passage, imprime le nombre de fichiers
et le commit d'origine, et refuse de mesurer si la copie échoue. (Leçon L42.)

**Le chiffre, une fois le banc réparé** : **65/73 outils tiennent debout, 89 %** — contre 79 % au
passage précédent, non-portables **15 → 8**.

**Les huit qui restent, et ils ne se ressemblent pas** :

- **Légitimement liés, à DÉCLARER plutôt qu'à corriger** : `install-ci`, `pnpm-install` — des
  installateurs, dont le rôle est précisément de connaître l'environnement d'accueil.
- **Ils supposent l'arborescence du JEU** (`lib/life.ts`, `lib/lia.ts`, `app/api/lia/route.ts`) :
  `check-argus`, `kpi-report` (nouvelle couche, la précédente est réparée), `route-booster`. Ceux-là
  demandent de DÉTECTER le produit hôte au lieu de le supposer — un vrai chantier de conception, pas
  un correctif.
- **Liés à notre environnement** : `check-gemini-quota` (`.dev.vars`), `the-screener-capture`
  (navigateur), `filet-en-parts` (il cherche un filet à découper, et le témoin n'en a pas).

**Le principe qui sort de ce troisième passage** : les corrections faciles sont épuisées. Ce qui
reste n'est plus de la négligence, c'est de la CONCEPTION — un outil de l'Agence doit pouvoir
demander à son hôte « où est ton code ? » au lieu de répondre à sa place.

