# judge-persona-shared — plan générique : le socle commun des agents « juges »

*(Blueprint réutilisable. Instanciation : `docs/referentiel/judge-persona-shared.md`.)*

## Ce qu'il est

Dès qu'un projet a **deux** outils d'audit qui font appel à un agent séparé jouant un personnage
fixe, ces deux outils partagent deux besoins identiques :

1. **Extraire le personnage** depuis son document de référence, à chaque appel.
2. **Détecter un rapport générique** — celui qui aurait pu être écrit sans regarder le projet.

Ces deux fonctions se dupliquent naturellement, parce que chaque outil est écrit séparément et que
la duplication ne se voit qu'une fois les deux en place.

## La règle sur le personnage, et elle est non négociable

**Le personnage vit dans UN document, et il est extrait à chaque appel** — jamais recopié à la main
ailleurs.

C'est ce qui garantit que le texte envoyé à l'agent provient TOUJOURS du même texte de référence. Une
copie recopiée dérive dès la première retouche, et l'outil se met alors à juger avec un personnage
qui n'est plus celui qu'on croit — sans qu'aucun signe extérieur ne l'indique.

## La règle sur le rapport générique

Un agent séparé qui n'a pas assez de contexte produit un rapport **plausible et creux** : des
sections correctes, un ton assuré, et rien qui ne pourrait s'appliquer à n'importe quel projet.
C'est la forme la plus coûteuse d'échec — on a payé l'appel, et le résultat a l'air d'un résultat.

La détection combine ce qui est commun (sections manquantes, longueur insuffisante) et laisse chaque
outil ajouter **son propre signal spécifique** par-dessus. C'est précisément le partage qui rend
cette extension possible sans divergence : le socle commun ne bouge pas, chacun ajoute au-dessus.

## La règle d'extension

**Jamais un troisième cousin qui réimplémente sa propre copie.** Tout futur outil du même genre
importe d'ici. Cette phrase doit être écrite dans le fichier lui-même, sinon le troisième outil
refera la copie, comme le deuxième l'avait fait.

## Sa limite honnête

Il repère un rapport qui RESSEMBLE à un rapport générique. Un rapport spécifique mais faux lui
paraît parfait — juger le fond reste une lecture.
