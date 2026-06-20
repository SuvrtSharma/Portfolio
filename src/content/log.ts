import type { LogEntry } from "@/types";

/** The Captain's Log — career timeline, oldest first. */
export const logEntries: LogEntry[] = [
  {
    id: "btech",
    year: 2021,
    title: "Started B.Tech, JUIT",
    description:
      "Began Computer Science at Jaypee University of Information Technology.",
    iconKey: "education",
  },
  {
    id: "rnd-juit",
    year: "2022 – 24",
    title: "R&D Engineer · JUIT × KFCL",
    description:
      "Built CropHawk — autonomous agri-drones with on-device ML (KFCL-funded from 2023); published & presented a paper at IC3SE.",
    iconKey: "drone",
  },
  {
    id: "apprenticeship",
    year: "Jan 2025",
    title: "Apprenticeship · CareSmartz360",
    description:
      "Intensive training in microservices, design patterns, Docker, Git, and Dapr — first proof-of-concept services.",
    iconKey: "education",
  },
  {
    id: "jse-1",
    year: "Jul 2025",
    title: "Junior Software Engineer",
    description:
      "HIPAA-certified. Designed a Dapr Clock-In/Clock-Out microservice and migrated legacy .NET reports to Power BI.",
    iconKey: "microservice",
  },
  {
    id: "jse-2",
    year: "Oct 2025",
    title: "Junior Software Engineer",
    description:
      "Building event-driven workflows with Dapr, Camunda, and Apache Airflow; exploring spec-driven, AI-assisted development.",
    iconKey: "workflow",
  },
  {
    id: "building-in-public",
    year: 2026,
    title: "Building in Public",
    description: "Open-source and side projects — including this archipelago.",
    iconKey: "sparkles",
  },
];
