// lib-json.mjs — LE chargeur de JSON de l'Agence, et le seul (2026-09-23, tâche #216, accord
// explicite de l'utilisateur : « Oui, un seul chargeur partagé »).
//
// POURQUOI CE FICHIER EXISTE, et l'histoire vaut d'être laissée ici (Article 27 : le POURQUOI vit à
// côté du QUOI, sinon le prochain agent supprime ce qu'il ne comprend pas).
//
// CLONE-HUNTER signalait 29 clusters de code dupliqué. L'enquête #215 a montré que six d'entre eux
// décrivaient UN SEUL problème : « lire un fichier JSON de registre, rendre un repli s'il manque ».
// Dix copies au total — trois de `loadJson(path, fallback)`, sept de la variante qui rend un
// tableau.
//
// LE DÉTAIL QUI DONNE TOUT SON SENS À CE FICHIER : `le-coordinateur.mjs` porte, depuis sa
// construction, un commentaire qui se félicite de réutiliser `loadJson()` de tool-usage.mjs —
// « jamais une 4e copie ». L'intention était juste, elle était écrite, elle était même fière
// d'elle-même… et sept copies ont continué de naître ailleurs sans que rien ne les arrête. C'est
// l'Article 27 en une ligne : une obligation que rien ne porte mécaniquement n'existe pas à la
// session suivante. Ce fichier EST le mécanisme qui manquait.
//
// CE QU'IL NE FAIT PAS : il ne devine jamais un repli. L'appelant déclare ce qu'il veut recevoir
// quand le fichier manque, parce que seul lui sait si « absent » veut dire « vide » ou « anomalie ».

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// La forme générale : un chemin ABSOLU, un repli fourni par l'appelant.
//
// `existsSync` n'est pas nécessaire (le try/catch attrape déjà le fichier manquant) et deux des
// trois copies le faisaient quand même. On ne le garde pas : un appel disque de plus pour un
// résultat identique, c'est du bruit qu'un lecteur prendra pour une subtilité.
export function loadJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

// La variante « registre » : un chemin RELATIF à la racine du dépôt, et un tableau toujours rendu.
//
// Les sept copies qu'elle remplace partageaient exactement cette signature, `readFileImpl` inclus —
// ce paramètre existe pour que les tests injectent un faux lecteur sans toucher au disque, et le
// garder ici préserve chacun de ces tests sans en changer une ligne.
//
// `Array.isArray()` n'est pas une précaution de style : un registre corrompu en objet, ou un JSON
// qui rend `null`, ferait planter le premier `.filter()` de l'appelant. Rendre un tableau vide est
// le seul repli qui laisse l'outil continuer en disant honnêtement qu'il n'a rien lu.
export function loadJsonArray(cheminRelatif, { root, readFileImpl = readFileSync } = {}) {
  try {
    const brut = JSON.parse(readFileImpl(join(root, cheminRelatif), "utf8"));
    return Array.isArray(brut) ? brut : [];
  } catch {
    return [];
  }
}

// Gardé exporté bien que non utilisé par les deux fonctions ci-dessus : deux appelants historiques
// testaient l'existence avant de lire, et un futur appelant pourrait avoir besoin de DISTINGUER
// « fichier absent » de « fichier illisible » — deux états que le repli confond volontairement.
export { existsSync as fichierExiste };
