# Le référent de la discipline d'exécution — blueprint exportable

*Document générique, réutilisable sur un autre projet. Décrit un PATRON, jamais une implémentation :
rien de ce qui suit ne dépend du domaine, du langage ou de l'outillage du projet d'origine.*

## Le problème qu'il résout

Un projet qui grandit finit par écrire des process : une suite d'étapes pour une activité coûteuse,
consignée pour ne pas dépendre de la mémoire de celui qui la mène. Puis un second process arrive,
puis un cinquième. Et le jour où quelqu'un s'apprête à agir, il ne sait plus lequel s'applique — ni
si celui qu'il suit est encore à jour.

**Le vrai trou n'est pas l'absence de process, c'est l'absence de RÉFÉRENT.** Chacun se débrouille,
recompose lui-même le choix entre plusieurs documents, et découvre après coup qu'il en a sauté un.
Pire : quand plusieurs contrôleurs surveillent chacun un process, ils parlent tous en même temps et
personne ne sait qui a raison.

Ce patron pose donc un point unique auquel s'adresser, avec un rôle triple :

1. **Avant d'agir** — « quel process gouverne ce que je m'apprête à faire ? ». On le lui demande au
   lieu de reconstituer la réponse soi-même.
2. **Après une vague de travail** — il produit LE rapport de conformité, et lui seul. Les
   contrôleurs spécialisés gardent leur verdict, mais c'est lui qui les relaie. **Une seule voix,
   jamais une par contrôleur.**
3. **Il signale ce qui manque** — une activité coûteuse sans process, un process sans contrôleur,
   un document promis qui n'existe pas, une tension non résolue entre deux process.

## Les partis pris qui font sa valeur

**Il nomme le responsable de chaque étape sautée.** Un rapport qui dit « une étape manque » sans
dire à qui elle incombait ne produit aucune correction. Et il liste À PART les étapes qu'aucun
mécanisme ne peut vérifier : celles-là ne sont reprochées à personne, parce que les compter comme
des manquements viderait le reproche de son sens.

**Il se surveille lui-même.** Il porte son propre process maître et le vérifie. Un surveillant que
personne ne surveille dérive sans que rien ne le dise — et rien n'est plus discret qu'un contrôleur
qui s'est arrêté.

**Toute modification INDIRECTE d'un process doit être suivie d'une mise à jour DIRECTE de son
document.** C'est la règle qui empêche la dérive la plus courante : on change un mécanisme, le
process change de fait, et le document continue de décrire l'ancien. Six mois plus tard, personne ne
sait lequel des deux fait foi.

**La connexion document ↔ contrôleur se vérifie dans les DEUX SENS**, et ils ne disent pas la même
chose : une règle écrite que rien ne fait respecter est une illusion de sécurité ; une règle
appliquée que personne n'a écrite ne survivra pas au départ de celui qui l'a posée.

## Ses garde-fous, et ses limites honnêtes

**Il SIGNALE FORT, il ne BLOQUE JAMAIS.** Le manquement est nommé, le responsable désigné, et il
reste visible tant qu'il n'est pas traité — donc impossible à oublier, mais rien ne s'arrête. Un
contrôleur qui bloquerait sur un sujet sans rapport avec le travail en cours pousserait simplement à
le contourner, et un contrôleur contourné ne contrôle plus rien.

**Ce qu'il ne peut pas voir, il le DIT.** Une part de tout process ne se joue que dans une
conversation : aucun fichier n'en porte la trace. Pour ces étapes-là, il DEMANDE plutôt que de
supposer, et refuse de se déclarer conforme sans réponse. Une conformité supposée vaut moins que
rien : elle rassure à tort.

**Jamais un pourcentage vert sur un dénominateur vide.** Quand il n'a pas pu mesurer, il écrit « pas
mesuré » — jamais un score flatteur calculé sur zéro élément. C'est la distinction la plus
importante de tout le patron, et la plus facile à perdre.

## Ce que ce patron n'est pas

Ce n'est **pas** un surveillant de la CONDUITE de ceux qui travaillent — le respect des règles de
travail, la façon de rendre compte, la qualité des échanges. Ce domaine appelle un second outil,
distinct, dont ce référent relaie le verdict dans une section clairement à part. Les mélanger
produirait un rapport où « une étape a été sautée » et « la personne a mal expliqué son travail »
auraient le même poids, alors qu'ils n'appellent ni la même correction ni le même interlocuteur.

