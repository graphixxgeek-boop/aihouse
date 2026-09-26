#!/usr/bin/env node
// LA BANNIÈRE POST-COMMIT, HIÉRARCHISÉE — 362 lignes que personne ne lit
// =====================================================================================
// POURQUOI ELLE EXISTE (2026-09-26, tâche #798, mesure de la tâche #797).
//
// LE PROBLÈME EST DOUBLE ET LES DEUX MOITIÉS SE RENFORCENT : la bannière du crochet post-commit
// coûte ~11 600 tokens à CHAQUE commit, ET elle est trop longue pour être lue — donc elle est
// payée sans être utile. Elle a été ignorée sept fois de suite.
//
// CE N'EST PAS « JE DOIS MIEUX LIRE » : 362 lignes ne se lisent pas à chaque commit, personne ne
// le ferait. C'est un problème de PRÉSENTATION, jamais de contenu — l'Article 15 appliqué à un
// lecteur qui se trouve être l'agent lui-même.
//
// LE CHIFFRE QUI A TRANCHÉ : sur 362 lignes, TROIS portaient un 🚨 au dernier passage. 99 % de la
// bannière est du contexte, et c'est ce contexte qui noie l'alerte.
//
// CE QU'ON NE FAIT SURTOUT PAS : supprimer. Chaque bloc a été ajouté parce qu'un défaut réel était
// passé inaperçu. Rien n'est perdu — tout part dans un journal local relu à la demande, et la
// dernière ligne dit toujours où il est.
//
// POURQUOI UN ENROBAGE PLUTÔT QU'UNE RETOUCHE DES CINQ OUTILS : un outil ne sait pas dans quel
// contexte il est lu. Le même rapport doit rester complet quand on le lance à la main, et court
// quand il passe au commit. Le filtre appartient donc au LECTEUR, jamais à l'émetteur — et un
// sixième outil qui rejoint le crochet demain en hérite sans qu'on y pense (Article 24).
//
// GÉNÉRIQUE PAR CONSTRUCTION : rien ici ne connaît ce projet. On lui donne une commande, il la
// lance, il montre ce qui exige une action et range le reste.

import { spawnSync } from "node:child_process";
import { appendFileSync, writeFileSync } from "node:fs";

// CE QUI EXIGE UNE ACTION, et c'est SON critère : les deux pastilles que le projet réserve déjà à
// « il faut faire quelque chose ». Le reste — ✅, ⚪, les tableaux, les explications — est du
// contexte, précieux et non urgent.
// ⚠️ EN FAIT PARTIE, ET C'EST UN CONTRE-TEST QUI L'A IMPOSÉ. La première version ne gardait que
// 🚨 et 🔴. Lancée pour de vrai sur les cinq outils du crochet, elle rendait ZÉRO ligne pour MOÏSE
// — qui portait pourtant une alerte parfaitement réelle : « ⚠️ Art.13 : 11 → 12 obligation(s) —
// GROSSI ». **Un filtre qui cache une vraie alerte est pire que le bruit qu'il supprime**, parce que
// son erreur ne s'affiche nulle part (leçon L4, prise à l'envers).
export const MARQUEURS_D_ACTION = ["🚨", "🔴", "⚠️"];

// MAIS ⚠️ SERT AUSSI À DEUX LIGNES DE FORMULAIRE que CHAQUE outil imprime, et les laisser passer
// rendrait deux lignes de bruit par outil — soit précisément ce qu'on retire. Elles sont écartées
// par leur TEXTE, qui est fixe et connu, jamais par une heuristique sur la forme : une exclusion
// qui devine se trompera un jour sur une vraie alerte.
export const LIGNES_DE_FORMULAIRE = [
  "Attention, mes résultats peuvent être inexacts",   // l'avertissement de fiabilité, en tête de tout rapport
  "État du code :",                                    // l'en-tête de session partagé
];

// Une ligne d'action isolée ne dit pas QUI parle. On garde donc aussi le titre de section qui la
// précède, sinon « 3 écarts » n'apprend rien sur l'outil qui les a trouvés.
export const MOTIF_TITRE = /^\s*(?:===|##|——)/;

export const JOURNAL = ".banniere-post-commit.txt";

export function hierarchiser(sortie = "", { marqueurs = MARQUEURS_D_ACTION, motifTitre = MOTIF_TITRE } = {}) {
  const lignes = String(sortie).split("\n");
  const retenues = [];
  let dernierTitre = null, titreDejaSorti = null;
  for (const ligne of lignes) {
    if (motifTitre.test(ligne)) { dernierTitre = ligne.trim(); continue; }
    if (!marqueurs.some((m) => ligne.includes(m))) continue;
    if (LIGNES_DE_FORMULAIRE.some((f) => ligne.includes(f))) continue;
    // Le titre n'est imprimé qu'UNE fois, et seulement s'il précède une vraie alerte : le sortir
    // systématiquement reconstituerait la table des matières qu'on cherche justement à retirer.
    if (dernierTitre && dernierTitre !== titreDejaSorti) { retenues.push(dernierTitre); titreDejaSorti = dernierTitre; }
    retenues.push(ligne.trimEnd());
  }
  return { retenues, total: lignes.length, gardees: retenues.length };
}

export function formatBanniereLines(r, { journal = JOURNAL } = {}) {
  if (!r.gardees) return [];   // rien à signaler ⇒ rien du tout : une bannière qui parle pour ne rien dire cesse d'être lue
  return [
    ...r.retenues,
    `   ↳ ${r.total} ligne(s) au total, ${r.gardees} retenue(s) ici. Le reste est du contexte, dans ${journal} — relu à la demande, jamais perdu.`,
  ];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , ...commande] = process.argv;
  if (!commande.length) { console.error("usage : node scripts/hooks/banniere.mjs <commande...>"); process.exit(2); }
  const res = spawnSync(commande[0], commande.slice(1), { encoding: "utf8" });
  const brut = `${res.stdout ?? ""}${res.stderr ?? ""}`;
  // Le journal est ÉCRASÉ au premier outil du crochet et complété par les suivants : on veut la
  // bannière du DERNIER commit, pas l'accumulation de tous — c'est un journal local, jamais une
  // archive (et c'est ce qui l'empêche de rejoindre les 263 rapports que personne ne relit).
  const entete = `\n${"=".repeat(78)}\n${commande.join(" ")}\n${"=".repeat(78)}\n`;
  try {
    if (process.env.BANNIERE_PREMIER === "1") writeFileSync(JOURNAL, entete + brut);
    else appendFileSync(JOURNAL, entete + brut);
  } catch { /* best-effort : ne jamais faire échouer un crochet pour un journal */ }
  for (const l of formatBanniereLines(hierarchiser(brut))) console.log(l);
}
