const crypto = require("crypto");

const PAGE = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>YouTube Gold · Painel</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#0b1020;color:#edf2ff;font:16px system-ui,-apple-system,Segoe UI,sans-serif;display:grid;place-items:center;padding:24px}
main{width:min(680px,100%);background:#141b2e;border:1px solid #2a3550;border-radius:18px;padding:28px;box-shadow:0 20px 60px #0005}
h1{margin:0 0 8px;font-size:28px}p{color:#bac5dc;line-height:1.55}.status{display:inline-block;padding:6px 10px;border-radius:999px;background:#203c35;color:#9de4c8;font-size:13px;font-weight:700}
.card{margin-top:20px;padding:18px;border-radius:12px;background:#0e1526;border:1px solid #2a3550}.card h2{font-size:17px;margin:0 0 8px}
small{color:#9aa8c4}
</style></head>
<body><main><span class="status">PAINEL ONLINE</span><h1>YouTube Gold</h1>
<p>O painel web está respondendo. Esta versão está em modo seguro de dashboard; ela não inicia automação de visualizações.</p>
<section class="card"><h2>Estado do serviço</h2><p id="state">Consultando status…</p><small>Deploy web validado pela rota principal.</small></section>
<section class="card"><h2>Automação</h2><p>O início da automação está desativado nesta implantação. Use o YouTube de forma legítima, sem gerar visualizações artificiais.</p></section>
<script>fetch('/api/status').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(d=>document.getElementById('state').textContent=d.output||d.status).catch(()=>document.getElementById('state').textContent='Painel carregado; status da API indisponível.');</script>
</main></body></html>`;

function unauthorized(res) {
  res.statusCode = 401;
  res.setHeader("WWW-Authenticate", 'Basic realm="YouTube Gold", charset="UTF-8"');
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("Autenticação necessária.");
}
function handler(req, res) {
  const user = process.env.WEB_USER;
  const password = process.env.WEB_PASSWORD;
  if (!user || !password) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end("Painel indisponível: configure WEB_USER e WEB_PASSWORD na Vercel.");
  }
  const header = req.headers.authorization || "";
  const encoded = header.startsWith("Basic ") ? header.slice(6) : "";
  let suppliedUser = "", suppliedPassword = "";
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const colon = decoded.indexOf(":");
    if (colon >= 0) { suppliedUser = decoded.slice(0, colon); suppliedPassword = decoded.slice(colon + 1); }
  } catch (_) {}
  const safeEqual = (a, b) => {
    const x = Buffer.from(String(a)), y = Buffer.from(String(b));
    return x.length === y.length && crypto.timingSafeEqual(x, y);
  };
  if (!safeEqual(suppliedUser, user) || !safeEqual(suppliedPassword, password)) return unauthorized(res);

  const route = new URL(req.url, "https://vercel.invalid").searchParams.get("route") || "home";
  res.setHeader("Cache-Control", "no-store");
  if (route === "status") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ running: false, status: "dashboard-only", output: "Painel online; automação desativada nesta implantação.", logs: [] }));
  }
  if (route === "start" || route === "stop") {
    res.statusCode = 501;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ ok: false, message: "Automação indisponível nesta implantação serverless." }));
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD");
    return res.end("Method Not Allowed");
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(req.method === "HEAD" ? "" : PAGE);
}
module.exports = handler;
