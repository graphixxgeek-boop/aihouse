# Réponses à ton gros prompt du 2 octobre

> **De quoi on parle.** Tu m'as envoyé en copier-coller un prompt qui contient tes réponses à tous
> les documents que je t'avais livrés, plus de nouvelles remarques et de nouvelles questions.
> **Ta demande :** y répondre point par point, les réponses rapides d'abord et les chantiers
> ensuite — c'est l'ordre que tu as choisi en fenêtre.
> **Tâches concernées :** #1472 (zéro sauvegarde conservée) · #1473 (la Ronde te demande ce que tu
> as reçu) · #1475 (le détecteur de documents jamais envoyés) · #1476 à #1479 (ouvertes par ce
> document) · et les chantiers #1480 à #1482.

---

## CE QUE CE DOCUMENT COUVRE, ET CE QU'IL NE COUVRE PAS

**43 questions comptées dans ton prompt · 30 blocs de réponse · 4 regroupements déclarés ·
4 questions qui te reviennent.**

Le compte se décompose pour que tu puisses le vérifier : 1 sur ton reproche final · 7 sur tes
nouvelles remarques · 4 sur le document des 11 destinations · 18 sur la suite de tes réponses ·
13 absorbées par les trois chantiers. Les **quatre regroupements** sont la licence (2 questions
qui n'en font qu'une), les documents que tu dis ne pas avoir vus (5), le chantier des fils (6) et
le chantier du filet (4) — chacun dit lesquelles il couvre, à l'endroit où il répond.

Pourquoi ce compte est là plutôt qu'une promesse d'exhaustivité : sans lui, une question absorbée
disparaît sans que personne puisse le voir, et c'est exactement ce que tu redoutes quand tu
demandes du point par point. **Si tu en comptes une de plus que moi, dis-le — c'est qu'elle a
été absorbée en silence.**

**Les trois chantiers que tu as mis après** — le système de fils, la séparation agence/utilisateur,
et le filet transporté — ne sont pas traités ici : ils demandent chacun un vrai dossier, et les
bâcler en trois paragraphes serait pire que les reporter. Ils sont ouverts comme tâches, et je
commence par le premier dès ce document livré.

---

# ① D'ABORD : TON REPROCHE DE LA FIN, PARCE QU'IL COMMANDE TOUT LE RESTE

> « quelque chose ne va pas : tu avances sur des sujets mais tu ne me fais pas profiter des
> resultats. […] ca me donne l'impression que tu travailles DE TON COTE et que le projet
> M'ECHAPPE : trouve une solution pour corriger ca stp. »

**Tu as raison, et le défaut est pire que ce que tu décris.** Tu as cité quatre documents. J'en ai
cherché la trace mécaniquement, et voici ce que ça donne :

| Ce que tu réclames | Ce que le dépôt contient vraiment |
|---|---|
| La carte des modules actuelle vs cible | `docs/referentiel/carte-cible-des-modules.html` **existe**, écrite hier soir — jamais envoyée |
| L'organisation des lois | `docs/referentiel/organisation-des-lois.html` **existe** — jamais envoyée |
| La thèse « le cœur, c'est la gouvernance » | `docs/the-king/these-du-coeur-2026-10-02.txt` **existe**, en texte brut — jamais envoyée, jamais mise en page |
| #1110, l'arborescence du GRAND PROJET | le dossier `docs/grand-projet/04-arborescence-des-taches/` est **VIDE**. Rien n'a été produit. J'ai écrit « en cours, reprise juste après ce rapport » et je ne l'ai jamais reprise |
| La liste de ce qui n'est pas rationalisable | **le mot n'apparaît dans aucun document du dépôt.** J'ai écrit « la liste existe en partie » et c'était faux |

**Donc deux fautes distinctes, pas une :** trois documents écrits et gardés sur disque, et deux
sujets que j'ai présentés comme avancés alors que l'un est vide et l'autre n'existe pas. La seconde
est la plus grave : un document non envoyé se rattrape en une minute, une fausse déclaration
d'avancement te fait attendre quelque chose qui ne vient pas.

## Ce que j'ai construit, plutôt que de te promettre de mieux faire

**Un registre des remises, et un détecteur de ce qui n'y figure pas.** C'est le mécanisme que
j'avais écrit avant-hier pour les sauvegardes, étendu du fichier `.zip` au DOCUMENT — dans ce
projet, un nouveau venu hérite de ce que l'équipe sait déjà faire.

| Commande | Ce qu'elle fait |
|---|---|
| `node scripts/data-archangel.mjs livraisons` | liste les documents écrits pour toi qui n'ont **aucune marque d'envoi** |
| `… livraisons --remis <fichier> --quand <heure lue>` | enregistre un envoi, **après** qu'il ait réussi |

**Il est branché à trois endroits**, parce qu'un outil qu'on doit penser à lancer est un outil
qu'on oubliera :

1. **À la fin de chaque compte rendu de travail** — une règle de conduite surveillée (`angel`)
   demande : pour chaque document sans marque, l'as-tu reçu, ou dis pourquoi il ne t'est pas
   destiné. « Je n'ai pas regardé » n'est pas une réponse acceptée.
2. **À la Ronde**, dans une nouvelle étape de questions qui te demande ce que tu as réellement reçu.
3. **Dans le filet de sécurité**, qui vérifie que le détecteur attrape bien un document neuf et
   n'accuse pas un document déjà envoyé.

**Un défaut trouvé en le lançant pour de vrai, et il vaut d'être dit** : à son premier passage il a
accusé **64 documents sur 64** — y compris ceux que tu avais lus et commentés le matin même.
« Aucune marque » ne veut pas dire « jamais envoyé » ; avant la naissance du registre, ça veut dire
**on ne sait pas**. Le registre porte donc sa date de naissance, et tout ce qui la précède est
compté à part, en toutes lettres, au lieu d'être accusé à tort.

