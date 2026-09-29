// ICEBERG: membre
// JESUS-LE-SAUVEUR — tout ce qui FREINE le projet, y compris les causes indirectes
// (2026-09-28, tâche #1103, cf. docs/jesus-le-sauveur-blueprint.md et
// docs/referentiel/jesus-le-sauveur.md). Nom choisi par l'utilisateur.
//
// SA RAISON D'ÊTRE, dans ses mots : « s'assurer que le projet avance toujours à bon rythme, sans
// être freiné par des lourdeurs » — puis, le même jour : « il voit les causes INDIRECTES,
// INATTENDUES ».
//
// SA PLACE DANS LES « PROPHÈTES DU TEMPS » (son organigramme, décidé le 2026-09-28) :
//   · EZECHIEL  — le filet et sa machinerie : des FICHIERS précis qui font perdre du temps
//   · MOÏSE     — la charte : le document qui fait loi
//   · ABRAHAM   — tout document à règles numérotées, ET le chapeau des DOCUMENTS
//   · JESUS     — tout ce qui est HORS documents, vision 360, et le chapeau GÉNÉRAL
// Convoquer JESUS met en action tout le système. Il ne refait jamais le travail des trois autres :
// il les convoque et rassemble, exactement comme Abraham le fait déjà pour les documents.
//
// CE QU'IL NE FAIT JAMAIS, et c'est sa décision explicite : il SIGNALE et PROPOSE un plan. Il ne
// corrige rien seul. Il a le droit de dire qu'un Article de la charte nous freine et de le
// chiffrer ; il n'a jamais le droit d'y toucher.
//
// SON RYTHME : convoqué à chaque gros chantier (« on le convoque chaque gros chantier »). Ce n'est
// donc PAS un Gardien sacré du code, dont le critère est de tourner gratuitement et mécaniquement
// à CHAQUE commit — la distinction est écrite ici pour qu'aucune reprise ne le range mal
// (Article 20bis).
//
// ————————————————————————————————————————————————————————————————————————
// CE QUE LA RECHERCHE EXTÉRIEURE A CHANGÉ DANS SA CONCEPTION
// (docs/recherches/ralentissements-causes-indirectes.md, 2026-09-28)
// ————————————————————————————————————————————————————————————————————————
// Sans elle, cet outil aurait mesuré des DURÉES DE TRAVAIL — ce qui est précisément l'erreur que la
// littérature documente. Le constat central renverse l'intuition : dans une chaîne de livraison,
// la part du temps réellement travaillée (la « fluidité ») tourne autour de 15 %. Le reste est de
// l'ATTENTE. Passer de 15 % à 30 % divise le délai par deux — on gagne donc beaucoup plus en
// retirant de l'attente qu'en travaillant plus vite.
//
// Trois autres résultats ont façonné les sondes ci-dessous :
//   · la dette de PROCESS « ne vit pas dans le dépôt » et pèse 30 à 50 % de l'effort — invisible
//     parce qu'elle se répartit : chaque obligation prise seule paraît légitime ;
//   · entre 35 % et 91 % des avertissements d'un analyseur ne sont PAS actionnables, ce qui rend
//     insensible à tous les autres — c'est la leçon L4 de ce projet, mesurée ailleurs ;
//   · au-delà d'un certain taux d'occupation, le temps d'attente n'augmente pas proportionnellement,
//     il EXPLOSE — une file pleine ralentit donc même les tâches faciles.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { printReliabilityNotice, sh } from "./lib-shell.mjs";
import { recordCliUsage, loadToolUsageHistory } from "./tool-usage.mjs";
import { printReportHeader, buildPlanDaction, imprimerPlanDaction } from "./report-template.mjs";
// LA DÉFINITION DE « CLOSE » SE LIT, ELLE NE SE RÉÉCRIT PAS (2026-09-29, tâche #1199) — cf. #1171.
import { estStatutTermine, estStatutEcarte } from "./check-suivi-fidelity.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
export const REGISTRE = "docs/jesus-le-sauveur";

const lire = (chemin, lireImpl = readFileSync) => {
  try { return lireImpl(join(ROOT, chemin), "utf8"); } catch { return null; }
};
const lireJson = (chemin, lireImpl = readFileSync) => {
  const brut = lire(chemin, lireImpl);
  if (brut == null) return null;
  try { return JSON.parse(brut); } catch { return null; }
};

// UNE ABSENCE EST UN RÉSULTAT, JAMAIS UNE PANNE (leçons L5/L11). Toute sonde qui ne peut pas
// mesurer rend `mesurable: false` avec sa raison, et jamais un zéro qui se lirait « rien à
// signaler ». C'est la première chose que le projet témoin a apprise en sortant du dépôt.
export function pasMesure(quoi, pourquoi) {
  return { mesurable: false, quoi, pourquoi };
}

// ————————————————————————————————————————————————————————————————————————
// TERRAIN ① — LE TEMPS MACHINE
// ————————————————————————————————————————————————————————————————————————

// LE FILET EST LE SEUL COÛT MACHINE QUE L'AGENT PAIE À CHAQUE CHANTIER, plusieurs fois. Ce qui
// compte n'est donc pas sa durée nue mais ce qu'elle DEVIENT multipliée par le nombre de passages.
// LE SEUIL EST CHOISI À LA MAIN, ET SA RAISON EST MESURÉE — ce que l'Article 24 autorise
// expressément à condition de l'écrire juste à côté plutôt que de le laisser passer pour dérivé.
//
// POURQUOI 10 % ET PAS 1 % : le même filet, lancé six fois dans la nuit du 2026-09-29 sans
// qu'aucune ligne de test ne change entre deux passages, a rendu 52,7 s · 55,0 s · 57,5 s · 60,1 s
// · 66,4 s · 71,3 s — soit **plus de 15 % d'écart entre le plus rapide et le plus lent**. Un seuil
// en dessous de cette variance déclarerait « périmé » un chiffre parfaitement valable, et
// l'alarme redeviendrait le décor qu'elle vient de cesser d'être.
export const SEUIL_DE_DERIVE_DU_FILET = 0.10;

export function coutDuFilet({ mesures = lireJson("docs/ezechiel-les-tests/mesures.json"), maintenant = Date.now(), shImpl = sh } = {}) {
  if (!mesures?.totalMs) {
    return pasMesure("le coût du filet", "aucune mesure enregistrée par Ezechiel — lancer `node scripts/ezechiel-les-tests.mjs mesurer` avant de conclure quoi que ce soit sur le temps");
  }
  const secondes = mesures.totalMs / 1000;
  const ageHeures = mesures.quand ? (maintenant - Date.parse(mesures.quand)) / 3_600_000 : null;
  let commitsDepuis = null;
  if (mesures.quand) {
    try {
      const brut = shImpl(`git log --since="${mesures.quand}" --oneline -- scripts/check-house.mjs`);
      commitsDepuis = String(brut).trim() ? String(brut).trim().split("\n").length : 0;
    } catch { commitsDepuis = null; }   // pas de git : on ne devine pas, on retombe sur l'âge
  }
  // COMBIEN LE FILET A-T-IL CHANGÉ, et pas seulement s'il a changé (voir la note ci-dessous).
  let derive = null;
  if (mesures.quand && commitsDepuis) {
    try {
      const avant = String(shImpl(`git show "$(git rev-list -1 --before='${mesures.quand}' HEAD)":scripts/check-house.mjs`)).split("\n").length;
      const apres = String(shImpl("cat scripts/check-house.mjs")).split("\n").length;
      if (avant > 0) derive = Math.abs(apres - avant) / avant;
    } catch { derive = null; }
  } else if (commitsDepuis === 0) derive = 0;

  const perime = derive === null
    ? (commitsDepuis === null ? (ageHeures !== null && ageHeures > 24) : commitsDepuis > 0)
    : derive > SEUIL_DE_DERIVE_DU_FILET;
  return {
    mesurable: true, secondes, ageHeures,
    // LA PÉREMPTION SE MESURE SUR LE FILET LUI-MÊME, JAMAIS SUR LES HEURES — et le premier passage
    // réel de cet outil a montré pourquoi. Un seuil de 24 h laissait passer une mesure de 20 h qui
    // annonçait 65 s alors que le filet en met 95 : trente secondes d'écart, invisibles, sur le
    // chiffre même qui sert à décider s'il faut optimiser.
    //
    // MAIS « UN SEUL COMMIT SUFFIT » ÉTAIT TROP GROSSIER, et c'est la correction du 2026-09-29.
    // Le filet reçoit un commit presque chaque jour : le signal était donc rouge en permanence, y
    // compris trois heures après une mesure fraîche. **Une alarme qu'aucun travail ne peut éteindre
    // cesse d'être une alarme et devient du décor** (leçon L6) — et la journée l'a montré : la
    // mesure a été refaite, et JESUS a redit « périmé » au passage suivant.
    //
    // CE QUI EST MESURÉ À LA PLACE : de COMBIEN le filet a changé, en nombre de lignes. Une durée
    // d'exécution suit la quantité de code testé ; un commit qui ajoute un test la déplace de
    // quelques dixièmes de seconde, une refonte la déplace vraiment.
    commitsDepuis, derive,
    perime,
    pourquoi: ageHeures === null
      ? `${secondes.toFixed(0)} s au dernier relevé, dont la DATE est inconnue — l'âge d'une mesure fait partie de la mesure`
      : derive === null
        ? (commitsDepuis
            ? `${secondes.toFixed(0)} s au relevé d'il y a ${ageHeures.toFixed(0)} h, et le filet a reçu ${commitsDepuis} commit(s) depuis — l'ampleur du changement n'a PAS pu être lue, donc on retombe sur le signal grossier`
            : `${secondes.toFixed(0)} s au relevé d'il y a ${ageHeures.toFixed(0)} h`)
        : perime
          ? `${secondes.toFixed(0)} s au relevé d'il y a ${ageHeures.toFixed(0)} h, mais le filet a changé de ${Math.round(derive * 100)} % en taille depuis (${commitsDepuis} commit(s)) : ce chiffre ne décrit plus le filet d'aujourd'hui, et il a l'air tout aussi juste qu'un chiffre frais`
          : `${secondes.toFixed(0)} s au relevé d'il y a ${ageHeures.toFixed(0)} h · le filet a bougé de ${Math.round(derive * 100)} % en taille (${commitsDepuis ?? 0} commit(s)), soit moins que l'écart entre deux exécutions du MÊME filet — la mesure tient encore`,
  };
}

