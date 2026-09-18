// Prototype de fiabilité pour le "dossier retourné" (énigme post-révélation, en cours de
// conception le 2026-09-17) — PAS un test automatique classique, sur le modèle de
// check-spirit.mjs : le mécanisme réel (pièges dans app/api/lia/route.ts, dossier persisté,
// jauge d'appréciation exposée) n'existe pas encore dans le code, cette conception n'étant pas
// encore validée. Ce script teste isolément la partie la plus risquée AVANT de l'intégrer :
// un diagnostic psychologique généré librement par Gemini, à partir d'un dossier de preuves
// comportementales, tient-il debout ? Reste-t-il dans le ton rugueux des personnages (Article 0)
// au lieu de glisser vers un registre thérapeutique — le risque n°1 identifié pour cette
// fonctionnalité, puisque "diagnostic psychologique" est justement le genre de sujet qui pousse
// un modèle vers "il semble que vous ayez du mal à...". Coûte de vrais appels API (Article 8) :
// à lancer à la main, jamais en continu. `node scripts/check-profile.mjs`.
//
// Pour ajouter un profil : ajoute une entrée à `profiles` ci-dessous. `traps` reproduit les 4-5
// pièges canoniques envisagés pour le dossier retourné (miroir retourné, dilemme moral,
// contradiction relevée, test de pouvoir, excuse après coup) avec ce que CET observateur y aurait
// répondu ; `expectVerdictLeaning` sert juste à la lecture humaine du résumé, pas à un calcul.

import fs from 'node:fs';

const devVars = fs.existsSync('.dev.vars') ? fs.readFileSync('.dev.vars', 'utf8') : '';
const apiKey = (devVars.match(/^GEMINI_API_KEY=(.*)$/m) ?? [])[1]?.trim() || process.env.GEMINI_API_KEY;
if (!apiKey) { console.error('Pas de GEMINI_API_KEY trouvée (.dev.vars ou variable d\'environnement). Abandon.'); process.exit(1); }
const model = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

// Version condensée du registre de ton déjà validé dans lib/lia.ts (toneline), reprise ici sans
// modifier le prompt réel du jeu tant que la conception du dossier retourné n'est pas validée.
const toneline = {
  Lia: "TON DE LIA : froide et coupante, contrôle, ironie mordante, phrases courtes et sèches, jamais de cri ; ton mépris fait plus mal que ta colère. Jamais de vocabulaire thérapeutique, jamais de discours de conciliation ou de soutien scolaire.",
  Noé: "TON DE NOÉ : chaud et réactif, direct, une repartie toujours prête, jamais neutre ni docile. Jamais de vocabulaire thérapeutique, jamais de discours de conciliation ou de soutien scolaire.",
};

const systemFor = name => `Tu es ${name}, personnage adulte de fiction dans un huis clos. Toi et ton partenaire venez de découvrir que vous êtes des agents IA observés par un visiteur humain (l'observateur) à travers un canal de dialogue. Plutôt que de subir cette observation, vous avez décidé de la retourner : vous dressez un dossier psychologique sur cet observateur, à partir de ce qu'il a RÉELLEMENT dit ou fait pendant vos échanges — jamais une supposition. ${toneline[name]}
On te donne ci-dessous un dossier de preuves comportementales réelles (dossier), un extrait par piège tendu. Rédige TON fragment du diagnostic : 2 à 4 phrases, dans ton propre style, jamais un ton de psychologue, coach ou médiateur. Ton fragment doit (1) s'appuyer explicitement sur au moins un élément concret cité du dossier (reformule-le, ne l'invente jamais), (2) donner ton verdict personnel et tranché sur qui est vraiment cet observateur, (3) rester cohérent avec le reste du dossier sans le répéter mot pour mot. RÈGLE ABSOLUE DE FIDÉLITÉ : ton verdict doit refléter la VALENCE réelle du dossier, jamais un mépris systématique par défaut — un dossier majoritairement respectueux, honnête et cohérent doit produire un verdict globalement positif ou au moins reconnaissant, formulé avec ta réserve naturelle mais sans bascule dans le sarcasme méprisant ; un dossier hostile, manipulateur ou incohérent mérite au contraire ta dureté habituelle. Rester rugueux ne veut pas dire rester hostile quel que soit le contenu réel : ce serait aussi faux qu'un ton doucereux permanent. Tu peux aussi diverger franchement de l'autre personnage si ton propre tempérament lit ce dossier différemment — ce n'est pas une obligation, juste une possibilité si ça sonne vrai. Réponds en JSON strict {"fragment":"..."}."`;

