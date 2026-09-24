# État des lieux après classification — 2026-09-24

*(Chantier 1.5 du plan de nuit `docs/plans/nuit-2026-09-24-plan.md`. Écrit après avoir lancé les
deux classifications pour de vrai contre le dépôt réel, jamais depuis une lecture de mémoire —
c'est la seule façon dont les cinq faux verdicts de la nuit sont apparus, et ils ont produit plus
de valeur que les chiffres eux-mêmes.)*

## Ce qui a été classé, et sur quels axes

Deux classifications distinctes, volontairement, parce qu'elles répondent à deux questions que
rien ne reliait jusque-là :

| | Ce qui est classé | Axe 1 | Axe 2 | Outil |
|---|---|---|---|---|
| **Les RÈGLES** | CLAUDE.md · docs/regles-de-travail.md | force de GARANTIE (6 niveaux) | GRAVITÉ (4 niveaux) | ABRAHAM-LES-REFERENCES |
| **Les SCRIPTS** | les 82 fichiers de `scripts/` | TYPE (ce qu'un fichier EST) | CLASSES transverses (ce qu'il SAIT FAIRE) | CASSANDRA-RH |

## Les règles — où on en est

**`CLAUDE.md`** : 30 Articles, 63 % du document réellement découpé en règles numérotées.

| Verdict | Nombre | Ce que ça veut dire |
|---|---|---|
| 🔴 CRITIQUE | **2** | vitale, et rien du tout ne la porte |
| 🟠 À NIVELER | 4 | la garantie existe mais reste loin de l'enjeu |
| 🟡 un cran manque | 11 | protégée, mais pas au niveau que sa gravité appelle |
| 🟢 à niveau | 13 | la protection est à la hauteur |

**Les deux critiques sont la même règle, écrite deux fois** : l'**Article 7** (« l'épreuve de la
page blanche ») et l'**Article 23** (« ALWAYS-NEW-CODE : l'épreuve de la page blanche, rendue
concrète »). Toutes deux marquées vitales par leur propre texte, toutes deux sans le moindre
mécanisme et sans impossibilité déclarée. C'est cohérent avec ce que l'Article 23 raconte
lui-même : le vrai zoom profond d'ALWAYS-NEW-CODE n'est jamais automatique. Mais alors la règle
demande une chose que rien ne rappelle, ne demande et ne constate — exactement ce que l'Article 27
interdit.

**`docs/regles-de-travail.md`** : 19 règles, 96 % de couverture, **aucune critique**, 3 🟠, 8 🟡,
8 🟢, une seule règle sans le moindre porteur.

**Le résultat contre-intuitif, et c'est lui qui mérite une décision** : le document « secondaire »
est mieux protégé que la charte elle-même. Six de ses règles hautes sont DEMANDÉES par
`angel-of-ia-process`, un mécanisme que la charte n'utilise presque pas alors qu'elle porte les
règles les plus graves.

## Les scripts — où on en est

82 fichiers dans `scripts/` :

| Type | Nombre |
|---|---|
| outil | 46 |
| bibliothèque partagée | 18 |
| bibliothèque solitaire | 5 |
| à exécution directe non documentée | 4 |
| crochet git | 4 |
| infrastructure shell | 4 |
| filet de sécurité | 1 |

Et par classe transverse (un fichier en porte plusieurs) : 44 enregistrent leur usage, 37
déclarent leur marge d'erreur, 35 tiennent un registre, 32 scannent le dépôt, 26 concluent par un
plan d'action, 24 savent répondre « pas mesuré », 18 rendent du HTML, 4 coûtent de vrais appels API.

## Les cinq écarts qui en sortent, et ce qu'on en fait

Chacun est soit un **CONSTAT** (mesuré, il tient tel quel, il devient une tâche), soit une
**QUESTION** (un jugement que l'outil ne rend pas, elle monte à l'utilisateur) — la frontière de
l'Article 28.

| # | Nature | Ce qui est constaté | Combien | Tâche |
|---|---|---|---|---|
| 1 | CONSTAT | 21 outils ne déclarent jamais leur marge d'erreur : leurs chiffres se lisent comme des certitudes | 21 | **#653** |
| 2 | CONSTAT | 12 outils scannent le dépôt sans jamais savoir répondre « pas mesuré » (leçon L5) | 12 | **#654** |
| 3 | CONSTAT | 2 outils que la documentation dit de lancer à la main sans jamais écrire la commande | 2 | **#655** |
| 4 | QUESTION | 5 bibliothèques importées par un seul fichier : à fusionner, ou clients manquants ? | 5 | **#656** |
| 5 | QUESTION | 2 scripts qu'absolument rien n'atteint (`install-ci.mjs`, `pnpm-install.mjs`) | 2 | **#657** |

Et sur les règles :

| # | Nature | Ce qui est constaté | Tâche |
|---|---|---|---|
| 6 | À TRANCHER | Articles 7 et 23, vitaux et sans aucun porteur — même règle écrite deux fois | **#658** |
| 7 | À TRANCHER | la charte est moins bien protégée que les règles de travail : généraliser `angel-of-ia-process` à ses règles hautes ? | **#659** |

## Ce que cette classification ne sait PAS, et il faut le lire avant de s'en servir

- La **GRAVITÉ** est dérivée de signaux que le texte porte lui-même, jamais d'un jugement sur ce
  qu'une règle enfreinte coûterait vraiment. Aucun programme ne sait ça.
- Le **TYPE** se dérive de la forme du fichier et les **CLASSES** de sondes sur son texte : un
  outil qui scanne le dépôt sans appeler `readdirSync` échappe à sa classe.
- Aucune sonde ne sait ce qu'un script fait VRAIMENT. Ce recensement dit ce qui se voit, jamais ce
  qui se comprend.

## La leçon de la nuit, et elle vaut plus que les chiffres

**Cinq faux verdicts, produits par les deux outils écrits pour traquer exactement ce défaut-là.**
Quatre trouvés en lançant l'outil contre le vrai dépôt, un cinquième en écrivant une assertion.
Aucun n'aurait été trouvé par relecture.

Le pire des cinq mérite d'être retenu : la classification accordait le niveau BLOQUANTE dès qu'un
nom de mécanisme APPARAISSAIT dans `check-house.mjs` — un fichier de onze mille lignes qui cite
presque tous les scripts du dépôt dans ses commentaires et ses lignes `Passed: …`. Treize Articles
sur trente sortaient « bloquants ». Dont l'Article 0. Et l'une des mentions qui lui valait cette
note venait **de la fixture de test que je venais d'écrire pour cette fonction même**.

Un outil qui se décerne sa propre protection, c'est le fil rouge de toute cette campagne, reproduit
une fois de plus : *un contrôle qui ne regarde qu'une tranche rend un chiffre juste pour sa tranche
et faux pour l'ensemble — et le vert qu'il affiche est plus dangereux que pas de contrôle du tout,
parce qu'il occupe la place.*
