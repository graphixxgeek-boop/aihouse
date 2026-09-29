# PLAN D'ACTION DU GRAND CHANGEMENT

*(Tâches #1100 · #1101 · #1113 · #1114 · #1116. Réécrit dans la nuit du 2026-09-28 au 29, sur sa
consigne : « je veux que tu prennes du temps pour approfondir ta réflexion [...] je ne veux pas un

> **DÉCOULE DE :** `docs/grand-projet/02-strategie/la-cible-2026-09-29.md`
> *le plan qui met la cible en œuvre — à refondre une fois la cible validée.*

plan d'action à la va-vite, je veux toute une stratégie cohérente dans tout son ensemble [...] comme
avant de partir en guerre ».)*

> **LA FRONTIÈRE AVEC LES AUTRES DOCUMENTS, écrite pour qu'aucun ne redise l'autre.**
> `docs/grand-projet/02-strategie/vue-globale-2026-09-28.md` porte le **POURQUOI** (le diagnostic,
> les chiffres, ce que les audits ne pouvaient pas voir).
> `docs/grand-projet/02-strategie/couverture-de-sa-demande.md` porte la **PREUVE** que rien de sa
> demande n'est oublié — chaque ligne qu'il a écrite, et où le plan y répond.
> **Ce document-ci porte le QUOI, le QUAND et le QUI.**

