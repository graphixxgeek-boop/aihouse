# TOOL-LEARNING — l'apprentissage de l'outillage, et celui de l'agent à son égard — blueprint exportable

*(Blueprint générique réutilisable tel quel : il ne connaît rien du domaine, seulement des outils qui
gardent ou non une mémoire, et un agent qui les corrige ou non.)*

## Le problème qu'il résout

Un paysage d'outils peut être parfaitement équipé et parfaitement immobile. Chaque outil a sa
mémoire, ses rapports, ses garde-fous — et aucun ne devient meilleur. Personne ne le voit, parce que
les outils qui jugent l'équipe jugent un **état**, jamais une **trajectoire**.

Et une question n'est posée nulle part : **est-ce que l'agent aide réellement les outils à
progresser ?** C'est un angle mort entier, et le seul qui ne peut aller nulle part ailleurs.

## La distinction fondatrice : mémoire ≠ apprentissage

Un outil peut écrire un registre et ne jamais le relire. L'outil RH le verra équipé ; celui-ci le
voit immobile. C'est le verdict **« archive seulement »**, que le jugement d'état ne peut
structurellement pas rendre.

## Les quatre preuves, de natures séparées

| Preuve | Nature | Ce qu'elle établit |
|---|---|---|
| il relit sa propre mémoire | autonome | la plus dure à contester, la plus facile à vérifier |
| son taux de trouvaille s'améliore | autonome | un progrès réel — à lire à côté de l'état du code |
| ses faux positifs diminuent | autonome | sa fiabilité, à condition qu'ils soient enregistrés |
| l'agent l'a corrigé ou enrichi | **enseigné** | l'apport de l'agent, jamais celui de l'outil |

**Les natures ne s'additionnent jamais.** Un outil beaucoup corrigé est **enseigné, pas apprenant** —
les confondre flatterait l'outil et l'agent en même temps.

## Comment il apprend lui-même

Il **enregistre ses verdicts et vérifie s'ils se confirment**. Un outil jugé immobile qui progresse
ensuite *sans intervention de l'agent* réfute le critère, pas l'outil. Si l'agent est intervenu entre
les deux passages, le progrès **confirme** le verdict au contraire.

C'est la seule forme d'apprentissage qui ne soit pas une posture. L'alternative — ajuster ses propres
seuils — produirait un outil toujours satisfait de lui-même, dont plus personne ne saurait ce qu'il
mesure.

## Garde-fous et limites honnêtes

- **Il refuse de juger sous trois passages.** Une trajectoire ne se lit pas sur un point.
- **Un piège déclaré** : un outil qui trouve moins parce que le CODE s'est amélioré paraîtrait
  régresser. La baisse se lit toujours à côté de l'état du code, jamais seule.
- **Double filtre avant qu'une tâche existe** : l'agent retient la proposition, ET une validation
  humaine doit être nécessaire. Sans lui, l'outil inonde le suivi — et une liste inondée ne se lit
  plus, ce qui détruit la valeur que la chaîne rapport → tâche protège.
- **La proposition la moins coûteuse d'abord.** Proposer le chantier le plus lourd à un outil qui n'a
  aucune preuve est le meilleur moyen que rien ne soit jamais fait.

## Sa place dans un paysage

Il forme avec deux voisins un trio dont il est la **dérivée** : l'un juge l'état de l'équipe, l'autre
l'exportabilité du code, tous deux **à un instant**. Lui seul a un axe de temps, et prend leurs
sorties comme entrées. Conséquence à connaître avant de le construire : **il ne vaudra que ce que
valent leurs historiques.**

## L'apprentissage de l'AGENT — la moitié qu'on oublie de mesurer

Ce patron vérifie que les OUTILS apprennent. La symétrie manque presque toujours : **l'agent qui les
pilote apprend aussi, et lui ne garde rien** — un outil conserve son registre d'un passage à
l'autre, un agent recommence à zéro à chaque session. Les leçons qu'il paie cher se retrouvent alors
dans des commentaires de code, chacune locale à l'endroit où l'erreur a eu lieu, donc inutilisable
le jour où le même piège se présente ailleurs.

