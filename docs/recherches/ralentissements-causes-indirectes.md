# Ce qui ralentit un projet — et pourquoi les vraies causes sont ailleurs qu'on ne regarde

*(Collecte web du 2026-09-28, pour équiper JESUS-LE-SAUVEUR — tâche #1103. Demande explicite de
l'utilisateur : « il devra t'aider à détecter toutes les raisons possibles de ralentissement, et
surtout, **il voit les causes indirectes, inattendues** ».)*

**Statut de ce document** : matière extérieure, **jamais une source de vérité sur notre dépôt**.
Chaque constat ci-dessous doit être confronté au dépôt réel avant d'en faire quoi que ce soit.

---

## Le constat central, et il renverse l'intuition : ce qui coûte, c'est l'ATTENTE, pas le TRAVAIL

La mesure qui structure tout le reste s'appelle la **fluidité** (*flow efficiency*) : la part du
temps total où quelque chose est réellement travaillé, plutôt qu'en attente.

> Une fonctionnalité qui met dix jours ouvrés à sortir mais ne reçoit que trois jours de travail
> réel a une fluidité de 30 % : les 70 % restants sont de l'attente — en file, en attente de
> relecture, bloquée par une dépendance.

**Les repères chiffrés** : 15 % est courant, **passer de 15 à 30 % divise le délai par deux**,
40 % est excellent. Autrement dit : **on gagne beaucoup plus en retirant de l'attente qu'en
travaillant plus vite.**

**Le corollaire, contre-intuitif et démontré par la théorie des files** : quand un système
approche de 100 % d'occupation, le temps d'attente n'augmente pas proportionnellement, **il
explose**. Un système chargé à 95 % n'est pas « un peu plus lent » qu'à 80 % — il est
dramatiquement plus lent. *Une file de tâches pleine ralentit donc tout ce qui y entre, y compris
les tâches faciles.*

**Ce que ça impose à JESUS** : il doit mesurer des **DURÉES D'ATTENTE**, pas des durées de travail.
Combien de temps une décision attend une réponse. Combien de temps un constat attend de devenir une
tâche. Combien de temps une alerte reste affichée sans que rien ne bouge.

---

## La dette de PROCESS, plus chère que la dette technique — et invisible par construction

> « Contrairement à la dette technique, la dette de flux de travail **ne vit pas dans le dépôt ni
> dans les diagrammes d'architecture**. Elle s'accumule silencieusement dans les opérations de tous
> les jours. »

**Les chiffres relevés** : **30 à 50 % de l'effort d'un projet** part en coordination et en
navigation de process. Et l'« inadaptation du process » plus la « dette de rôles » (qui fait quoi,
et qui tranche) expliquent à elles seules **33,8 % de la variation de satisfaction** au travail.

**Pourquoi c'est invisible** : la dette de process **se répartit**. Chaque obligation prise
isolément paraît légitime et coûte peu ; c'est la somme qui écrase, et personne ne voit jamais la
somme. C'est exactement le garde-fou que la charte de ce projet s'est écrit à elle-même — « ce qui
sature n'est pas le coût mais le NOMBRE D'OBLIGATIONS » — et personne ne le compte.

**Ce que ça impose à JESUS** : compter les obligations, pas leur poids. Et regarder **la dette de
rôles** : deux outils qui se disputent le même périmètre coûtent plus qu'un outil manquant.

---

## La fatigue d'alerte : entre 35 % et 91 % des avertissements ne sont pas actionnables

C'est le chiffre le plus dur de la collecte, et il est mesuré sur de vraies bases d'analyse
statique.

> « Les développeurs deviennent insensibles aux avertissements, au point de passer à côté des
> problèmes critiques. » · « Quand la grande majorité des alertes s'avèrent bénignes, on se met
> naturellement à supposer que la plupart sont fausses — ce qui crée des angles morts dangereux. »

**Les trois causes de rejet identifiées** : l'avertissement est **difficile à comprendre**, **mal
intégré au flux de travail**, ou **non actionnable**.

**Ce que ça impose à JESUS** : c'est le terrain le plus mesurable ici, parce que ce dépôt garde la
trace de ses propres alertes. Deux signaux directs : **l'alerte inextinguible** (celle qu'aucune
action légitime ne peut éteindre — elle devient du décor) et **le taux d'actionnabilité** (combien
d'alertes sont devenues des tâches, ce que la chaîne de l'Article 28 enregistre déjà).

