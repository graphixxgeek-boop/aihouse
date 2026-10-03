# Quand pourra-t-on dire « l'Agence est terminée » ? — trois bornes, à choisir

<!-- ARBORESCENCE — bloc généré par `node scripts/the-king.mjs cascade --inserer`, ne pas éditer à la main -->

**Où ce document se situe dans la cascade** — remonté des déclarations « DÉCOULE DE » réelles, jamais dessiné à la main :

```
philosophie-et-politique
    └── strategies/strategie-globale-du-projet-entier
        └── ▣ grand-projet/02-strategie/les-trois-bornes-de-la-fin   ← CE DOCUMENT
            (aucun document ne déclare découler de celui-ci)
```

<!-- /ARBORESCENCE -->

> **DÉCOULE DE :** `docs/strategies/strategie-globale-du-projet-entier.md`
> *« terminé » ne se définit qu'une fois su ce qu'on cherche à obtenir : les trois bornes se mesurent contre les trois objectifs ultimes que la stratégie globale porte.*

> **Ta commande, mot pour mot** : *« quand pourra-t-on statuer que l'agence est terminée ? Quel est
> le signal ? OBJECTIF : fixer une borne. ATTENDU : analyse, réflexion, proposition de 3 bornes
> différentes, enregistrement de l'objectif dans la stratégie. »*
> **Tâche #1132**, PRIORITAIRE-OBLIGATOIRE, **ouverte depuis le 28 septembre et jamais exécutée.**
> **Ce document ne tranche pas** : il te présente trois bornes vraiment différentes, chacune avec
> son chiffre d'aujourd'hui. Tu en choisis une — ou tu les combines.

---

## POURQUOI CETTE QUESTION PASSE AVANT LA REFONTE

**Sans borne, « l'Agence est-elle terminée ? » n'a pas de réponse possible** — on mesure une
distance vers un point qui n'est pas posé. Et ça a une conséquence très concrète : **une refonte
sans définition d'arrivée est une refonte qui ne finit pas.** C'est pour ça que l'étape 0 de la
proposition de refonte est celle-ci, et pas le code.

**Ton intuition de départ était la bonne** : tu as demandé **trois** bornes, pas une. Une borne
unique se discute sans fin ; trois bornes se comparent, et la comparaison fait apparaître ce qu'on
veut vraiment dire par « terminée ».

---

## LES TROIS BORNES — elles ne mesurent pas la même chose, et c'est voulu

Chacune répond à une question différente : **ce qu'elle sait faire** · **si elle peut partir** ·
**s'il lui reste du travail**.

### BORNE A — PAR LA CAPACITÉ : « elle fait tout ce qu'on lui demande »

> **L'Agence est terminée quand les 29 exigences qu'elle s'impose à elle-même sont toutes
> vérifiées MÉCANIQUEMENT — aucune « vérifiée en partie », aucune « personne ne la vérifie ».**

**Où on en est aujourd'hui : 27 sur 29.** Deux exigences restent partielles, et les deux pour la
même raison honnête :
- **X6** — « le POURQUOI vit à côté du QUOI » : l'absence d'explication est comptée, sa disparition
  aussi, mais **la QUALITÉ d'une explication ne se lit pas mécaniquement** ;
- **X7** — « le code applique les leçons déjà apprises » : le porteur est vérifié, la remontée
  aussi, mais **c'est toi qui dis à la Ronde si une leçon a été appliquée**.

**Ce qu'elle a de bon** : elle est mesurée aujourd'hui, elle ne dépend de personne d'autre, et elle
est à **deux pas** d'être atteinte.
**Ce qu'elle a de mauvais, et c'est sérieux** : les deux qui restent sont justement celles qu'aucune
machine ne peut finir. **Cette borne ne sera donc JAMAIS atteinte à 29/29** — à moins de décider que
« vérifiée en partie avec sa raison écrite » compte comme vérifiée. **Et cette décision est la vraie
question que cette borne te pose.**

### BORNE B — PAR LE DÉPART : « elle tient debout ailleurs, chez quelqu'un d'autre »

> **L'Agence est terminée le jour où elle a été installée pour de vrai sur un projet qui n'est pas
> celui-ci, par quelqu'un qui n'est pas nous, et où elle y a trouvé quelque chose de réel.**

