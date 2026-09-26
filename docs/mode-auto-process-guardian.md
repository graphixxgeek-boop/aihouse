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

**Ce que ce process existe pour empêcher**, formulé en défauts concrets plutôt qu'en intention —
les trois se sont réellement produits :

1. **La nuit part en questions au moment du coucher.** Deux fois de suite, les mêmes questions au
   dernier moment sur ce que « sensible » veut dire : du temps de travail perdu, et une fatigue
   imposée à quelqu'un qui allait dormir.
2. **L'agent s'arrête au milieu de la nuit** pour faire un compte rendu que personne ne lira avant
   le matin, et laisse des heures inutilisées. Arrivé une fois, coût réel important (voir « Le seuil
   d'arrêt » plus bas).
3. **Une zone sensible est touchée sans validation** parce que le périmètre n'était écrit nulle
   part et que l'agent, seul, a tranché à la place de l'utilisateur.

Ce document ferme les trois : le cadre est écrit avant la nuit, le seuil d'arrêt est unique et
explicite, et le périmètre sensible est nommé.

## LA PREMIÈRE QUESTION, AVANT TOUT LE RESTE : « avez-vous un gros prompt ? »

*(2026-09-26, sa demande le soir même : « inscris dans le process auto de nuit que la premiere
question doit etre : avez-vous un gros prompt ? [...] cette consigne doit etre ecrite dans les
process pour la prochaine fois ».)*

**Elle est née d'un cas réel, arrivé le jour où elle a été écrite.** Le plan de nuit venait d'être
arrêté, écrit, testé et poussé quand il a annoncé : « j'ai un gros prompt, j'aurais du te le donner
avant pour que tu t'organises, mais c'est pas grave : tu vas t'adapter ». Le plan était déjà figé
sur les mauvaises hypothèses.

**Pourquoi cette question passe avant l'identité de session, avant l'état des tâches, avant tout :
un gros prompt ne s'AJOUTE pas à un plan de nuit, il le RÉÉCRIT.** Le découvrir après coup coûte
l'organisation entière. Et ce n'est pas un oubli de sa part — c'est une question que l'agent
n'avait jamais posée.

**Ce qu'on fait de la réponse** :
- **Oui** → le **process GROS PROMPT** tourne D'ABORD (`scripts/rapport-gros-prompt.mjs`,
  registre `docs/rapports-gros-prompt/`), et le plan de nuit se construit AUTOUR de lui, jamais à
  côté. Les deux process ne se concurrencent pas : le gros prompt donne la matière, le process
  autonome donne les bornes et le seuil d'arrêt.
- **Non** → on enchaîne normalement sur l'identité de session.

Portée par `god-of-all-process.mjs`, étape `gros-prompt-dabord`, qui la place en tête de liste.

## LA CONFRONTATION AVANT / APRÈS — et le « avant » doit être FIGÉ

*(2026-09-26, sa demande du même soir : « verifie aussi que tu vas utiliser la confrontation des
listes des taches avant/apres comme prevu par les process. on en a deja parlé, ajoute ca aussi. »)*

**Le mécanisme existait déjà et n'était obligatoire nulle part.** `check-tasks-details bilan` sait
confronter une liste figée à l'état du jour ; mais rien n'imposait de FIGER la liste au départ, de
sorte que la confrontation du matin se faisait contre le plan d'une nuit antérieure — ou contre
rien. **Un avant/après sans « avant » n'est pas une mesure, c'est une impression**, et une
impression dira toujours que la nuit a été bonne.

Deux étapes, aux deux bouts de la nuit, et aucune ne se saute :

1. **Au départ** — figer la liste des tâches ouvertes dans
   `docs/rapports-de-nuit/plan-depart-AAAA-MM-JJ.txt`, une ligne par tâche au format `#NNN | …`.
   C'est ce fichier que l'outil ira chercher (le plus récent, trouvé plutôt que nommé en dur).
2. **Au matin, avant le seuil d'arrêt** — `node scripts/check-tasks-details.mjs bilan`, qui rend la
   soustraction : ce qui a été fermé, ce qui s'est ouvert, ce qui n'a pas bougé.

Portées par `god-of-all-process.mjs`, étapes `plan-depart-fige` et `confrontation`.

