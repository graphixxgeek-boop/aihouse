// ICEBERG: membre
// LES FILS DE DISCUSSION — un sujet, un fil ; et la réponse mécanique à « es-tu à jour ? »
// (2026-09-30, né de sa colère et elle était méritée).
//
// CE QUI L'A FAIT NAÎTRE, en une phrase : il est arrivé un soir, m'a demandé si j'étais à jour,
// et la réponse honnête était non — puis chaque correction que j'ai apportée contenait une
// nouvelle erreur. Sa conclusion : « il faut qu'on trouve un système qui te permette FACILEMENT
// de savoir si tu es à jour ».
//
// POURQUOI L'ANCIEN SYSTÈME N'EN ÉTAIT PAS UN. Ses demandes vivaient dans CINQ endroits sans
// autorité : ses fichiers, la conversation, le suivi (1 300 lignes), les idées à trancher, les
// plans d'action des rapports. « À jour » n'était défini nulle part. À chaque fois qu'il posait la
// question, j'improvisais un balayage — et une improvisation laisse des trous.
//
// L'ERREUR DE FOND, ET ELLE DICTE TOUTE LA CONCEPTION : je vérifiais « ce FICHIER a-t-il été
// lu ? » au lieu de « ce SUJET a-t-il été traité ? ». Le 2026-09-30 j'ai annoncé que le modèle de
// gouvernance n'avait jamais été lu : il était en ANNEXE de sa commande principale, lue
// intégralement deux jours plus tôt, et déjà analysée en profondeur. Le fichier est un signal
// ADJACENT ; le sujet est le signal visé (leçon L47).
//
// D'OÙ L'UNITÉ : LE SUJET, jamais le fichier, jamais la question isolée.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { printReportHeader, buildPlanDaction } from "./report-template.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

export const DOSSIER_FILS = "docs/fils";
export const CERVEAU = "docs/fils/index.md";
export const DOSSIER_SAISINES = "docs/grand-projet/00-sources/01-sa-demande";

