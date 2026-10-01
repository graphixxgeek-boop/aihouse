# SAFE-EXPORT — exportabilité et lisibilité-par-une-autre-IA — blueprint exportable

*(Blueprint générique réutilisable tel quel sur un autre projet : il ne connaît rien du domaine,
seulement des fichiers qui se déclarent génériques ou spécifiques.)*

## Le problème qu'il résout

Deux questions distinctes qu'aucun autre outil ne pose :

1. **L'outillage est-il exportable ?** Peut-il partir vers un autre projet sans emporter ce qui est
   propre à celui-ci ?
2. **Le code est-il reprenable ?** Une autre IA s'y retrouverait-elle sans le casser ?

Ce sont bien **deux questions et non deux périmètres de fichiers** — un fichier peut être
parfaitement reprenable et totalement non exportable. Les confondre donne un verdict inutilisable.

## Les quatre détecteurs

| Détecteur | Ce qu'il cherche | Pourquoi ça compte |
|---|---|---|
| Fuites de spécificité | du contenu propre à ce projet dans un fichier déclaré générique | c'est ce qui rend un gabarit inutilisable ailleurs |
| Termes non définis | un nom propre employé sans définition atteignable | une autre IA devra deviner, et devinera mal |
| Mécanismes sans raison | une fonction exportée sans le POURQUOI à côté | c'est ce que le prochain agent supprime en croyant nettoyer, réintroduisant un bug déjà corrigé |
| Dépendances à un outillage | ce qui ne marche qu'avec un outil particulier | une IA qui arrive sans lui doit pouvoir travailler avec les documents seuls |

**Deux nuances sans lesquelles ces détecteurs seraient inutilisables** :

- On ne cherche les fuites **que** dans les fichiers déclarés génériques. Un nom de personnage dans
  une fiche spécifique est normal ; le signaler noierait les vrais cas.
- Un outillage **cité pour être écarté** n'est pas une dépendance. Le texte qui dit « une IA sans
  crochet git doit pouvoir travailler » nomme forcément le crochet git — sans cette distinction, le
  détecteur signalerait le plus fort des garde-fous d'exportabilité comme un défaut.

## La déclaration, et pourquoi elle est auto-renforçante

Le fichier annonce lui-même s'il est générique. L'outil ne devine rien : il lit une intention
écrite. **Un blueprint qui oublie de se déclarer est lui-même un écart signalé** — la règle se
répare donc toute seule au lieu de se périmer.

## Garde-fous et limites honnêtes

- **Ses détecteurs sont des INDICES, jamais des preuves.** Une absence d'explication n'est pas une
  absence de raison ; un terme sans fiche n'est pas forcément mal défini. Le rapport le dit.
- **Il avertit, propose, ne bloque jamais.** Un gardien qui bloque sur un sujet sans rapport avec le
  travail en cours pousse à désactiver le crochet, et on perd tout.
- **L'escalade exige une CONCENTRATION** : trois écarts éparpillés sont du bruit, trois dans le même
  fichier disent qu'il s'y passe quelque chose. Proposer un scan payant à chaque avertissement
  reviendrait à le proposer toujours, donc à n'être jamais écouté.
- **Le choix de zone mêle indices et rotation** : les indices décident, sauf si une zone attend
  depuis trop longtemps. Zéro indice mécanique ne veut pas dire zéro problème, seulement que les
  indices n'y voient rien — sans l'anti-famine, une zone silencieuse mais dégradée ne serait jamais
  regardée.
- **Un écart ne se met de côté qu'avec l'accord explicite de l'humain.** Sans cette règle, l'outil
  peut faire taire ses propres avertissements — et le silence qui suit ressemble exactement à un
  problème réglé. Tout écart non tranché **revient**, et son rappel **grossit** jusqu'à exiger une
  vraie question : un rappel identique devient un meuble.
- **Un défaut déjà corrigé qui réapparaît ressort en RÉGRESSION**, jamais filtré.

## Le piège qu'il a lui-même illustré

À sa première exécution, il déclarait 25 fichiers sur 26 en défaut. Le chiffre **était** l'alerte :
un détecteur qui accuse presque tout a presque toujours tort. La cause était son propre marqueur,
qui cherchait une formule que le dépôt n'employait pas. **Vérifier un verdict massif avant de le
rapporter** est la première règle d'usage de cet outil.

## Les DEUX mesures de l'export, et pourquoi une seule ne suffit jamais

*(Ajouté le 2026-09-27, après qu'un outil déclaré exportable le jour de sa création s'est révélé
inutilisable ailleurs.)*

Un outil qui doit servir sur un autre projet pose **deux questions distinctes**, et un outillage
d'export qui n'en mesure qu'une donne une fausse assurance.

**1. EXPORTABILITÉ — a-t-il ses PIÈCES pour partir ?**
Son plan générique, sa fiche d'instanciation, son registre. C'est la question du carton de
déménagement : rien ne manque dedans.

