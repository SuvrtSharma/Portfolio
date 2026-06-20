import type { BugStory } from "@/types";

/** Graveyard of Bugs — failures and the lessons they left behind. */
export const bugStories: BugStory[] = [
  {
    id: "retry-storm",
    title: "The Infinite Retry Storm",
    summary:
      "A poisoned message made a Dapr subscriber retry forever, hammering a downstream service until it buckled.",
    lesson:
      "Cap retries, add backoff, and dead-letter poison messages. 'Retry' without a ceiling is a DoS you wrote yourself.",
    severity: "legendary",
    tech: ["Dapr", "Event-Driven"],
  },
  {
    id: "timezone-kraken",
    title: "The Timezone Kraken",
    summary:
      "Clock-In/Clock-Out times drifted across US state timezones and DST — compliance reports disagreed with reality.",
    lesson:
      "Store UTC, keep the originating timezone, and render local. Time is a presentation concern, never a storage one.",
    severity: "high",
    tech: ["C#", ".NET"],
  },
  {
    id: "duplicate-events",
    title: "The Duplicate That Counted Twice",
    summary:
      "At-least-once delivery redelivered an event, and a visit got processed twice — before idempotency keys existed.",
    lesson:
      "Assume every message can arrive more than once. Idempotent consumers (dedupe keys) are not optional in distributed systems.",
    severity: "high",
    tech: ["Dapr", "Microservices"],
  },
  {
    id: "edge-model-drift",
    title: "Ghost in the Greenhouse",
    summary:
      "An edge crop-health model that aced the lab flagged healthy fields as sick once real sunlight and dust entered the frame.",
    lesson:
      "Validate ML on messy field data, not just clean datasets. The real world is the only test set that matters.",
    severity: "medium",
    tech: ["Edge ML", "Computer Vision"],
  },
];
