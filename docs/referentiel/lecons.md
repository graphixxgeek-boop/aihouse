# Leçons transverses — ce que le projet a appris, et qui ne tient à aucun outil

**Pourquoi ce document existe** *(2026-09-23, question de l'utilisateur : « quand tu fais des
trouvailles bonnes à retenir [...] il faut que tu l'écrives quelque part, c'est déjà le cas ? »)*.

**La réponse honnête, ce jour-là, était NON.** Les leçons du projet vivaient dispersées dans des
commentaires de code, quelques lignes de suivi et un ou deux registres d'outils — chacune **locale à
l'outil qui l'avait apprise**. Une leçon trouvée en travaillant sur un détecteur de duplication ne
pouvait pas servir le jour où le même piège se présentait dans un tout autre coin du projet.

C'est le défaut que ce paysage traque partout ailleurs, appliqué à sa propre connaissance : une
trouvaille écrite quelque part que rien ne fait relire.

**Ce que ce document N'EST PAS.** Ce n'est ni la charte (qui ordonne), ni le référentiel technique
(qui décrit le code réel), ni le suivi (qui trace l'avancement). C'est ce qu'on a **appris en se
trompant** — formulé pour être réutilisable, y compris sur un autre projet.

**DEUX SECTIONS, JAMAIS UNE SEULE LISTE** *(2026-09-23, tranché par l'utilisateur : le registre
couvre « les leçons, les bonnes pratiques »)*. Les deux vivent dans ce même document — les séparer en
deux fichiers garantirait qu'on n'en relise qu'un — mais jamais dans la même liste :

- **Les LEÇONS (L1, L2…)** ont été payées par une erreur réelle. C'est ce qui les rend crédibles, et
  les diluer parmi des conseils sans casse derrière leur ferait perdre exactement ça.
- **Les BONNES PRATIQUES (BP1, BP2…)** sont des réflexes qui marchent, sans qu'aucune erreur ne les
  ait forcément provoqués. Elles n'ont pas à être payées pour valoir.

**Critère d'entrée commun, volontairement exigeant** : l'entrée doit valoir **au-delà du cas qui l'a
révélée**. Une observation ponctuelle va dans le suivi ; une règle qui ordonne va dans la charte. Un
registre qui accueille tout devient un journal que personne ne relit — donc précisément le problème
qu'il prétend résoudre.

**LE BUT N'EST PAS D'ENREGISTRER, C'EST D'APPLIQUER** *(objectif principal posé par l'utilisateur :
« que tu mettes en pratique ces leçons et bonnes pratiques, en plus de t'auto-analyser »)*. Un
registre relu une fois par Ronde ne change pas la façon de travailler du mardi suivant. D'où les
deux champs que porte chaque entrée, et qui ne sont pas décoratifs :

- **Terrain** — dans quelles situations elle mord. C'est ce qui permet de la faire remonter AU BON
  MOMENT (avant la tâche via tool-brain, et au commit) plutôt que de servir les huit à chaque fois,
  ce qui reviendrait à n'en servir aucune.
- **Porté par** — le mécanisme réel qui la fait tenir quand plus personne ne s'en souvient, ou la
  déclaration écrite qu'aucun n'est possible, avec sa raison.

**Le process qui fait vivre ce document** s'appelle **XP-IA-bonnes-pratiques-et-lecons** (nom donné
par l'utilisateur) : il est enregistré chez god-of-all-process comme les cinq autres, décrit dans
`docs/xp-ia-process-detail.md`, et sa conduite est surveillée par angel-of-ia-process — qui refuse
d'être au vert tant que la question « y avait-il quelque chose à retenir ? » n'a pas reçu de réponse
aux moments déclencheurs. **« Rien à retenir cette fois » est une réponse valable**, et ne compte
jamais contre personne : exiger une trouvaille à chaque passage ferait écrire pour se taire.

**REGROUPER ET FUSIONNER, SANS JAMAIS PERDRE** *(2026-09-23, demande de l'utilisateur : « la
capacité de l'outil à regrouper les leçons si elles sont équivalentes, à les fusionner si besoin,
sans perdre la valeur, TOUJOURS, mais pour rendre les choses plus efficaces »)*. Un registre grossit
entrée par entrée, chacune écrite le jour où son erreur a fait mal — donc sans vue d'ensemble. Deux
entrées finissent par dire la même chose sous deux angles, et **le coût n'est pas l'encombrement :
c'est que le rappel en sert DEUX là où une seule suffirait**, ce qui consomme le plafond et évince
une entrée vraiment différente.

L'outil `groupesEquivalents()` repère ces doublons — il faut que le TERRAIN se recouvre **et** que la
formulation se recouvre, parce que deux entrées peuvent parler des tests sans rien avoir en commun
(L3 interdit de dépendre d'un défaut, BP3 interdit d'assouplir une assertion). Il **propose**, il ne
fusionne jamais tout seul. Trois garanties, vérifiées par des tests et non promises :

1. **La fusion est une UNION**, jamais un choix entre deux textes : les deux terrains, les deux
   porteurs, les deux provenances survivent.
2. **L'identifiant absorbé ne disparaît pas.** Il garde sa section, réduite à un renvoi
   (`**Fusionnée dans** : L4`), pour qu'un commentaire de code ou une ligne de suivi qui le cite
   mène encore quelque part. Un identifiant supprimé serait une **référence morte** — exactement le
   « porteur fantôme » que ce registre traque par ailleurs.
3. **Fusionner une leçon avec une bonne pratique déclenche un avertissement** : ce qui les distingue
   (l'une a été payée, l'autre non) est précisément ce que la fusion effacerait.

**SORTIR DU REGISTRE EST POSSIBLE, ET MESURÉ** *(2026-09-23)*. Chaque remontée est comptée. Une
entrée jamais remontée après assez d'occasions est du **poids mort** ; une entrée qui remonte souvent
et n'est jamais jugée appliquée **ne sert visiblement à rien telle qu'elle est écrite**. Les deux
sont signalées comme « à trancher », jamais corrigées d'office : retirer ou fusionner une entrée est
une décision sur ce que le projet garde. Le compteur ne juge jamais une entrée avant qu'elle ait eu
assez d'occasions **depuis sa propre arrivée** — sinon une entrée écrite ce matin hériterait du passé
de toutes les autres et serait condamnée avant d'avoir vécu.

**Qui juge qu'une entrée a été réellement APPLIQUÉE, et pas seulement lue : l'utilisateur, à la
Ronde.** Décision explicite, cohérente avec ce qu'il avait déjà posé sur la propreté d'une Ronde
(« c'est moi à la fin qui te dis si elle est propre »). Me déclarer moi-même conforme sur mon propre
travail serait le défaut que tout ce dispositif combat.

---

## L1 — Une règle écrite que rien ne fait respecter, et une règle appliquée que rien n'a écrite

Deux défauts opposés, et il faut les nommer séparément parce qu'ils ne coûtent pas la même chose :

- **Écrite dans le document, absente du contrôleur** → on croit qu'elle tient. Rien ne la tient.
  C'est une illusion de sécurité, et elle est pire que l'absence de règle : on ne surveille plus.
- **Appliquée par le contrôleur, écrite nulle part** → elle tient tant que celui qui l'a posée est
  là, **et pas une session de plus**. Personne ne saura pourquoi elle existe, donc quelqu'un la
  retirera en toute bonne foi.

*Trouvée le 2026-09-23 en câblant la vérification process ↔ contrôleur de process : 28 écarts réels, dans les deux
sens.*

**Porté par** : `etatConnexionProcessGardien()` (`scripts/god-of-all-process.mjs`) — il parcourt chaque process dans les DEUX sens et nomme lequel des deux défauts il a trouvé.

**Terrain** : quand j'écris une règle dans un document, ou un contrôle dans un outil · mots : règle, document, process, contrôleur, garde-fou, charte · fichiers : docs/*-process-detail*, scripts/*-process-guardian.mjs, scripts/god-of-all-process.mjs, CLAUDE.md

## L2 — Un mécanisme qui ne sort pas du script est une intention

Un détecteur qui calcule sans imprimer, un texte produit sans être gardé, un verdict gardé sans être
lu : trois formes du même défaut. **Le plus coûteux n'est pas le mécanisme oublié, c'est le mécanisme
demandé, construit, documenté, revendiqué — et muet.** Un commentaire qui affirme « c'est vérifié »
sans rien derrière fait activement plus de mal que le silence.

*Trouvée sept fois dans la même journée, le 2026-09-23. La septième répondait à une demande explicite
de l'utilisateur, faite le matin même.*

**Porté par** : `findDetecteursMuets()` (`scripts/pure-gold-unity.mjs`) — tout détecteur qui n'est appelé de nulle part est nommé à chaque passage.

**Terrain** : quand je construis un détecteur, un calcul ou un verdict · mots : détecteur, mécanisme, rapport, outil, vérification · fichiers : scripts/*.mjs

## L3 — Un test ne doit jamais exiger qu'un défaut PERSISTE

Un test écrit pour prouver qu'un outil trouve du vrai, en s'appuyant sur un défaut réel du dépôt,
devient un frein le jour où on corrige ce défaut. Ce qui doit être vérifié est la **logique** de
l'outil, jamais l'état momentané du projet : implémentations injectées, témoins synthétiques.

*Apprise le 2026-09-23, puis reproduite par le même agent deux heures plus tard sur un autre test.
Une leçon comprise n'est pas une leçon acquise.*

**Porté par** : **aucun mécanisme, et cette impossibilité est déclarée ici plutôt que tue.** Reconnaître automatiquement « ce test s'appuie sur un défaut réel du dépôt » demanderait de deviner l'intention d'une assertion ; toute tentative produirait du bruit sur les tests légitimes, donc exactement le défaut de L4. Cette leçon ne tient qu'à ce texte — c'est la protection la plus faible du registre, et elle est la seule.

**Terrain** : quand j'écris ou je modifie un test · mots : test, assertion, check-house, couverture · fichiers : scripts/check-house.mjs

## L4 — Un garde-fou qui accuse à tort cesse d'être lu

Un détecteur trop étroit qui signale les conformes se fait ignorer aussi sûrement qu'un détecteur
absent — et il coûte en plus la confiance. **Face au choix, un garde-fou doit sous-estimer plutôt
que sur-accuser** : rater des cas est réparable, produire du bruit ne l'est pas.

Corollaire : avant de qualifier une trouvaille de défaut, **vérifier que ce n'est pas une décision
déjà prise et documentée ailleurs**. Reprocher une décision assumée est la pire forme de faux positif.

*Trouvée cinq fois le 2026-09-23 : chaque nouveau détecteur a dû être resserré, certains deux fois.*

**Enrichie le** : 2026-09-23 — un signal qui permet de s'en apercevoir AVANT de publier (trouvé en construisant THE-EQUALIZER ; la leçon d'origine et sa trace ci-dessus restent intactes).

Ce signal : **quand un détecteur accuse presque tout, c'est
presque toujours lui qui a tort.** Un premier jet accusait 17 outils sur 33 ; le chiffre lui-même
était l'alerte, bien avant le détail. Vérifier avant de rapporter coûte deux minutes, publier un
rapport entièrement faux coûte la confiance qu'on met dans l'outil — et cette confiance est tout
son capital.

**Porté par** : `SANS_BLUEPRINT_ASSUME` / `SANS_CONSTAT_PROPRE` (`scripts/safe-export.mjs`, `scripts/report-template.mjs`) — les exemptions décidées sont déclarées comme données, jamais reprochées à chaque passage.

**Terrain** : quand je construis ou je resserre un garde-fou · mots : garde-fou, détecteur, faux positif, seuil, exemption · fichiers : scripts/*.mjs

## L5 — Distinguer « je n'ai rien trouvé » de « je n'ai pas pu regarder »

Les deux se ressemblent dans un rapport, et ne veulent pas du tout dire la même chose. Un outil
lancé sans les données qu'il lui faut doit **dire l'absence de mesure**, jamais rendre un vert.
Corollaire : jamais un pourcentage calculé sur un dénominateur vide.

Troisième état à ne pas oublier non plus : un élément **non mesurable** (illisible, absent) ne doit
jamais être compté conforme — il casse le verdict.

*Payée le 2026-09-22, à la fenêtre de clôture de la Ronde, sur TROIS chiffres verts de cette Ronde
même : « 100 % d'investissement réel » calculé sur 2 actions parmi 18, « 0 tension » trouvée sur un
texte fondateur enrichi cinq fois, et une couverture annoncée alors que trois
Gardiens sacrés du code n'avaient pas regardé. Aucun des trois n'était un mensonge ; les trois étaient des verts non
représentatifs, ce qui est pire, parce qu'on ne les vérifie pas.*

*(Trace ajoutée le 2026-09-23 : cette entrée était la seule du registre à n'avoir aucune trace
d'origine, et l'absence a été trouvée par la couche de remise à niveau — une leçon sans le coût qui
l'a produite se lit comme un conseil, pas comme une leçon.)*

**Porté par** : `relanceCircleTasks()` (`scripts/circle-tasks.mjs`) — un compte illisible rend `mesurable: false`, jamais un retard de zéro.

**Terrain** : quand un outil annonce un nombre, un pourcentage ou un verdict · mots : mesure, compteur, pourcentage, verdict, couverture, note · fichiers : scripts/*.mjs

## L6 — Une alarme permanente ne se contente pas d'être ignorée, elle fait dépenser du travail

Un avertissement qui revient à chaque passage sur des cas déjà tranchés finit par provoquer une
enquête complète sur des questions déjà réglées. **Le coût d'un garde-fou sans mémoire n'est pas le
bruit : c'est le travail re-payé.** Un outil doit se souvenir de ses propres verdicts — et ne se
taire que sur ce qu'un humain a explicitement écarté, jamais de sa propre initiative.

*Trouvée le 2026-09-23 : un bandeau affiché pendant trois jours a fait rouvrir une enquête close.*

**Porté par** : `filtrerDejaTranches()` + `loadMemoire()` (`scripts/safe-export.mjs`) — un cas qu'un humain a explicitement écarté ne redemande plus de travail.

**Terrain** : quand un outil affiche un avertissement qui peut revenir · mots : alerte, bandeau, rappel, mémoire, signal, avertissement · fichiers : scripts/hooks/*.mjs

## L7 — Une intention écrite n'a jamais empêché quoi que ce soit

Un commentaire qui promet « jamais une copie de plus », une note qui dit « à garder aligné avec X » :
ce sont des intentions, jamais des mécanismes. Elles ne survivent pas au changement de session.
**Seul un test, un garde-fou ou un rappel automatique porte réellement une obligation.** Quand aucun
mécanisme n'est possible, l'écrire noir sur blanc EST la protection — et cette impossibilité se
déclare, elle ne se tait pas.

*Trouvée le 2026-09-23 : un commentaire se félicitait de ne pas faire « une 4e copie » d'un
chargeur, pendant que sept copies naissaient ailleurs.*

**Porté par** : `findScriptsMissingFromAgentFiles()` (`scripts/axa-check.mjs`) — le garde-fou qui a remplacé un commentaire promettant de tenir une liste alignée à la main.

**Terrain** : quand j'écris un commentaire qui promet quelque chose, ou une liste tenue à la main · mots : commentaire, intention, liste, synchronisation, aligné, à garder · fichiers : scripts/*.mjs

## L8 — Ce qui est fragmenté paraît faux, même quand tout est vrai

Un outil qui rapporte 29 alertes pour 14 problèmes réels n'a produit aucun faux positif — et sera
pourtant pris pour du bruit. **Compter des symptômes plutôt que des problèmes suffit à discréditer
une mesure exacte.** Regrouper n'est donc pas du confort de lecture : c'est ce qui rend la mesure
utilisable.

*Trouvée le 2026-09-23 : zéro faux positif sur l'échantillon vérifié, et un soupçon légitime de
l'utilisateur sur la crédibilité de l'ensemble.*

**Porté par** : `fusionnerClusters()` + `motifDuCluster()` (`scripts/clone-hunter.mjs`) — les alertes qui se recouvrent deviennent un problème compté une fois, avec son motif.

**Terrain** : quand un outil compte des alertes ou des constats · mots : alerte, compte, regroupement, cluster, rapport, doublon · fichiers : scripts/clone-hunter.mjs, scripts/hooks/*.mjs

## L9 — Un livrable intermédiaire peut coûter plus cher que pas de livrable du tout

Rendre compte est un réflexe de rigueur. Dans un contexte où personne ne peut répondre, c'est
l'inverse : **le compte rendu arrête le travail, et il l'arrête en ayant l'air sérieux.** C'est ce
qui le rend difficile à repérer — il est écrit, honnête, souvent bien fait, et rien dans sa forme ne
dit qu'il vient de coûter des heures.

Le test qui tranche : *est-ce que quelqu'un peut répondre à ce que je m'apprête à écrire ?* Si non,
ça ne se dit pas, ça **s'écrit dans le suivi** et le travail continue.

**Terrain** : quand je m'apprête à rendre compte sans qu'on me l'ait demandé · mots : point d'étape,
rendre compte, résumé, bilan, autonome, nuit · fichiers : docs/mode-auto-process-guardian.md

**Porté par** : `findArretPremature()` (`scripts/god-of-all-process.mjs`) — il compare les chantiers
du plan aux chantiers réellement clos et nomme l'arrêt prématuré, avec son responsable.

*Payée le 2026-09-23 : arrêt au milieu d'une nuit autonome, utilisateur réveillé pour relancer,
perte de temps qualifiée par lui de « conséquente ». Le défaut était dans le process autant que dans
l'agent — rien n'interdisait cet arrêt.*

## L10 — Une vérification qui partage le filtre de ce qu'elle vérifie ne vérifie rien

Le piège est invisible parce que les deux moitiés sont écrites dans la foulée, par la même personne,
avec la même idée en tête. Le script de conversion ne traitait que les lignes dont le numéro était
un chiffre ; le contrôle a compté les valeurs restantes **avec le même filtre**. Il a donc annoncé
« zéro valeur ancienne » en toute bonne foi, alors que 50 lignes n'avaient jamais été regardées.

**Une vérification doit venir d'un autre angle que le travail qu'elle contrôle.** Compter ce qu'on
vient d'écrire avec la règle qui l'a écrit ne mesure que la cohérence interne du script, jamais la
réalité. Le contrôle qui a fini par dire la vérité était un simple `grep` sur tout le dossier,
ignorant tout des colonnes et des numéros.

Corollaire : **compter ce qu'on ne sait pas traiter** est ce qui sauve. C'est ce comptage, et lui
seul, qui a révélé les valeurs inconnues puis les lignes mal formées.

**Terrain** : quand j'écris un script qui transforme des données ET le contrôle qui le valide · mots : conversion, migration, vérification, contrôle, compter, filtre, restant · fichiers : scripts/*.mjs

**Porté par** : **aucun mécanisme** — rien ne peut constater que deux bouts de code partagent une
hypothèse. Seule la discipline de vérifier depuis un autre angle le porte. Déclaré plutôt que tu.

*Payée le 2026-09-23 : conversion de l'échelle de priorité. Le premier contrôle disait 0 valeur
restante ; il en restait 50, dont une ligne à qui il manquait carrément une colonne depuis trois
jours, ce qui la comptait comme ouverte sans que personne ne le sache.*

## L11 — Un motif qui ne peut PAS matcher ressemble à un motif qui ne matche pas

Une recherche de texte qui ne trouve jamais rien a deux causes indiscernables à la lecture : soit le
cas ne se présente pas, soit **le motif est impossible**. La seconde est silencieuse par nature —
le code paraît juste, il tourne, il ne signale rien.

Le cas concret : en JavaScript, la frontière de mot `\b` se calcule sur l'alphabet anglais. Devant un
caractère accenté, elle ne peut jamais s'ouvrir. `\bà chaque commit` est donc un motif **mort à
l'écriture** — et il avait toutes les apparences d'un motif soigné.

**Le geste qui l'attrape** : tout motif neuf se vérifie sur un exemple qui DOIT matcher, avant d'être
considéré comme écrit. C'est BP2 appliquée aux expressions régulières — un motif qu'on n'a jamais vu
mordre ne prouve rien.

**Terrain** : quand j'écris une recherche de texte, surtout en français · mots : motif, regex, expression, détecter, chercher, frontière, accent · fichiers : scripts/*.mjs, lib/*.ts

**Porté par** : **aucun mécanisme général** — reconnaître qu'un motif est impossible demanderait de
l'exécuter sur un échantillon qu'on n'a pas. Un garde-fou ponctuel existe cependant : un `grep` sur
`\\b` suivi d'un accent trouve la forme exacte de ce bug, et il a été passé sur tout le dépôt le jour
de sa découverte — zéro autre occurrence.

*Payée le 2026-09-23, attrapée par un test écrit dans la foulée. La remise à niveau du reste du code
a été faite le jour même : le seul autre résultat était du texte narratif, jamais un motif.*

---

# Bonnes pratiques

*(Section ouverte le 2026-09-23. Même document que les leçons, jamais la même liste : une bonne
pratique n'a pas été payée par une erreur, et c'est la seule chose qui la distingue. Trois entrées
au départ, toutes observées réellement sur ce projet — jamais des conseils génériques recopiés.)*

## L12 — Un analyseur qui DEVINE saute en silence ; il doit refuser à la place

Quand un outil lit un document pour en tirer une structure, la tentation est de déduire ce dont il
a besoin de la prose (« le premier mot en majuscules du titre »). Ça marche sur les cas d'écriture
du jour, puis un titre légèrement différent arrive : l'outil ne reconnaît rien, **saute la section,
et rend un rapport d'apparence parfaitement normale auquel il manque une partie**.

C'est plus grave qu'une erreur bruyante, parce que rien ne distingue le rapport amputé du rapport
complet. Deux règles, ensemble et jamais l'une sans l'autre :

1. **Le document porte un marqueur explicite** à un emplacement fixe, que l'outil LIT — jamais une
   forme qu'il doit interpréter. Un marqueur oublié devient alors lui-même un écart signalé.
2. **L'analyseur refuse bruyamment** ce qu'il ne sait pas nommer. Sur un outil dont le métier est
   justement de repérer ce que personne ne vérifie, sauter une section en silence est le pire
   défaut possible.

Corollaire, qui ferme l'autre moitié du trou : quand une structure lue se rattache à une
classification (un domaine, une famille, un rang), **tout élément qui ne se rattache à rien doit
être crié**. Sans ça il n'est pas « en défaut », il n'est nulle part — donc jamais manquant.

*Payée le 2026-09-23 : un titre en prose (« NIVEAU 2 — SES PROPRES documents ») a fait lire « SES »
comme nom de niveau, et 7 exigences sur 29 ont disparu du rapport sans le moindre signe extérieur.*

**Porté par** : `MOTIF_NIVEAU` et l'erreur levée par `parseStandards()` (`scripts/the-equalizer.mjs`), plus la ligne « NIVEAUX ORPHELINS » de `formatANiveau()` — un titre illisible arrête l'outil, un niveau non rattaché est crié.

**Terrain** : quand un outil lit un document normatif pour en tirer une structure · mots : parser, analyser, lire le document, titre, section, rattacher, classification, catalogue · fichiers : scripts/*.mjs, docs/referentiel/*.md

## L13 — Une preuve satisfaite par le registre vide qu'elle doit remplir ne prouve rien

Quand une étape déclare pour preuve « un fichier existe dans tel dossier », et que ce dossier
contient déjà son propre `index.md` d'inauguration, **l'étape est comptée comme faite le jour de sa
création** — avant que quoi que ce soit n'ait eu lieu.

Ce qui rend ce défaut particulièrement discret : les deux pièces sont irréprochables prises
séparément. Le registre est honnête (il écrit noir sur blanc « aucun constat encore produit »), le
contrôleur est honnête (il cherche bien un fichier réel sur le disque). C'est leur COMBINAISON qui
ment, et aucune relecture de l'un ou de l'autre ne peut le voir.

La règle : une preuve doit exiger un **artefact de travail** (daté, nommé par ce qu'il rapporte),
jamais un fichier quelconque du dossier. Corollaire du même esprit : un registre qui n'a jamais rien
reçu doit rester reconnaissable comme tel, parce que c'est cette reconnaissance-là qui distingue le
premier jour du centième.

*Payée le 2026-09-23 : memory-audit était compté comme exécuté à chaque simulation depuis sa
création, sans avoir jamais tourné une seule fois. Vérification faite ensuite sur les onze étapes
prouvées de cette façon — deux étaient dans ce cas, pas une.*

**Porté par** : **aucun mécanisme pour l'instant, et c'est déclaré plutôt que tu.** Resserrer les preuves demanderait de toucher aux étapes de process, ce que l'enquête de chantier 11 s'était explicitement interdit (aucun changement). La correction est proposée à l'utilisateur dans `docs/plans/memory-audit-enquete-2026-09-23.md` (option C) ; tant qu'elle n'est pas tranchée, cette leçon ne tient qu'à ce texte.

**Terrain** : quand je déclare la preuve d'une étape de process, ou quand je crée un registre neuf · mots : preuve, étape, process, registre, index, dossier, tracée · fichiers : scripts/god-of-all-process.mjs, docs/*-process-detail*

## L14 — Une leçon rappelée à chaque lancement, et jamais portée par le code, ne protège de rien

Le contrôleur du process de simulation affiche, en tête de sa sortie et AVANT chaque lancement :
« la phase 2 doit intercaler de vrais tours autonomes entre les messages humains — le second acte du
jeu n'a jamais eu lieu, deux fois ». Cette phrase a été lue, à voix haute, juste avant le lancement.
**Le défaut s'est reproduit exactement.**

Parce que le rappel s'adressait à un humain (ou à un agent) pendant qu'un SCRIPT faisait le travail.
Le script, lui, enchaînait vingt messages d'affilée depuis toujours — et aucun rappel, si bien placé
soit-il, ne change ce qu'un script exécute.

**Pire : un garde-fou mécanique existait bel et bien** (`checkPhase2Autonomy()`, écrit après
full_sim18). Il a parfaitement fonctionné — il a signalé le défaut. APRÈS la simulation, sur son
journal. Détecter n'est pas empêcher, et quand l'action détectée coûte une heure de simulation, la
différence entre les deux est la simulation entière.

**La règle** : quand une leçon porte sur ce que fait un MÉCANISME, elle doit vivre DANS ce mécanisme.
Un avertissement au moment de lancer ne protège que ce qui est décidé à ce moment-là ; tout ce que le
code décide tout seul lui échappe. C'est L7 (« une intention écrite n'a jamais empêché quoi que ce
soit ») dans sa version la plus coûteuse, parce qu'ici l'intention était écrite, affichée, et LUE.

Corollaire opérationnel : devant un rappel avant action, se demander « qui l'exécute réellement,
moi ou un script ? ». Si c'est un script, le rappel est au mauvais endroit.

*Payée trois fois, la dernière le 2026-09-23 : full_sim16, full_sim18, full_sim19. Trois simulations complètes dont le deuxième
acte du jeu n'a jamais pu se produire — pas « ne s'est pas produit », n'a pas PU.*

**Porté par** : `doitIntercalerUnTourAutonome()` (`scripts/run-simulation.mjs`) — la leçon vit désormais DANS le mécanisme qu'elle concerne, jamais seulement dans le rappel qui le précède, et elle porte un nom pour qu'on puisse vérifier qu'elle existe encore.

**Terrain** : quand un contrôleur me rappelle une règle avant une action exécutée par un script · mots : rappel, avant lancement, leçon, contrôleur, script, phase 2, simulation · fichiers : scripts/run-simulation.mjs, scripts/process-simulation-guardian.mjs

## L15 — Une suite de tests verte ne prouve pas qu'un outil tourne encore

Le 2026-09-23, le renommage d'un champ lu partout (`n` → `numero`, `sensibilite` → `criticite` dans
les lignes de tâche) a demandé **neuf passages de tests successifs**. Chacun a révélé un endroit de
plus où le numéro était lu sous son ancien nom — jamais deux fois le même, aucun trouvable par
relecture. C'est déjà un enseignement : un renommage « simple » sur un champ lu partout ne l'est pas.

**Mais le vrai piège est après le neuvième passage.** La suite était verte, et ça ne disait rien des
outils : un script dont aucun test ne traverse le `main()` peut planter au premier lancement réel
pendant que 202 assertions restent au vert. Le seul contrôle qui valait quelque chose a été de
relancer les sept outils qui lisent ces lignes, un par un, contre le vrai dépôt.

Le même piège avait déjà mordu ce jour-là, dans l'autre sens : une constante introduite en haut d'un
module levait une `ReferenceError` selon l'ORDRE d'import des modules. Les tests chargeaient
toujours l'ordre qui marche ; l'outil, lui, chargeait l'autre.

**La règle** : après une modification transverse, la suite verte est le point de départ de la
vérification, jamais sa conclusion. Relancer les consommateurs réels fait partie du changement, pas
du zèle. C'est la version « après coup » de BP4 (un détecteur qui n'a jamais mordu ne prouve rien) et
la contrepartie de l'Article 25 : vérifier son travail veut dire lancer les outils, jamais se relire.

*Payée le 2026-09-23 sur le renommage #584, et le même jour par un bug d'ordre d'import qu'aucun test
ne pouvait voir.*

**Porté par** : **aucun mécanisme possible, et cette impossibilité est déclarée ici plutôt que tue** (ce que L7 prescrit). Rien ne peut lancer « tous les consommateurs réels » d'un changement : la liste dépend de ce qui vient d'être touché, un outil qui la devinerait se tromperait dans les deux sens, et lancer tous les scripts à chaque commit coûterait plus que le défaut. La protection est l'obligation écrite, même limite honnête que tool-brain et SMART-CONSO-TOKEN.

**Terrain** : après un renommage, une extraction ou un changement de signature partagée · mots : renommage, champ, transverse, refactor, signature, appelants · fichiers : scripts/criticite.mjs, scripts/check-tasks-details.mjs, scripts/check-suivi-fidelity.mjs, scripts/circle-tasks.mjs

## L16 — Un test qui invente son entrée ne peut pas voir un désaccord avec le vrai producteur

Le rendu HTML des transcripts de simulation était couvert par cinq assertions, toutes vertes. Il
produisait pourtant, depuis deux simulations, une page parfaitement vide : feuille de style
complète, `<main></main>`, pas une réplique.

**Le test fabriquait son propre transcript au format que la fonction attend** — quatre lignes avec
une heure. Les scripts de simulation, eux, en produisaient trois, sans heure, depuis full_sim18. Le
parseur sautait donc chaque groupe. Les deux moitiés étaient cohérentes avec elles-mêmes et en
désaccord l'une avec l'autre, et aucun test ne regardait l'espace entre les deux.

**Ce qui a rendu la panne invisible pendant deux simulations** : le fichier EXISTE, et pèse presque
5 ko. Toute vérification qui teste sa présence le compte comme fait. C'est L13 sous une autre forme
— une preuve satisfaite par une coquille — mais le mécanisme est différent et mérite son entrée : là
c'était un registre vide, ici c'est un test qui se parle à lui-même.

**La règle** : quand une fonction consomme ce qu'un autre morceau du système produit, au moins une
assertion doit lire la VRAIE production, pas une reconstitution. Une fixture reste utile pour les
cas limites, jamais pour prouver que le contrat tient.

*Payée le 2026-09-23 : deux transcripts HTML archivés vides (full_sim18, full_sim19), trouvés en
ouvrant le fichier pour noter une simulation, jamais par un test.*

**LA SECONDE CONSÉQUENCE, TROUVÉE LE 2026-09-23 (tâche #585), et elle est pire que la première** :
un test qui invente son entrée ne rate pas seulement un désaccord — il CERTIFIE À TORT qu'un
détecteur est branché. `pure-gold-unity` excuse à juste titre un détecteur que seule la suite de
tests appelle, puisque le crochet pre-commit la lance à chaque commit : il protège vraiment. Cette
excuse ne vaut que si le test le fait tourner CONTRE LE DÉPÔT. `findMecanismesSansRaison()` n'avait
que deux assertions sur deux chaînes littérales : elle comptait donc comme protégée, n'était appelée
par aucun `main()`, et l'exigence qu'elle servait était déclarée « vérifiée par personne » à côté
sans que rien ne rapproche les deux. **La question à se poser n'est donc jamais « ce détecteur
est-il appelé ? » mais « qu'est-ce qu'on lui donne à manger ? »** — une fixture prouve qu'il
fonctionne, seul le vrai dépôt prouve qu'il sert.

**Porté par** : `findTranscriptsSteriles()` (`scripts/le-regisseur.mjs`) — il parcourt les
`_transcript.txt` réellement archivés et nomme ceux dont le parseur ne tire aucun bloc. Une vraie
fonction plutôt qu'une assertion perdue dans la suite de tests : une leçon dont le porteur n'a pas
de nom ne peut pas être vérifiée comme existante. Il grandit tout seul à chaque nouvelle simulation,
sans liste à tenir, et rend « pas mesuré » plutôt que zéro si le dossier devient illisible.

**Terrain** : quand j'écris un parseur, un convertisseur, un lecteur de format, ou un test avec une fixture inventée · mots : parser, format, fixture, rendu, convertir, consommer, producteur · fichiers : scripts/le-regisseur.mjs, scripts/html-report.mjs, scripts/summarize-simulation-log.mjs

## L17 — Le filet de sécurité peut porter en lui le défaut qu'on vient corriger

Le détecteur d'écho branché, la suite de tests est passée au rouge sur une assertion qui n'avait
rien demandé : un tour de chat ORDINAIRE coûtait soudain trois appels au modèle au lieu de deux.
Le détecteur avait raison. **Le stub de test renvoyait, depuis toujours, mot pour mot la même
phrase aux deux personnages** — exactement le défaut que la journée entière servait à corriger,
installé au cœur du mécanisme censé garantir qu'il n'arrive pas.

Personne ne l'avait vu parce que rien ne le regardait : les assertions portaient sur le nombre
d'appels, les intentions, les pièces, jamais sur le fait que les deux répliques du faux modèle
étaient identiques. Le filet vérifiait tout sauf la chose qu'il incarnait.

**Ce qui rend le cas vicieux** : la tentation immédiate était de corriger l'assertion (2 → 3
appels), ce qui aurait été doublement faux — on aurait entériné un surcoût permanent à chaque tour
(Article 8) ET gardé le stub menteur. La bonne correction était à l'autre bout : rendre au stub un
comportement de vrai tour, puis tester l'écho sous son propre drapeau.

**La règle** : quand un nouveau contrôle passe au rouge sur un test qui n'était pas son sujet,
regarder d'abord si le test avait raison. Un faux modèle, une fixture, un jeu de données de test
sont du contenu comme un autre : ils vieillissent, ils mentent, et ils échappent à toutes les
relectures parce qu'on les prend pour de l'échafaudage. C'est le pendant de L16 — là un test qui
invente son entrée, ici un test dont l'entrée inventée porte le bug.

*Payée le 2026-09-23 en câblant la reprise anti-écho (#594) : le stub de `check-house.mjs` faisait
dire la même phrase à Lia et à Noé depuis la création du fichier.*

**Porté par** : **aucun mécanisme possible, et cette impossibilité est déclarée ici plutôt que tue** (ce que L7 prescrit). Aucun outil ne peut
juger qu'une donnée de test est réaliste — cela demande de connaître ce que le vrai producteur
fait, ce qui est précisément ce que le test remplace. Ce qui EST mécanique est déjà couvert
ailleurs : l'assertion « un tour ordinaire coûte exactement deux appels » (`check-house.mjs`)
mordra à nouveau si quelqu'un rend les deux répliques du stub identiques. La leçon, elle, ne vaut
que lue au bon moment — d'où le terrain ci-dessous.

**Terrain** : quand un nouveau garde-fou fait rougir un test qui n'était pas son sujet, ou quand j'ajuste une assertion pour faire passer la suite · mots : stub, fixture, faux modèle, jeu de test, assertion qui casse, ajuster le test · fichiers : scripts/check-house.mjs

## BP1 — La règle s'écrit à UN endroit et se dérive partout ailleurs

Devant vingt endroits à corriger, le réflexe est de corriger les vingt. Le bon geste est de trouver
l'endroit unique dont les vingt dépendent, et de ne toucher que celui-là. Les vingt suivants, ceux
qui n'existent pas encore, en hériteront sans qu'on y pense.

**Terrain** : quand la même correction doit s'appliquer à plusieurs endroits · mots : partout, tous
les outils, chaque rapport, harmoniser, généraliser
*(Aucun terrain par FICHIER déclaré, volontairement : « la même correction à plusieurs endroits » ne se
lit dans aucun chemin en particulier, et un motif large l'attacherait à tout — donc à rien.)*

**Porté par** : l'Article 24 de la charte, et `findScriptsMissingFromAgentFiles()`
(`scripts/axa-check.mjs`) pour le cas où une liste serait quand même recopiée.

*Observée le 2026-09-23 : une seule fonction de date écrite dans le gabarit partagé a mis une
trentaine de rapports à l'heure d'un coup, là où les corriger un par un aurait laissé le suivant
naître faux.*

## BP2 — Un test qui n'a jamais échoué ne prouve rien : le faire échouer exprès d'abord

Un test écrit après coup passe du premier coup, et on en conclut qu'il protège. Il peut tout aussi
bien ne rien vérifier du tout. Avant de croire un test, le voir échouer sur le défaut qu'il est censé
attraper — puis seulement le voir passer une fois le défaut corrigé.

**Terrain** : quand j'écris un test, ou quand je déclare une vérification en place · mots : test, · fichiers : scripts/check-house.mjs
assertion, vérification, couverture, protège

**Porté par** : **aucun mécanisme** — rien ne peut constater qu'un test a échoué avant d'être écrit.
Seule la discipline la porte, et cette impossibilité est déclarée ici plutôt que tue.

*Le corollaire coûteux, vu plusieurs fois : un outil neuf qui n'a jamais tourné contre le vrai dépôt
n'est pas un outil vérifié, c'est une intention (Article 25).*

## BP3 — Quand un test et le code divergent, fournir le FAIT manquant, jamais assouplir l'assertion

Un test qui échoue en ajoutant une étape à un process est presque toujours le test qui a raison :
l'étape manquait vraiment. Baisser l'exigence de l'assertion fait passer le test et laisse le trou.
Le bon geste est de fournir ce que le test réclame.

**Terrain** : quand un test échoue après un changement · mots : test échoue, assertion, seuil, · fichiers : scripts/check-house.mjs
attendu, rouge

**Porté par** : **aucun mécanisme** — la différence entre « l'assertion se trompait de bande » et
« j'ai baissé l'exigence pour avoir vert » ne se lit que dans l'intention. Déclaré plutôt que tu.

*Observée plusieurs fois : « le fait manquant a été fourni plutôt que l'assertion assouplie ». La
seule exception légitime rencontrée était une assertion qui visait réellement le mauvais palier, et
elle a été corrigée dans le test sans jamais déplacer le seuil qu'elle mesurait.*

## BP4 — Un détecteur qui n'a jamais mordu ne prouve rien : le vérifier dans les DEUX sens

Un détecteur neuf qui rend zéro sur le vrai dépôt a deux lectures indiscernables : soit le dépôt est
propre, soit le détecteur ne détecte rien. **Un zéro n'est une bonne nouvelle qu'une fois qu'on a vu
l'outil mordre.** Il faut donc toujours deux épreuves, jamais une :

1. un cas fabriqué qu'il DOIT attraper — sinon on livre un détecteur décoratif ;
2. un cas proche mais légitime qu'il doit LAISSER PASSER — sinon on livre du bruit, et un garde-fou
   qui accuse à tort cesse d'être lu (L4).

**Terrain** : quand je construis ou je livre un détecteur · mots : détecteur, garde-fou, vérifier,
faux positif, zéro, aucun écart · fichiers : scripts/*.mjs

**Porté par** : **aucun mécanisme** — rien ne peut constater qu'un détecteur a été éprouvé dans les
deux sens, seule la discipline le porte. Déclaré plutôt que tu.

*Observée le 2026-09-23 : le détecteur d'entrées équivalentes rendait « 0 groupe » sur le vrai
registre. C'était juste — vérifié ensuite sur des doublons fabriqués, qu'il a bien attrapés, et sur
deux entrées de même terrain mais de sujets différents, qu'il a bien laissées tranquilles. Sans ces
deux épreuves, le zéro n'aurait rien valu.*
