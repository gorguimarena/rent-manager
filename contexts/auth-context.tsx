"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: number
  username: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isAuthenticated: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Vérifier l'état de l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth")
        const data = await response.json()

        if (data.authenticated) {
          setUser(data.user)
          setIsAuthenticated(true)
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("Erreur de vérification d'authentification:", error)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log("Tentative de connexion avec:", { username, password })

      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      console.log("Réponse du serveur:", response.status)

      const data = await response.json()
      console.log("Données reçues:", data)

      if (!response.ok) {
        console.error("Erreur de connexion:", data.error)
        throw new Error(data.error || "Erreur de connexion")
      }

      setUser(data.user)
      setIsAuthenticated(true)
      return true
    } catch (error: any) {
      console.error("Erreur de connexion:", error)
      return false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth", {
        method: "DELETE",
      })

      setUser(null)
      setIsAuthenticated(false)
      router.push("/login")
    } catch (error) {
      console.error("Erreur de déconnexion:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

