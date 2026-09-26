# api-providers — plan générique : le registre des fournisseurs sondables

*(Blueprint réutilisable. Instanciation : `docs/referentiel/api-providers.md`.)*

## Ce qu'il est : un registre de DIAGNOSTIC, jamais un commutateur de production

Un outil qui sonde la santé d'une clé d'API finit toujours par recevoir la demande « fais en sorte
qu'il s'adapte à une autre clé, identique ou totalement différente, d'un autre fournisseur ». La
réponse est un registre : un fournisseur s'ajoute là et nulle part ailleurs.

**La frontière à écrire noir sur blanc, et elle est la raison d'être de ce document** : ajouter un
fournisseur ici ne branche RIEN dans le produit. Savoir SONDER un fournisseur et savoir S'EN SERVIR
sont deux capacités différentes, et la seconde ne découle jamais automatiquement de la première.

Sans cette phrase écrite, la confusion est presque inévitable : le registre contient des noms de
fournisseurs, le produit appelle un fournisseur, l'inférence se fait toute seule — et un jour
quelqu'un bascule la production sur un fournisseur que personne n'a jamais validé.

## Pourquoi la bascule ne peut PAS être automatique

Un fournisseur alternatif rend des réponses différentes, avec un schéma de sortie différent et
aucune garantie sur la qualité de ce qu'il produit. Dans un projet dont la valeur centrale est une
qualité de sortie, c'est un chantier entier soumis à la même validation qu'un changement de
modèle — jamais une conséquence d'avoir appris à le sonder.

## Ce que chaque entrée doit porter

L'adresse à interroger, la façon de présenter la clé, la façon de lire la réponse, et **ce que
l'outil peut en conclure**. Ce dernier point est celui qu'on oublie : deux fournisseurs signalent
un dépassement de quota de deux manières différentes, et un code d'erreur mal interprété produit un
diagnostic faux qui ressemble à un diagnostic juste.

## Sa limite honnête

Il dit si une clé répond, jamais si elle répond BIEN. La qualité de la sortie est un jugement
humain, et aucun sondage ne la remplace.