**Le remède, et son piège immédiat.** Un registre de leçons transverses règle le problème — et
reproduit aussitôt le défaut qu'il documente, parce qu'un texte que rien ne relit est une intention,
pas un mécanisme. Un registre écrit sans être câblé est la démonstration de son propre contenu.

**Le câblage générique : chaque leçon déclare son PORTEUR**, c'est-à-dire le mécanisme réel qui la
fait tenir quand plus personne ne s'en souvient (une fonction, un garde-fou, un test). L'outil
vérifie à chaque passage que ce porteur existe, et distingue **trois états, jamais deux** :

- **portée** — le mécanisme nommé existe vraiment ;
- **sans mécanisme, déclaré** — aucun garde-fou n'est possible, et l'impossibilité est écrite AVEC
  sa raison. C'est une décision tranchée : elle ne produit aucun constat, sans quoi l'outil
  reprocherait la même chose indéfiniment (l'alarme permanente qui fait re-payer du travail) ;
- **porteur fantôme** — un mécanisme est nommé et n'existe pas. **Le pire des trois, et la vraie
  raison d'être de cette vérification** : une référence morte ressemble à une garantie, donc elle
  rassure à tort, là où une leçon sans porteur ne promet au moins rien.

**Critère d'entrée du registre, volontairement exigeant** : une leçon n'entre que si elle a été
payée par une erreur réelle ET qu'elle vaut au-delà du cas qui l'a révélée. Une observation
ponctuelle va dans le suivi, une règle va dans la charte. Un registre qui accueille tout devient un
journal que personne ne relit — donc exactement le problème qu'il prétend résoudre.

**Limite à déclarer, jamais à taire** : aucune mécanique ne peut juger si un porteur fait RÉELLEMENT
respecter sa leçon, seulement s'il existe. Le cas grossier est attrapé, le subtil ne l'est pas.

## La chaîne de l'expérience, et le maillon qu'on croit toujours avoir branché

Un registre de leçons ne vaut que par la chaîne qui le traverse. Cinq maillons, et il suffit qu'un
seul manque pour que toute la valeur produite en amont se perde :

```
découvrir  →  enregistrer  →  analyser périodiquement  →  ressortir avant la tâche  →  ressortir à la validation
```

| Maillon | Ce qu'on perd sans lui |
|---|---|
| **Découvrir** | la trouvaille dépend de la mémoire de l'agent, donc elle meurt avec la session |
| **Enregistrer** | elle reste dans la conversation et disparaît avec elle |
| **Analyser** | le registre grossit sans que personne ne regarde ce qu'il dit de la façon de travailler |
| **Ressortir avant** | la leçon est archivée : relue une fois par période, elle ne change rien au travail du lendemain |
| **Ressortir après** | ce qui a échappé au rappel d'amont n'est jamais rattrapé |

**Le maillon qu'on oublie systématiquement est le quatrième**, et c'est le seul qui sert vraiment
l'objectif : tout le monde construit le registre, presque personne ne branche la remontée. Un
registre sans lui remplit parfaitement l'archivage en ratant entièrement l'application.

**La chaîne se vérifie, elle ne se déclare pas.** Chaque maillon nomme le fichier où il vit et la
preuve à y chercher, et l'outil constate à chaque passage qu'elle y est réellement. Affirmer « tout
est connecté » en prose est une intention, et une intention n'a jamais empêché quoi que ce soit.

## Ce qui fait remonter la bonne entrée au bon moment

**Chaque entrée déclare son TERRAIN** : les situations où elle mord, avec les mots qui les
signalent. Le tri vient de cette déclaration, jamais d'une ressemblance devinée entre la tâche et le
texte de l'entrée — un rapprochement à côté de la plaque transformerait le rappel en bruit, et un
garde-fou qui accuse à tort cesse d'être lu.

**Trois défenses, et il faut les trois**, sans quoi un rappel affiché deux fois par cycle de travail
devient un meuble qu'on apprend à ignorer :

1. le tri par terrain déclaré ;
2. **aucune correspondance = rien d'affiché**, jamais un repêchage « au cas où » ;
3. un plafond strict sur le nombre d'entrées servies — en servir huit revient à n'en servir aucune.

## Les deux jugements qu'un outil ne doit jamais rendre à la place des humains

- **La conclusion de période** sur la façon de travailler de l'agent : l'outil sait compter les
  captations, il ne sait pas dire quel travers revient. Elle s'écrit à la main, et l'outil se
  contente de **refuser d'être complet sans elle**.
- **« Cette entrée a-t-elle été réellement APPLIQUÉE ? »** : elle appartient à la personne qui
  pilote le projet. Un agent qui se déclare conforme sur son propre travail commet exactement le
  défaut que ce dispositif existe pour combattre. L'enregistrement **refuse** un verdict qui ne porte
  pas la marque explicite qu'il vient d'elle : aucune mécanique ne peut prouver son origine, mais
  elle peut refuser de l'inventer.

## Garder le registre efficace, sinon il cesse de protéger

Un registre qui ne fait que grossir finit par ne plus être lu. L'efficacité n'est donc pas du
confort : c'est la condition de survie du dispositif. Trois mécanismes, et le même principe les
gouverne — **l'outil propose, il ne décide jamais**, parce que retirer ou fusionner une entrée est
une décision sur ce que le projet garde.

### Regrouper les entrées équivalentes

Un registre se remplit entrée par entrée, chacune écrite le jour où son erreur a fait mal, donc sans
vue d'ensemble. Deux entrées finissent par dire la même chose sous deux angles. **Le coût n'est pas
l'encombrement : c'est que le rappel en sert DEUX là où une seule suffirait**, ce qui consomme le
plafond et évince une entrée réellement différente.

La détection exige **deux recouvrements simultanés**, jamais un seul : le TERRAIN *et* la
formulation. Le terrain seul produirait des fusions absurdes — deux entrées peuvent porter sur le
même sujet en enseignant des choses opposées. Le regroupement est **transitif** : si A ressemble à B
et B à C, les trois forment un groupe, sinon on annoncerait trois problèmes là où il y en a un.

### Fusionner sans jamais perdre

La contrainte « sans perdre la valeur » est dure, et elle dicte toute la forme du mécanisme :

1. **La fusion est une UNION, jamais un arbitrage** entre deux textes : les terrains, les mécanismes
   porteurs et les formulations d'origine survivent tous.
2. **L'identifiant absorbé ne disparaît pas.** Il garde une section réduite à un renvoi, pour qu'une
   citation faite ailleurs — un commentaire de code, une ligne de suivi — mène encore quelque part.
   Un identifiant supprimé fabriquerait une **référence morte**, exactement le défaut que ce genre
   d'outil traque par ailleurs.
3. **La proposition ne rédige pas le texte fusionné.** Elle rend ce qui doit survivre. Un texte
   rédigé automatiquement serait relu en diagonale et perdrait justement ce qu'on promet de garder.
4. **Fusionner deux entrées de natures différentes déclenche un avertissement** : ce qui les
   distingue est précisément ce que la fusion effacerait.

### Compter les remontées, pour pouvoir sortir du registre

Sans compteur, on ne sait ni si une entrée sert, ni laquelle retirer. Deux verdicts en découlent :

- **jamais remontée** après assez d'occasions → poids mort ;
- **remontée souvent et jamais jugée appliquée** → elle ne sert à rien telle qu'elle est écrite.

**Deux garde-fous sans lesquels ce compteur ferait plus de mal que de bien :**

- Les occasions se comptent **depuis l'arrivée de l'entrée**, jamais depuis le début du compteur —
  sinon une entrée écrite ce matin hériterait du passé de toutes les autres et serait condamnée
  avant d'avoir vécu. Accuser à tort une entrée utile la ferait retirer, et on repaierait l'erreur
  qui l'avait fait naître.
- **L'occasion se compte même quand rien ne remonte.** Ne compter que les succès rendrait chaque
  entrée parfaite par construction, et c'est précisément ce silence-là qui rend un « jamais servie »
  interprétable.

**Limite à déclarer** : un compteur mesure des REMONTÉES, jamais une application réelle. Savoir
qu'une entrée est ressortie douze fois ne dit pas qu'elle a changé une décision — d'où le verdict
d'application laissé à l'humain, et d'où la formulation en question plutôt qu'en condamnation.
