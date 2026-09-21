# Agence exportable comme gabarit générique — dossier de conception (préliminaire, en cours)

*(2026-09-21, idée formulée en conversation, explicitement « pour beaucoup plus tard, dernière tâche
de tout le projet » — consignée le même soir sur demande explicite de l'utilisateur de vérifier que
toute idée de ce type rejoint bien un fichier préliminaire dédié. Aucun travail de conception réel
commencé — ce fichier n'accumule pour l'instant que l'intention et les points de départ déjà
identifiés, à développer une fois ce chantier réellement engagé.)*

## 1. Vision

Une fois « l'Agence Codex » (l'outillage de travail de ce projet) suffisamment mature, en extraire un
vrai gabarit/modèle d'agence, réutilisable pour un futur projet de codage différent — pas seulement
copier les fichiers tels quels, mais affiner l'existant pour distinguer clairement ce qui est
GÉNÉRIQUE (réutilisable tel quel sur un autre projet) de ce qui est SPÉCIFIQUE à ce jeu précis. Image
donnée par l'utilisateur : « je me sers de l'agence existante pour imaginer un vrai gabarit, un vrai
modèle d'agence parfaitement adapté à la construction d'un code [...] on aurait une base exportable ».

## 2. Terrain déjà favorable (constat, pas encore une conception)

Chaque outil de l'agence a déjà, pour l'essentiel, une séparation en deux documents : un blueprint
générique (`docs/<nom>-blueprint.md`) et une instanciation propre à ce projet
(`docs/referentiel/<nom>.md`). C'est précisément la distinction qu'il faudrait pour extraire un
gabarit exportable — le travail ne partirait donc pas de zéro, mais consisterait à vérifier que
cette séparation est bien nette partout et à assembler les blueprints en un vrai kit de départ.

## 3. Ce qui reste entièrement à faire (aucune décision prise)

- Choisir le périmètre exact du gabarit (tous les outils ? seulement les Gardiens sacrés et
  quelques Agents Cadre ? une sélection curatée ?).
- Décider comment un futur projet « greffe » ce gabarit à son propre codage (copie de fichiers,
  script d'installation, autre mécanisme).
- Vérifier qu'aucune connaissance propre à CE projet (Lia/Noé, la maison, les mécaniques de jeu) ne
  fuit dans les blueprints génériques — un risque réel si l'extraction est faite trop vite.
- Décider du statut de ce chantier lui-même dans l'organigramme de l'Agence (qui le pilote ?
  CASSANDRA-RH, LE-GRAND-ARCHITECTE — jamais construit à ce jour — ou un nouvel outil dédié ?).

## 4. Statut

Explicitement pour plus tard — dernière tâche du projet selon l'utilisateur. Ce fichier existe pour
que l'intention et le constat du §2 ne se perdent pas d'ici là, pas pour engager le travail
maintenant.
