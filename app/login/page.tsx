"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("admin123")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const router = useRouter()
  const { login, isAuthenticated } = useAuth()

  // Rediriger si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      setError("Veuillez remplir tous les champs")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("Tentative de connexion avec:", { username, password })
      const success = await login(username, password)

      if (success) {
        console.log("Connexion réussie, redirection...")
        router.push("/")
      } else {
        console.log("Échec de la connexion")
        setError("Identifiants invalides")
      }
    } catch (err: any) {
      console.error("Erreur lors de la connexion:", err)
      setError(err.message || "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  const checkUsers = async () => {
    try {
      const response = await fetch("/api/debug/users")
      const data = await response.json()
      setDebugInfo(data)
    } catch (err: any) {
      setDebugInfo({ error: err.message })
    }
  }

  const createTestUser = async () => {
    try {
      const response = await fetch("/api/debug/users", {
        method: "POST",
      })
      const data = await response.json()
      setDebugInfo(data)
    } catch (err: any) {
      setDebugInfo({ error: err.message })
    }
  }

  const testDirectLogin = async () => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: "admin", password: "admin123" }),
      })

      const data = await response.json()
      setDebugInfo({
        status: response.status,
        data,
      })

      if (response.ok) {
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    } catch (err: any) {
      setDebugInfo({ error: err.message })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Gestion de Loyers</CardTitle>
          <CardDescription>Connectez-vous pour accéder à votre compte</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connexion en cours..." : "Se connecter"}
            </Button>

            <div className="flex space-x-2 w-full">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={checkUsers}>
                Vérifier les utilisateurs
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={createTestUser}>
                Créer utilisateur test
              </Button>
            </div>

            <Button type="button" variant="secondary" className="w-full" onClick={testDirectLogin}>
              Connexion directe (contournement)
            </Button>

            {debugInfo && (
              <div className="w-full mt-4 p-2 bg-muted rounded-md text-xs overflow-auto max-h-40">
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

