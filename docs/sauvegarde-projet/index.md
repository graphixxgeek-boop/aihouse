# Registre — sauvegarde-projet

**Ce qu'on note ici** : ce que la mise en place de la sauvegarde a révélé — jamais la liste des
sauvegardes produites, qui vit dans `docs/sauvegardes`.

| Date | Ce qu'il a trouvé | Ce qui en a découlé |
|---|---|---|
| 2026-09-24 | **Deux livrables aux métiers OPPOSÉS, et les confondre était l'erreur de départ** : le coffre est exhaustif et jamais lu (il RESTAURE), la notice est choisie et lue (elle EXPLIQUE). Mesure : coffre 6,1 Mo — trop léger pour valoir un tri ; dépôt entier aplati ~4 millions de tokens — une vingtaine de fois trop pour une notice. **Une notice qui sature la mémoire de son lecteur ne sert à rien**, et c'est le piège : elle a l'air complète. | Deux livrables séparés, calibrés séparément. |
| 2026-09-24 | **Son inquiétude sur les gigaoctets était sans objet**, et la raison est contre-intuitive : le suivi, les simulations et les registres SONT des fichiers du dépôt. Le coffre du jour contient toute l'histoire du jour. Écraser ne perd rien — ce n'est pas une photo qui remplace une photo, c'est un livre qui remplace le même livre avec des chapitres en plus. | Écrasement assumé, avec les 3 derniers gardés : une sauvegarde unique et corrompue ne laisse rien derrière elle. |
| 2026-09-26 | **Il n'enregistrait jamais son passage au compteur d'usage.** Découvert parce que son inscription au catalogue l'a rendu visible : son zéro ne disait pas « personne ne sauvegarde », il disait « personne ne compte ». Premier vrai mordu des verrous de Ronde, sur un défaut créé en corrigeant autre chose. | `recordCliUsage` ajouté à la source. |
| 2026-09-26 | Kit d'export : plan, fiche et registre manquaient. | Ce fichier et ses deux voisins. |
