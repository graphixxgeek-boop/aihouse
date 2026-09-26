# LE-CLASSIFICATEUR — instanciation sur ce projet

*(Créé le 2026-09-26, par scission de CASSANDRA-RH. **Nom provisoire**, validé comme tel par
l'utilisateur : descriptif, jamais un nom propre — à remplacer avec la fournée de renommage des
rangs, tâche #200. Blueprint générique réutilisable : `docs/le-classificateur-blueprint.md`.)*

## Pourquoi il existe, et ce n'est pas une question de taille

CASSANDRA-RH portait deux métiers qui ne posent pas la même question. **« Qui va bien dans
l'équipe ? »** — effectif, badges, stagnation, KPI, convocations. Et **« qu'est-ce que c'est ? »** —
types, rangs, familles, classes, indice. Le premier juge des gens, le second range des choses.

Le fichier avait atteint 4 300 lignes, le plus gros du dépôt. Mais la taille n'est pas le motif : le
motif est que ces deux questions n'ont ni le même rythme, ni le même public, ni la même autorité.
L'utilisateur a préféré scinder plutôt que construire un 80e outil — décision du 2026-09-26, après
avoir pesé la création de LE-GRAND-ARCHITECTE, qui n'existait que sur le papier.

## La règle de dépendance, non négociable

**`le-classificateur.mjs` n'importe JAMAIS `cassandra-rh.mjs`.** Le sens est unique : CASSANDRA lit
le classement, le classement ne lit jamais les ressources humaines. Sans cette règle, les deux se
rappelleraient l'un l'autre et la scission n'aurait rien séparé — elle aurait seulement réparti le
même bloc sur deux fichiers.

## Ce qu'il porte

- **L'axe TYPE** — ce qu'un fichier EST, constaté en le lisant (`typeDeScript`, `portesDEntree`,
  `recenserLesScripts`).
- **L'axe RANG** — ce qu'un fichier VAUT (`ORG_RANKS`, `RANG_PAR_TYPE`, `rangDuFichier`), avec
  l'échelle de promotion : chaque rang déclare sa marche suivante et ce qu'il faut pour la franchir.
- **Le croisement des deux** (`croiserTypeEtRang`) — et sa règle : *le rang MÉRITÉ l'emporte
  toujours, le type ne remplit que les cases que personne n'a remplies.*
- **L'indice de classification à facettes** (`indiceDeClassification`, `decoderIndice`).
- **Le poste de travail qui se DÉRIVE** (`OBLIGATIONS_DERIVEES`, `posteDeTravail`) — le rang donne
  la base, ce que l'outil fait ajoute le reste, et ce qu'il fait se mesure plutôt que se déclarer.
- **Le document officiel** (`documentDeClassification`), en texte et en HTML depuis les mêmes blocs.

## Ce qu'il ne porte pas, et pourquoi

- **L'organigramme** (`buildOrganigramme`) reste chez CASSANDRA : il met en scène des PERSONNES à
  des postes, c'est de l'organisation, pas du rangement.
- **La carte des axes en page HTML** (`blocsDeLaCarteDesAxes`) reste chez elle aussi : c'est un
  rapport de CASSANDRA, qui consomme le classement sans en faire partie.
- **La comparaison des familles avec doc-report** reste chez elle : elle vérifie la cohérence de
  deux REGISTRES, ce qui est un contrôle de tenue, pas une classification.

## Comment on s'en sert

```
node scripts/le-classificateur.mjs classification      # régénère le document officiel
node scripts/le-classificateur.mjs                     # équivalent, la commande par défaut
```

Il écrit deux fichiers depuis **les mêmes blocs**, jamais deux rendus écrits à la main :
`docs/referentiel/classification-agence.md` (la référence enregistrée) et
`docs/le-classificateur/classification-agence.html` (la version de remise).

## Sa limite honnête

Il range ce qu'il peut MESURER. Un fichier dont la finalité n'est écrite nulle part restera dans un
état de passage, et c'est voulu : la leçon L24 dit que la finalité ne se déduit jamais du code. Le
rang « Hors Agence » est, pour la même raison, une liste tenue à la main avec sa raison écrite —
« lance le produit » ne se lit dans aucune sonde.
