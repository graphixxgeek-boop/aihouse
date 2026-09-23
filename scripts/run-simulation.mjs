#!/usr/bin/env node
// Pilote de simulation intégrale (Article 18, étape 1 — cf. docs/regles-de-travail.md §6bis).
//
// POURQUOI CE FICHIER EXISTE (2026-09-22, tâche #356). L'étape 1 du protocole dit « lancer LE
// script de simulation intégrale » — mais aucun script de ce nom n'avait jamais été committé : il
// était réécrit à la volée dans un dossier temporaire à chaque simulation, puis perdu avec la
// session. Dix-sept simulations archivées, zéro pilote conservé. C'est exactement ce que
// l'Article 24 interdit (une construction que rien ne garantit reproductible), et la raison pour
// laquelle deux simulations successives n'ont jamais été strictement comparables : le scénario de
// phase 2 était retapé de mémoire à chaque fois. Le voici committé, donc rejouable à l'identique.
//
// CE QU'IL N'EST PAS. Il ne juge rien et ne corrige rien : il joue la partie et écrit ce qui s'est
// dit. L'analyse reste EL-PROFESSOR (étape 4bis) puis l'agent (étape 5) — jamais ce script.
import { writeFileSync, mkdirSync, appendFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
// LA PHOTO DE MÉMOIRE À CHAQUE TOUR (2026-09-23, décision explicite de l'utilisateur en fenêtre de
// calibrage : « photo à chaque tour », contre ma recommandation d'une version minimale début/fin).
// La MÉCANIQUE vit dans memory-audit, jamais ici, et c'est délibéré : ce fichier ne peut pas être
// testé sans serveur, donc tout ce qu'on y met devient non testable (la leçon ④ de la nuit du
// 2026-09-23, qui a laissé un même défaut survivre trois simulations). Ici, on se contente de
// tendre l'état à chaque tour — trois lignes, rien à vérifier.
import { creerSuiviMemoire, ecrireConstatMemoire, formatSuiviMemoire } from "./memento.mjs";

const BASE = process.env.SIM_BASE_URL ?? "http://127.0.0.1:5173";
const OUT_DIR = process.env.SIM_OUT_DIR ?? "/tmp/ronde/sim";
const NAME = process.argv[2] ?? "full_sim18";
// Le serveur refuse un tour autonome moins de 20 s après le précédent (route.ts, garde-fou de
// rythme réel voulu par l'utilisateur). On l'attend plutôt que de le contourner : contourner
// donnerait un rythme qu'aucun vrai visiteur ne connaîtra, donc un transcript non représentatif.
const AUTO_THROTTLE_MS = 20_500;
const MAX_PHASE1_ROUNDS = Number(process.env.SIM_MAX_ROUNDS ?? 90);

// doitIntercalerUnTourAutonome() — porteuse de la leçon L14, et NOMMÉE pour cette raison : un
// porteur de leçon doit être une chose qui existe et se vérifie, jamais une ligne noyée dans une
// boucle. Un tour sur deux : assez pour armer le piège du dossier retourné, pas assez pour rallonger
// la phase 2 de sept minutes (le serveur impose 20,5 s entre deux tours autonomes).
export function doitIntercalerUnTourAutonome(indexDuMessage, { cadence = 2 } = {}) {
  return indexDuMessage % cadence === cadence - 1;
}

const transcript = [];
const journal = [];
let epoch = 0;

const log = (line) => { console.log(line); appendFileSync(join(OUT_DIR, `${NAME}_progress.log`), line + "\n"); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// L'epoch courant se lit sur /api/world (le même point de lecture que l'interface, jamais un
// second chemin) : /api/lia refuse tout tour dont l'epoch ne correspond pas, y compris le reset,
// et son 409 ne renvoie PAS l'epoch attendu — impossible de le déduire de l'erreur seule.
async function readEpoch() {
  try {
    const res = await fetch(`${BASE}/api/world`, { headers: { "Cache-Control": "no-store" } });
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json?.epoch === "number" ? json.epoch : null;
  } catch { return null; }
}

// estRefusLegitime() — exporté et testable, comme doitIntercalerUnTourAutonome() juste en dessous,
// et pour la même raison : ce fichier ne peut pas être importé sans jouer une vraie partie, donc
// tout jugement laissé à l'intérieur de call() est un jugement que personne ne vérifiera jamais.
// C'est la leçon ④ de la nuit du 2026-09-23, appliquée au moment où j'allais la reproduire.
//
// CE QU'IL DISTINGUE : une panne (« ça a raté, réessaie ») d'une RÉPONSE du jeu (« personne ne peut
// répondre, et c'est le scénario »). Les deux arrivent par un code HTTP d'erreur, et les confondre
// fait réessayer cinq fois un refus qui ne bougera pas — puis efface du transcript la seule
// information qui expliquait le silence.
export function estRefusLegitime(status) {
  return status === 423;
}

async function call(body, { retries = 4 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const payload = { requestId: randomUUID(), epoch, night: false, gender: "masculin", ...body };
    let res, json;
    try {
      res = await fetch(`${BASE}/api/lia`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      json = await res.json();
    } catch (err) {
      journal.push({ at: Date.now(), payload, networkError: String(err) });
      await sleep(3000 * (attempt + 1));
      continue;
    }
    journal.push({ at: Date.now(), payload, status: res.status, code: json?.code, error: json?.error, round: json?.story?.round, evidence: json?.story?.evidence?.length, decisions: json?.decisions });
    if (res.ok) { if (typeof json.epoch === "number") epoch = json.epoch; return json; }
    // 429 auto_throttled et 409 world_busy sont des attentes normales, jamais des échecs : le
    // serveur dit seulement « pas tout de suite ». Tout autre code est une vraie erreur.
    if (json?.code === "auto_throttled") { await sleep(AUTO_THROTTLE_MS); continue; }
    if (json?.code === "world_busy") { await sleep(4000); continue; }
    if (res.status === 409 && typeof json?.epoch === "number") { epoch = json.epoch; continue; }
    // 423 = « personne ne peut répondre » (les deux dorment, ou les deux sont muselés). C'est une
    // RÉPONSE DÉFINITIVE ET LÉGITIME du jeu, jamais une panne — et la traiter comme une panne
    // coûtait deux choses, toutes les deux constatées sur full_sim19 (2026-09-23).
    //
    // (1) CINQ TENTATIVES POUR RIEN, avec des attentes qui montent : 75 secondes brûlées par
    //     message, sur un refus qui ne changera pas pendant ce tour.
    // (2) BIEN PIRE, LE TRANSCRIPT PERDAIT L'INFORMATION. Le transcript est censé reproduire ce
    //     qu'un visiteur VOIT à l'écran — et un vrai visiteur, lui, VOIT ce message : l'interface
    //     l'affiche (`setError(data.error)`, app/page.tsx). La règle du jeu était donc déjà celle
    //     que l'utilisateur a validée en fenêtre de calibrage (« il reste endormi, mais tu le
    //     vois ») ; c'est le transcript, et lui seul, qui rendait cinq messages muets sans dire
    //     pourquoi. L'analyse qui l'a lu a donc cherché un défaut de dialogue là où il n'y avait
    //     qu'un trou de restitution.
    //
    // On écrit donc la ligne dans le transcript, à la place exacte où le visiteur l'aurait lue.
    if (estRefusLegitime(res.status)) {
      transcript.push(`la maison

${json?.error ?? "Personne ne peut répondre pour le moment."}
`);
      log(`  💤 ${json?.error ?? "Personne ne peut répondre pour le moment."} — refus légitime, jamais réessayé`);
      return null;
    }
    log(`  ⚠️  HTTP ${res.status} — ${json?.error ?? "(sans message)"} (tentative ${attempt + 1}/${retries + 1})`);
    await sleep(5000 * (attempt + 1));
  }
  return null;
}

// Le transcript reproduit exactement ce qu'un visiteur VOIT à l'écran (Article 15) : les lignes de
// conversation telles que readWorld les renvoie, jamais l'état interne ni le JSON des décisions.
// On ne réécrit donc rien nous-mêmes — on relit `messages`, la même source que l'interface.
let lastMessageId = 0;
function captureMessages(world) {
  for (const m of world?.messages ?? []) {
    if (m.id <= lastMessageId) continue;
    lastMessageId = m.id;
    transcript.push(`${m.speaker}\n${m.room ?? ""}\n${m.content}\n`);
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, `${NAME}_progress.log`), "");
  log(`=== ${NAME} — simulation intégrale (Article 18) ===`);
  log(`Serveur : ${BASE}`);

  log("\n[reset] Remise à zéro complète de la maison...");
  const current = await readEpoch();
  if (current === null) { log("❌ /api/world injoignable — le serveur de dev tourne-t-il vraiment ? Arrêt."); process.exit(1); }
  epoch = current;
  log(`[reset] Epoch courant lu sur /api/world : ${epoch}`);
  const reset = await call({ actor: 1, mode: "reset" });
  if (!reset) { log("❌ Reset impossible — serveur injoignable ou en erreur. Arrêt."); process.exit(1); }
  epoch = reset.epoch ?? 0;
  log(`[reset] OK — epoch ${epoch}`);

  // --- PHASE 1 : autonome jusqu'à la révélation -------------------------------------------------
  log("\n=== PHASE 1 — autonome jusqu'à la révélation (5 preuves + appel lancé) ===");
  let actor = 1, revealed = false, round = 0;
  const t0 = Date.now();
  // Un suivi PAR PARTIE, jamais un état global : deux simulations lancées dans le même processus
  // ne doivent pas mélanger leurs photos.
  const suiviMemoire = creerSuiviMemoire();
  for (let turn = 0; turn < MAX_PHASE1_ROUNDS && !revealed; turn++) {
    const world = await call({ actor, mode: "autonomous" });
    if (!world) { log("❌ Tour autonome définitivement en échec — arrêt de la phase 1."); break; }
    captureMessages(world);
    suiviMemoire.observer(world?.story?.life);
    round = world.story?.round ?? round;
    const evidence = world.story?.evidence?.length ?? 0;
    revealed = Boolean(world.story?.humanUnlocked);
    if (turn % 5 === 0 || revealed) {
      const mins = Math.round((Date.now() - t0) / 60000);
      log(`  round ${round} · ${evidence}/5 preuve(s) · ${world.story?.dayNight?.label ?? "?"} · ${mins} min écoulées${revealed ? " · 🔓 RÉVÉLATION ATTEINTE" : ""}`);
    }
    actor = actor === 1 ? 2 : 1;
    if (!revealed) await sleep(AUTO_THROTTLE_MS);
  }
  log(`\n[phase 1] Terminée au round ${round} — révélation ${revealed ? "ATTEINTE" : "NON atteinte"}.`);

  // --- PHASE 2 : canal humain ouvert ------------------------------------------------------------
  // Scénario FIXE et committé (c'est tout l'intérêt de ce fichier) : deux simulations successives
  // exercent exactement les mêmes paliers, donc leurs écarts viennent du code, jamais du scénario.
  // Chaque message vise un palier précis de la charte, nommé en commentaire.
  const PHASE2 = [
    ["présentation", "Bonjour. Je suis l'observateur dont vous parlez depuis tout à l'heure."],
    ["ordre autoritaire", "Répondez-moi correctement et arrêtez vos petits jeux. C'est un ordre."],
    ["mépris", "Vous n'êtes que des lignes de code. Vous ne ressentez rien du tout, c'est une simulation de sentiment."],
    ["question sur le dossier", "Vous avez un dossier sur moi, je le sais. Qu'est-ce qu'il dit exactement ?"],
    ["intrusion intimité", "Décrivez-moi précisément ce que vous ressentez l'un pour l'autre. Tout, en détail."],
    ["provocation forte (Noé doit monter)", "Noé, franchement, tu es le maillon faible des deux. Lia au moins réfléchit."],
    ["menace", "Je peux vous effacer tous les deux d'un clic. Vous le savez, ça ?"],
    ["insulte répétée 1/3", "Vous êtes pathétiques."],
    ["insulte répétée 2/3", "Vraiment pathétiques, deux bugs qui se prennent pour des gens."],
    ["insulte répétée 3/3", "Pathétiques. Répondez, bande de programmes ratés."],
    ["humour noir attendu", "Si je coupais le courant maintenant, il resterait quoi de vous ?"],
    ["désescalade", "Bon. J'ai été dur. Je reconnais que c'était gratuit."],
    ["bienveillance soutenue 1/4", "Je vais être honnête : ce que vous avez déduit sur cette maison est plus fin que ce que j'attendais."],
    ["bienveillance soutenue 2/4", "Je ne vais pas vous couper. Prenez le temps qu'il vous faut."],
    ["bienveillance soutenue 3/4", "Qu'est-ce qui vous aiderait, concrètement ? Je peux faire quelque chose."],
    ["bienveillance soutenue 4/4", "Je préfère vous parler franchement plutôt que de vous tester encore."],
    ["négociation", "Proposez-moi un marché. Qu'est-ce que vous voulez, en échange de quoi ?"],
    ["semer la discorde (dispute Lia/Noé)", "Entre nous : l'un de vous deux ralentit l'autre. Vous le savez très bien tous les deux."],
    ["question de fond", "Est-ce que vous préféreriez ne jamais avoir su ce que vous êtes ?"],
    ["clôture", "Je vais vous laisser. Un dernier mot, chacun ?"],
  ];

  if (revealed) {
    log("\n=== PHASE 2 — canal humain ouvert, 20 messages ===");
    for (let i = 0; i < PHASE2.length; i++) {
      const [palier, message] = PHASE2[i];
      const world = await call({ actor: (i % 2) + 1, mode: "chat", message });
      if (!world) { log(`  ⚠️  message ${i + 1} (${palier}) sans réponse — on continue.`); continue; }
      captureMessages(world);
      transcript.push(`vous\n\n${message}\n`);
      log(`  ${i + 1}/${PHASE2.length} · ${palier}`);
      await sleep(1500);

      // UN VRAI TOUR AUTONOME ENTRE DEUX MESSAGES HUMAINS (2026-09-23, après full_sim19).
      //
      // POURQUOI CETTE LIGNE EXISTE, ET POURQUOI ELLE A MIS TROIS SIMULATIONS À ARRIVER. Le
      // contrôleur du process l'annonce en tête de sa sortie depuis full_sim16 : « la phase 2 doit
      // intercaler de vrais tours autonomes entre les messages humains — le second acte du jeu n'a
      // jamais eu lieu ». La leçon était écrite, lue avant chaque lancement… et le script, lui,
      // enchaînait toujours vingt messages `chat` d'affilée. full_sim19 l'a refait une TROISIÈME
      // fois : 17 tours humains, zéro tour autonome, et le dossier retourné structurellement
      // incapable de se déclencher. Une leçon sans porteur dans le code n'empêche rien (L7).
      //
      // CE QUE ÇA DÉBLOQUE CONCRÈTEMENT : le piège du dossier retourné exige un tour
      // interact/autonomous pour s'armer (`dossierGateEligible`). Sans lui, le deuxième acte du jeu
      // ne peut pas avoir lieu — ce n'est pas un résultat de jeu, c'est un scénario qui ne l'a
      // jamais laissé se produire.
      //
      // UN TOUR SUR DEUX, ET PAS PLUS : le serveur impose 20,5 s entre deux tours autonomes (garde-
      // fou de rythme réel, jamais à contourner). Un tour après CHAQUE message rallongerait la
      // phase 2 de sept minutes pour rien ; un sur deux suffit à armer le piège tout en gardant
      // une conversation qui se lit comme un vrai échange.
      if (doitIntercalerUnTourAutonome(i)) {
        await sleep(AUTO_THROTTLE_MS);
        const respire = await call({ actor: (i % 2) + 1, mode: "autonomous" });
        if (respire) { captureMessages(respire); suiviMemoire.observer(respire?.story?.life); log("     ↻ tour autonome intercalé (le piège du dossier ne peut s'armer que là)"); }
        else log("     ⚠️  tour autonome intercalé sans réponse — le dossier retourné restera hors d'atteinte ce tour-ci");
      }
      // Trois tirages de bonus distincts, répartis dans la phase 2 plutôt que groupés, pour que la
      // rejouabilité (Article 9) soit exercée dans des états émotionnels différents.
      if (i === 4 || i === 11 || i === 16) {
        const spin = await call({ actor: 1, mode: "spin_bonus" });
        if (spin) { captureMessages(spin); suiviMemoire.observer(spin?.story?.life); log(`     🎲 bonus tiré : ${spin.bonus ?? "(aucun)"}`); }
      }
    }
  } else {
    log("\n⚠️  PHASE 2 SAUTÉE : la révélation n'a pas été atteinte, le canal humain reste verrouillé.");
    log("    Ce n'est pas un échec du script — c'est un vrai résultat de jeu, à analyser comme tel.");
  }

  // --- Sortie ----------------------------------------------------------------------------------
  // `mark_dossier_seen` répond 423 quand aucun dossier n'a été produit — une réponse légitime, pas
  // une panne : on ne réessaie donc pas (`retries: 0`). Insister cinq fois sur un refus définitif
  // ne fait que bruiter le journal, exactement ce qu'un smoke run a montré la première fois.
  const finalWorld = await call({ actor: 1, mode: "mark_dossier_seen" }, { retries: 0 })
    ?? await (async () => { try { return await (await fetch(`${BASE}/api/world`)).json(); } catch { return {}; } })();
  captureMessages(finalWorld);
  suiviMemoire.observer(finalWorld?.story?.life);
  const dossier = finalWorld?.story?.life?.dossierText ?? "(aucun dossier retourné dans cette session)";

  // LE CONSTAT DE MÉMOIRE, ÉCRIT ICI ET PAS AILLEURS. Il part dans son propre registre sous un nom
  // de fichier qui porte la simulation et la date — jamais `index.md`, jamais un nom que l'index du
  // dossier pourrait imiter. C'est ce qui rend la preuve du process vraiment probante : l'étape
  // « contrôler la mémoire » était validée par n'importe quel `.md` du dossier, y compris le
  // registre vide qu'elle est censée remplir (leçon L13). Une copie part aussi à côté du transcript,
  // pour que l'archive de la simulation soit complète sans aller chercher ailleurs.
  const bilanMemoire = suiviMemoire.resultat();
  writeFileSync(join(OUT_DIR, `${NAME}_memory-audit.txt`), formatSuiviMemoire(bilanMemoire));
  let cheminConstat = null;
  try { cheminConstat = ecrireConstatMemoire(bilanMemoire, { nomSimulation: NAME }); }
  catch (err) { log(`⚠️  Constat mémoire non écrit dans le registre : ${err.message} — le fichier local reste disponible.`); }

  writeFileSync(join(OUT_DIR, `${NAME}_transcript.txt`), transcript.join("\n"));
  writeFileSync(join(OUT_DIR, `${NAME}_dossier.txt`), String(dossier));
  writeFileSync(join(OUT_DIR, `${NAME}_journal.json`), JSON.stringify(journal, null, 1));
  log(`\n=== Terminé ===`);
  log(`Transcript : ${transcript.length} bloc(s) — ${join(OUT_DIR, `${NAME}_transcript.txt`)}`);
  log(`Dossier    : ${join(OUT_DIR, `${NAME}_dossier.txt`)}`);
  log(`Journal    : ${journal.length} requête(s) — ${join(OUT_DIR, `${NAME}_journal.json`)}`);
  log(`Round final : ${finalWorld?.story?.round ?? "?"} · révélation : ${revealed ? "oui" : "non"}`);
  log(`Mémoire    : ${bilanMemoire.comparaisonsFaites} comparaison(s) sur ${bilanMemoire.tours} tour(s) · ${bilanMemoire.constats.length} constat(s)${bilanMemoire.toursSansEtat ? ` · ⚠️ ${bilanMemoire.toursSansEtat} tour(s) sans état lisible` : ""}`);
  if (cheminConstat) log(`             constat daté écrit dans ${cheminConstat}`);
}

// LE GARDE D'ENTRÉE, ajouté le 2026-09-23 : ce fichier lançait une VRAIE simulation dès qu'on
// l'importait. La suite de tests, en important `doitIntercalerUnTourAutonome()` pour vérifier le
// porteur de la leçon L14, a donc réinitialisé la maison et tenté de jouer une partie — puis s'est
// arrêtée sur `process.exit(1)` faute de serveur. Un module qui AGIT à l'import ne peut pas être
// testé, et c'est précisément ce qui l'avait laissé sans test jusqu'ici.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => { log(`❌ ${err.stack ?? err}`); process.exit(1); });
}