// L'OUTIL CONSTRUIT PUIS ABANDONNÉ — et cette sonde est née d'un défaut de la précédente.
//
// PREMIÈRE VERSION, ÉCARTÉE PAR LA MESURE : une LISTE ÉCRITE À LA MAIN de « remèdes connus », avec
// un seuil de passages en dessous duquel on les déclarait dormants. Elle a rendu « les 3 remèdes
// sont réellement sollicités » sur un cas dont je SAVAIS qu'il était faux — filet-en-parts n'avait
// pas servi de la journée. Le compte cumulé masquait tout : 33 passages, donc « utilisé ».
//
// CE QUE LA VRAIE DONNÉE MONTRAIT, ET QUI A DONNÉ LA BONNE SONDE : 30 de ces 33 passages tombent le
// 2026-09-27 entre 21h02 et 23h05 — c'est-à-dire PENDANT SA PROPRE CONSTRUCTION. Puis plus rien
// jusqu'au lendemain 15h23, malgré une quarantaine de commits qui ont chacun lancé le filet en
// séquentiel, le geste que cet outil existe précisément pour remplacer.
//
// LE MOTIF EST DONC : « intensément utilisé le jour où il naît, puis plus jamais ». Il ne se
// devine pas, il se CALCULE — et surtout il s'applique à TOUS les outils sans qu'on ait à penser à
// eux un par un (Article 24 : un registre se LIT, il ne s'énumère pas). Une liste à la main aurait
// couvert les trois auxquels j'avais pensé ; celle-ci couvre les soixante-dix.
export const PART_LE_JOUR_UN = 0.8;      // au-delà, l'usage tient entièrement à sa construction
export const PASSAGES_MINIMUM = 5;       // en dessous, aucun ratio ne veut rien dire

// LA CONDITION D'OPPORTUNITÉ, ET ELLE A ÉTÉ PAYÉE AU SECOND PASSAGE RÉEL DE CET OUTIL.
// Sans elle, la sonde accusait cinq outils NÉS LA VEILLE de « n'avoir plus servi depuis leur
// naissance » — alors qu'ils n'en avaient tout simplement pas eu l'occasion : pour eux, le jour un
// EST aujourd'hui, donc 100 % de leur usage y tombe par construction. L'accusation était vraie au
// sens arithmétique et fausse au sens réel, ce qui est la définition exacte du faux positif que la
// leçon L4 interdit : un garde-fou qui accuse à tort cesse d'être lu, et il le fait d'autant plus
// que le projet travaille bien — ici, plus on construit d'outils, plus il criait.
//
// UN OUTIL N'EST DONC JUGEABLE QUE S'IL A EU LE TEMPS DE RESSERVIR. En dessous, il n'est pas
// « sain », il est NON JUGEABLE — et les deux se disent, jamais l'un à la place de l'autre.
export const JOURS_AVANT_DE_POUVOIR_JUGER = 3;

export function outilsAbandonnesApresConstruction({ history = loadToolUsageHistory(), maintenant = Date.now(), partJourUn = PART_LE_JOUR_UN, minimum = PASSAGES_MINIMUM, joursPourJuger = JOURS_AVANT_DE_POUVOIR_JUGER } = {}) {
  const events = (history?.events ?? []).filter((e) => typeof e.at === "number" && e.at > 0);
  if (!events.length) return pasMesure("les outils abandonnés après leur construction", "le compteur d'usage ne porte aucun événement daté : on ne peut pas distinguer « jamais rappelé » de « jamais enregistré » (leçons L5/L11)");
  const par = new Map();
  for (const e of events) {
    const l = par.get(e.toolSlug) ?? [];
    l.push(e.at); par.set(e.toolSlug, l);
  }
  const abandonnes = [];
  let tropRecents = 0, tropPeuVus = 0;
  for (const [slug, dates] of par) {
    if (dates.length < minimum) { tropPeuVus += 1; continue; }   // aucun ratio ne tient sur si peu
    dates.sort((a, b) => a - b);
    const premier = dates[0];
    // L'OPPORTUNITÉ D'ABORD, LE RATIO ENSUITE — dans cet ordre, sinon on accuse un nouveau-né.
    if ((maintenant - premier) / 86_400_000 < joursPourJuger) { tropRecents += 1; continue; }
    const jourUn = dates.filter((d) => d - premier <= 86_400_000).length;
    const part = jourUn / dates.length;
    if (part < partJourUn) continue;
    abandonnes.push({
      slug, passages: dates.length, jourUn, part,
      joursDepuisDernier: Math.round((maintenant - dates[dates.length - 1]) / 86_400_000),
      joursDepuisNaissance: Math.round((maintenant - premier) / 86_400_000),
    });
  }
  abandonnes.sort((a, b) => b.passages - a.passages);
  // LE DÉNOMINATEUR SE DIT TOUJOURS, et ici il se dit en trois parts : un zéro sans le nombre
  // d'outils écartés faute d'occasion se lirait « tout va bien » alors qu'il veut dire « je n'ai pas
  // encore pu regarder » (leçons L5/L11).
  const jugeables = par.size - tropRecents - tropPeuVus;
  return { mesurable: true, abandonnes, outilsLus: par.size, jugeables, tropRecents, tropPeuVus,
    pourquoi: (abandonnes.length
      ? `${abandonnes.length} outil(s) sur ${jugeables} jugeables ont concentré au moins ${Math.round(partJourUn * 100)} % de leur usage dans les 24 h de leur premier passage : ils ont servi à se construire eux-mêmes, et plus guère depuis`
      : `aucun des ${jugeables} outils jugeables ne concentre son usage sur son seul premier jour`)
      + ` · ${tropRecents} écarté(s) faute d'avoir eu ${joursPourJuger} jours pour resservir, ${tropPeuVus} faute d'assez de passages — non jugeables, jamais « sains »` };
}

// ————————————————————————————————————————————————————————————————————————
// TERRAIN ② — LES OBLIGATIONS QUI COÛTENT PLUS QU'ELLES NE RAPPORTENT
// ————————————————————————————————————————————————————————————————————————

// CE QU'IL EN COÛTE DE FAIRE ENTRER UN OUTIL DE PLUS. La dette de process ne se voit pas parce
// qu'elle se RÉPARTIT : chaque registre à remplir est légitime pris seul. Le nombre, lui, ne se
// discute nulle part — et c'est exactement ce que la recherche appelle l'overhead invisible.
export function coutDUnArrivant({ source = lire("scripts/integration-outil.mjs") } = {}) {
  if (source == null) return pasMesure("le coût d'un arrivant", "scripts/integration-outil.mjs est introuvable — sur un autre dépôt, ce process n'existe simplement pas");
  // On compte les registres DÉCLARÉS par le process lui-même, jamais une liste recopiée ici.
  const bloc = source.match(/REGISTRES_D_INTEGRATION\s*=\s*\[([\s\S]*?)\n\]/);
  if (!bloc) return pasMesure("le coût d'un arrivant", "la liste des registres n'a pas pu être lue dans le process — elle a peut-être changé de forme, et deviner un nombre serait pire que de ne rien rendre");
  const combien = (bloc[1].match(/\bcle\s*:/g) ?? []).length;
  return { mesurable: true, combien,
    pourquoi: `${combien} registre(s) à renseigner pour chaque outil qui arrive. Pris un par un ils sont tous justifiés ; c'est leur SOMME que personne ne discute — et elle se paie à chaque nouvel outil, pour toujours` };
}

// ————————————————————————————————————————————————————————————————————————
// TERRAIN ③ — LES ALERTES ET RAPPORTS QUE PLUS PERSONNE NE LIT
// ————————————————————————————————————————————————————————————————————————

// L'ALERTE INEXTINGUIBLE — le signal le plus important de cet outil, et le mieux fondé.
// Entre 35 % et 91 % des avertissements d'un analyseur ne sont pas actionnables ; passé un seuil,
// on cesse de tous les lire, y compris les vrais. Ce projet en a déjà payé deux cas documentés (le
// garde-fou des axes qui criait sur son propre doublon pendant des jours, l'avertissement moteur
// facturé deux fois). Une alerte qu'AUCUNE action légitime ne peut éteindre devient du décor (L6),
// et elle emporte avec elle celles qui comptent.
export const JOURS_AVANT_DECOR = 3;

export function alertesQuiNeSEteignentPas({ alertes = lireJson("docs/abraham-les-references/alertes.json"), maintenant = Date.now(), seuilJours = JOURS_AVANT_DECOR } = {}) {
  const liste = Array.isArray(alertes) ? alertes : alertes?.alertes;
  if (!Array.isArray(liste)) return pasMesure("les alertes qui ne s'éteignent pas", "aucun registre d'alertes lisible — ce n'est pas « zéro alerte », c'est « pas mesuré »");
  const vieilles = [];
  for (const a of liste) {
    const depuis = a?.depuis ?? a?.quand ?? a?.at;
    const t = typeof depuis === "number" ? depuis : Date.parse(depuis ?? "");
    if (!Number.isFinite(t)) continue;                  // sans date, on ne devine pas un âge
    const jours = (maintenant - t) / 86_400_000;
    if (jours >= seuilJours) vieilles.push({ ...a, jours: Math.round(jours) });
  }
  return { mesurable: true, vieilles, lues: liste.length,
    pourquoi: vieilles.length
      ? `${vieilles.length} alerte(s) sur ${liste.length} tiennent depuis plus de ${seuilJours} jours : à ce stade la question n'est plus « que dit-elle » mais « pourquoi personne ne peut l'éteindre »`
      : `${liste.length} alerte(s) lue(s), aucune ne traîne au-delà de ${seuilJours} jours` };
}

// ————————————————————————————————————————————————————————————————————————
// TERRAIN ④ — LES FRICTIONS DE NOTRE ÉCHANGE (la fluidité, appliquée à la file)
// ————————————————————————————————————————————————————————————————————————

