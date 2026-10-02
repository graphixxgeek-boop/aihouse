# LE MODULE « GESTION DES TÂCHES » — description complète

> **DÉCOULE DE :** `docs/philosophie-et-politique.md`
> *le suivi des tâches applique la politique d'amélioration continue : tout constat suit la chaîne
> rapport, analyse, plan, tâche.*

*(Établi le 2026-10-02T06:45Z. Tâche #1443. **Premier module décrit** : sa forme servira aux autres.)*

---

## POURQUOI CE DOCUMENT EXISTE, ET CE QU'IL DOIT PROUVER

Sa phrase d'origine : *« moi-même aujourd'hui je ne sais pas très bien comment tout fonctionne par
module »*. Il a choisi celui-ci comme **échantillon** : si sa description le rend capable de juger
ce module, la même forme appliquée aux autres lui rendra l'Agence lisible.

**LA PREMIÈRE DIFFICULTÉ EST QU'IL N'EXISTE PAS COMME OBJET.** Aucun dossier ne s'appelle ainsi,
aucun script ne le contient. Il est réparti entre un dossier de stockage, trente-quatre scripts
qui le lisent, un garde-fou qui refuse, un crochet git, et deux registres voisins. **Le décrire,
c'est d'abord établir son périmètre** — et ce sera vrai de la plupart des modules.

---

## 1 · CE QUE LE MODULE FAIT — ses fonctionnalités

| # | Fonctionnalité | Ce qu'elle garantit |
|---|---|---|
| **F1** | **Consigner** chaque travail substantiel en une ligne horodatée, dans le commit qui le porte | une décision prise et non écrite se repose d'elle-même à la session suivante |
| **F2** | **Classer** chaque ligne sur onze colonnes : numéro, horodatage, mot-clé, sujet, sous-sujet, sensibilité, destinataire, ouverture, clôture, description, statut | une file sans attributs ne se trie pas, donc ne se priorise pas |
| **F3** | **Refuser** une ligne non conforme, au commit, avant qu'elle n'entre | une file qui accepte tout cesse d'être lisible, et personne ne s'en aperçoit |
| **F4** | **Restituer** l'état réel : ce qui est ouvert, ce qui stagne, ce qui attend qui | la file n'est utile que si elle répond à « où en est-on ? » sans la relire entière |
| **F5** | **Relier** un constat de rapport à la tâche qu'il fait naître, et vérifier que cette tâche existe | une référence morte ressemble à un lien, ce qui est pire qu'une absence |
| **F6** | **Archiver** sans altérer, quand un fichier de session devient trop lourd | le passé se garde entièrement et ne fait jamais autorité |

---

## 2 · COMMENT IL FONCTIONNE

### 2.1 — Le stockage

`docs/suivi/` — **11 fichiers markdown**, dont 6 fichiers de session, 3 index, et un dossier
d'archives. **723 tâches** y sont consignées à ce jour, dont **116 ouvertes**.

Une tâche est **une ligne de tableau markdown à onze colonnes**. Ni base de données, ni JSON : le
format est celui que l'utilisateur peut lire et corriger lui-même, ce qui est une décision et non
une facilité.

### 2.2 — L'écriture, et c'est le fait le plus important de ce document

> **AUCUN SCRIPT N'ÉCRIT DANS `docs/suivi/`. Mesuré : zéro.**

Les trente-quatre scripts qui touchent au suivi le **lisent** tous. Pas un ne l'écrit. **Chaque
ligne est écrite à la main**, par l'agent, dans la conversation.

**CE QUE CETTE ASYMÉTRIE EXPLIQUE, ET QU'ON NE COMPRENDRAIT PAS SANS ELLE** : tous les défauts
constatés sur ce module sont des défauts de SAISIE, jamais de traitement — un horodatage tapé au
lieu d'être lu (cinq fois en deux jours), un caractère de séparation glissé dans une cellule, une
colonne oubliée. **Le module est robuste là où il calcule et fragile là où il reçoit**, ce qui est
l'inverse du défaut habituel.

**ET C'EST UN CHOIX, PAS UN MANQUE** : une ligne de suivi porte un jugement — pourquoi ce travail,
ce qu'il a coûté, ce qu'on en retient. Aucun script ne peut l'écrire sans l'inventer.

### 2.3 — Le refus

`check-suivi-fidelity` applique **seize contrôles** à chaque commit. Les plus mordants :

| Contrôle | Ce qu'il refuse |
|---|---|
| `findHorodatagesFuturs` | une heure postérieure à maintenant — donc tapée, et non lue |
| `findLignesMalFormees` | une ligne dont le compte de colonnes ne tombe pas juste |
| `findUnverifiedClosures` | une clôture sans déclaration de fidélité |
| `findClaimedFilesMissing` | une ligne qui annonce un fichier qui n'existe pas |
| `findCommitsMissingSuiviUpdate` | un commit substantiel sans ligne de suivi |
| `findTachesOuvertesArchivees` | une tâche ouverte enfermée dans une archive |

**Le refus intervient AU COMMIT, jamais après** : une ligne fausse acceptée puis corrigée aurait
déjà été lue par les trente-quatre scripts qui s'en servent.

### 2.4 — La restitution

`check-tasks-details` produit l'état des lieux à la demande : la file ordonnée, les paliers, les
signaux, l'arbre des dépendances, les tâches qui stagnent depuis au moins trois rapports, et les
outils qu'une tâche ouverte devrait solliciter.

---

## 3 · LE SCHÉMA

```
                    L'AGENT, à la main                    L'UTILISATEUR
                           │                                   │
                           │ écrit une ligne                   │ lit, arbitre,
                           │ (11 colonnes)                     │ tranche
                           ▼                                   ▲
   ┌───────────────────────────────────────────┐               │
   │          docs/suivi/   ·  723 lignes      │───────────────┘
   │   sessions · index · archives             │
   └───────────────────────────────────────────┘
          ▲                              │
          │ REFUSE au commit             │ LU par 34 scripts
          │                              │
   ┌──────┴─────────────┐   ┌────────────┴──────────────────────────────┐
   │ check-suivi-       │   │  check-tasks-details  → état des lieux    │
   │ fidelity           │   │  ou-on-en-est         → le chemin parcouru│
   │ 16 contrôles       │   │  circle-tasks         → signal de Ronde   │
   │ + crochet git      │   │  god-of-all-process   → chaîne des constats│
   └────────────────────┘   │  cassandra-rh         → charge de l'équipe│
                            │  … 29 autres                              │
                            └───────────────────────────────────────────┘
```

**CE QUE LE SCHÉMA MONTRE ET QU'UNE LISTE CACHERAIT** : le module a **une seule porte d'entrée
manuelle** et **trente-quatre sorties**. Tout ce qui est faux à l'entrée se propage trente-quatre
fois ; tout ce qui est juste y sert trente-quatre fois. C'est ce rapport-là qui justifie seize
contrôles pour un simple tableau markdown.

---

## 4 · CE QUE LE MODULE PRODUIT

*La partie qu'on oublie toujours : un module se décrit volontiers par ce qu'il fait, rarement par
ce qu'il laisse derrière lui — or c'est ce qu'il laisse qui sert aux autres.*

| Production | Qui la consomme |
|---|---|
| **La file ordonnée** — ce qui est ouvert, par priorité | l'agent, à chaque reprise de session |
| **Le signal de stagnation** — une tâche identique depuis 3 rapports | la Ronde périodique |
| **La preuve qu'un constat est devenu une tâche** | god-of-all-process, qui refuse un plan d'action sans suite |
| **L'historique daté des décisions** | toute recherche « qu'avons-nous décidé sur X ? » |
| **La charge réelle par sujet** | CASSANDRA-RH, pour juger l'équipe d'outils |
| **Le dénominateur des mesures de couverture** | tout rapport qui dit « N tâches sur M » |

---

## 5 · SES INTERACTIONS

| Module voisin | Sens | Nature du lien |
|---|---|---|
| **Les Gardiens Sacrés** | ils → lui | un garde-fou qui mord fait naître une tâche |
| **La Gouvernance Royale** | lui → elle | il fournit le dénominateur de presque toutes ses mesures |
| **Les Prophètes** | les deux sens | ils lisent la file pour trouver ce qui freine, et y déposent leurs constats |
| **Les fils de discussion** | lui ↔ eux | une tâche porte un travail, un fil porte une question : les confondre perd l'un des deux |
| **Le registre des idées à trancher** | lui → lui | une tâche « à trancher » doit exister aux deux endroits, sinon elle est invisible |
| **La Suite Tarantino** | elle → lui | une simulation produit des correctifs à revalider, qui deviennent des tâches |

---

## 6 · CE QUI NE VA PAS, ET QUI SE MESURE

| Constat | Mesure | Gravité |
|---|---|---|
| **116 tâches ouvertes**, dont certaines identiques depuis au moins 3 rapports | mesuré | la file s'allonge plus vite qu'elle ne se vide |
| **La saisie est le seul point faible**, et rien ne l'assiste | 0 script écrivain | chaque ligne est une occasion de se tromper sur onze colonnes |
| **Les contrôles corrigent APRÈS la saisie** | 16 contrôles, tous en lecture | ils refusent le commit, ils n'aident pas à écrire juste |

**LA CORRECTION QUE CES TROIS CONSTATS APPELLENT N'EST PAS UN CONTRÔLE DE PLUS.** Seize contrôles
en lecture disent déjà tout ce qui peut être dit après coup. Ce qui manque est à l'autre bout :
**un assistant de SAISIE** — qui compose la ligne, substitue l'heure lue, compte les colonnes et
échappe les séparateurs. Le même raisonnement que pour l'heure : on ne corrige pas une recopie, on
la rend impossible.

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Suite |
|---|---|---|
| Le module n'existait comme objet décrit nulle part | **RETENU** | ce document — tâche #1443 |
| Aucun script n'écrit dans le suivi : la saisie manuelle est le seul point faible | **RETENU** | tâche #1447 — un assistant de saisie, jamais un contrôle de plus |
| 116 tâches ouvertes, dont plusieurs stagnent depuis 3 rapports | **À TRANCHER** | la file se vide par décision, pas par outil |
| La forme de ce document servira aux autres modules | **RETENU** | elle est reprise telle quelle pour le module suivant |
