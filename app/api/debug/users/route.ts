import { NextResponse } from "next/server"
import { jsonServer } from "@/lib/json-server"

// Endpoint de débogage pour vérifier les utilisateurs
export async function GET() {
  try {
    // Récupérer tous les utilisateurs (sans les mots de passe)
    const users = await jsonServer.get('users')
    
    const usersWithoutPasswords = users.map((user: any) => {
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })

    return NextResponse.json({ users: usersWithoutPasswords })
  } catch (error: any) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

// Endpoint pour créer un utilisateur de test
export async function POST() {
  try {
    // Vérifier si l'utilisateur admin existe déjà
    const existingUsers = await jsonServer.get('users', { username: 'admin' })

    if (existingUsers.length > 0) {
      return NextResponse.json({
        message: "L'utilisateur admin existe déjà",
        user: {
          id: existingUsers[0].id,
          username: existingUsers[0].username,
        },
      })
    }

    // Créer l'utilisateur admin
    const newUser = {
      username: "admin",
      password: "admin123",
      email: "admin@example.com",
      role: "admin",
      created_at: new Date().toISOString(),
    }

    const result = await jsonServer.post('users', newUser)

    return NextResponse.json(
      {
        message: "Utilisateur admin créé avec succès",
        user: { id: result.id, username: "admin" },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Erreur lors de la création de l'utilisateur:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}