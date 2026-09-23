// THE-EQUALIZER (2026-09-23, chantier 5 du plan de nuit) — le vérificateur « tout est-il à niveau ? ».
//
// SA VOCATION, dans les mots de l'utilisateur : « qui se charge de vérifier par ailleurs que tout
// est à niveau [...] je parle de tout mettre à niveau aussi par rapport aux standards, aux formats,
// gabarits, etc. TOUT TOUT doit être à niveau, tu vois la profondeur ? »
//
// CE QU'IL EST, ET SURTOUT CE QU'IL N'EST PAS. C'est un RASSEMBLEUR, choisi comme tel en fenêtre de
// calibrage : « il n'ajoute aucun scan : il appelle les contrôleurs existants et rend UN verdict
// unique par domaine, en nommant ce qui n'est couvert par personne ». Il n'a donc aucun détecteur
// à lui. Chaque ligne de son rapport vient d'un contrôleur qui existait déjà et qui continuera de
// tourner sans lui.
//
// POURQUOI UN RASSEMBLEUR APPORTE QUELQUE CHOSE PLUTÔT QUE DE REDIRE. Vingt contrôleurs qui
// répondent chacun « ma part va bien » ne répondent jamais « tout va bien » : personne ne détient
// la liste de ce qui devrait être vérifié, donc personne ne peut voir qu'une case n'a PAS de
// contrôleur. C'est exactement le défaut de cette session, dans sa deuxième forme : une
// vérification qui partage l'angle mort de ce qu'elle vérifie (leçon L10).
//
// SA SOURCE DE VÉRITÉ EST UN DOCUMENT, JAMAIS UNE LISTE DANS CE FICHIER (Article 24). Les exigences
// vivent dans `docs/referentiel/standards.md` et sont LUES à l'exécution. Ajouter une ligne au
// tableau de ce document suffit à ce que THE-EQUALIZER la prenne en compte — aucune modification de code.
// Le jour où ce fichier-ci énumérerait les exigences, il deviendrait la copie manuelle que
// l'Article 24 interdit, et il se périmerait au premier standard ajouté.
//
// CE QU'IL NE FAIT JAMAIS : corriger, et bloquer. Il rend un verdict ; la décision reste humaine
// (même calibrage que god-of-all-process, Article 28 : signaler fort, ne jamais bloquer).

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReportHeader, planDactionDepuisEcarts, PLAN_ACTION_TITRE, dateEnToutesLettres } from "./report-template.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

export const STANDARDS_PATH = "docs/referentiel/standards.md";

// LES QUATRE DOMAINES DE VERDICT — ceux que l'utilisateur a nommés lui-même (« code / Agence / jeu /
// documents »). Ce ne sont PAS les quatre niveaux du référentiel : un niveau dit à quoi une exigence
// s'applique (la forme d'un rapport, les documents d'un outil...), un domaine dit de quoi on rend
// compte. Deux niveaux peuvent donc tomber dans le même domaine, et c'est le cas.
//
// « jeu » n'a AUCUNE exigence, et c'est délibéré plutôt qu'un oubli : la qualité du jeu relève de la
// charte et d'EL-PROFESSOR, jamais d'un standard d'outillage. Le domaine existe quand même dans
// cette table pour que le verdict le DISE — un domaine absent de la table serait indiscernable d'un
// domaine oublié.
export const DOMAINES = {
  agence: { libelle: "l'Agence", niveaux: ["FORME", "CAPACITÉS"], quoi: "ce que les outils produisent et ce qu'ils savent faire" },
  documents: { libelle: "les documents", niveaux: ["DOCUMENTS"], quoi: "ce que chaque outil possède comme documentation" },
  code: { libelle: "le code", niveaux: ["CODE"], quoi: "l'état du code lui-même" },
  jeu: { libelle: "le jeu", niveaux: [], quoi: "la qualité narrative", horsPerimetre: "relève de la charte et d'EL-PROFESSOR, jamais d'un standard d'outillage" },
};

