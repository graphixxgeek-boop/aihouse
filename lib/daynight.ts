// Cycle jour/nuit (2026-09-19, demande explicite de l'utilisateur : « je veux que ce principe soit
// déjà installé silencieusement, avec des effets concrets sur la fatigue » — habillage graphique
// (lumière extérieure le jour, lampes/bougies chaudes la nuit) volontairement reporté à la refonte
// graphique groupée (cf. CLAUDE.md, Plan d'origine, chantiers 4/5/6), mais le SYSTÈME derrière doit
// déjà exister et avoir des effets réels dès maintenant.
//
// Horloge choisie : le ROUND, jamais Date.now() (cf. docs/referentiel/regles-du-temps.md, section 1
// — « ne jamais écrire un seuil temporel sans préciser laquelle des deux horloges il utilise »).
// Décision actée avec l'utilisateur (question de calibrage explicite) : minuit doit TOUJOURS tomber
// exactement au moment où l'enquête bascule en urgence absolue (round>=20, `investigationOverdue`,
// cf. lib/turn.ts), quelle que soit la vitesse à laquelle l'observateur joue. Seule l'horloge de
// round garantit cette synchronisation dans TOUS les cas (mode `autonomous`, rythme fixe 20s/tour ;
// mode `interact`, rythme variable selon la vitesse de lecture) — une horloge en temps réel aurait pu
// dériver par rapport au plafond mécanique de l'enquête sur une session jouée très vite ou très
// lentement, ce que l'utilisateur a explicitement refusé.
//
// Calibrage des durées (2026-09-19) : l'utilisateur demande un jour de 10 minutes réelles et une
// nuit de 3 minutes réelles (cycle de 13 minutes), avec minuit à la 12e minute du cycle — c'est très
// exactement l'estimation déjà documentée pour le plafond garanti de l'enquête (~35 tours, ~12
// minutes réelles à ~20,5s/tour, cf. regles-du-temps.md section 2/3). Traduit en tours au même
// rythme de référence (600s/20,5 ≈ 29 tours de jour, 180s/20,5 ≈ 9 tours de nuit, 720s/20,5 ≈ 35
// tours pour minuit) : le nombre 35 n'est pas une coïncidence, c'est la preuve que le plafond de
// l'enquête avait déjà été calé, sans le savoir, sur le moment où minuit sonnerait. Minuit tombe au
// tour 35 sur une nuit de 9 tours (29 à 37) — proche du milieu (qui serait le tour 33), pas
// exactement au centre géométrique : décision assumée pour préserver EXACTEMENT le plafond déjà
// testé plutôt que de le décaler pour une symétrie parfaite (Article 3 : ne jamais réintroduire un
// écart déjà corrigé une fois).
export const DAY_ROUNDS = 29;
export const NIGHT_ROUNDS = 9;
export const CYCLE_ROUNDS = DAY_ROUNDS + NIGHT_ROUNDS; // 38
// Décalage de minuit à l'intérieur du cycle (pas à l'intérieur de la nuit) : round%CYCLE_ROUNDS===35.
export const MIDNIGHT_OFFSET = 35;

export type DayNightPhase = "aube" | "milieu-jour" | "crepuscule" | "tombee-nuit" | "minuit" | "fin-nuit";

