# GABARIT — la fiche d'un module de l'Agence

*(Créé le 2026-10-03, tâche **#1541**, sur ses demandes P42/P45/P48/P49. Il a validé le format de
la première fiche et demandé six ajouts ; ils sont appliqués ICI plutôt que fiche par fiche, sans
quoi la septième fiche repartirait du vieux format — Article 24.)*

> **DÉCOULE DE :** `docs/strategies/organisation-de-l-agence-strategie.md`
> *un gabarit de fiche est une décision d'organisation, pas une conviction.*

---

## POURQUOI UN GABARIT ET PAS UNE FICHE MODÈLE

**La première fiche disait « elle est reprise telle quelle pour le module suivant ».** C'est
exactement la copie à la main que l'Article 24 interdit : le format n'existait que dans un
exemplaire, et toute amélioration demandée après coup aurait dû être recopiée dans chaque fiche
déjà écrite. Le gabarit est le seul endroit où le format change une fois pour toutes.

**`findFichesIncompletes()` (`scripts/doc-report.mjs`) vérifie qu'une fiche porte toutes les
sections obligatoires.** Un gabarit que rien ne fait respecter est une intention (leçon L1).

---

## LES NEUF SECTIONS, ET AUCUNE N'EST FACULTATIVE

### 0 · LE PÉRIMÈTRE — *ce que ce module couvre, et où il s'arrête*

**Mis en tête à sa demande (P48).** Avant de dire ce qu'un module fait, on dit jusqu'où il va : un
périmètre lu après les fonctionnalités arrive trop tard, le lecteur s'est déjà fait une idée.

Deux listes, toutes deux **exhaustives** (P49) : ce qui est DEDANS, et ce qui est DEHORS avec la
raison. Une frontière sans son dehors n'est pas une frontière.

### 1 · CE QUE LE MODULE FAIT — *ses fonctionnalités*

En tableau, exhaustif. Jamais « … et quelques autres ».

### 2 · COMMENT IL FONCTIONNE

Le stockage, l'écriture, **le refus** et la restitution. La section du REFUS se détaille
pleinement (P45) : ce qu'un module refuse dit mieux ce qu'il est que ce qu'il accepte, parce que
l'acceptation est le cas normal et le refus est la décision.

### 3 · LE SCHÉMA

Un dessin en caractères, **précédé de son titre** (règle de format, tâche #1537), suivi du
paragraphe qui dit **ce que le schéma montre et qu'une liste cacherait**. Sans ce paragraphe, le
dessin est une décoration.

### 4 · CE QUE LE MODULE PRODUIT

La partie qu'on oublie toujours : un module se décrit volontiers par ce qu'il fait, rarement par
ce qu'il laisse derrière lui — or c'est ce qu'il laisse qui sert aux autres. En tableau :
production, et qui la consomme.

### 5 · SES INTERACTIONS ET SES DÉPENDANCES

**Deux colonnes nouvelles à sa demande (P48)** : le module **dépend-il** d'un autre pour
fonctionner, et dans quel sens va le lien. Une interaction n'est pas une dépendance : on peut
échanger avec un voisin sans mourir s'il disparaît, et la fiche doit dire lequel des deux c'est.

### 6 · SA CLASSE — *détachable, ou non*

**Sa demande P48, et elle découle de sa définition du 2026-10-03** : la partie INDÉTACHABLE est ce
que toute prestation réclame quoi qu'il arrive ; la partie DÉTACHABLE est faite de modules qu'on
branche ou qu'on retire. Trois réponses possibles, jamais deux :

| Verdict | Ce que ça veut dire |
|---|---|
| **INDÉTACHABLE** | on ne peut pas le retirer : plus rien ne fonctionne sans lui |
| **DÉTACHABLE** | il se branche ou se retire selon le besoin du client |
| **PAS TRANCHÉ** | personne n'a encore regardé — et c'est une réponse honnête, jamais un défaut à cacher |

### 7 · POURRAIT-IL ÊTRE VENDU SEUL ?

**Sa demande P48.** Distincte de la précédente : un module détachable n'est pas forcément vendable
seul — il peut se retirer sans pour autant intéresser quelqu'un à lui tout seul. La réponse dit
QUI l'achèterait et POUR QUOI, ou dit non avec sa raison.

### 8 · LE TABLEAU EXHAUSTIF DES SCRIPTS

**Sa demande P48, et c'est la plus exigeante.** Tous les scripts du module, sans exception :

| Script | Ce qu'il LIT | Pourquoi il le lit | Son utilité | Produit-il un rapport ? |
|---|---|---|---|---|
| … | … | … | … | oui, dans `docs/<outil>/` · non |

**Exhaustif veut dire exhaustif** (P49) : un script oublié ici est un script qui ne partira pas
avec le module le jour d'un export.

### 9 · CE QUI NE VA PAS, ET QUI SE MESURE

Chaque constat porte sa mesure et sa gravité. Un constat sans chiffre est une impression.

---

## PLAN D'ACTION *(Article 28)*

Obligatoire, en dernière section, avec les quatre états : RETENU (et sa tâche, qui doit exister
pour de vrai dans `docs/suivi/`), ÉCARTÉ (avec sa raison écrite), À TRANCHER, À INSTRUIRE.
