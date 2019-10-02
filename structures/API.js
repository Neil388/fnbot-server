const fetch = require("node-fetch");

const { ReadConfig } = require("./API/readHotfix.js");

const ENDPOINTS = {
    fortnite: {
        server_status: "https://lightswitch-public-service-prod06.ol.epicgames.com/lightswitch/api/service/bulk/status?serviceId=Fortnite",
        cloudstorage: "https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/cloudstorage/system",
        oauth: "https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token"
    },
    benbot: {
        aes: "http://benbotfn.tk:8080/api/aes",
    },
};

const cache = {
    access_token: undefined,
    expiresAt: undefined,
};
const build = global.build || { fortnite: { UserAgent: "Fortnite/++Fortnite+Release-10.40-CL-8970213 Windows/10.0.17134.1.768.64bit" }};

async function refreshToken() {
    if (cache.access_token && new Date(cache.expiresAt) > new Date()) return cache.access_token;
    const login = await fetch(ENDPOINTS.fortnite.oauth, { method: "POST", body: "grant_type=client_credentials&token_type=eg1", headers: { "User-Agent": build.fortnite.UserAgent, "Content-Type" : "application/x-www-form-urlencoded", "Authorization" : "basic MzQ0NmNkNzI2OTRjNGE0NDg1ZDgxYjc3YWRiYjIxNDE6OTIwOWQ0YTVlMjVhNDU3ZmI5YjA3NDg5ZDMxM2I0MWE=" } }).then(res => res.json());
    cache.access_token = login.token_type + " " + login.access_token;
    cache.expiresAt = login.expires_at;
    return login.token_type + " " + login.access_token;
};

class API {
    static getFortniteServerStatus() {
        return new Promise((resolve, reject) => {
            fetch(ENDPOINTS.fortnite.server_status).then(res => res.json()).catch(err => {
                return resolve({
                    online: false
                })
            }).then(res => {
                if (!res || !res[0] || !res[0].serviceInstanceId || res[0].serviceInstanceId !== "fortnite") return resolve({
                    online: false
                });
                if (res[0].banned) return resolve({
                    online: false,
                    banned: true
                });
                if (res[0].status == "UP") return resolve({
                    online: true
                });
                return resolve({
                    online: false
                });
            });
        });
    };
    static getEncryptionKeys(aes) {
        return new Promise((resolve, reject) => {
            fetch(ENDPOINTS.benbot.aes).then(res => res.json()).catch(err => {
                    if (aes) {
                        console.log("[Warning] Could not fetch AES encryption keys from " + ENDPOINTS.benbot.aes + ". Using the key you've provided in your config.");
                        return resolve({ mainKey: aes });
                    };
                    return resolve(null);
                })
                .then(res => {
                    return resolve(res);
                });
        });
    };
    static async getHotfix() {
        const token = await refreshToken();
        const cloudstorage = await fetch(ENDPOINTS.fortnite.cloudstorage, { headers: { "User-Agent": build.fortnite.UserAgent, Authorization: token }}).then(res => res.json());
        if (!cloudstorage || !cloudstorage[0]) return [];
        if (!cloudstorage.filter(file => file.filename.toLowerCase() == "defaultgame.ini")[0]) return [];
        const hotfix_uri = ENDPOINTS.fortnite.cloudstorage + "/" + cloudstorage.filter(file => file.filename.toLowerCase() == "defaultgame.ini")[0].uniqueFilename;
        const hotfix = await fetch(hotfix_uri, { headers: { "User-Agent": build.fortnite.UserAgent, Authorization: token }}).then(res => res.text());
        if (!hotfix) return [];
        return hotfix.split("\n").filter(v => v.startsWith("+TextReplacements")).map(v => v.slice(18)).map(v => ReadConfig({str: v}));
    };
    static async getShop() {
        const token = await refreshToken();
        const shop = await fetch("https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/storefront/v2/catalog", { headers: { "User-Agent": build.fortnite.UserAgent, Authorization: token }}).then(res => res.json());
        return shop;
    };
};

module.exports = API;