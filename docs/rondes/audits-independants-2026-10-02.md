# Les deux audits indépendants de la Ronde GOAT — 2026-10-02

Tu avais coché **THE-FINAL-JUDGE** et **HYPER-SCAN complet**. Les deux ont tourné comme agents
séparés, sans voir mes conclusions. Voici ce qu'ils ont trouvé, ce que j'ai vérifié moi-même, et ce
que j'ai corrigé.

**Une règle que je me suis imposée pour ce document** : un rapport d'agent n'est pas une preuve.
Chaque constat ci-dessous porte la mention de ce que **j'ai** re-mesuré de ma main. Ceux que je
n'ai pas pu vérifier sont dits comme tels.

---

## Le plus dur à écrire : un audit m'a pris en faute sur une raison que je venais de committer

En corrigeant le rapport central de l'export, j'ai écrit à côté du correctif que la panne venait de
« la version du 2026-09-28 » et que le fichier n'avait « **jamais** été produit depuis quatre
jours ». **Les deux affirmations étaient fausses.**

**Ce que j'ai vérifié moi-même, en trois mesures que je n'avais pas faites la première fois :**

| Mesure | Résultat |
|---|---|
| `docs/safe-export/rapport-export-central-2026-10-01-00-56.txt` | **existe** — le rapport marchait encore à 00h56 le 1ᵉʳ octobre |
| `git log -S` sur le symbole extrait | le commit fautif est **`917cc3b`, 2026-10-01 à 01h43** (#1356), 47 min plus tard |
| Durée réelle de la panne | **~39 h**, pas quatre jours — et la cause est une **factorisation**, pas la version d'origine |

**Pourquoi je l'écris au lieu de corriger discrètement** : les Articles 19 et 27 veulent que le
POURQUOI vive à côté du QUOI précisément pour que le prochain agent s'y fie. Une cause mal attribuée
l'envoie chercher le défaut au mauvais endroit. J'avais reconstitué une **histoire vraisemblable au
lieu de lire `git log`** — exactement ce que ce projet traque partout ailleurs. La correction est
dans le code, avec les trois mesures, et la leçon est au journal XP.

---

## Le plus gros gain : un contrôleur accusait 119 fois à tort

`god-of-all-process plans` vérifie que chaque tâche annoncée par un plan existe vraiment. Sa lecture
du carnet ne regardait que `docs/suivi/sessions/` — or **une tâche archivée reste une tâche du
projet**.

**Vérifié de ma main** : 737 lignes dans `sessions/`, **605 dans `archives/`** → **45 % du carnet
était invisible**. Et sur douze numéros tirés parmi les « introuvables » (#206, #754, #742, #756,
#741, #214, #215, #152, #199, #223, #730, #658), **douze existaient dans les archives**.

| | Avant | Après correction |
|---|---|---|
| Documents accusés | **10** (≈119 références « mortes ») | **4** |
| Références réellement mortes | — | **4, toutes le même `#92`** |

`#92` est un numéro de gestionnaire de session, pas un numéro durable, et l'outil **déclare
lui-même** ne pas savoir les distinguer. Donc **correctement nourri, ce contrôle ne trouve plus un
seul défaut tranchable** : sa sortie précédente était du bruit à 96 %.

**Et le même défaut avait déjà été corrigé ailleurs, avec sa raison écrite** — « ARCHIVE COMPRISE :
une tâche archivée reste une tâche du projet », depuis le 29 septembre. Le lecteur canonique existait
**trois jours avant** la dernière retouche du lecteur fautif. C'est l'Article 24 mot pour mot : le
nouveau venu n'avait rien hérité.

---

## Le plus structurant : un contrôle vert par construction depuis dix jours

Le seul contrôle « en direct » de la chaîne *rapport → plan → tâches* imprimait
« ✅ chaque constat retenu porte sa tâche » **sur une liste vide**. Et **personne ne l'alimente** :
son paramètre vaut `[]` par défaut, et le nom n'apparaît que deux fois dans tout le dépôt — les deux
dans sa propre définition.

**Le détail qui rend ça structurel et non accidentel** : trente lignes plus bas, **dans le même
fichier**, une fonction voisine refuse explicitement ce piège depuis trois jours plus tôt, avec sa
raison écrite. Deux doctrines opposées sur le même sujet, dans le même fichier — et c'est la plus
ancienne qui n'avait pas été reprise.

**Corrigé** : rien reçu → **PAS MESURÉ** ; une chaîne reçue et close → le ✅ **avec son
dénominateur**. **Ce qui reste ouvert** : personne ne l'alimente, et le brancher demande de décider
qui lui passe les plans et quand.

---

## Quatre défauts dans le détecteur que j'avais écrit la nuit même

Et le constat qui fait le plus mal n'est aucun des quatre : **la rigueur avait été appliquée à la
trouvaille latérale du même commit — quatre assertions, les deux sens, le refus d'un parc illisible
— et pas à la fonctionnalité phare, partie sans un seul test.**

1. **Aucun troisième état.** Un fichier illisible rendait « aucune raison écrite » — donc une
   re-prescription de travail déjà fait. Le défaut même que ce détecteur existe pour corriger.
2. **L'extrait cité était le sujet, pas la décision.** Ça tombait juste sur les quatre paires
   réelles **par chance**, et le commentaire d'à côté affirmait une règle que le code n'appliquait
   pas.
3. **Il s'exonérait lui-même** : un doublon dans son propre fichier était « instruit » par son
   commentaire d'en-tête. Le piège était nommé **deux fois** dans le commit qui l'a introduit.
4. **Un `{mesurable:false}` est un objet, donc « truthy »** : ma propre correction du point 1 a
   ouvert le risque de compter une non-mesure comme une raison trouvée. Vu en l'écrivant.

**Les quatre sont corrigés et couverts par cinq éprouvettes.** Et le troisième état s'est vérifié
**sur son propre auteur, deux fois** : l'éprouvette écrite pour le couvrir avait un lecteur cassé, et
le détecteur a répondu « PAS MESURÉ — ma lecture est en cause » au lieu de « cette raison n'existe
pas ». Sans ce troisième état, j'aurais cherché le défaut dans le mauvais fichier.

---

## Un garde-fou qui promettait plus qu'il ne tenait

Mon garde-fou des registres annonçait couvrir « **chaque** site d'appel » et en voyait **86 sur 89** :
`scripts/hooks/` était invisible — précisément le dossier câblé à **chaque commit**, et où un appel
réel se trouve. Corrigé : 86 → **89** scripts, 3 → **5** sites détectés.

---

## Ce que je n'ai pas corrigé, et pourquoi

Quatre questions sont portées dans `docs/idees-a-trancher.md`, parce que ce sont des décisions de
conception et non des corrections :

1. **393 constats dans 99 registres d'outils sont invisibles à la chaîne**, parce que la charte
   impose un registre par outil tout en ne faisant lire à la chaîne qu'un seul format. C'est
   **exactement** comme ça que le constat du 26 septembre s'est perdu : pas oublié, **illisible**.
2. **Personne ne lit le code de sortie d'une commande d'outil.** 39 scripts ont des sous-commandes,
   le banc témoin n'en passe aucune, les crochets avalent tout. C'est la cause structurelle du
   rapport cassé pendant 39 h.
3. **Un quatrième état de constat** est employé dans un registre, alors que l'Article 28 dit « trois
   états, jamais deux ». Trancher est une modification de la charte : double confirmation.
4. **Les numéros de session dans les plans** — le cas `#92`.

Et un constat réel que j'ai **ouvert comme tâche plutôt que corrigé en fin de Ronde** : le plan
d'action n'atteint le fichier du rapport que chez **1 outil sur 48** ; les 47 autres l'impriment au
terminal, où il disparaît. Le corriger veut dire changer le gabarit pour 48 outils d'un coup.

---

## Ce que les audits n'ont PAS pu juger, et ils le disent

- **Le filet de sécurité** : je leur avais interdit de le lancer (9 minutes). Ils n'ont donc pas
  vérifié mes « 408 Passed, EXIT=0 » — et l'un d'eux rappelle que c'est justement le code de sortie
  qui tranche, pas le nombre de lignes.
- **La légitimité de tes 4 accords CLONE-HUNTER** : hors de leur portée. L'un a toutefois lu les
  quatre raisons une par une et les juge solides.
- **Le reste de l'outillage** : hors périmètre demandé, et leurs constats de classe sont bornés à ce
  qu'ils ont mesuré, pas extrapolés.

---

## Plan d'action

| État | Constat | Suite |
|---|---|---|
| **RETENU — fait** | raison écrite fausse sur la panne de l'export | **#1454** corrigé avec les trois mesures |
| **RETENU — fait** | lecteur aveugle à 45 % du carnet, 115 fausses accusations sur 119 | **#1461** corrigé, mesuré avant/après |
| **RETENU — fait** | contrôle vert par construction sur zéro donnée | **#1462** corrigé, trois états |
| **RETENU — fait** | quatre défauts du détecteur de raison écrite | **#1463** corrigés, cinq éprouvettes |
| **RETENU — fait** | garde-fou aveugle à `scripts/hooks/` | inclus dans **#1461** |
| **RETENU** | le plan d'action n'atteint le fichier que chez 1 outil sur 48 | tâche à ouvrir, 48 outils concernés |
| **À TRANCHER** | les 4 questions ci-dessus | `docs/idees-a-trancher.md` |
| **ÉCARTÉ** | le `\|\| true` des crochets post-commit | décision assumée et cohérente avec « god signale, ne bloque jamais » ; le problème est qu'aucun **autre** mécanisme ne lise un code de sortie, ce qui relève de la question 2 |
| **ÉCARTÉ** | le détecteur de raison écrite est sans effet observable aujourd'hui | tes 4 accords évacuent les clusters en amont ; il reste le filet pour les futurs doublons, et son coût est déjà payé |
