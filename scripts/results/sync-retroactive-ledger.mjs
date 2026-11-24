#!/usr/bin/env node
/**
 * Copy the God's Hand part 2 evidence files that the retroactive-ledger
 * dashboard reads.
 *
 *   node scripts/results/sync-retroactive-ledger.mjs ["D:\God's Hand"]
 *
 * Each file is copied from the repository's current commit (`git show
 * HEAD:<path>`), not from the working tree, so its bytes and SHA-256 are exactly
 * those a reader would find in the repository. Files keep their repository
 * path under public/results/retroactive-ledger/. The script writes source.json:
 * the commit, the date the checker's verdicts were committed, and the SHA-256 of
 * each copy. The dashboard re-hashes the copies at build time and shows any
 * difference.
 *
 * Nothing is transformed. To publish newer evidence, update FILES, run this
 * script, and rebuild.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const VERDICTS = "evidence/part2/leancheck-2026-11-24-locked";
const PROOFS = [
  "rebuildFromInsertExact",
  "rebuildFromRemoveExact",
  "forkSyncDisagreesWithRebuild",
  "forkSyncDisagreesWithRebuild_robust",
  "forkSyncDisagreesWithRebuild_tie",
  "rebuildIgnoresArrival",
  "paymentConserved",
];
const FILES = [
  ...PROOFS.map((p) => `${VERDICTS}/${p}.json`),
  `${VERDICTS}/context.txt`,
  "part2/spec.lock.json",
  "part2/Spec/Retro.lean",
  "part2/Proofs/Retro.lean",
  "evidence/part2/published-2026-11-24/counterexamples.json",
  "evidence/part2/published-2026-11-24/counterexamples.lean",
  "evidence/part2/published-2026-11-24/code-reproduction.json",
  "evidence/part2/published-2026-11-24/optimisation.json",
  "evidence/part2/published-2026-11-24/java-results-extract.txt",
  "evidence/part2/published-2026-11-24/make_published.py",
  "evidence/part2/published-2026-11-24/README.md",
  "evidence/plp/repro-haskell-2026-11-18.txt",
  "evidence/part2/readings8-2026-11-23/code-check-original-haskell.txt",
  "evidence/part2/rebuild-from-earliest-2026-11-24/pretest.lean",
  "evidence/part2/rebuild-from-earliest-2026-11-24/pretest.out.txt",
  "evidence/part2/rebuild-from-earliest-2026-11-24/bite.lean",
  "evidence/part2/rebuild-from-earliest-2026-11-24/bite.out.txt",
  "evidence/part2/mapping-2026-11-23/readings-needed.txt",
  "docs/part2/paper-model-mapping.md",
  "evidence/part2/speed-2026-11-24/NOTES.md",
  "evidence/part2/speed-2026-11-24/run-full.out.txt",
  "evidence/part2/speed-2026-11-24/run-full.out.summary.json",
  "evidence/part2/speed-2026-11-24/run-full.out.summary.txt",
  "evidence/part2/speed-2026-11-24/summarise.py",
  "evidence/part2/speed-2026-11-24/probe.out.txt",
  "evidence/part2/speed-2026-11-24/investigate.out.txt",
  "evidence/part2/speed-2026-11-24/model-fuel.lean",
  "evidence/part2/speed-2026-11-24/model-fuel.out.txt",
  "evidence/part2/speed-2026-11-24/java-four-events-extract.txt",
  "evidence/part2/speed-2026-11-24/nontermination.json",
  "evidence/part2/speed-2026-11-24/make_published.py",
  "tools/plp/haskell/Bench.hs",
];

const repo = resolve(process.argv[2] ?? join("..", "God's Hand"));
const out = resolve("public", "results", "retroactive-ledger");
const git = (args, encoding = "utf8") => execFileSync("git", ["-C", repo, ...args], { encoding });

const commit = git(["rev-parse", "HEAD"]).trim();
const checkedAt = git(["log", "-1", "--format=%cI", "--", VERDICTS]).trim();
const files = {};
for (const file of FILES) {
  const content = git(["show", `HEAD:${file}`], "buffer");
  const to = join(out, file);
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, content);
  files[file] = createHash("sha256").update(content).digest("hex");
}

const source = {
  repository: "God's Hand (private)",
  commit,
  checked_at: checkedAt,
  copied_from: "the commit (git show HEAD:<path>), not the working tree",
  copied_by: "node scripts/results/sync-retroactive-ledger.mjs",
  files,
};
writeFileSync(join(out, "source.json"), JSON.stringify(source, null, 2) + "\n");
console.log(`copied ${FILES.length} files from ${commit.slice(0, 12)} (verdicts committed ${checkedAt})`);
