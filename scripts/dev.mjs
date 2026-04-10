import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const taskkillCommand = isWindows ? "taskkill" : null;

const processes = [
  {
    name: "next",
    command: npmCommand,
    args: ["run", "dev:next"],
  },
  {
    name: "inngest",
    command: npmCommand,
    args: ["run", "dev:inngest"],
  },
];

if (process.argv.includes("--dry-run")) {
  for (const proc of processes) {
    console.log(`${proc.name}: ${proc.command} ${proc.args.join(" ")}`);
  }
  process.exit(0);
}

const children = new Map();
let shuttingDown = false;

function stopChild(child) {
  if (!child || child.exitCode !== null || child.killed) {
    return;
  }

  if (isWindows && taskkillCommand) {
    spawn(taskkillCommand, ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    return;
  }

  child.kill("SIGTERM");
}

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children.values()) {
    stopChild(child);
  }

  setTimeout(() => {
    process.exit(code);
  }, 250);
}

for (const proc of processes) {
  const child = spawn(proc.command, proc.args, {
    env: process.env,
    stdio: "inherit",
    shell: false,
  });

  children.set(proc.name, child);

  child.on("exit", (code, signal) => {
    children.delete(proc.name);

    if (!shuttingDown) {
      const exitCode = code ?? (signal ? 1 : 0);
      shutdown(exitCode);
    }
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
