# INDEX PAR SITUATION — où trouver quoi, au moment où j'en ai besoin

<!-- RÉGIME AUTO — ce fichier est régénéré EN ENTIER par
     `node scripts/data-archangel.mjs syntheses` : toute note écrite à la main y sera perdue. -->

> **Ce document est POUR MOI.** Il ne se lit pas en entier : il se balaie pour trouver la ligne
> qui correspond à ce que je suis en train de faire, puis on saute à l'ancre.

**Le trou qu'il ferme.** Six synthèses annotées, c'est six fichiers à choisir avant de pouvoir
lire. Au moment du travail, la question n'est jamais « que dit le document sur l'architecture ? »
mais « je définis la philosophie — **qu'est-ce qui existe là-dessus ?** ». Cet index répond à
celle-là : il récolte la question **(c) quand j'en aurai besoin** des 29 idées annotées.

**Il LIT les synthèses, il ne les recopie pas** (Article 24) : une fiche corrigée demain change
cet index sans que personne y pense.

> **FRONTIÈRE DÉCLARÉE avec les six fiches qu'il indexe** *(2026-09-30)*. Cet index CITE ses
> sources : il partage de 3 à 7 % de leurs phrases, uniformément sur les six. Le détecteur de
> documents jumeaux n'en signale qu'UNE — la plus grosse — parce que son seuil l'attrape en
> premier. **C'est un artefact de seuil, pas un doublon** : un index d'extraits cite forcément
> ce qu'il indexe. Ce qu'il ne doit jamais faire — se périmer — est écarté par sa régénération,
> jamais par l'absence de citation.

> **Les fiches indexées** : `docs/grand-projet/01-absorption/syntheses/ARCHITECTURE_DES_NIVEAUX.md` · `docs/grand-projet/01-absorption/syntheses/ARCHITECTURE_FONCTIONNELLE.md` · `docs/grand-projet/01-absorption/syntheses/COMMENT_ASSURER_LA_COHERENCE.md` · `docs/grand-projet/01-absorption/syntheses/DE_LA_STRATEGIE_A_LA_TACHE.md` · `docs/grand-projet/01-absorption/syntheses/FIXER_UN_OBJECTIF_ULTIME.md` · `docs/grand-projet/01-absorption/syntheses/PHILOSOPHIE_ET_POLITIQUE.md`

## VUE D'ENSEMBLE — 29 idées dans 6 documents

| Verdict | Combien | Ce que ça veut dire pour nous |
|---|---|---|
| ⚠️ **DÉSACCORD** | 6 | conflit avec notre charte, ou réserve écrite — **à lire avant d'adopter quoi que ce soit** |
| 🆕 **NEUF** | 9 | une idée que le dépôt ne porte nulle part — c'est là qu'est la matière |
| ✅ **ACCORD** | 10 | le document confirme quelque chose que nous faisons déjà — rien à construire, parfois à nommer |
| 🔁 **DÉJÀ FAIT** | 3 | nous l'avons construit sans le savoir — le risque est de le refaire |
| ❓ **À TRANCHER** | 1 | une décision qui lui appartient |

---

## LES 29 SITUATIONS

### ⚠️ DÉSACCORD — 6

****chaque fois qu'un document extérieur traitera le jeu comme un moyen.** C'est le passage à citer pour rappeler pourquoi nous avons tranché autrement.**
> « Le jeu est un bac à sable, un laboratoire » · `ARCHITECTURE_DES_NIVEAUX` · **source lignes 160 à 228**

