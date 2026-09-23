// html-report.mjs — gabarit HTML réutilisable pour la remise de rapports (2026-09-20, demande
// explicite de l'utilisateur après la « photo de la dream team » : « tu vas transformer tous les
// rapports en fichiers HTML avec une mise en page améliorée [...] petit bond en avant du projet
// pour la partie remise de rapport au dev »). Calibré explicitement avec l'utilisateur (3 questions
// de calibrage, Article 16) :
//   - Portée : TOUS les rapports livrés en pièce jointe (KPI, EL-PROFESSOR, THE-SCREENER,
//     simulations, THE-FINAL-JUDGE, CIRCLE-TASKS...), pas seulement les documents « fun ».
//   - Le fichier gardé DANS le projet (docs/..., relu par les scripts) reste la version de travail
//     en texte/markdown — ce gabarit ne produit JAMAIS le fichier de référence, seulement une copie
//     de présentation générée au moment de la remise. Zéro risque pour les outils existants qui
//     parsent aujourd'hui du texte brut (mostRecentDate(), parseCoverage(), etc.).
//   - Point de départ choisi : construire ce modèle réutilisable D'ABORD, avant de l'appliquer à un
//     rapport précis.
//
// Volontairement mince (même philosophie que LE-COORDINATEUR/CIRCLE-TASKS, §7ter de
// docs/regles-de-travail.md) : ce module ne connaît RIEN du contenu métier d'un rapport précis — il
// prend une structure générique (titre, sous-titre, blocs de texte/tableaux/listes) et rend une
// page HTML autonome, cohérente visuellement avec la première page produite dans ce style (la photo
// de la dream team). Aucune dépendance externe, aucun réseau, un seul fichier auto-suffisant.

import { buildReportFrame } from "./report-template.mjs";

