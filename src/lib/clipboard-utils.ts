export function formatImpsAsMarkdown(
  type: string,
  items: Array<{ description: string; owner_name?: string | null; date_info?: string | null }>
): string {
  const header = type === "action_item"
    ? "## Action Items"
    : type === "decision"
    ? "## Decisions"
    : type === "deadline"
    ? "## Key Dates"
    : "## Summary";

  if (type === "summary") {
    return `${header}\n\n${items[0]?.description ?? ""}`;
  }

  const lines = items.map((item) => {
    let line = `- ${item.description}`;
    if (item.owner_name && item.owner_name !== "Unassigned") {
      line += ` (@${item.owner_name})`;
    }
    if (item.date_info) {
      line += ` — ${item.date_info}`;
    }
    return line;
  });

  return `${header}\n\n${lines.join("\n")}`;
}
