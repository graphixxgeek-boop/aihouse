# tool-usage — fiche d'instanciation

## Ce qu'il sert ici

`scripts/tool-usage.mjs` (tâche #166, 2026-09-21) : le compteur d'usage réel des outils de l'Agence.
Cumul **permanent** depuis le début du projet, jamais remis à zéro par session. Il nourrit
CASSANDRA-RH pour juger si un outil a toujours sa place.

## L'honnêteté déjà actée, et réutilisée à l'identique de SMART-CONSO-TOKEN

C'est un **journal auto-déclaré par l'agent lui-même**, jamais vérifiable mécaniquement : aucune
trace externe indépendante ne prouve qu'un outil a été sollicité. La discipline « solliciter les
outils » repose donc sur une obligation écrite, pas sur une mesure.

## Le défaut réel que cette limite a produit ici

Le 2026-09-26, `sauvegarde-projet` venait d'entrer au catalogue : le compteur s'est mis à le
regarder et le **verrou d'ouverture de Ronde a refusé** — il a une ligne de commande et
n'enregistrait rien. Son zéro ne disait pas « personne ne sauvegarde », il disait « personne ne
compte ». Corrigé à la source le jour même.

## Qui ferme cette faille ici

`tool-brain muets` (tâche #778) repère les outils qui ont une commande et n'appellent jamais
`recordCliUsage`, et le **verrou d'ouverture de Ronde** empêche une Ronde de démarrer tant qu'il en
reste un — sa décision du 2026-09-26 : « bloquer la Ronde, pas le commit ».

## Sa limite ici

Le journal n'est pas commité (`.tool-usage-history.json`) : il décrit l'usage sur CETTE machine.
Un export emporte le compteur, jamais son historique.
