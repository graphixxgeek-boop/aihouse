<!-- Converti depuis Capability Map PRESENTATION.docx — copie de travail cherchable.
     L'ORIGINAL .docx reste à côté et fait foi : c'est le fichier tel qu'il l'a déposé.
     Ce fichier-ci est RÉGÉNÉRABLE : toute note écrite à la main y sera perdue. -->

“Capability Map” officielle de l'Agence

APRES LE PLAN DIRECTEUR DE LA RATIONNALISATION

J'ai transformé l'audit précédent en un véritable Plan directeur de rationalisation, avec une règle fondamentale : on ne va pas simplement découper l'existant ; on va d'abord définir la forme que l'Agence aurait dû avoir si nous avions disposé dès le départ de toute la connaissance actuelle.

Le document couvre notamment

la nouvelle architecture cible de l'Agence ;

les grandes branches structurantes ;

la nouvelle taxonomie Core / Domain / Tool / Runtime / Orchestrator / Guardian / Registry / Infrastructure / QA / Knowledge / Export / Adapter ;

la classification des 86 scripts actuels, un par un ;

pour chaque composant : nature réelle, emplacement cible et action recommandée ;

ce qui doit être conservé, fusionné, déplacé, transformé, déprécié ou extrait ;

les regroupements conceptuels à effectuer ;

les séparations qu'il faut absolument préserver ;

les routes d'architecture autorisées ;

les contrats à créer ;

la rationalisation spécifique de check-house ;

la future décomposition de /api/lia ;

le modèle de scoring des décisions de rationalisation ;

les curseurs actuels/cibles ;

le plan d'action en 12 étapes ;

et surtout l'articulation avec le produit commercial futur.

Le point le plus important que le document formalise

Aujourd'hui, nous avons grosso modo :

86 outils

↓

beaucoup de relations

↓

beaucoup de contrôles

↓

beaucoup de documentation

La cible devient :

10 GRANDES CAPACITÉS

↓

SOUS-SYSTÈMES

↓

CONTRATS

↓

OUTILS / SERVICES / AGENTS

↓

ADAPTERS

Donc les outils deviennent les feuilles et les grandes capacités deviennent les branches.

Et j'ai volontairement évité de conclure que « trop d'outils = mauvais ». Ce serait une erreur. Le problème actuel est surtout que des composants de natures différentes sont encore présentés comme appartenant au même niveau architectural.

Par exemple, tool-usage, modes-de-travail, priorites, lib-json ou report-template ne devraient pas apparaître comme des « agents » au même niveau que the-ghost, le-coordinateur ou un véritable moteur de raisonnement.

C'est probablement l'une des corrections architecturales les plus importantes de toute la phase.

Et j'ai vérifié la couverture

Les 86 fichiers .mjs présents dans scripts/ sont tous pris en compte dans la classification du plan directeur.

Télécharger le Plan directeur de rationalisation de l'Agence

Et surtout : ce document change notre méthode de travail

Nous ne sommes plus dans :

audit → extraction

mais dans :

audit → rationalisation → architecture cible → contrats → extraction → industrialisation → produit.

La prochaine étape que je recommande est maintenant très concrète : prendre cette architecture cible et construire la “Capability Map” officielle de l'Agence, puis faire le mapping 86 → grandes capacités → sous-systèmes → contrats sous forme d'une véritable carte d'architecture.

À ce stade, nous pourrons commencer à voir graphiquement les anciennes branches qui doivent être fusionnées, les branches qui doivent être séparées et les branches qui sont déjà étonnamment propres. C'est cette carte qui permettra ensuite de décider, avec beaucoup moins de risque, ce qui doit réellement être extrait.

