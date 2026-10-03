# Les modifications de CLAUDE.md qui attendent ton accord

<!-- ARBORESCENCE — bloc généré par `node scripts/the-king.mjs cascade --inserer`, ne pas éditer à la main -->

**Où ce document se situe dans la cascade** — remonté des déclarations « DÉCOULE DE » réelles, jamais dessiné à la main :

```
philosophie-et-politique
    └── strategies/strategie-globale-du-projet-entier
        └── strategies/charte-et-referentiel-strategie
            └── ▣ plans/charte-diffs-a-approuver-2026-09-28   ← CE DOCUMENT
                (aucun document ne déclare découler de celui-ci)
```

<!-- /ARBORESCENCE -->

> **DÉCOULE DE :** `docs/strategies/charte-et-referentiel-strategie.md`
> *(Déclaré le 2026-09-29, tâche #1178 — il ne contient que des diffs de CLAUDE.md en attente de son accord.
> Il passait pour déclaré à ma première passe : une ligne plus bas CITE la syntaxe `DÉCOULE DE` pour
> l'expliquer, et mon contrôle a pris la MENTION pour la déclaration. Exactement le défaut que ce
> dépôt corrige partout ailleurs, commis dans le geste qui le corrigeait.)*

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

## 6. LA MESURE AVANT L'OPINION — ton GO est donné, voici le texte *(tâche #767, nuit du 2026-09-29)*

**Tu as dit oui, et je ne rouvre pas la décision.** Ce qui suit est le texte, plus une question de
séquence que je te dois parce qu'elle est née APRÈS ton accord.

**Ce qui la réclame, et ce sont trois sources indépendantes** : JESUS l'a proposée le 2026-09-24 ;
un de tes documents Copilot la formule dans ses propres mots ; et le test des cinq impossibles,
appliqué à nous-mêmes, a trouvé que **quatorze de nos vingt refus disent la même chose** sans
qu'aucun Article ne la formule.

**Texte proposé** *(il prendrait le numéro suivant, à la suite de la liste — jamais inséré au
milieu)* :

> **LA MESURE AVANT L'OPINION.**
>
> **Ne jamais laisser passer pour un fait ce qui n'en est pas un.** Une date supposée, un chiffre
> jamais compté, une confiance sans raison, un zéro qui veut dire « je n'ai pas regardé », un
> accord qui ressemble à une réponse : chacun de ces cinq coûte plus cher qu'une ignorance
> déclarée, parce qu'une ignorance déclarée se répare et qu'un faux fait se propage.
>
> **Les trois obligations.** ① Toute affirmation qui porte une décision dit d'où elle vient —
> mesurée, lue, ou supposée, et le mot est écrit. ② Une absence de mesure se dit « PAS MESURÉ »,
> jamais « rien trouvé » : les deux se ressemblent et n'ont pas le même sens. ③ Un écart entre ce
> qu'on croyait et ce qu'on a mesuré se dit explicitement, jamais corrigé en silence.
>
> **Ce qu'elle n'exige pas** : tout mesurer. Un avis reste un avis légitime — il doit seulement
> être signalé comme tel.

**Coût : trois obligations de plus.** Je te le dis net plutôt que de le noyer.

### LA QUESTION DE SÉQUENCE, ET ELLE EST RÉELLE

**Ton GO est arrivé AVANT ta cible de 50 obligations, dans la même soirée.** Les deux vont en sens
contraire : celui-ci en ajoute trois, celle-là veut en retirer quarante-trois. Ce n'est pas une
contradiction — trois contre quarante-trois ne décide de rien — mais l'ORDRE compte :

- **Si on l'écrit maintenant**, il faudra le relire pendant la réduction, et une règle écrite puis
  aussitôt rouverte est exactement le « faire puis défaire » que tu as interdit ce soir.
- **Si on l'écrit à la fin de la réduction**, il arrive dans une charte déjà rangée, et il peut
  même servir de tête de chapitre aux Articles qui en découlent.

**Ce que je recommande : à la fin, et pas par prudence.** Cet Article dit « la mesure avant
l'opinion » ; l'écrire avant d'avoir mesuré ce que la réduction laisse debout serait le seul
endroit du projet où on l'appliquerait à l'envers.