// Position dans le cycle courant, toujours positive (round part toujours de 0, jamais négatif en
// pratique, mais le modulo est défensif au cas où).
export function cyclePosition(round: number): number {
  return ((round % CYCLE_ROUNDS) + CYCLE_ROUNDS) % CYCLE_ROUNDS;
}
export function dayIndex(round: number): number {
  return Math.floor(round / CYCLE_ROUNDS) + 1;
}
export function isNight(round: number): boolean {
  return cyclePosition(round) >= DAY_ROUNDS;
}
// Minuit sonne exactement à ce tour, puis à chaque multiple du cycle suivant (round 35, 73, 111...).
export function isMidnight(round: number): boolean {
  return cyclePosition(round) === MIDNIGHT_OFFSET;
}
// Marqueurs explicites début/milieu/fin (demande explicite de l'utilisateur), un par phase :
//  - jour : aube (round 0 du cycle) → milieu-jour (~round 14, la moitié de 29) → crépuscule (round 28,
//    dernier tour avant la nuit)
//  - nuit : tombée de la nuit (round 29) → minuit (round 35, cf. calibrage ci-dessus) → fin de nuit
//    (round 37, dernier tour avant l'aube suivante)
const DAY_MIDDLE_OFFSET = Math.floor(DAY_ROUNDS / 2); // 14
const DAY_END_OFFSET = DAY_ROUNDS - 1; // 28
const NIGHT_END_OFFSET = CYCLE_ROUNDS - 1; // 37
export function phaseOf(round: number): DayNightPhase {
  const p = cyclePosition(round);
  if (p === 0) return "aube";
  if (p === DAY_MIDDLE_OFFSET) return "milieu-jour";
  if (p === DAY_END_OFFSET) return "crepuscule";
  if (p === DAY_ROUNDS) return "tombee-nuit";
  if (p === MIDNIGHT_OFFSET) return "minuit";
  if (p === NIGHT_END_OFFSET) return "fin-nuit";
  return p < DAY_ROUNDS ? "milieu-jour" : "minuit";
}
export const phaseLabel: Record<DayNightPhase, string> = {
  "aube": "Aube",
  "milieu-jour": "Jour",
  "crepuscule": "Crépuscule",
  "tombee-nuit": "Tombée de la nuit",
  "minuit": "Minuit",
  "fin-nuit": "Fin de nuit",
};
// Multiplicateur appliqué au taux de fatigue passif (lib/simulation.ts::advanceNeeds). La nuit, la
// fatigue s'accumule 3x plus vite (retour utilisateur explicite : « les persos sont plus vite
// fatigués et ont tendance à s'endormir »).
//
// Corrigé le 2026-09-19 (trouvé en lançant scripts/check-house.mjs juste après la première version
// de ce fichier, qui mettait le jour à ×0) : `fatigueRate` (lib/simulation.ts) est LE taux déjà
// calibré et testé pour tout le jeu existant depuis le début, jamais pensé comme un taux « de nuit
// exceptionnel » — le geler à 0 le jour aurait silencieusement changé le rythme de fatigue de
// TOUTES les sessions passées (la quasi-totalité d'une partie se déroule de toute façon dans les 29
// premiers tours du tout premier cycle, donc « le jour »), cassant des dizaines d'assertions déjà
// vertes sans lien apparent avec ce chantier (Article 19 : comprendre l'existant avant de le
// changer — ici, compris seulement en le lançant, pas seulement en le lisant, leçon retenue).
// Le jour garde donc le taux normal ×1 (zéro régression, comportement identique à avant ce
// chantier) ; c'est la NUIT qui est l'exception qui accélère, jamais l'inverse — cohérent avec la
// demande de l'utilisateur une fois reformulée sans casser l'existant : « pas spécialement
// fatigués le jour » se lit comme « rythme normal et lent », pas comme littéralement zéro.
// La « dette de sommeil » (exception 1 demandée) reste acquise gratuitement de la même façon :
// la jauge n'est jamais remise à zéro au lever du jour, donc un reliquat de fatigue d'une nuit trop
// courte continue simplement à s'additionner au rythme normal du jour suivant, sans redescendre par
// magie. L'autre exception (choc émotionnel fort) n'utilise jamais ce multiplicateur : elle reste un
// ajout ponctuel et additif appliqué ailleurs (route.ts, aux points où une dispute ou une hostilité
// sévère sont déjà détectées), pour ne jamais dépendre de l'heure du jour.
export function fatigueRateMultiplier(round: number): number {
  return isNight(round) ? 3 : 1;
}
