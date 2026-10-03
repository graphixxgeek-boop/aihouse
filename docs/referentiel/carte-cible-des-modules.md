# LA CARTE CIBLE DE L'ORGANISATION PAR MODULES

> **DÉCOULE DE :** `docs/strategies/strategie-globale-du-projet-entier.md`
> *la carte cible est une DIRECTION, pas une conviction : elle appartient donc à la stratégie, et
> hérite par elle de la cible du projet entier et du document de gouvernance.*

*(Établie le 2026-10-02T07:34Z — heure LUE, source système. Tâche **#1420**.)*

---

## ⚠️ STATUT : PROPOSITION NON VALIDÉE

**Aucune ligne de ce document n'est acquise.** Il est écrit pour être **contesté ligne par ligne**,
et chacune porte la mesure qui l'a suggérée pour qu'on puisse la contester sur pièces plutôt que
d'opinion à opinion. Tant que le responsable de projet ne l'a pas arrêté, l'écart mesuré contre
cette cible dit *« écart avec une proposition »*, jamais *« retard sur un objectif »*.

**LISTE VOLONTAIREMENT TENUE À LA MAIN, et c'est déclaré ici au titre de l'Article 24.** Une cible
est un CHOIX ; rien dans le dépôt ne peut la dériver, et un mécanisme qui la générerait rendrait
simplement l'état actuel en le rebaptisant « cible ». **C'est la difficulté du chantier, et elle est
dite plutôt que contournée** : la carte ACTUELLE ne peut pas se périmer parce qu'elle est générée ;
celle-ci le peut, et c'est le prix de son existence. Ce qui la protège n'est pas un générateur,
c'est la mesure d'écart (`node scripts/cassandra-rh.mjs carte-cible`), qui signale toute famille
nommée ici et disparue du dépôt — ou l'inverse.

---

## IL EXISTE UNE SECONDE CARTE CIBLE DEPUIS LE 2026-10-03, ET ELLES NE RÉPONDENT PAS À LA MÊME QUESTION

**À lire avant tout le reste, sans quoi on croira que l'une remplace l'autre.** Le 2026-10-03,
l'utilisateur a donné une définition nouvelle du mot module — « un ensemble d'agents qui œuvrent
dans un sens commun pour produire UNE PRESTATION de l'Agence » — et demandé, dans le même message,
d'**oublier les familles qu'il avait créées**. `node scripts/le-coordinateur.mjs carte` produit
depuis ce jour-là une seconde paire de cartes, bâtie sur les PRESTATIONS et non sur les familles
(`docs/livrables/carte-des-modules-<date>.md`, tâche #1536).

| | Cette carte-ci (#1420) | La carte par prestations (#1536) |
|---|---|---|
| **Son axe** | les 7 FAMILLES de l'organigramme | les 76 PRESTATIONS du catalogue |
| **Ce qu'elle fixe** | effectif visé, détachabilité, ce que la famille doit porter | quels outils forment un module, et lesquels n'en forment pas |
| **Son statut** | proposition non validée, tenue à la main | proposition non validée, partie actuelle dérivée |
| **Ce qui la mesure** | `cassandra-rh carte-cible` | `le-coordinateur carte` |

**AUCUNE DES DEUX N'ANNULE L'AUTRE AUJOURD'HUI, et c'est une situation à trancher plutôt qu'un
équilibre.** Sa consigne d'oublier les familles vise le TABLEAU qui accompagne le schéma, pas
nécessairement ce document-ci ; mais tant que les deux cartes cibles coexistent, un lecteur ne
peut pas savoir laquelle fait foi — et deux porteurs de la même intention finissent toujours par
diverger (leçon L29). **La question lui revient**, et elle est ouverte.

**COMMENT CE DOUBLON A ÉTÉ CRÉÉ, parce que la cause vaut plus que le constat** : la reprise des
notes (Article 30) a été faite sur « carte des modules » et a rendu DEUX fichiers. Deux, ce n'est
pas zéro — ça ressemble donc à une recherche réussie, et la seconde tentative que l'Article 30
prescrit après un zéro n'a pas eu lieu. La même commande sur « carte cible » rend vingt-trois
fichiers.

---

## CE QUE CETTE CARTE FIXE, ET CE QU'ELLE NE FIXE PAS

**Elle fixe trois choses par famille**, et seulement trois, parce que ce sont les seules qui se
vérifient : un **effectif visé** (une fourchette, jamais un nombre exact — un nombre exact
transforme un cap en comptage), un verdict de **détachabilité**, et ce que la famille **doit
porter** ou **ne doit pas porter**.

**Elle ne fixe ni les noms, ni le rangement individuel de chaque outil.** Un nom est choisi par le
responsable de projet, jamais par l'agent, et le rangement d'un outil dans une famille est un
jugement que l'organigramme porte déjà. **Déplacer un outil n'est pas l'objet de ce document** : il
dit où doivent aller les FAMILLES, pas où doit aller chacun.

---

## LA CIBLE, FAMILLE PAR FAMILLE

| Famille | Effectif visé | Détachable | Ce qu'elle doit porter | Ce qu'elle ne doit PAS porter |
|---|---|---|---|---|
| Les Anges de la coordination | 14-17 | non | ce qui fait tenir le travail ensemble : le suivi, la Ronde, les fils, le choix de l'outil | de la mesure brute qui ne sert aucune décision de coordination |
| La Gouvernance Royale | 12-14 | non | qui compose l'équipe, ce que chaque outil vaut, ce que tout coûte, et si les objectifs sont tenus | la PLOMBERIE appelée par tout le monde, qui n'est pas de la gouvernance mais de l'infrastructure |
| Les Prophètes - Dette & Structure du code | 8-10 | non | ce qui FREINE : l'empilement, la lenteur, les règles qui coûtent plus qu'elles ne rapportent | un contrôle qui tourne à chaque commit, qui relève des Gardiens sacrés |
| Les Gardiens Sacrés du Code | 7-8 | non | un vrai scan de qualité du code, gratuit et mécanique, à CHAQUE commit | tout ce qui exige un raisonnement payant, exclu par le critère même du rang |
| La Suite Tarantino - Simulation & qualité narrative | 7-9 | **OUI** | le jugement du JEU : le ton, la qualité d'une partie, les captures, la mémoire narrative | quoi que ce soit dont l'outillage dépende en retour |
| Les Boosters de Navigation | 4-5 | non | retrouver vite dans un gros fichier, sans tout relire | un jugement sur ce qui est trouvé |
| Les Agents Externes - Audit indépendant | 2-3 | **OUI** | un avis EXTÉRIEUR, par une IA séparée, lancé sur décision | tout ce qui doit tourner sans décision humaine, puisque ces outils coûtent |

**POURQUOI « DÉTACHABLE » EST LA SEULE COLONNE QUI PÈSE VRAIMENT.** L'objectif ultime du niveau
PROJET exige que l'outil et l'œuvre *« tiennent debout l'un sans l'autre »*. Deux familles doivent
donc pouvoir partir sans rien casser : celle qui juge le Jeu, et celle qui coûte de l'argent.
**Les deux le sont déjà** — zéro script ne les importe, mesuré le 2026-10-02 — et la cible est ici
de **ne pas le perdre**, ce qui est une cible à part entière : un acquis sans garde-fou se défait
au premier import ajouté par commodité.

---

## LES TROIS ÉCARTS QUE CETTE CIBLE DÉSIGNE, ET ILS SONT MESURÉS

**1. La Gouvernance Royale porte de la plomberie, et ça fausse sa lecture.** Relevé du 2026-10-02 :
66 scripts cesseraient de fonctionner sans elle — dont **65 par le seul `tool-usage`, soit 98 %**.
Le compteur d'usage est appelé par politesse par presque tout le monde ; ce n'est pas de la
gouvernance, c'est de l'infrastructure. **Le chiffre ne dit pas « cette famille porte tout », il dit
« un de ses fichiers est appelé partout »** — et les deux ne mènent pas à la même décision. Cible :
15 → 12-14, en sortant ce qui relève de l'infrastructure.

**2. Les Anges de la coordination sont la plus grosse famille, et la plus hétérogène.** 19 outils,
28 scripts dépendants, dont 9 par le seul `check-tasks-details` (32 %) — une concentration bien plus
saine que la précédente, donc ce n'est pas la dépendance qui pose problème ici, c'est le PÉRIMÈTRE.
Cible : 19 → 14-17.

**3. Les deux familles détachables le sont, et rien ne le garde.** Zéro import entrant, pour l'une
comme pour l'autre. **C'est le seul endroit de cette carte où la cible est déjà atteinte** — et donc
le seul où le travail n'est pas d'avancer mais d'empêcher de reculer.

---

## LE PREMIER PASSAGE DE LA MESURE, ET IL DIT QUELQUE CHOSE D'INATTENDU

*(`node scripts/cassandra-rh.mjs carte-cible`, passage du 2026-10-02T07:34Z.)*

**5 familles sur 7 sont DÉJÀ dans leur fourchette visée.** Seules deux dépassent, et de peu : les
Anges de la coordination à +2, la Gouvernance Royale à +1. Les deux verdicts de détachabilité sont
tenus.

**CE RÉSULTAT EST GÊNANT, ET C'EST POUR ÇA QU'IL EST ÉCRIT PLUTÔT QUE RETOUCHÉ.** Une cible qui
s'avère atteinte à 5/7 dès son premier passage ressemble beaucoup trop à l'état actuel rebaptisé —
exactement ce que l'Article 31, faille 2, appelle un outil fabriqué pour cocher une case. **La
tentation évidente serait de resserrer les fourchettes jusqu'à faire apparaître un écart.** Ce
serait fabriquer le résultat qu'on voulait lire, et ça rendrait la mesure définitivement inutile.

**LA LECTURE HONNÊTE EST AILLEURS, et elle est plus utile** : si presque tout est au bon NOMBRE,
alors le problème de l'organisation par modules n'est pas un problème de taille. **Il est dans ce
que chaque famille PORTE**, et c'est précisément la colonne que la mesure déclare hors de sa portée.
Les 98 % de dépendances de la Gouvernance Royale venant d'un seul fichier de plomberie en sont
l'illustration : cette famille est au bon effectif ET mal composée, et aucune fourchette ne verra
jamais ça.

**CE QUE ÇA CHANGE POUR LA SUITE DU CHANTIER** : la question à trancher n'est pas « combien d'outils
par famille », elle est **« qu'est-ce qui n'est pas à sa place »**. La fourchette reste utile comme
garde-fou contre une famille qui enflerait sans qu'on le voie ; elle ne sera jamais le cœur de la
cible.

---

## PLAN D'ACTION *(Article 28)*

| État | Constat | Ce qui en découle |
|---|---|---|
| **RETENU** | la carte cible qu'il avait demandée n'existait nulle part, alors que la carte actuelle est livrée depuis le 2026-10-01 | **FAIT** — ce document, en PROPOSITION, tâche **#1420** |
| **RETENU** | une cible écrite à la main se périme en silence, exactement ce que l'Article 24 interdit | **FAIT** — `node scripts/cassandra-rh.mjs carte-cible` mesure l'écart et signale toute famille nommée ici et absente du dépôt, ou l'inverse |
| **À TRANCHER** | les sept effectifs visés et les deux verdicts de détachabilité | **sa décision, aucune ne m'appartient** — inscrit dans `docs/idees-a-trancher.md` |
| **ÉCARTÉ** | générer la cible à partir de l'état réel | **raison écrite** : un générateur rendrait l'état actuel rebaptisé « cible », donc un écart nul par construction. Un écart qui ne peut pas être non nul ne mesure rien |
| **ÉCARTÉ** | fixer un effectif exact par famille plutôt qu'une fourchette | **raison écrite** : un nombre exact transforme un cap en comptage, et pousse à déplacer un outil pour faire tomber un chiffre juste |
