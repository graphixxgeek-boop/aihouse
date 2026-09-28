#!/usr/bin/env node
// ICEBERG: membre
// L'AGENT DES NOMS — l'utilisateur baptise, le mécanisme se souvient
// NOM PROVISOIRE depuis 2026-09-24 — « agent des noms » est SON mot, employé en demandant si
// l'agent était prêt ; il reste à confirmer comme nom définitif. Au premier passage réel, cet
// outil s'est signalé LUI-MÊME faute de date à côté de sa marque : la date ci-dessus est la
// correction, et le refus d'alerter sans elle est la bonne réaction — une ancienneté inventée
// vaut moins qu'un aveu d'ignorance.
// ==================================================================
// POURQUOI IL EXISTE (2026-09-24). Sa règle, dans ses mots : « je dois toujours choisir les noms
// d'outil ou de process ou de rapports, et l'outil veille à ce que cette regle soit respecté. c'est
// un process aussi ». Le nom « agent des noms » est le sien — il l'a employé en demandant si
// l'agent était prêt.
//
// CE QUE LE MÉCANISME PEUT ET NE PEUT PAS. Il ne peut pas empêcher l'agent de choisir un nom : rien
// ne le permettrait. Ce qu'il peut, et qui suffit, c'est rendre IMPOSSIBLE d'oublier : un nom posé
// à titre provisoire porte une marque, et cette marque est cherchée à chaque passage. Un nom
// provisoire qui traîne devient donc visible, jamais silencieux.
//
// LA RÉCURSION EST ASSUMÉE : ce fichier porte lui-même un nom provisoire, marqué comme tel, et il
// se signalera tout seul au premier passage. C'est le meilleur test possible de sa propre règle.
//
// LE REGISTRE GARDE CE QUE GIT NE GARDE PAS : git sait qu'un nom a changé, jamais QUI l'a choisi ni
// ce qui avait été proposé à côté. Or « pourquoi ça s'appelle comme ça » est une vraie question,
// posée plusieurs fois dans ce projet.
//
// GÉNÉRIQUE : rien ici ne connaît ce projet. Un autre projet piloté par IA réutilise ce fichier tel
// quel — seules les séries d'hommages sont propres à un goût, et elles sont déclarées à part.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { planDactionDepuisEcarts, PLAN_ACTION_TITRE, imprimerPlanDaction, printReportHeader } from "./report-template.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

export const OUTIL = "agent-des-noms";
export const SCRIPT_PATH = "scripts/agent-des-noms.mjs";
export const REGISTRE = "docs/agent-des-noms/registre.md";
export const MARQUE_PROVISOIRE = "NOM PROVISOIRE";
// Un nom provisoire n'est pas un défaut : c'est ce qui permet de travailler sans bloquer la nuit.
// Il ne devient un défaut qu'en DURANT. Sept jours, parce que c'est plus long qu'une nuit de
// travail autonome et plus court qu'un oubli durable.
export const JOURS_AVANT_ALERTE = 7;

// CE QUI SE NOMME, et rien d'autre — sa portée exacte, tranchée le 2026-09-24. Élargir à tout ce
// qui porte un nom rendrait la règle ingérable ; la réduire lui ferait perdre ce qui compte.
export const OBJETS_A_NOMMER = ["outil", "process", "rapport"];

// LES SÉRIES D'HOMMAGES. Chacune est un GOÛT, pas une règle : un nom hors série reste légitime, il
// déclare seulement qu'il est hors série. La série « grands codeurs » a une raison de plus que le
// plaisir, et elle est de lui : ceux qui ont servi toute la profession ont contribué à ce projet
// par ricochet, y compris à travers l'IA qui l'écrit.
export const SERIES_HOMMAGE = {
  "grands-codeurs": { quoi: "ceux qui ont servi toute la profession", pourquoi: "ils ont contribué à ce projet par ricochet, à travers l'outil qui l'écrit" },
  "dystopique": { quoi: "les auteurs et les images de la dystopie", pourquoi: "c'est l'ambiance même du jeu" },
  "prophetes": { quoi: "ceux qui annoncent et qu'on n'écoute pas", pourquoi: "c'est exactement le métier d'un outil de vigilance — et CASSANDRA, déjà dans l'équipe, en fait partie sans l'avoir déclaré" },
  "matrix": { quoi: "le film", pourquoi: "des êtres qui découvrent que leur monde est fabriqué : le sujet du jeu, mot pour mot" },
  "squid-game": { quoi: "la série", pourquoi: "des gens observés par des spectateurs masqués qui s'amusent : la thèse du projet" },
};

// ===========================================================================================
// LA FONCTION PRINCIPALE : MINIMISER LE RISQUE TECHNIQUE D'UN RENOMMAGE EN MASSE
// ===========================================================================================
// L'utilisateur a corrigé le cadrage, et il avait raison : « cet agent a pour fonction principale
// de minimiser le risque technique lié au changement de noms en masse ». Le registre et la marque
// provisoire ci-dessus sont la GOUVERNANCE du nommage — utile, mais la moitié secondaire.
//
// LE RISQUE, MESURÉ AVANT D'ÊTRE DÉCRIT (2026-09-24, sur le vrai dépôt) : renommer `cassandra-rh`
// toucherait 2 095 occurrences réparties dans 73 fichiers de documentation. Renommer `memento` :
// 775. Renommer `el-professor` : 604.
//
// ET LE RISQUE N'EST PAS OÙ ON LE CROIT. Sur les 2 095 de CASSANDRA, NEUF seulement sont des
// imports de code — ceux-là, un test cassé les attrape en dix secondes. En revanche 496 vivent dans
// `docs/suivi/`, c'est-à-dire dans l'HISTOIRE. Et celles-là ne doivent SURTOUT PAS être renommées :
// une ligne de suivi de septembre qui dit « CASSANDRA-RH a trouvé X » doit continuer à le dire.
// La réécrire falsifierait ce qui s'est réellement passé, et le ferait en silence.
//
// D'OÙ LA RÈGLE CENTRALE DE CET OUTIL, et c'est elle qui justifie son existence :
//   un renommage déplace le CODE VIVANT et laisse l'HISTOIRE intacte.
// Ce qui relie les deux ensuite n'est pas une réécriture, c'est un ALIAS : « ce qui s'appelle
// aujourd'hui X s'appelait Y jusqu'au tant ». Un lecteur futur retrouve le fil sans qu'on ait eu à
// mentir sur le passé.
//
// CE QU'IL NE FAIT PAS, délibérément : il ne renomme rien. Il inventorie, il trie, il produit un
// plan, et il vérifie après coup. Un outil qui renommerait 2 000 occurrences tout seul serait
// exactement l'action difficile à défaire que ce projet refuse de prendre sans validation.

