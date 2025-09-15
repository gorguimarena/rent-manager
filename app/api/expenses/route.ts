import { NextResponse } from "next/server"
import pool from "@/lib/db"
import type { RowDataPacket, OkPacket } from "mysql2"

// Interface pour représenter une dépense
interface Expense extends RowDataPacket {
  id: number
  property_id: number
  amount: number
  date: string
  description: string
  category: string
  receipt_url?: string
  created_at: string
  updated_at: string
}

// Récupérer toutes les dépenses
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const property_id = searchParams.get("property_id")
    const category = searchParams.get("category")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    let query = `
      SELECT e.*, p.name as property_name
      FROM expenses e
      LEFT JOIN properties p ON e.property_id = p.id
      WHERE 1=1
    `

    const params: any[] = []

    if (property_id) {
      query += " AND e.property_id = ?"
      params.push(property_id)
    }

    if (category) {
      query += " AND e.category = ?"
      params.push(category)
    }

    if (startDate) {
      query += " AND e.date >= ?"
      params.push(startDate)
    }

    if (endDate) {
      query += " AND e.date <= ?"
      params.push(endDate)
    }

    query += " ORDER BY e.date DESC, e.id DESC"

    const [expenses] = await pool.query<Expense[]>(query, params)

    return NextResponse.json(expenses)
  } catch (error: any) {
    console.error("Erreur lors de la récupération des dépenses:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Créer une nouvelle dépense
export async function POST(request: Request) {
  try {
    // Pour une application réelle, vous devriez utiliser formidable ou multer pour gérer les fichiers
    // Ici, nous simulons simplement l'ajout d'une dépense sans gestion de fichier
    const { property_id, amount, date, description, category } = await request.json()

    if (!property_id || !amount || !date || !description || !category) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être remplis" }, { status: 400 })
    }

    // Vérifier si la propriété existe
    const [properties] = await pool.query<RowDataPacket[]>("SELECT * FROM properties WHERE id = ?", [property_id])

    if (!Array.isArray(properties) || properties.length === 0) {
      return NextResponse.json({ error: "Propriété non trouvée" }, { status: 404 })
    }

    // Insérer la dépense
    const [result] = await pool.query<OkPacket>(
      "INSERT INTO expenses (property_id, amount, date, description, category) VALUES (?, ?, ?, ?, ?)",
      [property_id, amount, date, description, category],
    )

    const insertId = result.insertId

    // Récupérer la dépense avec les informations complètes
    const [newExpenses] = await pool.query<Expense[]>(
      `
      SELECT e.*, p.name as property_name
      FROM expenses e
      LEFT JOIN properties p ON e.property_id = p.id
      WHERE e.id = ?
    `,
      [insertId],
    )

    return NextResponse.json(newExpenses[0], { status: 201 })
  } catch (error: any) {
    console.error("Erreur lors de la création de la dépense:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

