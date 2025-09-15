import { NextResponse } from "next/server"
import pool from "@/lib/db"
import type { RowDataPacket, OkPacket } from "mysql2"

// Interface pour représenter un paiement
interface Payment extends RowDataPacket {
  id: number
  tenant_id: number
  amount: number
  date: string
  type: string
  status: string
  period: string
}

// Récupérer un paiement spécifique
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const [payments] = await pool.query<Payment[]>(
      `
      SELECT p.*, t.name as tenant_name, u.name as unit_name, pr.name as property_name
      FROM payments p
      LEFT JOIN tenants t ON p.tenant_id = t.id
      LEFT JOIN units u ON t.unit_id = u.id
      LEFT JOIN properties pr ON u.property_id = pr.id
      WHERE p.id = ?
    `,
      [id],
    )

    if (!Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ error: "Paiement non trouvé" }, { status: 404 })
    }

    return NextResponse.json(payments[0])
  } catch (error: any) {
    console.error("Erreur lors de la récupération du paiement:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Mettre à jour un paiement
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { amount, date, type, status, period } = await request.json()

    if (!amount || !type || !status || !period) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être remplis" }, { status: 400 })
    }

    // Récupérer le paiement actuel
    const [payments] = await pool.query<Payment[]>("SELECT * FROM payments WHERE id = ?", [id])

    if (!Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ error: "Paiement non trouvé" }, { status: 404 })
    }

    const tenant_id = payments[0].tenant_id

    // Mettre à jour le paiement
    const [result] = await pool.query<OkPacket>(
      "UPDATE payments SET amount = ?, date = ?, type = ?, status = ?, period = ? WHERE id = ?",
      [amount, date || null, type, status, period, id],
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Paiement non trouvé" }, { status: 404 })
    }

    // Mettre à jour le statut du locataire si nécessaire
    if (status === "paid") {
      await pool.query('UPDATE tenants SET payment_status = "up-to-date" WHERE id = ?', [tenant_id])
    } else if (status === "unpaid") {
      await pool.query('UPDATE tenants SET payment_status = "late" WHERE id = ?', [tenant_id])
    }

    // Récupérer le paiement mis à jour
    const [updatedPayments] = await pool.query<Payment[]>(
      `
      SELECT p.*, t.name as tenant_name, u.name as unit_name, pr.name as property_name
      FROM payments p
      LEFT JOIN tenants t ON p.tenant_id = t.id
      LEFT JOIN units u ON t.unit_id = u.id
      LEFT JOIN properties pr ON u.property_id = pr.id
      WHERE p.id = ?
    `,
      [id],
    )

    return NextResponse.json(updatedPayments[0])
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du paiement:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Supprimer un paiement
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Récupérer le paiement
    const [payments] = await pool.query<Payment[]>("SELECT * FROM payments WHERE id = ?", [id])

    if (!Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ error: "Paiement non trouvé" }, { status: 404 })
    }

    // Supprimer le paiement
    await pool.query("DELETE FROM payments WHERE id = ?", [id])

    return NextResponse.json({ message: "Paiement supprimé avec succès" })
  } catch (error: any) {
    console.error("Erreur lors de la suppression du paiement:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

