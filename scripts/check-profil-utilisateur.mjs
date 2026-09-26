// Garde-fou du système de profil utilisateur (2026-09-19, cf. docs/profil-utilisateur/index.md et
// docs/regles-de-travail.md §9 « Historisation du profil »). Une fiche d'observation créée dans
// docs/profil-utilisateur/observations/ doit toujours avoir une ligne correspondante dans la table
// de docs/profil-utilisateur/index.md, et inversement — jamais une fiche orpheline (créée mais
// jamais indexée, donc invisible pour un futur agent qui ne consulterait que l'index) ni une ligne
// d'index qui pointe vers un fichier disparu. Gratuit, zéro appel réseau, même patron que
// scripts/check-suivi-fidelity.mjs.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { planDactionDepuisEcarts, PLAN_ACTION_TITRE } from "./report-template.mjs";
import { mesurerCorpus, ligneCorpus } from "./corpus-mesure.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const INDEX_PATH = join(ROOT, "docs/profil-utilisateur/index.md");
const OBSERVATIONS_DIR = join(ROOT, "docs/profil-utilisateur/observations");

// Extrait chaque nom de fichier référencé par un lien markdown "(observations/xxx.md)" dans la
// table de l'index — jamais un motif qui dépendrait de l'ordre exact des colonnes, pour rester
// robuste si la table évolue.
export function extractLinkedFiles(indexText) {
  const matches = indexText.matchAll(/\(observations\/([^)]+\.md)\)/g);
  return [...matches].map((m) => m[1]);
}

// Compare les fiches réellement présentes sur disque aux fiches référencées par l'index — les deux
// écarts possibles sont signalés séparément, jamais fusionnés (ils appellent une correction
// différente : ajouter une ligne à l'index, ou retrouver/supprimer un lien mort).
export function findOrphanedObservations(indexText, observationFiles) {
  const linked = new Set(extractLinkedFiles(indexText));
  const onDisk = new Set(observationFiles);
  return {
    missingFromIndex: observationFiles.filter((f) => !linked.has(f)),
    missingFromDisk: [...linked].filter((f) => !onDisk.has(f)),
  };
}