export function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Un bloc de contenu générique — jamais spécifique à un rapport précis (règle anti-doublon,
// §7ter) : { type: 'heading', text } | { type: 'paragraph', text } | { type: 'note', text }
// (encadré discret, pour une mise en garde ou une limite honnête) | { type: 'list', items } |
// { type: 'table', headers, rows } | { type: 'code', text } (citation de code, chasse fixe) |
// { type: 'image', src, caption } (`src` : chemin relatif ou data URI, jamais téléchargé par ce
// module lui-même) | { type: 'dialogue', speaker, text } (ligne de transcript colorée par
// personnage). Ces trois derniers types (2026-09-20) répondent à un vrai besoin identifié en
// examinant chaque type de rapport existant contre ce gabarit (demande explicite : « essaie de voir
// si des documents spécifiques doivent sortir de ce gabarit pour des bonnes raisons ») — AUCUN
// rapport n'a eu besoin de sortir du gabarit commun, chaque besoin réel (citer du code pour
// THE-FINAL-JUDGE, montrer une capture pour THE-SCREENER, colorer un transcript de simulation par
// personnage) s'est résolu en enrichissant le vocabulaire de blocs, jamais en forkant une page à
// part. Tout le texte passe par escapeHtml() — un rapport peut légitimement contenir des caractères
// qui casseraient du HTML brut (ex. `<` dans une comparaison numérique), jamais une raison
// d'injecter du HTML non échappé.
const DIALOGUE_SPEAKER_CLASS = { lia: "speaker-lia", "noé": "speaker-noe", noe: "speaker-noe" };

export function renderBlock(block) {
  if (!block || !block.type) return "";
  switch (block.type) {
    case "heading":
      return `<h2>${escapeHtml(block.text)}</h2>`;
    case "paragraph":
      return `<p>${escapeHtml(block.text)}</p>`;
    case "note":
      return `<p class="note">${escapeHtml(block.text)}</p>`;
    // { type: 'highlight', heading?, paragraphs: [...] } (2026-09-21, besoin réel de
    // buildCircleRunSummaryHtml() — le récapitulatif de fin de Ronde CIRCLE-TASKS doit mettre en
    // évidence son analyse approfondie « dans un bloc séparé », demande explicite de l'utilisateur).
    // Distinct de 'note' (une mise en garde discrète en italique) : un bloc PROÉMINENT, bordure
    // pleine et fond marqué — jamais confondu visuellement avec un simple avertissement.
    case "highlight": {
      const heading = block.heading ? `<h3>${escapeHtml(block.heading)}</h3>` : "";
      const paragraphs = (block.paragraphs || [block.text]).filter(Boolean).map((p) => `<p>${escapeHtml(p)}</p>`).join("");
      return `<div class="highlight">${heading}${paragraphs}</div>`;
    }
    case "list":
      return `<ul>${(block.items || []).map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
    case "table": {
      const headers = block.headers || [];
      const rows = block.rows || [];
      const thead = `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`;
      const tbody = rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("");
      return `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
    }
    case "code":
      return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
    case "image": {
      if (!block.src) return "";
      const caption = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : "";
      return `<figure><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.caption || "")}" loading="lazy">${caption}</figure>`;
    }
    case "dialogue": {
      const speakerClass = DIALOGUE_SPEAKER_CLASS[String(block.speaker || "").toLowerCase()] || "speaker-other";
      return `<p class="dialogue ${speakerClass}"><strong>${escapeHtml(block.speaker)}</strong> — ${escapeHtml(block.text)}</p>`;
    }
    // { type: 'tree', nodes: [{ label, children: [...] }] } (2026-09-20, besoin réel de
    // check-tasks-details : une arborescence détaillée thème > sous-thème > tâche, jamais
    // représentable par le type 'list' existant, à plat, sans imbrication). Même règle que les
    // trois types précédents : enrichir le vocabulaire commun plutôt que forker une page à part.
    case "tree": {
      // statusKey (2026-09-20, retour direct de l'utilisateur sur le tout premier rapport livré :
      // « la distinction être fait/en cours/à faire n'est pas assez claire, pas assez visible ») —
      // une classe CSS par statut sur chaque feuille, en plus de l'icône déjà ajoutée dans le
      // libellé lui-même (buildTree()) — jamais un second texte de statut dupliqué, seulement un
      // habillage visuel de ce qui est déjà écrit.
      const renderNodes = (nodes) =>
        `<ul>${(nodes || [])
          .map((n) => `<li${n.statusKey ? ` class="tree-status-${escapeHtml(n.statusKey)}"` : ""}>${escapeHtml(n.label)}${n.children?.length ? renderNodes(n.children) : ""}</li>`)
          .join("")}</ul>`;
      return renderNodes(block.nodes);
    }
    // { type: 'matrix', columns: [...], rows: [{ label, cells: [{ items, tone }] }] } (2026-09-24,
    // chantier 1 du plan de nuit — la « carte visuelle » que l'utilisateur a explicitement
    // demandée à côté de la page HTML : « Une page HTML + une carte visuelle »). Le type 'table'
    // existant ne pouvait pas la rendre : une carte croise DEUX axes et colore chaque case selon
    // ce que le croisement vaut, là où un tableau aligne des valeurs sans que la position dise
    // quoi que ce soit. Même règle que les quatre types précédents : enrichir le vocabulaire
    // commun plutôt que forker une page à part, pour que la carte suivante, quel qu'en soit le
    // sujet, arrive par le même chemin.
    case "matrix": {
      const cols = block.columns || [];
      const thead = `<tr><th class="matrix-corner">${escapeHtml(block.corner || "")}</th>${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr>`;
      const tbody = (block.rows || []).map((r) => {
        const cells = (r.cells || []).map((cell) => {
          const items = cell?.items || [];
          // Une case VIDE et une case pleine ne se lisent pas pareil, et le vide est souvent
          // l'information : « aucune règle vitale n'est bloquante » est un constat, pas un blanc.
          const contenu = items.length ? items.map((i) => `<span class="matrix-chip">${escapeHtml(String(i))}</span>`).join("") : `<span class="matrix-empty">·</span>`;
          return `<td class="matrix-cell matrix-${escapeHtml(cell?.tone || "neutre")}">${contenu}</td>`;
        }).join("");
        return `<tr><th class="matrix-row-label">${escapeHtml(r.label)}</th>${cells}</tr>`;
      }).join("");
      const legende = block.legend ? `<p class="note">${escapeHtml(block.legend)}</p>` : "";
      return `<table class="matrix"><thead>${thead}</thead><tbody>${tbody}</tbody></table>${legende}`;
    }
    default:
      return "";
  }
}

