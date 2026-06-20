import type { ProjectStatus } from "@/types";

export const statusLabels: Record<ProjectStatus, string> = {
  shipped: "Shipped",
  "in-progress": "In Progress",
  experiment: "Experiment",
  archived: "Archived",
};

export const statusStyles: Record<ProjectStatus, string> = {
  shipped: "border-chart-2/40 text-chart-2",
  "in-progress": "border-gold/40 text-gold",
  experiment: "border-chart-5/50 text-chart-5",
  archived: "border-foreground/20 text-muted-foreground",
};
