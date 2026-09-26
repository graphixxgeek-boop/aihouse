# check-house — fiche d'instanciation

## Ce qu'il sert ici

`scripts/check-house.mjs` (14 869 lignes au 2026-09-26, 266 blocs `Passed:`) : le filet de sécurité
du projet. Branché au crochet **pre-commit**, il refuse le commit quand il échoue.

## Pourquoi il est VITAL ici, au sens de la vitalité de l'Agence

C'est le seul mécanisme du dépôt qui peut **empêcher** quelque chose. Tous les autres signalent.
Sans lui, chaque garde-fou de ce paysage redevient une intention : il continuerait de trouver, et
plus rien ne forcerait à en tenir compte.

## Ce qu'il couvre, et ce n'est pas seulement du code

Trois familles, et la troisième est celle qu'on n'attend pas dans un fichier de tests :

1. **Le moteur du jeu** — besoins, sommeil, jour/nuit, arc relationnel, refus de la roulette, mémoire.
2. **L'outillage de l'Agence** — chaque garde-fou de chaque outil, avec ses contre-tests dans les
   deux sens.
3. **Les DÉCISIONS de l'utilisateur** — un arbitrage tranché en conversation devient une assertion,
   sans quoi il disparaît à la session suivante (Article 27). C'est ce qui rend ce fichier lisible
   comme une mémoire plutôt que comme une suite de tests.

## La convention de message, propre à ce projet

Chaque assertion porte la DATE, le défaut réel, et ce qu'il a coûté. Les messages sont longs, et
c'est délibéré : ils sont lus au seul moment où ils servent, c'est-à-dire quand le test casse. Le
bloc `console.log('Passed: …')` qui clôt chaque section joue le même rôle en positif — il raconte ce
que la section protège.

## Les comptes figés, et leur garde-fou

Deux assertions citent le nombre d'items de la Ronde. Elles refusent le commit dès qu'un item est
ajouté ou retiré — c'est voulu (l'ajout muet est le défaut) — et
`findStaleItemCountReferences()` (circle-process-guardian) détecte en plus les références périmées à
ce nombre ailleurs dans le dépôt.

## Ce qu'il a réellement attrapé, et qui n'aurait été vu par personne

- Le lanceur `main()` placé AVANT des constantes de niveau module (zone morte temporelle) :
  **quatre outils** l'ont payé, dont trois le même jour.
- Un horodatage daté dans le futur, tapé de mémoire au lieu d'être lu : **cinq commits refusés** le
  2026-09-24, à l'origine de l'Article 32.
- Une famille d'outil déduite au lieu d'être lue dans l'organigramme.
- Un registre créé sans être couvert par la Ronde — à la seconde où le fichier arrive sur le disque.

## Pourquoi il n'a PAS d'item de Ronde

Il tourne à chaque commit et bloque. Un item périodique demandant « et si on lançait les tests ? »
arriverait toujours après des dizaines de passages déjà faits. Exclusion écrite dans
`CIRCLE_AUTO_COVERED_REGISTRIES`.

## Sa limite ici

Il vérifie ce qu'on a pensé à lui faire vérifier. C'est **AXA-CHECK** qui juge la couverture réelle
par fonction, jamais lui — et la distinction est nette : ce fichier dit « ce que je vérifie
passe », AXA-CHECK dit « voilà ce que personne ne vérifie ».
