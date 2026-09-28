# check-suivi-fidelity — instanciation sur ce projet

*(Membre certifié depuis le 2026-09-26. Blueprint générique : `docs/check-suivi-fidelity-blueprint.md`.
Registre : `docs/check-suivi-fidelity/`.)*

## Ce qu'il fait

Il relit chaque fichier de session de `docs/suivi/` et refuse une clôture nue. Une tâche fermée doit
préciser **« terminée — fidèle »** ou **« terminée — écart : … »** ; un simple « terminé » laisse
sans réponse la seule question qui compte : *est-ce que ça a été fait comme demandé ?*

Il fait aussi trois choses que son nom ne dit pas, et qui pèsent autant :
- il repère un fichier ANNONCÉ dans une ligne de suivi et **absent du disque** (`findClaimedFilesMissing`) ;
- il croise les commits récents avec le suivi et signale **un commit substantiel sans ligne**
  (`findCommitsMissingSuiviUpdate`) ;
- il refuse **un horodatage daté dans le futur** — c'est lui qui attrape une heure TAPÉE plutôt que
  LUE (Article 32), et il l'a fait trois fois cette seule semaine.

## Pourquoi il est un Membre et pas de l'infrastructure

Il porte une connaissance propre au projet : ce qu'est une clôture honnête ici, la forme exacte
d'une ligne de suivi, la différence entre « fidèle » et « écart ». Ce savoir ne se déduit d'aucune
convention générale — il vient de décisions prises dans ce projet.

## Ce qu'il ne fait pas, et c'est délibéré

Il vérifie qu'une clôture DÉCLARE sa fidélité ; il ne juge jamais si la déclaration est vraie. Aucun
mécanisme ne peut lire une tâche et dire si elle a vraiment été faite comme demandé — c'est le
travail de THE-DEEP-READER, et de l'utilisateur.

## Comment on s'en sert

```
node scripts/check-suivi-fidelity.mjs
```

Gratuit, zéro appel API. Il tourne déjà au crochet de commit — plus souvent qu'un item de Ronde, ce
qui est la raison pour laquelle il n'en a pas.

## Le garde-fou des LIGNES FANTÔMES (2026-09-26, tâche #944)

**Ce qu'il attrape** : une ligne de suivi qui dit encore « ouverte » alors que son travail a été
fait et rendu compte dans une AUTRE ligne, plus récente et close. Le projet appelle ça une ligne
fantôme.

**La règle qu'il porte existait déjà, et n'avait aucun porteur** : `docs/systeme-de-suivi.md` §2,
depuis le 2026-09-19 — « à la clôture d'une tâche, sa ligne est mise à jour (statut, pas une
nouvelle ligne) ». Rien ne la vérifiait, donc elle a cessé d'être vraie en silence, exactement ce
que l'Article 27 annonce d'une obligation confiée à la mémoire d'un agent. Huit cas réels au
premier passage, dont quatre écrits le matin même (leçon L31).

**Pourquoi ce n'est pas du rangement** : la file mentait sur sa propre taille — 129 tâches
restantes annoncées, 121 réelles. « Épuiser la file » n'avait plus de fin mesurable, et la liste
des plus anciennes tâches encore ouvertes, celle qui sert à décider quoi faire ensuite, remontait
du travail déjà rendu. **Une ligne fantôme est pire qu'une ligne manquante : elle a l'air d'un
travail qui reste.**

**Les trois conditions, et chacune vient d'une fausse alerte réelle.** La première version en
rendait seize, dont quatre fausses :

1. **La ligne qui cite doit être CLÔTURÉE.** Deux lignes ouvertes qui se renvoient l'une à l'autre
   ne prouvent aucun travail fait.
2. **Son numéro doit être PLUS GRAND.** Une ligne ne peut pas avoir fait une tâche née après elle —
   au contraire, elle l'OUVRE en suite de son propre travail. Trois des quatre fausses alertes
   étaient exactement ça (n°909 « closant » n°910, n°916/917, n°918/919).
