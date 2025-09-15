import { NextResponse } from "next/server"
import pool from "@/lib/db"
import type { RowDataPacket, OkPacket } from "mysql2"

// Interface pour représenter un utilisateur
interface User extends RowDataPacket {
  id: number
  username: string
  email: string
  role: string
}

// Endpoint de débogage pour vérifier les utilisateurs
export async function GET() {
  try {
    // Récupérer tous les utilisateurs (sans les mots de passe)
    const [users] = await pool.query<User[]>("SELECT id, username, email, role FROM users")

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

// Endpoint pour créer un utilisateur de test
export async function POST() {
  try {
    // Vérifier si l'utilisateur admin existe déjà
    const [existingUsers] = await pool.query<User[]>("SELECT * FROM users WHERE username = ?", ["admin"])

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json({
        message: "L'utilisateur admin existe déjà",
        user: {
          id: existingUsers[0].id,
          username: existingUsers[0].username,
        },
      })
    }

    // Créer l'utilisateur admin
    const [result] = await pool.query<OkPacket>(
      "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
      ["admin", "admin123", "admin@example.com", "admin"],
    )

    const insertId = result.insertId

    return NextResponse.json(
      {
        message: "Utilisateur admin créé avec succès",
        user: { id: insertId, username: "admin" },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Erreur lors de la création de l'utilisateur:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

