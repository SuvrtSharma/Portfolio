import type { Dashboard, HeadlineFigure } from "../types";
import { fmt1 } from "../format";
import { acrossScenarios, embeddedWorstOverall, runCounts, sunBlindSpot } from "./derive";
import { evidence } from "./evidence";
import { AccuracyView } from "./views/accuracy";
import { BlindSpotView } from "./views/blind-spot";
import { EmbeddedView } from "./views/embedded";
import { OverviewView } from "./views/overview";
import { ProvenanceView } from "./views/provenance";

function headline(): HeadlineFigure[] {
  const c = runCounts();
  const blind = sunBlindSpot();
  const w = embeddedWorstOverall();
  const esp = evidence.esp32();
  return [
    {
      label: "Gyro alone",
      value: `${fmt1(acrossScenarios("gyro_only", "rms_total_deg_mean"))}°`,
      detail: `Typical error, averaged over ${c.scenarios} two-minute scenarios. Nothing corrects the drift.`,
      tone: "negative",
    },
    {
      label: "Gyro + Sun + gravity",
      value: `${fmt1(acrossScenarios("mekf_sun_gravity", "rms_total_deg_mean"))}°`,
      detail: "The Kalman filter with both reference directions, on the same scenarios.",
      tone: "positive",
    },
    {
      label: "Hidden from the Sun",
      value: `${fmt1(blind.sunOnlyAlongMin)}–${fmt1(blind.sunOnlyAlongMax)}°`,
      detail: "Error a Sun sensor alone can't remove while sitting still: the roll around the Sun line.",
      tone: "gold",
    },
    {
      label: "C in float vs Python",
      value: `${w.f32.toFixed(4)}°`,
      detail: "Largest difference over every estimator and 120 s scenario. The Sun sensor's own noise is 0.5°.",
      tone: "positive",
    },
    {
      label: "On a real ESP32",
      value: "Not yet",
      detail: `The firmware builds (${(esp["App size"] ?? "size unknown").split(" (")[0]}); it's waiting for a board.`,
      tone: "neutral",
    },
  ];
}

export const heliosDashboard: Dashboard = {
  views: [
    { id: "overview", label: "Overview", description: "Can a cheap Sun sensor keep a cheap gyro from drifting? What was built, and the results so far." },
    { id: "accuracy", label: "Accuracy", description: "Typical attitude error of five estimators over eight simulated scenarios and eight seeds." },
    { id: "blind-spot", label: "The Sun's blind spot", description: "Why a Sun sensor alone can never see a roll around the line to the Sun, in numbers." },
    { id: "embedded", label: "In C", description: "All five estimators in C for the ESP32, checked against Python in double and float." },
    { id: "provenance", label: "Provenance", description: "The commit and the SHA-256 of every evidence file, checked at build time." },
  ],
  run() {
    const s = evidence.source();
    return {
      run: `run ${s.run}`,
      measuredAt: evidence.metadata().generated_utc,
      commit: s.commit,
      uncommitted: [],
    };
  },
  headline,
  renderView(viewId) {
    switch (viewId) {
      case "overview":
        return <OverviewView figures={headline()} />;
      case "accuracy":
        return <AccuracyView />;
      case "blind-spot":
        return <BlindSpotView />;
      case "embedded":
        return <EmbeddedView />;
      case "provenance":
        return <ProvenanceView />;
      default:
        return null;
    }
  },
};
