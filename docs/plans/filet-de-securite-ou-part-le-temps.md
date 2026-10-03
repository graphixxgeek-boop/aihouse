# Le filet de sécurité coûte 44 secondes à chaque commit — où part ce temps ?

<!-- ARBORESCENCE — bloc généré par `node scripts/the-king.mjs cascade --inserer`, ne pas éditer à la main -->

**Où ce document se situe dans la cascade** — remonté des déclarations « DÉCOULE DE » réelles, jamais dessiné à la main :

```
philosophie-et-politique
    └── strategies/strategie-globale-du-projet-entier
        └── strategies/outillage-et-garde-fous-strategie
            └── ▣ plans/filet-de-securite-ou-part-le-temps   ← CE DOCUMENT
                (aucun document ne déclare découler de celui-ci)
```

<!-- /ARBORESCENCE -->

> **DÉCOULE DE :** `docs/strategies/outillage-et-garde-fous-strategie.md`
> *(Déclaré le 2026-09-29, tâche #1178 — il mesure le coût du filet de sécurité, le garde-fou qui les porte tous.)*

*(Constat DEEP-READER 7, « optimiser check-house.mjs, seule puce non traitée ». Tâche #818.
**Ce document propose, il n'applique rien** — et cette retenue est une règle, pas une prudence
personnelle : voir « pourquoi je ne l'ai pas fait » plus bas.)*

## Le chiffre, mesuré et pas estimé

Commande : `node scripts/smart-conso-token.mjs filet`

| | |
|---|---|
| Durée totale du filet | **43,7 s** |
| Groupes de test | 244 |
| Part des **10 plus lents** | **76,2 %** |
| Part du **premier à lui seul** | **26,8 %** |

**Ce que ça coûte vraiment** : le filet tourne au crochet *pre-commit*, **en bloquant**. Douze
commits dans une matinée, c'est **neuf minutes d'attente pure**. Et l'attente n'est pas le seul
coût : un contrôle long est un contrôle qu'on finit par vouloir contourner.

## Les dix plus lents

| Temps | Groupe |
|---|---|
| **11,7 s** | INES-official — collecte de fichiers réels par extension |
| 4,2 s | fraîcheur des fichiers de chantier |
| 3,4 s | god-of-all-process — association tâche → process |
| 3,2 s | classification des scripts par TYPE et par CLASSE |
| 2,7 s | le process XP |
| 2,6 s | AGENT-DU-TEMPS |
| 1,6 s | le compteur d'usage |
| 1,4 s | THE-KING |
| 1,3 s | cycle jour/nuit |
| 1,2 s | CLONE-HUNTER |

**Un seul groupe pèse plus du quart du total**, et les neuf suivants en pèsent la moitié. Optimiser
au jugé aurait touché les 234 autres pour rien — c'est exactement pourquoi la mesure devait venir
avant toute idée.

## Pourquoi je ne l'ai pas fait, et ce n'est pas de la timidité

tool-brain classe le filet **TUYAUTERIE, score 9** — le plus haut du dépôt :

> « lancé par le crochet pre-commit BLOQUANT — sa panne empêche tout commit — la casser casse le
> travail de tout le monde. Relecture humaine et contrôle de perte de références OBLIGATOIRES
> avant d'appliquer quoi que ce soit ici. »

La règle qui en découle : **seules les modifications à risque FAIBLE s'appliquent directement ;
au-delà, ça se propose.** Restructurer le filet n'est pas un risque faible.

## Les trois options, avec leur vrai coût

### 1. Ne rien faire

44 s par commit. C'est un choix défendable : le filet est ce qui rend ce projet tenable, et payer
44 s pour ne jamais casser le dépôt est une bonne affaire. **Rien ne prouve que ce temps soit mal
dépensé** — un groupe lent qui balaie vraiment le dépôt fait peut-être exactement ce qu'il faut.

### 2. Regarder les trois plus lents (19,3 s, soit 44 %)

Le plus probable : plusieurs groupes rebalaient le dépôt entier chacun de leur côté. Un balayage
partagé les ramènerait à quelques secondes **sans rien retirer à ce qui est vérifié**. C'est
l'option à **risque faible** : on ne change ni une assertion, ni une règle, seulement la façon de
lire les fichiers. Gain plausible : **15 à 20 secondes**, à confirmer en relançant la mesure.

### 3. Un mode rapide au pre-commit, le filet complet ailleurs

Les 234 groupes rapides tiennent en **10,6 s**. Tentant — et **c'est l'option que je déconseille
le plus fort**. Le crochet pre-commit deviendrait un contrôle PARTIEL qui rend exactement le même
vert qu'un contrôle complet. C'est le défaut que ce projet a passé la matinée entière à traquer, et
l'installer volontairement dans le garde-fou principal serait le pire endroit pour le faire.

## Ce que je te demande

**Option 2, ou on n'y touche pas ?** Si tu veux l'option 2, je regarde les trois plus lents un par
un (jamais une passe globale), je propose le changement, et je relance la mesure pour montrer le
gain réel — ou l'absence de gain.

## Plan d'action (Article 28)

- **RETENU** — la mesure elle-même, réutilisable et relançable → tâche **#818**, faite.
- **À TRANCHER** — laquelle des trois options → tâche **#819**, en attente.
- **ÉCARTÉ** — l'option 3, sauf demande explicite : un pre-commit partiel rendrait un vert
  indistinguable d'un vert complet, dans l'outil dont c'est précisément le métier de ne pas mentir.

---

# RE-MESURÉ LE 2026-10-03 — LES TROIS COUPABLES ONT CHANGÉ, ET LE DIAGNOSTIC AUSSI

**Pourquoi cette section existe** : la tâche #1468 imposait de refaire le chronométrage AVANT de
toucher quoi que ce soit, « la leçon de JESUS étant qu'une attribution n'est pas une mesure ». La
précaution vient de se justifier une seconde fois. Le tableau ci-dessus **n'est pas effacé** : l'écart
entre les deux mesures est l'information, et le réécrire la supprimerait.

| | 2026-10-02 | 2026-10-03 |
|---|---|---|
| Durée totale | 43,7 s | **202,8 s** |
| Groupes de test | 244 | **409** |
| Part des 10 plus lents | 76,2 % | **57,9 %** |
| Le premier à lui seul | 26,8 % | **13,7 %** |
| Nom du premier | INES-official | **THE-KING (révélation de philosophie)** |

## Les trois plus lents, aujourd'hui

| Temps | Groupe | Ce qu'il balaie |
|---|---|---|
| **27,8 s** | THE-KING — révélation de philosophie (#1418) | 200 fichiers normatifs : charte, règles de travail, leçons, référentiel, et le commentaire de tête de chaque outil |
| **20,7 s** | classification des scripts par TYPE et par CLASSE | tous les scripts de l'Agence |
| **15,3 s** | deux DOCUMENTS qui disent la même chose | 382 documents, 2 886 paires brutes |

**INES-official n'est plus dans les dix**, et ce n'est pas un hasard : la couche de **dates git
partagées** a été construite exactement pour lui (356 appels `git log` pour 178 fichiers, 13,3 s).
Le correctif a marché, et le classement l'enregistre.

## Ce qui change pour l'arbitrage de #1468

Son arbitrage était : « les faire relire ensemble — le projet relu une fois au lieu de trois ».
**Cette moitié-là est déjà construite.** Le dépôt porte depuis le 2026-09-27 un **décor partagé**
(`lireFichierPartage`, clé `mtime + taille + inode`) qui a fait tomber les lectures de 21 911 à
4 666 et les octets de 108,6 Mo à 23,4 Mo, et une couche de **dates git partagées** pour les
sous-processus. Les trois groupes lents d'aujourd'hui ne paient donc **pas** la relecture : ils
paient le **calcul** — tokeniser 200 documents normatifs, comparer 2 886 paires, classer tous les
scripts.

**C'est un problème différent de celui qu'il a arbitré**, et il appelle des gestes différents
(mémoriser un résultat entre deux groupes, réduire un espace de comparaison, ou accepter le coût).
La contrainte, elle, ne change pas : **on ne retire aucune vérification.**

## Ce que je ne peux PAS affirmer, et le dire vaut mieux que de le combler

**Le total passe de 43,7 s à 202,8 s, soit 4,6 fois plus, pour 1,7 fois plus de groupes.** Je ne
peux pas attribuer cet écart : il peut venir de contrôles neufs réellement lourds (THE-KING #1418
est postérieur à la première mesure), d'une machine différente ou plus chargée, ou des deux. Les
deux mesures n'ont pas été prises dans le même conteneur, et **aucun relevé ne permet de trancher**.
Affirmer « le filet a été multiplié par quatre » serait une attribution, pas une mesure — exactement
ce que cette page reproche au premier diagnostic.