// LES TROIS ÉTATS D'UNE EXIGENCE, lus dans la colonne « État » du référentiel. Même discipline à
// trois branches que partout ailleurs dans ce projet (retenu/écarté/à trancher ;
// mesuré/pas mesuré/pas mesurable) : « pas vérifié » et « partiellement vérifié » ne se confondent
// jamais avec « vérifié », parce que c'est précisément cette confusion qui fabrique les faux verts.
export const ETATS_EXIGENCE = {
  "✅": "mecanique",
  "⚠️": "non-verifiee",
};

// parseStandards() — lit les tableaux d'exigences du référentiel.
//
// LE NIVEAU EST LU, JAMAIS DEVINÉ, et cette phrase a été payée le jour même. Le premier jet cherchait
// « le premier mot en majuscules » du titre : sur « NIVEAU 2 — SES PROPRES documents » il a lu
// « SES », ce niveau n'a correspondu à aucun domaine, et les sept exigences D1–D7 ont disparu du
// rapport SANS QUE RIEN NE LE SIGNALE — le verdict restait d'apparence normale. Le titre porte
// désormais un nom explicite (`NIVEAU n — NOM : explication`) et un titre qui ne le porte pas
// déclenche une erreur : sur un outil dont le métier est de repérer ce que personne ne vérifie,
// sauter une section en silence est le pire défaut possible.
export const MOTIF_NIVEAU = /^###\s+NIVEAU\s+\d+\s+[—-]\s+([A-ZÉÈÀÙÎÔÛÇ][A-ZÉÈÀÙÎÔÛÇ' -]*[A-ZÉÈÀÙÎÔÛÇ])\s*:/;

export function parseStandards(markdown = "") {
  const exigences = [];
  let niveau = null;
  String(markdown).split("\n").forEach((ligne, i) => {
    if (/^###\s+NIVEAU\b/.test(ligne)) {
      const titre = ligne.match(MOTIF_NIVEAU);
      if (!titre) {
        throw new Error(`${STANDARDS_PATH}:${i + 1} — titre de niveau illisible : « ${ligne.trim()} ». Forme attendue : « ### NIVEAU n — NOM : explication », le NOM en majuscules étant ce qui rattache ce tableau à un domaine de verdict.`);
      }
      niveau = titre[1].trim();
      return;
    }
    if (!niveau) return;
    const cellules = ligne.split("|").map((c) => c.trim());
    // Une ligne de tableau d'exigence : | id | exigence | vérifiée par | état |, donc 6 cellules
    // avec les deux vides des bords. L'identifiant est une lettre suivie d'un chiffre — ni le
    // séparateur `|---|` ni l'en-tête `| # |` ne matchent.
    if (cellules.length !== 6) return;
    const [, id, exigence, verificateur, etat] = cellules;
    if (!/^[A-Z]\d+$/.test(id)) return;
    exigences.push({
      id, niveau, exigence, verificateur,
      etat: ETATS_EXIGENCE[[...Object.keys(ETATS_EXIGENCE)].find((c) => etat.startsWith(c))] ?? "non-verifiee",
      etatBrut: etat,
    });
  });
  return exigences;
}

export function loadStandards({ root = ROOT, readFileImpl = readFileSync } = {}) {
  return parseStandards(readFileImpl(join(root, STANDARDS_PATH), "utf8"));
}

// ————————————————————————————————————————————————————————————————————————
// LE CONTRÔLE QUI COMPTE LE PLUS : LE VÉRIFICATEUR FANTÔME
// ————————————————————————————————————————————————————————————————————————
//
// Une exigence qui ANNONCE un vérificateur inexistant est pire qu'une exigence qui déclare n'en
// avoir aucun : la première rassure à tort, la seconde avertit. C'est mot pour mot ce que
// `auditLecons()` vérifie pour les porteurs de leçons (leçon L7), et le même raisonnement vaut ici
// pour la même raison — un référentiel ne vaut que si ce qu'il promet existe.
//
// Ce qu'on peut vérifier mécaniquement, et rien de plus : qu'un nom de fonction cité en `dos
// d'accent` est bien exporté quelque part dans scripts/. On ne vérifie PAS qu'un nom d'outil en
// prose (« ARGUS », « CASSANDRA-RH ») vérifie réellement cette exigence-là : ça demanderait de lire
// le sens de son code. Cette limite est déclarée plutôt que masquée par une heuristique de mots.
export function fonctionsCitees(verificateur = "") {
  return [...String(verificateur).matchAll(/`([A-Za-z_][A-Za-z0-9_]*)`/g)].map((m) => m[1]);
}

