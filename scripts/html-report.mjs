// ICEBERG: membre
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
import { reliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

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

// ══════════════════════════════════════════════════════════════════════════════════════════════
// LIRE DU MARKDOWN — pour qu'un document du dépôt devienne une page lisible (2026-09-28, #1116)
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// SA DEMANDE : « redonne-moi en HTML bien construit, lisible, au bon format : la vue globale, le
// plan d'action ». Et sa COMMANDE en annonce d'autres — le fichier de réponses, le PACK DÉCOUVERTE,
// la présentation de l'Agence. Écrire chacune à la main aurait produit autant de pages que de
// demandes, chacune avec sa mise en forme : exactement la divergence que l'Article 24 interdit.
//
// POURQUOI ICI : ce fichier EST le moteur de rendu (doc-HTML). Il porte déjà le vocabulaire des
// blocs et le thème partagé ; il ne savait pas d'où venait le contenu. Lui apprendre à lire le
// Markdown du dépôt fait de n'importe quel document une page, par le même chemin que les rapports
// d'outils — donc avec la même identité visuelle, sans un seul gabarit de plus.
//
// LES SOULIGNEMENTS EN LIGNE SONT RÉINTRODUITS APRÈS L'ÉCHAPPEMENT, jamais avant : échapper d'abord
// puis reconnaître `**gras**` sur le texte DÉJÀ échappé est la seule façon d'avoir les deux à la
// fois — un rendu fidèle et aucune injection possible. L'ordre inverse laisserait passer du HTML
// écrit dans un document.
// LE NIVEAU D'ALERTE SE LIT SUR LE MARQUEUR DE TÊTE (2026-10-04, sa précision sur la palette).
// DEUX CRANS, ET ILS NE SE VALENT PAS : 🚨 est le rouge — critique, il faut agir ; ⛔ est le noir —
// grave, mais d'un cran en dessous. Tout le reste du texte vit en bleu foncé ou en gris foncé,
// et c'est précisément ce qui donne à ces deux-là leur force : une page où tout crie ne dit rien.
//
// POURQUOI UN MARQUEUR ET PAS UNE CLASSE ÉCRITE À LA MAIN : les outils de ce dépôt impriment déjà
// 🚨 dans leur sortie depuis des semaines. Le style suit donc ce qu'ils PRODUISENT, au lieu de
// leur demander d'apprendre une syntaxe de plus — et un outil écrit demain hérite du rendu sans
// que personne n'ait à y penser (Article 24).
export const MARQUEURS_D_ALERTE = Object.freeze([
  { marqueur: "🚨", classe: "alerte", quoi: "critique — rouge, il faut agir" },
  { marqueur: "⛔", classe: "alerte-grave", quoi: "grave — noir, un cran sous le rouge" },
]);

export function classeDAlerte(texte = "") {
  const t = String(texte ?? "").trim();
  for (const m of MARQUEURS_D_ALERTE) if (t.startsWith(m.marqueur)) return ` class="${m.classe}"`;
  return "";
}

export function renderInline(texte) {
  return escapeHtml(String(texte ?? ""))
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

export function blocsDepuisMarkdown(markdown) {
  const lignes = String(markdown ?? "").split("\n");
  const blocs = [];
  let i = 0;
  // Un paragraphe se termine sur une ligne vide ou sur le début d'un autre bloc : on accumule, on
  // vide, jamais l'inverse — sinon deux paragraphes voisins fusionnent en un mur de texte.
  let para = [];
  const viderPara = () => { if (para.length) { blocs.push({ type: "paragraph", text: para.join(" ") }); para = []; } };
  while (i < lignes.length) {
    const l = lignes[i];
    // Les commentaires HTML d'un document généré (la mention de régime, par exemple) ne sont pas du
    // contenu : les rendre afficherait au lecteur une consigne qui ne le concerne pas.
    if (/^<!--/.test(l)) { viderPara(); while (i < lignes.length && !/-->/.test(lignes[i])) i += 1; i += 1; continue; }
    if (/^\s*$/.test(l)) { viderPara(); i += 1; continue; }
    if (/^---+\s*$/.test(l)) { viderPara(); blocs.push({ type: "rule" }); i += 1; continue; }
    const titre = l.match(/^(#{1,6})\s+(.+)$/);
    if (titre) { viderPara(); blocs.push({ type: "heading", level: titre[1].length, text: titre[2] }); i += 1; continue; }
    if (/^```/.test(l)) {
      viderPara();
      const corps = [];
      i += 1;
      while (i < lignes.length && !/^```/.test(lignes[i])) { corps.push(lignes[i]); i += 1; }
      i += 1;
      blocs.push({ type: "code", text: corps.join("\n") });
      continue;
    }
    if (/^>\s?/.test(l)) {
      viderPara();
      const corps = [];
      while (i < lignes.length && /^>\s?/.test(lignes[i])) { corps.push(lignes[i].replace(/^>\s?/, "")); i += 1; }
      blocs.push({ type: "highlight", paragraphs: corps.join("\n").split(/\n\s*\n/).filter(Boolean) });
      continue;
    }
    if (/^\s*\|/.test(l)) {
      viderPara();
      const brutes = [];
      while (i < lignes.length && /^\s*\|/.test(lignes[i])) { brutes.push(lignes[i]); i += 1; }
      const cellules = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      // La ligne de séparation `|---|---|` n'est pas une donnée : la garder ajouterait une rangée de
      // tirets au milieu du tableau rendu.
      const lignesUtiles = brutes.filter((r) => !/^\s*\|[\s:|-]+\|?\s*$/.test(r));
      if (lignesUtiles.length) blocs.push({ type: "table", headers: cellules(lignesUtiles[0]), rows: lignesUtiles.slice(1).map(cellules) });
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      viderPara();
      const items = [];
      while (i < lignes.length && /^\s*([-*]|\d+\.)\s+/.test(lignes[i])) {
        items.push(lignes[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
        i += 1;
        // Une puce qui se poursuit sur la ligne suivante appartient au même item : sans ça, la
        // suite d'une phrase devient une puce orpheline.
        while (i < lignes.length && /^\s{2,}\S/.test(lignes[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lignes[i])) {
          items[items.length - 1] += " " + lignes[i].trim();
          i += 1;
        }
      }
      blocs.push({ type: "list", items });
      continue;
    }
    para.push(l.trim());
    i += 1;
  }
  viderPara();
  return blocs;
}

// Le rendu des blocs issus d'un document diffère de celui des rapports d'outils sur un seul point,
// et il compte : les titres gardent leur NIVEAU (h2 à h6) au lieu d'être tous des h2. Un document de
// deux cents lignes sans hiérarchie visible est illisible, et c'est précisément ce qu'il demande.
export function renderBlockDocument(block) {
  if (block?.type === "heading" && block.level) return `<h${Math.min(block.level + 1, 6)}>${renderInline(block.text)}</h${Math.min(block.level + 1, 6)}>`;
  if (block?.type === "rule") return "<hr>";
  if (block?.type === "paragraph") return `<p${classeDAlerte(block.text)}>${renderInline(block.text)}</p>`;
  if (block?.type === "list") return `<ul>${(block.items || []).map((x) => `<li${classeDAlerte(x)}>${renderInline(x)}</li>`).join("")}</ul>`;
  if (block?.type === "highlight") {
    const ps = (block.paragraphs || []).map((x) => `<p>${renderInline(x)}</p>`).join("");
    return `<div class="highlight">${ps}</div>`;
  }
  if (block?.type === "table") {
    const thead = `<tr>${(block.headers || []).map((h) => `<th>${renderInline(h)}</th>`).join("")}</tr>`;
    const tbody = (block.rows || []).map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`).join("");
    return `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
  }
  return renderBlock(block);
}

export function renderDocumentHtml({ markdown, title, subtitle, dateLabel, footer } = {}) {
  const blocs = blocsDepuisMarkdown(markdown);
  // LE PREMIER TITRE DE NIVEAU 1 DEVIENT LE TITRE DE LA PAGE, jamais un h2 de plus : l'afficher
  // deux fois est la marque d'une conversion faite sans regarder le résultat.
  const premier = blocs.findIndex((b) => b.type === "heading" && b.level === 1);
  const titre = title ?? (premier > -1 ? blocs[premier].text : "Document");
  const corps = blocs.filter((_, k) => k !== premier);
  return renderHtmlReport({ title: titre, subtitle, dateLabel, footer, blocks: [], corpsHtml: corps.map(renderBlockDocument).join("\n") });
}

// Thème partagé — même palette que la première page produite dans ce style (photo de la dream
// team), pour une identité visuelle cohérente d'un rapport à l'autre.
export const THEME_CSS = `
  /* PALETTE CLAIRE — BLEUS, CYANS, GRIS (2026-10-04, tâche #1600, précisée le jour même).
     SA PREMIÈRE DEMANDE : « je veux un fond gris et pas noir, et une écriture foncée et pas clair.
     Revois l'harmonie des couleurs pour un rendu moderne gris-bleu-blanc ».
     SA PRÉCISION, QUI RESSERRE LA GAMME ET INTERDIT LE BLANC PUR : « uniquement des tons
     bleus-cyan-turquoises-ciel-gris clair-gris pale-gris-gris foncé, pas d'autres couleurs sauf
     ROUGE ou NOIR pour mettre en evidence et/ou alerter. Le fond de texte ne doit jamais etre
     blanc pur : l'ambiance de la fiche doit etre douce, studieuse, ne fait pas mal aux yeux, style
     agence, moderne, classe, agreable à regarder. »
     CE QUE ÇA CHANGE CONCRÈTEMENT, et aucune des trois n'est cosmétique : l'ambre de --accent
     sort de la gamme et devient un TEAL ; --panel quitte #ffffff pour un blanc bleuté (#f3f7fa)
     parce qu'un blanc pur sous une page lue longtemps est ce qui fatigue l'œil ; et --ok cesse
     d'être vert, puisque le vert n'est pas dans la gamme — le rouge reste le seul signal, ce qui
     le rend d'ailleurs plus fort.
     LE BESOIN RÉEL, QU'IL DONNE LUI-MÊME, ET C'EST LUI QUI JUGE : « c'est pour pouvoir copier
     coller sur du fond blanc que je te demande tout ca ». Une page sombre collée dans un document
     blanc perd son fond et garde son texte clair : elle devient illisible. Avec un texte foncé sur
     fond clair, le copier-coller survit, que le fond parte ou non.
     LES CONTRASTES SONT CALCULÉS, PAS CHOISIS À L'ŒIL : texte #1b2330 sur #eef1f5 donne ~14:1,
     les liens #1f5b8f ~6,5:1, le texte discret #566274 ~5,2:1 — tous au-dessus du minimum de
     4,5:1. C'était déjà le raisonnement de la correction des liens du 2026-10-03 ; il tient dans
     l'autre sens. */
  :root {
    --bg: #dfe7ed; --panel: #f3f7fa; --panel-border: #b9c9d6;
    --accent: #0e6a72; --accent2: #16567e; --text: #30597a; --text-gris: #4f6878; --muted: #4a5d6c;
    /* LES TITRES SONT EN BLEU GRAS ET EN GRIS GRAS, PAS EN FONCÉ (2026-10-04, sa précision) :
       « je veux des titres en bleu gras (bleu pas foncé) et gris gras (pas foncé) ». Les deux
       teintes ci-dessous sont plus CLAIRES que le corps du texte — l'inverse de l'habitude — et
       c'est le GRAS qui porte la hiérarchie, pas l'obscurité. Elles tiennent quand même 4,6:1
       et 4,7:1, donc elles restent lisibles pour quelqu'un qui ne distingue pas bien les
       contrastes : un titre clair ne doit pas être un titre qu'on devine. */
    --titre-bleu: #17659f; --titre-gris: #4f6878;
    --ok: #0e6a72; --warn: #b01c16;
    /* LES DEUX NIVEAUX D'ALERTE, ET ILS NE SE VALENT PAS (2026-10-04, sa précision) : « le noir
       est exceptionnel, tout comme le rouge : uniquement pour alerter […] un exemple de texte en
       rouge pour m'alerter, et en noir car alerte d'un autre niveau (grave mais pas aussi
       critique que rouge) ». Le ROUGE est le cran du haut, le NOIR celui juste en dessous. Aucune
       des deux ne sert jamais à décorer : hors alerte, tout le texte vit en bleu foncé ou en gris
       foncé, et c'est ce qui donne aux deux leur force. */
    --alerte: #b01c16; --alerte-grave: #0a0f14;
    /* Identité des personnages, reprise telle quelle de app/globals.css (--lia/--noe du jeu
       réel) — jamais une couleur de rapport inventée séparément (Article 15/17 appliqués aux
       rapports : ce que le lecteur voit ici doit correspondre à ce qu'il voit dans le jeu).
       RÈGLE PERMANENTE (2026-09-22, demande explicite de l'utilisateur) : ces deux valeurs DOIVENT
       rester synchronisées avec --lia/--noe de app/globals.css, y compris quand la future charte
       graphique de la refonte les changera — jamais un choix de couleur de rapport indépendant.
       Vérifié mécaniquement par checkHtmlReportTheme() (scripts/doc-report.mjs), qui compare ces
       deux constantes au fichier réel à chaque exécution. */
    --lia: #f29bc3; --noe: #55dbe5;
    /* DEUX VARIANTES FONCÉES, ET ELLES NE CONTOURNENT PAS LA RÈGLE CI-DESSUS (2026-10-04, #1600).
       --lia et --noe restent EXACTEMENT les couleurs du jeu, et le garde-fou les compare
       toujours à app/globals.css. Mais ces deux teintes sont faites pour un fond sombre : sur
       fond clair, #f29bc3 tombe à ~1,8:1, donc le nom du personnage devient illisible. Les
       variantes ci-dessous servent UNIQUEMENT au TEXTE ; la couleur d'identité continue de porter
       le filet de gauche, là où le contraste n'est pas en jeu. Changer --lia aurait désynchronisé
       le rapport du jeu — ce que la règle interdit, et à juste titre.
       ELLES SONT DANS LA GAMME, et ce n'est pas un détail : sa précision du 2026-10-04 n'autorise
       que les bleus, cyans et gris, plus le rouge et le noir pour alerter. Le rose de Lia ne peut
       donc pas porter du texte ici ; les deux variantes sont un gris-ardoise et un teal, qui se
       distinguent l'un de l'autre sans sortir de la palette. */
    --lia-texte: #2d4150; --noe-texte: #0e6a72;
  }
  /* LES LIENS N'ÉTAIENT PAS STYLÉS DU TOUT (2026-10-03, tâche #1527, sa remarque sur l'index des
     fils : « evite le bleu fonce sur fond noir, c'est peu visible »). Ce n'était pas une couleur
     mal choisie — c'était une couleur JAMAIS choisie : sans règle de style sur les liens, le
     navigateur applique son
     bleu par défaut #0000EE, qui sur le fond sombre d'alors donnait un contraste d'environ 2:1,
     très au-dessous du minimum lisible de 4,5:1. Le défaut était donc invisible à toute relecture
     de la palette, puisque la couleur fautive n'y figurait pas.
     --accent2 est dans la palette et tient le contraste sur le fond courant. Le soulignement est
     gardé : la couleur seule ne doit jamais être le seul indice qu'un texte est cliquable. */
  a { color: var(--accent2); text-decoration: underline; text-underline-offset: 2px; }
  a:hover { color: var(--accent); }
  a:visited { color: var(--accent2); opacity: 0.82; }
  * { box-sizing: border-box; }
  /* Zoom 150% à l'ouverture pour TOUS les rapports HTML (2026-09-22, demande explicite de
     l'utilisateur, généralisée depuis une première demande limitée au seul transcript de
     simulation) — vérifié mécaniquement par checkHtmlReportTheme() (scripts/doc-report.mjs). */
  body { zoom: 1.5; }
  body {
    margin: 0; padding: 40px 20px 60px;
    background: radial-gradient(circle at 20% -10%, #eaf1f6 0%, var(--bg) 55%);
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
  main h2 { font-size: 1.2rem; font-weight: 700; color: var(--titre-bleu); margin: 28px 0 10px; }
  main h3 { font-size: 1.02rem; font-weight: 700; color: var(--titre-gris); margin: 20px 0 8px; text-transform: none; }
  main h4 { font-size: 0.95rem; font-weight: 700; color: var(--titre-gris); margin: 16px 0 6px; }
  main p { margin: 8px 0; }
  main p.note {
    font-style: italic; color: var(--muted); border-left: 2px solid var(--accent);
    padding-left: 10px; margin: 10px 0;
  }
  /* LES DÉGRADÉS, « si motif pertinent » (2026-10-04, sa question). Trois endroits seulement, et
     chacun a une RAISON de dégradé plutôt qu'un goût : le filet d'un titre de section, qui
     s'éteint vers la droite pour dire « la section commence ici et se poursuit » ; le fond d'un
     encadré, qui s'éclaircit vers le bas pour le détacher sans le cerner d'un trait ; et la bande
     d'en-tête, qui donne sa profondeur à la page. Partout ailleurs, l'aplat : un dégradé qui ne
     dit rien fatigue l'œil et imprime mal. */
  main h2::after {
    content: ""; display: block; height: 2px; margin-top: 6px; border-radius: 2px;
    background: linear-gradient(90deg, var(--titre-bleu) 0%, var(--accent) 35%, transparent 100%);
  }
  main .highlight {
    background: linear-gradient(180deg, #fbfdfe 0%, var(--panel) 100%);
    border: 1px solid var(--panel-border); border-left: 3px solid var(--accent); border-radius: 0 12px 12px 0;
    padding: 18px 22px; margin: 22px 0;
  }
  main .highlight h3 { margin: 0 0 10px; color: var(--accent); font-size: 1.05rem; }
  main .highlight p { margin: 8px 0; }
  /* LES DEUX NIVEAUX D'ALERTE À L'AFFICHAGE. Ils se déclenchent sur un MARQUEUR en tête de ligne,
     jamais sur une classe écrite à la main : les outils de ce dépôt écrivent déjà 🚨 et ⛔ dans
     leur sortie, donc le style suit ce qu'ils produisent au lieu d'exiger qu'ils apprennent une
     syntaxe de plus. */
  main .alerte { color: var(--alerte); font-weight: 600; }
  main .alerte-grave { color: var(--alerte-grave); font-weight: 600; }
  main p.alerte, main li.alerte {
    border-left: 3px solid var(--alerte); padding: 8px 12px; background: #f7eceb; border-radius: 0 8px 8px 0;
  }
  main p.alerte-grave, main li.alerte-grave {
    border-left: 3px solid var(--alerte-grave); padding: 8px 12px; background: #e9eef2; border-radius: 0 8px 8px 0;
  }
  main .doux { color: var(--text-gris); }
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
  main p.dialogue.speaker-lia strong { color: var(--lia-texte); }
  main p.dialogue.speaker-noe { border-left-color: var(--noe); }
  main p.dialogue.speaker-noe strong { color: var(--noe-texte); }
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
// `corpsHtml` (2026-09-28, #1116) — un corps DÉJÀ rendu, pour les documents dont les titres gardent
// leur niveau. Le gabarit, l'en-tête, le thème et le pied restent partagés : c'est le seul endroit
// où deux rendus pouvaient diverger, et la leçon L26 dit exactement ce qu'il en coûte.
export function renderHtmlReport({ tool, title, subtitle, dateLabel, blocks = [], footer, corpsHtml = null } = {}) {
  if (!title) throw new Error("renderHtmlReport() requires a title — jamais un rapport sans titre");
  // Le cadre unique (report-template.mjs) plutôt que les arguments bruts : les rendus texte et HTML
  // consomment la MÊME description, sinon l'un appliquerait une partie du gabarit que l'autre oublie.
  const frame = buildReportFrame({ tool, title, subtitle, dateLabel, blocks, footer });
  const avecSlots = [...frame.slots.map((texte) => ({ type: "note", text: texte })), ...frame.blocks];
  const body = corpsHtml ?? avecSlots.map(renderBlock).join("\n");
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

// =============================================================================================
// LE RAPPORT HTML D'UN AGENT SÉPARÉ — une seule forme pour les deux (2026-09-28, tâche #997)
// =============================================================================================
// THE-FINAL-JUDGE et THE-DEEP-READER construisaient le MÊME rapport, à trois mots près : le titre,
// le sous-titre et le slug. Tout le reste était recopié — l'horodatage par défaut, l'emplacement
// générique de la phrase de fiabilité, le corps en bloc `code` non reformaté, et le pied qui dit
// la même chose des deux : **conseiller uniquement, jamais un exécutant ni une décision
// automatique**.
//
// CE PIED N'EST PAS UNE FORMULE, C'EST LA RÈGLE QUI GOUVERNE CES DEUX OUTILS. Écrite en deux
// exemplaires, elle pouvait être adoucie dans l'un sans que l'autre bouge — et c'est exactement le
// genre de dérive qu'aucun test n'attrape, puisque les deux rapports resteraient parfaitement
// valides. Une phrase qui porte une limite d'autorité s'écrit UNE fois.
//
// LE TEXTE DU RAPPORT RESTE UN BLOC `code`, jamais reformaté ni résumé : ce que rend un agent
// séparé coûte un vrai appel, et le retoucher à l'affichage reviendrait à payer un avis pour en
// lire un autre.
// L'AVERTISSEMENT EST PASSÉ, JAMAIS ALLÉ CHERCHER ICI — ET C'EST UN GARDE-FOU QUI L'A EXIGÉ
// (2026-09-28). Ma première version appelait `reliabilityNotice(slug)` depuis ce fichier partagé :
// le rapport sortait identique, et le détecteur `findHeuristicToolsWithoutNotice()` s'est mis à
// accuser LES DEUX outils de ne jamais avertir. Il avait raison. Il vérifie que chaque outil
// héuristique NOMME son slug dans un vrai appel d'avertissement, parce que deux outils peuvent
// vivre dans le même fichier et que l'un couvrirait alors l'autre.
//
// J'AURAIS PU ÉLARGIR LE DÉTECTEUR À CETTE QUATRIÈME FORME. C'eût été desserrer un garde-fou pour
// faire passer mon propre changement — le geste exact que ce projet refuse. L'avertissement est
// donc récupéré CHEZ L'APPELANT, qui y nomme son slug, et passé ici en valeur. La factorisation
// garde tout ce qu'elle apportait, et la vérification garde toute sa sévérité.
export function buildRapportDAgentSepareHtml(slug, reportText, { title, subtitle, dateLabel, notice = null, renderImpl = renderHtmlReport } = {}) {
  return renderImpl({
    title,
    subtitle,
    dateLabel: dateLabel ?? new Date().toISOString(),
    blocks: [
      ...(notice ? [{ type: "note", text: notice }] : []),
      { type: "code", text: reportText },
    ],
    footer: `${slug.toUpperCase()} — conseiller uniquement, jamais un exécutant ni une décision automatique.`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LA LIGNE DE COMMANDE — parce qu'une génération faite une seule fois à la main
// ne sera jamais refaite (2026-09-28, tâche #1114, leçon L2).
//
// Les trois pages HTML du grand projet ont d'abord été produites par un script jetable écrit dans
// la conversation. Elles étaient justes ce soir-là, et FAUSSES dès la première correction du
// Markdown : personne — moi comprise — n'aurait su comment les refaire. Un livrable dérivé d'un
// autre fichier doit avoir un GESTE, pas un souvenir.
//
//   node scripts/html-report.mjs document <source.md> <sortie.html> [--titre "…"] [--sous-titre "…"]
//
// Le titre par défaut se lit sur le premier `# ` du Markdown : le document se décrit déjà lui-même,
// et le redemander en argument serait une occasion de plus de le laisser diverger (Article 24).
export async function documentDepuisFichier(source, sortie, { titre = null, sousTitre = null, readImpl = null, writeImpl = null } = {}) {
  const { readFileSync, writeFileSync, mkdirSync } = await import("node:fs");
  const { dirname } = await import("node:path");
  const lire = readImpl ?? ((p) => readFileSync(p, "utf8"));
  const ecrire = writeImpl ?? ((p, c) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, c, "utf8"); });

  const markdown = lire(source);
  const premierTitre = (markdown.match(/^#\s+(.+)$/m) ?? [])[1] ?? source;
  const html = renderDocumentHtml({
    markdown,
    title: titre ?? premierTitre.trim(),
    subtitle: sousTitre ?? `Page générée depuis ${source} — jamais écrite à la main.`,
    dateLabel: new Date().toISOString(),
    footer: `Dérivé de ${source} par doc-HTML. Toute correction se fait dans le Markdown, jamais ici.`,
  });
  ecrire(sortie, html);
  inscrireAuRegistre({ source, sortie, octets: html.length, readImpl: lire, writeImpl: ecrire });
  return { source, sortie, octets: html.length };
}

// LE REGISTRE EST DÉRIVÉ DE CHAQUE PASSAGE, jamais tenu à la main (Article 24, et le garde-fou des
// kits d'export l'a exigé le soir même : un fichier qui ÉCRIT doit un registre). Ce qu'il porte
// n'est pas décoratif — c'est la seule réponse à la question « cette page HTML vient de quel
// Markdown, et de quand ? ». Sans elle, une page dérivée devient indiscernable d'une page écrite à
// la main, et personne ne sait plus laquelle des deux corriger.
export const REGISTRE_DOC_HTML = "docs/html-report/index.md";
export const EN_TETE_REGISTRE = `# doc-HTML — les pages dérivées, et leur source

*(Registre ÉCRIT PAR L'OUTIL à chaque génération, jamais à la main. Une ligne par passage : la page
produite, le Markdown dont elle sort, sa taille et l'heure. Corriger une page se fait TOUJOURS dans
sa source, jamais dans le HTML — la génération suivante l'écraserait.)*

| Page produite | Source Markdown | Octets | Généré le |
|---|---|---|---|
`;

export function inscrireAuRegistre({ source, sortie, octets, quand = null, readImpl, writeImpl, registre = REGISTRE_DOC_HTML }) {
  let texte = EN_TETE_REGISTRE;
  try {
    const existant = readImpl(registre);
    if (existant && existant.includes("| Page produite |")) texte = existant.replace(/\n+$/, "") + "\n";
  } catch {
    // pas encore de registre : l'en-tête ci-dessus fait le premier passage.
  }
  const horodatage = quand ?? new Date().toISOString().slice(0, 16).replace("T", " ") + "Z";
  // UNE PAGE RÉGÉNÉRÉE REMPLACE SA LIGNE, elle ne s'empile pas : un registre qui grossit à chaque
  // passage cesserait de répondre « d'où vient cette page ? » pour ne plus répondre qu'« a-t-elle
  // déjà été produite ? », ce qui n'intéresse personne.
  const lignes = texte.split("\n").filter((l) => !l.startsWith(`| \`${sortie}\``));
  while (lignes.length && lignes[lignes.length - 1].trim() === "") lignes.pop();
  lignes.push(`| \`${sortie}\` | \`${source}\` | ${octets} | ${horodatage} |`);
  writeImpl(registre, lignes.join("\n").replace(/\n+$/, "") + "\n");
  return registre;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // SANS CETTE LIGNE, L'OUTIL TOURNE ET LE COMPTEUR AFFICHE ZÉRO (2026-09-29, tâche #1184) — et un
  // zéro d'usage se lit comme un verdict sur son utilité, jamais comme un compteur débranché. Le
  // défaut n'est apparu qu'en DÉCLARANT son offre au catalogue le même jour : tant qu'il n'était
  // annoncé nulle part, le verrou de Ronde ne pouvait pas le réclamer. Déclarer un outil, c'est
  // aussi accepter d'être compté.
  recordCliUsage("html-report", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
  const [action, source, sortie] = process.argv.slice(2);
  if (action !== "document" || !source || !sortie) {
    console.log('Usage : node scripts/html-report.mjs document <source.md> <sortie.html> [--titre "…"] [--sous-titre "…"]');
    process.exit(2);
  }
  const arg = (nom) => {
    const i = process.argv.indexOf(nom);
    return i > -1 ? process.argv[i + 1] : null;
  };
  const r = await documentDepuisFichier(source, sortie, { titre: arg("--titre"), sousTitre: arg("--sous-titre") });
  console.log(`✅ ${r.sortie} — ${r.octets} octets, dérivés de ${r.source}`);
}
