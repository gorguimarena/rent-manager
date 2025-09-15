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

// Récupérer un locataire spécifique
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const [tenants] = await pool.query<Tenant[]>(
      `
      SELECT t.*, u.name as unit_name, u.rent as rent_amount, p.name as property_name
      FROM tenants t
      LEFT JOIN units u ON t.unit_id = u.id
      LEFT JOIN properties p ON u.property_id = p.id
      WHERE t.id = ?
    `,
      [id],
    )

    if (!Array.isArray(tenants) || tenants.length === 0) {
      return NextResponse.json({ error: "Locataire non trouvé" }, { status: 404 })
    }

    return NextResponse.json(tenants[0])
  } catch (error: any) {
    console.error("Erreur lors de la récupération du locataire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Mettre à jour un locataire
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { name, phone, email, unit_id, deposit_amount, lease_start, lease_end, payment_status } = await request.json()

    if (!name || !phone || !unit_id || !deposit_amount || !lease_start || !payment_status) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être remplis" }, { status: 400 })
    }

    // Récupérer l'unité actuelle du locataire
    const [currentTenants] = await pool.query<Tenant[]>("SELECT * FROM tenants WHERE id = ?", [id])

    if (!Array.isArray(currentTenants) || currentTenants.length === 0) {
      return NextResponse.json({ error: "Locataire non trouvé" }, { status: 404 })
    }

    const currentUnitId = currentTenants[0].unit_id

    // Si l'unité a changé, vérifier si la nouvelle unité est disponible
    if (unit_id !== currentUnitId) {
      const [units] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM units WHERE id = ? AND (status = "vacant" OR id = ?)',
        [unit_id, currentUnitId],
      )

      if (!Array.isArray(units) || units.length === 0) {
        return NextResponse.json({ error: "Logement non disponible ou inexistant" }, { status: 400 })
      }

      // Libérer l'ancienne unité
      await pool.query('UPDATE units SET status = "vacant" WHERE id = ?', [currentUnitId])

      // Occuper la nouvelle unité
      await pool.query('UPDATE units SET status = "occupied" WHERE id = ?', [unit_id])
    }

    // Mettre à jour le locataire
    const [result] = await pool.query<OkPacket>(
      "UPDATE tenants SET name = ?, phone = ?, email = ?, unit_id = ?, deposit_amount = ?, lease_start = ?, lease_end = ?, payment_status = ? WHERE id = ?",
      [name, phone, email || null, unit_id, deposit_amount, lease_start, lease_end || null, payment_status, id],
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Locataire non trouvé" }, { status: 404 })
    }

    // Récupérer le locataire mis à jour
    const [updatedTenants] = await pool.query<Tenant[]>(
      `
      SELECT t.*, u.name as unit_name, u.rent as rent_amount, p.name as property_name
      FROM tenants t
      LEFT JOIN units u ON t.unit_id = u.id
      LEFT JOIN properties p ON u.property_id = p.id
      WHERE t.id = ?
    `,
      [id],
    )

    return NextResponse.json(updatedTenants[0])
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du locataire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Supprimer un locataire
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Récupérer l'unité du locataire
    const [tenants] = await pool.query<Tenant[]>("SELECT * FROM tenants WHERE id = ?", [id])

    if (!Array.isArray(tenants) || tenants.length === 0) {
      return NextResponse.json({ error: "Locataire non trouvé" }, { status: 404 })
    }

    const unitId = tenants[0].unit_id

    // Supprimer le locataire
    await pool.query("DELETE FROM tenants WHERE id = ?", [id])

    // Libérer l'unité
    await pool.query('UPDATE units SET status = "vacant" WHERE id = ?', [unitId])

    return NextResponse.json({ message: "Locataire supprimé avec succès" })
  } catch (error: any) {
    console.error("Erreur lors de la suppression du locataire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

