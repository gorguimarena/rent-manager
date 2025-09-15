import { NextResponse } from "next/server"
import pool from "@/lib/db"

// Récupérer toutes les propriétés
export async function GET() {
  try {
    const [properties] = await pool.query(`
      SELECT p.*, 
        COUNT(u.id) as unit_count,
        SUM(CASE WHEN u.status = 'occupied' THEN 1 ELSE 0 END) as occupied_count
      FROM properties p
      LEFT JOIN units u ON p.id = u.property_id
      GROUP BY p.id
    `)

    // Pour chaque propriété, récupérer ses unités
    for (const property of properties as any[]) {
      const [units] = await pool.query(
        `
        SELECT u.*, t.name as tenant_name
        FROM units u
        LEFT JOIN tenants t ON u.id = t.unit_id
        WHERE u.property_id = ?
      `,
        [property.id],
      )

      property.units = units
    }

    return NextResponse.json(properties)
  } catch (error: any) {
    console.error("Erreur lors de la récupération des propriétés:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Créer une nouvelle propriété
export async function POST(request: Request) {
  try {
    const { name, address } = await request.json()

    if (!name || !address) {
      return NextResponse.json({ error: "Nom et adresse requis" }, { status: 400 })
    }

    const [result] = await pool.query("INSERT INTO properties (name, address) VALUES (?, ?)", [name, address])

    const insertId = (result as any).insertId

    return NextResponse.json(
      {
        id: insertId,
        name,
        address,
        units: [],
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Erreur lors de la création de la propriété:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

