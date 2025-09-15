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

// Récupérer tous les paiements
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period")
    const status = searchParams.get("status")
    const tenant_id = searchParams.get("tenant_id")

    let query = `
      SELECT p.*, t.name as tenant_name, u.name as unit_name, pr.name as property_name
      FROM payments p
      LEFT JOIN tenants t ON p.tenant_id = t.id
      LEFT JOIN units u ON t.unit_id = u.id
      LEFT JOIN properties pr ON u.property_id = pr.id
      WHERE 1=1
    `

    const params: any[] = []

    if (period) {
      query += " AND p.period = ?"
      params.push(period)
    }

    if (status) {
      query += " AND p.status = ?"
      params.push(status)
    }

    if (tenant_id) {
      query += " AND p.tenant_id = ?"
      params.push(tenant_id)
    }

    query += " ORDER BY p.date DESC, p.id DESC"

    const [payments] = await pool.query<Payment[]>(query, params)

    return NextResponse.json(payments)
  } catch (error: any) {
    console.error("Erreur lors de la récupération des paiements:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Créer un nouveau paiement
export async function POST(request: Request) {
  try {
    const { tenant_id, amount, date, type, period } = await request.json()

    if (!tenant_id || !amount || !date || !type || !period) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être remplis" }, { status: 400 })
    }

    // Vérifier si le locataire existe
    const [tenants] = await pool.query<RowDataPacket[]>("SELECT * FROM tenants WHERE id = ?", [tenant_id])

    if (!Array.isArray(tenants) || tenants.length === 0) {
      return NextResponse.json({ error: "Locataire non trouvé" }, { status: 404 })
    }

    // Vérifier si un paiement existe déjà pour cette période et ce locataire
    const [existingPayments] = await pool.query<Payment[]>(
      "SELECT * FROM payments WHERE tenant_id = ? AND period = ? AND type = ?",
      [tenant_id, period, type],
    )

    if (Array.isArray(existingPayments) && existingPayments.length > 0) {
      // Mettre à jour le paiement existant
      await pool.query('UPDATE payments SET amount = ?, date = ?, status = "paid" WHERE id = ?', [
        amount,
        date,
        existingPayments[0].id,
      ])

      // Mettre à jour le statut du locataire
      await pool.query('UPDATE tenants SET payment_status = "up-to-date" WHERE id = ?', [tenant_id])

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
        [existingPayments[0].id],
      )

      return NextResponse.json(updatedPayments[0])
    } else {
      // Insérer un nouveau paiement
      const [result] = await pool.query<OkPacket>(
        "INSERT INTO payments (tenant_id, amount, date, type, status, period) VALUES (?, ?, ?, ?, ?, ?)",
        [tenant_id, amount, date, type, "paid", period],
      )

      // Mettre à jour le statut du locataire
      await pool.query('UPDATE tenants SET payment_status = "up-to-date" WHERE id = ?', [tenant_id])

      const insertId = result.insertId

      // Récupérer le paiement avec les informations complètes
      const [newPayments] = await pool.query<Payment[]>(
        `
        SELECT p.*, t.name as tenant_name, u.name as unit_name, pr.name as property_name
        FROM payments p
        LEFT JOIN tenants t ON p.tenant_id = t.id
        LEFT JOIN units u ON t.unit_id = u.id
        LEFT JOIN properties pr ON u.property_id = pr.id
        WHERE p.id = ?
      `,
        [insertId],
      )

      return NextResponse.json(newPayments[0], { status: 201 })
    }
  } catch (error: any) {
    console.error("Erreur lors de la création du paiement:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Générer les paiements pour un mois
export async function PUT(request: Request) {
  try {
    const { period } = await request.json()

    if (!period) {
      return NextResponse.json({ error: "La période est requise" }, { status: 400 })
    }

    // Récupérer tous les locataires actifs
    const [tenants] = await pool.query<RowDataPacket[]>(`
      SELECT t.*, u.rent as rent_amount
      FROM tenants t
      JOIN units u ON t.unit_id = u.id
      WHERE u.status = 'occupied'
    `)

    if (!Array.isArray(tenants) || tenants.length === 0) {
      return NextResponse.json({ message: "Aucun locataire actif trouvé" }, { status: 200 })
    }

    const results = []

    // Pour chaque locataire, créer un paiement en attente
    for (const tenant of tenants) {
      // Vérifier si un paiement existe déjà pour cette période et ce locataire
      const [existingPayments] = await pool.query<Payment[]>(
        'SELECT * FROM payments WHERE tenant_id = ? AND period = ? AND type = "rent"',
        [tenant.id, period],
      )

      if (Array.isArray(existingPayments) && existingPayments.length > 0) {
        // Le paiement existe déjà, ne rien faire
        results.push({
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          status: "exists",
          payment_id: existingPayments[0].id,
        })
      } else {
        // Créer un nouveau paiement en attente
        const [result] = await pool.query<OkPacket>(
          "INSERT INTO payments (tenant_id, amount, date, type, status, period) VALUES (?, ?, NULL, ?, ?, ?)",
          [tenant.id, tenant.rent_amount, "rent", "unpaid", period],
        )

        // Mettre à jour le statut du locataire
        await pool.query('UPDATE tenants SET payment_status = "late" WHERE id = ?', [tenant.id])

        results.push({
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          status: "created",
          payment_id: result.insertId,
        })
      }
    }

    return NextResponse.json({
      message: `Paiements générés pour la période ${period}`,
      results,
    })
  } catch (error: any) {
    console.error("Erreur lors de la génération des paiements:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

