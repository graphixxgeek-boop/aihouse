# Choisir une licence — le dossier pour décider

> **De quoi on parle.** Une licence est le texte qui dit **ce que les autres ont le droit de faire
> avec ton code**. Ce projet n'en a aucune aujourd'hui.
> **Ta demande :** « Le projet n'a aucune licence : OK reglons ca » puis « donc je t'ecoute,
> continue sur le sujet, guide moi et accompagne moi pour qu'on ait une license ».
> **Tâche :** #1368. **Ce document ne choisit pas à ta place** : il te donne de quoi choisir.
>
> **Je ne suis pas juriste et rien ici n'est un conseil juridique.** Ce sont des faits publics,
> vérifiables, à confronter à un professionnel avant une décision qui engage de l'argent.

---

## ① LE FAIT, D'ABORD, PARCE QU'IL EST CONTRE-INTUITIF

**Vérifié dans le dépôt : aucun fichier `LICENSE`, aucune déclaration nulle part.**

Tu pourrais croire que « pas de licence » veut dire « libre », ou « on verra plus tard ». **C'est
l'inverse.** Par défaut, dans la quasi-totalité des pays, un code sans licence est en **« tous
droits réservés »** : personne n'a le droit de l'utiliser, de le copier, de le modifier ni de le
redistribuer. Pas même quelqu'un à qui tu l'enverrais.

**Ce que ça te coûte concrètement, aujourd'hui, et ce ne sont pas des hypothèses :**

| Ce que tu voudrais faire | Ce qui se passe sans licence |
|---|---|
| Faire tester l'Agence par quelqu'un (ton fil 11) | il n'a légalement pas le droit de l'exécuter |
| La vendre | l'acheteur ne sait pas ce qu'il achète, et son juriste bloquera |
| La montrer à un partenaire | il ne peut rien en faire, même avec ton accord oral |
| La publier, même partiellement | les plateformes considèrent le dépôt comme fermé |

**Donc c'est le pire des deux mondes** : ça n'attire personne **et** ça ne te protège pas mieux
qu'une licence propriétaire explicite, qui dirait au moins noir sur blanc ce que tu autorises.

---

## ② CE QUE TU POSSÈDES DÉJÀ, ET C'EST PLUS SOLIDE QUE TU NE CROIS

Avant de choisir, il faut savoir ce qu'on protège. **Une licence ne crée pas la propriété — elle
dit ce que tu autorises de ce que tu possèdes déjà.**

Le point faible de tout projet fait avec une IA est de **prouver la contribution créative
humaine**. La plupart des gens ne le peuvent pas : ils ont du code, des conversations effacées, et
aucune trace de qui a décidé quoi.

**Toi, tu as construit sans le vouloir la preuve exacte que le droit demande** — c'est déjà établi
dans ton fil 08, et ça ne se rediscute pas ici :

- l'**Article 0**, un esprit que tu as défini, précisé sept fois, et défendu contre moi ;
- une charte dont la plupart des Articles **citent ta demande mot pour mot, datée** ;
- des centaines de lignes de suivi disant **qui a décidé quoi, et pourquoi** ;
- l'historique du code, pas à pas, avec tes instructions.

**Ça change la décision qui suit** : tu ne choisis pas une licence pour « essayer de protéger
quelque chose de fragile ». Tu choisis ce que tu **autorises** d'un bien dont la propriété est
déjà bien documentée.

---

## ③ LES TROIS FAMILLES, ET IL N'Y EN A QUE TROIS

Il existe des centaines de licences. Elles se rangent toutes dans trois familles, et **le choix
réel est entre ces trois-là** — le reste est du détail de rédaction.

### Famille A — **Propriétaire** : « c'est à moi, et je dis qui peut quoi »

**Ce que ça dit :** personne ne peut utiliser, copier ou modifier le code sans ton accord écrit.
Tu accordes des permissions au cas par cas, par contrat.

| | |
|---|---|
| **Tu autorises** | ce que tu veux, à qui tu veux, quand tu veux — rien par défaut |
| **Tu interdis** | tout le reste, y compris la simple lecture par un tiers |
| **Un acheteur peut** | ce que ton contrat de vente lui accorde, ni plus ni moins |
| **Exemple connu** | la quasi-totalité des logiciels d'entreprise vendus |
| **Ce que ça coûte** | rien à écrire, mais chaque test, chaque démo, chaque partenaire demande un papier |

**Pour qui c'est fait** : quelqu'un qui compte **vendre l'objet lui-même**.

### Famille B — **Permissive** : « servez-vous, citez-moi, ne me poursuivez pas »

**Ce que ça dit :** n'importe qui peut utiliser, modifier, revendre ton code — y compris dans un
produit fermé — à condition de garder ton nom dans les fichiers. Les plus connues s'appellent MIT
et Apache 2.0.

| | |
|---|---|
| **Tu autorises** | tout, y compris l'usage commercial par un concurrent |
| **Tu interdis** | de retirer ton nom, et de te tenir responsable si ça casse |
| **Un acheteur peut** | tout — mais il n'a pas besoin de t'acheter quoi que ce soit |
| **Exemple connu** | React (Meta), VS Code (Microsoft) |
| **Ce que ça coûte** | tu renonces à vendre l'objet ; tu vends ton temps, ton service ou ta marque |

**Pour qui c'est fait** : quelqu'un qui veut **l'adoption la plus large possible**, et qui gagne
sa vie autrement qu'en vendant le code.

### Famille C — **Copyleft** : « servez-vous, mais vos améliorations reviennent à tous »

