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
