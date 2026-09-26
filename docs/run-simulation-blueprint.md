# run-simulation — plan générique : le pilote d'une exécution longue, COMMITTÉ

*(Blueprint réutilisable. Instanciation : `docs/referentiel/run-simulation.md`.)*

## Le défaut qu'il ferme, et il est plus commun qu'on ne croit

Un protocole écrit dit « lancer le script d'exécution intégrale ». Tout le monde suppose que ce
script existe. En réalité il est **réécrit à la volée dans un dossier temporaire à chaque passage**,
puis perdu avec la session.

Le protocole paraît suivi. Les archives s'accumulent. Et personne ne remarque que **deux passages
successifs n'ont jamais été strictement comparables** — le scénario était retapé de mémoire à
chaque fois.

C'est le cas d'école d'une construction que rien ne garantit reproductible : ce qu'un projet
sérieux interdit, et qui se glisse là précisément parce que le protocole, lui, est écrit.

## Le principe : un pilote committé, donc rejouable à l'identique

Le scénario vit dans le dépôt. Il se relance mot pour mot. Deux passages deviennent comparables — et
sans ça, aucune comparaison entre deux versions ne veut rien dire, puisqu'on ignore ce qui a changé
du produit et ce qui a changé du scénario.

## Ce qu'il n'est PAS

**Il ne juge rien et ne corrige rien** : il joue la partie et écrit ce qui s'est dit. L'analyse
appartient à d'autres étapes du protocole, jamais à ce script.

## La règle sur ce qu'on met dedans, et elle a été payée

**Un fichier qui ne peut pas être testé sans serveur contamine tout ce qu'on y ajoute.** Toute
mécanique placée ici devient non testable — donc un défaut peut y survivre plusieurs passages sans
que rien ne le voie (c'est arrivé : un même défaut a traversé trois exécutions).

Conséquence : le pilote **tend** l'état à qui sait le juger, il ne le juge pas lui-même. Trois lignes
d'appel, rien à vérifier. Toute la mécanique vit dans un module testable, à côté.

## Sa limite honnête

Il garantit la reproductibilité du scénario, jamais celle du résultat : un système génératif rend
une sortie différente à chaque fois, et c'est voulu. Ce qu'il fige, c'est **ce qu'on lui demande**.
