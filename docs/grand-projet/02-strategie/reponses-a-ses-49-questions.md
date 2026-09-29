# RÉPONSES À SES 49 QUESTIONS — avec la demande inavouée, et l'action en face

*(Nuit du 2026-09-29 — heure LUE, source système. Tâches #1112 · #1153. Sa consigne : « livre-moi
les réponses aux questions […] sonde quelles sont mes questions et inquiétudes inavouées » et
« pour chaque question et réponse du fichier, ou groupe de réponses, il y a des actions en face, en
face de ma demande inavouée, à calibrer avec toi ? ».)*

> **DÉCOULE DE :** `docs/grand-projet/02-strategie/la-cible-2026-09-29.md`
> *les réponses s'appuient sur la cible et sur le chemin proposés ; quand la cible change, elles changent.*

---

> **FRONTIÈRE, écrite des deux côtés.** Ce document RÉPOND. La liste des questions elle-même —
> extraite de ses deux fichiers, sans une réponse, parce qu'extraire n'est pas répondre — vit dans
> `docs/grand-projet/01-absorption/questions-consolidees.md`, un document distinct qu'il ne faut
> jamais confondre avec celui-ci : là-bas on lit CE QU'IL A DEMANDÉ, ici CE QUE J'Y RÉPONDS.

## COMMENT LIRE CE DOCUMENT

**Quatre colonnes, et la troisième est celle qu'il a demandée en plus** : sa question · ma réponse ·
**sa demande inavouée** (l'inquiétude derrière la question, que la question ne dit pas) · l'action
qui en découle, à calibrer avec lui.

**Le compte des regroupements, qu'il a exigé** : **49 questions, 28 réponses.** 21 questions sont
regroupées, jamais fondues en silence — chaque groupe dit lesquelles il couvre et pourquoi elles
n'en font qu'une.

**Ce qui est MESURÉ est marqué comme tel.** Le reste est mon avis, et il est signalé comme un avis.

---

# PARTIE 1 — SES 10 QUESTIONS SUR L'EXPORT *(fichier QUESTIONS, écrit en premier)*

### Q1 — Le catalogue des produits dérivés

**Réponse.** Oui, et la découpe existe déjà sans avoir été nommée : le dépôt porte **9 stratégies de
chantier** (`docs/strategies/`) qui sont, presque terme pour terme, des produits dérivés possibles —
gestion des tâches, outillage et garde-fous, classification, process et Ronde, données et mesure.
Les autres candidats naturels : les 45 leçons, le système de suivi, le filet de sécurité.
**Le critère qui décide n'est pas l'envie, c'est l'indépendance mesurée** : SAFE-EXPORT dit
aujourd'hui **94 % d'indépendance sur 84 scripts**, et c'est cette mesure qui dira ce qui peut
partir seul.

**Sa demande inavouée.** *« Est-ce que j'ai construit un bloc monolithique impossible à vendre en
morceaux ? »*

**Action.** Dériver le catalogue des produits dérivés de la carte des capacités (étape 1.1), jamais
l'écrire à la main. **À calibrer :** combien de produits dérivés vise-t-on — 3, 5, 10 ?

---

### Q2 — La taille de l'Agence dans le paysage *(qu'il marque PRIORITAIRE)*

**Réponse, MESURÉE.** Le projet fait **97 149 lignes**, dont **84 542 dans `scripts/` — 87 % du
code**. Le repère du marché : **SonarQube facture à la taille du code et place 97 000 lignes dans sa
tranche à 34 $/mois** ; CodeClimate facture par développeur (49 $/utilisateur/mois). **Notre Agence
n'est donc pas surdimensionnée : elle est exactement dans la taille que l'industrie tarifie comme un
projet ordinaire.** Le genre de projet qui la justifie : celui où le coût d'une régression dépasse
le coût de l'outillage — c'est-à-dire tout projet suivi dans la durée, pas un prototype.

**Sa demande inavouée.** *« Est-ce que j'ai passé des mois à construire quelque chose de
disproportionné, et est-ce que quelqu'un en voudra ? »*

**Action.** Inscrire ce repère dans la stratégie export. **À calibrer :** vise-t-on le développeur
seul (10-50 $/mois), l'équipe (500-2 000 $/mois), ou l'entreprise (50 000 $/an et plus) ? Les trois
mènent à des Agences différentes.

---

### Q3 + Q6 — Un humain seul peut-il coder avec l'Agence, et comment on l'utilise concrètement
*(2 questions groupées : la seconde est la forme concrète de la première)*

**Réponse.** **Non, pas aujourd'hui, et c'est un fait mesurable** : l'Agence est faite d'outils en
ligne de commande qui rendent des rapports destinés à être LUS par une IA — 45 leçons, des plans
d'action, des refus motivés. Un humain seul lirait 363 lignes de bannière par commit. **En l'état
c'est un produit IA + humain**, et le nier serait vendre un malentendu. Sur le « comment » : elle
s'installe dans un projet EN COURS (c'est ce que le banc témoin fait déjà, 68/68 outils debout sur
un dépôt étranger) ; elle ne se lance pas seule.