// Les cinq natures d'une occurrence, et seules les trois premières se déplacent.
export const NATURES_OCCURRENCE = {
  "import-de-code": { deplace: true, risque: "élevé", quoi: "un import ou un chemin de module — casse immédiatement, et un test le voit" },
  "commande-ecrite": { deplace: true, risque: "moyen", quoi: "un `node scripts/X.mjs` dans un document — casse à l'usage, silencieusement" },
  "chemin-de-registre": { deplace: true, risque: "élevé", quoi: "un dossier `docs/X/` ou une clé de registre — casse la mémoire de l'outil" },
  "mention-vivante": { deplace: true, risque: "faible", quoi: "une prose qui décrit ce que l'outil fait AUJOURD'HUI" },
  "trace-historique": { deplace: false, risque: "🔴 NE JAMAIS TOUCHER", quoi: "une ligne de suivi, un rapport archivé, une mesure passée — la renommer falsifie ce qui s'est passé" },
};

// Ce qui est de l'HISTOIRE se reconnaît à son EMPLACEMENT, jamais à son contenu : un dossier
// d'archives contient des archives, quoi qu'elles racontent.
//
// PREMIER PASSAGE RÉEL, ET IL A RATÉ (2026-09-24, sur `memento`). La première version cherchait une
// DATE dans le nom du fichier. Résultat : `docs/check-tasks-details/ronde-2026-09-21T23-26-29.txt`
// passait pour de l'histoire, et `docs/check-tasks-details/1789942702956-arborescence.html` — même
// dossier, même nature, horodatage en millisecondes — passait pour du vivant. Encore le fil rouge :
// une sonde qui NE PEUT PAS reconnaître rend exactement ce que rend une sonde qui n'a rien trouvé.
//
// LA RÈGLE CORRIGÉE PREND LE PROBLÈME PAR L'AUTRE BOUT, et elle est dérivée plutôt qu'énumérée
// (Article 24) : tout ce qui vit dans un SOUS-DOSSIER de `docs/` est un registre horodaté — c'est
// la règle d'organisation du projet, `docs/<nom-de-l-outil>/` — donc de l'histoire par défaut. Le
// VIVANT est l'exception, et elle se déclare : `docs/referentiel/` est la seule référence que le
// projet tient à jour au présent.
//
// LE DÉFAUT PENCHE DU CÔTÉ SÛR, délibérément. Se tromper en classant du vivant comme historique
// laisse une mention périmée — ennuyeux. Se tromper dans l'autre sens réécrit une archive et
// falsifie ce qui s'est passé — c'est précisément ce que cet outil existe pour empêcher. Entre les
// deux erreurs, on choisit la première sans hésiter.
// Le vivant s'arrête au PREMIER niveau : `docs/referentiel/x.md` est tenu à jour, mais
// `docs/referentiel/kpi-rapports/manuel-2026-09-21.txt` est un rapport archivé sous un dossier de
// référence — trouvé au deuxième passage réel, et c'était l'erreur dangereuse, celle qui réécrit
// une archive. Un sous-dossier est un registre, où qu'il vive.
export const DOSSIERS_VIVANTS = [/^docs\/referentiel\/[^/]+$/];
export const DOSSIERS_HISTORIQUES = [/^docs\/[^/]+\//, /\.csv$/, /\.jsonl?$/, /historique/i];

export function natureDeLOccurrence(chemin, ligne, ancien) {
  if (!DOSSIERS_VIVANTS.some((r) => r.test(chemin)) && DOSSIERS_HISTORIQUES.some((r) => r.test(chemin))) return "trace-historique";
  if (/^(scripts|lib|app|components)\//.test(chemin) && new RegExp(`(from|import\\()\\s*['"\`][^'"\`]*${ancien}`).test(ligne)) return "import-de-code";
  if (new RegExp(`node\\s+scripts/${ancien}\\.mjs`).test(ligne)) return "commande-ecrite";
  if (new RegExp(`docs/${ancien}/|["'\`]${ancien}["'\`]\\s*:`).test(ligne)) return "chemin-de-registre";
  return "mention-vivante";
}

// LA COLLECTE, branchée sur le VRAI dépôt — et c'est ce qui sépare cet outil d'une intention
// (leçon L2). Elle lit git grep plutôt que le disque : ce qui n'est pas versionné n'est pas le
// projet, et un dossier de dépendances ferait exploser le compte sans rien apprendre.
// Elle rend `mesurable: false` quand la recherche N'A PAS PU tourner, jamais un zéro vert — c'est
// le fil rouge de ce projet, treize fois rencontré : un contrôle empêché de regarder rend
// exactement ce que rend un contrôle qui n'a rien trouvé.
export function collecterOccurrences(ancien, { root = ".", executer } = {}) {
  const lancer = executer ?? ((args) => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  let brut;
  try {
    brut = lancer(["grep", "-n", "--fixed-strings", "--", ancien]);
  } catch (e) {
    // git grep sort en 1 quand il ne trouve RIEN : ce cas-là est une vraie mesure à zéro.
    if (e?.status === 1) return { occurrences: [], mesurable: true, pourquoi: null };
    return { occurrences: [], mesurable: false, pourquoi: `la recherche n'a pas pu tourner (${e?.message ?? "raison inconnue"}) — une liste vide ici ne veut PAS dire « aucune occurrence »` };
  }
  const occurrences = [];
  for (const l of String(brut).split("\n")) {
    if (!l) continue;
    const m = l.match(/^([^:]+):(\d+):([\s\S]*)$/);
    if (!m) continue;
    occurrences.push({ chemin: m[1], numero: Number(m[2]), ligne: m[3] });
  }
  return { occurrences, mesurable: true, pourquoi: null };
}

// LE PIÈGE QU'UN `sed` NE VOIT JAMAIS : un nom qui en CONTIENT un autre. Renommer `memento`
// toucherait `memento-weight`, qui est un outil différent — et le casserait en silence, puisque rien
// dans le texte ne distingue les deux. Trouvé sur le vrai dépôt au passage de vérification, pas
// imaginé : `lib/memento-weight.ts`, `scripts/memento-weight.mjs`, `docs/referentiel/memento-weight.md`.
export function homonymesEtendus(ancien, occurrences = []) {
  const suite = new RegExp(`${ancien.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[A-Za-z0-9_-]`);
  const noms = new Set();
  for (const o of occurrences) {
    for (const m of String(o.ligne).matchAll(new RegExp(`${ancien.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[A-Za-z0-9_-]+`, "g"))) noms.add(m[0]);
    if (suite.test(o.chemin)) for (const m of String(o.chemin).matchAll(new RegExp(`${ancien.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[A-Za-z0-9_-]+`, "g"))) noms.add(m[0]);
  }
  return [...noms].sort();
}

export function inventaireDuRenommage(ancien, occurrences = []) {
  const par = Object.fromEntries(Object.keys(NATURES_OCCURRENCE).map((n) => [n, []]));
  for (const o of occurrences) par[natureDeLOccurrence(o.chemin, o.ligne, ancien)].push(o);
  const aDeplacer = Object.entries(par).filter(([n]) => NATURES_OCCURRENCE[n].deplace).reduce((s, [, v]) => s + v.length, 0);
  return { ancien, par, total: occurrences.length, aDeplacer, aLaisser: par["trace-historique"].length,
    homonymes: homonymesEtendus(ancien, occurrences),
    mesurable: occurrences.length > 0,
    pourquoi: occurrences.length ? null : "aucune occurrence trouvée — soit le nom n'existe pas, soit la recherche n'a pas pu lire le dépôt : les deux rendent une liste vide et ne veulent pas dire la même chose" };
}

export function planDeRenommage(inv, nouveau) {
  if (!inv.mesurable) return { lignes: [`⚠️ NON MESURABLE — ${inv.pourquoi}`], sur: false };
  const L = [`RENOMMER « ${inv.ancien} » EN « ${nouveau} » — ${inv.total} occurrence(s) au total.`, ""];
  L.push(`À DÉPLACER : ${inv.aDeplacer}`);
  for (const [n, d] of Object.entries(NATURES_OCCURRENCE)) {
    if (!d.deplace) continue;
    const liste = inv.par[n];
    if (liste.length) L.push(`   ${d.risque.padEnd(7)} ${String(liste.length).padStart(4)} × ${n} — ${d.quoi}`);
  }
  L.push("");
  L.push(`À LAISSER INTACTES : ${inv.aLaisser} trace(s) historique(s).`);
  L.push(`   🔴 Une ligne de suivi, un rapport archivé ou une mesure passée garde le nom qu'elle portait.`);
  L.push(`   La réécrire falsifierait ce qui s'est passé — et le ferait en silence, ce qui est pire.`);
  L.push("");
  if (inv.homonymes?.length) {
    L.push(`🔴 ATTENTION — ${inv.homonymes.length} nom(s) CONTIENNENT « ${inv.ancien} » sans être lui :`);
    L.push(`   ${inv.homonymes.join(" · ")}`);
    L.push(`   Un remplacement de texte aveugle les emporterait avec, et les casserait en silence.`);
    L.push("");
  }
  L.push(`CE QUI RELIE LES DEUX : un ALIAS « ${nouveau} s'appelait ${inv.ancien} » dans le registre des noms.`);
  L.push(`Un lecteur futur retrouve le fil sans qu'on ait eu à mentir sur le passé.`);
  return { lignes: L, sur: inv.par["import-de-code"].length > 0 };
}

// LA VÉRIFICATION D'APRÈS, et elle compte autant que le plan : un renommage réussi ne laisse AUCUN
// reste vivant de l'ancien nom, et n'a touché AUCUNE trace historique. Les deux se vérifient, et
// le second est celui qu'on oublie.
export function verifierApresRenommage(ancien, occurrencesRestantes = []) {
  const restesVivants = occurrencesRestantes.filter((o) => natureDeLOccurrence(o.chemin, o.ligne, ancien) !== "trace-historique");
  return { propre: restesVivants.length === 0, restesVivants,
    pourquoi: restesVivants.length
      ? `${restesVivants.length} occurrence(s) VIVANTE(S) de l'ancien nom subsistent — un renommage à moitié fait est pire qu'un renommage pas fait : les deux noms coexistent et personne ne sait lequel fait foi`
      : "aucun reste vivant — les traces historiques conservées sont normales et attendues" };
}

export function mentionProvisoire(source) {
  const i = String(source ?? "").indexOf(MARQUE_PROVISOIRE);
  if (i < 0) return null;
  const autour = String(source).slice(Math.max(0, i - 200), i + 300);
  const date = autour.match(/20\d{2}-\d{2}-\d{2}/);
  return { marque: true, depuis: date ? date[0] : null,
    pourquoi: date ? null : "aucune date à côté de la marque — impossible de dire depuis quand il traîne, donc impossible d'alerter" };
}

// Le compte des jours ne se devine pas : sans date lisible à côté de la marque, la fonction REFUSE
// d'alerter plutôt que de supposer une ancienneté. Un « 0 jour » inventé se lit comme un nom posé
// à l'instant, et laisserait dormir exactement ce qu'on cherche.
export function findNomsProvisoiresOublies(fichiers = [], { lire, aujourdhui, jours = JOURS_AVANT_ALERTE } = {}) {
  const oublies = [];
  const sansDate = [];
  for (const f of fichiers) {
    let src = ""; try { src = lire(f); } catch { continue; }
    const m = mentionProvisoire(src);
    if (!m) continue;
    if (!m.depuis) { sansDate.push({ fichier: f, pourquoi: m.pourquoi }); continue; }
    const age = Math.floor((Date.parse(aujourdhui) - Date.parse(m.depuis)) / 86_400_000);
    if (age >= jours) oublies.push({ fichier: f, depuis: m.depuis, jours: age });
  }
  return { oublies, sansDate, mesurable: true };
}

// LE BAPTÊME. Même refus que `enregistrerXp()` et pour la même raison : un mécanisme ne peut pas
// prouver que l'utilisateur a choisi, mais il peut refuser de l'inventer. Un nom enregistré sans
// `parUtilisateur: true` serait un nom que l'agent s'est donné en prétendant le contraire.
export function enregistrerBapteme(entree, { root = ".", lire = readFileSync, ecrire = writeFileSync, date = new Date().toISOString().slice(0, 10) } = {}) {
  if (!OBJETS_A_NOMMER.includes(entree?.objet)) throw new Error(`objet « ${entree?.objet} » hors portée — seuls ${OBJETS_A_NOMMER.join(", ")} se nomment (décision du 2026-09-24)`);
  if (!entree?.nomRetenu) throw new Error("un baptême sans nom retenu n'est pas un baptême");
  if (entree.parUtilisateur !== true) throw new Error("un nom n'est valable que CHOISI PAR L'UTILISATEUR — jamais l'agent sur son propre travail (règle du 2026-09-24)");
  const chemin = join(root, REGISTRE);
  let texte = "";
  try { texte = lire(chemin, "utf8"); } catch {
    try { mkdirSync(join(root, "docs/agent-des-noms"), { recursive: true }); } catch { /* déjà là */ }
    texte = `# Registre des noms\n\n*(Qui a nommé quoi, quand, et ce qui avait été proposé à côté. Git sait qu'un nom a\nchangé ; il ne sait jamais POURQUOI celui-là et pas un autre — et c'est une question\nqui a déjà été posée plusieurs fois dans ce projet.)*\n\n| Date | Objet | Nom retenu | Série | Autres propositions | Pourquoi celui-là |\n|---|---|---|---|---|---|\n`;
  }
  const ligne = `| ${date} | ${entree.objet} | **${entree.nomRetenu}** | ${entree.serie ?? "hors série"} | ${(entree.propositions ?? []).filter((p) => p !== entree.nomRetenu).join(" · ") || "—"} | ${entree.pourquoi ?? "—"} |`;
  ecrire(chemin, `${texte.replace(/\n+$/, "")}\n${ligne}\n`, "utf8");
  return { enregistre: true, ligne };
}

// ══════════════════════════════════════════════════════════════════════════
// LE REGISTRE SE SÈME DEPUIS LE DÉPÔT, IL NE SE TAPE PAS (2026-09-27, tâche #706)
// ══════════════════════════════════════════════════════════════════════════
//
// LE CONSTAT QUI A OUVERT CE CHANTIER, et il était mesuré : « 81 noms en service sur 81 jamais
// validés au registre des baptêmes (le registre n'existe pas encore : le total EST le compte) ».
// Un registre qui n'existe pas rend le même chiffre qu'un registre où personne n'a jamais rien
// inscrit — c'est la leçon L13 dans sa forme la plus pure, et elle portait ici sur la règle que
// l'utilisateur a demandée en premier : « je dois toujours choisir les noms ».
//
// LA TROUVAILLE, ET ELLE CHANGE LE TRAVAIL À FAIRE : plusieurs de ces baptêmes SONT documentés,
// depuis des jours, dans le commentaire de tête de l'outil lui-même — « SAFE-EXPORT (2026-09-22,
// nom donné par l'utilisateur) ». La preuve était écrite à l'endroit exact où ce projet écrit le
// POURQUOI à côté du QUOI (Article 27). Elle n'avait simplement aucun lecteur.
//
// ON SÈME DONC LE REGISTRE DEPUIS LE DÉPÔT au lieu de le retaper (Article 24 : un registre se LIT).
// Ce qui est semé n'est jamais une supposition : c'est une trace ÉCRITE qui dit noir sur blanc que
// l'utilisateur a nommé, et le registre cite le fichier et la ligne où elle se lit. Un baptême
// qu'aucune trace ne porte n'est PAS semé — il reste dans la dette, où il doit être.
//
// LE FAUX POSITIF A ÉTÉ RENCONTRÉ EN MESURANT, jamais en relisant le motif : « SON mot » attrapait
// « SON motif de titre » dans abraham-les-references, qui n'a rien d'un baptême. 7 candidats → 6
// vrais. Une limite de mot suffit, et c'est bien parce que l'outil a tourné pour de vrai qu'elle
// existe (leçon L2).
export const MOTIFS_BAPTEME = [
  { motif: /nom donné par l'utilisateur/i, quoi: "le commentaire de tête déclare que l'utilisateur a nommé cet outil" },
  { motif: /\bSON mot\b/, quoi: "le commentaire de tête déclare que le nom est un mot de l'utilisateur" },
  { motif: /nom choisi par l'utilisateur/i, quoi: "le commentaire de tête déclare que l'utilisateur a choisi ce nom" },
  { motif: /surnom donné par l'utilisateur/i, quoi: "le commentaire de tête déclare un surnom donné par l'utilisateur" },
];
// La trace est cherchée dans l'EN-TÊTE seulement : un « nom donné par l'utilisateur » cité au
// milieu d'un fichier parle presque toujours d'un AUTRE outil (check-house.mjs en cite quatre).
// Chercher dans tout le fichier attribuerait à check-house les baptêmes de quatre autres.
export const LIGNES_D_ENTETE = 40;
export const MOTIF_DATE = /\b(20\d\d-\d\d-\d\d)\b/;

export function findBaptemesDocumentes(fichiers = [], { lire, motifs = MOTIFS_BAPTEME, entete = LIGNES_D_ENTETE } = {}) {
  const trouves = [];
  for (const f of fichiers) {
    let lignes;
    try { lignes = String(lire(f)).split("\n").slice(0, entete); } catch { continue; }
    for (let i = 0; i < lignes.length; i++) {
      const m = motifs.find((x) => x.motif.test(lignes[i]));
      if (!m) continue;
      trouves.push({
        fichier: f,
        ligne: i + 1,
        nom: String(f).replace(/^scripts\//, "").replace(/\.mjs$/, ""),
        // LA DATE SE LIT SUR LA LIGNE, elle ne se devine pas (Article 32). Sans elle, le baptême
        // est semé SANS date plutôt qu'avec la date du jour : inscrire aujourd'hui un baptême du
        // 22 septembre serait falsifier l'histoire que ce registre existe pour garder.
        date: MOTIF_DATE.exec(lignes[i])?.[1] ?? null,
        preuve: lignes[i].trim(),
        quoi: m.quoi,
      });
      break;
    }
  }
  return trouves;
}

export function semerLeRegistre(baptemes = [], { root = ".", lire = readFileSync, ecrire = writeFileSync, dejaLa = "" } = {}) {
  const semes = [], ignores = [];
  for (const b of baptemes) {
    if (new RegExp(`\\*\\*${b.nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\*\\*`, "i").test(dejaLa)) { ignores.push({ ...b, pourquoi: "déjà au registre" }); continue; }
    enregistrerBapteme({
      objet: "outil", nomRetenu: b.nom, parUtilisateur: true,
      // LE « POURQUOI » CITE LA PREUVE, jamais une affirmation de l'agent : c'est ce qui distingue
      // un registre semé d'un registre inventé. Le jour où quelqu'un doute, il ouvre le fichier.
      pourquoi: `${b.quoi} — ${b.fichier}:${b.ligne}`,
    }, { root, lire, ecrire, date: b.date ?? "date non lue" });
    semes.push(b);
  }
  return { semes, ignores };
}

export function formatSemisLines(r, { nonValidesApres = null } = {}) {
  const L = ["", "🕊️  REGISTRE DES BAPTÊMES — semé depuis les traces écrites du dépôt (tâche #706)"];
  L.push(`   ${r.semes.length} baptême(s) inscrit(s), ${r.ignores.length} déjà présent(s).`);
  for (const b of r.semes) L.push(`      · ${b.nom} — ${b.date ?? "date non lue"} — ${b.fichier}:${b.ligne}`);
  if (nonValidesApres !== null) L.push(`   Reste ${nonValidesApres} nom(s) en service sans trace écrite de baptême : ce sont les VRAIS candidats à lui présenter.`);
  L.push("   CE QUI N'EST JAMAIS SEMÉ : un nom sans trace écrite. Le registre garde ce qui est PROUVÉ,");
  L.push("   jamais ce qui est probable — un registre qu'on complète au jugé ne prouve plus rien (L13).");
  return L;
}

// Les noms déjà en service que l'utilisateur n'a jamais validés : la dette de nommage, à purger
// APRÈS la classification — séquence qu'il a posée lui-même, et qui a sa raison : renommer avant
// de savoir dans quel groupe vit un outil produirait un nom qui ne veut plus rien dire ensuite.
export function findNomsNonValides(nomsEnService = [], registreTexte = "") {
  return nomsEnService.filter((n) => !new RegExp(`\\*\\*${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\*\\*`, "i").test(registreTexte));
}

export function formatNomsLines({ provisoires, nonValides, registreExiste }) {
  const L = [];
  L.push(`Noms provisoires oubliés (plus de ${JOURS_AVANT_ALERTE} jours) : ${provisoires.oublies.length}`);
  for (const o of provisoires.oublies) L.push(`   🟠 ${o.fichier} — provisoire depuis ${o.depuis} (${o.jours} j)`);
  if (provisoires.sansDate.length) {
    L.push(`⚠️ ${provisoires.sansDate.length} marque(s) sans date lisible — l'ancienneté n'est pas mesurable, donc AUCUNE alerte n'est rendue plutôt qu'une alerte inventée :`);
    for (const s of provisoires.sansDate) L.push(`   · ${s.fichier}`);
  }
  L.push("");
  L.push(registreExiste
    ? `Noms en service jamais validés par l'utilisateur : ${nonValides.length}`
    : `⚠️ Le registre n'existe pas encore : les ${nonValides.length} noms en service comptent TOUS comme non validés, ce qui est le vrai état des choses et non un artefact.`);
  for (const n of nonValides.slice(0, 40)) L.push(`   · ${n}`);
  if (nonValides.length > 40) L.push(`   · … et ${nonValides.length - 40} autre(s)`);
  return L;
}

function mainGouvernance(root) {
  const fichiers = [];
  for (const d of ["scripts", "docs"]) {
    try { for (const f of readdirSync(join(root, d))) if (/\.(mjs|md)$/.test(f)) fichiers.push(join(d, f)); } catch { /* absent */ }
  }
  const provisoires = findNomsProvisoiresOublies(fichiers, {
    lire: (f) => readFileSync(join(root, f), "utf8"),
    aujourdhui: new Date().toISOString().slice(0, 10) });
  const registreExiste = existsSync(join(root, REGISTRE));
  const registreTexte = registreExiste ? readFileSync(join(root, REGISTRE), "utf8") : "";
  const nomsEnService = readdirSync(join(root, "scripts")).filter((f) => f.endsWith(".mjs")).map((f) => f.replace(/\.mjs$/, ""));
  for (const l of formatNomsLines({ provisoires, nonValides: findNomsNonValides(nomsEnService, registreTexte), registreExiste })) console.log(l);

  // LE SEMIS (2026-09-27, tâche #706). Il s'affiche TOUJOURS, il n'écrit que sous `--semer` : une
  // commande lue à chaque Ronde qui créerait un registre au passage serait une surprise, jamais un
  // service — le même arbitrage que `poserMentionIceberg()`, et pour la même raison.
  const scripts = readdirSync(join(root, "scripts")).filter((f) => f.endsWith(".mjs")).map((f) => join("scripts", f));
  const documentes = findBaptemesDocumentes(scripts, { lire: (f) => readFileSync(join(root, f), "utf8") });
  const aSemer = documentes.filter((b) => !new RegExp(`\\*\\*${b.nom}\\*\\*`, "i").test(registreTexte));
  if (process.argv.includes("--semer")) {
    const r = semerLeRegistre(documentes, { root, dejaLa: registreTexte });
    const apres = readFileSync(join(root, REGISTRE), "utf8");
    for (const l of formatSemisLines(r, { nonValidesApres: findNomsNonValides(nomsEnService, apres).length })) console.log(l);
  } else {
    console.log("");
    console.log(`🕊️  REGISTRE DES BAPTÊMES — ${documentes.length} baptême(s) DOCUMENTÉ(S) dans le dépôt, ${aSemer.length} pas encore au registre.`);
    for (const b of aSemer) console.log(`      · ${b.nom} — ${b.date ?? "date non lue"} — ${b.fichier}:${b.ligne}`);
    if (aSemer.length) console.log("   → `node scripts/agent-des-noms.mjs --semer` les inscrit, en citant la ligne qui le prouve.");
    console.log("   CE QUI N'EST JAMAIS SEMÉ : un nom sans trace écrite. Ceux-là restent la dette, et c'est à lui de les trancher.");
  }
  console.log(`\nHORS PORTÉE : aucun mécanisme ne peut empêcher un nom d'être choisi — il peut seulement rendre impossible de l'OUBLIER. Et la dette ci-dessus se purge APRÈS la classification, jamais avant : renommer un outil dont on ignore encore le groupe produit un nom qui ne voudra plus rien dire.`);

  // LE PLAN D'ACTION (2026-09-25, tâche #863 — reste mesuré de #803/#833).
  //
  // LA CONTRAINTE PROPRE À CET OUTIL, et elle change la forme de son plan : **les noms se
  // choisissent par l'utilisateur, jamais par l'agent.** C'est une règle permanente du projet, pas
  // une prudence de circonstance. Aucun constat d'ici ne peut donc devenir une tâche « renommer
  // X en Y » — ce serait choisir à sa place. Chaque constat devient une tâche de PRÉPARATION : ce
  // qu'il faut avoir sous les yeux pour qu'il puisse trancher vite.
  //
  // Et un constat par FAMILLE, jamais un par nom (leçon de #854) : « 78 noms non validés » se
  // traite, soixante-dix-huit lignes identiques se sautent.
  const nonValides = findNomsNonValides(nomsEnService, registreTexte);
  const exemples = (l, max = 3) => (l.length ? ` — ex. ${l.slice(0, max).join(", ")}${l.length > max ? ` (+${l.length - max})` : ""}` : "");
  const ecarts = [];
  if (provisoires.length) ecarts.push({
    quoi: `${provisoires.length} nom(s) provisoire(s) oublié(s) dans le code${exemples(provisoires.map((p) => p.nom ?? p.fichier ?? String(p)))}`,
    quoiFaire: "les lui présenter pour qu'il tranche — un nom « provisoire » qui survit assez longtemps devient définitif par usure, ce qui est la pire façon de nommer quelque chose",
  });
  if (nonValides.length) ecarts.push({
    quoi: `${nonValides.length} nom(s) en service sur ${nomsEnService.length} jamais validés au registre des baptêmes${registreExiste ? "" : " (le registre n'existe pas encore : le total EST le compte)"}${exemples(nonValides)}`,
    quoiFaire: registreExiste
      ? "préparer la liste pour une session de validation — l'agent ne valide jamais un nom lui-même"
      : "créer le registre des baptêmes, ou décider qu'il n'en faut pas : tant qu'il n'existe pas, ce chiffre mesure son absence et non une dette de nommage",
  });
  const plan = planDactionDepuisEcarts(ecarts, { toolSlug: "agent-des-noms", libelle: (e) => e.quoi, tache: (e) => e.quoiFaire });
  imprimerPlanDaction(plan);
  console.log("HORS PORTÉE de ce plan : aucune de ces tâches ne propose un NOM. Les noms se choisissent par l'utilisateur — ce plan prépare sa décision, il ne la prend jamais.");
}

function mainRenommage(root, ancien, nouveau) {
  if (!ancien || !nouveau) { console.log("Usage : node scripts/agent-des-noms.mjs renommage <ancien> <nouveau>"); return; }
  const { occurrences, mesurable, pourquoi } = collecterOccurrences(ancien, { root });
  if (!mesurable) { console.log(`⚠️ NON MESURABLE — ${pourquoi}`); return; }
  const inv = inventaireDuRenommage(ancien, occurrences);
  for (const l of planDeRenommage(inv, nouveau).lignes) console.log(l);
  console.log("");
  console.log("LES FICHIERS DE CODE À TOUCHER, un par un — c'est la liste qui rend le risque tenable :");
  const codes = inv.par["import-de-code"].concat(inv.par["chemin-de-registre"]);
  const parFichier = new Map();
  for (const o of codes) parFichier.set(o.chemin, (parFichier.get(o.chemin) ?? 0) + 1);
  if (!parFichier.size) console.log("   (aucun) — le nom ne vit dans aucun import ni aucun chemin de registre : le renommage est de la prose.");
  for (const [f, n] of [...parFichier].sort((a, b) => b[1] - a[1])) console.log(`   ${String(n).padStart(4)} × ${f}`);
  console.log("");
  // LES IMPACTS INDIRECTS (2026-09-28, tâche #740), imprimés dans le PLAN et non à part : ils
  // changent le risque du renommage, donc ils se lisent au moment où on le décide — pas après.
  return impactsIndirects(ancien, { root }).then((imp) => {
    for (const l of formatImpactsIndirectsLines(imp)) console.log(l);
    console.log("");
    console.log(`APRÈS COUP, relancer : node scripts/agent-des-noms.mjs verifier ${ancien}`);
    console.log(`   Un renommage à moitié fait est PIRE qu'un renommage pas fait : les deux noms coexistent et personne ne sait lequel fait foi.`);
  });
}

// ============================================================================================
// LES HOMONYMES EXPORTÉS — deux fichiers, un seul nom (2026-09-25, tâche #756)
// ============================================================================================
// POURQUOI CET AGENT PLUTÔT QU'UN AUTRE : l'Article 27 nomme la dette de reprise « un nom propre
// sans définition atteignable ». Un nom qui en a DEUX est le même défaut en pire — une IA qui lit
// « DOMAINES » dans une liste d'import ne peut pas savoir de quoi on parle, et rien ne l'avertit.
// C'est du nommage, donc c'est ici.
//
// TROIS ÉTATS, JAMAIS DEUX — et c'est toute la valeur de la mesure, parce que la version naïve
// rend 36 alertes dont l'immense majorité n'en sont pas :
//   · DÉLÉGATION      — un fichier RE-EXPORTE le nom d'un autre. Ce n'est pas un homonyme du tout :
//                       c'est la même chose, relayée, exactement ce que ce projet demande de faire.
//   · CONVENTION      — le nom est exporté par plusieurs fichiers mais importé par AUCUN autre
//                       (`OUTIL`, `SCRIPT_PATH`, `REGISTRE`...). Chaque outil nomme sa propre
//                       constante de la même façon ; personne ne peut les confondre puisque
//                       personne ne les croise. À lister, jamais à alerter.
//   · COLLISION       — exporté par plusieurs fichiers ET importé ailleurs. Là seulement, un
//                       lecteur peut prendre l'un pour l'autre, et c'est la vraie dette.
//
// IL NE RENOMME RIEN, et c'est la même discipline que tout cet agent : il mesure, il trie, il
// prépare. Le nom qui survit est un NOMMAGE, donc une décision de l'utilisateur (Article 20bis).
export function inventorierLesExports(fichiers = [], { lire } = {}) {
  if (typeof lire !== "function") {
    return { mesurable: false, pourquoi: "aucun lecteur de fichier fourni — rendre « zéro homonyme » sans avoir pu lire une seule ligne dirait exactement ce que dit un dépôt parfaitement propre" };
  }
  const exports = new Map();      // nom -> Set(fichier qui le DÉFINIT)
  const reexports = new Map();    // fichier -> Set(nom qu'il relaie depuis un autre)
  const imports = new Map();      // nom -> Set(fichier qui l'IMPORTE d'ailleurs)
  let lus = 0;
  for (const f of fichiers) {
    const src = lire(f);
    if (typeof src !== "string") continue;
    lus += 1;
    for (const m of src.matchAll(/^export\s+(?:const|function|class|let)\s+([A-Za-z_$][\w$]*)/gm)) {
      (exports.get(m[1]) ?? exports.set(m[1], new Set()).get(m[1])).add(f);
    }
    // `export { A } from "./x.mjs"` définit ET relaie ; `import { A } from "./x.mjs"` ne fait qu'importer.
    for (const m of src.matchAll(/^(export|import)\s*\{([^}]*)\}\s*from\s*["'][^"']*["']/gm)) {
      for (const brut of m[2].split(",")) {
        const nom = brut.trim().split(/\s+as\s+/)[0].trim();
        if (!nom) continue;
        (imports.get(nom) ?? imports.set(nom, new Set()).get(nom)).add(f);
        if (m[1] === "export") {
          (exports.get(nom) ?? exports.set(nom, new Set()).get(nom)).add(f);
          (reexports.get(f) ?? reexports.set(f, new Set()).get(f)).add(nom);
        }
      }
    }
  }
  if (!lus) return { mesurable: false, pourquoi: "aucun fichier n'a pu être lu — voir ci-dessus, un dénominateur vide se lit comme un dépôt propre" };
  return { mesurable: true, lus, exports, reexports, imports };
}

export function findHomonymesExportes(fichiers = [], { lire } = {}) {
  const inv = inventorierLesExports(fichiers, { lire });
  if (!inv.mesurable) return inv;
  const delegations = [], conventions = [], collisions = [];
  for (const [nom, definisPar] of inv.exports) {
    if (definisPar.size < 2) continue;
    const relais = [...definisPar].filter((f) => inv.reexports.get(f)?.has(nom));
    if (relais.length) { delegations.push({ nom, fichiers: [...definisPar].sort(), relais: relais.sort() }); continue; }
    // « importé ailleurs » : par un fichier qui ne le définit pas lui-même. Un outil qui importe son
    // propre nom n'existe pas, mais un fichier peut définir X et importer un X homonyme — ce cas-là
    // est justement une collision, pas une convention.
    const importePar = [...(inv.imports.get(nom) ?? [])].filter((f) => !definisPar.has(f) || inv.reexports.get(f)?.has(nom));
    if (importePar.length) collisions.push({ nom, fichiers: [...definisPar].sort(), importePar: importePar.sort() });
    else conventions.push({ nom, fichiers: [...definisPar].sort() });
  }
  const tri = (a, b) => b.fichiers.length - a.fichiers.length || a.nom.localeCompare(b.nom);
  return { mesurable: true, lus: inv.lus, delegations: delegations.sort(tri), conventions: conventions.sort(tri), collisions: collisions.sort(tri) };
}

export function formatHomonymesLines(h, { max = 12 } = {}) {
  if (!h?.mesurable) return [`⚠️ NON MESURÉ — ${h?.pourquoi ?? "raison inconnue"}`];
  const L = [`${h.lus} fichier(s) lu(s).`];
  L.push("");
  if (h.collisions.length) {
    L.push(`🔴 ${h.collisions.length} COLLISION(S) — le même nom défini dans plusieurs fichiers ET importé ailleurs.`);
    L.push(`   C'est la seule des trois catégories qui soit une dette : un lecteur qui voit ce nom dans`);
    L.push(`   une liste d'import ne peut pas savoir duquel on parle, et rien ne l'en avertit.`);
    for (const c of h.collisions.slice(0, max)) L.push(`   ${c.nom} — défini par ${c.fichiers.join(", ")} · importé par ${c.importePar.join(", ")}`);
    if (h.collisions.length > max) L.push(`   … et ${h.collisions.length - max} autre(s)`);
  } else L.push("✅ Aucune collision : aucun nom défini deux fois n'est importé ailleurs.");
  L.push("");
  L.push(`📗 ${h.conventions.length} convention(s) locale(s) — même nom, plusieurs fichiers, importé par personne.`);
  L.push(`   Chaque outil nomme sa propre constante de la même façon (OUTIL, SCRIPT_PATH, REGISTRE…).`);
  L.push(`   Personne ne peut les confondre puisque personne ne les croise : à connaître, jamais à corriger.`);
  for (const c of h.conventions.slice(0, max)) L.push(`   ${c.nom} — ${c.fichiers.join(", ")}`);
  if (h.conventions.length > max) L.push(`   … et ${h.conventions.length - max} autre(s)`);
  L.push("");
  L.push(`🔗 ${h.delegations.length} délégation(s) — un fichier relaie le nom d'un autre. Ce n'est pas un homonyme :`);
  L.push(`   c'est la même chose, relayée, exactement ce que ce projet demande de faire.`);
  for (const d of h.delegations.slice(0, max)) L.push(`   ${d.nom} — ${d.fichiers.join(", ")} (relais : ${d.relais.join(", ")})`);
  L.push("");
  L.push("HORS PORTÉE : quel nom survit à une collision est un NOMMAGE, donc une décision de l'utilisateur.");
  L.push("Cet agent mesure, trie et prépare — il ne renomme jamais de lui-même.");
  return L;
}

function mainHomonymes(root) {
  const dossier = join(root, "scripts");
  let fichiers = [];
  try { fichiers = readdirSync(dossier).filter((f) => f.endsWith(".mjs")).sort(); } catch { fichiers = []; }
  const h = findHomonymesExportes(fichiers, { lire: (f) => { try { return readFileSync(join(dossier, f), "utf8"); } catch { return undefined; } } });
  console.log("=== LES HOMONYMES EXPORTÉS — trois états, jamais deux ===\n");
  for (const l of formatHomonymesLines(h)) console.log(l);
}

function mainVerifier(root, ancien) {
  if (!ancien) { console.log("Usage : node scripts/agent-des-noms.mjs verifier <ancien>"); return; }
  const { occurrences, mesurable, pourquoi } = collecterOccurrences(ancien, { root });
  if (!mesurable) { console.log(`⚠️ NON MESURABLE — ${pourquoi}`); return; }
  const v = verifierApresRenommage(ancien, occurrences);
  console.log(v.propre ? `✅ ${v.pourquoi}` : `🔴 ${v.pourquoi}`);
  for (const o of v.restesVivants.slice(0, 40)) console.log(`   ${o.chemin}:${o.numero}`);
  if (v.restesVivants.length > 40) console.log(`   … et ${v.restesVivants.length - 40} autre(s)`);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// LES IMPACTS INDIRECTS D'UN RENOMMAGE (2026-09-28, tâche #740)
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// CE QUE LE PLAN DE RENOMMAGE COUVRAIT, ET C'ÉTAIT ÉTROIT : l'impact TECHNIQUE seul — imports,
// commandes, chemins, mentions. Tout ce qui casse bruyamment.
//
// CE QU'IL NE DISAIT PAS, ET C'EST CE QUI FAIT MAL : un outil renommé **perd sa mémoire**. Le
// compteur d'usage est indexé par slug, les registres vivent dans `docs/<slug>/`, les objectifs
// chiffrés et les lignes de KPI portent le slug. Le lendemain d'un renommage, l'outil ressort
// « jamais sollicité » et « tout neuf » — ce qui fausse d'un coup CASSANDRA-RH (qui lit l'usage),
// CLEAN-DIRTY-OLD (qui lit l'ancienneté) et le suivi des objectifs.
//
// **RIEN NE CASSE, ET C'EST BIEN LE PROBLÈME.** Un import brisé se voit à la première exécution ;
// une mémoire perdue ne se voit jamais — elle se lit comme un outil neuf, ce qui est exactement
// l'inverse de la vérité. L'Article 27 le dit autrement : ce qui n'est plus atteignable n'existe
// plus.
//
// LES SOURCES SE LISENT CHEZ data-archangel, jamais recopiées ici (Article 24) : c'est lui qui tient
// l'inventaire des données du dépôt, et un registre de plus demain sera pris en compte sans qu'on y
// pense. On ne regarde QUE les données — un slug dans du CODE relève de l'impact technique, déjà
// couvert par le plan de renommage, et le compter deux fois gonflerait l'alarme sans rien ajouter.
export async function impactsIndirects(slug, { root = process.cwd(), lire = readFileSync } = {}) {
  if (!slug) return { mesurable: false, pourquoi: "aucun slug donné : rien à mesurer" };
  let sources = [];
  try {
    const { mapReaders } = await import("./data-archangel.mjs");
    sources = mapReaders({ root }).sources ?? [];
  } catch { /* le rapport dira PAS MESURÉ plutôt que d'inventer un zéro */ }
  if (!sources.length) {
    return { mesurable: false, slug,
      pourquoi: "l'inventaire des données n'a pas pu être lu : on ne sait pas ce que ce renommage ferait perdre, ce qui n'est PAS la même chose que « il ne ferait rien perdre »" };
  }
  const touches = [];
  let lues = 0;
  for (const s of sources) {
    const chemin = join(root, s.id);
    let contenu = null;
    try {
      if (!existsSync(chemin)) continue;
      // Un DOSSIER porte le slug dans son nom ; un FICHIER le porte dans son contenu. Les deux
      // comptent, et pour des raisons différentes : l'un est un registre entier qui devient
      // orphelin, l'autre des lignes qui cessent d'être rattachées.
      lues += 1;
      if (statSync(chemin).isDirectory()) {
        if (s.id.includes(slug)) touches.push({ source: s.id, nature: s.nature, quoi: "registre ENTIER — son dossier porte le nom : renommé, il devient un dossier orphelin et l'outil repart sans historique", occurrences: null });
        continue;
      }
      contenu = lire(chemin, "utf8");
    } catch { continue; }
    const n = (String(contenu).match(new RegExp(slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length;
    if (n) touches.push({ source: s.id, nature: s.nature, quoi: `${n} occurrence(s) du slug dans une donnée : elles ne suivront PAS le renommage`, occurrences: n });
  }
  // AUCUNE SOURCE LUE N'EST JAMAIS « RIEN À PERDRE » (leçons L5/L11). L'inventaire est déclaré dans
  // le CODE de data-archangel : il répond donc même sur une racine vide, et sans ce garde-fou la
  // fonction rendrait « ce renommage ne fait perdre aucune mémoire » alors qu'elle n'a rien pu
  // ouvrir. Un faux vert ici autorise un renommage qui détruit un historique.
  if (!lues) {
    return { mesurable: false, slug, touches: [],
      pourquoi: `${sources.length} source(s) sont déclarées et AUCUNE n'a pu être ouverte sous cette racine : on ne sait pas ce que ce renommage ferait perdre, ce qui n'est PAS « il ne ferait rien perdre »` };
  }
  return {
    mesurable: true, slug, touches, sourcesLues: lues,
    total: touches.reduce((a, t) => a + (t.occurrences ?? 1), 0),
    pourquoi: touches.length
      ? `${touches.length} source(s) de données portent ce slug : un renommage les laisse derrière, et l'outil ressort « jamais sollicité » et « tout neuf » le lendemain`
      : "aucune donnée du dépôt ne porte ce slug : ce renommage ne fait perdre aucune mémoire",
    horsPortee: "Elle ne regarde QUE les données. Le slug dans du CODE relève de l'impact technique, déjà couvert par le plan de renommage, et le compter ici gonflerait l'alarme sans rien ajouter. Elle ne dit pas non plus COMMENT migrer une mémoire — seulement ce qui serait perdu si on ne le faisait pas.",
  };
}

export function formatImpactsIndirectsLines(r = {}) {
  if (!r.mesurable) return [`⬜ IMPACTS INDIRECTS : PAS MESURÉS — ${r.pourquoi}`];
  const L = ["", `--- CE QUE « ${r.slug} » PERDRAIT EN CHANGEANT DE NOM (impacts INDIRECTS) ---`];
  L.push("  Rien ne casse, et c'est le problème : un import brisé se voit à la première exécution,");
  L.push("  une mémoire perdue se lit comme un outil neuf — l'inverse exact de la vérité.");
  if (!r.touches.length) { L.push(`  ✅ ${r.pourquoi}`); return L; }
  for (const t of r.touches) L.push(`  🟠 ${t.source} (${t.nature}) — ${t.quoi}`);
  L.push(`  → ${r.pourquoi}`);
  L.push(`  HORS PORTÉE : ${r.horsPortee}`);
  return L;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// LA PRÉSENTATION PAR FAMILLE (2026-09-28, tâche #1020)
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// SA CONTRAINTE DE FORME, mot pour mot, et c'est elle qui commande toute cette fonction : « je ne
// fais pas des noms au cas par cas, je crée des séries de noms à l'intérieur d'une même famille ».
// Une liste de soixante-dix-sept lignes à trancher une par une serait donc INUTILISABLE pour lui,
// même exacte — et c'est très exactement le genre de livrable qu'on produit en croyant bien faire.
//
// CE QU'ELLE NE FAIT PAS, ET CE N'EST PAS NÉGOCIABLE : elle ne propose AUCUN nom. Les noms se
// choisissent par l'utilisateur, c'est une règle permanente du projet, et un agent qui proposerait
// soixante-dix-sept noms choisirait à sa place. Elle PRÉPARE sa décision : le groupe, ce que chaque
// outil fait, et combien de noms ce groupe attend.
//
// LA SÉQUENCE QU'IL A POSÉE ET QUI TIENT : cette purge se fait APRÈS la classification, jamais
// avant — renommer un outil dont on ignore encore le groupe produit un nom qui ne voudra plus rien
// dire ensuite. La classification est close depuis le 2026-09-26, le verrou est donc levé.
export async function presentationParFamille({ root = process.cwd(), lire = readFileSync } = {}) {
  const { AGENT_CATEGORIES, familleDeLaCategorie } = await import("./lib-shell.mjs");
  const registreTexte = existsSync(join(root, REGISTRE)) ? lire(join(root, REGISTRE), "utf8") : "";
  const enService = readdirSync(join(root, "scripts")).filter((f) => f.endsWith(".mjs")).map((f) => f.replace(/\.mjs$/, ""));
  const nonValides = findNomsNonValides(enService, registreTexte);
  if (!enService.length) return { mesurable: false, pourquoi: "aucun script lu : rien à présenter, ce qui n'est pas la même chose que « tout est validé »" };
  const familles = new Map();
  for (const slug of nonValides) {
    // Un outil sans catégorie déclarée n'est PAS rangé d'office ailleurs : il forme son propre
    // groupe nommé, parce que « je ne sais pas de quelle famille il est » est une information utile
    // à qui doit choisir une série — la cacher ferait choisir sur un groupe incomplet.
    const famille = familleDeLaCategorie(AGENT_CATEGORIES[slug]) ?? "(sans famille déclarée)";
    if (!familles.has(famille)) familles.set(famille, []);
    familles.get(famille).push(slug);
  }
  return {
    mesurable: true,
    total: enService.length, nonValides: nonValides.length, valides: enService.length - nonValides.length,
    familles: [...familles.entries()].map(([famille, slugs]) => ({ famille, slugs: slugs.sort(), combien: slugs.length }))
      .sort((a, b) => b.combien - a.combien),
    horsPortee: "Elle range et elle compte ; elle ne propose AUCUN nom. Et elle ne voit que les noms de fichiers du dossier scripts/ — un outil dont le nom d'usage diffère de son nom de fichier lui apparaît sous son nom de fichier.",
  };
}

export function formatPresentationLines(r = {}) {
  if (!r.mesurable) return [`🚨 PRÉSENTATION PAR FAMILLE : PAS MESURÉE — ${r.pourquoi}`];
  const L = [`=== LES NOMS EN ATTENTE DE BAPTÊME, PAR FAMILLE — ${r.nonValides} sur ${r.total} (${r.valides} déjà validés) ===`, ""];
  L.push("Présentés PAR FAMILLE et non un par un, parce que la règle du projet est une SÉRIE de noms");
  L.push("à l'intérieur d'une même famille. Une liste de 77 lignes à trancher une par une serait");
  L.push("exacte et inutilisable.");
  L.push("");
  for (const f of r.familles) {
    L.push(`▸ ${f.famille} — ${f.combien} nom(s) à baptiser`);
    for (let i = 0; i < f.slugs.length; i += 4) L.push(`    ${f.slugs.slice(i, i + 4).join(" · ")}`);
    L.push("");
  }
  L.push("CE QUI N'EST PAS PROPOSÉ ICI, ET C'EST VOULU : aucun nom. Les noms se choisissent par");
  L.push("l'utilisateur ; cette présentation prépare sa décision, elle ne la prend jamais.");
  L.push(`HORS PORTÉE : ${r.horsPortee}`);
  return L;
}

function main() {
  const root = process.cwd();
  const [cmd, a, b] = process.argv.slice(2);
  // LE GABARIT PARTAGÉ (2026-09-28, tâche #1020). Le titre était écrit en dur et l'avertissement
  // d'inexactitude imprimé à part, hors du cadre : deux des trois indices que pure-gold-unity
  // relève. `printReportHeader()` place les deux au bon endroit et, surtout, il porte la version,
  // l'état du code et la source — que chaque rapport écrivait autrement, ou pas du tout.
  printReportHeader({ tool: "agent-des-noms", title: "L'AGENT DES NOMS — l'utilisateur baptise, le mécanisme se souvient", scriptPath: "scripts/agent-des-noms.mjs" });
  recordCliUsage("agent-des-noms", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });   // #763 : sans cette ligne, le compteur affichait 0 alors que l'outil tournait — un compteur empêché de compter rend exactement ce que rend un compteur qui n'a rien à compter
  if (cmd === "renommage") return mainRenommage(root, a, b);
  if (cmd === "verifier") return mainVerifier(root, a);
  if (cmd === "homonymes") return mainHomonymes(root);
  if (cmd === "familles") return presentationParFamille({ root }).then((r) => { for (const l of formatPresentationLines(r)) console.log(l); });
  mainGouvernance(root);
  console.log(`\nAUTRES COMMANDES : renommage <ancien> <nouveau> (le plan, avant) · verifier <ancien> (le reste, après) · homonymes (un nom, deux définitions) · familles (les noms en attente, groupés pour une décision par série)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
