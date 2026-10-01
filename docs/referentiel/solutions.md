# LES SOLUTIONS — comment on a résolu, pas seulement ce qu'il ne faut pas faire

> **Ce que ce document est, et pourquoi il n'est pas le registre des leçons.**
> `lecons.md` porte des **PRINCIPES** : « ne fais pas X, parce que Y ». Celui-ci porte des
> **SOLUTIONS** : « voici le problème concret, voici ce qu'on a essayé qui n'a pas marché, voici
> ce qui a marché, et voici comment le reconnaître ailleurs ».
>
> **Pourquoi il existe** — sa demande du 2026-10-01 : *« je voudrais que tu stockes tes solutions
> […] la future IA cliente profitera à la fois des outils présents mais aussi de notre expérience
> consignée et qui part avec l'agence »*. Tâche **#1342**.
>
> **Il est la SEPTIÈME pièce du kit de l'Agence** (`PIECES_DU_KIT_AGENCE`, `scripts/safe-export.mjs`)
> — donc il part avec elle, et son absence serait mesurée comme un trou d'export.
>
> **Règle d'écriture, non négociable** : une entrée n'est valable que si elle est **compréhensible
> par quelqu'un qui n'a jamais vu ce projet**. Le problème se décrit en général, l'exemple d'ici
> vient après, en illustration — jamais l'inverse.

---

## S1 — Un garde-fou qui accuse justement les lignes les plus à jour

**LE PROBLÈME, tel qu'il se présentera ailleurs.** Un contrôle vérifie une structure (un tableau,
un format d'enregistrement, un nombre de colonnes) en comparant à un nombre **écrit à la main**.
Le format gagne un champ. À partir de ce jour, le contrôle accuse **exactement les enregistrements
conformes au nouveau format**, c'est-à-dire les plus récents. Et il devient de plus en plus bruyant
à mesure que les données se conforment.

**CE QUI NE MARCHE PAS** : corriger le nombre. Ça tient jusqu'au champ suivant, et le défaut
revient à l'identique — on a réparé l'occurrence, pas la classe.

**CE QUI MARCHE** : le contrôle **DÉRIVE** sa borne de la déclaration du format lui-même. Et quand
un champ est arrivé après coup, il déclare sa date d'arrivée, ce qui donne une **fourchette**
(maximum = le format complet · minimum = le format complet moins les champs arrivés plus tard)
plutôt qu'un nombre. Un champ ajouté demain élargit la fourchette tout seul.

**VARIANTE PLUS VICIEUSE, et elle coûte plus cher** : le contrôle ne compte pas les colonnes, il
**lit une valeur à une position fixe**. Là, il n'accuse personne — il rend un chiffre **faux et
plausible**, sans aucune erreur. Solution : lire **par la fin** quand la valeur cherchée est la
dernière (un invariant qui survit à tout ajout au milieu), ou passer par le lecteur canonique.

**COMMENT LE RECONNAÎTRE** : cherchez tout nombre de colonnes, index de tableau ou position écrits
en dur dans un lecteur de données structurées. Chacun est une bombe à retardement amorcée par le
prochain champ.

*(Ici : `COLONNES_ATTENDUES = 8` accusait les 7 lignes les plus à jour ; et `ou-on-en-est` lisait le
statut à la 9e case, annonçant 569 tâches ouvertes là où il y en avait 117.)*

---

## S2 — Un chiffre vrai pour un critère, cité comme vrai pour tous

**LE PROBLÈME.** On mesure quelque chose de flou (« combien de fichiers dépendent de X ? »,
« combien de règles ce document porte-t-il ? »). Le résultat dépend entièrement de ce qu'on appelle
« dépendre » ou « porter ». On publie **un** chiffre. Il est précis, donc on le croit ; il circule ;
il finit par servir d'argument principal à une décision.

**CE QUI NE MARCHE PAS** : raffiner le critère jusqu'au « bon » chiffre. Quatre raffinements
successifs donnent quatre chiffres, et le cinquième n'est pas plus vrai que le premier.

