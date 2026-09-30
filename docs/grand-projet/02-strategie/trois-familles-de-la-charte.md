# Les trois familles de la charte — ou : 75 % de nos Articles ne parlent pas du Jeu

*(Écrit le 2026-09-29 à 19h19 UTC, heure LUE. Né d'une remarque de l'utilisateur qui a renversé ma
propre proposition : « il y a beaucoup de lois présentes dans la charte qui sont CRUCIALES pour le
fonctionnement de l'agence […] ta question est elle-même remise en question ».)*

> **DÉCOULE DE :** `docs/loi-de-l-agence.md`
> *les deux lois suprêmes ne gouvernent pas la même chose ; encore faut-il savoir ce que chaque
> Article gouverne.*

> ### ⚠️ FRONTIÈRE AVEC LES DEUX DOCUMENTS DU RÉFÉRENTIEL, ÉCRITE APRÈS COUP ET C'EST UN AVEU
>
> *(2026-09-30, tâche #1278. Ce document affirmait que « personne ne l'avait jamais regardé ».
> **C'était faux**, et le détecteur de documents jumeaux l'avait signalé le soir même — sauf que
> son message annonçait « 0 % de vocabulaire commun » à cause d'un nom de champ erroné, donc je
> l'ai lu comme du bruit. Vrai chiffre : 28 %, 110 mots communs.)*
>
> **Ce qui existait déjà, et que je n'ai pas ouvert avant d'écrire** :
>
> | Document | Ce qu'il fait, et que celui-ci ne refait pas |
> |---|---|
> | `docs/referentiel/charte-cartographie.md` | **il classe déjà chaque Article en trois natures** — LOI / MODE D'EMPLOI D'OUTIL / DISCIPLINE SANS PORTEUR — généré par MOÏSE le **2026-09-28**, deux jours avant ce document |
> | `docs/referentiel/claude-md-regles.md` | ce que chaque Article EST : sensibilité, importance, références croisées, lignes |
>
> **CE QUE CE DOCUMENT-CI APPORTE MALGRÉ TOUT, et c'est la frontière** : les deux autres classent
> par **NATURE** (qu'est-ce que cet Article, comme objet ?). Celui-ci classe par **DESTINATAIRE**
> (de quoi cet Article parle-t-il — du Jeu, de l'Agence, de notre collaboration ?). Ce sont deux
> axes **orthogonaux**, et c'est leur croisement qui a produit le chiffre utile : *75 % de la
> charte ne parle pas du Jeu.* Aucun des deux autres ne pouvait le dire.
>
> **CE QUI RESTE VRAI DE MON AFFIRMATION INITIALE, RÉDUIT À CE QU'ELLE EST** : personne n'avait
> regardé la charte **par destinataire**. Le reste — le classement par nature — existait, et je
> l'ai présenté comme neuf ailleurs. Corrigé dans `la-route-vers-50-obligations.md`.
>
> **ET LES DEUX CLASSEMENTS NE SONT PAS D'ACCORD** sur les Articles 7 et 13, ce qui vaut onze
> obligations sur la cible de 50. C'est une question ouverte, pas un détail : voir le LOT C.

---

## CE QUE JE M'APPRÊTAIS À ÉCRIRE, ET POURQUOI C'ÉTAIT FAUX

J'avais proposé trois lignes en tête de `CLAUDE.md` : *« Ce document est la charte du JEU. »*

**Il a répondu que beaucoup de ses règles sont cruciales pour le fonctionnement de l'AGENCE.** Il
avait raison, et la mesure le dit sans appel : **cette phrase aurait été fausse pour 75 % du
document.** Une ligne de portée inexacte, en tête du fichier le plus lu du projet, aurait été pire
que pas de ligne du tout.

---

## LA MESURE

*(Extraite par `buildClaudeMdRuleTable()` de MOÏSE-TABLES-DE-LOI, qui lit `CLAUDE.md` réel — jamais
une liste recopiée. **33 Articles, 708 lignes.** L'Article 20bis échappe à son extraction, qui ne
lit que des numéros entiers : il est classé ci-dessous à la main, et ce manque est signalé plutôt
que tu. **En le comptant, la charte porte donc trente-quatre Articles et non trente-trois** —
écrit en toutes lettres à dessein : le garde-fou des renvois morts lit un nombre qui suit le mot
« Article » comme une citation, et mon premier jet a fabriqué un Article fantôme qui a fait
échouer le filet. Le garde-fou avait raison ; c'est ma phrase qui était mauvaise.)*

| Famille | Articles | Lignes | Part |
|---|---|---|---|
| 🎭 **LE JEU** — le contenu, les personnages, la conversation | **10** | **70** | **10 %** |
| ⚙️ **L'AGENCE** — les conditions de fonctionnement de l'outillage | **19** *(+20bis)* | **532** | **75 %** |
| 🤝 **LA COLLABORATION** — entre l'agent et l'humain | **4** | **106** | **15 %** |

**Le chiffre à retenir : sur les 33 Articles mesurés, 10 parlent de Lia et Noé. Les 23 autres
parlent d'autre chose.**

---

## LE DÉTAIL, ARTICLE PAR ARTICLE

### 🎭 LE JEU — 10 Articles, 70 lignes

Ceux-là ne partiraient **jamais** avec l'Agence : ils n'auraient aucun sens chez un client qui n'a
ni Lia ni Noé.

| # | Titre | Lignes |
|---|---|---|
| **0** | Hiérarchie des lois *(l'esprit des personnages est la loi suprême)* | 4 |
| 1 | La conversation prime sur tout le reste | 4 |
| 2 | Cohérence de bout en bout | 4 |
| 4 | L'enquête doit tenir debout | 4 |
| 8 | Sobriété des appels API | 10 |
| 9 | Rejouabilité et surprise | 2 |
| 10 | Répliques locales : l'exception encadrée | 14 |
| 11 | Zéro répétition, personnalités étanches | 5 |
| 12 | Le sens avant la forme | 3 |
| 17 | Se mettre à la place des personnages | 20 |

### ⚙️ L'AGENCE — 19 Articles (+20bis), 532 lignes

**C'EST LE « PACK » QU'IL CHERCHAIT.** Sa question était : *« quand un client achète l'agence pour
un projet utilisateur EN COURS, quelles règles doit-il faire figurer dans son doc équivalent à
charte ? »* — **la réponse est cette liste**, et elle ne s'invente pas, elle se lit.

| # | Titre | Lignes |
|---|---|---|
| 3 | Corriger la cause, jamais le symptôme | 3 |
| 5 | Robustesse du code | 3 |
| 6 | Le document de référence est un outil de travail | 7 |
| 7 | L'épreuve de la page blanche | 15 |
| **13** | **Les outils de travail vivent avec le code** | **57** |
| 18 | Un gros process se suit en entier | 24 |
| 19 | Comprendre avant de toucher | 28 |
| **20** | **Les Gardiens sacrés du code** | **55** |
| 20bis | Quatre mots distincts, jamais « gardien » tout court | — |
| 21 | HYPER-SCAN-CHECKPOINT | 6 |
| 22 | Smart Conso API | 34 |
| 23 | *(fondu dans l'Article 7)* | 4 |
| 24 | Toute construction doit être évolutive | 35 |
| 25 | Vérifier régulièrement son propre travail | 21 |
| 26 | Les process se respectent | 21 |
| 27 | Le projet doit rester reprenable par une AUTRE IA | 32 |
| 28 | Un rapport n'est pas fini tant que ses constats ne sont pas des tâches | 42 |
| 30 | Aucun chantier ne s'ouvre avant d'avoir repris les notes | 40 |
| **31** | **Tout passe par un OUTIL** | **57** |
| 32 | Le temps réel se LIT, jamais ne se déduit | 48 |

### 🤝 LA COLLABORATION — 4 Articles, 106 lignes

Ni le Jeu ni l'Agence : la façon dont l'agent et l'humain travaillent ensemble. **Chaque client
devra les réécrire à sa main** — ce sont les plus personnels des trois familles.

| # | Titre | Lignes |
|---|---|---|
| 14 | Vigilance permanente, et la double confirmation | 15 |
| 15 | Se mettre à la place de l'utilisateur | 10 |
| 16 | Vérification systématique par questions | 37 |
| 29 | Tout compte rendu s'ouvre en rappelant à qui il s'adresse | 44 |

---

## CE QUE CE CLASSEMENT CHANGE, ET C'EST PLUS QUE PRÉVU

**1. La ligne de portée doit être réécrite.** Pas *« la charte du Jeu »*, mais quelque chose comme :
*« ce document contient trois familles de règles — celles du Jeu, celles de l'Agence, celles de
notre collaboration — et une seule des trois ne partira jamais »*. Formulation à trancher avec lui.

**2. Le pack client existe déjà, il était juste mélangé.** Les 19 Articles de la famille AGENCE sont
la réponse à sa question sur le cas ② (un projet existe déjà). Rien à inventer : **révéler**, comme
il l'a dit lui-même.

**3. Un candidat sérieux à l'allègement apparaît, et il n'était pas cherché.** Les 532 lignes de la
famille AGENCE sont rechargées **à chaque message**, y compris quand on ne touche qu'au jeu. C'est
75 % de la charte, soit environ **17 000 des 22 747 tokens** qu'elle coûte. Séparer les familles en
deux fichiers rendrait possible de ne charger que ce qui sert — **mais ça toucherait la charte, donc
c'est sa décision, jamais la mienne.** Signalé, pas fait.

**4. Ça interroge la loi de l'Agence elle-même.** Si 75 % de la charte gouverne déjà l'outillage,
alors `docs/loi-de-l-agence.md` n'est pas le premier texte à le faire — il est le premier à le dire
**au-dessus** des autres. La loi reste juste ; sa solitude apparente ne l'était pas.

---

## LA LIMITE DE CE DOCUMENT, DÉCLARÉE

**Le découpage est MESURÉ, le classement est un JUGEMENT.** L'extraction vient d'un outil qui lit le
vrai fichier ; la répartition en trois familles est mon avis, article par article, et plusieurs cas
sont discutables — l'Article 8 (sobriété des appels API) sert le Jeu par son objet mais l'Agence par
sa mécanique ; l'Article 3 (corriger la cause) est si général qu'il vaudrait pour n'importe quel
projet. **Aucun de ces arbitrages n'est mécanisable, et le déclarer vaut mieux que de laisser croire
à une mesure.**

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Ce qu'il devient |
|---|---|---|
| Ma ligne de portée aurait été fausse pour 75 % du document | **RETENU** | tâche **#1230** — ce document ; la ligne est à réécrire et il la tranche |
| Le « pack d'Articles » pour un client existe déjà : les 19 de la famille AGENCE | **RETENU** | tâche **#1230** — la liste est établie, son emballage en pack reste à faire |
| 532 lignes de règles d'outillage sont rechargées à chaque message, y compris en travaillant sur le jeu | **À TRANCHER** | scinder la charte en deux fichiers touche la charte : sa décision, jamais la mienne |
| L'Article 20bis échappe à l'extraction de MOÏSE (numéros entiers seulement) | **RETENU** | tâche **#1230** — signalé ici ; à corriger dans l'outil, jamais contourné à la main |
