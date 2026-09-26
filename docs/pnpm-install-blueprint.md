# pnpm-install — plan générique : la plomberie d'installation, et pourquoi elle se DÉCLARE

*(Blueprint réutilisable. Instanciation : `docs/referentiel/pnpm-install.md`.)*

## Ce qu'il est

Un utilitaire d'installation de dépendances, appelé par l'outillage — jamais tapé par un humain.

## Le vrai sujet de ce document : le DÉSACCORD entre ce qu'un fichier est et ce qu'une mesure en dit

Un système qui classe automatiquement les fichiers d'un dépôt déduit « ce fichier est convocable »
de « ce fichier a un point d'entrée ». C'est vrai la plupart du temps, et faux ici : il a bien un
point d'entrée, mais ses seuls arguments sont des drapeaux internes qu'aucun humain ne tape.

**Il est appelé, jamais convoqué** — et la nuance décide de son classement.

## Le principe : le désaccord se RAPPORTE, il ne se tranche pas tout seul

Deux réponses possibles, et une seule est bonne :

| La réponse | Ce qu'elle produit |
|---|---|
| forcer la mesure à dire ce qu'on pense | une exception de plus, invisible, qui masquera le prochain vrai cas |
| **écrire ce que le fichier sait de lui-même, et laisser le désaccord visible** | la mesure garde sa règle, la déclaration garde sa nuance, et l'arbitrage revient à un humain |

C'est précisément pour ce cas qu'un système de classement doit lire **deux sources** plutôt qu'une :
la déclaration du fichier, et la dérivation mécanique. Quand elles divergent, on n'a pas une erreur,
on a une question.

## La forme de la déclaration

Une ligne en tête du fichier, avec sa raison. Elle dit ce que le fichier sait de lui-même, elle ne
commande rien. Sans la raison écrite, c'est une exception ; avec, c'est un avis.

## Sa limite honnête

Une déclaration est un avis, pas une preuve. Un fichier peut se déclarer à tort — et c'est pour ça
que la mesure dérivée reste, plutôt que d'être remplacée.
