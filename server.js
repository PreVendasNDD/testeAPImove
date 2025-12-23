const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

/* ================= CONFIG ================= */

const CLIENT_ID = "4a3a17846e714b3288682c5260455347";
const CLIENT_SECRET = "FFVkTyaM4zVsLYAhKpGIT57C72EzYPSOqFO+O/P9y0Y=";

const TOKEN_URL = "https://icomprova.nddcargo.com.br:9051/connect/token";
const API_BASE = "https://polaris-dev.nddcargo.com.br:9553/api";

/* ================= TOKEN ================= */

let tokenCache = null;
let tokenExpiraEm = 0;

async function gerarToken() {
  const agora = Date.now();
  if (tokenCache && agora < tokenExpiraEm) return tokenCache;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "client_credentials",
    scope: "i-comprova-entregas-integration-api"
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });

  if (!res.ok) {
    throw new Error("Erro ao gerar token: " + await res.text());
  }

  const data = await res.json();
  tokenCache = data.access_token;
  tokenExpiraEm = agora + (data.expires_in - 60) * 1000;

  return tokenCache;
}

/* ================= ROTAS ================= */

// debug – ver token se quiser
app.get("/token", async (req, res) => {
  try {
    const token = await gerarToken();
    res.json({ token });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// enviar MDF-e
app.post("/mdfe", async (req, res) => {
  try {
    const token = await gerarToken();

    const apiRes = await fetch(`${API_BASE}/recepcoes/mdfe`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    const text = await apiRes.text();
    res.status(apiRes.status).send(text);

  } catch (e) {
    res.status(500).send(e.message);
  }
});

// enviar CT-e
app.post("/cte", async (req, res) => {
  try {
    const token = await gerarToken();

    const apiRes = await fetch(`${API_BASE}/recepcoes/cte`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    const text = await apiRes.text();
    res.status(apiRes.status).send(text);

  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.listen(3000, () => {
  console.log("Servidor OK → http://localhost:3000");
});
