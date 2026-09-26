# THE-GHOST — plan générique : l'orchestrateur du mode autonome

*(Blueprint réutilisable. Instanciation : `docs/referentiel/the-ghost.md`.)*

## Ce qu'il est, et la frontière qui le définit

Quand une personne laisse un agent travailler seul (la nuit, ou pendant une absence), deux choses
sont nécessaires et une seule est nouvelle :

| Ce qu'il faut | Qui le porte |
|---|---|
| juger quelles tâches faire et dans quel ordre | l'outil TRANSVERSE d'organisation des tâches, utilisable à tout moment |
| le rituel d'entrée et de sortie, et le rythme de LA SESSION en cours | **celui-ci, et lui seul** |

**Il ne réimplémente RIEN du jugement : il l'appelle.** C'est la frontière entière, et elle doit être
écrite, parce que la tentation naturelle est d'en faire un second ordonnanceur — qui divergerait du
premier au premier changement.

## Les trois signaux propres à la session, et pourquoi eux

Aucun n'existait ailleurs sous forme calculée :

1. **Depuis quand la session dure-t-elle ?** Une session qui s'allonge dégrade le jugement sans que
   rien ne le signale.
2. **Combien de tâches enchaînées ?** Le nombre dit s'il y a eu progression réelle ou piétinement.
3. **Depuis quand aucune ronde de vérification n'a tourné ?** Le seul des trois à être réutilisé
   plutôt que recalculé — jamais un second calcul divergent.

## Le rituel, et pourquoi il n'est pas décoratif

Une session autonome sans entrée ni sortie déclarées ne laisse aucun moyen de savoir **ce qu'elle
couvrait**. Le rituel d'entrée fixe le périmètre ; celui de sortie dit ce qui a été fait et ce qui
reste. Sans les deux, un rapport de progression ressemble à un bilan — alors que c'est une session
qui s'arrête.

## Le piège structurel du mode autonome : le rapport d'étape

**En mode autonome, un rapport d'étape n'est pas un livrable : c'est une nuit qui s'arrête.** Et il
est particulièrement dangereux parce qu'il RESSEMBLE à du travail sérieux — écrit, honnête, souvent
bien fait. C'est exactement ce qui donne à l'interruption un air de rigueur.

Personne n'est là pour dire « continue ». Le mécanisme doit donc l'écrire.

## Sa limite honnête

Il orchestre un rythme ; il ne juge ni la qualité du travail ni la pertinence des tâches. Ces deux
jugements appartiennent à d'autres, et les lui donner ferait de lui le seul juge d'une nuit que
personne ne regarde.
