"""Build the machine-readable files the portfolio's part 2 dashboard reads.

    .venv\\Scripts\\python.exe evidence\\part2\\published-2026-11-24\\make_published.py

Reads raw outputs that are already committed in this repository and writes,
next to this script:

- java-results-extract.txt: only the GODSHAND result lines of the two Java
  runs (the full Maven logs stay private: they also print connection details);
- code-reproduction.json: the two counterexamples as their code computed them,
  each figure with the file and line it came from;
- optimisation.json: the test and bite counts for the optimisation claims,
  each with its file and line.

No figure is typed in: everything is parsed from the raw files. Standard
library only.
"""
import gzip
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent

HASKELL_1118 = "evidence/plp/repro-haskell-2026-11-18.txt"
JAVA_1118 = "evidence/plp/repro-java-2026-11-18.log.gz"
HASKELL_1123 = "evidence/part2/readings8-2026-11-23/code-check-original-haskell.txt"
JAVA_1123 = "evidence/part2/readings8-2026-11-23/code-check-original-java.log.gz"
PRETEST = "evidence/part2/rebuild-from-earliest-2026-11-24/pretest.out.txt"
BITE = "evidence/part2/rebuild-from-earliest-2026-11-24/bite.out.txt"
JAVA_EXTRACT = "evidence/part2/published-2026-11-24/java-results-extract.txt"


def lines(rel):
    path = ROOT / rel
    if rel.endswith(".gz"):
        with gzip.open(path, "rt", encoding="utf-8", errors="replace") as f:
            return f.read().splitlines()
    return path.read_text(encoding="utf-8").splitlines()


def num(s):
    v = float(s)
    return int(v) if v == int(v) else v


# ---- Haskell outputs: "([a,b,c(,d)],[("id",[...]),...])"
def parse_haskell_state(text, order):
    m = re.search(r"\(\[([^\]]*)\],\[(.*)\]\)", text)
    if not m:
        raise ValueError(f"no Haskell state in: {text}")
    bal = dict(zip(order, (num(x) for x in m.group(1).split(","))))
    effects = []
    for ident, vals in re.findall(r'\("([^"]+)",\[([^\]]*)\]\)', m.group(2)):
        effects.append({"id": ident, "effect": dict(zip(order, (num(x) for x in vals.split(","))))})
    return {"balance": {k: bal[k] for k in ("fee", "principal", "excess")},
            "effects": [{"id": e["id"], "effect": {k: e["effect"][k] for k in ("fee", "principal", "excess")}}
                        for e in effects]}


# ---- Java GODSHAND lines: "balance Balance[principal=USD 0, ...] | impacts b=Balance[...] ... | entries 3"
def parse_java_balance(text):
    return {k: num(v) for k, v in re.findall(r"(principal|interest|fee|excess)=USD (-?[\d.]+)", text)}


def parse_java_state(line):
    bal_part, impacts_part = line.split("| impacts", 1)
    impacts_part, entries_part = impacts_part.rsplit("| entries", 1)
    bal = parse_java_balance(bal_part)
    effects = [{"id": ident, "effect": {k: v for k, v in parse_java_balance(b).items() if k != "interest"}}
               for ident, b in re.findall(r"(\w+)=Balance\[([^\]]*)\]", impacts_part)]
    return {"balance": {k: bal[k] for k in ("fee", "principal", "excess")},
            "effects": effects, "entries": int(entries_part.strip())}


def find(ls, needle, start=0):
    for i in range(start, len(ls)):
        if needle in ls[i]:
            return i
    raise ValueError(f"not found: {needle}")


def java_block(rel, scenario_needle):
    ls = lines(rel)
    g = [(i, l) for i, l in enumerate(ls, 1) if l.startswith("GODSHAND")]
    k = next(j for j, (_, l) in enumerate(g) if l.startswith("GODSHAND scenario:") and scenario_needle in l)
    (n0, s), (n1, a), (n2, o) = g[k], g[k + 1], g[k + 2]
    assert a.startswith("GODSHAND   arrival") and o.startswith("GODSHAND   in order"), (a, o)
    return {"file": JAVA_EXTRACT, "from_log": rel, "log_lines": [n0, n1, n2],
            "scenario": s.split("GODSHAND scenario: ", 1)[1],
            "arrival": parse_java_state(a), "on_time": parse_java_state(o)}


