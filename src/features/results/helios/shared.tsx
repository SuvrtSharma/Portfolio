import { FILES, rawUrl, type Estimator, type FileKey } from "./evidence";
import { SourceNote } from "../ui";

/** A hosted evidence file as a link target: its URL and its file name. */
export function file(key: FileKey) {
  const path = FILES[key];
  return { href: rawUrl(path), name: path.split("/").pop() ?? path };
}

/** "Source: <file> → <field>" for one or more evidence files. */
export function Source({ from, field, calc }: { from: FileKey | FileKey[]; field?: string; calc?: string }) {
  const keys = Array.isArray(from) ? from : [from];
  return <SourceNote files={keys.map(file)} field={field} calc={calc} />;
}

export const VIEW = (id: string) => `/results/helios/${id}`;

/** Plain names and one-line descriptions, simplest estimator first. */
export const ESTIMATOR_INFO: Record<Estimator, { name: string; idea: string; color: string; textClass: string }> = {
  gyro_only: {
    name: "Gyro only",
    idea: "Adds up the gyro's turns. Nothing corrects it, so it drifts.",
    color: "var(--chart-1)",
    textClass: "text-chart-1",
  },
  complementary: {
    name: "Complementary",
    idea: "Gyro, plus a gentle nudge toward where the Sun sensor sees the Sun.",
    color: "var(--chart-2)",
    textClass: "text-chart-2",
  },
  mahony_pi: {
    name: "Mahony PI",
    idea: "Complementary, and it also learns the gyro's constant error.",
    color: "var(--chart-3)",
    textClass: "text-chart-3",
  },
  mekf: {
    name: "Kalman (Sun)",
    idea: "A Kalman filter: tracks how unsure it is and weighs each reading.",
    color: "var(--chart-4)",
    textClass: "text-chart-4",
  },
  mekf_sun_gravity: {
    name: "Kalman (Sun + gravity)",
    idea: "The same filter, plus the accelerometer's sense of which way is down.",
    color: "var(--chart-5)",
    textClass: "text-chart-5",
  },
};

/** Shown at the top of every view: this is a project in progress. */
export function WorkInProgress() {
  return (
    <div className="rounded-lg border border-gold/40 bg-gold/[0.07] px-4 py-3 text-sm text-pretty text-foreground/90">
      <strong className="text-gold">Work in progress.</strong>{" "}
      Everything here comes from simulation, and the C code
      has so far run on a PC only. The firmware builds for the ESP32, but hasn&apos;t run on a board yet, and the
      sensor error levels are assumptions until real parts are measured. These figures will change as the hardware
      phases happen.
    </div>
  );
}
