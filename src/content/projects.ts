import type { Project } from "@/types";

export const projects: Project[] = [
  {
    slug: "arqon",
    title: "Arqon: SQL Architecture Studio",
    shortTitle: "Arqon",
    tagline:
      "Turns SQL Server stored procedures into interactive diagrams, scores, and simulations.",
    description:
      "A VS Code extension backed by a local .NET engine. Arqon parses T-SQL into control-flow graphs, resolves dependencies, scores each procedure deterministically, reads execution plans, and simulates what-if changes. An optional AI mentor explains findings, but every fact on screen comes from the engine, and the engine verifies the AI's suggested fixes.",
    highlights: [
      "Published on the VS Code Marketplace; your SQL never leaves your machine",
      "Layered .NET 10 engine with build-time dependency-rule tests",
      "Deterministic, confidence-weighted scoring with a visible breakdown",
      "Execution-plan heatmaps and a what-if re-costing simulator",
      "AI suggestions verified by re-running the engine's own detectors",
    ],
    tech: [".NET 10", "C#", "ScriptDom", "React", "TypeScript", "VS Code API", "SQL Server"],
    status: "shipped",
    year: 2026,
    links: [
      {
        label: "VS Code Marketplace",
        href: "https://marketplace.visualstudio.com/items?itemName=SuvrtSharma.arqon",
        kind: "live",
      },
    ],
    featured: true,
  },
  {
    slug: "caresmartz-evv",
    title: "CareSmartz360 — EVV Microservices",
    shortTitle: "CareSmartz360",
    tagline:
      "Migrating healthcare EVV from a monolith to event-driven .NET microservices.",
    description:
      "At CareSmartz360, I help move Electronic Visit Verification out of a single monolith into independently deployable .NET microservices — coordinating long-running, compliance-critical workflows across 13 US state aggregators with Dapr, Camunda, and Apache Airflow.",
    highlights: [
      "EVV integrations for 13 US state aggregators, decoupled into services",
      "Event-driven messaging with Dapr pub/sub and state stores",
      "Long-running workflows with Camunda (BPMN/CMMN) and Apache Airflow",
      "Idempotent APIs and fault-tolerant, retrying event pipelines",
      "HIPAA-compliant FHIR integration via Azure Health Data Services",
    ],
    tech: [".NET", "ASP.NET Core", "Dapr", "Camunda", "Apache Airflow", "Azure", "FHIR"],
    status: "in-progress",
    year: 2025,
    featured: true,
  },
  {
    slug: "clock-in-out",
    title: "Clock-In / Clock-Out Microservice",
    tagline: "A resilient Dapr microservice for caregiver attendance.",
    description:
      "A standalone attendance service designed with Dapr and microservice patterns — reliable, auditable clock-in/clock-out that stays consistent across distributed systems and survives network and timezone gremlins.",
    highlights: [
      "Dapr building blocks for pub/sub, state, and resilient invocation",
      "Idempotent, audit-friendly attendance events",
      "Timezone- and DST-correct timestamps across US states",
      "Designed with senior engineers in architecture-review sessions",
    ],
    tech: ["ASP.NET Core", "C#", "Dapr", "Event-Driven"],
    status: "shipped",
    year: 2025,
    featured: false,
  },
  {
    slug: "crophawk",
    title: "CropHawk — Agritech Drone Platform",
    tagline: "Autonomous agri-drones with real-time, on-device crop ML.",
    description:
      "As an R&D Engineer at JUIT on a project funded by Kanpur Fertiliser & Chemical Ltd (KFCL), I built custom frameworks for agricultural drones — autonomous flight, edge ML running on-the-go, and IoT/robotics integration for precision agriculture. The work became a published, presented research paper.",
    highlights: [
      "Custom drone frameworks for real-world farm automation",
      "On-device (edge) ML for real-time crop analysis, no cloud round-trip",
      "Multi-spectral image processing for early nutrient-deficiency detection",
      "IoT + robotics integration; hands-on embedded systems",
      "Published & presented a research paper at IC3SE",
    ],
    tech: ["Python", "C++", "Edge ML", "Computer Vision", "IoT", "Robotics"],
    status: "shipped",
    year: 2024,
    featured: true,
  },
  {
    slug: "blockchain-file-storage",
    title: "Blockchain-based File Storage",
    tagline: "Decentralized, tamper-proof file storage.",
    description:
      "A decentralized storage system using content-addressable hashing for tamper-proof integrity, deduplication, and controlled, immutable file sharing across distributed nodes.",
    highlights: [
      "Content-addressable storage via hashing, with deduplication",
      "Tamper-proof integrity and verification across nodes",
      "Secure, controlled distributed file access",
    ],
    tech: ["Blockchain", "Hashing", "Distributed Systems"],
    status: "experiment",
    featured: false,
  },
  {
    slug: "pathfinding-visualizer",
    title: "Pathfinding Algorithm Visualizer",
    tagline: "Watch Dijkstra, A*, and BFS explore a grid in real time.",
    description:
      "An interactive visualizer for graph-traversal algorithms — animating node exploration and shortest-path updates, and comparing algorithm efficiency under varying conditions.",
    highlights: [
      "Real-time visualization of Dijkstra, A*, and BFS",
      "Animated node exploration and shortest-path updates",
      "Side-by-side performance comparison",
    ],
    tech: ["C++", "React", "JavaScript", "Algorithms"],
    status: "experiment",
    featured: false,
  },
];
