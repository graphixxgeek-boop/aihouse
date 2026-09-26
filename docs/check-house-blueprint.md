# check-house — plan générique : le filet de sécurité qui refuse le commit

*(Blueprint réutilisable. Instanciation de ce projet : `docs/referentiel/check-house.md`.)*

## Ce qu'il est, et ce qu'il n'est pas

Ce n'est **pas** une suite de tests unitaires au sens habituel : c'est **un seul fichier exécutable**
qui rejoue, contre le dépôt RÉEL, tout ce que le projet a compris en se trompant. Il est branché au
crochet pre-commit et **refuse le commit** quand il échoue.

La différence n'est pas cosmétique. Une suite de tests classique protège des fonctions ; celui-ci
protège des **décisions** — et une décision oubliée ne casse rien, elle se contente de disparaître.

## Les quatre principes qui le distinguent d'une suite ordinaire

### 1. Le message d'assertion porte l'HISTOIRE, jamais seulement l'attente

Un message comme `expected 3 to equal 4` n'apprend rien à qui le lit six mois plus tard. Ici, chaque
assertion dit **quel défaut réel elle empêche de revenir** : la date, ce qui s'est passé, ce que ça a
coûté. Le fichier de tests devient la mémoire la plus fiable du projet, parce que c'est la seule qui
refuse de se périmer sans bruit.

Conséquence assumée : les messages sont longs. C'est le prix d'une mémoire qui se lit au moment
exact où elle sert — quand un test vient de casser.

### 2. Les contre-tests vont TOUJOURS dans les deux sens

Pour chaque garde-fou, deux assertions minimum :
- un cas qu'il **DOIT attraper** ;
- un cas voisin qu'il **doit laisser passer**.

Sans la seconde, on écrit un garde-fou qui refuse tout — et un garde-fou qui accuse à tort cesse
d'être lu, ce qui est pire que son absence.

### 3. Il tourne contre le VRAI dépôt, pas seulement contre des fixtures

Les fixtures vérifient la logique ; le passage en direct vérifie que la logique s'applique à quelque
chose. Un outil qui n'a jamais tourné contre le dépôt réel n'est pas vérifié, c'est une intention.

Corollaire à respecter sans exception : quand un changement de code fait bouger une assertion,
**on aligne la FIXTURE, jamais l'assertion** — sinon le test enregistre le bug au lieu de le refuser.

### 4. « Pas mesuré » n'est jamais « rien trouvé »

Un contrôle qui n'a pas pu s'exécuter doit le DIRE. Les deux états se ressemblent trait pour trait
dans un silence, et ils appellent l'inverse l'un de l'autre.

## Le piège structurel : le test qui fige un nombre

Une assertion du type « il doit y avoir exactement N éléments » protège réellement (elle interdit
l'ajout muet), mais elle se périme à chaque ajout légitime. Deux règles la rendent supportable :

1. **Elle doit exister** — l'ajout silencieux est le défaut qu'elle empêche.
2. **Un garde-fou doit détecter les références PÉRIMÉES à ce nombre** ailleurs dans le dépôt, sinon
   la documentation dérive pendant que le test reste vert.

## Sa limite honnête

Il vérifie ce qu'on a pensé à lui faire vérifier. Un domaine entier peut n'avoir aucune assertion
sans que rien ne le signale — c'est le travail d'un outil de couverture séparé, jamais le sien.

## Le coût, et pourquoi il se paie

Il grossit indéfiniment, et son temps d'exécution avec lui. C'est un coût réel, assumé : chaque
seconde ajoutée achète un défaut qui ne reviendra pas. Le jour où l'attente devient insupportable,
la réponse est de **découper l'exécution** (par domaine), jamais de retirer des assertions.