// CE QUE PERSONNE NE MESURAIT : depuis COMBIEN DE TEMPS une décision attend sa réponse.
// C'est la transposition directe du constat central de la recherche — l'attente coûte plus que le
// travail — et c'est le seul endroit du projet où l'attente est imputable à l'échange lui-même.
// La sonde ne juge JAMAIS l'utilisateur : une décision qui attend est un fait sur la file, pas un
// reproche. Elle existe pour que le temps d'attente cesse d'être invisible, rien de plus.
export function decisionsEnAttente({ lignes = null, maintenant = Date.now() } = {}) {
  const src = lignes ?? lireLesTachesOuvertes();
  if (!src.mesurable) return src;
  const attentes = src.taches
    .filter((t) => t.enAttenteDeLui)
    .map((t) => ({ ...t, jours: t.ouverteLe ? Math.round((maintenant - t.ouverteLe) / 86_400_000) : null }))
    .sort((a, b) => (b.jours ?? -1) - (a.jours ?? -1));
  const datees = attentes.filter((a) => a.jours !== null);
  const medianeJours = datees.length ? datees[Math.floor(datees.length / 2)].jours : null;
  return { mesurable: true, attentes, medianeJours, sansDate: attentes.length - datees.length,
    pourquoi: attentes.length
      ? `${attentes.length} décision(s) attendent une réponse, la plus ancienne depuis ${attentes[0].jours ?? "?"} jour(s)`
      : "aucune décision en attente : la file ne bloque sur personne" };
}

// LE LECTEUR DE LA FILE. Il ne réimplémente pas le registre : il lit les mêmes lignes que tout le
// monde, par le lecteur nommé de criticite.mjs, pour ne pas recréer le calcul de position qui a
// coûté trois commits le 2026-09-28 (tâche #1099).
export function lireLesTachesOuvertes({ dossier = "docs/suivi/sessions", lireDir = readdirSync, lireFic = readFileSync } = {}) {
  const abs = join(ROOT, dossier);
  let fichiers;
  try { fichiers = lireDir(abs).filter((f) => f.endsWith(".md")); }
  catch { return pasMesure("la file", `${dossier} est introuvable — sur un autre dépôt, ce registre n'existe pas, et c'est un résultat`); }
  const taches = [];
  for (const f of fichiers) {
    let texte; try { texte = lireFic(join(abs, f), "utf8"); } catch { continue; }
    for (const ligne of texte.split("\n")) {
      if (!ligne.startsWith("| ")) continue;
      const cells = ligne.split("|").slice(1).map((c) => c.trim());
      if (cells.length && cells[cells.length - 1] === "") cells.pop();
      if (!cells.length || !/^\d+$/.test(cells[0])) continue;
      const statut = (cells[cells.length - 1] ?? "").toLowerCase();
      // JESUS AVAIT SA PROPRE DÉFINITION DE « CLOSE », ET ELLE COMPTAIT 14 TÂCHES DE TROP
      // (2026-09-29, tâche #1199). `/^(termin|ecart|écart)/` lit le DÉBUT du statut : une ligne
      // « Ouverte → Terminée (clôturée par #789) » commence par « ouverte », donc elle était
      // comptée dans la file ACTIVE alors qu'elle est close depuis des jours. Mesuré : 14 lignes
      // dans ce cas. C'est le défaut de #1171, quatrième lecteur du même registre, dans l'outil
      // dont le métier est justement de dire si la file est fluide — il annonçait une file plus
      // longue qu'elle n'est, c'est-à-dire un ralentissement qui n'existait pas.
      if (estStatutTermine(statut) || estStatutEcarte(statut)) continue;
      if (/grand chantier/.test(statut)) continue;      // reportées par lui : hors de la file active
      const criticite = cells[5] ?? "";
      taches.push({
        numero: Number(cells[0]),
        sujet: (cells[3] ?? "").replace(/\*\*/g, "").slice(0, 70),
        ouverteLe: Date.parse(cells[1] ?? "") || null,
        // « en attente de lui » se LIT sur deux marqueurs réels du registre, jamais deviné : la
        // criticité A-TRANCHER, ou un statut qui dit explicitement l'attente.
        enAttenteDeLui: /a-?\s?trancher/i.test(criticite) || /^(a-?\s?trancher|en attente)/i.test(statut),
      });
    }
  }
  return { mesurable: true, taches,
    pourquoi: `${taches.length} tâche(s) actives lues dans ${fichiers.length} fichier(s)` };
}

// ————————————————————————————————————————————————————————————————————————
// LA VUE 360 — LA CAUSE INDIRECTE, celle qu'aucune sonde ne voit seule
// ————————————————————————————————————————————————————————————————————————
// SA DEMANDE EXACTE : « surtout, il voit les causes indirectes, inattendues ». Une cause indirecte
// n'est jamais dans une sonde : elle est dans la RENCONTRE de deux sondes qui, chacune de son côté,
// ne signalent rien d'alarmant. C'est pour cette raison que ce croisement existe séparément —
// additionner des verdicts ne les croise pas.
export function causesIndirectes(sondes = {}) {
  const trouvailles = [];
  const { filet, remedes, arrivant, alertes, decisions, bruit, allersRetours, fluidite, articles, actionnabilite } = sondes;

  // ① Un remède dort ET le coût qu'il devait retirer est toujours payé → la lourdeur est
  //    entièrement évitable, ce qu'aucune des deux sondes ne dit seule.
  if (remedes?.mesurable && filet?.mesurable) {
    for (const d of remedes.abandonnes ?? []) {
      trouvailles.push({
        quoi: `${d.slug} a servi ${d.jourUn} fois sur ${d.passages} dans les 24 h de son premier passage enregistré, il y a ${d.joursDepuisNaissance} jour(s), et rien depuis ${d.joursDepuisDernier} jour(s)`,
        pourquoi: `un outil qui n'a servi qu'à se construire lui-même a coûté son prix d'entrée sans jamais rendre son service. Le compte cumulé le cache complètement : ${d.passages} passages se lisent comme « utilisé ». C'est la rencontre de deux faits banals — un outil existe, un geste coûteux continue — qui montre que la lourdeur est entièrement évitable`,
      });
    }
  }

  // ② Une mesure périmée pendant qu'on optimise → on optimise à l'aveugle, et on croit mesurer.
  if (filet?.mesurable && filet.perime) {
    trouvailles.push({
      quoi: filet.commitsDepuis
        ? `la mesure du temps sur laquelle on s'appuie annonce ${filet.secondes.toFixed(0)} s, mais le filet a changé ${filet.commitsDepuis} fois depuis`
        : `la mesure du temps sur laquelle on s'appuie a plus de 24 h`,
      pourquoi: "toute décision d'optimisation prise dessus porte sur un état qui n'existe plus — et une mesure périmée ressemble trait pour trait à une mesure fraîche, donc rien ne pousse à la refaire (Article 32, faille 3)",
    });
  }

  // ③ Des décisions attendent ET la file est chargée → la théorie des files dit que l'attente
  //    n'augmente pas proportionnellement mais EXPLOSE. Le lien est contre-intuitif, donc invisible.
  if (decisions?.mesurable && decisions.attentes.length >= 5) {
    trouvailles.push({
      quoi: `${decisions.attentes.length} décisions attendent en même temps`,
      pourquoi: "au-delà d'un certain remplissage, le temps d'attente d'une file n'augmente plus proportionnellement, il explose — donc chaque décision de plus ralentit AUSSI toutes les autres, y compris les faciles. Ce n'est pas une opinion sur le rythme de réponse : c'est une propriété des files",
    });
  }

  // ④ Le coût d'un arrivant est élevé ET des outils dorment → on paie l'entrée d'outils qu'on
  //    n'utilise pas ensuite. Deux faits banals, une conclusion qui ne l'est pas.
  if (arrivant?.mesurable && remedes?.mesurable && arrivant.combien >= 8 && (remedes.abandonnes ?? []).length) {
    trouvailles.push({
      quoi: `${arrivant.combien} registres à remplir par outil qui arrive, pendant que ${remedes.abandonnes.length} outil(s) déjà entré(s) ne servent plus`,
      pourquoi: "le coût d'entrée est payé d'avance et en entier ; le service rendu, lui, n'est jamais vérifié après coup. C'est la dette de process dans sa forme exacte : chaque registre est légitime, c'est la somme rapportée à l'usage réel qui ne l'est plus",
    });
  }

  // ⑥ Beaucoup d'alertes produites ET des relances rapprochées → on relance parce qu'on n'a pas vu
  //    passer la réponse. Les deux sondes sont calmes séparément : produire beaucoup n'est pas une
  //    faute, relancer non plus. Leur rencontre décrit un cercle.
  if (bruit?.mesurable && allersRetours?.mesurable && bruit.ecartees > 200 && allersRetours.total > 20) {
    trouvailles.push({
      quoi: `${bruit.ecartees} lignes sont écartées de l'affichage à chaque commit, et ${allersRetours.total} relances rapprochées ont lieu hors rafale du crochet`,
      pourquoi: "produire beaucoup n'est pas une faute, relancer non plus — mais ensemble elles décrivent un cercle : ce qui n'est pas vu passer se redemande. C'est le coût du changement de contexte, celui qui ne s'impute à aucune tâche parce qu'il se paie ENTRE elles",
    });
  }

  // ⑦ Une fluidité basse ET des décisions qui attendent → la file ne traîne pas parce qu'on
  //    travaille lentement, mais parce qu'elle attend. Les deux sondes sont calmes séparément.
  if (fluidite?.mesurable && decisions?.mesurable && fluidite.mediane < 0.4 && decisions.attentes.length) {
    trouvailles.push({
      quoi: `${Math.round((1 - fluidite.mediane) * 100)} % du délai d'une tâche est de l'attente, et ${decisions.attentes.length} décisions attendent en ce moment`,
      pourquoi: "c'est le constat central de toute la littérature sur le sujet, vérifié ici : on gagne beaucoup plus en retirant de l'attente qu'en travaillant plus vite. Passer la fluidité de 15 à 30 % divise le délai par deux — aucune optimisation de code n'approche ce rendement",
    });
  }

  // ⑤ Une alerte dort depuis longtemps → elle n'apprend plus rien à personne, mais elle occupe la
  //    place de celle qui compterait.
  for (const v of alertes?.vieilles ?? []) {
    trouvailles.push({
      quoi: `une alerte tient depuis ${v.jours} jours sans être traitée`,
      pourquoi: "passé quelques jours, la question n'est plus ce qu'elle dit mais pourquoi personne ne peut l'éteindre. Une alerte qu'aucune action légitime ne fait taire devient du décor, et elle emporte avec elle celles qu'on devrait lire (leçon L6, et 35 à 91 % de non-actionnables mesurés ailleurs)",
    });
  }

  return { mesurable: true, trouvailles,
    pourquoi: trouvailles.length
      ? `${trouvailles.length} cause(s) indirecte(s) : chacune naît du CROISEMENT de deux mesures dont aucune n'alerte seule`
      : "aucun croisement ne ressort aujourd'hui — ce qui ne dit pas qu'il n'y a pas de lourdeur, seulement qu'aucune paire surveillée ne se rencontre" };
}

