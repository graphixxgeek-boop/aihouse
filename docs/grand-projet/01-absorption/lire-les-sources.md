# Lire les sources — Word, texte, et pourquoi il n'y a PAS d'outil pour ça

*(Vérifié pour de vrai le 2026-09-28, AVANT l'arrivée des documents, plutôt que découvert au moment
d'en avoir besoin.)*

## Ce qui arrive, et sous quelle forme

| Source | Format | Où |
|---|---|---|
| **MA COMMANDE** + **QUESTIONS** — ses deux fichiers | **Word (.docx)** | `00-sources/01-sa-demande/` |
| Les audits menés par ChatGPT | **texte (.txt)** | `00-sources/02-documents-prepares/` |
| La littérature d'inspiration | variable | `00-sources/02-documents-prepares/` |

## Le Word se lit, et c'est éprouvé

`python-docx` est installé et la chaîne a été testée par aller-retour : **titres, styles, accents et
tableaux passent tous**. Rien n'est supposé.

```python
from docx import Document
d = Document("docs/grand-projet/00-sources/01-sa-demande/MA-COMMANDE.docx")
for p in d.paragraphs:
    if p.text.strip():
        print(f"[{p.style.name}] {p.text}")
for t in d.tables:
    for row in t.rows:
        print("| " + " | ".join(c.text for c in row.cells) + " |")
```

**Les STYLES sont conservés, et ça compte** : un « Heading 1 » dit qu'une phrase est un titre, donc
une intention structurante. Le lire comme du texte plat perdrait l'information que sa mise en page
portait — et c'est précisément pour ça qu'il avait choisi Word.

**Repli si un fichier résiste** : `libreoffice --headless --convert-to txt <fichier>` est disponible
dans ce conteneur. Moins fidèle (tableaux aplatis), mais il passe là où la lecture directe échoue.

## Pourquoi PAS un outil de l'Agence pour ça, et la raison est chiffrée

**Un outil qui rejoint l'Agence coûte 10 registres à renseigner** — JESUS l'a mesuré le jour même.
Ce coût se justifie pour un outil qui LIT le dépôt et rend un jugement qu'on ne connaissait pas
d'avance (Article 31, faille 2). Un convertisseur de format ne juge rien : il transforme.

**Le payer 10 registres serait exactement la dette de process que JESUS existe pour traquer.** La
procédure est donc écrite ici, atteignable et rejouable, plutôt que transformée en membre de
l'équipe. Si l'absorption montre que la conversion demande un vrai jugement — décider ce qu'on perd
en aplatissant — la décision se reposera avec cette mesure-là en main.
