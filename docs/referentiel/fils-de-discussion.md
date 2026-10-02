# LES FILS DE DISCUSSION — instanciation sur ce projet

*(Fiche de référence. Le blueprint générique vit dans `docs/fils-de-discussion-blueprint.md` ;
celle-ci dit ce que l'outil est DEVENU ici, jamais ce qu'il est en général.)*

| | |
|---|---|
| **Script** | `scripts/fils-de-discussion.mjs` |
| **Registre** | `docs/fils/` — un fichier par sujet, plus `index.md` qui sert de carte |
| **Blueprint** | `docs/fils-de-discussion-blueprint.md` |
| **Rendez-vous** | item de Ronde `fils-de-discussion` (`scripts/circle-tasks.mjs`) |
| **Né le** | 2026-09-30 |

---

## POURQUOI IL EXISTE ICI, ET LA RAISON EST DATÉE

Le 2026-09-30 au soir, l'utilisateur a constaté que je n'étais pas à jour — et il avait raison
quatre fois de suite, sur des faits vérifiables que j'affirmais avec assurance. Ses mots : *« tu as
respecté la moitié de mes consignes »*, puis *« 2h que nous brassons du vent »*.

**La cause racine n'était ni la paresse ni la vitesse.** Le fil unique en place
(`docs/grand-projet/fil-de-discussion.md`) était rangé **par date**. Il répondait à *« qu'est-ce
qui s'est dit le 29 ? »* et jamais à *« où en est-on sur la sécurité ? »*. Comme il ne portait
aucune erreur, rien ne pouvait le signaler comme inutilisable.

**Sa demande, mot pour mot** : *« Chaque fil de discussion est un doc HTML individuel… en partie 1
le résumé de tout ce qui a appartenu historiquement à ce fil… partie 2, on retrouve les questions
d'actualité… puis la partie 3 : la chaîne de questions-réponses à jour. Avec des repères numérotés
comme d'habitude pour que je puisse les utiliser quand je te réponds. »* Et la borne qui va avec :
*« ATTENTION le fil de conversation ne sert pas à archiver : les originaux de nos échanges doivent
toujours être accessibles. »*

---

## QUELS SUJETS, AUJOURD'HUI — et pourquoi la liste n'est PAS écrite ici

**La liste des fils se LIT sur `docs/fils/`, elle ne se recopie jamais** (Article 24 : un registre
se lit). Une liste figée dans une fiche se périme au premier sujet ajouté, et ce projet en a déjà
payé le prix ailleurs. `docs/fils/index.md` la reconstruit à la main comme carte d'entrée, et
`node scripts/fils-de-discussion.mjs` la reconstruit mécaniquement à chaque passage.

**Ce qui est propre à ce projet et ne se lit nulle part ailleurs, en revanche** : les fils se
rangent en deux familles, et la distinction commande l'ordre de travail. Une **cascade** — les
sujets où sauter une marche fait rediscuter toutes les suivantes, l'objectif ultime en tête. Des
**transverses** — ceux qui n'attendent personne et traversent tout le reste. Le marqueur
`**Place dans le plan :**` de chaque fil dit à laquelle des deux il appartient.

---

## CE QUE L'OUTIL RÉPOND, ET CE QU'IL REFUSE DE RÉPONDRE

Il rend le verdict **SUIS-JE À JOUR** en trois états : `OUI` · `NON` · `PAS ENTIÈREMENT MESURÉ`.

**Sur ce projet-ci, le contrôle n°1 est structurellement aveugle** et le restera : les documents
que l'utilisateur envoie arrivent en pièce jointe, hors du dépôt. Le script peut dire ce qui EST
déposé ; il ne peut jamais dire ce qui manque. Il affiche donc ⚪ et refuse de conclure `OUI` —
même quand les trois autres contrôles sont verts, comme c'est le cas depuis sa création.