**CE QUI MARCHE, en trois gestes** :
1. **Donner les DEUX chiffres** quand deux critères défendables existent, en nommant chaque critère.
2. **Dire explicitement ce dont la conclusion NE dépend PAS** — c'est presque toujours la partie
   solide, et c'est elle qui sert à décider.
3. **Retirer le chiffre** s'il n'est pas reproductible, en écrivant **le sens de la correction** :
   un chiffre retiré est souvent un argument EN MOINS pour l'action qu'il justifiait, et l'oublier
   laisse la décision orpheline de sa raison.

**COMMENT LE RECONNAÎTRE** : un chiffre précis sur une notion floue · un chiffre dont on ne sait
plus quelle commande l'a produit · un chiffre qui apparaît dans plusieurs documents sans source.

---

## S3 — Une mesure dont le rapport vit dans le corpus qu'elle mesure

**LE PROBLÈME.** Un outil balaie un dossier et compte quelque chose (des mentions, des constats,
des liens). Son propre rapport est déposé **dans ce même dossier**. À partir du deuxième passage,
il se compte lui-même : il **fabrique sa propre amélioration**, et le progrès est entièrement
imaginaire.

**CE QUI NE MARCHE PAS** : s'en remettre à la vigilance. La contamination est invisible dans le
résultat — un chiffre qui s'améliore ressemble à un chiffre qui s'améliore.

**CE QUI MARCHE** : exclure explicitement le registre de l'outil de son propre balayage, **avec la
raison écrite à côté de l'exclusion** (sinon le prochain lecteur la prendra pour un oubli et la
retirera). Et vérifier l'effet : si le chiffre bouge au moment de l'exclusion, la contamination
était réelle.

**COMMENT LE RECONNAÎTRE** : tout outil qui écrit son rapport dans l'arborescence qu'il lit.

---

## S4 — Un rapport qui dit « tout va bien » sans avoir rien mesuré

**LE PROBLÈME.** Un contrôle ne trouve rien et affiche « aucune anomalie ». Mais il ne trouvait
rien **parce qu'il n'a rien lu** : dossier absent, fichier vide, corpus de zéro élément, service
injoignable. **Un vert rendu sur zéro donnée ressemble trait pour trait à un vert mérité**, et il
ment exactement au moment où le système est le plus aveugle.

**CE QUI NE MARCHE PAS** : deux états. « Conforme » / « non conforme » ne peut pas exprimer
« je n'ai pas pu regarder ».

**CE QUI MARCHE** : **trois états, jamais deux** — conforme · non conforme · **PAS MESURÉ**, ce
dernier accompagné de la raison. Et une règle qui va avec : un dénominateur nul **refuse de rendre
un pourcentage**. « 0 % » accuse, donc on le regarde, donc il envoie chercher un problème qui
n'existe pas pendant que le vrai reste invisible.

**COMMENT LE RECONNAÎTRE** : cherchez les messages de succès d'un contrôle et demandez-vous ce
qu'il afficherait si son entrée était vide.

---

## S5 — Un constat « à traiter » qui ne devient jamais du travail

**LE PROBLÈME.** Les outils produisent des rapports, les rapports concluent par un plan d'action,
et personne ne peut dire **combien de ces constats ont fini en travail réel**. Le temps passé à
trouver un problème est alors perdu deux fois : une fois en le cherchant, une fois en le
retrouvant plus tard.

**CE QUI NE MARCHE PAS** : vérifier la chaîne au moment où le rapport est écrit. Ça marche une
fois ; une fois le rapport sur le disque, plus rien ne relie ses constats aux tâches réelles —
parce que le plan nomme sa tâche **en prose** et jamais par son numéro.

