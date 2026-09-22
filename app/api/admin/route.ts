import {referenceSections} from '@/lib/reference';
import {getGeminiKeyMetrics,getGeminiKeyEpisodes} from '@/lib/gemini-keys';
import {getQualityMetrics} from '@/lib/quality-metrics';
import {getContextWeightSamples} from '@/lib/memento-weight';
import {readWorld} from '@/lib/world';
import {env} from 'cloudflare:workers';
// geminiKeyMetrics/qualityMetrics (2026-09-19, demande explicite de l'utilisateur : KPI du
// tableau de bord, prêts pour la prochaine simulation) : compteurs bruts en mémoire process,
// jamais en base — remis à zéro à chaque redémarrage du serveur, ce qui correspond exactement à
// "un rapport par simulation" puisqu'une simulation complète tourne toujours sur un serveur
// fraîchement relancé (Article 18 de CLAUDE.md). Même accès admin déjà existant, rien de nouveau
// à protéger.
// geminiKeyEpisodes (2026-09-20, tâche #88 : « persister le vrai trafic Gemini dans l'historique
// partagé ») : le trafic RÉEL de cette session, par EMPREINTE de clé (jamais la clé en clair) et par
// modèle — destiné à `kpi-report.mjs`, qui le persiste dans `.gemini-key-health.json` via
// `scripts/gemini-key-health.mjs`, pour que l'expérience accumulée du Smart Breaker/Smart Conso API
// reflète aussi les vraies sessions de jeu, pas seulement les sondages manuels de diagnostic.
// replayabilityMetrics (famille "Rejouabilité") : lu depuis l'état de jeu réel (bonusLog, plafonné
// aux 12 derniers tirages — cf. app/api/lia/route.ts), jamais un nouveau compteur créé pour
// l'occasion. Signal de diversité RÉCENTE, pas garanti sur toute la session si plus de 12 tirages
// ont eu lieu — limite honnête documentée dans docs/referentiel/tableau-de-bord.md plutôt que
// masquée.
export async function POST(request:Request){if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Origine non autorisée'},{status:403});try{const body=await request.text();if(body.length>100)throw new Error();const demande=JSON.parse(body) as {code?:string;history?:boolean};if(demande.code!=='1980')return Response.json({error:'Code incorrect'},{status:403});if(demande.history){const {referenceHistory}=await import('@/lib/reference-history');return Response.json({sections:referenceHistory},{headers:{'Cache-Control':'no-store'}});}let replayabilityMetrics:{distinctBonuses:number;totalBonusTypes:number}|undefined;try{if(env.DB){const {story}=await readWorld(env.DB);const bonusLog=story?.life.bonusLog;if(bonusLog)replayabilityMetrics={distinctBonuses:new Set(bonusLog.map(b=>b.bonus)).size,totalBonusTypes:9};}}catch{}return Response.json({sections:referenceSections,geminiKeyMetrics:getGeminiKeyMetrics(),geminiKeyEpisodes:getGeminiKeyEpisodes(),qualityMetrics:getQualityMetrics(),contextWeightSamples:getContextWeightSamples(),replayabilityMetrics},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Code invalide'},{status:400});}}
