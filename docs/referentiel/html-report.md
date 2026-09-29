# html-report — fiche d'instanciation

*(Blueprint générique : `docs/html-report-blueprint.md` · script : `scripts/html-report.mjs`.)*

## Ce qu'il sert ici

`scripts/html-report.mjs` (2026-09-20), né après la « photo de la dream team », sur sa demande :
« tu vas transformer tous les rapports en fichiers HTML avec une mise en page améliorée […] petit
bond en avant du projet pour la partie remise de rapport au dev ».

## Sa portée, calibrée avec lui en trois questions (Article 16)

**TOUS les rapports livrés en pièce jointe** — KPI, EL-PROFESSOR, THE-SCREENER, simulations,
THE-FINAL-JUDGE, CIRCLE-TASKS — pas seulement les documents « fun ».

## La décision déjà prise, et qui protège tout le reste

**Le fichier gardé DANS le projet reste la version de travail en texte/markdown.** Ce gabarit ne
produit JAMAIS le fichier de référence, seulement une copie de présentation générée à la remise.
Zéro risque pour les outils existants qui relisent leurs propres archives.

## Ses blocs, ici

`heading`, `paragraph`, `note`, `highlight`, `list`, `table`, `code`, `image`, `dialogue`, `tree`,
`matrix`. Le bloc `matrix` a été ajouté pour la carte gravité × garantie plutôt que de forker une
page : la carte suivante arrivera par le même chemin, quel qu'en soit le sujet.

## Sa limite ici

Il met en forme, il ne juge pas. Un rapport creux rendu en HTML reste creux — et paraît plus
sérieux, ce qui est pire.

## La commande `document` : une page dérivée a un GESTE, jamais un souvenir (2026-09-28, tâche #1142)

**Le défaut qui l'a créée.** Les trois premières pages HTML du grand projet avaient été produites
par un script jetable, écrit dans la conversation et mort avec elle. Elles étaient justes ce soir-là
et **fausses dès la première correction du Markdown** : personne — l'agent compris — n'aurait su
comment les refaire. C'est la leçon L2 dans sa forme exacte : un mécanisme qui ne quitte pas la
session n'existe plus le lendemain.

```
node scripts/html-report.mjs document <source.md> <sortie.html> [--titre "…"] [--sous-titre "…"]
```

**Le titre se lit sur le premier `#` du Markdown** plutôt que d'être redemandé en argument : le
document se décrit déjà lui-même, et le redemander serait une occasion de plus de le laisser
diverger (Article 24).

## Le registre `docs/html-report/index.md` — écrit par l'outil, jamais à la main

**Il est né d'un garde-fou qui a mordu le soir même** : `mesurerLesKits()` exige un registre de tout
fichier qui ÉCRIT, et doc-HTML s'est mis à écrire en recevant sa ligne de commande. Il avait raison
de demander.

**Ce que le registre porte, et pourquoi ce n'est pas décoratif** : une ligne par page dérivée — la
page produite, le Markdown dont elle sort, sa taille, l'heure. C'est la seule réponse à la question
« cette page HTML vient de quel Markdown, et de quand ? ». Sans elle, une page dérivée devient
indiscernable d'une page écrite à la main, et personne ne sait plus laquelle des deux corriger.

**Une page régénérée REMPLACE sa ligne au lieu de s'empiler** : un registre qui grossit à chaque
passage cesserait de répondre « d'où vient cette page ? » pour ne plus répondre qu'« a-t-elle déjà
été produite ? », ce qui n'intéresse personne.

**Il est déclaré AUTO-COUVERT pour la Ronde** (`CIRCLE_AUTO_COVERED_REGISTRIES`), avec sa raison :
il est vrai par construction, donc un passage périodique n'y rattraperait rien. Lui donner un item
de Ronde aurait été exactement l'obligation vide que ce projet retire plutôt qu'il n'ajoute.

## Un effet de bord qui a fait tomber le filet, et qui valait la peine

En recevant une ligne de commande, doc-HTML a **cessé d'être une « bibliothèque » pour devenir une
« commande documentée »** — un reclassement automatique et parfaitement juste. Une assertion du
filet exigeait « au moins 20 bibliothèques », un chiffre gravé le jour de sa naissance : **le test a
puni une amélioration**. Le nombre se DÉRIVE désormais du recensement (Article 24). *Un test qui
tombe quand le dépôt s'améliore est un test qui sera désactivé, jamais lu (leçon L4).*
