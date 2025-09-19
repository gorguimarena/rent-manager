import { NextResponse } from "next/server"
import { jsonServer } from "@/lib/json-server"

// Récupérer un locataire spécifique
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Récupérer le locataire
    const tenant = await jsonServer.get(`tenants/${id}`)

    if (!tenant) {
      return NextResponse.json({ error: "Locataire non trouvé" }, { status: 404 })
    }

    // Récupérer les informations de l'unité et de la propriété
    try {
      const unit = await jsonServer.get(`units/${tenant.unit_id}`)
      if (unit) {
        tenant.unit_name = unit.name
        tenant.rent_amount = unit.rent

        const property = await jsonServer.get(`properties/${unit.property_id}`)
        if (property) {
          tenant.property_name = property.name
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des relations:', error)
    }

    return NextResponse.json(tenant)
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

    // Récupérer le locataire actuel
    const currentTenant = await jsonServer.get(`tenants/${id}`)
    if (!currentTenant) {
      return NextResponse.json({ error: "Locataire non trouvé" }, { status: 404 })
    }

    const currentUnitId = currentTenant.unit_id

    // Si l'unité a changé, vérifier si la nouvelle unité est disponible
    if (Number(unit_id) !== currentUnitId) {
      try {
        const newUnit = await jsonServer.get(`units/${unit_id}`)
        if (!newUnit || (newUnit.status !== 'vacant' && Number(unit_id) !== currentUnitId)) {
          return NextResponse.json({ error: "Logement non disponible ou inexistant" }, { status: 400 })
        }

        // Libérer l'ancienne unité
        await jsonServer.patch(`units/${currentUnitId}`, { status: "vacant" })

        // Occuper la nouvelle unité
        await jsonServer.patch(`units/${unit_id}`, { status: "occupied" })
      } catch (error) {
        return NextResponse.json({ error: "Logement non disponible ou inexistant" }, { status: 400 })
      }
    }

    // Mettre à jour le locataire
    const updatedTenant = await jsonServer.put(`tenants/${id}`, {
      name,
      phone,
      email: email || null,
      unit_id: Number(unit_id),
      deposit_amount: Number(deposit_amount),
      lease_start,
      lease_end: lease_end || null,
      payment_status,
      updated_at: new Date().toISOString(),
    })

    // Récupérer les informations complètes
    try {
      const unit = await jsonServer.get(`units/${unit_id}`)
      const property = await jsonServer.get(`properties/${unit.property_id}`)
      
      updatedTenant.unit_name = unit.name
      updatedTenant.rent_amount = unit.rent
      updatedTenant.property_name = property.name
    } catch (error) {
      console.error('Erreur lors de la récupération des relations:', error)
    }

    return NextResponse.json(updatedTenant)
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du locataire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Supprimer un locataire
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Récupérer le locataire
    const tenant = await jsonServer.get(`tenants/${id}`)
    if (!tenant) {
      return NextResponse.json({ error: "Locataire non trouvé" }, { status: 404 })
    }

    const unitId = tenant.unit_id

    // Supprimer le locataire
    await jsonServer.delete(`tenants/${id}`)

    // Libérer l'unité
    await jsonServer.patch(`units/${unitId}`, { status: "vacant" })

    return NextResponse.json({ message: "Locataire supprimé avec succès" })
  } catch (error: any) {
    console.error("Erreur lors de la suppression du locataire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}