**Sa limite, dite d'emblée :** aucun code de ce dépôt ne peut voir que tu as TÉLÉCHARGÉ quelque
chose. Il mesure l'ENVOI par moi, jamais la lecture par toi. C'est la moitié attrapable — et c'est
exactement celle qui a manqué les quatre fois que tu cites : les documents étaient là, personne ne
les avait envoyés. L'autre moitié, c'est la question posée à chaque Ronde.

> **ACTION — RETENU.** Tâche #1475, faite. Les cinq documents ci-dessus partent avec ce dossier.

---

# ② LES RÉPONSES RAPIDES

## Les sauvegardes ZIP — ta décision est appliquée *(couvre ta question 1)*

> « NON on ne garde rien, si j'ai oublié de telecharger la derniere version, il vaut mieux que tu
> en generes une nouvelle : l'autre est déjà périmée. En plus c'est pas trop long à generer.
> QU'en pense-tu ? »

**Ce que j'en pense : ton raisonnement est meilleur que le mien, et pour une raison précise.** Je
proposais d'en garder une « au cas où ». Mais une sauvegarde que tu n'as pas téléchargée est, par
construction, la photo d'un état déjà dépassé — la garder ne te protège de rien, elle te donne
l'impression d'un filet. En régénérer une coûte une trentaine de secondes et elle est à jour.

**Appliqué, et pas par une commande de ménage** : l'envoi EFFACE désormais l'archive. Une commande
de nettoyage serait un geste qu'il faut penser à faire, donc un geste oublié. En l'attachant à
l'envoi, « livré » et « effacé » deviennent le même événement.

**État réel maintenant : `docs/sauvegardes` pèse 0,0 Mo** (contre 32 Mo avant-hier). Ce qui survit
est la LIGNE du registre, versionnée : on saura toujours ce qui t'a été remis et quand, même quand
plus aucun coffre n'existe.

> **ACTION — RETENU.** Tâche #1472, faite.

## Détecter l'ORDRE des événements *(ta question 2 : facile ? utile ? déjà en place ?)*

**Déjà en place : à moitié, et pour un seul cas.** Un garde-fou refuse mécaniquement une ligne de
suivi datée dans le futur. C'est bien une règle d'ordre, mais une seule : « cet événement ne peut
pas être après maintenant ».

**Ce qui n'existe pas** : rien ne vérifie l'ordre d'une SÉQUENCE. Trois exemples réels de ce projet
où l'ordre est la règle et où rien ne la garde :

- l'envoi doit précéder l'effacement de la sauvegarde (sinon on détruit un fichier jamais parti) ;
- les dix questions d'alignement doivent précéder l'enregistrement de la Ronde (sinon elles sont
  reportées à la suivante, indéfiniment) ;
- la prédiction doit précéder la réponse (sinon on relit sa réponse en se disant « c'est bien ce
  que je pensais », et l'écart disparaît).

Dans les trois cas, l'ordre est aujourd'hui garanti par du code écrit exprès pour chacun, jamais
par un mécanisme commun.

**Facile à faire ?** Oui pour tout ce qui est horodaté (comparer deux dates est trivial). Non pour
le reste : savoir que « la prédiction a été écrite avant la réponse » suppose que les deux soient
enregistrées séparément et datées, ce qui est un changement de forme dans chaque registre concerné.

**Utile ?** Mon avis, et ce n'est qu'un avis : **moyennement, et pas tout de suite.** Les trois cas
ci-dessus sont déjà couverts individuellement. Un mécanisme général n'apporterait qu'au quatrième
cas, qui n'existe pas encore. Je le noterais comme une idée à ressortir quand un quatrième cas
apparaîtra — pas comme un chantier à ouvrir maintenant.

> **ACTION — À TRANCHER.** Tu veux que je l'ouvre maintenant, ou que je le range comme idée en
> attente d'un quatrième cas ? Mon conseil : la seconde.

## Le PACK DÉCOUVERTE — à quel contexte il appartient *(ta question 3)*

**Il vient de ta COMMANDE IMPORTANTE du 28 septembre**, le gros document que tu as déposé pour
lancer le grand projet. Tes mots :

> « LE "PACK DECOUVERTE AGENCE" c'est : 1 DOC VERSION "ADMIN" (une page HTML) + 1 DOC VERSION
> "COMMERCIALISABLE" […] + 1 DOC (6-8 PAGES HTML) DE PRESENTATION DE L'AGENCE […] + POSSIBILITE
> D'OBTENIR UN DES DOCS DE LA LISTE SUR DEMANDE. »

**À quoi il sert, dans tes mots** : « permet de découvrir l'agence, de la faire découvrir à un
utilisateur, ou à une IA, ou à moi, en tant que "projet" et non "produit fini" ». Il répond à :
qu'est-ce que l'Agence, à quoi elle sert, comment elle fonctionne, quels outils.

**Où ça en est** : une seule tâche le porte, **#1136** (28 septembre), et elle est **ouverte**.
Rien n'a été produit. Tu avais aussi laissé deux questions en suspens dedans, qui attendent
toujours : le nombre de pages (6-8 à confirmer) et **qui le porte — Cassandra ou Inès plutôt que
The-King**.

> **ACTION — RETENU.** Tâche **#1476** : faire le point complet sur le PACK DÉCOUVERTE (ce que ta
> commande demande exactement, ce qui existe déjà et pourrait y entrer, ce qui manque), et te
> reposer les deux questions laissées ouvertes.

## La rationalisation par « PACK » *(ta question 4 — une idée, pas une question)*

**Idée notée, et elle est bonne pour une raison que tu n'as peut-être pas en tête** : le dépôt
compte aujourd'hui **126 fichiers dans le référentiel seul**. Regrouper par « pack » ne sert pas
qu'à comprendre — ça donne un critère d'élagage qui n'existe pas aujourd'hui : *un document qui
n'entre dans aucun pack n'a probablement plus de raison d'être.* C'est un test, là où « est-ce
encore utile ? » n'en est pas un.

