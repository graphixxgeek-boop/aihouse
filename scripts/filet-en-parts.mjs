// ICEBERG: membre
// FILET-EN-PARTS (2026-09-27, tâche #1041) — lancer le filet de sécurité en plusieurs parts
// simultanées au lieu d'une seule suite qui se déroule du début à la fin.
//
// POURQUOI IL EXISTE, ET POURQUOI SEULEMENT MAINTENANT. Le chantier d'allègement du filet a
// descendu 105,7 s à 65,4 s en trois marches (décor partagé #1036, dates de git #1038, décor
// étendu #1040), toutes à protection strictement égale. La troisième a mesuré le plafond de cette
// technique-là : le disque ne coûtait presque rien, le temps restant est du CALCUL. Contre du
// calcul, il n'y a qu'un levier — faire calculer plusieurs processeurs à la fois.
//
// IL NE MODIFIE JAMAIS LE FILET, et c'est la décision de conception la plus importante ici.
// L'utilisateur l'a posée en une phrase le jour même : « travaille soigneusement, pas trop vite,
// souviens-toi qu'on touche à un fichier sensible ». Ce runner LIT `check-house.mjs` et écrit des
// COPIES dérivées ; le fichier d'origine n'est pas touché d'une ligne. Le mode d'avant reste donc
// disponible à tout instant (`node scripts/check-house.mjs`), ce qui est la seule façon de savoir,
// le jour où une part échoue, si la faute est au code ou au parallélisme (son arbitrage : « oui,
// gardé et lançable »).
//
// CE QUI PEUT ÊTRE SÉPARÉ, ET CE QUI REFUSE — mesuré par Ezechiel AVANT d'écrire ce fichier
// (`obstaclesAuParallele`, son arbitrage « Ezechiel cherche d'abord ») :
//   · 156 blocs de niveau zéro (`{` … `}` en colonne 0) sont autonomes : chacun importe ce dont il
//     a besoin et n'écrit nulle part où un autre écrit. Zéro collision sur un chemin lisible.
//   · TOUT LE RESTE est une ÉPINE PARTAGÉE : le préambule (transpilation des 22 modules du jeu,
//     base SQLite en mémoire, import de la route) et ~70 tests écrits au niveau du fichier qui
//     font AVANCER cet état commun. On ne les sépare pas : on les rejoue dans chaque part.
//
// LE PRIX DE CETTE PRUDENCE EST CONNU ET CHIFFRÉ, jamais caché : l'épine vaut 18,6 s des 65,4 s,
// et chaque part la repaye. C'est ce qui fixe le plancher — 4 parts donnent ~30 s, pas ~16 s.
// Le dire vaut mieux que d'annoncer une division par quatre qui n'arrivera pas.
//
// LES NUMÉROS DE LIGNE SONT PRÉSERVÉS À L'IDENTIQUE : un bloc retiré d'une part est remplacé par
// autant de lignes vides. Sans ça, la première erreur d'un test aurait renvoyé vers une ligne qui
// n'existe pas dans le vrai fichier — un runner qui fait mentir les messages d'erreur coûte plus
// cher que les secondes qu'il fait gagner.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { cpus } from "node:os";
import { TOUCHES_L_ETAT_COMMUN, filetResolu } from "./ezechiel-les-tests.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReportHeader } from "./report-template.mjs";

// MÊME DÉFAUT QUE CELUI D'EZECHIEL, CORRIGÉ POUR LA CLASSE ET PAS POUR L'OCCURRENCE (leçon L37) :
// un chemin de CE dépôt écrit en constante rendrait ce runner inutilisable ailleurs. La détection
// n'est pas réécrite ici, elle est IMPORTÉE d'Ezechiel (Article 24 : un registre se lit, il ne se
// recopie pas) — le jour où Ezechiel apprend une piste de plus, ce runner en hérite sans qu'on y
// touche. Ce qui reste ci-dessous est le dernier recours, jamais la vérité.
export const FILET = "scripts/check-house.mjs";
export const MESURES = "docs/ezechiel-les-tests/mesures.json";
export const PARTS_PAR_DEFAUT = 4;
const ROOT = new URL("..", import.meta.url).pathname;

