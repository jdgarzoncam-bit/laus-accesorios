import { createClient } from "https://esm.sh/@neon/neon-js@latest";
const config=window.LAUS_CONFIG||{};
if(!config.dataApiUrl||!config.authUrl) throw new Error("Falta la configuración de Neon para LAUS.");
const client=createClient({auth:{url:config.authUrl},dataApi:{url:config.dataApiUrl}});
window.LAUS_NEON=client;
window.LAUS_NEON_READY=Promise.resolve(client);
window.LAUS_DATA_API_URL=config.dataApiUrl;