> ---
>
> **⚠️ CE DOCUMENT EST UN PROJET DE PLAN, PAS UN PLAN ARRÊTÉ — ET C'EST LUI QUI A REMIS L'ORDRE
> D'APLOMB, la nuit du 2026-09-28 au 29 :**
>
> > « pour moi les tâches devaient venir **après la stratégie globale**, qui elle vient **après le
> > calibrage des grands axes**, de compréhension de où nous allons, et de quelle manière. »
>
> **Il a raison, et l'ordre réel est celui-ci :**
> `① calibrage des grands axes → ② stratégie globale → ③ plan d'action → ④ tâches`
>
> **J'avais produit ③ et ④ avant ① et ②.** La cause est nommable, et elle est instructive pour le
> chantier lui-même : l'**Article 28** exige qu'un constat annoncé comme RETENU pointe vers une
> tâche qui existe VRAIMENT dans `docs/suivi/` — sans quoi `checkActionChain()` refuse le rapport.
> Ce garde-fou existe pour empêcher qu'un rapport meure sans suite ; ici **il a produit l'inverse de
> son intention** : il m'a poussée à cristalliser seize tâches sous un plan qu'il n'avait pas encore
> calibré. Un garde-fou qui force une décision prématurée n'est plus un garde-fou, c'est une
> contrainte de forme — exactement la classe de défaut que ce grand chantier doit traiter. *(À
> instruire : tâche #1141.)*
>
> **Conséquence immédiate, appliquée le soir même** : les seize tâches #1125 à #1140 sont passées de
> « Ouverte » à **« À TRANCHER »** — elles attendent son calibrage, elles ne sont pas de la file de
> travail. Rien n'est perdu : leur contenu est l'analyse, et l'analyse reste valable ; seul leur
> STATUT était faux.

---

## 0. CE QUE LA PREMIÈRE VERSION DE CE PLAN AVAIT MANQUÉ

Il a demandé de tout revérifier. La vérification a été faite **mécaniquement** — ses deux documents
découpés en 145 sections, dont 75 blocs de demande, confrontés un à un au plan.

**Résultat : la première version couvrait environ la moitié de sa demande.** La cause est précise :
**j'avais construit le plan avec le vocabulaire des AUDITS** — carte, contrats, extractions — alors
que **sa commande a sa propre structure** : trois stratégies alignées, un pack découverte, deux
versions, un chantier de finalisation.

> **J'avais planifié la rationalisation technique. Il demandait la mise en place d'un SYSTÈME DE
> STRATÉGIES, dont la rationalisation n'est qu'un des objets.**

C'est un défaut de cadre, pas d'attention — et c'est exactement pourquoi il fallait le vérifier
avec un outil plutôt qu'en se relisant. Le détail des 14 manques : `../02-strategie/couverture-de-sa-demande.md`.

---

## 1. CE QU'ON MET EN PLACE, EN UNE PHRASE

**Un système où une intention devient une stratégie, une stratégie devient des tâches, les tâches
remontent ce qu'elles apprennent, et où un outil crie quand quelque chose part à l'envers.**

Et ce système porte sur **trois objets** qu'il a nommés lui-même : le projet **AGENCE**, le projet
**JEU**, le **PROJET ENTIER**.

La rationalisation et la modularisation de l'Agence ne sont pas le but : **ce sont ce que la
stratégie AGENCE aura à conduire une fois qu'elle existera.**

---

## 2. LA RÈGLE QUI PROTÈGE TOUT LE RESTE — le budget d'obligations

**La critique la plus dure de ce chantier est qu'il peut aggraver le mal qu'il soigne.** Le constat
unanime des sept audits est que **la gouvernance de l'Agence est déjà plus grosse que ce qu'elle
gouverne**. Et ce plan s'apprête à ajouter un axe de classement, un document maître, un mécanisme
d'escalade et des garde-fous.

**Une bonne intention ne suffira pas. Il faut un budget, et il est simple :**

> ## AUCUNE OBLIGATION NOUVELLE SANS UNE OBLIGATION RETIRÉE.
> Chaque registre que le fil E ajoute, le fil C en supprime un. Chaque règle de charte ajoutée en
> remplace ou en fond une autre. **Le compte se tient, et il se mesure** — `moise-tables-de-loi`
> compte déjà les obligations de la charte, article par article.

**Et son corollaire, tout aussi ferme** : *tout artefact de gouvernance produit par ce chantier est
**DÉRIVÉ**, jamais tenu à la main.* C'est sa propre règle, écrite dans sa commande : « tous les
rapports et documents sont constitués à partir de données dérivées, sauf raison valable ou
évidente ». Un document de stratégie tenu à la main se périme en trois semaines et devient un
mensonge poli.

---

## 3. LES SEPT FILS, ET LEUR VRAIE FORME

**Sept fils menés en parallèle, ce n'est pas sa demande — c'est de la dispersion.** Sa demande est
d'*embarquer plusieurs sujets à la fois plutôt que de tout faire à la file*. Les sept ont une
structure de dépendance, et c'est elle qui dit ce qui démarre ensemble.

```
   MAINTENANT, ENSEMBLE          DÈS QUE LA CARTE EXISTE        QUAND IL VEUT      EN DERNIER
   ────────────────────          ───────────────────────        ─────────────      ──────────
   A · LA CARTE  ──────────────► C · LA DETTE                   F · LE JEU         G · LA
   B · LE FREIN                  D · LA PAROLE                                        FINALISATION
   E1 · LE SOCLE D'ALIGNEMENT    E2 · LES GARDE-FOUS
        (ne dépend de rien)           D'ALIGNEMENT
```

**Pourquoi G est en dernier, et ce n'est pas mon choix** : *« avant tout, l'agence terminée doit
être RATIONNALISÉE : ensuite les versions plus légères bénéficieront et hériteront de ce côté
épuré »* — c'est sa phrase.

---

## FIL A · LA CARTE

**Destination** : chaque fichier de l'outillage sait à quelle branche il appartient, et ça se LIT.

| Étape | Tâche | Outils sollicités |
|---|---|---|
| l'axe `couche`, dix valeurs, dérivé | **#1117** | `le-classificateur` (l'axe rejoint les neuf autres) · `safe-export` (la couche croise l'exportabilité) |
| le BUILD MAP — une ligne par composant | **#1118** | `le-classificateur` · `data-archangel` · `abraham-les-references` · `cassandra-rh` (l'organigramme) · `clone-hunter` |
| les routes autorisées entre branches, et leur garde-fou | **#1118** | `check-harmonia` (c'est son métier : la cohérence des liens) |
| les sept séparations à PROTÉGER | **#1118** | — décision, pas mesure |

**Critère de fin** : un nouveau venu place un outil dans sa branche sans connaître l'histoire.

## FIL B · LE FREIN

**Destination** : qu'aucun outil nouveau n'agrandisse le problème pendant qu'on le range.

| Étape | Tâche | Outils |
|---|---|---|
| aucun outil neuf sans couche déclarée | **à créer** | `integration-outil` (il exige déjà blueprint, fiche, registre) |
| le gel des grandes capacités — règle de charte, **montrée avant** | **à créer** | `moise-tables-de-loi` (il compte les obligations, donc il tient le budget) |

## FIL C · LA DETTE

**Destination** : le coût d'entrée d'un outil passe de **dix registres à un**.

| Étape | Tâche | Outils |
|---|---|---|
| mesurer lesquels des dix sont dérivables | **#1119** | `jesus-le-sauveur` (c'est lui qui a mesuré les dix) · `data-archangel` |
| les 480 lignes de bannière par commit | **#1119** | `ecotoken` · `tool-brain` |
| les deux outils dormants — **après la carte** | **#1119** | `tool-brain` (usage réel) · `cassandra-rh` |

**C'est le fil qui PAIE le budget du §2.** Sans lui, le fil E ajoute sans rien rendre.

## FIL D · LA PAROLE

**Destination** : il a ses réponses, et le pack découverte existe — dérivé, et **livré par
quelqu'un**.

| Étape | Tâche | Outils |
|---|---|---|
| ses 49 réponses, en HTML, avec le gabarit qu'il a défini | **#1112** *(la liste)* | `doc-HTML` · `data-archangel ancres` (pour citer exactement) |
| le PACK DÉCOUVERTE, dérivé | **#1136 à créer** | `ines-official` (l'édition consolidée EST la matière) · `cassandra-rh` (l'organigramme) · `kpi-report` · `doc-HTML` |
| **le SYSTÈME qui le livre** — à la demande ou à chaque Ronde | **#1136** | `circle-tasks` (c'est la Ronde) |
| l'axe ADMIN / COMMERCIALISABLE, dérivé et rétroactif | **#1136** | `le-classificateur` (11ᵉ axe) |

**Le gabarit de réponse qu'il a imposé** : sa question · la réponse · **sa demande inavouée** ·
l'action en face, avec son état. Une réponse sans action en face est un constat qui meurt.

## FIL E · L'ALIGNEMENT — *le fil qui manquait, et c'est le cœur de sa commande*

**Destination** : *« que tout soit cohérent dans nos avancées, et que les outils puissent réagir si
des choses sont faites à l'envers de la stratégie »* — sa phrase, mot pour mot.

### E1 — le socle (démarre tout de suite, ne dépend de rien)

| Étape | Tâche | Outils |
|---|---|---|
| **le document MAÎTRE** : « la référence ultime », et **qui le porte** *(il propose THE-KING, et il a probablement raison : c'est déjà le gardien de la philosophie)* | **à créer** | `the-king` · `objectifs-vs-resultats` |
| **l'axe STRATÉGIE sur les tâches** : « chaque tâche devrait porter une classe de stratégie » | **à créer** | `criticite` (le format des tâches) · `check-tasks-details` · `le-classificateur` |
| **les deux règles de travail qu'il a posées et que rien ne porte** : tout document est dérivé · toute recherche web s'enregistre | **à créer** | `moise-tables-de-loi` · `angel-of-ia-process` |

### E2 — les garde-fous (dès que la carte et l'axe existent)

| Étape | Tâche | Outils |
|---|---|---|
| **la dynamique d'escalade** tâches → stratégie → philo/politique, et retour — puis **la FIABILISER** | **à créer** | `god-of-all-process` · `angel-of-ia-process` · `the-king` |
| **l'outil qui réagit quand on va à l'envers de la stratégie** | **à créer** | `check-harmonia` (incohérence entre deux parties) · `the-king` |
| **les trois bornes** de « l'agence est terminée » | **à créer** | `safe-export` (il porte déjà le pourcentage) · `objectifs-vs-resultats` |
| **la passe générale** : objectifs et KPI, RH, « qui d'autre ? » alignés sur les stratégies | **à créer** | `kpi-report` · `objectifs-vs-resultats` · `cassandra-rh` |
| **charte, règles de travail, référentiel, process adaptés** — *montrés avant* | **à créer** | `moise-tables-de-loi` · `abraham-les-references` · `god-of-all-process` |
| **réorganiser les fichiers de stratégies et de notes** | **à créer** | `data-archangel` · `le-classificateur` · `doc-report` |

## FIL F · LE JEU ET LES DEUX LECTURES — *l'autre fil qui manquait*

**Destination** : le jeu a sa stratégie, et l'Agence sait se présenter **comme si elle n'avait
qu'un seul projet**.

| Étape | Tâche | Outils |
|---|---|---|
| **la stratégie du JEU** — la troisième partie de sa commande, jamais écrite | **à créer** | `el-professor` · `run-simulation` · `check-spirit` |
| **les DEUX stratégies globales séparées** : celle qui inclut les deux projets (pour lui) et celle qui fait comme s'il n'y avait que le jeu (pour l'acheteur) | **à créer** | `safe-export` · `le-classificateur` (l'axe ADMIN/UTILISATEUR) |

**Pourquoi ce fil est indépendant** : il ne dépend d'aucun des six autres, et il corrige un
déséquilibre que la charte signale elle-même — **86,6 % des tâches ne touchent pas au jeu**.

## FIL G · LA FINALISATION — *en dernier, sur sa propre consigne*

**Destination** : sauvegarder l'Agence complète, puis passer à une version plus légère **sans rien
perdre**. Il qualifie lui-même cette étape de *« clairement DANGEREUSE et RISQUÉE »*.

| Étape | Tâche | Outils |
|---|---|---|
| le plan de sauvegarde de la version complète | **à créer** | `safe-export` · `sauvegarde-projet` · `ines-official` |
| le plan de migration vers une version light, et ses précautions | **à créer** | `safe-export` · `x-port-blindtest` |
| la version **avec ou sans** les parties analyse-simulation | **à créer** | `le-classificateur` · `safe-export` |

---

## 4. CE QUI VIENT APRÈS LA CARTE — le technique

Dans cet ordre, qui est celui des audits et que je valide :

1. **Les contrats nécessaires**, et seulement eux : `Finding` d'abord (sept gardiens rendent sept
   formats), puis `Report`, `Tool`, `Task`, puis `ModelGateway` et `Repository`.
2. **Le Transaction Engine** *(#1120)* — le seul vrai trou de l'architecture. **Je le place avant
   les extractions, contre l'ordre des audits** : une extraction sans retour arrière est exactement
   ce que sa sauvegarde de référence cherche à couvrir.
   **Et il embarque ce que la LITTÉRATURE apportait et que j'avais manqué** : les **quatre niveaux
   d'autorisation** (observation · proposition · automatique contrôlé · autonomie) et la séparation
   **INTENT → DECISION → EXECUTION**. Ce ne sont pas des raffinements : ce sont les deux mécanismes
   qui rendent une agence sûre à confier à quelqu'un d'autre.
3. **Les premières extractions** : `daynight`, puis `gemini-keys`, puis `relationship`.
4. **`check-house`** en moteur de caractérisation, jamais découpé par taille.
5. **`/api/lia` en DERNIER**, sous la protection de l'Article 0.

### LE CONTRAT D'HÔTE — ajouté le 2026-09-28 parce qu'il manquait, et c'est lui qui l'a trouvé

Trois couches, trois règles fixes (`node scripts/safe-export.mjs tuyauterie`) : EMPORTÉE (67
scripts) · EXIGÉE (72, elle s'y branche, ne l'apporte jamais) · ADAPTÉE (5). **94 % indépendante de
l'infrastructure de son hôte.** Et si l'hôte ne fournit pas : **on refuse proprement et on le dit
avant** (`safe-export accueil`).

### LA LIGNE ROUGE

> **Toute étape qui touche au chemin du dialogue passe par `check-spirit` AVANT et APRÈS, et le
> résultat se LIT.**

📜 Article 0. La raison est au §4.1 de la vue globale.

---

## 5. LE RACCORD AVEC LA FILE EXISTANTE — réponse à #1114

**54 tâches ouvertes.** Où elles tombent :

| Fil | Tâches déjà ouvertes |
|---|---|
| **A** | #745 · #793 · #705 · #1005 · #902 |
| **C** | #814 · #823 · #819 · #1053 · #1092 · #704 |
| **D** | #1112 |
| **E** | #696 · #767 · #790 · #1067 · #717 · #703 · #708 · #710 · #721 |
| **F** | — *(le fil est neuf, et c'est le constat)* |
| **G** | #700 · #725 |
| **Hors chantier** | #679 · #681 · #699 · #845 · #1019 · #1079 · #1102 · #1113 · #1114 |
| **Reportées après** | les 9 renommages + la refonte graphique |

**23 tâches sur 54 sont absorbées par un fil** — contre 17 dans la première version, parce que le
fil E en récupère neuf que je n'avais pas su rattacher.

**Et une correction d'objectif, qu'il faut dire** : viser « moins de 5 tâches ouvertes avant le
grand chantier » n'a plus de sens — **le chantier a commencé, et ces tâches SONT le chantier.**

---

## 6. L'ORDRE VERROUILLÉ

```
   ce plan  →  ses calibrages (≥50 questions)  →  SAUVEGARDE DE RÉFÉRENCE  →  première action
                                                   (avec le plan DEDANS)
```

**La sauvegarde ne marque pas un état, elle marque un état ET une intention** — sa phrase : *« je
garde la trace de où on en est + où on se dirige »*.

---

## 7. CE QUE JE NE FERAI PAS

*Les raisons sont au §6 de la vue globale.*

Pas de taxonomie concurrente · pas de déplacement de fichiers avant la carte · pas d'étiquetage
manuel rétroactif · pas de MCP, d'event bus ni de monorepo à ce stade · pas de suppression d'outil
avant la carte · **pas de renommage** (étape récompense, après) · **et pas une seule obligation
nouvelle sans une obligation retirée** (§2).

---

## 8. PLAN D'ACTION — les constats et leur suite (Article 28)

| # | Constat | État | Suite |
|---|---|---|---|
| 1 | Pas d'axe « couche » | RETENU | **#1117** |
| 2 | Le BUILD MAP n'existe pas | RETENU | **#1118** |
| 3 | Un outil neuf coûte dix registres | RETENU | **#1119** |
| 4 | Le Transaction Engine manque, et avec lui les 4 niveaux d'autorisation | RETENU | **#1120** |
| 5 | Le positionnement produit vise le marché le plus disputé | À TRANCHER | **#1121** |
| 6 | **Le plan couvrait la moitié de sa demande** | RETENU | **ce document, et les tâches du §9** |
| 7 | La ligne rouge `check-spirit` | RETENU | dès la première étape |
| 8 | Le contrat d'hôte | RETENU | fait — `safe-export tuyauterie` et `accueil` |