****à la question G7** (« que fait l'Agence si la charte du client contredit une de ses règles ? »). Sa réponse est le **rejet motivé** — exactement ce que je recommandais, et le document me donne le mot.**
> Les contrats d'interface entre niveaux · `ARCHITECTURE_FONCTIONNELLE` · **source lignes 119 à 283**

****au moment d'insérer nos deux étages manquants**, et ensuite à chaque hésitation de rangement.**
> La cascade complète, en douze étages · `COMMENT_ASSURER_LA_COHERENCE` · **source lignes 23 à 99**

****comme liste de contrôle, une seule fois** : « qu'est-ce qu'on n'a pas du tout ? ». Pas comme plan.**
> Les cinq objectifs stratégiques déclinés jusqu'à la tâche · `DE_LA_STRATEGIE_A_LA_TACHE` · **source lignes 44 à 508**

****si on adopte le rattachement**, c'est la version longue à réduire, pas à copier.**
> La matrice de traçabilité, et les neuf questions par tâche · `DE_LA_STRATEGIE_A_LA_TACHE` · **source lignes 578 à 642**

****juste après avoir tranché l'objectif ultime**, pour en dériver les objectifs stratégiques sans repartir de rien.**
> Les 5 à 7 objectifs stratégiques, déclinés · `FIXER_UN_OBJECTIF_ULTIME` · **source lignes 241 à 320**

### 🆕 NEUF — 9

****chaque fois qu'un document parlera de "philosophie" sans dire laquelle.** C'est le test à appliquer avant de le lire.**
> « Tu as trois systèmes imbriqués, pas un seul » · `ARCHITECTURE_DES_NIVEAUX` · **source lignes 8 à 87**

****à l'étape ④, modularisation**, et pour répondre à G13 (version réduite ou version modulaire).**
> FIXE / CONFIGURABLE / PERSONNALISABLE · `ARCHITECTURE_DES_NIVEAUX` · **source lignes 536 à 581**

****à l'étape ④**, pour croiser ce second axe avec nos trois zones.**
> La matrice exploitable, avec ses quatre statuts · `ARCHITECTURE_FONCTIONNELLE` · **source lignes 61 à 118**

****chaque fois qu'on se demandera si une tâche sert encore à quelque chose.** C'est le symptôme nommé : le lien invisible.**
> Le diagnostic de NOTRE schéma, nommé explicitement · `COMMENT_ASSURER_LA_COHERENCE` · **source lignes 4 à 22**

****quand on triera les tâches ouvertes**, et pour toute tâche neuve.**
> La cohérence vient des DEUX SENS · `COMMENT_ASSURER_LA_COHERENCE` · **source lignes 144 à 176**

****chaque fois qu'on hésitera entre "c'est un chantier" et "c'est une tâche".** C'est le test.**
> La règle de construction : ce que chaque niveau EST · `DE_LA_STRATEGIE_A_LA_TACHE` · **source lignes 10 à 43**

****au moment exact où on proposera une formulation**, pour la passer aux cinq critères avant de la retenir.**
> Les 5 critères d'un vrai objectif ultime · `FIXER_UN_OBJECTIF_ULTIME` · **source lignes 25 à 67**

****comme ossature de la séance sur l'objectif ultime**, question par question.**
> Les 6 questions d'atelier · `FIXER_UN_OBJECTIF_ULTIME` · **source lignes 68 à 142**

****chaque fois qu'on hésitera sur où ranger une règle neuve.** Le schéma donne six étages au lieu de nos quatre : la place existe, elle était juste sans nom.**
> L'analogie, et le schéma hiérarchique · `PHILOSOPHIE_ET_POLITIQUE` · **source lignes 37**

### ✅ ACCORD — 10

****au moment de concevoir le cas ①** (l'Agence accompagne un projet qui n'existe pas encore). C'est là que le piège se referme.**
> Le piège de la gouvernance figée · `ARCHITECTURE_DES_NIVEAUX` · **source lignes 88 à 132**

****à la question G8** (« y a-t-il des règles qu'un client ne peut pas refuser ? »). C'est la réponse toute faite, à amender.**
> Le noyau permanent et ce qui est configurable · `ARCHITECTURE_DES_NIVEAUX` · **source lignes 99 à 159**

****quand on écrira la philosophie et la politique de chaque niveau**, pour ne pas partir de la page blanche.**
> Les quatre niveaux détaillés, et ce que chacun possède · `ARCHITECTURE_DES_NIVEAUX` · **source lignes 229 à 535**

****quand une décision traînera sans qu'on sache à qui elle appartient.** La table donne le décideur par niveau.**
> Les cinq niveaux opérationnels, et leur règle de séparation · `ARCHITECTURE_FONCTIONNELLE` · **source lignes 10 à 60**

****si on adopte le rattachement des tâches** : le statut COHÉRENT/INCOMPLET est ce qui le rend mesurable au lieu de déclaratif.**
> La traçabilité des tâches, et le principe final · `ARCHITECTURE_FONCTIONNELLE` · **source lignes 284 à 315**

****si on reprend cette séquence quelque part** : elle décrit des familles, pas un ordre d'exécution.**
> Le point d'attention final : la chaîne n'est pas linéaire · `DE_LA_STRATEGIE_A_LA_TACHE` · **source lignes 800 à 911**

****au moment d'insérer les deux étages manquants dans notre escalade**, pour ne pas les mettre au mauvais endroit.**
> La hiérarchie complète, et l'objectif ultime UNIQUE · `FIXER_UN_OBJECTIF_ULTIME` · **source lignes 186 à 240**

****au moment de trier nos 33 Articles** : celui-ci dit-il une CONVICTION (philosophie) ou une RÈGLE (politique) ? C'est le test qui départage.**
> La philosophie d'entreprise : le « Pourquoi ? » · `PHILOSOPHIE_ET_POLITIQUE` · **source lignes 7**

****à l'ouverture du chantier philo/politique**, comme ossature du document à produire.**
> Les questions pour définir la PHILOSOPHIE · `PHILOSOPHIE_ET_POLITIQUE` · **source lignes 126**

****au tout premier geste du chantier philo/politique.** C'est l'exercice qui produit le plus de matière pour le moins d'invention.**
> Les questions pour définir la POLITIQUE, et le test des « 5 impossibles » · `PHILOSOPHIE_ET_POLITIQUE` · **source lignes 168**

### 🔁 DÉJÀ FAIT — 3

****en écrivant n'importe quel document du chantier.** La règle 1 est la plus rentable : elle évite l'ambiguïté qui nous a coûté la soirée.**
> Les cinq règles anti-confusion · `ARCHITECTURE_DES_NIVEAUX` · **source lignes 582 à 630**

****si on décide d'appliquer le test des cinq questions**, c'est ce qui le rend faisable sans relire un document à chaque fois.**
> Les identifiants de traçabilité · `COMMENT_ASSURER_LA_COHERENCE` · **source lignes 177 à 207**

****quand on décidera où ranger nos Gardiens et nos process.** Ils sont transverses, exactement comme il le décrit.**
> La gouvernance en transverse, jamais en sixième objectif · `DE_LA_STRATEGIE_A_LA_TACHE` · **source lignes 509 à 577**

### ❓ À TRANCHER — 1

****comme point de départ de la séance**, jamais comme conclusion.**
> Les cinq candidats, et sa préférence · `FIXER_UN_OBJECTIF_ULTIME` · **source lignes 143 à 185**

