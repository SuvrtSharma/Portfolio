#!/usr/bin/env node
/**
 * Copy the God's Hand evidence files that the results dashboard reads.
 *
 *   node scripts/results/sync-gods-hand.mjs ["D:\God's Hand"]
 *
 * Files keep their path from the God's Hand repository, under
 * public/results/gods-hand/, so every "raw file" link on the dashboard names the
 * same file a reader would find in the repository. The script also writes
 * source.json: the commit the files were copied from, whether any of them had
 * uncommitted changes, and the SHA-256 of each copy. The dashboard re-hashes the
 * copies at build time and shows any difference.
 *
 * Nothing is transformed. To publish a new run, change RUN, run this script,
 * and rebuild.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const RUN = "20261114T210922Z";
const FILES = [
  `evidence/${RUN}/benchmark.json`,
  `evidence/${RUN}/verdicts.json`,
  `evidence/${RUN}/tests.xml`,
  `evidence/${RUN}/manifest.json`,
  "evidence/prove-2026-11-15.json",
  "evidence/mutations-2026-11-15.json",
  "evidence/claims-catalog.json",
  "evidence/findings.json",
  "evidence/nagle-experiment-2026-11-07.txt",
  "evidence/fsync-probe-2026-11-07.txt",
  "evidence/20261107T090049Z/benchmark.json",
];

const repo = resolve(process.argv[2] ?? join("..", "God's Hand"));
const out = resolve("public", "results", "gods-hand");
const git = (...args) =>
  execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();

const commit = git("rev-parse", "HEAD");
const dirty = git("status", "--porcelain", "--", ...FILES);
const files = {};
for (const file of FILES) {
  const from = join(repo, file);
  const to = join(out, file);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  files[file] = createHash("sha256").update(readFileSync(to)).digest("hex");
}

const source = {
  repository: "God's Hand (private)",
  commit,
  uncommitted_changes: dirty ? dirty.split("\n") : [],
  run: RUN,
  copied_by: "node scripts/results/sync-gods-hand.mjs",
  files,
};
writeFileSync(join(out, "source.json"), JSON.stringify(source, null, 2) + "\n");
console.log(`${FILES.length} files from ${commit.slice(0, 12)}${dirty ? " (with uncommitted changes)" : ""} -> ${out}`);
