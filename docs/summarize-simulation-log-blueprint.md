# summarize-simulation-log — plan générique : archiver le sens, jeter le poids

*(Blueprint réutilisable. Instanciation : `docs/referentiel/summarize-simulation-log.md`.)*

## Le problème : un journal trop lourd pour être gardé, trop utile pour être perdu

Une exécution longue (simulation, campagne, run de test) produit un journal brut de plusieurs
mégaoctets : chaque requête, chaque réponse. Le garder gonfle le dépôt sans limite ; le jeter perd
la seule preuve que quelque chose s'est réellement passé.

Le compromis habituel — « on le garde ailleurs » — est le pire des trois : un fichier qui vit hors du
dépôt disparaît au premier nettoyage, et personne ne s'en aperçoit.

## Le principe : extraire les FAITS, jeter les CONTENUS

On conserve ce qui rend le journal vérifiable — les événements datés et leur ordre — et on jette ce
qui pèse : le texte des requêtes et des réponses.

Le résumé fait quelques kilo-octets là où le brut en faisait des mégaoctets, et il répond à la seule
question qu'on lui posera plus tard : **est-ce que tel comportement documenté s'est vraiment
produit ?**

## Les trois règles qui décident de ce qu'on garde

1. **Un événement se garde s'il est mécaniquement lisible.** Un numéro d'étape, un changement
   d'état, un déclenchement. Ce qui demande une lecture qualitative ne s'extrait pas : ça reste un
   travail de raisonnement, et le prétendre extrait serait mentir sur la nature du résumé.
2. **Une absence de champ se déclare comme telle.** Les journaux anciens n'ont pas les champs
   ajoutés depuis. Un repli honnête (lire l'information ailleurs, ou dire qu'elle manque) vaut
   mieux qu'une valeur par défaut qui se lira comme une mesure.
3. **Le résumé remplace le brut dans l'archive**, il ne s'y ajoute pas — sinon le poids revient.

## Le moment où il faut le construire : AVANT d'en avoir besoin

Cet outil naît toujours trop tard, au moment où l'on s'aperçoit que les journaux n'existent plus que
dans un espace temporaire. Le construire pendant que les journaux bruts existent encore est la seule
façon d'en tirer un historique complet.

## Sa limite honnête

Il extrait ce qui est directement lisible dans le journal. Jamais une lecture qualitative du
contenu — celle-là reste un travail de raisonnement, coûteux et humain.