// --- Le découpage : ce qui est déplaçable, et ce qui ne l'est pas ------------------------------
// Un bloc de niveau zéro s'ouvre par une accolade SEULE en colonne 0 et se ferme pareil. C'est une
// convention que ce fichier respecte sur ses 156 blocs, et elle est vérifiable mécaniquement — pas
// une supposition : tout ce qui n'entre pas dans cette forme reste dans l'épine, donc rejoué
// partout, donc jamais perdu. Se tromper ici coûte du temps, jamais un test.
// LE DÉFAUT DU PREMIER LANCEMENT RÉEL, ET C'EST LA LEÇON L39 VÉRIFIÉE SUR SON AUTEUR : « un
// détecteur qui compte une profondeur est faux jusqu'à preuve du contraire ». La première version
// prenait la PREMIÈRE accolade fermante comme fin du bloc. Or ce fichier contient un bloc imbriqué
// ouvert lui aussi en colonne 0 (ligne 958) : le bloc était donc coupé trop tôt, et la vraie
// fermeture restait orpheline — `SyntaxError: Unexpected token '}'` au premier essai. On compte la
// profondeur, et un bloc ne se ferme que quand elle revient à zéro.
export function blocsDeNiveauZero(src = "") {
  const lignes = String(src).split("\n");
  const blocs = [];
  let debut = null, profondeur = 0;
  for (let i = 0; i < lignes.length; i++) {
    if (lignes[i] === "{") { if (debut === null) { debut = i + 1; profondeur = 1; } else profondeur++; }
    else if (lignes[i] === "}" && debut !== null) { profondeur--; if (profondeur === 0) { blocs.push({ debut, fin: i + 1 }); debut = null; } }
  }
  // UNE OUVERTURE JAMAIS REFERMÉE N'EST PAS UN BLOC : la rendre quand même produirait une part
  // tronquée au milieu d'une expression, c'est-à-dire un échec qui ressemblerait à un vrai.
  return blocs;
}

// LE SOCLE : ce qu'aucune part ne peut se permettre de ne pas jouer -----------------------------
// LE PREMIER LANCEMENT RÉEL A RETOURNÉ MON HYPOTHÈSE, et c'est la trouvaille la plus utile de ce
// chantier. Je croyais que les blocs dépendaient de l'épine ; c'est AUSSI L'INVERSE. Un bloc qui
// réassigne `world` (ou fait avancer la base) laisse un état dont un test du niveau du fichier
// dépend plus bas. Le blanchir faisait échouer une assertion parfaitement saine — un faux rouge,
// qui est exactement le genre de panne qui discrédite un outil neuf.
// LA RÈGLE QUI EN DÉCOULE : un bloc qui touche l'état commun n'est pas déplaçable, il est DU SOCLE,
// et le socle se rejoue dans chaque part. Mesuré : ces 41 blocs ne coûtent que 0,9 s, donc la
// prudence est quasiment gratuite — et l'inverse aurait coûté un faux rouge par lancement.
// LE MOTIF NE SE RECOPIE PAS, il s'importe d'Ezechiel (Article 24) : le jour où il apprend un nom
// de plus, ce runner en hérite sans qu'on y touche.
export function blocEstDuSocle(src = "", bloc = {}) {
  const lignes = String(src).split("\n");
  return TOUCHES_L_ETAT_COMMUN.test(lignes.slice(bloc.debut - 1, bloc.fin).join("\n"));
}

export function separerSocleEtDeplacables(src = "", blocs = []) {
  const socle = [], deplacables = [];
  for (const b of blocs) (blocEstDuSocle(src, b) ? socle : deplacables).push(b);
  return { socle, deplacables };
}

export function poidsDesBlocs(blocs = [], mesures = []) {
  return blocs.map((b) => ({
    ...b,
    ms: mesures.filter((m) => m.ligne >= b.debut && m.ligne <= b.fin).reduce((s, m) => s + (m.ms ?? 0), 0),
  }));
}