// ————————————————————————————————————————————————————————————————————————
// LES ALERTES PRODUITES CONTRE LES ALERTES LUES (2026-09-28, son choix de pouvoirs)
// ————————————————————————————————————————————————————————————————————————
// LA FATIGUE D'ALERTE MESURÉE CHEZ NOUS. La littérature donne 35 à 91 % d'avertissements non
// actionnables, et le mécanisme est toujours le même : passé un certain volume, on cesse de tout
// lire, y compris ce qui compte. Ce dépôt a déjà payé deux cas documentés — le garde-fou des axes
// qui criait sur son propre doublon pendant des jours, l'avertissement moteur facturé deux fois.
//
// PREMIÈRE VERSION, FAUSSE, ET GARDÉE ÉCRITE : elle cherchait dans `.banniere-post-commit.txt` les
// lignes « N ligne(s) au total, M retenue(s) » que la bannière imprime à l'écran. Elle n'en trouvait
// aucune et rendait « PAS MESURÉ » — un refus juste sur une question mal posée. **Ce fichier N'EST
// PAS la bannière : c'est exactement son contraire.** Il contient le RESTE, la part écartée de
// l'affichage, « relue à la demande, jamais perdue ».
//
// CE QUI SE MESURE DONC VRAIMENT, ET C'EST PLUS DIRECT : le fichier lui-même EST la part que
// personne ne voit passer. Sa taille est le volume écrit à chaque commit pour un lecteur qui
// devrait penser à l'ouvrir — et l'ouvrir n'arrive jamais tout seul.
//
// CE QUE CETTE SONDE NE DIT PAS, et le taire serait malhonnête : une ligne écartée n'est pas une
// ligne inutile. Le tri est délibéré et il existe pour rendre la bannière lisible. Ce que ce chiffre
// mesure est le VOLUME derrière le filtre, jamais la qualité de ce qui s'y trouve.
export function alertesEcarteesDeLAffichage({ banniere = lire(".banniere-post-commit.txt") } = {}) {
  if (banniere == null) return pasMesure("les alertes produites contre les alertes lues", "aucune bannière post-commit sur le disque — elle n'existe qu'après un commit, et son absence n'est pas « zéro alerte »");
  const lignes = banniere.split("\n").filter((l) => l.trim());
  // Les sections nommées du reste : elles disent combien de sujets distincts dorment là-dedans.
  const sections = lignes.filter((l) => /^===/.test(l)).length;
  if (!lignes.length) return pasMesure("les alertes écartées de l'affichage", "le fichier de reste est vide — ce qui voudrait dire que la bannière montre tout, et mérite d'être vérifié plutôt que cru");
  return { mesurable: true, ecartees: lignes.length, sections,
    // La part VUE n'est pas calculable depuis ce fichier seul, et l'inventer serait exactement ce
    // que cet outil traque. On rend le volume écarté, qui est un fait, et on dit ce qu'on ignore.
    partVue: null,
    pourquoi: `${lignes.length} ligne(s) réparties sur ${sections} section(s) sont écrites à CHAQUE commit dans le fichier de reste, « relu à la demande » — c'est-à-dire par quelqu'un qui doit y penser. La part réellement lue n'est pas mesurable d'ici, et l'inventer serait précisément le défaut que cet outil traque` };
}

// ————————————————————————————————————————————————————————————————————————
// MES PROPRES ALLERS-RETOURS (2026-09-28, son choix de pouvoirs)
// ————————————————————————————————————————————————————————————————————————
// LE CHANGEMENT DE CONTEXTE EST LE COÛT LE PLUS INVISIBLE DE TOUS, parce qu'il ne s'impute à AUCUNE
// tâche : il se paie ENTRE elles. Relancer deux fois le même outil sans rien avoir changé entre les
// deux, c'est ne pas avoir obtenu la réponse du premier coup.
//
// LE PIÈGE ÉVITÉ, ET IL A FAILLI PRODUIRE UN CHIFFRE ENTIÈREMENT FAUX : une première mesure a
// compté 3 824 relances rapprochées sur 5 750 passages — 66 %. C'était absurde, et pour une raison
// simple : le crochet post-commit lance TOUS les gardiens à chaque commit, donc des dizaines de
// passages du même outil se suivent légitimement. Accuser ce mécanisme aurait été le faux positif
// exact de la leçon L4, sur le geste le plus sain du dépôt.
//
// LE FILTRE PAR ORIGINE NE SUFFIT PAS NON PLUS — mesuré : le crochet lance ses outils en
// sous-processus, donc ils s'enregistrent eux aussi comme `cli_direct`. Le repli naïf donnait
// encore 56 %.
//
// ET LE TEST « UN COMMIT ENTRE LES DEUX » NE SUFFISAIT PAS NON PLUS — troisième version, troisième
// faux chiffre évité de justesse : 46 %, dont 1 178 relances attribuées au seul angel-of-ia-process.
// La raison est évidente une fois dite, et invisible avant : **le crochet tourne APRÈS le commit**,
// donc TOUS ses passages tombent entre deux commits. Le test ne pouvait structurellement pas les
// voir. Trois mesures de suite auraient été livrées fausses, chacune plus crédible que la
// précédente — c'est exactement ainsi qu'un chiffre faux finit par être cru.
//
// ET IL RESTAIT UNE QUATRIÈME FAUSSE MESURE DERRIÈRE — 51 %, dont 910 relances attribuées au seul
// angel-of-ia-process. Vérification faite sur ses événements réels : **les 1 688 sont d'origine
// `fonction`**, sans exception. Ce ne sont pas des sollicitations de l'outil, ce sont des
// enregistrements de FONCTION INTERNE posés par `recordFunctionUsage()` — l'exécution d'une
// fonction à l'intérieur d'un passage, jamais un passage de plus.
//
// QUATRE CHIFFRES FAUX D'AFFILÉE SUR LA MÊME QUESTION, chacun plus crédible que le précédent — 66 %,
// puis 56 %, puis 46 %, puis 51 %. C'est exactement ainsi qu'un chiffre faux finit par être cru : à
// force d'être corrigé, il prend l'air d'un chiffre travaillé. Les quatre sont écrits ici pour que
// personne ne refasse le chemin.
//
// CE QUI TRANCHE VRAIMENT, ET C'EST DOUBLE : on ne garde que les vraies SOLLICITATIONS (jamais les
// enregistrements de fonction), et on écarte la RAFALE du crochet, qui lance ses outils dans les
// secondes suivant un commit. Le reste est à moi.
export const FENETRE_ALLER_RETOUR_MS = 10 * 60 * 1000;
// LA RAFALE DU CROCHET : les outils qu'il lance s'enregistrent tous dans les secondes qui suivent
// un commit. Deux minutes couvre largement un passage complet des gardiens, et rester généreux ici
// est le bon côté de l'erreur : mieux vaut sous-compter mes relances que d'accuser le crochet.
export const RAFALE_DU_CROCHET_MS = 120 * 1000;

export function mesAllersRetours({ history = loadToolUsageHistory(), fenetre = FENETRE_ALLER_RETOUR_MS, rafale = RAFALE_DU_CROCHET_MS, shImpl = sh, minimum = 3 } = {}) {
  // UN ENREGISTREMENT DE FONCTION N'EST PAS UNE SOLLICITATION : `recordFunctionUsage()` note qu'une
  // fonction a tourné À L'INTÉRIEUR d'un passage. Les compter reviendrait à facturer un passage
  // autant de fois qu'il exécute de fonctions.
  const events = (history?.events ?? []).filter((e) => typeof e.at === "number" && e.at > 0 && e.origin !== "fonction" && !e.fonction);
  if (!events.length) return pasMesure("mes allers-retours", "le compteur d'usage ne porte aucune SOLLICITATION datée — il peut porter des enregistrements de fonction, qui ne sont pas la même chose");
  let commits = null;
  try {
    const brut = String(shImpl('git log --format=%ct -n 400')).trim();
    commits = brut ? brut.split("\n").map((x) => Number(x) * 1000).filter(Number.isFinite).sort((a, b) => a - b) : [];
  } catch { commits = null; }
  if (commits === null) return pasMesure("mes allers-retours", "git est illisible ici : sans les dates de commit, impossible de distinguer une relance de ma part d'un passage du crochet — et les deux n'ont rien à voir");
  const unCommitEntre = (a, b) => commits.some((c) => c > a && c < b);
  const dansLaRafale = (t) => commits.some((c) => t >= c && t - c <= rafale);
  events.sort((x, y) => x.at - y.at);
  const horsRafale = events.filter((e) => !dansLaRafale(e.at));
  const par = new Map(); const dernier = new Map();
  for (const e of horsRafale) {
    const prec = dernier.get(e.toolSlug);
    if (prec !== undefined && e.at - prec < fenetre && !unCommitEntre(prec, e.at)) {
      par.set(e.toolSlug, (par.get(e.toolSlug) ?? 0) + 1);
    }
    dernier.set(e.toolSlug, e.at);
  }
  const relances = [...par.entries()].filter(([, n]) => n >= minimum).map(([slug, n]) => ({ slug, relances: n })).sort((a, b) => b.relances - a.relances);
  const total = [...par.values()].reduce((a, b) => a + b, 0);
  const ecartes = events.length - horsRafale.length;
  return { mesurable: true, relances, total, passages: horsRafale.length, ecartesRafale: ecartes,
    part: horsRafale.length ? total / horsRafale.length : null,
    pourquoi: total
      ? `${total} relance(s) rapprochée(s) sans commit entre les deux, sur ${horsRafale.length} passages retenus (${Math.round(100 * total / horsRafale.length)} %) — ${ecartes} passage(s) écarté(s) comme rafale du crochet, qui n'est jamais une friction. C'est le coût qui ne s'impute à aucune tâche, parce qu'il se paie ENTRE elles`
      : `aucune relance rapprochée hors rafale sur ${horsRafale.length} passages retenus (${ecartes} écarté(s) comme rafale du crochet)` };
}

