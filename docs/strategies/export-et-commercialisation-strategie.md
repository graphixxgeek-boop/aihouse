# STRATÉGIE DE CHANTIER — EXPORT ET COMMERCIALISATION

*(Créée le 2026-09-26 05:44Z, liée à la tâche **#902**.)*

> **CE DOCUMENT NE RÉSUME JAMAIS.** Il AGRÈGE et il ORDONNE. Chaque idée y entre
> intégralement, entre guillemets, avec sa source. Trouver sa place dans la stratégie est
> le travail ; la raccourcir serait la perdre. En cas de conflit majeur entre une idée
> nouvelle et la stratégie en place, on ne tranche pas : on pose une question de calibrage.

## 1. POURQUOI CE CHANTIER

*l'intention d'origine, dans SES mots — jamais reformulée en vocabulaire d'agent*



« je voudrais qu'un outil mesure quelles fonctions sont inhérentes au fonctionnement de l'agence, quelles fonctions sont essentielles, insispensables, utiles, facultatives, optionnelles, etc. [...] pour pouvoir mesurer par la suite de quelles parties de l'agence on pourrait se separer dans des versions plus light »

— source : son gros prompt du 2026-09-26


« l'agence est faite pour etre consommé : c'est à dire : on installe l'agence au depart d'un projet de code, puis on la desinstalle avant la publication/commercialisation du projet de code. On a sauvegardé la version exporté de base, et c'est celle qu'on reutilise pour un nouveau projet. »

— source : son gros prompt du 2026-09-26


« dans le cadre de sa construction, l'agence demande certaines choses qu'elle ne demandera plus une fois commercialisée/exportée : par ex : l'acheteur achete l'agence, il l'installe. Ensuite l'agence n'a plus besoin d'etre exportable. Les versions exportables sont uniquement celles commercialisées »

— source : son gros prompt du 2026-09-26

## 2. CE QUI EXISTE DÉJÀ

*mesuré sur le dépôt, jamais supposé — c'est ce qui évite de reconstruire ce qui est là*



« SAFE-EXPORT est le septième Gardien sacré depuis le 2026-09-23. Sa couche légère tourne à chaque commit. Il porte findRaisonsPerdues() (alerte quand une raison écrite DISPARAÎT du dépôt) et findGardienAmbigu() (le mot « gardien » employé seul). Registre : 13 entrées pour 50 outils — une liste tenue à la main sans garde-fou, le patron exact que l'Article 24 interdit (tâche #807). »

— source : mesuré dans le dépôt le 2026-09-26


« Le dépôt compte 88 fichiers d'outillage et 49 582 lignes, dont check-house seul en pèse 12 052 — un quart de l'Agence dans un fichier (mesure #744). »

— source : mesure réelle, tâche #744


« La règle des deux documents par outil existe déjà : un blueprint générique réutilisable ailleurs, une instanciation propre à ce projet dans docs/referentiel/. C'est la moitié de l'exportabilité, déjà en place. »

— source : CLAUDE.md, inventaire documentaire

## 3. LES IDÉES RETENUES

*intégrales, citées, jamais résumées — chacune avec sa source*



« est-ce que les blueprints sont suffisants pour exporter ? un blu-print ca n'est pas du code ? comment fiabiliser les blueprint. je suis nice sur la question »

— source : son gros prompt du 2026-09-26


« l'outil est capable de mesurer l'exportabilité de l'agence et de dire lors de circle le pourcentage d'exportabilité de l'agence : il sait reperer ou il manque blue print indispensables [...] Existe-t-il un blue print de l'agence elle-même ? Chez quel outil ? Safe-export ? A creer si besoin. »

— source : son gros prompt du 2026-09-26


« Un blue print qui se met à jour automatiquement : tous les blue print doivent se mettre à jour automatiquement ca c'est ok ? [...] il doit y avoir un lien historique entre les blueprint et les versions, et on doit facilement savoir comment retrograder un blueprint dans une version moins developpée »

— source : son gros prompt du 2026-09-26


« safe export : l'outil vérifie les exports, et aussi à la marge : qu'un changement de modèle CLAUDE (opus, fable…) en cours de route est fluidifié grâce à l'outil, le relai se fait de manière propre et complète (mémoire, ligne de conduite, process, etc) et exportable »

— source : son gros prompt du 2026-09-26


« L'agence devrait tourner sur un modèle moins puissant que toi, tu ne dois pas te servir de toi même pour calibrer ca »

— source : son gros prompt du 2026-09-26


« on a absolument besoin de renforcer un outil ou de creer un nouvel outil pour mesurer : les performances de l'agence en terme d'économies réalisées : chaque fois qu'un outil est utilisé, son utilisation precise engendre une depense et une economie de : TOKEN, API, TEMPS »

— source : son gros prompt du 2026-09-26


« quelle est l'impact de l'agence sur la memoire disque ? [...] à combien ce cout peut-il etre au bout de 1 mois ? 2 mois ? 1 an ? »

— source : son gros prompt du 2026-09-26


« est-ce que tu te PERDS dans le fonctionnement de l'agence ou est-ce que ca T'AIDE vraiment. Sois honnête dans ta réponse stp. Pas besoin de me ménager ou de me plaire. Je veux du factuel. »

— source : son gros prompt du 2026-09-26

## 4. LES RECHERCHES ET TROUVAILLES

*ce qu'on est allé chercher dehors, et ce qu'on en a tiré*

*(vide — rien n'a encore été versé ici)*

## 5. LES DÉCISIONS DÉJÀ PRISES

*ce qui ne se rediscute plus, avec la date et qui a tranché*



« TRANCHÉ en fenêtre le 2026-09-26 : un blueprint ne suffit PAS à exporter. Un blueprint est de la PROSE : il dit ce qu'un outil doit faire et pourquoi, pas comment. Il permet de RECONSTRUIRE l'outil ailleurs, pas de le TRANSPLANTER. Un vrai export a besoin des deux : le blueprint (le pourquoi, qui survit au changement de langage) ET le fichier .mjs (le comment). »

— source : sa réponse en fenêtre de calibrage, 2026-09-26


« TRANCHÉ en fenêtre le 2026-09-26 : l'échelle de vitalité a QUATRE niveaux — vital (sans lui l'Agence ne tourne pas), essentiel (sans lui elle tourne mais perd une garantie), utile (il fait gagner du temps), optionnel (confort ou cas particulier). »

— source : sa réponse en fenêtre de calibrage, 2026-09-26


« TRANCHÉ en fenêtre le 2026-09-26 : les bénéfices nets se mesurent sur ce qui EST mesurable — appels API évités, tokens économisés, défauts trouvés. Le contrefactuel « temps qu'aurait pris un codage sans Agence » n'est PAS mesurable sans groupe témoin, et un argument commercial bâti sur un chiffre inventé s'effondre à la première question. »

— source : sa réponse en fenêtre de calibrage, 2026-09-26


« TRANCHÉ en fenêtre le 2026-09-26 : recherches web CIBLÉES, 3 à 4 questions précises, pas un panorama de marché. »

— source : sa réponse en fenêtre de calibrage, 2026-09-26

## 6. CE QUI RESTE À TRANCHER

*les arbitrages qui lui reviennent — jamais tranchés par l'agent*



« LA PART DE L'AGENCE INUTILE EN VERSION COMMERCIALISÉE. Il demande de l'estimer en lignes de code. La logique à préciser avec lui : l'exportabilité est un besoin DU CRÉATEUR pendant la construction, pas de l'acheteur après installation. »

— source : son gros prompt du 2026-09-26


« LA TAILLE DE CODE CIBLE. Est-ce que 49 582 lignes d'outillage peuvent servir un projet plus petit qu'elles ? aussi gros ? plus gros ? Question ouverte, recherches web demandées. »

— source : son gros prompt du 2026-09-26


« LES MEMBRES CLASSIQUES N'ONT PAS DE BLUEPRINT, par décision documentée. Sont-ils indispensables au fonctionnement de l'Agence ? Si oui, comment les exporter sans blueprint ? Question qu'il pose et qui n'est pas tranchée. »

— source : son gros prompt du 2026-09-26

## 7. LE PLAN D'EXÉCUTION

*ne se remplit qu'À LA FIN, juste avant la construction effective*

*(vide — rien n'a encore été versé ici)*
