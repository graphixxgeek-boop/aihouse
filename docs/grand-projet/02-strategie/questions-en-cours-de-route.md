# Ses questions posées en cours de route — et ce qu'elles ont changé

*(Sa consigne du 2026-09-28 : « enregistre bien ma question et ta réponse dans les notes du GRAND
PROJET pour la prochaine mise à jour de la stratégie de ce chantier ». Puis, quelques minutes plus
tard : « je te perturbe avec une question isolée, c'est pas bon : intègre ta réponse aux fichiers
que tu vas me livrer ».)*

**Pourquoi ce fichier existe séparément.** Une question posée entre deux livrables se perd : elle
est répondue dans la conversation, la conversation se termine, et la réponse meurt avec elle
(Article 27). Or plusieurs de ses questions de passage ont **changé le plan** — ce ne sont pas des
apartés, ce sont des décisions. Elles vivent donc ici, datées, avec ce qu'elles ont modifié.

**Ce qui distingue ce fichier de `01-absorption/questions-consolidees.md`** : celui-là porte les
49 questions écrites dans ses DEUX documents, à répondre en bloc. Celui-ci porte les questions
qu'il pose **pendant le travail**, et qui appellent une réponse immédiate.

---

## Q-R1 · La tuyauterie de l'Agence (2026-09-28, 22h40)

> **Sa question** : « la tuyauterie de l'agence, elle est exportable, ou bien l'agence se branche
> sur la tuyauterie du projet qu'elle rejoint, ou bien les questions d'infrastructure dépendent des
> cas ? »

**Sa troisième hypothèse est la bonne, mais « ça dépend » n'est pas la réponse : ce sont TROIS
COUCHES, chacune avec une règle fixe.** Mesuré sur les 84 scripts réels, pas déduit :

| Couche | Combien | La règle |
|---|---:|---|
| **EMPORTÉE** — la plomberie interne (`lib-shell`, `tool-usage`, `report-template`, `html-report`, `lib-json`, `lib-markdown-table`) | **67 scripts** | elle part avec l'Agence, entière. Rien du projet hôte n'y entre. |
| **EXIGÉE** — ce que l'Agence suppose présent : un disque, un shell, git | **72 scripts** | elle s'y BRANCHE, elle ne l'apporte jamais. Universel : tout projet de code en a un. |
| **ADAPTÉE** — un fournisseur précis (Gemini, Cloudflare) | **5 scripts** | la seule couche qui dépend du cas : `check-gemini-quota`, `check-house`, `check-profile`, `check-spirit`, `sites-env`. |

**Donc : 94 % de l'Agence est indépendante de l'infrastructure du projet qu'elle rejoint.**

**DEUX corrections en chemin, et le chiffre a bougé DANS LES DEUX SENS** — c'est ce qui le rend
croyable :

1. Le premier passage comptait SIX scripts liés à un fournisseur. Quatre ne faisaient que le
   **nommer** — dans un commentaire ou dans un registre déclaré. *Mentionner n'est pas dépendre*,
   exactement la correction que `data-archangel` a déjà payée sur son propre compteur. Traitée
   comme une CLASSE (on retire commentaires et déclarations avant de mesurer), jamais comme quatre
   exceptions. **96 %.**
2. Puis un contre-test a montré que le motif ratait la dépendance la PLUS courante du dépôt :
   `\bGEMINI\b` ne reconnaît pas `GEMINI_API_KEY`, parce que le tiret bas est un caractère de mot.
   **94 %, et 5 adaptateurs au lieu de 3.**

**Le chiffre a baissé parce que la mesure est devenue juste, jamais parce que l'Agence s'est
dégradée.** Une mesure qui ne descend jamais ne mesure rien.

---

## Q-R2 · Et si l'hôte ne peut pas fournir ? (2026-09-28, 22h50)

> **Sa question** : « si l'hôte ne peut pas fournir les éléments, alors safe-export résout la
> question et met ce qu'il faut en place, c'est comme ça ? »

**Non — et il ne doit pas.** La réponse diffère par couche, et les confondre produirait un outil
dangereux :

- **EXIGÉE manquante** (pas de git, pas de shell, pas de Node) → **on REFUSE, on ne répare pas.**
  Un outil qui installerait git à la place de son hôte modifierait la machine de quelqu'un d'autre
  pour se rendre installable. C'est la définition d'un logiciel en qui on ne peut pas avoir
  confiance. Ce qui manque se **DIT**, avant l'installation.
- **ADAPTÉE manquante** (pas de clé Gemini, pas de Cloudflare) → **on DÉGRADE proprement.** L'outil
  concerné refuse avec sa raison écrite, tout le reste tourne. **Ce n'est pas une théorie** : le
  banc témoin a mesuré **68/68 outils debout sur un dépôt étranger sans nos clés**, précisément
  parce que ceux qui en ont besoin refusent au lieu de planter.
