#!/usr/bin/env node
/**
 * Copy the HELIOS evidence files that the helios dashboard reads.
 *
 *   node scripts/results/sync-helios.mjs ["D:\MAYDAY"]
 *
 * Each file is copied from the repository's current commit (`git show
 * HEAD:<path>`), not from the working tree, so its bytes and SHA-256 are exactly
 * those in the repository. Files keep their path under HELIOS/evidence/<RUN>/
 * and land in public/results/helios/. The script writes source.json: the
 * commit, the date the evidence was committed, and the SHA-256 of each copy.
 * The dashboard re-hashes the copies at build time and shows any difference.
 *
 * Nothing is transformed. To publish a newer run, change RUN, run this script,
 * and rebuild.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const RUN = "2026-11-26";
const BASE = `HELIOS/evidence/${RUN}`;
const FILES = [
  "README.md",
  "phase1/runs.csv",
  "phase1/summary.csv",
  "phase1/metadata.json",
  "run_phase1.log",
  "embedded_vs_python.csv",
  "compare_embedded.log",
  "bench_host.txt",
  "tests.txt",
  "esp32-build.txt",
];

const repo = resolve(process.argv[2] ?? join("..", "MAYDAY"));
const out = resolve("public", "results", "helios");
const git = (args, encoding = "utf8") => execFileSync("git", ["-C", repo, ...args], { encoding });

const commit = git(["rev-parse", "HEAD"]).trim();
const committedAt = git(["log", "-1", "--format=%cI", "--", BASE]).trim();
if (!committedAt) throw new Error(`${BASE} is not committed in ${repo}`);
const files = {};
for (const file of FILES) {
  const content = git(["show", `HEAD:${BASE}/${file}`], "buffer");
  const to = join(out, file);
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, content);
  files[file] = createHash("sha256").update(content).digest("hex");
}

const source = {
  repository: "HELIOS (private)",
  run: RUN,
  commit,
  committed_at: committedAt,
  copied_from: "the commit (git show HEAD:<path>), not the working tree",
  copied_by: "node scripts/results/sync-helios.mjs",
  files,
};
writeFileSync(join(out, "source.json"), JSON.stringify(source, null, 2) + "\n");
console.log(`copied ${FILES.length} files from ${commit.slice(0, 12)} (evidence committed ${committedAt})`);
