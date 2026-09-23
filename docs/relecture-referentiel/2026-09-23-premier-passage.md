# Relecture périodique de l'Article 13 — premier passage (2026-09-23)

Tâche #556. Premier rapport depuis la création de la Ronde : jusqu'ici, l'étape existait dans
`CIRCLE_ITEMS` et n'avait jamais rien écrit.

## Ce qui a été vérifié mécaniquement

**1136 chemins de fichiers** cités par les 49 fiches de `docs/referentiel/`, par `CLAUDE.md`,
`docs/regles-de-travail.md`, `docs/systeme-de-suivi.md` et `docs/philosophie-et-politique.md`.
La question posée est étroite et vérifiable : **ce document cite-t-il un fichier qui n'est pas sur
le disque ?**

## Les trois mensonges trouvés, et ils étaient tous réels

**1. La charte promet un document de contexte qui n'a jamais été committé.**
`CLAUDE.md` présentait `historique-prompts-codex.txt` comme disponible dans
`docs/contexte-projet/`, « utile pour comprendre pourquoi une décision de conception a été prise ».
Il n'y est pas, et l'historique git entier ne le contient à aucun commit. Les trois autres fichiers
de ce dossier sont bien là, ce qui rend l'absence d'autant plus invisible.
C'est le plus grave des trois : une IA qui reprend le projet suit cette piste et ne trouve rien.
**TRANCHÉ LE JOUR MÊME par l'utilisateur**, à qui la question a été posée : il possède encore le
fichier, et il a choisi de **retirer la ligne** plutôt que de l'ajouter — « je ne pense pas que ce
soit encore utile ». Le jugement se tient : ce que ce document aurait apporté, le pourquoi d'une
décision de conception, est aujourd'hui porté par `docs/referentiel/` et `docs/suivi/`, qui eux sont
tenus à jour. La charte garde une note expliquant le retrait, pour qu'un futur audit ne reparte pas
chercher ce fichier.

**2. TOOL-LEARNING annonçait son journal sous un chemin qui n'a jamais existé.**
Sa fiche disait `docs/tool-learning/xp-remontees.json`. Le code écrit `.xp-remontees.json`, à la
racine, en journal local jamais committé. Un lecteur cherchant à comprendre d'où viennent les
chiffres de remontées cherchait au mauvais endroit. **Corrigé**, avec le vrai chemin et sa nature.

**3. Une fiche renommée la veille était encore citée sous son ancien nom.**
`docs/regles-de-travail.md` pointait vers `docs/referentiel/memento.md`, disparue avec le renommage
de la tâche #172 (memory-audit / memento weight). Un jour d'écart a suffi. **Corrigé.**

## Ce que ce passage NE dit pas, et il faut le lire

Le vert mécanique porte sur **les chemins**, jamais sur **le sens**. Qu'aucun document ne cite un
fichier disparu ne dit rien de la question que l'Article 13 pose vraiment : *une règle décrite
ici est-elle encore celle que le code applique ?* Cette moitié-là demande de relire la prose contre
le code, elle coûte cher en tokens, et elle n'a pas été faite dans ce passage. Le dire vaut mieux
que de laisser le tableau de l'index passer pour un quitus.

## Les trois exclusions, et pourquoi elles ne sont pas des trous

Le détecteur se tait sur trois formes, toutes vérifiées par un test :

- **un exemple de gabarit** (`docs/X-blueprint.md`) ne désigne aucun fichier ;
- **un chemin dans une proposition** (« un document séparé allégerait la charte ») décrit ce qui
  n'existe pas encore, volontairement ;
- **une absence DÉCLARÉE** : un document qui cite un chemin absent en disant qu'il est absent fait
  exactement ce que l'Article 27 demande. Ces trois-là sont comptés à part, jamais ignorés — trois
  états, jamais deux.

Sans ces exclusions, ce garde-fou serait rouge à vie sur des phrases parfaitement justes, et un
garde-fou qui accuse à tort cesse d'être lu (leçon L4).

## Plan d'action

- **RETENU** — les trois chemins morts : corrigés dans le même passage, rien à reporter.
- **RETENU** — la moitié « le sens, pas le chemin » n'est pas couverte : c'est la tâche #585
  (exigences X6/X7 du domaine code, que personne ne vérifie), déjà inscrite au suivi.
- **TRANCHÉ** — le fichier `historique-prompts-codex.txt` : l'utilisateur l'a encore, et a choisi de
  retirer la ligne. Fait le jour même, avec une note de retrait dans la charte plutôt qu'une
  suppression muette : une IA qui reprend le projet doit savoir que ce document a existé, qu'il n'a
  jamais été versionné, et que son rôle est repris ailleurs.
