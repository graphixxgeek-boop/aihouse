# TOOL-LEARNING — instanciation propre à ce projet

*(2026-09-22, nom donné par l'utilisateur. Membre de la Suite Dette & Structure du code — c'est bien
de dette qu'il parle, celle d'un outil qui n'apprend pas. Blueprint générique :
`docs/tool-learning-blueprint.md`.)*

## Pourquoi un agent séparé, et pas une extension de CASSANDRA

Question posée et tranchée par l'utilisateur. Sa vocation unique n'est pas de juger les outils —
c'est de **juger l'agent**, sur sa capacité à les faire progresser. Aucun autre outil du paysage ne
regarde ça.

**Frontière avec CASSANDRA-RH** : elle juge l'**ÉTAT** et les **MOYENS** (ce membre a-t-il mémoire,
rapports, évolutivité ? a-t-il tout pour réussir ?), lui la **TRAJECTOIRE** et l'**USAGE** (s'en
sert-il ? est-il meilleur qu'avant ?).

## L'harmonisation avec SAFE-EXPORT

Elle était déjà dans la formulation de l'utilisateur : « à la fois pouvoir etre exporté, en meme
temps avec des capacités accrues grace à l'apprentissage ». **Deux moitiés d'un seul principe**,
un outil chacune — SAFE-EXPORT porte *pouvoir partir*, TOOL-LEARNING *devenir meilleur*. Ce n'est pas
un découpage inventé pour justifier deux outils : c'est la phrase coupée à sa jointure.

**Lien concret** : la mémoire de SAFE-EXPORT est elle-même un signal d'apprentissage que
TOOL-LEARNING lit — un outil dont les mêmes écarts reviennent passage après passage n'apprend pas,
quoi qu'il archive.

## Volontairement pas un Gardien sacré

Il juge une **trajectoire**, et une trajectoire ne se mesure pas à chaque commit : trois passages
minimum avant de conclure. D'où un item de Ronde (`tool-learning`) plutôt qu'un câblage post-commit.

## Dépendance à connaître

