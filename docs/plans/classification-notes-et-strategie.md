# Classification de l'Agence — toutes les notes, et la stratégie pour en sortir

*(Tâche #742, produit le 2026-09-24. Sa demande : « Tu pourras me faire un rapport complet de TOUTES
les notes prises sur la classification ? tu dois avoir tout archivé quelquepart » — puis, le message
suivant : « on doit d'abord etablir notre strategie pour construire la classification à partir de
l'existant + les notes. ca va etre complexe : aide moi ».)*

---

## LE CONSTAT QUI CHANGE TOUT LE CHANTIER

**On ne part pas de zéro. On part de TREIZE classifications déjà écrites, construites à des dates
différentes, dont aucune ne connaît les autres.**

C'est ça, la complexité qu'il pressentait. Elle n'est pas dans « comment classer » — elle est dans
« on classe déjà treize fois, et rien ne réconcilie ».

### Les treize, relevées sur le code réel

| # | Registre | Où il vit | Ce qu'il classe | Valeurs | Dérivé ou tenu à la main ? |
|---|---|---|---|---|---|
| 1 | `AGENT_CATEGORIES` | `lib-shell.mjs` | le RANG dans l'organigramme | Membre · Agent Cadre · Gardien sacré · 6 « Suites » · Agent Spécial | **à la main** (40 outils) |
| 2 | `TOOL_PORTEE` | `lib-shell.mjs` | agence / simulation / les-deux | 3 | **à la main** + défaut dérivé |
| 3 | `GARDIEN_DOMAINS` | `lib-shell.mjs` | les dossiers qu'un Gardien surveille | — | **à la main** |
| 4 | `TOOL_RELIABILITY` | `lib-shell.mjs` | mécanique / heuristique | 2 | **à la main** |
| 5 | `TYPES_DE_SCRIPT` | `cassandra-rh.mjs` | ce qu'un fichier EST | 8 | dérivé |
| 6 | `CLASSES_TRANSVERSES` | `cassandra-rh.mjs` | ce qu'il SAIT FAIRE | 8 sondes | dérivé |
| 7 | `GROUPES_ICEBERG` | `cassandra-rh.mjs` | membre · oublié · infrastructure · plomberie | 4 | dérivé **+ déclaré** (deux sources) |
| 8 | `MOMENTS` | `cassandra-rh.mjs` | QUAND il intervient | 4 | dérivé |
| 9 | `DOMAINES` | `cassandra-rh.mjs` | SUR QUOI il regarde | 5 | dérivé |
| 10 | `RANGS_QUALIFIES` | `safe-export.mjs` | le vocabulaire des rangs (Article 20bis) | 4 | dérivé (vérificateur) |
| 11 | jeu / Agence / les deux | *mesuré le 2026-09-24, jamais rangé dans un registre* | pour QUI il travaille | 3 | dérivé, **sans domicile** |
| 12 | `family` | `doc-report.mjs` | la famille du registre de rapports | 9 | **à la main** (44 outils) |
| 13 | `PRESTATIONS` | `le-coordinateur.mjs` | l'offre de service | 48 packs | **à la main** |

### Trois divergences mesurées, pas supposées

1. **Deux systèmes de familles qui ne se parlent pas.** `AGENT_CATEGORIES` porte **6 Suites**,
   `doc-report` porte **9 familles**, et **un seul nom leur est commun** (« Suite Dette & Structure
   du code »). Deux rangements du même paysage, écrits à deux moments, jamais confrontés.
2. **Deux populations différentes.** 40 outils ont une catégorie, 44 ont un registre de rapports :
   **9 ont une catégorie sans registre**, **13 ont un registre sans catégorie**.
3. **Deux constantes homonymes.** `DOMAINES` existe dans `cassandra-rh.mjs` (sur quoi un outil
   regarde) ET dans `the-equalizer.mjs` (les domaines d'exigence). Même mot, deux sens, deux
   fichiers — exactement la dette de vocabulaire que l'Article 20bis a déjà dû corriger une fois
   pour le mot « gardien ».

---

## TOUTES LES NOTES, PAR SOURCE

### A. Ce qui a été DÉCIDÉ par l'utilisateur (ces décisions ne se rediscutent pas)

- **Le critère de l'iceberg** : « est-ce que je peux le convoquer ? », puis « est-ce MOI qui le
  lance, ou la machine ? ». Trois groupes demandés ; le terrain en a montré un quatrième
  (INFRASTRUCTURE), qui n'a donc pas été inventé mais trouvé.
- **Le groupe OUBLIÉ est temporaire par construction** et doit se vider. *(Fait le 2026-09-24 :
  0 restant.)*
- **Deux sources par script** : le fichier DÉCLARE son groupe en tête, la machine le DÉRIVE, et un
  désaccord est **rapporté, jamais tranché en silence**. Il a accepté ce choix en sachant qu'il
  coûte 75 annotations.
- **La plomberie est organisée a minima** — on ne lui consacre pas de fiche.
- **La classification vit chez CASSANDRA**, et chaque script déclare son groupe.
- **Le 5e axe, à qui ça sert** : le projet entier · les autres outils · l'agent · l'utilisateur.
- **La dette de nommage se purge APRÈS la classification**, jamais avant — renommer un outil dont
  on ignore le groupe produit un nom qui ne voudra plus rien dire.
- **La fusion d'agents vient APRÈS la classification** *(ma recommandation, à confirmer)*.

### B. Ce qui a été MESURÉ sur le vrai dépôt

| Mesure | Résultat | Date |
|---|---|---|
| Iceberg | 71 membres · 0 oublié · 1 infrastructure · 6 plomberie · **1 désaccord** (`pnpm-install`) | 2026-09-24 |
| Jeu / Agence | 6 outils pour le jeu · 39 pour l'Agence · 1 les deux | 2026-09-24 |
| Poids | outillage 44 283 lignes · jeu 12 815 → **l'outillage pèse 3,6 ×** le jeu | 2026-09-24 |
| Moment | **4 outils sur 78 consultés AVANT d'agir** · 6 à chaque commit · 7 à la Ronde · 61 à la demande | 2026-09-24 |
| Domaine | code 40 · données 34 · documents 22 · tâches 14 · **jeu joué 6** · 10 non mesurables | 2026-09-24 |

### C. Les ratés gardés en contre-test (huit, et ils disent tous la même chose)

Tous les échecs de ce chantier sont des variantes d'**une seule erreur** : *une sonde qui ne peut
pas voir rend exactement ce que rend une sonde qui n'a rien trouvé.*

1. Le point d'entrée cherché comme une forme de fichier → `check-spirit` rangé en plomberie alors
   que la charte imprime sa commande.
2. « Lancé par la machine » sans la conjonction → `check-house` rangé en infrastructure.
3. Le domaine lu sur une MENTION de `lib/` en commentaire → 45 outils sur 65 du mauvais côté.
   **→ leçon L24.**
4. Une DATE cherchée dans le nom de fichier → une archive horodatée en millisecondes passait pour
   du vivant.
5. Le dossier de référence gagnant à toute profondeur → un rapport archivé passait pour du vivant.
   *(Le sens dangereux : il aurait réécrit l'archive.)*
6. `avant` sensible à la casse → un tiers du terrain invisible.
7. Une fenêtre de 400 caractères → un « Avant » de la phrase précédente contaminait la commande
   suivante : 16 outils faussement « consultés avant ».
8. Couper sur un simple retour à la ligne → le compte tombait de 16 à 1.
   *(Markdown replié à 100 colonnes : une phrase tient sur trois lignes.)*

**Et une neuvième, à l'envers** : en écrivant le paragraphe qui EXPLIQUE que `pnpm-install` n'est
pas un outil, je l'ai fait basculer en « membre » — la sonde compte une mention du nom comme une
présentation, sans pouvoir lire que la phrase dit le contraire.

### D. Ce que la classification ne sait PAS, et il faut le lire avant de s'en servir

- Elle dit où RANGER, **jamais si c'est BON** — c'est le travail des Gardiens.
- Elle dit SUR QUOI un outil regarde, **jamais s'il regarde bien**.
- 10 outils ont un domaine **non mesurable** : « on ne sait pas », jamais « aucun domaine ».
- Un désaccord déclaré/dérivé reste ouvert tant que l'utilisateur n'a pas tranché.

---

## LA STRATÉGIE — cinq règles, et elles découlent toutes du constat du haut

### Règle 1 — Ne PAS créer un quatorzième registre

C'est le réflexe naturel et ce serait l'erreur. On construit **une FICHE** par outil qui **agrège**
les axes existants ; chaque axe reste chez lui, là où il est déjà calculé et déjà testé. La fiche
ne recalcule rien : elle lit et présente.

*Pourquoi c'est non négociable : un registre de plus, c'est une quatorzième chose à tenir à jour —
et sur treize, quatre divergent déjà en silence.*

### Règle 2 — Séparer les axes DÉRIVÉS des axes DÉCLARÉS, et le dire

Aujourd'hui les deux sont mélangés sans qu'on le sache. Or ils n'ont pas la même fiabilité ni le
même entretien :

- **Un axe dérivé** se recalcule à chaque passage : il ne peut pas se périmer, mais il peut se
  tromper (voir les huit ratés).
- **Un axe déclaré** ne se trompe jamais sur l'intention, mais il se périme en silence — c'est
  exactement ce qu'interdit l'Article 24.

**Les quatre axes tenus à la main sont donc LA dette de ce chantier** : `AGENT_CATEGORIES`,
`TOOL_PORTEE`, `TOOL_RELIABILITY`, `family` (doc-report). Chacun doit recevoir soit une dérivation,
soit un garde-fou qui détecte l'écart.

### Règle 3 — Réconcilier les familles AVANT d'ajouter le 5e axe

6 Suites contre 9 familles, un seul nom commun : tant que ce n'est pas tranché, tout ce qu'on
empilera dessus héritera de l'ambiguïté. **C'est le premier geste du chantier, pas le dernier.**

### Règle 4 — Un axe = une question, une source, et un état « pas mesuré »

Aucune exception. Un axe qui ne sait pas dire « je n'ai pas pu regarder » fabriquera un faux vert,
et ce chantier en a déjà produit huit.

### Règle 5 — Un axe qui n'a jamais servi à une décision est décoratif

On l'écarte plutôt que de le maintenir. Le paysage compte déjà assez d'outils qui mesurent sans
jamais rien changer.

---

## LA CIBLE — à quoi on veut arriver, et pourquoi

**Une commande `fiche <outil>` qui répond en un écran à : c'est quoi, ça sert à qui, ça pèse
combien, et qu'est-ce que ça coûterait de s'en passer.**

Elle porte, pour chaque outil :

| Ce que la fiche montre | D'où ça vient |
|---|---|
| son rang, sa portée, sa famille | les registres déclarés (axes 1-4) |
| son groupe iceberg, son type, ses classes | dérivé (axes 5-9) |
| pour qui il travaille : jeu / Agence / agent / utilisateur | axes 11 + 5e à construire |
| quand il intervient, sur quoi il regarde | axes 8-9 |
| **son poids** : lignes, part du dépôt, part du temps | à construire (#744) |
| **son coût de départ** : ce qu'il emporte, ce qu'il laisse | à construire (#744) |

**Et c'est cette dernière ligne qui justifie tout le chantier.** Sa formule le dit mieux que moi :
*« c'est chez qui ? c'est un sujet export »*. Un outil qui part doit emporter tout ce qui est chez
lui et rien de ce qui est chez les autres. Sans classification, on ne peut ni chiffrer une fusion,
ni anticiper un compactage, ni rétrograder un agent en sachant ce qu'on gagne.

## LE SIGNAL DE FIN — trois conditions, aucune négociable

1. **Tout script porte tous ses axes, sans désaccord non arbitré.** *(Il en reste 1 aujourd'hui.)*
2. **Chaque axe a servi au moins une fois à une décision réelle.** Sinon il est décoratif (règle 5).
3. **Aucun axe n'est mesuré à deux endroits.** *(Aujourd'hui : 2 systèmes de familles, 2 `DOMAINES`
   homonymes.)*

Tant que l'une des trois est fausse, la classification n'est pas finie — même si tous les scripts
sont rangés.

## LE LIEN AVEC L'ORGANISATION

Direct, et c'est le point que la stratégie rend visible : **l'organigramme doit se DÉRIVER de la
classification**, au lieu d'être tenu à la main comme il l'est aujourd'hui dans
`docs/referentiel/organisation-agence.md`. C'est littéralement ce que l'Article 24 exige, et c'est
la raison pour laquelle 6 Suites et 9 familles ont pu diverger sans que personne le voie.

---

## PLAN D'ACTION

- **RETENU** — Réconcilier les 6 Suites et les 9 familles en un seul système. → **tâche #754**
- **RETENU** — Donner un garde-fou aux 4 axes tenus à la main (l'un d'eux les couvre tous). →
  **tâche #755**
- **RETENU** — Renommer l'une des deux constantes `DOMAINES` homonymes. → **tâche #756**
- **RETENU** — Construire le 5e axe (à qui ça sert). → tâche **#741**
- **RETENU** — Construire la fiche agrégée `fiche <outil>` avec le poids. → tâches **#744** + **#757**
- **À TRANCHER** — Le désaccord `pnpm-install` (déclare plomberie, dérive membre). → **#739**
- **À TRANCHER** — La fusion d'agents après la classification : à confirmer. → **#745**
