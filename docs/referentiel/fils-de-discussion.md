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
