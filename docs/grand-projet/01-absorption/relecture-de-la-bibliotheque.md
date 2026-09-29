# LA RELECTURE DE LA BIBLIOTHÈQUE — ses quatre questions, et ce qu'elles ont sorti

*(Nuit du 2026-09-29 au 30, heure LUE, source système. Tâche **#1256**.
Sa consigne du coucher, mot pour mot : « prends le temps aussi de faire — juste pour l'exercice —
la synthèse/relecture des docs dans git : une relecture rafraîchit. Pose-toi la question : avec ma
compréhension actuelle du projet, qu'est-ce que j'ai pu ne pas voir d'intéressant à ma première
lecture ? qu'est-ce que j'ai manqué ? qu'est-ce que je peux encore tirer de ces docs ? est-ce que
je maîtrise cette bibliothèque, et je sais parfaitement qu'est-ce qui va m'aider, et quand m'en
servir ? »)*

> **DÉCOULE DE :** `docs/grand-projet/03-plan-daction/ou-va-chaque-chose.md`
> *il exécute la consigne ③ du bloc « SES CONSIGNES DU 2026-09-29 AU COUCHER ».*

---

## AVANT TOUT : UNE ALARME QUE J'AI SONNÉE, ET QUI ÉTAIT FAUSSE

**En ouvrant l'exercice, j'ai compté six synthèses pour une trentaine de fichiers déposés et j'ai
conclu que je n'avais lu qu'un cinquième de sa bibliothèque.** C'était faux, et j'ai vérifié avant
de l'écrire.

`ce-que-jai-lu.md` porte **dix blocs de trace, tous datés du 2026-09-28**, et ils couvrent la
totalité du corpus. Les six synthèses ne concernent que les six documents Copilot du 29, arrivés
après. **La bibliothèque est lue.**

**Je le raconte plutôt que de l'effacer**, parce que c'est la troisième fois de la soirée que la
même faute se présente : *un signal ADJACENT — « il n'y a que six synthèses » — lu comme le signal
visé — « je n'ai lu que six documents ».* La règle #767 s'applique à moi avant tout le monde.

---

## ① CE QUE JE N'AVAIS PAS VU À LA PREMIÈRE LECTURE — et c'est gênant

**La TARGET ARCHITECTURE répond déjà à la question « plusieurs versions ? », autrement et mieux
que ma réponse de ce soir.**

Ce soir, j'ai proposé **trois versions par niveau d'exigence** (légère / standard / complète), en
m'appuyant sur les freins mesurés. Le document, lui, propose une **échelle R0→R6 par COMPOSANT** :

```
R0 inconnu → R1 compris → R2 frontière isolée → R3 extractible
           → R4 exportable → R5 industrialisé → R6 produit distribué
```

**Ce ne sont pas deux réponses à la même question, et c'est ce qui rend la trouvaille utile.** La
mienne découpe **le produit** ; la sienne mesure **la maturité de chaque morceau**. Les deux se
combinent : une version « légère » est un ensemble de composants **R4 ou plus**, et le reste ne
peut pas partir. **Ma proposition était incomplète sans savoir ce qui est réellement prêt.**

**Et j'ai construit la mienne sans rouvrir la sienne, trois heures plus tôt dans la même nuit.**
C'est exactement ce que l'Article 30 existe pour empêcher. L'Article a fonctionné — il m'a fait
rouvrir les notes — mais avec trois heures de retard sur le moment où ça comptait.

## ② CE QUE J'AI MANQUÉ — quatre phrases qui jugent notre travail de ce soir

**Elles étaient dans mes propres traces. Je ne les avais pas lues comme des verdicts sur nous.**

**⓵ *« Un fichier séparé n'est pas automatiquement un module R3 ou R4. »***
→ **Ça vise directement notre manifeste.** Nos trois zones (74 noyau / 9 produit / 10 câblage) sont
mesurées **par FICHIER**. Le document dit que la séparation en fichiers ne prouve pas
l'extractibilité. **Notre mesure pourrait donc compter la bonne chose au mauvais endroit** — et
c'est vérifiable, pas une inquiétude : il suffit de prendre trois fichiers « noyau » et d'essayer.

**⓶ *« Le plus grand danger n'est pas de manquer de fonctionnalités. C'est de continuer à en
ajouter AVANT que les nouvelles fonctionnalités aient une place architecturale explicite. »***
→ **Cette nuit j'ai ajouté** une fonction de zone, un dossier de registre, une famille de thème,
un poids par champ. **Chacun justifié individuellement.** C'est mot pour mot la « somme que
personne ne discute » que JESUS mesure de son côté — **deux sources indépendantes, même verdict**.

**⓷ *« Un guardian ne doit pas devenir un orchestrateur caché »*, et *« Quality, Observability et
Governance ne doivent pas devenir un second cœur caché. »***
→ **C'est déjà arrivé, et c'est mesuré** : `check-house.mjs` pèse **4,3 fois le jeu entier**. Le
filet de sécurité EST le second cœur caché contre lequel le document met en garde.

