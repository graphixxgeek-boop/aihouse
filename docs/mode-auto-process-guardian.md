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

## LE RITUEL D'ENTRÉE ET DE SORTIE — `the-ghost` *(inscrit le 2026-10-01, tâche #1381)*

### L'outil du mode nocturne n'était branché sur rien, et c'est ce document qui l'ignorait

`the-ghost` a été commandé par l'utilisateur pour ce mode précis — *« créé un petit agent script
"the-ghost" qui gere le mode autonome […] quand je vais dormir ou quand je te laisse travailler
seul »* (2026-09-21). Il tient trois choses qu'aucun autre outil ne calcule : **depuis quand la
session dure**, **combien de tâches ont été enchaînées**, et **depuis quand aucune Ronde n'a
tourné**.

**Il n'apparaissait nulle part ici.** Zéro occurrence dans ce document, zéro étape chez son
contrôleur. Constaté en pleine nuit autonome le 2026-10-01 : `the-ghost pacing` répondait
« aucune session de mode nocturne active » après six heures de travail.

**C'est exactement le défaut qui a fait naître l'Article 31** : *« un passage par tool-brain a
révélé que l'outil qui les produit existait depuis la veille et n'était branché nulle part. Un
outil qu'on n'utilise pas ne signale jamais qu'il est mal branché. »* Le même motif, sur l'outil
même du mode où il se produit.

### Les deux gestes

| Quand | Commande | Ce que ça change |
|---|---|---|
| **En entrant** dans le mode, avant de commencer | `node scripts/the-ghost.mjs start` | ouvre la session ; sans elle, le rythme de la nuit n'est mesuré par personne |
| **En sortant**, avant le rapport de nuit | `node scripts/the-ghost.mjs end` | clôt la session et rend son bilan |

Et pendant la nuit, `node scripts/the-ghost.mjs pacing` répond « où en est cette session ? ».

### Pourquoi la preuve est un FICHIER

`.the-ghost-session.json` n'existe que si le rituel d'entrée a eu lieu. Le contrôleur lit ce
fichier plutôt que de demander confirmation : **une étape qu'on ne peut que s'auto-attribuer est
une étape qu'on saute sans le savoir**. La sortie, elle, n'a pas de preuve propre — c'est déclaré
ici plutôt que tu (Article 27).

### Ce qui n'a PAS été fait le jour où la règle est née, et pourquoi

La nuit du 2026-10-01 reste marquée **✗** sur cette étape. Démarrer la session à 6 h du matin pour
verdir le contrôle aurait enregistré une heure de début fausse de six heures — et toute durée
calculée dessus aurait été fausse avec elle (Article 32). **Un ✗ exact vaut mieux qu'un ✔ faux**,
et il prouve au passage que la nouvelle étape mord.

## Ce que l'utilisateur donne au départ

Un plan numéroté, dans son ordre à lui. Le plan **se suit dans cet ordre**, sans en sauter une
étape, sans en réordonner une de sa propre initiative — même quand une étape plus loin paraît plus
urgente. Si une étape se révèle impossible, elle est dite comme telle dans le rapport, avec sa
raison ; jamais silencieusement remplacée par autre chose.

## RELIRE LES RÉVEILS DÉJÀ ARMÉS — l'étape ajoutée le 2026-09-29 (tâche #1165)

**Le défaut s'est produit pour de vrai, et il a duré six heures.** Un filet horaire armé la veille
annonçait encore, comme « ce qui vient maintenant », quatre livrables déjà faits — et il l'a répété
**à chaque heure de la nuit**.

**Ce qui rend ce défaut particulier** : un réveil se RÉPÈTE. Une consigne périmée ne se dit pas une
fois, elle se redit à chaque passage, et chaque passage la rend un peu plus crédible.

**La leçon existait pourtant, écrite noir sur blanc depuis la tâche #831** : « mes propres messages
de réveil sont de la mémoire, jamais une source de vérité ». Elle n'a rien empêché, **parce
qu'aucun mécanisme ne la portait** — elle le disait elle-même.

**Le geste, au départ de chaque période autonome** : lister les réveils déjà armés, relire leur
prompt, et corriger ce qui y est faux. Un ancien filet ne se supprime pas forcément — un second
filet reste utile ; c'est son CONTENU qu'il faut remettre à jour.

> **FRONTIÈRE avec `docs/xp-ia-process-detail.md`, que le détecteur de documents jumeaux a exigée.**
> Les deux parlent de leçons payées et de mécanismes qui manquent, et ce n'est pas un hasard : une
> nuit autonome est l'endroit où les défauts de méthode se voient le mieux. **Ils ne se confondent
> pourtant jamais.** Ce document décrit LE CADRE d'une période de travail sans personne — ses
> étapes, ses bornes, son seuil d'arrêt. L'autre décrit LA CHAÎNE par laquelle une leçon survit à
> la session qui l'a vécue. Ici on lit comment travailler seul ; là-bas, comment ne pas réapprendre
> deux fois la même chose.

