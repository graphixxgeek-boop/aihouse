# Process autonome — travailler seul pendant l'absence de l'utilisateur

*(Formalisé le 2026-09-22, à la demande explicite de l'utilisateur : « formalise le process
"autonome" dans lequel je t'ai demandé de rentrer cette nuit ». Chaque règle ci-dessous a été
calibrée avec lui le jour même, à la lumière des deux nuits autonomes déjà vécues — jamais une règle
inventée pour faire nombre. Surveillé par `scripts/god-of-all-process.mjs`, process `nuit`.)*

## Pourquoi ce document existe

Deux fois de suite, l'utilisateur m'a confié une nuit entière de travail autonome. Les deux fois,
j'ai dû lui poser au dernier moment les mêmes questions avant qu'il aille dormir — notamment ce que
« sensible » voulait dire exactement. Ce document existe pour que ces questions ne se reposent
jamais : elles ont une réponse, elle est écrite ici.

Ce n'est pas un protocole de plus à côté des autres. C'est le cadre DANS lequel les autres process
s'exécutent quand personne ne regarde. En cas de tension avec un autre process, voir la section
« Tensions » plus bas — elles sont déclarées et résolues, jamais laissées à l'improvisation du
moment.

## Ce que l'utilisateur donne au départ

Un plan numéroté, dans son ordre à lui. Le plan **se suit dans cet ordre**, sans en sauter une
étape, sans en réordonner une de sa propre initiative — même quand une étape plus loin paraît plus
urgente. Si une étape se révèle impossible, elle est dite comme telle dans le rapport, avec sa
raison ; jamais silencieusement remplacée par autre chose.

## Les bornes — ce qui ne se fait jamais sans validation

### Le périmètre sensible (défini par l'utilisateur, 2026-09-22)

Est **sensible**, donc mis de côté pour validation :

1. **Tout ce qui change ce que Lia et Noé disent ou font** — registre, personnalité, rythme de
   dialogue, seuils émotionnels. C'est l'Article 0, la loi suprême : on ne touche pas à l'esprit des
   personnages pendant que son créateur dort.
2. **Tout ce que voit le visiteur** — interface, rendu, enchaînement à l'écran.
3. **Tout ce qui serait difficile à annuler**, quel que soit le domaine.

N'est **pas** sensible, donc libre : l'outillage de travail, la documentation, le référentiel, les
tests, les garde-fous mécaniques.

**Consommer de l'API Gemini est explicitement autorisé** pendant une nuit autonome — à condition de
respecter Smart Conso API (Article 22), qui reste consultée avant chaque action coûteuse. L'autorisation
porte sur le fait de consommer, jamais sur le fait de sauter la consultation.

### Une borne peut aussi être posée à la main

L'utilisateur peut nommer une frontière supplémentaire pour la nuit (« tu t'arrêtes à la borne :
refonte graphique »). Elle s'ajoute au périmètre sensible, elle ne le remplace pas, et elle vaut pour
tout ce qui en dépend — pas seulement pour la tâche qui porte ce nom.

## Que faire quand on bute sur le périmètre sensible

C'est le cas le plus fréquent et le plus frustrant : un vrai défaut, clairement identifié, qu'on
n'a pas le droit de corriger. **Règle calibrée le 2026-09-22 : on prépare tout, sauf l'application.**

Concrètement : écrire la correction, ses tests, sa documentation, vérifier que tout passe — mais sur
une branche séparée que rien n'utilise. Au réveil, l'utilisateur lit un résultat fini et répond oui
ou non en une minute, au lieu de devoir tout relancer depuis zéro.

Le coût assumé de cette règle : du travail jeté si la réponse est non. C'est un coût accepté, pas un
oubli.

Ce qui reste interdit dans tous les cas : appliquer la correction sur la branche de travail, même
« juste pour voir », même en prévoyant de l'annuler.

## Si le plan est terminé avant la fin de la nuit