// LES PLUS LOURDS D'ABORD, et ce n'est pas une préférence : c'est le résultat classique du
// remplissage de sacs (« longest processing time first »). Placer un bloc de 6 s en dernier oblige
// une part à l'attendre seule ; le placer en premier laisse aux petits le soin d'égaliser. La
// littérature du domaine le donne comme le gain le plus simple à prendre sur une suite parallèle.
// LE REPLI À L'AVEUGLE, TROUVÉ PAR LE PROJET TÉMOIN (2026-09-27). Sur un dépôt sans relevé de
// durées, TOUS les blocs pèsent zéro : le remplissage de sacs prend alors systématiquement la
// première part (elle est toujours « la moins chargée », à égalité), et le témoin l'a montré en
// clair — 120 blocs dans la part 1, ZÉRO dans les trois autres. La parallélisation ne parallélisait
// plus rien, en silence, et personne ne l'aurait vu ici où les mesures existent toujours.
// SANS POIDS, ON RÉPARTIT AU NOMBRE, et le rapport le dit déjà en toutes lettres.
export function repartir(blocs = [], combien = PARTS_PAR_DEFAUT) {
  const parts = Array.from({ length: Math.max(1, combien) }, () => ({ blocs: [], ms: 0 }));
  const aveugle = blocs.every((b) => !(b.ms > 0));
  if (aveugle) {
    [...blocs].sort((x, y) => x.debut - y.debut).forEach((b, i) => parts[i % parts.length].blocs.push(b));
    for (const p of parts) p.blocs.sort((x, y) => x.debut - y.debut);
    return parts;
  }
  for (const b of [...blocs].sort((x, y) => (y.ms ?? 0) - (x.ms ?? 0))) {
    const p = parts.reduce((a, c) => (c.ms < a.ms ? c : a));
    p.blocs.push(b); p.ms += b.ms ?? 0;
  }
  for (const p of parts) p.blocs.sort((x, y) => x.debut - y.debut);
  return parts;
}

// --- La génération d'une part : même fichier, blocs des autres remplacés par du vide -----------
// LA SUBSTITUTION DU DOSSIER DE TRAVAIL NE PORTE QUE SUR LE PRÉAMBULE, et c'est délibéré : le
// préambule écrit puis relit les 22 modules du jeu transpilés dans `.sites-runtime/`. Quatre
// processus qui écrivent les mêmes fichiers en même temps, c'est exactement la panne qu'on cherche
// à éviter — chacun a donc son propre sous-dossier. Plus bas dans le fichier, les blocs ont leurs
// propres dossiers temporaires ; comme un bloc donné ne tourne que dans UNE part, ils ne peuvent
// pas se rencontrer, et les toucher aurait cassé des assertions qui citent ces chemins.
export function genererLaPart(src = "", blocsGardes = [], { numero = 1, finDuPreambule = 0 } = {}) {
  const lignes = String(src).split("\n");
  const tousLesBlocs = blocsDeNiveauZero(src);
  const garde = new Set();
  for (const b of [...blocsGardes, ...separerSocleEtDeplacables(src, tousLesBlocs).socle]) for (let n = b.debut; n <= b.fin; n++) garde.add(n);
  const sortie = lignes.map((l, i) => {
    const n = i + 1;
    const dansUnBloc = tousLesBlocs.some((b) => n >= b.debut && n <= b.fin);
    return dansUnBloc && !garde.has(n) ? "" : l;
  });
  // LE DÉFAUT LE PLUS GRAVE DE CE RUNNER, ET IL ÉTAIT SILENCIEUX (2026-09-27, quatrième lancement
  // réel). La substitution ne portait d'abord que sur le préambule, parce que c'est lui qui écrit
  // les modules du jeu transpilés. Mais des BLOCS les réimportent plus bas — et eux pointaient
  // toujours vers le dossier commun. Résultat : une part testait la version transpilée d'un
  // lancement PRÉCÉDENT. Tant que le code du jeu ne bougeait pas, ça passait inaperçu ; à la
  // première modification de `lib/gemini-keys.ts`, la part a crié « fonction inconnue » sur une
  // fonction qui existait bel et bien. UN TEST QUI PASSE SUR UNE COPIE PÉRIMÉE EST PIRE QU'UN TEST
  // QUI ÉCHOUE : il rend un vert sur du code que personne n'exécute.
  // LA SUBSTITUTION VISE DONC `.sites-runtime/test-`, PARTOUT DANS LE FICHIER, et rien d'autre :
  // c'est exactement le préfixe des modules transpilés, et laisser les autres chemins tranquilles
  // évite de casser les assertions qui citent un dossier de couverture par son nom littéral.
  const sortieTexte = sortie.join("\n").replaceAll(".sites-runtime/test-", `.sites-runtime/p${numero}/test-`);
  const lignesFinales = sortieTexte.split("\n");
  for (let i = 0; i < Math.min(finDuPreambule, lignesFinales.length); i++) {
    lignesFinales[i] = lignesFinales[i].replaceAll("'.sites-runtime'", `'.sites-runtime/p${numero}'`);
  }
  return lignesFinales.join("\n");
}

