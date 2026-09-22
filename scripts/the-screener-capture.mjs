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
    // VISITEUR QUI REVIENT, PAS VISITEUR NEUF (2026-09-22, seconde passe — la première correction
    // supposait que seule la popup de pseudo bloquait, et une capture prise en phase 2, observateur
    // bien posé, restait pourtant masquée). Trois fenêtres modales partagent la classe
    // `.nickname-overlay` : la reprise de partie, le pseudo, et l'avertissement légal. Ce dernier ne
    // dépend pas de l'état du jeu mais de la MÉMOIRE DU NAVIGATEUR (`maison-disclaimer-accepted`,
    // `maison-welcome-seen`, app/page.tsx) — un navigateur Playwright neuf les a toujours.
    // On pré-pose donc ces deux drapeaux avant de charger : c'est exactement l'état d'un visiteur
    // déjà venu une fois, jamais un contournement, et ça ne touche rien côté serveur — l'alternative
    // (remplir le pseudo) poserait un observateur au milieu d'une partie en cours.
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("maison-disclaimer-accepted", "1");
        window.localStorage.setItem("maison-welcome-seen", "1");
      } catch { /* navigation privée ou stockage bloqué : on capture quand même, le diagnostic le dira */ }
    });
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
    // TENTÉ ET RETIRÉ le 2026-09-22 : cliquer « Conserver l'histoire » (un bouton purement local,
    // qui ne fait que refermer la fenêtre) pour dégager la vue. Le clic n'a PAS suffi en conditions
    // réelles — la fenêtre restait détectée juste après. Code spéculatif qui ne tient pas sa
    // promesse retiré plutôt que laissé en place : mieux vaut un outil qui dit honnêtement « masqué »
    // qu'un outil qui prétend avoir dégagé la vue sans l'avoir fait. Reste à trancher avec
    // l'utilisateur (cf. rapport de nuit) : la bonne réponse est peut-être côté APPLICATION — un
    // paramètre d'URL d'observation qui n'ouvre aucune fenêtre modale — plutôt que côté capture.
    const overlay = await page.locator(".nickname-overlay").count().catch(() => 0);
    await page.screenshot({ path: outPath });
    if (overlay > 0) {
      // Le diagnostic NOMME la fenêtre trouvée plutôt que de lister les trois possibles : la
      // première version disait « pseudo, avertissement ou reprise » et envoyait chercher la mauvaise
      // (c'était l'avertissement légal, pas le pseudo, qui bloquait encore en phase 2).
      const titre = await page.locator(".nickname-overlay h2").first().textContent().catch(() => null);
      return { ok: true, path: outPath, masque: true, raison: `la fenêtre « ${titre?.trim() ?? "?"} » couvre la scène — l'image est prise, mais il n'y a rien de graphique à y noter. Les drapeaux de navigateur (avertissement, accueil) sont déjà posés : si une fenêtre bloque encore, c'est qu'elle dépend de l'ÉTAT DU JEU (pseudo tant que la partie n'a pas d'observateur, reprise de partie), pas du navigateur.` };
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
