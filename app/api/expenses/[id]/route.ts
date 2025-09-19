import { NextResponse } from "next/server"
import { jsonServer } from "@/lib/json-server"

// Récupérer une dépense spécifique
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Récupérer la dépense
    const expense = await jsonServer.get(`expenses/${id}`)

    if (!expense) {
      return NextResponse.json({ error: "Dépense non trouvée" }, { status: 404 })
    }

    // Récupérer le nom de la propriété
    try {
      const property = await jsonServer.get(`properties/${expense.property_id}`)
      expense.property_name = property?.name || 'Propriété inconnue'
    } catch (error) {
      expense.property_name = 'Propriété inconnue'
    }

    return NextResponse.json(expense)
  } catch (error: any) {
    console.error("Erreur lors de la récupération de la dépense:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Mettre à jour une dépense
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { property_id, amount, date, description, category } = await request.json()

    if (!property_id || !amount || !date || !description || !category) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être remplis" }, { status: 400 })
    }

    // Vérifier si la dépense existe
    try {
      await jsonServer.get(`expenses/${id}`)
    } catch (error) {
      return NextResponse.json({ error: "Dépense non trouvée" }, { status: 404 })
    }

    // Vérifier si la propriété existe
    try {
      await jsonServer.get(`properties/${property_id}`)
    } catch (error) {
      return NextResponse.json({ error: "Propriété non trouvée" }, { status: 404 })
    }

    // Mettre à jour la dépense
    const updatedExpense = await jsonServer.put(`expenses/${id}`, {
      property_id: Number(property_id),
      amount: Number(amount),
      date,
      description,
      category,
      updated_at: new Date().toISOString(),
    })

    // Récupérer le nom de la propriété
    try {
      const property = await jsonServer.get(`properties/${property_id}`)
      updatedExpense.property_name = property.name
    } catch (error) {
      updatedExpense.property_name = 'Propriété inconnue'
    }

    return NextResponse.json(updatedExpense)
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour de la dépense:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Supprimer une dépense
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Vérifier si la dépense existe
    try {
      await jsonServer.get(`expenses/${id}`)
    } catch (error) {
      return NextResponse.json({ error: "Dépense non trouvée" }, { status: 404 })
    }

    // Supprimer la dépense
    await jsonServer.delete(`expenses/${id}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erreur lors de la suppression de la dépense:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}