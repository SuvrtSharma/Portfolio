import Link from "next/link";
import type { HeadlineFigure } from "../../types";
import { fmt1 } from "../../format";
import { Card, Definitions, Stat, ViewSection } from "../../ui";
import { acrossScenarios, runCounts, sunBlindSpot } from "../derive";
import { ESTIMATORS } from "../evidence";
import { ESTIMATOR_INFO, Source, VIEW, WorkInProgress } from "../shared";

const STEPS = [
  {
    title: "Simulate",
    body: "A known motion, the Sun's real position for a time and place, and fake low-cost sensors with noise, bias, temperature drift, dropouts and saturation.",
  },
  {
    title: "Hide the answer",
    body: "Estimators get only what a real device could know. The true attitude goes only to the grader, and a test checks the boundary.",
  },
  {
    title: "Five estimators",
    body: "From plain gyro integration up to a Kalman filter that also uses gravity, each built on the one before.",
  },
  {
    title: "Grade",
    body: "Every run is split into the error a Sun sensor can see and the error it can't, over 8 scenarios and 8 seeds.",
  },
  {
    title: "Port to C",
    body: "Every estimator rewritten in C for a microcontroller, then checked sample by sample against Python.",
  },
];

export function OverviewView({ figures }: { figures: HeadlineFigure[] }) {
  const c = runCounts();
  const blind = sunBlindSpot();
  const best = acrossScenarios("mekf_sun_gravity", "rms_total_deg_mean");
  const worst = acrossScenarios("gyro_only", "rms_total_deg_mean");

  const minute = [
    {
      term: "Question",
      detail:
        "Cheap gyroscopes drift: tiny errors add up until the device has no idea which way it's pointing. Can a cheap Sun sensor stop that drift, and how far can it go?",
    },
    {
      term: "What was done",
      detail: `A simulator for a low-cost gyro, accelerometer and Sun sensor, and five ways to estimate orientation from them, compared over ${c.scenarios} scenarios and ${c.seeds} random seeds (${c.runs} runs). All five were then ported to C for an ESP32 microcontroller.`,
    },
    {
      term: "Result so far",
      detail: `With the gyro alone, the typical error averages ${fmt1(worst)}° over two minutes. A Sun sensor removes almost all of the error it can see, but a turn around the line to the Sun stays invisible: sitting still, that part is still ${fmt1(blind.sunOnlyAlongMin)}–${fmt1(blind.sunOnlyAlongMax)}° for every Sun-only method. Adding gravity as a second direction brings the average to ${fmt1(best)}°.`,
    },
    {
      term: "Still to do",
      detail: "Run the C code on a real ESP32 and time it, then build a hand-turned test rig to compare the simulation with real sensors.",
    },
  ];

  return (
    <div className="space-y-14">
      <WorkInProgress />

      <ViewSection id="minute" title="The short version">
        <Card>
          <Definitions items={minute} />
        </Card>
      </ViewSection>

      <ViewSection id="headline" title="Headline figures">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {figures.map((f) => (
            <Stat key={f.label} label={f.label} value={f.value} detail={f.detail} tone={f.tone} />
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          <Source from={["summary", "embedded"]} calc="acrossScenarios, sunBlindSpot, embeddedWorst" />
        </div>
      </ViewSection>

      <ViewSection id="method" title="How it works">
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-lg border border-gold/15 bg-ocean-panel/50 p-4">
              <span className="text-xs font-semibold text-gold">{i + 1}</span>
              <h3 className="mt-1 font-sans text-sm font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1 text-sm text-pretty text-foreground/75">{s.body}</p>
            </li>
          ))}
        </ol>
      </ViewSection>

      <ViewSection id="estimators" title="The five estimators">
        <Card>
          <ul className="space-y-2 text-sm">
            {ESTIMATORS.map((e) => (
              <li key={e} className="flex flex-wrap gap-x-2">
                <span className={`font-semibold ${ESTIMATOR_INFO[e].textClass}`}>{ESTIMATOR_INFO[e].name}</span>
                <span className="text-foreground/80">{ESTIMATOR_INFO[e].idea}</span>
              </li>
            ))}
          </ul>
        </Card>
        <p className="mt-4 text-sm text-foreground/80">
          See the <Link href={VIEW("accuracy")} className="text-gold hover:underline">accuracy</Link> of each, why the{" "}
          <Link href={VIEW("blind-spot")} className="text-gold hover:underline">Sun alone isn&apos;t enough</Link>, and
          how they did <Link href={VIEW("embedded")} className="text-gold hover:underline">in C</Link>.
        </p>
      </ViewSection>
    </div>
  );
}