// --- La remise en ordre : ce que l'utilisateur voit à la fin ------------------------------------
// SON ARBITRAGE, MOT POUR MOT : « ordre d'origine à la fin ». En parallèle, les lignes arrivent
// mélangées et l'ordre change à chaque lancement ; les remettre dans l'ordre du fichier fait que
// rien ne change pour lui NI pour les outils qui relisent cette sortie — Ezechiel en tête, dont
// tout le chronométrage repose sur ce recollage.
// LES DOUBLONS SONT ATTENDUS, PAS UNE ANOMALIE : l'épine tourne dans chaque part, donc ses ~70
// lignes « Passed » sortent N fois. On garde la première et on compte les autres, plutôt que de
// les jeter en silence — un doublon inattendu voudrait dire qu'un bloc tourne deux fois, et c'est
// précisément ce qu'on veut voir si ça arrive.
export function recollerLesSorties(sorties = [], src = "") {
  const ordre = new Map();
  const lignesDuFilet = String(src).split("\n");
  let rang = 0;
  for (let i = 0; i < lignesDuFilet.length; i++) {
    const m = /console\.log\(\s*['"`]Passed\s*:\s*(.{0,40})/.exec(lignesDuFilet[i]);
    if (m) ordre.set(m[1].trim(), rang++);
  }
  // DEUX CLÉS, ET LES CONFONDRE FAISAIT DISPARAÎTRE UN SUCCÈS. La première version dédoublonnait sur
  // les 40 premiers caractères — le même raccourci qui sert à RETROUVER la ligne dans le fichier
  // source, où le texte imprimé peut contenir des valeurs calculées. Mesuré : deux tests du filet
  // partagent ces 40 caractères (« once the investigation is overdue (round »), donc le total annonçait
  // 298 succès là où le séquentiel en imprime 299. Un compteur qui perd une unité en silence est
  // exactement ce qu'on refuse ailleurs dans ce projet.
  // ON DÉDOUBLONNE DONC SUR LA LIGNE ENTIÈRE — deux lignes rigoureusement identiques sont le même
  // succès rejoué par une autre part, c'est le seul vrai doublon — ET ON ORDONNE sur le préfixe, qui
  // n'a pas besoin d'être unique : deux lignes qui le partagent se rangent simplement côte à côte.
  const vues = new Map();
  let doublons = 0;
  for (const s of sorties) {
    for (const l of String(s).split("\n")) {
      if (!/^Passed\s*:/.test(l)) continue;
      if (vues.has(l)) { doublons++; continue; }
      const prefixe = l.replace(/^Passed\s*:\s*/, "").slice(0, 40).trim();
      vues.set(l, { ligne: l, rang: ordre.get(prefixe) ?? Number.MAX_SAFE_INTEGER });
    }
  }
  const rangees = [...vues.values()].sort((a, b) => a.rang - b.rang).map((v) => v.ligne);
  return { lignes: rangees, doublons, inconnues: [...vues.values()].filter((v) => v.rang === Number.MAX_SAFE_INTEGER).length };
}

export function lancerUnePart(chemin, { env = {}, cwd = ROOT } = {}) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const enfant = spawn(process.execPath, [chemin], { cwd, env: { ...process.env, ...env } });
    let out = "", err = "";
    enfant.stdout.on("data", (d) => { out += d; });
    enfant.stderr.on("data", (d) => { err += d; });
    enfant.on("close", (code) => resolve({ chemin, code, out, err, ms: Date.now() - t0 }));
  });
}

