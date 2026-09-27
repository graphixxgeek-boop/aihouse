# rapport-gros-prompt — plan générique : rendre compte d'une saisine, point par point

*(Blueprint réutilisable. Instanciation : `docs/referentiel/rapport-gros-prompt.md`.)*

## Le besoin, et il vient d'une bonne pratique côté humain

Une personne qui travaille avec un agent apprend vite à **accumuler** ses idées, ses tâches et ses
questions plutôt que d'interrompre par petits messages, et à les envoyer d'un bloc avant une période
de travail autonome. C'est un progrès — l'interruption coûte cher.

Mais ça déplace le risque : une saisine de trente points revient, au retour, sous la forme d'un
compte rendu global où **on ne peut plus retrouver son point n° 17**.

## Le principe : chaque point porte son SORT, et le rapport refuse d'être incomplet

Le rapport reprend la saisine **point par point**, réorganisée, et chaque point porte ce qu'il est
devenu. La règle qui fait tout tenir :

> **Un point marqué « fait » sans tâche associée est invérifiable** — on ne peut ni le retrouver,
> ni savoir s'il a vraiment abouti.

L'outil **REFUSE donc de produire le rapport** plutôt que de le produire incomplet. C'est le seul
réglage qui marche : un avertissement se contourne par fatigue, un refus non.

## Ce qu'il n'est PAS, et c'est la moitié de sa définition

**Pas un générateur de contenu.** Il ne devine rien, ne résume rien, ne juge rien. Il prend une
saisine déjà rédigée et lui applique le gabarit standard des rapports — jamais un second gabarit
concurrent, jamais une mise en forme inventée sur place.

Tout ce qu'il ajouterait de son cru serait exactement ce que le lecteur ne peut pas vérifier.

## Générique par construction

Une saisine est une liste de points. Rien ici ne connaît le domaine du projet : n'importe quel
projet piloté par IA réutilise ce fichier tel quel.

## Sa limite honnête

Il garantit que chaque point a un sort déclaré ; il ne garantit pas que ce sort soit le bon. Le
jugement sur ce qui méritait d'être fait reste entier.

## La saisine intégrale — la pièce sans laquelle le rapport ne prouve rien

*(Ajouté le 2026-09-27, tâche #723. C'est la partie la plus importante de ce plan, et elle a
manqué pendant trois jours sans que personne le voie.)*

**LE TROU SE DÉCOUVRE EN ESSAYANT DE S'EN SERVIR, jamais en relisant l'outil.** L'utilisateur a
demandé de comparer son cahier des charges d'origine pour un outil à ce qui avait été construit.
Impossible : le dépôt gardait les RÉPONSES et le DÉCOUPAGE en points, jamais sa formulation. Les
quatre saisines archivées portaient 695, 602, 1 631 et 5 409 caractères de citations — des extraits
choisis par l'agent, pas le texte de l'utilisateur.

**POURQUOI C'EST STRUCTUREL ET PAS UN OUBLI.** Le découpage en points est une INTERPRÉTATION.
Archiver l'interprétation sans sa source, c'est archiver la lecture de l'agent à la place de la
demande : on ne peut plus savoir si un point a été mal compris, ni si un point a été oublié, parce
que la seule liste de points qui existe est celle que l'agent a faite.

**LA RÈGLE, en quatre clauses qui tiennent ensemble :**

1. **Le texte d'origine est obligatoire** (`texteIntegral`), et son absence fait REFUSER la
   production du rapport. Un avertissement ne suffit pas : il se lit une fois puis se saute, et le
   texte perdu l'est pour de bon — contrairement à une tâche manquante, qu'on peut créer après coup.
2. **Il est recopié VERBATIM et placé EN TÊTE**, jamais en annexe : on lit une interprétation en
   ayant sa source sous les yeux, pas après l'avoir déjà admise. Ni recoupé, ni ré-indenté, ni
   tronqué — un texte « nettoyé » n'est plus une pièce à conviction.
3. **Un plancher de longueur écarte le cas le plus vicieux** : un RÉSUMÉ déposé à la place du texte.
   Il aurait l'air d'une archive, ce qui est pire qu'un champ vide, parce que personne ne rouvrirait
   la question. Le plancher ne prouve rien ; il écarte le cas grossier.
4. **Une perte peut se DÉCLARER, avec sa raison** (`texteIntegralPerdu`), pour les saisines
   antérieures à la règle — fabriquer un texte plausible serait une pièce falsifiée. **Et
   l'échappatoire est fermée par la DATE, jamais par la bonne foi** : une saisine du jour ne peut
   pas se déclarer perdue, son texte est sous les yeux de celui qui rédige le rapport.

## Le seuil qui propose le process — et pourquoi il SOUS-DÉCLARE exprès

*(Ajouté le 2026-09-27, tâche #724.)*

**LE BESOIN** : généraliser le process sans y penser à chaque fois — « quand un prompt comporte X
tâches à faire ou X caractères, il y a automatiquement la proposition ».

**CE QUI SE DÉCLENCHE EST UNE PROPOSITION, jamais un rapport imposé.** Un rapport de saisine sur une
demande simple serait une cérémonie, et une cérémonie finit par se contourner.

**LE COMPTE RATE PLUTÔT QUE D'INVENTER, et c'est le réglage central.** Repérer « une demande » dans
du texte libre n'a pas de solution exacte. Seuls les marqueurs STRUCTURELS non ambigus comptent
(puce, numérotation, paragraphe interrogatif) ; un verbe à l'impératif se confond avec un présent et
n'est pas compté. Le résultat est un PLANCHER, et il le dit dans sa sortie. Un compteur qui
sur-déclare proposerait le process sur des messages ordinaires, et la proposition cesserait d'être
lue.

**Les deux familles de marqueurs se MAXENT, elles ne s'additionnent pas** : une liste à puces dont
les items finissent par « ? » serait comptée deux fois, et le compteur sur-déclarerait précisément
ce qu'il promet de sous-déclarer.

**UN SEUIL SE DÉRIVE, L'AUTRE SE DÉCLARE PROVISOIRE — et la différence est instructive.** Le seuil
de demandes est lu sur le corpus réel (8, 4, 11 et 31 points sur les quatre saisines archivées : la
plus petite qui ait mérité le process en portait quatre). Le seuil de caractères, lui, ne PEUT pas
être dérivé — parce qu'aucune saisine n'existait dans son texte d'origine avant la clause
ci-dessus. Il est donc une estimation DÉCLARÉE comme telle, à recalibrer sur les trois premières
vraies saisines archivées. Une estimation qui se fait passer pour une mesure est pire que les deux.

**LA LIMITE HONNÊTE, et la déclarer EST la protection** : aucune mécanique ne peut intercepter un
message à son arrivée dans une conversation. Le compteur est une commande (`seuil <message.txt>`) ;
c'est à l'agent de la passer, et au contrôleur de conduite de demander s'il l'a fait.
