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

// Récupérer un utilisateur spécifique
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const [users] = await pool.query<User[]>("SELECT id, username, email, role, created_at FROM users WHERE id = ?", [
      id,
    ])

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    return NextResponse.json(users[0])
  } catch (error: any) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Mettre à jour un utilisateur
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { username, password, email, role } = await request.json()

    if (!username || !email || !role) {
      return NextResponse.json({ error: "Nom d'utilisateur, email et rôle sont requis" }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe
    const [existingUsers] = await pool.query<User[]>("SELECT * FROM users WHERE id = ?", [id])

    if (!Array.isArray(existingUsers) || existingUsers.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Vérifier si le nom d'utilisateur est déjà pris par un autre utilisateur
    const [duplicateUsers] = await pool.query<User[]>("SELECT * FROM users WHERE username = ? AND id != ?", [
      username,
      id,
    ])

    if (Array.isArray(duplicateUsers) && duplicateUsers.length > 0) {
      return NextResponse.json({ error: "Ce nom d'utilisateur est déjà pris" }, { status: 400 })
    }

    // Mettre à jour l'utilisateur
    if (password) {
      // Si un nouveau mot de passe est fourni
      await pool.query<OkPacket>("UPDATE users SET username = ?, password = ?, email = ?, role = ? WHERE id = ?", [
        username,
        password,
        email,
        role,
        id,
      ])
    } else {
      // Si aucun nouveau mot de passe n'est fourni
      await pool.query<OkPacket>("UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?", [
        username,
        email,
        role,
        id,
      ])
    }

    return NextResponse.json({
      id: Number(id),
      username,
      email,
      role,
    })
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Supprimer un utilisateur
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Vérifier si l'utilisateur existe
    const [users] = await pool.query<User[]>("SELECT * FROM users WHERE id = ?", [id])

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Vérifier si c'est le dernier administrateur
    if (users[0].role === "admin") {
      const [adminCount] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users WHERE role = "admin"')

      if (adminCount[0].count <= 1) {
        return NextResponse.json({ error: "Impossible de supprimer le dernier administrateur" }, { status: 400 })
      }
    }

    // Supprimer l'utilisateur
    await pool.query("DELETE FROM users WHERE id = ?", [id])

    return NextResponse.json({ message: "Utilisateur supprimé avec succès" })
  } catch (error: any) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