export function exportsDuDepot({ root = ROOT, listDirImpl = readdirSync, readFileImpl = readFileSync } = {}) {
  const noms = new Set();
  for (const fichier of listDirImpl(join(root, "scripts")).filter((f) => f.endsWith(".mjs"))) {
    const texte = readFileImpl(join(root, "scripts", fichier), "utf8");
    for (const m of texte.matchAll(/^export\s+(?:async\s+)?(?:function|const|class)\s+([A-Za-z_][A-Za-z0-9_]*)/gm)) noms.add(m[1]);
  }
  return noms;
}

export function findVerificateursFantomes(exigences = [], exports = new Set()) {
  const fantomes = [];
  for (const e of exigences) {
    const manquantes = fonctionsCitees(e.verificateur).filter((f) => !exports.has(f));
    if (manquantes.length) fantomes.push({ ...e, manquantes });
  }
  return fantomes;
}

// ————————————————————————————————————————————————————————————————————————
// LE VERDICT PAR DOMAINE
// ————————————————————————————————————————————————————————————————————————
//
// UN SEUL verdict par domaine, c'était la demande. Le piège évident serait de le rendre vert dès
// qu'aucune exigence n'est en défaut — or une exigence NON VÉRIFIÉE n'est pas une exigence tenue,
// c'est une exigence dont on ignore l'état. Le verdict distingue donc trois cas, jamais deux.
export const VERDICTS = {
  couvert: { icone: "✅", phrase: "toutes les exigences ont un vérificateur mécanique" },
  partiel: { icone: "⚠️", phrase: "des exigences déclarées ne sont vérifiées par personne" },
  fantome: { icone: "🔴", phrase: "une exigence annonce un vérificateur qui n'existe pas" },
  vide: { icone: "➖", phrase: "aucune exigence déclarée dans ce domaine" },
};

export function verdictParDomaine(exigences = [], { domaines = DOMAINES, fantomes = [] } = {}) {
  const idsFantomes = new Set(fantomes.map((f) => f.id));
  return Object.entries(domaines).map(([cle, d]) => {
    const miennes = exigences.filter((e) => d.niveaux.includes(e.niveau));
    const nonVerifiees = miennes.filter((e) => e.etat !== "mecanique");
    const aFantome = miennes.some((e) => idsFantomes.has(e.id));
    const verdict = aFantome ? "fantome"
      : miennes.length === 0 ? "vide"
      : nonVerifiees.length ? "partiel"
      : "couvert";
    return {
      cle, libelle: d.libelle, quoi: d.quoi, horsPerimetre: d.horsPerimetre ?? null,
      total: miennes.length, verifiees: miennes.length - nonVerifiees.length,
      nonVerifiees: nonVerifiees.map((e) => ({ id: e.id, exigence: e.exigence })),
      fantomes: miennes.filter((e) => idsFantomes.has(e.id)).map((e) => e.id),
      verdict,
    };
  });
}

// ————————————————————————————————————————————————————————————————————————
// LA PROFONDEUR : LE RETARD OUTIL PAR OUTIL
// ————————————————————————————————————————————————————————————————————————
//
// « TOUT TOUT doit être à niveau » ne se satisfait pas d'un verdict par domaine : un domaine peut
// être parfaitement couvert par ses contrôleurs pendant qu'un outil précis reste en retard sur la
// moitié d'entre eux. C'est le trou que l'Article 24 nomme noir sur blanc et laisse ouvert : « un
// outil qui REJOINT l'équipe hérite de tout ce que l'équipe sait déjà faire » — aujourd'hui les
// garde-fous DÉTECTENT l'oubli au lieu de l'ÉVITER, un registre à la fois.
//
// THE-EQUALIZER ne comble pas ce trou (il ne corrige rien), mais il le rend VISIBLE d'un coup d'œil, ce
// que personne ne faisait : `checkAgentOnboarding()` répond pour UN outil quand on l'interroge,
// jamais pour l'équipe entière sans qu'on le lui demande outil par outil.
//
// Il délègue intégralement : le classement des écarts reste celui de LE-COORDINATEUR, jamais un
// second jugement recalculé ici qui pourrait diverger du premier.
// THE-EQUALIZER NE REFAIT PAS CETTE BOUCLE, IL L'APPELLE. `integrationAudit()` (LE-COORDINATEUR) parcourt
// déjà la table maîtresse membre par membre et rend, pour chacun, la liste de ses écarts — avec deux
// choses qu'une seconde boucle écrite ici aurait perdues : un `mesurable: false` explicite quand la
// table est illisible (jamais un « tout va bien » fabriqué par une liste vide), et la distinction
// entre un membre incomplet et un membre non vérifiable. Mon premier jet réécrivait cette boucle et
// a immédiatement produit dix-sept faux écarts.
//
// Ce que THE-EQUALIZER ajoute par-dessus, et c'est tout : le rattacher aux exigences du référentiel, pour
// qu'un retard d'intégration cesse d'être une liste à part et devienne un domaine en défaut.

