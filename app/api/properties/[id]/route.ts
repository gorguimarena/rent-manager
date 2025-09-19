import { NextResponse } from "next/server"
import { jsonServer } from "@/lib/json-server"

// Récupérer une propriété par ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    
    // Récupérer la propriété
    const property = await jsonServer.get(`properties/${id}`)

    if (!property) {
      return NextResponse.json({ error: 'Propriété non trouvée' }, { status: 404 })
    }

    // Récupérer les unités de cette propriété
    const units = await jsonServer.get('units', { property_id: id })
    
    // Pour chaque unité, récupérer le locataire s'il y en a un
    for (const unit of units) {
      if (unit.status === 'occupied') {
        try {
          const tenants = await jsonServer.get('tenants', { unit_id: unit.id })
          if (tenants.length > 0) {
            unit.tenant_name = tenants[0].name
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération du locataire pour l'unité ${unit.id}:`, error)
        }
      }
    }
    
    property.units = units

    return NextResponse.json(property)
  } catch (error: any) {
    console.error('Erreur lors de la récupération de la propriété:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Mettre à jour une propriété
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { name, address } = await request.json()

    if (!name || !address) {
      return NextResponse.json({ error: 'Nom et adresse requis' }, { status: 400 })
    }

    const updatedProperty = await jsonServer.put(`properties/${id}`, {
      name,
      address,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json(updatedProperty)
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la propriété:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Supprimer une propriété
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    
    // Vérifier si la propriété existe
    try {
      await jsonServer.get(`properties/${id}`)
    } catch (error) {
      return NextResponse.json({ error: 'Propriété non trouvée' }, { status: 404 })
    }

    // Supprimer toutes les unités associées
    const units = await jsonServer.get('units', { property_id: id })
    for (const unit of units) {
      await jsonServer.delete(`units/${unit.id}`)
    }

    // Supprimer la propriété
    await jsonServer.delete(`properties/${id}`)

    return NextResponse.json({ message: 'Propriété supprimée avec succès' })
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la propriété:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}