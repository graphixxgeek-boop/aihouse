// THE-SCREENER — mécanisme de capture (2026-09-19, cf. docs/the-screener-blueprint.md et
// docs/referentiel/the-screener.md). Pilote un vrai navigateur (Playwright) pour prendre le
// nombre minimal de captures décidé avec l'utilisateur (2 par simulation) — la seule façon
// d'obtenir une image du rendu, puisque le protocole de simulation textuelle (full_simN.mjs)
// n'ouvre jamais de navigateur et ne produit donc jamais d'image par lui-même.
//
// Usage : node scripts/the-screener-capture.mjs [url] [outDir]
// Sans arguments : capture une seule fois la page dans son état actuel — utile pour tester le
// mécanisme lui-même (chargement, rendu, capture) indépendamment de toute simulation en cours et
// donc indépendamment du quota Gemini (zéro appel à l'API du jeu depuis ce script).
//
// Usage réel pendant une simulation (à raccorder à full_simN.mjs) : lancer ce script en tâche de
// fond avec des points de déclenchement (ex. round choisi, révélation atteinte) au lieu d'un
// intervalle fixe aveugle — cf. "Principe de sobriété" du blueprint.

import { chromium } from "playwright";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";
import { renderHtmlReport } from "./html-report.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReliabilityNotice } from "./lib-shell.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

export async function captureOnce(url, outPath) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
    // Laisse le temps au rendu Three.js de peindre au moins une frame réelle avant de capturer —
    // une capture prise trop tôt attraperait un canvas encore vide, jamais utile à noter.
    await page.waitForTimeout(1500);
    // UNE CAPTURE MASQUÉE N'EST PAS UNE CAPTURE RÉUSSIE (2026-09-22, tâche #186, trouvé au tout
    // premier lancement réel contre une vraie partie — le mécanisme n'avait jamais été déclenché
    // pendant une simulation depuis sa construction). L'image rendue ne montrait QUE la popup de
    // pseudo, toute la scène floutée derrière, et l'outil annonçait fièrement « Capture réussie ».
    // Pour un outil dont le rôle est de NOTER un rendu graphique, c'est un faux succès : il aurait
    // fait poser une note sur une image où il n'y a rien à noter. Même famille d'erreur que le reste
    // de cette soirée — une absence de mesure lue comme une mesure.
    //
    // La cause n'est pas un bug d'affichage : la popup de pseudo reste ouverte tant que la partie
    // n'a pas d'observateur (`story.observer`), donc pendant TOUTE la phase 1 d'une simulation. Le
    // bon moment pour capturer est la phase 2, une fois l'observateur entré — ce que ce diagnostic
    // dit désormais explicitement plutôt que de laisser l'appelant le deviner.
    const overlay = await page.locator(".nickname-overlay").count().catch(() => 0);
    await page.screenshot({ path: outPath });
    if (overlay > 0) {
      return { ok: true, path: outPath, masque: true, raison: "une fenêtre modale (pseudo, avertissement ou reprise) couvre la scène — l'image est prise, mais il n'y a rien de graphique à y noter. La popup de pseudo reste ouverte tant que la partie n'a pas d'observateur : capturer pendant la phase 2 d'une simulation, jamais la phase 1." };
    }
    return { ok: true, path: outPath, masque: false };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    await browser.close();
  }
}

// Rapport HTML (2026-09-20, tâche #144) : montre la capture elle-même (bloc "image", chemin relatif
// puisque le HTML est écrit dans le même dossier que le PNG) — jamais une seconde tentative de
// capture, jamais un jugement de qualité ici (ça reste le rôle de THE-SCREENER lui-même une fois
// une note posée, cf. docs/referentiel/the-screener.md). Un échec de capture reste honnêtement
// affiché comme un échec, jamais masqué par une image absente sans explication.
export function buildScreenerCaptureHtml(result, { url } = {}) {
  const blocks = result.ok
    ? [
        // L'avertissement AVANT l'image, jamais sous elle : une note posée sur une capture masquée
        // ne vaut rien, et un lecteur doit le savoir avant de regarder.
        ...(result.masque ? [{ type: "note", text: `⚠️ Capture MASQUÉE, inutilisable pour une note graphique : ${result.raison}` }] : []),
        { type: "image", src: basename(result.path), caption: `Capture de ${url ?? "?"}` },
      ]
    : [{ type: "note", text: `Échec de la capture : ${result.error ?? "raison inconnue"}.` }];
  return renderHtmlReport({
    title: "THE-SCREENER — capture",
    subtitle: "Mécanisme de capture (Playwright) — cf. docs/referentiel/the-screener.md pour la notation elle-même.",
    dateLabel: new Date().toISOString(),
    blocks,
    footer: "THE-SCREENER — note indicative, ne prime jamais sur l’appréciation de l’utilisateur.",
  });
}

async function main() {
  printReliabilityNotice("the-screener");
  recordCliUsage("the-screener");
  const url = process.argv[2] || "http://127.0.0.1:5173/";
  const outDir = process.argv[3] || join(ROOT, "docs/the-screener");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `test-capture-${Date.now()}.png`);
  console.log(`=== THE-SCREENER — test du mécanisme de capture ===\n`);
  console.log(`Cible : ${url}`);
  const result = await captureOnce(url, outPath);
  if (result.ok && result.masque) {
    console.log(`Capture prise mais MASQUÉE : ${result.path}`);
    console.log(`  → ${result.raison}`);
    console.log(`  → Aucune note graphique ne doit être posée sur cette image.`);
  } else if (result.ok) {
    console.log(`Capture réussie : ${result.path}`);
  } else {
    console.log(`Échec de la capture : ${result.error}`);
    process.exitCode = 1;
  }
  const htmlPath = join(outDir, `test-capture-${Date.now()}.html`);
  writeFileSync(htmlPath, buildScreenerCaptureHtml(result, { url }));
  console.log(`Copie HTML : ${htmlPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
