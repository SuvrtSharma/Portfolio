import type { Profile } from "@/types";

export const profile: Profile = {
  name: "Suvrt Sharma",
  role: "Software Engineer",
  tagline:
    "Event-driven, distributed systems for healthcare at scale — with a past life building autonomous agri-drones.",
  bio: "Each island here is a domain I've sailed: a healthcare monolith I'm helping break into microservices, the event-driven seas of Dapr and Camunda, and an R&D chapter teaching drones to read crops from the sky. Chart a course and explore.",
  email: "suvrt082003@gmail.com",
  resumeUrl: "/resume.pdf",
  socials: [
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/suvrt-sharma-b60918225/",
      kind: "linkedin",
    },
    { label: "Email", href: "mailto:suvrt082003@gmail.com", kind: "email" },
    { label: "Résumé", href: "/resume.pdf", kind: "resume" },
    // TODO: add a GitHub link once the handle is confirmed.
  ],
};
