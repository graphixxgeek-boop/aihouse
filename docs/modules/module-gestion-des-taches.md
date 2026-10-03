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

## 0 · LE PÉRIMÈTRE — ce que ce module couvre, et où il s'arrête

*(Section ajoutée le 2026-10-03, tâche #1541, sur sa demande P48 : le périmètre se lit AVANT les
fonctionnalités — après, le lecteur s'est déjà fait une idée.)*

**DEDANS, et c'est exhaustif** : le dossier `docs/suivi/` (sessions, index, archives) · la ligne de
tâche et ses onze colonnes · la numérotation durable · les statuts et leur normalisation · la
criticité à six paliers · les contrôles de fidélité du suivi · la file ordonnée et sa restitution.

**DEHORS, avec la raison** :

| Ce qui est dehors | Pourquoi |
|---|---|
| Le gestionnaire de tâches de la session | il est propre à l'éditeur et meurt avec la session : ce n'est jamais une source de vérité durable |
| Les fils de discussion | un fil porte une QUESTION dans la durée, une tâche porte un TRAVAIL ; les confondre perd l'un des deux |
| Le registre des idées à trancher | une idée n'est pas encore une tâche, et la transformer trop tôt fabrique du travail non décidé |
| Les plans de nuit et les rapports | ils RACONTENT ce qui a été fait, le suivi ENREGISTRE ce qui est à faire |
| Le KPI et les objectifs chiffrés | ils comptent au-dessus de la file, ils ne la tiennent pas |

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

## 6 · SA CLASSE — détachable, ou non

*(Section ajoutée le 2026-10-03, tâche #1541, sur sa demande P48, et elle découle de sa définition
du même jour : la partie INDÉTACHABLE est ce que toute prestation réclame quoi qu'il arrive.)*

**Verdict : INDÉTACHABLE.** Et ce n'est pas un avis, c'est une mesure : 22 scripts du dépôt lisent
`docs/suivi/`, soit un sur quatre de tout l'outillage. Les retirer tous pour détacher ce module
reviendrait à démonter l'Agence ; le retirer en le laissant reviendrait à casser 22 outils d'un
coup. C'est la définition même d'une pièce qu'on ne détache pas.

**CE QUE ÇA IMPOSE POUR L'EXPORT** : ce module part toujours, même dans la plus petite version de
l'Agence. Il appartient au CŒUR au sens de sa définition — le centre de la partie indétachable.

---

## 7 · POURRAIT-IL ÊTRE VENDU SEUL ?

*(Section ajoutée le 2026-10-03, tâche #1541, sur sa demande P48. Distincte de la précédente : un
module détachable n'est pas forcément vendable seul, et l'inverse est vrai aussi.)*

**Réponse : OUI, et c'est le candidat le plus crédible du parc.** Ce qu'il vend n'est pas un
logiciel mais une DISCIPLINE — un format de ligne à onze colonnes, une numérotation qui ne se
casse pas, seize contrôles qui refusent une clôture incomplète, et une file ordonnée par coût
d'attente. Rien là-dedans ne connaît Lia, Noé, ni ce projet.

**QUI L'ACHÈTERAIT** : quiconque fait travailler une IA sur la durée et perd la trace de ce qui a
été décidé. C'est exactement le problème que ce projet a rencontré le 30 septembre en perdant une
session.

**CE QUI MANQUE AUJOURD'HUI POUR LE VENDRE** : rien n'assiste la SAISIE (voir section 9), et c'est
la seule chose qu'un acheteur verrait en premier.

---

## 8 · LE TABLEAU EXHAUSTIF DES SCRIPTS

*(Section ajoutée le 2026-10-03, tâche #1541, sur sa demande P48. **Ce tableau est GÉNÉRÉ** par
`node -e "import('./scripts/doc-report.mjs').then(d => console.log(d.formatTableauDesScriptsLines(d.tableauDesScriptsQuiLisent('docs/suivi')).join('\n')))"`
— l'écrire à la main serait vingt-deux lignes périmées au prochain outil, Article 24.)*

**UNE CORRECTION AU PASSAGE, ET ELLE PORTE SUR CE DOCUMENT** : la section 3 annonçait « 34
scripts ». La mesure réelle en donne **22**. Les douze autres citent `docs/suivi/` dans un
COMMENTAIRE ou un message, jamais dans une lecture — et une mention n'est pas un lien. Le chiffre
de 34 venait d'une recherche textuelle, pas d'une mesure.

**22 scripts lisent `docs/suivi`**, dont 20 déposent un rapport dans leur propre registre.

| Script | Ce qu'il LIT | À quoi il sert | Produit-il un rapport ? |
|---|---|---|---|
| `agent-des-noms` | `docs/suivi/` | Renommer un outil, un process, une constante ou un rapport, préparer un renommage et traiter une collision de noms homonymes, sans casser le code ni falsifier l'histoire | oui, `docs/agent-des-noms/` |
| `angel-of-ia-process` | `docs/suivi/sessions` | Savoir si les règles de travail ont été respectées, et par qui | oui, `docs/angel-of-ia-process/` |
| `cassandra-rh` | `docs/suivi/sessions` | Savoir quels outils stagnent, échouent ou n'ont jamais servi, et qui doit en répondre | oui, `docs/cassandra-rh/` |
| `check-house` | `docs/suivi/sessions/x.md` · `docs/suivi/sessions/s.md` · `docs/suivi/sessions` · +7 | **aucune prestation ne le mentionne** | oui, `docs/check-house/` |
| `check-suivi-fidelity` | `docs/suivi/sessions` · `docs/suivi/archives` · `docs/suivi/` | Vérifier que le suivi des tâches dit la vérité — clôtures incomplètes, fichiers fantômes, dates impossibles | oui, `docs/check-suivi-fidelity/` |
| `check-tasks-details` | `docs/suivi/sessions` · `docs/suivi/relectures-lourdes/` · `docs/suivi/archives` · +1 | Savoir si une tâche est trop grosse et doit être découpée en plusieurs avant d'être lancée, et d'où vient le travail en file | oui, `docs/check-tasks-details/` |
| `circle-tasks` | `docs/suivi/` · `docs/suivi/relectures-lourdes/` · `docs/suivi-open-tasks/` · +1 | Lancer la ronde périodique des tâches gratuites mal automatisées | oui, `docs/circle-tasks/` |
| `data-archangel` | `docs/suivi/sessions` · `docs/suivi` · `docs/suivi/` | Savoir ce que l'équipe sait déjà sur un sujet, ou repérer une donnée produite que rien n'exploite | oui, `docs/data-archangel/` |
| `doc-report` | `docs/suivi/` · `docs/suivi/relectures-lourdes/` · `docs/suivi-open-tasks/` · +1 | Vérifier que chaque outil livre ses rapports comme prévu (décision HTML/texte, fraîcheur, usage réel) | oui, `docs/doc-report/` |
| `ecotoken` | `docs/suivi/sessions` | Mesurer et réduire le poids et le coût en tokens de la charte CLAUDE.md, le seul document rechargé à chaque message | oui, `docs/ecotoken/` |
| `fils-de-discussion` | `docs/suivi` | Savoir si je suis à jour sur tous ses sujets, et ce qui attend une réponse de qui | non |
| `god-of-all-process` | `docs/suivi/index.md` · `docs/suivi/sessions/` · `docs/suivi/sessions` | Savoir quel process encadre ce que je m'apprête à faire, et où on en est dedans | oui, `docs/god-of-all-process/` |
| `hyper-scan-checkpoint` | `docs/suivi/index.md` · `docs/suivi/` | Chasse aux bugs cachés avant une étape importante | oui, `docs/hyper-scan-checkpoint/` |
| `jesus-le-sauveur` | `docs/suivi/sessions` · `docs/suivi` | Savoir pourquoi le projet ralentit, avant un gros chantier ou quand quelque chose traîne sans qu'on sache quoi | oui, `docs/jesus-le-sauveur/` |
| `le-classificateur` | `docs/suivi/` | Savoir ce qu'est un fichier de l'outillage, quel rang il porte et ce qu'il doit — ou régénérer le document officiel de classification | oui, `docs/le-classificateur/` |
| `le-coordinateur` | `docs/suivi/relectures-lourdes/index.md` | Lancer d'un coup toutes les vérifications gratuites du dépôt et voir le réseau d'un seul coup d'œil | oui, `docs/le-coordinateur/` |
| `lib-shell` | `docs/suivi/sessions` | **aucune prestation ne le mentionne** | non |
| `moise-tables-de-loi` | `docs/suivi/sessions` | Analyser la charte du projet en profondeur, ou préparer une décision qui la touche | oui, `docs/moise-tables-de-loi/` |
| `ou-on-en-est` | `docs/suivi/` · `docs/suivi/sessions` | Savoir où on en est | oui, `docs/ou-on-en-est/` |
| `smart-conso-token` | `docs/suivi/relectures-lourdes/index.md` | Réguler ma propre consommation de tokens avant une action coûteuse | oui, `docs/smart-conso-token/` |
| `the-king` | `docs/suivi/sessions` | Vérifier qu'une décision de fond respecte la philosophie et la politique du projet | oui, `docs/the-king/` |
| `tool-learning` | `docs/suivi/sessions` · `docs/suivi/` | Apprentissage réel de l'outillage, et mon apport à cet apprentissage | oui, `docs/tool-learning/` |

⚠️ 2 script(s) lisent cette donnée sans qu'aucune offre du catalogue ne les mentionne : `check-house` · `lib-shell`. Personne ne sait donc les demander.

---

## 9 · CE QUI NE VA PAS, ET QUI SE MESURE

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
