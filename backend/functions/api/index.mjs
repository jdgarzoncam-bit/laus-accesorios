import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
const authBase = process.env.NEON_AUTH_BASE_URL;
const corsOrigin = (origin) => {
  if (!origin) return "https://github.com";
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return process.env.APP_ORIGIN === origin ? origin : "";
};
function json(data,status=200,headers={}) { return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}}); }
async function sessionFrom(request) {
  if (!authBase) return null;
  const cookie=request.headers.get("cookie");
  if (!cookie) return null;
  const response=await fetch(authBase.replace(/\/$/,"")+"/get-session",{headers:{cookie,origin:request.headers.get("origin")||""}});
  if (!response.ok) return null;
  const body=await response.json().catch(()=>null);
  return body?.user?.id ? body : null;
}
async function requireAdmin(request) {
  const session=await sessionFrom(request);
  if (!session) return {error:json({error:"unauthorized"},401)};
  const {rows}=await pool.query('SELECT role, display_name FROM public.admin_profiles WHERE user_id=$1 LIMIT 1',[session.user.id]);
  if (!rows.length) return {error:json({error:"forbidden"},403)};
  return {user:session.user,profile:rows[0]};
}
const allowedEvents=new Set(["store_visit","product_view","search","add_to_cart","whatsapp_click","pdf_download"]);
export default { async fetch(request) {
  const origin=request.headers.get("origin")||"";
  const allow=corsOrigin(origin);
  if (request.method==="OPTIONS") return new Response(null,{status:204,headers:{"access-control-allow-origin":allow||"null","access-control-allow-credentials":"true","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type","vary":"Origin"}});
  const headers={"access-control-allow-origin":allow||"null","access-control-allow-credentials":"true","vary":"Origin"};
  if (origin && !allow) return json({error:"origin_not_allowed"},403,headers);
  const url=new URL(request.url), path=url.pathname.replace(/\/$/,"");
  try {
    if (path==="/api/health" && request.method==="GET") return json({ok:true,service:"laus-api",branch:process.env.NEON_BRANCH||"unknown"},200,headers);
    if (path==="/api/events" && request.method==="POST") {
      const body=await request.json();
      if (!allowedEvents.has(body.event_type)) return json({error:"invalid_event_type"},400,headers);
      const sessionKey=String(body.session_key||"").slice(0,100);
      if (!sessionKey) return json({error:"session_key_required"},400,headers);
      const productId=body.product_id||null, categoryId=body.category_id||null;
      const metadata=body.metadata&&typeof body.metadata==="object"?JSON.stringify(body.metadata):"{}";
      await pool.query("INSERT INTO public.catalog_events(event_type,product_id,category_id,session_key,metadata) VALUES($1,$2,$3,$4,$5::jsonb)",[body.event_type,productId,categoryId,sessionKey,metadata]);
      return json({ok:true},201,headers);
    }
    if (path==="/api/admin/session" && request.method==="GET") {
      const auth=await requireAdmin(request); if(auth.error)return auth.error;
      return json({authorized:true,user:{id:auth.user.id,name:auth.profile.display_name,role:auth.profile.role}},200,headers);
    }
    if (path==="/api/admin/metrics" && request.method==="GET") {
      const auth=await requireAdmin(request); if(auth.error)return auth.error;
      const days=Math.min(90,Math.max(1,Number(url.searchParams.get("days")||30)));
      const visitors=await pool.query("SELECT count(DISTINCT session_key)::int AS value FROM catalog_events WHERE event_type='store_visit' AND created_at>=now()-($1::int * interval '1 day')",[days]);
      const whatsapp=await pool.query("SELECT count(*)::int AS value FROM catalog_events WHERE event_type='whatsapp_click' AND created_at>=now()-($1::int * interval '1 day')",[days]);
      const product=await pool.query("SELECT p.id,p.name,p.reference,count(*)::int AS views FROM catalog_events e JOIN products p ON p.id=e.product_id WHERE e.event_type='product_view' AND e.created_at>=now()-($1::int * interval '1 day') GROUP BY p.id ORDER BY views DESC LIMIT 1",[days]);
      const category=await pool.query("SELECT c.id,c.name,count(*)::int AS views FROM catalog_events e JOIN categories c ON c.id=e.category_id WHERE e.event_type='product_view' AND e.created_at>=now()-($1::int * interval '1 day') GROUP BY c.id ORDER BY views DESC LIMIT 1",[days]);
      return json({days,visitors:visitors.rows[0].value,whatsapp_clicks:whatsapp.rows[0].value,top_product:product.rows[0]||null,top_category:category.rows[0]||null},200,headers);
    }
    if (path==="/api/admin/sales" && request.method==="GET") {
      const auth=await requireAdmin(request); if(auth.error)return auth.error;
      const result=await pool.query("SELECT id,sale_number,customer_name,channel,status,total_cop,notes,created_at FROM public.sales ORDER BY created_at DESC LIMIT 200");
      return json({sales:result.rows},200,headers);
    }
    if (path==="/api/admin/sales" && request.method==="POST") {
      const auth=await requireAdmin(request); if(auth.error)return auth.error;
      const body=await request.json(), total=Number(body.total_cop);
      if(!Number.isSafeInteger(total)||total<=0) return json({error:"invalid_total"},400,headers);
      const channel=["whatsapp","direct","other"].includes(body.channel)?body.channel:"other";
      const client=await pool.connect();
      try {
        await client.query("BEGIN");
        const inserted=await client.query("INSERT INTO public.sales(customer_name,channel,total_cop,notes,actor_user_id) VALUES($1,$2,$3,$4,$5) RETURNING id,sale_number,created_at",[String(body.customer_name||"").slice(0,160),channel,total,String(body.notes||"").slice(0,1000),auth.user.id]);
        const sale=inserted.rows[0];
        for(const item of (Array.isArray(body.items)?body.items:[]).slice(0,100)){
          const qty=Number(item.quantity), price=Number(item.unit_price_cop);
          if(!Number.isSafeInteger(qty)||qty<1||!Number.isSafeInteger(price)||price<0) throw new Error("invalid_sale_item");
          await client.query("INSERT INTO public.sale_items(sale_id,product_id,product_reference,product_name,quantity,unit_price_cop,line_total_cop) VALUES($1,$2,$3,$4,$5,$6,$7)",[sale.id,item.product_id||null,String(item.reference||"").slice(0,80),String(item.name||"").slice(0,180),qty,price,qty*price]);
        }
        await client.query("COMMIT");
        return json({sale},201,headers);
      } catch(error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
    }
    return json({error:"not_found"},404,headers);
  } catch(error) { console.error("laus-api",error); return json({error:"internal_error"},500,headers); }
} };
