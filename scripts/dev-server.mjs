#!/usr/bin/env node
/**
 * Local preview server with live reload. No dependencies.
 *
 *   npm run dev            -> http://localhost:3000
 *   PORT=4000 npm run dev  -> another port
 *
 * Serves the site from the project root. When you save an HTML, CSS, JS or
 * image file, the browser reloads automatically (CSS-only edits are swapped
 * in place without a full reload). The reload snippet is injected into the
 * page by this server only; the files on disk are never modified.
 */
import { createServer } from "node:http";
import { watch } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "localhost";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

// Folders that are part of the project but not the website.
const PRIVATE = ["tools", "scripts", "photos", "photo-review", "node_modules", ".git", ".vercel"];

const RELOAD_SNIPPET = `
<script>
(() => {
  const es = new EventSource("/__livereload");
  es.onmessage = (e) => {
    if (e.data === "css") {
      document.querySelectorAll('link[rel="stylesheet"]').forEach((l) => {
        const u = new URL(l.href);
        if (u.origin !== location.origin) return;
        u.searchParams.set("v", Date.now());
        l.href = u.href;
      });
    } else {
      location.reload();
    }
  };
})();
</script>`;

const clients = new Set();

function broadcast(kind) {
  for (const res of clients) res.write(`data: ${kind}\n\n`);
}

let timer = null;
let pending = new Set();
watch(ROOT, { recursive: true }, (_event, file) => {
  if (!file) return;
  const top = file.split(sep)[0];
  if (PRIVATE.includes(top) || file.endsWith("~") || file.includes(".swp")) return;
  pending.add(extname(file).toLowerCase());
  clearTimeout(timer);
  timer = setTimeout(() => {
    const onlyCss = [...pending].every((e) => e === ".css");
    pending = new Set();
    broadcast(onlyCss ? "css" : "reload");
    console.log(`  ↻ ${onlyCss ? "styles updated" : "reloaded"}  (${file})`);
  }, 80);
});

async function resolveFile(urlPath) {
  let p = decodeURIComponent(urlPath.split("?")[0]);
  const rel = normalize(p).replace(/^([/\\])+/, "");
  if (PRIVATE.includes(rel.split(/[/\\]/)[0])) return null;
  let file = join(ROOT, rel);
  if (!file.startsWith(ROOT)) return null; // no path traversal
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, "index.html");
  } catch {
    // clean URLs: /about -> /about.html
    if (!extname(file)) file += ".html";
  }
  try {
    await stat(file);
    return file;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  if (req.url === "/__livereload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write("retry: 1000\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  const file = await resolveFile(req.url);
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404: Not found");
    return;
  }

  const type = TYPES[extname(file).toLowerCase()] || "application/octet-stream";
  let body = await readFile(file);
  if (type.startsWith("text/html")) {
    const html = body.toString("utf8");
    body = html.includes("</body>")
      ? html.replace("</body>", `${RELOAD_SNIPPET}\n</body>`)
      : html + RELOAD_SNIPPET;
  }
  res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n  Port ${PORT} is already in use. Try:  PORT=${PORT + 1} npm run dev\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Villa Serena preview running at  http://${HOST}:${PORT}\n`);
  console.log("  Live reload is on. Save a file and the page refreshes.");
  console.log("  Press Ctrl+C to stop.\n");
});