**Ce qui reste hors de toute mécanique** : un prompt de réveil vit chez le planificateur, pas dans
le dépôt. `god-of-all-process` déclare donc cette étape NON VÉRIFIABLE plutôt que de la compter
faite, et `angel-of-ia-process` la porte comme règle de conduite (`reveil-a-jour`).

### ET LE MÊME DÉFAUT EST REVENU LE SOIR MÊME — la règle ne suffisait pas (2026-09-29, tâche #1219)

**Ce qui s'est passé** : j'ai déclaré `reveil-a-jour` RESPECTÉE dans la même nuit (tâche #1213), et
c'était vrai — de la chaîne courte, que je réécrivais à chaque réarmement avec l'état réel. Les deux
FILETS HORAIRES, eux, personne ne les touchait : l'un d'eux annonçait toujours « la Ronde autonome
est faite » et « la dette de fiches est à 0 », des heures après que ces phrases avaient cessé d'être
vraies. **La règle ne couvrait que ce que je réécrivais déjà.** Un réveil qu'on ne touche pas est
précisément celui qui se périme.

**LA CORRECTION N'EST PAS « MIEUX RELIRE », C'EST UNE RÈGLE DE CONCEPTION** : *un filet ne porte
jamais d'état.* Sa seule raison d'être est de retomber quand le reste est mort, donc il doit rester
vrai indéfiniment sans que personne y touche. Tout ce qui date dans son texte finira par mentir, et
un filet qui ment est pire qu'un filet absent — il fait travailler sur un état qui n'existe plus.

**Ce qu'un filet contient donc, et rien de plus** : le geste à faire en premier (réarmer la chaîne
courte), **où lire l'état réel** (le journal git, l'état de l'arbre, les dernières lignes de
`docs/suivi/sessions/`), le cadre qui ne se périme pas (l'ESCALADE, l'ALIGNEMENT EN CASCADE), et les
bornes. Aucun chiffre, aucun « déjà fait », aucun « à venir ».

**La chaîne courte, elle, PEUT porter l'état** — et doit le porter : elle est réécrite à chaque
tour, donc son contenu est daté de quelques minutes. C'est la différence entre un message qu'on
renouvelle et un message qu'on abandonne derrière soi.


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

## LA RONDE PENDANT LA NUIT — les deux moitiés *(2026-10-02, tâche #1480)*

**Sa demande, mot pour mot** : « je voudrais que tu puisses lancer une ou plusieurs rondes pendant
le mode auto. Ca fait partie du process je pense, du process mode auto. Pourquoi as-tu bloqué le
lancement ? Il faudrait qu'on fluidifie cette partie, que : des le lancement du mode auto on
calibre ensemble la ronde principale à mener pendant la nuit, et aussi que tu disposes d'une
formule "ronde auto" qui te permet de lancer des rondes selon ton propre calibrage, à tout moment
pendant la nuit : quand tu penses que c'est pertinent. »

### Pourquoi le lancement avait été bloqué, et ce n'était pas la raison qu'on croit

**Ce n'était PAS la règle « aucune fenêtre bloquante la nuit ».** Ce document prévoit déjà
l'exemption, et le process de la Ronde prévoit la combinaison D : zéro question, les points
reportés au prochain passage en présence. La Ronde nocturne était permise.

**C'était qu'aucun PROGRAMME n'existait.** Une Ronde se calibre avec lui — quels items, quel
palier, quels items payants — et ce calibrage n'avait jamais été demandé au coucher. **Un process
qui n'a pas d'entrée ne se lance pas, même quand rien ne l'interdit.** C'est un trou de process,
pas une interdiction mal lue.

### Moitié 1 — la Ronde CALIBRÉE, décidée avant qu'il s'endorme

Étape `ronde-calibree-au-depart`, qui vient avec le plan de départ. Elle se demande **en même temps
que le reste du calibrage de la nuit**, jamais après : quels items, quel palier, quels items
payants et leur plafond.

**Sans ce calibrage, la Ronde ne se lance pas.** Ce n'est pas une précaution : c'est que personne
ne saurait quoi lancer.

### Moitié 2 — la formule « RONDE AUTO », pour le cas imprévu

Étape `ronde-auto-si-pertinent`, **facultative**. Elle couvre le cas qu'aucun calibrage ne peut
prévoir : il est 3 h, le programme est terminé, une Ronde légère serait utile.

**Trois bornes, et ce sont des PROPOSITIONS que l'utilisateur peut changer d'un mot.** Il ne les a
pas fixées ; les inventer en silence serait trancher à sa place, les laisser vides rendrait
l'étape inapplicable. Elles sont donc écrites ici, visibles :

