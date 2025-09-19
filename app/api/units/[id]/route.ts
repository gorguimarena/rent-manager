import { NextResponse } from "next/server"
import { jsonServer } from "@/lib/json-server"

// Récupérer une unité par ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    
    // Récupérer l'unité
    const unit = await jsonServer.get(`units/${id}`)

    if (!unit) {
      return NextResponse.json({ error: 'Unité non trouvée' }, { status: 404 })
    }

    // Récupérer les informations de la propriété
    try {
      const property = await jsonServer.get(`properties/${unit.property_id}`)
      unit.property_name = property?.name || 'Propriété inconnue'
      unit.property_address = property?.address || 'Adresse inconnue'
    } catch (error) {
      console.error('Erreur lors de la récupération de la propriété:', error)
      unit.property_name = 'Propriété inconnue'
      unit.property_address = 'Adresse inconnue'
    }

    // Récupérer le locataire actuel s'il y en a un
    if (unit.status === 'occupied') {
      try {
        const tenants = await jsonServer.get('tenants', { unit_id: id })
        if (tenants.length > 0) {
          unit.tenant = tenants[0]
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du locataire:', error)
      }
    }

    return NextResponse.json(unit)
  } catch (error: any) {
    console.error('Erreur lors de la récupération de l\'unité:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Mettre à jour une unité
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { name, type, size, rent, status } = await request.json()

    if (!name || !type || !size || !rent || !status) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
    }

    // Vérifier que l'unité existe
    try {
      await jsonServer.get(`units/${id}`)
    } catch (error) {
      return NextResponse.json({ error: 'Unité non trouvée' }, { status: 404 })
    }

    const updatedUnit = await jsonServer.put(`units/${id}`, {
      name,
      type,
      size: Number(size),
      rent: Number(rent),
      status,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json(updatedUnit)
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de l\'unité:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Supprimer une unité
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    
    // Vérifier que l'unité existe
    try {
      await jsonServer.get(`units/${id}`)
    } catch (error) {
      return NextResponse.json({ error: 'Unité non trouvée' }, { status: 404 })
    }

    // Supprimer tous les locataires associés
    const tenants = await jsonServer.get('tenants', { unit_id: id })
    for (const tenant of tenants) {
      await jsonServer.delete(`tenants/${tenant.id}`)
    }

    // Supprimer l'unité
    await jsonServer.delete(`units/${id}`)

    return NextResponse.json({ message: 'Unité supprimée avec succès' })
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'unité:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}