const { spawn } = require("child_process");
const path = require("path");

process.chdir(__dirname);

const nextBin = path.join(__dirname, "node_modules", "next", "dist", "bin", "next");

const proc = spawn(
  process.execPath,
  [nextBin, "dev", "-p", "3000"],
  {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "development", FORCE_COLOR: "1" },
  }
);

function pipe(label, stream) {
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    for (const line of chunk.split(/\r?\n/)) {
      if (line) process.stdout.write(`[${label}] ${line}\n`);
    }
  });
}

pipe("next-out", proc.stdout);
pipe("next-err", proc.stderr);

proc.on("exit", (code, signal) => {
  process.stdout.write(`[runner] Next.js exited (code=${code}, signal=${signal})\n`);
  process.exit(code ?? 0);
});

process.on("SIGINT", () => { try { proc.kill("SIGINT"); } catch {} });
process.on("SIGTERM", () => { try { proc.kill("SIGTERM"); } catch {} });
