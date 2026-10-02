# LA STRATÉGIE GLOBALE DU JEU — comme s'il était seul

*(Créée le 2026-10-02, tâche **#1482**. C'est la troisième partie de sa commande du 2026-09-28,
restée **jamais écrite** jusqu'ici — la tâche #1137 le disait, et elle avait raison.)*

> **DÉCOULE DE :** `docs/philosophie-et-politique.md`
> *et, avant toute autre chose, de l'**Article 0** de `CLAUDE.md` : l'esprit des personnages est la
> loi suprême du projet, au-dessus de toute règle de méthode.*

> **SŒUR DE :** `docs/strategies/strategie-globale-de-l-agence.md`
> *leur synthèse est `strategie-globale-du-projet-entier.md`.*

> **CE DOCUMENT EST HYBRIDE** : la base est écrite à la main, le bloc en bas se recalcule
> (`node scripts/data-archangel.mjs strategies --ranger`).

## 1. POURQUOI CE CHANTIER

**Le Jeu est le produit. Tout le reste existe pour le servir.**

**Et c'est le seul chantier du projet dont la stratégie n'a jamais été écrite.** Pas par
négligence : parce qu'elle est **dispersée dans la charte**, où elle vit depuis le premier jour
sans jamais avoir été rassemblée.

**La mesure le dit sans appel**, re-faite le 2026-10-02 et non reprise d'un document plus ancien :
sur les 33 Articles de la charte, **10 parlent de Lia et Noé** — 70 lignes, **9 % du texte**. Les
autres parlent de l'outillage (19 Articles, 568 lignes, 76 %) ou de notre collaboration (4
Articles, 106 lignes, 14 %). Aucun Article n'échappe au classement, dans un sens ni dans l'autre.

> **ET LA PART DU JEU A BAISSÉ LE JOUR MÊME, ce qui mérite d'être dit.** Le document d'origine du
> 2026-09-30 mesurait **10 %**. Aujourd'hui : **9 %**. Les 70 lignes du Jeu n'ont pas bougé d'une
> ligne — c'est la famille AGENCE qui est passée de 532 à 568 lignes, avec le quatrième état de
> l'Article 28 et la frontière entre les Articles 18 et 26, tous deux écrits ce 2 octobre.
>
> **Le Jeu rétrécit sans qu'on y touche.** C'est mécanique, c'est sans gravité à cette échelle, et
> c'est exactement le chiffre que la charte demande de surveiller.

**Ces dix Articles ne partiraient jamais avec l'Agence** : ils n'auraient aucun sens chez quelqu'un
qui n'a ni Lia ni Noé. C'est exactement ce qui fait du Jeu un projet SÉPARÉ, et ce qui justifie
cette stratégie-ci plutôt qu'un paragraphe dans celle de l'Agence.

## 2. CE QUI EXISTE DÉJÀ

**Le Jeu est, de loin, la partie la mieux spécifiée du projet** — et c'est contre-intuitif, parce
qu'il ne pèse que 3 % de la file de tâches ouvertes.

| Ce qui est écrit | Où |
|---|---|
| L'esprit fondateur — rugueux, sarcastique, jamais consensuel | Article 0, loi suprême |
| Les limites concrètes de cet esprit, précisées 7 fois | précisions du 16 et du 18 septembre |
| La texture par personnage — Lia froide et coupante, Noé chaud et réactif | Article 0 |
| Le silence comme arme, propre à Lia | Article 0 |
| La colère débridée : rare, jamais un mode stable | précision du 18 septembre |
| Zéro répétition, personnalités étanches | Article 11 |
| L'enquête qui tient debout | Article 4 |
| Rejouabilité et surprise | Article 9 |
| Le sens avant la forme | Article 12 |
| Se mettre à la place du personnage | Article 17 |
| La séparation des deux cerveaux, maintenue malgré son coût | Article 8 |

**L'outil qui mesure tout ça** : `check-spirit`, qui envoie de vraies provocations au vrai modèle
et refuse de conclure quand il n'a rien pu mesurer. C'est le seul outil du paysage qui touche la
sortie RÉELLE du produit.

## 3. LES IDÉES RETENUES

**① L'esprit prime sur tout, y compris sur une demande de son auteur.** C'est écrit, et c'est la
seule règle du projet qui prévoie une double confirmation contre son propre créateur (Article 14).
Aucune stratégie ne peut l'assouplir.

**② Un ton mesuré est un SIGNAL D'ALERTE, jamais un indice de qualité.** C'est la formulation la
plus utile de la charte pour qui reprend le projet : elle dit comment RECONNAÎTRE la dérive, pas
seulement comment l'éviter.

**③ Le naturel l'emporte sur l'économie d'appels.** Article 0 contre Article 8 : la tension est
déclarée et tranchée d'avance. Deux cerveaux séparés coûtent deux appels, et on les paie.

