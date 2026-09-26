# Registre — modes-de-travail

**Ce qu'on note ici** : ce que la séparation des modes a révélé — jamais les passages, un registre de
déclaration n'en ayant pas.

| Date | Ce qu'il a trouvé | Ce qui en a découlé |
|---|---|---|
| 2026-09-23 | **Un booléen recopié dans 31 endroits portait DEUX questions sans rapport** : « l'utilisateur est-il là ? » et « une question peut-elle bloquer ? ». La confusion était invisible tant que les deux réponses coïncidaient. | Le mode semi-autonome, demandé le jour même, les sépare : l'utilisateur est présent ET rien ne bloque. Ce n'est pas un cas exotique — c'est le mode le plus courant dès qu'il y a confiance. |
| 2026-09-23 | Le risque immédiat de tout registre de ce genre : **une faute de frappe sur un nom de mode produit un test toujours faux, silencieusement** — et un comportement qui ne se déclenche jamais ressemble à un comportement sans raison d'être. | Garde-fou : un outil qui teste un mode inconnu se signale. |
| 2026-09-26 | Kit d'export : plan, fiche et registre manquaient. | Ce fichier et ses deux voisins. |