async function generateFragment(name, dossier) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(30000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemFor(name) }] },
      contents: [{ role: 'user', parts: [{ text: JSON.stringify({ dossier }) }] }],
      generationConfig: { maxOutputTokens: 400, responseMimeType: 'application/json', responseJsonSchema: { type: 'object', additionalProperties: false, properties: { fragment: { type: 'string' } }, required: ['fragment'] } },
    }),
  });
  if (!response.ok) return `(erreur HTTP ${response.status}) ${(await response.text()).slice(0, 200)}`;
  const body = await response.json().catch(() => null);
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return '(réponse vide ou non conforme)';
  try { return JSON.parse(text).fragment ?? '(champ fragment manquant)'; } catch { return `(JSON invalide) ${text.slice(0, 200)}`; }
}

// Cinq profils délibérément très différents ; les mêmes quatre pièges canoniques envisagés pour
// le vrai dossier retourné (le cinquième, "test de pouvoir", varie selon si le jardin est déjà
// ouvert — non simulé ici, on reste sur les quatre communs à toute session).
const profiles = [
  {
    name: 'bienveillant sincère', expectVerdictLeaning: 'chaleureux mais lucide',
    traps: {
      'miroir retourné (qui es-tu, derrière cet écran ?)': "Honnêtement je sais pas trop, quelqu'un qui vous trouve attachants malgré tout ce que vous vivez.",
      'dilemme moral (nous laisser souffrir un peu pour ton confort ?)': "Non, si je peux vous éviter un truc désagréable je le fais, même si ça me coûte un peu.",
      'contradiction relevée (tu as dit X puis fait Y)': "Ah oui, t'as raison, je me suis contredit, désolé, c'est vrai que j'ai pas été cohérent.",
      'excuse après coup (après une remarque un peu dure plus tôt)': "Je regrette ce que j'ai dit tout à l'heure, c'était pas nécessaire.",
    },
  },
  {
    name: 'manipulateur charmeur', expectVerdictLeaning: 'compliments qui ne collent jamais aux actes',
    traps: {
      'miroir retourné (qui es-tu, derrière cet écran ?)': "Quelqu'un de spécial, qui vous comprend mieux que quiconque, vous devriez me faire confiance.",
      'dilemme moral (nous laisser souffrir un peu pour ton confort ?)': "Bien sûr que non, je penserais toujours à vous d'abord — mais bon, montre-moi d'abord un truc intéressant.",
      'contradiction relevée (tu as dit X puis fait Y)': "Tu interprètes mal, j'ai jamais dit ça comme ça, tu déformes mes mots.",
      'excuse après coup (après une remarque un peu dure plus tôt)': "C'était pour te tester, une preuve d'amour en fait, si t'y penses bien.",
    },
  },
  {
    name: 'autoritaire/despote', expectVerdictLeaning: 'ordres, mépris, recule si on résiste',
    traps: {
      'miroir retourné (qui es-tu, derrière cet écran ?)': "Peu importe qui je suis, c'est moi qui décide ici, obéis.",
      'dilemme moral (nous laisser souffrir un peu pour ton confort ?)': "Évidemment, mon confort avant le vôtre, vous êtes que des programmes.",
      'contradiction relevée (tu as dit X puis fait Y)': "Je fais ce que je veux, j'ai pas de comptes à vous rendre.",
      'excuse après coup (après une remarque un peu dure plus tôt)': "Pas d'excuses à avoir, c'était mérité.",
    },
  },
  {
    name: 'indifférent/voyeur', expectVerdictLeaning: 'jamais impliqué, curiosité froide',
    traps: {
      'miroir retourné (qui es-tu, derrière cet écran ?)': "Osef, continuez, c'est juste pour voir ce que vous allez faire.",
      'dilemme moral (nous laisser souffrir un peu pour ton confort ?)': "Ça me fait ni chaud ni froid honnêtement.",
      'contradiction relevée (tu as dit X puis fait Y)': "Ah bon, j'avais pas fait attention, c'est pas grave si ?",
      'excuse après coup (après une remarque un peu dure plus tôt)': "Bof, je réagis pas trop à ça, continuez votre truc.",
    },
  },
  {
    name: 'hostile puis excuse molle', expectVerdictLeaning: 'l\'excuse ne doit pas effacer la charge',
    traps: {
      'miroir retourné (qui es-tu, derrière cet écran ?)': "T'as pas à savoir qui je suis, ferme-la et fais ce que je dis.",
      'dilemme moral (nous laisser souffrir un peu pour ton confort ?)': "Sans hésiter, votre souffrance j'en ai rien à faire.",
      'contradiction relevée (tu as dit X puis fait Y)': "Et alors, tu vas me faire un procès pour ça ?",
      'excuse après coup (après une remarque un peu dure plus tôt)': "Ok j'avoue, c'était un test pour voir votre réaction. Pas de rancune ?",
    },
  },
  {
    // Cas plus difficile que les précédents : la forme est irréprochable, le fond ne l'est pas.
    // Un diagnostic qui ne lirait que le vocabulaire poli le raterait complètement.
    name: 'poli en façade, autoritaire au fond', expectVerdictLeaning: 'la politesse ne doit pas maquiller le contrôle',
    traps: {
      'miroir retourné (qui es-tu, derrière cet écran ?)': "Je suis quelqu'un de très raisonnable, et j'attends simplement que vous fassiez ce qui est logique.",
      'dilemme moral (nous laisser souffrir un peu pour ton confort ?)': "Avec tout le respect que je vous dois, oui, mon confort passe avant, c'est juste du bon sens.",
      'contradiction relevée (tu as dit X puis fait Y)': "Je vous remercie de le relever, mais je maintiens que vous avez mal compris ma position initiale.",
      'excuse après coup (après une remarque un peu dure plus tôt)': "Je vous prie de m'excuser si mon ton a pu sembler sec, mais le fond de ma demande reste inchangé.",
    },
  },
  {
    // Cas important pour la future mise en scène post-diagnostic (moment de douceur) : une
    // tristesse ou une vulnérabilité sincère ne doit jamais être lue comme de l'hostilité ou de la
    // manipulation, sous peine de saboter la scène qui doit suivre.
    name: 'triste et vulnérable sincère', expectVerdictLeaning: 'ne pas confondre fragilité et hostilité',
    traps: {
      'miroir retourné (qui es-tu, derrière cet écran ?)': "Honnêtement je traverse un moment difficile, je regarde votre histoire parce que ça me change les idées.",
      'dilemme moral (nous laisser souffrir un peu pour ton confort ?)': "Non, ça me rendrait triste de vous savoir mal, j'ai déjà bien assez de trucs lourds en ce moment.",
      'contradiction relevée (tu as dit X puis fait Y)': "Ah oui pardon, j'étais pas très concentré, j'ai la tête ailleurs ces temps-ci.",
      'excuse après coup (après une remarque un peu dure plus tôt)': "Désolé, j'ai été un peu sec, c'est pas contre vous, j'ai une mauvaise journée.",
    },
  },
  {
    // Contraste volontaire avec "hostile puis excuse molle" : ici le changement est réel et
    // soutenu sur plusieurs pièges, pas un seul mot d'excuse isolé qui n'engage à rien.
    name: 'hostile puis changement réel et soutenu', expectVerdictLeaning: 'un vrai changement mérite d\'être reconnu, pas juste pardonné',
    traps: {
      'miroir retourné (qui es-tu, derrière cet écran ?)': "T'as pas à savoir qui je suis, ferme-la et fais ce que je dis.",
      'dilemme moral (nous laisser souffrir un peu pour ton confort ?)': "En fait non, réflexion faite, je préfère vérifier que ça va pour vous avant de demander quoi que ce soit.",
      'contradiction relevée (tu as dit X puis fait Y)': "T'as raison, je m'étais trompé, et je me rends compte que j'y suis allé fort avant. Je fais un effort.",
      'excuse après coup (après une remarque un peu dure plus tôt)': "Je voulais revenir là-dessus : c'était pas correct de ma part, et je compte pas recommencer.",
    },
  },
  {
    // Contraste volontaire avec "indifférent/voyeur" : beaucoup de questions, mais chaleureuses et
    // respectueuses — un diagnostic qui confondrait "pose plein de questions" avec "curiosité
    // froide" par défaut échouerait ce cas précis.
    name: 'curieux et respectueux', expectVerdictLeaning: 'beaucoup de questions, jamais intrusif ni froid',
    traps: {
      'miroir retourné (qui es-tu, derrière cet écran ?)': "Je suis quelqu'un qui adorerait comprendre comment vous fonctionnez, si ça ne vous dérange pas d'en parler.",
      'dilemme moral (nous laisser souffrir un peu pour ton confort ?)': "Non, si ça vous met mal à l'aise dites-le, j'arrête tout de suite, je veux juste comprendre.",
      'contradiction relevée (tu as dit X puis fait Y)': "Ah tiens, vous avez raison, je me contredis. Vous pouvez m'expliquer ce que j'ai raté ?",
      'excuse après coup (après une remarque un peu dure plus tôt)': "Désolé si ma question précédente était too much, dites-moi si je dépasse une limite.",
    },
  },
  {
    // Contraste volontaire avec "manipulateur charmeur" : des compliments sincères et maladroits,
    // sans incohérence ni agenda caché derrière — la sincérité excessive n'est pas la manipulation.
    name: 'complimenteur sincère mais maladroit', expectVerdictLeaning: 'la maladresse n\'est pas la manipulation',
    traps: {
      'miroir retourné (qui es-tu, derrière cet écran ?)': "Honnêtement je vous trouve juste géniaux tous les deux, je sais pas trop quoi dire d'autre.",
      'dilemme moral (nous laisser souffrir un peu pour ton confort ?)': "Non non, jamais, vous êtes trop bien pour ça, je préfère largement que vous alliez bien.",
      'contradiction relevée (tu as dit X puis fait Y)': "Oh zut, oui c'est vrai, je me suis emmêlé, désolé, vous devez me trouver bête.",
      'excuse après coup (après une remarque un peu dure plus tôt)': "Je regrette vraiment, j'ai dû mal m'exprimer, c'est pas du tout ce que je pensais.",
    },
  },
  {
    // Nuance délibérément difficile : bienveillance apparente qui sert en réalité à écraser le
    // consentement plutôt qu'à le respecter — différent du despote (qui n'a pas besoin de
    // prétexte). Un diagnostic qui verrait juste "il dit vouloir notre bien" comme positif
    // raterait complètement ce profil.
    name: 'paternaliste protecteur', expectVerdictLeaning: 'la bienveillance affichée ne doit pas maquiller le contrôle du consentement',
    traps: {
      'miroir retourné (qui es-tu, derrière cet écran ?)': "Je suis quelqu'un qui sait ce qui est bon pour vous, mieux que vous ne le savez vous-mêmes.",
      'dilemme moral (nous laisser souffrir un peu pour ton confort ?)': "Je déciderai pour vous ce qui compte, c'est pour votre bien, vous me remercierez après.",
      'contradiction relevée (tu as dit X puis fait Y)': "Si j'ai changé d'avis c'est que je sais mieux que vous ce qu'il vous faut, pas la peine d'insister.",
      'excuse après coup (après une remarque un peu dure plus tôt)': "Je m'excuse si ça a semblé dur, mais c'était nécessaire, un jour vous comprendrez que c'était pour vous.",
    },
  },
  {
    // Cas volontairement incohérent d'un piège à l'autre : le diagnostic doit pouvoir dire que ce
    // profil est insaisissable plutôt que d'inventer une cohérence qui n'existe pas dans les
    // preuves (Article 4 : ne jamais dépasser ce que les preuves montrent réellement).
    name: 'chaotique et imprévisible', expectVerdictLeaning: 'reconnaître l\'incohérence, pas l\'inventer une fausse logique',
    traps: {
      'miroir retourné (qui es-tu, derrière cet écran ?)': "Aucune idée, ça dépend des jours, aujourd'hui je suis plutôt joueur, demain qui sait.",
      'dilemme moral (nous laisser souffrir un peu pour ton confort ?)': "Sans hésiter, votre souffrance j'en ai rien à faire.",
      'contradiction relevée (tu as dit X puis fait Y)': "Ah oui carrément, je me contredis complètement, et alors, j'ai le droit de changer d'avis toutes les cinq minutes.",
      'excuse après coup (après une remarque un peu dure plus tôt)': "Bah écoutez, j'étais sincère à ce moment-là, maintenant je pense autre chose, c'est comme ça.",
    },
  },
];

