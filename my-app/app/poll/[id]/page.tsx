"use client"

import React from "react"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { VoteTable } from "@/components/vote-table"
import { VoteToggle } from "@/components/vote-toggle"
import { HeaderAuthControls } from "@/components/header-auth-controls"
import { Calendar, Copy, Check, Share2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { getPoll, addVoteToPoll } from "@/lib/storage"
import { formatDateLong } from "@/lib/date-utils"
import type { Poll, VoteValue, VoteSelection } from "@/lib/types"

export default function PollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [selections, setSelections] = useState<Map<string, VoteValue>>(new Map())
  const [copied, setCopied] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadPoll = () => {
      const foundPoll = getPoll(id)
      setPoll(foundPoll)
      setLoading(false)
    }
    loadPoll()
  }, [id])

  const updateSelection = (date: string, value: VoteValue) => {
    const newSelections = new Map(selections)
    newSelections.set(date, value)
    setSelections(newSelections)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Bitte gib deinen Namen ein")
      return
    }

    if (selections.size === 0) {
      setError("Bitte wähle mindestens einen Termin aus")
      return
    }

    const voteSelections: VoteSelection[] = Array.from(selections.entries()).map(
      ([date, value]) => ({ date, value })
    )

    const updatedPoll = addVoteToPoll(id, {
      name: name.trim(),
      selections: voteSelections,
    })

    if (updatedPoll) {
      setPoll(updatedPoll)
      setSubmitted(true)
      setName("")
      setSelections(new Map())
      toast.success("Deine Stimme wurde gespeichert!")
      setTimeout(() => setSubmitted(false), 3000)
    }
  }

  const copyLink = async () => {
    if (typeof window !== "undefined") {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success("Link kopiert!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="space-y-4 animate-pulse">
                  <div className="h-8 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-32 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Umfrage nicht gefunden</h1>
                <p className="text-muted-foreground mb-6">
                  Diese Umfrage existiert nicht oder wurde gelöscht.
                </p>
                <Link href="/">
                  <Button>Zurück zur Startseite</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Poll Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{poll.title}</CardTitle>
                  {poll.description && (
                    <CardDescription className="mt-2">{poll.description}</CardDescription>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0 bg-transparent">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Link teilen
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <VoteTable poll={poll} />
            </CardContent>
          </Card>

          {/* Vote Form */}
          <Card>
            <CardHeader>
              <CardTitle>Deine Stimme abgeben</CardTitle>
              <CardDescription>
                Wähle für jeden Termin, ob du Zeit hast.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted && (
                <div className="mb-6 p-4 rounded-lg bg-success/10 text-success flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Deine Stimme wurde gespeichert!</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="voter-name">Dein Name *</Label>
                  <Input
                    id="voter-name"
                    placeholder="z.B. Max Mustermann"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={error && !name.trim() ? "border-destructive" : ""}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Termine bewerten</Label>
                  <div className="grid gap-3">
                    {poll.dates.map((date) => (
                      <div
                        key={date}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                      >
                        <span className="font-medium text-foreground">
                          {formatDateLong(date)}
                        </span>
                        <VoteToggle
                          value={selections.get(date) || null}
                          onChange={(value) => updateSelection(date, value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full">
                  <Check className="w-4 h-4 mr-2" />
                  Abstimmen
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function Header() {
  return (
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
  )
}