| Borne | Valeur proposée | Pourquoi |
|---|---|---|
| Combien par nuit | **2 au maximum**, en plus de la Ronde calibrée | au-delà, le temps passe en contrôle plutôt qu'en travail — et la nuit sert à produire |
| Appels API | **zéro par défaut** | dépenser son budget pendant qu'il dort demande son accord au calibrage du départ, jamais une décision prise à 3 h |
| Les questions sautées | **reportées EN UN BLOC au matin** | il doit pouvoir y répondre d'une traite, pas les retrouver éparpillées |

**Elle est facultative, et c'est voulu** : une nuit sans Ronde auto est une nuit normale. La
compter comme un manquement reprocherait l'absence d'un geste qui n'était pas dû.

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

## LES RÉGLAGES DE RÉVEIL QUI ONT FAIT LEURS PREUVES — historisés, jamais retrouvés de mémoire

*(2026-09-27, demande explicite de l'utilisateur au moment d'aller dormir : « l'essentiel est de bien
regler ton reveil à chaque tour comme tu l'as fait la nuit derniere, reprends tes reglages à toi
comme la nuit derniere pour etre sur de ne pas t'arreter et renseigne ces reglages quelque part pour
historiser que ca fonctionne comme ca : la nuit derniere tu as reussi à ne pas t'arreter ».)*

**LE PROBLÈME QU'IL POINTE EST EXACTEMENT CELUI DE L'ARTICLE 27, appliqué au réveil.** Une nuit a
marché ; les réglages qui l'ont fait marcher ne vivaient nulle part. À la nuit suivante, un agent —
le même ou un autre — les redevine, et un réglage redeviné est un réglage qui peut être manqué. Ce
qui n'est pas écrit n'existera plus demain, et ça vaut pour un intervalle en minutes comme pour une
règle de la charte.

**CORRECTION DU 2026-09-29 — ILS SONT TROIS, PAS DEUX, ET C'EST ACQUIS.** Cette section décrivait
deux réveils. La nuit du 28 au 29 en a armé **TROIS**, et c'est ce dispositif-là qui a tenu plus de
seize heures sans arrêt. Le troisième est un **SECOND filet horaire, indépendant du premier**, sur
la même minute : il tombe même si le filet principal a échoué. Deux messages de plus par heure
contre la suppression du point de défaillance unique. Sa décision au retour, mot pour mot : *« pas
besoin de TESTER, on sait CE QUI FONCTIONNE »* — **ces réglages ne se rediscutent plus et ne se
re-mesurent plus.** Le tableau ci-dessous garde les deux premiers ; le troisième est le jumeau du
deuxième, à ceci près qu'il ne partage avec lui aucun mécanisme.

**ET UN QUATRIÈME GESTE, QUI N'EST PAS UN RÉVEIL MAIS QUI FERME LE CYCLE** : à la fin du mode auto,
on **DÉSACTIVE** les filets plutôt que de les supprimer. Réversible d'un clic, et leurs prompts
restent lisibles pour la nuit suivante — un réglage supprimé est un réglage à redeviner.

**LES DEUX PREMIERS RÉVEILS, ET IL EN FAUT AU MOINS DEUX — c'est le cœur du dispositif :**

| | Le rythme | La garantie |
|---|---|---|
| **Quoi** | chaîne courte `send_later` | filet récurrent `create_trigger` (cron) |
| **Intervalle** | **15 minutes** | **toutes les heures, minute 7** |
| **Réarmement** | à CHAQUE tour, en PREMIER | aucun — il tombe tout seul |
| **Ce qu'il protège** | la cadence de travail | la nuit entière |

**Pourquoi deux et pas un seul, et la raison est dissymétrique :** la chaîne courte donne le rythme
mais elle est fragile — **un seul tour qui se termine sans la réarmer suffit à tuer la nuit**, et
c'est exactement le genre d'oubli qu'on fait à 3 h du matin au milieu d'un chantier. Le filet
horaire, lui, ne dépend d'aucun geste : il tombe même si la chaîne est morte. À l'inverse, le filet
seul laisserait jusqu'à une heure de machine inutilisée à chaque décrochage. Aucun des deux ne
remplace l'autre.

**LA RÈGLE D'ORDRE, non négociable : on réarme AVANT de travailler, jamais après.** Réarmer en fin
de tour revient à confier la nuit à la mémoire d'un agent qui vient de passer vingt minutes sur
autre chose. Les deux prompts de réveil le disent en première ligne, plutôt que de compter dessus.

**POURQUOI 15 MINUTES, et pas 45.** L'utilisateur avait demandé le 2026-09-24 (tâche #732) des
rappels « plus proches que 45 minutes » en demandant quel était le minimum : le minimum technique
est d'**une minute** (le planificateur relève toutes les minutes). 15 minutes est le réglage retenu
— assez court pour qu'un décrochage coûte un quart d'heure et non trois quarts, assez long pour
qu'un vrai chantier tienne entre deux réveils sans être haché.

**POURQUOI LA MINUTE 7 pour le filet horaire**, et jamais la minute 0 : les tâches planifiées se
bousculent en haut de l'heure, et un réveil qui arrive en retard parce que tout le monde s'est donné
rendez-vous à la même minute est un réveil qu'on ne peut pas chronométrer.

**CE QUE LE RÉVEIL NE FAIT PAS, et il faut que ce soit écrit** : il ne rend pas de compte à
l'utilisateur. Il dort. Un réveil qui produirait un message par tour transformerait la nuit en
notification continue — le rendu se fait une seule fois, au seuil d'arrêt, en fichier texte.

**Preuve du fonctionnement, nuit du 2026-09-26 au 27** : la nuit précédente s'est déroulée sans
arrêt avec ce dispositif, et c'est l'utilisateur lui-même qui l'a constaté (« la nuit derniere tu as
reussi à ne pas t'arreter »). C'est cette réussite-là que cette section met à l'abri.

## ÉTAPE 0 — LA PRÉPARATION AVANT DE PARTIR (2026-09-27, tâche #770)

*(Sa demande : « tu te prépares psychologiquement pour la nuit : tu prends un moment pour relire
tous les process qui vont être concernés, tous les outils dont tu vas avoir besoin, tu te prépares
pour ne rien oublier, tu organises ta mémoire pour la nuit de façon optimale ».)*

**SA RAISON EST EXPLICITE, ET ELLE EST JUSTE** : « je ne vais pas intervenir pour perturber ta
mémoire pendant plusieurs heures, alors tu peux organiser ton périmètre interne en fonction ». Ce
n'est pas une métaphore, c'est une contrainte réelle du travail autonome long : **ce qui n'est pas
rassemblé avant le départ ne le sera plus**, et une session qui se remplit de recherches dispersées
finit par oublier la charte qu'elle est censée servir.

**LE GESTE, une commande, AVANT tout le reste :**
`node scripts/god-of-all-process.mjs preparer`

**LES TROIS GESTES SONT LES SIENS, et chacun est MESURÉ plutôt que coché** — une case « j'ai relu
les process » est une déclaration, pas une lecture.

| | Le geste | Ce qui le mesure |
|---|---|---|
| **1** | relire les process concernés **avant**, pas pendant | ils se DÉRIVENT des mots du plan contre les process déclarés (Article 24), et chacun sort avec son document |
| **2** | rassembler les outils **et vérifier qu'ils tournent** | tool-brain donne la liste, `node --check` la vérifie pour de vrai |
| **3** | déclarer ce qu'on met **de côté** | ne se mesure pas : se déclare à la main, et l'outil REFUSE de le considérer rempli |

**LE TROISIÈME EST LE PLUS IMPORTANT, ET C'EST LE MOINS ÉVIDENT.** « Déclarer ce qu'on met de
côté » paraît secondaire à côté de « rassembler ce dont on a besoin » — c'est l'inverse. Ce qui
n'est pas nommé comme écarté ressemble, au matin, à quelque chose qu'on a oublié ; et l'agent de la
nuit, lui, retombe dessus à trois heures et hésite, parce que rien ne dit que c'était un choix.

**LE FAUX POSITIF DU PREMIER PASSAGE, écrit ici parce qu'il resservira** : le catalogue rend des
NOMS D'AFFICHAGE (« HARMONIA (nœuds sensibles) »), jamais des noms de fichier. Dériver
`scripts/<nom>.mjs` accusait **vingt outils** d'être introuvables, les vingt à tort — la veille
d'une nuit, un garde-fou qui accuse à tort fait perdre du temps au pire moment (L4). Le résolveur
existait déjà ailleurs dans le dépôt et a été réutilisé plutôt que réécrit (L29, BP6). Un nom qu'on
ne résout pas est désormais rendu **« non résolu »**, jamais « cassé ».

**IL NE BLOQUE JAMAIS LE DÉPART.** Un contrôle de préparation qui refuserait la nuit ferait perdre
la nuit — exactement ce qu'il existe pour protéger. Il REGARDE, comme son voisin d'après.

**DEUX REFUS DE CONCLURE** : sans plan et sans liste de tâches, il n'y a rien à préparer, et rendre
« prêt » sur zéro donnée la veille d'une nuit entière est le faux vert le plus cher qui soit ; un
plan sans aucun numéro se déclarerait préparé sans avoir rien lu.

## LE POINT DE CONTRÔLE — ce que le réveil de 15 minutes est censé servir (2026-09-27, tâche #732)

**LE RÉGLAGE CI-DESSUS N'EST QUE LA MOITIÉ DE LA TÂCHE, et c'est la moitié facile.** Passer de 45 à
15 minutes donne une cadence. Mais la tâche disait autre chose depuis le premier jour : « ce qu'un
rappel rapproché apporte vraiment, c'est un **POINT DE CONTRÔLE forcé** ».

**UN RÉVEIL N'EST PAS UN CONTRÔLE.** Un agent réveillé au milieu d'un chantier reprend ce chantier
— il ne s'arrête pas pour regarder où il en est. Le réveil donnait donc le rythme sans jamais donner
le regard, et la tâche nommait précisément ce que ça coûte : « c'est exactement ce qui aurait
attrapé le décalage de colonnes de ce soir en dix minutes au lieu de trois heures ».

**LE GESTE, une commande :** `node scripts/god-of-all-process.mjs checkpoint`.

**LES TROIS QUESTIONS SONT MESURÉES, jamais posées** — et c'est le point qui compte. Une question
posée à un agent qui vient de travailler vingt minutes reçoit la réponse que l'agent *croit* vraie,
c'est-à-dire précisément la mémoire à laquelle on ne peut pas se fier.

| | La question de la tâche | Ce qui la mesure |
|---|---|---|
| **1** | où j'en suis | les tâches du plan de départ touchées par un commit, et surtout celles qui ne l'ont pas été |
| **2** | le carnet de bord dit-il la vérité | la fraîcheur du suivi, **relayée** de `check-suivi-fidelity`, jamais recalculée (L29) |
| **3** | ai-je dérivé du plan | les numéros commités qui n'étaient pas au plan, et leur part du travail |

**« HORS PLAN » N'EST JAMAIS UNE FAUTE, et les confondre serait le piège de ce contrôle** : une nuit
trouve des choses, et les lui reprocher pousserait à ne plus rien trouver. Le signal ne tombe que
quand le hors-plan **DOMINE** — plus de travail à côté que dedans — et jamais sous trois numéros de
tâche distincts, faute de quoi il crierait sur deux commits et cesserait d'être lu (L4).

**IL REGARDE, IL NE BLOQUE JAMAIS.** Un point de contrôle qui interromprait la nuit serait pire que
son absence ; le rythme, lui, est déjà garanti par les deux réveils.

**TROIS REFUS DE CONCLURE**, chacun couvrant un faux vert différent : sans plan de départ, « je n'ai
pas dérivé » est une affirmation sur rien ; sans liste de commits, « rien à signaler » dit seulement
que personne n'a regardé ; un plan sans aucun numéro rendrait 100 % de couverture, le plus faux des
verts.

**SA LIMITE, écrite dans sa propre sortie** : il lit les NUMÉROS des messages de commit. Un travail
réel qui n'en cite aucun lui est invisible — c'est un plancher, jamais un compte exact.

**Premier passage réel, le 2026-09-27** : 22 tâches du plan sur 103 touchées, 42 % du travail hors
plan, carnet de bord à jour. Un outil qui trouve quelque chose à son premier passage n'est pas une
intention (leçon L2).

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

**UN COMMENTAIRE AJOUTÉ N'EST PLUS UN CHANGEMENT DE PROCESS** *(2026-09-27, tâche #1014)*. Il
jugeait sur le FICHIER TOUCHÉ, jamais sur ce qui avait changé dedans. Le jour où la pose des
mentions `// ICEBERG:` a ajouté **une ligne de commentaire en tête de 79 fichiers**, il a annoncé
**huit dettes de process, les huit fausses** — aucun process n'avait bougé. Un garde-fou qui accuse
à tort cesse d'être lu (leçon L4), et huit fausses en un seul commit sont la dose qui fait cesser.
Il lit désormais le DIFF : un changement dont toutes les lignes ajoutées et retirées sont des
commentaires ou du vide n'a pas pu déplacer une règle. La règle est générale plutôt que taillée sur
le cas du jour (Article 24) — écrire « ignore la ligne ICEBERG » aurait laissé passer le prochain
cas sous une autre forme. **Risque résiduel assumé** : ici le POURQUOI vit à côté du QUOI, donc un
commentaire peut porter une règle ; un commit qui ne ferait que la réécrire cesserait d'être
signalé. Échange accepté — ce cas-là documente, il ne change pas le process. **Mesure : 20 écarts
→ 12**, les huit fausses disparaissent, les vraies dettes des commits précédents restent.

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

---

## LE PARAMÉTRAGE INTERNE DE L'AGENT — à réappliquer en DÉBUT de mode auto

*(2026-09-29 à 16h50 UTC, heure LUE. Demande explicite de l'utilisateur à son retour :
« Conserve bien la trace de ton parametrage interne pour te souvenir des bons parametres à
appliquer en debut de mode auto (process) ».)*

**CE QUE CETTE SECTION AJOUTE À CELLE DES RÉGLAGES DE RÉVEIL, ET POURQUOI ELLES SONT SÉPARÉES.**
La section « LES RÉGLAGES DE RÉVEIL QUI ONT FAIT LEURS PREUVES » historise le dispositif de
CADENCE (deux réveils, 15 min + minute 7). Celle-ci historise tout autre chose : les **gestes de
l'agent lui-même**, appris en les ratant, et qui coûtent chacun entre dix minutes et un tour
entier quand ils sont redécouverts. Aucun n'est déductible du code ; tous ont été payés.

### Les gestes d'exécution — chacun a coûté un échec réel

| Le geste | Ce qui arrive sans lui |
|---|---|
| **Écrire tout correctif de fichier dans un `.mjs` du scratchpad, puis le lancer** | un `node -e` contenant un accent grave ou une interpolation casse à l'analyse, en silence ou avec une erreur illisible — arrivé plusieurs fois dans la même nuit |
| **Passer les variables d'environnement explicitement : `SP=$SP node script.mjs`** | `ENOENT: undefined/bloc.txt` — la variable du shell n'atteint pas le processus |
| **`git commit` et `git push` en DEUX commandes séparées** | la commande combinée dépasse la limite de temps et se fait tuer (code 137). Le commit avait réussi ; seul le push restait à refaire, mais rien ne le disait |
| **Lire l'heure dans un appel SÉPARÉ, avant d'écrire une ligne de suivi** | une date tapée de mémoire, refusée par le garde-fou (Article 32) — cinq fois en une soirée |
| **Rendre les lecteurs injectables (`readFileImpl`, `lireImpl`, `shImpl`)** | le test juge le DISQUE et pas le code ; il vire au rouge parce que le dépôt s'est AMÉLIORÉ (leçon L40, rencontrée trois fois cette nuit) |
| **Chercher le nom au `grep` avant d'écrire un test** | un bloc de test entièrement dupliqué, écrit pour une fonction déjà couverte depuis des mois |
| **Attendre un travail de fond par `until <test>; do sleep 20; done`** | un `sleep` seul est refusé par le harnais, et une boucle sans `sleep` brûle le tour sans rien attendre — appris cette nuit, après une boucle de 200 itérations qui n'a rien attendu du tout |
| **Ne jamais lancer `execSync` sur des centaines de fichiers** | `ENOBUFS` : le tampon du shell déborde et le script meurt. `cat docs/suivi/sessions/*.md` suffit à le déclencher. On lit en JS, ou on passe par `python3` |
| **Dans `String.replace`, passer une FONCTION quand le remplacement contient `$`** | `$&` est interprété comme « le texte trouvé » : un correctif d'échappement a produit cette nuit un fichier qui ne se chargeait plus |
| **Avant de publier un chiffre qui désigne du travail : ouvrir DEUX cas à la main** | trois chantiers inexistants annoncés en une nuit — 59 blocs de test, 5 blocs, 233 frontières de mot : tous à ZÉRO après vérification (leçon L47) |

### Les contraintes de format du suivi, que rien n'annonce à l'avance

- La colonne « pour qui » n'accepte que **`PROJET`** ou **`DETTE-ENVERS-L-UTILISATEUR`**. Aucune
  autre valeur ne passe, et le refus arrive après coup.
- **Jamais de barre verticale à l'intérieur d'une cellule** — elle casse la ligne du tableau.
- Une clôture **MET À JOUR la ligne existante**, elle n'en ajoute jamais une seconde.
- `node scripts/data-archangel.mjs index --ranger` avant chaque commit ; tout fichier neuf de
  `docs/` doit être classé et indexé.

### La discipline de nuit, celle qui décide de la valeur du travail

1. **Consulter Smart Conso API avant toute action qui coûte un appel API** — y compris un simple
   diagnostic, jamais une exception (Article 22).
2. **Article 30 avant d'ouvrir un chantier** : `node scripts/data-archangel.mjs notes <sujet>`.
   *La nuit du 2026-09-29 a produit la preuve par l'absurde : la règle a été enfreinte UNE fois,
   et la tâche suivante a fabriqué un doublon.*
   **DEPUIS LA NUIT DU 2026-09-30 (tâche #1263), LE RÉESSAI N'EST PLUS DE MA MÉMOIRE** : l'outil
   élargit tout seul en trois niveaux quand le sujet ne ressort pas, et il DIT qu'il a élargi. La
   phrase « on réessaie avec le vocabulaire du sujet » ne décrit donc plus un geste à faire mais un
   geste fait — ce qui la rend enfin fiable (Article 27 : une obligation qui ne repose que sur la
   mémoire d'un agent n'existe plus à la session suivante).
   **Ce qui reste de ma responsabilité** : LIRE ce que l'élargissement rend, et ne pas confondre un
   résultat obtenu en relâchant la question avec un résultat obtenu telle qu'elle était posée.

5. **Ouvrir ce qu'on ABSOUT, pas seulement vérifier ce qu'on accuse** *(appris dans la nuit du
   2026-09-30, et c'est la leçon la plus chère de la nuit)*. J'ai évité trois fausses alertes en
   vérifiant mes propres accusations, pendant qu'une alerte VRAIE dormait dans une liste de cinq
   paires que j'avais classées « préexistantes, aucune de moi » sans en ouvrir une seule. Deux
   concernaient mon document, et l'une changeait de onze obligations un chiffre déjà livré.
3. **Ne jamais trancher à sa place.** Quand une correction déborde sur plusieurs outils ou touche
   une décision de conception, on MESURE, on écrit le constat avec ses issues et sa
   recommandation dans `docs/idees-a-trancher.md`, et on s'arrête là.
4. **Ne jamais rendre un satisfecit sur zéro donnée.** « Pas mesuré » se dit ; il ne se déguise
   jamais en « rien trouvé » (leçons L5 et L11).

### Ce que cette nuit a prouvé, chiffré

Nuit du 2026-09-28 au 29 : **plus de 16 heures sans arrêt**, 22 tâches (#1200 à #1221), zéro
franchissement de borne (vérifiable dans `git log`), bannière des Gardiens propre pour la première
fois. Le dispositif à deux réveils a tenu la cadence de bout en bout. **C'est ce paramétrage-là
qu'on réapplique, pas un autre reconstitué de mémoire.**

## 2026-09-30 — Le mode déclaré peut désormais se PÉRIMER, et le dire (tâche #1288)

**CE MODE-CI EST LE PLUS CONCERNÉ, parce que c'est lui qui était déclaré.** `.mode-de-travail.json`
portait `autonome` depuis le **2026-09-23 à 22h53** et n'avait jamais été retouché : **149 heures**
au moment où le défaut a été trouvé. Pendant tout ce temps, tout outil qui demandait « l'utilisateur
est-il là ? » recevait NON — y compris en plein après-midi.

**CE QUI CHANGE POUR CE PROCESS** :

- **Entrer en mode autonome se déclare, et la déclaration se PÉRIME.** Au-delà de 16 heures, elle
  est signalée comme datée à chaque commit. Une nuit dure moins que ça ; une nuit qui dure sept
  jours n'est pas une nuit.
- **Sortir du mode est donc un geste, pas un oubli.** Rien ne le fait à ma place, et c'est
  volontaire : décider que l'utilisateur est revenu n'est pas une déduction mécanique.
- **La commande, écrite ici parce qu'elle ne l'était nulle part** :
  `node scripts/modes-de-travail.mjs pilote` (ou `semi-autonome`, ou `autonome`).

**UN GESTE DE PLUS POUR LE PARAMÉTRAGE INTERNE DE CE MODE** *(la section que l'utilisateur a
explicitement demandé de tenir)* : **en début de mode auto, redéclarer le mode même s'il est déjà
le bon** — l'horodatage compte autant que la valeur, et un `autonome` juste mais vieux de sept
jours est indiscernable, pour tout lecteur, d'un `autonome` posé ce soir.

**ET LA DISCIPLINE QUI EN SORT, plus large que le mode** : *une preuve de PRÉSENCE n'est pas une
preuve de PERFORMANCE.* Elle vaut pour les 31 preuves d'étape sur 42 que
`findPreuvesToujoursVraies()` a nommées le même jour (tâche #1292).

---

## LA CONFIGURATION QUI A TENU 20 HEURES — le meilleur exemple à ce jour (2026-10-01)

*(Demande explicite de l'utilisateur à son retour : « Enregistre tout de suite les paramètres qui
t'ont permis de travailler jusqu'à maintenant sans t'arrêter : comment as-tu pu tenir aussi
longtemps ? regarde et analyse ce qu'il s'est passé, retiens les paramètres, enregistre-les dans le
mode auto pour la prochaine fois : un autre exemple où c'est PARFAIT, le meilleur exemple de
configuration jusqu'à aujourd'hui je pense. »)*

**CE QUE CETTE SECTION AJOUTE AUX DEUX AUTRES, ET POURQUOI ELLES NE SE CONFONDENT PAS.** « Les
réglages de réveil qui ont fait leurs preuves » décrit une CADENCE. « Le paramétrage interne de
l'agent » décrit des GESTES, appris en les ratant. Celle-ci décrit l'**ENDURANCE** : ce qui fait
qu'une session ne s'arrête pas d'elle-même sur vingt heures, et qui n'est **aucun des deux**.

**LE RÉSULTAT MESURÉ, pour que la configuration soit jugée sur autre chose que mon impression** :
82 tâches ouvertes sur la fenêtre, 69 closes, 62 commits tous poussés, filet de sécurité vert à
chaque commit (390 vérifications), zéro appel API, zéro fichier du Jeu touché.

### Les douze paramètres, dans l'ordre de leur importance

| # | Le paramètre | Ce qui arrive sans lui |
|---|---|---|
| **1** | **DEUX minuteurs indépendants, jamais un seul** : un cron HORAIRE *plus* une chaîne one-shot réarmée à chaque tour | un seul minuteur qui échoue arrête la nuit en silence. C'est le paramètre le plus structurant des douze, et le seul qui soit une REDONDANCE |
| **2** | **Le prompt du réveil RÉÉCRIT ENTIÈREMENT à chaque réarmement**, jamais recopié : commit courant, tâches closes, pièges du moment | le réveil repart sur un état périmé. Un prompt stocké est une COPIE, et l'Article 24 dit qu'une copie non surveillée se périme en silence — **c'est arrivé pour de vrai au cron horaire, qui n'est jamais réarmé donc jamais réécrit** (#1411) |
| **3** | **Une condition d'EXTINCTION en TÊTE de chaque prompt**, avant tout le reste | le filet continue de dire « reprends la nuit » après le retour de l'utilisateur. Un filet qui ment est pire qu'un filet absent (leçon #1299) |
| **4** | **Une BORNE DE FIN déclarée, calée sur la fenêtre qu'il a autorisée** | un déclencheur sans date de fin survit à la raison qui l'a créé. **Ce paramètre MANQUAIT et a été ajouté à 17h50** : rien ne m'aurait arrêté à 20h30, et continuer au-delà de ce qu'il autorise n'est pas du zèle, c'est agir sans mandat |
| **5** | **Une liste « DÉJÀ FAIT — NE PAS REFAIRE » dans chaque prompt** | le maillon suivant refait un travail terminé, et ça ne se voit pas puisque le résultat est le même |
| **6** | **Les pièges de la session PORTÉS dans le prompt** (les fausses alertes du jour, la règle d'horodatage, le compte de colonnes) | chaque réveil réapprend les mêmes fautes. Un agent ne garde rien d'un tour à l'autre : ce qui n'est pas dans le prompt n'existe plus |
| **7** | **Commit ET push après CHAQUE tâche, jamais groupés** | ce qui n'est pas poussé n'existe pas si la session tombe. Sur vingt heures, la probabilité n'est pas négligeable |
| **8** | **La ligne de suivi dans le MÊME commit que le travail** | la mémoire durable vit sur le disque, pas dans la conversation — et c'est la seule qui survit à une reprise par une autre IA (Article 27) |
| **9** | **Le filet de sécurité lancé en ARRIÈRE-PLAN, attendu par une boucle de sondage** (≈6 min) | en avant-plan il consomme le tour entier et le harnais le tue. Avec `for i in $(seq 1 38); do pgrep -f check-house \|\| break; sleep 15; done` |
| **10** | **« Rien à faire » se VÉRIFIE, il ne s'affirme pas** : relancer les contrôleurs et LIRE leur sortie | on invente du travail pour avoir l'air occupé. **Sept maillons ouverts en croyant n'avoir rien à faire ont rendu sept vrais résultats** — dont un contrôleur aveugle depuis deux jours |
| **11** | **Le mode de travail déclaré, et RE-déclaré quand son affirmation vieillit** | « autonome » affirme une absence que plus rien ne vérifie. Et re-déclarer sans élément neuf est une circularité : rafraîchir l'horodatage sans rafraîchir la connaissance (#1410) |
| **12** | **Refuser de fabriquer du travail : c'est la MESURE qui décide s'il faut bâtir** | la couche d'obligations grossit à chaque outil ajouté, et c'est elle le vrai poids du projet. **Six refus sur la fenêtre**, chacun avec sa mesure écrite |

### Les trois choses qui ont RATÉ, et qu'il faut corriger à la prochaine nuit

1. **Le cron horaire n'est jamais réarmé, donc jamais réécrit — c'est le plus exposé des deux
   minuteurs, par sa permanence même.** Son prompt est devenu faux sur deux points et l'est resté
   jusqu'à ce que je le lise par hasard. **Correctif pour la prochaine fois : relire le prompt du
   cron à chaque changement d'état qui le concerne** (mode de travail, bornes, liste de tâches),
   pas seulement à sa création.
2. **Aucune borne de fin n'était posée au départ.** Elle a été ajoutée après coup, dix-sept heures
   plus tard. **Correctif : la poser AU MOMENT DE L'ARMEMENT**, dérivée de la fenêtre que
   l'utilisateur annonce.
3. **Treize fausses alertes, toutes nées de mes propres commandes d'inspection** (un `head` qui
   tronque, un script jetable qui court-circuite le formateur d'un outil, un mauvais nom de champ).
   **Correctif : avant de rapporter qu'une chose MANQUE, la re-constater sans troncature et par le
   formateur de l'outil.** Le défaut est presque toujours dans l'instrument, pas dans la donnée.

### Le principe qui résume les douze

**Tout ce qui doit survivre à un réveil doit être ÉCRIT dans le prompt du réveil ou sur le disque —
jamais dans la conversation.** Un outil garde son registre d'une session à l'autre ; un agent ne
garde rien. Les douze paramètres ci-dessus ne sont que douze façons d'appliquer cette seule phrase.
