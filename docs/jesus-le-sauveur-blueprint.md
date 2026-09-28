# JESUS-LE-SAUVEUR — blueprint générique : l'agent qui traque ce qui FREINE un projet

*(Blueprint réutilisable sur n'importe quel projet. L'instanciation propre à celui-ci vit dans
`docs/referentiel/jesus-le-sauveur.md`.)*

## Le problème qu'il ferme

Un projet ralentit sans que personne ne puisse dire pourquoi. Chaque cause prise isolément paraît
légitime : ce test est utile, cette obligation est justifiée, cette alerte dit vrai, cette décision
mérite réflexion. **C'est leur somme qui écrase, et personne ne voit jamais la somme.**

Pire : les vraies causes ne sont presque jamais là où on regarde. On mesure le temps de travail
alors que le coût est dans l'ATTENTE ; on compte les lignes de code alors que la dette est dans le
process ; on ajoute des garde-fous alors que le problème est qu'on ne les lit plus.

## Ce que la littérature établit, et qui doit gouverner sa conception

Trois résultats extérieurs, à vérifier sur chaque projet d'accueil plutôt qu'à croire :

1. **La fluidité** (*flow efficiency*) — la part du temps réellement travaillée — tourne autour de
   **15 %**. Le reste est de l'attente. **Passer de 15 à 30 % divise le délai par deux.** On gagne
   donc beaucoup plus en retirant de l'attente qu'en travaillant plus vite.
2. **La dette de process** pèse **30 à 50 % de l'effort** et « ne vit pas dans le dépôt » : elle
   s'accumule dans les opérations quotidiennes, réparties, donc invisibles.
3. **35 à 91 % des avertissements** d'un analyseur ne sont pas actionnables, ce qui rend insensible
   à tous les autres — y compris aux vrais.

**Conséquence de conception, non négociable : il mesure des DURÉES D'ATTENTE, jamais seulement des
durées de travail.**

## Ses quatre terrains

| Terrain | Ce qu'il y cherche |
|---|---|
| ① le temps machine | ce qui fait attendre concrètement : suite de tests, outils, crochets |
| ② les obligations | celles dont le prix dépasse le service rendu — comptées en NOMBRE, jamais en poids |
| ③ les alertes et rapports | ce que plus personne ne lit : l'alerte inextinguible, le rapport jamais ouvert |
| ④ les frictions de l'échange | les allers-retours évitables, et le temps qu'une décision passe en attente |

## La vue 360 — et pourquoi elle vit à part

**Une cause indirecte n'est jamais dans une sonde : elle est dans la RENCONTRE de deux sondes qui,
chacune de son côté, ne signalent rien d'alarmant.** Additionner des verdicts ne les croise pas.
Le croisement est donc une fonction distincte, jamais un résumé des autres.

Exemples de croisements génériques :
- un outil existe pour retirer un coût **et** ce coût continue d'être payé → lourdeur entièrement évitable ;
- la mesure sur laquelle on optimise est périmée → on optimise à l'aveugle en croyant mesurer ;
- beaucoup de décisions attendent en même temps → l'attente n'augmente plus proportionnellement, elle explose ;
- le prix d'entrée d'un outil est élevé **et** des outils déjà entrés ne servent plus.

## Les trois règles de construction, chacune payée par un défaut réel

**① Une liste écrite à la main ment. Un signal se DÉRIVE.** La première version cherchait des
« remèdes connus » dans une liste ; elle a certifié « tout va bien » sur un cas dont son auteur
savait qu'il était faux. Le signal dérivé — *quelle part de l'usage d'un outil tient à son seul jour
de naissance ?* — couvre tous les outils au lieu des trois auxquels on avait pensé.

**② La condition d'OPPORTUNITÉ vient avant le ratio, jamais après.** Un outil né hier n'a pas eu
l'occasion de resservir : l'accuser est vrai arithmétiquement et faux réellement. Un garde-fou qui
accuse à tort cesse d'être lu — et celui-ci criait d'autant plus que le projet construisait bien.

**③ Ce qui n'est pas jugeable se dit, et jamais « sain ».** Le dénominateur s'imprime en trois
parts : jugeables, trop récents, trop peu vus. Un zéro sans son dénominateur se lit « tout va
bien » au lieu de « je n'ai pas pu regarder ».

## Ce qu'il ne fait JAMAIS

- **Il ne corrige rien seul.** Il signale et propose un plan ; la décision reste humaine.
- **Il ne touche jamais au document qui fait loi.** Il a le droit de dire qu'une règle freine et de
  la chiffrer ; jamais de la modifier.
- **Il ne reproche pas une attente à une personne.** Le temps qu'une décision passe en file est un
  fait sur la file, pas un jugement sur qui doit trancher.
- **Il ne refait pas le travail des outils spécialisés.** Il les convoque et rassemble.

## Sa place dans une famille d'outils

Il est conçu comme le **chapeau général** d'une famille où chaque membre tient un périmètre étroit
(un fichier, un document, une catégorie de documents). Lui prend ce qui reste : **tout ce qui n'est
dans aucun fichier** — le rythme, les obligations, l'attention, l'attente.

**Son rythme** : convoqué avant un gros chantier, jamais à chaque commit. Ce n'est donc pas un
garde-fou mécanique gratuit : c'est un agent qu'on appelle.

## Ce qu'il faut adapter en l'emportant ailleurs

- les sources de données (compteur d'usage, registre de tâches, registre d'alertes) ;
- les seuils : la part-jour-un, le délai d'opportunité, l'âge d'une alerte devenue décor. **Chacun
  se dérive du corpus d'accueil, jamais recopié** — un seuil qui ne se pose pas dans un creux est
  décrété, pas dérivé ;
- la liste des croisements, qui dépend des sondes réellement disponibles sur place.
