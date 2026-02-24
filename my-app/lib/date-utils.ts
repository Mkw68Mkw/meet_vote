export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  })
}

export function formatDateLong(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

export function getWeekday(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("de-DE", { weekday: "short" })
}
