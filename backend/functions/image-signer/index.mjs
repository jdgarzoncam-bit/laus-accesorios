const cors={ "access-control-allow-origin":"*", "access-control-allow-methods":"POST, OPTIONS", "access-control-allow-headers":"authorization, content-type", "access-control-max-age":"600" };
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const enc=s=>new TextEncoder().encode(s);
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
async function sha(s){return hex(await crypto.subtle.digest("SHA-256",typeof s==="string"?enc(s):s))}
async function hmac(key,msg){return new Uint8Array(await crypto.subtle.sign("HMAC",await crypto.subtle.importKey("raw",key,{name:"HMAC",hash:"SHA-256"},false,["sign"]),enc(msg)))}
const handler={async fetch(request){
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(request.method!=="POST")return json({error:"method_not_allowed"},405);
 try{
  const auth=request.headers.get("authorization")||"";
  if(!auth.startsWith("Bearer "))return json({error:"unauthorized"},401);
  const body=await request.json(),productId=String(body.product_id||""),fileName=String(body.file_name||""),contentType=String(body.content_type||"").toLowerCase();
  if(!/^[0-9a-f-]{36}$/i.test(productId))return json({error:"invalid_product"},400);
  const allowed={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif"};
  if(!allowed[contentType]||Number(body.size||0)>8*1024*1024)return json({error:"invalid_image"},400);
  const api=process.env.LAUS_DATA_API_URL;
  const token=auth.slice(7),parts=token.split(".");if(parts.length!==3)return json({error:"invalid_session"},401);let claims;try{claims=JSON.parse(atob(parts[1].replace(/-/g,"+").replace(/_/g,"/")))}catch{return json({error:"invalid_session"},401)}if(!claims.sub)return json({error:"login_required"},401);
  // A valid session is not enough: only a user with a LAU'S admin profile may upload images.
  const adminCheck=await fetch(api+"/admin_profiles?select=user_id&user_id=eq."+encodeURIComponent(claims.sub)+"&limit=1",{headers:{authorization:auth,accept:"application/json"}});
  if(!adminCheck.ok)return json({error:"invalid_session"},401);
  const adminRows=await adminCheck.json();
  if(!Array.isArray(adminRows)||adminRows.length!==1)return json({error:"admin_required"},403);
  const product=await fetch(api+"/products?id=eq."+encodeURIComponent(productId)+"&select=id",{headers:{authorization:auth,accept:"application/json"}});
  const productRows=await product.json();if(!product.ok||!productRows?.length)return json({error:"product_not_found"},404);
  const bucket="laus-product-images",key="products/"+productId+"/"+crypto.randomUUID()+"."+allowed[contentType];
  const endpoint=new URL(process.env.AWS_ENDPOINT_URL_S3),region=process.env.AWS_REGION||"us-east-1",access=process.env.AWS_ACCESS_KEY_ID,secret=process.env.AWS_SECRET_ACCESS_KEY;
  if(!access||!secret)return json({error:"storage_not_configured"},503);
  const now=new Date(),amz=now.toISOString().replace(/[:-]|\\.\\d{3}/g,""),date=amz.slice(0,8),scope=date+"/"+region+"/s3/aws4_request",host=endpoint.host,path="/"+bucket+"/"+key.split("/").map(encodeURIComponent).join("/");
  const params={"X-Amz-Algorithm":"AWS4-HMAC-SHA256","X-Amz-Credential":access+"/"+scope,"X-Amz-Date":amz,"X-Amz-Expires":"300","X-Amz-SignedHeaders":"content-type;host"};
  const query=Object.entries(params).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>encodeURIComponent(k)+"="+encodeURIComponent(v)).join("&");
  const canonical="PUT\\n"+path+"\\n"+query+"\\ncontent-type:"+contentType+"\\nhost:"+host+"\\n\\ncontent-type;host\\nUNSIGNED-PAYLOAD";
  const stringToSign="AWS4-HMAC-SHA256\\n"+amz+"\\n"+scope+"\\n"+await sha(canonical);
  const kDate=await hmac(enc("AWS4"+secret),date),kRegion=await hmac(kDate,region),kService=await hmac(kRegion,"s3"),kSigning=await hmac(kService,"aws4_request"),signature=hex(await hmac(kSigning,stringToSign));
  return json({object_key:key,bucket_name:bucket,upload_url:endpoint.origin+path+"?"+query+"&X-Amz-Signature="+signature,method:"PUT",headers:{"Content-Type":contentType},expires_in:300});
 }catch(error){return json({error:"signing_failed",message:error.message},500)}
}};
export default handler;
