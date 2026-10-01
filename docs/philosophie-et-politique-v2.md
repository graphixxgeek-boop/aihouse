# Philosophie et politique — édition RÉVÉLÉE

*(Écrit le 2026-10-01 à 22h01 UTC. Tâche #1419. Remplace à terme `docs/philosophie-et-politique.md`,
qui reste en place tant que cette édition n'est pas validée.)*

---

## LES QUATRE AXES, ET CE QUE CHACUN A APPORTÉ

Ses mots, le 2026-10-01 : *« 4 axes pour rediger : 1/ la revelation 2/ le format standart voir docs
git 3/ mes precisions 4/ en parfaite harmonie avec les objectifs ultimes »*.

| Axe | Ce qu'il apporte ici |
|---|---|
| **1 · La révélation** | Chaque principe est **extrait du corpus réel**, jamais inventé. **5 843 convictions lues dans 334 fichiers** par THE-KING (`node scripts/the-king.mjs reveler`, passage du 2026-10-01 à 22h12). Sur sa précision du jour, le corpus couvre **tout l'ensemble** : la charte, les règles de travail, les process, les leçons payées, le référentiel, le POURQUOI écrit à côté de chaque outil — **et les données dérivées**, c'est-à-dire les décisions réellement prises dans le suivi et les stratégies de domaine. Chaque principe porte son **étendue** : combien de zones du dépôt le redisent. |
| **2 · Le format standard** | La cascade de son document source — `VISION → PHILOSOPHIE → POLITIQUES → PROCESSUS → PROCÉDURES → ACTIONS` — et ses **19 familles** de questions (5 pour la philosophie, 9 pour la politique, les 5 impossibles). |
| **3 · Ses précisions** | **Trois niveaux à chaque étage** : GÉNÉRAL (le projet entier) · JEU · AGENCE. Seule la partie AGENCE s'exporte et fusionne avec la philosophie d'un autre projet. La politique de chaque niveau répond de la philosophie du même niveau. |
| **4 · L'harmonie avec les objectifs ultimes** | Ses **trois objectifs validés le 2026-09-30 à 23h31** ne sont pas à côté de ce document : **ils EN SONT l'étage VISION**, un par niveau. Rien à inventer, rien à réconcilier. |

**ET LES QUATRE NE SONT PAS QUATRE SOURCES ÉGALES : ce sont DEUX TEMPS.** L'axe 1 fournit la
**matière brute**, avec ses défauts. Les axes 2, 3 et 4 donnent la **direction de correction**. La
section « Le mouvement de ce document » plus bas mesure l'une et liste l'autre, pour que l'écart
entre le minerai et le principe reste visible au lieu d'être lissé.

**L'AXE 4 RÉSOUT L'AXE 2 SANS QU'ON AIT RIEN À DÉCIDER, et c'est la trouvaille d'architecture de ce
document.** Son cadre réclame un étage VISION que nous n'avions pas. Ses trois objectifs ultimes
sont exactement trois visions, une par niveau. **Le découpage qu'il demande au niveau de la
philosophie existait déjà un étage au-dessus** — il ne descendait simplement pas.

---

## L'ARCHITECTURE — trois niveaux, six étages

```
                    ┌──────────── GÉNÉRAL ────────────┬──── JEU ────┬──── AGENCE ────┐
  VISION            │  « l'outil et l'œuvre se        │ « un visi-  │ « un codeur    │
  (déjà validée)    │    prouvent l'un l'autre,       │  teur doute │  sait ce qui   │
                    │    et chacun tient debout       │  qu'il n'y  │  tient et ce   │
                    │    sans l'autre »               │  ait perso- │  qui ne tient  │
                    │                                 │  nne »      │  pas »         │
  PHILOSOPHIE       │  G1 … G10                       │  J1 … J6    │  A1 … A13      │
  POLITIQUE         │  PG1 … PG11                     │  PJ1 … PJ6  │  PA1 … PA9     │
  PROCESSUS         │  les process déclarés (god-of-all-process)                     │
  PROCÉDURES        │  les étapes de chaque process, dans son document               │
  ACTIONS           │  les tâches de docs/suivi/                                     │
                    └─────────────────────────────────┴─────────────┴────────────────┘
                                                                      ▲
                                                        SEULE COLONNE EXPORTABLE
```

**CE QUI PART, ET CE QUI RESTE.** Vers un autre projet, on emporte la colonne AGENCE — philosophie
et politique — et rien d'autre. La colonne GÉNÉRALE ne part pas : sa vision parle de *l'attelage*
entre un outil et une œuvre, ce qui n'a de sens qu'ici. La colonne JEU ne part évidemment pas.
**Conséquence de conception, appliquée dans tout ce document : chaque principe de la colonne AGENCE
est écrit pour se suffire à lui-même** — il ne renvoie jamais à un principe général pour être
compris, sans quoi il arriverait amputé chez celui qui le reçoit.

---

## CE QUE LA MESURE A TROUVÉ — les chiffres, avant les mots

| Mesure | Valeur | Ce qu'elle dit |
|---|---|---|
| Fichiers lus | **334** | 7 zones : la charte · les règles de travail et le process d'expérience · les leçons payées · le référentiel · les process et architectures · **les décisions réellement prises** · **les stratégies** · le POURQUOI écrit à côté de chaque outil |
| Convictions extraites | **5 843** | toute phrase normative portant « jamais » ou « toujours » |
| Principes dans la boussole actuelle | **23** | ce qui était déjà écrit |
| Familles du cadre portées par le corpus | **18 / 19** | le travail répond déjà à dix-huit des dix-neuf questions |
| Familles VIDES | **1** | *ce que nous ne sacrifierons jamais* — une seule, et c'est un impossible |
| Étendue maximale observée | **7 zones / 14 fichiers** | une seule conviction atteint ce niveau, et elle n'est dans aucun principe |

**LA CONVICTION LA PLUS PROFONDE DU PROJET N'EST ÉCRITE DANS AUCUN PRINCIPE.** Le résultat le plus
étendu de toute la mesure — **7 zones sur 7, 14 fichiers** — est celui-ci : *« une archive est à
consulter en cas de doute, jamais une source de vérité sur le comportement actuel »*. Quatorze
fichiers le redisent, dans **tous** les contextes d'écriture du dépôt sans exception, et la
boussole ne le mentionne nulle part. C'est exactement ce qu'il appelait la **philosophie
inavouée** : ce que le projet croit si fort qu'il n'a jamais pensé à le dire.

**ET LE CORPUS ÉLARGI A CORRIGÉ MA PROPRE TROUVAILLE — c'est à noter, parce que l'erreur était du
bon côté.** Sur le corpus restreint aux documents normatifs, TROIS cases des cinq impossibles
ressortaient vides. En y ajoutant les process et les décisions réellement prises, deux se sont
remplies : *ce que nous refusons absolument* et *ce que nous n'autoriserons jamais* vivaient dans
ce que nous avons TRANCHÉ, jamais dans ce que nous avons DÉCLARÉ. **Une philosophie se lit mieux
dans les décisions que dans les règles**, et c'est sa précision du jour qui l'a prouvé, pas mon
intuition.

**ET J'AI DÛ M'Y REPRENDRE À TROIS FOIS, ce qui est en soi un résultat.** La première mécanique
déclarait 2 762 convictions « inavouées » sur 2 786 — un détecteur qui accuse tout le monde
n'accuse personne. La deuxième remontait des noms d'outils. **La bonne maille n'était ni le fichier
ni le mot : c'est la ZONE.** Une idée qui traverse la charte, une leçon payée et le raisonnement
écrit à côté d'un outil a franchi trois contextes d'écriture indépendants, à des semaines
d'intervalle. Ce n'est plus une tournure, c'est une croyance.

---

## LE MOUVEMENT DE CE DOCUMENT — minerai, puis correction

*Ses mots, qui fixent la démarche : « la revelation te donne la matiere BRUT de la philosophie,
avec ses incoherences, ses defauts, ENSUITE les docs git, les objectifs, et mes precisions
permettent de mesurer la direction, les CORRECTIONS voulus pour une PHILOSOPHIE COHERENTE selon le
format des docs git ».*

**LA RÉVÉLATION N'EST PAS LA PHILOSOPHIE. C'EST LE MINERAI.** Ce que 334 fichiers disent sous forme
de convictions est brut : mal réparti, souvent muet sur son propre périmètre, et mêlé de technique.
Les parties I à III qui suivent ne sont pas ce brut — ce sont les principes **après correction**,
et cette section dit exactement ce qui a été corrigé, et pourquoi.

### Les quatre défauts de la matière brute, mesurés

| Défaut | Mesure | Ce que ça veut dire |
|---|---|---|
| **Le brut ne dit pas de quel monde il parle** | **53,6 %** des 5 843 convictions ne portent aucun marqueur de niveau | plus d'une conviction sur deux est écrite sans qu'on sache si elle gouverne le Jeu, l'Agence, ou les deux |
| **Le brut est massivement tourné vers l'outillage** | **37,7 % Agence** contre **5,8 % Jeu** — un rapport de 6,5 pour 1 | ce n'est pas que le Jeu compte six fois moins : c'est qu'on écrit six fois plus **à propos de** l'outillage. La charte porte déjà le chiffre voisin (86,6 % des tâches hors Jeu) |
| **Le brut est mêlé de technique** | **30 %** des convictions retenues citent un nom de fonction, de fichier ou une extension | une philosophie ne cite jamais une fonction par son nom. C'est de la gangue, pas du minerai |
| **Le brut est presque entièrement hors boussole** | **86 convictions retenues sur 87** n'existent dans aucun principe écrit | la quasi-totalité de ce que le projet croit n'a jamais été formulée comme une croyance |

### Et UN défaut qu'on s'attendait à trouver, qui n'y est pas

**Zéro contradiction détectée** entre les convictions retenues — 2 775 paires comparées, la plus
proche à 0,94 de vocabulaire partagé sans aucun choc de polarité. **La matière brute est
désordonnée, elle n'est pas incohérente**, et c'est une bonne nouvelle qu'il faut dire aussi
franchement que les quatre défauts.

*(Limite honnête, et elle est écrite dans l'outil : la sonde compare un vocabulaire partagé et une
polarité opposée. **Deux convictions qui se contrediraient avec des mots entièrement différents lui
sont invisibles.** Un zéro ici veut dire « rien de détectable par cette méthode », jamais « rien ».)*

### Les cinq corrections appliquées, et d'où vient chacune

| # | Correction | Sa direction |
|---|---|---|
| **C1** | **Chaque principe reçoit un niveau** — y compris ceux que le brut laissait muets. Le classement se fait par jugement, en demandant de quelle vision le principe découle. | *ses précisions* + *les objectifs ultimes* |
| **C2** | **Le déséquilibre 6,5 pour 1 n'est pas reconduit.** 10 principes généraux, 6 pour le Jeu, 13 pour l'Agence. Le Jeu reste le moins fourni, et c'est assumé : sa philosophie tient en peu de phrases très fortes, pas en volume. | *les objectifs ultimes* — trois niveaux de rang égal |
| **C3** | **La gangue technique est remontée d'un cran.** Une conviction qui citait une fonction est réécrite au niveau du principe qu'elle applique, ou écartée si elle n'en portait aucun. | *le format des docs git* |
| **C4** | **Tout entre dans les 19 familles et les 6 étages** de son document source, y compris les cases que nous n'aurions pas pensé à ouvrir nous-mêmes. | *le format des docs git* |
| **C5** | **Chaque niveau reçoit sa vision**, prise telle quelle dans les trois objectifs validés le 2026-09-30 — aucune reformulation. | *l'harmonie avec les objectifs* |

**CE QUE LES CORRECTIONS NE FONT JAMAIS** : ajouter un principe que le corpus ne porte pas. Chaque
énoncé des parties I à III est **révélé** ; les corrections le classent, le nettoient et le mettent
en forme. La seule chose que ce document contient sans l'avoir trouvée est la case qu'il déclare
vide — et il la déclare justement plutôt que de la remplir.

---

# PARTIE I — PHILOSOPHIE

*« En quoi croyons-nous ? »* — jamais *« que faisons-nous ? »*.

## I.A — PHILOSOPHIE GÉNÉRALE *(niveau PROJET — ne s'exporte pas)*

> **VISION** — *Faire que l'outil et l'œuvre se prouvent l'un l'autre, et que chacun tienne debout
> sans l'autre.*

### G1 — Une mesure qui ne peut pas échouer ne mesure rien
*(révélé : 3 zones, 4 fichiers — « le succès ne se mesure jamais à "a-t-il tourné sans erreur" mais
au nombre de passages ayant réellement trouvé un écart »)*

Un contrôle dont le verdict est toujours vert n'est pas un contrôle rassurant : c'est un contrôle
muet. On juge un dispositif à ce qu'il a trouvé, jamais à ce qu'il a exécuté sans planter.

### G2 — Une absence de mesure n'est jamais un satisfecit
*(révélé : présent dans la boussole en 1.9, confirmé par la mesure)*

« Rien trouvé » et « rien cherché » ne se disent jamais de la même façon. Quand la mesure n'a pas
pu se faire, on écrit qu'elle n'a pas pu se faire — jamais un vert par défaut.

### G3 — Le passé se garde entièrement, et ne fait jamais autorité
*(révélé : **5 zones, 11 fichiers** — la conviction la plus étendue du corpus, absente de la boussole)*

Rien ne s'efface : une archive est conservée verbatim, jamais résumée. Et rien de ce qui est archivé
ne dit ce qui est vrai aujourd'hui. **Les deux moitiés sont indissociables** : c'est parce qu'on ne
jette rien qu'on peut refuser catégoriquement qu'une vieille page fasse loi.

### G4 — Une intention n'a jamais empêché quoi que ce soit
*(révélé : 2 zones, 4 fichiers — leçons L2 et L7, citées par les outils eux-mêmes)*

Une règle écrite sans porteur n'existera plus à la session suivante. Un commentaire qui promet une
synchronisation future n'est pas une protection : c'est une intention.

### G5 — Une protection consultée après coup n'en est pas une
*(révélé : 4 zones, 5 fichiers — « jamais après coup », motif récurrent)*

Un garde-fou se consulte **avant** l'action qu'il protège. Consulté après, il ne protège plus rien :
il commente.

### G6 — Le jugement ne s'automatise jamais ; la mécanique prépare, l'humain tranche
*(révélé : 4 zones, 5 fichiers — « les index de jugement restent la plume de l'agent, jamais générés »)*

Tout ce qui MESURE peut être automatique. Tout ce qui JUGE — une qualité, une priorité, une leçon
réellement apprise — reste écrit à la main. C'est la frontière que le projet applique déjà partout
sans l'avoir formulée une seule fois.

### G7 — Une heuristique rend un palier de confiance, jamais une certitude
*(révélé : 4 zones, 4 fichiers — « toujours un palier de confiance, jamais une certitude absolue »)*

Un outil qui devine dit qu'il devine. Trois paliers, toujours nommés : confirmé · probable · à
surveiller.

### G8 — Une décision prise ne se recontourne jamais sous une autre forme
*(révélé : 4 zones, 5 fichiers — « n'est jamais recontournée sous une autre forme sans une nouvelle
demande explicite »)*

Quand une décision a été prise — par lui, ou par un refus légitime — on ne la rejoue pas déguisée.
On la rouvre franchement, ou on s'y tient.

### G9 — On peut tout reconstruire, jamais perdre un comportement observable
*(révélé : 3 zones, 3 fichiers — l'épreuve de la page blanche)*

La structure est toujours rediscutable. Ce qui s'affiche, ce qui se vit, ce qui se constate de
l'extérieur ne l'est pas.

### G10 — Ce qui n'est vrai que dans une tête est déjà perdu
*(révélé : Article 27, repris dans 6 fichiers)*

Le projet est écrit pour être repris par quelqu'un d'autre à tout moment. Le POURQUOI vit donc à
côté du QUOI, et quand aucune mécanique ne peut porter une règle, **le déclarer par écrit EST la
protection** — jamais une excuse pour ne pas la porter.

---

## I.B — PHILOSOPHIE DU JEU *(ne s'exporte pas)*

> **VISION** — *Faire qu'un visiteur doute, une vraie fois, qu'il n'y ait personne derrière.*

### J1 — L'aspérité est la valeur ; l'agrément est le danger
L'esprit rugueux, sarcastique, cynique des deux personnages est la valeur centrale. Un ton
consensuel, servile ou doucereux est une perte, jamais une amélioration.

### J2 — Une formulation polie et distante est un signal d'alerte, jamais un indice de qualité
*(précision du 2026-09-16, et c'est le renversement le plus contre-intuitif du projet)*

Partout ailleurs, « mesuré, soigné, neutre » veut dire « bien fait ». Ici, ça veut dire « en train
de déraper ».

### J3 — Une correction qui rend le dialogue plus propre mais plus fade est un échec
Le naturel l'emporte sur la propreté. Toujours.

### J4 — La variété se produit par un principe, jamais par une liste de mots
Une liste de termes interdits grandit sans fin et ne couvre jamais le cas suivant. On cherche une
règle que le modèle peut s'appliquer à lui-même.

### J5 — Rien ne se passe en silence
*(révélé : 3 zones, 4 fichiers — « jamais un retour silencieux à la normale », « le tour de
transition n'est jamais silencieux »)*

Un état qui expire, une transition vers le sommeil, un changement de régime : chacun est perçu et
commenté au tour suivant. **Le projet applique ça depuis des mois sans l'avoir érigé en principe** —
c'est une philosophie inavouée du Jeu, et elle explique une bonne partie de sa crédibilité.

### J6 — Une validation de qualité est intégrale, jamais un échantillonnage
*(révélé : 2 zones, 4 fichiers — à propos de tout changement de modèle)*

On ne change rien à ce qui produit la parole des personnages sur la foi de quelques exemples lus en
diagonale.

---

## I.C — PHILOSOPHIE DE L'AGENCE *(⚑ COLONNE EXPORTABLE — chaque principe se suffit à lui-même)*

> **VISION** — *Faire qu'un codeur qui travaille avec une IA sache, à tout moment, ce qui tient et
> ce qui ne tient pas.*

### A1 — Un outil qui ne fonctionne que sur son dépôt d'origine a raté la moitié de sa mission
Tout outil se conçoit pour partir ailleurs : une architecture réutilisable d'un côté, son
instanciation locale de l'autre, jamais les deux mélangés.

### A2 — Un registre se LIT, il ne se recopie pas
Toute construction qui reflète l'état d'un autre système le lit à l'exécution, ou reçoit un
garde-fou qui détecte l'écart. Une copie tenue à la main se périme en silence — et le silence est
le problème, pas la copie.

### A3 — Un seuil se dérive de ce qu'il observe
Un seuil choisi à la main finit par passer au-dessus de toute la distribution qu'il surveille, et
annonce alors « rien à signaler » parce qu'il ne voit plus rien. Un seuil dérivé d'un centile reste
par construction dans le nuage.

### A4 — Un garde-fou qui accuse tout le monde n'accuse personne
Un détecteur qui remonte 99 % de son corpus sera désactivé de fait, puis ignoré, puis oublié. Le
jour où il avait raison, plus personne ne le lisait.

### A5 — Le POURQUOI vit à côté du QUOI
Un mécanisme qui semble redondant ou trop prudent se fait supprimer par le prochain intervenant
s'il ne porte pas la raison qui l'a fait naître. On écrit la raison là où vit le code.

### A6 — Un rapport n'est pas fini quand il est écrit, mais quand ses constats sont devenus des tâches
`rapport → analyse → plan d'action → tâches`. Trois états pour un constat, jamais deux : **retenu**
(il devient une tâche qui existe pour de vrai), **écarté** (avec la raison écrite), **à trancher**
(ce n'est pas la décision de l'outil).

### A7 — Un outil qui n'a jamais tourné contre le vrai dépôt n'est pas un outil, c'est une intention
On le lance pour de vrai, sur des données réelles, avant de le considérer terminé.

### A8 — Ce qu'aucune mécanique ne peut porter se déclare par écrit, et le déclarer EST la protection
Certaines obligations ne peuvent être interceptées par aucun code. On ne fait pas semblant qu'elles
sont couvertes : on écrit noir sur blanc qu'elles ne le sont pas. Une impossibilité déclarée vaut
mieux qu'une protection imaginaire.

### A9 — Un outil rend un signal, jamais un verdict
*(révélé : 3 zones, 5 fichiers — « un signal à vérifier, jamais une certitude »)*

Un rapprochement de vocabulaire, une stagnation, une ressemblance : chacun est une piste à vérifier
par une lecture. Aucun outil ne conclut à la place de celui qui lit.

### A10 — Un résultat nomme ses raisons, jamais un score opaque
*(révélé : 5 zones, 12 fichiers — « chaque raison est nommée explicitement dans le résultat, jamais
un score opaque »)*

Un outil qui rend un chiffre sans dire ce qui l'a produit demande qu'on lui fasse confiance. Aucun
ne le demande ici : chaque verdict énumère les raisons qui l'ont formé, et celui qui lit peut les
contester une par une.

### A11 — Rien ne se recopie à la main : ni un registre, ni un seuil, ni un texte de référence
*(révélé : 5 zones, 9 à 12 fichiers — « extrait ligne par ligne, jamais recopié à la main
ailleurs », « jamais recopié à la main », « généré depuis les vrais titres, jamais recopié »)*

C'est A2 poussé jusqu'au bout, et le corpus le pousse déjà là sans l'avoir dit : un texte de
référence utilisé à plusieurs endroits est **extrait** de sa source unique à chaque usage. Une
copie, même fidèle le jour où on l'écrit, est un futur écart silencieux.

### A12 — Au-delà du risque faible, on propose ; on n'applique pas
*(révélé : 5 zones, 5 fichiers — « seules les modifications à RISQUE FAIBLE peuvent y être
appliquées directement ; au-delà, ça se propose, jamais ça ne s'applique »)*

Le seuil d'autonomie d'un outil n'est pas son intelligence, c'est le **risque de ce qu'il touche**.
Un outil très sûr de lui sur une zone sensible propose quand même.

### A13 — Une exemption est une déclaration, jamais une amnistie
*(révélé : 3 zones, 4 fichiers)*

Un cas légitimement hors de portée sort de la liste des fautes **et entre dans une liste à part,
avec sa raison**. Le faire disparaître serait l'erreur symétrique de l'accuser : « personne ne peut
mesurer ça d'ici » ne veut jamais dire « tout va bien ».

---

# PARTIE II — POLITIQUE

*« Comment appliquons-nous notre philosophie ? »* — la politique de chaque niveau répond de la
philosophie **du même niveau**, jamais d'un autre.

## II.A — POLITIQUE GÉNÉRALE *(répond de I.A)*

| | Famille | La règle | Répond de |
|---|---|---|---|
| **PG1** | Gouvernance | L'humain tranche ; l'agent propose, mesure, alerte. Un outil ne valide jamais seul qu'une leçon a été apprise. | G6 |
| **PG2** | Gouvernance | Une demande qui entre en tension avec la loi suprême exige **deux** confirmations explicites, jamais une. | G8 |
| **PG3** | Harmonisation | Une seule source de vérité par sujet ; les autres documents y renvoient au lieu de la reformuler. | G3 |
| **PG4** | Harmonisation | Un dossier d'archive se consulte, ne se corrige jamais, et ne fait jamais autorité. | G3 |
| **PG5** | Contrôle | Tout contrôle coûteux se consulte **avant** l'action, jamais après. | G5 |
| **PG6** | Audit | Tout chiffre livré nomme l'instrument qui l'a produit et l'horodatage de son passage. | G1, G2 |
| **PG7** | Analyse | Deux chiffres ne se comparent que s'ils viennent du même instrument. | G1 |
| **PG8** | Reporting | Un écart entre ce qu'on croyait et ce que les notes disent se dit explicitement, jamais corrigé en silence. | G10 |
| **PG9** | Amélioration | Tout constat suit la chaîne `rapport → analyse → plan → tâche`. Un constat sans suite n'est pas un constat, c'est un souvenir. | G4 |
| **PG10** | Analyse | On **confronte** une affirmation à une mesure ; on ne **recalcule** jamais une donnée déjà calculée par ailleurs. *(révélé : 5 zones, 6 fichiers — leçon L29)* | G1 |
| **PG11** | Contrôle | Le seuil d'autonomie se fixe sur le **risque de la zone touchée**, jamais sur la confiance de celui qui agit. *(révélé : 5 zones, 5 fichiers)* | G6 |

## II.B — POLITIQUE DU JEU *(répond de I.B)*

| | Famille | La règle | Répond de |
|---|---|---|---|
| **PJ1** | Gouvernance | Aucun changement de modèle, de personnalité ou de prompt sans lecture humaine **intégrale** des scénarios de fidélité du ton. | J6 |
| **PJ2** | Contrôle | L'outil de fidélité du ton refuse de conclure quand toutes ses provocations ont été bloquées : il affiche « pas mesuré ». | J1, G2 |
| **PJ3** | Classification | Les personnages n'ont aucune existence dans l'organigramme de l'outillage : ils sont le sujet, jamais un membre. | — |
| **PJ4** | Harmonisation | Un décalage entre l'historique, l'affichage, les jauges et la simulation est toujours le symptôme d'un problème plus profond. | J3 |
| **PJ5** | Contrôle | Une réplique de secours écrite en local existe en plusieurs variantes qui diffèrent **dans le fond**, jamais seulement dans la formulation. | J4 |
| **PJ6** | Reporting | Tout changement d'état perceptible est annoncé au tour suivant ; aucun retour silencieux à la normale. | J5 |

## II.C — POLITIQUE DE L'AGENCE *(⚑ EXPORTABLE — répond de I.C)*

| | Famille | La règle | Répond de |
|---|---|---|---|
| **PA1** | Gouvernance | Un outil signale, il ne bloque pas — sauf là où le blocage est déclaré d'avance et motivé. | A9 |
| **PA2** | Classification | Un rang se définit par son **critère**, jamais par la liste de ses membres. | A2 |
| **PA3** | Classification | Le rangement officiel est un document **généré**, donc jamais périmé. | A2 |
| **PA4** | Nivellement | Tout jugement d'outil est rendu avec un palier de confiance explicite. | A9 |
| **PA5** | Harmonisation | Toute liste manuelle assumée porte, écrite juste à côté, la phrase qui dit qu'elle est manuelle — sinon elle redevient une copie qui se périmera. | A2 |
| **PA6** | Contrôle | Le filet de sécurité est vert avant qu'un travail soit considéré terminé — jamais après coup, jamais différé. | A7 |
| **PA7** | Audit | Toute règle nomme son porteur : un test, un garde-fou, ou la déclaration écrite qu'aucun des deux n'est possible. | A8 |
| **PA8** | Analyse | Un outil jamais sollicité est instruit un par un avant tout retrait — le non-usage est une question, jamais un verdict. | A4 |
| **PA9** | Amélioration | Une vérification approfondie exceptionnelle ne se déclenche jamais seule : elle se propose, et l'humain confirme. | A1, A9 |

---

# PARTIE III — LES CINQ IMPOSSIBLES

*Son test : « les réponses définissent souvent mieux la philosophie que les valeurs elles-mêmes ».*

## Les quatre que le corpus remplit tout seul

### ✅ Ce que nous n'automatiserons jamais
*(199 convictions dans 61 fichiers — la case la mieux remplie des cinq)*

| Niveau | Jamais automatisé |
|---|---|
| **GÉNÉRAL** | Le jugement : une note, une qualité, une priorité, la décision qu'une leçon a été apprise. |
| **JEU** | La validation que le ton n'a pas dérivé. Elle se lit, par un humain, intégralement. |
| **AGENCE** | L'index de jugement d'un rapport ; l'épreuve de la page blanche ; le déclenchement d'une vérification exceptionnelle. |

### ✅ Ce que nous ne déléguerons jamais
*(374 convictions dans 65 fichiers)*

| Niveau | Jamais délégué |
|---|---|
| **GÉNÉRAL** | La décision finale. Un outil informe, il ne tranche pas. |
| **JEU** | Les noms, et l'arbitrage sur l'esprit des personnages. |
| **AGENCE** | La conclusion de période sur notre propre façon de travailler : aucune mécanique ne peut la produire. |

### ✅ Ce que nous refusons absolument
*(rempli par les DÉCISIONS, jamais par les documents normatifs — c'est tout le sujet)*

| Niveau | Refus absolu |
|---|---|
| **GÉNÉRAL** | Qu'un travail soit présenté comme terminé sans preuve vérifiable par celui qui l'a commandé. |
| **JEU** | Qu'une correction rende le dialogue plus propre et plus fade. |
| **AGENCE** | Qu'un constat produit par un outil reste sans suite — « mentionné dans l'analyse puis oublié ». |

### ✅ Ce que nous n'autoriserons jamais

| Niveau | Jamais autorisé |
|---|---|
| **GÉNÉRAL** | Qu'une ambiguïté réelle soit levée par une supposition silencieuse. |
| **JEU** | Qu'un changement touchant la parole des personnages passe sans lecture humaine intégrale. |
| **AGENCE** | Qu'une liste recopiée à la main vive sans garde-fou qui détecte sa divergence. |

## LA SEULE CASE QUE LE TRAVAIL NE PEUT PAS REMPLIR

| Case | Candidates trouvées | Verdict |
|---|---|---|
| **Ce que nous ne sacrifierons jamais** | 3 convictions, 3 fichiers | 🚨 **aucune au-dessus du seuil** |

**POURQUOI CE N'EST PAS UN DÉFAUT DE MESURE.** Les quatre autres cases sont remplies massivement —
jusqu'à 374 convictions dans 65 fichiers. Celle-ci en rassemble **trois**, dans trois fichiers,
toutes locales. Le contraste est trop net pour être un artefact.

**ET CE VIDE-LÀ A UN SENS, qu'il faut dire plutôt que combler.** Le projet sait très bien écrire ce
qu'il n'automatisera pas, ce qu'il ne déléguera pas, ce qu'il refuse et ce qu'il n'autorise pas.
**Il n'a jamais écrit ce qu'il abandonnerait en dernier.** C'est la question du sacrifice — celle
qui ne se pose que le jour où il faut vraiment choisir, et ce jour n'est pas encore venu. Son
propre cadre dit que c'est pourtant la réponse qui définit le mieux une philosophie.

**C'est la seule case de tout ce document que le travail ne peut pas remplir à sa place.**

---

## CE QUI RESTE À TRANCHER, ET RIEN D'AUTRE

Tout le reste de ce document est **révélé**, donc fidèle par construction. Ce qui suit ne l'est pas
et ne peut pas l'être :

1. **La case vide** : ce que nous ne sacrifierions jamais.
2. **Le rang des principes généraux entre eux** — la mesure donne leur étendue, jamais leur
   priorité. G3 est le plus redit ; ça ne veut pas dire qu'il prime sur G1.
3. **Les six étages, ou cinq, ou quatre** — ce document en propose six parce que son cadre les
   propose ; l'adopter est une décision de cadre, pas une correction.
4. **Le sort du document actuel** — cette édition le remplace, le complète, ou cohabite avec lui.

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Suite |
|---|---|---|
| La conviction la plus étendue du corpus (**7 zones sur 7, 14 fichiers**) n'est dans aucun principe de la boussole | **RETENU** | portée ici en G3 — tâche #1419 |
| 18 familles sur 19 du cadre standard sont portées par le corpus ; la boussole n'en reflétait aucune explicitement | **RETENU** | ce document — tâche #1419 |
| 1 des 5 impossibles n'a aucune réponse dans le corpus (*ce que nous ne sacrifierions jamais*) | **À TRANCHER** | elle lui revient ; aucune mesure ne peut la produire |
| Élargir le corpus aux process et aux décisions a rempli 2 cases que les documents normatifs laissaient vides | **RETENU** | c'est sa précision du 2026-10-01 qui l'a produit — noté comme leçon |
| Le rang des principes entre eux n'est pas mesurable | **À TRANCHER** | la mesure donne l'étendue, jamais la priorité |
| Les 23 principes de l'édition actuelle ne sont pas tous repris ici | **ÉCARTÉ pour l'instant** | les reprendre avant validation figerait un rangement que ses réponses peuvent invalider ; l'ancien document reste en place et intact |
| Le découpage en trois niveaux existait déjà à l'étage VISION et ne descendait pas | **RETENU** | corrigé ici — c'est l'architecture de ce document |
| 53,6 % des convictions du corpus ne disent pas de quel monde elles parlent | **RETENU** | correction C1 appliquée ici ; le défaut reste dans le corpus et mérite sa propre tâche |
| 30 % des convictions retenues citent du code — une philosophie ne cite jamais une fonction | **RETENU** | correction C3 appliquée ici |
| Aucune contradiction détectée dans la matière brute (2 775 paires comparées) | **ÉCARTÉ** | rien à corriger — et la limite de la sonde est déclarée plutôt que tue |
