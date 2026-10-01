# LE GRAND PROJET — la GRANDE ÉVOLUTION de l'Agence

*(Dossier ouvert le 2026-09-28, AVANT l'arrivée du prompt massif, sur sa consigne : « prépare une
arborescence souple prête à recevoir de nombreux documents dans le cadre de ce nouveau GRAND
PROJET ». Tâches porteuses : #1100 — accueillir l'ENORME PROMPT · #1101 — tout doit être prêt.)*

## Ce que c'est, dans ses mots

> « mener un grand changement dans l'agence, **en embarquant plusieurs sujets à la fois**, plutôt
> que de tout faire à la file et tout devoir défaire à chaque fois. »

**C'est le cœur de sa demande, et ça gouverne tout le reste** : la valeur n'est pas dans les
changements pris un par un — elle est dans le fait de les mener ENSEMBLE. Traiter les sujets à la
file obligerait à défaire le précédent à chaque nouveau, et c'est exactement ce qu'il refuse.

## Les deux grands axes, tels qu'il les a nommés

1. **Définition et institution d'une STRATÉGIE GLOBALE**
2. **RATIONALISATION et MODULARISATION de l'Agence**

**Et il a précisé lui-même que ces axes ne sont pas figés** : « même pour définir précisément ce que
sont les grands axes de ce projet, j'aurai besoin de toi ». Les nommer fait donc partie du travail,
ce n'est pas un préalable qu'il aurait déjà tranché.

## Les deux populations de documents, et elles n'ont PAS le même statut

| | Qui l'a écrit | Statut |
|---|---|---|
| **`00-sources/01-sa-demande/`** | **LUI** — un fichier de demande + un fichier de questions | **PRIORITAIRES.** C'est sa parole : elle ne se résume pas, elle ne s'interprète pas à la légère, et elle prime sur tout le reste du dossier. |
| **`00-sources/02-documents-prepares/`** | **PAS lui** — nombreux, préparés pour gagner du temps | De la MATIÈRE, jamais une consigne. Utile, à exploiter, mais aucun de ces documents ne peut contredire les deux premiers. |

**Ne jamais confondre les deux est la règle la plus importante de ce dossier.** Un document préparé
qui semblerait dire autre chose que sa demande ne la corrige pas : c'est sa demande qui tranche.

## Ma mission principale, telle qu'il l'a définie

> « cette tâche va littéralement exploser en plusieurs tâches et sous-catégories de tâches autour de
> grands thèmes principaux **à articuler proprement** : ce sera ta mission PRINCIPALE dans le
> TRAITEMENT DE CE PROMPT MASSIF. »

Le livrable n'est donc pas une réponse : c'est une **arborescence de thèmes et de tâches qui tient
debout**. Plus `02-strategie/` (comment on s'y prend) et `03-plan-daction/` (aussi détaillé que
possible).

## L'ordre, et il n'est pas négociable

> « Tu devras prendre le temps de **tout absorber** pour avoir une vue globale **AVANT** de
> commencer à VRAIMENT analyser. Il y a des centaines de pages à lire. »

**Absorption complète d'abord, analyse ensuite.** Jamais trancher sur les cent premières pages.
C'est la raison d'être du dossier `01-absorption/` : il existe pour que la phase de lecture laisse
une trace exploitable sans être déjà une analyse.

## Les trois traitements d'un document, qu'il a nommés lui-même

> « ton travail consistera peut-être à **synthétiser** certains d'entre eux autour d'une idée qui
> t'intéresse, pour d'autres tu reprendras peut-être **une partie en copier-coller**, pour d'autres
> enfin tu auras besoin de te référer à **tout le détail**. »

| Traitement | Quand | Où va le résultat |
|---|---|---|
| **SYNTHÈSE** | le document porte une idée utile noyée dans du volume | `01-absorption/syntheses/` |
| **EXTRAIT** | une partie précise sert telle quelle | cité verbatim là où elle sert |
| **INTÉGRAL** | le détail compte entièrement, rien ne peut être perdu | reste dans `00-sources/`, consulté à la demande |

**Le traitement se décide document par document et s'inscrit dans l'inventaire**
(`01-absorption/inventaire.md`) — jamais décidé deux fois, jamais oublié.

## L'arborescence, et pourquoi elle est SOUPLE

```
docs/grand-projet/
├── index.md                      ← ce fichier : la porte d'entrée
├── notes-de-travail.md           ← mes notes au fil de l'eau, avant toute mise en forme
├── 00-sources/
│   ├── 01-sa-demande/            ← SES deux fichiers. Prioritaires. Jamais modifiés.
│   └── 02-documents-prepares/    ← la matière préparée, en sous-dossiers par thème
├── 01-absorption/
│   ├── inventaire.md             ← un document = une ligne : poids, thème, traitement décidé
│   └── syntheses/                ← une synthèse par document traité en SYNTHÈSE
├── 02-strategie/                 ← comment on mène le changement, et dans quel ordre
├── 03-plan-daction/              ← le plan détaillé
└── 04-arborescence-des-taches/   ← l'explosion en thèmes et sous-tâches
```

**Elle est souple parce qu'elle est numérotée par ÉTAPE, pas par sujet** : les sujets ne sont pas
encore connus — il a dit lui-même qu'il aurait besoin de moi pour les définir. Un dossier par sujet
créé aujourd'hui serait à défaire demain, ce qui est exactement le travers qu'il veut éviter.
Les sujets vivront en sous-dossiers de `00-sources/02-documents-prepares/` et de
`04-arborescence-des-taches/`, là où ils apparaîtront pour de vrai.

## Ses quatre calibrages, tranchés le 2026-09-28 avant l'arrivée du prompt

**① L'ORDRE** — « tu dois attendre de TOUT absorber avant de commencer l'analyse ». Ses deux
fichiers se lisent en premier parce qu'ils cadrent la lecture, mais **on n'y répond qu'une fois le
corpus entier absorbé**. Beaucoup de ses questions trouveront probablement leur réponse dans la
matière préparée.

**② PENDANT L'ABSORPTION : rien.** Aucun point d'étape, aucune impression partielle. Il reçoit
**UN** point quand la vue globale est là. C'est cohérent avec ① : lui livrer une lecture partielle
l'inviterait à trancher sur un dixième du corpus, ce que sa propre consigne interdit.

**③ LA TRANSMISSION — il déposera les fichiers DANS LE DÉPÔT, pas dans la conversation.** Il
comptait les coller ici et a demandé conseil ; le conseil est net et la raison est mécanique :

> Un document collé dans la conversation est payé **en entier, une seule fois, et pour toujours** —
> il occupe la mémoire de travail même après avoir été déposé sur disque, même s'il s'avère inutile.
> Un document poussé dans le dépôt n'est payé **qu'au moment où on le lit, et seulement pour la
> partie qu'on lit**. Sur des centaines de pages, l'écart n'est pas un confort : c'est la différence
> entre pouvoir tout absorber et ne pas pouvoir.

**Où il les dépose** : `docs/grand-projet/00-sources/01-sa-demande/` pour ses deux fichiers,
`docs/grand-projet/00-sources/02-documents-prepares/` pour le reste. **Comment, sans ligne de
commande** : sur GitHub, ouvrir le dossier, « Add file » → « Upload files », glisser-déposer,
valider. Plusieurs fichiers à la fois, aucune connaissance de git requise.

**④ LE CLASSEMENT — j'ai de la marge, et il l'a dit ainsi** : « je pense que tu reprendras
sensiblement la même organisation que moi, mais je veux te laisser de la marge ». Donc : **son
rangement est le point de départ**, pas une contrainte. Je le reproduis d'abord, et je m'en écarte
là où la lecture le justifie — en disant ce que je change et pourquoi, jamais en silence.
*(Il précisera lui-même l'étendue de cette marge.)*

## Ce qui reste à trancher avec lui

Inscrit ici plutôt que supposé (Article 16). Les questions lui sont posées en fenêtre dédiée dès
que l'assainissement en cours est terminé.

## CE DOSSIER *EST* LA « DATA QUI ALIMENTE LES STRATÉGIES »

**Sa consigne, écrite en tête de SES DEUX fichiers** : « CE DOC DOIT ÊTRE ENREGISTRÉ AU MÊME ENDROIT
QUE LE FICHIER DE RÉPONSES QUE TU VAS M'ENVOYER : DATA QUI ALIMENTENT LES STRATÉGIES ».
**L'endroit, c'est ici.** Ses deux commandes, les sept lots d'audits, ma trace de lecture, ses
49 questions, la vue globale, le plan d'action : un seul dossier, une seule porte — ce fichier.

**Comment on le retrouve sans connaître ce chemin** *(Article 30 — la reprise des notes)* :

```
node scripts/data-archangel.mjs notes "<le sujet>"
```

Vérifié le 2026-09-28 : sur « rationalisation », la commande remonte six fichiers de ce dossier, la
vue globale et le plan d'action compris. **Un agent qui arrive demain sans une ligne de notre
conversation les trouve.**

**La nuance honnête, parce qu'elle compte** : la commande `briefing` du même outil rend **zéro** sur
ce dossier, et c'est voulu. `briefing` ne regarde que les **sources de données produites par un
outil** — des registres, des journaux, des séries chiffrées. Ce dossier n'en est pas un : il ne
mesure rien, il avance. **« Que produisons-nous ? » et « qu'avons-nous décidé ? » sont deux
questions différentes**, et c'est `notes` qui répond à la seconde.

## Les fichiers de ce dossier

| Fichier | Ce qu'il porte |
|---|---|
| [`index.md`](index.md) | ce fichier : la porte d'entrée, les règles du dossier, les calibrages tranchés |
| [`notes-de-travail.md`](notes-de-travail.md) | ce qui n'est qu'à moi : les pièges anticipés, la discipline de lecture, le journal |
| [`00-sources/index.md`](00-sources/index.md) | pourquoi le catalogue des sources vit dans l'inventaire et pas là — deux listes du même contenu divergent toujours |
| [`01-absorption/lire-les-sources.md`](01-absorption/lire-les-sources.md) | comment lire du Word et du texte, vérifié avant que les fichiers arrivent |
| [`01-absorption/inventaire.md`](01-absorption/inventaire.md) | un document = une ligne : poids, thème, traitement décidé une seule fois |
| [`01-absorption/ce-que-jai-lu.md`](01-absorption/ce-que-jai-lu.md) | la trace de l'absorption : un bloc par document lu, ce qu'il DIT et ses chiffres — jamais ce que j'en conclus |
| [`01-absorption/questions-consolidees.md`](01-absorption/questions-consolidees.md) | ses 49 questions extraites de SES deux fichiers, en une seule liste, avec leur origine |
| [`02-strategie/vue-globale-2026-09-28.md`](02-strategie/vue-globale-2026-09-28.md) | **la vue globale** : ce que les sept lots disent, leurs chiffres revérifiés, ce qu'ils ne pouvaient pas voir, et ce que je recommande |
| [`03-plan-daction/plan-daction-2026-09-28.md`](03-plan-daction/plan-daction-2026-09-28.md) | **le plan d'action** : sept fils et leur ordre de dépendance, la règle de budget (aucune obligation nouvelle sans une retirée), et le raccord avec les 54 tâches ouvertes |
| [`02-strategie/questions-en-cours-de-route.md`](02-strategie/questions-en-cours-de-route.md) | ses questions posées PENDANT le travail, avec la réponse, sa demande inavouée, et **l'action en face** |
| [`02-strategie/couverture-de-sa-demande.md`](02-strategie/couverture-de-sa-demande.md) | **la preuve mécanique** : ses 145 sections et ses 75 blocs de demande confrontés un par un au plan — c'est ce document qui a montré que le premier plan n'en couvrait que la moitié |
| [`02-strategie/grands-axes-de-depart-2026-09-28.md`](02-strategie/grands-axes-de-depart-2026-09-28.md) | **les grands axes de départ** : les quatre axes qu'il a tranchés, celui qu'il a refusé de trancher et pourquoi il a eu raison, et **la chaîne de décision** reconstituée de ses mots — but ultime → philo et politique → les trois stratégies |
| [`02-strategie/notes-des-echanges-de-depart.md`](02-strategie/notes-des-echanges-de-depart.md) | **les notes brutes de nos échanges de départ**, sur sa demande — ses mots, rangés par sujet, avec ce que chacun engage. Se complète à chaque échange structurant, jamais figé au premier soir |
| [`02-strategie/seance-objectif-ultime.md`](02-strategie/seance-objectif-ultime.md) | **LA SÉANCE PRÊTE À LANCER** : le test des 5 critères appliqué à notre cible actuelle (elle échoue à 3 sur 5), la question « un objectif ou deux ? » sur laquelle le corpus se contredit, l'ordre du jour en 6 questions dont **3 ont déjà leur réponse dans le dépôt**, et la mécanique pour que ça dure une heure |
| [`02-strategie/les-trois-objectifs-ultimes.md`](02-strategie/les-trois-objectifs-ultimes.md) | **LES TROIS OBJECTIFS ULTIMES, REFORMULÉS À PARTIR DE SES JETS DU 30/09** : un par niveau — Projet, Agence, Jeu — chacun passé aux 5 critères avec ses échecs affichés. Ce qu'il révèle en comparant à nos documents du 29 : **le Jeu passe de PREUVE à PRODUIT**, ce qui fait passer de deux objectifs à trois ; notre « but » écrit est disqualifié par son propre test ; et deux noms provisoires arrivent (CIRCLE, IBT) dont le coût de renommage est mesuré |
| [`02-strategie/ce-qui-reste-vraiment.md`](02-strategie/ce-qui-reste-vraiment.md) | **SA QUESTION « QU'EST-CE QU'IL MANQUE EN VRAI ? », MESURÉE SUR LES 114 TÂCHES OUVERTES** : 50 % sont déjà dans la Grande Évolution, 38 % de l'hygiène qui disparaîtra par construction, 10 % d'export, **et le Jeu pèse 3 tâches sur 114**. La trouvaille n'est pas le compte : **personne n'a jamais défini ce que « terminée » veut dire** — sa propre commande #1132, ouverte depuis le 28/09. Avec la vérification de son hypothèse sur le Jeu (87 fichiers sur 93 recopiables sans réflexion) et le verdict de CASSANDRA |
| [`02-strategie/la-portabilite-vraiment-mesuree.md`](02-strategie/la-portabilite-vraiment-mesuree.md) | **LA CORRECTION D'UN CHIFFRE RÉPÉTÉ TOUTE UNE SOIRÉE** : le « 38 fichiers sur 40 portent des chemins écrits en dur » venait d'une commande qui n'existe plus, et quatre tentatives de le reproduire ont donné quatre réponses. Le garde-fou de portabilité dit l'inverse (0 non portable sur 88), et chaque cas ouvert à la main était une DÉCLARATION. **Le sens de la correction compte autant qu'elle : c'est un argument en MOINS pour la refonte** |
| [`01-absorption/relecture-de-la-bibliotheque.md`](01-absorption/relecture-de-la-bibliotheque.md) | **LA RELECTURE AVEC LA COMPRÉHENSION D'AUJOURD'HUI**, ses quatre questions. Ce que j'avais manqué : **la TARGET ARCHITECTURE répond déjà à « plusieurs versions ? »**, par une échelle R0→R6 par composant qui croise notre découpe. Quatre phrases de ces documents jugent notre travail — dont « un guardian ne doit pas devenir un orchestrateur caché », déjà arrivé. Et la clé manquante qu'ils nomment eux-mêmes : **le BUILD MAP** |
| [`02-strategie/le-filet-mord-il-vraiment.md`](02-strategie/le-filet-mord-il-vraiment.md) | **LE FILET MORD-IL VRAIMENT ?** La leçon L47 transformée en mesure une heure après avoir été écrite — et **ma propre mesure a commis trois fois l'erreur qu'elle cherchait** : 4 % puis 19 % puis 21 %, 59 blocs à reprendre puis 6 puis 5. Le filet est en bien meilleur état que ma première mesure le disait, et une vérification à la main a montré que les « cinq blocs sans contre-test » en avaient tous un : **zéro trou**. Une suite qui ne fait que monter à chaque regard n'est pas une mesure, c'est un aveu |
| [`02-strategie/le-noyau-est-il-vraiment-extractible.md`](02-strategie/le-noyau-est-il-vraiment-extractible.md) | **NOS TROIS ZONES MESURENT-ELLES LA BONNE CHOSE ?** Trois mesures de la même question donnent **99 %**, **56 %** et **5 %** de portabilité. La phrase de ta TARGET ARCHITECTURE — « un fichier séparé n'est pas automatiquement un module extractible » — est **vérifiée sur notre propre dépôt**. Et tout tient à une question jamais tranchée : `docs/suivi/` est-il une **convention de l'Agence** ou un chemin de ce projet ? |
| [`02-strategie/les-cinq-lots-de-decisions.md`](02-strategie/les-cinq-lots-de-decisions.md) | **LES 17 DÉCISIONS QUI T'ATTENDENT, EN 5 LOTS** — pas une demande de plus : la réparation d'un défaut de mon côté. JESUS a mesuré que la file des décisions est le premier frein, et qu'au-delà d'un seuil l'attente **explose**. Dans chaque lot, **une seule réponse tranche tout le reste**, et le lot E est entièrement délégable |
| [`02-strategie/les-deux-agents-experience.md`](02-strategie/les-deux-agents-experience.md) | **LES DEUX AGENTS DEMANDÉS : conçus en entier, PAS construits** — avec l'argument contre, déclaré plutôt qu'exécuté en silence (Article 14). Sa question « un ou deux ? » a une réponse **mesurée** : deux, pour une asymétrie de données. Trois options chiffrées l'attendent |
| [`02-strategie/propriete-et-securite-du-projet.md`](02-strategie/propriete-et-securite-du-projet.md) | **À QUI EST CE PROJET, ET QUI PEUT TE LE PRENDRE** : ses deux questions nouvelles. La bonne nouvelle est inattendue — la discipline documentaire imposée pour des raisons d'ingénierie **est exactement le dossier de preuve que le droit réclame**. Deux points signalés : l'article L. 113-9 face au Copilot de son employeur, et la faiblesse probante des horodatages git |
| [`02-strategie/plaquette-de-l-agence.md`](02-strategie/plaquette-de-l-agence.md) | **LA PLAQUETTE COMMERCIALE, chaque promesse étiquetée VRAI / VRAI ICI / FICTION** — son exercice, et il révèle ce qu'aucun audit n'avait montré : **sept promesses sur sept sont vraies, et TOUTE la fiction est commerciale**. L'Agence est un produit complet sans entreprise autour. La fiction la plus dangereuse : elle n'a **jamais** été installée ailleurs |
| [`02-strategie/ce-qui-ralentit-le-projet.md`](02-strategie/ce-qui-ralentit-le-projet.md) | **L'ANALYSE DES FREINS, MESURÉE PAR JESUS** : 17 décisions en file dont une depuis 7 jours et la propriété des files qui fait exploser l'attente · 40 % du délai est de l'attente, et c'est un plafond · le cercle des 483 lignes non lues et des 273 relances. Et la réponse à « plusieurs versions ? » : **aucun frein ne vient de la taille du code, tous du nombre d'obligations** — donc découper par NIVEAU D'EXIGENCE, jamais par fonction |
| [`02-strategie/la-route-vers-50-obligations.md`](02-strategie/la-route-vers-50-obligations.md) | **SA CIBLE DE 50 OBLIGATIONS, MESURÉE** : la voie qu'il supposait — fusionner les règles redondantes — est FERMÉE, ABRAHAM n'en trouve qu'UNE paire dans toute la charte. La vraie route est ailleurs et c'est ABRAHAM qui la donne : neuf Articles « mode d'emploi d'outil » portent 47 des 93 obligations et sont réductibles à un aiguillage. Atterrissage : **entre 55 et 66** — ABRAHAM et MOÏSE se contredisent sur l'Article 13, qui pèse 12 obligations à lui seul, et c'est sa décision |
| [`02-strategie/les-cinq-impossibles.md`](02-strategie/les-cinq-impossibles.md) | **LA PREMIÈRE PIÈCE DE LA PHILOSOPHIE, révélée et non inventée** : ce que nous ne sacrifierons, n'autoriserons, n'automatiserons, ne déléguerons jamais, et ce que nous refusons absolument. Chaque réponse porte son PORTEUR réel — et cinq d'entre elles sont du code qui lève une erreur. Ce qu'il révèle : quatorze de nos vingt refus disent la même chose, et aucun Article ne la formule |
| [`02-strategie/questions-de-degrossissage.md`](02-strategie/questions-de-degrossissage.md) | **30 QUESTIONS POUR DÉGROSSIR**, en deux blocs de 15 : les quatre niveaux et les clients de l'Agence · la frontière de la grande évolution (ce qui bouge, ce qui ne bouge pas). Aucune ne répète les 50 du calibrage, et chacune débloque une ligne du plan — une question qui ne change rien à demain n'y figure pas |
| [`03-plan-daction/ou-va-chaque-chose.md`](03-plan-daction/ou-va-chaque-chose.md) | **LE PLAN VIVANT** : où tombe chaque idée de nos échanges dans les sept étapes du chemin, avec pour chacune la raison de ne pas la faire plus tôt ni plus tard. Sa consigne : « place chaque chose au meilleur moment, construis ton plan en même temps qu'on discute » — et sa règle : ne rien faire qui devra être défait |
| [`03-plan-daction/refonte-proposition-2026-10-01.md`](03-plan-daction/refonte-proposition-2026-10-01.md) | **FAUT-IL TOUT REPRENDRE À ZÉRO ?** La proposition de plan d'action, chiffrée : les 2 228 décisions déjà écrites dans le code (le vrai coût, et il est CONCENTRÉ — un seul fichier en porte 32 %), les trois voies possibles, les six étapes de celle que je propose, et les cinq questions qui lui appartiennent. Rien ne démarre avant ses réponses. |
| [`html/refonte-proposition-2026-10-01.html`](html/refonte-proposition-2026-10-01.html) | la même proposition, en page lisible — c'est celle-là qu'il ouvre |
| [`02-strategie/trois-familles-de-la-charte.md`](02-strategie/trois-familles-de-la-charte.md) | **LES TROIS FAMILLES DE LA CHARTE** : mesuré sur les 33 Articles réels — 10 parlent du Jeu, 19 de l'outillage, 4 de la collaboration. La famille AGENCE **est** le pack de règles qu'un client reprendrait ; et la ligne de portée que j'allais écrire (« ce document est la charte du JEU ») aurait été fausse pour 75 % du fichier |
| [`02-strategie/la-cible-2026-09-29.md`](02-strategie/la-cible-2026-09-29.md) | **LA CIBLE** : ses trois questions sur le but ultime, répondues par une mesure (« agence » = 0 occurrence dans la boussole), la cible proposée, et les quatre points qui restent à trancher |
| [`point-de-retour.md`](point-de-retour.md) | **le point de retour nommé** : l'étiquette posée sur l'état d'avant le grand changement, ce qu'elle contient, et comment y revenir en une commande |
| [`02-strategie/le-chemin-2026-09-29.md`](02-strategie/le-chemin-2026-09-29.md) | **LE CHEMIN** : sept étapes ordonnées par dépendance réelle (savoir → aligner → rationaliser → modulariser → installer → finaliser, le jeu en parallèle), avec leurs sous-étapes |
| [`02-strategie/questions-de-calibrage-2026-09-29.md`](02-strategie/questions-de-calibrage-2026-09-29.md) | **les 50 questions de calibrage**, groupées par étage de l'escalade — le bloc A (la cible) se répond en premier, tout en découle. Chaque question porte ma recommandation |
| [`02-strategie/reponses-a-ses-49-questions.md`](02-strategie/reponses-a-ses-49-questions.md) | **les réponses à ses 49 questions** — 28 réponses, avec sa demande INAVOUÉE et l'action en face de chacune, comme il l'a demandé |
| [`02-strategie/decisions-qui-attendent.md`](02-strategie/decisions-qui-attendent.md) | **les décisions qui l'attendent**, présentées en trois lots avec ce qui a changé depuis et ma recommandation en une ligne — dont une dont la réponse a changé parce que sa mesure était fausse |
| [`html/decisions-qui-attendent.html`](html/decisions-qui-attendent.html) · [`html/charte-diffs-a-approuver.html`](html/charte-diffs-a-approuver.html) *(dérivée de `docs/plans/charte-diffs-a-approuver-2026-09-28.md`, qui vit avec les autres plans)* · [`html/reponses-a-ses-49-questions.html`](html/reponses-a-ses-49-questions.html) · [`html/questions-de-calibrage.html`](html/questions-de-calibrage.html) · [`html/questions-de-degrossissage.html`](html/questions-de-degrossissage.html) · [`html/trois-familles-de-la-charte.html`](html/trois-familles-de-la-charte.html) · [`html/le-filet-mord-il-vraiment.html`](html/le-filet-mord-il-vraiment.html) · [`html/le-noyau-est-il-vraiment-extractible.html`](html/le-noyau-est-il-vraiment-extractible.html) · [`html/les-cinq-lots-de-decisions.html`](html/les-cinq-lots-de-decisions.html) · [`html/les-deux-agents-experience.html`](html/les-deux-agents-experience.html) · [`html/relecture-de-la-bibliotheque.html`](html/relecture-de-la-bibliotheque.html) · [`html/propriete-et-securite-du-projet.html`](html/propriete-et-securite-du-projet.html) · [`html/plaquette-de-l-agence.html`](html/plaquette-de-l-agence.html) · [`html/ce-qui-ralentit-le-projet.html`](html/ce-qui-ralentit-le-projet.html) · [`html/la-route-vers-50-obligations.html`](html/la-route-vers-50-obligations.html) · [`html/les-cinq-impossibles.html`](html/les-cinq-impossibles.html) · [`html/la-portabilite-vraiment-mesuree.html`](html/la-portabilite-vraiment-mesuree.html) · [`html/ce-qui-reste-vraiment.html`](html/ce-qui-reste-vraiment.html) · [`html/les-trois-objectifs-ultimes.html`](html/les-trois-objectifs-ultimes.html) · [`html/seance-objectif-ultime.html`](html/seance-objectif-ultime.html) · [`html/le-chemin.html`](html/le-chemin.html) · [`html/la-cible.html`](html/la-cible.html) · [`html/notes-des-echanges-de-depart.html`](html/notes-des-echanges-de-depart.html) · [`html/grands-axes-de-depart.html`](html/grands-axes-de-depart.html) · [`html/vue-globale.html`](html/vue-globale.html) · [`html/plan-daction.html`](html/plan-daction.html) · [`html/questions-en-cours-de-route.html`](html/questions-en-cours-de-route.html) | les mêmes, en pages HTML lisibles — **régénérées** depuis le Markdown par doc-HTML, jamais écrites à la main |
| [`html/rapport-de-nuit-2026-09-29.html`](html/rapport-de-nuit-2026-09-29.html) | **le rapport de la nuit du 2026-09-29** en page lisible — dérivé de `docs/rapports-de-nuit/2026-09-29-rapport.txt`, qui reste la source. Ce qui a été fait dans l'ordre de SON escalade, ce qui a été trouvé sans que personne le cherche, ce qui a été mis de côté et pourquoi, et ce qui attend une décision |
| [`html/rapport-de-nuit-2026-09-30.html`](html/rapport-de-nuit-2026-09-30.html) | **le rapport de la nuit du 29 au 30 septembre** en page lisible — dérivé de `docs/rapports-de-nuit/rapport-2026-09-30.md`, qui reste la source. Ta cible de 50 obligations, la porte d'entrée réparée, tes trois questions nouvelles, et la troisième partie de nuit : quatre obligations de la charte que personne ne tenait, dont **le mode de travail qui te déclarait absent depuis sept jours** |
| [`fil-de-discussion.md`](fil-de-discussion.md) · [`html/fil-de-discussion.html`](html/fil-de-discussion.html) | **LE FIL DE DISCUSSION — la porte d'entrée de tout ce qui est en cours entre nous.** Un sujet = un fil numéroté, qui affiche en haut à qui est la balle (`▶ À TOI` / `◀ À MOI`), garde son historique, et ne se perd pas d'une séance à l'autre. Document VIVANT : toujours ce fichier-ci, jamais un nouveau à chaque fois. Né le 2026-09-30 de sa demande d'un système « voiture-balai » qui agrège TOUTES les questions en cours, y compris les implicites |
| [`ou-on-en-est-vraiment.md`](ou-on-en-est-vraiment.md) · [`html/ou-on-en-est-vraiment.html`](html/ou-on-en-est-vraiment.html) | **L'ÉTAT VÉRIFIÉ DE SES DEMANDES**, produit le 2026-09-30 après son « STOP ». Chaque ligne contrôlée par une commande dans le dépôt, jamais de mémoire : 13 demandes PAS FAITES, 8 partielles, 8 faites — et la cause racine, ses fichiers de demande absents du dépôt, donc invérifiables par tout outil |
| [`00-sources/01-sa-demande/reponses-2026-09-29-soir.md`](00-sources/01-sa-demande/reponses-2026-09-29-soir.md) · [`reponses-2026-09-30.md`](00-sources/01-sa-demande/reponses-2026-09-30.md) · [`reponses-2026-09-30-soir-philo.md`](00-sources/01-sa-demande/reponses-2026-09-30-soir-philo.md) · [`reponses-2026-10-01-nuit-rationalisation.md`](00-sources/01-sa-demande/reponses-2026-10-01-nuit-rationalisation.md) | **ses quatre fichiers de réponses**, déposés le 2026-09-30 — ils n'existaient que dans la conversation jusque-là. Les deux premiers portent 4 286 et 3 108 mots de demandes que rien ne pouvait confronter au dépôt ; le troisième, du soir, porte ses JETS sur les trois objectifs ultimes, la philosophie et la politique, plus les deux noms provisoires CIRCLE et IBT (il s'y situe lui-même **à 60 %**) ; le quatrième porte **huit sujets d'un coup**, dont sa proposition centrale — **tout reprendre à zéro, au propre, module par module** |
| [`00-sources/02-documents-prepares/DOSSIER_DE_CONCEPTION_ET_EXPLOITATION.txt`](00-sources/02-documents-prepares/DOSSIER_DE_CONCEPTION_ET_EXPLOITATION.txt) · [`Modele_gouvernance_agence_virtuelle.pdf`](00-sources/02-documents-prepares/Modele_gouvernance_agence_virtuelle.pdf) | **LE MODÈLE DE GOUVERNANCE**, déposé par lui le 2026-09-24 et **jamais absorbé jusqu'au 2026-09-30**. Le `.txt` est l'extraction du `.pdf` (15 pages, 3 114 mots, 13 sections) — le PDF n'est pas lisible dans cet environnement, aucun extracteur n'y est installé. C'est le document qu'il cite en demandant « à quelle organisation cible veut-on arriver ? » : chaîne de construction en 15 étapes, chaîne d'exploitation en 10, catalogue d'agents avec entrées et sorties, matrice de responsabilités, feuille de route |
| [`00-sources/01-sa-demande/README.md`](00-sources/01-sa-demande/README.md) | pourquoi ses deux fichiers ont un statut que les autres n'ont pas |
| [`00-sources/02-documents-prepares/README.md`](00-sources/02-documents-prepares/README.md) | pourquoi le volume n'est pas l'autorité, et l'entrée à l'inventaire avant lecture |

**Les documents SOURCES ne figurent pas dans ce tableau, et c'est voulu** : ils sont des `.docx`
et des `.txt`, ils arriveront par centaines, et leur catalogue est
[`01-absorption/inventaire.md`](01-absorption/inventaire.md) — qui porte bien plus qu'une liste de
noms. Ce tableau-ci ne recense que la STRUCTURE du dossier, qui elle ne bouge presque pas.

<!-- catalogue-delegue: 01-absorption/inventaire.md -->

*(La ligne ci-dessus n'est pas décorative : elle DÉCLARE au système des index que le catalogue des
sources vit dans l'inventaire. Sans elle, ce dossier passerait pour mal annoncé alors que chacun de
ses fichiers y est nommé — et la seule façon de le faire taire aurait été d'y recopier les noms,
c'est-à-dire de créer la seconde liste que l'Article 24 interdit.)*
