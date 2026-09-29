# Les modifications de CLAUDE.md qui attendent ton accord

*(Produit le 2026-09-28. **Rien n'est appliqué** : ta borne pour la nuit autonome autorise CLAUDE.md
« mais tu me montres avant ». Ce document EST le « avant ». Chaque entrée donne le texte actuel, le
texte proposé, et ce que ça change concrètement.)*

**Pourquoi un seul document plutôt que trois tâches séparées** : les trois touchent la charte, et
`protegerLaCharte()` refuse un Article inséré au milieu ou vidé de ses obligations. Les traiter d'un
bloc te permet de voir l'effet cumulé ; les traiter un par un entre deux chantiers est exactement ce
que tu as refusé pour l'Article 19 (« garde-le pour la prochaine grosse revue de la charte »).

---

## 1. Le process XP est passé de TROIS à QUATRE moments *(tâche #749, faite le 2026-09-28)*

**Portée : un mot, plus une phrase.** Le quatrième moment existe déjà dans le code
(`DECLENCHEURS_XP`), dans la règle surveillée d'angel, et dans `docs/xp-ia-process-detail.md`.
**Seule la charte dit encore « trois »** — c'est donc une dette documentaire au sens de
l'Article 13, pas une proposition nouvelle.

**Aujourd'hui (CLAUDE.md, ligne 917) :**

> **Les trois moments où la question « y avait-il quelque chose à retenir ? » se pose** : un
> garde-fou bloque un commit ou un test échoue de façon imprévue · la fin d'un compte rendu de
> travail · chaque Ronde et chaque évaluation.

**Proposé :**

> **Les quatre moments où la question « y avait-il quelque chose à retenir ? » se pose** : un
> garde-fou bloque un commit ou un test échoue de façon imprévue · la fin d'un compte rendu de
> travail · chaque Ronde et chaque évaluation · **un outil rend un résultat VERT qui ne correspond
> pas à ce que je sais du terrain**.

**Ce que ça change concrètement.** Les trois premiers supposent tous qu'il se PASSE quelque chose.
Le quatrième se déclenche sur un rapport **vert**, lu par quelqu'un qui connaît le terrain — et sur
la seule nuit du 27 au 28, **sept trouvailles** en sont venues, dont **aucune n'a fait échouer un
test**. C'est le moment le plus fécond, et le seul qu'aucune mécanique ne peut déclencher.

**Coût en obligations : zéro de plus.** C'est la même règle, avec un déclencheur de plus.

---

## 2. Les trois mots d'ordre permanents *(tâche #703, mécanisme posé le 2026-09-28)*

**Portée : un paragraphe à ajouter.** Le mécanisme existe déjà — `fiabiliser`, `optimiser`,
`harmoniser` sont trois règles de conduite surveillées par angel, qui les DEMANDE à chaque évaluation
et refuse d'être au vert sans réponse. **La charte, elle, ne les porte pas encore.**

**Ta demande, dans tes mots** : « je veux que ce soit dans la logique des process […] insufflées à
chaque étape et chaque endroit du projet » + « on ajoute harmonise […] on le rajoute partout aux
mêmes endroits ». Et ta pique qui a tout déclenché : « est-ce que c'est bien dans les process ?
est-ce que c'est harmonisé ? fiabilisé ? optimisé ? ;))) » — les deux mots étaient **écrits** dans
les règles de travail, et **rien ne les imposait**.

**Proposé, à la suite de l'Article 20bis** *(jamais inséré au milieu d'une numérotation : les
numéros d'Article ne se renumérotent pas)* :

> **Les trois mots d'ordre permanents.** À la clôture de CHAQUE tâche, trois questions, jamais
> quatre : **FIABILISER** — est-ce que ça marche, les tests passent-ils ? · **OPTIMISER** — peut-on
> faire mieux, est-ce complet ? · **HARMONISER** — est-ce raccordé au reste, au bon format ?
> Portées par `angel-of-ia-process`, qui les DEMANDE et refuse d'être au vert sans réponse — aucun
> fichier ne peut dire qu'on s'est posé une question, donc demander est la seule protection
> possible (Article 27).

**Pourquoi s'arrêter à trois, et c'est ta décision d'origine** : le seul quatrième candidat sérieux
(« un mécanisme le porte-t-il ? ») est déjà tenu par l'Article 27 et SAFE-EXPORT, alors que les
trois autres n'avaient personne. Et **une question rituelle à quatre devient une case qu'on coche
sans penser** — exactement le faux vert qu'on traque.

**Coût en obligations : +3.** C'est le seul des trois points qui alourdit vraiment la charte, et
c'est le chiffre à regarder si tu hésites.

---