// Thème partagé — même palette que la première page produite dans ce style (photo de la dream
// team), pour une identité visuelle cohérente d'un rapport à l'autre.
export const THEME_CSS = `
  :root {
    --bg: #0f1115; --panel: #1a1d24; --panel-border: #2a2e38;
    --accent: #d99a4e; --accent2: #6ea8d9; --text: #e7e6e2; --muted: #9a9fab;
    --ok: #6fbf73; --warn: #e0645a;
    /* Identité des personnages, reprise telle quelle de app/globals.css (--lia/--noe du jeu
       réel) — jamais une couleur de rapport inventée séparément (Article 15/17 appliqués aux
       rapports : ce que le lecteur voit ici doit correspondre à ce qu'il voit dans le jeu).
       RÈGLE PERMANENTE (2026-09-22, demande explicite de l'utilisateur) : ces deux valeurs DOIVENT
       rester synchronisées avec --lia/--noe de app/globals.css, y compris quand la future charte
       graphique de la refonte les changera — jamais un choix de couleur de rapport indépendant.
       Vérifié mécaniquement par checkHtmlReportTheme() (scripts/doc-report.mjs), qui compare ces
       deux constantes au fichier réel à chaque exécution. */
    --lia: #f29bc3; --noe: #55dbe5;
  }
  * { box-sizing: border-box; }
  /* Zoom 150% à l'ouverture pour TOUS les rapports HTML (2026-09-22, demande explicite de
     l'utilisateur, généralisée depuis une première demande limitée au seul transcript de
     simulation) — vérifié mécaniquement par checkHtmlReportTheme() (scripts/doc-report.mjs). */
  body { zoom: 1.5; }
  body {
    margin: 0; padding: 40px 20px 60px;
    background: radial-gradient(circle at 20% -10%, #232733 0%, var(--bg) 55%);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.5;
  }
  .wrap { max-width: 860px; margin: 0 auto; }
  header { text-align: center; margin-bottom: 8px; }
  header .date {
    color: var(--accent2); font-size: 0.85rem; letter-spacing: 1px; text-transform: uppercase;
  }
  header h1 { font-size: 1.9rem; margin: 4px 0 6px; letter-spacing: 0.4px; }
  header .sub { color: var(--muted); font-size: 0.95rem; max-width: 640px; margin: 0 auto; }
  .divider { height: 1px; margin: 26px 0; background: linear-gradient(90deg, transparent, var(--panel-border), transparent); }
  main h2 { font-size: 1.15rem; color: var(--accent2); margin: 26px 0 10px; }
  main p { margin: 8px 0; }
  main p.note {
    font-style: italic; color: #c9b98f; border-left: 2px solid var(--accent);
    padding-left: 10px; margin: 10px 0;
  }
  main .highlight {
    background: var(--panel); border: 2px solid var(--accent); border-radius: 14px;
    padding: 18px 22px; margin: 22px 0;
  }
  main .highlight h3 { margin: 0 0 10px; color: var(--accent); font-size: 1.05rem; }
  main .highlight p { margin: 8px 0; }
  main ul { padding-left: 22px; }
  main li { margin: 4px 0; }
  main li.tree-status-enCours { color: var(--accent); font-weight: 600; }
  main li.tree-status-ouverte { color: var(--accent2); }
  main li.tree-status-terminee { color: var(--muted); }
  main li.tree-status-autre { color: var(--warn); font-weight: 600; }
  table {
    width: 100%; border-collapse: collapse; background: var(--panel);
    border: 1px solid var(--panel-border); border-radius: 12px; overflow: hidden;
    font-size: 0.88rem; margin: 10px 0;
  }
  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--panel-border); }
  th { color: var(--accent2); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; }
  tr:last-child td { border-bottom: none; }
  main pre {
    background: var(--panel); border: 1px solid var(--panel-border); border-radius: 10px;
    padding: 12px 14px; overflow-x: auto; font-size: 0.82rem; margin: 10px 0;
  }
  main pre code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  main figure { margin: 14px 0; text-align: center; }
  main figure img {
    max-width: 100%; border-radius: 10px; border: 1px solid var(--panel-border);
  }
  main figure figcaption { color: var(--muted); font-size: 0.82rem; margin-top: 6px; font-style: italic; }
  main p.dialogue { margin: 6px 0; padding-left: 10px; border-left: 2px solid var(--panel-border); }
  main p.dialogue.speaker-lia { border-left-color: var(--lia); }
  main p.dialogue.speaker-lia strong { color: var(--lia); }
  main p.dialogue.speaker-noe { border-left-color: var(--noe); }
  main p.dialogue.speaker-noe strong { color: var(--noe); }
  main p.dialogue.speaker-other strong { color: var(--muted); }
  /* La carte visuelle (type 'matrix') — la couleur porte le VERDICT du croisement, jamais une
     décoration : c'est la seule chose qu'un tableau ne savait pas dire. */
  table.matrix { table-layout: fixed; }
  table.matrix th.matrix-corner { background: transparent; }
  table.matrix th.matrix-row-label {
    text-transform: none; font-size: 0.8rem; color: var(--text); width: 22%;
    border-right: 1px solid var(--panel-border); vertical-align: middle;
  }
  table.matrix td.matrix-cell { vertical-align: middle; min-height: 34px; }
  table.matrix .matrix-chip {
    display: inline-block; margin: 2px 3px; padding: 1px 7px; border-radius: 999px;
    background: rgba(255,255,255,0.08); font-size: 0.78rem; font-variant-numeric: tabular-nums;
  }
  table.matrix .matrix-empty { color: var(--panel-border); }
  table.matrix td.matrix-critique { background: rgba(224,100,90,0.22); box-shadow: inset 0 0 0 1px var(--warn); }
  table.matrix td.matrix-alerte   { background: rgba(217,154,78,0.18); }
  table.matrix td.matrix-correct  { background: rgba(110,168,217,0.12); }
  table.matrix td.matrix-bon      { background: rgba(111,191,115,0.15); }
  table.matrix td.matrix-neutre   { background: transparent; }
  footer { text-align: center; margin-top: 40px; color: var(--muted); font-size: 0.8rem; }
`;

