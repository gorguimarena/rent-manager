import { NextResponse } from "next/server"
import { jsonServer } from "@/lib/json-server"

// Récupérer tous les locataires
export async function GET() {
  try {
    const tenants = await jsonServer.get('tenants')

    // Pour chaque locataire, récupérer les informations de l'unité et de la propriété
    for (const tenant of tenants) {
      try {
        // Récupérer l'unité
        const unit = await jsonServer.get(`units/${tenant.unit_id}`)
        if (unit) {
          tenant.unit_name = unit.name
          tenant.rent_amount = unit.rent

          // Récupérer la propriété
          const property = await jsonServer.get(`properties/${unit.property_id}`)
          if (property) {
            tenant.property_name = property.name
          }
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération des relations pour le locataire ${tenant.id}:`, error)
        tenant.unit_name = 'Unité inconnue'
        tenant.property_name = 'Propriété inconnue'
        tenant.rent_amount = 0
      }
    }

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
    try {
      const unit = await jsonServer.get(`units/${unit_id}`)
      if (!unit || unit.status !== 'vacant') {
        return NextResponse.json({ error: "Logement non disponible ou inexistant" }, { status: 400 })
      }
    } catch (error) {
      return NextResponse.json({ error: "Logement non disponible ou inexistant" }, { status: 400 })
    }

    // Créer le locataire
    const newTenant = {
      name,
      phone,
      email: email || null,
      unit_id: Number(unit_id),
      deposit_amount: Number(deposit_amount),
      lease_start,
      lease_end: lease_end || null,
      payment_status: "up-to-date",
      created_at: new Date().toISOString(),
    }

    const result = await jsonServer.post('tenants', newTenant)

    // Mettre à jour le statut de l'unité
    await jsonServer.patch(`units/${unit_id}`, { status: "occupied" })

    // Récupérer les informations complètes du locataire
    const unit = await jsonServer.get(`units/${unit_id}`)
    const property = await jsonServer.get(`properties/${unit.property_id}`)

    const tenantWithDetails = {
      ...result,
      unit_name: unit.name,
      rent_amount: unit.rent,
      property_name: property.name,
    }

    return NextResponse.json(tenantWithDetails, { status: 201 })
  } catch (error: any) {
    console.error("Erreur lors de la création du locataire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}