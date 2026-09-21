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

## 5. Progression Niveau 1 → 2 → 3 par outil, sans réflexion au moment de l'exécuter

*(2026-09-21. Discipline d'écriture pour ce fichier, actée le même soir : cette section reflète
l'ÉTAT ACTUEL de la réflexion sur ce sous-sujet précis, jamais un empilement chronologique — une
future reprise de cette discussion réécrit cette section plutôt que d'en ajouter une autre à côté.)*

**Idée de l'utilisateur.** L'agence exportée dans un nouveau projet démarre au Niveau 1. Plus tard,
faire passer UN outil précis au Niveau 2 ne doit demander aucune réflexion de conception sur le
moment — juste exécuter un plan déjà écrit à l'avance. Question posée : la conception de l'agence
doit-elle anticiper ce système dès aujourd'hui ?

**Réponse.** Oui pour la RÈGLE, pas oui pour le CONTENU détaillé de chaque outil dès maintenant —
écrire aujourd'hui un vrai plan Niveau 2/3 complet pour chacun des ~25 outils actuels serait un
travail spéculatif sur un futur projet dont on ne connaît pas encore la forme réelle (le risque
concret : un plan écrit à l'aveugle aujourd'hui ne correspondra probablement pas au vrai besoin du
jour où il sera exécuté — même risque que d'anticiper une structure de code avant que le besoin
réel ne soit connu, cf. Article 7/23 de CLAUDE.md, jamais appliqué avant que le travail ne soit
réellement engagé). Ce qui PEUT et DOIT se décider dès maintenant, en revanche, c'est la RÈGLE
GÉNÉRIQUE de ce que chaque niveau signifie, pour que le contenu détaillé par outil se remplisse
naturellement au fil de la vraie conception du chantier §3 (jamais tout d'un coup aujourd'hui) :

- **Niveau 1** — l'outil tel qu'il est livré à l'installation de l'agence dans un nouveau projet :
  autonome, ne suppose rien sur la taille ou la maturité du projet qui l'accueille.
- **Niveau 2** — un plan de montée en puissance déjà ÉCRIT dans le blueprint générique de l'outil
  au moment de la conception du gabarit (chantier §3), décrivant EXACTEMENT ce qui change (souvent :
  un vrai croisement avec d'autres outils, une vérification plus profonde, une entrée dans un
  système de badge/couverture équivalent à celui de ce projet) — jamais rédigé au moment de
  l'exécuter, seulement lu et appliqué.
- **Niveau 3** — l'intégration maximale déjà prévue de la même façon (ex. automatisation complète,
  validation croisée entre outils, reporting enrichi).

Chaque blueprint gagnera donc, le jour où le chantier §3 sera réellement engagé (jamais avant), une
section « Progression Niveau 1 → 2 → 3 » écrite une fois pour toutes à ce moment-là — la future
exécution d'un passage de niveau restera alors un geste mécanique, exactement l'objectif de
l'utilisateur, sans qu'aucun travail spéculatif n'ait été gaspillé aujourd'hui sur du contenu qui
risquerait de ne jamais servir tel quel.