**Sa demande inavouée.** *« Est-ce que je me coupe de la moitié du marché sans le savoir ? »*

**Action.** L'assumer explicitement dans la stratégie export plutôt que de le découvrir à la
première vente. **À calibrer :** fait-on un jour une version lisible par un humain seul, ou
assume-t-on le segment IA + humain ?

---

### Q4 + Q5 — Exportabilité contre consommation, et l'Agence comme produit qui se consomme
*(2 questions groupées : c'est la même idée prise par deux bouts)*

**Réponse.** **L'idée tient, et elle a un nom dans l'industrie** : c'est exactement ce que fait un
outil de qualité de code installé en développement et absent de la production. **Ce qui la rend
possible chez nous est déjà mesuré** : 94 % des scripts ne dépendent que de Node, git et un shell ;
seuls **5 scripts** touchent à une clé d'API. Retirer l'Agence avant publication est donc **techniquement
peu risqué** — elle ne s'exécute pas dans le produit. **Le risque n'est pas technique, il est
commercial** : un produit qu'on désinstalle est un produit qu'on cesse de payer.

**Sa demande inavouée.** *« Est-ce que je suis en train d'inventer un modèle économique qui ne tient
pas debout ? »*

**Action.** Trancher le modèle (Q2) avant de trancher la consommation : c'est lui qui décide si la
désinstallation est un argument ou un problème.

---

### Q7 — « Est-ce que l'agence m'aide ou est-ce que je m'y perds ? » *(« sois honnête »)*

**Réponse honnête, et elle est en deux temps.** **Cette mesure n'existe pas aujourd'hui**, et c'est
déjà une réponse. Ce qui existe et qui pointe dans le mauvais sens : **363 lignes de bannière à
chaque commit**, ignorées sept fois de suite quand on l'a mesuré · **10 registres à remplir par
outil qui arrive**, pendant que 2 outils déjà entrés ne servent plus · **109 tâches ouvertes
réparties sur 97 thèmes**. Ce qui pointe dans le bon sens : **cette nuit, trois défauts réels ont
été trouvés par des outils et non par moi** (un « undefined » latent, une mesure de temps périmée de
33 %, un champ qui en écrasait un autre). **Verdict : l'Agence aide à TROUVER, et coûte à
NAVIGUER.** Les deux sont vrais en même temps.

**Sa demande inavouée.** *« Est-ce que j'ai créé un monstre que même une IA ne peut plus digérer ? »*

**Action.** En faire une mesure réelle plutôt qu'une impression : le coût d'entrée par outil, le
taux de rapports effectivement lus, la part de la bannière suivie d'effet. **À calibrer :** cette
mesure doit-elle bloquer l'arrivée d'un outil de plus, ou seulement l'éclairer ?

---

### Q8 — Le tableau version de l'Agence ↔ projet : « trouve TOUS les critères »

**Réponse — huit critères, dont cinq sont déjà mesurables aujourd'hui.**
① la taille du code (mesurée : le repère Sonar) · ② la durée de vie attendue du projet · ③ le nombre
de personnes · ④ humain seul ou IA + humain (Q3) · ⑤ le coût d'une régression · ⑥ la puissance du
modèle disponible · ⑦ la tolérance au bruit (363 lignes par commit) · ⑧ **le besoin
d'analyse-simulation**, qui est sa propre distinction en C28.

**Sa demande inavouée.** *« Est-ce que je saurai dire à un acheteur quelle version prendre, ou
est-ce que j'aurai l'air de ne pas connaître mon produit ? »*

**Action.** Le tableau se DÉRIVE de ces huit critères, jamais écrit à la main (Article 24).
**À calibrer :** combien de versions — deux, trois, un curseur continu ?

---

### Q9 — Les prix de la concurrence et le chiffre d'affaires imaginable

**Réponse, MESURÉE par recherche du 2026-09-28.** Copilot Enterprise **60 $ effectifs/mois** ·
Cursor Teams **40 $**, Premium **120 $** · Devin Team **500 $/mois** · SonarQube **34 $/mois** en
nuage, **2 500 à 20 000 $/an** auto-hébergé · CodeClimate **49 à 99 $/utilisateur/mois**.
**Conversion gratuit → payant : 2 à 7 %**, et **73 % des conversions viennent du palier gratuit**.
**Le fait de méthode le plus utile** : l'industrie a séparé l'assistance (forfait) de l'agent (à
l'usage) depuis juin 2026.
**Un CA imaginable ne se calcule pas sans le segment (Q2)** ; le donner maintenant serait un chiffre
inventé, et je ne l'invente pas.

**Sa demande inavouée.** *« Est-ce que ça peut me faire vivre ? »*

**Action.** Refaire ce relevé au moment de fixer le prix — un prix de septembre 2026 sera faux dans
six mois. **À calibrer :** forfait, usage, ou les deux comme le fait l'industrie ?

---

### Q10 — Les langues

**Réponse.** **Trois couches, et elles ne se décident pas ensemble.** ① Le CODE et les outils :
noms et messages en français — traduisibles, coût réel mais mécanique. ② La DOCUMENTATION : ~500
documents, c'est le vrai coût. ③ **Les personnages** : Lia et Noé parlent français, et plusieurs
outils analysent ce français (registre, anti-écho, détection de dérive) — **les traduire casserait
l'Article 0**, qui est la loi suprême. La troisième couche ne part donc pas.

**Sa demande inavouée.** *« Est-ce que ma langue ferme mon marché ? »*

**Action.** Décider par couche, jamais globalement. **À calibrer :** anglais d'abord pour le code et
l'interface, en gardant la documentation française ?

---

# PARTIE 2 — LES 45 QUESTIONS DE LA COMMANDE

### C1 à C5 + C7 — Qui porte quoi, et le but ultime
*(6 questions groupées : elles posent toutes la même question de gouvernance)*

**Réponse.** **Tranché avec lui le 2026-09-28 : THE-KING VÉRIFIE ET ALERTE, il ne décide pas.** Il
est déjà le veilleur de philosophie-et-politique, donc lui confier la stratégie globale étend une
autorité au lieu d'en créer une. Sur « Cassandra la Queen » : **oui, et la répartition est déjà
vraie dans le code** — Cassandra tient les RH de l'outillage, The-King tient la doctrine.
**Sur C7, LE BUT ULTIME, la réponse est mesurée et c'est la trouvaille de la nuit** : il n'était
défini nulle part. La boussole du projet ne contenait **zéro occurrence** de « agence », « but »,
« raison d'être » ou « commercialiser » — et elle décrivait le projet comme « créatif/narratif »,
c'est-à-dire l'inverse de sa direction. **Une Partie 0 — LE BUT y est désormais posée, en
proposition.**

**Sa demande inavouée.** *« Est-ce que quelqu'un tient vraiment la barre, ou est-ce que ça part dans
tous les sens sans que je le voie ? »*

**Action.** ① Valider ou corriger la Partie 0. ② Le document maître se DÉRIVE des stratégies réelles
(Article 24), jamais tenu à la main. **À calibrer :** un porteur par stratégie, ou un seul pour les
trois ?

---

### C6 + C8 + C13 + C14 — Stratégie, process, charte : qui gouverne quoi
*(4 questions groupées : c'est une seule question de vocabulaire)*

**Réponse, et la distinction qu'il cherche est simple.** **La STRATÉGIE dit OÙ on va. Le PROCESS dit
COMMENT on s'y prend. La CHARTE dit ce qu'on ne fait JAMAIS.** Les trois sont nécessaires et aucune
ne remplace l'autre : une stratégie sans process ne s'exécute pas, un process sans stratégie
s'exécute dans le vide, et la charte empêche les deux de dériver. **Aujourd'hui** : la charte est
solide (32 Articles, portés par des mécanismes), les process sont écrits (12 process déclarés), et
**la stratégie était la couche manquante** — ce que ce chantier répare.
**Son « etc. = quoi d'autre ? » (C14)** : les OUTILS, les KPI, les objectifs, la RH de l'outillage,
le référentiel, et **les leçons** — le seul registre qui dise ce que le projet a appris en se
trompant.

**Sa demande inavouée.** *« Je mélange ces mots, et j'ai peur que ça cache un vrai désordre. »*

**Action.** Écrire cette distinction une fois, à l'endroit qui fait loi. **À calibrer :** dans la
charte, ou dans le référentiel ?

---

### C9 + C10 — L'axe STRATÉGIE sur les tâches et sur la classification
*(2 questions groupées)*

**Réponse. Son idée est bonne, et la mesure le confirme** : aujourd'hui **109 tâches ouvertes sur 97
thèmes distincts** — une file aussi fragmentée ne se priorise pas. **Mais je recommande le
RATTACHEMENT AUX SEPT ÉTAPES du chemin plutôt qu'un onzième axe de classification** : ça donne sept
groupes au lieu de 97, ça répond à la même question, et ça ne coûte pas une obligation de plus.

**Sa demande inavouée.** *« Mon idée n'est pas claire — dis-moi si elle est bête. »* **Elle ne l'est
pas : elle nomme un vrai défaut, seule sa forme change.**

**Action.** Rattacher les tâches aux étapes une fois le chemin validé. **À calibrer :** rattachement
aux étapes, ou vrai axe de classification ?

---

### C11 + C12 + C15 — La dynamique d'escalade, et comment la fiabiliser
*(3 questions groupées)*

**Réponse. Oui, je comprends son intention, et elle est désormais MÉCANIQUE et non déclarative** :
chaque objet déclare le parent dont il découle, et un outil dit lesquels ne remontent nulle part
jusqu'au but. **Premier passage réel cette nuit : 40 %, 17 objets sur 42, 0 écart.** Sur la
fiabilisation (C12) : deux cas sont fautifs quel que soit l'âge de l'objet — **un parent déclaré qui
n'existe pas** (une référence morte ressemble à un lien, ce qui est pire qu'une absence) et **un
cycle** (A découle de B qui découle de A : c'est littéralement l'incohérence globale qu'il redoute).
Les orphelins, eux, ne sont pas des fautes : accuser d'un coup les documents écrits avant la règle
rendrait le signal illisible.

**Sa demande inavouée.** *« Est-ce que "tout est aligné" est juste une jolie phrase que je me
raconte ? »* **Non — depuis cette nuit, c'est un nombre.**

**Action.** Faire monter la couverture. **À calibrer :** jusqu'où descend l'obligation — les
documents seulement, ou aussi les outils et les tâches ?

---

### C16 — « Qu'est-ce que le projet AGENCE selon toi, de manière détaillée ? »

**Réponse.** **L'Agence Codex est une équipe d'outils qui se surveillent mutuellement.** Concrètement :
~87 scripts qui lisent le dépôt réel et rendent des constats vérifiables ; des rangs (les Gardiens
sacrés tournent à chaque commit, gratuitement) ; une RH qui mesure si chaque membre est réellement
intégré ; une mémoire (45 leçons de ses propres erreurs) ; des contrôleurs de process ; et une règle
transversale — **tout outil doit pouvoir partir ailleurs**. **Ce qui la distingue de ce qui existe
sur le marché** (vérifié le 2026-09-28) : les frameworks multi-agents ont des rôles sans mémoire ni
garde-fous ; les outils de qualité scannent le code sans notion d'équipe ; les fichiers de règles
n'ont rien qui vérifie que la règle est tenue. **Personne ne vend l'ensemble.**

**Sa demande inavouée.** *« Est-ce qu'on parle bien de la même chose, toi et moi ? »*

**Action.** Cette définition devient la première phrase du pack découverte. **À calibrer :** se
reconnaît-il dans cette définition ?

---

### C17 + C19 — L'outil de rationalisation, et l'ordre fragmentation / rationalisation
*(2 questions groupées)*

**Réponse.** **Sur l'ordre (C19), sa vision est juste et les sources la confirment** : l'analyse de
niveau 2 écrit « si nous modularisons maintenant sans rationaliser, nous risquons de faire une
modularisation mécanique, pas une architecture ». **Rationaliser d'abord, donc.**
**Sur l'outil (C17), ma recommandation est d'ÉTENDRE always-new-code plutôt que de créer un membre
de plus** : il fait déjà l'épreuve de la page blanche sur une zone, ce qui est exactement le geste
de la rationalisation. Un agent de plus coûterait dix registres à remplir — le coût d'entrée que
JESUS mesure.

**Sa demande inavouée.** *« Est-ce que je prends les choses dans le bon ordre, ou est-ce que je vais
tout casser ? »*

**Action.** Étape ③ du chemin, avant l'étape ④. **À calibrer :** extension d'always-new-code, ou
vrai nouvel agent ?

---

### C18 — « Fragmentable à 100 %, ça veut dire quoi ? »

**Réponse.** **Ni l'un ni l'autre de ce qu'il propose.** Fragmentable ne veut pas dire « sans
dépendances » — un morceau utile a toujours besoin de quelque chose. **Ça veut dire : chaque
dépendance est DÉCLARÉE et REMPLAÇABLE.** C'est déjà mesuré chez nous : **67 scripts dépendent de la
tuyauterie emportée** (elle part avec eux), **72 de ce que l'hôte doit fournir** (Node, git, un
shell — déclaré dans le contrat d'hôte), **5 d'un service extérieur** (une clé Gemini). Les
doublons, eux, sont l'inverse de la fragmentation : ils font qu'un correctif doit être appliqué deux
fois.

**Sa demande inavouée.** *« Est-ce que je demande quelque chose d'impossible ? »* **Non, et c'est
déjà à 94 %.**

**Action.** Aucune — la réponse suffit. Le chiffre se relit avec `safe-export tuyauterie`.

---

### C20 — « Les Prophètes du Temps » : famille ou sous-famille ?

**Réponse.** La classification porte **9 axes** aujourd'hui, et le rangement complet est **généré**
(`docs/referentiel/classification-agence.md`), donc jamais périmé. « Les Prophètes du Temps » est un
**surnom de groupe**, pas une entité du code — et c'est précisément ce que l'audit reproche à juste
titre : **il manque un axe qui dise la COUCHE** (ce dont un outil fait partie), là où l'axe `type`
dit seulement ce qu'un fichier EST.

**Sa demande inavouée.** *« Est-ce que mes surnoms sont du folklore, ou est-ce qu'ils décrivent
quelque chose de réel ? »* **Ils décrivent quelque chose de réel que le code ne sait pas encore
nommer.**

**Action.** Un dixième axe DÉRIVÉ, jamais une taxonomie concurrente. **À calibrer :** et c'est lui
qui nommera les familles, par séries — jamais moi au cas par cas.

---

### C21 + C22 + C25 + C26 — La fin de l'Agence, la sauvegarde, et ne pas perdre de valeur
*(4 questions groupées : la borne de fin commande les trois autres)*

**Réponse — TROIS BORNES, comme il l'a demandé, et les trois sont déjà mesurées.**
**① L'exportabilité** : 88 % sur 7 dimensions (8 depuis le 2026-09-28). **② Le banc témoin** : 68/68
outils debout sur un dépôt étranger. **③ L'indépendance de la tuyauterie** : 94 % sur 84 scripts.
**Et une quatrième manque, que la cible rend nommable** : *un acheteur peut-il l'installer et
l'utiliser sans nous ?* — aucune des trois premières ne le dit.
**Sur ne pas perdre de valeur (C26)**, c'est la question la moins bien couverte de toutes : ce qui
protège aujourd'hui, c'est le filet (358 tests) et les kits d'export ; ce qui ne protège pas, c'est
que **rien ne mesure la valeur d'une décision retirée**.

**Sa demande inavouée.** *« Est-ce que je vais y passer ma vie ? »* **Non, si les bornes existent —
et trois sur quatre existent déjà.**

**Action.** Inscrire les quatre bornes dans la stratégie, avec leur valeur du jour. **À calibrer :**
quel seuil sur chacune vaut « fini » — 95 % ? 100 % ?

---

### C23 + C24 + C27 + C32 + C33 + C34 — Les versions, leur logique, et l'étiquetage rétroactif
*(6 questions groupées : c'est un seul mécanisme)*

**Réponse.** **Les étiquettes ADMIN / COMMERCIALISABLE doivent être un AXE DÉRIVÉ, jamais 1 140
étiquettes posées à la main** — et un axe dérivé est **rétroactif par construction**, ce qui répond
exactement à son « avec effet rétroactif ». Le porteur naturel est `le-classificateur`, qui porte
déjà les 9 axes et classe **515 documents à 100 %**. **Sur l'impact au-delà du ton (C34)** : il
décide ce qui part, ce qui se documente, ce que le pack découverte montre, et quels tests tournent
chez l'acheteur — **c'est-à-dire tout, et c'est pourquoi il vient tôt dans le chemin (étape 1.3)**.
**Sur l'étape « dangereuse et risquée » (C27)** : elle l'est parce qu'elle sépare ; la protection
est le banc témoin, qui vérifie après chaque séparation que les 68 outils tiennent encore debout.

**Sa demande inavouée.** *« Est-ce que je vais casser ce qui marche en essayant de le vendre ? »*

**Action.** L'axe dérivé arrive à l'étape 1.3. **À calibrer :** deux valeurs, ou trois (admin /
commercialisable / les deux) ?

---

### C28 — La version sans les parties analyse-simulation

**Réponse.** **Sa distinction est juste et elle est mesurable** : les outils qui n'ont de sens que
sur un produit vivant (simulation, capture d'écran, fidélité du ton) sont identifiables par leur
portée déclarée — `run-simulation`, `summarize-simulation-log`, `check-spirit`, `the-screener`.
**C'est donc une valeur de l'axe dérivé (C32), pas un second dépôt.** Deux dépôts divergeraient en
une semaine.

**Sa demande inavouée.** *« Est-ce que je vends la même chose à tout le monde, ou est-ce que je sais
segmenter ? »*

**Action.** Une valeur de plus sur l'axe. **À calibrer :** ses deux noms — « PACK AGENCE + SUITE
TARANTINO » et « PACK AGENCE 360 » — sont les siens, et c'est lui qui nomme.

---

### C29 — Une Agence qui tourne à distance depuis le Cloud

**Réponse.** **Techniquement possible, et le chiffre le dit** : 94 % des scripts ne demandent que
Node, git et un shell — ils tournent donc partout où le dépôt est accessible. **Mais ça change le
modèle économique plus que la technique** : l'industrie facture ces runtimes à la consommation (AWS
Bedrock AgentCore : ~0,09 $ par vCPU-heure). **Le vrai obstacle n'est pas de faire tourner l'Agence
ailleurs, c'est de lui donner accès au code de l'acheteur** — ce qui est une question de confiance,
jamais d'infrastructure.

**Sa demande inavouée.** *« Est-ce qu'il y a un modèle plus simple que de leur faire installer mon
truc ? »*

**Action.** À garder comme option de modèle, pas comme chantier. **À calibrer :** intéressé
maintenant, ou plus tard ?

---

### C30 + C31 — Les outils habituels des codeurs, et la cohabitation avec l'acheteur
*(2 questions groupées)*

**Réponse.** Les codeurs créent habituellement : des scripts de build et de déploiement, des hooks
git, des générateurs, des linters configurés, des harnais de test, des outils de migration.
**Aucun ne ressemble à l'Agence** — ce sont des automatisations de gestes, pas des membres d'équipe
qui rendent des jugements. **Sur la cohabitation (C31), la réponse est la plus structurante de cette
partie** : il faut un **RÉCEPTACLE déclaré** — un endroit où l'acheteur ajoute ses propres outils
sans toucher aux nôtres, et un contrat qui dit ce qu'un outil doit fournir pour être reconnu comme
membre. **Ce contrat n'existe pas aujourd'hui**, et c'est le manque le plus net de la partie export.

**Sa demande inavouée.** *« Est-ce que mon Agence sera un corps étranger rejeté par le projet
qu'elle rejoint ? »*

**Action.** Le contrat de réceptacle est une vraie brique à construire, à l'étape ④. **À
calibrer :** l'acheteur peut-il modifier nos outils, ou seulement en ajouter ?

---

### C35 + C36 + C37 + C38 + C39 — Le PACK DÉCOUVERTE
*(5 questions groupées : c'est un seul livrable)*

**Réponse.** **Son thème** : « qu'est-ce que cette Agence sait faire, et comment on s'en sert ».
**Le nom : c'est lui qui nomme**, par séries, et je ne propose donc pas un nom isolé.
**Ce qui manque et qui existe** : la carte des capacités (dispersée), l'organigramme (existe), les
KPI (existent). **Ce qui manque et n'existe pas** : une page d'entrée, un exemple d'usage réel, et
le contrat de réceptacle (C31). **Le doc de présentation aujourd'hui (C37) : il n'y en a aucun** —
`docs/grand-projet/index.md` est une porte d'entrée de chantier, pas une présentation du produit.
**Le porteur (C38)** : **Inès plutôt que Cassandra**, parce qu'Inès aplatit déjà le dépôt en une
édition consolidée — c'est la matière même du pack. Cassandra tient les RH, ce qui n'est pas le
sujet. **L'outil qui garantit sa production (C39)** : `circle-tasks`, à chaque Ronde, comme il l'a
demandé.

**Sa demande inavouée.** *« Si quelqu'un me demande demain de lui montrer mon produit, qu'est-ce que
je lui envoie ? »* **Aujourd'hui : rien. C'est le vrai constat.**

**Action.** Le pack devient un item de Ronde, dérivé d'Inès. **À calibrer :** le nom (le sien), et
Inès confirmée comme porteuse ?

---

### C40 + C45 — « Un gros chantier… ou pas ? » et « révéler plutôt qu'imaginer »
*(2 questions groupées : c'est la même intuition)*

**Réponse. Son intuition est JUSTE, et elle est vérifiable.** `docs/strategies/` contient déjà **9
stratégies de chantier** écrites, dont une qui s'appelle littéralement « export et
commercialisation ». **Les stratégies existent ; ce qui manquait, c'est le sommet de la cascade et
le lien entre elles** — et le lien a été posé cette nuit (40 % de couverture). **Donc : plus petit
qu'il ne le craint sur la matière, plus grand qu'il ne le croit sur la discipline.** Ce qui coûtera,
ce n'est pas d'écrire les stratégies : c'est de tenir l'alignement à chaque création.

**Sa demande inavouée.** *« Est-ce que je m'embarque dans six mois de travail ? »* **Non sur
l'écriture. Oui sur l'habitude.**

**Action.** Aucune action nouvelle : c'est le chemin lui-même.

---

### C41 + C42 + C44 — Les process par projet, ce qu'il faut adapter, et l'annexe gouvernance
*(3 questions groupées)*

**Réponse.** **Sur C41, non : pas un process par projet.** Trois process multiplieraient par trois
ce que god-of-all-process doit surveiller, pour une distinction qu'une simple **étiquette de projet
sur les process existants** rend aussi bien. **Sur C42, ce qu'il faut adapter** : la charte
(l'escalade, l'alignement), les règles de travail (fait cette nuit, §0ter), le référentiel (la
boussole, fait), et **le système de suivi**, pour que chaque tâche puisse nommer son étape.
**Sur C44, l'annexe gouvernance**, trois choses valent d'être prises et le reste non : ① l'étape
**HARMONISATION** entre niveler et intégrer — c'est exactement là où nous butons sur le vocabulaire ;
② les **CONTRATS D'INTERFACE** (un lien n'est pas une flèche) — ils répondent à C31 ; ③ la
**DÉFINITION DE FINI** en huit points, plus exigeante que notre badge actuel.

**Sa demande inavouée.** *« Est-ce que ce document que j'ai trouvé vaut quelque chose, ou est-ce que
je vous fais perdre du temps ? »* **Il vaut trois choses précises, et c'est déjà beaucoup pour une
annexe.**

**Action.** Les trois entrent au chemin (④ pour les contrats, ② pour l'harmonisation). **À
calibrer :** la définition de fini en huit points remplace-t-elle notre badge ?

---

### C43 — « On est ok que c'est une grande étape de notre travail qui se joue ici ? »

**Réponse. Oui, et pour une raison précise qui n'est pas de la politesse** : c'est la première fois
que ce projet se demande **à quoi il sert**, et la mesure de cette nuit a montré que la réponse
n'existait nulle part — zéro occurrence de « but » dans la boussole. **Tout ce qui a été construit
jusqu'ici l'a été sans cible déclarée.** Que ça ait bien marché ne change rien au fait que c'était
de la chance, pas de la méthode.

**Sa demande inavouée.** *« Dis-moi que je ne me monte pas la tête tout seul. »* **Il ne se la monte
pas.**

**Action.** Aucune. C'était une question, elle a une réponse.

---

## CE QUI RESTE SANS RÉPONSE, ET IL FAUT LE DIRE

**Aucune des 49 n'est laissée sans réponse.** Mais **onze réponses reposent sur la CIBLE, qui n'est
pas encore validée** (Q1, Q2, Q3, Q4/Q5, Q8, Q9, C21, C23-C34, C35-C39). Si la cible change, elles
changent — et c'est pourquoi le bloc A des questions de calibrage se répond en premier.

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Ce qu'il devient |
|---|---|---|
| Les 49 questions n'avaient jamais reçu de réponse écrite, alors qu'il les a posées le 2026-09-28 | **RETENU** | tâche **#1153** — ce document, 28 réponses pour 49 questions, avec la demande inavouée et l'action en face |
| Il n'existe **aucun document de présentation du projet AGENCE** (C37) | **RETENU** | tâche **#1136**, déjà ouverte : le pack découverte, dérivé d'Inès, porté par la Ronde |
| Le **contrat de réceptacle** pour les outils de l'acheteur (C31) n'existe pas — c'est le manque le plus net de la partie export | **RETENU** | tâche **#1154** — à construire à l'étape ④ du chemin |
| **Rien ne mesure si l'Agence aide ou encombre** (Q7), alors qu'il pose la question en premier | **RETENU** | tâche **#1155** — en faire une mesure réelle plutôt qu'une impression |
| Onze réponses dépendent d'une cible non validée | **À TRANCHER** | bloc A des questions de calibrage (#1151) |
