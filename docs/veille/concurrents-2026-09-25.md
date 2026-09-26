# L'AGENCE A-T-ELLE DES ÉQUIVALENTS COMMERCIALISÉS ?

*(Recherches web du 2026-09-25, archivées le 2026-09-26 — tâche #771.)*

> Sa question : « est-ce que ce type d'agence est déjà commercialisée ou proposée quelque part sur
> le web ? [...] fais moi une belle réponse avec différentes catégories de concurrents »

## LA RÉPONSE COURTE

**Personne ne vend exactement ça**, et quatre familles s'en approchent par un côté chacune. Aucune
ne couvre les trois choses ensemble : une ÉQUIPE d'agents-outils, une MÉMOIRE de projet, et des
GARDE-FOUS qui vérifient mécaniquement que les règles sont tenues.

## LES QUATRE FAMILLES

### 1. Les frameworks multi-agents — CrewAI, AutoGen, LangGraph

**Ce qu'ils font** : des rôles, une orchestration, des agents qui se passent le travail.

**Ce qui manque** : aucune mémoire de projet, aucun garde-fou de qualité. Ils font travailler des
agents ensemble ; **ils ne jugent jamais ce qui sort**. Un agent qui rend un mauvais résultat le
rend exactement comme un bon.

### 2. La gouvernance d'agents — Microsoft Agent Governance Toolkit (avril 2026)

**Ce qu'ils font** : politique, bac à sable, identité, traçabilité des accès.

**Ce qui manque** : c'est la SÉCURITÉ d'exécution — qui a le droit de faire quoi — **jamais la
qualité du travail rendu**. Un agent parfaitement gouverné peut produire du code faux en toute
conformité.

### 3. Les fichiers de règles — CLAUDE.md, AGENTS.md, .cursorrules, les skills

**Ce qu'ils font** : la mémoire institutionnelle. C'est le plus proche de notre charte.

**Ce qui manque, et c'est décisif** : **un fichier de règles est LU, jamais VÉRIFIÉ**. Rien ne dit
si la règle a été suivie. C'est exactement l'écart que l'Article 24 de notre charte nomme — une
intention n'est pas un mécanisme.

### 4. Les outils de qualité de code — Sourcegraph, CodeRabbit, Augment, SonarQube

**Ce qu'ils font** : le scan de code, la revue automatique, les métriques.

**Ce qui manque** : aucune notion d'ÉQUIPE ni de PROCESS. Ils mesurent le code produit, **jamais la
façon dont il a été produit** — donc ils ne peuvent pas attraper un défaut de méthode qui n'a pas
encore produit de mauvais code.

## CE QUI N'EXISTE NULLE PART, ET QUI EST NOTRE ANGLE

**Une équipe d'agents-outils qui se surveillent MUTUELLEMENT**, avec :

- des **rangs** (les sept Gardiens sacrés, les contrôleurs de process, les veilleurs) ;
- une **RH** qui mesure l'effectif, la stagnation, les badges (CASSANDRA-RH) ;
- des **objectifs chiffrés** confrontés aux résultats réels ;
- une **mémoire de leçons** qui ressort au bon moment plutôt que de dormir dans un fichier ;
- des **contrôleurs de process** qui surveillent le déroulé, pas le code ;
- et surtout : **chaque outil doit déclarer ce qu'il ne PEUT PAS mesurer**, plutôt que rendre un
  zéro qui ressemble à un verdict.

## CE QUE ÇA CHANGE POUR LA STRATÉGIE D'EXPORT

**L'angle n'est pas « un framework de plus ».** Les quatre familles ci-dessus sont matures et
financées ; se battre sur leur terrain serait perdu d'avance.

**L'angle est la VÉRIFICATION MÉCANIQUE d'une méthode de travail.** C'est ce que personne ne fait,
et c'est aussi ce qui est le plus difficile à copier — parce que ça ne se code pas en une fois :
chaque garde-fou de ce dépôt existe parce qu'un défaut réel est passé inaperçu une fois.

## PLAN D'ACTION

| État | Constat | Ce que ça devient |
|---|---|---|
| **RETENU** | Personne ne vend ça ; quatre familles approchent par un côté | **archivé ici** — la veille est faite et conclut, tâche #771 close |
| **RETENU** | L'angle est la vérification mécanique d'une méthode, pas un framework de plus | versé dans la stratégie EXPORT & COMMERCIALISATION |
| **ÉCARTÉ** | Refaire la veille périodiquement | une veille par calendrier rendrait « rien de neuf » et apprendrait à ne plus lire. Elle se refait quand une question se pose |
