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
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

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
}

if (import.meta.url === `file://${process.argv[1]}`) main();
