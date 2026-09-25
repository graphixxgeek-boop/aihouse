# Treize règles de la charte n'ont aucun mécanisme — et ne le disent pas

*(Tâche #658, mesuré le 2026-09-25T09:17Z par `node scripts/moise-tables-de-loi.mjs diagnostic`.
**La charte n'a pas été modifiée** : c'est son document, et treize retouches ne se décident pas
sans lui.)*

## Ce que l'Article 27 exige de la charte elle-même

> « Quand un mécanisme est impossible (cf. la limite honnête de tool-brain et de SMART-CONSO-TOKEN),
> l'écrire noir sur blanc EST la protection — et **cette impossibilité se déclare, elle ne se tait
> pas**. »

**Rien ne vérifiait ça.** Une règle sans mécanisme n'est pas fautive en soi — beaucoup ne peuvent
pas en avoir. Elle l'est quand elle **se tait** là-dessus : un lecteur ne peut alors pas savoir si
personne n'y a pensé ou si personne ne le peut, et **les deux appellent des gestes opposés** —
construire le garde-fou manquant, ou écrire pourquoi il ne peut pas exister.

## La mesure, et elle corrige le constat de départ

La tâche #658 disait : « les seuls Articles rouges sont le 7 et le 23 ». **C'est faux aujourd'hui**,
et c'est pour ça qu'on mesure plutôt qu'on ne se souvient. L'Article 7 porte une nature que
l'utilisateur a **DÉCIDÉE**, il sort du compte. Et le vrai chiffre est bien plus gros :

| | |
|---|---|
| Articles de la charte | 33 |
| Sans porteur mécanique | 16 |
| **Qui DÉCLARENT leur impossibilité** | **3** — Art. 27, 28, 31 |
| **Sans porteur ET sans un mot** | **13** |

**Les treize** : Art. 1 · 6 · 8 · 10 · 12 · 14 · 15 · 16 · 17 · 21 · 23 · 24 · 25.

Le constat de départ n'était pas faux quand il a été écrit. **Il a vieilli, et personne ne le
relançait** — exactement ce que l'Article 25 (« vérifier régulièrement son propre travail ») existe
pour empêcher. Article 25 qui est, lui-même, dans la liste des treize.

## Ce qui est fait, et ce qui attend

**FAIT** : le silence est désormais mesuré à chaque diagnostic de la charte
(`findImpossibilitesNonDeclarees()`), avec 5 contre-tests. Il ne dira jamais qu'un Article DEVRAIT
avoir un mécanisme — il juge le silence, jamais l'absence.

**À TRANCHER — et c'est lui qui tranche, la charte est son document.** Pour chacun des treize, deux
gestes possibles, et le choix n'est pas le même selon l'Article :

- **Déclarer l'impossibilité** — une phrase, à la fin de l'Article, du type de celles que 27, 28 et
  31 portent déjà. C'est ce que l'Article 27 accepte explicitement. Coût : quelques lignes chacune.
- **Construire le porteur** — quand un mécanisme est en fait possible et qu'on ne l'a simplement pas
  écrit. Deux candidats sautent aux yeux : l'**Article 24** (évolutivité) a déjà douze garde-fous
  mécaniques dans le dépôt, ils ne sont juste pas nommés dans son texte ; l'**Article 21**
  (HYPER-SCAN-CHECKPOINT) a un script entier derrière lui.

**Ma lecture, à confirmer** : la plupart des treize sont des règles de JUGEMENT (« le sens avant la
forme », « se mettre à la place du personnage ») qu'aucune mécanique ne pourra jamais vérifier — pour
celles-là, déclarer est la seule issue et c'est très bien. Mais **deux ou trois ont un porteur qui
existe déjà et que leur texte ne nomme pas**, ce qui est le cas le plus vicieux : une protection
réelle, invisible au lecteur, donc supprimable sans que personne s'en aperçoive.

## Plan d'action (Article 28)

| Constat | État | Tâche |
|---|---|---|
| Rien ne vérifiait l'exigence que l'Article 27 pose à la charte | **RETENU — FAIT** | `findImpossibilitesNonDeclarees()`, 5 contre-tests, câblé au diagnostic (#789) |
| Le constat de #658 (« seuls le 7 et le 23 ») avait vieilli | **ÉCARTÉ** | ce n'est pas une erreur : il était juste à sa date. Ce qui manquait est le RELANCEMENT, et c'est désormais automatique à chaque diagnostic |
| 13 Articles sans porteur et sans un mot | **À TRANCHER** | déclarer ou construire, Article par Article — c'est sa charte (#790) |
| Art. 21 et 24 ont peut-être un porteur non nommé | **À TRANCHER** | le cas le plus vicieux : une protection réelle, invisible, donc supprimable sans que personne s'en aperçoive (#790) |
