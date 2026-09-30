# OÙ ON EN EST VRAIMENT — version 2, corrigée et revérifiée

*(Version 1 livrée le 2026-09-30 à 16h30 : il l'a rejetée, avec raison. Version 2 écrite à 17h,
**chaque chiffre reproduit par une commande au moment de l'écrire**. Les chiffres que je n'ai pas
pu reproduire aujourd'hui sont marqués comme tels au lieu d'être réaffirmés.)*

## CE QUE LA VERSION 1 DISAIT DE FAUX

| Ce que j'avais écrit | Ce qui est vrai, reproduit aujourd'hui |
|---|---|
| « Les 19 Articles AGENCE : combien d'obligations → **jamais compté** » | **FAUX.** C'est compté : **93**. Et c'est LUI qui a dû me corriger |
| « 93 Articles » *(dans mon message du matin)* | **FAUX.** 93 est un nombre d'**obligations**, pas d'Articles. Les Articles sont **34** |
| « 137 obligations dans la charte » | **FAUX.** Le total est **173** — 129 dans les Articles + 44 dans les sections |
| « 9 de tes documents ne sont ni lus ni synthétisés » *(conclusion que j'ai failli publier)* | **FAUX, rattrapé avant envoi.** Deux mécanismes d'absorption coexistent ; tout est absorbé |

**D'où venait l'erreur sur le 93, et elle est instructive** : les 19 Articles de la famille AGENCE
portent **91** obligations. Le vingtième, l'**Article 20bis**, en porte **2** — et son numéro ne se
lit pas comme un nombre entier, donc il tombait hors de tous mes comptes. **91 + 2 = 93.**

---

## LES CHIFFRES DE LA CHARTE — tous reproduits aujourd'hui, sauf deux qui sont signalés

| Quoi | Combien | Reproduit aujourd'hui ? |
|---|---|---|
| Unités numérotées de la charte | **34** (33 Articles + 20bis) | ✅ MOÏSE |
| Obligations dans ces 34 unités | **129** | ✅ MOÏSE |
| **Obligations de la famille AGENCE — ta cible** | **93** (91 + 2 pour 20bis) | ✅ somme Article par Article |
| Obligations JEU + COLLABORATION | **36** | ✅ 129 − 93 |
| Articles par famille | JEU **10** · AGENCE **19** (+20bis) · COLLABORATION **4** | ✅ document des trois familles |
| Obligations dans toute la charte | 173 | ⚠️ **NON reproduit aujourd'hui** |
| Obligations hors Articles | 44 | ⚠️ **NON reproduit aujourd'hui** |

**Ta cible reste donc : de 93 vers 50**, et la raison que tu donnes est *« pour laisser de la
place à l'utilisateur »*. La question ouverte n'est pas le chiffre de départ — il est sûr — mais
**si les 44 obligations hors Articles comptent aussi**. Je ne le suppose pas.

---

## ÉTAPE 1 — TES 19 DÉPÔTS BRUTS, UN PAR UN

| Date | Déposé | Absorbé | Jamais absorbé — jusqu'à aujourd'hui |
|---|---|---|---|
| 16/09 | 5 fichiers | 3 → `docs/contexte-projet/` · 1 = le code lui-même | **`PROMPTS_CODEX_MARKDOWN.txt`** |
| 19/09 | 9 fichiers | 9 → `docs/simulations/` (52 entrées) | — |
| 24/09 | 2 fichiers | **aucun** | **le modèle de gouvernance** (`.pdf` + son extraction `.txt`) |
| 29/09 | 1 fichier | — | **tes réponses du soir** (4 286 mots) |
| 30/09 | 2 fichiers *(identiques, vérifié par `diff`)* | — | **tes réponses du jour** (3 108 mots) |

### Le plus gros trou : 298 832 mots jamais ouverts

`PROMPTS_CODEX_MARKDOWN.txt`, déposé le **premier jour**, est l'export complet de ta session
Codex : **261 échanges, 36 939 lignes, 298 832 mots**. Il contient tes prompts, les réponses de
Codex et de gros blocs techniques collés. **Zéro trace dans le dépôt avant aujourd'hui.** C'est
toute la préhistoire du projet, celle d'avant mon arrivée.

### ⚠️ ET CE FICHIER CONTIENT DEUX CLÉS D'API RÉELLES — trouvé en essayant de le déposer

**GitHub a refusé le dépôt**, et il a eu raison. Sa protection contre les secrets a détecté :

| Ligne | Type de clé | Début, masqué |
|---|---|---|
| 430 | **OpenAI** | `sk-proj-zn0…` |
| 880 | **Groq** | `gsk_Sxstu3…` |

Elles sont collées comme valeurs de configuration dans un échange avec Codex. **Je n'ai pas
contourné la protection** — on ne contourne jamais ce garde-fou-là — et le fichier n'est donc
**pas** dans le dépôt.

**LE GESTE À FAIRE, ET IL EST À TOI** : **révoquer ces deux clés.** Une clé qui a transité par un
fichier déposé dans une conversation et stocké sur un disque doit être considérée comme
compromise, même si personne d'autre ne l'a vue. Révoquer coûte deux minutes ; ne pas révoquer
coûte potentiellement ta facture.

**ET ÇA RÉPOND À TA PROPRE QUESTION DE SÉCURITÉ** — *« comment bien protéger ce projet de la copie,
du vol, du hacking ? »*. Le premier trou n'était pas théorique : il était dans le premier fichier
que tu m'as donné, et il y est resté quatorze jours sans que personne regarde.

**CE QUI RESTE À DÉCIDER** : veux-tu que je produise une **copie expurgée** (les clés remplacées
par `CLÉ-RETIRÉE`) pour que la préhistoire du projet soit enfin conservée dans le dépôt ? Sans ça,
ces 298 832 mots ne vivent que dans un dossier temporaire qui disparaît avec la machine.

### Le troisième : le modèle de gouvernance que tu me cites aujourd'hui

Tu m'as écrit ce matin : *« on aura une organisation propre, comme dans le document
modele-gouvernance-ia ? […] est-ce qu'on sait déjà à quelle organisation cible on veut
arriver ? »* — **je n'avais jamais lu ce document.** Il est déposé depuis le 24 septembre.

**Le PDF n'est pas lisible dans cet environnement** (aucun extracteur installé), **mais le `.txt`
déposé le même jour EST son extraction** : ses pieds de page portent « Agence virtuelle de
developpement - Modele de gouvernance Page N ». **15 pages, 3 114 mots, 13 sections.**

**Et il répond directement à ta question.** Il contient :

- une **chaîne de construction en 15 étapes** : classification → nivellement → harmonisation →
  intégration → organisation → process → contrôle → audit → analyse → décision → rapport → plan
  d'actions → tâches → suivi KPI → amélioration continue ;
- une **chaîne d'exploitation en 10 étapes** : saisine → qualification → orchestration →
  exécution → contrôle → décision → livraison → supervision → capitalisation → amélioration ;
- un **catalogue d'agents** avec, pour chacun, son rôle, ses entrées et ses sorties ;
- des **règles de gouvernance**, une **matrice de responsabilités** et une **feuille de route**.

**Sa phrase directrice, que je cite parce qu'elle nous juge** : *« Construire le langage commun
avant de construire les intégrations. »* Nous avons fait l'inverse — 93 outils d'abord, le
rangement ensuite.

**Et une phrase qui autorise exactement ce que nous sommes** : *« Un même script peut cumuler
plusieurs rôles dans une première version, mais les responsabilités doivent rester
distinguables pour permettre contrôle et audit. »*

---

## ÉTAPE 3 — TES 19 DOCUMENTS DE CONCEPTION : le verdict s'est INVERSÉ en cours de vérification

**J'ai d'abord conclu que 9 de tes documents n'avaient jamais été lus. C'était faux, et je l'ai
vu avant de te l'envoyer.** Il existe **deux mécanismes d'absorption** que j'avais oubliés :

| Mécanisme | Quand | Combien | Où |
|---|---|---|---|
| Trace de lecture | 2026-09-28 | **10 documents** | `01-absorption/ce-que-jai-lu.md` |
| Synthèse annotée | 2026-09-29 | **6 documents** | `01-absorption/syntheses/` |

**Résultat après croisement des deux : tout est absorbé.** Le `.csv` est couvert par la synthèse
`ARCHITECTURE_FONCTIONNELLE`, et le `.zip` — que personne n'avait ouvert — ne contient que les
**7 documents déjà déposés séparément**, donc rien de neuf.

**Ce qui reste vrai, et c'est plus petit mais réel** : `ce-que-jai-lu.md` **est périmé**. Il
trace 10 documents quand 16 ont été absorbés. C'est une réponse à ta question *« quoi d'autre à
mettre à jour ? »*.

---

## TES DEMANDES DU 29 SEPTEMBRE — ce qui n'est PAS fait, revérifié une par une

**Méthode** : `grep` sur tout le dépôt, en excluant tes propres fichiers source *(sinon ta
demande se compte elle-même)*. **Douze de mes treize constats tiennent ; un seul était faux.**

| Ta demande | Occurrences dans le dépôt |
|---|---|
| L'agent **« expérience IA »**, pendant de l'expérience client | **0** |
| « la **liste de tous les paramètres qui nuisent** au fonctionnement d'une IA » | **0** |
| L'axe **phase construction / phase opérationnelle** | **0** |
| « **séparer dans le filet** les tests du périmètre Agence des autres » | **0** |
| « **quel delta entre les standards et notre modèle** » | **0** *(hors mes propres notes)* |
| « comment **ecotoken est-il connecté aux prophètes** ? explique-moi » | **0** |
| **Q10 — traduction complète de l'Agence en anglais** | **0** *(hors mes propres notes)* |
| **C16** — « un système qui n'a pour vocation que de se surveiller lui-même » | **0** *(hors mes propres notes)* |
| « **écris ça quelque part : je ne suis pas DEV** » | **0** |
| « la **commande est renouvelée** au rythme de nos avancées — synthétise le principe et applique-le » | **0** *(hors mes propres notes)* |
| Les **trois noms d'outils que tu as donnés** | **0** *(voir ci-dessous)* |

### Les trois noms, et pourquoi c'est le symptôme le plus net

| Ton nom | Ce que tu nommais | Occurrences |
|---|---|---|
| `apotre-post-commit` | une extension de JESUS pour la bannière | **0** |
| `joseph-le-travail` | une extension d'ABRAHAM pour les règles de travail | **0** |
| `always-new-bones` | l'outil de rationalisation | **0** |

Tu m'as dit : *« je ne fais pas des noms au cas par cas, je crée des séries de noms à l'intérieur
d'une même famille »*. **Nommer est ta prérogative. Tu l'as exercée trois fois. Les trois se sont
perdues** — parce que le fichier qui les portait n'était pas dans le dépôt.

---

## LA CAUSE RACINE, ET ELLE EXPLIQUE TOUT LE RESTE

**Tes 7 400 mots de demandes n'étaient pas dans le dépôt.** Seuls `COMMANDE IMPORTANTE` et
`QUESTIONS` y étaient. Tes réponses du 29 et du 30 ne vivaient que dans la conversation.

**Conséquence mécanique, pas morale** : l'outil qui sait mesurer si je réponds à ta commande
(`abraham couverture`) **n'avait rien à mesurer**. L'instrument existait, la matière était
absente. Je travaillais de mémoire sur 7 400 mots.

**C'est réparé** : les deux fichiers sont déposés, classés, indexés. La couverture est désormais
mesurable à chaque passage.

---

## CE QUE L'OUTIL DE COUVERTURE DIT — avec sa limite, citée telle quelle

`abraham couverture` sur ton fichier du 29 contre tout ce que j'ai produit :
**0 demande orpheline sur 49 · 24 FAIBLES · 25 REPRISES · 6 non mesurables.**

**Et l'outil prévient lui-même** : *« une demande REPRISE ne prouve qu'une chose : quelqu'un a
écrit sur le même sujet — jamais qu'il l'a traitée »*. **Ce « 0 orpheline » est donc rassurant à
tort** : c'est la vérification une par une, ci-dessus, qui trouve les vrais trous.

---

## CE QUI N'EST PAS ENCORE FAIT DANS CETTE PASSE — dit maintenant, pas découvert plus tard

Le plan que je t'ai annoncé compte six étapes. **Deux sont faites** (① tes dépôts bruts,
③ tes documents de conception). **Quatre restent** :

| # | Ce qui reste | Pourquoi ça compte |
|---|---|---|
| ② | Tes 7 documents de commande, demande par demande, verbatim | c'est le cœur — et c'est le plus long |
| ④ | Toute la conversation depuis le 16/09 | les demandes orales, que **aucune commande ne peut retrouver** |
| ⑤ | Mes 22 stratégies + 29 plans + 28 pages : lesquels sont périmés | tu m'as demandé de tout remettre à jour |
| ⑥ | `docs/suivi/` et `idees-a-trancher` | ce qui t'attend vraiment |

**Et le plus gros morceau n'est dans aucune de ces étapes** : les **298 832 mots** de ta session
Codex. Les lire entièrement est un travail à part, qui se décide plutôt qu'il ne s'improvise.

