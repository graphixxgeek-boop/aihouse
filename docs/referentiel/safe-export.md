# SAFE-EXPORT — instanciation propre à ce projet

*(2026-09-22, nom donné par l'utilisateur. Septième Gardien sacré du code, par sa COUCHE LÉGÈRE
seulement. Blueprint générique : `docs/safe-export-blueprint.md`.)*

## Pourquoi seulement sa couche légère est Gardien sacré

Le critère d'appartenance est **double** : délivrer un vrai scan de qualité **ET** tourner
gratuitement, mécaniquement, à chaque commit. Le jugement « est-ce qu'une autre IA s'y retrouve »
demande du raisonnement payant ; ses **indices**, eux, sont mécaniques. Exactement le précédent
d'ALWAYS-NEW-CODE, et la distinction est non négociable (Article 23).

## Ce qu'il regarde à chaque commit

Les blueprints seulement — même économie que ses voisins Gardiens : un balayage complet du dépôt à
chaque commit coûterait trop pour un outil censé être gratuit. Et c'est le seul endroit où une fuite
de spécificité est certaine d'être un défaut, puisque ces fichiers se déclarent exportables.

## État réel au premier passage (2026-09-22)

26 blueprints · **4 fuites de spécificité** · **7 blueprints mal construits** · **0 dépendance à un
outillage particulier**.

## La leçon de sa première exécution

Il déclarait d'abord **25 blueprints sur 26** en défaut. Le chiffre était l'alerte : son marqueur
cherchait « blueprint générique » alors que la convention réelle du dépôt est « blueprint
exportable ». Détecteur fautif, pas 21 défauts — deux minutes de vérification contre un rapport
entièrement faux (Article 25).

## La règle de l'écart écarté (correction du jour même)

Sur relecture de l'utilisateur : « ne jamais ecarter une zone sciemment laissée de coté par moi,
sauf avec mon accord explicite ». La première version filtrait tout écart marqué « écarté » sans
jamais demander qui l'avait écarté — l'agent pouvait donc faire taire un avertissement tout seul.
**Un gardien qui peut se taire de sa propre initiative ne garde plus rien.**

Désormais : seul un écart portant un **accord explicite daté** est filtré. Les autres reviennent, et
leur rappel grossit — rappel, puis question proposée à 3 passages, puis **question obligatoire à 5**.
Un écart marqué « écarté » sans accord est lui-même signalé dans le rapport.

## Mémoire

`docs/safe-export/memoire.json`, trois états : **vu**, **corrigé**, **écarté sciemment** (ce dernier
exigeant l'accord). Un **corrigé** qui réapparaît ressort en régression, jamais filtré.
