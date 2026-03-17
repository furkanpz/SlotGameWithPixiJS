import { rmSync } from "node:fs";

const targets = [
  new URL("../dist", import.meta.url),
  new URL("../backend/out", import.meta.url),
  new URL("../backend/dist", import.meta.url),
];

for (const target of targets) {
  rmSync(target, { force: true, recursive: true });
}
