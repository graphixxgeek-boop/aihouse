# Les trois mots d'ordre dans la charte — proposition à valider (tâche #703)

<!-- ARBORESCENCE — bloc généré par `node scripts/the-king.mjs cascade --inserer`, ne pas éditer à la main -->

**Où ce document se situe dans la cascade** — remonté des déclarations « DÉCOULE DE » réelles, jamais dessiné à la main :

```
philosophie-et-politique
    └── strategies/strategie-globale-du-projet-entier
        └── strategies/charte-et-referentiel-strategie
            └── ▣ plans/charte-trois-mots-ordre-proposition-2026-09-28   ← CE DOCUMENT
                (aucun document ne déclare découler de celui-ci)
```

<!-- /ARBORESCENCE -->

> **DÉCOULE DE :** `docs/strategies/charte-et-referentiel-strategie.md`
> *(Déclaré le 2026-09-29, tâche #1178 — il propose un vocabulaire pour la charte elle-même.)*

*(2026-09-28. **Ce document PROPOSE, il n'acte rien.** La borne posée pour la nuit autonome est
explicite : CLAUDE.md est autorisé « mais tu me montres avant ». Le texte ci-dessous est donc écrit,
prêt à coller, et **CLAUDE.md n'a pas été touché**. Le mécanisme, lui, EXISTE déjà : les trois
règles surveillées sont en service dans `angel-of-ia-process` depuis ce jour — ce qui manque est
seulement leur inscription dans la loi.)*

## Ce qui a déjà été fait, et qui ne dépend pas de cette validation

Trois règles de conduite surveillées — `fiabiliser`, `optimiser`, `harmoniser` — ajoutées à
`REGLES_SURVEILLEES` (`scripts/angel-of-ia-process.mjs`). Angel les DEMANDE à chaque évaluation et
refuse d'être au vert sans réponse. Détail :
`docs/referentiel/angel-of-ia-process.md`, section « Les trois mots d'ordre permanents ».

**Pourquoi le mécanisme est parti avant la loi, et pourquoi ce n'est pas l'inverse du bon ordre** :
sa demande visait précisément le fait que les mots étaient ÉCRITS et que rien ne les imposait
(« est-ce que c'est bien dans les process ? est-ce que c'est harmonisé ? fiabilisé ? optimisé ?
;))) »). Écrire d'abord dans la charte aurait reproduit le défaut ; poser d'abord le mécanisme le
referme. La ligne de charte vient nommer ce qui existe, pas l'annoncer.

## Le texte proposé

**Emplacement** : Article 20, à la toute fin du « Protocole d'application », juste après la phrase
« Chaque compte rendu à l'utilisateur doit dire explicitement ce qui a été vérifié, préservé,
amélioré et corrigé. »

**Pourquoi là plutôt qu'en Article neuf** : le protocole EST la liste de ce qu'on se demande à
chaque itération ; trois questions de clôture y sont chez elles. Un Article de plus aurait aussi
coûté une renumérotation de rien du tout mais un bloc de plus à recharger à chaque message, pour
une règle qui tient en quatre lignes (Article 13, garde-fou d'allègement).

> **Les trois mots d'ordre permanents, à la clôture de CHAQUE tâche.** **FIABILISER** : est-ce que
> ça marche vraiment — le filet passe-t-il, le cas limite est-il couvert, ai-je VU le test échouer
> quand il le devait ? **OPTIMISER** : peut-on faire mieux, et est-ce COMPLET — reste-t-il une
> moitié du besoin, un chemin plus court, une mesure qu'on aurait pu rendre au lieu d'une
> impression ? **HARMONISER** : est-ce raccordé au reste — même format que ses voisins, registre à
> jour, documenté au même endroit, et rien qui dise deux fois la même chose de deux façons ?
> **Trois, jamais quatre** : le quatrième candidat (« un mécanisme le porte-t-il ? ») est déjà tenu
> par l'Article 27, et une question rituelle à quatre devient une case qu'on coche sans penser.
> Elles sont portées par `angel-of-ia-process`, qui les DEMANDE et refuse d'être au vert sans
> réponse.

## Ce qui reste à trancher, et c'est à lui

1. **Ce texte, tel quel ?** Ou plus court — les trois mots et leur question, sans le « trois jamais
   quatre » ni le porteur (qui vivent déjà dans la fiche de l'outil).
2. **Cet emplacement ?** Article 20 en fin de protocole, ou plutôt Article 14 (vigilance permanente,
   qui parle déjà de se demander à chaque fois si le changement sert ou érode le projet).

## Plan d'action

- **RETENU** — poser les trois règles surveillées dans angel : *fait le 2026-09-28*, tâche #703.
- **RETENU** — documenter les trois mots dans la fiche d'angel : *fait le 2026-09-28*, tâche #703.
- **À TRANCHER** — l'inscription dans CLAUDE.md : texte et emplacement, décision de l'utilisateur
  (Article 16). Tâche #703 reste ouverte tant que ce point n'est pas tranché.