**Ce que ça ne coûte pas d'attendre** : la règle est DÉJÀ vivante. Les cinq impossibles la
portent, les rapports distinguent déjà « PAS MESURÉ » de « rien trouvé », et AGENT-DU-TEMPS imprime
sa source à chaque passage. Tu ne perds rien à ce qu'elle attende son tour ; elle ne perd rien non
plus.

**Dis-moi simplement « maintenant » si tu préfères l'inverse — c'est ta charte.**

---

## 7. LE CHIFFRE QUE LA CHARTE DIT DE SURVEILLER A ÉTÉ SURVEILLÉ *(tâche #1273, nuit du 2026-09-30)*

**Personne ne me l'a demandé : la charte le demande elle-même.** Elle écrit que les 86,6 % de
tâches hors jeu sont *« un chiffre à surveiller, parce qu'un des deux projets pourrait étouffer
l'autre »*. Il datait du **2026-09-22** et n'avait pas été repris depuis.

**Aujourd'hui (CLAUDE.md) :**

> Le chiffre qui le montre — 86,6 % des tâches (323 sur 373, mesuré le 2026-09-22) ne touchent pas
> au jeu — n'est donc pas l'anomalie qu'il paraît être […]

**Proposé :**

> Le chiffre qui le montre — **95 % des tâches (524 sur 550, mesuré le 2026-09-30)** ne touchent
> pas au jeu — n'est donc pas l'anomalie qu'il paraît être […] **Mesuré avec un seul et même
> classeur des deux côtés du registre, la part du jeu est STABLE : 4,0 % sur la première moitié,
> 5,5 % sur la seconde. Le projet ne dérive pas ; il n'a jamais été autrement.**

### CE QUE LA MESURE A TROUVÉ, ET L'ESSENTIEL EST LA SECONDE LIGNE

**① Le rapprochement brut aurait été alarmant, et FAUX.** 86,6 % en septembre contre 95,3 %
aujourd'hui donnerait l'impression d'un jeu qu'on abandonne. **C'est un artefact** : mon classeur
n'est pas celui de septembre — il compte 26 tâches « jeu » là où l'ancien en comptait 50. La
preuve est arithmétique et je la donne plutôt que de la taire : le calcul rendait **113,6 % de
tâches hors jeu sur la période récente**, ce qui est impossible. **Un chiffre impossible est un
cadeau : il dit tout haut que les deux mesures ne comparent pas la même chose.**

**② Avec UN SEUL classeur appliqué de part et d'autre, la réponse est nette et rassurante :**

| | Part du jeu |
|---|---|
| première moitié du registre (275 tâches) | **4,0 %** |
| seconde moitié du registre (275 tâches) | **5,5 %** |

**La part du jeu ne baisse pas. Elle monte légèrement.** L'inquiétude que la charte formule —
*un des deux projets pourrait étouffer l'autre* — **ne se vérifie pas dans les chiffres.**

**③ Le rapport de CODE, lui, se mesure sans proxy** : le jeu ≈ **4 415 lignes**, l'outillage
**89 344** — **un pour vingt**. C'est le vrai chiffre à regarder, et il ne dit pas que le jeu est
négligé : il dit que le jeu est **petit**, ce qui n'est pas la même chose.

**Coût en obligations : zéro.** C'est un chiffre mis à jour, pas une règle ajoutée.

**Ce que je ne fais pas** : appliquer. Ta borne « tu me montres avant » couvre toute modification
de CLAUDE.md, y compris celle qui ne fait que rafraîchir un nombre.

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

**Le point 7 est le plus facile de tous, et c'est le seul que je te conseille de trancher tout de
suite** : il ne change aucune règle, il rafraîchit un nombre que la charte demande elle-même de
surveiller, et la nouvelle mesure est rassurante — la part du jeu est STABLE, pas en chute.

**Le point 6 est le seul que tu aies déjà approuvé**, et c'est pour ça que je ne le propose pas :
je le SÉQUENCE. Mon conseil est de l'écrire à la fin de la réduction des obligations plutôt que
maintenant, et la raison est dans l'Article lui-même — mesurer avant d'affirmer. Un mot de toi
suffit à inverser ça.

**Les deux règles sont ACTIVES malgré tout**, et c'est ce qui rend l'attente sans coût :
l'escalade vit dans `docs/regles-de-travail.md` §0ter, l'alignement dans THE-KING et dans la
Partie 0 de `docs/philosophie-et-politique.md`. **Tu ne perds rien à dire non ; je ne perds rien à
attendre.**
