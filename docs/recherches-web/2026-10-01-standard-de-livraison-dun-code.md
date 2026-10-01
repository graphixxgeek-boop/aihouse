# Quel est le standard de livraison d'un code ? — recherche web, et ce qui nous manque

> **Ta demande ⑥, mot pour mot** : *« quel est le standard de livraison d'un code, pour que
> l'Agence le respecte à la livraison finale »*. Tâche **#1346**.
> **Recherche faite le 2026-10-01**, et pas une réponse de mémoire : ce qu'un projet est censé
> livrer est un sujet **public et daté**, pas une opinion.
> **Ce document ne résume pas l'état de l'art** — il le **confronte à ce que nous avons**. Un
> résumé que tu pourrais lire ailleurs ne vaut pas le temps de le lire ici.

---

## IL N'Y A PAS UN STANDARD, IL Y EN A TROIS COUCHES — et elles ne se remplacent pas

**① LA COUCHE « PROJET OUVERT »** — l'**OpenSSF Best Practices Badge** (ex-CII), le référentiel le
plus explicite qui existe : **67 critères** au niveau *Passing*, 55 de plus en *Silver*, 23 en
*Gold*. Le *Passing* demande, en substance : dire ce que le projet fait, comment l'obtenir,
comment contribuer · **une licence explicite** · une doc d'installation et d'usage sécurisé · un
historique de versions public · les changements entre versions.

**② LA COUCHE « CHAÎNE D'APPROVISIONNEMENT »** — devenue **réglementaire en 2026**, ce qui change
sa nature : la CISA impose un **SBOM** (l'inventaire machine-lisible de tout ce que le logiciel
contient) au format **SPDX** ou **CycloneDX** pour tout logiciel fourni au gouvernement fédéral
américain, et le **Cyber Resilience Act européen**, désormais en vigueur, impose la même chose aux
éditeurs. **SLSA** y ajoute la *provenance* : une attestation de comment l'artefact a été
construit.

**③ LA COUCHE « REPRODUCTIBILITÉ »** — au niveau *Gold* de l'OpenSSF : une construction
reproductible, et **au moins 50 % des changements relus par quelqu'un d'autre que leur auteur**
avant publication.

---

## CE QUE ÇA DONNE CONFRONTÉ À NOUS

| Exigence du standard | Chez nous aujourd'hui |
|---|---|
| **une licence explicite** | 🔴 **AUCUNE** — `package.json` ne déclare pas de licence, et il n'y a pas de fichier `LICENSE` |
| dire ce que le projet fait, et comment l'installer | 🟠 `README.md` existe · `docs/agence-installation.md` existe pour l'Agence · **rien pour le Jeu** |
| historique des versions, changements entre versions | 🔴 **pas de CHANGELOG** · `package.json` est figé à `0.1.0` |
| une suite de tests qui passe | ✅ **385 tests**, verts, lancés avant chaque commit |
| documentation de chaque composant | ✅ **85 kits d'export complets** — très au-dessus du standard |
| relecture par un tiers avant publication (Gold) | 🔴 **structurellement impossible** : il n'y a qu'un humain et une IA |
| SBOM machine-lisible | 🔴 **absent** — et c'est le seul point à portée réglementaire |
| provenance de build (SLSA) | 🔴 absent |

### Les trois choses que ce tableau dit, et qu'on ne savait pas

**① Le manque le plus grave n'est pas technique, c'est la LICENCE.** Sans licence, personne ne
sait ce qu'il a le droit de faire de l'Agence — **ni un acheteur, ni une IA qui la reçoit**. C'est
le tout premier critère du standard le plus répandu, c'est gratuit à corriger, et **ça bloque la
vente plus sûrement que n'importe quel défaut de code**.

**② Nous sommes très au-dessus du standard sur la documentation, et en dessous sur le minimum
administratif.** 85 kits d'export complets, c'est plus que ce que l'OpenSSF demande à n'importe
quel niveau. Pas de licence ni de changelog, c'est moins que le niveau le plus bas. **Un profil
très inhabituel, et il faut le savoir avant de livrer quoi que ce soit.**

**③ Un critère Gold nous est structurellement fermé** : « 50 % des changements relus par quelqu'un
d'autre que l'auteur ». Il n'y a qu'un humain ici. **Ce n'est pas un défaut à corriger, c'est une
borne à déclarer** — exactement comme les exemptions de couverture de test.

---

## Plan d'action

| État | Constat | Ce qui en découle |
|---|---|---|
| **RETENU** | aucune licence déclarée — premier critère du standard, et ça bloque la vente | tâche à créer : **#1368** |
| **RETENU** | pas de CHANGELOG, version figée à 0.1.0 | même tâche **#1368** : les trois manques administratifs se traitent ensemble |
| **À TRANCHER** | le SBOM est devenu réglementaire en 2026 (CISA, Cyber Resilience Act) | **ta décision** : s'applique le jour où tu vends, pas avant — mais le savoir change le calendrier |
| **ÉCARTÉ** | viser le niveau Gold de l'OpenSSF | **raison écrite** : un de ses critères (relecture par un tiers) est structurellement fermé à un projet à un seul humain. Le viser serait viser un échec garanti. |

---

**Sources** :
[OpenSSF Best Practices Badge](https://openssf.org/projects/best-practices-badge/) ·
[le dépôt des critères](https://github.com/coreinfrastructure/best-practices-badge) ·
[FAQ du badge (ASWF)](https://tac.aswf.io/process/best_practices_badge.html) ·
[CISA SBOM minimum elements → CycloneDX et SPDX](https://runsafesecurity.com/blog/sbom-minimum-elements-cyclonedx-spdx/) ·
[SBOM, SLSA, SSDF](https://petronellatech.com/blog/the-supply-chain-security-trifecta-sbom-slsa-ssdf/) ·
[CycloneDX vs SPDX](https://safeguard.sh/resources/blog/cyclonedx-vs-spdx-sbom-format-comparison-2026)
