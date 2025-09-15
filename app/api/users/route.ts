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

// Récupérer tous les utilisateurs
export async function GET() {
  try {
    const [users] = await pool.query<User[]>("SELECT id, username, email, role, created_at FROM users ORDER BY id")

    return NextResponse.json(users)
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
    const [existingUsers] = await pool.query<User[]>("SELECT * FROM users WHERE username = ?", [username])

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json({ error: "Ce nom d'utilisateur existe déjà" }, { status: 400 })
    }

    // Insérer l'utilisateur
    const [result] = await pool.query<OkPacket>(
      "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
      [username, password, email, role],
    )

    const insertId = result.insertId

    return NextResponse.json(
      {
        id: insertId,
        username,
        email,
        role,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Erreur lors de la création de l'utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