- **EMPORTÉE** → sans objet : elle arrive avec l'Agence.

---

## Ce que ces deux questions ont CHANGÉ dans l'outillage

**Il avait raison sur le fond** : *« ce genre de question devrait être anticipé par safe-export »*.
SAFE-EXPORT mesurait les liens vers CE dépôt-ci ; il ne mesurait nulle part ce que l'Agence **exige
de son hôte**. Or c'est la première question d'un acheteur. Deux ajouts :

- **`node scripts/safe-export.mjs tuyauterie`** — la répartition des trois couches, dérivée des
  imports réels. Devient la **huitième dimension** du rapport d'exportabilité.
- **`node scripts/safe-export.mjs accueil`** — le contrôle à lancer **dans le projet d'arrivée** :
  il dit ce qui manque AVANT d'installer. Le banc témoin, lui, teste chez nous sur un dépôt que
  nous choisissons — ce n'est pas la même question, et rien ne répondait à celle de l'acheteur.
  *(Sa première version rendait « REFUSÉ » sur une machine qui avait tout, faute d'avoir importé le
  lanceur partagé. Un contrôle d'accueil qui refuse à tort ferait renoncer un acheteur dont la
  machine convient — pire que pas de contrôle du tout.)*

---

## Et sa vraie inquiétude derrière la question

> « j'espère juste que ce genre de question est prévu dans la stratégie du plan d'action »

**Réponse honnête : elle ne l'était PAS, et le plan a été corrigé.** Le plan couvrait la
rationalisation et la modularisation ; il ne disait rien du **contrat d'hôte** — c'est-à-dire de ce
que l'Agence promet à celui qui l'installe. Ce n'est pas un détail d'infrastructure : c'est la
première page du mode d'emploi d'un produit.

**C'est exactement pour ça que ses questions de passage ne sont pas des perturbations.** Celle-ci a
trouvé un trou que ni les sept audits ni mon plan n'avaient vu.

---

# LES ACTIONS EN FACE — une par question, jamais une réponse qui meurt

*(Sa demande, le 2026-09-28 : « j'espère aussi que pour chaque question et réponse du fichier, ou
groupe de réponses, il y a des actions en face, en face de ma demande inavouée, à calibrer avec
toi ». C'est l'Article 28 appliqué aux réponses — et ce tableau devient le GABARIT du grand fichier
de réponses à ses 49 questions.)*

**Quatre colonnes, et la troisième est celle qu'il réclame** : ce qu'il demande vraiment derrière sa
question. Une question technique cache presque toujours une inquiétude qui ne se dit pas.

| # | Sa demande INAVOUÉE, telle que je la lis | L'action | État |
|---|---|---|---|
| **Q-R1** | *« Est-ce que mon Agence est vraiment vendable, ou est-ce qu'elle est collée à ce projet-ci sans que je le voie ? »* | La mesure existe et elle est rassurante : **96 %**. Elle devient la **8ᵉ dimension** du rapport d'exportabilité, donc elle sera re-mesurée à chaque passage au lieu d'être une réponse d'un soir. | **RETENU — fait** |
| **Q-R1** | *« Et les 3 qui restent, ça veut dire que je suis coincé ? »* | Non : `check-spirit` appelle vraiment Gemini, `sites-env` décrit Cloudflare, `check-house` les simule. Les trois sont des **adaptateurs**, pas du cœur. Les remplacer est une journée, pas un chantier. | **RETENU — à chiffrer dans le BUILD MAP (#1118)** |
| **Q-R2** | *« Est-ce que l'acheteur va se retrouver bloqué, et est-ce que ce sera de ma faute ? »* | Non, à une condition qui est maintenant outillée : il doit **savoir avant d'installer**. D'où `safe-export accueil`, à lancer chez lui. | **RETENU — fait** |
| **Q-R2** | *« Est-ce que mon Agence doit se débrouiller toute seule, quoi qu'il arrive ? »* | **Non, et c'est une décision de conception, pas une limite.** Une Agence qui installerait git chez son hôte serait un logiciel en qui on ne peut pas avoir confiance. **Refuser proprement est une qualité commerciale**, pas un aveu. | **À TRANCHER avec lui — c'est une promesse produit, pas un choix technique** |
| **les deux** | *« Est-ce que je pose des questions qui vous font perdre du temps ? »* | Elles ont trouvé un trou que **ni les sept audits ni mon plan** n'avaient vu. Le contrat d'hôte n'était nulle part. | **RETENU — le plan est corrigé** |

## Ce qui lui revient, et rien d'autre

**Une seule chose est à trancher, et elle n'est pas technique** : *l'Agence refuse-t-elle proprement,
ou tente-t-elle de s'installer coûte que coûte ?* Ma recommandation est ferme — **refuser
proprement** — mais c'est une **promesse faite à un acheteur**, donc elle lui appartient. Elle
rejoint la liste de calibrage.