**Où on en est aujourd'hui : exportabilité globale à 88 %**, sur 8 dimensions toutes réellement
mesurées. **Cinq sont à 100 %** *(re-mesuré le 2026-10-01 à 16h10 UTC : ce document disait TROIS,
écrit le 30 septembre. Deux dimensions sont passées à 100 % depuis, et il reste une sixième à 94 %.
La borne est donc plus proche qu'écrit, pas plus loin.)* Les deux qui traînent :
- **45 %** — 46 outils sur 85 mentionnent encore ce projet-ci, même en exemple ;
- **67 %** — 20 lignes de nos documents normatifs **exigent un outillage** que le successeur n'aura
  peut-être pas.

**Ce qu'elle a de bon, et c'est décisif** : **c'est la seule borne qu'un acheteur reconnaîtrait.**
Et c'est aussi la seule qui te dirait si le second projet existe vraiment.
**Ce qu'elle a de mauvais** : elle dépend de quelqu'un d'autre. **Tant que personne d'extérieur n'a
essayé, toute mesure de portabilité reste une INFÉRENCE** — y compris le banc témoin, qui tourne
sur notre propre machine.

### BORNE C — PAR LE SILENCE : « elle ne trouve plus rien chez elle »

> **L'Agence est terminée quand trois Rondes consécutives ne remontent plus aucune trouvaille
> NOUVELLE — et que le « rien trouvé » est distingué du « rien mesuré ».**

**Où on en est aujourd'hui : très loin.** La Ronde de cette nuit a remonté une trouvaille majeure
(341 constats sans traçabilité) et plusieurs secondaires, et il reste **116 tâches ouvertes**.

**Ce qu'elle a de bon** : elle est la seule des trois qui dise *« arrête d'ajouter »*. Les deux
autres peuvent être atteintes par une Agence qui continue de grossir ; celle-ci non.
**Ce qu'elle a de mauvais, et le projet le sait par expérience** : **un outil qui ne trouve rien
peut être un outil aveugle.** Cette borne n'est donc honnête que si chaque outil sait dire
« PAS MESURÉ » plutôt que « rien à signaler » — ce qui est aujourd'hui **vérifié pour tous les
outils à verdict** (critère 5 de pure-gold-unity, ✅). Sans cette garantie, la borne C serait la
plus facile à atteindre et la plus mensongère.

---

## CE QUE JE TE DIRAIS SI TU ME DEMANDAIS MON AVIS

**Aucune des trois ne suffit seule**, et pour une raison différente à chaque fois : A ne sera jamais
atteinte complètement, B ne dépend pas de nous, C peut être atteinte par aveuglement.

**La combinaison qui tient debout est A + B**, dans cet ordre : d'abord l'Agence fait ce qu'elle
s'est promis de faire (**27/29 aujourd'hui**, donc proche), **ensuite** quelqu'un d'autre l'installe
et elle y sert. **C ne serait pas une borne mais un SIGNAL D'ALERTE** : trois Rondes silencieuses
voudraient dire « vérifie que tes outils voient encore », jamais « c'est fini ».

**Mais c'est un avis, pas une mesure** — et c'est exactement le genre de choix qui t'appartient.

---

## LES QUESTIONS QUI RESTENT

**QB1 — Quelle borne, ou quelle combinaison ?** A seule · B seule · C seule · **A puis B**
(ma préférence) · autre chose.

**QB2 — Pour la borne A : une exigence « vérifiée en partie, avec sa raison écrite » compte-t-elle
comme vérifiée ?** Si oui, l'Agence est à **29/29 dès aujourd'hui** sur cet axe. Si non, cette
borne est inatteignable par construction. **Il n'y a pas de troisième réponse, et c'est pour ça que
la question doit être posée.**

**QB3 — Pour la borne B : « quelqu'un qui n'est pas nous », ça veut dire qui ?** Un vrai acheteur ·
un testeur à qui tu donnes le ZIP · ou une IA qui n'a jamais vu ce projet et qui reçoit le dossier
à l'aveugle (ce dernier cas existe déjà comme outil, `x-port-blindtest`, et il coûte des jetons).

**QB4 — Où la borne choisie s'inscrit-elle ?** Ta commande dit « enregistrement de l'objectif dans
la stratégie ». Je propose le registre des objectifs chiffrés
(`docs/objectifs-vs-resultats/registre.md`), qui est **déjà confronté au réel à chaque Ronde** —
donc la borne y sera mesurée toute seule, au lieu d'être une phrase dans un document.

---

## Plan d'action

| État | Constat | Ce qui en découle |
|---|---|---|
| **RETENU** | la commande #1132 réclamait une analyse et trois bornes, ouverte depuis le 28/09 | **FAIT** — ce document ; la tâche reste ouverte jusqu'à son choix |
| **À TRANCHER** | QB1 à QB4 | **tes décisions** — aucune n'est une mesure, toutes sont des arbitrages |
| **RETENU** | la borne choisie doit être MESURÉE, pas écrite | une ligne dans `docs/objectifs-vs-resultats/registre.md` dès que QB1 est tranchée — rattaché à **#1132** |
| **ÉCARTÉ** | choisir la borne à sa place pour débloquer le sujet | **raison écrite** : « terminé » est la définition de ce qu'il construit. La choisir pour lui serait choisir son projet, et c'est précisément ce que l'Article 16 réserve. |
