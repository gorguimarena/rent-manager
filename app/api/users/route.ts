import { NextResponse } from "next/server"
import { jsonServer } from "@/lib/json-server"

// Récupérer tous les utilisateurs
export async function GET() {
  try {
    const users = await jsonServer.get('users')

    // Retourner les utilisateurs sans les mots de passe
    const usersWithoutPasswords = users.map((user: any) => {
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })

    return NextResponse.json(usersWithoutPasswords)
  } catch (error: any) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Créer un nouvel utilisateur
export async function POST(request: Request) {
  try {
    const { username, password, email, role } = await request.json()

    if (!username || !password || !email || !role) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUsers = await jsonServer.get('users', { username })

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Ce nom d'utilisateur existe déjà" }, { status: 400 })
    }

    // Créer l'utilisateur
    const newUser = {
      username,
      password,
      email,
      role,
      created_at: new Date().toISOString(),
    }

    const result = await jsonServer.post('users', newUser)

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = result

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error: any) {
    console.error("Erreur lors de la création de l'utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}