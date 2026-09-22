# Blueprint — veiller sur la circulation des données dans un réseau d'outils

*Générique, réutilisable. Instanciation : `docs/referentiel/data-archangel.md`.*

## Le problème

Un réseau d'outils mature produit beaucoup de données : journaux d'état, registres datés, séries
chiffrées. Chaque outil écrit les siennes. Personne ne vérifie jamais **qui lit quoi**.

Deux gaspillages symétriques s'installent alors, tous deux invisibles :

- une donnée qu'on paie à produire et que rien ne relit n'existe pas vraiment — elle coûte son
  calcul, occupe son fichier, et meurt là ;
- un outil qui rend un verdict sans consulter une donnée disponible juste à côté juge à l'aveugle
  alors que la réponse était sur le disque.

Un tel gardien prend les deux bouts à la fois et rend **un seul verdict**.

## Le piège qui fausse tout : déclarer n'est pas lire

Le premier passage d'un tel outil annonce presque toujours un chiffre magnifique. Sur ce projet :
« 53 sources sur 53 relues, 100 % ». Faux. Le catalogue du paysage — le fichier qui **déclare** les
sources — les cite toutes, et ressortait donc comme le lecteur universel de tout.

Une déclaration n'est pas une lecture. Deux autres cas se confondent avec elle et méritent le même
traitement :

- un chemin cité dans un **commentaire** est une explication ;
- un chemin cité dans la **suite de tests** est une vérification, jamais une exploitation.

**Le principe à retenir**, plutôt qu'une liste de fichiers à ignorer qui se périmerait au prochain
catalogue : une déclaration vit dans le corps d'une constante exportée, une lecture vit dans du
code. On retire donc ces corps avant de chercher — pour tous les fichiers, sans exception. Un futur
catalogue sera traité comme le premier sans qu'une ligne ne bouge.

## Suggérer un branchement sans table d'affinités

La tentation est d'écrire quelque part « tel outil devrait lire telle donnée ». C'est une opinion
figée qui se périme au premier outil suivant, et l'exact contraire de l'évolutivité.

**Le principe** : on ne décrète rien, on observe ce que le réseau fait déjà. Si deux outils lisent
largement les mêmes sources, ils travaillent sur le même terrain — et une source que l'un consulte
et l'autre pas devient un candidat sérieux. La force de la suggestion, c'est le nombre de sources
partagées avec l'outil qui la porte.

Ce que ça produit est une **suggestion**, jamais un manquement. En dessous de deux sources
communes, la ressemblance ne veut rien dire et ne doit rien suggérer.

## La nuance sans laquelle le rapport se lit de travers

Un registre écrit pour être relu **par un humain** n'a aucun besoin d'un lecteur-outil, et
l'absence de lecteur n'y est pas une faute. Ce qu'aucun humain ne fera jamais, en revanche, c'est
comparer trente passages successifs pour en tirer une tendance — ça, seul un outil le fait.

La vraie question n'est donc pas « personne ne lit ce fichier ? » mais **« personne n'exploite la
série ? »**. Un gardien qui confond les deux crie au gaspillage sur des registres parfaitement
sains.

## Servir l'agent, pas seulement l'outillage

Un agent IA ne peut lire que ce dont il sait l'existence. Rien ne lui présente spontanément ce que
le réseau a accumulé, donc il lit ce dont il se souvient — c'est-à-dire ce qu'il a touché
récemment, et rien d'autre. Un mode **briefing** (« tout ce que l'équipe sait sur ce sujet, et où
ça vit ») répare ça, et se consulte avant un gros travail comme on consulte un index.

Une **alerte** complète le dispositif, mais elle doit rester rare pour être lue : réservée à une
donnée à la fois **fraîche** (quelqu'un vient de l'écrire, donc elle a quelque chose à dire) et
**sans aucun lecteur**. Une donnée ancienne et ignorée est une question d'hygiène, pas une urgence.

## Ce qu'il ne fait jamais

Brancher lui-même. Connecter deux outils change ce qu'un rapport raconte ; ça se décide, ça ne
s'improvise pas. Il signale, il mesure, il propose.