## 3. L'Article 19 allégé — déjà arbitré, rappelé ici pour mémoire *(tâche #624)*

**Tu as déjà tranché le 2026-09-28** : « Garde-le pour la prochaine grosse revue de la charte ».
Le avant/après est produit et prêt (`docs/plans/article-19-avant-apres.html`), mesuré à **−28 %**
(904 → 650 tokens).

**Il n'est rappelé ici que parce que « la prochaine grosse revue de la charte » est peut-être ce
moment-ci.** Si tu traites les points 1 et 2, le 3 se traite dans la même passe pour zéro coût
d'attention supplémentaire. Sinon il attend, et c'est très bien.

---

## 4. L'ESCALADE — un Article de plus, à numéroter *(tâche #1146, nuit du 2026-09-29)*

**Pourquoi il arrive ici.** Tu m'as donné la main sur la charte cette nuit (« fais le nécessaire
dans la charte et les process si besoin, je te laisse la main »). Ta borne permanente dit aussi
« tu me montres avant ». **Je n'ai pas tranché entre les deux : la règle est écrite dans
`docs/regles-de-travail.md` §0ter, donc elle est ACTIVE, et l'Article te reste à valider.** Rien
n'est perdu si tu dis non ; la règle vit déjà ailleurs.

**Pourquoi un Article et pas seulement les règles de travail.** L'escalade gouverne la CONCEPTION de
tout chantier. Une IA qui reprend le projet lit CLAUDE.md en entier, et ne lit
`docs/regles-de-travail.md` qu'au moment où elle en a besoin. Une règle qui décide de l'ORDRE du
travail arrive trop tard si on la découvre en cours de route — c'est l'argument de l'Article 27.

**Texte proposé** *(il rejoint la fin de la liste, jamais inséré au milieu)* :

*(Le numéro s'écrit `NN` et non `33` : un nouvel Article rejoint la FIN de la liste, donc son
numéro dépend de ce qui aura été accepté d'ici là. Et écrire un numéro qui n'existe pas encore fait
lire au garde-fou de la charte un renvoi mort — il a refusé le commit pour ça cette nuit même, et il
avait raison de demander.)*

> **Article NN — L'ESCALADE : l'ordre dans lequel tout travail se conçoit.**
>
> *(2026-09-28, sa consigne donnée DEUX fois le même soir à vingt minutes d'intervalle.)*
> `① CALIBRAGE FIN → ② LA CIBLE → ③ LES GRANDES ÉTAPES → ④ LES SOUS-ÉTAPES → ⑤ LES BLOCS DE TÂCHES
> → ⑥ LES TÂCHES INDIVIDUELLES`
>
> **Chaque niveau interdit au suivant de commencer.** On ne définit pas une cible avant d'avoir
> calibré ; on ne trace pas d'étapes avant d'être d'accord sur la cible ; **on ne crée aucune tâche
> avant que le cadre soit fixé**. Ses mots : « une fois que ce cadre est fixé, je pense que tu peux
> créer/modifier les tâches ». La règle vaut **dès la conception du plan de chantier, et partout**.
>
> **ELLE A ÉTÉ PAYÉE LE JOUR MÊME, et la cause est la plus instructive** : seize tâches ouvertes
> sous un plan non calibré, parce que l'**Article 28** refuse un constat annoncé pointant vers une
> tâche inexistante. Ce garde-fou existe pour empêcher qu'un rapport meure sans suite ; il a produit
> l'inverse de son intention. **Une obligation de FORME qui force une décision de FOND est un
> défaut, jamais une discipline.**
>
> **Ne jamais la confondre avec la CHAÎNE DE DÉCISION du projet** (but ultime → philosophie et
> politique → les trois stratégies → les chantiers). La chaîne dit **qui commande quoi**, l'escalade
> dit **comment on découpe le travail**. Un seul point les relie, et il est structurant : la CIBLE
> du niveau ② sort du BUT ULTIME de la chaîne. Détail : `docs/regles-de-travail.md` §0ter.
>
> **Aucun mécanisme ne peut lire un plan en cours de conception dans une conversation** : comme pour
> les Articles 29 et 30, la déclarer ICI est la protection (Article 27). Ce qui reste vérifiable est
> le RÉSULTAT — un plan de chantier montre ses six niveaux, une tâche née sans étape parente est un
> écart.

**Ce que ça change concrètement.** Rien à mon rythme de travail : je l'applique déjà. Ce que ça
change, c'est qu'une autre IA qui reprend le projet ne pourra plus créer des tâches avant le cadre
sans enfreindre une règle écrite.

**Le budget d'obligations** *(tu l'as voulu SOUPLE, donc je note sans bloquer)* : cet Article
**+1**. Ce qu'il pourrait remplacer : rien directement, mais il **rend l'Article 18 plus court** —
« un gros process se suit en entier » devient un cas particulier de l'escalade. À voir ensemble à la
prochaine passe d'allègement.

