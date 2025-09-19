import { NextResponse } from "next/server"
import { jsonServer } from "@/lib/json-server"

// Récupérer toutes les unités
export async function GET() {
  try {
    // Récupérer toutes les unités
    const units = await jsonServer.get('units')

    // Pour chaque unité, récupérer les informations de la propriété et du locataire
    for (const unit of units) {
      try {
        // Récupérer la propriété
        const property = await jsonServer.get(`properties/${unit.property_id}`)
        unit.property_name = property?.name || 'Propriété inconnue'

        // Récupérer le locataire s'il y en a un
        if (unit.status === 'occupied') {
          const tenants = await jsonServer.get('tenants', { unit_id: unit.id })
          if (tenants.length > 0) {
            unit.tenant_name = tenants[0].name
          }
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération des relations pour l'unité ${unit.id}:`, error)
        unit.property_name = 'Propriété inconnue'
      }
    }

    return NextResponse.json(units)
  } catch (error: any) {
    console.error('Erreur lors de la récupération des unités:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Créer une nouvelle unité
export async function POST(request: Request) {
  try {
    const { property_id, name, type, size, rent } = await request.json()

    if (!property_id || !name || !type || !size || !rent) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
    }

    // Vérifier que la propriété existe
    try {
      await jsonServer.get(`properties/${property_id}`)
    } catch (error) {
      return NextResponse.json({ error: 'Propriété non trouvée' }, { status: 404 })
    }

    const newUnit = {
      property_id: Number(property_id),
      name,
      type,
      size: Number(size),
      rent: Number(rent),
      status: 'vacant',
      created_at: new Date().toISOString(),
    }

    const result = await jsonServer.post('units', newUnit)

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'unité:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}