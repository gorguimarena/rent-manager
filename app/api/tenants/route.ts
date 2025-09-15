import { NextResponse } from "next/server"
import pool from "@/lib/db"
import type { RowDataPacket, OkPacket } from "mysql2"

// Interface pour représenter un locataire
interface Tenant extends RowDataPacket {
  id: number
  name: string
  phone: string
  email: string
  unit_id: number
  deposit_amount: number
  lease_start: string
  lease_end: string
  payment_status: string
}

// Récupérer tous les locataires
export async function GET() {
  try {
    const [tenants] = await pool.query<Tenant[]>(`
      SELECT t.*, u.name as unit_name, u.rent as rent_amount, p.name as property_name
      FROM tenants t
      LEFT JOIN units u ON t.unit_id = u.id
      LEFT JOIN properties p ON u.property_id = p.id
      ORDER BY t.name
    `)

    return NextResponse.json(tenants)
  } catch (error: any) {
    console.error("Erreur lors de la récupération des locataires:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Créer un nouveau locataire
export async function POST(request: Request) {
  try {
    const { name, phone, email, unit_id, deposit_amount, lease_start, lease_end } = await request.json()

    if (!name || !phone || !unit_id || !deposit_amount || !lease_start) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être remplis" }, { status: 400 })
    }

    // Vérifier si l'unité existe et est disponible
    const [units] = await pool.query<RowDataPacket[]>('SELECT * FROM units WHERE id = ? AND status = "vacant"', [
      unit_id,
    ])

    if (!Array.isArray(units) || units.length === 0) {
      return NextResponse.json({ error: "Logement non disponible ou inexistant" }, { status: 400 })
    }

    // Insérer le locataire
    const [result] = await pool.query<OkPacket>(
      "INSERT INTO tenants (name, phone, email, unit_id, deposit_amount, lease_start, lease_end, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, phone, email || null, unit_id, deposit_amount, lease_start, lease_end || null, "up-to-date"],
    )

    // Mettre à jour le statut de l'unité
    await pool.query('UPDATE units SET status = "occupied" WHERE id = ?', [unit_id])

    const insertId = result.insertId

    // Récupérer le locataire avec les informations complètes
    const [newTenants] = await pool.query<Tenant[]>(
      `
      SELECT t.*, u.name as unit_name, u.rent as rent_amount, p.name as property_name
      FROM tenants t
      LEFT JOIN units u ON t.unit_id = u.id
      LEFT JOIN properties p ON u.property_id = p.id
      WHERE t.id = ?
    `,
      [insertId],
    )

    return NextResponse.json(newTenants[0], { status: 201 })
  } catch (error: any) {
    console.error("Erreur lors de la création du locataire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

