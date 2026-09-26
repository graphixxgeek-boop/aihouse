# Registre — gemini-key-health

**Ce qu'on note ici** : ce que la mémoire des clés a réellement appris — c'est le seul outil du
paysage dont la valeur CROÎT avec l'usage, donc le seul dont le registre est un actif plutôt qu'une
trace.

| Date | Ce qu'il a trouvé | Ce qui en a découlé |
|---|---|---|
| 2026-09-18 | **Le fait établi qui gouverne tout le reste** : le quota est journalier, par MODÈLE et par PROJET — pas par clé. Deux clés d'un même projet Google partagent donc le même quota, et en ajouter une seconde ne donne rien. | Vérifier qu'une clé de repli vient bien d'un projet DISTINCT avant de l'ajouter, en la sondant. Écrit dans la procédure de l'Article 22, étape 3 — sinon on croit avoir doublé sa réserve. |
| 2026-09-18 | Une variable d'environnement posée dans le shell **n'est PAS prise en compte** par le runtime en mode développement : seul le fichier de configuration lu au démarrage compte. Confirmé empiriquement, après avoir cru à un problème de clé. | Étape 4 de la procédure : redémarrer le serveur, et vérifier qu'aucun processus orphelin ne survit à l'arrêt précédent (son nom diffère de celui qu'on cherche, et il garde le port). |
| — | **La propriété qui le rend unique** : plus il est utilisé, plus sa connaissance s'affine. Corollaire à ne jamais oublier : ne pas purger son historique pour « faire propre » — la donnée ancienne est ce qui distingue réagir d'anticiper. | Écrit ici plutôt que supposé. |
| 2026-09-26 | Kit d'export : plan, fiche et registre manquaient. | Ce fichier et ses deux voisins. |