Il ne vaudra que ce que valent les historiques de CASSANDRA et SAFE-EXPORT — or **aucun des deux ne
tient encore de série comparable** (tâche #445). Les brancher conditionne sa valeur.

## L'apprentissage de l'AGENT, pas seulement celui des outils (2026-09-23, tâche #220)

**Une moitié manquait, et c'était la plus périssable.** TOOL-LEARNING vérifiait que les outils
apprennent. Rien ne vérifiait la même chose de mon côté — alors que c'est moi qui disparais à chaque
fin de session : un outil garde son registre, un agent ne garde rien.

**L'origine** : une question directe de l'utilisateur — « quand tu fais des trouvailles bonnes à
retenir [...] il faut que tu l'écrives quelque part, c'est déjà le cas ? » Réponse honnête ce
jour-là : **non**. Les leçons vivaient dans des commentaires de code, chacune locale à l'outil qui
l'avait apprise. Une leçon apprise sur un détecteur de duplication ne pouvait pas servir le jour où
le même piège se présentait ailleurs. `docs/referentiel/lecons.md` a été écrit pour ça.

**Et c'est exactement là que le piège se refermait.** Un registre de leçons que rien ne relit est un
cas de **L2** (« un mécanisme qui ne sort pas du script est une intention ») et de **L7** (« une
intention écrite n'a jamais empêché quoi que ce soit ») — deux leçons qu'il contient lui-même.
L'écrire sans le câbler aurait été la démonstration de son propre contenu.

**Le câblage : chaque leçon déclare son PORTEUR**, le mécanisme réel qui la fait tenir quand plus
personne ne s'en souvient. `auditLecons()` vérifie à chaque passage, et rend **trois états, jamais
deux** :

| État | Ce que ça veut dire | Produit un constat ? |
|---|---|---|
| **portée** | le mécanisme nommé existe vraiment dans le code | non |
| **sans mécanisme** | impossibilité déclarée noir sur blanc AVEC sa raison — ce que L7 prescrit | **non**, la reprocher à chaque passage serait L6 commise par l'outil qui la publie |
| **porteur fantôme** | un mécanisme est nommé et n'existe pas | **oui**, et c'est le pire des trois |

**Pourquoi le porteur fantôme est pire qu'une leçon sans porteur** : une référence morte ressemble à
une garantie, donc elle rassure à tort ; une leçon qui admet n'avoir aucun mécanisme, au moins, ne
promet rien. Même raison d'être que `checkActionChain()` chez god-of-all-process, qui vérifie qu'une
tâche annoncée par un plan d'action existe pour de vrai.

**Limite honnête, déclarée plutôt que tue** : aucune mécanique ne peut juger si un porteur fait
RÉELLEMENT respecter sa leçon — seulement s'il existe. Le cas grossier est attrapé (la promesse sans
code derrière), le subtil ne l'est pas.

**L'état du registre au moment de l'écriture** : 8 leçons, 7 portées par un mécanisme réel, 1
déclarée sans mécanisme possible (L3, « un test ne doit jamais exiger qu'un défaut persiste » —
reconnaître automatiquement qu'une assertion s'appuie sur un défaut réel du dépôt demanderait de
deviner son intention, et produirait du bruit sur les tests légitimes, donc précisément le défaut de
L4), 0 fantôme, 0 muette.

## Le process XP-IA-bonnes-pratiques-et-lecons (2026-09-23, tâche #221)

**Nom donné par l'utilisateur.** Sixième process déclaré du projet, hébergé ici parce que TOOL-LEARNING
porte la moitié 2 de l'évolutivité — devenir meilleur — et que l'apprentissage de l'AGENT en fait
partie au même titre que celui des outils. Document complet : `docs/xp-ia-process-detail.md`.

**Ce que la section précédente ne suffisait pas à garantir.** Le registre existait, il était audité,
et il ne changeait rien à ma façon de travailler le lendemain — parce qu'une leçon relue une fois
par Ronde n'atteint jamais le moment où elle s'applique. L'objectif posé par l'utilisateur est
explicite : « que tu mettes en pratique ces leçons et bonnes pratiques, en plus de t'auto-analyser ».
**Un registre qui n'a jamais changé une décision a échoué, même parfaitement tenu.**

**Les cinq maillons, et `auditChaineXp()` qui les vérifie dans le VRAI dépôt :**

| Maillon | Où il vit | Preuve cherchée |
|---|---|---|
| 1 Découvrir | `scripts/angel-of-ia-process.mjs` | la règle `xp-lecons` |
| 2 Enregistrer | `scripts/tool-learning.mjs` | `enregistrerXp` |
| 3 Analyser à la Ronde | `scripts/circle-tasks.mjs` | le poste `tool-learning` |
| 4a Ressortir avant la tâche | `scripts/tool-brain.mjs` | `leconsPourTache` |
| 4b Ressortir au commit | `scripts/hooks/check-last-commit.mjs` | `leconsPourTache` |

**Au premier passage réel, le maillon 1 était cassé** — l'outil l'a dit, je l'ai branché, il est
repassé au vert. C'est la démonstration que cette fonction ne se contente pas de confirmer ce que je
crois avoir fait.

**Les trois défenses contre le bruit**, parce que l'utilisateur a retenu les DEUX moments de
remontée (avant la tâche ET au commit) en voyant lui-même le risque : le terrain est déclaré par
chaque entrée et jamais deviné · aucune correspondance = rien d'affiché · le plafond est strict
(3 avant la tâche, 2 au commit — après coup la marge de manœuvre est plus étroite).

**Le journal `docs/tool-learning/xp-journal.json`, trois natures qui ne se mélangent pas** :
`captation` (un déclencheur est passé, j'ai répondu — « rien à retenir » compris), `conclusion` (ce
que je tire de la période sur ma façon de travailler, écrit à la main), `jugement` (l'utilisateur
dit si une entrée a été réellement appliquée). `enregistrerXp()` **refuse** un jugement sans
`parUtilisateur: true` : aucune mécanique ne peut prouver son origine, mais elle peut refuser de
l'inventer.

**Première conclusion de période inscrite le 2026-09-23**, et elle est sévère parce qu'elle est
juste : mon travers dominant est de construire le mécanisme et de m'arrêter avant de le brancher —
sept fois en une journée. Le défaut n'est pas l'oubli, c'est qu'un mécanisme construit RESSEMBLE à
un problème traité, ce qui éteint la vigilance juste avant la dernière étape.

## Les quatre améliorations du 2026-09-23 (tâche #222)

Demandées une fois la chaîne en place, parce que la chaîne garantissait le transport de la valeur
sans rien garantir de son **efficacité**.

**③ Le terrain par fichier.** Une même tâche se formule de dix façons : si je dis « je reprends ce
bout de code » sans employer le mot « test », la leçon sur les tests ne remontait pas alors qu'elle
s'applique. Le chemin, lui, ne ment pas. Segment facultatif `· fichiers :` dans le Terrain, joker `*`
qui **ne traverse jamais un séparateur de dossier** (un motif large qui avale les sous-dossiers finit
par tout attraper). Les deux signaux s'additionnent : l'entrée que le mot ET le fichier désignent
remonte en premier. 10 entrées sur 11 déclarent désormais un terrain par fichier ; BP1 n'en déclare
aucun **volontairement** — « la même correction à plusieurs endroits » ne se lit dans aucun chemin.

**④ Regrouper et fusionner les équivalentes, sans jamais perdre.** `groupesEquivalents()` exige un
double recouvrement (terrain **et** formulation) parce que le terrain seul fusionnerait L3 et BP3,
qui parlent toutes deux des tests en enseignant des choses différentes. Regroupement **transitif**
(patron repris de `fusionnerClusters()` chez CLONE-HUNTER). `propositionDeFusion()` rend l'**union**
— terrains, porteurs, formulations — plus le **renvoi obligatoire** sur chaque identifiant absorbé :
une citation de L8 faite il y a un mois doit encore mener quelque part, sans quoi la fusion
fabriquerait la référence morte que cet outil traque. Natures mélangées → avertissement.
**Sur le vrai registre : 0 groupe**, et c'est vérifié dans les deux sens (le détecteur mord sur des
doublons synthétiques, et laisse tranquille une entrée de sujet différent sur le même terrain).

