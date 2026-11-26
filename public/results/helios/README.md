# HELIOS evidence, 2026-11-26

The raw outputs behind the published results dashboard. Every file was produced by the
commands below from this repository's code at the commit that added this folder. Nothing was
edited by hand.

| File | What it is | Made by |
| --- | --- | --- |
| `phase1/runs.csv` | One row per scenario × seed × estimator: 8 × 8 × 5 = 320 runs | `run_phase1.py` |
| `phase1/summary.csv` | Mean and standard deviation over the 8 seeds: 40 rows | `run_phase1.py` |
| `phase1/metadata.json` | When it ran, the seeds, and the Python and NumPy versions | `run_phase1.py` |
| `run_phase1.log` | The benchmark's console output | `run_phase1.py` |
| `embedded_vs_python.csv` | The C estimators (double and float) against Python, 8 full scenarios, seed 1000 | `compare_embedded.py` |
| `compare_embedded.log` | Its console output | `compare_embedded.py` |
| `bench_host.txt` | The ESP32 firmware benchmark built and run on a PC | `firmware/targets/host` |
| `tests.txt` | The test suite's result | `pytest` |
| `esp32-build.txt` | The CI build of the ESP32 firmware: toolchain, result, app size, run link | GitHub Actions |

Commands, from the repository root:

```
.venv/Scripts/python HELIOS/scripts/run_phase1.py --out HELIOS/evidence/2026-11-26/phase1
.venv/Scripts/python HELIOS/scripts/compare_embedded.py --out HELIOS/evidence/2026-11-26/embedded_vs_python.csv
cmake -S HELIOS/firmware/targets/host -B build/bench-host && cmake --build build/bench-host && build/bench-host/bench_host
cd HELIOS && ../.venv/Scripts/python -m pytest -q
```

What this evidence is not:
- **Not hardware.** Everything is simulated. The sensor error levels are assumptions.
- **Not ESP32 timing.** `bench_host.txt` ran on a PC, so its `mean_us` and `max_us` columns say
  nothing about the ESP32. The firmware has not run on a board yet.
- `us_per_step_python` in the CSVs is desktop CPython timing, a relative indicator only. The
  two benchmark scripts ran at the same time, so it is noisier than usual.

`phase1/*.png` are the plots `run_phase1.py` draws from the same run. The blog post uses some
of them; the dashboard draws its own charts from the CSVs.