// ————————————————————————————————————————————————————————————————————————
// LES CONSTATS (Article 28 : un rapport n'est fini que quand ses constats sont devenus des tâches)
// ————————————————————————————————————————————————————————————————————————
export function constatsANiveau({ verdicts = [], fantomes = [], integration = null } = {}) {
  const constats = [];
  for (const f of fantomes) {
    constats.push({ message: `${f.id} annonce ${f.manquantes.map((n) => `\`${n}\``).join(", ")} comme vérificateur — cette fonction n'existe nulle part dans scripts/`, pourquoi: "un vérificateur fantôme rassure à tort, ce qui est pire qu'une absence déclarée" });
  }
  for (const v of verdicts.filter((v) => v.verdict === "partiel")) {
    for (const e of v.nonVerifiees) {
      constats.push({ message: `${e.id} (${v.libelle}) — « ${e.exigence} » n'est vérifiée par personne`, pourquoi: "une exigence sans vérificateur n'est pas tenue, elle est seulement espérée" });
    }
  }
  for (const m of integration?.incomplets ?? []) {
    constats.push({ message: `${m.nom} — ${m.gaps.length} écart(s) d'intégration : ${m.gaps[0]}${m.gaps.length > 1 ? " (et suivants)" : ""}`, pourquoi: "un outil en retard sur l'équipe ne bénéficie pas de ce que l'équipe sait déjà faire (Article 24)" });
  }
  for (const m of integration?.nonVerifiables ?? []) {
    constats.push({ message: `${m.nom} — son intégration n'a pas pu être vérifiée : ${m.raison}`, pourquoi: "une vérification impossible n'est jamais une vérification réussie" });
  }
  return constats;
}

