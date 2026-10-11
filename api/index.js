const crypto = require("crypto");

const PAGE = String.raw`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>YouTube Gold | Analytics</title>
<style>
:root{color-scheme:dark;--bg:#080d19;--panel:#111a2b;--line:#263650;--muted:#a7b5cd;--gold:#e8bd68;--green:#5bd6a2;--red:#ff8d8d}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at top,#17243b 0,#080d19 58%);color:#f5f7fc;font:15px system-ui,-apple-system,Segoe UI,sans-serif;min-height:100vh}
main{max-width:1180px;margin:auto;padding:30px 20px 60px}.top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:26px}.brand{display:flex;gap:13px;align-items:center}.logo{width:48px;height:48px;border-radius:15px;background:linear-gradient(135deg,#f3d28b,#a9752d);display:grid;place-items:center;color:#10131b;font-size:22px;font-weight:900}.eyebrow{color:var(--gold);text-transform:uppercase;font-size:11px;font-weight:800;letter-spacing:.18em}.brand h1{font-size:26px;margin:2px 0}.pill{border:1px solid #2e4658;border-radius:999px;padding:8px 12px;color:#bfead8;background:#102b2a;font-size:12px;font-weight:800}
.intro{margin:0 0 24px;color:var(--muted);line-height:1.6}.panel{background:linear-gradient(145deg,rgba(20,31,50,.96),rgba(14,22,37,.96));border:1px solid var(--line);border-radius:18px;padding:22px;margin-bottom:18px;box-shadow:0 16px 50px #0002}.panel h2{font-size:17px;margin:0 0 8px}.panel p{color:var(--muted);line-height:1.55}.search{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.search input{flex:1;min-width:220px;background:#091120;color:#fff;border:1px solid #354762;border-radius:10px;padding:13px 14px;font:inherit;outline:none}.search input:focus{border-color:var(--gold)}button{border:0;border-radius:10px;background:linear-gradient(135deg,#f0ce83,#bd8a3d);color:#17130b;font-weight:850;padding:13px 19px;cursor:pointer;font:inherit}button:disabled{opacity:.6;cursor:wait}.note{font-size:12px;color:#91a1bb!important;margin-bottom:0}
.alert{display:none;border-radius:12px;padding:13px 15px;margin:16px 0;line-height:1.5}.alert.show{display:block}.alert.error{background:#351c26;border:1px solid #783849;color:#ffc3ca}.alert.info{background:#132b35;border:1px solid #285466;color:#c0e8f5}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin:18px 0}.metric{padding:18px;background:#101a2a;border:1px solid var(--line);border-radius:15px;min-width:0}.metric label{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.1em;font-weight:800}.metric strong{display:block;font-size:clamp(21px,3vw,30px);margin-top:10px;overflow-wrap:anywhere}.channel{display:flex;align-items:center;gap:15px}.avatar{width:68px;height:68px;border-radius:50%;object-fit:cover;background:#202c40}.channel h2{font-size:22px;margin:0 0 5px}.channel a{color:var(--gold);text-decoration:none}.videos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.video{border:1px solid var(--line);background:#0b1423;border-radius:13px;overflow:hidden}.video img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#202b3d}.video .body{padding:12px}.video h3{font-size:14px;line-height:1.45;margin:0 0 9px}.video .meta{color:var(--muted);font-size:12px}.hidden{display:none!important}.foot{color:#7f90ab;font-size:12px;text-align:center;margin-top:28px}
@media(max-width:760px){.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.videos{grid-template-columns:1fr}.video{display:grid;grid-template-columns:140px 1fr}.video img{height:100%;aspect-ratio:auto}.channel{align-items:flex-start}}
</style>
</head>
<body><main>
<header class="top"><div class="brand"><div class="logo">YG</div><div><div class="eyebrow">Creator workspace</div><h1>YouTube Gold</h1></div></div><span class="pill">● DASHBOARD ONLINE</span></header>
<p class="intro">Acompanhe estatísticas públicas e os vídeos recentes de um canal. Os números são consultados na API oficial do YouTube — nada de métricas simuladas.</p>
<section class="panel"><h2>Consultar canal</h2><p>Informe o @handle, o ID do canal ou um link do YouTube.</p><form class="search" id="form"><input id="query" autocomplete="url" placeholder="@canal ou https://youtube.com/@canal" required><button id="submit" type="submit">Consultar canal</button></form><div id="alert" class="alert" role="status"></div><p class="note">Para habilitar consultas, configure YOUTUBE_API_KEY nas variáveis de ambiente da Vercel.</p></section>
<section id="results" class="hidden">
<div class="panel"><div class="channel"><img id="avatar" class="avatar" alt=""><div><h2 id="name"></h2><div id="handle" class="note"></div><p style="margin:6px 0 0"><a id="channelLink" target="_blank" rel="noopener noreferrer">Abrir canal no YouTube ↗</a></p></div></div>
<div class="metrics"><div class="metric"><label>Inscritos</label><strong id="subs">—</strong></div><div class="metric"><label>Visualizações totais</label><strong id="views">—</strong></div><div class="metric"><label>Vídeos publicados</label><strong id="count">—</strong></div><div class="metric"><label>Últimos vídeos</label><strong id="recentCount">—</strong></div></div><p class="note" id="updated"></p></div>
<div class="panel"><h2>Vídeos recentes</h2><p>Desempenho público disponível para cada vídeo listado.</p><div id="videos" class="videos"></div></div>
</section>
<div class="foot">YouTube Gold · Analytics com dados reais · A chave da API nunca é enviada ao navegador.</div>
</main>
<script>
const form=document.getElementById('form'), input=document.getElementById('query'), button=document.getElementById('submit'), alertBox=document.getElementById('alert'), results=document.getElementById('results');
const fmt=n=>Number(n||0).toLocaleString('pt-BR');
function message(text,type){alertBox.textContent=text;alertBox.className='alert show '+type}
form.addEventListener('submit',async e=>{e.preventDefault();const q=input.value.trim();if(!q)return;button.disabled=true;button.textContent='Consultando…';results.classList.add('hidden');message('Buscando dados reais do canal…','info');try{const r=await fetch('/api/channel?q='+encodeURIComponent(q),{headers:{Accept:'application/json'}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||('A API respondeu HTTP '+r.status));document.getElementById('name').textContent=d.channel.title;document.getElementById('handle').textContent=d.channel.customUrl||d.channel.id;document.getElementById('avatar').src=d.channel.thumbnail||'';document.getElementById('channelLink').href='https://www.youtube.com/channel/'+encodeURIComponent(d.channel.id);document.getElementById('subs').textContent=d.channel.hiddenSubscriberCount?'Ocultos':fmt(d.channel.subscribers);document.getElementById('views').textContent=fmt(d.channel.views);document.getElementById('count').textContent=fmt(d.channel.videoCount);document.getElementById('recentCount').textContent=fmt(d.videos.length);document.getElementById('updated').textContent='Dados consultados em '+new Date().toLocaleString('pt-BR');const grid=document.getElementById('videos');grid.replaceChildren();if(!d.videos.length){grid.textContent='Nenhum vídeo recente encontrado.'}else{d.videos.forEach(v=>{const card=document.createElement('article');card.className='video';const img=document.createElement('img');img.loading='lazy';img.alt='Miniatura do vídeo';img.src=v.thumbnail||'';const body=document.createElement('div');body.className='body';const title=document.createElement('h3');title.textContent=v.title;const meta=document.createElement('div');meta.className='meta';meta.textContent=fmt(v.views)+' visualizações · '+new Date(v.publishedAt).toLocaleDateString('pt-BR');const link=document.createElement('a');link.href='https://www.youtube.com/watch?v='+encodeURIComponent(v.id);link.target='_blank';link.rel='noopener noreferrer';link.style.color='var(--gold)';link.textContent='Assistir ↗';body.append(title,meta,link);card.append(img,body);grid.append(card)})}results.classList.remove('hidden');message('Canal carregado. Os dados abaixo vieram da API do YouTube.','info')}catch(err){message(err.message||'Não foi possível consultar o canal.','error')}finally{button.disabled=false;button.textContent='Consultar canal'}});
</script>
</body></html>`;

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
function unauthorized(res) {
  res.statusCode = 401;
  res.setHeader("WWW-Authenticate", 'Basic realm="YouTube Gold", charset="UTF-8"');
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("Autenticação necessária.");
}
function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function normalizeQuery(input) {
  let q = String(input || "").trim();
  if (!q || q.length > 300) return null;
  try {
    if (/^https?:\/\//i.test(q)) {
      const u = new URL(q);
      if (!/(^|\.)youtube\.com$/i.test(u.hostname) && !/(^|\.)youtu\.be$/i.test(u.hostname)) return null;
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "channel" && parts[1]) return { id: parts[1] };
      if (parts[0] === "user" && parts[1]) return { username: parts[1] };
      if (parts[0] && parts[0].startsWith("@")) return { handle: parts[0] };
      return null;
    }
  } catch (_) { return null; }
  if (/^UC[\w-]{20,}$/.test(q)) return { id: q };
  if (q.startsWith("@")) return { handle: q };
  if (/^[\w.-]{2,100}$/.test(q)) return { handle: "@" + q };
  return null;
}
async function youtubeRequest(resource, params, key) {
  const url = new URL("https://www.googleapis.com/youtube/v3/" + resource);
  Object.entries({ ...params, key }).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = data && data.error && data.error.errors && data.error.errors[0] && data.error.errors[0].reason;
    if (response.status === 403) throw new Error("O YouTube recusou a consulta. Verifique se a YouTube Data API v3 está ativada e se a cota da chave está disponível (" + (reason || "403") + ").");
    if (response.status === 400) throw new Error("A chave da YouTube Data API ou os parâmetros não foram aceitos. Confira a configuração da API.");
    throw new Error("Falha ao consultar o YouTube (HTTP " + response.status + ").");
  }
  return data;
}
async function getChannel(query, key) {
  const criteria = normalizeQuery(query);
  if (!criteria) throw new Error("Informe um @handle, ID de canal ou link válido do YouTube.");
  const params = { part: "snippet,statistics,contentDetails", maxResults: 1 };
  if (criteria.id) params.id = criteria.id;
  else if (criteria.username) params.forUsername = criteria.username;
  else params.forHandle = criteria.handle;
  const found = await youtubeRequest("channels", params, key);
  const item = found.items && found.items[0];
  if (!item) throw new Error("Nenhum canal encontrado. Confira o @handle, o ID ou o link informado.");
  const stats = item.statistics || {};
  const uploads = item.contentDetails && item.contentDetails.relatedPlaylists && item.contentDetails.relatedPlaylists.uploads;
  let videos = [];
  if (uploads) {
    const playlist = await youtubeRequest("playlistItems", { part: "snippet,contentDetails", playlistId: uploads, maxResults: 6 }, key);
    const ids = (playlist.items || []).map(v => v.contentDetails && v.contentDetails.videoId).filter(Boolean);
    if (ids.length) {
      const details = await youtubeRequest("videos", { part: "snippet,statistics", id: ids.join(",") }, key);
      videos = (details.items || []).map(v => ({
        id: v.id,
        title: (v.snippet && v.snippet.title) || "Vídeo sem título",
        publishedAt: (v.snippet && v.snippet.publishedAt) || "",
        thumbnail: v.snippet && v.snippet.thumbnails && ((v.snippet.thumbnails.medium || v.snippet.thumbnails.default || {}).url),
        views: Number(v.statistics && v.statistics.viewCount || 0)
      }));
    }
  }
  return {
    channel: {
      id: item.id,
      title: item.snippet && item.snippet.title || "Canal do YouTube",
      customUrl: item.snippet && item.snippet.customUrl || "",
      thumbnail: item.snippet && item.snippet.thumbnails && ((item.snippet.thumbnails.high || item.snippet.thumbnails.medium || item.snippet.thumbnails.default || {}).url) || "",
      subscribers: Number(stats.subscriberCount || 0),
      hiddenSubscriberCount: Boolean(stats.hiddenSubscriberCount),
      views: Number(stats.viewCount || 0),
      videoCount: Number(stats.videoCount || 0)
    },
    videos
  };
}
async function handler(req, res) {
  const url = new URL(req.url, "https://vercel.invalid");
  const route = url.searchParams.get("route") || (url.pathname === "/api/channel" ? "channel" : "home");
  res.setHeader("Cache-Control", route === "channel" ? "public, max-age=30, s-maxage=60" : "no-store");
  if (req.method !== "GET" && req.method !== "HEAD") return sendJson(res, 405, { error: "Método não permitido." });
  if (route === "status") return sendJson(res, 200, { status: "online", output: "Painel online. API de análise pronta para consultas.", apiConfigured: Boolean(process.env.YOUTUBE_API_KEY) });
  if (route === "channel") {
    if (!process.env.YOUTUBE_API_KEY) return sendJson(res, 503, { error: "Falta configurar YOUTUBE_API_KEY nas variáveis de ambiente da Vercel. Ative a YouTube Data API v3 no Google Cloud e adicione a chave em Production." });
    try { return sendJson(res, 200, await getChannel(url.searchParams.get("q"), process.env.YOUTUBE_API_KEY)); }
    catch (error) { return sendJson(res, 400, { error: error.message || "Falha ao consultar o canal." }); }
  }
  if (route === "start" || route === "stop") return sendJson(res, 410, { error: "Ações de automação não fazem parte do painel de analytics." });
  const user = process.env.WEB_USER;
  const password = process.env.WEB_PASSWORD;
  if (user && password) {
    const auth = req.headers.authorization || "";
    let suppliedUser = "", suppliedPassword = "";
    try {
      const decoded = Buffer.from(auth.startsWith("Basic ") ? auth.slice(6) : "", "base64").toString("utf8");
      const colon = decoded.indexOf(":");
      if (colon >= 0) { suppliedUser = decoded.slice(0, colon); suppliedPassword = decoded.slice(colon + 1); }
    } catch (_) {}
    if (!safeEqual(suppliedUser, user) || !safeEqual(suppliedPassword, password)) return unauthorized(res);
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.end(req.method === "HEAD" ? "" : PAGE);
}
module.exports = handler;