> **ACTION — RETENU.** Inscrite au chantier rationalisation (tâche **#1477**), pas traitée
> maintenant.

## L'état des lieux du GRAND CHANGEMENT, avec un tableau *(ta question 5)*

**Je ne te le donne pas dans ce document, et je te dis franchement pourquoi** : tu demandes un
tableau de ce qui est fait / en cours / à faire, en t'appuyant sur « le doc arborescence ». Or
c'est précisément ce document-là qui est **VIDE** (`docs/grand-projet/04-arborescence-des-taches/`).
Fabriquer le tableau de mémoire serait exactement la faute que tu viens de me reprocher.

**Ce que je fais à la place** : l'arborescence des tâches du grand projet est à produire pour de
vrai (c'est #1110, rouverte), et l'état des lieux en sort mécaniquement — pas l'inverse.

> **ACTION — RETENU.** Tâche **#1478** : produire l'arborescence #1110 pour de vrai, puis l'état
> des lieux avec son tableau. Livré en HTML.

## Des outils réduits en EXTENSION d'un autre *(ta question 6)*

**Oui, c'est possible, et c'est même ce qui vient d'être fait deux fois aujourd'hui** :

- le détecteur de documents non envoyés n'est PAS un outil : c'est une extension de data-archangel
  (qui veille déjà sur la circulation des données) ;
- l'étape de confirmation à la Ronde n'est pas un outil non plus : c'est une ligne de plus dans
  l'inventaire de questions existant.

**C'est d'ailleurs la règle écrite** : avant d'agir, on demande à tool-brain qui sait déjà faire
ça ; si un outil couvre à moitié, **on l'étend** ; on ne construit que si personne ne sait faire.

**Ce que je ne fais pas sans toi** : passer le paysage en revue pour désigner les candidats. Tu l'as
demandé explicitement — « toujours me demander avant d'agir, mais check stp ». Le check demande de
relire chaque outil, donc c'est un vrai passage, pas une réponse de tête.

> **ACTION — RETENU.** Tâche **#1479** : passer les outils en revue et te rendre une liste de
> candidats « réductible en extension de X », avec pour chacun ce qu'on gagne et ce qu'on perd.
> **Aucun regroupement ne sera fait sans ton accord.**

## Un marqueur « lu par moi » quand un doc est TÉLÉCHARGÉ *(ta question 8)*

**Non, c'est techniquement impossible de ce côté-ci, et il faut que ce soit clair.** Rien dans ce
dépôt ni dans ce conteneur ne peut observer un téléchargement : le fichier part, et ce qui se passe
ensuite est dans ton navigateur, pas dans le projet.

**Ce que j'ai fait à la place, en deux moitiés** :

- la moitié mécanique : le registre des envois ci-dessus — il sait dire « ce document ne t'a jamais
  été ENVOYÉ », ce qui est le cas qui a réellement foiré quatre fois ;
- la moitié humaine : **une question à chaque Ronde**, exactement comme tu l'as demandé — « LE
  MIEUX EST DE ME POSER UNE FENETRE DE QUESTION A LA FIN POUR ETRE SUR ». Elle est maintenant une
  étape déclarée du process, donc l'oublier est détecté comme n'importe quelle étape sautée.

> **ACTION — RETENU.** Tâche #1473, faite.

---

# ③ TES RÉPONSES AU DOCUMENT « LES 11 DESTINATIONS D'UNE NOTE »

## « le présent document ? » — qu'est-ce que je voulais dire *(ta question 16)*

> « une consigne de travail, une méthode → **le présent document** → c'est ici que vit le COMMENT
> on travaille ensemble. » / Tu réponds : « qu'est-ce que tu veux dire ? je pensais plutôt à regles
> de travail ou un doc du genre ? »

**Tu as raison et c'était une maladresse d'écriture de ma part.** « Le présent document » voulait
dire `docs/regles-de-travail.md` — c'est bien celui-là. Je l'ai écrit comme ça parce que je
rédigeais à l'intérieur d'un tableau qui, à ce moment-là, était destiné à vivre dans ce
fichier-là ; sorti de son contexte, « le présent document » ne désigne plus rien. **La ligne doit
dire `docs/regles-de-travail.md`, en toutes lettres.**

> **ACTION — RETENU, corrigé dans la foulée.** C'est exactement le type de dette que la charte
> appelle « un nom propre sans définition atteignable ».

## Les « zones fragiles » — précise-moi ça *(ta question 17)*

> « une zone qu'on sait fragile → `docs/referentiel/points-fragiles.md` → pour que le prochain
> intervenant le sache avant d'y toucher, pas après. Precise moi ça stp je ne comprends pas tres
> bien »

**En clair, avec un exemple vrai.** Une « zone fragile », c'est un endroit du code dont on SAIT,
par expérience, qu'il casse facilement ou qu'il cache un piège — mais que rien dans le code lui-même
ne signale.

**Exemple réel de ce projet, et il m'est arrivé trois fois aujourd'hui** : certains fichiers
calculent les chemins depuis une racine, d'autres travaillent en chemins relatifs. Si on écrit le
mauvais des deux, **le code ne plante pas** : il renvoie une liste vide, et une liste vide ressemble
à « tout va bien ». Je me suis fait avoir trois fois dans la même journée, sur trois fichiers
différents.

**Ce que le registre des points fragiles sert à faire** : qu'un agent — moi demain, ou une autre IA
— lise « attention, ce fichier travaille en chemins relatifs » AVANT d'y toucher, pas après avoir
passé vingt minutes à comprendre pourquoi son résultat est vide.

**Ce que ce n'est pas** : ce n'est ni une liste de bugs (un bug se corrige, une fragilité se
signale), ni une liste de code moche. C'est une liste de **pièges connus**.

> **ACTION — ÉCARTÉ (rien à faire).** Ta question était une demande d'explication, pas un
> changement. Si après ça tu veux qu'on change la forme du registre, dis-le et on le fait.

## « Une note peut aller à deux endroits » — un système équivalent existe ? *(ta question 15)*

**Oui, et tu l'as repéré à juste titre.** Le suivi des tâches a déjà exactement ce mécanisme : une
ligne porte à la fois la DÉCISION (ce qui a été tranché) et son STATUT (ouverte / terminée). Une
décision qui ouvre une question est donc déjà naturellement à deux endroits : la décision dans sa
ligne, la question dans son statut « ouverte ».

**La différence avec les fils, et elle est réelle** : le suivi range par TÂCHE, le fil range par
SUJET. Une même question peut traverser six tâches ; dans le suivi elle apparaît six fois en
morceaux, dans un fil elle se lit d'un trait. Ce n'est pas une redondance, ce sont deux axes de
lecture du même fait.

**Mais ta question cache la vraie** : est-ce que ces deux systèmes se tiennent à jour l'un l'autre ?
**Non**, et c'est le chantier des fils ci-dessous.

## Git, et sa place par rapport à « sources » *(ta question 18)*

**Les deux ne jouent pas du tout le même rôle, et les confondre coûterait cher.**

| | **git** | **`docs/grand-projet/00-sources/`** |
|---|---|---|
| Ce que c'est | l'historique de TOUT le projet, chaque version de chaque fichier | un dossier ordinaire, DANS git, où vivent **les documents que TU as écrits** |
| À quoi ça sert | revenir en arrière, savoir qui a changé quoi et quand, et c'est **la vraie sauvegarde** | garder tes textes séparés de mes analyses, pour qu'on ne les confonde jamais |
| Qui écrit dedans | moi, à chaque enregistrement | toi (tes dépôts), moi quand je range un de tes envois |

**L'harmonie entre les deux, en une phrase** : `00-sources` est un dossier **comme un autre** du
point de vue de git — git le sauvegarde comme tout le reste. Ce qui le rend spécial n'est pas
technique, c'est une RÈGLE : ce qui est dedans vient de toi et **prime sur tout** ; ce qui est
ailleurs est de la matière que j'ai produite, et qui ne peut jamais corriger ta demande.

**Pourquoi je n'en ai pas parlé dans le document des 11 destinations** : ce document répondait à
« où RANGER une note », et git n'est pas un endroit où ranger — c'est ce qui garde tous les
endroits. C'était une omission légitime, mais tu as eu raison de la relever, parce qu'un lecteur qui
découvre le dépôt peut croire que « sources » est un système de sauvegarde parallèle. Ça ne l'est pas.

---

# ④ LA SUITE DE TES RÉPONSES

## CORRECTION = RÉVÉLATION *(ta question 26)*

Tu écris : « c'est une question qui n'a pas vraiment d'enjeu », et tu as raison, donc je fais court.
**Ce que tu voulais dire** : le passage de la révélation pointait des corrections à réaliser. **Ce
que j'avais compris** : tu me demandais si corriger et révéler étaient le même geste. Malentendu
levé, pas de suite.

> **ACTION — ÉCARTÉ**, par ton propre arbitrage.

## Le mot « intelligent » dans PHILO *(ta question 27)*

> « OK pour l'ajout du mot "intelligent", mais aussi : dans doc PHILO il fallait ajouter ces
> notions (coherence globale). Déjà fait ? »

**Non. Mesuré, pas supposé :** le document de philosophie et politique porte en annexe A un tableau
des mots d'ordre, et il en contient **TROIS** — FIABILISER, OPTIMISER, HARMONISER. Le quatrième,
**INTELLIGENT**, ajouté à la charte le 2 octobre sur ta demande, **n'y est pas**. Le mot
« cohérence » n'apparaît pas non plus dans ce tableau.

**C'est une dette au sens strict de la charte** : un changement de règle doit se refléter le jour
même dans tous les documents concernés, et celui-ci ne l'a pas été.

**Pourquoi je ne l'ai pas corrigé en le trouvant** : ce document est le texte de gouvernance, et il
ne se modifie pas sans ton accord exprès préalable — son propre article de révision l'interdit.
Voici donc le texte exact que je propose d'ajouter, pour que tu puisses dire oui ou non sans avoir
à l'écrire :

> | **INTELLIGENT** | est-ce bien pensé, pertinent, logique, cohérent — le chemin tient-il debout ? | la conception elle-même | *(article à fixer)* |
>
> *Les trois premiers constatent un RÉSULTAT ; celui-ci interroge le CHEMIN. Aucun des trois ne
> peut relever qu'un travail correct, complet et raccordé reste mal conçu.*

> **ACTION — À TRANCHER.** J'attends ton oui pour l'écrire. Tant qu'il n'est pas là, la charte et
> PHILO disent deux choses différentes, et c'est écrit ici pour que ça ne se perde pas.

## Les trois états de l'Article 28 — le contexte *(ta question 28)*

> « OK mais redonne moi le contexte parce que je n'ai pas bien compris »

**En clair, sans vocabulaire.** Tous les outils du projet produisent des rapports. Un rapport finit
par une liste de constats (« j'ai trouvé ceci »). La question que l'Article 28 pose est : **qu'est-ce
qu'on FAIT de chaque constat ?** — parce qu'un rapport lu puis oublié ressemble, dans le dépôt, à un
problème traité.

D'où l'obligation que chaque constat porte **son état**, et il n'y en a que quatre possibles :

| État | Ce que ça veut dire | Ce que ça oblige |
|---|---|---|
| **RETENU** | on va le faire | une vraie tâche doit exister dans le suivi — vérifié mécaniquement |
| **ÉCARTÉ** | on a regardé, on ne fait rien | **la raison doit être écrite** (sans raison, c'est un abandon déguisé) |
| **À TRANCHER** | ce n'est pas à moi de décider | la question te revient |
| **À INSTRUIRE** | la machine l'a vu, personne n'a encore vérifié si c'est fondé | **cet état se consomme** : il doit devenir l'un des trois autres |

**Ce qui a changé le 2 octobre, et c'est le « contexte » que tu demandes** : il n'y avait que les
TROIS premiers états. Un registre employait déjà, avec une bonne raison, un « à instruire, pas
encore acté » que les trois ne savaient pas nommer — il ne rentrait dans aucune case, donc il
sortait du dispositif. Tu as validé le quatrième en fenêtre dédiée, par deux fois, après avoir lu
le texte exact.

**Et la clause « il se consomme » est ce qui empêche le quatrième d'être un tiroir** : sans elle,
tout constat gênant finirait classé « à instruire » et le dispositif entier deviendrait décoratif.

**Ce que ça a donné concrètement** : les onze outils qui produisent un plan d'action savent
maintenant écrire les quatre états. Avant, ils n'en savaient écrire qu'un seul — « retenu » — ce
qui veut dire que *tout constat devenait une tâche obligatoire*, y compris ceux qui méritaient
d'être écartés. C'est ça, le changement.

## Les 4 clusters CLONE-HUNTER *(ta question 31)*

> « je ne comprends pas bien de quoi tu parles, si tu peux m'eclaircir »

**Le problème, en clair.** CLONE-HUNTER est l'outil qui repère les **blocs de code recopiés** : le
même morceau écrit deux fois à deux endroits. C'est une dette, parce qu'une correction apportée à
l'un sera oubliée dans l'autre.

**Mais tous les doublons ne sont pas des erreurs.** Parfois deux morceaux se ressemblent et doivent
**rester séparés** — parce que les fondre créerait une dépendance entre deux choses qui n'ont rien
à voir, ou parce qu'on l'a déjà essayé et que ça a cassé quelque chose.

**Le défaut qu'on a corrigé** : CLONE-HUNTER signalait neuf doublons à chaque passage, dont la
plupart étaient des **décisions assumées**. Un outil qui t'accuse neuf fois d'un geste normal cesse
d'être lu — c'est une leçon payée ici, L4.

**La correction** : l'outil cherche maintenant, dans les commentaires autour du code, une **raison
écrite** du type « ces deux-là restent séparés parce que… ». Quand il la trouve, il se tait. Les
« 4 clusters portant leur raison écrite » dont je parlais, ce sont les quatre doublons pour
lesquels tu as validé qu'ils restent en double, et dont la raison est maintenant écrite dans le code.

**Résultat mesuré aujourd'hui : CLONE-HUNTER signale ZÉRO constat.** Il est passé de 9 à 0 — pas
en se taisant, mais parce que chacun a reçu soit une fusion, soit une raison écrite.

**Et l'impact pour doc-report et les autres, que tu m'avais demandé de te rappeler** : aucun. La
raison écrite ne change rien au fonctionnement d'un outil — elle n'ajoute qu'un commentaire que
CLONE-HUNTER sait lire. Rien d'autre dans le paysage ne la regarde.

## Les 104 convictions absentes de la boussole — contexte et enjeux *(ta question 25)*

**Ce que c'est, en clair.** The-King lit tout le corpus du projet (la charte, les règles de travail,
le référentiel, les process, les leçons) et en extrait les **convictions récurrentes** : les
affirmations qui reviennent assez souvent pour être des principes de fait, même si personne ne les
a jamais écrites comme tels. « La boussole », c'est le document de philosophie et politique.

**Le constat** : **104 convictions récurrentes sur 106 retenues** ne figurent dans aucun principe
écrit de la boussole. Autrement dit : le projet fonctionne presque entièrement sur des principes
qu'il applique sans les avoir déclarés.

**L'enjeu, et il est double** :

- **pour la reprise par une autre IA** — un principe non écrit n'existe pas pour celui qui arrive.
  C'est le risque que la charte appelle explicitement « dette de reprise ».
- **pour l'export de l'Agence** — c'est le même risque que ta peur sur l'agence installée ailleurs :
  tu l'utilises et tu ne la reconnais pas, parce que ce qui la faisait fonctionner n'était écrit
  nulle part.

**Pourquoi c'est toujours là après deux jours, et c'est la vraie réponse à ta question** : corriger
veut dire écrire ces principes DANS la boussole. Or la boussole ne se modifie pas sans ton accord
exprès. Ce n'est donc pas un retard : c'est bloqué sur une décision qui t'appartient, et elle fait
partie du lot des décisions en attente.

**Et c'est aussi l'illustration exacte de ton « correction = révélation »** : révéler est gratuit —
l'outil l'a fait en une seconde. Corriger se paie, et le paiement t'appartient.

> **ACTION — À TRANCHER** (tâche #1422, déjà ouverte).

## Lancer une Ronde pendant le mode auto *(ta question 29)*

> « je voudrais que tu puisses lancer une ou plusieurs rondes pendant le mode auto. […] Pourquoi
> as-tu bloqué le lancement ? »

**Pourquoi j'ai bloqué, et c'était une règle écrite, pas une hésitation** : le process de la Ronde
dit qu'en mode autonome, **aucune question ne se pose** — tes mots d'origine : « aucune fenêtre y
compris GOAT/AUTO ne doit être bloquante pour le mode autonome ». Or une Ronde ordinaire comporte
**29 à 46 questions**. Une Ronde sans questions, c'est la moitié de la Ronde.

Le process prévoit bien ce cas (combinaison D : zéro question, les points reportés au prochain
passage en présence), donc **j'aurais pu la lancer**. Ce qui m'a arrêté est que je ne savais pas
quel PROGRAMME lancer : une Ronde se calibre avec toi (quels items, quel palier, quels items
payants), et ce calibrage n'existait pas pour la nuit.

**Ce que tu proposes et qui règle exactement ça** : « des le lancement du mode auto on calibre
ensemble la ronde principale à mener pendant la nuit, et aussi que tu disposes d'une formule
"ronde auto" qui te permet de lancer des rondes selon ton propre calibrage, à tout moment ».

**Mon avis : les deux, et ils ne font pas doublon.** La première règle le cas prévu (une grosse
Ronde, calibrée avec toi au coucher). La seconde règle le cas imprévu (il est 3h du matin, j'ai fini
mon programme, une Ronde légère serait utile) — et elle doit rester LÉGÈRE et GRATUITE par défaut,
sinon je dépenserais ton budget d'appels pendant que tu dors.

> **ACTION — RETENU.** Tâche **#1480** : écrire la « formule ronde auto » dans le process, avec son
> calibrage au lancement du mode auto. **Trois choses à trancher avec toi avant d'écrire**, et je
> te les poserai en fenêtre : combien de Rondes auto au maximum par nuit · ont-elles le droit de
> dépenser des appels API, et jusqu'à quel plafond · les questions sautées sont-elles reportées au
> matin en un seul bloc, ou réparties.

## The-King « tension » — est-ce que ça scanne, et quoi *(ta question 34)*

**Réponse directe : non, ça ne scanne qu'UN document, et un seul.** `the-king tension "<ton idée>"`
lit `docs/philosophie-et-politique.md`, rien d'autre. Pas le suivi, pas les fils, pas les 11
destinations, pas la charte.

**Ce qu'il fait** : il compare ton idée aux articles de la boussole et dit si elle les CONTREDIT
(opposition de sens sur du vocabulaire partagé) ou si elle est DÉJÀ COUVERTE (une redite — et le
dire t'épargne un chantier).

**Ne pas le confondre avec `the-king revelation`**, qui lui scanne tout : la charte, les règles de
travail, le process d'expérience, les leçons, tout le référentiel, les process à la racine de
`docs/`, et les données dérivées (dont le suivi). Ce sont deux outils différents sous le même nom.

**Ta vraie question, et elle est juste** : *faudrait-il que `tension` scanne plus de couches ?*
**Mon avis : oui pour la charte, non pour le reste.** La charte fait loi au même titre que la
boussole — une idée qui la contredit devrait être signalée pareil. Le suivi et les fils, non : ce
sont des traces de travail, pas des lois, et y chercher des contradictions produirait du bruit.

> **ACTION — À TRANCHER.** Veux-tu que `tension` lise aussi la charte ? C'est un petit changement
> (une ligne de corpus) et ça double sa couverture sur ce qui fait loi.

## The-King « fonder » — testé sur un dépôt extérieur ? *(ta question 35)*

**Non. Jamais.** Et c'est une réponse qui compte, parce que l'Agence a une règle sur ce point
précis : un outil qui n'a jamais tourné contre le vrai terrain n'est pas un outil vérifié, c'est une
intention.

`fonder` a tourné **sur ce dépôt-ci**, où il se comporte correctement : il ne propose rien, parce
que ce projet a déjà ses textes fondateurs. Mais c'est le cas facile. **Le cas pour lequel il
existe — un projet d'accueil qui n'a RIEN — n'a jamais été essayé.**

**Ce que ça veut dire concrètement** : je ne peux pas te garantir aujourd'hui qu'installer l'Agence
ailleurs produirait des textes fondateurs utilisables. C'est exactement ta peur du point suivant, et
elle est fondée.

> **ACTION — RETENU.** Tâche **#1481** : faire tourner `fonder` contre un dépôt vierge pour de vrai
> (un dossier de test, pas un vrai projet) et rendre ce qu'il produit. C'est une mesure, pas une
> opinion, et elle manque.

## La licence *(tes questions 33 et 42 — regroupées, c'est la même)*

**L'état est ROUGE, et c'est mesuré : ce projet n'a AUCUNE licence.** Pas de fichier `LICENSE`, pas
de déclaration nulle part. Vérifié à l'instant.

**Ce que ça veut dire en droit, et c'est contre-intuitif** : l'absence de licence ne veut PAS dire
« libre ». Elle veut dire **« tous droits réservés par défaut »** : personne — ni un acheteur, ni un
collaborateur, ni un testeur — n'a le droit de l'utiliser, de le copier ou de le modifier. Pour un
projet que tu veux vendre, c'est le pire des deux mondes : ça n'attire personne ET ça ne te protège
pas mieux qu'une licence propriétaire explicite.

**Ce que je ne fais pas** : la choisir. C'est une décision juridique et commerciale, et elle
détermine ce qu'un acheteur pourra faire. Elle est à toi.

**Ce que je peux faire, et ce que je propose** : te rendre un dossier qui explique **les trois
familles** de choix possibles, avec pour chacune ce qu'elle t'autorise, ce qu'elle t'interdit, ce
qu'un acheteur peut en faire, et un exemple de projet connu sous cette licence. Pas de jargon.
Ensuite tu tranches, et j'écris le fichier.

> **ACTION — RETENU.** Tâche **#1368** (déjà ouverte) : produire le dossier des trois familles de
> licence, en HTML, pour que tu puisses choisir. **C'est le document qui doit venir en premier**,
> parce que tu ne peux pas trancher sans lui.

## Les trois stratégies globales en HTML *(ta question 36)*

> « donc ce sont des docs generes, ecrits en prose ou hybrides ? l'ideal serait hybrides […] Livre
> moi les 2 stratégies globales, auxquelles doivent etre intégrés les 3 plans d'action respectifs
> […] Je veux 3 belles stratégies globales, livrées en HTML »

**Sur la nature : aujourd'hui elles sont en PROSE, pas hybrides.** Tu as raison de vouloir
l'hybride, et c'est faisable : une base fixe écrite à la main (le raisonnement, les arbitrages, ce
qui ne bouge pas) et des encarts dérivés qui se recalculent (les chiffres, l'état d'avancement, les
tâches rattachées). C'est exactement ce que fait déjà le document de classification, qui est généré
et donc jamais périmé.

**Sur le plan d'action : je suis d'accord avec toi, et c'est déjà la règle du projet.** Tu écris
« le document plan d'action ne doit selon moi pas vivre en dehors du doc de strategie globale » —
c'est mot pour mot ce que l'Article 28 impose : le plan d'action vit DANS le rapport qui l'a motivé,
jamais dans un document séparé, parce qu'un plan qui voyage avec son rapport ne peut pas se perdre.
Rien à discuter, on est alignés.

**Sur le format standard : non, je dois le vérifier avant d'écrire.** Tu demandes « tu as bien pensé
à prendre en compte le format standard de strategie globale, à la lumière des docs du git ? » — je
ne peux pas répondre oui de mémoire. Le dossier `docs/strategies/` contient quinze fichiers ; il
faut que je lise ce que leur forme a en commun avant d'écrire trois documents de plus.

**Pourquoi « 3 » et pas « 2 »** : tu écris les deux dans la même phrase. Je pars sur **trois**,
c'est ta formulation finale (« Je veux 3 belles stratégies globales »). Si c'est deux, dis-le.

> **ACTION — RETENU.** Tâche **#1482** : les trois stratégies globales, en HTML, hybrides, chacune
> avec son plan d'action intégré, et après vérification du format commun. **C'est le plus gros
> morceau de cette liste** — je le fais après les chantiers, sauf si tu le veux avant.

## Les documents que tu dis ne pas avoir vus *(tes questions 32, 37, 38, 39, 40)*

Regroupés parce que c'est la même réponse : **ils partent avec ce dossier**, sauf un.

| Ce que tu demandes | État |
|---|---|
| #1110, l'arborescence | **n'existe pas** — dossier vide. Tâche #1478 ouverte pour la produire |
| La thèse « le cœur, c'est la gouvernance » | existe en texte brut, mise en page et **jointe** |
| L'organisation des lois | existe, **jointe** |
| La carte cible des modules | existe, **jointe** |
| La classification des règles | **faite** — c'est le document « organisation des lois » : six textes font loi, deux numérotent leurs règles, et citer « l'Article 13 » n'est plus ambigu |
| Le deep dive gestion des tâches | existe dans `docs/modules/`, **joint** |

## Le rapport de nuit *(ta question 41)*

> « ne doit etre livré que lorsque tu as TOUT terminé, ou alors si je reviens avant »

**Noté, et c'est une règle de travail, pas une préférence.** Je l'inscris telle quelle. Elle change
quelque chose de concret : je ne t'enverrai plus de rapport d'étape au milieu d'une nuit — soit
c'est fini, soit tu es revenu.

## « Quoi d'autre dois-je voir ? » *(ta question 44)*

> « J'en profite aussi pour te demander la version à jour de philo et politique et… quoi d'autre ?
> […] reprends l'historique de conversation et les sessions compactées, fais un check stp »

**Le check est fait mécaniquement, pas de mémoire** — c'est précisément à ça que sert le nouveau
registre des envois. Il compte **64 documents** dans les dossiers qui te sont destinés. Je ne peux
pas tous te les envoyer d'un coup : ce serait le même problème par l'autre bout.

**Ce que je te propose** : ce dossier part avec les cinq documents que tu réclames nommément. Et à
partir de maintenant, chaque compte rendu finit par la liste de ce qui a été produit pour toi et
pas encore envoyé — c'est la règle de conduite qui vient d'être câblée. Tu n'auras plus à demander.

**La version à jour de philo et politique part avec ce dossier**, avec la réserve écrite plus haut :
il lui manque le quatrième mot d'ordre, et je ne l'ajoute pas sans ton accord.

---

# ⑤ LES TROIS CHANTIERS — ouverts, pas bâclés

Tu as choisi « les réponses rapides d'abord, les chantiers ensuite ». Les voici, nommés, avec ce que
chacun va contenir — pour que tu saches ce qui vient et dans quel ordre.

## Chantier A — le système de fils de discussion *(couvre tes questions 9 à 14)*

**Une mesure d'abord, parce qu'elle répond déjà à ta question la plus directe.** Tu demandes :
« tu dois verifier si les fils ont bien été alimentés et que des fichiers ephemeres ne leur ont pas
"oté le pain de la bouche" ».

**Vérifié. Ton intuition est juste, et c'est pire que « ils végètent » :**

| Mesure | Chiffre |
|---|---|
| Documents créés ou modifiés depuis le dernier vrai mouvement d'un fil | **180** |
| Dont des documents qui te sont destinés (livrables, stratégies, rapports) | **41** |
| Enregistrements ayant touché un fil sur la même période | **1** (et c'était une question morte qu'on fermait) |
| Date du dernier vrai mouvement d'un fil | **1er octobre, 02h24** |

**Et le plus intéressant : l'outil qui surveille les fils dit que tout va bien.** Il répond « 14/14
fils à jour » sur six contrôles. **Parce qu'il mesure la FORME d'un fil — a-t-il une date, dit-il à
qui est la balle, ses engagements existent-ils en tâches — jamais s'il a été ALIMENTÉ.** C'est
exactement le type de faux vert que ce projet passe son temps à traquer, et il était sur le
mécanisme censé garantir qu'on est à jour.

**Ce que le chantier va contenir** : t'expliquer le process actuel en clair · câbler le mécanisme
que tu décris (j'extrais les questions de ton prompt, je les rattache à leur fil ou j'en crée un,
et je te livre les fils concernés plutôt qu'un document neuf) · ajouter la mesure d'alimentation qui
manque · et répondre à ta question sur les questions de calibrage (oui, elles bloquent des fils, et
je te les poserai en série en fenêtre comme tu le proposes).

> **ACTION — RETENU.** Tâche **#1483**. **Je commence par celui-là.**

## Chantier B — la séparation agence / utilisateur *(ta question 7)*

> « moi j'utilise l'agence et je t'utilise toi. Quelles sont les regles que tu as toi et que
> l'agence n'a pas ? […] Ma peur : j'installe l'agence dans un nouveau projet, je l'utilise mais je
> ne la reconnais pas et certaines choses ne fonctionnent plus du tout. »

**Ta peur est fondée, et j'ai déjà un élément mesuré qui le prouve** : la réponse à ta question 35
ci-dessus. L'outil censé fonder un projet d'accueil n'a jamais tourné contre un projet d'accueil.
C'est précisément « ça ne fonctionne plus du tout et personne ne le sait ».

**Ce que le chantier va contenir** : la liste des règles qui vivent dans ma tête ou dans mes
instructions et PAS dans les fichiers de l'Agence (ce sont celles qui disparaîtront à l'export) ·
pour chacune, si c'est normal ou si c'est un trou · et l'équipement des outils là où c'en est un.

> **ACTION — RETENU.** Tâche **#1484.**

## Chantier C — le filet transporté *(tes questions 19 à 22)*

Tes quatre questions : l'utilisateur hérite-t-il du filet · peut-il casser l'agence en codant son
projet · peut-on « verrouiller le code » · le filet consomme-t-il des tokens.

**Une réponse courte tout de suite sur la dernière, parce qu'elle est simple et qu'elle te
soulagera : NON.** Le filet est un programme qui tourne sur ta machine. Il ne fait AUCUN appel à une
IA, donc il ne consomme **zéro token**, quelle que soit sa longueur. Ce qu'il coûte, c'est du temps
d'attente — environ 9 minutes aujourd'hui — et rien d'autre.

Les trois autres demandent un vrai dossier.

> **ACTION — RETENU.** Tâche **#1485.**

## Et la question « pas rationalisable » + tes idées de copier-coller *(ta question 23)*

**Je dois d'abord réparer une fausse déclaration** : j'ai écrit que « la liste existe en partie ».
**C'est faux.** Le mot « rationalisable » n'apparaît dans aucun document de ce dépôt. La liste
n'existe pas du tout.

Elle est liée au chantier C (le filet est justement le plus gros morceau « non rationalisable ») et
sera produite avec lui.

> **ACTION — RETENU.** Rattachée à la tâche #1485.

## Le fil « travail à distance » *(ta question 24)*

> « Tu dois retrouver : je t'ai posé une question recemment, dans les derniers jours : comment on
> peut travailler ensemble à distance, depuis mon tel ou mail. »

**Cherché mécaniquement dans tout le dépôt : le sujet n'existe NULLE PART**, sauf dans une tâche qui
dit « à traiter ». Je ne retrouve donc pas ta question d'origine, et je ne vais pas l'inventer :
répondre de mémoire sur un sujet dont le dépôt ne garde rien produirait une réponse invérifiable.

**Ce que je peux faire sans ta question d'origine** : te dire ce qui est techniquement possible
aujourd'hui pour travailler depuis ton téléphone ou par mail, et ce qui ne l'est pas. C'est un sujet
court, et il mérite une vraie réponse plutôt qu'une ligne dans ce document.

> **ACTION — RETENU.** Tâche **#1486**, à traiter avec le chantier B (c'est la même famille : ce que
> l'Agence sait faire hors de cette fenêtre de conversation).

---

# PLAN D'ACTION

*(Article 28 : un rapport n'est pas fini quand il est écrit, il l'est quand ses constats sont
devenus des tâches. Les tâches ci-dessous existent pour de vrai dans le suivi.)*

| État | Constat | Tâche |
|---|---|---|
| ✅ FAIT | les sauvegardes ne sont plus conservées, et l'envoi efface | #1472 |
| ✅ FAIT | la Ronde te demande désormais ce que tu as reçu | #1473 |
| ✅ FAIT | un document écrit pour toi et jamais envoyé est détecté | #1475 |
| → RETENU | faire le point sur le PACK DÉCOUVERTE, reposer ses deux questions ouvertes | #1476 |
| → RETENU | inscrire l'idée des « packs » au chantier rationalisation | #1477 |
| → RETENU | produire l'arborescence #1110 pour de vrai, puis l'état des lieux avec tableau | #1478 |
| → RETENU | passer les outils en revue : lesquels peuvent devenir extension d'un autre | #1479 |
| → RETENU | écrire la formule « ronde auto » dans le process du mode auto | #1480 |
| → RETENU | faire tourner `the-king fonder` contre un dépôt vierge, pour de vrai | #1481 |
| → RETENU | les trois stratégies globales en HTML, hybrides, plans d'action intégrés | #1482 |
| → RETENU | **chantier A** : le système de fils — commencé en premier | #1483 |
| → RETENU | **chantier B** : la séparation agence / utilisateur | #1484 |
| → RETENU | **chantier C** : le filet transporté + la liste « pas rationalisable » | #1485 |
| → RETENU | le travail à distance : ce qui est possible depuis ton téléphone ou par mail | #1486 |
| → RETENU | le dossier des trois familles de licence, pour que tu puisses choisir | #1368 |
| ? À TRANCHER | ajouter le quatrième mot d'ordre INTELLIGENT à la boussole (texte proposé plus haut) | #1487 |
| ? À TRANCHER | un mécanisme général d'ordre des événements : maintenant, ou en attente d'un 4ᵉ cas ? | #1488 |
| ? À TRANCHER | `the-king tension` doit-il aussi lire la charte ? | #1489 |
| ? À TRANCHER | les 104 convictions hors boussole : ta décision est nécessaire pour les faire redescendre | #1422 |
| ÉCARTÉ | « correction = révélation » — malentendu levé, par ton propre arbitrage | — |
| ÉCARTÉ | les zones fragiles — ta question était une demande d'explication, pas un changement | — |