// ————————————————————————————————————————————————————————————————————————
// LE RAPPORT
// ————————————————————————————————————————————————————————————————————————
export function formatANiveau({ exigences = [], verdicts = [], fantomes = [], integration = null, dateLabel } = {}) {
  const l = [];
  l.push("SCAN >> RAPPORTS >> ANALYSE >> PLAN D'ACTION >> QUESTIONS >> TÂCHES DE TRAVAIL");
  l.push("");
  l.push(`Référentiel lu : ${STANDARDS_PATH} — ${exigences.length} exigence${exigences.length > 1 ? "s" : ""} déclarée${exigences.length > 1 ? "s" : ""}.`);
  if (dateLabel) l.push(`Relevé du ${dateLabel}.`);
  l.push("");
  l.push("— UN VERDICT PAR DOMAINE —");
  for (const v of verdicts) {
    const { icone, phrase } = VERDICTS[v.verdict];
    l.push(`${icone} ${v.libelle} (${v.quoi}) : ${v.total ? `${v.verifiees}/${v.total} exigences vérifiées mécaniquement` : phrase}`);
    if (v.horsPerimetre) l.push(`   hors périmètre assumé — ${v.horsPerimetre}`);
    for (const e of v.nonVerifiees) l.push(`   ⚠️  ${e.id} — ${e.exigence}`);
    for (const id of v.fantomes) l.push(`   🔴 ${id} — vérificateur annoncé introuvable`);
  }

  // LES NIVEAUX ORPHELINS — un tableau du référentiel qui ne tombe dans AUCUN domaine. Sans cette
  // ligne, sept exigences ont disparu d'un rapport d'apparence normale (cf. parseStandards) : un
  // domaine qu'on n'a pas su rattacher doit crier, jamais s'omettre.
  const rattaches = new Set(Object.values(DOMAINES).flatMap((d) => d.niveaux));
  const orphelins = [...new Set(exigences.map((e) => e.niveau))].filter((n) => !rattaches.has(n));
  if (orphelins.length) {
    l.push("");
    l.push(`🔴 NIVEAUX ORPHELINS — ${orphelins.join(", ")} : ces exigences ne sont rattachées à aucun domaine de verdict, donc comptées nulle part. À rattacher dans DOMAINES (scripts/the-equalizer.mjs) ou à renommer dans le référentiel.`);
  }

  l.push("");
  l.push("— LE RETARD OUTIL PAR OUTIL (délégué à integrationAudit, LE-COORDINATEUR) —");
  if (!integration) {
    l.push("Pas mesuré à ce passage (le contexte d'intégration n'a pas pu être rassemblé) — jamais à lire comme « aucun retard ».");
  } else if (!integration.mesurable) {
    l.push(`Pas mesurable : ${integration.raison}`);
  } else {
    l.push(`${integration.membresVerifies - integration.incomplets.length}/${integration.membresVerifies} membres certifiables sans aucun écart d'intégration.`);
    for (const m of integration.incomplets) l.push(`   ⚠️  ${m.nom} — ${m.gaps.length} écart(s) : ${m.gaps.join(" · ")}`);
    for (const m of integration.nonVerifiables) l.push(`   ❓ ${m.nom} — non vérifiable : ${m.raison}`);
  }
  return l.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  recordCliUsage("the-equalizer");
  printReportHeader({ tool: "THE-EQUALIZER", title: "Tout est-il à niveau ?", subtitle: "un verdict par domaine, et ce que personne ne vérifie", scriptPath: "scripts/the-equalizer.mjs" });
  printReliabilityNotice("the-equalizer");

  const exigences = loadStandards();
  const fantomes = findVerificateursFantomes(exigences, exportsDuDepot());
  const verdicts = verdictParDomaine(exigences, { fantomes });

  // Le retard outil par outil est calculé par LE-COORDINATEUR, jamais ici. S'il est indisponible
  // (import en échec, table illisible), `integration` reste `null` et le rapport le DIT : un relevé
  // absent affiché comme un relevé propre serait exactement le faux vert que cet outil existe pour
  // empêcher.
  let integration = null;
  try {
    const { integrationAudit, findToolsMissingFromMenu, findScriptsMissingFromAgentFiles } = await import("./le-coordinateur.mjs");
    const { buildRealOnboardingContext } = await import("./check-tasks-details.mjs");
    const { findReportingToolsMissingFromCircle } = await import("./circle-tasks.mjs");
    // Le contexte réel est CONSTRUIT AILLEURS, et c'est important : `buildRealOnboardingContext()`
    // porte la liste des déviations déclarées (le registre de THE-DEEP-READER qui vit sous
    // docs/suivi/, le blueprint de Smart Breaker qui porte son nom d'avant le surnom). Le
    // rassembler une seconde fois ici aurait fait ressortir ces deux-là comme de vrais écarts —
    // c'est exactement ce que mon premier jet a fait, et c'est la définition d'un faux positif :
    // une déviation assumée ailleurs, oubliée ici.
    const contexte = buildRealOnboardingContext();
    integration = integrationAudit(contexte, {
      absentsDuMenu: findToolsMissingFromMenu(contexte.toolsTableMarkdown),
      scriptsNonDeclares: findScriptsMissingFromAgentFiles(contexte.toolsTableMarkdown),
      absentsDeLaRonde: findReportingToolsMissingFromCircle(),
    });
  } catch (err) {
    console.log(`(retard outil par outil non mesuré : ${err.message})`);
  }

  console.log(formatANiveau({ exigences, verdicts, fantomes, integration, dateLabel: dateEnToutesLettres() }));
  const constats = constatsANiveau({ verdicts, fantomes, integration });
  console.log("");
  console.log(`## ${PLAN_ACTION_TITRE}`);
  console.log(planDactionDepuisEcarts(constats, { toolSlug: "the-equalizer", tache: "mettre l'Agence à niveau" }).lignes.join("\n"));
}
