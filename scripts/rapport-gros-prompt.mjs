#!/usr/bin/env node
// RAPPORT DE GROS PROMPT — l'utilitaire qui rend compte d'une saisine, point par point
// =====================================================================================
// POURQUOI IL EXISTE (2026-09-24, demande explicite de l'utilisateur). Son process : il accumule
// ses idées, ses tâches et ses questions pendant qu'on travaille plutôt que de m'interrompre par
// petits messages — « c'était un de mes défauts à corriger » — et il me les envoie d'un bloc avant
// une période autonome. Le matin, il doit trouver un RAPPORT DE GROS PROMPT : son prompt repris
// point par point, réorganisé, où chaque point porte son sort.
//
// LE DÉFAUT PRÉCIS QU'IL A NOMMÉ, et c'est lui qui a motivé l'outil : la première version manuelle
// marquait certains points « FAIT » sans leur associer la moindre tâche. Sa réaction : « j'ai
// remarqué que des taches pouvaient etre associés, et ce n'est pas fait, et tu ne me l'as pas
// proposé ». Un point traité sans tâche est invérifiable — on ne peut ni le retrouver, ni savoir
// s'il a vraiment abouti. D'où la règle mécanique ci-dessous, qui REFUSE de produire le rapport
// plutôt que de le produire incomplet.
//
// CE QU'IL N'EST PAS : un générateur de contenu. Il ne devine rien, il ne résume rien, il ne juge
// rien. Il prend une saisine déjà rédigée et lui applique le gabarit standard des rapports du
// projet — jamais un second gabarit concurrent, jamais une mise en forme inventée sur place.
//
// GÉNÉRIQUE PAR CONSTRUCTION (les deux projets, cf. CLAUDE.md) : rien ici ne connaît Lia, Noé, ni
// aucun outil de ce dépôt. Une saisine est une liste de points ; n'importe quel projet piloté par
// IA peut réutiliser ce fichier tel quel.

import { readFileSync, writeFileSync } from "node:fs";
import { buildReportFrame, renderTextReport, buildPlanDaction, ETATS_CONSTAT } from "./report-template.mjs";

export const OUTIL = "rapport-gros-prompt";
export const SCRIPT_PATH = "scripts/rapport-gros-prompt.mjs";

// Les trois sorts d'un point, et ce sont EXACTEMENT les trois états de l'Article 28 — jamais un
// quatrième, jamais un « traité » fourre-tout. C'est ce vocabulaire partagé qui permet au plan
// d'action du rapport d'être lu par les mêmes outils que tous les autres plans du projet.
export const SORTS = ETATS_CONSTAT; // retenu · ecarte · a-trancher

export const LONGUEUR_MIN_RAISON = 40;

// LA RÈGLE QUI A MOTIVÉ L'OUTIL. Un point RETENU sans numéro de tâche est refusé : c'est
// littéralement le « FAIT-Q » que l'utilisateur n'a pas aimé. Un point ÉCARTÉ sans raison écrite
// est refusé aussi — un écart sans raison n'est pas une décision, c'est un abandon déguisé
// (Article 28). On refuse de PRODUIRE plutôt que de produire un rapport qui a l'air complet : un
// rapport incomplet mais bien mis en page est plus dangereux qu'une erreur visible.
export function validerPoints(points = []) {
  const fautes = [];
  const vus = new Set();
  points.forEach((p, i) => {
    const ou = p?.id ? `point ${p.id}` : `point n°${i + 1}`;
    if (!p?.id) fautes.push(`${ou} : pas d'identifiant — impossible d'y répondre point par point`);
    else if (vus.has(p.id)) fautes.push(`${ou} : identifiant en double`);
    else vus.add(p.id);
    if (!p?.citation) fautes.push(`${ou} : la demande de l'utilisateur n'est pas citée dans ses termes`);
    if (!SORTS.includes(p?.sort)) fautes.push(`${ou} : sort « ${p?.sort ?? "absent"} » inconnu — attendu ${SORTS.join(", ")}`);
    if (p?.sort === "retenu" && !(p.taches ?? []).length) {
      fautes.push(`${ou} : RETENU sans aucune tâche associée — c'est le « FAIT-Q » que l'utilisateur a refusé le 2026-09-24 : un point traité sans tâche est invérifiable`);
    }
    if (p?.sort === "ecarte" && String(p.raison ?? "").trim().length < LONGUEUR_MIN_RAISON) {
      fautes.push(`${ou} : ÉCARTÉ sans raison lisible — un écart sans raison écrite n'est pas une décision (Article 28)`);
    }
  });
  return { valide: fautes.length === 0, fautes };
}

