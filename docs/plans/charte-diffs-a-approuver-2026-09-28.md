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

## Ce que je recommande, et pourquoi

**Le point 1 sans hésiter** : ce n'est pas une proposition, c'est une dette documentaire — la charte
dit « trois » là où le code, l'outil de surveillance et le document de détail disent « quatre ».
L'Article 13 traite un écart doc/code comme un bug.

**Le point 2 mérite ta pesée** : le mécanisme tourne déjà sans la ligne de charte, donc rien n'est
cassé aujourd'hui. Ce que la ligne ajoute, c'est que la règle survive à une reprise par une autre IA
qui ne lirait pas `angel-of-ia-process` — ce qui est précisément l'argument de l'Article 27.

**Le point 3 seulement si tu ouvres la revue** — c'est ta décision déjà prise, je ne la rouvre pas.
