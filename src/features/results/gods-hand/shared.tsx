import { FILES, rawUrl } from "./evidence";
import type { Role, SpeedCall } from "./derive";
import { Pill, SourceNote, type Tone } from "../ui";

type FileKey = keyof typeof FILES;

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

/** Text colour for a configuration's marks in charts. */
export const roleColor: Record<Role, string> = {
  baseline: "text-foreground/55",
  accept: "text-positive",
  combined: "text-gold",
  reject: "text-negative",
};

const roleLabel: Record<Role, string> = {
  baseline: "Baseline",
  accept: "Accepted",
  combined: "Accepted set",
  reject: "Rejected",
};
const roleTone: Record<Role, Tone> = { baseline: "neutral", accept: "positive", combined: "gold", reject: "negative" };

export function RolePill({ role }: { role: Role }) {
  return (
    <Pill tone={roleTone[role]}>
      {role === "accept" ? "✓ " : role === "reject" ? "✕ " : ""}
      {roleLabel[role]}
    </Pill>
  );
}

const callLabel: Record<SpeedCall, string> = {
  faster: "Faster in every round",
  slower: "Slower in every round",
  noise: "Inside the noise",
  baseline: "Reference",
};
const callTone: Record<SpeedCall, Tone> = { faster: "positive", slower: "negative", noise: "neutral", baseline: "neutral" };

export function CallPill({ call }: { call: SpeedCall }) {
  return <Pill tone={callTone[call]}>{callLabel[call]}</Pill>;
}

export function VerdictPill({ verdict }: { verdict: "accept" | "reject" }) {
  return verdict === "accept" ? <Pill tone="positive">✓ Accepted</Pill> : <Pill tone="negative">✕ Rejected</Pill>;
}

/** Plain-English meaning of each reason code the checker can give. */
export const REASONS: Record<string, string> = {
  undeclared_drop: "The live database lost a guarantee the claim didn't declare.",
  drop_without_compensation: "A rule depends on the dropped guarantee, and no accepted Lean proof covers the loss.",
  compensation_unproved: "The Lean statement that would make the change safe has no accepted proof.",
  refuted_in_lean: "Lean proves the change does not behave like the original.",
  differs_from_model: "The real code disagreed with the compiled spec on random operation sequences.",
};

/** Colours for up to three rounds of the same configuration. */
export const ROUND_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-5)"];
