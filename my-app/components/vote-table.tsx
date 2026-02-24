"use client"

import { cn } from "@/lib/utils"
import { formatDate, getWeekday } from "@/lib/date-utils"
import { VoteDisplay } from "./vote-toggle"
import type { Poll, VoteValue } from "@/lib/types"
import { Trophy } from "lucide-react"

interface VoteTableProps {
  poll: Poll
}

export function VoteTable({ poll }: VoteTableProps) {
  // Calculate scores for each date
  const dateScores = poll.dates.map((date) => {
    let score = 0
    for (const vote of poll.votes) {
      const selection = vote.selections.find((s) => s.date === date)
      if (selection) {
        if (selection.value === "yes") score += 2
        else if (selection.value === "maybe") score += 1
      }
    }
    return { date, score }
  })

  const maxScore = Math.max(...dateScores.map((d) => d.score))
  const bestDates = dateScores.filter((d) => d.score === maxScore && d.score > 0).map((d) => d.date)

  if (poll.votes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Noch keine Stimmen abgegeben.</p>
        <p className="text-sm mt-1">Sei der Erste!</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full min-w-[400px]">
        <thead>
          <tr>
            <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
              Teilnehmer
            </th>
            {poll.dates.map((date) => (
              <th
                key={date}
                className={cn(
                  "py-3 px-2 text-center",
                  bestDates.includes(date) && "bg-success/10 rounded-t-lg"
                )}
              >
                <div className="flex flex-col items-center gap-0.5">
                  {bestDates.includes(date) && (
                    <Trophy className="w-4 h-4 text-success mb-1" />
                  )}
                  <span className="text-xs text-muted-foreground">{getWeekday(date)}</span>
                  <span className="text-sm font-medium text-foreground">{formatDate(date)}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {poll.votes.map((vote) => (
            <tr key={vote.name} className="border-t border-border">
              <td className="py-3 px-2">
                <span className="font-medium text-foreground">{vote.name}</span>
              </td>
              {poll.dates.map((date) => {
                const selection = vote.selections.find((s) => s.date === date)
                return (
                  <td
                    key={date}
                    className={cn(
                      "py-3 px-2",
                      bestDates.includes(date) && "bg-success/10"
                    )}
                  >
                    <div className="flex justify-center">
                      {selection ? (
                        <VoteDisplay value={selection.value} />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border">
            <td className="py-3 px-2 text-sm font-medium text-muted-foreground">
              Punkte
            </td>
            {dateScores.map(({ date, score }) => (
              <td
                key={date}
                className={cn(
                  "py-3 px-2 text-center",
                  bestDates.includes(date) && "bg-success/10 rounded-b-lg"
                )}
              >
                <span
                  className={cn(
                    "text-sm font-bold",
                    bestDates.includes(date) ? "text-success" : "text-muted-foreground"
                  )}
                >
                  {score}
                </span>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
