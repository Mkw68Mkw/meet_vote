"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Stepper } from "@/components/stepper"
import { HeaderAuthControls } from "@/components/header-auth-controls"
import { Calendar, ArrowLeft, ArrowRight, Plus, X, Copy, Check, ExternalLink } from "lucide-react"
import { toast } from "sonner"

const STEPS = ["Details", "Termine", "Fertig"]
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5000"
const TOKEN_KEY = "meetvote_access_token"
const USERNAME_KEY = "meetvote_username"

type CreatedPoll = {
  token: string
  title: string
  description?: string
  dates: string[]
}

export default function CreatePollPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dates, setDates] = useState<string[]>(["", "", ""])
  const [createdPoll, setCreatedPoll] = useState<CreatedPoll | null>(null)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; dates?: string }>({})

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      toast.error("Bitte zuerst einloggen, um eine Umfrage zu erstellen.")
      router.push("/login")
    }
  }, [router])

  const addDate = () => {
    if (dates.length < 6) {
      setDates([...dates, ""])
    }
  }

  const removeDate = (index: number) => {
    if (dates.length > 3) {
      setDates(dates.filter((_, i) => i !== index))
    }
  }

  const updateDate = (index: number, value: string) => {
    const newDates = [...dates]
    newDates[index] = value
    setDates(newDates)
  }

  const validateStep1 = () => {
    const newErrors: { title?: string } = {}
    if (!title.trim()) {
      newErrors.title = "Bitte gib einen Titel ein"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const filledDates = dates.filter((d) => d.trim() !== "")
    if (filledDates.length < 3) {
      setErrors({ dates: "Bitte wähle mindestens 3 Termine aus" })
      return false
    }
    setErrors({})
    return true
  }

  const handleNext = async () => {
    if (step === 0 && validateStep1()) {
      setStep(1)
    } else if (step === 1 && validateStep2()) {
      await createPoll()
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const createPoll = async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      toast.error("Bitte zuerst einloggen.")
      router.push("/login")
      return
    }

    setCreating(true)
    try {
      const response = await fetch(`${API_BASE_URL}/polls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          dates: dates.filter((d) => d.trim() !== "").sort(),
        }),
      })

      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USERNAME_KEY)
        toast.error("Session abgelaufen. Bitte neu einloggen.")
        router.push("/login")
        return
      }

      const data = await response.json()
      if (!response.ok) {
        toast.error(data?.error ?? "Umfrage konnte nicht erstellt werden.")
        return
      }

      setCreatedPoll({
        token: data.token,
        title: data.title,
        description: data.description ?? undefined,
        dates: Array.isArray(data.dates) ? data.dates : [],
      })
      setStep(2)
    } catch {
      toast.error("Server nicht erreichbar.")
    } finally {
      setCreating(false)
    }
  }

  const getPollUrl = () => {
    if (typeof window !== "undefined" && createdPoll) {
      return `${window.location.origin}/poll/${createdPoll.token}`
    }
    return ""
  }

  const copyLink = async () => {
    const url = getPollUrl()
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Link kopiert!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        <div className="max-w-2xl mx-auto">
          {/* Stepper */}
          <div className="mb-8">
            <Stepper steps={STEPS} currentStep={step} />
          </div>

          {/* Step 1: Details */}
          {step === 0 && (
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <CardHeader>
                <CardTitle>Umfrage-Details</CardTitle>
                <CardDescription>
                  Gib deiner Terminumfrage einen Namen und optional eine Beschreibung.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    placeholder="z.B. Team Meeting Q1"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={errors.title ? "border-destructive" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Beschreibung (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Weitere Details zur Terminumfrage..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleNext}>
                    Weiter
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Dates */}
          {step === 1 && (
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <CardHeader>
                <CardTitle>Termine auswählen</CardTitle>
                <CardDescription>
                  Wähle 3-6 mögliche Termine für deine Umfrage aus.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {dates.map((date, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => updateDate(index, e.target.value)}
                        className="flex-1"
                      />
                      {dates.length > 3 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDate(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {dates.length < 6 && (
                  <Button variant="outline" onClick={addDate} className="w-full bg-transparent">
                    <Plus className="w-4 h-4 mr-2" />
                    Datum hinzufügen
                  </Button>
                )}

                {errors.dates && (
                  <p className="text-sm text-destructive text-center">{errors.dates}</p>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zurück
                  </Button>
                  <Button onClick={handleNext} disabled={creating}>
                    {creating ? "Erstelle..." : "Umfrage erstellen"}
                    <Check className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Success */}
          {step === 2 && createdPoll && (
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl">Umfrage erstellt!</CardTitle>
                <CardDescription>
                  Teile diesen Link mit allen Teilnehmern.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium text-foreground mb-1">{createdPoll.title}</p>
                  {createdPoll.description && (
                    <p className="text-sm text-muted-foreground">{createdPoll.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {createdPoll.dates.length} Termine zur Auswahl
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Umfrage-Link</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={getPollUrl()}
                      className="font-mono text-sm"
                    />
                    <Button onClick={copyLink} variant="outline">
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Kopiert!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Kopieren
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => router.push(`/poll/${createdPoll.token}`)}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Zur Umfrage
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(0)
                      setTitle("")
                      setDescription("")
                      setDates(["", "", ""])
                      setCreatedPoll(null)
                    }}
                    className="flex-1"
                  >
                    Neue Umfrage erstellen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