// Le nombre de points ne se déclare pas, il se compte : une saisine qui annoncerait « 12 points »
// et en porterait 11 produirait un rapport qui ment sur sa propre exhaustivité.
export function compterParSort(points = []) {
  const c = Object.fromEntries(SORTS.map((s) => [s, 0]));
  for (const p of points) if (SORTS.includes(p?.sort)) c[p.sort] += 1;
  return c;
}

export function tachesCitees(points = []) {
  return [...new Set(points.flatMap((p) => p?.taches ?? []))].sort((a, b) => a - b);
}

const ICONE = { retenu: "🟢", ecarte: "⚪", "a-trancher": "🟠" };
const LIBELLE = { retenu: "RETENU", ecarte: "ÉCARTÉ", "a-trancher": "À TRANCHER" };

export function blocsDuRapport(saisine) {
  const points = saisine.points ?? [];
  const compte = compterParSort(points);
  const blocs = [];

  blocs.push({ type: "note", text:
    `Ton prompt du ${saisine.dateDuPrompt} contient ${points.length} point(s) distinct(s). Ils sont repris ci-dessous ` +
    `RÉORGANISÉS par sujet — jamais dans l'ordre où ils sont arrivés, qui est l'ordre où tu y as pensé, pas celui où ils se traitent.\n` +
    `${ICONE.retenu} ${compte.retenu} retenu(s) · ${ICONE.ecarte} ${compte.ecarte} écarté(s) · ${ICONE["a-trancher"]} ${compte["a-trancher"]} à trancher par toi.` });

  // Un point par sujet, groupé — c'est la « réorganisation » que l'utilisateur demande, et elle est
  // DÉRIVÉE du champ sujet de chaque point, jamais d'un classement écrit à part qui divergerait.
  const parSujet = new Map();
  for (const p of points) {
    const s = p.sujet ?? "Divers";
    if (!parSujet.has(s)) parSujet.set(s, []);
    parSujet.get(s).push(p);
  }
  for (const [sujet, liste] of parSujet) {
    blocs.push({ type: "heading", text: sujet });
    for (const p of liste) {
      const taches = (p.taches ?? []).map((t) => `#${t}`).join(", ");
      blocs.push({ type: "note", text:
        `${ICONE[p.sort]} [${p.id}] ${LIBELLE[p.sort]}${taches ? ` — ${taches}` : ""}\n` +
        `   TA DEMANDE : « ${p.citation} »\n` +
        `   ${p.sort === "ecarte" ? "POURQUOI ON NE FAIT RIEN" : "OÙ ÇA EN EST"} : ${p.reponse ?? p.raison ?? ""}` +
        (p.question ? `\n   ❓ CE QUE J'ATTENDS DE TOI : ${p.question}` : "") });
    }
  }
  return blocs;
}

export function construireRapport(saisine) {
  const v = validerPoints(saisine.points);
  if (!v.valide) throw new Error(`rapport-gros-prompt : saisine incomplète, rapport NON produit.\n  - ${v.fautes.join("\n  - ")}`);
  const points = saisine.points ?? [];
  const constats = points.map((p) => ({
    etat: p.sort,
    libelle: `[${p.id}] ${p.sujet ?? "Divers"} — ${(p.citation ?? "").slice(0, 90)}`,
    tache: (p.taches ?? [])[0] ?? null,
    raison: p.raison ?? null,
    question: p.question ?? null,
  }));
  return buildReportFrame({
    tool: OUTIL,
    scriptPath: SCRIPT_PATH,
    origin: saisine.origine ?? "demande",
    title: saisine.titre ?? "RAPPORT DE GROS PROMPT",
    subtitle: `Saisine du ${saisine.dateDuPrompt} · ${points.length} point(s) · ${tachesCitees(points).length} tâche(s) associée(s)`,
    dateLabel: saisine.dateDuRapport,
    blocks: blocsDuRapport(saisine),
    planDaction: buildPlanDaction(constats, { toolSlug: OUTIL }),
    footer: `HORS PORTÉE : ce rapport dit ce qui a été fait de chaque point ; il ne dit jamais si c'était la bonne chose à faire — ça se lit, et ça se tranche avec toi, point par point.`,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , entree, sortie] = process.argv;
  if (!entree) { console.error("usage : node scripts/rapport-gros-prompt.mjs <saisine.json> [sortie.txt]"); process.exit(2); }
  const texte = renderTextReport(construireRapport(JSON.parse(readFileSync(entree, "utf8"))));
  if (sortie) { writeFileSync(sortie, texte); console.log(`Rapport écrit : ${sortie}`); } else console.log(texte);
}
