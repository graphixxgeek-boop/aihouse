# Les décisions qui t'attendent — la liste vivante

> **Pourquoi ce document existe, et pourquoi il remplace les deux précédents.** Tu en as déjà reçu
> deux aujourd'hui, du 29 et du 30 septembre. **Les deux étaient périmés avant que tu les lises** :
> quatorze décisions nouvelles sont nées depuis, dont sept aujourd'hui.
> **Un document de décisions se périme par construction, à chaque tâche ouverte.**
> Celui-ci se **régénère** : `node scripts/check-tasks-details.mjs decisions`. **Tâche :** #1500.

---

## LE CHIFFRE, ET IL EST PLUS LOURD QUE PRÉVU

**76 décisions t'attendent, sur 162 tâches ouvertes.**
**La plus ancienne attend depuis le 22 septembre — onze jours.**

Ce n'est pas la même chose que « 76 tâches en retard ». Ce sont 76 points où **le travail s'arrête
tant que tu n'as pas répondu**, et aucun ne se débloquera tout seul.

### Comment elles sont repérées, parce que le critère compte

Je n'ai inventé aucun critère pour ce document. Il lit **trois signaux déjà déclarés** dans le
suivi :

| Signal | Combien | Ce qu'il veut dire |
|---|---|---|
| le **statut** dit qu'elle attend | 43 | « à trancher », « en attente », « nécessite sa présence » |
| le champ **pour qui** vaut « dette envers l'utilisateur » | 17 | je te dois une réponse |
| la **criticité** vaut « à trancher » | 16 | la décision te revient explicitement |

**Sa limite, dite d'emblée** : il lit ce qu'une ligne **déclare**. Une tâche qui attend ta décision
sans le dire dans l'un des trois signaux lui reste invisible. **J'en ai corrigé sept aujourd'hui**
— elles annonçaient « À TRANCHER » dans leur plan d'action et portaient le statut « Ouverte », donc
le détecteur ne les voyait pas. C'est exactement l'écart qu'une référence morte produit.

---

## CE QUE LA RÉPARTITION DANS LE TEMPS RACONTE

