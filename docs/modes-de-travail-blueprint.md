# modes-de-travail — plan générique : un registre de modes, jamais un booléen recopié

*(Blueprint réutilisable. Instanciation : `docs/referentiel/modes-de-travail.md`.)*

## Le défaut fondateur : un booléen qui portait DEUX questions

Un projet piloté par un agent finit toujours par avoir un drapeau du genre « mode autonome »,
recopié partout. Il paraît innocent tant qu'il n'existe que deux situations. En réalité il répond,
sous un seul nom, à deux questions qui n'ont rien à voir :

- **la personne est-elle là pour répondre ?**
- **une question a-t-elle le droit de BLOQUER le travail ?**

Tant que les deux réponses coïncident, la confusion ne se voit pas. Elle éclate au premier cas qui
les sépare — typiquement « je suis là, mais ne t'arrête pas pour autant » : la personne EST
présente, et pourtant rien ne doit bloquer.

Ce n'est pas un cas exotique : c'est le mode de travail le plus courant dès qu'on fait confiance à
l'agent.

## Le principe : UN REGISTRE, et ce qui gouverne un comportement en est une CLÉ

Un mode de plus s'ajoute **à un seul endroit**. Ce qui gouverne un comportement est une propriété
déclarée du registre, jamais un `if (mode === "…")` recopié dans trente fichiers.

La différence est structurelle, pas stylistique : avec le test recopié, le quatrième mode oblige à
retrouver les trente endroits — et on en oublie toujours. Avec le registre, il n'y a rien à
retrouver.

## Le garde-fou qui va avec, et il est obligatoire

Un outil qui teste un mode **inconnu** doit se signaler. Sans lui, une faute de frappe sur un nom de
mode produit un test toujours faux, silencieusement — et un comportement qui ne se déclenche jamais
ressemble trait pour trait à un comportement qui n'a pas lieu d'être.

## Ce qu'un mode doit porter

Au minimum, et séparément : la personne est-elle joignable · une question peut-elle bloquer · quelle
latence de réponse on suppose. Les fusionner, c'est refaire le booléen d'origine sous un autre nom.

## Sa limite honnête

Le registre déclare des modes ; il ne sait pas dans lequel on est. C'est une information de
conversation, et aucun mécanisme ne peut la deviner — elle se déclare, elle ne se détecte pas.
