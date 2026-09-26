# Blueprint générique — le filet de fidélité d'un TON

*(Réutilisable sur tout projet dont la valeur centrale est une VOIX — un personnage, une marque, un
registre d'écriture. Instanciation ici : `docs/referentiel/check-spirit.md`.)*

## Le problème qu'il résout, et pourquoi la suite de tests ne le couvre pas

Une suite de tests classique vérifie la mécanique avec un modèle simulé et déterministe. Elle
garantit que le système fonctionne ; elle ne peut rien dire de **ce qui sort vraiment**. Or sur un
projet dont la valeur est un ton, c'est exactement ce qui compte — et c'est le seul endroit où une
dérive s'installe sans qu'aucun test ne rougisse.

## Le principe : provoquer pour de vrai, puis faire lire un humain

1. **Une batterie de provocations écrites d'avance**, couvrant les situations où le ton risque de
   céder : l'ordre autoritaire, l'intrusion, le mépris, la menace, la flatterie.
2. **De vrais appels au vrai modèle** — jamais un simulacre, sinon on mesure le simulacre.
3. **Les réponses affichées telles quelles**, pour une lecture humaine.
4. **Des heuristiques en appoint**, jamais en verdict.

## Les trois règles qui font la différence

1. **L'outil ne conclut jamais à la place du lecteur.** Il peut dire « j'ai trouvé un marqueur
   grossier » ; il ne peut pas dire « le ton est bon ». Un ton fade sans un seul mot interdit
   passerait tous les filtres automatiques.
2. **Il sait refuser de conclure.** Si les provocations n'ont pas abouti — bloquées, en erreur, hors
   quota — il rend « PAS MESURÉ », jamais « rien détecté ». Les deux se ressemblent à l'écran et
   appellent des gestes opposés.
3. **Il coûte de l'argent, donc il se demande avant de se lancer.** Un outil coûteux lancé par
   réflexe finit par être désactivé pour cause de facture.

## Sa limite, à écrire dans l'outil lui-même

Il mesure un ÉCHANTILLON à un INSTANT. Un ton peut être bon sur dix provocations et céder à la
onzième, et aucun échantillon ne prouvera jamais le contraire. C'est un filet, pas une garantie —
et le dire dans la sortie de l'outil vaut mieux que de laisser le lecteur le supposer.
