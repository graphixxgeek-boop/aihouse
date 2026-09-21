# Outil concordance/évolutivité — dossier de conception (préliminaire, en cours)

*(2026-09-21, idée formulée en conversation lors de l'audit d'évolutivité — Article 24 —, consignée
le même soir sur demande explicite de l'utilisateur : « OK à renseigner dans un fichier preliminaire,
comme le veut la regle ». Aucun code encore écrit — ce fichier accumule les arbitrages de conception
avant la première ligne, exactement le patron déjà suivi pour CASSANDRA-RH
(`docs/cassandra-rh-conception.md`) et la refonte graphique (`docs/referentiel/regles-des-graphismes.md`).)*

## 1. Origine et vocation

Née d'une remarque de l'utilisateur pendant l'audit d'évolutivité du 2026-09-21 : plutôt que de
seulement vérifier après coup que deux descriptions d'un même objet *concordent*, ne vaut-il pas
mieux garantir qu'elles *puisent à la même source* ? Sa vocation : faire respecter mécaniquement,
partout dans le dépôt, le principe de l'Article 24 (« Toute construction qui reflète l'état d'un
autre système doit soit le lire dynamiquement, soit être accompagnée d'un garde-fou mécanique qui
détecte un écart — jamais une copie à la main sans vérification »).

## 2. Deux vérifications distinctes sous un même toit (jamais fusionnées en un seul calcul)

- **Concordance des descriptions** — deux textes qui décrivent le même objet (un outil, un
  mécanisme) se contredisent-ils ? Analyse de PROSE, en partie un jugement (comme ARGUS/HARMONIA en
  mode raisonnement), jamais 100% mécanisable gratuitement. Exemple réel trouvé le 2026-09-21 : la
  fiche PRESTATIONS de CLONE-HUNTER ne mentionnait que sa v1, alors que la table maîtresse
  documentait déjà v1+v2 depuis la veille.
- **Couverture garde-fou (évolutivité, Article 24)** — une liste tenue à la main a-t-elle une
  fonction de vérification qui la croise avec sa source réelle ? Entièrement mécanisable et
  gratuit : lister les `export const X = [...]`/`{...}` du dépôt et chercher l'existence d'une
  fonction `findXDivergingFrom...`/`findXMissingFrom...` qui la croise avec une autre source.
  Exemples réels trouvés et corrigés le 2026-09-21 : `THEMES`/`SENSITIVE_NODES` (recopiaient
  HARMONIA sans vérification), `AGENT_SCRIPT_FILES` (6 Agents réels invisibles depuis leur
  construction), `LOCAL_JOURNALS` (2 journaux locaux jamais déclarés).

Ces deux vérifications partagent le même principe (une source unique, jamais une duplication non
surveillée) mais demandent des mécanismes différents — jamais un seul calcul qui les confondrait.

## 3. Statut visé : Gardien sacré du code ?

Discussion du 2026-09-21 : ce futur outil correspondrait au critère double déjà établi (Article 20,
`docs/referentiel/organisation-agence.md` §3) — délivre un vrai scan de qualité ET peut tourner
automatiquement, mécaniquement, gratuitement, à chaque commit. La partie « couverture garde-fou »
(§2 ci-dessus) remplit ce critère sans réserve. La partie « concordance des descriptions » est plus
proche d'ARGUS/HARMONIA : une couche mécanique légère (détection de mots-clés contradictoires,
comme `findRedundantRulePairs()` de CHARTER-SPY) à chaque commit, complétée par un vrai raisonnement
sur demande — jamais un blocage du critère (b) pour autant, exactement comme ARGUS/HARMONIA
combinent déjà les deux registres.

**Nom non tranché.** Rejoindrait potentiellement les 5 Gardiens actuels (ARGUS, HARMONIA, AXA-CHECK,
CLEAN-DIRTY-OLD, CLONE-HUNTER) comme 6e membre, sur le même mode d'entrée que CLONE-HUNTER
(construit d'abord, promotion actée après vérification du critère double).

## 4. Relation avec l'Article 24 (CLAUDE.md) — allègement prévu, jamais une suppression

Question explicite de l'utilisateur : une fois l'outil construit, peut-on « s'épargner la règle » ?
Réponse actée : non — un principe permanent (Article 0 hiérarchie) ne se remplace jamais par un
outil seul. Mais l'Article 24, actuellement détaillé (les 4 exemples trouvés le 2026-09-21, la liste
des 8 outils déjà protégés) suit le patron déjà appliqué à ARGUS/HARMONIA/Smart Conso API : rester
court, renvoyer le détail opérationnel vers `docs/referentiel/<nom-outil>.md`. **To do explicite**,
à faire une fois l'outil construit : raccourcir l'Article 24 en conséquence.

## 5. Comment améliorer/rendre plus performant cet outil (question ouverte, 2026-09-21)

Question posée par l'utilisateur, pas encore répondue en détail : comment le rendre plus performant
au-delà du MVP à deux scans décrit en §2 ? Pistes à explorer lors de la conception réelle (aucune
tranchée ici) :
- Étendre la détection de concordance au-delà des paires de fichiers déjà connues (badges/fiches
  PRESTATIONS/référentiel) vers une recherche plus large (conversation, commentaires de code).
- Un score de confiance par trouvaille (comme ALWAYS-NEW-CODE), jamais un verdict binaire.
- Réutiliser `estimateTokens()`/`measureClaudeMdWeight()` de CHARTER-SPY plutôt qu'un second calcul
  de poids.

## 6. Correction factuelle apportée le 2026-09-21 (CHARTER-SPY)

L'utilisateur a décrit CHARTER-SPY comme ayant « une fonction qui aide à formuler une idée avec un
minimum de mots ». Vérifié (Article 19) : CHARTER-SPY a bien `findRedundantRulePairs()` (repère les
rédactions redondantes) et `estimateTokens()`/`measureClaudeMdWeight()`/`scanDocumentWeight()`
(mesure le poids en tokens — le volet « smart conso plugged »). Il n'existe en revanche AUCUNE
fonction qui reformule activement un texte en un minimum de mots — cette étape reste toujours celle
de l'agent qui écrit, informé par ces deux mesures, jamais automatisée par CHARTER-SPY lui-même.
Piste notée en §5 ci-dessus si une vraie fonction de ce type devait un jour être construite (dans
CHARTER-SPY ou dans ce nouvel outil).

## 7. Questions encore ouvertes

- Nom de l'outil (jamais choisi).
- Un seul script à deux modes, ou deux scripts complémentaires (comme find-booster/find-deep-booster
  sous find-brain) ?
- Périmètre exact de la couche « concordance » : quels couples de fichiers surveiller en priorité ?
