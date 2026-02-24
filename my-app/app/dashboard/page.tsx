"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, ClipboardList, ExternalLink, Lock, LockOpen, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HeaderAuthControls } from "@/components/header-auth-controls"
import { VoteTable } from "@/components/vote-table"
import type { Poll } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5000"
const TOKEN_KEY = "meetvote_access_token"
const USERNAME_KEY = "meetvote_username"

type DashboardPoll = {
  id: number
  token: string
  title: string
  description?: string
  dates: string[]
  voteCount: number
  isClosed: boolean
  createdAt: string
}

type DashboardPollDetails = {
  id: number
  token: string
  title: string
  description?: string
  dates: string[]
  votes: {
    name: string
    selections: { date: string; value: "yes" | "no" | "maybe" }[]
  }[]
  isClosed: boolean
  closedAt?: string | null
  createdAt: string
}

type DashboardCardItem = {
  poll: Poll
  token: string
  isClosed: boolean
}

type PendingAction =
  | {
      type: "close" | "delete"
      pollId: number
      pollTitle: string
    }
  | null

function mapDetailsToUiPoll(details: DashboardPollDetails): DashboardCardItem {
  return {
    poll: {
      id: String(details.id),
      title: details.title,
      description: details.description,
      dates: details.dates,
      votes: details.votes,
      createdAt: details.createdAt,
    },
    token: details.token,
    isClosed: details.isClosed,
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [cards, setCards] = useState<DashboardCardItem[]>([])
  const [closingIds, setClosingIds] = useState<number[]>([])
  const [deletingIds, setDeletingIds] = useState<number[]>([])
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [loading, setLoading] = useState(true)

  const closePoll = async (pollId: number) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      toast.error("Bitte zuerst einloggen.")
      router.push("/login")
      return
    }

    if (closingIds.includes(pollId)) {
      return
    }

    setClosingIds((prev) => [...prev, pollId])
    try {
      const response = await fetch(`${API_BASE_URL}/polls/${pollId}/close`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (!response.ok) {
        toast.error(data?.error ?? "Umfrage konnte nicht geschlossen werden.")
        return
      }

      setCards((prev) =>
        prev.map((item) =>
          item.poll.id === String(pollId)
            ? {
                ...item,
                isClosed: true,
              }
            : item
        )
      )
      toast.success("Umfrage wurde geschlossen. Der öffentliche Link ist jetzt deaktiviert.")
    } catch {
      toast.error("Server nicht erreichbar.")
    } finally {
      setClosingIds((prev) => prev.filter((id) => id !== pollId))
    }
  }

  const deletePoll = async (pollId: number) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      toast.error("Bitte zuerst einloggen.")
      router.push("/login")
      return
    }

    if (deletingIds.includes(pollId)) {
      return
    }

    setDeletingIds((prev) => [...prev, pollId])
    try {
      const response = await fetch(`${API_BASE_URL}/polls/${pollId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (!response.ok) {
        toast.error(data?.error ?? "Umfrage konnte nicht gelöscht werden.")
        return
      }

      setCards((prev) => prev.filter((item) => item.poll.id !== String(pollId)))
      toast.error("Umfrage wurde gelöscht.")
    } catch {
      toast.error("Server nicht erreichbar.")
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== pollId))
    }
  }

  const runPendingAction = async () => {
    if (!pendingAction) {
      return
    }
    if (pendingAction.type === "close") {
      await closePoll(pendingAction.pollId)
    } else {
      await deletePoll(pendingAction.pollId)
    }
    setPendingAction(null)
  }

  useEffect(() => {
    const loadPolls = async () => {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) {
        toast.error("Bitte zuerst einloggen.")
        router.push("/login")
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/polls/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 401) {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USERNAME_KEY)
          toast.error("Session abgelaufen. Bitte neu einloggen.")
          router.push("/login")
          return
        }

        const rawData = await response.json()
        if (!response.ok || !Array.isArray(rawData)) {
          const errorMessage =
            typeof rawData === "object" &&
            rawData !== null &&
            "error" in rawData &&
            typeof rawData.error === "string"
              ? rawData.error
              : "Dashboard konnte nicht geladen werden."
          toast.error(errorMessage)
          return
        }
        const data: DashboardPoll[] = rawData

        const detailResponses = await Promise.all(
          data.map((poll) =>
            fetch(`${API_BASE_URL}/polls/${poll.id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          )
        )

        if (detailResponses.some((res) => res.status === 401)) {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USERNAME_KEY)
          toast.error("Session abgelaufen. Bitte neu einloggen.")
          router.push("/login")
          return
        }

        const detailPayloads: DashboardPollDetails[] = []
        for (const detailResponse of detailResponses) {
          if (!detailResponse.ok) {
            continue
          }
          detailPayloads.push(await detailResponse.json())
        }

        setCards(detailPayloads.map(mapDetailsToUiPoll))
      } catch {
        toast.error("Server nicht erreichbar.")
      } finally {
        setLoading(false)
      }
    }

    loadPolls()
  }, [router])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-xl text-foreground">MeetVote</span>
          </Link>
          <HeaderAuthControls />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mein Dashboard</h1>
            <p className="text-muted-foreground mt-2">Hier siehst du alle Umfragen, die du erstellt hast.</p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-8 text-muted-foreground">Lade Umfragen...</CardContent>
            </Card>
          ) : cards.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Noch keine Umfragen</CardTitle>
                <CardDescription>Erstelle deine erste Umfrage, um sie hier zu sehen.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            cards.map(({ poll, token, isClosed }) => (
              <Card key={poll.id}>
                <CardHeader>
                  <CardTitle>{poll.title}</CardTitle>
                  {poll.description ? <CardDescription>{poll.description}</CardDescription> : null}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      {poll.dates.length} Termine
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {poll.votes.length} Stimmen
                    </p>
                    <p>Erstellt am: {new Date(poll.createdAt).toLocaleDateString("de-DE")}</p>
                  </div>

                  <VoteTable poll={poll} />

                  <div className="flex flex-col sm:flex-row gap-2">
                    {!isClosed ? (
                      <Link href={`/poll/${token}`}>
                        <Button variant="outline" className="w-full sm:w-auto cursor-pointer hover:brightness-90">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Öffentliche Ansicht öffnen
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" className="w-full sm:w-auto" disabled>
                        Link deaktiviert
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="w-full sm:w-auto border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-900 cursor-pointer"
                      disabled={isClosed || closingIds.includes(Number(poll.id)) || deletingIds.includes(Number(poll.id))}
                      onClick={() =>
                        setPendingAction({
                          type: "close",
                          pollId: Number(poll.id),
                          pollTitle: poll.title,
                        })
                      }
                    >
                      {isClosed ? <Lock className="w-4 h-4 mr-2" /> : <LockOpen className="w-4 h-4 mr-2" />}
                      {isClosed ? "Geschlossen" : closingIds.includes(Number(poll.id)) ? "Schließe..." : "Umfrage schließen"}
                    </Button>

                    <Button
                      variant="destructive"
                      className="w-full sm:w-auto cursor-pointer hover:brightness-90"
                      disabled={deletingIds.includes(Number(poll.id)) || closingIds.includes(Number(poll.id))}
                      onClick={() =>
                        setPendingAction({
                          type: "delete",
                          pollId: Number(poll.id),
                          pollTitle: poll.title,
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deletingIds.includes(Number(poll.id)) ? "Lösche..." : "Umfrage löschen"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {pendingAction ? (
        <div className="fixed inset-0 z-100 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {pendingAction.type === "delete" ? "Umfrage löschen?" : "Umfrage schließen?"}
              </CardTitle>
              <CardDescription>
                {pendingAction.type === "delete"
                  ? `Willst du "${pendingAction.pollTitle}" wirklich löschen? Dieser Schritt kann nicht rückgängig gemacht werden.`
                  : `Willst du "${pendingAction.pollTitle}" wirklich schließen? Danach funktioniert der öffentliche Link nicht mehr.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPendingAction(null)} className="cursor-pointer">
                Abbrechen
              </Button>
              <Button
                variant={pendingAction.type === "delete" ? "destructive" : "outline"}
                className={
                  pendingAction.type === "delete"
                    ? "cursor-pointer hover:brightness-90"
                    : "border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-900 cursor-pointer"
                }
                onClick={runPendingAction}
              >
                {pendingAction.type === "delete" ? <Trash2 className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                {pendingAction.type === "delete" ? "Jetzt löschen" : "Jetzt schließen"}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
