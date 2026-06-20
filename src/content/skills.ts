import type { SkillGroup } from "@/types";

export const skillGroups: SkillGroup[] = [
  {
    id: "backend",
    label: "Backend & APIs",
    iconKey: "backend",
    skills: ["C#", ".NET", "ASP.NET Core", ".NET Framework", "REST APIs"],
  },
  {
    id: "distributed",
    label: "Distributed & Workflows",
    iconKey: "microservice",
    skills: [
      "Microservices",
      "Dapr",
      "Event-Driven",
      "Camunda BPMN",
      "CMMN",
      "Apache Airflow",
    ],
  },
  {
    id: "cloud",
    label: "Cloud & Data",
    iconKey: "cloud",
    skills: ["Azure", "Azure Functions", "Blob Storage", "FHIR", "Power BI"],
  },
  {
    id: "drones-ml",
    label: "Drones & Edge ML",
    iconKey: "ml",
    skills: [
      "Python",
      "C++",
      "Edge ML",
      "Computer Vision",
      "IoT",
      "Embedded Systems",
    ],
  },
  {
    id: "frontend",
    label: "Frontend",
    iconKey: "frontend",
    skills: ["React", "TypeScript", "JavaScript", "Tailwind CSS"],
  },
  {
    id: "foundations",
    label: "Practices & Tools",
    iconKey: "tools",
    skills: [
      "Git",
      "Docker",
      "GitHub Copilot",
      "SonarQube",
      "HIPAA Compliance",
    ],
  },
];
