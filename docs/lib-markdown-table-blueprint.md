# Lecteur de table markdown — blueprint générique

## Le problème qu'il ferme

Un projet qui tient ses registres en tables markdown doit, partout, séparer les **lignes de
données** de l'en-tête et du trait de séparation. Écrit à la va-vite, ce filtrage a deux façons
classiques de se tromper, et les deux sont silencieuses :

- **filtrer trop peu** — la ligne `|---|---|` devient une donnée, et toute moyenne calculée dessus
  est fausse sans que rien ne le signale ;
- **filtrer trop** — écarter toute ligne qui CONTIENT un mot d'en-tête fait disparaître les vraies
  lignes dont le texte emploie ce mot. Le registre rétrécit en silence.

## Le principe qui évite les deux

Le filtrage porte sur la ligne **BRUTE**, avant tout découpage en cellules, et l'en-tête se
reconnaît à un marqueur que l'appelant fournit — jamais à une devinette sur la forme.

## Ce qu'il ne fait pas

Il ne valide rien : une table mal formée rend des lignes mal formées. Il lit, il ne juge pas.

## Le faux positif déjà payé

Dans le projet d'origine, le filtre écartait toute ligne contenant le mot d'en-tête, **où qu'il
soit**. Une tâche dont la description citait ce mot disparaissait du registre — et le compteur de
numérotation qui lisait ce même registre annonçait un numéro déjà pris, **fabriquant** le doublon
qu'il existait pour empêcher. Un lecteur qui filtre trop produit exactement le même vert qu'un
lecteur qui ne trouve rien.

## Comment l'installer ailleurs

Zéro dépendance. Le seul contrat : l'appelant connaît un texte qui n'apparaît QUE dans son en-tête.
