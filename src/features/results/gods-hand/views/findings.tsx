import { Card, ViewSection } from "../../ui";
import { evidence } from "../evidence";
import { FindingsExplorer } from "../findings-explorer";
import { Source } from "../shared";

export function FindingsView() {
  const log = evidence.findings();
  return (
    <ViewSection
      id="log"
      title="What we learned, including what went wrong"
      intro={
        <p>
          Failures, dead ends and the agent&apos;s own mistakes carry the same weight as successes. This log is
          written by hand, by the agent and the owner, as each thing is learned. It is the one source on this
          dashboard that isn&apos;t tool output, so every entry names the evidence to re-check it against.
        </p>
      }
    >
      <Card source={<Source from="findings" field="findings[]" />}>
        <FindingsExplorer findings={log.findings} />
      </Card>
    </ViewSection>
  );
}