**Ce que la confrontation ne dit pas, et il faut le savoir en la lisant** : le compteur peut ne pas
baisser alors que le travail avance, parce qu'un chantier GÉNÈRE des tâches — une trouvaille non
suivie d'une tâche serait perdue (Article 28). Le nombre qui monte n'est donc pas un retard ; c'est
la chaîne qui tient. La confrontation sépare ces deux mouvements au lieu de les confondre dans un
solde net.

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

## Toute modification INDIRECTE d'un process se solde par une mise à jour DIRECTE de son document

*(2026-09-23, demande explicite de l'utilisateur : « ajoute que le process maître indique que toute
modification indirecte d'un process doit être suivie d'une mise à jour du process directement ».)*

**La distinction, et c'est elle qui fait tout le travail :**

- une modification **DIRECTE** touche le document du process — elle se voit, elle se relit ;
- une modification **INDIRECTE** touche le CODE qui fait vivre ce process : son contrôleur, un
  mécanisme qu'il invoque, un fichier qu'une de ses étapes déclare comme preuve.

**La seconde est la plus dangereuse, précisément parce qu'elle ne ressemble pas à un changement de
process.** On croit corriger un script ; en réalité on vient de déplacer une règle. Le document,
lui, continue de décrire un process qui n'existe plus tel quel — et le prochain agent (ou la
prochaine IA, cf. Article 27) le lira comme s'il était vrai.

**La preuve est du jour même, et elle est double.** J'ai construit le compteur de contributions et
ses quatre points de câblage sans rien inscrire, puis le schéma de référence des process sans rien
inscrire non plus. Dans les deux cas, c'est l'utilisateur qui a dû me rappeler à l'ordre
(« process à consigner et à consolider juste avant »). Deux fois en une journée n'est plus un
oubli, c'est un motif — et l'Article 3 dit quoi en faire.

**Le garde-fou** : `findChangementsIndirectsSansMiseAJour()` (`scripts/god-of-all-process.mjs`) lit
les commits récents et nomme ceux qui touchent le code d'un process sans toucher son document dans
le MÊME commit. Le même commit, et pas « dans la journée », pour la raison que le suivi applique
déjà : « je le ferai après » est la forme que prend l'oubli.

**Ses deux limites, déclarées plutôt que masquées :**
- il juge sur les fichiers d'un commit, donc un commit qui groupe plusieurs sujets élargit la
  fenêtre et peut laisser passer un cas ;
- `check-house.mjs` en est exclu : c'est le filet de sécurité de tout le dépôt, n'importe quel
  changement le touche, et le compter ferait crier ce contrôle à chaque commit — un contrôle qui
  crie toujours n'est plus lu.

**Premier passage réel : 5 écarts, tous les miens, tous du 2026-09-23.**

**IMPAYÉ ou RATTRAPÉ — la distinction ajoutée le soir même, et le défaut qui l'a rendue nécessaire.**
Le détecteur ne regardait que le commit fautif. Conséquence immédiate : quatre écarts trouvés à la
Ronde n°2, les quatre documents mis à jour dans l'heure — et il affichait toujours les mêmes sept
lignes. **Aucune action ne pouvait l'éteindre**, ce qui en fait du décor en deux passages, et on
cesse alors de lire la liste où se cachent les vrais impayés (leçon L6 ; même défaut déjà corrigé
chez ARGUS, qui re-signalait des candidats clos depuis trois jours).

Il sépare désormais deux états, et n'en absout aucun :