**① Mesurer si ressortir sert.** `.xp-remontees.json` (journal local à la racine, jamais committé — corrigé le 2026-09-23, la fiche annonçait `docs/tool-learning/xp-remontees.json`, un chemin qui n'a jamais existé) compte les occasions et les
remontées, alimenté aux deux points réels (tool-brain, crochet de commit) et **jamais dans
`adviseToolBrain()`** — que la suite de tests appelle, et dont le comptage noierait la mesure sous du
bruit d'outillage. Une entrée remontée souvent et jamais jugée appliquée est nommée.

**② La sortie du registre.** Une entrée jamais remontée après assez d'occasions est du poids mort.
Les deux verdicts sont **« à trancher »**, jamais « retenu » : retirer ou fusionner est une décision
sur ce que le projet garde. Les occasions se comptent **depuis l'arrivée de l'entrée** — sinon une
entrée écrite ce matin serait condamnée pour un passé qui n'est pas le sien (L4).

**Limite honnête** : le compteur mesure des remontées, jamais une application. Douze remontées ne
disent pas qu'une décision a changé — d'où le verdict d'application laissé à l'utilisateur.

## 2026-09-25 — Le verdict n'était pas « pas encore mesurable » : l'étape n'avait jamais été faite (tâches #573 et #576)

**LA QUESTION DE L'UTILISATEUR, dans ses mots** : « est-ce que les outils apprennent bien par eux
même ? », « est-ce que tu apprends, enseigne aux outils, est-ce que ça marche ? », « TOOL-LEARNING
fonctionne bien ? » — et, sur #573, l'exigence explicite d'une réponse **mesurée**, « c'est
précisément le genre de question où une réponse de mémoire ne vaut rien ».

**LA RÉPONSE, MESURÉE EN LANÇANT L'OUTIL POUR DE VRAI.** Tout ce qu'il sait faire mécaniquement
fonctionne et se vérifie :

| Ce qui est mesuré | Résultat réel du 2026-09-25 |
|---|---|
| Registre des leçons | 28 entrées · **18 portées par un mécanisme réel, 10 impossibilités déclarées avec leur raison, 0 sans porteur, 0 porteur fantôme** |
| Peuvent remonter au bon moment | **28 / 28** |
| Chaîne XP branchée dans le vrai dépôt | **5 / 5 maillons** |
| Remontées réelles | **307 occasions** — 8 leçons vivantes, 13 servies sans effet connu, **7 jamais remontées** (L7, L9, L17, L18, L20, L21, L23) |
| Coût de l'aide à un outil | médiane **3 300 tokens**, soit ~9 % d'un agent séparé |

**ET LE DÉFAUT, QUI EST DU TYPE LE PLUS DISCRET QUI SOIT.** `verdicts.json` contient `[]`, et le
rapport en tirait — très honnêtement — « **PAS ENCORE MESURABLE, registre de verdicts vide** ».
C'est vrai. C'est même exactement ce que ce projet exige partout : ne jamais rendre un vert sur
rien.

**Sauf que derrière ce vide il y a DEUX causes indiscernables, et une seule est innocente :**

- l'outil est neuf et n'a pas encore tourné — rien à reprocher à personne ;
- il a tourné **cinq fois en Ronde**, et l'étape que son item réclame nommément (« juger chaque
  outil concerné (`jugerUnOutil`) ») n'a **jamais** été faite — par l'agent.

**C'est la (b) qui est vraie, et la phrase honnête de l'outil la faisait passer pour la (a).** Un
aveu d'absence de mesure qui masque un manquement est pire qu'un silence : **il rassure.** Trois
occurrences du même patron le même soir (le détecteur de dettes de god, le diagnostic de Moïse,
celui-ci) : un mécanisme construit, testé, et que rien n'appelle.

**CE QUI A ÉTÉ AJOUTÉ** : `etapeManuelleJamaisFaite()` et `formatEtapeManuelleLines()`, avec
**trois états, jamais deux** — *sautée* (des passages, zéro verdict) · *rien à reprocher* (ni l'un
ni l'autre) · *pas mesuré* (registre illisible, ce qui n'est jamais zéro passage). Le constat sort
**avant** la ligne de gravité, parce qu'un lecteur qui lit « pas encore mesurable » d'abord conclut
à de la patience avant d'avoir la cause ; et il entre **en tête du plan d'action**, parce que tant
que ce geste n'a pas eu lieu, tout le reste se calcule sur un registre vide.

**CE QU'IL NE FAIT PAS, délibérément** : fabriquer un verdict. Les quatre preuves de `PREUVES`
demandent un jugement par outil qu'aucune mécanique ne sait produire ici ; les dériver au jugé
remplirait le registre de chiffres inventés — une mesure **fausse** au lieu d'une mesure absente.
Rendre l'absence visible et nommée est la seule chose honnête qu'un mécanisme puisse faire quand le
geste manquant est humain (Article 27).
