#!/usr/bin/env node

// How to run:
//   node scripts/document-ui/server.mjs <project-directory>
//   node scripts/document-ui/server.mjs <project-directory> --no-browser --port 5052

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  saveSelection,
  storeUpload,
  validateSelection,
} from "./core.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDirectory, "../..");
const staticFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/upload-plan.js", ["upload-plan.js", "text/javascript; charset=utf-8"]],
  ["/view.js", ["view.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
]);
const maxUploadBytes = 50 * 1024 * 1024;
const maxJsonBytes = 512 * 1024;

function parseArguments(argv) {
  const options = { projectRoot: "", port: 0, openBrowser: true };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--no-browser") {
      options.openBrowser = false;
    } else if (argument === "--port") {
      options.port = Number(argv[index + 1]);
      index += 1;
    } else if (!argument.startsWith("--") && !options.projectRoot) {
      options.projectRoot = path.resolve(argument);
    } else {
      throw new Error(`알 수 없는 인수: ${argument}`);
    }
  }
  if (!options.projectRoot) {
    throw new Error("사용법: server.mjs <project-directory> [--no-browser] [--port 5052]");
  }
  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) {
    throw new Error("포트는 0부터 65535 사이의 정수여야 합니다.");
  }
  return options;
}

function securityHeaders(contentType) {
  return {
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
    "Content-Type": contentType,
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
}

function sendJson(response, status, payload) {
  response.writeHead(status, securityHeaders("application/json; charset=utf-8"));
  response.end(`${JSON.stringify(payload)}\n`);
}

async function readBody(request, limit) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > limit) {
      const error = new Error("파일이 허용 용량을 초과했습니다.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function loadManifest() {
  const raw = await readFile(path.join(skillRoot, "assets/template-manifest.json"), "utf8");
  return JSON.parse(raw);
}

function browserCommand(url) {
  if (process.platform === "darwin") return ["open", [url]];
  if (process.platform === "win32") return ["cmd", ["/c", "start", "", url]];
  return ["xdg-open", [url]];
}

function openBrowser(url) {
  const [command, args] = browserCommand(url);
  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.on("error", () => {});
  child.unref();
}

export async function startServer({ projectRoot, port = 0, openBrowser: shouldOpen = true }) {
  const manifest = await loadManifest();
  const templateIds = new Set([...Object.keys(manifest.templates), "reference-template"]);
  let server;

  const handler = async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const staticEntry = staticFiles.get(url.pathname);
      if (request.method === "GET" && staticEntry) {
        const [fileName, contentType] = staticEntry;
        const body = await readFile(path.join(scriptDirectory, fileName));
        response.writeHead(200, securityHeaders(contentType));
        response.end(body);
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/health") {
        sendJson(response, 200, { ok: true });
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/bootstrap") {
        sendJson(response, 200, {
          projectName: path.basename(projectRoot),
          templates: manifest.templates,
        });
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/upload") {
        const role = request.headers["x-upload-role"];
        const encodedName = request.headers["x-filename"];
        if (typeof role !== "string" || typeof encodedName !== "string") {
          throw new Error("첨부파일 이름과 역할이 필요합니다.");
        }
        const name = decodeURIComponent(encodedName);
        const body = await readBody(request, maxUploadBytes);
        const uploaded = await storeUpload(projectRoot, role, name, body);
        sendJson(response, 201, uploaded);
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/confirm") {
        const body = await readBody(request, maxJsonBytes);
        const selection = JSON.parse(body.toString("utf8"));
        validateSelection(selection, templateIds);
        const savedPath = await saveSelection(projectRoot, selection);
        sendJson(response, 200, {
          saved: true,
          path: path.relative(projectRoot, savedPath).split(path.sep).join("/"),
        });
        setTimeout(() => server.close(), 900);
        return;
      }
      sendJson(response, 404, { error: "요청한 경로를 찾을 수 없습니다." });
    } catch (error) {
      const status = error instanceof SyntaxError ? 400 : error.statusCode ?? 400;
      sendJson(response, status, { error: error.message || "요청을 처리하지 못했습니다." });
    }
  };

  server = http.createServer(handler);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  const url = `http://127.0.0.1:${actualPort}`;
  if (shouldOpen) setTimeout(() => openBrowser(url), 250);
  return { server, url };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const { server, url } = await startServer(options);
  console.log(`DOCUMENT_UI_URL=${url}`);
  console.log(`프로젝트: ${options.projectRoot}`);
  console.log("설정을 확정하면 서버가 자동으로 종료됩니다.");
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => server.close(() => process.exit(0)));
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
