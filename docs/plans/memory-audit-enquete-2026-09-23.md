# memory-audit et les scripts de simulation — enquête, sans aucun changement

*(Chantier 11 du plan de nuit. Tu avais demandé une enquête et une explication écrite, **aucun
changement** : rien n'a été modifié dans le code. Les corrections possibles sont proposées à la fin,
pour ta décision.)*

## Ce que fait memory-audit, en une phrase

Il vérifie que la **mémoire persistée des personnages** reste cohérente d'un tour à l'autre : que les
événements datés restent dans l'ordre où ils se sont produits, qu'un compteur ne se remette pas à
zéro sans raison, qu'un souvenir grave ne soit pas silencieusement remplacé par un souvenir anodin.

Il ne juge JAMAIS ce que les personnages disent — c'est le travail d'EL-PROFESSOR. Il regarde la
structure des données, pas leur contenu.

---

## La trouvaille principale : il n'a jamais tourné une seule fois

Son propre registre le dit, en toutes lettres, depuis le 2026-09-21 :

> « Création de memory-audit — **aucun constat encore produit**, en attente d'une première
> simulation réelle pour alimenter ce registre. »

Ce n'est pas une surprise en soi. Ce qui l'est, c'est la suite.

### Et pourtant, le process de simulation le compte comme fait

Le protocole de simulation déclare une étape « contrôler la mémoire narrative persistée après la
partie (memory-audit) ». Pour vérifier qu'elle a bien eu lieu, le contrôleur cherche un fichier
`.md` dans le dossier de memory-audit.

**Il en trouve un : le registre vide lui-même.** L'étape est donc comptée comme tracée — 10 étapes
sur 15 le sont, et celle-ci en fait partie — alors qu'elle n'a jamais été exécutée.

C'est exactement le défaut que ce projet traque partout ailleurs, arrivé ici par un chemin
particulièrement discret : **une preuve qui peut être satisfaite par le registre vide qu'elle est
censée remplir ne prouve rien.** Le registre est honnête, le contrôleur est honnête, et la
combinaison des deux ment.

---

## Pourquoi il n'a jamais tourné : la raison est structurelle, pas un oubli

`checkMemoryCoherence(life, lifePrecedente)` a besoin de **deux états** : la mémoire maintenant, et
la mémoire d'avant. C'est le principe même d'une vérification de cohérence dans le temps.

Or le script qui lance une simulation (`scripts/run-simulation.mjs`) :

- interroge bien l'état du monde à la fin (`/api/world`), donc **la mémoire finale est disponible** ;
- **ne garde aucune photo de l'état précédent**, à aucun tour.

Il n'y a donc pas de « avant » à comparer. Ce n'est pas que personne n'a pensé à appeler l'outil :
**on ne pouvait pas l'appeler**, faute de la moitié de ce dont il a besoin.

L'outil lui-même est parfaitement lucide là-dessus — lancé à froid, il refuse de rendre un verdict
et l'écrit :

> « PAS MESURÉ, et ce n'est pas un vert : aucun état de jeu n'est fourni, donc rien n'a été
> comparé — ce silence ne dit rien sur la santé de la mémoire. »

C'est la bonne attitude, et c'est ce qui rend le trou repérable plutôt que masqué. Mais un outil
honnêtement muet reste un outil muet.

---

## Ce que ça coûte réellement

Pas grand-chose aujourd'hui, et beaucoup demain :

- **Aujourd'hui** : trois vérifications existent, sont testées, et ne protègent rien. Un mélange
  chronologique dans les souvenirs, une remise à zéro de compteur, une gravité qui régresse —
  aucune de ces trois anomalies ne serait vue si elle se produisait.
- **Demain** : ce sont précisément les anomalies qui produisent des dialogues incohérents sans que
  le dialogue lui-même paraisse fautif. Un personnage qui « oublie » un événement grave donnera une
  réplique parfaitement bien écrite et complètement fausse — le genre de défaut qu'une lecture du
  transcript ne rattrape pas, parce qu'il faut connaître l'état d'avant pour le voir.

---

## Trois corrections possibles — ta décision, rien n'a été fait

**A. Photographier la mémoire à chaque tour pendant la simulation.** Le script garde l'état
précédent, appelle la vérification après chaque tour, et écrit les écarts dans le registre. C'est la
correction complète, et la plus fidèle à l'intention de l'outil. Coût : une modification du script
de simulation, qui touche au déroulé d'une simulation — donc pas quelque chose que je fais seul.

**B. Comparer seulement le début et la fin.** Beaucoup plus simple : une photo au premier tour, une
au dernier. On perdrait le tour exact où l'anomalie apparaît, mais on saurait qu'elle a eu lieu.
Un demi-verdict vaut mieux qu'aucun.

**C. Resserrer la preuve du process, indépendamment de A et B.** Aujourd'hui l'étape est validée par
n'importe quel `.md` du dossier, y compris le registre vide. La preuve devrait exiger un fichier de
CONSTAT daté, jamais l'index. C'est une correction de quelques lignes, et elle vaut d'être faite
même si tu choisis de ne rien changer d'autre : sans elle, le jour où A ou B sera en place, on ne
saura toujours pas distinguer « vérifié » de « jamais lancé ».

**Ma recommandation, si tu en veux une** : C tout de suite (elle ne coûte rien et elle rend le trou
visible), puis B à la prochaine simulation (petit, réversible, et il donnera le premier vrai constat
du registre). A seulement si B montre qu'on a besoin du tour exact.

---

## Et ce n'est pas un cas isolé — j'ai vérifié

Onze étapes de process, dans l'ensemble du paysage, sont prouvées par « un fichier dans tel
dossier ». J'ai regardé lesquelles de ces preuves peuvent être satisfaites par le seul index du
dossier, c'est-à-dire sans qu'aucun travail réel n'ait eu lieu :

| Dossier | Fichiers | Dont de vrais constats |
|---|---|---|
| `docs/check-tasks-details/` | 51 | 50 ✅ |
| `docs/el-professor/` | 19 | 18 ✅ |
| `docs/the-screener/` | 5 | 4 ✅ |
| `docs/rapports-de-nuit/` | 1 | 1 ✅ |
| **`docs/memory-audit/`** | **1** | **0** ⚠️ |
| **`docs/simulations/scripts/`** | **1** | **0** ⚠️ |

**Deux étapes sur onze**, pas une. La seconde — « rédiger le script de simulation selon la norme » —
est dans la même situation exactement : son dossier ne contient que son index, et l'étape passe pour
tracée.

Les quatre autres sont saines, et c'est une bonne nouvelle : le problème n'est pas la forme de
preuve « un fichier dans ce dossier », qui marche très bien dès qu'un vrai travail l'alimente. Le
problème est qu'elle ne distingue pas le premier jour du centième.

## Ce que cette enquête a appris au-delà de memory-audit

Une leçon transverse, enregistrée sous **L13** : *une preuve qui peut être satisfaite par le
registre vide qu'elle est censée remplir ne prouve rien.* Elle vaut pour n'importe quelle étape de
n'importe quel process qui déclare « un fichier dans ce dossier » comme preuve — et il y en a
plusieurs.
