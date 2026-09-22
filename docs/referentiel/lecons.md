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

**Porté par** : `SANS_BLUEPRINT_ASSUME` / `SANS_CONSTAT_PROPRE` (`scripts/safe-export.mjs`, `scripts/report-template.mjs`) — les exemptions décidées sont déclarées comme données, jamais reprochées à chaque passage.

**Terrain** : quand je construis ou je resserre un garde-fou · mots : garde-fou, détecteur, faux positif, seuil, exemption · fichiers : scripts/*.mjs

## L5 — Distinguer « je n'ai rien trouvé » de « je n'ai pas pu regarder »

Les deux se ressemblent dans un rapport, et ne veulent pas du tout dire la même chose. Un outil
lancé sans les données qu'il lui faut doit **dire l'absence de mesure**, jamais rendre un vert.
Corollaire : jamais un pourcentage calculé sur un dénominateur vide.

Troisième état à ne pas oublier non plus : un élément **non mesurable** (illisible, absent) ne doit
jamais être compté conforme — il casse le verdict.

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

---

# Bonnes pratiques

*(Section ouverte le 2026-09-23. Même document que les leçons, jamais la même liste : une bonne
pratique n'a pas été payée par une erreur, et c'est la seule chose qui la distingue. Trois entrées
au départ, toutes observées réellement sur ce projet — jamais des conseils génériques recopiés.)*

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