- **IMPAYÉ** — le document n'a toujours pas été mis à jour. C'est ce que le rapport compte en tête.
- **RATTRAPÉ** — un commit ULTÉRIEUR a mis le document à jour. Le manquement reste NOMMÉ (la règle
  est « dans le même commit », elle n'a pas été tenue) et le commit qui a payé est cité, pour être
  vérifié plutôt que cru.

Trois garde-fous, chacun contre une façon de se rattraper à bon compte : un document mis à jour
AVANT le commit fautif ne rattrape rien (il ne pouvait pas décrire un changement qui n'existait pas
encore) ; rattraper un document sur deux ne rattrape rien non plus, quand deux process partagent le
même code (un demi-rattrapage affiché comme un rattrapage est pire qu'aucun) ; et le cas « code et
document dans le même commit » reste ce qu'il a toujours été — jamais un écart.

### Le détecteur au crochet post-commit (2026-09-25, tâche #436 partie 2)

**Ce qui n'allait pas, et c'est mesuré, jamais supposé.** Tout ce qui précède était vrai depuis le
2026-09-23 — et ne tournait que si quelqu'un lançait `god-of-all-process` à la main. Le crochet
`post-commit` appelle les sept Gardiens sacrés, ecotoken et MOÏSE ; god n'y figurait pas
(`grep -c "god-of-all-process" scripts/hooks/post-commit` rendait **0**). Le 2026-09-25, le
détecteur affichait **9 dettes** : 7 payées en retard, 2 encore dues. Aucune n'était cachée —
regarder demandait un geste, et un geste qu'on doit penser à faire finit par ne plus être fait
(leçon L2 : un mécanisme qui ne sort pas du script est une intention).

**Ce qui a été câblé** : `detteDuDernierCommit()`, une fenêtre à UN commit filtrée sur les impayés,
lancée par la sous-commande `node scripts/god-of-all-process.mjs dette` dès qu'un commit touche un
`scripts/*.mjs`.

**Les quatre décisions de calibrage, chacune contre un défaut précis :**

- **Un seul commit, jamais la fenêtre de quinze.** Une dette née il y a dix commits n'est plus une
  information au moment du commit onze : c'est une liste qu'on relit sans pouvoir l'éteindre, donc
  du décor en deux passages (leçon L6 — exactement le défaut que la distinction IMPAYÉ/RATTRAPÉ
  avait déjà dû corriger plus haut). Ce qu'on peut encore réparer d'un `git commit --amend`, c'est
  ce qu'on vient de faire. Le bilan complet reste chez god, à la demande et à la Ronde.
- **Muet quand il n'a rien trouvé.** Pas de ligne « aucune dette » : un contrôle qui parle à chaque
  commit pour dire que tout va bien cesse d'être lu au troisième, et c'est dans ce bruit-là que les
  neuf ont pu passer.
- **Ni bannière de fiabilité, ni compteur d'usage sur ce chemin.** La sous-commande est traitée
  avant les deux. La bannière ferait trois lignes de bruit par commit pour zéro information dans le
  cas normal ; le compteur, lui, mesure si l'AGENT sollicite ses outils (Article 31) — un appel
  déclenché par un crochet n'est pas une sollicitation, et l'y compter ferait passer god pour
  l'outil le plus consulté du dépôt sans que personne ne l'ait ouvert.
- **Le filtre du crochet est un superset volontaire.** Il se déclenche sur n'importe quel
  `scripts/*.mjs`, jamais sur une liste des scripts de process recopiée dans le crochet : une telle
  liste divergerait en silence le jour où un process change de contrôleur (Article 24). La
  précision vit dans l'outil, qui est muet quand il n'a rien trouvé.

**Une conséquence assumée de la fenêtre à un** : le rattrapage ne peut pas s'y observer, puisqu'il
vit dans les commits SUIVANTS, qui n'existent pas encore. Une dette vue par le crochet est donc
toujours impayée par construction — ce n'est pas un jugement plus sévère, c'est une fenêtre plus
courte, et le bilan complet continue de faire la part des deux.

## Ce que « un mécanisme du process » veut dire, exactement (2026-09-23)

*(Trois resserrements de la mesure `process ↔ contrôleur`, faits la même nuit. Ils ne corrigent
aucun écart — ils cessent d'en inventer, et c'est ce qui rend les vrais enfin lisibles.)*

Le rapport annonçait **66 « mécanismes câblés et jamais écrits »**. Les regarder un par un a montré
que l'immense majorité n'en étaient pas, et surtout qu'ils NOYAIENT le signal grave : une quinzaine
de règles écrites que personne n'applique. Un garde-fou qui accuse à tort cesse d'être lu (leçon L4),
donc le bruit ne coûte pas seulement de l'attention : il coûte les vraies trouvailles.

1. **Importé ≠ câblé.** Un nom qui ne fait que traverser la ligne d'import d'un contrôleur n'est pas
   un mécanisme qu'il fait respecter. Sans cette distinction, tout symbole d'infrastructure partagé
   comptait comme une règle de process.
2. **Un contrôleur peut servir plusieurs process.** Un mécanisme documenté chez un process FRÈRE
   (même contrôleur) est écrit — simplement ailleurs. Le reprocher au voisin produisait 33 faux
   écarts d'un seul coup, `circle-process-guardian` gardant à la fois la Ronde et l'intégration
   d'un item à la Ronde.
3. **Un process peut vivre dans une SECTION, pas dans tout un fichier.** Le process de simulation
   déclare `docs/regles-de-travail.md`, qui est aussi la référence maîtresse du paysage entier et
   nomme au passage des dizaines de mécanismes étrangers à toute simulation. Le champ `docSection`
   dit quelle partie fait loi ; l'extraction s'arrête au prochain titre de même niveau et rend
   `null` sur un titre introuvable — se rabattre silencieusement sur le fichier entier ramènerait
   le bruit sans que personne ne s'en aperçoive.

**Résultat : 66 → 22 dans un sens, 15 → 5 dans l'autre.** Les 5 restants sont réels et ont été
vérifiés un par un : deux mécanismes que le contrôleur de la Ronde IMPORTE sans jamais les appeler,
pendant que son document en décrit la règle.

## Le seuil d'arrêt : UN SEUL, et ce n'est pas un compte rendu

*(Ajouté le 2026-09-23, après une perte de temps réelle et conséquente — l'agent s'est arrêté au
milieu de la nuit pour rendre un point d'étape, et l'utilisateur, réveillé, a dû relancer. Ses mots :
« tu t'es arrêté ? tu aurais dû continuer sans t'arrêter [...] la perte de temps est conséquente ».)*

**LE DÉFAUT ÉTAIT DANS LE PROCESS, PAS SEULEMENT DANS L'AGENT.** Rien ici n'interdisait de s'arrêter
pour rendre compte, et un compte rendu intermédiaire *ressemble* à du travail sérieux : il est écrit,
il est honnête, il est même bien fait. C'est exactement ce qui le rend coûteux — il donne à
l'interruption l'apparence de la rigueur. En mode autonome, **un point d'étape n'est pas un livrable,
c'est une nuit qui s'arrête**, parce que personne n'est là pour dire « continue ».

**LA RÈGLE, sans exception :** pendant une nuit autonome, l'agent n'a **qu'un seul seuil d'arrêt** —
la vérification finale de l'étape 8. Tant qu'il reste une tâche traitable dans le plan, il enchaîne.

**Ce qui n'est PAS un motif d'arrêt**, et chacun s'est présenté comme tel au moins une fois :

| Ce qui arrive | Ce qu'on fait | Ce qu'on ne fait pas |
|---|---|---|
| Un chantier est fini | on commite et on prend le suivant | rendre un point d'étape |
| Un résultat est intéressant | on l'écrit dans le suivi | le raconter et attendre |
| Une décision dépasse le mandat | on instruit jusqu'au bord et on passe à la suite | s'arrêter en attendant la réponse |
| Un outil trouve quelque chose de grave | on le traite ou on le met en tête du rapport | réveiller l'utilisateur |
| Le plan semble terminé | on relit le plan **en entier** avant de conclure | conclure de mémoire |

**Où le compte rendu a le droit d'exister** : dans le rapport de nuit, à la fin, et nulle part
ailleurs. Tout ce qui mériterait d'être dit en cours de route s'écrit dans `docs/suivi/` au fil de
l'eau — c'est fait pour ça, et l'utilisateur le lit au réveil.

**Le garde-fou mécanique** : `findArretPremature()` (`scripts/god-of-all-process.mjs`) compare, pour
une nuit donnée, le nombre de chantiers du plan au nombre de chantiers réellement clos dans le
suivi. Une nuit qui s'achève avec des chantiers traitables non entamés et sans raison écrite est un
manquement nommé, avec son responsable — l'agent. Il signale, il ne bloque jamais.


## La planche des schémas (2026-09-23, dette documentaire payée à la Ronde GOAT MAX)

*(Inscrite ici parce que `angel-of-ia-process` a nommé son absence : le commit `51997b5e` a changé
`scripts/god-of-all-process.mjs` — qui porte les process `semi-autonome`, `nuit` et `meta` — sans
mettre à jour leur document dans le même commit. C'est exactement la règle posée plus haut dans ce
fichier, enfreinte par l'agent qui l'avait écrite.)*

**Ce qu'elle ferme, et le défaut était réel.** L'utilisateur cherchait les schémas de process du
projet — « quels schémas sont incomplets, quels schémas intègrent d'autres schémas, quel est le
schéma global, quels sont les schémas maîtres » — et ne les a pas trouvés : « je n'ai pas trouvé
mon bonheur ». Le schéma maître existait pourtant en DONNÉE depuis la veille
(`SCHEMA_DE_REFERENCE`) et se dérivait correctement via `schemaUnifie()`. **Une donnée juste que
personne ne peut lire vaut, pour qui la cherche, exactement une donnée absente** — même famille que
la Partie 13 du process XP-IA : écrire n'est pas livrer.

**Commande** : `node scripts/god-of-all-process.mjs schemas`. Huit sections, toutes DÉRIVÉES — un
process, un maillon ou un emboîtement ajouté demain y apparaît sans que personne ne touche au
générateur (Article 24).

**`EMBOITEMENTS` — trois mécaniques qui ne se confondent jamais.** Déclarées en données, parce
qu'elles ne sont déductibles d'aucun diff :
- **ORCHESTRE** — le process A lance le process B en entier. C'est le cas de `nuit` (qui lance la
  Ronde et la simulation) et de `semi-autonome`. Un MODE n'est pas un travail : il décide de la
  façon d'enchaîner des process qui, eux, produisent quelque chose — d'où leurs maillons sans objet.
- **GREFFE** — le process A s'insère à des MOMENTS à l'intérieur de B, sans le lancer ni en faire
  partie. `xp-ia` est la seule, et c'est ce qui la rend fragile : une greffe dépend d'un moment qui
  arrive, pas d'une étape qu'on coche. C'est précisément pourquoi angel doit la DEMANDER plutôt que
  de la lire sur le disque.
- **SURVEILLE** — `meta` vérifie la tenue des dix process, lui-même compris.

Garde-fou `findEmboitementsSurProcessInconnu()`, sur le patron déjà prouvé de
`findTensionsOnUnknownProcess()` : une carte qui nomme un process disparu est une carte fausse, et
une carte fausse rassure à tort.

**`EXTENSIONS_CANDIDATES` — huit maillons À TRANCHER, jamais appliqués.** Le schéma maître va de
SCAN à TÂCHES. Quatre maillons en amont (DÉCLENCHEUR, CADRAGE, BUDGET, MÉMOIRE) et quatre en aval
(EXÉCUTION, VÉRIFICATION, JUGEMENT PAR L'UTILISATEUR, CAPITALISATION) existent déjà dans le travail
réel et sont déjà exigés par des Articles — ils ne sont simplement pas dans le schéma, donc rien ne
vérifie qu'ils sont branchés. Chacun déclare CE QUI L'EXIGE DÉJÀ : un maillon que rien d'autre ne
réclame serait une invention, pas un trou.

**Le constat qui les motive, et il est du même type que celui qui a créé l'Article 28 un cran plus
tôt** : cet Article a fermé « un rapport écrit ressemble à un problème traité ». Personne n'a fermé
la suite — **une tâche CRÉÉE ressemble à un problème TRAITÉ**. La chaîne s'arrête au moment où elle
inscrit la tâche dans `docs/suivi/`, et ce qu'elle devient ensuite n'est porté par aucun schéma.

**Ce que la planche ne dit PAS** : si un process est BON. Elle décrit des formes et des liens ;
juger qu'un process sert vraiment à quelque chose se lit, et se tranche avec l'utilisateur.

## LE DISPOSITIF ANTI-ARRÊT, RENFORCÉ (2026-09-24, demande explicite de l'utilisateur)

*(Sa question avant d'aller dormir : « tu respectes le process du mode auto en renforçant la règle
de ne pas t'arrêter c'est bien ça ? ». Et, plus tôt dans le calibrage : « je veux une très faible
(voire nulle) probabilité que ça arrive ».)*

**CE QUI EXISTAIT NE SUFFISAIT PAS, et il faut le dire.** Le seuil d'arrêt unique était écrit, et
`findArretPremature()` comptait les chantiers non entamés — mais les deux sont des mécanismes
d'APRÈS COUP. Ils constatent qu'une nuit s'est arrêtée ; aucun ne la redémarre. Une règle écrite,
aussi bien écrite soit-elle, ne descend jamais à une probabilité nulle : elle décourage, elle ne
rattrape pas.

**LE DISPOSITIF EST DÉSORMAIS À QUATRE COUCHES, et la quatrième est la seule qui RATTRAPE :**

| Couche | Ce qu'elle fait | Ce qu'elle ne fait pas |
|---|---|---|
| 1. La règle du seuil unique | décourage l'arrêt, nomme les cinq faux motifs | n'empêche rien |
| 2. `findArretPremature()` | compte les chantiers traitables non entamés sans raison écrite | constate, ne relance pas |
| 3. Le compteur dans le rapport de nuit | rend l'arrêt visible au réveil (entamés / finis / laissés) | arrive trop tard |
| 4. **LE RÉVEIL PROGRAMMÉ** | **relance l'agent toutes les 45 minutes sur le plan, à l'endroit où il en était** | ne peut pas empêcher l'arrêt, seulement le rendre court |

**La quatrième change la nature du problème.** Avant elle, un arrêt à 1 h du matin coûtait six heures.
Avec elle, il coûte au plus quarante-cinq minutes — et le message de relance dit explicitement que
rendre un point d'étape n'est pas un livrable. Ce n'est pas zéro ; c'est un ordre de grandeur en
moins, et c'est ce qui est réellement atteignable.

**Sa mise en place, en une ligne** : un rappel programmé (`send_later`) dont le message rappelle le
plan, les bornes, et le seuil d'arrêt unique. Il se reprogramme à chaque réveil tant que la nuit
dure, et cesse à la vérification finale.

**LA LIMITE, DÉCLARÉE PLUTÔT QUE TUE (Article 27)** : aucune de ces quatre couches ne peut
m'empêcher d'écrire un message à 3 h du matin. Ce qui est mécaniquement possible est de rendre
l'arrêt court et visible, jamais impossible. Le déclarer vaut mieux que de laisser croire à une
garantie qui n'existe pas — c'est exactement ce que l'Article 27 demande quand aucun mécanisme
complet n'est atteignable.

## 2026-09-25 — Deux mécanismes ajoutés à god-of-all-process, qui portent ce process

*(Dette documentaire payée. Les commits `1893946` et `d7e6c47` ont changé
`scripts/god-of-all-process.mjs` — le contrôleur déclaré de ce mode — sans toucher ce document dans
le même commit. C'est exactement le cas que la section précédente décrit, et le garde-fou l'a
nommé : `findChangementsIndirectsSansMiseAJour()` a signalé les deux lors de la Ronde du 2026-09-25.
Constater que son propre garde-fou vous attrape vaut mieux que de ne pas être attrapé.)*

**Ce qui a changé pour ce mode, concrètement :**

- **`auditPlansDeDocuments()`** (commit `1893946`) étend la chaîne de l'Article 28 aux DOCUMENTS,
  là où elle ne couvrait que les rapports d'outils. Un plan d'action écrit dans un document de
  `docs/` qui annonce une tâche par son numéro est vérifié : cette tâche doit exister pour de vrai
  dans `docs/suivi/`. **Pour la nuit autonome, ça ferme une porte qui était grande ouverte** : un
  plan rédigé à trois heures du matin dans un document de conception ne pouvait jusqu'ici être
  contrôlé par personne, puisque aucun outil ne l'avait produit.

- **`findProcessSansEstimation()`** (commit `d7e6c47`) vérifie que chaque process déclaré annonce
  sa durée ET sa consommation avant de lancer quoi que ce soit. **Le résultat réel au moment de son
  écriture : 2 process sur 10 seulement**, et ce sont les deux qui coûtent cher (la Ronde, la
  simulation). Les huit autres sont exemptés par `PROCESS_SANS_ESTIMATION_ASSUMEE`, une exemption
  ÉCRITE avec sa raison — jamais un silence. Ce mode-ci en fait partie : une nuit autonome n'a pas
  de durée à annoncer puisqu'elle dure ce que dure l'absence.

**Ce que ces deux ajouts ne changent PAS** : ni les bornes du périmètre sensible, ni les
obligations qui ne s'allègent jamais la nuit, ni la façon dont ce mode enchaîne ses tâches. Le
contrôleur en sait plus, le mode se conduit pareil.
