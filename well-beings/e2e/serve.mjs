/**
 * A tiny static server for the end-to-end suites: the export in out/ at
 * /Well-beings/ (as GitHub Pages serves it), and /lab/ with the music
 * engine for the offline loudness test. No dependencies.
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { APP, OUT, PORT } from "./lib.mjs";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
};
const LAB = {
  "/lab/": `<!doctype html><meta charset="utf-8"><title>lab</title>`,
  "/lab/index.html": `<!doctype html><meta charset="utf-8"><title>lab</title>`,
};

export function serve(port = PORT) {
  const server = createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (LAB[url]) return res.writeHead(200, { "content-type": TYPES[".html"] }).end(LAB[url]);
    if (url === "/lab/ambient-core.mjs") {
      res.writeHead(200, { "content-type": TYPES[".mjs"] });
      return createReadStream(join(APP, "lib", "ambient-core.mjs")).pipe(res);
    }
    if (!url.startsWith("/Well-beings/") && url !== "/Well-beings") return res.writeHead(404).end("not found");
    let file = normalize(join(OUT, url.replace(/^\/Well-beings/, "")));
    if (!file.startsWith(OUT)) return res.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) {
      if (existsSync(file + ".html")) file += ".html";
      else return res.writeHead(404, { "content-type": TYPES[".html"] }).end("not found");
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(port, "127.0.0.1", () => ok(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await serve();
  console.log(`serving out/ at http://127.0.0.1:${PORT}/Well-beings/`);
}
