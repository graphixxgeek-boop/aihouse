# Registre — report-template (le gabarit unifié des rapports)

**Ce qu'on note ici, et pourquoi ce registre n'est pas vide de sens alors que l'outil est une
bibliothèque.** report-template n'a pas de ligne de commande : personne ne le « lance ». Mais il
DÉPOSE un état que tous les rapports relisent (`.agent-session.json`, l'identité de l'agent qui a
produit le rapport), et chaque défaut de ce dépôt s'est payé sur trente rapports à la fois. C'est
cette mémoire-là qu'il emporte.

| Date | Ce qu'il a trouvé | Ce qui en a découlé |
|---|---|---|
| 2026-09-22 | **L'asymétrie qui l'a fait naître, mesurée avant d'écrire une ligne** : les rapports HTML partageaient déjà un contrat unique (`title`/`subtitle`/`dateLabel`/`blocks`/`footer`), les rapports TEXTE n'en avaient AUCUN — chaque outil improvisait son en-tête et son ordre. | Création du gabarit unique : une seule définition de ce qu'EST un rapport, deux rendus qui la consomment. L'emplacement générique (`slots`) évite de repasser sur trente scripts à la prochaine phrase transverse. |
| 2026-09-22 | **La phrase de fiabilité avait dû être insérée À LA MAIN dans 28 fichiers**, faute d'un endroit prévu pour elle. | Premier locataire de `slots` : `TOOL_RELIABILITY`. Une mention légale ou un rappel de contexte s'y ajouteraient sans toucher un seul outil. |
| 2026-09-24 | **UN FICHIER DÉPOSÉ QUI NE CONTIENT RIEN EST PIRE QU'UN FICHIER ABSENT.** `recordAgentSession()` acceptait `model: null` sans broncher : le fichier existait, l'étape du process paraissait faite, et chaque rapport de la nuit aurait porté « Version de Claude : non renseignée » avec tout en ordre en apparence. L'absence se voit ; le vide se déguise en présence. | `model` devient obligatoire — **et les clés INCONNUES sont refusées aussi**, parce que la cause réelle était une faute d'orthographe sur un nom de clé, pas un oubli. Un appelant qui se trompe l'apprend tout de suite. |
| 2026-09-26 | Kit d'export : sa pièce « registre » manquait. Il écrit un état persistant, donc il a bien une mémoire à emporter — la rédaction de ce registre est ce qui a permis de la relire d'un bloc. | Ce fichier. |
