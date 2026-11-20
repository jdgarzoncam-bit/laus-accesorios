const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-max-age": "600"
};
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const enc = value => new TextEncoder().encode(value);
const hex = bytes => [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, "0")).join("");
const sha256 = async value => hex(await crypto.subtle.digest("SHA-256", typeof value === "string" ? enc(value) : value));
const hmac = async (key, value) => new Uint8Array(await crypto.subtle.sign(
  "HMAC",
  await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
  enc(value)
));
const awsEncode = value => encodeURIComponent(value).replace(/[!'()*]/g, char => "%" + char.charCodeAt(0).toString(16).toUpperCase());

async function signedUploadUrl(objectKey, contentType) {
  const endpointValue = process.env.AWS_ENDPOINT_URL_S3;
  const region = process.env.AWS_REGION || "us-east-1";
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!endpointValue || !accessKey || !secretKey) throw new Error("storage_credentials_unavailable");
  const bucket = "laus-product-images";
  const endpoint = new URL(endpointValue);
  const host = endpoint.host;
  const canonicalUri = "/" + bucket + "/" + objectKey.split("/").map(awsEncode).join("/");
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const scope = dateStamp + "/" + region + "/s3/aws4_request";
  const params = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": accessKey + "/" + scope,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": "300",
    "X-Amz-SignedHeaders": "content-type;host"
  };
  const canonicalQuery = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => awsEncode(key) + "=" + awsEncode(value))
    .join("&");
  const canonicalHeaders = "content-type:" + contentType + "\n" + "host:" + host + "\n";
  const canonicalRequest = ["PUT", canonicalUri, canonicalQuery, canonicalHeaders, "content-type;host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, await sha256(canonicalRequest)].join("\n");
  const dateKey = await hmac(enc("AWS4" + secretKey), dateStamp);
  const regionKey = await hmac(dateKey, region);
  const serviceKey = await hmac(regionKey, "s3");
  const signingKey = await hmac(serviceKey, "aws4_request");
  const signature = hex(await hmac(signingKey, stringToSign));
  return endpoint.origin + canonicalUri + "?" + canonicalQuery + "&X-Amz-Signature=" + signature;
}

const handler = {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    try {
      const authorization = request.headers.get("authorization") || "";
      if (!authorization.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

      let productId, contentType, file = null, size = 0;
      if ((request.headers.get("content-type") || "").includes("multipart/form-data")) {
        const form = await request.formData();
        productId = String(form.get("product_id") || "");
        file = form.get("file");
        if (!file || typeof file.arrayBuffer !== "function") return json({ error: "file_required" }, 400);
        contentType = String(file.type || "").toLowerCase();
        size = Number(file.size || 0);
      } else {
        const body = await request.json();
        productId = String(body.product_id || "");
        contentType = String(body.content_type || "").toLowerCase();
        size = Number(body.size || 0);
      }

      const allowed = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
      if (!/^[0-9a-f-]{36}$/i.test(productId)) return json({ error: "invalid_product" }, 400);
      if (!allowed[contentType] || !Number.isFinite(size) || size <= 0 || size > 8 * 1024 * 1024) {
        return json({ error: "invalid_image", message: "Usa JPG, PNG, WEBP o AVIF de hasta 8 MB." }, 400);
      }

      const api = process.env.LAUS_DATA_API_URL;
      if (!api) return json({ error: "data_api_not_configured" }, 503);
      const token = authorization.slice(7);
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) return json({ error: "invalid_session" }, 401);
      let claims;
      try {
        claims = JSON.parse(atob(tokenParts[1].replace(/-/g, "+").replace(/_/g, "/")));
      } catch {
        return json({ error: "invalid_session" }, 401);
      }
      if (!claims.sub) return json({ error: "login_required" }, 401);

      const adminResponse = await fetch(
        api + "/admin_profiles?select=user_id&user_id=eq." + encodeURIComponent(claims.sub) + "&limit=1",
        { headers: { authorization, accept: "application/json" } }
      );
      if (!adminResponse.ok) return json({ error: "admin_validation_failed", status: adminResponse.status }, 403);
      const adminRows = await adminResponse.json();
      if (!Array.isArray(adminRows) || adminRows.length !== 1) return json({ error: "admin_required" }, 403);

      const productResponse = await fetch(
        api + "/products?id=eq." + encodeURIComponent(productId) + "&select=id",
        { headers: { authorization, accept: "application/json" } }
      );
      const productRows = await productResponse.json();
      if (!productResponse.ok || !Array.isArray(productRows) || productRows.length !== 1) {
        return json({ error: "product_not_found" }, 404);
      }

      const bucket = "laus-product-images";
      const objectKey = "products/" + productId + "/" + crypto.randomUUID() + "." + allowed[contentType];
      const uploadUrl = await signedUploadUrl(objectKey, contentType);

      // Proxy the bytes through the authenticated Neon Function. This avoids browser-to-bucket CORS failures.
      if (file) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const upload = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: bytes
        });
        if (!upload.ok) {
          const detail = (await upload.text().catch(() => "")).slice(0, 300);
          return json({ error: "storage_upload_failed", status: upload.status, message: detail || "Object Storage rechazó la fotografía." }, 502);
        }
        return json({ bucket_name: bucket, object_key: objectKey, uploaded: true });
      }

      return json({
        object_key: objectKey,
        bucket_name: bucket,
        upload_url: uploadUrl,
        method: "PUT",
        headers: { "Content-Type": contentType },
        expires_in: 300
      });
    } catch (error) {
      return json({ error: "signing_failed", message: error?.message || "Error interno al cargar la fotografía." }, 500);
    }
  }
};
export default handler;
