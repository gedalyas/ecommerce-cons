#!/usr/bin/env node
// Cross-platform helpers for the Makefile. On Windows, GNU make runs recipes
// under cmd.exe (no `test`, `cp`, `until`), so anything beyond a plain command
// invocation lives here instead of in shell syntax.
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, rmSync } from "node:fs";

const [, , command] = process.argv;

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

switch (command) {
  case "env": {
    if (existsSync(".env")) break;
    copyFileSync(".env.example", ".env");
    console.log("created .env from .env.example");
    break;
  }

  case "wait-postgres": {
    process.stdout.write("waiting for postgres");
    for (let i = 0; i < 60; i++) {
      try {
        const status = execSync(
          "docker inspect -f {{.State.Health.Status}} ecommerce-postgres",
          { stdio: ["ignore", "pipe", "ignore"] },
        )
          .toString()
          .trim();
        if (status === "healthy") {
          console.log(" ready");
          process.exit(0);
        }
      } catch {
        // container not created yet - keep polling
      }
      process.stdout.write(".");
      sleep(1000);
    }
    console.error("\npostgres did not become healthy within 60s - check `docker compose logs postgres`");
    process.exit(1);
  }

  case "help": {
    // Print every `target: ## description` line from the Makefile, aligned.
    const lines = readFileSync("Makefile", "utf8")
      .split("\n")
      .map((line) => /^([a-zA-Z_-]+):.*?## (.*)$/.exec(line))
      .filter(Boolean)
      .map(([, target, text]) => [target, text.trim()])
      .sort(([a], [b]) => a.localeCompare(b));
    const width = Math.max(...lines.map(([target]) => target.length));
    for (const [target, text] of lines) console.log(`  ${target.padEnd(width)}  ${text}`);
    break;
  }

  case "clean": {
    for (const path of [".output", ".tanstack", ".nitro", "node_modules"]) {
      rmSync(path, { recursive: true, force: true });
    }
    console.log("removed .output, .tanstack, .nitro, node_modules");
    break;
  }

  default: {
    console.error(`unknown helper command: ${command}`);
    process.exit(1);
  }
}