async function main() {
  printReportHeader({ tool: "filet-en-parts", title: "FILET-EN-PARTS — le filet lancé en plusieurs parts simultanées", scriptPath: "scripts/filet-en-parts.mjs" });
  recordCliUsage("filet-en-parts");
  const combien = Number((process.argv.find((a) => a.startsWith("--parts=")) ?? "").split("=")[1]) || Math.min(PARTS_PAR_DEFAUT, cpus().length);
  const cheminDuFilet = filetResolu();
  console.log(`\nFilet : ${cheminDuFilet}`);
  const src = readFileSync(new URL(`../${cheminDuFilet}`, import.meta.url), "utf8");
  const blocs = blocsDeNiveauZero(src);
  const finDuPreambule = blocs[0] ? blocs[0].debut - 1 : 0;
  let mesures = [];
  try { mesures = JSON.parse(readFileSync(new URL(`../${MESURES}`, import.meta.url), "utf8")).mesures ?? []; } catch { /* pas de mesure : on répartit au nombre de blocs */ }
  const { socle, deplacables } = separerSocleEtDeplacables(src, blocs);
  const parts = repartir(poidsDesBlocs(deplacables, mesures), combien);

  console.log(`\n${blocs.length} bloc(s) au total · ${deplacables.length} déplaçable(s) · ${socle.length} du SOCLE (ils touchent l'état commun, rejoués dans chaque part avec le préambule, lignes 1 à ${finDuPreambule})`);
  if (!mesures.length) console.log("⚠️  aucune mesure de durée trouvée : la répartition se fait à l'aveugle, au nombre de blocs et non à leur poids — lancer `node scripts/ezechiel-les-tests.mjs sante` d'abord donnerait un équilibrage réel.");
  for (const [i, p] of parts.entries()) console.log(`  part ${i + 1} : ${String(p.blocs.length).padStart(3)} bloc(s), ${(p.ms / 1000).toFixed(1)} s de blocs attendus`);

  // LES PARTS NE VIVENT PAS DANS `scripts/`, ET C'EST LE DEUXIÈME DÉFAUT TROUVÉ AU LANCEMENT RÉEL.
  // Les y écrire semblait le plus simple (les imports du filet sont relatifs à ce dossier), et ça a
  // fait ÉCHOUER une part : SAFE-EXPORT balaie `scripts/`, y a vu quatre fichiers sans blueprint ni
  // fiche, et a compté cinq pièces manquantes. Un runner qui fait échouer le test qu'il lance est
  // pire qu'un runner lent. Les imports du filet sont en réalité relatifs à N'IMPORTE quel dossier
  // d'un seul niveau sous la racine (`../scripts/…`, `../.sites-runtime/…`) : `.sites-runtime/`
  // convient donc exactement, et il est déjà ignoré par git et par les outils.
  const dossier = new URL("../.sites-runtime/", import.meta.url);
  mkdirSync(dossier, { recursive: true });
  const chemins = parts.map((p, i) => {
    const chemin = new URL(`../.sites-runtime/filet-part-${i + 1}.mjs`, import.meta.url);
    writeFileSync(chemin, genererLaPart(src, p.blocs, { numero: i + 1, finDuPreambule }));
    return chemin.pathname;
  });

  const t0 = Date.now();
  const resultats = await Promise.all(chemins.map((c, i) => lancerUnePart(c, { env: { SITES_RUNTIME_ROOT: `${ROOT}.sites-runtime/p${i + 1}` } })));
  const total = Date.now() - t0;

  for (const c of chemins) { try { rmSync(c); } catch { /* déjà parti */ } }
  for (let i = 0; i < parts.length; i++) { try { rmSync(new URL(`../.sites-runtime/p${i + 1}`, import.meta.url), { recursive: true, force: true }); } catch { /* rien à nettoyer */ } }

  const recolle = recollerLesSorties(resultats.map((r) => r.out), src);
  for (const l of recolle.lignes) console.log(l);

  console.log("\n=== LES PARTS ===");
  for (const [i, r] of resultats.entries()) console.log(`  part ${i + 1} : ${r.code === 0 ? "✅" : "🚨 CODE " + r.code} en ${(r.ms / 1000).toFixed(1)} s`);
  console.log(`\nFilet en ${combien} parts terminé en ${(total / 1000).toFixed(1)} s · ${recolle.lignes.length} succès distincts · ${recolle.doublons} doublon(s) de l'épine (attendus).`);

  const rate = resultats.filter((r) => r.code !== 0);
  if (rate.length) {
    console.log(`\n🚨 ${rate.length} part(s) en échec. LE RÉFLEXE EST DE RELANCER À L'ANCIENNE avant de conclure :`);
    console.log("   node scripts/check-house.mjs");
    console.log("   Si le mode séquentiel est vert et le parallèle rouge, la faute est au parallélisme, jamais au code testé.");
    for (const r of rate) console.log((r.err || r.out).split("\n").slice(-12).join("\n"));
  }
  process.exit(rate.length ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