## `selfCheck()` — le surveillant qui se surveille

*(Section ajoutée le 2026-09-23, lot 1 du chantier CLAUDE.md. MOÏSE-TABLES-DE-LOI a refusé de
réduire l'Article 26 à un renvoi vers ce blueprint tant qu'il ne décrivait pas le mécanisme que la
charte lui attribue nommément.)*

**Le problème qu'il ferme est structurel, pas accidentel.** Un référent de la discipline
d'exécution porte son PROPRE process — celui qui dit comment il produit son rapport, qui il relaie,
ce qu'il vérifie. Ce process-là n'a, par construction, personne au-dessus de lui. Et un surveillant
que personne ne surveille dérive exactement comme les autres, avec cette différence qu'il continue
pendant ce temps à distribuer des verdicts qui font autorité.

**Ce que `selfCheck()` vérifie sur le référent lui-même**, avec la même exigence qu'il applique aux
autres : son process maître est-il déclaré au même endroit que ceux des autres · chacune de ses
propres étapes a-t-elle une preuve vérifiable ou une déclaration honnête de non-mesurabilité · les
documents qu'il promet existent-ils réellement · les contrôleurs secondaires dont il relaie la voix
sont-ils tous déclarés.

**Le parti pris qui le rend crédible** : son auto-vérification ne bénéficie d'aucun traitement de
faveur. Elle utilise le MÊME code que les vérifications ordinaires, appliqué à sa propre entrée.
Une auto-vérification écrite à part serait une seconde vérité, et la seconde vérité d'un
surveillant est toujours la plus indulgente.

**Sa limite honnête, déclarée** : il vérifie la STRUCTURE de son process, jamais la JUSTESSE de ses
verdicts. Savoir si une étape signalée manquante l'était vraiment reste un jugement humain.

## La chaîne sur les DOCUMENTS, pas seulement sur les rapports

*(2026-09-25, tâche #834 — constat : « l'Article 28 s'arrête au rapport, rien ne couvre
document → tâche ».)*

**Le trou, et il est du type exact que l'Article 28 a été écrit pour fermer.** `checkActionChain()`
vérifie la chaîne d'un plan d'action qu'on lui PASSE : celui qu'un outil produit, en mémoire, au
moment où il tourne. Or un projet écrit aussi des plans d'action dans des **documents**, destinés à
un humain — et ceux-là n'étaient vérifiés par personne.

**Pourquoi ça compte autant qu'un rapport, et même plus** : un document est plus durable qu'un
rapport, donc sa référence morte survit plus longtemps. « → tâche #818 » écrit hier ressemble à un
lien vivant six semaines plus tard, alors que la tâche peut n'avoir jamais existé. *Une référence
morte ressemble à un lien, ce qui est pire qu'une absence* — la phrase était déjà dans l'Article 28,
elle ne s'appliquait simplement pas à cette moitié du terrain.

**Deux vérifications mécaniques, pas une de plus** : un plan d'action annonce-t-il au moins une
tâche, et ces tâches existent-elles dans le suivi durable.

**Le cas à deux causes, et il est réel** : une tâche introuvable peut signifier deux choses
opposées — elle n'a jamais été créée, ou son numéro vient d'un gestionnaire de tâches de SESSION,
qui n'est pas une source durable. Les deux s'écrivent `#92`. La sortie nomme donc les deux causes
plutôt que d'en choisir une : accuser au hasard serait un faux rouge, et les deux appellent des
gestes différents. C'est aussi, en soi, une dette de reprise au sens de l'Article 27 — un numéro
qu'un futur agent ne pourra pas résoudre.

**Sa limite, déclarée** : il vérifie qu'un plan annonce des tâches et qu'elles existent, jamais
qu'elles sont les bonnes ni que le plan est complet. Un plan juste et une formalité bien remplie se
ressemblent ici.

**Commande** : `node scripts/god-of-all-process.mjs plans` — sous-commande dédiée, jamais imposée au
rappel de chaque commit, parce qu'elle lit deux arborescences entières.
