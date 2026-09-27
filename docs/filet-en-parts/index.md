# filet-en-parts — registre des passages

*(Une ligne par lancement en parts. À remplir à la main : le runner rend un résultat, il ne tient
pas son registre tout seul — et le déclarer vaut mieux que de laisser croire le contraire.)*

| Date | Parts | Durée | Séquentiel comparé | Parts en échec | Ce que le passage a appris |
|---|---|---|---|---|---|
| 2026-09-27 | 4 | 44 s | ✅ 78 s, 299 succès des DEUX côtés | 0 | **Premier passage réel, et il a trouvé six défauts — dont quatre à moi.** (1) Mon découpage prenait la première accolade fermante pour la fin d'un bloc : le filet en contient un imbriqué en colonne 0, d'où une erreur de syntaxe au premier essai (leçon L39 vérifiée sur son auteur). (2) Je croyais que les blocs dépendaient de l'épine ; c'est AUSSI l'inverse — d'où la règle du socle. (3) J'écrivais les copies dans `scripts/`, que SAFE-EXPORT balaie : le runner faisait échouer le test qu'il lançait. (4) **Le plus grave, et il était silencieux** : la redirection du dossier de travail ne portait que sur le préambule, donc une part relisait les modules du jeu transpilés d'un lancement PRÉCÉDENT (leçon L41). (5) Mon recollage dédoublonnait sur 40 caractères, et deux succès distincts les partagent — 298 annoncés au lieu de 299. (6) Le test du recul adaptatif des clés API mesurait un temps RESTANT, donc la vitesse de la machine (leçon L40) : révélé par la charge, pas créé par elle. |
