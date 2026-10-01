# Faut-il tout reprendre à zéro ? — la proposition de plan d'action

> **De quoi on parle** : tu as proposé le 30 septembre au soir de repartir sur un code
> entièrement propre, en situant le cœur de l'Agence et en agrégeant les modules autour.
> **Ta demande, mot pour mot** : *« il faut partir sur un nouveau code totalement propre, et
> recommencer tout à zéro, en reprenant tout point par point : situer le cœur de l'agence, et
> agréger les modules autour. Franchement je serais partant pour faire ça. »* Puis, dans ton plan
> de nuit : *« travaille la refonte complète en amont, prépare le plan étape par étape, et fais-moi
> une proposition de plan d'action. »*
> **Tâches concernées** : **#1344** (chiffrer la refonte) · **#1356** (l'outil de chiffrage) ·
> **#1343** (la carte par module) · **#1132** (les trois bornes du « terminé »).
> **Rien n'est décidé ici.** C'est une proposition : tu tranches.

---

## 1. Ce que les chiffres disent — et ils ne disent pas ce que j'attendais

Tout ce qui suit est **mesuré**, pas estimé, et chaque chiffre se rejoue à la commande.

| Ce qu'on a mesuré | Le chiffre | Ce que ça veut dire, en clair |
|---|---|---|
| Volume de l'outillage | **88 fichiers, 92 167 lignes** | c'est le périmètre que ta proposition vise |
| **Décisions déjà prises, écrites dans le code** | **2 228** | **le vrai coût d'une refonte, et personne ne le comptait** |
| Leur répartition | médiane **8** par fichier · **un seul** fichier en porte **718** (32 %) | **le coût n'est pas réparti, il est concentré** |
| Le Jeu | 93 fichiers, et **moins d'une douzaine** mentionnent l'outillage (6 ou 10 selon le critère — les deux sont donnés exprès) | il est **déjà** indépendant : une refonte de l'Agence ne le toucherait pas |
| Kits d'export | **85 / 85 complets** | ce qui existe est **déjà** emportable ailleurs |
| Scripts avec une cible écrite en dur | **0 sur 88** | l'architecture n'est **pas** prisonnière de ce projet |
| Exportabilité globale | **88 %**, dont **3 dimensions à 100 %** | ce sont des acquis qu'une refonte **repartirait à zéro** |
| Obligations portées par nos documents | plus de **700**, et la très grande majorité dans UN SEUL document — les règles de travail en portent **3 à 4 fois plus que la charte**. *(Deux outils donnent deux comptes, 528 et 556 pour ce document, 129 et 173 pour la charte : ils ne comptent pas une obligation de la même façon. Je donne la fourchette plutôt que de choisir le chiffre qui m'arrange — c'est le troisième chiffre de cette nuit qui ne survit pas à sa vérification.)* | **c'est là qu'est le poids** |
| Registres à remplir pour UN outil qui arrive | **10** | le prix d'entrée d'un nouvel outil |

### La chose la plus importante de ce tableau

**Ton intuition est juste sur l'organisation, et fausse sur le code.** Tu as écrit :
*« en l'état l'agence est AUSSI, pour certaines parties : un vrai bazar organisé, construit sur le
tas, sans vision globale. »* Les mesures disent que c'est vrai de **l'organisation** — plus de 700
obligations, 10 registres par outil, aucune définition de « terminé » — et **faux du code
lui-même**, qui est déjà portable, déjà emballé, déjà découplé du Jeu.

**Et la preuve est tombée cette nuit, sur moi.** Les deux outils que j'ai construits ces deux
derniers jours étaient à **1 registre sur 10** et **0 sur 10**. L'un d'eux affichait un
avertissement de fiabilité qui **n'imprimait rien**, parce que personne ne l'avait déclaré.
Le code allait bien. C'est l'entrée dans l'équipe qui est trop chère.

---

## 2. Les trois voies — et il y en a bien trois, pas deux

### Voie A — La refonte totale, comme tu l'as proposée

**Ce qu'on ferait** : repartir d'un dépôt vide, reconstruire l'Agence module par module.

**Ce que ça coûte, chiffré** : les **2 228 décisions déjà prises** doivent être soit relues une par
une, soit **regagnées** — c'est-à-dire repayées en bugs. Plus les **3 dimensions à 100 %** qui
repartent à zéro, dont « l'Agence a-t-elle été installée POUR DE VRAI ailleurs », qui a coûté un
banc d'essai entier.

**Ce que ça rapporte** : une architecture cohérente dès le premier jour, sans dette d'empilement.

**Le risque réel, et il est précis** : une raison perdue **ne se voit pas**. Elle se paie six
semaines plus tard, sous la forme d'un bug déjà corrigé une fois. C'est l'Article 19 pris à
l'envers, et c'est le seul risque de cette voie qu'aucun test ne rattrape.

### Voie B — La refonte du NOYAU seulement *(celle que je te propose)*

**Ce qu'on ferait** : exactement ce que **ta propre phrase** décrit — *« situer le cœur de
l'agence, et agréger les modules autour »* — mais en ne **reconstruisant** que le cœur, les outils
existants devenant des modules qu'on y branche.

**Et tu as déjà nommé ce cœur**, dans ton plan de nuit : *« le cœur de l'agence est le suivi des
tâches, puis le fil de discussion par sujet en cohérence avec lui — c'est l'environnement dont on
a besoin dès le départ, c'est la preuve que c'est le cœur. »*

