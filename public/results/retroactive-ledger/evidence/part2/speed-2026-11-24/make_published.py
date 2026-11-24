"""Make the non-termination evidence machine-readable for the portfolio.

    .venv\\Scripts\\python.exe evidence\\part2\\speed-2026-11-24\\make_published.py

Reads model-fuel.out.txt, investigate.out.txt and java-four-events-extract.txt
(all in this folder) and writes nontermination.json. Every value is parsed
from those files, with the file and line it came from; nothing is typed in.
Standard library only.
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
REL = "evidence/part2/speed-2026-11-24/"


def lines(name):
    return (HERE / name).read_text(encoding="utf-8").splitlines()


def main():
    # The model of the paper: forkSync with growing fuel, prefixes, and each ingredient removed.
    m = lines("model-fuel.out.txt")
    fuel = [{"fuel": int(f), "stuck": s == "true"} for f, s in re.findall(r"\((\d+), (true|false)\)", m[0])]
    prefixes = [{"events": int(k), "stuck": s == "true"} for k, s in re.findall(r"\((\d+), (true|false)\)", m[1])]
    removals = []
    for n, l in enumerate(m, 1):
        r = re.match(r'\("(no [^"]+)", (true|false)\)', l)
        if r:
            removals.append({"without": r.group(1)[3:], "stuck_at_fuel_512": r.group(2) == "true", "line": n})

    # The Haskell port: whole workloads, the shrunk case, and retries with more time.
    inv = lines("investigate.out.txt")
    runs, shrinks, retries, events = [], [], [], []
    for n, l in enumerate(inv, 1):
        for tag, out in (("RUN ", runs), ("SHRINK ", shrinks), ("RETRY ", retries)):
            if l.startswith(tag):
                rec = json.loads(l[len(tag):])
                rec["line"] = n
                out.append(rec)
        e = re.match(r"\s+(\d+): (.+?), effective (\S+) \S+, arrives", l)
        if e and not events_done(events, e.group(1)):
            events.append({"id": e.group(1), "activity": e.group(2), "effective": e.group(3), "line": n})

    # The Java service: the outcome and the stack frames that recur.
    j = lines("java-four-events-extract.txt")
    overflow = [n for n, l in enumerate(j, 1) if "StackOverflowErr" in l]
    frames = []
    for n, l in enumerate(j, 1):
        fm = re.match(r"^\s*(\d+) (at ledger\.\S+)$", l)
        if fm:
            frames.append({"count": int(fm.group(1)), "frame": fm.group(2), "line": n})

    out = {
        "about": "Precise Ledger Pro's fork-and-sync on four events, in the model of the paper and in both "
                 "implementations (upstream 06bb4ce). Running out of every bound tried is consistent with not "
                 "terminating; it is not a proof of non-termination.",
        "events": events,
        "model": {"file": REL + "model-fuel.out.txt", "fuel": fuel, "prefixes": prefixes, "removals": removals},
        "haskell": {"file": REL + "investigate.out.txt", "workloads": runs, "shrunk": shrinks, "retries": retries},
        "java": {"file": REL + "java-four-events-extract.txt", "stack_overflow_lines": overflow, "frames": frames},
    }
    (HERE / "nontermination.json").write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote nontermination.json: {len(fuel)} fuel bounds, {len(events)} events, {len(frames)} Java frames")


def events_done(events, ident):
    return any(e["id"] == ident for e in events)


if __name__ == "__main__":
    main()