3. **La citation doit être dans la cellule SOUS-SUJET.** C'est la convention réelle du suivi,
   vérifiée sur les 825 lignes existantes : une ligne qui clôt une tâche l'annonce là
   (« Tâche #137 close après vérification », « MEMENTO construit (tâche #169) »). Le Détail, lui,
   cite couramment une voisine sans prétendre l'avoir faite — c'est ce qui faisait dire que n°613
   avait clos n°612, alors qu'il expliquait au contraire pourquoi il n'y touchait PAS.

**Le prix de cette étroitesse est déclaré, jamais tu** : un fantôme dont la ligne de clôture
n'emploie pas le mot « tâche » passe inaperçu. Un cas réel existe — n°925, close par n°931 dont le
sous-sujet ne la nomme pas — et il a été corrigé à la main. **Manquer un vrai cas coûte moins cher
que d'en inventer un** (leçon L30), et un garde-fou qui accuse à tort cesse d'être lu (leçon L4).

**Ce qu'il ne fera jamais** : dire si le travail a été bien fait. Il compare des états de lignes,
pas des résultats.

## L'abstention silencieuse — 18 % du registre échappait à tous les contrôles (2026-09-28, tâche #1087)

**Trouvé en réparant une erreur de l'agent, et c'est ce qui rend le cas instructif.** De la prose
avait été écrite dans la colonne **Criticité** de la ligne #695, **trois commits de suite**, et rien
ne l'avait signalé.

**La cause tient en une ligne.** Quand la criticité n'est pas reconnue, `frontiereDuDetail()` rend
`null` et la ligne est écartée de **tous** les contrôles de forme. L'abstention est **juste** —
deviner ferait pire, et son commentaire le dit — **mais l'abstention SILENCIEUSE ne l'est pas** :
une ligne écartée sans bruit est une ligne que plus aucun contrôle ne regarde, et personne ne peut
le savoir. C'est le défaut que ce paysage corrige partout ailleurs, commis ici par le garde-fou du
registre lui-même.

**La mesure est plus grosse que l'erreur qui l'a révélée : 66 lignes sur 364 — 18 % du registre.**
Et **aucune n'était une faute de saisie** :

| Valeur ignorée | Occurrences |
|---|---|
| `CRITIQUE-STRUCTURANT` | 21 |
| `MOYENNE` | 17 |
| `NORMAL-NON-PRIORITAIRE` | 10 |
| `ELEVEE` | 8 |
| `PRIORITAIRE` | 5 |
| `RECOMMANDEE` | 4 |
| `FAIBLE` | 1 |

Sept valeurs parfaitement légitimes qu'un vocabulaire **se déclarant « fermé »** ignorait. Le
vocabulaire avait grandi, son lecteur non : **l'Article 24 dans sa forme la plus discrète**.
(`NORMAL-NON-PRIORITAIRE` explique à lui seul le motif d'origine : il acceptait `NORMAL-` suivi d'UN
mot, jamais d'un second tiret.)

**Deux correctifs, et le second compte plus que le premier.** Les sept valeurs sont reconnues
(**aujourd'hui**) ; surtout, `findLignesSansCriticiteReconnue()` **compte et affiche** les lignes
écartées, **même à zéro** (**demain**). Sans ce second, le prochain trou du vocabulaire cacherait à
nouveau des dizaines de lignes pendant des semaines.

**Le motif reste fermé pour autant** : de la prose collée dans la cellule n'est toujours pas
reconnue. On n'a pas remplacé la reconnaissance par un « tout passe », ce qui aurait effacé le
problème au lieu de le résoudre.

## Deux façons de ne plus attendre, et deux tâches invisibles (2026-09-28, tâche #1088)

**Trouvé en instruisant #763**, qui porte le statut « Ouverte → Terminée (clôturée par #783) ». Et
**ce cas-là était déjà traité** : la flèche est gérée depuis la correction des statuts en
transition. **C'est le premier enseignement** — un balayage à la main la comptait ouverte, l'outil
du dépôt non. Recompter à côté d'une fonction qui sait déjà lire est un coût pur (Article 31).

**Deux vrais défauts sont sortis de cette vérification.**

**(1) Une tâche « écartée » était comptée OUVERTE.** Or écartée veut dire : *on a regardé, et on a
décidé de ne pas la faire*. Plus personne n'attend rien d'elle — pourtant elle remontait dans la
file et dans les « plus anciennes encore ouvertes », c'est-à-dire **un retard qui n'existe pas**,
exactement le défaut déjà corrigé ici pour les statuts en transition.

L'Article 28 pose cette distinction pour un constat (RETENU / ÉCARTÉ) ; **elle vaut tout autant pour
une tâche**. Les deux labels restent **distincts** : `estCloturee()` reconnaît les deux comme
terminales, `estEcartee()` les sépare. On ne renomme pas « écartée » en « terminée », ce qui
effacerait la décision et son sens.

**(2) Deux tâches closes portaient « FAIT ».** Parfaitement clair pour un lecteur humain, invisible
pour tous les outils de la file, qui les comptaient ouvertes des jours après leur clôture.

**Le choix de correction est le point délicat, et il va dans le sens inverse de la facilité : les
deux LIGNES sont corrigées, le VOCABULAIRE ne s'élargit pas.** Accepter « FAIT », puis « OK », puis
« réglé » finirait par tout accepter, donc par ne plus rien signifier.

**Et `findStatutsNonReconnus()` nomme désormais ce qui sort du vocabulaire**, affiché même à zéro —
même doctrine que l'abstention silencieuse de #1087 : on ne devine pas, mais on ne se tait pas non
plus. Sans ce compteur, la prochaine ligne compterait faux en silence pendant des jours.
