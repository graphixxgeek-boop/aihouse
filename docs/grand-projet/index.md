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

## Les fichiers de ce dossier

| Fichier | Ce qu'il porte |
|---|---|
| [`index.md`](index.md) | ce fichier : la porte d'entrée, les règles du dossier, les calibrages tranchés |
| [`notes-de-travail.md`](notes-de-travail.md) | ce qui n'est qu'à moi : les pièges anticipés, la discipline de lecture, le journal |
| [`01-absorption/lire-les-sources.md`](01-absorption/lire-les-sources.md) | comment lire du Word et du texte, vérifié avant que les fichiers arrivent |
| [`01-absorption/inventaire.md`](01-absorption/inventaire.md) | un document = une ligne : poids, thème, traitement décidé une seule fois |
| [`00-sources/01-sa-demande/README.md`](00-sources/01-sa-demande/README.md) | pourquoi ses deux fichiers ont un statut que les autres n'ont pas |
| [`00-sources/02-documents-prepares/README.md`](00-sources/02-documents-prepares/README.md) | pourquoi le volume n'est pas l'autorité, et l'entrée à l'inventaire avant lecture |