**Pourquoi c'est faisable, et c'est le chiffre qui le dit** : les 2 228 décisions sont
**concentrées**, pas réparties. La médiane est à 8 par fichier, et un seul fichier en porte un
tiers. **On peut donc reconstruire les fichiers légers et laisser les fichiers denses tranquilles**
— ce qu'une refonte totale, par définition, s'interdit.

**Ce que ça coûte** : une fraction de la voie A, et le chiffre exact dépend du périmètre du noyau,
qui est précisément la question que je te pose plus bas.

### Voie C — Pas de refonte, on attaque les obligations

**Ce qu'on ferait** : laisser le code tel quel et s'attaquer aux **plus de 700 obligations** et au
**prix d'entrée de 10 registres**.

**Pourquoi je ne la propose pas seule** : elle soigne le symptôme le plus douloureux, mais elle ne
répond pas à ta vraie demande — *« je ne comprends pas comment l'agence fonctionne par module »*.
Réduire les obligations ne rend pas l'Agence lisible.

**Mais elle n'est pas à jeter** : c'est l'étape 1 de la voie B, et elle sert dans tous les cas.

---

## 3. Le plan proposé — voie B, en six étapes

**Étape 0 — Définir « terminé », avant tout le reste.**
C'est **ton propre ordre**, tâche **#1132**, ouverte depuis le 28 septembre et jamais exécutée :
*« les trois bornes qui diront : l'agence est terminée »*. **Tant qu'elles n'existent pas, juger
l'Agence revient à mesurer une distance vers un point qui n'est pas posé** — et une refonte sans
définition d'arrivée est une refonte qui ne finit pas. *Décision : toi.*

**Étape 1 — La carte par module** (tâche **#1343**). Tu ne peux pas arbitrer ce que tu ne vois pas.
Un document qui dit, module par module : ce qu'il fait, ce dont il dépend, et ce qui casse si on
l'enlève. *Je la produis, avec un outil.*

**Étape 2 — Réduire le prix d'entrée** (la voie C, en étape). Faire tomber les 10 registres à
remplir. **C'est utile même si tu renonces à la refonte** — et c'est ce qui rendra le noyau neuf
tenable au lieu de le faire naître déjà lourd.

**Étape 3 — Écrire le noyau neuf**, propre : le suivi des tâches et les fils de discussion, sans
une ligne héritée. C'est petit, c'est ce que tu veux, et c'est ce qui sert dès le premier jour.

**Étape 4 — Rebrancher les modules un par un sur le noyau**, du plus utilisé au moins utilisé.
**Un par un, jamais en bloc** : chaque branchement est réversible tant que l'ancien tient encore.

**Étape 5 — Ne jeter l'ancien que quand le neuf a fait ses preuves**, module par module. Aucun
code n'est supprimé avant que son remplaçant ait tourné pour de vrai.

**Ce que ce plan protège, et c'est son seul vrai argument** : à **aucun moment** le projet n'est
cassé. Si on s'arrête à l'étape 2, on a quand même gagné. Si on s'arrête à l'étape 3, on a le
cœur que tu voulais. La voie A, elle, n'a pas de point d'arrêt utile avant la fin.

---

## 4. Ce que je ne décide pas, et qui t'appartient

**Q1 — Quelle voie ?** A (tout), **B (le noyau, ma proposition)**, ou C (les obligations seules) ?

**Q2 — Qu'est-ce qui est dans le noyau, exactement ?** Tu as nommé le suivi des tâches et les fils.
Est-ce que le **compteur d'usage des outils** et **l'heure fiable** en font partie — ils sont
utilisés par presque tout — ou restent-ils des modules ?

**Q3 — Les 2 228 raisons : qu'est-ce qu'on en fait ?** Trois réponses possibles, et il faut en
choisir une : on les relit toutes (long, sûr) · on relit seulement celles des fichiers qu'on
reconstruit (ma préférence) · on les abandonne en écrivant pourquoi (rapide, et on repaiera).

**Q4 — L'étape 0 d'abord, oui ou non ?** Je pense que oui, et c'est ton propre ordre. Mais si tu
préfères commencer par la carte (étape 1) pour voir avant de définir, c'est défendable aussi.

**Q5 — Le Jeu reste-t-il hors périmètre ?** Les mesures disent qu'il est déjà indépendant :
moins d'une douzaine de ses 93 fichiers mentionnent l'outillage — **6 ou 10 selon ce qu'on appelle « mentionner »**, et je donne les deux plutôt qu'un seul : deux critères, deux chiffres, et la conclusion tient sous les deux. Je pars du principe que oui, par ta consigne permanente. Confirme ou corrige.

---

## Plan d'action

| État | Constat | Ce qui en découle |
|---|---|---|
| **RETENU** | le chiffrage existe et il est rejouable | **FAIT** — tâche **#1356**, outil `cout-de-la-refonte` |
| **À TRANCHER** | Q1 à Q5 ci-dessus | **ta décision** — rien ne démarre avant |
| **RETENU** | la carte par module est le préalable de ta décision | tâche **#1343**, déjà ouverte |
| **RETENU** | « terminé » n'est défini nulle part | tâche **#1132**, ton propre ordre, ouverte depuis le 28/09 |
| **ÉCARTÉ** | écrire le guide de 50 pages pour l'IA maintenant | **raison écrite** : ta consigne est explicite — *« seulement si le plan d'action est validé »*. L'écrire avant serait écrire pour une architecture qui n'est pas choisie. |
