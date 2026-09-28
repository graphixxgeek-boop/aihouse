# PLAN D'ACTION DU GRAND CHANGEMENT

*(Tâches #1100 accueillir l'ENORME PROMPT · #1101 tout doit être prêt · #1113 point de non-retour ·
#1114 lien tâche↔chantier. Écrit le 2026-09-28 après absorption complète des 20 sources, la vue
globale `../02-strategie/vue-globale-2026-09-28.md`, et la recherche de marché
`../../recherches/marche-agents-code-2026-09-28.md` qu'il a demandée avant le plan.)*

> **Sa demande fondatrice, et elle gouverne la FORME de ce plan** : « mener un grand changement dans
> l'agence, **en embarquant plusieurs sujets à la fois**, plutôt que de tout faire à la file et tout
> devoir défaire à chaque fois. »

> **LA FRONTIÈRE AVEC LA VUE GLOBALE, écrite pour qu'aucun des deux ne redise l'autre** :
> `docs/grand-projet/02-strategie/vue-globale-2026-09-28.md` porte le **POURQUOI** — le diagnostic, les chiffres
> revérifiés, ce que les audits ne pouvaient pas voir, et les raisons de chaque choix. **Ce document
> ne porte que le QUOI et le QUAND** : les étapes, leur ordre, et à quelle tâche chacune se
> raccorde. Chaque fois qu'une raison manque ici, elle est là-bas, et le renvoi est explicite.
> *(Frontière posée le 2026-09-28 après que le détecteur de documents jumeaux ait mesuré 35 % de
> recouvrement entre les deux — il avait raison, et c'est le garde-fou qui a gagné.)*

---

## 0. Ce que ce plan doit produire, et comment on saura qu'il a réussi

**Destination écrite** — c'est la règle que les trois audits posent en premier et que j'adopte pour
chaque étape : *aucune étape sans destination*. « Ranger les outils » n'en est pas une.
« Qu'un outil neuf coûte UN registre au lieu de dix » en est une.

Les **dix critères de fin** viennent du plan directeur, et ils sont testables. Je les reprends tels
quels parce qu'ils sont bons, en marquant ceux que je considère atteignables dans ce chantier-ci :

| # | Critère | Ce chantier |
|---|---|---|
| 1 | un nouveau venu comprend les grandes branches sans connaître l'histoire | **oui** |
| 2 | un nouvel agent découvre les contrats sans lire 97 000 lignes | **oui** |
| 3 | un outil peut être retiré sans enquête archéologique | **oui** |
| 4 | un composant s'exporte avec ses dépendances | plus tard |
| 5 | le modèle IA change sans réécrire le domaine | plus tard |
| 6 | la base change sans réécrire les règles métier | plus tard |
| 7 | les tests visent des contrats | partiellement |
| 8 | **les outils de gouvernance ne deviennent pas une seconde jungle** | **oui — c'est le cœur** |
| 9 | le produit s'explique en quelques minutes | **oui (fil D)** |
| 10 | une équipe extérieure crée une agence sans connaître Maison IA | plus tard |

---

## 1. LES QUATRE FILS, menés ENSEMBLE

C'est sa demande, et c'est aussi ce que la structure impose : le fil A débloque D, le fil B protège
A pendant qu'il se construit, et le fil C attaque la cause que A ne fait que décrire.

```
        A — LA CARTE  ────────────────►  D — LA PAROLE
        (sans elle, rien)                 (dérivée de A)
              │
              ├──► B — LE FREIN   (protège A pendant qu'elle se construit)
              │
              └──► C — LA DETTE   (traite la cause que A décrit)
```

---

## FIL A — LA CARTE

**Destination** : chaque fichier de l'outillage sait à quelle grande branche il appartient, et ça se
LIT, ça ne se recopie pas.

### A1 — Le dixième axe, `couche` *(tâche #1117)*

*Pourquoi cet axe et pas une taxonomie neuve : vue globale, §4.3.*

**Dix valeurs, qu'il a validées en fenêtre dédiée** : `CORE` · `PROJECT` · `TOOLS` · `WORK` ·
`QUALITY` · `OBSERVABILITY` · `GOVERNANCE` · `KNOWLEDGE` · `EXPORT` · `ADAPTERS`.

**Comment il se remplit** : dérivé, comme les neuf autres — de ce qu'un outil lit, écrit, et de qui
l'appelle. Ce qui ne se dérive pas reçoit `inconnu`, jamais une supposition.

**Garde-fou** : signale sans bloquer, avec un contre-test qui fabrique exprès un fichier sans
couche — sinon le zéro ne prouve rien.

### A2 — LE BUILD MAP — le document que personne n'a produit *(tâche #1118)*

Le dernier lot l'annonce et ne le livre pas. C'est le seul qui permettrait de commencer sans
avancer à l'aveugle. **Une ligne par composant**, et tout ce qui peut l'être est dérivé :

| Champ | Dérivé ? |
|---|---|
| origine historique (fichier, date de naissance) | **oui**, git |
| couche | **oui**, A1 |
| lignes, fonctions exportées, consommateurs | **oui** |
| dépendances entrantes et sortantes | **oui** |
| registres qui le nomment | **oui** |
| maturité R0→R6 | **partiellement** — dérivable jusqu'à R2, jugé au-delà |
| responsabilité en une phrase | **non** — écrit à la main, une fois |
| décision (garder / fusionner / déplacer / transformer / déprécier / supprimer / extraire) | **non** — **la sienne** |

**Ce que l'outil fera et ne fera pas** : il PROPOSE une décision à partir du score, il ne la prend
jamais. *(Même doctrine que `check-tasks-details` face à `god-of-all-process` : l'un propose une
forme, l'autre constate le manque, et les fusionner donnerait un outil qui se satisfait tout seul.)*

### A3 — Les routes autorisées

Écrire quelle couche peut appeler quelle couche, et le vérifier mécaniquement.
Les interdictions que je reprends des audits, parce qu'elles sont justes et qu'elles nous visent :
`POLICY → orchestration cachée` · `REPORT → mutation d'état` · `OBSERVABILITY → mutation
d'exécution` · `KNOWLEDGE → décision de permission` · `TOOL → implémentation d'un autre TOOL`.
Et la règle générale : **une branche inférieure ne devient pas l'autorité d'une branche supérieure
parce qu'un fichier historique l'importe.**

### A4 — Les sept séparations à PROTÉGER

La rationalisation fusionne ; elle doit aussi **empêcher** des fusions. Les sept, reprises telles
quelles : Tool Usage ≠ KPI · Policy ≠ Check · Simulation ≠ Production · Knowledge ≠ Governance ·
Model Gateway ≠ Domain · Repository ≠ World Domain · **Final Judge ≠ moteur de règles**.

---

## FIL B — LE FREIN

**Destination** : qu'aucun outil nouveau n'agrandisse le problème pendant qu'on le range.

### B1 — Aucun outil neuf sans couche déclarée
`integration-outil` exige déjà un blueprint, une fiche, un registre. Il exigera **la couche**, et
refusera un `inconnu` non justifié. Une ligne, dans un mécanisme qui existe.

### B2 — Le gel des grandes capacités
*« Aucun composant nouveau sans place architecturale explicite »* — c'est le principe n°6 du plan
directeur, et c'est la seule règle de charte que ce chantier me paraît devoir ajouter.
**Je la montrerai avant de l'écrire** (sa borne : « CLAUDE.md est autorisé mais tu me montres
avant »).

---

## FIL C — LA DETTE

**Destination** : que le coût d'entrée d'un outil passe de **dix registres à un**.

*Le paradoxe que ce fil traite, et ses chiffres : vue globale, §4.2. A le décrit ; C le traite.*

### C1 — Les dix registres, mesurés puis dérivés *(tâche #1119)*
Mesurer d'abord **lesquels des dix sont dérivables** du fichier lui-même. Mon hypothèse, à vérifier :
la majorité. Chaque registre dérivé disparaît de la liste à remplir sans rien perdre.
*(Tâches existantes concernées : #814, #823.)*

### C2 — Les 480 lignes de bannière par commit
Un fichier que personne n'ouvre, écrit à chaque commit. Ce n'est pas du volume, c'est du **décor**
au sens de la leçon L6. Décider ce qui reste visible et ce qui se lit à la demande.

### C3 — Les deux outils dormants
`claudius-minimus` et `hyper-scan-checkpoint` : aucun usage hors de leur propre construction. La
question R6 des audits s'applique — *« un outil peut avoir été utile, intelligent, documenté, testé,
et ne plus avoir de raison d'exister. C'est normal. »* **Après la carte**, jamais avant : il faut
d'abord savoir quelle capacité ils portaient.

---

## FIL D — LA PAROLE

**Destination** : qu'il ait ses réponses, et que le PACK DÉCOUVERTE existe — **dérivé**, comme il
l'a tranché.

### D1 — Ses 49 réponses
Un fichier HTML, point par point, en reprenant sa question avant d'y répondre, avec le compte des
questions agrégées. Les questions de marché s'appuient sur la recherche déjà enregistrée.
*(Tâche #1112 pour la liste — faite ; la réponse est le livrable suivant après ce plan.)*

### D2 — Le PACK DÉCOUVERTE, dérivé
- **la LISTE** se dérive du registre des documents, qui existe ;
- **la PRÉSENTATION** se dérive de la carte des capacités + l'organigramme + les KPI ;
- **les deux versions ADMIN / COMMERCIALISABLE** sont **un onzième axe dérivé**, pas 1 140
  étiquettes posées à la main — et un axe dérivé est **rétroactif par construction**, ce qui répond
  exactement à son « avec effet rétroactif ».

### D3 — Les trois stratégies
AGENCE · JEU · PROJET ENTIER. Elles se dérivent en grande partie des chantiers et tâches déjà
ouverts. **Ce qui reste écrit à la main est le peu qui compte : l'objectif, les bornes, les
arbitrages — c'est-à-dire ses décisions.**

---

## 2. CE QUI VIENT APRÈS LA CARTE, et pas avant

Dans cet ordre, qui est celui des audits et que je valide :

1. **Les contrats**, et seulement les nécessaires : `Finding` (le plus utile chez nous — sept
   gardiens rendent sept formats), `Report`, `Tool`, `Task`, puis `ModelGateway` et `Repository`.
2. **Le Transaction Engine** *(tâche #1120)* — *le seul vrai trou de toute l'architecture*. Nous avons des
   garde-fous qui REFUSENT (le filet, les crochets) ; nous n'avons rien qui ANNULE.
   **Je le mets avant les extractions, contre l'ordre proposé par les audits**, parce qu'une
   extraction sans retour arrière est exactement le geste que sa demande de « sauvegarde de
   référence » cherche à couvrir.
3. **Les premières extractions** : `daynight` (14/14 tests de caractérisation déjà passants chez
   l'auditeur), puis `gemini-keys`, puis `relationship`.
4. **`check-house`** transformé en moteur de caractérisation + runner, jamais découpé par taille.
5. **`/api/lia` en DERNIER**, sous la protection de l'Article 0.

### LA LIGNE ROUGE, et elle n'est pas négociable

> **Toute étape qui touche au chemin du dialogue passe par `check-spirit` AVANT et APRÈS, et le
> résultat se LIT.**

📜 Article 0. *La raison — pourquoi les audits ont raison de classer `/api/lia` en risque très élevé
mais pour la mauvaise raison — est au §4.1 de la vue globale.*

---

## 3. LE RACCORD AVEC LA FILE EXISTANTE — réponse à #1114

**54 tâches ouvertes aujourd'hui.** Voici où elles tombent. C'est le lien qui n'existait pas, et il
répond à la crainte exacte de #1114 : *« quand le plan sera écrit, rien ne saura dire quelles tâches
il rend caduques »*.

| Fil | Tâches déjà ouvertes qui y appartiennent |
|---|---|
| **A — LA CARTE** | #745 (fusionner des agents pour réduire l'effectif) · #793 (check-house, un quart de l'outillage) · #705 (découpe d'outil) · #1005 (deux `chargerLesDocuments`) · #902 (export et commercialisation) |
| **B — LE FREIN** | *aucune — le fil est neuf* |
| **C — LA DETTE** | #814 (registres sans lecteur) · #823 (compteur d'usage) · #819 (filet en parts par défaut) · #1053 (compacter les récits fermés) · #1092 (trafic API réel) · #704 (ecotoken) |
| **D — LA PAROLE** | #696 (modèle de gouvernance) · #767 et #790 (charte) · #1067 (recouvrement 18↔26) · #717 (profil utilisateur) |
| **Hors chantier, à garder telles quelles** | #700 · #703 · #679 · #681 · #699 · #708 · #710 · #721 · #725 · #845 · #1019 · #1079 · #1102 · #1113 · #1114 |
| **Reportées après le grand chantier** | les 9 tâches de renommage + la refonte graphique (sa décision du 2026-09-28) |

**Ce que ça change concrètement** : **17 tâches sur 54 sont absorbées par un fil.** Elles ne
disparaissent pas — elles cessent d'être des chantiers indépendants et deviennent des étapes d'un
fil, ce qui les empêche d'être refaites séparément. **C'est exactement ce qu'il voulait éviter :
« tout faire à la file et tout devoir défaire à chaque fois ».**

---

## 4. CE QUE JE NE FERAI PAS, et pourquoi

*Les raisons de chacun de ces refus sont au §6 de la vue globale. Ils sont repris ici sous forme de
liste parce qu'un plan doit pouvoir se lire seul le jour où on l'exécute.*

Pas de taxonomie concurrente · pas de déplacement de fichiers avant la carte · pas d'étiquetage
manuel rétroactif · pas de MCP, d'event bus ni de monorepo à ce stade · pas de suppression d'outil
avant la carte · **pas de renommage** (sa décision : c'est l'étape récompense, après).

---

## 5. L'ORDRE VERROUILLÉ, et il vient de lui

> « Je veux bien une sauvegarde de référence, mais **juste après que tu aies finalisé ton plan
> d'action, avant de commencer quoi que ce soit concrètement** : je garde la trace de où on en est +
> où on se dirige. »

```
   ce plan
      ↓
   ses calibrages (au moins 50 questions, sa demande)
      ↓
   SAUVEGARDE DE RÉFÉRENCE   ← l'étiquette nommée, avec le plan DEDANS
      ↓
   première action concrète (fil A1)
```

**La sauvegarde ne marque plus un état, elle marque un état ET une intention.** Le plan doit être
dedans, sinon la trace dit d'où on part sans dire où on va.

---

## 6. PLAN D'ACTION — les constats de ce document et leur suite (Article 28)

| # | Constat | État | Suite |
|---|---|---|---|
| 1 | Notre classement n'a pas d'axe « couche » — mesuré sur l'axe `type` | **RETENU** | **tâche #1117** — fil A1 |
| 2 | Le BUILD MAP n'existe pas ; le dernier lot l'annonce et ne le livre pas | **RETENU** | **tâche #1118** — fil A2 |
| 3 | Un outil neuf coûte dix registres | **RETENU** | **tâche #1119** — fil C1, absorbe #814 et #823 |
| 4 | Le Transaction Engine est le seul vrai trou de l'architecture | **RETENU** | **tâche #1120**, après la carte |
| 5 | 17 tâches ouvertes sur 54 appartiennent à un fil | **RETENU** | c'est #1114, qui reçoit sa réponse ici |
| 6 | Les chiffres de marché de l'audit : le seul vérifiable l'est, les autres sont des sources secondaires | **ÉCARTÉ comme blocage** | *raison écrite* : ils cadrent, ils ne décident pas. Revérification à la source au moment de répondre à Q9, pas avant |
| 7 | Le positionnement « runtime d'agences » vise le marché le plus disputé de 2026 | **À TRANCHER** | **tâche #1121** — question commerciale, pas technique : elle lui revient (Article 16) |
| 8 | Les deux outils dormants n'ont servi qu'à se construire | **RETENU** | fil C3 de **#1119**, **après** la carte |
| 9 | La ligne rouge `check-spirit` sur tout ce qui touche au dialogue | **RETENU** | inscrite dans **#1116**, s'applique dès la première étape |