**2. PORTABILITÉ — FONCTIONNE-t-il une fois arrivé, sans qu'on touche à son code ?**
C'est la question de l'armoire une fois le carton ouvert : entre-t-elle dans la nouvelle pièce ?

**Les deux ne se moyennent jamais.** Un taux unique se lit comme une garantie de fonctionnement
qu'il n'est pas. Les deux chiffres s'affichent côte à côte dans le même rapport, précisément pour
qu'on ne puisse pas lire l'un en croyant lire l'autre.

### Comment mesurer la portabilité mécaniquement

On cherche, **dans le code et jamais dans les commentaires**, ce qui trahit une dépendance au dépôt
d'origine : un chemin de fichier du projet, le nom d'un document propre au projet, une arborescence
supposée, un nom propre du produit. Chaque marqueur porte **ce qu'il coûte une fois ailleurs** — un
nom seul laisserait croire à une règle de style.

**Le cas le plus dangereux à nommer explicitement** : un outil qui lit un dossier absent ne plante
pas. Il rend zéro, et zéro ressemble trait pour trait à « rien à signaler ». C'est le défaut qu'un
balayage de texte attrape et qu'une exécution naïve manquerait.

### La limite, qui va DANS le résultat

Un balayage de texte trouve les chemins écrits en dur ; il ne prouve pas qu'un outil sans chemin en
dur fonctionne ailleurs. La seule preuve est un **projet témoin** : un dépôt minuscule à
l'arborescence volontairement différente, contre lequel tout l'outillage est lancé. Trois verdicts
et non deux — **portable**, **honnête** (l'outil dit « pas mesurable » avec sa raison, ce qui est un
bon résultat), **non portable**.

## Mesurer la portabilité à la maille du LITTÉRAL, et non du fichier

*(Section générique : elle vaut pour n'importe quel projet, et c'est la seule partie de ce
blueprint qui exige un parseur.)*

**Le piège que cette section ferme.** Un détecteur de portabilité qui juge un FICHIER le déclare
portable dès qu'il expose une cible en option. C'est une maille utile — elle évite d'accuser tout
outil qui scanne le projet — mais elle laisse passer le cas le plus courant : un chemin écrit en dur
au fond d'un fichier par ailleurs exemplaire. Les deux mailles ne se remplacent pas.

**Pourquoi un motif de texte échouera toujours ici**, et le constater coûte moins cher que de le
découvrir : la différence entre un chemin rangé et un chemin coincé n'est pas une différence de
FORME, c'est une différence de POSITION dans la structure du code. Un raffinement de motif donne un
chiffre de plus, jamais le bon. Sur le projet d'origine, quatre critères successifs ont rendu quatre
réponses en vingt minutes avant qu'on renonce.

**Le critère, transposable tel quel** :

- **DÉCLARÉ** — le littéral vit au niveau du module, ou comme **valeur par défaut de paramètre**.
  Arriver ailleurs demande de lui donner une autre cible.
- **ENFOUI** — le littéral vit dans un **corps de fonction**, à l'endroit de l'appel. Rien ne permet
  de le pointer ailleurs sans éditer le code.

En pratique : on remonte des parents du littéral jusqu'au module. Entrer dans un noeud de fonction
**autrement que par son corps**, c'est être une valeur par défaut — donc déjà pointable.

**Les natures à écarter, sous peine d'un garde inutilisable.** Sur le projet d'origine, les ignorer
faisait passer le rapport de 93 points à 648, et un garde qui accuse tout le monde n'accuse plus
personne.

1. **Motif de nom** — littéral passé à `startsWith`/`replace`/`split`… : une convention testée, pas
   une cible ouverte.
2. **Point d'entrée** — littéral dans la fonction d'entrée : nommer les vraies cibles EST son
   métier, puisqu'elle les fournit aux fonctions pures.
3. **Registre propre** — un outil qui écrit dans SON dossier n'est pas couplé au projet d'accueil :
   le dossier part avec lui.
4. **Le banc d'essai** — un fichier de tests est plein de chemins FICTIFS. Il s'écarte avec sa raison
   écrite, jamais en silence.

**Deux exigences non négociables.** D'abord, **pas de parseur, pas de conclusion** : la sonde rend
« non mesuré » et le dit, jamais zéro — un zéro se lit « rien à signaler » là où rien n'a été
regardé. Ensuite, **le chargeur du parseur est injectable**, sans quoi cette branche de refus n'est
pas testable, et un refus qu'on ne peut pas éprouver est un refus qu'on découvre le jour où il se
trompe.

**Ce que la mesure change, et c'est souvent l'inverse de ce qu'on attend** : sur le projet d'origine
elle a montré que le paysage était DÉJÀ portable à près de 9 chemins sur 10. Elle a donc retiré un
argument à la refonte au lieu d'en ajouter un, et transformé un chantier flou en une liste de gestes
identiques et comptés.

