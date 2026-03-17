import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [];
let shuttingDown = false;

const spawnProcess = (name, args, cwd, extraEnv = {}) => {
  const child = spawn(npmCommand, args, {
    cwd,
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    for (const otherChild of children) {
      if (otherChild !== child) {
        otherChild.kill("SIGTERM");
      }
    }
    const exitCode = typeof code === "number" ? code : 1;
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(exitCode);
  });

  children.push(child);
  return child;
};

const shutdown = (signal) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  for (const child of children) {
    child.kill(signal);
  }
  setTimeout(() => process.exit(0), 250);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

spawnProcess("backend", ["run", "dev"], new URL("../backend", import.meta.url));
spawnProcess("frontend", ["run", "dev:frontend"], new URL("..", import.meta.url));
