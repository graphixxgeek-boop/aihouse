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