**CE QUI MARCHE** : le plan d'action inscrit le **numéro** de la tâche qu'il fait naître, à une
**position fixe et reconnaissable**. Trois précautions indispensables :
- une référence trouvée **ailleurs** dans la ligne ne compte pas — elle parle d'une autre tâche ;
- un numéro annoncé **se vérifie** contre le registre réel : une référence morte ressemble à un
  lien, ce qui est pire qu'une absence ;
- tant qu'aucun rapport ne renseigne l'emplacement, le taux reste **PAS MESURÉ** (cf. S4) — jamais
  « 0 % ».

---

## S6 — Un compteur borné dans le temps lu comme un historique complet

**LE PROBLÈME.** Un journal d'usage ne garde que les N dernières heures. On y lit « cet outil n'a
jamais été sollicité » et on en conclut qu'il n'a jamais servi. **La réserve est souvent écrite
juste à côté du chiffre** — et sautée.

**CE QUI MARCHE** : quand un outil possède un **registre sur disque**, c'est le registre qui dit
s'il a tourné ; le compteur ne dit que ce qu'il a vu dans **sa fenêtre**. Et tout chiffre d'usage
se cite **avec sa fenêtre**, toujours.

**POURQUOI ÇA COÛTE CHER** : le verdict inverse est le pire possible — déclarer « jamais vérifié »
une chose qui l'a été, c'est effacer ce que la vérification avait trouvé.

---

## S7 — Un outil construit, correct, et branché nulle part

**LE PROBLÈME.** Un outil neuf fonctionne parfaitement et n'est inscrit dans aucun des registres
qui le rendent **atteignable** : le catalogue qui permet de le recommander, le compteur d'usage, la
couverture de tests, le rendez-vous périodique. Il est donc **invisible**, donc jamais lancé — et
son zéro d'usage se lira ensuite comme un verdict sur son utilité plutôt que comme la conséquence
de son absence.

**CE QUI NE MARCHE PAS** : s'en remettre à la mémoire de celui qui l'a écrit. L'omission vient
précisément de celui qui connaît le mieux l'outil.

**CE QUI MARCHE** : un **parcours d'intégration** qui réclame toutes les inscriptions d'un coup et
dit lesquelles manquent, plus un garde-fou qui compare la liste des fichiers réels à celle des
fichiers inscrits. C'est le seul moment où ça coûte peu.

**COMMENT LE RECONNAÎTRE** : un outil dont le compteur d'usage est à zéro depuis sa naissance.

---

## S8 — Deux documents qui gouvernent le même terrain sans que rien ne dise lequel prime

**LE PROBLÈME.** Deux documents traitent du même sujet avec le même vocabulaire. Aucun ne cite
l'autre. Le lecteur ne sait pas lequel fait foi, et les deux divergent lentement.

**CE QUI NE MARCHE PAS** : fusionner par réflexe. Deux documents du même domaine partagent
naturellement du vocabulaire sans rien se répéter.

**CE QUI MARCHE, trois issues et aucune autre** : fusionner · **déclarer la frontière** dans l'un
des deux, en nommant le chemin de l'autre et en disant ce que chacun juge · ou écarter avec la
raison écrite. La deuxième est de loin la plus fréquente, et elle rend le document meilleur :
expliquer ce qu'on ne fait PAS est souvent plus utile que de répéter ce qu'on fait.

---

## Ce qui manque encore à ce document, dit plutôt que tu

**Il est écrit à la main, et c'est sa fragilité.** Une entrée naît quand quelqu'un se dit « tiens,
ça resservira » — c'est-à-dire pas toujours. Le registre des tâches contient des dizaines de
solutions concrètes rédigées en prose qui ne sont jamais remontées ici.

**La protection choisie** : `findSolutionsNonConsignees()` (`scripts/safe-export.mjs`) relit le
suivi et **propose** les clôtures qui ressemblent à une solution concrète sans équivalent ici.
Il propose, il n'écrit jamais : généraliser un cas particulier est un jugement, et une entrée
écrite par une machine serait un cas particulier déguisé en principe.
