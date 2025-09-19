import { NextResponse } from "next/server"
import { jsonServer } from "@/lib/json-server"

// Récupérer un utilisateur spécifique
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const user = await jsonServer.get(`users/${id}`)

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Retourner l'utilisateur sans le mot de passe
    const { password, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
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
    try {
      await jsonServer.get(`users/${id}`)
    } catch (error) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Vérifier si le nom d'utilisateur est déjà pris par un autre utilisateur
    const duplicateUsers = await jsonServer.get('users', { username })
    const duplicateUser = duplicateUsers.find((user: any) => user.id !== Number(id))

    if (duplicateUser) {
      return NextResponse.json({ error: "Ce nom d'utilisateur est déjà pris" }, { status: 400 })
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      username,
      email,
      role,
      updated_at: new Date().toISOString(),
    }

    // Ajouter le mot de passe seulement s'il est fourni
    if (password) {
      updateData.password = password
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await jsonServer.patch(`users/${id}`, updateData)

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json(userWithoutPassword)
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
    const user = await jsonServer.get(`users/${id}`)
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Vérifier si c'est le dernier administrateur
    if (user.role === "admin") {
      const allUsers = await jsonServer.get('users')
      const adminCount = allUsers.filter((u: any) => u.role === "admin").length

      if (adminCount <= 1) {
        return NextResponse.json({ error: "Impossible de supprimer le dernier administrateur" }, { status: 400 })
      }
    }

    // Supprimer l'utilisateur
    await jsonServer.delete(`users/${id}`)

    return NextResponse.json({ message: "Utilisateur supprimé avec succès" })
  } catch (error: any) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}