def main():
    # Java extract: GODSHAND lines only, with their source and line numbers.
    extract = ["Result lines (GODSHAND) of the Java runs, extracted by make_published.py.",
               "The full Maven logs are not published: they also print connection details.", ""]
    for rel in (JAVA_1118, JAVA_1123):
        extract.append(f"== {rel}")
        extract += [f"{i}: {l}" for i, l in enumerate(lines(rel), 1) if l.startswith("GODSHAND")]
        extract.append("")
    (ROOT / JAVA_EXTRACT).write_text("\n".join(extract) + "\n", encoding="utf-8")

    # Backdated counterexample (11-18). Haskell ids are arrival positions 0, 1, 2
    # (model ids 1, 2, 3); Repro.hs orders a balance as fee, interest, principal, excess.
    h = lines(HASKELL_1118)
    i = find(h, "lateAfterLate")
    hs_order = ["fee", "interest", "principal", "excess"]
    backdated_haskell = {
        "file": HASKELL_1118, "lines": [i + 2, i + 3],
        "ids": "arrival positions: 0 = model id 1, 1 = model id 2, 2 = model id 3",
        "arrival": parse_haskell_state(h[i + 1], hs_order),
        "on_time": parse_haskell_state(h[i + 2], hs_order)}

    # Reading-robust counterexample (11-23). Cases.hs orders a balance as fee, principal, excess.
    c = lines(HASKELL_1123)
    j = find(c, "robust:")
    robust_haskell = {
        "file": HASKELL_1123, "lines": [j + 2, j + 3], "ids": "model ids",
        "arrival": parse_haskell_state(c[j + 1], ["fee", "principal", "excess"]),
        "on_time": parse_haskell_state(c[j + 2], ["fee", "principal", "excess"])}

    def agrees(x):
        return x["arrival"] == x["on_time"]

    def balance_agrees(x):
        return x["arrival"]["balance"] == x["on_time"]["balance"]

    cases = []
    for name, hk, jv in (
        ("backdated", backdated_haskell, java_block(JAVA_1118, "late event after a late event")),
        ("reading-robust", robust_haskell, java_block(JAVA_1123, "reading-robust")),
    ):
        for impl, rec in (("Haskell port", hk), ("Java service", jv)):
            rec = dict(rec)
            rec["implementation"] = impl
            rec["case"] = name
            rec["late_path_agrees_with_on_time"] = agrees({"arrival": {k: v for k, v in rec["arrival"].items() if k != "entries"},
                                                           "on_time": {k: v for k, v in rec["on_time"].items() if k != "entries"}})
            rec["balance_agrees"] = balance_agrees(rec)
            cases.append(rec)
    (OUT / "code-reproduction.json").write_text(json.dumps({
        "about": "The counterexamples as Precise Ledger Pro's own code computed them, at upstream 06bb4ce: "
                 "the late (arrival-order) path against an on-time run of the same engine.",
        "cases": cases}, indent=2) + "\n", encoding="utf-8")

    # Optimisation counts, each with its line.
    def grab(rel, pattern):
        ls = lines(rel)
        for n, l in enumerate(ls, 1):
            m = re.search(pattern, l)
            if m:
                return {"value": int(m.group(1)), "file": rel, "line": n, "text": l.strip()}
        raise ValueError(f"{pattern} not in {rel}")
    opt = {
        "arrival_cases": grab(PRETEST, r"insert cases: (\d+)"),
        "arrival_backdated": grab(PRETEST, r"backdated \(insertion point before the end\): (\d+)"),
        "arrival_claim_fails": grab(PRETEST, r"insert cases.*claim fails on: (\d+)"),
        "reversal_cases": grab(PRETEST, r"remove cases: (\d+)"),
        "reversal_not_last": grab(PRETEST, r"not the last in business order: (\d+)"),
        "reversal_claim_fails": grab(PRETEST, r"remove cases.*claim fails on: (\d+)"),
        "variants": [],
    }
    for n, l in enumerate(lines(BITE), 1):
        m = re.match(r"\s+(.+): fails on (\d+)$", l)
        if m:
            opt["variants"].append({"variant": m.group(1), "fails_on": int(m.group(2)), "file": BITE, "line": n,
                                    "case": "arrival" if n < next(k for k, x in enumerate(lines(BITE), 1) if x.startswith("reversal")) else "reversal"})
    (OUT / "optimisation.json").write_text(json.dumps(opt, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {JAVA_EXTRACT}, code-reproduction.json ({len(cases)} cases), optimisation.json ({len(opt['variants'])} variants)")


if __name__ == "__main__":
    main()