---

## 5. L'ALIGNEMENT EN CASCADE — un Article de plus, à numéroter *(tâche #1148, nuit du 2026-09-29)*

**Pourquoi il arrive ici.** Ta consigne : « des stratégies **alignées**, qui génèrent des stratégies
de chantier **alignées**, des outils **alignés**, ****tout**** est aligné […] dès que tu commences à
créer, il faut que cet axe ***habite*** ton travail ». **Le mécanisme existe depuis cette nuit**
(THE-KING, 40 % de couverture, 0 écart) ; l'Article, lui, est ce qui rend l'obligation lisible par
quelqu'un qui ne lira jamais le code de THE-KING.

**Texte proposé** :

> **Article NN — TOUT DÉCOULE DU BUT, ET L'ALIGNEMENT SE VÉRIFIE.**
>
> *(2026-09-29, sa consigne : « tout est aligné […] il faut que cet axe habite ton travail ».)*
>
> **La cascade** : `le but (philosophie et politique) → la stratégie du projet entier → stratégie
> Agence + stratégie Jeu → les stratégies de chantier → les outils → les tâches`. **Elle remonte
> autant qu'elle descend** — « les stratégies de tâches alimentent par escalade la stratégie
> globale, et vice versa » : c'est une boucle, jamais une pyramide.
>
> **UN MOT NE FAIT PAS UN ALIGNEMENT.** Tant que rien ne peut CONSTATER une incohérence, « aligné »
> reste une intention — et une intention n'a jamais empêché quoi que ce soit (leçon L2). **Chaque
> objet du projet déclare donc le parent dont il découle**, par une ligne visible
> `**DÉCOULE DE :** chemin`, et THE-KING dit lesquels ne remontent nulle part.
>
> **DEUX CAS SEULEMENT SONT DES FAUTES**, et ils le sont quel que soit l'âge de l'objet : un parent
> déclaré **qui n'existe pas** (une référence morte ressemble à un lien, ce qui est pire qu'une
> absence) et un **cycle** (A découle de B qui découle de A — littéralement l'incohérence globale
> qu'il redoute). **Un objet qui n'a jamais déclaré n'est PAS une faute** : des centaines ont été
> écrits avant la règle, et les accuser d'un coup rendrait le signal illisible le jour de sa
> naissance (leçon L4). **La couverture est un progrès à faire monter, jamais une dette à solder.**

**Ce que ça change concrètement.** Une ligne de plus en tête de chaque document de stratégie ou de
plan créé à partir de maintenant. Rien de rétroactif, rien de bloquant.

**Le budget d'obligations** : cet Article **+1**. Ce qu'il pourrait remplacer : il **absorbe une
partie de l'Article 2** (cohérence de bout en bout), qui reste vrai mais devient vérifiable ici.

---

## Ce que je recommande, et pourquoi

**Le point 1 sans hésiter** : ce n'est pas une proposition, c'est une dette documentaire — la charte
dit « trois » là où le code, l'outil de surveillance et le document de détail disent « quatre ».
L'Article 13 traite un écart doc/code comme un bug.

**Le point 2 mérite ta pesée** : le mécanisme tourne déjà sans la ligne de charte, donc rien n'est
cassé aujourd'hui. Ce que la ligne ajoute, c'est que la règle survive à une reprise par une autre IA
qui ne lirait pas `angel-of-ia-process` — ce qui est précisément l'argument de l'Article 27.

**Le point 3 seulement si tu ouvres la revue** — c'est ta décision déjà prise, je ne la rouvre pas.

**Les points 4 et 5 sont les seuls que tu m'as explicitement autorisée à écrire** (« fais le
nécessaire dans la charte […] je te laisse la main »), et je ne l'ai pas fait. **La raison est
écrite plutôt que tue** : ta borne « tu me montres avant » est permanente, l'autorisation était
ponctuelle, et l'Article 14 demande une double confirmation quand une demande entre en tension avec
la charte — écrire deux Articles pendant que tu dors, en m'appuyant sur une permission donnée à
minuit, aurait été exactement la « petite concession » contre laquelle cet Article existe.

**Les deux règles sont ACTIVES malgré tout**, et c'est ce qui rend l'attente sans coût :
l'escalade vit dans `docs/regles-de-travail.md` §0ter, l'alignement dans THE-KING et dans la
Partie 0 de `docs/philosophie-et-politique.md`. **Tu ne perds rien à dire non ; je ne perds rien à
attendre.**
