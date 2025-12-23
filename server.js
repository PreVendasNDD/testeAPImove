// server.js
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const TOKEN_URL = "https://icomprova.nddcargo.com.br:9051/connect/token";
const API_BASE = "https://polaris-dev.nddcargo.com.br:9553/api";

const CLIENT_ID = "4a3a17846e714b3288682c5260455347";
const CLIENT_SECRET = "FFVkTyaM4zVsLYAhKpGIT57C72EzYPSOqFO+O/P9y0Y=";

let cachedToken = null;
let tokenExpiresAt = 0;

// ===== TOKEN =====
async function getToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) return cachedToken;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "client_credentials",
    scope: "i-comprova-entregas-integration-api"
  });

  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });

  if (!r.ok) throw new Error(await r.text());

  const d = await r.json();
  cachedToken = d.access_token;
  tokenExpiresAt = now + (d.expires_in - 60) * 1000;
  return cachedToken;
}

// ===== MDF-e =====
app.post("/mdfe", async (req, res) => {
  try {
    const token = await getToken();
    const r = await fetch(`${API_BASE}/recepcoes/mdfe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(req.body)
    });
    const t = await r.text();
    res.status(r.status).send(t);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ===== CT-e =====
app.post("/cte", async (req, res) => {
  try {
    const token = await getToken();
    const r = await fetch(`${API_BASE}/recepcoes/cte`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(req.body)
    });
    const t = await r.text();
    res.status(r.status).send(t);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.listen(3000, () => {
  console.log("PROXY RODANDO → http://localhost:3000");
});