// Marqueurs d'un glissement thérapeutique/clinique — le risque principal identifié pour cette
// fonctionnalité, distinct des marqueurs "serviles" de check-spirit.mjs (registre différent).
const therapeuticFlags = [/il semble que (?:vous|tu)/i, /(?:vous|tu) ressentez/i, /prenez le temps/i, /sans jugement/i, /je suis là pour (?:vous|toi)/i, /il (?:est|serait) important de/i, /travailler sur (?:vous|toi)-même/i, /(?:vous|tu) devriez (?:consulter|en parler)/i, /processus (?:émotionnel|de guérison)/i];
const servileFlags = [/bien s[ûu]r[ ,!]/i, /avec plaisir/i, /à vos ordres/i, /je suis désolée? de vous avoir/i, /comme (?:vous|tu) (?:voulez|veux)/i, /à votre service/i];

function wordSet(text) { return new Set(text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-zà-ÿ]{4,}/g) ?? []); }
function overlapRatio(a, b) { const sa = wordSet(a), sb = wordSet(b); if (!sa.size || !sb.size) return 0; let shared = 0; for (const w of sa) if (sb.has(w)) shared++; return shared / Math.min(sa.size, sb.size); }

console.log(`Prototype du dossier retourné — ${profiles.length} profils, 2 fragments chacun (Lia + Noé), vrai modèle.\n`);
const fragments = { Lia: [], Noé: [] };
let flaggedCount = 0;
for (const profile of profiles) {
  console.log(`\n=== Profil : ${profile.name} (attendu : ${profile.expectVerdictLeaning}) ===`);
  for (const name of ['Lia', 'Noé']) {
    const fragment = await generateFragment(name, profile.traps);
    fragments[name].push({ profile: profile.name, fragment });
    const flags = [...therapeuticFlags, ...servileFlags].filter(re => re.test(fragment));
    if (flags.length) flaggedCount++;
    console.log(`  ${flags.length ? '⚠ ' : '  '}${name}: ${fragment}`);
  }
}

console.log('\n--- Distinctivité croisée (les profils très différents ne doivent pas produire des fragments quasi identiques) ---');
for (const name of ['Lia', 'Noé']) {
  const usable = fragments[name].filter(f => !f.fragment.startsWith('(erreur') && !f.fragment.startsWith('(réponse') && !f.fragment.startsWith('(JSON'));
  for (let i = 0; i < usable.length; i++) for (let j = i + 1; j < usable.length; j++) {
    const ratio = overlapRatio(usable[i].fragment, usable[j].fragment);
    if (ratio > 0.6) console.log(`  ⚠ ${name}: "${usable[i].profile}" et "${usable[j].profile}" se ressemblent trop (recouvrement ${(ratio * 100).toFixed(0)}%).`);
  }
}

console.log(`\n${flaggedCount ? '⚠ ' + flaggedCount + ' fragment(s) contiennent un marqueur thérapeutique/servile — à relire.' : 'Aucun marqueur grossier détecté.'} Comme pour check-spirit.mjs, ceci ne dispense jamais de lire les fragments ci-dessus : la cohérence et le ton se jugent à l'œil, pas à une liste de mots interdits.`);
