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

**Enrichie le** : 2026-09-25 — la forme la plus insidieuse du faux positif, rencontrée QUATRE fois dans la même journée (la leçon d'origine et son premier enrichissement restent intacts).

Ce n'est plus seulement « le garde-fou accuse à tort » : c'est **le garde-fou punit exactement la
conduite qu'il existe pour obtenir.** Les quatre cas, tous mesurés, jamais soupçonnés :

1. `PORTES_PLAN_DACTION` accusait les deux SEULS outils en règle, parce qu'ils passaient par le
   raccourci documenté plutôt que par la fonction d'origine ;
2. `MOTIF_EMET_DES_CONSTATS` comptait comme un constat la ligne où un outil AVOUE une absence de
   mesure — c'est-à-dire l'honnêteté que ce projet exige partout depuis #206 ;
3. le critère « peut-il dire tout va bien sans rien mesurer » accusait un outil qui obtenait sa
   formulation d'absence du MÉCANISME PARTAGÉ au lieu de la recopier — **un outil devenait suspect
   en cessant de recopier**, l'exact inverse de l'Article 24 ;
4. le critère « rapport trop maigre » accusait un rapport de 11 lignes portant 42 chiffres, parce
   qu'il comptait des lignes là où la densité était la vraie question.

**Pourquoi cette forme est pire que le faux positif ordinaire, et pourquoi elle s'aggrave avec le
temps** : le bruit ordinaire diminue à mesure que le dépôt s'assainit ; celui-ci AUGMENTE. Plus le
projet applique ses propres règles — factoriser un mécanisme, avouer une absence de mesure, écrire
dense — plus le garde-fou crie. Un dispositif qui se met à hurler précisément quand on lui obéit
finit par enseigner qu'il vaut mieux désobéir.

**Le réflexe qui les a tous les quatre attrapés** : ouvrir le fichier accusé avant de le corriger.
Les quatre auraient été « réparés » en quelques minutes, et les quatre réparations auraient dégradé
du code juste.

**Porté par** : `SANS_BLUEPRINT_ASSUME` / `SANS_CONSTAT_PROPRE` (`scripts/safe-export.mjs`, `scripts/report-template.mjs`) — les exemptions décidées sont déclarées comme données, jamais reprochées à chaque passage. Et, depuis le 2026-09-25, `MOTIF_AVEU_DE_NON_MESURE` (`scripts/cassandra-rh.mjs`), `PORTEURS_ABSENCE` (`scripts/pure-gold-unity.mjs`) et `findRapportsCourtsMaisDenses()` (`scripts/doc-report.mjs`) — chacun ferme un cas où la conformité était comptée en faute.

**Terrain** : quand je construis ou je resserre un garde-fou · mots : garde-fou, détecteur, faux positif, seuil, exemption, conforme accusé · fichiers : scripts/*.mjs

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

*(Deuxième occurrence, 2026-09-27, tâche #1045 — et elle nomme le MÉCANISME exact, qui manquait : un
`try/catch` qui avale une exception et rend une liste VIDE. Une entrée du catalogue portait `slug:`
là où le code attend `outils:` ; `checkAgentOnboarding()` levait donc une erreur, l'appelant
l'attrapait, et l'audit d'intégration annonçait tranquillement **0 outil incomplet**. Zéro parce
qu'il avait planté, affiché comme zéro parce que tout va bien. Trouvé en comparant la sortie avant
et après un `git stash`, jamais en relisant le code. **Règle qui en sort** : un `catch` qui rend une
valeur NEUTRE (0, liste vide, `true`) doit rendre un état « pas mesuré » à la place — sinon il
fabrique le seul verdict que personne ne va vérifier.)*

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

**Terrain** : quand je m'apprête à rendre compte sans qu'on me l'ait demandé · mots : point d'étape, rendre compte, résumé, bilan, autonome, nuit, compte rendu · fichiers : docs/mode-auto-process-guardian.md, docs/rapports-de-nuit/*.md

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

**Terrain** : quand un nouveau garde-fou fait rougir un test qui n'était pas son sujet, ou quand j'ajuste une assertion pour faire passer la suite · mots : stub, fixture, faux modèle, jeu de test, assertion qui casse, ajuster le test, contre-test, check-house, assertion, couverture · fichiers : scripts/check-house.mjs

## L18 — Un guide qui dicte une forme précise et fausse coûte plus cher que pas de guide du tout

`integration-outil` existe pour une raison écrite noir sur blanc dans son propre en-tête : éviter
qu'on découvre les oublis « un test après l'autre ». Pour chaque registre à remplir, il donne la
LIGNE EXACTE à écrire. En l'appliquant pour de vrai, la ligne qu'il dictait pour le registre de
fiabilité — `{ niveau: "...", raison: "..." }` — a été refusée par la suite de tests, qui attend
`{ nature: "...", pourquoi: "..." }` depuis toujours.

**Ce qui rend le cas coûteux plutôt qu'anecdotique** : une forme précise inspire confiance. Sans
guide, on serait allé lire le registre et on aurait copié la ligne du voisin, ce qui marche. Avec
un guide faux, on écrit ce qu'il dit, on commit, et le test refuse — exactement le scénario que
l'outil promettait d'éviter, aggravé par le fait qu'on ne soupçonne pas la source.

**La règle** : un outil qui dicte une forme doit la DÉRIVER du registre réel, ou être vérifié
contre lui. Une forme recopiée à la main dans un guide est une copie au sens de l'Article 24, et
elle se périme comme toutes les autres — sauf que celle-ci se périme en silence, puisque rien ne
compare un texte d'aide à la structure qu'il décrit.

*Payée le 2026-09-23 en intégrant MOÏSE-TABLES-DE-LOI : onze registres à remplir, un seul dicté
dans la mauvaise forme, et c'est celui-là qui a fait échouer la suite.*

**Porté par** : `check-house.mjs`, dont l'assertion sur `TOOL_RELIABILITY` exige `nature` et
`pourquoi` — elle a mordu, c'est ainsi que la faute a été trouvée. Le guide lui-même n'est pas
encore dérivé du registre : c'est une dette déclarée plutôt que tue, et le prochain registre dont
la forme changera la rouvrira.

**Terrain** : quand j'applique la ligne exacte donnée par un outil d'aide plutôt que de copier un voisin réel · mots : integration-outil, forme à écrire, registre à renseigner, inscription manuelle · fichiers : scripts/integration-outil.mjs, scripts/lib-shell.mjs

## L19 — Une dérivation ne supporte que l'alphabet qu'on lui a donné par hasard

Le premier outil au nom français de l'Agence a suffi à révéler un défaut présent depuis le début :
`slugifyAgentName()` filtrait sur `[^a-z0-9]`, si bien que « MOÏSE-TABLES-DE-LOI » donnait le slug
`mo-se-tables-de-loi`. Le « ï » ne devenait pas « i », il devenait un séparateur. L'audit
d'intégration cherchait alors six fichiers qui n'existeraient jamais et déclarait l'outil
incomplet — alors qu'il était complet.

**Ce qui rend le cas instructif** : le projet travaille EN FRANÇAIS depuis toujours. Ce n'est pas
un cas limite exotique, c'est le cas normal, et il n'avait jamais mordu uniquement parce que les
trente-cinq outils précédents portaient par hasard des noms sans accent. Une dérivation qui n'a
jamais rencontré son entrée difficile n'est pas robuste, elle est chanceuse.

**Le piège dans le piège** : corriger la dérivation du slug ne suffisait pas. La RECHERCHE dans
les documents comparait toujours un slug sans accent à un texte qui en portait — la même règle
réapparue ailleurs sous une autre forme, ce que l'Article 3 interdit explicitement. Il a fallu une
normalisation unique et partagée (`sansAccents()`, `lib-shell.mjs`) pour fermer les deux moitiés.

*Payée le 2026-09-23 : quatre écarts d'intégration fantômes, signalés comme réels.*

**Porté par** : `sansAccents()` (`scripts/lib-shell.mjs`), appelée des deux côtés de la
comparaison, plus l'audit d'intégration lui-même qui redeviendrait rouge si la normalisation
disparaissait — c'est lui qui a trouvé la faute.

**Terrain** : quand une dérivation mécanique (slug, identifiant, chemin) rencontre pour la première fois un nom accentué, ou quand je corrige une normalisation d'un seul côté d'une comparaison · mots : slug, normalisation, accent, dérivation, identifiant dérivé · fichiers : scripts/lib-shell.mjs, scripts/le-coordinateur.mjs

## L20 — En déplaçant du code, on emporte la fonction et on oublie sa raison

Sept blocs de commentaires ont migré d'un fichier à un autre avec les fonctions qu'ils expliquaient.
Un seul ne les a pas suivies : l'en-tête, remplacé par une note de déménagement. Ce qu'il portait —
la demande d'origine de l'utilisateur, en ses propres mots, expliquant POURQUOI ces fonctions
existaient — n'a atterri nulle part et n'existait plus dans le dépôt.

**Ce qui rend le cas exemplaire plutôt qu'anecdotique** : la migration était soignée. Les fonctions
ont été déplacées telles quelles, leurs tests n'ont pas bougé d'une assertion, un renvoi a été
laissé à l'ancienne adresse. Tout ce qu'on sait vérifier était vérifié. Ce qui est parti est
précisément ce qu'aucun test ne regarde — et ce qu'aucun diff ne redonne, puisqu'un diff montre que
le texte a disparu, jamais ce qu'il voulait dire.

**Le moment du risque est identifiable, et il n'est pas celui qu'on croit.** Ce n'est pas la
suppression franche, qu'on se pose la question d'écrire. C'est le DÉPLACEMENT : on se concentre sur
ce qui doit continuer de fonctionner, et l'en-tête, qui ne fait rien fonctionner, se réécrit
naturellement pour décrire le déménagement plutôt que la raison d'être.

**La règle** : quand du code change de domicile, la raison déménage avec lui, pas le récit du
déménagement. Les deux peuvent coexister — mais si l'un des deux doit rester, c'est la raison.

*Payée le 2026-09-23 en migrant CHARTER-SPY vers MOÏSE-TABLES-DE-LOI, et trouvée une heure plus
tard par le détecteur écrit pour empêcher exactement ça — sur son tout premier passage réel, en
mordant sur son propre auteur.*

**Porté par** : `findRaisonsPerdues()` (`scripts/safe-export.mjs`), câblé dans le crochet
post-commit. Il compare le texte supprimé à l'état actuel du dépôt : une raison déplacée ne
déclenche rien, une raison introuvable est nommée avec son fichier.

**Terrain** : quand je déplace, extrais ou renomme du code d'un fichier vers un autre, et quand je réécris un en-tête de fichier · mots : migrer, déplacer, extraire, factoriser, déménager, renommer un module, renommage, scission, migration, factorisation, extraction, en-tête · fichiers : scripts/safe-export.mjs, scripts/hooks/check-last-commit.mjs

## L21 — Satisfaire un garde-fou avec une chaîne qu'un autre lit autrement déplace le défaut au lieu de le corriger

Un lecteur d'intégration refusait de reconnaître un outil au nom accentué. Plutôt que de corriger
sa lecture, j'ai glissé dans le catalogue une seconde entrée — le chemin du script — qui, elle,
passait son filtre. Le registre est devenu vert immédiatement.

**Un second lecteur découpait ce même catalogue sur le caractère « / ».** Il en a tiré un outil
nommé « scripts », qu'il a ensuite reproché à tout le monde de n'avoir jamais sollicité. Le
garde-fou satisfait en avait fabriqué un autre, faux, dans un fichier que je ne regardais pas.

**Ce qui rend le cas général plutôt qu'anecdotique** : dès qu'un même registre a DEUX lecteurs, une
donnée ajoutée pour contenter l'un devient une entrée à interpréter pour l'autre. Et le second ne
proteste pas : il travaille, calmement, sur une donnée qui n'a aucun sens pour lui. Un vert obtenu
en nourrissant un lecteur est donc une information sur ce lecteur, jamais sur le système.

**Le signe qui aurait dû alerter, et il est reconnaissable** : la correction n'a demandé aucune
compréhension. Je n'ai pas eu à savoir POURQUOI le lecteur refusait — j'ai trouvé une forme qu'il
accepte. Une correction qui n'explique rien ne corrige rien ; elle trouve un angle.

**La règle** : quand un garde-fou refuse, corriger sa LECTURE, jamais la donnée qu'on lui donne à
lire. Et avant d'ajouter une entrée dans un registre partagé, se demander qui d'autre le lit — la
réponse est presque toujours « quelqu'un ».

*Payée le 2026-09-23, et trouvée une heure plus tard en répondant à une question de l'utilisateur
sur les outils jamais sollicités : sur sept signalés, quatre étaient faux, et celui-là était le mien.*

**Porté par** : `knownToolSlugsFromPrestations()` (`scripts/tool-brain.mjs`), qui écarte désormais
les chemins de fichiers, et `nomsOuScripts()` (`scripts/integration-outil.mjs`), qui normalise les
accents — la vraie correction, celle qui n'a plus besoin qu'on nourrisse personne.

**Terrain** : quand un garde-fou refuse et que je cherche une forme qui passe plutôt que la raison du refus · quand j'ajoute une entrée dans un registre partagé par plusieurs outils · mots : satisfaire le test, faire passer le garde-fou, le registre est vert, contourner · fichiers : scripts/le-coordinateur.mjs, scripts/tool-brain.mjs, scripts/integration-outil.mjs

## L22 — Un résumé qui RECOMPTE au lieu de LIRE le verdict rouvre une décision déjà prise

ARGUS écrivait, en toutes lettres, la conclusion de son propre passage : « 0 écart(s) à regarder
(6 écarté(s) avec votre accord explicite, jamais reposé(s)) ». La synthèse du réseau affichait juste
au-dessus : « ARGUS : à regarder (6 candidat(s)) ».

**Elle ne lisait pas cette conclusion. Elle recomptait les étiquettes du rapport.** Les six lignes
que le rapport imprime par transparence — chacune annotée « déjà tranché avec votre accord, ne
compte plus comme un écart » — portaient une étiquette `[probable]`, et le résumé les additionnait.

**Ce que ça produisait concrètement, et c'est pire qu'un chiffre faux** : à chaque passage, depuis
des semaines, le tableau rouvrait une décision que l'utilisateur avait explicitement prise et que le
détecteur avait explicitement enregistrée. L'inverse exact de sa consigne « ne jamais écarter une
zone sciemment laissée de côté par moi », pris par l'autre bout : ne jamais RE-OUVRIR une zone qu'il
a sciemment fermée.

**Ce qui rend le cas général** : un outil qui AFFICHE sa matière brute et CONCLUT séparément offre
deux surfaces de lecture, et la brute est toujours la plus facile à parser. Un agrégateur pressé
prend donc systématiquement la mauvaise — et son chiffre a l'air d'un résultat, pas d'une
interprétation. Le détecteur n'a rien fait de mal ; c'est le résumé qui a refusé de l'écouter.

**La règle** : un résumé lit le VERDICT que l'outil résumé a écrit, jamais les signes qu'il a
imprimés pour se rendre lisible. Et quand ce verdict manque, il rend « pas mesuré » — jamais zéro,
qui se lit exactement comme « rien à signaler ». Rendre la matière brute à côté reste bon : ce qui
ne l'est pas, c'est de la faire passer pour la conclusion.

*Payée le 2026-09-23, trouvée en lançant Pack Panorama POUR DE VRAI sur décision de l'utilisateur
(« Je la lance pour de vrai, une fois, et on juge »). Aucune relecture de code ne l'aurait montrée :
il fallait voir les deux phrases se contredire dans la même sortie.*

**Porté par** : `summarizeArgusOutput()` (`scripts/hyper-scan-checkpoint.mjs`), qui lit désormais la
ligne de compte d'ARGUS et rend `ecartsARegarder` / `ecartesAvecAccord` / `candidatsDetectes`
séparément, avec `undefined` quand la ligne manque — et quatre assertions de `check-house.mjs` qui
vérifient les trois cas, dont celui où un vrai écart doit toujours remonter (BP4).

**Terrain** : quand un outil agrège le résultat d'un autre · quand je lis un compteur produit à partir d'un texte plutôt que d'une valeur · quand un tableau de synthèse contredit la sortie complète de l'outil qu'il cite · mots : synthèse, résumé, tableau croisé, candidats, à regarder · fichiers : scripts/le-coordinateur.mjs, scripts/hyper-scan-checkpoint.mjs, scripts/check-argus.mjs

## L23 — Un contrôleur dit ce qu'il SAIT VÉRIFIER ; le document dit ce qui est DÛ

Pour livrer la fin d'une Ronde, j'ai lu les **onze étapes déclarées dans le code** de
`god-of-all-process`. Le document de process, lui, en décrit **huit rien que pour la fin**, avec
leurs livrables, leur ordre exact, leur format et leur archivage.

**Les onze étaient exactes.** Le contrôleur ne mentait pas : il déclare ce dont il peut constater la
trace sur disque. Ce qu'il ne déclare pas, c'est tout ce qu'aucun fichier ne prouve — un rapport
livré en HTML aux normes plutôt qu'en markdown, un correctif classé obligatoire ou recommandé, deux
évaluations séparées plutôt qu'une, quatre séries de questions plutôt qu'une, une clôture placée en
tout dernier.

**Ce que ça a produit, et c'est le point** : une sous-livraison qui se croyait complète. J'ai coché
mentalement « 10/10 étapes tracées » et déclaré la Ronde close — avec trois cinquièmes des livrables
manquants. **Puis je l'ai refait au premier rattrapage**, en relisant les mêmes onze étapes.

**Ce qui rend le cas général, et il dépasse largement les process** : partout où une règle existe en
DEUX formes — un document qui l'énonce et un mécanisme qui en vérifie une partie — le mécanisme est
toujours le plus rapide à consulter et toujours le plus incomplet. Sa complétude apparente vient de
ce qu'il ne déclare jamais ce qu'il ignore. Un vert y signifie « rien de ce que je sais regarder
n'est cassé », jamais « tout est fait ». C'est la même famille que L5 et que le fil rouge de la
Ronde du 2026-09-23 : **un contrôle qui regarde une tranche rend un chiffre juste sur sa tranche et
faux sur le tout.**

**La règle** : avant d'exécuter une étape d'un process, LIRE SON DOCUMENT. Le contrôleur sert à
vérifier après coup qu'on n'a rien laissé tomber de ce qu'il sait voir — jamais à savoir ce qu'il y
avait à faire. Et quand les deux divergent, c'est le document qui fait foi : lui a été calibré avec
l'utilisateur, le mécanisme n'en est qu'une projection partielle.

*Payée le 2026-09-23, deux fois dans la même soirée, et trouvée par l'utilisateur et non par un
outil : « tu ne m'as rien livré à la fin, tu t'es sauvé en courant », puis « tu n'as toujours pas
respecté le process ». Son diagnostic, plus juste que le mien : « tu lis les raccourcis plutôt que
les documents ».*

**Porté par** : **aucun mécanisme n'est possible**, et c'est déclaré plutôt que tu (Article 27) —
aucun programme ne peut constater qu'un document a été LU avant d'agir, exactement la limite honnête
déjà reconnue à tool-brain et à SMART-CONSO-TOKEN. Ce qui existe en revanche, et qui rend la lecture
possible plutôt qu'obligatoire : `findProcessHorsGabarit()` (`scripts/god-of-all-process.mjs`)
vérifie que chaque document de process répond aux cinq questions du modèle, donc qu'il y a bien
quelque chose à lire ; et `angel-of-ia-process` DEMANDE la déclaration plutôt que de la supposer.
Le porteur réel de cette leçon est son inscription ici, et sa remontée par son Terrain.

**Terrain** : avant d'exécuter une étape d'un process · quand un contrôleur affiche un vert et que je m'apprête à conclure · quand je consulte une liste d'étapes dans du code plutôt que dans un document · mots : process, étapes, contrôleur de process, garde-fou mécanique, conformité, tracé, livrable · fichiers : scripts/god-of-all-process.mjs, docs/circle-process-detail.txt, docs/regles-de-travail.md, scripts/circle-tasks.mjs

## L24 — Ce qui dit à quoi sert un outil, c'est son OFFRE DÉCLARÉE, jamais son code

L'utilisateur demande un partage des outils entre ceux qui servent le jeu et ceux qui servent
l'Agence. Premier crible : chercher dans le CODE de chaque script s'il touche `app/`, `lib/`,
`components/`, le référentiel du jeu ou les personnages. Résultat : **45 outils sur 65 classés
« pour le jeu »**, dont CASSANDRA-RH, MOÏSE-TABLES-DE-LOI, doc-report, ecotoken et SAFE-EXPORT —
tous des outils purement internes à l'Agence, qui n'ont jamais rien eu à voir avec Lia ni Noé.

**La cause est simple et elle est générale** : ils MENTIONNENT `lib/` ou `Lia` dans un commentaire,
dans une liste de chemins à parcourir, dans un exemple. Un outil qui ANALYSE tout le dépôt cite
forcément le dépôt entier. Chercher la finalité dans le code revient à confondre **ce qu'un outil
touche** avec **ce à quoi il sert** — et un outil transverse touche tout par construction.

**La seconde source, et elle a immédiatement tenu debout** : l'OFFRE DÉCLARÉE. Le catalogue dit,
pour chaque prestation, à quelle DEMANDE elle répond : « Fidélité de l'esprit des personnages » est
du jeu, « Bilan RH de l'équipe » est de l'Agence. Ce n'est pas une heuristique sur une forme, c'est
une déclaration d'intention écrite par quelqu'un. Résultat du même partage, refait sur cette
source : **6 outils pour le jeu, 39 pour l'Agence, 1 pour les deux** — crédible du premier coup,
sans un seul cas aberrant.

**Ce qui rend le cas général, et il dépasse ce partage-là** : dès qu'on cherche la FINALITÉ d'un
composant, le code est la mauvaise source. Le code dit ce qu'une chose TOUCHE, ce qu'elle IMPORTE,
ce qu'elle PARCOURT — jamais pourquoi elle existe. La finalité ne vit que là où quelqu'un l'a
écrite : un catalogue, une fiche, un contrat d'interface, une ligne de suivi. Même famille que L11
et L12 : le motif tournait très bien, il répondait simplement à une autre question que celle posée.

**La règle** : avant de classer, se demander OÙ la réponse est ÉCRITE plutôt que où elle pourrait se
deviner. Si personne ne l'a écrite nulle part, le vrai travail est de la faire écrire — pas de la
déduire d'un fichier source.

*Payée le 2026-09-24, troisième sonde de la même soirée à matcher sur une mention plutôt que sur une
fonction, et la seule des trois que l'utilisateur ait vue passer : « ce qui dit à quoi sert un outil,
c'est son offre déclarée, pas son code : leçon à apprendre typiquement ».*

**Porté par** : le catalogue LE-COORDINATEUR est la source déclarée, et `findRegistriesMissingFromCircle()`
plus le garde-fou d'outil muet de #714 garantissent qu'un outil sans offre écrite est SIGNALÉ plutôt
que classé au jugé. Ce qui reste hors mécanique — choisir la bonne source avant de coder une
sonde — n'a pas de porteur possible, et le déclarer ici EST la protection (Article 27).

**Terrain** : quand je classe, range ou catégorise des composants · quand j'écris une sonde qui cherche une INTENTION plutôt qu'un FAIT · quand un résultat de classement contient un cas manifestement absurde · mots : classification, finalité, à quoi ça sert, partage, catégorie, iceberg, jeu vs outillage · fichiers : scripts/le-coordinateur.mjs, scripts/cassandra-rh.mjs, CLAUDE.md

## L25 — Compter combien de lignes reçoivent une étiquette ne dit RIEN de la justesse des étiquettes

Deux questions se ressemblent au point de se substituer l'une à l'autre sans que rien ne grince :
**combien d'éléments mon classement a-t-il su étiqueter** (la COUVERTURE) et **combien de ces
étiquettes sont justes** (la PRÉCISION). La première se calcule toute seule, la seconde exige que
quelqu'un relise. Le piège est donc mécanique, jamais un défaut d'attention : on mesure ce qui se
mesure, et le chiffre obtenu est parfaitement exact — il répond simplement à l'autre question.

**Ce qui rend ce faux vert pire qu'une absence de mesure** : un « 81 % classés » a toutes les
apparences d'une validation. Il est vrai, il est vérifiable, il est reproductible. Rien, dans sa
forme, ne dit qu'il ne parle pas de justesse. Une case vide aurait au moins appelé le travail.

**Les deux gestes qui ferment le trou, et le second seul compte vraiment** :

1. **Nommer la grandeur dans la phrase qui la porte.** « 81 % des tâches ont reçu une nature »
   plutôt que « l'axe de nature fonctionne ». Une grandeur nommée ne peut plus être lue pour une
   autre.
2. **Relire un échantillon à la main avant de livrer, et publier ce chiffre-là À CÔTÉ.** Même
   modeste, même décevant : `précision mesurée à la main : 4 sur 7` en dit plus long que n'importe
   quel taux de couverture, et il rend au lecteur le droit de se méfier.

**Corollaire, qui vaut au-delà du classement** : avant d'annoncer qu'un mécanisme marche, écrire la
question à laquelle on voulait répondre, puis vérifier que le chiffre y répond — pas qu'il est juste.

*Payée le 2026-09-25, tâches #886 et #888. L'axe de nature des tâches a été validé sur sa
couverture (19 % d'indéterminées, donc « ça tient ») et jamais sur sa justesse. La rafale de
correctifs livrée à partir de lui comptait **au plus 2 vrais correctifs sur 10** : le détail d'une
tâche ouverte cite presque toujours le défaut qui l'a motivée, donc « correctif » gagnait à tous les
coups. Le chiffre était bon, il regardait la mauvaise chose — et c'est la plus coûteuse des trois
erreurs de la journée, précisément parce qu'il était bon.*

**Porté par** : `PRECISION_NATURE` (`scripts/check-tasks-details.mjs`) — la précision mesurée à la
main est imprimée à côté du classement, avec la limite qui va avec, plutôt que laissée à la lecture
du taux de couverture ; et la règle du dénominateur qui voyage avec le chiffre. Ce qui reste hors
mécanique — savoir si une étiquette est JUSTE demande de relire, et aucun compteur ne le fera à ma
place — n'a pas de porteur possible, et le déclarer ici EST la protection (Article 27).

**Même famille que L10 et L24, terrain différent, et c'est pour ça qu'elle vit à part** : L10
attrape la vérification qui partage le filtre de ce qu'elle vérifie, L24 attrape la sonde qui
cherche la finalité dans la mauvaise source. Celle-ci attrape le chiffre exact qui répond à une
autre question que la sienne — et elle doit remonter au moment où je VALIDE une mesure, pas au
moment où je classe.

**Terrain** : quand j'annonce qu'un classement, une sonde ou un étiquetage fonctionne · quand je livre un taux, un pourcentage ou un « X sur Y » · quand une mesure sert de feu vert à une livraison · mots : couverture, taux, pourcentage, classé, étiquette, indéterminé, précision, justesse, validé, ça marche · fichiers : scripts/check-tasks-details.mjs, scripts/cassandra-rh.mjs, scripts/the-equalizer.mjs

---

## L26 — Deux rendus du même contenu doivent être vérifiés l'UN CONTRE L'AUTRE, jamais chacun seul

*(2026-09-26, trouvé en relisant le document de classification ligne à ligne à la demande de
l'utilisateur.)*

Un même générateur produisait deux versions d'un document : une en HTML, une en texte. Le rendu HTML
connaissait six types de blocs, le rendu Markdown seulement cinq — et le sixième, `highlight`,
tombait dans un `else` absent. **Résultat : la version texte perdait silencieusement la phrase
centrale du document** (« le rang MÉRITÉ l'emporte toujours »), et personne ne pouvait le voir, parce
que chaque version, lue seule, était parfaitement cohérente.

**Pourquoi ce défaut est invisible par construction** : les deux fichiers sont corrects. Le HTML est
complet, le Markdown est bien formé. Ce qui manque n'existe que dans la COMPARAISON, et personne ne
compare deux fichiers censés venir de la même source — c'est précisément parce qu'ils viennent de la
même source qu'on les croit identiques.

**La forme générale, au-delà des documents** : chaque fois qu'une donnée est rendue par deux chemins
(deux formats, deux écrans, une API et son affichage, un rapport et son résumé), le point faible
n'est ni l'un ni l'autre chemin — c'est le type de contenu que l'un connaît et l'autre pas. Et il
grandit tout seul : chaque type ajouté d'un côté creuse l'écart.

**Les deux gestes, et le second est le seul qui tienne dans le temps** :

1. **Un rendu ne doit JAMAIS ignorer en silence ce qu'il ne connaît pas.** Un `else` muet rend
   exactement comme un contenu vide. Ici, l'inconnu écrit désormais « BLOC NON RENDU » dans le
   document lui-même : impossible à rater, impossible à confondre avec un trou de contenu.
2. **Un test compare les deux rendus sur le même bloc**, pas chacun de son côté. Un test par rendu
   aurait laissé passer ce défaut indéfiniment : les deux auraient été verts.

**Terrain** : quand un contenu est rendu en plusieurs formats · mots : rendu, markdown, html, export, format, deux versions · fichiers : scripts/le-classificateur.mjs, scripts/html-report.mjs

**Porté par** : `blocsVersMarkdown()` signale un type inconnu dans sa sortie, et `check-house.mjs`
vérifie qu'un bloc `highlight` atteint bien le Markdown. La règle générale — vérifier les rendus l'un
contre l'autre — n'a pas de porteur mécanique et se déclare ici (Article 27).

## L27 — Une heure LUE devient fausse en vieillissant : ce n'est pas la lecture qui dérive, c'est sa RÉUTILISATION

*(2026-09-26, quatrième horodatage refusé de la semaine par `findHorodatagesFuturs()`, et le premier
dont la cause a été cherchée au lieu d'être corrigée à la main.)*

L'Article 32 dit : « jamais une date ou une heure tapée de mémoire, on la LIT ». Cette règle est
respectée — l'heure EST lue, à chaque fois, via AGENT-DU-TEMPS. Et pourtant le garde-fou refuse un
commit sur quatre. **Le geste interdit n'est donc pas celui qu'on croyait.**

**Ce qui se passe réellement** : on lit l'heure correctement à 05h18. On travaille vingt minutes. On
écrit la ligne de suivi en réutilisant la valeur lue au début — ou pire, en l'ajustant « à peu près »
pour tenir compte du temps passé. La lecture était juste ; **c'est sa péremption qui ne l'est pas**.

**Le cas le plus vicieux, et c'est celui qui a produit cette leçon** : l'heure écrite venait d'un
`fire_at` — l'horodatage FUTUR d'un réveil programmé, lu dans la sortie d'un outil quelques minutes
plus tôt. Un chiffre juste, dans un champ voisin, pris pour l'heure courante. Aucune invention, aucun
calcul de tête : juste le mauvais champ d'une vraie mesure.

**La forme générale, et elle dépasse largement l'heure** : une mesure lue est vraie AU MOMENT où on
la lit. La réutiliser plus tard sans la relire, c'est exactement ce que l'Article 24 interdit pour
les listes — sauf qu'ici la copie ne se périme pas en semaines, elle se périme en minutes.

**Le geste qui ferme le trou** : relire l'heure **au moment d'écrire la ligne**, jamais au début du
travail qu'elle datera. Une lecture coûte une seconde ; un commit refusé en coûte cinq minutes.

**Terrain** : quand on écrit un horodatage dans le suivi, un rapport, un plan · mots : horodatage, heure, date, suivi, ligne, refusé, futur · fichiers : docs/suivi/, scripts/agent-du-temps.mjs

**Porté par** : `findHorodatagesFuturs()` (check-suivi-fidelity) refuse mécaniquement une ligne datée
dans le futur — c'est lui qui a attrapé les quatre. Ce qu'aucun mécanisme ne peut voir, c'est une
heure PASSÉE réutilisée (une ligne datée de vingt minutes trop tôt passe sans bruit), et le déclarer
ici EST la protection (Article 27).

## L28 — Un chiffre qui BOUGE n'est pas un chiffre qui s'AMÉLIORE

*(2026-09-26, tâche #905, en élargissant le motif qui reconnaît l'origine d'une tâche de suivi.)*

**Ce qui s'est passé, et ça a pris deux minutes à commettre et vingt à voir.** Les trois courbes de
rotation rendaient « 77 % d'origine indéterminée » — un chiffre visiblement trop haut, causé par un
motif qui ne connaissait pas les formes réellement écrites dans le registre (« Sa demande du … »,
« Son gros prompt du … »). J'ai élargi le motif, relancé, et lu **78 %**. Puis, sans y penser, j'ai
regardé le détail plutôt que le total : la part « demandée » avait BAISSÉ.

**La cause** : en réécrivant le motif j'avais laissé tomber son drapeau `/i`. Les formes existantes
écrites avec une majuscule — « Demande explicite de l'utilisateur », la plus fréquente de toutes —
avaient cessé de correspondre. **L'élargissement avait rétréci la mesure.** Drapeau remis : 68 %.

**Pourquoi c'est une leçon et pas une étourderie** : un chiffre qui change APRÈS une modification
ressemble trait pour trait à un chiffre qui répond à la modification. C'est le même piège que le
zéro d'une sonde cassée (L11) pris un cran plus loin : là, un résultat ABSENT ressemblait à un
résultat NUL ; ici, un résultat DÉGRADÉ ressemble à un résultat AMÉLIORÉ. Et la lecture naturelle
— « j'ai élargi, donc ça s'est élargi » — confirme l'erreur au lieu de la révéler.

**Le geste qui ferme le trou** : mesurer AVANT, mesurer APRÈS, et vérifier que la variation va dans
le sens attendu **sur la composante qu'on a touchée**, jamais sur le total. Un total agrège, donc
un total masque : ici, +6 indéterminées et −3 demandées se lisaient « à peu près pareil ».

**Terrain** : toute modification d'un motif, d'un seuil, d'un filtre · mots : motif, regex, seuil, élargir, mesure, avant/après · fichiers : scripts/*.mjs

**Porté par** : `origineDeLaTache()` est verrouillée par un contre-test de casse dans check-house.mjs
— la forme MAJUSCULE la plus fréquente du registre doit rester reconnue, sans quoi la suite échoue.
Ce qu'aucun mécanisme ne peut voir, c'est une variation non vérifiée sur une mesure qui n'a pas
encore de test, et le déclarer ici EST la protection (Article 27).

## L29 — Le doublon qui a été attrapé par le compilateur aurait survécu dans un autre fichier

*(2026-09-26, tâche #905, en construisant les trois courbes de rotation.)*

**Ce qui s'est passé** : il fallait distinguer les tâches que l'utilisateur demande de celles que la
machinerie engendre. J'ai écrit un classificateur d'origine complet — ses motifs, ses trois états,
ses commentaires. Au premier chargement du module, Node a refusé :
`SyntaxError: Identifier 'origineDeLaTache' has already been declared`. **La fonction existait
depuis deux jours, à quelques centaines de lignes au-dessus, dans le même fichier.**

**Ce qui aurait été perdu si le doublon avait vécu** : pas du temps — deux classificateurs auraient
rendu deux réponses différentes sur la même ligne de suivi, et la courbe aurait été plus fausse
qu'absente. Une mesure fausse se défend ; une mesure absente se voit.

**Le point qui fait la leçon, et il est inconfortable** : ce n'est ni la reprise des notes
(Article 30) ni tool-brain (Article 31) qui ont mordu. C'est le moteur JavaScript, par accident,
parce que les deux déclarations partageaient un fichier. **Le même doublon écrit dans deux fichiers
différents n'aurait rien déclenché du tout** — et ce dépôt compte quatre-vingt-huit fichiers.

**Le geste qui ferme le trou** : avant d'écrire une fonction qui CLASSE, qui MESURE ou qui NOMME,
chercher le verbe dans le dépôt, pas seulement le nom qu'on s'apprête à donner. « Origine »,
« classer », « répartition » auraient tous rendu la fonction existante.

**Terrain** : avant d'écrire une fonction d'analyse ou de classement · mots : doublon, classificateur, origine, mesure, déjà existant · fichiers : scripts/*.mjs

**Porté par** : **aucun mécanisme** ne peut intercepter l'écriture d'une fonction avant qu'elle
existe. CLONE-HUNTER l'aurait vue APRÈS coup, au commit suivant, une fois le travail fait ; le
moteur JavaScript ne l'a refusée que parce que les deux déclarations partageaient un fichier. Ce
qui manque est un réflexe AVANT, que seule la conduite porte — et le déclarer ici EST la
protection (Article 27).

## L30 — Le faux positif le plus dangereux est celui qu'on ne PEUT PAS corriger

*(2026-09-26, tâche #931, à la vérification finale d'une nuit autonome.)*

**Ce qui s'est passé** : en relançant les sept Gardiens sacrés contre le vrai dépôt, la plus grosse
alerte de CLONE-HUNTER annonçait « 32 lignes dupliquées × 2 » et proposait « fondre les 2 blocs ».
Les deux blocs étaient l'`import { … }` d'un module et l'`export { … }` qui réexporte les mêmes
noms. **Les fondre est impossible : c'est ce que réexporter veut dire.**

**Pourquoi c'est pire qu'un faux positif ordinaire.** Un faux positif normal se traite : on regarde,
on conclut « non », on passe. **Celui-ci ne se traite pas** — il n'y a aucun geste qui le fasse
disparaître, donc il revient à chaque commit, pour toujours. Un Gardien sacré tourne à CHAQUE
commit : une alerte éternelle et intraitable, placée en tête du rapport, apprend à survoler tout ce
qui suit. Ce matin-là, elle précédait quatre duplications parfaitement réelles.

**La règle** : quand on trie les faux positifs d'un garde-fou, **la question n'est pas seulement
« a-t-il tort ? », c'est « existe-t-il un geste qui le ferait taire ? »**. Si la réponse est non, ce
n'est plus un bruit à tolérer, c'est un défaut à corriger dans l'outil, et il passe devant les faux
positifs qu'on peut au moins clore un par un.

**Le corollaire, appris en corrigeant** : le filtre écrit pour taire l'alerte a d'abord été faux
lui-même — une accolade jamais refermée avalait tout le reste du fichier, donc il aurait supprimé de
vraies duplications en silence. **Un filtre qui se trompe est pire que l'alerte qu'il supprime**,
parce que son erreur ne s'affiche nulle part. C'est le contre-test qui l'a trouvée, jamais la
relecture.

**Terrain** : quand je juge qu'une alerte d'un garde-fou est un faux positif · mots : faux positif, bruit, alerte, écarter, filtrer, tolérer · fichiers : scripts/*.mjs

**Porté par** : les contre-tests de `estUnPontDeReexport()` dans `check-house.mjs` pour ce cas-ci ;
**aucun mécanisme** pour la règle générale — rien ne peut constater qu'on s'est posé la question.
Déclaré plutôt que tu (Article 27).

## L31 — Une règle écrite AILLEURS que dans la charte n'a pas de porteur par défaut, et personne ne s'en aperçoit

*(2026-09-26, tâche #944, en cherchant pourquoi la file de tâches ne diminuait jamais.)*

**Ce qui s'est passé** : `docs/systeme-de-suivi.md` §2 dit depuis le 2026-09-19 — « à la clôture
d'une tâche, sa ligne est mise à jour (statut, pas une nouvelle ligne) ». **Rien ne le vérifiait.**
Huit tâches ont donc été closes en ouvrant une NOUVELLE ligne, laissant l'ancienne dire « ouverte »
pour toujours. Quatre de ces huit ont été faites dans la même matinée, par un agent qui venait de
lire la charte en entier.

**Pourquoi ça passe inaperçu alors que le projet est outillé pour ça** : quand une règle vit dans
un ARTICLE de la charte, on se demande qui la porte — MOÏSE compte les Articles sans porteur, la
cartographie les affiche, c'est devenu un réflexe. Une règle qui vit dans un document de PROCESS
n'est comptée par personne. **Il n'y a pas de cartographie des obligations hors charte**, donc pas
de liste où une obligation orpheline puisse se voir.

**Ce que ça coûte, et ce n'est pas du rangement** : la file annonçait 129 tâches restantes pour 121
réelles. « Épuiser la file » n'avait plus de fin mesurable, et la liste des plus anciennes tâches
encore ouvertes — celle qui sert à décider quoi faire ensuite — remontait du travail déjà rendu.
Une ligne fantôme est pire qu'une ligne manquante : **elle a l'air d'un travail qui reste.**

**Le geste** : quand on écrit une obligation dans un document de process, se poser la même question
que pour un Article — *qui la vérifie ?* Si la réponse est « personne », soit on lui donne un
garde-fou tout de suite, soit on écrit noir sur blanc qu'elle n'en a pas (Article 27). Ce qui ne
marche jamais, c'est de l'écrire et de passer à la suite.

**Terrain** : quand j'écris une obligation dans un document de process ou de référence · mots : obligation, règle, process, convention, porteur, garde-fou · fichiers : docs/*.md, docs/referentiel/*.md

**Porté par** : `findLignesFantomes()` dans `check-suivi-fidelity.mjs` pour le cas précis qui l'a
révélée ; **aucun mécanisme** pour la règle générale — rien ne peut lire un document de process et
décider si telle phrase est une obligation qui mériterait un garde-fou. Déclaré plutôt que tu
(Article 27), et c'est exactement le manque que la leçon décrit.

## L32 — Un point d'entrée partagé ne se supprime pas : on énumère d'abord ses consommateurs

*(2026-09-27, tâche #991, en retirant le référentiel affiché en jeu du produit.)*

**Ce qui s'est passé** : la demande était claire et limitée — retirer le panneau Admin, son bouton,
son document. `app/api/admin/route.ts` ne servait que ce panneau, en apparence. Elle servait en
réalité DEUX choses sans rapport l'une avec l'autre : le document affiché d'un côté, et de l'autre
le canal de mesure que `kpi-report.mjs` interroge pour le rapport de l'étape 4 de l'Article 18
(Smart Breaker, poids de contexte, rejouabilité). **La supprimer entière aurait tué le second sans
qu'aucun test ne le dise.**

**Pourquoi la panne aurait été invisible** : `fetchLiveMetrics()` traite un échec comme un serveur
éteint et imprime « serveur non joignable — normal si aucune simulation n'est en cours ». Une panne
permanente aurait donc pris exactement la forme du cas normal. Le rapport aurait continué à sortir,
sans ses mesures, et personne n'aurait su distinguer les deux.

**La règle** : avant de supprimer un point d'entrée partagé — une route, un export, un fichier de
données, une commande —, **chercher qui l'appelle, et le faire par un grep du dépôt entier, jamais
de mémoire**. Un point d'entrée n'a pas de signature qui dise combien de rôles il porte : c'est le
nom du fichier qui ment le plus souvent, et ici il disait « admin » pour deux métiers différents.
La suppression se réduit alors au rôle vraiment visé.

**Le corollaire, appris dans la même heure** : un consommateur qui traite l'absence comme un état
normal ne protège de rien — il transforme la panne en silence. Quand une suppression touche un
producteur, il faut regarder ce que ses lecteurs font d'un zéro (L5, prise par l'autre bout).

**Terrain** : quand je supprime une route, un export, un fichier de données ou une commande · mots : supprimer, retirer, suppression, nettoyer, démanteler, route, endpoint · fichiers : app/**, lib/*.ts, scripts/*.mjs

**Porté par** : **aucun mécanisme** — rien ne peut constater qu'on a cherché les consommateurs avant
de supprimer. Ce qui existe, et qui l'a rattrapé ici, c'est la relecture du fichier AVANT de le
retirer (Article 19). Déclaré plutôt que tu (Article 27).

## L33 — Créer un fichier change le terrain que les outils lisent : ce n'est jamais un simple ajout

*(2026-09-27, tâche #991, en archivant le référentiel retiré.)*

**Ce qui s'est passé** : l'archive
`docs/contexte-projet/referentiel-affiche-en-jeu-archive.md` a été créée pour ne rien perdre. Elle
a immédiatement cassé DEUX choses, sans qu'une seule ligne de code ait changé :

1. **ecotoken s'est mis à proposer une fausse adresse.** Le score d'affinité a vu le mot
   « referentiel » dans le nom de l'archive et dans le titre de la section « Référentiel technique »
   de la charte, et a proposé d'y déménager la table qui dit quel document lire quand — vers un
   dossier que la charte déclare « jamais une source de vérité ». Le signal a changé de nature au
   passage : une QUESTION honnête est devenue un déménagement chiffré vers le mauvais endroit.
2. **Le catalogue de son dossier a cessé d'être vrai**, et rien ne pouvait le remettre à jour
   (voir L34).

**Pourquoi c'est contre-intuitif** : on relit les guides après avoir modifié du CODE. Un fichier
ajouté ressemble à une addition inoffensive — or les outils de ce dépôt lisent le dépôt, donc un
fichier de plus est un changement d'ENTRÉE pour tout ce qui le balaie. Un nom bien choisi pour un
humain peut être un nom trompeur pour un score de ressemblance.

**La règle** : après avoir créé un fichier dans `docs/` ou dans `scripts/`, relancer les garde-fous
plutôt que de supposer qu'un ajout ne casse rien. Et se demander une fois : **à quoi ce nom
ressemble-t-il, pour une machine qui compare des mots ?**

*(Deuxième occurrence, 2026-09-27, tâche #1041, et elle est plus violente parce que le fichier était
ÉPHÉMÈRE : le runner parallèle écrivait ses copies du filet dans `scripts/`, le dossier que
SAFE-EXPORT balaie à chaque commit. Le runner **faisait échouer son propre test** — il posait dans
le terrain scanné les fichiers que le scanner refuse. Un fichier temporaire n'est pas moins un
fichier : les copies vivent depuis dans `.sites-runtime/`. **Le geste général** : un outil qui
génère des fichiers les écrit hors des dossiers que ses pairs lisent, jamais dedans « juste le
temps du passage ».)*

**Terrain** : quand je crée un fichier dans docs/ ou scripts/, en particulier une archive ou un document au nom proche d'un existant · mots : créer, archiver, nouveau fichier, déposer, nommer · fichiers : docs/**, scripts/*.mjs

**Porté par** : `DOSSIERS_JAMAIS_DESTINATION` + `archivesNonDeclarees()` (`scripts/ecotoken.mjs`)
pour le cas des archives ; la régénération des catalogues (`scripts/data-archangel.mjs`) pour
l'autre. **Aucun mécanisme** pour la règle générale — rien ne peut constater qu'on a relancé les
garde-fous après un ajout. Déclaré plutôt que tu.

## L34 — Un contenu qu'un outil GÉNÈRE doit pouvoir être RÉGÉNÉRÉ, sinon il ment à date fixe

*(2026-09-27, tâche #991, en déposant un fichier dans un dossier catalogué.)*

**Ce qui s'est passé** : `data-archangel` sait générer le catalogue d'un dossier, et il écrit en tête
de chaque catalogue « n'y écrivez rien à la main, **une régénération l'effacerait** ». Cette
régénération n'existait pas. `--generer` refuse — à raison — d'écraser un index existant, parce
qu'une prose écrite à la main vaut mieux qu'une liste ; `--completer` ne traite que les index sans
contrat. **Un catalogue généré tombait donc en retard pour toujours**, en affichant une consigne qui
désignait une commande inexistante. Sept catalogues réels étaient dans ce cas.

**Pourquoi c'est pire qu'un document simplement périmé** : un catalogue PROMET la liste complète de
son dossier. En retard, il ne se tait pas — il affirme quelque chose de faux, et son lecteur conclut
que le fichier manquant n'existe pas.

**La règle** : quand un outil écrit un contenu qui reflète un état (une liste, une table, un
sommaire), la question à se poser le jour où on l'écrit n'est pas « sait-il le produire ? » mais
**« sait-il le REproduire quand l'état aura bougé, sans écraser ce qu'il n'a pas écrit ? »**. La
réponse passe par une SIGNATURE : l'outil réécrit ce qu'il reconnaît comme sien, et ne touche à rien
d'autre.

**Terrain** : quand je construis un outil qui écrit un document dérivé d'un état · mots : générer, catalogue, index, sommaire, table, régénérer, écraser · fichiers : scripts/*.mjs

**Porté par** : `estUnCatalogueGenere()` / `SIGNATURE_CATALOGUE_GENERE`
(`scripts/data-archangel.mjs`), avec ses contre-tests dans `check-house.mjs` — dont celui qui vérifie
qu'une prose écrite à la main n'est JAMAIS reconnue comme régénérable.

## L35 — Un moniteur qui ne surveille qu'une étape lit l'intervalle entre deux étapes comme un échec

*(2026-09-27, décidé par l'utilisateur — « c'est une leçon à inscrire au registre » — après une
annonce fausse de ma part le même jour.)*

**Ce qui s'est passé** : j'ai annoncé à l'utilisateur qu'un commit avait échoué une seconde fois.
**Il n'avait pas échoué** : il était passé, et le commit `fc20268` était déjà dans le dépôt pendant
que je le disais perdu. Mon moniteur ne surveillait qu'un seul signal, la sortie de `check-house`,
alors que le crochet pre-commit enchaîne plusieurs étapes. Il s'est déclenché dans l'intervalle
pendant lequel `tsc` tournait — un silence que j'ai lu comme une interruption.

**Pourquoi c'est une leçon et pas une inattention** : un processus à plusieurs étapes est SILENCIEUX
entre deux étapes, par construction. Un moniteur branché sur une seule d'entre elles ne peut pas
distinguer « c'est fini » de « c'est passé à la suite ». Les deux se présentent exactement de la
même façon : plus rien n'arrive.

**Le coût réel** : j'ai fait perdre du temps sur une panne inexistante, et — plus grave — j'ai
rapporté à l'utilisateur un état du dépôt que je n'avais pas vérifié. Un compte rendu faux sur un
fait vérifiable en une commande coûte plus cher que le retard qu'il prétendait signaler.

**La règle** : un moniteur surveille l'ÉTAT FINAL, jamais une étape intermédiaire — le code de
sortie du processus entier, ou le fait réel qu'on attend (« le commit existe-t-il ? »). Et avant
d'annoncer un échec, **le vérifier sur la source de vérité** (`git log`), jamais sur l'absence d'un
signal.

**Terrain** : quand je surveille un processus long ou que je m'apprête à annoncer qu'il a échoué · mots : moniteur, surveiller, attendre, commit, échec, échoué, bloqué, timeout · aucun fichier : elle porte sur ma conduite pendant une attente et sur aucun fichier du dépôt — un moniteur se lance depuis n'importe où

**Porté par** : **aucun mécanisme** — rien ne peut lire ce que j'annonce dans la conversation.
C'est la même limite honnête que les Articles 29 et 30 : la déclarer EST la protection
(Article 27).
## L36 — `export { X } from "..."` réexporte X sans le lier dans le fichier qui l'écrit

Une ligne qui a l'air parfaitement correcte, et qui casse la moitié de ce qu'elle promet. Le
réexport **rend X disponible aux appelants** de ce module ; il **ne crée aucune liaison locale**.
Toute fonction du même fichier qui appelle X plante sur « is not defined » — à l'exécution
seulement, jamais à la lecture, jamais à `node --check`.

**Ce qui le rend méchant** : la moitié visible marche. Les appelants externes voient X, donc
l'import se résout, donc tout ce qui n'exerce pas le chemin interne reste vert. Ici, le verrou de
Ronde qui s'appuyait dessus est passé de « propre » à « pas mesuré », et « pas mesuré » ressemble à
une panne de câblage plutôt qu'à une faute de frappe d'une ligne.

**Le geste** : quand un fichier a besoin de X *et* doit l'exposer, on écrit les deux lignes —
`import { X } from "..."` puis `export { X }`. Jamais la forme condensée.

**Terrain** : quand je déplace une fonction d'un fichier à un autre en gardant l'ancien point d'entrée · mots : réexport, export, déménagement, cycle, import, defined · fichiers : scripts/*.mjs

**Porté par** : `findReexportsNonLies` et `auditReexports` (SAFE-EXPORT), lancés à chaque passage.
Le filet de sécurité seul ne suffisait pas : un test qui importe X depuis l'extérieur passe pendant
que l'intérieur est cassé — c'est exactement ce qui est arrivé, deux fois.

*Payée DEUX FOIS dans la même nuit, le 2026-09-27, à quelques heures d'intervalle et sans que la
première m'apprenne la seconde : d'abord sur `AXES_EXEMPLES_MAX` lors de la scission de CASSANDRA-RH
vers le classificateur, puis sur `loadToolUsageHistory()` en le déménageant de tool-brain vers
tool-usage pour casser un cycle d'import. Deux déménagements, la même ligne condensée, la même
panne. C'est ce qui justifie une entrée : une erreur qui se répète le jour même n'est pas une
étourderie, c'est un réflexe manquant.*

## L37 — Corriger une occurrence ne corrige pas la CLASSE : la même faute revient ailleurs, et le troisième endroit est le pire

Un défaut trouvé et corrigé se referme dans la tête ; il reste ouvert partout où le même
raisonnement a été écrit. Et l'endroit qui survit le plus longtemps est le plus haut placé — celui
qui produit le CHIFFRE affiché en tête de rapport, parce que personne ne remonte de la conclusion
vers son calcul.

**La forme exacte du défaut, ici** : un plan porte le nom de l'OUTIL, jamais celui de son fichier.
`scripts/check-argus.mjs` a pour plan `docs/argus-blueprint.md`, et Smart Breaker garde même
`docs/outil-resilience-api.md`, son nom d'avant le surnom. Toute fonction qui DÉRIVE le nom du plan
du nom du script accuse donc des outils parfaitement documentés.

**TROIS FOIS DANS LE MÊME DÉPÔT**, et l'écart entre les deux dernières se compte en heures :

| | Où | Ce que ça coûtait |
|---|---|---|
| 1 | LE-CLASSIFICATEUR | « SANS FICHE » sur 22 outils d'un coup, tous à tort |
| 2 | `findOutilsSansBlueprint()` (SAFE-EXPORT) | les mêmes accusés, le matin du 2026-09-27 |
| 3 | `mesurerLExportabilite()` (SAFE-EXPORT) | 6 outils « sans plan » — **et le taux d'exportabilité affiché en tête de rapport était faux d'autant** |

Le deuxième et le troisième vivent dans **le même fichier, à cinquante lignes d'écart**. Corriger le
deuxième n'a pas fait regarder le troisième, parce qu'une fois la correction écrite on passe à la
suite : la faute est réparée *là où on l'a vue*.

**Le geste** : quand un défaut est corrigé, ne pas demander « où l'ai-je vu ? » mais **« quel
RAISONNEMENT était faux ? »**, puis chercher ce raisonnement partout, y compris dans le fichier
qu'on vient de refermer. Ici la question était « qu'est-ce qui, dans ce dépôt, devine un chemin au
lieu de le lire ? » — et elle a une réponse mécanique (Article 24).

**Terrain** : quand je viens de corriger un défaut et que je m'apprête à passer à la suite · mots : corriger, même défaut, ailleurs, dérive, devine, déduit du nom · fichiers : scripts/*.mjs

**Porté par** : **aucun mécanisme** — rien ne sait reconnaître « le même raisonnement » sous deux
écritures différentes, et cette impossibilité est déclarée ici plutôt que tue (Article 27). Ce qui
existe est EN AMONT, et couvre la cause plutôt que la récidive : l'Article 24 interdit de dériver là
où une source se lit, et `aliasDocumentaires()` est désormais le seul lecteur du lien script → plan
(L29 : deux lecteurs finiraient par diverger).

*Trouvée le 2026-09-27 sur la tâche #902, en vérifiant une question de l'utilisateur plutôt qu'en
relisant du code : la couverture blueprint annonçait 77 plans sur 83 dus, et les 6 manquants
existaient tous. Après correction : 83 sur 83, 100 % aux quatre niveaux de vitalité.*


## L38 — Un outil qui analyse un fichier de TESTS doit séparer le code exécuté du code CITÉ

**Le motif, et il s'est présenté TROIS fois dans la même journée** — sur les imports, sur les lignes
de succès, puis sur les assertions. À chaque fois, un détecteur d'Ezechiel dénonçait une fixture
écrite dans une chaîne de caractères à l'intérieur de son propre contre-test. Il s'accusait
lui-même.

**Pourquoi c'est structurel et pas une inattention** : un fichier de tests a pour métier de CITER du
code. `const fixture = "await import('./absent.mjs')"` n'importe rien ; `"console.log('Passed: x')"`
n'imprime rien ; `"assert.ok(f().then(...))"` n'assertionne rien. Tout détecteur qui cherche un
motif de code dans un fichier de tests rencontrera ce cas — ce n'est pas une exception, c'est la
règle du terrain.

**Ce qui coûte cher** : le voyant de santé annonçait « 4 blocs sautés », c'est-à-dire une anomalie
BLOQUANTE, sur quatre fixtures parfaitement inoffensives. Un signal bloquant qui se trompe est pire
qu'un signal absent — on apprend à l'ignorer, et il ne sert plus le jour où il a raison (L4).

**La correction qui compte n'est pas la troisième, c'est la généralisation** : une seule fonction
(`dansUneChaine()`) porte désormais la distinction, et les trois détecteurs l'appellent. C'est la
leçon L37 appliquée pour de bon — corriger la CLASSE, pas l'occurrence.

**Terrain** : quand j'écris un détecteur qui lit un fichier de tests · mots : détecteur, filet, test, fixture, contre-test, assertion, citer · fichiers : scripts/ezechiel-les-tests.mjs, scripts/check-house.mjs

**Porté par** : `dansUneChaine()` (`scripts/ezechiel-les-tests.mjs`) et les contre-tests du filet qui
vérifient, pour chacun des trois détecteurs, qu'une fixture citée ne mord pas.

*Observée le 2026-09-27 sur les tâches #1026 et #1027.*

## L39 — Un détecteur qui compte une profondeur (accolades, `try`) est faux jusqu'à preuve du contraire

**Deux des quatre détecteurs issus de l'état de l'art ont produit un faux positif MASSIF à leur
premier passage réel** — 5 225 assertions dénoncées sur 5 225, et 7 variables « partagées » dont
aucune ne l'était. Les deux reposaient sur un comptage : profondeur de `try`, portée d'un `let`.

**La cause est toujours la même** : le comptage suppose une forme d'écriture, et le vrai fichier en
emploie une autre. Le `try` était refermé par `} catch { continue; }` EN LIGNE, là où le détecteur
cherchait `} catch` en début de ligne — la profondeur ne redescendait jamais. Le `let` était en
colonne 0 parce que ce fichier n'indente pas certains blocs — une variable locale ressemblait à une
variable de fichier.

**Ce qui a sauvé les deux, et c'est le geste à retenir** : les lancer contre le VRAI fichier avant
de les déclarer finis (Article 25). Un détecteur de profondeur vérifié sur une fixture de trois
lignes passe toujours ; c'est sur 17 000 lignes réelles qu'il s'effondre.

**La preuve la plus simple bat le comptage le plus fin** : la version retenue ne compte plus rien.
Un nom déclaré DEUX fois prouve qu'il est local — on ne redéclare pas un `let` de fichier. Et un
`try` n'est un problème que si son `catch` avale l'erreur, ce qui se lit sans compter quoi que ce
soit. Chercher la propriété qui se vérifie directement, plutôt que de raffiner le comptage.

**Terrain** : quand j'écris un détecteur qui suit une portée, un niveau ou un imbriquement · mots : profondeur, accolade, portée, imbriqué, compter, niveau, scope · fichiers : scripts/ezechiel-les-tests.mjs

**Porté par** : les contre-tests du filet sur `assertionsConditionnelles()` et
`etatPartageEntreBlocs()`, qui verrouillent chacun le cas qui l'a piégé. Le réflexe général — lancer
contre le vrai fichier avant de conclure — est l'Article 25 et se déclare ici.

*Observée le 2026-09-27 sur la tâche #1027, en branchant les apports de l'état de l'art.*

**L40 — Un test qui mesure une DURÉE mesure la vitesse de la machine, pas la règle.**
*(2026-09-27, tâche #1041, trouvé en lançant le filet en quatre parts simultanées.)* Le test du recul
adaptatif des clés API comparait trois lectures du temps RESTANT avant la fin d'un délai — une
valeur qui décroît à chaque milliseconde. Sur une machine au repos, l'écart tenait dans la tolérance
de 5 % et le test passait depuis des jours ; sous charge, les millisecondes perdues entre deux
lectures ont suffi à le faire échouer. **La parallélisation n'a pas créé ce défaut, elle l'a
RÉVÉLÉ** : le test mesurait déjà la mauvaise chose, en silence, et aurait menti le premier jour où
la machine aurait été occupée. **La correction ne consiste jamais à élargir la tolérance** — c'est
masquer le symptôme (Article 3) : on lit la valeur DÉCIDÉE, qui ne bouge pas, et l'égalité redevient
EXACTE au lieu d'être approximative. Corollaire pour tout le projet : une assertion écrite avec une
marge de tolérance sur un temps est un aveu qu'on mesure une horloge ; chercher la valeur invariante
qui se cache derrière.

**L41 — Une copie dérivée d'un fichier doit emporter TOUTES ses dépendances, ou elle teste le passé.**
*(Même tâche, et c'est le défaut le plus grave de la journée parce qu'il était SILENCIEUX.)* Le
runner parallèle écrit des copies du filet ; il redirigeait vers un dossier par part les écritures du
préambule, mais pas les lectures faites plus bas par les blocs. Une part relisait donc les modules du
jeu transpilés lors d'un lancement PRÉCÉDENT. Tant que le code du jeu ne bougeait pas, tout était
vert. À la première modification de `lib/gemini-keys.ts`, une part a crié « fonction inconnue » sur
une fonction qui existait bel et bien — et c'est seulement à ce moment-là qu'on a su que les trois
autres travaillaient depuis le début sur une copie périmée. **Un test qui passe sur du code que
personne n'exécute est pire qu'un test qui échoue** : il rend un vert vide. Règle générale : quand on
dérive une copie d'un fichier pour l'exécuter ailleurs, la redirection porte sur TOUT le fichier,
jamais sur la partie qu'on a en tête.

**L42 — Un banc d'essai qui n'installe pas ce qu'il mesure mesure ce qui traînait là.**
*(2026-09-28, tâche #1034 étape 2 — et c'est la leçon L41 qui revient, cette fois dans l'outil chargé
de la vérifier chez les autres.)* Le banc du témoin lance chaque outil de l'Agence dans un dépôt
ÉTRANGER et classe ce qui se passe. Il ne copiait rien : il lançait `scripts/<outil>.mjs` en se
plaçant dans le dépôt d'accueil, en supposant qu'une copie de l'Agence s'y trouvait — elle y était,
posée à la main vingt minutes plus tôt. Résultat : après avoir réparé sept outils et vérifié chaque
réparation à la main, le banc a rendu **exactement le même rapport qu'avant**, code 0, quinze
non-portables, et **il avait l'air juste**. Les sept corrections étaient simplement absentes de la
copie qu'il exécutait. **Un rapport qui ne bouge pas après une correction n'est pas forcément la
preuve que la correction ne sert à rien : c'est peut-être la preuve que le banc ne l'a pas vue.**
La correction est mécanique et non négociable : le banc réinstalle à CHAQUE passage, imprime combien
de fichiers il a posés et depuis quel commit, et refuse de mesurer si la copie échoue. Le chiffre
réel, une fois le banc réparé : **79 % → 89 %**, quinze non-portables tombés à huit.

**L43 — Sur un petit corpus, la rareté d'un mot n'est pas un signal : 60 % des mots y sont « rares ».**
*(2026-09-28, même tâche, idée essayée et écartée le jour même.)* Le point d'entrée obligatoire
(tool-brain) a répondu « aucune correspondance » à une demande qu'une offre du catalogue servait
parfaitement — l'offre le disait dans sa DESCRIPTION, et seul son champ `demande` était lu. L'idée
séduisante : admettre UN seul mot partagé quand ce mot n'est employé que par une offre, au motif
qu'un mot rare pèse plus que deux mots banals. **La mesure l'a tuée en une commande** : sur les 70
offres réelles, 851 racines dont **508 (60 %) n'apparaissent que dans une seule offre**. Le
contre-test d'inflation déjà en place est passé de zéro à trois fausses pistes (« bloc », « enchaîner »,
« suivent »), trois faux sens pour un vrai. **Ce qui marche sur mille fonctions ne marche pas sur
soixante-dix offres, et seule la mesure le dit.** Ce qui a réglé le problème n'était pas le matcheur
mais la DONNÉE : enrichir la demande de l'offre du vocabulaire qu'un lecteur emploie vraiment. Règle
générale : avant de raffiner un algorithme de rapprochement, regarder si la chaîne qu'on cherche à
rapprocher est simplement absente du texte qu'on lit.


**L44 — Un garde-fou d'idempotence qui cherche la chaîne qu'il vient d'écrire se déclare toujours satisfait.**
*(2026-09-27, tâche #1036, sur un ajout d'imports en masse.)* Le script ajoutait une ligne
`import` dans quarante-trois fichiers, et se protégeait des doublons en vérifiant d'abord que la
ligne n'y était pas déjà. Mais la vérification portait sur le texte APRÈS écriture dans la même
passe : **sept fichiers ont été annoncés « déjà à jour » sans que rien n'y soit ajouté.** Et rien
ne l'a signalé : `node --check` passe, parce qu'un identifiant manquant est une erreur d'EXÉCUTION
et non de syntaxe — le fichier est parfaitement bien formé, il est simplement faux. Le défaut n'est
apparu qu'en lançant les outils un par un. **Deux règles en sortent** : une garde d'idempotence se
vérifie sur l'état LU AVANT la passe, jamais sur ce qu'on vient de produire ; et après une
modification en masse, on RELIT le contenu écrit fichier par fichier au lieu de se fier à un
« 43/43 traités » que le script s'est décerné lui-même.

**L45 — Une clé de dédoublonnage plus courte que ce qui distingue deux résultats en efface un.**
*(2026-09-27, tâche #1040, en recollant les sorties du filet lancé en parts.)* Le recollage
dédoublonnait les lignes de succès sur leurs quarante premiers caractères — assez pour reconnaître
un doublon de l'épine, pas assez pour séparer deux tests dont les libellés commencent pareil.
Résultat : **298 succès affichés au lieu de 299**, et la ligne perdue était un vrai test, pas un
doublon. Un compte qui baisse d'une unité ne ressemble pas à un bug, il ressemble à un test
supprimé — c'est ce qui rend l'erreur coûteuse à trouver. **Le geste** : on dédoublonne sur la
valeur ENTIÈRE et on ordonne sur le préfixe, jamais l'inverse ; une troncature sert à classer, elle
ne sert jamais à identifier.


**L46 — Un seuil dérivé d'un corpus qui CONTIENT l'anomalie se laisse pousser au-dessus d'elle.**
*(2026-09-28, tâche #1033, trouvé par le contre-test AVANT la première mise en service — donc avant
qu'un seul faux verdict ne sorte.)* Le garde-fou des couples blueprint ↔ instanciation dérive son
seuil du parc réel, comme l'Article 24 l'exige. Première version : « deux fois le 90ᵉ centile des
écarts ». Sur les 82 couples réels elle donnait 10,8 jours, tout allait bien. Sur le couple
FABRIQUÉ pour vérifier qu'elle mord — un retard de 200 jours — **le 90ᵉ centile d'un corpus de deux
valeurs vaut 200**, le seuil devenait 400, et l'anomalie s'était exclue elle-même. Deuxième
version, la médiane : insensible à une valeur extrême, mais sur DEUX valeurs elle vaut encore
l'anomalie. **La vraie règle tient en deux temps** : (1) une statistique ROBUSTE — la médiane, jamais
un centile haut, parce qu'un centile haut suit l'anomalie qu'on cherche ; (2) un CORPUS MINIMUM en
dessous duquel seul un plancher déclaré gouverne — sous ce seuil, l'anomalie *est* le corpus. C'est
la deuxième fois de la même nuit que le second point se paie (L43, le mot rare : 60 % des racines
d'un catalogue de 70 offres sont uniques), et c'est ce qui en fait une règle plutôt qu'un accident.
**Corollaire pour BP5** : dériver un seuil ne suffit pas, il faut dire DE QUELLE statistique et sur
QUEL corpus minimum — sans ces deux précisions, « dérivé » rassure sans protéger.


**L47 — Un signal ADJACENT lu comme le signal visé : la faute la plus fréquente de ce dépôt, et elle n'était écrite nulle part.**
*(2026-09-30, tâches #1247 · #1250 · #1258 · #1265 — QUATRE occurrences dans une seule nuit, après
en avoir déjà payé au moins huit les jours précédents. Mesuré avant d'écrire cette entrée : la
phrase apparaît dans **28 fichiers** du dépôt — 7 dans le référentiel, 15 dans des commentaires de
code — et **zéro fois dans ce registre**. Le défaut le plus fréquent du projet était décrit partout
et déclaré nulle part, ce qui est exactement la forme que prend une leçon qu'on réapprend.)*

**La forme, toujours la même** : un contrôle mesure quelque chose de VOISIN de ce qu'il prétend
mesurer, et personne ne le voit parce que les deux se ressemblent trait pour trait.

| Ce qui est mesuré | Ce qu'on croit mesurer | Ce que ça a coûté |
|---|---|---|
| « le mot n'est pas dans CE champ » | « l'outil n'existe pas » | 69 prestations sur 74 introuvables par leur nom, sur la porte que l'Article 31 rend obligatoire |
| « le mot *tâche* n'est pas écrit » | « aucune tâche n'est rattachée » | 47 constats vus au lieu de 89 — le contrôle accusait la discipline la mieux tenue du projet |
| « la date du dernier commit est ancienne » | « le contenu du fichier est ancien » | le garde-fou bloquait la seule façon correcte de le satisfaire |
| « le chemin parent ressemble au chemin enfant » | « c'est la même source » | un double compte accusé sur un rapport correct |

**Ce qui les réunit, et c'est la seule chose à retenir** : dans les quatre cas, **le contrôle était
juste sur ce qu'il regardait et faux sur ce qu'il affirmait**. Aucun n'a planté, aucun n'a rendu
d'erreur, et trois sur quatre rendaient un chiffre plausible.

**LE GESTE QUI LES ATTRAPE, et il tient en une question** : *avant de conclure d'un zéro, d'un vert
ou d'un compte — QU'EST-CE QUE CE CONTRÔLE A LITTÉRALEMENT REGARDÉ ?* Pas ce qu'il annonce dans son
titre : les lignes qu'il a lues, les champs qu'il a comparés, le motif qu'il a appliqué. Les quatre
occurrences se sont effondrées à la première fois qu'on a posé cette question.

**LE CONTRE-TEST QUI LE PROUVE, et il coûte trente secondes** : fabriquer l'entrée que le contrôle
DEVRAIT attraper, et vérifier qu'il l'attrape. Les quatre défauts auraient été trouvés le jour de
leur écriture — « un fichier propre rend-il bien FAUX ? », « le parent attrape-t-il l'enfant ? ».
Un contrôle qu'on n'a jamais vu MORDRE n'est pas un contrôle vérifié.

**ELLE S'EST VÉRIFIÉE TROIS FOIS DE PLUS DANS L'HEURE QUI A SUIVI SA RÉDACTION — SUR LES MESURES
ÉCRITES POUR L'INSTRUIRE.** C'est la meilleure preuve qu'elle pouvait recevoir, et elle vaut plus
que les quatre cas d'origine :

| Ce que la mesure annonçait | Ce qu'elle regardait vraiment | Ce qu'il y avait |
|---|---|---|
| « 4 % des assertions sont des contre-tests, 59 blocs à reprendre » | **les mots du message**, pas la couverture | 21 % au moins |
| « 5 blocs sans aucun contre-test » | la **forme** de l'assertion, pas son sens | **0** — les cinq en avaient un, trois l'écrivent en toutes lettres |
| « 233 frontières de mot suspectes » | la **ponctuation de JavaScript** (le délimiteur du littéral) | **0** défaut vivant |

**Le motif est donc plus large que « un contrôle mal écrit » : il vaut pour TOUTE mesure, y compris
celle qu'on écrit pour démontrer cette leçon-ci.** Et il penche toujours du même côté — **une
première mesure est pessimiste**, parce qu'il est plus facile de compter une forme qu'un sens, et
qu'une forme absente ressemble à un défaut présent.

**COROLLAIRE PRATIQUE, ET C'EST LE PLUS RENTABLE DU LOT** : *avant de publier un chiffre qui
désigne du travail à faire, ouvrir à la main DEUX des cas qu'il accuse.* Trente secondes. Cette
seule habitude a évité, en une nuit, trois chantiers qui n'existaient pas.

**POURQUOI CETTE LEÇON EST DIFFÉRENTE DES AUTRES** : L4 dit qu'un garde-fou qui accuse à tort cesse
d'être lu — c'est la CONSÉQUENCE. L5 dit qu'une absence de mesure n'est pas une mesure à zéro —
c'est un CAS PARTICULIER. Celle-ci nomme la CAUSE commune, et c'est elle qui manquait : on ne
corrige pas une conséquence, et on ne généralise pas depuis un cas particulier (L37).

**SECOND COROLLAIRE, PAYÉ DEUX FOIS DANS LA MÊME HEURE ET SUR MON PROPRE TRAVAIL** *(2026-09-30,
tâches #1288 et #1289)* : **pour vérifier un CÂBLAGE, il faut regarder la SORTIE, jamais le code
câblé.**

Une alerte venait d'être branchée pour sortir dans la bannière post-commit. Le contre-test qui
l'accompagnait lisait le FICHIER de l'outil et vérifiait qu'il contenait l'import et le titre de
section. Les deux y étaient — et **l'alerte ne sortait pas**, parce que le crochet appelle une
SOUS-COMMANDE qui rend la main bien avant le bloc où l'alerte était posée.

**Le test vérifiait que le texte existe dans le fichier ; ce qu'il fallait vérifier est que le
chemin RÉELLEMENT EMPRUNTÉ l'imprime.** Signal adjacent, signal visé — la leçon elle-même, commise
par le test écrit pour la garder. Ce qui l'a trouvé n'était pas un raisonnement mais **le journal
réel de la bannière** : zéro occurrence, en une seconde.

**La règle qui en sort, et elle vaut pour tout point d'entrée à sous-commandes** : un fichier a
autant de chemins d'exécution que de sous-commandes, **et un seul est celui du crochet**. On teste
celui-là, ou on ne teste rien.

## L40 — Un test qui lit une donnée VIVANTE ne juge pas le code, il juge le disque

*Payée le 2026-09-29 (tâches #1172 et #1181) : cinq tests au rouge en une nuit sans qu'une ligne du code testé ait bougé, quatre faux outils dormant dans le journal de production, et une part du filet parallèle rouge puis verte sur exactement le même code.*

**Cinq tests du filet sont passés au rouge en une nuit sans qu'une ligne du code testé ait bougé.**
Tous lisaient `.tool-usage-history.json`, le journal d'usage — une donnée non versionnée, qui repart
à vide avec le conteneur. L'un exigeait qu'un outil nommé en dur y figure, un autre une note de 2/2,
un troisième que la mesure soit simplement possible.

**Le vert venait donc du disque, jamais du code.** Et le rouge aussi : les cinq accusaient des outils
parfaitement sains, le jour où la machine avait été recréée. C'est la forme la plus coûteuse du
faux signal, parce qu'elle décrédibilise le filet entier — on prend l'habitude de relancer jusqu'au
vert, et c'est ainsi qu'un vrai rouge finit par passer.

**LE DEUXIÈME ÉTAGE EST PIRE : le filet ÉCRIVAIT dans cette donnée.** Quatre contributions au nom
d'outils inexistants (`docs/fake-*`) dormaient dans le vrai journal, posées par des tests qui
injectaient pourtant un faux système de fichiers pour tout le reste — le seul appel non injecté
suffisait. Un test qui écrit dans la donnée de production **fabrique la mesure qu'un autre test
lira demain**. Et en parallèle, quatre parts écrivant le même fichier produisaient une part rouge
puis verte sur exactement le même code.

**LES DEUX GESTES, et ils ne se remplacent pas l'un l'autre :**
- **Côté lecture** : le sujet se DÉRIVE de la donnée au lieu d'être nommé en dur, et quand la donnée
  est vide le test le DIT (`NON MESURÉ`) au lieu de rendre un vert sur rien. On vérifie alors la
  COHÉRENCE du chiffre — le numérateur tient dans son dénominateur — jamais sa valeur.
- **Côté écriture** : tout chemin de donnée réelle s'injecte, et le chemin lui-même se demande au
  module plutôt que de se recopier, sinon l'isolation d'un côté casse la lecture de l'autre (c'est
  arrivé dans l'heure).

**Le contre-exemple utile** : garder une vérification EN DIRECT contre le vrai dépôt reste juste
(Article 25) — ce qui ne l'est pas, c'est d'en faire une assertion sur un CHIFFRE que le conteneur
détermine. On exige que la mesure AIT LIEU et se tienne debout, pas qu'elle vaille une valeur.

**Terrain** : quand j'écris un test qui lit un journal, un compteur, un registre daté ou un fichier non versionné · mots : journal, compteur, historique, en direct, live, vivante, non versionné, flaky, intermittent · fichiers : scripts/check-house.mjs, scripts/tool-usage.mjs, scripts/filet-en-parts.mjs

**Porté par** : `cheminDuJournal()` (le chemin s'injecte), l'isolation par part dans
`filet-en-parts.mjs`, et les quatre assertions réécrites en « mesure ou refus nommé ». Le réflexe
général — ne jamais figer une valeur que le disque détermine — se déclare ici.


## L41 — Une exemption écrite en PROSE n'exempte rien, et le garde-fou la refacture indéfiniment

*Payée le 2026-09-29 (tâche #1179), et payée trois fois : la même fausse dette documentaire facturée les 2026-09-27 et 2026-09-29, avec l'exemption écrite en toutes lettres juste à côté depuis la première.*

**La même fausse dette documentaire a été facturée TROIS FOIS**, à deux jours d'intervalle, avec son
explication écrite juste à côté. Un document de process expliquait, en toutes lettres et très bien,
pourquoi un changement de son contrôleur ne le concernait pas — le contrôleur héberge des règles
d'une dizaine de sujets, une seule est la sienne. Le détecteur, lui, ne lit pas de la prose.

**Ce qui rend le cas instructif : tout le monde avait raison.** La règle du détecteur est juste (un
contrôleur de process qui n'en garde qu'un, le changer c'est changer ce process-là). L'exemption du document
est juste aussi. Ce qui manquait, c'est que l'une soit LISIBLE par l'autre.

**Le geste** : donner au document une ligne que la mécanique sait lire, à côté du paragraphe qui
l'explique aux humains. Pas à la place — les deux servent des lecteurs différents, et la ligne seule
ne dirait pas pourquoi.

**ET LA DÉCLARATION NE DOIT JAMAIS DEVENIR UNE ÉCHAPPATOIRE** : le contre-test qui compte est celui
qui vérifie que la dette **redevient pleine** quand le changement touche vraiment la portée
déclarée. Sans ce sens-là, on n'a pas ajouté une information, on a ajouté une porte de sortie (BP4).

**Terrain** : quand un garde-fou accuse quelque chose que je sais légitime, et que je m'apprête à l'expliquer en commentaire · mots : exemption, faux positif, dette, accusation, légitime, prose, déclaration · fichiers : scripts/god-of-all-process.mjs, docs/xp-ia-process-detail.md

**Porté par** : `porteeDeclaree()` / `porteeDeclareeDuProcess()` chez god-of-all-process, et les cinq
contre-tests qui vérifient les deux sens. Le réflexe général — quand j'explique un faux positif en
prose, me demander si la mécanique pourrait lire cette explication — se déclare ici.


# Bonnes pratiques

*(Section ouverte le 2026-09-23. Même document que les leçons, jamais la même liste : une bonne
pratique n'a pas été payée par une erreur, et c'est la seule chose qui la distingue. Trois entrées
au départ, toutes observées réellement sur ce projet — jamais des conseils génériques recopiés.)*

## BP1 — La règle s'écrit à UN endroit et se dérive partout ailleurs

Devant vingt endroits à corriger, le réflexe est de corriger les vingt. Le bon geste est de trouver
l'endroit unique dont les vingt dépendent, et de ne toucher que celui-là. Les vingt suivants, ceux
qui n'existent pas encore, en hériteront sans qu'on y pense.

**Terrain** : quand la même correction doit s'appliquer à plusieurs endroits · mots : partout, tous les outils, chaque rapport, harmoniser, généraliser · aucun fichier : « la même correction à plusieurs endroits » ne se lit dans aucun chemin en particulier, et un motif large l'attacherait à tout — donc à rien
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

**Terrain** : quand je construis ou je livre un détecteur · mots : détecteur, garde-fou, vérifier, faux positif, zéro, aucun écart · fichiers : scripts/*.mjs

**Porté par** : **aucun mécanisme** — rien ne peut constater qu'un détecteur a été éprouvé dans les
deux sens, seule la discipline le porte. Déclaré plutôt que tu.

*Observée le 2026-09-23 : le détecteur d'entrées équivalentes rendait « 0 groupe » sur le vrai
registre. C'était juste — vérifié ensuite sur des doublons fabriqués, qu'il a bien attrapés, et sur
deux entrées de même terrain mais de sujets différents, qu'il a bien laissées tranquilles. Sans ces
deux épreuves, le zéro n'aurait rien valu.*

## BP5 — Un seuil se DÉRIVE du corpus réel ; s'il ne peut pas l'être, il se DÉCLARE provisoire

Un seuil choisi au jugé a l'air d'un seuil mesuré : les deux s'écrivent avec un chiffre. La
différence ne se voit jamais dans le code, seulement dans ce qu'on écrit à côté.

**Le geste, en deux temps.** D'abord chercher le corpus qui répond : ici, « à partir de combien de
demandes un message mérite-t-il le process ? » se lit sur les quatre saisines réellement archivées
— 8, 4, 11 et 31 points, donc la plus petite qui ait mérité le process en portait quatre, donc le
seuil est quatre. Ensuite, quand le corpus n'existe pas, **le dire dans la sortie de l'outil** au
lieu de poser un chiffre qui aura l'air aussi solide que l'autre.

**Le cas qui rend la règle utile est le second**, et il s'est présenté dans la même fonction : le
seuil en CARACTÈRES ne pouvait pas être dérivé, précisément parce qu'aucune saisine n'avait jamais
été archivée dans son texte d'origine. Il est donc posé à 1 500 **avec sa nature écrite** — « jamais
mesurée, à recalibrer sur les trois premières saisines archivées » — et le verdict de l'outil porte
cette mention à chaque fois qu'il s'appuie dessus.

**Ce que ça évite** : une estimation qui se fait passer pour une mesure est pire que les deux. On ne
la rediscute jamais, parce qu'elle a l'air d'avoir déjà été tranchée.

**Terrain** : quand j'écris un seuil, une constante de déclenchement, un plancher · mots : seuil, à partir de, minimum, déclenche, palier, constante · fichiers : scripts/*.mjs

**Porté par** : **aucun mécanisme** pour la moitié qui compte — rien ne distingue un chiffre mesuré
d'un chiffre inventé, et l'écrire ici EST la protection (Article 27). La moitié dérivable, elle, est
couverte en amont par l'Article 24 (un registre se LIT, il ne se recopie pas).

*Observée le 2026-09-27 sur les tâches #723/#724 : les deux seuils du même déclencheur, l'un dérivé
et l'autre pas, dans la même fonction et à trois lignes d'écart.*

## BP6 — Avant de remplir un registre à la main, chercher si la preuve est DÉJÀ écrite dans le dépôt

Devant un registre vide et quatre-vingts lignes à y mettre, le réflexe est de les taper. Dans un
dépôt qui écrit le POURQUOI à côté du QUOI (Article 27), une partie de ces lignes existe déjà —
sous une autre forme, à un autre endroit, et sans lecteur.

**Le geste** : chercher la FORMULE que le dépôt emploie pour dire la chose, avant d'écrire la
première ligne. Ici, « (2026-09-22, nom donné par l'utilisateur) » vivait dans le commentaire de
tête de six outils, depuis des jours, au-dessus du code que ce nom désigne.

**Ce que ça change, et ce n'est pas seulement du temps gagné.** Un registre semé depuis le dépôt
CITE sa preuve ligne par ligne — le fichier et le numéro de ligne — donc il se vérifie. Un registre
tapé de mémoire affirme. Sur un registre dont le rôle est précisément de prouver qui a décidé quoi,
la différence est toute la valeur du document.

**Le corollaire, à ne jamais lâcher** : on ne sème QUE ce qui porte une trace écrite. Les entrées
sans trace restent dans la dette, où elles doivent être — un registre complété au jugé ne prouve
plus rien (L13).

**Terrain** : quand un registre est vide et que je m'apprête à le remplir · mots : registre, inventaire, à remplir, historiser, tracer, qui a décidé · fichiers : scripts/*.mjs

**Porté par** : `findBaptemesDocumentes()` (`scripts/agent-des-noms.mjs`) pour ce cas-là. Le geste
général — chercher la trace avant de taper — n'a pas de porteur possible et se déclare ici.

*Observée le 2026-09-27 sur la tâche #706. Le registre des baptêmes n'existait pas, l'outil annonçait
« 81 noms sur 81 jamais validés », et six de ces baptêmes étaient documentés noir sur blanc. Un faux
positif rencontré en mesurant a dicté la précision du motif : « SON mot » attrapait « SON motif de
titre ». Ici un faux positif n'aurait pas fait du bruit — il aurait inscrit au registre un nom que
l'utilisateur n'a jamais choisi, dans le document qui existe pour prouver le contraire.*
