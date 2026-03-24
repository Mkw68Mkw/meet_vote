"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { type MouseEvent, useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/lib/api"

const TOKEN_KEY = "meetvote_access_token"
const USERNAME_KEY = "meetvote_username"

export function HeaderAuthControls() {
  const pathname = usePathname()
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const storedUsername = localStorage.getItem(USERNAME_KEY)
    if (!token) {
      setIsLoggedIn(false)
      setUsername(null)
      return
    }

    let isCancelled = false
    const isProtectedPath = pathname.startsWith("/create") || pathname.startsWith("/dashboard")
    const validateSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USERNAME_KEY)
          if (!isCancelled) {
            setIsLoggedIn(false)
            setUsername(null)
            if (response.status === 401) {
              toast.error("Session abgelaufen, loggen Sie sich nochmals ein.")
              if (isProtectedPath) {
                router.push("/login")
              }
            }
          }
          return
        }

        const me = await response.json()
        if (!isCancelled) {
          setIsLoggedIn(true)
          setUsername(typeof me?.username === "string" ? me.username : storedUsername)
        }
      } catch {
        if (!isCancelled) {
          setIsLoggedIn(Boolean(token))
          setUsername(storedUsername)
        }
      }
    }

    void validateSession()
    const intervalId = window.setInterval(() => {
      void validateSession()
    }, 30000)

    return () => {
      isCancelled = true
      window.clearInterval(intervalId)
    }
  }, [pathname, router])

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
    setIsLoggedIn(false)
    setUsername(null)
    toast.error("Du wurdest ausgeloggt.")
    router.push("/")
  }

  const handleCreateClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isLoggedIn) {
      return
    }
    event.preventDefault()
    toast.error("Bitte anmelden, um eine Umfrage zu erstellen.")
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/create" onClick={handleCreateClick}>
        <Button size="sm">Umfrage erstellen</Button>
      </Link>

      {isLoggedIn ? (
        <>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Dashboard
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Eingeloggt als <span className="font-medium text-foreground">{username ?? "User"}</span>
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </>
      ) : (
        <Link href="/login">
          <Button variant="outline" size="sm">
            Login
          </Button>
        </Link>
      )}
    </div>
  )
}
