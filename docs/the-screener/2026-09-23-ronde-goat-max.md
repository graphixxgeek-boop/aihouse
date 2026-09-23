# THE-SCREENER — notation de l'état initial (Ronde GOAT MAX, 2026-09-23)

*(Capture : `test-capture-1790199357589.png`, prise sur le serveur de dev à l'état initial —
JAMAIS une simulation lancée pour l'occasion, ce que la règle de cet outil interdit explicitement.
C'est donc exactement l'écran que voit un visiteur qui arrive : le seul état dont on puisse dire
qu'il est vu par tout le monde.)*

## Verdict en une phrase

**L'esprit tient dans le dialogue et s'effondre dans le cadre qui l'entoure** — les deux répliques
visibles à l'écran sont parfaitement dans le registre, et tout ce qui les encadre (l'accroche, la
palette) appartient à un autre projet.

## Ce qui est RÉUSSI, et il faut le dire en premier

**Les répliques affichées sont exactement l'Article 0**, sans la moindre concession :

> **Noé · pensée** — « Bon, apparemment je me tais maintenant. Génial. »
> **Lia · pensée** — « Le silence te va plutôt bien, en fait. Continue comme ça. »

Noé encaisse en râlant, Lia enfonce froidement. Deux voix distinctes, aucun ton de service, aucune
politesse. C'est la chose difficile du projet, et elle est là, visible à l'écran sans avoir à jouer.

## Ce qui CONTREDIT l'Article 0 — l'accroche

> « Deux inconnus. Une maison. Qui sont-ils vraiment ? »
> « Une sensation étrange. Une rencontre. **Un mystère à reconstruire ensemble.** »

**« ensemble » est le mot qui casse tout.** Il promet une collaboration chaleureuse avec le
visiteur — or Lia et Noé ne collaborent pas : ils contestent, refusent, répliquent avec mépris. La
première phrase du site annonce l'exact inverse de ce que le produit délivre trente secondes plus
tard. « Une rencontre » et « une sensation étrange » relèvent du même registre doux : mesuré, poli,
distant — et la charte dit noir sur blanc qu'un ton mesuré et poli n'est jamais un indice de
qualité ici, c'est un **signal d'alerte**.

Ce n'est pas un détail de communication : c'est **la première chose que lit le visiteur**, et elle
gouverne ce qu'il attend. Un visiteur à qui on a promis « ensemble » lira la première pique de Lia
comme un bug, pas comme l'intention.

## Ce qui CONTREDIT `regles-des-graphismes.md` — la palette

La scène rend en **couleurs vives et saturées** : pelouse vert franc, chambres violet/magenta,
pièces bleu soutenu, sol crème. L'ensemble évoque un plan d'appartement de jeu de gestion enjoué —
pas la « dystopie façon série futuriste où l'insolite s'installe progressivement » que la charte
décrit.

**Et c'est un écart entre le code et le rendu, pas une absence de décision** : la désaturation EST
codée (`lib/perception.ts`). Ce qui la détruit se situe en aval, au rendu — hypothèse de
THE-FINAL-JUDGE à vérifier : un éclairage cumulé trop fort dans `components/house-view.tsx`, plus
des matériaux non éclairés qui ignorent la lumière et rendent donc leur couleur brute.

Autrement dit : **personne n'a choisi ces couleurs. Elles sont ce qui reste quand l'intention est
écrasée en chemin.** C'est le pire des trois cas possibles (choix assumé / choix oublié / intention
écrasée), parce que rien dans le code ne dit qu'il y a un problème.

## Ce que cette capture ne dit PAS

Un seul état, un seul moment, aucune interaction. Elle ne dit rien du rendu en mode nuit, du
contraste jour/nuit décidé dans `regles-des-graphismes.md`, ni de l'animation des déplacements.
Deux captures ne résument pas un rendu — et une seule encore moins.

## Plan d'action

- **RETENU** — l'accroche contredit l'Article 0 → tâche **#236**.
- **RETENU** — la palette rendue contredit la désaturation codée → tâche **#237**.
- **ÉCARTÉ** — juger le mode nuit et les transitions : hors de portée d'une capture unique, et la
  refonte graphique est explicitement reportée par l'utilisateur (#92, #605). Raison écrite plutôt
  qu'omission.
