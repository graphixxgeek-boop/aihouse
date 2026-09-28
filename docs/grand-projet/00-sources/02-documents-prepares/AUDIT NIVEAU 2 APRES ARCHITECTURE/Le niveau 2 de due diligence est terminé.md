<!-- Converti depuis Le niveau 2 de due diligence est terminé.docx — copie de travail cherchable.
     L'ORIGINAL .docx reste à côté et fait foi : c'est le fichier tel qu'il l'a déposé.
     Ce fichier-ci est RÉGÉNÉRABLE : toute note écrite à la main y sera perdue. -->

Le niveau 2 de due diligence est terminé. Et il apporte une correction importante au premier audit : la cartographie AST réelle est plus saine que ne le laissait penser l’analyse regex.

Résultats essentiels

190 fichiers analysés par AST TypeScript/JavaScript.

163 relations locales résolues par AST.

147 relations runtime après exclusion des imports type.

0 cycle runtime local confirmé.

Le couple world ↔ relationship n'est donc pas un cycle d'exécution : relationship → world est uniquement typé.

lib/daynight.ts est réellement extractible dès maintenant.

lib/gemini-keys.ts est également très fortement extractible et constitue un excellent candidat stratégique.

lib/relationship.ts est presque autonome et devient extractible après une petite décorrélation de ses types.

lib/house.ts est techniquement très propre mais possède 14 consommateurs : il faut donc le traiter comme un contrat central plutôt que comme premier pilote.

world.ts et surtout app/api/lia/route.ts doivent attendre : leur extraction prématurée créerait davantage de risques que de valeur.

Sécurité

Deux points méritent désormais une attention spécifique :

/api/admin utilise toujours le code statique 1980 comme mécanisme d'autorisation.

app/chatgpt-auth.ts possède bien un mécanisme d'authentification, mais l'analyse des usages ne montre pas son branchement aux principales routes API.

En revanche, /api/lia possède un mécanisme de cohérence concurrente beaucoup plus substantiel : lock + token + expiration + fencing SQL + epoch + idempotence par requestId. Celui-ci devra absolument être conservé lors de toute extraction.

Exécution réelle

J'ai distingué ce qui est réellement vérifié de ce qui ne l'est pas encore :

syntaxe Node : vérifiée ;

AST : vérifiée ;

daynight : 14/14 tests de caractérisation passants ;

relationship : 7/7 passants ;

build complet : bloqué parce que l'archive ne contient pas node_modules ;

check-house : bloqué par la même absence de dépendances ;

tsc --noEmit complet : impossible dans l'archive brute pour la même raison.

Je n'ai pas modifié le projet source.

Les premiers modules à extraire

L'ordre que je recommande désormais est très clair :

1. lib/daynight.ts → premier pilote réel
↓
2. lib/gemini-keys.ts → premier module stratégique réutilisable
↓
3. lib/relationship.ts → premier vrai module métier autonome
↓
4. lib/house.ts
↓
5. lib/simulation.ts
↓
6. contrats de domaine / repository
↓
7. world.ts
↓
8. service de tour
↓
9. /api/lia

C'est beaucoup plus sûr que de commencer par les énormes fichiers centraux.

J'ai également produit le rapport complet de niveau 2, avec les résultats AST, contrats de données, sécurité, exécution, classement R2/R3/R4 et protocole d'extraction :

Télécharger le rapport — Due Diligence Niveau 2

La prochaine étape logique est maintenant la preuve R4 : installer les dépendances dans une copie isolée, lancer tsc, lint, build et surtout check-house/simulations, puis effectuer une première extraction réelle de daynight.ts dans une copie expérimentale, avec comparaison avant/après.

