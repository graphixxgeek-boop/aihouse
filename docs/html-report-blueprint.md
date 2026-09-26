# Gabarit HTML de remise — blueprint générique

## Le problème qu'il ferme

Un projet outillé produit vite des dizaines de rapports, et chacun invente sa mise en page. Le
lecteur doit réapprendre à lire à chaque fichier : où est le verdict, où sont les réserves, dans
quel ordre. **Ce qui coûte n'est pas la laideur, c'est la relecture** — un rapport qu'on doit
déchiffrer est un rapport qu'on survole.

## La distinction qui rend le gabarit sans risque

**Le fichier de TRAVAIL et le fichier de REMISE sont deux choses.** Le premier reste en texte, dans
le dépôt, relu par les scripts. Le second est une copie de présentation produite au moment de la
remise. Le gabarit ne touche jamais au premier — c'est ce qui permet de l'adopter partout sans
risquer de casser un outil qui relit ses propres archives.

## Ce qu'il fait

Il prend une description en blocs (titre, sous-titre, date, paragraphes, tableaux, notes) et rend
une page autonome, sans dépendance externe : elle s'ouvre hors ligne, se conserve, s'envoie.

## Ce qu'il ne fait pas

**Il ne rend pas un rapport bon.** Une page bien mise en page sur un contenu creux reste creuse — et
elle est même plus dangereuse, parce qu'elle a l'air sérieuse. Le gabarit uniformise la forme ; le
fond reste entièrement la responsabilité de l'outil qui l'appelle.

## Comment l'installer ailleurs

Un fichier, aucune dépendance, un contrat de blocs. Ce qui s'emporte avec lui : la règle « le
fichier gardé dans le dépôt reste du texte ».
