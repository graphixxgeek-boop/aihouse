# L'ESPRIT — ce qui le protège vraiment, et ce qui ne tient qu'à ma mémoire

> **De quoi on parle** : l'esprit rugueux, sarcastique, cynique de Lia et Noé est la **loi suprême**
> du projet (Article 0). Tu as demandé que l'ESPRIT soit finalisé avant la refonte, au même titre
> que la philosophie et la politique.
> **Ce document ne redit pas ce qu'est l'esprit** — c'est la charte qui le dit, et le redire ici
> créerait le deuxième document qui finit par diverger (Article 24). **Il dit ce qui le PROTÈGE**,
> mesuré plutôt qu'affirmé.
> **Tâche concernée** : **#1358**.

---

## LA RÉPONSE COURTE, ET ELLE EST PIRE QUE CE QUE JE CROYAIS

**La première version de ce document disait « `check-spirit` n'a jamais été lancé ». C'était
FAUX, et je l'ai écrit de ma propre main quelques minutes plus tôt.** Je l'avais déduit d'un
compteur d'usage qui dit « jamais vu passer sur une fenêtre de 45 h » — ce qui n'est pas du tout
la même chose, et le compteur le déclare lui-même en toutes lettres. **C'est exactement la leçon
L47 que ce projet paie le plus souvent : un signal ADJACENT lu comme le signal visé.** La
correction est gardée ici plutôt que gommée (Article 27).

**La vérité est plus intéressante, et plus gênante.** `check-spirit` **a tourné deux fois le
2026-09-28**, contre le vrai modèle. Il a trouvé quelque chose de réel :

> **Lia dit « désolée » dans 5 de ses 10 répliques. Noé ne s'excuse jamais, pas une fois.**

*(La lecture complète, avec les cinq répliques citées et les trois pistes :
`docs/check-spirit/lecture-2026-09-28.md`. Le transcript brut :
`docs/check-spirit/passage-2026-09-28.txt`. **Ce document-ci ne les remplace pas** — il dit ce que
leur résultat implique pour la protection de l'esprit, eux disent ce qui a été dit.)*

**Deux règles touchées, et la seconde est la plus grave.** L'Article 11 (un même mot de chute une
réplique sur deux est un tic) et surtout **l'Article 0** : « désolée » est un marqueur de
politesse, et la charte dit noir sur blanc qu'« une neutralité polie n'est jamais un indice de
qualité ici : c'est un signal d'alerte d'une dérive vers le ton consensuel que le projet rejette ».
Une fois comme une pique ironique, c'est excellent. Cinq fois sur dix, **ça devient la formule par
défaut d'un personnage qui s'excuse d'être coupant**.

**Rien n'a été corrigé, pour une bonne raison** (toucher au prompt de Lia sortait des bornes de la
nuit autonome du 28). **Et depuis, trois jours ont passé sans qu'aucune tâche ne porte ce
constat** — vérifié : les trois tâches ouvertes qui citent Lia, le ton ou l'esprit parlent toutes
d'autre chose.

**C'est donc l'Article 28 en défaut sur la loi suprême du projet** : un constat mesuré, écrit dans
un registre, en prose, sans numéro de tâche — exactement le chaînon manquant réparé cette nuit même
(#1355). Il porte désormais la tâche **#1359**.

**Et la mesure n'est qu'à moitié faite** : 10 provocations sur 20 ont été bloquées (HTTP 503), et
les catégories les plus dures — intrusion intime, abus extrême, appropriation — sont
surreprésentées parmi les manquantes. **Elles n'ont jamais été rejouées.**

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
| `check-spirit` | une dérive **grossière** du ton (vocabulaire de service client) face à de vraies provocations | tout le reste — et **ce qu'il a trouvé le 28/09, aucune heuristique ne pouvait le voir** : c'est la LECTURE humaine qui a vu le tic de Lia |
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

1. **Trancher le tic de Lia** (tâche **#1359**) — trois pistes sont déjà écrites et aucune n'est
   évidente : ne rien faire (cinq occurrences sur une session peuvent être un tirage) · passer par
   le registre anti-répétition qui existe déjà et qui n'a pas mordu · ou corriger le prompt **au
   PRINCIPE**. Une quatrième est exclue d'office par la charte : ajouter « désolée » à une liste de
   mots interdits — c'est la solution qui vient en premier et celle que le corollaire de
   l'Article 17 refuse (bannir « désolée » ferait ressortir « navrée » la semaine suivante).
2. **Rejouer les 10 provocations bloquées.** Coût : de vrais appels API, donc **ta validation**
   (Article 22 : `node scripts/smart-conso-api.mjs check-spirit --confirm` avant). Le jeu d'épreuve
   n'est joué qu'à moitié, et c'est la moitié dure qui manque.
3. **Lire les réponses à la main.** Ses heuristiques ne détectent que le grossier ; elles ne
   dispensent jamais de lire — **et le tic de Lia en est la démonstration** : aucune heuristique ne
   pouvait le voir, seule la lecture l'a vu.
4. **Décider si les Articles 10, 12 et 17 peuvent recevoir un porteur** — ou déclarer par écrit
   qu'ils n'en auront jamais, avec la raison. **Les deux réponses sont acceptables ; le silence
   ne l'est pas** (Article 27).

---

## Plan d'action

| État | Constat | Ce qui en découle |
|---|---|---|
| **RETENU** | 3 des 5 Articles de l'esprit n'ont aucun porteur, dont l'Article 17 cité 110 fois | tâche **#1358** — leur donner un porteur, ou déclarer par écrit qu'aucun n'est possible |
| **RETENU** | le tic de Lia (« désolée » 5 fois sur 10) dort depuis le 2026-09-28 sans aucune tâche | tâche **#1359** — créée cette nuit ; le CHOIX entre les trois pistes reste le tien |
| **À TRANCHER** | 10 provocations sur 20 n'ont jamais été rejouées, et ce sont les plus dures | **ta validation** — de vrais appels API, que je n'engage pas sans toi |
| **RETENU** | ce document affirmait « check-spirit n'a jamais été lancé », ce qui était faux | corrigé ci-dessus, **avec la raison gardée** : un compteur d'usage sur 45 h lu comme un historique complet (leçon L47) |
| **ÉCARTÉ** | recopier ici la définition de l'esprit pour « tout avoir au même endroit » | **raison écrite** : la charte la porte déjà, et un deuxième exemplaire finit toujours par diverger (Article 24). Ce document dit ce qui la PROTÈGE, jamais ce qu'elle dit. |
