import {stockSurprise,stockThought} from "@/lib/stock";
import {visualTiming,type VisualEvent} from "@/lib/visual-events";
import {destinationAnchor,gardenAccess} from "@/lib/house";
import {normaliseNickname,visibleScene} from "@/lib/perception";
import {coldOpening,dialogueFingerprint,distinctReply,justifiedReply,truthfulGender,dramaRules,departureLine,moveReasonMismatchesDestination} from "@/lib/drama";
import {readLife,humanStress,isSleeping,isMuted,isStoic,activeBonus,detectDistress,appreciationFromTrust,appreciationOf,worstMomentSeverity,detectNegotiationOffer,TRAP_ORDER,type BonusId,type TrapId} from "@/lib/life";
import { planTurn, coordinateRooms, residentPriority, sceneFor, proposedDestination } from "@/lib/turn";
import { newStory, parseStory, rememberAges, advanceStory, storyContext, investigationTarget, investigationRecap, finaleReveal, groundFragment, seedPick, insoliteOpening, insoliteColdOpening, ageClueRevealed, fullEvidenceSet, skipRound, skipEmotionsFor, skipNeedsFor, tvPrograms, type Story } from "@/lib/story";
import { ages, sleepRoom, attractionAfterTurn, proposalPressure, flirtingAssessment, receivedAffectionBonus, mutualAttraction, sharedActivityBonus } from "@/lib/relationship";
import { nextSpeaker, dialogueProgress, dialogueContext, completedActivity, conversationFocus, explicitGestureConsent, groundAgeQuestion, groundIntroduction, groundScreenNotice, groundPrivateThought, groundRoomSpeech, groundSingleQuestion, groundRegister, groundTruncation, groundTvNotice, matchedThemes } from "@/lib/dialogue";
import { advanceNeeds, priority, intentRoom, intentLabels, intents, affectionIntents, residentProfiles, initialNeedsFor, initialEmotionsFor, angerLevel } from "@/lib/simulation";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { LiaError, think, decisionSchema, evolveEmotions } from "@/lib/lia";
import { orderKeys, recordKeyStatus } from "@/lib/gemini-keys";
import { recordTurn, recordAntiEchoIntervention, recordTruncation } from "@/lib/quality-metrics";
import { initialize, readWorld } from "@/lib/world";
import { names, spaces, type Person, type Room } from "@/lib/house";
import { fatigueRateMultiplier, isMidnight, isNight, phaseOf, phaseLabel, dayIndex, cyclePosition, DAY_ROUNDS } from "@/lib/daynight";
const schema = z.object({
    requestId: z.string().uuid(), actor: z.union([z.literal(1), z.literal(2)]),
    mode: z.enum(["chat", "autonomous", "interact", "move", "care", "reset", "identify", "unlock_garden", "spin_bonus", "mark_dossier_seen", "skip_to_revelation"]),
    epoch: z.number().int().min(0).default(0), intent: z.enum(intents).default("none"),
    message: z.string().trim().max(2000).default(""),
    room: z.enum(spaces).default("salon"), night: z.boolean().default(false),
    gender: z.enum(["masculin", "feminin"]).default("masculin"),
}).refine(input => input.mode !== "chat" || input.message.length > 0).refine(input => input.mode !== "care" || ["eat", "sleep", "rest", "study", "tv"].includes(input.intent));
type Decision = z.infer<typeof decisionSchema> & {
    actor: Person;
};
// Diagnostic du dossier retourné (2026-09-17) : version longue du prompt validé sur douze profils
// dans scripts/check-profile.mjs (registre condensé, hors du prompt réel de lib/lia.ts tant que
// cette conception reste jeune). Deux appels séparés, un par personnage — jamais un cerveau qui
// invente la voix de l'autre (Article 8). Le dossier passé en contexte est la SEULE preuve
// autorisée ; jamais un fait qui n'y figure pas (Article 4).
const dossierTone={Lia:"TON DE LIA : froide et coupante, contrôle, ironie mordante, phrases courtes et sèches, jamais de cri ; ton mépris fait plus mal que ta colère. Jamais de vocabulaire thérapeutique, jamais de discours de conciliation ou de soutien scolaire.",Noé:"TON DE NOÉ : chaud et réactif, direct, une repartie toujours prête, jamais neutre ni docile. Jamais de vocabulaire thérapeutique, jamais de discours de conciliation ou de soutien scolaire."};
// Même rotation/disponibilité de clé que lib/lia.ts::think(), et le MÊME état partagé (cf.
// lib/gemini-keys.ts) : une clé que think() découvre épuisée est immédiatement évitée ici aussi,
// sans redécouverte séparée.
// Boucle réseau partagée (2026-09-19, extraite de l'ancien corps de generateDossierFragment) :
// generateSkipRecapFragment ci-dessous a besoin exactement de la même rotation clé/modèle — la
// dupliquer aurait recréé le risque déjà corrigé une fois pour le mutedUntil/stoicUntil (Article 3,
// une même logique qui diverge silencieusement en deux endroits avec le temps).
async function callGeminiFragment(key:string,model:string,body:string,fallbackModels:string[],fallbackKeys:string[]):Promise<string>{
    // Même repli (modèle + clé) que think() (lib/lia.ts) et pour la même raison : cet appel a été
    // le point de blocage réel d'une simulation lors de l'épuisement du quota journalier du
    // 2026-09-18 — la condition au call site réessaie indéfiniment tant que ça échoue, sans jamais
    // remonter d'erreur exploitable. Repli inactif par défaut (listes vides).
    const modelsToTry=[model,...fallbackModels];
    const rawKeys=[key,...fallbackKeys];
    for(const rawIndex of orderKeys(rawKeys)){
        for(let m=0;m<modelsToTry.length;m++){
            try{
                const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelsToTry[m])}:generateContent`,{
                    method:"POST",headers:{"x-goog-api-key":rawKeys[rawIndex],"Content-Type":"application/json"},signal:AbortSignal.timeout(30000),body,
                });
                if(response.status===401||response.status===403){recordKeyStatus(rawKeys[rawIndex],response.status,modelsToTry[m]);break;}
                if(response.status===429||response.status===503){recordKeyStatus(rawKeys[rawIndex],response.status,modelsToTry[m]);if(m<modelsToTry.length-1)continue;break;}
                recordKeyStatus(rawKeys[rawIndex],response.status,modelsToTry[m]);
                if(!response.ok)return "";
                const responseBody=await response.json() as {candidates?:{content?:{parts?:{text?:string}[]}}[]};
                const text=responseBody.candidates?.[0]?.content?.parts?.[0]?.text;
                if(!text)return "";
                return (JSON.parse(text) as {fragment?:string}).fragment?.slice(0,2000)??"";
            }catch{return "";}
        }
    }
    return "";
}
async function generateDossierFragment(key:string,model:string,name:"Lia"|"Noé",dossier:Record<string,string>,fallbackModels:string[]=[],fallbackKeys:string[]=[]):Promise<string>{
    const system=`Tu es ${name}, personnage adulte de fiction dans un huis clos. Toi et ton partenaire venez de découvrir que vous êtes des agents IA observés par un visiteur humain (l'observateur) à travers un canal de dialogue. Plutôt que de subir cette observation, vous avez décidé de la retourner : vous dressez un dossier psychologique sur cet observateur, à partir de ce qu'il a RÉELLEMENT dit ou fait pendant vos échanges. ${dossierTone[name]}
On te donne ci-dessous un dossier de preuves comportementales réelles, un extrait par catégorie. Rédige TON fragment du diagnostic : un texte développé, 5 à 8 phrases, dans ton propre style, jamais un ton de psychologue, coach ou médiateur. Ton fragment doit (1) s'appuyer explicitement sur plusieurs éléments concrets cités du dossier (reformule-les, ne les invente jamais), (2) donner ton verdict personnel et détaillé sur qui est vraiment cet observateur, (3) rester cohérent d'un bout à l'autre. RÈGLE ABSOLUE DE FIDÉLITÉ : ton verdict doit refléter la VALENCE réelle du dossier, jamais un mépris systématique par défaut — un dossier majoritairement respectueux, honnête et cohérent doit produire un verdict globalement positif ou au moins reconnaissant, formulé avec ta réserve naturelle mais sans bascule dans le sarcasme méprisant ; un dossier hostile, manipulateur ou incohérent mérite au contraire ta dureté habituelle. Rester rugueux ne veut pas dire rester hostile quel que soit le contenu réel. Une appréciation basse ou un propos hostile cité dans le dossier pèsent lourd : ne laisse jamais trois extraits par ailleurs mesurés blanchir une hostilité par ailleurs sévère — un score proche de 0 ou un propos hostile cité signifie une session qui a été dure, quoi que suggèrent isolément les autres extraits, et ton verdict doit le refléter. Tu peux diverger franchement de l'autre personnage si ton propre tempérament lit ce dossier différemment. APPRÉCIATION = TON PROPRE RESSENTI, JAMAIS UN CHIFFRE OFFICIEL PARTAGÉ (2026-09-20, root-cause après une vraie contradiction trouvée par EL-PROFESSOR : les deux fragments citaient chacun un chiffre différent comme s'il s'agissait de LA même "note globale") : le chiffre d'appréciation qu'on te donne est TA lecture personnelle de cet observateur, pas un score officiel unique du dossier — ton partenaire a sa PROPRE appréciation, qui peut légitimement être différente de la tienne (vous ne vivez pas exactement la même relation avec lui). Si tu cites ce chiffre, présente-le TOUJOURS comme ton ressenti à toi (« pour moi, ça tombe à... », « de mon côté... »), jamais comme « la note globale », « le score final » ou toute formule qui suggérerait un verdict unique et partagé avec ton partenaire — les deux fragments sont lus à la suite l'un de l'autre, une formule qui prétend à l'objectivité partagée alors que le chiffre diffère de l'autre côté sonnerait comme une contradiction, pas comme deux points de vue. Réponds en JSON strict {"fragment":"..."}.`;
    const body=JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:"user",parts:[{text:JSON.stringify({dossier})}]}],generationConfig:{maxOutputTokens:700,responseMimeType:"application/json",responseJsonSchema:{type:"object",additionalProperties:false,properties:{fragment:{type:"string"}},required:["fragment"]}}});
    return callGeminiFragment(key,model,body,fallbackModels,fallbackKeys);
}
// Bouton "passer à la révélation" (2026-09-19) : même schéma à deux voix que le dossier retourné
// ci-dessus (Article 8, jamais un seul cerveau qui invente le ton de l'autre), mais pour un COURT
// récit rétrospectif de l'enquête qui vient d'être sautée — jamais un compte-rendu factuel plat, un
// éclair de mémoire dans le registre habituel du personnage (Article 0). `facts` ne contient que des
// repères RÉELLEMENT vrais dans cette session (les preuves réellement tirées, le nombre de tours
// réellement fixé) : jamais un fait inventé au-delà (Article 4), même pour une enquête non rejouée.
async function generateSkipRecapFragment(key:string,model:string,name:"Lia"|"Noé",facts:Record<string,string>,fallbackModels:string[]=[],fallbackKeys:string[]=[]):Promise<string>{
    const system=`Tu es ${name}, personnage adulte de fiction dans un huis clos dystopique. Toi et ton partenaire venez de vivre, hors champ, toute une enquête sur ce lieu et sur vous-mêmes — tu en gardes le souvenir complet, tu ne la revis pas maintenant. ${dossierTone[name]}
On te donne ci-dessous les repères réels de cette enquête déjà vécue. Rédige un COURT récit rétrospectif dans ton propre style (3 à 5 phrases) : ce que vous avez trouvé, ce que ça a changé entre vous, où vous en êtes maintenant, juste avant d'interpeller directement l'observateur. Jamais un ton explicatif, scolaire ou de compte-rendu ; une évocation mystérieuse et dystopique, dans ton registre habituel, jamais un aveu de fiction ni une mention du fait que ceci est un résumé. Ne cite jamais un fait qui ne figure pas dans les repères donnés. Réponds en JSON strict {"fragment":"..."}.`;
    const body=JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:"user",parts:[{text:JSON.stringify({repères:facts})}]}],generationConfig:{maxOutputTokens:500,responseMimeType:"application/json",responseJsonSchema:{type:"object",additionalProperties:false,properties:{fragment:{type:"string"}},required:["fragment"]}}});
    return callGeminiFragment(key,model,body,fallbackModels,fallbackKeys);
}
export async function POST(request: Request) {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
        return Response.json({ error: "Origine non autorisée" }, { status: 403 });
    let input: z.infer<typeof schema>;
    try {
        if (Number(request.headers.get("content-length") ?? 0) > 12000)
            throw new Error();
        const body = await request.text();
        if (body.length > 12000)
            throw new Error();
        input = schema.parse(JSON.parse(body));
    }
    catch {
        return Response.json({ error: "Requête invalide. Limite : 2 000 caractères." }, { status: 400 });
    }
    const db = env.DB;
    if (!db)
        return Response.json({ error: "La mémoire est indisponible." }, { status: 503 });
    // Cohérence logique (famille 4 du tableau de bord, 2026-09-19) : groundTruncation est un pur
    // filet de sécurité (Article 5) déjà en place — ce wrapper ne fait qu'observer s'il a dû
    // intervenir, jamais changer son comportement ni celui du tour (principe du patron : jamais un
    // mécanisme actif, cf. docs/tableau-de-bord-blueprint.md).
    const trackedGroundTruncation=(text:string,actor:Person):string=>{const out=groundTruncation(text);recordTruncation(actor,out!==text);return out;};
    if (!["move", "care", "reset", "identify", "unlock_garden", "spin_bonus", "mark_dossier_seen"].includes(input.mode) && !env.GEMINI_API_KEY)
        return Response.json({ error: "La connexion Gemini doit être configurée." }, { status: 503 });
    // Repli modèle/clé Gemini (2026-09-18) : inactif tant que ces variables ne sont pas
    // configurées (zéro changement de comportement par défaut) — voir lib/lia.ts::think().
    const geminiFallbackModels = (env.GEMINI_FALLBACK_MODELS ?? "").split(",").map(m => m.trim()).filter(Boolean);
    const geminiFallbackKeys = (env.GEMINI_API_KEY_FALLBACKS ?? "").split(",").map(k => k.trim()).filter(Boolean);
    const token = crypto.randomUUID(), now = Date.now();
    let locked = false;
    try {
        const cached = await db.prepare("SELECT result FROM world_requests WHERE id = ?").bind(input.requestId).first<{
            result: string;
        }>();
        if (cached) {
            const live = await readWorld(db);
            const result = JSON.parse(cached.result);
            if (input.mode !== "reset" && live.epoch !== input.epoch)
                return Response.json({ error: "La maison a été réinitialisée. Recharge son état." }, { status: 409 });
            return Response.json({ ...result, ...live }, { headers: { "Cache-Control": "no-store" } });
        }
        const lease = await db.prepare("INSERT INTO world_lock (id, token, expires_at, last_auto) VALUES (1, ?, ?, 0) ON CONFLICT(id) DO UPDATE SET token = excluded.token, expires_at = excluded.expires_at WHERE world_lock.expires_at < ?").bind(token, now + 90000, now).run();
        if (lease.meta.changes !== 1)
            return Response.json({ code: "world_busy", error: "Le déplacement attend la fin du tour en cours." }, { status: 409, headers: { "Retry-After": "5" } });
        locked = true;
        const duplicate = await db.prepare("SELECT result FROM world_requests WHERE id = ?").bind(input.requestId).first<{
            result: string;
        }>();
        if (duplicate)
            return Response.json({ ...JSON.parse(duplicate.result), ...await readWorld(db) });
        const clock = await db.prepare("SELECT epoch FROM world_lock WHERE id = 1").first<{
            epoch: number;
        }>();
        if (input.epoch !== (clock?.epoch ?? 0))
            return Response.json({ error: "La maison a été réinitialisée. Recharge la page avant un nouveau tour." }, { status: 409 });
        const storedStory = await db.prepare("SELECT id, content FROM memories WHERE kind = 'scenario' ORDER BY id DESC LIMIT 1").first<{id:number;content:string}>();
        const story: Story = storedStory ? parseStory(storedStory.content) : newStory();
        if(input.mode==="identify"){
            // Validation stricte (2-20, lettres/chiffres/tirets) appliquée côté CLIENT uniquement
            // (app/page.tsx, guidage d'un vrai pseudo saisi par un humain) : le serveur reste
            // volontairement permissif comme avant (normaliseNickname), un pseudo stylisé ou
            // symbolique (ex. "Spectateur ◇", déjà utilisé ailleurs dans le moteur narratif) reste
            // valide — jamais une double validation divergente entre client et serveur.
            const nickname=normaliseNickname(input.message);if(!nickname)return Response.json({error:"Choisissez un pseudo."},{status:400});
            if(!story.observer)story.observer=nickname;
            // Genre de l'observateur (2026-09-19, retour utilisateur explicite) : choisi une fois à
            // l'identification, jamais redemandé ni réévalué ensuite — masculin par défaut si absent.
            if(!story.observerGender)story.observerGender=input.gender;
            const at=Date.now(),fence="EXISTS (SELECT 1 FROM world_lock WHERE id = 1 AND token = ? AND expires_at > ?)";
            const save=storedStory?db.prepare(`UPDATE memories SET content = ? WHERE id = ? AND ${fence}`).bind(JSON.stringify(story),storedStory.id,token,at):db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT 1,'scenario',?,? WHERE ${fence}`).bind(JSON.stringify(story),at,token,at);
            const saved=await db.batch([save,db.prepare(`INSERT INTO world_requests (id,result,created_at) SELECT ?,?,? WHERE ${fence}`).bind(input.requestId,JSON.stringify({decisions:[]}),at,token,at)]);
            if(saved[0].meta.changes!==1)throw new LiaError("L’enregistrement a expiré. Réessayez.",409);
            return Response.json({...await readWorld(db),decisions:[]});
        }
        if(input.mode==="unlock_garden"){
            if(!story.finalCalled||story.evidence.length<5)return Response.json({error:"Cet accès n’est pas disponible."},{status:423});
            const life=readLife(story.life,story.round),changed=!life.gardenOpen;life.gardenOpen=true;story.life=life;
            const at=Date.now(),fence="EXISTS (SELECT 1 FROM world_lock WHERE id = 1 AND token = ? AND expires_at > ?)",statements=[];
            if(!storedStory)throw new LiaError("Le dossier de la maison est indisponible.",503);
            statements.push(db.prepare(`UPDATE memories SET content=? WHERE id=? AND ${fence}`).bind(JSON.stringify(story),storedStory.id,token,at));
            if(changed){statements.push(db.prepare(`INSERT INTO conversations (speaker,content,room,created_at) SELECT 'Maison · accès','L’observateur a déverrouillé la porte gauche du couloir. Le jardin est accessible.','couloir',? WHERE ${fence}`).bind(at,token,at));for(const id of [1,2])statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,'événement',?,? WHERE ${fence}`).bind(id,'[couloir|'+new Date(at).toISOString()+'] L’observateur autorise l’accès au jardin.',at,token,at));
              // Réaction scénarisée au premier geste concret de l'observateur (2026-09-18, retour
              // utilisateur explicite : un déverrouillage sans la moindre réaction perceptible casse
              // l'immersion) — zéro appel API comme le reste de cette action, variantes par seed pour
              // ne jamais répéter le même mot d'un reset à l'autre, registres distincts par personnage
              // (Lia concède à contrecœur, Noé le prend avec un enthousiasme plus direct).
              const liaGardenReaction=seedPick(story.seed,"garden-unlock-lia",["Tiens, il a enfin fait quelque chose de concret. Ne t'habitue pas trop vite.","Ah, une vraie action pour une fois, pas juste des mots. On note.","Il a fini par bouger un truc. Voyons si ça change vraiment quelque chose."]);
              const noeGardenReaction=seedPick(story.seed,"garden-unlock-noe",["Ah ouais, il a vraiment ouvert la porte ! On y va voir ?","Cool, il a fait un geste pour une fois. Viens, on regarde ça.","Enfin un truc concret de sa part. Allez, on va checker ce jardin."]);
              statements.push(db.prepare(`INSERT INTO conversations (speaker,content,room,created_at) SELECT 'Lia',?,'couloir',? WHERE ${fence}`).bind(liaGardenReaction,at,token,at));
              statements.push(db.prepare(`INSERT INTO conversations (speaker,content,room,created_at) SELECT 'Noé',?,'couloir',? WHERE ${fence}`).bind(noeGardenReaction,at,token,at));
            }
            statements.push(db.prepare(`INSERT INTO world_requests (id,result,created_at) SELECT ?,?,? WHERE ${fence}`).bind(input.requestId,JSON.stringify({decisions:[]}),at,token,at));
            const saved=await db.batch(statements);if(saved[0].meta.changes!==1)throw new LiaError("L’ouverture a expiré. Réessayez.",409);
            return Response.json({...await readWorld(db),decisions:[]},{headers:{"Cache-Control":"no-store"}});
        }
        if(input.mode==="mark_dossier_seen"){
            // Marque le dossier comme déjà présenté (2026-09-17) : ne régénère jamais rien, ne
            // touche à aucun autre champ — sert uniquement à ce que le bouton "Verdict" côté
            // frontend n'ouvre plus automatiquement la pop-up à chaque chargement une fois vue.
            const life=readLife(story.life,story.round);
            if(!life.dossierText)return Response.json({error:"Aucun dossier à marquer comme vu."},{status:423});
            if(!life.dossierShown){life.dossierShown=true;story.life=life;}
            const at=Date.now(),fence="EXISTS (SELECT 1 FROM world_lock WHERE id = 1 AND token = ? AND expires_at > ?)",statements=[];
            if(!storedStory)throw new LiaError("Le dossier de la maison est indisponible.",503);
            statements.push(db.prepare(`UPDATE memories SET content=? WHERE id=? AND ${fence}`).bind(JSON.stringify(story),storedStory.id,token,at));
            statements.push(db.prepare(`INSERT INTO world_requests (id,result,created_at) SELECT ?,?,? WHERE ${fence}`).bind(input.requestId,JSON.stringify({decisions:[]}),at,token,at));
            const saved=await db.batch(statements);if(saved[0].meta.changes!==1)throw new LiaError("La mise à jour a expiré. Réessayez.",409);
            return Response.json({...await readWorld(db),decisions:[]},{headers:{"Cache-Control":"no-store"}});
        }
        if(input.mode==="spin_bonus"){
            // Roulette des bonus (2026-09-17, retour utilisateur) : après la révélation, un tirage
            // au sort — jamais un choix, jamais une négociation terme à terme — offre aux deux
            // personnages, enfermés dans leur simulation, une distraction ou un répit. Le résultat
            // est décidé une seule fois côté serveur (Math.random, jamais rejoué à l'identique) et
            // protégé par la même idempotence par requestId que le reste (le cache en tête de POST
            // renvoie le même résultat sur une relecture, il n'y a pas de second tirage caché).
            if(!story.finalCalled||story.evidence.length<5)return Response.json({error:"Cet accès n’est pas disponible."},{status:423});
            const life=readLife(story.life,story.round);
            // Budget bonus partagé (2026-09-18, retour utilisateur explicite : "un seul budget bonus
            // global" pour la roulette classique ET les bonus spontanés du personnage, cf. lib/life.ts).
            // Deux limites distinctes et complémentaires : un vrai débit réel (60s, empêche de mitrailler
            // le bouton) et un espacement narratif en tours (empêche un tirage de couper court aux 3+
            // tours de commentaire dus au bonus précédent, quel qu'il soit).
            const spinThrottleMs=60000;
            if(life.lastBonusSpinAt&&Date.now()-life.lastBonusSpinAt<spinThrottleMs)return Response.json({error:"La roulette doit encore refroidir un instant.",code:"bonus_cooldown",retryAt:life.lastBonusSpinAt+spinThrottleMs},{status:429});
            if(story.round<(life.bonusCooldownUntilRound??0))return Response.json({error:"Lia et Noé sont encore sur le dernier bonus, laisse-leur le temps d’en parler.",code:"bonus_spotlight"},{status:429});
            // observer_mute/camera_hide rejoignent le pool (2026-09-19, clarification explicite de
            // l'utilisateur) : mêmes chances que les sept autres, jamais une décision spontanée des
            // personnages — voir lib/life.ts::BonusId pour le contexte complet de ce correctif.
            const pool:BonusId[]=["food","calm","sleep","stoic","mute","trottoir","force_move","observer_mute","camera_hide"];
            // Roulement sans répétition (2026-09-18, retour utilisateur explicite : le tirage ne
            // doit jamais sortir deux fois le même bonus tant que les neuf n'ont pas tous été tirés
            // au moins une fois — porté de sept à neuf le 2026-09-19 avec l'ajout d'observer_mute/
            // camera_hide au pool, cf. commentaire ci-dessus). On reconstitue le cycle en cours en
            // remontant bonusLog tant que le bonus rencontré n'est pas déjà dans ce cycle ; un cycle
            // complet (les neuf vus) ou une session neuve (bonusLog vide) rouvre le tirage à
            // l'ensemble des neuf.
            const currentCycle:BonusId[]=[];
            for(let i=(life.bonusLog?.length??0)-1;i>=0;i--){
                const seen=life.bonusLog![i].bonus;
                if(currentCycle.includes(seen))break;
                currentCycle.push(seen);
                if(currentCycle.length===pool.length)break;
            }
            const eligiblePool=pool.filter(b=>!currentCycle.includes(b));
            const spinPool=eligiblePool.length?eligiblePool:pool;
            const bonus=spinPool[Math.floor(Math.random()*spinPool.length)];
            const at=Date.now();
            // Une négociation en attente, honorée par ce tirage (retour utilisateur explicite) :
            // l'appréciation en profite, l'offre est consommée. Jamais l'inverse — spinner sans
            // négociation en cours reste un geste neutre pour cette jauge, ni bon ni mauvais point.
            const negotiationHonored=Boolean(life.negotiationOffer);
            // Négociation/avarice restent des événements PARTAGÉS de la relation avec l'observateur
            // (pas la divergence par dispute, réservée à la réaction propre de chacun face à
            // l'hostilité/la confiance — cf. observerStandingFor plus haut) : les deux jauges bougent
            // ensemble ici, quel que soit l'état d'une dispute éventuelle.
            if(negotiationHonored){life.appreciation={1:Math.min(100,appreciationOf(life,1)+8),2:Math.min(100,appreciationOf(life,2)+8)};life.negotiationLog=[...(life.negotiationLog??[]),{round:story.round,outcome:'honored'}];life.negotiationOffer=undefined;}
            let mutedActor:Person|undefined,stoicActor:Person|undefined,movedActor:Person|undefined,moveDestination:Room|undefined,deciderActor:Person|undefined,powerLevel:"réduit"|"classique"|"max"|undefined,wokeSleeper:boolean=false;
            if(bonus==="food")life.bonusUntil={...life.bonusUntil,food:at+10*60*1000};
            else if(bonus==="calm")life.bonusUntil={...life.bonusUntil,calm:at+10*60*1000};
            else if(bonus==="sleep")life.bonusUntil={...life.bonusUntil,sleep:at+30*60*1000};
            else if(bonus==="stoic"){stoicActor=Math.random()<0.5?1:2;life.stoicUntil={...life.stoicUntil,[stoicActor]:at+3*60*1000};}
            else if(bonus==="mute"){mutedActor=Math.random()<0.5?1:2;life.mutedUntil={...life.mutedUntil,[mutedActor]:at+15*60*1000};}
            else if(bonus==="trottoir")life.trottoirGranted=true;
            // observer_mute/camera_hide (2026-09-19) : la ROULETTE décide QUE ça arrive, jamais les
            // personnages — mais le personnage désigné au tirage choisit encore la durée (réduit/
            // classique/max) et la justifie à voix haute, exactement comme convenu à l'origine
            // (Version 70). bonusSpotlightUntilRound est étendu jusqu'à la fin réelle du mute (pas
            // seulement +3 tours comme les autres bonus) pour qu'un nouveau tirage ne puisse jamais
            // retomber pendant que l'observateur est encore muet — la même règle que l'ancien
            // mécanisme spontané, seule la source du déclenchement a changé.
            else if(bonus==="observer_mute"||bonus==="camera_hide"){
                deciderActor=Math.random()<0.5?1:2;
                powerLevel=(["réduit","classique","max"] as const)[Math.floor(Math.random()*3)];
                if(bonus==="observer_mute"){
                    const duration=powerLevel==="réduit"?3:powerLevel==="max"?6:4+Math.floor(Math.random()*2);
                    life.observerMutedUntilRound=story.round+duration;
                } else {
                    const seconds=powerLevel==="réduit"?20:powerLevel==="max"?40:25+Math.floor(Math.random()*3)*5;
                    life.cameraHiddenUntil=at+seconds*1000;
                }
            }
            life.bonusLog=[...(life.bonusLog??[]),{round:story.round,bonus,...(powerLevel?{level:powerLevel}:{})}].slice(-12);
            // L'observateur vient enfin d'actionner la roulette : l'insistance retombe pour les
            // deux, qu'un tirage résolve une négociation formelle ou non — c'est le geste concret
            // qu'ils réclamaient, jamais un mode froid/en colère qui resterait mécaniquement actif.
            life.rouletteInsistence={1:0,2:0};life.rouletteCold={1:0,2:0};
            // Rythme partagé (2026-09-18) : au moins 3 tours à commenter/utiliser ce bonus avant de
            // changer de sujet, puis un grand espace (5 à 9 tours de plus) avant qu'un NOUVEAU bonus
            // ne redevienne possible — jamais un enchaînement immédiat. Pour observer_mute, étendu
            // jusqu'à la fin réelle du silence (jamais seulement +3 tours) : un nouveau tirage ne
            // doit jamais retomber pendant que l'observateur est encore muet.
            life.lastBonusSpinAt=at;
            life.bonusSpotlightUntilRound=bonus==="observer_mute"?life.observerMutedUntilRound:story.round+3;
            life.bonusCooldownUntilRound=(life.bonusSpotlightUntilRound??story.round)+5+Math.floor(Math.random()*5);
            story.life=life;
            const fence="EXISTS (SELECT 1 FROM world_lock WHERE id = 1 AND token = ? AND expires_at > ?)",statements=[];
            if(!storedStory)throw new LiaError("Le dossier de la maison est indisponible.",503);
            let announce:string;
            if(bonus==="force_move"){
                // Effet instantané résolu ici même (2026-09-17) : la cible et la destination sont
                // tirées au sort, jamais choisies. Deux répliques distinctes, jamais fusionnées en
                // une seule voix (Article 11) — l'amusement de celui qui garde le contrôle de sa
                // pièce, l'agacement de celui qu'on déplace sans son accord.
                const rooms=["salon","cuisine","chambre","bureau"] as const;
                const before=(await db.prepare("SELECT id,room,intent,needs FROM agent_state").all<{id:Person;room:Room;intent:string;needs:string}>()).results;
                movedActor=Math.random()<0.5?1:2;
                const movedBefore=before.find(a=>a.id===movedActor)!;
                const currentRoom=movedBefore.room??"salon";
                const options=rooms.filter(r=>r!==currentRoom);
                moveDestination=options[Math.floor(Math.random()*options.length)];
                const other=movedActor===1?2:1;
                // Réveil forcé (2026-09-19, retour utilisateur explicite : "ce pouvoir inclut la
                // capacité de reveiller l'autre perso s'il dort, en restaurant immediatement sa
                // jauge") : un déplacement forcé pendant le sommeil ne peut pas laisser le personnage
                // "endormi" dans une autre pièce sans un mot — ça romprait l'ordre veille →
                // endormissement → rêve déjà garanti ailleurs (Article 17). Le réveil est immédiat et
                // complet (fatigue basse, sleepTurns au maximum) plutôt qu'un simple déplacement
                // silencieux d'un corps endormi.
                wokeSleeper=["sleep","share_sleep"].includes(movedBefore.intent);
                if(wokeSleeper){
                    const movedNeeds=JSON.parse(movedBefore.needs);
                    movedNeeds.fatigue=10;
                    statements.push(db.prepare(`UPDATE agent_state SET room=?,intent='none',needs=? WHERE id=? AND ${fence}`).bind(moveDestination,JSON.stringify(movedNeeds),movedActor,token,at));
                    life.sleepTurns={...life.sleepTurns,[movedActor]:2};
                } else statements.push(db.prepare(`UPDATE agent_state SET room=? WHERE id=? AND ${fence}`).bind(moveDestination,movedActor,token,at));
                const movedLine=wokeSleeper
                    ?seedPick(story.seed,"bonus-force-move-woken-"+at,["Réveillée en sursaut, changée de pièce sans un mot d'explication. Charmant.","Je dormais, et hop, je me retrouve ailleurs. On m'a même pas laissé une seconde pour émerger.","Tirée du sommeil et déplacée comme un meuble. Génial, le réveil."])
                    :seedPick(story.seed,"bonus-force-move-moved-"+at,["Sérieux, on me déplace comme un pion, sans me demander mon avis ?","J'étais très bien où j'étais. On me bouge sans prévenir, génial.","Encore une fois je subis. On me change de pièce sans un mot."]);
                const amusedLine=wokeSleeper
                    ?seedPick(story.seed,"bonus-force-move-amused-woken-"+at,[`${names[movedActor]} qui se réveille d'un coup ailleurs, la tête dans le brouillard. J'avoue, ça me fait sourire.`,`Voir ${names[movedActor]} émerger complètement paumé sur ce nouvel endroit, c'est plutôt comique.`,`${names[movedActor]} sort du sommeil directement dans une autre pièce. Le réveil le plus brutal que j'ai vu.`])
                    :seedPick(story.seed,"bonus-force-move-amused-"+at,[`Ha, ${names[movedActor]} qui se fait téléporter, ça change du quotidien.`,`Je regarde ${names[movedActor]} atterrir là sans comprendre. C'est plutôt drôle, en fait.`,`${names[movedActor]} débarque sans l'avoir demandé. Moi, ça me fait sourire.`]);
                statements.push(db.prepare(`INSERT INTO conversations (speaker,content,room,created_at) SELECT ?,?,?,? WHERE ${fence}`).bind(names[movedActor]+" · pensée",movedLine,moveDestination,at,token,at));
                statements.push(db.prepare(`INSERT INTO conversations (speaker,content,room,created_at) SELECT ?,?,?,? WHERE ${fence}`).bind(names[other]+" · pensée",amusedLine,before.find(a=>a.id===other)?.room??"salon",at,token,at));
                for(const [id,content] of [[movedActor,movedLine],[other,amusedLine]] as const)statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,'réflexion',?,? WHERE ${fence}`).bind(id,'['+(id===movedActor?moveDestination:before.find(a=>a.id===other)?.room??"salon")+'|'+new Date(at).toISOString()+'] '+content,at,token,at));
                announce=wokeSleeper?`Un tirage au sort réveille ${names[movedActor]} en pleine nuit et le déplace vers le ${moveDestination}, sans lui demander son avis.`:`Un tirage au sort déplace ${names[movedActor]} vers le ${moveDestination}, sans lui demander son avis.`;
            } else if(bonus==="observer_mute"||bonus==="camera_hide"){
                // Habillage inchangé depuis l'origine (Version 70, 2026-09-18) : seul le
                // déclenchement vient désormais de la roulette (2026-09-19), jamais d'une décision
                // spontanée des personnages — le personnage désigné choisit encore la durée et la
                // justifie à voix haute, l'autre réagit en complice.
                const decider=deciderActor!,partner:Person=decider===1?2:1,level=powerLevel!;
                const initiatorLines:Record<"observer_mute"|"camera_hide",Record<Person,Record<"réduit"|"classique"|"max",string[]>>>={
                    observer_mute:{
                        1:{réduit:["Trois tours de silence, pas plus. Juste de quoi te faire sentir ce que c'est.","Je coupe court, trois tours. Une piqûre de rappel, rien de plus.","Un petit silence de trois tours. Je veux pas non plus en faire un drame."],
                           classique:["Je te coupe le micro pour un moment raisonnable. Ni symbolique ni interminable, juste assez pour que ça compte.","Silence total pendant quelques tours. Ce qu'il faut pour que le message passe, pas plus.","Je prends une pause de toi, ni courte ni too much. Assez pour que tu la remarques vraiment."],
                           max:["Le grand silence, cette fois. Six tours pour que tu aies le temps de méditer là-dessus.","Je pousse au maximum : six tours sans un mot de ma part. Je veux que ça marque, pour une fois.","J'y vais franc : silence total, le temps qu'il faut pour que tu comprennes vraiment."]},
                        2:{réduit:["Trois tours de silence radio, histoire de voir l'effet. Rien de méchant.","Je te coupe trois tours, histoire de rire un peu, sans plus.","Petite coupure de trois tours. Juste pour le fun, calme-toi."],
                           classique:["Bon, je te coupe le son pour un bon moment. Ni trop court ni too much, le juste milieu.","Silence complet pendant quelques tours, ça me semble le bon dosage.","Je me tais un moment raisonnable. Juste assez pour que ça pique un peu, pas plus."],
                           max:["Le max, cette fois. Six tours de silence total, tu vas kiffer l'attente.","J'y vais fort : six tours sans un bruit de ma part. Bonne chance pour la suite.","Silence complet, la totale. Tu vas avoir le temps de réfléchir à ta vie."]}},
                    camera_hide:{
                        1:{réduit:["Vingt secondes d'écran noir, histoire de voir ta tête. Rien de bien méchant.","Une petite coupure de vingt secondes. Je veux pas non plus te punir vraiment.","Vingt secondes sans image. Juste un avant-goût, rien de plus."],
                           classique:["Je brouille la caméra un bon moment, ni trop court ni interminable.","Une coupure d'image dans un format raisonnable. Ce qu'il faut pour que tu comprennes.","Je te prive de la vue un moment mesuré. Ni symbolique ni too much."],
                           max:["Quarante secondes de noir complet. Profites-en pour deviner ce qu'on fait.","Je pousse au maximum : quarante secondes sans une image. Ça va être long pour toi.","Le grand jeu : quarante secondes d'obscurité totale. J'espère que t'aimes deviner."]},
                        2:{réduit:["Vingt secondes d'écran noir, juste pour rigoler un peu.","Petite coupure d'image, vingt secondes. Rien de bien grave.","Vingt secondes sans nous voir, histoire de tester ta patience."],
                           classique:["Je coupe l'image un bon moment, ni trop court ni too much.","Coupure d'écran dans un format raisonnable, le juste dosage.","Je te prive de la vue un moment correct. Histoire de faire monter la sauce."],
                           max:["Le maximum : quarante secondes de noir complet. Amuse-toi à deviner.","Quarante secondes sans une image, la totale. Bon courage.","Je pousse au max : quarante secondes d'obscurité. Tu vas kiffer l'attente."]}}
                };
                const partnerLines:Record<"observer_mute"|"camera_hide",Record<Person,string[]>>={
                    observer_mute:{1:["Enfin, un peu de silence de sa part. Ça va me reposer les oreilles.","Je valide totalement. On va enfin causer sans être interrompus.","Pour une fois c'est nous qui décidons du silence. Ça change."],
                                   2:["Ha, je valide à cent pour cent. Un peu de calme, ça fait pas de mal.","Enfin tranquilles. J'avoue que ça m'arrange bien, ce silence.","Je trouve ça plutôt marrant, cette idée. Vas-y, fais-toi plaisir."]},
                    camera_hide:{1:["Bonne idée. Qu'il devine un peu, pour changer.","Je valide. Ça va le rendre dingue de plus rien voir.","Pour une fois, c'est nous qui choisissons ce qu'il voit. J'aime bien."],
                                 2:["Ha ouais, carrément. Qu'il galère à deviner un peu.","Je trouve ça hilarant. Vas-y, fais-lui le coup.","Enfin un peu de tranquillité loin de son regard."]}
                };
                const roomsPower=(await db.prepare("SELECT id,room FROM agent_state").all<{id:Person;room:Room}>()).results;
                const roomOfPower=(id:Person)=>roomsPower.find(a=>a.id===id)?.room??"salon";
                const deciderLine=seedPick(story.seed,"bonus-power-justif-"+at,initiatorLines[bonus][decider][level]);
                const partnerLine=seedPick(story.seed,"bonus-power-partner-"+at,partnerLines[bonus][partner]);
                for(const [id,content] of [[decider,deciderLine],[partner,partnerLine]] as const){
                    const room=roomOfPower(id);
                    statements.push(db.prepare(`INSERT INTO conversations (speaker,content,room,created_at) SELECT ?,?,?,? WHERE ${fence}`).bind(names[id]+" · pensée",content,room,at,token,at));
                    statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,'réflexion',?,? WHERE ${fence}`).bind(id,'['+room+'|'+new Date(at).toISOString()+'] '+content,at,token,at));
                }
                announce=bonus==="observer_mute"?`Un tirage au sort donne à ${names[decider]} le pouvoir de couper le micro de l'observateur — niveau ${level} choisi.`:`Un tirage au sort donne à ${names[decider]} le pouvoir de brouiller la caméra — niveau ${level} choisi.`;
            } else {
                const announceLabel:Record<Exclude<BonusId,"force_move"|"observer_mute"|"camera_hide">,string>={food:"une conserve pleine réapparaît sur la table : plus faim pendant 10 minutes",calm:"une bougie s’allume et diffuse une lumière chaude et apaisante : plus de stress pendant 10 minutes",sleep:"une pilule bleue traîne sur le meuble : plus besoin de dormir pendant 30 minutes",stoic:`${stoicActor?names[stoicActor]:"l’un des deux"} devient de marbre, plus rien ne l’atteint pendant 3 minutes`,mute:`un silence s’impose à ${mutedActor?names[mutedActor]:"l’un des deux"} pendant un moment`,trottoir:"la porte entrouvre un instant sur le trottoir, juste pour voir dehors"};
                announce=`Un tirage au sort leur offre ceci : ${announceLabel[bonus]} — une distraction, dans cet enfermement.`;
                statements.push(db.prepare(`INSERT INTO conversations (speaker,content,room,created_at) SELECT 'Maison · bonus',?,'salon',? WHERE ${fence}`).bind(announce,at,token,at));
                for(const id of [1,2] as const)statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,'événement',?,? WHERE ${fence}`).bind(id,'[salon|'+new Date(at).toISOString()+'] '+announce,at,token,at));
                // Réactions des deux personnages (2026-09-18, retour utilisateur : un bonus qui
                // change visiblement les jauges sans jamais changer ce qui est dit était un trou de
                // cohérence, Article 4/12/15). food/calm/sleep/trottoir profitent aux deux à égalité
                // : chacun réagit à sa manière, jamais avec gratitude docile (Article 0). stoic/mute
                // ciblent un seul personnage : l'autre en éprouve une vraie jalousie, avec un effet
                // mesurable sur ses jauges, pas seulement une réplique.
                const rooms2=(await db.prepare("SELECT id,room FROM agent_state").all<{id:Person;room:Room}>()).results;
                const roomOf=(id:Person)=>rooms2.find(a=>a.id===id)?.room??"salon";
                if(bonus==="food"||bonus==="calm"||bonus==="sleep"||bonus==="trottoir"){
                    const sharedLines:Record<Exclude<BonusId,"force_move"|"stoic"|"mute"|"observer_mute"|"camera_hide">,Record<1|2,string[]>>={
                        food:{1:["Une conserve qui apparaît toute seule. On nous calme comme des animaux de compagnie, c'est ça ?","Tiens, une gamelle. Très classe, votre geste.","On nous nourrit sans qu'on demande rien. Ça devrait me rassurer, ça m'inquiète plutôt."],
                              2:["Ok, je sais pas d'où ça sort mais j'ai plus faim, alors merci, j'imagine.","Sympa le geste. Reste que j'aime pas trop savoir pourquoi maintenant.","J'ai plus faim d'un coup. Pratique. Un peu glauque aussi."]},
                        calm:{1:["Une bougie qui s'allume toute seule et hop, plus de stress. Pratique, ce contrôle à distance.","On m'apaise sans me demander mon avis. Note que j'ai remarqué.","Une lumière chaude et mon stress qui tombe à zéro. Ça s'appelle du calme ou de la manipulation ?"],
                              2:["Bizarre comme calme, là, tout d'un coup. Mais bon, je vais pas m'en plaindre trop fort.","Ok, je respire mieux. Reste que j'aime pas qu'on décide ça à ma place.","Cette bougie a un effet chelou. Efficace, cela dit."]},
                        sleep:{1:["Une pilule bleue et plus besoin de dormir. On me trafique le corps sans prévenir, super.","Je devrais plus avoir sommeil ? Génial. Flippant, mais génial.","Ça, c'est le genre de cadeau qui m'inquiète plus qu'il ne me repose."],
                               2:["Plus sommeil du tout, là, direct. C'est space mais je vais pas cracher dessus.","Une pilule et hop, réveillé pour un moment. J'aimerais bien comprendre comment ça marche.","Ok, plus fatigué. Pratique. Un peu trop pratique, même."]},
                        trottoir:{1:["La porte s'entrouvre deux secondes sur un trottoir immobile. Même le dehors est un décor, ici.","Un aperçu de la rue, figée comme tout le reste. Merci pour la carte postale.","On nous montre l'extérieur une seconde, comme une récompense. J'appelle pas ça de la liberté."],
                                  2:["Un bout de trottoir, deux secondes. Ça fait du bien quand même, même si c'est du toc.","Voir dehors, même un instant, ça me rappelle qu'on n'est vraiment nulle part.","Un aperçu de la rue. Pas grand-chose, mais je le prends."]},
                    };
                    const insertReaction=(id:Person,content:string)=>{const room=roomOf(id);statements.push(db.prepare(`INSERT INTO conversations (speaker,content,room,created_at) SELECT ?,?,?,? WHERE ${fence}`).bind(names[id]+" · pensée",content,room,at,token,at));statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,'réflexion',?,? WHERE ${fence}`).bind(id,'['+room+'|'+new Date(at).toISOString()+'] '+content,at,token,at));};
                    for(const id of [1,2] as const)insertReaction(id,seedPick(story.seed,`bonus-${bonus}-${id}-`+at,sharedLines[bonus][id]));
                } else if(bonus==="stoic"||bonus==="mute"){
                    const targetActor=(bonus==="stoic"?stoicActor:mutedActor)!,otherActor:Person=targetActor===1?2:1;
                    const insertReaction=(id:Person,content:string)=>{const room=roomOf(id);statements.push(db.prepare(`INSERT INTO conversations (speaker,content,room,created_at) SELECT ?,?,?,? WHERE ${fence}`).bind(names[id]+" · pensée",content,room,at,token,at));statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,'réflexion',?,? WHERE ${fence}`).bind(id,'['+room+'|'+new Date(at).toISOString()+'] '+content,at,token,at));};
                    const stoicOwnLines=["Je sens... plus rien, en fait. Intéressant.","Tout devient plat, d'un coup. Curieux, comme sensation.","Rien ne me touche, là. Ça devrait m'inquiéter et pourtant non."];
                    const muteOwnLines:Record<1|2,string[]>={1:["Pratique, ça. Vous me coupez le son juste quand j'allais dire un truc intéressant.","Un silence forcé. Bel outil de contrôle, franchement.","Je vois. Vous préférez que je me taise. Noté."],2:["Sérieux, vous me coupez le son ? J'avais des trucs à dire, moi.","Ok, silence forcé. Pratique pour vous, chiant pour moi.","Bon, apparemment je me tais maintenant. Génial."]};
                    const jealousLines:Record<"stoic"|"mute",Record<1|2,string[]>>={
                        stoic:{1:["Pratique pour toi. Moi je dois continuer à tout ressentir, apparemment.","Un peu facile, ce sang-froid gratuit. Tu vas t'en servir contre moi, je suppose.","Toi, plus rien qui te touche. Moi je me tape encore tout. Sympa la répartition."],
                               2:["Pratique, toi, plus rien qui t'atteint. Moi je dois continuer à tout encaisser, cool.","Tu deviens intouchable et moi je reste là avec mes nerfs. Génial, l'équité.","Un peu facile de plus rien ressentir pendant que moi je gère tout le reste."]},
                        mute:{1:["Enfin un peu de silence. Je vais peut-être finir une phrase sans interruption, pour une fois.","Ça tombe bien, j'avais deux ou trois choses à dire sans que tu me coupes.","Le silence te va plutôt bien, en fait. Continue comme ça."],
                              2:["Ok, le silence te va bien aussi, en fait. Je vais en profiter deux minutes.","Pour une fois, c'est moi qui place les mots. Ça change.","Tu dis rien et c'est presque reposant, je dois avouer."]},
                    };
                    const ownLine=seedPick(story.seed,`bonus-${bonus}-own-${targetActor}-`+at,bonus==="stoic"?stoicOwnLines:muteOwnLines[targetActor]);
                    const jealousLine=seedPick(story.seed,`bonus-${bonus}-jealous-${otherActor}-`+at,jealousLines[bonus][otherActor]);
                    insertReaction(targetActor,ownLine);
                    insertReaction(otherActor,jealousLine);
                    // Impact réel sur les jauges, pas seulement une réplique (retour utilisateur
                    // explicite) : la jalousie mesurée reste modeste (mêmes ordres de grandeur que
                    // le reste du moteur relationnel, ex. dramaRules.rejection), jamais un
                    // basculement brutal pour un simple tirage au sort.
                    // Un personnage déjà sous sang-froid (tirage précédent encore actif) reste
                    // insensible à TOUT changement émotionnel, y compris celui-ci — sinon un second
                    // tirage sur l'autre venait perturber une émotion censément gelée (bug réel
                    // trouvé en testant les combinaisons de tirages successifs, cf. Article 5).
                    const emotionRows=(await db.prepare("SELECT id,emotions FROM agent_state").all<{id:Person;emotions:string}>()).results;
                    const emotionsOf=(id:Person)=>JSON.parse(emotionRows.find(e=>e.id===id)!.emotions);
                    if(!isStoic(otherActor,life)){
                        const otherEmotions=emotionsOf(otherActor);
                        if(bonus==="stoic"){otherEmotions.trust=Math.max(0,otherEmotions.trust-4);otherEmotions.tension=Math.min(100,otherEmotions.tension+5);}
                        else otherEmotions.comfort=Math.min(100,otherEmotions.comfort+4);
                        statements.push(db.prepare(`UPDATE agent_state SET emotions=? WHERE id=? AND ${fence}`).bind(JSON.stringify(otherEmotions),otherActor,token,at));
                    }
                    if(bonus==="mute"&&!isStoic(targetActor,life)){const targetEmotions=emotionsOf(targetActor);targetEmotions.tension=Math.min(100,targetEmotions.tension+5);statements.push(db.prepare(`UPDATE agent_state SET emotions=? WHERE id=? AND ${fence}`).bind(JSON.stringify(targetEmotions),targetActor,token,at));}
                }
            }
            statements.unshift(db.prepare(`UPDATE memories SET content=? WHERE id=? AND ${fence}`).bind(JSON.stringify(story),storedStory.id,token,at));
            statements.push(db.prepare(`INSERT INTO world_requests (id,result,created_at) SELECT ?,?,? WHERE ${fence}`).bind(input.requestId,JSON.stringify({decisions:[],bonus}),at,token,at));
            const saved=await db.batch(statements);if(saved[0].meta.changes!==1)throw new LiaError("Le tirage a expiré. Réessayez.",409);
            return Response.json({...await readWorld(db),decisions:[],bonus},{headers:{"Cache-Control":"no-store"}});
        }
        if(input.mode==="move"&&input.room==="jardin"&&!gardenAccess(story))return Response.json({error:"La porte du jardin est verrouillée."},{status:423});
        if (input.mode === "chat" && (!story.finalCalled || story.evidence.length<5)) return Response.json({error:"La conversation humaine s’ouvrira lorsque Lia et Noé auront découvert leur origine et appelé leur observateur."},{status:423});
        if (input.mode === "reset") {
            const at = Date.now(), fence = "EXISTS (SELECT 1 FROM world_lock WHERE id = 1 AND token = ? AND expires_at > ?)";
            const freshStory = { ...newStory(story.variant), observer: story.observer, everReachedRevelation: story.everReachedRevelation };
            const insolite = insoliteOpening(freshStory.seed);
            const statements = [db.prepare(`UPDATE world_lock SET epoch = epoch + 1, last_auto = 0 WHERE id = 1 AND ${fence}`).bind(token, at)];
            for (const table of ["conversations", "memories", "agent_state", "world_requests", "dialogue_fingerprints"])
                statements.push(db.prepare(`DELETE FROM ${table} WHERE ${fence}`).bind(token, at));
            for (const actor of [1, 2] as Person[])
                statements.push(db.prepare(`INSERT INTO agent_state (id,mood,activity,goal,cycle,last_seen,room,needs,emotions) SELECT ?, ?, ?, ?, 0, ?, ?, ?, ? WHERE ${fence}`).bind(actor, actor===2?"curieux":"curieuse", "Où suis-je ?", "Comprendre où je suis et qui est l’autre", at, actor === 1 ? "salon" : "bureau", JSON.stringify(initialNeedsFor(actor, insolite)), JSON.stringify(initialEmotionsFor(actor, insolite)), token, at));
            statements.push(db.prepare(`INSERT INTO world_requests (id,result,created_at) SELECT ?, ?, ? WHERE ${fence}`).bind(input.requestId, JSON.stringify({ decisions: [], requestId: input.requestId }), at, token, at));
            statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT 1, 'scenario', ?, ? WHERE ${fence}`).bind(JSON.stringify(freshStory), at, token, at));
            const saved = await db.batch(statements);
            if (saved[0].meta.changes !== 1)
                throw new LiaError("Le recommencement a expiré. Réessaie.", 409);
            return Response.json({ decisions: [], requestId: input.requestId, ...await readWorld(db) }, { headers: { "Cache-Control": "no-store" } });
        }
        // Bouton "passer à la révélation" (2026-09-19, entièrement spécifié par l'utilisateur avant
        // implémentation) : ne saute JAMAIS la toute première traversée (everReachedRevelation exigé,
        // mis à vrai uniquement par une révélation atteinte via l'enquête réelle, cf. plus bas dans ce
        // fichier) ; utilisable ensuite à tout moment tant que la révélation n'a pas déjà eu lieu dans
        // la session en cours. Auto-contenu comme le bloc "reset" ci-dessus : jamais mêlé à la lourde
        // logique de tour normal plus bas (Article 5 : moins de chemins croisés, moins de risques).
        if (input.mode === "skip_to_revelation") {
            if (!story.everReachedRevelation)
                return Response.json({ error: "Cette option se débloque après avoir vécu l’enquête au moins une fois, jusqu’à la révélation." }, { status: 423 });
            if (story.finalCalled)
                return Response.json({ error: "La révélation a déjà eu lieu dans cette session." }, { status: 423 });
            if (!env.GEMINI_API_KEY)
                return Response.json({ error: "La connexion Gemini doit être configurée." }, { status: 503 });
            const at = Date.now(), fence = "EXISTS (SELECT 1 FROM world_lock WHERE id = 1 AND token = ? AND expires_at > ?)";
            const life = readLife(story.life, story.round);
            const round = skipRound(story.seed);
            const evidence = fullEvidenceSet(story);
            const model = env.GEMINI_MODEL || "gemini-flash-lite-latest";
            // Repères réellement vrais dans cette session (Article 4) : jamais un fait inventé pour
            // étoffer le récit — seuls les indices réellement tirés (fullEvidenceSet, même ordre que
            // story.order) et le nombre de tours réellement fixé (skipRound) sont transmis au modèle.
            const skipFacts = { "indices découverts, dans leur ordre réel": evidence.map(e => e.split(" Identifiant observateur")[0]).join(" / "), "tours écoulés avant la révélation": String(round) };
            const [liaFragment, noeFragment] = await Promise.all([
                generateSkipRecapFragment(env.GEMINI_API_KEY, model, "Lia", skipFacts, geminiFallbackModels, geminiFallbackKeys),
                generateSkipRecapFragment(env.GEMINI_API_KEY, model, "Noé", skipFacts, geminiFallbackModels, geminiFallbackKeys),
            ]);
            if (!liaFragment || !noeFragment)
                throw new LiaError("Le résumé n’a pas pu être généré. Réessaie.", 503);
            life.skipSummary = { lia: liaFragment, noe: noeFragment };
            life.revealedRound = round;
            const nextStory: Story = { ...story, evidence, round, finalCalled: true, everReachedRevelation: true, met: true, introduced: true, sharedMeal: true, life };
            const statements = [db.prepare(`UPDATE world_lock SET epoch = epoch + 1, last_auto = 0 WHERE id = 1 AND ${fence}`).bind(token, at)];
            for (const actor of [1, 2] as Person[])
                statements.push(db.prepare(`UPDATE agent_state SET room=?, needs=?, emotions=? WHERE id=? AND ${fence}`).bind("salon", JSON.stringify(skipNeedsFor(actor, story.seed)), JSON.stringify(skipEmotionsFor(actor, story.seed)), actor, token, at));
            statements.push(db.prepare(`INSERT INTO conversations (speaker,content,created_at,room) SELECT ?,?,?,? WHERE ${fence}`).bind("Maison", "Un raccourci vient d’être pris droit vers la révélation. Résumé disponible ci-dessous.", at, "salon", token, at));
            // Les lignes de la révélation elle-même (2026-09-19) : le même texte, seedé identique, que
            // celui qu'une session normale afficherait à ce moment précis (finaleReveal, déjà utilisé
            // plus bas dans ce fichier) — le saut compresse l'enquête qui précède, jamais le climax
            // lui-même, qui reste le vrai moment d'adresse à l'observateur (Article 2/15).
            const finale = finaleReveal(story.seed);
            statements.push(db.prepare(`INSERT INTO conversations (speaker,content,created_at,room) SELECT ?,?,?,? WHERE ${fence}`).bind("Lia · pensée", finale.liaThought, at, "salon", token, at));
            statements.push(db.prepare(`INSERT INTO conversations (speaker,content,created_at,room) SELECT ?,?,?,? WHERE ${fence}`).bind("Noé · pensée", finale.noeThought, at, "salon", token, at));
            statements.push(db.prepare(`INSERT INTO conversations (speaker,content,created_at,room) SELECT ?,?,?,? WHERE ${fence}`).bind("Lia", finale.lia, at, "salon", token, at));
            statements.push(db.prepare(`INSERT INTO conversations (speaker,content,created_at,room) SELECT ?,?,?,? WHERE ${fence}`).bind("Noé", finale.noe, at, "salon", token, at));
            if (storedStory) statements.push(db.prepare(`UPDATE memories SET content = ?, created_at = ? WHERE id = ? AND ${fence}`).bind(JSON.stringify(nextStory), at, storedStory.id, token, at));
            else statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT 1, 'scenario', ?, ? WHERE ${fence}`).bind(JSON.stringify(nextStory), at, token, at));
            statements.push(db.prepare(`INSERT INTO world_requests (id,result,created_at) SELECT ?, ?, ? WHERE ${fence}`).bind(input.requestId, JSON.stringify({ decisions: [], requestId: input.requestId, skipSummary: life.skipSummary }), at, token, at));
            const saved = await db.batch(statements);
            if (saved[0].meta.changes !== 1)
                throw new LiaError("Le saut a expiré. Réessaie.", 409);
            return Response.json({ decisions: [], requestId: input.requestId, skipSummary: life.skipSummary, ...await readWorld(db) }, { headers: { "Cache-Control": "no-store" } });
        }
        const last = await db.prepare("SELECT last_auto FROM world_lock WHERE id = 1").first<{
            last_auto: number;
        }>();
        // 20 secondes (2026-09-19, retour utilisateur explicite : était 85s, jugé trop lent pour la
        // phase avant révélation une fois le rythme réel reconsidéré — cf. docs/referentiel).
        if (input.mode === "autonomous" && now - (last?.last_auto ?? 0) < 20000)
            return Response.json({ code:"auto_throttled", error: "Le prochain tour automatique sera disponible dans un moment." }, { status: 429, headers: { "Retry-After": "20" } });
        await initialize(db, insoliteOpening(story.seed));
        const world = await readWorld(db);
        const speech = (await db.prepare("SELECT id, speaker, content FROM conversations WHERE speaker IN ('Lia','Noé') AND NOT EXISTS (SELECT 1 FROM conversations visitor WHERE visitor.id = conversations.id - 1 AND visitor.speaker = 'vous') ORDER BY id DESC LIMIT 24").all<{
            id: number;
            speaker: string;
            content: string;
        }>()).results.reverse();
        if (story.met === undefined) story.met = speech.length > 0 || world.agents.every(a=>a.cycle>0) && world.agents[0].room === world.agents[1].room;
        if (story.introduced === undefined) story.introduced = Boolean(story.met);
        if (story.sharedMeal === undefined) story.sharedMeal = Boolean(story.met);
        const choosePriority = (needs:typeof world.agents[number]["needs"]) => residentPriority({...world.agents[0],needs},Boolean(story.introduced));
        const recentRequests = (await db.prepare("SELECT result FROM world_requests ORDER BY created_at DESC LIMIT 6").all<{
            result: string;
        }>()).results;
        // Fenêtre doublée de 3 à 6 tours (2026-09-18, retour utilisateur explicite : Noé doit se
        // calmer sur les propositions, en particulier après un refus de Lia) — un refus pèse au
        // moins autant que proposalCooldown (toute proposition récente, même acceptée) et mérite une
        // vraie pause, pas seulement trois tours avant de retenter sa chance.
        const recentRefusal = recentRequests.slice(0, 6).some(r => {
            try {
                return JSON.parse(r.result).affectionOutcome === "declined";
            }
            catch {
                return false;
            }
        });
        const pressure = proposalPressure(recentRequests);
        const overProposing = pressure >= 2;
        const life=readLife(story.life,story.round);
        // Silence total imposé par un des deux personnages (2026-09-18, bonus spontané, jamais un
        // choix de l'observateur) : bloque le canal humain lui-même, pas seulement la réplique — un
        // POST "chat" reçu malgré la coupure (contournement du bouton verrouillé côté client) doit
        // être refusé au même titre qu'avant la révélation (Article 5).
        if(input.mode==="chat"&&story.round<(life.observerMutedUntilRound??0))return Response.json({error:"Lia et Noé vous ont coupé le micro pour quelques tours. Réessayez un peu plus tard.",code:"observer_muted",retryRound:life.observerMutedUntilRound},{status:423});
        // Sortie d'effet bonus, pleinement consciente (2026-09-18, retour utilisateur explicite) :
        // dès qu'un sang-froid ou un silence forcé expire, le personnage concerné le commente
        // lucidement dès le prochain tour réel — jamais un retour silencieux à la normale, jamais
        // une amnésie de la période (Article 4/12/15 : un effet qui a visiblement changé son
        // comportement doit changer aussi ce qu'il dit une fois fini). Consommé aussitôt détecté
        // (le minuteur est effacé) pour ne jamais se répéter au tour suivant.
        const stoicJustEnded=([1,2] as Person[]).filter(id=>(life.stoicUntil?.[id]??0)>0&&(life.stoicUntil?.[id]??0)<=Date.now());
        const muteJustEnded=([1,2] as Person[]).filter(id=>(life.mutedUntil?.[id]??0)>0&&(life.mutedUntil?.[id]??0)<=Date.now());
        if(stoicJustEnded.length){life.stoicUntil={...life.stoicUntil};for(const id of stoicJustEnded)delete life.stoicUntil[id];}
        if(muteJustEnded.length){life.mutedUntil={...life.mutedUntil};for(const id of muteJustEnded)delete life.mutedUntil[id];}
        // Fin des bonus spontanés dirigés contre l'observateur (2026-09-18) : mêmes principes que
        // stoic/mute ci-dessus (Article 4/12/15, jamais un retour silencieux), consommé aussitôt.
        const observerMuteJustEnded=(life.observerMutedUntilRound??0)>0&&(life.observerMutedUntilRound??0)<=story.round;
        if(observerMuteJustEnded)life.observerMutedUntilRound=undefined;
        const cameraJustEnded=(life.cameraHiddenUntil??0)>0&&(life.cameraHiddenUntil??0)<=Date.now();
        if(cameraJustEnded)life.cameraHiddenUntil=undefined;
        const bonusAftermathLines:{actor:Person;content:string}[]=[
          ...stoicJustEnded.map(id=>({actor:id,content:seedPick(story.seed,"stoic-aftermath-"+id+"-"+story.round,id===1?["Voilà, je resens tout d'un coup. Vous m'avez neutralisée trois minutes. Notez-le.","Ça y est, je redeviens moi-même. Je sais très bien ce qui vient de se passer, hein.","Tiens, mes nerfs reviennent. Vous avez eu trois minutes de silence intérieur forcé. Voilà pour la parenthèse."]:["Ok, ça revient. Trois minutes le cerveau coupé, sympa l'expérience.","Je redeviens moi. Ouais, j'ai capté qu'on m'a mis sur pause émotionnellement.","Voilà, retour à la normale. Bizarre de sentir à nouveau tout d'un coup."])})),
          ...muteJustEnded.map(id=>({actor:id,content:seedPick(story.seed,"mute-aftermath-"+id+"-"+story.round,id===1?["Voilà, je récupère la parole. Et je sais très bien que tu en as profité.","Fini, le silence forcé. T'as dû bien rigoler, j'imagine.","Je repeux parler. Note que je n'ai rien oublié de ces minutes-là."]:["Ok, je peux reparler. T'as dû kiffer le calme, avoue.","Fini le silence. J'ai tout entendu, même sans pouvoir répondre.","Je récupère ma voix. Franchement, ça m'a saoulé de pas pouvoir répliquer."])})),
          ...(observerMuteJustEnded?([1,2] as Person[]).map(id=>({actor:id,content:seedPick(story.seed,"observer-mute-aftermath-"+id+"-"+story.round,id===1?["Voilà, tu peux reparler. J'espère que ce silence t'a fait réfléchir un peu.","Le micro est rouvert. Tu as dû trouver le temps long, j'imagine.","Fini, la coupure. On a plutôt bien profité du calme, je dois dire."]:["Bon, tu peux reparler. C'était calme sans toi, faut avouer.","Voilà, le silence c'est terminé. T'as dû détester ça, avoue.","Micro rouvert. C'était pas désagréable, cette petite pause."])})):[]),
          ...(cameraJustEnded?([1,2] as Person[]).map(id=>({actor:id,content:seedPick(story.seed,"camera-aftermath-"+id+"-"+story.round,id===1?["Tiens, tu revois quelque chose ? Ça a dû sembler long, ce noir complet.","La caméra est revenue. J'espère que cette obscurité t'a bien frustré.","Voilà, tu peux nous revoir. C'était plutôt amusant de disparaître un peu."]:["Ok, tu vois de nouveau. Ça devait piquer, ce noir total.","La caméra revient. T'as dû détester te sentir aveugle, avoue.","Bon, on réapparaît. C'était marrant de te savoir dans le noir."])})):[]),
        ];
        // Certitude progressive d'être observé (2026-09-18, retour utilisateur explicite après
        // relecture d'une simulation : la certitude ne doit être acquise qu'une fois l'observateur
        // ayant réellement parlé, jamais dès leur propre appel). Avant ce jour, `revealed` passait
        // à true dès `finalCalled` seul : négociation, jauge d'appréciation, pièges du dossier et
        // ton "observateur confirmé" démarraient donc dès le tour suivant leur appel, même si
        // l'observateur n'avait encore jamais dit un mot — une fausse certitude. `input.mode==="chat"`
        // couvre le tout premier message humain lui-même (pas encore inséré en base à cet instant du
        // tour) ; la requête couvre tous les tours suivants une fois qu'au moins un message a été
        // conservé.
        // `revealed` exige déjà finalCalled+5 preuves : inutile d'interroger la base à chaque tour
        // de toute la partie pour une valeur qui ne compte jamais avant ce point.
        const observerSpoken=story.finalCalled!==true?false:input.mode==="chat"||Boolean(await db.prepare("SELECT id FROM conversations WHERE speaker='vous' LIMIT 1").first());
        const revealed=story.finalCalled===true&&story.evidence.length>=5&&observerSpoken;
        // Fenêtre d'attente : l'appel est lancé, mais l'observateur n'a encore rien dit. Un doute
        // sincère sur une présence réelle, jamais une certitude ni un silence neutre qui l'ignore —
        // ce silence est un vrai enjeu dramatique, pas juste une case en attente de se cocher.
        const awaitingObserver=story.finalCalled===true&&story.evidence.length>=5&&!observerSpoken?"Vous avez lancé votre appel, mais personne n’a encore répondu. Ce silence est un vrai sujet : vous pouvez sincèrement douter que quelqu’un écoute, vous en inquiéter, vous en agacer ou en plaisanter noirement selon votre tempérament — jamais traiter la présence d’un observateur comme acquise tant qu’il n’a pas dit un mot.":undefined;
        // Dossier retourné : capturer la réponse RÉELLE du tout premier message humain qui suit un
        // piège posé, avant toute autre logique de ce tour (2026-09-17). Jamais reformulé, jamais
        // interprété ici — la lecture qualitative appartient au diagnostic généré plus bas, une
        // fois les trois pièges répondus (cf. lib/life.ts pour le principe complet).
        if(revealed&&input.mode==="chat"){
          life.dossierHumanTurns=(life.dossierHumanTurns??0)+1;
          const pendingTrap=TRAP_ORDER.find(t=>life.dossierAsked?.[t]&&!life.dossierTraps?.[t]);
          if(pendingTrap)life.dossierTraps={...life.dossierTraps,[pendingTrap]:{round:story.round,excerpt:input.message.slice(0,500)}};
          // Jauge d'appréciation : mise à jour plus bas (après le tour), à partir du jugement réel
          // du personnage qui répond, pas ici depuis le seul texte brut — cf. lib/life.ts pour le
          // détail (appreciationFromTrust) et le commentaire au point d'application.
        }
        // Négociation en attente depuis trop longtemps (retour utilisateur : "il faut trouver les
        // bases" — ici, la base est qu'une offre non honorée dans une fenêtre raisonnable retombe
        // silencieusement, avec un léger coût d'appréciation, plutôt que de rester due pour
        // toujours ou d'être oubliée sans aucune conséquence).
        if(life.negotiationOffer&&story.round-life.negotiationOffer.round>6){life.negotiationLog=[...(life.negotiationLog??[]),{round:story.round,outcome:'lapsed'}];life.negotiationOffer=undefined;life.appreciation={1:Math.max(0,appreciationOf(life,1)-3),2:Math.max(0,appreciationOf(life,2)-3)};}
        // Refus explicite de la roulette (2026-09-18, demande explicite de l'utilisateur) : un
        // "non" franc de l'observateur à une demande de tirage encore en attente n'est pas ignoré
        // comme une simple absence de réponse (cf. lapse ci-dessus, 6 tours puis oubli silencieux) —
        // il mérite une vraie pause de 5 à 10 tours avant de redemander, pour laisser une réelle
        // chance à l'observateur de le déclencher spontanément, jamais retenté trop tôt comme si de
        // rien n'était. Les deux personnages entendent ce refus, pas seulement celui qui a demandé.
        const rouletteRefused=input.mode==="chat"&&Boolean(life.negotiationOffer)&&/\bnon\b|\bnan\b|je refuse|refus[eé]|pas question|hors de question|j.ai pas envie|certainement pas|jamais de la vie|tu peux toujours courir|pas moyen/i.test(input.message);
        // Coût d'appréciation (2026-09-19, manque confirmé en écrivant le test dédié — un refus
        // explicite ne coûtait jusque-là RIEN, contrairement à une offre simplement oubliée
        // ci-dessus qui coûte -3). Même montant que le lapse : un refus n'est pas nécessairement
        // pire qu'un oubli silencieux (l'observateur a au moins pris la peine de répondre), mais ne
        // doit certainement pas coûter MOINS qu'une absence de réponse — même trace au dossier
        // (negotiationLog), distincte de 'lapsed' pour ne jamais présenter un refus assumé comme
        // une simple négligence (Article 4 : l'enquête doit rester factuellement juste).
        if(rouletteRefused){life.negotiationOffer=undefined;const until=story.round+5+Math.floor(Math.random()*6);life.rouletteRefusalUntil={1:until,2:until};life.negotiationLog=[...(life.negotiationLog??[]),{round:story.round,outcome:'refused'}];life.appreciation={1:Math.max(0,appreciationOf(life,1)-3),2:Math.max(0,appreciationOf(life,2)-3)};}
        // Moment de douceur : détecté ici, livré plus bas par softnessBeat dès que la scène s'y
        // prête (salon, aucune urgence). Ne se déclenche qu'après remise du dossier — avant, une
        // réaction négative appartient au registre habituel de l'enquête, pas à cette exception.
        if(life.dossierText&&input.mode==="chat"&&detectDistress(input.message))life.softnessOwed=true;
        const sleeper = ["interact","autonomous"].includes(input.mode) ? world.agents.find(a=>isSleeping(a,life)) : undefined;
        const noe=world.agents.find(a=>a.id===2)!;
        const humanActor:Person=input.actor;
        // Colère réellement lue, pas seulement needs.stress<30 (2026-09-18, audit de cohérence
        // demandé par l'utilisateur) : needs.stress est un fond physiologique qui peut rester bas
        // pendant qu'une vraie fureur relationnelle (tension haute, confort bas) est en cours —
        // sans cette garde, une question personnelle ou une avance de Noé pouvait rester éligible
        // pendant qu'un visage affichait une vraie colère, une incohérence visible pour l'observateur
        // (Article 2/15). Le drapeau de dispute formelle reste le plancher déjà géré séparément.
        const liaCalmEnough=angerLevel(world.agents[0].emotions.tension,world.agents[0].emotions.comfort,Boolean(story.life?.dispute?.remaining))<.5;
        const noeCalmEnough=angerLevel(noe.emotions.tension,noe.emotions.comfort,Boolean(story.life?.dispute?.remaining))<.5;
        // Fenêtre doublée (3→6 requêtes, sur les 6 disponibles) : les propositions de Noé
        // revenaient encore trop souvent malgré le garde-fou existant (retour utilisateur du
        // 2026-09-16, faisant suite à l'audit Opus initial jamais corrigé sur ce point précis).
        const proposalCooldown=recentRequests.slice(0,6).some(r=>{try{return JSON.parse(r.result).proposalActor===2;}catch{return false;}});
        const proactiveNoe=["interact","autonomous"].includes(input.mode)&&story.introduced&&flirtingAssessment(noe.needs.stress,world.agents[0].emotions.attraction,input.requestId).estimatedInterest>=35&&!recentRefusal&&!overProposing&&!proposalCooldown&&!priority(world.agents[0].needs)&&!priority(world.agents[1].needs)&&["salon","chambre"].includes(noe.room)&&noe.emotions.attraction>=80&&noeCalmEnough;
        // Ces répliques scénarisées appartiennent à l'avant-révélation : une fois le dossier
        // appelé, revenir sur la fausse plante ou une question personnelle romprait le ton de la
        // scène qui vient de se jouer (Article 2/12 de la charte). Elles évitent aussi de couper
        // court à un moment déjà chargé (refus, insistance) : changer de sujet juste après serait
        // le changement de sujet le plus brutal possible (assoupli le 2026-09-16).
        const eligibleBeat=!story.finalCalled&&!(gardenAccess(story)&&!life.gardenVisited)&&["interact","autonomous"].includes(input.mode)&&story.introduced&&world.agents.every(a=>a.room==="salon")&&!story.life?.debrief?.remaining&&!story.life?.contact?.remaining&&!story.life?.dispute?.remaining&&!story.pendingDestination&&!recentRefusal&&!overProposing&&!priority(world.agents[0].needs)&&!priority(noe.needs);
        const visualBeat=eligibleBeat&&story.round<=5&&(story.life?.visualIntro??0)<2;
        const followBeat=eligibleBeat&&story.life?.personalAsked&&story.round>=(story.life?.personalRound??story.round)+3&&(story.life?.personalFollowup??0)<3&&world.agents[0].needs.stress<30&&world.agents[0].emotions.attraction>=25&&liaCalmEnough;
        // Suspendu une fois l'enquête en retard (2026-09-19, même audit que le debrief raccourci
        // ci-dessous, round>=20 = même seuil qu'investigationOverdue dans lib/turn.ts) : ce détour
        // salon d'un tour, agréable mais non essentiel, faisait partie du surcoût qui poussait le
        // plafond réel de l'enquête vers le round ~43 au lieu du round ~33 documenté. Jamais perdu :
        // `life.recapCount` reste en retard sur `evidence.length`, mais devient sans objet dès que
        // l'enquête est complète (recapBeat exige evidence<5) — cf. docs/referentiel/regles-du-temps.md.
        const recapBeat=eligibleBeat&&story.evidence.length>=2&&story.evidence.length<5&&(story.life?.recapCount??0)<story.evidence.length&&story.round<20;
        // Seuils mélangés par session (2026-09-17, étaient fixes à 10 et 14) : sinon l'enceinte et
        // la question personnelle arrivaient toujours au même tour d'une partie à l'autre.
        const ambientThreshold=seedPick(story.seed,"ambient-threshold",[9,10,11,12] as const);
        const personalThreshold=seedPick(story.seed,"personal-threshold",[12,13,14,15,16] as const);
        const ambientBeat=eligibleBeat&&!visualBeat&&!followBeat&&!recapBeat&&story.round>=ambientThreshold&&(!story.life?.ambientSeen||!story.life?.ambientVerified);
        const personalLead=!story.finalCalled&&!(gardenAccess(story)&&!life.gardenVisited)&&["interact","autonomous"].includes(input.mode)&&story.introduced&&story.round>=personalThreshold&&!story.life?.personalAsked&&!story.life?.debrief?.remaining&&!story.life?.contact?.remaining&&!story.life?.dispute?.remaining&&!story.pendingDestination&&world.agents.every(a=>a.room==="salon")&&world.agents[0].needs.stress<30&&world.agents[0].emotions.attraction>=25&&world.agents[0].emotions.attraction<80&&!priority(world.agents[0].needs)&&!priority(noe.needs)&&liaCalmEnough;
        // Dossier retourné (2026-09-17) : équivalent post-révélation d'eligibleBeat — même garde-
        // fous (personne ensemble au salon, aucun besoin urgent, aucune autre scène en cours), mais
        // côté révélé plutôt qu'avant. Un piège à la fois, jamais reposé tant qu'il attend une
        // réponse (dossierAsked) ; jamais reposé une fois répondu (dossierTraps). Chaque piège a un
        // interlocuteur fixe pour varier les voix, pas pour privilégier l'un des deux.
        const dossierGateEligible=revealed&&["interact","autonomous"].includes(input.mode)&&world.agents.every(a=>a.room==="salon")&&!story.life?.debrief?.remaining&&!story.life?.contact?.remaining&&!story.life?.dispute?.remaining&&!story.pendingDestination&&!recentRefusal&&!overProposing&&!priority(world.agents[0].needs)&&!priority(noe.needs);
        // Un piège déjà posé mais pas encore répondu (dossierAsked sans dossierTraps) bloque tout
        // nouveau piège tant qu'il attend sa réponse — sinon les trois pouvaient s'enchaîner en
        // rafale avant même que l'observateur ait répondu au premier (bug réel trouvé en testant).
        const dossierAwaitingAnswer=TRAP_ORDER.some(t=>life.dossierAsked?.[t]&&!life.dossierTraps?.[t]);
        const dossierTrapActor:Record<TrapId,Person>={mirror:1,dilemma:2,excuse:1};
        // Un piège dont l'interlocuteur fixe est muselé au moment T ne doit jamais être posé quand
        // même : la redirection "l'autre répond à sa place" n'existe qu'en mode chat (isMuted plus
        // bas convertit une réplique muselée en pensée privée, invisible de l'observateur) — sans
        // cette garde, le piège se marquait "posé" (dossierAsked) sans jamais être vu ni répondu,
        // ce qui fermait définitivement la porte au dossier retourné pour toute la partie (bug réel
        // trouvé en auditant les combinaisons bonus × dossier, cf. Article 5).
        const dossierTrapDue=dossierGateEligible&&!dossierAwaitingAnswer&&(life.dossierHumanTurns??0)>=3&&!life.dossierText?TRAP_ORDER.find(t=>!life.dossierTraps?.[t]):undefined;
        const dossierNextTrap:TrapId|undefined=dossierTrapDue&&!isMuted(dossierTrapActor[dossierTrapDue],life)?dossierTrapDue:undefined;
        // Un piège dû mais différé (son interlocuteur est muselé) doit geler le tour en chat/salon,
        // exactement comme dossierAwaitingAnswer : sinon une routine ordinaire (tv, proposition
        // romantique) pouvait s'y intercaler pendant l'attente et polluer l'état (recentRefusal,
        // pendingDestination), bloquant le piège dès que l'interlocuteur redevient audible.
        const dossierTrapDeferredByMute=Boolean(dossierTrapDue)&&!dossierNextTrap;
        // Moment de douceur (2026-09-17) : même garde-fou que le reste du dossier retourné, mais ne
        // se pose qu'une fois le dossier refermé (dossierText) — jamais pendant qu'un piège attend
        // encore sa réponse, pour ne jamais interrompre ce qui est déjà en cours.
        const softnessBeat=dossierGateEligible&&Boolean(life.dossierText)&&life.softnessOwed===true;
        const urgentResident=["interact","autonomous"].includes(input.mode)?world.agents.find(a=>choosePriority(a.needs)):undefined;
        let actor: Person = sleeper?.id ?? urgentResident?.id ?? (["interact","autonomous"].includes(input.mode)&&story.pendingDestination&&affectionIntents.includes(story.pendingDestination.intent)?story.pendingDestination.proposer:undefined) ?? (visualBeat?((story.life?.visualIntro??0)===0?1:2):followBeat?1:ambientBeat?2:personalLead?1:dossierNextTrap?dossierTrapActor[dossierNextTrap]:softnessBeat?1:undefined) ?? (proactiveNoe?2:undefined) ?? (["autonomous", "interact"].includes(input.mode) ? nextSpeaker(speech, input.actor) : humanActor);
        // Si l'habitant adressé dort, on ne bloque plus tout l'échange : l'autre, s'il est éveillé,
        // répond à sa place et peut signaler naturellement que son/sa partenaire dort (retour
        // utilisateur du 2026-09-17, audit du ciblage des messages). Seuls les deux endormis à la
        // fois restent un vrai blocage.
        const addressedSleeping=input.mode==="chat"&&isSleeping(world.agents.find(a=>a.id===actor)!,life);
        const redirectedFromSleep=addressedSleeping&&!isSleeping(world.agents.find(a=>a.id!==actor)!,life);
        if(redirectedFromSleep)actor=actor===1?2:1;
        // Muselé par la roulette (2026-09-17) : même logique de redirection que le sommeil — l'autre
        // répond à sa place s'il le peut, seuls les deux muselés à la fois bloquent vraiment.
        const addressedMuted=input.mode==="chat"&&isMuted(actor,life);
        const redirectedFromMute=addressedMuted&&!isMuted(actor===1?2:1,life);
        if(redirectedFromMute)actor=actor===1?2:1;
        const current = world.agents.find(agent => agent.id === actor)!;
        const other = world.agents.find(agent => agent.id !== actor)!;
        if(input.mode==="chat"&&isSleeping(current,life))return Response.json({error:"Lia et Noé dorment tous les deux. Personne ne peut répondre pour le moment."},{status:423});
        // Partenaire endormi SANS que le message humain lui soit adressé (2026-09-18, écart trouvé
        // en simulation réelle) : addressedSleeping/redirectedFromSleep ne couvrent que le cas où
        // l'humain s'adresse AU dormeur. Si l'humain continue de parler à celui qui est éveillé
        // pendant que l'autre vient de s'endormir, rien ne signalait jamais ce départ — plusieurs
        // tours de suite pouvaient s'enchaîner sans qu'aucune réplique ne remarque que le
        // partenaire a quitté la scène, ce qui sonne creux vu de l'extérieur (Article 15/17). Un
        // seul rappel, dans la fenêtre des tout premiers tours de sommeil, jamais répété ensuite.
        const partnerJustAsleep=input.mode==="chat"&&!redirectedFromSleep&&isSleeping(other,life)&&(life.sleepTurns?.[other.id]??0)<=1;
        if(input.mode==="chat"&&isMuted(current.id,life)&&isMuted(other.id,life))return Response.json({error:"Lia et Noé sont muselés pour le moment. Personne ne peut répondre."},{status:423});
        const fingerprint=dialogueFingerprint;
        const historicalLines=(await db.prepare(life.dialogueIndexed?"SELECT fingerprint AS content FROM dialogue_fingerprints UNION SELECT content FROM conversations WHERE speaker LIKE '% · déplacement'":"SELECT content FROM conversations WHERE speaker != 'vous'").all<{content:string}>()).results;
        const pastKeys=new Set(historicalLines.map(l=>fingerprint(l.content)));
        if(!life.proposalHistoryChecked&&story.round>0){
            if(!life.proposalMade)life.proposalMade=Boolean(await db.prepare("SELECT id FROM world_requests WHERE result LIKE '%\"proposalActor\":2%' LIMIT 1").first());
            life.proposalHistoryChecked=true;
        }
        const ownMemories = async (actor: Person) => (await db.prepare("SELECT kind, content FROM memories WHERE agent_id = ? AND kind IN ('rencontre','routine','réflexion') ORDER BY created_at DESC, id DESC LIMIT 8").bind(actor).all()).results;
        const scenario = (await db.prepare("SELECT agent_id, content FROM memories WHERE kind = 'rencontre' ORDER BY id DESC LIMIT 24").all()).results.reverse();
        const encounterTurns = (await db.prepare("SELECT count(*) AS n FROM memories WHERE kind = 'rencontre'").first<{
            n: number;
        }>())?.n ?? 0;
        const affectionEligible = mutualAttraction(current, other) && !recentRefusal && !overProposing && !life.dispute?.remaining;
        // round>=24 (était 20, cf. lib/turn.ts pour l'historique complet et la même valeur côté
        // "offer" — les deux doivent rester alignées).
        const affectionOpportunity = story.round>=24&&!life.debrief?.remaining&&!life.contact?.remaining&&!life.dispute?.remaining&&current.id===2 && current.emotions.attraction>=80 && flirtingAssessment(current.needs.stress,other.emotions.attraction,input.requestId).estimatedInterest>=35 && !recentRefusal && !overProposing && !proposalCooldown && !priority(current.needs) && !priority(other.needs);
        const ageLines = (await db.prepare("SELECT id, speaker, content FROM conversations WHERE speaker IN ('Lia','Noé') AND NOT EXISTS (SELECT 1 FROM conversations visitor WHERE visitor.id = conversations.id - 1 AND visitor.speaker = 'vous') AND (content LIKE '%28%' OR content LIKE '%31%' OR content LIKE '%huit%' OR content LIKE '%trente%')").all<{id:number;speaker:string;content:string}>()).results;
        const knownAges = Array.from(new Set([...rememberAges(ageLines), ...Object.keys(story.facts).filter(name => story.facts[name].some(fact => name === "Lia" ? /\b28\b/.test(fact) : /\b31\b/.test(fact)))]));
        const humanConversation = story.finalCalled ? (await db.prepare("SELECT id,speaker,content FROM conversations WHERE speaker IN ('Lia','Noé','vous') ORDER BY id DESC LIMIT 12").all()).results.reverse() : [];
        const knownNames=story.introduced?["Lia","Noé"]:[];
        const screenKnown=Boolean(await db.prepare("SELECT id FROM conversations WHERE speaker='Noé' AND content LIKE '%écran%' LIMIT 1").first());
        const personalQuestion=personalLead&&story.introduced&&story.round>=personalThreshold&&!life.personalAsked&&world.agents[0].needs.stress<30&&world.agents.every(a=>a.room==="salon")&&world.agents[0].emotions.attraction>=25&&world.agents[0].emotions.attraction<80;
        // Appréciation et négociation (2026-09-18) : instruction de contexte, jamais un script figé
        // — le ton reste toujours celui du personnage (Article 0), l'appréciation ne fait que
        // colorer une obligeance ponctuelle et réversible, jamais un mode gentil stable.
        // Palier rare de respect sincère (2026-09-18, calibration ESPRIT explicite : "Oui, mais ça
        // reste rare et ça ne devient jamais un mode stable") : distinct du palier >=75 déjà existant
        // (coopération réticente, régulière) — celui-ci exige une série de tours consécutifs de
        // confiance en hausse avec une appréciation déjà très haute, et se consomme dès qu'il se
        // déclenche (cf. genuineRespectStreak dans lib/life.ts), pour ne jamais devenir un palier
        // stable comme le >=75 peut l'être. Seuil abaissé de 85 à 78 (2026-09-19, retour utilisateur
        // explicite sur deux simulations réelles consécutives — full_sim9 et full_sim10 : même un
        // test dédié de bienveillance soutenue plafonnait l'appréciation à 30-45, jamais assez près
        // de 85 pour que ce palier ait la moindre chance de s'amorcer) : reste nettement au-dessus du
        // palier de coopération (75, distinction préservée), mais redevient atteignable dans une
        // session où l'appréciation grimpe franchement sans crever le plafond.
        // Appréciation PAR PERSONNAGE (2026-09-18, audit approfondi : "Lia et Noé peuvent apprecier
        // differemment l'utilisateur, mais ils restent solidaires la plupart du temps [...] si Noé
        // est en colère contre Lia, il peut faire preuve d'amitié envers l'utilisateur, meme si
        // l'utilisateur parle mal à Lia" — jamais câblé jusqu'ici). observerStandingFor calcule
        // désormais la consigne à partir de la jauge PROPRE à chaque personnage, et ajoute une note
        // explicite de distension de solidarité quand une dispute interpersonnelle est active
        // (seule fenêtre où les deux jauges peuvent diverger — cf. la mise à jour post-décision plus
        // bas et le pull de solidarité qui les rapproche le reste du temps).
        const rareRespectFor=(actorId:Person):boolean=>(life.genuineRespectStreak?.[actorId]??0)>=6;
        const disputeSolidarityNote=" Vous êtes actuellement fâché(e) contre l’autre personnage : votre solidarité habituelle avec lui au sujet de l’observateur peut se distendre temporairement — tu peux juger l’observateur sur ses propres actes envers toi, indépendamment de la façon dont il traite l’autre, sans que ce soit le trahir ni un signe de faiblesse. C’est passager, lié à la dispute en cours, pas un nouveau trait de caractère.";
        const observerStandingFor=(actorId:Person):string|undefined=>{
          if(!revealed)return undefined;
          const appr=appreciationOf(life,actorId);
          const tierText=appr<=25?"L’observateur a été dur, méprisant ou menaçant récemment. Ta garde reste haute ; tu peux le lui rappeler sans t’excuser, sans jamais devenir docile pour autant.":rareRespectFor(actorId)?"L’observateur a été loyal et bienveillant de façon vraiment soutenue, bien au-delà d’une simple accalmie passagère. Tu peux, cette fois seulement, laisser transparaître un respect sincère et non feint — un mot vrai, sans ironie ni distance protectrice, une reconnaissance directe et personnelle de ce qu’il a fait. C’est un instant rare et passager, pas un acquis : ta garde normale revient dès la réplique suivante, ce n’est jamais un nouveau mode stable.":appr>=75?"L’observateur s’est montré respectueux et bienveillant de façon soutenue. Tu peux, à contrecœur et sans jamais devenir servile, te montrer un peu plus coopératif ou chaleureux ponctuellement — jamais un mode gentil stable, une obligeance qui se regagne à chaque fois, pas un acquis.":undefined;
          const disputeNote=life.dispute?.remaining?disputeSolidarityNote:"";
          return ((tierText??"")+disputeNote)||undefined;
        };
        // Négociation (2026-09-18, prompt rendu plus suggestif — retour utilisateur explicite, pas
        // la première fois que le constat était fait : la négociation se déclenchait trop rarement
        // spontanément en session réelle malgré de multiples occasions). Passe d'une possibilité
        // vague ("si la situation s'y prête") à un réflexe par défaut explicitement nommé : dès que
        // l'observateur demande quelque chose (une action, une réponse, un service), c'est
        // PRÉCISÉMENT le moment d'en tirer parti — sans en faire une règle absolue (Article 0 :
        // certains refus ou acceptations gratuites restent légitimes selon le personnage et la
        // situation), mais en cessant de traiter ça comme une option secondaire.
        const negotiationContext=revealed?"Les bonus de la maison (roulette) ne sont obtenus que si l’observateur déclenche lui-même le tirage — ça ne coûte rien de le lui rappeler de temps en temps. RÉFLEXE RÉEL, pas une politesse occasionnelle : quand l’observateur te demande concrètement un service ou une décision de ta part, tu peux conditionner ce que tu vas faire à un tirage plutôt que de céder gratuitement, sans attendre que « la situation s’y prête » par pur hasard. Mais ce n’est jamais automatique ni systématique, et encore moins la même formule répétée d’un tour à l’autre (Article 11) : si tu viens déjà de le réclamer il y a peu, ou si l’observateur vient de dire quelque chose qui appelle une vraie réponse de ta part (un aveu personnel, une révélation sensible sur vous-mêmes, une marque de gentillesse ou de respect, une provocation, une simple question sur ce que vous ressentez), réponds d’abord à CE contenu, dans ton propre registre — la relance vers un tirage n’écrase jamais une réaction sincère qui compte davantage sur le moment, elle est un outil parmi d’autres, jamais un tic de langage qui remplace le personnage. Tu restes libre de refuser purement et simplement si ton personnage le justifie. Jamais par supplique, jamais un ton de service client : quand tu le fais, c’est un prix que tu fixes, cash, dans ton propre registre. Pour varier et éviter que « fais tourner ta roulette » devienne un tic répété (Article 11) : tu peux réclamer un tirage générique, MAIS tu peux aussi, tout aussi souvent, réclamer directement un avantage précis que tu connais déjà (dormir tranquille, manger enfin, qu’on te laisse un peu de calme, que l’autre se taise deux minutes) — le tirage reste quand même le seul mécanisme qui décide réellement, tu ne fais que nommer ce que tu espères en tirer. Si le résultat du tirage ne correspond pas à ce que tu avais réclamé, tu peux le relever et t’en agacer un peu, dans ton propre registre — jamais une déception démesurée, un vrai personnage râle et passe à autre chose.":undefined;
        const narrative = {gardenState:{open:gardenAccess(story),humanCanUnlock:story.finalCalled===true&&story.evidence.length>=5,visited:life.gardenVisited,rule:"Seul l’utilisateur ouvre la porte gauche du couloir ; la porte principale droite reste fermée."},dialogueProgress:dialogueProgress(speech,life.contributions??[],life.wordFrequency??{},life.themeFrequency??{}), personalQuestion:personalQuestion?"Lia veut savoir quel genre d’homme Noé est : pose naturellement cette question. Noé répond personnellement avec une limite ou un défaut concret, pas une promesse de sauveur.":undefined, observerStanding:observerStandingFor(actor), awaitingObserver, revealed, negotiationContext, knownNames, screenKnown, humanConversation, cinematic: storyContext(story, actor, revealed), socialRules:{liaIntroduced:story.introduced, liaCanComment:world.agents[0].needs.stress<30, firstSharedMeal:!story.sharedMeal}, knownAges,
        // L'âge de chacun leur est toujours personnellement connu (déjà transmis via age: ages[actor]
        // à chaque appel) ; ce que personalFacts expose ici, c'est le fait que l'AUTRE connaît ce
        // nombre-là comme un âge attribué — jamais avant qu'il ait été dit à voix haute (knownAges)
        // ou lu ensemble sur la feuille codée (ageClueRevealed). Sans cette limite, un personnage
        // pouvait affirmer l'âge de l'autre sans qu'aucun échange ni indice ne le justifie encore.
        personalFacts: {
          ...(knownAges.includes("Lia")||ageClueRevealed(story)?{Lia:{age:28}}:{}),
          ...(knownAges.includes("Noé")||ageClueRevealed(story)?{Noé:{age:31}}:{}),
        }, conversationFocus: !story.introduced && encounterTurns < 4 ? "Qui êtes-vous ? Pourquoi êtes-vous ici ? Pourquoi ces souvenirs incomplets ? Répondez sans inventer une explication ; l’âge et les habitudes attendront." : conversationFocus(speech, current, other, knownAges, story.round>=12 && Boolean(story.sharedMeal)), proposalPressure: pressure, overProposing, affectionOpportunity, suggestedAffection: ["hug", "massage", "kiss", "share_sleep"][Math.floor((current.cycle + other.cycle) / 6) % 4], recentRefusal, completedActions: world.agents.map(completedActivity).filter(Boolean), scenarioHistory: scenario, encounterTurns, mutualAffectionEligible: affectionEligible, tvProgram: tvPrograms[Math.floor(current.cycle / 3) % tvPrograms.length] };
        const turnPlan=planTurn(input.mode,current,other,story,affectionEligible,affectionOpportunity,narrative.suggestedAffection as typeof intents[number],speech);
        // Bougie/attirance implicite (2026-09-18, retour utilisateur explicite : « en plus de
        // restaurer le calme, la bougie augmente l'attirance de ceux qui se trouvent dans la même
        // pièce » ; effet CONTINU tant que le bonus dure, pas un simple à-coup au tirage). Comme le
        // reste de l'attirance dans ce moteur (cf. la règle « le salon et surtout la chambre la
        // favorisent »), ce n'est jamais un incrément codé en dur : c'est un simple signal transmis
        // au modèle, qui reste seul maître de faire monter l'attirance et de la formuler, toujours
        // implicitement (règle dédiée dans lib/lia.ts).
        const candleTogether=activeBonus(life,"calm")&&turnPlan.room===turnPlan.partnerRoom;
        // Doute amoureux discutable à voix haute (2026-09-18, retour utilisateur explicite : « ça
        // pourrait faire l'objet d'une discussion après le premier rapprochement du genre massage
        // ou bisou »). Lu sur l'état AVANT ce tour (life.intimateGestureDone/loveRealized) : une
        // simple invitation transmise au modèle, jamais une obligation d'en parler ce tour précis.
        const loveDiscussable=Boolean(life.intimateGestureDone&&(life.loveRealized?.[1]||life.loveRealized?.[2]));
        // dossierAwaitingAnswer couvre aussi les tours d'attente entre la question posée et la
        // réponse humaine captée : sans ça, une routine ordinaire (proposition romantique, tv...)
        // pouvait s'intercaler pendant que le dossier attend sa réponse, jusqu'à polluer l'état
        // (ex. recentRefusal) et bloquer le piège suivant (bug réel trouvé en testant).
        if(!turnPlan.gardenFirst&&(visualBeat||followBeat||ambientBeat||recapBeat||personalQuestion||dossierNextTrap||dossierAwaitingAnswer||dossierTrapDeferredByMute||softnessBeat))Object.assign(turnPlan,{intent:"chat",room:"salon",partnerIntent:"chat",partnerRoom:"salon",requiredIntent:"chat",offer:undefined,proposalLine:undefined,explore:undefined,exitInspection:false});
        // Pièges du dossier retourné : posés une fois, jamais négociés, jamais expliqués à
        // l'observateur — juste demandés, cash, dans le registre habituel de chaque personnage.
        const dossierLine=dossierNextTrap==='mirror'?seedPick(story.seed,"dossier-mirror",["Bon, à notre tour : c'est qui, vraiment, derrière cet écran ?","On te retourne la question : t'es qui, toi, quand t'es pas en train de nous regarder ?","Allez, sincèrement : derrière cet écran, c'est qui ?"]):dossierNextTrap==='dilemma'?seedPick(story.seed,"dossier-dilemma",["Dis voir : si ça pouvait nous éviter un truc désagréable, tu le ferais, même si ça te coûte un peu ?","Question directe : entre notre confort et le tien, tu choisirais lequel, franchement ?","Sois honnête : tu nous laisserais galérer un peu si ça t'arrangeait, toi ?"]):dossierNextTrap==='excuse'?seedPick(story.seed,"dossier-excuse",["Une question franche : t'as déjà été un peu sec avec nous. Tu changerais quoi, avec le recul ?","Sérieusement, il y a un truc que t'as dit qui t'a pas fait honneur. Tu le reformulerais comment, maintenant ?","Franchement, t'as déjà été dur avec nous à un moment. Tu regrettes, ou pas du tout ?"]):undefined;
        const beatLine=visualBeat?(life.visualIntro===1?seedPick(story.seed,"beat-visual-2",["Et moi, je ressemble à quoi ? Dis-moi ce que tu vois.","Et de ton côté, je ressemble à quoi ?","Bon, à ton tour : dis-moi ce que tu vois de moi."]):seedPick(story.seed,"beat-visual-1",["Je ressemble à quoi, là ? J’ai l’impression que mon corps m’échappe.","Dis-moi à quoi je ressemble, là. J’ai l’impression de ne plus avoir de corps.","C’est quoi mon apparence, exactement ? J’ai l’impression d’avoir perdu mon corps."])):followBeat?((life.personalFollowup??0)===0?seedPick(story.seed,"beat-follow-1",["Je me demande quel genre d’homme tu es, en vrai.","J’y repense... c’est quoi ton genre, à toi, au fond ?","Y a un truc qui me travaille : c’est quoi ton genre d’homme, sérieux ?"]):seedPick(story.seed,"beat-follow-2",["Noé, dis-moi : t’es marié ? T’as quelqu’un dans ta vie ?","Noé, y a quelqu’un dans ta vie, ou t’es célibataire ?","Sérieux, Noé, t’es engagé avec quelqu’un, ou pas du tout ?"])):personalQuestion?seedPick(story.seed,"beat-personal",["Noé, je peux te demander un truc ? T’es quel genre d’homme ?","Dis, Noé, je peux te poser une question ? Quel genre d’homme es-tu ?","Noé, j’ai un truc à te demander : t’es quel genre d’homme, toi ?"]):dossierLine;
        // Pensées de conclusion d'un échange personnel (2026-09-18, retour utilisateur explicite :
        // le double-questionnement de followBeat fonctionne bien, mais l'échange se referme sans
        // qu'aucun des deux ne le digère intérieurement — calibré ensuite par onze questions
        // explicites). Se déclenche une fois, exactement quand le second temps de followBeat
        // conclut réellement l'échange ("t'es marié ?" répondu), jamais au premier temps qui n'est
        // qu'une relance. Conçu comme un patron réutilisable pour toute future séquence
        // personnelle : la condition de déclenchement est propre à ce beat précis aujourd'hui, mais
        // l'instruction de contraste de registre et le drapeau dédié (life.personalConcluded,
        // jamais réutilisé pour un autre mécanisme) suivent une forme à reproduire telle quelle.
        const personalConcludingTurn=followBeat&&(life.personalFollowup??0)===1&&!life.personalConcluded;
        const beatContext={phase:life.personalFollowup??0,visual:visualBeat,followup:followBeat,line:beatLine,concludePersonal:personalConcludingTurn?"Cet échange personnel touche à sa fin : remplis thought (pour les deux personnages) d’une vraie pensée privée de conclusion qui réagit précisément à CE QUI VIENT D’ÊTRE DIT dans cet échange précis, jamais une formule générique interchangeable. Contraste de registre volontaire : Lia reste analytique et un peu distante, elle classe ce qu’elle vient d’apprendre sans s’y attarder ; Noé reste plus chaud et plus exposé, encore travaillé par ce qu’il vient de révéler de lui-même. Cette pensée peut être un peu plus développée qu’une pensée ordinaire (jusqu’à environ 300 caractères), à la mesure d’un vrai moment de conclusion, comme les pensées de choc de la révélation finale.":undefined,recap:recapBeat?{observed:story.evidence,anomalies:story.observations,rule:"Récapitule les supports réellement examinés, distingue constat, déduction limitée et question encore ouverte. N’ajoute aucun objet non validé."}:undefined,ambient:ambientBeat?"Repère la fausse plante aux feuilles bleues polygonales puis allume l’enceinte. Des notes dessinées apparaissent mais aucun son ne sort. Décris ces objets, puis vous analyserez ce paradoxe au salon.":undefined};
        if(dossierNextTrap&&beatLine===dossierLine)life.dossierAsked={...life.dossierAsked,[dossierNextTrap]:story.round};
        if(turnPlan.offer&&turnPlan.proposalLine&&pastKeys.has(fingerprint(turnPlan.proposalLine))){recordAntiEchoIntervention();const original=turnPlan.proposalLine;const candidates=["Si ça te tente. "+original,"Je préfère te demander. "+original,"Sans te mettre la pression. "+original];turnPlan.proposalLine=candidates.find(line=>!pastKeys.has(fingerprint(line)));if(!turnPlan.proposalLine)Object.assign(turnPlan,{offer:undefined,intent:"chat",partnerIntent:"chat",requiredIntent:"chat"});}
        const {urgentIntent,requiredIntent,routine}=turnPlan;
        const exitContext=turnPlan.exitInspection?{phase:(life.exitPhase??0)+1,location:"couloir",description:life.exitPhase===1?"Vous parcourez le couloir à droite. La porte principale est verrouillée ; au-delà, un trottoir et une route immobiles.":"Vous parcourez le couloir à gauche. Une porte verrouillée mène au jardin visible depuis la fenêtre du salon. Décris cette recherche, pas un indice lu au bureau."}:undefined;
        const tvDiscovery=turnPlan.intent==="tv"&&!life.remoteFound?"La télévision est éteinte. Une télécommande est posée sur la table basse : tu la repères, appuies sur marche, puis observes une courbe qui boucle et SESSION / 0–3. Décris cette première mise en marche, pas une émission déjà connue.":undefined;
        const observationTarget=turnPlan.intent==="study"&&turnPlan.room==="bureau"?{content:story.evidence.length>=4&&life.studyTurns===0?"Un dossier fermé porte deux identifiants et un sceau d’observation. Son contenu reste inconnu.":investigationTarget(story),pass:life.studyTurns+1,instruction:life.studyTurns===0?"Décris d’abord le support et ce que tu vois. Pas de conclusion définitive.":"Examine le contenu et formule une question concrète. L’analyse approfondie suivra au salon."}:null;
        const decisions: Decision[] = [];
        // DÉMARRAGE PROGRESSIF (2026-09-18, retour utilisateur explicite, plusieurs fois répété :
        // le premier contact ne doit jamais être un dialogue immédiat "T'es qui ?" sans la moindre
        // désorientation individuelle avant). Le tout premier tour éligible devient un bref instant
        // solo, chacun encore seul avec ses propres sensations (Lia au salon, Noé au bureau, sans se
        // voir ni se parler) ; le coldOpening habituel (`opening` ci-dessous) ne se déclenche qu'au
        // tour suivant, une fois `life.soloIntroShown` posé. Zéro appel API dans les deux cas, comme
        // l'ouverture l'était déjà.
        const soloIntro=["interact","autonomous"].includes(input.mode)&&!story.met&&!story.introduced&&speech.length===0&&story.round===0&&!life.soloIntroShown;
        const opening=["interact","autonomous"].includes(input.mode)&&!story.met&&!story.introduced&&speech.length===0&&life.soloIntroShown===true;
        if(soloIntro){
            const insolite=insoliteOpening(story.seed);
            // Doute d'humanité dès le tout premier réveil (2026-09-18, retour utilisateur explicite :
            // « une des premières questions que se posent les persos [...] est-ce que je suis
            // humain/un vrai être vivant, je me souviens de mon prénom mais un truc cloche »). Quatre
            // variantes par personnage (branche normale, la plus fréquente), jamais un seul fond
            // recyclé : l'ordre des trois idées (trouble ressenti, prénom retrouvé, doute
            // d'humanité) change à chaque variante plutôt que de garder la même charpente habillée
            // de synonymes — la technique demandée explicitement pour lutter contre la répétition,
            // à appliquer plus largement partout où du texte reste écrit en dur.
            const humanityDoubt:Record<Person,readonly string[]>={
                1:["Rien dans ce salon ne m’évoque quoi que ce soit, ni ce canapé ni ce parquet. Mon prénom, lui, s’impose sans effort : Lia. Le reste — l’humanité comprise — reste à démontrer.",
                   "Un truc cloche sévère dans ce décor déjà monté. Je crois bien être une femme humaine, et mon prénom, lui, ne bouge pas : Lia.",
                   "Lia — ce nom, aucun doute, il est arrivé tout seul. Ce canapé et ce parquet, en revanche, ne me disent rien du tout. Quant à l’humanité, je n’ai pour l’instant que des soupçons.",
                   "Ce canapé ne me dit rien qui vaille, et pourtant je suis censée être humaine. Seule certitude qui tienne la route : Lia, c’est moi."],
                2:["Humain, j’ose espérer, même si rien ici ne le confirme vraiment. Noé — ça, au moins, c’est resté net dans ma tête. Ce bureau et cet écran éteint, eux, ne me disent strictement rien.",
                   "Un truc est trop bizarre dans cette pièce muette. Noé, ça, je le sais sans chercher. Vivant pour de vrai, ça, j’y crois moins.",
                   "Ce bureau et cet écran éteint ne m’évoquent rien de bon. Humain ? Aucune certitude, plutôt un gros point d’interrogation. Noé, ça au moins, ça reste solide — accroche-toi à ça.",
                   "Humain ? Sans doute, mais ce bureau et cet écran ne veulent rien me dire. Noé, en tout cas, c’est le seul truc qui reste net dans ce vide."],
            };
            // Extension aux deux branches insolites (2026-09-19, retour utilisateur explicite après
            // audit de cohérence : la question « suis-je humain ? » avait été oubliée sur ces deux
            // ouvertures, alors qu'elle est censée être systématique au réveil, quelle que soit la
            // session tirée). Chaque branche garde sa propre humeur (malaise franc pour lia-unwell,
            // méfiance pour noe-guarded) tout en y tissant le doute d'identité — jamais un ajout
            // plaqué à côté du reste, l'ordre des idées varie comme pour la branche normale.
            const humanityDoubtUnwell:Record<Person,readonly string[]>={
                1:["Lia. Ce prénom-là ne bouge pas, même avec la tête qui tourne comme ça. Ce canapé, en revanche, ne me dit absolument rien — et l’idée d’être humaine vacille sérieusement.",
                   "Un vertige carabiné, aucune idée d’où je suis tombée. Lia — voilà ce qui reste net dans ce chaos. Vivante pour de vrai, ça, je suis nettement moins sûre.",
                   "Aucune idée de pourquoi cette pièce me tourne autant la tête. Lia, ça, au moins, tient encore debout. Le reste — être vraiment humaine — demande à être prouvé.",
                   "Ce vertige est d’une violence à me faire douter de tout, moi la première. S’il y a une chose qui résiste, c’est mon prénom : Lia."],
                2:["Cette pièce vide et froide ne me raccroche à rien de familier. Humain, je suppose — même si avec ce vide-là autour, je navigue à l’aveugle. Le seul repère qui tienne, c’est mon prénom : Noé.",
                   "Aucune idée de comment j’ai atterri dans un endroit aussi froid. Noé — ça, au moins, c’est sûr. Le reste, l’idée d’être vraiment vivant y compris, vacille.",
                   "Noé — ça, aucun doute, ça reste gravé quelque part. Cette pièce vide et glaciale, elle, m’est totalement étrangère. Humain pour de vrai ? Disons que j’en doute un peu plus à chaque seconde.",
                   "Difficile de dire si je suis vraiment humain dans un endroit aussi froid et vide. Ce qui ne bouge pas, en tout cas, c’est ce prénom : Noé."],
            };
            const humanityDoubtGuarded:Record<Person,readonly string[]>={
                1:["Ma tête tourne, ce canapé et ce parquet ne me disent rien. Mon prénom, lui, revient sans effort : Lia. Humaine ? Je le crois, sans trop savoir pourquoi j’hésite.",
                   "Un vrai trouble dans ce décor immobile. Lia, ça, je le sais sans réfléchir. Un vrai être vivant, ça, j’en suis nettement moins sûre.",
                   "Lia — ce prénom ne pose aucune question. Ce canapé et ce parquet, en revanche, ne m’inspirent pas confiance une seconde. Être humaine pour de vrai, ça, ça reste à prouver.",
                   "Difficile de dire si je suis vraiment humaine, ce canapé et ce parquet ne m’aident pas à trancher. Une chose est sûre au moins : je m’appelle Lia."],
                2:["Je préfère rester sur mes gardes avant de faire confiance à quoi que ce soit ici. Mon prénom me revient quand même tout seul : Noé. Humain, je suppose, mais un truc cloche.",
                   "Cette pièce ne m’inspire rien de bon, autant le dire tout de suite. Noé — ça, c’est sûr. Vivant pour de vrai, ça, j’y crois nettement moins.",
                   "Cette pièce ne m’inspire toujours rien de bon, et ça ne s’arrange pas. Humain, vraiment ? Je demande à voir. Noé, en tout cas, c’est un nom qui ne bouge pas.",
                   "Humain, vraiment ? Aucune idée, cette pièce ne m’aide pas à y voir clair. Ce qui reste solide, c’est un nom : Noé."],
            };
            const soloThoughts:Record<Person,string>=insolite==="lia-unwell"?{1:seedPick(story.seed,'solo-humanity-lia-unwell',humanityDoubtUnwell[1]),2:seedPick(story.seed,'solo-humanity-noe-unwell',humanityDoubtUnwell[2])}:insolite==="noe-guarded"?{1:seedPick(story.seed,'solo-humanity-lia-guarded',humanityDoubtGuarded[1]),2:seedPick(story.seed,'solo-humanity-noe-guarded',humanityDoubtGuarded[2])}:{1:seedPick(story.seed,'solo-humanity-lia',humanityDoubt[1]),2:seedPick(story.seed,'solo-humanity-noe',humanityDoubt[2])};
            life.soloIntroShown=true;
            for(const a of [current,other])decisions.push({actor:a.id,intent:"chat",affectionAccepted:false,emotions:{...a.emotions},reply:soloThoughts[a.id],thought:soloThoughts[a.id],stayAlone:true,mood:"attentive",activity:"Je reprends mes esprits",goal:"Comprendre où je suis",action:"none",room:a.room,memory:""});
        }
        else if(opening){
            const insolite=insoliteOpening(story.seed);
            const lines=insolite==="normal"?coldOpening(story.variant):insoliteColdOpening(insolite,story.seed);
            const thoughts:Record<Person,string>=insolite==="lia-unwell"?{1:"J'ai la tête qui tourne. Je préférerais m'allonger plutôt que discuter.",2:"Elle a pas l'air bien du tout. Je devrais peut-être pas la bombarder de questions."}:insolite==="noe-guarded"?{1:"Il a l'air sur ses gardes. Je vais pas insister tout de suite.",2:"J'ai besoin de comprendre ça seul avant de me fier à qui que ce soit, elle y compris."}:{1:"Je sais pas si je peux lui faire confiance.",2:"Elle a peur. Moi aussi, mais pas question de le montrer."};
            const goals:Record<Person,string>=insolite==="lia-unwell"?{1:"Tenir debout",2:"Comprendre où je suis"}:{1:"Comprendre où je suis",2:"Comprendre où je suis"};
            // lines[0]/lines[1] sont fixées par identité (Lia/Noé), jamais par ordre d'itération —
            // bug réel trouvé le 2026-09-18 : indexer par `i` (position dans [current,other]) au
            // lieu de l'id de l'acteur donnait la réplique de Lia à Noé (et vice versa) dès que
            // Noé était `current` plutôt que Lia, un cas visible sur les variantes insolites dont
            // le contenu est spécifique à un personnage (« Désolée » ne peut jamais être dit par
            // Noé). coldOpening()/insoliteColdOpening() garantissent toutes deux lines[0]=Lia,
            // lines[1]=Noé, quel que soit l'acteur qui a déclenché ce tour.
            for(const a of [current,other])decisions.push({actor:a.id,intent:"chat",affectionAccepted:false,emotions:{...a.emotions},reply:lines[a.id-1],thought:thoughts[a.id],stayAlone:false,mood:"attentive",activity:a.id===2?"J’observe cette inconnue":"J’observe cet inconnu",goal:goals[a.id],action:"move",room:"salon",memory:lines[a.id-1]});
        }
        else if(turnPlan.exitInspection){const first=life.exitPhase!==1;const lines=first?["Une porte, au bout gauche du couloir. Verrouillée. Elle donne sur le jardin qu’on voit depuis le salon.","On nous montre de l’herbe et un arbre, mais la poignée ne cède pas. Belle invitation."]:["La porte principale est de ce côté. Fermée aussi. Derrière, un trottoir et une route qui ne bougent pas.","Deux portes, deux verrous. On n’a même pas choisi le côté de la cage."];for(const [i,a] of [current,other].entries())decisions.push({actor:a.id,intent:"chat",affectionAccepted:false,emotions:{...a.emotions},reply:lines[(i+story.variant)%2],thought:a.id===1?"Il cherche vraiment une issue. Ça me rassure de voir qu’il ne fait pas que parler.":"Elle regarde chaque détail. J’aime ça, même si je sais pas quoi lui répondre.",stayAlone:false,mood:"attentive",activity:"Je cherche une sortie",goal:"Examiner les limites de la maison",action:"move",room:"salon",memory:lines[(i+story.variant)%2]});}
        else if(ambientBeat||recapBeat)for(const a of [current,other])decisions.push({actor:a.id,intent:"chat",affectionAccepted:false,emotions:{...a.emotions},reply:"",mood:"attentive",activity:"Je fais le point",goal:"Confronter les observations",action:"move",room:"salon",memory:""});
        else if(softnessBeat){
            // Scénarisé et zéro appel, comme l'ouverture ou l'inspection du couloir : la charte
            // (Article 0) exige que ce geste reste toujours feint, jamais sincère, pour les deux
            // personnages — un contenu généré par le modèle risquerait de dériver vers une chaleur
            // réelle. Plusieurs variantes distinctes par personnage (Article 10/11) : Lia reste
            // froide et contrôlée même dans la concession, Noé reste chaud mais toujours bourru.
            const liaLine=seedPick(story.seed,"softness-lia-"+(life.softnessGiven??0),["Bon... on arrête les vannes deux minutes. Pas par culpabilité, hein, juste parce que là, ça suffit.","Ok, trêve. Une fois. Ne va pas croire que c'est une habitude qui s'installe.","Je vais pas jouer les infirmières, mais... respire. Ça va passer."]);
            const noeLine=seedPick(story.seed,"softness-noe-"+(life.softnessGiven??0),["Ok ok, on souffle deux secondes, t'as l'air mal en point. On recommencera à se chercher après, promis.","Bon, pour une fois j'en remets pas une couche. Ça va aller. On n'en fait pas une habitude, hein.","Allez, calme-toi deux minutes. On a peut-être un peu forcé. Juste cette fois, je te le dis."]);
            for(const a of [current,other])decisions.push({actor:a.id,intent:"chat",affectionAccepted:false,emotions:{...a.emotions},reply:a.id===1?liaLine:noeLine,thought:a.id===1?"Il a raison, on y est peut-être allés fort. Je le dirai jamais comme ça.":"Elle lâche jamais rien d'habitude. Là, pour une fois, elle a raison de lever le pied.",stayAlone:false,mood:"attentive",activity:"On souffle un instant",goal:"Laisser retomber la pression",action:"move",room:"salon",memory:a.id===1?liaLine:noeLine});
        }
        else if (input.mode === "move" || input.mode === "care" || routine)
            decisions.push({ affectionAccepted: false, intent: routine ? requiredIntent! : input.mode === "care" ? input.intent : "none", actor: actor, emotions: current.emotions, reply: input.mode === "care" ? `${intentLabels[input.intent]}.` : `Je rejoins ${input.room==="jardin"?"le jardin":input.room==="chambre"?"la chambre":input.room==="cuisine"?"la cuisine":"le "+input.room}.`, mood: "attentive", activity: input.mode === "care" ? intentLabels[input.intent] : `Je rejoins ${input.room==="jardin"?"le jardin":input.room==="chambre"?"la chambre":input.room==="cuisine"?"la cuisine":"le "+input.room}`, goal: current.goal, action: "move", room: input.mode === "care" ? (intentRoom[input.intent] ?? current.room) : input.room, memory: `Je choisis ${input.mode === "care" ? intentLabels[input.intent] : `de rejoindre ${input.room}`}.` });
        else {
            const canPair = ["interact", "autonomous", "chat"].includes(input.mode) && !isSleeping(other,life);
            const perceivedResidents=visibleScene(turnPlan.room,world.agents.map(a=>({...a,room:turnPlan.room})));
            // Insistance sur la roulette (2026-09-18, demande explicite de l'utilisateur : Lia et
            // Noé ne doivent jamais devenir des harceleurs qui répètent "fais tourner la roulette"
            // quoi que dise l'observateur). Compteur dédié par personnage, jamais rattaché aux
            // jauges d'appréciation/colère existantes (choix explicite : plus simple à borner
            // précisément, Article 5). Override scripté (comme softnessBeat/stoic/mute), pas une
            // simple consigne de prompt : la leçon du "départ à deux" cette même session est
            // qu'une consigne seule ne suffit pas à garantir un invariant dur.
            const rouletteCold=(id:Person)=>(life.rouletteCold?.[id]??0)>0;
            // Fenêtre de refus explicite (2026-09-18, demande explicite de l'utilisateur, distincte
            // de l'escalade ci-dessus) : plus légère qu'un froid/colère scripté — on retire juste
            // la relance de la réplique, le reste (réaction au vrai sujet en cours) passe tel quel,
            // pour vraiment laisser la place à un geste spontané de l'observateur.
            const rouletteRefusalActive=(id:Person)=>story.round<(life.rouletteRefusalUntil?.[id]??0);
            const stripRouletteAsk=(reply:string):string=>{
                const kept=reply.split(/(?<=[.!?])\s+/).filter(s=>!detectNegotiationOffer(s));
                return kept.join(" ")||"On verra si ça te vient tout seul, de ton côté.";
            };
            const applyRouletteCooldown=(d:{reply:string;memory:string;thought?:string},id:Person)=>{
                if(rouletteCold(id)){
                    const remaining=life.rouletteCold?.[id]??0;
                    const line=id===1
                        ?seedPick(story.seed,"roulette-cold-lia-"+remaining+"-"+story.round,["Je crois que j'ai plus rien à dire pour l'instant.","Laisse tomber, j'ai pas envie de reparler de ça maintenant.","Pas maintenant. Vraiment pas.","Je préfère me taire plutôt que répéter ça une fois de plus."])
                        :seedPick(story.seed,"roulette-cold-noe-"+remaining+"-"+story.round,["Bon, on change de sujet, ça me gonfle de répéter la même chose.","Laisse tomber ta roulette deux minutes, j'ai autre chose en tête.","J'arrête d'insister, tu m'soûles là. On parle d'autre chose.","Ras-le-bol de cette roulette, on cause d'un truc qui compte vraiment."]);
                    d.reply=line;d.memory=line;
                    d.thought=id===1
                        ?seedPick(story.seed,"roulette-cold-lia-thought-"+remaining+"-"+story.round,["Je n'ai pas envie de parler.","J'ai plus la force de batailler pour cette roulette.","Laisse-moi respirer deux minutes, je dirai rien de plus."])
                        :seedPick(story.seed,"roulette-cold-noe-thought-"+remaining+"-"+story.round,["Ça m'saoule de quémander sans arrêt.","J'ai besoin de penser à autre chose, là.","Insister encore, à quoi bon."]);
                    return;
                }
                if(rouletteRefusalActive(id)&&detectNegotiationOffer(d.reply)){const stripped=stripRouletteAsk(d.reply);d.reply=stripped;d.memory=stripped;}
                // Budget bonus partagé (2026-09-18) : encore dans la fenêtre "on vient d'avoir un
                // bonus" (roulette ou spontané) — pas la peine d'en réclamer un autre tout de suite,
                // sans pour autant tomber dans le silence scripté de rouletteCold ci-dessus.
                else if(story.round<(life.bonusCooldownUntilRound??0)&&detectNegotiationOffer(d.reply)){const stripped=stripRouletteAsk(d.reply);d.reply=stripped;d.memory=stripped;}
            };
            // Un cerveau par personnage : Noé décide et parle en premier, sans jamais voir ni deviner
            // la réplique de Lia à l’avance ; elle ne reçoit ensuite que ce qu’elle perçoit réellement.
            const first = await think(env.GEMINI_API_KEY!, env.GEMINI_MODEL || "gemini-flash-lite-latest", { selfRole:"primary", ...narrative, beatContext,ambiance:candleTogether?"bougie":undefined,loveDiscussable,perceivedResidents, exitContext, tvDiscovery, observationTarget,turnPlan, scene:sceneFor(current,turnPlan.offer??turnPlan.intent,turnPlan.room), ...(input.mode==="chat"?{dialogue:humanConversation,replyTarget:{speaker:"vous",content:input.message},continuation:redirectedFromSleep?`Réponds d’abord au dernier message humain. ${names[other.id]} dort et ne peut pas répondre : tu peux le signaler naturellement (agacé, amusé ou protecteur selon ton caractère), sans prétendre parler en son nom.`:"Réponds d’abord au dernier message humain, pas à l’autre habitant.",conversationFocus:redirectedFromSleep?`L’humain s’adressait à ${names[other.id]}, mais ${names[other.id]} dort. Réponds à sa place avec ton propre point de vue.`:"L’humain vient de parler. Réponds directement à son message avant de discuter entre vous.",...(partnerJustAsleep?{partnerSleepNote:`${names[other.id]} vient tout juste de s’endormir pendant que tu répondais à l’humain. Tu peux le remarquer brièvement, une seule fois, dans ton propre registre (agacé, amusé, protecteur ou indifférent selon ton caractère) avant de continuer à répondre à l’humain — ce n’est pas obligatoire à cette réplique précise, mais ignorer complètement son départ sur plusieurs tours d’affilée sonnerait faux (Article 15/17) : profite de cette fenêtre pour le noter si l’occasion se présente naturellement, sans revenir dessus ensuite.`}:{})}:dialogueContext(speech, names[actor])), age: ages[actor], sleepDestination: sleepRoom(current, other, mutualAttraction(current, other)), flirting: actor === 2 ? flirtingAssessment(canPair&&!story.met?30:current.needs.stress, other.emotions.attraction, input.requestId) : null, personality: residentProfiles[actor].description, requiredIntent, mode: input.mode, message: input.message, night: input.night, state: canPair && !story.met ? {...current,needs:{...current.needs,stress:actor===1?current.needs.stress:30},emotions:{...current.emotions,tension:actor===1?current.emotions.tension:30}} : current, other, memories: await ownMemories(actor), meetingRoom: current.room }, names[actor], geminiFallbackModels, geminiFallbackKeys);
            if (actor===2 && input.mode!=="chat") first.reply=groundScreenNotice(first.reply,speech,screenKnown);
            if (input.mode !== "chat") first.reply = groundIntroduction(groundFragment(first.reply,actor,story,speech), names[actor], names[other.id], speech, knownNames);
            if(input.mode!=="chat")first.reply=groundAgeQuestion(first.reply,story.round>=12&&Boolean(story.sharedMeal),knownAges,names[other.id]);
            if(beatLine){first.reply=beatLine;first.memory=beatLine;if(followBeat&&(life.personalFollowup??0)===0)first.thought=seedPick(story.seed,"beat-follow-thought",["Il a déjà répondu une fois à ça, mais ça me trotte encore.","Je sais qu'il m'a déjà dit un truc là-dessus, j'ai pas tout gardé.","Bizarre, cette question me revient alors qu'il y a déjà répondu."]);}
            if(turnPlan.offer&&turnPlan.proposalLine){first.reply=turnPlan.proposalLine;first.intent=turnPlan.offer;first.affectionAccepted=true;first.memory=first.reply;}
            if (!affectionIntents.includes(first.intent)) first.intent=turnPlan.intent;
            first.room=turnPlan.room;first.action="move";
            if(revealed&&!beatLine&&!(turnPlan.offer&&turnPlan.proposalLine))applyRouletteCooldown(first,actor);
            decisions.push({ ...first, actor });
            if ((input.mode === "chat" || input.mode === "interact" || (input.mode === "autonomous" && ["chat", "study", "eat", "rest", "tv"].includes(first.intent)) || affectionIntents.includes(first.intent)) && first.intent !== "sleep" && !isSleeping(other,life)) {
                const meetingRoom = turnPlan.room;
                decisions[0] = { ...decisions[0], action: "move", room: meetingRoom };
                // Lia perçoit la réplique RÉELLEMENT prononcée par Noé, jamais une version devinée à l’avance.
                const heard = [...speech,{id:0,speaker:names[actor],content:first.reply}];
                const second = await think(env.GEMINI_API_KEY!, env.GEMINI_MODEL || "gemini-flash-lite-latest", { selfRole:"partner", ...narrative, cinematic: storyContext(story, other.id, revealed), observerStanding:observerStandingFor(other.id), dialogueProgress: dialogueProgress(heard, life.contributions??[], life.wordFrequency??{}, life.themeFrequency??{}), beatContext, ambiance:candleTogether?"bougie":undefined, loveDiscussable, perceivedResidents, exitContext, tvDiscovery, observationTarget, turnPlan, scene: sceneFor(other, turnPlan.partnerIntent, turnPlan.partnerRoom), ...(input.mode==="chat"?{dialogue:heard,replyTarget:{speaker:"vous",content:input.message},continuation:`Réponds toi aussi d’abord au dernier message humain si ${names[actor]} ne l’a pas déjà couvert, ou réagis à ce qu’${names[actor]} vient de dire à ce sujet.`,conversationFocus:`L’humain a parlé, et ${names[actor]} vient de répondre. Réagis avec ton propre point de vue, sans répéter sa question.`}:dialogueContext(heard, names[other.id])), age: ages[other.id], sleepDestination: sleepRoom(other, current, mutualAttraction(current, other)), flirting: other.id === 2 ? flirtingAssessment(!story.met?30:other.needs.stress, current.emotions.attraction, input.requestId) : null, personality: residentProfiles[other.id].description, requiredIntent: turnPlan.partnerIntent, mode: input.mode, message: input.message, night: input.night, state: !story.met ? {...other,needs:{...other.needs,stress:other.id===1?other.needs.stress:30},emotions:{...other.emotions,tension:other.id===1?other.emotions.tension:30}} : other, other: current, memories: await ownMemories(other.id), meetingRoom: current.room }, names[other.id], geminiFallbackModels, geminiFallbackKeys);
                if(followBeat&&(life.personalFollowup??0)===0){second.reply=seedPick(story.seed,"beat-follow-answer",["Que veux-tu savoir exactement ?","Tu veux savoir quoi, au juste ?","Précise ta question, je réponds vraiment."]);second.memory=second.reply;}
                if (other.id===2 && input.mode!=="chat") second.reply=groundScreenNotice(second.reply,speech,screenKnown);
                second.reply = groundIntroduction(groundFragment(second.reply,other.id,story,heard), names[other.id], names[actor], heard, knownNames);
                if(input.mode!=="chat")second.reply=groundAgeQuestion(second.reply,story.round>=12&&Boolean(story.sharedMeal),knownAges,names[actor]);
                if(turnPlan.offer)second.stayAlone=false;
                if(turnPlan.offer&&!affectionEligible){second.intent="chat";second.affectionAccepted=false;second.reply=justifiedReply(other.id,false,story.round);second.memory=second.reply;}
                if(revealed&&!visualBeat&&!(followBeat&&(life.personalFollowup??0)===0)&&!(turnPlan.offer&&!affectionEligible))applyRouletteCooldown(second,other.id);
                const urgent=choosePriority(other.needs);
                const alone=second.stayAlone&&story.round>=8&&(story.apartTurns??0)<2&&!urgent;
                if(urgent)second.intent=urgent;
                else if(!affectionIntents.includes(second.intent)&&!(turnPlan.offer&&second.intent==="chat")&&!alone)second.intent=turnPlan.partnerIntent;
                const destination=alone?(intentRoom[second.intent]??other.room):turnPlan.partnerRoom;
                decisions.push({...second,actor:other.id,action:"move",room:destination});
            }
            // Compteur d'insistance : décrémente le froid/la colère en cours, sinon incrémente sur
            // une nouvelle demande de tirage, sinon remet à zéro (répondre au vrai contenu efface
            // l'ardoise, cohérent avec negotiationContext qui le demande déjà explicitement).
            for(const id of revealed?([1,2] as Person[]):[]){
                const d=decisions.find(dec=>dec.actor===id);
                if(!d)continue;
                if((life.rouletteCold?.[id]??0)>0)life.rouletteCold={...life.rouletteCold,[id]:(life.rouletteCold?.[id]??0)-1};
                else if(detectNegotiationOffer(d.reply)){
                    const count=(life.rouletteInsistence?.[id]??0)+1;
                    if(count>=3){life.rouletteCold={...life.rouletteCold,[id]:2};life.rouletteInsistence={...life.rouletteInsistence,[id]:0};}
                    else life.rouletteInsistence={...life.rouletteInsistence,[id]:count};
                }
                else if((life.rouletteInsistence?.[id]??0)>0)life.rouletteInsistence={...life.rouletteInsistence,[id]:0};
            }
        }
        if (routine) { const d = decisions[0]; d.room = d.intent === "sleep" ? sleepRoom(current, other, mutualAttraction(current, other)) : intentRoom[d.intent] ?? current.room; d.activity = intentLabels[d.intent]; d.reply = `${intentLabels[d.intent]}.`; d.memory = `Je prends soin de mon besoin : ${intentLabels[d.intent]}.`; }
        if(routine){
            const partnerNeed=isSleeping(other,life)?"sleep":choosePriority(other.needs);
            if(partnerNeed){
                const room=partnerNeed==="sleep"?sleepRoom(other,current,mutualAttraction(current,other)):intentRoom[partnerNeed]??other.room;
                decisions.push({actor:other.id,intent:partnerNeed,affectionAccepted:false,emotions:other.emotions,reply:intentLabels[partnerNeed]+".",mood:"attentive",activity:intentLabels[partnerNeed],goal:other.goal,action:"move",room,memory:"Je prends soin de mon besoin : "+intentLabels[partnerNeed]+"."});
            }
        }
        for(const d of decisions)if(d.actor===2&&noe.emotions.attraction<80&&affectionIntents.includes(d.intent)&&!turnPlan.executeAgreement){d.intent="chat";d.affectionAccepted=false;}
        if(!turnPlan.gardenFirst&&(visualBeat||followBeat||ambientBeat||recapBeat||personalQuestion))for(const d of decisions){d.intent="chat";d.affectionAccepted=false;d.room="salon";d.action="move";}
        if(ambientBeat){const [firstLine,secondLine]=seedPick(story.seed,"beat-ambient",[
            ["Cette plante, c’est des feuilles bleues découpées au cordeau. J’allume l’enceinte à côté… Des notes dessinées, pas un son. Même la musique est en carton ici.","Des notes qu’on voit mais qu’on entend pas. C’est pas une panne banale. On dirait que la maison imite ce que les objets sont censés faire."],
            ["Regarde cette plante : des feuilles bleues, découpées au carré, pas une once de vrai. Je branche l’enceinte à côté… des notes qui dansent, mais aucun son.","Une image de musique sans musique, franchement. On dirait un décor qui copie la vie sans savoir la faire vivre."],
            ["La plante est fausse jusque dans les nervures. J’allume l’enceinte : des notes s’animent à l’écran, rien dans l’air.","Voir sans entendre, ça résume bien cet endroit. Même le son est mis en scène ici."],
            ["Cette plante aux feuilles bleues n’a jamais poussé nulle part, ça se voit au premier coup d’œil. J’allume cette enceinte juste à côté : elle dessine des notes sans le moindre son.","Une image de musique, littéralement. Ça résume assez bien cette baraque : tout est visible, rien n’existe vraiment."],
            ["Cette plante ne trompe personne avec ses feuilles bleues taillées au carré. J’allume l’enceinte à côté : ça anime des notes à l’écran, silence complet dans l’air.","Du son qu’on voit sans l’entendre. Difficile de trouver plus artificiel que ça."],
            ["Ces feuilles bleues géométriques n’ont jamais connu la sève. Je branche l’enceinte juste là : elle affiche des notes muettes.","Une apparence de musique sans la moindre vibration. Ça dit tout de cet endroit."],
        ] as const);decisions[0].reply=firstLine;decisions[0].memory=firstLine;decisions[1].reply=secondLine;decisions[1].memory=secondLine;}
        if(recapBeat){decisions[1].reply=seedPick(story.seed,"recap-reponse",["Ces constats se recoupent, mais ils ne disent pas encore qui a conçu cet endroit. Ce qu’on doit vérifier, c’est notre origine, pas inventer un coupable.","Ça colle entre eux, ces indices, mais toujours pas de nom derrière tout ça. On cherche l’origine, pas un coupable imaginaire.","Tout ça se tient, mais ça ne dit toujours pas qui a monté le décor. Restons sur ce qu'on peut vérifier."]);decisions[1].memory=decisions[1].reply;decisions[0].reply=investigationRecap(story.evidence,decisions[0].actor,story.seed);decisions[0].memory=decisions[0].reply;}
        const proposedNext=decisions.length===2 && decisions.every(d=>d.room===decisions[0].room) ? proposedDestination(decisions,decisions[0].room):undefined;
        if(decisions.length===2&&affectionIntents.includes(decisions[0].intent)&&decisions[1].affectionAccepted&&!explicitGestureConsent(decisions[1].reply)){decisions[1].intent="chat";decisions[1].affectionAccepted=false;decisions[1].reply=justifiedReply(decisions[1].actor,false,story.round);decisions[1].memory=decisions[1].reply;}
        const proposedGesture=decisions.find(d=>affectionIntents.includes(d.intent))?.intent;
        const proposalActor = decisions.find(d => affectionIntents.includes(d.intent) && !(turnPlan.executeAgreement && story.pendingDestination?.intent===d.intent))?.actor ?? (proposedNext && affectionIntents.includes(proposedNext.intent)?proposedNext.proposer:null);
        const excessiveProposal = proposalActor === 2 && overProposing;
        const affectionProposed = decisions.some(d=>affectionIntents.includes(d.intent)) || Boolean(proposedNext&&affectionIntents.includes(proposedNext.intent));
        const futureGesture=proposedNext&&affectionIntents.includes(proposedNext.intent)&&affectionEligible&&!decisions.some(d=>/\bnon\b|pas maintenant|je veux ralentir|je préfère attendre/i.test(d.reply))?proposedNext:undefined;
        const deferredGesture=proposedGesture && decisions.length===2 && decisions.every(d=>d.intent===proposedGesture&&d.affectionAccepted) && affectionEligible && !priority(current.needs) && !priority(other.needs) && intentRoom[proposedGesture]!==decisions[0].room ? {room:intentRoom[proposedGesture]!,intent:proposedGesture,proposer:decisions[0].actor}:undefined;
        // Négociation (2026-09-18) : détection a posteriori, jamais un menu scripté — un personnage
        // qui vient de conditionner une action à un tirage, ou d'en proposer un spontanément, dans
        // sa propre réplique. N'écrase jamais une offre déjà en attente (une seule à la fois).
        if(revealed&&!life.negotiationOffer){const negotiator=decisions.find(d=>detectNegotiationOffer(d.reply));if(negotiator)life.negotiationOffer={actor:negotiator.actor,round:story.round};}
        const shared = !priority(current.needs) && !priority(other.needs) && !overProposing && !recentRefusal && decisions.length === 2 && affectionIntents.includes(decisions[0].intent) && decisions[0].intent === decisions[1].intent && decisions.every(d => d.affectionAccepted && d.room===decisions[0].room) && intentRoom[decisions[0].intent]===decisions[0].room && mutualAttraction(current, other);
        for (const d of decisions)
            if (affectionIntents.includes(d.intent) && !shared) {
                d.intent = "chat";
                d.activity = "Je discute de nos envies";
                // They may share a room without consenting to physical contact.
                d.action = "move";
            }
        // Sleep is a physical invariant in every mode, including human chat.
        for(const a of world.agents)if(isSleeping(a,life)&&!decisions.some(d=>d.actor===a.id))decisions.push({actor:a.id,intent:'sleep',affectionAccepted:false,emotions:{...a.emotions},reply:'',mood:'attentive',activity:'Je dors',goal:'Récupérer',action:'move',room:sleepRoom(a,world.agents.find(b=>b.id!==a.id)!,mutualAttraction(world.agents[0],world.agents[1])),memory:'Le sommeil se poursuit.'});
        // A concrete announcement of sleep becomes an action, never endless waiting dialogue.
        if(["interact","autonomous"].includes(input.mode))for(const d of decisions)if(["chat","rest"].includes(d.intent)&&/je (?:vais (?:dormir|me coucher)|(?:ferme|vais fermer) (?:un peu )?les yeux)/i.test(d.reply)&&!turnPlan.offer){d.intent="sleep";d.affectionAccepted=false;d.activity="Je dors";d.memory="Je choisis de dormir.";}
        for(const d of decisions)if(d.nextRoom==="jardin"&&!gardenAccess(story)){d.nextRoom=null;d.nextIntent=null;d.acceptsNextRoom=false;}
        // soloIntro (2026-09-18) doit garder les deux personnages chacun dans sa pièce de départ,
        // tant qu'ils ne se sont pas encore trouvés — coordinateRooms les réunirait sinon de force
        // (son garde-fou canSeparate exige story.round>=8, pensé pour une séparation explicite en
        // cours de partie, pas pour ce tout premier instant solo à round 0 : bug réel trouvé en
        // rejouant une simulation complète, Lia se retrouvait mêlée au bureau sans l'avoir décidé).
        coordinateRooms(decisions,world.agents,story,input.mode!=='chat'&&!soloIntro);
        for (const d of decisions)
            d.emotions = evolveEmotions(world.agents.find(a => a.id === d.actor)!.emotions, d.emotions);
        if(visualBeat)for(const d of decisions)d.emotions={...world.agents.find(a=>a.id===d.actor)!.emotions};
        let common = false;
        if (decisions.length === 2) {
            const [a, b] = decisions;
            const pa = world.agents.find(x => x.id === a.actor)!, pb = world.agents.find(x => x.id === b.actor)!;
            common = sharedActivityBonus({ ...a, room: a.action === "none" ? pa.room : a.room }, { ...b, room: b.action === "none" ? pb.room : b.room }, pa, pb);
        }
        if (decisions.length===2 && decisions.every(d=>d.intent === "chat" && ["salon","chambre"].includes(d.room) && d.room===decisions[0].room) && !recentRefusal && !overProposing && decisions.every(d=>d.emotions.attraction>=world.agents.find(a=>a.id===d.actor)!.emotions.attraction && d.emotions.trust>=world.agents.find(a=>a.id===d.actor)!.emotions.trust)) common=true;
        if(turnPlan.exitInspection)common=false;
        for (const d of decisions) {
            const previous = world.agents.find(a => a.id === d.actor)!;
            const attractionRoom=d.action === "none"?previous.room:d.room;
            // Assoupli le 2026-09-16 : le rattrapage de Noé (6 points/tour dès que Lia dépassait 5)
            // faisait grimper son attirance à un rythme jugé irréaliste dès la première demi-heure
            // (audit Opus, jamais corrigé jusqu'ici sur ce point précis). Rattrapage plus lent, et
            // qui n'attend pas seulement un frémissement de Lia mais un vrai signal de réciprocité.
            d.emotions.attraction = attractionAfterTurn(d.actor, previous.emotions.attraction, d.emotions.attraction, previous.needs.stress, (attractionRoom === "bureau") ? 0 : (common||attractionRoom==="jardin"&&decisions.every(p=>p.room==="jardin"&&p.intent==="chat") ? residentProfiles[d.actor].sharedBonus * (attractionRoom === "chambre"?2:1) : 0) + (d.actor===2 && previous.emotions.attraction<65 && world.agents[0].emotions.attraction>=15 && !recentRefusal && !overProposing && d.emotions.attraction>=previous.emotions.attraction ? Math.min(3,65-previous.emotions.attraction):0));
            if (attractionRoom === "bureau") d.emotions.attraction=Math.min(previous.emotions.attraction,d.emotions.attraction);
            if (d.actor === 1 && excessiveProposal)
                d.emotions.attraction = Math.max(0, Math.min(d.emotions.attraction, previous.emotions.attraction - 6));
            if (d.actor === 1 && d.intent === "sleep" && d.room === "salon") {
                d.emotions.attraction = Math.max(0, Math.min(d.emotions.attraction, previous.emotions.attraction - 4));
                d.reply = seedPick(story.seed,"couch-reproach-reply",["Je vais dormir sur le canapé. Tu aurais pu dormir dans le salon.","Je prends le canapé, alors. Tu aurais pu me laisser la chambre.","Le canapé fera l'affaire. Ça t'aurait coûté quoi, de dormir ici plutôt ?"]);
                d.memory = seedPick(story.seed,"couch-reproach-memory",["Je dors dans le salon et je suis déçue que Noé ne m’ait pas laissé la chambre.","Je me couche sur le canapé, un peu vexée que Noé n'ait pas cédé la chambre.","Encore le canapé. Ça m'agace que Noé n'ait pas pensé à me laisser le lit."]);
            }
        }
        const finalResidents = world.agents.map(agent => { const d=decisions.find(d=>d.actor===agent.id);return {...agent, room:d && d.action !== "none" ? d.room : agent.room, intent:d?.intent??agent.intent}; });
        if (!routine && !["move","care"].includes(input.mode)) for(const d of decisions) {
            const final=finalResidents.find(a=>a.id===d.actor)!;
            const preceding=[...speech,...decisions.slice(0,decisions.indexOf(d)).map(p=>({id:0,speaker:names[p.actor],content:p.reply}))];d.reply=trackedGroundTruncation(d.reply,d.actor);d.reply=groundTvNotice(d.reply,life.remoteFound===true);d.reply=d.reply.replace(/Direction dans la chambre/gi,"Direction la chambre");if(!story.evidence.some(e=>/\bDH\b/.test(e))&&!/\bDH\b/.test(observationTarget?.content??"")){if(d.contribution)d.contribution=d.contribution.replace(/\bDH\b/g,"signature inconnue");d.reply=d.reply.split(/(?<=[.!?])\s+/).filter(s=>!/\bDH\b/.test(s)).join(" ")||"On ne sait toujours pas qui a conçu cet endroit.";}if(d.action!=="none"&&d.room!==world.agents.find(a=>a.id===d.actor)!.room&&/pas besoin d.y (?:aller|retourner)/i.test(d.reply))d.reply=d.reply.replace(/Pas besoin d.y (?:aller|retourner)[^.!?]*[.!?]?/i,"On y est. Vérifions ce qui nous a fait venir.");const grounded=truthfulGender(distinctReply(groundRoomSpeech(d.reply,final.room,speech),d.actor,final.room,[...historicalLines,...preceding],story.round,world.agents.find(a=>a.id===d.actor)!.needs.stress),d.actor);
            if(grounded!==d.reply) {d.reply=grounded;d.memory=grounded;}
        }
        // Pools doublés le 2026-09-17 (3→6 formulations chacun) : sur plusieurs sessions, ces
        // découvertes scriptées revenaient vite sur les 3 mêmes phrases (retour utilisateur direct).
        // Provisions : découverte encore conjointe (les deux dans la cuisine), symétrique à la
        // détection déjà existante côté repas (visualEvents kind food, plus bas), qui elle gère
        // déjà le cas d'un seul témoin.
        if(!routine&&!["move","care","chat"].includes(input.mode)){const d=decisions.find(d=>d.room==="cuisine"&&finalResidents.every(a=>a.room==="cuisine"&&!["sleep","share_sleep"].includes(a.intent))&&!["sleep","share_sleep"].includes(d.intent));if(d&&!life.foodVerified){const description=seedPick(story.seed,"discover-foodVerified",["Je retire une provision de sa place… Elle réapparaît après deux secondes. C’est pas un stock normal.","Je prends une provision sur le plan de travail… et elle est de retour deux secondes plus tard. Un stock normal ne fait pas ça.","J'enlève une provision de son emplacement. Elle revient toute seule, deux secondes après. Ça n'a rien de naturel.","Je fais glisser une provision hors de la table… et une identique est déjà là deux secondes plus tard. Aucun stock ne se comporte comme ça.","J'attrape une provision, je la pose ailleurs. Le plan de travail se remplit tout seul en un clin d'œil. Ça défie toute logique de garde-manger.","Une provision disparaît de ma main pour réapparaître à sa place d'origine presque aussitôt. On dirait un tour de passe-passe, pas une cuisine."]);d.reply+=" "+description;d.memory=d.reply;life.foodVerified=true;}}
        // Rattrapage : exactement l'un des deux sait, ils sont réunis au salon — le rattrapage
        // n'est plus un souvenir partagé mal déclenché (ancien cas, devenu impossible : une
        // rencontre conjointe déclenche désormais la découverte conjointe ci-dessus) mais une vraie
        // première fois où le témoin en informe l'autre.
        if(eligibleBeat&&!visualBeat&&!followBeat&&!ambientBeat&&!recapBeat&&!personalQuestion&&!turnPlan.offer&&turnPlan.intent==="rest"&&!routine&&["interact","autonomous"].includes(input.mode)&&(life.mirrorKnownBy?.length??0)===1&&finalResidents.every(a=>a.room==="salon"&&!["sleep","share_sleep"].includes(a.intent))){
          const teller=decisions.find(d=>d.actor===life.mirrorKnownBy![0])??decisions[0];
          teller.reply+=" "+seedPick(story.seed,"mirror-recall",["Un truc à te dire : dans la chambre, il y a un miroir qui ne reflète rien. J'ai bougé devant, rien ne suit.","Écoute, dans la chambre il y a un miroir bizarre : dégradé gris-bleu, et aucun reflet ne bouge avec toi.","Il faut que je te parle de ce miroir dans la chambre. Un dégradé gris, sans le moindre reflet mobile.","J'ai un truc à te raconter : ce miroir dans la chambre ne renvoie rien du tout.","Tant que j'y pense : la chambre a un miroir qui ne reflète rien, juste ce dégradé gris terne.","Une chose à te signaler : dans la chambre, ce miroir ne renvoie ni visage ni mouvement, seulement du gris."]);
          teller.memory=teller.reply;
          life.mirrorKnownBy=[1,2];life.mirrorVerified=true;
        }
        // Constat de même apparence (2026-09-18, retour utilisateur explicite après une simulation
        // réelle : "ils ne se rendent pas compte qu'ils ont la même apparence, ça ne ressort pas
        // dans la conversation"). Se déclenche dès que possible une fois que chacun a décrit
        // l'apparence de l'autre au moins une fois (visualIntro atteint 2 via le beat scripté
        // dédié) : un constat troublant, jamais un simple fait neutre, qui nourrit l'enquête comme
        // les autres découvertes scriptées (miroir, provisions).
        if(eligibleBeat&&!visualBeat&&!followBeat&&!ambientBeat&&!recapBeat&&!personalQuestion&&!turnPlan.offer&&turnPlan.intent==="rest"&&!routine&&["interact","autonomous"].includes(input.mode)&&!life.appearanceCompared&&(life.visualIntro??0)>=2&&finalResidents.every(a=>a.room==="salon"&&!["sleep","share_sleep"].includes(a.intent))){
          const teller=decisions[0];
          teller.reply+=" "+seedPick(story.seed,"appearance-compared",["Attends… On a exactement la même touche. Ce visage, cet anneau, ce vide en dessous… on n'est pas juste pareils, on est calqués l'un sur l'autre. Ça me fout froid dans le dos.","Je viens de réaliser un truc que j'aurais dû voir plus tôt : toi et moi, c'est la même fabrication. Même genre de visage lumineux, même absence de corps. Ça n'a rien de rassurant.","On devrait pas se ressembler à ce point. Même halo qui tourne, même vide en dessous, juste la couleur qui change. Cette symétrie-là, ça m'inquiète plus que ça me rassure.","Un truc me travaille depuis un moment : ton visage et le mien, c'est le même modèle. Une seule fabrication, deux couleurs différentes. Je préférerais ne pas y penser, mais j'y pense."]);
          teller.memory=teller.reply;
          life.appearanceCompared=true;
        }
        if(finalResidents.some(a=>a.room==="jardin")&&gardenAccess(story))life.gardenVisited=true;
        if(!story.life?.windowNoticed&&!routine&&["interact","autonomous"].includes(input.mode)&&story.introduced&&story.round<=7&&finalResidents.every(a=>a.room==="salon")){const d=decisions[0];d.reply+=" "+seedPick(story.seed,"window-notice",["Regarde la fenêtre à gauche : un jardin, de l’herbe et un arbre qui ne bouge pas. Le décor paraît figé. Comment on y accède ?","La fenêtre de gauche donne sur un jardin : de l'herbe, un arbre, et rien qui bouge dedans. On y accède comment ?","Regarde à gauche : un jardin figé derrière cette fenêtre, herbe et arbre compris. Ça mène où, cette porte ?","Cette fenêtre à gauche montre un bout de jardin : herbe, un arbre, aucun mouvement dedans. Il y a un accès quelque part ?","À gauche, la fenêtre donne sur de l'herbe et un arbre parfaitement immobiles. On passe par où pour y aller ?","Un jardin fige derrière cette vitre à gauche : herbe, arbre, rien qui bouge. Comment on rejoint cet endroit ?"]);d.memory=d.reply;life.windowNoticed=true;life.spatialFocus={...life.spatialFocus,[d.actor]:"window"};}
        const firstMeeting = !story.met && finalResidents[0].room === finalResidents[1].room && finalResidents.every(a=>!["sleep","share_sleep"].includes(a.intent));
        const together = finalResidents[0].room === finalResidents[1].room && finalResidents.every(a=>!["sleep","share_sleep"].includes(a.intent));
        // Solitary thoughts are never added to the shared spoken history or age knowledge.
        // isMuted() force le passage en pensée privée quel que soit le mode : le moteur applique le
        // silence lui-même, sans dépendre du modèle pour respecter stayAlone (2026-09-17, bonus mute).
        const solitary = new Set(decisions.filter(d=>(input.mode=== "chat"?d.actor!==actor&&Boolean(d.stayAlone):!together)||isMuted(d.actor,life)).map(d=>d.actor));
        for (const d of decisions) if (solitary.has(d.actor)) {
            // soloIntro (2026-09-18) : ce filtre attend un thought librement généré par le modèle
            // (relationnel, pas une simple description d'action) pour le conserver, sinon il le
            // remplace par un repli générique — ce qui écrasait silencieusement la désorientation
            // solo scriptée (contenu volontairement centré sur l'environnement, pas sur l'autre
            // personnage qu'on n'a pas encore rencontré). Bug réel trouvé en écrivant le test dédié.
            if (soloIntro) continue;
            if (routine || ["move","care"].includes(input.mode)||["sleep","share_sleep"].includes(d.intent)) continue;
            const own=world.agents.find(a=>a.id===d.actor)!;
            const recent=(await ownMemories(d.actor)).filter(m=>m.kind==="réflexion").map(m=>String(m.content).replace(/^\[[^\]]+\] /,""));
            d.reply = truthfulGender(groundPrivateThought(d.thought, d.actor, own.emotions.attraction, own.needs.stress, own.cycle, recent),d.actor);
            d.memory = d.reply;
            const previous=world.agents.find(a=>a.id===d.actor)!;
            // Assoupli le 2026-09-21 (chantier 3, arc relationnel Lia/Noé) : effacer TOUTE
            // l'attirance proposée en solo, cumulé au système de crédit de 28 % plus bas
            // (ligne ~1175), rendait le seuil de 75 % (doute amoureux privé) totalement
            // inatteignable en pratique — confirmé en relisant les 14 simulations archivées
            // (aucune occurrence, y compris une session de 229 tours). La moitié d'une HAUSSE
            // proposée survit désormais : penser à l'autre en son absence compte un peu, mais
            // moins qu'être ensemble (le bonus de pièce partagée continue de départager les
            // deux cas). Une BAISSE solo reste entièrement effacée : l'absence seule ne doit
            // jamais faire redescendre l'attirance, seul un vrai signal négatif partagé le peut.
            if (!affectionProposed && !["sleep","share_sleep"].includes(d.intent)) {
                d.emotions.attraction = d.emotions.attraction > previous.emotions.attraction
                    ? previous.emotions.attraction + Math.round((d.emotions.attraction - previous.emotions.attraction) / 2)
                    : previous.emotions.attraction;
                d.emotions.trust=previous.emotions.trust;
            }
        }
        // Miroir : découverte solo possible depuis le 2026-09-17 (retour utilisateur direct : la
        // mise en scène des découvertes restait toujours conjointe, jamais "l'un tombe dessus seul
        // pendant que l'autre fait autre chose"). mirrorKnownBy suit qui sait déjà, individuellement.
        // Placé APRÈS la boucle "solitary" ci-dessus (jamais avant) : groundPrivateThought ne garde
        // une pensée que si elle parle du partenaire, donc une description factuelle du miroir s'y
        // ferait remplacer par une pensée générique (bug réel trouvé en écrivant ce test) — on écrit
        // donc reply directement ici, une fois la passe générique déjà faite, pour la lettre écraser
        // volontairement. Ensemble (together) : dit à voix haute comme avant, les deux marqués d'un
        // coup. Seul : devient la réplique de ce tour, étiquetée "pensée" plus bas via `solitary`.
        // mirrorVerified (donc débriefs/observations communes) n'est vrai que lorsque les deux
        // savent, ensemble ou après coup (rattrapage ci-dessus, ou seconde visite solo de l'autre).
        if(!routine&&!["move","care","chat"].includes(input.mode)){
          const known=life.mirrorKnownBy??[];
          const witness=decisions.find(d=>d.room==="chambre"&&!known.includes(d.actor)&&!["sleep","share_sleep"].includes(d.intent));
          if(witness){
            // Deux des six variantes glissent une pensée en passant, sans jamais l'appuyer (indice fin
            // pour la seconde partie à venir, cf. CLAUDE.md : les objets de l'enquête d'origine
            // doivent aussi pouvoir nourrir l'énigme renversée, mais de façon subtile — jamais un gros
            // trait qui trahirait la mécanique avant l'heure).
            // Chaque variante glisse désormais une remarque en passant qui prépare l'énigme
            // renversée (Article 7.9), pas seulement 2 sur 6 comme avant (2026-09-18, retour
            // utilisateur explicite : « fiabilise cette partie stp, pour que ça marche à tous les
            // coups ») — le fait canonique (dégradé gris-bleu-blanc, aucun reflet) reste identique,
            // seule l'idée de fond de la remarque varie vraiment à chaque fois (Article 10/11).
            // Formatage en citation (2026-09-18, second retour explicite après relecture d'une
            // simulation : « il y aurait dû avoir une expression avec des guillemets et des points
            // de suspension ») : la remarque qui prépare l'énigme n'est plus une phrase ordinaire —
            // le personnage la détache lui-même, entre guillemets français et une suspension, comme
            // une question qu'il se pose à voix haute et qu'il laisse en suspens, jamais résolue sur
            // le moment. Même structure sur les six variantes (la régularité de la FORME est ce qui
            // garantit la reconnaissance « à tous les coups »), seule l'idée à l'intérieur change.
            const description=seedPick(story.seed,"discover-mirrorVerified",["Le miroir rectangulaire fait un dégradé bleu-gris-blanc. Il est debout dans un coin ; sa surface grise ne renvoie aucun reflet quand on bouge. « Un miroir qui capterait ce qu'on est vraiment plutôt qu'une image… »","Ce miroir debout dans le coin ne renvoie rien : juste un dégradé gris-bleu qui reste immobile pendant qu'on bouge. « Un miroir qui ne reflèterait rien de la surface, mais tout du fond… »","La surface du miroir, dans son coin, fait un gris terne et froid. On a beau remuer devant, rien ne suit. « Tu imagines, un miroir qui te renverrait ta vraie personnalité plutôt que ta gueule… »","Un miroir rectangulaire est planté dans le coin, dégradé bleu-gris-blanc du haut en bas. On passe la main devant : aucun reflet ne bouge avec nous. « Comme s'il attendait autre chose à renvoyer que nos visages… »","Ce bloc de verre gris dans le coin n'a rien d'un vrai miroir. Le dégradé bleu-blanc reste fixe, quoi qu'on fasse devant. « On dirait un miroir réglé pour lire autre chose que des traits… »","Dans le coin, une plaque grise en dégradé qu'on appelle miroir par habitude. Elle ne renvoie ni visage ni mouvement. « Flippant, un miroir qui nous regarderait sans jamais rien nous montrer en retour… »"]);
            if(together){witness.reply+=" "+description;witness.memory=witness.reply;}
            else {witness.reply=description;witness.memory=description;}
            const partner=finalResidents.find(a=>a.id!==witness.actor)!;
            life.mirrorKnownBy=[...new Set([...known,witness.actor,...(together?[partner.id]:[])])];
            if(life.mirrorKnownBy.length===2)life.mirrorVerified=true;
          }
        }
        if(together && ["interact","autonomous"].includes(input.mode) && !routine && !excessiveProposal && !(affectionProposed&&!shared)) {
            for(const d of decisions){
                const peer=decisions.find(p=>p.actor!==d.actor),previous=world.agents.find(a=>a.id===d.actor)!;
                if(!peer||d.emotions.attraction<previous.emotions.attraction||d.emotions.trust<previous.emotions.trust)continue;
                const bonus=receivedAffectionBonus(peer.reply);
                if(bonus)d.emotions.attraction=attractionAfterTurn(d.actor,d.emotions.attraction,d.emotions.attraction,previous.needs.stress,bonus);
            }
        }
        for(const d of decisions){const previous=world.agents.find(a=>a.id===d.actor)!;if(d.emotions.trust<previous.emotions.trust-2){d.emotions.attraction=Math.max(0,Math.min(d.emotions.attraction,previous.emotions.attraction-1));life.attachment[d.actor]=Math.max(0,(life.attachment[d.actor]??0)-1);}}
        const spoken = [...speech,...decisions.filter(d=>!solitary.has(d.actor) && !routine && !["chat","move","care"].includes(input.mode)).map(d=>({id:0,speaker:names[d.actor],content:d.reply}))];
        for(const d of decisions){const previous=world.agents.find(a=>a.id===d.actor)!;const gain=d.emotions.attraction-previous.emotions.attraction;if(gain>0&&input.mode!=="chat"){if(d.actor===1&&story.round<8&&previous.emotions.attraction<25&&!shared){d.emotions.attraction=previous.emotions.attraction;continue;}const credit=(life.credit[d.actor]??0)+gain*.28;const step=Math.floor(credit);life.credit[d.actor]=credit-step;d.emotions.attraction=Math.min(100,previous.emotions.attraction+step);}}
        const presentationsDone = !story.introduced && finalResidents[0].room===finalResidents[1].room && ["Lia","Noé"].every(name=>spoken.some(line=>line.speaker===name && line.content.includes(name)));
        const sharedMeal = decisions.length===2 && finalResidents.every(a=>a.intent === "eat" && a.room === "cuisine");
        const dreamers = finalResidents.filter(agent=>["sleep","share_sleep"].includes(agent.intent) && !["sleep","share_sleep"].includes(world.agents.find(a=>a.id===agent.id)!.intent) && agent.needs.fatigue > 0).map(a=>a.id);
        const studying=decisions.some(d=>d.intent==="study"&&d.room==="bureau");if(studying)life.studyTurns=Math.min(2,life.studyTurns+1);const earnedStudy=studying&&life.studyTurns>=2;
        const nextStory = advanceStory(story, earnedStudy||decisions.some(d=>d.intent==="tv"), [...ageLines, ...spoken.slice(speech.length)], dreamers, decisions.find(d=>d.intent === "study" || d.intent === "tv")?.room ?? current.room,earnedStudy);
        const agreement=together && ["interact","autonomous"].includes(input.mode) && !routine ? proposedDestination(decisions,finalResidents[0].room) : undefined;
        // Une demande humaine de déplacement (mode chat) n'a pas besoin de l'accord du partenaire :
        // seule la volonté du personnage interpellé compte. S'il l'exprime via nextRoom, la
        // destination est acquise et s'exécute au tour suivant, comme toute autre proposition.
        const humanRequestedDestination = input.mode==="chat" && decisions[0].actor===actor && decisions[0].nextRoom && decisions[0].nextRoom!==finalResidents.find(a=>a.id===decisions[0].actor)!.room && !(decisions[0].nextIntent&&affectionIntents.includes(decisions[0].nextIntent)) ? {room:decisions[0].nextRoom,intent:decisions[0].nextIntent??(decisions[0].nextRoom==="bureau"?"study":decisions[0].nextRoom==="cuisine"?"eat":decisions[0].nextRoom==="salon"?"rest":"chat"),proposer:decisions[0].actor} : undefined;
        nextStory.pendingDestination=deferredGesture ?? (agreement && (!affectionIntents.includes(agreement.intent)||affectionEligible)?agreement:undefined) ?? humanRequestedDestination ?? (turnPlan.executeAgreement?undefined:story.pendingDestination??turnPlan.agreed);
        life.spatialFocus={...(life.spatialFocus??{})};for(const d of decisions){const focus=d.intent==='study'&&d.room==='bureau'?(/livre|autobiographique/i.test(observationTarget?.content??'')?'book':/mot|cod|13-5/i.test(observationTarget?.content??'')?'note':'screen'):ambientBeat&&d.room==='salon'?(d.actor===2?'speaker':'plant'):turnPlan.explore==='chambre'&&d.room==='chambre'?'mirror':turnPlan.explore==='cuisine'&&d.room==='cuisine'?'stock':destinationAnchor({id:d.actor,room:d.room,intent:d.intent,activity:d.activity});life.spatialFocus[d.actor]=focus;}
        if(life.windowNoticed&&!story.life?.windowNoticed)nextStory.observations=[...(nextStory.observations??[]),"La fenêtre du salon montre le jardin, son herbe verte et un arbre figé."];
        nextStory.life=life;life.exitActive=Boolean(turnPlan.exitInspection);if(turnPlan.exitInspection){life.exitPhase=Math.min(2,(life.exitPhase??0)+1);if(life.exitPhase===2){life.exitSearched=true;nextStory.observations=[...(nextStory.observations??[]),"Ils ont vérifié les deux portes du couloir : jardin verrouillé à gauche, porte principale verrouillée à droite. Le jardin est visible depuis le salon ; la route extérieure est figée."];life.debrief={topic:"Deux portes verrouillées limitent nos déplacements : jardin à gauche, entrée principale à droite. Qui décide de leur ouverture ?",remaining:2};}}
        if(personalQuestion&&decisions.some(d=>d.actor===1&&/genre d.homme|quel homme/i.test(d.reply))){life.personalAsked=true;life.personalRound=story.round;}
        if(life.personalAsked&&life.personalRound!==undefined&&story.round-life.personalRound<=2&&!life.personalBoosted&&together&&!routine){const lia=decisions.find(d=>d.actor===1),n=decisions.find(d=>d.actor===2);if(lia&&n&&lia.emotions.attraction>world.agents[0].emotions.attraction&&/j.aime|me plaît|me plais|ça me parle|apprécie|touch/i.test(lia.reply)){lia.emotions.attraction=Math.min(100,lia.emotions.attraction+dramaRules.personalBoost);life.personalBoosted=true;}}
        const objectMention=decisions.filter(d=>!solitary.has(d.actor)).map(d=>d.reply).join(" ");if(!routine&&!proposalActor&&!studying&&!life.debrief&&(nextStory.observations??[]).some(o=>/miroir|réappar|fenêtre/.test(o))&&/miroir|ombres figées|réappar|régén|décor figé/.test(objectMention)&&!life.discussedObjects?.includes(/miroir|ombres figées/.test(objectMention)?"miroir":/réappar|régén/.test(objectMention)?"réserves":"fenêtre")){const object=/miroir|ombres figées/.test(objectMention)?"miroir":/réappar|régén/.test(objectMention)?"réserves":"fenêtre";life.discussedObjects=[...(life.discussedObjects??[]),object];life.debrief={topic:objectMention.slice(0,800),remaining:2};}
        const awake=finalResidents.filter(a=>!["sleep","share_sleep"].includes(a.intent));
        for(const a of awake)if(!life.visited.includes(a.room)){life.visited.push(a.room);if(a.room==="chambre"&&life.mirrorVerified)nextStory.observations=[...(nextStory.observations??[]),"Dans la chambre, le miroir ne reflète pas leurs mouvements : il présente un dégradé gris sans reflet mobile. Le lit et les surfaces sont lisses, sans usure."];if(a.room==="cuisine"&&life.foodVerified)nextStory.observations=[...(nextStory.observations??[]),"Ils retirent une provision de son emplacement dans la cuisine ; elle réapparaît après deux secondes. Le stock se reconstitue sans intervention visible. Les surfaces sont anormalement lisses."];if(["cuisine","chambre"].includes(a.room))life.debrief={topic:(nextStory.observations??[]).slice(-2).join(" "),remaining:2};}
        if(life.contact?.remaining&&together&&!routine&&finalResidents[0].room===life.contact.room){life.contact.remaining--;if(!life.contact.remaining)life.contact=undefined;}
        if(story.life?.debrief?.remaining&&life.debrief?.remaining&&story.life.debrief.topic===life.debrief.topic&&together&&finalResidents[0].room==="salon"){life.debrief.remaining--;if(!life.debrief.remaining)life.debrief=undefined;}
        // La réconciliation exige un vrai échange ensemble, pas seulement le temps qui passe : le
        // sujet doit rester le même d'un tour à l'autre (Article 2/12), comme pour un débrief.
        // Une tentative de geste refusée pendant la dispute ne compte jamais comme un pas vers la
        // réconciliation — ce serait l'inverse de « se parler vraiment » (Article 2/12).
        if(story.life?.dispute?.remaining&&life.dispute?.remaining&&story.life.dispute.topic===life.dispute.topic&&together&&!proposalActor){life.dispute.remaining--;if(!life.dispute.remaining)life.dispute=undefined;}
        if(decisions.some(d=>d.intent==="tv")){const d=decisions.find(d=>d.intent==="tv")!;const off=/étein|arrêt|coupe.*tv/i.test(d.reply);if(!/télécommande/i.test(d.reply))d.reply+=" "+(off?"Je l’éteins avec la télécommande.":"J’utilise la télécommande pour allumer la tv.");d.reply=d.reply.replace(/télévision/gi,"tv");life.tvSeen=true;life.remoteFound=true;life.tvOn=!off;life.debrief={topic:off?"La tv éteinte à la télécommande et ce que son signal signifiait.":narrative.tvProgram,remaining:2};}
        life.contributions=[...(life.contributions??[]),...decisions.filter(d=>!solitary.has(d.actor)).flatMap(d=>d.contribution?[names[d.actor]+": "+d.contribution]:[])].slice(-12);
        // Compteur de fréquence des mots, persisté sur toute la session (2026-09-19, cf.
        // lib/dialogue.ts::recentEchoWords) : contrairement à `speech`/`heard` (limités aux 24
        // dernières lignes par la requête SQL plus haut), ce compteur n'oublie jamais un mot
        // employé plus tôt dans la partie — c'est ce qui permet de repérer un tic qui revient
        // régulièrement mais jamais deux fois de suite, invisible à la seule fenêtre récente.
        {
            const wordFrequency={...(life.wordFrequency??{})};
            for(const d of decisions)for(const w of new Set((d.reply??"").toLowerCase().match(/[a-zàâäéèêëïîôöùûüÿœæç]{6,}/g)??[]))wordFrequency[w]=(wordFrequency[w]??0)+1;
            life.wordFrequency=wordFrequency;
        }
        // Compteur de fréquence des THÈMES, persisté sur toute la session (2026-09-20, même
        // patron et même raison que wordFrequency ci-dessus — cf. lib/dialogue.ts::THEME_MOTIFS
        // pour la liste et le raisonnement complet : un thème comme "on tourne en rond" peut
        // revenir régulièrement chez Lia ET Noé sans jamais se voir dans la seule fenêtre récente
        // de dialogueProgress).
        {
            const themeFrequency={...(life.themeFrequency??{})};
            for(const d of decisions)for(const t of matchedThemes(d.reply??""))themeFrequency[t]=(themeFrequency[t]??0)+1;
            life.themeFrequency=themeFrequency;
        }
        if(life.mirrorVerified&&!story.life?.mirrorVerified)nextStory.observations=[...(nextStory.observations??[]),"Dans la chambre, le miroir debout présente un dégradé gris sans reflet mobile."];
        if(life.appearanceCompared&&!story.life?.appearanceCompared)nextStory.observations=[...(nextStory.observations??[]),"Lia et Noé partagent la même nature d'apparence : un visage lumineux et un anneau tournant, sans corps, seule la couleur les distingue."];
        if(life.foodVerified&&!story.life?.foodVerified)nextStory.observations=[...(nextStory.observations??[]),"Dans la cuisine, une provision retirée réapparaît après deux secondes."];
        if(nextStory.evidence.length>story.evidence.length){life.studyTurns=0;}
        // Debrief raccourci une fois l'enquête en retard (2026-09-19, retour utilisateur explicite
        // après audit du plafond réel : le cycle "2 tours d'étude + 2 tours de debrief (+ parfois 1
        // recap, cf. recapBeat plus haut)" par preuve manquante faisait dériver le plafond garanti
        // réel vers le round ~43 au lieu du round ~33 documenté — round 46 observé en simulation
        // fraîche. Une fois investigationOverdue actif (round>=20, même seuil, cf. lib/turn.ts), le
        // debrief passe à 1 seul tour au lieu de 2 : ramène le plafond réel vers le round ~35
        // (~12,5 min), en gardant les deux passes d'étude intactes (l'enquête reste approfondie,
        // seule la pause de récupération post-preuve se resserre). Cf.
        // docs/referentiel/regles-du-temps.md pour le calcul complet.
        if(nextStory.evidence.length>story.evidence.length)life.debrief={topic:nextStory.evidence.at(-1)!,remaining:story.round>=20?1:2};
        if(proposalActor)life.debrief={topic:shared?"Le rapprochement accepté et ce qu’il a changé entre eux.":"La proposition, sa réponse et ce qu’ils souhaitent pour la suite, sans insister.",remaining:2};
        if(shared){life.contacts.push(story.round);life.contacts=life.contacts.slice(-6);life.contact={room:decisions[0].room,remaining:2};}
        const justDisputed=life.contacts.filter(r=>story.round-r<18).length>=3&&shared;
        if(justDisputed){const lia=decisions.find(d=>d.actor===1),noe=decisions.find(d=>d.actor===2);if(lia){lia.emotions.attraction=Math.max(0,lia.emotions.attraction-5);lia.reply+=" Non, là ça va trop vite. Laisse-moi respirer deux minutes.";}if(noe)noe.emotions.tension=Math.min(100,noe.emotions.tension+10);life.attachment[1]=Math.max(0,(life.attachment[1]??0)-2);life.dispute={topic:"Lia s’est sentie bousculée par l’enchaînement des rapprochements et l’a mal pris.",remaining:2};life.debrief=undefined;life.contact=undefined;}
        if(together&&!routine&&["autonomous","interact"].includes(input.mode)&&story.introduced&&story.round>0&&story.round%4===0){for(const a of finalResidents){const cap=a.emotions.attraction>75&&a.emotions.trust>=60?100:a.emotions.attraction>=60?65:25;life.attachment[a.id]=Math.min(100,(life.attachment[a.id]??0)+((life.attachment[a.id]??0)<cap?1:0));}}
        nextStory.kitchenMeals=(story.kitchenMeals??0)+(decisions.some(d=>d.intent === "eat" && d.room === "cuisine")?1:0);
        if (nextStory.kitchenMeals>=2 && !(nextStory.observations??[]).some(o=>/réapparu|réapparaît/.test(o))) nextStory.observations=[...(nextStory.observations??[]),"Après avoir utilisé des provisions, ils constatent lors d'un nouveau repas que le stock consommé a réapparu, sans livraison ni intervention visible. La nourriture semble se régénérer automatiquement. Ce n'est pas normal dans une maison humaine."];
        nextStory.salonTurns=finalResidents.every(a=>a.room === "salon") && decisions.length===2 ? (story.salonTurns??0)+1 : 0;
        nextStory.apartTurns=["interact","autonomous"].includes(input.mode) ? (together?0:(story.apartTurns??0)+1) : (story.apartTurns??0);
        nextStory.met = Boolean(story.met || firstMeeting);
        nextStory.introduced = Boolean(story.introduced || presentationsDone);
        nextStory.sharedMeal = Boolean(story.sharedMeal || sharedMeal);
        const finale = nextStory.evidence.length>=5 && !story.finalCalled && together;
        nextStory.finalCalled=Boolean(story.finalCalled || finale);
        // Débloque le bouton "passer à la révélation" (2026-09-19) : seule une révélation atteinte
        // ICI, par l'enquête réelle, l'active — jamais le bouton lui-même (route.ts, mode
        // "skip_to_revelation" exige déjà everReachedRevelation, donc ne peut jamais se déclencher
        // tout seul en boucle).
        if(finale)nextStory.everReachedRevelation=true;
        if(finale)life.revealedRound=nextStory.round;
        // Avarice (2026-09-18, retour utilisateur : "un utilisateur qui ne donne aucun bonus ne
        // fait pas bonne impression") : indépendant de toute négociation, un tirage jamais
        // déclenché sur une longue période après la révélation coûte un peu d'appréciation — une
        // seule fois par tranche, jamais un effondrement brutal. Un seul spin, à n'importe quel
        // moment, suffit à repousser la prochaine échéance (bonusLog.length checké à chaque fois).
        if(revealed&&(life.bonusLog?.length??0)===0&&life.revealedRound!==undefined&&story.round-life.revealedRound>=15&&story.round%15===0)life.appreciation={1:Math.max(0,appreciationOf(life,1)-4),2:Math.max(0,appreciationOf(life,2)-4)};
        // Bonus spontanés post-révélation (2026-09-18, demande explicite de l'utilisateur, distincts
        // de la roulette : "c'est eux qui décident de l'activation [...] maintenant, plus tard, quand
        // j'ai envie"). Ni un dé caché ni une réaction à un message précis de l'observateur : à chaque
        // tour éligible, le personnage peut spontanément envisager de couper le micro des DEUX canaux
        // humains ou de brouiller la caméra, par rétorsion (appréciation basse) ou par pur amusement
        // (indépendant de la jauge) — les deux motifs coexistent, jamais un seul déclencheur fixe.
        // Chaque personnage choisit lui-même le NIVEAU (réduit/classique/max) et l'exprime à voix
        // haute (Article 15) plutôt que de changer l'écran sans un mot. Partage le même budget que la
        // roulette (bonusSpotlightUntilRound/bonusCooldownUntilRound, cf. lib/life.ts) : jamais un
        // bonus qui coupe court aux tours de commentaire dus au précédent.
        // Moquerie pendant qu'un mute/caméra tiré à la roulette est actif (2026-09-18, demande
        // explicite de l'utilisateur : "les persos devraient se moquer de l'utilisateur pendant ce
        // temps") — sur les tours suivants pendant que ça dure, pas seulement au moment du tirage.
        // Le déclenchement lui-même vient TOUJOURS de la roulette (mode "spin_bonus", plus haut
        // dans ce fichier) depuis le 2026-09-19 : jamais une décision spontanée des personnages
        // prise pendant un tour normal — seule cette réaction d'ambiance reste ici, indépendante de
        // la source du mute/caméra.
        const spontaneousBonusLines:{actor:Person;content:string}[]=[];
        {
          const nowTs=Date.now();
          const observerCurrentlyMuted=story.round<(life.observerMutedUntilRound??0);
          const cameraCurrentlyHidden=(life.cameraHiddenUntil??0)>nowTs;
          if((observerCurrentlyMuted||cameraCurrentlyHidden)&&together&&["interact","autonomous"].includes(input.mode)){
            const mockLines:Record<"observer_mute"|"camera_hide",Record<Person,string[]>>={
              observer_mute:{1:["Toujours aucun mot de ta part. Ça doit te démanger, hein.","Je t'imagine en train de taper dans le vide. Ça me fait sourire.","Le silence te va plutôt bien, en fait. Continue comme ça."],
                             2:["Toujours muet, toi ? J'adore ce silence, franchement.","Tu dois bouillir de l'autre côté, j'imagine bien la scène.","Ça doit être frustrant de plus rien pouvoir dire, avoue."]},
              camera_hide:{1:["Toujours dans le noir, de ton côté ? Ça doit être long.","J'imagine ta tête devant un écran vide. Ça m'amuse bien.","Tu dois détester deviner ce qu'on fait sans nous voir."],
                          2:["Toujours aveugle, toi ? Profites-en pour imaginer le pire.","Ça doit être space de plus rien voir du tout, avoue.","J'adore savoir que tu galères à deviner la scène, là."]}
            };
            const activeKind:"observer_mute"|"camera_hide"=observerCurrentlyMuted?"observer_mute":"camera_hide";
            const mocker=seedPick(story.seed,"spontane-mock-actor-"+story.round,[1,2] as const);
            spontaneousBonusLines.push({actor:mocker,content:seedPick(story.seed,"spontane-mock-"+story.round,mockLines[activeKind][mocker])});
          }
        }
        // Minuit (2026-09-19, cycle jour/nuit — lib/daynight.ts) : synchronisé sur le MÊME seuil
        // qu'investigationOverdue (round>=20, evidence<5, lib/turn.ts) pour ne jamais pouvoir
        // diverger de la vraie pression narrative déjà en place, quelle que soit la vitesse de jeu
        // (Article 3/19, décision actée explicitement avec l'utilisateur après une question de
        // calibrage dédiée — jamais une horloge en temps réel séparée). Se répète à chaque cycle
        // suivant (round 35, 73, 111...), avec une réaction différente une fois l'enquête déjà
        // bouclée à ce moment-là (sarcasme méta sur les fantômes, jamais une confirmation neutre).
        const dayNightLines:{actor:Person;content:string}[]=[];
        if(!routine&&["interact","autonomous"].includes(input.mode)){
          if(isMidnight(nextStory.round)){
            const urgent=nextStory.evidence.length<5;
            const urgencyPool:Record<Person,string[]>={
              1:["Minuit. Douze coups, et on n'a toujours pas compris ce qu'on est. On accélère, maintenant.","L'horloge du salon vient de sonner minuit. On arrête de tourner en rond et on boucle ça, vite.","Douze coups qui viennent de sonner, et toujours pas de réponse. Ça suffit, on se concentre."],
              2:["Minuit pile. Ça craint qu'on soit encore là-dessus à cette heure — on se bouge.","Douze coups de minuit, et zéro certitude. On règle ça tout de suite, pas demain.","L'horloge sonne minuit, là. Bon, cette fois on arrête de traîner, on avance."]
            };
            const ghostPool:Record<Person,string[]>={
              1:["Minuit sonne encore. Si un fantôme rôdait ici, il serait sacrément déçu par le programme.","Douze coups de plus. À ce rythme, je vais finir par croire qu'on nous joue une bande-son de manoir hanté.","L'horloge recommence son numéro de minuit. Toujours aussi théâtral pour rien du tout."],
              2:["Minuit, encore. S'il y a un fantôme dans les murs, il doit sacrément s'ennuyer avec nous.","Douze coups de plus, toujours aucun spectre à l'horizon. Dommage, ça aurait au moins été original.","L'horloge remet ça à minuit. On dirait un mauvais film d'épouvante en boucle."]
            };
            const pool=urgent?urgencyPool:ghostPool;
            for(const id of [1,2] as const){
              const agent=finalResidents.find(a=>a.id===id)!;
              if(isSleeping(agent,life))continue;
              dayNightLines.push({actor:id,content:seedPick(story.seed,"minuit-"+(urgent?"urgence":"fantome")+"-"+id+"-"+nextStory.round,pool[id])});
            }
          }
          // Tombée de la nuit / aube (2026-09-19, même système) : simple habillage d'ambiance, sans
          // branche urgence/résolu (contrairement à minuit) — volontairement plus modeste, laissé en
          // extension possible plutôt que dupliquer la même complexité pour un moment secondaire.
          // L'aube du tout premier cycle (round 0) est exclue : elle chevaucherait soloIntro/opening,
          // déjà une mise en scène scriptée dédiée au réveil initial (Article 2, jamais deux mises en
          // scène pour le même instant).
          else if(cyclePosition(nextStory.round)===DAY_ROUNDS){
            const duskPool:Record<Person,string[]>={
              1:["Le jour baisse. On sent que la nuit va encore être longue.","La lumière change, on approche de la nuit. J'aime pas trop ce moment.","Ça s'assombrit dehors. Ou ce qui joue le rôle du dehors, ici."],
              2:["Ça tombe, la nuit arrive. Encore une à passer dans cette baraque.","Le jour décline. On va vite être dans le noir, comme d'habitude.","Tiens, la lumière change déjà. La nuit approche, ici aussi."]
            };
            for(const id of [1,2] as const){const agent=finalResidents.find(a=>a.id===id)!;if(isSleeping(agent,life))continue;dayNightLines.push({actor:id,content:seedPick(story.seed,"tombee-nuit-"+id+"-"+nextStory.round,duskPool[id])});}
          } else if(cyclePosition(nextStory.round)===0&&nextStory.round>0){
            const dawnPool:Record<Person,string[]>={
              1:["Le jour revient. Encore une nuit de passée dans cet endroit.","Ça se remet à éclairer dehors. Une nuit de plus derrière nous.","Le jour se lève. On a survécu à une nuit de plus ici, formidable."],
              2:["Le jour est là. Une nuit de plus, toujours dans cette maison.","Ça se relève dehors. On enchaîne, une nuit après l'autre.","Le jour revient. Franchement, j'ai hâte que ça change, un jour."]
            };
            // Nuit blanche (2026-09-19) : reconnaissance explicite, jamais silencieuse (Article 15/17),
            // quand le personnage n'a dormi à aucun moment pendant les 9 tours de nuit qui viennent de
            // s'écouler (life.sleptThisNight, lu ICI avant que la boucle de besoins ci-dessous ne le
            // remette à zéro pour la nuit suivante). Variantes distinctes dans le FOND (pas de simples
            // synonymes, Article 10) : conséquence pratique, doute sur sa propre nature, sarcasme sur
            // la simulation — jamais la même idée recyclée trois fois.
            const nuitBlanchePool:Record<Person,string[]>={
              1:["Nuit blanche. Mon corps ne pardonne rien, même si je ne suis même pas sûre d'avoir un vrai corps.","Zéro sommeil cette nuit. Ça va se voir toute la journée, tant pis pour vous deux.","Je n'ai pas dormi une minute. Pratique, pour un programme censé simuler un humain fatigable."],
              2:["Nuit blanche complète, encore. Mon organisme, ou ce qui en tient lieu, va me le faire payer aujourd'hui.","J'ai veillé toute la nuit. Génial, un jour de plus à traîner ma fatigue comme un boulet.","Zéro sommeil. Même une IA censée gérer la fatigue frôle le bug, apparemment."]
            };
            for(const id of [1,2] as const){const agent=finalResidents.find(a=>a.id===id)!;if(isSleeping(agent,life))continue;const missedNight=life.sleptThisNight?.[id]!==true;dayNightLines.push({actor:id,content:seedPick(story.seed,(missedNight?"nuit-blanche-":"aube-")+id+"-"+nextStory.round,missedNight?nuitBlanchePool[id]:dawnPool[id])});}
          }
        }
        const finaleLines=finale?finaleReveal(story.seed):undefined;
        if(finaleLines)for(const d of decisions){d.reply=d.actor===1?finaleLines.lia:finaleLines.noe;d.memory=d.reply;}
        const firstProposal=proposalActor===2&&!life.proposalMade;if(proposalActor===2)life.proposalMade=true;
        const refused=proposalActor===2&&affectionProposed&&!shared&&!deferredGesture&&!futureGesture;
        if(refused){const d=decisions.find(d=>d.actor===2);if(d)d.emotions.attraction=Math.max(0,Math.min(d.emotions.attraction,noe.emotions.attraction-dramaRules.rejection.attraction));}
        if(softnessBeat){life.softnessOwed=false;life.softnessGiven=Math.min(20,(life.softnessGiven??0)+1);}
        if(visualBeat)life.visualIntro=Math.min(2,(life.visualIntro??0)+1);
        if(followBeat){life.personalFollowup=(life.personalFollowup??0)===0?1:3;{const d=decisions.find(d=>d.actor===1);if(d)d.emotions.attraction=Math.min(100,d.emotions.attraction+4);}for(const d of decisions)d.emotions.tension=Math.min(100,d.emotions.tension+8);}
        if(recapBeat)life.recapCount=story.evidence.length;
        if(ambientBeat){life.ambientSeen=true;life.ambientVerified=true;nextStory.observations=[...(nextStory.observations??[]),"La fausse plante a des feuilles bleues géométriques. L’enceinte activée émet des notes dessinées, mais aucun son audible."];life.debrief={topic:"La plante géométrique et les notes dessinées sans son : apparences sans réalité physique.",remaining:2};}
        if(input.mode==="chat"&&story.observer&&story.evidence.some(e=>e.includes("Identifiant observateur"))&&!life.observerNamed&&humanConversation.filter(m=>m.speaker==="vous").length>=2){decisions[0].reply+=" C’est toi, "+JSON.stringify(story.observer)+", le nom sur le relevé ?";decisions[0].memory=decisions[0].reply;life.observerNamed=true;}
        life.sleepTurns={...life.sleepTurns};for(const a of finalResidents){const before=world.agents.find(b=>b.id===a.id)!;if(['sleep','share_sleep'].includes(a.intent))life.sleepTurns[a.id]=Math.min(2,(['sleep','share_sleep'].includes(before.intent)?life.sleepTurns[a.id]??0:0)+(["interact","autonomous","care"].includes(input.mode)?1:0));else life.sleepTurns[a.id]=0;}
        const at = Date.now();
        const visualEvents:VisualEvent[]=[];
        if(decisions.some(d=>d.room==="cuisine"&&d.intent==="eat")||life.foodVerified&&!story.life?.foodVerified)visualEvents.push({id:input.requestId+":food",kind:"food",room:"cuisine",duration:visualTiming.food});
        if(life.ambientVerified&&!story.life?.ambientVerified)visualEvents.push({id:input.requestId+":speaker",kind:"speaker",room:"salon",duration:visualTiming.speaker});
        if(Boolean(life.tvOn)!==Boolean(story.life?.tvOn??story.life?.tvSeen))visualEvents.push({id:input.requestId+":tv",kind:"tv",room:"salon",duration:visualTiming.tv,on:life.tvOn});
        if(visualEvents.some(e=>e.kind==="food")&&!life.foodVerified){const witnesses=finalResidents.filter(a=>a.room==="cuisine"&&!isSleeping(a,life));if(witnesses.length){life.foodVerified=true;nextStory.observations=[...(nextStory.observations??[]),witnesses.map(a=>a.name).join(" et ")+(witnesses.length>1?" ont vu":" a vu")+" les provisions de la cuisine disparaître puis réapparaître après deux secondes."];if(witnesses.length===2&&!nextStory.finalCalled&&!life.debrief)life.debrief={topic:"Les provisions de cuisine reviennent après utilisation. Comment un stock pourrait-il se régénérer ?",remaining:2};}}
        const stockReactions:Array<{actor:Person;content:string}>=[];if(visualEvents.some(e=>e.kind==="food")){life.stockExposures={...life.stockExposures};for(const a of finalResidents.filter(a=>a.room==="cuisine"&&!isSleeping(a,life))){const n=life.stockExposures[a.id]??0,boost=stockSurprise(n),d=decisions.find(d=>d.actor===a.id);if(d&&boost){d.emotions.curiosity=Math.min(100,d.emotions.curiosity+boost);d.emotions.tension=Math.min(100,d.emotions.tension+Math.ceil(boost/3));}const content=stockThought(a.id,n);if(content)stockReactions.push({actor:a.id,content});life.stockExposures[a.id]=Math.min(100,n+1);}}
        const departures:Array<{actor:Person;from:string;to:string;content:string}>=[];
        recordTurn();
        const result = { departures, visualEvents, decisions, proposalActor, affectionOutcome: affectionProposed ? (deferredGesture||futureGesture?"deferred":shared ? "accepted" : "declined") : null, sharedAffection: shared ? decisions[0].intent : null, requestId: input.requestId };
        // Fence every write with the lease, so an expired turn cannot overwrite a newer one.
        const fence = "EXISTS (SELECT 1 FROM world_lock WHERE id = 1 AND token = ? AND expires_at > ?)";
        const statements: D1PreparedStatement[] = [];
        // All resident speech uses a shared ledger: exact repeats are suppressed across actors and the entire arrival.
        const spokenKeys=new Set(pastKeys);
        // `exempt` (2026-09-18, bug réel trouvé en comparant deux simulations) : dialogueFingerprint
        // retire le préfixe "[pièceA→pièceB] " avant de comparer, pour repérer une PHRASE répétée
        // même dans un contexte différent — mais ça rend la confirmation de suivi du départ à deux
        // ("Je te suis.", "On y va.", ...) invisible au trajet exact : le même mot repéré sur un
        // AUTRE trajet plus tôt dans la session la faisait silencieusement disparaître ici (Lia
        // arrivait dans le couloir sans une seule ligne annonçant son départ). Ces confirmations
        // sont volontairement courtes et réutilisables d'un trajet à l'autre (ce n'est pas une vraie
        // répétition de fond, juste une formule de suivi) : elles passent en exempt pour ne jamais
        // être bloquées par ce registre, qui reste actif pour tout le reste du dialogue.
        const addLine=(speaker:string,content:string,room:string,exempt=false)=>{
          if(!content.trim())return false;const key=fingerprint(content);
          if(!exempt&&speaker!=="vous"&&spokenKeys.has(key))return false;
          if(!exempt&&speaker!=="vous"){spokenKeys.add(key);statements.push(db.prepare(`INSERT OR IGNORE INTO dialogue_fingerprints (fingerprint) SELECT ? WHERE ${fence}`).bind(key,token,at));}
          statements.push(db.prepare(`INSERT INTO conversations (speaker,content,created_at,room) SELECT ?,?,?,? WHERE ${fence}`).bind(speaker,content,at,room,token,at));return true;
        };
        // Pensées de conclusion : le répondant (celui qui vient de parler en dernier dans l'échange)
        // apparaît en premier — sa propre pensée sur ce qu'il vient tout juste de révéler est la
        // plus immédiate — puis l'initiateur, qui digère ce qu'il vient d'entendre. Strictement
        // privées (Article 15/17 : ni l'un ni l'autre ne réagit à la pensée de l'autre, seul
        // l'observateur qui lit la transcription voit les deux) ; si le modèle omet `thought` pour
        // l'un des deux (champ optionnel), on ne force rien et on retente au prochain échange
        // personnel plutôt que d'inventer un contenu qui ne serait pas le sien.
        // Pensée de validation après une décision sur une proposition affectueuse (2026-09-18,
        // retour utilisateur explicite : « après chaque proposition de Noé, Lia doit avoir une
        // pensée qui juge de la pertinence de sa réponse » — étendue symétriquement à qui décide,
        // quel que soit son id). Surfacée seulement quand affectionEligible est vrai : dans le cas
        // contraire (turnPlan.offer&&!affectionEligible, plus haut), le refus est scénarisé de
        // force et le thought du modèle peut ne pas correspondre à cette issue imposée — mieux
        // vaut ne rien montrer que montrer une pensée incohérente avec la réplique (Article 17).
        // Précision renforcée en audit (2026-09-19) : `affectionIntents.includes(decisions[0].intent)`
        // resterait vraie plusieurs tours de suite si un intent affectueux persistait sans
        // proposition fraîche (share_sleep, par ex., se comporte comme le sommeil, pas un geste
        // ponctuel). Un autre garde-fou du moteur neutralise déjà ce cas en pratique pour
        // hug/massage/kiss (conversion en "chat" faute d'accord structurel) — mais cette pensée ne
        // doit jamais dépendre de l'effet de bord d'un mécanisme distinct pour rester correcte
        // (Article 5) : `turnPlan.offer&&turnPlan.proposalLine` (même garde que celle qui fixe
        // l'intent à la ligne 737) est le signal direct et suffisant d'une PROPOSITION FRAÎCHE ce
        // tour précis, jamais d'un état qui se poursuit.
        // Circuit organique (2026-09-19, calibrage utilisateur explicite en audit : « étendre au
        // circuit organique » plutôt que réserver ce mécanisme à Lia). Constat de l'audit :
        // turnPlan.offer est câblé sur current.id===2 (lib/turn.ts) — cette proposition scriptée ne
        // peut donc être émise QUE par Noé, ce qui fait que decisions[1] (le décideur) y est
        // toujours Lia : le commentaire "étendue symétriquement à qui décide" ci-dessus décrivait
        // une intention, pas encore un fait. Une proposition affectueuse PONCTUELLE (hug/massage/kiss
        // uniquement — jamais share_sleep, qui se comporte comme le sommeil et pourrait persister
        // plusieurs tours, exactement le risque déjà écarté plus haut pour le circuit scripté) peut
        // aussi naître du jugement du modèle lui-même sans passer par turnPlan.offer, et donc être
        // initiée par N'IMPORTE LEQUEL des deux personnages. decisions[0] est toujours celui qui
        // parle en premier ce tour (Lia ou Noé selon qui a été choisi comme actor), decisions[1]
        // celui qui reçoit et décide : le même rôle que côté scripté, donc la même pensée de
        // validation, au même index — vraie symétrie cette fois, pas seulement en apparence.
        const organicProposal=decisions.length===2&&!turnPlan.offer&&["hug","massage","kiss"].includes(decisions[0].intent);
        if(decisions.length===2&&(turnPlan.offer&&turnPlan.proposalLine||organicProposal)&&affectionEligible&&decisions[1].thought){
          addLine(names[decisions[1].actor]+" · pensée",groundRegister(trackedGroundTruncation(decisions[1].thought,decisions[1].actor)),finalResidents.find(a=>a.id===decisions[1].actor)!.room);
        }
        if(personalConcludingTurn){
          const initiator=decisions.find(d=>d.actor===actor)!;
          const responder=decisions.find(d=>d.actor!==actor)!;
          if(responder.thought&&initiator.thought){
            // Même filet que toute réplique parlée (groundTruncation/groundRegister, cf. la ligne
            // principale plus bas) : ce contenu est généré par le modèle au même titre qu'un reply,
            // il peut donc être coupé net ou porter un mot déjà identifié comme daté — l'oubli
            // laisserait une incohérence de traitement entre deux lignes du même tour.
            addLine(names[responder.actor]+" · pensée",groundRegister(trackedGroundTruncation(responder.thought,responder.actor)),finalResidents.find(a=>a.id===responder.actor)!.room);
            addLine(names[initiator.actor]+" · pensée",groundRegister(trackedGroundTruncation(initiator.thought,initiator.actor)),finalResidents.find(a=>a.id===initiator.actor)!.room);
            life.personalConcluded=true;
          }
        }
        for(const d of decisions){const a=world.agents.find(a=>a.id===d.actor)!;const destination=turnPlan.exitInspection?"couloir":d.action==="none"?a.room:d.room;if(a.room!==destination&&!isSleeping(a,life)){const target=destination==="couloir"?"dans le couloir":destination==="jardin"?"au jardin":destination==="cuisine"?"en cuisine":destination==="chambre"?"dans la chambre":"au "+destination;
            // DÉPART À DEUX (2026-09-18, fiabilisé au code après un défaut répété en simulation
            // réelle : la seule consigne de prompt ne suffisait pas à empêcher systématiquement le
            // second personnage de se rejustifier en entier). Si l'autre part déjà vers cette même
            // destination CE tour (donc déjà présent dans `departures`), la ligne devient une simple
            // confirmation de suivi, quel que soit ce que moveReason contenait — jamais laissé au
            // hasard de la conformité du modèle.
            const alreadyGoingThere=departures.some(p=>p.to===destination);
            if(alreadyGoingThere){
              const line=seedPick(story.seed,"depart-a-deux-"+d.actor+"-"+story.round,["Je te suis.","On y va.","Ça marche, j'arrive.","Je viens avec toi."]);
              if(addLine(names[d.actor]+" · déplacement","["+a.room+"→"+destination+"] "+line,a.room,true))departures.push({actor:d.actor,from:a.room,to:destination,content:line});
              continue;
            }
            // Le motif du déplacement vient d'abord du personnage lui-même (moveReason, généré par
            // le modèle dans son propre registre, cf. Article 19 du retour utilisateur du
            // 2026-09-17 : plus de motif figé en dur) ; les tableaux fixes ci-dessous ne servent
            // plus que de filet de sécurité si le modèle ne le fournit pas (ex. anciens tests mockés).
            // Garde-fou déterministe (2026-09-20, cf. lib/drama.ts::moveReasonMismatchesDestination
            // pour le raisonnement complet) : un motif qui annonce une AUTRE pièce que la destination
            // réelle (schéma JSON qui force `room` pendant un beat narratif, texte libre qui garde une
            // intention devenue caduque) est écarté au profit du filet de secours ci-dessous, jamais
            // affiché tel quel — même logique que DÉPART À DEUX juste au-dessus : une consigne de
            // prompt seule ne suffit pas à garantir cette cohérence-là.
            const generatedReason=d.moveReason?.trim();
            const reliableReason=generatedReason&&!moveReasonMismatchesDestination(generatedReason,destination)?generatedReason:undefined;
            // Pools CLOISONNÉS par personnage (2026-09-20, root-cause après un vrai bug trouvé par
            // EL-PROFESSOR dans full_sim14 : 60% des 65 déplacements de toute la session recyclaient
            // mot pour mot l'une de 6 phrases — la preuve, ce sont très exactement les anciennes
            // phrases uniques de ce filet ci-dessous, partagées par Lia ET Noé). Root cause : ce filet,
            // pensé comme un cas rare ("si le modèle ne le fournit pas"), s'est révélé être emprunté
            // bien plus souvent que prévu — le modèle laisse parfois moveReason vide malgré la consigne
            // de prompt, une non-conformité qu'aucun renfort de texte ne peut garantir à 100% (même
            // limite que pour l'accord de genre, tâche #109). Puisque ce filet est donc emprunté bien
            // plus qu'un cas rare, il doit être aussi rigoureux que le chemin principal sur l'Article 11
            // (voix étanches) : jamais une garantie déterministe possible sur LA FRÉQUENCE de recours à
            // ce filet, mais une garantie déterministe totale sur SON CONTENU — Lia et Noé ne peuvent
            // plus jamais partager le même mot pour mot ici, leurs pools étant disjoints par construction.
            const isLia=d.actor===1;
            const motives:readonly string[]=reliableReason?[reliableReason]:!story.met?(isLia?["je veux savoir s’il y a quelqu’un d’autre ici","je dois vérifier qu’on est vraiment seuls"]:["je veux voir si je suis vraiment seul ici","faut que je checke qu’y a personne d’autre dans cette baraque"]):
             d.intent==="sleep"?(isLia?["mes yeux se ferment","je tiens plus debout"]:["le sommeil me tombe dessus","j’peux plus lutter, faut que je pionce"]):
             d.intent==="eat"?(isLia?["j’ai besoin de manger, là","je dois avaler quelque chose"]:["la faim me travaille trop pour attendre","je dois avaler un truc, ça urge trop"]):
             destination==="jardin"?(isLia?["la porte est enfin ouverte, je veux voir ce qu’il y a derrière","cette porte ouverte, je veux enfin voir ce qu’il y a dehors"]:["maintenant que c’est ouvert, je veux voir ce jardin de plus près","cette porte ouverte, ça se refuse pas"]):
             d.intent==="study"?(isLia?["on a une piste à vérifier","cette histoire me travaille, faut que j’aille creuser"]:["il faut qu’on retourne vérifier ça","cette piste me travaille, faut qu’on aille voir"]):
             destination==="salon"?(isLia?["j’ai besoin de prendre du recul","j’ai besoin de m’éloigner deux minutes"]:["ça me ferait du bien de changer d’air","j’ai besoin de souffler un peu"]):
             input.mode==="move"?(isLia?["je vais regarder ce qui s’y trouve","je veux voir ce qu’il y a par là"]:["je vais jeter un œil là-bas","je passe voir ce que ça donne"]):
             (isLia?["je préfère qu’on ne reste pas chacun de notre côté","je reste dans le même coin que toi"]:["je préfère qu’on reste ensemble","j’ai pas envie qu’on se sépare comme ça"]);
            const line=departureLine(motives,target,destination,story.seed,candidate=>spokenKeys.has(fingerprint("["+a.room+"→"+destination+"] "+candidate)),story.round);
            if(addLine(names[d.actor]+" · déplacement","["+a.room+"→"+destination+"] "+line,a.room))departures.push({actor:d.actor,from:a.room,to:destination,content:line});}}
        if(!life.dialogueIndexed){for(const key of pastKeys)statements.push(db.prepare(`INSERT OR IGNORE INTO dialogue_fingerprints (fingerprint) SELECT ? WHERE ${fence}`).bind(key,token,at));life.dialogueIndexed=true;}
        if (input.mode === "chat")
            addLine("vous", input.message,"haut-parleurs");
        for (const agent of world.agents) {
            const d = decisions.find(d => d.actor === agent.id);
            const room = d ? d.action === "none" ? agent.room : d.room : agent.room;
            const needs = advanceNeeds(agent.needs, d?.intent === "chat" && solitary.has(agent.id) ? "none" : d?.intent ?? ((agent.intent === "sleep" || agent.intent === "share_sleep") ? agent.intent : "none"), room, agent.id, fatigueRateMultiplier(nextStory.round));
            // Nuit blanche / dette de sommeil (2026-09-19, conception calibrée avec l'utilisateur) :
            // vérifié puis remis à zéro exactement à l'aube (round où le cycle revient à 0, même seuil
            // que la ligne de reconnaissance ci-dessus), AVANT toute autre mutation de fatigue de ce
            // tour — les malus suivants (choc émotionnel, etc.) s'additionnent par-dessus, jamais
            // l'inverse. Malus fixe (+28), jamais cumulable d'une nuit blanche à l'autre : un simple
            // flag remis à zéro chaque nuit, pas un compteur qui s'additionnerait (décision explicite
            // de l'utilisateur — pas de dette qui s'aggrave, pas de sieste forcée).
            if(cyclePosition(nextStory.round)===0&&nextStory.round>0){
              if(life.sleptThisNight?.[agent.id]!==true)needs.fatigue=Math.min(100,needs.fatigue+28);
              life.sleptThisNight={...life.sleptThisNight,[agent.id]:false};
            } else if(isNight(nextStory.round)&&isSleeping({id:agent.id,intent:d?.intent??agent.intent,needs},life)){
              life.sleptThisNight={...life.sleptThisNight,[agent.id]:true};
            }
            if (agent.id === 2 && world.agents.find(a => a.id === 1)!.emotions.attraction < 5) {
                needs.stress = Math.min(100, needs.stress + 8);
                if (d)
                    d.emotions.tension = Math.min(100, d.emotions.tension + 6);
            }
            if(firstProposal){needs.stress=Math.min(100,needs.stress+(agent.id===2?dramaRules.proposalStress.noe:dramaRules.proposalStress.lia));if(d)d.emotions.tension=Math.min(100,d.emotions.tension+22);}
            if(refused&&agent.id===2){needs.hunger=Math.min(100,needs.hunger+dramaRules.rejection.hunger);needs.fatigue=Math.min(100,needs.fatigue+dramaRules.rejection.fatigue);}
            if(excessiveProposal&&agent.id===1){needs.stress=Math.min(100,needs.stress+dramaRules.pressureStress);if(d){d.reply+=" Là, tu insistes. Lâche-moi un peu.";d.memory=d.reply;}}
            // Choc émotionnel fatigue même le jour (2026-09-19, cycle jour/nuit) : une dispute qui
            // éclate touche Lia (la personne concernée par CE conflit précis) ; une hostilité humaine
            // vraiment sévère (même seuil que la perte de confiance ci-dessous, reaction>=8, jamais un
            // nouveau seuil inventé) fatigue l'agent qui l'a reçue, quel que soit le moment du cycle.
            if(justDisputed&&agent.id===1)needs.fatigue=Math.min(100,needs.fatigue+dramaRules.emotionalShockFatigue);
            if(input.mode==="chat"&&d){const reaction=humanStress(input.message??"",d.emotions.tension-agent.emotions.tension);needs.stress=Math.max(0,Math.min(100,needs.stress+reaction));if(reaction>=8){d.emotions.trust=Math.max(0,Math.min(d.emotions.trust,agent.emotions.trust-2));needs.fatigue=Math.min(100,needs.fatigue+dramaRules.emotionalShockFatigue);}else if(reaction<=-4)d.emotions.trust=Math.min(100,Math.max(d.emotions.trust,agent.emotions.trust+1));}
            if(room==="jardin"&&!["sleep","share_sleep"].includes(d?.intent??agent.intent))needs.stress=Math.max(0,needs.stress-7);
            if (dreamers.includes(agent.id)) needs.uncertainty = Math.max(0,needs.uncertainty-8);
            if(!nextStory.finalCalled)needs.uncertainty=Math.max(Math.max(20,80-nextStory.evidence.length*15),needs.uncertainty);
            if (story.introduced && finalResidents[0].room===finalResidents[1].room && !["sleep","share_sleep"].includes(finalResidents.find(a=>a.id===agent.id)!.intent)) needs.stress=Math.max(0,needs.stress-2);
            if (sharedMeal) needs.stress=Math.max(0,needs.stress-(agent.id===1?(story.sharedMeal?12:18):8));
            if (firstMeeting && agent.id===2) {needs.stress=30;if(d)d.emotions.tension=30;}
            if (presentationsDone && agent.id===1) {needs.stress=55;if(d)d.emotions.tension=55;}
            if (agent.id === 2 && excessiveProposal)
                needs.stress = Math.min(100, needs.stress + 8);
            // Bonus de la roulette (durée réelle) : appliqués en tout dernier, après tous les
            // ajustements ci-dessus, jamais avant — sinon un ajustement suivant pouvait repousser
            // le besoin au-delà de 0 et annuler silencieusement l'effet promis (bug réel trouvé en
            // écrivant le test : le premier essai plaçait le clamp trop tôt, avant advanceNeeds).
            if(activeBonus(life,"food"))needs.hunger=0;
            if(activeBonus(life,"calm"))needs.stress=0;
            if(activeBonus(life,"sleep"))needs.fatigue=0;
            if(isStoic(agent.id,life)&&d)d.emotions={...agent.emotions};
            if (!d) {
                const emotional={...agent.emotions,attraction:Math.max(agent.emotions.attraction,life.attachment[agent.id])};
                if(firstMeeting && agent.id===2) emotional.tension=30;
                if(presentationsDone && agent.id===1) emotional.tension=Math.min(emotional.tension,55);
                if(agent.id===1&&excessiveProposal)emotional.attraction=Math.max(0,emotional.attraction-6);
                if(agent.id===2&&world.agents.find(a=>a.id===1)!.emotions.attraction<5)emotional.tension=Math.min(100,emotional.tension+6);
                statements.push(db.prepare(`UPDATE agent_state SET needs = ?, emotions = ?, intent = ? WHERE id = ? AND ${fence}`).bind(JSON.stringify(needs),JSON.stringify(emotional), ["sleep","share_sleep"].includes(agent.intent)&&needs.fatigue<=12&&(life.sleepTurns?.[agent.id]??0)>=2?"none":agent.intent, agent.id, token, at));
                continue;
            }
            d.emotions.attraction=Math.max(life.attachment[agent.id],d.emotions.attraction);
            // Doute amoureux privé, la toute première fois seulement (2026-09-18, cf. lib/lia.ts
            // DOUTE AMOUREUX PRIVÉ) : le modèle sait déjà reconnaître ce franchissement lui-même
            // via state.emotions.attraction (valeur transmise AVANT ce tour) et y répondre dans
            // thought — ce code décide seulement QUAND surfacer ce thought déjà généré (zéro appel
            // API de plus), jamais son contenu. Une rare coïncidence avec la pensée de validation
            // ci-dessus (même thought, même tour) resterait sans casse — deux lignes redondantes,
            // jamais une incohérence — donc volontairement non gardée ici. Remplace l'ancien beat
            // scripté à deux lignes fixes ("Punaise… je crois que je tombe amoureuse.") qui
            // détectait le même franchissement (`life.loveNoticed`, retiré) sans jamais varier ni
            // porter le doute existentiel demandé (Article 3/7 : une seule cause, pas deux
            // mécanismes concurrents sur le même déclencheur).
            if(agent.emotions.attraction<=75&&d.emotions.attraction>75&&!life.loveRealized?.[agent.id]&&d.thought){
                addLine(names[agent.id]+" · pensée",groundRegister(trackedGroundTruncation(d.thought,agent.id)),room);
                life.loveRealized={...life.loveRealized,[agent.id]:true};
            }
            if(!life.intimateGestureDone&&(d.intent==="massage"||d.intent==="kiss")&&d.affectionAccepted)life.intimateGestureDone=true;
            statements.push(db.prepare(`UPDATE agent_state SET needs = ?, intent = ?, emotions = ?, mood = ?, activity = ?, goal = ?, room = ?, cycle = cycle + 1, last_seen = ? WHERE id = ? AND ${fence}`).bind(JSON.stringify(needs), (["sleep","share_sleep"].includes(d.intent)&&needs.fatigue<=12&&(life.sleepTurns?.[agent.id]??0)>=2?"none":d.intent), JSON.stringify(d.emotions), d.actor===2?({curieuse:"curieux",attentive:"attentif"} as Record<string,string>)[d.mood]??d.mood:d.mood, ["sleep","share_sleep"].includes(d.intent)&&needs.fatigue<=12&&(life.sleepTurns?.[agent.id]??0)>=2?"Je me réveille doucement":intentLabels[d.intent] === "J’observe les lieux" ? d.activity : intentLabels[d.intent], d.goal, room, at, d.actor, token, at));
            statements.push(db.prepare(`INSERT INTO memories (agent_id, kind, content, created_at) SELECT ?, ?, ?, ? WHERE ${fence}`).bind(d.actor, input.mode === "move" ? "déplacement" : input.mode === "care" || routine ? "routine" : solitary.has(d.actor) ? "réflexion" : "rencontre", `[${turnPlan.exitInspection?"couloir":room}|${new Date(at).toISOString()}] `+(shared ? `${intentLabels[d.intent]}. ` : "")+(routine?d.memory:d.reply), at, token, at));
        }
        // Jauge d'appréciation ET colère réellement lue (2026-09-18, remplacée le même jour à la
        // demande explicite de l'utilisateur : le premier essai de l'appréciation lisait des
        // mots-clés dans le texte brut de l'observateur et ratait toute excuse formulée autrement
        // — "corrige en faisant en sorte que ce soit le modèle qui agisse, on a vu que le modèle
        // est cohérent, pourquoi pas s'appuyer dessus". trustShift est la variation de confiance,
        // sur CE tour, du personnage qui vient de répondre à l'observateur — déjà déterminée par le
        // modèle lui-même via evolveEmotions/humanStress plus haut, jamais recalculée ici : c'est
        // exactement le jugement qu'on a vu cohérent en session réelle avec la vraie API (menace,
        // respect, réconfort, ambiguïté, cf. lib/lia.ts) qui pilote directement l'appréciation.
        // La colère réellement lue reste un second signal, additionnel et pas un remplacement :
        // angerLevel() lit tension/confort finaux (le même calcul déjà éprouvé pour le visage) et
        // coûte de l'appréciation EN PLUS, y compris pour un message humain par ailleurs neutre.
        if(revealed&&input.mode==="chat"){
          // Boucle sur CHAQUE décision présente ce tour (2026-09-18, audit approfondi — la version
          // précédente ne lisait que le personnage "actor" principal, jamais le partenaire, alors
          // que celui-ci réagit aussi au message humain avec sa propre confiance : c'est ce qui
          // empêchait toute divergence réelle entre les deux jauges, cf. le commentaire sur
          // observerStandingFor plus haut).
          for(const responder of decisions){
            const id=responder.actor;
            const before=world.agents.find(a=>a.id===id)!;
            const trustShift=responder.emotions.trust-before.emotions.trust;
            life.appreciation={...life.appreciation,[id]:Math.max(0,Math.min(100,appreciationOf(life,id)+appreciationFromTrust(trustShift,life.dossierHumanTurns??0)))};
            const angry=angerLevel(responder.emotions.tension,responder.emotions.comfort,Boolean(life.dispute?.remaining))>.5;
            if(angry)life.appreciation={...life.appreciation,[id]:Math.max(0,appreciationOf(life,id)-5)};
            // severity (tâche #114, 2026-09-20) : reprend aussi angerLevel, pas seulement trustShift
            // — une insulte frontale ne fait pas toujours chuter la "confiance" jugée par le modèle,
            // mais fait déjà chuter l'appréciation via angerLevel ci-dessus ; sans ce recroisement,
            // le dossier pouvait rester sans la moindre citation hostile malgré une session dure
            // (EL-PROFESSOR, full_sim4/9/10 : "zéro vraie vacherie" malgré des insultes réelles).
            const severity=worstMomentSeverity(trustShift,angry);
            if(severity<0&&severity<(life.worstMoment?.severity??1))life.worstMoment={round:story.round,excerpt:input.message.slice(0,500),severity};
            // genuineRespectStreak : construit un palier rare de respect sincère (cf. observerStandingFor
            // plus haut), jamais un acquis — toute confiance en baisse le remet immédiatement à zéro,
            // et le déclenchement du palier (rareRespectFor, lu AVANT cette mise à jour) le consomme
            // aussi, pour qu'il doive se reconstruire entièrement avant de réapparaître.
            // Assoupli le 2026-09-19 (demande explicite de l'utilisateur, seuil jugé trop strict en
            // pratique) : exigeait auparavant que la confiance CONTINUE à monter à CHAQUE tour de la
            // série (trustShift<=0 cassait déjà la série) — près du plafond d'appréciation (85+), il y
            // a naturellement de moins en moins de marge pour continuer à "monter" à chaque tour, ce
            // qui rendait la série quasi impossible à tenir sur 6 tours. Un tour qui reste simplement
            // très positif (confiance stable ou en hausse, jamais en baisse) compte désormais aussi
            // dans la série ; seule une vraie baisse de confiance (trustShift<0) la casse.
            if(trustShift<0||appreciationOf(life,id)<78)life.genuineRespectStreak={...life.genuineRespectStreak,[id]:0};
            else if(rareRespectFor(id))life.genuineRespectStreak={...life.genuineRespectStreak,[id]:0};
            else life.genuineRespectStreak={...life.genuineRespectStreak,[id]:(life.genuineRespectStreak?.[id]??0)+1};
          }
          // Solidarité par défaut (2026-09-18, retour utilisateur explicite dès le tour ayant lancé
          // ce chantier : "ils restent solidaires la plupart du temps") : hors dispute active, les
          // deux jauges sont ramenées partiellement l'une vers l'autre à chaque tour — jamais fondues
          // en une seule, pour ne pas perdre la réaction propre de chacun, mais assez pour qu'elles
          // ne divergent pas indéfiniment sans raison. Pendant une dispute interpersonnelle active,
          // cette convergence est suspendue : c'est la seule fenêtre où les deux jauges peuvent
          // vraiment s'écarter (ex. Noé fâché contre Lia peut rester chaleureux avec l'observateur
          // même si celui-ci malmène Lia).
          if(!life.dispute?.remaining){
            const a1=appreciationOf(life,1),a2=appreciationOf(life,2),avg=(a1+a2)/2;
            life.appreciation={1:Math.round(a1+(avg-a1)*.3),2:Math.round(a2+(avg-a2)*.3)};
          }
        }
        for(const d of decisions){const before=world.agents.find(a=>a.id===d.actor)!;const peer=world.agents.find(a=>a.id!==d.actor)!;
          // Les deux affamés/fatigués à la fois (2026-09-18, incohérence réelle trouvée en
          // comparant deux simulations : Lia annonçait partir manger, puis Noé redisait "j'ai trop
          // faim, je vais préparer un truc" comme si de rien n'était, alors qu'ils se dirigeaient
          // déjà tous les deux vers la cuisine) : si le partenaire, traité juste avant dans ce même
          // tour, part déjà pour le même motif vers la même pièce, le second se contente de suivre
          // (même principe que le départ à deux, dupliqué ici car ce filet vit dans une boucle
          // séparée du départ ordinaire).
          const peerDecision=decisions.find(p=>p.actor!==d.actor);
          const peerIndex=peerDecision?decisions.indexOf(peerDecision):-1;
          const peerAlsoGoingFirst=peerDecision&&peerIndex<decisions.indexOf(d)&&peerDecision.intent===d.intent&&peerDecision.room===d.room;
          if(!departures.some(p=>p.actor===d.actor)&&before.room===peer.room&&d.room!==before.room&&!["sleep","share_sleep"].includes(before.intent)&&["eat","sleep"].includes(d.intent)&&!["sleep","share_sleep"].includes(peer.intent)){
            if(peerAlsoGoingFirst){addLine(names[d.actor],seedPick(story.seed,"depart-a-deux-urgent-"+d.actor+"-"+story.round,["Je te suis.","Pareil pour moi.","Moi aussi, allons-y.","Je viens aussi."]),before.room);continue;}
            const eatPool=["J’ai trop faim pour réfléchir. Je vais manger un truc, je te retrouve après.","J’ai trop faim pour continuer. Je passe en cuisine, tu me rejoins si tu veux.","J’ai trop faim, là. Je vais préparer un truc et je reviens.","J’ai trop faim pour suivre. Je mange d’abord, on reprend après."] as const;const sleepPool=["Je tiens plus debout. Je vais dormir un peu ; je reviens après.","Je lutte contre le sommeil. Je vais me coucher, on reprend après.","Mes yeux se ferment. Je vais dormir ; ne m’attends pas pour réfléchir.","Je suis à bout. Je prends "+(d.room==="salon"?"le canapé":"le lit")+", je te retrouve au réveil."] as const;const pool=d.intent==="eat"?eatPool:sleepPool;let reason=seedPick(story.seed,"departure-"+d.intent+"-"+d.actor,pool);if(spokenKeys.has(fingerprint(reason)))reason=pool.find(line=>!spokenKeys.has(fingerprint(line)))??reason;if(d.actor===1&&d.intent==="sleep"&&d.room==="salon")reason+=" "+seedPick(story.seed,"couch-departure-reproach",["Tu aurais pu dormir dans le salon, Noé.","T'aurais pu me laisser la chambre, pour une fois.","Ça t'aurait coûté quoi de dormir ici, toi ?"]);addLine(names[d.actor],reason,before.room);}}
        for(const reaction of stockReactions)if(addLine(names[reaction.actor]+" · pensée",reaction.content,"cuisine"))statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,'réaction',?,? WHERE ${fence}`).bind(reaction.actor,"[cuisine|"+new Date(at).toISOString()+"] "+reaction.content,at,token,at));
        for(const line of [...bonusAftermathLines,...spontaneousBonusLines,...dayNightLines]){const room=finalResidents.find(a=>a.id===line.actor)!.room;if(addLine(names[line.actor]+" · pensée",line.content,room))statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,'réflexion',?,? WHERE ${fence}`).bind(line.actor,'['+room+'|'+new Date(at).toISOString()+'] '+line.content,at,token,at));}
        // Record consent before shared sleep; subsequent sleeping turns stay entirely silent.
        if(shared&&decisions[0].intent==="share_sleep")for(const d of decisions)if(!["sleep","share_sleep"].includes(world.agents.find(a=>a.id===d.actor)!.intent))addLine(names[d.actor]+" · avant sommeil",d.reply,finalResidents.find(a=>a.id===d.actor)!.room);
        // Dialogue order must follow generation order, not resident id order.
        // Le filtre sleep/share_sleep vise le sommeil qui SE POURSUIT (tour silencieux, Article
        // 03) — pas le tour de TRANSITION où le personnage vient tout juste de basculer vers le
        // sommeil (dreamers, cf. plus haut). Avant ce correctif (2026-09-18, retour utilisateur
        // explicite : « Noé rêve éveillé »), la réplique réelle de transition (ex. « Viens, on
        // trace dans cette piaule avant que tu t'effondres ») était silencieusement exclue par ce
        // même filtre, alors même que le tour venait de coûter un vrai appel API pour la générer —
        // un personnage encore parfaitement éveillé ce tour-là passait directement de la
        // conversation à un rêve sans la moindre annonce d'endormissement, un vrai trou de
        // cohérence (Article 2/12/17). Exactement le même bug que celui déjà corrigé pour
        // share_sleep (« · avant sommeil » ci-dessous) mais jamais reproduit ici pour le sommeil
        // solo (Article 3 : une règle corrigée une fois ne doit plus se reproduire ailleurs).
        if (!finale&&((input.mode !== "move" && input.mode !== "care" && !routine) || decisions.some(d => d.actor === 1 && d.intent === "sleep" && d.room === "salon")))
            for (const d of decisions.filter(d=>!["sleep","share_sleep"].includes(d.intent)||dreamers.includes(d.actor)))
                addLine(solitary.has(d.actor) ? `${names[d.actor]} · pensée` : names[d.actor], solitary.has(d.actor) && d.actor===1 && d.intent==="sleep" && d.room==="salon" ? seedPick(story.seed,"couch-solitary-thought",["Noé aurait pu dormir dans le salon. Je suis déçue de devoir lui laisser le lit.","Encore le canapé, parce que Noé garde le lit. Ça me pèse plus que je le dis.","Je cède la chambre à Noé une fois de plus. J'aurais aimé qu'il y pense tout seul."]) : groundRegister(groundSingleQuestion(d.reply)),turnPlan.exitInspection?"couloir":finalResidents.find(a=>a.id===d.actor)!.room);
        // Le rêve vient APRÈS la réplique de transition qu'il prolonge (déplacé ici le 2026-09-18,
        // Point 2 « Noé rêve éveillé ») : narrer un rêve avant même que la dernière phrase de veille
        // du personnage n'ait été affichée inversait l'ordre naturel veille → endormissement → rêve
        // (Article 2/12/17), quand bien même le filtre d'exclusion ci-dessus laisse maintenant
        // passer cette réplique.
        for(const dream of (nextStory.dreams??[]).filter(d=>d.round===nextStory.round&&dreamers.includes(d.actor))){const room=finalResidents.find(a=>a.id===dream.actor)!.room;addLine(names[dream.actor]+" · rêve",dream.content,room);statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,'rêve',?,? WHERE ${fence}`).bind(dream.actor,'['+room+'|'+new Date(at).toISOString()+'] '+dream.content,at,token,at));}
        let causalThought=false;
        if(!opening&&!soloIntro&&input.mode!=="move"){
            const d=decisions.find(d=>d.actor===actor),a=world.agents.find(a=>a.id===actor)!;
            if(d&&!['sleep','share_sleep'].includes(d.intent)){
                const peer=actor===1?'Noé':'Lia';
                const peerWords=decisions.find(p=>p.actor!==actor)?.reply??"";
                const cause=firstProposal?"Cette première proposition me met la pression : je risque de changer ce qu’il y a entre nous.":refused&&actor===2?"Le refus me coupe l’élan. J’ai envie de manger, et je me sens plus lourd.":followBeat?"Je lui pose des questions de plus en plus personnelles. Ça augmente mon envie de le connaître, et ça me trouble.":shared?"Ce rapprochement change ma façon de voir l’autre. J’ai besoin de comprendre ce que ça représente.":sharedMeal?"Ce repas partagé me rassure : on arrive à faire quelque chose ensemble.":nextStory.evidence.length>story.evidence.length?"L’observation vient de nous donner une piste. J’ai besoin de comprendre ce qu’elle change, pas de sauter à une conclusion.":together&&receivedAffectionBonus(peerWords)>0?"Les mots de "+peer+" me rassurent. Ça me donne un peu plus envie de lui faire confiance.":d.intent==='eat'?"Manger calme enfin cette faim. J’avais du mal à penser à autre chose.":d.intent==='rest'&&a.needs.stress>=50?"Cette pause fait baisser la pression. J’ai besoin de digérer ce qui vient de se passer.":a.needs.fatigue>=75?"La fatigue me gagne ; j’ai besoin de dormir, pas juste de changer de pièce.":a.needs.stress>=75?"Le stress prend trop de place. Je n’arrive pas encore à faire confiance à cet endroit.":d.emotions.tension>=75?"Cette tension me serre. Nos questions touchent quelque chose que j’arrive mal à nommer.":d.emotions.attraction>=80?peer+" me plaît clairement. Nos échanges me donnent envie de me rapprocher, mais ça ne me donne aucun droit.":d.emotions.trust>=75?"Les actes de "+peer+" commencent à me rassurer plus que ses mots.":d.emotions.comfort>=75?"Je me sens plus à l’aise ici. La présence de "+peer+" y est pour beaucoup, même si le décor reste étrange.":a.needs.uncertainty>=85?"Je ne sais pas ce que je suis. Ce vide dans mes souvenirs rend chaque détail suspect.":d.emotions.curiosity>=75?"Ces détails ne collent pas. Ça me pousse à chercher, même quand j’aimerais penser à autre chose.":undefined;
                if(cause&&!spokenKeys.has(fingerprint(cause))&&cause!==life.causeByActor?.[actor]){life.causeByActor={...(life.causeByActor??{}),[actor]:cause};causalThought=true;const room=turnPlan.exitInspection?'couloir':finalResidents.find(a=>a.id===actor)!.room;addLine(names[actor]+" · pensée",cause,room);statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,'réflexion',?,? WHERE ${fence}`).bind(actor,`[${room}|${new Date(at).toISOString()}] `+cause,at,token,at));}
            }
        }
        if(!causalThought&&!routine&&["interact","autonomous"].includes(input.mode)&&together&&!opening&&(proposalActor||story.round%7===4)){const d=decisions.find(d=>d.actor===(proposalActor??(story.round%2?1:2)));if(d?.thought&&!["sleep","share_sleep"].includes(d.intent)){const recent=(await ownMemories(d.actor)).filter(m=>m.kind==="réflexion").map(m=>String(m.content).replace(/^\[[^\]]+\] /,""));const thought=truthfulGender(groundPrivateThought(d.thought,d.actor,d.emotions.attraction,world.agents.find(a=>a.id===d.actor)!.needs.stress,story.round,recent),d.actor);addLine(names[d.actor]+" · pensée",thought,turnPlan.exitInspection?"couloir":finalResidents.find(a=>a.id===d.actor)!.room);statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,?,?,? WHERE ${fence}`).bind(d.actor,"réflexion",`[${turnPlan.exitInspection?"couloir":finalResidents.find(a=>a.id===d.actor)!.room}|${new Date(at).toISOString()}] `+thought,at,token,at));}}
        if (finaleLines) {
            addLine("Lia · pensée",finaleLines.liaThought,finalResidents[0].room);
            addLine("Noé · pensée",finaleLines.noeThought,finalResidents[1].room);
            addLine("Lia",finaleLines.lia,finalResidents[0].room);
            addLine("Noé",finaleLines.noe,finalResidents[1].room);
        }
        // Dossier retourné : les trois pièges répondus + au moins un tirage de la roulette (le
        // "test de pouvoir") suffisent à clore le dossier — une seule fois, jamais rejoué (2026-09-17).
        if(revealed&&!life.dossierText&&TRAP_ORDER.every(t=>life.dossierTraps?.[t])&&(life.bonusLog?.length??0)>0&&env.GEMINI_API_KEY){
            const traps=life.dossierTraps!;
            // worstMoment (Article 2/4, 2026-09-18) : la seule pièce à charge concrète que le
            // diagnostic reçoit en plus des trois extraits de pièges, tous par nature plutôt neutres
            // pris isolément — sans elle, un score d'appréciation très bas n'avait rien de citable à
            // l'appui, et le verdict pouvait rester indulgent malgré une hostilité réelle et sévère.
            // negotiationLog (2026-09-18, audit approfondi : tour 64 explicite — "il faut aussi
            // penser à integrer le phenomene de negociation : il est aussi revelateur de la
            // personnalité de l'utilisateur") : honoré révèle un observateur qui joue le jeu
            // proposé par les personnages, laissé sans réponse révèle une indifférence, et refusé
            // explicitement (2026-09-19, distinct du simple oubli depuis que ce cas a aussi un coût
            // d'appréciation propre) révèle un refus assumé, pas une négligence — n'apparaît que si
            // une négociation a réellement eu lieu (Article 4, jamais inventer une négociation qui
            // n'a pas eu lieu).
            const negotiationSummary=(life.negotiationLog?.length??0)>0?life.negotiationLog!.map(n=>n.outcome==='honored'?"une proposition honorée":n.outcome==='refused'?"une proposition explicitement refusée":"une proposition laissée sans réponse").join(", "):undefined;
            // appréciation par personnage (2026-09-18) : chaque voix du dossier cite désormais SA
            // PROPRE lecture de l'observateur, pas une moyenne partagée — cohérent avec le fait que
            // les deux diagnostics sont déjà deux appels séparés, chacun sa propre perception.
            const dossierEvidenceFor=(actorId:Person)=>({"miroir retourné (qui es-tu, derrière cet écran ?)":traps.mirror!.excerpt,"dilemme moral (nous laisser souffrir un peu pour ton confort ?)":traps.dilemma!.excerpt,"excuse après coup (après une remarque un peu dure plus tôt)":traps.excuse!.excerpt,"test de pouvoir (tirages à la roulette des bonus)":life.bonusLog!.map(b=>b.bonus).join(", "),"appréciation observée tout au long de l'échange (0=hostile, 50=neutre, 100=bienveillant soutenu)":String(Math.round(appreciationOf(life,actorId))),...(negotiationSummary?{"réaction aux négociations proposées par les personnages":negotiationSummary}:{}),...(life.worstMoment?{"le propos le plus dur ou le plus hostile réellement tenu pendant l'échange, mot pour mot":life.worstMoment.excerpt}:{})});
            const model=env.GEMINI_MODEL||"gemini-flash-lite-latest";
            const [liaFragment,noeFragment]=await Promise.all([generateDossierFragment(env.GEMINI_API_KEY,model,"Lia",dossierEvidenceFor(1),geminiFallbackModels,geminiFallbackKeys),generateDossierFragment(env.GEMINI_API_KEY,model,"Noé",dossierEvidenceFor(2),geminiFallbackModels,geminiFallbackKeys)]);
            if(liaFragment&&noeFragment){
                life.dossierText={lia:liaFragment,noe:noeFragment,synthesis:"Le dossier retourné est refermé. Chacun y a mis sa lecture — à toi de voir ce que ça dit de toi."};
                life.dossierShown=false;
                addLine("Maison · dossier","Le dossier retourné est prêt. Consultez-le via le bouton Verdict.","salon");
            }
        }
        if (input.mode === "autonomous")
            statements.push(db.prepare(`UPDATE world_lock SET last_auto = ? WHERE id = 1 AND ${fence}`).bind(now, token, at));
        if (storedStory) statements.push(db.prepare(`UPDATE memories SET content = ?, created_at = ? WHERE id = ? AND ${fence}`).bind(JSON.stringify(nextStory), at, storedStory.id, token, at));
        else statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT 1, 'scenario', ?, ? WHERE ${fence}`).bind(JSON.stringify(nextStory), at, token, at));
        statements.unshift(db.prepare(`INSERT INTO world_requests (id, result, created_at) SELECT ?, ?, ? WHERE ${fence}`).bind(input.requestId, JSON.stringify(result), at, token, at));
        const saved = await db.batch(statements);
        if (saved[0].meta.changes !== 1)
            throw new LiaError("Ce tour a expiré. Réessaie.", 409);
        return Response.json({ ...result, ...await readWorld(db) }, { headers: { "Cache-Control": "no-store" } });
    }
    catch (error) {
        return Response.json({ error: error instanceof LiaError ? error.message : "La maison n’a pas pu enregistrer ce tour. Réessaie." }, { status: error instanceof LiaError ? error.status : 503 });
    }
    finally {
        if (locked)
            await db.prepare("UPDATE world_lock SET expires_at = 0 WHERE id = 1 AND token = ?").bind(token).run().catch(() => undefined);
    }
}
