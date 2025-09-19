import { NextResponse } from "next/server"
import { jsonServer } from "@/lib/json-server"

// Récupérer toutes les propriétés
export async function GET() {
  try {
    // Récupérer les propriétés avec leurs unités
    const properties = await jsonServer.getWithEmbeds('properties', ['units'])

    // Pour chaque propriété, calculer les statistiques et récupérer les locataires
    for (const property of properties) {
      if (property.units) {
        property.unit_count = property.units.length
        property.occupied_count = property.units.filter((unit: any) => unit.status === 'occupied').length

        // Pour chaque unité, récupérer le locataire s'il y en a un
        for (const unit of property.units) {
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
      } else {
        property.units = []
        property.unit_count = 0
        property.occupied_count = 0
      }
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

    const newProperty = {
      name,
      address,
      created_at: new Date().toISOString(),
    }

    const result = await jsonServer.post('properties', newProperty)

    return NextResponse.json(
      {
        ...result,
        units: [],
        unit_count: 0,
        occupied_count: 0,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Erreur lors de la création de la propriété:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}