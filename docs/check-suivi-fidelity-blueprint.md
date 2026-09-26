# Blueprint générique — le garde-fou d'un système de suivi

*(Réutilisable sur tout projet qui tient un journal de tâches en fichiers texte. Instanciation ici :
`docs/referentiel/check-suivi-fidelity.md`.)*

## Le problème qu'il résout

Un suivi de tâches se dégrade toujours par le même bout : **la clôture**. Ouvrir une tâche est
motivant, la fermer est une corvée — alors on écrit « terminé » et on passe. Six mois plus tard,
plus personne ne sait lesquelles ont été faites comme demandé, et le journal ne vaut plus rien.

## Le principe : une clôture doit RÉPONDRE, pas seulement exister

Trois états, jamais deux : **fidèle** (fait comme demandé), **écart** (fait autrement, et la raison
est écrite), **ouverte**. Un « terminé » nu est refusé, parce qu'il ressemble à une réponse sans en
être une.

## Les quatre contrôles, et pourquoi chacun compte

1. **La clôture déclare sa fidélité.** Le cœur.
2. **Un fichier annoncé existe vraiment.** Une ligne qui cite un livrable absent est pire qu'une
   ligne vide : elle ressemble à une preuve.
3. **Un commit substantiel a sa ligne.** Sans ça, le journal raconte une histoire plus propre que
   ce qui s'est passé — et l'écart grandit en silence.
4. **Aucun horodatage dans le futur.** Une date tapée de mémoire dérive toujours vers l'avant, et un
   âge négatif se lit comme « tout frais » au lieu de déclencher une alerte. C'est le contrôle le
   plus humble de la liste et celui qui mord le plus souvent.

## La limite, à déclarer

Il vérifie qu'une clôture DÉCLARE sa fidélité ; il ne peut jamais vérifier que la déclaration est
vraie. Confondre les deux donnerait un système qui certifie ce qu'il n'a pas lu — et un journal
faussement certifié est plus dangereux qu'un journal négligé, parce qu'on cesse de s'en méfier.