On pioche dans les tâches ouvertes **non sensibles**, et on le dit clairement dans le rapport. Le
temps de machine ne se gaspille pas, mais l'utilisateur doit pouvoir lire exactement ce qu'on s'est
autorisé sans qu'il l'ait demandé.

## Le rendu au réveil

**Un fichier texte** dans `docs/rapports-de-nuit/`, nommé par la date, qui raconte ce qui s'est
passé — jamais un pavé dans la conversation.

**Plus cinq lignes dans la conversation** : ce qui a bougé, ce qui attend une décision. L'utilisateur
doit voir s'il y a urgence sans ouvrir le fichier.

Le rapport de nuit dit, dans l'ordre : ce qui a été fait, ce qui a été trouvé, **ce qui a été mis de
côté et pourquoi**, et ce qui attend une décision. Cette troisième partie n'est jamais optionnelle :
c'est elle qui justifie la suivante.

## Les obligations qui ne s'allègent jamais la nuit

Aucune règle de la charte ne se relâche parce que personne ne regarde. En particulier :

- **Le suivi** (`docs/suivi/`) se met à jour dans le même commit que le travail qu'il décrit.
- **Le filet de sécurité** (`check-house.mjs`) tourne avant chaque commit, jamais après coup.
- **Article 19** : on comprend avant de toucher, y compris à 3h du matin.
- **Article 13** : un changement de comportement se reflète le jour même dans la documentation.
- **Les pousses se font au fil de l'eau**, jamais accumulées jusqu'au matin — une session peut être
  interrompue à tout moment, et ce qui n'est pas poussé n'existe pas.

## Tensions avec les autres process

Déclarées et résolues dans `scripts/god-of-all-process.mjs` (`TENSIONS_CONNUES`), jamais tranchées
au cas par cas dans l'urgence :

- **avec le protocole de simulation** : l'autorisation nocturne de consommer de l'API ne dispense
  jamais de consulter Smart Conso API avant.
- **avec la Ronde** : une Ronde lancée en nuit autonome est dispensée de la fenêtre à cocher, faute
  d'interlocuteur — exemption déjà codée dans son gardien, jamais une entorse improvisée.

## Ce que ce process ne sait pas encore faire

Honnêtement : trois de ses cinq étapes ne laissent aucune trace vérifiable sur le disque (suivre le
plan dans l'ordre, respecter le périmètre sensible, préparer sans appliquer). `god-of-all-process`
les déclare comme telles plutôt que de les compter faites. Leur respect repose aujourd'hui sur la
discipline seule — c'est une limite réelle, pas une omission.

## Les fichiers d'état du mode autonome (inscrits le 2026-09-23)

*Ajoutés au moment où `findMecanismesAbsentsDuProcess()` (`scripts/god-of-all-process.mjs`) les a
signalés absents de ce document — application de la règle posée le même jour : « inscris tout ce que
tu fais en lien avec le process, dans le process ». Ils étaient invoqués par les sondes du process
sans qu'aucune ligne d'ici ne dise ce qu'ils sont.*

- **`.agent-session.json`** — l'identité de la session en cours (modèle, horodatage). Sans elle,
  chaque rapport produit pendant la nuit porte un trou à la place de « qui a fait ça ». C'est la
  preuve de l'étape `identite` du process maître. Jamais committé.
- **`.circle-tasks-last-run.json`** — le commit de la dernière Ronde clôturée. Le mode autonome le
  lit pour savoir si une Ronde est due, et l'écrit s'il en lance une (via `record-run --autonome`,
  qui passe toujours : aucune ouverture n'est exigée sans personne à qui poser les questions).
- **`.circle-tasks-run-summary-latest.txt`** — le récapitulatif texte de la dernière Ronde,
  régénéré à chaque passage. Fichier de travail local, jamais committé ; le registre durable vit
  dans les artefacts datés de chaque item.
