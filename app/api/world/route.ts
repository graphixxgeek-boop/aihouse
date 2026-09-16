import {presentationVersion} from "@/lib/presentation-version";
import { env } from "cloudflare:workers";
import { initialize, readWorld } from "@/lib/world";
export async function GET(request:Request) {
  try {
    if (!env.DB) throw new Error("database");
    const before=Number(new URL(request.url).searchParams.get("before"));
    if(Number.isInteger(before)&&before>0){const result=await env.DB.prepare("SELECT id,speaker,content,room,created_at FROM conversations WHERE id<? ORDER BY id DESC LIMIT 50").bind(before).all();return Response.json({messages:result.results.reverse()},{headers:{"Cache-Control":"no-store"}});}
    await initialize(env.DB);
    return Response.json({...await readWorld(env.DB),presentationVersion}, {headers:{"Cache-Control":"no-store"}});
  } catch { return Response.json({error:"La mémoire de la maison est momentanément indisponible."},{status:503}); }
}