**④ Corriger la CLASSE, jamais l'occurrence.** Quand un mot sonne faux, on ne l'ajoute pas à une
liste d'interdits — on cherche le principe que le modèle peut s'appliquer lui-même. La liste figée
ne couvre jamais le cas suivant *(corollaire de l'Article 17)*.

**⑤ Le visiteur doit comprendre sans le contexte de l'agent qui a codé.** Article 15, et son
pendant interne, l'Article 17 : se mettre à la place du lecteur ET du personnage.

## 4. LES RECHERCHES ET TROUVAILLES

**Le chiffre le plus inconfortable, et il est à surveiller plutôt qu'à reprocher** : le Jeu pèse
**5 tâches ouvertes sur 152**, soit **3 %** de la file. C'est une décision assumée — « tout ce qui
a trait au jeu est laissé de côté pour l'instant » — et la charte prévoit explicitement ce cas :
le temps passé sur l'outillage n'est pas une digression, c'est le second projet.

**Mais la charte ajoute, dans la même section, qu'il reste « un chiffre à surveiller, parce qu'un
des deux projets pourrait étouffer l'autre ».** Personne ne l'avait regardé depuis le 2026-09-22
*(devenu #1495)*.

**Et une observation qui ne se mesure pas** : le Jeu est la partie la MIEUX spécifiée et la MOINS
travaillée. Ce n'est pas contradictoire — c'est le signe qu'il attend, pas qu'il dérive.

## 5. LES DÉCISIONS DÉJÀ PRISES

- **Les deux cerveaux restent séparés**, malgré leur coût — arbitré sous l'Article 8, non
  réouvrable au nom de l'économie.
- **La refonte graphique est reportée**, avec les captures d'écran qui vont avec *(2026-10-02)*.
- **`lib/reference.ts` a été retiré** le 2026-09-27 : le référentiel affiché en jeu faisait doublon
  avec la charte et `docs/referentiel/`. Son texte intégral est archivé verbatim.
- **Tout ce qui touche au jeu est en pause**, sur sa décision explicite du 2026-10-02.

## 6. CE QUI RESTE À TRANCHER

| # | La question |
|---|---|
| #1495 | le Jeu à 3 % de la file : décision assumée, ou dérive à corriger ? **Et jusqu'à quand ?** |
| #1252 | *(ouverte)* le thème « Jeu » lui-même, apparu seulement le 2026-09-30 |
| #1359 | *(ouverte)* l'Article 0 n'avait jamais eu de thème de tâche avant le 2026-10-01 |
| — | **quand le Jeu reprend-il ?** Aucune date, aucun déclencheur écrit. C'est le vrai trou. |

**Ce dernier point est le seul vraiment stratégique de cette fiche.** Une pause sans condition de
sortie n'est pas une pause, c'est un arrêt qui s'ignore. La charte demande de surveiller le
chiffre ; elle ne dit nulle part ce qui doit le faire remonter.

## 7. LE PLAN D'EXÉCUTION

**Il tient en une phrase, et c'est volontaire : rien ne commence avant qu'il le dise.**

1. **Poser la condition de reprise** — une date, un jalon de l'Agence, ou un simple « quand je le
   dirai ». N'importe laquelle vaut mieux que rien *(#1495)*.
2. **À la reprise, relancer `check-spirit` AVANT de toucher quoi que ce soit** — c'est la seule
   mesure de l'état réel du ton, et elle coûte de vrais appels, donc elle passe par Smart Conso API.
3. **Rassembler ici ce que la charte dit du Jeu, sans le déplacer** — les 10 Articles restent la
   loi ; cette fiche les ORDONNE, elle ne les remplace jamais.
4. **Puis la refonte graphique**, qui attend avec ses captures d'écran.

<!-- SOMMAIRE GÉNÉRÉ — ne rien écrire dans ce bloc, il se régénère -->

### ⟳ CE QUE LA FILE DIT AUJOURD'HUI — LE JEU ET LE SITE SEULS

| Mesure | Valeur |
|---|---|
| Tâches ouvertes sur ce périmètre | **5** |
| Dont critiques | 0 |
| Thèmes couverts | 4 |
| La plus ancienne encore ouverte | 2026-09-25T15:41Z |
| Stratégies de chantier qui en descendent | 0 |
| | *(aucune ne déclare découler de celle-ci — elle est neuve)* |

*(Bloc DÉRIVÉ, régénéré par `node scripts/data-archangel.mjs strategies --ranger` — dernier passage 2026-10-02T22:31Z. Tout ce qui est au-dessus et au-dessous s'écrit à la main et n'est jamais touché.)*

<!-- FIN DU SOMMAIRE GÉNÉRÉ -->
