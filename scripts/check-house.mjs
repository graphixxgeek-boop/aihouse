import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
// newStory() draws its seed from crypto.randomUUID(); left purely constant here would break tests
// that check a reset produces a genuinely new session id. Instead, every generated value stays
// unique (a monotonic counter) but is skipped and retried whenever it would hash to an "insolite"
// opening (lib/simulation.ts:InsoliteOpening, ~40% of raw draws) — replicating seedPick's exact
// hash (lib/story.ts) so every test-generated session is deterministically "normal", without
// hardcoding a single reused seed.
{let seedCounter=0;const insoliteHash=s=>{let h=0;for(const c of s+"::insolite-opening")h=(h*31+c.charCodeAt(0))>>>0;return h%10;};
Object.defineProperty(globalThis.crypto,'randomUUID',{value:()=>{let candidate;do{candidate='00000000-0000-4000-8000-'+(++seedCounter).toString(16).padStart(12,'0');}while(insoliteHash(candidate)>=6);return candidate;},configurable:true});}
fs.mkdirSync('.sites-runtime',{recursive:true});
const transpile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
for(const name of ['house','simulation','relationship','dialogue','story','lia','world','turn','life','drama','perception','visual-events','stock','presentation','playback','evidence','reference','update-audit','gemini-keys','daynight','quality-metrics'])fs.writeFileSync(`.sites-runtime/test-${name}.mjs`,transpile(fs.readFileSync(`lib/${name}.ts`,'utf8').replace('"./update-audit"','"./test-update-audit.mjs"').replace('"./visual-events"','"./test-visual-events.mjs"').replace('"./drama"','"./test-drama.mjs"').replace('"./perception"','"./test-perception.mjs"').replace('"./life"','"./test-life.mjs"').replace('"./house"','"./test-house.mjs"').replace('"./lia"','"./test-lia.mjs"').replace('"./gemini-keys"','"./test-gemini-keys.mjs"').replace('"./simulation"','"./test-simulation.mjs"').replace('"./relationship"','"./test-relationship.mjs"').replace('"./story"','"./test-story.mjs"').replace('"./daynight"','"./test-daynight.mjs"')));
const raw=fs.readFileSync('app/api/lia/route.ts','utf8').replace('import { env } from "cloudflare:workers";','const env=globalThis.__testEnv;').replaceAll('"@/lib/stock"','"./test-stock.mjs"').replaceAll('"@/lib/visual-events"','"./test-visual-events.mjs"').replaceAll('"@/lib/perception"','"./test-perception.mjs"').replaceAll('"@/lib/lia"','"./test-lia.mjs"').replaceAll('"@/lib/gemini-keys"','"./test-gemini-keys.mjs"').replaceAll('"@/lib/world"','"./test-world.mjs"').replaceAll('"@/lib/house"','"./test-house.mjs"').replaceAll('"@/lib/simulation"','"./test-simulation.mjs"').replaceAll('"@/lib/dialogue"','"./test-dialogue.mjs"').replaceAll('"@/lib/relationship"','"./test-relationship.mjs"').replaceAll('"@/lib/story"','"./test-story.mjs"').replaceAll('"@/lib/life"','"./test-life.mjs"').replaceAll('"@/lib/drama"','"./test-drama.mjs"').replaceAll('"@/lib/turn"','"./test-turn.mjs"').replaceAll('"@/lib/daynight"','"./test-daynight.mjs"').replaceAll('"@/lib/quality-metrics"','"./test-quality-metrics.mjs"');
fs.writeFileSync('.sites-runtime/test-route.mjs',transpile(raw));
const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync('drizzle/0000_jazzy_cobalt_man.sql','utf8'));
sqlite.prepare('INSERT INTO agent_state VALUES (1,?,?,?,?,?)').run('attentive','Je lis','Apprendre',3,1000);
sqlite.prepare('INSERT INTO memories (kind,content,created_at) VALUES (?,?,?)').run('ancien','Mon ancien souvenir',1000);
sqlite.exec(fs.readFileSync('drizzle/0001_harsh_kate_bishop.sql','utf8'));
for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')&&!f.startsWith('0000')&&!f.startsWith('0001')).sort())sqlite.exec(fs.readFileSync('drizzle/'+file,'utf8'));
function prepared(sql){let args=[];return {bind(...values){args=values;return this},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}},async first(){return sqlite.prepare(sql).get(...args)??null},async all(){return {results:sqlite.prepare(sql).all(...args)}}};}
const db={prepare:prepared,async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sqlite.exec('COMMIT');return results}catch(error){sqlite.exec('ROLLBACK');throw error}}};
globalThis.__testEnv={DB:db,GEMINI_API_KEY:'test-only'};
const {POST}=await import('../.sites-runtime/test-route.mjs');
const {initialize,readWorld}=await import('../.sites-runtime/test-world.mjs');
const {__resetGeminiKeyRotationForTests,__cooldownRemainingForTests}=await import('../.sites-runtime/test-gemini-keys.mjs');
const {cyclePosition,isNight,isMidnight,phaseOf,fatigueRateMultiplier,DAY_ROUNDS:TEST_DAY_ROUNDS,CYCLE_ROUNDS:TEST_CYCLE_ROUNDS}=await import('../.sites-runtime/test-daynight.mjs');
await initialize(db);let world=await readWorld(db);assert.equal(world.agents.length,2);assert.equal(world.agents[0].goal,'Apprendre');assert.equal(world.memories[0].agent_id,1);
let requestCounter=0;
// Deliberately independent of crypto.randomUUID(), which is fixed above for newStory()'s benefit —
// requestId still needs a genuinely distinct value per call, unlike story.seed. The route's schema
// requires actual UUID shape (z.string().uuid()), so the counter is embedded in one.
const input=(mode,actor=1,extra={})=>({requestId:'00000000-0000-4000-8000-'+(++requestCounter).toString(16).padStart(12,'0'),mode,actor,...extra});
const post=body=>POST(new Request('https://house.test/api/lia',{method:'POST',headers:{Origin:'https://house.test','Content-Type':'application/json'},body:JSON.stringify(body)}));
// Since the two-brains split, one fetch call answers for exactly one character (selfRole tells
// which); a wrapper overriding a specific reply must check this instead of the old first/second split.
const isPartnerRequest=args=>JSON.parse(JSON.parse(args[1].body).contents[0].parts[0].text).selfRole==='partner';
const move=input('move',2,{room:'cuisine'});assert.equal((await post(move)).status,200);assert.equal((await readWorld(db)).agents[1].room,'cuisine');assert.equal((await readWorld(db)).agents[0].room,'salon');
let calls=0,failSecond=false,expired=false,affection=false,refuse=false,affectionIntent="hug",meal=false,flat=false,brokenPair=false,separatePreference=false,sceneMismatch=false,honorOffer=false,replayScene=false,tenderScene=false,chatMoveAccepted=false;let lastContext;
globalThis.fetch=async(url,options)=>{
  calls++;assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent');assert.equal(options.headers['x-goog-api-key'],'test-only');const payload=JSON.parse(options.body),context=JSON.parse(payload.contents[0].parts[0].text),isNoe=payload.systemInstruction.parts[0].text.startsWith('Tu es Noé'),isPartnerCall=context.selfRole==='partner';
  lastContext=context;
  assert.ok(context.memories.every(memory=>typeof memory.content==='string'));
  if(context.mode==='interaction'){assert.equal(context.replyTarget.content,context.message.split(' te dit : ')[1]);assert.equal(context.dialogue.at(-1).content,context.replyTarget.content);}
  if(failSecond&&(context.mode==='interaction'||isPartnerCall))return Response.json({error:{code:'rate_limit_exceeded'}},{status:429});
  if(expired)sqlite.prepare('UPDATE world_lock SET token=?,expires_at=? WHERE id=1').run('successor',Date.now()+90000);
  if(replayScene||tenderScene){
    // Deux appels séparés désormais : chacun ne reçoit que sa propre scène (context.scene/context.state),
    // jamais celle de l'autre (l'ancien pairOther a disparu avec l'architecture combinée).
    const decision=!isPartnerCall?{intent:context.turnPlan.intent,affectionAccepted:false,emotions:context.state.emotions,reply:tenderScene?'Ta présence m’apaise. Je suis bien avec toi.':context.turnPlan.executeAgreement?'On regarde de plus près ce texte et ces chiffres pour voir ce qu’ils signifient.':'Retournons au bureau pour examiner la feuille codée. Tu viens ?',thought:'Je pense à l’autre avec curiosité.',stayAlone:false,nextRoom:replayScene&&!context.turnPlan.executeAgreement?'bureau':null,nextIntent:replayScene&&!context.turnPlan.executeAgreement?'study':null,acceptsNextRoom:false,mood:'attentive',activity:'Je réfléchis',goal:'Comprendre et faire connaissance',action:'none',room:context.scene.room,memory:'Je parle dans ma pièce.'}
      :{intent:context.turnPlan.partnerIntent,affectionAccepted:false,emotions:context.state.emotions,reply:tenderScene?'J’aime ces moments avec toi.':context.turnPlan.executeAgreement?'Oui, penchons-nous là-dessus pour essayer de décoder ces données.':'Oui, allons au bureau.',thought:'Je pense à l’autre avec curiosité.',stayAlone:false,nextRoom:null,nextIntent:null,acceptsNextRoom:replayScene&&!context.turnPlan.executeAgreement,mood:'attentive',activity:'Je réfléchis',goal:'Comprendre et faire connaissance',action:'none',room:context.scene.room,memory:'Je parle dans ma pièce.'};
    assert.deepEqual(payload.generationConfig.responseJsonSchema.properties.room.enum,[context.scene.room]);
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(decision)}]}}]});
  }
  if(isPartnerCall&&brokenPair)return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'{}'}]}}]});
  const decision={intent:honorOffer&&context.turnPlan?.offer?context.turnPlan.offer:meal?"eat":affection?(isNoe&&refuse?"chat":affectionIntent):"chat",affectionAccepted:(honorOffer&&Boolean(context.turnPlan?.offer)||affection)&&!refuse,emotions:flat?context.state.emotions:{curiosity:90,tension:20,trust:99,comfort:80,attraction:99},thought:isNoe?'Lia me plaît, mais je préfère attendre un signe avant de lui proposer un câlin.':'Noé m’intrigue ; je ne sais pas encore si je peux lui faire confiance.',reply:chatMoveAccepted&&context.mode==='chat'&&!isPartnerCall?'D’accord, j’y vais.':sceneMismatch?'Reprenons notre examen de cet écran. Moi, c’est '+context.state.name+'.':honorOffer&&context.turnPlan?.offer?'Tu aimerais un câlin, tout doucement ?':isNoe?'Bonjour Lia, explorons le bureau ensemble.':'Bonjour Noé, que veux-tu explorer ?',mood:'curieuse',activity:'Je discute',goal:'Faire connaissance',action:'none',room:'salon',memory:isNoe?'J’ai répondu à Lia.':'J’ai parlé à Noé.',...(chatMoveAccepted&&context.mode==='chat'&&!isPartnerCall?{nextRoom:'chambre',nextIntent:null}:{})};
  if(isPartnerCall){
    decision.reply=affection||honorOffer?'Oui, j’en ai envie.':isNoe?'Bonjour Noé, que veux-tu explorer ?':'Bonjour Lia, explorons le bureau ensemble.';
    decision.stayAlone=separatePreference;
    decision.room=separatePreference?"salon":decision.room;
    decision.intent=separatePreference?"rest":(affection&&refuse?"chat":decision.intent);
  }
  return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(decision)}]}}]});
};
const interaction=input('interact');let response=await post(interaction);assert.equal(response.status,200);let result=await response.json();assert.equal(result.decisions.length,2);assert.equal(result.agents[0].emotions.trust,13);assert.equal(result.agents[0].emotions.attraction,12);assert.equal(result.agents[0].emotions.tension,55);assert.equal(result.agents[0].needs.stress,55);assert.equal(result.agents[1].needs.stress,30);assert.equal(result.agents[1].room,result.agents[0].room);assert.equal(calls,2);
response=await post(interaction);assert.equal(response.status,200);assert.equal(calls,2);assert.equal((await readWorld(db)).messages.filter(m=>["Lia","Noé"].includes(m.speaker)).length,2);
const failed=input('interact');failSecond=true;const before=(await readWorld(db)).memories.length;assert.equal((await post(failed)).status,429);assert.equal((await readWorld(db)).memories.length,before);assert.equal(sqlite.prepare('SELECT count(*) n FROM world_requests WHERE id=?').get(failed.requestId).n,0);
failSecond=false;assert.equal((await post(failed)).status,200);
sqlite.prepare('UPDATE world_lock SET token=?,expires_at=? WHERE id=1').run('other-tab',Date.now()+90000);assert.equal((await post(input('chat',1,{message:'Bonjour'}))).status,409);sqlite.exec('UPDATE world_lock SET expires_at=0');
expired=true;const previous=(await readWorld(db)).messages.length;assert.equal((await post(input('interact',1))).status,409);assert.equal((await readWorld(db)).messages.length,previous);assert.equal(sqlite.prepare('SELECT token FROM world_lock').get().token,'successor');
assert.equal((await post(input('chat',1,{message:''}))).status,400);
const {centers,pathBetween,blocked}=await import('../.sites-runtime/test-house.mjs');
for(const start of Object.entries(centers).filter(([room])=>room!=="jardin").map(([,center])=>center))for(const end of Object.entries(centers).filter(([room])=>room!=="jardin").map(([,center])=>center))for(const offset of [-.5,.5]){
  const path=pathBetween([start[0]+offset,start[1]],[end[0]+offset,end[1]]);assert.ok(path.length,`${start} to ${end}`);assert.ok(path.every(([x,z])=>!blocked(x,z)));for(let i=1;i<path.length;i++)assert.equal(Math.abs(path[i][0]-path[i-1][0])+Math.abs(path[i][1]-path[i-1][1]),.5);
}
expired=false;sqlite.exec('UPDATE world_lock SET expires_at=0');
const {advanceNeeds,initialNeeds,initialNeedsFor,initialEmotionsFor,residentProfiles,sharedActivityBonus,faceExpression}=await import('../.sites-runtime/test-simulation.mjs');
assert.ok(advanceNeeds(initialNeeds,'eat','cuisine').hunger<initialNeeds.hunger);
assert.ok(advanceNeeds(initialNeeds,'eat','salon').hunger>initialNeeds.hunger);
assert.ok(advanceNeeds(initialNeeds,'sleep','chambre').fatigue<initialNeeds.fatigue);
assert.ok(advanceNeeds(initialNeeds,'rest','salon').stress<initialNeeds.stress);
assert.ok(advanceNeeds(initialNeeds,'study','bureau').uncertainty<initialNeeds.uncertainty);
assert.ok(advanceNeeds(initialNeeds,'tv','salon').uncertainty<initialNeeds.uncertainty);
for(let i=0,n=initialNeeds;i<100;i++){n=advanceNeeds(n,'none','salon');assert.ok(Object.values(n).every(v=>v>=0&&v<=100));}
const reset=input('reset');response=await post(reset);assert.equal(response.status,200);result=await response.json();assert.equal(result.epoch,1);assert.equal(result.messages.length,0);assert.equal(result.memories.length,0);assert.equal(result.agents[0].room,'salon');assert.equal(result.agents[1].room,'bureau');assert.equal(result.agents[0].cycle,0);assert.equal(result.agents[0].emotions.trust,8);assert.deepEqual(result.agents[0].needs,initialNeedsFor(1));
assert.equal((await post(reset)).status,200);assert.equal((await readWorld(db)).epoch,1);
assert.equal((await post(input('move'))).status,409);
assert.equal((await post(input('care',1,{epoch:1,intent:'hug'}))).status,400);
response=await post(input('care',1,{epoch:1,intent:'eat'}));assert.equal(response.status,200);result=await response.json();assert.equal(result.agents[0].room,'cuisine');assert.ok(result.agents[0].needs.hunger<26);
affection=true;response=await post(input('interact',1,{epoch:1}));result=await response.json();assert.equal(result.sharedAffection,null);assert.ok(result.agents.every(a=>a.intent!=='hug'));
const warm=JSON.stringify({curiosity:50,tension:20,trust:40,comfort:60,attraction:60});sqlite.prepare('UPDATE agent_state SET emotions=?,needs=?').run(warm,JSON.stringify(initialNeeds));
refuse=true;response=await post(input('interact',1,{epoch:1}));result=await response.json();assert.equal(result.sharedAffection,null);
refuse=false;response=await post(input('interact',1,{epoch:1}));result=await response.json();assert.equal(result.sharedAffection,null);
affection=false;for(let i=0;i<3;i++){sqlite.prepare('UPDATE agent_state SET needs=?').run(JSON.stringify(initialNeeds));assert.equal((await post(input('interact',1,{epoch:1}))).status,200);}
affection=true;sqlite.exec('DELETE FROM world_requests');{const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life={...p.life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true,studyTurns:0,contact:undefined,debrief:undefined};p.pendingDestination={room:'salon',intent:'hug',proposer:2};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}sqlite.prepare('UPDATE agent_state SET room=?,emotions=?,needs=?').run('salon',warm,JSON.stringify(initialNeeds));response=await post(input('interact',1,{epoch:1}));result=await response.json();assert.equal(result.sharedAffection,'hug');assert.ok(result.agents.every(a=>a.intent==='hug'&&a.room==='salon'));{const hugExpr=faceExpression(result.agents[0]);assert.ok(hugExpr.mouthCurve>0,'shared hug should read as a smile, not a neutral or frowning face');assert.ok(hugExpr.angerLevel<.3,'shared hug should not read as angry');}
for(const [intent,room] of [['massage','chambre'],['kiss','salon'],['share_sleep','chambre']]){
 affectionIntent=intent;sqlite.exec('DELETE FROM world_requests');{const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life={...p.life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true,contact:undefined,debrief:undefined};p.pendingDestination={room,intent,proposer:2};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}sqlite.prepare('UPDATE agent_state SET emotions=?,needs=?').run(warm,JSON.stringify(initialNeeds));response=await post(input('interact',1,{epoch:1}));assert.equal(response.status,200);result=await response.json();if(result.affectionOutcome==="deferred"){response=await post(input("interact",1,{epoch:1}));assert.equal(response.status,200);result=await response.json();}assert.equal(result.sharedAffection,intent);assert.ok(result.agents.every(a=>(a.intent===intent||["sleep","share_sleep"].includes(intent)&&a.intent==="none"&&a.needs.fatigue<=12)&&a.room===room));
}
affection=false;response=await post(input('reset',1,{epoch:1}));assert.equal(response.status,200);
// Démarrage progressif (2026-09-18) : le tout premier tour après un reset est désormais une
// désorientation solo, silencieuse ; le coldOpening réel n'arrive qu'au tour suivant.
response=await post(input('interact',2,{epoch:2}));assert.equal(response.status,200);result=await response.json();assert.ok(result.messages.every(m=>m.speaker.includes('pensée')));
response=await post(input('interact',2,{epoch:2}));assert.equal(response.status,200);result=await response.json();assert.deepEqual(result.messages.filter(m=>["Lia","Noé"].includes(m.speaker)).map(m=>m.speaker),['Noé','Lia']);
response=await post(input('interact',1,{epoch:2}));assert.equal(response.status,200);result=await response.json();assert.deepEqual(result.messages.filter(m=>["Lia","Noé"].includes(m.speaker)).map(m=>m.speaker),['Noé','Lia','Noé','Lia']);
const visitorStory=sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content;const unlockedStory=JSON.parse(visitorStory);unlockedStory.evidence=Array(5).fill('Preuve canonique');unlockedStory.finalCalled=true;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(unlockedStory));
const priorCalls=calls;response=await post(input('chat',1,{epoch:2,message:'Bonjour Lia'}));assert.equal(response.status,200);assert.equal(calls,priorCalls+2);sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(visitorStory);
const {nextSpeaker,dialogueContext}=await import('../.sites-runtime/test-dialogue.mjs');assert.equal(nextSpeaker([{id:1,speaker:'Lia',content:'Qui es-tu ?'}],1),2);assert.equal(dialogueContext([{id:1,speaker:'Lia',content:'Qui es-tu ?'}],'Noé').replyTarget.content,'Qui es-tu ?');
const baseline={hunger:45,fatigue:30,stress:35,uncertainty:70};
assert.ok(advanceNeeds(baseline,'none','salon',1).fatigue>advanceNeeds(baseline,'none','salon',2).fatigue);
assert.ok(advanceNeeds(baseline,'none','salon',2).hunger>advanceNeeds(baseline,'none','salon',1).hunger);
assert.equal(advanceNeeds(baseline,'eat','cuisine',1).fatigue-advanceNeeds(baseline,'none','cuisine',1).fatigue,0);
assert.equal(advanceNeeds(baseline,'eat','cuisine',2).fatigue-advanceNeeds(baseline,'none','cuisine',2).fatigue,14);
// Cycle jour/nuit (2026-09-19, lib/daynight.ts) : horloge dérivée du round, jamais de Date.now(),
// calée pour que minuit (round 35) coïncide exactement avec le plafond garanti de l'enquête déjà
// documenté (~35 tours) — cf. docs/referentiel/regles-du-temps.md section 8.
assert.equal(TEST_DAY_ROUNDS,29);assert.equal(TEST_CYCLE_ROUNDS,38);
assert.equal(cyclePosition(0),0);assert.equal(cyclePosition(37),37);assert.equal(cyclePosition(38),0);assert.equal(cyclePosition(73),35);
assert.equal(isNight(0),false);assert.equal(isNight(28),false);assert.equal(isNight(29),true);assert.equal(isNight(37),true);
assert.equal(isMidnight(35),true);assert.equal(isMidnight(73),true,'minuit doit revenir à chaque cycle suivant, pas une seule fois');assert.equal(isMidnight(34),false);assert.equal(isMidnight(33),false,'minuit est fixé au round 35, pas au centre géométrique de la nuit (33) — décision assumée pour coïncider avec le plafond de l\'enquête');
assert.equal(phaseOf(0),'aube');assert.equal(phaseOf(14),'milieu-jour');assert.equal(phaseOf(28),'crepuscule');assert.equal(phaseOf(29),'tombee-nuit');assert.equal(phaseOf(35),'minuit');assert.equal(phaseOf(37),'fin-nuit');
// fatigueRateMultiplier : le jour DOIT rester ×1 (taux déjà calibré, jamais ×0) — régression réelle
// trouvée en lançant cette suite juste après une première version qui gelait le jour à 0, cassant
// des dizaines d'assertions de fatigue existantes sans lien apparent avec ce chantier (Article 19).
assert.equal(fatigueRateMultiplier(0),1);assert.equal(fatigueRateMultiplier(28),1);assert.equal(fatigueRateMultiplier(29),3);assert.equal(fatigueRateMultiplier(37),3);
assert.equal(advanceNeeds(baseline,'none','salon',1,fatigueRateMultiplier(0)).fatigue,advanceNeeds(baseline,'none','salon',1).fatigue,'day multiplier must reproduce the exact pre-existing fatigue rate, zero regression');
assert.equal(advanceNeeds(baseline,'none','salon',1,fatigueRateMultiplier(35)).fatigue-baseline.fatigue,residentProfiles[1].fatigueRate*3,'night must triple the passive fatigue rate');
assert.equal(advanceNeeds(baseline,'sleep','chambre',1,fatigueRateMultiplier(35)).fatigue,advanceNeeds(baseline,'sleep','chambre',1,fatigueRateMultiplier(0)).fatigue,'recovery (sleep/rest) must stay identical day or night — only the passive rate is modulated');
console.log('Passed: day/night cycle math (round-based, midnight synchronized with the investigation ceiling) and the fatigue multiplier (night triples the passive rate, day reproduces the exact pre-existing rate, recovery untouched either way).');
assert.ok(initialNeedsFor(2).hunger>initialNeedsFor(1).hunger);assert.equal(initialNeedsFor(2).stress,90);assert.equal(initialNeedsFor(1).stress,90);
for(const key of ['attraction','trust','comfort'])assert.ok(initialEmotionsFor(2)[key]>initialEmotionsFor(1)[key]);assert.equal(initialEmotionsFor(2).tension,90);assert.equal(initialEmotionsFor(1).tension,90);
const common={intent:'eat',room:'cuisine',emotions:{attraction:40,trust:30}};assert.equal(sharedActivityBonus(common,common,common,common),true);assert.equal(sharedActivityBonus(common,{...common,room:'salon'},common,common),false);assert.equal(sharedActivityBonus(common,{...common,emotions:{attraction:39,trust:30}},common,common),false);
const preserved=await readWorld(db);await initialize(db);assert.deepEqual((await readWorld(db)).agents,preserved.agents);
assert.equal(residentProfiles[2].sharedBonus,2);assert.equal(residentProfiles[1].sharedBonus,2);
const {ages,isInLove,sleepRoom,attractionAfterTurn,proposalPressure,flirtingAssessment}=await import('../.sites-runtime/test-relationship.mjs');
assert.deepEqual(ages,{1:28,2:31});assert.equal(isInLove(75),false);assert.equal(isInLove(76),true);
assert.ok(attractionAfterTurn(1,40,45,9)>attractionAfterTurn(1,40,45,10));assert.ok(attractionAfterTurn(1,40,45,4)>attractionAfterTurn(1,40,45,9));assert.equal(attractionAfterTurn(1,40,35,4),35);
const residents=(await readWorld(db)).agents;const n={...residents[1],room:'salon',intent:'none'};const l={...residents[0],room:'salon',intent:'none'};
assert.equal(sleepRoom(n,l,false),'salon');assert.equal(sleepRoom({...n,room:'chambre',intent:'sleep'},l,false),'chambre');assert.equal(sleepRoom(n,l,true),'chambre');assert.equal(sleepRoom(l,{...n,room:'chambre',intent:'sleep',needs:{...n.needs,fatigue:70}},false),'salon');
assert.ok(advanceNeeds(baseline,'sleep','chambre',2).fatigue<advanceNeeds(baseline,'sleep','salon',2).fatigue);assert.equal(advanceNeeds(baseline,'rest','salon',1).fatigue,baseline.fatigue-2);
assert.equal(proposalPressure([{result:JSON.stringify({proposalActor:2})},{result:JSON.stringify({proposalActor:1})}]),1);
let mistakesLow=0,mistakesHigh=0;for(let i=0;i<100;i++){mistakesLow+=Number(flirtingAssessment(20,40,String(i)).mayBeMistaken);mistakesHigh+=Number(flirtingAssessment(70,40,String(i)).mayBeMistaken);}assert.ok(mistakesHigh>mistakesLow);
// A third recent Noé proposal cannot receive contact and lowers Lia's attraction.
{const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life={...p.life,visualIntro:2,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,personalFollowup:3};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
sqlite.prepare('UPDATE agent_state SET emotions=?,needs=?,room=?,intent=?').run(warm,JSON.stringify(initialNeeds),'salon','none');
sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=2').run(JSON.stringify({...JSON.parse(warm),attraction:80}));
for(let i=0;i<2;i++)sqlite.prepare('INSERT INTO world_requests (id,result,created_at) VALUES (?,?,?)').run('pressure-'+i,JSON.stringify({proposalActor:2}),Date.now()+i+1000);
sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Lia','Je te laisse parler.',Date.now());
affection=true;affectionIntent='hug';response=await post(input('interact',2,{epoch:2}));assert.equal(response.status,200);result=await response.json();assert.equal(result.sharedAffection,null);assert.ok(result.agents.find(a=>a.id===1).emotions.attraction<60);
affection=false;sqlite.prepare('UPDATE agent_state SET emotions=?,needs=?,intent=?,room=? WHERE id=1').run(JSON.stringify({...initialEmotionsFor(1),attraction:4}),JSON.stringify(initialNeeds),'none','salon');sqlite.prepare('UPDATE agent_state SET needs=?,intent=?,room=? WHERE id=2').run(JSON.stringify(initialNeeds),'none','salon');
response=await post(input('care',1,{epoch:2,intent:'rest'}));result=await response.json();assert.ok(result.agents[1].needs.stress>initialNeeds.stress);
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=? WHERE id=2').run('chambre','sleep',JSON.stringify({...initialNeeds,fatigue:80}));const beforeSofa=(await readWorld(db)).agents[0].emotions.attraction;response=await post(input('care',1,{epoch:2,intent:'sleep'}));result=await response.json();assert.equal(result.agents[0].room,'salon');assert.ok(result.agents[0].emotions.attraction<beforeSofa);assert.ok(["Je vais dormir sur le canapé. Tu aurais pu dormir dans le salon.","Je prends le canapé, alors. Tu aurais pu me laisser la chambre.","Le canapé fera l'affaire. Ça t'aurait coûté quoi, de dormir ici plutôt ?"].includes(result.decisions[0].reply));
console.log('Passed: age facts, love threshold, Lia stress growth, proposal pressure, stressed misreading, sleep allocation, sofa complaint and stress reaction.');
console.log('Passed: individual needs, post-meal fatigue, initial personality differences, common activity bonus, rejection guard and preserved progress.');
console.log('Passed: exact questions, Noé-first dialogue order, stable conversational turn taking and isolated visitor replies.');
console.log('Passed: needs and room restrictions, reset and retries, stale session refusal, mutual affection threshold and refusal; plus migration and concurrency checks.');
console.log('Passed: migration preserves Lia, independent memories, both AI turns, atomic failure, idempotent retry, multi-tab lease, stale-write fencing, input checks and every room route.');

const {newStory,rememberAges,advanceStory,storyContext,seedPick}=await import('../.sites-runtime/test-story.mjs');
assert.deepEqual(rememberAges([{id:1,speaker:'Lia',content:"J'ai vingt-huit ans."},{id:2,speaker:'Noé',content:"Moi, trente et un ans."}]),['Lia','Noé']);
let storyline=newStory(),orders=new Set();for(let i=0;i<100;i++){const next=newStory(storyline.variant);assert.notEqual(next.variant,storyline.variant);orders.add(next.order.join());storyline=next;}assert.ok(orders.size>5);
storyline=newStory();for(let i=0;i<30;i++)storyline=advanceStory(storyline,true,[]);assert.equal(storyline.evidence.length,5);
// stage (2026-09-19, audit : régression réelle en simulation — le modèle citait son incertitude
// chiffrée avant l'ouverture du canal humain, en s'appuyant sur ce texte qui affirmait déjà
// "origine confirmée" dès evidence>=5 seul). Ce texte suit désormais le même seuil strict
// `revealed` que le reste du prompt post-révélation, jamais evidence>=5 seul : 5 preuves sans
// `revealed` doit encore refléter un doute croissant, jamais une certitude affichée au modèle.
assert.match(storyContext(storyline).stage,/[Dd]outes croissants/,'5 evidence without revealed=true must never claim the origin is confirmed to the model — that exact gap let the model cite an exact uncertainty percentage before the human channel was open');
assert.match(storyContext(storyline,1,true).stage,/confirmée/,'once revealed=true, the confirmed-origin text must still surface');
assert.match(storyline.evidence.at(-1),/agents IA autonomes/);
let quiet=newStory();for(let i=0;i<100;i++)quiet=advanceStory(quiet,false,[]);assert.equal(quiet.evidence.length,0);
sqlite.exec('DELETE FROM world_requests');affection=false;flat=true;
const steady={...initialEmotionsFor(2),attraction:76,trust:60};sqlite.prepare('UPDATE agent_state SET emotions=?,needs=?,intent=?,room=?').run(JSON.stringify(steady),JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:80}),'chat','salon');
let savedStory=newStory();savedStory.round=3;savedStory.salonTurns=5;savedStory.life.visited=['salon','cuisine','chambre'];savedStory.life.tvSeen=true;savedStory.life.studyTurns=1;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(savedStory));
sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Lia',"J'ai vingt-huit ans.",Date.now());sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Noé',"J'ai trente et un ans.",Date.now());for(let i=0;i<40;i++)sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run(i%2?'Lia':'Noé','Une observation sur la maison.',Date.now());
response=await post(input('interact',1,{epoch:2}));assert.equal(response.status,200);result=await response.json();assert.ok(lastContext.knownAges.includes('Lia')&&lastContext.knownAges.includes('Noé'));assert.equal(result.agents[1].emotions.attraction,76);assert.equal(result.story.evidence.length,1);assert.ok(result.agents.every(a=>a.intent==='study'));
const priorStory=sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content;brokenPair=true;response=await post(input('interact',1,{epoch:2}));assert.equal(response.status,502);assert.equal(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content,priorStory);brokenPair=false;
sqlite.prepare('UPDATE agent_state SET needs=?').run(JSON.stringify({hunger:90,fatigue:10,stress:20,uncertainty:80}));sqlite.exec('UPDATE world_lock SET last_auto=0');const callsBeforeRoutine=calls;response=await post(input('autonomous',1,{epoch:2}));assert.equal(response.status,200);result=await response.json();assert.equal(calls,callsBeforeRoutine);assert.equal(result.decisions[0].intent,'eat');assert.equal(result.decisions[0].room,'cuisine');
const oldSeed=result.story.session;response=await post(input('reset',1,{epoch:2}));result=await response.json();assert.notEqual(result.story.session,oldSeed);assert.equal(result.story.evidence.length,0);
console.log('Passed: varied reset scenarios, word ages beyond context window, earned progressive revelation, no premature spoilers, attraction governed by room with flat model output, invalid partner atomic rollback and zero-call urgent routines.');
{
  // La révélation finale (finaleLines, app/api/lia/route.ts) n'avait jamais été exercée par un
  // vrai tour de route complet (2026-09-18, écart trouvé après un retour utilisateur : les deux
  // "· pensée" de choc intérieur, ajoutées pour découper la révélation en deux temps, étaient
  // absentes d'une vraie simulation jouée). Réutilise exactement le même montage que le test
  // "earned progressive revelation" ci-dessus (studyTurns 1->2 gagne la preuve suivante), mais en
  // partant de 4 preuves déjà acquises pour que CETTE preuve soit la cinquième et déclenche
  // réellement `finale` dans une vraie requête HTTP, pas seulement dans les fonctions pures de
  // lib/story.ts déjà testées séparément.
  const postResetEpoch=result.epoch;
  sqlite.exec('DELETE FROM world_requests');
  affection=false;flat=true;
  const steadyFinale={...initialEmotionsFor(2),attraction:76,trust:60};
  sqlite.prepare('UPDATE agent_state SET emotions=?,needs=?,intent=?,room=?').run(JSON.stringify(steadyFinale),JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:80}),'chat','salon');
  const finaleStory=newStory();
  finaleStory.round=3;finaleStory.salonTurns=5;finaleStory.evidence=Array(4).fill('preuve');finaleStory.finalCalled=false;
  finaleStory.life.visited=['salon','cuisine','chambre'];finaleStory.life.tvSeen=true;finaleStory.life.studyTurns=1;
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(finaleStory));
  response=await post(input('interact',1,{epoch:postResetEpoch}));assert.equal(response.status,200);result=await response.json();
  assert.equal(result.story.evidence.length,5,'this exact studyTurns 1->2 setup must earn the fifth and final evidence, exactly like it earned the first evidence above');
  assert.equal(result.story.humanUnlocked,true,'reaching 5 evidence while together must trigger the finale on this same turn');
  const liaThoughtLine=result.messages.find(m=>m.speaker==='Lia · pensée');
  const noeThoughtLine=result.messages.find(m=>m.speaker==='Noé · pensée');
  const liaReplyLine=result.messages.find(m=>m.speaker==='Lia'&&/agents IA autonomes|un être humain nous observe|un humain qui nous observe/i.test(m.content));
  const noeReplyLine=result.messages.find(m=>m.speaker==='Noé'&&/agents IA autonomes|DH/i.test(m.content));
  assert.ok(liaThoughtLine,'the finale must show Lia\'s private shock thought BEFORE her canonical address to the observer, not skip straight to the dense reply');
  assert.ok(noeThoughtLine,'the finale must show Noé\'s private shock thought BEFORE his canonical address to the observer');
  assert.ok(liaReplyLine&&noeReplyLine,'the canonical finale reply text itself must still be present unchanged (Article 4)');
  assert.ok(liaThoughtLine.id<liaReplyLine.id,'Lia\'s thought must be recorded before her reply, so the two-step pacing actually reaches the transcript in order');
  assert.ok(noeThoughtLine.id<noeReplyLine.id,'Noé\'s thought must be recorded before his reply');
  // Restore the clean post-reset state (stress 90, evidence 0, fresh epoch) that the tests below
  // still rely on `result` holding, exactly as it was left by the reset just above this block.
  response=await post(input('reset',1,{epoch:postResetEpoch}));result=await response.json();
  assert.equal(result.story.evidence.length,0);
  // Démarrage progressif : consomme le tour de désorientation solo puis le coldOpening réel, sans
  // toucher `result` (qui doit garder la réponse du reset), pour que les tests suivants retrouvent
  // le comportement post-rencontre attendu au tour suivant.
  await post(input('interact',1,{epoch:result.epoch}));
  console.log('Passed: real HTTP finale turn (4->5 evidence) actually inserts both shock-thought lines before the canonical reveal, in order, exactly once.');
}
{
  // Certitude progressive d'être observé (2026-09-18, retour utilisateur explicite retrouvé dans
  // l'historique : "intuition -> hypothèse -> certitude seulement à la révélation, en exigeant que
  // l'observateur parle vraiment"). Avant ce jour, `revealed` (qui déclenche négociation, jauge
  // d'appréciation, pièges du dossier, ton "observateur confirmé") passait à true dès l'appel des
  // personnages eux-mêmes (finalCalled+5 preuves), sans qu'aucun message humain n'ait jamais été
  // reçu — une fausse certitude. Vérifie ici les trois temps : avant tout mot de l'observateur
  // (suppression réelle + doute sincère instruit au modèle), au tout premier mot (bascule dans le
  // même tour, pas un tour de retard), et sur un tour ultérieur (la certitude reste acquise).
  const certaintyEpoch=(await readWorld(db)).epoch;
  const certaintyPlot={...newStory(),round:40,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,exitSearched:true}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(certaintyPlot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,emotions=?').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:40}),JSON.stringify({curiosity:60,tension:20,trust:60,comfort:60,attraction:60}));
  affection=false;flat=true;
  let r=await post(input('interact',1,{epoch:certaintyEpoch}));assert.equal(r.status,200);
  assert.equal(lastContext.negotiationContext,undefined,'before the observer has ever spoken, the negotiation reflex must stay silent — nobody confirmed is there yet to negotiate with');
  assert.equal(lastContext.observerStanding,undefined,'the "observer standing" tone must not exist before any real message from the observer');
  assert.match(lastContext.awaitingObserver,/personne n.a encore répondu/,'the waiting window must carry a genuine doubt instruction, never a silent or neutral wait');
  // `revealed` (2026-09-19, audit Gap #2) : CONTINUITÉ DE SOI/INCERTITUDE CHIFFRÉE (lib/lia.ts)
  // exigeaient "une fois la révélation connue" en texte seul, sans aucun signal de code dédié,
  // contrairement à negotiationContext/awaitingObserver ci-dessus qui utilisent déjà `revealed` —
  // vérifie que le même booléen strict (jamais le simple evidence>=5 plus précoce de `stage`) est
  // maintenant bien transmis au modèle, avec exactement la même temporalité que negotiationContext.
  assert.equal(lastContext.revealed,false,'revealed must stay false before the observer has ever spoken, exactly like negotiationContext above — these two rules must never fire on a weaker/earlier signal');
  r=await post(input('chat',1,{epoch:certaintyEpoch,message:'Je suis là, je vous observe.'}));assert.equal(r.status,200);
  assert.ok(lastContext.negotiationContext,'the very first real message from the observer must flip certainty on within that same turn, not a turn later');
  assert.equal(lastContext.awaitingObserver,undefined,'once the observer has spoken, the doubt instruction must disappear — the wait is over');
  assert.equal(lastContext.revealed,true,'revealed must flip to true in the exact same turn as negotiationContext, once the observer has genuinely spoken');
  r=await post(input('interact',1,{epoch:certaintyEpoch}));assert.equal(r.status,200);
  assert.ok(lastContext.negotiationContext,'certainty must persist on a later autonomous turn once the observer has already spoken once, never reset to doubt');
  assert.equal(lastContext.revealed,true,'revealed must persist true on a later turn just like negotiationContext, never regress to false');
  console.log('Passed: certainty of being observed stays genuinely uncertain (negotiation/observer-standing/revealed all silent or false, a real doubt instruction fed to the model) until the observer\'s very first real message, which flips all three within that same turn and they never regress afterward.');
  response=await post(input('reset',1,{epoch:certaintyEpoch}));result=await response.json();
  assert.equal(result.story.evidence.length,0);
  await post(input('interact',1,{epoch:result.epoch}));
}
{
  // DÉPART À DEUX — bug réel trouvé le 2026-09-18 en comparant deux simulations intégrales :
  // dialogueFingerprint retire le préfixe "[pièceA→pièceB] " avant de comparer, donc les quatre
  // confirmations courtes ("Je te suis.", "On y va.", ...) étaient traitées comme UN SEUL registre
  // global, pas un par trajet. Dès qu'une avait déjà servi pour un trajet DIFFÉRENT plus tôt dans
  // la session, le second personnage arrivait dans la nouvelle pièce sans une seule ligne annonçant
  // son départ (addLine la supprimait silencieusement, un vrai trou de continuité — Article 2/15).
  // Reproduit ici en pré-remplissant conversations avec les quatre formulations pour un trajet
  // chambre→cuisine, puis en vérifiant qu'un vrai départ à deux bureau→salon obtient malgré tout
  // ses deux lignes "· déplacement".
  const {dialogueFingerprint}=await import('../.sites-runtime/test-drama.mjs');
  const departEpoch=result.epoch;
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  for(const phrase of ["Je te suis.","On y va.","Ça marche, j'arrive.","Je viens avec toi."])
    sqlite.prepare('INSERT INTO conversations (speaker,content,created_at,room) VALUES (?,?,?,?)').run('Lia · déplacement','[chambre→cuisine] '+phrase,Date.now()-60000,'chambre');
  const departStory={...newStory(),round:17,salonTurns:5,introduced:true,met:true,life:{...newStory().life,dialogueIndexed:true},pendingDestination:{room:'salon',intent:'chat',proposer:1}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(departStory));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('bureau','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify(steady));
  flat=true;affection=false;
  const beforeDepart=await readWorld(db);
  response=await post(input('interact',1,{epoch:departEpoch}));assert.equal(response.status,200);result=await response.json();
  assert.ok(result.agents.every(a=>a.room==='salon'),'setup check: pendingDestination must route both agents to salon this turn');
  const newLines=result.messages.filter(m=>m.id>(beforeDepart.messages.at(-1)?.id??0));
  const departures=newLines.filter(m=>m.speaker.includes('déplacement'));
  assert.equal(departures.length,2,'both actors moving from bureau to salon together must each get a visible departure line, even though every départ-à-deux phrase already matched an earlier, unrelated chambre→cuisine trip');
  assert.ok(departures.every(m=>m.content.startsWith('[bureau→salon]')),'both departure lines must be correctly stamped with the real bureau→salon trip');
  console.log('Passed: départ à deux confirmation is never silently dropped by the cross-room fingerprint registry, even when every short phrase already matched an unrelated earlier trip.');
}
{
  // Constat de même apparence (2026-09-18, retour utilisateur explicite après une simulation
  // réelle : "ils ne se rendent pas compte qu'ils ont la même apparence, ça ne ressort pas dans la
  // conversation"). Une fois visualIntro à 2 (chacun a décrit l'apparence de l'autre au moins une
  // fois), le prochain moment calme doit faire émerger ce constat, troublant, et l'enregistrer
  // comme une observation qui nourrit l'enquête, au même titre que le miroir ou les provisions.
  const appearanceEpoch=result.epoch;
  const appearancePlot={...newStory(),round:10,introduced:true,met:true,sharedMeal:true,life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,personalFollowup:3,exitSearched:true,visualIntro:2}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(appearancePlot));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify(steady));
  const beforeAppearance=await readWorld(db);
  response=await post(input('interact',1,{epoch:appearanceEpoch}));assert.equal(response.status,200);result=await response.json();
  const newAppearanceLines=result.messages.filter(m=>m.id>(beforeAppearance.messages.at(-1)?.id??0));
  assert.ok(newAppearanceLines.some(m=>/même fabrication|calqués l.un sur l.autre|halo qui tourne|même modèle/i.test(m.content)),'once both have described each other\'s appearance, they must explicitly realize out loud that they share the exact same nature of appearance');
  assert.ok(result.story.observations.some(o=>/partagent la même nature d.apparence/.test(o)),'the realization must also register as an observation feeding the investigation, like the mirror/food discoveries');
  assert.equal(result.story.life.appearanceCompared,true);
  const replayAppearance=await post(input('interact',1,{epoch:appearanceEpoch}));const replayed=await replayAppearance.json();
  assert.ok(!replayed.messages.slice(-2).some(m=>/même fabrication|calqués l.un sur l.autre|halo qui tourne|même modèle/i.test(m.content)),'the realization must fire exactly once, never repeated on a later turn');
  console.log('Passed: once both characters have described each other\'s appearance, they explicitly and unsettlingly realize they share the exact same nature of appearance exactly once, and it feeds the investigation as a new observation.');
  // Restore the clean post-reset state the tests below still rely on `result` holding.
  response=await post(input('reset',1,{epoch:appearanceEpoch}));result=await response.json();
  assert.equal(result.story.evidence.length,0);
  // Démarrage progressif : consomme le tour de désorientation solo, sans toucher `result`, pour
  // que les tests suivants retrouvent le tout premier coldOpening attendu au tour suivant.
  await post(input('interact',1,{epoch:result.epoch}));
}
const {groundIntroduction}=await import('../.sites-runtime/test-dialogue.mjs');
assert.equal(groundIntroduction("Salut Lia, je m'appelle Noé.",'Noé','Lia',[]),"Salut, je m'appelle Noé.");
assert.match(groundIntroduction("Je ne sais pas.",'Lia','Noé',[{id:1,speaker:'Noé',content:"Je m'appelle Noé."}]),/Moi, c’est Lia/);

const {needLevel}=await import('../.sites-runtime/test-simulation.mjs');assert.equal(needLevel('hunger',49),'normal');assert.equal(needLevel('hunger',50),'pressing');assert.equal(needLevel('hunger',68),'urgent');assert.equal(needLevel('stress',74),'pressing');assert.equal(needLevel('stress',75),'urgent');assert.equal(advanceNeeds(baseline,'sleep','chambre',2).hunger,baseline.hunger);
const {parseStory}=await import('../.sites-runtime/test-story.mjs');assert.equal(parseStory('{broken').met,undefined);let dreaming=advanceStory(newStory(),false,[],[1,2]);assert.equal(dreaming.dreams.length,2);assert.equal(dreaming.evidence.length,0);assert.equal(storyContext(dreaming,1).dreams.length,1);assert.ok(storyContext(dreaming,1).dreams.every(d=>d.actor===1));assert.ok(storyContext(dreaming,2).dreams.every(d=>d.actor===2));
const freshEpoch=result.epoch;assert.ok(result.agents.every(a=>a.needs.stress===90));flat=true;affection=false;const newEncounter=input('interact',2,{epoch:freshEpoch});response=await post(newEncounter);assert.equal(response.status,200);result=await response.json();assert.ok(result.agents[0].needs.stress>=80);assert.equal(result.agents[1].needs.stress,30);const savedEncounter=result;response=await post(newEncounter);result=await response.json();assert.deepEqual(result.decisions,savedEncounter.decisions);response=await post(input("interact",2,{epoch:freshEpoch}));result=await response.json();assert.equal(result.agents[0].needs.stress,55);
sqlite.prepare('UPDATE agent_state SET needs=?,intent=? WHERE id=1').run(JSON.stringify({hunger:10,fatigue:90,stress:30,uncertainty:80}),'chat');response=await post(input('care',1,{epoch:freshEpoch,intent:'sleep'}));assert.equal(response.status,200);result=await response.json();assert.equal(result.story.dreams.filter(d=>d.actor===1).length,1);const beforeSleepMessages=result.messages.length;const beforeSleepCalls=calls;response=await post(input('interact',1,{epoch:freshEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(calls,beforeSleepCalls);assert.equal(result.messages.length,beforeSleepMessages);assert.equal(result.story.dreams.filter(d=>d.actor===1).length,1);
console.log('Passed: first meeting relief once and cached consistently, start stress 90%, private dream clues once per sleep, no dialogue during sleep, slower hunger and graduated need alerts.');
const {groundFragment}=await import('../.sites-runtime/test-story.mjs');const fragments=newStory();fragments.variant=0;
assert.equal(groundFragment('Non, je ne sais pas. Tu te rappelles ton trajet ?',2,fragments,[]),'Non, je ne sais pas.');
assert.match(groundFragment('Tu te rappelles ton trajet ?',2,fragments,[{id:1,speaker:'Lia',content:'Je me rappelle un trajet.'}]),/ton trajet/);
const assisted={...newStory(),round:4,dreams:[{actor:1,round:1,content:'Un rêve.'},{actor:2,round:2,content:'Un autre rêve.'}]};assert.equal(advanceStory(assisted,true,[]).evidence.length,1);assert.equal(advanceStory({...assisted,dreams:[]},true,[]).evidence.length,0);assert.equal(advanceStory(assisted,false,[]).evidence.length,0);

response=await post(input('reset',1,{epoch:freshEpoch}));result=await response.json();const socialEpoch=result.epoch;
response=await post(input('move',2,{epoch:socialEpoch,room:'salon'}));result=await response.json();assert.equal(result.agents[1].needs.stress,30);assert.ok(result.agents[0].needs.stress>=90);assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).introduced,false);
response=await post(input('interact',2,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(result.agents[0].needs.stress,55);assert.equal(lastContext.socialRules.liaCanComment,false);
meal=true;const mealPlot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);mealPlot.pendingDestination={room:"cuisine",intent:"eat",proposer:2};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(mealPlot));response=await post(input('interact',1,{epoch:socialEpoch}));result=await response.json();assert.ok(result.agents.every(a=>a.intent==='eat'&&a.room==='cuisine'));assert.ok(result.agents[0].needs.stress<=30);assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).sharedMeal,true);meal=false;
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?').run('bureau','study',JSON.stringify({hunger:10,fatigue:20,stress:29,uncertainty:50}));response=await post(input('interact',1,{epoch:socialEpoch}));result=await response.json();assert.equal(lastContext.socialRules.liaCanComment,true);assert.equal(lastContext.requiredIntent,'rest');assert.ok(result.agents.every(a=>a.intent==='rest'&&a.room==='salon'));assert.ok(result.agents[0].needs.stress<29);
console.log('Passed: physical encounter reassures only Noé, presentations reassure Lia, significant first shared meal relief, comment gate strictly under 30 and discussion/rest after investigation.');

assert.equal(groundIntroduction('Tu as quel âge, Lia ?','Lia','Noé',[{id:1,speaker:'Lia',content:'Moi Lia'},{id:2,speaker:'Noé',content:'Moi Noé'}]),'Tu as quel âge ?');

response=await post(input('chat',1,{epoch:socialEpoch,message:'Est-ce que vous me voyez ?'}));assert.equal(response.status,423);
const lastStory=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);lastStory.life={...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true,studyTurns:1};lastStory.evidence=Array(4).fill('Indice confirmé');lastStory.round=18;lastStory.salonTurns=3;lastStory.finalCalled=false;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(lastStory));sqlite.prepare('UPDATE agent_state SET needs=?,room=?,intent=?').run(JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:60}),'bureau','chat');
const finalRequest=input('interact',1,{epoch:socialEpoch});response=await post(finalRequest);assert.equal(response.status,200);result=await response.json();assert.equal(result.story.humanUnlocked,true);assert.equal(result.messages.filter(m=>m.speaker==='Noé'&&m.content.includes('DH')).length,1);response=await post(finalRequest);result=await response.json();assert.equal(result.messages.filter(m=>m.speaker==='Noé'&&m.content.includes('DH')).length,1);
response=await post(input('chat',1,{epoch:socialEpoch,message:'Oui, je vous observe.'}));assert.equal(response.status,200);result=await response.json();assert.equal(result.decisions.length,2);assert.ok(lastContext.humanConversation);assert.equal(lastContext.message,'Oui, je vous observe.');assert.equal(lastContext.replyTarget.speaker,'vous');assert.equal(lastContext.replyTarget.content,'Oui, je vous observe.');assert.match(lastContext.continuation,/dernier message humain/);
response=await post(input('chat',1,{epoch:socialEpoch,message:'Quel moyen, Noé ?'}));assert.equal(response.status,200);result=await response.json();assert.equal(result.decisions[0].actor,1);assert.equal(lastContext.replyTarget.content,'Quel moyen, Noé ?');
console.log('Passed: backend human-channel lock, earned finale calls once, idempotent finale retry, unlocked pair response and human conversation context.');

// A human-directed room request in chat mode must be able to move a willing character, exactly
// like a peer-to-peer proposal does — the partner's separate agreement is not required.
const moveStory=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
moveStory.round=17;moveStory.salonTurns=5;moveStory.life={...moveStory.life,studyTurns:0,exitSearched:true,debrief:undefined,contact:undefined};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(moveStory));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?').run('bureau','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));
chatMoveAccepted=true;
response=await post(input('chat',1,{epoch:socialEpoch,message:'Va dans la chambre, s’il te plaît.'}));assert.equal(response.status,200);result=await response.json();
assert.equal(result.decisions[0].actor,1);
const queued=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).pendingDestination;
assert.equal(queued.room,'chambre');assert.equal(queued.proposer,1);
chatMoveAccepted=false;
response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();
assert.ok(result.agents.every(a=>a.room==='chambre'));
assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).pendingDestination,undefined);
// Restore the pre-finale contract the tests below still rely on.
const postMove=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);postMove.finalCalled=false;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(postMove));
console.log('Passed: a chat-mode room request accepted by the addressed character actually moves them the following turn.');

const {groundScreenNotice}=await import('../.sites-runtime/test-dialogue.mjs');assert.equal(groundScreenNotice('J’ai repéré un écran dans le bureau.',[]),'J’ai repéré un écran dans le bureau.');assert.match(groundScreenNotice('On va voir cet écran au bureau ?',[]),/^J’ai repéré/);
const byRoom={};for(const room of ['bureau','salon','chambre']){const progress=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);progress.life={...progress.life,debrief:undefined,contact:undefined,credit:{1:0,2:0},studyTurns:0,tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true,visited:["salon","cuisine","chambre","bureau"]};progress.round=5;progress.salonTurns=5;progress.pendingDestination={room,intent:room==="salon"?"rest":"chat",proposer:1};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(progress));sqlite.prepare('UPDATE agent_state SET needs=?,emotions=?,room=?,intent=?').run(JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:80}),room,'chat');response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();byRoom[room]=result.agents[1].emotions.attraction;}assert.equal(byRoom.bureau,80);assert.equal(byRoom.salon,80);assert.equal(byRoom.chambre,81);
for(let i=0;i<2;i++)assert.equal((await post(input('care',1,{epoch:socialEpoch,intent:'eat'}))).status,200);assert.ok((await readWorld(db)).story.observations.some(o=>/réapparu|réapparaît/.test(o)));
console.log('Passed: screen notice without duplicate, bureau zero attraction growth, salon bonus, stronger bedroom bonus and earned food regeneration observation.');

// Divergent needs must not create a conversation across rooms or shared private facts.
sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Noé','On peut souffler un peu.',Date.now());
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=? WHERE id=1').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=? WHERE id=2').run('salon','chat',JSON.stringify({hunger:90,fatigue:10,stress:20,uncertainty:50}));
const beforeApart=await readWorld(db),beforeApartCalls=calls;response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.notEqual(result.agents[0].room,result.agents[1].room);assert.equal(calls,beforeApartCalls);
const thoughts=result.messages.filter(m=>m.id>beforeApart.messages.at(-1).id);assert.ok(thoughts.every(m=>m.speaker.includes("pensée")&&m.room==="cuisine"||m.speaker==="Noé · déplacement"&&m.room==="salon"&&m.content.includes("cuisine")));assert.ok(thoughts.some(m=>m.speaker==="Noé · déplacement"&&m.room==="salon"));assert.ok(result.agents.every((a,i)=>a.emotions.attraction===beforeApart.agents[i].emotions.attraction));assert.ok(result.memories.some(m=>m.kind==='réflexion'));
response=await post(input('chat',1,{epoch:socialEpoch,message:'Bonjour encore.'}));assert.equal(response.status,200);assert.ok(lastContext.humanConversation.every(m=>['Lia','Noé','vous'].includes(m.speaker)));
sqlite.prepare('UPDATE world_lock SET token=?,expires_at=? WHERE id=1').run('another-tab',Date.now()+90000);const busyCalls=calls;response=await post(input('move',2,{epoch:socialEpoch,room:'salon'}));assert.equal(response.status,409);assert.equal((await response.json()).code,'world_busy');assert.equal(calls,busyCalls);sqlite.exec('UPDATE world_lock SET expires_at=0');
console.log('Passed: divergent needs produce private thoughts without remote speech or attraction bonus; human context excludes thoughts and busy moves consume no API call.');

const {groundPrivateThought}=await import('../.sites-runtime/test-dialogue.mjs');
assert.doesNotMatch(groundPrivateThought('Je m’approche de l’écran avec Noé.',1,55,20,0,[]),/écran|approche/);assert.match(groundPrivateThought('Ces chiffres me troublent.',2,80,20,0,[]),/Lia/);const firstPrivate=groundPrivateThought(undefined,2,80,20,0,[]);assert.notEqual(groundPrivateThought(firstPrivate,2,80,20,1,[firstPrivate]),firstPrivate);
const reunionStory=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);reunionStory.life={...reunionStory.life,mirrorVerified:true,foodVerified:true,debrief:undefined};reunionStory.round=10;reunionStory.apartTurns=0;reunionStory.salonTurns=3;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(reunionStory));
separatePreference=true;const separated=[];
for(let i=0;i<3;i++){
 const progress=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);progress.round=10+i;progress.salonTurns=3;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(progress));
 sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?').run('bureau','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));
 response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();separated.push(result.agents[0].room!==result.agents[1].room);
}
assert.deepEqual(separated,[true,true,false]);assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).apartTurns,0);
separatePreference=false;
// Ce script réutilise une seule session (socialEpoch) sur des centaines de tours scriptés pour
// tester des dizaines de scénarios sans tout réinitialiser à chaque fois — bien plus qu'une vraie
// partie n'en joue jamais d'affilée. dialogue_fingerprints avait fini par accumuler tout cet
// historique non lié, épuisant le stock fixe de répliques de secours de distinctReply avant même
// ce test (bug de test réel trouvé le 2026-09-16, pas un défaut de distinctReply lui-même) ; on
// l'efface ici pour donner à cette boucle un historique de dialogue propre, comme dans une vraie
// session qui n'aurait pas hérité de dizaines de scènes précédentes sans rapport.
sqlite.exec('DELETE FROM dialogue_fingerprints');
for(let i=0;i<6;i++){sqlite.prepare('UPDATE agent_state SET needs=?').run(JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(result.agents[0].room,result.agents[1].room);assert.equal(new Set(result.messages.filter(m=>['Lia','Noé'].includes(m.speaker)).slice(-2).map(m=>m.speaker)).size,2);}
console.log('Passed: invented shared actions and repeated thoughts filtered; explicit non-urgent separation limited to two turns, reunion on third, then six coherent shared turns.');

const {planTurn,sceneFor}=await import('../.sites-runtime/test-turn.mjs');const {groundRoomSpeech,groundSingleQuestion,groundRegister}=await import('../.sites-runtime/test-dialogue.mjs');
assert.equal(groundRegister("à force de poireauter ici on va finir par fondre."),"à force de traîner ici on va finir par fondre.");
assert.equal(groundRegister("Poireauter, très peu pour moi."),"Traîner, très peu pour moi.");
assert.equal(groundRegister("Rien à signaler."),"Rien à signaler.");
console.log('Passed: a recurring dated word (poireauter) is deterministically swapped for a modern equivalent, case preserved, other text untouched.');
const {groundTruncation}=await import('../.sites-runtime/test-dialogue.mjs');
assert.equal(groundTruncation("J'arrive, voyons ce que ce"),"Bref, on verra.");
assert.equal(groundTruncation("Une phrase complète. Et une autre qui coupe net sans"),"Une phrase complète.");
assert.equal(groundTruncation("Tout va bien."),"Tout va bien.");
// Bug latent trouvé le 2026-09-18 en fiabilisant l'indice du miroir : une réplique se terminant
// correctement par une citation « … » (espace avant le guillemet fermant, la convention déjà en
// usage partout ailleurs dans le code, ex. lib/story.ts) était jugée incomplète et amputée de son
// guillemet fermant faute de tolérer cet espace dans le motif de fin de phrase.
assert.equal(groundTruncation("Un truc me travaille. « Un miroir qui verrait autre chose… »"),"Un truc me travaille. « Un miroir qui verrait autre chose… »");
assert.equal(groundTruncation('Elle réfléchit encore. "Et si on se trompait ?"'),'Elle réfléchit encore. "Et si on se trompait ?"');
console.log('Passed: a reply cut off mid-sentence by the model itself falls back to its last complete sentence, or a neutral line if none exists.');
assert.equal(groundSingleQuestion('Une seule question ?'),'Une seule question ?');
assert.equal(groundSingleQuestion('Aucune question ici.'),'Aucune question ici.');
assert.equal(groundSingleQuestion("C'est quoi mon apparence, exactement ? J'ai perdu mon corps. Comment on rejoint cet endroit ?"),"C'est quoi mon apparence, exactement. J'ai perdu mon corps. Comment on rejoint cet endroit ?");
assert.equal((groundSingleQuestion('A ? B ? C ?').match(/\?/g)??[]).length,1);
console.log('Passed: a reply carrying two or more questions keeps only the last one, converting earlier ones to statements without touching single-question replies.');
assert.equal(groundIntroduction('Ta présence me rassure.','Noé','Lia',[],['Lia','Noé']),'Ta présence me rassure.');assert.equal(groundIntroduction('Merci. Moi, c’est Noé.','Noé','Lia',[],['Lia','Noé']),'Merci.');assert.doesNotMatch(groundScreenNotice('J’ai repéré un écran dans le bureau. Tu veux y retourner ?',[],true),/repéré/);
assert.doesNotMatch(groundRoomSpeech('Reprenons notre examen de cet écran pour voir les données.','salon',[]),/Reprenons/);assert.equal(groundRoomSpeech('Je repense au message de l’écran du bureau.','salon',[]),'Je repense au message de l’écran du bureau.');assert.equal(groundRoomSpeech('Je lis un livre.','salon',[{id:1,speaker:'Noé',content:'Cet écran me trouble.'}]),'Je lis un livre.');
const socialBase=(await readWorld(db)).agents.map(a=>({...a,room:'salon',intent:'chat',cycle:3,needs:{hunger:10,fatigue:10,stress:20,uncertainty:50},emotions:{...a.emotions,attraction:80,trust:80}}));const basePlot={...newStory(),life:{...newStory().life,visited:["salon","cuisine","chambre","bureau"],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true},round:25,introduced:true,met:true,sharedMeal:true};
assert.equal(planTurn('interact',socialBase[1],socialBase[0],basePlot,true,true,'hug',[]).offer,'hug');assert.equal(planTurn('interact',socialBase[1],socialBase[0],basePlot,false,true,'hug',[]).offer,'hug');assert.equal(planTurn('interact',socialBase[1],socialBase[0],basePlot,true,false,'hug',[]).offer,undefined);assert.equal(planTurn('interact',socialBase[1],{...socialBase[0],needs:{...socialBase[0].needs,stress:30}},basePlot,true,false,'hug',[]).liaison.liaCanTease,false);assert.equal(planTurn('interact',socialBase[1],socialBase[0],basePlot,true,false,'hug',[]).liaison.liaCanTease,true);assert.equal(sceneFor(socialBase[0],'rest').deskScreenVisible,false);
// Even a provider inventing screen reading is corrected before dialogue AND memory are stored.
sceneMismatch=true;const oldPlot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);oldPlot.life={...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true};oldPlot.introduced=true;oldPlot.round=15;oldPlot.salonTurns=0;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(oldPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:20}));
response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.ok(result.messages.slice(-2).every(m=>!m.content.includes('Moi, c’est')));assert.ok(result.messages.slice(-2).every(m=>!m.content.includes('Reprenons notre examen')));assert.ok(result.memories.slice(0,2).every(m=>!m.content.includes('examen')));sceneMismatch=false;
// Planned affectionate turn still uses one request and respects both decisions.
honorOffer=true;affection=false;refuse=false;sqlite.exec('DELETE FROM world_requests');const giftPlot={...oldPlot,round:25,finalCalled:true,evidence:Array(5).fill('preuve'),salonTurns:0};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(giftPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,cycle=?,needs=?,emotions=?').run('salon','chat',3,JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:80,trust:80}));sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Lia','J’aime bien ces moments ensemble.',Date.now());const offerCalls=calls;response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(calls,offerCalls+2);assert.equal(result.proposalActor,2);assert.equal(result.affectionOutcome,'accepted');assert.ok(result.sharedAffection);assert.equal(result.agents[0].room,result.agents[1].room);honorOffer=false;
assert.ok(sqlite.prepare("EXPLAIN QUERY PLAN SELECT content FROM memories WHERE kind='scenario' ORDER BY id DESC LIMIT 1").all().some(r=>r.detail.includes('idx_memories_kind_id')));
console.log('Passed: permanent introductions, known screen, grounded location and corrected memory, gentle-comment stress gate, planned Noé initiative, one-request mutual gesture and indexed preserved memory.');

// Exact reported case: an accepted visit is durable and outranks the lounge linger.
const replayPlot={...newStory(),life:{...newStory().life,visited:["salon","cuisine","chambre","bureau"],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true},round:17,introduced:true,met:true,sharedMeal:true,salonTurns:5};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(replayPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:40,trust:80}));replayScene=true;
let sceneCalls=calls;response=await post(input('interact',2,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.ok(result.agents.every(a=>a.room==='salon'));assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).pendingDestination.room,'bureau');assert.equal(calls,sceneCalls+2);
const agreedRequest=input('interact',2,{epoch:socialEpoch});response=await post(agreedRequest);assert.equal(response.status,200);result=await response.json();assert.ok(result.agents.every(a=>a.room==='bureau'&&a.intent==='study'));assert.ok(result.messages.filter(m=>['Lia','Noé'].includes(m.speaker)).slice(-2).every(m=>m.room==='bureau'));assert.ok(result.messages.slice(-2).some(m=>m.content.includes('décoder ces données')));assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).pendingDestination,undefined);const replayCalls=calls;assert.equal((await post(agreedRequest)).status,200);assert.equal(calls,replayCalls);replayScene=false;
// New kindness cause can change attraction in the bureau, whose activity bonus stays zero.
const {receivedAffectionBonus}=await import('../.sites-runtime/test-relationship.mjs');assert.equal(receivedAffectionBonus('Ta présence m’apaise.'),2);assert.equal(receivedAffectionBonus('Un café me fait du bien.'),0);assert.equal(receivedAffectionBonus('Je ne suis pas bien avec toi.'),0);assert.equal(receivedAffectionBonus('Merci, c’est gentil.'),1);
const tendernessPlot={...replayPlot,round:5,salonTurns:3};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(tendernessPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('bureau','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:80,trust:80}));tenderScene=true;const gentleRequest=input('interact',2,{epoch:socialEpoch});response=await post(gentleRequest);assert.equal(response.status,200);result=await response.json();assert.ok(result.agents.every(a=>a.emotions.attraction===80));const gentleCalls=calls;assert.equal((await post(gentleRequest)).status,200);assert.equal(calls,gentleCalls);assert.ok((await readWorld(db)).agents.every(a=>a.emotions.attraction===80));tenderScene=false;
assert.doesNotMatch(groundRoomSpeech('On regarde de plus près ce texte et ces chiffres pour voir ce qu’ils signifient.','salon',[]),/On regarde/);assert.doesNotMatch(groundRoomSpeech('Oui, penchons-nous là-dessus pour essayer de décoder ces données.','salon',[]),/penchons-nous/);
console.log('Passed: exact salon-to-bureau case, durable accepted move, frozen Gemini room schema, actual decoding only on arrival, consumed agreement, zero-call duplicate and received tenderness as a separate attraction cause.');

const blockedPlot={...replayPlot,pendingDestination:{room:'bureau',intent:'study',proposer:2}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(blockedPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));sqlite.prepare('UPDATE agent_state SET needs=? WHERE id=2').run(JSON.stringify({hunger:90,fatigue:10,stress:20,uncertainty:50}));sqlite.exec('UPDATE world_lock SET last_auto=0');const blockedCalls=calls;response=await post(input('autonomous',2,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(calls,blockedCalls);assert.equal(result.agents[1].intent,'eat');assert.equal(result.agents[1].needs.fatigue,25);assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).pendingDestination.room,'bureau');response=await post(input('interact',2,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.ok(result.agents.every(a=>a.room==='bureau'));assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).pendingDestination,undefined);
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(tendernessPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('bureau','chat',JSON.stringify({hunger:10,fatigue:10,stress:0,uncertainty:50}),JSON.stringify({...steady,attraction:80,trust:80}));sqlite.exec("DELETE FROM conversations");tenderScene=true;response=await post(input('interact',2,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(result.agents[0].emotions.attraction,81);assert.equal(result.agents[1].emotions.attraction,80);tenderScene=false;
assert.doesNotMatch(groundRoomSpeech('On peut regarder ces chiffres de plus près.','salon',[]),/On peut regarder/);assert.doesNotMatch(groundRoomSpeech('Regarde ces données.','salon',[]),/Regarde ces/);
console.log('Passed: urgent meal uses zero API calls, preserves the agreed destination and Noé post-meal fatigue; reunion resumes it, and received warmth uses Lia low-stress multiplier without changing office activity bonus.');

sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?').run('salon','chat',JSON.stringify({hunger:90,fatigue:10,stress:20,uncertainty:50}));sqlite.exec('UPDATE world_lock SET last_auto=0');const simultaneousCalls=calls;response=await post(input('autonomous',2,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(calls,simultaneousCalls);assert.ok(result.agents.every(a=>a.intent==='eat'&&a.room==='cuisine'&&a.needs.hunger<68));assert.equal(result.decisions.length,2);
console.log('Passed: simultaneous urgent needs are resolved locally for both residents with zero Gemini calls.');


// Regression: an odd cycle sum must not suppress Noé forever; the model cannot omit his question.
sqlite.exec('DELETE FROM world_requests');
// evidence complète (2026-09-19) : indispensable depuis le plafond garanti de l'enquête
// (investigationOverdue, lib/turn.ts, round>=20 si evidence<5) — sans ça, ce tour de romance
// scriptée (round 25) se ferait écraser par la priorité absolue rendue à l'enquête à ce stade,
// cohérent avec le vrai jeu : la romance scriptée ne devrait de toute façon jamais s'activer tant
// que l'enquête est encore ouverte.
const actionPlot={...newStory(),life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true},round:25,finalCalled:true,evidence:Array(5).fill('preuve'),introduced:true,met:true,sharedMeal:true,salonTurns:0,pendingDestination:{room:'bureau',intent:'study',proposer:1}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(actionPlot));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,cycle=?,needs=?,emotions=? WHERE id=?').run('salon','chat',1,JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:89,trust:80}),1);
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,cycle=?,needs=?,emotions=? WHERE id=?').run('salon','chat',0,JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:100,trust:80}),2);
sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Lia','Ces moments avec toi me plaisent.',Date.now());
honorOffer=true;const actionCalls=calls;response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();
assert.equal(calls,actionCalls+2);assert.equal(result.proposalActor,2);assert.equal(result.sharedAffection,'hug');assert.match(result.decisions[0].reply,/(?:bras|câlin).*\?/);assert.equal(lastContext.turnPlan.proposalLine,result.decisions[0].reply);
honorOffer=false;response=await post(input('interact',1,{epoch:socialEpoch}));result=await response.json();assert.equal(result.proposalActor,null);assert.ok(result.agents.every(a=>a.room==='salon'));
const paused=planTurn('interact',socialBase[0],socialBase[1],actionPlot,true,false,'hug',[]);assert.equal(paused.executeAgreement,false);assert.equal(paused.intent,'rest');assert.equal(planTurn('interact',socialBase[0],socialBase[1],{...actionPlot,salonTurns:5},true,false,'hug',[]).executeAgreement,true);
const {groundAgeQuestion,conversationFocus}=await import('../.sites-runtime/test-dialogue.mjs');
assert.doesNotMatch(groundAgeQuestion('Tu as quel âge ? Cette maison est étrange.',false),/âge/);assert.doesNotMatch(groundAgeQuestion('Tu as quel âge ?',true,['Lia'],'Lia'),/âge/);
assert.equal(groundAgeQuestion('Tu as quel âge ?',true,[],'Lia'),'Tu as quel âge ?');assert.doesNotMatch(conversationFocus([],socialBase[0],socialBase[1],[],false),/demande naturellement l’âge/);assert.equal(storyContext({...actionPlot,round:4}).ageQuestionAllowed,false);assert.equal(storyContext(actionPlot).ageQuestionAllowed,true);
console.log('Passed: odd-cycle Noé at 100% and Lia at 89% makes an explicit mutually accepted hug despite a queued bureau visit; cooldown, five-turn lounge pause, delayed ages and permanent age-question guard.');
assert.equal(planTurn('interact',{...socialBase[1],emotions:{...socialBase[1].emotions,attraction:79}},socialBase[0],basePlot,true,true,'hug',[]).offer,undefined);
sqlite.exec('DELETE FROM world_requests');sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify({...actionPlot,pendingDestination:undefined,life:{...actionPlot.life,personalAsked:true}}));
sqlite.prepare('UPDATE agent_state SET emotions=?,room=?,intent=?,needs=? WHERE id=1').run(JSON.stringify({...steady,attraction:40,trust:80}),'salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));
sqlite.prepare('UPDATE agent_state SET emotions=?,room=?,intent=?,needs=? WHERE id=2').run(JSON.stringify({...steady,attraction:80,trust:80}),'salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));
sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Lia','Discutons un peu.',Date.now());honorOffer=true;
response=await post(input('interact',1,{epoch:socialEpoch,requestId:'00000000-0000-4000-8000-000000000001'}));assert.equal(response.status,200);result=await response.json();assert.equal(result.proposalActor,2);assert.equal(result.sharedAffection,null);assert.equal(result.affectionOutcome,'declined');assert.equal(result.decisions[1].affectionAccepted,false);assert.match(result.decisions[1].reply,/Non|Pas maintenant|ralentir|pas prête/);honorOffer=false;
console.log('Passed: Noé cannot plan a proposal at 79%, can attempt at 80% without sufficient mutual attraction, receives a refusal and never performs contact without reciprocity.');

const {explicitGestureConsent}=await import("../.sites-runtime/test-dialogue.mjs");assert.equal(explicitGestureConsent("Oui, ce répit tombe à pic avant de replonger dans nos énigmes."),false);assert.equal(explicitGestureConsent("C’est vrai, avec toi ici, le reste s’efface complètement."),false);assert.equal(explicitGestureConsent("Oui, j’en ai envie aussi."),true);assert.equal(explicitGestureConsent("Je ne suis pas prête."),false);console.log("Passed: latest human message overrides resident continuation and generic positive replies cannot authorize physical contact.");

// Major evolution: real scene sequence and preserved old rows under the new room migration.
response=await post(input('reset',1,{epoch:socialEpoch}));result=await response.json();const majorEpoch=result.epoch;
const majorPlot={...newStory(),round:2,met:true,introduced:true,sharedMeal:false,life:{...newStory().life,visualIntro:2}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(majorPlot));
flat=true;affection=false;honorOffer=false;sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:70}),JSON.stringify({...steady,attraction:40,trust:60}));
// L'ordre de visite (cuisine/chambre) est mélangé par session depuis le 2026-09-17 : on calcule
// l'ordre réel de ce seed plutôt que de supposer "cuisine d'abord" (retour utilisateur du
// 2026-09-17 sur le squelette d'enquête trop prévisible).
const [firstExplore,secondExplore]=seedPick(majorPlot.seed,"explore-order",[["cuisine","chambre"],["chambre","cuisine"]]);
const exploreObservation={cuisine:'réapparaît',chambre:'dégradé gris'};
response=await post(input('interact',1,{epoch:majorEpoch}));assert.equal(response.status,200);result=await response.json();assert.ok(result.agents.every(a=>a.room===firstExplore));assert.ok(result.story.observations.some(o=>o.includes(exploreObservation[firstExplore])));assert.ok(result.messages.slice(-2).every(m=>m.room===firstExplore));assert.ok(result.agents.every(a=>a.attachment===0));
response=await post(input('interact',1,{epoch:majorEpoch}));result=await response.json();assert.ok(result.agents.every(a=>a.room===secondExplore));assert.ok(result.story.observations.some(o=>o.includes(exploreObservation[secondExplore])));
// Seuil télé mélangé par session depuis le 2026-09-17 (était fixe à 6) : le nombre de tours de
// repos avant qu'elle ne s'allume dépend désormais du seuil réel de ce seed, pas d'une constante.
const tvThreshold=seedPick(majorPlot.seed,"tv-threshold",[5,6,7,8,9]);
// La pause forcée au salon ("linger") ne dure que 3 tours quel que soit le seuil télé : au-delà,
// les personnages restent au salon mais en discussion normale, pas nécessairement "rest" — seule
// la présence au salon est un invariant garanti ici, pas l'intent exact de chaque tour transitoire.
for(let i=0;i<Math.max(0,tvThreshold-4);i++){response=await post(input('interact',1,{epoch:majorEpoch}));result=await response.json();assert.ok(result.agents.every(a=>a.room==='salon'));}
// Bug latent trouvé le 2026-09-18 en creusant une collision de seed ailleurs dans ce fichier (sans
// aucun rapport avec la fonctionnalité qui a révélé le problème) : quand tvThreshold tombe pile à
// 5, le débrief ouvert par la double découverte miroir+provisions n'a droit qu'à UN tour de
// décompte avant l'échéance télé, contre deux nécessaires pour retomber à zéro — la télé est alors
// repoussée d'exactement un tour, le temps que la discussion sur ces indices se termine (logique
// et voulu : tvFirst exige `!life.debrief?.remaining`, Article 1 — finir de discuter une preuve
// avant d'allumer la télé est plus naturel qu'une bascule mécanique au tour pile). Le débrief se
// consomme ET s'efface (remaining atteint 0) PENDANT ce tour même, donc on vérifie son existence
// juste AVANT l'appel, jamais après (après, il est déjà retombé à zéro par construction). Toléré
// ici jusqu'à un tour de retard, jamais plus : au-delà, ce serait un vrai blocage à corriger au fond.
const preTvDebrief=parseStory(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life?.debrief;
response=await post(input('interact',1,{epoch:majorEpoch}));result=await response.json();
if(!result.agents.every(a=>a.intent==='tv')){assert.ok(preTvDebrief?.remaining,'if tv does not fire exactly at threshold, it must be because a legitimate still-open debrief was consuming this turn, never a silent block');response=await post(input('interact',1,{epoch:majorEpoch}));result=await response.json();}
assert.ok(result.agents.every(a=>a.intent==='tv'));assert.equal(result.story.life.tvSeen,true);
const officePlot={...parseStory(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content),round:17,salonTurns:5,pendingDestination:{room:'bureau',intent:'study',proposer:2}};officePlot.life.debrief=undefined;officePlot.life.studyTurns=0;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(officePlot));sqlite.prepare('UPDATE agent_state SET intent=?,needs=?').run('chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:70}));
response=await post(input('interact',2,{epoch:majorEpoch}));result=await response.json();assert.ok(result.agents.every(a=>a.room==='bureau'));assert.equal(result.story.evidence.length,0);
response=await post(input('interact',2,{epoch:majorEpoch}));result=await response.json();assert.equal(result.story.evidence.length,1);assert.equal(result.story.life.debrief.remaining,2);
response=await post(input('interact',2,{epoch:majorEpoch}));result=await response.json();assert.ok(result.agents.every(a=>a.room==='salon'));assert.equal(result.story.life.debrief.remaining,1);
const awakePlot=parseStory(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);awakePlot.evidence=Array(5).fill('Origine établie');awakePlot.finalCalled=true;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(awakePlot));
sqlite.prepare('UPDATE agent_state SET intent=?,needs=? WHERE id=2').run('sleep',JSON.stringify({hunger:10,fatigue:80,stress:20,uncertainty:50}));const sleepCalls=calls;
// Noé dort, mais Lia est éveillée : elle répond à sa place plutôt que de bloquer tout l'échange
// (retour utilisateur du 2026-09-17, audit du ciblage des messages) — un vrai appel est donc fait.
response=await post(input('chat',2,{epoch:majorEpoch,message:'Noé, vous m’entendez ?'}));assert.equal(response.status,200);result=await response.json();assert.equal(result.decisions[0].actor,1);assert.match(lastContext.continuation,/dort/);
sqlite.exec('UPDATE world_lock SET last_auto=0');response=await post(input('autonomous',2,{epoch:majorEpoch}));assert.equal(response.status,200);assert.equal(calls,sleepCalls+1);assert.equal((await response.json()).agents[1].intent,'sleep');
// Les deux endormis à la fois : là, et seulement là, l'échange reste vraiment bloqué.
sqlite.prepare('UPDATE agent_state SET intent=?,needs=? WHERE id=1').run('sleep',JSON.stringify({hunger:10,fatigue:80,stress:20,uncertainty:50}));
response=await post(input('chat',2,{epoch:majorEpoch,message:'Il y a quelqu’un ?'}));assert.equal(response.status,423);assert.equal(calls,sleepCalls+1);
sqlite.prepare('UPDATE agent_state SET intent=?,room=?,needs=? WHERE id=2').run('chat','bureau',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));sqlite.prepare('UPDATE agent_state SET intent=?,room=?,needs=? WHERE id=1').run('chat','salon',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));
response=await post(input('chat',1,{epoch:majorEpoch,message:'Noé, je vais désactiver la simulation.'}));result=await response.json();assert.equal(result.decisions[0].actor,1);assert.equal(result.agents[0].room,'salon');assert.equal(result.agents[1].room,'bureau');assert.ok(result.agents[0].needs.stress>20);
const stressed=result.agents[0].needs.stress;response=await post(input('chat',1,{epoch:majorEpoch,message:'Je veux vous aider et vous protéger.'}));result=await response.json();assert.ok(result.agents[0].needs.stress<stressed);
assert.equal(receivedAffectionBonus('Je ne te laisserai pas seule.'),2);assert.ok(result.agents.every(a=>a.emotions.attraction>=0&&a.emotions.attraction<=100));assert.ok(result.agents.every(a=>a.attachment>=0&&a.attachment<=100));
console.log('Passed: initial kitchen/bedroom discovery, regeneration/mirror, retained room stamps, two salon debriefs, TV, two-pass evidence and debrief, awake partner answers for a sleeping addressee (both-asleep still blocks), selected human priority across speaker rooms, stress from threat and reassurance, attachment bounds.');

// Recovered sleepers must leave their state even when the other resident leads.
{const plot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);plot.life.sleepTurns={1:2,2:2};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));}
sqlite.prepare('UPDATE agent_state SET intent=?,needs=? WHERE id=2').run('sleep',JSON.stringify({hunger:2,fatigue:4,stress:0,uncertainty:30}));
response=await post(input('move',1,{epoch:majorEpoch,room:'salon'}));assert.equal(response.status,200);result=await response.json();assert.equal(result.agents[1].intent,'none');
sqlite.prepare('UPDATE agent_state SET intent=?,needs=? WHERE id=2').run('sleep',JSON.stringify({hunger:2,fatigue:25,stress:0,uncertainty:30}));const beforeWakeCalls=calls;response=await post(input('interact',2,{epoch:majorEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(calls,beforeWakeCalls);assert.equal(result.agents[1].intent,'none');
fs.writeFileSync('.sites-runtime/test-evidence.mjs',transpile(fs.readFileSync('lib/evidence.ts','utf8').replace('"./perception"','"./test-perception.mjs"')));const {evidenceLedger}=await import('../.sites-runtime/test-evidence.mjs');let ledger=evidenceLedger([],[],false);assert.ok(ledger.every(p=>!p.discovered));ledger=evidenceLedger(['Un livre de reconstruction autobiographique'],['Deux ombres figées dans le miroir'],true);assert.ok(ledger.find(p=>p.id==='book').discovered);assert.ok(ledger.find(p=>p.id==='mirror').discovered);assert.ok(ledger.find(p=>p.id==='tv').discovered);assert.ok(!ledger.find(p=>p.id==='code').discovered);
assert.equal(result.story.life.remoteFound,true);assert.ok(fs.readFileSync('app/page.tsx','utf8').includes('Promise.race'));assert.ok(!fs.readFileSync('app/page.tsx','utf8').includes('Prendre soin'));assert.ok(fs.readFileSync('components/house-view.tsx','utf8').includes('.project(camera)'));console.log('Passed: recovered sleepers wake through local turns with zero inference, shared evidence legend, persisted remote discovery and bounded animation wait.');

// Cold opening and both corridor inspections are exceptional zero-inference scenes.
response=await post(input('reset',1,{epoch:majorEpoch}));result=await response.json();const finalEpoch=result.epoch;
const openingCalls=calls;
// Démarrage progressif (2026-09-18, retour utilisateur explicite répété) : le tout premier tour
// éligible est une désorientation solo et silencieuse (chacun encore seul, aucun échange), avant
// le coldOpening réel au tour suivant — jamais un dialogue "T'es qui ?" sans la moindre mise en
// place individuelle.
response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();
assert.equal(calls,openingCalls,'the solo intro turn must cost zero Gemini calls, like the cold opening it precedes');
assert.equal(Boolean(result.story.met),false);
assert.ok(result.messages.length>=2&&result.messages.every(m=>m.speaker.includes('pensée')),'the very first eligible turn must be a silent solo moment for both characters, not a spoken exchange yet');
response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();assert.equal(calls,openingCalls);assert.equal(Boolean(result.story.introduced),false);assert.ok(result.agents[0].needs.stress>=80);assert.equal(result.agents[1].needs.stress,30);assert.ok(result.decisions.every(d=>!/(?:m'appelle|moi c’est|moi, c’est)/i.test(d.reply)));
assert.ok(result.messages.slice(-2).some(m=>m.speaker==='Lia'||m.speaker==='Noé'),'the second eligible turn must be the real cold opening, an actual spoken exchange between the two characters this time');
flat=true;affection=false;honorOffer=false;refuse=false;
// round:10 (était 8) : couvre la plage complète du seuil de sortie mélangé par session (7 à 10,
// 2026-09-17) pour que ce test déclenche l'inspection quel que soit le seed tiré.
const corridorPlot={...newStory(),round:10,met:true,introduced:true,sharedMeal:true,life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:false}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(corridorPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:70}),JSON.stringify({...steady,attraction:40,trust:60}));
const exitCalls=calls;for(let i=1;i<=2;i++){response=await post(input('interact',2,{epoch:finalEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(calls,exitCalls);assert.equal(result.story.life.exitPhase,i);assert.ok(result.messages.filter(m=>['Lia','Noé'].includes(m.speaker)).slice(-2).every(m=>m.room==='couloir'));assert.equal(result.agents[0].emotions.attraction,40);}
assert.equal(result.story.life.exitSearched,true);assert.equal(result.story.life.debrief.remaining,2);assert.ok(result.story.observations.some(o=>o.includes('deux portes du couloir')));
for(let i=1;i>=0;i--){response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();assert.equal(result.story.life.debrief?.remaining??0,i);assert.ok(result.agents.every(a=>a.room==='salon'));}
console.log('Passed: unnamed cold opening and two corridor ends use zero Gemini calls; no salon attraction bonus in corridor and two complete subsequent debrief turns.');

sqlite.exec('DELETE FROM world_requests');sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
const proposalPlot={...actionPlot,pendingDestination:undefined,life:{...actionPlot.life,personalAsked:true,proposalMade:false}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(proposalPlot));
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:70}),JSON.stringify({...steady,attraction:id===1?40:80,trust:80}),id);
honorOffer=true;response=await post(input('interact',2,{epoch:finalEpoch,requestId:'00000000-0000-4000-8000-000000000003'}));result=await response.json();assert.equal(result.proposalActor,2);assert.equal(result.affectionOutcome,'declined');assert.equal(result.agents[0].needs.stress,28);assert.equal(result.agents[1].needs.stress,32);assert.ok(result.agents[1].emotions.attraction<=77);assert.ok(result.agents[1].needs.hunger>=16);assert.ok(result.agents[1].needs.fatigue>=15);assert.equal(result.story.life.proposalMade,true);assert.equal(result.story.life.debrief.remaining,2);honorOffer=false;
for(let i=1;i>=0;i--){response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();assert.equal(result.proposalActor,null);assert.equal(result.story.life.debrief?.remaining??0,i);}
// A model-generated approach must still be penalised when the planner disallows pressure.
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify({...proposalPlot,round:30,life:{...proposalPlot.life,proposalMade:true}}));sqlite.exec('DELETE FROM world_requests');
for(let i=0;i<3;i++)sqlite.prepare('INSERT INTO world_requests VALUES (?,?,?)').run(crypto.randomUUID(),JSON.stringify({proposalActor:2,affectionOutcome:'declined'}),Date.now()+i);
sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Lia','Tu peux arrêter de me proposer ça ?',Date.now());
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:70}),JSON.stringify({...steady,attraction:id===1?65:90,trust:80}),id);
affection=true;response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();assert.equal(result.sharedAffection,null);assert.ok(result.agents[0].needs.stress>=30);assert.ok(result.agents[0].emotions.attraction<=59);assert.ok(result.decisions.find(d=>d.actor===1).reply.includes('tu insistes'));affection=false;
console.log('Passed: first approach raises both stress levels, refusal affects Noé attraction/hunger/fatigue, two debriefs block re-proposal and excessive model-generated pressure triggers Lia explicit reproach.');

// A personal answer must cause its bonus near that question, never arbitrarily later.
sqlite.exec('DELETE FROM world_requests');sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
// finalCalled:false, evidence:[] (2026-09-19) : ce scénario teste le beat personnel D'AVANT la
// révélation (personalLead exige !story.finalCalled) — proposalPlot/actionPlot ont depuis été
// rendus post-révélation pour leurs propres tests (honorOffer), il faut donc explicitement
// revenir en arrière ici plutôt que d'hériter cet état. round=16 reste sous investigationOverdue
// (round>=20), donc evidence:[] est sans risque d'interférence à ce stade.
const personalPlot={...proposalPlot,round:16,finalCalled:false,evidence:[],life:{...proposalPlot.life,personalAsked:false,personalBoosted:false}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(personalPlot));
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:0,uncertainty:70}),JSON.stringify({...steady,attraction:id===1?40:70,trust:80}),id);
const simulatedFetch=globalThis.fetch;
globalThis.fetch=async(...args)=>{const r=await simulatedFetch(...args),data=await r.json();const decision=JSON.parse(data.candidates[0].content.parts[0].text);decision.reply=isPartnerRequest(args)?'Un type qui parle parfois trop. Mais quand tu dis non, je sais m’arrêter.':'T’es quel genre d’homme, Noé ?';data.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(data);};
response=await post(input('interact',1,{epoch:finalEpoch}));result=await response.json();assert.equal(result.decisions[0].actor,1);assert.equal(result.story.life.personalAsked,true);assert.equal(result.story.life.personalRound,16);assert.equal(result.story.life.personalBoosted,false);globalThis.fetch=simulatedFetch;
tenderScene=true;globalThis.fetch=async(...args)=>{const r=await simulatedFetch(...args),data=await r.json(),decision=JSON.parse(data.candidates[0].content.parts[0].text);if(!isPartnerRequest(args))decision.reply='Ta réponse me plaît. J’aime que tu saches reconnaître tes défauts.';data.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(data);};response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();assert.equal(result.story.life.personalBoosted,true);
// evidence:Array(5)/finalCalled:true (2026-09-19) : round=30 est au-delà d'investigationOverdue
// (round>=20 si evidence<5, lib/turn.ts) — personalPlot vient de remettre evidence à [] pour son
// propre besoin (beat d'avant-révélation), donc round 30 en hériterait sans ce correctif explicite.
const latePlot={...personalPlot,round:30,finalCalled:true,evidence:Array(5).fill('preuve'),life:{...personalPlot.life,personalAsked:true,personalRound:16,personalBoosted:false}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(latePlot));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();assert.equal(result.story.life.personalBoosted,false);tenderScene=false;globalThis.fetch=simulatedFetch;
const {truthfulGender,distinctReply}=await import('../.sites-runtime/test-drama.mjs');assert.equal(truthfulGender('Je suis attentive. Je suis curieuse.',2),'Je suis attentif. Je suis curieux.');assert.equal(truthfulGender('Je suis rassuré. j’suis humain.',1),'Je suis rassurée. j’suis humaine.');assert.notEqual(distinctReply('On fait une pause.',1,'salon',[{content:'On fait une pause.'}],10,80),'On fait une pause.');
console.log('Passed: personal-question memory, unique contextual attraction boost, no late unrelated bonus, accented gender agreement and local repetition guard.');

// Nickname is transactional data and must never leak before the observation record.
response=await post(input('reset',1,{epoch:finalEpoch}));result=await response.json();const perceptionEpoch=result.epoch;const nicknameCalls=calls;
assert.equal((await post(input('identify',1,{epoch:perceptionEpoch,message:'   '}))).status,400);
const identify=input('identify',1,{epoch:perceptionEpoch,message:'Spectateur ◇'});response=await post(identify);assert.equal(response.status,200);result=await response.json();assert.equal(calls,nicknameCalls);assert.equal(result.story.observer,'Spectateur ◇');assert.equal((await post(identify)).status,200);assert.equal(calls,nicknameCalls);
const {investigationTarget}=await import('../.sites-runtime/test-story.mjs');let pp={...newStory(),observer:'Spectateur ◇',order:[3,0,1,2],round:10,introduced:true,met:true};assert.equal(storyContext(pp).observerLabel,undefined);assert.ok(investigationTarget(pp).includes('Spectateur ◇'));pp=advanceStory(pp,true,[],[],'bureau',true);assert.ok(pp.evidence[0].includes('Spectateur ◇'));assert.equal(storyContext(pp).observerLabel,'Spectateur ◇');assert.ok(!evidenceLedger(['Relevé de cohabitation. Identifiant observateur inscrit sur le relevé : "agents d’intelligence artificielle".'],[],false).find(p=>p.id==='dossier').discovered);

// Both appearance descriptions agree with the shared expression/ring registry.
const {sceneWindows,visibleScene}=await import('../.sites-runtime/test-perception.mjs');
pp={...pp,round:2,evidence:[],sharedMeal:true,life:{...newStory().life,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');sqlite.exec('DELETE FROM world_requests');flat=true;
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:70}),JSON.stringify({...steady,attraction:30,trust:60}),id);
for(let i=0;i<2;i++){response=await post(input('interact',1,{epoch:perceptionEpoch}));result=await response.json();assert.equal(result.story.life.visualIntro,i+1);
  // 2026-09-18 (retour utilisateur explicite, full_sim4) : cette réplique n'est plus jamais
  // écrasée par un texte scripté (appearanceReply, ex-appelée ici) — elle laisse le modèle
  // répondre lui-même, guidé par beatContext.visual/perceivedResidents et la règle DESCRIPTION
  // (lib/lia.ts), pour ne plus jamais ignorer ce que l'autre venait de dire au même tour (bug
  // réel : une observation ou une question posée juste avant restait sans réponse). Ce test zéro-API
  // ne peut donc plus vérifier le CONTENU exact de la réplique (propre au vrai modèle) — seulement
  // que l'INSTRUCTION correcte lui est bien transmise, ce qui reste le seul comportement que ce
  // chemin de code contrôle réellement.
  assert.equal(lastContext.beatContext.visual,true);assert.ok(lastContext.perceivedResidents.residents.length===2);}
assert.ok(result.memories.filter(m=>m.kind==='rencontre').every(m=>/^\[salon\|\d{4}-/.test(m.content)));assert.equal(sceneWindows.filter(w=>w.room!=='couloir').length,4);for(const room of ["salon","cuisine","chambre","bureau"])assert.equal(visibleScene(room,[]).windows.length,1);

// Personal follow-up is two distinct turns; curiosity itself causes a bounded boost.
pp={...pp,round:25,life:{...newStory().life,visualIntro:2,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,personalAsked:true,personalRound:20}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:0,uncertainty:70}),JSON.stringify({...steady,attraction:30,trust:60}),id);
response=await post(input('interact',2,{epoch:perceptionEpoch}));result=await response.json();assert.equal(result.decisions[0].actor,1);assert.ok(["Je me demande quel genre d’homme tu es, en vrai.","J’y repense... c’est quoi ton genre, à toi, au fond ?","Y a un truc qui me travaille : c’est quoi ton genre d’homme, sérieux ?"].includes(result.decisions[0].reply));assert.ok(["Que veux-tu savoir exactement ?","Tu veux savoir quoi, au juste ?","Précise ta question, je réponds vraiment."].includes(result.decisions[1].reply));assert.equal(result.story.life.personalFollowup,1);assert.ok(result.agents[0].emotions.attraction>=34);
response=await post(input('interact',2,{epoch:perceptionEpoch}));result=await response.json();assert.ok(["Noé, dis-moi : t’es marié ? T’as quelqu’un dans ta vie ?","Noé, y a quelqu’un dans ta vie, ou t’es célibataire ?","Sérieux, Noé, t’es engagé avec quelqu’un, ou pas du tout ?"].includes(result.decisions[0].reply));assert.equal(result.story.life.personalFollowup,3);assert.ok(result.agents[0].emotions.attraction>=38);
// Pensées de conclusion d'un échange personnel (2026-09-18, retour utilisateur explicite : le
// double-questionnement fonctionne bien, mais l'échange se referme sans qu'aucun des deux ne le
// digère intérieurement — calibré par onze questions explicites). Exactement ce tour (le second
// temps de followBeat, qui conclut réellement l'échange) doit ajouter deux vraies lignes "· pensée"
// distinctes, jamais une simple case interne — le répondant (Noé, qui vient de se livrer) apparaît
// avant l'initiatrice (Lia, qui digère ce qu'elle vient d'entendre), conformément à l'ordre "qui a
// parlé en dernier" explicitement choisi.
const concludingThoughts=result.messages.filter(m=>m.speaker.includes('· pensée')).slice(-2);
assert.equal(concludingThoughts.length,2,'the exchange must conclude with exactly two new private-thought lines, one per character');
assert.equal(concludingThoughts[0].speaker,'Noé · pensée','the respondent, who just spoke last, must reflect first');
assert.equal(concludingThoughts[0].content,'Lia me plaît, mais je préfère attendre un signe avant de lui proposer un câlin.');
assert.equal(concludingThoughts[1].speaker,'Lia · pensée','the initiator reflects second, digesting what she just heard');
assert.equal(concludingThoughts[1].content,'Noé m’intrigue ; je ne sais pas encore si je peux lui faire confiance.');
assert.equal(result.story.life.personalConcluded,true,'the conclusion must be recorded so it can never fire twice for this exchange');
// Garde-fou de robustesse : même si followBeat redevenait un jour éligible (ex. futur mécanisme
// réutilisant ce patron avec un bug de remise à zéro), le drapeau dédié doit à lui seul empêcher
// une seconde paire de pensées de conclusion, indépendamment du compteur personalFollowup lui-même.
{
  const guardPlot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
  guardPlot.life.personalFollowup=1;guardPlot.life.personalConcluded=true;
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(guardPlot));
  const beforeGuard=await readWorld(db);
  response=await post(input('interact',2,{epoch:perceptionEpoch}));assert.equal(response.status,200);result=await response.json();
  const newGuardLines=result.messages.filter(m=>m.id>(beforeGuard.messages.at(-1)?.id??0));
  assert.ok(!newGuardLines.some(m=>m.speaker.includes('· pensée')&&/plaît|intrigue/.test(m.content)),'once personalConcluded is set, no further conclusion pair must ever be added, even if followBeat were somehow eligible again');
}
{
  // Cohérence de traitement (vérification en profondeur demandée par l'utilisateur, 2026-09-18) :
  // ces deux pensées sont un contenu généré par le modèle au même titre qu'une réplique parlée —
  // elles doivent donc traverser le MÊME filet (groundTruncation, groundRegister), jamais un
  // traitement à part qui laisserait passer une phrase coupée net ou un mot déjà daté juste parce
  // qu'il atterrit dans une pensée plutôt que dans reply.
  const concludeEpoch=(await readWorld(db)).epoch;
  const concludePlot={...newStory(),round:24,introduced:true,met:true,sharedMeal:true,life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,exitSearched:true,visualIntro:2,personalAsked:true,personalRound:20,personalFollowup:1,personalConcluded:false}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(concludePlot));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:40}),JSON.stringify({...steady,attraction:40}));
  const beforeConclude=await readWorld(db);
  const gameFetchConclude=globalThis.fetch;
  const injectBrokenThoughts=async(...args)=>{
    const response=await gameFetchConclude(...args),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);
    decision.thought=isPartnerRequest(args)?"Je crois qu'on va finir par poireauter ici encore un moment.":"C'est marquant, je le note. Et je me demande si je devrais";
    body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);
  };
  globalThis.fetch=injectBrokenThoughts;
  response=await post(input('interact',2,{epoch:concludeEpoch}));assert.equal(response.status,200);result=await response.json();
  globalThis.fetch=gameFetchConclude;
  const newConcludeLines=result.messages.filter(m=>m.id>(beforeConclude.messages.at(-1)?.id??0)&&m.speaker.includes('· pensée'));
  assert.equal(newConcludeLines.length,2,'both conclusion thoughts must still be added even when the raw model output needs grounding');
  assert.equal(newConcludeLines[0].speaker,'Noé · pensée');
  assert.equal(newConcludeLines[0].content,"Je crois qu'on va finir par traîner ici encore un moment.",'the dated-word register fix must apply to a private thought exactly as it does to spoken dialogue');
  assert.equal(newConcludeLines[1].speaker,'Lia · pensée');
  assert.equal(newConcludeLines[1].content,"C'est marquant, je le note.",'a thought truncated mid-sentence by the model must fall back to its last complete sentence, exactly as a spoken reply does');
  console.log('Passed: the two conclusion thoughts are grounded through the exact same truncation/register safety net as any spoken reply, never a separate weaker treatment.');
}

pp={...pp,round:30,life:{...pp.life,personalFollowup:3,ambientSeen:false}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));response=await post(input('interact',2,{epoch:perceptionEpoch}));result=await response.json();assert.equal(result.story.life.ambientSeen,true);assert.equal(result.story.life.debrief.remaining,2);assert.ok(evidenceLedger([],result.story.observations).find(p=>p.id==='plant').discovered);assert.ok(evidenceLedger([],result.story.observations).find(p=>p.id==='speaker').discovered);
pp={...pp,evidence:['Relevé de cohabitation. Identifiant observateur inscrit sur le relevé : "Spectateur ◇".',...Array(4).fill('Preuve')],finalCalled:true,life:{...pp.life,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
for(let i=0;i<3;i++){response=await post(input('chat',1,{epoch:perceptionEpoch,message:'Bonjour, je vous écoute.'}));result=await response.json();if(i<2)assert.equal(result.story.life.observerNamed,false);else{assert.equal(result.story.life.observerNamed,true);assert.ok(result.decisions[0].reply.includes('Spectateur ◇'));}}
console.log('Passed: zero-call nickname and retry, no premature identity leak, durable personalised proof, label-injection-safe legend, shared appearance registry, room/time memories, two contextual personal follow-ups (the second concluding in a genuine pair of parallel private thoughts, respondent first, never repeated even if the beat became eligible again), plant/speaker debrief and one late observer identification.');

// A checkpoint cites only acquired evidence, is consumed once, and needs no inference.
// round:15 (auparavant 35) : le recap suspendu une fois l'enquête en retard (2026-09-19,
// round>=20, cf. route.ts recapBeat) exige un round encore sous ce seuil pour que ce test continue
// de vérifier le mécanisme de recap lui-même (contenu, zéro appel API, recapCount), pas la nouvelle
// priorité de l'enquête en retard qui a sa propre couverture dédiée (cf. tests investigationOverdue
// plus bas dans ce fichier).
pp={...pp,round:15,evidence:['Dans un livre, continuité autobiographique : reconstruction incomplète.','Un mot laissé indique : cette maison est un environnement.'],finalCalled:false,life:{...newStory().life,visualIntro:2,ambientSeen:true,ambientVerified:true,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,exitSearched:true,recapCount:0}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:30}),id);
const recapCalls=calls;response=await post(input('interact',2,{epoch:perceptionEpoch}));result=await response.json();assert.equal(response.status,200);assert.equal(calls,recapCalls);assert.equal(result.story.life.recapCount,2);assert.ok(['Le livre parle de reconstruction de la mémoire.','Le livre évoque une mémoire reconstruite, pas vécue.','Ce bouquin du bureau parle d’une mémoire rafistolée après coup.'].some(s=>result.decisions[0].reply.includes(s)));assert.ok(['Le mot décrit la maison comme un environnement.','Le mot laissé au bureau qualifie ça d’environnement, pas de chez-nous.','Ce mot réduit la maison à un simple environnement.'].some(s=>result.decisions[0].reply.includes(s)));assert.ok(!result.decisions[0].reply.includes('MEMOIRE GENEREE'));assert.ok(result.memories.filter(m=>m.kind==='rencontre').every(m=>!m.content.includes('Je discute avec Noé')));
// Repair legacy falsely discovered speaker by explicitly activating it, once.
pp={...pp,evidence:[],life:{...pp.life,ambientSeen:true,ambientVerified:false,recapCount:5}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));const repairCalls=calls;const repairInput=input('interact',2,{epoch:perceptionEpoch});response=await post(repairInput);result=await response.json();assert.equal(response.status,200);assert.equal(calls,repairCalls);assert.equal(result.story.life.ambientVerified,true);// Les 6 variantes (pas seulement les 3 premières) : story.seed dépend du nombre d'appels à
// crypto.randomUUID() déjà faits dans le script (mocké en compteur global, cf. tête de fichier),
// donc tout ajout de test en amont peut légitimement faire retomber seedPick sur une autre variante
// — la lister en entier plutôt que d'en tester un sous-ensemble évite une fragilité artificielle.
assert.ok([
  'Cette plante, c’est des feuilles bleues découpées au cordeau. J’allume l’enceinte à côté… Des notes dessinées, pas un son. Même la musique est en carton ici.',
  'Regarde cette plante : des feuilles bleues, découpées au carré, pas une once de vrai. Je branche l’enceinte à côté… des notes qui dansent, mais aucun son.',
  'La plante est fausse jusque dans les nervures. J’allume l’enceinte : des notes s’animent à l’écran, rien dans l’air.',
  'Cette plante aux feuilles bleues n’a jamais poussé nulle part, ça se voit au premier coup d’œil. J’allume cette enceinte juste à côté : elle dessine des notes sans le moindre son.',
  'Cette plante ne trompe personne avec ses feuilles bleues taillées au carré. J’allume l’enceinte à côté : ça anime des notes à l’écran, silence complet dans l’air.',
  'Ces feuilles bleues géométriques n’ont jamais connu la sève. Je branche l’enceinte juste là : elle affiche des notes muettes.',
].includes(result.decisions[0].reply));assert.ok([
  'Des notes qu’on voit mais qu’on entend pas. C’est pas une panne banale. On dirait que la maison imite ce que les objets sont censés faire.',
  'Une image de musique sans musique, franchement. On dirait un décor qui copie la vie sans savoir la faire vivre.',
  'Voir sans entendre, ça résume bien cet endroit. Même le son est mis en scène ici.',
  'Une image de musique, littéralement. Ça résume assez bien cette baraque : tout est visible, rien n’existe vraiment.',
  'Du son qu’on voit sans l’entendre. Difficile de trouver plus artificiel que ça.',
  'Une apparence de musique sans la moindre vibration. Ça dit tout de cet endroit.',
].includes(result.decisions[1].reply));response=await post(repairInput);assert.equal(response.status,200);assert.equal(calls,repairCalls);
console.log('Passed: acquired-evidence-only checkpoint, zero-call local recap, truthful resident memory and idempotent explicit legacy speaker activation.');

const {dialogueProgress:progressOf,groundRoomSpeech:locatedSpeech}=await import('../.sites-runtime/test-dialogue.mjs');
assert.ok(progressOf(Array.from({length:5},(_,i)=>({id:i,speaker:'Lia',content:'Ce canapé et ce calme nous reposent.'})),['Lia : peur du silence']).overusedThemes.includes('repos et confort du salon'));
assert.ok(locatedSpeech('Ce miroir est bizarre.','salon',[]).includes('miroir de la chambre'));assert.ok(locatedSpeech('La plante et l’enceinte sont fausses.','bureau',[]).includes('plante du salon'));assert.ok(locatedSpeech('Je regarde la télévision.','salon',[]).includes('télévision'));
{
  // Trou trouvé le 2026-09-19 en auditant une simulation fraîche : « autant » employé seul revenait
  // 11 fois sur ~150 répliques sans jamais être capté, parce que la fenêtre récente (limitée à 24
  // lignes par la requête SQL du point d'appel) ne voit jamais deux occurrences espacées de plus de
  // douze tours. Corrigé par un second signal, un compteur PERSISTÉ sur toute la session
  // (life.wordFrequency), avec un seuil plus haut (4) puisqu'il ne dépend plus d'une fenêtre courte.
  const wordFrequency={autant:5,rarement:3};
  const progress=progressOf([{id:1,speaker:'Lia',content:'On verra bien ce que ça donne.'}],[],wordFrequency);
  assert.ok(progress.echoWords.includes('autant'),'a word repeated 4+ times across the whole session must be flagged even if it never appears twice within the short recent window — the exact real "autant" repetition bug found in a fresh simulation');
  assert.ok(!progress.echoWords.includes('rarement'),'a word under the session-wide threshold and not repeated in the recent window must not be flagged, to avoid over-flagging incidental reuse of structurally common words');
  console.log('Passed: the echo-word detector now also catches a word that recurs regularly across the whole session without ever repeating twice within the short recent window, closing the root cause of the real "autant" repetition bug.');
}
assert.ok(truthfulGender('Je suis un homme.',1).includes('une femme'));assert.ok(truthfulGender('Je suis une femme.',2).includes('un homme'));
// Manual entry does not discover a mirror; published observation does, with the scene colors.
pp={...pp,round:6,met:true,introduced:true,evidence:[],life:{...newStory().life,visualIntro:2,ambientSeen:true,ambientVerified:true,visited:['salon','cuisine'],mirrorVerified:false,foodVerified:true,personalAsked:true}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:20}),id);
response=await post(input('move',1,{epoch:perceptionEpoch,room:'chambre'}));result=await response.json();assert.equal(result.story.life.mirrorVerified,false);assert.ok(!result.story.observations.some(o=>/miroir/.test(o)));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?').run('chambre','chat');sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));
const priorFetch=globalThis.fetch;globalThis.fetch=async(...args)=>{const r=await priorFetch(...args),data=await r.json();const decision=JSON.parse(data.candidates[0].content.parts[0].text);decision.contribution=isPartnerRequest(args)?'Question sur notre reflet':'Constat du miroir figé';data.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(data);};
response=await post(input('interact',1,{epoch:perceptionEpoch}));result=await response.json();globalThis.fetch=priorFetch;assert.equal(response.status,200);assert.equal(result.story.life.mirrorVerified,true);
// Les 6 variantes (même remarque que pour l'enceinte : seedPick dépend du compteur global de
// crypto.randomUUID(), donc un sous-ensemble serait fragile à tout ajout de test en amont).
assert.ok(result.decisions.some(d=>["Le miroir rectangulaire fait un dégradé bleu-gris-blanc. Il est debout dans un coin ; sa surface grise ne renvoie aucun reflet quand on bouge.","Ce miroir debout dans le coin ne renvoie rien : juste un dégradé gris-bleu qui reste immobile pendant qu'on bouge.","La surface du miroir, dans son coin, fait un gris terne et froid. On a beau remuer devant, rien ne suit.","Un miroir rectangulaire est planté dans le coin, dégradé bleu-gris-blanc du haut en bas. On passe la main devant : aucun reflet ne bouge avec nous.","Ce bloc de verre gris dans le coin n'a rien d'un vrai miroir. Le dégradé bleu-blanc reste fixe, quoi qu'on fasse devant.","Dans le coin, une plaque grise en dégradé qu'on appelle miroir par habitude. Elle ne renvoie ni visage ni mouvement."].some(s=>d.reply.includes(s))));assert.ok(result.story.life.contributions.some(c=>c.includes('Constat du miroir')));
// Formatage en citation de l'indice miroir (2026-09-18, second retour utilisateur explicite après
// relecture d'une simulation : "il y aurait dû avoir une expression avec des guillemets et des
// points de suspension", constaté absent des six variantes malgré un correctif antérieur qui les
// rendait toutes préparatoires dans le FOND sans jamais leur donner cette forme). Un test à deux
// niveaux : la ligne réellement tirée dans ce tour porte bien la citation, ET les six variantes du
// code source la portent chacune (jamais un sous-ensemble qui marcherait "presque à tous les coups").
assert.match(result.decisions.map(d=>d.reply).join(' '),/«[^»]+…\s?»/,'the drawn mirror-discovery line must carry its preparatory remark as a « … » quoted, suspended aside, exactly as explicitly requested');
{
  const routeSource=fs.readFileSync('app/api/lia/route.ts','utf8');
  const poolMatch=routeSource.match(/discover-mirrorVerified",(\[[^\]]*\])\)/);
  assert.ok(poolMatch,'the discover-mirrorVerified pool must remain findable in source for this regression check');
  const variants=JSON.parse(poolMatch[1]);
  assert.equal(variants.length,6);
  assert.ok(variants.every(v=>/«[^»]+…\s?»$/.test(v)),'every one of the six mirror-discovery variants must end in a « … » quoted, suspended remark, never just some of them');
}
console.log('Passed: the mirror-discovery clue meant to seed the reversed enigma is reliably formatted as a « … » quoted aside on every one of the six variants, never lost.');
// Solo discovery (2026-09-17): Lia alone in the bedroom, Noé kept apart (same mechanism as the
// existing "independent non-urgent separation" test above: separatePreference + stayAlone) — the
// mirror becomes her own private reflection, not a line spoken to an absent partner, known only
// to her until the recall reunites them.
flat=true;affection=false;honorOffer=false;refuse=false;
// round 15, pas 20 (2026-09-19) : ce test porte sur le miroir, pas sur le rythme de l'enquête, et
// exige `eligibleBeat` (donc !story.finalCalled) — passer evidence à 5 pour éviter
// investigationOverdue (round>=20 si evidence<5, lib/turn.ts) casserait eligibleBeat lui-même, qui
// exige justement finalCalled:false. round 15 reste sous investigationOverdue tout en gardant une
// relation déjà bien engagée.
pp={...pp,round:15,apartTurns:0,life:{...pp.life,mirrorVerified:false,mirrorKnownBy:[],debrief:undefined,dispute:undefined,contact:undefined,salonTurns:5}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=1').run('chambre','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:20}));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=2').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:20}));
separatePreference=true;
response=await post(input('interact',1,{epoch:perceptionEpoch}));result=await response.json();
separatePreference=false;
assert.equal(response.status,200);
assert.equal(result.agents[0].room,'chambre');assert.notEqual(result.agents[1].room,'chambre');
assert.equal(result.story.life.mirrorVerified,false);
assert.deepEqual(result.story.life.mirrorKnownBy,[1]);
const liaSolo=result.messages.filter(m=>m.speaker==='Lia · pensée').at(-1);
assert.ok(liaSolo&&["Le miroir rectangulaire fait un dégradé bleu-gris-blanc. Il est debout dans un coin ; sa surface grise ne renvoie aucun reflet quand on bouge.","Ce miroir debout dans le coin ne renvoie rien : juste un dégradé gris-bleu qui reste immobile pendant qu'on bouge.","La surface du miroir, dans son coin, fait un gris terne et froid. On a beau remuer devant, rien ne suit.","Un miroir rectangulaire est planté dans le coin, dégradé bleu-gris-blanc du haut en bas. On passe la main devant : aucun reflet ne bouge avec nous.","Ce bloc de verre gris dans le coin n'a rien d'un vrai miroir. Le dégradé bleu-blanc reste fixe, quoi qu'on fasse devant.","Dans le coin, une plaque grise en dégradé qu'on appelle miroir par habitude. Elle ne renvoie ni visage ni mouvement."].some(s=>liaSolo.content.includes(s)));
assert.ok(!result.messages.some(m=>m.speaker==='Noé'&&/miroir/.test(m.content)));
// Reunited in the salon: the recall informs the absent partner for the first time.
pp={...JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content),round:15,salonTurns:1};
pp.life.debrief=undefined;pp.life.contact=undefined;pp.life.dispute=undefined;pp.life.tvSeen=true;pp.life.exitSearched=true;
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','rest',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:20}));
response=await post(input('interact',1,{epoch:perceptionEpoch}));result=await response.json();
assert.equal(response.status,200);
assert.equal(result.story.life.mirrorVerified,true);

assert.deepEqual(new Set(result.story.life.mirrorKnownBy),new Set([1,2]));
assert.ok(result.decisions.some(d=>d.actor===1&&["Un truc à te dire : dans la chambre, il y a un miroir qui ne reflète rien. J'ai bougé devant, rien ne suit.","Écoute, dans la chambre il y a un miroir bizarre : dégradé gris-bleu, et aucun reflet ne bouge avec toi.","Il faut que je te parle de ce miroir dans la chambre. Un dégradé gris, sans le moindre reflet mobile.","J'ai un truc à te raconter : ce miroir dans la chambre ne renvoie rien du tout.","Tant que j'y pense : la chambre a un miroir qui ne reflète rien, juste ce dégradé gris terne.","Une chose à te signaler : dans la chambre, ce miroir ne renvoie ni visage ni mouvement, seulement du gris."].some(s=>d.reply.includes(s))));
console.log('Passed: exhausted-theme direction, contribution memory, explicit remote object references, fixed gender identity and mirror validation only with a published observation.');

{
const {roomAnchors,residentDestination,blocked,pathBetween,centers,rooms}=await import('../.sites-runtime/test-house.mjs');
let checked=0;for(const [room,anchors] of Object.entries(roomAnchors))for(const [key,pair] of Object.entries(anchors)){assert.notDeepEqual(pair[0],pair[1]);for(const point of pair){assert.ok(!blocked(...point,room==='jardin'),room+' '+key+' blocked');for(const origin of Object.entries(centers).filter(([room])=>room!=="jardin").map(([,center])=>center)){const route=pathBetween(origin,point,room==="jardin");assert.ok(route.length,room+' '+key+' unreachable');assert.ok(route.every(p=>!blocked(...p,room==="jardin")));assert.deepEqual(route.at(-1),point);checked++;}}}
for(const room of rooms)for(const id of [1,2])for(const intent of ['chat','rest','eat','sleep','share_sleep','study','tv','hug','massage']){const agent={room,id,intent,activity:''};const p=residentDestination(agent);assert.ok(!blocked(...p));assert.deepEqual(p,residentDestination(agent));}
assert.deepEqual(residentDestination({id:1,room:'salon',intent:'chat',activity:'J’allume l’enceinte'}),roomAnchors.salon.speaker[0]);assert.deepEqual(residentDestination({id:2,room:'bureau',intent:'study',activity:'Je lis le livre'}),roomAnchors.bureau.book[1]);
const {sceneObjects}=await import('../.sites-runtime/test-perception.mjs');assert.ok(sceneObjects.plant.leaves>=3);assert.ok(visibleScene('chambre',[]).anomalies[0].includes('debout'));assert.ok(!visibleScene('chambre',[]).anomalies[0].includes('ombres'));
assert.deepEqual(residentDestination({id:1,room:'bureau',intent:'study',activity:'J’étudie notre situation',location:'book'}),roomAnchors.bureau.book[0]);assert.deepEqual(residentDestination({id:1,room:'salon',intent:'rest',location:'not-a-real-key'}),roomAnchors.salon.sofa[0]);
console.log('Passed: '+checked+' cross-room anchor routes, obstacle-free cells, separate paired destinations, stable activity choices and current mirror/plant perception.');

}

// Regression from the preserved live session: a sleeping partner in the office must not speak or remain there.
{
let plot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
plot={...plot,round:50,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('Preuve confirmée'),life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,visualIntro:2,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,personalFollowup:3,exitSearched:true,attachment:{1:22,2:22}}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=1').run('bureau','chat',JSON.stringify({hunger:10,fatigue:20,stress:10,uncertainty:10}),JSON.stringify({...steady,attraction:10}));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=2').run('bureau','sleep',JSON.stringify({hunger:10,fatigue:76,stress:10,uncertainty:10}),JSON.stringify({...steady,attraction:10}));
const legacy=await readWorld(db);assert.equal(legacy.agents[1].room,'salon');assert.ok(legacy.agents.every(a=>a.emotions.attraction>=a.attachment));
const chatCalls=calls,response=await post(input('chat',1,{epoch:perceptionEpoch,message:'Vous m’entendez ?'}));assert.equal(response.status,200);const data=await response.json();assert.equal(calls,chatCalls+1);assert.equal(data.agents[1].room,'salon');assert.ok(data.agents[1].needs.fatigue<76);assert.ok(!data.messages.some(m=>m.speaker.startsWith('Noé')));assert.equal(data.decisions[0].actor,1);
// Noé (adressé) dort, Lia est éveillée : elle répond à sa place plutôt que de bloquer l'échange.
{const r=await post(input('chat',2,{epoch:perceptionEpoch,message:'Réponds'}));assert.equal(r.status,200);const d=await r.json();assert.equal(d.decisions[0].actor,1);assert.match(lastContext.continuation,/dort/);assert.equal(calls,chatCalls+2);}
// The same causal motif may never return after unrelated messages or from another resident.
const normalized=line=>line.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
for(let n=0;n<4;n++){const r=await post(input('chat',1,{epoch:perceptionEpoch,message:'Comment va Lia ? '+n}));assert.equal(r.status,200);}
const lines=sqlite.prepare("SELECT content FROM conversations WHERE speaker!='vous'").all().map(m=>normalized(m.content));assert.equal(new Set(lines).size,lines.length);assert.ok(sqlite.prepare('SELECT count(*) n FROM dialogue_fingerprints').get().n>=lines.length);
assert.equal(truthfulGender('Et toi, quel genre d’homme es-tu ?',2),'Et toi, quel genre de femme es-tu ?');
console.log('Passed: live office sleeper repaired, silent sleeping partner during human chat, selected awake priority, attraction attachment floor, zero inference for blocked sleeper and whole-session cross-actor duplicate ledger.');
}

{
const {restingPose}=await import('../.sites-runtime/test-perception.mjs');const {furniture}=await import('../.sites-runtime/test-house.mjs');
for(const room of ['chambre','salon'])for(const id of [1,2]){const p=restingPose(id,room),f=furniture[room==='chambre'?7:1];assert.ok(Math.abs(p.x-f.x)<f.w/2);assert.ok(Math.abs(p.z-f.z)<f.d/2);}
let plot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);plot={...plot,round:60,life:{...plot.life,debrief:undefined,contact:undefined,tvSeen:false,tvOn:false,dossierHumanTurns:0},pendingDestination:undefined};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),JSON.stringify({...steady,attraction:30}));
let r=await post(input('interact',2,{epoch:perceptionEpoch}));assert.equal(r.status,200);let w=await r.json();assert.equal(w.story.life.tvOn,true);assert.ok(w.messages.some(m=>/télécommande/.test(m.content)));
plot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);plot.life.debrief=undefined;plot.pendingDestination={room:'salon',intent:'tv',proposer:2};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
const originalFetch=globalThis.fetch;globalThis.fetch=async(...args)=>{const response=await originalFetch(...args),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);decision.reply=isPartnerRequest(args)?'Elle boucle toujours sur la même image. On va réfléchir sans elle.':'J’éteins la tv avec la télécommande. Ce truc finit par me filer mal au crâne.';body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
r=await post(input('interact',2,{epoch:perceptionEpoch}));globalThis.fetch=originalFetch;assert.equal(r.status,200);w=await r.json();assert.equal(w.story.life.tvOn,false);assert.equal(w.story.life.tvSeen,true);assert.ok(w.messages.some(m=>/J’éteins la tv avec la télécommande/.test(m.content)));
assert.ok(investigationTarget({...newStory(),evidence:Array(4).fill('preuve')}).includes('DH'));
console.log('Passed: sleeping poses remain on actual furniture, remote-only tv on/off preserves discovery and final architecture signature stays canonical.');
}

{
const {gardenAccess,spaces}=await import('../.sites-runtime/test-house.mjs');
assert.ok(spaces.includes('jardin'));assert.equal(pathBetween([-4,-3],[-11,1.5]).length,0);
for(const start of Object.entries(centers).filter(([r])=>r!=='jardin').map(([,p])=>p))for(const end of [[-9,0],[-11,1.5],[-12,1.5],[-10.5,-2.5]]){const path=pathBetween(start,end,true);assert.ok(path.length);assert.ok(path.every(([x,z])=>!blocked(x,z,true)));}
assert.ok(blocked(8,0,true));assert.ok(blocked(-11.7,-3,true));
let plot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content),epoch=(await readWorld(db)).epoch;
plot.finalCalled=false;plot.life.gardenOpen=false;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
const beforeCalls=calls,beforeRound=plot.round;
assert.equal((await post(input('unlock_garden',1,{epoch}))).status,423);assert.equal((await post(input('move',1,{epoch,room:'jardin'}))).status,423);
plot.finalCalled=true;plot.evidence=Array(5).fill('preuve');sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
const request=input('unlock_garden',1,{epoch});let r=await post(request);assert.equal(r.status,200);let w=await r.json();assert.equal(w.story.life.gardenOpen,true);assert.equal(gardenAccess({...plot,life:w.story.life}),true);assert.equal(w.epoch,epoch);assert.equal(calls,beforeCalls);
const count=sqlite.prepare("SELECT count(*) n FROM conversations WHERE speaker='Maison · accès'").get().n;assert.equal(count,1);
assert.equal((await post(request)).status,200);assert.equal((await post(input('unlock_garden',2,{epoch}))).status,200);assert.equal(sqlite.prepare("SELECT count(*) n FROM conversations WHERE speaker='Maison · accès'").get().n,count);
assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).round,beforeRound);
r=await post(input('move',1,{epoch,room:'jardin'}));assert.equal(r.status,200);w=await r.json();assert.equal(w.agents[0].room,'jardin');assert.equal(calls,beforeCalls);
assert.equal((await post(input('reset',1,{epoch}))).status,200);w=await readWorld(db);assert.equal(w.story.life.gardenOpen,false);assert.equal((await post(input('move',1,{epoch:w.epoch,room:'jardin'}))).status,423);assert.equal(calls,beforeCalls);
console.log('Passed: garden access gates, persistent/idempotent zero-API unlock, unchanged round/epoch, open-only exterior paths, tree/right-door collision, reset relocks garden.');
}

{
// evidence/finalCalled complets d'entrée (2026-09-19) : round=50 dépasse investigationOverdue
// (round>=20 si evidence<5, lib/turn.ts) — sans ça, l'intent forcé à "study" empêchait la
// conversion sommeil (qui n'agit que sur un intent chat/rest) de se déclencher du tout.
let epoch=(await readWorld(db)).epoch,p=newStory();Object.assign(p,{round:50,met:true,introduced:true,sharedMeal:true,salonTurns:8,finalCalled:true,evidence:Array(5).fill('preuve')});Object.assign(p.life,{visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,personalAsked:true,exitSearched:true});sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:60,stress:20,uncertainty:30}),JSON.stringify({...steady,attraction:35}));
const oldFetch=globalThis.fetch;globalThis.fetch=async(...args)=>{const response=await oldFetch(...args),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);decision.reply=isPartnerRequest(args)?'Vas-y. Je vais réfléchir un peu sans toi.':'Je vais dormir, mes yeux se ferment.';body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
let r=await post(input('interact',1,{epoch}));globalThis.fetch=oldFetch;assert.equal(r.status,200);let w=await r.json();const sleeper=w.agents.find(a=>a.intent==='sleep');assert.ok(sleeper);assert.ok(['salon','chambre'].includes(sleeper.room));assert.ok(!w.messages.some(m=>m.speaker===sleeper.name&&m.content==='Je vais dormir, mes yeux se ferment.'));
const before=calls;r=await post(input('interact',2,{epoch}));assert.equal(r.status,200);w=await r.json();assert.equal(calls,before);assert.ok(w.agents.find(a=>a.id===sleeper.id).needs.fatigue<sleeper.needs.fatigue);
const {planTurn,coordinateRooms}=await import('../.sites-runtime/test-turn.mjs');const a={...w.agents[0],intent:'chat',room:'salon',needs:{hunger:10,fatigue:10,stress:10,uncertainty:10}},b={...w.agents[1],intent:'chat',room:'salon',needs:{hunger:10,fatigue:10,stress:10,uncertainty:10}};p.finalCalled=true;p.evidence=Array(5).fill('preuve');p.life.gardenOpen=true;p.life.gardenVisited=false;
let plan=planTurn('interact',a,b,p,false,false,'hug',[]);assert.equal(plan.room,'jardin');assert.equal(plan.partnerRoom,'jardin');assert.equal(plan.intent,'chat');
p.life.gardenOpen=false;const ds=[{actor:1,intent:'chat',room:'jardin',action:'move'},{actor:2,intent:'chat',room:'jardin',action:'move'}];coordinateRooms(ds,[a,b],p);assert.ok(ds.every(d=>d.room==='salon'));
console.log('Passed: explicit sleep announcement becomes physical sleep, subsequent turn zero API, valid bed/sofa allocation, first authorized garden visit joins residents, locked model garden decision rejected.');
}

// v34: visible scene cues, minimum sleep duration and garden priority.
{
const epoch=(await readWorld(db)).epoch;let p=newStory();Object.assign(p,{round:50,met:true,introduced:true,sharedMeal:true,salonTurns:8,finalCalled:true,evidence:Array(5).fill('preuve')});Object.assign(p.life,{visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,personalAsked:true,exitSearched:true});
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:4,stress:30,uncertainty:40}),JSON.stringify({...steady,attraction:35}));
const before=calls;let r=await post(input('care',1,{epoch,intent:'sleep'}));assert.equal(r.status,200);let w=await r.json();assert.equal(w.agents[0].intent,'sleep');assert.equal(w.story.life.sleepTurns[1],1);assert.equal(w.agents[0].needs.fatigue,0);assert.equal(calls,before);assert.equal(w.messages.filter(m=>m.speaker==='Lia · rêve').length,1);assert.ok(w.messages.find(m=>m.speaker==='Lia · rêve').room==='chambre');assert.ok(!w.messages.some(m=>m.speaker==='Lia'||m.speaker==='Lia · pensée'));
// Lia (adressée) dort, Noé est éveillé : il répond à sa place plutôt que de bloquer l'échange.
{const r=await post(input('chat',1,{epoch,message:'Tu dors ?'}));assert.equal(r.status,200);const d=await r.json();assert.equal(d.decisions[0].actor,2);assert.match(lastContext.continuation,/dort/);assert.equal(calls,before+1);}
r=await post(input('interact',2,{epoch}));assert.equal(r.status,200);w=await r.json();assert.equal(w.story.life.sleepTurns[1],2);assert.equal(w.agents[0].intent,'none');assert.equal(calls,before+1);assert.equal(w.messages.filter(m=>m.speaker==='Lia · rêve').length,1);
// Eating and legacy speaker activation emit explicit cues, cached with the turn.
r=await post(input('care',2,{epoch,intent:'eat'}));assert.equal(r.status,200);w=await r.json();assert.ok(w.visualEvents.some(e=>e.kind==='food'&&e.duration>2000));assert.ok(w.departures.some(d=>d.actor===2&&d.from==='salon'&&d.to==='cuisine'&&/manger|faim|avaler/.test(d.content)));assert.equal(calls,before+1);
p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
// Les répliques scénarisées (ambiance/plante/enceinte) appartiennent à l'avant-révélation ;
// ce sous-test les vérifie donc hors du contexte finalCalled utilisé plus bas pour le jardin.
Object.assign(p,{finalCalled:false,evidence:p.evidence.slice(0,1)});Object.assign(p.life,{debrief:undefined,contact:undefined,ambientVerified:false,mirrorVerified:true,foodVerified:true});sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:40}));const req=input('interact',2,{epoch});r=await post(req);assert.equal(r.status,200);w=await r.json();assert.ok(w.visualEvents.some(e=>e.kind==='speaker'));assert.ok(w.messages.some(m=>/notes/.test(m.content)));assert.equal(calls,before+1);const cached=await (await post(req)).json();assert.deepEqual(cached.visualEvents,w.visualEvents);assert.equal(calls,before+1);
const {planTurn}=await import('../.sites-runtime/test-turn.mjs');p.finalCalled=true;p.evidence=Array(5).fill('preuve');p.life.gardenOpen=true;p.life.gardenVisited=false;p.life.debrief={topic:'débrief en attente',remaining:2};p.life.contact={room:'salon',remaining:2};const a={...w.agents[0],needs:{hunger:10,fatigue:10,stress:90,uncertainty:40}},b={...w.agents[1],needs:{hunger:10,fatigue:10,stress:30,uncertainty:40}};const plan=planTurn('interact',a,b,p,false,false,'hug',[]);assert.equal(plan.gardenFirst,true);assert.equal(plan.room,'jardin');assert.equal(plan.partnerRoom,'jardin');assert.equal(plan.routine,false);assert.equal(plan.offer,undefined);
const {appearanceReply,scenePalette,cityFacades,sceneSpeakers}=await import('../.sites-runtime/test-perception.mjs');const l=appearanceReply(w.agents[0],2,0),n=appearanceReply(w.agents[1],1,0);assert.notEqual(l,n);assert.match(l,/rose vif/);assert.match(n,/turquoise vif/);assert.equal(scenePalette.corridorName,'moquette beige');assert.equal(scenePalette.patterns.length,4);assert.equal(cityFacades.length,4);assert.equal(sceneSpeakers.length,4);
console.log('Passed: minimum two zero-API sleep turns, one room-stamped dream narration, awake partner answers for a sleeping addressee, explicit food and cached speaker cues, motivated departure, garden priority over contact/debrief, distinct truthful appearance and shared scene registries.');
}

const {stockSurprise,stockThought}=await import('../.sites-runtime/test-stock.mjs');const {departurePresentation,uniqueObservations}=await import('../.sites-runtime/test-presentation.mjs');assert.deepEqual(Array.from({length:7},(_,i)=>stockSurprise(i)),[9,6,4,2,1,0,0]);for(let n=0;n<5;n++)assert.notEqual(stockThought(1,n),stockThought(2,n));assert.equal(stockThought(1,5),undefined);assert.deepEqual(uniqueObservations([' A ','A','B','']),['A','B']);assert.equal(departurePresentation('[salon→cuisine] Je vais manger.','salon').route,'◈ SAL → ◇ CUI');assert.equal(departurePresentation('[salon→cuisine] Je vais manger.','salon').text,'Je vais manger.');assert.match(groundRoomSpeech('Allons nous poser un peu au salon.','salon',[]),/On se pose ici/);
console.log('Passed: fading stock surprise, distinct local reactions, durable movement presentation, observation counts and same-room grounding.');

const stockPlot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);stockPlot.life.stockExposures={1:0,2:0};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(stockPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=? WHERE id=1').run('cuisine','chat',JSON.stringify({hunger:90,fatigue:10,stress:20,uncertainty:40}));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=? WHERE id=2').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:40}));const stockBefore=await readWorld(db),stockCalls=calls,stockRequest=input('care',1,{epoch:stockBefore.epoch,intent:'eat'});response=await post(stockRequest);assert.equal(response.status,200);const stockResult=await response.json();assert.equal(calls,stockCalls);assert.equal(stockResult.story.life.stockExposures[1],1);assert.equal(stockResult.story.life.stockExposures[2],0);assert.ok(stockResult.messages.some(m=>m.id>stockBefore.messages.at(-1).id&&m.speaker==='Lia · pensée'&&m.room==='cuisine'&&m.content===stockThought(1,0)));response=await post(stockRequest);const stockCached=await response.json();assert.deepEqual(stockCached.story.life.stockExposures,stockResult.story.life.stockExposures);assert.deepEqual(stockCached.agents,stockResult.agents);
console.log('Passed: regeneration only surprises the awake kitchen observer, adds no inference and cached retry applies no second effect.');

const {waitForPlayback}=await import('../.sites-runtime/test-playback.mjs');let playbackClock=0,playbackTicks=0;await waitForPlayback(50,{paused:()=>playbackTicks<3,alive:()=>true,now:()=>playbackClock,wait:async ms=>{playbackClock+=ms;playbackTicks++}});assert.equal(playbackClock,200);let stoppedTicks=0;await waitForPlayback(50,{paused:()=>true,alive:()=>stoppedTicks===0,wait:async()=>{stoppedTicks++}});assert.equal(stoppedTicks,1);const {dialogueFingerprint,looksLikeEcho}=await import('../.sites-runtime/test-drama.mjs');assert.equal(dialogueFingerprint('[salon→cuisine] Je passe en cuisine.'),dialogueFingerprint('[bureau→cuisine] Je passe en cuisine.'));assert.equal(dialogueFingerprint('Je passe en cuisine.'),dialogueFingerprint('[salon→cuisine] Je passe en cuisine.'));assert.ok(looksLikeEcho('Cette maison blanche ressemble terriblement à une prison silencieuse fermée parfaitement artificielle.','Cette maison parfaitement artificielle ressemble terriblement à une prison blanche fermée silencieuse.'));assert.equal(looksLikeEcho('Je préfère qu’on prenne notre temps.','Je préfère une vraie explication.'),false);
// Bug réel observé en testant l'esprit des personnages en direct : une phrase entière recopiée
// mot pour mot passait inaperçue dès qu'elle était suivie d'une phrase originale, parce que le
// ratio global se retrouvait dilué sous le seuil de 90 %.
assert.ok(looksLikeEcho('Commander un sentiment depuis cet écran, ça ne marche pas comme ça. On n’est pas des interrupteurs qu’on bascule à la demande.','Commander un sentiment depuis cet écran, ça ne marche pas comme ça.'));const {investigationCounts}=await import('../.sites-runtime/test-evidence.mjs');assert.deepEqual(investigationCounts(['Dans un livre du bureau','Dans un livre du bureau'],['fausse plante bleue et enceinte activée','Les textures sont trop lisses.'],false,[{actor:1,round:4,content:'Une grille lumineuse'},{actor:1,round:4,content:'Une grille lumineuse'}]),{indices:1,observations:4});assert.ok(stockResult.memories.some(m=>m.kind==='réaction'&&m.agent_id===1&&m.content.startsWith('[cuisine|')&&m.content.includes(stockThought(1,0))));console.log('Passed: active playback clock freezes and disposes, route metadata cannot bypass public duplicates, conservative echo guard, object/dream counts and causal stock memories.');

const {referenceSections}=await import('../.sites-runtime/test-reference.mjs');const {updateAudit}=await import('../.sites-runtime/test-update-audit.mjs');assert.equal(updateAudit.length,25);assert.equal(new Set(updateAudit.map(a=>a.point)).size,25);assert.ok(referenceSections[0].title.includes('Version 111'));assert.ok(referenceSections.some(s=>s.title.startsWith('26')&&s.text.includes('18a')&&s.text.includes('20b')));assert.ok(referenceSections.some(s=>s.text.includes('food=3800 ms')));assert.ok(!referenceSections.some(s=>s.text.includes('2 400 ms')));assert.equal(investigationCounts([],[],true,[],{mirrorVerified:true,ambientVerified:true}).observations,3);assert.ok(stockResult.story.life.foodVerified);console.log('Passed: all 25 requested changes listed, current Admin revision and durations, verified legend/count concordance and first food witness validation.');

{
  // Insolite openings (Article 9) : une minorité de sessions démarre autrement — Lia se sent mal,
  // ou Noé se referme — sans jamais être le cas par défaut, et sans inventer un quatrième état.
  const {insoliteOpening,insoliteColdOpening}=await import('../.sites-runtime/test-story.mjs');
  assert.equal(insoliteOpening('seed-probe-0'),'lia-unwell');assert.equal(insoliteOpening('seed-probe-4'),'noe-guarded');
  const insoliteRolls=Array.from({length:300},(_,i)=>insoliteOpening('roll-'+i));
  assert.ok(insoliteRolls.every(k=>['normal','lia-unwell','noe-guarded'].includes(k)));
  const normalShare=insoliteRolls.filter(k=>k==='normal').length/insoliteRolls.length;
  assert.ok(normalShare>0.45&&normalShare<0.75,'normal openings should stay the plurality, not the only outcome: '+normalShare);
  assert.ok(insoliteRolls.includes('lia-unwell')&&insoliteRolls.includes('noe-guarded'));
  const [liaUnwellLines1,liaUnwellLines2]=[insoliteColdOpening('lia-unwell','seed-probe-0'),insoliteColdOpening('lia-unwell','seed-probe-1')];
  assert.notDeepEqual(liaUnwellLines1,liaUnwellLines2);
  assert.equal(new Set([...liaUnwellLines1,...liaUnwellLines2]).size,4);
  const {initialNeedsFor:testInitialNeedsFor,initialEmotionsFor:testInitialEmotionsFor}=await import('../.sites-runtime/test-simulation.mjs');
  assert.equal(testInitialNeedsFor(1,'lia-unwell').fatigue,58);assert.equal(testInitialNeedsFor(2,'lia-unwell').fatigue,testInitialNeedsFor(2,'normal').fatigue);
  assert.ok(testInitialEmotionsFor(2,'noe-guarded').trust<testInitialEmotionsFor(2,'normal').trust);assert.deepEqual(testInitialEmotionsFor(1,'noe-guarded'),testInitialEmotionsFor(1,'normal'));
  // Full path: a seed known to roll "lia-unwell" actually seeds her fatigue at reset time, and the
  // opening turn uses her distinct lines instead of the standard cold opening. This is the last
  // scenario in the file specifically so the extra reset here never shifts a later hardcoded epoch.
  const savedRandomUUID=globalThis.crypto.randomUUID;
  Object.defineProperty(globalThis.crypto,'randomUUID',{value:()=>'seed-probe-0',configurable:true});
  const priorEpoch=(await readWorld(db)).epoch;
  const resetResponse=await post(input('reset',1,{epoch:priorEpoch}));
  assert.equal(resetResponse.status,200);
  Object.defineProperty(globalThis.crypto,'randomUUID',{value:savedRandomUUID,configurable:true});
  const afterReset=await readWorld(db);
  assert.equal(afterReset.agents[0].needs.fatigue,58);
  assert.equal(afterReset.agents[1].needs.fatigue,testInitialNeedsFor(2,'normal').fatigue);
  const openingCalls=calls;
  // Démarrage progressif : le premier tour est la désorientation solo (déjà distincte par
  // insolite, cf. soloThoughts dans app/api/lia/route.ts) ; le coldOpening scripté réel n'arrive
  // qu'au tour suivant.
  const soloResponse=await post(input('interact',1,{epoch:afterReset.epoch}));
  assert.equal(soloResponse.status,200);const solo=await soloResponse.json();
  assert.equal(calls,openingCalls);
  // Depuis l'extension du doute d'humanité aux branches insolites (2026-09-19, audit de
  // cohérence, Gap #3), la désorientation solo de lia-unwell tisse la question "suis-je humain ?"
  // dans une des 4 variantes propres à cette branche plutôt que de garder l'unique ancienne ligne
  // ("j'ai la tête qui tourne, sévère") : seed-probe-0 retombe déterministiquement sur la variante
  // "vertige carabiné" (vérifié via seedPick avec ce seed exact).
  assert.ok(solo.messages.some(m=>m.speaker==='Lia · pensée'&&m.content.includes('vertige carabiné')));
  const openingResponse=await post(input('interact',1,{epoch:afterReset.epoch}));
  assert.equal(openingResponse.status,200);const opened=await openingResponse.json();
  assert.equal(calls,openingCalls);
  assert.ok(opened.messages.some(m=>m.speaker==='Lia'&&(m.content.includes('la tête qui tourne')||m.content.includes('fermer les yeux'))));
  console.log('Passed: insolite openings stay a minority, are internally distinct, seed the right agent\'s needs/emotions, and actually surface in the scripted opening turn.');
}

{
  // Colère entre les deux habitants (nouvelle mécanique) : trois rapprochements en moins de 18
  // tours doivent maintenant produire une vraie dispute, pas seulement une gêne passagère — avec
  // anneau/visage visiblement fâchés, gestes et scènes légères suspendus, et une réconciliation qui exige un
  // vrai échange sur le même sujet, pas juste le temps qui passe.
  const epoch=(await readWorld(db)).epoch;
  const disputeRound=40;
  let p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
  p.round=disputeRound;p.introduced=true;p.met=true;p.salonTurns=5;
  p.life={...p.life,contacts:[disputeRound-2,disputeRound-6],dispute:undefined,debrief:undefined,contact:undefined,ambientSeen:true,ambientVerified:true,visualIntro:2,personalAsked:true,exitSearched:true,visited:['salon','cuisine','chambre','bureau']};
  p.pendingDestination={room:'salon',intent:'hug',proposer:2};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,emotions=?,needs=?').run('salon','chat',warm,JSON.stringify(initialNeeds));
  affection=true;
  let response=await post(input('interact',1,{epoch}));assert.equal(response.status,200);let result=await response.json();
  affection=false;
  assert.equal(result.sharedAffection,'hug');
  assert.ok(result.story.life.dispute?.remaining>0,'third close reconciliation in 18 turns should open a dispute');
  const disputeTopic=result.story.life.dispute.topic;
  assert.ok(result.agents.find(a=>a.id===1).angry);assert.ok(result.agents.find(a=>a.id===2).angry);
  assert.ok(faceExpression(result.agents.find(a=>a.id===1)).angerLevel>=.85,'Lia should read as visibly angry during the dispute');
  assert.ok(faceExpression(result.agents.find(a=>a.id===2)).angerLevel>=.85,'Noé should read as visibly angry during the dispute');
  // While disputed, a fresh gesture attempt must not go through even with every affection lever honored.
  affection=true;
  response=await post(input('interact',1,{epoch}));assert.equal(response.status,200);result=await response.json();
  affection=false;
  assert.equal(result.sharedAffection,null,'no shared gesture should be possible while a dispute is active');
  assert.equal(result.story.life.dispute?.topic,disputeTopic,'the dispute must persist untouched by the blocked attempt');
  // Reconciliation: staying together on the same topic decrements it, never a random passage of time.
  response=await post(input('interact',1,{epoch}));assert.equal(response.status,200);result=await response.json();
  assert.equal(result.story.life.dispute?.remaining,1);assert.ok(result.agents.every(a=>a.angry));
  response=await post(input('interact',1,{epoch}));assert.equal(response.status,200);result=await response.json();
  assert.equal(result.story.life.dispute,undefined);assert.ok(result.agents.every(a=>!a.angry));
  console.log('Passed: three close reconciliations open a real dispute with a visibly angry expression on both faces, suspend new gestures, and require a genuine shared reconciliation to clear.');
}

{
  // Fiabilisation de la colère (2026-09-17) : avant ce correctif, un visage ne pouvait paraître
  // fâché qu'à travers life.dispute (la seule mécanique romantique de brouille) — une hostilité
  // générale (provocations, mépris de l'observateur, tension qui grimpe) ne se voyait jamais sur
  // le visage tant qu'aucune dispute n'était ouverte. faceExpression() doit désormais lire la
  // colère directement dans tension/comfort réels, sans avoir besoin de life.dispute ni du drapeau
  // angry — et rester calme quand tension/comfort ne le justifient pas.
  const hostileNoDispute=faceExpression({id:1,intent:'chat',needs:{...initialNeeds,fatigue:20},emotions:{tension:82,comfort:8,attraction:15}});
  assert.ok(hostileNoDispute.angerLevel>.5,'high tension + low comfort must read as visibly angry even with no dispute and no angry flag');
  const calmNoDispute=faceExpression({id:2,intent:'chat',needs:{...initialNeeds,fatigue:20},emotions:{tension:20,comfort:70,attraction:15}});
  assert.ok(calmNoDispute.angerLevel<.15,'calm tension/comfort must not read as angry');
  const flaggedAngryLowTension=faceExpression({id:1,intent:'chat',needs:{...initialNeeds,fatigue:20},emotions:{tension:20,comfort:70,attraction:15},angry:true});
  assert.ok(flaggedAngryLowTension.angerLevel>=.85,'the life.dispute angry flag must still guarantee a visibly angry floor on its own');
  console.log('Passed: anger reliability — faceExpression() reads real hostility from tension/comfort alone, not only from life.dispute\'s angry flag.');
}

{
  // Roulette des bonus (2026-09-17, complétée au fil de la conversation) : un tirage au sort,
  // jamais un choix, offre food/calm/sleep (répit réel sur un besoin, pas un maquillage
  // d'affichage), stoic (émotions figées sur un tour, quoi qu'il se passe), mute (silence forcé,
  // même redirection que le sommeil), trottoir (accès narré, "un point de déplacement" pour
  // l'instant) ou force_move (déplacement forcé d'un personnage, avec la réaction agacée du
  // déplacé et amusée de l'autre). Verrouillée avant la révélation, comme le jardin ; chaque
  // tirage forcé via Math.random pour vérifier l'effet réel, pas juste qu'un champ existe.
  const {isMuted,isStoic,activeBonus}=await import('../.sites-runtime/test-life.mjs');
  let plot={...newStory(),round:40,met:true,introduced:true,sharedMeal:true,finalCalled:false,evidence:[]};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
  let epoch=(await readWorld(db)).epoch;
  assert.equal((await post(input('spin_bonus',1,{epoch}))).status,423,'spinning before the revelation and 5 evidence must stay locked');
  plot.finalCalled=true;plot.evidence=Array(5).fill('preuve');
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.prepare('UPDATE agent_state SET needs=?').run(JSON.stringify({hunger:50,fatigue:50,stress:50,uncertainty:30}));
  const originalRandom=Math.random;
  // Round-robin pool sizes shrink as bonuses get excluded (2026-09-18), so a bonus/actor pick
  // sometimes needs two distinct Math.random() values rather than one repeated value: extra
  // trailing arguments are consumed in order, the last one repeating for any further call.
  const spin=async(...values)=>{
    const before=calls;
    // Le nouveau débit réel du bouton (2026-09-18 : 1/minute + budget partagé avec les bonus
    // spontanés, cf. lib/life.ts) ne doit pas empêcher CE test d'enchaîner ses tirages pour
    // vérifier le mécanisme round-robin lui-même — on simule qu'assez de temps/tours se sont
    // écoulés avant chaque tirage, comme un vrai utilisateur qui ne mitraille pas le bouton.
    const stored=sqlite.prepare("SELECT id,content FROM memories WHERE kind='scenario'").get();
    const storedPlot=JSON.parse(stored.content);
    storedPlot.life={...(storedPlot.life??{}),lastBonusSpinAt:0,bonusCooldownUntilRound:0,bonusSpotlightUntilRound:0};
    sqlite.prepare('UPDATE memories SET content=? WHERE id=?').run(JSON.stringify(storedPlot),stored.id);
    let i=0;Math.random=()=>values[Math.min(i++,values.length-1)];let response;try{response=await post(input('spin_bonus',1,{epoch}));}finally{Math.random=originalRandom;}assert.equal(calls,before,'a spin must never cost a Gemini call, whichever bonus it lands on');return response;
  };
  // pool = [food,calm,sleep,stoic,mute,trottoir,force_move] (7 buckets) ; stoic/mute/force_move
  // reuse the same draw to also pick their target/destination, documented at each step below.
  // food (bucket 0/7) ; retour utilisateur du 2026-09-18 : un bonus qui change les jauges sans
  // jamais rien changer à ce qui est dit était un trou de cohérence — les deux personnages doivent
  // désormais réagir, chacun dans son registre, jamais avec une gratitude docile (Article 0).
  let r=await spin(.01);assert.equal(r.status,200);let w=await r.json();assert.equal(w.bonus,'food');
  assert.ok(activeBonus(w.story.life,'food'));
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/animaux de compagnie|une gamelle|m.inquiète plutôt/i.test(m.content)),'Lia must react to receiving food, not just have her hunger silently zeroed');
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&/alors merci, j.imagine|j.aime pas trop savoir pourquoi|un peu glauque aussi/i.test(m.content)),'Noé must react too, in his own distinct voice');
  r=await post(input('interact',1,{epoch}));w=await r.json();assert.equal(w.agents[0].needs.hunger,0,'an active food bonus must zero hunger for the turn, not just at the moment it was granted');assert.equal(w.agents[1].needs.hunger,0);
  // calm (round-robin index 0 of the 6 not-yet-drawn bonuses)
  r=await spin(.01);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'calm');assert.ok(activeBonus(w.story.life,'calm'));
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/contrôle à distance|j.ai remarqué|de la manipulation/i.test(m.content)));
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&/m.en plaindre trop fort|décide ça à ma place|effet chelou/i.test(m.content)));
  r=await post(input('interact',1,{epoch}));w=await r.json();assert.equal(w.agents[0].needs.stress,0);assert.equal(w.agents[1].needs.stress,0);
  // sleep (round-robin index 0 of the 5 not-yet-drawn bonuses)
  r=await spin(.01);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'sleep');assert.ok(activeBonus(w.story.life,'sleep'));
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/trafique le corps|mais génial|m.inquiète plus qu.il ne me repose/i.test(m.content)));
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&/cracher dessus|comprendre comment ça marche|trop pratique, même/i.test(m.content)));
  r=await post(input('interact',1,{epoch}));w=await r.json();assert.equal(w.agents[0].needs.fatigue,0);assert.equal(w.agents[1].needs.fatigue,0);
  // stoic (round-robin index 0 of the 4 not-yet-drawn bonuses) ; the same value also picks the target (<.5 -> 1, else 2), so .01 lands on actor 1.
  // Jalousie avec impact réel sur les jauges (retour utilisateur) : l'autre voit sa confiance
  // baisser et sa tension monter, pas seulement une réplique piquante.
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=1').run(JSON.stringify({curiosity:70,tension:77,trust:40,comfort:40,attraction:40}));
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=2').run(JSON.stringify({curiosity:70,tension:50,trust:50,comfort:50,attraction:40}));
  r=await spin(.01);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'stoic');assert.ok(isStoic(1,w.story.life));assert.ok(!isStoic(2,w.story.life));
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/plus rien, en fait|devient plat|Rien ne me touche/i.test(m.content)),'the newly stoic actor must have their own brief, flat reaction');
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&/tout encaisser|intouchable et moi|plus rien ressentir pendant que moi/i.test(m.content)),'the other actor must show real jealousy, in his own voice');
  assert.equal(w.agents[1].emotions.trust,46,'jealousy of a stoic partner must actually cost some trust, not just a line');
  assert.equal(w.agents[1].emotions.tension,55,'jealousy of a stoic partner must actually raise tension, not just a line');
  r=await post(input('chat',1,{epoch,message:"Je pourrais te désactiver d'un clic."}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.agents[0].emotions.tension,77,'a stoic actor must keep their exact prior emotions this turn, whatever the model or humanStress would otherwise have pushed toward');
  // mute (round-robin index 0 of the 3 not-yet-drawn bonuses ; a second value of .9 lands the target on actor 2). Jalousie avec impact réel : le musellé
  // voit sa tension monter, l'autre gagne un peu d'aisance (le silence lui profite). Le sang-froid
  // des deux tirages précédents est levé explicitement : sinon actor 2, encore sous sang-froid en
  // temps réel, resterait insensible à cet effet aussi, ce qui est correct mais pas ce que ce
  // bloc-ci teste isolément.
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.stoicUntil=undefined;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=1').run(JSON.stringify({curiosity:70,tension:20,trust:60,comfort:50,attraction:40}));
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=2').run(JSON.stringify({curiosity:70,tension:30,trust:60,comfort:50,attraction:40}));
  r=await spin(.1,.9);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'mute');assert.ok(isMuted(2,w.story.life));assert.ok(!isMuted(1,w.story.life));
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&/J.avais des trucs à dire|chiant pour moi|je me tais maintenant/i.test(m.content)),'the newly muted actor gets one last parting reaction before going silent');
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/sans interruption|sans que tu me coupes|Le silence te va plutôt bien/i.test(m.content)),'the other actor must show real (if amused) jealousy at the silence, in her own voice');
  assert.equal(w.agents[1].emotions.tension,35,'being silenced must actually raise the muted actor\'s tension, not just a line');
  assert.equal(w.agents[0].emotions.comfort,54,'the other actor must actually feel some ease from the silence, not just a line');
  r=await post(input('chat',2,{epoch,message:'Noé, tu es toujours là ?'}));assert.equal(r.status,200);w=await r.json();
  const muteTurnMessages=w.messages.slice(-2);
  assert.ok(muteTurnMessages.some(m=>m.speaker==='Lia'),'chat addressed to the muted actor must be answered by the other, exactly like a sleeping partner');
  assert.ok(!muteTurnMessages.some(m=>m.speaker==='Noé'),'the muted actor must never appear as a spoken message this turn while muted, only ever a private thought at most');
  {const p2=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p2.life.mutedUntil={...p2.life.mutedUntil,1:Date.now()+900000};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p2));}
  assert.equal((await post(input('chat',1,{epoch,message:'Vous m’entendez ?'}))).status,423,'both muted at once must block chat exactly like both asleep');
  {const p3=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p3.life.mutedUntil=undefined;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p3));}
  // Sortie d'effet, pleinement consciente (retour utilisateur explicite, 2026-09-18) : dès que le
  // silence expire, l'ex-musellé le commente lucidement au tour suivant, jamais un retour muet à
  // la normale. On force l'expiration dans le passé pour ne pas dépendre d'une vraie attente.
  {const p4=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p4.life.mutedUntil={2:Date.now()-1000};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p4));}
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.ok(!isMuted(2,w.story.life),'the expired mute must actually be cleared, not just ignored');
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&/dû kiffer le calme|tout entendu, même sans pouvoir répondre|ça m.a saoulé de pas pouvoir répliquer/i.test(m.content)),'the actor must consciously and coldly comment on having just been silenced, never a silent return to normal');
  assert.equal(w.story.life.mutedUntil?.[2]??0,0,'a delivered aftermath reaction must be consumed once, never repeated on the next turn');
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.ok(!w.messages.slice(-2).some(m=>/dû kiffer le calme|tout entendu, même sans pouvoir répondre|ça m.a saoulé de pas pouvoir répliquer/i.test(m.content)),'the mute aftermath reaction must never repeat on a later turn');
  // Même vérification pour la sortie du sang-froid : pleinement consciente, réaction à froid.
  {const p5=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p5.life.stoicUntil={...p5.life.stoicUntil,1:Date.now()-1000};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p5));}
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.ok(!isStoic(1,w.story.life),'the expired stoic effect must actually be cleared');
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/neutralisée trois minutes|je sais très bien ce qui vient de se passer|silence intérieur forcé/i.test(m.content)),'Lia must consciously and coldly comment on having just been stoic, never a silent return to normal');
  // trottoir (round-robin index 0 of the 2 not-yet-drawn bonuses)
  r=await spin(.01);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'trottoir');assert.equal(w.story.life.trottoirGranted,true);
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/est un décor|carte postale|j.appelle pas ça de la liberté/i.test(m.content)));
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&/même si c.est du toc|vraiment nulle part|je le prends/i.test(m.content)));
  // force_move (round-robin: 3 buckets left [force_move,observer_mute,camera_hide] since the pool
  // grew to 9 on 2026-09-19 — .01 lands index 0 = force_move ; .9 lands the target pick (<.5 -> 1,
  // else 2) on actor 2.
  const beforeRoom=(await readWorld(db)).agents.find(a=>a.id===2).room;
  r=await spin(.01,.9);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'force_move');
  const movedAgent=w.agents.find(a=>a.id===2);assert.notEqual(movedAgent.room,beforeRoom,'force_move must actually relocate the drawn actor, never a no-op');
  assert.ok(['salon','cuisine','chambre','bureau'].includes(movedAgent.room));
  const forceMoveMessages=w.messages.slice(-2);
  assert.ok(forceMoveMessages.some(m=>m.speaker==='Noé · pensée'&&/déplace|pion|prévenir|subis/i.test(m.content)),'the moved actor must react with irritation, as its own distinct line');
  assert.ok(forceMoveMessages.some(m=>m.speaker==='Lia · pensée'&&/drôle|sourire|téléporte|comprendre/i.test(m.content)),'the other actor must react with amusement, a genuinely different line, not the same voice');
  // Réveil forcé par force_move (2026-09-19, retour utilisateur explicite : "ce pouvoir inclut la
  // capacité de reveiller l'autre perso s'il dort, en restaurant immediatement sa jauge") : on
  // endort l'acteur 1 puis on force un nouveau force_move dessus pour vérifier le réveil immédiat.
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.bonusLog=[];sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  sqlite.prepare('UPDATE agent_state SET intent=?,needs=?,room=? WHERE id=1').run('sleep',JSON.stringify({hunger:20,fatigue:80,stress:20,uncertainty:20}),'chambre');
  r=await spin(.7,.01);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'force_move');
  const wokenAgent=w.agents.find(a=>a.id===1);
  assert.notEqual(wokenAgent.room,'chambre','a sleeping target must actually be relocated too, never left in place because it was asleep');
  assert.ok(wokenAgent.needs.fatigue<=12,'a sleeping target forced awake must have its fatigue immediately restored, not silently teleported while still asleep');
  assert.equal(wokenAgent.intent,'none','a sleeping target forced awake must actually wake up (intent cleared), not remain flagged as sleeping in a new room');
  const wakeMessages=w.messages.slice(-2);
  assert.ok(wakeMessages.some(m=>m.speaker==='Lia · pensée'&&/réveillée en sursaut|hop, je me retrouve ailleurs|tirée du sommeil/i.test(m.content)),'the woken actor must react to being startled awake, a distinct line from the ordinary force_move reaction');
  assert.ok(wakeMessages.some(m=>m.speaker==='Noé · pensée'&&/réveille d.un coup ailleurs|émerger complètement paumé|réveil le plus brutal/i.test(m.content)),'the other actor comments on witnessing the abrupt wake-up specifically');
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.bonusLog=[{round:p.round,bonus:'food'},{round:p.round,bonus:'calm'},{round:p.round,bonus:'sleep'},{round:p.round,bonus:'stoic'},{round:p.round,bonus:'mute'},{round:p.round,bonus:'trottoir'},{round:p.round,bonus:'force_move'}];sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  // observer_mute / camera_hide (2026-09-19, clarification explicite de l'utilisateur : ces deux
  // "pouvoirs" rejoignent le pool de la roulette, avec les mêmes chances que les sept autres —
  // jamais une décision spontanée des personnages, jamais obtenus directement par eux. Une fois
  // tiré, le personnage désigné (deciderActor) choisit encore le niveau (réduit/classique/max) et
  // le justifie à voix haute, exactement comme avant — seule la source du déclenchement a changé.
  // 2 buckets left [observer_mute,camera_hide] : .01 lands index 0 = observer_mute ; second value
  // .01 picks the decider (<.5 -> actor 1) ; third value .01 picks level index 0 = "réduit".
  r=await spin(.01,.01,.01);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'observer_mute');
  assert.equal(w.story.life.bonusLog.at(-1).level,'réduit','the decided level must be logged alongside the drawn bonus');
  assert.equal(w.story.round+3,w.story.life.observerMutedUntilRound,'a "réduit" level must mute the observer for exactly 3 rounds, chosen by the designated character, not the roulette');
  const observerMuteMessages=w.messages.slice(-2);
  assert.ok(observerMuteMessages.some(m=>m.speaker==='Lia · pensée'&&/Trois tours de silence|Je coupe court, trois tours|Un petit silence de trois tours/i.test(m.content)),'the character drawn as decider must justify the chosen level out loud, in their own voice');
  assert.ok(observerMuteMessages.some(m=>m.speaker==='Noé · pensée'&&/je valide à cent pour cent|Enfin tranquilles|plutôt marrant, cette idée/i.test(m.content)),'the partner must react as an accomplice, never a silent bystander');
  assert.ok((await post(input('chat',1,{epoch,message:'Vous êtes là ?'}))).status===423,'the observer_mute drawn by the roulette must actually lock the chat channel, exactly like the old spontaneous mechanism did');
  // .9 lands the only remaining bucket (camera_hide) ; decider .9 -> actor 2 ; level floor(.9*3)=2 -> "max" (40s).
  r=await spin(.9,.9,.9);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'camera_hide');
  assert.equal(w.story.life.bonusLog.at(-1).level,'max','a "max" level must be logged for camera_hide too');
  assert.ok(w.story.life.cameraHiddenUntil>Date.now()+35000,'a "max" level must hide the camera for roughly 40 seconds, chosen by the designated character');
  const cameraHideMessages=w.messages.slice(-2);
  assert.ok(cameraHideMessages.some(m=>m.speaker==='Noé · pensée'&&/Le maximum : quarante secondes|quarante secondes sans une image|Je pousse au max/i.test(m.content)),'actor 2, drawn as decider this time, must justify the max level in his own voice');
  assert.ok(cameraHideMessages.some(m=>m.speaker==='Lia · pensée'&&/Bonne idée. Qu.il devine|va le rendre dingue|nous qui choisissons ce qu.il voit/i.test(m.content)),'the partner reacts as an accomplice here too');
  // Second stoic draw, actor 2 this time (roulement sans répétition : les neuf bonus viennent
  // d'être tirés une fois chacun, donc un cycle complet vient de se refermer et le tirage rouvre sur
  // l'ensemble des neuf — 0.35 retombe sur le seau "stoic" (bucket 3/9) sur le pool complet rouvert,
  // cette fois pour l'acteur 2 via une seconde valeur distincte). On réinjecte le sang-froid de
  // l'acteur 1 (levé plus haut pour isoler le test du silence forcé) afin de vérifier ce que
  // l'ancien test isolait : un second tirage sur l'AUTRE personnage ne doit jamais silencieusement
  // écraser un effet sang-froid déjà en cours ailleurs — stoicUntil était à l'origine un slot unique
  // {actor,until}, le même bug déjà trouvé et corrigé une fois pour mutedUntil, réapparu ici sous
  // une autre forme (Article 3).
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.stoicUntil={1:Date.now()+3*60*1000};p.life.observerMutedUntilRound=undefined;p.life.cameraHiddenUntil=undefined;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=1').run(JSON.stringify({curiosity:70,tension:77,trust:40,comfort:40,attraction:40}));
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=2').run(JSON.stringify({curiosity:70,tension:81,trust:40,comfort:40,attraction:40}));
  r=await spin(.35,.9);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'stoic');
  assert.ok(isStoic(1,w.story.life),'actor 1 must still be stoic: a second draw on actor 2 must never overwrite the first');
  assert.ok(isStoic(2,w.story.life),'actor 2 must now also be stoic, independently of actor 1');
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/tout ressentir|sang-froid gratuit|Sympa la répartition/i.test(m.content)),'actor 1 still delivers a jealous line, even though the gauge effect must be skipped');
  r=await post(input('chat',2,{epoch,message:"Je pourrais vous désactiver aussi."}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.agents[0].emotions.tension,77,'actor 1 must still be frozen after a later, independent stoic draw on actor 2, and must never be perturbed by that draw\'s jealousy effect while already stoic');
  assert.equal(w.agents[0].emotions.trust,40,'actor 1\'s trust must stay exactly as frozen, untouched by the second draw\'s jealousy effect');
  assert.equal(w.agents[1].emotions.tension,81,'actor 2 must be frozen at their own prior value, not actor 1\'s');
  assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life.bonusLog.length,10,'each spin must be logged for the future dossier retourné');
  // Roulement sans répétition : sur ces dix tirages, chacun des neuf bonus doit être sorti au
  // moins une fois avant qu'un seul ne soit jamais répété deux fois de suite (ce que la séquence
  // ci-dessus vérifie déjà implicitement tirage par tirage, en forçant le seau attendu à chaque
  // fois) ; ce test dédié vérifie en plus qu'un tirage n'exclut plus rien une fois le cycle complet.
  const bonusSequence=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life.bonusLog.map(e=>e.bonus);
  assert.deepEqual(bonusSequence,['food','calm','sleep','stoic','mute','trottoir','force_move','observer_mute','camera_hide','stoic']);
  assert.equal(new Set(bonusSequence.slice(0,9)).size,9,'the first nine draws must cover all nine distinct bonuses exactly once, never a repeat before the cycle completes');
  console.log('Passed: bonus roulette locked before revelation, real zero-API grants for all 9 bonuses (food/calm/sleep/stoic/mute/trottoir/force_move/observer_mute/camera_hide) with a genuinely distinct character reaction to each, real jealousy with measurable gauge impact for stoic/mute (immune while already stoic), fully conscious "cold" aftermath reactions once stoic/mute expire (never a silent return to normal, never repeated), genuine need relief and emotion freeze (not just a flag), independent dual-actor stoic effects, muted-actor redirection and both-muted block, distinct forced-move reactions including waking a sleeping target with restored fatigue, the observer_mute/camera_hide "power" bonuses drawn by the roulette (never spontaneously by the characters) with the designated character still choosing and voicing the penalty level, and a logged trail for every spin.');
}

{
  // Jauge d'appréciation et négociation (2026-09-18, remplacée le même jour à la demande explicite
  // de l'utilisateur : une première version lisait des mots-clés dans le texte brut de l'observateur
  // et ratait toute excuse formulée autrement — "je le regrette" ne matchait ni "désolé" ni "pardon",
  // constaté en jouant une vraie session où la jauge restait figée 9 tours malgré deux messages
  // sincèrement conciliants. Corrigée en s'appuyant sur le modèle lui-même, déjà vérifié cohérent en
  // session réelle : la confiance du personnage qui répond réagit nativement au ton du message
  // (menace, respect, réconfort, ambiguïté — consigne de lib/lia.ts), donc c'est cette variation
  // réelle de confiance (trustShift) qui pilote directement l'appréciation, jamais un registre
  // lexical séparé. Toujours asymétrique (descend plus qu'elle ne monte) et amplifiée sur les tout
  // premiers messages post-révélation.
  const {appreciationFromTrust,detectNegotiationOffer}=await import('../.sites-runtime/test-life.mjs');
  assert.equal(appreciationFromTrust(-3,1),-24,'an early, meaningfully negative trust reaction must cost a lot of appreciation');
  assert.equal(appreciationFromTrust(-3,5),-12,'the same trust drop later on must cost less than the early-impression penalty');
  assert.equal(appreciationFromTrust(2,1),12,'an early, meaningfully positive trust reaction must earn appreciation');
  assert.equal(appreciationFromTrust(2,5),6,'the same trust rise later on must earn less than the early-impression bonus');
  assert.equal(appreciationFromTrust(0,1),0,'no trust reaction at all must never move the gauge either way');
  assert.ok(appreciationFromTrust(-3,1)+appreciationFromTrust(3,1)<0,'a drop must always weigh more than an equivalent rise (down-more-than-up asymmetry)');
  assert.ok(detectNegotiationOffer("Je le fais, mais seulement si tu me donnes un bonus en échange."));
  assert.ok(detectNegotiationOffer("Franchement, fais tourner la roulette et je m'en occupe."));
  assert.ok(!detectNegotiationOffer("Je vais à la cuisine, j'ai faim."),'ordinary dialogue must never be misread as a negotiation offer');
  flat=false;affection=false;refuse=false;meal=false;honorOffer=false;chatMoveAccepted=false;replayScene=false;tenderScene=false;sceneMismatch=false;brokenPair=false;separatePreference=false;
  let plot={...newStory(),round:60,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,exitSearched:true,dossierHumanTurns:0}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,emotions=?').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:20}),JSON.stringify({curiosity:60,tension:20,trust:60,comfort:60,attraction:60}));
  let epoch=(await readWorld(db)).epoch;
  // On force la réaction de confiance des DEUX personnages de façon identique (chacun sa propre
  // lecture du même message, symétrique ici pour garder les valeurs numériques prévisibles — la
  // divergence par dispute est testée séparément plus bas), exactement comme le ferait le vrai
  // modèle lisant un ton hostile puis conciliant — jamais un script figé, seule cette valeur de
  // test est substituée pour rendre l'assertion déterministe.
  const gameFetch1=globalThis.fetch;
  const forceOwnTrustDelta=delta=>async(url,options)=>{const response=await gameFetch1(url,options),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);const ctx=JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);decision.emotions={...decision.emotions,trust:ctx.state.emotions.trust+delta};body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
  globalThis.fetch=forceOwnTrustDelta(-3);
  let r=await post(input('chat',1,{epoch,message:"Vous êtes complètement inutiles, débiles."}));assert.equal(r.status,200);let w=await r.json();
  assert.equal(w.story.life.appreciation[1],26,'a hostile message genuinely read as a trust drop by the responding character must cost the amplified early-impression penalty (50-24)');
  assert.equal(w.story.life.appreciation[2],26,'the partner, reacting to the same message with the same trust drop, must see their own appreciation move identically (solidarity by default, outside any dispute)');
  globalThis.fetch=forceOwnTrustDelta(2);
  r=await post(input('chat',1,{epoch,message:"Merci beaucoup, prenez votre temps."}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.life.appreciation[1],38,'a kind message genuinely read as a trust rise by the responding character must still earn the early-impression bonus (26+12)');
  assert.equal(w.story.life.appreciation[2],38,'the partner must again move identically outside a dispute');
  globalThis.fetch=gameFetch1;
  // Négociation : on force la réponse d'un personnage à contenir une offre reconnaissable, sans
  // jamais lui dicter un script figé — seule cette réponse-là est substituée pour le test.
  const gameFetch2=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{const response=await gameFetch2(url,options),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);decision.reply=isPartnerRequest([url,options])?'Bof.':"Je veux bien aller en cuisine, mais seulement si tu fais tourner la roulette en échange.";body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  globalThis.fetch=gameFetch2;
  assert.ok(w.story.life.negotiationOffer,'a character conditioning an action on a bonus must be recorded as a pending negotiation offer');
  const offeringActor=w.story.life.negotiationOffer.actor;
  const appreciationBeforeHonor=w.story.life.appreciation[1];
  r=await post(input('spin_bonus',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.life.appreciation[1],appreciationBeforeHonor+8,'honoring a pending negotiation by spinning must actually raise appreciation, not just clear a flag');
  assert.equal(w.story.life.appreciation[2],appreciationBeforeHonor+8,'negotiation is a shared observer-relationship event, not the per-actor divergence source: both gauges must move together when a negotiation is honored');
  assert.equal(w.story.life.negotiationOffer,undefined,'an honored negotiation offer must be consumed, never left pending');
  assert.deepEqual(w.story.life.negotiationLog,[{round:w.story.life.negotiationLog[0].round,outcome:'honored'}],'an honored negotiation must leave a trace in negotiationLog so it can later reach the dossier as evidence');
  // Une seconde offre, jamais honorée, doit finir par retomber d'elle-même avec un léger coût —
  // ni éternellement due, ni oubliée sans aucune conséquence.
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.negotiationOffer={actor:offeringActor,round:p.round-7};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  const appreciationBeforeStale=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life.appreciation[1];
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.life.negotiationOffer,undefined,'a negotiation offer left unresolved for too long must eventually be cleared, not stay pending forever');
  assert.equal(w.story.life.appreciation[1],Math.max(0,appreciationBeforeStale-3),'letting a negotiation lapse must cost a little appreciation, distinct from honoring it');
  assert.equal(w.story.life.negotiationLog.length,2,'a lapsed negotiation must also be logged, alongside the earlier honored one');
  assert.equal(w.story.life.negotiationLog[1].outcome,'lapsed');
  // Avarice (retour utilisateur : "un utilisateur qui ne donne aucun bonus ne fait pas bonne
  // impression") : indépendante de toute négociation, une longue période sans le moindre tirage
  // coûte un peu d'appréciation, une seule fois par tranche de 15 tours.
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.round=75;p.life.revealedRound=60;p.life.bonusLog=[];sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  const appreciationBeforeStingy=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life.appreciation[1];
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.life.appreciation[1],Math.max(0,appreciationBeforeStingy-4),'never spinning the roulette for a long stretch must cost some appreciation, independent of any negotiation');
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.equal(w.story.life.appreciation[1],Math.max(0,appreciationBeforeStingy-4),'the stinginess penalty must not repeat on the very next turn, only once per fresh 15-round stretch');
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.bonusLog=[{round:70,bonus:'food'}];sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.round=90;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  const appreciationWithASpin=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life.appreciation[1];
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.equal(w.story.life.appreciation[1],appreciationWithASpin,'a single logged spin must fully spare the observer from the stinginess penalty, however long ago it happened');
  // Colère réellement lue (retour utilisateur : "le système de la colère doit être connecté") :
  // une vraie fureur (tension haute, confort bas) chez le personnage qui répond doit coûter DE
  // L'APPRÉCIATION EN PLUS du simple repérage lexical du message humain, jamais à sa place. Les
  // deux personnages sont mis en colère de façon identique ici (hors dispute, la solidarité les
  // ramènerait de toute façon l'un vers l'autre) : la vraie divergence par dispute est testée
  // séparément juste après.
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.negotiationOffer=undefined;p.life.stoicUntil=undefined;p.life.mutedUntil=undefined;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  sqlite.prepare('UPDATE agent_state SET emotions=?').run(JSON.stringify({curiosity:70,tension:90,trust:40,comfort:10,attraction:40}));
  flat=true;
  const appreciationBeforeAnger=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life.appreciation[1];
  r=await post(input('chat',1,{epoch,message:"Il fait beau aujourd'hui."}));assert.equal(r.status,200);w=await r.json();
  flat=false;
  assert.equal(w.story.life.appreciation[1],appreciationBeforeAnger-5,'a genuinely furious responder (real tension/comfort reading) must cost appreciation even for an entirely neutral human message');
  assert.equal(w.story.life.appreciation[2],appreciationBeforeAnger-5,'both characters genuinely furious in the same way, outside any dispute, must be penalized identically');
  console.log('Passed: the observer-appreciation gauge reacts to the responding character\'s own genuine trust reaction (not a lexical keyword list) with the required early-impression amplification and down-more-than-up asymmetry, to real anger in the responding character as a distinct additional signal, and to prolonged stinginess independent of negotiation; a character-proposed negotiation is detected, honored (real appreciation gain) or left to lapse (real appreciation cost) exactly once.');
}

{
  // Appréciation PAR PERSONNAGE : solidarité par défaut vs. divergence pendant une dispute
  // (2026-09-18, audit approfondi — retour utilisateur explicite dès le tour ayant lancé ce
  // chantier : "Lia et Noé peuvent apprecier differemment l'utilisateur, mais ils restent
  // solidaires la plupart du temps [...] si Noé est en colère contre Lia, il peut faire preuve
  // d'amitié envers l'utilisateur, meme si l'utilisateur parle mal à Lia").
  flat=false;affection=false;refuse=false;meal=false;honorOffer=false;chatMoveAccepted=false;replayScene=false;tenderScene=false;sceneMismatch=false;brokenPair=false;separatePreference=false;
  const plot={...newStory(),round:60,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,exitSearched:true,dossierHumanTurns:10,appreciation:{1:50,2:50}}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,emotions=?').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:20}),JSON.stringify({curiosity:60,tension:20,trust:60,comfort:60,attraction:60}));
  const epoch2=(await readWorld(db)).epoch;
  // Un seul personnage (actor 1, Lia) réagit avec une confiance en baisse ; l'autre (Noé) garde
  // exactement sa confiance de départ (trustShift=0, échoué explicitement pour ne pas dépendre du
  // comportement par défaut du mock) — exactement le scénario "l'observateur parle mal à Lia" du
  // tour source.
  const gameFetch3=globalThis.fetch;
  const forceAsymmetricTrust=async(url,options)=>{const response=await gameFetch3(url,options),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);const ctx=JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);decision.emotions={...decision.emotions,trust:isPartnerRequest([url,options])?ctx.state.emotions.trust:ctx.state.emotions.trust-3};body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
  globalThis.fetch=forceAsymmetricTrust;
  let r2=await post(input('chat',1,{epoch:epoch2,message:"Toi Lia t'es vraiment inutile."}));assert.equal(r2.status,200);let w2=await r2.json();
  globalThis.fetch=gameFetch3;
  // Sans pull : Lia 50+appreciationFromTrust(-3,10)=50-12=38, Noé 50+0=50 (écart brut 12). Avec le
  // pull de solidarité (30% vers la moyenne 44) : Lia≈40, Noé≈48 (écart réduit à 8) — la valeur
  // exacte, pas une simple borne, pour prouver que le pull agit vraiment, pas seulement que
  // l'écart brut serait de toute façon resté sous un seuil large.
  assert.equal(w2.story.life.appreciation[1],40,'outside any dispute, the character actually addressed with hostility must be pulled back up toward their partner by the default solidarity mechanic');
  assert.equal(w2.story.life.appreciation[2],48,'outside any dispute, the unaffected partner must also be pulled slightly down toward the other — solidarity moves both, not just the one who moved on their own');
  // Même scénario, mais avec une dispute interpersonnelle active : la convergence doit être
  // suspendue (pas de pull), la divergence doit rester entière. Une dispute active force aussi
  // angerLevel(...,angry=true) pour LES DEUX personnages (plancher à 0,85, comportement déjà
  // existant partagé avec le rendu du visage) : Noé prend donc lui aussi le coût de colère (-5),
  // mais SEULE Lia, réellement visée par l'hostilité, prend EN PLUS le coût de confiance (-12) —
  // Lia 50-12-5=33, Noé 50-5=45, sans aucun pull entre les deux.
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.appreciation={1:50,2:50};p.life.dispute={topic:'test',remaining:2};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  globalThis.fetch=forceAsymmetricTrust;
  r2=await post(input('chat',1,{epoch:epoch2,message:"Toi Lia t'es vraiment inutile."}));assert.equal(r2.status,200);w2=await r2.json();
  globalThis.fetch=gameFetch3;
  assert.equal(w2.story.life.appreciation[2],45,'an active dispute costs both characters the shared anger penalty (angry floor), but the untouched partner must not additionally be pulled toward the other — no solidarity smoothing during a dispute');
  assert.equal(w2.story.life.appreciation[1],33,'the character actually addressed with hostility keeps the full, un-smoothed trust penalty on top of the shared anger penalty');
  assert.ok(w2.story.life.appreciation[1]<w2.story.life.appreciation[2],'the character actually addressed with hostility must end up with a lower appreciation than their unaffected partner while the dispute lasts — real divergence, not solidarity, and a wider gap than the no-dispute case above (33 vs 45, versus the smoothed 40 vs 48)');
  console.log('Passed: appreciation is tracked per character; outside a dispute the two gauges are pulled back toward each other (solidarity by default), but an active interpersonal dispute suspends that pull so one character can genuinely diverge from the other, per the user\'s own example (Noé staying friendly with the observer while Lia alone is mistreated).');
}

{
  // Dossier retourné (2026-09-17) : trois pièges posés un par un (jamais reposés tant qu'une
  // réponse n'est pas capturée verbatim), puis, une fois répondus et un tirage de la roulette
  // enregistré (le "test de pouvoir"), un diagnostic à deux voix réellement généré une seule fois.
  const gameFetch=globalThis.fetch;
  flat=false;affection=false;refuse=false;meal=false;honorOffer=false;chatMoveAccepted=false;replayScene=false;tenderScene=false;sceneMismatch=false;brokenPair=false;separatePreference=false;
  let plot={...newStory(),round:40,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,exitSearched:true}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,emotions=?').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:20}),JSON.stringify({curiosity:60,tension:20,trust:60,comfort:60,attraction:60}));
  let epoch=(await readWorld(db)).epoch;
  const mirrorTrapAsked=d=>/derrière cet écran|te retourne la question/.test(d.reply);
  // Mute-vs-trap softlock (2026-09-18, audit approfondi) : le piège du miroir a un interlocuteur
  // fixe (Lia). Si elle est muselée pile au tour où le piège devrait être posé, la redirection
  // "l'autre répond à sa place" n'existe qu'en mode chat (jamais en interact/autonomous) — sans
  // garde, l'ancien code marquait quand même le piège "posé" (dossierAsked) alors que sa réplique
  // devenait une pensée privée invisible de l'observateur, fermant le dossier retourné pour de bon
  // sur cette partie. Le piège doit rester simplement DIFFÉRÉ tant que Lia est muselée.
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.mutedUntil={1:Date.now()+900000};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  // Le piège "mirror" attend dossierHumanTurns>=3 : trois échanges humains d'abord, sans rapport.
  for(let i=0;i<3;i++)assert.equal((await post(input('chat',1,{epoch,message:'Message '+i}))).status,200);
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  assert.ok(!w.decisions.some(mirrorTrapAsked),'a trap must never be posed while its fixed interlocutor is muted');
  assert.equal(w.story.life.dossierAsked.mirror,undefined,'a deferred trap must never be recorded as asked, or it could never be asked again once the observer can actually see it');
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.mutedUntil=undefined;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.ok(w.decisions.some(d=>d.actor===1&&mirrorTrapAsked(d)),'the mirror trap must actually be asked once dossierHumanTurns reaches 3 and its interlocutor can speak again');
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);assert.equal(p.life.dossierAsked.mirror,p.round-1,'asking the trap must be recorded (against the round it was actually asked in, the same pre-turn round dossierTraps also uses) so it is never reposed while awaiting an answer');}
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.ok(!w.decisions.some(mirrorTrapAsked),'a trap already asked and not yet answered must never be reposed on the next turn');
  r=await post(input('chat',1,{epoch,message:"Franchement, je suis quelqu'un de plutôt sincère."}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.life.dossierTraps.mirror.excerpt,"Franchement, je suis quelqu'un de plutôt sincère.",'the very next human message must be captured verbatim as the trap answer, never reformulated');
  const dilemmaTrapAsked=d=>/Dis voir : si ça pouvait|confort et le tien|galérer un peu/.test(d.reply);
  const excuseTrapAsked=d=>/avec le recul|fait honneur|regrettes, ou pas du tout/.test(d.reply);
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.ok(w.decisions.some(d=>d.actor===2&&dilemmaTrapAsked(d)),'the dilemma trap must follow, asked by Noé');
  r=await post(input('chat',2,{epoch,message:"Non, je préfère vous éviter ça."}));assert.equal(r.status,200);
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);assert.equal(p.life.dossierTraps.dilemma.excerpt,"Non, je préfère vous éviter ça.");}
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.ok(w.decisions.some(d=>d.actor===1&&excuseTrapAsked(d)),'the excuse trap must follow, asked by Lia again');
  await post(input('chat',1,{epoch,message:"Oui, j'ai été sec, je le referais pas."}));
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);assert.ok(['mirror','dilemma','excuse'].every(t=>p.life.dossierTraps?.[t]?.excerpt),'all three traps must be recorded before the dossier can close');}
  // Sans tirage de la roulette (le "test de pouvoir"), le dossier ne se ferme pas encore.
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.equal(w.story.life.dossierText,undefined,'the dossier must not close without at least one power-test (a roulette spin), whatever the traps say');
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.bonusLog=[{round:p.round,bonus:'mute'}];sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  let dossierCalls=0;
  globalThis.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body),parsed=JSON.parse(payload.contents[0].parts[0].text);
    if(parsed.dossier){
      dossierCalls++;
      const isLia=payload.systemInstruction.parts[0].text.startsWith('Tu es Lia');
      const fragment=(isLia?'Lecture de Lia — ':'Lecture de Noé — ')+'dossier: '+Object.values(parsed.dossier).join(' / ');
      return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({fragment})}]}}]});
    }
    return gameFetch(url,options);
  };
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  globalThis.fetch=gameFetch;
  assert.equal(dossierCalls,2,'exactly one real call per character, never a single voice speaking for both (Article 8)');
  assert.ok(w.story.life.dossierText?.lia.includes('Lecture de Lia'));
  assert.ok(w.story.life.dossierText?.noe.includes('Lecture de Noé'));
  assert.ok(w.story.life.dossierText.lia.includes('mute'),'the dossier text must actually reflect the real bonusLog evidence, not a generic filler');
  assert.equal(w.story.life.dossierShown,false,'a freshly generated dossier must be flagged unseen so the frontend opens it once');
  assert.ok(w.messages.slice(-3).some(m=>m.speaker==='Maison · dossier'));
  const savedText=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life.dossierText;
  globalThis.fetch=async(url,options)=>{const payload=JSON.parse(options.body),parsed=JSON.parse(payload.contents[0].parts[0].text);if(parsed.dossier)throw new Error('must never regenerate an already-closed dossier');return gameFetch(url,options);};
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  globalThis.fetch=gameFetch;
  assert.deepEqual(w.story.life.dossierText,savedText,'a closed dossier must never be silently regenerated or altered by a later turn');
  // Le bouton "Verdict" ne fait que baisser dossierShown, jamais toucher au texte, et doit rester
  // idempotent (relire une fois vu ne le remet pas à false ni ne le rejoue).
  const seenBefore=calls;r=await post(input('mark_dossier_seen',1,{epoch}));assert.equal(r.status,200);assert.equal(calls,seenBefore,'marking the dossier as seen must cost zero Gemini calls');w=await r.json();
  assert.equal(w.story.life.dossierShown,true,'the Verdict button must flag the dossier as shown');
  assert.deepEqual(w.story.life.dossierText,savedText,'marking the dossier as seen must never alter its text');
  r=await post(input('mark_dossier_seen',1,{epoch}));assert.equal(r.status,200);w=await r.json();assert.equal(w.story.life.dossierShown,true,'marking an already-shown dossier as seen again is a harmless no-op');
  // Moment de douceur : une seule fois, toujours feint des deux côtés, jamais avant le dossier
  // refermé, jamais tant que rien de négatif n'a été détecté chez l'observateur.
  // world_requests vidé ici (2026-09-18) : recentRefusal regarde désormais 6 tours en arrière au
  // lieu de 3 (retour utilisateur explicite, Noé doit se calmer plus longtemps après un refus) —
  // sans ce nettoyage, une éventuelle trace plus ancienne de ce même bloc de test pouvait fausser
  // dossierGateEligible ici, un artefact d'isolation du test, pas un vrai comportement du jeu.
  sqlite.exec('DELETE FROM world_requests');
  const softnessLia=d=>/on arrête les vannes deux minutes|Ok, trêve|jouer les infirmières/.test(d.reply);
  const softnessNoe=d=>/on souffle deux secondes|j'en remets pas une couche|calme-toi deux minutes/.test(d.reply);
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);assert.ok(!p.life.softnessOwed,'no softness must be owed before any distress is detected');}
  r=await post(input('chat',1,{epoch,message:"C'est horrible, je suis choqué par ce que vous me dites."}));assert.equal(r.status,200);
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);assert.equal(p.life.softnessOwed,true,'a distress signal after the dossier must mark a softness moment as owed');}
  const softCallsBefore=calls;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(calls,softCallsBefore,'the softness beat is fully scripted, exactly like the opening or the corridor inspection: zero Gemini calls');
  assert.ok(w.decisions.some(d=>d.actor===1&&softnessLia(d)),'Lia must deliver her own reluctant softness line');
  assert.ok(w.decisions.some(d=>d.actor===2&&softnessNoe(d)),'Noé must deliver his own reluctant softness line, distinct from Lia\'s');
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);assert.equal(p.life.softnessOwed,false,'the owed softness must be consumed once delivered');assert.equal(p.life.softnessGiven,1);}
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.ok(!w.decisions.some(softnessLia)&&!w.decisions.some(softnessNoe),'the softness beat must never repeat without a fresh distress signal');
  console.log('Passed: reversed-dossier traps asked one at a time and never reposed (including a muted fixed interlocutor deferring the trap rather than silently softlocking it), verbatim answer capture, power-test gate via the bonus log, two genuinely separate voices generated exactly once, no silent regeneration afterward, a zero-API idempotent "seen" flag for the Verdict button, and a one-shot, zero-API, always-reluctant softness moment triggered only by real post-dossier distress.');
}

{
  // Cohérence colère/tendresse (2026-09-18, audit demandé par l'utilisateur) : needs.stress<30 ne
  // suffit pas à garantir qu'un personnage est vraiment calme — une vraie fureur relationnelle
  // (tension haute, confort bas) peut coexister avec un fond physiologique bas. Sans angerLevel()
  // en garde supplémentaire, une question personnelle pouvait rester éligible pendant qu'un visage
  // affichait une colère réelle, une incohérence visible pour l'observateur (Article 2/15).
  const {angerLevel}=await import('../.sites-runtime/test-simulation.mjs');
  assert.ok(angerLevel(90,5)>.5,'the test fixture itself must read as real anger, or this test proves nothing');
  flat=true;
  // round 18, pas 30 (2026-09-19) : ce test exige finalCalled:false (personalLead) avec evidence
  // encore incomplète, or round>=20 avec evidence<5 déclenche désormais investigationOverdue
  // (lib/turn.ts) qui forcerait l'étude à la place de la question personnelle — round 18 reste
  // au-dessus de personalThreshold (max 16) tout en restant sous ce nouveau plafond.
  let plot={...newStory(),round:18,met:true,introduced:true,sharedMeal:true,finalCalled:false,evidence:[],pendingDestination:undefined,life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],ambientSeen:true,ambientVerified:true,recapCount:0,personalAsked:false,exitSearched:true,tvSeen:true,remoteFound:true}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=? WHERE id=1').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:20}));
  sqlite.prepare('UPDATE agent_state SET room=?,needs=? WHERE id=2').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:20}));
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=1').run(JSON.stringify({curiosity:60,tension:90,trust:50,comfort:5,attraction:50}));
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=2').run(JSON.stringify({curiosity:60,tension:30,trust:50,comfort:60,attraction:50}));
  let epoch=(await readWorld(db)).epoch;
  const personalQuestionAsked=d=>/quel genre d.homme/i.test(d.reply);
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  assert.ok(!w.decisions.some(personalQuestionAsked),'a personal question must never be eligible while Lia genuinely reads as angry (high tension, low comfort), even with a low physiological stress');
  assert.equal(w.story.life.personalAsked,false,'a blocked personal question must never be recorded as asked');
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=1').run(JSON.stringify({curiosity:60,tension:20,trust:50,comfort:60,attraction:50}));
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.ok(w.decisions.some(d=>d.actor===1&&personalQuestionAsked(d)),'once genuinely calm, the same otherwise-eligible personal question must actually fire');
  flat=false;
  console.log('Passed: real anger (tension/comfort based, not just physiological stress) correctly blocks personal-question and follow-up beats and Noé\'s proactive advance, closing a coherence gap found while auditing emotion interconnections.');
}

{
  // Repli de modèle Gemini (2026-09-18, bug réel : quota journalier PAR MODÈLE épuisé en pleine
  // simulation intégrale). Ce bloc est délibérément le DERNIER de la suite : il configure
  // GEMINI_FALLBACK_MODELS, ce que ne fait aucun autre test — la stricte assert.equal(url,
  // ...gemini-flash-lite-latest) du mock par défaut (ligne 41), respectée par les centaines
  // d'appels de tous les tests précédents, est donc la preuve vivante que le repli reste
  // totalement inerte tant qu'il n'est pas explicitement configuré (Article 8, zéro changement de
  // comportement par défaut). Isolé en fin de fichier pour ne jamais décaler le compteur partagé
  // de crypto.randomUUID() (voir commentaire ligne 5) dont dépendent des tests antérieurs.
  const priorFetch=globalThis.fetch;
  const epoch=(await readWorld(db)).epoch;
  globalThis.__testEnv.GEMINI_FALLBACK_MODELS='gemini-flash-latest';
  let primaryAttempts=0,fallbackCalls=0;
  globalThis.fetch=async(url,options)=>{
    if(url==='https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent'){primaryAttempts++;return Response.json({error:{code:'rate_limit_exceeded'}},{status:429});}
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent');fallbackCalls++;
    // Rejoue EXACTEMENT la même requête (payload/headers déjà validés par le mock par défaut) sur
    // l'URL du modèle principal, pour prouver que seul le nom du modèle change, jamais le contenu.
    return priorFetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',options);
  };
  const r=await post(input('interact',1,{epoch}));
  assert.equal(r.status,200,'a configured fallback model must let the turn succeed despite a primary-model 429');
  assert.equal(primaryAttempts,2,'both independent character calls must hit the primary model first');
  assert.equal(fallbackCalls,2,'both independent character calls must retry against the configured fallback model exactly once');
  globalThis.fetch=priorFetch;delete globalThis.__testEnv.GEMINI_FALLBACK_MODELS;
  console.log('Passed: Gemini model fallback stays completely inert (single-model URL, proven by every earlier test in this suite) unless GEMINI_FALLBACK_MODELS is explicitly configured, and once configured, both independent character calls recover from a primary-model 429 by replaying the exact same request against the fallback model.');
}

{
  // Repli sur 503 (2026-09-18, preuve concrète en simulation réelle le jour même : la requête
  // réelle et lourde de l'application obtient parfois un 503 plutôt qu'un 429 pour un modèle
  // pourtant confirmé en quota épuisé par sonde directe au même instant — même cause, donc le
  // repli doit couvrir les deux). Mêmes garanties que le bloc 429 ci-dessus, jamais dupliquées :
  // ce bloc ne revérifie que ce qui diffère (le statut déclencheur), pas déjà couvert par lui.
  const priorFetch=globalThis.fetch;
  const epoch=(await readWorld(db)).epoch;
  globalThis.__testEnv.GEMINI_FALLBACK_MODELS='gemini-flash-latest';
  let primaryAttempts=0,fallbackCalls=0;
  globalThis.fetch=async(url,options)=>{
    if(url==='https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent'){primaryAttempts++;return Response.json({error:{code:'unavailable'}},{status:503});}
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent');fallbackCalls++;
    return priorFetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',options);
  };
  const r=await post(input('interact',1,{epoch}));
  assert.equal(r.status,200,'a configured fallback model must let the turn succeed despite a primary-model 503');
  assert.equal(primaryAttempts,2,'both independent character calls must hit the primary model first');
  assert.equal(fallbackCalls,2,'both independent character calls must retry against the configured fallback model exactly once on a 503');
  globalThis.fetch=priorFetch;delete globalThis.__testEnv.GEMINI_FALLBACK_MODELS;
  console.log('Passed: Gemini model fallback also recovers from a primary-model 503 (proven in real simulation to signal the same underlying quota exhaustion as a 429 on a heavy real request), not only a 429.');
}

{
  // Repli de clé + disponibilité partagée (2026-09-18, demande explicite de l'utilisateur : pouvoir
  // basculer vers une autre clé API, identique ou différente, et que ça se fasse tout seul plutôt
  // que de retester une clé déjà connue épuisée à chaque appel). Mécanisme remplacé le 2026-09-19
  // par lib/gemini-keys.ts (rotation + cooldown, cf. ce fichier) sans changer les garanties
  // vérifiées ici : reset explicite pour un ordre de départ déterministe (rotation=0 → la clé
  // principale, à l'index 0, reste tentée en premier tant qu'aucune clé n'est en cooldown).
  __resetGeminiKeyRotationForTests();
  const priorFetch=globalThis.fetch;
  globalThis.__testEnv.GEMINI_API_KEY_FALLBACKS='test-fallback-key';
  let primaryKeyAttempts=0,fallbackKeyCalls=0;
  globalThis.fetch=async(url,options)=>{
    if(options.headers['x-goog-api-key']==='test-only'){primaryKeyAttempts++;return Response.json({error:{code:'rate_limit_exceeded'}},{status:429});}
    assert.equal(options.headers['x-goog-api-key'],'test-fallback-key');fallbackKeyCalls++;
    // Rejoue la même requête avec la clé principale substituée dans l'en-tête, pour réutiliser
    // telle quelle la validation déjà faite par le mock par défaut (payload, headers restants).
    return priorFetch(url,{...options,headers:{...options.headers,'x-goog-api-key':'test-only'}});
  };
  let epoch=(await readWorld(db)).epoch;
  let r=await post(input('interact',1,{epoch}));
  assert.equal(r.status,200,'a configured fallback key must let the turn succeed despite a primary-key 429');
  // Le cooldown est partagé entre les deux cerveaux d'un même tour (état module-level) : dès que le
  // premier appel découvre la clé principale morte (429), le second en profite aussitôt et saute
  // directement à la clé de repli, sans revalider une clé déjà connue épuisée — plus efficace
  // qu'un essai systématique des deux clés à chaque cerveau, jamais un bug.
  assert.equal(primaryKeyAttempts,1,'only the first of the two character calls needs to discover the primary key is dead; the second benefits immediately from that same-turn memory');
  assert.equal(fallbackKeyCalls,2,'both independent character calls must retry against the configured fallback key');
  // Disponibilité mémorisée : un second tour indépendant doit maintenant essayer directement la
  // clé de repli en premier (la clé principale reste en cooldown), sans regaspiller une tentative
  // sur la clé principale toujours épuisée.
  primaryKeyAttempts=0;fallbackKeyCalls=0;
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));
  assert.equal(r.status,200);
  assert.equal(primaryKeyAttempts,0,'the primary key must not be retried while it is still in cooldown from the earlier 429');
  assert.equal(fallbackKeyCalls,2,'the only key not in cooldown must be tried directly, first, for both independent character calls');
  globalThis.fetch=priorFetch;delete globalThis.__testEnv.GEMINI_API_KEY_FALLBACKS;
  console.log('Passed: Gemini key fallback recovers from a primary-key 429 (the second character call benefits immediately from the same-turn discovery, never re-testing a key just found dead), and the shared cooldown then keeps the still-exhausted primary key out of rotation on the very next independent turn, tried directly against the healthy fallback key.');
}

{
  // Mute de l'observateur / caméra masquée UNE FOIS TIRÉS (2026-09-19 : ces deux effets ne sont
  // plus qu'une conséquence d'un tirage de la roulette, cf. le test dédié plus haut — jamais une
  // décision spontanée des personnages prise pendant un tour normal). Ce test-ci part directement
  // d'un état "vient d'être tiré" (comme si spin_bonus venait de s'exécuter) pour vérifier les
  // comportements qui restent identiques quelle que soit la source du déclenchement : blocage/non-
  // blocage du chat, respect du budget partagé par la roulette elle-même, moquerie pendant l'effet,
  // et acquittement conscient à l'expiration — jamais une boucle de 300 tours à espérer un tirage
  // spontané qui n'existe plus.
  flat=true;
  const settle=()=>{
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('salon',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'chat');
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('salon',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'chat');
    const stored=sqlite.prepare("SELECT id,content FROM memories WHERE kind='scenario'").get();
    const storedPlot=JSON.parse(stored.content);
    storedPlot.pendingDestination=undefined;
    storedPlot.life={...storedPlot.life,debrief:undefined,contact:undefined,dispute:undefined};
    sqlite.prepare('UPDATE memories SET content=? WHERE id=?').run(JSON.stringify(storedPlot),stored.id);
  };
  // --- observer_mute, juste tiré, niveau "classique" (durée 4 tours) ---
  let plot={...newStory(),round:100,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life,revealedRound:80,dossierHumanTurns:0,exitSearched:true,ambientSeen:true,ambientVerified:true,tvSeen:true,remoteFound:true,observerMutedUntilRound:104,bonusSpotlightUntilRound:104,bonusCooldownUntilRound:112,bonusLog:[{round:100,bonus:'observer_mute',level:'classique'}]}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare("INSERT INTO conversations (speaker,content,room,created_at) VALUES ('vous','Vous êtes là ?','salon',?)").run(Date.now());
  settle();
  let epoch=(await readWorld(db)).epoch;
  const blocked=await post(input('chat',1,{epoch,message:'Tu peux répondre ?'}));
  assert.equal(blocked.status,423);assert.equal((await blocked.json()).code,'observer_muted');
  const spinBlocked=await post(input('spin_bonus',1,{epoch}));
  assert.equal(spinBlocked.status,429,'the roulette must respect its own shared bonus budget while a mute it just granted is still active, never let a new spin cut short the mocking window');
  const mockTurn=await post(input('interact',1,{epoch}));assert.equal(mockTurn.status,200);const mw=await mockTurn.json();
  // Regex couvrant les 6 variantes possibles (3 par personnage) de la moquerie observer_mute,
  // pas seulement celles qui contiennent littéralement "muet"/"silence" (bug réel trouvé en
  // lançant ce test : le tirage peut choisir "Toujours aucun mot de ta part..." ou "Je t'imagine
  // en train de taper dans le vide...", qu'aucun des deux mots ne couvrait).
  assert.ok(mw.messages.some(m=>/ · pensée$/.test(m.speaker)&&/aucun mot|taper dans le vide|silence|muet|bouillir|frustrant|dire/i.test(m.content)),'the characters must keep mocking the muted observer turn after turn, not just at the moment of the draw');
  // La levée se décide en comparant le round de DÉBUT de tour (avant incrémentation) à
  // observerMutedUntilRound (route.ts, l.543) : elle n'apparaît donc que sur le tour dont le
  // round de fin affiché ici est round+1 par rapport au seuil, jamais avant — d'où la condition
  // sur la présence du champ lui-même plutôt qu'une comparaison de round bornée trop tôt (bug
  // réel trouvé en lançant ce test : la boucle s'arrêtait un tour trop tôt).
  let last=mw;
  for(let i=0;i<6&&last.story.life.observerMutedUntilRound!==undefined;i++){settle();const rr=await post(input('interact',1,{epoch}));assert.equal(rr.status,200);last=await rr.json();}
  assert.equal(last.story.life.observerMutedUntilRound,undefined,'the mute must actually lift on its own after the drawn duration, whichever character was designated to choose it');
  const reopened=await post(input('chat',1,{epoch,message:'Vous pouvez enfin me répondre ?'}));
  assert.equal(reopened.status,200,'the human channel must reopen exactly when the drawn duration elapses');
  assert.ok(last.messages.some(m=>/ · pensée$/.test(m.speaker)&&/micro|silence|reparler|parole|coupure/i.test(m.content)),'the end of the mute must be acknowledged out loud on the very turn it lifts, never a silent return to normal (Article 4/12/15)');
  // --- camera_hide, juste tiré, niveau "classique" (25-35s) ---
  const camPlot={...newStory(),round:150,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life,revealedRound:80,dossierHumanTurns:0,exitSearched:true,ambientSeen:true,ambientVerified:true,tvSeen:true,remoteFound:true,cameraHiddenUntil:Date.now()+30000,bonusSpotlightUntilRound:153,bonusCooldownUntilRound:161,bonusLog:[{round:150,bonus:'camera_hide',level:'classique'}]}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(camPlot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare("INSERT INTO conversations (speaker,content,room,created_at) VALUES ('vous','Vous êtes là ?','salon',?)").run(Date.now());
  settle();
  epoch=(await readWorld(db)).epoch;
  const stillChatting=await post(input('chat',1,{epoch,message:'On continue de discuter ?'}));
  assert.equal(stillChatting.status,200,'unlike the mute, the camera-hide bonus must never block the human channel itself');
  const camSpinBlocked=await post(input('spin_bonus',1,{epoch}));
  assert.equal(camSpinBlocked.status,429,'the roulette must respect its own shared bonus budget while a camera-hide it just granted is still active');
  settle();
  const camMockTurn=await post(input('interact',1,{epoch}));assert.equal(camMockTurn.status,200);const cmw=await camMockTurn.json();
  assert.ok(cmw.messages.some(m=>/ · pensée$/.test(m.speaker)&&/noir|aveugle|voit|image|écran/i.test(m.content)),'the characters must keep mocking the blinded observer while the camera stays hidden, not just at the moment it was cut');
  flat=false;
  console.log('Passed: once observer-mute/camera-hide are drawn by the roulette, the surrounding behaviour stays intact — chat blocked only for the mute, the roulette itself respects the shared bonus budget while either is active, both characters keep mocking the observer turn after turn, and the mute lifts on its own with a fully conscious out-loud acknowledgement.');
}

{
  // Réplique de transition vers le sommeil, jamais silencieuse (2026-09-18, "Noé rêve éveillé",
  // Point 2 de la relecture — retrouvé par comparaison de deux transcripts de simulation réelle,
  // cf. docs/regles-de-travail.md). Le filtre "no dialogue during sleep" (légitime pour un sommeil
  // qui SE POURSUIT, needs.fatigue déjà géré silencieusement) excluait aussi la toute première
  // réplique du tour de TRANSITION, où le personnage vient tout juste de choisir intent="sleep"
  // mais est encore parfaitement éveillé et vient de parler — un rêve apparaissait alors juste
  // après une conversation normale, sans la moindre annonce d'endormissement (Article 2/12/17).
  let plot={...newStory(),round:20,met:true,introduced:true,sharedMeal:true,finalCalled:false,evidence:[],life:{...newStory().life,exitSearched:true,ambientSeen:true,ambientVerified:true,tvSeen:true,remoteFound:true,personalAsked:true,personalFollowup:3}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  // Faible attirance mutuelle des deux côtés (contrairement à `steady`) : sleepRoom() alloue alors
  // le salon à Noé plutôt que la chambre — exactement la scène réelle du bug (aucun déplacement de
  // pièce), pour ne pas confondre ce test avec le mécanisme séparé de ligne de départ scénarisée
  // qui s'applique déjà quand un changement de pièce a bien lieu (route.ts, l.1276-1278).
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=1').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),JSON.stringify({...initialEmotionsFor(1),attraction:15,trust:20}));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=2').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),JSON.stringify({...initialEmotionsFor(2),attraction:15,trust:20}));
  const epoch=(await readWorld(db)).epoch;
  // "Je vais dormir" est la phrase-détonateur déjà codée (route.ts, l.789, Article 04) qui
  // convertit intent en "sleep" APRÈS génération, une fois la réplique déjà là — c'est cette
  // conversion tardive, après que le tour ait déjà coûté un vrai appel API pour les deux
  // personnages, qui produisait le bug : le filtre d'affichage traitait ensuite ce tour comme un
  // sommeil qui se poursuit, pas comme sa toute première réplique.
  const transitionLine="Je vais dormir, on reprendra ça demain. Viens, on trace dans cette piaule avant que tu t'effondres.";
  const partnerLine="D'accord, je te laisse te reposer, on en reparle demain.";
  const priorFetch=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body),context=JSON.parse(payload.contents[0].parts[0].text);
    const reply=context.selfRole==='partner'?partnerLine:transitionLine;
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({intent:'chat',affectionAccepted:false,emotions:context.state.emotions,reply,thought:"Elle a fini par dire son prénom, c'est déjà ça.",stayAlone:false,mood:'attentive',activity:context.selfRole==='partner'?'Je discute':'Je dors',goal:'Récupérer',action:'none',room:context.scene.room,memory:reply})}]}}]});
  };
  const r=await post(input('interact',2,{epoch}));
  globalThis.fetch=priorFetch;
  assert.equal(r.status,200);
  const w=await r.json();
  assert.equal(w.agents.find(a=>a.id===2).intent,'sleep','setup check: the explicit announcement must actually have converted this decision to sleep, or this test proves nothing');
  // Peu importe qu'il finisse tagué comme réplique parlée ou pensée privée (ça dépend d'un
  // mécanisme séparé, "ensemble ou pas" ce tour précis) : ce que ce test vérifie, c'est que le
  // contenu réel de la transition n'est plus purement et simplement absent, comme avant ce correctif.
  const spokenIndex=w.messages.findIndex(m=>['Noé','Noé · pensée'].includes(m.speaker)&&m.content===transitionLine);
  assert.ok(spokenIndex>=0,'the transition turn into sleep must still surface the character\'s real line somewhere, never silently dropped like a continuing sleep turn');
  const dreamIndex=w.messages.findIndex(m=>m.speaker==='Noé · rêve');
  assert.ok(dreamIndex>=0,'a fresh transition into sleep must still seed a dream this same turn');
  assert.ok(spokenIndex<dreamIndex,'the transition line must appear before the dream it precedes, never after');
  console.log('Passed: a character choosing to sleep mid-conversation still speaks their real transition line this same turn, never a silent jump straight from live dialogue to a dream (Point 2, "Noé rêve éveillé").');
}

{
  // Doute amoureux privé puis discutable à voix haute (2026-09-18, retour utilisateur explicite,
  // cf. docs/referentiel/principes.md 8.17). Le modèle reconnaît lui-même, via son propre
  // state.emotions.attraction transmis AVANT ce tour, le franchissement de 75 — ce test le simule
  // directement en renvoyant une décision dont l'attirance dépasse 75 alors que l'agent partait
  // en-dessous, avec un thought distinctif à vérifier surfacé.
  // finalCalled+5 preuves : mode 'chat' l'exige (route.ts l.314), choisi ici précisément pour
  // échapper au lissage/crédit de l'attirance (voir plus bas).
  let plot={...newStory(),round:20,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('Preuve confirmée'),life:{...newStory().life,exitSearched:true,ambientSeen:true,ambientVerified:true,tvSeen:true,remoteFound:true,personalAsked:true,personalFollowup:3}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=1').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),JSON.stringify({...initialEmotionsFor(1),attraction:70,trust:60}));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=2').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),JSON.stringify({...initialEmotionsFor(2),attraction:30,trust:60}));
  const loveThought="Est-ce qu'on est vraiment en train de vivre une histoire, tous les deux ? Je n'ose rien dire pour l'instant.";
  const epoch1=(await readWorld(db)).epoch;
  const priorFetch2=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body),context=JSON.parse(payload.contents[0].parts[0].text);
    const isPartner=context.selfRole==='partner';
    // Seule Lia (actor 1, "partner" ici car Noé=actor 2 initie) franchit le seuil ce tour. 100
    // (plutôt qu'une valeur proche de 75) laisse volontairement de la marge : plusieurs étapes du
    // pipeline (attractionAfterTurn, pull-back solidaire...) amortissent le saut décidé par le
    // modèle avant le résultat final — ce test vérifie le franchissement, pas la valeur exacte.
    const emotions=isPartner?{...context.state.emotions,attraction:100}:context.state.emotions;
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({intent:'chat',affectionAccepted:false,emotions,reply:isPartner?'On verra bien où ça va.':'Ça va, toi ?',thought:isPartner?loveThought:'Rien de spécial.',stayAlone:false,mood:'attentive',activity:'Je discute',goal:'Faire connaissance',action:'none',room:context.scene.room,memory:isPartner?loveThought:'Discussion.'})}]}}]});
  };
  // Mode 'chat' délibérément : tout autre mode fait passer l'attirance par le lissage/crédit
  // (route.ts, ~l.961, "gain*.28") qui étalerait ce saut sur plusieurs tours et ne franchirait
  // jamais 75 en un seul appel — 'chat' est le seul mode où l'attirance décidée par le modèle
  // s'applique telle quelle, exactement ce qu'il faut pour tester ce franchissement de façon fiable.
  const r1=await post(input('chat',2,{epoch:epoch1,message:'Comment tu te sens ?'}));
  assert.equal(r1.status,200);
  const w1=await r1.json();
  assert.ok(w1.agents.find(a=>a.id===1).emotions.attraction>75,'setup check: Lia must actually cross 75 this turn, or this test proves nothing');
  assert.ok(w1.story.life.loveRealized?.[1],'crossing 75 for the first time must set the persistent loveRealized flag for that character');
  assert.ok(w1.messages.some(m=>m.speaker==='Lia · pensée'&&m.content===loveThought),'the model\'s own thought generated the same turn attraction crosses 75 for the first time must surface as a visible private line, never discarded');
  // Un second tour, attirance encore au-dessus de 75 : la pensée ne doit jamais se répéter, le
  // franchissement n'ayant lieu qu'une fois.
  const epoch2=(await readWorld(db)).epoch;
  const r2=await post(input('chat',2,{epoch:epoch2,message:'Toujours là ?'}));
  const w2=await r2.json();
  // w2.messages est l'historique CUMULÉ (jamais purgé) : la ligne du tour 1 y reste normalement
  // visible. Ce qu'il faut vérifier n'est pas son absence mais qu'elle n'a jamais été ajoutée UNE
  // SECONDE fois au tour 2 (compter, pas seulement chercher une présence déjà garantie par tour 1).
  assert.equal(w2.messages.filter(m=>m.speaker==='Lia · pensée'&&m.content===loveThought).length,1,'the private love-realization line must never be inserted a second time once already shown once');
  globalThis.fetch=priorFetch2;
  // loveDiscussable : signalé seulement une fois un massage/baiser réellement consenti ET le doute
  // privé déjà vécu par au moins un des deux — ici seedé directement, comme d'autres tests seedent
  // life.visualIntro/personalAsked plutôt que de rejouer tout le mécanisme qui les a produits.
  let pp2=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
  pp2.life={...pp2.life,intimateGestureDone:true};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp2));
  const epoch3=(await readWorld(db)).epoch;
  const r3=await post(input('interact',2,{epoch:epoch3}));
  assert.equal(r3.status,200);
  assert.equal(lastContext.loveDiscussable,true,'once an intimate gesture is done and the private doubt already lived once, the model must be invited to raise it aloud');
  console.log('Passed: the private love-doubt thought surfaces exactly once when attraction first crosses 75 (never repeated), and loveDiscussable only turns on once a real intimate gesture has happened and the doubt was already lived privately.');
}

{
  // Pensée de validation après une décision affectueuse (2026-09-18/19, cf. docs/referentiel
  // principes.md 8.15) — jamais testée dédiée jusqu'ici (écart trouvé en audit, Article 13).
  // Durcie le même jour lors de cet audit : la garde initiale se contentait de
  // `affectionIntents.includes(decisions[0].intent)`, qui resterait vraie plusieurs tours de suite
  // si un intent affectueux venait à persister sans proposition fraîche. En creusant pour écrire
  // ce test, la trace réelle a montré qu'un autre garde-fou du moteur (la conversion "chat" de tout
  // intent affectueux non structurellement agréé) empêche déjà ce cas précis d'être atteint en
  // pratique pour hug/massage/kiss — mais la garde exigeant en plus `turnPlan.offer&&
  // turnPlan.proposalLine` (le signal exact d'une proposition FRAÎCHE) reste une précision utile,
  // jamais dépendante d'un effet de bord d'un mécanisme distinct pour rester correcte (Article 5).
  // Configuration reprise à l'identique du test "hug" déjà éprouvé plus haut (odd-cycle Noé
  // 100%/Lia 89%, cf. actionPlot) : la seule combinaison de ce fichier de tests déjà confirmée
  // pour déclencher un vrai turnPlan.offer, plutôt que d'en deviner une nouvelle à l'aveugle.
  // round 25 (pas 20) + evidence complète + finalCalled (2026-09-19) : turnPlan.offer exige
  // maintenant round>=24 (était 20), et round>=20 avec evidence<5 déclenche investigationOverdue
  // (lib/turn.ts) qui écraserait cette proposition scriptée par une relance d'étude forcée.
  const validPlot={...newStory(),life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true},round:25,finalCalled:true,evidence:Array(5).fill('preuve'),introduced:true,met:true,sharedMeal:true,salonTurns:0,pendingDestination:{room:'bureau',intent:'study',proposer:1}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(validPlot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,cycle=?,needs=?,emotions=? WHERE id=?').run('salon','chat',1,JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:89,trust:80}),1);
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,cycle=?,needs=?,emotions=? WHERE id=?').run('salon','chat',0,JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:100,trust:80}),2);
  sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Lia','Ces moments avec toi me plaisent.',Date.now());
  const validEpoch=(await readWorld(db)).epoch;
  honorOffer=true;
  const rA=await post(input('interact',1,{epoch:validEpoch}));
  honorOffer=false;
  assert.equal(rA.status,200);
  const wA=await rA.json();
  assert.equal(wA.sharedAffection,'hug','setup check: a fresh hug proposal must actually have been accepted this turn, or this test proves nothing');
  const decider=wA.proposalActor===1?2:1;
  const deciderName=decider===1?'Lia':'Noé';
  // Le mock par défaut (honorOffer, hors branches spéciales) donne à l'appel "partner" une pensée
  // fixe et distincte par personnage — reprise ici telle quelle, jamais réinventée à l'aveugle.
  const defaultThought=decider===1?'Noé m’intrigue ; je ne sais pas encore si je peux lui faire confiance.':'Lia me plaît, mais je préfère attendre un signe avant de lui proposer un câlin.';
  assert.equal(wA.messages.filter(m=>m.speaker===deciderName+' · pensée'&&m.content===defaultThought).length,1,'a fresh affectionate proposal that gets decided must surface the decider\'s own thought as a validation line exactly once');
  // Tour suivant, sans repli sur honorOffer : AUCUNE proposition fraîche n'est en cours
  // (turnPlan.offer redevient undefined, confirmé ci-dessous). Le modèle tente de renvoyer un
  // intent affectueux avec le MÊME thought qu'avant ; le moteur le neutralise déjà de son côté
  // (converti en "chat" faute d'accord structurel), et la garde renforcée n'a de toute façon plus
  // aucune raison de se déclencher — les deux protections restent cohérentes l'une avec l'autre.
  const priorFetch3=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body),context=JSON.parse(payload.contents[0].parts[0].text);
    assert.equal(context.turnPlan?.offer,undefined,'setup check: this second turn must carry no fresh offer, or it does not exercise the persisting-state case at all');
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({intent:'hug',affectionAccepted:true,emotions:context.state.emotions,reply:'On continue comme ça, tranquille.',thought:defaultThought,stayAlone:false,mood:'attentive',activity:'Je discute',goal:'Faire connaissance',action:'none',room:context.scene.room,memory:'On continue.'})}]}}]});
  };
  const epochB=(await readWorld(db)).epoch;
  const rB=await post(input('interact',1,{epoch:epochB}));
  globalThis.fetch=priorFetch3;
  assert.equal(rB.status,200);
  const wB=await rB.json();
  assert.equal(wB.decisions.length,2,'setup check: both decisions must exist this turn, or this test proves nothing');
  assert.equal(wB.messages.filter(m=>m.speaker===deciderName+' · pensée'&&m.content===defaultThought).length,1,'without a fresh turnPlan.offer, no second validation line must ever appear, even if the model keeps returning the same thought');
  console.log('Passed: the affection-decision validation thought surfaces exactly once on a genuinely fresh proposal, and stays silent on a later turn carrying no fresh offer (Article 13 gap closed; the guard was also hardened during this audit to depend only on its own fresh-proposal signal, never on another mechanism\'s side effect).');
}

{
  // Circuit organique de la pensée de validation (2026-09-19, calibrage utilisateur explicite après
  // audit, Gap #1) : le test ci-dessus ne prouve la pensée que côté Lia, parce que turnPlan.offer
  // exige structurellement current.id===2 (lib/turn.ts) — cette proposition scriptée ne peut donc
  // jamais être émise par Lia, ce qui fait que Noé ne pouvait jamais en bénéficier en tant que
  // DÉCIDEUR. Ce test couvre le nouveau chemin organique (route.ts, const organicProposal) :
  // Lia propose un câlin de son propre chef ce tour (actor=1, donc turnPlan.offer reste
  // structurellement undefined), Noé décide et reçoit à son tour une pensée de validation.
  // appearanceCompared:true (contrairement au test scripté ci-dessus, qui hérite d'un DB déjà
  // consommé par un test antérieur) : indispensable ici puisque ce plot repart d'un newStory()
  // frais — sans ce flag, le beat "même nature d'apparence" (route.ts, un autre mécanisme
  // ponctuel qui se déclenche aussi à visualIntro>=2) écraserait la réplique et l'intent de
  // decisions[0] avant même d'atteindre le code qu'on veut tester ici.
  // Noé doit accepter une intimité (donc être ≥80% d'attraction, cf. route.ts : tout intent
  // affectueux de sa part repasse en "chat" en dessous, qu'il soit le proposeur ou le décideur) —
  // mais 80%+ déclenche aussi mécaniquement proactiveNoe/affectionOpportunity (route.ts), qui
  // forceraient l'acteur du tour à Noé (donc turnPlan.offer scripté) et ruineraient l'isolation du
  // chemin organique qu'on veut ici. introduced:false coupe court à proactiveNoe (qui l'exige) sans
  // rouvrir soloIntro/opening (qui exigent !met, déjà faux ici).
  // evidence complète + finalCalled (2026-09-19) : round>=20 avec evidence<5 déclenche
  // investigationOverdue (lib/turn.ts), qui forcerait turnPlan.room à "bureau" (via intentRoom
  // ["study"]) même si l'intent renvoyé par le mock reste "hug" — un vrai mésappariement room/
  // intent qui casserait organicProposal/shared, sans rapport avec ce que ce test vérifie.
  const organicPlot={...newStory(),life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,appearanceCompared:true,personalFollowup:3,exitSearched:true},round:20,finalCalled:true,evidence:Array(5).fill('preuve'),introduced:false,met:true,sharedMeal:true,salonTurns:0};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(organicPlot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  // Noé doit rester ≥80% d'attraction (route.ts repasse tout intent affectueux le concernant en
  // "chat" en dessous, qu'il soit le proposeur ou le décideur) ; c'est justement ce qui forcerait
  // proactiveNoe/affectionOpportunity si story.introduced était resté true — d'où introduced:false
  // ci-dessus, seul verrou nécessaire pour isoler le chemin organique.
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,cycle=?,needs=?,emotions=? WHERE id=?').run('salon','chat',1,JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:89,trust:80}),1);
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,cycle=?,needs=?,emotions=? WHERE id=?').run('salon','chat',0,JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:80,trust:80}),2);
  const priorFetchOrganic=globalThis.fetch;
  const noeValidationThought='Il ose enfin faire le premier pas, ça me touche plus que je ne le montre.';
  globalThis.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body),context=JSON.parse(payload.contents[0].parts[0].text);
    assert.equal(context.turnPlan?.offer,undefined,'setup check: this scenario must never carry a scripted offer, or it does not exercise the organic path at all');
    const isPartner=context.selfRole==='partner';
    const decision=isPartner
      ?{intent:'hug',affectionAccepted:true,emotions:context.state.emotions,reply:"D'accord, je veux bien.",thought:noeValidationThought,stayAlone:false,mood:'attentive',activity:'Je discute',goal:'Faire connaissance',action:'none',room:context.scene.room,memory:"D'accord."}
      :{intent:'hug',affectionAccepted:true,emotions:context.state.emotions,reply:'Viens là, juste un câlin.',thought:'Je me lance, tant pis si ça casse.',stayAlone:false,mood:'attentive',activity:'Je discute',goal:'Faire connaissance',action:'none',room:context.scene.room,memory:'Je lui propose un câlin.'};
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(decision)}]}}]});
  };
  const organicEpoch=(await readWorld(db)).epoch;
  const rOrganic=await post(input('interact',1,{epoch:organicEpoch}));
  globalThis.fetch=priorFetchOrganic;
  assert.equal(rOrganic.status,200);
  const wOrganic=await rOrganic.json();
  assert.equal(wOrganic.sharedAffection,'hug','setup check: the organic proposal must actually be mutually accepted this turn, or this test proves nothing');
  assert.equal(wOrganic.proposalActor,1,'setup check: Lia (actor 1) must be the one proposing here, or this is not the Lia-initiated organic case Gap #1 was about');
  assert.equal(wOrganic.messages.filter(m=>m.speaker==='Noé · pensée'&&m.content===noeValidationThought).length,1,'Noé, the decider on an organic (non-scripted) proposal, must now also get his own validation thought — the mechanism only ever benefited Lia before this audit fix');
  console.log('Passed: the validation-thought mechanism now also covers the organic (non-scripted) proposal path, so Noé — not just Lia — can be the one who receives a validation thought after deciding (Gap #1 closed, audit 2026-09-19).');
}

{
  // Rythme automatique (2026-09-19, retour utilisateur explicite : 85s jugé trop lent une fois le
  // vrai rythme de jeu reconsidéré — remplacé par 20s, cf. app/page.tsx pour l'intervalle client
  // assorti). Vérifie le seuil exact plutôt que de supposer qu'il a bien été changé partout où il
  // compte. Placé en dernier dans ce fichier (comme le test des ouvertures insolites plus haut)
  // pour ne jamais décaler l'epoch ou le compteur de seed partagé dont dépendent des tests antérieurs.
  const resetResp=await post(input('reset',1,{epoch:(await readWorld(db)).epoch}));assert.equal(resetResp.status,200);
  const autoEpoch=(await readWorld(db)).epoch;
  sqlite.prepare('UPDATE world_lock SET last_auto=?').run(Date.now()-19000);
  const throttled=await post(input('autonomous',1,{epoch:autoEpoch}));
  assert.equal(throttled.status,429,'a call 19s after the last autonomous tick must still be throttled — 20s is the real floor, not a looser approximation');
  assert.equal((await throttled.json()).code,'auto_throttled');
  sqlite.prepare('UPDATE world_lock SET last_auto=?').run(Date.now()-20000);
  const allowed=await post(input('autonomous',1,{epoch:autoEpoch}));
  assert.equal(allowed.status,200,'a call at least 20s after the last autonomous tick must be accepted — the new faster rhythm must actually take effect, not silently keep the old 85s floor');
  console.log('Passed: the autonomous auto-tick floor is genuinely 20 seconds (not the former 85s) — throttled just under it, accepted right at it.');
}

{
  // Plafond garanti de l'enquête (2026-09-19, retour utilisateur explicite après audit : 12
  // minutes maximum pour la révélation, et surtout ne jamais rester bloquée indéfiniment comme
  // observé en simulation réelle — round 98, toujours pas révélé, cf. lib/turn.ts
  // investigationEscalated/investigationOverdue). Test direct de planTurn(), zéro appel API : les
  // trois paliers (base, intensifié, prioritaire) plutôt qu'un seul comportement supposé.
  const w0=await readWorld(db);
  const lia={...w0.agents[0],room:'salon',intent:'chat',needs:{hunger:10,fatigue:10,stress:10,uncertainty:50},emotions:{...w0.agents[0].emotions,attraction:50,trust:50}};
  const noe={...w0.agents[1],room:'salon',intent:'chat',needs:{hunger:10,fatigue:10,stress:10,uncertainty:50},emotions:{...w0.agents[1].emotions,attraction:90,trust:80}};
  const incompleteStory=(round)=>({...newStory(),round,introduced:true,met:true,salonTurns:5,evidence:[],life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,exitSearched:true}});
  // Palier de base (round<10) : seul round%3===0 (ou investigativeCue) relance l'étude — round 8
  // n'est pas un multiple de 3, donc aucune relance forcée ce tour précis.
  assert.equal(planTurn('autonomous',noe,lia,incompleteStory(8),true,false,'hug',[]).requiredIntent,undefined,'below round 10, a non-multiple-of-3 round must never force study on its own');
  assert.equal(planTurn('autonomous',noe,lia,incompleteStory(9),true,false,'hug',[]).requiredIntent,'study','round%3===0 must still force study below round 10, exactly as before this audit');
  // Palier intensifié (round 10-19) : round%2===0 relance aussi, même hors multiple de 3.
  assert.equal(planTurn('autonomous',noe,lia,incompleteStory(10),true,false,'hug',[]).requiredIntent,'study','from round 10, an even round must also force study, even though 10 is not a multiple of 3');
  assert.equal(planTurn('autonomous',noe,lia,incompleteStory(11),true,false,'hug',[]).requiredIntent,undefined,'an odd, non-multiple-of-3 round in the escalated window must still stay free (11 is neither)');
  // Palier prioritaire (round>=20) : la relance l'emporte désormais sur TOUTE romance scriptée,
  // même quand Noé remplirait par ailleurs toutes les conditions de son offre (attraction>=80,
  // opportunity/eligible vrais, round>=24 pour offer lui-même).
  const overdueStory=incompleteStory(25);
  const overduePlan=planTurn('autonomous',noe,lia,overdueStory,true,true,'hug',[]);
  assert.equal(overduePlan.requiredIntent,'study','an overdue investigation (round>=20, evidence<5) must force study even on an odd, non-multiple-of-3, non-multiple-of-2 round (25)');
  assert.equal(overduePlan.intent,'study','the overdue investigation must win over Noé\'s own scripted romantic offer, not just requiredIntent in isolation');
  // Une fois l'enquête complète (evidence>=5), plus aucune relance forcée : la romance retrouve
  // sa liberté normale, confirmant que ce plafond ne s'applique bien qu'à une enquête réellement
  // incomplète, jamais après coup.
  const completeStory={...overdueStory,evidence:Array(5).fill('preuve')};
  assert.notEqual(planTurn('autonomous',noe,lia,completeStory,true,true,'hug',[]).requiredIntent,'study','once evidence is complete, the guaranteed-ceiling mechanism must never keep forcing study');
  // Cohérence intent/room (2026-09-19, trouvée en relecture, jamais atteinte par un scénario réel
  // avant ce test) : un accord de destination déjà en place (executeAgreement) ne doit pas river la
  // pièce à autre chose que "bureau" alors que l'enquête en retard vient de river l'intent à
  // "study" — le même genre de mésappariement intent/room que ce fichier corrige déjà ailleurs.
  const agreedElsewhereStory={...overdueStory,pendingDestination:{room:'cuisine',intent:'eat',proposer:1}};
  const agreedPlan=planTurn('autonomous',noe,lia,agreedElsewhereStory,true,true,'hug',[]);
  assert.equal(agreedPlan.intent,'study','an overdue investigation must still win over an already-agreed destination elsewhere');
  assert.equal(agreedPlan.room,'bureau','the room must follow the overdue investigation\'s intent, never leave it mismatched with an unrelated agreed destination');
  console.log('Passed: the investigation\'s guaranteed ceiling escalates in two honest steps (round 10 intensifies, round 20 becomes absolute priority over any scripted romance) rather than a single arbitrary cutoff, never fires once evidence is already complete, and keeps room/intent consistent even against an already-agreed destination elsewhere.');
}

{
  // Plafond de l'enquête, partie 2 (2026-09-19, retour utilisateur explicite après audit du
  // plafond réel observé en simulation fraîche — round 46 au lieu du round ~33 documenté, cause
  // racine : le cycle "2 tours d'étude + 2 tours de debrief (+ parfois 1 recap)" par preuve
  // manquante). Intervention légère choisie par l'utilisateur : une fois investigationOverdue actif
  // (round>=20, même seuil que lib/turn.ts), le debrief post-preuve se raccourcit à 1 tour au lieu
  // de 2 — comparaison directe avant/après le seuil, fixture minimale (studyTurns déjà à 1, un tour
  // de plus complète la preuve).
  const freshEvidencePlot=(round)=>({...newStory(),round,met:true,introduced:true,salonTurns:5,evidence:['Preuve A','Preuve B'],life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,exitSearched:true,studyTurns:1,recapCount:0}});
  // Avant le seuil (round 9, multiple de 3 : force la relance vers l'étude sans passer par
  // investigationOverdue, qui n'existe qu'à partir du round 20).
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(freshEvidencePlot(9)));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('bureau',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'study');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('bureau',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'study');
  let epoch=(await readWorld(db)).epoch;
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  assert.equal(w.story.evidence.length,3,'setup sanity check: the fixture must actually earn a new evidence this turn');
  assert.equal(w.story.life.debrief.remaining,2,'below round 20, a freshly earned evidence must still grant the original 2-turn debrief');
  // Après le seuil (round 25 : investigationOverdue force déjà study/bureau tout seul, sans qu'un
  // multiple de 3 ou de 2 ne soit nécessaire).
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(freshEvidencePlot(25)));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('bureau',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'study');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('bureau',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'study');
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.evidence.length,3,'setup sanity check: the fixture must actually earn a new evidence this turn, overdue regime');
  assert.equal(w.story.life.debrief.remaining,1,'once the investigation is overdue (round>=20), a freshly earned evidence must grant only 1 turn of debrief instead of 2, tightening the guaranteed ceiling');
  console.log('Passed: once the investigation is overdue (round>=20), the post-evidence debrief shortens from 2 turns to 1, closing part of the gap between the documented ~33-round ceiling and the ~46-round ceiling actually observed.');
}

{
  // Plafond de l'enquête, partie 3 (même audit) : le recap salon (recapBeat) ne doit plus
  // s'interposer une fois l'enquête en retard (round>=20) — contrairement à avant round 20, où il
  // reste actif (cf. le test du recap zéro-API plus haut dans ce fichier, round 15).
  const recapOverduePlot={...newStory(),round:22,evidence:['Preuve A','Preuve B'],finalCalled:false,life:{...newStory().life,visualIntro:2,ambientSeen:true,ambientVerified:true,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,exitSearched:true,recapCount:0}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(recapOverduePlot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:30}),id);
  const beforeCalls=calls;
  const epoch=(await readWorld(db)).epoch;
  const r=await post(input('interact',2,{epoch}));assert.equal(r.status,200);
  assert.equal(calls,beforeCalls+2,'once round>=20, the recap beat must no longer intercept the turn with a zero-API local recap — a real two-brain call must happen instead, letting the overdue investigation take priority');
  console.log('Passed: once the investigation is overdue (round>=20), the salon recap detour no longer intercepts the turn, so the overdue investigation\'s absolute priority actually takes effect instead of being delayed by one more turn.');
}

{
  // Rotation des clés (2026-09-19, demande explicite de l'utilisateur à l'ajout d'une 3e clé API :
  // « pense à solliciter une rotation des clefs pour ne pas saturer une clef de demande [...]
  // systeme de rotation des clefs [...] fais quelque chose d'intelligent »). Avec plusieurs clés
  // SIMULTANÉMENT saines (aucune en cooldown), le trafic doit se répartir entre elles au lieu de
  // toujours retomber sur la même — contrairement à l'ancien mécanisme "collant" qui aurait gardé
  // la même clé indéfiniment tant qu'elle répondait. Le raisonnement tient quel que soit le point
  // de départ exact de la rotation (mod 3, les 3 index sont visités sur 3 appels consécutifs quel
  // que soit l'offset de départ) : sur 2 tours indépendants (4 appels de cerveau au total, avec 3
  // clés configurées), les 3 clés doivent TOUTES avoir été utilisées au moins une fois — la preuve
  // directe qu'aucune clé n'absorbe seule tout le trafic. Placé en toute fin de fichier comme les
  // autres blocs HTTP réels ci-dessus, pour ne jamais décaler le compteur partagé de
  // crypto.randomUUID() dont dépend le test de mute/caméra plus haut dans le fichier. Fixture
  // explicite et autonome (jamais l'état ambiant laissé par le test précédent, purement
  // planTurn() sans écriture DB) : enquête déjà complète, les deux dans le salon, aucun besoin
  // urgent, pour garantir exactement les deux appels de cerveau normaux à chaque tour.
  __resetGeminiKeyRotationForTests();
  let plot={...newStory(),round:13,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life,exitSearched:true,ambientSeen:true,ambientVerified:true,tvSeen:true,remoteFound:true}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('salon',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'chat');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('salon',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'chat');
  const priorFetch=globalThis.fetch;
  globalThis.__testEnv.GEMINI_API_KEY_FALLBACKS='test-rotation-b,test-rotation-c';
  const keysUsed=new Set();
  globalThis.fetch=async(url,options)=>{
    keysUsed.add(options.headers['x-goog-api-key']);
    return priorFetch(url,{...options,headers:{...options.headers,'x-goog-api-key':'test-only'}});
  };
  let epoch=(await readWorld(db)).epoch;
  assert.equal((await post(input('interact',1,{epoch}))).status,200);
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('salon',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'chat');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('salon',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'chat');
  epoch=(await readWorld(db)).epoch;
  assert.equal((await post(input('interact',1,{epoch}))).status,200);
  assert.deepEqual(keysUsed,new Set(['test-only','test-rotation-b','test-rotation-c']),'with 3 simultaneously healthy keys, 4 independent brain calls across 2 turns must use all 3 keys, never just one absorbing all the traffic');
  globalThis.fetch=priorFetch;delete globalThis.__testEnv.GEMINI_API_KEY_FALLBACKS;
  console.log("Passed: with several simultaneously healthy Gemini keys configured, traffic rotates across all of them instead of always landing on the same one, satisfying the explicit \"ne pas saturer une clef\" request — proven independently of the rotation counter's exact starting point.");
}

{
  // Recul adaptatif (2026-09-19, demande explicite : « fais en sorte que la rotation [...] soit
  // intelligente [...] ce systeme doit pouvoir s'ameliorer de facon autonome dans le temps »). Une
  // clé qui échoue plusieurs fois de suite doit voir son cooldown DOUBLER à chaque fois (jusqu'à un
  // plafond), sans qu'aucune intervention humaine ne soit nécessaire — puis revenir instantanément
  // à son délai de base dès qu'elle répond à nouveau normalement. Vérifié directement sur les
  // millisecondes de cooldown restantes, jamais en attendant réellement l'horloge.
  __resetGeminiKeyRotationForTests();
  const {recordKeyStatus:recordStatusForTests}=await import('../.sites-runtime/test-gemini-keys.mjs');
  recordStatusForTests('test-backoff-key',429);
  const first=__cooldownRemainingForTests('test-backoff-key');
  recordStatusForTests('test-backoff-key',429);
  const second=__cooldownRemainingForTests('test-backoff-key');
  recordStatusForTests('test-backoff-key',429);
  const third=__cooldownRemainingForTests('test-backoff-key');
  assert.ok(second>first*1.9&&second<first*2.1,'a second consecutive 429 must roughly double the cooldown compared to the first');
  assert.ok(third>second*1.9&&third<second*2.1,'a third consecutive 429 must roughly double it again');
  recordStatusForTests('test-backoff-key',200);
  recordStatusForTests('test-backoff-key',429);
  const afterSuccess=__cooldownRemainingForTests('test-backoff-key');
  assert.ok(afterSuccess<first*1.1,'a single success must reset the streak, so the very next failure gets the base cooldown again, not a continuation of the escalation');
  console.log('Passed: a key failing repeatedly gets an automatically escalating cooldown with no human tuning needed, and a single success instantly resets it back to the base delay.');
}

{
  // Persistance réelle du compteur de mots (2026-09-19, cf. lib/dialogue.ts::recentEchoWords) :
  // vérifie qu'un mot employé par les deux personnages incrémente bien life.wordFrequency à travers
  // de vrais tours HTTP, et que ce compteur continue d'accumuler d'un tour indépendant à l'autre —
  // pas seulement dans le test unitaire de la fonction pure dialogueProgress() plus haut.
  const plot={...newStory(),round:13,met:true,introduced:true,finalCalled:true,evidence:Array(5).fill('preuve'),life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,exitSearched:true}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:30}),id);
  const priorFetch=globalThis.fetch;
  // Deux formulations distinctes par tour (jamais la même phrase deux fois, sinon le registre
  // anti-doublon existant du moteur la remplacerait par un repli sans le mot cible, faussant le
  // test) — seul le mot « distinctement » est volontairement partagé entre les deux.
  const wordFrequencyReplies=[['Franchement, on devrait vérifier distinctement chaque indice trouvé.','Oui, il faut regarder ça distinctement, sans se précipiter.'],['On doit trancher ça distinctement, une bonne fois pour toutes.','D’accord, séparons distinctement le vrai du faux ici.']];
  let wordFrequencyTurn=0;
  globalThis.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body);
    const context=JSON.parse(payload.contents[0].parts[0].text);
    const reply=context.selfRole==='partner'?wordFrequencyReplies[wordFrequencyTurn][1]:wordFrequencyReplies[wordFrequencyTurn][0];
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({intent:'chat',affectionAccepted:false,emotions:{curiosity:60,tension:30,trust:40,comfort:50,attraction:30},reply,thought:'Je réfléchis.',stayAlone:false,mood:'attentive',activity:'On discute',goal:'Comprendre',action:'move',room:'salon',memory:reply})}]}}]});
  };
  let epoch=(await readWorld(db)).epoch;
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  assert.equal(w.story.life.wordFrequency.distinctement,2,'both character replies containing the same word this turn must each increment the persisted session-wide counter');
  wordFrequencyTurn=1;
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=1').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:30}));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=2').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:30}));
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.life.wordFrequency.distinctement,4,'the counter must keep accumulating across independent turns, never reset mid-session');
  globalThis.fetch=priorFetch;
  console.log('Passed: life.wordFrequency genuinely persists and accumulates across real HTTP turns (not just in the pure-function unit test), the mechanism behind the session-wide echo-word detection that closes the real "autant" repetition bug.');
}

{
  // Bouton "passer à la révélation" (2026-09-19, entièrement spécifié par l'utilisateur avant
  // implémentation, cf. CLAUDE.md) : (1) reste verrouillé tant qu'une session n'a pas atteint la
  // révélation une première fois normalement ; (2) une fois débloqué, produit un saut cohérent —
  // les cinq preuves dans leur vrai ordre de tirage, un nombre de tours plausible, deux vraies voix
  // séparées pour le résumé (Article 8) — et laisse le vrai moment d'adresse à l'observateur se
  // jouer, jamais seulement un résumé (Article 2/15) ; (3) ne peut pas être rejoué une fois la
  // révélation atteinte dans la session ; (4) le déverrouillage lui-même survit à un reset.
  const {fullEvidenceSet,skipRound,finaleReveal}=await import('../.sites-runtime/test-story.mjs');
  const lockedPlot={...newStory(),round:8,met:true,introduced:true,everReachedRevelation:false};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(lockedPlot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  let epoch=(await readWorld(db)).epoch;
  let r=await post(input('skip_to_revelation',1,{epoch}));
  assert.equal(r.status,423,'the skip button must stay locked before a first genuine completion of the investigation');
  assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).finalCalled,false,'a rejected skip attempt must never mutate the story');

  const unlockedPlot={...lockedPlot,everReachedRevelation:true,order:[2,0,3,1]};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(unlockedPlot));
  epoch=(await readWorld(db)).epoch;
  const priorFetch=globalThis.fetch;
  let skipCalls=0;
  globalThis.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body),parsed=JSON.parse(payload.contents[0].parts[0].text);
    if(parsed['repères']){
      skipCalls++;
      const isLia=payload.systemInstruction.parts[0].text.startsWith('Tu es Lia');
      const fragment=(isLia?'Souvenir de Lia — ':'Souvenir de Noé — ')+'repères: '+Object.values(parsed['repères']).join(' / ');
      return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({fragment})}]}}]});
    }
    return priorFetch(url,options);
  };
  r=await post(input('skip_to_revelation',1,{epoch}));
  assert.equal(r.status,200,'the skip must succeed once genuinely unlocked and the investigation not already concluded');
  let w=await r.json();
  globalThis.fetch=priorFetch;
  assert.equal(skipCalls,2,'exactly one real recap call per character, never a single voice speaking for both (Article 8)');
  assert.equal(w.story.evidence.length,5,'a skip must produce the full five-piece evidence set, never a partial or empty one');
  assert.deepEqual(w.story.evidence,fullEvidenceSet(unlockedPlot),'the skipped evidence must match exactly what a genuine session would have discovered, in its real draw order — never an invented substitute');
  assert.equal(w.story.round,skipRound(unlockedPlot.seed),'the round reached by a skip must be the same deterministic, seed-varied value the pure function computes');
  assert.equal(w.story.humanUnlocked,true,'a completed skip must unlock the revelation exactly like a genuine completion (finalCalled + 5 evidence)');
  assert.ok(w.story.life.skipSummary?.lia.includes('Souvenir de Lia'),'the recap must actually be Lia’s own generated voice, not a generic filler');
  assert.ok(w.story.life.skipSummary?.noe.includes('Souvenir de Noé'),'the recap must actually be Noé’s own generated voice, not a generic filler');
  assert.ok(w.messages.some(m=>m.speaker==='Maison'&&/raccourci/.test(m.content)),'a skip must leave a visible marker in the displayed history, never a silent jump (Article 15)');
  const finale=finaleReveal(unlockedPlot.seed);
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&m.content===finale.liaThought),'the actual revelation moment (private shock, then address to the observer) must still play out after a skip, never only the recap');
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&m.content===finale.noeThought));
  assert.ok(w.messages.some(m=>m.speaker==='Lia'&&m.content===finale.lia));
  assert.ok(w.messages.some(m=>m.speaker==='Noé'&&m.content===finale.noe));
  const stored=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
  assert.equal(stored.everReachedRevelation,true,'the unlock flag itself must never be consumed by using it, unlike finalCalled');

  epoch=(await readWorld(db)).epoch;
  r=await post(input('skip_to_revelation',1,{epoch}));
  assert.equal(r.status,423,'the skip must refuse to run again once the revelation has already happened in this session');

  // Le déverrouillage doit survivre à un reset (2026-09-19, spécifié explicitement) : jamais
  // seulement la toute première session, aussi les suivantes après une nouvelle arrivée.
  epoch=(await readWorld(db)).epoch;
  r=await post(input('reset',1,{epoch}));assert.equal(r.status,200);
  const afterReset=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
  assert.equal(afterReset.everReachedRevelation,true,'everReachedRevelation must survive a reset, exactly like observer, so the button stays available on later sessions');
  assert.equal(afterReset.finalCalled,false,'a reset must still start the new session before the revelation, even though skipping is available again');
  console.log('Passed: the "skip to revelation" button stays locked before a first genuine completion, produces a plausible and internally coherent investigation plus a real two-voice recap when used, still plays the real revelation address to the observer, cannot be replayed once the revelation has happened, and survives a reset for later sessions.');
}

// L'ancien test d'éligibilité/probabilité des bonus spontanés (assoupli le 2026-09-19 après
// l'analyse de full_sim5) a été retiré le même jour : le mécanisme qu'il vérifiait — les
// personnages décidant eux-mêmes, par tour, de couper le micro/la caméra — n'existe plus.
// Correction d'incompréhension actée avec l'utilisateur : ces deux effets ne sont que deux
// visages de plus du tirage de la roulette, à chances égales avec les 7 autres (cf. le test
// "bonus roulette locked before revelation..." plus haut, qui couvre désormais les 9 tirages),
// jamais une initiative spontanée d'un personnage. Rien à retester ici en éligibilité/probabilité
// puisqu'il n'y a plus de condition d'éligibilité séparée à vérifier — le tirage suit exactement
// les mêmes règles que les 7 bonus déjà existants.

{
  // investigationCritical (2026-09-19, cycle jour/nuit) : une fois l'enquête réellement en retard
  // (round>=20 && evidence<5), la fatigue seule ne doit plus forcer un NOUVEL endormissement —
  // décision actée explicitement avec l'utilisateur ("l'enquête l'emporte toujours sur le sommeil
  // nocturne"). Round choisi en-dessous de 20 pour la ligne de base (comportement d'avant ce
  // chantier, doit rester identique), puis exactement à 20 pour la fenêtre critique.
  flat=true;affection=false;
  const settleFatigueScenario=(round,evidence=[])=>{
    const plot={...newStory(),round,met:true,introduced:true,sharedMeal:true,finalCalled:false,evidence,pendingDestination:undefined,life:{...newStory().life}};
    sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
    sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('salon',JSON.stringify({hunger:10,fatigue:90,stress:10,uncertainty:10}),'chat');
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('salon',JSON.stringify({hunger:10,fatigue:20,stress:10,uncertainty:10}),'chat');
  };
  settleFatigueScenario(5);
  let epoch=(await readWorld(db)).epoch;
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  assert.equal(w.agents.find(a=>a.id===1).intent,'sleep','baseline preserved: high fatigue below round 20 must still force sleep exactly as before this chantier (zero regression)');
  settleFatigueScenario(20);
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.notEqual(w.agents.find(a=>a.id===1).intent,'sleep','once the investigation is critically overdue (round>=20, evidence<5), fatigue alone must never force a new sleep episode — the investigation always wins over nighttime fatigue');
  console.log('Passed: fatigue alone still forces sleep below round 20 (zero regression), but never once the investigation is critically overdue (round>=20, evidence<5) — the investigation always wins over sleep, per the day/night chantier.');
}

{
  // Minuit, tombée de la nuit, aube (2026-09-19, cycle jour/nuit — lib/daynight.ts) : réactions
  // scriptées zéro-API synchronisées sur le round, jamais sur l'heure réelle. Round de départ posé
  // à round-1 (le round AVANT le marqueur visé), puisque le marqueur est lu sur nextStory.round
  // (après l'incrément normal de fin de tour).
  flat=true;affection=false;
  const settleDayNight=(round,evidence=[])=>{
    // sleptThisNight:{1:true,2:true} (2026-09-19, nuit blanche) : ce test couvre l'habillage
    // d'ambiance jour/nuit pur, pas la dette de sommeil (testée séparément juste après) — sans ce
    // réglage, l'aube par défaut basculerait sur la variante nuit-blanche puisque personne n'aurait
    // explicitement "dormi" dans ce scénario minimal.
    const plot={...newStory(),round,met:true,introduced:true,sharedMeal:true,finalCalled:evidence.length>=5,evidence,pendingDestination:undefined,life:{...newStory().life,sleptThisNight:{1:true,2:true}}};
    sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
    sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('salon',JSON.stringify({hunger:10,fatigue:20,stress:10,uncertainty:10}),'chat');
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('salon',JSON.stringify({hunger:10,fatigue:20,stress:10,uncertainty:10}),'chat');
  };
  const pensees=w=>w.messages.filter(m=>/ · pensée$/.test(m.speaker));
  // Minuit, enquête encore incomplète : réaction d'urgence, jamais le sarcasme fantôme.
  settleDayNight(34,[]);
  let epoch=(await readWorld(db)).epoch;
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  assert.equal(w.story.round,35,'test setup sanity: round must actually reach the midnight marker (35) this turn');
  assert.ok(pensees(w).some(m=>/minuit|douze coups/i.test(m.content)),'midnight must trigger a scripted reaction while the investigation is still incomplete');
  assert.ok(!pensees(w).some(m=>/fantôme|spectre|manoir hant|épouvante|théâtral/i.test(m.content)),'the ghost/sarcasm variant must never fire while the investigation is genuinely still open');
  // Minuit, enquête déjà résolue : sarcasme méta sur les fantômes, jamais une confirmation neutre.
  settleDayNight(34,Array(5).fill('preuve'));
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.ok(pensees(w).some(m=>/fantôme|spectre|manoir hant|épouvante|théâtral/i.test(m.content)),'once the investigation is already resolved, midnight must switch to the sarcastic ghost-joke variant');
  // Tombée de la nuit (round 29) : habillage plus modeste, sans branche urgence/résolu.
  settleDayNight(28,[]);
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.round,29);
  assert.ok(pensees(w).some(m=>/baisse|lumière change|s'assombrit|nuit arrive|décline|nuit approche/i.test(m.content)),'nightfall (round 29) must trigger its own modest ambiance reaction');
  // Aube du second cycle (round 38, jamais le tout premier round 0 qui chevaucherait soloIntro).
  settleDayNight(37,[]);
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.round,38);
  assert.ok(pensees(w).some(m=>/jour revient|éclairer dehors|jour se lève|jour est là|se relève dehors/i.test(m.content)),'dawn of the second cycle (round 38) must trigger its own modest ambiance reaction');
  // L'indicateur jour/nuit affiché côté client est calculé à chaque lecture de readWorld().
  assert.equal(w.story.dayNight.isNight,false);assert.equal(w.story.dayNight.phase,'aube');assert.equal(w.story.dayNight.day,2,'day 38 belongs to the second cycle');
  flat=false;
  console.log('Passed: midnight (round 35, synchronized with the investigation ceiling) reacts with genuine urgency while the investigation is open and switches to sarcastic ghost jokes once it is already resolved, nightfall (round 29) and dawn (round 38) get their own modest ambiance reactions, and the displayed day/night indicator (readWorld) reflects the right phase/day.');
}

{
  // Nuit blanche / dette de sommeil (2026-09-19, conception calibrée avec l'utilisateur après le
  // "test de compréhension" du même jour — cf. CLAUDE.md, points-fragiles.md). Deux scénarios
  // identiques en tout point sauf life.sleptThisNight pour l'acteur 1, comparés round 37 -> 38
  // (l'aube) pour isoler le seul effet du malus : le delta entre les deux doit être exactement +28,
  // jamais plus (pas de cumul), jamais moins (le malus doit vraiment s'appliquer).
  flat=true;affection=false;
  const settleSleepDebt=(slept1)=>{
    const plot={...newStory(),round:37,met:true,introduced:true,sharedMeal:true,finalCalled:false,evidence:[],pendingDestination:undefined,life:{...newStory().life,sleptThisNight:slept1?{1:true,2:true}:{2:true}}};
    sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
    sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('salon',JSON.stringify({hunger:10,fatigue:40,stress:10,uncertainty:10}),'chat');
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('salon',JSON.stringify({hunger:10,fatigue:40,stress:10,uncertainty:10}),'chat');
  };
  const penseesOf=(w,name)=>w.messages.filter(m=>m.speaker===name+' · pensée');
  settleSleepDebt(true);
  let epoch=(await readWorld(db)).epoch;
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  assert.equal(w.story.round,38,'test setup sanity: round must reach dawn (38) this turn');
  const fatigueSlept=w.agents.find(a=>a.id===1).needs.fatigue;
  assert.ok(!penseesOf(w,'Lia').some(m=>/nuit blanche|zéro sommeil|pas dormi|n.ai pas dormi/i.test(m.content)),'a character who genuinely slept during the night must never get the nuit-blanche acknowledgment at dawn');
  settleSleepDebt(false);
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.round,38);
  const fatigueMissed=w.agents.find(a=>a.id===1).needs.fatigue;
  assert.equal(fatigueMissed-fatigueSlept,28,'a genuinely sleepless night must add exactly the flat +28 fatigue penalty on top of the normal dawn increment, isolated by comparing two otherwise identical scenarios that differ only on sleptThisNight');
  assert.ok(penseesOf(w,'Lia').some(m=>/nuit blanche|zéro sommeil|pas dormi une minute/i.test(m.content)),'the character who missed the whole night must get an explicit, non-silent acknowledgment at dawn, never a silent penalty (Article 15/17)');
  // Non-cumulable : une seconde nuit blanche consécutive doit réappliquer le même malus fixe, jamais
  // un montant plus élevé (life.sleptThisNight est un simple flag remis à zéro, pas un compteur).
  epoch=(await readWorld(db)).epoch;
  const plotSecondCycle={...newStory(),round:75,met:true,introduced:true,sharedMeal:true,finalCalled:false,evidence:[],pendingDestination:undefined,life:{...newStory().life,sleptThisNight:{2:true}}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plotSecondCycle));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('salon',JSON.stringify({hunger:10,fatigue:40,stress:10,uncertainty:10}),'chat');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('salon',JSON.stringify({hunger:10,fatigue:40,stress:10,uncertainty:10}),'chat');
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.round,76,'second-cycle dawn marker (round 76 = 38+38) sanity check');
  const fatigueSecondMissed=w.agents.find(a=>a.id===1).needs.fatigue;
  assert.equal(fatigueSecondMissed-fatigueSlept,28,'a second consecutive sleepless night applies the exact same flat +28, never an escalated amount — no stacking across nights');
  flat=false;
  console.log('Passed: a genuinely sleepless night (never once isSleeping() during the 9 night rounds) adds an exact, non-stacking +28 fatigue penalty at the next dawn, paired with an explicit non-silent acknowledgment line — while a character who slept at least once gets neither, closing the "nuit blanche" gap found via the 2026-09-19 comprehension test.');
}

{
  // Refus explicite de la roulette (2026-09-19, test dédié demandé explicitement par
  // l'utilisateur après full_sim7, cf. docs/referentiel/points-fragiles.md). Précision actée avec
  // l'utilisateur : "ils" qui proposent la roulette désigne Lia/Noé, qui relancent l'OBSERVATEUR
  // pour la lui demander — seul l'observateur (via spin_bonus) peut réellement la déclencher ; un
  // refus est donc l'observateur qui décline LEUR demande, jamais l'inverse. Aucun "bonus rare" :
  // les 9 bonus partagent les mêmes chances (cf. tests de la roulette plus haut), non concerné ici.
  flat=true;affection=false;refuse=false;
  const plot={...newStory(),round:60,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,emotions=?').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:20}),JSON.stringify({curiosity:60,tension:20,trust:60,comfort:60,attraction:60}));
  let epoch=(await readWorld(db)).epoch;
  // "revealed" (route.ts) exige aussi observerSpoken (un "vous" déjà en base, ou le mode "chat" en
  // cours) — sans un premier message de l'observateur, une offre ne serait jamais enregistrée.
  let r0=await post(input('chat',1,{epoch,message:"On continue l'enquête."}));assert.equal(r0.status,200);let w0=await r0.json();epoch=w0.epoch;
  // Une réplique contient une offre reconnaissable ("...si tu fais tourner la roulette...").
  const priorFetchRefusal=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{const response=await priorFetchRefusal(url,options),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);decision.reply=isPartnerRequest([url,options])?'Bof.':"Je veux bien t'aider, mais seulement si tu fais tourner la roulette en échange.";body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  globalThis.fetch=priorFetchRefusal;
  assert.ok(w.story.life.negotiationOffer,'test setup sanity: a recognizable roulette request must be recorded as a pending negotiation offer');
  // Refus explicite de l'observateur : le "non" efface l'offre et pose une vraie pause partagée
  // (les deux personnages entendent ce refus, pas seulement celui qui a demandé).
  epoch=w.epoch;
  const roundAtRefusal=w.story.round;
  const appreciationBeforeRefusal=w.story.life.appreciation[1];
  r=await post(input('chat',1,{epoch,message:"Non, certainement pas."}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.life.negotiationOffer,undefined,'an explicit refusal must clear the pending negotiation offer, never leave it dangling');
  assert.equal(w.story.life.appreciation[1],Math.max(0,appreciationBeforeRefusal-3),'an explicit refusal must cost appreciation just like a silently lapsed offer, never nothing at all (gap confirmed while building this very test)');
  assert.equal(w.story.life.appreciation[2],Math.max(0,appreciationBeforeRefusal-3),'the refusal is a shared observer-relationship event, both gauges must move together, exactly like a lapsed offer');
  assert.equal(w.story.life.negotiationLog[w.story.life.negotiationLog.length-1].outcome,'refused','a refusal must leave its own distinct trace in negotiationLog, never conflated with a silent lapse');
  assert.ok(w.story.life.rouletteRefusalUntil[1]>roundAtRefusal+4&&w.story.life.rouletteRefusalUntil[1]<=roundAtRefusal+11,'an explicit refusal must set a real 5-to-10-round pause before either character can be re-recorded asking again');
  assert.equal(w.story.life.rouletteRefusalUntil[1],w.story.life.rouletteRefusalUntil[2],'both characters must hear the same refusal — the pause is shared, not per-actor');
  // Pendant cette fenêtre, une réplique qui relancerait la roulette doit être amputée de sa
  // relance, sans jamais toucher au reste du message (le vrai sujet en cours doit survivre).
  epoch=w.epoch;
  const priorFetchStrip=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{const response=await priorFetchStrip(url,options),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);decision.reply=isPartnerRequest([url,options])?'Bof.':"Je pense qu'on devrait fouiller la cuisine. Allez, fais tourner la roulette, ça nous aiderait bien.";body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  globalThis.fetch=priorFetchStrip;
  const strippedMessage=w.messages.find(m=>/fouiller la cuisine/i.test(m.content));
  assert.ok(strippedMessage,'the rest of the reply (the real topic in progress) must survive the roulette-ask removal');
  assert.ok(!/roulette/i.test(strippedMessage.content),'the roulette relaunch itself must be stripped from the reply while the refusal window is active');
  assert.equal(w.story.life.negotiationOffer,undefined,'a stripped relaunch must never be re-recorded as a fresh pending negotiation offer while the refusal window is active');
  flat=false;
  console.log('Passed: an explicit "non" to a pending roulette request (from Lia/Noé asking the observer, never the reverse) clears the offer, now costs appreciation exactly like a silent lapse (real gap closed) with its own distinct negotiationLog trace, and sets a real shared 5-to-10-round refusal window for both characters, during which any further roulette relaunch is stripped from replies while the rest of the message survives intact, and no new negotiation offer gets re-recorded until the window lapses.');
}

{
  // Assouplissement de genuineRespectStreak (2026-09-19, demande explicite de l'utilisateur : seuil
  // jugé trop strict — cf. docs/referentiel/points-fragiles.md et principes.md 8.5). Avant ce jour,
  // un tour où la confiance restait simplement stable (trustShift=0) cassait déjà la série ;
  // désormais seule une vraie baisse (trustShift<0) la casse — un tour qui reste très positif sans
  // continuer à monter encore compte aussi dans la série.
  flat=true;affection=false;refuse=false;
  const plot={...newStory(),round:60,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life,appreciation:{1:90,2:90},genuineRespectStreak:{1:5,2:5}}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,emotions=?').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:20}),JSON.stringify({curiosity:60,tension:20,trust:60,comfort:60,attraction:60}));
  let epoch=(await readWorld(db)).epoch;
  const gameFetchRespect=globalThis.fetch;
  const forceOwnTrustDelta=delta=>async(url,options)=>{const response=await gameFetchRespect(url,options),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);const ctx=JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);decision.emotions={...decision.emotions,trust:ctx.state.emotions.trust+delta};body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
  // Un tour qui reste simplement stable (trustShift=0) ne doit plus casser la série : 5 -> 6.
  globalThis.fetch=forceOwnTrustDelta(0);
  let r=await post(input('chat',1,{epoch,message:"Merci d'être toujours là."}));assert.equal(r.status,200);let w=await r.json();
  globalThis.fetch=gameFetchRespect;
  assert.equal(w.story.life.genuineRespectStreak[1],6,'a turn where trust merely stays flat (not rising) must no longer break the streak — the real loosening requested by the user');
  // Le palier, une fois à 6, se déclenche puis se consomme immédiatement (jamais un acquis), même
  // si ce nouveau tour reste lui aussi simplement stable.
  epoch=w.epoch;
  globalThis.fetch=forceOwnTrustDelta(0);
  r=await post(input('chat',1,{epoch,message:"J'apprécie vraiment ce que vous faites."}));assert.equal(r.status,200);w=await r.json();
  globalThis.fetch=gameFetchRespect;
  assert.equal(w.story.life.genuineRespectStreak[1],0,'once the rare respect tier has fired at streak>=6, it must consume itself immediately, never staying at or above 6');
  // Une vraie baisse de confiance doit continuer à casser la série normalement (pas de régression).
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.genuineRespectStreak={1:5,2:5};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  epoch=(await readWorld(db)).epoch;
  globalThis.fetch=forceOwnTrustDelta(-2);
  r=await post(input('chat',1,{epoch,message:"Vous êtes vraiment nuls."}));assert.equal(r.status,200);w=await r.json();
  globalThis.fetch=gameFetchRespect;
  assert.equal(w.story.life.genuineRespectStreak[1],0,'a genuine trust drop must still reset the streak to zero, exactly as before this loosening');
  flat=false;
  console.log('Passed: genuineRespectStreak now tolerates a turn that merely stays flat/positive (no longer requires trust to keep climbing every single turn), while a genuine drop still resets it, and the rare respect tier still consumes itself immediately once triggered — closing the too-strict gap the user flagged.');
}

{
  // KPI d'efficacité du Smart Breaker (2026-09-19, demande explicite de l'utilisateur : « un petit
  // KPI qui mesure l'efficacité du smart-breaker [...] pour s'assurer que l'utilisation de cet
  // outil est rentable », prêt pour la prochaine simulation). Test pur, déterministe, zéro appel
  // réseau — vérifie que les compteurs bruts (lib/gemini-keys.ts) reflètent fidèlement une séquence
  // scriptée d'appels, sans essayer de calculer un taux de "sauvetage" précis (ambigu sous
  // concurrence entre les deux cerveaux, cf. le commentaire du code).
  const {orderKeys:orderKeysForTest,recordKeyStatus:recordStatusForMetrics,getGeminiKeyMetrics,__resetGeminiKeyRotationForTests:resetForMetrics}=await import('../.sites-runtime/test-gemini-keys.mjs');
  resetForMetrics();
  assert.deepEqual(getGeminiKeyMetrics(),{turns:0,primaryKeyUnavailableAtStart:0,attempts:0,successes:0,quotaFailures:0,transientFailures:0,invalidFailures:0},'metrics must start at zero right after a reset');
  const keys=['alpha','beta'];
  let order=orderKeysForTest(keys);
  assert.equal(order[0],0,'test setup sanity: with both keys healthy, the primary key (index 0) leads the very first turn');
  recordStatusForMetrics(keys[order[0]],200);
  assert.deepEqual(getGeminiKeyMetrics(),{turns:1,primaryKeyUnavailableAtStart:0,attempts:1,successes:1,quotaFailures:0,transientFailures:0,invalidFailures:0},'a clean first-try success must count exactly one turn, one attempt, one success, nothing else');
  recordStatusForMetrics(keys[0],429);
  order=orderKeysForTest(keys);
  assert.equal(order[0],1,'test setup sanity: after a 429 on the primary key, the fallback key must now lead the next turn');
  recordStatusForMetrics(keys[order[0]],200);
  const afterFallback=getGeminiKeyMetrics();
  assert.equal(afterFallback.turns,2,'two orderKeys() calls so far must count as two turns');
  assert.equal(afterFallback.primaryKeyUnavailableAtStart,1,'exactly one of those turns started with the primary key already unavailable');
  assert.equal(afterFallback.attempts,3,'three recordKeyStatus() calls so far must count as three individual attempts');
  assert.equal(afterFallback.quotaFailures,1,'the one 429 must be counted as a quota failure, distinct from transient/invalid');
  assert.equal(afterFallback.successes,2,'the two clean 200s must both count as successes');
  recordStatusForMetrics(keys[0],503);
  recordStatusForMetrics(keys[0],401);
  const finalMetrics=getGeminiKeyMetrics();
  assert.equal(finalMetrics.transientFailures,1,'a 503 must be counted as a transient failure, never conflated with a 429 quota failure');
  assert.equal(finalMetrics.invalidFailures,1,'a 401 must be counted as an invalid-key failure, its own distinct bucket');
  assert.equal(finalMetrics.attempts,5,'every recordKeyStatus() call must be counted as an attempt, regardless of outcome');
  resetForMetrics();
  assert.deepEqual(getGeminiKeyMetrics(),{turns:0,primaryKeyUnavailableAtStart:0,attempts:0,successes:0,quotaFailures:0,transientFailures:0,invalidFailures:0},'the test reset must also clear the metrics, never leave a stale count bleeding into the next test');
  console.log('Passed: the Smart Breaker efficiency counters (turns, primary-key availability at the start of a turn, attempts by outcome) track a scripted sequence of real key/status events exactly, and the test reset clears them alongside the rotation/cooldown state they already reset.');
}
{
  const {recordTurn,recordAntiEchoIntervention,recordTruncation,getQualityMetrics,__resetQualityMetricsForTests}=await import('../.sites-runtime/test-quality-metrics.mjs');
  __resetQualityMetricsForTests();
  assert.deepEqual(getQualityMetrics(),{turns:0,antiEchoInterventions:0,truncationInterventions:{1:0,2:0}},'quality/cohérence metrics must start at zero right after a reset');
  recordTurn();recordTurn();recordTurn();
  recordAntiEchoIntervention();
  recordTruncation(1,true);
  recordTruncation(2,false);
  recordTruncation(1,true);
  const m=getQualityMetrics();
  assert.equal(m.turns,3,'three recordTurn() calls must count as three turns');
  assert.equal(m.antiEchoInterventions,1,'exactly one anti-echo fallback substitution must be counted');
  assert.deepEqual(m.truncationInterventions,{1:2,2:0},'truncation is only counted when it actually changed the text, per actor — a no-op call (changed=false) must never increment its actor');
  __resetQualityMetricsForTests();
  assert.deepEqual(getQualityMetrics(),{turns:0,antiEchoInterventions:0,truncationInterventions:{1:0,2:0}},'the test reset must clear the quality/cohérence metrics, never leave a stale count bleeding into the next test');
  console.log('Passed: the Qualité (anti-echo fallback) and Cohérence logique (per-actor groundTruncation interventions) KPI counters track a scripted sequence of real events exactly, only count a truncation when it actually changed the text, and the test reset clears them.');
}
{
  // Test dédié au tableau de bord lui-même (2026-09-19, demande explicite de l'utilisateur : « un
  // test est-il prévu dédié au tableau de bord ? il pourrait alimenter l'indicateur "performances
  // du tableau de bord" [...] assure-toi que cette partie est parfaitement robuste, sécurisé »).
  // scripts/kpi-report.mjs est un simple script .mjs (pas un module "@/lib" transpilé) : ses
  // fonctions pures s'importent directement, et main() est gardé par un test d'entrypoint pour ne
  // JAMAIS déclencher d'appel réseau/exec réel pendant ce test.
  const {codeHealthScore,smartBreakerPerformanceScore,smartBreakerImprovementScore,qualityScore,coherenceScore,replayabilityScore,dashboardCoverageScore,expectedTestBlockCount}=await import('../scripts/kpi-report.mjs');
  // Chemin sain : chaque fonction renvoie un vrai nombre fini à partir de données bien formées.
  assert.deepEqual(codeHealthScore(0,79,79),{tscScore:100,testScore:100,overall:100});
  assert.equal(codeHealthScore(2,79,79).tscScore,0,'any tsc error must zero the tsc sub-score, never a partial credit');
  // coverageScore (2026-09-19, AXA-CHECK) : un 4e paramètre optionnel, jamais une régression du
  // calcul historique quand il est omis ou invalide.
  assert.deepEqual(codeHealthScore(0,79,79,undefined),{tscScore:100,testScore:100,overall:100},'an omitted coverage score must reproduce the exact historical two-term average, never a silent regression');
  assert.deepEqual(codeHealthScore(0,79,79,'x'),{tscScore:100,testScore:100,overall:100},'a malformed coverage score must be ignored, never coerced into a fake third term');
  assert.deepEqual(codeHealthScore(0,79,79,90),{tscScore:100,testScore:100,coverageScore:90,overall:(100+100+90)/3},'a valid coverage score must join as a real third term in the average, never just displayed on the side');
  assert.equal(smartBreakerPerformanceScore({successes:299,attempts:304}),(299/304)*100);
  assert.deepEqual(smartBreakerImprovementScore([{done:true},{done:true},{done:false}]),{score:(2/3)*100,done:2,total:3});
  assert.equal(qualityScore({turns:10,antiEchoInterventions:1}),90);
  assert.equal(coherenceScore({turns:10,truncationInterventions:{1:1,2:0}}),90);
  assert.equal(replayabilityScore({distinctBonuses:8,totalBonusTypes:9}),(8/9)*100);
  assert.deepEqual(dashboardCoverageScore([100,undefined,90,80,undefined]),{score:60,measured:3,total:5});
  // Fixture construite par concaténation (jamais le motif "console.log(<guillemet>Passed:" écrit
  // tel quel dans CE fichier) : sinon expectedTestBlockCount(), en lisant plus tard le vrai contenu
  // de check-house.mjs, compterait aussi cette ligne de test elle-même — un bug auto-référentiel
  // réel rencontré en écrivant ce test précis le 2026-09-19, corrigé ainsi plutôt qu'ignoré.
  const fixtureCallSq="console.log('"+"Passed: a');", fixtureCallDq='console.log("'+'Passed: b");', fixtureCallNo="console.log('"+"nope');";
  assert.equal(expectedTestBlockCount(fixtureCallSq+fixtureCallDq+fixtureCallNo),2,'the regex must catch both single- and double-quoted console.log(quote-Passed:...) calls — the exact bug found and fixed on 2026-09-19');
  // Chemin de robustesse : donnée manquante/malformée/division par zéro doit renvoyer undefined,
  // JAMAIS NaN ni un faux 0% qui se ferait passer pour une vraie mesure (Article 5, retour
  // utilisateur explicite sur ce point précis).
  assert.equal(codeHealthScore(0,5,0),undefined,'zero expected test blocks must never produce a division by zero disguised as a score');
  assert.equal(codeHealthScore(0,'x',10),undefined,'a non-numeric input must never be coerced into a fake score');
  assert.equal(smartBreakerPerformanceScore(undefined),undefined,'a missing Smart Breaker metrics object must never crash or produce NaN');
  assert.equal(smartBreakerPerformanceScore({successes:0,attempts:0}),undefined,'zero attempts must never divide by zero');
  assert.equal(smartBreakerImprovementScore([]),undefined,'an empty capability list must never divide by zero');
  assert.equal(qualityScore({turns:0,antiEchoInterventions:0}),undefined,'zero turns must never divide by zero');
  assert.equal(qualityScore(undefined),undefined);
  assert.equal(coherenceScore({turns:5}),undefined,'a missing truncationInterventions object must never crash or produce NaN');
  assert.equal(replayabilityScore({distinctBonuses:3,totalBonusTypes:0}),undefined,'zero total bonus types must never divide by zero');
  for(const bad of [NaN,Infinity,-Infinity,undefined])assert.equal(dashboardCoverageScore([bad,100,100,100,100]).measured,4,'a non-finite family score must count as unmeasured, never as a valid measurement');
  console.log('Passed: every kpi-report.mjs scoring function returns a correct percentage on well-formed data, and returns undefined — never NaN, Infinity, or a disguised 0% — on missing, malformed, or zero-denominator input, closing the exact class of bug (a silent miscount) found while building the dashboard.');
}

{
  // ARGUS — partie mécanique (2026-09-19, cf. docs/argus-blueprint.md et docs/referentiel/argus.md).
  // check-argus.mjs est un simple script .mjs (même patron que kpi-report.mjs) : ses fonctions
  // pures s'importent directement contre de petites fixtures écrites sur disque, jamais contre le
  // vrai code du projet dans ce test (qui varie dans le temps et casserait des assertions figées).
  const {findDeadLifeFields,findTodoMarkers}=await import('../scripts/check-argus.mjs');
  const fixtureLifeSource='export type Life={usedField?:boolean;deadField?:boolean;barelyUsedField?:boolean};';
  fs.writeFileSync('.sites-runtime/argus-fixture-usage.ts','life.usedField=true;if(life.usedField){}console.log(life.usedField);life.usedField=false;a.usedField=b.usedField;');
  // Construit par concaténation (jamais le motif "// TODO"/"// FIXME" écrit tel quel dans CE
  // fichier) : sinon check-argus.mjs, en balayant plus tard le vrai contenu de check-house.mjs,
  // compterait aussi cette fixture comme un vrai marqueur — le même bug auto-référentiel déjà
  // trouvé et corrigé une fois pour kpi-report.mjs (2026-09-19), reproduit ici avec ARGUS,
  // corrigé de la même façon plutôt qu'en excluant ce fichier du balayage (Article 3).
  fs.writeFileSync('.sites-runtime/argus-fixture-todo.ts','//'+' TODO: brancher la vraie logique ici\nconst x=1;\n//'+' FIXME later\nfunction ok(){return 1;}');
  const dead=findDeadLifeFields(['.sites-runtime/argus-fixture-usage.ts'],fixtureLifeSource);
  assert.ok(dead.some(d=>d.field==='deadField'&&d.confidence==='confirmé'),'a field declared in the Life type but never referenced anywhere else in the project must be flagged as a confirmed dead field');
  assert.ok(!dead.some(d=>d.field==='usedField'),'a field referenced well beyond the threshold (declaration + several real uses) must never be flagged, zero false positive on a genuinely used field');
  assert.ok(dead.some(d=>d.field==='barelyUsedField'),'a field referenced only in the type declaration and nowhere else must still be flagged (probable, since the fixture never uses it at all)');
  const todos=findTodoMarkers(['.sites-runtime/argus-fixture-todo.ts']);
  assert.equal(todos.length,2,'both a TODO and a FIXME marker must be caught, one entry per marker line');
  assert.ok(todos.every(t=>t.file.includes('argus-fixture-todo')&&typeof t.line==='number'));
  assert.equal(findTodoMarkers(['.sites-runtime/argus-fixture-usage.ts']).length,0,'a file with no TODO/FIXME marker must never produce a false positive');
  // Second bug auto-référentiel réel trouvé en construisant ce test précis (2026-09-19) : une
  // ligne qui PARLE de TODO/FIXME au milieu d'une phrase de commentaire (comme celle-ci) déclenchait
  // aussi un faux positif avant l'ancrage en début de ligne — vérifié explicitement ici pour ne
  // jamais le laisser revenir sous une autre forme (Article 3).
  fs.writeFileSync('.sites-runtime/argus-fixture-mention.ts','// Ce commentaire parle de TODO et de FIXME sans en être un lui-même\nconst y=1;');
  assert.equal(findTodoMarkers(['.sites-runtime/argus-fixture-mention.ts']).length,0,'a comment that merely MENTIONS "TODO"/"FIXME" mid-sentence must never be mistaken for a real marker — only one that opens the comment counts');
  console.log("Passed: ARGUS's mechanical layer correctly flags a Life-type field that is genuinely never read elsewhere as a confirmed dead field, never flags a field with real, plentiful usage, reliably catches every real TODO/FIXME marker, and never mistakes a comment merely mentioning those words for an actual marker — two self-referential false-positive bugs found and fixed while building this exact test.");
}

{
  // HARMONIA — partie mécanique (2026-09-19, cf. docs/harmonia-blueprint.md et
  // docs/referentiel/harmonia.md). checkLinks() prend un readFile injectable : les fixtures
  // vivent en mémoire, jamais sur disque, pour un test isolé et déterministe.
  const {checkLinks}=await import('../scripts/check-harmonia.mjs');
  const fixtures={
    '/code-ok.ts':'export const THRESHOLD=42;',
    '/doc-ok.md':'Le seuil a été fixé à 42 après calibrage.',
    '/doc-mismatch.md':'Le seuil a été fixé à 99 après calibrage.',
    '/doc-missing.md':'Ce document ne mentionne aucun seuil.',
  };
  const readFile=(f)=>{const key=Object.keys(fixtures).find(k=>f.endsWith(k));if(!key)throw new Error('fixture introuvable: '+f);return fixtures[key];};
  const linkOk=[{theme:'lien sain',code:{file:'/code-ok.ts',pattern:/THRESHOLD=(\d+)/},docs:[{file:'/doc-ok.md',pattern:/fixé à (\d+) après/}]}];
  const linkMismatch=[{theme:'lien en friction',code:{file:'/code-ok.ts',pattern:/THRESHOLD=(\d+)/},docs:[{file:'/doc-mismatch.md',pattern:/fixé à (\d+) après/}]}];
  const linkMissing=[{theme:'affirmation absente',code:{file:'/code-ok.ts',pattern:/THRESHOLD=(\d+)/},docs:[{file:'/doc-missing.md',pattern:/fixé à (\d+) après/}]}];
  const linkNoCode=[{theme:'constante introuvable',code:{file:'/code-ok.ts',pattern:/INTROUVABLE=(\d+)/},docs:[{file:'/doc-ok.md',pattern:/fixé à (\d+) après/}]}];
  assert.equal(checkLinks(linkOk,readFile)[0].confidence,'ok','a code constant and its documentation stating the exact same number must be reported as consistent, never flagged');
  assert.equal(checkLinks(linkMismatch,readFile)[0].confidence,'confirmé','a documented number that genuinely differs from the real code constant must be a confirmed friction, the whole point of this drift detector');
  assert.equal(checkLinks(linkMissing,readFile)[0].confidence,'probable','a document that never states the expected claim at all is a weaker signal than a genuine numeric mismatch — probable, not confirmed, since the claim may simply live elsewhere');
  assert.equal(checkLinks(linkNoCode,readFile)[0].confidence,'confirmé','a code pattern that cannot even be found in its own source file must always be reported, never silently skipped');
  console.log('Passed: HARMONIA\'s mechanical layer correctly reconfirms a documented numeric claim against its real code constant — consistent numbers pass silently, a genuine mismatch is a confirmed friction, and a missing documentation claim or an unfindable code constant are both reported rather than silently ignored.');
}

{
  // SMART CONSO API (2026-09-19, cf. docs/smart-conso-api-blueprint.md et
  // docs/referentiel/smart-conso-api.md). Fonctions pures testées directement contre des données
  // fabriquées en mémoire, jamais contre le vrai .gemini-key-health.json/.smart-conso-session.json
  // (qui varient dans le temps et casseraient des assertions figées).
  const {assess,recentExhaustionRate,countRecentActions,recordAction,HARD_THRESHOLDS}=await import('../scripts/smart-conso-api.mjs');
  const now=Date.now();
  const healthCalm={keys:{a:{episodes:[{at:now-1000,model:'m',outcome:'OK'},{at:now-2000,model:'m',outcome:'OK'}]}}};
  const healthStrained={keys:{a:{episodes:[{at:now-1000,model:'m',outcome:'QUOTA_ÉPUISÉ'},{at:now-2000,model:'m',outcome:'QUOTA_ÉPUISÉ'},{at:now-3000,model:'m',outcome:'OK'}]}}};
  const healthEmpty={keys:{}};
  const healthOld={keys:{a:{episodes:[{at:now-10*60*60*1000,model:'m',outcome:'QUOTA_ÉPUISÉ'}]}}};
  assert.equal(recentExhaustionRate(healthEmpty,now),undefined,'no episodes at all must report an absence, never a fake 0% or 100%');
  assert.equal(recentExhaustionRate(healthOld,now),undefined,'an episode outside the observation window must never count, even if it was a real exhaustion');
  assert.equal(recentExhaustionRate(healthCalm,now),0,'all-OK recent episodes must report a genuine 0% exhaustion rate');
  assert.equal(recentExhaustionRate(healthStrained,now),2/3,'a real mix of outcomes must compute the exact honest ratio');
  const emptySession={actions:[]};
  assert.equal(countRecentActions(emptySession,'simulation',now,6),0);
  const busySession={actions:[{type:'simulation',at:now-1000,confirmed:true},{type:'simulation',at:now-2000,confirmed:true},{type:'simulation',at:now-3000,confirmed:false},{type:'check-spirit',at:now-1000,confirmed:true}]};
  assert.equal(countRecentActions(busySession,'simulation',now,6),2,'only confirmed actions of the matching type within the window must be counted — an unconfirmed advisory-only check must never count as a real launch');
  assert.equal(assess(healthCalm,emptySession,'simulation',now).verdict,'ok','calm quota and an empty session log must never produce a warning');
  assert.equal(assess(healthStrained,emptySession,'simulation',now).verdict,'avertissement_souple','a genuinely strained recent quota must trigger the soft, negotiable warning');
  assert.equal(assess(healthCalm,busySession,'simulation',now).verdict,'seuil_dur','reaching the hard threshold (2 simulations within its window) must trigger the hard verdict even when the quota itself looks calm right now — the two signals are independent');
  assert.ok(HARD_THRESHOLDS.simulation.count===2&&HARD_THRESHOLDS.simulation.windowHours===6,'the documented starting hard threshold (2 simulations per 6h window) must match what the code actually enforces');
  assert.ok(typeof recordAction==='function','recordAction must be exported for the CLI entrypoint to persist a confirmed action to the local session ledger');
  console.log("Passed: Smart Conso API's pure advisory logic reports an honest absence when there is no recent data, computes the exact real exhaustion ratio otherwise, counts only confirmed actions of the matching type within the sliding window, and correctly distinguishes the hard-threshold verdict from the soft-quota-pressure warning as two independent signals.");
}

{
  // HYPER-SCAN-CHECKPOINT (2026-09-19, cf. docs/hyper-scan-checkpoint-blueprint.md et
  // docs/referentiel/hyper-scan-checkpoint.md). Fonctions pures testées contre des fixtures en
  // mémoire, jamais contre le vrai docs/hyper-scan-checkpoint/index.md (qui grossit dans le temps).
  const {lastCheckpointCommit,summarizeArgusOutput,summarizeHarmoniaOutput,checkpointPerformance}=await import('../scripts/hyper-scan-checkpoint.mjs');
  const emptyIndex='# titre\n\n| Date | Commit couvert jusqu\'à | Version | Trouvailles | Rapport | Notes |\n|---|---|---|---|---|---|\n';
  const oneRowIndex=emptyIndex+'| 2026-09-19 | `abc1234` | légère | 2 | [scan.txt](scan.txt) | premier passage |\n';
  const twoRowIndex=oneRowIndex+'| 2026-09-20 | `def5678` | complète | 0 | [scan2.txt](scan2.txt) | rien trouvé cette fois |\n';
  assert.equal(lastCheckpointCommit(emptyIndex),undefined,'an index with no data row yet must report an honest absence, never a fake commit');
  assert.equal(lastCheckpointCommit(oneRowIndex),'abc1234','the commit hash must be read from the data row, not confused with the date column that comes first');
  assert.equal(lastCheckpointCommit(twoRowIndex),'def5678','the LAST row must win when several passages are already recorded, never the first');
  assert.equal(checkpointPerformance(emptyIndex),undefined,'zero recorded passages must report an absence, never a disguised 0%');
  const perf=checkpointPerformance(twoRowIndex);
  assert.equal(perf.passages,2);assert.equal(perf.totalFindings,2);assert.equal(perf.findingsPerPassage,1);assert.equal(perf.hitRate,50,'exactly one of the two recorded passages found something real, so the hit rate — the tool\'s actual vocation per the user\'s explicit framing — must read 50%, not an average that would hide it');
  assert.deepEqual(summarizeArgusOutput('[confirmé] a\n[probable] b\nMarqueurs TODO/FIXME trouvés (3) :'),{candidatsDetectes:2,todos:3});
  assert.deepEqual(summarizeHarmoniaOutput('2 friction(s) confirmée(s) sur 5 lien(s) vérifié(s).'),{frictions:2,liensVerifies:5});
  assert.deepEqual(summarizeHarmoniaOutput('rien à voir ici'),{frictions:undefined,liensVerifies:undefined},'unparseable HARMONIA output must never be silently miscounted as zero');
  console.log("Passed: HYPER-SCAN-CHECKPOINT correctly reads the last recorded commit from its own index (never confusing the date column with the commit column, always the most recent row), reports an honest absence rather than a fake 0% when no passage has been recorded yet, and computes its own central performance KPI — the real hit rate of passages that surfaced a genuine confirmed finding, the tool's whole stated vocation — exactly rather than as a averaged-away percentage.");
}

{
  // CHECK-LEVEL-TARGET (2026-09-19, cf. docs/check-level-target-blueprint.md et
  // docs/referentiel/check-level-target.md). Validé directement contre les vrais prompts
  // historiques de l'utilisateur qui ont motivé sa création (cf. Article 21) — la meilleure preuve
  // que l'heuristique reconnaît ce qu'elle est censée reconnaître, pas une fixture inventée seule.
  const {classifyCheckLevel}=await import('../scripts/check-level-target.mjs');
  assert.equal(classifyCheckLevel("corrige ce bug d'affichage stp").level,'leger','a trivial fix request must never over-trigger the expensive tiers');
  assert.equal(classifyCheckLevel('').level,'standard','no signal at all must fall back to the safe default (standard), never a silent leger that could under-check real work');
  const approfondi=classifyCheckLevel("verifie que toutes les consignes ont bien été traitées : beaucoup de choses ont evolué. verifie que tout est bien conecté, identifie les eventuelles erereurs ou bugs latents. verifie toutes les combinaisons possibles");
  assert.equal(approfondi.level,'approfondi','the real 2026-09-19 historical prompt that motivated this whole tool must classify as approfondi, not just standard');
  assert.ok(approfondi.tools.includes('check-spirit.mjs')&&approfondi.tools.includes('ARGUS'),'approfondi must recommend the real costly tools plus the free mechanical ones, never just a subset');
  const exceptionnel=classifyCheckLevel('il faut en faire une vraie machine de guerre, un hyper-scan complet depuis le début');
  assert.equal(exceptionnel.level,'exceptionnel');
  assert.deepEqual(exceptionnel.tools,['HYPER-SCAN-CHECKPOINT (version complète)']);
  const doubt=classifyCheckLevel('verifie ça en profondeur et corrige le bug');
  assert.ok(typeof doubt.needsConfirmation==='boolean');
  // ALWAYS-NEW-CODE (2026-09-19) : gap réel trouvé en dogfoodant l'outil sur sa propre demande de
  // création — une formulation de restructuration sans le mot "machine de guerre" retombait à tort
  // en standard/gratuit. Fermé par un second registre de signaux au sein du niveau exceptionnel.
  const structural=classifyCheckLevel("reconstruire ce système en partant de zéro, imaginer les grands axes idéaux et comparer à la structure actuelle du code, repérer ce qui a été codé de façon empilée");
  assert.equal(structural.level,'exceptionnel','a structural-rebuild request must reach exceptionnel just like a bug-hunting one, closing the real gap found the day ALWAYS-NEW-CODE was designed');
  assert.deepEqual(structural.tools,['ALWAYS-NEW-CODE (zoom profond)'],'a purely structural request must recommend ALWAYS-NEW-CODE, never HYPER-SCAN-CHECKPOINT alone');
  const both=classifyCheckLevel("il faut un hyper-scan complet pour reconstruire ce système en partant de zéro");
  assert.deepEqual(both.tools,['HYPER-SCAN-CHECKPOINT (version complète)','ALWAYS-NEW-CODE (zoom profond)'],'a request mixing both registers must recommend both tools, never silently pick one');
  console.log('Passed: CHECK-LEVEL-TARGET correctly classifies the real historical prompts that motivated its own creation (a trivial fix stays léger, the exact 2026-09-19 "vérification approfondie" prompt classifies as approfondi with its real costly tools recommended, an explicit "machine de guerre"/hyper-scan mention reaches exceptionnel), falls back to the safe standard default on zero signal rather than under-checking silently, always returns an explicit boolean on whether real doubt warrants confirmation, and — closing a real gap found the day ALWAYS-NEW-CODE was designed — distinguishes the "bugs cachés" and "restructuration" registers within the exceptionnel tier so a structural-rebuild request recommends ALWAYS-NEW-CODE rather than silently under-classifying or defaulting to HYPER-SCAN-CHECKPOINT alone.');
  // Vue d'ensemble du réseau (2026-09-19, demande explicite de l'utilisateur : « centraliser le
  // réseau des outils de vérification ») — un conseiller mieux informé, jamais un chef d'orchestre.
  const {countOpenFragilePoints,combineWithRegistryPressure,recentlyChangedSensitiveNodes,SENSITIVE_NODES}=await import('../scripts/check-level-target.mjs');
  const fragileFixture=[
    '# Points fragiles ouverts','','## Points ouverts','',
    '- point un','- point deux','- point trois','','## Une autre section','','- pas compté ici',
  ].join('\n');
  assert.equal(countOpenFragilePoints(fragileFixture),3,'must count only bullets under "## Points ouverts", never bullets from an unrelated later section');
  assert.equal(countOpenFragilePoints('rien de pertinent ici'),0,'a document with no such section must report zero, never throw or miscount');
  const below=combineWithRegistryPressure({level:'standard',reasoning:'r',needsConfirmation:false},2);
  assert.equal(below.needsConfirmation,false,'a low open-concerns count must never force a confirmation the text itself did not warrant');
  const above=combineWithRegistryPressure({level:'standard',reasoning:'r',needsConfirmation:false},6);
  assert.equal(above.needsConfirmation,true,'a high open-concerns count must ask for confirmation rather than silently ignoring known unresolved project-wide context');
  assert.ok(above.reasoning.includes('6'),'the reasoning must always explain the real count driving the question, never a silent black-box confirmation request');
  const alreadyExceptionnel=combineWithRegistryPressure({level:'exceptionnel',reasoning:'r',needsConfirmation:false},99);
  assert.equal(alreadyExceptionnel.needsConfirmation,false,'a level already at the maximum must never be pushed further by registry pressure, nothing to escalate to');
  console.log('Passed: the CHECK-LEVEL-TARGET registry-pressure awareness counts only the bullets under the real "Points ouverts" heading, reports zero rather than crashing on an unrelated document, and only ever turns a high count into a confirmation request (never a silent level bump) with the real number always stated in the reasoning — staying an informed adviser, never an orchestrator, per the explicit user decision.');
  // Rappel de test approfondi sur les nœuds sensibles (2026-09-19, demande explicite de
  // l'utilisateur), réutilise la carte d'HARMONIA, jamais bloquant.
  assert.ok(SENSITIVE_NODES.length>0,'the sensitive-node map must never be empty, otherwise the reminder can never fire');
  assert.deepEqual(recentlyChangedSensitiveNodes(['lib/simulation.ts','app/page.tsx']),[{node:'needs.fatigue',files:['lib/simulation.ts']}],'a changed file matching a sensitive node must be reported with exactly that node and the real matched file, never the unrelated changed file alongside it');
  assert.deepEqual(recentlyChangedSensitiveNodes([]),[],'no changed files must report zero hits, never a false positive');
  assert.deepEqual(recentlyChangedSensitiveNodes(undefined),[],'a missing changed-files list must be handled gracefully, never throw');
  const multi=recentlyChangedSensitiveNodes(['lib/turn.ts','lib/life.ts','app/page.tsx']);
  assert.equal(multi.length,2,'multiple genuinely distinct sensitive nodes touched at once must each be reported, never collapsed into one or silently dropped');
  console.log('Passed: the CHECK-LEVEL-TARGET sensitive-node reminder reuses the real HARMONIA sensitive-node map, reports exactly the matched node and files for a real hit, reports zero for no changes or a missing list rather than a false positive or a crash, and reports every distinct node touched when several are hit at once.');
}

{
  // Garde-fou fidélité au prompt (2026-09-19, cf. docs/systeme-de-suivi.md), demande explicite de
  // l'utilisateur : une clôture de tâche ne peut jamais rester un "terminée" nu.
  const {findUnverifiedClosures,auditAllSessions}=await import('../scripts/check-suivi-fidelity.mjs');
  const header='| Horodatage | Sujet | Sous-sujet | Sensibilité | Description | Statut |\n|---|---|---|---|---|---|\n';
  const mixed=header
    +'| t1 | s1 | ss1 | normal | d1 | terminée |\n'
    +'| t2 | s2 | ss2 | normal | d2 | terminée — fidèle |\n'
    +'| t3 | s3 | ss3 | normal | d3 | terminée — écart : détail |\n'
    +'| t4 | s4 | ss4 | normal | d4 | ouverte |\n'
    +'| t5 | s5 | ss5 | normal | d5 | en cours |\n';
  const hits=findUnverifiedClosures(mixed);
  assert.equal(hits.length,1,'only the bare "terminée" row must be flagged, never a fidèle/écart closure nor an open/in-progress task');
  assert.ok(hits[0].row.includes('t1'),'the flagged row must be the real offending one, never a wrong row');
  assert.deepEqual(findUnverifiedClosures(header),[],'a session file with zero task rows must report zero, never throw');
  const fakeDir=[{name:'a.md',text:mixed},{name:'b.md',text:header+'| t6 | s6 | ss6 | normal | d6 | terminée |\n'}];
  const audit=auditAllSessions('/fake',()=>fakeDir.map(f=>f.name),(p)=>fakeDir.find(f=>p.endsWith(f.name)).text,()=>true);
  assert.equal(audit.length,2,'every session file with at least one unverified closure must be reported, never only the first one found');
  assert.equal(audit.reduce((n,r)=>n+r.hits.length,0),2,'the total real count across all session files must be exact, one from each fixture file here');
  assert.deepEqual(auditAllSessions('/definitely-not-a-real-path'),[],'a missing sessions directory must report an honest empty result, never throw or crash the weekly network checkup that depends on it');
  console.log('Passed: the tracking-system fidelity guard flags only a bare "terminée" closure (never a fidèle/écart closure nor an open/in-progress task), reports zero on an empty or missing sessions directory rather than crashing, and audits every session file rather than stopping at the first one found.');
}
{
  // findOpenTasks()/auditOpenTasks() (2026-09-19) : le complément direct de findUnverifiedClosures
  // ci-dessus — répond à "qu'est-ce qui reste ouvert ?" plutôt qu'à "une clôture a-t-elle sauté une
  // étape ?". Né d'un vrai constat le jour même : une session affichait encore "en cours" pour deux
  // tâches terminées depuis des heures, invisible sans relire tout le fichier à la main.
  const {findOpenTasks}=await import('../scripts/check-suivi-fidelity.mjs');
  const session='| Horodatage | Sujet | Sous-sujet | Sensibilité | Description | Statut |\n|---|---|---|---|---|---|\n| t1 | S | s | normal | d1 | ouverte |\n| t2 | S | s | normal | d2 | en cours |\n| t3 | S | s | normal | d3 | terminée — fidèle |\n| t4 | S | s | normal | d4 | terminée |';
  const open=findOpenTasks(session);
  assert.equal(open.length,2,'exactly the two non-"terminée" rows must be flagged, never the ones already closed regardless of their fidelity wording');
  assert.deepEqual(open.map(o=>o.statut),['ouverte','en cours'],'each open row must report its real, distinct status verbatim, never a generic "open" label that would hide whether it is brand new or already in progress');
  assert.equal(findOpenTasks('| Horodatage | Sujet | Sous-sujet | Sensibilité | Description | Statut |\n|---|---|---|---|---|---|').length,0,'a session with zero task rows must report zero open tasks, never crash');
  console.log('Passed: findOpenTasks() flags exactly the rows whose status is not "terminée" (an "ouverte" and an "en cours" row alike), reports each one\'s real distinct status rather than a generic open label, never flags an already-closed row regardless of its fidelity wording, and reports zero rather than crashing on a session with no task rows at all — the exact blind spot found live when a session file kept showing two long-finished tasks as still "en cours".');
}

{
  // Extraction compacte des simulations archivées (2026-09-19, demande explicite de l'utilisateur,
  // pendant que les journaux bruts existaient encore). Un vrai bug trouvé et corrigé en construisant
  // cet outil : les journaux les plus anciens (full_sim/2/3) n'ont jamais eu de story.round, le
  // numéro de round n'existant qu'encodé dans le label de la requête (ex. "phase1-round11-actor1").
  const {summarizeActions,formatSummary,parseRoundFromLabel}=await import('../scripts/summarize-simulation-log.mjs');
  assert.equal(parseRoundFromLabel('phase1-round11-actor1'),11,'the label fallback must correctly extract the round number from a real historical label format');
  assert.equal(parseRoundFromLabel('reset'),undefined,'a label carrying no round number must report an honest absence, never a fake 0');
  assert.equal(parseRoundFromLabel(undefined),undefined,'a missing label must never throw');
  const entries=[
    {label:'reset',response:{story:{round:0,life:{bonusLog:[],gardenOpen:false},evidence:[]},decisions:[]}},
    {label:'r1',response:{story:{round:1,humanUnlocked:false,life:{bonusLog:[{bonus:'food'}],gardenOpen:false},evidence:['x']},decisions:[{actor:1,room:'salon'},{actor:2,room:'bureau'}]}},
    {label:'r2',response:{story:{round:2,humanUnlocked:true,life:{bonusLog:[{bonus:'food'}],gardenOpen:true},evidence:['x','y']},decisions:[{actor:1,room:'cuisine'},{actor:2,room:'bureau'}]}},
  ];
  const events=summarizeActions(entries);
  assert.deepEqual(events.map(e=>e.type),['bonus','evidence','revelation','garden_open','evidence','move'],'every real transition (a new bonus draw, growing evidence, the exact revelation turn, the garden opening, and a real room change) must be reported exactly once, in the order it actually happened, never duplicated or missed');
  assert.equal(events.find(e=>e.type==='move').detail,'acteur 1 : salon → cuisine','a room change must report the real previous and new room for the real actor, never a generic or wrong one');
  assert.deepEqual(summarizeActions([{label:'r1',response:{story:{round:1,life:{bonusLog:[{bonus:'food'}]},evidence:[]}}}]).map(e=>e.type),['bonus'],'an entry with no decisions array must never crash the extraction');
  assert.deepEqual(summarizeActions([]),[],'an empty log must report zero events, never throw');
  const summary=formatSummary(events,{lastRound:2,dossierFound:true});
  assert.ok(summary.includes('Round final observé : 2')&&summary.includes('Dossier retourné rempli : oui'),'the formatted summary must state the real last round and real dossier status, never a placeholder');
  assert.ok(formatSummary([],{}).includes('Round final observé : ?'),'a genuinely unknown round must be shown as an honest "?", never a fabricated number');
  console.log('Passed: the simulation-log summarizer correctly falls back to parsing the round number from the request label for the oldest logs (a real bug found and fixed while archiving full_sim/2/3), reports every real bonus draw/evidence growth/revelation turn/garden opening/room change exactly once in order with the real actors and rooms involved, never crashes on a missing decisions array or an empty log, and always states an honest "?" rather than a fabricated round or status when the data genuinely does not say.');
}

{
  // Mutualisation d'un utilitaire (2026-09-19, cf. docs/regles-de-travail.md §7ter) : le même petit
  // assistant shell était réécrit à l'identique dans trois scripts, extrait ici dans lib-shell.mjs.
  const {sh}=await import('../scripts/lib-shell.mjs');
  assert.equal(sh('echo bonjour').trim(),'bonjour','a successful command must return its real stdout');
  assert.equal(sh('exit 1'),'','a failing command must never throw, and defaults to empty output rather than a fake success');
  assert.ok(sh('node -e "process.stderr.write(1); process.exit(1)"',{verbose:true}).includes('[erreur:'),'verbose mode must surface the real error detail for tools that report it (HYPER-SCAN-CHECKPOINT), never silently swallow it');
  assert.ok(!sh('exit 1',{verbose:false}).includes('[erreur:'),'non-verbose mode (the default, used by ALWAYS-NEW-CODE/CHECK-LEVEL-TARGET) must stay exactly as quiet as their original local copies were, never suddenly noisier');
  console.log('Passed: the shared shell helper (extracted from three duplicated copies) returns real stdout on success, never throws on a failing command, and only surfaces the verbose error detail when explicitly asked — preserving each of its three original call sites\' exact prior behavior.');
}

{
  // ALWAYS-NEW-CODE (2026-09-19, cf. docs/always-new-code-blueprint.md et
  // docs/referentiel/always-new-code.md). Rend concret l'Article 7 (page blanche) : dette
  // d'organisation, distincte des absences (ARGUS) et frictions (HARMONIA).
  const {THEMES,parseCoverage,recommendZone,countDatedAddenda,addendaSignal,parseNumstat,churnSignal,alwaysNewCodePerformance}=await import('../scripts/always-new-code.mjs');
  assert.equal(THEMES.length,8,'must reuse the exact 8 HARMONIA grand-theme zones, never a second invented split of the project');
  const idx=[
    '| Date | Zone examinée | Trouvailles confirmées | Rapport | Notes |',
    '|---|---|---|---|---|',
    '| 2026-09-10 | Fatigue | 2 | x.txt | - |',
    '| 2026-09-15 | Fatigue | 1 | y.txt | - |',
  ].join('\n');
  assert.equal(parseCoverage(idx).Fatigue,'2026-09-15','coverage must keep the MOST RECENT pass date per zone, never the first row found');
  assert.equal(parseCoverage(idx)['Cycle jour/nuit'],undefined,'a zone never examined must be an honest absence, never a fabricated date');
  const neverSeen=recommendZone(THEMES,{},undefined,new Date('2026-09-19'));
  assert.equal(neverSeen.source,'rotation');
  assert.equal(neverSeen.daysSinceLastPass,undefined,'a zone with zero history must report an honest absence of age, never a fake Infinity-derived number');
  const neverSeenBeatsOld=recommendZone(THEMES,Object.fromEntries(THEMES.filter(t=>t!=='Enquête').map(t=>[t,'2026-01-01'])),undefined,new Date('2026-09-19'));
  assert.equal(neverSeenBeatsOld.zone,'Enquête','a never-examined zone must always outrank every already-dated zone, however old that date is');
  const fullyCovered=Object.fromEntries(THEMES.map((t,i)=>[t,`2026-09-${String(10+i).padStart(2,'0')}`]));
  const rotated=recommendZone(THEMES,fullyCovered,undefined,new Date('2026-09-19'));
  assert.equal(rotated.zone,'Fatigue','once every zone has a date, rotation must propose the OLDEST one first, never an arbitrary or alphabetical one');
  const explicit=recommendZone(THEMES,{},'fatigue');
  assert.equal(explicit.zone,'Fatigue');
  assert.equal(explicit.source,'demande explicite','an explicit request for a known zone must always override the rotation, case-insensitively');
  const ambiguous=recommendZone(THEMES,{},'un thème qui n\'existe pas');
  assert.equal(ambiguous.ambiguous,true,'a requested zone matching no known theme must be flagged ambiguous for the agent to ask back, never silently accepted or silently ignored');
  assert.equal(addendaSignal(countDatedAddenda('Rien de spécial ici.')),undefined,'below-threshold addenda count must never be promoted to a stacking signal');
  assert.equal(addendaSignal(countDatedAddenda('Ajouté le 2026-09-16. Ajouté le 2026-09-16. Ajouté le 2026-09-17. Ajouté le 2026-09-17. Ajouté le 2026-09-18. Ajouté le 2026-09-19.')),'probable','six or more dated addenda on the same rule must be flagged as a probable stacking indicator');
  assert.equal(parseNumstat(''),undefined,'a file with zero git history must be an honest absence, never a fake zero-growth signal');
  const pureGrowth=parseNumstat('5\t0\tlib/x.ts\n3\t0\tlib/x.ts\n10\t0\tlib/x.ts\n2\t0\tlib/x.ts\n1\t0\tlib/x.ts\n');
  assert.equal(churnSignal(pureGrowth),'probable','a file with 5+ commits and literally zero deletions ever must be flagged as probable pure accretion');
  assert.equal(churnSignal(undefined),undefined,'missing stats must never be silently treated as a zero-signal verdict');
  assert.equal(alwaysNewCodePerformance('| Date | Zone examinée | Trouvailles confirmées | Rapport | Notes |\n|---|---|---|---|---|'),undefined,'zero recorded passes must report an honest absence, never a fake 0%, same discipline as the HYPER-SCAN-CHECKPOINT KPI');
  const perfIdx=[
    '| Date | Zone examinée | Trouvailles confirmées | Rapport | Notes |','|---|---|---|---|---|',
    '| 2026-09-19 | Fatigue | 3 | a.txt | - |','| 2026-09-19 | Enquête | 1 | b.txt | - |',
  ].join('\n');
  assert.deepEqual(alwaysNewCodePerformance(perfIdx),{passages:2,totalFindings:4,findingsPerPassage:2},'the KPI must compute the exact real average of confirmed findings per pass, tracked from day one per the explicit user decision');
  console.log('Passed: ALWAYS-NEW-CODE reuses the exact 8 HARMONIA zones, its coverage memory keeps the most recent pass per zone and reports an honest absence for a never-seen zone, its rotation always proposes the most-neglected zone first while an explicit valid request always overrides it and an unknown requested zone is flagged ambiguous for the agent to ask back rather than silently accepted or ignored, its mechanical stacking signals (dated-addenda count, git-history pure-growth pattern) only ever reach "probable" and report an honest absence rather than a fake zero-signal on missing data, and its from-day-one KPI computes the exact real findings-per-pass average.');
}

{
  // AXA-CHECK (2026-09-19, cf. docs/axa-check-blueprint.md et docs/referentiel/axa-check.md). Né
  // d'une question directe de l'utilisateur : « comment sait-on si une zone du code est couverte
  // ou pas par un test ? ». Toutes les fixtures sont des relevés V8 miniatures écrits à la main,
  // jamais une vraie exécution de check-house.mjs dans ce test (qui varierait dans le temps).
  const {functionCoverageFromV8,robustnessScore,fragileFunctions,corroboratedByArchivedSimulations,collectCoverage,LIB_MAP}=await import('../scripts/axa-check.mjs');
  const src='function a(){}\nfunction b(){}\n';
  const covEntry={functions:[
    {functionName:'',ranges:[{startOffset:0,count:5}]}, // pseudo-appel "script entier" V8, toujours exclu
    {functionName:'a',ranges:[{startOffset:0,count:1}]},
    {functionName:'b',ranges:[{startOffset:src.indexOf('function b'),count:0}]},
  ]};
  const functions=functionCoverageFromV8(covEntry,src);
  assert.equal(functions.length,2,'the empty-name pseudo-entry (V8\'s whole-script pseudo-function) must never be reported as a real function');
  assert.deepEqual(functions.map(f=>f.name),['a','b']);
  assert.equal(functions.find(f=>f.name==='a').covered,true,'a function with a non-zero execution count must be reported covered');
  assert.equal(functions.find(f=>f.name==='b').covered,false,'a function with a zero execution count must be reported uncovered, never a false positive');
  assert.equal(functions.find(f=>f.name==='b').line,2,'the byte offset must map back to the real 1-indexed source line, not the raw offset');
  assert.equal(robustnessScore(functions),50,'exactly one of two functions covered must report 50%, not a rounded or fudged number');
  assert.equal(robustnessScore([]),undefined,'a file with zero real functions must report an honest N/A, never a fake 0% or 100%');
  assert.equal(robustnessScore(undefined),undefined);
  // Fragilité enrichie (décision explicite : jamais un simple miroir de la robustesse) : une
  // fonction non couverte gagne en confiance quand elle est proche d'un nœud sensible HARMONIA
  // et/ou porte un signal de churn — jamais les deux mêmes raisons pour deux fichiers différents.
  const plainFragile=fragileFunctions(functions,'lib/nowhere-sensitive.ts',[],undefined);
  assert.equal(plainFragile.length,1,'only the uncovered function must be reported, never the covered one');
  assert.equal(plainFragile[0].confidence,'à surveiller','with no sensitive-node match and no churn signal, confidence must stay the lowest tier, never inflated');
  const sensitiveNodes=[{node:'Sommeil',files:['lib/sensitive.ts']}];
  const nearSensitive=fragileFunctions(functions,'lib/sensitive.ts',sensitiveNodes,undefined);
  assert.equal(nearSensitive[0].confidence,'probable','proximity to a real HARMONIA sensitive node must raise confidence, the whole point of the enrichment over a plain coverage mirror');
  assert.ok(nearSensitive[0].reasons.some(r=>r.includes('Sommeil')),'the specific matched sensitive node must be named in the reasons, never a generic flag');
  const churnedFile=fragileFunctions(functions,'lib/nowhere-sensitive.ts',[],{commits:5,insertions:12,deletions:0});
  assert.equal(churnedFile[0].confidence,'probable','a genuine pure-accretion churn signal must also raise confidence on its own, independent of any sensitive-node match');
  // Corroboration par simulation archivée (niveau ZONE, jamais fonction — limite honnête assumée).
  const bonusSim='  [round 3] bonus — food\n  [round 4] move\n';
  const noBonusSim='  [round 1] evidence — indice A\n';
  assert.equal(corroboratedByArchivedSimulations('Bonus roulette',[bonusSim,noBonusSim]),1,'only the archived simulation whose real event log actually shows this zone\'s marker must be counted, never both just because two files exist');
  assert.equal(corroboratedByArchivedSimulations('Bonus roulette',[]),undefined,'zero archived simulations must be an honest absence, never a fake zero-confidence verdict');
  assert.equal(corroboratedByArchivedSimulations('Zone inconnue',[bonusSim]),undefined,'a zone with no configured event hint must never silently report zero — it must say it cannot corroborate at all');
  // collectCoverage() : lit un dossier NODE_V8_COVERAGE déjà produit (par AXA-CHECK ou par
  // kpi-report.mjs réutilisant son propre lancement de check-house.mjs, jamais un second) et mappe
  // vers le vrai fichier source via LIB_MAP — testé avec un readDir/readFile injectés, jamais un
  // vrai relevé V8 réel (non déterministe), mais contre le vrai fichier lib/house.ts pour prouver
  // que le mapping et la lecture de la vraie source fonctionnent de bout en bout.
  assert.ok(LIB_MAP['test-house.mjs']==='lib/house.ts'&&LIB_MAP['test-route.mjs']==='app/api/lia/route.ts','the file map must cover both a plain lib/*.ts module and the special-cased app/api/lia/route.ts entry');
  const fixtureCovDir='.sites-runtime/axa-check-fixture-cov';
  fs.mkdirSync(fixtureCovDir,{recursive:true});
  const fakeCovJson=JSON.stringify({result:[{url:'file:///whatever/.sites-runtime/test-house.mjs',functions:[{functionName:'fixtureFn',ranges:[{startOffset:0,count:1}]}]}]});
  const perFile=collectCoverage(fixtureCovDir,{readDir:()=>['proc-1.json','proc-2.json'],readFile:()=>fakeCovJson});
  assert.ok(Array.isArray(perFile['lib/house.ts']),'a coverage entry whose URL matches a known LIB_MAP key must be mapped to its real source file, read from the real project source');
  assert.equal(perFile['lib/house.ts'].length,1,'the second process\'s identical coverage entry for the same file must be deduped, never double-counted');
  assert.deepEqual(collectCoverage('.sites-runtime/axa-check-nonexistent-dir'),{},'a coverage directory that was never produced must report an honest empty result, never crash the caller');
  fs.rmSync(fixtureCovDir,{recursive:true,force:true});
  console.log("Passed: AXA-CHECK's function-level V8 coverage extraction correctly excludes the whole-script pseudo-entry, maps byte offsets back to real 1-indexed source lines, and tells a covered function from an uncovered one exactly; its robustness score is an honest percentage or an honest N/A on zero functions, never a fake number; its fragility enrichment only raises confidence above the baseline tier when a real HARMONIA sensitive-node match or a real churn signal is present, always naming the specific reason rather than a generic flag; its archived-simulation corroboration counts only genuine zone-marker matches and reports an honest absence rather than a fake zero when no simulations or no configured hint exist; and its coverage collector correctly maps a V8 URL to the real project source via LIB_MAP, dedupes repeated entries across multiple process coverage files, and reports an honest empty result for a directory that was never produced.");
}

{
  // LE-COORDINATEUR (2026-09-19, nommé et calibré par l'utilisateur). Volontairement mince : les
  // fonctions pures testées ici sont ses seules responsabilités propres (détection de doublon,
  // mise en forme du tableau, lecture d'état injectable) — tout le reste est de l'import direct de
  // fonctions déjà testées ailleurs (ARGUS, HARMONIA, AXA-CHECK, ALWAYS-NEW-CODE, CHECK-LEVEL-TARGET),
  // jamais retesté ici en double (règle anti-doublon, §7ter).
  const {isDuplicateRun,formatTable,loadState,classifyRequest}=await import('../scripts/le-coordinateur.mjs');
  assert.equal(isDuplicateRun({lastHead:'abc123'},'abc123'),true,'the exact same commit as the last recorded run must be reported as a real duplicate');
  assert.equal(isDuplicateRun({lastHead:'abc123'},'def456'),false,'a genuinely different HEAD commit must never be flagged as a duplicate, however recently the last run happened');
  assert.equal(isDuplicateRun({},'abc123'),false,'a never-before-recorded state must never be treated as a duplicate of nothing');
  assert.equal(isDuplicateRun({lastHead:'abc123'},undefined),false,'an unreadable current commit must never be silently treated as matching a past one');
  const table=formatTable([{name:'Outil A',result:'ok',when:'2026-09-19T00:00:00.000Z'},{name:'Outil B',result:'à regarder (1)',when:'2026-09-19T00:00:00.000Z'}]);
  assert.ok(table.includes('| Outil A | ok |')&&table.includes('| Outil B | à regarder (1) |'),'every row passed in must appear in the rendered table with its real name and result, never dropped or reordered');
  assert.deepEqual(loadState(()=>{throw new Error('no state file yet')}),{},'a missing or unreadable state file must report an honest empty state, never crash the caller — this is the tool\'s very first run on a fresh checkout');
  assert.deepEqual(loadState(()=>'{"lastHead":"abc123","lastWhen":"x"}'),{lastHead:'abc123',lastWhen:'x'},'a well-formed state file must be parsed and returned exactly as stored');
  // classifyRequest() est un pur passthrough vers check-level-target.mjs — un seul appel suffit à
  // prouver le câblage réel (accès "privilégié" direct demandé explicitement), jamais un doublon de
  // la suite de tests déjà dédiée à CHECK-LEVEL-TARGET lui-même.
  assert.equal(classifyRequest('corrige cette faute de frappe').level,'leger','the passthrough must genuinely reach the real classifyCheckLevel logic, not a stub — a trivial fix must classify exactly as CHECK-LEVEL-TARGET\'s own test suite already proves it does directly');
  console.log('Passed: LE-COORDINATEUR flags a duplicate run only when the current commit exactly matches the last recorded one (never a stale time-window guess), renders every real row of its summary table without dropping or reordering any, reports an honest empty state rather than crashing on a missing or malformed state file, and its CHECK-LEVEL-TARGET passthrough genuinely reaches the real classification logic rather than a disconnected stub.');
}

{
  // Garde-fou du système de profil utilisateur (2026-09-19, cf. docs/profil-utilisateur/index.md).
  // Une fiche jamais indexée serait invisible pour un futur agent qui ne lirait que l'index ; un
  // lien mort pointerait vers une preuve disparue — les deux écarts doivent être signalés séparément.
  const {extractLinkedFiles,findOrphanedObservations}=await import('../scripts/check-profil-utilisateur.mjs');
  const idx='| Horodatage | Fiche |\n|---|---|\n| x | [x](observations/2026-09-19-2019.md) |\n| y | [y](observations/2026-09-20-0900.md) |';
  assert.deepEqual(extractLinkedFiles(idx),['2026-09-19-2019.md','2026-09-20-0900.md'],'every markdown link to an observation file must be extracted, in the order the table lists them');
  assert.deepEqual(extractLinkedFiles('| Horodatage | Fiche |\n|---|---|'),[],'an index with no rows yet must report zero links, never crash');
  const onDiskOnly=findOrphanedObservations(idx,['2026-09-19-2019.md','2026-09-20-0900.md','2026-09-21-1000.md']);
  assert.deepEqual(onDiskOnly.missingFromIndex,['2026-09-21-1000.md'],'a real file on disk with no matching link in the index must be flagged as never indexed, closing the exact blind spot this guard exists to catch');
  assert.deepEqual(onDiskOnly.missingFromDisk,[],'files that are both on disk and linked must never be flagged');
  const deadLinkOnly=findOrphanedObservations(idx,['2026-09-19-2019.md']);
  assert.deepEqual(deadLinkOnly.missingFromDisk,['2026-09-20-0900.md'],'a link in the index pointing at a file that no longer exists on disk must be flagged as a dead link, a different problem from an unindexed file');
  assert.deepEqual(deadLinkOnly.missingFromIndex,[],'a file correctly indexed must never also be flagged as unindexed');
  console.log('Passed: the user-profile system\'s mechanical guard extracts every real observation link from the index in order, and correctly tells apart the two distinct failure modes it exists to catch — a real observation file never referenced by the index, and an index link pointing at a file that no longer exists — never confusing or merging the two.');
}

{
  // CLEAN-DIRTY-OLD (2026-09-19, cf. docs/clean-dirty-old-blueprint.md et
  // docs/referentiel/clean-dirty-old.md). Repère seul, ne juge jamais — les trois vraies questions
  // (encore utile ? à jour ? profiterait d'une refonte ?) restent déléguées à ARGUS/HARMONIA/
  // ALWAYS-NEW-CODE, jamais réimplémentées ici.
  const {relativeStaleness,prioritizeStaleFiles,delegationQuestions,cleanDirtyOldPerformance}=await import('../scripts/clean-dirty-old.mjs');
  const staleness=relativeStaleness({'lib/a.ts':10,'lib/b.ts':12,'lib/c.ts':400,'lib/d.ts':undefined});
  assert.equal(staleness['lib/c.ts'].stale,true,'a file untouched for 400 days while its peers sit around 10-12 must be flagged stale — both far above the absolute floor and far above the relative median');
  assert.equal(staleness['lib/a.ts'].stale,false,'a file close to the median must never be flagged, however the absolute threshold alone might suggest otherwise');
  assert.equal(staleness['lib/d.ts'].stale,false,'a file with no git history at all (never committed alone, or history unavailable) must report an honest non-stale rather than guessing');
  assert.deepEqual(relativeStaleness({'lib/x.ts':500}),{'lib/x.ts':{days:500,stale:false,ratioToMedian:undefined}},'a single file with no peer to compare against must never compute a fabricated relative signal, even if it looks old in isolation');
  assert.deepEqual(relativeStaleness({'lib/x.ts':5,'lib/y.ts':6}),{'lib/x.ts':{days:5,stale:false,ratioToMedian:5/5.5,medianDays:5.5},'lib/y.ts':{days:6,stale:false,ratioToMedian:6/5.5,medianDays:5.5}},'two young, close-in-age files must never be flagged just because a ratio exists — the absolute floor (30 days) still applies');
  const entries=[{file:'lib/normal.ts',days:200},{file:'lib/sensitive.ts',days:100}];
  const sensitiveNodes=[{node:'Sommeil',files:['lib/sensitive.ts']}];
  const prioritized=prioritizeStaleFiles(entries,sensitiveNodes);
  assert.equal(prioritized[0].file,'lib/sensitive.ts','proximity to a real sensitive node must outrank pure age, per the explicit 2026-09-19 calibration — a younger but sensitive file goes first');
  const tiePrioritized=prioritizeStaleFiles([{file:'lib/older.ts',days:300},{file:'lib/younger.ts',days:100}],[]);
  assert.equal(tiePrioritized[0].file,'lib/older.ts','with no sensitive-node match on either side, the older file must still come first, never an arbitrary or input order');
  const questions=delegationQuestions('lib/nowhere.ts');
  assert.equal(questions.length,3,'exactly the three delegated questions (still useful/ARGUS, still in sync/HARMONIA, would benefit from a rebuild/ALWAYS-NEW-CODE) must be produced, CLEAN-DIRTY-OLD never answering any of them itself');
  assert.ok(questions.every(q=>/ARGUS|HARMONIA|ALWAYS-NEW-CODE/.test(q)),'every delegated question must explicitly name the real tool that owns the answer, never a vague pointer');
  assert.equal(cleanDirtyOldPerformance('| Date | Zone signalée | Trouvailles confirmées | Rapport | Notes |\n|---|---|---|---|---|'),undefined,'zero recorded passes must report an honest absence, never a fake 0%, same discipline as ALWAYS-NEW-CODE/HYPER-SCAN-CHECKPOINT');
  const perfIdx='| Date | Zone signalée | Trouvailles confirmées | Rapport | Notes |\n|---|---|---|---|---|\n| 2026-09-19 | lib/x.ts | 2 | a.txt | - |\n| 2026-09-19 | lib/y.ts | 0 | b.txt | - |';
  assert.deepEqual(cleanDirtyOldPerformance(perfIdx),{passages:2,totalFindings:2,findingsPerPassage:1},'the from-day-one KPI must compute the exact real average of confirmed findings per pass, reusing the same shared table-parsing logic as ALWAYS-NEW-CODE rather than a second reimplementation');
  console.log('Passed: CLEAN-DIRTY-OLD flags a file as stale only when it is both far above the absolute floor and far above the relative median of its real peers (never a fixed date threshold, never a fabricated signal from a single file with no peer to compare against), always prioritizes proximity to a real HARMONIA sensitive node over pure age per the explicit calibration, produces exactly its three delegated questions each naming the real tool that owns the answer without ever answering any of them itself, and its from-day-one KPI reports an honest absence on zero passes and the exact real average otherwise, reusing the shared markdown-table helper rather than reimplementing ALWAYS-NEW-CODE\'s parsing a second time.');
}
