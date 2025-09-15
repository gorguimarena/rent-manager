import { NextResponse } from "next/server"
import pool from "@/lib/db"
import type { RowDataPacket } from "mysql2"

// Récupérer une dépense spécifique
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const [expenses] = await pool.query<RowDataPacket[]>(
      `
      SELECT e.*, p.name as property_name
      FROM expenses e
      LEFT JOIN properties p ON e.property_id = p.id
      WHERE e.id = ?
    `,
      [id],
    )

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return NextResponse.json({ error: "Dépense non trouvée" }, { status: 404 })
    }

    return NextResponse.json(expenses[0])
  } catch (error: any) {
    console.error("Erreur lors de la récupération de la dépense:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Mettre à jour une dépense
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { property_id, amount, date, description, category } = await request.json()

    if (!property_id || !amount || !date || !description || !category) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être remplis" }, { status: 400 })
    }

    // Vérifier si la dépense existe
    const [expenses] = await pool.query<RowDataPacket[]>("SELECT * FROM expenses WHERE id = ?", [id])

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return NextResponse.json({ error: "Dépense non trouvée" }, { status: 404 })
    }

    // Vérifier si la propriété existe
    const [properties] = await pool.query<RowDataPacket[]>("SELECT * FROM properties WHERE id = ?", [property_id])

    if (!Array.isArray(properties) || properties.length === 0) {
      return NextResponse.json({ error: "Propriété non trouvée" }, { status: 404 })
    }

    // Mettre à jour la dépense
    await pool.query(
      "UPDATE expenses SET property_id = ?, amount = ?, date = ?, description = ?, category = ?, updated_at = NOW() WHERE id = ?",
      [property_id, amount, date, description, category, id],
    )

    // Récupérer la dépense mise à jour
    const [updatedExpenses] = await pool.query<RowDataPacket[]>(
      `
      SELECT e.*, p.name as property_name
      FROM expenses e
      LEFT JOIN properties p ON e.property_id = p.id
      WHERE e.id = ?
    `,
      [id],
    )

    return NextResponse.json(updatedExpenses[0])
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour de la dépense:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Supprimer une dépense
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Vérifier si la dépense existe
    const [expenses] = await pool.query<RowDataPacket[]>("SELECT * FROM expenses WHERE id = ?", [id])

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return NextResponse.json({ error: "Dépense non trouvée" }, { status: 404 })
    }

    // Supprimer la dépense
    await pool.query("DELETE FROM expenses WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erreur lors de la suppression de la dépense:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