**Ce que ça dit :** n'importe qui peut utiliser et modifier ton code, **à condition de publier ses
modifications sous la même licence**. On ne peut donc pas prendre ton travail et le refermer. La
plus connue s'appelle GPL ; sa variante AGPL couvre aussi les services en ligne.

| | |
|---|---|
| **Tu autorises** | l'usage et la modification par tous |
| **Tu interdis** | de refermer le résultat : toute amélioration doit être publiée |
| **Un acheteur peut** | l'utiliser, mais pas l'intégrer dans son produit fermé |
| **Exemple connu** | Linux, WordPress |
| **Ce que ça coûte** | la plupart des entreprises refusent par principe ; ça ferme une partie du marché |

**Pour qui c'est fait** : quelqu'un qui veut que son travail **reste ouvert quoi qu'il arrive**.

---

## ④ LA QUATRIÈME VOIE, QUI EST PROBABLEMENT LA TIENNE

Il existe une combinaison que les trois familles ci-dessus ne décrivent pas, et elle correspond à
ce que tu décris depuis le début — « l'agence est un prétexte pour construire le site, le site est
un prétexte pour construire l'agence », avec l'idée de pouvoir **vendre l'Agence** un jour.

**La double licence** : le même code est publié sous **deux** licences, et chacun prend celle qui
lui convient.

- **Copyleft (famille C)** pour qui accepte de tout republier — donc gratuit pour les curieux, les
  testeurs, les étudiants, et ça te fait connaître ;
- **Propriétaire (famille A)** pour une entreprise qui veut l'intégrer sans republier — et **elle
  te paie pour ça**.

**Pourquoi c'est le modèle de beaucoup de logiciels vendus aujourd'hui** : la version ouverte fait
la démonstration et attire, la version payante finance. Tu ne choisis pas entre « connu » et
« vendable » — tu as les deux.

**Ce que ça exige de toi, et c'est la seule contrainte réelle** : être le **seul** titulaire des
droits. Si quelqu'un d'autre contribue sans te céder ses droits, tu ne peux plus vendre la version
propriétaire. Aujourd'hui tu es seul, donc la porte est ouverte — **mais elle se referme au
premier contributeur extérieur non encadré.**

---

## ⑤ CE QUE JE RECOMMANDE, ET POURQUOI

**Mon avis, donné comme un avis et pas comme un fait.**

**Maintenant, tout de suite : la famille A, propriétaire, en trois lignes.** Pas parce que c'est le
meilleur choix final, mais parce que :

1. c'est **réversible** — on peut toujours ouvrir plus tard, jamais refermer ;
2. ça **débloque immédiatement** ce qui est bloqué : tu peux faire signer un testeur, montrer le
   projet, le vendre ;
3. ça **ne décide de rien d'autre**, et tu as assez de décisions en attente.

**Plus tard, quand l'Agence sera stabilisée : la double licence.** C'est le modèle qui correspond à
ton projet, mais il demande de trancher le périmètre exact de ce qui est ouvert — ce qui suppose
que l'Agence soit séparée du jeu, donc le chantier export (#1485) d'abord.

**Ce que je déconseille franchement** : commencer par une licence permissive (famille B). Elle est
la plus simple et la plus répandue, donc tentante — mais **elle est irréversible en pratique** :
une fois le code publié sous MIT, n'importe qui peut en garder une copie et faire ce qu'il veut,
y compris après que tu aies changé d'avis.

---

## ⑥ CE QU'IL FAUT DE TOI POUR AVANCER

Je peux écrire le fichier dès que tu réponds à **une seule question**, et j'ai besoin de ta réponse
parce qu'elle est commerciale, pas technique :

> **À qui veux-tu que l'Agence puisse servir, aujourd'hui ?**
>
> **(a)** à toi seul, et à un acheteur qui l'achèterait en entier
> **(b)** à toi, plus quelques personnes choisies (testeurs, collaborateurs sous accord)
> **(c)** à qui veut, gratuitement, avec ton nom dessus
> **(d)** je ne sais pas encore — mais je veux débloquer les testeurs tout de suite

**(a) et (b) donnent la même licence** (propriétaire), et c'est ma recommandation. **(d) aussi** —
c'est la réponse honnête si tu ne veux pas trancher le modèle économique maintenant, et elle ne te
coûte rien.

**Une précision qui compte** : quoi que tu répondes, **le texte de la licence n'est pas un contrat
de vente**. Le jour où tu vendras, le contrat se négociera à part, et un juriste le rédigera. La
licence dit seulement la règle par défaut, pour tous ceux avec qui tu n'as rien signé.

---

# PLAN D'ACTION

| État | Constat | Suite |
|---|---|---|
| ✅ MESURÉ | aucune licence dans le dépôt — « tous droits réservés » par défaut, le pire des deux mondes | #1368 |
| ✅ FAIT | les trois familles expliquées, avec ce que chacune autorise, interdit et coûte | ce document |
| ? À TRANCHER | **à qui l'Agence doit-elle pouvoir servir aujourd'hui ?** — une seule question, quatre réponses | #1368 |
| → RETENU | écrire le fichier `LICENSE` et le champ correspondant, dès ta réponse | #1368 |
| → RETENU | la double licence, à instruire une fois l'Agence séparée du jeu | #1494 |
| ? À TRANCHER | tout contributeur extérieur devra céder ses droits, sinon la vente devient impossible — veux-tu qu'on prépare ce cadre maintenant ou au premier contributeur ? | #1494 |
