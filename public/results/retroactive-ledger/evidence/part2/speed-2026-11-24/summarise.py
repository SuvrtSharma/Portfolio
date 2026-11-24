"""Summarise a Bench.hs run: medians per workload and engine, and the call.

    .venv\\Scripts\\python.exe evidence\\part2\\speed-2026-11-24\\summarise.py RUN.out.txt

Reads the TIME and CHECK lines Bench.hs prints and writes RUN.summary.json and
RUN.summary.txt next to the input. Rules, as in part 1 (ADR-0020):

- the warm-up round is discarded; figures are the median of the timed rounds;
- `partial` (rebuild from the earliest affected point, ADR-0028) is judged
  against `full` (the meaning-preserving baseline): "faster" only if partial's
  slowest round beat full's fastest, "slower" only the other way round,
  otherwise "within noise";
- `forkSync` is rejected on meaning (ADR-0027), so it is timed for reference
  only and never called faster or slower;
- a run that hit the time limit is reported as such, never as a number.

Standard library only; every figure is computed from the input file.
"""
import json
import statistics
import sys
from pathlib import Path


def parse(path):
    checks, times = [], []
    for n, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        for tag, out in (("CHECK ", checks), ("TIME ", times)):
            if line.startswith(tag):
                rec = json.loads(line[len(tag):])
                rec["line"] = n
                out.append(rec)
    return checks, times


def main():
    src = Path(sys.argv[1])
    checks, times = parse(src)
    timed = [t for t in times if t.get("warmup") is not True]
    configs = list(dict.fromkeys(t["config"] for t in timed))
    engines = list(dict.fromkeys(t["engine"] for t in timed))
    rows = []
    for c in configs:
        row = {"config": c, "engines": {}}
        for e in engines:
            runs = [t for t in timed if t["config"] == c and t["engine"] == e]
            secs = [t["seconds"] for t in runs if not t["timed_out"]]
            row["engines"][e] = {
                "rounds": len(runs),
                "timed_out": sum(1 for t in runs if t["timed_out"]),
                "median_s": statistics.median(secs) if secs else None,
                "min_s": min(secs) if secs else None,
                "max_s": max(secs) if secs else None,
                "lines": [t["line"] for t in runs],
            }
        f, p = row["engines"].get("full"), row["engines"].get("partial")
        if f and p and f["median_s"] and p["median_s"] and not f["timed_out"] and not p["timed_out"]:
            row["partial_vs_full_ratio"] = f["median_s"] / p["median_s"]
            row["call"] = ("faster" if p["max_s"] < f["min_s"] else "slower" if p["min_s"] > f["max_s"] else "within noise")
        else:
            row["partial_vs_full_ratio"] = None
            row["call"] = "not comparable (a run hit the time limit)"
        k = row["engines"].get("forkSync")
        if k and f and k["median_s"] and f["median_s"]:
            row["forkSync_vs_full_ratio"] = f["median_s"] / k["median_s"]
        rows.append(row)
    summary = {"source": src.name, "checks": checks, "rows": rows,
               "rule": "median of timed rounds; partial called faster only if its slowest round beat full's fastest"}
    src.with_suffix(".summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8", newline="\n")

    def fmt(x):
        return "timed out" if x is None else f"{x:.4f}"
    out = [f"From {src.name}. Median seconds of the timed rounds (warm-up discarded).", ""]
    out.append(f"{'workload':38} {'forkSync':>11} {'full':>11} {'partial':>11} {'full/partial':>13}  call")
    for r in rows:
        e = r["engines"]
        ratio = "" if r["partial_vs_full_ratio"] is None else f"{r['partial_vs_full_ratio']:.2f}x"
        out.append(f"{r['config']:38} {fmt(e.get('forkSync', {}).get('median_s')):>11} "
                   f"{fmt(e.get('full', {}).get('median_s')):>11} {fmt(e.get('partial', {}).get('median_s')):>11} "
                   f"{ratio:>13}  {r['call']}")
    if checks:
        out += ["", "Checks before timing:"]
        out += [f"  {c['config']:38} partial==full {c['partial_equals_full']}  forkSync==full {c['forkSync_equals_full']}"
                f"  ({c['activities']} activities, {c['backdated']} backdated, {c['reversals']} reversals)" for c in checks]
    src.with_suffix(".summary.txt").write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print("\n".join(out))


if __name__ == "__main__":
    main()
