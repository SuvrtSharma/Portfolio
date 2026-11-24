import { FILES, rawUrl, type Bal, type FileKey, type ModelEvent } from "./evidence";
import { Pill, SourceNote, Td } from "../ui";

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

export function AcceptedPill({ accepted }: { accepted: boolean }) {
  return accepted ? <Pill tone="positive">✓ accepted</Pill> : <Pill tone="negative">✕ rejected</Pill>;
}

export const COMPONENTS = ["fee", "principal", "excess"] as const;

/** An amount in the model's minor units, with a true minus sign. */
export function amount(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : `${n}`;
}

export function describeEvent(e: ModelEvent["event"]): string {
  switch (e.kind) {
    case "disburse":
      return `Disburse ${e.amount}`;
    case "charge":
      return `Charge a fee of ${e.amount}`;
    case "pay":
      return `Pay ${e.amount} (${e.order})`;
    case "reverse":
      return `Reverse event ${e.target}`;
  }
}

/** Three cells, one per balance component, marking those that differ from `other`. */
export function BalCells({ bal, other }: { bal: Bal; other?: Bal }) {
  return (
    <>
      {COMPONENTS.map((k) => {
        const differs = other !== undefined && other[k] !== bal[k];
        return (
          <Td key={k} numeric className={differs ? "font-semibold text-negative" : undefined}>
            {amount(bal[k])}
          </Td>
        );
      })}
    </>
  );
}

export const VIEW = (id: string) => `/results/retroactive-ledger/${id}`;
