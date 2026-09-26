# Les gabarits du kit d'export

*(Créés le 2026-09-26, à sa demande : « ATTENDU : mise à jour des postes de travail, création de
fichiers template, mise en place du système de façon propre ».)*

**POURQUOI DES GABARITS PLUTÔT QU'UNE CONSIGNE.** `node scripts/safe-export.mjs kits` dit quelles
pièces manquent, fichier par fichier, avec le chemin exact à créer. Ce qu'il ne pouvait pas donner,
c'est **ce qu'on écrit dedans** — et une pièce dont on ne sait pas quoi mettre ne s'écrit jamais.
Les gabarits ferment cet écart : la commande dit OÙ, le gabarit dit QUOI.

**CE QU'ILS NE SONT PAS : des formulaires à remplir.** Chaque section porte la QUESTION à laquelle
elle répond, jamais un titre creux. Une section qu'on ne sait pas remplir se supprime avec sa
raison écrite ; elle ne se remplit pas d'une phrase polie qui donnera l'illusion d'un document.

## Les trois gabarits, et la pièce que chacun produit

| Gabarit | La pièce | Dû à partir de |
|---|---|---|
| `blueprint.md` | le blueprint générique (`docs/<outil>-blueprint.md`) | 🟡 utile |
| `fiche-instanciation.md` | la fiche (`docs/referentiel/<outil>.md`) | 🟠 essentiel |
| `registre-index.md` | l'index du registre (`docs/<outil>/index.md`) | 🟠 essentiel |

La quatrième pièce, **le code**, existe par définition. La cinquième, **les dépendances**, est
DÉRIVÉE des imports réels du fichier : elle ne s'écrit pas, elle se lit — et c'est voulu, une liste
de dépendances tenue à la main se périme au premier import ajouté.

## La règle qui gouverne la différence entre les deux documents

**Le BLUEPRINT ne doit rien contenir qui soit propre à ce projet-ci.** La fiche porte tout le reste.
Le test, à appliquer phrase par phrase : *cette phrase reste-t-elle vraie sur un autre projet ?* Si
oui elle va au blueprint, si non elle va à la fiche. Un blueprint qui parle de Lia et Noé n'est pas
un blueprint, c'est une fiche mal rangée — et le destinataire le découvrira en le lisant, trop tard.
