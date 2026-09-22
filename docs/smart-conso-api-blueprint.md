# SMART CONSO API — régulation de la consommation — blueprint exportable

*(Patron dégagé après un épisode réel d'épuisement total du quota d'une API tierce en cours de
session. Ce document décrit le PATRON générique, réutilisable sur tout projet appelant une API
tierce à quota limité. La genèse exacte — les mots de la personne qui l'a demandé, et le contexte
outillage propre au projet d'origine — vit dans l'instanciation
`docs/referentiel/smart-conso-api.md`, jamais ici : un blueprint qui cite le projet d'origine n'est
pas exportable, et c'est précisément ce que SAFE-EXPORT vérifie.)*

## Le problème que ce patron résout, et sa place dans la famille des trois outils de vigilance

Un outil de contournement de blocage (cf. `docs/outil-resilience-api.md`, "Smart Breaker" dans ce
projet) réagit APRÈS qu'un blocage a commencé — il route intelligemment autour, mais ne l'a pas
évité. Arriver à ce blocage plus vite que nécessaire, ou plus souvent que nécessaire, reste un
échec, même si le contournement fonctionne bien une fois qu'on y est. Smart Conso API intervient
EN AMONT : elle régule le RYTHME de consommation pour repousser ou éviter le moment du blocage,
au lieu de simplement mieux le gérer une fois arrivé. Les trois outils de vigilance de ce projet
se complètent sans se recouvrir : ARGUS (les absences), HARMONIA (les frictions dans ce qui
existe), Smart Conso API (le rythme de consommation d'une ressource limitée dans le temps).

## Principe central : un vrai canal de consultation, jamais un journal après coup

Ce qui distingue ce patron d'un simple tableau de bord de consommation : l'agent qui pilote le
projet CONSULTE SYSTÉMATIQUEMENT l'outil avant toute action qui va déclencher de vrais appels à
l'API régulée, et lit son avis avant de décider — jamais un chiffre qu'on regarde après coup pour
comprendre ce qui s'est passé. Un outil de régulation qu'on oublie de consulter au moment
critique manque exactement le moment où il aurait eu de la valeur.

## Deux seuils, jamais confondus

- **Seuil souple (négociable)** — un avertissement qui explique pourquoi la prudence est
  recommandée, mais qui n'empêche jamais l'action si un bon argument la justifie (par exemple : une
  simulation interrompue par un blocage réel doit pouvoir être reprise, même si le compteur de
  simulations du jour est déjà haut).
- **Seuil dur (non négociable)** — une limite qui bloque l'action tant qu'elle n'est pas
  explicitement levée par la personne qui pilote le projet. Un seuil ne devient dur qu'après avoir
  fait ses preuves comme seuil souple (cf. "Apprentissage progressif" ci-dessous) — jamais dur dès
  le premier jour sur la seule intuition de son concepteur.

## Apprentissage progressif, jamais un durcissement silencieux

1. **Phase d'observation** — l'outil mesure, propose des seuils souples, et surtout garde une
   trace de si ses conseils ont été suivis et si ça a évité un blocage réel ou non. Sans cette
   auto-évaluation, l'outil ne peut jamais légitimement prétendre avoir raison plus souvent qu'au
   hasard.
2. **Proposition de durcissement** — une fois assez d'épisodes accumulés pour que le taux de
   réussite de ses conseils soit statistiquement significatif (jamais sur un seul épisode), l'outil
   peut PROPOSER qu'un seuil souple devienne dur, avec ses chiffres à l'appui.
3. **Validation humaine explicite** — la personne qui pilote le projet valide (ou non) chaque
   passage à un seuil dur, un par un ; jamais un durcissement automatique qui échapperait à son
   contrôle, même une fois l'outil statistiquement fiable.
4. **Interrupteur toujours disponible** — la personne qui pilote le projet peut toujours passer
   outre un seuil dur explicitement, au cas par cas ; ce n'est jamais un mur totalement infranchissable,
   seulement un mur qu'on ne franchit jamais par inadvertance.

## Frontière avec l'architecture qu'elle ne doit jamais toucher

Un outil de régulation de la consommation ne doit jamais suggérer, même implicitement, de modifier
un choix d'architecture pris pour des raisons de qualité (dans ce projet : la séparation "un
cerveau par personnage", protégée par l'Article 0 de la charte). Son terrain est le RYTHME
d'utilisation d'un système déjà conçu, jamais sa conception elle-même — cette frontière doit être
écrite noir sur blanc dans l'instanciation propre à chaque projet, jamais laissée implicite.

## Capacité de scan (2026-09-20) — repérer des schémas dans l'historique déjà accumulé

Au-delà de l'avis avant action, ce patron peut aussi relire son propre historique déjà enregistré
pour y repérer des SCHÉMAS RÉELS de consommation (un taux d'épuisement élevé récent, un relancement
trop rapproché après un blocage confirmé) et proposer une piste concrète pour chacun — jamais un
jugement sur le code de l'application régulée, toujours sur la façon dont elle a été SOLLICITÉE.
Cette capacité reste dans la même frontière que le reste du patron (cf. ci-dessous) : elle informe,
elle ne modifie jamais rien elle-même.

## Une seule source de vérité pour l'historique brut

Cf. le principe déjà appliqué dans ce projet (bonusLog/bonusPsychLog, Article 3) : l'historique
BRUT des appels réels à l'API régulée doit être une SEULE source, partagée avec l'outil de
contournement de blocage s'il en existe un — jamais un second journal séparé qui finirait par
diverger. Smart Conso API peut en revanche tenir SON PROPRE registre de conseils donnés et de
décisions prises (une nature d'information différente : pas "qu'est-ce qui s'est passé côté API",
mais "qu'est-ce que l'outil a conseillé et qu'en a-t-on fait").

## Registre et carnet de session

Deux échelles de temps distinctes, deux fichiers distincts :
- **Le registre archivé** (dossier + index, même schéma qu'ARGUS/HARMONIA/le tableau de bord) —
  les décisions durables : passages de seuils souples à durs, évolutions du calcul de l'outil.
- **Un carnet de session** (état local, non versionné, comme l'historique de santé des clés) — le
  compteur d'actions coûteuses en cours (ex. combien de lancements d'une action donnée dans une
  fenêtre récente), consulté et mis à jour à chaque sollicitation de l'outil.

## Ce que ce patron n'est pas

- Un mécanisme qui modifie l'architecture de production pour économiser des appels — cf. la
  frontière ci-dessus.
- Une garantie contre tout blocage : un pic de consommation légitime et nécessaire (une vraie
  simulation complète demandée explicitement) reste possible même après un avertissement — l'outil
  conseille, il n'empêche jamais une décision assumée en connaissance de cause, sauf sur un seuil
  dur explicitement validé.
- Un remplacement de l'outil de contournement de blocage : les deux sont un binôme, jamais
  redondants (l'un régule le rythme, l'autre contourne le blocage qui survient malgré tout).
