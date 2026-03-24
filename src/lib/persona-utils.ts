export type Persona = "corporate" | "academic";

export const personaConfig = {
  corporate: {
    label: "Corporate / Business",
    summaryHeader: "Executive Summary",
    tasksHeader: "Action Items",
    decisionsHeader: "Key Decisions",
    datesHeader: "Important Deadlines",
    highlightClass: "border-indigo-500/30 bg-indigo-500/5",
  },
  academic: {
    label: "Academic / Lecture",
    summaryHeader: "Lecture Overview",
    tasksHeader: "Study Tasks & Assignments",
    decisionsHeader: "Core Concepts Covered",
    datesHeader: "Exam & Due Dates",
    highlightClass: "border-emerald-500/30 bg-emerald-500/5",
  },
};
