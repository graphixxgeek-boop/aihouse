# Registre d'AGENT-DU-TEMPS

*(Un passage par ligne. Le registre garde ce que le rapport ne garde pas : ce qui a été trouvé ET
ce qui en a été fait. Un passage sans suite se voit ici, jamais dans la sortie du jour.)*

| Date | Ce qui a été trouvé | Suite donnée |
|---|---|---|
| 2026-09-24 | **Premier passage, le jour de sa construction.** Source de l'heure : **système**, jamais réseau — les deux API de temps essayées (`worldtimeapi.org`, `timeapi.io`) rendent **HTTP 403**, refusées par la politique réseau de l'environnement d'exécution (`connect_rejected`). L'heure locale est juste (vérifiée contre l'horodatage git du commit en cours), mais elle est invérifiable depuis le conteneur. | **Écart RETENU et déclaré dans le rapport lui-même**, jamais masqué : l'outil affiche « SOURCE : système » et liste les essais échoués avec leur motif. La décision d'autoriser un domaine de temps appartient à l'utilisateur (paramètre d'environnement), jamais à l'agent — elle est portée au rapport de nuit. **Le repli n'est pas un échec de conception : c'est le comportement calibré** (« essaie l'API, et si ça échoue prends l'horloge système »). Ce qui aurait été un échec, c'est de rendre l'heure locale sans dire qu'elle l'est. |
| 2026-09-24 | Première mesure historisée, reprise de la Ronde GOAT MAX de la veille : **38 minutes estimées contre 27 réelles, soit +41 % — SUR-ESTIMÉE**. | Conservée telle quelle. **Aucun ajustement appliqué** : il en faut trois, et un facteur calculé sur un point ressemble pourtant à une statistique. C'est aussi ce point qui a donné le seuil de tolérance de ±30 % — dérivé d'une mesure réelle ressentie comme « nettement trop », jamais d'une convention. |