// ————————————————————————————————————————————————————————————————————————
// LA FLUIDITÉ RÉELLE DE LA FILE (2026-09-28, son choix de pouvoirs)
// ————————————————————————————————————————————————————————————————————————
// C'EST LE CHIFFRE QUE LA RECHERCHE DÉSIGNE COMME LE PLUS RENTABLE, et il n'existait nulle part
// ici : sur une tâche TERMINÉE, quelle part du délai total a été du travail, et quelle part de
// l'attente ? Les repères extérieurs : 15 % est courant, passer à 30 % divise le délai par deux,
// 40 % est excellent.
//
// COMMENT ELLE SE CALCULE SANS INVENTER QUOI QUE CE SOIT : l'ouverture est l'horodatage de la ligne
// de suivi ; la clôture est le DERNIER commit qui cite le numéro de la tâche ; les jours travaillés
// sont les jours DISTINCTS où un commit la cite. Tout vient de git et du registre, rien d'une
// impression.
//
// CE QU'ELLE SURESTIME, ET LE TAIRE SERAIT MALHONNÊTE : un jour où un seul commit cite la tâche
// compte pour un jour TRAVAILLÉ ENTIER. La fluidité rendue est donc un PLAFOND — la vraie est plus
// basse. C'est le bon côté de l'erreur : on ne veut pas d'un chiffre qui dramatise, on veut un
// chiffre dont on sait dans quel sens il penche.
//
// ET ELLE REFUSE DE CONCLURE SOUS UN CORPUS MINIMUM : une moyenne sur trois tâches ressemble à une
// statistique sans en être une (BP5, la leçon payée deux fois le 2026-09-27).
//
// LA RESTRICTION AUX TÂCHES QUI ONT RÉELLEMENT DURÉ, et elle a été payée au premier passage réel :
// la première version rendait **une fluidité médiane de 100 %** sur 260 tâches. Arithmétiquement
// juste, et entièrement creux — la majorité des tâches s'ouvrent et se ferment LE MÊME JOUR, donc
// leur fluidité vaut 1 par construction : elles n'ont jamais attendu. La médiane ne mesurait donc
// que la proportion de tâches faites d'un trait.
//
// C'EST LA CINQUIÈME FOIS DE LA JOURNÉE QU'UNE PREMIÈRE MESURE FLATTE, et c'est la forme la plus
// dangereuse du faux vert : un « 100 % » ne se re-vérifie jamais, là où un chiffre bas fait ouvrir
// le dossier (journal XP, entrée 27). La fluidité ne se mesure donc que sur les tâches qui ont
// PASSÉ AU MOINS UNE NUIT — les seules où une attente a pu exister — et le nombre de tâches
// écartées pour cette raison est DIT, jamais escamoté.
export const DUREE_MINIMALE_JOURS = 2;
export const CORPUS_MINIMUM_FLUIDITE = 10;

export function fluiditeDeLaFile({ dossier = "docs/suivi/sessions", lireDir = readdirSync, lireFic = readFileSync, shImpl = sh, minimum = CORPUS_MINIMUM_FLUIDITE } = {}) {
  const abs = join(ROOT, dossier);
  let fichiers;
  try { fichiers = lireDir(abs).filter((f) => f.endsWith(".md")); }
  catch { return pasMesure("la fluidité de la file", `${dossier} est introuvable — sur un autre dépôt ce registre n'existe pas, et c'est un résultat`); }
  const fermees = [];
  for (const f of fichiers) {
    let texte; try { texte = lireFic(join(abs, f), "utf8"); } catch { continue; }
    for (const ligne of texte.split("\n")) {
      if (!ligne.startsWith("| ")) continue;
      const cells = ligne.split("|").slice(1).map((c) => c.trim());
      if (cells.length && cells[cells.length - 1] === "") cells.pop();
      if (!cells.length || !/^\d+$/.test(cells[0])) continue;
      // Même définition partagée qu'au-dessus : « Ouverte → Terminée » EST une clôture (#1199).
      if (!estStatutTermine(cells[cells.length - 1] ?? "")) continue;
      const ouverte = Date.parse(cells[1] ?? "");
      if (!Number.isFinite(ouverte)) continue;
      fermees.push({ numero: Number(cells[0]), ouverte, sujet: (cells[3] ?? "").replace(/\*\*/g, "").slice(0, 60) });
    }
  }
  if (!fermees.length) return pasMesure("la fluidité de la file", "aucune tâche terminée et datée : il n'y a rien à mesurer, ce qui n'est jamais « tout va bien »");
  // UN SEUL APPEL À GIT, JAMAIS UN PAR TÂCHE — et c'est une leçon payée en mesurant.
  // La première version lançait `git log --grep` pour CHAQUE tâche fermée : 324 sous-processus,
  // **15,2 secondes**, et comme deux blocs du filet appellent le passage complet, elle a fait
  // grossir la suite de tests d'une trentaine de secondes à elle seule. JESUS ralentissait le
  // projet qu'il existe pour accélérer.
  //
  // CE QUI L'A TROUVÉE MÉRITE D'ÊTRE ÉCRIT, parce que le premier coupable était le mauvais : le
  // chronomètre d'Ezechiel attribuait 36 s au DERNIER bloc du filet, qui absorbe tout ce qui n'est
  // rattaché à rien. J'ai « optimisé » une sonde d'Abraham sur cette foi — elle prenait déjà 1 s,
  // le gain était nul, et le changement a été annulé. La vraie cause n'est apparue qu'en
  // chronométrant chaque sonde SÉPARÉMENT. Une attribution n'est pas une mesure.
  let journal;
  try {
    // LE SÉPARATEUR N'EST PAS UNE BARRE VERTICALE, et ça s'est vu au premier essai : `|` dans un
    // format git passé au shell est interprété comme un TUBE, et la commande rendait une chaîne
    // vide. Un `git log` muet ressemble à un dépôt sans commits.
    journal = String(shImpl('git log --format=@@%ct@@%s%n%b'));
  } catch { return pasMesure("la fluidité de la file", "git est illisible ici : sans les dates de commit, la part travaillée ne se distingue pas de la part attendue"); }
  // On relève, en UNE passe, quelles dates portent quels numéros de tâche.
  const datesParTache = new Map();
  let horodatage = null;
  for (const ligne of journal.split("\n")) {
    const tete = ligne.match(/^@@(\d{9,11})@@/);
    if (tete) horodatage = Number(tete[1]) * 1000;
    if (horodatage === null) continue;
    for (const m of ligne.matchAll(/#(\d{2,5})\b/g)) {
      const n = Number(m[1]);
      let sac = datesParTache.get(n);
      if (!sac) { sac = new Set(); datesParTache.set(n, sac); }
      sac.add(horodatage);
    }
  }
  const mesurees = [];
  for (const t of fermees) {
    const dates = [...(datesParTache.get(t.numero) ?? [])];
    if (!dates.length) continue;                       // jamais citée en commit : rien à mesurer sur elle
    const fin = Math.max(...dates);
    const ecouleJours = Math.max(1, Math.round((fin - t.ouverte) / 86_400_000));
    const joursTravailles = new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10))).size;
    mesurees.push({ ...t, ecouleJours, joursTravailles, fluidite: Math.min(1, joursTravailles / ecouleJours) });
  }
  // SEULES LES TÂCHES QUI ONT PASSÉ AU MOINS UNE NUIT PEUVENT AVOIR ATTENDU. Les autres ne sont pas
  // « fluides » : elles sont hors sujet, et les compter noierait la mesure dans des 100 % gratuits.
  const memeJour = mesurees.filter((t) => t.ecouleJours < DUREE_MINIMALE_JOURS).length;
  const duree = mesurees.filter((t) => t.ecouleJours >= DUREE_MINIMALE_JOURS);
  if (duree.length < minimum) {
    return { mesurable: false, quoi: "la fluidité de la file",
      pourquoi: `${duree.length} tâche(s) ont duré plus d'une journée, il en faut ${minimum} : une médiane sur si peu ressemble à une statistique sans en être une (${memeJour} tâche(s) écartée(s) parce qu'ouvertes et fermées le même jour — elles n'ont jamais pu attendre, et les compter rendrait un 100 % gratuit)` };
  }
  const tries = [...duree].sort((a, b) => a.fluidite - b.fluidite);
  const mediane = tries[Math.floor(tries.length / 2)].fluidite;
  return { mesurable: true, mesurees: duree.length, memeJour, fermees: fermees.length, mediane,
    lesPlusLentes: tries.slice(0, 5).map((t) => ({ numero: t.numero, sujet: t.sujet, fluidite: t.fluidite, ecouleJours: t.ecouleJours, joursTravailles: t.joursTravailles })),
    pourquoi: `fluidité médiane ${Math.round(mediane * 100)} % sur les ${duree.length} tâche(s) ayant passé au moins une nuit — donc ${Math.round((1 - mediane) * 100)} % du délai est de l'attente. ${memeJour} tâche(s) faites d'un trait sont ÉCARTÉES : leur fluidité vaut 1 par construction, jamais par mérite. Et c'est un PLAFOND : un jour portant un seul commit compte pour un jour travaillé entier, donc la vraie fluidité est plus basse` };
}