// LES QUESTIONS QUI DÉFINISSENT « À JOUR ». Elles étaient quatre à la naissance de l'outil ; la
// cinquième est arrivée le soir même, et ce n'est pas un raffinement — c'est sa consigne, à la
// ligne 111 de ses réponses du 2026-09-30, retrouvée en mesurant la couverture de sa demande :
// « le format des questions doit toujours m'aider à répondre et/ou à prendre une décision de
// manière simple et FIABILISÉE [...] Note bien tout ça quelque part, pour la suite, équipe ou
// informe les outils si nécessaire. » Une consigne notée dans un document est une intention ;
// portée par un contrôle, elle mord. C'est exactement ce que l'Article 27 exige.
//
// LA RAISON QU'IL DONNE, ET ELLE EST CHIFFRABLE : « c'est là surtout qu'on perd du temps [...]
// si je ne comprends rien, ça crée un aller-retour ». Une question mal posée ne coûte pas une
// reformulation : elle coûte un cycle entier, et parfois un chantier refait sur un malentendu.
//
// Chacune est VÉRIFIABLE par une commande. C'est tout l'intérêt : « es-tu à jour ? » cesse d'être
// une impression pour devenir quatre oui/non. Une seule réponse « non » suffit à répondre NON à la
// question d'ensemble — un système qui répondrait « à peu près » ne servirait à rien.
export const LES_CONTROLES = Object.freeze([
  { cle: "saisines-deposees", question: "Tout ce qu'il m'a envoyé est-il dans le projet ?",
    sansQuoi: "une demande qui n'est pas dans les fichiers du projet n'est vérifiable par aucun outil — c'est ainsi que trois noms d'outils qu'il avait donnés ont été perdus" },
  { cle: "saisines-rattachees", question: "Chaque chose qu'il m'a envoyée est-elle rattachée à au moins un sujet ?",
    sansQuoi: "une saisine sans sujet est une saisine que personne ne rouvrira" },
  { cle: "fils-dates", question: "Chaque sujet dit-il à qui est la balle, et depuis quand ?",
    sansQuoi: "un sujet sans porteur ni date est un sujet dont personne ne sait s'il attend quelqu'un" },
  { cle: "fils-situes", question: "Chaque sujet dit-il où il se place dans la stratégie ?",
    sansQuoi: "un sujet hors du plan avance sans qu'on sache ce qu'il sert — et il se rediscute indéfiniment" },
  { cle: "questions-repondables", question: "Chaque question qui l'attend lui donne-t-elle de quoi répondre simplement ?",
    sansQuoi: "une question ouverte posée à quelqu'un qui n'est pas développeur se paie en aller-retours, jamais en reformulation : c'est le poste de perte de temps qu'il a lui-même désigné" },
  { cle: "engagements-en-taches", question: "Chaque chose que je me suis engagé à faire est-elle une TÂCHE qui existe vraiment ?",
    sansQuoi: "un engagement écrit dans un fil et nulle part ailleurs est une intention : personne ne le relira, aucun outil ne le comptera, et il aura l'air d'un travail en cours jusqu'à ce qu'on l'oublie" },
  // LE SEPTIÈME CONTRÔLE (2026-10-02, tâche #1483) — ET IL EXISTE PARCE QUE LES SIX AUTRES ONT
  // RENDU UN FAUX VERT SUR LA SEULE QUESTION QUI COMPTE.
  //
  // Son constat : « J'ai l'impression que les fils de discussion vegetent avec tes reponses […] tu
  // dois verifier si les fils ont bien été alimentés et que des fichiers ephemeres ne leur ont pas
  // ôté le pain de la bouche. » Mesuré le jour même : 180 documents créés ou modifiés dans docs/
  // depuis le dernier vrai mouvement d'un fil, dont 41 dans les dossiers qui lui sont destinés,
  // contre UN SEUL enregistrement touchant un fil — la fermeture d'une question morte.
  //
  // ET PENDANT CE TEMPS CET OUTIL RÉPONDAIT « 14/14 fils à jour ». Les six contrôles mesurent la
  // FORME d'un fil — a-t-il une date, dit-il à qui est la balle, ses engagements existent-ils en
  // tâches — et PAS UN SEUL ne demande s'il a reçu quelque chose. Un fil parfaitement formé et
  // mort depuis deux jours passait les six. C'est le faux vert posé exactement sur le mécanisme
  // dont la raison d'être est de répondre à « es-tu à jour ? ».
  //
  // CE QUE CELUI-CI MESURE, SANS AUCUN SEUIL ARBITRAIRE (BP5 : un seuil planté dans un nuage
  // continu se trompe au premier cas nouveau). Il compare deux dates que le dépôt porte déjà :
  // la plus récente des dates de mouvement des fils, et les dates du registre des remises. Un
  // document REMIS après le dernier mouvement d'un fil est un document livré sans qu'aucun fil
  // n'ait bougé — exactement le flux de travail qu'il décrit (« pour me repondre, tu me livres
  // les fils concernés ») pris en défaut. Zéro tolérance sur cette population-là, et c'est
  // justifié : chaque document qui lui est remis répond à quelque chose, donc appartient à un fil.
  { cle: "fils-alimentes", question: "Chaque document qui lui a été remis a-t-il laissé une trace dans un fil ?",
    sansQuoi: "un fil parfaitement formé et mort depuis deux jours passe les six autres contrôles : sans celui-ci, « à jour » ne mesure que la FORME des fils, jamais leur ALIMENTATION — et c'est précisément le faux vert qu'il a ressenti avant qu'aucun outil ne le voie" },
]);

// LE REGISTRE DES REMISES, LU D'ICI. Son chemin est le même que celui déclaré par data-archangel
// (REGISTRE_DES_LIVRAISONS) — recopié plutôt qu'importé, parce qu'importer data-archangel entier
// pour une constante alourdirait un outil qu'on lance souvent. Le filet vérifie que les deux
// chaînes restent identiques, ce que l'Article 24 exige d'une valeur recopiée.
export const REGISTRE_DES_REMISES = "docs/livraisons.json";

