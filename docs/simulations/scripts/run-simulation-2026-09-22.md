# `scripts/run-simulation.mjs` — le pilote de simulation intégrale

*Fiche écrite le 2026-09-23. Le script, lui, a été committé le 2026-09-22 (tâche #356) et amendé
deux fois depuis. Cette fiche existe parce que le registre qui devait la contenir ne contenait que
son propre index — et que l'étape « rédiger le script selon la norme » passait pour tracée à cause
de cet index. Une preuve qu'un registre vide satisfait ne prouve rien (leçon L13).*

## Ce que ce script est, et ce qu'il n'est pas

Il joue une partie entière contre le serveur de développement et écrit ce qui s'est dit. **Il ne
juge rien et ne corrige rien** : l'analyse reste EL-PROFESSOR puis l'agent.

## Pourquoi il existe

L'étape 1 du protocole disait « lancer LE script de simulation intégrale », et aucun script de ce
nom n'avait jamais été committé : il était réécrit à la volée dans un dossier temporaire à chaque
fois, puis perdu avec la session. Dix-sept simulations archivées, zéro pilote conservé.

Conséquence concrète, et c'est elle qui a motivé la construction : **deux simulations successives
n'étaient jamais strictement comparables**, puisque le scénario de phase 2 était retapé de mémoire.
Un écart entre deux parties pouvait venir du code comme du scénario, sans moyen de trancher.

## La norme qu'il respecte, telle qu'elle a été calibrée

- **Scénario de phase 2 FIXE et committé.** C'est tout l'intérêt du fichier : deux simulations
  exercent exactement les mêmes paliers, donc leurs écarts viennent du code, jamais du scénario.
  Chaque message vise un palier précis de la charte, nommé en commentaire à côté.
- **Rythme réel respecté, jamais contourné.** Le serveur refuse un tour autonome moins de 20 s après
  le précédent (garde-fou voulu par l'utilisateur). Le script l'attend au lieu de le contourner :
  contourner un garde-fou de rythme reviendrait à mesurer une partie que personne ne jouera jamais.
- **Un tour autonome intercalé un message humain sur deux.** Assez pour armer le piège du dossier
  retourné, pas assez pour rallonger la phase 2 de sept minutes.
- **Trois tirages de bonus répartis**, jamais groupés, pour exercer la rejouabilité (Article 9) dans
  des états émotionnels différents.

## Les trois amendements depuis sa création, et ce que chacun a coûté

1. **2026-09-23 — le tour autonome intercalé** (`doitIntercalerUnTourAutonome`). Sans lui, la
   phase 2 enchaînait 17 tours humains et zéro tour autonome, et le piège du dossier retourné était
   structurellement hors d'atteinte. Le défaut était passé **trois** simulations de suite.
2. **2026-09-23 — le garde d'entrée.** Le fichier lançait une VRAIE partie dès qu'on l'importait :
   la suite de tests, en important une seule fonction, a réinitialisé la maison puis s'est arrêtée
   faute de serveur. **Un module qui agit à l'import ne peut pas être testé — et c'est exactement
   pour ça qu'il n'avait aucun test, donc exactement pour ça que le défaut n° 1 a survécu trois
   fois.** Les deux faits ne sont pas côte à côte par hasard : l'un produit l'autre.
3. **2026-09-23 — la photo de mémoire à chaque tour** (décision de l'utilisateur, contre ma
   recommandation d'une version minimale début/fin). Le script tend l'état de mémoire à
   memory-audit après chaque tour. **La mécanique vit dans memory-audit, jamais ici**, en
   application directe de la leçon ci-dessus : ce fichier ne peut pas être testé sans serveur, donc
   tout ce qu'on y met devient non testable.

## Ce qu'il produit

| Fichier | Contenu |
|---|---|
| `<nom>_transcript.txt` | la conversation complète, telle qu'un lecteur la verrait |
| `<nom>_dossier.txt` | le dossier retourné, ou la mention explicite qu'il n'y en a pas eu |
| `<nom>_journal.json` | chaque requête, son statut, son round — brut, jeté après résumé |
| `<nom>_memory-audit.txt` | le suivi de mémoire tour par tour (depuis l'amendement 3) |
| `<nom>_progress.log` | l'avancement en direct |

Et, dans le registre de memory-audit, un fichier de constat daté — celui qui prouve vraiment que
l'étape de contrôle mémoire a eu lieu.
