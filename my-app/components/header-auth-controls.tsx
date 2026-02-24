"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

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
    setIsLoggedIn(Boolean(token))
    setUsername(storedUsername)
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
    setIsLoggedIn(false)
    setUsername(null)
    toast.error("Du wurdest ausgeloggt.")
    router.push("/")
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/create">
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