export function filsAlimentes({ root = ROOT, fils = [], readFileImpl = readFileSync } = {}) {
  let registre;
  try { registre = JSON.parse(readFileImpl(join(root, REGISTRE_DES_REMISES), "utf8")); }
  catch { return { mesurable: false, pourquoi: `${REGISTRE_DES_REMISES} n'a pas pu être lu : on ne sait pas ce qui lui a été remis, donc on ne peut pas dire si les fils ont suivi` }; }
  const remises = Array.isArray(registre?.remises) ? registre.remises : Array.isArray(registre) ? registre : [];
  if (!remises.length) return { mesurable: false, pourquoi: "aucune remise enregistrée : rien à confronter aux fils, ce qui n'est jamais « les fils ont suivi »" };
  const datesFils = fils.map((f) => f.date).filter(Boolean).sort();
  if (!datesFils.length) return { mesurable: false, pourquoi: "aucun fil ne porte de date de mouvement : la comparaison est impossible" };
  const dernierFil = datesFils[datesFils.length - 1];
  // On compare sur la DATE seule (10 caractères) : une remise et un mouvement de fil le même jour
  // ne sont pas un écart — le fil a pu être nourri dans la même session.
  const orphelines = remises.filter((r) => String(r?.remisLe ?? "").slice(0, 10) > dernierFil);
  return { mesurable: true, orphelines, remises: remises.length, dernierFil };
}