**⓸ La colonne « ne doit PAS posséder » de la RESPONSIBILITY MAP.**
→ Elle dit ce qu'il faut **retirer**, pas seulement ranger. Et elle donne une **route indépendante
vers la cible de 50 obligations** : « Quality ne doit pas posséder l'orchestration principale »,
« Knowledge ne doit pas posséder l'autorité de décision ». **Deux chemins différents vers le même
allègement valent mieux qu'une conviction** — le premier est celui d'ABRAHAM ce soir.

## ③ CE QU'ON PEUT ENCORE TIRER DE CES DOCUMENTS — une chose, et elle est nommée

**Le document annonce lui-même sa suite, et il dit qu'elle n'existe pas :**

> Le **BUILD MAP** : origine historique · nouveau nom · responsabilité exacte · contrat ·
> dépendances entrantes et sortantes · niveau R0-R6 · ordre de migration · tests à créer ·
> critères de sortie — pour chaque composant.
> **« C'est le document qui n'existe pas encore, et c'est celui qui permettrait de commencer. »**

**Nous avons passé la soirée à écrire des documents de stratégie pendant que le seul document
explicitement désigné comme la clé manquante attendait.** Ce n'est pas un reproche à qui que ce
soit — c'est le résultat de l'exercice qu'il a demandé, et c'est sa trouvaille la plus concrète.

**Et il y a une bonne nouvelle dedans** : une grande partie des colonnes du BUILD MAP est déjà
mesurable par nos outils. Le nom, l'origine, les dépendances, les tests, la couverture — SAFE-EXPORT,
AXA-CHECK, HARMONIA et LE-CLASSIFICATEUR les produisent déjà. **Ce qui manque est le niveau R0-R6
et l'ordre de migration**, c'est-à-dire du jugement, pas de la mesure.

## ④ EST-CE QUE JE MAÎTRISE CETTE BIBLIOTHÈQUE ? — la réponse est NON, et elle se chiffre

**C'est la seule des quatre questions qui mesure quelque chose, et voici la mesure.**

| | |
|---|---|
| Documents **lus et tracés** | **10 blocs** dans `ce-que-jai-lu.md` (~950 lignes) |
| Documents **rangés dans l'index par situation** | **6** — ceux du 29 uniquement |
| Documents atteignables **par la question qu'on se pose** | **6 sur 16** |

**Le trou n'est pas la LECTURE, c'est la RÉCUPÉRATION.** Quand je travaille, la question n'est
jamais « que dit le document sur l'architecture ? » mais « je définis les versions du produit,
qu'est-ce qui existe déjà là-dessus ? ». L'index par situation répond à celle-là — **pour six
documents sur seize.**

**Et la preuve que ça coûte vraiment quelque chose est dans ce document même** : la trouvaille ①
vient d'un document qui n'est PAS dans l'index. Je ne l'ai pas retrouvée en travaillant ce soir ;
je l'ai retrouvée parce qu'il m'a demandé de relire. **Un savoir qu'on ne retrouve que sur demande
expresse n'est pas maîtrisé.**

**La réparation est petite et elle est nommée** : étendre l'index par situation aux dix blocs de
`ce-que-jai-lu.md`. L'outil existe (`data-archangel syntheses`), il lit déjà un dossier de fiches ;
il faut lui apprendre à lire aussi un document à blocs.

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Ce qu'il devient |
|---|---|---|
| La relecture avec la compréhension d'aujourd'hui, et ses quatre trouvailles | **RETENU** | tâche **#1256** — ce document |
| L'index par situation ne couvre que 6 documents sur 16 : le savoir est lu mais non récupérable | **RETENU** | tâche **#1257** — étendre `data-archangel syntheses` aux blocs de `ce-que-jai-lu.md` |
| Le BUILD MAP est désigné comme la clé manquante, et n'existe toujours pas | **À TRANCHER** | c'est un gros chantier et il touche l'ordre des étapes : à porter à la séance sur l'objectif ultime, jamais lancé de ma propre initiative |
| Nos trois zones sont mesurées par FICHIER, et « un fichier séparé n'est pas un module extractible » | **À TRANCHER** | vérifiable en une heure : prendre trois fichiers « noyau » et essayer de les sortir. Mais le résultat peut invalider le manifeste, donc c'est sa décision de l'ouvrir |
| « Un guardian ne doit pas devenir un orchestrateur caché » — c'est déjà arrivé | **RETENU** | rejoint `ce-qui-ralentit-le-projet.md`, tâche **#1251** : c'est le même constat que « ce qui se subit », vu par un troisième chemin |
| L'échelle R0→R6 croise notre découpe par niveau d'exigence | **RETENU** | rejoint `ce-qui-ralentit-le-projet.md`, tâche **#1251** — la proposition des trois versions y est amendée, jamais laissée fausse |
| Ma fausse alarme sur « six documents lus sur trente » | **ÉCARTÉ, avec sa raison** | corrigée avant d'être écrite ailleurs, donc sans conséquence — mais racontée plutôt qu'effacée, parce que c'est la troisième occurrence de la même classe d'erreur dans la soirée et que la classe compte plus que l'occurrence (L37) |
