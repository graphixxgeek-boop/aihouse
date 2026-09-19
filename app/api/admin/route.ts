import {referenceSections} from '@/lib/reference';
import {getGeminiKeyMetrics} from '@/lib/gemini-keys';
import {getQualityMetrics} from '@/lib/quality-metrics';
import {readWorld} from '@/lib/world';
import {env} from 'cloudflare:workers';
// geminiKeyMetrics/qualityMetrics (2026-09-19, demande explicite de l'utilisateur : KPI du
// tableau de bord, prêts pour la prochaine simulation) : compteurs bruts en mémoire process,
// jamais en base — remis à zéro à chaque redémarrage du serveur, ce qui correspond exactement à
// "un rapport par simulation" puisqu'une simulation complète tourne toujours sur un serveur
// fraîchement relancé (Article 18 de CLAUDE.md). Même accès admin déjà existant, rien de nouveau
// à protéger.
// replayabilityMetrics (famille "Rejouabilité") : lu depuis l'état de jeu réel (bonusLog, plafonné
// aux 12 derniers tirages — cf. app/api/lia/route.ts), jamais un nouveau compteur créé pour
// l'occasion. Signal de diversité RÉCENTE, pas garanti sur toute la session si plus de 12 tirages
// ont eu lieu — limite honnête documentée dans docs/referentiel/tableau-de-bord.md plutôt que
// masquée.
export async function POST(request:Request){if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Origine non autorisée'},{status:403});try{const body=await request.text();if(body.length>100)throw new Error();if(JSON.parse(body).code!=='1980')return Response.json({error:'Code incorrect'},{status:403});let replayabilityMetrics:{distinctBonuses:number;totalBonusTypes:number}|undefined;try{if(env.DB){const {story}=await readWorld(env.DB);const bonusLog=story?.life.bonusLog;if(bonusLog)replayabilityMetrics={distinctBonuses:new Set(bonusLog.map(b=>b.bonus)).size,totalBonusTypes:9};}}catch{}return Response.json({sections:referenceSections,geminiKeyMetrics:getGeminiKeyMetrics(),qualityMetrics:getQualityMetrics(),replayabilityMetrics},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Code invalide'},{status:400});}}
