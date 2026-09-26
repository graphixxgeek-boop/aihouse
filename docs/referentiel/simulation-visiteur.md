# simulation-visiteur — fiche d'instanciation

## Ce qu'il sert ici

`scripts/simulation-visiteur.mjs` (2026-09-22) : le visiteur scripté qui dialogue avec Lia et Noé
pendant une simulation intégrale. **Conception complète dans
`docs/simulation-visiteur-conception.md` — onze décisions calibrées avec l'utilisateur avant la
première ligne de code.**

## Pourquoi un module séparé de `run-simulation.mjs`

Une simulation coûte **une heure de quota réel**. Un visiteur qui vit dans le script de lancement ne
se teste qu'en le lançant — donc jamais, donc ses défauts ne se découvrent que dans le transcript,
après la dépense.

Ici tout se vérifie à sec : l'arc, le ciblage, la couverture des paliers, le rattrapage.

## Ce qu'il remplace, et les deux défauts confirmés sur pièces

L'ancien dispositif était une liste plate de 20 messages identiques envoyés aux deux personnages.
Deux défauts, confirmés dans `full_sim18_transcript.txt` :

1. **Aucune personnalité derrière les provocations** — rien ne reliait le message 8 au 12, donc le
   visiteur n'était personne. Or les personnages doivent réagir à QUELQU'UN (Article 17).
2. **Les mêmes messages pour les deux** — impossible de voir la différence de traitement entre Lia
   et Noé, qui est précisément ce que l'Article 11 exige et ce qu'on veut observer.

## Ce qu'il sert à mesurer ici

Le registre des personnages face à la provocation : les limites hautes de l'Article 0 (colère
réelle, silence méprisant propre à Lia, repartie systématique de Noé, sortie méta), qui ne se
vérifient que sous pression réelle.

## Sa limite ici

Il garantit que les provocations partent et qu'elles tiennent debout comme un personnage. Ce qu'elles
ont produit se lit avec EL-PROFESSOR puis à la main — jamais ici.