// CE QU'UNE QUESTION DOIT PORTER POUR ÊTRE RÉPONDABLE, et le seuil est volontairement bas.
//
// Une question qui lui est adressée (« — À TOI ») doit offrir des OPTIONS CONCRÈTES, repérées par
// une lettre entre parenthèses : (a) … · (b) … Deux au minimum, quatre au maximum — c'est la règle
// de forme déjà écrite dans docs/regles-de-travail.md §2, jamais inventée ici ; ce fichier ne fait
// que la rendre mesurable.
//
// CE QUI N'EST PAS MESURÉ, ET IL FAUT LE DIRE : qu'une option soit CLAIRE. Une mécanique compte
// des lettres, elle ne lit pas. Un contrôle vert ne prouve donc pas qu'il a compris la question —
// il prouve seulement qu'on ne lui a pas tendu une page blanche. Le reste reste son jugement à
// lui, et lui seul peut dire « je n'ai rien compris ».
export const MOTIF_QUESTION_A_LUI = /^\*\*Q[\d.]+(?:bis|ter)?\s*—\s*À TOI\b[^\n]*\n(?:[^\n]*\n?)*?(?=\n\*\*Q|\n##|$)/gim;
export const MOTIF_OPTION = /\((?:a|b|c|d)\)\s*\S/g;

// LE SIXIÈME CONTRÔLE — SA QUESTION DU 2026-09-30, ET ELLE VISE JUSTE.
//
// SES MOTS : « tu veilles bien aux mécanismes entre suivi des tâches et suivi fil de discussion ?
// tu veilles bien en général à ce que chaque constat suivi d'une proposition ne reste pas qu'une
// intention, jamais réalisée ? »
//
// LA RÉPONSE HONNÊTE, LE JOUR OÙ IL L'A POSÉE, ÉTAIT NON. Les fils portaient VINGT engagements
// « À MOI » et aucun n'existait comme tâche dans le suivi. Chacun avait l'air d'un travail en
// cours parce qu'il était écrit ; aucun n'était comptable.
//
// C'EST EXACTEMENT LE TROU QUE L'ARTICLE 28 FERME AILLEURS — rapport → analyse → plan d'action →
// tâches — et que les fils rouvraient sur un autre terrain, parce qu'un fil n'est pas un rapport
// et qu'aucun contrôle ne les regardait.
//
// ET LA MÊME DOCTRINE QUE checkActionChain() S'APPLIQUE, LE CAS VICIEUX COMPRIS : on ne vérifie
// pas qu'un numéro est CITÉ, on vérifie que la tâche EXISTE. Une référence morte ressemble à un
// lien, ce qui est pire qu'une absence.
export const MOTIF_ENGAGEMENT = /^\*\*Q[\d.]+(?:bis|ter)?\s*—\s*À MOI\b[^\n]*\n(?:[^\n]*\n?)*?(?=\n\*\*Q|\n##|$)/gim;
export const MOTIF_TACHE_CITEE = /#(\d{3,5})\b/g;

export function engagementsSansTache(texte = "", tachesExistantes = null) {
  const blocs = String(texte).match(MOTIF_ENGAGEMENT) ?? [];
  const nus = [];
  for (const b of blocs) {
    const id = (b.match(/^\*\*(Q[\d.]+(?:bis|ter)?)/) ?? [])[1] ?? "?";
    const numeros = [...b.matchAll(MOTIF_TACHE_CITEE)].map((m) => m[1]);
    if (!numeros.length) { nus.push({ id, pourquoi: "aucune tâche citée" }); continue; }
    // Une tâche CITÉE mais INEXISTANTE est pire qu'aucune : elle rassure.
    if (tachesExistantes && !numeros.some((n) => tachesExistantes.has(n))) {
      nus.push({ id, pourquoi: `tâche(s) ${numeros.map((n) => "#" + n).join(", ")} citée(s) mais introuvable(s) dans le suivi` });
    }
  }
  return { pris: blocs.length, nus };
}

// Les numéros de tâche réellement présents dans docs/suivi/ — lus, jamais supposés.
export function tachesDuSuivi({ root = ROOT, listDirImpl = readdirSync, readFileImpl = readFileSync } = {}) {
  const ids = new Set();
  const balayer = (dossier) => {
    let entrees = [];
    try { entrees = listDirImpl(join(root, dossier), { withFileTypes: true }); } catch { return; }
    for (const e of entrees) {
      const rel = `${dossier}/${e.name}`;
      if (e.isDirectory()) { balayer(rel); continue; }
      if (!e.name.endsWith(".md")) continue;
      let t = "";
      try { t = readFileImpl(join(root, rel), "utf8"); } catch { continue; }
      for (const m of t.matchAll(/^\|\s*(\d{3,5})\s*\|/gm)) ids.add(m[1]);
    }
  };
  balayer("docs/suivi");
  return ids;
}

export function questionsRepondables(texte = "") {
  const blocs = String(texte).match(MOTIF_QUESTION_A_LUI) ?? [];
  const nues = [];
  for (const b of blocs) {
    const lettres = new Set((b.match(MOTIF_OPTION) ?? []).map((o) => o[1]));
    if (lettres.size < 2) nues.push((b.match(/^\*\*(Q[\d.]+(?:bis|ter)?)/) ?? [])[1] ?? "?");
  }
  return { posees: blocs.length, nues };
}

// Les marqueurs que chaque fil doit porter. Ils sont LUS dans le fichier, jamais supposés.
export const MOTIF_BALLE = /^\*\*Balle\s*:\*\*\s*(À TOI|À MOI|CLOS|DORMANT)\b/mi;
export const MOTIF_DATE = /^\*\*Dernier mouvement\s*:\*\*\s*(\d{4}-\d{2}-\d{2})/mi;
export const MOTIF_PLACE = /^\*\*Place dans le plan\s*:\*\*\s*(.+)$/mi;
export const MOTIF_SAISINES = /^\*\*Saisines\s*:\*\*\s*(.+)$/mi;

export function lireLesFils({ root = ROOT, listDirImpl = readdirSync, readFileImpl = readFileSync, ...opts } = {}) {
  let noms = [];
  try { noms = listDirImpl(join(root, DOSSIER_FILS)); } catch { return { mesurable: false, pourquoi: `${DOSSIER_FILS} n'existe pas encore — aucun fil n'a été ouvert`, fils: [] }; }
  const fils = [];
  for (const n of noms.filter((x) => /^fil-\d+.*\.md$/.test(x)).sort()) {
    let t = "";
    try { t = readFileImpl(join(root, DOSSIER_FILS, n), "utf8"); } catch { continue; }
    const titre = (t.match(/^#\s+(.+)$/m) ?? [])[1] ?? n;
    fils.push({
      fichier: `${DOSSIER_FILS}/${n}`,
      numero: Number((n.match(/^fil-(\d+)/) ?? [])[1] ?? 0),
      titre,
      balle: (t.match(MOTIF_BALLE) ?? [])[1] ?? null,
      date: (t.match(MOTIF_DATE) ?? [])[1] ?? null,
      place: (t.match(MOTIF_PLACE) ?? [])[1] ?? null,
      saisines: ((t.match(MOTIF_SAISINES) ?? [])[1] ?? "").split("·").map((s) => s.trim()).filter(Boolean),
      questions: questionsRepondables(t),
      engagements: engagementsSansTache(t, opts.taches ?? null),
    });
  }
  return { mesurable: true, fils };
}

// LE CONTRÔLE 1 compare ce qu'il a envoyé à ce qui est déposé. Il ne peut PAS voir le dossier
// temporaire des envois depuis un autre poste : quand il est absent, on le DIT plutôt que de rendre
// un vert (leçons L5 et L11) — « je n'ai pas pu regarder » et « rien ne manque » ne s'écrivent
// jamais pareil.
export function saisinesDeposees({ root = ROOT, dossierEnvois = null, listDirImpl = readdirSync } = {}) {
  let deposees = [];
  try { deposees = listDirImpl(join(root, DOSSIER_SAISINES)).filter((f) => /\.(md|docx|txt)$/i.test(f)); } catch { /* déclaré ci-dessous */ }
  if (!dossierEnvois) return { mesurable: false, pourquoi: "le dossier des envois n'est pas accessible depuis ici : je peux dire ce qui EST déposé, jamais ce qui manque", deposees: deposees.length, manquantes: [] };
  let envoyees = [];
  try { envoyees = listDirImpl(dossierEnvois); } catch { return { mesurable: false, pourquoi: `${dossierEnvois} illisible`, deposees: deposees.length, manquantes: [] }; }
  const norm = (s) => String(s).toLowerCase().replace(/^[0-9a-f]{8}-/, "").replace(/[^a-z0-9]/g, "");
  const dep = deposees.map(norm);
  const manquantes = envoyees.filter((e) => /\.(docx|txt|md|pdf)$/i.test(e)).filter((e) => !dep.some((d) => d.includes(norm(e).slice(0, 18)) || norm(e).includes(d.slice(0, 18))));
  return { mesurable: true, deposees: deposees.length, envoyees: envoyees.length, manquantes };
}

export function suisJeAJour({ root = ROOT, dossierEnvois = null, taches = null } = {}) {
  const lus = lireLesFils({ root, taches: taches ?? tachesDuSuivi({ root }) });
  const dep = saisinesDeposees({ root, dossierEnvois });
  const fils = lus.fils ?? [];
  const resultats = [
    { ...LES_CONTROLES[0], mesurable: dep.mesurable, ok: dep.mesurable ? dep.manquantes.length === 0 : null,
      detail: dep.mesurable ? `${dep.deposees} saisine(s) déposée(s), ${dep.manquantes.length} manquante(s)` : dep.pourquoi },
    { ...LES_CONTROLES[1], mesurable: lus.mesurable, ok: lus.mesurable ? fils.length > 0 && fils.every((f) => f.saisines.length > 0) : null,
      detail: lus.mesurable ? `${fils.filter((f) => f.saisines.length).length}/${fils.length} fil(s) nomment la saisine dont ils sortent` : lus.pourquoi },
    { ...LES_CONTROLES[2], mesurable: lus.mesurable, ok: lus.mesurable ? fils.length > 0 && fils.every((f) => f.balle && f.date) : null,
      detail: lus.mesurable ? `${fils.filter((f) => f.balle && f.date).length}/${fils.length} fil(s) disent à qui est la balle ET depuis quand` : lus.pourquoi },
    { ...LES_CONTROLES[3], mesurable: lus.mesurable, ok: lus.mesurable ? fils.length > 0 && fils.every((f) => f.place) : null,
      detail: lus.mesurable ? `${fils.filter((f) => f.place).length}/${fils.length} fil(s) disent où ils se placent` : lus.pourquoi },
    (() => {
      const e = fils.reduce((acc, f) => ({ pris: acc.pris + (f.engagements?.pris ?? 0), nus: acc.nus.concat((f.engagements?.nus ?? []).map((n) => `${f.fichier.split("/").pop()} ${n.id} (${n.pourquoi})`)) }), { pris: 0, nus: [] });
      return { ...LES_CONTROLES[5], mesurable: lus.mesurable && e.pris > 0, ok: lus.mesurable && e.pris > 0 ? e.nus.length === 0 : null,
        detail: !lus.mesurable ? lus.pourquoi
          : e.pris === 0 ? "je ne me suis engagé à rien — rien à mesurer, et ce n'est pas un vert"
          : `${e.pris - e.nus.length}/${e.pris} engagement(s) portent une tâche qui existe vraiment${e.nus.length ? ` — sans tâche : ${e.nus.join(", ")}` : ""}` };
    })(),
    (() => {
      const q = fils.reduce((acc, f) => ({ posees: acc.posees + f.questions.posees, nues: acc.nues.concat(f.questions.nues.map((n) => `${f.fichier.split("/").pop()} ${n}`)) }), { posees: 0, nues: [] });
      return { ...LES_CONTROLES[4], mesurable: lus.mesurable && q.posees > 0, ok: lus.mesurable && q.posees > 0 ? q.nues.length === 0 : null,
        detail: !lus.mesurable ? lus.pourquoi
          : q.posees === 0 ? "aucune question ne l'attend — rien à mesurer, et ce n'est pas un vert"
          : `${q.posees - q.nues.length}/${q.posees} question(s) lui offrent des options concrètes${q.nues.length ? ` — nues : ${q.nues.join(", ")}` : ""}` };
    })(),
    (() => {
      const al = filsAlimentes({ root, fils });
      return { ...LES_CONTROLES[6], mesurable: al.mesurable, ok: al.mesurable ? al.orphelines.length === 0 : null,
        detail: !al.mesurable ? al.pourquoi
          : al.orphelines.length === 0 ? `les ${al.remises} remise(s) enregistrée(s) sont toutes antérieures ou contemporaines du dernier mouvement de fil (${al.dernierFil})`
          : `${al.orphelines.length} document(s) remis APRÈS le dernier mouvement d'un fil (${al.dernierFil}) sans qu'aucun fil ne bouge : ${al.orphelines.slice(0, 5).map((o) => o.fichier.split("/").pop()).join(", ")}${al.orphelines.length > 5 ? ` (+${al.orphelines.length - 5})` : ""}` };
    })(),
  ];
  const nonMesures = resultats.filter((r) => r.ok === null).length;
  const rates = resultats.filter((r) => r.ok === false).length;
  return {
    fils: fils.length,
    resultats,
    // TROIS VERDICTS, JAMAIS DEUX. « Je ne sais pas » n'est pas « oui » : un contrôle qu'on n'a pas
    // pu faire ne se compte jamais comme réussi, sinon le système ment exactement quand il est
    // aveugle — et c'est là qu'il est le plus dangereux.
    verdict: rates > 0 ? "NON" : nonMesures > 0 ? "PAS ENTIÈREMENT MESURÉ" : "OUI",
  };
}

export function formatVerdictLines(v) {
  const l = [];
  l.push(`=== SUIS-JE À JOUR ? — ${v.verdict} ===`);
  l.push("");
  for (const r of v.resultats) {
    const p = r.ok === true ? "✅" : r.ok === false ? "🚨" : "⚪";
    l.push(`${p} ${r.question}`);
    l.push(`     ${r.detail}`);
    if (r.ok === false) l.push(`     sans quoi : ${r.sansQuoi}`);
  }
  l.push("");
  l.push(`${v.fils} fil(s) de discussion ouverts.`);
  if (v.verdict === "PAS ENTIÈREMENT MESURÉ") l.push("⚪ = ce contrôle n'a PAS pu être fait. Ce n'est jamais un oui : un système aveugle qui répond « à jour » ment au moment où il est le plus dangereux.");
  return l;
}

// planDactionDesFils() (2026-10-01, tâche #1355) — LE TROU QUE pure-gold-unity A TROUVÉ.
// Cet outil était le DERNIER des 49 tenus par le gabarit à ne jamais conclure : il rendait six
// verdicts et s'arrêtait là. C'est précisément ce que l'Article 28 interdit — « un rapport n'est
// pas fini quand il est écrit, il l'est quand ses constats sont devenus des tâches ».
//
// LES DEUX ÉTATS, ET POURQUOI PAS UN SEUL. Un contrôle qui ÉCHOUE est un écart que je dois
// réparer : RETENU. Un contrôle qui n'a PAS PU ÊTRE FAIT n'est pas mon écart — c'est une décision
// qui ne m'appartient pas (lui donner accès au dossier de ses envois, ou accepter de rester
// aveugle sur ce point) : À TRANCHER. Les fondre en un seul état transformerait sa décision en
// mon manquement, et l'inverse serait pire encore.
//
// CE QU'IL N'INVENTE PAS : aucun constat n'est fabriqué pour remplir la section. Quand les six
// contrôles passent, le plan dit « rien à faire » — ce que buildPlanDaction() écrit déjà seul.
// LA TABLE EST CHOISIE À LA MAIN, EXPRÈS, et cette phrase est ce qui l'autorise (Article 24,
// deuxième exemption). Elle ne reflète l'état d'aucun autre système : elle dit quelle tâche DÉJÀ
// OUVERTE porte la réparation de quel contrôle. Un contrôle absent d'ici n'a simplement pas encore
// de tâche dédiée, et son constat sortira sans numéro — jamais avec un numéro inventé.
// Vérifié ligne par ligne contre docs/suivi/ le 2026-10-01, jamais déduit d'un nom.
export const TACHE_PAR_CONTROLE = Object.freeze({
  "engagements-en-taches": "1332",   // Suivi / « 20 engagements de ma part, 0 tâche » — la tâche qui a créé ce contrôle
  "questions-repondables": "1332",   // même tâche : les deux contrôles sont nés du même constat
});

export function planDactionDesFils(v, { numeros = TACHE_PAR_CONTROLE } = {}) {
  const constats = [];
  for (const r of v.resultats ?? []) {
    if (r.ok === false) {
      constats.push({
        constat: `${r.question} — ${r.detail}`,
        etat: "retenu",
        tache: r.sansQuoi ?? "réparer l'écart avant de répondre « à jour » à quoi que ce soit",
        // Le numéro n'est renseigné que si une tâche existe POUR DE VRAI (passée par l'appelant) :
        // un numéro inventé ici serait une référence morte, qui ressemble à un lien.
        numeroTache: numeros[r.cle] ?? null,
      });
    } else if (r.ok === null) {
      constats.push({
        constat: `${r.question} — ${r.detail}`,
        etat: "a-trancher",
        pourquoi: "ce contrôle est aveugle par construction, et le rendre voyant est TA décision, jamais la mienne — un système aveugle qui répond « à jour » ment au moment où il est le plus dangereux",
      });
    }
  }
  return buildPlanDaction(constats, { toolSlug: "fils-de-discussion" });
}

function main() {
  printReportHeader({ tool: "fils-de-discussion", title: "LES FILS DE DISCUSSION — un sujet, un fil", scriptPath: "scripts/fils-de-discussion.mjs" });
  printReliabilityNotice("fils-de-discussion");
  recordCliUsage("fils-de-discussion");
  const envois = process.argv[3] && process.argv[2] === "--envois" ? process.argv[3] : null;
  const v = suisJeAJour({ dossierEnvois: envois });
  for (const ligne of formatVerdictLines(v)) console.log(ligne);
  const lus = lireLesFils();
  if (lus.mesurable && lus.fils.length) {
    console.log("\n--- LES FILS, PAR NUMÉRO ---");
    for (const f of lus.fils) console.log(`  #${String(f.numero).padStart(2, "0")} [${f.balle ?? "sans balle"}] ${f.titre} — ${f.place ?? "sans place déclarée"}`);
  }
  console.log("\n=== Plan d'action ===");
  for (const ligne of planDactionDesFils(v).lignes) console.log(ligne);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
