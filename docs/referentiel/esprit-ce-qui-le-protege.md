# L'ESPRIT — ce qui le protège vraiment, et ce qui ne tient qu'à ma mémoire

> **De quoi on parle** : l'esprit rugueux, sarcastique, cynique de Lia et Noé est la **loi suprême**
> du projet (Article 0). Tu as demandé que l'ESPRIT soit finalisé avant la refonte, au même titre
> que la philosophie et la politique.
> **Ce document ne redit pas ce qu'est l'esprit** — c'est la charte qui le dit, et le redire ici
> créerait le deuxième document qui finit par diverger (Article 24). **Il dit ce qui le PROTÈGE**,
> mesuré plutôt qu'affirmé.
> **Tâche concernée** : **#1358**.

---

## LA RÉPONSE COURTE, ET ELLE N'EST PAS CONFORTABLE

**On ne peut pas « finaliser » l'ESPRIT cette nuit, et la raison est précise** : le seul outil
capable de vérifier que l'esprit tient encore — `check-spirit` — **n'a jamais été lancé**. Il
envoie de vraies provocations au vrai modèle et coûte de vrais appels API, donc il exige ta
validation (Article 22). **La loi suprême du projet est la chose la moins vérifiée qu'il contient.**

Ce n'est pas une excuse : c'est le constat qui doit précéder toute « finalisation ». On ne finalise
pas ce qu'on n'a jamais mesuré.

---

## CE QUI EST MESURÉ, ET COMMENT

**La mesure** : `abraham-les-references` découpe la charte en 33 unités numérotées et dit, pour
chacune, si un **mécanisme réel** la porte ou si elle ne tient qu'à la prose. Croisé avec le
nombre de fois où chaque Article est **cité** dans les 777 fichiers du dépôt.

**Le résultat d'ensemble, sur les 33 Articles** : 7 sont des **LOIS** portées par un mécanisme ·
**16 sont des DISCIPLINES SANS PORTEUR** · 10 sont des modes d'emploi d'outil.

**Et voici les cinq Articles qui définissent l'esprit :**

| Article | Ce qu'il porte | Son état | Fois où il est cité |
|---|---|---|---|
| **0** — Hiérarchie des lois | l'esprit est la loi suprême | ✅ **LOI** — porté | **327** |
| **11** — Zéro répétition, personnalités étanches | les deux voix ne se mélangent jamais | ✅ **LOI** — porté | 85 |
| **17** — Se mettre à la place des personnages | la cohérence vue de l'intérieur | 🚨 **SANS PORTEUR** | **110** |
| **10** — Répliques locales : l'exception encadrée | la variété de FOND, jamais de forme seule | 🚨 **SANS PORTEUR** | 35 |
| **12** — Le sens avant la forme | chaque message a un sens vérifiable | 🚨 **SANS PORTEUR** | 10 |

### Ce que ce tableau dit, et c'est le vrai enseignement

**Trois des cinq Articles de l'esprit ne tiennent qu'à ma mémoire.** Et le plus exposé est
l'**Article 17**, cité **110 fois** dans le dépôt : il est partout dans les intentions, et **nulle
part dans les mécanismes**. Un Article très cité et non porté est le pire des deux mondes — tout le
monde croit qu'il est protégé *parce qu'on en parle tout le temps*.

**Pourquoi ça compte précisément AVANT une refonte** : ce qui a un porteur survit à une réécriture,
parce que le mécanisme part avec le code. Ce qui n'en a pas survit seulement si quelqu'un y pense.
**Une refonte emporterait donc d'abord ce qui est déjà le moins protégé.**

---

## CE QUI EXISTE DÉJÀ COMME PROTECTION, ET SA LIMITE HONNÊTE

| Protection | Ce qu'elle attrape | Ce qu'elle n'attrape pas |
|---|---|---|
| `check-spirit` | une dérive **grossière** du ton (vocabulaire de service client) face à de vraies provocations | tout le reste — et **il n'a jamais tourné** |
| `check-profile` | le profil psychologique des personnages | idem, jamais lancé |
| EL-PROFESSOR | une note de fidélité à la charte, sur une simulation réelle | il juge après coup, jamais pendant |
| le registre anti-doublon (Article 11) | la répétition mot pour mot et l'écho entre les deux voix | la répétition de FOND, qui est le vrai risque (Article 10) |

**Et une bonne nouvelle, mesurée** : depuis le 2026-09-25, `check-spirit` **sait refuser de
conclure**. Si toutes ses provocations sont bloquées par le moteur, il affiche `🚨 PAS MESURÉ` au
lieu de « aucun marqueur grossier détecté » — qui était un satisfecit rendu sur zéro donnée, **sur
la loi suprême du projet**.

---

## CE QU'IL FAUDRAIT POUR VRAIMENT FINALISER L'ESPRIT

Dans l'ordre, et aucune étape ne se saute :

1. **Lancer `check-spirit` pour de vrai**, une première fois. Coût : de vrais appels API, donc
   **ta validation** (Article 22 : `node scripts/smart-conso-api.mjs check-spirit --confirm` avant).
   Tant que ça n'a pas eu lieu, tout jugement sur l'esprit est une opinion.
2. **Lire les réponses à la main.** Ses heuristiques ne détectent que le grossier ; elles ne
   dispensent jamais de lire. C'est écrit dans la charte, et c'est vrai.
3. **Décider si les Articles 10, 12 et 17 peuvent recevoir un porteur** — ou déclarer par écrit
   qu'ils n'en auront jamais, avec la raison. **Les deux réponses sont acceptables ; le silence
   ne l'est pas** (Article 27).

---

## Plan d'action

| État | Constat | Ce qui en découle |
|---|---|---|
| **RETENU** | 3 des 5 Articles de l'esprit n'ont aucun porteur, dont l'Article 17 cité 110 fois | tâche **#1358** — leur donner un porteur, ou déclarer par écrit qu'aucun n'est possible |
| **À TRANCHER** | `check-spirit` n'a jamais été lancé, et c'est la seule vérification réelle de la loi suprême | **ta validation** — il coûte de vrais appels API, et je ne l'engage pas sans toi |
| **ÉCARTÉ** | recopier ici la définition de l'esprit pour « tout avoir au même endroit » | **raison écrite** : la charte la porte déjà, et un deuxième exemplaire finit toujours par diverger (Article 24). Ce document dit ce qui la PROTÈGE, jamais ce qu'elle dit. |