function main() {
  // Le compteur d'usage, câblé le 2026-09-26 (Ronde, plan d'action de tool-brain) : ce script a
  // une ligne de commande et n'enregistrait pas son passage — son zéro mesurait son SILENCE, jamais
  // son inactivité, ce qui rendait faux tout verdict d'usage le concernant (leçon L11).
  recordCliUsage("check-profil-utilisateur");
  // L'AVERTISSEMENT DE MARGE, DIT ET PAS SEULEMENT DÉCLARÉ (2026-09-25, tâche #653 → #808) :
  // sa nature heuristique était écrite dans TOOL_RELIABILITY et aucun chemin de ce script ne la
  // prononçait — une protection écrite qui ne sort jamais, le fil rouge de ce projet.
  printReliabilityNotice("check-profil-utilisateur");
  console.log("=== Garde-fou système de profil utilisateur (docs/profil-utilisateur/) ===\n");
  // LE DÉNOMINATEUR AVANT LE VERDICT (2026-09-25, tâche #865 — suite mesurée de #206, signalée
  // par le critère 5 de pure-gold-unity). Ce garde-fou pouvait écrire « OK — 0 fiche(s) sur
  // disque, aucun lien mort » : un vert parfait rendu sur ZÉRO donnée. Et ce n'est pas une
  // hypothèse de forme — le cas arrive vraiment, le dossier d'observations pouvant être vide
  // le temps d'une session neuve.
  //
  // Il passe par `mesurerCorpus()` plutôt que par une formulation de plus qui lui serait propre
  // (Article 24 : le mécanisme est écrit une fois, un outil de plus l'obtient en déclarant son
  // corpus). Les deux causes d'un zéro sont nommées séparément, jamais confondues :
  //   · pas d'index du tout → rien à confronter, et c'est peut-être parfaitement normal ;
  //   · un index mais zéro fiche → il y a un index qui ne pointe sur rien, ce qui n'est pas pareil.
  const indexPresent = existsSync(INDEX_PATH);
  const observationFiles = existsSync(OBSERVATIONS_DIR)
    ? readdirSync(OBSERVATIONS_DIR).filter((f) => f.endsWith(".md"))
    : [];
  const mesure = mesurerCorpus(indexPresent ? observationFiles : [], {
    quoi: "les fiches d'observation du profil utilisateur",
    unite: "fiche",
    pourquoiVide: indexPresent
      ? "un index existe mais aucune fiche n'est présente sur le disque : il n'y a rien à confronter à l'index, ce qui n'est pas la même chose qu'un index propre"
      : "aucun index trouvé — le système n'a peut-être jamais été utilisé cette session-ci, et l'absence d'un système n'est jamais la preuve qu'il est en bon état",
  });
  console.log(ligneCorpus(mesure, { nomDuGardien: "profil utilisateur" }));
  if (!mesure.mesurable) {
    // Le plan d'action s'imprime QUAND MÊME, et sa seule ligne est l'absence de mesure : sortir
    // ici en silence rendrait ce passage indiscernable d'un passage réussi.
    console.log(`\n${PLAN_ACTION_TITRE}`);
    console.log(planDactionDepuisEcarts([{ pourquoi: `corpus non mesurable — ${mesure.pourquoi}` }], {
      toolSlug: "check-profil-utilisateur",
      tache: "vérifier que le système de profil utilisateur existe et porte des fiches avant de lire ce verdict comme un feu vert",
    }).lignes.join("\n"));
    return;
  }
  const indexText = readFileSync(INDEX_PATH, "utf8");
  const { missingFromIndex, missingFromDisk } = findOrphanedObservations(indexText, observationFiles);
  for (const f of missingFromIndex) console.log(`⚠️ Fiche présente mais jamais indexée : observations/${f}`);
  for (const f of missingFromDisk) console.log(`⚠️ Lien mort dans l'index, fichier introuvable : observations/${f}`);
  if (!missingFromIndex.length && !missingFromDisk.length) {
    console.log(`OK — ${observationFiles.length} fiche(s) sur disque, toutes référencées dans l'index, aucun lien mort.`);
  }
  // LE PLAN D'ACTION (2026-09-25, tâche #854 — reste mesuré de #803/#833). Cet outil émettait deux
  // vrais écarts et s'arrêtait là : l'Article 28 dit qu'un rapport n'est pas fini quand il est
  // écrit, mais quand ses constats sont devenus des tâches. Et la section s'imprime MÊME VIDE,
  // délibérément — « aucun constat retenu » et « le plan d'action n'a pas été produit » sont deux
  // choses qu'une section absente confondrait, ce qui est exactement le faux vert que ce projet
  // traque partout ailleurs.
  //
  // Les deux écarts appellent des corrections OPPOSÉES, donc ils portent deux tâches distinctes
  // plutôt qu'une formule commune : une fiche non indexée se répare en AJOUTANT une ligne, un lien
  // mort en retrouvant le fichier ou en RETIRANT la ligne. Les fondre en « corriger l'index »
  // rendrait le plan inapplicable sans rouvrir le rapport.
  const ecarts = [
    ...missingFromIndex.map((f) => ({ quoi: `fiche présente sur disque mais jamais indexée : observations/${f}`, quoiFaire: `ajouter sa ligne à docs/profil-utilisateur/index.md — sans elle, la fiche est invisible pour un agent qui ne lit que l'index (Article 27)` })),
    ...missingFromDisk.map((f) => ({ quoi: `lien mort dans l'index vers observations/${f}`, quoiFaire: `retrouver le fichier ou retirer la ligne — un lien mort ressemble à un lien, ce qui est pire qu'une absence` })),
  ];
  const plan = planDactionDepuisEcarts(ecarts, {
    toolSlug: "check-profil-utilisateur",
    libelle: (e) => e.quoi,
    tache: (e) => e.quoiFaire,
  });
  console.log("");
  console.log(`=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of plan.lignes) console.log(l);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
