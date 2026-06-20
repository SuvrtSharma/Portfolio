import type { World } from "@/types";

/**
 * The archipelago. Positions are in normalized map space (0–100); the renderer
 * maps them to whatever canvas it draws on. Categories — not labels — drive
 * icons and styling, so a different theme can relabel every node freely.
 */
export const world: World = {
  aspectRatio: 16 / 10,
  // Illustrated map backdrop — a painted treasure map (16:10). The node positions
  // below are tuned so each medallion lands on its island in the artwork.
  background: {
    src: "/world/archipelago.webp",
    alt: "Illustrated map of the archipelago",
    width: 2624,
    height: 1632,
  },
  nodes: [
    {
      id: "monolith-isle",
      slug: "monolith-isle",
      title: "Monolith Isle",
      summary:
        "The legacy healthcare monolith — and the art of working within constraints while carving it apart.",
      category: "monolith",
      position: { x: 20, y: 21 },
      iconKey: "monolith",
      projectSlugs: ["caresmartz-evv"],
      skillGroupIds: ["backend"],
    },
    {
      id: "microservice-reef",
      slug: "microservice-reef",
      title: "Microservice Reef",
      summary:
        "Event-driven .NET services with Dapr and Camunda — scalable, loosely coupled, resilient.",
      category: "microservice",
      position: { x: 49, y: 20 },
      iconKey: "microservice",
      projectSlugs: ["caresmartz-evv", "clock-in-out"],
      skillGroupIds: ["distributed", "backend"],
    },
    {
      id: "cloud-isles",
      slug: "cloud-isles",
      title: "Cloud Isles",
      summary:
        "Azure Functions, Blob Storage, and FHIR pipelines — serverless infrastructure for compliant data exchange.",
      category: "infrastructure",
      position: { x: 78, y: 24 },
      iconKey: "cloud",
      skillGroupIds: ["cloud"],
    },
    {
      id: "crophawk-atoll",
      slug: "crophawk-atoll",
      title: "CropHawk Atoll",
      summary:
        "Autonomous agri-drones, edge ML, and IoT telemetry from a funded AgriTech startup.",
      category: "project",
      position: { x: 26, y: 51 },
      iconKey: "drone",
      projectSlugs: ["crophawk"],
      skillGroupIds: ["drones-ml"],
    },
    {
      id: "rnd-frontier",
      slug: "rnd-frontier",
      title: "R&D Frontier",
      summary:
        "Side projects and experiments — decentralized storage and algorithm visualizers.",
      category: "research",
      position: { x: 52, y: 54 },
      iconKey: "research",
      projectSlugs: ["blockchain-file-storage", "pathfinding-visualizer"],
      skillGroupIds: ["frontend", "foundations"],
    },
    {
      id: "graveyard-of-bugs",
      slug: "graveyard-of-bugs",
      title: "Graveyard of Bugs",
      summary: "Tales of bugs, failures, and the lessons they left behind.",
      category: "graveyard",
      position: { x: 83, y: 54 },
      iconKey: "graveyard",
      bugStoryIds: [
        "retry-storm",
        "timezone-kraken",
        "duplicate-events",
        "edge-model-drift",
      ],
    },
    {
      id: "harbor",
      slug: "harbor",
      title: "Harbor",
      summary: "Résumé, LinkedIn, and ways to reach me.",
      category: "harbor",
      position: { x: 23, y: 79 },
      iconKey: "harbor",
    },
  ],
  edges: [
    { from: "monolith-isle", to: "microservice-reef" },
    { from: "microservice-reef", to: "cloud-isles" },
    { from: "monolith-isle", to: "crophawk-atoll" },
    { from: "microservice-reef", to: "rnd-frontier" },
    { from: "cloud-isles", to: "graveyard-of-bugs" },
    { from: "rnd-frontier", to: "graveyard-of-bugs" },
    { from: "rnd-frontier", to: "harbor" },
    { from: "crophawk-atoll", to: "harbor" },
  ],
};