**C'est volontaire, et c'est la leçon la plus chère du projet appliquée à un outil neuf** : un
satisfecit rendu sur zéro donnée est pire que pas de réponse du tout (cf. `check-spirit`, qui
affiche `🚨 PAS MESURÉ` pour exactement la même raison, sur la loi suprême du projet).

---

## CE QUI RESTE À LA MAIN, ET POURQUOI ÇA DOIT Y RESTER

**Le contenu d'un fil s'écrit à la main.** Résumer l'histoire d'un sujet est un jugement : une
génération automatique produirait une apparence de synthèse, c'est-à-dire exactement le genre de
document qui rassure sans informer. L'outil **lit** les fils et mesure leur forme ; il n'écrit
jamais leur fond.

**Déposer une demande orale reste un geste humain.** Aucune commande ne peut signaler l'absence de
ce qui n'a jamais été déposé — c'est l'origine même du décalage du 30/09, où 7 400 mots de demandes
ne vivaient que dans la conversation, et où tous les outils rendaient vert parce qu'ils n'avaient
rien à mesurer.

## Son plan d'action (2026-10-01, tâche #1355)

`pure-gold-unity` l'a trouvé pendant la Ronde GOAT : il était **le dernier des 49 outils** tenus par
le gabarit partagé à ne jamais conclure. Il rendait ses six verdicts et s'arrêtait là — précisément
ce que l'Article 28 interdit.

**Deux états, jamais un seul**, et la distinction est le cœur du mécanisme :

- un contrôle qui **ÉCHOUE** est mon écart, à réparer → **RETENU** ;
- un contrôle qui **n'a pas pu être fait** n'est pas mon écart : c'est une décision qui ne
  m'appartient pas (lui donner accès au dossier de ses envois, ou accepter de rester aveugle sur ce
  point) → **À TRANCHER**.

Les fondre en un seul état transformerait sa décision en mon manquement, et l'inverse serait pire
encore.

