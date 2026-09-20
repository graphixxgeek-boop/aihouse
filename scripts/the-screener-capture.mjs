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

const ROOT = new URL("..", import.meta.url).pathname;

export async function captureOnce(url, outPath) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
    // Laisse le temps au rendu Three.js de peindre au moins une frame réelle avant de capturer —
    // une capture prise trop tôt attraperait un canvas encore vide, jamais utile à noter.
    await page.waitForTimeout(1500);
    await page.screenshot({ path: outPath });
    return { ok: true, path: outPath };
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
    ? [{ type: "image", src: basename(result.path), caption: `Capture de ${url ?? "?"}` }]
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
  const url = process.argv[2] || "http://127.0.0.1:5173/";
  const outDir = process.argv[3] || join(ROOT, "docs/the-screener");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `test-capture-${Date.now()}.png`);
  console.log(`=== THE-SCREENER — test du mécanisme de capture ===\n`);
  console.log(`Cible : ${url}`);
  const result = await captureOnce(url, outPath);
  if (result.ok) {
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
