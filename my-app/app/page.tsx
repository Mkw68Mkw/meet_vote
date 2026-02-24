"use client"

import React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HeaderAuthControls } from "@/components/header-auth-controls"
import { Calendar, Users, Zap, CheckCircle2 } from "lucide-react"

export default function HomePage() {
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

      {/* Hero Section */}
      <main>
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Kostenlos & ohne Registrierung
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground max-w-3xl mx-auto leading-tight text-balance">
              Termine abstimmen.
              <br />
              <span className="text-primary">Ohne Login. In 10 Sekunden.</span>
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto text-pretty">
              Erstelle Terminumfragen und teile sie mit deinem Team. 
              Alle stimmen ab, du siehst sofort das beste Datum.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create">
                <Button size="lg" className="text-base px-8 py-6 h-auto">
                  <Calendar className="w-5 h-5 mr-2" />
                  Neue Umfrage erstellen
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground">So einfach funktioniert es</h2>
              <p className="mt-3 text-muted-foreground">In drei Schritten zum perfekten Termin</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <FeatureCard
                step="1"
                icon={<Calendar className="w-6 h-6" />}
                title="Termine vorschlagen"
                description="Wähle mehrere Daten aus, die für dich in Frage kommen."
              />
              <FeatureCard
                step="2"
                icon={<Users className="w-6 h-6" />}
                title="Link teilen"
                description="Teile den Link mit allen Teilnehmern per Mail, Chat oder SMS."
              />
              <FeatureCard
                step="3"
                icon={<CheckCircle2 className="w-6 h-6" />}
                title="Abstimmen"
                description="Alle stimmen ab und du siehst sofort das beste Ergebnis."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Bereit loszulegen?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Erstelle jetzt deine erste Terminumfrage. Kostenlos und ohne Anmeldung.
              </p>
              <Link href="/create" className="inline-block mt-6">
                <Button size="lg" className="text-base">
                  Jetzt starten
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>MeetVote - Einfache Terminabstimmung</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  step,
  icon,
  title,
  description,
}: {
  step: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="relative p-6 rounded-xl bg-background border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
        {step}
      </div>
      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg text-foreground">{title}</h3>
      <p className="mt-2 text-muted-foreground text-sm">{description}</p>
    </div>
  )
}