// ————————————————————————————————————————————————————————————————————————
// LE COÛT D'UN ARTICLE, VU DU DEHORS (2026-09-28, sa question : « pourquoi chez Jesus ? »)
// ————————————————————————————————————————————————————————————————————————
// LA DÉCISION, ET ELLE SUIT LA CASCADE : la mesure du coût d'un Article se COUPE en deux.
//   · MOÏSE voit le DEDANS — combien d'obligations un Article porte, s'il a été vidé, renuméroté.
//     C'est un fait sur le document, et c'est son périmètre : il le fait déjà, JESUS ne le refait
//     jamais (Article 24 : un registre se LIT, il ne se recopie pas).
//   · JESUS voit le DEHORS — quel code applique réellement cet Article, et s'il a jamais changé une
//     décision. Ça n'est écrit NULLE PART dans la charte, donc aucun outil de document ne peut le
//     lire. C'est précisément la définition de son périmètre : tout ce qui n'est dans aucun fichier
//     de règles.
//
// CE QUE LA SONDE NE DIT JAMAIS, et c'est sa limite honnête : un Article sans porteur dans le code
// n'est PAS inutile. Beaucoup des règles les plus importantes de ce projet ne PEUVENT pas avoir de
// porteur mécanique — « avoir réellement compris avant d'agir » ne se teste pas — et la charte le
// déclare elle-même (Article 27 : déclarer l'impossibilité EST la protection). La sonde rend donc
// un FAIT, jamais un verdict : voici ceux que rien n'applique et que rien ne cite.
export function coutDesArticlesVuDuDehors({ charte = lire("CLAUDE.md"), racines = ["scripts", "docs/suivi"], lireDir = readdirSync, lireFic = readFileSync } = {}) {
  if (charte == null) return pasMesure("le coût des Articles vu du dehors", "CLAUDE.md est introuvable — sur un autre dépôt, la charte porte un autre nom, et supposer serait pire que déclarer");
  const numeros = [...new Set([...charte.matchAll(/\*\*Article\s+(\d+)(?:bis)?\s*[—-]/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
  if (!numeros.length) return pasMesure("le coût des Articles vu du dehors", "aucun Article reconnu dans la charte — sa forme a peut-être changé, et découper au jugé rendrait un tableau entièrement faux");
  const textes = { code: [], suivi: [] };
  const balayer = (dir, sac) => {
    let entrees; try { entrees = lireDir(join(ROOT, dir), { withFileTypes: true }); } catch { return; }
    for (const e of entrees) {
      const chemin = `${dir}/${e.name}`;
      if (e.isDirectory()) { balayer(chemin, sac); continue; }
      if (!/\.(mjs|md)$/.test(e.name)) continue;
      try { sac.push(lireFic(join(ROOT, chemin), "utf8")); } catch { /* illisible : écarté, jamais deviné */ }
    }
  };
  balayer("scripts", textes.code);
  balayer("docs/suivi", textes.suivi);
  if (!textes.code.length) return pasMesure("le coût des Articles vu du dehors", "aucun fichier de code lu : le dénominateur serait vide, et tous les Articles paraîtraient sans porteur");
  const compter = (sac, n) => {
    const motif = new RegExp(`Article\\s+${n}\\b`, "g");
    return sac.reduce((t, txt) => t + (txt.match(motif) ?? []).length, 0);
  };
  const articles = numeros.map((n) => ({ numero: n, dansLeCode: compter(textes.code, n), dansLeSuivi: compter(textes.suivi, n) }));
  const muets = articles.filter((a) => a.dansLeCode === 0 && a.dansLeSuivi === 0);
  return { mesurable: true, articles, muets, lus: numeros.length, fichiersCode: textes.code.length,
    pourquoi: muets.length
      ? `${muets.length} Article(s) sur ${numeros.length} ne sont cités NI dans le code NI dans le suivi : ${muets.map((a) => a.numero).join(", ")}. CE N'EST PAS UN VERDICT — beaucoup des règles les plus importantes ne PEUVENT pas avoir de porteur mécanique, et la charte le déclare elle-même. C'est un fait, à confronter au DEDANS que MOÏSE mesure`
      : `les ${numeros.length} Articles sont cités au moins une fois dans le code ou dans le suivi` };
}

// ————————————————————————————————————————————————————————————————————————
// LE TAUX D'ACTIONNABILITÉ (2026-09-28) — le RETENU de la recherche qui avait été OUBLIÉ
// ————————————————————————————————————————————————————————————————————————
// IL A DEMANDÉ « qu'est-ce qu'on a oublié ? », ET LA RÉPONSE ÉTAIT ÉCRITE DEPUIS LE MATIN.
// Le plan d'action de la fiche de recherche (docs/recherches/ralentissements-causes-indirectes.md)
// portait QUATRE constats RETENUS. Trois ont été codés le jour même. Le quatrième — « le taux
// d'actionnabilité des alertes » — ne l'a jamais été, et rien ne le disait.
//
// C'EST EXACTEMENT CE QUE L'ARTICLE 28 EXISTE POUR EMPÊCHER, commis sur le rapport qui a servi à
// construire l'outil qui traque ce genre de chose. Un plan d'action dont un RETENU ne devient
// jamais du travail est un constat oublié — et il est d'autant mieux caché que les trois autres
// ont été faits : le rapport a l'air traité.
//
// CE QU'IL MESURE, ET POURQUOI C'EST LE CHIFFRE DE LA FATIGUE D'ALERTE : la littérature donne 35 à
// 91 % d'avertissements non actionnables, mais ce taux-là se mesure sur des avertissements
// d'analyseur. Ici, l'équivalent exact existe et personne ne le calculait : parmi tous les constats
// que les rapports de ce dépôt ont RETENUS — donc jugés dignes d'action par l'outil lui-même —
// combien sont réellement devenus une tâche ?
//
// IL NE REFAIT PAS LE TRAVAIL DE god-of-all-process (Article 24/31) : `checkActionChain()` sait
// déjà juger UN plan d'action contre le suivi. Ce qu'elle ne fait pas, c'est le TAUX sur l'ensemble.
//
// ————————————————————————————————————————————————————————————————————————
// ET LE PREMIER PASSAGE A RENDU « 0 % SUR 323 CONSTATS ». CE CHIFFRE EST FAUX, ET IL N'A PAS ÉTÉ
// LIVRÉ — c'est le sixième faux chiffre écarté dans la construction de cet outil, et le plus
// spectaculaire. Un « 0 % » ACCUSE, donc il aurait été regardé ; mais il aurait envoyé chercher un
// problème qui n'existe pas, pendant que le vrai restait invisible.
//
// LA CAUSE, ET C'EST UNE VRAIE TROUVAILLE SUR L'ARTICLE 28 : un plan d'action écrit sa tâche EN
// PROSE — « tâche [RECOMMANDEE] : relancer avec les trois durées » — et **ne cite jamais son
// NUMÉRO**. Je cherchais donc dans le texte quelque chose que le format ne contient pas. Les 5 qui
// portaient un « #1234 » le portaient par hasard, dans le libellé du constat.
//
// CE QUE ÇA RÉVÈLE VAUT MIEUX QUE LE TAUX : **la chaîne de l'Article 28 n'est pas vérifiable
// mécaniquement à l'échelle**. `checkActionChain()` la vérifie sur UN plan, au moment où il est
// produit, parce que l'agent lui passe le numéro qu'il vient d'écrire. Mais une fois le rapport sur
// le disque, plus rien ne relie ses constats retenus aux tâches réelles — 323 constats sans
// traçabilité arrière.
//
// LA SONDE DÉCLARE DONC L'IMPOSSIBILITÉ plutôt que de rendre un pourcentage fabriqué (leçons
// L5/L11, et Article 27 : déclarer une impossibilité EST la protection). Elle rend le VOLUME, qui
// est un fait, et nomme ce qui manquerait pour rendre le taux calculable.
export const MOTIF_RETENU = /^\s*→?\s*RETENU\s*·\s*(.+?)\s*—\s*tâche\s*\[/gim;
export const MOTIF_TACHE_CITEE = /#(\d{2,5})\b/;

export function tauxDActionnabilite({ racineRapports = "docs", lireDir = readdirSync, lireFic = readFileSync, suivi = null, minimum = 10 } = {}) {
  const suiviTexte = suivi ?? (() => {
    let t = "";
    try {
      for (const f of lireDir("docs/suivi/sessions")) {
        if (f.endsWith(".md")) { try { t += lireFic(join("docs/suivi/sessions", f), "utf8"); } catch { /* illisible */ } }
      }
    } catch { return null; }
    return t;
  })();
  if (suiviTexte == null) {
    return pasMesure("le taux d'actionnabilité", "le registre des tâches est introuvable : sans lui on peut voir qu'un constat n'annonce aucune tâche, jamais vérifier qu'une tâche annoncée existe pour de vrai — deux questions différentes");
  }
  // On balaie les rapports déposés par les outils : ce sont eux qui portent les plans d'action.
  const fichiers = [];
  const pile = [racineRapports];
  while (pile.length) {
    const courant = pile.pop();
    let entrees; try { entrees = lireDir(courant, { withFileTypes: true }); } catch { continue; }
    for (const e of entrees) {
      const chemin = `${courant}/${e.name}`;
      if (e.isDirectory()) { if (!/^(suivi|contexte-projet|archives)$/.test(e.name)) pile.push(chemin); continue; }
      if (e.name.endsWith(".md") || e.name.endsWith(".txt")) fichiers.push(chemin);
    }
  }
  let retenus = 0, avecTache = 0, tacheReelle = 0;
  const orphelins = [];
  for (const f of fichiers) {
    let texte; try { texte = lireFic(f, "utf8"); } catch { continue; }
    if (!texte.includes("RETENU ·")) continue;
    for (const ligne of texte.split("\n")) {
      if (!/RETENU\s*·/.test(ligne)) continue;
      retenus += 1;
      const m = ligne.match(MOTIF_TACHE_CITEE);
      if (!m) { orphelins.push({ fichier: f, constat: ligne.replace(/^\s*[→\-\s]*/, "").slice(0, 90) }); continue; }
      avecTache += 1;
      // LA RÉFÉRENCE MORTE EST PIRE QU'UNE ABSENCE : elle ressemble à un lien. Même vérification
      // que checkActionChain(), et pour la même raison.
      if (new RegExp(`\\|\\s*${m[1]}\\s*\\|`).test(suiviTexte)) tacheReelle += 1;
      else orphelins.push({ fichier: f, constat: ligne.slice(0, 90), tacheMorte: m[1] });
    }
  }
  if (retenus < minimum) {
    return { mesurable: false, quoi: "le taux d'actionnabilité",
      pourquoi: `${retenus} constat(s) RETENU(S) trouvé(s) dans les rapports, il en faut ${minimum} : un taux sur si peu ressemble à une statistique sans en être une (BP5)` };
  }
  // LE TAUX N'EST PAS CALCULABLE, ET C'EST LA TROUVAILLE. On rend le volume — un fait — et on dit
  // précisément ce qui manque, plutôt qu'un pourcentage que le format ne permet pas de produire.
  return { mesurable: false, quoi: "le taux d'actionnabilité", retenus, avecNumero: avecTache, volumeMesure: true,
    pourquoi: `${retenus} constat(s) RETENU(S) dorment dans les rapports du dépôt, et le taux d'actionnabilité N'EST PAS CALCULABLE — pas par manque de données, par manque de LIEN : un plan d'action écrit sa tâche en PROSE (« tâche [RECOMMANDEE] : … ») et ne cite jamais son NUMÉRO. Seuls ${avecTache} portent un « #nnnn », et par hasard, dans le libellé du constat. checkActionChain() vérifie la chaîne sur UN plan au moment où il est produit ; une fois le rapport sur le disque, plus rien ne relie ses constats aux tâches réelles. CE QUI LE RENDRAIT CALCULABLE : que le plan d'action inscrive le numéro de la tâche qu'il a fait naître` };
}

// ————————————————————————————————————————————————————————————————————————
// LA CASCADE DES PROPHÈTES DU TEMPS — « rien ne passe à la trappe »
// ————————————————————————————————————————————————————————————————————————
// SA DESCRIPTION EXACTE, le 2026-09-28 : « SI on s'adresse à Jesus pour intervenir sur la charte,
// il voit éventuellement s'il y a quelque chose de l'ordre de son périmètre, puis renvoie chez
// Abraham qui voit aussi éventuellement s'il y a quelque chose de l'ordre de son périmètre, qui
// renvoie chez Moïse, pour être sûr qu'il n'y a pas un problème connexe indirect au problème dans
// la charte. […] c'est optimisé au maximum, rien ne passe à la trappe. »
//
// CE QUE LA CASCADE CHANGE, ET CE N'EST PAS UN DÉTAIL D'ORCHESTRATION. Sans elle, s'adresser à
// MOÏSE pour un problème de charte ne rend QUE ce que MOÏSE sait voir : le document. Or un
// problème de charte a presque toujours un voisin ailleurs — une obligation qui n'est lourde que
// parce qu'aucun outil ne la porte, un Article cité par un outil que plus personne n'appelle. Ce
// voisin est invisible à chacun pris seul, et c'est exactement la définition d'une cause indirecte.
//
// L'ORDRE VA DU PLUS LARGE AU PLUS ÉTROIT, ET C'EST DÉLIBÉRÉ : JESUS voit tout ce qui est hors
// documents, ABRAHAM tout document à règles numérotées, MOÏSE la seule charte. Chacun regarde ce
// qu'il est SEUL à savoir voir, puis passe la main — jamais l'inverse, sinon le plus étroit
// conclurait avant que le plus large ait parlé, et son verdict paraîtrait complet.
//
// PERSONNE N'EST SAUTÉ PARCE QUE LE PRÉCÉDENT N'A RIEN TROUVÉ. C'est le cœur du « rien ne passe à
// la trappe » : un maillon muet n'autorise jamais à s'arrêter, parce que le silence de l'un ne dit
// rien de ce que le suivant verra. Un maillon ABSENT du dépôt se déclare, il ne se contourne pas.
// L'ORDRE EST UNE LARGEUR DÉCROISSANTE, ET C'EST CE QUI REND LA CHAÎNE JUSTE : chaque maillon voit
// STRICTEMENT MOINS que le précédent, et voit DANS CE MOINS ce que le précédent ne saurait pas lire.
// EZECHIEL y a été AJOUTÉ le 2026-09-28 sur son rappel — « comment s'inscrit Ezechiel dans la
// cascade ? ne l'oublions pas » — et sa place tombe d'elle-même : il est le plus étroit de tous,
// un FICHIER précis. Il manquait, et son absence était exactement le genre de trou que la chaîne
// existe pour fermer.
export const CASCADE = [
  { rang: 1, qui: "JESUS-LE-SAUVEUR", script: "scripts/jesus-le-sauveur.mjs", niveau: "leger",
    perimetre: "tout ce qui est HORS documents : le rythme, les obligations, l'attention, l'attente",
    seulALeVoir: "le coût d'une règle en temps réel, et le fait qu'un outil censé la porter ne sert plus" },
  { rang: 2, qui: "ABRAHAM-LES-REFERENCES", script: "scripts/abraham-les-references.mjs", niveau: "standard",
    // SON PÉRIMÈTRE A ÉTÉ ÉLARGI LE 2026-09-28 (tâche #1104), sur un trou qu'il a vu en posant une
    // autre question : « si Abraham s'arrête aux docs de référence AVEC RÈGLE, qui gère LES AUTRES
    // DOCS ? ». Réponse mesurée : PERSONNE — 396 documents sur 482, soit 82 %, tombaient entre les
    // mailles de la cascade. On élargit une capacité plutôt que d'ajouter un cinquième maillon :
    // la frontière entre les quatre était juste, c'est la COUVERTURE d'un maillon qui était courte.
    perimetre: "TOUS les documents — analyse profonde de ceux qui portent des règles, hygiène pour les autres — et le chapeau des DOCUMENTS",
    seulALeVoir: "un renvoi mort, une règle sans porteur réel, deux documents qui se recouvrent, et un document que RIEN ne cite" },
  { rang: 3, qui: "MOÏSE-TABLES-DE-LOI", script: "scripts/moise-tables-de-loi.mjs", niveau: "standard",
    perimetre: "la charte seule",
    seulALeVoir: "un Article disparu, renuméroté, inséré au milieu, ou vidé de ses obligations" },
  { rang: 4, qui: "EZECHIEL-LES-TESTS", script: "scripts/ezechiel-les-tests.mjs", niveau: "approfondi",
    perimetre: "le filet et sa machinerie — un FICHIER précis qui fait perdre du temps",
    seulALeVoir: "un bloc sauté, un test vert et vide, une assertion qui ne peut pas échouer, d'où vient le temps" },
];

// LE SECOND AXE, ET IL EXISTAIT DÉJÀ SANS ÊTRE BRANCHÉ (2026-09-28, sa question : « est-ce que tous
// ces outils ont un mode léger/ciblé/lourd ? on avait parlé des couches et des modes light/target/
// warrior, ça en est où ? »).
//
// RÉPONSE MESURÉE : le système existe depuis le 2026-09-19 et s'appelle CHECK-LEVEL-TARGET. Il
// porte QUATRE niveaux — `leger`, `standard`, `approfondi`, `exceptionnel` — il sait les DÉDUIRE
// d'une phrase, et il dit déjà quels outils tournent à chaque niveau. Ce qui manquait n'était donc
// pas le système : c'est que la cascade ne le consultait pas.
//
// LES DEUX AXES SONT ORTHOGONAUX, ET C'EST TOUT L'INTÉRÊT — les confondre donnerait un réglage
// unique qui ne sait rien régler :
//   · la CASCADE dit JUSQU'OÙ ON REGARDE EN LARGEUR : combien de périmètres sont couverts ;
//   · le NIVEAU dit JUSQU'OÙ ON CREUSE : ce que ça coûte, et ce qu'on accepte de payer.
// Une réparation de coquille veut une largeur complète et une profondeur minimale ; un audit de
// charte veut l'inverse. Un seul curseur ne peut pas rendre les deux.
export const NIVEAUX = ["leger", "standard", "approfondi", "exceptionnel"];

// maillonsPourNiveau() — QUI PARLE À CE NIVEAU. Un maillon dont le niveau dépasse celui demandé
// n'est PAS silencieux : il est DIFFÉRÉ, et le rapport le nomme. La distinction est toute la
// valeur de la chaîne — « rien à dire » et « pas convoqué » n'envoient pas au même endroit.
export function maillonsPourNiveau(niveau = "standard", { cascade = CASCADE, ordre = NIVEAUX } = {}) {
  const plafond = ordre.indexOf(niveau);
  if (plafond === -1) {
    return { mesurable: false, pourquoi: `niveau « ${niveau} » inconnu : les niveaux sont ${ordre.join(", ")}. Choisir un niveau au hasard reviendrait à décider du coût à la place de l'utilisateur` };
  }
  const convoques = cascade.filter((m) => ordre.indexOf(m.niveau) <= plafond);
  const differes = cascade.filter((m) => ordre.indexOf(m.niveau) > plafond);
  return { mesurable: true, niveau, convoques, differes,
    pourquoi: `${convoques.length} maillon(s) convoqué(s) au niveau « ${niveau} »${differes.length ? `, ${differes.length} DIFFÉRÉ(S) faute de niveau : ${differes.map((m) => m.qui).join(", ")} — différé n'est pas muet, et la nuance décide où l'on va chercher ensuite` : ", aucun différé : la largeur est complète"}` };
}

// LE SUJET DÉCIDE DU POINT D'ENTRÉE, JAMAIS DE L'ARRÊT. Adresser un sujet de charte à JESUS ne
// saute pas les deux autres : ça fixe seulement qui parle en premier. La cascade se déroule ensuite
// en entier, dans l'ordre du rang.
export function cascadePour(sujet = "", { cascade = CASCADE, niveau = "standard", existe = (c) => existsSync(join(ROOT, c)) } = {}) {
  const parNiveau = maillonsPourNiveau(niveau, { cascade });
  const retenus = parNiveau.mesurable ? parNiveau.convoques : cascade;
  const maillons = retenus.map((m) => ({
    ...m,
    present: existe(m.script),
    // Un maillon absent n'est pas « rien à dire » : c'est un angle qu'on ne couvre pas, et la
    // différence est toute la valeur de la chaîne (leçons L5/L11).
    etat: existe(m.script) ? "à convoquer" : "ABSENT DU DÉPÔT — cet angle ne sera pas couvert, et ce n'est pas la même chose que « rien trouvé »",
  }));
  return {
    mesurable: true, sujet, niveau, maillons,
    differes: parNiveau.mesurable ? parNiveau.differes : [],
    absents: maillons.filter((m) => !m.present).map((m) => m.qui),
    // LE RASSEMBLEUR EST NOMMÉ DANS LA CHAÎNE, jamais laissé implicite (2026-09-28, sa question :
    // « l'autre outil, assainissement — quel est son rôle par rapport à la cascade ? »). La réponse
    // tient en une phrase : la cascade DÉROULE, `assainissement` RAMASSE. Ce sont deux gestes
    // opposés, et c'est pour ça qu'ils ne se remplacent pas — une chaîne qui ramasserait elle-même
    // devrait garder la mémoire de ses passages, ce qu'un registre partagé fait déjà mieux.
    rassembleur: { qui: "ABRAHAM-LES-REFERENCES", commande: "node scripts/abraham-les-references.mjs assainissement",
      quoi: "ramasse les alertes déposées par les maillons dans le registre partagé, dit leur ÂGE, et signale celles qui traînent — ce que personne ne voit en lançant les outils un par un" },
    pourquoi: `${maillons.length} maillon(s) au niveau « ${niveau} », du plus large au plus étroit. Aucun n'est sauté parce que le précédent s'est tu : le silence de l'un ne dit rien de ce que le suivant verra`,
  };
}

export function lignesDeLaCascade(c) {
  const L = [`=== LA CASCADE DES PROPHÈTES DU TEMPS${c.sujet ? ` — sujet : « ${c.sujet} »` : ""} ===`];
  L.push(`  Deux axes qui ne se recouvrent jamais : la LARGEUR (qui regarde) et la PROFONDEUR (jusqu'où). Niveau demandé : « ${c.niveau} ».`);
  L.push("  Du plus large au plus étroit. Chacun regarde ce qu'il est SEUL à savoir voir, puis passe la main.");
  L.push("");
  for (const m of c.maillons) {
    L.push(`  ${m.rang}. ${m.qui} — ${m.etat}`);
    L.push(`     périmètre : ${m.perimetre}`);
    L.push(`     lui seul voit : ${m.seulALeVoir}`);
    L.push(`     ${m.present ? `node ${m.script}` : "— rien à lancer"}`);
    L.push("");
  }
  for (const d of c.differes ?? []) {
    L.push(`  ⏸ ${d.rang}. ${d.qui} — DIFFÉRÉ : demande le niveau « ${d.niveau} », non atteint ici`);
    L.push(`     ce qu'on ne saura donc pas : ${d.seulALeVoir}`);
    L.push("");
  }
  if (c.rassembleur) {
    L.push(`  ↳ PUIS LE RASSEMBLEUR — ${c.rassembleur.qui}`);
    L.push(`     ${c.rassembleur.quoi}`);
    L.push(`     ${c.rassembleur.commande}`);
    L.push("");
  }
  L.push(`  ${c.pourquoi}.`);
  if (c.absents.length) L.push(`  🚨 ${c.absents.length} maillon(s) absent(s) : ${c.absents.join(", ")} — la chaîne est INCOMPLÈTE, et le dire vaut mieux que de rendre un verdict qui aurait l'air entier.`);
  return L;
}

// ————————————————————————————————————————————————————————————————————————
// LE PASSAGE COMPLET
// ————————————————————————————————————————————————————————————————————————

export function passage(options = {}) {
  const filet = coutDuFilet(options);
  const remedes = outilsAbandonnesApresConstruction(options);
  const arrivant = coutDUnArrivant(options);
  const alertes = alertesQuiNeSEteignentPas(options);
  const decisions = decisionsEnAttente(options);
  const bruit = alertesEcarteesDeLAffichage(options);
  const allersRetours = mesAllersRetours(options);
  const fluidite = fluiditeDeLaFile(options);
  const articles = coutDesArticlesVuDuDehors(options);
  const actionnabilite = tauxDActionnabilite(options);
  const croisements = causesIndirectes({ filet, remedes, arrivant, alertes, decisions, bruit, allersRetours, fluidite, articles, actionnabilite });
  return { filet, remedes, arrivant, alertes, decisions, bruit, allersRetours, fluidite, articles, actionnabilite, croisements };
}

export function lignesDuPassage(p) {
  const L = [];
  const dire = (titre, s, detail = () => []) => {
    L.push(`--- ${titre}`);
    if (!s?.mesurable) { L.push(`  PAS MESURÉ — ${s?.pourquoi ?? "raison non fournie"}`); L.push(""); return; }
    L.push(`  ${s.pourquoi}`);
    for (const d of detail(s)) L.push(`    ${d}`);
    L.push("");
  };
  dire("① LE TEMPS MACHINE — le filet", p.filet);
  dire("① LE TEMPS MACHINE — les outils qui n'ont servi qu'à se construire", p.remedes,
    (s) => (s.abandonnes ?? []).map((d) => `· ${d.slug} : ${d.jourUn}/${d.passages} passages le jour un (${Math.round(d.part * 100)} %), premier passage il y a ${d.joursDepuisNaissance} j, rien depuis ${d.joursDepuisDernier} j`));
  dire("② LES OBLIGATIONS — ce que coûte un outil de plus", p.arrivant);
  dire("② LES OBLIGATIONS — les Articles que rien n'applique et que rien ne cite", p.articles,
    (s) => (s.muets ?? []).slice(0, 10).map((a) => `· Article ${a.numero} — 0 citation dans le code, 0 dans le suivi`));
  dire("③ LES ALERTES QUE PERSONNE N'ÉTEINT", p.alertes,
    (s) => (s.vieilles ?? []).map((v) => `· ${v.jours} j — ${v.outil ?? v.source ?? "origine non nommée"} : ${String(v.quoi ?? v.constat ?? "").slice(0, 90)}`));
  dire("③ LES ALERTES ÉCARTÉES DE L'AFFICHAGE À CHAQUE COMMIT", p.bruit);
  dire("③ LE TAUX D'ACTIONNABILITÉ — combien de constats RETENUS sont devenus une tâche", p.actionnabilite,
    (s) => (s.orphelins ?? []).slice(0, 5).map((o) => `· ${o.tacheMorte ? `tâche #${o.tacheMorte} ANNONCÉE mais absente` : "aucune tâche annoncée"} — ${o.constat}`));
  dire("④ LES FRICTIONS — mes propres allers-retours", p.allersRetours,
    (s) => (s.relances ?? []).slice(0, 6).map((r) => `· ${r.slug} : ${r.relances} relance(s) rapprochée(s) sans commit entre les deux`));
  dire("④ LA FLUIDITÉ — quelle part du délai est du travail, quelle part de l'attente", p.fluidite,
    (s) => (s.lesPlusLentes ?? []).map((t) => `· #${t.numero} ${Math.round(t.fluidite * 100)} % — ${t.joursTravailles} j travaillé(s) sur ${t.ecouleJours} j écoulés — ${t.sujet}`));
  dire("④ LES FRICTIONS DE L'ÉCHANGE — depuis quand une décision attend", p.decisions,
    (s) => (s.attentes ?? []).slice(0, 8).map((a) => `· ${a.jours ?? "?"} j — #${a.numero} ${a.sujet}`));
  L.push("=== LA VUE 360 — les causes INDIRECTES, celles qu'aucune sonde ne voit seule ===");
  if (!p.croisements.trouvailles.length) L.push(`  ${p.croisements.pourquoi}`);
  for (const t of p.croisements.trouvailles) { L.push(`  🔗 ${t.quoi}`); L.push(`     ${t.pourquoi}`); L.push(""); }
  return L;
}

export function planDuPassage(p) {
  const constats = [];
  for (const t of p.croisements.trouvailles ?? []) {
    constats.push({ constat: t.quoi, etat: "retenu", niveau: "recommandee",
      tache: `traiter la cause, jamais le symptôme (Article 3) : ${t.pourquoi.slice(0, 160)}` });
  }
  for (const s of [p.filet, p.remedes, p.arrivant, p.alertes, p.decisions]) {
    if (!s?.mesurable) constats.push({ constat: `non mesurable : ${s?.quoi ?? "une sonde"}`, etat: "a-trancher",
      pourquoi: `${s?.pourquoi ?? ""} — une absence de mesure n'est jamais une absence de problème (leçons L5/L11)` });
  }
  // JESUS NE TRANCHE JAMAIS CE QUI RELÈVE DE L'UTILISATEUR. Le nombre de décisions en attente est un
  // FAIT sur la file ; ce qu'on en fait est à lui, et le dire est la seule posture honnête.
  if (p.decisions?.mesurable && p.decisions.attentes.length) {
    constats.push({ constat: `${p.decisions.attentes.length} décision(s) en attente de l'utilisateur`, etat: "a-trancher",
      pourquoi: "JESUS mesure l'attente, il ne la reproche à personne — les lui présenter par lots est le seul geste qui reste de mon côté" });
  }
  return buildPlanDaction(constats, { toolSlug: "jesus-le-sauveur" });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  recordCliUsage("jesus-le-sauveur");
  printReliabilityNotice("jesus-le-sauveur");
  printReportHeader({
    tool: "jesus-le-sauveur",
    title: "JESUS-LE-SAUVEUR — ce qui freine le projet, causes indirectes comprises",
    subtitle: "Il signale et propose. Il ne corrige jamais seul, et ne touche jamais à la charte.",
    scriptPath: "scripts/jesus-le-sauveur.mjs",
    origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct",
  });
  const sousCommande = process.argv[2];
  if (sousCommande === "cascade") {
    // LE NIVEAU SE DONNE, OU SE DÉDUIT DU SUJET PAR CHECK-LEVEL-TARGET — jamais décidé au hasard.
    const args = process.argv.slice(3);
    const iNiveau = args.findIndex((a) => NIVEAUX.includes(a));
    const niveau = iNiveau === -1 ? "standard" : args[iNiveau];
    const sujet = args.filter((_, k) => k !== iNiveau).join(" ");
    for (const l of lignesDeLaCascade(cascadePour(sujet, { niveau }))) console.log(l);
  } else {
    const p = passage();
    for (const l of lignesDuPassage(p)) console.log(l);
    // LA CASCADE EST TOUJOURS RAPPELÉE APRÈS UN PASSAGE, jamais réservée à une commande qu'il
    // faudrait penser à taper : « il suffit de convoquer Jesus pour mettre en action tout le
    // système ». Un système qu'on doit se souvenir de déclencher n'est pas un système (leçon L2).
    console.log("");
    for (const l of lignesDeLaCascade(cascadePour())) console.log(l);
    imprimerPlanDaction(planDuPassage(p));
  }
}
