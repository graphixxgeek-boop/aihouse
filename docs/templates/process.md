# Gabarit — le document d'un process

*(2026-09-23, chantier 6 du plan de nuit. Demande de l'utilisateur : « le modèle de process et son
contrôle + les gabarits ».)*

**CE QUE CE GABARIT IMPOSE, ET CE QU'IL N'IMPOSE PAS.** Il impose **cinq réponses**, jamais cinq
titres. Les huit process déclarés ont des structures franchement différentes — « Partie 1…6 » chez
l'un, des titres parlants chez l'autre — et c'est très bien : un process de simulation et un process
d'intégration n'ont pas la même forme naturelle. Un gabarit qui imposerait les mêmes intitulés
recalerait les huit dès le premier passage, et un garde-fou qui accuse tout le monde cesse d'être lu
(leçon L4).

**Ce qui doit être VRAI de tout document de process**, quelle que soit sa mise en page :

---

## 1. Ce que ce process existe pour EMPÊCHER

Un défaut concret, déjà survenu ou clairement prévisible — jamais une intention générale. « Assurer
la qualité » n'est pas une réponse ; « un item rejoint la Ronde et son pourquoi est perdu le jour
même » en est une.

C'est la section la plus importante du document, et la première à écrire. Un process dont on ne
sait plus ce qu'il empêche devient une formalité qu'on exécute par habitude, puis qu'on saute parce
qu'elle ralentit — dans cet ordre, toujours.

## 2. Son DÉCLENCHEUR

Quand s'applique-t-il, exactement ? Un événement (« un outil arrive »), un calendrier (« à chaque
Ronde »), une demande (« l'utilisateur dit : lance une simulation »). Un process sans déclencheur
écrit ne se déclenche que si quelqu'un y pense.

## 3. Ses ÉTAPES, chacune avec sa preuve — ou l'aveu qu'elle n'en a aucune

Chaque étape dit ce qu'elle produit de vérifiable sur le disque. **Une étape sans preuve possible se
déclare comme telle**, avec sa raison : c'est une information, pas une faute. Ce qui est interdit,
c'est le silence — une étape muette est comptée comme faite par tout le monde et par personne.

## 4. Son CONTRÔLEUR, nommé

Le script qui vérifie ce process, cité par son chemin. Un process sans contrôleur est une intention
(leçon L7), et un contrôleur qui n'est pas nommé dans le document ne sera pas retrouvé par l'agent
suivant.

Si aucun contrôleur n'est possible, le document le dit et explique pourquoi — l'impossibilité
déclarée est une protection, l'impossibilité tue ne l'est pas.

## 5. Ce qu'il NE fait PAS

Ses limites, et les tensions avec les process voisins. C'est ce qui empêche deux process de se
marcher dessus, et c'est ce qui évite qu'on lui reproche plus tard de ne pas avoir couvert ce
qu'il n'a jamais prétendu couvrir.

---

## Les maillons du schéma unifié

`SCAN >> RAPPORTS >> ANALYSE >> PLAN D'ACTION >> QUESTIONS >> TÂCHES DE TRAVAIL`

Tout process INSTANCIE ce schéma avec ses étapes à lui. Un maillon qu'il n'exécute pas se déclare
avec sa raison dans `maillonsSansObjet` (`scripts/god-of-all-process.mjs`), jamais par omission.

## Squelette à recopier

```markdown
# Le process « <nom> » — <ce qu'il fait en une ligne>

*(<date>, <d'où vient la demande, citée si possible>. Contrôleur : `scripts/<contrôleur>.mjs`.)*

## Ce que ce process existe pour empêcher
<le défaut concret, déjà survenu de préférence>

## Son déclencheur
<événement, calendrier ou demande — jamais « quand c'est utile »>

## Ses étapes
1. <étape> — preuve : `<fichier ou dossier réel>`
2. <étape> — aucune preuve possible : <pourquoi>

## Ce qu'il NE fait pas
<limites, et tensions avec les process voisins>
```

## Comment il est contrôlé

`findProcessHorsGabarit()` (`scripts/god-of-all-process.mjs`) lit chaque document déclaré dans
`PROCESSES` et vérifie que les cinq réponses y sont trouvables. **Il détecte une PRÉSENCE, jamais
une qualité** : il ne peut pas juger si le défaut décrit est un vrai défaut, ni si le déclencheur
est le bon. Cette limite est écrite ici plutôt que laissée à découvrir — un contrôle qu'on croit
plus fort qu'il n'est vaut moins qu'un contrôle honnête.