// `title` obligatoire (Article 5 : jamais un rapport sans identité claire). `blocks` peut être
// vide (rapport minimal), jamais une erreur en soi.
// `tool` (2026-09-22, tâche #199) : le slug de l'outil au registre. Facultatif, pour ne casser aucun
// des ~10 appelants existants — mais dès qu'il est fourni, le rapport reçoit automatiquement
// l'emplacement générique d'en-tête (aujourd'hui l'avertissement de fiabilité), sans que l'appelant
// ait à y penser. C'est tout l'intérêt du gabarit : la phrase transverse suivante arrivera par le
// même chemin, en UN endroit, jamais en repassant sur chaque outil.
export function renderHtmlReport({ tool, title, subtitle, dateLabel, blocks = [], footer } = {}) {
  if (!title) throw new Error("renderHtmlReport() requires a title — jamais un rapport sans titre");
  // Le cadre unique (report-template.mjs) plutôt que les arguments bruts : les rendus texte et HTML
  // consomment la MÊME description, sinon l'un appliquerait une partie du gabarit que l'autre oublie.
  const frame = buildReportFrame({ tool, title, subtitle, dateLabel, blocks, footer });
  const avecSlots = [...frame.slots.map((texte) => ({ type: "note", text: texte })), ...frame.blocks];
  const body = avecSlots.map(renderBlock).join("\n");
  dateLabel = frame.dateLabel;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>${THEME_CSS}</style>
</head>
<body>
<div class="wrap">
  <header>
    ${dateLabel ? `<div class="date">${escapeHtml(dateLabel)}</div>` : ""}
    <h1>${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="sub">${escapeHtml(subtitle)}</p>` : ""}
  </header>
  <div class="divider"></div>
  <main>${body}</main>
  ${footer ? `<div class="divider"></div><footer><p>${escapeHtml(footer)}</p></footer>` : ""}
</div>
</body>
</html>
`;
}