**`TACHE_PAR_CONTROLE` est choisie à la main, exprès** (Article 24, deuxième exemption, et cette
phrase est ce qui l'autorise) : elle ne reflète l'état d'aucun autre système, elle dit seulement
quelle tâche **déjà ouverte** porte la réparation de quel contrôle. Un contrôle absent de la table
sort sans numéro — jamais avec un numéro inventé, qui serait une référence morte.

**Aucun constat n'est fabriqué pour remplir la section** : quand les six contrôles passent, le plan
dit « rien à faire », ce que `buildPlanDaction()` écrit déjà seul.

## LE SEPTIÈME CONTRÔLE — né d'un faux vert sur la seule question qui compte (2026-10-02, tâche #1483)

**FRONTIÈRE DÉCLARÉE AVEC LE FIL 04.** Le récit de ce constat — ce que l'utilisateur a écrit, les
chiffres de l'écart, et ce que ça lui coûtait — vit dans `docs/fils/fil-04-systeme-de-travail.md`,
qui est le document qu'il lit. **Cette fiche-ci ne le raconte pas : elle décrit le MÉCANISME.**
Les deux se sont recouverts le jour de leur écriture, et le détecteur de documents jumeaux l'a
attrapé le soir même — c'est pour ça que la frontière est écrite ici plutôt que sous-entendue.

**Le fait, en une ligne, parce qu'il justifie le mécanisme** : les six contrôles existants
mesuraient la FORME d'un fil, jamais son ALIMENTATION, et répondaient « à jour » sur des fils
morts depuis deux jours.

### Ce que le septième mesure, et pourquoi il n'a aucun seuil

`filsAlimentes()` compare **deux dates que le dépôt porte déjà** : la plus récente des dates de
mouvement des fils, et les dates du registre des remises (`docs/livraisons.json`, tâche #1475).
**Un document remis après le dernier mouvement d'un fil, sans qu'aucun fil ne bouge, est nommé.**

**Zéro seuil arbitraire, et c'est délibéré** (BP5 : un seuil planté dans un nuage continu se
trompe au premier cas nouveau). Zéro tolérance sur cette population-là, parce que tout document
remis à l'utilisateur répond à quelque chose, donc appartient à un fil — c'est exactement le flux
de travail qu'il décrit : « pour me repondre, tu me livres les fils concernés ».

**Une remise le MÊME JOUR qu'un mouvement de fil n'est jamais un écart** : le fil a pu être nourri
dans la même session, et accuser le cas normal apprendrait à ignorer ce contrôle (leçon L4).

**Trois refus de conclure, jamais un vert sur zéro donnée** (leçons L5/L11) : pas de registre
lisible · aucune remise enregistrée · aucun fil portant de date. Dans les trois cas, PAS MESURÉ.

### Le chemin du registre est recopié, donc gardé mécaniquement

`REGISTRE_DES_REMISES` ici et `REGISTRE_DES_LIVRAISONS` chez data-archangel désignent le même
fichier. Importer data-archangel entier pour une constante alourdirait un outil qu'on lance
souvent ; le filet vérifie donc que les deux chaînes restent identiques, ce que l'Article 24 exige
d'une valeur recopiée plutôt qu'un commentaire promettant de les garder alignées.

### Il a mordu à son premier passage

Son tout premier lancement a nommé cinq documents envoyés sans qu'aucun fil ne bouge, et fait
basculer le verdict d'ensemble à **NON**. Le contrôle est repassé au vert une fois les fils
nourris — pas en se taisant, parce que le travail a été fait.

## LIVRER LES FILS — la seconde moitié de son flux (2026-10-02, tâche #1483)

**Sa demande, mot pour mot** : « lorsque je t'envoie des prompts avec des questions à l'interieur :
1/ tu extrais les questions, tu les rattaches au fil concerné ou tu créé un nouveau 2/ pour me
repondre, tu me livres les fils concernés ou créés ».

### La frontière entre ce qui se mécanise et ce qui ne se mécanise pas

| Son point | Nature | Qui le fait |
|---|---|---|
| ① extraire les questions, décider à quel fil chacune appartient | **jugement** | l'agent, et ça ne changera pas |
| ② mettre en page les fils concernés et les préparer à l'envoi | **mécanique** | `fils-de-discussion livrer` |

**Pourquoi ① ne se mécanise pas, et pourquoi le dire vaut mieux que le promettre** : une même
question peut toucher trois sujets, et choisir EST le travail. Une mécanique qui rattacherait au
plus proche voisin produirait un rangement au petit bonheur, et personne ne verrait l'erreur —
un fil mal rattaché ressemble à un fil bien rattaché.

**Pourquoi ② devait l'être** : c'était la partie que je faisais à la main. Donc la partie que
j'oublierais (leçon L2). C'est exactement ce qui s'est produit pendant deux jours.

### Ce que la commande rend

```
node scripts/fils-de-discussion.mjs livrer 04 08 14     # trois fils nommés
node scripts/fils-de-discussion.mjs livrer              # tous — le cas « livre-moi ce que je n'ai pas lu »
```

Les chemins HTML prêts à envoyer, **index compris** : sans lui il ne voit pas où est la balle.

**Un numéro qui ne désigne rien est NOMMÉ**, et la commande sort en échec. Un fil silencieusement
absent d'une livraison ressemble à un fil qu'on aurait livré — c'est la référence morte de
l'Article 28, appliquée à une remise.

### Ce qu'elle ne fait PAS, et la limite voyage dans sa sortie

**Elle ne régénère pas les pages.** Un fil modifié depuis sa dernière mise en page partirait
périmé. L'ordre est donc : **régénérer → livrer → enregistrer la remise**, jamais un autre.

**Et l'envoi lui-même reste un geste de l'agent** : rien dans ce dépôt ne peut remettre un fichier
à quelqu'un. La remise s'enregistre APRÈS que l'envoi ait réussi — même discipline que les
sauvegardes et les documents.
