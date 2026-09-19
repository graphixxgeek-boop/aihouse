import {referenceSections} from '@/lib/reference';
import {getGeminiKeyMetrics} from '@/lib/gemini-keys';
// geminiKeyMetrics (2026-09-19, demande explicite de l'utilisateur : KPI d'efficacité du Smart
// Breaker, prêt pour la prochaine simulation) : compteurs bruts en mémoire process, jamais en
// base — remis à zéro à chaque redémarrage du serveur, ce qui correspond exactement à "un rapport
// par simulation" puisqu'une simulation complète tourne toujours sur un serveur fraîchement
// relancé (Article 18 de CLAUDE.md). Même accès admin déjà existant, rien de nouveau à protéger.
export async function POST(request:Request){if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Origine non autorisée'},{status:403});try{const body=await request.text();if(body.length>100)throw new Error();if(JSON.parse(body).code!=='1980')return Response.json({error:'Code incorrect'},{status:403});return Response.json({sections:referenceSections,geminiKeyMetrics:getGeminiKeyMetrics()},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Code invalide'},{status:400});}}
