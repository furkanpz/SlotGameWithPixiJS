import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const run = (args, cwd) =>
  new Promise((resolve, reject) => {
    const child = spawn(npmCommand, args, {
      cwd,
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Command exited with signal ${signal}`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
        return;
      }
      resolve();
    });
  });

await run(["run", "build"], new URL("..", import.meta.url));
await run(["run", "build"], new URL("../backend", import.meta.url));
