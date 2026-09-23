# Blueprint exportable — LE RASSEMBLEUR DE VERDICTS (« tout est-il à niveau ? »)

*Blueprint générique, réutilisable tel quel sur un autre projet. L'instanciation propre à ce
projet-ci vit dans `docs/referentiel/the-equalizer.md` — rien de spécifique à une maison, à des
personnages ou à un jeu ne doit apparaître ci-dessous.*

## Le problème qu'il résout, et pourquoi il n'est visible d'aucun autre poste

Un projet outillé finit par compter vingt contrôleurs, chacun excellent sur sa part. Chacun répond
« ma part va bien ». **Personne ne répond « tout va bien »**, et surtout personne ne peut répondre
« voici ce que PERSONNE ne vérifie » — car pour le voir il faut détenir la liste de ce qui devrait
être vérifié, et aucun contrôleur ne la détient.

C'est un angle mort d'une nature particulière : il ne se manifeste jamais par une alerte. Tous les
voyants sont au vert, et l'exigence oubliée n'a simplement pas de voyant. Plus l'outillage est
mûr, plus ce trou est probable — il grandit à chaque contrôleur ajouté.

## Le principe, en une phrase

**Écrire les exigences dans un DOCUMENT, puis construire un outil qui lit ce document et rend un
verdict par domaine — sans ajouter le moindre scan à lui.**

Les deux moitiés comptent autant l'une que l'autre :

- **Sans le document**, « ce n'est pas à niveau » n'est qu'une opinion, et une opinion se discute
  au lieu de se corriger.
- **Sans la règle du zéro scan propre**, l'outil devient un vingt-et-unième contrôleur qui redit ce
  que les vingt autres disent déjà, avec le risque supplémentaire de diverger d'eux.

## Les quatre pièces

### 1. Le référentiel des exigences (un document, jamais une liste dans le code)

Un fichier texte qui déclare, par niveau, chaque exigence avec **qui la vérifie** — ou déclare
noir sur blanc que **personne** ne la vérifie. Il n'invente rien : chaque exigence existait déjà
ailleurs, éparpillée. Ce qui est neuf, c'est qu'elles sont réunies et que chacune nomme son
vérificateur.

**Forme des titres de section, et ce n'est pas un détail cosmétique** : chaque niveau porte un NOM
en majuscules à un emplacement fixe (`NIVEAU n — NOM : explication`). L'outil lit ce nom pour
rattacher le tableau à un domaine de verdict. Un titre rédigé en prose oblige l'outil à deviner, et
une mauvaise devinette fait disparaître une section entière **sans aucun signe extérieur**.

### 2. Le lecteur, qui refuse de deviner

Il analyse le document et **lève une erreur** sur tout titre de niveau qu'il ne sait pas nommer.
C'est contre-intuitif pour un outil de reporting, et c'est pourtant la règle la plus importante du
lot : sur un outil dont le métier est de repérer ce que personne ne vérifie, **sauter une section
en silence est le pire défaut possible** — il produit un rapport d'apparence parfaitement normale
auquel il manque une partie.

### 3. Les trois contrôles propres — et eux seuls

Trois choses qu'aucun contrôleur individuel ne peut voir de sa place :

| Contrôle | Ce qu'il trouve | Pourquoi personne d'autre ne peut le voir |
|---|---|---|
| **Exigence sans vérificateur** | une exigence écrite que rien ne contrôle | il faut la liste complète pour voir un trou dedans |
| **Vérificateur FANTÔME** | une exigence qui annonce un vérificateur inexistant | le contrôleur absent ne peut pas signaler sa propre absence |
| **Niveau ORPHELIN** | une section du référentiel rattachée à aucun domaine | ses exigences ne sont comptées nulle part, donc jamais manquantes |

**Le fantôme est plus grave que l'absence déclarée**, et c'est la hiérarchie à retenir : une
exigence qui dit « personne ne me vérifie » avertit ; une exigence qui nomme une fonction
inexistante **rassure à tort**. On peut vérifier mécaniquement l'existence d'un nom de fonction
cité ; on ne peut pas vérifier qu'un outil nommé en prose vérifie bien CETTE exigence-là — cette
limite se déclare plutôt que de se masquer derrière une correspondance de mots.

### 4. Le verdict par domaine, à trois états jamais deux

Le piège évident serait de rendre un domaine vert dès qu'aucune exigence n'est en défaut. Or une
exigence **non vérifiée** n'est pas une exigence tenue : c'est une exigence dont on ignore l'état.
Le verdict distingue donc : tout couvert · partiellement couvert · **aucune exigence déclarée**
(qui doit se dire, avec sa raison écrite, sinon il est indiscernable d'un oubli).

Le même principe vaut pour toute mesure déléguée : quand un contrôleur appelé n'a pas pu tourner,
le rapport écrit **« pas mesuré »**, jamais un zéro. Un relevé absent affiché comme un relevé propre
est exactement le faux vert que l'outil existe pour empêcher.

## La règle du zéro scan propre, et comment elle se tient en pratique

Toute profondeur supplémentaire s'obtient en **appelant** un contrôleur existant, jamais en
réécrivant sa boucle. Le piège est réel et coûte cher : réécrire une boucle déjà écrite ailleurs,
c'est perdre en route tout ce que l'original avait appris — les déviations déclarées, les cas
« non mesurable », les conventions de nommage. Une boucle réécrite produit alors une avalanche de
faux écarts.

**Le signe qu'on vient de tomber dedans, et il est fiable : quand un détecteur accuse presque tout,
c'est presque toujours lui qui a tort.** Vérifier avant de publier coûte deux minutes ; publier un
rapport entièrement faux coûte la confiance qu'on met dans l'outil.

Corollaire : quand un contexte d'appel est construit ailleurs (avec sa liste de déviations
assumées), on le réutilise — le reconstruire à côté, c'est faire ressortir comme écarts les
déviations que quelqu'un avait déjà validées.

## Ce que cet outil ne fait jamais

**Corriger** (il rend un verdict, la décision reste humaine) et **bloquer** (un contrôleur qui
bloque sur un sujet sans rapport avec le travail en cours pousse à le désactiver, et on perd tout).
Il signale fort, il n'arrête rien.

## Où le brancher

- **Périodiquement**, jamais à chaque livraison de code : « tout est-il à niveau ? » est une
  question de période. Répétée à chaque commit, elle rendrait le même verdict des dizaines de fois
  d'affilée, et un signal qui ne change jamais cesse d'être lu.
- **Chaque constat devient une ligne de plan d'action**, portant sa propre raison — sinon le
  rapport a coûté son temps et n'a rien changé.

## Le test qui prouve qu'il sert à quelque chose

Un détecteur qui n'a jamais mordu ne prouve rien. Trois sondes délibérées, chacune reproduisant un
défaut réellement commis : un titre de niveau illisible (doit lever une erreur) · une exigence
nommant un vérificateur inexistant (doit être signalée, sans jamais confondre avec une absence
honnêtement déclarée) · un niveau rattaché à aucun domaine (doit être crié). Et, en plus des
fixtures, une vérification **en direct contre le vrai référentiel et le vrai dépôt** : c'est
celle-là qui attrape le titre en prose avant qu'il ne coûte un rapport faux.