| Quand | Combien |
|---|---|
| **28 septembre** | **23** — le jour de ta COMMANDE IMPORTANTE |
| 2 octobre *(aujourd'hui)* | 14 |
| 29 septembre | 13 |
| 25 septembre | 10 |
| 1er octobre | 7 |
| les six autres jours | 9 |

**19 décisions sont antérieures au grand changement, 57 lui sont postérieures.** Autrement dit :
les trois quarts de ce qui t'attend est né en cinq jours, et c'est cohérent — un grand chantier
produit des arbitrages plus vite qu'il ne produit du code.

**Les 19 plus anciennes sont le vrai sujet d'inquiétude.** Elles ne concernent pas le grand
changement, elles attendent depuis une à deux semaines, et plusieurs portent sur le renommage —
que tu as explicitement mis en pause. Ce sont peut-être des décisions **à écarter**, pas à prendre.

---

## PAR THÈME, POUR QUE TU CHOISISSES PAR OÙ COMMENCER

| Combien | Thème | Ce que ça débloque |
|---|---|---|
| **28** | Projet | le grand changement — c'est le goulot |
| 8 | Outillage | des outils qui attendent un arbitrage |
| **7** | Nommage | **en pause sur ta décision** — probablement à écarter en bloc |
| 6 | Process | la Ronde, le mode auto |
| 4 | Charte | dont le quatrième mot d'ordre |
| 3 + 3 + 3 | Organisation, Suivi, Agence | |
| 2 + 2 | Données, Export | |

**Mon conseil, et c'est un conseil, pas une mesure :**

**① Commence par écarter les 7 du Nommage.** Tu as dit « le renommage est une étape sensible que
je ne veux pas infliger au code pendant un chantier complexe ». Si cette décision tient, les sept
peuvent être écartées d'un mot — et ÉCARTER est une décision pleine et entière, pas un abandon.

**② Puis les 4 décisions de l'étage 2** identifiées dans l'état des lieux : #1127, #1137, #1138,
#1141. Elles débloquent quinze des vingt-huit du thème « Projet ».

**③ Le reste peut attendre.** Aucune des autres n'a d'effet de cascade.

---

## LA LISTE COMPLÈTE, DE LA PLUS ANCIENNE À LA PLUS RÉCENTE

*(Triée par âge, et ce n'est pas cosmétique : une décision qui attend depuis onze jours bloque plus
de travail en aval qu'une née ce matin.)*

| # | Depuis | Ce qui attend ta réponse |
|---|---|---|
| **#390** | 09-22 | Outillage / badge |
| **#603** | 09-23 | Process / conduite |
| **#636** | 09-23 | Organisation / vocabulaire (chantier #208) |
| **#733** | 09-24 | Nommage / les séries d'hommages |
| **#740** | 09-24 | Nommage / booster l'agent des noms : TOUS les impacts d'un renommage en série |
| **#747** | 09-24 | Nommage / la nomenclature : un code de classe dans le nom |
| **#767** | 09-25 | Charte / quelles autres règles à fort levier manquent ? |
| **#768** | 09-25 | Nommage / l'outil de renommage PUISSANT, avec recherches web |
| **#775** | 09-25 | Nommage / les deux collisions réelles à trancher avec lui (`PALIERS`, `recordOutcome`) |
| **#814** | 09-25 | Données / les registres restants : brancher un lecteur, ou déclarer l'absence assumée ? |
| **#819** | 09-25 | Filet / trois options chiffrées : ne rien faire, regarder les 3 plus lents, ou un mode rapide |
| **#823** | 09-25 | Compteur d'usage / la cause racine prise par son bout d'ÉCRITURE — et le garde-fou est tombé deux fois dans ce qu'il tra |
| **#830** | 09-25 | Idées / « un outil qui vérifie la logique et les trous PARTOUT » — la question posée il y a quatre jours, restée sans ré |
| **#842** | 09-25 | Ronde / « rentabiliser les trouvailles » : l'outil qui mesure ça existe, et son verdict est net — le registre grossit sa |
| **#845** | 09-25 | File / les 5 plus anciennes tâches encore ouvertes, présentées pour arbitrage |
| **#861** | 09-25 | Refonte graphique / son idée SQUID GAME vivait au suivi et nulle part dans le document de son chantier |
| **#929** | 09-26 | Nommage / un seul script, DEUX identités : `check-spirit` et `check-spirit-mjs` — et c'est un renommage, donc SA décisio |
| **#988** | 09-27 | Nommage / le registre des baptêmes : trois décisions prises, application REPORTÉE à sa demande |
| **#1020** | 09-27 | Process / présenter les 75 noms en service que l'utilisateur n'a jamais validés |
| **#1067** | 09-28 | Charte / Articles 18 et 26 se recouvrent à 19 % sans que rien ne dise lequel prime |
| **#1079** | 09-28 | Suivi / un commit de SUITE compte-t-il comme « sans mise à jour du suivi » ? — et le commit accusé est le mien |
| **#1092** | 09-28 | Conso / personne n'enregistre le trafic API réel — le registre que Smart Conso lit ne voit que des sondages |
| **#1104** | 09-28 | Agence / le trou de couverture documentaire : 82 % des documents n'appartenaient au périmètre de personne |
| **#1105** | 09-28 | Agence / le RETENU oublié de ma propre fiche de recherche — et le sixième faux chiffre |
| **#1125** | 09-28 | Projet / la COUVERTURE de sa demande — la preuve que rien n'est oublié, mesurée et non promise |
| **#1126** | 09-28 | Projet / le BUDGET D'OBLIGATIONS — aucune obligation nouvelle sans une obligation retirée |
| **#1127** | 09-28 | Projet / le DOCUMENT MAÎTRE de stratégie globale, et qui le porte |
| **#1128** | 09-28 | Projet / l'axe STRATÉGIE sur les tâches et sur la classification |
| **#1129** | 09-28 | Projet / les DEUX règles de travail qu'il a posées et que rien ne porte |
| **#1130** | 09-28 | Projet / la DYNAMIQUE D'ESCALADE tâches ↔ stratégie ↔ philosophie, et sa FIABILISATION |
| **#1131** | 09-28 | Projet / l'outil qui RÉAGIT quand quelque chose est fait à l'envers de la stratégie |
| **#1132** | 09-28 | Projet / les TROIS BORNES qui diront « l'agence est terminée » |
| **#1133** | 09-28 | Projet / la PASSE GÉNÉRALE : objectifs, KPI et RH alignés sur les stratégies |
| **#1134** | 09-28 | Projet / adapter la CHARTE, les RÈGLES DE TRAVAIL, le RÉFÉRENTIEL et les PROCESS |
| **#1135** | 09-28 | Projet / réorganiser les fichiers de STRATÉGIES et de NOTES |
| **#1136** | 09-28 | Projet / le PACK DÉCOUVERTE, dérivé — et le SYSTÈME qui le livre |
| **#1137** | 09-28 | Projet / la STRATÉGIE DU JEU — la troisième partie de sa commande, jamais écrite |
| **#1138** | 09-28 | Projet / les DEUX stratégies globales séparées — avec les deux projets, et comme s'il n'y en avait qu'un |
| **#1139** | 09-28 | Projet / le CHANTIER FINALISATION — sauvegarder la version complète, migrer vers une version light |
| **#1140** | 09-28 | Projet / la version de l'Agence AVEC ou SANS les parties analyse-simulation |
| **#1141** | 09-28 | Projet / l'ORDRE remis d'aplomb : calibrage → stratégie → plan → tâches — et le garde-fou qui l'avait inversé |
| **#1144** | 09-28 | Projet / le BUT ULTIME porté par Philo et Politique : défini ? bien défini ? conforme à notre direction ? |
| **#1149** | 09-29 | Projet / LE CHEMIN : sept étapes ordonnées par dépendance, à la place de sept fils parallèles |
| **#1150** | 09-29 | Suivi / 109 tâches ouvertes sur 97 thèmes : une file aussi fragmentée ne se priorise pas |
| **#1151** | 09-29 | Projet / les 50 questions de calibrage, groupées par étage de l'escalade |
| **#1154** | 09-29 | Agence / le CONTRAT DE RÉCEPTACLE : comment l'acheteur ajoute ses propres outils sans casser les nôtres |
| **#1156** | 09-29 | Charte / deux Articles proposés — L'ESCALADE et L'ALIGNEMENT — écrits en entier, et NON appliqués |
| **#1163** | 09-29 | Projet / les décisions qui l'attendent, présentées par lots — et une dont la réponse a changé |
| **#1165** | 09-29 | Process / un réveil qui ment, pendant six heures — et la leçon qui devait l'empêcher existait déjà |
| **#1169** | 09-29 | Documentation / cinq frontières de documents jumeaux en une nuit : mes fiches sont trop longues |
| **#1170** | 09-29 | Suivi / le garde-fou des statuts ne lit pas les archives — et il dit vrai sur un périmètre plus étroit qu'on ne le lit |
| **#1175** | 09-29 | Outillage / deux motifs de numéro de tâche dans le MÊME fichier, qui ne s'accordent ni en bas ni en haut de l'échelle |
| **#1192** | 09-29 | Données / faut-il SUIVRE dans le temps la couverture des outils, maintenant qu'elle se mesure ? |
| **#1193** | 09-29 | Outillage / le détecteur de documents jumeaux rapproche ce que J'ÉCRIS, pas ce que les documents DISENT — et chaque expl |
| **#1197** | 09-29 | Process / l'estimation de la Ronde s'applique-t-elle à une Ronde AUTONOME, que personne n'attend ? |
| **#1362** | 10-01 | Projet / les TROIS BORNES de « l'agence est terminée » enfin proposées — sa commande #1132, ouverte depuis le 28 septemb |
| **#1409** | 10-01 | Outillage / 33 preuves d'étape sur 45 ne peuvent JAMAIS échouer — et le constat pointait vers une tâche CLOSE depuis cet |
| **#1417** | 10-01 | Projet / les 30 questions de cadrage philo & politique — et les deux familles de son cadre auxquelles le dépôt n'a JAMAI |
| **#1419** | 10-01 | Projet / la philosophie du projet RÉVÉLÉE : 29 principes extraits de 5 843 convictions, trois niveaux, et une seule case |
| **#1420** | 10-01 | Organisation / la CARTE CIBLE de l'organisation par modules — sa demande n'était consignée NULLE PART, et c'est lui qui  |
| **#1421** | 10-01 | Organisation / qui PORTE chaque stratégie, et le marqueur de stratégie sur chaque tâche — seconde demande du Word jamais |
| **#1425** | 10-01 | Projet / les 30 questions réécrites : plus un questionnaire philosophique, seulement les arbitrages qui ferment le docum |
| **#1440** | 10-02 | Projet / lui répondre sur son prompt Word : les cartes par module, et toutes les questions restées sans réponse |
| **#1478** | 10-02 | Projet / l'arborescence des tâches du GRAND PROJET n'existe pas, et l'état des lieux en dépend |
| **#1482** | 10-02 | Stratégie / les trois stratégies globales, en HTML, hybrides, chacune portant son plan d'action |
| **#1483** | 10-02 | Process / le système de fils : il ne se remplit plus, et l'outil qui le surveille dit que tout va bien |
| **#1487** | 10-02 | Charte / le quatrième mot d'ordre INTELLIGENT manque à la boussole, et je ne peux pas l'y mettre seul |
| **#1488** | 10-02 | Outillage / détecter l'ORDRE des événements : à moitié en place, pour un seul cas |
| **#1489** | 10-02 | Outillage / `the-king tension` ne lit qu'un seul document, alors que deux textes font loi |
| **#1492** | 10-02 | Export / « verrouiller le code » : trois sens très différents, et il faut en choisir un |
| **#1493** | 10-02 | Export / trois règles de conduite n'ont pour source qu'une conversation — leur écrire un domicile, ou les laisser mourir |
| **#1495** | 10-02 | Projet / le jeu pèse 3 % de la file ouverte — décision assumée, ou dérive à corriger ? |
| **#1496** | 10-02 | Outillage / six bibliothèques et quatre outils d environnement portent un kit d outil — 40 fichiers pour rien ? |
| **#1497** | 10-02 | Outillage / quinze outils pourraient devenir une extension — à instruire un par un, jamais en bloc |
| **#1498** | 10-02 | Circulation / 26 documents écrits pour lui et jamais livrés — comment les lui rendre ? |
| **#1499** | 10-02 | Process / les 5 Routines sont attachées à cette session : aucune ne peut le joindre, et la veille tombera dans le vide |
---

# PLAN D'ACTION

| État | Constat | Suite |
|---|---|---|
| ✅ FAIT | la liste est devenue une COMMANDE, donc elle ne se périmera plus | #1500 |
| ✅ CORRIGÉ | 7 tâches annonçaient « À TRANCHER » sans porter le signal : le détecteur ne les voyait pas | #1500 |
| ? À TRANCHER | **les 7 décisions de Nommage : les écarter en bloc ?** (une seule réponse) | #1500 |
| ? À TRANCHER | les 4 décisions de l'étage 2, qui en débloquent 15 | #1127, #1137, #1138, #1141 |
| ⏳ À INSTRUIRE | les 19 décisions antérieures au 28 septembre : encore d'actualité, ou périmées ? | #1500 |
