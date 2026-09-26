# Installer l'Agence Codex sur un autre projet

*(Créé le 2026-09-26. Deuxième pièce manquante du kit de l'Agence : le plan dit comment elle marche,
celui-ci dit comment on la remonte.)*

**À LIRE APRÈS `docs/agence-blueprint.md`**, jamais avant : installer sans comprendre les quatre
couches produit un dossier de scripts que personne ne lance.

---

## Étape 0 — Décider ce qui part

**Ne pas tout emporter.** Trois catégories restent toujours derrière, et elles sont déclarées dans
le code (`EXEMPTES_DU_KIT`, `scripts/safe-export.mjs`) :

- **les crochets git** — ils câblent l'Agence à *ce* dépôt-ci ; ils se réinstallent, ils ne se
  copient pas ;
- **le script d'installation de l'environnement** — il décrit *cette* machine ;
- **ce qui sert le produit** plutôt que l'outillage.

Tout le reste part avec son kit : plan générique, code, fiche d'instanciation, registre, et la liste
de ses dépendances internes.

## Étape 1 — Le socle, avant tout outil

Ces fichiers ne rendent aucun verdict et tout le monde les importe. Les emporter en premier :

| Ce que c'est | Pourquoi d'abord |
|---|---|
| le lanceur de commande tolérant | un outil sur deux l'appelle |
| le chargeur de JSON partagé | tout registre démarre par une lecture qui peut échouer |
| le lecteur de table markdown | les registres sont des tables |
| le cadre commun des rapports | sans lui, chaque outil réinvente sa mise en page |
| le gabarit HTML de remise | la copie de lecture livrée |
| le mécanisme d'historisation | ce qui donne une tendance à un chiffre |

**Attention, écart connu et déclaré** : dans le projet d'origine, le lanceur de commande héberge
aussi l'organigramme et les registres de portée. **Il ne part pas tel quel** — il faut d'abord y
séparer le générique du spécifique, sinon on emporte l'équipe du projet précédent.

## Étape 2 — Le suivi durable, avant les outils qui le lisent

Beaucoup d'outils lisent le registre des tâches. Sans lui, ils tournent et ne trouvent rien — ce qui
ressemble à un dépôt propre. **Poser la structure de suivi d'abord**, même vide : un registre vide
qui se déclare vide vaut mieux qu'un registre absent qui rend zéro.

## Étape 3 — Les contrôles gratuits, un par un

Un outil à la fois, et **on le lance pour de vrai** avant de passer au suivant. Un outil qui n'a
jamais tourné contre le vrai dépôt n'est pas installé, c'est une intention.

L'ordre recommandé suit la vitalité : ce sans quoi l'Agence ne tourne pas, puis ce qui porte une
garantie, puis le reste.

## Étape 4 — Le câblage automatique

Installer le crochet de fin de commit, et **n'y mettre que ce qui est gratuit et utile à chaque
fois**. Un contrôle qui rend le même verdict vingt fois de suite dans un crochet cesse d'être lu, et
emporte les autres dans son silence.

## Étape 5 — L'orchestrateur périodique

Déclarer les items : ce qui doit repasser régulièrement, qui produit quoi, et **où chaque rapport se
dépose**. C'est l'étape la plus facile à bâcler et la plus coûteuse à rattraper : un rapport produit
sans dossier de dépôt déclaré est un rapport que personne ne retrouvera.

## Étape 6 — Les boucles de vérification croisée

**L'étape que l'on saute, et qu'il ne faut pas.** C'est elle qui distingue une Agence d'une
collection de scripts : les contrôles qui vérifient que chaque registre est lu, que chaque outil est
déclaré, que chaque rapport aboutit à une décision, que chaque outil compte ses passages.

Sans elles, l'installation fonctionne le premier jour et se dégrade sans bruit à partir du second.

## Étape 7 — Vérifier que l'installation est réelle

Trois questions, dans cet ordre :

1. **Chaque outil a-t-il tourné au moins une fois contre le vrai dépôt ?**
2. **Un contrôle a-t-il déjà trouvé quelque chose ?** Un réseau qui n'a jamais rien trouvé est
   soit un dépôt parfait, soit un réseau qui ne regarde pas — et la seconde hypothèse est la plus
   probable.
3. **Le scan d'exportabilité repasse-t-il au vert chez vous ?** Il mesure sa propre installation.

## Ce que cette procédure ne garantit pas

Elle remonte la mécanique. **Elle ne transmet pas la discipline** — consulter les outils avant
d'agir, poser les questions, écrire le pourquoi à côté du quoi. Ces règles-là ne s'installent pas :
elles se décident, et le dépôt d'accueil doit les adopter explicitement ou renoncer à la moitié de
ce que l'Agence apporte.
