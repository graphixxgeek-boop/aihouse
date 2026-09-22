// GABARIT UNIFIÉ DES RAPPORTS (2026-09-22, tâche #199, demande explicite de l'utilisateur :
// « doc-report nouvelle fonction : s'assurer que tous les reports ont le meme format, gabarit : ce
// format est graphique (txt ou html, mise en page, couleurs, etc.) mais aussi au niveau du contenu :
// message d'en tete, titres, facon de presnter, organisation, structure... Il y a une place dans
// chaque report pour pouvoir importer une phrase generique, comme le probleme qu'on a eu a devoir
// inserer la phrase "resultats non garantis" »).
//
// L'ASYMÉTRIE RÉELLE QUI L'A MOTIVÉ, mesurée avant d'écrire une ligne (Article 19) : les rapports
// HTML partageaient DÉJÀ un contrat unique depuis html-report.mjs (`title` / `subtitle` /
// `dateLabel` / `blocks` / `footer`), et c'est pour ça qu'ils se ressemblent tous. Les rapports
// TEXTE, eux, n'avaient aucun contrat : chaque outil improvisait son en-tête, son titre, sa façon
// de dater, son ordre. D'où l'épisode de la phrase de fiabilité, qu'il a fallu insérer à la main
// dans 28 fichiers faute d'un endroit prévu pour ça.
//
// CE FICHIER EST LA DÉFINITION UNIQUE. Une seule description de ce qu'EST un rapport ; deux rendus
// (texte et HTML) qui la consomment, jamais deux définitions parallèles qui divergeraient au premier
// changement. html-report.mjs garde le rendu HTML (mise en page, couleurs, zoom) et passe désormais
// par le même cadre — jamais un second gabarit concurrent (règle anti-doublon, §7ter).
//
// L'EMPLACEMENT GÉNÉRIQUE (`slots`) est le cœur de la demande : une place réservée, en tête, que
// n'importe quelle phrase transverse future peut occuper sans repasser sur trente scripts. Son
// premier locataire est l'avertissement de fiabilité (TOOL_RELIABILITY, tâche #198) ; une mention
// légale, un rappel de contexte ou un statut de chantier s'y ajouteraient de la même façon.

import { reliabilityNotice } from "./lib-shell.mjs";

// Ce que TOUT rapport porte, dans cet ordre — la partie « contenu » du gabarit, celle qui vaut
// autant pour un .txt que pour un .html. Exportée pour être vérifiable mécaniquement plutôt que
// simplement promise en commentaire (Article 24).
export const REPORT_CONTRACT = [
  { cle: "title", obligatoire: true, role: "de quoi parle ce rapport — jamais un rapport sans titre" },
  { cle: "subtitle", obligatoire: false, role: "la portée exacte et le renvoi au référentiel de l'outil" },
  { cle: "dateLabel", obligatoire: true, role: "quand il a été produit — un rapport sans date ne se compare à rien" },
  { cle: "slots", obligatoire: false, role: "l'emplacement générique d'en-tête : phrases transverses venues d'un registre partagé, jamais écrites à la main dans l'outil" },
  { cle: "blocks", obligatoire: true, role: "le corps : les constats réels de l'outil, et eux seuls" },
  { cle: "footer", obligatoire: false, role: "la limite de l'outil — ce qu'il ne prétend pas faire" },
];

// Les phrases transverses disponibles pour l'emplacement générique. Une seule aujourd'hui ; le point
// de la demande est qu'une seconde s'ajoute ICI et atteigne tous les rapports d'un coup.
export function genericSlots(tool) {
  if (!tool) return [];
  return [reliabilityNotice(tool)].filter(Boolean);
}

// Normalise ce qu'un outil fournit en un cadre complet, avec l'emplacement générique déjà rempli.
// C'est le seul point de passage : les deux rendus consomment SON résultat, jamais les arguments
// bruts de l'appelant — sans quoi l'un pourrait oublier une partie du gabarit que l'autre applique.
export function buildReportFrame({ tool, title, subtitle, dateLabel, blocks = [], footer } = {}) {
  if (!title) throw new Error("buildReportFrame() exige un titre — jamais un rapport sans titre (REPORT_CONTRACT)");
  return {
    tool,
    title,
    subtitle,
    dateLabel: dateLabel ?? new Date().toISOString(),
    slots: genericSlots(tool),
    blocks,
    footer,
  };
}

// Rendu TEXTE — le pendant exact de renderHtmlReport(), même cadre, même ordre, même emplacement
// générique. Volontairement sobre : un rapport texte se lit dans un terminal et se relit par un
// autre outil, jamais une décoration qui gênerait l'un ou l'autre.
export function renderTextReport(frame) {
  // Reconnu à `slots`, jamais au titre : un objet brut d'appelant a lui aussi un titre, si bien
  // qu'un test sur le titre prenait l'entrée brute pour un cadre déjà construit et sautait
  // silencieusement tout le gabarit (trouvé au premier essai réel de cette fonction). `slots` est la
  // seule chose que buildReportFrame() est seul à poser — c'est donc la seule preuve qu'il est passé.
  const f = Array.isArray(frame?.slots) ? frame : buildReportFrame(frame);
  const out = [];
  for (const phrase of f.slots) out.push(phrase, "");
  out.push(`=== ${f.title} ===`);
  if (f.subtitle) out.push(f.subtitle);
  out.push(`Date : ${f.dateLabel}`, "");
  for (const block of f.blocks) out.push(renderTextBlock(block), "");
  if (f.footer) out.push("---", f.footer);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

// Mêmes types de blocs que le rendu HTML (`renderBlock`, html-report.mjs) — jamais un second
// vocabulaire de blocs pour le texte, sinon un outil devrait écrire son corps deux fois.
export function renderTextBlock(block) {
  if (!block) return "";
  if (typeof block === "string") return block;
  switch (block.type) {
    case "note": return block.text ?? "";
    case "code": return block.text ?? "";
    case "list": return (block.items ?? []).map((i) => `  · ${i}`).join("\n");
    case "table": {
      const entetes = block.headers ?? [];
      const lignes = block.rows ?? [];
      const largeurs = entetes.map((h, i) => Math.max(String(h).length, ...lignes.map((r) => String(r[i] ?? "").length)));
      const ligne = (cells) => "  " + cells.map((c, i) => String(c ?? "").padEnd(largeurs[i])).join("  ");
      return [ligne(entetes), "  " + largeurs.map((w) => "-".repeat(w)).join("  "), ...lignes.map(ligne)].join("\n");
    }
    default: return block.text ?? "";
  }
}