---

## Les autres causes indirectes relevées, chacune avec son signal observable

| Cause | Pourquoi elle est indirecte | Le signal à chercher |
|---|---|---|
| **Changement de contexte** | le coût ne s'impute à aucune tâche : il est payé entre elles | un chantier repris plusieurs fois au lieu d'être mené d'un trait |
| **Éparpillement des outils** | chaque outil est utile ; c'est leur nombre qui coûte | des outils jamais sollicités, des périmètres qui se recouvrent |
| **Gros lots** | une grosse livraison coûte bien plus que deux moitiés | des commits ou des chantiers anormalement gros |
| **Attente d'une validation humaine** | « la façon la plus rapide de tuer l'élan » | le temps qu'une décision passe en attente |
| **Documentation pauvre ou périmée** | on paie en relecture, jamais en écriture | un document que plus rien ne lit |
| **Dette de rôles** | personne ne sait qui tranche, donc personne ne tranche | deux outils sur le même périmètre, ou un périmètre sans propriétaire |

---

## Plan d'action (Article 28)

- **RETENU → la fluidité comme mesure centrale de JESUS.** Il mesure l'ATTENTE, jamais seulement le
  travail. Tâche porteuse : **#1103**.
- **RETENU → l'alerte inextinguible devient un signal à part entière.** Le projet en a déjà payé
  deux cas documentés (le garde-fou des axes qui criait sur son propre doublon, l'avertissement
  moteur facturé deux fois). Tâche porteuse : **#1103**.
- **RETENU → le taux d'actionnabilité des alertes.** La chaîne de l'Article 28 enregistre déjà quels
  constats sont devenus des tâches ; personne ne calcule le ratio. Tâche porteuse : **#1103**.
- **RETENU → le comptage des obligations, jamais leur poids.** Aligné sur le garde-fou que la charte
  s'est déjà écrit. Tâche porteuse : **#1103**.
- **ÉCARTÉ → les métriques d'équipe (satisfaction, burn-out, taille d'équipe).** Raison écrite : ce
  projet a **un** humain et **une** IA. Transposer des mesures conçues pour dix développeurs
  produirait des chiffres qui ont l'air justes et ne mesurent rien.
- **ÉCARTÉ → la taille des lots au sens des pull requests.** Raison écrite : il n'y a pas de
  relecture par un tiers ici, donc le mécanisme (attente de relecture) n'existe pas. Ce qui en
  reste — un chantier trop gros pour être mené d'un trait — est couvert par le changement de
  contexte.
- **À TRANCHER → le seuil de fluidité en dessous duquel JESUS alerte.** La littérature donne 15 %
  courant / 40 % excellent, mais sur un projet à un seul agent ces repères ne transposent pas
  directement. Le seuil se dérivera de nos propres mesures, pas de la littérature (BP5 : un seuil
  qui ne se pose pas dans un creux est décrété, pas dérivé).

---

## Sources

- [Flow Efficiency — Where is the Waste in Your Software Delivery Process? (Planview)](https://blog.planview.com/flow-efficiency/)
- [Flow Efficiency: Why Most of Your Lead Time Is Just Waiting (DEV)](https://dev.to/karim_g/flow-efficiency-why-most-of-your-lead-time-is-just-waiting-3m8e)
- [Flow & Queueing Theory (LeSS)](https://less.works/less/principles/queueing_theory)
- [Process Debt Is More Expensive Than Technical Debt (DI)](https://di.net.au/blog-posts/process-debt-is-more-expensive-than-technical-debt)
- [What Is Workflow Debt? The Silent Killer of Efficiency (Quixy)](https://quixy.com/blog/what-is-workflow-debt/)
- [Non-Technical Debt in Agile Software Development (arXiv)](https://arxiv.org/pdf/2509.01445)
- [A Large-Scale Collection Of (Non-)Actionable Static Code Analysis Reports (arXiv)](https://arxiv.org/html/2511.10323)
- [Mitigating False Positive Static Analysis Warnings (IEEE TSE)](https://dl.acm.org/doi/10.1109/TSE.2023.3329667)
- [Why Your Development Team's Velocity Is Dropping (Directus)](https://directus.com/resources/why-your-developer-velocity-is-dropping)
- [Hidden Developer Workflow Bottlenecks (Nemo IT Solutions)](https://www.nemoitsolutions.com/hidden-workflow-bottlenecks-developer-productivity/)
