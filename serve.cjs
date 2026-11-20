const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { execFile } = require("node:child_process");
const root = path.resolve(__dirname, "dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};
if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error(
    "缺少 dist/index.html。请先构建项目，或使用包含 dist 文件夹的完整交付包。",
  );
  process.exit(1);
}
const server = http.createServer((req, res) => {
  let filename;
  try {
    filename = path.resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
  } catch {
    res.writeHead(400).end("Invalid request");
    return;
  }
  if (filename !== root && !filename.startsWith(root + path.sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  if (filename === root) filename = path.join(root, "index.html");
  fs.stat(filename, (error, stat) => {
    if (error || !stat.isFile()) {
      res.writeHead(404).end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type":
        types[path.extname(filename)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(filename).pipe(res);
  });
});
let port = Number(process.env.FIREGUARD_PORT || 5173);
server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && port < 5200) {
    port++;
    server.listen(port, "127.0.0.1");
  } else {
    console.error("启动失败：", error.message);
    process.exitCode = 1;
  }
});
server.on("listening", () => {
  const url = `http://127.0.0.1:${port}/`;
  console.log(
    `\n  FireGuard Sim · 消防预警模拟平台\n\n  已启动：${url}\n  保持此窗口打开；关闭窗口或按 Ctrl+C 停止。\n`,
  );
  if (!process.env.FIREGUARD_NO_OPEN)
    execFile("cmd.exe", ["/d", "/c", "start", "", url], (error) => {
      if (error) console.log("请在浏览器打开上方地址。");
    });
});
server.listen(port, "127.0.0.1");
